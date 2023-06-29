# ECMAScript proposal: Top-level await

챔피언: Myles Borins, Yulia Startsev

작성자: Myles Borins, Yulia Startsev, Daniel Ehrenberg, Guy Bedford, Ms2ger, 그리고 다른 작성자들

상태: 4단계

## 개요

최상위 `await`를 사용하면 모듈이 큰 비동기 함수로 작동할 수 있습니다. 최상위 `await`를 사용하면 ECMAScript 모듈(ESM)이 리소스를 `await`할 수 있으므로, 리소스를 `import`하는 다른 모듈이 리소스를 평가하기 전에 대기할 수 있습니다.

## 동기

### IIAFE의 한계

비동기 함수 내에서만 `await`를 사용할 수 있으므로 모듈은 해당 코드를 비동기 함수로 구현하여 시작 시 실행되는 코드에 await를 포함할 수 있습니다.

```js
// awaiting.mjs
import { process } from "./some-module.mjs";
let output;
async function main() {
  const dynamic = await import(computedModuleSpecifier);
  const data = await fetch(url);
  output = process(dynamic.default, data);
}
main();
export { output };
```

이 패턴은 즉시 호출될 수도 있습니다. [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE) 관용구로 작동하기에, 이것을 즉시 호출된 비동기 함수식이라고 부를 수 있습니다.

```js
// awaiting.mjs
import { process } from "./some-module.mjs";
let output;
(async () => {
  const dynamic = await import(computedModuleSpecifier);
  const data = await fetch(url);
  output = process(dynamic.default, data);
})();
export { output };
```

이 패턴은 나중에 발생할 작업을 예약하기 위해 모듈을 로드하는 상황에 적합합니다. 그러나 이 비동기 함수가 완료되기 전에 이 모듈의 export에 접근할 수 있습니다. 다른 모듈이 이 모듈을 import하면, 액세스가 발생하는 시점에 따라 `output`이 `undefined`로 표시되거나 `process`의 반환 값으로 초기화된 후에 표시될 수 있습니다.

```js
// usage.mjs
import { output } from "./awaiting.mjs";
export function outputPlusValue(value) { return output + value; }

console.log(outputPlusValue(100));
setTimeout(() => console.log(outputPlusValue(100), 1000);
```

## 해결 방법: 프로미스을 내보내 초기화를 나타냅니다.

이 기능이 없으면, 모듈에서 프로미스를 내보낼 수 있고, export가 준비되면 알 수 있도록 대기할 수 있습니다. 예를 들어, 위의 모듈은 다음과 같이 작성할 수 있습니다.

```js
// awaiting.mjs
import { process } from "./some-module.mjs";
let output;
export default (async () => {
  const dynamic = await import(computedModuleSpecifier);
  const data = await fetch(url);
  output = process(dynamic.default, data);
})();
export { output };
```

그런 다음 모듈을 다음과 같이 사용할 수 있습니다.

```js
// usage.mjs
import promise, { output } from "./awaiting.mjs";
export function outputPlusValue(value) { return output + value }

promise.then(() => {
  console.log(outputPlusValue(100));
  setTimeout(() => console.log(outputPlusValue(100), 1000);
});
```

그러나, 이것은 여전히 ​​다음과 같은 많은 문제가 있습니다.

- 로드되는 모듈을 기다리려면, 올바른 프로미스를 찾기 위해 모든 사람이 특정 프로토콜을 알아야 합니다.
- 프로토콜을 적용하는 것을 잊은 경우, 일부 시간 동안 "그냥 작동"할 수 있습니다. (race에서 특정 방식으로 승리하기 때문에)
- 깊은 모듈 계층에서, 프로미스는 체인의 각 단계를 통해 명시적으로 스레드되어야 합니다.

예를 들어, 여기에서 `"./awaiting.mjs"`의 프로미스를 제대로 기다렸지만, 이를 다시 export하는 것을 잊었으므로, 모듈을 사용하는 모듈이 여전히 원래 race 상태로 실행될 수 있습니다.

## 상당한 추가 역동성을 통한 race 회피

export에 액세스하기 전에 내보낸 프로미스를 기다리는 것을 잊어버리는 위험을 피하기 위해, 모듈은 대신 export가 포함된 객체로 확인되는 프로미스를 내보낼 수 있습니다.

