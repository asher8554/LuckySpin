// Matter.js 월드와 원본 StageDef 기반 룰렛 렌더링을 담당한다.
import { Bodies, Body, Composite, Engine } from "matter-js";
import type { MarbleEntry, RouletteResult, ThemeMode } from "../types";
import {
  initialZoom,
  ROULETTE_STAGES,
  wheelOfFortuneStage,
  zoomThreshold,
  type StageDef,
  type StageEntity,
  type StagePoint,
} from "./stage";

export interface RouletteCamera {
  x: number;
  y: number;
  zoom: number;
}

export interface RouletteMarble {
  entry: MarbleEntry;
  body: Body;
  order: number;
  hue: number;
}

interface StageBodyState {
  entity: StageEntity;
  bodies: Body[];
  angle: number;
}

export interface RouletteWorld {
  engine: Engine;
  stage: StageDef;
  entities: StageBodyState[];
  marbles: RouletteMarble[];
  camera: RouletteCamera;
  elapsedMs: number;
}

export interface WorldSize {
  width: number;
  height: number;
}

interface SceneState {
  entries: MarbleEntry[];
  results: RouletteResult[];
  selectedRank: number;
  winner?: RouletteResult;
}

const marbleRadius = 0.25;
const railThickness = 0.22;
const minimapScale = 4;

const themeColors = {
  dark: {
    background: "#000000",
    entity: {
      box: { fill: "cyan", outline: "cyan", bloom: "cyan", bloomRadius: 15 },
      circle: { fill: "yellow", outline: "yellow", bloom: "yellow", bloomRadius: 15 },
      polyline: { fill: "white", outline: "white", bloom: "cyan", bloomRadius: 15 },
    },
    minimapBackground: "#333333",
    minimapViewport: "#ffffff",
    marbleLightness: 75,
    winnerBackground: "rgba(0, 0, 0, 0.58)",
    winnerText: "#ffffff",
    winnerOutline: "#000000",
  },
  light: {
    background: "#eeeeee",
    entity: {
      box: { fill: "#226f92", outline: "#111111", bloom: "cyan", bloomRadius: 0 },
      circle: { fill: "yellow", outline: "#ed7e11", bloom: "yellow", bloomRadius: 0 },
      polyline: { fill: "white", outline: "#111111", bloom: "cyan", bloomRadius: 0 },
    },
    minimapBackground: "#fefefe",
    minimapViewport: "#6699cc",
    marbleLightness: 50,
    winnerBackground: "rgba(255, 255, 255, 0.62)",
    winnerText: "#4d4d4d",
    winnerOutline: "#ffffff",
  },
} as const;

export function getRouletteSpawnPosition(order: number, total: number) {
  const maxLine = Math.ceil(total / 10);
  const line = Math.floor(order / 10);
  const lineDelta = -Math.max(0, Math.ceil(maxLine - 5));

  return {
    x: 10.25 + (order % 10) * 0.6,
    y: maxLine - line + lineDelta,
  };
}

export function createRouletteWorld(entries: MarbleEntry[], size: WorldSize, stage: StageDef = wheelOfFortuneStage) {
  const engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.000006 } });
  const entities = stage.entities.map(createStageBodyState);
  const containmentBodies = createContainmentBodies(stage);
  const marbles = entries.map((entry, order) => {
    const spawn = getRouletteSpawnPosition(order, entries.length);
    const body = Bodies.circle(spawn.x, spawn.y, marbleRadius, {
      density: 1,
      friction: 0.03,
      frictionAir: 0.0025,
      restitution: 0.08,
      label: entry.id,
    });

    return {
      entry,
      body,
      order,
      hue: getEntryHue(entry, order, entries.length),
    };
  });

  Composite.add(engine.world, [
    ...entities.flatMap((entity) => entity.bodies),
    ...containmentBodies,
    ...marbles.map((marble) => marble.body),
  ]);

  return {
    engine,
    stage,
    entities,
    marbles,
    camera: createPreviewCamera(size),
    elapsedMs: 0,
  };
}

