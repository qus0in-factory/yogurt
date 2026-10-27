# 작업 계약 파일

조정자는 [프리셋·소유권](roles.md)에 따라 작성자를 확정한 뒤 계약을 파일로 저장한다. `worker.py open`으로 새 별도 탭을 열고 `worker.py prompt`로 계약 파일 경로를 전달한다. 전문을 셸 인라인 문자열로 주입하지 않는다.

## 필수 항목

- 목표: 이 대상만의 단일 산출물 한 문장
- 입력: 요청 원문 요지와 참조할 파일·확정된 인터페이스
- 선행 조건: 대상이 시작 전에 이미 확정되어 있어야 할 것(작성자 잠금, 인터페이스 확정 등)
- 허용 파일: 수정 가능한 경로 나열, 단일 작성자
- 금지 범위: 허용 목록 외 전부, 보호 파일, 외부 작업, 계약 밖 도구
- 완료 조건: 산출물 상태와 보고 제출까지
- 검증: 대상이 스스로 수행할 확인 방법(파일 재독 등)
- 재사용 컴포넌트 확인: UI 작업인 경우 .agents/skills/yogurt-layered-tdd/references/ui-components.md 카탈로그 확인 및 컴포넌트·typeScale 재사용
- 시간: 3분. 조정자가 전체 5분 경계 안의 잔여 시간으로 조정
- 완료 시 콜백 명령: 계약 끝에 아래 명령을 실제 조정자·작업자 이름과 요약으로 채워 추가한다.

```sh
python3 .agents/skills/yogurt-herdr-callback/scripts/app/callback.py --to <조정자> --from <작업자> --status done --summary "<한 줄 요약>" [--report <보고 파일 경로>]
```

실패·차단 시에는 상태를 `failed` 또는 `blocked`로 바꾸어 같은 명령을 실행한다.
- 결과 보고: 완료 보고 형식
- 차단 보고: 시작 전·진행 중 막힘 보고 형식

## 2026-10-27 회고 반영 항목 (주문·리밸런싱·UI 계약에 추가)

- 규칙 인용: 주문·리밸런싱 계약은 `yogurt-trading-rules`를 먼저 읽게 하고, 해당 규칙 번호와 문장을 계약에 옮긴다. 사용자가 규칙을 바꾸면 같은 계약에서 스킬 문장 갱신을 함께 맡긴다.
- 줄 수 예산: 80줄 근처 파일은 `현재 N줄, 허용 +M줄`을 적는다. 넘으면 분리(훅·컴포넌트)를 1단계로 둔다. 긴 줄 몰아쓰기 금지, 수정 파일은 `check.py --max-width 120`에 나오지 않아야 한다.
- 전달 경로: 필드를 추가·변경하면 생산자 → 타입/스키마 → 캐시 → 소비자 → UI 파일을 모두 허용 목록에 넣는다(예: `sellableQuantity`가 캐시 스키마에서 빠져 매도가 사라짐).
- 공유 파일: 다른 워커와 겹치는 파일은 편집 지점(줄·함수)과 "편집 직전 재독"을 적는다. 허용 목록 밖 편집이 필요하면 진행하지 말고 보고에 `허용 추가 요청: 경로 / 사유 / 바꿀 내용` 블록을 남기고 blocked 콜백한다.
- 경계 표: 주문 상태·게이트 계약은 시간축 행렬을 필수 테스트로 둔다. 예: 종료 이력 없음/있음 × 현금 조회 없음/오래됨/새로움/오류 × 접수 직후/미확인/확정 종료, 같은 날/다음 날 기록, 0건/1건/2건.
- 단계 분할: 구현 green → 전체 검증을 다른 단계(또는 다른 계약)로 나눈다. 검증 전용 계약은 관련 테스트 + `pnpm check`까지만 요구하고, 전체 `pnpm test`는 조정자가 마지막에 한 워커에게 한 번 맡긴다.
- 실행 형식: Vitest는 `--reporter=verbose`로 실행한다(30초 무출력 중단 방지). 전체 실행에서 1건만 실패하면 그 파일을 격리 재실행 1회 후 판정한다. 가짜 heartbeat 출력으로 무출력 제한을 피하지 않는다.
- UI 문구: 화면에 보이는 상태·안내는 아이콘 + 2~4자 라벨 + 툴팁/aria로 쓴다. 문구는 glossary에만 둔다.

## 제출·대기·종료

- `python3 .agents/skills/yogurt-herdr-team/scripts/app/worker.py --help`와 각 하위 명령의 `--help`로 실제 인자를 확인한다.
- `worker.py open`은 별도 탭·저장소 cwd·no-focus를 적용한다. 같은 프리셋이 상태 파일 또는 herdr agent list에 있으면 중복 생성하지 않는다. 동시 워커 최대 5개다.
- `worker.py prompt`에 계약 파일을 전달하고 working 전환을 확인한다. 하위 Herdr 호출에서 `--until`을 쓰면 `--wait`도 필요하며 timeout을 명시한다.
- `worker.py await`로 콜백을 우선 기다린다. fallback은 배정 직전 ISO 시각 또는 마지막 파일명 커서로 감시한다. 각 대기는 60초 이하, 전체는 5분 경계 안이다.

```sh
python3 .agents/skills/yogurt-herdr-callback/scripts/app/watch.py --to <조정자> --since <커서> --timeout 30
```

