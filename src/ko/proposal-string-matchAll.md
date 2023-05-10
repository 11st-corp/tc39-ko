# String.prototype.matchAll
`String.prototype.matchAll`에 대한 제안서와 명세서입니다.

## 폴리필/Shim
[npm의 string.prototype.matchall](https://www.npmjs.com/package/string.prototype.matchall) 이나, [github](https://github.com/ljharb/String.prototype.matchAll) 을 확인하세요.

## 명세서
[markdown](spec.md) 형식이나 [HTML](https://tc39.github.io/proposal-string-matchall/) 형식으로 명세서를 보실 수 있습니다.

## 이론적 근거
내가 특정 문자열과 여러개의 캡쳐링 그룹들을 가진 `sticky` / `global` 접근자 속성의 정규식을 가지고 있다면, 모든 매치된 결과를 반복하고 있을 때가 많습니다. 현재, 저는 아래의 방식으로 구현합니다.

```js
var regex = /t(e)(st(\d?))/g;
var string = 'test1test2';

string.match(regex); // ['test1', 'test2']의 결과가 반환됩니다. 캡쳐링 그룹은 어떻게 접근해야할까요?

var matches = [];
var lastIndexes = {};
var match;
lastIndexes[regex.lastIndex] = true;
while (match = regex.exec(string)) {
	lastIndexes[regex.lastIndex] = true;
	matches.push(match);
	// 예제: `index`과 `input`속성을 가진 배열 ['test1', 'e', 'st1', '1'] 
}
matches; /* 우리가 원하는 것을 가지고 있지만, 반복문을 사용하였고,
		* 정규식이 가진 `lastIndex` 속성을 변경시켰습니다. */
lastIndexes; /* 동일한 { 0: true }의 결과를 원하였으나,
		* lastIndex의 변경된 값들을 가지고 있습니다. */

var matches = [];
string.replace(regex, function () {
	var match = Array.prototype.slice.call(arguments, 0, -2);
	match.input = arguments[arguments.length - 1];
	match.index = arguments[arguments.length - 2];
	matches.push(match);
	// 예제: `index`과 `input`속성을 가진 배열 ['test1', 'e', 'st1', '1']
});
matches; /* 우리가 원하는 것을 가지고 있지만, `replace`를 남용하였고,
	  * `lastIndex` 속성을 변경시켰을 뿐 만 아니라,
	  * `match`의 기본 구조를 요구합니다. */
```

첫번째 예제는 캡쳐링 그룹들을 제공하지 않기 때문에, 방법이 아닙니다. 나머지 두개의 예제는 모두 `lastIndex`를 명시적으로 변경하고 있습니다. - 이 것은 모든 매치된 결과에 대한 정확한 정보들을 얻는 지저분한 방법 중에 하나이기 때문에, ES6/ES2015의 내장된 `RegExp`에게 (이론적인 부분 이상으로) 매우 큰 문제입니다. 

그러므로, `String#matchAll`은 모든 캡처링 그룹에 대한 접근법 뿐 만 아니라, 문제가 되는 정규식 객체의 명시적인 변경을 하지않도록 하는 조건을 만족합니다.  

## 반복자 대 배열
많은 상황의 경우, 매치된 결과들의 배열을 원합니다. - 하지만, 명백하게도 모든 상황은 아닙니다. 특히 많은 수의 캡처링 그룹이나 긴 문자열의 크기는 매치된 결과를 배열로 반환하는데에 성능저하를 야기할 수 있습니다. 이를 위해 반복자를 반환함으로서, 사용자가 원하는 경우에만 `Array.from`이나 연산자를 통해서 배열로 변환하는 작업을 진행합니다.     

## 이전의 논의들
- http://blog.stevenlevithan.com/archives/fixing-javascript-regexp
- https://esdiscuss.org/topic/letting-regexp-method-return-something-iterable
- http://stackoverflow.com/questions/844001/javascript-regular-expressions-and-sub-matches
- http://stackoverflow.com/questions/432493/how-do-you-access-the-matched-groups-in-a-javascript-regular-expression
- http://stackoverflow.com/questions/19913667/javascript-regex-global-match-groups
- http://stackoverflow.com/questions/844001/javascript-regular-expressions-and-sub-matches
- http://blog.getify.com/to-capture-or-not/#manually-splitting-string

## 네이밍
`matchAll`이라는 이름은 `match`와 대응되며, 단순히 하나의 매치된 결과값이 아닌 *모든* 매치된 결과값을 반환한다는 의미를 담기 위해서 선택되었습니다. 이 것은 정규 표현식이 문자열 내에 모든 매치된 결과를 지시하는 `global` 플래그와 함께 사용될 것이라는 의미를 담고 있습니다. 해당 이름의 대체안으로 반복자를 반환하는 복수명사의 선례인 `keys`/`values`/`entries`를 따르는 `matches`가 제안되었습니다. 
 하지만 `includes`는 boolean 값을 반환합니다. 이름이 명확하게 명사나 동사가 아닐 경우, "복수 명사"는 명백하게 해당 선례를 따라한다고 볼 수 없습니다.

위원회의 피드백으로부터 수정된 사항 : ruby는 이 메서드에 대해 `scan`이라는 단어를 이름으로 사용합니다. 하지만 한 위원은 Javascript에 새로운 단어를 추가하는 것을 반대하였습니다. `matchEach`가 제안되었으나 일부의 인원이 `forEach`와 이름이 유사함에도, API가 약간은 다르기에 반대하였습니다. `matchAll`이라는 이름을 모두가 찬성하였습니다.   

2017년 9월 TC39 회의에서, "all"의 의미가 "all overlapping matches"인지 "all non-overlapping matches"인지에 대한 질문이 제기되었습니다. - "overlapping"의 의미는 "문자열 내에 각각의 문자로부터 시작하여 매치된 모든 것"이며, "non-overlapping"의 의미는 "문자열의 시작에서부터 매치된 모든 것"입니다. 우리는 메서드의 이름을 변경할 것인지, 두 의미를 모두 만족하는 방법을 추가할 것인가에 대해 간략하게 고려하였으나, 해당 문제는 철회되었습니다.