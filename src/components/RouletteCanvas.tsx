// 룰렛 캔버스를 렌더링하고 물리 훅을 연결한다.
import type { MarbleEntry, RouletteResult, RouletteStatus, ThemeMode } from "../types";
import { useRoulettePhysics } from "../hooks/useRoulettePhysics";

interface RouletteCanvasProps {
  entries: MarbleEntry[];
  status: RouletteStatus;
  theme: ThemeMode;
  onResult: (result: RouletteResult) => void;
  onComplete: () => void;
}

export function RouletteCanvas({ entries, status, theme, onResult, onComplete }: RouletteCanvasProps) {
  const { canvasRef } = useRoulettePhysics({ entries, status, theme, onResult, onComplete });

  return <canvas className="roulette-canvas" ref={canvasRef} aria-label="룰렛 트랙" />;
}
