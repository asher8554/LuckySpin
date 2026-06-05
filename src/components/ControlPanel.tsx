// 이름 입력과 룰렛 설정, 실행 버튼을 제공하는 하단 패널이다.
import {
  Bomb,
  Map,
  Moon,
  Play,
  Settings,
  Shuffle,
  Store,
  Sun,
  Trophy,
  Video,
} from "lucide-react";
import type { MapId, RouletteStatus, ThemeMode, WinnerMode } from "../types";
import { ROULETTE_MAPS } from "../lib/roulette";

interface ControlPanelProps {
  names: string;
  mapId: MapId;
  theme: ThemeMode;
  winnerMode: WinnerMode;
  winnerRank: number;
  recordingActive: boolean;
  recordingEnabled: boolean;
  skillsEnabled: boolean;
  total: number;
  status: RouletteStatus;
  collapsed: boolean;
  onNamesChange: (value: string) => void;
  onShuffle: () => void;
  onStart: () => void;
  onMapChange: (mapId: MapId) => void;
  onThemeChange: (theme: ThemeMode) => void;
  onWinnerModeChange: (mode: WinnerMode) => void;
  onWinnerRankChange: (rank: number) => void;
  onRecordingChange: (enabled: boolean) => void;
  onSkillsChange: (enabled: boolean) => void;
  onUnsupported: (feature: string) => void;
  onToggleCollapsed: () => void;
}

export function ControlPanel({
  names,
  mapId,
  theme,
  winnerMode,
  winnerRank,
  recordingActive,
  recordingEnabled,
  skillsEnabled,
  total,
  status,
  collapsed,
  onNamesChange,
  onShuffle,
  onStart,
  onMapChange,
  onThemeChange,
  onWinnerModeChange,
  onWinnerRankChange,
  onRecordingChange,
  onSkillsChange,
  onUnsupported,
  onToggleCollapsed,
}: ControlPanelProps) {
  const running = status === "running";

  return (
    <section className={`control-panel ${running ? "is-running" : ""}`} aria-label="룰렛 설정">
      <button className="mobile-settings-toggle" type="button" onClick={onToggleCollapsed}>
        <Settings size={18} />
        <span>설정</span>
        <span aria-hidden="true">{collapsed ? "▲" : "▼"}</span>
      </button>

      <div className="name-panel">
        <h2>이름들을 입력하세요</h2>
        <textarea
          aria-label="이름 입력"
          value={names}
          placeholder="이름들을 쉼표나 엔터로 구분해서 넣어주세요"
          onChange={(event) => onNamesChange(event.target.value)}
        />
        <div className="action-row">
          <button type="button" className="shop-button" onClick={() => onUnsupported("상점")}>
            <Store size={22} />
            <span>NEW</span>
          </button>
          <span className="action-spacer" />
          <button type="button" onClick={onShuffle} disabled={running || total === 0}>
            <Shuffle size={22} />
            섞기
          </button>
          <button type="button" onClick={onStart} disabled={total === 0}>
            <Play size={22} />
            시작
          </button>
        </div>
      </div>

      <div className={`settings-panel ${collapsed ? "collapsed" : ""}`}>
        <label className="settings-row">
          <span>
            <Map size={24} />
            맵
          </span>
          <select value={mapId} onChange={(event) => onMapChange(event.target.value as MapId)}>
            {ROULETTE_MAPS.map((map) => (
              <option key={map.id} value={map.id}>
                {map.label}
              </option>
            ))}
          </select>
        </label>

        <div className="settings-row two-columns">
          <label className={recordingActive ? "recording-active" : ""}>
            <span>
              <Video size={24} />
              녹화
            </span>
            <input
              aria-label="녹화"
              type="checkbox"
              checked={recordingEnabled}
              onChange={(event) => onRecordingChange(event.target.checked)}
            />
          </label>
          <label>
            <span>
              <Bomb size={24} />
              스킬 활성화
            </span>
            <input
              aria-label="스킬 활성화"
              type="checkbox"
              checked={skillsEnabled}
              onChange={(event) => onSkillsChange(event.target.checked)}
            />
          </label>
        </div>

        <div className="settings-row">
          <span>
            <Trophy size={24} />
            당첨 순위
          </span>
          <div className="winner-group">
            <button
              className={winnerMode === "first" ? "active" : ""}
              type="button"
              onClick={() => onWinnerModeChange("first")}
            >
              첫번째
            </button>
            <button
              className={winnerMode === "last" ? "active" : ""}
              type="button"
              onClick={() => onWinnerModeChange("last")}
            >
              마지막
            </button>
            <input
              aria-label="직접 당첨 순위"
              min={1}
              max={Math.max(total, 1)}
              type="number"
              value={winnerRank}
              onChange={(event) => onWinnerRankChange(Number(event.target.value))}
              onFocus={() => onWinnerModeChange("custom")}
            />
          </div>
        </div>

        <div className="theme-row">
          <Sun size={24} />
          <label className="switch">
            <input
              aria-label="다크 모드"
              type="checkbox"
              checked={theme === "dark"}
              onChange={(event) => onThemeChange(event.target.checked ? "dark" : "light")}
            />
            <span />
          </label>
          <Moon size={24} />
        </div>
      </div>
    </section>
  );
}
