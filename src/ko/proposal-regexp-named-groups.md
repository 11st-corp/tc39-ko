# RegExp Named Capture Groups 번역

4 단계

제안한 사람: Daniel Ehrenberg (Igalia) & Mathias Bynens (Google)

## 서론

번호지정 캡처 그룹을 사용하면 정규표현식과 일치하는 문자열의 특정 부분을 참조할 수 있습니다. 각 캡처 그룹에는 고유한 번호가 할당되어 있으며 이 번호를 사용하여 참조될 수 있지만, 정규표현식을 파악하거나 리팩터링하기 어려울 수 있습니다.

예를 들어 날짜와 일치하는 `/(\d{4})-(\d{2})-(\d{2})/` 가 주어지면 주변 코드를 살펴보지 않고서는 어떤 그룹이 월에 해당하고 어떤 그룹이 일에 해당하는지 확신할 수 없습니다. 게다가 월과 일의 순서를 바꾸려면 그룹 참조 또한 갱신되어야 합니다.

명명된 캡처 그룹은 이러한 이슈들에 대한 훌륭한 해결책을 제공합니다. 

## 고급 API

캡처 그룹에는 모든 식별자 `이름`에 대해 `(?<name>…)` 구문을 사용하여 이름을 지정할 수 있습니다. 날짜에 대한 정규표현식은 `/(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/u` 과 같이 쓰여질 수 있습니다. 각각의 이름은 고유해야 하고 ECMAScript 식별자 이름 문법<sup>[1][]</sup>을 따라야 합니다.

명명된 그룹은 정규 표현식 결과의 그룹 속성에서 접근할 수 있습니다. 명명되지 않은 그룹과 마찬가지로 그룹에 대한 번호지정 참조도 생성됩니다. 예를 들어:

```js
let re = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/u; // '/u' : 유니코드 문자에 일치
let result = re.exec('2015-01-02'); //match 메서드와 유사하지만 첫 번째 매칭 결과만 반환
// result.groups.year === '2015';
// result.groups.month === '01';
// result.groups.day === '02';

// result[0] === '2015-01-02';
// result[1] === '2015';
// result[2] === '01';
// result[3] === '02';
```

인터페이스는 다음 예제와 같이 구조 분해와 잘 상호 작용합니다.

```js
let {groups: {one, two}} = /^(?<one>.*):(?<two>.*)$/u.exec('foo:bar'); //여기서 '.'은 모든 문자열을 뜻함 '*'는 없거나 있거나
console.log(`one: ${one}, two: ${two}`);  // prints one: foo, two: bar
```

### 역참조

명명된 그룹은 `\k<name>` 구조를 통해 정규표현식 내에서 접근할 수 있습니다. 예를 들어:

```js
let duplicate = /^(?<half>.*).\k<half>$/u; // '아무문자A''아무문자B''아무문자A'형태
duplicate.test('a*b'); // false
duplicate.test('a*a'); // true
```

명명된 참조는 번호지정 참조와 동시에 사용될 수도 있습니다.

```js
let triplicate = /^(?<part>.*).\k<part>.\1$/u; 
triplicate.test('a*a*a'); // true
triplicate.test('a*a*b'); // false
```

### 타겟 교체

명명된 그룹은 `String.prototype.replace`에 전달된 대체 값에서도 참조할 수 있습니다. 만약 값이 문자열이라면 `$<name>` 구문을 사용하여 명명된 그룹에 접근할 수 있습니다. 예를 들어: 

```js
let re = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/u;
let result = '2015-01-02'.replace(re,'$<day>/$<month>/$<year>');
// result === '02/01/2015'
```

템플릿 리터럴이 아닌 일반 문자열 리터럴이 `replace`로 전달되었다는 것에 주의하세요. 이 메서드는 `day` 등의 값을 지역 변수로 두지 않고 해결하기 때문입니다. 다른 대안으로는 `${day}` 구문을 사용하는 것이 있습니다(템플릿 문자열은 아님). 이 제안은 `$<day>`를 사용하여 그룹의 정의와 유사하게 그리고 템플릿 리터럴과는 구분되게 했습니다.

`String.prototype.replace`의 두 번째 인수가 함수인 경우 명명된 그룹은 `groups`라고 불리는 새 매개변수를 통해 접근할 수 있습니다. 새 구문은 `function (matched, capture1, …, captureN, position, S, groups)`가 될 수 있습니다. 명명된 캡처는 일반적으로 번호지정과 계속 함께합니다. 예를 들어:

```js
let re = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/u;
let result = '2015-01-02'.replace(re, (...args) => {
 let {day, month, year} = args[args.length - 1];
 return `${day}/${month}/${year}`;
});
// result === '02/01/2015'
/**
args = 
[
  '2015-01-02',
  '2015',
  '01',
  '02',
  0,
  '2015-01-02',
  [Object: null prototype] { year: '2015', month: '01', day: '02' }
*/
```

## 세부 사항

### 중첩되는 그룹 이름

