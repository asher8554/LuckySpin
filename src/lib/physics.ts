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

const marbleRadius = 24;

export function createRouletteWorld(entries: MarbleEntry[], size: WorldSize): RouletteWorld {
  const engine = Engine.create({ gravity: { x: 0.45, y: 0.95 } });
  const runner = Runner.create();
  const railStyle = { isStatic: true, render: { visible: false } };
  const leftWall = Bodies.rectangle(238, size.height * 0.42, 22, size.height * 0.8, railStyle);
  const lowerRail = Bodies.rectangle(size.width * 0.62, size.height * 0.64, size.width * 0.64, 14, {
    ...railStyle,
    angle: -0.55,
  });
  const upperRail = Bodies.rectangle(size.width * 0.63, size.height * 0.43, size.width * 0.58, 14, {
    ...railStyle,
    angle: 0.72,
  });
  const deflector = Bodies.rectangle(size.width * 0.42, size.height * 0.5, 200, 14, {
    ...railStyle,
    angle: -0.18,
  });
  const floor = Bodies.rectangle(size.width / 2, size.height + 40, size.width, 80, railStyle);
  const finish = Bodies.rectangle(size.width / 2, size.height - 34, size.width, 90, {
    isStatic: true,
    isSensor: true,
    label: "finish",
  });
  const marbles = entries.map((entry, index) => {
    const row = Math.floor(index / 8);
    const column = index % 8;
    const body = Bodies.circle(300 + column * 58, 94 + row * 56, marbleRadius, {
      restitution: 0.32,
      friction: 0.02,
      frictionAir: 0.004,
      label: entry.id,
    });
    Body.setVelocity(body, { x: 5.6 + entry.weight * 0.2 + column * 0.07, y: 0.5 + row * 0.2 });
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
  previewEntries: MarbleEntry[] = [],
) {
  context.clearRect(0, 0, size.width, size.height);
  context.fillStyle = theme === "dark" ? "#020302" : "#f4f6f7";
  context.fillRect(0, 0, size.width, size.height);

  drawMapPreview(context, size, theme);
  drawMainRails(context, size, theme);

  if (!world) {
    drawPreviewMarbles(context, previewEntries, size);
    return;
  }

  for (const marble of world.marbles) {
    drawFruitMarble(context, marble.entry, marble.body.position.x, marble.body.position.y, marbleRadius);
    const style = getFruitStyle(marble.entry.name);
    context.fillStyle = style.text;
    context.font = "900 24px 'Segoe UI', sans-serif";
    context.textAlign = "center";
    context.shadowColor = "#041111";
    context.shadowBlur = 5;
    context.fillText(marble.entry.label, marble.body.position.x, marble.body.position.y + marbleRadius + 22);
  }
}

function drawMainRails(context: CanvasRenderingContext2D, size: WorldSize, theme: ThemeMode) {
  context.save();
  context.strokeStyle = theme === "dark" ? "#dffffd" : "#1d7271";
  context.shadowColor = "#22f7ef";
  context.shadowBlur = theme === "dark" ? 16 : 4;
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(size.width * 0.38, -10);
  context.lineTo(size.width * 0.52, size.height * 0.5);
  context.lineTo(size.width * 0.88, -10);
  context.stroke();
  context.beginPath();
  context.moveTo(size.width * 0.34, size.height * 0.51);
  context.lineTo(size.width * 0.52, size.height * 0.46);
  context.stroke();

  context.strokeStyle = "#16f2e4";
  context.shadowColor = "#16f2e4";
  context.shadowBlur = 22;
  context.lineWidth = 18;
  context.beginPath();
  context.moveTo(size.width * 0.34, size.height * 0.51);
  context.lineTo(size.width * 0.49, size.height * 0.46);
  context.stroke();

  context.strokeStyle = "rgba(223, 255, 253, 0.82)";
  context.shadowBlur = 10;
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(size.width * 0.52, size.height * 0.5);
  context.lineTo(size.width * 0.52, size.height + 30);
  context.stroke();
  context.restore();
}

function drawMapPreview(context: CanvasRenderingContext2D, size: WorldSize, theme: ThemeMode) {
  const panelX = 18;
  const panelY = 18;
  const panelWidth = 210;
  const panelHeight = size.height - 38;

  context.save();
  context.fillStyle = theme === "dark" ? "rgba(50, 50, 50, 0.9)" : "rgba(215, 218, 218, 0.88)";
  context.fillRect(panelX, panelY, panelWidth, panelHeight);
  context.save();
  context.strokeStyle = theme === "dark" ? "rgba(0, 255, 108, 0.7)" : "rgba(0, 120, 64, 0.7)";
  context.lineWidth = 3;
  context.strokeRect(panelX, panelY, panelWidth, panelHeight);
  context.restore();

  context.strokeStyle = theme === "dark" ? "rgba(180, 180, 180, 0.35)" : "rgba(80, 80, 80, 0.35)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(92, panelY - 60);
  context.lineTo(92, 88);
  context.lineTo(36, 174);
  context.lineTo(36, 228);
  context.lineTo(136, 270);
  context.lineTo(88, 326);
  context.lineTo(88, 396);
  context.lineTo(162, 452);
  context.lineTo(92, 526);
  context.lineTo(92, panelY + panelHeight + 70);
  context.moveTo(152, panelY - 40);
  context.lineTo(152, 94);
  context.lineTo(96, 170);
  context.lineTo(96, 199);
  context.lineTo(211, 257);
  context.lineTo(137, 319);
  context.lineTo(137, 370);
  context.lineTo(210, 436);
  context.lineTo(150, 512);
  context.lineTo(150, panelY + panelHeight + 70);
  context.stroke();

  context.strokeStyle = "rgba(34, 247, 239, 0.35)";
  context.lineWidth = 4;
  for (let index = 0; index < 6; index += 1) {
    context.beginPath();
    context.moveTo(118 + (index % 2) * 22, 244 + index * 16);
    context.lineTo(124 + (index % 2) * 22, 248 + index * 16);
    context.stroke();
  }
  context.restore();
}

function drawPreviewMarbles(context: CanvasRenderingContext2D, entries: MarbleEntry[], size: WorldSize) {
  const centerY = size.height * 0.49;
  const startX = Math.max(330, size.width * 0.27);
  const gap = Math.min(92, Math.max(64, size.width / Math.max(entries.length + 7, 10)));

  entries.forEach((entry, index) => {
    const x = startX + index * gap;
    const y = centerY + Math.sin(index * 0.8) * 12;
    drawFruitMarble(context, entry, x, y, marbleRadius + 10);
    const style = getFruitStyle(entry.name);
    context.fillStyle = style.text;
    context.font = "900 28px 'Segoe UI', sans-serif";
    context.textAlign = "center";
    context.shadowColor = "#041111";
    context.shadowBlur = 5;
    context.fillText(entry.label, x, y + marbleRadius + 34);
  });
}
