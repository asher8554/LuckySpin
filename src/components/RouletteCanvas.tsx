// 룰렛 캔버스를 렌더링하고 물리 훅을 연결한다.
import type { MapId, MarbleEntry, RouletteResult, RouletteStatus, ThemeMode } from "../types";
import { useRoulettePhysics } from "../hooks/useRoulettePhysics";

interface RouletteCanvasProps {
  entries: MarbleEntry[];
  results: RouletteResult[];
  status: RouletteStatus;
  theme: ThemeMode;
  mapId: MapId;
  winnerRank: number;
  winner?: RouletteResult;
  onResult: (result: RouletteResult) => void;
  onComplete: () => void;
  onLiveRank: (entries: MarbleEntry[]) => void;
}

export function RouletteCanvas({
  entries,
  results,
  status,
  theme,
  mapId,
  winnerRank,
  winner,
  onResult,
  onComplete,
  onLiveRank,
}: RouletteCanvasProps) {
  const { canvasRef } = useRoulettePhysics({
    entries,
    results,
    status,
    theme,
    mapId,
    winnerRank,
    winner,
    onResult,
    onComplete,
    onLiveRank,
  });

  return <canvas className="roulette-canvas" ref={canvasRef} aria-label="룰렛 트랙" />;
}
