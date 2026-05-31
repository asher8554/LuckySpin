// 원본 맵 데이터와 원본형 구슬 배치 계산을 검증한다.
import { describe, expect, it } from "vitest";

import {
  advanceRouletteWorld,
  createRouletteWorld,
  getLiveMarbleOrder,
  getRouletteSpawnPosition,
  removeMarbleFromWorld,
  shakeSlowMarbles,
} from "./physics";
import { wheelOfFortuneStage } from "./stage";
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

  it("kinematic 바퀴는 스텝마다 각속도와 각도가 갱신된다", () => {
    const world = createRouletteWorld(entries, { width: 1280, height: 720 });
    const wheel = world.entities.find((entity) => entity.entity.type === "kinematic");

    expect(wheel).toBeDefined();
    advanceRouletteWorld(world, 16.6);

    expect(wheel?.angle).not.toBe(0);
    expect(wheel?.bodies[0].angularVelocity).not.toBe(0);
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

    for (let step = 0; step < 3600; step += 1) {
      advanceRouletteWorld(world, 16.6);
      if (step % 72 === 0) {
        shakeSlowMarbles(world);
      }
      if (marble.body.position.y > world.stage.goalY) {
        reachedGoal = true;
        break;
      }
    }

    expect(reachedGoal).toBe(true);
  });
});