function createContainmentBodies(stage: StageDef) {
  const top = -320;
  const bottom = stage.goalY + 20;
  const height = bottom - top;
  const centerY = top + height / 2;
  const options = { isStatic: true, friction: 0.03, restitution: 0, render: { visible: false } };

  return [
    Bodies.rectangle(-0.7, centerY, 1, height, options),
    Bodies.rectangle(26.7, centerY, 1, height, options),
  ];
}

export function advanceRouletteWorld(world: RouletteWorld, deltaMs: number) {
  world.elapsedMs += deltaMs;

  for (const entity of world.entities) {
    if (entity.entity.type !== "kinematic") {
      continue;
    }

    entity.angle += entity.entity.props.angularVelocity * (deltaMs / 1000);
    for (const body of entity.bodies) {
      Body.setAngularVelocity(body, 0);
    }
  }

  Engine.update(world.engine, deltaMs);
}

export function removeMarbleFromWorld(world: RouletteWorld, marble: RouletteMarble) {
  Composite.remove(world.engine.world, marble.body);
  world.marbles = world.marbles.filter((item) => item.entry.id !== marble.entry.id);
}

export function shakeSlowMarbles(world: RouletteWorld, finishedIds = new Set<string>()) {
  for (const marble of world.marbles) {
    if (finishedIds.has(marble.entry.id)) {
      continue;
    }

    const speed = Math.hypot(marble.body.velocity.x, marble.body.velocity.y);
    if (speed > 0.08) {
      continue;
    }

    Body.applyForce(marble.body, marble.body.position, {
      x: (Math.sin(world.elapsedMs / 300 + marble.order) * 0.00018) / Math.max(marble.entry.weight, 1),
      y: 0.00035,
    });
  }
}

export function getLiveMarbleOrder(world: RouletteWorld, finishedIds = new Set<string>()) {
  return world.marbles
    .filter((marble) => !finishedIds.has(marble.entry.id))
    .sort((left, right) => right.body.position.y - left.body.position.y || left.order - right.order);
}

export function getStageForMap(mapId: keyof typeof ROULETTE_STAGES) {
  return ROULETTE_STAGES[mapId];
}

export function updateRouletteCamera(
  world: RouletteWorld,
  size: WorldSize,
  finishedIds: Set<string>,
  winnerRank: number,
  resultCount: number,
) {
  const pending = getLiveMarbleOrder(world, finishedIds);
  const targetIndex = Math.max(0, Math.min(pending.length - 1, winnerRank - resultCount - 1));
  const target = pending[targetIndex] ?? pending[0];

  if (!target) {
    world.camera.zoom += (1 - world.camera.zoom) / 10;
    return;
  }

  const goalDist = Math.abs(world.stage.zoomY - world.camera.y);
  const targetZoom = Math.max(1, (1 - goalDist / zoomThreshold) * 4);
  const nextZoom = target.body.position.y > world.stage.zoomY - zoomThreshold ? targetZoom : 1;

  world.camera.x += (target.body.position.x - world.camera.x) / 10;
  world.camera.y += (target.body.position.y - world.camera.y) / 10;
  world.camera.zoom += (nextZoom - world.camera.zoom) / 10;

  const halfViewHeight = size.height / (initialZoom * world.camera.zoom * 2);
  world.camera.y = Math.max(2, Math.min(world.stage.goalY + halfViewHeight, world.camera.y));
}

export function drawRouletteScene(
  context: CanvasRenderingContext2D,
  world: RouletteWorld | null,
  size: WorldSize,
  theme: ThemeMode,
  scene: SceneState,
) {
  const colors = themeColors[theme];
  const stage = world?.stage ?? wheelOfFortuneStage;
  const camera = world?.camera ?? createPreviewCamera(size);

  context.clearRect(0, 0, size.width, size.height);
  context.fillStyle = colors.background;
  context.fillRect(0, 0, size.width, size.height);

  drawStageView(context, stage, world, size, camera, theme, scene);
  drawMinimap(context, stage, world, size, camera, theme, scene.entries);
  drawWinnerBanner(context, scene.winner, size, theme);
}

