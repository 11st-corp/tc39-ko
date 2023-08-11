# WeakMap key로서의 Symbol

3단계

**공저자/투사**:

- Robin Ricard (@rricard)
- Rick Button (@rickbutton)
- Daniel Ehrenberg (@littledan)
- Leo Balter (@leobalter)
- Caridy Patiño (@caridy)
- Rick Waldron (@rwaldron)
- Ashley Claymore (@acutmore)

[사양 문서](https://tc39.es/proposal-symbols-as-weakmap-keys)

---

## 서론

본 제안서는 고유 심볼을 키로 사용할 수 있도록 WeakMap API를 확장합니다.

현재 WeakMap는 키로 객체만 허용하도록 제한되어 있으며, 목표는 궁극적으로 GC 될 수 있는 고유한 값을 갖는 것이므로 이것은 WeakMap의 제한 사항입니다.

Symbol은 ECMAScript에서 고유한 값을 허용하는 유일한 원시 유형입니다. `Symbol( [ description] )` 표현식을 호출하여 생성된 심볼 값은 원본 생성에 대한 접근으로만 식별할 수 있습니다. 동일한 표현식을 사용하여 같은 설명 값으로 재현하더라도 이전 생성의 원래 값은 복원되지 않습니다. 이것이 우리가 심볼 값들을 고유하다고 부르는 이유입니다.

WeakMaps에서는 객체가 키로 사용되는 이유는 객체들이 동일한 식별 측면을 공유하기 때문입니다. 객체의 식별은 원래 생성에 접근해야만 확인할 수 있으며, 새로운 객체는 예를 들어 엄격한 비교에서도 기존의 객체와 일치하지 않습니다.

### 이전 토론

WeakMap key로서의 심볼은 [이전 논의](https://github.com/tc39/ecma262/issues/1194)를 참조하세요.

### 초안 PR

제안된 사양이 있는 현재 [ECMA-262에 대한 PR 초안](https://github.com/tc39/ecma262/pull/2777)을 참조하세요.

## 사용 사례

### 간편한 키 생성 및 공유

객체를 키로 사용하기 위해 새로운 객체를 생성하는 대신, 심볼은 WeakMap의 사용 편의성과 키 및 매핑 항목의 적절한 역할에 대해 더욱 명확성을 제공할 수 있습니다.

```javascript
const weak = new WeakMap();

// 의도하지 않은 말장난: 심볼이 되면 더 상징적인 키가 됩니다.
const key = Symbol('my ref');
const someObject = { /* 정보 정보 정보 */ };

weak.set(key, someObject);
```

### 그림자 영역(ShadowRealms)<sup>[1][]</sup>, 막(Membranes)<sup>[2][]</sup>, and 가상화(Virtualization)

[그림자 영역 제안서](https://github.com/tc39/proposal-shadowrealm)는 객체 값에 대한 접근을 허용하지 않습니다. 대부분의 가상화 경우에는, 막 시스템이 영역 관련 API 위에 구축되어 WeakMaps을 사용하여 참조를 연결합니다. 심볼 값은 원시 값이기 때문에 여전히 접근할 수 있으며, 연결된 식별자를 사용하여 적절한 weakmap을 사용하여 막을 구조화하는 것이 가능합니다.

```javascript
const objectLookup = new WeakMap();
const otherRealm = new ShadowRealm();
const coinFlip = otherRealm.evaluate(`(a, b) => Math.random() > 0.5 ? a : b;`);

// later...
let a = { name: 'alice' };
let b = { name: 'bob' };
let symbolA = Symbol();
let symbolB = Symbol();
objectLookup.set(symbolA, a);
objectLookup.set(symbolB, b);
a = b = null; // 직접 객체 참조 삭제 확인

// 다른 영역을 통해 왕복되는 심볼로 보존되는 연결된 ID
let chosen = objectLookup.get(coinFlip(symbolA, symbolB));
assert(['alice', 'bob'].includes(chosen.name));
```

### 레코드 및 튜플

본 제안은 [Record & Tuple Proposal][rtp]에서 소개된 문제 공간을 해결하기 위해 제시되었습니다. 원시값에서 비원시값을 참조하고 접근하는 방법은 무엇일까요?

요약: 지금까지의 토론에서 제기된 모든 제약 조건을 고려할 때, 심볼을 WeakMaps를 통해 역참조하는 것이 레코드와 튜플에서 객체를 참조하는 가장 합리적인 방법으로 여겨집니다.

정확히 이 기능이 어떻게 작동해야 하는지에 대한 몇 가지 미해결된 문제와, 사용성 및 생태계 조율 문제가 있습니다. 이러한 문제들은 TC39 단계 과정에서 해결하고 검증할 예정입니다. 우리는 이 기능 없이도 레코드와 튜플이 좋은 첫 번째 단계인 이유를 포함하여 문제 공간을 이해하는 것부터 시작할 것입니다. 그런 다음 각각의 장단점을 가진 다양한 가능한 해결책을 조사할 것입니다.

[Records & Tuples][rtp]는 객체, 함수 또는 메서드를 포함할 수 없으며, 이를 시도할 경우 `TypeError`가 발생합니다.

```js
const server = #{
    port: 8080,
    handler: function (req) { /* ... */ }, // TypeError!
};
```

이 제한은 [Record & Tuple Proposal][rtp]의 **핵심 목표** 중 하나가 기본적으로 깊은 불변성 보장과 구조적 동등성을 갖는 것이기 때문에 존재합니다.

아래에서 언급된 사용자 지정 솔루션들은 이러한 제약을 우회하는 여러 가지 방법을 제공하며, 객체를 래핑하는 추가 언어 지원 없이도 `Record and Tuple`은 실행 가능하고 유용합니다. 본 제안은 `Record and Tuple`과 사용자 지정 솔루션의 사용을 보완하는 솔루션을 설명하기 위한 것입니다. 그러나 이는 언어에서 `Record and Tuple`을 사용하는 데 필수적인 전제 조건은 아닙니다.

심볼 값을 WeakMap의 키로 허용하면 JavaScript 라이브러리가 자체 RefCollection과 유사한 기능을 구현할 수 있습니다. 이를 통해 재사용 가능하며(매핑을 여기저기 전달하는 것을 피하고, 하나의 전역 매핑만 사용하고, [Records and Tuples](https://github.com/tc39/proposal-record-tuple)을 전달하는 것만으로 해결할 수 있음), 동시에 시간이 지남에 따라 메모리 누수를 방지할 수 있습니다.

```js
class RefBookkeeper {
    #references = new WeakMap();
    ref(obj) {
        // (Simplified; we may want to return an existing symbol if it's already there)
        const sym = Symbol();
        this.#references.set(sym, obj);
        return sym;
    }
    deref(sym) { return this.#references.get(sym); }
}
globalThis.refs = new RefBookkeeper();

// Usage
const server = #{
    port: 8080,
    handler: refs.ref(function handler(req) { /* ... */ }),
};
refs.deref(server.handler)({ /* ... */ });
```

## WeakMap 키로 잘 알려지고 등록된 심볼

일부 TC39 대표는 양쪽 모두 강력하게 주장했습니다. 우리는 '허용' 및 '허용하지 않음' 모두가 허용되는 옵션으로 보고 있습니다.

### [등록된](https://tc39.es/ecma262/multipage#sec-symbol.for) 심볼

등록된 심볼을 허용하지 않는 것은 [이슈 21](https://github.com/tc39/proposal-symbols-as-weakmap-keys/issues/21)에서 논의되었습니다.

### [잘 알려진](https://tc39.es/ecma262/multipage#sec-well-known-symbols) 심볼

잘 알려진 심볼을 허용하는 것은 그리 나쁘게 보이지 않습니다. 왜냐하면 그들은 영역의 수명 동안 유지되는 객체와 유사하기 때문입니다. JS가 실행되는 한 계속 유지되는 (예: 웹 상에서 Worker의 영역) 컨텍스트에서 `Symbol.iterator`와 같은 것들은 `Object.prototype` 및 `Array.prototype`과 같은 원시적인 객체와 유사합니다. 이러한 객체들이 계속 유지되는 것은 WeakMap 키로 사용할 수 없음을 의미하지는 않습니다.

`Symbol.keyFor`를 사용하여 '등록된' 심볼을 감지할 수 있지만, 현재는 심볼이 '잘 알려진' 심볼인지 아닌지를 테스트하기 위한 내장된 속성이 존재하지 않습니다. '잘 알려진' 심볼을 WeakMap의 키로 허용하지 않는다면, 코드는 이러한 예상치 못한 완료를 처리할 수 있도록 보장해야 합니다.

## WeakRefs 및 FinalizationRegistry의 심볼 지원

또한 WeakRefs 및 FinalizationRegistry에서 심볼을 지원해야 합니다. 이는 WeakMap 키로서의 객체와 일치할 뿐만 아니라 사용자 영역에서 고급 기능을 빌드/시연할 수 있도록 합니다. 예를 들어 레코드/튜플을 키로 지원하는 WeakMap이 있습니다.

## 요약

심볼을 WeakMap의 키로 추가하는 것은 Records와 Tuples의 목표인 단일 영역 내에서 막 기반 격리를 지원하기 위해 부과된 제약을 준수하면서도 객체를 참조할 수 있는 유용하고 최소한의 원시 기능이라고 생각합니다. 동시에 사용자 영역 해결책은 많은/대부분의 사용 사례에 충분하다고 보입니다. 우리는 Records와 Tuples이 원시에서 객체를 참조하기 위한 추가적인 메커니즘 없이도 매우 유용하다고 믿으며, 따라서 이 제안과는 별도로 Records와 Tuples을 진행하는 것이 타당하다고 생각합니다.

[rtp]: https://github.com/tc39/proposal-record-tuple
[1]: #1
[2]: #2

---

#### 1

ShadowRealms(그림자 영역)은 객체 지향 프로그래밍에서 사용되는 용어로, 객체의 라이프사이클 동안 보호되는 동안 일시적으로 다른 객체를 그림자로 만들어 일부 동작을 가로채는 기능을 가리킵니다. 그림자 객체는 원본 객체와 동일한 인터페이스를 제공하면서도, 특정 동작이 수정되거나 가로채일 수 있습니다. 이는 객체의 동작을 감시하거나 확장하기 위해 사용될 수 있습니다. 본 문서에서는 첨부된 제안서의 API의 의미로 사용되었습니다.

#### 2

Membranes(막)은 객체 간 상호 작용을 제어하기 위한 메커니즘입니다. 객체 간의 통신을 감시하고 조작하여 외부로부터의 접근을 제한하고, 보안과 격리를 강화할 수 있습니다. 메커니즘을 통해 객체 사이에 간섭할 수 있는 막을 생성하여 외부로부터의 접근과 영향을 제어합니다.
