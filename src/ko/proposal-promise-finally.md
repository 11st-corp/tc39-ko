# Promise.prototype.finally

`Promise.prototype.finally`의 ECMAScript 제안, 스펙, 참조 문헌을 제시합니다.

해당 스펙은 [cancelable promise proposal](https://github.com/tc39/proposal-cancelable-promises/blob/e31520fc9a53a8cbeff53b0df413d9e565b27d69/Third%20State.md#promiseprototypefinally-implementation) 에 따라  [@ljharb](https://github.com/ljharb) 에 의해 작성되었습니다.

폴리필/shim은 [npm](https://www.npmjs.com/package/promise.prototype.finally) 에 있습니다.

해당 제안은 현재 [process](https://tc39.es/process-document/) 상의 [stage 4](https://github.com/tc39/proposals/blob/main/finished-proposals.md) 에 있습니다.


# 이론적 해석

많은 promise 라이브러리들은 promise가 완료(`fulfilled` 또는 `rejected`)되었을 때 발생하는 콜백을 등록하는 `finally` 메서드를 가지고 있습니다. 가장 기초적인 예제는 `cleanup` 입니다. 이는 AJAX 요청 중 보여지는 "loading" 스피너를 숨기게 하고 싶다거나, 열려있는 파일을 닫게 한다거나, 어떠한 작업이 진행되었을 때 성공여부를 떠나 로그를 남기고 싶을 때를 말합니다.

## `then(f, f)`을 사용하면 되지 않을까요?

`promise.finally(func)`은 `promise.then(func, func)`과 유사하면서도 몇몇 중요한 차이가 존재합니다.

- 함수를 inline 방식으로 사용하는 경우, 해당 함수를 두번 정의하거나 변수로 정의하지 않고 한번만으로 전달할 수 있습니다.
- `finally` 콜백은 promise의 성공 / 실패여부와 무관하기 때문에 어떠한 인자도 받지 않습니다. 실패 사유나 성공시 전달되는 반환 값이 필요하지 않는 경우에만 사용합니다.
- `Promise.resolve(2).then(() => {}, () => {})`은 promise가 `undefined`를 반환하며 성공하지만, `Promise.resolve(2).finally(() => {})`는 `2`를 반환하며 성공합니다.
- 유사하게 `Promise.reject(3).then(() => {}, () => {})`은 promiserk `undefined`를 반환하며 실패하지만, `Promise.reject(3).finally(() => {})`는 `3`을 반환하며 실패합니다.


그러나 `finally` 콜백 내의 `throw`나 rejected된 promise를 반환하는 경우, 실패 사유와 함께 새로운 promise를 `reject`할 것입니다.

# 네이밍

`finally`라는 이름을 고수한 이유는, 직관적이기 때문입니다. `catch`와 마찬가지로 `finally`는 `try`/`catch`/`finally`의 구문 형식을 따르고 있습니다. (물론 `try`는 `Promise.resolve().then`과 유사성이 떨어집니다.) finally 구문은 예외 처리를 한다거나 빠르게 반환하는 것과 같이 "갑작스러운 완료"를 통해 반환 값을 수정할 수 있습니다. 하지만 `Promise#finally`는 내부에서 예외를 던짐(promise를 reject 시킴)으로서 갑작스럽게 완료시키는 것을 제외하고는, 반환값을 수정할 수 없습니다. 이는 promise의 정상 종료와 종료보다 이른 `return undefined` 간의 차이를 구별할 수 없을 뿐 만 아니라 finally 구문의 병렬 처리는 반드시 동시성에 대한 차이가 존재하기 때문입니다.

저는 순서의 의미를 지니지 않은 단어인 `always`를 대체로 고려하였으나, 저는 통사적 변화에 대한 유사점이 설득력 있다고 생각합니다.


# 구현

- [Bluebird#finally](http://bluebirdjs.com/docs/api/finally.html)
- [Q#finally](https://github.com/kriskowal/q/wiki/API-Reference#promisefinallycallback)
- [when#finally](https://github.com/cujojs/when/blob/master/docs/api.md#promisefinally)
- [jQuery jqXHR#always](https://api.jquery.com/jQuery.ajax/#jqXHR)

# 스펙

스펙은 [markdown format](https://github.com/tc39/proposal-promise-finally/blob/main/spec.md) 으로 볼 수 있거나, [HTML](https://tc39.es/proposal-promise-finally/) 을 통해 확인이 가능합니다.