# Array.prototype.includes Proposal

[https://github.com/tc39/proposal-Array.prototype.includes](https://github.com/tc39/proposal-Array.prototype.includes)

## Status

이 제안은 공식적으로 [TC39 프로세스](https://tc39.es/process-document/)에서 stage 4단계에 있으며, spec에 통합되는 과정에 있습니다.

이 제안의 예전 이름은 `Array.prototype.contains` 였는데, 이름이 [web-compatible](https://esdiscuss.org/topic/having-a-non-enumerable-array-prototype-contains-may-not-be-web-compatible)하지 않았습니다. 2014년 TC39 11월 회의에서 `String.prototype.contains`와 `Array.prototype.contains`는 둘 다 `includes`로 이름이 변경되면서 최악의 상황은 피하게 되었습니다.

## Motivation

ECMAScript 배열을 사용하다 보면, 배열이 요소를 가지고 있는지 판별하는 일이 흔합니다. 널리 알려진 패턴은 다음과 같은데요

```jsx
if(arr.indexOf(el) !== -1){
  ...
}
```

다양한 다른 방법들도 많습니다. 예를 들어 `arr.indexOf(el) >= 0`, 더 나아가면 `~arr.indexOf(el)` 처럼 말이죠.

- 참고 : tilt 연산자(`~`) 는 2의 보수(`-(n+1)`)와 같음

이 패턴들은 두 개의 문제가 있습니다.

- 이들은 무슨 의미인지 파악하기 어렵습니다. 배열이 요소를 가지고 있는지 묻는것이 아니라 처음 발생하는 인덱스가 무엇인지를 물어본 다음 비교하거나 bit-twiddle 해서 실제 질문에 답하는 방법입니다.
- 이들은 `NaN`에 대해서는 실패합니다. `indexOf`가 Strict Equality Comparison을 사용하기 때문입니다. 따라서 `[NaN].indexOf(NaN) === -1` 입니다.

## Propsed Solution

우리는 `Array.prototype.includes` 메서드를 추가하는 것을 제안합니다. 위의 패턴은 아래 패턴으로 재작성 될 수 있습니다.

```jsx
if(arr.includes(el)){
  ...
}
```

이것은 위의 코드와 거의 비슷한 의미를 지닙니다. Strict Equality 비교와 달리 SameValueZero 비교 알고리즘을 사용한다는 것 빼고요. 이것이 `[NaN].includes(NaN)`을 참으로 만들어줍니다.

따라서, 이 제안은 기존 코드의 두 가지 문제를 모두 해결합니다.

우리는 `Array.prototype.indexOf`나 `String.prototype.includes`와 비슷하게 `fromIndex` 파라미터를 추가하여 일관성을 유지하도록 했습니다.

## FAQs

### 왜 `has`가 아니라 `includes` 입니까?

존재하는 API들을 조사해보면, `has`는 개념적 `key` 의 의미로 사용됩니다. 그러나 `includes` 는 개념적 `values` 로 사용됩니다.

- key-value 맵 안에서의 `key`들:
    
    `Map.prototype.has(key)`, `WeakMap.prototype.has(key)`, `Reflect.has(target, propertyKey)`
    
- `Sets`의 요소는 `key`와 `value` 둘 다를 가질 수 있습니다:
`Set.prototype.has(value)`, `WeakSet.prototype.has(value)`, `Reflect.Loader.prototype.has(name)`
- Strings은 개념적으로 인덱스에서 코드 포인트들로 매핑되는 문자열입니다:
    
    `String.prototype.includes(searchString, position)`
    

여기서 가장 일관성을 가지는 것은 `Map`이나 `Set`이 아니라 `String`입니다.

웹에는 배열과 유사한(array-like) `DOMStringList` 및 `DOMTokenList`와 같은 클래스들이 있으며 우리의 `includes`와 같은 의미를 지니는 `contains`가 있습니다. 불행히도 위에서 설명한 것처럼 이러한 항목과의 연결은 웹 호환이 되지 않습니다. 이러한 일관되지 않음을 받아들여야 합니다.

### 하지만 `String.prototype.includes` 은 문자가 아닌 문자열에서 동작하네요!?

맞아요. `String.prototype.indexOf` 과 `String.prototype.includes` 은 단일 문자의 특수한 경우 `Array.prototype`과 비슷하게 동작한다고 생각하는게 좋습니다. 그러나 문자열 버전은 더 큰 문자열의 일반적인 경우에도 사용될 수 있어요.

그리하여 `String.prototype.includes` 과 `Array.prototype.includes` 의 관계는 `String.prototype.indexOf` 과 `Array.prototype.indexOf` 의 관계와 같아요.

### 왜 SameValueZero를 씁니까?

현재의 ES6에는 4가지의 equality 알고리즘들이 존재합니다.

- Abstract Equality Comparison (`==`)
- Strict Equality Comparison (`===`) : `Array.prototype.indexOf`, `Array.prototype.lastIndexOf` 에서 사용됩니다. 그리고 case 매칭에서도
- SameValueZero : `TypedArray` 와 `ArrayBuffer` 구조에서 사용됩니다. `Map`과 `Set`에서도요.
- SameValue : 다른 모든 곳에서 사용됩니다.

(SameValue가 사용되는 곳에는 SameValueZero로 대체될 수 있습니다. 왜냐하면 사용되는 곳에서는 primitives들을 비교하지 않고, 적어도 숫자들은 비교하지 않습니다.)

물론, Abstract Equality Comparison을 사용하는 것은 미친 짓일 것입니다. SameValue를 사용하는 것은 `Map`과 `Set`에서 사용하지 않는 것과 같은 이유로 좋은 아이디어가 아닙니다. (간략히 : `-0` 은 산술 연산을 통해 꽤 쉽게 당신의 코드로 잠입할 수 있지만, 당신은 `-0` 과 `+0` 이 항상 같은 값을 가지기를 원하기 때문에 이를 구별하는 것은 가짜 오류를 발생시킬 뿐입니다.) 이제 남은건 Strict Equality Comparison과 SameValueZero 뿐이네요.

SameValueZero가 일반적으로 더 나은 선택입니다. 왜냐하면 `NaN`이 배열에 포함하는지를 감지할 수 있으니까요. Strict Equality Comparison에 대한 주장은 `Array.prototype.indexOf`와의 버그 호환성으로 귀결됩니다. 하지만 `Array.prototype.includes`의 목적 중 하나는 그런 종류의 버그를 없애는 것이었죠.

이는 `Array.prototype.indexOf` 를 `Array.prototype.includes` 로 리팩토링 해야하는 약간의 위험이 발생합니다 : `NaN`이 포함된 배열에서는 분명히 다르게 동작하니까요. 하지만, 이 리팩토링을 통해 코드는 버그 발생 확률이 낮아질 것으로 보입니다. 새로운 방법을 소개하고, 적절한 메시지를 제공하는 것이 도움이 될 것입니다.

## Typed Arrays

모든 변경되지 않는 배열 메서드들처럼, 이 메서드를 `TypedArray.prototype`에도 설치할 것입니다.

## 실제 예시

```jsx
assert([1, 2, 3].includes(2) === true);
assert([1, 2, 3].includes(4) === false);

assert([1, 2, NaN].includes(NaN) === true);

assert([1, 2, -0].includes(+0) === true);
assert([1, 2, +0].includes(-0) === true);

assert(["a", "b", "c"].includes("a") === true);
assert(["a", "b", "c"].includes("a", 1) === false);
```