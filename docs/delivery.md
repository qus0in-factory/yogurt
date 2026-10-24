# 브랜치와 배포

로컬 → dev push → dev에서 main 대상 PR → 검증 통과 후 merge commit → main 운영 배포.

- GitHub Actions는 테스트·모듈 검사·두 환경의 dry-run 빌드를 담당한다.
- Cloudflare Workers Builds가 GitHub 저장소를 직접 감시하고 배포한다. GitHub에 Cloudflare 토큰을 등록하지 않는다.
- dev에는 `yogurt-dev`, main에는 `yogurt` Worker를 각각 연결한다. 서로 다른 Worker이므로 미리보기와 운영이 분리된다.
- main 대상 PR은 같은 저장소의 dev에서만 허용한다. 검증을 통과한 뒤 merge commit으로 병합한다.
- 병합 후 로컬 dev에서 `git fetch origin` 및 `git merge origin/main`을 실행해 병합 이력을 가져온다.

## Cloudflare 대시보드 연결

Workers & Pages → Create application → Import a repository에서 GitHub와 `usagi-ai-kr/yogurt`를 연결한다. 아래 설정으로 Worker를 두 개 만든다. 이미 Worker를 만들었다면 해당 Worker의 Settings → Build에서 저장소를 연결한다.

| 설정 | dev 미리보기 | 운영 |
| --- | --- | --- |
| Worker 이름 | yogurt-dev | yogurt |
| Production branch | dev | main |
| Root directory | / | / |
| Build command | pnpm install --frozen-lockfile && pnpm test && pnpm run build:dev | pnpm install --frozen-lockfile && pnpm test && pnpm run build:main |
| Deploy command | pnpm run deploy:dev | pnpm run deploy:main |
| Non-production branch builds | Disabled | Disabled |

각 Worker의 Production branch는 그 Worker가 배포할 기준 브랜치를 뜻한다. 따라서 미리보기 Worker에도 dev를 Production branch로 지정한다. 의존성 설치는 pnpm-lock.yaml과 packageManager의 pnpm@11.24.0을 사용한다. Build variables에 NODE_VERSION=24, PNPM_VERSION=11.24.0을 지정한다. 재현 가능한 설치를 위해 Build command 앞에 pnpm install --frozen-lockfile을 추가한다.

구성이 `infra/wrangler.jsonc`에 있으므로 기본 배포 명령 대신 위의 명령을 사용한다. 환경별 Worker 이름과 환경 변수가 해당 pnpm 명령에서 선택된다. Workers Builds가 배포용 인증을 관리한다.

배포 완료 후 Worker의 workers.dev URL과 `/health` 응답을 확인한다. dev에서는 environment=dev, 운영에서는 environment=production이어야 한다. 이 초기 진입점은 배포 연결 확인용이며 대시보드는 후속 이슈에서 구현한다.

고정 dev 미리보기를 사용하며 PR별 버전 URL은 이번 구성에 포함하지 않는다. 향후 D1·비밀 값을 도입할 때도 두 Worker에 별도로 연결한다.

## 로컬 검증

`pnpm install --frozen-lockfile`, `pnpm test`, `pnpm run build:dev`, `pnpm run build:main`. 로컬 실행은 `pnpm run dev`다. 소스 변경은 dev에 push하고 `gh pr create --base main --head dev`로 승격 PR을 만든다.

## 참고

- https://developers.cloudflare.com/workers/ci-cd/builds/advanced-setups/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/

## 패키지 관리자 전환

패키지 관리자는 pnpm@11.24.0으로 고정한다. package-lock.json은 pnpm-lock.yaml로 대체했다. npm install 대신 pnpm install --frozen-lockfile을 사용한다. Cloudflare의 기존 npm 기반 Build/Deploy command도 위 표의 pnpm 명령으로 변경한다.

pnpm-workspace.yaml에서 esbuild·workerd의 설치 스크립트를 허용한다. 선택적 fsevents의 빌드는 사용하지 않는다. 기존 npm node_modules는 다시 사용하지 않고 pnpm으로 새로 설치한다. 의존성 변경 시 pnpm-lock.yaml도 함께 반영한다.

## Secret 설정

인증 및 보안에 필요한 비밀 값(`LOGIN_PASSWORD`, `SESSION_SECRET`)은 코드나 Git 저장소에 커밋하지 않는다.

- **로컬 개발 환경**:
  - `infra/.dev.vars` 파일에 `LOGIN_PASSWORD`와 `SESSION_SECRET`을 설정한다 (`infra/.dev.vars`는 `.gitignore`로 제외됨).
  - `SESSION_SECRET` 생성: `pnpm run keygen:session` 명령을 실행하여 출력된 세션 서명 키를 복사하여 설정한다.

환경별 secret을 한 번에 등록하려면 다음 명령을 사용한다.

```sh
LOGIN_PASSWORD='<비밀번호>' pnpm run secret:setup -- dev
LOGIN_PASSWORD='<비밀번호>' pnpm run secret:setup -- main
```

- `dev`는 dev 환경, `main`은 production 환경에 등록한다.
- `SESSION_SECRET`은 매 실행마다 새로 생성되며, 기존 세션이 무효화된다.

- **원격 환경 (Cloudflare)**:
  - `wrangler secret put` 명령을 통해 각 환경의 Worker에 비밀 값을 등록한다.
  - dev 환경:
    - `pnpm run secret:dev -- LOGIN_PASSWORD`
    - `pnpm run secret:dev -- SESSION_SECRET`
  - 운영(main) 환경:
    - `pnpm run secret:main -- LOGIN_PASSWORD`
    - `pnpm run secret:main -- SESSION_SECRET`
  - 각 명령을 실행한 후 터미널 안내에 따라 실제 비밀 값을 입력한다.

## 배포 명령

Cloudflare Vite 플러그인은 빌드 시 워커 배포 설정을 Vite root 기준의 산출물 디렉터리(`src/ui/dist/<워커명>/wrangler.json`)에 생성한다.
따라서 배포 시에는 빌드 후 해당 산출물 경로를 `--config`로 지정해야 한다.

- **dev 배포**: `pnpm run deploy:dev`
  - 실행 내용: `pnpm run build:dev && wrangler deploy --config src/ui/dist/yogurt_dev/wrangler.json`
- **운영 배포**: `pnpm run deploy:main`
  - 실행 내용: `pnpm run build:main && wrangler deploy --config src/ui/dist/yogurt/wrangler.json`
- **Cloudflare 대시보드 Workers Builds 일치**:
  - Cloudflare Workers Builds의 대시보드 설정에서 Deploy command는 위 스크립트(`pnpm run deploy:dev`, `pnpm run deploy:main`)와 반드시 일치해야 산출물 설정이 올바르게 배포된다.
