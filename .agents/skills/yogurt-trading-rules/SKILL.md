---
name: yogurt-trading-rules
description: 리밸런싱·주문·예수금·남길 금액·계좌 상품 관련 작업을 계획하거나 계약할 때 먼저 읽는다. 사용자 확정 거래 규칙을 계약·검증에 반영하고 코드 불일치를 식별한다.
---

# 사용자 확정 거래 규칙

사용자가 확정한 제품·운영 계약이다. 기존 코드나 낡은 문서가 다르다고 규칙을 바꾸지 않는다. 계약에 해당 규칙과 검증 조건을 적고 아래 코드를 다시 읽는다. 차이는 `코드 불일치`, 확인하지 못한 근거는 `미확인`으로 보고한다. 이 스킬 자체는 주문·취소·배포·마이그레이션 실행 권한을 부여하지 않는다.

근거는 2026-10-27 작업 트리, 경로는 저장소 루트 기준이다. 줄 번호가 바뀌면 해당 함수를 재확인한다.

## 상품과 예수금

1. **IRP(29)는 조회만 하며 거래하지 않는다.** IRP에 주문·취소·미체결 기능을 만들지 않는다. 거래 대상은 **ISA(01), 연금저축(22)**다. 조회 상품 목록을 거래 허용 목록으로 해석하지 않는다.
   - 조회 근거: `src/domain/accounts/products.ts:3-11`, `src/infra/kis/kis-balance-handler.ts:52-59`.
   - 거래 근거: `src/domain/portfolio/assignment.ts:3`, `src/infra/trading/order-contracts.ts:51-57`, `src/app/rebalance/useRebalanceInputs.ts:16`. 주문·체결 조회/구독 라우트는 `src/infra/trading/order-routes.ts:24-27`에 연결된다.
   - `src/domain/rebalance/keep-amount.ts:6`의 IRP 남길 금액 저장 허용은 IRP 거래 허용 근거가 아니다.
2. **예수금·투자금 계산 기준은 D+2다. D+0은 ‘출금 가능’ 표시용이다.** D+0을 D+2로 간주하지 않는다.
   - 근거: `src/ui/glossary/overview.ts:9-11`, `src/ui/glossary/rebalance.ts:16`, `src/infra/quotes/inputs.ts:30-32`, `src/ui/operations/rebalance/useRebalancePlanSnapshot.ts:44-47`, `src/domain/rebalance/buy-limit.ts:1-3`.
   - D+2가 없거나 비정상이면 D+0으로 대체하지 않고 `cashSettled = null`로 두며, 리밸런싱 계산은 `cash` 차단으로 멈춘다(2026-10-27 수정, `/tmp/ds-d2-no-fallback-report.md`). 실제 KIS D+2 필드 적합성은 실계정 미확인이다.

## 남길 금액과 표시 비중

3. **남길 금액은 포트폴리오 제외 금액. 투자 대상 = 전체 − 남길 금액.** 계좌·상품별 DB 저장이며 상품 간 공유 금지다. **남길 금액 ≥ 전체면 계산 차단**. 부족분 확보를 위한 매도는 **제안**만 하고 자동 실행하지 않는다.
   - 계산: `src/domain/rebalance/plan.ts:10-15`의 전체=보유 평가액+현금/차단/투자 대상, 목표·매도 제안. 계산 함수는 주문 API를 호출하지 않는다.
   - **현금 행과 모든 비중은 포트폴리오 기준이다.** 현금 행 금액 = max(0, 정산 현금 − 남길 금액), 현재 비중 분모 = 전체 − 남길 금액(`weightBase`, `src/domain/rebalance/weights.ts`). 남길 금액은 요약에 '제외'로 한 번만 표시한다. '남길 금액 확보 매도' 열은 만들지 않는다(사용자: 쓸데없음).
   - 저장: `infra/migrations/0013_rebalance_keep_amounts.sql:10-11`의 계좌·상품 복합 키/외래 키, `src/infra/rebalance/keep-amount-repository.ts:4-8,15-23`의 두 키 조회·저장, `src/app/rebalance/queries.ts:14-26`의 계좌·상품 query key.
   - 차단 표시: `src/ui/operations/rebalance/useRebalancePlanSnapshot.ts:53-56`.
4. **표시 목표 % = 저장 bps ÷ 100.** 남길 금액·계좌 전체로 표시 목표 %를 재가중하지 않는다.
   - 표의 주문·체결 상태는 아이콘 + 툴팁으로 표시하고 긴 문구를 셀에 직접 쓰지 않는다.
   - 근거: `src/domain/rebalance/weights.ts:3-5`, `src/ui/operations/rebalance/RebalanceTable.tsx:40`. 투자 대상에 bps를 적용하는 수량 계산(`src/domain/rebalance/plan.ts:48`)과 구분한다.