정규표현식 반환 객체는 이미 숫자가 아닌 속성들을 가지고 있으며 명명된 캡처 그룹은 `length`, `index` 및 `input`과 중복될 수 있습니다. 본 제안서에서는 중복된 이름에 관한 모호함과 엣지 케이스들을 피하기 위해 명명된 그룹 속성들을 match 객체의 속성인 별도의 `groups` 객체에 배치합니다. 이 솔루션은 향후 ECMAScript 버전에서 웹 호환성 위험 없이 `exec`결과에 추가 속성을 배치할 수 있게 해줍니다.

그룹 객체는 명명된 그룹이 있는 정규표현식에 대해서만 생성됩니다. 번호지정 그룹 속성에는 포함되지 않고 명명된 그룹의 속성에만 포함됩니다. 정규표현식에 언급된 모든 그룹에 대한 `groups` 객체에 속성이 생성됩니다. match에서 속성이 발견되지 않으면 값은 `undefined`가 됩니다.

### 새 구문의 역호환성

새롭게 명명된 그룹을 생성하기 위한 구문은, `/(?<name>)/` ,현재 ECMAScript 정규표현식에서 구문 오류이므로 모호함 없이 모든 정규표현식에 추가할 수 있습니다. 그러나 명명된 역참조 구문은, `/\k<foo>/`, 현재 비유니코드 정규표현식에서 허용되며 리터럴 문자열 `k<foo>`와 일치합니다. 유니코드 정규표현식에서는 이러한 이스케이프가 금지됩니다.

본 제안서에서, 정규표현식에 명명된 그룹이 포함되지 않는 한 비 유니코드 정규표현식 `\k<foo>`는 리터럴 문자열 “k<foo>”와 계속 일치합니다. 이 경우 정규표현식에 `foo`라는 명명된 그룹이 있는지 없는지에 따라 해당 그룹과 일치하거나 구문 오류가 됩니다. 현재 유효한 정규표현식에는 정규표현식 그룹이 있을 수 없으므로 기존의 코드에 영향은 없습니다. 정규표현식에 `\k`가 포함된 코드의 경우에만 리팩터링 위험이 있습니다.

## 다른 프로그래밍 언어의 선례

본 제안서는 다른 많은 프로그래밍 언어가 명명된 캡처 그룹에 대해 수행한 것과 유사합니다. Python 구문이 비 유니코드 역참조 문제를 해결하는 흥미롭고 설득력 있는 아웃라이어이지만 합의 구문이 앞으로 나아가고 있는것 처럼 보입니다.

### Perl [참조](http://perldoc.perl.org/perlre.html#Regular-Expressions)

Perl에서 명명된 캡처 그룹은 `/(?<name>)/` 이고 역참조는 `/\k<name>/` 입니다. 본 제안서와 동일합니다.

### Python [참조](https://docs.python.org/2/library/re.html#regular-expression-syntax)

명명된 캡처는 `"(?P<name>)”` 이고 역참조는 `(?P=name)` 입니다.

### Java 참조

JDK7+는 명명된 그룹 캡처를 Perl과 본 제안서와 동일하게 지원합니다.

### .NET [참조](https://learn.microsoft.com/en-us/dotnet/standard/base-types/grouping-constructs-in-regular-expressions?redirectedfrom=MSDN#Anchor_1)

C#과 VB.NET은 명명된 캡처 그룹을 `"(?<name>)”` 이나 `"(?'name')”` 으로 사용하고 역참조는 `"\k<name>”` 구문으로 사용합니다.

### PHP

[스택오버플로우 포스트](https://stackoverflow.com/questions/6971287/named-capture-in-php-using-regex)와 [php.net 문서 코멘트](http://php.net/manual/en/function.preg-match.php#89418)에 따르면, PHP는 오랫동안 명명된 그룹을 `"(?P<foo>)”` 구문으로 지원해왔습니다. match 결과 객체에서 속성으로 사용가능합니다.

### Ruby [참조](https://ruby-doc.org/core-2.2.0/Regexp.html#class-Regexp-label-Capturing)

Ruby의 구문은 .NET과 같은데, 명명된 캡처 그룹을 `"(?<name>)”` 이나 `"(?'name')”` 으로 사용하고 역참조는 `"\k<name>”` 구문으로 사용합니다.

## 명세서 초안

[명세서 초안](https://tc39.es/proposal-regexp-named-groups/)

## 구현

- [V8](https://bugs.chromium.org/p/v8/issues/detail?id=5437), shipping in Chrome 64
- [XS](https://github.com/Moddable-OpenSource/moddable/blob/public/xs/sources/xsre.c), in [January 17, 2018 update](http://blog.moddable.tech/blog/january-17-2017-big-update-to-moddable-sdk/)
- [Transpiler (Babel plugin)](https://github.com/DmitrySoshnikov/babel-plugin-transform-modern-regexp#named-capturing-groups)
- [Safari](https://developer.apple.com/safari/technology-preview/release-notes/) beginning in Safari Technology Preview 40

[1]: #1
---

#### 1

ECMAScript 식별자이름 문법 : [https://262.ecma-international.org/5.1/#sec-7.6](https://262.ecma-international.org/5.1/#sec-7.6)
