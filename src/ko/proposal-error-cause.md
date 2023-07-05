# Error Cause
상태: 4 단계

작성자: [@legendecas](https://github.com/legendecas)

챔피온: [@legendecas](https://github.com/legendecas), [@hemanth](https://github.com/hemanth)

## Chaining Errors

에러는 런타임 이상을 나타내기 위해 작성됩니다. 예상치 못한 동작 진단을 돕기 위해 에러 메시지, 에러 인스턴스 속성과 같은 컨텍스트 정보로 에러를 보강하여 당시 발생한 상황을 설명해야 합니다.

깊은 내부 메서드에서 에러가 발생한 경우, 적절한 예외 디자인 패턴 없이는 던져진 에러가 쉽게 실행되지 않을 수 있습니다. 에러를 포착하고 추가 컨텍스트 데이터와 함께 에러를 던지는 것은 에러 처리 패턴의 일반적인 접근 방식입니다. 추가적인 컨텍스트 정보로 포착된 에러를 보강하기 위해 여러 가지 방법을 사용할 수 있습니다.
```js
async function doJob() {
  const rawResource = await fetch('//domain/resource-a')
    .catch(err => {
      // 에러를 올바르게 래핑하는 방법은 무엇입니까?
      // 1. throw new Error('Download raw resource failed: ' + err.message);
      // 2. const wrapErr = new Error('Download raw resource failed');
      //    wrapErr.cause = err;
      //    throw wrapErr;
      // 3. class CustomError extends Error {
      //      constructor(msg, cause) {
      //        super(msg);
      //        this.cause = cause;
      //      }
      //    }
      //    throw new CustomError('Download raw resource failed', err);
    })
  const jobResult = doComputationalHeavyJob(rawResource);
  await fetch('//domain/upload', { method: 'POST', body: jobResult });
}

await doJob(); // => TypeError: Failed to fetch
```
에러가 cause와 체이닝되어 있으면 예기치 않은 예외를 진단하는 데 큰 도움이 될 수 있습니다. 위의 예에서 볼 수 있듯이 간단한 에러 처리 사례에서 포착된 에러를 상황에 맞는 메시지로 보강하려면 꽤 많은 노동 작업을 수행해야 합니다. 게다가, 어떤 속성이 원인을 나타내는지에 대한 합의가 없으면 개발자 도구가 cause의 컨텍스트 정보를 공개할 수 없습니다.

제안된 솔루션은 `cause`속성이 있는 `Error()` 생성자에 옵션 매개 변수를 추가하는 것입니다. 이 속성의 값은 에러 인스턴스에 속성으로 할당됩니다. 따라서 에러를 조건으로 래핑하는 데 불필요하고 지나치게 정교한 형식 없이 에러를 연결할 수 있습니다.
```js
async function doJob() {
  const rawResource = await fetch('//domain/resource-a')
    .catch(err => {
      throw new Error('Download raw resource failed', { cause: err });
    });
  const jobResult = doComputationalHeavyJob(rawResource);
  await fetch('//domain/upload', { method: 'POST', body: jobResult })
    .catch(err => {
      throw new Error('Upload job result failed', { cause: err });
    });
}

try {
  await doJob();
} catch (e) {
  console.log(e);
  console.log('Caused by', e.cause);
}
// Error: Upload job result failed
// Caused by TypeError: Failed to fetch
```

## 호환성
Firefox에서 `Error()` 생성자는 두 가지 선택적 추가 위치 매개변수(`fileName`, `lineNumber`)를 받을 수 있습니다. 이러한 매개변수는 이름이 각각 `fileName` 및 `lineNumber`인 새로 생성된 에러 인스턴스에 할당됩니다.

그러나, ECMAScript 또는 Web의 어떤 표준도 이러한 동작에 대해 정의되지 않았습니다. 이 제안의 두 번째 매개변수는 `cause` 속성을 가진 객체여야 하므로, 문자열과 구별할 수 있습니다.

## 구현
폴리필
- [error-cause](https://www.npmjs.com/package/error-cause): [es-shim](https://github.com/es-shims/es-shim-api) 인터페이스 폴리필
- [Pony Cause](https://github.com/voxpelli/pony-cause): Helpers to work with ECMAScript error cause and [VError](https://github.com/TritonDataCenter/node-verror) style error cause.

JavaScript 환경

- Chrome, released on 93,
- Firefox, released on 91,
- Safari, released on 15,
- Node.js, released on [v16.9.0](https://nodejs.org/en/blog/release/v16.9.0/#error-cause).

## 자주 묻는 질문
### `AggregateError`와의 차이점

이 둘의 주요 차이점은 `AggregateError`의 에러는 관련될 필요가 없다는 것입니다. `AggregateError`는 우연히 발견되어 한 곳에서 집계된 많은 에러일 뿐이며 완전히 관련이 없을 수 있습니다. 예를 들어, `jobA`와 `jobB`는 `Promise.allSettled([ jobA, jobB ])`에서 서로에게 아무것도 할 수 없습니다. 그러나 `jobA`의 여러 수준에서 에러가 발생한 경우, `cause` 속성은 정확히 무슨 일이 일어났는지 이해하는 데 도움이 되는 해당 수준의 컨텍스트 정보를 축적할 수 있습니다.

`AggregateError`를 사용하면, 폭이 넓어집니다. `cause` 속성으로, 깊이를 얻습니다.

### `Error`의 커스텀 하위 클래스가 아닌 이유

제안의 동작을 달성하기 위한 많은 방법이 있지만, `cause` 속성이 언어에 의해 명시적으로 정의된 경우, 디버그 도구는 에러를 올바르게 구성하기 위해 개발자와 계약하는 대신 이 정보를 안정적으로 사용할 수 있습니다.