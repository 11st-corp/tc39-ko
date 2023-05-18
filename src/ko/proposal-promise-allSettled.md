# # `Promise.allSettled`

`Promise.allSettled`에 대한 ECMAScript 제안 및 참조 구현.

**저자:** Jason Williams (BBC), Robert Pamely (Bloomberg), Mathias Bynens (Google)

**투사:** Mathias Bynens (Google)

**단계:** 4

## 개요 및 제안 동기

[`Promise` 생태계에는 네 가지 주요 결합자](https://v8.dev/features/promise-combinators)가 있습니다.

| 이름                 | 설명                                     |                                                                     |
| -------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| `Promise.allSettled` | 단락<sup>[1][]</sup>하지 않음                          | 이 제안서 🆕                                                     |
| `Promise.all`        | 입력 값이 거부되면 단락  | ES2015에 추가 됨 ✅                                                   |
| `Promise.race`       | 입력 값이 확정되면 단락  | ES2015에 추가 됨 ✅                                                   |
| `Promise.any`        | 입력 값이 충족되면 단락 | [별도의 제안서](https://github.com/tc39/proposal-promise-any) 🔜 |

이들은 모두 사용자 영역<sup>[2][]</sup> 프로미스 라이브러리에서 일반적으로 사용할 수 있으며, 모두 독립적으로 유용하며 각각 다른 사용 사례를 제공합니다.

_this_ 결합자의 일반적인 사용 사례는 성공 또는 실패에 관계없이 여러 요청이 완료된 후 작업을 수행하려는 것입니다.
다른 프로미스 결합자는 특정 상태에 도달하기 위한 경쟁에서 지는 입력 값의 결과를 무시하고 단락할 수 있습니다.
`Promise.allSettled`는 모든 입력 값을 항상 대기한다는 점에서 고유합니다.

`Promise.allSettled`는 모든 원래의 프로미스가 이행 또는 거부되기 전까지 대기하다가, 프로미스 상태 스냅샷의 배열로 이루어진 프로미스를 반환합니다.

## 왜 `allSettled`?

만약 프로미스가 보류 중이 아니라면, 즉 이행되거나 거부되었다면 해당 프로미스는 완료된 상태라고 말합니다. 관련 용어에 대한 자세한 배경은 [_promise states and fates_](https://github.com/domenic/promises-unwrapping/blob/master/docs/states-and-fates.md)를 참조하십시오.

또한, 이 기능을 구현하는 사용자 영역 라이브러리에서는 일반적으로 `allSettled`라는 이름이 사용됩니다. 아래를 참조하십시오.

## 예시

현재로서는 프로미스 배열을 반복하여 각 프로미스의 상태를 알 수 있는 새로운 값으로 반환해야 합니다. 이는 이행된 분기 또는 거부된 분기를 통해 가능합니다.

```js
function reflect(promise) {
  return promise.then(
    (v) => {
      return { status: 'fulfilled', value: v };
    },
    (error) => {
      return { status: 'rejected', reason: error };
    }
  );
}

const promises = [ fetch('index.html'), fetch('https://does-not-exist/') ];
const results = await Promise.all(promises.map(reflect));
const successfulPromises = results.filter(p => p.status === 'fulfilled');
```

제안된 API를 사용하면 개발자는 reflect 함수를 생성하거나 다음을 통해 매핑할 임시 객체에 중간 결과를 할당하지 않고도 이러한 경우를 처리할 수 있습니다.

```js
const promises = [ fetch('index.html'), fetch('https://does-not-exist/') ];
const results = await Promise.allSettled(promises);
const successfulPromises = results.filter(p => p.status === 'fulfilled');
```

오류 수집 예입니다.

여기서 우리는 실패한 프로미스에만 관심이 있으므로 reason을 수집합니다. `allSettled`를 사용하면 이 작업을 매우 쉽게 수행할 수 있습니다.

```js
const promises = [ fetch('index.html'), fetch('https://does-not-exist/') ];

const results = await Promise.allSettled(promises);
const errors = results
  .filter(p => p.status === 'rejected')
  .map(p => p.reason);
```

### 실제 시나리오

일반적인 작업은 각 요청의 상태에 관계없이 모든 요청이 완료된 시기를 아는 것입니다. 이를 통해 개발자는 점진적 향상을 염두에 두고 구축할 수 있습니다. 모든 API 응답이 필수는 아닙니다.

`Promise.allSettled`가 없으면 다음보다 더 까다롭습니다.

```js
const urls = [ /* ... */ ];
const requests = urls.map(x => fetch(x)); // 이 중 일부는 실패하고 일부는 성공할 것이라고 상상해 보십시오.

// 첫 번째 거부 시 단락, 다른 모든 응답이 손실됩니다.
try {
  await Promise.all(requests);
  console.log('모든 요청이 완료되었습니다. 이제 로딩 표시기를 제거할 수 있습니다.');
} catch {
  console.log('하나 이상의 요청이 실패했지만 일부 요청은 아직 완료되지 않았을 수 있습니다! 이런.');
}
```

`Promise.allSettled`를 사용하는 것이 수행하려는 작업에 더 적합합니다.

```js
// 모든 API 호출이 완료되었음을 알고 있습니다. 우리는 finally를 사용하지만 allSettled는 절대 거부하지 않습니다.
Promise.allSettled(requests).finally(() => {
  console.log('모든 요청이 완료됨: 실패 또는 성공, 상관 없음');
  removeLoadingIndicator();
});
```

## 사용자 영역 구현

* https://www.npmjs.com/package/promise.allsettled
* https://www.npmjs.com/package/q
* https://www.npmjs.com/package/rsvp
* http://bluebirdjs.com/docs/api/reflect.html
* https://www.npmjs.com/package/promise-settle
* https://github.com/cujojs/when/blob/master/docs/api.md#whensettle
* https://www.npmjs.com/package/es2015-promise.allsettled
* https://www.npmjs.com/package/promise-all-settled
* https://www.npmjs.com/package/maybe

## 다른 언어의 이름 지정

다른 이름을 가진 다른 언어에도 유사한 기능이 있습니다. 언어 간에 균일한 이름 지정 메커니즘이 없기 때문에 이 제안은 위에 표시된 사용자 영역 JavaScript 라이브러리의 이름 지정 선례를 따릅니다. 다음 예제는 jasonwilliams와 benjamingr가 기여했습니다.

**Rust**

[`futures::join`](https://rust-lang-nursery.github.io/futures-api-docs/0.3.0-alpha.5/futures/macro.join.html) (`Promise.allSettled`와 유사). "여러 개의 future를 동시에 폴링하고, 완료 시 모든 결과를 튜플로 반환합니다."

[`futures::try_join`](https://rust-lang-nursery.github.io/futures-api-docs/0.3.0-alpha.5/futures/macro.try_join.html) (`Promise.all`과 유사)

**C#**

`Task.WhenAll` (ECMAScript `Promise.all`과 유사). `allSettled`와 동일한 동작을 달성하기 위해 try/catch 또는 `TaskContinuationOptions.OnlyOnFaulted`를 사용할 수 있습니다.

`Task.WhenAny` (ECMAScript `Promise.race`와 유사)

**Python**

[`asyncio.wait`](https://docs.python.org/3/library/asyncio-task.html#asyncio.wait)는 `ALL_COMPLETED` 옵션을 사용합니다. (`Promise.allSettled`와 유사). `allSettled` 검사 결과와 유사한 작업 객체를 반환합니다.

**Java**

[`allOf`](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletableFuture.html#allOf-java.util.concurrent.CompletableFuture...-) (`Promise.all`과 유사)

**Dart**

[`Future.wait`](https://api.dartlang.org/stable/2.0.0/dart-async/Future/wait.html) (ECMAScript `Promise.all`과 유사)

## 추가 자료

* https://www.bennadel.com/blog/3289-implementing-q-s-allsettled-promise-method-in-bluebird.htm
* https://github.com/domenic/promises-unwrapping/blob/master/docs/states-and-fates.md
* http://exploringjs.com/es6/ch_promises.html
* https://github.com/kriskowal/q/issues/257 [naming]

## TC39 회의록

- [September 2018](https://github.com/tc39/notes/blob/master/meetings/2018-09/sept-27.md#promiseallsettled-for-stage-1)
- [January 2019](https://github.com/tc39/notes/blob/master/meetings/2019-01/jan-30.md#promiseallsettled)
- [March 2019](https://github.com/tc39/notes/blob/master/meetings/2019-03/mar-26.md#promiseallsettled-for-stage-3)
- [July 2019](https://github.com/tc39/notes/blob/master/meetings/2019-07/july-24.md#promiseallsettled)

## 명세서

* [Ecmarkup source](https://github.com/tc39/proposal-promise-allSettled/blob/master/spec.html)
* [HTML version](https://tc39.es/proposal-promise-allSettled/)

## 구현

* [V8](https://bugs.chromium.org/p/v8/issues/detail?id=9060), shipping in Chrome 76
* [SpiderMonkey](https://bugzilla.mozilla.org/show_bug.cgi?id=1539694), shipping in Firefox 68 Nightly
* [JavaScriptCore](https://bugs.webkit.org/show_bug.cgi?id=197600), shipping in Safari TP 85 and Safari 13 Beta
* [Chakra](https://github.com/microsoft/ChakraCore/pull/6138)
* [XS](https://github.com/Moddable-OpenSource/moddable/issues/211), shipping in v9.0.0
* [Spec-compliant polyfill](https://www.npmjs.com/package/promise.allsettled)

---
[1]: #1
[2]: #2

#### 1 

**단락(short-circuits):** 입력된 프로미스 중 하나가 충족되거나 거부되면 다른 프로미스를 기다리지 않고 즉시 충족되거나 거부된다는 것을 의미

#### 2

**사용자 영역(userland):** JavaScript를 실행하는 브라우저와 같은 운영 체제의 외부에서 실행되는 코드를 나타냄. JavaScript 코드에서 Promise를 사용할 수 있게 해주는 라이브러리를 의미