```js
// awaiting.mjs
import { process } from "./some-module.mjs";
export default (async () => {
  const dynamic = await import(computedModuleSpecifier);
  const data = await fetch(url);
  const output = process(dynamic.default, data);
  return { output };
})();
```

```js
// usage.mjs
import promise from "./awaiting.mjs";

export default promise.then(({output}) => {
  function outputPlusValue(value) { return output + value }

  console.log(outputPlusValue(100));
  setTimeout(() => console.log(outputPlusValue(100), 1000);

  return { outputPlusValue };
});




```

이 패턴이 유행했는지는 확실하지 않지만, 때때로 이 패턴은 이러한 종류의 문제에 직면한 사람들에게 [StackOverflow에서 권장](https://stackoverflow.com/questions/42958334/how-can-i-export-promise-result/42958644#42958644)됩니다.

그러나 이 패턴은 관련 소스를 보다 동적인 패턴으로 광범위하게 재구성해야 하고, 동적으로 사용 가능한 import를 사용하기 위해 모듈 본문의 대부분을 `.then()` 콜백 내부에 배치해야 하는 바람직하지 않은 효과가 있습니다. 이는 ES2015 모듈과 비교하여 정적 분석 가능성, 테스트 가능성, 인체 공학 등의 측면에서 상당한 후퇴를 나타냅니다. 그리고 `await`해야 하는 깊은 종속성에 도달하면, 이 패턴을 사용하도록 모든 종속 모듈을 재구성해야 합니다.

## 해결책: 최상위 `await`

최상위 `await`를 사용하면 모듈 시스템 자체에 의존하여 이러한 모든 프로미스를 처리하고 일이 잘 조정되는지 확인할 수 있습니다. 위의 예는 다음과 같이 간단히 작성하여 사용할 수 있습니다.

```js
// awaiting.mjs
import { process } from "./some-module.mjs";
const dynamic = import(computedModuleSpecifier);
const data = fetch(url);
export const output = process((await dynamic).default, await data);
```

```js
// usage.mjs
import { output } from "./awaiting.mjs";
export function outputPlusValue(value) { return output + value }

console.log(outputPlusValue(100));
setTimeout(() => console.log(outputPlusValue(100), 1000);
```

`awaiting.mjs`의 `await`가 프로미스를 해결하기 전까지는 `usage.mjs`의 어떤 명령문도 실행되지 않으므로, race 조건은 의도적으로 방지됩니다. 이는 `awaiting.mjs`가 최상위 `await`를 사용하지 않은 경우, `awaiting.mjs`가 로드되고 해당 명령문이 모두 실행될 때까지 `usage.mjs`의 명령문이 실행되지 않는 방식의 확장입니다.

## 사용 예제

비동기 작업이 로드되기를 기다리는 모듈을 갖는 것이 언제 의미가 있습니까? 이 섹션에서는 몇 가지 예제를 제공합니다.

### 동적 종속성 경로 지정

```js
const strings = await import(`/i18n/${navigator.language}`);
```

이를 통해 모듈은 종속성을 결정하기 위해 런타임 값을 사용할 수 있습니다. 이는 개발/프로덕션의 분할, 국제화, 환경 분할 등과 같은 작업에 유용합니다.

### 리소스 초기화

```js
const connection = await dbConnector();
```

이를 통해 모듈은 리소스를 나타낼 수 있으며 모듈을 사용할 수 없는 경우 오류를 생성할 수도 있습니다.

### 종속성 폴백

```js
let jQuery;
try {
  jQuery = await import("https://cdn-a.com/jQuery");
} catch {
  jQuery = await import("https://cdn-b.com/jQuery");
}
```

### 웹어셈블리 모듈

웹어셈블리 모듈은 import를 기반으로한 논리적 비동기 방식으로 "컴파일" 및 "인스턴스화"됩니다. 일부 웹어셈블리 구현은 어느 단계에서나 중요한 작업을 수행하며, 이는 다른 스레드로 전환할 수 있는 데 중요합니다. JavaScript 모듈 시스템과 통합하려면, 최상위 `await`와 동일한 작업을 수행해야 합니다. 자세한 내용은 [웹어셈블리 ESM 통합 제안](https://github.com/webassembly/esm-integration)을 참조하십시오.

### 디슈가링으로서의 시맨틱

현재, 모듈은 import가 완료된 것으로 간주되고 모듈의 코드가 실행될 수 있기 전에, 모든 종속성이 모든 명령문을 실행하기를 기다립니다. 이 제안은 `await`를 도입할 때 이 속성을 유지합니다. 해당 실행이 비동기적으로 완료될 때까지 기다려야 하는 경우에도 종속성은 여전히 ​​끝까지 실행됩니다. 이를 생각하는 한 가지 방법은 각 모듈이 프로미스를 내보내고, 모든 import 문이 끝난 후 모듈의 나머지 부분이 오기 전에 프로미스가 모두 `await`되는 것처럼 생각하는 것입니다.

```js
import { a } from "./a.mjs";
import { b } from "./b.mjs";
import { c } from "./c.mjs";

console.log(a, b, c);
```

이것은 대략 다음과 같습니다.

```js
import { promise as aPromise, a } from "./a.mjs";
import { promise as bPromise, b } from "./b.mjs";
import { promise as cPromise, c } from "./c.mjs";

export const promise = Promise.all([aPromise, bPromise, cPromise]).then(() => {
  console.log(a, b, c);
});
```

`a.mjs`, `b.mjs` 및 `c.mjs` 모듈은 각각의 첫 번째 await까지 모두 순서대로 실행됩니다. 그런 다음 계속하기 전에 모든 항목이 재개되고 평가가 완료될 때까지 기다립니다.

### FAQ

**최상위 레벨은 풋건을 기다리고 있지 않습니까?**

이 [gist](https://gist.github.com/Rich-Harris/0b6f317657f5167663b493c722647221)를 본 적이 있다면 이전에 이 비판을 들어본 적이 있을 것입니다.

주요 우려 사항에 대한 답변은 다음과 같습니다.

**최상위 `await`로 인해 개발자가 코드 블록을 예상보다 더 길게 만들까요?**

최상위 `await`가 개발자에게 코드를 기다리게 하는 새로운 도구를 제공한다는 것은 사실입니다. 우리의 희망은 적절한 개발자 교육을 통해 최상위 `await`의 의미를 잘 이해하여, 사람들이 import되는 모듈을 블록시킬 때 이를 사용하는 방법을 알 수 있도록 하는 것입니다.

과거에 이러한 접근 방식이 잘 동작한 사례들을 볼 수 있었습니다. 예를 들어, async/await를 사용하여 병렬로 처리될 수 있는 두 가지 작업을 직렬화하는 코드를 쉽게 작성할 수 있지만, 의도적인 개발자 교육 노력으로 이러한 위험을 방지하기 위해 `Promise.all` 사용이 대중화되었습니다.

**최상위 `await`는 개발자가 `import()`를 불필요하게 사용하도록 장려하여 최적화 가능성이 떨어집니까?**

많은 JavaScript 개발자는 특히 코드 분할을 위한 도구로 `import()`에 대해 배우고 있습니다. 사람들은 번들링과 여러 요청 사이의 관계를 인식하고 좋은 애플리케이션 성능을 위해 이들을 결합하는 방법을 배우고 있습니다. 최상위 `await`는 실제 계산 방식을 크게 변경하지 않습니다. 최상위 `await`에서 `import()`를 사용하면 함수에서 사용하는 것과 유사한 성능 효과가 있습니다. 최상위 `await`의 교육 자료와 해당 성능 트레이드오프에 대한 기존 지식을 통합하여, `import()`를 비생산적으로 남용하는 것을 피하기 바랍니다.

**최상위 `await`에 의해 정확히 차단되는 것은 무엇입니까?**

한 모듈이 다른 모듈을 가져올 때, 가져오는 모듈은 종속성의 본문이 실행을 완료한 후에만 모듈 본문 실행을 시작합니다. 종속성이 최상위 `await`에 도달하면 가져오기 모듈의 본문이 실행을 시작하기 전에 완료되어야 합니다.

**최상위 `await`가 인접 모듈 가져오기를 차단하지 않는 이유는 무엇입니까?**

모듈 본문이 실행되기 전에 다른 모듈이 최상위 `await` 문을 완료하기를 기다리기 위해, 한 모듈이 다른 모듈에 종속되어 있다고 선언하려는 경우, 다른 모듈을 가져오기로 선언할 수 있습니다.

다음과 같은 경우, 프린트 된 순서는 "X1", "Y", "X2"입니다. 왜냐하면 한 모듈을 다른 모듈 "앞에" 가져오는 것은 암시적 종속성을 생성하지 않기 때문입니다.

```js
// x.mjs
console.log("X1");
await new Promise((r) => setTimeout(r, 1000));
console.log("X2");
```

```js
// y.mjs
console.log("Y");
```

```js
// z.mjs
import "./x.mjs";
import "./y.mjs";
```

병렬 처리 가능성을 높이려면 종속성을 명시적으로 언급해야 합니다. 최상위 `await`로 인해 차단되는 대부분의 설정 작업(예: 위의 모든 사례 연구)은 다른 설정 작업과 병렬로 수행할 수 있습니다. 관련 없는 모듈에, 이 작업 중 일부가 고도로 병렬화될 수 있는 경우(예: 네트워크 가져오기) 가능한 한 실행 시작에 가깝게 대기 중인 작업을 최대한 많이 확보하는 것이 중요합니다.

**코드 실행 순서에 대해 보장되는 것은 무엇입니까?**

모듈은 실행을 시작할 때 ES2015에서와 동일한 순서를 유지합니다. 모듈이 await에 도달하면 제어권을 양보하고 다른 모듈이 잘 지정된 동일한 순서로 초기화되도록 합니다.

구체적으로 말하자면, 최상위 `await` 사용 여부에 관계없이 모듈은 처음에 ES2015에서 설정된 동일한 트리 순회에서 실행되기 시작합니다. 모듈 본문의 실행은 import 문에 도달하는 순서대로 가장 깊은 가져오기부터 시작합니다. 최상위 `await`에 도달하면 이 순회 순서로 다음 모듈을 시작하거나 비동기적으로 예약된 다른 코드로 제어가 전달됩니다.

**이러한 보증이 폴리필의 요구 사항을 충족합니까?**

현재(최상위 `await`가 없는 세계에서) 폴리필은 동기식입니다. 따라서 전역 객체를 수정하는 polyfill을 가져온 다음 polyfill의 영향을 받는 모듈을 가져오는 관용구는 최상위 `await`가 추가된 경우에도 계속 작동합니다. 그러나 폴리필에 최상위 `await`가 포함된 경우 안정적으로 적용하려면 폴리필에 의존하는 모듈에서 가져와야 합니다.

**가져온 모듈 중 최상위 `await`가 없는 경우에도 Promise.all이 발생합니까?**

모듈의 실행이 결정적으로 동기화된 경우(즉, 모듈과 해당 종속성이 각각 최상위 `await`를 포함하지 않는 경우) 해당 모듈에 대한 `Promise.all` 항목이 없습니다. 이 경우 동기식으로 실행됩니다.

이러한 의미 체계는 ES 모듈의 현재 동작을 유지합니다. 여기서 최상위 `await`가 사용되지 않을 때 평가 단계는 완전히 동기식입니다. 의미 체계는 다른 곳에서 프로미스를 사용하는 것과 약간 대조됩니다. 구체적인 예와 추가 논의는 [이슈 #43](https://github.com/tc39/proposal-top-level-await/issues/43) 및 [이슈 #47](https://github.com/tc39/proposal-top-level-await/issues/47)을 참조하십시오.

**종속성은 정확히 어떻게 대기합니까? `Promise.all`을 실제로 사용합니까?**

최상위 `await`가 없는 모듈의 의미 체계는 동기식입니다. 즉, 종속 항목이 실행된 직후 모듈이 실행되면서 전체 트리가 사후 순서로 실행됩니다. 동일한 의미 체계가 최상위 `await`가 있는 모듈에 적용됩니다. 최상위 `await`를 포함하는 모듈이 실행되면 종속 모듈이 모두 실행된 종속 모듈의 동기 실행을 트리거합니다. 모듈에 최상위 `await`가 포함되어 있으면 `await`에 동적으로 도달하지 않더라도 전체 모듈이 마치 큰 비동기 함수인 것처럼 "비동기"로 처리됩니다. 따라서 완료되었을 때 실행되는 모든 것은 프로미스 반응에 있습니다. 그러나 거기에서 종속된 여러 모듈이 있고 여기에 최상위 `await`가 포함되어 있지 않으면 서로 프로미스 작업 없이 동기적으로 실행됩니다.

**최상위 `await`가 교착 상태의 위험을 증가시키나요?**

최상위 `await`는 교착 상태에 대한 새로운 메커니즘을 생성하지만 이 제안의 챔피언은 다음과 같은 이유로 위험을 감수할 가치가 있다고 생각합니다.

- 모듈이 교착 상태를 만들거나 진행을 중단할 수 있는 기존 방법이 많이 있으며 개발자 도구는 이를 디버깅하는 데 도움이 될 수 있습니다.
- 고려되는 모든 결정적 교착 상태 방지 전략은 지나치게 광범위하며 적절하고 현실적이며 유용한 패턴을 차단합니다.

**진행을 차단하는 기존 방법**
무한 루프

```js
for (const n of primes()) {
  console.log(`${n} is prime}`);
}
```

무한 시리즈 또는 기본 조건의 부족은 정적 제어 구조가 무한 루프에 취약함을 의미합니다.

무한 재귀

```js
const fibb = (n) => (n ? fibb(n - 1) : 1);
fibb(Infinity);
```

적절한 꼬리 호출을 사용하면 재귀가 스택 오버플로를 방지할 수 있습니다. 이것은 무한 재귀에 취약합니다.
Atomics.wait

```js
Atomics.wait(shared_array_buffer, 0, 0);
```

Atomics는 절대 변경되지 않는 인덱스를 대기하여 앞으로 진행을 차단할 수 있습니다.

export function then

```js
// a
export function then(f, r) {}
```

```js
async function start() {
  const a = await import("a");
  console.log(a);
}
```

then 함수를 내보내면 import()를 차단할 수 있습니다.

결론: 지속적인 발전을 보장하는 것이 더 큰 문제

**거부된 교착 상태 방지 메커니즘**

최상위 수준 대기를 설계할 때 해결해야 할 잠재적인 문제 공간은 발생할 수 있는 교착 상태를 감지하고 방지하는 데 도움이 되는 것입니다. 예를 들어 주기적 동적 가져오기를 기다리면 모듈 그래프 실행에 교착 상태가 발생할 수 있습니다.

교착 상태 방지에 대한 다음 섹션은 이 코드 예제를 기반으로 합니다.

```js
// file.html
<script type=module src="a.mjs"></script>

// a.mjs
await import("./b.mjs");

// b.mjs
await import("./a.mjs");
```

대안: 부분적으로 채워진 모듈 레코드 반환

b.mjs에서는 a.mjs가 아직 완료되지 않았더라도 교착 상태를 피하기 위해 Promise를 즉시 해결합니다.

대안: 진행 중인 모듈 사용 시 예외 발생

b.mjs에서 모듈이 아직 완료되지 않았기 때문에 a.mjs를 가져올 때 Promise를 거부하여 교착 상태를 방지합니다.

사례 연구: 모듈 import() 경쟁
여러 코드 조각이 동일한 모듈을 동적으로 가져오기를 원할 수 있다는 점을 고려할 때 이러한 전략은 모두 실패합니다. 이러한 다중 가져오기는 일반적으로 걱정할 만한 경쟁이나 교착 상태가 아닙니다. 그러나 위의 메커니즘 중 어느 것도 상황을 잘 처리하지 못합니다. 하나는 Promise를 거부하고 다른 하나는 가져온 모듈이 초기화될 때까지 기다리지 못합니다.

결론: 교착 상태 회피를 위한 실행 가능한 전략 없음

**최상위 레벨이 트랜스파일러에서 작업을 기다립니까?**

널리 배포된 CommonJS(CJS) 모듈 시스템은 최상위 `await`를 직접 지원하지 않으므로 이를 대상으로 하는 변환 전략은 조정이 필요합니다. 그러나 이 컨텍스트 내에서 트랜스파일러 작성자를 포함하여 여러 JavaScript 모듈 시스템 작성자의 피드백과 경험을 기반으로 최상위 `await`의 시맨틱을 몇 가지 조정했습니다. 이 제안은 그러한 맥락에서 실행 가능한 것을 목표로 합니다.

**이 제안이 없으면 모듈 그래프 실행은 동기식입니다. 이 제안은 그러한 로딩이 동기식이라는 개발자의 기대치를 유지합니까?**

모듈에 최상위 `await`가 포함되어 있으면(해당 await에 동적으로 도달하지 않더라도) 이는 동기적이지 않으며 최소한 Promise 작업 대기열을 통해 한 번 이동합니다. 그러나 최상위 `await`를 사용하지 않는 모듈 하위 그래프는 이 제안이 없는 것과 정확히 동일한 방식으로 동기적으로 계속 실행됩니다. 그리고 최상위 `await`를 사용하지 않는 여러 모듈이 이를 사용하는 모듈에 의존하는 경우 비동기 모듈이 준비되면 해당 모듈이 모두 실행되며 다른 작업(Promise 작업 대기열/마이크로태스크 대기열, 호스트의 이벤트 루프 등). 사용된 로직에 대한 자세한 내용은 [#74](https://github.com/tc39/proposal-top-level-await/pull/74)를 참조하십시오.

**모듈 로드에 모듈 사이의 마이크로태스크 체크포인트가 포함되어야 합니까, 아니면 모듈 로드 후 이벤트 루프에 양보해야 합니까?**
아마도요! 이러한 모듈 로딩 질문은 로딩 성능에 대한 흥미로운 연구 영역의 일부일 뿐만 아니라 마이크로태스크 체크포인트를 둘러싼 불변성에 대한 흥미로운 토론입니다. 이 제안은 이러한 질문에 대한 의견을 취하지 않고 별도의 제안에 대한 비동기 동작을 남겨 둡니다. 호스트 환경은 이러한 작업을 수행하는 방식으로 모듈을 래핑할 수 있으며 최상위 `await` 사양 기계를 사용하여 작업을 조정할 수 있습니다. TC39 또는 호스트 환경의 향후 제안은 추가적인 마이크로태스크 체크포인트를 추가할 수 있습니다. 관련된 논의는 [whatwg/html#4400](https://github.com/whatwg/html/issues/4400)을 참조하십시오.

**최상위 `await`가 웹 페이지에서 작동합니까?**
예. HTML 사양으로의 통합에 대한 자세한 내용은 [whatwg/html#4352](https://github.com/whatwg/html/pull/4352)에서 제안됩니다.

## 역사

[async / await 제안](https://github.com/tc39/ecmascript-asyncawait)은 원래 [2014년 1월](https://github.com/tc39/notes/blob/main/meetings/2014-01/jan-30.md#asyncawait)에 위원회에 제출되었습니다. [2014년 4월](https://github.com/tc39/notes/blob/main/meetings/2014-04/apr-10.md#preview-of-asnycawait)에 await 키워드가 최상위 `await` 목적을 위해 모듈 목표에 예약되어야 한다고 논의되었습니다. [2015년 7월()에 async/await 제안](https://github.com/tc39/proposal-async-await)은 2단계로 진행되었습니다. 이 회의에서 최상위 `await`는 "로더와 협력하여 설계"되어야 하므로 현재 제안을 차단하지 않도록 최상위 `await`에 투자하기로 결정했습니다.

최상위 `await` 표준화를 연기하기로 한 결정 이후, 주로 언어에서 가능한 상태로 유지되도록 하기 위해 소수의 위원회 토론에서 제기되었습니다.

2018년 5월, 이 제안은 TC39 프로세스의 2단계에 도달했으며 많은 디자인 결정(특히 "형제" 실행을 차단할지 여부)이 2단계에서 논의될 여지가 남아 있습니다.

## 명세

- [Ecmarkup source](https://github.com/tc39/proposal-top-level-await/blob/HEAD/spec.html)
- [HTML version](https://tc39.es/proposal-top-level-await/)

## 구현

- [V8 v8.9](https://v8.dev/blog/v8-release-89)
- SpiderMonkey via [javascript.options.experimental.top_level_await flag](https://bugzilla.mozilla.org/show_bug.cgi?id=1519100)
- [JavaScriptCore](https://bugs.webkit.org/show_bug.cgi?id=202484)
- [webpack 5.0.0](https://webpack.js.org/blog/2020-10-10-webpack-5-release/)

## 참고

- https://github.com/bmeck/top-level-await-talking/
- https://gist.github.com/Rich-Harris/0b6f317657f5167663b493c722647221
