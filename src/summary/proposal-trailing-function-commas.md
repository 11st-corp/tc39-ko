## PR 1
변수명 지을때 clownsEverywhere라는 변수명이 있었는데 clown을 싫어한다는 어떤 사람이 puppies로 변경해달라고 했는데, clown의 의미가 지양해야 하는 함수명을 의미한다고 해서 둘이 타협한 히스토리가 있다.

<img width="500" alt="실제 PR에 사용된 이미지" src="https://user-images.githubusercontent.com/76726411/226163074-f1aecc30-2db4-4eea-8016-1f27b7d86ae0.png">

## Issues 1
- A : `(function(a,)).length`는 어떻게 되나요? SparesArray처럼 동작하나요? 혹은 parser가 trailing comma를 그냥 무시하나요?
    - sparesArray : 각 인덱스 사이에 공간을 만들 수 있는 배열
        - 1 ~ 10번에 아이템들이 있고, 11 ~ 20번은 비우고, 21 ~ 30번에 아이템들을 넣을 수 있음

- B : parser에 대한 간단한 변경 사항인데 왜 그것이 .length에 대한 무언가를 바꿔야 하죠?

- A : 함수의 길이는 명명된 인수의 수를 반영합니다. 당신의 대답은 그것에 대해 생각해 본 적이 없거나, 의도한 대답이 `(function(a, )).length === (function(a)).length` 이겠죠.
    
    ```jsx
    // 코드를 보면 이해를 할 수 있음
    console.log((function(a){}).length) // 1
    console.log((function(a,b,c){}).length) // 3
    
    // 아래 코드에 대한 명확성을 보장해야 한다는 주장
    console.log((function(a,){}).length) // 1
    ```
    
    둘 중 어느 경우든, **제안된 표준이 완전하고 모호하지 않은 것이 중요합니다.** 그렇지 않으면 구현이 다르게 나타나 개발자에게 심각한 문제가 발생할 수 있어요.
    

이 issue로 제안서에 다음 문장이 추가되었음

- Note that this proposal is exclusively about grammar and makes no changes to semantics, therefore the presence of a trailing comma has no effect on things like `<<function>>.length`.

## Issues 2
- A. 언어의 문법은 외부 버전 관리 시스템의 관행에 맞춰서는 안 돼요. 만약 사람들이 blame 주석이 그대로 남아 있는 것에 대해 걱정한다면, 그들은 끝 대신 분할된 줄의 시작 부분에 쉼표를 배치함으로써 코딩 스타일을 바꿔야하고 언어 문법의 변경을 요청하지 말아야 해요.
    
    ```jsx
    function something( arg1
      , arg2
      , arg3
    )
    ```
    
    저는 이 부분을 폐기하고 언어 문법을 가능한 한 정상적으로 유지할 것을 제안해요.
    
- B: 이 제안서는 몇 년 전에 모든 주요 엔진에 적용되었기 때문에 이 시점에서는 잊혀졌어요. 잘 작동하는 것 같고 그 기간 동안 구체적인 문제가 발생한 것은 보지 못했어요.
하지만 당신이 겪고 있는 문제에 대해 좀 더 구체적으로 말씀해 주시겠어요? 당신은 이것에 대한 필요성이 없다는 것을 제안하고 있는 건가요? 아니면 그것이 당신에게 구체적인 문제를 일으켰나요?
- A: 변경 내용 자체에는 구체적인 문제가 없어요.
언어적인 관점에서 이 제안서는 완전히 말이 안 되는 것처럼 보여요. 특히 그것에 대한 명시된 이유가 언어나 그것의 기능에 내부적이지 않을 때는 더욱 그래요. 언어의 기능을 위해 이것을 구현할 이유가 없고 오로지 매우 구체적인 외부 작업 흐름을 충족시키기 위한 것이라면, 언어 사양에 포함되지 않아요.
    
    또한 몇 년 전에 이미 적용되었다면 이미 표준화가 되어야 하는데 (ES6에서) 이 역시 일어나지 않았어요. 사실 아직 초안인것 아닌가요? 
    
- B: ES2017에 적용되었어요. 이 저장소는 역사적 기록을 위해 남아있어요.
    
    이 기능에 대한 당신의 싫은 감정을 이해해요. 사실 이는 stage들을 옮겨가면서 토론이 이뤄졌던 내용이에요.
    몇몇은 당신의 생각에 동의하고(유용하지 않다고 생각), 몇몇은 동의하지 않았어요(유용하다고 생각).
    
    제안 과정의 일부는 제안을 실행하는 데 중요한 위험이나 단점이 있는지 확인하는 것이에요. 그 과정에서 구현과 문법 사양 수정이 모두 사소한 것임이 분명해졌어요. 또한 모든 사람들이 이것을 유용하다고 생각하지는 않지만, 그것을 적용하는 것이 다른 사람들에게 피해를 주지 않음이 분명해졌어요. 그래서 우리는 타협할 필요가 없었어요.
    
    유용하지 않다고 생각되면 이 기능을 사용하지 않는 것이 좋아요.
 
