---
name: yogurt-module-check
description: yogurt의 프로그래밍 모듈을 수정한 후 또는 AGENTS.md 준수 검토 시 재현 가능한 스크립트로 80줄 제한과 ui/app/domain/infra 디렉터리 배치를 검사한다.
---

# 모듈 자동 검증

저장소 루트에서 실행한다. Python 3와 Git이 필요하며 추가 패키지는 사용하지 않는다.

`pnpm run verify`는 커밋 전 필수 3종 일괄 검증 명령이다. 단위 테스트, 타입 검사, 모듈 검사를 순서대로 실행하고 실패하면 중단한다.

```sh
PYTHONDONTWRITEBYTECODE=1 python3 .agents/skills/yogurt-module-check/scripts/app/check.py --root .
```

- Git의 추적 파일과 ignore되지 않은 미추적 파일을 검사한다. 심볼릭 링크·삭제 파일은 따라가지 않는다.
- [소스 확장자 목록](scripts/infra/files.py)에 해당하는 프로그램·테스트·설정·스타일·SQL 모듈을 검사한다. 새 언어를 도입하면 이 목록과 테스트를 함께 보완한다.
- 빈 줄과 주석을 포함한 물리적 줄 수가 80을 넘으면 실패한다. 마지막 개행 없는 줄도 센다.
- 파일의 상위 디렉터리 중 ui, app, domain, infra 중 하나가 없으면 실패한다. 파일명만 domain.ts인 경우에는 인정하지 않는다.
- `src/` 아래 `*.test.ts`와 `*.test.tsx`는 위반이며 루트 `tests/`로 옮긴다. `tests/`의 테스트에도 같은 레이어 디렉터리 규칙을 적용한다.
- 성공은 종료 코드 0, 규칙 위반은 1, 실행·입력 오류는 2다. 실패한 파일과 이유를 출력한다.
- Git ignore된 모듈은 검사되지 않는다. 준수 회피를 위해 ignore를 추가하지 않는다. 이 검사는 의존 방향·테스트 유무·TDD 과정·YAGNI/KISS/SOLID/DRY를 판정하지 않는다.
- `--typography` 옵션을 주면 `src/ui/**/*.tsx`에서 `text-(xs|sm|base|lg|xl|2xl|3xl)` 직접 사용을 검출한다 (`src/ui/styles`와 `src/ui/components`는 허용). 기본값은 비활성이다.

## 검증기 자체 테스트

검증기 스크립트 디렉터리에서 전체 테스트를 발견해 실행한다.

```sh
cd .agents/skills/yogurt-module-check/scripts
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -p 'test_*.py'
```

## 결정론적 작업의 재현

반복되는 규칙 검사·변환은 입력, 출력, 종료 코드가 명확한 스크립트로 작성한다. 구현 전 실패 테스트를 만들고 통과 결과를 확인한다. 외부 쓰기를 포함한다면 사용자에게 허용된 대상과 작업만 수행하며 무제한 재시도하지 않는다. 일회성 문서 편집을 억지로 자동화하지 않는다.

스킬 형식은 [Agent Skills 명세](https://agentskills.io/specification)의 SKILL.md frontmatter와 선택적 scripts 구조를 따른다.
