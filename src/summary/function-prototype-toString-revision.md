# Function.prototype.toString 개정

## Introduction

### 목표

해당 제안의 목표는 아래와 같습니다.

1. 기존의 일치하지 않는 요구사항을 제거  
    > 특정 기준을 만족하는 문자열을 반환하지 못하는 경우, `eval`의 결과값으로 `SyntaxError`예외를 던지는 문자열을 반환해야합니다.
2. "함수적 동일성"을 명확하게 하기 위함
3. 내장 함수와 호스트 객체에 대한 문자열 반환값을 표준화하기 위함
4. 객체의 문자 표현 방식을 명확하게 하기 위함

이후에 추가된 목표는

- 문자열 파서가 기본적으로 동일한 함수의 로직과 인자 목록을 포함하도록 하기 위함

- 첫번째 어절의 시작과 마지막 어절의 끝까지 적절한 문법을 통해서 매칭된 문자 슬라이스를 반환하는 `toString`을 ECMAScript를 사용하여 정의하기 위해


### ECMAScript 함수 객체

ECMAScript 함수 객체는 렉시컬 환경 내에서 매개변수화된 ECMAScript 코드를 캡슐화하며, 해당 코드에 대한 동적평가를 지원합니다. ECMAScript 함수 객체는 일반 객체이며, 동일하게 내부 슬롯과 내장 함수를 가지고 있습니다. 아래는 ECMAScript 함수 객체가 가진 내부 슬롯입니다.

### Function.prototype.toString()

`toString` 함수가 `func`이 `this`로 바인딩되어 호출되는 경우, 아래의 단계를 통해 수행됩니다. 

1. `func`이 `Bound Function exotic object` 또는 내장 `Function object`일 경우, `func`의 구현에 따른 소스코드 표현 문자열을 반환합니다. 이 표현식은 `Native Function`의 문법에 따릅니다. 

   1. 추가적으로, `func`이 익명 함수가 아닌, `Well-Known Intrinsic Object`(고유 객체)일 경우, `PropertyName`과 대응되는 반환되는 문자열의 일부는 `func`의 이름 속성의 초기값이어야만 합니다.   
2. `func`이 `[[SourceText]]` 내장 슬롯이 존재하고, `[[SourceText]]`의 속성값의 타입이 String 이고, `! HostHasSourceTextAvailable(func)`의 값이 참일 경우, `func.[[SourceText]]`를 반환합니다.
3. `func`의 속성이 `Object`이고, `IsCallable(func)`의 값이 참일 경우, `func`의 구현에 따른 소스코드 표현 문자열을 반환합니다. 이 표현식은 `Native Function`의 문법에 따릅니다.
4. `TypeError`를 반환합니다.

#### `Well-Known Intrinsic Object`

잘 알려진 내장객체는 특정한 영역의 정체성을 가지며, 스펙의 정해진 알고리즘으로 표현된 내장 객체를 말합니다. 별도로 지정하지 않는 한 고유객체는 유사한 개체 집합으로 속하게 됩니다.

`Array` `BigInt` `Boolean` `Date`의 타입이 내장 객체에 속합니다.

### Built-in Exotic Object Internal Methods and Slots

`built-in Exotic Object`는 특정 상황을 제외하고는 일반 객체와 동일하게 동작합니다. `Exotic Object` 또한 일반 객체가 가진 내장 메서드를 사용하고 있습니다.  

#### Bound Function Exotic Objects

`bound function exotic objects`는 `function object`로 랩핑된 내장 객체를 말합니다. 즉, `bound function exotic objects`는 callable 호출가능합니다. 이 이유는 해당 객체가 내장 메서드로 `[[Call]]`을 가지고 있을 뿐 만아니라 `[[Construct]]`를 가지고 있기 때문입니다. `bound function exotic objects`는 일반적으로 랩핑된 함수의 결과값을 반환합니다.

