import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  Timer,
  BarChart2,
  LayoutTemplate,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calculator,
  BookOpen,
  ChevronRight,
  Clock,
  TrendingUp,
} from "lucide-react";

import type { Template, SessionRecord, TimerPhase, SessionResult } from "./types";
import { DEFAULT_TEMPLATES, RESULT_LABELS } from "./data";
import { useStoredState } from "./storage";
import { minutesToSeconds, formatDuration, sameDay, createId, clampNumber } from "./utils";

/* ================================================================
   TYPES & CONSTANTS
   ================================================================ */

type AppTab = "timer" | "stats" | "templates";

const ACCENT_COLORS = [
  "#4a9eff", "#3ecf70", "#f5c842", "#f25b5b", "#a07aff",
  "#0f8b8d", "#c7503c", "#4a7c59", "#7a5c99", "#e8875a",
];

const PHASE_LABEL: Record<string, string> = {
  thinking: "思考阶段",
  solving: "解答阶段",
  overtime: "超时阶段",
};

const WARNING_THRESHOLD = 0.15; // last 15% of phase = warning state

/* ================================================================
   HELPERS
   ================================================================ */
function Stars({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="stars">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`star ${i < value ? "filled" : "empty"}`}>★</span>
      ))}
    </span>
  );
}

function ResultBadge({ result }: { result: SessionResult }) {
  return (
    <span className={`record-result ${result}`}>
      {RESULT_LABELS[result]}
    </span>
  );
}

/* ================================================================
   TEMPLATE FORM MODAL
   ================================================================ */
interface TemplateFormProps {
  initial?: Template;
  onSave: (t: Template) => void;
  onClose: () => void;
}

