// 룰렛 입력 파서와 순위 계산 로직을 검증한다.
import { describe, expect, it } from "vitest";

import {
  clampWinnerRank,
  expandEntries,
  parseEntries,
  ROULETTE_MAPS,
  shuffleEntries,
} from "./roulette";

describe("ROULETTE_MAPS", () => {
  it("enables every shipped map", () => {
    expect(ROULETTE_MAPS.map(({ id, enabled }) => [id, enabled])).toEqual([
      ["wheel", true],
      ["bubble", true],
      ["jar", true],
      ["night", true],
    ]);
  });
});

describe("parseEntries", () => {
  it("쉼표와 줄바꿈으로 구분한 이름을 기본 count와 weight로 파싱한다", () => {
    expect(parseEntries("수박, 키위\n귤")).toEqual([
      { name: "수박", count: 1, weight: 1 },
      { name: "키위", count: 1, weight: 1 },
      { name: "귤", count: 1, weight: 1 },
    ]);
  });

  it("별표 문법의 count를 파싱하고 잘못된 count는 1로 처리한다", () => {
    expect(parseEntries("수박*2,키위*0,귤*abc")).toEqual([
      { name: "수박", count: 2, weight: 1 },
      { name: "키위", count: 1, weight: 1 },
      { name: "귤", count: 1, weight: 1 },
    ]);
  });

  it("슬래시 문법의 weight를 파싱하고 잘못된 weight는 1로 처리한다", () => {
    expect(parseEntries("키위/3,귤/0")).toEqual([
      { name: "키위", count: 1, weight: 3 },
      { name: "귤", count: 1, weight: 1 },
    ]);
  });
});

describe("expandEntries", () => {
  it("count만큼 구슬을 만들고 안정적인 id를 붙인다", () => {
    expect(expandEntries([{ name: "수박", count: 2, weight: 1 }]).map((entry) => entry.id)).toEqual([
      "수박-1-0",
      "수박-1-1",
    ]);
  });

  it("같은 이름과 weight가 여러 토큰에 있어도 고유한 id를 붙인다", () => {
    expect(expandEntries(parseEntries("수박,수박")).map((entry) => entry.id)).toEqual([
      "수박-1-0",
      "수박-1-1",
    ]);
  });
});

describe("shuffleEntries", () => {
  it("seed가 있어도 같은 구슬 id 집합을 보존한다", () => {
    const entries = expandEntries([
      { name: "수박", count: 2, weight: 1 },
      { name: "키위", count: 1, weight: 3 },
    ]);

    const shuffled = shuffleEntries(entries, 42);

    expect(shuffled.map((entry) => entry.id).sort()).toEqual(entries.map((entry) => entry.id).sort());
    expect(shuffleEntries(entries, 42)).toEqual(shuffled);
  });
});

describe("clampWinnerRank", () => {
  it("당첨 순위를 전체 참가 범위 안으로 제한한다", () => {
    expect(clampWinnerRank(0, 6)).toBe(1);
    expect(clampWinnerRank(7, 6)).toBe(6);
    expect(clampWinnerRank(Number.NaN, 6)).toBe(1);
    expect(clampWinnerRank(2, 0)).toBe(1);
    expect(clampWinnerRank(2, Number.NaN)).toBe(1);
  });
});
