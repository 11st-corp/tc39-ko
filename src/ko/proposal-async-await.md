# Async Functions for ECMAScript

ECMAScript에 Promise 및 Generators의 도입은 ECMAScript에서 비동기 코드를 작성하기 위한 언어 수준 모델을 획기적으로 개선할 수 있는 기회를 제공합니다. 이 명세는 [여기](https://tc39.es/proposal-async-await/)에서 확인할 수 있습니다.

본 제안은 `async`와 `await`를 포함한 ES5 코드를 컴파일하고 기존 브라우저와 런타임에서 실행될 바닐라 ES5 까지 기다릴 수 있는 [regenerator](https://github.com/facebook/regenerator)에서 구현됩니다.


이 저장소는 제안의 많은 기능들을 사용한 완전한 예제가 포함되어 있습니다. 이 예시를 실행하려면:
```sh
npm install
regenerator -r server.asyncawait.js | node
```