# 프리셋 선택·파일 소유권·선행 작업

요청을 직접 받은 pane이 조정자다. 작업 분해, 계약 파일 전달, 임시 탭 생성·관찰, 결과 취합·검증·종료를 담당한다. 워커는 계약 범위만 수행하고 콜백으로 보고한다.

## 프리셋 선택 기준

| 프리셋 | kind | 모델·인자 | sandboxed | 선택 기준 |
| --- | --- | --- | --- | --- |
| sol | codex | `-m gpt-6.1-sol -c model_reasoning_effort="medium"` | true | 일반 구현·리뷰 |
| luna | codex | `-m gpt-6-luna -c model_reasoning_effort="max"` | true | 설계·복잡한 리팩터링·정밀 리뷰 |
| gf | agy | Gemini 3.8 Flash · `--effort medium` | false | 테스트 실행이 필요한 구현·통합 수정 |
| ga | agy | Gemini 4 Argon Medium (`gemini-4-argon-medium`) | false | 사용자가 다시 요청하기 전까지 호출하지 않음(worker.py exclude) |
| ds | opencode | `--model opencode-go/deepseek-v4.1-flash` | false | 테스트 실행이 필요한 구현·통합 수정 |
| grok | opencode | Grok 4.6 xAI · high | false | 테스트 실행이 필요한 구현·통합 수정, 수동 탭 운영 |
| mimo | opencode | MiMo-V2.6-Flash OpenCode Go | false | 미검증 |
| muse | opencode | Muse Spark 1.3 Contributor OpenCode Go | false | 미검증 |

- `herdr agent start --kind <kind>`의 kind는 프리셋 정의에서 읽는다. codex로 고정하지 않는다.
- 일반 agy 실행은 `--effort high --model <Gemini 3.8 모델 id>`를 사용한다. 조정자는 첫 실행 때 모델 id를 확인해 프리셋 파일의 교체 가능한 상수에 채운다. ds는 아래 검증된 picker 절차와 최종 상태 라벨을 따른다.
- `sandboxed: true`인 sol/luna는 Vitest 미실행·조정자 테스트 실행·callback fallback 감시를 계약에 적는다. agy/ds에는 codex 전용 제약을 일괄 적용하지 않는다.
- 프리셋은 선택 기준이며 영구 전담 역할이 아니다. 실행 중 모델·effort를 바꾸지 않는다.
- 새 작업은 새 별도 탭으로 시작한다. 조정자 탭 split은 금지하며 no-focus·저장소 cwd를 유지한다.
- 동시 워커 최대 5개, 같은 프리셋은 하나만 연다. open은 상태 파일·herdr agent list에서 중복을 확인하고 오류 또는 기존 이름을 안내한다. 다른 이름으로 중복을 우회하지 않는다.
- 기존 작업의 검증·close 후 새 작업 탭을 연다. working/blocked/unknown에 새 작업을 얹지 않는다. 작은 요청에 불필요한 워커를 채우지 않는다.
- 사용량 한도로 닫히면 사용자 새 지침을 기다리고 임의 대체 모델로 계속하지 않는다.

## 파일 소유권

- 한 파일의 작성자는 동시에 한 명이다.
- 공유 파일은 조정자가 먼저 인터페이스·계약을 정하고 단일 작성자가 처리한다.
- 공유 진입 파일(src/infra/worker.ts 등)은 한 명만 작성하고, 병행 작업의 라우트 연결은 조정자가 통합 시 추가한다.
- 계약에 허용 파일 목록을 명시하고, 목록 밖 파일은 수정하지 않는다.
- AGENTS.md/CLAUDE.md/README.md는 조정자와 담당 에이전트 모두 편집하지 않는다. 사용자가 해당 파일 편집을 명시적으로 요청한 경우에만 그 범위를 따른다.

## 독립성·직렬화

- 독립: 서로 다른 파일/모듈이며 인터페이스가 이미 고정된 작업 → 병렬 배정.
- 직렬화: 같은 파일, 공유 인터페이스 미정, 한 작업의 출력이 다음 입력 → 순차 배정(선행 결과 확정 후 후행).
- 충돌 가능 작업은 순차 처리하고, 공통 인터페이스는 먼저 정한다.

## 예시

요청: "공통 타입을 정의하고 모듈 A의 domain 로직과 모듈 B의 ui 컴포넌트를 추가"

1. 조정자: 공통 타입 인터페이스를 먼저 확정한다(선행).
2. 에이전트1: `src/domain/a.ts` 작성(허용 파일 단독 소유).
3. 에이전트2: `src/ui/b.tsx` 작성(허용 파일 단독 소유, 인터페이스 확정 후 병렬).
4. 공통 타입 파일은 단일 작성자(조정자 또는 한 에이전트)가 소유하고 나머지는 읽기만 한다.


## 검증된 모델 선택 절차

모델 picker가 `Select model`을 출력할 때까지 기다린 뒤 검색한다. 검색 결과의 전체 모델 라벨을 확인하고 선택한 후 상태 줄 전체가 목표 라벨과 일치하는지 검증한다. 대기 timeout이나 라벨 불일치는 위임 실패로 중단하고 open 탭을 정리한다. ds `post_start`는 화면 확인 없이 입력하면 선택 창 상태와 어긋날 수 있으므로, 수동 탭을 쓰거나 선택 창 상태를 확인한 뒤 입력한다.

| 프리셋 | 검색·선택 절차 | 최종 상태 라벨 |
| --- | --- | --- |
| grok | 수동 탭에서 `Grok 4.6 xAI` 검색·선택 후 `ctrl+t` | `Grok 4.6 xAI · high` |
| ds | `DeepSeek V4.1 Flash OpenCode Go` 검색·선택 | `DeepSeek V4.1 Flash OpenCode Go · max` |

## 용량 초과 재시도

`ttft_admission_refused` 또는 `at capacity`면 같은 워커에 현재 작업 상태를 이어서 진행하도록 최대 3회 재요청한다. 대기는 10초 → 20초 → 40초며, 완료한 동작을 반복하지 않는다. 모두 거절되거나 전체 대기 timeout을 넘기면 외부 실패로 보고하고 프리셋을 영구 제외하지 않는다.
