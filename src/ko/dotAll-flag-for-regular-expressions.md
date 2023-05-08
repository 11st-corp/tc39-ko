# 정규식의 `s`(dotAll) flag



## 상태


이 제안은 [the TC39 process](https://tc39.es/process-document/) 의 4단계에 있습니다.

<br>

## 제안 배경

---

JS의 정규식에서 마침표(`.`)는 문자의 종류와는 상관없이 단일 문자와 매칭됩니다. *ECMAScript*에서는 이 마침표(`.`)에 두가지 예외사항이 존재합니다.

1. 마침표(`.`)는 아스트랄 문자와 매칭되지 않습니다. 이 예외사항을 해결하기 위해서는 `u` flag를 사용해야합니다.
2. 마침표(`.`)는 [line terminator characters](https://tc39.es/ecma262/#prod-LineTerminator) 와 매칭되지 않습니다.

*ECMAScript*에서는 아래의 문자를 line terminator characters로 정의하고 있습니다.
- U+000A LINE FEED (LF) (`\n`)
- U+000D CARRIAGE RETURN (CR) (`\r`)
- U+2028 LINE SEPARATOR
- U+2029 PARAGRAPH SEPARATOR

그러나 사용자 정의에 따라 더 많은 문자들이 `line terminator characters`으로 정의될 수 있습니다. 아래는 그 예시입니다.
- U+000B VERTICAL TAB (`\v`)
- U+000C FORM FEED (`\f`)
- U+0085 NEXT LINE

두가지 예외사항로 인해 마침표(`.`)는 정규식에 있어서 문제를 발생시키게 됩니다.

1. 구현 상, `line terminator characters`을 모두 포함하지 않기 때문에 사용자에 따라 마침표(`.`)의 매칭 여부가 달라질 수 있습니다.
2. 일반적으로 마침표(`.`)는 모든 단일 문자에 대하여 매칭된다는 의미로 사용되지만 실제로는 그렇지 않습니다.

이러한 문제를 해결하기 위해 제안된 `s`(dotAll) flag에 대해 설명하고자 합니다.

기존의 정규식에서는 `line terminator characters`를 포함한 모든 단일 문자를 대체하기 위해서 마침표(`.`)를 사용하지만 제대로 동작하지 않습니다.

```javascript
/foo.bar/.test('foo\nbar');
// → false
```

그래서 위의 코드 대신, `[\s\S]`나 `[^]`의 특수한 방식으로 구현해야했습니다.

```javascript
/foo[^]bar/.test('foo\nbar');
// → true
```

모든 단일 문자와의 매칭은 매우 흔하기 때문에 다른 언어들의 정규식 엔진은 마침표(`.`)를 `line terminator characters`를 포함한 모든 단일 문자와 매칭되도록 하는 모드를 제공합니다.

- 정규식 flag로 `DOTALL` 또는 `SINGLELINE`/`s`를 제공하는 엔진들
1. [JAVA](https://docs.oracle.com/javase/7/docs/api/java/util/regex/Pattern.html#DOTALL) 는 `Pattern.DOTALL`을 제공합니다.
2. [C#과 VB](https://learn.microsoft.com/en-us/dotnet/api/system.text.regularexpressions.regexoptions?redirectedfrom=MSDN&view=net-7.0) 는 `RegexOptions.Singleline`을 제공합니다.
3. Python은 `re.DOTALL`과 `re.S`를 모두 제공합니다.

- 내장 flag 표현식 `(?s)`을 제공하는 엔진들
1. [JAVA](https://docs.oracle.com/javase/7/docs/api/java/util/regex/Pattern.html#DOTALL)
2. [C#과 VB](https://learn.microsoft.com/en-us/dotnet/standard/base-types/regular-expression-options)

- 정규 표현식 flag `s`를 제공하는 엔진들
1. [Perl](https://perldoc.perl.org/perlre#*s*)
2. [PHP](https://secure.php.net/manual/en/reference.pcre.pattern.modifiers.php#s)

보편적으로, 이름을 `s`(`singleline`의 줄임)과 `dotAll`으로 사용하고 있습니다.

하나의 예외사항으로, Ruby는 [the `m` flag(`Regexp::MULTILINE`)](https://ruby-doc.org/core-2.3.3/Regexp.html#method-i-options) 를 통해 `dotAll` 모드를 제공합니다. 안타깝게도 JS에는 `m` flag가 존재하기 때문에 하위 호환성을 고려하여 이 이름은 사용하지 않았습니다.

## 제안된 해결책

---

*ECMAScript*의 정규식에 마침표(`.`)와 `line terminator characters`를 포함한 모든 단일 문자를 매칭하는 `s` flag를 새로 도입하고자 합니다.

```javascript
/foo.bar/s.test('foo\nbar');
// → true
```

<br>

## 상위 API에서의 활용

---

```javascript
const re = /foo.bar/s; // Or, `const re = new RegExp('foo.bar', 's');`.
re.test('foo\nbar');
// → true
re.dotAll
// → true
re.flags
// → 's'
```

<br>

### FAQ


#### 하위 호환성은 어떤가요?

새롭게 제안된 `s` flag는 기존과는 다른 로직을 필요로 하기 때문에 기존의 다른 정규식 패턴은 영향을 받지 않습니다.

<br>


#### `dotAll` 모드는 `multiline` 모드에 영향을 줄 수 있나요?

이 질문은 `s` flag가 `m`/`multiline`flag의 반대인 `singleline`모드를 의미하는 것으로 오해하기 때문에 발생하고 있지만 실제로는 그렇지 않습니다.
이 것은 단순히 보편적으로 사용하고 있는 네이밍 방식을 차용하였기 때문에 그렇습니다.
보편적으로 사용되는 이름과는 다른 flag의 이름을 사용하게되면 의미의 혼란을 줄 수 있고, `dotAll`이라는 이름이 조금 더 명확한 의미를 담고 있기 때문입니다.
이 때문에 이 모드를 `singleline` 모드 대신 `dotAll` 모드로 사용하도록 권장하고 있습니다.

`dotAll`와 `multiline` 두 모드는 독립적으로 동작하기 때문에 함께 사용이 가능합니다. 실제로 `multiline`은 오직 `anchors`에만, `dotAll`는 마침표(`.`)에만 영향을 줍니다.

만약 `dotAll`와 `multiline` 두 모드를 사용하게 되면, `^`와 `$`를 문자열 내의 `line terminator characters`의 처음과 끝으로 매칭함과 동시에 마침표(`.`)는 `line terminator characters`를 포함한 모든 단일 문자에 매칭됩니다.


## 명세



- [Ecmarkup source](https://github.com/tc39/proposal-regexp-dotall-flag/blob/main/spec.html)
- [HTML version](https://tc39.es/proposal-regexp-dotall-flag/)

<br>

## 구현


- [V8](https://bugs.chromium.org/p/v8/issues/detail?id=6172), shipping in Chrome 62
- [JavaScriptCore](https://bugs.webkit.org/show_bug.cgi?id=172634), shipping in [Safari Technology Preview 39a](https://developer.apple.com/safari/technology-preview/release-notes/)
- [XS](https://github.com/Moddable-OpenSource/moddable/blob/public/xs/sources/xsre.c), shipping in Moddable as of [the January 17, 2018 update](http://blog.moddable.tech/blog/january-17-2017-big-update-to-moddable-sdk/)
- [regexpu (transpiler)](https://github.com/mathiasbynens/regexpu) with the`{ dotAllFlag: true }`option enabled
    - [online demo](https://mothereff.in/regexpu#input=const+regex+%3D+/foo.bar/s%3B%0Aconsole.log%28%0A++regex.test%28%27foo%5Cnbar%27%29%0A%29%3B%0A//+%E2%86%92+true&dotAllFlag=1)
    - [Babel plugin](https://github.com/mathiasbynens/babel-plugin-transform-dotall-regex)
- [Compat-transpiler of RegExp Tree](https://github.com/dmitrysoshnikov/regexp-tree#using-compat-transpiler-api)
    - [Babel plugin](https://github.com/dmitrysoshnikov/babel-plugin-transform-modern-regexp)
    