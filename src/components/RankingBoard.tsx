// 룰렛 진행 수와 도착 순위를 표시한다.
import type { RouletteResult } from "../types";

const rankColors = ["#6f8cff", "#ff5fb8", "#39e8d0", "#57e66e", "#f5d84a", "#ff6e6e"];

interface RankingBoardProps {
  total: number;
  results: RouletteResult[];
  selectedRank: number;
}

export function RankingBoard({ total, results, selectedRank }: RankingBoardProps) {
  return (
    <aside className="ranking-board" aria-label="당첨 순위">
      <div className="ranking-count">
        {results.length} / {total}
      </div>
      <ol>
        {results.map((result, index) => (
          <li
            className={result.rank === selectedRank ? "selected" : ""}
            key={`${result.id}-${result.rank}`}
            style={{ color: rankColors[index % rankColors.length] }}
          >
            <em>{result.rank === selectedRank ? "☆" : result.rank <= 3 ? "✓" : ""}</em>
            <span>{result.name}</span>
            <strong>#{result.rank}</strong>
          </li>
        ))}
      </ol>
    </aside>
  );
}
