# KIS 연동

한국투자증권(KIS) 실전 API 연동 현황. 모든 API 호출은 Worker 서버에서만 수행한다.

## 접근토큰

- `POST https://openapi.koreainvestment.com:9443/oauth2/tokenP`에 `grant_type=client_credentials`, `appkey`, `appsecret`을 보내 발급한다.
- KV `CACHE`에 `kis-token:<accountId>` 키로 `accessToken`과 `expiresAt`을 저장한다. TTL은 `max(60, expires_in - 600)`초라서 만료 10분 전에 캐시가 사라지고 다음 호출에서 재발급한다.
- KIS는 접근토큰 발급을 1분에 1회로 제한하므로 강제 재발급을 반복하지 않는다.
- 파일: `src/infra/kis/kis-token.ts`, `src/infra/kis/kis-context.ts`

## 주식잔고조회

- `GET https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/trading/inquire-balance`, TR `TTTC8434R`.
- 쿼리: `CANO`(계좌번호), `ACNT_PRDT_CD`(상품코드). 조회 상품은 ISA `01`, 연금저축 `22`, IRP `29`다(`src/domain/accounts/products.ts:3-11`, `src/infra/kis/kis-balance-handler.ts:52-59`). IRP는 조회만 하며 거래하지 않는다. 거래 대상은 ISA `01`과 연금저축 `22`이며 주문·체결 조회 경로에서 제한한다(`src/domain/portfolio/assignment.ts:3`, `src/infra/trading/order-contracts.ts:51-57`).
- 첫 페이지만 조회한다. `CTX_AREA_FK100`·`CTX_AREA_NK100`은 빈 값이며 연속조회를 하지 않는다.
- 응답 `rt_cd`가 `0`이 아니면 `KisApiError`를 던지고 라우트는 502를 반환한다.
- 파일: `src/infra/kis/kis-stock-balance.ts`, `src/domain/kis/stock-balance.ts`

## 투자계좌자산현황조회 (예정)

- `GET https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/trading/inquire-account-balance`, TR `CTRP6548R`.
- 연금계좌 자산 현황용이며 현재 미구현이다(해당 경로를 호출하는 코드 없음).

## 앱 라우트

`/api/*`는 로그인 세션이 필요하다.

| 메서드·경로 | 동작 | 파일 |
| --- | --- | --- |
| `POST /api/accounts/:id/kis-token` | 토큰 발급·캐시 확인 후 `{ issued, expiresAt }` 반환. 의존성 없음 503, 계좌 없음 404, 발급 실패 502 | `src/infra/kis/kis-token-handler.ts` |
| `GET /api/kis/status` | SSE. 계좌별 `status`(`connected`/`error`) 전송, 25초 `ping`, 최대 5분 유지, 만료 10분 전 재확인. 의존성 없음 503 | `src/infra/kis/kis-status-stream.ts` |
| `GET /api/accounts/:id/products/:code/balance` | 주식잔고조회 결과 반환. 잘못된 코드 400, 의존성 없음 503, 계좌 없음 404, KIS 실패 502 | `src/infra/kis/kis-balance-handler.ts` |
| `PUT /api/accounts/:id/products/:code` | 계좌 상품 활성화·비활성화(`{ enabled: boolean }`) | `src/infra/worker.ts`, `src/infra/accounts/accounts.ts` |

## 공통 클라이언트

- `src/infra/kis/kis-client.ts`가 계좌별 클라이언트를 만들고 토큰과 헤더를 주입한다.
- 요청 헤더: `authorization: Bearer <token>`, `appkey`, `appsecret`, `tr_id`, `custtype: P`, `content-type: application/json`.
- 응답이 401이거나 `msg_cd`가 `EGW00123`이면 캐시 토큰을 무효화하고 1회 재시도한다(최대 2회 요청).
- 파일: `src/infra/kis/kis-client.ts`, `src/infra/kis/kis-stock-balance.ts`

## 보안

- AK/SK는 D1에 AES-256-GCM 암호문(`v1:<iv>:<ciphertext>`)으로 저장하고 `ACCOUNT_ENCRYPTION_KEY`(Worker secret)로 서버에서만 복호화한다.
- 접근토큰 원문은 브라우저에 반환하지 않는다. 발급 라우트 응답은 `issued`, `expiresAt`뿐이며 토큰은 KV `CACHE`에만 둔다.
- 파일: `src/infra/accounts/account-crypto.ts`, `src/infra/accounts/account-repository.ts`, `src/infra/kis/kis-token-handler.ts`

## 참고

- 이슈 #35~#40
