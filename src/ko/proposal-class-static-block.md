# ECMAScript class static initialization blocks

클래스 `static` 블록은 클래스 정의 평가중에 추가적인 정적(static) 초기화를 수행하는 메커니즘을 제공합니다.

이는 공개(public) 필드에 대한 대체품으로 의도되지 않았습니다. 공개 필드는 정적 분석 도구에 대한 유용한 정보를 제공해주고, 데코레이터를 위한 유효한 대상이 되기 때문입니다. 대신, 기존 사용 사례를 보완하고 해당 제안으로 현재 처리되고있지 않은 새로운 사용 사례를 가능하게 하는 것을 목적으로 합니다.

## 상태
단계: 4
챔피언: Ron Buckton (@rbuckton)
본 제안에 대한 상세한 상태를 보려면 아래 [TODO](#todo)를 살펴보세요.

## 저자
- Ron Buckton (@rbuckton)

## 제안 동기
정적 필드와 정적 비공개 필드에 대한 현재 제안은 ClassDefinitionEvaluation 을 수행 중에 정적 사이드의 필드별 초기화를 수행하는 매커니즘을 제공합니다, 그러나 쉽게 처리되지 않는 몇몇 사례들이 존재합니다. 예를 들어, 상태를 초기화 도중에 평가해야 한다거나(예를 들어 `try..catch`와 같이), 하나의 값에서 두 개의 필드를 세팅해야 한다면 해당 로직을 클래스 정의 바깥에서 수행해야 합니다.

```js
// without static blocks:
class C {
  static x = ...;
  static y;
  static z;
}

try {
  const obj = doSomethingWith(C.x);
  C.y = obj.y
  C.z = obj.z;
}
catch {
  C.y = ...;
  C.z = ...;
}

// with static blocks:
class C {
  static x = ...;
  static y;
  static z;
  static {
    try {
      const obj = doSomethingWith(this.x);
      this.y = obj.y;
      this.z = obj.z;
    }
    catch {
      this.y = ...;
      this.z = ...;
    }
  }
}
```

또한, 인스턴스 비공개 필드를 가진 클래스와 같은 범위에서 선언된 다른 클래스나 함수 간에 정보 공유가 필요한 경우도 있습니다.
정적 블록은 현재 클래스 선언의 문맥에서 문장을 평가하는 기회를 제공하며, 비공개 상태(인스턴스-비공개 혹은 정적-비공개)에 대한 특권적인 접근이 가능합니다.

```js
let getX;

export class C {
  #x
  constructor(x) {
    this.#x = { data: x };
  }

  static {
    // getX has privileged access to #x
    getX = (obj) => obj.#x;
  }
}

export function readXData(obj) {
  return getX(obj).data;
}
```


## "비공개 선언"과의 관계
제안서: [https://github.com/tc39/proposal-private-declarations](https://github.com/tc39/proposal-private-declarations)

비공개 선언 제안도 마찬가지로 두 개의 클래스 간에 특권적인 접근의 문제를 해결하기 위해, 비공개 이름을 클래스 선언에서 벗어나 감싸는 범위의 스코프로 이동시키는 것으로 문제를 해결하려고 합니다. 이 관점에서는 약간의 중복이 있을 수 있지만, 비공개 선언은 다단계 정적 초기화 문제를 해결하지 못하며, 비공개 이름을 외부 스코프에 초기화 목적만을 위해 노출할 가능성이 있습니다.

```js
// with private declarations
private #z; // exposed purely for post-declaration initialization
class C {
  static y;
  static outer #z;
}
const obj = ...;
C.y = obj.y;
C.#z = obj.z;

// with static block
class C {
  static y;
  static #z; // not exposed outside of class
  static {
    const obj = ...;
    this.y = obj.y;
    this.#z = obj.z;
  }
}
```
게다가, 비공기 선언은 read-only 접근이 바람직한 경우에도, 읽기 및 쓰기 접근을 모두 허용하는 공유된 비공개 상태에 비공개 이름을 노출시킵니다. 비공개 선언을 이용하여 이를 해결하려면 추가적인 복잡성이 필요합니다(`static{}`을 사용하더라도 비슷한 비용이 발생합니다).

```js
// with private declarations
private #zRead;
class C {
  #z = ...; // only writable inside of the class
  get #zRead() { return this.#z; } // wrapper needed to ensure read-only access
}

// with static
let zRead;
class C {
  #z = ...; // only writable inside of the class
  static { zRead = obj => obj.#z; } // callback needed to ensure read-only access
}
```

그러나, 장기적으로는 두 제안이 함께 작동하는 것을 방해하는 요소는 없습니다.
```js
private #shared;
class C {
  static outer #shared;
  static #local;
  static {
    const obj = ...;
    this.#shared = obj.shared;
    this.#local = obj.local;
  }
}
class D {
  method() {
    C.#shared; // ok
    C.#local; // no access
  }
}
```

## 선행 기술
- C#: [Static Constructors](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/static-constructors)
- Java: [Static Initializers](https://docs.oracle.com/javase/specs/jls/se10/html/jls-8.html#jls-8.7)

## 구문
```js
class C {
  static {
    // statements
  }
}
```

## 의미론
- `static {}` 초기화 블록은 새로운 lexical 스코프를 생성합니다.(예를 들어 `var`, `function`, 블록 스코프 선언은 `static {}` 초기화 블록에 지역적으로 적용됩니다. 이 lexical 스코프는 클래스 본문의 lexical 스코프 안에 중첩되어 있습니다.(클래스의 비공개 상태의 인스턴스에 대한 특권적인 접근을 보장합니다.))
- 클래스 본문에서는 여러 개의 `static {}` 초기화 블록을 가질 수 있습니다.
- `static {}` 초기화 블록은 정적 필드 초기화와 교차하여 문서 순서대로 평가됩니다.
- `static {}` 초기화 블록은 데코레이터를 가질 수 없습니다.(클래스 자체에 데코레이터를 적용해야 함)
- 평가될 때, `static {}` 초기화 블록의 `this` 수신자는 클래스의 생성자 객체입니다. (정적 필드 초기화와 동일)
- `static {}` 초기화 블록 내부에서 `arguments`를 참조하는 것은 문법 오류입니다.
- `static {}` 초기화 블록 내부에서 SuperCall(즉, `super()`)을 포함하는 것은 문법 오류입니다.
- `static {}` 초기화 블록은 기반 클래스의 정적 멤버에 접근하거나 호출하기 위한 수단으로 SuperProperty 참조를 포함할 수 있습니다. 이러한 기반 클래스는 `static {}` 초기화 블록을 포함한 파생 클래스에 의해 재정의될 수 있습니다.
- `static {}` 초기화 블록은 디버거 및 예외 추적에서 독립적인 스택 프레임으로 표시되어야 합니다.

## 예시
```js
// "friend" access (same module)
let A, B;
{
  let friendA;

  A = class A {
    #x;

    static {
        friendA = {
          getX(obj) { return obj.#x },
          setX(obj, value) { obj.#x = value }
        };
    }
  };

  B = class B {
    constructor(a) {
      const x = friendA.getX(a); // ok
      friendA.setX(a, x); // ok
    }
  };
}
```
## 참조
- [Stage 0 Presentation](https://docs.google.com/presentation/d/1TLFrhKMW2UHlHIcjKN02cEJsSq4HL7odS6TE6M-OGYg/edit#slide=id.p)