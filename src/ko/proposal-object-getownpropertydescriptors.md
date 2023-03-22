# Object.getOwnPropertyDescriptors Proposal

>  [폴리필](https://www.npmjs.com/package/object.getownpropertydescriptors)은 해당 링크에 있습니다.

##  제안한 사람

stage 0 단계에서 **[Rick Waldron](https://github.com/rwaldron)** 이 제안하였으나, 현재 공식적으로 제안한사람은 **[Jordan Harband](https://github.com/ljharb)** 입니다.

## 적용 상태

해당 제안은 현재 [the TC39 process](https://github.com/tc39/ecma262/)의 [4 단계](https://github.com/tc39/proposals/blob/main/finished-proposals.md)에 있습니다.

해당 제안은 `Reflect.getOwnPropertyDescriptors`과 동일하나, 다른 버전과의 일관성을 위하여 `Object`의 public 정적 메서드로 구현되어있습니다.

## 제안 동기

ECMAScript에는 두 객체 간의 복사를 구현한 단일 메서드가 존재하지 않습니다. 복잡한 어플리케이션에 함수적 프로그래밍과 불변 객체의 필요성이 대두된 시점에서 모든 프레임워크, 라이브러리가 객체와 프로토타입들 간의 복사를 자신만의 방식으로 각각 구현하고 있습니다.

`Object.assign`으로 구현하게 되는 경우, 많은 혼란과 의도하지 않은 동작들이 발생하게 됩니다. 이는 복사가 단순히 **얕은 복사**이기 때문입니다.
(특히 복잡한 객체나 클래스의 프로토타입의 경우, descriptors나, 접근자를 삭제하는 방식이 아닌, 속성과 symbols에 직접 접근하는 복사 방식은 문제가 될 수 있다.)

열거형의 여부를 떠나서 모든 descriptor를 확인하는 작업은 객체가 기본적으로 비열거형 메서드와 접근자를 가지고 있기 때문에 클래스와 클래스의 프로토타입의 구성을 구현하는데 중요합니다.

또한 decorator의 경우, 다른 클래스와 믹스인의 descriptor들을 통해 확인할 수 있고 `Object.defineProperties`를 통해 쉽게 할당이 가능하다. 필요하지 않은 descriptor를 필터링하는 것은 반복적이지 않고 간단하다.

마지막으로, 무엇보다도 두 객체간의 얕은 복사는 `Object.assign`와 거의 차이가 존재하지 않는다.

## 자주 묻는 질문들

### `Reflect.getOwnPropertyDescriptors`이 꼭 있어야하나?

이 제안의 목적이 여러 형태의 보일러플레이트를 단순화하고, 여러개의 방법들을 일치시키기 위함이므로 현재 `Reflect.getOwnPropertyDescriptors`의 또 다른 버전으로 생각할 수 있다.

업데이트 : 위원회는 `Reflect`가 `Proxy`의 트랩을 미러링을 위한 것이므로 옵션이 아니라는 것을 사전에 결정하였습니다.


## 제안 로직

`Object.getOwnPropertyDescriptor`의 또 다른 버전으로서, 해당 제안은 제네릭 객체이 가진 모든 `descriptor`를 한번의 작업으로 탐색하는 것을 말한다.

해당 제안의 **polyfill**은 아래와 같다.

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

## 설명하기 위한 예제

위의 폴리필은 ES5 또는 부분적인 ES2015를 지원하는 엔진에서 동작하는 보일러플레이트를 개선한 것이다.

`Object.getOwnPropertyDescriptors`을 통해서 두개의 객체간 얕은 복사와 클로닝이 가능하다. 예제를 보자.

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

mixin를 통한 객체 또한 이 제안을 통해 개선이 가능하다.

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

만약  side effect를 피하고 setter/getter를 복사하며 구분 요소로 열거 가능한 속성을 사용하고자 `[[Set]]`/`[[Get]]` 대신 `[[DefineOwnProperty]]`/`[[GetOwnProperty]]`를 사용하는 방식을 `Object.assign`을 사용하여 구현하는 것을 생각해보자.

제안 이전에 메서드는 아래와 같이 구현될 것이다.

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

그러나 `Object.getOwnPropertyDescriptors`를 사용하게 되면, 위의 보일러 플레이트가 아래와 같이 구현 가능하게 된다.

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



