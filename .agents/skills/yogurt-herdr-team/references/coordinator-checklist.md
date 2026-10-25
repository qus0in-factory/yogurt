# 조정자 운영 체크리스트

## 배정 전

- [ ] 직접 편집 금지: 조정자는 파일을 편집·작성하지 않는다. 문서·코드 작성은 워커에 맡긴다. 조정자는 읽기·검증 명령과 Herdr 조작만 한다.
  근거: 사용자 반복 지적
- [ ] 분석 위탁: 조정자 모델이 소형(Haiku)이면 분석·설계를 직접 하지 않고 sol 또는 luna에 위탁한다.
  근거: 사용자 반복 지적
- [ ] 요구 변경: 착수 전에 사용자 요구(API 종류, 입력 방식 등)를 확인한다. 변경되면 계약을 갱신하고 해당 워커에 즉시 공지한다.
  근거: 사용자 반복 지적
- [ ] 분담: 독립 단위로 나눠 여러 워커에 배정한다. 혼자 처리하지 않는다.
  근거: 사용자 반복 지적
- [ ] 모델 우선순위: 사용량 이슈가 없으면 sol·luna 우선. 이슈가 나면 그 프리셋을 제외하고 사용자가 해제할 때까지 쓰지 않는다. 테스트 실행이 필요한 작업은 gf·ds·grok(opencode, Grok 4.6 xAI · high)을 우선한다. ga는 사용자가 다시 요청하기 전까지 호출하지 않음(worker.py exclude).
  근거: 사용자 반복 지적
- [ ] 프리셋: sol(codex, GPT-6.1-Sol medium), luna(codex, GPT-6-Luna max), gf(agy, Gemini 3.8 Flash, effort medium), ga(agy, Gemini 4 Argon Medium, 모델 id gemini-4-argon-medium; 사용자가 다시 요청하기 전까지 호출하지 않음(worker.py exclude)), ds(opencode, DeepSeek V4.1 Flash · max), grok(opencode, Grok 4.6 xAI · high), mimo(opencode, MiMo-V2.6-Flash OpenCode Go, 미검증), muse(opencode, Muse Spark 1.3 Contributor OpenCode Go, 미검증).
  근거: 사용자 반복 지적
- [ ] 계약 필수 항목: 목표, 허용 파일, 금지 파일, 완료 조건, 검증 명령, 완료 보고 명령, 30초 무출력·5분 규칙, commit 금지. 보내기 전에 `python3 .agents/skills/yogurt-herdr-team/scripts/app/check_contract.py <계약 파일>`로 검사한다.
  근거: 사용자 반복 지적
- [ ] UI 작업: 계약에 `yogurt-layered-tdd/references/ui-components.md` 확인을 포함한다.
  근거: 사용자 반복 지적

## 배정 중

- [ ] 탭: 새 작업은 새 탭(같은 워크스페이스, no-focus). 같은 프리셋을 동시에 2개 이상 열지 않는다. 결과 검증 후 끝난 탭은 닫는다.
  근거: 사용자 반복 지적
- [ ] 콜백: 배정 직후 `watch.py`를 백그라운드로 띄운다. 보고가 대체 파일로만 남으면 확인하고 `processed/`로 옮긴다. 완료 보고가 없는 워커는 상태와 산출물로 누락 여부를 기록한다.
  근거: 사용자 반복 지적
- [ ] 워커 pane은 이름으로만 조회한다. `herdr agent list`에서 이름과 `tab_id`를 확인한 뒤 그 응답의 ID만 사용한다.
- [ ] 탭 정리 뒤 herdr 목록 확인: `herdr agent list`를 다시 실행해 대상 워커와 탭이 사라졌는지 검증한다.
- [ ] 명령: bare herdr 금지. 워커는 `worker.py` 명령 또는 확인된 pane·tab id로만 제어한다.
  근거: 사용자 반복 지적

## 검증

- [ ] 검증: 커밋·병합 전에 전체 `pnpm test`, `npx tsc --noEmit`, 모듈 검사를 함께 실행한다. 부분 테스트로 커밋하지 않는다.
  근거: 사용자 반복 지적
- [ ] 문구: UI 한글 문자열은 glossary에만 둔다(전체 검사 규칙).
  근거: 사용자 반복 지적
- [ ] 타인의 미커밋 변경: stash·삭제·되돌리기 금지. 커밋할 때는 해당 워커 경로만 스테이징한다.
  근거: 사용자 반복 지적

## 종료

- [ ] 커밋·push·병합·태그·배포: 사용자가 요청할 때만 한다. main 반영은 dev에서 main으로 PR(merge commit).
  근거: 사용자 반복 지적
- [ ] 버전: 사용자가 정하지 않은 릴리스는 버전·태그를 올리지 않는다.
  근거: 사용자 반복 지적
- [ ] 실패 판정: 실패·지연·blocked는 작업 실패, 위임 실패, 외부 실패, 기타 실패 4분류로 판정해 `docs/retro/YYYY-MM-DD.md`에 기록한다(`yogurt-failure-retro` 스킬).
  근거: 사용자 반복 지적
