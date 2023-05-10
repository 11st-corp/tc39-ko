# Object Rest/Spread Properties for ECMAScript

ECMAScript 6은 배열 구조 분해 할당을 위한 [나머지 요소](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)와 배열 리터럴을 위한 [전개 요소](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)를 도입합니다.

본 제안서는 객체 구조 분해 할당을 위한 유사한 [나머지 속성](https://github.com/tc39/proposal-object-rest-spread/blob/main/Rest.md)과 객체 리터럴을 위한 [전개 속성](https://github.com/tc39/proposal-object-rest-spread/blob/main/Spread.md)을 도입합니다.

## [명세서](https://tc39.es/proposal-object-rest-spread/)
[명세](https://tc39.es/proposal-object-rest-spread/)

## [나머지 속성](https://github.com/tc39/proposal-object-rest-spread/blob/main/Rest.md)
나머지 속성은 구조 분해 패턴에 의해 아직 선택되지 않은 나머지 자체 열거 가능한 속성 키를 수집합니다. 이러한 키와 값은 새 객체에 복사됩니다.
```js
let { x, y, ...z } = { x: 1, y: 2, a: 3, b: 4 };
x; // 1
y; // 2
z; // { a: 3, b: 4 }
```

## [전개 속성](https://github.com/tc39/proposal-object-rest-spread/blob/main/Spread.md)

객체 초기자의 전개 속성 제공된 객체에서 새로 생성된 객체로 자체 열거 가능한 속성을 복사합니다.
```js
let n = { x, y, ...z };
n; // { x: 1, y: 2, a: 3, b: 4 }
```

## 트랜스파일러
Babel

[Bublé](https://github.com/bublejs/buble)

[JSTransform](https://github.com/facebookarchive/jstransform)

[TypeScript](https://github.com/Microsoft/TypeScript)


## [본 제안의 상태](https://github.com/tc39/ecma262)
ECMAScript에 대한 4단계 제안입니다.

## [알려진 이슈](https://github.com/tc39/proposal-object-rest-spread/blob/main/Issues.md)
본 제안은 특정 속성에 대해서만 반복합니다. [이것이 왜 중요한지 알아보십시오.](https://github.com/tc39/proposal-object-rest-spread/blob/main/Issues.md)