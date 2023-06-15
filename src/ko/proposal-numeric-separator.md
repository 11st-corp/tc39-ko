# Numeric Separators

## 4 단계

본 [제안서](https://tc39.github.io/process-document/)는 숫자 사이에 구분 문자를 허용하도록 기존 [_NumericLiteral_](https://tc39.github.io/ecma262/#prod-NumericLiteral)을 확장하기 위한 자체의 초기 초안과 Christophe Porteneuve의 [proposal-numeric-underscores](https://github.com/tdd/proposal-numeric-underscores) 사이의 병합된 결과입니다.

## 감사의 말

본 제안서는 현재 @samuelgoto, @rwaldron 및 @leobalter가 투사로서 활동했습니다.

본 제안서는 원래 @samuelgoto, @ajklein, @domenic, @rwaldron 및 @tdd에 의해 개발되었습니다.

## 제안 동기

이 기능을 통해 개발자는 숫자 그룹 간에 시각적 구분을 생성하여 숫자 리터럴을 더 읽기 쉽게 만들 수 있습니다. 큰 숫자 리터럴은 특히 긴 숫자 반복이 있는 경우 사람의 눈으로 빠르게 구문 분석하기 어렵습니다. 이것은 올바른 값 / 크기 순서를 얻는 능력을 모두 손상시킬 뿐만 아니라...

```js
1000000000   // Is this a billion? a hundred millions? Ten millions?
101475938.38 // what scale is this? what power of 10?
```

...정수를 사용하는 고정 소수점 산술과 같은 일부 사용 사례 정보를 전달하지 못합니다. 예를 들어, 재무 계산은 종종 4~6자리 고정 소수점 산술로 작동하지만 금액을 센트로 저장하는 경우에도 리터럴에 구분 기호가 없으면 명확하지 않습니다.

```js
const FEE = 12300;
// is this 12,300? Or 123, because it's in cents?

const AMOUNT = 1234500;
// is this 1,234,500? Or cents, hence 12,345? Or financial, 4-fixed 123.45?
```
밑줄(`_`, U+005F)을 구분 기호로 사용하면 숫자 리터럴(정수 및 부동 소수점 모두)의 가독성을 높일 수 있습니다(JS에서는 어쨌든 모두 부동 소수점입니다).
```js
1_000_000_000           // Ah, so a billion
101_475_938.38          // And this is hundreds of millions

let fee = 123_00;       // $123 (12300 cents, apparently)
let fee = 12_300;       // $12,300 (woah, that fee!)
let amount = 12345_00;  // 12,345 (1234500 cents, apparently)
let amount = 123_4500;  // 123.45 (4-fixed financial)
let amount = 1_234_500; // 1,234,500
```

또한 이것은 분수 및 지수 부분에서도 작동합니다.

```js
0.000_001 // 1 millionth
1e10_000  // 10^10000 -- granted, far less useful / in-range...
```

## 예시

(다음 예제는 본 제안서에 대한 Babel 변환 플러그인의 README.md에도 나타납니다.)

### 일반 숫자 리터럴

```js
let budget = 1_000_000_000_000;

// What is the value of `budget`? It's 1 trillion!
// 
// Let's confirm:
console.log(budget === 10 ** 12); // true
```

### 이진 리터럴

```js
let nibbles = 0b1010_0001_1000_0101;

// Is bit 7 on? It sure is!
// 0b1010_0001_1000_0101
//             ^
//
// We can double check: 
console.log(!!(nibbles & (1 << 7))); // true
```

### 16진수 리터럴

```js
// Messages are sent as 24 bit values, but should be 
// treated as 3 distinct bytes:
let message = 0xA0_B0_C0;

// What's the value of the upper most byte? It's A0, or 160.
// We can confirm that:
let a = (message >> 16) & 0xFF; 
console.log(a.toString(16), a); // a0, 160

// What's the value of the middle byte? It's B0, or 176.
// Let's just make sure...
let b = (message >> 8) & 0xFF;
console.log(b.toString(16), b); // b0, 176

// What's the value of the lower most byte? It's C0, or 192.
// Again, let's prove that:
let c = message & 0xFF;
console.log(c.toString(16), b); // c0, 192
```

### BigInt 리터럴

숫자 구분 기호는 BigInt 리터럴 내에서도 사용할 수 있습니다.

```js
// Verifying max signed 64 bit numbers:
const max = 2n ** (64n - 1n) - 1n;
console.log(max === 9_223_372_036_854_775_807n);
```

숫자 리터럴과 유사하게 사용할 수도 있습니다.

```js
let budget = 1_000_000_000_000n;

// What is the value of `budget`? It's 1 trillion!
// 
// Let's confirm:
console.log(budget === BigInt(10 ** 12)); // true
```

숫자 구분 기호는 BigInt 리터럴의 숫자 사이에만 허용되며, BigInt `n` 접미사 바로 앞은 허용되지 않습니다.

```js
// Valid
1_1n;
1_000n;
99999999_111111111_00000000n;

// Invalid: SyntaxError!
1_n;
0_n;
1000000_n;
1_000_000_n;
```



### 8진수 리터럴

이점이 많지는 않지만, 일반적으로 레거시가 아닌 프로덕션에서 일반적으로 사용할 수 있는 숫자 구분 기호는 8진수 리터럴 프로덕션에서 사용할 수 있습니다. 즉, 기능의 의도는 레거시가 아닌 숫자 리터럴 유형에서 광범위하게 사용할 수 있도록 하는 것입니다.

```js
let x = 0o1234_5670;
let partA = (x & 0o7777_0000) >> 12; // 3 bits per digit
let partB = x & 0o0000_7777;
console.log(partA.toString(8)); // 1234
console.log(partB.toString(8)); // 5670
```

## 명세서

명세서 설계에 대해 [여기](https://github.com/tc39/proposal-numeric-separator/blob/main/spec.md)와 [여기](https://tc39.github.io/proposal-numeric-separator)에서 더 자세한 버전을 볼 수 있습니다.

## 배경

### 대체 구문

우리의 허수아비 전략은 더 제한적인 규칙(즉, 두 가지 관용어를 모두 허용하지 않음)으로 시작하여 나중에 필요한 경우 이를 잃는 것입니다(더 광범위하게 시작하고 나중에 이를 강화하기 위해 이전 버전과의 호환성에 대해 걱정하는 것과는 반대로).

그 외에도 (a)여러 개의 연속된 밑줄 또는 (b)숫자 앞/뒤에 밑줄이 효과적으로 사용되는 좋은/실용적인 증거를 찾을 수 없었기 때문에, 필요/원하는 경우 추가를 나중 단계에 남겨두기로 했습니다.

### 특성

'_'는 1단계 승인의 일부로 동의되었습니다.
다음 예는 다른 프로그래밍 언어에 표시되는 숫자 구분 기호를 보여줍니다.

- **`_` (Java, Python, Perl, Ruby, Rust, Julia, Ada, C#)**
- `'` (C++)

## 사양 구축

```sh
npm i
npm run build
```

## 참조

### 선행 기술

* [Java7](https://docs.oracle.com/javase/7/docs/technotes/guides/language/underscores-literals.html): multiple, 오직 숫자 사이만 가능.

```java
float pi = 	3.14_15F;
long hexBytes = 0xFF_EC_DE_5E;
long hexWords = 0xCAFE_F00D;
long maxLong = 0x7fff_ffff_ffff_ffffL;
byte nybbles = 0b0010_0101;
long bytes = 0b11010010_01101001_10010100_10010010;
```

> 처음 두 예제는 사실 어떤 환경에서는 정확하지 않을 수 있습니다.
장단점:

```java
float pi1 = 3_.1415F;      // Invalid; cannot put underscores adjacent to a decimal point
float pi2 = 3._1415F;      // Invalid; cannot put underscores adjacent to a decimal point

int x1 = _52;              // This is an identifier, not a numeric literal
int x2 = 5_2;              // OK (decimal literal)
int x3 = 52_;              // Invalid; cannot put underscores at the end of a literal
int x4 = 5_______2;        // OK (decimal literal)

int x5 = 0_x52;            // Invalid; cannot put underscores in the 0x radix prefix
int x6 = 0x_52;            // Invalid; cannot put underscores at the beginning of a number
int x7 = 0x5_2;            // OK (hexadecimal literal)
int x8 = 0x52_;            // Invalid; cannot put underscores at the end of a number

int x9 = 0_52;             // OK (octal literal)
int x10 = 05_2;            // OK (octal literal)
int x11 = 052_;            // Invalid; cannot put underscores at the end of a number
```

* [C++](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2013/n3499.html): single, 숫자 사이 가능 (다른 구분 기호 선택 `'`).

```c++
int m = 36'000'000  // digit separators make large values more readable
```

* [Swift](https://developer.apple.com/library/content/documentation/Swift/Conceptual/Swift_Programming_Language/LexicalStructure.html)

```swift
let m = 36_000_000 // Underscores (_) are allowed between digits for readability
```

* [Perl](http://perldoc.perl.org/perldata.html#Scalar-value-constructors): multiple, 어디든지 가능

```perl
 3.14_15_92          # a very important number
 4_294_967_296       # underscore for legibility
 0xff                # hex
 0xdead_beef         # more hex
```

* [Ruby](http://ruby-doc.org/core-2.3.0/doc/syntax/literals_rdoc.html#label-Numbers): single, 오직 숫자 사이만 가능.

```ruby
1_234
```

* [Rust](https://doc.rust-lang.org/reference.html#number-literals): multiple, 아무대나 가능.

```rust
0b1111_1111_1001_0000_i32;         // type i32
1_234.0E+18f64
```

* [Julia](https://docs.julialang.org/en/release-0.4/manual/integers-and-floating-point-numbers/): single, 오직 숫자 사이만 가능.

```julia
julia> 10_000, 0.000_000_005, 0xdead_beef, 0b1011_0010
(10000,5.0e-9,0xdeadbeef,0xb2)
```

* [Ada](http://archive.adaic.com/standards/83lrm/html/lrm-02-04.html#2.4): single, 오직 숫자 사이만 가능.

```ada
123_456
3.14159_26

```

* [Kotlin](https://kotlinlang.org/docs/reference/basic-types.html#underscores-in-numeric-literals-since-11)

```kotlin
val oneMillion = 1_000_000
val creditCardNumber = 1234_5678_9012_3456L
val socialSecurityNumber = 999_99_9999L
val hexBytes = 0xFF_EC_DE_5E
val bytes = 0b11010010_01101001_10010100_10010010
```

### 진행 중인 제안서

* [Python 제안서: 숫자 리터럴의 밑줄](https://www.python.org/dev/peps/pep-0515/#id19): single, 오직 숫자 사이만 가능.

```python
# grouping decimal numbers by thousands
amount = 10_000_000.0

# grouping hexadecimal addresses by words
addr = 0xCAFE_F00D

# grouping bits into nibbles in a binary literal
flags = 0b_0011_1111_0100_1110

# same, for string conversions
flags = int('0b_1111_0000', 2)
```

* [C# 제안서: 숫자 구분 기호](https://github.com/dotnet/roslyn/issues/216): multiple, 오직 숫자 사이만 가능.

```
int bin = 0b1001_1010_0001_0100;
int hex = 0x1b_a0_44_fe;
int dec = 33_554_432;
int weird = 1_2__3___4____5_____6______7_______8________9;
double real = 1_000.111_1e-1_000;
```

### 관련된 작업

* [1000 단위 구분 기호의 형식 지정자](https://www.python.org/dev/peps/pep-0378/)

### 구현

* [Shipping in V8 v7.5 / Chrome 75](https://v8.dev/blog/v8-release-75#numeric-separators)
* [Shipping in SpiderMonkey / Firefox 70](https://bugzilla.mozilla.org/show_bug.cgi?id=1435818)
* [Shipping in JavaScriptCore / Safari 13](https://bugs.webkit.org/show_bug.cgi?id=196351)
