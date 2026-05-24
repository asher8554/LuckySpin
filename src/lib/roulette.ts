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
        return {
          name: token.replace(/[/*].*$/, "").trim() || token,
          count: 1,
          weight: 1,
        };
      }

      return {
        name: match[1].trim(),
        count: safePositiveInteger(match[3], 1),
        weight: safePositiveInteger(match[2], 1),
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
  const shuffled = [...entries];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function clampWinnerRank(rank: number, total: number) {
  if (total <= 0 || !Number.isFinite(rank)) {
    return 1;
  }

  return Math.min(Math.max(Math.trunc(rank), 1), total);
}
