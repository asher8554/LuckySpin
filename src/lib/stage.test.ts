// 원본 맵 데이터와 원본형 구슬 배치 계산을 검증한다.
import { describe, expect, it, vi } from "vitest";

import { Body } from "matter-js";

import {
  advanceRouletteWorld,
  applyImpactSkill,
  createRouletteWorld,
  drawRouletteScene,
  getLiveMarbleOrder,
  getRouletteSpawnPosition,
  removeMarbleFromWorld,
  shakeSlowMarbles,
} from "./physics";
import { ROULETTE_STAGES, wheelOfFortuneStage, type StageDef } from "./stage";
import type { MapId, MarbleEntry } from "../types";

const originalStageExpectations: Array<{
  id: MapId;
  title: string;
  goalY: number;
  zoomY: number;
  entities: number;
  kinematic: number;
}> = [
  { id: "wheel", title: "Wheel of fortune", goalY: 111, zoomY: 106.75, entities: 46, kinematic: 6 },
  { id: "bubble", title: "BubblePop", goalY: 83, zoomY: 78, entities: 59, kinematic: 9 },
  { id: "jar", title: "Pot of greed", goalY: 111, zoomY: 110, entities: 32, kinematic: 20 },
  { id: "night", title: "Yoru ni Kakeru", goalY: 248, zoomY: 234.5, entities: 288, kinematic: 21 },
];

