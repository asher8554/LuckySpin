// LuckySpin 앱의 상태와 룰렛 화면을 연결한다.
import { useCallback, useEffect, useMemo, useState } from "react";
import { ControlPanel } from "./components/ControlPanel";
import { NoticeModal } from "./components/NoticeModal";
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
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [results, setResults] = useState<RouletteResult[]>([]);
  const [runEntries, setRunEntries] = useState<MarbleEntry[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const parsedEntries = useMemo(() => parseEntries(names), [names]);
  const expandedEntries = useMemo(() => expandEntries(parsedEntries), [parsedEntries]);
  const total = expandedEntries.length;
  const winnerRank =
    winnerMode === "last"
      ? Math.max(total, 1)
      : winnerMode === "first"
        ? 1
        : clampWinnerRank(customWinnerRank, Math.max(total, 1));

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
    setResults([]);
    if (status !== "running") {
      setStatus("idle");
    }
  }, [names, status]);

  const handleShuffle = useCallback(() => {
    if (status === "running") {
      pushToast("진행 중에는 섞을 수 없습니다.");
      return;
    }

    const shuffled = shuffleEntries(expandedEntries);
    setNames(shuffled.map((entry) => entry.name).join(","));
    setResults([]);
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

    setRunEntries(shuffleEntries(expandedEntries));
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

  const handleResult = useCallback((result: RouletteResult) => {
    setResults((current) => (current.some((item) => item.id === result.id) ? current : [...current, result]));
  }, []);

  const handleComplete = useCallback(() => {
    setStatus("finished");
    window.setTimeout(() => setStatus("idle"), 1200);
  }, []);

  return (
    <main className="roulette-app">
      <RouletteCanvas
        entries={runEntries}
        status={status}
        theme={theme}
        onResult={handleResult}
        onComplete={handleComplete}
      />
      <RankingBoard total={total} results={results} selectedRank={winnerRank} />
      <ControlPanel
        names={names}
        mapId={mapId}
        theme={theme}
        winnerMode={winnerMode}
        winnerRank={winnerRank}
        total={total}
        status={status}
        collapsed={collapsed}
        onNamesChange={setNames}
        onShuffle={handleShuffle}
        onStart={handleStart}
        onMapChange={handleMapChange}
        onThemeChange={setTheme}
        onWinnerModeChange={setWinnerMode}
        onWinnerRankChange={setCustomWinnerRank}
        onUnsupported={(feature) => pushToast(`${feature} 기능은 첫 버전에서 지원하지 않습니다.`)}
        onNotice={() => setNoticeOpen(true)}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
      />
      <NoticeModal open={noticeOpen} onClose={() => setNoticeOpen(false)} />
      <ToastHost messages={toasts} />
      <footer className="copyright">© 2026. LuckySpin은 방송과 영상에서 자유롭게 사용할 수 있는 룰렛 도구입니다.</footer>
    </main>
  );
}
