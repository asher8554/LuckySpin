# LuckySpin 작업 체크리스트

- [x] 원본 페이지 화면과 주요 기능을 확인한다.
- [x] 구현 범위와 기술 스택을 사용자에게 확인받는다.
- [x] 현재 폴더에서 새 Git 저장소를 초기화한다.
- [x] 설계 문서를 작성한다.
- [x] 설계 문서를 검토하고 커밋한다.
- [x] 구현 계획 문서를 작성한다.
- [x] 사용자 승인 후 구현을 시작한다.
- [x] 테스트와 빌드, 브라우저 검증을 완료한다.
- [x] 완성된 논리 단위별로 커밋한다.

## Task 2. Roulette Domain Logic

- [x] 룰렛 입력 파서와 순위 계산 테스트를 먼저 작성한다.
- [x] 테스트 실패가 구현 파일 부재 때문인지 확인한다.
- [x] 공유 타입과 룰렛 순수 함수를 구현한다.
- [x] 대상 테스트와 빌드를 통과시킨다.
- [x] `feat: add roulette domain logic` 커밋을 만든다.

## Implementation

- [x] Vite, React, TypeScript 기반 앱을 구성한다.
- [x] 하단 이름 입력과 설정 패널을 구현한다.
- [x] 공지 모달, 순위판, 토스트 안내를 구현한다.
- [x] `matter-js` 기반 구슬 물리와 캔버스 룰렛을 구현한다.
- [x] 앱 상태와 물리 결과 집계를 연결한다.
- [x] 원본과 유사한 어두운 트랙, 과일 구슬, 하단 패널 시각을 맞춘다.
- [x] 브라우저 검증 중 발견한 시작 상태, 토스트, 모바일 겹침 문제를 수정한다.
- [x] `npm test`와 `npm run build`를 통과시킨다.
- [x] Playwright CLI로 데스크톱과 모바일 화면을 검증한다.

## GitHub Pages

- [x] GitHub Pages 배포 방식을 확인한다.
- [x] Pages 배포용 GitHub Actions 워크플로를 추가한다.
- [x] 프로젝트 README를 작성한다.
- [x] 테스트와 빌드를 다시 실행한다.
- [x] 변경 사항을 커밋한다.

## Original Match Polish

- [x] 원본과 현재 구현을 같은 화면 크기로 캡처한다.
- [x] 큰 시각 차이를 정리한다.
- [x] 룰렛 트랙, 구슬, 패널, 순위판을 원본에 가깝게 조정한다.
- [x] 테스트와 빌드를 다시 실행한다.
- [x] 브라우저로 데스크톱과 모바일을 확인한다.
- [x] 변경 사항을 커밋하고 Pages에 배포한다.

## Original Source Rework

- [x] 원본 `lazygyu/roulette` 저장소를 `.reference/lazygyu-roulette`에 복제했다.
- [x] 하위 에이전트로 원본 구조와 현재 구현 차이를 비교했다.
- [x] 원본 기준 재작업 계획 문서를 작성했다.
- [x] `.reference/`를 Git 추적 대상에서 제외한다.
- [x] 원본 `StageDef.entities` 기반 맵 데이터를 도입한다.
- [x] stage entity 기반 Matter.js 바디 생성과 캔버스 렌더링을 구현한다.
- [x] `goalY` 기준 결과 판정과 live rank 표시를 구현한다.
- [x] 원본과 충돌하는 임시 프리뷰와 비활성 제약을 정리한다.
- [x] README에 원본 저장소 기준과 구현 범위를 갱신한다.
- [x] `npm test`, `npm run build`, 브라우저 검증을 통과시킨다.
- [x] 변경 사항을 커밋하고 GitHub Pages 배포를 확인한다.

## Physics Collision Fix

- [x] 자유낙하 증상을 테스트로 재현했다.
- [x] Matter.js 중력 스케일이 원본 Box2D 좌표계에 비해 너무 커서 레일을 통과하는 원인을 확인했다.
- [x] 중력 스케일을 낮추고 stuck assist 조건을 포함한 진행 테스트를 추가했다.
- [x] `npm test`, `npm run build`, 브라우저 검증을 통과시켰다.

## Physics Bounce Fix

- [x] 과도한 반발과 맵 밖 이탈 증상을 테스트로 재현했다.
- [x] kinematic 바퀴의 시각 회전이 Matter.js 각속도 충돌로 주입되는 경로를 제거했다.
- [x] 레일 두께, stage restitution, stuck assist 힘을 낮춰 충돌 반발을 안정화했다.
- [x] 보이지 않는 좌우 containment wall을 추가해 구슬이 stage 밖으로 새지 않게 했다.
- [x] `npm test`, `npm run build`, 로컬 브라우저 검증을 통과시켰다.

## Physics Stability Rework

- [x] 원본 Box2D edge fixture 방식과 현재 Matter.js segment 방식 차이를 확인한다.
- [x] 벽 통과와 순간 발사를 재현하는 회귀 테스트를 추가한다.
- [x] polyline 충돌을 틈 없는 circle-vs-segment 해석으로 교체한다.
- [x] kinematic wheel은 직접 충돌에서 제외하고 시각 회전으로만 유지한다.
- [x] `npm test`, `npm run build`, 브라우저 검증을 통과시킨다.
- [ ] Pages 배포 검증을 통과시킨다.