## 계산·갱신·사용자 실행

5. **자동 반영 이벤트와 수동 새로고침은 같은 재조회·재계산 경로를 쓴다.** 남길 금액 저장 성공, `filled`·`closed_partial` 체결 종료, 주문 접수 실패, 취소 성공이면 입력(잔고·현금·시세·남길 금액)을 새로 조회하고, 성공한 새 값으로 1회 재계산해 표를 갱신한다. ‘다시 계산’도 캐시가 아니라 입력을 새로 조회한 뒤 계산하며, 조회 중에는 버튼을 비활성화하고 중복 클릭을 무시한다. 30초 주기 입력 폴링은 없고, 포커스만으로 계획 표·수량을 바꾸지 않는다. 가격·D+2·남길 금액 로딩/실패/저장 실패·total 차단이면 계산하지 않는다.
   - 근거: `src/ui/operations/rebalance/useRecalcOnFill.ts:30-75`의 이벤트 서명·저장 버전·주문 이벤트 버전 → 입력/남길 금액 재조회 → 새 `dataUpdatedAt` 확인 → `recalc()` 1회, 중복 방지, `recalcNow()` 수동 경로. `src/ui/operations/rebalance/useRebalancePlanSnapshot.ts:31-70`의 대상별 스냅샷 유지와 명시적 `recalc()`.
   - 연결: `src/ui/operations/rebalance/RebalanceSection.tsx:28-30,41-42`의 입력·남길 금액 재조회 함수와 이벤트 연결, `:54`의 조회 중 비활성 ‘다시 계산’, `:71,75`의 취소 성공·주문 실패 이벤트. `src/ui/operations/rebalance/useRebalanceAutoRefresh.ts:6-20`은 주문 성공·게이트용 무효화만 하며 주기 폴링·포커스 리스너를 만들지 않는다. 저장 성공은 `src/ui/operations/rebalance/useSavedKeepAmount.ts:22-27`의 mutation 성공 버전으로 전달된다.
   - 매수 게이트는 계획 계산 시각(calculatedAt)에 묶지 않는다. 현재 계좌·상품에 진행 중 매도 주문(pending/unknown/살아 있는 partial)이 없고, 마지막 매도 종료(filled·closed_partial) 이후 성공한 현금 재조회가 있으면 연다. 한도 = 그 성공 조회의 정산 현금 − 남길 금액이다. 재계산 후 새 계획에 잔여 매도 제안이 있어도 이 두 조건이면 매수 가능하며, 체결 0 취소(cancelled)는 진행 중 매도로 보지 않는다.
6. **가격 비정상, 남길 금액 로딩·실패·저장 실패 시 계산 중지.** 기본값 0으로 조용히 계산하지 않는다.
   - 근거: `src/ui/operations/rebalance/useRebalancePlanSnapshot.ts:32-62`는 가격 누락/0/음수/비유한 값·조회 실패·남길 금액 로딩/로드 실패/저장 실패 때 진행을 막는다. `src/ui/operations/rebalance/useSavedKeepAmount.ts:5-10,22-26`은 로드/저장 오류와 저장 성공 버전을 구분하고, `src/ui/operations/rebalance/RebalanceSection.tsx:30`이 저장 실패를 계산 훅에 전달한다.
7. **자동 리밸런싱·자동 주문·자동 취소 없음. 모든 주문·취소는 사용자가 화면에서 확인하고 실행.** 조회 폴링을 자동 주문으로 해석하지 않는다.
   - 주문 근거: `src/ui/operations/rebalance/RebalanceTable.tsx:68` 클릭 → `src/ui/operations/rebalance/RebalanceSection.tsx:74-75` 확인창 → `src/ui/operations/rebalance/RebalanceConfirmDialog.tsx:53` 실행 버튼 → `src/ui/operations/rebalance/useRebalanceDialog.ts:54-61` 주문 호출.
   - 미체결 취소: `OpenOrdersPanel.tsx`의 행별 X 버튼 → 확인 창 → `POST orders/:orderId/cancel`(`src/infra/trading/order-routes.ts`). 서버가 미체결 목록(`TTTC8036R`, `kis-open-orders.ts`)을 다시 조회해 존재·`cancellable`·기관번호 일치를 확인하고, 재조회한 원주문 값(orderId·orgNo·`ord_dvsn_cd`)으로만 `TTTC0803U` 취소를 보낸다. 주문이 IOC라 실제 미체결은 드물다. 이 기능은 KIS에 남은 주문이 없음을 화면에서 확인하는 용도도 겸한다.