function createPreviewCamera(size: WorldSize): RouletteCamera {
  return {
    x: 13,
    y: size.width < 640 ? 12 : 10,
    zoom: size.width < 640 ? 0.82 : 1,
  };
}

function createStageBodyState(entity: StageEntity): StageBodyState {
  const bodies = createMatterBodies(entity);
  return {
    entity,
    bodies,
    angle: entity.shape.type === "box" ? entity.shape.rotation : 0,
  };
}

function createMatterBodies(entity: StageEntity) {
  const options = {
    isStatic: true,
    friction: 0.03,
    restitution: Math.min(entity.props.restitution, 0.12),
    render: { visible: false },
  };

  switch (entity.shape.type) {
    case "polyline":
      return entity.shape.points.slice(0, -1).map((point, index) => {
        const next = entity.shape.type === "polyline" ? entity.shape.points[index + 1] : point;
        return createSegmentBody(point, next, entity.position, options);
      });
    case "box": {
      const body = Bodies.rectangle(
        entity.position.x,
        entity.position.y,
        Math.max(entity.shape.width * 2, railThickness),
        Math.max(entity.shape.height * 2, railThickness),
        options,
      );
      Body.setAngle(body, entity.shape.rotation);
      return [body];
    }
    case "circle":
      return [Bodies.circle(entity.position.x, entity.position.y, entity.shape.radius, options)];
  }
}

function createSegmentBody(
  from: StagePoint,
  to: StagePoint,
  position: { x: number; y: number },
  options: Parameters<typeof Bodies.rectangle>[4],
) {
  const ax = from[0] + position.x;
  const ay = from[1] + position.y;
  const bx = to[0] + position.x;
  const by = to[1] + position.y;
  const dx = bx - ax;
  const dy = by - ay;
  const length = Math.hypot(dx, dy);
  const body = Bodies.rectangle(ax + dx / 2, ay + dy / 2, length, railThickness, options);
  Body.setAngle(body, Math.atan2(dy, dx));
  return body;
}

function drawStageView(
  context: CanvasRenderingContext2D,
  stage: StageDef,
  world: RouletteWorld | null,
  size: WorldSize,
  camera: RouletteCamera,
  theme: ThemeMode,
  scene: SceneState,
) {
  context.save();
  applyWorldTransform(context, size, camera);
  drawEntities(context, stage, world, theme, 3 / (initialZoom * camera.zoom));
  drawWorldMarbles(context, world, scene, camera, theme);
  context.restore();

  drawMarbleLabels(context, world, scene, size, camera, theme);
}

function applyWorldTransform(context: CanvasRenderingContext2D, size: WorldSize, camera: RouletteCamera) {
  context.translate(size.width / 2, size.height / 2);
  context.scale(initialZoom * camera.zoom, initialZoom * camera.zoom);
  context.translate(-camera.x, -camera.y);
}

function drawEntities(
  context: CanvasRenderingContext2D,
  stage: StageDef,
  world: RouletteWorld | null,
  theme: ThemeMode,
  lineWidth: number,
) {
  const colors = themeColors[theme];

  stage.entities.forEach((entity, index) => {
    const bodyState = world?.entities[index];
    const palette = colors.entity[entity.shape.type];
    const color = entity.shape.color ?? palette.outline;

    context.save();
    context.translate(entity.position.x, entity.position.y);
    context.strokeStyle = color;
    context.fillStyle = entity.shape.color ?? palette.fill;
    context.shadowColor = entity.shape.bloomColor ?? entity.shape.color ?? palette.bloom;
    context.shadowBlur = palette.bloomRadius / initialZoom;
    context.lineWidth = lineWidth;

    switch (entity.shape.type) {
      case "polyline":
        if (entity.shape.points.length > 0) {
          context.beginPath();
          context.moveTo(entity.shape.points[0][0], entity.shape.points[0][1]);
          for (let pointIndex = 1; pointIndex < entity.shape.points.length; pointIndex += 1) {
            context.lineTo(entity.shape.points[pointIndex][0], entity.shape.points[pointIndex][1]);
          }
          context.stroke();
        }
        break;
      case "box": {
        const width = entity.shape.width * 2;
        const height = entity.shape.height * 2;
        context.rotate(bodyState?.angle ?? entity.shape.rotation);
        context.fillRect(-width / 2, -height / 2, width, height);
        context.strokeRect(-width / 2, -height / 2, width, height);
        break;
      }
      case "circle":
        context.beginPath();
        context.arc(0, 0, entity.shape.radius, 0, Math.PI * 2);
        context.stroke();
        break;
    }

    context.restore();
  });
}

