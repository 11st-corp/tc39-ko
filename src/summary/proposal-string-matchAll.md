# string.prototype.matchAll

## 캡처링 그룹(Capturing Group)
**정규표현식을 통해 매치된 결과**에 대해서 세부적인 값을 파악하기 위해서 사용되는 그룹
 
- `()`을 통해 표현하며, `(?<name>{regex})`의 문법으로 네이밍을 할 수 있습니다.
- `matchAll`을 사용하면, name이 `groups`의 key 값으로 사용되며, 캡처링 그룹에 매칭된 값이 대응됩니다. 
- `matchAll`의 반환값은 배열임에도 속성을 가지고 있는 형태라 `Array`라고 볼 수 없습니다. `RegExpStringIterator`라는 형태입니다.

```javascript
let re = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/g;
const result = '2015-01-02,2015-01-03'.matchAll(re);
for (value of result) console.log(value);

/*
['2015-01-02', '2015', '01', '02', index: 0, input: '2015-01-02,2015-01-03', groups: {…}]
0 : "2015-01-02"
1 : "2015"
2 : "01"
3 : "02"
groups : {year: '2015', month: '01', day: '02'}
index : 0
input : "2015-01-02,2015-01-03"
length : 4
[[Prototype]] : Array(0)
 */

/*
['2015-01-03', '2015', '01', '03', index: 11, input: '2015-01-02,2015-01-03', groups: {…}]
0 : "2015-01-03"
1 : "2015"
2 : "01"
3 : "03"
groups : {year: '2015', month: '01', day: '03'}
index : 11
input : "2015-01-02,2015-01-03"
length : 4
[[Prototype]] : Array(0)
 */
```


[네이밍된 캡처링 그룹](https://github.com/tc39/proposal-regexp-named-groups)


## sticky 접근자 속성

정규식 객체의 `sticy` 접근자 속성은 해당 정규식의 `y` 플래그 여부를 의미합니다. 이 때, `y` 플래그는 정규식의 매칭을 `lastIndex` 속성부터 시작한다는 것을 의미합니다. 

sticky 정규식과 global 정규식은 아래의 방식으로 매칭이 수행됩니다.
- 정규식 객체가 가진 속성인 `lastIndex`에서부터 매칭을 시작합니다.
- 정규식과 매칭되는 경우, `lastIndex`는 매칭의 결과의 끝 인덱스가 됩니다.
- `lastIndex`가 현재 문자열의 길이를 벗어나면, `lastIndex`는 0으로 초기화됩니다. 

[RegExp.prototype.sticky](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/sticky)

`matchAll`의 경우, sticky 정규식과 global 정규식의 방식으로 문자열 전체를 탐색하기 때문에 수행되는 방식을 이해해야합니다.

## 예제 분석

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


/*
[Array(4), Array(4)]
[
    ['test1', 'e', 'st1', '1', index: 0, input: 'test1test2', groups: undefined, length: 4],
    ['test2', 'e', 'st2', '2', index: 5, input: 'test1test2', groups: undefined, length: 4]
]
 */

/*
{0: true, 5: true, 10: true}
 */
```

- `exec`를 사용하면 매칭된 캡처링 그룹에 대해 접근할 수 있습니다. 하지만 반복하기 위해서는 `while`을 사용해야합니다. `matchAll` 메서드를 사용하면 이러한 문법적 제약을 벗어날 수 있고, `for ...of`, `배열 전개연산`, `Array.from()`을 통해서 쉽게 반복자를 생성할 수 있습니다.
- 정규식 객체의 `lastIndex` 속성의 값이 계속해서 변합니다. 해당 속성을 기준으로 반복이 수행되기 때문입니다.

### `lastIndex` 속성의 수정없이 캡처링 그룹의 결과에 대한 반복작업을 위해 `matchAll`을 사용하자.