8. **주문 POST·취소 POST는 재시도하지 않는다.** 조회 GET의 제한적 재시도 정책을 복사하지 않는다.
   - 주문 근거: `src/app/trading/orders-client.ts:58-65`의 retry:0, `src/infra/kis/kis-order.ts:44-47`의 retry:false, `src/infra/kis/kis-client.ts:49,61-68`의 무재시도/읽기 GET 제한.
   - 취소 POST: `src/infra/kis/kis-order-cancel.ts`의 retry:false, 클라이언트 `src/app/trading/open-orders-client.ts`도 재시도 없음. 실계정 응답은 미확인.

## 릴리스와 DB 적용

9. **실계좌 주문 경로는 교차 재리뷰와 실계정 확인 전 릴리스 금지.** 두 결과를 조정자가 확보한다. 문서·단위 테스트를 실계정 확인으로 대체하지 않는다.
   - 관련 코드: `src/infra/trading/order-routes.ts:25`, `src/infra/kis/kis-order.ts:33-47`.
   - **미확인:** 코드/CI의 자동 강제 위치, 실제 교차 재리뷰·실계정 확인 완료 증거. 본 사용자 계약이 정책 근거다. 이 규칙 자체는 실계좌 주문 실행 허가가 아니다.
10. **새 마이그레이션의 로컬·운영 적용 여부를 사용자에게 확인한다.** `pnpm db:migrate:local`, `pnpm db:migrate:main`의 적용 여부를 각각 확인한다. 명령 정의는 적용 완료 증거가 아니며 워커가 임의 실행하지 않는다.
    - 근거: `package.json:17,19`의 명령, `.agents/skills/yogurt-release/SKILL.md:21`, `docs/delivery.md:107`의 사용자 운영 적용/병합 전 확인 지침.
    - **미확인:** 두 환경 실제 적용 여부, 로컬 확인 자동 강제 코드. 양쪽 적용 여부 확인은 이번 사용자 확정 규칙이다.

## 주문 종료·확인 필요 기록·매도 수량

11. **주문은 IOC다. KIS에는 미체결이 남지 않는다. 앱이 종료를 판정하지 못하면 기록이 유령처럼 남아 새 주문을 막는다.** 잔량 0을 종료 근거로 쓴다.
    - 판정: `src/domain/trading/order-fill.ts` `classifyFill` — 주문>0·잔량 0이면 전량=filled, 일부=closed_partial(일부 체결·잔량 취소), 0=cancelled. 잔량>0이면 partial 유지. `src/infra/kis/kis-order-status.ts`는 `ord_qty`·`tot_ccld_qty`·`rmn_qty`가 없거나 비정상이면 0으로 바꾸지 않고 unknown으로 둔다.
    - 종료되면 주문 기록을 지우고, 입력 재조회 후 재계산한다(규칙 5).
    - 매수 게이트 안전 조건(과매수 방지): 성공한 현금 조회 시각이 반드시 있어야 하고(매도 종료가 없어도), 마지막 매도 종료 이후여야 한다. 접수된 매도는 filled·closed_partial·cancelled 확정 전까지 진행 중이다(not_found·rate_limited·unknown·첫 응답 전·주문번호 없음 포함). `src/ui/operations/rebalance/useRebalanceBuyPhase.ts`.
12. **'주문 결과 확인 필요'(주문번호 없는 unknown·pending) 기록은 앱이 스스로 정리한다.** 사용자에게 탭 닫기 같은 우회를 안내하지 않는다.
    - 지난 거래일 기록: 조회 없이 정리, "지난 거래일 주문 기록을 정리했습니다".
    - 오늘 기록: 당일 체결 전체 조회(완전 조회만 근거)에서 종목·방향·수량·요청 시각−120초 이후로 매칭. 1건이면 주문번호 부착·추적, 0건이면 미접수로 삭제, 2건 이상·조회 실패면 유지. 재주문하지 않는다. `useReconcileUnknownOrders.ts`.
    - 수동: 행의 휴지통 아이콘 → 확인 창 → 로컬 기록만 삭제(`UnknownOrderActions.tsx`).
13. **매도 수량 ≤ KIS 주문 가능 수량(`ord_psbl_qty` → `sellableQuantity`).** 값이 없으면 매도를 만들지 않고 행에 이유 아이콘(NO_SELLABLE)을 보인다. 이 값은 실시간·캐시 경로 모두에서 보존돼야 한다(`src/domain/kis/holdings-snapshot.ts` 캐시 스키마). 필드명 자체는 실계정 미확인이며 잔고 진단 로그에 키 존재 여부만 남긴다.

## 화면 표시

14. **상태·안내는 아이콘 + 2~4자 라벨 + 툴팁/aria. 긴 문장을 화면에 쓰지 않는다.** 상태마다 다른 아이콘을 쓴다(접수·partial·closed_partial·filled·cancelled·unknown·조회 실패·NO_SELLABLE). 매수 한도에 걸리면 주문 수량 칸에 `계획 (한도)` 한 줄로 쓴다(예: `400 (312)`). 문구는 glossary에만 둔다.
