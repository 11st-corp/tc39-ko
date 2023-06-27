본 제안서는 수용되었고 [주요 명세서에 병합되었습니다](https://github.com/tc39/ecma262/pull/1791). 이 저장소는 오직 역사적 관심을 위해 남아있습니다.

# for-in 열거 순서 명세
(부분적으로.)
ECMA-262는 `for (a in b) ...` 순서를 [거의 완전히 명시하지 않지만](https://tc39.es/ecma262/#sec-enumerate-object-properties), 실제 엔진들은 적어도 일부의 경우에 일관성을 유지하는 경향이 있습니다. 게다가, 시간이 지나며 구현체들은 웹에서 코드를 실행하려는 모든 사람이 명세에 포함되지 않은 몇 가지 제약 조건을 따라야 한다는 것을 관찰해왔습니다.

이 제안은 [스테이지 4단계](https://tc39.es/process-document)로 그것을 고치기 시작할 것입니다.

## 배경
for-in의 순서를 완전한 사양으로 합의하는데 사용한 역사적 노력들은 모두 실패로 돌아갔습니다. 그 이유 중 일부는 모든 엔진이 고유한 독특한 구현을 가지고 있으며, 이는 많은 작업을 해야 한다는 뜻이며 다시 검토하고 싶지 않은 부분이기 때문입니다.

구체적인 제안 전의 배경과 테스트 케이스에 대한 내용은 [탐색](https://github.com/tc39/proposal-for-in-order/tree/master/exploration) 디렉토리를 참고해 주세요.

## 의미론적 상호운용성(interop semantics)의 보수적인 하한 추정치
[상호운용성의 의미론적 목록](https://github.com/tc39/proposal-for-in-order/tree/master/exploration#interop-semantics)에서 이미 엔진들이 동의한 경우에 대한 보수적인 하한 추정치를 유도할 수 있습니다. 이는 가장 일반적인 경우를 포함한다고 믿습니다. 구체적으로는 다음과 같습니다.
- 반복되는 객체나 그 프로토타입 체인에 프록시, 타입드 어레이, 모듈 네임스페이스 객체, 또는 호스트의 이형(exotic) 객체가 없습니다.
- 반복 중에 객체나 그 프로토타입 체인에 프로토타입 변경이 없습니다.
- 반복 중에 객체나 그 프로토타입 체인의 속성이 삭제되지 않습니다.
- 반복 중에 객체의 프로토타입 체인에 속성이 추가되지 않습니다.
- 객체나 그 프로토타입 체인의 속성 중 어느 것도 그것의 열거 가능성이 반복 중에 변경되지 않습니다.
- 열거 가능한 속성을 가릴 수 있는 비-열거 가능 속성이 없습니다.

마지막 항목을 제외한 모든 항목은 비교적 쉽게 문장으로 명시할 수 있습니다. 마지막 항목은 조금 더 어렵습니다. 제가 알기로 JavaScriptCore가 이 경우에 출력을 내보내는 유일한 엔진인데, 오랫동안 존재한 버그 때문입니다. 그래서 이 점은 무시해도 될 것으로 기대합니다.

### `for-in`-ordered APIs
다음의 API들은 [EnumerableOwnPropertyNames](https://tc39.es/ecma262/#sec-enumerableownpropertynames)를 사용합니다. 이는 결과가 "해당 객체에 대해 EnumerateObjectProperties 내부 메서드를 호출할 경우 생성될 이터레이터와 동일한 상대적인 순서로 정렬되어야 한다"고 요구합니다. [EnumerateObjectProperties](https://tc39.es/ecma262/#sec-enumerate-object-properties)는 for-in에서 사용되는 명세 내부 메서드로, 이 제안이 개선을 목표로 하는 명세의 일부입니다.
- [`Object.keys`](https://tc39.es/ecma262/#sec-object.keys)
- [`Object.values`](https://tc39.es/ecma262/#sec-object.values)
- [`Object.entries`](https://tc39.es/ecma262/#sec-object.entries)
- [`InternalizeJSONProperty`](https://tc39.es/ecma262/#sec-internalizejsonproperty)를 통한 [`JSON.parse`](https://tc39.es/ecma262/#sec-json.parse)
- [`SerializeJSONObject`](https://tc39.es/ecma262/#sec-serializejsonobject)를 통한 [`JSON.stringify`](https://tc39.es/ecma262/#sec-json.stringify)

[other-effects](https://github.com/tc39/proposal-for-in-order/tree/master/other-effects) 디렉터리에는 각각의 간단한 예제를 보여주는 테스트가 있습니다. 모든 주요 엔진은 이미 이러한 모든 케이스에 동의하고 있습니다.
JSON.parse로 생성된 모든 객체가 interop 시맨틱 내에 있기 때문에, 이 제안 이후에 완전히 명시될 것입니다. 다른 API들은 모두 이형 인수를 전달할 수 있기 때문에 그렇지 않을 것입니다.

### `Reflect.ownKeys`-orderd APIs

다음 API는 직접 `[[OwnPropertyKeys]]` 내부 메서드를 호출하며, 그 동작은 완전히 명시되어 있습니다. 따라서 이 제안에 영향받지 않습니다.

- [`Reflect.ownKeys`](https://tc39.es/ecma262/#sec-reflect.ownkeys)
- [`Object.getOwnPropertyNames`](https://tc39.es/ecma262/#sec-object.getownpropertynames) (via [`GetOwnPropertyKeys`](https://tc39.es/ecma262/#sec-getownpropertykeys))
- [`Object.getOwnPropertySymbols`](https://tc39.es/ecma262/#sec-object.getownpropertysymbols) (via [`GetOwnPropertyKeys`](https://tc39.es/ecma262/#sec-getownpropertykeys))
- [`Object.assign`](https://tc39.es/ecma262/#sec-object.assign)
- [`Object.create`](https://tc39.es/ecma262/#sec-object.create) (via [`ObjectDefineProperties`](https://tc39.es/ecma262/#sec-objectdefineproperties))
- [`Object.defineProperties`](https://tc39.es/ecma262/#sec-object.defineproperties) via [`ObjectDefineProperties`](https://tc39.es/ecma262/#sec-objectdefineproperties)
- [`Object.getOwnPropertyDescriptors`](https://tc39.es/ecma262/#sec-object.getownpropertydescriptors)
- [`Object.freeze`](https://tc39.es/ecma262/#sec-object.freeze) (via [`SetIntegrityLevel`](https://tc39.es/ecma262/#sec-setintegritylevel))
- [`Object.seal`](https://tc39.es/ecma262/#sec-object.seal) (via [`SetIntegrityLevel`](https://tc39.es/ecma262/#sec-setintegritylevel))
- [`Object.isFrozen`](https://tc39.es/ecma262/#sec-object.isfrozen) (via [`TestIntegrityLevel`](https://tc39.es/ecma262/#sec-testintegritylevel))
- [`Object.isSealed`](https://tc39.es/ecma262/#sec-object.issealed) (via [`TestIntegrityLevel`](https://tc39.es/ecma262/#sec-testintegritylevel))
- [object spread](https://tc39.es/ecma262/#sec-object-initializer-runtime-semantics-propertydefinitionevaluation) (via [`CopyDataProperties`](https://tc39.es/ecma262/#sec-copydataproperties))
- object rest in both [assignment](https://tc39.es/ecma262/#sec-runtime-semantics-restdestructuringassignmentevaluation) and [binding](https://tc39.es/ecma262/#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization) position (via [`CopyDataProperties`](https://tc39.es/ecma262/#sec-copydataproperties))


## 스펙 테스트
 [후보 명세 텍스트](https://tc39.es/proposal-for-in-order/)를 참조하시기 바랍니다. 위에서 언급한 "열거 가능한 속성을 가릴 수 있는 비-열거 가능 속성이 없어야 한다."는 제약 조건은 아직 포함되지 않았습니다. 이유는 해당 제약 조건을 어떻게 표현해야 할지 파악하는 데 어려움을 겪고 있기 때문입니다.