// Inline lucide icon wrapper. Lucide exposes `lucide.createIcons()` + icon data
// via `lucide.icons.X`. We emit inline SVGs to avoid the DOM post-render pass.
const Icon = ({ name, size = 14, stroke = "currentColor", strokeWidth = 1.75, style }) => {
  const src = window.lucide && (lucide.icons?.[name] || lucide[name]);
  if (!src) {
    return <span className="mono" style={{ fontSize: size * 0.7, opacity: 0.5 }}>◻</span>;
  }
  // lucide umd gives us an array-based node shape OR a ready SVG string
  // For @0.451 umd it's usually: [tag, attrs, children[]]
  const render = (node, i) => {
    if (typeof node === "string") return node;
    if (!Array.isArray(node)) return null;
    const [tag, attrs, children] = node;
    return React.createElement(tag, { key: i, ...attrs }, Array.isArray(children) ? children.map(render) : null);
  };
  // Some lucide umd builds expose `.toSvg()` or a plain node list.
  if (Array.isArray(src)) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
      >
        {src.map(render)}
      </svg>
    );
  }
  return null;
};

// Hard-coded inline SVGs — safer than depending on lucide's umd shape.
const SVG = {
  shield: "M12 2L4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  flame: "M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-3-1 1-3 3-3 6a6 6 0 0 0 12 0c0-5-6-11-6-11z",
  dollar: "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  arrowUp: "M12 19V5 M5 12l7-7 7 7",
  arrowDown: "M12 5v14 M19 12l-7 7-7-7",
  minus: "M5 12h14",
  close: "M18 6 6 18 M6 6l12 12",
  external: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14 21 3",
  check: "M20 6 9 17l-5-5",
  chevRight: "m9 18 6-6-6-6",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  zap: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  cpu: "M4 4h16v16H4z M9 1v3 M15 1v3 M9 20v3 M15 20v3 M20 9h3 M20 15h3 M1 9h3 M1 15h3",
  database: "M12 2c4 0 8 1.5 8 3.5S16 9 12 9 4 7.5 4 5.5 8 2 12 2z M4 5.5v13c0 2 4 3.5 8 3.5s8-1.5 8-3.5v-13 M4 12c0 2 4 3.5 8 3.5s8-1.5 8-3.5",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  brain: "M9.5 2a2.5 2.5 0 0 1 2.5 2.5V20a2.5 2.5 0 0 1-5 0v-1a2 2 0 0 1-3-3 2 2 0 0 1-1-3 2 2 0 0 1 1-3 2 2 0 0 1 1-4 2.5 2.5 0 0 1 4.5-.5z M14.5 2a2.5 2.5 0 0 0-2.5 2.5V20a2.5 2.5 0 0 0 5 0v-1a2 2 0 0 0 3-3 2 2 0 0 0 1-3 2 2 0 0 0-1-3 2 2 0 0 0-1-4 2.5 2.5 0 0 0-4.5-.5z",
  git: "M18 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M6 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M6 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M6 9v3 M18 9a9 9 0 0 1-12 9",
  trend: "M22 7 13.5 15.5 8.5 10.5 2 17 M16 7h6v6",
  sliders: "M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6",
  play: "M6 3v18l15-9z",
  calc: "M4 2h16v20H4z M8 6h8 M8 11h2 M12 11h2 M16 11h0 M8 15h2 M12 15h2 M16 15h2 M8 19h2 M12 19h2 M16 19h2",
  layers: "M12 2 2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5",
  copy: "M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  lock: "M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4",
  flag: "M4 22V4 M4 4c6-4 10 4 16 0v12c-6 4-10-4-16 0",
  x: "M18 6 6 18 M6 6l12 12",
  send: "m22 2-7 20-4-9-9-4z M22 2 11 13",
  alert: "M12 9v4 M12 17h.01 M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  sparkle: "m12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5L12 3z M19 14l-.7 2.1L16 17l2.3.9L19 20l.7-2.1L22 17l-2.3-.9L19 14z M5 14l-.7 2.1L2 17l2.3.9L5 20l.7-2.1L8 17l-2.3-.9L5 14z",
};

const I = ({ d, size = 14, stroke = "currentColor", strokeWidth = 1.6, style, fill = "none" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    {d.split(" M").map((seg, i) => (
      <path key={i} d={(i === 0 ? seg : "M" + seg)} />
    ))}
  </svg>
);

Object.assign(window, { Icon, SVG, I });
