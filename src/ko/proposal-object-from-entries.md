# Object.fromEntries
본 제안서가 4단계이기 때문에 이 저장소는 현재 보관되었습니다.

ECMAScript의 새로운 정적 메소드 `Object.fromEntries`에 대한 제안으로, 키-값 쌍의 목록을 객체로 변환하는 기능을 제공합니다.

이 제안은 기존에 [Darien Maillet Valentine](https://github.com/bathos)에 의해 작성되었고 [Jordan Harband](https://github.com/ljharb)와 [Kevin Gibbons](https://github.com/bakkot)에 의해 옹호되고 있습니다.

- 제안
- 이론적 근거
  - 언제 유용한가?
- 영감을 주는 예시
  - 객체간 속성 변환
  - 기존 컬렉션의 객체
- 선행 기술
  - Lodash
  - Python

## 제안
`Object.fromEntries`는 `Object.entries`의 반대 기능을 수행하기 위해 제안되었습니다. 이는 반복자의 키-값 쌍의 반복 가능한(iterable) 객체를 받아 해당 쌍의 키와 값으로 구성된 새로운 객체를 반환합니다.

```js
obj = Object.fromEntries([['a', 0], ['b', 1]]); // { a: 0, b: 1 }
```

자세한 내용은 [DETAILS.md](https://github.com/tc39/proposal-object-from-entries/blob/main/DETAILS.md)를 참조하세요.

## 이론적 근거
다양한 구조(배열,맵 등등)에 저장된 데이터를 한 형태에서 다른 형태로 변환하는 것은 흔한 일입니다. 데이터 구조가 모두 반복 가능한 객체인 경우 이는 일반적으로 간단하게 처리됩니다.

```js
map = new Map().set('foo', true).set('bar', false);
arr = Array.from(map);
set = new Set(map.values());
```

`Map`의 반복가능한 항목들은 키-값 쌍으로 구성됩니다. 이는 `Object.entries`가 반환하는 쌍과 딱 맞기 때문에 객체를 `Map`으로 비교적 표현력 있게 변환할 수 있습니다.

```js
obj = { foo: true, bar: false };
map = new Map(Object.entries(obj));
```

그러나 키-값 쌍으로부터 객체를 구성하기 위한 Object.entries의 역은 존재하지 않기 때문에 보통 헬퍼 함수나 인라인 리듀서를 사용해야 합니다.

```js
obj = Array.from(map).reduce((acc, [ key, val ]) => Object.assign(acc, { [key]: val }), {});
```
이는 다른 여러가지 방식으로 작성될 수 있으며, 함수의 목적과 명확히 관련되지 않기 때문에 잡음이 추가될 가능성이 있습니다.

### 언제 유용한가?
`Object.fromEntries`는 `Map`보다 일반 객체를 선호한다는 의미는 아닙니다.

키의 임의 집합이 포함된 컬렉션이 있을 경우, 문자열일 경우라도, 특히 향우에 멤버를 추가/제거할 계획이 있다면 Map 데이터가 객체 속성보다 더 적합한 모델일 가능성이 높습니다. 속성은 인터페이스나 고정된 형태의 모델을 설명하는 데 적합하지만 임의의 해시를 모델링하기에는 적합하지 않으며, `Map`은 해당 경우에 더 나은 서비스를 제공하기 위해 설계되었습니다.

우리는 항상 모델을 선택할 수 있는 게 아닙니다. `fromEntries`는 이를 돕기 위해 만들어진 도구 중 하나입니다. 데이터가 임의의 컬렉션임을 인식하면 `Map`을 사용하여 모딜링하는 것을 더 선호할 수 있습니다. 그러나 나중에 해당 데이터를 일반 객체로 모델링해야 하는 API에 전달해야 할 수도 있습니다(쿼리 매개변수, 헤더 등을 생각해보세요). `externalAPI(Object.fromEntries(myMap))`

JSON에서 가져온 데이터나 JSON으로 직렬화해야 하는 데이터는 종종 속성을 사용하여 임의의 컬렉션을 모델링합니다. 항목들을 반사하는 메타프로그래밍은 항목을 조작하거나 필터링한 다음 다시 객체로 변환하는 경우의 다른 시나리오입니다. 예를 들어, `Object.defineProperties`에 전달할 수 있는 객체를 처리할 때가 있습니다. 예시를 하나 더 들자면, 그것이 좋은 생각인지에 대해 모두가 동의하는 것은 아니지만, 임의의 키 객체를 포함하는 계약은 API 사용성을 개선한다고 생각하는 경우에도 일부 작성자가 의도적으로 선택할 수 있습니다.

## 영감을 주는 예시

### 객체에서 객체로 속성을 변환

```js
obj = { abc: 1, def: 2, ghij: 3 };
res = Object.fromEntries(
  Object.entries(obj)
  .filter(([ key, val ]) => key.length === 3)
  .map(([ key, val ]) => [ key, val * 2 ])
);

// res is { 'abc': 2, 'def': 4 }
```

### 기존 컬렉션으로부터 객체 생성
문자열 키를 가진 `Map`은 객체로 변환될 수 있습니다. 객체도 Map으로 변환될 수 있듯이 말이죠.

```js
map = new Map([ [ 'a', 1 ], [ 'b', 2 ], [ 'c', 3 ] ]);
obj = Object.fromEntries(map);

// compare existing functionality: new Map(Object.entries(obj))
```

이 변환은 다른 `Map`과 유사한 객체에도 적용될 수 있습니다.

```js
query = Object.fromEntries(new URLSearchParams('foo=bar&baz=qux'));
```
다른 컬렉션의 경우, 중간 변환을 통해 컬렉션을 필요한 형태로 정렬할 수 있습니다.

```js
arr = [ { name: 'Alice', age: 40 }, { name: 'Bob', age: 36 } ];
obj = Object.fromEntries(arr.map(({ name, age }) => [ name, age ]));

// obj is { Alice: 40, Bob: 36 }
```

## 선행 기술

### Lodash
Underscore와 Lodash는 키-값 쌍의 목록에서 객체를 구성하는 `_.fromPairs` 함수를 제공합니다.

### Python
Python에서는, 배열 형태의 키-값 튜플로 `dict`를 초기화할 수 있습니다.
```python
dict([('two', 2), ('one', 1), ('three', 3)])
```