# Object에 속성을 선언하는 방법.

## 'property accessor', 속성의 접근자

> 속성 접근자는 `.`(dot) 또는 `[]`(square bracket)을 사용하여 객체에 접근하는 방법이다.

- 이 접근자를 통해 역으로, 객체의 속성을 정의할 수 있다.
- 속성 접근자는 `string`, `symbol`만 사용할 수 있다. 이는 값만으로 구별가능해야하기 때문이다.


## `Object.defineProperty()`와 'descriptor', 속성의 설명자

JS는 객체에 속성을 선언하는 메서드를 `Object.defineProperty()`로 따로 만들어두었다. 이는 'descriptor'를 통해 속성을 정의하기 위함이다.

```javascript
Object.defineProperty(obj, prop, descriptor)
```

### prop

- 속성의 접근자의 역할을 할 key 값 (`string` or `symbol`)


### descriptor (설명자)

기본적으로 할당을 통해 속성을 선언/수정하게 되면, 해당 속성에 대해 열거, 변경, 삭제가 가능하다. 하지만 해당 메서드를 사용하여 속성을 선언하게 되면 값 뿐 만 아니라 속성의 특성까지 정의할 수 있다. 기본적으로 메서드를 사용하여 선언된 속성은 열거, 수정, 삭제가 불가능하다.
추가적으로 해당 메서드는 할당을 통해 속성을 선언할 때 사용하는 `[[set]]`을 사용하는 것이 아니라, `[[DefineOwnProperty]]`를 사용한다. 즉 내부 로직이 다르기 때문에 속성의 세부적인 특성까지 선언할 수 있는 것이다.

> 참고로, 객체에 내에 선언되는 속성을 `own property`라고 한다. 이는 객체의 속성이라도 프로토타입 체인에 의해 선언되는 속성이 존재하기 때문에 이를 구별하기 위해 `property`가 아닌 `own property`를 사용하는 것으로 보인다.

> `enumerable`(열거가능)의 의미는 `for in`, `Object.keys`를 통해 속성을 열거하는 작업을 수행할 때 접근가능한 속성을 의미한다.

이 때, descriptor는 `value descriptor`, `accessor descriptor` 두 가지를 통해 표현된다. 둘 모두 속성을 설명하는 특성을 객체의 형태로 표현하고 있는데, 두 개의 차이는 다음과 같다.

1. `value descriptor` - 특정한 값을 가진 속성을 선언하는 방식, 객체 내의 `value` key로 **속성의 값**을 정의한다.
2. `acccessor descriptor` - `getter` `setter`를 선언하는 방식, `get`, `set` key로 **속성을 접근하는 방식**을 정의한다.

### descriptor가 속성

속성(`own property`)을 선언하기 위해 사용하는 descriptor가 가진 속성(`descriptor property`)을 말한다.

1. `configurable` - 속성의 descriptor의 변경여부. `false`을 경우, descriptor가 변경되지 않으며 해당 속성이 삭제되지 않는다. 하지만 `writable`이 `true`일 경우, 속성의 값은 변경될 수 있으며, `writable` 또한 `false`로 변경이 가능하다.
2. `enumerable` - 객체의 속성을 열거할 때, 속성 접근 가능여부
3. `writable`- 객체의 값의 변경 가능여부
4. `get` - 속성에 대한 접근 로직, `this` - 객체
5. `set` - 속성의 값 할당 로직, `this` - 객체, parameter는 전달되는 값

어려운 점은, descriptor 또한 객체이므로 prototype link가 존재하여 prototype chain 상에서 접근가능한 속성(`descriptor property`) 또한 고려될 수 있다는 것이다. 이를 통해 descriptor의 prototype link 상의 prototype object를 변경하는 방식으로 여러 객체의 속성의 descriptor를 변경할 수 있게 된다.

> **prototype chain의 객체가 가진 descritor 또한 객체의 속성에 영향을 준다.** 

```javascript
function MyClass() {}

MyClass.prototype.x = 1;
Object.defineProperty(MyClass.prototype, "y", {
  writable: false,
  value: 1,
});

const a = new MyClass();
a.x = 2;
console.log(a.x); // 2
console.log(MyClass.prototype.x); // 1
a.y = 2; // Ignored, throws in strict mode
console.log(a.y); // 1
console.log(MyClass.prototype.y); // 1
```

- `MyClass`의 prototype object에 `y` 속성을 `descriptor`를 사용하여 선언하였다. 
- prototype object가 가진 속성이지만 `MyClass`의 모든 인스턴스에 해당 속성을 상속할 뿐 만 아니라, descriptor의 영향을 받는다. 이로 인해 모든 인스턴스는 `y` 속성에 대한 재선언 및 수정/삭제가 불가능하다.

그렇다면, descriptor 또한 하나의 객체이므로 descriptor의 prototype chain 상의 속성이 객체의 속성`own property`에 영향을 줄 것인가에 대해서 생각해보자.
descriptor를 인자로 전달할 때, 접근 가능한 속성을 참조하여 snapshot으로 전달한다. 그러므로 descriptor의 prototype chain 상의 값을 변경하게 되더라도 `own property`에 전혀 영향을 주지 않는다. 

