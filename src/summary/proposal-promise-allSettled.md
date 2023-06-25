# `Promise.allSettled`

## 프로미스의 세가지 상태

- **Pending(대기):** 비동기 처리 로직이 아직 완료되지 않은 상태
- **Fulfilled(이행):** 비동기 처리가 완료되어 프로미스가 결과 값을 반환해준 상태
- **Rejected(거부):** 비동기 처리가 실패하거나 오류가 발생한 상태

##  [Implementing Q's .allSettled() Promise Method In Bluebird](https://www.bennadel.com/blog/3289-implementing-qs-allsettled-promise-method-in-bluebird.htm)

> The key feature of the .allSettled() method is that it allows us to collect Promise rejections rather than propagate them to the closest .catch() handler.

`.allSettled()` 메서드의 핵심 기능은 프로미스 거부를 가장 가까운 `.catch()` 핸들러로 전파하는 대신 수집할 수 있다는 것입니다.

```js
Promise.allSettled([
  Promise.resolve(22),
  new Promise((resolve) => setTimeout(() => resolve(24), 0)),
  42,
  Promise.reject(new Error("an error")),
]).then((values) => console.log(values));

// [
//   { status: 'fulfilled', value: 22 },
//   { status: 'fulfilled', value: 24 },
//   { status: 'fulfilled', value: 42 },
//   { status: 'rejected', reason: Error: an error }
// ]
```

동일한 코드를 `.all()` 메서드로 작성하면 아래와 같습니다.

```js
Promise.all([
  Promise.resolve(22),
  new Promise((resolve) => setTimeout(() => resolve(24), 0)),
  42,
  Promise.reject(new Error("an error")),
]).then((values) => console.log(values)).catch(err=>console.log('err', err));
```

`.catch()`를 사용하지 않으면 오류가 발생합니다.
