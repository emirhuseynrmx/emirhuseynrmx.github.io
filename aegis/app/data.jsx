// Seeded RNG for stable fake data
const _rng = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
};

const RISK_FACTORS = [
  { k: "Contract: Month-to-month", ctx: "Contract = Month-to-month" },
  { k: "Tenure: 3 months", ctx: "tenure < 6 mo" },
  { k: "Payment: Electronic check", ctx: "PaymentMethod = Electronic" },
  { k: "No TechSupport", ctx: "TechSupport = No" },
  { k: "No OnlineSecurity", ctx: "OnlineSecurity = No" },
  { k: "High Monthly Charges", ctx: "MonthlyCharges > $90" },
  { k: "Fiber: DSL degradation", ctx: "InternetService = Fiber" },
  { k: "PaperlessBilling: Yes", ctx: "PaperlessBilling = Yes" },
];

const FIRST_DIGITS = "0123456789";
const HEX = "0123456789ABCDEF";

const makeId = (rand) => {
  let s = "";
  for (let i = 0; i < 4; i++) s += FIRST_DIGITS[Math.floor(rand() * 10)];
  s += "-";
  for (let i = 0; i < 5; i++) s += HEX[Math.floor(rand() * 16)];
  return s;
};

const CUSTOMERS = (() => {
  const rand = _rng(42);
  const out = [];
  for (let i = 0; i < 48; i++) {
    // Bias distribution: heavier right tail so we see plenty of high-risk
    let p = rand();
    p = Math.pow(p, 0.55); // pushes towards 1
    const prob = Math.min(0.98, Math.max(0.12, p));
    const monthly = 25 + Math.floor(rand() * 100);
    const tenure = Math.floor(rand() * 72) + 1;
    const ltv = Math.floor(monthly * Math.max(6, 60 - tenure) * (0.85 + rand() * 0.5));
    const factor = RISK_FACTORS[Math.floor(rand() * RISK_FACTORS.length)];
    const interventionCost = 30 + Math.floor(rand() * 90);
    const evSaved = Math.floor(ltv * prob * 0.62);
    const netEV = evSaved - interventionCost;
    const intervene = prob > 0.35 && netEV > 0;
    out.push({
      id: makeId(rand),
      contract: ["Month-to-month", "One year", "Two year"][Math.floor(rand() * 3)],
      monthly,
      tenure,
      prob,
      ltv,
      topFactor: factor.k,
      topCtx: factor.ctx,
      topFactorWeight: 0.28 + rand() * 0.18,
      rec: intervene ? "INTERVENE" : "LET_IT_CHURN",
      interventionCost,
      evSaved,
      netEV,
      segment: ["Residential", "SMB", "Enterprise"][Math.floor(rand() * 3)],
      region: ["NE", "SE", "MW", "W", "SW"][Math.floor(rand() * 5)],
    });
  }
  // Sort by probability desc by default
  return out.sort((a, b) => b.prob - a.prob);
})();

// SHAP for specific customer — deterministic by id
const shapFor = (id) => {
  const seed = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = _rng(seed);
  const features = [
    { feat: "Contract", ctx: "Month-to-month", sign: 1 },
    { feat: "tenure", ctx: "3 months", sign: 1 },
    { feat: "PaymentMethod", ctx: "Electronic check", sign: 1 },
    { feat: "MonthlyCharges", ctx: "$98.40", sign: 1 },
    { feat: "TechSupport", ctx: "No", sign: 1 },
    { feat: "OnlineSecurity", ctx: "No", sign: 1 },
    { feat: "InternetService", ctx: "Fiber optic", sign: 1 },
    { feat: "Partner", ctx: "Yes", sign: -1 },
    { feat: "Dependents", ctx: "Yes", sign: -1 },
    { feat: "PaperlessBilling", ctx: "No", sign: -1 },
  ];
  return features.map((f) => ({
    ...f,
    value: f.sign * (0.04 + rand() * 0.18),
  })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 8);
};

