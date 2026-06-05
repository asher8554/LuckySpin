// 캔버스 크기와 원본형 룰렛 물리 실행 생명주기를 React에서 관리한다.
import { Engine } from "matter-js";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MapId, MarbleEntry, RouletteResult, RouletteStatus, ThemeMode } from "../types";
import {
  advanceRouletteWorld,
  applyImpactSkill,
  createRouletteWorld,
  drawRouletteScene,
  getLiveMarbleOrder,
  getStageForMap,
  removeMarbleFromWorld,
  shakeSlowMarbles,
  updateRouletteCamera,
  type RouletteWorld,
  type WorldSize,
} from "../lib/physics";
import {
  advanceSkillEffects,
  createImpactSkillCooldown,
  createImpactSkillEffect,
  tickImpactSkillCooldown,
  type ImpactSkillCooldown,
  type SkillEffectState,
} from "../lib/skills";

interface UseRoulettePhysicsOptions {
  entries: MarbleEntry[];
  results: RouletteResult[];
  status: RouletteStatus;
  theme: ThemeMode;
  mapId: MapId;
  winnerRank: number;
  skillsEnabled: boolean;
  winner?: RouletteResult;
  onResult: (result: RouletteResult) => void;
  onComplete: () => void;
  onLiveRank: (entries: MarbleEntry[]) => void;
}

function getViewportSize(): WorldSize {
  return { width: window.innerWidth, height: window.innerHeight };
}

