# 목차

1. **[알려진 이슈](#알려진-이슈)**
2. **[객체 전개 구조 분해 ](#객체-전개-구조-분해)**
3. **[객체 전개 초기화 구문](#객체-전개-초기화-구문)**

---

# 알려진 이슈

## 특정 속성
Object.assign과 마찬가지로 특정 속성 복사합니다. 프로토타입 체인의 열거 가능한 모든 속성이 복사되는 것을 상상할 수 있습니다. Object.assign에 대한 동일한 인수가 여기에도 적용된다고 생각합니다. 즉, Object.prototype이 오염될 수 있으므로 이 구문을 사용하는 코드의 무결성을 위태롭게 할 수 있습니다.

특정 속성 나머지 개체에 나열됩니다. 이는 속성을 명시적으로 나열하는 것이 서로 다른 의미를 가지고 있음을 의미합니다.
```js
let { x, ...z } = n, y = z.y;
```
는 다음과 같지 않습니다.:
```js
let { x, y, ...z } = n;
```
이것은 혼란스러울 수 있지만, 정신적 모델은 `...`이 전체 개체를 복사할 때 편리한 것이 아니라 열거 가능한 모든 자체 키를 확장할 때 편리하다는 것입니다.

### 보안 고려 사항
구문은 라이브러리 함수(패치 적용 가능)를 거치지 않고도 소유 여부를 결정할 수 있는 새로운 방법을 도입합니다.

Object.prototype.hasOwnProperty, Object.keys 등

 이것이 노출될 수 있는 알려진 문제는 없습니다. 문제가 되는 유일한 경우는 숨겨진 속성을 도입하려는 경우입니다. 하지만 열거 불가능한 속성은 이미 이 기능을 제공합니다.

 ## 중복 키 그리고 순서 종속성

이 패턴은 레코드의 기능적 스타일 업데이트를 가능하게 하기 때문에 중복키가 허용되어야 합니다.
```js
let oldRecord = { x: 1, y: 2 };
let newRecord = { ...oldRecord, y: 3 };
newRecord; // { x: 1, y: 3 }
```
또한 이것은 객체 리터럴의 속성 순서가 순서에 순서에 따라 다르다는 것을 의미합니다.
```js
let oldRecord = { x: 1, y: 2 };
let newRecord = { y: 3, ...oldRecord };
newRecord; // { x: 1, y: 2 }
```

## 접근자
새 객체에 설명자를 복사하는 대신 모든 소스에서 접근자가 실행됩니다. 이는 자연스러운 것으로 보이며 Object.assign과 일치합니다.


## 설정자
객체 리터럴의 속성은 객체의 새 값으로 정의됩니다. 새로 정의된 설정자는 호출되지 않습니다. 이 값은 최근에 정의된, 객체에서 Object.assign이 수행하는 작업과 다릅니다.
```js
let record = { x: 1 };
let obj = { set x() { throw new Error(); }, ...record }; // 에러가 아닙니다.
obj.x; // 1
```

## Linter는 사용하지 않는 변수에 대해 불평합니다.
객체에서 속성을 선택하기 위해 구조 분해를 사용하는 경우 사용하지 않는 변수가 생깁니다.
```js
var { x, y, ...rest } = obj; // lint는 불평할 것입니다. y는 사용되지 않습니다.
foo(x, rest);
```
이것은 linter에 대한 고려 사항이며 다른 많은 언어에서 알려져 있습니다. 한 가지 가능한 해결책은 밑줄을 사용하여 사용하지 않는 변수에 주석을 추가하는 것입니다.
```js
var { x, y: _, ...rest } = obj;
foo(x, rest);
```

# 객체 전개 구조 분해

## 예제

### 얕은 복사 (프로토타입 제외)
```js
let { ...aClone } = a;
```

### 전개 속성 
```js
let { x, y, ...z } = { x: 1, y: 2, a: 3, b: 4 };
x; // 1
y; // 2
z; // { a: 3, b: 4 }
```

### 중첩 객체
```js
let complex = {
  x: { a: 1, b: 2, c: 3 },
  y: [4, 5, 6]
};

let {
  x: { a: xa, ...xbc },
  y: [y0, ...y12]
} = complex;

xa; // 1
xbc; // { b: 2, c: 3 }
y0; // 4
y12; // [5, 6]
```

### 추가 옵션을 사용하여 함수 확장
```js
function baseFunction({ a, b }) {
  // ...
}
function wrapperFunction({ x, y, ...restConfig }) {
  // X와 Y로 무언가를 합니다
  // 나머지를 baseFunction에 전달합니다
  return baseFunction(restConfig);
}
```

추가 속성을 `baseFunction`에 안전하게 추가할 수 있습니다.
```js
function baseFunction({ a, b, x }) {
  // ...
}
function wrapperFunction({ x, y, ...restConfig }) {
  // 소스 코드를 다시 작성한 이후 x는 실수로 baseFunction으로 전달되지 않습니다
  return baseFunction(restConfig);
}
```

wrapperFunction이 x 속성을 사용하면서 전달하려는 경우에는 전개 연산자를 사용하여 다시 병합할 수 있습니다.
```js
function baseFunction({ a, b, x }) {
  // ...
}
function wrapperFunction({ x, y, ...restConfig }) {
  // explicitly pass x along
  return baseFunction({ ...restConfig, x });
}
```

### 주의: 특정 속성만
```js
function ownX({ ...properties }) {
  return properties.x;
}
ownX(Object.create({ x: 1 })); // undefined
```
```js
let { x, y, ...z } = a;
// 는 같지 않다.
let { x, ...n } = a;
let { y, ...z } = n;
// x와 y가 프로토타입 체인을 사용하기 때문에
```

### 객체 전개 연산자를 사용한 오버라이딩
```js
let assembled = { x: 1, y: 2, a: 3, b: 4 };
let { x, y, ...z } = assembled;
let reassembled = { x, y, ...z };
```

### 런타임 오류
```js
let { x, y, ...z } = null; // 런타임 오류
```

### 정적 오류
```js
let { ...x, y, z } = obj; // 정적 오류
```
```js
let { x, ...y, ...z } = obj; // 구문 오류
```

### 선행 기술
**Successor-ML**
```js
val { x = x, y = y, ... = z } = obj
```
http://successor-ml.org/index.php?title=Functional_record_extension_and_row_capture

이전 토론에서 구조 분해 할당 Wiki에 대해 언급했습니다:

http://wiki.ecmascript.org/doku.php?id=discussion:destructuring_assignment#successor-ml_and_row_capture

http://wiki.ecmascript.org/doku.php?id=harmony:destructuring#issues


# 객체 전개 초기화 구문

## 예제 

### 얕은 복사 (프로토타입 제외)

```js
let aClone = { ...a };
```
Desugars into:
```js
let aClone = Object.assign({}, a);
```

### 두 객체 합병
```js
let ab = { ...a, ...b };
```

Desugars into:
```js
let ab = Object.assign({}, a, b);
```

### 속성 재정의
```js
let aWithOverrides = { ...a, x: 1, y: 2 };
// 와 동등한
let aWithOverrides = { ...a, ...{ x: 1, y: 2 } };
// 와 동등한
let x = 1, y = 2, aWithOverrides = { ...a, x, y };
```
Desugars into:
```js
let aWithOverrides = Object.assign({}, a, { x: 1, y: 2 });
```
### 기본 속성 
```js
let aWithDefaults = { x: 1, y: 2, ...a };
```
Desugars into:
```js
let aWithDefaults = Object.assign({}, { x: 1, y: 2 }, a);
// which can be optimized without the empty object
let aWithDefaults = Object.assign({ x: 1, y: 2 }, a);
```
### 다중 병합
```js
// 접근자가 두 번 실행됩니다.
let xyWithAandB = { x: 1, ...a, y: 2, ...b, ...a };
```
Desugars into:
```js
let xyWithAandB = Object.assign({ x: 1 }, a, { y: 2 }, b, a);
```
### 객체 초기화 구문에 대한 접근자
```js
// .x가 아직 평가되지 않았기 때문에 오류를 던지지 않습니다. x는 정의되어 있습니다.
let aWithXGetter = { ...a, get x() { throw new Error('not thrown yet') } };
```
Desugars into:
```js
let aWithXGetter = {};
Object.assign(aWithXGetter, a);
Object.defineProperty(aWithXGetter, "x", {
  get(){ throw new Error('not thrown yet') },
  enumerable : true,
  configurable : true
});
```
### 전개 객체의 접근자
```js
// 내부 객체의 .x 속성이 평가될 때 오류를 던집니다.
// 속성 값이 주변 객체 초기화 구문으로 복사됩니다.
let runtimeError = { ...a, ...{ get x() { throw new Error('thrown now') } } };
```
### 재정의된 경우 설정자가 실행되지 않습니다.
```js
let z = { set x() { throw new Error(); }, ...{ x: 1 } }; // 오류가 없습니다.
```
### Null/Undefined은 무시됩니다.
```js
let emptyObject = { ...null, ...undefined }; // 런타임 오류가 없습니다.
```
### 깊은 불변 객체 업데이트
```js
let newVersion = {
  ...previousVersion,
  name: 'New Name', // name 속성 재정의합니다.
  address: { ...previousVersion.address, zipCode: '99999' } // 중첩 zipCode 업데이트합니다.
  items: [...previousVersion.items, { title: 'New Item' }] // item 리스트에 item을 추가합니다.
};
```
### 선행 기술
**Successor-ML**
```js
{ ... = a, x = 1, y = 2 }
```
http://successor-ml.org/index.php?title=Functional_record_extension_and_row_capture

**Elm**
```js
{ a | x <- 1, y <- 2 }
```
http://elm-lang.org/learn/Records.elm#updating-records

**OCaml**
```js
{ a with x = 1; y = 2 }
```
https://realworldocaml.org/v1/en/html/records.html#functional-updates

**Haskell**
```js
a { x = 1, y = 2 }
```
http://www.haskell.org/haskellwiki/Default_values_in_records