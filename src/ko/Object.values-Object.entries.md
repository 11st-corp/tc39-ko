# Object.values / Object.entries

`Object.values`/`Object.entries` 에 대한 ECMAScript 제안, 사양 및 참조 구현
  
[@ljharb](https://github.com/ljharb) 가 초안을 작성한 사양.

이 제안은 현재 [프로세스](https://tc39.github.io/process-document/) 의 [stage 4](https://github.com/tc39/ecma262) 에 있으며 ES 2017에 포함될 예정입니다.

지정된 TC39 검토자: @wycats @littledan @rwaldron

[Engine Implementations(구현 엔진)](https://github.com/tc39/proposal-object-values-entries/issues/10)

## 이전 토론

- [TC39 회의록](https://github.com/rwaldron/tc39-notes/blob/c61f48cea5f2339a1ec65ca89827c8cff170779b/es6/2014-04/apr-9.md#51-objectentries-objectvalues)
- esdiscuss:
- [https://esdiscuss.org/topic/object-entries-object-values](https://esdiscuss.org/topic/object-entries-object-values)
- [https://esdiscuss.org/topic/es6-iteration-over-object-values](https://esdiscuss.org/topic/es6-iteration-over-object-values)
- [https://esdiscuss.org/topic/object-values-and-or-object-foreach](https://esdiscuss.org/topic/object-values-and-or-object-foreach) -> [https://esdiscuss.org/topic/iteration-was-re-object-values-and-or-object-foreach](https://esdiscuss.org/topic/iteration-was-re-object-values-and-or-object-foreach)
- [https://esdiscuss.org/topic/object-entries-in-2015](https://esdiscuss.org/topic/object-entries-in-2015)
- [https://esdiscuss.org/topic/providing-object-iterators-beyond-just-object-keys](https://esdiscuss.org/topic/providing-object-iterators-beyond-just-object-keys)

## 이론적 근거

객체를 해시 필터로 사용할 때와 같이, 객체의 자체 값(values)을 필요로 하는 경우가 많습니다. 그리고 lodash/underscore, jQuery, Backbone 등 많은 라이브러리들이 “values” 함수를 가지고 있습니다.

반복(iteration) 또는 직렬화(serialization)를 위해 객체에서 키/값 쌍의 배열(스펙에서의 "enries”)을 얻는 것 또한 유용합니다. 예를 들어 반복가능한 `entries` 와 `entries` iterator를 `Map` 생성자가 받을 수 있는 것은 `entries` 배열을 새 `Map`으로 전달하여, 일반 객체를 `Map`으로 빠르게 변환하는게 가능해졌습니다.

우리는 이미 객체의 키값들을 배열로 반환하는 `Object.keys`와 `Map`/`Set`/`Array` 에서 일치하는  `keys`/`values`/`entries` iterator 객체를 반환한 선례를 가지고 있습니다. 따라서, es-discuss와 이전 TC39 회의에서 논의된 내용에 따라, 본 제안서는 ECMAScript에 `Object.values`와 `Object.entries`를 추가하고자 합니다. `Object.keys`와 같이 이 두 함수는 배열을 반환하게 될 것 입니다. 이 배열들의 순서는 `Object.keys`의 순서와 정확히 동일하며, 각각 반환된 세 배열은 객체의 key, value, entry를 반영하게 됩니다.

## 사양

사양을 [마크다운 형식](https://github.com/tc39/proposal-object-values-entries/blob/main/spec.md) 이나 [HTML 문서](http://tc39.github.io/proposal-object-values-entries/)로 볼 수 있습니다. 참고: `Object.{keys,values,entries}`각 함수가 동일한 키 순서를 공유하도록 약간의 사양 리팩토링이 있었습니다.

## Iterators 또는 배열?

`Object.keys`와의 일관성은 이 제안에서 가장 중요합니다. 그러나 iterator에 대한 후속 제안은 `Reflect.ownValues` 및 `Reflect.ownEntries`일 가능성이 높으며, 이는 문자열 값 및 Symbol 값 속성의 배열을 모두 제공하는 `Reflect.ownKeys`로 세 가지 요소(key, values, entries)를 완성합니다. 그러나 이 제안은 `Object.values`/`Object.entries`에 초점을 맞추고 있으며 `Object` 또는 `Reflect` 형식의 존재가 다른 형식의 존재에 간섭해서는 안 됩니다. 또한 `keys`/`values`/`entries`에서 iterator를 반환하는 현재 선례는 현재 프로토타입의 메서드에만 적용되며 "`Objects`는 특별하다"는 말이 많은 사람들에게 받아들여지는 것 같습니다. 또한 배열 자체는 이미 반복 가능합니다.

## 폴리필

[폴리필 링크](https://github.com/tc39/proposal-object-values-entries/blob/main/polyfill.js)

아래 네 개의 문법이 선행되어야 합니다.
- `Array.prototype.reduce`
- `Object.prototype.propertyIsEnumerable`
- `Array.prototype.concat`
- `Reflect.ownKeys`