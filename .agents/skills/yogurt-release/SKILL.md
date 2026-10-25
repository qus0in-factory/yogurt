---
name: yogurt-release
description: Tag a yogurt release with a reproducible script and verify the deployed production health version after the coordinator merges dev into main on the user's request.
---

# yogurt 릴리스 태그와 배포 버전 확인

## 언제 사용한다

- 조정자(claude)가 사용자 요청을 받아 dev→main을 병합한 직후에만 실행한다.
- 이 스킬은 버전 태그 생성·push와 배포된 버전 확인을 스크립트로 재현해 즉흥적인 수동 git 작업을 줄인다.
- 사용자가 요청하지 않았는데 병합·배포를 알아서 진행하지 않는다.

## 실행 순서

1. CI 통과를 확인한다. 최근 main 커밋 상태가 실패ор 중단한다.
2. PR 병합 필요 시 사용자가 요청한 경우에만 병합한다.
3. 태그 생성·push와 배포 확인을 한 스크립트로 실행한다(저장소 루트에서):
   `python3 .agents/skills/yogurt-release/scripts/app/release.py --health-url https://yogurt.qus0in.dev/health`
4. 계획만 볼 때는 `--dry-run`을 붙인다: tag·push와 health 조회 없이 계획만 출력하고 exit 0.
5. 원격 D1 마이그레이션(production)은 사용자가 직접 `pnpm db:migrate:main`으로 실행했는지 병합 전 확인한다.
6. 마무리한다.

## 스크립트 동작

- `package.json`의 version을 X.Y.Z로 검증해 `vX.Y.Z` annotated 태그를 origin/main에 만들고 `git push origin vX.Y.Z`를 한다.
- 태그가 이미 있으면 exit 1로 중단한다.
- health를 최대 30회×10초 간격(약 5분)으로 조회해 `version` 필드가 package.json과 일치하면 exit 0, 30회 후에도 불일치면 exit 1로 끝난다.
- 인자 오류는 exit 2, git 실패나 버전 불명은 exit 1이다.

## 검증

- 단위 테스트(실제 git·네트워크·sleep 없이 주입): `cd .agents/skills/yogurt-release/scripts && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -p 'test_*.py'`
- 모듈 검사: `PYTHONDONTWRITEBYTECODE=1 python3 .agents/skills/yogurt-module-check/scripts/app/check.py --root .`
