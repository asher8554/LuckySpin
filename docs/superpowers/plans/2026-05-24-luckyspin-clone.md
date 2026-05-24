# LuckySpin Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Korean-only Vite + React + TypeScript roulette app that recreates the functional and visual feel of `https://lazygyu.github.io/roulette/` with new source code.

**Architecture:** React owns app state, settings, inputs, toast state, and ranking state. The canvas layer uses `matter-js` through a dedicated hook that owns engine lifecycle, track bodies, collision sensors, animation frames, and cleanup. Pure parsing, expansion, shuffle, fruit mapping, and storage logic stay in `src/lib` so the risky parts can be tested independently.

**Tech Stack:** Vite, React, TypeScript, Vitest, Matter.js, lucide-react, CSS, Playwright CLI for visual verification.

---

## File Structure

- Create: `package.json` for scripts and dependencies.
- Create: `index.html` for Vite entry.
- Create: `vite.config.ts` with React plugin, Vitest config, and `base: "/LuckySpin/"`.
- Create: `tsconfig.json`, `tsconfig.node.json`, `src/vite-env.d.ts`.
- Create: `src/main.tsx` as the React mount point.
- Create: `src/App.tsx` as top-level state orchestration.
- Create: `src/App.css` for app layout, control panel, ranking board, modal, toast, and responsive behavior.
- Create: `src/types.ts` for shared app, marble, rank, map, and toast types.
- Create: `src/lib/roulette.ts` and `src/lib/roulette.test.ts` for parsing, expansion, shuffle, rank clamping, and map definitions.
- Create: `src/lib/fruits.ts` for stable marble visual styles and canvas fruit drawing.
- Create: `src/lib/storage.ts` for local storage helpers.
- Create: `src/lib/physics.ts` for Matter.js world creation, track geometry, marble body creation, and drawing helpers.
- Create: `src/hooks/useRoulettePhysics.ts` for engine, runner, resize, animation, and collision lifecycle.
- Create: `src/components/ControlPanel.tsx` for settings, name input, actions, unsupported controls, and mobile collapse.
- Create: `src/components/RouletteCanvas.tsx` for the canvas element and hook integration.
- Create: `src/components/RankingBoard.tsx` for `current / total` and ordered results.
- Create: `src/components/NoticeModal.tsx` for the first-version notice.
- Create: `src/components/ToastHost.tsx` for transient messages.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/vite-env.d.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.css`

- [ ] **Step 1: Create the minimal React/Vite files**

Create `package.json` with these scripts first. Dependencies will be installed in Step 2.

```json
{
  "name": "luckyspin",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run --passWithNoTests"
  }
}
```

Create `index.html`.

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="과일 구슬이 굴러가는 추첨 룰렛" />
    <title>LuckySpin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `vite.config.ts`.

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/LuckySpin/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

Create `tsconfig.json`.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`.

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Create `src/vite-env.d.ts`.

```ts
/// <reference types="vite/client" />
```

Create `src/main.tsx`.

