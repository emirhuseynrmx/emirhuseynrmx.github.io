const { useState, useEffect, useMemo } = React;

// ── Shared view heading ────────────────────────────────────────────
function ViewHead({ title, sub, meta }) {
  return (
    <div className="exec-head">
      <div>
        <h1 className="exec-title">{title}</h1>
        {sub && <div className="exec-sub">{sub}</div>}
      </div>
      {meta && (
        <div className="exec-meta">
          {meta.map((m, i) => (
            <div className="exec-meta-block" key={i}>
              <span className="label">{m.k}</span>
              <span className="exec-meta-v">{m.v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Operations (default) view ─────────────────────────────────────
function OpsView({ tweaks, t, selected, setSelected, auditMode, setAuditMode, totals }) {
  return (
    <>
      <ViewHead
        title={t.heading_title}
        sub={<>
          {t.heading_sub_a} <span className="mono tnum">342k</span> {t.heading_sub_b} <span className="mono">xgb-v2.4.1</span>
        </>}
        meta={[
          { k: t.meta_refreshed, v: "18:42:14 UTC" },
          { k: t.meta_window, v: "T−30d → now" },
          { k: t.meta_run, v: "run_8f2a…c31" },
        ]}
      />
      <KPIBand totals={totals} currency={tweaks.currency} t={t} />
      <div className="row-split" style={{ minHeight: 520 }}>
        <RiskTable
          rows={AEGIS.CUSTOMERS}
          selectedId={selected?.id}
          onSelect={setSelected}
          currency={tweaks.currency}
          t={t}
        />
        <div className="right-col">
          <AuditCard mode={auditMode} onModeChange={setAuditMode} t={t} />
          {tweaks.showEventLog && <EventLog t={t} />}
        </div>
      </div>
    </>
  );
}

// ── Customers view — full-width cohort + segment cards ────────────
function CustomersView({ tweaks, t, selected, setSelected }) {
  const segs = useMemo(() => {
    const map = {};
    AEGIS.CUSTOMERS.forEach(c => {
      map[c.segment] = map[c.segment] || { seg: c.segment, n: 0, sumP: 0, sumLtv: 0 };
      map[c.segment].n++;
      map[c.segment].sumP += c.prob;
      map[c.segment].sumLtv += c.ltv;
    });
    return Object.values(map).map(s => ({ ...s, avgP: s.sumP / s.n }));
  }, []);
  const cur = { USD: "$", EUR: "€", GBP: "£", TRY: "₺" }[tweaks.currency] || "$";

  return (
    <>
      <ViewHead
        title={t.nav_cust}
        sub={<>{AEGIS.CUSTOMERS.length} {t.heading_sub_b.includes("model") ? "records" : "kayıt"} · segment breakdown</>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {segs.map(s => (
          <div key={s.seg} className="card" style={{ padding: 16 }}>
            <div className="label" style={{ marginBottom: 8 }}>{s.seg}</div>
            <div className="mono tnum" style={{ fontSize: 26, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{s.n}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 11, color: "var(--text-secondary)" }}>
              <span>avg P(churn) <span className="mono tnum" style={{ color: riskColor(s.avgP) }}>{(s.avgP * 100).toFixed(1)}%</span></span>
              <span>Σ LTV <span className="mono tnum" style={{ color: "var(--text-primary)" }}>{cur}{(s.sumLtv / 1000).toFixed(0)}k</span></span>
            </div>
          </div>
        ))}
      </div>
      <RiskTable
        rows={AEGIS.CUSTOMERS}
        selectedId={selected?.id}
        onSelect={setSelected}
        currency={tweaks.currency}
        t={t}
      />
    </>
  );
}

// ── Explainability / SHAP global ──────────────────────────────────
function ShapView({ t }) {
  const global = useMemo(() => {
    const feats = {};
    AEGIS.CUSTOMERS.slice(0, 20).forEach(c => {
      AEGIS.shapFor(c.id).forEach(s => {
        feats[s.feat] = (feats[s.feat] || 0) + Math.abs(s.value);
      });
    });
    return Object.entries(feats)
      .map(([feat, v]) => ({ feat, v: v / 20 }))
      .sort((a, b) => b.v - a.v);
  }, []);
  const max = Math.max(...global.map(g => g.v));

  return (
    <>
      <ViewHead title={t.nav_shap} sub={<>Global feature importance · mean |SHAP| across cohort</>} />
      <div className="card">
        <div className="card-head">
          <div className="card-head-l">
            <I d={SVG.layers} size={14} />
            <span className="card-title">Global SHAP · Mean Absolute Attribution</span>
          </div>
          <span className="card-sub mono">n=20 sample</span>
        </div>
        <div style={{ padding: "14px 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          {global.map(g => (
            <div key={g.feat} style={{ display: "grid", gridTemplateColumns: "160px 1fr 60px", gap: 12, alignItems: "center", fontSize: 12 }}>
              <span style={{ color: "var(--text-primary)" }}>{g.feat}</span>
              <div style={{ height: 10, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(g.v / max) * 100}%`, background: "var(--shap-pos)", borderRadius: 2 }} />
              </div>
              <span className="mono tnum" style={{ textAlign: "right", color: "var(--text-secondary)" }}>{(g.v * 100).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Counterfactuals overview ─────────────────────────────────────
function DiceView({ t, tweaks, setSelected }) {
  const cur = { USD: "$", EUR: "€", GBP: "£", TRY: "₺" }[tweaks.currency] || "$";
  const top = useMemo(() =>
    AEGIS.CUSTOMERS.filter(c => c.rec === "INTERVENE").slice(0, 8).map(c => ({
      c, scenarios: AEGIS.diceFor(c),
    })), []);

  return (
    <>
      <ViewHead title={t.nav_dice} sub={<>DiCE counterfactual scenarios · top intervention candidates</>} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {top.map(({ c, scenarios }) => {
          const best = scenarios[0];
          return (
            <div key={c.id} className="card" style={{ cursor: "pointer" }} onClick={() => setSelected(c)}>
              <div className="card-head">
                <div className="card-head-l">
                  <span className="mono" style={{ color: riskColor(c.prob) }}>{c.id}</span>
                  <span className="card-sub">{c.segment} · {c.region}</span>
                </div>
                <span className="dice-drop"><I d={SVG.arrowDown} size={10} /> −{(best.delta * 100).toFixed(0)}pts</span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: "var(--text-primary)", marginBottom: 10 }}>{best.title}</div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                  <span style={{ color: "var(--risk-critical)" }}>{(c.prob * 100).toFixed(0)}%</span>
                  <I d={SVG.chevRight} size={10} />
                  <span style={{ color: "var(--risk-low)" }}>{(best.newProb * 100).toFixed(0)}%</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ color: "var(--text-secondary)" }}>cost {cur}{best.actionCost}</span>
                  <span style={{ color: "var(--risk-low)" }}>+{cur}{best.netEV}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── EV optimizer (distribution + thresholds) ─────────────────────
function EVView({ t, tweaks }) {
  const cur = { USD: "$", EUR: "€", GBP: "£", TRY: "₺" }[tweaks.currency] || "$";
  const intervene = AEGIS.CUSTOMERS.filter(c => c.rec === "INTERVENE");
  const totalEV = intervene.reduce((a, c) => a + c.netEV, 0);
  const totalCost = intervene.reduce((a, c) => a + c.interventionCost, 0);
  const totalSaved = intervene.reduce((a, c) => a + c.evSaved, 0);

  return (
    <>
      <ViewHead
        title={t.nav_ev}
        sub={<>WACC-discounted expected value · portfolio view</>}
        meta={[
          { k: "WACC", v: "8.4%" },
          { k: "Horizon", v: "24 mo" },
        ]}
      />
      <div className="summary-strip" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="summary-cell">
          <div className="summary-k">Eligible</div>
          <div className="summary-v">{intervene.length}<span style={{ color: "var(--text-secondary)", fontSize: 12, marginLeft: 4 }}>/ {AEGIS.CUSTOMERS.length}</span></div>
        </div>
        <div className="summary-cell">
          <div className="summary-k">Σ Cost</div>
          <div className="summary-v" style={{ color: "var(--risk-critical)" }}>−{cur}{totalCost.toLocaleString()}</div>
        </div>
        <div className="summary-cell">
          <div className="summary-k">Σ LTV Saved</div>
          <div className="summary-v" style={{ color: "var(--risk-low)" }}>+{cur}{totalSaved.toLocaleString()}</div>
        </div>
        <div className="summary-cell">
          <div className="summary-k">Net EV</div>
          <div className="summary-v" style={{ color: "var(--risk-low)" }}>+{cur}{totalEV.toLocaleString()}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-head">
          <div className="card-head-l">
            <I d={SVG.calc} size={14} />
            <span className="card-title">Intervention Candidates · Ranked by Net EV</span>
          </div>
        </div>
        <div style={{ padding: "8px 0" }}>
          {[...intervene].sort((a, b) => b.netEV - a.netEV).slice(0, 12).map((c, i) => (
            <div key={c.id} style={{ display: "grid", gridTemplateColumns: "32px 1fr 80px 80px 100px", gap: 16, padding: "10px 20px", borderBottom: "1px solid var(--border-dim)", fontSize: 12, alignItems: "center" }}>
              <span className="mono" style={{ color: "var(--text-tertiary)" }}>#{String(i+1).padStart(2,"0")}</span>
              <span className="mono" style={{ color: "var(--text-primary)" }}>{c.id}</span>
              <span className="mono tnum" style={{ textAlign: "right", color: riskColor(c.prob) }}>{(c.prob * 100).toFixed(0)}%</span>
              <span className="mono tnum" style={{ textAlign: "right", color: "var(--text-secondary)" }}>{cur}{c.interventionCost}</span>
              <span className="mono tnum" style={{ textAlign: "right", color: "var(--risk-low)", fontWeight: 500 }}>+{cur}{c.netEV.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── MLflow / model registry ──────────────────────────────────────
function MLflowView({ t }) {
  const runs = [
    { v: "xgb-v2.4.1",  auc: 0.874, brier: 0.034, ece: 0.021, status: "production", ts: "2026-04-18 14:02" },
    { v: "xgb-v2.4.0",  auc: 0.871, brier: 0.035, ece: 0.024, status: "shadow",     ts: "2026-04-11 09:47" },
    { v: "lgbm-v1.9.3", auc: 0.863, brier: 0.038, ece: 0.029, status: "archived",   ts: "2026-03-28 18:12" },
    { v: "xgb-v2.3.2",  auc: 0.858, brier: 0.041, ece: 0.033, status: "archived",   ts: "2026-02-20 11:55" },
  ];
  return (
    <>
      <ViewHead title={t.nav_mlflow} sub={<>Model registry · experiment tracking</>} />
      <div className="card">
        <div className="card-head"><div className="card-head-l"><I d={SVG.git} size={14} /><span className="card-title">Registered Models</span></div></div>
        <div className="cust-table">
          <table>
            <thead>
              <tr>
                <th>Version</th><th>Status</th>
                <th className="num">AUC</th><th className="num">Brier</th><th className="num">ECE</th>
                <th>Trained</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(r => (
                <tr key={r.v}>
                  <td className="mono" style={{ color: "var(--text-primary)" }}>{r.v}</td>
                  <td>
                    <span className={`rec ${r.status === "production" ? "intervene" : "churn"}`}>
                      <span className="rec-dot" />{r.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="num">{r.auc.toFixed(3)}</td>
                  <td className="num">{r.brier.toFixed(3)}</td>
                  <td className="num">{r.ece.toFixed(3)}</td>
                  <td className="mono" style={{ color: "var(--text-secondary)", fontSize: 11 }}>{r.ts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function AuditView({ t, auditMode, setAuditMode }) {
  return (
    <>
      <ViewHead title={t.nav_audit} sub={<>System performance · decision audit</>} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, minHeight: 400 }}>
        <AuditCard mode={auditMode} onModeChange={setAuditMode} t={t} />
        <EventLog t={t} />
      </div>
    </>
  );
}

function AlertsView({ t }) {
  const alerts = [
    { kind: "crit", title: "Drift: tenure distribution shift", sub: "KS=0.08 · exceeds threshold 0.05", ts: "18:41:22" },
    { kind: "warn", title: "Calibration drift on fiber cohort", sub: "ECE 0.034 → 0.048 in 24h", ts: "17:12:44" },
    { kind: "info", title: "Celery worker 4 restarted", sub: "task retry exceeded · auto-recovered", ts: "16:58:11" },
    { kind: "info", title: "Nightly retrain completed", sub: "xgb-v2.4.1 promoted to shadow", ts: "03:14:00" },
  ];
  return (
    <>
      <ViewHead title={t.nav_alerts} sub={<>Operational and model-health alerts</>} />
      <div className="card">
        <div className="event-log" style={{ maxHeight: "none" }}>
          {alerts.map((a, i) => (
            <div key={i} className={`event ${a.kind}`} style={{ gridTemplateColumns: "60px 14px 1fr", padding: "14px 20px" }}>
              <span className="ts">{a.ts}</span>
              <span className="dot" />
              <div>
                <div style={{ color: "var(--text-primary)", fontSize: 12 }}>{a.title}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 11, marginTop: 2 }}>{a.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function SettingsView({ t, tweaks, setTweaks }) {
  return (
    <>
      <ViewHead title={t.nav_settings} sub={<>Preferences · access · integrations</>} />
      <div className="card" style={{ padding: 20 }}>
        <div className="label" style={{ marginBottom: 12 }}>Appearance & Locale</div>
        <div style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 10 }}>
          Theme, language, density and accent settings live in the Tweaks panel. Toggle <span style={{ color: "var(--text-primary)" }}>Tweaks</span> from the toolbar.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
          {[
            ["Language", tweaks.lang],
            ["Theme", tweaks.theme],
            ["Density", tweaks.density],
            ["Currency", tweaks.currency],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 6, fontSize: 12 }}>
              <span style={{ color: "var(--text-secondary)" }}>{k}</span>
              <span className="mono" style={{ color: "var(--text-primary)" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function App() {
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState(null);
  const [navActive, setNavActive] = useState("ops");
  const [auditMode, setAuditMode] = useState("latency");

  const t = STRINGS[tweaks.lang] || STRINGS.EN;

  useEffect(() => {
    const handler = (e) => {
      const tt = e?.data?.type;
      if (tt === "__activate_edit_mode") { setEditMode(true); setTweaksOpen(true); }
      else if (tt === "__deactivate_edit_mode") { setEditMode(false); setTweaksOpen(false); }
    };
    window.addEventListener("message", handler);
    window.parent?.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    const h = tweaks.accentHue;
    const r = document.documentElement.style;
    r.setProperty("--accent", `hsl(${h}, 58%, 54%)`);
    r.setProperty("--accent-bright", `hsl(${h}, 70%, 68%)`);
    r.setProperty("--accent-dim", `hsla(${h}, 58%, 54%, 0.20)`);
    r.setProperty("--accent-muted", `hsla(${h}, 58%, 54%, 0.10)`);
  }, [tweaks.accentHue]);

  useEffect(() => {
    const r = document.documentElement.style;
    if (tweaks.density === "compact") r.setProperty("--r-lg", "8px");
    else if (tweaks.density === "spacious") r.setProperty("--r-lg", "16px");
    else r.setProperty("--r-lg", "12px");
  }, [tweaks.density]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tweaks.theme);
  }, [tweaks.theme]);

  const totals = useMemo(() => {
    const retained = AEGIS.CUSTOMERS.reduce((a, c) => a + (c.rec === "INTERVENE" ? Math.max(0, c.netEV) : 0), 0);
    return { retained: retained * 320 };
  }, []);

  const navPrimary = [
    { id: "ops", d: SVG.activity, label: t.nav_ops },
    { id: "cust", d: SVG.users, label: t.nav_cust },
    { id: "shap", d: SVG.layers, label: t.nav_shap },
    { id: "dice", d: SVG.brain, label: t.nav_dice },
    { id: "ev", d: SVG.calc, label: t.nav_ev },
  ];
  const navSecondary = [
    { id: "mlflow", d: SVG.cpu, label: t.nav_mlflow },
    { id: "audit",  d: SVG.eye, label: t.nav_audit },
  ];
  const navBottom = [
    { id: "alerts",   d: SVG.bell, label: t.nav_alerts },
    { id: "settings", d: SVG.settings, label: t.nav_settings },
  ];

  // Breadcrumb current label per view
  const viewLabelMap = {
    ops: t.breadcrumb_current,
    cust: t.nav_cust, shap: t.nav_shap, dice: t.nav_dice, ev: t.nav_ev,
    mlflow: t.nav_mlflow, audit: t.nav_audit,
    alerts: t.nav_alerts, settings: t.nav_settings,
  };

  const renderView = () => {
    switch (navActive) {
      case "ops":      return <OpsView tweaks={tweaks} t={t} selected={selected} setSelected={setSelected} auditMode={auditMode} setAuditMode={setAuditMode} totals={totals} />;
      case "cust":     return <CustomersView tweaks={tweaks} t={t} selected={selected} setSelected={setSelected} />;
      case "shap":     return <ShapView t={t} />;
      case "dice":     return <DiceView t={t} tweaks={tweaks} setSelected={setSelected} />;
      case "ev":       return <EVView t={t} tweaks={tweaks} />;
      case "mlflow":   return <MLflowView t={t} />;
      case "audit":    return <AuditView t={t} auditMode={auditMode} setAuditMode={setAuditMode} />;
      case "alerts":   return <AlertsView t={t} />;
      case "settings": return <SettingsView t={t} tweaks={tweaks} setTweaks={setTweaks} />;
      default:         return null;
    }
  };

  return (
    <div className="app">
      <nav className="sidebar" aria-label="Main">
        <div className="sidebar-logo" title="Telco-Aegis">
          <div className="sidebar-logo-mark" />
        </div>
        {navPrimary.map((n) => (
          <button
            key={n.id}
            className={`sidebar-btn ${navActive === n.id ? "active" : ""}`}
            onClick={() => setNavActive(n.id)}
            title={n.label}
          >
            <I d={n.d} size={16} />
          </button>
        ))}
        <div className="sidebar-sep" />
        {navSecondary.map((n) => (
          <button
            key={n.id}
            className={`sidebar-btn ${navActive === n.id ? "active" : ""}`}
            onClick={() => setNavActive(n.id)}
            title={n.label}
          >
            <I d={n.d} size={16} />
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {navBottom.map((n) => (
          <button
            key={n.id}
            className={`sidebar-btn ${navActive === n.id ? "active" : ""}`}
            onClick={() => setNavActive(n.id)}
            title={n.label}
          >
            <I d={n.d} size={16} />
          </button>
        ))}
      </nav>

      <div className="main">
        <div className="topbar">
          <div className="breadcrumb">
            <span>{t.breadcrumb_root}</span>
            <span className="breadcrumb-sep">/</span>
            <span>{t.breadcrumb_section}</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{viewLabelMap[navActive]}</span>
          </div>
          <div className="topbar-spacer" />
          <span className="live-pulse"><span className="pulse-dot" /> {t.live_quarter}</span>
          <div className="search">
            <I d={SVG.search} size={12} />
            <input placeholder={t.search_placeholder} />
            <kbd>⌘K</kbd>
          </div>
          <button className="topbar-btn">
            <I d={SVG.download} size={13} /> {t.export}
          </button>
          <button className="topbar-btn primary">
            <I d={SVG.zap} size={13} /> {t.run_batch}
          </button>
        </div>

        <div key={navActive} className="content fade-in">
          {renderView()}
          <div style={{ height: 4 }} />
        </div>
      </div>

      <DeepDive customer={selected} onClose={() => setSelected(null)} currency={tweaks.currency} t={t} />

      {editMode && tweaksOpen && (
        <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} onClose={() => setTweaksOpen(false)} t={t} />
      )}
      {editMode && !tweaksOpen && (
        <button className="tweaks-fab" onClick={() => setTweaksOpen(true)} title={t.tw_title}>
          <I d={SVG.sliders} size={16} />
        </button>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