function drawWorldMarbles(
  context: CanvasRenderingContext2D,
  world: RouletteWorld | null,
  scene: SceneState,
  camera: RouletteCamera,
  theme: ThemeMode,
) {
  const colors = themeColors[theme];
  const pending = world ? getLiveMarbleOrder(world, new Set(scene.results.map((result) => result.id))) : [];
  const selected = pending[Math.max(0, scene.selectedRank - scene.results.length - 1)];
  const previewMarbles = world
    ? world.marbles
    : scene.entries.map((entry, order) => ({
        entry,
        body: { position: getRouletteSpawnPosition(order, scene.entries.length), angle: 0 } as Body,
        order,
        hue: getEntryHue(entry, order, scene.entries.length),
      }));

  for (const marble of previewMarbles) {
    context.beginPath();
    context.fillStyle = `hsl(${marble.hue} 100% ${colors.marbleLightness}%)`;
    context.arc(marble.body.position.x, marble.body.position.y, marbleRadius, 0, Math.PI * 2);
    context.fill();

    if (selected?.entry.id === marble.entry.id) {
      context.lineWidth = 2 / (initialZoom * camera.zoom);
      context.strokeStyle = theme === "dark" ? "#ffffff" : "#111111";
      context.stroke();
    }
  }
}

function drawMarbleLabels(
  context: CanvasRenderingContext2D,
  world: RouletteWorld | null,
  scene: SceneState,
  size: WorldSize,
  camera: RouletteCamera,
  theme: ThemeMode,
) {
  const marbles = world
    ? world.marbles
    : scene.entries.map((entry, order) => ({
        entry,
        body: { position: getRouletteSpawnPosition(order, scene.entries.length) } as Body,
        order,
        hue: getEntryHue(entry, order, scene.entries.length),
      }));

  context.save();
  context.textAlign = "center";
  context.textBaseline = "top";
  context.font = "700 14px 'Segoe UI', 'Malgun Gothic', sans-serif";
  context.lineWidth = 3;
  context.strokeStyle = "#000000";

  for (const marble of marbles) {
    const point = projectWorldPoint(marble.body.position.x, marble.body.position.y, size, camera);
    if (point.x < -80 || point.x > size.width + 80 || point.y < -60 || point.y > size.height + 120) {
      continue;
    }

    context.fillStyle = `hsl(${marble.hue} 100% ${themeColors[theme].marbleLightness}%)`;
    context.strokeText(marble.entry.label, point.x, point.y + marbleRadius * initialZoom * camera.zoom + 3);
    context.fillText(marble.entry.label, point.x, point.y + marbleRadius * initialZoom * camera.zoom + 3);
  }

  context.restore();
}

function drawMinimap(
  context: CanvasRenderingContext2D,
  stage: StageDef,
  world: RouletteWorld | null,
  size: WorldSize,
  camera: RouletteCamera,
  theme: ThemeMode,
  entries: MarbleEntry[],
) {
  const colors = themeColors[theme];
  const x = 10;
  const y = 10;
  const width = 26 * minimapScale;
  const height = stage.goalY * minimapScale;

  context.save();
  context.translate(x, y);
  context.fillStyle = colors.minimapBackground;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "green";
  context.lineWidth = 1;
  context.strokeRect(0, 0, width, height);
  context.scale(minimapScale, minimapScale);
  drawEntities(context, stage, world, theme, 0.08);
  drawMinimapMarbles(context, world, entries);
  drawMinimapViewport(context, size, camera, colors.minimapViewport);
  context.restore();
}

