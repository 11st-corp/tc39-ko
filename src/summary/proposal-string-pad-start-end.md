# 목차

1. **[다른 언어 사례](#다른-언어-사례)**

---

Specification: ES2017

## 다른 언어 사례

- [💩](https://charbase.com/1f4a9-unicode-pile-of-poo)
- [�](https://charbase.com/d83d-unicode-invalid-character)

> **참고:** "코드 포인트"는 유니코드의 특정 문자를 나타내는 숫자 값이다.

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