export function useRoulettePhysics({
  entries,
  results,
  status,
  theme,
  mapId,
  winnerRank,
  skillsEnabled,
  winner,
  onResult,
  onComplete,
  onLiveRank,
}: UseRoulettePhysicsOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<RouletteWorld | null>(null);
  const frameRef = useRef<number | null>(null);
  const stuckAssistRef = useRef<number | null>(null);
  const finishedIdsRef = useRef<Set<string>>(new Set());
  const resultCountRef = useRef(0);
  const completedRef = useRef(false);
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastLiveRankRef = useRef("");
  const lastLiveRankEmitRef = useRef(0);
  const resultsRef = useRef(results);
  const winnerRef = useRef(winner);
  const skillsEnabledRef = useRef(skillsEnabled);
  const skillCooldownsRef = useRef<Map<string, ImpactSkillCooldown>>(new Map());
  const skillEffectsRef = useRef<SkillEffectState[]>([]);
  const [size, setSize] = useState<WorldSize>(getViewportSize);

  const drawCurrentScene = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(size.width * ratio);
    canvas.height = Math.floor(size.height * ratio);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawRouletteScene(context, worldRef.current, size, theme, {
      entries,
      results,
      selectedRank: winnerRank,
      stage: getStageForMap(mapId),
      skillEffects: skillEffectsRef.current,
      winner,
    });
  }, [entries, mapId, results, size, theme, winner, winnerRank]);

  const cleanupWorld = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (stuckAssistRef.current !== null) {
      window.clearInterval(stuckAssistRef.current);
      stuckAssistRef.current = null;
    }

    if (worldRef.current) {
      Engine.clear(worldRef.current.engine);
      worldRef.current = null;
    }

    skillCooldownsRef.current = new Map();
    skillEffectsRef.current = [];
    lastFrameTimeRef.current = null;
  }, []);

  useEffect(() => {
    const handleResize = () => setSize(getViewportSize());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    winnerRef.current = winner;
  }, [winner]);

  useEffect(() => {
    skillsEnabledRef.current = skillsEnabled;
  }, [skillsEnabled]);

  useEffect(() => {
    drawCurrentScene();
  }, [drawCurrentScene]);

  useEffect(() => {
    if (status !== "running" || entries.length === 0) {
      if (status === "idle") {
        cleanupWorld();
      }
      return;
    }

    cleanupWorld();
    finishedIdsRef.current = new Set();
    resultCountRef.current = 0;
    completedRef.current = false;
    lastLiveRankRef.current = "";
    lastLiveRankEmitRef.current = 0;

    const stage = getStageForMap(mapId);
    const world = createRouletteWorld(entries, size, stage);
    worldRef.current = world;
    skillCooldownsRef.current = new Map(
      world.marbles.map((marble) => [marble.entry.id, createImpactSkillCooldown(marble.entry.weight, marble.order)]),
    );
    skillEffectsRef.current = [];
    onLiveRank(entries);

    stuckAssistRef.current = window.setInterval(() => {
      if (!worldRef.current || completedRef.current) {
        return;
      }

      shakeSlowMarbles(worldRef.current, finishedIdsRef.current);
    }, 600);

    const tick = (time: number) => {
      const previousTime = lastFrameTimeRef.current ?? time;
      const deltaMs = Math.min(16.6, Math.max(8, time - previousTime));
      lastFrameTimeRef.current = time;

      if (!completedRef.current) {
        updateSkills(world, deltaMs);
        advanceRouletteWorld(world, deltaMs);
        updateRouletteCamera(world, size, finishedIdsRef.current, winnerRank, resultCountRef.current);
        collectResults(world);
        emitLiveRank(world, time);
      }

      drawFrame();

      if (!completedRef.current) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    const updateSkills = (currentWorld: RouletteWorld, deltaMs: number) => {
      skillEffectsRef.current = advanceSkillEffects(skillEffectsRef.current, deltaMs);

      if (!skillsEnabledRef.current) {
        return;
      }

      for (const marble of currentWorld.marbles) {
        if (finishedIdsRef.current.has(marble.entry.id)) {
          continue;
        }

        const currentCooldown =
          skillCooldownsRef.current.get(marble.entry.id) ??
          createImpactSkillCooldown(marble.entry.weight, marble.order);
        const result = tickImpactSkillCooldown(currentCooldown, deltaMs);
        skillCooldownsRef.current.set(marble.entry.id, result.cooldown);

        if (result.triggered) {
          applyImpactSkill(currentWorld, marble, finishedIdsRef.current);
          skillEffectsRef.current.push(createImpactSkillEffect(marble.body.position.x, marble.body.position.y));
        }
      }

      if (skillEffectsRef.current.length > 24) {
        skillEffectsRef.current = skillEffectsRef.current.slice(-24);
      }
    };

    const collectResults = (currentWorld: RouletteWorld) => {
      const pending = getLiveMarbleOrder(currentWorld, finishedIdsRef.current);
      let changed = false;

      for (const marble of pending) {
        if (marble.body.position.y <= currentWorld.stage.goalY || finishedIdsRef.current.has(marble.entry.id)) {
          continue;
        }

        finishedIdsRef.current.add(marble.entry.id);
        resultCountRef.current += 1;
        changed = true;
        removeMarbleFromWorld(currentWorld, marble);
        onResult({ ...marble.entry, rank: resultCountRef.current });

        if (resultCountRef.current >= winnerRank) {
          completedRef.current = true;
          onComplete();
          break;
        }
      }

      if (changed) {
        onLiveRank(getLiveMarbleOrder(currentWorld, finishedIdsRef.current).map((marble) => marble.entry));
      }
    };

    const emitLiveRank = (currentWorld: RouletteWorld, time: number) => {
      if (time - lastLiveRankEmitRef.current < 120) {
        return;
      }

      const liveEntries = getLiveMarbleOrder(currentWorld, finishedIdsRef.current).map((marble) => marble.entry);
      const signature = liveEntries.map((entry) => entry.id).join("|");
      if (signature !== lastLiveRankRef.current) {
        lastLiveRankRef.current = signature;
        onLiveRank(liveEntries);
      }
      lastLiveRankEmitRef.current = time;
    };

    const drawFrame = () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) {
        return;
      }

      const ratio = window.devicePixelRatio || 1;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawRouletteScene(context, world, size, theme, {
        entries,
        results: resultsRef.current,
        selectedRank: winnerRank,
        skillEffects: skillEffectsRef.current,
        winner: winnerRef.current,
      });
    };

    frameRef.current = requestAnimationFrame(tick);

    return cleanupWorld;
  }, [
    cleanupWorld,
    entries,
    mapId,
    onComplete,
    onLiveRank,
    onResult,
    size,
    status,
    theme,
    winnerRank,
  ]);

  useEffect(() => cleanupWorld, [cleanupWorld]);

  return { canvasRef };
}
