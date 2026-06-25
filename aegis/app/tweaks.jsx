const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "comfortable",
  "accentHue": 220,
  "currency": "USD",
  "showEventLog": true,
  "lang": "EN",
  "theme": "dark"
}/*EDITMODE-END*/;

// ── i18n ───────────────────────────────────────────────────────────
const STRINGS = {
  EN: {
    // top bar
    breadcrumb_root: "Aegis",
    breadcrumb_section: "Retention",
    breadcrumb_current: "Executive & Operations",
    live_quarter: "LIVE · Q2 FY26",
    search_placeholder: "Search customer ID, cohort, experiment…",
    export: "Export",
    run_batch: "Demo Preview",
    // heading
    heading_title: "Retention Intelligence",
    heading_sub_a: "WACC-discounted EV optimization ·",
    heading_sub_b: "customers · model",
    meta_refreshed: "Refreshed",
    meta_window: "Data window",
    meta_run: "Run ID",
    // KPI
    kpi_active: "Active Customers",
    kpi_active_sub: "this month",
    kpi_atrisk: "At-Risk Cohort",
    kpi_atrisk_sub: "critical (p > 0.75)",
    kpi_revenue: "Retained Revenue · NPV",
    kpi_revenue_sub: "WACC",
    kpi_revenue_sub2: "· Σ EV over 24mo",
    kpi_system: "System Status",
    kpi_operational: "OPERATIONAL",
    // system names
    sys: {
      "Litestar API": "Litestar API",
      "Redis Cache": "Redis Cache",
      "Celery Workers": "Celery Workers",
      "DuckDB Warehouse": "DuckDB Warehouse",
      "MLflow Registry": "MLflow Registry",
      "XGBoost Model": "XGBoost Model",
    },
    // table
    table_title: "Customer Risk Cohort",
    table_of: "of",
    table_filter_ph: "Filter ID, factor, segment…",
    filter_all: "All",
    filter_critical: "Critical",
    filter_high: "High",
    filter_intervene: "Intervene",
    filter_letchurn: "Let it churn",
    th_id: "Customer ID",
    th_segment: "Segment",
    th_monthly: "Monthly",
    th_tenure: "Tenure",
    th_prob: "P(Churn)",
    th_shap: "Top SHAP Driver",
    th_netev: "Net EV",
    th_rec: "Recommendation",
    mo: "mo",
    rec_intervene: "INTERVENE",
    rec_churn: "LET IT CHURN",
    // audit
    audit_title: "System Audit",
    audit_sub: "· last 60 min",
    audit_latency: "Latency",
    audit_calibration: "Calibration",
    audit_p50: "p50 inference",
    audit_p95: "p95 inference",
    audit_throughput: "Throughput",
    audit_auc: "ROC-AUC",
    audit_brier: "Brier",
    audit_ece: "ECE",
    // events
    events_title: "Event Stream",
    events_live: "LIVE",
    events_rate: "142 ev/s",
    // deep dive
    dd_customer: "CUSTOMER",
    dd_deepdive: "Deep Dive",
    dd_pchurn: "P(Churn)",
    dd_monthly: "Monthly Bill",
    dd_tenure: "Tenure",
    dd_ltv: "LTV (NPV)",
    dd_shap_title: "SHAP · Local Attribution",
    dd_shap_sub: "TreeExplainer",
    dd_ev_title: "EV Decision",
    dd_ev_sub: "WACC-NPV",
    dd_cost: "Cost of Intervention",
    dd_cost_sub: "retention offer + CSR",
    dd_saved: "Expected LTV Saved",
    dd_saved_sub: "p·LTV·(1−d) · 24mo",
    dd_vs: "VS",
    dd_decision: "Decision",
    dd_netev: "Net EV",
    dd_dice_title: "DiCE · Counterfactual Actions",
    dd_dice_sub: "genetic · k=3",
    dd_action_cost: "Action cost:",
    dd_action_netev: "Net EV:",
    dd_copy: "Copy JSON",
    dd_flag: "Flag for review",
    dd_queue: "Queue retention offer",
    // nav titles
    nav_ops: "Operations",
    nav_cust: "Customers",
    nav_shap: "Explainability",
    nav_dice: "Counterfactuals",
    nav_ev: "EV Optimizer",
    nav_mlflow: "MLflow",
    nav_audit: "Audit",
    nav_alerts: "Alerts",
    nav_settings: "Settings",
    // tweaks
    tw_title: "Tweaks",
    tw_density: "Density",
    tw_density_compact: "compact",
    tw_density_comfortable: "comfortable",
    tw_density_spacious: "spacious",
    tw_currency: "Currency",
    tw_accent: "Accent hue",
    tw_events: "Event log",
    tw_show: "Show",
    tw_hide: "Hide",
    tw_lang: "Language",
    tw_theme: "Theme",
    tw_theme_dark: "Dark",
    tw_theme_light: "Light",
  },
  TR: {
    breadcrumb_root: "Aegis",
    breadcrumb_section: "Elde Tutma",
    breadcrumb_current: "Yönetici & Operasyon",
    live_quarter: "CANLI · 2Ç FY26",
    search_placeholder: "Müşteri ID, kohort, deney ara…",
    export: "Dışa Aktar",
    run_batch: "Müdahale partisini çalıştır",
    heading_title: "Elde Tutma Zekâsı",
    heading_sub_a: "WACC-iskontolu BD optimizasyonu ·",
    heading_sub_b: "müşteri · model",
    meta_refreshed: "Güncellenme",
    meta_window: "Veri Penceresi",
    meta_run: "Çalışma ID",
    kpi_active: "Aktif Müşteriler",
    kpi_active_sub: "bu ay",
    kpi_atrisk: "Risk Altındaki Kohort",
    kpi_atrisk_sub: "kritik (p > 0.75)",
    kpi_revenue: "Korunan Gelir · NBD",
    kpi_revenue_sub: "WACC",
    kpi_revenue_sub2: "· Σ BD 24 ay",
    kpi_system: "Sistem Durumu",
    kpi_operational: "ÇALIŞIYOR",
    sys: {
      "Litestar API": "Litestar API",
      "Redis Cache": "Redis Önbellek",
      "Celery Workers": "Celery İşçileri",
      "DuckDB Warehouse": "DuckDB Ambar",
      "MLflow Registry": "MLflow Kayıt",
      "XGBoost Model": "XGBoost Model",
    },
    table_title: "Müşteri Risk Kohortu",
    table_of: "/",
    table_filter_ph: "ID, faktör, segment filtrele…",
    filter_all: "Tümü",
    filter_critical: "Kritik",
    filter_high: "Yüksek",
    filter_intervene: "Müdahale",
    filter_letchurn: "Bırak",
    th_id: "Müşteri ID",
    th_segment: "Segment",
    th_monthly: "Aylık",
    th_tenure: "Süre",
    th_prob: "P(Churn)",
    th_shap: "Ana SHAP Etkeni",
    th_netev: "Net BD",
    th_rec: "Öneri",
    mo: "ay",
    rec_intervene: "MÜDAHALE ET",
    rec_churn: "BIRAK",
    audit_title: "Sistem Denetimi",
    audit_sub: "· son 60 dk",
    audit_latency: "Gecikme",
    audit_calibration: "Kalibrasyon",
    audit_p50: "p50 çıkarım",
    audit_p95: "p95 çıkarım",
    audit_throughput: "Hız",
    audit_auc: "ROC-AUC",
    audit_brier: "Brier",
    audit_ece: "ECE",
    events_title: "Olay Akışı",
    events_live: "CANLI",
    events_rate: "142 ol/sn",
    dd_customer: "MÜŞTERİ",
    dd_deepdive: "Derin İnceleme",
    dd_pchurn: "P(Churn)",
    dd_monthly: "Aylık Fatura",
    dd_tenure: "Üyelik Süresi",
    dd_ltv: "YDM (NBD)",
    dd_shap_title: "SHAP · Yerel Katkı",
    dd_shap_sub: "TreeExplainer",
    dd_ev_title: "BD Kararı",
    dd_ev_sub: "WACC-NBD",
    dd_cost: "Müdahale Maliyeti",
    dd_cost_sub: "tutundurma teklifi + MH",
    dd_saved: "Beklenen Korunan YDM",
    dd_saved_sub: "p·YDM·(1−d) · 24ay",
    dd_vs: "KARŞI",
    dd_decision: "Karar",
    dd_netev: "Net BD",
    dd_dice_title: "DiCE · Kontrafaktüel Aksiyonlar",
    dd_dice_sub: "genetik · k=3",
    dd_action_cost: "Aksiyon maliyeti:",
    dd_action_netev: "Net BD:",
    dd_copy: "JSON Kopyala",
    dd_flag: "İnceleme için işaretle",
    dd_queue: "Tutundurma teklifi gönder",
    nav_ops: "Operasyonlar",
    nav_cust: "Müşteriler",
    nav_shap: "Açıklanabilirlik",
    nav_dice: "Kontrafaktüeller",
    nav_ev: "BD Optimizatörü",
    nav_mlflow: "MLflow",
    nav_audit: "Denetim",
    nav_alerts: "Uyarılar",
    nav_settings: "Ayarlar",
    tw_title: "Ayarlar",
    tw_density: "Yoğunluk",
    tw_density_compact: "sıkı",
    tw_density_comfortable: "normal",
    tw_density_spacious: "geniş",
    tw_currency: "Para Birimi",
    tw_accent: "Vurgu tonu",
    tw_events: "Olay kaydı",
    tw_show: "Göster",
    tw_hide: "Gizle",
    tw_lang: "Dil",
    tw_theme: "Tema",
    tw_theme_dark: "Koyu",
    tw_theme_light: "Açık",
  },
};

