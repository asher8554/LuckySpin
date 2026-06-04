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
const gravity = 16;
const fixedStepMs = 1000 / 240;
const maxStepMs = 50;
const collisionIterations = 3;
const maxMarbleSpeed = 12;
const wallRestitution = 0.6;
const maxStageRestitution = 1.5;
const airDamping = 0.12;
const staticSurfaceFriction = 0.1;
const kinematicSurfaceFriction = 0.25;

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
  let remainingMs = Math.min(deltaMs, maxStepMs);

  while (remainingMs > 0) {
    const stepMs = Math.min(remainingMs, fixedStepMs);
    stepRouletteWorld(world, stepMs / 1000);
    remainingMs -= stepMs;
  }
}

function stepRouletteWorld(world: RouletteWorld, deltaSeconds: number) {
  for (const entity of world.entities) {
    if (entity.entity.type === "kinematic") {
      entity.angle += entity.entity.props.angularVelocity * deltaSeconds;
    }
    for (const body of entity.bodies) {
      Body.setAngularVelocity(body, 0);
    }
  }

  for (const marble of world.marbles) {
    const position = { x: marble.body.position.x, y: marble.body.position.y };
    const velocity = { x: marble.body.velocity.x, y: marble.body.velocity.y };
    velocity.y += gravity * deltaSeconds;

    const damping = Math.max(0, 1 - airDamping * deltaSeconds);
    velocity.x *= damping;
    velocity.y *= damping;
    clampVector(velocity, maxMarbleSpeed);

    position.x += velocity.x * deltaSeconds;
    position.y += velocity.y * deltaSeconds;

    for (let iteration = 0; iteration < collisionIterations; iteration += 1) {
      for (const entity of world.entities) {
        resolveEntityCollision(position, velocity, entity);
      }
      resolveWorldBounds(position, velocity);
    }

    clampVector(velocity, maxMarbleSpeed);
    Body.setPosition(marble.body, position);
    Body.setVelocity(marble.body, velocity);
  }
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
    const nearGoal = marble.body.position.y > world.stage.zoomY - zoomThreshold;
    if (speed > (nearGoal ? 2.4 : 2)) {
      continue;
    }

    const targetX = nearGoal ? 15.55 : marble.body.position.x;
    const targetPull = nearGoal ? 3.2 : 0.35;
    const xNudge =
      Math.sin(world.elapsedMs / 300 + marble.order) * 0.5 +
      (targetX - marble.body.position.x) * targetPull;
    const nextVelocity = {
      x: marble.body.velocity.x + xNudge / Math.max(marble.entry.weight, 1),
      y: marble.body.velocity.y + (nearGoal ? 5.5 : 3),
    };
    clampVector(nextVelocity, maxMarbleSpeed * (nearGoal ? 0.8 : 0.45));
    Body.setVelocity(marble.body, nextVelocity);
  }
}

function resolveEntityCollision(
  position: { x: number; y: number },
  velocity: { x: number; y: number },
  state: StageBodyState,
) {
  const entity = state.entity;

  switch (entity.shape.type) {
    case "polyline":
      for (let index = 0; index < entity.shape.points.length - 1; index += 1) {
        const from = entity.shape.points[index];
        const to = entity.shape.points[index + 1];
        resolveSegmentCollision(
          position,
          velocity,
          { x: from[0] + entity.position.x, y: from[1] + entity.position.y },
          { x: to[0] + entity.position.x, y: to[1] + entity.position.y },
          wallRestitution,
          index === 0,
          index === entity.shape.points.length - 2,
        );
      }
      break;
    case "box":
      resolveBoxCollision(
        position,
        velocity,
        entity,
        entity.type === "kinematic" ? state.angle : entity.shape.rotation,
      );
      break;
    case "circle":
      resolveCircleCollision(position, velocity, entity.position, entity.shape.radius, getEntityRestitution(entity));
      break;
  }
}

function resolveSegmentCollision(
  position: { x: number; y: number },
  velocity: { x: number; y: number },
  from: { x: number; y: number },
  to: { x: number; y: number },
  restitution: number,
  includeStartCap: boolean,
  includeEndCap: boolean,
) {
  const closest = closestPointOnSegment(position, from, to);
  if ((closest.t <= 0 && !includeStartCap) || (closest.t >= 1 && !includeEndCap)) {
    return;
  }

  let normal = { x: position.x - closest.x, y: position.y - closest.y };
  let distance = Math.hypot(normal.x, normal.y);

  if (distance >= marbleRadius) {
    return;
  }

  if (distance < 0.000001) {
    normal = segmentFallbackNormal(from, to, velocity);
    distance = 0;
  } else {
    normal.x /= distance;
    normal.y /= distance;
  }

  position.x += normal.x * (marbleRadius - distance);
  position.y += normal.y * (marbleRadius - distance);
  applyCollisionVelocity(velocity, normal, { x: 0, y: 0 }, restitution, 0.08);
}