```javascript
var po = { writable: true };

var o = Object.create(po);
o.value = 3;

var j = {};
Object.defineProperty(j, 'y', o);
console.log(j.y); // 3

j.y = 4;
console.log(j.y); // 4

po.writable = false;
j.y = 5;
console.log(j.y); // 5
```

- `o`는 `j`객체의 `y`속성 descriptor의 역할을 수행한다. `o`의 prototype link가 참조하는 prototype object인 `po`의 `writable`을 변경하여 속성값의 변경을 막고자 하였다.
- 하지만 `y` 속성의 수정이 이루어지는 것으로 보아, descriptor의 prototype object가 변경되더라도 영향을 주지 않는다. 즉, `defineProperty`호출 시점의 객체의 값을 사용한다. (deep copy의 방식)

#### 결론적으로, descriptor의 prototype chain은 속성(`own property`)에 영향을 주지 않는다. 이는 호출시점에 descriptor의 값을 사용하기 때문이다.

#### 객체의 prototype link로 참조하고 있는 prototype object에 descriptor로 선언된 속성은 속성(`own property`)에 영향을 준다.

----



# Object를 복사하는 방법# Object에 속성을 선언하는 방법.

## 'property accessor', 속성의 접근자

> 속성 접근자는 `.`(dot) 또는 `[]`(square bracket)을 사용하여 객체에 접근하는 방법이다.

- 이 접근자를 통해 역으로, 객체의 속성을 정의할 수 있다.
- 속성 접근자는 `string`, `symbol`만 사용할 수 있다. 이는 값만으로 구별가능해야하기 때문이다.


## `Object.defineProperty()`와 'descriptor', 속성의 설명자

JS는 객체에 속성을 선언하는 메서드를 `Object.defineProperty()`로 따로 만들어두었다. 이는 'descriptor'를 통해 속성을 정의하기 위함이다.

```javascript
Object.defineProperty(obj, prop, descriptor)
```

### prop

- 속성의 접근자의 역할을 할 key 값 (`string` or `symbol`)


### descriptor (설명자)

기본적으로 할당을 통해 속성을 선언/수정하게 되면, 해당 속성에 대해 열거, 변경, 삭제가 가능하다. 하지만 해당 메서드를 사용하여 속성을 선언하게 되면 값 뿐 만 아니라 속성의 특성까지 정의할 수 있다. 기본적으로 메서드를 사용하여 선언된 속성은 열거, 수정, 삭제가 불가능하다.
추가적으로 해당 메서드는 할당을 통해 속성을 선언할 때 사용하는 `[[set]]`을 사용하는 것이 아니라, `[[DefineOwnProperty]]`를 사용한다. 즉 내부 로직이 다르기 때문에 속성의 세부적인 특성까지 선언할 수 있는 것이다.

> 참고로, 객체에 내에 선언되는 속성을 `own property`라고 한다. 이는 객체의 속성이라도 프로토타입 체인에 의해 선언되는 속성이 존재하기 때문에 이를 구별하기 위해 `property`가 아닌 `own property`를 사용하는 것으로 보인다.

> `enumerable`(열거가능)의 의미는 `for in`, `Object.keys`를 통해 속성을 열거하는 작업을 수행할 때 접근가능한 속성을 의미한다.

이 때, descriptor는 `value descriptor`, `accessor descriptor` 두 가지를 통해 표현된다. 둘 모두 속성을 설명하는 특성을 객체의 형태로 표현하고 있는데, 두 개의 차이는 다음과 같다.

1. `value descriptor` - 특정한 값을 가진 속성을 선언하는 방식, 객체 내의 `value` key로 **속성의 값**을 정의한다.
2. `acccessor descriptor` - `getter` `setter`를 선언하는 방식, `get`, `set` key로 **속성을 접근하는 방식**을 정의한다.

### descriptor가 속성

속성(`own property`)을 선언하기 위해 사용하는 descriptor가 가진 속성(`descriptor property`)을 말한다.

1. `configurable` - 속성의 descriptor의 변경여부. `false`을 경우, descriptor가 변경되지 않으며 해당 속성이 삭제되지 않는다. 하지만 `writable`이 `true`일 경우, 속성의 값은 변경될 수 있으며, `writable` 또한 `false`로 변경이 가능하다.
2. `enumerable` - 객체의 속성을 열거할 때, 속성 접근 가능여부
3. `writable`- 객체의 값의 변경 가능여부
4. `get` - 속성에 대한 접근 로직, `this` - 객체
5. `set` - 속성의 값 할당 로직, `this` - 객체, parameter는 전달되는 값

어려운 점은, descriptor 또한 객체이므로 prototype link가 존재하여 prototype chain 상에서 접근가능한 속성(`descriptor property`) 또한 고려될 수 있다는 것이다. 이를 통해 descriptor의 prototype link 상의 prototype object를 변경하는 방식으로 여러 객체의 속성의 descriptor를 변경할 수 있게 된다.

