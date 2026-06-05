// 스킬 쿨다운과 시각 효과 계산을 검증한다.
import { describe, expect, it } from "vitest";

import {
  advanceSkillEffects,
  createImpactSkillCooldown,
  createImpactSkillEffect,
  getSkillEffectAlpha,
  getSkillEffectRadius,
  tickImpactSkillCooldown,
} from "./skills";

describe("impact skill cooldown", () => {
  it("fires after its cooldown elapses and resets the next cooldown", () => {
    const cooldown = createImpactSkillCooldown(2, 0);
    const result = tickImpactSkillCooldown({ ...cooldown, remainingMs: 10 }, 16, () => 0);

    expect(result.triggered).toBe(true);
    expect(result.cooldown.remainingMs).toBe(result.cooldown.intervalMs);
    expect(result.cooldown.intervalMs).toBeGreaterThanOrEqual(700);
  });

  it("does not fire while cooldown time remains", () => {
    const cooldown = createImpactSkillCooldown(1, 0);
    const result = tickImpactSkillCooldown({ ...cooldown, remainingMs: 1000 }, 240, () => 0);

    expect(result.triggered).toBe(false);
    expect(result.cooldown.remainingMs).toBe(760);
  });
});

describe("impact skill effects", () => {
  it("expands, fades, and expires after its lifetime", () => {
    const effect = createImpactSkillEffect(10, 20);
    const halfLife = advanceSkillEffects([effect], 250);

    expect(halfLife).toHaveLength(1);
    expect(halfLife[0].ageMs).toBe(250);
    expect(getSkillEffectRadius(halfLife[0])).toBeGreaterThan(getSkillEffectRadius(effect));
    expect(getSkillEffectAlpha(halfLife[0])).toBeLessThan(getSkillEffectAlpha(effect));

    expect(advanceSkillEffects(halfLife, 250)).toEqual([]);
  });
});
