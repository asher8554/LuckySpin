# LuckySpin 컨텍스트 노트

## 2026-05-24

- 원본 대상은 `https://lazygyu.github.io/roulette/`이며, Playwright로 화면과 DOM 구조를 확인했다.
- 원본은 전체 화면 캔버스, 하단 설정 패널, 이름 입력, 섞기, 시작, 순위판, 공지 모달, 맵/녹화/스킬/다크 모드 설정을 제공한다.
- 구현 범위는 원본을 정적 파일 그대로 복사하지 않고 새 코드로 시각과 기능을 최대한 비슷하게 재현하는 방향으로 승인됐다.
- 기술 스택은 `Vite + React + TypeScript`로 승인됐다.
- 물리 표현은 `matter-js`를 사용하기로 승인됐다.
- 에셋은 직접 제작한다. 과일 구슬은 캔버스 또는 CSS 드로잉으로 만들고, 아이콘은 오픈 아이콘으로 대체한다.
- UI 언어는 한국어 전용으로 승인됐다.
- 원본 UI 대부분을 포함한다. 녹화와 상점처럼 첫 버전에서 실구현 가치가 낮은 기능은 비활성 안내로 처리한다.
- `E:\Github\LuckySpin`은 빈 폴더였고, 현재 폴더에서 새 Git 저장소를 초기화한 뒤 `https://github.com/asher8554/LuckySpin.git`을 `origin`으로 연결하는 방식이 승인됐다.
- 사용자가 에이전트 활용을 요청했으므로, 설계와 구현 계획 검토에는 읽기 전용 플래너/리뷰어 에이전트를 쓰고 구현 단계에서는 파일 책임 범위를 나눠 작업 에이전트를 활용한다.
- 플래너 에이전트 검토 결과를 설계에 반영했다. 반영 내용은 물리 결과가 실제 순위를 결정한다는 점, `matter-js` 생명주기 정리, 입력 문법, 맵 옵션, 모바일 겹침 검증, 반복 시작으로 인한 중복 runner 방지다.
- 구현 계획 문서를 작성했다. 리뷰 에이전트에도 계획 검토를 맡겼지만 제한 시간 안에 결과를 반환하지 않아 종료했고, 로컬 자체 검사로 placeholder, 타입 리스크, 테스트 순서를 확인했다.
- Task 2는 UI와 분리된 룰렛 도메인 순수 함수만 추가한다. 테스트를 먼저 작성하고 구현 파일 부재로 실패하는 RED를 확인한 뒤, `src/types.ts`와 `src/lib/roulette.ts`를 최소 구현한다.
- Task 2 RED 확인 결과 `npm test -- src/lib/roulette.test.ts`는 `./roulette` 구현 파일 부재로 실패했다. 이후 도메인 함수 구현 뒤 같은 테스트와 `npm run build`가 통과했다.

## 2026-05-25

- 사용자가 워크트리 구현을 요청해 `E:\Github\LuckySpin\.worktrees\luckyspin-clone`에서 `feature/luckyspin-clone` 브랜치로 구현했다.
- 앱은 `/LuckySpin/` base 경로를 사용한다. 로컬 검증 URL은 `http://127.0.0.1:5173/LuckySpin/`였다.
- 구현 커밋은 스캐폴드, 도메인 로직, 지원 UI, 설정 패널, 물리 코어, 앱 상태 연결, 시각 매칭, 브라우저 QA 수정 순서로 나눴다.
- 브라우저 QA에서 이름 저장 effect가 실행 시작 직후 상태를 `idle`로 되돌리는 문제를 발견했다. 이름 변경 핸들러에서만 결과 초기화를 수행하도록 분리해 시작 버튼과 결과 집계를 정상화했다.
- 미실행 상태에서도 원본처럼 과일 구슬이 보이도록 캔버스 preview entries를 그리게 했다.
- 상점, 녹화, 스킬은 첫 버전에서 비활성 안내 토스트를 띄운다. 수동 DOM 삽입은 React 렌더링과 충돌하므로 `ToastHost` 상태 경로만 사용한다.
- 모바일 390x844 검증에서 저작권 문구가 하단에서 줄바꿈되어 걸리는 문제가 있어 모바일에서는 숨겼다.
- 최종 확인으로 `npm test`, `npm run build`, Playwright CLI 클릭 검증을 수행했다. 확인한 흐름은 시작 후 `6 / 6` 결과 집계, 상점/녹화 토스트, 미지원 맵 토스트, 공지 모달, 데스크톱/모바일 스크린샷, 콘솔 warning/error 0건이다.

