---
name: yogurt-herdr-team
description: 사용자가 Herdr로 작업별 임시 워커 탭을 열어 작업을 분배하거나 결과를 취합하도록 요청할 때 적용한다. 일반적인 단독 작업에서 자동으로 다른 에이전트를 시작하지 않는다.
---

# Herdr 팀 작업 분배

먼저 references/coordinator-checklist.md를 읽고 각 단계에서 확인한다.
저장소 AGENTS.md를 읽고 요청 범위와 5분 제한을 지킨다. 실행 전 `test "${HERDR_ENV:-}" = 1`을 확인한다. 실패하면 Herdr 세션을 조회하거나 제어하지 말고 중단 이유를 알린다.

## 작업 분해 → 프리셋 선택

요청을 직접 받은 pane이 조정자다. [프리셋·소유권](references/roles.md)에 따라 독립 작업과 선행 인터페이스를 정한다. 필요한 수만 열며 동시 워커는 최대 5개, 같은 프리셋은 동시에 하나만 연다. 같은 파일의 동시 작성자는 한 명이며 충돌 가능 작업은 순차 처리한다.

## open → 계약 파일 전달 → await

주문·리밸런싱 계약은 [yogurt-trading-rules](../yogurt-trading-rules/SKILL.md)를 먼저 읽고 해당 규칙을 계약에 적는다.

1. 설치된 herdr 스킬과 `herdr --help`, `herdr agent`를 확인한다. bare `herdr`는 실행하지 않는다. `python3 .agents/skills/yogurt-herdr-team/scripts/app/worker.py --help`와 각 하위 명령의 `--help`로 실제 인자를 확인한다.
2. `worker.py open`으로 선택한 프리셋의 **별도 탭**을 연다. 조정자 탭 내부 pane split은 금지한다. 저장소 루트 cwd와 no-focus를 유지한다. 이 사용자 지침이 herdr 스킬의 기본 동일 탭 split보다 우선한다.
3. open은 상태 파일과 `herdr agent list`에서 같은 프리셋 워커를 확인한다. 이미 열려 있으면 새로 만들지 않고 오류 또는 기존 이름 안내로 끝낸다. 기존 탭에 새 작업을 얹지 말고 이전 작업 검증·close 후 새 탭을 연다.
4. 프리셋에서 kind·모델·effort·sandboxed를 읽어 시작한다. 생성 응답의 탭/pane ID와 이름을 기록하고 순서·모델을 추측하지 않는다. 실행 중 모델·effort를 바꾸지 않는다. idle/done 준비 상태를 확인하고 working에는 중복 제출하지 않는다.
   scripts/app/check_contract.py로 계약을 검사한 뒤 보낸다.
5. [작업 계약](references/task-contract.md)을 파일로 저장하고 `worker.py prompt`로 **계약 파일 경로**를 전달한다. 전문을 셸 인라인 문자열로 조립하지 않는다. 제출 성공만으로 시작·완료를 보고하지 않고 working 전환을 확인한다.
6. `worker.py await`로 콜백을 우선 기다리고 fallback 파일을 감시한다. 각 대기는 60000ms 이하이며 전체 5분 경계를 지킨다. 관찰 중 독립 작업은 병행할 수 있다.

## 5분 시간 제한
`worker.py prompt`는 기본으로 `--timebox 300` 감시를 백그라운드에서 시작한다. 감시는 `app/timebox.py --pane <pane_id> --seconds 300`으로 동작하며, working이 300초를 넘으면 Escape 후 계약 보고 파일 작성과 `--status blocked` 콜백을 요청한다. `--timebox 0`으로 끌 수 있고, 이미 끝난 done/idle 워커는 건드리지 않는다.


## 조정자 검증 → close

[결과 취합](references/result-integration.md)에 따라 계약·diff·산출물·검증 결과를 조정자가 확인한다. `sandboxed: true`인 codex 워커(sol/luna)는 Vitest를 실행하지 않고 조정자가 테스트를 실행한다. callback fallback은 watch.py로 감시한다.

검증 후 `worker.py close`로 해당 작업에서 만든 탭만 종료한다. failed/blocked는 탭을 먼저 유지하고 get/read로 원인·중간 결과를 확보한 뒤 close한다. unknown도 get/read로 확인하며 승인·질문 UI에 임의 응답하지 않는다. `worker.py run` 통합 경로도 계약 파일 전달과 조정자 검증 후 close라는 경계를 지킨다.

사용량 한도로 워커가 닫히면 사용자 새 지침을 기다린다. 다른 모델·프리셋으로 임의 대체·재시작하지 않는다. 실패·타임아웃·agent_prompt_stalled는 미전달 증거가 아니므로 입력·상태·변경 파일 확인 후에만 재시도한다.

5분 초과 예상 시 진행 중 blocked 콜백으로 중간 결과를 보고한다. 5분 경계에서 멈추고 사용자 확인 없이 계속하지 않는다. 공유 저장소의 checkout/commit/push/merge·배포·이슈 변경은 워커에게 맡기지 않는다. 해당 외부 작업을 사용자가 허용한 경우 조정자만 취합·검증 후 수행한다.

## 실패·지연 회고

배정 전 `docs/retro/`의 최근 기록에서 재발 방지 항목을 읽고 해당 작업 계약에 반영한다. 실패·지연·timeout·stalled·재배정이 발생하면 `yogurt-failure-retro` 스킬로 원인을 판정하고 `docs/retro/YYYY-MM-DD.md`에 기록한다.
