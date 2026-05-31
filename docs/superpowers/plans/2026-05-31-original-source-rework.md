# Original Source Rework Plan

## 목표

`lazygyu/roulette` 원본 구조를 기준으로 LuckySpin 구현을 다시 맞춘다.

현재 차이는 UI 색감만의 문제가 아니다. 원본의 핵심은 `StageDef.entities`, `goalY`, 카메라 추적, live rank, 선택 당첨 순위 판정이다. 이번 작업은 전체 Box2D 포팅 대신 기존 React/Vite 구조 안에서 원본의 데이터 모델과 동작 축을 복원한다.

## 확인한 원본 기준

- 맵 데이터는 `src/data/maps.ts`의 `StageDef.entities`가 단일 기준이다.
- 미니맵은 원본 좌표를 4배 스케일로 그린다.
- 메인 화면은 카메라가 구슬을 따라가고, goal 근처에서 줌이 증가한다.
- 결과는 `goalY`를 넘은 순서로 기록하고, 설정된 당첨 순위에 도달하면 우승자를 표시한다.
- 랭킹은 완료된 결과와 아직 남은 구슬을 함께 보여준다.

## 작업 범위

1. 원본 첫 맵 `Wheel of fortune`의 지형을 별도 stage 데이터로 만든다.
2. Matter.js 바디 생성과 캔버스 렌더링을 stage entity 기반으로 바꾼다.
3. 구슬 좌표계를 원본 world unit 중심으로 바꾸고 화면 좌표는 camera transform에서만 변환한다.
4. `goalY` 기준 결과 판정과 live rank 표시를 구현한다.
5. 원본과 충돌하는 큰 프리뷰 구슬 중심 화면을 제거하고 미니맵, 트랙, 랭킹 중심으로 정리한다.
6. README에 원본 MIT 저장소 참조와 구현 범위를 명확히 적는다.

## 검증

- `npm test`.
- `npm run build`.
- Playwright로 로컬 페이지를 열어 시작 전, 실행 중, 완료 후 화면을 확인한다.
- GitHub Pages 배포 후 live URL을 확인한다.