## 2026-05-31

- 사용자가 GitHub Pages로 열어보고 싶다고 요청했다. Vite 앱은 이미 `base: "/LuckySpin/"`로 설정되어 있어 프로젝트 Pages URL과 맞는다.
- GitHub Pages는 빌드 단계가 필요한 Vite 앱이므로 GitHub Actions에서 `npm ci`, `npm run build`, Pages artifact 업로드, Pages 배포를 수행하는 방식으로 설정한다.
- README에는 Pages URL, 로컬 실행 방법, 입력 문법, 구현된 기능과 첫 버전 미지원 기능을 기록한다.
- 사용자가 원본 `https://lazygyu.github.io/roulette/`과 구현이 너무 다르다고 지적했다. 우선 같은 viewport로 원본과 현재 구현을 캡처한 뒤, 전체 구조보다 눈에 띄는 시각 차이를 줄이는 쪽으로 개선한다.
- 1280x720 원본 비교에서 가장 큰 차이는 기본 공지 모달 부재, 왼쪽 회색 맵 미니뷰 부재, 트랙의 두께와 위치, 우승자 대형 표시 부재, 순위판 체크/별 표시 부재였다.
- 개선으로 기본 NOTICE 모달과 할인 배너, 왼쪽 맵 미니뷰, 원본에 가까운 얇은 네온 트랙, 과일 질감 강화, 우승자 오버레이, 순위판 기호를 추가했다. 트랙 변경 후 일부 구슬이 늦게 도착해 9초 fallback 집계를 추가했다.

## 2026-05-31 Original Source Rework

- 사용자가 `lazygyu/roulette` 원본 저장소를 보고 구현을 다시 파악하라고 요청했다.
- 원본 저장소를 `.reference/lazygyu-roulette`에 복제했다. 이 폴더는 참조 전용이며 Git 추적에서 제외한다.
- 하위 에이전트 두 개를 사용했다. 첫 에이전트는 원본의 핵심 파일을 식별했고, 두 번째 에이전트는 현재 구현과 원본의 차이를 정리했다.
- 확인한 핵심 차이는 원본의 `StageDef.entities`, `goalY`, 카메라 추적, live rank, selected winner 판정이 현재 구현에 제대로 반영되지 않은 점이다.
- 전체 Box2D 포팅은 이번 변경의 필수 조건으로 보지 않는다. 기존 React/Vite/Matter.js 구조를 유지하되 원본 좌표계와 stage entity 모델을 도입하는 방향이 더 작고 검증 가능하다.
- `src/lib/stage.ts`에 원본 첫 맵 `Wheel of fortune`의 46개 entity를 코드화했다. 나머지 세 맵은 아직 구현하지 않고 선택 시 기존처럼 안내 토스트를 유지한다.
- `src/lib/physics.ts`는 임의 과일 프리뷰와 고정 viewport 트랙 대신 stage entity를 Matter.js body와 canvas renderer 양쪽에 사용한다.
- 결과 판정은 sensor 충돌 대신 원본처럼 구슬의 `y > goalY` 조건으로 바꿨고, 선택 당첨 순위에 도달하면 완료 처리한다.
- 브라우저 QA 결과 데스크톱 시작 전 `0 / 6`, 시작 후 `1 / 6`, NOTICE 텍스트 0개, 모바일 설정과 시작 버튼 표시, 콘솔 warning/error 0건을 확인했다.
- 코드 리뷰에서 18초 fallback이 goalY 판정 목표와 충돌한다는 Critical 지적을 받았다. fallback 결과 확정은 제거하고 느린 구슬 보조 힘만 주도록 바꿨다.
- 리뷰에서 완료된 구슬이 렌더 목록에 남는 문제와 kinematic 바퀴의 각속도 미반영 문제도 지적받았다. `removeMarbleFromWorld`가 `world.marbles`에서도 제거하도록 바꾸고, 회전 바디에 angular velocity를 반영했다.

