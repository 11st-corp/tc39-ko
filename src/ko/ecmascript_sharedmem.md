# ecmascript_sharedmem

이는 ECMAScript용 공유 메모리(Shared Memory) 및 아토믹(Atomic) 사양으로, ECMAScript 승인 과정에서 현재 4단계에 있는 제안서입니다.

**중요 참고사항**: 2017년 2월부로 이 제안은 [ECMAScript 사양](https://tc39.github.io/ecma262/)으로 통합되었습니다. 버그 수정 및 발전사항은 해당 문서에서 발생하며, 현재 저장소의 산문은 점점 더 무관해질 것입니다. 버그가 발견되면 먼저 ECMAScript 사양을 확인하고 버그가 해당 버전에도 있다면 이 저장소가 아닌 [ecma262 버그 트래커](https://github.com/tc39/ecma262/issues)에 버그를 기록해주시기 바랍니다.

## 문서 및 기타 자료

- [포맷된 사양](http://tc39.github.io/ecmascript_sharedmem/shmem.html)
- [DOM 지원 사양](http://tc39.github.io/ecmascript_sharedmem/dom_shmem.html)
- [asm.js 동반 사양](http://tc39.github.io/ecmascript_sharedmem/asmjs_shmem.html)
- [간단한 자습서 소개](https://github.com/tc39/proposal-ecmascript-sharedmem/blob/main/TUTORIAL.md)
- [데모 프로그램 및 기타 예제](https://github.com/tc39/proposal-ecmascript-sharedmem/blob/main/DEMOS.md)
- [자주 묻는 질문](https://github.com/tc39/proposal-ecmascript-sharedmem/blob/main/FAQ.md)
- [고수준의 설계 문제, 횡단관심사 문제, 보안 문제 등](https://github.com/tc39/proposal-ecmascript-sharedmem/blob/main/DISCUSSION.md)
- Ecma TC39에 제공되는 프레젠테이션용 슬라이드:
    - [2015년 9월](https://github.com/tc39/ecmascript_sharedmem/blob/master/tc39/presentation-sept-2015.odp)
    - [2016년 1월](https://github.com/tc39/ecmascript_sharedmem/blob/master/tc39/presentation-jan-2016.odp)

## 구현

Firefox, Chrome 및 WebKit는 제안서의 프로토타입 구현과 함께 제공되며, 이들 대부분이 호환됩니다.

- 이 기능은 Firefox Nightly에서 기본적으로 사용되며, Firefox 46부터는 Developer Edition, Aurora, Beta 및 Release 사용자가 `about:config`를 방문하여 `javascript.options.shared_memory` 옵션을 `true`로 설정할 수 있습니다.
- 이 기능은 Chrome에서 기본적으로 해제되어 있지만 명령줄 옵션 `--js-sys=--sys-shared-arraybuffer` 및 `--enable-blink-feature=SharedArrayBuffer`를 전달하여 활성화할 수 있습니다(Chrome 48에서 작동하는 것으로 알려져 있음)
- 이 기능은 STP 20 기준으로 WebKit Nightly 및 Safari Technology Preview에서 기본적으로 활성화됩니다.

## 기타

사양의 소스는 tc39/ 하위 디렉터리에 있으며 포맷된 버전은 `format.sh` 스크립트로 생성됩니다.