function drawMinimapMarbles(context: CanvasRenderingContext2D, world: RouletteWorld | null, entries: MarbleEntry[]) {
  const marbles = world
    ? world.marbles
    : entries.map((entry, order) => ({
        entry,
        body: { position: getRouletteSpawnPosition(order, entries.length) } as Body,
        order,
        hue: getEntryHue(entry, order, entries.length),
      }));

  for (const marble of marbles) {
    context.beginPath();
    context.fillStyle = `hsl(${marble.hue} 100% 65%)`;
    context.arc(marble.body.position.x, marble.body.position.y, 0.5, 0, Math.PI * 2);
    context.fill();
  }
}

function drawMinimapViewport(
  context: CanvasRenderingContext2D,
  size: WorldSize,
  camera: RouletteCamera,
  color: string,
) {
  const width = size.width / (initialZoom * camera.zoom);
  const height = size.height / (initialZoom * camera.zoom);

  context.save();
  context.strokeStyle = color;
  context.lineWidth = 0.1 / camera.zoom;
  context.strokeRect(camera.x - width / 2, camera.y - height / 2, width, height);
  context.restore();
}

function drawWinnerBanner(
  context: CanvasRenderingContext2D,
  winner: RouletteResult | undefined,
  size: WorldSize,
  theme: ThemeMode,
) {
  if (!winner) {
    return;
  }

  const colors = themeColors[theme];
  const bannerHeight = Math.min(168, size.height * 0.28);
  const bannerX = size.width > 760 ? size.width / 2 : 0;
  const bannerWidth = size.width > 760 ? size.width / 2 : size.width;
  const bannerY = size.height - bannerHeight;
  const marbleSize = Math.min(100, bannerHeight * 0.62);
  const marbleCenterX = bannerX + bannerWidth - marbleSize / 2 - 20;
  const marbleCenterY = bannerY + bannerHeight / 2;
  const textRightX = marbleCenterX - marbleSize / 2 - 20;

  context.save();
  context.fillStyle = colors.winnerBackground;
  context.fillRect(bannerX, bannerY, bannerWidth, bannerHeight);

  context.beginPath();
  context.fillStyle = `hsl(${hashHue(winner.id)} 100% ${colors.marbleLightness}%)`;
  context.arc(marbleCenterX, marbleCenterY, marbleSize / 2, 0, Math.PI * 2);
  context.fill();

  context.textAlign = "right";
  context.lineWidth = 4;
  context.strokeStyle = colors.winnerOutline;
  context.fillStyle = colors.winnerText;
  context.font = "700 48px 'Segoe UI', sans-serif";
  context.strokeText("Winner", textRightX, bannerY + bannerHeight * 0.34);
  context.fillText("Winner", textRightX, bannerY + bannerHeight * 0.34);
  context.font = "900 72px 'Segoe UI', 'Malgun Gothic', sans-serif";
  context.fillStyle = `hsl(${hashHue(winner.id)} 100% ${colors.marbleLightness}%)`;
  context.strokeText(winner.name, textRightX, bannerY + bannerHeight * 0.75);
  context.fillText(winner.name, textRightX, bannerY + bannerHeight * 0.75);
  context.restore();
}

function projectWorldPoint(x: number, y: number, size: WorldSize, camera: RouletteCamera) {
  return {
    x: size.width / 2 + (x - camera.x) * initialZoom * camera.zoom,
    y: size.height / 2 + (y - camera.y) * initialZoom * camera.zoom,
  };
}

function getEntryHue(entry: MarbleEntry, order: number, total: number) {
  return total > 0 ? (360 / total) * order : hashHue(entry.id);
}

function hashHue(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 360;
  }
  return hash;
}
