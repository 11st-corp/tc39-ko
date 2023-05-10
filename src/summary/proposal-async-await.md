# 목차

1. **[Async Functions](#Async-Functions)**
2. **[regenerator](#regenerator)**
3. **[살펴 볼만한 이슈들](#살펴-볼만한-이슈들)**

---

# Async Functions

## 소개

ECMAScript에 promise와 generator를 도입하면 ECMAScript에 비동기 코드를 작성하기 위한 언어 수준의 모델을 획기적으로 개선할 수 있습니다.

비슷한 제안이 ES6 논의 중에 [Deferred Functions](http://wiki.ecmascript.org/doku.php?id=strawman:deferred_functions)과 함께 이루어졌습니다. 여기서 제안은 유사하거나 동일한 구문을 사용하지만, 사용자 정의 메커니즘을 정의하는 대신 생성자와 병렬인 제어 흐름 구조를 직접 구축하고, 반환 유형에 대한 약속을 사용하는 동일한 사용 사례를 지원합니다.


이 제안의 개발은 https://github.com/tc39/ecmascript-asyncawait 에서 진행되고 있습니다. 그 곳에 문제를 제출해 주세요. 사소하지 않은 기여는 TC39 회원으로 제한되지만 사소한 이슈에 대한 pull request는 환영받고 권장됩니다!

## 이 제안의 상태
이 제안은 2015년 9월 ECMAScript [명세 과정](https://tc39.es/process-document)의 3단계('후보')로 승인되었습니다. 챔피언은 이 제안을 11월 말까지 4단계('완료')로 승인할 계획입니다.

## 예시

먼저 Promise를 사용하여 작성된 다음 예를 살펴보겠습니다. 이 코드는 요소에 일련의 애니메이션을 연결하고, 애니메이션에 예외가 있을 때 중지하고, 성공적으로 실행된 최종 애니메이션에 의해 생성된 값을 반환합니다.

```js
    function chainAnimationsPromise(elem, animations) {
        let ret = null;
        let p = currentPromise;
        for(const anim of animations) {
            p = p.then(function(val) {
                ret = val;
                return anim(elem);
            })
        }
        return p.catch(function(e) {
            /* ignore and keep going */
        }).then(function() {
            return ret;
        });
    }
    
```

이미 Promise가 있는 코드는 이러한 종류의 루프 및 예외 처리가 어려운 직선 콜백 스타일에서 훨씬 개선되었습니다.

[Task.js](https://taskjs.org) 및 유사한 라이브러리는 generator를 사용하여 동일한 의미를 유지하는 코드를 더욱 단순화하는 방법을 제공합니다.

```js
    function chainAnimationsGenerator(elem, animations) {
        return spawn(function*() {
            let ret = null;
            try {
                for(const anim of animations) {
                    ret = yield anim(elem);
                }
            } catch(e) { /* ignore and keep going */ }
            return ret;
        });
    }
```

이는 눈에 띄는 개선입니다. 코드의 의미론적 내용을 넘어서는 모든 Promise 상용구가 제거되고 내부 함수의 본문이 사용자 의도를 나타냅니다. 그러나 코드를 추가 생성기 함수로 래핑하고 라이브러리로 전달하여 약속으로 변환하기 위한 보일러플레이트의 외부 레이어가 있습니다. 이 계층은 promise을 생성하기 위해 이 메커니즘을 사용하는 모든 함수에서 반복되어야 합니다. 이것은 일반적인 비동기 JavaScript 코드에서 매우 일반적이므로 나머지 보일러플레이트의 필요성을 제거하는 데 가치가 있습니다.

async 함수를 사용하면, 나머지 상용구가 모두 제거되고 프로그램 텍스트에 의미상 의미 있는 코드만 남습니다.

```js
 async function chainAnimationsAsync(elem, animations) {
        let ret = null;
        try {
            for(const anim of animations) {
                ret = await anim(elem);
            }
        } catch(e) { /* ignore and keep going */ }
        return ret;
    }
```
<br/>

# regenerator

- [facebook/regenerator](https://github.com/facebook/regenerator)

regenerator는 facebook에서 개발한 ECMAScript6 generator 함수를 오늘날의 JavaScript에서 활성화하는 소스 변환 패키지입니다.

이 패키지는 [ECMAScript 2015 또는 ES2015](http://www.ecma-international.org/ecma-262/6.0/)와 [비동기 반복 제안](https://github.com/tc39/proposal-async-iteration)에서 `generators`/`yield` 구문을 가져와 동일한 방식으로 동작하는 효율적인 ES5를 뱉어내는 완전한 기능의 소스 변환을 구현합니다.

`wrapGenerator` 함수를 제공하려면 작은 런타임 라이브러리(1KB 미만으로 압축된)가 필요합니다. CommonJS 모듈 또는 독립 실행형 .js 파일 중 원하는 것을 선택하여 설치할 수 있습니다.

## 설치

npm에서:
```
npm install -g regenerator
```

GitHub에서
```
cd path/to/node_modules
git clone git://github.com/facebook/regenerator.git
cd regenerator
npm install .
npm test

```

## 사용법
이 모듈을 사용하기 위한 몇 가지 옵션이 있습니다.

가장 단순한 사용법:
```
regenerator es6.js > es5.js # Just the transform.
regenerator --include-runtime es6.js > es5.js # Add the runtime too.
regenerator src lib # Transform every .js file in src and output to lib.
```

프로그래밍 방식의 사용법:
```js
var es5Source = require("regenerator").compile(es6Source).code;
var es5SourceWithRuntime = require("regenerator").compile(es6Source, {
  includeRuntime: true
}).code;
```

AST 변환:
```js
var recast = require("recast");
var ast = recast.parse(es6Source);
ast = require("regenerator").transform(ast);
var es5Source = recast.print(ast);
```

## 어떻게 참여할 수 있나요?

가장 쉬운 참여 방법은 sandbox를 사용하며 버그 사례를 찾는 것이며, 이상한 점이 발견되면 "report a bug" 링크를 클릭하면 문제가 있는 코드로 새 이슈 양식이 자동으로 채워집니다.

또는 저장소를 [fork](https://github.com/facebook/regenerator/fork)하고, [test/tests.es6.js](https://github.com/facebook/regenerator/blob/main/test/tests.es6.js)에서 실패한 일부 테스트 사례를 만들고, 해결하기 위해 pull requests을 보낼 수도 있습니다.

만약 자신이 특히 용감하다고 느끼신다면 변환 코드에 뛰어들어 직접 버그를 수정하는 것을 환영하나, 이 코드는 [더 나은 구현 코멘트](https://github.com/facebook/regenerator/issues/7)로 부터 실질적인 도움을 얻을 수 있음을 경고해야겠습니다.


# 살펴 볼만한 이슈들

## 명확한 질문: await가 최상위 코드에서 사용될 수 있습니까?([#9](https://github.com/tc39/proposal-async-await/issues/9))

### 질문 
제안서에서는 비동기 함수 안에서 'await'가 사용될 것으로 보이는데
'await'를 최상위 코드에서 사용할 수 있나요?

### 답변
'최상위 코드'에는 세 가지 개념이 있습니다.
- A JavaScript REPL
- The ES6 Script 
- The ES6 Module 
> 참고: REPL은 Read-Eval(evaluation)-Print Loop의 약어로 사용자가 특정 코드를 입력하면 그 코드를 평가하고 코드의 실행결과를 출력해주는 것을 반복해주는 환경을 말합니다.

위 질문은 REPL 사례에 대한 질문인 것 같습니다. 

#### 1. A JavaScript REPL

여기서 await를 허용할지 여부는 대부분 호스트에게 달려있습니다. 만약 그들이 허용한다면, 다음과 같이  코드를 하나로 묶은 것 처럼 실행할 것입니다.:

```js
(async function() {
  // <<여기에 사용자 제공 코드를 삽입>>
})();
```
이것은 효과가 있지만 두 가지 단점이 있습니다. 

첫째, 모든 선언을 함수 스코프 내로 숨기므로 REPL 입력 간에 공유되는 global이 없습니다. 둘째, 반환 값은 비동기적으로 제공되므로 함수 내 코드가 이를 처리하는 방법을 결정해야 합니다.

#### 2. ES6 Script
ES6 Script의 경우 몇 가지 문제가 있습니다. 첫 번째는 script가 동기적으로 값을 반환한다는 것입니다. 웹 플랫폼 및 기타 JS 호스트 환경에서 이것에 상당한 의존성이 있다고 생각합니다. 

두 번째는 script가 공유 global 스코프를 동기적으로 수정한다는 것입니다. await가 허용되면 혼란스러운 동작이 발생할 수 있습니다. 예를 들어:
```html
<script>
var x = await userEnteredAValue();
function foo() { return x; }
var y = "hello";
</script>
<script>
console.log(y) // 'hello' 인가요?
console.log(foo()) // userEnteredAValue 값일까요?
</script>
```

#### 3. ES6 Script

HTML에는 이미 `<script>` 블록의 순서를 보장하지 않는 의미 체계를 제공하는 `<script async>`가 있습니다.

ES6 `Module`의 경우 문법 생성은 이미 async `import`를 허용하고 어디서나 사용할 수 있는 동기식 반환 값이 없습니다. 따라서 `await`를 여기에 추가할 수 있습니다.


궁극적으로 Program 또는 `Module` 문법에 `await`를 추가하는 것이 이치에 맞는지 확신할 수 없지만 REPL 또는 기타 임베딩은 자체 최상위 수준에서 이를 지원하는 환경을 여전히 제공할 수 있습니다.


### 결론
위 답변에 주어진 세 가지 환경에서 최상위 레벨에서 await 사용 환경이 같아야 한다는 의견이 다수였고, 여러 논의 끝에 본 이슈의 결론은 다음과 같습니다.

이 내용은 7월 TC39에서 추가로 논의되었습니다. 최상위 수준에서 Await는 모듈 로더에 많은 복잡성을 도입합니다. 

이와 같이 TC39는 최상위 수준에서 await이 없이 async 함수를 보고 싶어합니다. Await는 여전히 보류되어 있기에 우리는 262의 이후 버전에서 이를 수행할 수 있습니다.

참고)[
proposal-top-level-await](https://github.com/tc39/proposal-top-level-await)