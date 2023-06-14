# 목차
1. **[Optional catch binding(Optional-catch-binding)](#Optional-catch-binding)**


## Optional catch binding
### 목표
- 개발자가 사용하지 않는 바인딩을 만들지 않고 try/catch를 사용할 수 있도록 허용하는 것 입니다.

### CatchParameter
try 문은 런타임 오류 또는 throw 문과 같은 예외 조건이 발생할 수 있는 코드 블록을 포함합니다. catch 절은 예외 처리 코드를 제공합니다. catch 절이 예외를 catch하면 해당 CatchParameter가 해당 예외에 바인딩됩니다.


```js
const parseRecords = (maybeJSON) => {
    try {
        return JSON.parse(maybeJSON)
    } catch(e) {
        throw new Error('unable to parse' + maybeJSON)
    }
}

```
위 예제에서는 catch 바인딩을 하였으나 CatchParameter를 사용하지는 않습니다. e는 항상 catch 문언의 본문에 사용되어야 한다는 가정하에, Optional catch 바인딩의 존재 여부를 둘러싼 논의가 있었습니다. 그 결과 ES2019 부터는 CatchParameter를 사용하지 않을 경우 생략해서 작성할 수 있게 되었습니다.
