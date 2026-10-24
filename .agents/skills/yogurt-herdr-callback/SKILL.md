---
name: yogurt-herdr-callback
description: Send a worker's done, failed, or blocked result directly to the coordinator pane through Herdr, with retry and a file fallback.
---

# Herdr 완료 콜백

## 작업자 사용법

작업자는 완료, 실패, 차단 시마다 콜백 스크립트를 반드시 한 번 실행한다. `--status`는 `done`, `failed`, `blocked` 중 하나이며, 요약은 한 줄로 적는다. 요약이 길면 자동으로 잘린다. 긴 보고는 `--report` 파일로 전달한다.

```sh
python3 .agents/skills/yogurt-herdr-callback/scripts/app/callback.py --to claude --from ds --status done --summary "검증을 마쳤습니다" --report /tmp/result.md
```

실패나 차단도 같은 명령을 사용하고 상태와 요약을 정확히 지정한다. 스크립트가 기본 4회까지 재시도한다. 종료 코드 1이면 `/tmp/herdr-callback/<to>/`에 저장된 fallback 파일을 확인하고 조정자에게 경로를 보고한다. 실제 `herdr agent prompt`를 직접 실행하거나 스크립트를 무한 재시도하지 않는다.

## 조정자 사용법

각 작업 계약 끝에 작업자 이름, 조정자 이름, 상태별 판단 기준, 한 줄 요약 자리를 채운 콜백 명령을 넣는다. 조정자는 `herdr agent wait`로 반복 폴링하지 않고 조정자 pane에 도착하는 `[callback] ...` 메시지를 우선 기다린다. 콜백이 오지 않으면 `/tmp/herdr-callback/<조정자>/` 파일을 확인하고, 그래도 없을 때만 `herdr agent wait <target> --timeout 30000`으로 상태를 확인한다.