function TemplateForm({ initial, onSave, onClose }: TemplateFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [chapter, setChapter] = useState(initial?.chapter ?? "");
  const [problemType, setProblemType] = useState(initial?.problemType ?? "");
  const [familiarity, setFamiliarity] = useState(initial?.familiarity ?? 3);
  const [mastery, setMastery] = useState(initial?.mastery ?? 3);
  const [thinkingMinutes, setThinkingMinutes] = useState(initial?.thinkingMinutes ?? 2);
  const [solvingMinutes, setSolvingMinutes] = useState(initial?.solvingMinutes ?? 5);
  const [totalMinutes, setTotalMinutes] = useState(initial?.totalMinutes ?? 8);
  const [accent, setAccent] = useState(initial?.accent ?? ACCENT_COLORS[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t: Template = {
      id: initial?.id ?? createId("tpl"),
      name: name.trim() || "未命名模板",
      subject: subject.trim(),
      chapter: chapter.trim(),
      problemType: problemType.trim(),
      familiarity: clampNumber(familiarity, 1, 5),
      mastery: clampNumber(mastery, 1, 5),
      thinkingMinutes: Math.max(0, thinkingMinutes),
      solvingMinutes: Math.max(1, solvingMinutes),
      totalMinutes: Math.max(1, totalMinutes),
      accent,
    };
    onSave(t);
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={handleSubmit}>
        <div className="modal-header">
          {initial ? "编辑模板" : "新建模板"}
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>模板名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：高数 难题"
              autoFocus
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>科目</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="高等数学" />
            </div>
            <div className="form-group">
              <label>章节</label>
              <input type="text" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="极限" />
            </div>
          </div>
          <div className="form-group">
            <label>题型</label>
            <input type="text" value={problemType} onChange={(e) => setProblemType(e.target.value)} placeholder="计算题 / 选择题 / 证明题…" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>熟悉度 {familiarity}/5</label>
              <input
                type="range"
                min={1} max={5}
                value={familiarity}
                onChange={(e) => setFamiliarity(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>掌握度 {mastery}/5</label>
              <input
                type="range"
                min={1} max={5}
                value={mastery}
                onChange={(e) => setMastery(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="form-row-3">
            <div className="form-group">
              <label>思考 (min)</label>
              <input
                type="number"
                min={0} max={60}
                value={thinkingMinutes}
                onChange={(e) => setThinkingMinutes(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>解答 (min)</label>
              <input
                type="number"
                min={1} max={120}
                value={solvingMinutes}
                onChange={(e) => setSolvingMinutes(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>总计 (min)</label>
              <input
                type="number"
                min={1} max={120}
                value={totalMinutes}
                onChange={(e) => setTotalMinutes(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="form-group">
            <label>主题色</label>
            <div className="color-swatches">
              {ACCENT_COLORS.map((c) => (
                <div
                  key={c}
                  className={`color-swatch ${accent === c ? "selected" : ""}`}
                  style={{ background: c }}
                  onClick={() => setAccent(c)}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
          <button type="submit" className="btn btn-primary">保存</button>
        </div>
      </form>
    </div>
  );
}

/* ================================================================
   CIRCULAR RING
   ================================================================ */
interface RingProps {
  progress: number; // 0–1
  color: string;
  size?: number;
}

function Ring({ progress, color, size = 180 }: RingProps) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <svg className="ring-svg" viewBox={`0 0 ${size} ${size}`}>
      <circle
        className="ring-track"
        cx={size / 2}
        cy={size / 2}
        r={radius}
      />
      <circle
        className="ring-progress"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: offset,
          stroke: color,
        }}
      />
    </svg>
  );
}

/* ================================================================
   TIMER ENGINE HOOK
   ================================================================ */
interface TimerState {
  running: boolean;
  phase: TimerPhase | "idle" | "done";
  elapsedTotal: number;   // total elapsed since session start
  elapsedPhase: number;   // elapsed within current phase
  thinkingLimit: number;
  solvingLimit: number;
  totalLimit: number;
}

function useTimerEngine(template: Template | null) {
  const [state, setState] = useState<TimerState>(() => ({
    running: false,
    phase: "idle",
    elapsedTotal: 0,
    elapsedPhase: 0,
    thinkingLimit: template ? minutesToSeconds(template.thinkingMinutes) : 0,
    solvingLimit: template ? minutesToSeconds(template.solvingMinutes) : 0,
    totalLimit: template ? minutesToSeconds(template.totalMinutes) : 0,
  }));

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(0); // count ticks to avoid stale closures

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Re-initialise when template changes
  useEffect(() => {
    clearTick();
    if (!template) return;
    setState({
      running: false,
      phase: "idle",
      elapsedTotal: 0,
      elapsedPhase: 0,
      thinkingLimit: minutesToSeconds(template.thinkingMinutes),
      solvingLimit: minutesToSeconds(template.solvingMinutes),
      totalLimit: minutesToSeconds(template.totalMinutes),
    });
  }, [template, clearTick]);

  // Tick loop
  useEffect(() => {
    if (!state.running) {
      clearTick();
      return;
    }

    tickRef.current = 0;
    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev.running) return prev;

        const newElapsedTotal = prev.elapsedTotal + 1;
        const newElapsedPhase = prev.elapsedPhase + 1;

        // Phase transition logic
        let phase = prev.phase as TimerPhase | "done";

        if (phase === "thinking") {
          if (prev.thinkingLimit > 0 && newElapsedPhase >= prev.thinkingLimit) {
            return {
              ...prev,
              phase: "solving",
              elapsedTotal: newElapsedTotal,
              elapsedPhase: 0,
            };
          }
        } else if (phase === "solving") {
          if (newElapsedPhase >= prev.solvingLimit) {
            return {
              ...prev,
              phase: "overtime",
              elapsedTotal: newElapsedTotal,
              elapsedPhase: 0,
            };
          }
        }
        // Overtime: keep running, elapsedPhase keeps growing (shows +time)

        // Check total limit for overtime detection (separate from phase)
        // (overtime phase continues forever until user ends)

        return {
          ...prev,
          phase,
          elapsedTotal: newElapsedTotal,
          elapsedPhase: newElapsedPhase,
        };
      });
    }, 1000);

    return clearTick;
  }, [state.running, clearTick]);

  const start = useCallback(() => {
    setState((prev) => {
      if (prev.phase === "idle") {
        const nextPhase: TimerPhase = prev.thinkingLimit > 0 ? "thinking" : "solving";
        return { ...prev, running: true, phase: nextPhase, elapsedPhase: 0 };
      }
      return { ...prev, running: true };
    });
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, running: false }));
  }, []);

  const reset = useCallback(() => {
    clearTick();
    setState((prev) => ({
      ...prev,
      running: false,
      phase: "idle",
      elapsedTotal: 0,
      elapsedPhase: 0,
    }));
  }, [clearTick]);

  const skipToNext = useCallback(() => {
    setState((prev) => {
      if (prev.phase === "thinking") {
        return { ...prev, phase: "solving", elapsedPhase: 0 };
      }
      if (prev.phase === "solving") {
        return { ...prev, phase: "overtime", elapsedPhase: 0 };
      }
      return prev;
    });
  }, []);

  return { state, start, pause, reset, skipToNext };
}

/* ================================================================
   TIMER VIEW
   ================================================================ */
interface TimerViewProps {
  templates: Template[];
  onRecordSaved: (r: SessionRecord) => void;
}

function TimerView({ templates, onRecordSaved }: TimerViewProps) {
  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id ?? "");
  const selectedTemplate = templates.find((t) => t.id === selectedId) ?? templates[0] ?? null;

  const { state, start, pause, reset, skipToNext } = useTimerEngine(selectedTemplate);
  const [note, setNote] = useState("");
  const [showResultRow, setShowResultRow] = useState(false);
  const hasStarted = state.phase !== "idle";
  const isRunning = state.running;
  const isOvertime = state.phase === "overtime";
  const isDone = state.phase === "done";

  // Sound alert on phase change
  const prevPhaseRef = useRef(state.phase);
  useEffect(() => {
    if (prevPhaseRef.current !== state.phase) {
      if (state.phase === "solving" || state.phase === "overtime") {
        playBeep(state.phase === "overtime" ? 880 : 660);
      }
      prevPhaseRef.current = state.phase;
    }
  }, [state.phase]);

  // Show result row when overtime or user manually ends
  useEffect(() => {
    if (state.phase === "overtime") setShowResultRow(true);
  }, [state.phase]);

  function handleEnd() {
    pause();
    setShowResultRow(true);
  }

  function handleRecord(result: SessionResult) {
    if (!selectedTemplate) return;
    const record: SessionRecord = {
      id: createId("rec"),
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      subject: selectedTemplate.subject,
      chapter: selectedTemplate.chapter,
      problemType: selectedTemplate.problemType,
      result,
      elapsedSeconds: state.elapsedTotal,
      thinkingLimitSeconds: state.thinkingLimit,
      solvingLimitSeconds: state.solvingLimit,
      totalLimitSeconds: state.totalLimit,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };
    onRecordSaved(record);
    reset();
    setNote("");
    setShowResultRow(false);
  }

  // Determine timer card CSS class
  function timerCardClass() {
    if (!hasStarted) return "";
    const phase = state.phase;
    if (phase === "overtime") return "phase-overtime flashing";
    if (phase === "solving") {
      const ratio = state.elapsedPhase / state.solvingLimit;
      if (ratio >= 1 - WARNING_THRESHOLD) return "phase-warning";
      return "phase-solving";
    }
    if (phase === "thinking") {
      if (state.thinkingLimit > 0) {
        const ratio = state.elapsedPhase / state.thinkingLimit;
        if (ratio >= 1 - WARNING_THRESHOLD) return "phase-warning";
      }
      return "phase-thinking";
    }
    return "";
  }

  // What to show in the ring
  function ringInfo() {
    if (!hasStarted || !selectedTemplate) {
      return { progress: 1, color: "#4a9eff", display: formatDuration(state.totalLimit), sub: "总时间" };
    }
    const phase = state.phase;
    if (phase === "thinking") {
      const limit = state.thinkingLimit;
      const elapsed = state.elapsedPhase;
      const remaining = Math.max(0, limit - elapsed);
      return {
        progress: limit > 0 ? Math.max(0, 1 - elapsed / limit) : 1,
        color: remaining / limit < WARNING_THRESHOLD && limit > 0 ? "#f5c842" : "#4a9eff",
        display: formatDuration(remaining),
        sub: "思考剩余",
      };
    }
    if (phase === "solving") {
      const limit = state.solvingLimit;
      const elapsed = state.elapsedPhase;
      const remaining = Math.max(0, limit - elapsed);
      const ratio = elapsed / limit;
      return {
        progress: Math.max(0, 1 - ratio),
        color: ratio >= 1 - WARNING_THRESHOLD ? "#f5c842" : "#3ecf70",
        display: formatDuration(remaining),
        sub: "解答剩余",
      };
    }
    if (phase === "overtime") {
      return {
        progress: 0,
        color: "#f25b5b",
        display: formatDuration(-state.elapsedPhase), // shows +MM:SS
        sub: "超时",
      };
    }
    return { progress: 1, color: "#4a9eff", display: "--:--", sub: "" };
  }

  const ring = ringInfo();

  return (
    <div className="view">
      {/* Template selector */}
      <div className="template-selector">
        <div className="section-title">选择模板</div>
        <div className="template-grid">
          {templates.map((t) => (
            <div
              key={t.id}
              className={`tpl-card ${selectedId === t.id ? "selected" : ""}`}
              style={{ "--tpl-accent": t.accent } as React.CSSProperties}
              onClick={() => { if (!hasStarted || !isRunning) { setSelectedId(t.id); reset(); } }}
            >
              <div className="tpl-name truncate">{t.name}</div>
              <div className="tpl-meta truncate">{t.subject} · {t.chapter}</div>
              <div className="tpl-times">
                <span className="tpl-time-chip">思考 {t.thinkingMinutes}m</span>
                <span className="tpl-time-chip">解答 {t.solvingMinutes}m</span>
                <span className="tpl-time-chip">总 {t.totalMinutes}m</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase strip */}
      {hasStarted && (
        <div className="phase-strip">
          <div className={`phase-dot ${state.phase === "thinking" ? "active" : state.phase !== "idle" ? "done" : ""}`} />
          <div className={`phase-dot ${state.phase === "solving" ? "active" : state.phase === "overtime" ? "done" : ""}`} />
          <div className={`phase-dot ${state.phase === "overtime" ? "active" : ""}`} />
        </div>
      )}

      {/* Clock card */}
      <div className={`timer-card ${timerCardClass()}`}>
        {hasStarted && (
          <div className="phase-label">
            {state.phase !== "idle" && PHASE_LABEL[state.phase as string]}
          </div>
        )}

        <div className="ring-container">
          <Ring progress={ring.progress} color={ring.color} />
          <div className="ring-center">
            <div className={`timer-display ${isOvertime ? "overtime" : ""}`}>
              {ring.display}
            </div>
            <div className="timer-sub">{ring.sub}</div>
          </div>
        </div>

        {/* Phase progress bars */}
        {hasStarted && selectedTemplate && (
          <div className="phase-bars">
            <PhaseBar
              label="思考"
              elapsed={state.phase === "thinking" ? state.elapsedPhase : state.phase !== "idle" ? state.thinkingLimit : 0}
              limit={state.thinkingLimit}
              color="#4a9eff"
              active={state.phase === "thinking"}
            />
            <PhaseBar
              label="解答"
              elapsed={state.phase === "solving" ? state.elapsedPhase : state.phase === "overtime" ? state.solvingLimit : 0}
              limit={state.solvingLimit}
              color="#3ecf70"
              active={state.phase === "solving"}
            />
            <PhaseBar
              label="总用时"
              elapsed={state.elapsedTotal}
              limit={state.totalLimit}
              color={state.elapsedTotal > state.totalLimit ? "#f25b5b" : "#a07aff"}
              active={hasStarted}
            />
          </div>
        )}

        {/* Template info */}
        {selectedTemplate && (
          <div className="template-info-row">
            <span className="template-info-name">{selectedTemplate.name}</span>
            <span className="template-info-meta">
              <Stars value={selectedTemplate.mastery} />
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="timer-controls">
        <button className="ctrl-reset" onClick={reset} title="重置">
          <RotateCcw size={18} />
        </button>

        {!isRunning ? (
          <button className="ctrl-start" onClick={start} title="开始/继续">
            <Play size={26} fill="currentColor" />
          </button>
        ) : (
          <button className="ctrl-pause" onClick={pause} title="暂停">
            <Pause size={26} fill="currentColor" />
          </button>
        )}

        {hasStarted && state.phase !== "overtime" && (
          <button className="ctrl-next" onClick={skipToNext} title="跳到下一阶段">
            <SkipForward size={18} />
          </button>
        )}
        {hasStarted && !isOvertime && !isDone && (
          <button className="ctrl-next" onClick={handleEnd} title="结束计时，记录结果" style={{ color: "#f5c842", borderColor: "rgba(245,200,66,0.3)" }}>
            <CheckCircle2 size={18} />
          </button>
        )}
      </div>

      {/* Result recording */}
      {showResultRow && (
        <>
          <div className="section-title" style={{ marginTop: 4 }}>
            <span>记录结果</span>
            <span className="text-muted" style={{ fontSize: 11 }}>用时 {formatDuration(state.elapsedTotal)}</span>
          </div>
          <div className="result-row">
            {(Object.keys(RESULT_LABELS) as SessionResult[]).map((r) => (
              <button key={r} className={`result-btn result-${r}`} onClick={() => handleRecord(r)}>
                {RESULT_LABELS[r]}
              </button>
            ))}
          </div>
          <div className="note-input-wrap">
            <textarea
              placeholder="备注（可选）：错在哪里、卡在哪一步…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
}

/* Progress bar component */
function PhaseBar({
  label, elapsed, limit, color, active,
}: {
  label: string;
  elapsed: number;
  limit: number;
  color: string;
  active: boolean;
}) {
  const pct = limit > 0 ? Math.min(1, elapsed / limit) * 100 : 0;
  const remaining = Math.max(0, limit - elapsed);

  return (
    <div className="phase-bar-row">
      <span className="phase-bar-label">{label}</span>
      <div className="phase-bar-track">
        <div
          className="phase-bar-fill"
          style={{ width: `${pct}%`, background: color, opacity: active ? 1 : 0.5 }}
        />
      </div>
      <span className="phase-bar-time">{formatDuration(remaining)}</span>
    </div>
  );
}

/* ================================================================
   BEEP SOUND
   ================================================================ */
function playBeep(freq = 660, durationMs = 300) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // AudioContext not available — silently ignore
  }
}

/* ================================================================
   STATS VIEW
   ================================================================ */
interface StatsViewProps {
  records: SessionRecord[];
}

function StatsView({ records }: StatsViewProps) {
  const today = new Date();
  const todayRecords = records.filter((r) => sameDay(new Date(r.createdAt), today));

  const total = todayRecords.length;
  const overtime = todayRecords.filter(
    (r) => r.result === "solved_overtime" || r.elapsedSeconds > r.totalLimitSeconds
  ).length;
  const stuck = todayRecords.filter((r) => r.result === "stuck" || r.result === "checked_answer").length;
  const avgSec = total > 0 ? Math.round(todayRecords.reduce((s, r) => s + r.elapsedSeconds, 0) / total) : 0;

  // Subject breakdown
  const subjectMap: Record<string, number> = {};
  todayRecords.forEach((r) => {
    subjectMap[r.subject] = (subjectMap[r.subject] ?? 0) + 1;
  });
  const maxSubjectCount = Math.max(...Object.values(subjectMap), 1);

  return (
    <div className="view">
      <div className="section-title">今日统计</div>
      <div className="stats-grid">
        <div className="stat-card blue">
          <span className="stat-label">题数</span>
          <span className="stat-value">{total}</span>
          <span className="stat-sub">道题目</span>
        </div>
        <div className="stat-card yellow">
          <span className="stat-label">超时数</span>
          <span className="stat-value">{overtime}</span>
          <span className="stat-sub">{total > 0 ? `${Math.round(overtime / total * 100)}%` : "—"}</span>
        </div>
        <div className="stat-card red">
          <span className="stat-label">卡住数</span>
          <span className="stat-value">{stuck}</span>
          <span className="stat-sub">没思路 / 看答案</span>
        </div>
        <div className="stat-card green">
          <span className="stat-label">平均耗时</span>
          <span className="stat-value" style={{ fontSize: 20, paddingTop: 6 }}>
            {total > 0 ? formatDuration(avgSec) : "—"}
          </span>
          <span className="stat-sub">每道题</span>
        </div>
      </div>

      {Object.keys(subjectMap).length > 0 && (
        <>
          <div className="section-title">科目分布</div>
          <div className="subject-breakdown">
            {Object.entries(subjectMap).map(([subj, count]) => (
              <div key={subj} className="subject-row">
                <span className="subject-name truncate">{subj}</span>
                <div className="subject-bar-track">
                  <div
                    className="subject-bar-fill"
                    style={{ width: `${count / maxSubjectCount * 100}%` }}
                  />
                </div>
                <span className="subject-count">{count}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-title" style={{ marginTop: 4 }}>
        <span>做题记录</span>
        <span className="text-muted" style={{ fontWeight: 400, fontSize: 11 }}>今日 {total} 道</span>
      </div>

      {todayRecords.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={40} />
          <p>今天还没有做题记录</p>
          <p className="text-muted">去计时器里开始第一道题吧！</p>
        </div>
      ) : (
        <div className="record-list">
          {[...todayRecords].reverse().map((r) => (
            <div key={r.id} className="record-item">
              <div>
                <div className="record-name truncate">{r.templateName}</div>
                <div className="record-chapter text-muted">{r.subject} · {r.chapter}</div>
              </div>
              <div className="record-time">{formatDuration(r.elapsedSeconds)}</div>
              <ResultBadge result={r.result} />
            </div>
          ))}
        </div>
      )}

      {records.length > todayRecords.length && (
        <div className="section-title" style={{ marginTop: 8 }}>
          <span>历史记录</span>
          <span className="text-muted" style={{ fontWeight: 400, fontSize: 11 }}>共 {records.length} 道</span>
        </div>
      )}
      {records.length > todayRecords.length && (
        <div className="record-list">
          {[...records].filter((r) => !sameDay(new Date(r.createdAt), today)).reverse().slice(0, 20).map((r) => (
            <div key={r.id} className="record-item">
              <div>
                <div className="record-name truncate">{r.templateName}</div>
                <div className="record-chapter text-muted">
                  {new Date(r.createdAt).toLocaleDateString("zh-CN")} · {r.subject}
                </div>
              </div>
              <div className="record-time">{formatDuration(r.elapsedSeconds)}</div>
              <ResultBadge result={r.result} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   TEMPLATES MANAGE VIEW
   ================================================================ */
interface TemplatesViewProps {
  templates: Template[];
  onChange: (templates: Template[]) => void;
}

function TemplatesView({ templates, onChange }: TemplatesViewProps) {
  const [editing, setEditing] = useState<Template | null>(null);
  const [adding, setAdding] = useState(false);

  function handleSave(t: Template) {
    if (editing) {
      onChange(templates.map((x) => (x.id === t.id ? t : x)));
    } else {
      onChange([...templates, t]);
    }
    setEditing(null);
    setAdding(false);
  }

  function handleDelete(id: string) {
    if (templates.length <= 1) return; // keep at least one
    onChange(templates.filter((t) => t.id !== id));
  }

  return (
    <div className="view">
      <div className="section-title">
        <span>模板管理</span>
        <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setAdding(true)}>
          <Plus size={13} /> 新建
        </button>
      </div>

      <div className="tpl-manage-list">
        {templates.map((t) => (
          <div key={t.id} className="tpl-manage-item">
            <div className="tpl-manage-info">
              <div className="flex items-center gap-2">
                <span
                  style={{
                    width: 10, height: 10, borderRadius: 5,
                    background: t.accent, flexShrink: 0, display: "inline-block",
                  }}
                />
                <span style={{ fontWeight: 600 }}>{t.name}</span>
              </div>
              <div className="text-muted" style={{ fontSize: 11, paddingLeft: 18 }}>
                {t.subject} · {t.chapter} · {t.problemType}
              </div>
              <div className="flex gap-2 mt-1" style={{ paddingLeft: 18 }}>
                <span className="badge badge-blue">思考 {t.thinkingMinutes}m</span>
                <span className="badge badge-green">解答 {t.solvingMinutes}m</span>
                <span className="badge badge-red" style={{ fontSize: 10 }}>总 {t.totalMinutes}m</span>
                <Stars value={t.mastery} />
              </div>
            </div>
            <div className="tpl-manage-actions">
              <button className="btn-icon" onClick={() => setEditing(t)} title="编辑">
                <Pencil size={14} />
              </button>
              <button
                className="btn-icon danger"
                onClick={() => handleDelete(t.id)}
                title="删除"
                disabled={templates.length <= 1}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {(editing || adding) && (
        <TemplateForm
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={() => { setEditing(null); setAdding(false); }}
        />
      )}
    </div>
  );
}

/* ================================================================
   ROOT APP
   ================================================================ */
export default function App() {
  const [tab, setTab] = useState<AppTab>("timer");
  const [templates, setTemplates] = useStoredState<Template[]>("timetips:templates", DEFAULT_TEMPLATES);
  const [records, setRecords] = useStoredState<SessionRecord[]>("timetips:records", []);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  function handleRecordSaved(r: SessionRecord) {
    setRecords((prev) => [...prev, r]);
    showToast(`已记录：${RESULT_LABELS[r.result]}（${formatDuration(r.elapsedSeconds)}）`);
  }

  const todayCount = records.filter((r) => sameDay(new Date(r.createdAt), new Date())).length;

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <Timer size={18} />
          TimeTips
        </div>

        <div className="header-tabs">
          <button
            className={`header-tab ${tab === "timer" ? "active" : ""}`}
            onClick={() => setTab("timer")}
          >
            <Clock size={13} /> 计时
          </button>
          <button
            className={`header-tab ${tab === "stats" ? "active" : ""}`}
            onClick={() => setTab("stats")}
          >
            <TrendingUp size={13} /> 统计
            {todayCount > 0 && (
              <span className="badge badge-blue" style={{ padding: "1px 6px", fontSize: 10 }}>
                {todayCount}
              </span>
            )}
          </button>
          <button
            className={`header-tab ${tab === "templates" ? "active" : ""}`}
            onClick={() => setTab("templates")}
          >
            <LayoutTemplate size={13} /> 模板
          </button>
        </div>

        <div className="header-actions">
          <span className="text-muted" style={{ fontSize: 11 }}>
            {new Date().toLocaleDateString("zh-CN", { month: "short", day: "numeric", weekday: "short" })}
          </span>
        </div>
      </header>

      {/* Body */}
      <main className="app-body">
        {tab === "timer" && (
          <TimerView
            templates={templates}
            onRecordSaved={handleRecordSaved}
          />
        )}
        {tab === "stats" && <StatsView records={records} />}
        {tab === "templates" && (
          <TemplatesView
            templates={templates}
            onChange={setTemplates}
          />
        )}
      </main>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
