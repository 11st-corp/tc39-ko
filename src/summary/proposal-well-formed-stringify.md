# 목차

1. **[유니코드란?](#유니코드란?)**
2. **[UTF](#UTF)**
3. **[JSON 단일 문자 이스케이프 시퀀스](#JSON-단일-문자-이스케이프-시퀀스)**
3. **[RFC 8259 section 8.1](#RFC-8259-section-8.1)**
4. **[JSON.stringify 명세](#JSON.stringify-명세)**
5. **[JSON 직렬화 레코드](#JSON-직렬화-레코드)**

# 유니코드란?
- 유니코드는 컴퓨터와 사람이 대화하기 위한 중개자 역할을 합니다. 유니코드는 사람이 사용하는 모든 언어를 bit로 표현된 숫자로 매핑 해놓고, 모든 문자에 Index를 지정합니다. 참고로 이때 Index를 Code Point 혹은 Code Unit라 부르기도 합니다.
```
'A' - 0x0041이라는 Index
'a' - 0x0061이라는 Index
'가' - 0xac00이라는 Index
```
더 많은 글자와 Index를 보려면 [Code Charts](http://www.unicode.org/charts/)를 참고하세요.

## UTF
- Univercsal Coded Character Set Transformation Format - N - bit, Unicode Transformation format
- UTF-8과 UTF-16은 유니코드를 표현하는 인코딩 방식입니다. 유니코드에서 한글은 UTF-8 가변 인코딩 방식을 따릅니다. 
- UTF-8에서 3바이트로 표현되는 문자들이 UTF-16에서는 2바이트로 표현되므로 메모리를 줄일 수 있습니다. 

# JSON 단일 문자 이스케이프 시퀀스
 이스케이프 시퀀스(escape sequence)를 조합하면 특수문자를 문자열에 넣을 수 있습니다. 이스케이프 시퀀스(escape sequence) 다음과 같습니다.
| 코드 포인트 | 유니코드 문자 이름 | 이스케이프 시퀀스 |
| --- | --- | --- |
| U+0008 | 백 스페이스 | \b |
| U+0009 | 탭(tab) | \t |
| U+000A | 개행 문자(LF) | \n |
| U+000C | 폼 피드 (FF) | \f |
| U+0022 | 쌍 따옴표| \"|
| U+000D | 역 슬래시 | \\ |

이외도 16진수 네자리로 표현된 유니코드 문자를 표현한 `\uHHHH`, 슬래시를 표현한 `\/` 등이 있습니다.

# RFC 8259 section 8.1
[RFC 8259 section 8.1 바로가기](https://datatracker.ietf.org/doc/html/rfc8259#section-8.1)

폐쇄형 생태계의 일부가 아닌 시스템 간에 교환되는 JSON 텍스트는 [UTF-8](https://datatracker.ietf.org/doc/html/rfc3629)을 사용하여 인코딩되어야 합니다.

JSON의 이전 사양에서는 JSON 텍스트를 전송할 때 UTF-8을 사용할 필요가 없었습니다. 그러나 대부분의 JSON 기반 소프트웨어 구현체는 UTF-8 인코딩을 사용하기로 결정했으며, 그 이유는 UTF-8 인코딩이 상호 운용성을 달성하는 유일한 인코딩이기 때문입니다.

구현 시 네트워크로 전송되는 JSON 텍스트의 시작 부분에 바이트 순서 표시(U+FEFF)를 추가하면 안 됩니다. 상호 운용성을 위해 JSON 텍스트를 구문 분석하는 구현은 바이트 순서 표시의 존재를 오류로 처리하기보다는 무시할 수 있습니다.

# JSON.stringify 명세 
[JSON.stringify 명세 바로가기](https://tc39.es/ecma262/#sec-json.stringify)

## JSON.stringify ( value [ , replacer [ , space ] ] )
이 함수는 [ECMAScript 언어 값](https://tc39.es/ecma262/#sec-ecmascript-language-types), 또는 undefined을 나타내는 UTF-16 인코딩 JSON 형식의 문자열을 반환합니다. 세 가지 매개변수를 사용할 수 있습니다. `value` 매개변수는 ECMAScript 언어 값이며 일반적으로 객체 또는 배열이지만 String, Boolean, Number 또는 null일 수도 있습니다. 

선택적 `replacer` 매개변수는 객체 및 배열이 문자열화되는 방식을 변경하는 함수이거나 문자열화될 객체 속성을 선택하기 위한 포함 목록 역할을 하는 문자열 및 숫자 배열입니다. 

선택적 `space` 매개변수는 사람의 가독성을 향상시키기 위해 결과에 공백을 삽입할 수 있는 String 또는 Number입니다.

## JSON.stringify 관련 개념

1. JSON 구조는 모든 깊이에 중첩될 수 있지만 비순환적이어야 합니다. 값이 순환 구조이거나 순환 구조를 포함하는 경우 이 함수는 TypeError 예외를 발생시켜야 합니다. 다음은 문자열화할 수 없는 값의 예입니다.

```js
a = [];
a[0] = a;
my_text = JSON.stringify(a); // 이것은 반드시 a TypeError을 발생시켜야 한다.
```

2. 심볼 원시값은 다음과 같이 렌더링됩니다.

- null 값은 JSON 텍스트에서 문자열 값 "null"로 렌더링됩니다.
- undefined 값은 렌더링되지 않습니다.
- true 값은 문자열 값 "true"로 JSON 텍스트로 렌더링됩니다.
- false 값은 문자열 값 "false"로 JSON 텍스트에서 렌더링됩니다.

3. 문자열 값은 큰 따옴표(") 코드 단위로 래핑됩니다. 코드 단위 " 및 \는 \ 접두사로 이스케이프 처리됩니다. 제어 문자 코드 단위는 이스케이프 시퀀스 \uHHHH 또는 더 짧은 형식인 \b(공백), \f(폼 피드), \n(개행 문자), \r(캐리지 리턴), \t(탭)로 대체됩니다. ).

4. [유한한](https://tc39.es/ecma262/#finite) 숫자는 [ToString(숫자)](https://tc39.es/ecma262/#sec-tostring)을 호출하는 것처럼 문자열화됩니다. 부호에 관계없이 NaN 및 Infinity는 문자열 값 "null"로 표시됩니다.

5. JSON 표현이 없는 값(예: undefined 및 함수)은 String을 생성하지 않습니다. 대신 undefined 값을 생성합니다. 배열에서 이러한 값은 String 값 "null"로 표시됩니다. 객체에서 표현할 수 없는 값으로 인해 속성은 문자열화에서 제외됩니다.

6. 객체는 U+007B(왼쪽 컬리 브래킷)로 렌더링되고 0 이상의 속성은 U+002C(COMMA)로 구분되며 U+007D(오른쪽 컬리 브래킷)로 닫힙니다. 속성은 [속성 이름](https://tc39.es/ecma262/#property-name), U+003A(COLON) 및 문자열화된 속성 값을 나타내는 따옴표로 묶인 문자열입니다. 배열은 U+005B(왼쪽 사각 괄호)로 렌더링되고 0 이상의 값이 U+002C(COMMA)로 구분되며 U+005D(오른쪽 사각 괄호)로 닫힙니다.

# JSON 직렬화 레코드

JSON 직렬화 레코드는 JSON 형식으로 직렬화를 활성화하는 데 사용되는 [레코드](https://tc39.es/ecma262/#sec-list-and-record-specification-type) 값입니다. JSON 직렬화 레코드에는 [표 69](https://tc39.es/ecma262/#table-json-serialization-record)에 나열된 필드가 있습니다.

## JSON 직렬화 레코드 필드

| 필드명 | 값 | 의미 |
| --- | --- | --- |
| [[ReplacerFunction]] | a `function object` or `undefined` | 객체 속성에 대한 대체 값을 제공할 수 있는 함수(JSON.stringify의 replacer 매개변수에서). |
| [[PropertyList]] | either a List of `String`s or `undefined` | 배열이 아닌 객체를 직렬화할 때 포함할 속성의 이름(JSON.stringify의 replacer 매개변수에서). |
| [[Gap]] | a `String` | 들여쓰기 단위(JSON.stringify의 공간 매개변수에서 가져옴). |
| [[Stack]] | a List of `Object`s | 직렬화되는 과정에 있는 중첩된 개체 집합입니다. 순환 구조를 감지하는 데 사용됩니다. |
| [[Indent]] | a `String` | 현재 들여쓰기입니다. |

