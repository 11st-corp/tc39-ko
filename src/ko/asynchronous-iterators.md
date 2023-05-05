# Asynchronous Iterators for JavaScript 번역

## 개요 및 제안 동기

반복자(iterator) 인터페이스(ECMAScript 2015에 소개된)는 일반적이고 구성 가능한 data consumers와 transformers의 개발을 가능하게 하는 연속적인 데이터 접근 프로토콜입니다.<sup>[1][]</sup> 기본 인터페이스는 `{value, done}` 튜플을 반환하는 `next()` 메서드입니다. 여기서 `done`은 반복자에 끝에 도달했는지 여부를 나타내는 boolean이고, `value`는 시퀀스<sup>[2][]</sup>에서 산출된 값입니다.

시퀀스에 있는 다음 value와 데이터 소스의 “done” 상태는 반복자의 메서드가 반환될 때 이미 알고 있어야 하기 때문에, 반복자는 ‘동기적인’ 데이터 소스를 나타내는데에만 적합합니다. JavaScript 프로그래머가 마주하는 많은 데이터 소스(in-memory 배열이나 다른 자료구조와 같은)는 동기화되어 있지만, 다른 많은 데이터 소스는 동기화되어 있지 않습니다. 예를 들어, I/O 접근이 필요한 모든 데이터 소스는 일반적으로 이벤트 기반 또는 스트리밍 비동기 API를 사용하여 표시됩니다. 불행히도, 반복자는 그러한 데이터 소스를 나타내는데 사용될 수 없습니다.

(게다가 반복자의 프로미스도 충분하지 않습니다. 왜냐하면 비동기적인 value의 결정을 허용할 뿐 아니라 “done” 상태의 동기적인 결정도 요구하기 때문입니다.)

비동기적인 데이터 소스에 대한 일반적인 데이터 접근을 허용하기 위해서 비동기 반복문(`for`-`await`-`of`) 및 비동기 제너레이터 함수 기능을 도입합니다.

## **Async iterators and async iterables**

async iteratorsms `next()` 메서드가 `{value, done}` 쌍에 대한 프로미스를 반환한다는 점을 제외하면 반복자와 매우 유사합니다. 위에서 언급한 대로, 반복자의 다음 value와 “done” 상태는 반복자 메서드가 반환될 때 알 수 없으므로 반복자 결과 쌍에 대한 프로미스를 반환해야 합니다.

```jsx
const { value, done } = syncIterator.next();

asyncIterator.next().then(({ value, done }) => /* ... */);
```

게다가, 주어진 객체인 `Symbol.asyncIterator`에서 비동기를 얻는 데 사용되는 새로운 기호를 소개합니다. 이를 통해 `Symbol.iterator` 가 일반적인 동기화 가능한 상태로 알림을 허용하는 방법과 유사한 임의 객체가 비동기화 가능함을 알릴 수 있습니다. 이를 사용할 수 있는 클래스의 예시로는 읽기 가능한 스트림([readable stream](https://streams.spec.whatwg.org/#rs-class))<sup>[3][]</sup>이 있습니다.

async iterator의 개념에는 요청 대기열의 개념이 내포되어 있습니다. 이전 요청의 결과가 resolved되기 전에 반복자 메서드를 여러번 호출할 수 있으므로, 각 메서드 호출은 모든 이전 요청 작업이 완료될 때까지 내부적으로 대기열에 있어야 합니다.

## **The async iteration statement: `for`-`await`-`of`**

우리는 비동기 객체에 대해 반복되는 for-of 반복문의 변형을 소개합니다. 사용 예시는 다음과 같습니다.

```js
for await (const line of readLines(filePath)) {
  console.log(line);
}
```

비동기 for-of 문은 비동기 함수 및 비동기 제너레이터 함수 내에서만 허용됩니다(아래 문서 참조).

실행 중에, `[Symbol.asyncIterator]()` 메서드를 사용하여 데이터 소스에서 비동기 반복자가 생성됩니다.

시퀀스의 다음 value에 접근할 때마다, 우리는 암묵적으로 프로미스의 반환을 `await` 합니다.

## 비동기 제너레이터 함수

비동기 제너레이터 함수는 제너레이터 함수와 유사합니다. 차이점은 다음과 같습니다.

- 호출되면, 비동기 제너레이터 함수는 객체를 반환합니다. (`next`, `throw`, 그리고 `return`) 메서드를 가진 비동기 제너레이터는 `{value, done}`을 직접적으로 반환하는 대신, `{value, done}`을 위한 프로미스를 반환합니다. 이것은 반환된 비동기 제너레이터 객체를 비동기 반복자로 자동으로 만들어줍니다.
- `await` 구문이 `for`-`await`-`of` 문에서 허용됩니다.
- `yield*`의 동작은 비동기 반복으로의 위임을 지원하도록 수정되었습니다.

예를 들어:

```js
async function* readLines(path) {
  let file = await fileOpen(path);

  try {
    while (!file.EOF) {
      yield await file.readLine();
    }
  } finally {
    await file.close();
  }
}
```

이 함수는 비동기 제너레이터 객체를 반환합니다. 이 객체는 이전 예제에 나와있는 것처럼 `for`-`await`-`of` 구문과 함께 사용할 수 있습니다.

## 구현 상태

### 네이티브 구현

- Chakra: [outstanding issue](https://github.com/Microsoft/ChakraCore/issues/2720)
- JavaScriptCore: [shipping in Safari Tech Preview 40](https://github.com/tc39/proposal-async-iteration/issues/63#issuecomment-330929480)
- SpiderMonkey: [shipping in Firefox 57](https://github.com/tc39/proposal-async-iteration/issues/63#issuecomment-330978069); [launch bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1352312)
- V8: [shipping in Chrome 63](https://blog.chromium.org/2017/10/chrome-63-beta-dynamic-module-imports_27.html); [launch bug](https://crbug.com/v8/5855)

---
[1]: #1
[2]: #2
[3]: #3

#### 1 

JS iterability : [https://exploringjs.com/es6/ch_iteration.html#sec_iterability](https://exploringjs.com/es6/ch_iteration.html#sec_iterability)

#### 2

시퀀스: 알고리즘 내에서 공간적, 시간적으로 정해져 있는 순서

#### 3

readable stream: [https://developer.mozilla.org/ko/docs/Web/API/ReadableStream](https://developer.mozilla.org/ko/docs/Web/API/ReadableStream)