## 2026-05-31 Physics Collision Fix

- 사용자가 구현된 벽과 물리엔진 동작 없이 구슬이 자유낙하한다고 보고했다.
- 테스트로 재현했다. 기존 Matter.js 중력 스케일 `0.001`에서는 3초 뒤 구슬 y가 `3890`까지 튀어 원본 stage 좌표계의 얇은 레일을 통과했다.
- 원인은 원본 Box2D 좌표계를 Matter.js에 옮기면서 중력 스케일을 과하게 둔 것이다. 중력 스케일을 `0.000006`으로 낮춰 첫 경사 벽에서 수평 편향을 받게 했다.
- 낮춘 중력에서는 코너에 멈출 수 있어 실제 앱의 stuck assist를 테스트에도 포함했다. 구슬이 레일과 충돌한 뒤 goalY까지 진행하는 회귀 테스트를 추가했다.
- 브라우저 QA에서 시작 후 1.2초 시점 `0 / 6`, 구슬이 레일 구간에 남아 있고, 이후 `1 / 6` 결과가 나오며 console warning/error 0건을 확인했다.

## 2026-05-31 Physics Bounce Fix

- 사용자가 물리 반발이 너무 커서 공이 튀어나가고 끝난다고 보고했다.
- 회귀 테스트를 먼저 추가했다. 기존 구현은 stuck assist 이후 속도가 `5.45`까지 치솟고 x 좌표가 stage 밖으로 나가며 실패했다.
- kinematic stage body에 매 프레임 각도와 각속도를 Matter.js body에 직접 주입하면 정적 충돌체가 구슬에 비현실적인 충격량을 줄 수 있어, 물리 body는 고정하고 화면 렌더링 각도만 갱신하도록 분리했다.
- stage entity restitution은 `0.12`로 상한을 두고, stuck assist 힘은 낮췄다. 이 조정만으로 속도 폭발은 줄었지만 polyline 벽 틈으로 stage 밖 이동 가능성이 남았다.
- 레일 충돌 두께를 키우고 보이지 않는 좌우 containment wall을 추가했다. 최종 회귀 테스트는 goal 전 속도와 x 범위가 안정적으로 유지되는지 확인한다.
- 로컬 브라우저 QA에서 시작 뒤 2.2초까지 `0 / 6`, 이후 정상적으로 `1 / 6` 결과가 나오고 console warning/error 0건을 확인했다.

## 2026-05-31 Physics Stability Rework

## 2026-05-31 Physics Elastic Kinematic Fix

- 사용자가 원본 `https://lazygyu.github.io/roulette/` 대비 현재 구현이 너무 다르며 물리 탄성과 회전 막대 간섭이 없다고 지적했다.
- 원본은 `box2d-wasm`의 kinematic body에 angular velocity를 넣고 world step에서 충돌을 처리한다. 현재 구현은 수동 적분으로 바뀌었고 `resolveEntityCollision`에서 `kinematic` entity를 즉시 제외한다.
- 이번 결정은 전체 Box2D 이식이 아니라 현재 수동 충돌 해석에 kinematic box 충돌, 접점 표면 속도, stage restitution을 복구하는 것이다. 이유는 문제 지점이 좁고 기존 React lifecycle과 long-run 안정성 테스트를 유지할 수 있기 때문이다.
- 성공 기준은 회전 막대와 구슬 충돌 시 접선 방향 속도가 생기고, restitution 1 entity가 벽보다 강하게 반발하며, 기존 goalY 진행 안정성 테스트가 계속 통과하는 것이다.
- RED 확인 결과 `kinematic wheel transfers tangent velocity through collision`은 `vy=0.265`로 막대 충돌이 전혀 적용되지 않아 실패했고, `stage restitution preserves a strong rebound`는 `vy=-1.628`로 원본 restitution 1 체감보다 약해 실패했다.
- 구현은 `kinematic` box를 충돌 해석에 포함하고, 접점의 회전 표면 속도 `omega x radius`를 상대속도에 넣는 방식으로 처리했다. stage restitution은 `props.restitution` 값을 최대 1.5까지 직접 반영한다.
- 하단 게이트에서는 막대 아래쪽 재충돌에 붙는 문제가 있어 낙하 방향 룰렛에 맞게 kinematic box의 아래쪽 충돌은 통과시켰다. 대신 위쪽 접근 충돌과 접선 속도 전달은 유지한다.
- `npm test`는 3개 파일 27개 테스트가 통과했고, `npm run build`도 통과했다. 로컬 브라우저 `http://127.0.0.1:5173/LuckySpin/`에서 시작 후 35초 대기했을 때 `1 / 6` 결과가 기록되고 console warning/error 0건을 확인했다.