function TweaksPanel({ tweaks, setTweaks, onClose, t }) {
  const update = (k, v) => {
    const next = { ...tweaks, [k]: v };
    setTweaks(next);
    window.parent?.postMessage({ type: "__edit_mode_set_keys", edits: { [k]: v } }, "*");
  };

  return (
    <div className="tweaks-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="tweaks-title">{t.tw_title}</div>
        <button className="close-btn" style={{ width: 22, height: 22 }} onClick={onClose}>
          <I d={SVG.close} size={11} />
        </button>
      </div>

      <div className="tweak-row">
        <label>{t.tw_lang}</label>
        <div className="tweak-seg">
          {["EN", "TR"].map((l) => (
            <button key={l} className={tweaks.lang === l ? "active" : ""} onClick={() => update("lang", l)}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="tweak-row">
        <label>{t.tw_theme}</label>
        <div className="tweak-seg">
          <button className={tweaks.theme === "dark" ? "active" : ""} onClick={() => update("theme", "dark")}>
            {t.tw_theme_dark}
          </button>
          <button className={tweaks.theme === "light" ? "active" : ""} onClick={() => update("theme", "light")}>
            {t.tw_theme_light}
          </button>
        </div>
      </div>

      <div className="tweak-row">
        <label>{t.tw_density}</label>
        <div className="tweak-seg">
          {[
            ["compact", t.tw_density_compact],
            ["comfortable", t.tw_density_comfortable],
            ["spacious", t.tw_density_spacious],
          ].map(([d, lbl]) => (
            <button key={d} className={tweaks.density === d ? "active" : ""} onClick={() => update("density", d)}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="tweak-row">
        <label>{t.tw_currency}</label>
        <div className="tweak-seg">
          {["USD", "EUR", "GBP", "TRY"].map((c) => (
            <button key={c} className={tweaks.currency === c ? "active" : ""} onClick={() => update("currency", c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="tweak-row">
        <label>
          {t.tw_accent}
          <span className="v">{tweaks.accentHue}°</span>
        </label>
        <input
          type="range"
          min="0" max="360" step="1"
          value={tweaks.accentHue}
          onChange={(e) => update("accentHue", parseInt(e.target.value))}
        />
      </div>

      <div className="tweak-row">
        <label>{t.tw_events}</label>
        <div className="tweak-seg">
          <button className={tweaks.showEventLog ? "active" : ""} onClick={() => update("showEventLog", true)}>{t.tw_show}</button>
          <button className={!tweaks.showEventLog ? "active" : ""} onClick={() => update("showEventLog", false)}>{t.tw_hide}</button>
        </div>
      </div>
    </div>
  );
}

window.TweaksPanel = TweaksPanel;
window.TWEAK_DEFAULTS = TWEAK_DEFAULTS;
window.STRINGS = STRINGS;
