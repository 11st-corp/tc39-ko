# [String.prototype.padStart](https://github.com/es-shims/String.prototype.padStart) / [String.prototype.padEnd](https://github.com/es-shims/String.prototype.padEnd)

String.prototype.padStart/padEnd에 대한 ECMAScript 제안, 사양, 테스트 및 참조 구현.

본 [초기](http://wiki.ecmascript.org/doku.php?id=strawman:string_padding) 제안서는 [@rwaldron](https://github.com/rwaldron) 및 [@dherman](https://github.com/dherman)의 의견을 바탕으로 [@KevinGrandon](https://github.com/kevingrandon)이 초안을 작성했습니다.
[@rwaldron](https://github.com/rwaldron), [@allenwb](https://github.com/allenwb) 및 [@dherman](https://github.com/dherman)의 의견과 함께 [@ljharb](https://github.com/ljharb)가 작성한 사양을 업데이트 했습니다.

본 제안서는 [전체 과정](https://tc39.github.io/process-document/)에서 현재 [4 단계](https://github.com/tc39/proposals/blob/master/finished-proposals.md)에 있습니다.

지정된 TC39 검토자: @littledan @michaelficarra

## 이론적 근거

기본 메서드를 사용하여 문자열을 채우는 합리적인 방법이 없으면, 오늘날 JavaScript 문자열로 작업하는 것이 예상보다 더 어렵습니다. 이러한 기능이 없으면, 언어가 불완전하게 느껴지고, 매우 세련된 경험과 단절 될 수 있습니다.

일반적인 사용으로 인해, 문자열 패딩 기능은 대부분의 웹 사이트 및 프레임워크에 존재합니다. 예를 들어, FirefoxOS의 거의 모든 앱은 모두 일반적인 문자열 패딩 작업이 필요했기 때문에 왼쪽 패드 기능을 구현 했습니다.

현재 대부분의 문자열 패딩 구현이 비효율적일 가능성이 높습니다. 이를 플랫폼으로 가져오면 더 이상 이러한 공통 기능을 구현할 필요가 없으므로 웹 성능과 개발자 생산성이 향상됩니다.

## 명세서

명세서를 [마크다운 형식](https://github.com/tc39/proposal-string-pad-start-end/blob/main/spec.md)으로 보거나 [HTML](http://tc39.github.io/proposal-string-pad-start-end/)로 렌더링할 수 있습니다.

## 이름 지정

~~`startsWith`/`endsWith`가 있음에도 불구하고 [trimStart/trimRight](https://github.com/sebmarkbage/ecmascript-string-left-right-trim) 및 `reduce`/`reduceRight`와의 일관성을 위해 , `padLeft` 및 `padRight`로 정했습니다.~~
2015년 11월 TC39 회의에 따른 개정: 이름은 `padStart`/`padEnd`이고 `trimLeft`/`trimRight`는 `trimStart`/`trimEnd`로 변경되며, `trimLeft`/`trimRight` 별칭은 웹 호환성을 위해 부록 B에 추가됩니다.

## "최소 길이" vs "최대 길이"의 의미론

이 제안을 명세서 언어로 개정하는 동안, 우리는 첫 번째 매개 변수가 패딩된 문자열의 최소 길이 또는 최대 길이를 결정해야 하는지에 대해 자세히 논의 했습니다. 특히, "최소 길이" 의미론에서는 `'foo'.padEnd(4, '12')`가 `foo12`를 출력하고, "최대 길이" 의미론은 `foo1`을 출력한다고 말합니다. `padStart`/`padEnd`의 주요 사용 사례 중 하나는 열에 있는 단일 공백 문자 형식을 지정하는 것이고, `String#repeat`을 통해 "최소 길이" 의미론을 달성할 수 있기 때문에, 우리는 "최대 길이"가 훨씬 더 유용한 접근법이라고 결정 했습니다.

## 채워질 문자열과 관련된 왼쪽 패딩: 다른 언어와의 일관성

[#6](https://github.com/tc39/proposal-string-pad-start-end/issues/6)에 따라, '왼쪽' 및 '오른쪽' 기능을 모두 제공하는 다중 문자 채워질 문자열을 지원하는 유일한 언어는 Ruby와 PHP입니다. 두 언어의 "왼쪽 패드"는 마지막이 아닌 채워질 문자열의 첫 부분을 차지합니다. 이것이 중요한 이유에 대한 분명한 예는 `"abc".padStart(10, "0123456789")`가 채워질 문자열의 마지막 부분을 취하면 `"3456789abc"`가 되고 첫 부분을 취하면 `"0123456abc"`가 되는 것입니다. 즉, `string.padStart(mask.length, mask)`는 예상대로 작동해야 합니다.