- 사용자가 여전히 벽을 통과하거나 벽에 붙었다가 날아가는 증상이 있다고 보고했다.
- 이전 수정은 Matter.js rectangle segment를 튜닝한 것이어서 원본 Box2D edge fixture의 연속 충돌 특성을 복원하지 못했다.
- 원본 `physics-box2d.ts`는 polyline을 한 body 안의 `b2EdgeShape.SetTwoSided` fixture 묶음으로 만든다. 현재 구현은 각 선분을 별도 얇은 rectangle body로 만들어 관절 틈, 모서리 침투, 순간 반발이 생길 수 있다.
- 이번 방향은 Matter.js stage body 충돌에 의존하지 않고, 구슬 원과 원본 polyline segment의 직접 충돌을 작은 substep에서 해석하는 것이다. 렌더링과 React 상태 구조는 유지한다.
- 직접 충돌 해석은 fixed substep, 속도 상한, circle-vs-segment 보정, static box/circle 보정으로 구성했다. kinematic wheel은 마지막 게이트에서 구슬을 되미는 문제가 있어 실제 충돌에서 제외하고 화면 회전만 남겼다.
- 새 회귀 테스트는 여러 구슬 장시간 실행, 빠른 구슬의 첫 경사 벽 관통 방지, 속도 상한을 확인한다. `npm test`와 `npm run build`는 통과했다.
- 브라우저 QA에서 기본 6개가 20초 이상 `0 / 6`에 머무르는 문제가 남아 있었다. 원인은 내부 polyline joint endpoint가 둥근 cap처럼 작동해 마지막 funnel과 중간 꺾임에서 구슬을 막는 것이었다.
- 내부 joint endpoint cap 충돌을 제외하고 adjacent segment만 처리하게 바꿨다. stuck assist 주기는 600ms로 낮췄고, 직접 충돌 해석의 중력과 속도 상한을 조정해 30초 안에 첫 결과가 나오게 했다.
- 로컬 QA는 desktop 1280x720과 mobile 390x844에서 각각 `1 / 6`까지 도달했고 console warning/error 0건이었다.
- GitHub Pages 배포 뒤 `https://asher8554.github.io/LuckySpin/`에서 desktop 1280x720 QA를 다시 실행했다. 약 31.7초에 `1 / 6`까지 도달했고 console warning/error 0건이었다.

## 2026-06-04 Wall Bounce Regression

- User reported marbles stick to walls instead of rebounding.
- Current `wallRestitution = 0.03` explains the symptom because normal velocity is almost removed after a wall collision.
- Scope stays narrow. Add a wall-collision regression test first, then tune wall elasticity without changing stage layout or result collection.
- Success criteria are `npm test`, `npm run build`, and a focused commit.
- RED test failed with `vx=-0.1197611385007269` against the stage wall, proving the sticky wall behavior.
- Raising `wallRestitution` to `0.6` made the new wall bounce test pass while preserving the existing long-run physics tests.
- `npm test` passed 3 files and 28 tests. `npm run build` passed.
- Local dev server ran on `http://127.0.0.1:5174/LuckySpin/` because port 5173 was already occupied. Playwright smoke QA clicked `시작`, saw the canvas continue rendering, and captured console warning/error 0 from the app.

## 2026-06-04 Bottom Spinner Contact Regression

