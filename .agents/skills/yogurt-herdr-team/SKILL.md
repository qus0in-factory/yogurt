---
name: yogurt-herdr-team
description: 사용자가 Herdr로 beam, glm, claude, agy에게 작업을 분배하거나 결과를 취합하도록 요청할 때 적용한다. 일반적인 단독 작업에서 자동으로 다른 에이전트를 시작하지 않는다.
---

# Herdr 팀 작업 분배

저장소 AGENTS.md를 읽고 요청 범위와 5분 제한을 지킨다. 실행 전 `test "${HERDR_ENV:-}" = 1`을 확인한다. 실패하면 Herdr 세션을 조회하거나 제어하지 말고 중단 이유를 알린다.

## 현재 세션 확인

1. 설치된 herdr 스킬을 읽고 `herdr --help`, `herdr agent`, `herdr agent list`로 현재 CLI와 대상 상태를 확인한다. bare `herdr`는 실행하지 않는다.
2. 이름이 없으면 명시적 pane ID로 `herdr agent read <target> --source recent-unwrapped --lines 50`을 실행한다. 화면의 모델·cwd를 확인해 beam, glm, claude, agy를 식별한다. pane 순서·ID·모델을 추측하지 않는다.
3. 실제 모델 종류와 사용자가 부른 이름은 다를 수 있다. Beam/GLM이 OpenCode 안에서 실행되는 경우 kind는 opencode다. 실행 중 모델·effort는 변경하지 않는다.
4. 확인된 idle/done 대상만 사용한다. 필요하면 `herdr agent rename <pane-id> <unique-name>`으로 식별한다. working에는 중복 작업을 투입하지 않는다. blocked/unknown은 get/read로 확인하고 승인·질문 UI에 임의로 답하지 않는다.
5. 없는 에이전트를 임의의 대체 모델로 실행하지 않는다. 새 pane·실행이 필요한 경우 herdr 스킬의 현재 디렉터리·동일 탭·no-focus 규칙을 따른다. 사용 가능한 kind로 사용자가 지정한 모델을 보존할 수 없으면 필요한 정보를 묻는다.

## 분배

[역할·소유권](references/roles.md)을 읽고, 실제 요청의 독립 작업만 분리한다. 모델 이름으로 능력을 고정하지 않는다. 요청이 작으면 네 에이전트를 채우려고 범위를 늘리지 않는다.

[작업 계약](references/task-contract.md)으로 각 대상에 목표, 허용 파일, 제외 범위, 검증과 완료 보고를 전달한다. 같은 파일의 작성자는 한 명으로 제한한다. 공통 인터페이스와 선행 결과를 먼저 정하고, 충돌 가능 작업은 순차 처리한다.

`herdr agent prompt <target> <text>`로 제출한다. 셸을 경유하면 인자를 올바르게 quoting한다. 상태 응답과 실제 working 전환을 확인한다. 관찰하면서 계속 다른 독립 작업을 진행할 수 있다. 제출 성공만으로 시작·완료를 보고하지 않는다.

## 취합

[결과 취합](references/result-integration.md)을 따른다. 대기 명령에는 반드시 --timeout을 지정한다(예: herdr agent wait <target> --timeout 30000). prompt --wait에도 동일하게 적용한다. 단일 대기는 60초 이내로 두고 전체 작업의 5분 경계를 넘길 경우 사용자 확인을 받는다. get/read로 결과와 변경 파일을 확인하고, 검증 후에만 완료로 판단한다. 실패·타임아웃·agent_prompt_stalled 발생 시 get/read로 신원·화면·변경 파일을 확인한다. stalled는 시작 활동이 관찰되지 않았다는 뜻이며 미전달의 증거가 아니다. 전송된 입력을 확인한 뒤에만 재시도한다.

공유 저장소에서는 담당 에이전트가 checkout, commit, push, merge, 배포, 이슈 변경을 수행하지 않게 한다. 해당 외부 작업이 요청에 포함되었다면 조정자가 취합·검증 후 수행한다. 이 스킬 자체는 외부 작업 권한을 추가하지 않는다.

## 실패·지연 회고

배정 전 `docs/retro/`의 최근 기록에서 재발 방지 항목을 읽고 해당 작업 계약에 반영한다. 실패·지연·timeout·stalled·재배정이 발생하면 `yogurt-failure-retro` 스킬로 원인을 판정하고 `docs/retro/YYYY-MM-DD.md`에 기록한다.
