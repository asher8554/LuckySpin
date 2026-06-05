// 충격 스킬의 쿨다운과 이펙트 상태를 계산한다.
export interface ImpactSkillCooldown {
  remainingMs: number;
  intervalMs: number;
  chance: number;
}

export interface SkillEffectState {
  x: number;
  y: number;
  ageMs: number;
  lifetimeMs: number;
}

const minSkillIntervalMs = 700;
const baseSkillIntervalMs = 2000;
const weightIntervalDiscountMs = 220;
const maxSkillWeight = 5;
const skillEffectLifetimeMs = 500;
const maxSkillEffectRadius = 10;

export function createImpactSkillCooldown(weight: number, order = 0): ImpactSkillCooldown {
  const skillWeight = clamp(weight, 1, maxSkillWeight);
  const intervalMs = Math.max(minSkillIntervalMs, baseSkillIntervalMs - skillWeight * weightIntervalDiscountMs);

  return {
    remainingMs: Math.min(intervalMs, 500 + (order % 6) * 180),
    intervalMs,
    chance: clamp(skillWeight * 0.25, 0.1, 0.95),
  };
}

export function tickImpactSkillCooldown(
  cooldown: ImpactSkillCooldown,
  deltaMs: number,
  random = Math.random,
): { triggered: boolean; cooldown: ImpactSkillCooldown } {
  const remainingMs = Math.max(0, cooldown.remainingMs - deltaMs);

  if (remainingMs > 0) {
    return {
      triggered: false,
      cooldown: { ...cooldown, remainingMs },
    };
  }

  return {
    triggered: random() < cooldown.chance,
    cooldown: { ...cooldown, remainingMs: cooldown.intervalMs },
  };
}

export function createImpactSkillEffect(x: number, y: number): SkillEffectState {
  return { x, y, ageMs: 0, lifetimeMs: skillEffectLifetimeMs };
}

export function advanceSkillEffects(effects: SkillEffectState[], deltaMs: number): SkillEffectState[] {
  return effects
    .map((effect) => ({ ...effect, ageMs: effect.ageMs + deltaMs }))
    .filter((effect) => effect.ageMs < effect.lifetimeMs);
}

export function getSkillEffectRadius(effect: SkillEffectState) {
  return clamp(effect.ageMs / effect.lifetimeMs, 0, 1) * maxSkillEffectRadius;
}

export function getSkillEffectAlpha(effect: SkillEffectState) {
  const progress = clamp(effect.ageMs / effect.lifetimeMs, 0, 1);
  return 1 - progress * progress;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
