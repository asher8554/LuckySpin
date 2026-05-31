// 선택된 당첨 순위의 우승자를 원본처럼 크게 강조한다.
import type { RouletteResult } from "../types";

interface WinnerOverlayProps {
  winner: RouletteResult | undefined;
}

function getFruitClass(name: string) {
  if (name.includes("수박")) {
    return "watermelon";
  }

  if (name.includes("키위")) {
    return "kiwi";
  }

  if (name.includes("귤") || name.includes("오렌지")) {
    return "orange";
  }

  return "generic";
}

export function WinnerOverlay({ winner }: WinnerOverlayProps) {
  if (!winner) {
    return null;
  }

  return (
    <section className="winner-overlay" aria-label="당첨 결과">
      <div>
        <span>Winner</span>
        <strong>{winner.name}</strong>
      </div>
      <i className={`winner-fruit ${getFruitClass(winner.name)}`} aria-hidden="true" />
    </section>
  );
}
