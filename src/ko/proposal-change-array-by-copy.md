> **Note**
> 본 제안서는 ['finished'](https://github.com/tc39/proposals/blob/main/finished-proposals.md) 되었고 ECMAScript 사양에 병합되었습니다. [PR](https://github.com/tc39/ecma262/pull/2997)

# Change Array by copy

변경된 새로운 복사본을 반환함으로써 배열을 변경할 수 있게 `Array.prototype`과 `TypedArray.prototype`에 메서드를 추가합니다.

## 상태
본 제안서는 햔제 [Stage 4] 입니다.

[Stage 4]: https://github.com/tc39/proposals/commit/ad4df8435f27f39eda26db3b940ae151980c8015#diff-af1d66eb7dbbf6f66e871d26bcad07076a557256a957f558ca21e60924e2b0b7
[spec]: https://github.com/tc39/ecma262/pull/2997/files

## 챔피언
- Robin Ricard (Bloomberg)
- Ashley Claymore (Bloomberg)

## 리뷰어
- [Jordan Harband](https://github.com/ljharb)
- [Justin Ridgewell](https://github.com/jridgewell)
- [Sergey Rubanov](https://github.com/chicoxyzzy)

## 개요

이 제안은 Array.prototype에 대하여 다음과 같은 함수 기능을 소개한다.
- `Array.prototype.toReversed() -> Array`
- `Array.prototype.toSorted(compareFn) -> Array`
- `Array.prototype.toSpliced(start, deleteCount, ...items) -> Array`
- `Array.prototype.with(index, value) -> Array`

위의 모든 메서드들은 대상 배열을 건드리지 않고, 변경이 수행된 복사본을 반환합니다.

`toReversed`, `toSorted` 그리고 `with`는 TypedArray에도 마찬가지로 추가될 것입니다.
- `TypedArray.prototype.toReversed() -> TypedArray`
- `TypedArray.prototype.toSorted(compareFn) -> TypedArray`
- `TypedArray.prototype.with(index, value) -> TypedArray`

이 메서드들은 `TypedArray`의 하위 클래스에서도 유효할 것입니다. 예를 들면 다음과 같습니다.
- `Int8Array`
- `Uint8Array`
- `Uint8ClampedArray`
- `Int16Array`
- `Uint16Array`
- `Int32Array`
- `Uint32Array`
- `Float32Array`
- `Float64Array`
- `BigInt64Array`
- `BigUint64Array`

### 예제
```js
const sequence = [1, 2, 3];
sequence.toReversed(); // => [3, 2, 1]
sequence; // => [1, 2, 3]

const outOfOrder = new Uint8Array([3, 1, 2]);
outOfOrder.toSorted(); // => Uint8Array [1, 2, 3]
outOfOrder; // => Uint8Array [3, 1, 2]

const correctionNeeded = [1, 1, 3];
correctionNeeded.with(1, 2); // => [1, 2, 3]
correctionNeeded; // => [1, 1, 3]
```

## 제안 동기
[`Tuple.prototype`](https://tc39.es/proposal-record-tuple/#sec-properties-of-the-tuple-prototype-object)은 [Record & Tuple](https://github.com/tc39/proposal-record-tuple)에서 튜플의 불변성 측면을 다루는 방법으로 이러한 함수들을 도입합니다. 배열은 본래 불변이 아니지만, 이러한 프로그래밍 스타일은 동결된(frozen) 배열을 다루는 사용자에게 유용할 수 있습니다.

이 제안은 특히 배열과 튜플을 상호 교환 가능하게 다룰 수 있는 코드를 작성하는 것을 더 쉽게 해줍니다.

## [Record & Tuple](https://github.com/tc39/proposal-record-tuple)과의 관계
본 제안이 [Record & Tuple](https://github.com/tc39/proposal-record-tuple)로 부터 출발했지만, 독립적으로 진행되어야 합니다.

웹 호환성이 필요한 경우, 이 제안에서 정의돈 속성의 이름들은 변경될 수 있습니다. 그러한 변경사항들은 [`Tuple.prototype`](https://tc39.es/proposal-record-tuple/#sec-properties-of-the-tuple-prototype-object)에도 반영되어야 합니다.

## 구현

 - [Firefox/SpiderMonkey](https://bugzilla.mozilla.org/show_bug.cgi?id=1729563), currently flagged
 - [Safari/JavaScriptCore](https://bugs.webkit.org/show_bug.cgi?id=234604), shipping unflagged since [Safari Tech Preview 146](https://developer.apple.com/safari/technology-preview/release-notes/#:~:text=bug%20tracker.-,Release%20146,-Note%3A%20Tab)
 - [Chrome/V8](https://bugs.chromium.org/p/v8/issues/detail?id=12764), shipping unflagged since Chrome 110

 - [Ladybird/LibJS](https://github.com/SerenityOS/serenity/issues/16353), shipping unflagged

 - [core-js](https://github.com/zloirock/core-js)
   - [change-array-by-copy](https://github.com/zloirock/core-js#change-array-by-copy)

 - [es-shims](https://github.com/es-shims):
   - [`array.prototype.tosorted`](https://www.npmjs.com/package/array.prototype.tosorted)
   - [`array.prototype.toreversed`](https://www.npmjs.com/package/array.prototype.toreversed)
   - [`array.prototype.tospliced`](https://www.npmjs.com/package/array.prototype.tospliced)
   - [`array.prototype.with`](https://www.npmjs.com/package/array.prototype.with)

- [./polyfill.js](./polyfill.js) (minimalist reference implementation)