# 잘 구성된 유니코드 문자열

챔피언: Guy Bedford, Bradley Farias, Michael Ficarra
상태: 4단계

## 문제 설명

[ECMAScript 문자열 값](https://tc39.es/ecma262/multipage/overview.html#sec-terms-and-definitions-string-value)은 0개 이상의 16비트 부호 없는 정수 값의 유한 순서 시퀀스입니다. 그러나, ECMAScript는 16비트 부호 없는 정수여야 한다는 점을 제외하고는 정수 값에 대한 제한이나 요구 사항을 두지 않습니다. 올바른 형식의 문자열에서 시퀀스의 각 정수 값은 UTF-16으로 인코딩된 유니코드 텍스트의 단일 16비트 코드 단위를 나타냅니다. 그러나 UTF-16 코드 단위의 모든 시퀀스가 ​​UTF-16으로 인코딩된 유니코드 텍스트를 나타내는 것은 아닙니다. 올바른 형식의 문자열에서 `0xD800..0xDBFF`(선행 써로게이트) 및 `0xDC00..0xDFFF`(후행 써로게이트) 범위의 코드 단위는 쌍을 이루어 순서대로 나타나야 합니다. 짝을 이루지 않았거나 순서가 다른 써로게이트가 있는 문자열은 형식이 잘못되었습니다.

WebIDL에서 형식이 잘못된 문자열은 [DOMString](https://webidl.spec.whatwg.org/#idl-DOMString) 유형을 사용하여 참조됩니다. 그러나 유니코드 텍스트에서 작동하는 인터페이스의 경우 WebIDL은 [USVString](https://webidl.spec.whatwg.org/#idl-USVString) 유형을 유니코드 텍스트를 나타내는 대리 코드 포인트(`U+0000..U+D7FF` 및 `U+E000..U+10FFFF`)를 제외한 모든 유니코드 코드 포인트인 유니코드 스칼라 값의 모든 가능한 시퀀스 집합으로 정의합니다.

WebAssembly [컴포넌트 모델](https://github.com/WebAssembly/component-model)에는 일부 JS로 컴파일 프로그래밍 언어, 많은 데이터 인코딩, 네트워크 인터페이스, 파일 시스템 인터페이스 등과 마찬가지로 올바른 형식의 문자열이 필요합니다. JavaScript 문자열을 이러한 API와 인터페이스하는 것은 변환 부담을 겪는 일반적인 사용 사례입니다. 특히 `DOMString`에서 `USVString`으로의 변환은 손실이 많기 때문에(일반적인 옵션은 짝을 이루지 않은 서로게이트를 교체하거나 오류를 발생시키는 것임) 플랫폼 내에서 그리고 특정 사용자 영역 사용 사례 시나리오 모두에서 문자열 유효성 검사가 정기적으로 필요합니다.

## 제안

본 제안은 주어진 ECMAScript 문자열이 올바른 형식인지 여부를 확인하는 방법을 ECMA-262에 정의하는 것입니다. JavaScript/웹 API와 유니코드 텍스트에서 작동하는 API 간의 인터페이스에 대한 매우 일반적인 시나리오로서 이 테스트는 가능한 한 효율적이어야 하며 이상적으로는 문자열 길이와 독립적으로 확장되어야 합니다. 향상된 성능 외에도 이 방법은 이 테스트가 수행되는 코드 판독기, 특히 광범위한 유니코드 또는 정규식 지식이 없는 판독기의 명확성을 높입니다.

제안은 또한 U+FFFD(REPLACEMENT CHARACTER)로 단독 또는 비순차 서로게이트(존재하는 경우)를 대체하여 문자열이 올바른 형식인지 확인하는 방법을 추가합니다. 이 작업은 다양한 웹 및 비 ECMAScript API 내에서 이미 수행된 작업을 모방하고 이 메서드를 작성해야 하는 소비자가 호환되지 않거나 잘못된 방식으로 작업을 수행할 가능성을 줄입니다.

이러한 메서드는 `String.prototype.isWellFormed` 및 `String.prototype.toWellFormed`이며, 예를 들어 `if (!someString.isWellFormed()) { someString = someString.toWellFormed(); }`.

## 알고리즘

유효성 검사 알고리즘은 사실상 표준 UTF-16 유효성 검사 알고리즘이며 문자열을 반복하고 UTF-16 서로게이트를 페어링하여 페어링되지 않은 서로게이트에 대한 유효성 검사에 실패합니다.

자바스크립트에서는 정규식 테스트를 통해 이를 달성할 수 있습니다.

```js
!/\p{Surrogate}/u.test(str);
```

또는 다음 라인을 따라 알고리즘을 보다 명시적으로 사용합니다.

```js
function isWellFormed(str) {
  for (let i = 0; i < str.length; ++i) {
    const isSurrogate = (str.charCodeAt(i) & 0xf800) == 0xd800;
    if (!isSurrogate) {
      continue;
    }
    const isLeadingSurrogate = str.charCodeAt(i) < 0xdc00;
    if (!isLeadingSurrogate) {
      return false; // unpaired trailing surrogate
    }
    const isFollowedByTrailingSurrogate = i + 1 < str.length && (str.charCodeAt(i + 1) & 0xfc00) == 0xdc00;
    if (!isFollowedByTrailingSurrogate) {
      return false; // unpaired leading surrogate
    }
    ++i;
  }
  return true;
}
```

불행하게도 이러한 사용자 영역 구현에서는 전체 문자열을 반복해야 합니다.

## 선행 기술

- WebIDL USVString
- WhatWG/인코딩에 대한 고독한 대리 처리 토론
- Node.js util.toUSVString

## 자주 묻는 질문

내장 API 없이도 이것이 가능하지 않습니까?
질문에 대답하는 것은 가능하지만, 준선형 시간에서는 할 수 없습니다.

성능 최적화는 구현에 달려 있으며 이 사양에 의해 보장되지는 않지만 사용자 영역에서 유효성 검사보다 빠른 기본 제공 방법을 사용하는 것이 바람직합니다. 문자열이 이미 유니코드 스칼라 값의 목록인 경우와 같이 가능한 경우 선형 스캔이 필요하지 않도록 올바른 형식 상태를 문자열별로 캐시하고 문자열 작업을 통해 전파할 수 있습니다. 여전히 (재)스캔이 필요합니다.

### 사용자가 잘못된 형식의 문자열을 만났을 때 변환 이외의 작업을 하려고 합니까? 그렇다면 올바른 형식의 문자열에 대한 빠른 경로가 있는 변환 방법만 제공하지 않는 이유는 무엇입니까?

사용자는 잘못된 형식의 문자열을 발견했을 때 발생/오류를 원할 수 있습니다. 또한 소비자는 나중에 문자열이 실제로 유니코드 텍스트로 해석될 때까지 변환 또는 오류를 연기하기를 원할 수 있습니다. 이러한 사용 사례는 테스트 전용 방법을 정당화합니다.

## 폴리필

- core-js
- string.prototype.iswellformed / string.prototype.towellformed