```tsx
// React 앱을 브라우저 DOM에 마운트한다.
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create temporary `src/App.tsx`.

```tsx
// LuckySpin 앱의 최상위 화면을 임시로 렌더링한다.
export default function App() {
  return (
    <main className="app-shell">
      <h1>LuckySpin</h1>
      <p>룰렛 구현 준비 중입니다.</p>
    </main>
  );
}
```

Create temporary `src/App.css`.

```css
/* 앱 전체의 기본 레이아웃과 색상을 정의한다. */
:root {
  color: #f7f7f7;
  background: #050505;
  font-family: "Segoe UI", system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input,
select,
textarea {
  font: inherit;
}

.app-shell {
  display: grid;
  min-height: 100vh;
  place-items: center;
  text-align: center;
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install react react-dom matter-js lucide-react
npm install -D @vitejs/plugin-react vite typescript vitest jsdom @types/react @types/react-dom @types/matter-js
```

Expected: `node_modules/`, `package-lock.json`, and dependency fields are created.

- [ ] **Step 3: Run the initial build and test commands**

Run:

```bash
npm run build
npm test
```

Expected: build passes. Test command passes even before test files exist.

- [ ] **Step 4: Commit scaffold**

Run:

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json src
git commit -m "chore: scaffold LuckySpin app"
```

---

### Task 2: Roulette Domain Logic With Tests

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/roulette.ts`
- Create: `src/lib/roulette.test.ts`

- [ ] **Step 1: Write failing tests for parser, expansion, shuffle, and rank clamping**

Create `src/lib/roulette.test.ts`.

```ts
// 룰렛 입력 파서와 순위 계산 로직을 검증한다.
import { describe, expect, it } from "vitest";
import {
  clampWinnerRank,
  expandEntries,
  parseEntries,
  shuffleEntries,
} from "./roulette";

describe("parseEntries", () => {
  it("splits names by comma and newline", () => {
    expect(parseEntries("수박, 키위\n귤")).toEqual([
      { name: "수박", count: 1, weight: 1 },
      { name: "키위", count: 1, weight: 1 },
      { name: "귤", count: 1, weight: 1 },
    ]);
  });

  it("parses repeat counts and ignores invalid counts", () => {
    expect(parseEntries("수박*2,키위*0,귤*abc")).toEqual([
      { name: "수박", count: 2, weight: 1 },
      { name: "키위", count: 1, weight: 1 },
      { name: "귤", count: 1, weight: 1 },
    ]);
  });

  it("parses optional weights", () => {
    expect(parseEntries("키위/3,귤/0")).toEqual([
      { name: "키위", count: 1, weight: 3 },
      { name: "귤", count: 1, weight: 1 },
    ]);
  });
});

describe("expandEntries", () => {
  it("creates stable marble instances for repeated entries", () => {
    expect(expandEntries([{ name: "수박", count: 2, weight: 1 }])).toEqual([
      { id: "수박-1-0", name: "수박", label: "수박", weight: 1, duplicateIndex: 0 },
      { id: "수박-1-1", name: "수박", label: "수박", weight: 1, duplicateIndex: 1 },
    ]);
  });
});

describe("shuffleEntries", () => {
  it("keeps the same marbles after shuffling", () => {
    const marbles = expandEntries(parseEntries("수박*2,키위,귤"));
    const shuffled = shuffleEntries(marbles, 42);
    expect(shuffled).toHaveLength(marbles.length);
    expect(shuffled.map((marble) => marble.id).sort()).toEqual(
      marbles.map((marble) => marble.id).sort(),
    );
  });
});

describe("clampWinnerRank", () => {
  it("clamps rank into one-based result bounds", () => {
    expect(clampWinnerRank(0, 6)).toBe(1);
    expect(clampWinnerRank(7, 6)).toBe(6);
    expect(clampWinnerRank(Number.NaN, 6)).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- src/lib/roulette.test.ts
```

Expected: FAIL because `src/lib/roulette.ts` does not exist.

- [ ] **Step 3: Implement shared types**

Create `src/types.ts`.

```ts
// 룰렛 앱 전반에서 공유하는 타입을 정의한다.
export type WinnerMode = "first" | "last" | "custom";

export type ThemeMode = "dark" | "light";

export type RouletteStatus = "idle" | "running" | "finished";

export type MapId = "wheel" | "bubble" | "jar" | "night";

export interface ParsedEntry {
  name: string;
  count: number;
  weight: number;
}

export interface MarbleEntry {
  id: string;
  name: string;
  label: string;
  weight: number;
  duplicateIndex: number;
}

export interface RouletteResult extends MarbleEntry {
  rank: number;
}

export interface ToastMessage {
  id: string;
  message: string;
}
```

- [ ] **Step 4: Implement domain logic**

Create `src/lib/roulette.ts`.

```ts
// 룰렛 입력 파싱과 순위 계산에 필요한 순수 함수를 제공한다.
import type { MapId, MarbleEntry, ParsedEntry } from "../types";

export const DEFAULT_NAMES = "수박*2,키위*2,귤*2";

export const ROULETTE_MAPS: Array<{ id: MapId; label: string; enabled: boolean }> = [
  { id: "wheel", label: "운명의 수레바퀴", enabled: true },
  { id: "bubble", label: "버블팝", enabled: false },
  { id: "jar", label: "욕망의 항아리", enabled: false },
  { id: "night", label: "밤을 달리다", enabled: false },
];

const ENTRY_PATTERN = /^\s*([^/*]+?)\s*(?:\/(\d+))?\s*(?:\*(\d+))?\s*$/;

function safePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseEntries(input: string): ParsedEntry[] {
  return input
    .split(/[,\r\n]+/g)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      const match = token.match(ENTRY_PATTERN);

      if (!match) {
        return { name: token.replace(/[/*].*$/, "").trim() || token, count: 1, weight: 1 };
      }

      return {
        name: match[1].trim(),
        weight: safePositiveInteger(match[2], 1),
        count: safePositiveInteger(match[3], 1),
      };
    })
    .filter((entry) => entry.name.length > 0);
}

export function expandEntries(entries: ParsedEntry[]): MarbleEntry[] {
  return entries.flatMap((entry) =>
    Array.from({ length: entry.count }, (_, duplicateIndex) => ({
      id: `${entry.name}-${entry.weight}-${duplicateIndex}`,
      name: entry.name,
      label: entry.name,
      weight: entry.weight,
      duplicateIndex,
    })),
  );
}

function seededRandom(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function shuffleEntries(entries: MarbleEntry[], seed = Date.now()): MarbleEntry[] {
  const random = seededRandom(seed);
  const next = [...entries];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

export function clampWinnerRank(rank: number, total: number) {
  if (total <= 0 || !Number.isFinite(rank)) {
    return 1;
  }

  return Math.min(Math.max(Math.trunc(rank), 1), total);
}
```

- [ ] **Step 5: Run tests to verify domain logic passes**

Run:

```bash
npm test -- src/lib/roulette.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit domain logic**

Run:

```bash
git add src/types.ts src/lib/roulette.ts src/lib/roulette.test.ts
git commit -m "feat: add roulette domain logic"
```

---

### Task 3: Storage, Toast, Notice, And Ranking UI

**Files:**
- Create: `src/lib/storage.ts`
- Create: `src/components/ToastHost.tsx`
- Create: `src/components/NoticeModal.tsx`
- Create: `src/components/RankingBoard.tsx`

- [ ] **Step 1: Implement local storage helpers**

Create `src/lib/storage.ts`.

```ts
// 이름과 테마 설정을 브라우저 로컬 저장소에 저장하고 읽는다.
import { DEFAULT_NAMES } from "./roulette";
import type { ThemeMode } from "../types";

const STORAGE_KEYS = {
  names: "luckyspin:names",
  theme: "luckyspin:theme",
};

export function loadNames() {
  return localStorage.getItem(STORAGE_KEYS.names) ?? DEFAULT_NAMES;
}

export function saveNames(names: string) {
  localStorage.setItem(STORAGE_KEYS.names, names);
}

export function loadTheme(): ThemeMode {
  return localStorage.getItem(STORAGE_KEYS.theme) === "light" ? "light" : "dark";
}

export function saveTheme(theme: ThemeMode) {
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}
```

- [ ] **Step 2: Implement toast host**

Create `src/components/ToastHost.tsx`.

```tsx
// 짧은 상태 메시지를 화면 하단에 표시한다.
import type { ToastMessage } from "../types";

interface ToastHostProps {
  messages: ToastMessage[];
}

export function ToastHost({ messages }: ToastHostProps) {
  return (
    <div className="toast-host" aria-live="polite" aria-atomic="true">
      {messages.map((toast) => (
        <div className="toast" key={toast.id}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Implement notice modal**

Create `src/components/NoticeModal.tsx`.

```tsx
// 첫 버전 안내와 원본 대체 정책을 보여주는 공지 모달이다.
interface NoticeModalProps {
  open: boolean;
  onClose: () => void;
}

export function NoticeModal({ open, onClose }: NoticeModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="notice-backdrop" role="presentation">
      <section className="notice-modal" role="dialog" aria-modal="true" aria-labelledby="notice-title">
        <h2 id="notice-title">공지</h2>
        <div className="notice-body">
          <h3>LuckySpin 첫 버전</h3>
          <p>
            이 페이지는 새 코드로 구현한 룰렛 클론입니다. 녹화, 상점, 외부 이미지 연동은 첫 버전에서
            지원하지 않습니다.
          </p>
        </div>
        <div className="notice-actions">
          <button type="button" onClick={onClose}>
            닫기
          </button>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Implement ranking board**

Create `src/components/RankingBoard.tsx`.

```tsx
// 룰렛 진행 수와 도착 순위를 표시한다.
import type { RouletteResult } from "../types";

const rankColors = ["#6f8cff", "#ff5fb8", "#39e8d0", "#57e66e", "#f5d84a", "#ff6e6e"];

interface RankingBoardProps {
  total: number;
  results: RouletteResult[];
  selectedRank: number;
}

export function RankingBoard({ total, results, selectedRank }: RankingBoardProps) {
  return (
    <aside className="ranking-board" aria-label="당첨 순위">
      <div className="ranking-count">
        {results.length} / {total}
      </div>
      <ol>
        {results.map((result, index) => (
          <li
            className={result.rank === selectedRank ? "selected" : ""}
            key={`${result.id}-${result.rank}`}
            style={{ color: rankColors[index % rankColors.length] }}
          >
            <span>{result.name}</span>
            <strong>#{result.rank}</strong>
          </li>
        ))}
      </ol>
    </aside>
  );
}
```

- [ ] **Step 5: Commit UI support components**

Run:

```bash
git add src/lib/storage.ts src/components/ToastHost.tsx src/components/NoticeModal.tsx src/components/RankingBoard.tsx
git commit -m "feat: add roulette support UI"
```

---

### Task 4: Control Panel UI

**Files:**
- Create: `src/components/ControlPanel.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: Implement control panel component**

Create `src/components/ControlPanel.tsx`.

```tsx
// 이름 입력과 룰렛 설정, 실행 버튼을 제공하는 하단 패널이다.
import {
  Bell,
  Bomb,
  Map,
  Moon,
  Play,
  Settings,
  Shuffle,
  Store,
  Sun,
  Trophy,
  Video,
} from "lucide-react";
import type { MapId, RouletteStatus, ThemeMode, WinnerMode } from "../types";
import { ROULETTE_MAPS } from "../lib/roulette";

interface ControlPanelProps {
  names: string;
  mapId: MapId;
  theme: ThemeMode;
  winnerMode: WinnerMode;
  winnerRank: number;
  total: number;
  status: RouletteStatus;
  collapsed: boolean;
  onNamesChange: (value: string) => void;
  onShuffle: () => void;
  onStart: () => void;
  onMapChange: (mapId: MapId) => void;
  onThemeChange: (theme: ThemeMode) => void;
  onWinnerModeChange: (mode: WinnerMode) => void;
  onWinnerRankChange: (rank: number) => void;
  onUnsupported: (feature: string) => void;
  onNotice: () => void;
  onToggleCollapsed: () => void;
}

export function ControlPanel({
  names,
  mapId,
  theme,
  winnerMode,
  winnerRank,
  total,
  status,
  collapsed,
  onNamesChange,
  onShuffle,
  onStart,
  onMapChange,
  onThemeChange,
  onWinnerModeChange,
  onWinnerRankChange,
  onUnsupported,
  onNotice,
  onToggleCollapsed,
}: ControlPanelProps) {
  const running = status === "running";

  return (
    <section className={`control-panel ${running ? "is-running" : ""}`} aria-label="룰렛 설정">
      <button className="mobile-settings-toggle" type="button" onClick={onToggleCollapsed}>
        <Settings size={18} />
        <span>설정</span>
        <span aria-hidden="true">{collapsed ? "▲" : "▼"}</span>
      </button>

      <div className="name-panel">
        <h2>이름들을 입력하세요</h2>
        <textarea
          aria-label="이름 입력"
          value={names}
          placeholder="이름들을 쉼표나 엔터로 구분해서 넣어주세요"
          onChange={(event) => onNamesChange(event.target.value)}
        />
        <div className="action-row">
          <button type="button" aria-label="공지" onClick={onNotice}>
            <Bell size={24} />
          </button>
          <button type="button" className="shop-button" onClick={() => onUnsupported("상점")}>
            <Store size={22} />
            <span>NEW</span>
          </button>
          <span className="action-spacer" />
          <button type="button" onClick={onShuffle} disabled={running || total === 0}>
            <Shuffle size={22} />
            섞기
          </button>
          <button type="button" onClick={onStart} disabled={total === 0}>
            <Play size={22} />
            시작
          </button>
        </div>
      </div>

      <div className={`settings-panel ${collapsed ? "collapsed" : ""}`}>
        <label className="settings-row">
          <span>
            <Map size={24} />
            맵
          </span>
          <select value={mapId} onChange={(event) => onMapChange(event.target.value as MapId)}>
            {ROULETTE_MAPS.map((map) => (
              <option key={map.id} value={map.id}>
                {map.label}
              </option>
            ))}
          </select>
        </label>

        <div className="settings-row two-columns">
          <label>
            <span>
              <Video size={24} />
              녹화
            </span>
            <input type="checkbox" onChange={() => onUnsupported("녹화")} checked={false} />
          </label>
          <label>
            <span>
              <Bomb size={24} />
              스킬 활성화
            </span>
            <input type="checkbox" onChange={() => onUnsupported("스킬")} checked={false} />
          </label>
        </div>

        <div className="settings-row">
          <span>
            <Trophy size={24} />
            당첨 순위
          </span>
          <div className="winner-group">
            <button
              className={winnerMode === "first" ? "active" : ""}
              type="button"
              onClick={() => onWinnerModeChange("first")}
            >
              첫번째
            </button>
            <button
              className={winnerMode === "last" ? "active" : ""}
              type="button"
              onClick={() => onWinnerModeChange("last")}
            >
              마지막
            </button>
            <input
              aria-label="직접 당첨 순위"
              min={1}
              max={Math.max(total, 1)}
              type="number"
              value={winnerRank}
              onChange={(event) => onWinnerRankChange(Number(event.target.value))}
              onFocus={() => onWinnerModeChange("custom")}
            />
          </div>
        </div>

        <div className="theme-row">
          <Sun size={24} />
          <label className="switch">
            <input
              aria-label="다크 모드"
              type="checkbox"
              checked={theme === "dark"}
              onChange={(event) => onThemeChange(event.target.checked ? "dark" : "light")}
            />
            <span />
          </label>
          <Moon size={24} />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add temporary control panel styles**

Append these styles to `src/App.css`. Full visual styling lands in Task 7.

```css
.control-panel {
  position: fixed;
  left: 1rem;
  right: auto;
  bottom: 1rem;
  z-index: 20;
  display: flex;
  gap: 1rem;
  width: min(720px, calc(100vw - 2rem));
  padding: 10px;
  color: #fff;
  background: rgba(102, 102, 102, 0.94);
  border-radius: 10px;
}

.mobile-settings-toggle {
  display: none;
}

.name-panel {
  flex: 1 1 auto;
}

.name-panel h2 {
  margin: 0;
  font-size: 1rem;
}

.name-panel textarea {
  width: 100%;
  min-height: 5rem;
  resize: vertical;
}

.action-row,
.settings-row,
.two-columns,
.theme-row,
.winner-group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
```

- [ ] **Step 3: Commit control panel**

Run:

```bash
git add src/components/ControlPanel.tsx src/App.css
git commit -m "feat: add roulette control panel"
```

---

### Task 5: Fruit Drawing And Physics Core

**Files:**
- Create: `src/lib/fruits.ts`
- Create: `src/lib/physics.ts`
- Create: `src/hooks/useRoulettePhysics.ts`

- [ ] **Step 1: Implement fruit drawing helpers**

Create `src/lib/fruits.ts`.

```ts
// 과일 구슬의 색상과 캔버스 드로잉 규칙을 제공한다.
import type { MarbleEntry } from "../types";

export interface FruitStyle {
  fill: string;
  ring: string;
  text: string;
  kind: "watermelon" | "kiwi" | "orange" | "generic";
}

function hashName(name: string) {
  return [...name].reduce((hash, char) => hash + char.charCodeAt(0), 0);
}

export function getFruitStyle(name: string): FruitStyle {
  if (name.includes("수박")) {
    return { fill: "#ff5757", ring: "#f3fff0", text: "#ff5fb8", kind: "watermelon" };
  }

  if (name.includes("키위")) {
    return { fill: "#91c94d", ring: "#2d5f2d", text: "#39e8d0", kind: "kiwi" };
  }

  if (name.includes("귤") || name.includes("오렌지")) {
    return { fill: "#ffa928", ring: "#fef4b4", text: "#ffe55c", kind: "orange" };
  }

  const hue = hashName(name) % 360;
  return {
    fill: `hsl(${hue} 80% 56%)`,
    ring: `hsl(${hue} 90% 86%)`,
    text: `hsl(${hue} 100% 72%)`,
    kind: "generic",
  };
}

export function drawFruitMarble(
  context: CanvasRenderingContext2D,
  marble: MarbleEntry,
  x: number,
  y: number,
  radius: number,
) {
  const style = getFruitStyle(marble.name);

  context.save();
  context.translate(x, y);
  context.shadowBlur = 12;
  context.shadowColor = style.fill;
  context.fillStyle = style.ring;
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = style.fill;
  context.beginPath();
  context.arc(0, 0, radius * 0.82, 0, Math.PI * 2);
  context.fill();

  if (style.kind === "watermelon") {
    context.fillStyle = "#171717";
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      context.beginPath();
      context.ellipse(Math.cos(angle) * radius * 0.35, Math.sin(angle) * radius * 0.35, 2, 4, angle, 0, Math.PI * 2);
      context.fill();
    }
  }

  if (style.kind === "kiwi") {
    context.fillStyle = "#f7f0b8";
    context.beginPath();
    context.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
    context.fill();
  }

  if (style.kind === "orange") {
    context.strokeStyle = "#fff3bc";
    context.lineWidth = 1.5;
    for (let index = 0; index < 10; index += 1) {
      const angle = (Math.PI * 2 * index) / 10;
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(Math.cos(angle) * radius * 0.72, Math.sin(angle) * radius * 0.72);
      context.stroke();
    }
  }

  context.restore();
}
```

- [ ] **Step 2: Implement physics world helpers**

Create `src/lib/physics.ts`.

```ts
// Matter.js 월드와 룰렛 트랙, 구슬 바디 생성을 담당한다.
import { Bodies, Body, Composite, Engine, Events, Runner } from "matter-js";
import type { MarbleEntry, RouletteResult, ThemeMode } from "../types";
import { drawFruitMarble, getFruitStyle } from "./fruits";

export interface RouletteWorld {
  engine: Engine;
  runner: Runner;
  marbles: Array<{ entry: MarbleEntry; body: Body }>;
  finish: Body;
}

export interface WorldSize {
  width: number;
  height: number;
}

const marbleRadius = 28;

type CollisionEvent = {
  pairs: Array<{ bodyA: Body; bodyB: Body }>;
};

export function createRouletteWorld(entries: MarbleEntry[], size: WorldSize) {
  const engine = Engine.create({ gravity: { x: 0.75, y: 0.8 } });
  const runner = Runner.create();
  const railStyle = { isStatic: true, render: { visible: false } };
  const leftWall = Bodies.rectangle(120, size.height * 0.35, 28, size.height * 0.7, railStyle);
  const lowerRail = Bodies.rectangle(size.width * 0.6, size.height * 0.68, size.width * 0.72, 18, {
    ...railStyle,
    angle: -0.42,
  });
  const upperRail = Bodies.rectangle(size.width * 0.55, size.height * 0.5, size.width * 0.74, 18, {
    ...railStyle,
    angle: -0.42,
  });
  const deflector = Bodies.rectangle(size.width * 0.35, size.height * 0.64, 180, 18, {
    ...railStyle,
    angle: 0.75,
  });
  const floor = Bodies.rectangle(size.width / 2, size.height + 40, size.width, 80, railStyle);
  const finish = Bodies.rectangle(size.width - 90, size.height * 0.25, 80, size.height * 0.5, {
    isStatic: true,
    isSensor: true,
    label: "finish",
  });
  const marbles = entries.map((entry, index) => {
    const row = Math.floor(index / 8);
    const column = index % 8;
    const body = Bodies.circle(180 + column * 72, 110 + row * 64, marbleRadius, {
      restitution: 0.32,
      friction: 0.02,
      frictionAir: 0.004,
      label: entry.id,
    });
    Body.setVelocity(body, { x: 7 + entry.weight * 0.3 + column * 0.08, y: 0.5 + row * 0.2 });
    return { entry, body };
  });

  Composite.add(engine.world, [leftWall, lowerRail, upperRail, deflector, floor, finish, ...marbles.map((marble) => marble.body)]);

  return { engine, runner, marbles, finish };
}

export function subscribeToFinish(world: RouletteWorld, onResult: (result: RouletteResult) => void) {
  const finished = new Set<string>();
  const handler = (event: CollisionEvent) => {
    for (const pair of event.pairs) {
      const marbleBody = pair.bodyA === world.finish ? pair.bodyB : pair.bodyB === world.finish ? pair.bodyA : null;
      if (!marbleBody || finished.has(marbleBody.label)) {
        continue;
      }

      const marble = world.marbles.find((item) => item.body === marbleBody);
      if (!marble) {
        continue;
      }

      finished.add(marbleBody.label);
      onResult({ ...marble.entry, rank: finished.size });
    }
  };

  Events.on(world.engine, "collisionStart", handler);
  return () => Events.off(world.engine, "collisionStart", handler);
}

export function drawRouletteScene(context: CanvasRenderingContext2D, world: RouletteWorld | null, size: WorldSize, theme: ThemeMode) {
  context.clearRect(0, 0, size.width, size.height);
  context.fillStyle = theme === "dark" ? "#020302" : "#f4f6f7";
  context.fillRect(0, 0, size.width, size.height);

  context.save();
  context.strokeStyle = theme === "dark" ? "#dffffd" : "#1d7271";
  context.shadowColor = "#22f7ef";
  context.shadowBlur = theme === "dark" ? 18 : 4;
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(20, size.height * 0.35);
  context.lineTo(230, size.height * 0.58);
  context.lineTo(450, size.height * 0.42);
  context.lineTo(size.width - 30, 20);
  context.stroke();
  context.beginPath();
  context.moveTo(20, size.height * 0.68);
  context.lineTo(260, size.height * 0.9);
  context.lineTo(450, size.height * 0.7);
  context.lineTo(size.width - 30, size.height * 0.31);
  context.stroke();
  context.restore();

  context.save();
  context.strokeStyle = theme === "dark" ? "rgba(0, 255, 108, 0.7)" : "rgba(0, 120, 64, 0.7)";
  context.lineWidth = 3;
  context.strokeRect(18, 18, 210, size.height - 38);
  context.restore();

  if (!world) {
    return;
  }

  for (const marble of world.marbles) {
    drawFruitMarble(context, marble.entry, marble.body.position.x, marble.body.position.y, marbleRadius);
    const style = getFruitStyle(marble.entry.name);
    context.fillStyle = style.text;
    context.font = "700 26px 'Segoe UI', sans-serif";
    context.textAlign = "center";
    context.fillText(marble.entry.label, marble.body.position.x, marble.body.position.y + marbleRadius + 24);
  }
}
```

- [ ] **Step 3: Implement physics hook**

Create `src/hooks/useRoulettePhysics.ts`.

```ts
// 캔버스 크기와 Matter.js 실행 생명주기를 React에서 관리한다.
import { Engine, Runner } from "matter-js";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MarbleEntry, RouletteResult, RouletteStatus, ThemeMode } from "../types";
import {
  createRouletteWorld,
  drawRouletteScene,
  subscribeToFinish,
  type RouletteWorld,
  type WorldSize,
} from "../lib/physics";

interface UseRoulettePhysicsOptions {
  entries: MarbleEntry[];
  status: RouletteStatus;
  theme: ThemeMode;
  onResult: (result: RouletteResult) => void;
  onComplete: () => void;
}

export function useRoulettePhysics({ entries, status, theme, onResult, onComplete }: UseRoulettePhysicsOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<RouletteWorld | null>(null);
  const frameRef = useRef<number | null>(null);
  const cleanupFinishRef = useRef<(() => void) | null>(null);
  const [size, setSize] = useState<WorldSize>({ width: window.innerWidth, height: window.innerHeight });
  const resultCountRef = useRef(0);

  const cleanupWorld = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    cleanupFinishRef.current?.();
    cleanupFinishRef.current = null;

    if (worldRef.current) {
      Runner.stop(worldRef.current.runner);
      Engine.clear(worldRef.current.engine);
      worldRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(size.width * ratio);
    canvas.height = Math.floor(size.height * ratio);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawRouletteScene(context, worldRef.current, size, theme);
  }, [size, theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || status !== "running" || entries.length === 0) {
      if (status !== "running") {
        cleanupWorld();
      }
      return;
    }

    cleanupWorld();
    resultCountRef.current = 0;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(size.width * ratio);
    canvas.height = Math.floor(size.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const world = createRouletteWorld(entries, size);
    worldRef.current = world;
    cleanupFinishRef.current = subscribeToFinish(world, (result) => {
      resultCountRef.current += 1;
      onResult(result);
      if (resultCountRef.current >= entries.length) {
        onComplete();
      }
    });

    Runner.run(world.runner, world.engine);

    const tick = () => {
      drawRouletteScene(context, worldRef.current, size, theme);
      frameRef.current = requestAnimationFrame(tick);
    };
    tick();

    return cleanupWorld;
  }, [cleanupWorld, entries, onComplete, onResult, size, status, theme]);

  useEffect(() => cleanupWorld, [cleanupWorld]);

  return { canvasRef };
}
```

- [ ] **Step 4: Commit physics core**

Run:

```bash
git add src/lib/fruits.ts src/lib/physics.ts src/hooks/useRoulettePhysics.ts
git commit -m "feat: add marble physics core"
```

---

### Task 6: Canvas Component And App Integration

**Files:**
- Create: `src/components/RouletteCanvas.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement canvas component**

Create `src/components/RouletteCanvas.tsx`.

```tsx
// 룰렛 캔버스를 렌더링하고 물리 훅을 연결한다.
import type { MarbleEntry, RouletteResult, RouletteStatus, ThemeMode } from "../types";
import { useRoulettePhysics } from "../hooks/useRoulettePhysics";

interface RouletteCanvasProps {
  entries: MarbleEntry[];
  status: RouletteStatus;
  theme: ThemeMode;
  onResult: (result: RouletteResult) => void;
  onComplete: () => void;
}

export function RouletteCanvas({ entries, status, theme, onResult, onComplete }: RouletteCanvasProps) {
  const { canvasRef } = useRoulettePhysics({ entries, status, theme, onResult, onComplete });

  return <canvas className="roulette-canvas" ref={canvasRef} aria-label="룰렛 트랙" />;
}
```

- [ ] **Step 2: Replace temporary App with integrated state**

Replace `src/App.tsx`.

```tsx
// LuckySpin 앱의 상태와 룰렛 화면을 연결한다.
import { useCallback, useEffect, useMemo, useState } from "react";
import { ControlPanel } from "./components/ControlPanel";
import { NoticeModal } from "./components/NoticeModal";
import { RankingBoard } from "./components/RankingBoard";
import { RouletteCanvas } from "./components/RouletteCanvas";
import { ToastHost } from "./components/ToastHost";
import { clampWinnerRank, expandEntries, parseEntries, ROULETTE_MAPS, shuffleEntries } from "./lib/roulette";
import { loadNames, loadTheme, saveNames, saveTheme } from "./lib/storage";
import type { MapId, MarbleEntry, RouletteResult, RouletteStatus, ThemeMode, ToastMessage, WinnerMode } from "./types";

function createToast(message: string): ToastMessage {
  return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, message };
}

export default function App() {
  const [names, setNames] = useState(loadNames);
  const [theme, setTheme] = useState<ThemeMode>(loadTheme);
  const [mapId, setMapId] = useState<MapId>("wheel");
  const [winnerMode, setWinnerMode] = useState<WinnerMode>("first");
  const [customWinnerRank, setCustomWinnerRank] = useState(1);
  const [status, setStatus] = useState<RouletteStatus>("idle");
  const [collapsed, setCollapsed] = useState(true);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [results, setResults] = useState<RouletteResult[]>([]);
  const [runEntries, setRunEntries] = useState<MarbleEntry[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const parsedEntries = useMemo(() => parseEntries(names), [names]);
  const expandedEntries = useMemo(() => expandEntries(parsedEntries), [parsedEntries]);
  const total = expandedEntries.length;
  const winnerRank = winnerMode === "last" ? Math.max(total, 1) : winnerMode === "first" ? 1 : clampWinnerRank(customWinnerRank, Math.max(total, 1));

  const pushToast = useCallback((message: string) => {
    const toast = createToast(message);
    setToasts((current) => [...current, toast]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 1800);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveNames(names);
    setResults([]);
    if (status !== "running") {
      setStatus("idle");
    }
  }, [names]);

  const handleShuffle = useCallback(() => {
    if (status === "running") {
      pushToast("진행 중에는 섞을 수 없습니다.");
      return;
    }

    const shuffled = shuffleEntries(expandedEntries);
    setNames(shuffled.map((entry) => entry.name).join(","));
    setResults([]);
  }, [expandedEntries, pushToast, status]);

  const handleStart = useCallback(() => {
    if (status === "running") {
      pushToast("이미 룰렛이 진행 중입니다.");
      return;
    }

    if (expandedEntries.length === 0) {
      pushToast("이름을 한 개 이상 입력하세요.");
      return;
    }

    setRunEntries(shuffleEntries(expandedEntries));
    setResults([]);
    setStatus("running");
  }, [expandedEntries, pushToast, status]);

  const handleMapChange = useCallback(
    (nextMapId: MapId) => {
      const selectedMap = ROULETTE_MAPS.find((map) => map.id === nextMapId);
      if (!selectedMap?.enabled) {
        pushToast("이 맵은 첫 버전에서 아직 지원하지 않습니다.");
        return;
      }

      setMapId(nextMapId);
    },
    [pushToast],
  );

  const handleResult = useCallback((result: RouletteResult) => {
    setResults((current) => (current.some((item) => item.id === result.id) ? current : [...current, result]));
  }, []);

  const handleComplete = useCallback(() => {
    setStatus("finished");
    window.setTimeout(() => setStatus("idle"), 1200);
  }, []);

  return (
    <main className="roulette-app">
      <RouletteCanvas entries={runEntries} status={status} theme={theme} onResult={handleResult} onComplete={handleComplete} />
      <RankingBoard total={total} results={results} selectedRank={winnerRank} />
      <ControlPanel
        names={names}
        mapId={mapId}
        theme={theme}
        winnerMode={winnerMode}
        winnerRank={winnerRank}
        total={total}
        status={status}
        collapsed={collapsed}
        onNamesChange={setNames}
        onShuffle={handleShuffle}
        onStart={handleStart}
        onMapChange={handleMapChange}
        onThemeChange={setTheme}
        onWinnerModeChange={setWinnerMode}
        onWinnerRankChange={setCustomWinnerRank}
        onUnsupported={(feature) => pushToast(`${feature} 기능은 첫 버전에서 지원하지 않습니다.`)}
        onNotice={() => setNoticeOpen(true)}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
      />
      <NoticeModal open={noticeOpen} onClose={() => setNoticeOpen(false)} />
      <ToastHost messages={toasts} />
      <footer className="copyright">© 2026. LuckySpin은 방송과 영상에서 자유롭게 사용할 수 있는 룰렛 도구입니다.</footer>
    </main>
  );
}
```

- [ ] **Step 3: Run typecheck/build and fix integration errors**

Run:

```bash
npm run build
```

Expected: TypeScript compile succeeds.

- [ ] **Step 4: Commit app integration**

Run:

```bash
git add src/App.tsx src/components/RouletteCanvas.tsx
git commit -m "feat: integrate roulette app state"
```

---

### Task 7: Production Styling And Responsive Layout

**Files:**
- Replace: `src/App.css`

- [ ] **Step 1: Replace CSS with full visual styling**

Replace `src/App.css`.

```css
/* LuckySpin 룰렛 화면의 전체 시각 스타일을 정의한다. */
:root {
  color: #f7f7f7;
  background: #020302;
  font-family: "Segoe UI", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif;
}

:root[data-theme="light"] {
  color: #171717;
  background: #f4f6f7;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  overflow: hidden;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.roulette-app {
  position: relative;
  min-height: 100vh;
}

.roulette-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
  user-select: none;
}

.ranking-board {
  position: fixed;
  top: 12px;
  right: 14px;
  z-index: 15;
  min-width: 120px;
  text-align: right;
  text-shadow: -2px 0 #020302, 0 2px #020302, 2px 0 #020302, 0 -2px #020302;
}

.ranking-count {
  margin-bottom: 6px;
  color: #9b9b9b;
  font-size: 26px;
  font-weight: 800;
}

.ranking-board ol {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ranking-board li {
  display: flex;
  justify-content: flex-end;
  gap: 0.35rem;
  font-size: 26px;
  font-weight: 900;
  line-height: 1.1;
}

.ranking-board li.selected {
  filter: drop-shadow(0 0 8px currentColor);
}

.control-panel {
  position: fixed;
  left: 1rem;
  bottom: 1.45rem;
  z-index: 20;
  display: flex;
  gap: 1rem;
  width: min(730px, calc(100vw - 2rem));
  min-height: 150px;
  padding: 10px;
  color: #fff;
  background: rgba(102, 102, 102, 0.94);
  border-radius: 10px;
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.control-panel.is-running {
  opacity: 0;
  pointer-events: none;
  transform: translateY(8px);
}

.mobile-settings-toggle {
  display: none;
}

.name-panel {
  flex: 1 1 260px;
  min-width: 0;
}

.name-panel h2 {
  margin: 0 0 2px;
  color: #fff;
  font-size: 16px;
  line-height: 1.2;
}

.name-panel textarea {
  display: block;
  width: 100%;
  min-height: 80px;
  resize: vertical;
  color: #020302;
  background: #a8a8a8;
  border: 0;
  border-radius: 0;
  padding: 5px;
  font-size: 19px;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 4px;
}

.control-panel button,
.control-panel .shop-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 36px;
  color: #fff;
  background: #202020;
  border: 0;
  border-radius: 5px;
  padding: 5px 10px;
  text-decoration: none;
}

.shop-button {
  position: relative;
}

.shop-button span {
  position: absolute;
  top: -8px;
  right: -9px;
  padding: 1px 4px;
  background: #d20f19;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
}

.action-spacer {
  flex: 1 1 auto;
}

.settings-panel {
  flex: 0 0 395px;
  display: grid;
  gap: 5px;
}

.settings-row {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  align-items: center;
  min-height: 35px;
}

.settings-row > span,
.settings-row label > span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.settings-row select,
.winner-group input {
  width: 100%;
  min-width: 0;
  height: 26px;
  border: 0;
  border-radius: 5px;
  background: #9a9a9a;
}

.two-columns {
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.two-columns label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.winner-group {
  display: grid;
  grid-template-columns: 1fr 1fr 0.7fr;
  overflow: hidden;
  border-radius: 12px;
}

.winner-group button,
.winner-group input {
  height: 26px;
  min-height: 26px;
  border-radius: 0;
  background: #999;
  text-align: center;
}

.winner-group button.active {
  background: #303030;
}

.theme-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.switch input,
.two-columns input[type="checkbox"] {
  inline-size: 50px;
  block-size: 26px;
  appearance: none;
  position: relative;
  margin: 0;
}

.switch input::before,
.two-columns input[type="checkbox"]::before {
  content: "";
  position: absolute;
  inset: 0;
  background: #9a9a9a;
  border-radius: 999px;
}

.switch input::after,
.two-columns input[type="checkbox"]::after {
  content: "";
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 26px;
  block-size: 26px;
  background: #f7f7f7;
  border-radius: 999px;
  transition: transform 0.2s ease;
}

.switch input:checked::before,
.two-columns input[type="checkbox"]:checked::before {
  background: #00baff;
}

.switch input:checked::after,
.two-columns input[type="checkbox"]:checked::after {
  transform: translateX(24px);
}

.notice-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.2);
}

.notice-modal {
  width: min(500px, 90vw);
  overflow: hidden;
  color: #222;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 26px;
}

.notice-modal h2 {
  margin: 0;
  padding: 12px;
  color: #050505;
  background: #58c9af;
  border-bottom: 4px solid #2c8470;
  text-align: center;
  text-transform: uppercase;
}

.notice-body {
  padding: 14px 18px;
}

.notice-actions {
  display: flex;
  justify-content: center;
  padding: 0 18px 18px;
}

.notice-actions button {
  width: 50%;
  min-height: 48px;
  color: #fff;
  background: #202020;
  border: 0;
  border-radius: 10px;
}

.toast-host {
  position: fixed;
  left: 50%;
  bottom: 14px;
  z-index: 60;
  display: grid;
  gap: 6px;
  transform: translateX(-50%);
}

.toast {
  color: #171717;
  background: #d8d8d8;
  border-radius: 4px;
  padding: 8px 12px;
  animation: toast-in 0.18s ease;
}

.copyright {
  position: fixed;
  left: 50%;
  bottom: 2px;
  z-index: 10;
  width: 90%;
  color: currentColor;
  font-size: 12px;
  text-align: center;
  transform: translateX(-50%);
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 760px) {
  body {
    overflow: auto;
  }

  .ranking-board {
    right: 8px;
  }

  .ranking-board li,
  .ranking-count {
    font-size: 20px;
  }

  .control-panel {
    display: block;
    left: 1rem;
    right: 1rem;
    bottom: 58px;
    width: auto;
    max-height: calc(100vh - 80px);
    overflow: auto;
  }

  .mobile-settings-toggle {
    display: flex;
    width: 100%;
    margin-bottom: 8px;
  }

  .settings-panel.collapsed {
    display: none;
  }

  .settings-panel {
    margin-bottom: 8px;
  }

  .settings-row {
    grid-template-columns: 1fr;
    gap: 5px;
    padding: 6px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.16);
  }

  .two-columns {
    grid-template-columns: 1fr 1fr;
  }

  .name-panel textarea {
    min-height: 46px;
    font-size: 16px;
  }

  .copyright {
    font-size: 10px;
  }
}
```

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit styling**

Run:

```bash
git add src/App.css
git commit -m "style: match roulette visual layout"
```

---

### Task 8: Verification And Polish

**Files:**
- Modify only files needed to fix verified issues.
- Modify: `checklist.md`
- Modify: `context-notes.md`

- [ ] **Step 1: Run unit tests and build**

Run:

```bash
npm test
npm run build
```

Expected: both pass.

- [ ] **Step 2: Start the dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL, normally `http://127.0.0.1:5173/LuckySpin/`.

- [ ] **Step 3: Verify desktop in browser**

Run with Playwright CLI:

```bash
npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:5173/LuckySpin/
npx --yes --package @playwright/cli playwright-cli snapshot
npx --yes --package @playwright/cli playwright-cli screenshot
```

Expected: full-screen canvas is nonblank, bottom panel is visible, Korean labels are visible, and ranking board shows `0 / 6`.

- [ ] **Step 4: Verify interactions**

Use snapshot refs from Step 3, then click `섞기`, `시작`, `녹화`, and shop button.

Expected:

- `섞기` changes the input order while preserving the same entries.
- `시작` hides the panel, moves marbles, and ranking increments.
- `녹화` shows an unsupported toast.
- Shop button shows an unsupported toast and does not navigate.
- Repeated `시작` while running does not start a second physics runner.

- [ ] **Step 5: Verify mobile**

Run:

```bash
npx --yes --package @playwright/cli playwright-cli resize 390 844
npx --yes --package @playwright/cli playwright-cli screenshot
```

Expected: canvas remains visible, control panel does not overlap incoherently, settings can collapse, and text fits.

- [ ] **Step 6: Update work logs**

Update `checklist.md`.

```md
- [x] 구현 계획 문서를 작성한다.
- [x] 사용자 승인 후 구현을 시작한다.
- [x] 테스트와 빌드, 브라우저 검증을 완료한다.
- [x] 완성된 논리 단위별로 커밋한다.
```

Append to `context-notes.md`.

```md
- 구현 검증 결과를 기록한다. `npm test`, `npm run build`, 데스크톱 브라우저 확인, 모바일 브라우저 확인을 완료했다.
```

- [ ] **Step 7: Final commit for verification notes**

Run:

```bash
git add checklist.md context-notes.md
git commit -m "docs: record LuckySpin verification"
```

---

## Self-Review

- Spec coverage: the plan covers scaffold, domain tests, parsing, expansion, shuffle, rank clamping, local storage, unsupported controls, notice modal, ranking board, control panel, canvas rendering, Matter.js lifecycle, responsive CSS, build, and browser verification.
- Scope control: the plan keeps real recording, external shop integration, full multi-map implementation, and copied original assets out of scope.
- Type consistency: shared types are introduced before components consume them. `WinnerMode`, `ThemeMode`, `RouletteStatus`, `MapId`, `MarbleEntry`, `RouletteResult`, and `ToastMessage` are used consistently.
- Test coverage: pure logic is covered by `vitest`; Matter.js and layout behavior are verified through build and browser checks.
