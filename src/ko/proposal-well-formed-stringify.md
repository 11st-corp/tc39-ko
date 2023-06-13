# 올바른 형식의 JSON.stringify

`JSON.stringify`가 잘못된 형식의 유니코드 문자열을 반환하는 것을 방지하기 위한 제안

## 상태

본 제안은 [TC39 과정](https://tc39.es/process-document/)의 4단계에 있습니다.

## 제안한 사람

- Mathias Bynens

## 동기

[RFC 8259 섹션 8.1](https://datatracker.ietf.org/doc/html/rfc8259#section-8.1)은 폐쇄형 생태계 범위 밖에서 교환되는 JSON 텍스트를 UTF-8을 사용하여 인코딩하도록 요구하지만, `JSON.stringify`는 UTF-8(특히, U+DFF를 통한 대리 코드 포인트 U+D800)에 표현이 없는 코드 포인트를 포함하는 문자열을 반환할 수 있습니다. 그리고 `JSON.stringify`의 설명과 달리, 이러한 문자열은 유니코드 표준 버전 10.0.0에 따라 "D800₁₆..DFFF₁₆ 범위에서 분리된 UTF-16 코드 단위"이기 때문에 "UTF-16"이 아닙니다.정의 D91에서 [유니코드 표준 버전 10.0.0, 섹션 3.4](https://unicode.org/versions/Unicode10.0.0/ch03.pdf#G7404)에 따라 DFF는 잘못된 형식이며 정의 D89에서 "UTF-16"에서 제외됩니다.

그러나, JSON 문자열에 유니코드 이스케이프 시퀀스가 포함될 수 있으므로 이러한 잘못된 유니코드 문자열을 반환할 필요가 없습니다.

## 제안된 해결책

쌍을 이루지 않은 대리 코드 포인트를 단일 UTF-16 코드 단위로 반환하는 대신, JSON 이스케이프 시퀀스로 표시합니다.

## 설명에 도움이 되는 예시

```js
// 비 BMP 문자는 여전히 대리 쌍으로 직렬화됩니다.
JSON.stringify("𝌆");
// → '"𝌆"'
JSON.stringify("\uD834\uDF06");
// → '"𝌆"'

// 쌍을 이루지 않은 대리 코드 단위는 이스케이프 시퀀스로 직렬화됩니다.
JSON.stringify("\uDF06\uD834");
// → '"\\udf06\\ud834"'
JSON.stringify("\uDEAD");
// → '"\\udead"'
```

## 논의

### 이전 버전과의 호환성

이 변경 사항은 소비자가 JSON 사양을 준수한다는 가정 하에 하위 호환성이 보장됩니다. 사용자가 볼 수 있는 효과는 JSON의 일부 드문 단일 UTF-16 코드 단위를 UTF-16 및 UTF-8에서 모두 나타낼 수 있는 동등한 6자 이스케이프 시퀀스로 대체하는 것으로 제한됩니다. 저자들은 현재 잘못된 형식의 출력물을 받아들이는 모든 소비자는 이러한 변화의 영향을 받지 않을 것이라고 생각합니다(특히 ECMAScript `JSON.parse`가 그렇습니다).

 현재 잘못된 형식의 출력을 거부하는 모든 소비자는 올바른 형식의 표현을 받아들일 수 있는 새로운 기회를 갖게 될 것입니다. 이러한 소비자는 스칼라 값이 아닌 유니코드 코드 포인트를 포함한 문자열을 지정하는 입력을 거부할 수 있습니다(예: [I-JSON](https://datatracker.ietf.org/doc/html/rfc7493) 입력만 수락하므로), 그러나 이를 수용하는 사람들은 짝을 이루지 못한 대리인을 처리하기 위한 메커니즘을 가지고 있어야 합니다(JSON 사양에 언급됨).

### 유효성

유니코드 이스케이프 시퀀스는 유효한 JSON이며, 완전히 ASCII이기 때문에 UTF-16과 UTF-8 모두에서 잘 형성되어 있습니다.

## 사양

사양은 [ecmarkup](https://github.com/tc39/proposal-well-formed-stringify/blob/master/spec.emu) 또는 [렌더링된 HTML](https://tc39.es/proposal-well-formed-stringify/)에서 사용할 수 있습니다.

## 구현

- [V8](https://bugs.chromium.org/p/v8/issues/detail?id=7782), V8 v7.2.10 및 Chrome 72에서 기본적으로 사용
- Firefox 64에서 제공되는 [SpiderMonkey](https://bugzilla.mozilla.org/show_bug.cgi?id=1469021)
  [JavaScriptCore](https://bugs.webkit.org/show_bug.cgi?id=191677), [Safari Technology Preview 73(https://webkit.org/blog/8555/release-notes-for-safari-technology-preview-73/)에서 제공
