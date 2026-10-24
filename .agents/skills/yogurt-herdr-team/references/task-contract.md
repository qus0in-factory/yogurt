# 작업 전달 양식 (작업 계약)

빔/glm/claude/agy 각 대상에 개별 발행하는 문서형 계약. [역할·소유권](roles.md)에 따라 한 파일의 작성자가 확정된 경우에만 발행한다. 이름·모델·pane에 능력을 고정하지 않으므로 네 대상에 같은 양식을 쓰고, 목표·입력·허용 파일·검증·시간을 작업별로 채운다. 이 양식 전문을 `herdr agent prompt <target> <text>`의 text로 전달한다.

## 필수 항목

- 목표: 이 대상만의 단일 산출물 한 문장
- 입력: 요청 원문 요지와 참조할 파일·확정된 인터페이스
- 선행 조건: 대상이 시작 전에 이미 확정되어 있어야 할 것(작성자 잠금, 인터페이스 확정 등)
- 허용 파일: 수정 가능한 경로 나열, 단일 작성자
- 금지 범위: 허용 목록 외 전부, 보호 파일, 외부 작업, 계약 밖 도구
- 완료 조건: 산출물 상태와 보고 제출까지
- 검증: 대상이 스스로 수행할 확인 방법(파일 재독 등)
- 시간: 3분. 조정자가 전체 5분 경계 안의 잔여 시간으로 조정
- 결과 보고: 완료 보고 형식
- 차단 보고: 시작 전·진행 중 막힘 보고 형식

## 제출·대기 명령 형태

- 제출: `herdr agent prompt <target> "$(cat 계약파일)" --wait --until working --timeout 20000`. `--until`은 `--wait` 없이 쓰지 않는다.
- 대기: `herdr agent wait <target> --timeout 55000`(60000 이하).
- 선행 조건(의존성 설치·런타임 버전 등)은 계약 발행 전 조정자가 실측하고, 계약에 실측 결과를 적는다.

## 공통 금지·보존 (모든 계약에 포함)

- 허용 파일 목록 밖 수정 금지. AGENTS.md, CLAUDE.md, README.md는 수정 대상에 넣지 않는다.
- git checkout/commit/push/merge, 배포, GitHub 이슈·PR 변경 금지. 조정자가 취합·검증 후 별도 수행한다.
- 계약에 없는 코드·스크립트 생성과 필요 이상의 도구 실행 금지.
- 공유 저장소 보존: 작업 전 허용 파일을 다시 읽고 다른 사용자의 기존 변경을 되돌리거나 덮어쓰지 않는다. 충돌이 예상되면 진행하지 않고 차단 보고로 올린다.
- 시간 초과가 예상되면 완료까지 기다리지 않고 진행 중에 차단 보고한다.

## 복사 예시 (YAML)

```yaml
# 예시 목적: layered-tdd 스킬 참조 문서에 예시 1개 추가 (target 실행 명령은 herdr 스킬의 현재 명세를 따른다)
대상: <현재 세션 확인 절차로 식별한 idle/done 대상, 예: claude>
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
허용 파일:
  - .agents/skills/yogurt-layered-tdd/references/examples.md
금지 범위: |
  - 위 허용 파일 외 전부. 특히 SKILL.md, roles.md, task-contract.md, AGENTS.md, CLAUDE.md, README.md
  - git checkout/commit/push/merge, 배포, GitHub 이슈·PR 변경
  - 코드·실행 스크립트 추가, 필요 이상의 도구·빌드 실행
  - 다른 에이전트(beam/glm/claude/agy) 호출 및 추가 지시
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
