const { LineChart, Line, AreaChart, Area, ResponsiveContainer, Tooltip: RTooltip, XAxis, YAxis, ReferenceLine, CartesianGrid } = Recharts;

// ───────────────────── KPI Band ─────────────────────
function Spark({ data, color = "var(--accent)", height = 24 }) {
  return (
    <div className="spark">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sg-${color.replace(/[^a-z0-9]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.3} fill={`url(#sg-${color.replace(/[^a-z0-9]/gi,'')})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function Delta({ value, invert = false }) {
  const up = value > 0;
  const good = invert ? !up : up;
  const cls = value === 0 ? "flat" : good ? "up" : "down";
  return (
    <span className={`delta ${cls}`}>
      <I d={value > 0 ? SVG.arrowUp : value < 0 ? SVG.arrowDown : SVG.minus} size={10} />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function KPIBand({ totals, currency, t }) {
  const s1 = AEGIS.sparkData(1, 24, 0.3);
  const s2 = AEGIS.sparkData(2, 24, 0.5);
  const s3 = AEGIS.sparkData(3, 24, -0.4);

  const fmtCur = (v) => {
    const opt = { USD: "$", EUR: "€", GBP: "£", TRY: "₺" }[currency] || "$";
    if (v >= 1e6) return `${opt}${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `${opt}${(v / 1e3).toFixed(1)}k`;
    return `${opt}${v.toFixed(0)}`;
  };

  return (
    <div className="kpi-band">
      <div className="kpi-cell">
        <div className="kpi-head">
          <div className="kpi-head-title">
            <I d={SVG.users} size={14} />
            <span className="label">{t.kpi_active}</span>
          </div>
          <Delta value={2.4} />
        </div>
        <div className="kpi-value tnum">
          341,287
        </div>
        <div className="kpi-foot">
          <span style={{ color: "var(--text-secondary)" }}>
            <span className="mono tnum">+7,941</span> {t.kpi_active_sub}
          </span>
          <Spark data={s1} color="#3B6FD4" />
        </div>
      </div>

      <div className="kpi-cell">
        <div className="kpi-head">
          <div className="kpi-head-title">
            <I d={SVG.flame} size={14} style={{ color: "var(--risk-critical)" }} />
            <span className="label">{t.kpi_atrisk}</span>
          </div>
          <Delta value={-3.1} invert />
        </div>
        <div className="kpi-value tnum">
          12,408
          <span className="suffix"> · {((12408/341287)*100).toFixed(2)}%</span>
        </div>
        <div className="kpi-foot">
          <span style={{ color: "var(--text-secondary)" }}>
            <span className="mono tnum" style={{ color: "var(--risk-critical)" }}>2,103</span> {t.kpi_atrisk_sub}
          </span>
          <Spark data={s2} color="#C0392B" />
        </div>
      </div>

      <div className="kpi-cell">
        <div className="kpi-head">
          <div className="kpi-head-title">
            <I d={SVG.dollar} size={14} style={{ color: "var(--risk-low)" }} />
            <span className="label">{t.kpi_revenue}</span>
          </div>
          <Delta value={6.2} />
        </div>
        <div className="kpi-value tnum">
          {fmtCur(totals.retained)}
        </div>
        <div className="kpi-foot">
          <span style={{ color: "var(--text-secondary)" }}>
            {t.kpi_revenue_sub} <span className="mono tnum">8.4%</span> {t.kpi_revenue_sub2}
          </span>
          <Spark data={s3} color="#1E8449" />
        </div>
      </div>

      <div className="kpi-cell">
        <div className="kpi-head">
          <div className="kpi-head-title">
            <I d={SVG.cpu} size={14} />
            <span className="label">{t.kpi_system}</span>
          </div>
          <span className="live-pulse">
            <span className="pulse-dot" /> {t.kpi_operational}
          </span>
        </div>
        <div className="sys-grid">
          {AEGIS.SYSTEM_STATUS.map((s) => (
            <div className="sys-row" key={s.name}>
              <span className={`status-dot ${s.status}`} />
              <span className="name">{(t.sys && t.sys[s.name]) || s.name}</span>
              <span className="val">{s.meta}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.KPIBand = KPIBand;
window.Spark = Spark;
window.Delta = Delta;
