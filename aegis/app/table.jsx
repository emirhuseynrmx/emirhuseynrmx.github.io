function riskColor(p) {
  if (p >= 0.75) return "var(--risk-critical)";
  if (p >= 0.50) return "var(--risk-high)";
  if (p >= 0.30) return "var(--risk-medium)";
  return "var(--risk-low)";
}

function RiskTable({ rows, selectedId, onSelect, currency, t }) {
  const [sort, setSort] = React.useState({ key: "prob", dir: "desc" });
  const [filter, setFilter] = React.useState("all");
  const [q, setQ] = React.useState("");

  const cur = { USD: "$", EUR: "€", GBP: "£", TRY: "₺" }[currency] || "$";

  const filtered = React.useMemo(() => {
    let out = rows;
    if (filter === "critical") out = out.filter((r) => r.prob >= 0.75);
    else if (filter === "high") out = out.filter((r) => r.prob >= 0.50 && r.prob < 0.75);
    else if (filter === "intervene") out = out.filter((r) => r.rec === "INTERVENE");
    else if (filter === "letchurn") out = out.filter((r) => r.rec === "LET_IT_CHURN");
    if (q) {
      const qq = q.toLowerCase();
      out = out.filter((r) => r.id.toLowerCase().includes(qq) || r.topFactor.toLowerCase().includes(qq) || r.segment.toLowerCase().includes(qq));
    }
    out = [...out].sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const va = a[sort.key], vb = b[sort.key];
      if (typeof va === "string") return va.localeCompare(vb) * dir;
      return (va - vb) * dir;
    });
    return out;
  }, [rows, filter, q, sort]);

  const counts = React.useMemo(() => ({
    all: rows.length,
    critical: rows.filter((r) => r.prob >= 0.75).length,
    high: rows.filter((r) => r.prob >= 0.50 && r.prob < 0.75).length,
    intervene: rows.filter((r) => r.rec === "INTERVENE").length,
    letchurn: rows.filter((r) => r.rec === "LET_IT_CHURN").length,
  }), [rows]);

  const toggleSort = (key) => {
    setSort((s) => s.key === key
      ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
      : { key, dir: "desc" });
  };
  const sortArrow = (key) => sort.key === key ? (sort.dir === "asc" ? "↑" : "↓") : "↕";

  return (
    <div className="card" style={{ minHeight: 0 }}>
      <div className="card-head">
        <div className="card-head-l">
          <span className="card-title">{t.table_title}</span>
          <span className="card-sub">· <span className="mono tnum">{filtered.length}</span> {t.table_of} <span className="mono tnum">{rows.length}</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="search" style={{ minWidth: 180, height: 28 }}>
            <I d={SVG.search} size={12} />
            <input
              placeholder={t.table_filter_ph}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={{ padding: "10px 18px", borderBottom: "1px solid var(--border-dim)", display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button className={`chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          {t.filter_all} <span className="count">{counts.all}</span>
        </button>
        <button className={`chip ${filter === "critical" ? "active" : ""}`} onClick={() => setFilter("critical")}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--risk-critical)" }} />
          {t.filter_critical} <span className="count">{counts.critical}</span>
        </button>
        <button className={`chip ${filter === "high" ? "active" : ""}`} onClick={() => setFilter("high")}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--risk-high)" }} />
          {t.filter_high} <span className="count">{counts.high}</span>
        </button>
        <div style={{ width: 1, background: "var(--border-dim)", margin: "0 4px" }} />
        <button className={`chip ${filter === "intervene" ? "active" : ""}`} onClick={() => setFilter("intervene")}>
          <I d={SVG.target} size={10} />
          {t.filter_intervene} <span className="count">{counts.intervene}</span>
        </button>
        <button className={`chip ${filter === "letchurn" ? "active" : ""}`} onClick={() => setFilter("letchurn")}>
          {t.filter_letchurn} <span className="count">{counts.letchurn}</span>
        </button>
      </div>

      <div className="cust-table">
        <table>
          <thead>
            <tr>
              <th onClick={() => toggleSort("id")}>{t.th_id} <span className="arrow">{sortArrow("id")}</span></th>
              <th onClick={() => toggleSort("segment")}>{t.th_segment} <span className="arrow">{sortArrow("segment")}</span></th>
              <th className="num" onClick={() => toggleSort("monthly")}>{t.th_monthly} <span className="arrow">{sortArrow("monthly")}</span></th>
              <th className="num" onClick={() => toggleSort("tenure")}>{t.th_tenure} <span className="arrow">{sortArrow("tenure")}</span></th>
              <th className="num" onClick={() => toggleSort("prob")}>{t.th_prob} <span className="arrow">{sortArrow("prob")}</span></th>
              <th>{t.th_shap}</th>
              <th className="num" onClick={() => toggleSort("netEV")}>{t.th_netev} <span className="arrow">{sortArrow("netEV")}</span></th>
              <th>{t.th_rec}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className={selectedId === r.id ? "selected" : ""} onClick={() => onSelect(r)}>
                <td>
                  <div className="cust-id">
                    <div className="cust-id-mark" style={{ background: riskColor(r.prob) }} />
                    {r.id}
                  </div>
                </td>
                <td style={{ color: "var(--text-secondary)", fontSize: 11 }}>{r.segment} · {r.region}</td>
                <td className="num">{cur}{r.monthly.toFixed(2)}</td>
                <td className="num" style={{ color: "var(--text-secondary)" }}>{r.tenure}<span style={{ fontSize: 10, marginLeft: 2 }}>{t.mo}</span></td>
                <td className="num">
                  <div className="prob-wrap">
                    <div className="prob-bar">
                      <div className="prob-bar-fill" style={{ width: `${r.prob * 100}%`, background: riskColor(r.prob) }} />
                    </div>
                    <span className="prob-val" style={{ color: riskColor(r.prob) }}>{(r.prob * 100).toFixed(1)}%</span>
                  </div>
                </td>
                <td>
                  <div className="shap-tag">
                    <div className="shap-bar">
                      <div className="shap-bar-fill" style={{ width: `${r.topFactorWeight * 100 * 2}%` }} />
                    </div>
                    <span>{r.topFactor}</span>
                  </div>
                </td>
                <td className="num" style={{ color: r.netEV > 0 ? "var(--risk-low)" : "var(--text-secondary)" }}>
                  {r.netEV >= 0 ? "+" : "−"}{cur}{Math.abs(r.netEV).toFixed(0)}
                </td>
                <td>
                  <span className={`rec ${r.rec === "INTERVENE" ? "intervene" : "churn"}`}>
                    <span className="rec-dot" />
                    {r.rec === "INTERVENE" ? t.rec_intervene : t.rec_churn}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.RiskTable = RiskTable;
window.riskColor = riskColor;