- User reported elasticity is still wrong and the bottom rotating object does not physically detect contact.
- Recent change `wallRestitution = 0.6` improved the previous sticky-wall test, but that test only required rebound from `vx=4` to below `vx=-2`, which may still feel weak.
- Current `resolveBoxCollision` skips every kinematic box collision when `local.y > entity.shape.height`. That makes the bottom spinner one-sided and prevents contact when a marble reaches it from below or rides along the lower side.
- Root-cause tests should prove stronger wall rebound and two-sided bottom spinner contact before implementation.
- RED confirmed both issues. Bottom spinner from below continued upward with `vy=-2.7287589726926456`, and wall rebound from `vx=4` only returned `vx=-2.3952227700145485`.
- Implementation raised `wallRestitution` from `0.6` to `0.85` and removed the one-sided kinematic box skip.
- `npm test` passed 3 files and 29 tests. `npm run build` passed.
- Browser QA on `http://127.0.0.1:5174/LuckySpin/` passed. Short smoke clicked `시작` with canvas visible and app console warning/error 0. Long smoke reached `1 / 6` after 42 seconds with app console warning/error 0.

## 2026-06-04 Sloped Wall Bounce Regression

- User checked `https://asher8554.github.io/LuckySpin/` and reported marbles flow down walls instead of bouncing.
- Local `main` is ahead of `origin/main` by 3 commits, so the deployed Pages build is stale relative to recent wall/spinner fixes.
- Live Pages currently loads `assets/index-CBP-3iZr.js`, while local dev serves current source. Stale deploy explains part of the live mismatch.
- Separate root cause remains possible: existing wall tests cover vertical polyline bounce, not a sloped wall where gravity can keep the marble sliding along the tangent after contact.
- RED confirmed the slope issue locally. A marble already touching a 45-degree wall and moving along the tangent kept sliding with `vx=2.25987877766247`, `vy=2.2461156426936117`.
- Implementation added `wallSeparationSpeed = 3` for polyline wall collisions only. This gives an arcade-style minimum separation impulse when a marble is touching a wall but has little normal impact speed.
- `npm test` passed 3 files and 30 tests. `npm run build` passed with bundle `assets/index-Dbo7DZ1O.js`.
- Local browser QA on `http://127.0.0.1:5174/LuckySpin/` passed. 12-second smoke and 45-second long run had app console warning/error 0, and long run reached `1 / 6`.
- Pushed `ce0b2ca` to `origin/main`. GitHub Actions Pages run `26954079463` completed successfully.
- Live `https://asher8554.github.io/LuckySpin/` now loads `assets/index-Dbo7DZ1O.js`. Live browser QA passed: 12-second smoke had console warning/error 0, and 45-second long run reached `1 / 6` with console warning/error 0.

## 2026-06-04 Recording Feature

- User requested the recording feature.
- Existing UI already has a `녹화` toggle, but it only calls the unsupported-feature toast.
- Scope is browser-local canvas recording. Use `canvas.captureStream()` and `MediaRecorder`, then download a `.webm` file when the run completes.
- The toggle should arm recording before the run. `시작` starts recording automatically, and roulette completion stops and downloads the recording automatically. This avoids needing the hidden control panel during the running state.
- Added `src/lib/recording.ts` for MIME selection and stable UTC-based `.webm` file names.
- Added `useCanvasRecorder` to manage recording state, collect chunks, stop tracks, and download `luckyspin-YYYYMMDD-HHMMSS.webm`.
- Browser QA on local `http://127.0.0.1:5174/LuckySpin/` passed. Desktop checked `녹화`, clicked `시작`, received `luckyspin-YYYYMMDD-HHMMSS.webm`, reached `1 / 6`, and had console warning/error 0. Mobile settings panel showed the `녹화` toggle and checked it with console warning/error 0.
- `npm test` passed 4 files and 33 tests. `npm run build` passed with bundles `assets/index-BSAX4Pk8.css` and `assets/index-BB_lIUlI.js`.
- Pushed `ee8c1d1` to `origin/main`. GitHub Actions Pages run `26955025425` completed successfully.
- Live `https://asher8554.github.io/LuckySpin/` loads `assets/index-BB_lIUlI.js`. Live browser QA checked `녹화`, clicked `시작`, received `luckyspin-YYYYMMDD-HHMMSS.webm`, reached `1 / 6`, and had console warning/error 0.

