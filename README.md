# LuckySpin

LuckySpin은 `https://lazygyu.github.io/roulette/`의 룰렛 경험을 새 코드로 재구현한 React 기반 추첨 도구입니다. 과일 구슬이 물리 트랙을 따라 이동하고, 도착 순서에 따라 순위가 기록됩니다.

## GitHub Pages

배포 주소는 다음과 같습니다.

https://asher8554.github.io/LuckySpin/

이 프로젝트는 Vite 앱이므로 GitHub Pages에서 바로 소스 파일을 서비스하지 않고, GitHub Actions가 `dist` 산출물을 빌드해 Pages artifact로 배포합니다.

GitHub 저장소 설정에서 Pages의 Build and deployment Source가 `GitHub Actions`로 선택되어 있어야 합니다.

## 주요 기능

- 이름 입력과 반복 수 입력을 지원합니다. 예를 들어 `수박*2,키위*2,귤*2`처럼 입력할 수 있습니다.
- `matter-js` 물리 엔진으로 과일 구슬이 트랙 위를 이동합니다.
- 도착 순서와 선택한 당첨 순위를 오른쪽 순위판에 표시합니다.
- 섞기, 시작, 다크 모드, 공지 모달을 제공합니다.
- 상점, 녹화, 스킬, 추가 맵은 첫 버전에서 안내 토스트만 표시합니다.

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
