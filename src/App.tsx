// LuckySpin 앱의 상태와 룰렛 화면을 연결한다.
import { useCallback, useEffect, useMemo, useState } from "react";
import { ControlPanel } from "./components/ControlPanel";
import { RankingBoard } from "./components/RankingBoard";
import { RouletteCanvas } from "./components/RouletteCanvas";
import { ToastHost } from "./components/ToastHost";
import { clampWinnerRank, expandEntries, parseEntries, ROULETTE_MAPS, shuffleEntries } from "./lib/roulette";
import { loadNames, loadTheme, saveNames, saveTheme } from "./lib/storage";
import type {
  MapId,
  MarbleEntry,
  RouletteResult,
  RouletteStatus,
  ThemeMode,
  ToastMessage,
  WinnerMode,
} from "./types";

function createToast(message: string): ToastMessage {
  return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, message };
}

export default function App() {
  const [names, setNames] = useState(loadNames);
  const [theme, setTheme] = useState<ThemeMode>(loadTheme);
  const [mapId, setMapId] = useState<MapId>("wheel");
  const [winnerMode, setWinnerMode] = useState<WinnerMode>("first");
  const [customWinnerRank, setCustomWinnerRank] = useState(1);
  const [status, setStatus] = useState<RouletteStatus>("idle");
  const [collapsed, setCollapsed] = useState(true);
  const [results, setResults] = useState<RouletteResult[]>([]);
  const [runEntries, setRunEntries] = useState<MarbleEntry[]>([]);
  const [liveEntries, setLiveEntries] = useState<MarbleEntry[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const parsedEntries = useMemo(() => parseEntries(names), [names]);
  const expandedEntries = useMemo(() => expandEntries(parsedEntries), [parsedEntries]);
  const total = expandedEntries.length;
  const canvasEntries = status === "running" ? runEntries : expandedEntries;
  const winnerRank =
    winnerMode === "last"
      ? Math.max(total, 1)
      : winnerMode === "first"
        ? 1
        : clampWinnerRank(customWinnerRank, Math.max(total, 1));
  const winner = results.find((result) => result.rank === winnerRank);
  const resultIds = new Set(results.map((result) => result.id));
  const pendingEntries = (liveEntries.length > 0 ? liveEntries : canvasEntries).filter(
    (entry) => !resultIds.has(entry.id),
  );

  const pushToast = useCallback((message: string) => {
    const toast = createToast(message);
    setToasts((current) => [...current, toast]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 1800);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveNames(names);
  }, [names]);

  const handleNamesChange = useCallback(
    (value: string) => {
      setNames(value);
      setResults([]);
      setLiveEntries([]);
      if (status !== "running") {
        setStatus("idle");
      }
    },
    [status],
  );

  const handleShuffle = useCallback(() => {
    if (status === "running") {
      pushToast("진행 중에는 섞을 수 없습니다.");
      return;
    }

    const shuffled = shuffleEntries(expandedEntries);
    setNames(shuffled.map((entry) => entry.name).join(","));
    setResults([]);
    setLiveEntries([]);
  }, [expandedEntries, pushToast, status]);

  const handleStart = useCallback(() => {
    if (status === "running") {
      pushToast("이미 룰렛이 진행 중입니다.");
      return;
    }

    if (expandedEntries.length === 0) {
      pushToast("이름을 한 개 이상 입력하세요.");
      return;
    }

    const nextEntries = shuffleEntries(expandedEntries);
    setRunEntries(nextEntries);
    setLiveEntries(nextEntries);
    setResults([]);
    setStatus("running");
  }, [expandedEntries, pushToast, status]);

  const handleMapChange = useCallback(
    (nextMapId: MapId) => {
      const selectedMap = ROULETTE_MAPS.find((map) => map.id === nextMapId);
      if (!selectedMap?.enabled) {
        pushToast("이 맵은 첫 버전에서 아직 지원하지 않습니다.");
        return;
      }

      setMapId(nextMapId);
    },
    [pushToast],
  );

  const handleUnsupported = useCallback(
    (feature: string) => {
      pushToast(`${feature} 기능은 첫 버전에서 지원하지 않습니다.`);
    },
    [pushToast],
  );

  const handleResult = useCallback((result: RouletteResult) => {
    setResults((current) => (current.some((item) => item.id === result.id) ? current : [...current, result]));
  }, []);

  const handleLiveRank = useCallback((entries: MarbleEntry[]) => {
    setLiveEntries(entries);
  }, []);

  const handleComplete = useCallback(() => {
    setStatus("finished");
    window.setTimeout(() => setStatus("idle"), 1200);
  }, []);

  return (
    <main className="roulette-app">
      <RouletteCanvas
        entries={canvasEntries}
        results={results}
        status={status}
        theme={theme}
        mapId={mapId}
        winnerRank={winnerRank}
        winner={winner}
        onResult={handleResult}
        onComplete={handleComplete}
        onLiveRank={handleLiveRank}
      />
      <RankingBoard total={total} results={results} pendingEntries={pendingEntries} selectedRank={winnerRank} />
      <ControlPanel
        names={names}
        mapId={mapId}
        theme={theme}
        winnerMode={winnerMode}
        winnerRank={winnerRank}
        total={total}
        status={status}
        collapsed={collapsed}
        onNamesChange={handleNamesChange}
        onShuffle={handleShuffle}
        onStart={handleStart}
        onMapChange={handleMapChange}
        onThemeChange={setTheme}
        onWinnerModeChange={setWinnerMode}
        onWinnerRankChange={setCustomWinnerRank}
        onUnsupported={handleUnsupported}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
      />
      <ToastHost messages={toasts} />
      <footer className="copyright">© 2026. LuckySpin은 방송과 영상에서 자유롭게 사용할 수 있는 룰렛 도구입니다.</footer>
    </main>
  );
}
