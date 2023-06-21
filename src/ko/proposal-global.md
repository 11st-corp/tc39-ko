# [globalThis](https://www.npmjs.com/package/globalthis)

ECMAScript 제안서와 명세서, `globalThis`의 구현에 대해 담고 있습니다.

[@ljharb](https://github.com/ljharb)가 해당 명세서에 대해서 초안을 작성하였습니다.

이 제안서는 [과정](https://tc39.github.io/process-document/) 중, [4 단계](https://github.com/tc39/ecma262)에 있습니다.

## 이론적 근거
전역 객체에 접근하는 이식 가능한 ECMAScript 코드를 작성하는 것은 어렵습니다. 웹에서는  `window`, `self`, `this`나 `frames`로 접근할 수 있으며,  node.js에서는 `global`이나`this`으로 접근할 수 있습니다. 그 중에서도 `this`는 V8의 `d8`이나 JavaScriptCore의`jsc`과 같은 쉘에서만 사용이 가능합니다. 일반적으로 sloppy 모드에서 독립적인 함수 호출에서 `this`는 사용 가능하지만, 엄격 모드나, 모듈 또는 함수 내에서는 `undefined`를 가집니다. 이러한 컨텍스트에서는 전역 객체는 `Function('return this')()`를 통해서 여전히 접근이 가능합니다. 하지만 이러한 형식은  Chrome Apps 내부와 같은 몇몇의 CSP 설정에서는 접근이 불가능 합니다. 아래는 즉시 실행 함수의 단일 인자로 전달되고 있는 전역객체를 접근하는 코드입니다. 이는 대부분의 경우에는 동작하지만  엄격 모드의 함수 내부이거나 모듈 내일 경우에는 `d8`에서 동작하지 않을 수 있습니다. (`Function` 트릭을 사용해서 해결할 수 있습니다.)

```js  
function foo() { 
	// 만약 브라우저인 경우, 전역 네임스페이스는 'window'라는 이름을 가집니다. 만약 node인 경우, 이름은 'global'입니다.
	// 만약 쉘 안이라면, 'this'는 동작할 수 있습니다.
	(typeof window !== "undefined" ? window : (typeof process === 'object' && typeof require === 'function' 			&& typeof global === 'object') ? global : this);
}
```  

추가적으로, `es6-shim` 은 [CSP 논의](https://github.com/paulmillr/es6-shim/issues/301)로 인해 `Function('return this')()`에서부터 변경이 필요하였습니다. 브라우저들, node, 웹 워커들, 프레임들을 처리하기 위한 현재 [검사](https://github.com/paulmillr/es6-shim/commit/2367e0953edd01ae9a5628e1f47cf14b0377a7d6)는 아래와 같습니다.
```js  
var getGlobal = function () {  
	// 전역객체에 접근할 수 있는 방법은`Function('return this')()`하나입니다.
	// 그러나 이것은 Chrome 앱들에서는 CSP를 위반할 수 있습니다.
	if (typeof self !== 'undefined') { return self; } 
	if (typeof window !== 'undefined') { return window; } 
	if (typeof global !== 'undefined') { return global; } 
	throw new Error('unable to locate global object');};  
```  

## HTML 과  `WindowProxy`

HTML에서 전역객체는 `Window`와 `WindowProxy`로 구별됩니다. 새로운 속성은 `Window`에 선언되지만, 상위 단계인 `this`는 `WindowProxy`와 동일합니다. `WindowProxy`는 모든 객체 연산을 `Window`로 전달하지만, 페이지가 변경되면 `globalThis`는 유지되는 반면,  `Window`는 갱신됩니다.

이러한 구분은 아래의 `parent.html`, `frame-a.html`, `frame-b.html` 파일들로 구성된 시나리오에서 확인할 수 있습니다.

아래의 코드는 `frame-a.html` 입니다.
```html  
<script>  
 globalThis.foo = 'a'; 
 globalThis.getGlobalThis = () => globalThis;
 </script>  
```  

아래의 코드는 `frame-b.html`입니다.
```html  
<script>  
 globalThis.getGlobalThis = () => globalThis;
 </script>  
```  

아래의 코드는 `parent.html`’입니다.
```html  
<iframe src="frame-a.html"></iframe>  
<script>  
	 const iframe = document.querySelector('iframe'); 
	 iframe.onload = () => { 
		 // 전역변수 `foo`는 존재함. 
		 console.assert(frames[0].foo === 'a'); 
		 const before = frames[0].getGlobalThis(); 
		 iframe.onload = () => { 
			 // 전역변수 foo`는 사라짐. 
			 console.assert(frames[0].foo === undefined, 'The global object changes during navigation'); 
			 const after = frames[0].getGlobalThis(); 
			 // 하지만, `globalThis`는 여전히 동일함.
			 console.assert(before === after, 'globalThis maintains its identity during navigation'); 
		 }; 
		 iframe.src = 'frame-b.html'; 
	 };
 </script>  
```  

[이 데모](https://bead-pancake.glitch.me/)는 실제 전역객체 내에 탐색 중에 변경된 전역변수 `foo`가 저장되어있는 것을 보여줍니다. 하지만 `globalThis`는 탐색 중에 변경되지 않았습니다. 그러므로 `globalThis`는 전역객체가 아닙니다.

따라서, `globalThis`는 JavaScript에서 직접적으로 접근할 수 없는 "전역 객체"와 명백하게 다릅니다. [웹 브라우저에서는 (심지어 전역 범위에서도) `foo !== globalThis.foo`가 가능할 수도 있습니다.](https://concise-walker.glitch.me/)

ES6/ES2015는 `Window`/`WindowProxy` 구조를 설명하지 않으며, 단순히 "전역객체"라고 말하고 있습니다. 이 명세는 동일합니다. 만약 ECMAScript에서 top-level `this`가 `WindowProxy`로 설명되도록 명세가 변경된다면, 이러한 변경점은 해당 제안서에도 동일하게 반영되어야 합니다.

## SES interaction

For Secure ECMAScript, it is important that all references to the global object be spoof-able and capable of being locked down, so that each context gets its own shadow global context. Additionally, references to the global object should not be reachable from other ECMAScript intrinsic objects, which SES would like to simply recursively freeze. In this proposal, `globalThis` is a writable and configurable property of the global object, so it should meet SES requirements.

Secure ECMAScript에서는 전역객체에 대한 모든 참조가 스푸닝 가능하며, 잠길 수 있기 때문에 각 컨테스트가 숨겨진 전역 컨텍스트를 가질 수 있도록 하는 것이 중요합니다. 추가적으로, 전역객체에 대한 참조는 SES가 단순히 재귀적으로 동결하기를 원하는 다른 ECMAScript의 독립된 객체들에서 접근이 불가능해야합니다. 이 제안서에서 `globalThis`는 전역 객체의 쓰기 및 수정 가능한 속성입니다. 그러므로 이 것은 SES의 요구사항을 만족합니다.


## 네이밍

~~`System.global` 대신 기존 글로벌 속성 이름, 특히 `global` 또는 `window` 중 하나를 다시 정의하고자 하였습니다. 이 두 가지 중 하나가 런타임 환경 탐지를 수행하는 기존 코드를 중단하는지에 대한 추가 연구가 수행될 것입니다. 추가 연구를 통해 `global`을 사용해도 기존 코드가 깨지지 않을 것으로 확인되었습니다.~~
`global`이라는 이름을 사용하려고 하였으나, 몇몇 웹사이트를 손상시키는 것으로 나타났습니다.

데이터를 수집하여 몇몇 후보들의 웹 호환성을 확인한 후, 우리는 웹 호환성을 만족하면서 "전역 `this` 값"에 대한 개념에 대응되는 `globalThis`로 결정하였습니다. (그러면서도 [위의 개념](https://github.com/tc39/proposal-global#html-and-the-windowproxy)에 따라 “전역객체" 아닌).

대체안들의 상세한 목록을 보기 위해서는 [NAMING.md](NAMING.md)을 확인하세요.

## 명세서
명세서를 [markdown format](spec.md) 또는 [HTML](http://tc39.github.io/proposal-global/)형식으로 볼 수 있습니다.

## 감사
최초로 영감을 주신 분은 https://twitter.com/littledan/status/627284720284372992 / http://littledan.github.io/global.html 입니다.
