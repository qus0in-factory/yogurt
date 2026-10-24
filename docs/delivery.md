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
| Build command | npm test && npm run build:dev | npm test && npm run build:main |
| Deploy command | npm run deploy:dev | npm run deploy:main |
| Non-production branch builds | Disabled | Disabled |

각 Worker의 Production branch는 그 Worker가 배포할 기준 브랜치를 뜻한다. 따라서 미리보기 Worker에도 dev를 Production branch로 지정한다. 자동 의존성 설치가 package-lock.json으로 npm ci를 실행한다. 필요 시 Build variables에서 NODE_VERSION=24를 지정한다.

구성이 `infra/wrangler.jsonc`에 있으므로 기본 `npx wrangler deploy` 대신 위의 명령을 사용한다. 환경별 Worker 이름과 환경 변수가 해당 npm 명령에서 선택된다. Workers Builds가 배포용 인증을 관리한다.

배포 완료 후 Worker의 workers.dev URL과 `/health` 응답을 확인한다. dev에서는 environment=dev, 운영에서는 environment=production이어야 한다. 이 초기 진입점은 배포 연결 확인용이며 대시보드는 후속 이슈에서 구현한다.

고정 dev 미리보기를 사용하며 PR별 버전 URL은 이번 구성에 포함하지 않는다. 향후 D1·비밀 값을 도입할 때도 두 Worker에 별도로 연결한다.

## 로컬 검증

`npm ci`, `npm test`, `npm run build:dev`, `npm run build:main`. 로컬 실행은 `npm run dev`다. 소스 변경은 dev에 push하고 `gh pr create --base main --head dev`로 승격 PR을 만든다.

## 참고

- https://developers.cloudflare.com/workers/ci-cd/builds/advanced-setups/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
