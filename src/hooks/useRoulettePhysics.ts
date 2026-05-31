// 캔버스 크기와 Matter.js 실행 생명주기를 React에서 관리한다.
import { Engine, Runner } from "matter-js";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MarbleEntry, RouletteResult, RouletteStatus, ThemeMode } from "../types";
import {
  createRouletteWorld,
  drawRouletteScene,
  subscribeToFinish,
  type RouletteWorld,
  type WorldSize,
} from "../lib/physics";

interface UseRoulettePhysicsOptions {
  entries: MarbleEntry[];
  status: RouletteStatus;
  theme: ThemeMode;
  onResult: (result: RouletteResult) => void;
  onComplete: () => void;
}

function getViewportSize(): WorldSize {
  return { width: window.innerWidth, height: window.innerHeight };
}

export function useRoulettePhysics({ entries, status, theme, onResult, onComplete }: UseRoulettePhysicsOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<RouletteWorld | null>(null);
  const frameRef = useRef<number | null>(null);
  const fallbackRef = useRef<number | null>(null);
  const cleanupFinishRef = useRef<(() => void) | null>(null);
  const [size, setSize] = useState<WorldSize>(getViewportSize);
  const resultCountRef = useRef(0);
  const finishedIdsRef = useRef<Set<string>>(new Set());

  const cleanupWorld = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (fallbackRef.current !== null) {
      window.clearTimeout(fallbackRef.current);
      fallbackRef.current = null;
    }

    cleanupFinishRef.current?.();
    cleanupFinishRef.current = null;

    if (worldRef.current) {
      Runner.stop(worldRef.current.runner);
      Engine.clear(worldRef.current.engine);
      worldRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setSize(getViewportSize());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(size.width * ratio);
    canvas.height = Math.floor(size.height * ratio);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawRouletteScene(context, worldRef.current, size, theme, entries);
  }, [entries, size, theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || status !== "running" || entries.length === 0) {
      if (status !== "running") {
        cleanupWorld();
      }
      return;
    }

    cleanupWorld();
    resultCountRef.current = 0;
    finishedIdsRef.current = new Set();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(size.width * ratio);
    canvas.height = Math.floor(size.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const world = createRouletteWorld(entries, size);
    worldRef.current = world;
    cleanupFinishRef.current = subscribeToFinish(world, (result) => {
      finishedIdsRef.current.add(result.id);
      resultCountRef.current += 1;
      onResult(result);
      if (resultCountRef.current >= entries.length) {
        onComplete();
      }
    });

    fallbackRef.current = window.setTimeout(() => {
      const currentWorld = worldRef.current;
      if (!currentWorld || resultCountRef.current >= entries.length) {
        return;
      }

      const pending = currentWorld.marbles
        .filter((marble) => !finishedIdsRef.current.has(marble.entry.id))
        .sort((left, right) => right.body.position.y - left.body.position.y || right.body.position.x - left.body.position.x);

      for (const marble of pending) {
        finishedIdsRef.current.add(marble.entry.id);
        resultCountRef.current += 1;
        onResult({ ...marble.entry, rank: resultCountRef.current });
      }

      onComplete();
    }, 9000);

    Runner.run(world.runner, world.engine);

    const tick = () => {
      drawRouletteScene(context, worldRef.current, size, theme, entries);
      frameRef.current = requestAnimationFrame(tick);
    };
    tick();

    return cleanupWorld;
  }, [cleanupWorld, entries, onComplete, onResult, size, status, theme]);

  useEffect(() => cleanupWorld, [cleanupWorld]);

  return { canvasRef };
}
