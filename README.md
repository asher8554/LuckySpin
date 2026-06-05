# LuckySpin

LuckySpin은 `https://lazygyu.github.io/roulette/`의 룰렛 경험을 React 기반으로 재구현한 추첨 도구입니다. 원본 `lazygyu/roulette`의 4개 맵 데이터를 기준으로 트랙, 미니맵, 카메라 추적, goalY 결과 판정을 맞췄습니다.

## GitHub Pages

배포 주소는 다음과 같습니다.

https://asher8554.github.io/LuckySpin/

이 프로젝트는 Vite 앱이므로 GitHub Pages에서 바로 소스 파일을 서비스하지 않고, GitHub Actions가 `dist` 산출물을 빌드해 Pages artifact로 배포합니다.

GitHub 저장소 설정에서 Pages의 Build and deployment Source가 `GitHub Actions`로 선택되어 있어야 합니다.

## 주요 기능

- 이름 입력과 반복 수 입력을 지원합니다. 예를 들어 `수박*2,키위*2,귤*2`처럼 입력할 수 있습니다.
- 원본 `StageDef.entities`를 옮긴 트랙에서 `matter-js` 구슬이 이동합니다.
- `goalY`를 넘은 순서와 선택한 당첨 순위를 오른쪽 순위판에 표시합니다.
- 원본처럼 왼쪽 미니맵, 하단 설정 패널, 진행 중 패널 숨김, winner 배너를 제공합니다.
- 섞기, 시작, 다크 모드, 첫번째/마지막/직접 당첨 순위를 지원합니다.
- `Wheel of fortune`, `BubblePop`, `Pot of greed`, `Yoru ni Kakeru` 맵을 선택해 실행할 수 있습니다.
- 스킬 활성화를 켜면 진행 중인 공이 주기적으로 충격파를 일으켜 주변 공을 밀어냅니다.
- 상점은 아직 연결하지 않았습니다.
- 녹화 토글을 켜고 시작하면 룰렛 캔버스를 녹화한 뒤 결과가 나오면 `.webm` 파일로 자동 저장합니다.

## 로컬 실행

```bash
npm ci
npm run dev
```

브라우저에서 `http://localhost:5173/LuckySpin/`을 엽니다.

## 검증

```bash
npm test
npm run build
```

`npm run build`는 TypeScript 빌드와 Vite 프로덕션 빌드를 함께 실행합니다.

## 기술 스택

- Vite
- React
- TypeScript
- matter-js
- Vitest

## 원본 기준

- 원본 저장소는 `https://github.com/lazygyu/roulette`입니다.
- 원본은 MIT 라이선스입니다.
- 현재 구현은 전체 Box2D 포팅이 아니라 React/Vite 구조 안에서 원본 4개 맵의 데이터 모델과 동작 방식을 재현한 버전입니다.
