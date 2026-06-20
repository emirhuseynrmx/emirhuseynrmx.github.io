function DeepDive({ customer, onClose, currency, t }) {
  const cur = { USD: "$", EUR: "€", GBP: "£", TRY: "₺" }[currency] || "$";
  const shap = React.useMemo(() => customer ? AEGIS.shapFor(customer.id) : [], [customer]);
  const scenarios = React.useMemo(() => customer ? AEGIS.diceFor(customer) : [], [customer]);

  const open = !!customer;
  const maxAbs = Math.max(0.001, ...shap.map(s => Math.abs(s.value)));
  const baseVal = 0.48;
  const finalVal = baseVal + shap.reduce((a, s) => a + s.value, 0);

  // ESC to close
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  return (
    <>
      <div className={`drawer-backdrop ${open ? "open" : ""}`} onClick={onClose} />
      <aside className={`drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        {customer && (
          <>
            <div className="drawer-head">
              <div className="drawer-head-l">
                <span className="drawer-head-id">
                  {t.dd_customer} · {customer.segment.toUpperCase()} · {customer.region}
                </span>
                <span className="drawer-head-title">
                  <span className="mono" style={{ color: riskColor(customer.prob) }}>{customer.id}</span>
                  <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>/</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 400 }}>{t.dd_deepdive}</span>
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="close-btn" title="Copy link">
                  <I d={SVG.copy} size={14} />
                </button>
                <button className="close-btn" title="Open full page">
                  <I d={SVG.external} size={14} />
                </button>
                <button className="close-btn" onClick={onClose} title="Close (Esc)">
                  <I d={SVG.close} size={14} />
                </button>
              </div>
            </div>

            <div className="drawer-body stagger">
              {/* Summary strip */}
              <div className="summary-strip">
                <div className="summary-cell">
                  <div className="summary-k">{t.dd_pchurn}</div>
                  <div className="summary-v" style={{ color: riskColor(customer.prob) }}>
                    {(customer.prob * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="summary-cell">
                  <div className="summary-k">{t.dd_monthly}</div>
                  <div className="summary-v">{cur}{customer.monthly.toFixed(2)}</div>
                </div>
                <div className="summary-cell">
                  <div className="summary-k">{t.dd_tenure}</div>
                  <div className="summary-v">{customer.tenure}<span style={{ color: "var(--text-secondary)", fontSize: 12, marginLeft: 2 }}>{t.mo}</span></div>
                </div>
                <div className="summary-cell">
                  <div className="summary-k">{t.dd_ltv}</div>
                  <div className="summary-v">{cur}{customer.ltv.toLocaleString()}</div>
                </div>
              </div>

              <div className="two-col">
                {/* SHAP waterfall */}
                <div className="card">
                  <div className="card-head">
                    <div className="card-head-l">
                      <I d={SVG.layers} size={14} />
                      <span className="card-title">{t.dd_shap_title}</span>
                    </div>
                    <span className="card-sub mono">{t.dd_shap_sub}</span>
                  </div>

                  <div className="shap-waterfall">
                    {shap.map((s) => {
                      const pct = Math.abs(s.value) / maxAbs * 48; // half-width max
                      const isPos = s.value > 0;
                      return (
                        <div className="shap-row" key={s.feat}>
                          <div>
                            <div className="feat">{s.feat}</div>
                            <div className="feat-ctx">= {s.ctx}</div>
                          </div>
                          <div className="shap-track">
                            <div
                              className={`shap-fill ${isPos ? "pos" : "neg"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className={`val ${isPos ? "pos" : "neg"}`}>
                            {isPos ? "+" : ""}{(s.value * 100).toFixed(1)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="shap-base">
                    <span>
                      <span className="mono" style={{ color: "var(--text-label)" }}>E[f(x)]</span> = <span className="value">{(baseVal * 100).toFixed(1)}%</span>
                      <span style={{ margin: "0 8px", color: "var(--text-tertiary)" }}>→</span>
                      <span className="mono" style={{ color: "var(--text-label)" }}>f(x)</span> = <span className="value" style={{ color: riskColor(finalVal) }}>{(finalVal * 100).toFixed(1)}%</span>
                    </span>
                    <span className="mono" style={{ color: "var(--text-tertiary)", fontSize: 10 }}>
                      Σ φ = {(shap.reduce((a,s) => a+s.value, 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* EV decision */}
                <div className="card">
                  <div className="card-head">
                    <div className="card-head-l">
                      <I d={SVG.calc} size={14} />
                      <span className="card-title">{t.dd_ev_title}</span>
                    </div>
                    <span className="card-sub mono">{t.dd_ev_sub}</span>
                  </div>

                  <div className="ev-block">
                    <div className="ev-grid">
                      <div className="ev-side cost">
                        <div className="ev-side-k">{t.dd_cost}</div>
                        <div className="ev-side-v tnum">−{cur}{customer.interventionCost}</div>
                        <div className="ev-side-sub">{t.dd_cost_sub}</div>
                      </div>
                      <div className="ev-vs">{t.dd_vs}</div>
                      <div className="ev-side saved">
                        <div className="ev-side-k">{t.dd_saved}</div>
                        <div className="ev-side-v tnum">+{cur}{customer.evSaved.toLocaleString()}</div>
                        <div className="ev-side-sub">{t.dd_saved_sub}</div>
                      </div>
                    </div>

                    <div className={`ev-result ${customer.rec === "INTERVENE" ? "" : "churn"}`}>
                      <div className="ev-result-l">
                        <div className="ev-result-k">{t.dd_decision}</div>
                        <div className="ev-result-v">
                          {customer.rec === "INTERVENE" ? `▶ ${t.rec_intervene}` : `— ${t.rec_churn}`}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <div className="ev-result-k">{t.dd_netev}</div>
                        <div className="ev-result-ev tnum">
                          {customer.netEV >= 0 ? "+" : "−"}{cur}{Math.abs(customer.netEV).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="ev-formula">
                      <div>
                        <span className="k">NetEV</span> = <span className="v">p_churn</span> · <span className="v">LTV_npv</span> · <span className="v">P(retain | action)</span> − <span className="v">C_action</span>
                      </div>
                      <div>
                        = <span className="v tnum">{customer.prob.toFixed(3)}</span> · <span className="v tnum">{cur}{customer.ltv.toLocaleString()}</span> · <span className="v tnum">0.62</span> − <span className="v tnum">{cur}{customer.interventionCost}</span>
                      </div>
                      <div>
                        = <span className="v tnum" style={{ color: customer.netEV > 0 ? "var(--risk-low)" : "var(--risk-critical)" }}>
                          {customer.netEV >= 0 ? "+" : "−"}{cur}{Math.abs(customer.netEV).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DiCE scenarios */}
              <div className="card">
                <div className="card-head">
                  <div className="card-head-l">
                    <I d={SVG.brain} size={14} />
                    <span className="card-title">{t.dd_dice_title}</span>
                  </div>
                  <span className="card-sub mono">{t.dd_dice_sub}</span>
                </div>

                <div className="dice-list">
                  {scenarios.map((s, i) => (
                    <div className="dice-card" key={i}>
                      <div className="dice-head">
                        <div className="dice-rank">
                          <div className="dice-rank-num">{i + 1}</div>
                          <span className="dice-title">{s.title}</span>
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <span className="dice-arrow">
                            <span className="from tnum">{(customer.prob * 100).toFixed(0)}%</span>
                            <I d={SVG.chevRight} size={10} />
                            <span className="to tnum">{(s.newProb * 100).toFixed(0)}%</span>
                          </span>
                          <span className="dice-drop">
                            <I d={SVG.arrowDown} size={10} />
                            −{(s.delta * 100).toFixed(0)}pts
                          </span>
                        </div>
                      </div>
                      <div className="dice-changes">
                        {s.changes.map((c, j) => (
                          <div className="dice-change" key={j}>
                            <span className="feat">{c.feat}</span>
                            <span className="old">{c.old}</span>
                            <span className="sep">→</span>
                            <span className="new">{c.new}</span>
                          </div>
                        ))}
                      </div>
                      <div className="dice-foot">
                        <span className="dice-cost">{t.dd_action_cost} <span className="tnum">{cur}{s.actionCost}</span></span>
                        <span className="dice-ev">{t.dd_action_netev} <span className="tnum">+{cur}{s.netEV.toLocaleString()}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="action-row">
              <button className="action-btn">
                <I d={SVG.copy} size={13} /> {t.dd_copy}
              </button>
              <button className="action-btn">
                <I d={SVG.flag} size={13} /> {t.dd_flag}
              </button>
              <button className="action-btn primary">
                <I d={SVG.send} size={13} /> {t.dd_queue}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

window.DeepDive = DeepDive;
