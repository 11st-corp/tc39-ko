# BigInt: JavaScript의 임의 정밀 정수
Daniel Ehrenberg, Igalia. 4단계

본 제안은 완료되었으며 이미 ECMA262 명세서에 합쳐졌습니다. [여기](https://tc39.es/ecma262/)에서 명세서 글을 참조하십시오.

Brendan Eich, Waldemar Horwat, Jaro Sevcik, Benedikt Meurer, Michael Saboff, Adam Klein, Sarah Groff-Palermo 등의 도움과 피드백에 감사드립니다.

## 목차 
1. **[무엇인가요?](##-1.-무엇인가요?)**
2. **[어떻게 작동할까요?](##어떻게-작동할까요?)**
   - [구문](###구문)
   - [연산자](###연산자)
   - [비교](###비교)
   - [조건](###조건)
   - [기타 API 참고 사항](###기타-API-참고-사항)
3. **[Gotchas & 예외](##Gotchas-&-예외)**
   - [`Number` 및 `String`과의 상호 작용](###`Number`-및-`String`과의-상호-작용)
   - [반올림](###반올림)
   - [암호학](###암호학)
   - [기타 예외](###기타-예외)
   - [사용 권장 사항](###사용-권장-사항)
4. **[제안에 대하여](##-제안에-대하여)**
   - [동기, 혹은 왜 우리는 그렇게 큰 숫자가 필요할까요?](###동기,-혹은-왜-우리는-그렇게-큰-숫자가-필요할까요?)
   - [디자인 철학, 혹은 왜 이런 것일까요?](###디자인-철학,-혹은-왜-이런-것일까요?)
   - [제안의 상태](###제안의-상태)


## 1. 무엇인가요?
`BigInt`는 2<sup>53</sup>보다 큰 정수를 나타내는 방법을 제공하는 새로운 원시값으로, JavaScript가 `Number` 원시 안정적으로 나타낼 수 있는 가장 큰 숫자입니다.
```js
const x = Number.MAX_SAFE_INTEGER;
// ↪ 9007199254740991, this is 1 less than 2^53

const y = x + 1;
// ↪ 9007199254740992, ok, checks out

const z = x + 2
// ↪ 9007199254740992, wait, that’s the same as above!
```
[JSConfEU에서 열린 Daniel의 강연에서 나온 슬라이드에서 숫자가 Javascript로 어떻게 표현되는지 자세히 알아보십시오.](https://docs.google.com/presentation/d/1apPbAiv_-mJF35P31IjaII8UA6TwSynCA_zhfDEmgOE/edit#slide=id.g38a1897a56_0_97)

## 어떻게 작동할까요?
다음 섹션에서는 `BigInt`의 작동을 보여 줍니다. [이 페이지보다 더 자세한 내용을 포함하는 Mathias Bynens의 BigInt v8 업데이트](https://v8.dev/features/bigint)에서 많은 수가 영향을 받았거나 직접 가져갔습니다.

### 구문
`BigInt`는 정수 끝에 `n`을 추가하거나 생성자를 호출하여 생성됩니다.
```js
const theBiggestInt = 9007199254740991n;

const alsoHuge = BigInt(9007199254740991);
// ↪ 9007199254740991n

const hugeButString = BigInt('9007199254740991');
// ↪ 9007199254740991n
```

예시: 소수 계산
```js
function isPrime(p) {
  for (let i = 2n; i * i <= p; i++) {
    if (p % i === 0n) return false;
  }
  return true;
}

// Takes a BigInt as an argument and returns a BigInt
function nthPrime(nth) {
  let maybePrime = 2n;
  let prime = 0n;
  
  while (nth >= 0n) {
    if (isPrime(maybePrime)) {
      nth -= 1n;
      prime = maybePrime;
    }
    maybePrime += 1n;
  }
  
  return prime;
}
```

### 연산자
`BigInt`에는 `Number`와 마찬가지로 `+`, `*`, `-`, `*` 및 `%`를 사용할 수 있습니다.
```js

const previousMaxSafe = BigInt(Number.MAX_SAFE_INTEGER);
// ↪ 9007199254740991

const maxPlusOne = previousMaxSafe + 1n;
// ↪ 9007199254740992n
 
const theFuture = previousMaxSafe + 2n;
// ↪ 9007199254740993n, this works now!

const multi = previousMaxSafe * 2n;
// ↪ 18014398509481982n

const subtr = multi – 10n;
// ↪ 18014398509481972n

const mod = multi % 10n;
// ↪ 2n

const bigN = 2n ** 54n;
// ↪ 18014398509481984n

bigN * -1n
// ↪ –18014398509481984n
```

또한 `/` 연산자는 정수를 사용하여 예상대로 작동합니다. 그러나 이들은 `BigInt`이며 `BigDecimal`이 아니기 때문에 이 연산은 0을 향해 반올림됩니다. 즉, 분수 숫자는 반환되지 않습니다.

```js

const expected = 4n / 2n;
// ↪ 2n

const rounded = 5n / 2n;
// ↪ 2n, not 2.5n

```

[비트 연산자와 함께 사용하려면 고급 설명서를 참조하십시오.](https://github.com/tc39/proposal-bigint/blob/master/ADVANCED.md)

### 비교
`BigInt`는 엄밀하게 `Number`와 같지는 않지만, 느슨하게는 같습니다.
```js
0n === 0
// ↪ false

0n == 0
// ↪ true
```
`Number` 와 `BigInt`는 일반적으로 비교할 수 있습니다.
```js
1n < 2
// ↪ true

2n > 1
// ↪ true

2 > 2
// ↪ false

2n > 2
// ↪ false

2n >= 2
// ↪ true
```
이들은 배열로 혼합되어 정렬될 수 있습니다.
```js

const mixed = [4n, 6, -12n, 10, 4, 0, 0n];
// ↪  [4n, 6, -12n, 10, 4, 0, 0n]

mixed.sort();
// ↪ [-12n, 0, 0n, 10, 4n, 4, 6]
```
### 조건 
`BigInt`는 `if`, `||`, `&&`, `Boolean`, `!`와 같은 `Boolean`로 변환되는 경우 `Number`처럼 동작합니다.
```js

if (0n) {
  console.log('Hello from the if!');
} else {
  console.log('Hello from the else!');
}

// ↪ "Hello from the else!"

0n || 12n
// ↪ 12n

0n && 12n
// ↪ 0n

Boolean(0n)
// ↪ false

Boolean(12n)
// ↪ true

!12n
// ↪ false

!0n
// ↪ true

```

## 기타 API 참고 사항
`BigInt64Array`와 64비트를 위한 [TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) `BigUint64Array`에서도 `BigInt`를 사용될 수 있습니다.
```js
const view = new BigInt64Array(4);
// ↪ [0n, 0n, 0n, 0n]
view.length;
// ↪ 4
view[0];
// ↪ 0n
view[0] = 42n;
view[0];
// ↪ 42n

// Highest possible BigInt value that can be represented as a
// signed 64-bit integer.
const max = 2n ** (64n - 1n) - 1n;
view[0] = max;
view[0];
// ↪ 9_223_372_036_854_775_807n
view[0] = max + 1n;
view[0];
// ↪ -9_223_372_036_854_775_808n
//   ^ negative because of overflow
```
[`BigInt` 라이브러리 기능에 대한 자세한 내용은 고급 섹션을 참조하십시오.](https://github.com/tc39/proposal-bigint/blob/master/ADVANCED.md)

## Gotchas & 예외

### `Number` 및 `String`과의 상호 작용
가장 놀라운 것은 `BigInt`가 `Number`와 호환되지 않는다는 것입니다. 대신 `TypeError`(유형 오류)가 발생합니다. ([이 결정이 내려진 이유에 대한 자세한 내용은 설계 철학을 참조하십시오.](https://github.com/tc39/proposal-bigint#design-goals-or-why-is-this-like-this))
```js

1n + 2
// ↪ TypeError: Cannot mix BigInt and other types, use explicit conversions

1n * 2
// ↪ TypeError: Cannot mix BigInt and other types, use explicit conversions

```

또한 `BigInt`는 단항 `+`를 사용하여 `Number`로 변환할 수 없습니다. `Number`를 사용해야 합니다.
```js
+1n
// ↪ TypeError: Cannot convert a BigInt value to a number

Number(1n)
// ↪ 1

```
그러나 `BigInt`는 `String`과 연결될 수 있습니다.
```js

1n + '2'
// ↪ "12"

'2' + 1n
// ↪ "21"

```

이러한 이유로 2<sup>53</sup> 미만의 값만 발생하는 코드에 대해 `Number`를 계속 사용하는 것이 좋습니다.

큰 값이 예상되는 경우를 위해 `BigInt`를 예약합니다. 그렇지 않으면 앞뒤로 변환하여 보존하고자 하는 정밀도를 잃을 수 있습니다.
```js
const largeFriend = 900719925474099267n;
const alsoLarge = largeFriend + 2n;

const sendMeTheBiggest = (n, m) => Math.max(Number(n), Number(m));

sendMeTheBiggest(largeFriend, alsoLarge)
// ↪900719925474099300  // This is neither argument!
```

2<sup>53</sup>까지의 정수인 경우에는 숫자 예약 값을 사용합니다. 다른 경우에는 문자열(또는 `BigInt` 리터럴)을 사용하는 것이 정확도를 잃지 않는 것이 좋습니다.
```js
const badPrecision = BigInt(9007199254740993);
// ↪9007199254740992n

const goodPrecision = BigInt('9007199254740993');
// ↪9007199254740993n

const alsoGoodPrecision = 9007199254740993n;
// ↪9007199254740993n
```
### 반올림 
위에서 언급한 바와 같이, `BigInt`는 정수만 나타냅니다. `Number`는 2<sup>53</sup>까지의 정수만 신뢰할 수 있게 나타냅니다. 즉, `Number`를 나누고, 변환하면 반올림이 발생할 수 있습니다.

```js

5n / 2n
// ↪ 2n

Number(151851850485185185047n)
// ↪ 151851850485185200000

```
### 암호학
`BigInt`에서 지원되는 작업은 일정한 시간이 아닙니다. 따라서 `BigInt`는 [암호화에 사용하기에 적합하지 않습니다.](https://www.chosenplaintext.ca/articles/beginners-guide-constant-time-cryptography.html)

많은 플랫폼에서 [웹 암호화](https://w3c.github.io/webcrypto/) 또는 [노드 암호화](https://nodejs.org/dist/latest/docs/api/crypto.html)와 같은 암호화를 기본적으로 지원합니다.

### 기타 예외
분수 값을 `BigInt`로 변환하려고 하면 값이 `Number`와 `String`로 표시되는 경우 모두 예외가 발생합니다.
```js
BigInt(1.5)
// ↪ RangeError: The number 1.5 is not a safe integer and thus cannot be converted to a BigInt

BigInt('1.5')
// ↪ SyntaxError: Cannot convert 1.5 to a BigInt
```
`Math` 라이브러리의 작동에서 `|` `BigInt`와 함께 사용할 때 오류가 발생합니다.

```js
Math.round(1n)
// ↪ TypeError: Cannot convert a BigInt value to a number

Math.max(1n, 10n)
// ↪ TypeError: Cannot convert a BigInt value to a number

1n|0
// ↪ TypeError: Cannot mix BigInt and other types, use explicit conversions
```
그러나 `parseInt` 및 `parseFloat`은 `BigInt`를 `Number`로 변환하고 그 과정에서 정밀도를 잃게 됩니다. (이 함수는 `n`을 포함하여 뒤에 있는 숫자가 아닌 값을 무시하기 때문입니다.)
```js
parseFloat(1234n)
// ↪1234

parseInt(10n)
// ↪10

// precision lost!
parseInt(900719925474099267n)
// ↪900719925474099300
```
마지막으로, `BigInt`는 JSON에 직렬화될 수 없습니다. 그러나 이를 처리할 수 있는 라이브러리(예: [granola](https://github.com/kanongil/granola))가 있습니다.
```js
const bigObj = {a: BigInt(10n)};
JSON.stringify(bigObj)
// ↪TypeError: Do not know how to serialize a BigInt
```
### 사용 권장 사항
#### 강제성
`Number`와 BigInt 사이에서 강제로 실행하면 정밀도가 떨어질 수 있으므로 2<sup>53</sup>보다 큰 값이 합리적으로 예상되는 경우에만 BigInt를 사용하고 두 유형 사이에서 강제로 실행하지 않는 것이 좋습니다.

## 제안에 대하여
### 동기, 혹은 왜 우리는 그렇게 큰 숫자가 필요할까요?
JavaScript 코딩에는 2<sup>53</sup>보다 큰 정수가 나타나는 경우가 많습니다. 부호가 있거나 부호가 없는 64비트 정수가 필요한 경우와 64비트보다 큰 정수가 필요한 경우 모두 해당됩니다.

#### 64비트 사용 사례
종종 JavaScript 상호 작용하는 다른 시스템은 데이터를 64비트 정수로 제공하므로 JavaScript 숫자들에 강제될 때 정확도가 떨어집니다.

이러한 기능은 특정 기계 레지스터나 유선 프로토콜을 읽거나 64비트 시스템에서 생성한 GUID가 포함된 프로토버프 또는 JSON 문서를 사용할 때 발생할 수 있으며, 여기에는 신용 카드 또는 계좌 번호와 같은 것이 포함되어 있으며 현재 JavaScript에 문자열로 남아 있어야 합니다. 그러나 `BigInt`는 JSON에 직접 직렬화할 수 없습니다. 그러나 [Granola](https://github.com/kanongil/granola)와 같은 라이브러리를 사용하여 `BigInt` 및 기타 JS 데이터 유형을 JSON으로 직렬화하고 역직렬화할 수 있습니다.)

노드에서 `fs.stat`는 일부 데이터를 64비트 정수로 제공할 수 있으며, 이로 인해 [이미 다음과 같은 문제가 발생했습니다](https://github.com/nodejs/node/issues/12115):
```js
fs.lstatSync('one.gif').ino
// ↪ 9851624185071828

fs.lstatSync('two.gif').ino
// ↪ 9851624185071828, duplicate, but different file!
```
마지막으로, 64비트 정수를 사용하면 나노초 단위로 더 높은 해상도를 구현할 수 있습니다! — 타임스탬프. 이것들은 현재 1단계에 있는 [임시 제안](https://github.com/tc39/proposal-temporal)에 사용될 것입니다.

#### 64비트 사용 사례보다 큼
64비트 값보다 큰 정수는 프로젝트 오일러 문제를 해결하거나 정확한 기하학적 계산과 같이 더 큰 정수로 수학적 계산을 수행할 때 발생할 가능성이 가장 높습니다. `BigInt`를 추가하면 정수 산술이 "정확"하고 갑자기 오버플로우되지 않을 것이라는 높은 수준의 언어에 대한 합리적인 사용자 기대를 충족할 수 있습니다.

이것이 억지스러운 것 같으면 [Pentium FDIV 버그](https://en.wikipedia.org/wiki/Pentium_FDIV_bug)의 경우를 생각해 보십시오. 1994년 펜티엄 칩의 버그로 부동 소수점 값이 거의 정확하지 않게 되었습니다. 그 정밀도에 의존하던 수학 교수에 의해 발견되었습니다.

### 디자인 철학, 혹은 왜 이런 것일까요?
이 원칙들은 이 제안을 통해 내린 결정을 이끌었습니다. 각 항목에 대한 자세한 내용은 `ADVANCED.md` 을 참조하십시오.

#### 사용자 직관력 유지와 정확성 유지 사이의 균형 찾기
일반적으로 이 제안은 JavaScript가 작동하는 방식에 대한 사용자 직관을 보완하는 방식으로 작동하는 것을 목표로 합니다. 동시에, 이 제안의 목표는 언어의 정확성을 위한 추가적인 지원을 추가하는 것입니다. 때때로 이것들은 충돌할 수 있습니다.

혼란스러운 상황이 발생할 때, 이 제안은 유형 강요에 의존하고 부정확한 답변을 하는 위험을 감수하기보다는 예외를 던지는 쪽에 오류가 있습니다. 위에서 설명한 `BigInt` 및 `Number` 및 기타 예외를 추가할 때 유형 오류가 발생하는 배경은 다음과 같습니다: 만약 우리가 좋은 답이 없다면, 하나도 주지 않는 것이 좋습니다.

이러한 선택에 대한 자세한 내용은 [Axel Rauschmeyer의 제안](https://gist.github.com/rauschma/13d48d1c49615ce2396ce7c9e45d4cd1) 및 [숫자에 대한 영향에 대한 추가 논의](https://github.com/tc39/proposal-bigint/issues/36)를 참조하십시오. 우리는 결국 `Number`와 `BigInt` 간에 투명한 상호 운용성을 제공하는 것은 비현실적이라는 결론을 내렸습니다.

#### 수학을 어기지 마십시오.
모든 연산자의 의미론은 개발자의 기대에 부합하도록, 수학적인 첫 번째 원칙에 이상적으로 기초해야 합니다. 나눗셈 연산자와 모듈로 연산자는 정수에 대한 다른 프로그래밍 언어의 규약을 기반으로 합니다.

#### JavaScript 구조를 파괴하지 마십시오.
이 제안서에는 `BigInt`를 사용하기에 너무 복잡하게 만들지 않기 위해 연산자 오버로딩이 내장되어 있습니다. 정적 방법으로 `BigInt`를 작동할 경우 한 가지 특별한 위험은 사용자가 `BigInt`를 숫자로 변환하여 `+` 연산자를 사용할 수 있다는 것입니다. 이는 대부분의 경우 충분히 큰 값으로는 작동하지 않으므로 테스트를 통과할 수 있습니다. 연산자 오버로드를 포함함으로써 `BigInt`를 `Numbers`로 변환하는 것보다 `BigInt`를 제대로 추가하는 것이 훨씬 더 짧은 코드가 될 것이며, 이는 이 버그의 발생 가능성을 최소화합니다.

#### 웹을 깨지 마십시오.
이 제안은 숫자가 작동하는 방식에 대해 아무것도 바꾸지 않습니다. `BigInt`라는 이름은 부분적으로 더 일반적인 `Integer` 이름이 가져오는 호환성 위험을 피하기 위해 선택되었습니다(그리고 부분적으로는 "큰" 경우에 유용하다는 것을 분명히 하기 위해).

#### 좋은 성과를 깨지 마십시오.
여기서 설계 작업은 프로토타이핑과 함께 제안서를 효율적으로 구현할 수 있도록 수행되었습니다.

#### 잠재적인 미래 가치 유형 확장을 깨지 마십시오.
언어에 새로운 원시 요소를 추가할 때 일반화하기 매우 어려운 초능력을 주는 것을 피하는 것이 중요합니다. 이것은 `BigInt`가 혼합 피연산자를 피하는 또 다른 좋은 이유입니다.

그러나 혼합 비교는 직관 설계 원칙을 지지하기 위해 이 원칙에 대한 일회성 예외입니다.

#### 일관된 JavaScript 모델을 중단하지 않습니다.
이 제안은 `Symbol`과 유사한 래퍼가 있는 새로운 기본 유형을 추가합니다. BigInts를 JavaScript 사양에 통합하는 과정에서 사양에 포함된 세 가지 유형을 구분하려면 수학적 가치, `BigInt`와 `숫자`와 같은 엄격한 기준이 필요합니다.

### 제안의 상태
이 제안은 현재 [4단계](https://tc39.es/process-document/)에 있습니다.

`BigInt`는 Chrome, Node, Firefox로 출고되었으며 Safari에서 진행 중입니다.

- [V8](https://bugs.chromium.org/p/v8/issues/detail?id=6791) by Georg Neis and Jakob Kummerow.
- [JSC](https://bugs.webkit.org/show_bug.cgi?id=179001) by Caio Lima and Robin Morisset.
- [SpiderMonkey](https://bugzilla.mozilla.org/show_bug.cgi?id=1366287) by Robin Templeton and Andy Wingo.

관련된 명세서 제안들은 다음과 같습니다.
- [BigInt WebAssembly JS API 통합 제안서](https://github.com/WebAssembly/spec/pull/707)
- [BigInt의 HTML 직렬화](https://github.com/whatwg/html/pull/3480)
- [인덱스로서의 BigIntDB키](https://github.com/w3c/IndexedDB/pull/231)