// 원본 맵 데이터와 원본형 구슬 배치 계산을 검증한다.
import { describe, expect, it } from "vitest";

import { Body } from "matter-js";

import {
  advanceRouletteWorld,
  createRouletteWorld,
  getLiveMarbleOrder,
  getRouletteSpawnPosition,
  removeMarbleFromWorld,
  shakeSlowMarbles,
} from "./physics";
import { wheelOfFortuneStage, type StageDef } from "./stage";
import type { MarbleEntry } from "../types";

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
