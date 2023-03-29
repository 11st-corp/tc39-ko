# proposal-trailing-function-commas

## 함수 매개 변수 목록에서 trailing commas를 허용하는 제안

일부 코드베이스/스타일 가이드에서는 함수 호출과 정의가 다음과 같은 스타일로 여러 줄에 걸쳐 분리되는 시나리오가 있습니다.
```js
1: function clownPuppiesEverywhere(
2:   param1,
3:   param2
4: ) { /* ... */ }
5: 
6: clownPuppiesEverywhere(
7:   'foo',
8:   'bar'
9: );
```
이러한 경우 다른 코드 기여자가 나타나서 이러한 매개 변수 목록 중 하나에 다른 매개 변수를 추가하면 다음과 같이 두 개의 줄을 업데이트 해야 합니다.
```js
1: function clownPuppiesEverywhere(
2:   param1,
3:   param2, // 콤마를 추가하기 위해 업데이트 됨
4:   param3  // 새로운 파라미터를 추가하기 위해 업데이트 됨
5: ) { /* ... */ }
6: 
7: clownPuppiesEverywhere(
8:   'foo',
9:   'bar', // 콤마를 추가하기 위해 업데이트 됨
10:  'baz'  // 새로운 파라미터를 추가하기 위해 업데이트 됨
11: );
```
버전제어 시스템(git, subversion, mercurial 등)이 관리하는 코드에서 이런 변경이 일어날 때 3번째 줄과 9번째 줄에 대한 blame/annotation 코드 기록 정보가 쉼표를 추가한 사람(기존에 매개변수를 추가한 사람이 아닌)을 가리키도록 업데이트됩니다.

이 문제를 완화하기 위해, 몇몇 다른 언어들(Python, D, Hack, …다른 언어들)은 매개 변수 목록에서 trailing comma를 허용하는 문법 지원을 추가하였습니다. 이는 코드 기여자들이 줄별 매개 변수 목록에서 항상 매개변수 추가의 끝에 trailing comma를 포함할 수 있게 하여 코드 기여 문제에 대해 다시는 고민할 필요가 없도록 했습니다.
```js
1: function clownPuppiesEverywhere(
2:   param1,
3:   param2, // 다음 매개 변수는 이 줄을 수정할 필요 없이 새로운 줄만 추가하면 됩니다.
5: ) { /* ... */ }
6: 
7: clownPuppiesEverywhere(
8:   'foo',
9:   'bar', // 다음 매개 변수는 이 줄을 수정할 필요 없이 새로운 줄만 추가하면 됩니다.
11: );
```
참고로 본 제안은 오로지 문법적인 것이고 의미론적으로는 변경되는게 없습니다. 따라서 trailing comma의 존재는 `<<funciont>>.length` 같은 것들에 영향을 미치지 않습니다.

본 저장소에는 제안서 슬라이드, 매개 변수 목록에서 trailing comma를 허용하기 위해 해킹된(hacked) esprima<sup>[1][]</sup> 버전, 빌드 단계에서 trailing comma를 ES5-compatible non-trailing comma로 변환하는 것이 가능하다는 것을 보여주는 매우 간단한 CLI 유틸리티가 포함되어 있습니다.

CLI의 경우 디스크에서 읽을 단일 파일 이름 인수를 지정하거나 원본 텍스트를 CLI에 pipe<sup>[2][]</sup>할 수 있습니다.
## 스펙 테스트
https://tc39.github.io/proposal-trailing-function-commas/ 를 보세요.

---
[1]: #1
[2]: #2

#### 1

> [Esprima](https://esprima.org)는 ECMAScript로 작성된 고성능 표준 호환 ECMAScript 파서입니다.

#### 2

> <a name='note2'>2.</a> pipe는 UNIX system [IPC](https://en.wikipedia.org/wiki/Inter-process_communication)의 가장 오래된 형태로써, 모든 UNIX 시스템에 제공됩니다. 한 process의 output을 다른 process의 Input으로 넘겨주는 통신방법.
