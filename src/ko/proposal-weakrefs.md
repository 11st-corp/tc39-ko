# WeakRefs TC39 proposal

## 상태

- 2020년 7월 TC39 회의 이후, WeakRef 및 Finalization Registry는 현재 4단계입니다
- V8 -- shipping [Chrome 84](https://v8.dev/features/weak-references)
- Spidermonkey -- shipping [Firefox 79](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/79)
- JavaScriptCore -- shipping [Safari 14.1](https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/)
- engine262 -- [Initial patch](https://github.com/engine262/engine262/commit/0516660577b050b17e619af4c3f053c7506c670d), now all landed
- XS -- [Shipping in Moddable XS 9.0.1](https://github.com/Moddable-OpenSource/moddable-xst/releases/tag/v9.0.1)

## 소개

WeakRef 제안은 두 가지 주요 새로운 기능을 포함합니다.

1. `WeakRef` 클래스가 있는 객체에 대한 약한 참조 생성
2. `FinalizationRegistry` 클래스를 사용하여 객체가 가비지 컬렉션 처리된 후 사용자 정의 파이널라이저(finalizer)를 실행

이러한 인터페이스는 사용 사례에 따라 독립적으로 또는 함께 사용할 수 있습니다.

개발자를 위한 참조 문서는 [reference.md](https://github.com/tc39/proposal-weakrefs/blob/master/reference.md)에서 확인하십시오.

## 주의사항

이 제안서에는 `WeakRef`와 `FinalizationRegistry`라는 두 가지 고급 기능이 포함되어 있습니다. 올바른 사용은 신중하게 고려해야 하며 가능하면 피하는 것이 가장 좋습니다.

[가비지 컬렉터(GC)](<https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)>)는 복잡합니다. 애플리케이션이나 라이브러리가 GC에서 `WeakRef`를 정리하거나 적시에 예측 가능한 방식으로 파이널라이저를 호출하는 것에 의존한다면 실망할 가능성이 높습니다. 정리가 예상보다 훨씬 늦게 수행되거나 전혀 수행되지 않을 수 있습니다. 변동성의 원인은 다음과 같습니다.

- 어떤 객체는 다른 객체보다 훨씬 빨리 가비지 컬렉트될 수 있습니다. 예를 들어 세대별 컬렉션으로 인해 동시에 도달할 수 없는 경우에도 마찬가지입니다.
- 가비지 컬렉션은 증분 및 동시 기술을 사용하여 시간이 지남에 따라 분할할 수 있습니다.
- 다양한 런타임 휴리스틱을 사용하여 메모리 사용량과 응답성의 균형을 맞출 수 있습니다.
- 클로저 또는 인라인 캐시처럼 JavaScript 엔진이 도달할 수 없는 것처럼 보이는 것에 대한 참조를 보유할 수 있습니다.
- 다른 JavaScript 엔진은 이러한 작업을 다르게 수행하거나, 동일한 엔진이 버전 간에 알고리즘을 변경할 수 있습니다.
- 복잡한 요인으로 인해 특정 API와 함께 사용하는 것과 같이 예기치 않은 시간 동안 객체가 활성 상태로 유지될 수 있습니다.

파이널라이저의 코드 경로에 중요한 로직을 배치하면 안 됩니다. 그렇게 하면 메모리 관리 버그 또는 JavaScript 가비지 컬렉터 구현 간의 차이로 인해 사용자가 직면하는 문제가 발생할 수 있습니다. 예를 들어 데이터가 파이널라이저에서만 지속적으로 저장되는 경우 실수로 추가 참조를 유지하는 버그로 인해 데이터 손실이 발생할 수 있습니다.

이러한 이유로, [W3C TAG 설계 원칙](https://w3ctag.github.io/design-principles/#js-gc)은 가비지 컬렉션을 노출하는 API를 생성하지 말 것을 권장합니다. `WeakRef` 객체 및 `FinalizationRegistry` 객체는 외부 리소스를 정리하거나 할당된 항목을 관찰하는 일반적인 방법이 아니라, 과도한 메모리 사용을 방지하는 방법이나 특정 버그에 대한 백스톱으로 사용하는 것이 가장 좋습니다.

## 약한 참조

객체에 대한 약한 참조는 객체를 활성화하기에 충분하지 않습니다. 오직 남아있는 참조(즉, 약한 참조에 의해 참조되는 객)가 약한 참조일 때 가비지 컬렉션은 자유롭게 참조를 파괴하고 메모리를 다른 용도로 재사용할 수 있습니다. 그러나, 객체가 실제로 파괴되기 전까지는 강력한 참조가 없더라도 약한 참조가 객체를 반환할 수 있습니다.

약한 참조의 주된 용도는 큰 객체를 유지하는 캐시 또는 매핑을 구현하는 것입니다. 여기서 큰 객체는 캐시 또는 매핑에 나타나기 때문에 단독으로 활성 상태로 유지되지 않는 것이 좋습니다.

예를 들어 `ArrayBuffer`로 표시되는 큰 이진 이미지 객체가 여거 개인 경우, 각 이미지에 이름을 연결할 수 있습니다. 기존 데이터 구조는 여기에 필요한 작업을 수행하지 않습니다.

- `Map`을 사용하여 이름을 이미지에 매핑하거나 이미지를 이름에 매핑하는 경우, 이미지 객체는 맵에서 값 또는 키로 나타나기 때문에 그대로 유지됩니다.
- `WeakMap`은 이 목적에도 적합하지 않습니다. `WeakMap`은 키에 대해 약하지만, 이 경우 값에 대해 약한 구조가 필요하기 때문입니다.

대신 `ArrayBuffer`를 가리키는 `WeakRef` 객체 값의 `Map`을 사용할 수 있습니다. 이렇게 하면 `ArrayBuffer` 객체가 메모리에 저장되는 시간이 그렇지 않은 경우보다 길어지는 것을 방지할 수 있습니다. 이미지 객체가 계속 있으면 찾을 수 있지만, 가비지 컬렉션 처리된다면 다시 생성합니다. 이러한 방식으로, 일부 상황에서는 메모리가 적게 사용됩니다.

```js
// 이 기술은 불완전합니다. 아래를 참조하십시오.
function makeWeakCached(f) {
  const cache = new Map();
  return (key) => {
    const ref = cache.get(key);
    if (ref) {
      const cached = ref.deref();
      if (cached !== undefined) return cached;
    }

    const fresh = f(key);
    cache.set(key, new WeakRef(fresh));
    return fresh;
  };
}

var getImageCached = makeWeakCached(getImage);
```

이 기술은 아무도 더 이상 보고 있지 않은 `ArrayBuffer`s에 많은 메모리를 소비하는 것을 피하는 데 도움이 될 수 있지만, 시간이 지남에 따라 `Map`이 이미 수집된 참조 대상이 있는 `WeakRef`를 가리키는 문자열로 채워지는 문제가 여전히 있습니다. 이 문제를 해결하는 한 가지 방법은 주기적으로 캐시를 청소하고 죽은 항목을 지우는 것입니다. 또 다른 방법은 파이널라이저를 사용하는 것입니다. 이에 대해서는 이 글의 끝에서 다시 설명하겠습니다.

이 예에서는 API의 몇 가지 요소를 볼 수 있습니다.

- `WeakRef` 생성자는 객체여야 하는 인수를 사용하고 이에 대한 약한 참조를 반환합니다.
- `WeakRef` 인스턴스에는 다음 두 값 중 하나를 반환하는 `deref` 메서드가 있습니다.
  여전히 사용 가능한 경우 생성자에 전달된 객체입니다.
  정의되지 않음, 객체를 가리키는 다른 항목이 없고 이미 가비지 컬렉트된 경우.

## 파이널라이저

파이널라이제이션은 프로그램 실행에 도달할 수 없게 된 객체가 된 후 정리할 코드를 실행입니다. 사용자 정의 파이널라이저는 여러 새로운 사용 사례를 사용하도록 설정하고 가비지 컬렉션을 관리할 때 메모리 누수가 발생할 수 있습니다.

## 또 다른 주의 사항

파이널라이저는 까다로운 작업이므로 피하는 것이 가장 좋습니다. 파이널라이저는 예상치 못한 시간에 호출되거나 전혀 호출되지 않을 수 있습니다. 예를 들어 브라우저 탭을 닫거나 프로세스 종료 시 호출되지 않습니다. 가비지 컬렉터가 작업을 수행하는 데 도움이 되지 않습니다. 오히려 그들은 방해물입니다. 또한 가비지 컬렉터의 내부 연산을 방해합니다. GC는 일정량을 할당한 후 필요하다고 판단되면 힙을 스캔하기로 결정합니다. 종료 가능한 객체는 거의 항상 가비지컬렉터에서 보이지 않는 할당량을 나타냅니다. 그 결과 종료 가능한 객체가 있는 시스템의 실제 리소스 사용량이 GC가 생각하는 것보다 높을 수 있습니다.

제안된 사양은 준수하는 구현이 어떤 이유로든 또는 이유 없이 종료 콜백 호출을 건너뛸 수 있도록 허용합니다. 많은 JS 환경 및 구현에서 종료 콜백을 생략할 수 있는 몇 가지 이유는 다음과 같습니다.

- 프로그램이 종료되면(예: 프로세스 종료, 탭 닫기, 페이지 탐색) 종료 콜백은 일반적으로 실행되지 않습니다. (토론: [#125](https://github.com/tc39/proposal-weakrefs/issues/125))
- FinalizationRegistry가 "dead"(거의 도달 불가능) 상태가 되면 이에 대해 등록된 종료 콜백이 실행되지 않을 수 있습니다. (토론: [#66](https://github.com/tc39/proposal-weakrefs/issues/66))

즉, 때때로 파이널라이저가 문제에 대한 정답입니다. 다음 예제는 파이널라이저가 없으면 해결하기 어려운 몇 가지 중요한 문제를 보여줍니다.

### 외부 자원 유출 탐지 및 대응

파이널라이저는 외부 리소스 누수를 찾을 수 있습니다. 예를 들어 열린 파일이 가비지 컬렉션 처리되는 경우 기본 운영 체제 리소스가 유출될 수 있습니다. OS는 프로세스가 종료될 때 리소스를 해제할 가능성이 높지만, 이러한 종류의 누출로 인해 장기 실행 프로세스가 결국 사용 가능한 파일 핸들 수를 소진할 수 있습니다. 이러한 버그를 잡기 위해 `FinalizationRegistry`를 사용하여 닫기 전에 가비지 수집되는 파일 객체의 존재를 기록할 수 있습니다.

`FinalizationRegistry` 클래스는 공통 파이널라이저 콜백에 등록된 객체 그룹을 나타냅니다. 이 구성은 개발자에게 닫히지 않은 파일에 대해 알리는 데 사용할 수 있습니다.

```js
class FileStream {
  static #cleanUp(heldValue) {
    console.error(`File leaked: ${file}!`);
  }

  static #finalizationGroup = new FinalizationRegistry(FileStream.#cleanUp);

  #file;

  constructor(fileName) {
    this.#file = new File(fileName);
    FileStream.#finalizationGroup.register(this, this.#file, this);
    // eagerly trigger async read of file contents into this.data
  }

  close() {
    FileStream.#finalizationGroup.unregister(this);
    File.close(this.#file);
    // other cleanup
  }

  async *[Symbol.iterator]() {
    // read data from this.#file
  }
}

const fs = new FileStream("path/to/some/file");

for await (const data of fs) {
  // do something
}
fs.close();
```

파이널라이저를 통해 파일을 자동으로 닫는 것은 좋지 않습니다. 이 기술은 신뢰할 수 없고 리소스 고갈로 이어질 수 있기 때문입니다. 대신 `try`/`finally`와 같은 리소스의 명시적 릴리스를 권장합니다. 이러한 이유로, 이 예제에서는 파일을 투명하게 닫지 않고 오류를 기록합니다.

다음은 전체 `FinalizationRegistry` API의 사용 예를 보여 줍니다.

- 객체는 `FinalizationRegistry`의 `register` 메서드를 호출하여 참조되는 파이널라이저를 가질 수 있습니다. 이 경우 `register` 메서드에 세 가지 인수가 전달됩니다.
  - 우리가 관심을 갖고 있는 수명을 가진 객체입니다. 여기서 `this`는 `FileStream` 객체입니다.
  - 파이널라이저에서 객체를 정리할 때 해당 객체를 나타내는 데 사용되는 보류 값입니다. 여기서 홀드 값은 기본 File 객체입니다. (참고: 약한 대상에 대한 참조가 있으면 대상을 수집할 수 없기 때문에 보류 값이 있으면 안 됩니다.)
  - 파이널라이저가 더 이상 필요하지 않을 때 `unregister` 메서드에 전달되는 등록 취소 토큰입니다. 여기에서는 `FinalizationRegistry`가 등록 취소 토큰에 대한 강력한 참조를 보유하지 않기 때문에 `this`는 `FileStream` 객체 자신입니다.
- `FinalizationRegistry` 생성자는 콜백을 인수로 사용하여 호출됩니다. 이 콜백은 보류된 값으로 호출됩니다.

파이널라이저 콜백은 객체가 가비지 컬렉트 처리된 후에 호출되며, 이 패턴을 "post-mortem"이라고도 합니다. 이러한 이유로 `FinalizerRegistry` 콜백은 원래 객체가 아닌 별도의 보유 값으로 호출됩니다. 객체는 이미 사라졌으므로 사용할 수 없습니다.

위의 코드 샘플에서, `fs` 객체는 `close` 메서드의 일부로 등록 취소됩니다. 즉, 파이널라이저가 호출되지 않고 오류 로그 문이 없습니다. 등록 취소는 다른 종류의 "double free" 시나리오를 방지하는 데 유용할 수 있습니다.

## WebAssembly 메모리를 JavaScript에 노출

WebAssembly의 무언가에 의해 지원되는 JavaScript 객체가 있을 때마다 객체가 사라질 때 사용자 지정 정리 코드(WebAssembly 또는 JavaScript에서)를 실행하고 싶을 수 있습니다. [이전 제안](https://github.com/lars-t-hansen/moz-sandbox/blob/master/refmap/ReferenceMap.md)은 약한 참조 모음을 노출했으며, 아직 살아 있는지 주기적으로 확인하여 마무리 작업을 수행할 수 있다는 생각을 가지고 있습니다. 이 제안에는 개발자가 반복적인 스캔을 피할 수 있는 방법을 제공하기 위해 파이널라이저에 대한 일급 개념이 포함되어 있습니다.

예를 들어 큰 `WebAssembly.Memory` 객체가 있고 고정 크기 부분을 JavaScript에 제공하기 위해 할당자를 생성하려는 경우를 상상해 보십시오. 경우에 따라 이 메모리를 명시적으로 해제하는 것이 실용적일 수 있지만 일반적으로 JavaScript 코드는 소유권에 대해 생각하지 않고 참조를 자유롭게 전달합니다. 따라서 이 메모리를 해제하기 위해 가비지 컬렉터에 의존할 수 있는 것이 도움이 됩니다. `FinalizationRegistry`를 사용하여 메모리를 해제할 수 있습니다.

```js
function makeAllocator(size, length) {
  const freeList = Array.from({ length }, (v, i) => size * i);
  const memory = new ArrayBuffer(size * length);
  const finalizationGroup = new FinalizationRegistry((held) => freeList.unshift(held));
  return { memory, size, freeList, finalizationGroup };
}

function allocate(allocator) {
  const { memory, size, freeList, finalizationGroup } = allocator;
  if (freeList.length === 0) throw new RangeError("out of memory");
  const index = freeList.shift();
  const buffer = new Uint8Array(memory, index * size, size);
  finalizationGroup.register(buffer, index);
  return buffer;
}
```

파이널라이저를 통해 파일을 자동으로 닫는 것은 좋지 않습니다. 이 기술은 신뢰할 수 없고 리소스 고갈로 이어질 수 있기 때문입니다. 대신 `try`/`finally`와 같은 것들을 통해 리소스의 명시적 릴리스하는 것을 권장합니다. 이러한 이유로 이 예제에서는 파일을 투명하게 닫지 않고 오류를 기록합니다.

이 예는 전체 `FinalizationRegistry` API의 사용법을 보여줍니다.

- 객체는 `FinalizationRegistry`의 등록 메서드를 호출하여 참조되는 파이널라이저를 가질 수 있습니다. 이 경우 세 개의 인수가 `register` 메소드에 전달됩니다.
- 객체는 우리가 관심을 갖고 있는 수명을 가진 객체입니다. 여기에서 `this`는 `FileStream` 객체입니다.
- 파이널라이저에서 객체를 정리할 때 해당 객체를 나타내는 데 사용되는 보류 값입니다. 여기서 보유된 값은 기본 `File` 객체입니다. (참고: 보유한 값에는 약한 대상에 대한 참조가 없어야 합니다. 그렇게 하면 대상이 수집되지 않습니다.)
- 파이널라이저가 더 이상 필요하지 않을 때 `unregister` 메서드에 전달되는 등록 취소 토큰입니다. 여기에서는 `FinalizationRegistry`가 등록 취소 토큰에 대한 강력한 참조를 보유하지 않기 때문에 FileStream 객체 자체를 `this`로 사용합니다.

- `FinalizationRegistry` 생성자는 콜백을 인수로 사용하여 호출됩니다. 이 콜백은 보류된 값으로 호출됩니다.

파이널라이저 콜백은 객체가 가비지 컬렉트 처리된 후에 호출되며, 이 패턴을 "post-mortem"이라고도 합니다. 이러한 이유로 `FinalizerRegistry` 콜백은 원래 객체가 아닌 별도의 보유 값으로 호출됩니다. 객체는 이미 사라졌으므로 사용할 수 없습니다.

`FinalizationRegistry` 콜백은 관련 보류 값을 사용하여 잠재적으로 여러 번 호출되며, 각 등록 객체가 비활성화될 때마다 한 번씩 호출됩니다. 콜백은 다른 JavaScript 코드를 실행하는 동안 호출되지 않고 "회전 사이"에 호출됩니다. 엔진은 호출 일괄 처리가 가능하며, 호출 일괄 처리는 약속이 모두 처리된 후에만 실행됩니다. 엔진이 콜백을 배치하는 방식은 구현에 따라 다르며, 이러한 콜백이 프로미스 작업과 어떻게 상호 작용하는지에 의존해서는 안 됩니다.

## 크로스 워커 프록시의 메모리 누수 방지

[웹 워커](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)가 있는 브라우저에서 프로그래머는 여러 JavaScript 프로세스가 있는 시스템을 만들 수 있으므로 여러 개의 격리된 힙과 여러 가비지 컬렉터가 있습니다. 개발자는 예를 들어 작업자에서 DOM을 조작할 수 있도록 다른 프로세스에서 "원격" 객체를 처리할 수 있기를 원합니다. 이 문제에 대한 일반적인 해결책은 프록시 라이브러리를 구현하는 것입니다. 두 가지 예는 [Comlink](https://github.com/GoogleChromeLabs/comlink)와 [via.js](https://github.com/AshleyScirra/via.js)입니다.

프록시와 프로세스가 있는 시스템에서, 원격 프록시는 로컬 객체를 활성 상태로 유지해야 하며, 그 반대의 경우도 마찬가지입니다. 일반적으로 이것은 각 프로세스가 프록시된 각 로컬 객체에 원격 설명자를 매핑하는 테이블을 유지하도록 하여 구현됩니다. 그러나 더 이상 원격 프록시가 없으면 이러한 항목을 테이블에서 제거해야 합니다. WeakRef 제안의 최종화 기능을 통해 via.js와 같은 라이브러리는 프록시가 수집 가능해지면 메시지를 보내 객체의 프로세스에 객체가 더 이상 원격으로 참조되지 않음을 알릴 수 있습니다. 종료가 없으면 via.js 및 기타 원격 프록시 시스템은 메모리 누수 또는 수동 리소스 관리로 대체되어야 합니다.

## `WeakRef` 객체와 `FinalizationRegistry` 객체를 함께 사용하기

때때로 `WeakRef`와 `FinalizationRegistry`를 함께 사용하는 것이 좋습니다. 약하게 값을 가리키고 해당 값이 사라질 때 어떤 종류의 정리를 수행하려는 여러 종류의 데이터 구조가 있습니다. 그러나 약한 참조는 객체가 수집될 때 지워지지만 관련 `FinalizationRegistry` 정리 처리기는 이후 작업에서만 실행됩니다. 동일한 객체에서 약한 참조 및 종료자를 사용하는 프로그래밍 관용구는 간격을 염두에 두어야 합니다.

## 약한 캐시

이 README의 초기 예제에서 `makeWeakCached`는 값이 `WeakRef`인스턴스로 래핑된 `Map`을 사용했습니다. 이를 통해 캐시된 값을 수집할 수 있었지만 `Map`의 항목 형식으로 메모리가 누수되었습니다. `makeWeakCached`의 보다 완전한 버전은 파이널라이저를 사용하여 이 메모리 누수를 해결합니다.

```js
// 메모리가 누출되지 않는 수정 버전입니다.
function makeWeakCached(f) {
  const cache = new Map();
  const cleanup = new FinalizationRegistry((key) => {
    // 동시성 고려 사항에 대해서는 아래 참고 사항을 참조하십시오.
    const ref = cache.get(key);
    if (ref && !ref.deref()) cache.delete(key);
  });

  return (key) => {
    const ref = cache.get(key);
    if (ref) {
      const cached = ref.deref();
      // 동시성 고려 사항에 대해서는 아래 참고 사항을 참조하십시오.
      if (cached !== undefined) return cached;
    }

    const fresh = f(key);
    cache.set(key, new WeakRef(fresh));
    cleanup.register(fresh, key);
    return fresh;
  };
}

var getImageCached = makeWeakCached(getImage);
```

이 예제는 파이널라이저에 대한 두 가지 중요한 고려 사항을 보여줍니다.

파이널라이저는 "메인" 프로그램과 정리 콜백 사이에 동시성을 도입합니다. 취약한 캐시 정리 기능은 활성 항목이 삭제되지 않도록 "메인" 프로그램이 캐시된 값이 수집된 시간과 정리 기능이 실행되는 시간 사이에 항목을 맵에 다시 추가했는지 확인해야 합니다. 마찬가지로 참조 맵에서 키를 조회할 때 값이 수집되었지만 정리 콜백이 아직 실행되지 않았을 가능성이 있습니다.
파이널라이저는 놀라운 방식으로 작동할 수 있으므로 위의 `makeWeakCached`와 같이 오용을 방지하는 신중한 추상화 뒤에 배치하는 것이 가장 좋습니다. 코드 기반 전체에 퍼져 있는 `FinalizationRegistry`의 풍부한 사용은 코드 냄새입니다.

## 반복 가능한 WeakMap

특정 고급 사례에서 `WeakRef` 객체와 `FinalizationRegistry` 객체는 매우 효과적인 보완물이 될 수 있습니다. 예를 들어 WeakMaps에는 반복하거나 지울 수 없다는 제한이 있습니다. WeakRefs 제안은 "반복 가능 + 삭제 가능 WeakMap" 생성을 가능하게 합니다.

이러한 "반복 가능한 WeakMaps"는 라이브 HTMLCollections를 반환하는 `document.getElementsByClassName` 또는 `document.getElementsByTagName`과 같은 기존 DOM API에서 이미 사용되고 있습니다. 이와 같이 `WeakRef` 제안은 [기존 웹 플랫폼 기능을 설명하는 데 도움이 되는 누락된 기능을 추가합니다.](https://extensiblewebmanifesto.org/) [문제 #17은 유사한 사용 사례를 설명합니다.](https://github.com/tc39/proposal-weakrefs/issues/17)

```js
class IterableWeakMap {
  #weakMap = new WeakMap();
  #refSet = new Set();
  #finalizationGroup = new FinalizationRegistry(IterableWeakMap.#cleanup);

  static #cleanup({ set, ref }) {
    set.delete(ref);
  }

  constructor(iterable) {
    for (const [key, value] of iterable) {
      this.set(key, value);
    }
  }

  set(key, value) {
    const ref = new WeakRef(key);

    this.#weakMap.set(key, { value, ref });
    this.#refSet.add(ref);
    this.#finalizationGroup.register(
      key,
      {
        set: this.#refSet,
        ref,
      },
      ref
    );
  }

  get(key) {
    const entry = this.#weakMap.get(key);
    return entry && entry.value;
  }

  delete(key) {
    const entry = this.#weakMap.get(key);
    if (!entry) {
      return false;
    }

    this.#weakMap.delete(key);
    this.#refSet.delete(entry.ref);
    this.#finalizationGroup.unregister(entry.ref);
    return true;
  }

  *[Symbol.iterator]() {
    for (const ref of this.#refSet) {
      const key = ref.deref();
      if (!key) continue;
      const { value } = this.#weakMap.get(key);
      yield [key, value];
    }
  }

  entries() {
    return this[Symbol.iterator]();
  }

  *keys() {
    for (const [key, value] of this) {
      yield key;
    }
  }

  *values() {
    for (const [key, value] of this) {
      yield value;
    }
  }
}

const key1 = { a: 1 };
const key2 = { b: 2 };
const keyValuePairs = [
  [key1, "foo"],
  [key2, "bar"],
];
const map = new IterableWeakMap(keyValuePairs);

for (const [key, value] of map) {
  console.log(`key: ${JSON.stringify(key)}, value: ${value}`);
}
// key: {"a":1}, value: foo
// key: {"b":2}, value: bar

for (const key of map.keys()) {
  console.log(`key: ${JSON.stringify(key)}`);
}
// key: {"a":1}
// key: {"b":2}

for (const value of map.values()) {
  console.log(`value: ${value}`);
}
// value: foo
// value: bar

map.get(key1);
// → foo

map.delete(key1);
// → true

for (const key of map.keys()) {
  console.log(`key: ${JSON.stringify(key)}`);
}
// key: {"b":2}
```

이 반복 가능한 WeakMap과 같은 강력한 구조를 사용할 때는 주의해야 합니다. 이와 유사한 의미론으로 설계된 웹 API는 레거시 실수로 널리 간주됩니다. 애플리케이션에서 가비지 컬렉션 타이밍을 노출하지 않고 다른 방법으로 문제를 합리적으로 해결할 수 없는 경우에만 약한 참조 및 파이널라이저를 사용하는 것이 가장 좋습니다.

### WeakMaps는 기본으로 남아 있습니다.

단순히 `WeakRef` 객체가 있는 `Map`을 키로 사용하여 `WeakMap`을 재생성하는 것은 불가능합니다. 이러한 맵의 값이 해당 키를 참조하는 경우 항목을 수집할 수 없습니다. 실제 `WeakMap` 구현은 가비지 컬렉터가 이러한 주기를 처리할 수 있도록 [ephemeron](http://www.jucs.org/jucs_14_21/eliminating_cycles_in_weak/jucs_14_21_3481_3497_barros.pdf)을 사용합니다.
이것이 [`IterableWeakMap` 예제](https://github.com/tc39/proposal-weakrefs/tree/master#iterable-weakmaps)가 `WeakMap`에 값을 유지하고 반복을 위해 `WeakRef`만 `Set`에 넣는 이유입니다. 값이 대신 `this.#refMap.set(ref, value)`와 같은 `Map`에 추가된 경우 다음이 누출되었을 수 있습니다.

```js
let key = { foo: "bar" };
const map = new IterableWeakMap(key, { data: 123, key });
```

## 종료자 예약 및 여러 `.deref()` 호출의 일관성

구현에서 종료 콜백을 나중에 호출하거나 전혀 호출하지 않을 수 있는 몇 가지 조건이 있습니다. WeakRefs 제안은 호스트 환경(예: HTML, Node.js)과 함께 작동하여 `FinalizationRegistry` 콜백이 예약되는 방식을 정확하게 정의합니다. 그 의도는 가비지 컬렉션의 관찰 가능성의 세분성을 거칠게 만들어 프로그램이 특정 구현의 세부 사항에 너무 밀접하게 의존할 가능성을 줄이는 것입니다.

[HTML에 대한 정의](https://github.com/whatwg/html/pull/4571)에서 콜백은 [이벤트 루프에서 대기 중인 작업](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)에서 예약됩니다. 이것이 의미하는 바는 웹에서 파이널라이저는 동기식 JavaScript를 중단하지 않으며 프로미스 반응에도 중간에 배치되지 않는다는 것입니다. 대신 JavaScript가 이벤트 루프에 양보한 후에만 실행됩니다.

WeakRefs 제안은 `WeakRef.prototype.deref()`에 대한 여러 호출이 특정 시간 범위 내에서 동일한 결과를 반환하도록 보장합니다. 모두 정의되지 않은 반환 또는 모두 객체를 반환해야 합니다. HTML에서 이 시간 범위는 모든 프로미스 반응이 실행된 후 JavaScript 실행 스택이 비었을 때 HTML이 마이크로태스크 체크포인트를 수행하는 [마이크로태스크 체크포인트](https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint)까지 실행됩니다.

## Historical documents

- [OLD 제안](https://github.com/tc39/proposal-weakrefs/blob/master/history/weakrefs.md)의 이전 버전에 대한 설명
- [WeakRefGroups](https://github.com/tc39/proposal-weakrefs/wiki/WeakRefGroups): 이전에 제안된 인터페이스
- 이전 제안 초안에 대한 [Previous Spec-text](https://github.com/tc39/proposal-weakrefs/blob/master/history/spec.md)
- [Slides](https://github.com/tc39/proposal-weakrefs/blob/master/history/Weak%20References%20for%20EcmaScript.pdf): 이 제안서에 포함된 몇 가지 디자인 고려 사항

## 투사

- Dean Tribble
- Mark Miller
- Till Schneidereit
- Sathya Gunasekaran
- Daniel Ehrenberg

## 상태

- WeakRefs are now Stage 4
- Chrome 84
- Firefox 79
- Safari 14.1
- [Available in Moddable XS](https://github.com/Moddable-OpenSource/moddable-xst/releases/tag/v9.0.1)
