// 이름과 테마 설정을 브라우저 로컬 저장소에 저장하고 읽는다.
import type { ThemeMode } from "../types";
import { DEFAULT_NAMES } from "./roulette";

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
