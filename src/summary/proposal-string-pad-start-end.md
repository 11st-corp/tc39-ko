# 목차

1. **[사전 지식](#사전-지식)**
2. **[다른 언어 사례](#다른-언어-사례)**
3. **[`pad` 하나의 메서드가 아닌 `padStart`, `padEnd` 두 개의 메서로 나뉜 이유?](#pad-하나의-메서드가-아닌-padstart-padend-두-개의-메서로-나뉜-이유)**
4. **[구현](#구현)**
5. **[Edge Case](#Edge-Case)**

---

Specification: ES2017

## 사전 지식

### code point

'code point'는 유니코드의 특정 문자를 나타내는 숫자 값이다.

> All Unicode code point values from U+0000 to U+10FFFF, including surrogate code points, may occur in ECMAScript source text where permitted by the ECMAScript grammars. https://tc39.es/ecma262/multipage/ecmascript-language-source-code.html

### Surrogate pairs

'Surrogate pairs'는 저장하는 데 16비트 이상이 필요한 JavaScript의 유니코드 코드 포인트를 나타내는 방법이다. JavaScript는 UTF-16 인코딩을 사용한다. 즉, 각 문자는 하나 또는 두 개의 16비트 코드 단위로 표현된다.

대부분의 이모지와 일부 희귀 문자를 포함하는 BMP(Basic Multilingual Plane) 외부의 문자를 나타내려면 두 개의 16비트 코드 단위가 필요하다. 이러한 코드 단위 쌍을 'Surrogate pairs'라고 한다.

UTF-16에서 'Surrogate pairs'는 'high surrogate'와 'low surrogate'로 구성된다. 'high surrogate'는 `0xD800–0xDBFF` 범위의 코드 단위이고 'low surrogate'는 `0xDC00–0xDFFF` 범위의 코드 단위이다.

### Surrogate pairs length

'high surrogate'와 'low surrogate'로 구성된 Surrogate pairs는 아래와 같은 방법으로 길이를 알 수 있다.

```js
const str = 'The 💩💩💩.';
console.log(str.length); // 11
console.log(Array.from(str).length); // 8
```

하지만 결합된 이모지는 더 길 수 있다. 이 경우 길이를 측정하기는 생각보다 복잡하다.

```js
"🏳️‍🌈".length == 6 // true
"🌷".length == 2 // true
Array.from("🌷") // ['🌷']
Array.from("🏳️‍🌈") // (4) ['🏳', '️', '‍', '🌈']
```

관심이 있다면, 세부 내용은 [grapheme-splitter](https://github.com/orling/grapheme-splitter/tree/master)를 참고 해보자.

## 다른 언어 사례

- [💩](https://charbase.com/1f4a9-unicode-pile-of-poo)
- [�](https://charbase.com/d83d-unicode-invalid-character)

### 길이와 채워질 문자열을 모두 지정할 수 있는 기능이 있는 것들

**Ruby** `v1.9.3` has `ljust` and `rjust`. - they do accept code points.

```rb
'abc'.rjust(4, '💩') => "💩abc"
'abc'.ljust(4, '💩') => "abc💩" 
```

**PHP** has `strpad`, which changes a surrogate pair code point to `?` and totally breaks the length filling:

```php
echo str_pad('abc', 6, '💩', STR_PAD_LEFT); // "?abc" 
echo str_pad('abc', 6, '💩', STR_PAD_RIGHT); // "abc?"
echo str_pad('abc', 7, '💩', STR_PAD_RIGHT); // "abc💩"
```

### 잘리지 않는 것들

**sed**는 잘리지 않으며, 사용자가 채우기 문자열을 명시적으로 지정하기 때문에 shell(터미널)이 코드 포인트를 지원하는 경우 sed도 마찬가지로 지원한다.

```sh
echo 'abc' | sed -e :a -e 's/^.\{1,5\}$/&💩/;ta' => abc💩💩💩
echo 'abc' | sed -e :a -e 's/^.\{1,5\}$/💩&/;ta' => 💩💩💩abc
```

**Scala**는 반대편에서 자르거나 패딩하지 못하게 하며, 숫자 인수는 '채워질 문자열의 발생 횟수'이다. 또한 대리 쌍 코드 포인트를 `?`로 변환합니다.

```scala
"abc".padTo(6, "💩").mkString => "abc???"
```

### 하나의 공백만 허용하는 언어들

**Java** has `String.format`, which only pads with a single space:

```java
String.format("%6s", "abc") => "   abc"
String.format("%-6s", "abc") => "abc   "
```

**Smalltalk** and **Perl** have `sprintf` which only fills with a single space.

### 기타

**Python** also has `ljust` and `rjust`, but throws if you provide a multiple character fillStr. When you provide non-ascii chars, it also throws:

```python
'abc'.ljust(6, '💩') => UnicodeEncodeError: 'ascii' codec can't encode characters in position 3-5: ordinal not in range(128)
'abc'.rjust(6, '💩') => UnicodeEncodeError: 'ascii' codec can't encode characters in position 3-5: ordinal not in range(128)
```

### 결론

Ruby 1.9를 제외한 사용자가 채워질 문자열을 지정하는 기능이 있는 언어는 non-ASCII 일 때, 깨지거나 오류가 발생한다.

루비 1.9는 자바스크립트에 부족한 언어 수준의 유니코드 지원이 많아서 코드 포인트를 지원하는 것은 적절하지 않다. 또한, 코드 포인트를 지원하는 것은 알고리즘을 매우 복잡하게 만들어서 지원하지 않는다.

> we deal with the same thing that native Strings, and their length, do - code units, not code points.

자바스크립트는 코드 단위로 처리한다.

```javascript
"abc".padEnd(4, '💩') // 'abc\uD83D'
"abc".padEnd(5, '💩') // 'abc💩'
```

## [`pad` 하나의 메서드가 아닌 `padStart`, `padEnd` 두 개의 메서로 나뉜 이유?](https://github.com/tc39/proposal-string-pad-start-end/issues/19#issuecomment-181964632)

> In general, it's preferable imo and less error-prone to have two methods rather than one that's overloaded based on the sign of the argument.

일반적으로 인수의 부호에 따라 오버로드된 하나의 메서드보다 두 개의 메서드를 갖는 것이 더 바람직하고 오류가 덜 발생합니다.

## 구현

 - Firefox / SpiderMonkey [patch](https://bugzilla.mozilla.org/show_bug.cgi?id=1260509)
 - Chrome / v8 [patch](https://chromium.googlesource.com/v8/v8/+/1a272ba23ec490f73349201c014537c851f3c964)
 - Safari + Webkit / JavaScriptCore
 - Edge / Chakra [PR](https://github.com/chakra-core/ChakraCore/pull/174)

## Edge Case

(1) 명시적인 빈 문자열이 제공될 때(또는 ToString이 빈 문자열인 경우) padStart/padEnd가 단순히 문자열을 있는 그대로 반환한다. ([참고](https://github.com/tc39/proposal-string-pad-start-end/issues/21#issuecomment-203075849))

```js
'abc'.padStart('', 5) // 'abc'
```

(2) 기타

```js
"abc".padEnd(4, "\u{1F382}") // 'abc�'
"abc".padEnd(5, "\u{1F382}") // 'abc🎂'
"abc".padEnd(5, "🎂") // 'abc🎂'
```

```js
"abc".padEnd(4, "🏳️‍🌈") // 'abc�'
"abc".padEnd(5, "🏳️‍🌈") // 'abc🏳'
"abc".padEnd(6, "🏳️‍🌈") // 'abc🏳️'
"abc".padEnd(7, "🏳️‍🌈") // 'abc🏳️‍'
"abc".padEnd(8, "🏳️‍🌈") // 'abc🏳️‍�'
"abc".padEnd(9, "🏳️‍🌈") // 'abc🏳️‍🌈'
```