const diceFor = (cust) => {
  const rand = _rng(cust.id.charCodeAt(0) * 7 + 3);
  const base = cust.prob;
  const scenarios = [
    {
      title: "Contract lock-in + minor rebate",
      changes: [
        { feat: "Contract",        old: "Month-to-month", new: "One year" },
        { feat: "MonthlyCharges",  old: `$${cust.monthly}.00`, new: `$${(cust.monthly - 5).toFixed(2)}` },
      ],
      newProb: Math.max(0.08, base - 0.42 - rand() * 0.08),
      actionCost: 60 + Math.floor(rand() * 30),
    },
    {
      title: "Add TechSupport + OnlineSecurity",
      changes: [
        { feat: "TechSupport",    old: "No", new: "Yes" },
        { feat: "OnlineSecurity", old: "No", new: "Yes" },
      ],
      newProb: Math.max(0.11, base - 0.28 - rand() * 0.06),
      actionCost: 45 + Math.floor(rand() * 20),
    },
    {
      title: "Switch to auto-payment + 2yr",
      changes: [
        { feat: "PaymentMethod", old: "Electronic check", new: "Bank transfer (auto)" },
        { feat: "Contract",      old: "Month-to-month",   new: "Two year" },
      ],
      newProb: Math.max(0.06, base - 0.51 - rand() * 0.06),
      actionCost: 90 + Math.floor(rand() * 25),
    },
  ];
  return scenarios.map((s) => ({
    ...s,
    delta: base - s.newProb,
    netEV: Math.floor(cust.ltv * (base - s.newProb) * 0.62 - s.actionCost),
  }));
};

// Generate sparkline data
const sparkData = (seed, len = 24, trend = 0) => {
  const rand = _rng(seed);
  const arr = [];
  let v = 50;
  for (let i = 0; i < len; i++) {
    v += (rand() - 0.5) * 8 + trend;
    arr.push({ i, v });
  }
  return arr;
};

// Calibration curve: predicted vs observed
const calibrationData = () => {
  const rand = _rng(7);
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const x = i / 10;
    const noise = (rand() - 0.5) * 0.06;
    pts.push({ predicted: x, observed: Math.max(0, Math.min(1, x + noise)), ideal: x });
  }
  return pts;
};

// Latency data
const latencyData = () => {
  const rand = _rng(13);
  const arr = [];
  for (let i = 0; i < 60; i++) {
    const base = 42 + Math.sin(i / 8) * 6;
    const jitter = (rand() - 0.3) * 14;
    arr.push({ i, p50: Math.max(20, base + jitter * 0.3), p95: Math.max(30, base + 18 + jitter), p99: Math.max(40, base + 34 + jitter * 1.6) });
  }
  return arr;
};

// Event log
const EVENTS = [
  { ts: "18:42:07", kind: "ok",   tag: "celery",   msg: "Batch inference completed · 8,412 predictions" },
  { ts: "18:41:53", kind: "info", tag: "dice",     msg: "Counterfactuals generated for 7823-A12B" },
  { ts: "18:41:48", kind: "info", tag: "shap",     msg: "TreeExplainer cached for cohort NE-R-12" },
  { ts: "18:41:22", kind: "warn", tag: "mlflow",   msg: "Drift alert: tenure distribution shift · KS=0.08" },
  { ts: "18:40:55", kind: "ok",   tag: "litestar", msg: "/api/predict · 201 · 38ms · 142 req/s" },
  { ts: "18:40:41", kind: "info", tag: "redis",    msg: "Cache warmed · 2,341 SHAP contexts" },
  { ts: "18:40:12", kind: "ok",   tag: "duckdb",   msg: "Feature table synced · 341k rows" },
  { ts: "18:39:58", kind: "crit", tag: "worker-4", msg: "Task retry exceeded · CF-gen task requeued" },
  { ts: "18:39:33", kind: "info", tag: "xgb",      msg: "Model v2.4.1 · isotonic calibration applied" },
  { ts: "18:39:02", kind: "ok",   tag: "wacc",     msg: "EV optimization · 1,204 INTERVENE decisions" },
];

const SYSTEM_STATUS = [
  { name: "Litestar API",   status: "ok",   meta: "38ms p50" },
  { name: "Redis Cache",    status: "ok",   meta: "89% hit" },
  { name: "Celery Workers", status: "ok",   meta: "16/16" },
  { name: "DuckDB Warehouse", status: "warn", meta: "drift 0.08" },
  { name: "MLflow Registry",status: "ok",   meta: "v2.4.1" },
  { name: "XGBoost Model",  status: "ok",   meta: "0.87 AUC" },
];

window.AEGIS = {
  CUSTOMERS, shapFor, diceFor, sparkData,
  calibrationData, latencyData, EVENTS, SYSTEM_STATUS,
};
