#PR

## typo: fix mixin solution

기존의 mixin에 대한 예제를 아래와 같이 사용하는 것이 더 나은 방법이라고 생각한다.

```javascript
/** mixin solution */
const mix = obj => ({
    with : (...mixins) => mixins.reduce((c, mixin) => shallowMerge(c, mixin), obj),
});
```

### 기존의 제안
```javascript
let mix = (object) => ({
  with: (...mixins) => mixins.reduce(
    (c, mixin) => Object.create(
      c, Object.getOwnPropertyDescriptors(mixin)
    ), object)
});
```

### PR의 제안
```javascript
let mix = (object) => ({
  with: (...mixins) => mixins.reduce(
    (c, mixin) => Object.defineProperties(
      c, Object.getOwnPropertyDescriptors(mixin)
    ), object)
});
```

기존의 `Object.create()`대신 `Object.defineProperties()`를 사용한 것이다. 일단 두가지의 차이부터 알아야한다.

### `Object.create()`

> `Object.create()` 메서드는 지정된 프로토타입 객체 및 속성(property)을 갖는 새 객체를 만든다.

```javascript
Object.create(proto[, propertiesObject])
```

#### `proto`

- 생성되는 객체가 가질 프로토타입 객체
- `new` 연산자를 사용하여 생성하면, 기본적으로는 생성자 함수의 `prototype` 속성의 Object를 바인딩한다.

Prototype Object는  `__proto__` 속성을 가지는데 아래는 해당 속성의 폴리필이다.

```javascript
Object.defineProperty( Object.prototype, "__proto__", {
	get: function() {
		return Object.getPrototypeOf( this );
	},
	set: function(o) {
		// setPrototypeOf(..) as of ES6
		Object.setPrototypeOf( this, o );
		return o;
	}
} );
```

- Object.prototype 객체에 `__proto__` 속성을 선언한다.
- `defineProperty`는 세번째 인자로 해당 속성의 descriptor를 받는다.
- 실제로 해당 속성은 `Object.getPrototypeOf()`, `Object.setPrototypeOf`를 사용하여 해당 객체(`this`)의 prototype 객체를 반환한다.
- 즉, 기존에 존재하는 prototype 메서드를 쉽게 사용하기 위해서 속성으로 선언한 것으로 볼 수 있다.


#### `propertiesObject`

- 프로토타입이 아닌 생성되는 객체가 가질 속성을 가진 객체
- 속성명 : 속성 설명자를 각각 key, value로 가진 객체를 전달한다.
- `Object.defineProperties()`의 두번째 인수에 해당한다. 즉, 해당 함수를 두번째 인수로 넣어 수행하여 객체 내부에 속성을 정의한다.

#### 고전적인 상속방법

```javascript
// Shape - 상위클래스
function Shape() {
  this.x = 0;
  this.y = 0;
}

// Rectangle - 하위클래스
function Rectangle() {
  Shape.call(this); // super 생성자 호출.
}

// 하위클래스는 상위클래스를 확장
Rectangle.prototype = Object.create(Shape.prototype);
Rectangle.prototype.constructor = Rectangle;
```

- super 생성자 호출 후, `Shape`의 프로토타입 객체를 `Rectangle`의 인스턴스도 사용하기 위해서 `prototype` 속성을 바인딩해야한다.
- `Rectangle.prototype = Shape.prototype`으로 할당을 하게 되면, `Rectangle`의 프로토타입 객체를 변경하게 되면 `Shape`의 인스턴스에게도 영향을 준다.
- 이를 위해 `Shape` 프로토타입 객체를 프로토타입으로 가지는 빈 객체를 생성(`Object.create()`), 해당 객체를 `Rectangle`의 `prototype` 속성으로 바인딩한다.
- `Object.create()`로 생성되는 객체는 `constructor`가 존재하지 않으므로 바인딩 해준다.


#### `propertiesObject` 인자 사용하기

```javascript
var o = Object.create(Object.prototype, {
  foo: { writable: true, configurable: true, value: 'hello' },
  bar: {
    configurable: false,
    get: function() { return 10; },
    set: function(value) { console.log('Setting `o.bar` to', value); }
  }
});

```
- `Object.create()`에서 두번째 인자를 사용하였다. 생성되는 객체는 `foo`, `bar` 두개의 속성을 가진다.
- `foo`는 정규 '값 속성'으로, 기본으로 writable, enumerable 또는 configurable 속성은 `false` 이기 때문에 `{ value : 'hello'}`으로 선언할 수 있다.
- `bar`는 '접근자(accessor, getter-및-setter) 속성'으로 선언되어있다.

'값 속성' 또는 '접근자 속성'과 같이 속성을 선언할 때 사용되는 객체를 **'속성 설명자'**라고 한다.


### `Object.defineProperties()`

> 인자로 전달된 객체에 속성의 정의하거나 수정하여 객체를 반환한다.

```javascript
Object.defineProperties(obj, props);
```

#### obj
- 속성을 정의하거나 수정할 객체

#### props
- `Object.create()`의 두번째 인자인 `propertiesObject`와 동일하다.
- 즉, 속성명과 해당 속성의 설명자(`descriptor`)를 말한다. 로직은 위의 `propertiesObject`과 차이가 없다.


### `Object.create(c, Object.getOwnPropertyDescriptors(mixin))`와 `Object.defineProperties(c, Object.getOwnPropertyDescriptors(mixin))`의 차이

- `Object.create()`는 `c`객체를 `prototype` 객체로 사용하는 빈 객체를 선언, 해당 객체에 속성의 설명자를 통해 속성을 할당한다.
- `Object.defineProperties()`는 `c`객체에 직접적으로 속성의 설명자를 통해 속성을 할당한다.

즉, `prototype chain`상 빈 객체를 'bridge'를 두어 속성을 선언할 것인가, 객체에 직접 속성을 선언할 것인가의 차이로 볼 수 있다. 실제로 PR의 제안이 더 나은 방법인가에 대해서는 잘 모르겠다. 이를 결정하기 위해서 `mixin`에 대한 지식이 필요할 것으로 보인다.



## Summary

어쨌든 이를 통해 `Object.getOwnPropertyDescriptors()`의 의미는 해당 객체가 가지는 속성 설명자를 반환하기 위해 사용된다는 것을 알게 되었다. 아래에 제시하는 개념들에 대한 공부가 더 필요할 것으로 보인다.

---

### mixin

```javascript
let mix = (object) => ({
  with: (...mixins) => mixins.reduce(
    (c, mixin) => Object.create(
      c, Object.getOwnPropertyDescriptors(mixin)
    ), object)
});
```

### `Reflect`

`Reflect`를 선언하는 코드는 아래와 같다.

```javascript
 global.Reflect = {
    defineProperty: Object.defineProperty,
    getOwnPropertyDescriptor: Object.getOwnPropertyDescriptor,
    ownKeys: function ownKeys(genericObject) {
      let gOPS = Object.getOwnPropertySymbols || function () { return []; };
      return Object.getOwnPropertyNames(genericObject)
              .concat(gOPS(genericObject));
    }
  };
```
