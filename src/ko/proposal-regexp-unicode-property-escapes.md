# ECMAScript 제안서: 정규 표현식의 유니코드 속성 이스케이프

## 상태

본 제안서는 [TC39 과정](https://tc39.github.io/process-document/)의 4단계에 있으며 ES2018에 포함될 예정입니다.

## 제안 동기

유니코드 표준은 모든 기호에 다양한 속성과 속성 값을 할당합니다. 예를 들어, 그리스 스크립트에서 독점적으로 사용되는 기호 집합을 얻으려면, 유니코드 데이터베이스에서 `Script` 속성이 `Greek`로 설정된 기호를 검색합니다.

현재 ECMAScript 정규 표현식에서 기본적으로 이러한 유니코드 문자 속성에 접근할 수 있는 방법이 없습니다. 이것은 개발자들이 정규 표현식에서 완전한 유니코드를 지원하는 것을 고통스럽게 만듭니다. 현재 두 가지 옵션이 있으며, 두 가지 모두 이상적이지 않습니다.

1. [XRegExp](https://github.com/slevithan/xregexp)와 같은 라이브러리를 사용하여 런타임에 정규 표현식을 만듭니다:

   ```js
   const regexGreekSymbol = XRegExp("\\p{Greek}", "A");
   regexGreekSymbol.test("π");
   // → true
   ```

   이 접근 방식의 단점은 XRegExp 라이브러리가 성능에 민감한 응용 프로그램에 적합하지 않을 수 있는 런타임 종속성이라는 것입니다. 웹에서 사용하는 경우, 추가적인 로드 시간 성능 저하가 있습니다. `xregexp-all-min.js.gz`는 gzip 압축을 최소화하고 적용한 후 35KB 이상의 공간을 차지합니다. 유니코드 표준이 갱신될 때마다 새 버전의 XRegExp가 반드시 배포되어야 하며, 최종 사용자는 사용 가능한 최신 데이터를 사용하기 위해 XRegExp 복사본을 갱신해야 합니다.

2. [Regenerate](https://github.com/mathiasbynens/regenerate)와 같은 라이브러리를 사용하여 빌드 시 정규 표현식을 생성합니다.

   ```js
   const regenerate = require("regenerate");
   const codePoints = require("unicode-9.0.0/Script/Greek/code-points.js");
   const set = regenerate(codePoints);
   set.toString();
   // → '[\u0370-\u0373\u0375-\u0377\u037A-\u037D\u037F\u0384\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03E1\u03F0-\u03FF\u1D26-\u1D2A\u1D5D-\u1D61\u1D66-\u1D6A\u1DBF\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FC4\u1FC6-\u1FD3\u1FD6-\u1FDB\u1FDD-\u1FEF\u1FF2-\u1FF4\u1FF6-\u1FFE\u2126\uAB65]|\uD800[\uDD40-\uDD8E\uDDA0]|\uD834[\uDE00-\uDE45]'
   // 이 패턴을 파일에 저장하기 위해 여기에 더 많은 코드가 있다고 상상해보십시오.
   ```

   비록 생성된 정규 표현식의 크기가 상당히 큰 경향이 있지만(웹에서 로드 시간 성능 문제가 발생할 수 있음), 이 접근 방식은 최적의 런타임 성능을 제공합니다. 가장 큰 단점은 빌드 스크립트가 필요하다는 것입니다. 이는 개발자가 더 많은 유니코드 인식 정규 표현식을 필요로 함에 따라 고통스러워집니다. 유니코드 표준이 갱신될 때마다 빌드 스크립트를 반드시 갱신하고 해당 결과를 반드시 배포해야 최신 데이터를 사용할 수 있습니다.

## 제안된 해결책

`\p{...}` 및 `\P{...}` 형식의 **유니코드 속성 이스케이프** 추가를 제안합니다. 유니코드 속성 이스케이프는 `u` 플래그가 설정된 정규 표현식에서 사용할 수 있는 새로운 유형의 이스케이프 시퀀스입니다. 이 기능을 사용하면, 위의 정규 표현식을 다음과 같이 작성할 수 있습니다.

```js
const regexGreekSymbol = /\p{Script=Greek}/u;
regexGreekSymbol.test("π");
// → true
```

본 제안은 위에서 언급한 모든 문제를 해결합니다.

- 유니코드 인식 정규 표현식을 생성하는 것이 더 이상 고통스럽지 않습니다.
- 런타임 라이브러리에 대한 종속성이 없습니다.
- 정규 표현식 패턴은 간결하고 읽기 쉽습니다. 더 이상 파일 크기가 커지지 않습니다.
- 빌드 시 정규 표현식을 생성하는 스크립트를 더 이상 생성할 필요가 없습니다.
- 유니코드 속성 이스케이프를 사용하는 코드는 개발자의 관점에서 "자동으로" 최신 상태를 유지합니다. 유니코드 표준이 업데이트될 때마다, ECMAScript 엔진이 유니코드 표준 데이터를 갱신합니다.

## 고급 API

이진이 아닌 유니코드 속성에 대한 유니코드 속성 이스케이프는 다음과 같습니다.

<pre>\p{<b><i>UnicodePropertyName</i></b>=<b><i>UnicodePropertyValue</i></b>}</pre>

[`PropertyAliases.txt`](http://unicode.org/Public/UNIDATA/PropertyAliases.txt) 및 [`PropertyValueAliases.txt`](http://unicode.org/Public/UNIDATA/PropertyValueAliases.txt)에 정의된 별칭을 표준 속성 및 값 이름 대신 사용할 수 있습니다. 알 수 없는 속성 이름 또는 값을 사용하면 초기에 `SyntaxError`가 발생합니다.

이진 속성의 경우, 다음 구문을 사용할 수 있습니다.

<pre>\p{<b><i>LoneUnicodePropertyNameOrValue</i></b>}</pre>

이 구문은 또한 `\p{General_Category=Letter}` 대신 `\p{Letter}`와 같은 `General_Category` 값의 단축형으로 사용될 수 있습니다.

`\P{...}`는 `\p{...}`의 부정 형식입니다.

구현은 반드시 명세 제안에 언급된 유니코드 속성 및 해당 속성 별칭 목록을 지원해야 합니다. 여기에는 `General_Category`, `Script`, `Script_Extensions` 및 일부 이진 속성 (포함되지만 이에 국한되지 않는 `Alphabetic`, `Uppercase`, `Lowercase`, `White_Space`, `Noncharacter_Code_Point`, `Default_Ignorable_Code_Point`, `Any`, `ASCII`, `Assigned`, `ID_Start`, `ID_Continue`, `Join_Control`, `Emoji_Presentation`, `Emoji_Modifier`, `Emoji_Modifier_Base`, 등). 이는 [UTS18 RL1.2](http://unicode.org/reports/tr18/#RL1.2)에서 요구하는 상위 집합입니다. 상호 운용성을 보장하기 위해, 구현은 반드시 유니코드 속성 지원을 나머지 속성으로 확장해서는 안 됩니다.

### 자주 묻는 질문

#### 하위 호환성은 어떻습니까?

`u` 플래그가 없는 정규 표현식에서, `\p` 패턴은 `p`에 대한 (불필요한) 이스케이프 시퀀스입니다. `\p{Letter}` 형식의 패턴은 `u` 플래그가 없는 기존 정규 표현식에 이미 존재할 수 있으므로, 하위 호환성을 깨뜨리지 않고는 이러한 패턴에 새로운 의미를 부여할 수 없습니다.

이러한 이유로 ECMAScript 2015는 `\p` 및 `\P`와 같은 불필요한 이스케이프 시퀀스가 ​​`u` 플래그가 설정된 경우 [예외를 발생](https://bugs.ecmascript.org/show_bug.cgi?id=3157)시킵니다. 이를 통해 하위 호환성을 깨지 않고 `u` 플래그가 있는 정규 표현식에서 `\p{…}` 및 `\P{…}`의 의미를 변경할 수 있습니다.

#### 느슨한 일치를 지원하지 않는 이유는 무엇입니까?

[UAX44-LM3](http://unicode.org/reports/tr44/#Matching_Symbolic)은 유니코드 속성과 값 별칭을 비교하기 위한 느슨한 일치 규칙을 지정합니다.

> Ignore case, whitespace, underscores, hyphens, […]

느슨한 일치는 `\p{lB=Ba}`를 `\p{Line_Break=Break_After}`와 동일하게 만들거나 `/\p{___lower C-A-S-E___}/u`를 `/\p{Lowercase}/u`와 동일하게 만듭니다. 우리는 이 기능이 어떤 가치도 추가하지 않으며, 실제로 코드 가독성과 유지 보수성에 해를 끼친다고 단언합니다.

필요한 경우, 나중에 별도의 ECMAScript 제안의 일부로 느슨한 일치에 대한 지원을 항상 추가할 수 있습니다. 그러나 지금 추가하면 되돌릴 수 없습니다.

#### `is` 접두사를 지원하지 않는 이유는 무엇입니까?

[UAX44-LM3](http://unicode.org/reports/tr44/#Matching_Symbolic)은 유니코드 속성과 값 별칭을 비교하기 위한 느슨한 일치 규칙을 지정합니다. 그 중 하나는 다음과 같습니다.

> Ignore […] any initial prefix string `is`.

이 규칙은 `Script=IsGreek` 및 `IsScript=Greek`을 `Script=Greek`과 동일하게 만듭니다. 우리는 이 기능이 어떤 가치도 추가하지 않으며, 실제로 코드 가독성을 해친다고 단언합니다. 일부 속성 값이나 별칭이 이미 `is`로 시작하기 때문에, 애매함을 초래하고 구현 복잡성이 증가합니다. 예: `Decomposition_Type=Isolated` 및 `Line_Break=IS`은 `Line_Break=Infix_Numeric`의 별칭입니다.

[기존 정규 표현식 엔진](http://unicode.org/mail-arch/unicode-ml/y2016-m06/0012.html)이 UAX44-LM3에 설명된 대로 `is` 접두사를 정확히 구현하지 않는 것으로 보이고, 이를 부분적으로 구현하는 엔진은 동작이 크게 다르기 때문에, 다른 언어에서 유니코드 속성 이스케이프와의 호환성은 또한 인수가 아닙니다.

모호함보다 엄격함이 선호됩니다.

필요한 경우, 별도의 ECMAScript 제안의 일부로 나중에 `is` 접두사에 대한 지원을 추가할 수 있습니다. 그러나 지금 추가하면 되돌릴 수 없습니다.

#### 예를 들어 `\p{L}`의 단축형인 `\pL`을 지원하지 않는 이유?

이 단축형은 어떤 가치도 추가하지 않으며 따라서 추가된 구현 복잡성(작을 수 있음)은 그만한 가치가 없습니다. `\p{L}` 작동; 어쨌든 이상적인 목표인 다른 언어와의 호환성 외에 다른 구문을 도입할 이유가 없습니다.

필요한 경우, 나중에 별도의 ECMAScript 제안의 일부로 이 단축형에 대한 지원을 추가할 수 있습니다. 그러나 지금 추가하면 되돌릴 수 없습니다.

#### 구분자로 `=`(다른 것이 아닌)를 사용하는 이유는 무엇입니까?

`\p{…=…}`의 `=`는 긍정적인 전방 탐색의 경우 `(?=…)`의 `=`와 긍정적인 후방 탐색의 `(?<=…)`로 정렬됩니다. 또한 `=`는 대부분의 정규 표현식 엔진이 구분 기호로 사용하는 것입니다. [자세한 내용은 이슈 #8을 참조하세요.](https://github.com/tc39/proposal-regexp-unicode-property-escapes/issues/8)

#### `=` 외에 구분 기호로 `:`을 지원하지 않는 이유는 무엇입니까?

여러 구분자를 지원하는 것은 어떤 가치도 추가하지 않으며 따라서 추가된 구현 복잡성(작을 수 있음)은 그만한 가치가 없습니다. `\p{Script_Extensions=Greek}` 작동; 어쨌든 이상적인 목표인 다른 언어와의 호환성 외에 다른 구문을 도입할 이유가 없습니다.

필요한 경우, 별도의 ECMAScript 제안의 일부로 나중에 `:` 구분 기호에 대한 지원을 추가할 수 있습니다. 그러나 지금 추가하면 되돌릴 수 없습니다.

#### 예를들어 `\p{Script=ScriptName}`의 단축형인 `\p{ScriptName}`을 지원하지 않는 이유?

대부분의 사용 사례에서, `Script_Extensions`는 `Script`보다 계속 사용해야 합니다. [UTS24](http://unicode.org/reports/tr24/#Multiple_Script_Values)는 실용적인 예를 통해 이를 잘 설명합니다. 따라서, `Script`보다 `Script_Extensions`에 대한 단축형을 추가하는 것이 더 합리적입니다. 그러나 이 두 속성의 값 집합이 동일하기 때문에, 둘 중 하나를 수행하면 혼동이 발생할 수 있습니다. 예를 들어, `\p{Old_Persian}`이 해당 이름을 가진 `Script` 또는 `Script_Extensions`를 참조하는지 명확하지 않습니다.

#### `\p{…}` 및 `\P{…}`를 추가하는 대신 `\u{…}`를 오버로드하지 않는 이유는 무엇입니까?

`\u{…}` 오버로딩에 찬성하는 주요 논거는 그것이 유니코드임을 암시한다는 것입니다. 정규 표현식의 필수 `u` 플래그가 이미 유니코드를 나타내므로 이 암시가 불필요하다고 단언합니다.

`\p{…}`의 `p`는 "속성"을 나타냅니다. `u` 플래그와 결합하면, 중괄호 안의 표현식이 유니코드 속성과 관련되어 있음을 잘 나타냅니다.

`\u{…}`를 오버로딩하면 모호성이 생깁니다. 유니코드 표준에 `Beef`라는 이름의 새로운 이진 속성 또는 일반 범주가 추가되었다고 상상해 보십시오. `Beef`는 16진수(`[A-Fa-f0-9]`)로만 구성되어 있으므로, `\u{Beef}`가 [U+BEEF 한글 음절 BBEGS](https://codepoints.net/U+BEEF)의 코드 포인트 이스케이프 시퀀스인지 아니면 `Beef`라는 속성/카테고리를 참조하는 속성 이스케이프 시퀀스인지 불분명합니다.

유니코드 속성 이스케이프를 지원하는 기존의 다른 언어들은 `\p{…}` 및 `\P{…}`를 사용합니다. 비록 이러한 다른 구현과의 호환성은 목표가 아니지만(처음에는 서로 호환되지 않기 때문에), 여기의 관습을 따르고 개발자에게 이미 익숙한 기본 구문을 다시 사용하는 것이 타당합니다.

#### `Name` 속성(`\p{Name=…}`)을 지원하지 않는 이유는 무엇입니까?

개발자는 소스 코드에서 해당 기호를 사용하지 않고도 특정 기호를 참조할 수 있는 방법을 이미 가지고 있습니다. `\u{1D306}` 형식의 유니코드 코드 포인트 이스케이프입니다. 따라서, `\p{Name=TETRAGRAM FOR CENTRE}`를 지원해야 할 필요성은 이 제안에 포함될 만큼 강력하지 않습니다.

별도의 ECMAScript 제안의 일부로 나중에 `Name` 속성에 대한 지원을 추가할 수 있습니다. 그러나 지금 추가하면 되돌릴 수 없습니다.

## 설명에 도움이 되는 실례

### `\d`의 유니코드 인식 버전

ASCII `[0-9]`가 아닌 임의의 유니코드의 10진수와 일치시키려면 [UTS18](http://unicode.org/reports/tr18/#digit)에 따라 `\d` 대신 `\p{Decimal_Number}`를 사용하십시오.

```js
const regex = /^\p{Decimal_Number}+$/u;
regex.test("𝟏𝟐𝟑𝟜𝟝𝟞𝟩𝟪𝟫𝟬𝟭𝟮𝟯𝟺𝟻𝟼");
// → true
```

### `\D`의 유니코드 인식 버전

`[^0-9]`가 아닌 10진수가 아닌 임의의 유니코드 기호를 일치시키려면, `\D` 대신 `\P{Decimal_Number}`를 사용하십시오.

```js
const regex = /^\P{Decimal_Number}+$/u;
regex.test("Իմ օդաթիռը լի է օձաձկերով");
// → true
```

### `\w`의 유니코드 인식 버전

ASCII `[a-zA-Z0-9_]`가 아닌 유니코드의 임의의 단어 기호와 일치시키려면, UTS18에 따라 `[\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Connector_Punctuation}\p{Join_Control}]`을 사용하십시오.

```js
const regex =
  /([\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Connector_Punctuation}\p{Join_Control}]+)/gu;
const text = `
Amharic: የኔ ማንዣበቢያ መኪና በዓሣዎች ተሞልቷል
Bengali: আমার হভারক্রাফ্ট কুঁচে মাছ-এ ভরা হয়ে গেছে
Georgian: ჩემი ხომალდი საჰაერო ბალიშზე სავსეა გველთევზებით
Macedonian: Моето летачко возило е полно со јагули
Vietnamese: Tàu cánh ngầm của tôi đầy lươn
`;

let match;
while ((match = regex.exec(text))) {
  const word = match[1];
  console.log(`Matched word with length ${word.length}: ${word}`);
}
```

콘솔 출력:

```
Matched word with length 7: Amharic
Matched word with length 2: የኔ
Matched word with length 6: ማንዣበቢያ
Matched word with length 3: መኪና
Matched word with length 5: በዓሣዎች
Matched word with length 5: ተሞልቷል
Matched word with length 7: Bengali
Matched word with length 4: আমার
Matched word with length 11: হভারক্রাফ্ট
Matched word with length 5: কুঁচে
Matched word with length 3: মাছ
Matched word with length 1: এ
Matched word with length 3: ভরা
Matched word with length 3: হয়ে
Matched word with length 4: গেছে
Matched word with length 8: Georgian
Matched word with length 4: ჩემი
Matched word with length 7: ხომალდი
Matched word with length 7: საჰაერო
Matched word with length 7: ბალიშზე
Matched word with length 6: სავსეა
Matched word with length 12: გველთევზებით
Matched word with length 10: Macedonian
Matched word with length 5: Моето
Matched word with length 7: летачко
Matched word with length 6: возило
Matched word with length 1: е
Matched word with length 5: полно
Matched word with length 2: со
Matched word with length 6: јагули
Matched word with length 10: Vietnamese
Matched word with length 3: Tàu
Matched word with length 4: cánh
Matched word with length 4: ngầm
Matched word with length 3: của
Matched word with length 3: tôi
Matched word with length 3: đầy
Matched word with length 4: lươn
```

### `\W`의 유니코드 인식 버전

단지 `[^a-zA-Z0-9_]`가 아닌 임의의 유니코드의 단어가 아닌 기호와 일치시키려면 `[^\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Connector_Punctuation}\p{Join_Control}]`을 사용하십시오.

### emoji 일치

emoji 기호를 일치시키려면, [UTR51](http://unicode.org/reports/tr51/)의 이진 속성이 유용합니다.

```js
const regex =
  /\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;
```

이 정규 표현식은 왼쪽에서 오른쪽으로 일치합니다.

1. 선택적 수식어가 있는 emoji (`\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?`);
2. 기본적으로 텍스트가 아닌 emoji로 렌더링되는 임의의 나머지 기호들 (`\p{Emoji_Presentation}`);
3. 기본적으로 텍스트로 렌더링되지만 U+FE0F VARIATION SELECTOR-16을 사용하여 emoji로 강제 렌더링되는 기호들 (`\p{Emoji}\uFE0F`).

```js
const regex =
  /\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;
const text = `
\u{231A}: ⌚ default emoji presentation character (Emoji_Presentation)
\u{2194}\u{FE0F}: ↔️ default text presentation character rendered as emoji
\u{1F469}: 👩 emoji modifier base (Emoji_Modifier_Base)
\u{1F469}\u{1F3FF}: 👩🏿 emoji modifier base followed by a modifier
`;

let match;
while ((match = regex.exec(text))) {
  const emoji = match[0];
  console.log(`Matched sequence ${emoji} — code points: ${[...emoji].length}`);
}
```

콘솔 출력:

```
Matched sequence ⌚ — code points: 1
Matched sequence ⌚ — code points: 1
Matched sequence ↔️ — code points: 2
Matched sequence ↔️ — code points: 2
Matched sequence 👩 — code points: 1
Matched sequence 👩 — code points: 1
Matched sequence 👩🏿 — code points: 2
Matched sequence 👩🏿 — code points: 2
```

### 다른 예제

로마 숫자와 같은 10진수가 아닌 기호를 포함하여, 유니코드의 모든 숫자 기호를 찾습니다.

```js
const regex = /^\p{Number}+$/u;
regex.test("²³¹¼½¾𝟏𝟐𝟑𝟜𝟝𝟞𝟩𝟪𝟫𝟬𝟭𝟮𝟯𝟺𝟻𝟼㉛㉜㉝ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫⅬⅭⅮⅯⅰⅱⅲⅳⅴⅵⅶⅷⅸⅹⅺⅻⅼⅽⅾⅿ");
// → true
```

[빌드 스크립트에 의해 생성된 복잡한 정규 표현식 없이](https://gist.github.com/mathiasbynens/6334847), ECMAScript [`IdentifierStart`](https://tc39.github.io/ecma262/#prod-IdentifierStart) 또는 [`IdentifierPart`](https://tc39.github.io/ecma262/#prod-IdentifierPart) 기호를 일치시킵니다.

```js
const regexIdentifierStart = /[$_\p{ID_Start}]/u;
const regexIdentifierPart = /[$\u200C\u200D\p{ID_Continue}]/u;
const regexIdentifierName =
  /^(?:[$_\p{ID_Start}])(?:[$\u200C\u200D\p{ID_Continue}])*$/u;
```

## 명세서

- [Ecmarkup source](https://github.com/tc39/proposal-regexp-unicode-property-escapes/blob/master/spec.html)
- [HTML version](https://tc39.github.io/proposal-regexp-unicode-property-escapes/)

## 구현

- [V8](https://bugs.chromium.org/p/v8/issues/detail?id=4743), shipping in Chrome 64
- [Safari/JavaScriptCore](https://developer.apple.com/safari/technology-preview/release-notes/) beginning in Safari Technology Preview 42
- [regexpu (transpiler)](https://github.com/mathiasbynens/regexpu) with the `{ unicodePropertyEscape: true }` option enabled
  - [online demo](https://mothereff.in/regexpu#input=/%5Cp%7BLetter%7D/u&unicodePropertyEscape=1)
  - [exhaustive list of supported properties](https://github.com/mathiasbynens/regexpu-core/blob/master/property-escapes.md)
  - [Babel plugin](https://github.com/mathiasbynens/babel-plugin-transform-unicode-property-regex)
