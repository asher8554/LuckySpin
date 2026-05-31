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