## 2026-06-04 Remaining Maps

- User requested the remaining maps.
- The original `.reference/lazygyu-roulette/src/data/maps.ts` already contains four stage definitions. Current React port only wires `Wheel of fortune`; `bubble`, `jar`, and `night` still point to the wheel stage and are disabled in `ROULETTE_MAPS`.
- Scope is a data port plus selector enablement. Keep the current Matter.js physics engine and renderer, and avoid layout refactors.
- Success criteria are tests proving every map is enabled and stage-backed, `npm test`, `npm run build`, and browser QA that selects each map without the unsupported-map toast.
- Ported the original `BubblePop`, `Pot of greed`, and `Yoru ni Kakeru` stage data into `src/lib/stage.ts`, added stable named exports for each stage, and enabled all four `ROULETTE_MAPS` entries.
- Added tests for enabled map options, original stage metadata, distinct stage objects, and short physics-world stability across every shipped map.
- `npm test` passed 4 files and 37 tests. `npm run build` passed with bundle `assets/index-BoPpu8pZ.js`.
- Local browser QA on `http://127.0.0.1:5174/LuckySpin/` selected and started `wheel`, `bubble`, `jar`, and `night`; every option was enabled, canvas rendered, unsupported-map toast 0, console warning/error 0.
- Pushed `4f6e7c4` to `origin/main`. GitHub Actions Pages run `26956381645` completed successfully.
- Live `https://asher8554.github.io/LuckySpin/` loads `assets/index-BoPpu8pZ.js`. Live browser QA selected and started all four maps; every option was enabled, canvas rendered, unsupported-map toast 0, console warning/error 0.

## 2026-06-05 Map Preview Switch

- User reported that changing the map does not update the canvas until pressing start.
- Root-cause hypothesis: idle rendering calls `drawRouletteScene` with `worldRef.current === null`, and `drawRouletteScene` falls back to `wheelOfFortuneStage` because the selected `mapId` stage is not passed into the preview scene.
- Success criteria are a RED test for null-world preview stage selection, `npm test`, `npm run build`, and browser QA proving map selection changes the visible canvas before start.
- RED confirmed the issue. Passing `ROULETTE_STAGES.bubble` into a null-world preview still produced 0 circle draw calls because `drawRouletteScene` ignored the selected preview stage.
- Implementation added optional `scene.stage` fallback support in `drawRouletteScene` and passes `getStageForMap(mapId)` from `useRoulettePhysics` while idle.
- `npm test` passed 4 files and 38 tests. `npm run build` passed with bundle `assets/index-CxD5splF.js`.
- Local browser QA on `http://127.0.0.1:5174/LuckySpin/` passed. Desktop changed wheel to bubble and bubble to night before start with different canvas hashes, status still idle, unsupported toast 0, console warning/error 0. Mobile changed wheel to jar after opening settings with the same checks.
- Pushed `5084281` to `origin/main`. GitHub Actions Pages run `27009564132` completed successfully.
- Live `https://asher8554.github.io/LuckySpin/` loads `assets/index-CxD5splF.js`. Live browser QA changed wheel to bubble before start; canvas hash changed, status stayed idle, unsupported toast 0, console warning/error 0.

## 2026-06-05 Pot Of Greed Wall Containment

- User reported that Pot of greed can let marbles pass through walls and requested a hard guarantee against wall crossing.
- Current physics resolves collisions after moving the marble to its next position. That can miss tunneling if the marble crosses a wall segment or thin box between substeps and ends outside the overlap range.
- Success criteria are regression tests for swept wall containment, `npm test`, `npm run build`, and browser QA on Pot of greed.
- RED confirmed a real joint gap. A marble near an L-shaped polyline corner stayed only `0.190` units from the wall joint, below the marble radius `0.25`, because internal polyline caps were skipped on both adjacent segments.
- Pot of greed long-run containment also failed before the final fix around the lower-left outer wall envelope near y=102.
- Implementation adds internal polyline vertex collision, swept segment crossing detection using the previous substep position, and a polyline wall collision radius that includes half the rail thickness.
- `npm test` passed 4 files and 40 tests. `npm run build` passed with bundle `assets/index-CpyTA2Ns.js`.
- Local browser QA on `http://127.0.0.1:5174/LuckySpin/` selected Pot of greed, started the roulette, ran 25 seconds, saw canvas motion, unsupported toast 0, console warning/error 0.
- Pushed `7afb5a2` to `origin/main`. GitHub Actions Pages run `27012156972` completed successfully.
- Live `https://asher8554.github.io/LuckySpin/` loads `assets/index-CpyTA2Ns.js`. Live browser QA selected Pot of greed, started the roulette, ran 15 seconds, saw canvas motion, unsupported toast 0, console warning/error 0.

