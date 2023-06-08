# Array.prototype.{flat,flatMap}

## 소개

**Array.prototype.flat** 은 모든 하위 배열 요소가 지정된 깊이까지 재귀적으로 연결된 새 배열을 반환합니다.

**Array.prototype.flatMap** 은 먼저 매핑 함수를 사용하여 각 요소를 매핑한 다음 결과를 새 배열로 평면화합니다. 이는 깊이 1의 평면화가 뒤따르는 [`map()`](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Array/map)과 동일하지만(`arr.map(...args).flat()`), flatMap은 꽤 자주 유용하며 둘을 하나의 메서드로 병합하는 것이 약간 더 효율적입니다.


## Array.prototype.flat

0개 또는 1개의 인수로 호출되며, 기본 값은 1입니다.

```js
const arr1 = [0, 1, 2, [3, 4]];
console.log(arr1.flat());
// Expected output: Array [0, 1, 2, 3, 4]

const arr2 = [0, 1, 2, [[[3, 4]]]];
console.log(arr2.flat(2));
// Expected output: Array [0, 1, 2, Array [3, 4]]

const arr3 = [1, 2, [3, 4, [5, 6, [7, 8, [9, 10]]]]];
arr3.flat(Infinity);
// Expected output: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

### 배열이 아닌 객체에서 flat() 호출

flat 메서드는 `this`의 `length` 속성을 읽고, 각 정수 인덱스에 접근합니다. 요소가 배열이 아닌 경우 결과에 직접 추가됩니다.

```js
const arrayLike = {
  length: 3,
  0: [1, 2],
  // Array-like objects aren't flattened
  1: { length: 2, 0: 3, 1: 4 },
  2: 5,
};
console.log(Array.prototype.flat.call(arrayLike));
// [ 1, 2, { '0': 3, '1': 4, length: 2 }, 5 ]
```

## Array.prototype.flatMap

```js
const arr1 = [1, 2, 1];

const result = arr1.flatMap((num) => (num === 2 ? [2, 2] : 1));

console.log(result);
// Expected output: Array [1, 2, 2, 1]
```

### 언제 유용할까?

```js
const arr1 = [1, 2, 3, 4];

arr1.map((x) => [x * 2]);
// [[2], [4], [6], [8]]

arr1.flatMap((x) => [x * 2]);
// [2, 4, 6, 8]

arr1.flatMap((x) => [[x * 2]]);
// [[2], [4], [6], [8]]
```

얼핏 보기에는 유용한 점을 못느낄 수 있지만, 배열로 반환한다는 것은 큰 이점을 갖습니다.

```js
const arr1 = ["it's Sunny in", "", "California"];

arr1.map((x) => x.split(" "));
// [["it's","Sunny","in"],[""],["California"]]

arr1.flatMap((x) => x.split(" "));
// ["it's","Sunny","in", "", "California"]
```

### flatMap 함수의 구현에 대한 논의: concat 함수와 iterable 인터페이스를 사용하여 구현할 수 있는데 flatMap이 필요할까?

flatMap 함수는 concat 함수 또는 iterable 인터페이스를 사용하여 구현할 수 있으므로 필요하지 않다는 것이 우려입니다.

```js
function flatMap(arr, f) {
  return arr.reduce((acc, x) => acc.concat(f(x)), []);
}

const arr1 = ["it's Sunny in", "", "California"];

arr1.flatMap((x) => x.split(" ")); // ["it's","Sunny","in", "", "California"]
console.log(flatMap(arr1, (x) => x.split(" "))) // ["it's","Sunny","in", "", "California"]
```

그러나 flatMap 함수는 concat 함수 또는 iterable 인터페이스보다 사용하기 더 간결할 수 있습니다. flatMap 함수는 concat 함수 또는 iterable 인터페이스보다 배열을 조작하는 데 유용한 강력한 도구가 될 수 있기에 채택되었습니다.

### flatMap 함수의 구현에 대한 논의: 얕은 평탄화 vs 깊은 평탄화

기본 동작이 얕은 평탄화여야 한다고 [이슈](https://github.com/tc39/proposal-flatMap/issues/9)에서 의견을 제시했습니다. 이것이 더 일반적인 동작이며 대부분의 경우 원하는 동작이고, 깊은 평탄화를 원한다면 `flatMap(Infinity)`로 사용해야 한다고 말했습니다.

이에 대한 반대 입장은 이전 Javascript 라이브러리에서 `flatten()`, `flattenDeep()`등 제공되고 있었고, 같은 목적을 위해 이전에 만들어진 메서드들도 고려해야한다는 의견이 있었습니다.