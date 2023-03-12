describe("fill-string-non-strings.js", () => {
  test("false", () => {
    expect("abc".padStart(10, false)).toEqual("falsefaabc");
  });

  test("true", () => {
    expect("abc".padStart(10, true)).toEqual("truetruabc");
  });

  test("null", () => {
    expect("abc".padStart(10, null)).toEqual("nullnulabc");
  });

  test("0", () => {
    expect("abc".padStart(10, 0)).toEqual("0000000abc");
  });

  test("-0", () => {
    expect("abc".padStart(10, -0)).toEqual("0000000abc");
  });

  test("NaN", () => {
    expect("abc".padStart(10, NaN)).toEqual("NaNNaNNabc");
  });

  test("undefined", () => {
    expect("abc".padStart(10, undefined)).toEqual("       abc");
  });
});

describe("error function should Throw Error", () => {
  class MyError {};
  const throwing = {toString() {throw new MyError}};
  const empties = ['', {toString() {return ''}}];

  expect(() =>''.padStart(Symbol(), throwing)).toThrowError();
});