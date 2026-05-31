# Physics Elastic Kinematic Plan

## 목표

원본 `https://lazygyu.github.io/roulette/`의 Box2D 체감에 더 가깝게 LuckySpin 물리를 보정한다.

현재 차이는 두 가지다.

- `kinematic` 회전 막대가 화면에서만 돌고 구슬 충돌에는 참여하지 않는다.
- stage `restitution` 값이 지나치게 낮게 매핑되어 원본의 튀는 충돌감이 사라졌다.

## 결정

이번 범위에서는 `box2d-wasm` 전체 이식이 아니라 현재 `src/lib/physics.ts`의 수동 충돌 해석을 보정한다.

이유.

- 원본 stage 좌표와 entity 모델은 이미 들어와 있다.
- 문제 지점이 `resolveEntityCollision`에서 `kinematic`을 제외하는 분기와 낮은 restitution 상수로 좁혀졌다.
- 전체 엔진 교체는 async init, lifecycle, bundle, 테스트를 다시 설계해야 해서 이번 결함 수정 범위를 넘는다.

## 구현

1. 회전 막대의 현재 각도 `StageBodyState.angle`을 box 충돌에 사용한다.
2. 회전 막대 접점의 표면 속도 `omega x radius`를 충돌 상대속도에 반영한다.
3. `StageEntity.props.restitution`을 더 직접적으로 충돌 해석에 사용한다.
4. 과속과 stage 이탈을 막는 기존 속도 상한과 containment 정책은 유지한다.

## 검증

- `kinematic` 막대 근처에 둔 구슬이 충돌 후 접선 방향 속도를 얻는 테스트.
- restitution 1 핀에 부딪힌 구슬이 낮은 벽 탄성보다 크게 반발하는 테스트.
- 기존 long-run goalY 진행 테스트 유지.
- `npm test`.
- `npm run build`.
- 로컬 브라우저에서 시작 후 막대 구간 충돌 체감 확인.
