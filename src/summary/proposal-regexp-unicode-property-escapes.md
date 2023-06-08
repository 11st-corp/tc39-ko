# ECMAScript 제안서: 정규 표현식의 유니코드 속성 이스케이프

## 요약

제안서 이전에 ECMAScript 정규 표현식에서 기본적으로 유니코드 문자 속성에 접근할 수 있는 방법이 없는 이유는 표준 정규식 구문이 유니코드 속성에 대한 지원을 포함하지 않기 때문입니다.

`\p{…}` 및 `\P{…}` 구문을 사용하여 정규 표현식에서 일치하는 유니코드 속성 이스케이프를 위한 새로운 구문을 도입합니다. 

또한 ASCII 문자 일치를 위한 `\p{ASCII}`, 이모티콘 문자 일치를 위한 `\p{Emoji}`, 그리스어 스크립트의 모든 문자 일치를 위한 `\p{Script=Greek}`와 같은 새로운 메타 문자 시퀀스를 도입합니다.

이 기능을 사용하면 정규식에서 유니코드 문자를 보다 정확하고 유연하게 일치시킬 수 있으므로 개발자가 보다 강력하고 효율적인 코드를 쉽게 작성할 수 있습니다.

## 예시

[`PropertyAliases.txt`](http://unicode.org/Public/UNIDATA/PropertyAliases.txt) 및 [`PropertyValueAliases.txt`](http://unicode.org/Public/UNIDATA/PropertyValueAliases.txt)에서 세부 종류를 확인할 수 있습니다. ([UTS18](http://unicode.org/reports/tr18))

### Emoji

```js
const regex = /\p{Emoji}/u;
regex.test('👋'); // true
regex.test('a'); // false
```

### Currency_Symbol

```js
const regex = /\p{Currency_Symbol}/u;
regex.test('$'); // true
regex.test('€'); // true
regex.test('¥'); // true
regex.test('£'); // true
regex.test('₹'); // true
regex.test('a'); // false
```

### Script

#### Greek

```js
const regex = /\p{Script=Greek}/u;
regex.test('Α'); // true
regex.test('Ω'); // true
regex.test('α'); // true
regex.test('ω'); // true
regex.test('a'); // false
```

#### Arabic

```js
const regex = /\p{Script=Arabic}/u;
console.log(regex.test('مرحبا بالعالم')); // true
```

#### Han

```js
const regex = /\p{Script=Han}/u;

console.log(regex.test('你好')); // true
console.log(regex.test('こんにちは')); // false
console.log(regex.test('안녕하세요')); // false
```

#### Hangul

```js
const regex = /\p{Script=Hangul}/u;
console.log(regex.test('한글')); // true
console.log(regex.test('abc')); // false
```

### Punctuation Symbol

```js
const regex = /\p{Punctuation}/u;
regex.test('.'); // true
regex.test(','); // true
regex.test('?'); // true
regex.test('!'); // true
regex.test('a'); // false
```

### ShortHand

#### General_Category

```js
const regex = /\p{General_Category=Letter}/u;

console.log(regex.test('안녕하세요')); // true
console.log(regex.test('السلام عليكم')); // true
console.log(regex.test('Hello')); // true
console.log(regex.test('123')); // false
console.log(regex.test('#$%')); // false

const regexLetter = /\p{Letter}/u;

console.log(regexLetter.test('안녕하세요')); // true
console.log(regexLetter.test('السلام عليكم')); // true
console.log(regexLetter.test('Hello')); // true
console.log(regexLetter.test('123')); // false
console.log(regexLetter.test('#$%')); // false
```

## `\P{...}` vs `\p{...}`

`\P{...}`는 `\p{...}`의 부정 형식입니다.

```js
const regex = /\P{Letter}/u;

console.log(regex.test('123')); // true
console.log(regex.test('abc')); // false
console.log(regex.test('αβγ')); // false
```

```js
const regex = /\p{Digit}/u;

console.log(regex.test('123')); // true
console.log(regex.test('abc')); // false
console.log(regex.test('αβγ')); // false
```
