# 목차

1. **[ES2015과의 차이점](#ES2015과의-차이점)**

---

Specification: ES2018

## 태그 템플릿 (tagged templates)

태그 템플릿은 ES2015에 추가되었습니다. 태그가 있는 템플릿에서 템플릿 리터럴은 인수로 함수에 전달되며, 그러면 리터럴을 처리하고 수정된 문자열을 반환할 수 있습니다.

```js
function tag(strings, ...values) {
  console.log(strings); // outputs [ 'Hello, ', '! ', '' ]
  console.log(values); // outputs [ 'world', 123 ]
  return "Goodbye!";
}

const message = tag`Hello, ${"world"}! ${123}`;
console.log(message); // outputs 'Goodbye!'
```

## Static Semantics: Early Errors

ES2018에서는 런타임 전에 확인해야 하는 일련의 규칙인 초기 오류를 포함하도록 템플릿 리터럴 사양이 업데이트되었습니다.

템플릿 리터럴에 대한 ES2018 사양에 추가된 초기 오류는 템플릿 리터럴을 사용할 때 발생할 수 있는 잠재적인 오류를 방지하도록 설계되었습니다. 초기 오류는 코드 실행의 구문 분석 단계에서 확인되며 규칙을 위반하는 경우 코드가 실행되지 않도록 합니다.

### '\x'

```js
'\x' // Uncaught SyntaxError: Invalid hexadecimal escape sequence
```

### '\u'

```js
'\u' // Uncaught SyntaxError: Invalid Unicode escape sequence
```
