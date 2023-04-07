# Proposal Symbol Description

ES2019

## 명세서

### Spec

1. Let s be the this value.
2. Let sym be ? thisSymbolValue(s).
3. Return sym.[[Description]].

## 설명

읽기 전용 속성입니다. symbol에 직접 접근할 수 없지만, 디버깅 용도로 생성하여 사용할 수 있습니다. `Symbol.prototype.toString()`와는 `"Symbol()"` 문자열을 포함하지 않는다는 것에 있어서 차이점이 있습니다.

```js
Symbol("desc").toString(); // "Symbol(desc)"
Symbol("desc").description; // "desc"
```

## 제안 동기 ([V8 블로그 Symbol.prototype.description](https://v8.dev/features/symbol-description))

이전까지는 프로그래밍 방식으로 설명에 접근하는 유일한 방법은 `Symbol.prototype.toString()`를 통해 간접적으로 접근하는 방법밖에 없었다.

```js
const symbol = Symbol('foo');
//                    ^^^^^
symbol.toString();
// → 'Symbol(foo)'
//           ^^^
symbol.toString().slice(7, -1); // 🤔
// → 'foo'
```

이런 방식은 코드가 마술처럼 보이고 자명하지 않다. 또, "구현보다는 의도를 표현하라 (express intent, not implementation)" 원칙에 위배된다. 일레로 `Symbol()`과 `Symbol('')`의 설명을 구분할 수 없다.

```js
Symbol().toString()  // 'Symbol()'
Symbol('').toString() // 'Symbol()'
```

새로운 `Symbol.prototype.description` getter는 설명에 보다 좋은 접근 방법을 제공합니다.

```js
const symbol = Symbol('foo');
//                    ^^^^^
symbol.description;
// → 'foo'
```

`Symbol()`과 `Symbol('')`도 구분 가능합니다.

```js
Symbol("").description; // ""
Symbol().description; // undefined
```

## 이슈

### Getter vs Method

> 메서드 대신에 getter를 사용해야하는 이유?

`RegExp.prototype.flags`, `Object.prototype.__proto__`, `Map.prototype.size`, `Set.prototype.size`,` Error.prototype.stack`, `%TypedArrayPrototype%.buffer`, `%TypedArrayPrototype%.byteLength`, `%TypedArrayPrototype%.byteOffset` 이러한 `__proto__` 속성들은 모두 읽기 전용이며 setter 없이 getter로만 구현이 되었다.