function resolveBoxCollision(
  position: { x: number; y: number },
  velocity: { x: number; y: number },
  entity: StageEntity,
  angle: number,
) {
  if (entity.shape.type !== "box") {
    return;
  }

  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const local = rotatePoint(position.x - entity.position.x, position.y - entity.position.y, cos, sin);
  if (entity.type === "kinematic" && local.y > entity.shape.height) {
    return;
  }

  const closest = {
    x: clamp(local.x, -entity.shape.width, entity.shape.width),
    y: clamp(local.y, -entity.shape.height, entity.shape.height),
  };
  const contactLocal = { ...closest };
  let delta = { x: local.x - closest.x, y: local.y - closest.y };
  let distance = Math.hypot(delta.x, delta.y);
  let penetration = marbleRadius - distance;

  if (distance >= marbleRadius) {
    return;
  }

  if (distance < 0.000001) {
    const xOverlap = entity.shape.width - Math.abs(local.x);
    const yOverlap = entity.shape.height - Math.abs(local.y);
    if (xOverlap < yOverlap) {
      delta = { x: local.x < 0 ? -1 : 1, y: 0 };
      penetration = marbleRadius + xOverlap;
    } else {
      delta = { x: 0, y: local.y < 0 ? -1 : 1 };
      penetration = marbleRadius + yOverlap;
    }
    distance = 1;
  }

  const worldNormal = rotatePoint(delta.x / distance, delta.y / distance, Math.cos(angle), Math.sin(angle));
  position.x += worldNormal.x * penetration;
  position.y += worldNormal.y * penetration;

  applyCollisionVelocity(
    velocity,
    worldNormal,
    getBoxSurfaceVelocity(entity, angle, contactLocal),
    getEntityRestitution(entity),
    entity.type === "kinematic" ? kinematicSurfaceFriction : staticSurfaceFriction,
  );
}

function resolveCircleCollision(
  position: { x: number; y: number },
  velocity: { x: number; y: number },
  center: { x: number; y: number },
  radius: number,
  restitution: number,
) {
  let normal = { x: position.x - center.x, y: position.y - center.y };
  let distance = Math.hypot(normal.x, normal.y);
  const minDistance = marbleRadius + radius;

  if (distance >= minDistance) {
    return;
  }

  if (distance < 0.000001) {
    normal = { x: 0, y: -1 };
    distance = 0;
  } else {
    normal.x /= distance;
    normal.y /= distance;
  }

  position.x += normal.x * (minDistance - distance);
  position.y += normal.y * (minDistance - distance);
  applyCollisionVelocity(velocity, normal, { x: 0, y: 0 }, restitution, 0.1);
}

function resolveWorldBounds(position: { x: number; y: number }, velocity: { x: number; y: number }) {
  const minX = marbleRadius;
  const maxX = 26 - marbleRadius;

  if (position.x < minX) {
    position.x = minX;
    if (velocity.x < 0) {
      velocity.x = -velocity.x * wallRestitution;
    }
  }

  if (position.x > maxX) {
    position.x = maxX;
    if (velocity.x > 0) {
      velocity.x = -velocity.x * wallRestitution;
    }
  }
}

function applyCollisionVelocity(
  velocity: { x: number; y: number },
  normal: { x: number; y: number },
  surfaceVelocity: { x: number; y: number },
  restitution: number,
  friction: number,
) {
  const relative = {
    x: velocity.x - surfaceVelocity.x,
    y: velocity.y - surfaceVelocity.y,
  };
  const normalSpeed = dot(relative, normal);

  if (normalSpeed < 0) {
    velocity.x -= (1 + restitution) * normalSpeed * normal.x;
    velocity.y -= (1 + restitution) * normalSpeed * normal.y;

    const tangent = {
      x: relative.x - normalSpeed * normal.x,
      y: relative.y - normalSpeed * normal.y,
    };
    velocity.x -= tangent.x * friction;
    velocity.y -= tangent.y * friction;
  }

  clampVector(velocity, maxMarbleSpeed);
}

function getEntityRestitution(entity: StageEntity) {
  return entity.props.restitution > 0 ? clamp(entity.props.restitution, 0, maxStageRestitution) : wallRestitution;
}

function getBoxSurfaceVelocity(entity: StageEntity, angle: number, contactLocal: { x: number; y: number }) {
  if (entity.type !== "kinematic" || entity.shape.type !== "box") {
    return { x: 0, y: 0 };
  }

  const radius = rotatePoint(contactLocal.x, contactLocal.y, Math.cos(angle), Math.sin(angle));
  return {
    x: -entity.props.angularVelocity * radius.y,
    y: entity.props.angularVelocity * radius.x,
  };
}

function closestPointOnSegment(
  point: { x: number; y: number },
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : clamp(((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSq, 0, 1);
  return {
    x: from.x + dx * t,
    y: from.y + dy * t,
    t,
  };
}

function segmentFallbackNormal(
  from: { x: number; y: number },
  to: { x: number; y: number },
  velocity: { x: number; y: number },
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / length, y: dx / length };
  return dot(velocity, normal) < 0 ? normal : { x: -normal.x, y: -normal.y };
}

function rotatePoint(x: number, y: number, cos: number, sin: number) {
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function clampVector(vector: { x: number; y: number }, maxLength: number) {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= maxLength || length === 0) {
    return;
  }
  const scale = maxLength / length;
  vector.x *= scale;
  vector.y *= scale;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function dot(left: { x: number; y: number }, right: { x: number; y: number }) {
  return left.x * right.x + left.y * right.y;
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
