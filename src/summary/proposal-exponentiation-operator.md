# 목차

1. **[중위 표기법(Infix notation)](#중위-표기법)**
2. **[SyntaxError](#SyntaxError)**

---

Specification: ES2017

# 사전 지식

# 중위 표기법

중위 표기법(Infix notation)은 산술 및 논리 공식과 명령문에서 일반적으로 사용되는 표기법입니다. 2 + 2 의 `더하기` 기호와 같이 피연산자와 고정 연산자 사이에 연산자를 배치하는 것이 특징입니다.

# JavaScript 중위 표기법 방식에 대한 논의

수학에서 `-x²`는 `(-x)²`가 아니라 `-(x²)`입니다. 그러나 JavaScript에서 `-x ** 2는 (-x) ** 2`입니다.

## 다른 언어 vs JavaScript

```js
//PHP
$ php -r 'print(-2 ** 2);'
-4

//Python
>>> -2 ** 2
-4

//Haskell
Prelude> -2 ^ 2
-4

//JavaScript
> (-2) ** 2
> 4
```

## JavaScript에서의 (- x \*\* y)

`(-x ** y)`의 연산 결과는 `-(x ** y)`와 `(-x) ** y` 중 어떤 것에 해당 할까요?

지수 연산자가 있는 알려진 모든 프로그래밍 언어는 `-(x ** y)`로 작동합니다.
하지만 JavaScript에서는 `(-x ** y)` 연산을 시도하면 SyntaxError가 발생합니다. JavaScript에서는 단항 연산자인 `-`를 피연산자인 x와 y의 바로 앞에 사용할 수 없기 때문입니다.

```js
-(2).pow(2) # "ought to be" -4, is a syntax error
-(2).max(2) # "ought to be" 2, is a syntax error
```

# SyntaxError

> Uncaught SyntaxError: Unary operator used immediately before exponentiation expression. Parenthesis must be used to

- 1의 부정의 제곱`(ie (-1) ** 2)`인지 1의 제곱의 부정(즉 `-(1 ** 2)`)인지에 대한 혼동을 피하기 위해 그렇게 설계되었습니다.
- 이 내용과 관련한 광범위한 논의([Exponentiation operator precedence](https://esdiscuss.org/topic/exponentiation-operator-precedence)
  )가 있었고, 최종적으로 이를 구문 오류로 만들어 예기치 않은 동작을 방지하기로 결정했습니다.

```js
-2 ** 2 //Error
(-2) ** 2 //4
-(2 ** 2) //-4
```
