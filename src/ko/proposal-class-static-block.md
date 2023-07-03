# ECMAScript class static initialization blocks

클래스 `static` 블럭은 클래스 정의 평가중에 추가적인 정적(static) 초기화를 수행하는 메커니즘을 제공합니다.

이는 공개(public) 필드에 대한 대체품으로 의도되지 않았습니다. 공개 필드는 정적 분석 도구에 대한 유용한 정보를 제공해주고, 데코레이터를 위한 유효한 대상이 되기 때문입니다. 대신, 기존 사용 사례를 보완하고 해당 제안으로 현재 처리되고있지 않은 새로운 사용 사례를 가능하게 하는 것을 목적으로 합니다.

## 상태
단계: 4
챔피언: Ron Buckton (@rbuckton)
본 제안에 대한 상세한 상태를 보려면 아래 [TODO](#todo)를 살펴보세요.

## 저자
- Ron Buckton (@rbuckton)

## 제안 동기
정적 필드와 정적 비공개 필드에 대한 현재 제안은 ClassDefinitionEvaluation 을 수행 중에 스태틱 사이드의 필드별 초기화를 수행하는 매커니즘을 제공합니다, 그러나 쉽게 처리되지 않는 몇몇 사례들이 존재합니다. 예를 들어, 상태를 초기화 도중에 평가해야 한다거나(예를 들어 `try..catch`와 같이), 하나의 값에서 두 개의 필드를 세팅해야 한다면 해당 로직을 클래스 정의 바깥에서 수행해야 합니다.

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