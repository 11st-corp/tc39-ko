# 자바스크립트를 위한 옵셔널 체이닝

## 상태 
[ECMAScript 제안](https://github.com/tc39/proposals) 과정 4단계

## 작성자 
- Claude Pache (github)
- Gabriel Isenberg (github, twitter)
- Daniel Rosenwasser (github, twitter)
- Dustin Savery (github, twitter)

## 개요 및 동기
트리와 같은 구조에 깊이 있는 속성 값을 찾을 때는 중간 노드가 있는지 확인해야 하는 경우가 많습니다.
```js
var street = user.address && user.address.street;
```
또한, 많은 API는 객체 또는 `null`/`undefined`를 반환하며, `null`이 아닌 경우에만 결과에서 속성을 추출하려 할 수 있습니다.
```js
var fooInput = myForm.querySelector('input[name=foo]')
var fooValue = fooInput ? fooInput.value : undefined
```
옵셔널 체이닝을 사용하면 개발자가 이러한 경우를 반복하거나 임시 변수에 중간 결과를 할당하지 않고 처리할 수 있습니다.                                                  
```js
var street = user.address?.street
var fooValue = myForm.querySelector('input[name=foo]')?.value
```
누락된 사례에 대해 `undefined`가 아닌 다른 값이 필요한 경우 일반적으로 Nullish 병합 연산자를 사용하여 처리할 수 있습니다.
```js
// response.settings가 없거나 null이면 기본값으로 돌아갑니다.
// (response.settings == null) 또는 response.settings.animationDuration이 누락된 경우
// 또는 nullish (response.settings.animationDuration == null)
const animationDuration = response.settings?.animationDuration ?? 300;
```
옵셔널 체이닝의 호출 변형은 옵셔널 메서드가 있는 인터페이스를 처리하는데 유용합니다.
```js
iterator.return?.() // 이터레이터를 수동으로 닫습니다.
```

또는 보편적으로 구현되지 않은 방법은 다음과 같습니다.

```js
if (myForm.checkValidity?.() === false) { // 오래된 웹 브라우저에서는 테스트를 하지 않는다.
    // 형식 유효성 검사 실패
    return;
}
```

## 선행 기술
달리 언급하지 않는 한, 다음 언어에서 구문은 연산자 앞에 물음표로 구성됩니다.(`a?.b`, `a?.b()`, `a?[b]` 또는 `a?(b)` 에 해당하는 경우)

다음 언어는 이 제안과 동일한 일반적인 의미론을 사용하여 연산자를 구현합니다( 1) `null` 기본값으로부터 보호하고, 2) 전체 체인에 대한 단락 적용 프로그램):
- C#: [Null-conditional operator](https://msdn.microsoft.com/en-us/library/dn986595.aspx) — 읽기 액세스에서 Null 조건부 멤버 액세스 또는 인덱스입니다.
- Swift: [Optional Chaining](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/optionalchaining/) — 읽기 및 쓰기 액세스 권한을 가진 옵셔널 속성, 메서드 또는 구독자 호출입니다.
- CoffeeScript: [Existential operator](https://coffeescript.org/#existential-operator) — 속성 접근자, 함수 호출, 객체 구성(`new a?()`)에 대한 실존 연산자 변형입니다. 할당 및 삭제에도 적용됩니다.

다음 언어는 유사한 기능을 가지고 있지만 하나 이상의 요소일 때 전체 체인을 단락시키지는 않습니다. 이는 이러한 언어에서 메소드 또는 속성이 `null`에 합법적으로 사용될 수 있다는 사실(예시: Dart에서 `null.toString() == "message"`)에 의해 정당화됩니다.)

