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

type CollisionEvent = {
  pairs: Array<{ bodyA: Body; bodyB: Body }>;
};

const marbleRadius = 28;

export function createRouletteWorld(entries: MarbleEntry[], size: WorldSize): RouletteWorld {
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

  Composite.add(engine.world, [
    leftWall,
    lowerRail,
    upperRail,
    deflector,
    floor,
    finish,
    ...marbles.map((marble) => marble.body),
  ]);

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

export function drawRouletteScene(
  context: CanvasRenderingContext2D,
  world: RouletteWorld | null,
  size: WorldSize,
  theme: ThemeMode,
) {
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