> **prototype chain의 객체가 가진 descritor 또한 객체의 속성에 영향을 준다.**

```javascript
function MyClass() {}

MyClass.prototype.x = 1;
Object.defineProperty(MyClass.prototype, "y", {
  writable: false,
  value: 1,
});

const a = new MyClass();
a.x = 2;
console.log(a.x); // 2
console.log(MyClass.prototype.x); // 1
a.y = 2; // Ignored, throws in strict mode
console.log(a.y); // 1
console.log(MyClass.prototype.y); // 1
```

- `MyClass`의 prototype object에 `y` 속성을 `descriptor`를 사용하여 선언하였다.
- prototype object가 가진 속성이지만 `MyClass`의 모든 인스턴스에 해당 속성을 상속할 뿐 만 아니라, descriptor의 영향을 받는다. 이로 인해 모든 인스턴스는 `y` 속성에 대한 재선언 및 수정/삭제가 불가능하다.

그렇다면, descriptor 또한 하나의 객체이므로 descriptor의 prototype chain 상의 속성이 객체의 속성`own property`에 영향을 줄 것인가에 대해서 생각해보자.
descriptor를 인자로 전달할 때, 접근 가능한 속성을 참조하여 snapshot으로 전달한다. 그러므로 descriptor의 prototype chain 상의 값을 변경하게 되더라도 `own property`에 전혀 영향을 주지 않는다.

```javascript
var po = { writable: true };

var o = Object.create(po);
o.value = 3;

var j = {};
Object.defineProperty(j, 'y', o);
console.log(j.y); // 3

j.y = 4;
console.log(j.y); // 4

po.writable = false;
j.y = 5;
console.log(j.y); // 5
```

- `o`는 `j`객체의 `y`속성 descriptor의 역할을 수행한다. `o`의 prototype link가 참조하는 prototype object인 `po`의 `writable`을 변경하여 속성값의 변경을 막고자 하였다.
- 하지만 `y` 속성의 수정이 이루어지는 것으로 보아, descriptor의 prototype object가 변경되더라도 영향을 주지 않는다. 즉, `defineProperty`호출 시점의 객체의 값을 사용한다. (deep copy의 방식)

#### 결론적으로, descriptor의 prototype chain은 속성(`own property`)에 영향을 주지 않는다. 이는 호출시점에 descriptor의 값을 사용하기 때문이다.

#### 객체의 prototype link로 참조하고 있는 prototype object에 descriptor로 선언된 속성은 속성(`own property`)에 영향을 준다.

[defineProperty MDN 공식 페이지](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)

----

# Object를 복사하는 방법

## 얕은 복사(shallow copy)과 깊은 복사(deep copy)

얕은 복사와 깊은 복사의 차이는, **원본의 변경이 사본에 영향을 주는가**의 차이이다.
1. shallow copy - 객체가 참조하는 값을 복사한다. JS는 기본적으로 객체의 속성이 해당 값을 참조하는 것이 아니라, 값이 저장된 주솟값을 참조하고 있기 때문에 해당 복사 방법을 사용한다.   
2. deep copy - 객체가 참조하는 값의 주소값까지 복사한다.

추가적으로, 
1. call by reference - 전달되는 값을 주소값으로 사용하여, 해당 주소값이 참조하고 있는 값을 사용한다.
2. call by value - 전달되는 값을 그대로 값으로 사용한다.

## `Object.assign()`

```javascript
Object.assign(target, ...sources)
```


`target`에 `sources`의 열거가능(`enumerable`)하고, 객체가 가진 속성(`own property`)을 할당한다. 이 때, 이 복사는 shallow copy이다. 
이 때, 중요한 것은 `sources`의 속성 중, `enumerable`한 속성만을 복사한다는 것이다. 

- 속성을 복사할 때, `[[Get]]`을 호출하여 속성의 값을 평가하여 `[[Set]]`을 호출하여 `target`에 속성을 할당한다.  
- prototype object에 속성을 할당하는 경우 주로 `Object.defineProperty()`를 사용한다. 이 때 속성을 할당하는 로직이 `[[Set]]`, `[[Get]]`이 아닌 `[[DefineOwnProperty]]`이기 때문에 prototype object에 속성을 할당힐 때는 사용하지 않는다.
- 이 때, 로직이 다른 것도 있지만 `getter`가 선언되는 방식이 아니라 `getter`를 수행하여 나오는 값 자체를 할당하기 때문이다.

```javascript
const obj = {
  foo: 1,
  get bar() {
    return 2;
  },
};

let copy = Object.assign({}, obj);
console.log(copy);
// { foo: 1, bar: 2 }
```

기본적으로 `Object.assign`은 얕은 복사이다. 즉, 값만을 복사하여 할당하기 때문에 복사되는 속성이 참조형 타입일 경우 `sources`의 변경이 `target`에 영향을 줄 수 있다.


[Object.assign MDN 공식 페이지](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)



