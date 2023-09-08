# JavaScript의 클래스 필드 선언

Daniel Ehrenberg, Jeff Morrison

[단계 4](https://tc39.es/process-document/)

## 안내를 위한 예제: 클래스의 커스텀 요소  

클릭하였을 때 증가하는 카운터 위젯을 정의하기 위해서 ES2015에서는 아래와 같이 정의할 수 있습니다.

```js
class Counter extends HTMLElement {
  clicked() {
    this.x++;
    window.requestAnimationFrame(this.render.bind(this));
  }

  constructor() {
    super();
    this.onclick = this.clicked.bind(this);
    this.x = 0;
  }

  connectedCallback() { this.render(); }

  render() {
    this.textContent = this.x.toString();
  }
}
window.customElements.define('num-counter', Counter);
```

## 필드 선언

the ESnext 필드 선언 제안서에서는, 위의 예제를 아래와 같이 작성할 수 있습니다.

```js
class Counter extends HTMLElement {
  x = 0;

  clicked() {
    this.x++;
    window.requestAnimationFrame(this.render.bind(this));
  }

  constructor() {
    super();
    this.onclick = this.clicked.bind(this);
  }

  connectedCallback() { this.render(); }

  render() {
    this.textContent = this.x.toString();
  }
}
window.customElements.define('num-counter', Counter);
```

위의 예제에서처럼, `x = 0`의 문법으로 필드 선언을 한 것을 볼 수 있습니다. 또한 `x`의 초기화 없이 필드를 선언할 수 있습니다. 상위의 필드 선언을 통해서 클래스 선언문은 더 구체적인 의미를 가집니다. 선언된 필드가 항상 존재하기 때문에 인스턴스의 상태 변경이 줄어듭니다.

## 프라이빗 속성

상위의 예제는 내부적으로 유지하는 것이 좋은 상세한 구현을 외부로 노출하고 있습니다. ESnext의 프라이빗 속성과 메서드들을 통해서 재정의 할 수 있습니다.

```js
class Counter extends HTMLElement {
  #x = 0;

  clicked() {
    this.#x++;
    window.requestAnimationFrame(this.render.bind(this));
  }

  constructor() {
    super();
    this.onclick = this.clicked.bind(this);
  }

  connectedCallback() { this.render(); }

  render() {
    this.textContent = this.#x.toString();
  }
}
window.customElements.define('num-counter', Counter);
```

속성을 프라이빗으로 만들기 위해서는 속성명을 `#`으로 시작하도록 선언합니다.

이러한 속성들을 클래스의 외부에서는 보이지 않도록 정의함으로써, ESnext는 클래스의 사용자가 실수로 내부적인 버전 변경을 하지 않도록 엄격한 캡슐화를 제공합니다.  

ESnext는 프라이빗 속성을 위의 필드 선언 방식으로만 제공합니다. 프라이빗 속성은 일반 속성과 달리 나중에 임의로 할당하여 생성할 수 없습니다. 

## 주요 설계 중점 사항들 

### Object.defineProperty를 통한 퍼블릭 필드 선언

퍼블릭 필드 선언문은 `this.field = value;` (`[[Set]]`문법)가 아닌 인스턴스 내부의 `Object.defineProperty`(TC39 회의에서 언급된 `[[Define]]` 문법)를 통해서 인스턴스에 필드를 선언합니다. 아래는 이러한 영향의 예제입니다.

```js
class A {
  set x(value) { console.log(value); }
}
class B extends A {
  x = 1;
}
```

채택된 문법에 따르면, `new B()`는  콘솔에 어떤 것도 출력되지 않고, `1`의 값을 가진 `x` 속성을 가진 객체가 반환됩니다. `[[Set]]` 문법을 사용하면 `1`이 콘솔에 출력되며, 속성에 접근하려고 하면 `TypeError`를 발생시킬 것입니다.(getter가 존재하지 않기 때문).

`[[Set]]`와 `[[Define]]` 중에 선택하는 것은 대조적인 종류의 기댓값에 대한 설계상의 결정입니다. 상위 클래스가 가진 것과 관련없이 데이터 속성으로서 필드가 선언되는 것과 setter가 호출되는 것 간의 차이입니다. 아래의 긴 논의 끝에 TC39는 첫번째 예상값을 보존하는 것이 중요하다고 판단함에 따라 `[[Define]]` 문법을 사용하는 것으로 결정하였습니다.      

퍼블릭 필드를 `Object.defineProperty` 문법을 사용하기로한 결정은 TC39의 광범위한 논의와 개발자 커뮤니티에서의 상담을 기반하여 이루어졌습니다. TC39는 `Object.defineProperty`으로 강하게 의결되었으나, 안타깝게도 [커뮤니티는 분열되었습니다](https://github.com/tc39/proposal-class-fields/issues/151#issuecomment-431597270). 

마이그레이션을 위하여 [decorators 제안서](https://github.com/tc39/proposal-decorators/)는 `[[Set]]` 문법을 사용하여 퍼블릭 필드 선언을 하기 위한 decorator 작성법을 제공합니다. 표준에 대하여 동의하지 않더라도 다른 방식은 사용 가능합니다. (이것이 TC39가 채택한 정의와 무관하게 더 적합할 수 있습니다.)

퍼블릭 필드는 Chrome 72에서 `[[Define]]` 문법을 통해 [제공됩니다](https://www.chromestatus.com/feature/6001727933251584). 그리고 이 문법에 대한 결정은 재검토되지 않을 것 같습니다.

### 초기화 되지 않은 필드가 `undefined`로 할당되는 것.

퍼블릭 필드와 프라이빗 필드 모두 인스턴스 내에 속성으로 선언될 때, 초기화가 존재할 수도, 존재하지 않을 수도 있습니다. 초기화가 존재하지 않는다면, 해당 필드는 `undefined`로 할당됩니다. 이것은 초기화가 존재하지 않는 필드 선언을 완전히 무시하는 특정 트랜스파일러 구현과 조금 다릅니다. 

예를 들어, 아래의 예제에서 `new D`의 결과는 `1`이 아닌 `undefined`의 값을 가진 `y`속성을 가진 객체일 수 있습니다.
```js
class C {
  y = 1;
}
class D extends C {
  y;
}
```

초기화가 존재하지 않는 필드를 제거하지 않고 `undefined`로 할당하는 문법은 필드 선언이 생성된 객체에 속성이 존재하는지 확인하는 작업에 대해서 신뢰성을 제공합니다. 이것은 프로그래머가 해당 객체를 동일한 일반적인 상태로 유지할 수 있도록 도와줌으로써, 구현에 대해 더 쉽게 이해할 수 있고 최적화할 수 있도록 합니다.

### 프라이빗 문법

프라이빗 필드는 해당 필드를 접근하거나 선언할 때, `#`를 사용하는 문법을 기반으로 합니다.

```js
class X {
  #foo;
  method() {
    console.log(this.#foo)
  }
}
```

이 문법은 다른 프로그래밍 언어와는 조금 다름에도 불구하고 간결하면서도 직관적입니다. 이러한 문법으로 결정하기 위한 제약 조건과 고려된 대안들에 대한 논의는 [프라이빗 문법 FAQ](https://github.com/tc39/proposal-class-fields/blob/master/PRIVATE_SYNTAX_FAQ.md) 를 확인하세요. 

프라이빗 내장 속성명은 존재하지 않습니다. `#foo`는 프라이빗 구분자이지만, `#[foo]`는 구문 오류입니다.

### 프라이빗을 접근하기 위한 백도어는 존재하지 않습니다.

프라이빗 필드는 매우 강력한 캡슐화 제한을 제공합니다. getter를 제공하는 겻과 마찬가지로 코드가 노출되는 것과는 달리, 클래스의 외부에서는 프라이빗 필드에 접근하는 것이 불가능합니다. 이는 다양한 종류의 reflection과 metaprogramming을 지원하는 JavaScript의 속성과는 다르지만, 오히려 내부 구현에 대한 접근을 제공하지 않는 클로저나 `WeakMap`과는 매커니즘이 유사합니다. 이러한 결정에 대한 더 많은 정보는 [FAQ 항목](https://github.com/tc39/proposal-class-fields/blob/master/PRIVATE_SYNTAX_FAQ.md#why-doesnt-this-proposal-allow-some-mechanism-for-reflecting-on--accessing-private-fields-from-outside-the-class-which-declares-them-eg-for-testing-dont-other-languages-normally-allow-that) 을 참고하세요. 

접근을 편리하게 만드는 마이그레이션
- 구현체의 개발자 도구는 프라이빗 필드에 대한 접근을 제공할 수도 있습니다.([V8 issue](https://bugs.chromium.org/p/v8/issues/detail?id=8337))
- [decorators 제안서](https://github.com/tc39/proposal-decorators/) 는 손쉬운 사용과 프라이빗 필드에 대한 접근을 위한 도구를 제공합니다.

### 초기화 표현식에 대한 실행

퍼블릭 필드와 프라이빗 필드는 생성자가 실행되는 시점에 각각 그들의 선언문의 순서대로 인스턴스 내부에 추가됩니다. 초기화는 각 클래스 인스턴스마다 새롭게 평가됩니다. 필드는 초기화가 실행된 직후, 다음 초기화가 평가되기 직전에 인스턴스에 추가됩니다.

**스코프**:  생성되는 인스턴스가 생성자 표현식 내부의 `this`로 바인딩 됩니다. 메서드 내부에서의 `new.target`는 할당되지 않습니다. `arguments`에 대한 참조는 초기 오류입니다. 상위 메서드인 `super.method()`는 초기화 내에서는 사용 가능 합니다. 하지만 상위 생성자인 `super()`를 호출하는 것은 문법 오류입니다. 클래스 내에서 async 함수/generator가 사용가능 하더라도 초기화 내에서는 `await`와 `yield`의 사용이 불가능합니다.  

필드 초기화가 평가되고 인스턴스 내에 필드가 추가되는 경우는 다음과 같습니다.
- **기본 클래스**: 파라미터 파괴 이전, 생성자의 실행 시작 시점.
- **하위 클래스**: `super()`의 반환된 직후. (`super()` 호출 방법의 유연성으로 인해 많은 구현들이 별도의 보이지 않는 `initialize()` 메서드를 만들었습니다.)

하위 클래스에서 `super()`가 호출되지 않는 경우, 일부의 퍼블릭 및 프라이빗 필드가 인스턴스 내에 추가되지 않으며 초기화가 평가되지 않습니다. 기본 클래스에서는 생성자가 다른 것을 반환하더라도 초기화가 항상 평가됩니다. [`new.initialize`](https://github.com/littledan/proposal-new-initialize) 제안서는 기본 클래스의 `super`/`this`로 제공되지 않는 인스턴스의 필드를 프로그래밍 방식으로 추가하는 방법을 제시합니다. 

## 명세서

자세한 사항은 [draft 명세서](https://tc39.github.io/proposal-class-fields/) 를 참고하세요.

## 상태

### TC39 합의

이 제안서는 2017년 7월에 [단계 3](https://tc39.github.io/process-document/)에 도달하였습니다. 이 당시에 아래와 같은 다양한 대안에 대한 긴 논의와 광범위한 의견이 존재하였습니다.
- [JS Classes 1.1](https://github.com/zenparsing/js-classes-1.1)
- [Reconsideration of "static private"](https://github.com/tc39/proposal-static-class-features)
- [Additional use of the `private` keyword](https://gist.github.com/rauschma/a4729faa65b30a6fda46a5799016458a)
- [Private Symbols](https://github.com/zenparsing/proposal-private-symbols)

각 제안서를 통해서 TC39 구성원들은 언어 디자인의 미래에 대한 동기, JS 개발자 피드백 및 시사점을 깊게 조사하였습니다. 이러한 사고 과정과 지속적인 공동체 참여는 이 저장소에 대한 제안서에 대한 합의로 이루어졌습니다. 합의에 따라, 구현은 이 제안서를 통하여 진행됩니다.

### 개발 역사

이 문서는 [Orthogonal Classes](https://github.com/erights/Orthogonal-Classes) 와 [Class Evaluation Order](https://onedrive.live.com/view.aspx?resid=A7BBCE1FC8EE16DB!442046&app=PowerPoint&authkey=!AEeXmhZASk50KjA) 에서 일찍이 논의되었던 [퍼블릭 필드](https://tc39.github.io/proposal-class-public-fields/) 와 [프라이빗 필드](https://github.com/tc39/proposal-private-fields) 에 대한 결합된 버전을 제안하고 있습니다.
프라이빗 메서드와 데코레이터에 대한 상위 호환성에 대하여 작성되었고, 이 통합은 [unified class features proposal](https://github.com/littledan/proposal-decorators) 에 작성되었습니다. 메서드와 접근자에 대해서는 [a follow-on proposal](https://github.com/littledan/proposal-private-methods/) 에 정의되어 있습니다.

이 제안서는 [TC39 회의](https://github.com/tc39/ecma262/blob/master/CONTRIBUTING.md)의 발표와 논의에서 뿐만 아니라 GitHub 저장소에서도 개발되었습니다. 과거의 발표나 논의는 아래와 같습니다.

| Date           | Slides                                                                                                                                                        | Notes                                                                                                                                                         |
|----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| July 2016      | [Private State](https://docs.google.com/presentation/d/1RM_DEWAYh8PmJRt02IunIRaUNjlwprXF3yPW6NltuMA/edit#slide=id.p)                                          | [📝](https://github.com/tc39/tc39-notes/blob/master/es7/2016-07/jul-28.md#9iiib-private-state)                                                                |
| January 2017   | [Public and private class fields: Where we are and next steps](https://docs.google.com/presentation/d/1yXsRdAJO7OdxF0NmZs2N8ySSrQwKp3D77vZXbQOWbMs/edit)      | [📝](https://github.com/tc39/tc39-notes/blob/master/es7/2017-01/jan-26.md#public-and-private-class-fields-daniel-ehrenberg-jeff-morrison-and-kevin-gibbons)   |
| May 2017       | [Class Fields Integrated Proposal](https://drive.google.com/file/d/0B-TAClBGyqSxWHpyYmg2UnRHc28/view)                                                         | [📝](https://github.com/tc39/tc39-notes/blob/master/es8/2017-05/may-25.md#15iiib-updates-on-class-field-proposals-both-public-and-private)                    |
| July 2017      | [Unified Class Features: A vision of orthogonality](https://docs.google.com/presentation/d/1GZ5Rfa4T7aF7t0xJrDxRZhC49mvqG5Nm6qZ_g_qrfBY/edit#slide=id.p)      | [📝](https://github.com/tc39/tc39-notes/blob/master/es8/2017-07/jul-27.md#11ivc-class-fields-for-stage-3)                                                     |
| September 2017 | [Class fields status update](https://docs.google.com/presentation/d/169hWHIKFnX8E-N90FJQS3u5xpo5Tt-s4IFdheLySVfQ/edit#slide=id.p)                             | [📝](https://github.com/tc39/tc39-notes/blob/master/es8/2017-09/sep-26.md#12ib-class-fields-status-update)                                                    |
| November 2017  | [Class fields, static and private](https://docs.google.com/presentation/d/1wgus0BykoVk_qqCpr0TjgO0TV0Y4ql4d9iY212phzbY/edit#slide=id.g2936c02723_0_63)        | [📝](https://github.com/tc39/tc39-notes/blob/master/es8/2017-11/nov-30.md#10iva-continued-inheriting-private-static-class-elements-discussion-and-resolution) |
| November 2017  | [Class features proposals: Instance features to stage 3](https://docs.google.com/presentation/d/1wKktzSOKnVIUAnfDHgTVOlQp-O3OBtHN4dKX8--DQvc/edit#slide=id.p) | [📝](https://github.com/tc39/tc39-notes/blob/master/es8/2017-11/nov-30.md#10iva-continued-inheriting-private-static-class-elements-discussion-and-resolution) |
| November 2017  | [ASI in class field declarations](https://docs.google.com/presentation/d/1bPzE6i_Bpm6FXgzfx9XFJNHGkVcM42lux-6bUNhxpl4/edit#slide=id.p)                        | [📝](https://github.com/tc39/tc39-notes/blob/master/es8/2017-11/nov-30.md#10ivf-class-fields-asi-discussion-and-resolution)                                   |
| May 2018       | [Class fields: Stage 3 status update](https://docs.google.com/presentation/d/1oDQOS9b8wnuP5-o8zInsEO9lpRbhduawAmvfRzbxkOs/edit?usp=sharing)                   | [📝](https://github.com/tc39/tc39-notes/blob/master/es9/2018-05/may-23.md#class-fields-status-update)                                                         |
| September 2018 | [Class fields and private methods: Stage 3 update](https://docs.google.com/presentation/d/1Q9upYkWnPjJaVc8k9q3U6NekDch8tsz7CgV-Xm55-5Y/edit#slide=id.p)       | [📝](https://github.com/tc39/tc39-notes/blob/master/es9/2018-09/sept-26.md#class-fields-and-private-methods-stage-3-update)                                   |
| January 2019   | [Private fields and methods refresher](https://docs.google.com/presentation/d/1lPEfTLk_9jjjcjJcx0IAKoaq10mv1XrTZ-pgERG5YoM/edit#slide=id.p) | [📝](https://github.com/tc39/tc39-notes/blob/master/meetings/2019-01/jan-30.md#private-fields-and-methods-refresher) |

### 구현

아래의 구현을 통하여 클래스 필드의 제안서를 경험할 수 있습니다.

- Babel [7.0+](https://babeljs.io/blog/2018/08/27/7.0.0#tc39-proposals-https-githubcom-tc39-proposals-support)
- [Node 12](https://nodejs.org/en/blog/release/v12.0.0/)
- Chrome/V8
    - Public fields are [enabled](https://www.chromestatus.com/feature/6001727933251584) in Chrome 72 / V8 7.2
    - Private fields are [enabled](https://www.chromestatus.com/feature/6035156464828416) in Chrome 74 / V8 7.4
- Firefox/SpiderMonkey
    - Public instance fields are [enabled](https://wiki.developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/69#JavaScript) in Firefox 69
    - Public static fields are [enabled](https://wiki.developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/75#JavaScript) in Firefox 75
- Safari/JSC
    - Public instance fields are [enabled](https://developer.apple.com/documentation/safari-release-notes/safari-14-release-notes#JavaScript) in Safari 14
    - Public static fields are [enabled](https://webkit.org/blog/11364/release-notes-for-safari-technology-preview-117/) in Safari Technology Preview 117
    - Private fields are [enabled](https://webkit.org/blog/11364/release-notes-for-safari-technology-preview-117/) in Safari Technology Preview 117
- [Moddable XS](https://blog.moddable.com/blog/secureprivate/)
- [QuickJS](https://www.freelists.org/post/quickjs-devel/New-release,82)
- [TypeScript 3.8](https://devblogs.microsoft.com/typescript/announcing-typescript-3-8/#ecmascript-private-fields)

진행중인 구현은 다음과 같습니다.
- Firefox/SpiderMonkey: [Private instance fields](https://bugzilla.mozilla.org/show_bug.cgi?id=1562054)
- [Additional tooling support](https://github.com/tc39/proposal-class-fields/issues/57)

### 이 저장소에 대한 활동에 대한 환영

이 저장소에 issue나 PR을 등록하는 것을 환영합니다.
- 제안서, 구문이 어떻게 작동하는지, 의미론의 의미 등에 대해 질문합니다.
- 구현 및 테스트 경험과 그 과정에서 발생하는 문제에 대해 논의합니다.
- 개선된 문서, 샘플 코드 및 모든 수준의 프로그래머를 이 기능에 도입할 수 있는 기타 방법을 개발합니다.

JavaScript를 개선하는 방법이나 아이디어가 있는 경우, 어떻게 포함하는 가에 대한 ecma262의 [CONTRIBUTING.md](https://github.com/tc39/ecma262/blob/master/CONTRIBUTING.md) 를 참고하세요.