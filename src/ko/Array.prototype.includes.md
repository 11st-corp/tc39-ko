# Array.prototype.includes Proposal

[명세서](https://github.com/tc39/proposal-Array.prototype.includes)

## 상태

본 제안서는 공식적으로 [TC39 프로세스](https://tc39.es/process-document/)에서 4단계에 있으며, 명세서에 통합되는 과정에 있습니다.

본 제안서는 이전에 `Array.prototype.contains` 이었지만, 해당 이름은 [웹 호환적](https://esdiscuss.org/topic/having-a-non-enumerable-array-prototype-contains-may-not-be-web-compatible)이지 않았습니다. 2014년 TC39 11월 회의에서 `String.prototype.contains`와 `Array.prototype.contains`의 이름은 최악의 상황을 피하기 위해 `includes`로 변경되었습니다.

## 동기

ECMAScript 배열을 사용하다 보면, 배열에 어떤 요소가 포함되어 있는지 확인하고 싶을 때가 흔히 있습니다. 널리 알려진 패턴은 다음과 같은데요

```js
if(arr.indexOf(el) !== -1){
  ...
}
```

다양한 다른 방법들도 많습니다. 예를 들어 `arr.indexOf(el) >= 0`, 더 나아가면 `~arr.indexOf(el)`<sup>[1]('note1')</sup> 가 있습니다.

> <a name='note1'>1.</a> tilt 연산자(`~`) 는 2의 보수(`-(n+1)`)와 같음

이러한 패턴은 두 가지 문제를 발생시킵니다.

- 그들은 무슨 의미인지 파악하기 어렵습니다. 배열에 요소가 포함되어 있는지 묻는 대신 배열에서 해당 요소가 처음 나타나는 인덱스가 무엇인지 묻고 비교하거나 bit-twiddle <sup>[2]('note2')</sup> 해서 실제 질문에 답하는 방법입니다.
- `indexOf`는 엄격 동등 비교를 사용하므로 `[NaN].indexOf(NaN) === -1`이기 때문에 `NaN`에 대해 실패합니다.

> <a name='note2'>2.</a> [bit twiddle](https://en.wikipedia.org/wiki/Bit_twiddler)

## 제안된 해결책

위의 패턴을 다음과 같이 작성할 수 있도록, `Array.prototype.includes` 메서드를 추가할 것을 제안합니다.

```js
if(arr.includes(el)){
  ...
}
```

이것은 엄격 동등 비교 대신 SameValueZero 비교 알고리즘을 사용하여 `[NaN].includes(NaN)`을 참으로 만든다는 점을 제외하면 위와 거의 동일한 의미를 갖습니다.

따라서, 이 제안은 기존 코드의 두 가지 문제를 모두 해결합니다.

일관성을 위해 `Array.prototype.indexOf` 및 `String.prototype.includes`와 유사한 `fromIndex` 매개변수를 추가하였습니다.

## 자주 묻는 질문들

### 왜 `has`가 아니라 `includes` 입니까?

존재하는 API들을 조사해보면, `has`는 개념적 "keys" 의 의미로 사용됩니다. 그러나 `includes` 는 개념적 "values" 로 사용됩니다.

- key-value 맵 안에서의 keys: `Map.prototype.has(key)`, `WeakMap.prototype.has(key)`, `Reflect.has(target, propertyKey)`
- 요소가 개념적으로 keys와 values인 sets: `Set.prototype.has(value)`, `WeakSet.prototype.has(value)`, `Reflect.Loader.prototype.has(name)`
- 인덱스에서 코드 포인트로 개념적으로 매핑되는 문자열: `String.prototype.includes(searchString, position)`
    

여기서 가장 일관성을 가지는 것은 `Map`이나 `Set`이 아니라 `String`입니다.

웹에는 유사 배열인 [DOMStringList](https://developer.mozilla.org/en-US/docs/Web/API/DOMStringList) 및 [DOMTokenList](https://dom.spec.whatwg.org/#interface-domtokenlist)와 같은 클래스가 있으며, `includes`와 같은 의미를 가진 `contains`이라는 메서드가 있습니다. 불행하게도 위에서 설명한 것처럼 이들과의 연결은 웹과 호환이 되지 않습니다. 우리는 이러한 일관되지 않음을 받아들여야 할 것입니다.

### 하지만 `String.prototype.includes` 은 문자가 아닌 문자열에서 동작하네요!?

예. 사실입니다. `String.prototype.indexOf` 및 `String.prototype.includes`는 단일 문자의 특수한 경우 `Array.prototype`과 비슷하게 동작한다고 생각하는게 좋습니다. 그러나 문자열 버전은 더 큰 문자열의 일반적인 경우에도 사용할 수 있습니다.

그래서 이러한 방식으로, `String.prototype.includes`와 `Array.prototype.includes`의 관계는 `String.prototype.indexOf`와 `Array.prototype.indexOf` 의 관계와 동일합니다.

### 왜 SameValueZero인가?

현재 ES6 draft에는 4개의 동등 알고리즘이 존재합니다.

- 추상 동등 비교 (`==`)
- 엄격 동등 비교 (`===`) : `Array.prototype.indexOf`, `Array.prototype.lastIndexOf` 그리고 `case` 매칭에서 사용.
- SameValueZero : `TypedArray` 와 `ArrayBuffer` 생성자, `Map`과 `Set` 연산에서 사용.
- SameValue : 다른 모든 곳에서 사용.

(그러나 SameValue가 사용되는 곳에는 SameValueZero로 대체될 수 있습니다. 사용되는 곳에서는 종종 원시 값들을 비교하지 않거나, 최소한 숫자들은 비교하지 않기 때문입니다.)

물론, 추상 동등 비교를 사용하는 것은 미친 짓일 것입니다. SameValue를 사용하는 것은 `Map`과 `Set`에서 사용하지 않는 것과 같은 이유로 좋은 아이디어가 아닙니다. (간략히 : `-0` 은 산술 연산을 통해 꽤 쉽게 당신의 코드로 잠입할 수 있지만, 당신은 `-0` 과 `+0` 가 거의 항상 같은 값을 가지기를 원하기 때문에 이를 구별하는 것은 가짜 오류를 발생시킬 뿐입니다.) 이제 남은건 엄격 동등 비교와 SameValueZero 두 가지 입니다.

`NaN`이 배열에 포함하는지를 감지할 수 있으므로, SameValueZero가 일반적으로 더 나은 선택입니다. 엄격 동등 비교에 대한 주장은 `Array.prototype.indexOf`와의 '버그 호환성'으로 귀결됩니다. 하지만 `Array.prototype.includes`의 목적 중 하나는 이러한 종류의 버그를 만들지 않도록 하는 것입니다.

이로 인해 `Array.prototype.indexOf`에서 `Array.prototype.includes`로 약간의 리팩토링 위험이 발생합니다. 실제로 `NaN`을 포함하는 배열에대해 다르게 동작합니다. 하지만, 이 리팩토링을 통해 문제가 발생하는 것보다 코드의 버그가 줄어들 가능성이 훨씬 높아 보입니다. 새로운 방법을 소개하고, 이 예시에 대한 적절한 메시지를 함께 제공하면 도움이 될 것입니다.

## Typed Arrays

모든 변경되지 않는 배열 메서드와 마찬가지로, 이 메서드를 `%TypedArray%.prototype`에도 존재할 것입니다.

## 설명을 위한 예시

```js
assert([1, 2, 3].includes(2) === true);
assert([1, 2, 3].includes(4) === false);

assert([1, 2, NaN].includes(NaN) === true);

assert([1, 2, -0].includes(+0) === true);
assert([1, 2, +0].includes(-0) === true);

assert(["a", "b", "c"].includes("a") === true);
assert(["a", "b", "c"].includes("a", 1) === false);
```