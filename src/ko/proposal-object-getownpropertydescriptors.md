# Object.getOwnPropertyDescriptors Proposal

>  [폴리필](https://www.npmjs.com/package/object.getownpropertydescriptors)은 해당 링크에 있습니다.

##  제안한 사람

stage 0 단계에서 **[Rick Waldron](https://github.com/rwaldron)** 이 제안하였으나, 현재 공식적으로 제안한 사람은 **[Jordan Harband](https://github.com/ljharb)** 입니다.

## 적용 상태

본 제안은 현재 [the TC39 process](https://github.com/tc39/ecma262/)의 [4 단계](https://github.com/tc39/proposals/blob/main/finished-proposals.md)에 있습니다.

본 제안은 `Reflect.getOwnPropertyDescriptors`과 동일하나, 다른 버전과의 호환을 위하여 `Object`의 public 정적 메서드로 구현되어 있습니다.

## 제안 동기

ECMAScript에는 두 객체 간의 복사를 구현한 단일 메서드가 존재하지 않습니다. 어플리케이션이 점점 복잡해짐에 따라 함수적 프로그래밍과 불변 객체가 더더욱 필요하게 되었고, 많은 프레임워크와 라이브러리가 복잡한 객체와 프로토타입 간의 속성을 복사하는 보일러플레이트를 각자의 방식으로 구현하기 시작하였습니다.

두 객체 간의 복사를 `Object.assign`을 사용하여 구현하게 되는 경우, 많은 혼란과 의도하지 않은 동작들이 발생하게 됩니다. 이는 `Object.assign`을 사용한 복사가 **얕은 복사**이기 때문입니다. (`Object.assign`은 객체의 속성이 가진 descriptor가 아닌 속성의 값 / symbol을 접근하여 복사하기 때문입니다.) 이렇게 속성이 가진 잠재적 accessors를 사용하지 않는 복사는 특히 복잡한 객체나 클래스의 프로토타입을 구성할 때 매우 큰 오류가 발생할 수 있습니다.

객체는 기본적으로 열거불가능한 메서드나 accessors가 존재하기 때문에 객체의 속성이 열거가능 여부과 무관하게 모든 descriptor를 탐색하는 로직은 클래스와 클래스의 프로토타입의 구성을 구현하는데 중요합니다.

또한 decorator는 다른 클래스 또는 믹스인에서 descriptor를 한 번에 가져올 수 있고, 이 descriptor들을 통해 `Object.defineProperties`로 쉽게 속성을 정의할 수 있습니다. 불필요한 descriptor를 필터링하는 것이 더 간단해지고, 단순해질 것입니다.

무엇보다도 두 객체간의 얕은 복사는 `Object.assign`로 충분히 구현 가능하기 때문입니다.

## 자주 묻는 질문들

### `Reflect.getOwnPropertyDescriptors`이 꼭 있어야하나?

이 제안의 목적은 여러 형태의 보일러플레이트를 단순화하며, 여러가지 구현 방식을 하나로 모으기 위함이기 때문에 단 하나의 방식을 제시하는 것은 아닙니다. 하지만 현재 사용되고 있는 `Reflect.getOwnPropertyDescriptors` 또한 하나의 방식으로 일치시킬 수 있을 것으로 보입니다.

업데이트 : 위원회는 `Reflect`가 `Proxy`의 트랩을 미러링을 위한 것이므로 하나의 '방식'으로 보고 있지 않습니다.

## 제안된 해결책

`Object.getOwnPropertyDescriptor`를 사용하여 제네릭 객체가 가진 모든 `descriptor`를 한번의 작업으로 탐색하는 방법을 제안하고자 합니다.

해당 제안의 **polyfill**은 아래와 같습니다.

```javascript
if (!Object.hasOwnProperty('getOwnPropertyDescriptors')) {
  Object.defineProperty(
    Object,
    'getOwnPropertyDescriptors',
    {
      configurable: true,
      writable: true,
      value: function getOwnPropertyDescriptors(object) {
        return Reflect.ownKeys(object).reduce((descriptors, key) => {
          return Object.defineProperty(
            descriptors,
            key,
            {
              configurable: true,
              enumerable: true,
              writable: true,
              value: Object.getOwnPropertyDescriptor(object, key)
            }
          );
        }, {});
      }
    }
  );
}
```

## 설명하기 위한 예시

위의 폴리필은 ES5 또는 부분적인 ES2015를 지원하는 엔진에서 동작하는 보일러플레이트를 개선하는 ES2015 친화적인 대안을 제시합니다.

아래의 예제에서 보이듯, `Object.getOwnPropertyDescriptors`을 통해서 두개의 객체간 얕은 복사와 클로닝이 가능합니다.

```javascript
const shallowClone = (object) => Object.create(
  Object.getPrototypeOf(object),
  Object.getOwnPropertyDescriptors(object)
);

const shallowMerge = (target, source) => Object.defineProperties(
  target,
  Object.getOwnPropertyDescriptors(source)
);
```

믹스인을 사용하는 객체 또한 이 제안을 통해 개선이 가능합니다.

```javascript
let mix = (object) => ({
  with: (...mixins) => mixins.reduce(
    (c, mixin) => Object.create(
      c, Object.getOwnPropertyDescriptors(mixin)
    ), object)
});

// multiple mixins example
let a = {a: 'a'};
let b = {b: 'b'};
let c = {c: 'c'};
let d = mix(c).with(a, b);
```

만약 얕은 복사로 인한 side effect를 피하고 `setter`/`getter`를 복사하거나, 객체간 구별된 열거가능 속성을 사용하기 위해서 `[[Set]]`/`[[Get]]` 대신 `[[DefineOwnProperty]]`/`[[GetOwnProperty]]`를 사용하는 방식을 `Object.assign`을 사용하여 구현하는 것을 생각해보겠습니다.

제안 이전에 메서드는 아래와 같이 구현됩니다.

```javascript
function completeAssign(target, ...sources) {
  sources.forEach(source => {
    // grab keys descriptors
    let descriptors = Object.keys(source).reduce((descriptors, key) => {
      descriptors[key] = Object.getOwnPropertyDescriptor(source, key);
      return descriptors;
    }, {});
    // by default, Object.assign copies enumerable Symbols too
    // so grab and filter Symbols as well
    Object.getOwnPropertySymbols(source).forEach(sym => {
      let descriptor = Object.getOwnPropertyDescriptor(source, sym);
      if (descriptor.enumerable) {
        descriptors[sym] = descriptor;
      }
    });
    Object.defineProperties(target, descriptors);
  });
  return target;
}
```

그러나 `Object.getOwnPropertyDescriptors`를 사용하게 되면, 위의 보일러 플레이트가 아래와 같이 구현 가능하게 됩니다.

```javascript
var completeAssign = (target, ...sources) =>
  sources.reduce((target, source) => {
    let descriptors = Object.getOwnPropertyDescriptors(source);
    Reflect.ownKeys(descriptors).forEach(key => {
      if (!descriptors[key].enumerable) {
        delete descriptors[key];
      }
    });
    return Object.defineProperties(target, descriptors);
  }, target);
```



