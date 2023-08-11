# RegExp Match Indices for ECMAScript

ECMAScript `RegExp` Match indices는 입력 문자열의 시작과 관련하여 캡처된 부분 문자열의 시작 및 종료 인덱스에 대한 추가 정보를 제공합니다. 

폴리필은 [`regexp-match-indices`](https://www.npmjs.com/package/regexp-match-indices) NPM 패키지에서 찾을 수 있습니다.
> 주의: 이 제안서는  "RegExp Match Array Offsets" 라는 이름이었지만, 제안서의 현재 상태를 조금 더 정확하게 표현하기 위해서 이름이 변경되었습니다.

## 상태
4단계: 챔피언: Ron Buckton (@rbuckton)
제안의 상세한 상태를 보고 싶다면, 아래의 [TODO](#todo)를 보세요.

## 제안 동기
오늘날, ECMAScript `RegExp` 객체는 `exec` 메서드를 호출할 때 일치하는 정보를 제공해줄 수 있습니다. 이 결과는 `Array`이고 일치된 것들의 부분 문자열에 대한 정보를 담고 있고, `input` 문자열에 대한 추가적인 속성과, 매치가 이뤄진 곳의 `index`와, 명명된 캡처 그룹의 부분문자열을 포함하는 `groups` 객체 또한 제공합니다. 

그러나, 이 정보들이 충분하지 않는 고급 시나리오들이 몇몇 존재합니다. 예를 들어 TextMate 언어 구문 하이라이팅에 대한 ECMAScript의 구현은 일치되는 것의 `index`만으로는 부족하고, 독립된 캡처 그룹의 시작과 끝 인덱스가 추가로 필요합니다.

RegExpBuiltInExec 추상화 작동(그리고 `RegExp.prototype.exec()`, `String.prototype.match` 등의 결과에도)의 추가적인 결과 배열(부분 문자열 배열)에 `indices` 속성을 추가하는 것을 채택하는 것을 제안합니다. 이 속성은 각각의 캡처된 부분 문자열의 시작과 끝 인덱스를 담고 있는 배열 자체일 것입니다. 일치되지 않은 캡처 그룹들은 부분 문자열 배열에서의 응답되는 요소와 비슷한 방식으로 `undefined`가 될 것입니다. 추가로, indices 배열은 각각의 명명된 캡처 그룹의 시작과 끝 인덱스를 포함하는 속성인 `groups`를 가질 것입니다.
> 주의: 성능 이슈로, `indices`는 `d` 플래그가 지정된 경우에만 결과에 추가될 것입니다.

## 왜 RegExp 플래그로 `d`를 사용하는가?
`indices`에 `d`가 포함되어 있어서 `d`를 선택했습니다. 이 단어는 해당 기능(RegExp의 `lastIndex`, match의 `index`등)의 근본이 되는 명칭입니다. 문자 `i`는 ignore-cases(대소문자 무시)에 이미 사용되고 있고, `n`은 캡처링 vs 비-캡처링 그룹을 다루기 위해 다른 엔진에서 선행되고 있습니다. 이는 `s`가 dot-all을 위해 사용되고 있기 때문에 "sticky" 플래그를 `y`로 사용하는 것과 유사합니다.

**왜 `d`와 `indices` 대신 `o`와 `offsets`를 사용하지 않나요?** 우리의 목표가 RegExp의 기존 용어(`lastIndex`와 `index`)와 속성의 이름을 일치시키기 위함이기 때문입니다.

**`d`가 다른 엔진에는 다른 의미를 갖지 않나요?** 맞기도 하고 아니기도 합니다. 소수의 엔진들(Onigmo, Perl, java.util.regex)은 다른 의미의 `d` 플래그를 가지고 있습니다. Onigmo와 Perl은 `d` 플래그를 하위 호환성의 의미(Perl의 문서에는 사용을 권장하지 않는다고 강조되어 있습니다)로 사용하는 반면, java.util.regex는 `d`를 개행 처리에 사용합니다. 46개의 다른 RegExp 엔진에서 지원받는 전체 리스트를 [flags_comparison.md](./flags_comparison.md)에서 찾아볼 수 있습니다.

## 선행 기술
* Oniguruma NodeJS bindings: [`captureIndices` property](https://github.com/atom/node-oniguruma#onigscannerfindnextmatchsyncstring-startposition)
* .NET: [`Capture.Index` Property](https://msdn.microsoft.com/en-us/library/system.text.regularexpressions.capture.index(v=vs.110).aspx)
* Java: [`Matcher.start(int)` Method](https://docs.oracle.com/javase/7/docs/api/java/util/regex/Matcher.html#start(int))

## 예제<sup>[1][]</sup>
```js
const re1 = /a+(?<Z>z)?/d;

// indices are relative to start of the input string:
const s1 = "xaaaz";
const m1 = re1.exec(s1);
m1.indices[0][0] === 1;
m1.indices[0][1] === 5;
s1.slice(...m1.indices[0]) === "aaaz";

m1.indices[1][0] === 4;
m1.indices[1][1] === 5;
s1.slice(...m1.indices[1]) === "z"; 

m1.indices.groups["Z"][0] === 4;
m1.indices.groups["Z"][1] === 5;
s1.slice(...m1.indices.groups["Z"]) === "z";

// capture groups that are not matched return `undefined`:
const m2 = re1.exec("xaaay");
m2.indices[1] === undefined;
m2.indices.groups["Z"] === undefined;
```

## TODO
The following is a high-level list of tasks to progress through each stage of the [TC39 proposal process](https://tc39.github.io/process-document/):

### Stage 1 Entrance Criteria

* [x] Identified a "[champion][Champion]" who will advance the addition.
* [x] [Prose][Prose] outlining the problem or need and the general shape of a solution.
* [x] Illustrative [examples][Examples] of usage.
* [x] High-level [API][API].

### Stage 2 Entrance Criteria

* [x] [Initial specification text][Specification].
* [ ] ~~[Transpiler support][Transpiler] (_Optional_).~~

### Stage 3 Entrance Criteria

* [x] [Complete specification text][Specification].
* [x] Designated reviewers have [signed off][Stage3ReviewerSignOff] on the current spec text.
* [x] The ECMAScript editor has [signed off][Stage3EditorSignOff] on the current spec text.

### Stage 4 Entrance Criteria

* [x] [Test262](https://github.com/tc39/test262) acceptance tests have been written for mainline usage scenarios and [merged][Test262PullRequest]. 
* [x] Two compatible implementations which pass the acceptance tests:
    * [x] V8 ([tracking bug](https://bugs.chromium.org/p/v8/issues/detail?id=9548)) &mdash; Shipping in Chrome Canary 91 (V8 v9.0.259)
    * [x] SpiderMonkey ([tracking bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1519483)) &mdash; Shipping in Firefox Nightly 88
    * [x] JavaScriptCore ([tracking bug](https://bugs.webkit.org/show_bug.cgi?id=202475)) &mdash; Shipping in Safari Technology Preview 122
    * [x] Engine262 ([PR#1](https://github.com/engine262/engine262/pull/99), [PR#2](https://github.com/engine262/engine262/pull/161))
* [x] A [pull request][Ecma262PullRequest] has been sent to tc39/ecma262 with the integrated spec text.
* [x] The ECMAScript editor has signed off on the [pull request][Ecma262PullRequest].

[1]: #1
---

#### 1

[Named Capture Group](https://github.com/11st-corp/tc39-ko/blob/main/src/ko/proposal-regexp-named-groups.md)