# import.meta

본 저장소는 JavaScript에 `import.meta` 메타속성을 추가하기 위한 제안서를 포함하고 있으며, 현재 [TC39 4단계 과정](https://tc39.github.io/process-document/))에 있습니다.

이전에 본 문제 영역은 module-loading 커뮤니티와 [whatwg/html#1013](https://github.com/whatwg/html/issues/1013)에서 토론되었습니다. 그 결과로 [이 슬라이드](https://docs.google.com/presentation/d/1p1BGFY05-iCiop8yV0hNyWU41_wlwwfv6HIDkRNNIBQ/edit?usp=sharing))가 2017년 5월 TC39 회의에서 발표되었습니다. 위 슬라이드에서 제시된 옵션에 대한 위원회의 반응은 본 제안서에서 선택된 특정 형식으로 이어지게 되었으며, 이러한 토론들은 이 README의 나머지 부분에서 요약되어 있습니다.

[명세서 초안](https://tc39.github.io/proposal-import-meta/)을 확인하고 [이슈 트래커](https://github.com/tc39/proposal-import-meta/issues)에서 토론에 참여할 수 있습니다.

## 제안 동기 및 사용 사례

호스트 환경에서는 종종 모듈 내에서 평가되는 코드에 유용한 모듈별 정보를 제공할 수 있습니다. 몇 가지 예는 다음과 같습니다.

### 모듈의 URL 또는 파일 이름

Node.js의 CommonJS 모듈 시스템에서는 현재 범위 내의 `__filename` 변수 (및 그와 관련된 `__dirname` 변수)을 통해 이를 제공합니다. 이를 통해 모듈 파일을 기준으로 상대적인 리소스의 해결이 간단해집니다. 다음과 같은 코드를 통해 가능합니다.

```js
const fs = require("fs");
const path = require("path");
const bytes = fs.readFileSync(path.resolve(__dirname, "data.bin"));
```

`__dirname`을 사용할 수 없는 경우, `fs.readFileSync("data.bin")`과 같은 코드는 현재 작업 디렉토리를 기준으로 `data.bin`을 해결하게 됩니다. 이는 일반적으로 라이브러리 작성자에게 유용하지 않으며, 모듈과 함께 리소스를 번들로 제공하며 현재 작업 디렉토리<sup>[1][]</sup>와 관련하여 어디에 위치할 수 있는지를 고려해야 하는 경우에 사용됩니다.

브라우저에서도 매우 유사한 사용 사례가 있으며, 여기서는 파일 이름 대신 URL이 사용될 것입니다.

### `<script>` 초기화

이는 브라우저에서 전통적인 스크립트(즉, 비모듈 스크립트)에 대해 전역 `document.currentScript` 속성을 통해 제공됩니다. 이는 주로 포함된 라이브러리의 설정에 사용됩니다. 페이지는 다음과 같은 코드를 작성합니다.

```html
<script data-option="value" src="library.js"></script>
```

그리고 라이브러리는 다음과 같은 코드를 사용하여 `data-option`의 값을 찾아냅니다.

```js
const theOption = document.currentScript.dataset.option;
```

한 가지 참고할 점은, 렉시컬 스코프 값 대신, (사실상) 전역 변수를 사용하는 메커니즘은 문제가 있습니다. 이는 값이 최상위 수준에서만 설정되기 때문에, 비동기 코드에서 사용하려면 최상위 수준에 저장해야 합니다.

### 제가 "main" 모듈입니까?

Node.js에서는 자신이 프로그램의 "main" 또는 "entry" 모듈인지에 따라 분기하는 것이 일반적인 관행입니다. 다음과 같은 코드를 사용하여 분기합니다.

```js
if (module === process.mainModule) {
  // 이 라이브러리의 테스트를 실행하거나 CLI 인터페이스를 제공하는 등의 작업을 수행합니다.
}
```

즉, 단일 파일이 가져올 때는 라이브러리로 동작하고, 직접 실행될 때는 부작용을 가진 프로그램으로 동작하도록 합니다.

Note how this particular formulation relies on comparing the host-provided scoped value `module` with the host-provided global value `process.mainModule`.

특히, 이 구현 방식은 호스트에서 제공하는 범위 값 `module`과 전역 값 `process.mainModule`을 비교하는 의존성을 가지고 있음에 유의해야 합니다.

### 기타 잡다한 사용 사례

그 밖에도 다음과 같은 경우를 생각할 수 있습니다

- `module.children` 또는 `require.resolve()`와 같은 다른 Node.js 유틸리티
- 모듈이 속한 "패키지"에 대한 정보, Node.js의 package.json 또는 [웹 패키지](https://github.com/dimich-g/webpackage)를 통해
- [HTML 모듈](https://docs.google.com/presentation/d/1ksnC9Qr3c8RwbDyo1G8ZZSVOEfXpnfQsTHhR5ny9Wk4/edit#slide=id.g1c508fcb31_0_17)에 포함된 JavaScript 모듈용 DocumentFragment에 대한 포인터

## 제약 사항

이러한 정보가 많은 경우 호스트에 특화되어 있으므로, 우리는 모든 메타데이터에 대해 JavaScript에서 표준화를 요구하는 대신 호스트가 사용할 수 있는 일반적인 확장성 메커니즘을 JavaScript에서 제공하기를 원합니다.

또한 위에서 언급한 대로, 이 정보는 일시적으로 설정된 전역 변수 대신 렉시컬적으로 제공하는 것이 가장 좋습니다.

## 제안된 해결책

본 제안서는 `import.meta` 메타 속성을 추가합니다. 이 속성은 객체 자체입니다. 이는 ECMAScript 구현에서 null 프로토타입으로 생성됩니다. 호스트 환경은 객체에 추가할 속성 (키/값 쌍으로) 집합을 반환할 수 있습니다. 마지막으로, 필요한 경우 호스트는 객체를 임의로 수정할 수 있는 탈출구<sup>[2][]</sup>를 제공할 수 있습니다.

`import.meta` 메타 속성은 모듈에서만 구문적으로 유효합니다. 현재 실행 중인 모듈에 대한 메타 정보를 나타내기 위한 것이며, 현재 실행 중인 전통적인 스크립트에 대한 정보를 대체하는 용도로 사용해서는 안 됩니다.

## 예제

다음 코드는 브라우저에서 `import.meta`에 추가될 것으로 예상되는 몇 가지 속성을 사용합니다.

```js
(async () => {
  const response = await fetch(new URL("../hamsters.jpg", import.meta.url));
  const blob = await response.blob();

  const size = import.meta.scriptElement.dataset.size || 300;

  const image = new Image();
  image.src = URL.createObjectURL(blob);
  image.width = image.height = size;

  document.body.appendChild(image);
})();
```

이 모듈이 로드될 때, 모듈의 위치와 상관없이 형제 파일 `hamsters.jpg`를 로드하고 이미지를 표시합니다. 이미지의 크기는 해당 모듈을 가져올 때 사용된 스크립트 요소를 사용하여 구성할 수 있습니다. 예를 들어 다음과 같이 설정할 수 있습니다.

```html
<script type="module" src="path/to/hamster-displayer.mjs" data-size="500"></script>
```

## 탐구된 대체 해결책

잠재적으로 호스트별 메타데이터를 제공하는 방법에는 여러 가지가 있습니다. 조사된 주요 다른 방법은 다음과 같습니다.

### 특정 모듈 지정자 사용

여기서 아이디어는 이미 모듈 시스템에서 컨텍스트별 값을 얻는 메커니즘이 있다는 점입니다. **import**! 이 경우에는 이러한 속성을 얻기 위한 구문은 다음과 같은 특정 모듈 지정자를 통한 최상위 가져오기를 통해 이루어질 것입니다.

```js
import { url, scriptElement } from "js:context";
```

이는 기존의 프레임워크와 잘 어울리며, 호스트 측에서 완전히 처리할 수 있으므로 새로운 ECMAScript 제안이 필요하지 않습니다(모듈 지정자가 어떻게 해석되는지에 대한 제어권이 호스트에게 있기 때문입니다). 그러나 웹에서는 [WebKit에서 반대 의견](https://github.com/whatwg/html/issues/1013#issuecomment-281863721)이 제시되었으며, TC39가 이 아이디어에 대해 일치된 의견을 가지지 않았기 때문에 WebKit의 반대 의견을 극복하기 위해 시도할 가치가 없다고 판단되었습니다. Node.js는 여전히 이를 구현할 수 있으며, 특히 `import.meta`가 필요한 시기에 충분히 사용 가능하지 않을 경우에는 구현할 수 있습니다.

### 다른 방식으로 렉시컬 변수 소개하기

이 가능성은 Node.js가 현재 `__dirname`, `__filename`, `module`을 주입하는 것과 유사하게 해당 정보를 어떤 방식으로든 모듈의 범위에 주입된 변수로 도입합니다. 그런 다음 이러한 변수들은 일반적인 범위 내의 변수로 사용됩니다:

```js
console.log(moduleURL);
console.log(moduleScriptElement);
```

구현과 명세 관점에서, 이는 ECMAScript 명세 변경 없이 호스트가 모든 모듈 소스 텍스트 앞에 적절한 변수 선언을 추가하여 처리할 수 있습니다. 또는 호스트는 [[Environment]] 필드에 약간 다른 범위를 갖는 새로운 유형의 모듈 레코드를 도입할 수도 있습니다. (또는 ECMAScript가 소스 텍스트 모듈 레코드의 [[Environment]] 설정에 호스트의 개입을 허용하도록 수정될 수 있습니다.)

위원회는 일반적으로 ECMAScript에서 이 아이디어를 처리하는 것에 반대했습니다. 몇 명의 위원은 새로운 변수로 모듈 스코프를 "오염"시키는 것을 선호하지 않았기 때문입니다. `import.meta`가 충분히 빠르게 진행되지 못할 경우, 이는 웹 호스트를 위한 대체 옵션으로 남아 있습니다.

## 자주 묻는 질문들	

### 이 객체는 어떤 식으로든 잠겨 있습니까?

위원회의 임시적인 결정은 그렇지 않다는 것입니다. 기본적으로 `import.meta` 객체는 확장 가능하며, 그 속성은 쓰기 가능하고, 구성 가능하며, 열거 가능합니다.

이 객체를 잠그는 것에는 실제적인 이점이 없습니다. 왜냐하면 이 객체는 모듈에 지역적으로 존재하며, 명시적으로 전달함으로써만 공유될 수 있습니다. 이 객체는 "전역 상태"나 그와 유사한 것을 나타내지 않습니다.

또한, 이 객체를 가변 상태로 남겨두면 모듈 간 트랜스파일러가 각 모듈의 상단에 몇 줄의 추가 코드를 삽입하여 `import.meta` 속성을 추가하거나 수정함으로써 미래 기능을 "폴리필"할 수 있습니다. 예를 들어, 몇 년 후에 HTML이 추가적인 속성을 추가한다면, 구형 브라우저를 대상으로 하는 트랜스파일러가 해당 속성을 추가하는 것이 가능해질 것입니다.

마지막으로, HostFinalizeImportMeta에 의해 제공되는 탈출구를 통해 더 엄격하게 잠긴 `import.meta` 객체를 선호하는 호스트는 이 경로를 따를 수 있습니다.

---
[1]: #1
[2]: #2

#### 1 

**CWD(현재 작업 디렉토리)**

#### 2

**escape hatch(탈출구)**