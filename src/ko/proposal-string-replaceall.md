# `String.prototype.replaceAll` 제안서

## 상태

제안한 사람: Mathias Bynens (Google, @mathiasbynens).

이 제안서는 [the TC39 과정](https://tc39.es/process-document/) 중 4단계에 있으며, ES2021에 포함될 예정입니다.

## 제안 동기

([우리의 TL;DR 설명자](https://v8.dev/features/string-replaceall) 또한 확인하세요.)

현재 전역 정규식을 사용하지 않고 문자열에서 부분 문자열의 모든 인스턴스를 대체하는 방법은 없습니다.
`String.prototype.replace`는 문자열 인자와 함께 사용될 때 오직 첫 번째 항목에만 영향을 줍니다. 개발자들이 JS 내에서 이러한 작업을 하려고 한다는 많은 증거가 있습니다. - [StackOverflow 질문](https://stackoverflow.com/q/1144783/96656) 의 수천개의 투표를 보세요.

현재 이 작업을 구현하기 위한 대부분의 방식은 전역 정규식을 사용하는 것입니다.

```js
const queryString = 'q=query+string+parameters';
const withSpaces = queryString.replace(/\+/g, ' ');
```

이 접근은 특수 정규식 문자를 이스케이프해야 하는 단점이 있습니다. - `'+'`가 이스케이프 된 것을 보세요.

대체안은 `String#split`과 `Array#join`을 결합하는 것입니다.

```js
const queryString = 'q=query+string+parameters';
const withSpaces = queryString.split('+').join(' ');
```

이 접근은 이스케이핑을 피할 수 있으나 문자열을 부분들의 배열로 나누고, 이 것을 다시 하나로 붙여야하는 오버헤드가 존재합니다.

## 제안된 해결방식

우리는 String 프로토타입에 새로운 메서드의 추가를 제안합니다. - `replaceAll`. 이 것은 개발자에게 일반적이고 기본적인 연산을 수행할 수 있는 간단한 방법을 제공할 것입니다.

```js
const queryString = 'q=query+string+parameters';
const withSpaces = queryString.replaceAll('+', ' ');
```

이 것은 또한 특수 정규식 문자를 이스케이핑 해야할 필요가 없습니다. (이스케이프 되지 않은 `'+'`을 확인하세요.)

## 고차원 API

제안된 시그니처는 현재 존재하는 `String.prototype.replace`와 동일합니다.

```js
String.prototype.replaceAll(searchValue, replaceValue)
```

현재 TC39 합의에 따르면, `String.prototype.replaceAll`은 아래의 두 가지 경우만을 제외한 모든 경우에 `String.prototype.replace`와 동일하게 동작합니다. 

1. `searchValue`가 문자열일 경우, `String.prototype.replace`는 `searchValue`의 하나의 존재만을 대체하나, `String.prototype.replaceAll`는 (`.split(searchValue).join(replaceValue)`나 전역 & 적절히 이스케이프된 정규식의 사용과 같이)`searchValue`의 모든 존재를 대체합니다.
2. `searchValue` 비전역 정규식일 경우, `String.prototype.replace`는 단일 일치를 대체하나, `String.prototype.replaceAll`는 예외를 발생시킵니다. 이것은 ("모두 대체하지 마세요"라는 의미를 담고 있는) 전역 플래그의 결여와 ("모두 대체 하세요"라고 강력하게 제안하는) 호출되는 메서드의 이름 간의 내재된 혼란을 피하기 위함입니다.

특히, `searchValue`가 전역 정규식일 경우, `String.prototype.replaceAll`는 `String.prototype.replace`와 동일하게 동작합니다. 


## 다른 언어들과의 비교

* Java는 `CharSequence`를 받아 모든 존재를 대체하는 [`replace`](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html#replace-java.lang.CharSequence-java.lang.CharSequence-) 를 가지고 있습니다. 또한 Java는 정규식을 (사용자가 특수 정규 문자를 사용하도록 요구된) 탐색 도구로 받아 기본적으로 모든 존재를 대체하는 [`replaceAll`](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html#replaceAll-java.lang.String-java.lang.String-) 를 가지고 있습니다.
* Python는 모든 존재를 대체하나, 대체할 수의 제한을 선택적 매개변수로 받는 [`replace`](https://www.tutorialspoint.com/python/string_replace.htm) 를 가지고 있습니다.
* PHP는 파이선과 동일하게 선택적 제한 매개변수를 가진 [`str_replace`](http://php.net/manual/en/function.str-replace.php) 를 가지고 있습니다.
* Ruby는 정규식이나 문자열 뿐 만 아니라 콜백 블록이나 일치 -> 대체 쌍의 해시를 받는 [`gsub`](https://ruby-doc.org/core/String.html#method-i-gsub) 를 가지고 있습니다.

## 자주 묻는 질문들

### 주요 이점은 무엇인가요?

공통적인 경우를 위한 단순화된 API는 정규식에 대한 지식을 요구하지 않습니다. 정규식 구문 문자를 이스케이프하지 않고 문자열을 전역으로 바꾸는 방법입니다. VM 측의 최적화 가능성이 개선될 수 있습니다.

### 대신 `replace`에 `limit` 파라미터를 추가하는 것은 어떤가요? 

A: 이 것은 어색한 인터페이스 입니다. - 기본 제한은 1이기 때문에 사용자는 많은 존재가 있음을 알아야만 하거나, Infinity와 같은 것을 사용해야합니다. 

### `searchValue`이 빈 문자열이면 어떤 일이 발생하나요?

`String.prototype.replaceAll`는 `String.prototype.replace`의 선례를 따릅니다. 모든 UCS-2/UTF-16 코드 단위 사이에 대체 값이 분할된 입력 문자열을 반환합니다.

```js
'x'.replace('', '_');
// → '_x'
'xxx'.replace(/(?:)/g, '_');
// → '_x_x_x_'
'xxx'.replaceAll('', '_');
// → '_x_x_x_'
```

## TC39 회의 기록

- [11월 2017](https://tc39.es/tc39-notes/2017-11_nov-28.html#10ih-stringprototypereplaceall-for-stage-1)
- [3월 2019](https://github.com/tc39/tc39-notes/blob/master/meetings/2019-03/mar-26.md#stringprototypereplaceall-for-stage-2)
- [7월 2019](https://github.com/tc39/tc39-notes/blob/master/meetings/2019-07/july-24.md#stringprototypereplaceall)
- [6월 2020](https://github.com/tc39/notes/blob/master/meetings/2020-06/june-2.md#stringprototypereplaceall-for-stage-4)

## 명세서

- [Ecmarkup 소스](https://github.com/tc39/proposal-string-replaceall/blob/master/spec.html)
- [HTML 형식](https://tc39.es/proposal-string-replaceall/)

## 구현

- [SpiderMonkey](https://bugzilla.mozilla.org/show_bug.cgi?id=1540021), [Firefox 77](https://bugzilla.mozilla.org/show_bug.cgi?id=1608168) 에 사용됨.
- [JavaScriptCore](https://bugs.webkit.org/show_bug.cgi?id=202471), [Safari 13.1](https://webkit.org/blog/10247/new-webkit-features-in-safari-13-1/#javascript-improvements) 에 사용됨.
- [V8](https://bugs.chromium.org/p/v8/issues/detail?id=9801), Chrome 85에 사용됨.
- 폴리필:
    - [core-js](https://github.com/zloirock/core-js#stringreplaceall)
    - [es-shims](https://github.com/es-shims/String.prototype.replaceAll)