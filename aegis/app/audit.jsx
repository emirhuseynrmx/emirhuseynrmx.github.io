function AuditTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-default)",
      borderRadius: 6,
      padding: "8px 10px",
      fontSize: 11,
      color: "var(--text-primary)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
      fontFamily: "var(--font-mono)",
    }}>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
          <span style={{ color: p.color, opacity: 0.9 }}>{p.name}</span>
          <span className="tnum">{p.value.toFixed(1)}ms</span>
        </div>
      ))}
    </div>
  );
}

function CalibrationTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const pt = payload[0].payload;
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-default)",
      borderRadius: 6,
      padding: "8px 10px",
      fontSize: 11,
      color: "var(--text-primary)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
      fontFamily: "var(--font-mono)",
    }}>
      <div style={{ color: "var(--text-label)", fontSize: 10, marginBottom: 3 }}>
        Bin {(pt.predicted * 100).toFixed(0)}%
      </div>
      <div className="tnum">Predicted: {(pt.predicted * 100).toFixed(1)}%</div>
      <div className="tnum" style={{ color: "var(--accent-bright)" }}>Observed: {(pt.observed * 100).toFixed(1)}%</div>
    </div>
  );
}

function AuditCard({ mode, onModeChange, t }) {
  const latency = AEGIS.latencyData();
  const calibration = AEGIS.calibrationData();

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-head-l">
          <span className="card-title">{t.audit_title}</span>
          <span className="card-sub">{t.audit_sub}</span>
        </div>
        <div className="tweak-seg" style={{ fontSize: 10 }}>
          <button className={mode === "latency" ? "active" : ""} onClick={() => onModeChange("latency")}>{t.audit_latency}</button>
          <button className={mode === "calibration" ? "active" : ""} onClick={() => onModeChange("calibration")}>{t.audit_calibration}</button>
        </div>
      </div>

      <div className="audit-stats">
        {mode === "latency" ? (
          <>
            <div className="audit-stat">
              <div className="audit-stat-v tnum">38<span className="sub">ms</span></div>
              <div className="audit-stat-k">{t.audit_p50}</div>
            </div>
            <div className="audit-stat">
              <div className="audit-stat-v tnum">112<span className="sub">ms</span></div>
              <div className="audit-stat-k">{t.audit_p95}</div>
            </div>
            <div className="audit-stat">
              <div className="audit-stat-v tnum">142<span className="sub">/s</span></div>
              <div className="audit-stat-k">{t.audit_throughput}</div>
            </div>
          </>
        ) : (
          <>
            <div className="audit-stat">
              <div className="audit-stat-v tnum">0.87</div>
              <div className="audit-stat-k">{t.audit_auc}</div>
            </div>
            <div className="audit-stat">
              <div className="audit-stat-v tnum">0.034</div>
              <div className="audit-stat-k">{t.audit_brier}</div>
            </div>
            <div className="audit-stat">
              <div className="audit-stat-v tnum">0.021</div>
              <div className="audit-stat-k">{t.audit_ece}</div>
            </div>
          </>
        )}
      </div>

      <div className="audit-chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          {mode === "latency" ? (
            <LineChart data={latency} margin={{ top: 8, right: 14, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border-dim)" vertical={false} />
              <XAxis dataKey="i" hide />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "var(--text-secondary)" }} width={26} domain={[0, "dataMax"]} />
              <RTooltip content={<AuditTooltip />} cursor={{ stroke: "var(--border-strong)", strokeWidth: 1, strokeDasharray: "2 2" }} />
              <Line type="monotone" dataKey="p99" stroke="var(--risk-critical)" strokeWidth={1.1} dot={false} name="p99" strokeOpacity={0.7} />
              <Line type="monotone" dataKey="p95" stroke="var(--risk-medium)" strokeWidth={1.1} dot={false} name="p95" strokeOpacity={0.8} />
              <Line type="monotone" dataKey="p50" stroke="var(--accent)" strokeWidth={1.6} dot={false} name="p50" />
            </LineChart>
          ) : (
            <LineChart data={calibration} margin={{ top: 8, right: 14, bottom: 16, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border-dim)" />
              <XAxis
                dataKey="predicted"
                type="number"
                domain={[0, 1]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: "var(--text-secondary)" }}
                tickFormatter={(v) => `${(v*100).toFixed(0)}%`}
              />
              <YAxis
                type="number"
                domain={[0, 1]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: "var(--text-secondary)" }}
                width={30}
                tickFormatter={(v) => `${(v*100).toFixed(0)}`}
              />
              <RTooltip content={<CalibrationTooltip />} cursor={{ stroke: "var(--border-strong)", strokeWidth: 1, strokeDasharray: "2 2" }} />
              <Line type="monotone" dataKey="ideal" stroke="var(--text-tertiary)" strokeWidth={1} strokeDasharray="3 3" dot={false} />
              <Line type="monotone" dataKey="observed" stroke="var(--accent-bright)" strokeWidth={1.6} dot={{ r: 2, fill: "var(--accent-bright)", strokeWidth: 0 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EventLog({ t }) {
  return (
    <div className="card" style={{ minHeight: 0, flex: 1 }}>
      <div className="card-head">
        <div className="card-head-l">
          <span className="card-title">{t.events_title}</span>
          <span className="live-pulse" style={{ fontSize: 10 }}>
            <span className="pulse-dot" /> {t.events_live}
          </span>
        </div>
        <span className="card-sub mono tnum">{t.events_rate}</span>
      </div>
      <div className="event-log">
        {AEGIS.EVENTS.map((e, i) => (
          <div key={i} className={`event ${e.kind}`}>
            <span className="ts">{e.ts}</span>
            <span className="dot" />
            <span className="msg">{e.msg}</span>
            <span className="tag">{e.tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

window.AuditCard = AuditCard;
window.EventLog = EventLog;
