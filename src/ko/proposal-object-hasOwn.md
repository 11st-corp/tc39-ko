
# 접근 가능한 `Object.prototype.hasOwnProperty()`

`Object.prototype.hasOwnProperty()`를 더 접근가능 하도록 만드는 `Object.hasOwn()` 메서드에 대한 제안서입니다.


## 👋 현재 커뮤니티 피드백 수집중

현재 당신의 코드 내의 `Object.hasOwn()`에 사용할 수 있는 폴리필과 codemod에 대한 [구현](#implementations)섹션을 확인하시길 바랍니다.

만약 `Object.hasOwn()`를 사용하고 있다면, [issue #18](https://github.com/tc39/proposal-accessible-object-hasownproperty/issues/18)에 피드백을 남겨주세요. (긍정적인 피드백이나 부정적인 피드백 모두 권장합니다.)

## 상태
해당 제안서는 현재 [4단계](https://github.com/tc39/proposals/blob/master/finished-proposals.md)에 있습니다.

작성자:

- [@jamiebuilds](https://github.com/jamiebuilds) (Jamie Kyle, Rome)
- 투사: [@bnb](https://github.com/bnb) (Tierney Cyren, Microsoft)

슬라이드:

- [1단계](https://docs.google.com/presentation/d/1FvDwrmzin_qGMzH-Cc8l5bHK91UxkpZJwuugoay5aNQ/edit#slide=id.p)  [2021/04](https://github.com/tc39/agendas/blob/master/2021/04.md)에 제작 (2단계 도달)
- [2단계](https://docs.google.com/presentation/d/1r5_Jw-gR8cRNo7SJyWtd6h_fEyVFJr9t3a2FvCBPiLE/edit?usp=sharing)  [2021/05](https://github.com/tc39/agendas/blob/master/2021/05.md)에 제작 (3단계 도달)
- [3단계 업데이트](https://docs.google.com/presentation/d/1UbbNOjNB6XpMGo1GGwl0b8lVsNoCPPPLBByPYc7i5IY/edit?usp=sharing) 2021/07에 제작
- [4단계](https://docs.google.com/presentation/d/177vM52Cd6Dij-ta6vmw4Wi1sCKrzbCKjavSBpbdz9fM/edit?usp=sharing) 2021/08에 제작 (4단계 도달)

## 제안 동기

현재, 아래와 같이 코드를 작성하는 것은 (특히 라이브러리 내에서) 일반적입니다.
```js
let hasOwnProperty = Object.prototype.hasOwnProperty

if (hasOwnProperty.call(object, "foo")) {
  console.log("has property foo")
}
```

이 제안서는 위의 코드를 아래와 같이 간략하게 할 수 있습니다.
```js
if (Object.hasOwn(object, "foo")) {
  console.log("has property foo")
}
```

이러한 편리함을 제공하는 몇 가지 라이브러리입니다.

- [npm: has][npm-has]
- [npm: lodash.has][npm-lodash-has]
- [See Related](#related)

이 것은 `Object.prototype`의 메서드를 사용하지 못하거나 재선언될 수 있기 때문에 일반적인 방법입니다.


### `Object.create(null)`

`Object.create(null)` 는 `Object.prototype`를 상속받지 않는 객체를 생성하므로, 이 것이 가진 메서드에 대해 접근이 불가능합니다.

```js
Object.create(null).hasOwnProperty("foo")
// Uncaught TypeError: Object.create(...).hasOwnProperty is not a function
```

### `hasOwnProperty`의 재정의

객체에 정의되어 있는 속성을 직접적으로 소유하지 않는 경우, 당신은 내장 함수인 `.hasOwnProperty()`의 호출을 100% 확신할 수 없습니다.

```js
let object = {
  hasOwnProperty() {
    throw new Error("gotcha!")
  }
}

object.hasOwnProperty("foo")
// Uncaught Error: gotcha!
```

### ESLint의 `no-prototype-builtins` 규칙

ESLint는  `hasOwnProperty`와 같은 프로토타입 내장객체의 사용을 금지하는 [내장 규칙][eslint-no-prototype-builtins]을 가집니다.

> **the ESLint 공식 문서의 `no-prototype-builtins`에 대한 설명**
>
> ---
>
> 해당 규칙에 대한 잘못된 예
>
> ```js
> /*eslint no-prototype-builtins: "error"*/
> var hasBarProperty = foo.hasOwnProperty("bar");
> ...
> ```
>
> 해당 규칙에 대한 올바른 예
>
> ```js
> /*eslint no-prototype-builtins: "error"*/
> var hasBarProperty = Object.prototype.hasOwnProperty.call(foo, "bar");
> ...
> ```
>

### MDN의 `hasOwnProperty()` 에 대한 조언

MDN 공식문서는 `Object.prototype.hasOwnProperty`에 대해 프로토타입 체인의 메서드를 직접적으로 사용하지 말라는 [조언][mdn-hasownproperty-advice]을 포함합니다.

> JavaScript는 hasOwnProperty 속성의 이름을 보호하지 않습니다. 그래서 객체가 이 이름의 속성을 가질 수 있다는 가능성이 존재한다면, 올바른 결과값을 가지기 위해서 외부의 hasOwnProperty를 사용할 필요가 있습니다. ....

## 제안

이 제안은 `hasOwnProperty.call(object, property)`의 호출과 동일한 동작을 하는 `Object.hasOwn(object, property)`메서드를 포함합니다.

```js
let object = { foo: false }
Object.hasOwn(object, "foo") // true

let object2 = Object.create({ foo: true })
Object.hasOwn(object2, "foo") // false

let object3 = Object.create(null)
Object.hasOwn(object3, "foo") // false
```

## 구현사항

JavaScript 엔진 내의 `Object.hasOwn`이 사용가능한 기본 구현은 아래에 있습니다.

- 브라우저:
    - [V8](https://chromium-review.googlesource.com/c/v8/v8/+/2922117) ([shipped](https://v8.dev/blog/v8-release-93))
    - [SpiderMonkey](https://hg.mozilla.org/try/rev/94515f78324e83d4fd84f4b0ab764b34aabe6d80) (feature-flagged)
    - [JavaScriptCore](https://bugs.webkit.org/show_bug.cgi?id=226291#c2) (in-progress)
- 그외에:
    - [SerenityOS: LibJS](https://github.com/SerenityOS/serenity/commit/3ee092cd0cacb999469e50aa5ff220e397df2d79)
    - [engine262](https://github.com/engine262/engine262/pull/163)

`Object.hasOwn()`의 폴리필은 아래에 있습니다.

- [./polyfill.js](./polyfill.js)
- [npm: object.hasown](https://www.npmjs.com/package/object.hasown)
- [core-js](https://github.com/zloirock/core-js/#accessible-objecthasownproperty)

유사한 라이브러리들에서부터 `Object.hasOwn()`로 마이그레이션하기 위한 codemod는 아래에 있습니다.

- [`Object.hasOwn()` codemod](https://gist.github.com/jamiebuilds/f4ff76397d31b69c484240379170af8c)

`hasOwnProperty` 대신 `hasOwn`로 사용하도록 강제하는 eslint 규칙은 아래에 있습니다.

- [`unicorn/prefer-object-has-own`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-object-has-own.md)

## 질의 응답

### 왜 `Object.hasOwnProperty(object, property)`가 아닌가요?

현재 이미 존재하고 있는 `Object.hasOwnProperty(property)`는 `Object.prototype`로부터 `Object`가 상속받은 것입니다.  그러므로 다른 시그니처를 가진 새로운 메서드를 정의하는 변화가 필요합니다.

### 왜 이름이  `hasOwn`인가요?

[이슈 #3](https://github.com/tc39/proposal-accessible-object-hasownproperty/issues/3)를 확인하세요.

### 객체 대신 딕셔너리의 `Map`을 사용하는 것은 어떻습니까?

https://v8.dev/features/object-fromentries#objects-vs.-maps의 발췌문입니다.

> JavaScript는 일반적인 객체보다 조금 더 적합한 데이터 구조로 사용되는 Maps 또한 제공합니다. 그래서 완벽하게 통제가 가능한 코드 내에서는 객체 대신 map을 사용할 수 있습니다. 그러나 개발자로서 항상 확신하지는 못합니다. 가끔 당신이 다루는 데이터는 외부의 API나 라이브러리 함수 들로부터 map이 아닌 객체로 제공됩니다.

### `Reflect`에 해당 메서드가 제공되나요?

`Reflect`의 의도는 `Proxy` 트랩에 대한 메서드를 1:1로 포함하는 것입니다.  `Proxy`에는 이미 `hasOwnProperty` (`getOwnPropertyDescriptor`)를 트랩하는 메서드가 존재합니다. 그러므로 추가적인 트랩을 추가하는 것은 올바르지 않으며,  `Reflect`에 해당 메서드를 포함시키는 것 또한 올바르지 않습니다.


## 관련 문서

- [npm: `has`][npm-has]
- [npm: `lodash.has`][npm-lodash-has]
- [underscore `_.has`][underscore-has]
- [npm: `just-has`][npm-just-has]
- [ramda: `R.has`][ramda-has]
- [eslint `no-prototype-builtins`][eslint-no-prototype-builtins]
- [MDN `hasOwnProperty()` advice][mdn-hasownproperty-advice]

[npm-has]: https://www.npmjs.com/package/has
[npm-lodash-has]: https://www.npmjs.com/package/lodash.has
[underscore-has]: https://underscorejs.org/#has
[npm-just-has]: https://www.npmjs.com/package/just-has
[ramda-has]: https://ramdajs.com/docs/#has
[eslint-no-prototype-builtins]: https://eslint.org/docs/rules/no-prototype-builtins
[mdn-hasownproperty-advice]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty#using_hasownproperty_as_a_property_name