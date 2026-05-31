// 룰렛 진행 수와 도착 순위, 남은 구슬 순서를 표시한다.
import type { MarbleEntry, RouletteResult } from "../types";

const rankColors = ["#6f8cff", "#ff5fb8", "#39e8d0", "#57e66e", "#f5d84a", "#ff6e6e"];

interface RankingBoardProps {
  total: number;
  results: RouletteResult[];
  pendingEntries: MarbleEntry[];
  selectedRank: number;
}

export function RankingBoard({ total, results, pendingEntries, selectedRank }: RankingBoardProps) {
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
        {pendingEntries.map((entry, index) => {
          const rank = results.length + index + 1;
          return (
            <li
              className={rank === selectedRank ? "selected pending" : "pending"}
              key={`${entry.id}-${rank}`}
              style={{ color: rankColors[(rank - 1) % rankColors.length] }}
            >
              <em>{rank === selectedRank ? "☆" : ""}</em>
              <span>{entry.name}</span>
              <strong>#{rank}</strong>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
