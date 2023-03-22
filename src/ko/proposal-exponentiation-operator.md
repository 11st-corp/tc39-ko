# Exponentiation Operator

## 상태

### 4 단계

구현 진행 단계

- Traceur
- Babel
- V8 (https://code.google.com/p/v8/issues/detail?id=3915)
- SpiderMonkey (https://bugzilla.mozilla.org/show_bug.cgi?id=1135708)

## 작성자

- Rick Waldron
- Claude Pache
- Brendan Eich

## 검토자

- Brian Terlson
- Erik Arvidsson
- Dmitry Lomov
- Cait Potter
- Jason Orendorff
- Waldemar Horwat

## 정보를 주는

- 일반적으로 수학, 물리학 및 로봇 공학에서 사용됩니다.
- [중위 표기법](https://en.wikipedia.org/wiki/Infix_notation)은 함수 표기법보다 간결하므로 더 선호됩니다.

### 선행 기술

- Python
  - `math.pow(x, y)`
  - `x ** y`
- CoffeeScript
  - `x ** y`
- F#
  - `x ** y`
- Ruby
  - `x ** y`
- Perl
  - `x ** y`
- Lua, Basic, MATLAB, etc.
  - `x ^ y`

### 사용법

```js
// x ** y

let squared = 2 ** 2;
// same as: 2 * 2

let cubed = 2 ** 3;
// same as: 2 * 2 * 2
```

```js
// x **= y

let a = 2;
a **= 2;
// same as: a = a * a;

let b = 3;
b **= 3;
// same as: b = b * b * b;
```

### 명세서 렌더링

```js
ecmarkup spec/index.html index.html
```
