# Template Literals Revision

자세한 내용은 [제안서](https://tc39.es/proposal-template-literal-revision/)를 참조하십시오.

# 서론

템플릿 리터럴은 언어(DSL 등)를 포함할 수 있어야 합니다. 그러나 이스케이프 시퀀스에 대한 제한으로 인해 문제가 발생합니다.

예를 들어 템플릿으로 latex 처리기를 만드는 것을 고려하십시오.

```js
function latex(strings) {
  // ...
}

let document = latex`
\newcommand{\fun}{\textbf{Fun!}}  // works just fine
\newcommand{\unicode}{\textbf{Unicode!}} // Illegal token!
\newcommand{\xerxes}{\textbf{King!}} // Illegal token!

Breve over the h goes \u{h}ere // Illegal token!
`;
```

여기서 문제는 `\u`가 유니코드 이스케이프의 시작이지만, ES 문법이 강제로 `\u00FF` 또는 `\u{42}` 형식이 되도록 하고 토큰 `\unicode`를 금지된 규칙으로 간주한다는 것입니다. 마찬가지로 `\x`는 `\xFF`와 같은 16진수 이스케이프의 시작이지만 `\xerxes`는 금지된 규칙입니다. 8진수 리터럴 이스케이프에도 동일한 문제가 있습니다. `\0100`은 금지된 규칙입니다.

# 제안서 개요

이스케이프 시퀀스에 대한 제한을 제거합니다.

제한을 해제하면 금지된 이스케이프 시퀀스가 포함된 가공된 템플릿 값을 어떻게 처리할지에 대한 문제가 생깁니다. 현재, 가공된 템플릿 값은 이스케이프 시퀀스를 "이스케이프 시퀀스로 표시되는 유니코드 코드 포인트"로 대체해야 하지만 이스케이프 시퀀스가 ​​유효하지 않으면 이런 일이 발생할 수 없습니다.

제안된 해결책은 금지된 이스케이프 시퀀스가 ​​포함된 템플릿 값에 대해 가공된 값을 `undefined`로 설정하는 것입니다. 원시 값은 여전히 ​`​.raw`를 통해 접근할 수 있으므로 `undefined` 가공된 값을 포함할 수 있는 내장 DSL<sup>[1][]</sup>은 원시 문자열을 사용할 수 있습니다.

```js
function tag(strs) {
  strs[0] === undefined;
  strs.raw[0] === "\\unicode and \\u{55}";
}
tag`\unicode and \u{55}`;
```

이스케이프 시퀀스 제한의 완화는 태그가 있는 템플릿 리터럴에만 적용됩니다. 태그가 지정되지 않은 템플릿은 여전히 ​​유효하지 않은 이스케이프 시퀀스에 대한 [초기 오류](https://tc39.es/ecma262/#early-error)를 발생시킵니다.

```js
let bad = `bad escape sequence: \unicode`; // throws early error
```

[1]: #1

---

#### 1

Domain-Specific Languages