function createCanvasContextStub() {
  const methods: Record<PropertyKey, unknown> = {
    measureText: vi.fn(() => ({ width: 0 })),
  };

  return new Proxy(methods, {
    get(target, property) {
      if (!(property in target)) {
        target[property] = vi.fn();
      }
      return target[property];
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D & { arc: ReturnType<typeof vi.fn> };
}

function getPolylineXAtY(points: Array<[number, number]>, y: number) {
  const xs: number[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const [x1, y1] = points[index];
    const [x2, y2] = points[index + 1];
    if ((y < Math.min(y1, y2) || y > Math.max(y1, y2)) && y1 !== y2) {
      continue;
    }
    if (y1 === y2) {
      if (Math.abs(y - y1) < 0.000001) {
        xs.push(x1, x2);
      }
      continue;
    }
    const ratio = (y - y1) / (y2 - y1);
    if (ratio >= 0 && ratio <= 1) {
      xs.push(x1 + (x2 - x1) * ratio);
    }
  }

  return xs;
}

function getPotOuterBoundsAt(y: number) {
  const stage = ROULETTE_STAGES.jar;
  const leftWallIndexes = [0, 6, 4];
  const rightWallIndexes = [2, 7, 5];
  const leftXs = leftWallIndexes.flatMap((index) => {
    const shape = stage.entities[index].shape;
    return shape.type === "polyline" ? getPolylineXAtY(shape.points, y) : [];
  });
  const rightXs = rightWallIndexes.flatMap((index) => {
    const shape = stage.entities[index].shape;
    return shape.type === "polyline" ? getPolylineXAtY(shape.points, y) : [];
  });

  if (leftXs.length === 0 || rightXs.length === 0) {
    return null;
  }

  return {
    left: Math.min(...leftXs),
    right: Math.max(...rightXs),
  };
}

describe("wheelOfFortuneStage", () => {
  it("원본 첫 맵의 goalY와 zoomY를 보존한다", () => {
    expect(wheelOfFortuneStage.title).toBe("Wheel of fortune");
    expect(wheelOfFortuneStage.goalY).toBe(111);
    expect(wheelOfFortuneStage.zoomY).toBe(106.75);
  });

  it("원본 첫 맵의 지형 entity 개수를 유지한다", () => {
    expect(wheelOfFortuneStage.entities).toHaveLength(46);
    expect(wheelOfFortuneStage.entities.filter((entity) => entity.type === "kinematic")).toHaveLength(6);
  });
});

describe("ROULETTE_STAGES", () => {
  it("connects every shipped map to the original stage metadata", () => {
    for (const expected of originalStageExpectations) {
      const stage = ROULETTE_STAGES[expected.id];

      expect(stage.id).toBe(expected.id);
      expect(stage.title).toBe(expected.title);
      expect(stage.goalY).toBe(expected.goalY);
      expect(stage.zoomY).toBe(expected.zoomY);
      expect(stage.entities).toHaveLength(expected.entities);
      expect(stage.entities.filter((entity) => entity.type === "kinematic")).toHaveLength(expected.kinematic);
    }
  });

  it("does not reuse wheel stage data for unfinished maps", () => {
    expect(new Set(Object.values(ROULETTE_STAGES))).toHaveLength(originalStageExpectations.length);
  });

  it("draws the selected map stage in the idle preview", () => {
    const context = createCanvasContextStub();
    const scene: Parameters<typeof drawRouletteScene>[4] = {
      entries: [],
      results: [],
      selectedRank: 1,
      stage: ROULETTE_STAGES.bubble,
    };

    drawRouletteScene(context, null, { width: 1280, height: 720 }, "dark", scene);

    expect(context.arc.mock.calls.length).toBeGreaterThan(0);
  });
});

describe("getRouletteSpawnPosition", () => {
  it("원본 Marble 생성자와 같은 10열 배치를 사용한다", () => {
    expect(getRouletteSpawnPosition(0, 6)).toEqual({ x: 10.25, y: 1 });
    expect(getRouletteSpawnPosition(9, 12).x).toBeCloseTo(15.65);
    expect(getRouletteSpawnPosition(9, 12).y).toBe(2);
    expect(getRouletteSpawnPosition(10, 12)).toEqual({ x: 10.25, y: 1 });
  });
});

describe("stage based physics", () => {
  const entries: MarbleEntry[] = [
    { id: "a-1-0", name: "a", label: "a", weight: 1, duplicateIndex: 0 },
    { id: "b-1-0", name: "b", label: "b", weight: 1, duplicateIndex: 0 },
  ];

  it("kinematic 바퀴는 화면 각도만 갱신하고 충돌 각속도는 주입하지 않는다", () => {
    const world = createRouletteWorld(entries, { width: 1280, height: 720 });
    const wheel = world.entities.find((entity) => entity.entity.type === "kinematic");

    expect(wheel).toBeDefined();
    advanceRouletteWorld(world, 16.6);

    expect(wheel?.angle).not.toBe(0);
    expect(wheel?.bodies[0].angularVelocity).toBe(0);
  });

  it("every shipped map creates a stable physics world", () => {
    for (const stage of Object.values(ROULETTE_STAGES)) {
      const world = createRouletteWorld([entries[0]], { width: 1280, height: 720 }, stage);

      for (let step = 0; step < 30; step += 1) {
        advanceRouletteWorld(world, 16.6);
      }

      const marble = world.marbles[0];
      const diagnostics = JSON.stringify({
        stage: stage.id,
        x: marble.body.position.x,
        y: marble.body.position.y,
        vx: marble.body.velocity.x,
        vy: marble.body.velocity.y,
      });
      expect(Number.isFinite(marble.body.position.x), diagnostics).toBe(true);
      expect(Number.isFinite(marble.body.position.y), diagnostics).toBe(true);
      expect(Number.isFinite(marble.body.velocity.x), diagnostics).toBe(true);
      expect(Number.isFinite(marble.body.velocity.y), diagnostics).toBe(true);
      expect(world.entities.length).toBe(stage.entities.length);
    }
  });

  it("impact skill pushes nearby marbles away from the source", () => {
    const world = createRouletteWorld(
      [
        entries[0],
        entries[1],
        { id: "c-1-0", name: "c", label: "c", weight: 1, duplicateIndex: 0 },
      ],
      { width: 1280, height: 720 },
    );
    const [source, near, far] = world.marbles;

    Body.setPosition(source.body, { x: 10, y: 10 });
    Body.setPosition(near.body, { x: 12, y: 10 });
    Body.setPosition(far.body, { x: 23, y: 10 });
    Body.setVelocity(source.body, { x: 0, y: 0 });
    Body.setVelocity(near.body, { x: 0, y: 0 });
    Body.setVelocity(far.body, { x: 0, y: 0 });

    applyImpactSkill(world, source);

    expect(near.body.velocity.x).toBeGreaterThan(0.5);
    expect(Math.abs(near.body.velocity.y)).toBeLessThan(0.1);
    expect(Math.hypot(far.body.velocity.x, far.body.velocity.y)).toBe(0);
  });

  it("kinematic wheel transfers tangent velocity through collision", () => {
    const kinematicStage: StageDef = {
      id: "wheel",
      title: "kinematic collision test",
      goalY: 40,
      zoomY: 36,
      entities: [
        {
          position: { x: 10, y: 10 },
          type: "kinematic",
          shape: { type: "box", width: 2, height: 0.1, rotation: 0 },
          props: { density: 1, angularVelocity: 3.5, restitution: 0 },
        },
      ],
    };
    const world = createRouletteWorld([entries[0]], { width: 1280, height: 720 }, kinematicStage);
    const marble = world.marbles[0];

    Body.setPosition(marble.body, { x: 9, y: 9.75 });
    Body.setVelocity(marble.body, { x: 0, y: 0 });

    advanceRouletteWorld(world, 16.6);

    const diagnostics = JSON.stringify({
      x: marble.body.position.x,
      y: marble.body.position.y,
      vx: marble.body.velocity.x,
      vy: marble.body.velocity.y,
    });
    expect(marble.body.velocity.y, diagnostics).toBeLessThan(-0.5);
    expect(marble.body.velocity.x, diagnostics).toBeGreaterThan(0.05);
  });

  it("bottom kinematic spinner detects contact from below", () => {
    const bottomSpinnerStage: StageDef = {
      id: "wheel",
      title: "bottom spinner contact test",
      goalY: 120,
      zoomY: 106.75,
      entities: [
        {
          position: { x: 14, y: 106.75 },
          type: "kinematic",
          shape: { type: "box", width: 2, height: 0.1, rotation: 0 },
          props: { density: 1, angularVelocity: -1.2, restitution: 0 },
        },
      ],
    };
    const world = createRouletteWorld([entries[0]], { width: 1280, height: 720 }, bottomSpinnerStage);
    const marble = world.marbles[0];

    Body.setPosition(marble.body, { x: 14, y: 106.99 });
    Body.setVelocity(marble.body, { x: 0, y: -3 });

    advanceRouletteWorld(world, 16.6);

    const diagnostics = JSON.stringify({
      y: marble.body.position.y,
      vy: marble.body.velocity.y,
    });
    expect(marble.body.position.y, diagnostics).toBeGreaterThan(106.95);
    expect(marble.body.velocity.y, diagnostics).toBeGreaterThan(1.5);
  });

  it("stage restitution preserves a strong rebound", () => {
    const elasticStage: StageDef = {
      id: "wheel",
      title: "elastic collision test",
      goalY: 40,
      zoomY: 36,
      entities: [
        {
          position: { x: 10, y: 10 },
          type: "static",
          shape: { type: "box", width: 1, height: 0.1, rotation: 0 },
          props: { density: 1, angularVelocity: 0, restitution: 1 },
        },
      ],
    };
    const world = createRouletteWorld([entries[0]], { width: 1280, height: 720 }, elasticStage);
    const marble = world.marbles[0];

    Body.setPosition(marble.body, { x: 10, y: 9.75 });
    Body.setVelocity(marble.body, { x: 0, y: 4 });

    advanceRouletteWorld(world, 16.6);

    const diagnostics = JSON.stringify({
      y: marble.body.position.y,
      vy: marble.body.velocity.y,
    });
    expect(marble.body.velocity.y, diagnostics).toBeLessThan(-3);
  });

  it("stage wall collision rebounds with visible elasticity", () => {
    const wallStage: StageDef = {
      id: "wheel",
      title: "wall bounce test",
      goalY: 40,
      zoomY: 36,
      entities: [
        {
          position: { x: 0, y: 0 },
          type: "static",
          shape: {
            type: "polyline",
            points: [
              [5, 0],
              [5, 5],
            ],
            rotation: 0,
          },
          props: { density: 1, angularVelocity: 0, restitution: 0 },
        },
      ],
    };
    const world = createRouletteWorld([entries[0]], { width: 1280, height: 720 }, wallStage);
    const marble = world.marbles[0];

    Body.setPosition(marble.body, { x: 4.78, y: 2 });
    Body.setVelocity(marble.body, { x: 4, y: 0 });

    advanceRouletteWorld(world, 16.6);

    const diagnostics = JSON.stringify({
      x: marble.body.position.x,
      vx: marble.body.velocity.x,
    });
    expect(marble.body.position.x, diagnostics).toBeLessThan(5);
    expect(marble.body.velocity.x, diagnostics).toBeLessThan(-3);
  });

  it("sloped wall contact pushes a sliding marble away from the wall", () => {
    const slopedWallStage: StageDef = {
      id: "wheel",
      title: "sloped wall bounce test",
      goalY: 40,
      zoomY: 36,
      entities: [
        {
          position: { x: 0, y: 0 },
          type: "static",
          shape: {
            type: "polyline",
            points: [
              [5, 5],
              [10, 10],
            ],
            rotation: 0,
          },
          props: { density: 1, angularVelocity: 0, restitution: 0 },
        },
      ],
    };
    const world = createRouletteWorld([entries[0]], { width: 1280, height: 720 }, slopedWallStage);
    const marble = world.marbles[0];

    Body.setPosition(marble.body, { x: 7, y: 6.78 });
    Body.setVelocity(marble.body, { x: 3, y: 3 });

    advanceRouletteWorld(world, 16.6);

    const diagnostics = JSON.stringify({
      x: marble.body.position.x,
      y: marble.body.position.y,
      vx: marble.body.velocity.x,
      vy: marble.body.velocity.y,
    });
    expect(marble.body.velocity.x, diagnostics).toBeGreaterThan(4);
    expect(marble.body.velocity.y, diagnostics).toBeLessThan(2);
  });

  it("polyline wall joints do not leave a pass-through gap", () => {
    const cornerWallStage: StageDef = {
      id: "jar",
      title: "corner wall gap test",
      goalY: 40,
      zoomY: 36,
      entities: [
        {
          position: { x: 0, y: 0 },
          type: "static",
          shape: {
            type: "polyline",
            points: [
              [5, 0],
              [5, 5],
              [10, 5],
            ],
            rotation: 0,
          },
          props: { density: 1, angularVelocity: 0, restitution: 0 },
        },
      ],
    };
    const world = createRouletteWorld([entries[0]], { width: 1280, height: 720 }, cornerWallStage);
    const marble = world.marbles[0];

    Body.setPosition(marble.body, { x: 4.9, y: 5.1 });
    Body.setVelocity(marble.body, { x: -2, y: 2 });

    advanceRouletteWorld(world, 16.6);

    const distanceFromCorner = Math.hypot(marble.body.position.x - 5, marble.body.position.y - 5);
    const diagnostics = JSON.stringify({
      x: marble.body.position.x,
      y: marble.body.position.y,
      distanceFromCorner,
      vx: marble.body.velocity.x,
      vy: marble.body.velocity.y,
    });
    expect(distanceFromCorner, diagnostics).toBeGreaterThanOrEqual(0.25);
  });

  it("Pot of greed keeps marbles inside the outer wall envelope during a long run", () => {
    const jarEntries = Array.from({ length: 8 }, (_, index) => ({
      id: `jar-${index}`,
      name: `jar-${index}`,
      label: `${index}`,
      weight: 1,
      duplicateIndex: 0,
    }));
    const world = createRouletteWorld(jarEntries, { width: 1280, height: 720 }, ROULETTE_STAGES.jar);

    for (let step = 0; step < 2600; step += 1) {
      advanceRouletteWorld(world, 16.6);
      if (step % 36 === 0) {
        shakeSlowMarbles(world);
      }

      for (const marble of world.marbles) {
        const { x, y } = marble.body.position;
        if (y < 0 || y > world.stage.goalY) {
          continue;
        }

        const bounds = getPotOuterBoundsAt(y);
        if (!bounds) {
          continue;
        }

        const tolerance = 0.4;
        const diagnostics = JSON.stringify({
          step,
          marble: marble.entry.id,
          x,
          y,
          left: bounds.left,
          right: bounds.right,
        });
        expect(x, diagnostics).toBeGreaterThanOrEqual(bounds.left - tolerance);
        expect(x, diagnostics).toBeLessThanOrEqual(bounds.right + tolerance);
      }
    }
  });

  it("완료된 구슬은 world.marbles와 live order에서 제거된다", () => {
    const world = createRouletteWorld(entries, { width: 1280, height: 720 });
    const [marble] = world.marbles;

    removeMarbleFromWorld(world, marble);

    expect(world.marbles.map((item) => item.entry.id)).toEqual(["b-1-0"]);
    expect(getLiveMarbleOrder(world).map((item) => item.entry.id)).toEqual(["b-1-0"]);
  });

  it("구슬은 첫 경사 벽에서 자유낙하가 아닌 수평 편향을 받는다", () => {
    const world = createRouletteWorld([entries[0]], { width: 1280, height: 720 });
    const marble = world.marbles[0];
    const startX = marble.body.position.x;

    for (let step = 0; step < 180; step += 1) {
      advanceRouletteWorld(world, 16.6);
    }

    expect(Math.abs(marble.body.position.x - startX)).toBeGreaterThan(0.35);
    expect(marble.body.position.y).toBeLessThan(world.stage.goalY);
  });

  it("구슬은 레일과 충돌한 뒤 결국 goalY까지 진행한다", () => {
    const world = createRouletteWorld([entries[0]], { width: 1280, height: 720 });
    const marble = world.marbles[0];
    let reachedGoal = false;
    let maxY = marble.body.position.y;

    for (let step = 0; step < 3600; step += 1) {
      advanceRouletteWorld(world, 16.6);
      maxY = Math.max(maxY, marble.body.position.y);
      if (step % 36 === 0) {
        shakeSlowMarbles(world);
      }
      if (marble.body.position.y > world.stage.goalY) {
        reachedGoal = true;
        break;
      }
    }

    const diagnostics = JSON.stringify({
      x: marble.body.position.x,
      y: marble.body.position.y,
      maxY,
      speed: Math.hypot(marble.body.velocity.x, marble.body.velocity.y),
    });
    expect(reachedGoal, diagnostics).toBe(true);
  });

  it("구슬은 회전 바퀴 충돌 뒤 맵 밖으로 폭발하지 않는다", () => {
    const world = createRouletteWorld(entries, { width: 1280, height: 720 });
    let maxSpeed = 0;
    let maxX = Number.NEGATIVE_INFINITY;
    let minX = Number.POSITIVE_INFINITY;
    let maxXBeforeGoal = Number.NEGATIVE_INFINITY;
    let minXBeforeGoal = Number.POSITIVE_INFINITY;

    for (let step = 0; step < 2400; step += 1) {
      advanceRouletteWorld(world, 16.6);
      if (step % 36 === 0) {
        shakeSlowMarbles(world);
      }

      for (const marble of world.marbles) {
        const speed = Math.hypot(marble.body.velocity.x, marble.body.velocity.y);
        maxSpeed = Math.max(maxSpeed, speed);
        maxX = Math.max(maxX, marble.body.position.x);
        minX = Math.min(minX, marble.body.position.x);
        if (marble.body.position.y <= world.stage.goalY) {
          maxXBeforeGoal = Math.max(maxXBeforeGoal, marble.body.position.x);
          minXBeforeGoal = Math.min(minXBeforeGoal, marble.body.position.x);
        }
      }

      if (world.marbles.some((marble) => marble.body.position.y > world.stage.goalY)) {
        break;
      }
    }

    expect({ maxSpeed, minX, maxX }).toEqual({
      maxSpeed: expect.any(Number),
      minX: expect.any(Number),
      maxX: expect.any(Number),
    });
    const diagnostics = JSON.stringify({ maxSpeed, minX, maxX, minXBeforeGoal, maxXBeforeGoal });
    expect(maxSpeed, diagnostics).toBeLessThan(12.1);
    expect(minXBeforeGoal, diagnostics).toBeGreaterThan(-0.1);
    expect(maxXBeforeGoal, diagnostics).toBeLessThan(26.1);
  });

  it("여러 구슬도 긴 실행 중 벽을 통과하거나 순간 발사되지 않는다", () => {
    const manyEntries = Array.from({ length: 18 }, (_, index) => ({
      id: `entry-${index}`,
      name: `entry-${index}`,
      label: `${index}`,
      weight: 1,
      duplicateIndex: 0,
    }));
    const world = createRouletteWorld(manyEntries, { width: 1280, height: 720 });
    let maxSpeed = 0;
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;

    for (let step = 0; step < 5200; step += 1) {
      advanceRouletteWorld(world, 16.6);
      if (step % 36 === 0) {
        shakeSlowMarbles(world);
      }

      for (const marble of world.marbles) {
        const speed = Math.hypot(marble.body.velocity.x, marble.body.velocity.y);
        maxSpeed = Math.max(maxSpeed, speed);
        if (marble.body.position.y <= world.stage.goalY) {
          minX = Math.min(minX, marble.body.position.x);
          maxX = Math.max(maxX, marble.body.position.x);
        }
      }

      if (world.marbles.some((marble) => marble.body.position.y > world.stage.goalY)) {
        break;
      }
    }

    const diagnostics = JSON.stringify({ maxSpeed, minX, maxX });
    expect(maxSpeed, diagnostics).toBeLessThan(12.1);
    expect(minX, diagnostics).toBeGreaterThanOrEqual(0.2);
    expect(maxX, diagnostics).toBeLessThanOrEqual(25.8);
  });

  it("기본 6개 구슬은 정체 구간을 지나 첫 결과까지 진행한다", () => {
    const sixEntries = Array.from({ length: 6 }, (_, index) => ({
      id: `default-${index}`,
      name: `default-${index}`,
      label: `${index}`,
      weight: 1,
      duplicateIndex: 0,
    }));
    const world = createRouletteWorld(sixEntries, { width: 1280, height: 720 });
    let reachedGoal = false;
    let maxY = 0;

    for (let step = 0; step < 1700; step += 1) {
      advanceRouletteWorld(world, 16.6);
      if (step % 36 === 0) {
        shakeSlowMarbles(world);
      }

      for (const marble of world.marbles) {
        maxY = Math.max(maxY, marble.body.position.y);
        if (marble.body.position.y > world.stage.goalY) {
          reachedGoal = true;
        }
      }

      if (reachedGoal) {
        break;
      }
    }

    expect(reachedGoal, JSON.stringify({ maxY })).toBe(true);
  });

  it("빠른 구슬도 첫 경사 벽을 한 프레임에 뚫지 않는다", () => {
    const world = createRouletteWorld([entries[0]], { width: 1280, height: 720 });
    const marble = world.marbles[0];

    Body.setPosition(marble.body, { x: 10.1, y: 18 });
    Body.setVelocity(marble.body, { x: -7, y: 7 });

    for (let step = 0; step < 80; step += 1) {
      advanceRouletteWorld(world, 16.6);
    }

    expect(marble.body.position.x).toBeGreaterThan(2);
    expect(marble.body.position.x).toBeLessThan(24);
    expect(Math.hypot(marble.body.velocity.x, marble.body.velocity.y)).toBeLessThan(12.1);
  });
});