## 2026-06-05 Skill Activation

- User requested implementing skill activation.
- Current `스킬 활성화` checkbox is wired to the generic unsupported-feature toast and always remains unchecked.
- Original reference roulette has an `Impact` skill that periodically creates a ring effect and pushes nearby marbles away from the source marble.
- Scope is the smallest useful port: real checkbox state, impact cooldown while running, nearby marble impulse, and a canvas ring effect. Shop remains unsupported.
- Success criteria are RED tests for skill timing/effects/impact, `npm test`, `npm run build`, browser QA proving the checkbox no longer shows the unsupported toast, then commit and deploy.
- RED confirmed missing implementation. `src/lib/skills.test.ts` could not resolve `./skills`, and `applyImpactSkill` was not exported.
- Implementation added bounded impact cooldowns, a 500ms expanding/fading ring effect, and `applyImpactSkill` that pushes nearby unfinished marbles away from the source.
- The `스킬 활성화` checkbox now stores real app state and passes it into the roulette physics hook. The generic unsupported toast path remains only for shop.
- `npm test` passed 5 files and 44 tests. `npm run build` passed with bundle `assets/index-CqiKKije.js`.
- Local browser QA on `http://127.0.0.1:5174/LuckySpin/` passed. It checked `스킬 활성화`, saw no unsupported toast, started a weighted run, detected 387 skill ring draw calls, saw canvas motion, and had console warning/error 0.
- Pushed `c93e083` to `origin/main`. GitHub Actions Pages run `27012857791` completed successfully.
- Live `https://asher8554.github.io/LuckySpin/` loads `assets/index-CqiKKije.js`. Live browser QA checked `스킬 활성화`, saw no unsupported toast, started a weighted run, detected 387 skill ring draw calls, saw canvas motion, and had console warning/error 0.

## 2026-06-05 Marble Collision

- User requested physical collision between marbles.
- Current physics updates each marble independently and only resolves collisions against stage entities and world bounds. Matter bodies are used as state containers, not as the active collision solver.
- Scope is pairwise circle collision inside the current fixed-step physics loop: separate overlapping marbles, exchange normal velocity with visible restitution, preserve speed clamps, and avoid refactoring the renderer or stage data.
- Success criteria are a RED test for two marbles colliding, `npm test`, `npm run build`, browser QA showing the app still runs with multiple marbles, then commit and deploy.
- RED confirmed the missing behavior. Two marbles passed through each other, overlapped at distance `0.384`, and kept their original opposing velocities.
- Implementation adds pairwise marble circle resolution after each fixed physics substep. Overlapping marbles are split apart, closing normal velocity is reflected with `marbleRestitution = 0.9`, and both velocities stay under the existing speed cap.
- Targeted `npm test -- src/lib/stage.test.ts` passed 1 file and 24 tests after the fix.
- `npm test` passed 5 files and 45 tests.
- `npm run build` passed with bundle `assets/index-Bu5-EonE.js`.
- Browser plugin QA on `http://127.0.0.1:5174/LuckySpin/` passed. It loaded the app, filled 8 marble names, clicked start, saw screenshot hash change from `531b1f34` to `f374af0b`, kept one canvas visible, and had console warning/error 0.
- Pushed `407f301` to `origin/main`. GitHub Actions Pages run `27013748400` completed successfully.
- Live `https://asher8554.github.io/LuckySpin/` loads `assets/index-Bu5-EonE.js`.