- fallback도 없을 때만 `herdr agent wait <target> --timeout 30000`으로 확인한다.
- `sandboxed: true`인 codex 워커(sol/luna)는 Vitest를 실행하지 않는다. 테스트 파일·권장 명령·미실행 사실을 보고하고 조정자가 테스트를 실행한다. agy/ds는 계약에 지정된 테스트를 실행한다.
- 조정자 검증 후 `worker.py close`한다. failed/blocked는 탭을 유지하고 get/read로 원인·중간 결과를 확보한 뒤 close한다. 승인 UI에 임의 응답하지 않는다.
- 사용량 한도로 닫히면 사용자 새 지침을 기다리고 다른 모델로 대체하지 않는다. `worker.py run`도 조정자 검증 전 close하지 않는다.
- 의존성 설치·런타임 버전 등 선행 조건은 계약 발행 전 조정자가 실측해 적는다.

## 공통 금지·보존 (모든 계약에 포함)

- 허용 파일 목록 밖 수정 금지. AGENTS.md, CLAUDE.md, README.md는 수정 대상에 넣지 않는다.
- git checkout/commit/push/merge, 배포, GitHub 이슈·PR 변경 금지. 조정자가 취합·검증 후 별도 수행한다.
- 계약에 없는 코드·스크립트 생성과 필요 이상의 도구 실행 금지.
- 공유 저장소 보존: 작업 전 허용 파일을 다시 읽고 다른 사용자의 기존 변경을 되돌리거나 덮어쓰지 않는다. 충돌이 예상되면 진행하지 않고 차단 보고로 올린다.
- 시간 초과가 예상되면 완료까지 기다리지 않고 진행 중에 차단 보고한다.
- 5분 초과 시 중간 상태 blocked 보고 후, 인계 계약에 이전 담당의 중간 파일 목록을 적는다.
- 공개 export·함수 시그니처는 계약에 적은 형태만 사용하고, 별칭·다형 인자·옵션 객체 추가를 금지한다.
- 테스트 실행이 허용된 워커도 30초 넘게 출력이 없으면 중단하고 '테스트 미실행'으로 콜백하며 검증은 조정자가 수행한다.
- 5분 경계에서 blocked 콜백 후 멈춘다. 사용자 확인 없이 계속하지 않는다.
- 도구 호출은 텍스트로 출력하지 말고 실제 호출로 수행한다.
- 외부 API 가짜 객체(D1 등)는 실제 API 호출 형태(prepare().all(), prepare().bind().run())를 따른다.
- UI 요소 사이(아이콘과 텍스트, 버튼끼리, 입력과 버튼)는 붙이지 않는다. 버튼 안 아이콘·텍스트 간격은 `Button`의 기본 `gap-2`를 쓰고, 요소 묶음은 `gap-2` 이상으로 띄운다. 개별 margin으로 간격을 맞추지 않는다.

## 복사 예시 (YAML)

```yaml
# 예시 목적: layered-tdd 스킬 참조 문서에 예시 1개 추가 (이 YAML을 계약 파일로 저장해 전달한다)
프리셋: sol
대상: <worker.py open 응답의 새 워커 이름·탭/pane ID>
작업명: layered-tdd 참조 예시 보강
목표: >
  .agents/skills/yogurt-layered-tdd/references/examples.md 에
  app 레이어 단위 테스트 예시 1개를 추가한다.
입력: |
  - 요청 원문 요지: "app 레이어 예시가 하나 없다"
  - .agents/skills/yogurt-layered-tdd/SKILL.md
  - .agents/skills/yogurt-layered-tdd/references/examples.md (현재 내용)
선행 조건: |
  - 조정자가 examples.md의 작성자 잠금을 이 대상으로 확정하여 통보함
  - 예시 형식과 테스트 프레임워크는 SKILL.md 기준으로 이미 확정됨
재사용 컴포넌트 확인: |
  - UI 작업인 경우 ui-components.md 카탈로그를 확인하고 기존 컴포넌트·typeScale을 재사용함
허용 파일:
  - .agents/skills/yogurt-layered-tdd/references/examples.md
금지 범위: |
  - 위 허용 파일 외 전부. 특히 SKILL.md, roles.md, task-contract.md, AGENTS.md, CLAUDE.md, README.md
  - git checkout/commit/push/merge, 배포, GitHub 이슈·PR 변경
  - 코드·실행 스크립트 추가, 필요 이상의 도구·빌드 실행
  - 다른 워커 호출 및 추가 지시
완료 조건: |
  - examples.md에 예시 1개가 추가되고 기존 내용은 수정·삭제하지 않음
  - 아래 형식의 완료 보고를 제출함
검증: |
  - 파일을 다시 읽어 예시 추가와 기존 내용 보존을 확인하고 그 방법·결과를 보고에 포함
시간: |
  - 배정 시간: 3분(조정자가 전체 5분 경계 안의 잔여 시간으로 조정)
  - 초과 예상 시 즉시 차단 보고
결과 보고: |
  상태: 완료
  변경 경로:
    - .agents/skills/yogurt-layered-tdd/references/examples.md (추가 N줄)
  요약: 한 문장
  검증: 확인 방법과 결과 한 줄
차단 보고: |
  상태: 차단
  시점: 시작 전 또는 진행 중
  이유: 무엇이 막혔는가
  필요한 결정: 조정자가 무엇을 정해야 하는가
공유 저장소 보존: |
  - 작업 전 examples.md를 다시 읽고 다른 사용자의 변경을 되돌리지 않는다.
  - 충돌이 예상되면 진행하지 않고 차단 보고로 올린다.
```
