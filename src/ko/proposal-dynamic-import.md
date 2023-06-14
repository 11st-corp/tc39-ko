# import()
이 저장소는 JavaScript에 "유사 함수"의 `import()` 모듈 로딩 구문을 추가하기 위한 제안을 포함하고 있습니다. 현재 이 제안은 [TC39 프로세스](https://tc39.es/process-document/) 4단계에 있습니다. 이전에는 [whatwg/loader#149](https://github.com/whatwg/loader/issues/149)에서 모듈 로딩 커뮤니티와 토의되었습니다.

진행 중인 [사양 초안](https://tc39.es/proposal-dynamic-import/)을 확인하고 [이슈 트래커](https://github.com/tc39/proposal-dynamic-import/issues)에서 토론에 참여할 수 있습니다.

## 제안 동기 및 사용 사례
기존에 모듈을 가져오기 위한 구문 형태는 정적 선언입니다. 모듈 지정자로 문자열 리터럴을 받고, 사전 런타임 "링킹" 프로세스를 통해 지역 스코프에 바인딩을 도입합니다. 이는 90% 이상의 경우 훌륭한 설계이며, 정적 분석, 번들링 도구 및 트리 쉐이킹과 같은 중요한 사용 사례를 지원합니다.

하지만 JavaScript 애플리케이션의 일부를 런타임에 동적으로 로드할 수 있는 기능도 필요합니다. 이는 런타임에서만 알 수 있는 요인(사용자의 언어와 같은 것들), 성능 상의 이유(사용할 가능성이 있는 코드만 로드), 또는 강건함의 이유(중요하지 않은 모듈의 로딩 실패에 대한 대응)로 인해 필요할 수 있습니다. 이러한 동적 코드 로딩은 특히 웹에서 오랜 역사를 가지고 있으며, Node.js에서도 마찬가지입니다(시작 비용을 지연시키기 위해). 기존의 `import` 구문은 이러한 사용 사례를 지원하지 않습니다.

동적 코드 로딩은 여러 모듈을 경쟁시켜서 가장 먼저 성공적으로 로드된 모듈을 선택하는 등 고급 시나리오를 가능하게 합니다.

## 제안된 해결책
이 제안은 `import(specifier)`구문 형식을 추가합니다. 이 구문은 함수와 많은 면에서 비슷하게 작동합니다(아래 참조). 이 구문은 요청한 모듈의 모듈 네임스페이스 객체에 대한 프로미스를 반환합니다. 그것은 모듈의 모든 종속성을 가져오고, 인스턴스화 하고, 평가한 후 생성됩니다.

여기서 `specifier`는 `import` 선언과 동일한 방식으로 해석됩니다(즉, 동일한 문자열은 두 곳 모두에서 동일하게 동작합니다). 그러나 `specifier`는 문자열이지만 문자열 리터럴일 필요는 없으므로 ```import(`./language-packs/${navigator.language}.js`)```와 같은 코드가 작동할 것입니다. 이는 일반적인 `import` 선언으로는 불가능한 작업입니다.


`import()`는 스크립트와 모듈 모두에서 작동하도록 제안되었습니다. 이를 통해 스크립트 코드는 모듈 세계에 쉽게 비동기적으로 진입할 수 있게 되어 모듈 코드를 동작할 수 있게 됩니다.

기존의 JavaScript 모듈 사양과 마찬가지로 모듈을 가져오는 정확한 메커니즘은 호스트 환경(예를 들어 웹 브라우저 또는 Node.js)에 맡겨져 있습니다. 이를 위해 기존의 HostResolveImportedModule을 재사용하고 약간 조정하여 새로운 호스트 환경 구현 추상 연산인 HostPrepareImportedModule을 도입합니다.

(이 두 단계의 호스트 연산 구조는 HostResolveImportedModule이 항상 동기적으로 반환되고, 인수의 [[RequestedModules]] 필드를 사용하여 반환하는 의미를 보존하기 위해 존재합니다. HostPrepareImportedModule은 이 방식으로 [[RequestedModules]] 필드를 동적으로 채우는 메커니즘으로 볼 수 있습니다. 이는 일부 호스트 환경에서 이미 모듈 트리거를 미리 가져오고 평가하여 모듈 평가 중에 발생하는 모든 HostResolveImportedModule 호출에서 요청한 모듈을 찾을 수 있도록 하는 것과 유사합니다.)

## 예제
여기 `import()`가 매우 간단한 단일 페이지 애플리케이션에서 탐색 시 모듈의 레이지 로딩을 가능하게 하는 방법을 볼 수 있습니다.

```html
<!DOCTYPE html>
<nav>
  <a href="books.html" data-entry-module="books">Books</a>
  <a href="movies.html" data-entry-module="movies">Movies</a>
  <a href="video-games.html" data-entry-module="video-games">Video Games</a>
</nav>

<main>Content will load here!</main>

<script>
  const main = document.querySelector("main");
  for (const link of document.querySelectorAll("nav > a")) {
    link.addEventListener("click", e => {
      e.preventDefault();

      import(`./section-modules/${link.dataset.entryModule}.js`)
        .then(module => {
          module.loadPageInto(main);
        })
        .catch(err => {
          main.textContent = err.message;
        });
    });
  }
</script>
```
일반적인 `import` 선언과 비교하여 다음과 같은 차이점을 주목하세요. 
 - `import()`는 모듈뿐만 아니라 스크립트에서도 사용할 수 있습니다.
 - `import()`가 모듈에서 사용되는 경우, 어떤 위치에서든 어떤 레벨에서든 사용될 수 있으며, 호이스팅되지 않습니다.
 - `import()`는 정적인 문자열 리터럴 뿐만 아니라 임의의 문자열을 받아들입니다(여기서는 런타임에서 결정되는 템플릿 문자열이 표시됩니다).
 - 모듈에 `import()`가 포함되어 있다고 해서 모듈을 평가하기 전에 가져와서 평가해야 하는 종속성이 생성되지 않습니다.
 - `import()`는 정적으로 분석할 수 있는 종속성을 생성하지 않습니다. (하지만 구현은 `import("./foo.js")`와 같은 간단한 경우에도 예측으로 가져오기를 수행할 수도 있습니다.)

## 대안으로 고려된 해결책들
위의 사용 사례를 달성할 가능성이 있는 몇 가지 다른 방법들이 있습니다. 여기서는 왜 `import()`가 가장 좋은 가능성이라고 생각하는지 설명하겠습니다.

### 호스트별 메커니즘 사용
특정 호스트 환경(예를 들어 웹 브라우저)에서는 `import()`와 유사한 기능을 제공하기 위해 호스트별 메커니즘을 남용하여 동적으로 모듈을 가져올 수 있습니다. HTML의 `<script type="module">`을 사용하여 다음 코드는 `import()`와 유사한 기능을 제공합니다.

```js
function importModule(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const tempGlobal = "__tempModuleLoadingVariable" + Math.random().toString(32).substring(2);
    script.type = "module";
    script.textContent = `import * as m from "${url}"; window.${tempGlobal} = m;`;

    script.onload = () => {
      resolve(window[tempGlobal]);
      delete window[tempGlobal];
      script.remove();
    };

    script.onerror = () => {
      reject(new Error("Failed to load module script with URL " + url));
      delete window[tempGlobal];
      script.remove();
    };

    document.documentElement.appendChild(script);
  });
}
```
그러나 이것은 몇가지 결함이 있습니다. 임시 전역 변수를 생성하고 `<script>` 요소를 삽입했다가 나중에 제거하는것과 같은 명백한 못생김 이외에도 말이죠.

가장 명백한 문제는 모듈 지정자가 아니라 URL을 받아들이며, 더욱이 해당 URL은 문서의 URL을 기준으로 하며 실행중인 스크립트를 기준으로 하지 않는다는 것입니다. 이로 인해 개발자들은 모듈을 가져오는 다른 방법을 사용할 때마다 문맥을 전환해야 하므로 불필요한 장애물이 발생하며, 상대적인 URL은 잠재적인 버그의 원천이 될 수 있습니다.

또 다른 명확한 문제는 이것이 호스트별로 구분되어있다는 것입니다. Node.js 코드는 위의 함수를 사용할 수 없으며, 자체 버전을 만들어야 합니다. 이는 아마도 다른 시멘틱을 가지겠죠(아마도 URL이 아니라 파일 이름을 기준으로). 이것은 비호환 코드로 이어지게 됩니다.

마지막으로, 이는 표준화되어 있지 않습니다. 따라서 사람들은 앱에 동적 코드 로딩을 추가하려면 매번 직접 가져오거나 자체 버전을 작성해야 합니다. 이는 HTML에 표준 메서드로 추가함으로써 해결될 수 있습니다(`window.importModule`). 그러나 표준화를 한다고 하면, `import()`를 표준화하는 것이 위에서 설명한 이유로 더 좋습니다.

### 실제 함수
[Loader](https://whatwg.github.io/loader/) 아이디어 모음집의 초안에는 `System.import()` 또는 `System.loader.import()`라는 이름을 가진 실제 함수(함수 형태와 유사한 것이 아닌)가 여러번 포함되었습니다. 이 함수는 동일한 사용 사례를 수행합니다.

가장 큰 문제는, 스펙의 에디터들에 의해 설명된, 이러한 함수의 specifier 인수를 어떻게 해석해야 하는지입니다. 이는 함수일 뿐이기 때문에 스크립트나 모듈마다 달라지지 않고 전체 스코프에서 동일하게 해석해야 합니다.(스택 검사와 같이 정말 이상한 기능이 구현되지 않는 한) 따라서 위의 URL을 기본으로 하는 `importModule` 함수의 문제와 유사한 문제에 직면할 가능성이 큽니다. 상대적인 모듈 지정자는 버그의 원천이 되고 근처의 `import` 선언과 일치하지 않게 됩니다.

### 새로운 바인딩 형식
2016년 7월 TC39 회의에서 [중첩된 import 선언](https://github.com/benjamn/reify/blob/main/PROPOSAL.md)에 대한 제안을 [논의](https://github.com/benjamn/reify/blob/main/PROPOSAL.md)하는 과정에서, 본래의 제안은 거부되었지만, `await import`를 잠재적인 발전 방향으로 제안했습니다. 이것은 async 함수 내에서만 동작하는 새로운 바인딩 형식(즉, 주어진 스코프에 이름을 도입하는 새로운 방법)이 될 것입니다.

`await import`는 아직 완전히 개발되지 않았으므로 이 제안과 그 목표와 기능이 어느 정도로 중복되는지 말하기가 어렵습니다. 그러나 해당 제안에 대한 보완책이 될 것이라고 느껴집니다. 그것은 정적으로 맨 위에 정의된 `import` 구문과, 완전히 동적인 `import()`의 중간 정도입니다.

예를 들어, TC39에서 `await import`에 의해 생성된 promise는 절대 재지정되지 않는다고 명시되어 있습니다. 이로 인해 더 간단한 프로그래밍 경험이 제공되지만, `import()`에 의해 반환되는 재지정된 프로미스는 프로미스 조합기를 사용하여 다른 모듈을 경쟁하거나 모듈을 병렬로 로드하는 등의 강력한 기법을 사용할 수 있습니다. 이 명시적인 프로미스 프로미스 생성은 `import()`를 비동기가 아닌 함수 컨텍스트에서 사용할 수 있게 해주지만, (일반 `await` 표현식과 마찬가지로) `await import`는 제한됩니다. await import가 임의의 문자열을 모듈 지정자로 허용할지 아니면 기존의 최상단 `import` 구문에서만 허용하는 문자열 리터럴을 고수할지도 불분명합니다.

내가 이해하는 바로는 `await import`가 더 정적인 경우를 위한 것이며, 번들링 및 트리 쉐이킹 도구와 통합되면서 여전히 일부 느린 가져오기 및 평가를 허용한다는 것입니다. `import()`는 가장 낮은 수준의, 가장 강력한 빌딩 블럭으로 사용될 수 있습니다.

## 기존 작업과의 관계
지금까지 모듈 작업은 세 가지 영역에서 이뤄졌습니다.
- [The JavaScript specification](https://tc39.es/ecma262/#sec-modules), 주로 모듈의 구문을 정의하고 [HostResolveImportedModule](https://tc39.es/ecma262/#sec-hostresolveimportedmodule)을 통해 호스트 환경에 위임합니다.
- [The HTML Standard](https://html.spec.whatwg.org/multipage/), [`<script type="module">`](https://html.spec.whatwg.org/multipage/scripting.html#the-script-element)을 정의하고, [어떻게 모듈을 가져오는지](https://html.spec.whatwg.org/multipage/webappapis.html#fetching-scripts), 그 위에 [HostResolveImportedModule](https://html.spec.whatwg.org/multipage/webappapis.html#hostresolveimportedmodule(referencingmodule,-specifier))을 지정하여 호스트 환경의 의무를 이행합니다.
- [The Loader specification](https://whatwg.github.io/loader/), 런타임에서 구성 가능한 로드 파이프라인을 만들고 모듈을 반사적으로 (즉, 소스 텍스트에서 생성하지 않고) 만드는 방법을 시연하는 흥미로운 아이디어 모음입니다.

이 제안은 기존의 JavaScript와 HTML 기능을 약간 확장하는 것으로, JavaScript 명세서의 구문 형식 지정과 동일한 프레임워크를 사용하며, 중요한 작업을 호스트 환경에 위임합니다. HTML의 모듈 가져오기 및 해결 인프라는 해당 부분을 정의하는데 활용됩니다. 마찬가지로 Node.js는 HostPrepareImportedModule 및 HostResolveImportedModule에 대한 고유한 정의를 제공하여 이 제안이 작동하도록 할 것입니다.

로더 명세서의 아이디어는 크게 변경되지 않을 것이지만, 아마도 현재의 `System.loader.import()`제안을 대체하거나 특정 상황에서 사용되는 하위 수준 버전으로 만들 수도 있습니다. 로더 명세서는 플러그 가능한 로딩 파이프라인과 반사적인 모듈에 대한 보다 일반적인 아이디어를 프로토타이핑하는 작업을 계속할 것입니다. 이는 시간이 지나면 HTML 및 Node의 호스트별 파이프라인을 일반화하는 데 사용될 수 있습니다.

구체적으로 이 저장소는 `import()` 구문과 관련된 호스트 환경 훅을 지정하여 단계별 프로세스를 진행하기 위한 TC39 제안으로 사용됩니다. 또한 이 제안과 통합될 수 있는 [HTML 표준에 대한 제안 변경 사항 개요](https://github.com/tc39/proposal-dynamic-import/blob/main/HTML%20Integration.md)가 포함되어 있습니다.