특정 객체가 `bound function exotic objects`이 되기 위해서는 `[[Call]]`과 `[[Construct]]` 아래의 `Bound` 관련 내장 슬롯을 가지고 내장 함수가 구현되어 있으며, 일반적인 객체가 가지고 있는 기본적인 [내장 함수](https://tc39.es/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) 를 가지고 있어야만합니다. 해당 메서드들은 `BoundFunctionCreate`로 객체 내에 정의됩니다.

`bound function exotic objects`이 호출가능하지만, 그렇다고 해서 `function object`가 가진 [내장 슬롯](https://tc39.es/ecma262/#table-internal-slots-of-ecmascript-function-objects) 을 가지고 있는 것이 아닙니다. 아래의 내장 슬롯을 가집니다.

- `[[BoundTargetFunction]]` - 해당 객체를 래핑하고 있는 `function object`

- `[[BoundFunction]]` - 래핑 함수가 호출될 때 `this`로 바인딩될 객체

- `[[BoundArguments]]` - 래핑 함수가 호출될 때 전달될 인자

`Array`, `String`, `Immutable`과 같은 객체가 있다고 합니다.
 

#### `HostHasSourceTextAvailable ( func )`

해당 함수는 `function object`를 인자로 받고, 호스트 환경에 해당 함수로 제공되는 소스가 주입되지 않도록 한다. 

#### `host environment`

## Ordinary Object

> 아래의 기준을 모두 만족하는 객체를 말합니다.

1. 아래의 [테이블 4](https://tc39.es/ecma262/#table-essential-internal-methods) 에 있는 내장 함수들을 사용하기 위해서 [10.1](https://tc39.es/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) 의 방식으로 선언됩니다.
2. `[[Call]]` 내장 함수가 존재하는 객체일 경우, [10.2.1]() 또는 [10.3.1]() 으로 선언됩니다.
3. `[[Construct]]` 내장 함수가 존재하는 객체일 경우, [10.2.2]() 또는 [10.3.2]() 으로 선언됩니다.

## Exotic Object

> 위의 `Ordinary Object`가 아닌 모든 객체를 말합니다.

객체가 가진 내장 함수에 따라 여러가지 종류가 존재합니다. 특정 종류의 `exotic object`와 동일한 기능을 수행하더라도 `exotic object`와 내장 함수의 집합과 동일하지 않으면, 같은 `exotic object`로 보지 않습니다.

## Function Object의 추가 기본 내장함수

[테이블 5]() 는 함수로 호출될 수 있는 객체가 가져야하는 기본 내장 함수를 정리한 표입니다. `function object`는 `[[Call]]` 내장 함수를 지원하는 객체를 말합니다. `constructor`는 `[[Construct]]` 내장 함수를 지원하는 객체를 말합니다. `[[Construct]]` 내장 함수를 지원하는 모든 객체는 `[[Call]]` 내장 함수 또한 지원하고 있습니다. 즉, `constructor`는 `function object`인 것입니다. 그래서 `contructor`를 `constructor function` 또는 `constructor function object`라고 부를 수 있습니다.


### `[[Call]]`

객체와 연관된 코드를 실행시킵니다. 함수 호출 표현식을 통해 이 내장 함수가 발생됩니다. 해당 내장 함수가 받는 인자는 `this`와 호출 표현식을 통해 전달되는 배열입니다. `[[Call]]`는 내장 함수의 개념으로, 실제 구현은 `callable`입니다.


### `[[Construct]]`

객체를 생성합니다. `new` 연산자 또는 `super`를 통해 발생됩니다. 해당 내장 함수가 받는 첫번째 인자는 생성자 함수나 `super`를 통한 호출시에 전달하는 인자 배열이며, 두번째 인자는 `new` 연산자가 초기화하는 객체입니다. 실제 구현은 `constructors`입니다.

`ordinary object`와 표준 `exotic object`의 기본 내장함수의 문법은 [10](https://tc39.es/ecma262/#sec-ordinary-and-exotic-objects-behaviours) 에 제시되어있습니다. 만약 `exotic object` 내장 함수 중 구현되지 않은 특정한 방식의 사용은 `TypeError`의 예외를 발생시킬 것입니다.



### 참고

[Exotic Objects](https://blog.bitsrc.io/exotic-objects-understanding-why-javascript-behaves-so-moody-5f55e867354f)
[Ordinary Object](https://tc39.es/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots)



