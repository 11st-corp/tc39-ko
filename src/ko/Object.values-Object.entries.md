# [Object.values](https://github.com/es-shims/Object.values) / [Object.entries](https://github.com/es-shims/Object.entries)

`Object.values`/`Object.entries` 에 대한 ECMAScript 제안, 사양 및 참조 구현.
  
[@ljharb](https://github.com/ljharb) 가 초안을 작성한 사양.

본 제안서는 [전체과정](https://tc39.github.io/process-document/)에서 [4단계](https://github.com/tc39/ecma262)에 있으며 ES2017에 포함될 예정입니다.

지정된 TC39 검토자: @wycats @littledan @rwaldron

[Engine Implementations(엔진 구현)](https://github.com/tc39/proposal-object-values-entries/issues/10)

## 이전 토론

- [TC39 회의록](https://github.com/rwaldron/tc39-notes/blob/c61f48cea5f2339a1ec65ca89827c8cff170779b/es6/2014-04/apr-9.md#51-objectentries-objectvalues)
- esdiscuss:
- [https://esdiscuss.org/topic/object-entries-object-values](https://esdiscuss.org/topic/object-entries-object-values)
- [https://esdiscuss.org/topic/es6-iteration-over-object-values](https://esdiscuss.org/topic/es6-iteration-over-object-values)
- [https://esdiscuss.org/topic/object-values-and-or-object-foreach](https://esdiscuss.org/topic/object-values-and-or-object-foreach) -> [https://esdiscuss.org/topic/iteration-was-re-object-values-and-or-object-foreach](https://esdiscuss.org/topic/iteration-was-re-object-values-and-or-object-foreach)
- [https://esdiscuss.org/topic/object-entries-in-2015](https://esdiscuss.org/topic/object-entries-in-2015)
- [https://esdiscuss.org/topic/providing-object-iterators-beyond-just-object-keys](https://esdiscuss.org/topic/providing-object-iterators-beyond-just-object-keys)

## 이론적 근거

예를 들어, 객체를 해시 필터로 사용할 때와 같이 객체의 자체 값이 필요한 매우 일반적인 사용 사례입니다. lodash/underscore, jQuery, Backbone 등 많은 라이브러리들이 “values” 함수를 가지고 있습니다.

순회 또는 직렬화를 위해 객체에서 키/값 쌍의 배열(사양에서의 '항목(entries)')을 얻는 것 또한 유용합니다. `Map` 생성자가 순회 가능한 `entries`와 관련된 `entries` 반복자(`WeakMap`도 생성자에서 순회 가능한 `entries`을 허용함)를 수용함에 따라, `entries` 배열을 `new Map`으로 전달하여 일반 객체를 `Map`으로 빠르게 변환하고자 할 때 매우 강력해집니다.

우리는 이미 자신의 키 배열을 반환하는 `Object.keys`와 `Map`/`Set`/`Array`에서 일치하는 `keys`/`values`/`entries` 반복자의 세 쌍을 반환하는 선례를 가지고 있습니다. 이와 같이, es-discuss에 대한 토론과 적어도 하나의 이전 TC39 회의에서 이 제안서는 ECMAScript에 `Object.values` 및 `Object.entries`를 추가하려고 합니다. `Object.keys`와 마찬가지로, 이 두 메서드는 배열을 반환합니다. 이 배열들의 순서는 `Object.keys` 순서와 정확히 일치하여, 세 결과 배열의 모든 인덱스가 객체의 동일한 키, 값 또는 항목을 반영합니다.

## 사양

사양을 [마크다운 형식](https://github.com/tc39/proposal-object-values-entries/blob/main/spec.md)으로 보거나, [HTML 문서](http://tc39.github.io/proposal-object-values-entries/)로 렌더링할 수 있습니다. 참고: `Object.{keys,values,entries}`가 동일한 키 순서를 공유하도록 약간의 사양 리팩토링이 있었습니다.

## 반복자 또는 배열?

`Object.keys`와의 일관성은 이 제안에서 가장 중요합니다. 그러나 반복자에 대한 후속 제안은 `Reflect.ownValues` 및 `Reflect.ownEntries`일 가능성이 높으며, 이는 문자열-값 및 심볼-값 속성의 배열을 모두 제공하는 `Reflect.ownKeys`로 세 가지 요소(키, 값, 항목)를 완성합니다. 그러나 이 제안은 `Object.values`/`Object.entries`에 초점을 맞추고 있으며 `Object` 또는 `Reflect` 형식의 존재가 다른 형식의 존재에 간섭해서는 안 됩니다. 또한 `keys`/`values`/`entries`에서 반복자를 반환하는 현재 선례는 현재 프로토타입의 메서드에만 적용되며 "`Objects`는 특별하다"는 말이 많은 사람들에게 받아들여지는 것 같습니다. 또한 배열 자체는 이미 순회 가능합니다.
