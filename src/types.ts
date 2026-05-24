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
