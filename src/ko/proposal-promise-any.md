# ECMAScript proposal: `Promise.any` + `AggregateError`

**저자:** Mathias Bynens, Kevin Gibbons, Sergey Rubanov

**챔피언<sup>[1][]</sup>:** Mathias Bynens

**단계:** [TC39 과정](https://tc39.es/process-document/)의 4단계

## 제안 동기

[`Promise` 생태계에는 네 가지 주요 결합자](https://v8.dev/features/promise-combinators)가 있습니다.

| 이름                  | 설명                 |                 |
| -------------------- | ------------------ | --------------- |
| `Promise.allSettled` | 단락 하지 않음        | ES2020에 추가 됨 ✅ |
| `Promise.all`        | 입력 값이 거부되면 단락 | ES2015에 추가 됨 ✅ |
| `Promise.race`       | 입력 값이 결정되면 단락 | ES2015에 추가 됨 ✅ |
| `Promise.any`        | 입력 값이 충족되면 단락 | 본 제안서 🆕 ES2021 예정 |

이들은 모두 사용자 영역 프로미스 라이브러리에서 일반적으로 사용 가능하며, 모두 독립적으로 유용하며 각각 다른 사용 사례를 제공합니다.

## 제안된 해결책

`Promise.any`는 프로미스의 이터러블을 받아들이고, 주어진 프로미스 중 처음으로 충족된 프로미스를 반환하거나, 주어진 모든 프로미스들이 거부되었다면 거부 이유를 포함한 `AggregateError`와 함께 거부됩니다. (만약 더 근본적인 문제가 발생한다면, 예를 들어 이터러블을 반복하는 도중 예외가 발생한 경우, `Promise.any`는 예외와 함께 거부된 프로미스를 반환합니다.)

## 고급 API

```js
try {
  const first = await Promise.any(promises);
  // 프로미스들 중 하나라도 충족되었습니다.
} catch (error) {
  // 모든 프로미스들이 거부되었습니다.
}
```

혹은, `async`/`await`가 없는 경우

```js
Promise.any(promises).then(
  (first) => {
    // 프로미스들 중 하나라도 충족되었습니다.
  },
  (error) => {
    // 모든 프로미스들이 거부되었습니다.
  }
);
```

위의 예제에서 `error`는 `AggregateError`입니다. 개별 오류를 그룹화하는 새로운 `Error` 하위클래스이죠. 모든 `AggregateError` 인스턴스는 예외의 배열을 가리키는 포인터를 포함합니다.

### 자주 묻는 질문

#### 왜 이름을 `any`로 지었나요?

`any`라는 이름은 무엇을 하는지 명확하게 설명하며, 사용자 영역 라이브러리에서 이러한 기능을 제공하는 선례가 있습니다.
- https://github.com/kriskowal/q#combination
- http://bluebirdjs.com/docs/api/promise.any.html
- https://github.com/m0ppers/promise-any
- https://github.com/cujojs/when/blob/master/docs/api.md#whenany
- https://github.com/sindresorhus/p-any

#### 왜 배열 대신 `AggregateError`를 던지나요?
ECMAScript 언어 내에서 일반적인 관행은 예외 유형만 던지는 것입니다. 생태계 내의 기존 코드는 현재 내장 메서드와 구문에 의해 던져지는 모든 예외가 `instacneof Error`라는 사실에 의존하고 있을 가능성이 높습니다. 일반 배열을 사용할 수 있는 새로운 언어 기능을 추가하면 생태계를 교란시키고, 웹 호환성 문제를 발생시킬 수 있습니다. 또한, `Error` 인스턴스(또는 하위클래스)를 사용하여 스택 추적이 제공될 수 있습니다. 그것은 필요 없다면 버리기 쉽지만, 나중에 필요할 때는 가져오는 것이 불가능합니다.

## 설명을 위한 예시

이 스니펫은 무엇이 가장 빨리 끝나는지를 확인하고, 로그를 남깁니다.

```js
Promise.any([
  fetch('https://v8.dev/').then(() => 'home'),
  fetch('https://v8.dev/blog').then(() => 'blog'),
  fetch('https://v8.dev/docs').then(() => 'docs')
]).then((first) => {
  // 프로미스들 중 하나라도 충족되었습니다.
  console.log(first);
  // → 'home'
}).catch((error) => {
  // 모든 프로미스들이 거부되었습니다.
  console.log(error);
});
```

## TC39 회의록
- [3월 2019](https://github.com/tc39/notes/blob/master/meetings/2019-03/mar-27.md#promiseany)
- [6월 2019](https://github.com/tc39/notes/blob/master/meetings/2019-06/june-5.md#promiseany)
- [7월 2019](https://github.com/tc39/notes/blob/master/meetings/2019-07/july-24.md#promiseany)
- 10월 2019 [part one](https://github.com/tc39/notes/blob/master/meetings/2019-10/october-2.md#promiseany-for-stage-3) and [part two](https://github.com/tc39/notes/blob/master/meetings/2019-10/october-3.md#promiseany-reprise)
- 6월 2020 [part one](https://github.com/tc39/notes/blob/master/meetings/2020-06/june-2.md#aggregateerror-errors-update) and [part two](https://github.com/tc39/notes/blob/master/meetings/2020-06/june-2.md#aggregateerror-constructor-update)
- [July 2020](https://github.com/tc39/notes/blob/master/meetings/2020-07/july-21.md#promiseany--aggregateerror-for-stage-4)

## 사양

- [Ecmarkup source](https://github.com/tc39/proposal-promise-any/blob/master/spec.html)
- [HTML version](https://tc39.es/proposal-promise-any/)

## 구현

- JavaScript 엔진:
    - [JavaScriptCore](https://bugs.webkit.org/show_bug.cgi?id=202566), shipping in Safari 14
    - [SpiderMonkey](https://bugzilla.mozilla.org/show_bug.cgi?id=1568903), shipping in Firefox 79
    - [V8](https://bugs.chromium.org/p/v8/issues/detail?id=9808), shipping in Chrome 85
    - [XS](https://blog.moddable.com/blog/xs10/)
    - [engine262](https://github.com/engine262/engine262/commit/c68877ef1c4633daac8b58b5ce1876f709c1cc16)

- 폴리필:
    - [core-js](https://github.com/zloirock/core-js#promiseany)
    - [es-shims](https://github.com/es-shims/Promise.any)

- [TypeScript](https://github.com/microsoft/TypeScript/pull/33844)


[1]: #1

#### 1 

**챔피언(champion):** 제안의 작성자 및 편집자. 챔피언은 제안을 stage 0에서 stage 4까지 진화시키는 책임을 갖는다. 챔피언은 제안 저장소에서 관리자 권한을 갖고, 자유롭게 변경할 수 있다. 주기적으로 챔피언은 제안을 TC39에 가져와서 단계 진행에 대한 합의를 요청할 수 있다.
출처 : https://tc39.es/process-document/