- Kotlin: [Safe calls](https://kotlinlang.org/docs/reference/null-safety.html#safe-calls) - 읽기를 위한 옵셔널 속성 액세스, 쓰기를 위한 옵셔널 속성 할당.
- Dart: [Conditional member access](https://dart.dev/language/operators#other-operators) - 선택적 속성 액세스. 
- Ruby: [Safe navigation operator](https://ruby-doc.org/core-2.6/doc/syntax/calling_methods_rdoc.html#label-Safe+navigation+operator) — 철자: `a&.b`

다음 언어도 비슷한 기능을 가지고 있습니다. 우리는 그들이 이 제안서와 의미론적으로 큰 차이가 있는지 확인하지 않았습니다.

- Groovy: [Safe navigation operator](http://groovy-lang.org/operators.html#_safe_navigation_operator)
- Angular: [Safe navigation operator](https://v10.angular.io/guide/template-expression-operators#the-safe-navigation-operator----and-null-property-paths) (Angular v10에 대해 보관된 설명서 링크)

## 구문
옵셔널 체이닝 연산자 철자는 `?.` 입니다. 이 연산자는 세 가지 위치로 나타날 수 있습니다.
```js
obj?.prop       // optional static property access
obj?.[expr]     // optional dynamic property access
func?.(...args) // optional function or method call
```

### 참고
`foo?.3:0` 을 `foo ? . 3 : 0` 으로 파싱하려면(이전 버전과의 호환성을 위해 필요), 어휘 문법 수준에서 간단한 미리보기가 추가되어 문자 시퀀스 `?.` 해당 상황에서 단일 토큰으로 해석되지 않습니다(`?.` 토큰 바로 뒤에 십진수가 오면 안 됩니다).

## 의미론
### 기본 케이스
`?.`의 왼쪽에 피연산자가 있는 경우. 연산자는 `undefined` 또는 `null`로 평가되고 표현식은 `undefined`으로 평가됩니다. 그렇지 않으면 대상 속성 액세스, 메서드 또는 함수 호출이 정상적으로 트리거됩니다.

다음은 각각의 디슈가링이 뒤따르는 기본적인 예입니다. (디슈가링은 LHS가 한 번만 평가되어야 하고 `document.all`이 객체로 동작해야 한다는 점에서 정확하지 않습니다.)
```js
a?.b                          // undefined if `a` is null/undefined, `a.b` otherwise.
a == null ? undefined : a.b

a?.[x]                        // undefined if `a` is null/undefined, `a[x]` otherwise.
a == null ? undefined : a[x]

a?.b()                        // undefined if `a` is null/undefined
a == null ? undefined : a.b() // throws a TypeError if `a.b` is not a function
                              // otherwise, evaluates to `a.b()`

a?.()                        // undefined if `a` is null/undefined
a == null ? undefined : a()  // throws a TypeError if `a` is neither null/undefined, nor a function
                             // invokes the function `a` otherwise
```

### 단락 평가
`?.`의 LHS에 대한 표현이 `null`/`undefined`로 평가되면 RHS는 평가되지 않습니다. 이 개념을 short-circuiting이라고 합니다.

```js
a?.[++x]         // `x` is incremented if and only if `a` is not null/undefined
a == null ? undefined : a[++x]
```

### 긴 단축 평가
실제로 단축 평가가 트리거되면 현재 속성 액세스, 메서드 또는 함수 호출뿐만 아니라 옵셔널 체이닝 연산자 바로 다음에 오는 속성 액세스, 메서드 또는 함수 호출의 전체 체인도 건너뜁니다.

```js
a?.b.c(++x).d  // if `a` is null/undefined, evaluates to undefined. Variable `x` is not incremented.
               // otherwise, evaluates to `a.b.c(++x).d`.
a == null ? undefined : a.b.c(++x).d
```
`null`확인은 `a`에서만 이루어집니다. 예를 들어 `a`가 null이 아니지만 `a.b`가 `null`인 경우 `a.b`의 속성 `"c"`에 액세스하려고 하면 TypeError가 발생합니다.

이 기능은 예를 들어, C# 및 CoffeeScript에 의해 구현됩니다. [선행 기술](https://github.com/tc39/proposal-optional-chaining#prior-art)을 참조하십시오.

### Stacking
Optional Chain(옵션 체인)을 옵셔널 체이닝 연산자로 부르고 그 다음에 속성 액세스, 메서드 또는 함수 호출을 입력합니다.

옵션 체인 뒤에 다른 옵션 체인이 올 수 있습니다.

```js
a?.b[3].c?.(x).d
a == null ? undefined : a.b[3].c == null ? undefined : a.b[3].c(x).d
  // (as always, except that `a` and `a.b[3].c` are evaluated only once)
```

### 엣지 케이스: 그룹핑
괄호는 단축 평가의 범위를 제한합니다.
```js
(a?.b).c)
(a == null ? undefined : a.b).c
```
이는 Completion(`break` 명령과 같은) 또는 임시 참조([이 제안의 이전 버전](https://github.com/claudepache/es-optional-chaining)과 같은)의 전파가 아니라, 구문(`&&` 연산자와 같은)으로 단락 범위를 지정하는 설계 선택에서 따릅니다. 일반적으로 구문은 괄호로 임의로 분할할 수 없습니다. 예를 들어 `({x}) = y`는 비구조화 할당이 아니라 객체 리터럴에 값을 할당하려는 시도입니다.

의미 체계가 무엇이든, 해당 위치에 괄호를 사용할 실제적인 이유는 없습니다.

### 선택적 삭제
`delete` 연산자는 매우 자유롭게 사용할 수 있기 때문에 무료로 제공됩니다.

```js
delete a?.b
a == null ? true : delete a.b
```
여기서 `true`는 비참조 삭제를 시도한 일반적인 결과입니다.

#### 선택적 삭제를 지원하는 이유는 무엇입니까?

- **게으름**(이 주장은 가장 중요하기 때문이 아니라 다른 주장을 올바른 관점에 두기 때문에 우선 순위에 놓입니다.). 게으름은 (조급함과 자만심과 함께) 스펙 작가의 가장 중요한 미덕 중 하나입니다. 즉, 다른 모든 것들이 거의 같다면, 스펙에 포함될 더 적은 것들을 포함하는 솔루션을 취합니다.
 
  선택적 삭제를 지원하려면 문자 그대로 노력이 전혀 필요하지 않은 반면, (초기 구문 오류를 생성하여) 지원하지 않는 경우에는 사소한 노력이 필요합니다. (기술적인 자세한 내용은 PR #73 (주석)을 참조하십시오.
  
  따라서 게으름 원칙에 따라 올바른 질문은 "선택적 삭제를 지원할 좋은 이유가 있는가?"가 아니라 "선택적 삭제에 대한 지원을 제거할 좋은 이유가 있는가?"입니다

- 지원를 하지 않아야 하는 **강력한 이유의 부족**입니다. 선택적 삭제의 지원되는 의미론은 예상할 수 있는 유일한 의미론입니다(물론 삭제 연산자의 의미론을 올바르게 이해하는 경우). 어떤 면에서 프로그래머를 혼란스럽게 할 수 있는 것은 아닙니다. 사실, 유일한 진짜 이유는 "우리는 그것을 지지할 의도가 없었습니다."입니다

- **삭제 연산자의 일관성** 입니다. 이 연산자가 납득할 수 없는 것이 주어졌을 때(예를 들어, `delete foo()`) 성공하는 척하면서도 받아들이는 것이 매우 자유롭다는 것은 인생의 사실입니다. 삭제가 금지된 항목(구성할 수 없는 속성, 변수 등)을 삭제하려고 할 때 오류 조건(초기 또는 비초기)은 엄격한 모드입니다. 선택적 삭제를 지원하는 것은 해당 모델에 적합하지만 금지하는 것은 적합하지 않습니다.

- **사용 사례의 유무** 입니다. 그들은 흔하지는 않지만 실제로 존재합니다(예시: Babel 예제).

## 지원되지 않는
다음은 완전성을 위해 포함될 수 있지만 실제 사용 사례가 부족하거나 다른 강력한 이유로 인해 지원되지 않습니다. 이슈 22번과 54번을 참조하십시오:

- 옵셔널 구성: new a?()
- 옵셔널 템플릿 리터럴: a?현악기 
- 생성자 또는 옵셔널 체인 앞/뒤의 템플릿 리터럴: `new a?.b()`, `a?.b`string` 

다음은 일부 사용 사례가 있지만 지원되지 않습니다. 자세한 내용은 이슈 18번을 참조하십시오.

- 옵셔널 속성 할당: a?b = c
다음은 적어도 실제로는 그다지 의미가 없기 때문에 지원되지 않습니다. 이슈 4번(주석)를 참조하십시오:

- 옵셔널 super: super?.(), `super?.foo`
- 속성 액세스 또는 함수 호출과 유사하지만 새로운 것은 아닙니다.`new?.target`, `import?.('foo')` 등

위의 모든 사례는 문법이나 정적 의미론에 의해 금지되므로 나중에 지원이 추가될 수 있습니다.

## 범위를 벗어남
"옵셔널" 아이디어를 다른 구조에 적용하기 위한 다양한 흥미로운 아이디어가 있었습니다. 그러나 이 제안에는 일부가 없습니다. 

- 옵셔널 스프레드, 이슈 55번을 참조하십시오);
- 옵셔널 분해, 이슈 74번을 참조하십시오.

## 이슈 오픈
### 프라이빗 클래스 필드 및 메서드
이슈 28번: 옵셔널 체인은 `a?.#b`, `a?.#b()` 또는 `a?.b.#c`에서와 같이 다가오는 개인 [클래스 필드](https://github.com/tc39/proposal-class-fields) 및 [프라이빗 메서드](https://github.com/tc39/proposal-private-methods)를 지원해야 합니까?

[microsoft/TypeScript#30167(주석)](https://github.com/microsoft/TypeScript/issues/30167#issuecomment-468881537)인용입니다.

> 이것은 아직 제안서에 반영되지 않았습니다. 단지 사유지 자체가 아직 구워지지 않았기 때문입니다. 그래서 우리는 만약 이 제안이 지연된다면 이 제안을 보류하고 싶지 않습니다. 4단계에 도달하면, 우리는 그것을 다룰 것입니다.

</br>

## 자주 묻는 질문
**`obj?[expr]` 그리고 `func?.(arg)`는 보기 흉합니다. 왜 <language X>처럼 `obj?[expr]`와 `func?(arg)`를 사용하지 않습니까?**
- 우리는 `obj?[expr]` 및 `func?(arg)` 구문을 사용하지 않습니다. 파서가 이러한 형식을 조건부 연산자를 효율적으로 구분하기 어렵기 때문입니다. (예시: `obj?[expr].filter(fun):0` 와 `func?(x - 2) + 3 :1` )

이 두 가지 경우에 대한 대체 구문에는 각각 고유한 결함이 있습니다. 어느 것이 가장 덜 나빠 보이는지 결정하는 것은 대부분 개인 취향의 문제입니다. 우리가 선택한 방법은 다음과 같습니다.

- 가장 자주 발생할 것으로 예상되는 경우인 `obj?.prop` 경우에 가장 적합한 구문을 선택하십시오. 
- 인지할 수 있는 `?.` 문자 시퀀스의  obj?[expr], func?(arg). 와 같은 다른 케이스에 확장하십시오.

<language X>에 대해서는 <X에 의해 지원되지 않는 일부 구조 또는 X에서 다르게 작동하는 구조> 때문에 JavaScript와 다른 구문 제약을 가지고 있습니다.

**좋아요, 하지만 저는 정말로 <대체 구문>이 더 좋다고 생각합니다.**
- 다양한 대체 구문이 과거에 탐구되고 광범위하게 논의되었습니다. 그들 중 누구도 합의를 얻지 못했습니다. [“alternative syntax"이라는 레이블이 있는 이슈](https://github.com/tc39/proposal-optional-chaining/issues?utf8=%E2%9C%93&q=label%3A%22alternative+syntax%22)와 의미론에 영향을 미쳤던 ["대체 구문 및 의미" 레이블이 있는 이슈](https://github.com/tc39/proposal-optional-chaining/issues?utf8=%E2%9C%93&q=label%3A%22alternative+syntax+and+semantics%22)를 검색하십시오.

**`(null)?.b`가 `null`이 아닌 `undefined`로 평가되는 이유는 무엇입니까?**

`a.b`와 `a?.b` 모두 기본 객체 `a`에 대한 임의의 정보를 보존하기 위한 것이 아니라 해당 객체의 속성 `"b"`에 대한 정보만 제공하기 위한 것입니다. 속성 `"b"`가 `a`에 없으면 `a.b === undefined` 및 `a?.b === undefined`에 반영됩니다.

특히 `null` 값은 속성이 없는 것으로 간주됩니다. 따라서 `(null)?.b`는 `undefined`입니다.

**foo가 nullish도 아니고 호출 가능하지도 않은데 왜 `foo?.()`가 던집니까?**
예를 들어 핸들러 함수를 호출하는 라이브러리를 상상해 보십시오. onChange, 사용자가 제공했을 때. 사용자가 함수 대신 숫자 3을 제공하면 라이브러리는 오류를 발생시키고 사용자에게 잘못된 사용법을 알리려고 할 것입니다. 이것이 바로 onChange?.()에 대해 제안된 시맨틱이 달성하는 것입니다.

또한 이것은 ?를 보장합니다. 모든 경우에 일관된 의미를 갖습니다. 호출을 typeof foo === 'function'을 확인하는 특별한 경우로 만드는 대신 단순히 foo == null을 전반적으로 확인합니다.

마지막으로 선택적 연결은 오류 억제 메커니즘이 아님을 기억하십시오.

**긴 단축 평가를 원하는 이유는 무엇입니까?**
[이슈 3번의 주석](https://github.com/tc39/proposal-optional-chaining/issues/3#issuecomment-306791812)을 참조하십시오.

**`a?.b.c`에서 `a.b`가 `null`이면 `a.b.c`는 `undefined`으로 평가됩니다. 맞습니까?**
- 아니요. `a.b`의 속성 `"c"`를 가져오려고 할 때 TypeError가 발생합니다.

- Short-circuiting의 기회는 옵셔널 체이닝 연산자의 LHS를 평가한 직후에 한 번만 발생합니다. 해당 확인 결과가 부정적이면 평가가 정상적으로 진행됩니다.

- 즉, `?.` 연산자는 평가되는 바로 그 순간에만 효과가 있습니다. 후속 속성 액세스, 메서드 또는 함수 호출의 의미 체계를 변경하지 않습니다.

**`a?.b?.c`와 같이 깊게 중첩된 체인에서는 왜 각 계층에서 `?`를 써야 합니까? 체인 전체에 대해 연산자를 한 번만 쓸 수 있으면 안 됩니까?**
- 설계상 개발자는 `null`/`undefined`로 예상되는 각 위치를 표시하고 해당 위치만 표시할 수 있습니다. 실제로 가능성이 있는 버그의 증상인 예상치 못한 `null`/`undefined`는 숨기기 보다는 TypeError로 보고되어야 한다고 생각합니다.

**...하지만 깊게 중첩된 체인의 경우 거의 항상 각 계층에서 `null`/`undefined`를 테스트하고 싶습니다. 그렇지 않습니까?**
- 깊이 중첩된 트리와 같은 구조는 선택적 체인의 유일한 사용 사례가 아닙니다.

- 또한 [CoffeeScript의 옵셔널 체이닝에 대한 사용 통계](https://github.com/tc39/proposal-optional-chaining/issues/17) 및 "전체 흡수 작업" 과 "다른 흡수 위에 연결된 전체 흡수 작업" 비교를 참고하십시오.

**이 기능은 오류 억제 연산자처럼 보이죠?**
아니요. 옵셔널 체이닝은 일부 값이 `undefined` 또는 `null`인지 확인합니다. 주변 코드를 평가하여 발생한 오류를 포착하거나 억제하지 않습니다. 다음은 예시입니다.
```js
(function () {
    "use strict"
    undeclared_var?.b    // ReferenceError: undeclared_var is not defined
    arguments?.callee    // TypeError: 'callee' may not be accessed in strict mode
    arguments.callee?.() // TypeError: 'callee' may not be accessed in strict mode
    true?.()             // TypeError: true is not a function
})()
```

## 명세
https://tc39.github.io/proposal-optional-chaining/ 를 참고하십시오.

## 지원 
- 엔진, [이슈 115번](https://github.com/tc39/proposal-optional-chaining/issues/115)을 참고하십시오.
- 도구, [이슈 44번](https://github.com/tc39/proposal-optional-chaining/issues/44)을 참고하십시오.

## 위원회 논의
- [2019년 6월](https://github.com/rwaldron/tc39-notes/blob/7a4af23de5c3aa5ac9f68ec6c40e5677a72a56b1/meetings/2019-06/june-5.md#optional-chaining-for-stage-2)
- [2018년 11월](https://github.com/rwaldron/tc39-notes/blob/def2ee0c04bc91612576237314a4f3b1fe2edaef/meetings/2018-11/nov-28.md#update-on-optional-chaining)
- [2018년 5월](https://github.com/rwaldron/tc39-notes/blob/def2ee0c04bc91612576237314a4f3b1fe2edaef/meetings/2018-03/mar-22.md#optional-chaining-for-stage-2) 
- [2018년 1월](https://github.com/rwaldron/tc39-notes/blob/def2ee0c04bc91612576237314a4f3b1fe2edaef/meetings/2018-01/jan-24.md#13iiin-optional-chaining-update) 
- [2017년 9월](https://github.com/rwaldron/tc39-notes/blob/def2ee0c04bc91612576237314a4f3b1fe2edaef/meetings/2017-09/sept-27.md#12iiib-optional-chaining-operator-for-stage-2)
- [2017년 7월](https://github.com/rwaldron/tc39-notes/blob/def2ee0c04bc91612576237314a4f3b1fe2edaef/meetings/2017-07/jul-27.md#13iia-optional-chaining-operator)

## 참고
- [TC39 Slide Deck: Null Propagation Operator](https://docs.google.com/presentation/d/11O_wIBBbZgE1bMVRJI8kGnmC6dWCBOwutbN9SWOK0fU/edit#slide=id.p)
- [es-optional-chaining](https://github.com/claudepache/es-optional-chaining) (@claudepache)
- [ecmascript-optionals-proposal](https://github.com/davidyaha/ecmascript-optionals-proposal) (@davidyaha)

## 관련 이슈
- [Babylon implementation](https://github.com/babel/babylon/issues/328)
- [estree: Null Propagation Operator](https://github.com/estree/estree/issues/146)
- [TypeScript: Suggestion: "safe navigation operator"](https://github.com/Microsoft/TypeScript/issues/16)
- [Flow: Syntax for handling nullable variables](https://github.com/facebook/flow/issues/607)

## Prior discussion
- https://esdiscuss.org/topic/existential-operator-null-propagation-operator
- https://esdiscuss.org/topic/optional-chaining-aka-existential-operator-null-propagation
- https://esdiscuss.org/topic/specifying-the-existential-operator-using-abrupt-completion
