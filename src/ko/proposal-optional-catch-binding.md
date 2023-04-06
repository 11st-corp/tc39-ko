# Optional catch binding

본 제안은 ECMA스크립트에 문법적인 변경을 가하여 바인딩을 사용하지 않을 경우 캐치 바인딩을 생략할 수 있도록 합니다. 이는 다음과 같은 패턴에서 자주 발생합니다.
```js
try {
  // 구현되지 않은 웹 기능을 사용하려고 시도합니다.
} catch (unused) {
  // 더 폭넓은 지원을 통해 덜 바람직한 웹 기능으로 대체합니다.
}
```
또는
```js
let isTheFeatureImplemented = false;
try {
// 웹 API의 필수 비트를 강조합니다.
  isTheFeatureImplemented = true;
} catch (unused) {}
```
또는
```js
let parseResult = someFallbackValue;
try {
  parseResult = JSON.parse(potentiallyMalformedJSON);
} catch (unused) {}
```
그리고 변수가 선언되거나 작성되었지만 결코 읽히지 않는 것은 프로그래밍 오류를 의미한다는 것이 일반적인 의견입니다.

본 제안에 의해 도입된 문법 변경으로 `catch` 바인딩과 주변 괄호를 생략할 수 있습니다.
```js
try {
  // ...
} catch {
  // ...
}
```
자세한 내용은 [제안서 전문](https://tc39.es/proposal-optional-catch-binding/)을 참조하십시오.