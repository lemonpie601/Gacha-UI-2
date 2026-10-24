/* Gacha UI Style v1.8.0 — personal extension for Gacha Forge 1.8.13 on Marinara Engine.
 * Adds "말랑 · 트릭컬풍" to Settings → 화면 → UI 스타일, next to the game's own five, and while it is on:
 *  - its colours: five presets or eight picked colours (the game's theme tokens are derived from them),
 *  - its shapes: thick outlines, buttons that press down, ribbon name tags, polka-dot ground,
 *  - story: an opaque rounded dialogue box, portraits framed as stickers, SD (chibi) standing sprites,
 *  - battle: SD sprites standing on the unit cards, hopping when they act and squashing when hit,
 *  - a loading screen in the Trickcal Revive manner (bouncing SD, tip bubble, a capsule bar an SD runs along),
 *  - an "SD 캐릭터 만들기" panel that draws transparent-background chibis of the world's characters through
 *    the engine's own image connections and keeps them in the gallery.
 * The game draws every screen from theme tokens on .gf-arena, so the look is an adopted stylesheet keyed on
 * attributes of the game's host element: it survives the game rewriting its shadow root on every render and
 * never touches the world's saved HUD style. Picking any of the game's styles turns it off again.
 * Kept: on/off per browser (localStorage); colours, options and SD sprites in this extension's server storage,
 * so every device sees the same. */
(() => {
  "use strict";
  const KEY = "__GF_UI_STYLE_EXTENSION";
  if (typeof window[KEY] === "function") {
    try { window[KEY](); } catch {}
  }

  const HOST_TAG = "marinara-capability-gacha-forge";
  const ATTR = "data-gfx-style";
  const STORE = "gfx-ui-style";
  const CACHE = "gfx-ui-style-cache";
  // Given by Marinara's full-page wrapper; without it (pasted by hand) server storage is skipped.
  const EXT_ID = typeof extension !== "undefined" && extension && extension.id ? String(extension.id) : "";
  const FONT_FAMILIES = ["Jua", "Gowun Dodum"];
  const STYLES = [["trickcal", "말랑", "트릭컬풍 · 색은 직접 고르기"]];

  /* ═════════════ Settings model ═════════════ */
  const COLOR_FIELDS = [
    ["ink", "바탕"], ["card", "카드"], ["text", "글자"], ["line", "외곽선"],
    ["accent", "강조 버튼"], ["pick", "선택 표시"], ["sky1", "배경 1"], ["sky2", "배경 2"],
  ];
  const PRESETS = [
    ["cream", "크림 코코아", { ink: "#FFF4D9", card: "#FFFDF5", text: "#5A3A24", line: "#6B4528", accent: "#F0763A", pick: "#FFE17A", sky1: "#FFE08A", sky2: "#BDE9DA" }],
    ["berry", "딸기 우유", { ink: "#FFEFF3", card: "#FFFBFC", text: "#6A2E45", line: "#7A3550", accent: "#F2557F", pick: "#FFD3E0", sky1: "#FFC9DA", sky2: "#FFF1C9" }],
    ["mint", "민트 초코", { ink: "#EAF8F1", card: "#FBFFFD", text: "#2F4A3E", line: "#3B5A4B", accent: "#2FA97C", pick: "#C4F2DC", sky1: "#BDEFD9", sky2: "#FFE9B8" }],
    ["lavender", "라벤더", { ink: "#F2EEFF", card: "#FDFCFF", text: "#45386E", line: "#4F3F85", accent: "#8C6CF0", pick: "#E1D6FF", sky1: "#D9CCFF", sky2: "#CDEBFF" }],
    ["night", "밤하늘", { ink: "#2B2F4A", card: "#383D60", text: "#FFF1D6", line: "#14162A", accent: "#FFB347", pick: "#FFD166", sky1: "#3B3F6B", sky2: "#5B3F6E" }],
  ];
  const DEFAULT_COLORS = PRESETS[0][2];
  const OPTION_FIELDS = [
    ["box", "불투명 대화창", "스토리 대화창을 둥근 크림 상자로 바꿉니다. 끄면 대화창은 원래(다른 확장의 투명도 포함)대로입니다."],
    ["sticker", "스티커 초상", "스토리 초상화에 흰 테두리와 외곽선을 둘러 스티커처럼 보이게 합니다."],
    ["motion", "말랑 움직임", "초상과 SD 캐릭터가 숨 쉬듯 움직이고, 등장할 때 통 튀어나옵니다."],
    ["storySd", "스토리에 SD", "SD 캐릭터를 만든 인물은 스토리에서 초상 대신 SD 스탠딩으로 나옵니다."],
    ["battleSd", "전투에 SD", "SD 캐릭터를 만든 인물은 전투 카드 위에 SD로 서 있습니다."],
    ["loading", "로딩 화면", "불러오는 동안 SD 캐릭터와 팁이 나오는 로딩 화면을 띄웁니다."],
  ];
  // Whole-screen makeovers in the Trickcal Revive manner, each its own switch.
  const SCREEN_FIELDS = [
    ["field", "전투 필드", "카드 대신 아군은 왼쪽, 적은 오른쪽 땅 위에 서서 싸웁니다. 행동 버튼은 아래 한 줄로 모입니다. 끄면 원래 카드 전투입니다."],
    ["team", "편성 · 출격 캐릭터", "편성 칸과 전투 시작 화면에 팀 캐릭터가 둥실 떠 있습니다."],
    ["lobby", "홈 로비", "홈 배경 위에 캐릭터들이 서서 돌아다닙니다. 누르면 말을 겁니다. 아래 목록에서 누구를 둘지 고르고, 홈의 [배치] 버튼으로 옮깁니다."],
    ["hidePlate", "홈 대표 카드 숨기기", "홈 왼쪽의 대표 캐릭터 카드를 숨겨 로비를 넓게 씁니다."],
    ["attend", "출석 이벤트", "7일 출석판을 도장 찍는 출석부로 바꾸고, 캐릭터가 옆에서 반겨 줍니다."],
    ["autoScroll", "스토리 자동 스크롤", "챕터 목록과 챕터 지도를 열면 지금 할 차례(계속 · 플레이)로 바로 내려갑니다."],
  ];
  const DEFAULT_OPTS = { box: true, sticker: true, motion: true, storySd: true, battleSd: true, loading: true,
    field: true, team: true, lobby: true, hidePlate: true, attend: true, autoScroll: true };
  const LOBBY_LINES = ["반가워!", "오늘도 힘내자~", "말랑말랑…", "간식 없어?", "같이 모험 가자!", "쿨쿨…", "볼 꼬집지 마!", "어디 가?", "히히, 들켰다!", "출석 도장 찍었어?"];
  const OLD_GEN_TEMPLATE = "5::chibi, chibi only::, solo, Transparent background, full body, standing, looking at viewer, {appearance}";
  const DEFAULT_GEN = {
    connectionId: "",
    template: "4::chibi, chibi only::, solo, Transparent background, 1.2::full body::, shoes, standing, looking at viewer, {appearance}",
    negative: "multiple views, text, watermark, scenery, background",
    size: "832x1216",
  };
  const SIZES = [["832x1216", "세로 832×1216"], ["1024x1024", "정사각 1024"]];
  const TIPS = [
    "스토리 “다시 읽기”는 활력을 쓰지 않아요.",
    "설정 → 화면에서 말랑 스타일의 색을 마음대로 바꿀 수 있어요.",
    "SD 캐릭터는 설정 → 화면 → SD 캐릭터 만들기에서 뽑을 수 있어요.",
    "로딩 중인 캐릭터를 눌러 보세요. 말랑해요.",
    "편성할 때 속성 상성을 맞추면 전투가 훨씬 쉬워져요.",
    "활력은 시간이 지나면 다시 차올라요.",
    "대화 기록 버튼으로 지나간 대사를 다시 볼 수 있어요.",
    "투명 배경 SD는 스토리와 전투에서 스티커처럼 서 있어요.",
  ];

  const life = new AbortController();
  const on = (target, type, fn, opts = {}) => target.addEventListener(type, fn, { ...opts, signal: life.signal });
  let disposed = false;

  function readStyle() {
    try { const v = localStorage.getItem(STORE); return STYLES.some(([id]) => id === v) ? v : ""; }
    catch { return ""; }
  }
  function writeStyle(v) {
    try { if (v) localStorage.setItem(STORE, v); else localStorage.removeItem(STORE); } catch {}
  }
  let current = readStyle();

  // prefs: { colors, preset, opts, gen } — mirrored in localStorage so the first paint already has them.
  const cleanColor = (v, d) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : d);
  function normalizePrefs(p) {
    p = p && typeof p === "object" ? p : {};
    const colors = {};
    for (const [k] of COLOR_FIELDS) colors[k] = cleanColor(p.colors && p.colors[k], DEFAULT_COLORS[k]);
    const opts = {};
    for (const [k] of [...OPTION_FIELDS, ...SCREEN_FIELDS]) opts[k] = p.opts && typeof p.opts[k] === "boolean" ? p.opts[k] : DEFAULT_OPTS[k];
    // home: { runId: { name: { on, x, y, s } } } — x/y are the feet in % of the home screen, s a scale.
    const home = {};
    const num = (v, lo, hi, d) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
    for (const [run, cast] of Object.entries(p.home && typeof p.home === "object" ? p.home : {})) {
      if (!cast || typeof cast !== "object") continue;
      home[run] = {};
      for (const [name, e] of Object.entries(cast)) {
        if (!e || typeof e !== "object") continue;
        home[run][name] = { on: e.on !== false, x: num(e.x, 0, 100, NaN), y: num(e.y, 0, 100, NaN), s: num(e.s, 0.4, 2.5, 1) };
      }
    }
    const homeScene = {};
    for (const [run, raw] of Object.entries(p.homeScene && typeof p.homeScene === "object" ? p.homeScene : {})) {
      if (!raw || typeof raw !== "object") continue;
      const backY = num(raw.backY, 42, 92, 66);
      const frontY = num(raw.frontY, backY + 8, 110, 106);
      const backL = num(raw.backL, 0, 94, 22), backR = num(raw.backR, backL + 6, 100, 78);
      const frontL = num(raw.frontL, 0, 94, 3), frontR = num(raw.frontR, frontL + 6, 100, 97);
      homeScene[run] = {
        vpX: num(raw.vpX, 0, 100, 50), vpY: num(raw.vpY, 0, Math.max(0, backY - 4), 42),
        backL, backR, backY, frontL, frontR, frontY,
      };
    }
    const g = p.gen && typeof p.gen === "object" ? p.gen : {};
    const gen = {
      connectionId: typeof g.connectionId === "string" ? g.connectionId : "",
      template: typeof g.template === "string" && g.template.trim() && g.template !== OLD_GEN_TEMPLATE ? g.template : DEFAULT_GEN.template,
      negative: typeof g.negative === "string" ? g.negative : DEFAULT_GEN.negative,
      size: SIZES.some(([s]) => s === g.size) ? g.size : DEFAULT_GEN.size,
    };
    const lobbyScale = typeof p.lobbyScale === "number" && Number.isFinite(p.lobbyScale) ? Math.min(2, Math.max(0.5, p.lobbyScale)) : 1;
    return { colors, preset: typeof p.preset === "string" ? p.preset : "", opts, gen, home, homeScene, lobbyScale };
  }
  let prefs = normalizePrefs((() => { try { return JSON.parse(localStorage.getItem(CACHE) || "null"); } catch { return null; } })());

  /* ═════════════ Server storage (this extension's own) ═════════════ */
  const storeUrl = EXT_ID ? "/api/personal-extensions/" + encodeURIComponent(EXT_ID) + "/storage" : "";
  async function storeGet() {
    if (!storeUrl) return {};
    try {
      const res = await fetch(storeUrl, { credentials: "same-origin" });
      const data = res.ok ? await res.json() : null;
      return data && data.value && typeof data.value === "object" ? data.value : {};
    } catch { return {}; }
  }
  /* Marinara rejects a write from a browser that is not on 127.0.0.1 (another device, Tailscale, a proxy)
   * unless it carries this header — its own pages send it on every write. Without it every SD and setting
   * this extension saved from such a device was refused, though the pictures had reached the gallery. */
  const CSRF = { "x-marinara-csrf": "1" };
  const JSON_HEADERS = { "Content-Type": "application/json", ...CSRF };
  // A write that still fails is kept in this browser and sent again, so it is never lost.
  const PENDING = "gfx-ui-style-pending";
  let lastStoreError = "";
  const readPending = () => { try { const v = JSON.parse(localStorage.getItem(PENDING) || "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; } };
  let storeQueue = Promise.resolve();
  function pendingMatches(sent) {
    try { return JSON.stringify(readPending()) === JSON.stringify(sent); } catch { return false; }
  }
  async function sendStorePatch(patch) {
    const all = { ...readPending(), ...patch };
    try { localStorage.setItem(PENDING, JSON.stringify(all)); } catch {}
    if (storeUrl) {
      try {
        const res = await fetch(storeUrl, { method: "PATCH", credentials: "same-origin", headers: JSON_HEADERS, body: JSON.stringify(all) });
        if (res.ok) {
          if (pendingMatches(all)) try { localStorage.removeItem(PENDING); } catch {}
          lastStoreError = "";
          return true;
        }
        lastStoreError = "HTTP " + res.status + " " + ((await res.json().catch(() => null))?.error || "");
      } catch (e) { lastStoreError = e.message; }
    } else lastStoreError = "확장 ID 없음";
    return false;
  }
  function storePatch(patch) {
    const job = () => sendStorePatch(patch);
    storeQueue = storeQueue.then(job, job);
    return storeQueue;
  }
  const retryTimer = setInterval(() => { if (!disposed && Object.keys(readPending()).length) storePatch({}); }, 15000);
  let saveTimer = 0;
  function savePrefs() {
    try { localStorage.setItem(CACHE, JSON.stringify(prefs)); } catch {}
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => storePatch({ prefs }), 500);
  }

  /* ═════════════ The style ═════════════
   * :host([data-gfx-style=…]) .gf-arena is (0,3,0), above the game's .gf-arena[data-style=…] (0,2,0) whatever the
   * base style is, so every token of the base is replaced, not mixed. Options are further host attributes. */
  const H = (extra = "") => ':host([' + ATTR + '="trickcal"]' + extra + ")";
  const T = H();
  const LB = H("[data-gfx-lobby]"), F = H("[data-gfx-field]"), TM = H("[data-gfx-team]"), HP = H("[data-gfx-hideplate]"), AT = H("[data-gfx-attend]");
  const HALO = "0 0 2px var(--gfx-card), 0 0 5px color-mix(in srgb, var(--gfx-card) 95%, transparent), 0 0 12px color-mix(in srgb, var(--gfx-card) 70%, transparent)";
  const STICKER = "drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(0 0.25em 0 color-mix(in srgb, var(--gfx-line) 55%, transparent))";
  const CSS = `
${T} .gf-arena {
  --gfx-ink: ${DEFAULT_COLORS.ink}; --gfx-card: ${DEFAULT_COLORS.card}; --gfx-text: ${DEFAULT_COLORS.text};
  --gfx-line: ${DEFAULT_COLORS.line}; --gfx-accent: ${DEFAULT_COLORS.accent}; --gfx-pick: ${DEFAULT_COLORS.pick};
  --gfx-sky1: ${DEFAULT_COLORS.sky1}; --gfx-sky2: ${DEFAULT_COLORS.sky2};

  --scanlines: 0;
  --text: var(--gfx-text);
  --surface: var(--gfx-card);
  --on-surface: var(--gfx-text);
  --on-coral: #FFFFFF;
  --ink: var(--gfx-ink);
  --ink-2: color-mix(in srgb, var(--gfx-ink) 80%, var(--gfx-pick));
  --ink-3: color-mix(in srgb, var(--gfx-ink) 72%, var(--gfx-line));
  --porcelain-2: color-mix(in srgb, var(--gfx-card) 70%, var(--gfx-ink));
  /* Mostly a text and icon colour in the game (light on the dark styles), so here it follows the text. */
  --porcelain-3: color-mix(in srgb, var(--gfx-text) 78%, var(--gfx-ink));
  --steel: color-mix(in srgb, var(--gfx-line) 62%, var(--gfx-ink));
  --steel-dark: color-mix(in srgb, var(--gfx-line) 85%, var(--gfx-ink));
  --steel-faint: color-mix(in srgb, var(--gfx-text) 68%, var(--gfx-ink));
  --coral: var(--gfx-accent);
  --coral-deep: color-mix(in srgb, var(--gfx-accent) 78%, #000);
  --amber: #F2A900; --amber-deep: #C98500;
  --epic: #A274E0; --epic-deep: #7A4FC2;
  --jade: #3DA95A; --alarm: #EE4A5D;
  --af-fire: #F2603C; --af-water: #3E9BE8; --af-wind: #3DA95A;
  --af-earth: #C98A2B; --af-light: #F2B600; --af-dark: #9B6FD4;
  --fire: #F2603C; --water: #3E9BE8; --wind: #3DA95A;
  --earth: #D99A1E; --light: #E8A800; --dark: #9B6FD4;
  --glow-1: var(--gfx-sky1);
  --glow-2: var(--gfx-sky2);
  --ground-1: color-mix(in srgb, var(--gfx-sky1) 45%, var(--gfx-ink));
  --ground-2: color-mix(in srgb, var(--gfx-sky2) 55%, var(--gfx-ink));

  --clip-card: none; --clip-chip: none; --clip-btn: none;
  --plate-clip-right: none; --plate-clip-left: none;
  --emblem-cut: none; --emblem-round: block;
  --pip-rotate: 0deg; --pip-radius: 50%;
  --radius: 18px;
  --radius-sm: 12px;
  --panel-blur: none;
  --panel-shadow: 0 0.32em 0 -0.04em color-mix(in srgb, var(--gfx-line) 32%, transparent);
  --panel-bevel: inset 0 -0.2em 0 color-mix(in srgb, var(--gfx-line) 10%, transparent);

  --body: "Gowun Dodum", "Malgun Gothic", "Segoe UI", system-ui, sans-serif;
  --display: "Jua", "Malgun Gothic", "Segoe UI", system-ui, sans-serif;
  --title: "Jua", "Malgun Gothic", "Segoe UI", system-ui, sans-serif;
  --title-weight: 400;
  --case: none;
  --stretch: normal;
  --track: 0;

  --gfx-dots: radial-gradient(color-mix(in srgb, #fff 55%, transparent) 18%, transparent 19%) 0 0 / 2.2em 2.2em,
              radial-gradient(color-mix(in srgb, #fff 35%, transparent) 18%, transparent 19%) 1.1em 1.1em / 2.2em 2.2em;
}

/* Ground: the game's own gradient underneath, polka dots on top. */
${T} .gf-stage, ${T} .hm-ground {
  background-image: var(--gfx-dots), linear-gradient(160deg, var(--glow-1), var(--ground-1) 45%, var(--glow-2)) !important;
}

/* Chunky outlined pieces: buttons press down onto a hard outline-coloured shadow. */
${T} .currency, ${T} .icon-button, ${T} .hm-chat, ${T} .hm-side, ${T} .hm-slot, ${T} .sv-q,
${T} .st-sect, ${T} .st-chip, ${T} .back, ${T} .act, ${T} .diff-pill, ${T} .btn {
  border: 2px solid var(--gfx-line) !important;
  box-shadow: 0 0.22em 0 var(--gfx-line) !important;
}
${T} .hm-tile, ${T} .hm-cta, ${T} .st-plate, ${T} .st-sty, ${T} .ev-panel {
  border: 2.5px solid var(--gfx-line) !important;
  box-shadow: 0 0.3em 0 var(--gfx-line), inset 0 -0.25em 0 color-mix(in srgb, var(--gfx-line) 10%, transparent) !important;
}
${T} .act { border-radius: 999px !important; }
/* The big start buttons: Trickcal's yellow "전투시작!" slab. */
${T} .fstart, ${T} [data-into-battle], ${T} .btn-go {
  background: linear-gradient(180deg, #FFDC5E, #FFB81C) !important; color: #3B2610 !important; text-shadow: 0 0.06em 0 #FFF0B0 !important;
  border: 3px solid #3B2610 !important; border-radius: 14px !important; clip-path: none !important;
  box-shadow: 0 0.28em 0 #8A5A00, inset 0 -0.25em 0 rgba(170, 110, 0, 0.35), inset 0 0.2em 0 rgba(255, 255, 255, 0.55) !important;
  font-family: var(--display) !important; }
${T} .fstart b, ${T} [data-into-battle] small { color: #5A3A10 !important; opacity: 0.85; }
${T} .gf-arena button { transition: transform 90ms ease, box-shadow 90ms ease, filter 120ms ease; }
${T} .gf-arena button:hover:not(:disabled) { filter: brightness(1.04); }
${T} .gf-arena button:active:not(:disabled) { transform: translateY(0.15em); }

/* The top bar and translucent HUD pieces: opaque so the text never sits on raw art. */
${T} .gf-bar { background: color-mix(in srgb, var(--gfx-ink) 85%, transparent) !important; border-bottom: 2.5px solid var(--gfx-line) !important; }
${T} .currency, ${T} .icon-button, ${T} .hm-chat, ${T} .hm-side, ${T} .hm-slot { background: var(--gfx-card) !important; }

/* Selected states: the "picked" sticker look. */
${T} .st-sect[aria-selected="true"], ${T} .st-chip[aria-pressed="true"], ${T} .st-sty[aria-pressed="true"], ${T} .diff-pill[aria-pressed="true"] {
  background: var(--gfx-pick) !important;
  color: var(--gfx-line) !important;
}
${T} .st-plate > .hd h3 {
  display: inline-block;
  padding: 0.15em 0.9em;
  border: 2px solid var(--gfx-line);
  border-radius: 999px;
  background: var(--gfx-pick);
  color: var(--gfx-line);
  box-shadow: 0 0.18em 0 var(--gfx-line);
}

/* Text over art: the game halos it in black, which on dark-on-light letters reads as a smudge. A card-coloured
   halo instead, the sticker-outline look. These are the game's own rules that write a black text-shadow. */
${T} :is(.sv-q, .sv-id, .sv-figs, .sv-bonus, .nw-id, .nw-figs, .cbt .hpn, .dmg, .dmg .eff, .abanner .big,
  .bname .kicker, .bname h3, .bname p, .float .rates, .float .pity .fig, .float .pity .note,
  .u-art > .u-stars, .u-art > .u-lvl, .u-art > .bond-pip) {
  text-shadow: ${HALO} !important;
}
/* The summon banner: lighter veils so the art is not washed out, and a pastel ground behind no art. */
${T} .show { background: radial-gradient(120% 90% at 70% 0%, var(--glow-1) 0%, var(--glow-2) 55%, var(--ground-2) 100%) !important; }
${T} .show > .veil {
  background: linear-gradient(0deg, color-mix(in srgb, var(--gfx-ink) 90%, transparent) 0%, color-mix(in srgb, var(--gfx-ink) 55%, transparent) 22%, transparent 45%),
              linear-gradient(180deg, color-mix(in srgb, var(--gfx-ink) 70%, transparent) 0%, transparent 30%) !important;
}

/* Background-work badge: a cream pill with the mascot's bob. */
${T} .gb-row { background: var(--gfx-card) !important; border: 2px solid var(--gfx-line) !important; border-radius: 999px !important;
  box-shadow: 0 0.2em 0 var(--gfx-line) !important; color: var(--gfx-text) !important; }

/* ── Story ─────────────────────────────────────────────────────────────────────────────────────── */
${T} .vn-exit, ${T} .vn-tool {
  background: var(--gfx-card) !important; color: var(--gfx-text) !important;
  border: 2px solid var(--gfx-line) !important; border-radius: 999px !important; clip-path: none !important;
  box-shadow: 0 0.18em 0 var(--gfx-line) !important;
}
${T} .vn-caption { background: color-mix(in srgb, var(--gfx-card) 88%, transparent); border: 2px solid var(--gfx-line);
  border-radius: 14px; padding: 0.25em 0.8em; box-shadow: 0 0.18em 0 var(--gfx-line); }
${T} .vn-who {
  background: var(--gfx-accent) !important; color: #fff !important;
  border: 2.5px solid var(--gfx-line) !important; border-radius: 999px !important; clip-path: none !important;
  box-shadow: 0 0.2em 0 var(--gfx-line) !important;
  text-shadow: 0 0.08em 0 color-mix(in srgb, var(--gfx-line) 60%, transparent);
  transform: translate(0.8em, 0.55em) rotate(-2deg); position: relative; z-index: 4;
}
${T} .vn-who[data-narration] { background: var(--gfx-pick) !important; color: var(--gfx-line) !important; text-shadow: none; }
${H("[data-gfx-box]")} .vn-box {
  background: color-mix(in srgb, var(--gfx-card) 95%, transparent) !important;
  border: 3px solid var(--gfx-line) !important; border-radius: 22px !important; clip-path: none !important;
  box-shadow: 0 0.35em 0 var(--gfx-line), inset 0 0 0 0.28em color-mix(in srgb, var(--gfx-pick) 55%, transparent) !important;
  backdrop-filter: none !important;
}
${H("[data-gfx-box]")} .vn-text { color: var(--gfx-text) !important; text-shadow: none !important; }
${T} .vn-next { color: var(--gfx-accent) !important; }
${T} .vn-continue { border: 2.5px solid var(--gfx-line) !important; border-radius: 999px !important; clip-path: none !important; box-shadow: 0 0.2em 0 var(--gfx-line) !important; }

${H("[data-gfx-sticker]")} .vn-plate:not([data-gfx-sd]) {
  --edge-w: 5px;
  background: #fff !important; padding: 5px !important;
  outline: 3px solid var(--gfx-line); outline-offset: -1px;
  border-radius: 20px !important; clip-path: none !important;
  box-shadow: 0 0.45em 0 var(--gfx-line) !important;
}
${H("[data-gfx-sticker]")} .vn-plate:not([data-gfx-sd]) .vn-art { inset: 5px !important; border-radius: 15px !important; clip-path: none !important; }
${H("[data-gfx-sticker]")} .vn-plate:not([data-gfx-sd]) .vn-art::after { display: none; }
${H("[data-gfx-sticker]")} .vn-plate[data-side="left"]:not([data-gfx-sd]) { rotate: -2deg; left: 1.2% !important; bottom: 0.6em !important; }
${H("[data-gfx-sticker]")} .vn-plate[data-side="right"]:not([data-gfx-sd]) { rotate: 2deg; right: 1.2% !important; bottom: 0.6em !important; }

/* SD standing: the plate's frame goes and the transparent sprite stands on the box, outlined like a sticker. */
${T} .vn-plate[data-gfx-sd] { background: transparent !important; box-shadow: none !important; clip-path: none !important; overflow: visible !important; }
${T} .vn-plate[data-gfx-sd] .vn-art { opacity: 0 !important; }
${T} .vn-plate[data-gfx-sd] > img.gfx-sd {
  position: absolute; left: 50%; bottom: -0.4em; height: 104%; width: auto; max-width: 150%;
  translate: -50% 0; object-fit: contain; object-position: 50% 100%;
  filter: ${STICKER}; transform-origin: 50% 100%; pointer-events: none;
}

/* The cast line-up: large SDs standing behind the dialogue box (the box is the game's, untouched). */
${T} .vn-plate[data-gfx-sd] { opacity: 0 !important; }
.gfx-vn-cast { position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden; }
.gfx-vn-cast .who { position: absolute; bottom: 0; height: 86%; aspect-ratio: 0.68; translate: -50% 0; z-index: 1;
  filter: brightness(0.6) saturate(0.85); scale: 0.94; transform-origin: 50% 100%;
  transition: left 420ms cubic-bezier(.3,1.3,.5,1), filter 250ms ease, scale 250ms ease; animation: gfx-cast-in 380ms ease both; }
.gfx-vn-cast .who[data-speaking] { filter: none; scale: 1; z-index: 2; }
.gfx-vn-cast .who .body { position: absolute; inset: 0; display: grid; place-items: end center; transform-origin: 50% 100%; scale: var(--hf, 1); animation: gfx-breathe 3.4s ease-in-out infinite; }
.gfx-vn-cast .who[data-hop] .body { animation: gfx-talk-hop 380ms ease, gfx-breathe 3.4s ease-in-out 380ms infinite; }
.gfx-vn-cast img { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none !important; max-height: none !important; object-fit: contain; object-position: 50% 100%; filter: ${STICKER}; -webkit-user-drag: none; }
.gfx-vn-cast img.portrait { padding: 3%; box-sizing: border-box; object-fit: contain; object-position: 50% 12%; background: #fff; border: 3px solid #fff; outline: 2.5px solid var(--gfx-line); border-radius: 18px; filter: none; }
.vn[data-cg] .gfx-vn-cast { display: none; }
.vn:has(.vn-choices:not([hidden]), .vn-choice:not([hidden]), [data-choice]:not([hidden])) .gfx-vn-cast { display: none; }
.vn .vn-choices, .vn .vn-choice, .vn [data-choice] { position: relative; z-index: 8; }
@keyframes gfx-cast-in { from { opacity: 0; translate: -50% 8%; } to { opacity: 1; translate: -50% 0; } }
@keyframes gfx-talk-hop { 0% { transform: translateY(0); } 40% { transform: translateY(-3%) scale(0.98, 1.03); } 100% { transform: none; } }

/* Chapter map: the node's button inside its card, at the card's right end. */
${T} .node-row { position: relative; }
${T} .node-row > .node-card { flex: 1 1 auto !important; padding-right: 8.5em !important; }
${T} .node-row > .node-action { position: absolute !important; right: 0.9em; top: 50%; translate: 0 -50%; margin: 0 !important; z-index: 2; }
${T} .node-row > .node-action .act { padding: 0.25em 1em !important; }

/* ── Battle ────────────────────────────────────────────────────────────────────────────────────── */
${T} .cbt .ava { border: 2.5px solid var(--gfx-line) !important; border-radius: 16px !important; clip-path: none !important;
  background: linear-gradient(170deg, var(--gfx-sky1), var(--gfx-sky2)) !important; }
/* The card's foot is a hardcoded near-black fade under the name and bars: a card-coloured one here. */
${T} .cbt::after { background: linear-gradient(0deg, color-mix(in srgb, var(--gfx-card) 96%, transparent) 14%, color-mix(in srgb, var(--gfx-card) 60%, transparent) 52%, transparent 100%) !important;
  border-radius: 0 0 16px 16px; }
${T} .cbt .nm { color: var(--gfx-text) !important; text-shadow: ${HALO} !important; }
${T} .cbt[data-gfx-sd] .ava { background: radial-gradient(90% 70% at 50% 85%, var(--gfx-pick), var(--gfx-sky2) 70%, var(--gfx-sky1)) !important; }
${T} .cbt[data-gfx-sd] .ava-photo { opacity: 0 !important; }
${T} .cbt[data-gfx-sd] { overflow: visible !important; }
${T} .cbt[data-gfx-sd] > img.gfx-sd {
  position: absolute; left: -6%; right: -6%; bottom: 16%; height: calc(96% * var(--hf, 1)); width: 112%; z-index: 2;
  max-width: none !important; max-height: none !important; object-fit: contain; object-position: 50% 100%; filter: ${STICKER}; transform-origin: 50% 100%; pointer-events: none;
}

/* ── Motion ────────────────────────────────────────────────────────────────────────────────────── */
@keyframes gfx-breathe { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.015, 0.985); } }
@keyframes gfx-bob { 0%, 100% { transform: translateY(0) scale(1, 1); } 45% { transform: translateY(-3%) scale(0.98, 1.03); } 60% { transform: translateY(0) scale(1.04, 0.95); } 75% { transform: scale(1, 1); } }
@keyframes gfx-pop { 0% { transform: scale(0.6, 0.6); opacity: 0; } 55% { transform: scale(1.08, 0.94); opacity: 1; } 75% { transform: scale(0.96, 1.05); } 100% { transform: scale(1, 1); } }
@keyframes gfx-hop { 0% { transform: translateY(0) scale(1.08, 0.9); } 35% { transform: translateY(-18%) scale(0.94, 1.08); } 70% { transform: translateY(0) scale(1.1, 0.88); } 100% { transform: translateY(0) scale(1, 1); } }
@keyframes gfx-squash { 0%, 100% { transform: scale(1, 1); } 30% { transform: scale(1.18, 0.78) rotate(-4deg); } 60% { transform: scale(0.92, 1.08) rotate(3deg); } }
${H("[data-gfx-motion]")} .vn-plate:not([data-gfx-sd]) .vn-art > img { transform-origin: 50% 100%; animation: gfx-breathe 3.4s ease-in-out infinite; }
${H("[data-gfx-motion]")} .vn-plate[data-open="true"] { animation: gfx-pop 420ms cubic-bezier(.3,1.6,.5,1) both; transform-origin: 50% 100%; }
${H("[data-gfx-motion]")} .vn-plate[data-gfx-sd] > img.gfx-sd { animation: gfx-bob 1.9s ease-in-out infinite; }
${H("[data-gfx-motion]")} .cbt[data-gfx-sd] > img.gfx-sd { animation: gfx-bob 1.7s ease-in-out infinite; }
${H("[data-gfx-motion]")} .cbt.acting[data-gfx-sd] > img.gfx-sd { animation: gfx-hop 520ms ease-out infinite; }
${H("[data-gfx-motion]")} .cbt.hit[data-gfx-sd] > img.gfx-sd { animation: gfx-squash 320ms ease; }

/* ── Loading screen ────────────────────────────────────────────────────────────────────────────── */
.gfx-load {
  position: absolute; inset: 0; z-index: 2147483000; overflow: hidden; pointer-events: auto;
  font-family: "Jua", "Malgun Gothic", system-ui, sans-serif; color: var(--gfx-text, #5A3A24);
  --gfx-ink: ${DEFAULT_COLORS.ink}; --gfx-card: ${DEFAULT_COLORS.card}; --gfx-text: ${DEFAULT_COLORS.text};
  --gfx-line: ${DEFAULT_COLORS.line}; --gfx-accent: ${DEFAULT_COLORS.accent}; --gfx-pick: ${DEFAULT_COLORS.pick};
  --gfx-sky1: ${DEFAULT_COLORS.sky1}; --gfx-sky2: ${DEFAULT_COLORS.sky2};
  --u: 10px; /* set from the overlay's own size while it is up */
  background:
    radial-gradient(color-mix(in srgb, #fff 55%, transparent) 18%, transparent 19%) 0 0 / 2.4em 2.4em,
    radial-gradient(color-mix(in srgb, #fff 35%, transparent) 18%, transparent 19%) 1.2em 1.2em / 2.4em 2.4em,
    linear-gradient(160deg, var(--gfx-sky1), color-mix(in srgb, var(--gfx-sky1) 45%, var(--gfx-ink)) 45%, var(--gfx-sky2));
  animation: gfx-load-in 220ms ease both;
}
.gfx-load-host { position: absolute; inset: 0; z-index: 2147482999; overflow: hidden; pointer-events: none; contain: layout paint; }
.gfx-load-host > .gfx-load { pointer-events: auto; }
${T} .gf-stage:has(> .gfx-load-host), ${T} .gf-arena:has(> .gfx-load-host) { position: relative !important; overflow: hidden !important; }
.gfx-load[data-out] { animation: gfx-load-out 260ms ease both; pointer-events: none; }
@keyframes gfx-load-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes gfx-load-out { to { opacity: 0; transform: scale(1.03); } }
.gfx-load-title {
  position: absolute; left: 4%; top: 6%; display: flex; align-items: baseline; gap: 0.05em;
  padding: 0.25em 1em 0.3em; font-size: calc(var(--u) * 3.4); color: #fff; background: var(--gfx-accent);
  border: 3px solid var(--gfx-line); border-radius: 999px; box-shadow: 0 0.14em 0 var(--gfx-line); rotate: -3deg;
  text-shadow: 0 0.07em 0 color-mix(in srgb, var(--gfx-line) 60%, transparent);
}
.gfx-load-title i { font-style: normal; display: inline-block; animation: gfx-dot 1.1s ease-in-out infinite; }
.gfx-load-title i:nth-child(2) { animation-delay: .15s; } .gfx-load-title i:nth-child(3) { animation-delay: .3s; }
@keyframes gfx-dot { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-0.3em); } }
.gfx-load-world { position: absolute; right: 4%; top: 7%; max-width: 42%; font-size: calc(var(--u) * 2.1); padding: 0.25em 0.9em;
  color: var(--gfx-line); background: var(--gfx-card); border: 2.5px solid var(--gfx-line); border-radius: 999px; box-shadow: 0 0.14em 0 var(--gfx-line);
  rotate: 2deg; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gfx-load-world:empty { display: none; }
.gfx-load-stage { position: absolute; left: 50%; top: 47%; translate: -50% -50%; width: calc(var(--u) * 34); height: calc(var(--u) * 34);
  display: grid; place-items: end center; cursor: pointer; }
.gfx-load-stage::before { content: ""; position: absolute; inset: 6% 2% 10%; border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, #fff 80%, transparent), transparent 68%); }
.gfx-load-shadow { position: absolute; bottom: 3%; left: 50%; width: 46%; height: 7%; translate: -50% 0; border-radius: 50%;
  background: color-mix(in srgb, var(--gfx-line) 28%, transparent); animation: gfx-shadow 0.9s ease-in-out infinite; }
.gfx-load-hero { position: relative; height: 92%; width: 100%; display: grid; place-items: end center;
  transform-origin: 50% 100%; animation: gfx-jump 0.9s cubic-bezier(.4,0,.6,1) infinite; }
.gfx-load-hero > img { max-height: 100%; max-width: 100%; object-fit: contain; filter: ${STICKER}; -webkit-user-drag: none; user-select: none; }
.gfx-load-hero > svg { width: 78%; height: auto; overflow: visible; }
.gfx-load-stage[data-squish] .gfx-load-hero { animation: gfx-squash 380ms ease; }
@keyframes gfx-jump { 0%, 100% { transform: translateY(0) scale(1.08, 0.92); } 15% { transform: translateY(0) scale(1, 1); }
  50% { transform: translateY(-16%) scale(0.95, 1.06); } 85% { transform: translateY(0) scale(1, 1); } }
@keyframes gfx-shadow { 0%, 100% { scale: 1.1 1; opacity: 1; } 50% { scale: 0.7 1; opacity: 0.6; } }
.gfx-load-pop { position: absolute; top: 4%; right: 6%; font-size: calc(var(--u) * 2.6); color: var(--gfx-accent);
  text-shadow: 0 0 3px #fff, 0 0 6px #fff; animation: gfx-pop-text 600ms ease-out both; pointer-events: none; }
@keyframes gfx-pop-text { from { opacity: 0; transform: translateY(30%) scale(0.6); } 40% { opacity: 1; transform: translateY(-20%) scale(1.15); } to { opacity: 0; transform: translateY(-80%) scale(1); } }
.gfx-load-foot { position: absolute; left: 5%; right: 5%; bottom: 6%; display: flex; flex-direction: column; gap: calc(var(--u) * 6); }
.gfx-load-tip { position: relative; display: flex; align-items: center; gap: 0.7em; padding: 0.55em 1.1em;
  font-family: "Gowun Dodum", "Malgun Gothic", system-ui, sans-serif; font-size: calc(var(--u) * 2); line-height: 1.4;
  background: var(--gfx-card); border: 3px solid var(--gfx-line); border-radius: 18px; box-shadow: 0 0.22em 0 var(--gfx-line); }
.gfx-load-tip b { flex: none; font-family: "Jua", "Malgun Gothic", sans-serif; font-weight: 400; padding: 0.05em 0.6em;
  background: var(--gfx-pick); color: var(--gfx-line); border: 2px solid var(--gfx-line); border-radius: 999px; }
.gfx-load-tip span { animation: gfx-load-in 300ms ease both; }
.gfx-load-bar { position: relative; height: calc(var(--u) * 2.6); background: var(--gfx-card); border: 3px solid var(--gfx-line);
  border-radius: 999px; box-shadow: 0 0.2em 0 var(--gfx-line), inset 0 0.2em 0 color-mix(in srgb, var(--gfx-line) 12%, transparent); }
.gfx-load-fill { position: absolute; left: 3px; top: 3px; bottom: 3px; width: 0; border-radius: 999px;
  background: repeating-linear-gradient(-45deg, var(--gfx-accent) 0 0.7em, color-mix(in srgb, var(--gfx-accent) 78%, #fff) 0.7em 1.4em);
  background-size: 200% 100%; animation: gfx-stripe 0.8s linear infinite; transition: width 180ms linear; }
@keyframes gfx-stripe { to { background-position: -1.98em 0; } }
.gfx-load-runner { position: absolute; bottom: 60%; width: calc(var(--u) * 5.5); height: calc(var(--u) * 5.5); translate: -50% 0;
  transition: left 180ms linear; display: grid; place-items: end center; animation: gfx-run 0.35s ease-in-out infinite; }
.gfx-load-runner > img { max-width: 100%; max-height: 100%; object-fit: contain; filter: ${STICKER}; }
.gfx-load-runner > svg { width: 100%; height: auto; }
@keyframes gfx-run { 0%, 100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-18%) rotate(4deg); } }
.gfx-load-pct { position: absolute; right: 0.8em; top: 50%; translate: 0 -50%; font-size: calc(var(--u) * 1.6); color: var(--gfx-line); }
/* The built-in mascot: a mochi with a sprout, drawn in the style's own colours. */
.gfx-mochi .body { fill: var(--gfx-card); stroke: var(--gfx-line); stroke-width: 5; }
.gfx-mochi .eye { fill: var(--gfx-line); }
.gfx-mochi .shine { fill: #fff; }
.gfx-mochi .blush { fill: #FF8FAB; opacity: 0.6; }
.gfx-mochi .mouth, .gfx-mochi .stem { fill: none; stroke: var(--gfx-line); stroke-width: 4; stroke-linecap: round; }
.gfx-mochi .leaf { fill: #7DD87D; stroke: var(--gfx-line); stroke-width: 3.5; }
/* World creation ("forge") screen: the mascot instead of the spinning emblem. */
${T} .forge-center .forge-emblem { display: none; }
${T} .gfx-forge-mascot { width: calc(var(--f) * 12); height: calc(var(--f) * 12); display: grid; place-items: end center; }
${T} .gfx-forge-mascot > * { max-width: 100%; max-height: 100%; transform-origin: 50% 100%; animation: gfx-jump 0.9s cubic-bezier(.4,0,.6,1) infinite; filter: ${STICKER}; }

/* ── Battle field (Trickcal Revive manner) ────────────────────────────────────────────────────────
   The game keeps its sides and rows; only where things stand changes. Sides and rows stop being boxes,
   so every unit is placed on the arena itself: allies on the left, enemies on the right, three lanes of
   depth, the front row nearer the middle. Clicks, targeting and turns are the game's own, untouched. */
${F} .arena > .side { position: static !important; display: block !important; flex: none !important; padding: 0 !important; z-index: auto !important; }
${F} .arena .row { display: contents !important; }
${F} .arena > .midline { display: none !important; }
${F} .arena .cbt {
  position: absolute !important; margin: 0 !important; width: 9.6% !important; height: 30% !important;
  --lane: 0; --extra: 0; top: calc(21% + var(--lane) * 14%); z-index: calc(10 + var(--lane));
  transition: left 300ms ease, top 300ms ease, transform 200ms ease;
}
${F} .arena .row > .cbt:nth-child(3n+2) { --lane: 1; }
${F} .arena .row > .cbt:nth-child(3n+3) { --lane: 2; }
${F} .arena .row > .cbt:nth-child(n+4) { --extra: 1; }
${F} .side.allies .row.back > .cbt { --col: 6%; }
${F} .side.allies .row.front > .cbt, ${F} .side.allies.no-front .row.back > .cbt { --col: 25%; }
${F} .side.allies .cbt { left: calc(var(--col) + (1 - var(--lane)) * 3.4% - var(--extra) * 11%); }
${F} .side.enemies .row.front > .cbt, ${F} .side.enemies.no-front .row.back > .cbt { --col: 62%; }
${F} .side.enemies .row.back > .cbt { --col: 78%; }
${F} .side.enemies .cbt { left: calc(var(--col) - (1 - var(--lane)) * 2.6% + var(--extra) * 11%); }
${F} .arena .cbt::before { display: none !important; }
/* The ground under each unit, and a soft ground band across the field. */
${F} .arena .cbt::after {
  content: "" !important; top: auto !important; left: 12% !important; right: 12% !important; bottom: -3% !important; height: 9% !important;
  border-radius: 50% !important; z-index: 0 !important;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--gfx-line) 38%, transparent), transparent) !important;
}
${F} .cb-shade { background: linear-gradient(0deg, color-mix(in srgb, var(--gfx-sky2) 55%, transparent) 0%, transparent 42%),
  linear-gradient(180deg, color-mix(in srgb, var(--gfx-sky1) 35%, transparent) 0%, transparent 30%) !important; }
/* A unit with an SD is just the sprite; one without is a small sticker card standing in its place. */
${F} .arena .cbt .ava { inset: 16% 10% 4% !important; width: auto !important; height: auto !important;
  border: 3px solid #fff !important; outline: 2.5px solid var(--gfx-line); border-radius: 14px !important; box-shadow: 0 0.3em 0 var(--gfx-line) !important; }
${F} .arena .cbt[data-gfx-sd] .ava, ${F} .arena .cbt[data-gfx-foe] .ava { background: none !important; border: 0 !important; outline: 0; box-shadow: none !important; }
${F} .arena .cbt[data-gfx-foe] .ava > svg { display: none; }
${F} .arena .cbt[data-gfx-sd] > img.gfx-sd { left: -20% !important; right: auto !important; width: 140% !important; height: calc(92% * var(--hf, 1)) !important; bottom: 2% !important; z-index: 1; }
${F} .arena .cbt > .gfx-foe { position: absolute; left: 0; right: 0; bottom: 2%; height: 62%; z-index: 1; display: grid; place-items: end center; pointer-events: none; transform-origin: 50% 100%; }
${F} .arena .cbt > .gfx-foe svg { width: 100%; height: 100%; overflow: visible; filter: ${STICKER}; }
/* Name and HP float over the head as a little plate. */
${F} .arena .cbt .nm { top: 0 !important; bottom: auto !important; left: -8% !important; right: -8% !important; z-index: 4 !important;
  font-size: calc(var(--f) * 0.85 * var(--gf-scale, 1)) !important; padding: 0.1em 0.4em; border-radius: 999px;
  background: var(--gfx-card); border: 2px solid var(--gfx-line); box-shadow: 0 0.12em 0 var(--gfx-line); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
${F} .arena .cbt .bars { top: 10% !important; bottom: auto !important; left: 2% !important; right: 2% !important; z-index: 4 !important; }
${F} .arena .cbt .hp, ${F} .arena .cbt .en { border-radius: 999px; outline: 1.5px solid var(--gfx-line); }
${F} .arena .cbt .hpn { display: none !important; }
${F} .arena .cbt .aff-badge { top: -2% !important; right: -14% !important; z-index: 5 !important; }
${F} .arena .cbt .cbt-est { top: 20% !important; bottom: auto !important; z-index: 5; }
/* Acting: the unit steps toward the other side; the game's own lift is replaced. */
${F} .side.allies .cbt.acting { transform: translateX(45%) scale(1.08) !important; z-index: 40 !important; }
${F} .side.enemies .cbt.acting { transform: translateX(-45%) scale(1.08) !important; z-index: 40 !important; }
${F} .arena .cbt.dead { transform: scale(0.85) rotate(-8deg) !important; }
/* Before the fight: dashed placement tiles on the ground, as on the Trickcal field. */
${F} .gfx-tiles { position: absolute; left: 3%; right: 3%; top: 30%; bottom: 20%; z-index: 0; pointer-events: none;
  display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(3, 1fr); gap: 1.4% 1%;
  transform: perspective(60em) rotateX(28deg); transform-origin: 50% 100%; opacity: 0; transition: opacity 400ms ease; }
${F} .gfx-tiles i { border: 2px dashed color-mix(in srgb, #fff 75%, transparent); border-radius: 10px; background: color-mix(in srgb, #fff 14%, transparent); }
${F} .gfx-tiles i:nth-child(8n+5), ${F} .gfx-tiles i:nth-child(8n+6), ${F} .gfx-tiles i:nth-child(8n+7), ${F} .gfx-tiles i:nth-child(8n+8) {
  background: color-mix(in srgb, #F2884B 16%, transparent); border-color: color-mix(in srgb, #FFE1C9 80%, transparent); }
${H('[data-gfx-field][data-gfx-phase="prebattle"]')} .gfx-tiles { opacity: 1; }
/* Before the fight the briefing is in front: the field units (which sit above its blur) and the empty turn
   bar wait out of sight, and the floating team over the start button stands in for them. */
${H('[data-gfx-field][data-gfx-phase="prebattle"]')} .arena .cbt,
${H('[data-gfx-field][data-gfx-phase="prebattle"]')} .cbt-turn-slot { visibility: hidden !important; }
${H('[data-gfx-field][data-gfx-phase="loading"]')} .cbt-turn-slot { visibility: hidden !important; }
${F} .arena .cbt .hp > i { background: linear-gradient(180deg, #FF8A8A, #E0484E) !important; }
${F} .side.allies .cbt .hp > i { background: linear-gradient(180deg, #8EE6A0, #3DA95A) !important; }
${F} .arena .cbt .hp { background: #3B2A22 !important; height: calc(var(--f) * 0.55) !important; }
/* The turn panel: one row along the bottom — the actor's face, then the six actions. */
${F} .cbt-turn-slot { position: absolute !important; left: 12% !important; right: 12% !important; bottom: 0 !important; top: auto !important;
  height: 19% !important; width: auto !important; max-width: none !important; order: 0 !important; z-index: 30 !important; flex: none !important; }
${F} .cbt-turn { position: absolute !important; inset: 0 !important; width: auto !important; height: auto !important; gap: 0.6em !important; align-items: stretch !important;
  padding: 0.45em 0.6em !important; background: color-mix(in srgb, #3B2E26 55%, transparent); border: 0;
  border-radius: 18px 18px 0 0; backdrop-filter: blur(2px); }
${F} .tu-hero { height: 100% !important; width: auto !important; aspect-ratio: 1 !important; border-radius: 50% !important; border: 3px solid var(--gfx-line) !important; clip-path: none !important; flex: none !important; align-self: center !important; }
${F} .tu-hero .tu-id { display: none !important; }
${F} .cbt-acts { flex: 1 1 auto !important; grid-template-columns: repeat(6, minmax(0, 1fr)) !important; grid-template-rows: minmax(0, 1fr) !important; gap: 0.5em !important; height: 100% !important; }
${F} .cbt-act { border: 3px solid #fff !important; outline: 2px solid #3B2E26; border-radius: 10px !important; box-shadow: 0 0.22em 0 #3B2E26 !important;
  background: linear-gradient(160deg, #FFB98A, #F2884B) !important; }
${F} .cbt-act:nth-child(even) { background: linear-gradient(160deg, #A9D4FF, #5B9BE8) !important; }
${F} .cbt-act.locked { filter: grayscale(0.7) brightness(0.9); }
${F} .cbt-act .a-cost, ${F} .cbt-act .a-chip { color: #fff !important; text-shadow: 0 0.08em 0 #3B2E26; }
${F} .cbt-act .cbt-tip { bottom: calc(100% + 0.6em) !important; top: auto !important; }

/* ── Team: formation slots and the battle briefing ──────────────────────────────────────────────── */
${TM} .slot[data-gfx-sd] { overflow: visible !important; }
${TM} .slot[data-gfx-sd] .slot-art { background: radial-gradient(70% 40% at 50% 92%, color-mix(in srgb, var(--gfx-line) 30%, transparent), transparent 70%),
  linear-gradient(170deg, var(--gfx-sky1), var(--gfx-sky2)) !important; }
${TM} .slot[data-gfx-sd] .slot-art img { opacity: 0 !important; }
${TM} .slot[data-gfx-sd] > img.gfx-sd { position: absolute; left: -10%; width: 120%; bottom: 14%; height: calc(108% * var(--hf, 1)); object-fit: contain; object-position: 50% 100%;
  max-width: none !important; max-height: none !important; filter: ${STICKER}; pointer-events: none; z-index: 2; animation: gfx-float 2.6s ease-in-out infinite; }
${TM} .slot.filled:nth-child(2) > img.gfx-sd { animation-delay: -0.9s; } ${TM} .slot.filled:nth-child(3) > img.gfx-sd { animation-delay: -1.7s; }
@keyframes gfx-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6%); } }
.gfx-team { display: flex; justify-content: center; align-items: flex-end; gap: 1.2em; height: calc(var(--f, 10px) * 13); margin: 0.4em 0 1.4em; pointer-events: none; }.gfx-team > span { position: relative; height: 100%; aspect-ratio: 2 / 3; display: grid; place-items: end center; animation: gfx-float 2.4s ease-in-out infinite; }
.gfx-team > span:nth-child(2n) { animation-delay: -0.8s; } .gfx-team > span:nth-child(3n) { animation-delay: -1.5s; }
.gfx-team > span::after { content: ""; position: absolute; bottom: -6%; left: 18%; right: 18%; height: 8%; border-radius: 50%;
  background: color-mix(in srgb, var(--gfx-line, #6B4528) 30%, transparent); animation: gfx-shadow 2.4s ease-in-out infinite; }
.gfx-team.win { height: calc(var(--f, 10px) * 11); margin: 0.2em 0 0.6em; }
.gfx-team.win > span { animation: gfx-cheer 0.9s cubic-bezier(.4,0,.6,1) infinite; }
.gfx-team.win > span::after { animation: gfx-shadow 0.9s ease-in-out infinite; }
@keyframes gfx-cheer { 0%, 100% { transform: translateY(0) scale(1.06, 0.94); } 50% { transform: translateY(-22%) scale(0.96, 1.05); } }
.gfx-team img:not(.portrait) { display: block; height: 100%; width: auto; max-width: none !important; max-height: none !important; object-fit: contain; object-position: 50% 100%; scale: var(--hf, 1); transform-origin: 50% 100%; filter: ${STICKER}; }
.gfx-team img.portrait { width: 100%; height: 100%; object-fit: cover; object-position: 50% 15%; border-radius: 14px; border: 3px solid #fff; outline: 2.5px solid var(--gfx-line, #6B4528); filter: none; }

/* ── Home lobby ─────────────────────────────────────────────────────────────────────────────────── */
${HP} .hm-plate { display: none !important; }
.gfx-lobby { position: absolute; inset: 0; z-index: 2; pointer-events: none; overflow: hidden; }
/* Lobby mode, as in the Trickcal Revive lobby: the cast stands large across the screen and the home's own
   controls sit over them — round icons with outlined labels, a see-through top bar. */
${LB} .hm-scene, ${LB} .hm-dock { position: relative; z-index: 4; }
/* The scene's wide boxes (the right-hand column spans most of the screen) let the pointer through to the
   lobby; only its real controls take it. */
${LB} .hm-scene, ${LB} .hm-scene * { pointer-events: none !important; }
${LB} .hm-scene button, ${LB} .hm-scene a, ${LB} .hm-scene [role="button"], ${LB} .hm-scene input, ${LB} .hm-scene button * { pointer-events: auto !important; }
${LB} .hm-scene button * { pointer-events: none !important; }
${LB} .gf-stage:has(.hm-screen) .gf-bar { background: linear-gradient(180deg, color-mix(in srgb, var(--gfx-ink) 55%, transparent), transparent) !important; border-bottom: 0 !important; }
${LB} .hm-dock { background: none !important; border: 0 !important; box-shadow: none !important; justify-content: center; gap: 1.2em; }
${LB} .hm-tile { flex: 0 0 auto !important; width: auto !important; min-width: 0 !important; display: flex !important; flex-direction: column !important; align-items: center !important;
  gap: 0.1em !important; padding: 0 0.3em !important; background: none !important; border: 0 !important; box-shadow: none !important; }
${LB} .hm-tile { font-size: calc(var(--f) * 1.5) !important; }
${LB} .hm-tile > svg { width: 3.2em !important; height: 3.2em !important; padding: 0.6em; border-radius: 50%; color: #fff;
  background: var(--gfx-tile, var(--gfx-accent)); border: 2.5px solid var(--gfx-line); box-shadow: 0 0.2em 0 var(--gfx-line), inset 0 -0.25em 0 rgba(0,0,0,0.12); }
${LB} .hm-tile.roster { --gfx-tile: #FF8FB1; } ${LB} .hm-tile.formation { --gfx-tile: #6FB2F2; } ${LB} .hm-tile.summon { --gfx-tile: #F7C843; }
${LB} .hm-tile.shop { --gfx-tile: #7FD39A; } ${LB} .hm-tile.inventory { --gfx-tile: #F2884B; }
${LB} .hm-tile .nm, ${LB} .hm-side .lbl > span { font-family: var(--display) !important; color: #fff !important; -webkit-text-stroke: 3px var(--gfx-line); paint-order: stroke fill; letter-spacing: 0; }
${LB} .hm-side { background: none !important; border: 0 !important; box-shadow: none !important; }
${LB} .hm-side .lbl { display: inline-flex; align-items: center; gap: 0.35em; }
${LB} .hm-side .lbl > svg { width: 2em; height: 2em; padding: 0.35em; border-radius: 50%; color: #fff; background: #B48CF0; border: 2.5px solid var(--gfx-line); box-shadow: 0 0.16em 0 var(--gfx-line); }
${LB} .hm-cta { display: none !important; }
${LB} .hm-tile.gfx-battle-tile { --gfx-tile: #F25F5C; }
${LB} .hm-tile.gfx-battle-tile > svg { width: 3.6em !important; height: 3.6em !important; }
/* Events and achievements: a column of round icons down the right edge. */
${LB} .hm-rail { position: absolute !important; right: 1.2% !important; top: 3% !important; left: auto !important; bottom: auto !important;
  width: auto !important; height: auto !important; display: flex !important; flex-direction: column !important; align-items: center; gap: 0.6em !important; z-index: 5; }
${LB} .hm-side { position: relative; flex-direction: column !important; width: auto !important; height: auto !important; min-height: 0 !important; padding: 0 !important;
  font-size: calc(var(--f) * 1.35) !important; }
${LB} .hm-side .lbl { flex-direction: column !important; gap: 0.1em !important; }
${LB} .hm-side .lbl > svg { width: 3em !important; height: 3em !important; padding: 0.55em !important; }
${LB} .hm-side[data-go="events"] .lbl > svg { background: #FF8FB1 !important; }
${LB} .hm-side[data-go="missions"] .lbl > svg { background: #6FB2F2 !important; }
${LB} .hm-side .hm-dot { position: absolute; top: 0.1em; right: 0.2em; width: 0.7em; height: 0.7em; border: 2px solid #fff; background: #F25F5C !important; }
${LB} .hm-cta-unused { background: linear-gradient(180deg, #FFDC5E, #FFB81C) !important; color: #3B2610 !important; border: 3px solid #3B2610 !important;
  box-shadow: 0 0.3em 0 #8A5A00, inset 0 0.2em 0 rgba(255,255,255,0.55) !important; }
${LB} .hm-cta * { color: #3B2610 !important; }
${LB} .hm-cta { width: auto !important; height: auto !important; min-height: 0 !important; padding: 0.35em 1.4em 0.45em !important; border-radius: 999px !important; align-self: flex-end; }
${LB} .hm-cta .title, ${LB} .hm-cta .nodes { display: none !important; }
${LB} .hm-cta .big { font-size: calc(var(--f) * 2.2) !important; line-height: 1 !important; }
${LB} .hm-slot-bg { opacity: 0.85; }
/* Placed by the roaming loop with a single transform (position, then depth scale round the feet). */
.gfx-lobby .who { position: absolute; left: 0; top: 0; height: calc(40% * var(--hf, 1)); aspect-ratio: 2 / 3; transform-origin: 0 0; will-change: transform;
  pointer-events: auto; cursor: pointer; touch-action: none; }
.gfx-lobby .who .body { position: absolute; inset: 0; display: grid; place-items: end center; transform-origin: 50% 100%; animation: gfx-lobby-bob 1.9s ease-in-out infinite; animation-delay: var(--bdl, 0s); }
/* Keep the feet planted. The old shared bob translated the whole picture upward while its shadow stayed put. */
@keyframes gfx-lobby-bob { 0%, 100% { transform: scale(1, 1) rotate(-0.35deg); } 45% { transform: scale(0.985, 1.015) rotate(0.35deg); } 65% { transform: scale(1.025, 0.975) rotate(-0.25deg); } }
/* The image fills its box exactly; the box takes the image's own proportions (set on load), so the
   [배치] outline, the drag area and the cheek points all match the drawn sprite. */
.gfx-lobby .who img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; object-position: 50% 100%;
  max-width: none !important; max-height: none !important; filter: ${STICKER}; -webkit-user-drag: none; user-select: none; }
.gfx-lobby .who::after { content: ""; position: absolute; bottom: -3%; left: 20%; right: 20%; height: 7%; border-radius: 50%; z-index: -1;
  background: color-mix(in srgb, var(--gfx-line) 32%, transparent); }
.gfx-lobby .who[data-squish] .body { animation: gfx-squash 380ms ease; }
.gfx-lobby .who .say { position: absolute; bottom: 102%; left: 50%; translate: -50% 0; white-space: nowrap; padding: 0.3em 0.8em;
  font-family: "Jua", "Malgun Gothic", sans-serif; font-size: calc(var(--f, 10px) * 1.05); color: var(--gfx-text);
  background: var(--gfx-card); border: 2.5px solid var(--gfx-line); border-radius: 14px; box-shadow: 0 0.15em 0 var(--gfx-line); animation: gfx-pop 300ms ease both; }
.gfx-lobby .who .say::after { content: ""; position: absolute; top: 100%; left: 50%; translate: -50% -1px; border: 0.45em solid transparent; border-top-color: var(--gfx-line); }
/* Walking is the box sliding; turning round is only the sprite flipping, so the speech bubble never mirrors. */
.gfx-lobby .who .flip { position: absolute; inset: 0; transition: transform 160ms ease; }
/* Walking is a quicker, bouncier step than standing still. */
.gfx-lobby .who[data-walk] .body { animation: gfx-step 0.44s ease-in-out infinite; }
@keyframes gfx-step { 0%, 100% { transform: scale(1.02, 0.98) rotate(-1deg); } 50% { transform: scale(0.98, 1.03) rotate(1deg); } }
.gfx-lobby .who[data-pinch] .body { animation-play-state: paused !important; cursor: grabbing; }
.gfx-lobby[data-edit] .who { outline: 2.5px dashed var(--gfx-accent); outline-offset: 2px; border-radius: 12px; cursor: grab; }
.gfx-lobby[data-edit] .who .body { animation: none; }
.gfx-lobby[data-edit] { background: color-mix(in srgb, var(--gfx-ink) 25%, transparent); pointer-events: auto; }
.gfx-lobby-tools { position: absolute; left: 50%; top: 2%; translate: -50% 0; display: flex; gap: 0.5em; pointer-events: auto; z-index: 500; }
.gfx-lobby-tools button { font-family: "Jua", "Malgun Gothic", sans-serif; font-size: calc(var(--f, 10px) * 0.95); padding: 0.3em 0.9em; cursor: pointer;
  color: var(--gfx-text); background: var(--gfx-card); border: 2px solid var(--gfx-line); border-radius: 999px; box-shadow: 0 0.18em 0 var(--gfx-line); }
.gfx-lobby-tools button[data-main] { background: var(--gfx-accent); color: #fff; }
.gfx-lobby:not([data-edit]) .gfx-lobby-tools { left: 1.6%; top: 10.5%; translate: 0 0; opacity: 0.95; }
.gfx-lobby[data-edit] .gfx-lobby-tools { flex-wrap: wrap; justify-content: center; max-width: 70%; padding: 0.5em 0.7em;
  background: color-mix(in srgb, var(--gfx-card) 92%, transparent); border: 2.5px solid var(--gfx-line); border-radius: 16px; box-shadow: 0 0.2em 0 var(--gfx-line); }
.gfx-lobby-cast { flex-basis: 100%; display: flex; flex-wrap: wrap; justify-content: center; gap: 0.4em; }
.gfx-lobby-cast button[aria-pressed="false"] { opacity: 0.55; background: var(--gfx-ink); }
.gfx-lobby-cast button[aria-pressed="true"] { background: var(--gfx-pick); }
.gfx-lobby:not([data-edit]) .gfx-lobby-tools button:not([data-edit-toggle]) { display: none; }
.gfx-lobby-floor { position: absolute; inset: 0; z-index: 420; pointer-events: none; }
.gfx-lobby-floor svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.gfx-lobby-floor polygon { fill: color-mix(in srgb, var(--gfx-pick) 22%, transparent); stroke: var(--gfx-accent); stroke-width: 0.45; stroke-dasharray: 1.2 0.8; vector-effect: non-scaling-stroke; }
.gfx-lobby-floor line { stroke: color-mix(in srgb, var(--gfx-line) 68%, transparent); stroke-width: 0.3; stroke-dasharray: 0.8 0.7; vector-effect: non-scaling-stroke; }
.gfx-lobby-floor [data-floor-handle] { position: absolute; width: calc(var(--f, 10px) * 2.25); aspect-ratio: 1; translate: -50% -50%; pointer-events: auto;
  display: grid; place-items: center; padding: 0; border: 2.5px solid var(--gfx-line); border-radius: 50%; color: var(--gfx-text); background: var(--gfx-card);
  font: 700 calc(var(--f, 10px) * 0.82)/1 "Jua", "Malgun Gothic", sans-serif; box-shadow: 0 0.18em 0 var(--gfx-line); cursor: grab; touch-action: none; }
.gfx-lobby-floor [data-floor-handle="vp"] { width: calc(var(--f, 10px) * 2.8); background: var(--gfx-pick); }
.gfx-lobby-floor [data-floor-handle]:active { cursor: grabbing; scale: 1.08; }
.gfx-lobby[data-floor-edit] .who { pointer-events: none; outline-color: color-mix(in srgb, var(--gfx-line) 22%, transparent); opacity: 0.72; }
.gfx-lobby:not([data-floor-edit]) .gfx-lobby-floor { display: none; }

/* ── 7-day attendance ───────────────────────────────────────────────────────────────────────────── */
${AT} .ev-panel[data-gfx-attendance] { position: relative; overflow: visible !important; background-color: var(--gfx-card) !important; padding-right: 15% !important;
  background-image: radial-gradient(color-mix(in srgb, var(--gfx-pick) 45%, transparent) 14%, transparent 15%) !important; background-size: 1.6em 1.6em !important;
  border: 3px solid var(--gfx-line) !important; border-radius: 26px !important; box-shadow: 0 0.4em 0 var(--gfx-line) !important; }
${AT} .ev-panel[data-gfx-attendance] .ev-title { display: inline-block; padding: 0.15em 1em; color: #fff !important; background: var(--gfx-accent); border: 3px solid var(--gfx-line);
  border-radius: 999px; box-shadow: 0 0.15em 0 var(--gfx-line); rotate: -2deg; text-shadow: 0 0.07em 0 color-mix(in srgb, var(--gfx-line) 60%, transparent); }
${AT} .ev-panel[data-gfx-attendance] .ev-day { position: relative; background: #fff !important; border: 2.5px solid var(--gfx-line) !important; border-radius: 16px !important;
  box-shadow: 0 0.22em 0 var(--gfx-line) !important; clip-path: none !important; }
${AT} .ev-panel[data-gfx-attendance] .ev-day .item-art { filter: drop-shadow(0 0.1em 0 color-mix(in srgb, var(--gfx-line) 35%, transparent)); }
${AT} .ev-panel[data-gfx-attendance] .ev-day .tick { display: none !important; }
${AT} .ev-panel[data-gfx-attendance] .ev-day.done { background: color-mix(in srgb, var(--gfx-ink) 80%, #ddd) !important; }
${AT} .ev-panel[data-gfx-attendance] .ev-day.done > *:not(.tick) { opacity: 0.55; }
${AT} .ev-panel[data-gfx-attendance] .ev-day.done::after, ${AT} .ev-panel[data-gfx-attendance] .ev-day.gfx-stamped::after { content: "출석"; position: absolute; left: 50%; top: 42%; width: 62%; aspect-ratio: 1; translate: -50% -50%; rotate: -14deg;
  display: grid; place-items: center; font-family: "Jua", "Malgun Gothic", sans-serif; font-size: 1.15em; color: #E0484E;
  border: 3px solid #E0484E; border-radius: 50%; background: color-mix(in srgb, #fff 55%, transparent); box-shadow: inset 0 0 0 2px color-mix(in srgb, #E0484E 35%, transparent);
  animation: gfx-stamp 420ms cubic-bezier(.3,1.6,.5,1) both; }
@keyframes gfx-stamp { from { scale: 1.8; opacity: 0; } to { scale: 1; opacity: 1; } }
${AT} .ev-panel[data-gfx-attendance] .ev-day.next { border-color: var(--gfx-accent) !important; box-shadow: 0 0.22em 0 var(--gfx-accent), 0 0 0 0.25em color-mix(in srgb, var(--gfx-accent) 25%, transparent) !important;
  animation: gfx-float 1.4s ease-in-out infinite; }
${AT} .ev-panel[data-gfx-attendance] .ev-day.next::before { content: "오늘!"; position: absolute; top: -0.9em; left: 50%; translate: -50% 0; z-index: 2; padding: 0.05em 0.6em;
  font-family: "Jua", "Malgun Gothic", sans-serif; font-size: 0.8em; color: #fff; background: var(--gfx-accent); border: 2px solid var(--gfx-line); border-radius: 999px; white-space: nowrap; }
${AT} .ev-panel[data-gfx-attendance] .ev-day.prize { background: linear-gradient(170deg, #FFF3C4, #FFD97A) !important; border-color: #B8860B !important; }
${AT} .ev-panel[data-gfx-attendance] .ev-n { display: inline-block; margin-top: 0.3em; padding: 0 0.6em; color: var(--gfx-line) !important; background: var(--gfx-pick);
  border: 2px solid var(--gfx-line); border-radius: 999px; font-family: "Jua", "Malgun Gothic", sans-serif; }
${AT} .ev-panel[data-gfx-attendance] .ev-claim { font-family: "Jua", "Malgun Gothic", sans-serif !important; font-size: 1.15em !important; padding: 0.35em 2em !important; color: #fff !important;
  background: var(--gfx-accent) !important; border: 3px solid var(--gfx-line) !important; border-radius: 999px !important; box-shadow: 0 0.25em 0 var(--gfx-line) !important; }
${AT} .ev-panel[data-gfx-attendance] .ev-x { border: 2px solid var(--gfx-line) !important; border-radius: 999px !important; background: var(--gfx-card) !important; box-shadow: 0 0.15em 0 var(--gfx-line) !important; }
.gfx-ev-mascot { position: absolute; right: -3%; bottom: 0; width: 19%; height: 104%; display: grid; place-items: end center; pointer-events: none; z-index: 3; }
.gfx-ev-mascot .body { width: 100%; height: 100%; display: grid; place-items: end center; transform-origin: 50% 100%; animation: gfx-bob 2s ease-in-out infinite; }
/* Baked sprites carry their outline already. */
img.baked { filter: none !important; }
.gfx-ev-mascot img, .gfx-ev-mascot svg { max-width: 150%; max-height: 100%; object-fit: contain; filter: ${STICKER}; }
.gfx-ev-mascot .say { position: absolute; top: 2%; right: 70%; white-space: nowrap; padding: 0.3em 0.8em; font-family: "Jua", "Malgun Gothic", sans-serif;
  color: var(--gfx-text); background: #fff; border: 2.5px solid var(--gfx-line); border-radius: 14px; box-shadow: 0 0.15em 0 var(--gfx-line); }

/* ── Settings pieces this extension adds ───────────────────────────────────────────────────────── */
.st-styles:has(> [data-gfx-set]) { grid-template-columns: repeat(6, minmax(0, 1fr)); }
.st-sty[data-gfx-set] .st-mini i { border: 1.5px solid #6B4528; border-radius: 4px; }
.gfx-colors { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.6em; margin-top: 0.8em; }
.gfx-color { display: flex; align-items: center; gap: 0.5em; padding: 0.35em 0.6em; cursor: pointer;
  border: 2px solid var(--ink-3); border-radius: 12px; background: var(--ink-2); font-size: var(--t-xs, 12px); }
.gfx-color input { width: 2em; height: 1.6em; padding: 0; border: 2px solid var(--steel-dark); border-radius: 8px; background: none; cursor: pointer; }
.gfx-toggles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6em; margin-top: 0.6em; }
.gfx-toggle { display: flex; flex-direction: column; gap: 0.2em; text-align: left; cursor: pointer; padding: 0.6em 0.8em;
  border: 2px solid var(--ink-3); border-radius: 14px; background: var(--ink-2); color: var(--text); font: inherit; }
.gfx-toggle b { font-family: var(--display); font-weight: 400; font-size: var(--t-sm, 13px); }
.gfx-toggle b::before { content: "○ "; }
.gfx-toggle[aria-pressed="true"] { border-color: var(--coral); }
.gfx-toggle[aria-pressed="true"] b::before { content: "● "; color: var(--coral); }
.gfx-toggle span { font-size: var(--t-tiny, 11px); color: var(--steel-faint); line-height: 1.4; }
.gfx-field { display: flex; flex-direction: column; gap: 0.3em; margin-top: 0.7em; font-size: var(--t-xs, 12px); color: var(--steel-faint); }
.gfx-field select, .gfx-field textarea { font: inherit; font-size: var(--t-xs, 12px); color: var(--text); background: var(--surface, #fff);
  border: 2px solid var(--steel-dark); border-radius: 10px; padding: 0.45em 0.6em; }
.gfx-field input { font: inherit; font-size: var(--t-xs, 12px); color: var(--text); background: var(--surface, #fff);
  border: 2px solid var(--steel-dark); border-radius: 10px; padding: 0.4em 0.6em; }
.gfx-settings-nav { display: flex; gap: .5em; position: sticky; top: 0; z-index: 20; padding: .45em; margin: .2em 0 .8em; background: color-mix(in srgb, var(--surface, #fff) 94%, transparent); border: 2px solid var(--ink-3); border-radius: 14px; }
.gfx-settings-nav button { flex: 1 1 0; }
[data-gfx-settings-view="ui"] [data-gfx-section="sd"], [data-gfx-settings-view="sd"] [data-gfx-section="ui"] { display: none !important; }
.gfx-sd-edit { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(18em, 0.75fr); gap: 1em; margin-top: 1em; padding: 0.9em;
  border: 2px dashed var(--coral); border-radius: 16px; background: var(--ink-2); }
.gfx-sd-edit[hidden] { display: none; }
.gfx-cheek-pad { position: relative; height: calc(var(--f, 10px) * 38); display: grid; place-items: center; cursor: crosshair; touch-action: none;
  border-radius: 12px; background: radial-gradient(70% 50% at 50% 80%, color-mix(in srgb, var(--coral) 15%, transparent), transparent 70%), var(--ink); }
.gfx-cheek-pad img { position: absolute; inset: 0; margin: auto; max-width: 100%; max-height: 100%; object-fit: contain; -webkit-user-drag: none; user-select: none; }
.gfx-cheek-pad .mark { position: absolute; aspect-ratio: 1; translate: -50% -50%; border-radius: 50%; pointer-events: none;
  border: 2px dashed var(--coral); background: color-mix(in srgb, var(--coral) 22%, transparent); }
.gfx-sd-edit-side { display: flex; flex-direction: column; gap: 0.2em; min-width: 0; }
.gfx-sd-edit-side > b { font-family: var(--display); font-weight: 400; font-size: var(--t-md, 15px); }
.gfx-field textarea { min-height: 4.2em; resize: vertical; font-family: ui-monospace, Consolas, monospace; }
.gfx-sd-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(9.5em, 1fr)); gap: 0.7em; margin-top: 0.8em; }
.gfx-sd-card { position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.35em; padding: 0.6em;
  border: 2px solid var(--ink-3); border-radius: 14px; background: var(--ink-2); }
.gfx-sd-thumb { width: 100%; aspect-ratio: 1; display: grid; place-items: end center; border-radius: 10px; overflow: hidden;
  background: radial-gradient(80% 60% at 50% 80%, color-mix(in srgb, var(--coral) 18%, transparent), transparent 70%), var(--ink); }
.gfx-sd-thumb img { max-width: 100%; max-height: 100%; object-fit: contain; }
.gfx-sd-thumb img.portrait { width: 100%; height: 100%; object-fit: cover; opacity: 0.35; filter: grayscale(0.6); }
.gfx-sd-card b { font-family: var(--display); font-weight: 400; font-size: var(--t-xs, 12px); text-align: center; line-height: 1.2; }
.gfx-sd-card .st-chips { justify-content: center; }
.gfx-sd-card .st-chip { font-size: var(--t-tiny, 11px); padding: 0.2em 0.7em; }
.gfx-sd-card[data-busy] .gfx-sd-thumb::after { content: "그리는 중…"; position: absolute; inset: 0.6em 0.6em auto; aspect-ratio: 1;
  display: grid; place-items: center; font-family: var(--display); color: var(--coral); background: color-mix(in srgb, var(--ink) 70%, transparent); border-radius: 10px; }

/* Summon screen: cards, banner and pull controls use the same soft outlined language. */
${T} [data-screen="banner"] .bcard { border: 3px solid var(--gfx-line) !important; border-radius: 20px !important; box-shadow: 0 .28em 0 var(--gfx-line) !important; overflow: hidden; }
${T} [data-screen="banner"] .bcard[aria-pressed="true"] { outline: .35em solid color-mix(in srgb, var(--gfx-pick) 75%, transparent); translate: 0 -.15em; }
${T} [data-screen="banner"] .show { border: 3px solid var(--gfx-line); border-radius: 26px; overflow: hidden; box-shadow: 0 .42em 0 var(--gfx-line); }
${T} [data-screen="banner"] .chip, ${T} [data-screen="banner"] .pity, ${T} [data-screen="banner"] .float { border-radius: 999px !important; background: color-mix(in srgb, var(--gfx-card) 92%, transparent) !important; border: 2px solid var(--gfx-line) !important; }
${T} [data-screen="banner"] .pull { border: 3px solid var(--gfx-line) !important; border-radius: 999px !important; background: linear-gradient(180deg, var(--gfx-pick), var(--gfx-accent)) !important; box-shadow: 0 .28em 0 var(--gfx-line) !important; }
${T} [data-screen="reveal"] .rv-card { border: 3px solid var(--gfx-line) !important; border-radius: 22px !important; box-shadow: 0 .35em 0 var(--gfx-line) !important; overflow: hidden; }
${T} [data-screen="reveal"] .rv-foot { background: color-mix(in srgb, var(--gfx-card) 94%, transparent) !important; border-top: 3px solid var(--gfx-line) !important; }
`;

  let sheet = null, varSheet = null;
  function styleSheet() {
    if (!sheet) { sheet = new CSSStyleSheet(); sheet.replaceSync(CSS); }
    return sheet;
  }
  // The picked colours: a second, tiny sheet rewritten on every change.
  let varText = "";
  function paintVars() {
    if (!varSheet) varSheet = new CSSStyleSheet();
    const c = prefs.colors;
    const text = T + " .gf-arena, .gfx-load { " + COLOR_FIELDS.map(([k]) => "--gfx-" + k + ": " + c[k] + ";").join(" ") + " }";
    if (text !== varText) { varText = text; varSheet.replaceSync(text); }
    return varSheet;
  }

  /* ═════════════ Fonts ═════════════
   * The page's CSP allows fonts from this server only, so the rounded fonts come through Marinara's own font
   * library (/api/fonts, files in the data folder). Missing ones fall back to Malgun Gothic until the player
   * fetches them with the button in the colour plate. */
  let fonts = { status: "loading", missing: FONT_FAMILIES.slice(), note: "" };
  const addedFaces = new Set();
  async function loadFonts() {
    try {
      const res = await fetch("/api/fonts", { credentials: "same-origin" });
      const list = res.ok ? await res.json() : [];
      for (const f of Array.isArray(list) ? list : []) {
        if (!FONT_FAMILIES.includes(f.family) || addedFaces.has(f.url)) continue;
        addedFaces.add(f.url);
        const desc = { weight: f.weight || "400", style: f.style || "normal" };
        if (f.unicodeRange) desc.unicodeRange = f.unicodeRange;
        try { document.fonts.add(new FontFace(f.family, "url(" + JSON.stringify(f.url) + ")", desc)); } catch {}
      }
      const have = new Set((Array.isArray(list) ? list : []).map((f) => f.family));
      const missing = FONT_FAMILIES.filter((f) => !have.has(f));
      fonts = { status: missing.length ? "missing" : "ok", missing, note: fonts.note };
    } catch {
      fonts = { status: "error", missing: FONT_FAMILIES.slice(), note: "" };
    }
    paintSettings();
  }
  async function fetchFonts() {
    if (fonts.status === "fetching") return;
    const want = fonts.missing.slice();
    fonts = { ...fonts, status: "fetching", note: "" };
    paintSettings();
    let failed = "";
    for (const family of want) {
      try {
        const res = await fetch("/api/fonts/google/download", {
          method: "POST", credentials: "same-origin",
          headers: JSON_HEADERS, body: JSON.stringify({ family }),
        });
        if (!res.ok && res.status !== 409) failed = ((await res.json().catch(() => null))?.error) || "HTTP " + res.status;
      } catch (e) { failed = e.message; }
    }
    fonts.note = failed ? "일부 글꼴을 받지 못했습니다: " + failed : "";
    await loadFonts();
  }

  /* ═════════════ The game ═════════════ */
  function host() { return document.querySelector(HOST_TAG); }
  function gameRoot() { return host()?.shadowRoot || null; }
  const runId = () => { const h = host(); return h && h._run && h._run.runId ? String(h._run.runId) : ""; };
  async function gf(path, body) {
    const res = await fetch("/api/gacha-forge" + path, {
      method: "POST", credentials: "same-origin", headers: JSON_HEADERS, body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.ok === false) throw Error((data && data.error) || "HTTP " + res.status);
    return data;
  }

  // Per world: the roster (to match portraits to names) and the SD sprites made for it.
  const worlds = new Map(); // runId -> { cards, byPortrait, outfits, sd: {name: {url, variants,...}}, state }
  const pathOf = (u) => { try { return new URL(u, location.origin).pathname; } catch { return String(u || ""); } };
  function world(id = runId()) {
    if (!id) return null;
    let w = worlds.get(id);
    if (!w) { w = { id, cards: [], byPortrait: new Map(), outfits: new Map(), sd: {}, state: "new", busy: new Set(), note: "" }; worlds.set(id, w); }
    return w;
  }
  async function loadWorld(force = false) {
    const w = world();
    if (!w || (!force && w.state !== "new")) return w;
    w.state = "loading";
    try {
      const [ro, stored] = await Promise.all([gf("/roster", { runId: w.id }), storeGet()]);
      w.cards = (ro.cards || []).filter((c) => c && c.kind === "character" && c.name);
      w.byPortrait = new Map(w.cards.filter((c) => c.portrait).map((c) => [pathOf(c.portrait), c.name]));
      const pending = readPending();
      const sd = stored["sd:" + w.id], waiting = pending["sd:" + w.id];
      w.sd = { ...(sd && typeof sd === "object" ? sd : {}), ...(waiting && typeof waiting === "object" ? waiting : {}) };
      if (stored.prefs || pending.prefs) {
        prefs = normalizePrefs({ ...(stored.prefs || {}), ...(pending.prefs || {}) });
        try { localStorage.setItem(CACHE, JSON.stringify(prefs)); } catch {}
      }
      w.state = "ready";
      // SDs drawn but never recorded (the refused saves): find them in the gallery.
      if (w.cards.some((c) => !w.sd[c.name]?.url)) recoverSd(true);
    } catch (e) {
      w.state = "error";
      w.note = "캐릭터 목록을 읽지 못했습니다: " + e.message;
    }
    refresh();
    return w;
  }
  const sdUrl = (name, portrait = "") => {
    const w = world(), e = w && name && w.sd[name];
    const variant = portrait && e?.variants?.[pathOf(portrait)];
    return typeof variant === "string" ? variant : variant?.url || e?.url || "";
  };
  const anySd = () => {
    const w = world();
    if (!w) return [];
    return Object.values(w.sd).flatMap((e) => [e?.url, ...Object.values(e?.variants || {}).map((v) => typeof v === "string" ? v : v?.url)]).filter(Boolean);
  };

  /* ═════════════ Applying ═════════════ */
  function setFlag(h, name, value) {
    if (value) { if (!h.hasAttribute(name)) h.setAttribute(name, ""); }
    else if (h.hasAttribute(name)) h.removeAttribute(name);
  }
  function apply() {
    const h = host(), root = h?.shadowRoot;
    if (!root) return;
    const sheets = root.adoptedStyleSheets, base = styleSheet(), vars = paintVars();
    if (!sheets.includes(base) || !sheets.includes(vars)) {
      root.adoptedStyleSheets = [...sheets.filter((s) => s !== sheet && s !== varSheet), sheet, varSheet];
    }
    if (current) { if (h.getAttribute(ATTR) !== current) h.setAttribute(ATTR, current); }
    else if (h.hasAttribute(ATTR)) h.removeAttribute(ATTR);
    setFlag(h, "data-gfx-box", current && prefs.opts.box);
    setFlag(h, "data-gfx-sticker", current && prefs.opts.sticker);
    setFlag(h, "data-gfx-motion", current && prefs.opts.motion && !matchMedia("(prefers-reduced-motion: reduce)").matches);
    setFlag(h, "data-gfx-field", current && prefs.opts.field);
    setFlag(h, "data-gfx-team", current && prefs.opts.team);
    setFlag(h, "data-gfx-lobby", current && prefs.opts.lobby);
    setFlag(h, "data-gfx-hideplate", current && prefs.opts.lobby && prefs.opts.hidePlate);
    setFlag(h, "data-gfx-attend", current && prefs.opts.attend);
  }

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const MOCHI = '<svg class="gfx-mochi" viewBox="0 0 120 118" aria-hidden="true"><path class="stem" d="M60 30 Q57 16 66 10"/>'
    + '<path class="leaf" d="M66 10 Q78 0 88 8 Q78 18 66 10 Z"/><path class="body" d="M14 86 Q10 32 60 30 Q110 32 106 86 Q104 112 60 112 Q16 112 14 86 Z"/>'
    + '<ellipse class="eye" cx="44" cy="70" rx="5.5" ry="7.5"/><ellipse class="eye" cx="76" cy="70" rx="5.5" ry="7.5"/>'
    + '<circle class="shine" cx="46" cy="67" r="2"/><circle class="shine" cx="78" cy="67" r="2"/>'
    + '<ellipse class="blush" cx="32" cy="84" rx="8" ry="5"/><ellipse class="blush" cx="88" cy="84" rx="8" ry="5"/>'
    + '<path class="mouth" d="M53 82 Q60 89 67 82"/></svg>';
  function heroNode(url) {
    if (url) { const i = el("img"); i.alt = ""; i.draggable = false; setSprite(i, url, false); return i; }
    const s = el("span"); s.innerHTML = MOCHI; return s.firstChild;
  }

  /* ── Baked sprites ──
   * The white sticker outline used to be five stacked drop-shadow filters on every sprite, redrawn each frame
   * while the sprite moves — the cost behind a choppy lobby. Instead each SD is drawn once into a canvas with
   * the outline and a soft under-shadow, scaled down to what the screens need, and kept as a blob: URL. */
  const bakedMap = new Map(); // raw url -> { url, px, py } | "pending" | "failed"
  const BAKE_H = 760;
  let bakeQueue = Promise.resolve();
  function bakeInfo(url) {
    const b = bakedMap.get(url);
    if (b === undefined) bake(url);
    return b && typeof b === "object" ? b : null;
  }
  function bake(url) {
    bakedMap.set(url, "pending");
    const job = () => bakeNow(url);
    bakeQueue = bakeQueue.then(job, job);
    return bakeQueue;
  }
  async function bakeNow(url) {
    try {
      const im = new Image();
      im.src = url;
      await im.decode();
      const sc = Math.min(1, BAKE_H / im.naturalHeight), W = Math.round(im.naturalWidth * sc), Hh = Math.round(im.naturalHeight * sc);
      const r = Math.max(2, Math.round(Hh * 0.004)), pad = r * 3;
      const cw = W + pad * 2, ch = Hh + pad * 2;
      const sil = document.createElement("canvas");
      sil.width = cw; sil.height = ch;
      const sx = sil.getContext("2d");
      sx.drawImage(im, pad, pad, W, Hh);
      const rawAlpha = sx.getImageData(0, 0, cw, ch);
      sx.globalCompositeOperation = "source-in";
      sx.fillStyle = "#fff";
      sx.fillRect(0, 0, cw, ch);
      const out = document.createElement("canvas");
      out.width = cw; out.height = ch;
      const ox = out.getContext("2d");
      // The under-shadow: the silhouette, tinted, a little lower.
      ox.save();
      ox.globalAlpha = 0.4;
      ox.filter = "brightness(0.35) sepia(1) saturate(2.2) hue-rotate(-20deg)";
      ox.drawImage(sil, 0, r * 2.2);
      ox.restore();
      for (let a = 0; a < 16; a++) ox.drawImage(sil, Math.cos((a / 16) * Math.PI * 2) * r, Math.sin((a / 16) * Math.PI * 2) * r);
      ox.drawImage(im, pad, pad, W, Hh);
      // Trim the empty margin, so the feet are the picture's bottom edge; keep how much of the drawn picture
      // the character fills (hf), so a small character stays small instead of being blown up to the box.
      // Measured on the raw art (the silhouette before its outline), counting only clearly drawn pixels and
      // only rows and columns with enough of them: generated art leaves faint specks (sparkles, dust) near the
      // edges, and those used to hold the trim at the very bottom, so small characters still floated.
      const sx0 = rawAlpha.data;
      const rowN = new Uint32Array(ch), colN = new Uint32Array(cw);
      for (let y = 0; y < ch; y++) {
        const row = y * cw * 4;
        for (let x = 0; x < cw; x++) if (sx0[row + x * 4 + 3] > 128) { rowN[y]++; colN[x]++; }
      }
      const minRow = Math.max(3, Math.round(W * 0.008)), minCol = Math.max(3, Math.round(Hh * 0.004));
      let y0 = 0, y1 = ch - 1, x0 = 0, x1 = cw - 1;
      while (y0 < ch - 1 && rowN[y0] < minRow) y0++;
      while (y1 > y0 && rowN[y1] < minRow) y1--;
      while (x0 < cw - 1 && colN[x0] < minCol) x0++;
      while (x1 > x0 && colN[x1] < minCol) x1--;
      // Room for the outline all round, and for the soft shadow under the feet.
      const m = Math.ceil(r * 1.5);
      x0 = Math.max(0, x0 - m); x1 = Math.min(cw - 1, x1 + m); y0 = Math.max(0, y0 - m); y1 = Math.min(ch - 1, y1 + Math.ceil(r * 3));
      const kw = x1 - x0 + 1, kh = y1 - y0 + 1;
      const crop = document.createElement("canvas");
      crop.width = kw; crop.height = kh;
      crop.getContext("2d").drawImage(out, -x0, -y0);
      const blob = await new Promise((res) => crop.toBlob(res, "image/png"));
      if (!blob) throw Error("no blob");
      // A point of the raw art (0–1) lands at (ox + x·mx, oy + y·my) of the baked one.
      const info = { url: URL.createObjectURL(blob), mx: W / kw, ox: (pad - x0) / kw, my: Hh / kh, oy: (pad - y0) / kh, hf: Math.min(1, kh / Hh) };
      bakedMap.set(url, info);
      // Every sprite already on screen with the raw art swaps to the baked one in place: no rebuild, no restart.
      for (const img of gameRoot()?.querySelectorAll("img[data-raw]") || []) if (img.dataset.raw === url) setSprite(img, url, img.style.scale === "-1 1");
    } catch {
      bakedMap.set(url, "failed");
    }
  }
  // Which character an SD picture belongs to (for its 키).
  function refreshSprites() {
    for (const img of gameRoot()?.querySelectorAll("img[data-raw]") || []) setSprite(img, img.dataset.raw, img.style.scale === "-1 1");
    for (const box of gameRoot()?.querySelectorAll(".gfx-lobby .who") || []) { const i = box.querySelector("img"); if (i) box.style.setProperty("--hf", i.style.getPropertyValue("--hf") || "1"); }
  }
  function nameOfUrl(url) {
    const w = world();
    if (!w || !url) return "";
    for (const [n, e] of Object.entries(w.sd)) {
      if (e && e.url === url) return n;
      if (Object.values(e?.variants || {}).some((v) => (typeof v === "string" ? v : v?.url) === url)) return n;
    }
    return "";
  }
  function setSprite(img, url, flip) {
    const b = url ? bakeInfo(url) : null;
    const src = b ? b.url : url;
    if (img.getAttribute("src") !== src) img.setAttribute("src", src);
    img.classList.toggle("baked", !!b);
    for (const k of ["mx", "ox", "my", "oy", "hf"]) { if (b) img.dataset[k] = String(b[k]); else delete img.dataset[k]; }
    // The character's own height: rules size sprites as a share of their box times --hf.
    const tall = Number(sdEntry(nameOfUrl(url)).tall) || 1;
    const hf = String(+((b ? b.hf : 1) * tall).toFixed(3));
    if (img.style.getPropertyValue("--hf") !== hf) img.style.setProperty("--hf", hf);
    if (b && img.parentElement?.closest) { const box = img.closest(".gfx-lobby .who, .gfx-vn-cast .who"); if (box && box.style.getPropertyValue("--hf") !== hf) box.style.setProperty("--hf", hf); }
    if (img.dataset.raw !== url) img.dataset.raw = url;
    const scale = flip ? "-1 1" : "";
    if (img.style.scale !== scale) img.style.scale = scale;
  }
  // Which way the art faces (set per SD in its editor); a sprite is mirrored when it should face the other way.
  const faceOf = (name) => { const f = sdEntry(name).face; return f === "left" || f === "front" ? f : "right"; };
  const needFlip = (name, want) => { const f = faceOf(name); return f !== "front" && !!want && f !== want; };

  /* ── Story and battle sprites ── */
  function nameFromImg(img) {
    const w = world();
    return w && img && img.getAttribute("src") ? w.byPortrait.get(pathOf(img.getAttribute("src"))) || "" : "";
  }
  function placeSd(container, url, flip = false) {
    let img = container.querySelector(":scope > img.gfx-sd");
    if (!url) { if (img) img.remove(); if (container.hasAttribute("data-gfx-sd")) container.removeAttribute("data-gfx-sd"); return; }
    if (!img) { img = el("img", "gfx-sd"); img.alt = ""; img.draggable = false; container.append(img); }
    setSprite(img, url, flip);
    if (!container.hasAttribute("data-gfx-sd")) container.setAttribute("data-gfx-sd", "");
  }
  function paintSprites(root) {
    const on = !!current;
    const whoEl = root.querySelector(".vn-who");
    const who = whoEl && !whoEl.hasAttribute("data-narration") ? whoEl.textContent.replace(/\s*\(.*?\)\s*$/, "").trim() : "";
    const plates = Array.from(root.querySelectorAll(".vn-plate"));
    const snapshot = storySnapshot(root, whoEl && whoEl.hasAttribute("data-narration") ? "" : who);
    const replaced = new Set(snapshot.slots.map((s) => s.plate).filter(Boolean));
    // Only portraits represented by the reconciled current cast step aside. CG and closed slots stay untouched.
    for (const plate of plates) {
      const has = on && prefs.opts.storySd && snapshot.mode === "dialogue" && replaced.has(plate);
      plate.querySelector(":scope > img.gfx-sd")?.remove();
      if (has !== plate.hasAttribute("data-gfx-sd")) { if (has) plate.setAttribute("data-gfx-sd", ""); else plate.removeAttribute("data-gfx-sd"); }
    }
    paintVnCast(root, on && prefs.opts.storySd, whoEl && whoEl.hasAttribute("data-narration") ? "" : who, snapshot);
    const field = on && prefs.opts.field;
    for (const card of root.querySelectorAll(".cbt")) {
      let url = "", name = "";
      if (on && (prefs.opts.battleSd || field)) {
        name = nameFromImg(card.querySelector(".ava-photo")) || (card.querySelector(".nm")?.textContent || "").trim();
        url = sdUrl(name, card.querySelector(".ava-photo")?.getAttribute("src") || "");
      }
      // Allies look toward the foes on the right, foes toward the left.
      if (url || card.hasAttribute("data-gfx-sd")) placeSd(card, url, url && needFlip(name, card.classList.contains("enemy") ? "left" : "right"));
      // On the field, a foe with no art of its own is a mochi monster in its element's colour.
      const foe = field && !url && card.classList.contains("enemy") && !card.querySelector(".ava-photo");
      placeFoe(card, foe ? card.getAttribute("data-aff") || "" : null);
    }
    for (const arena of root.querySelectorAll(".arena")) {
      const tiles = arena.querySelector(":scope > .gfx-tiles");
      if (field && !tiles) {
        const t = el("div", "gfx-tiles");
        for (let i = 0; i < 24; i++) t.append(el("i"));
        const shade = arena.querySelector(":scope > .cb-shade");
        if (shade) shade.after(t); else arena.prepend(t);
      } else if (!field && tiles) tiles.remove();
    }
    paintScroll(root, on && prefs.opts.autoScroll);
    paintTeam(root, on && prefs.opts.team);
    paintLobby(root, on && prefs.opts.lobby);
    paintAttend(root, on && prefs.opts.attend);
    // World creation: the mascot in place of the emblem.
    for (const center of root.querySelectorAll(".forge-center")) {
      const has = center.querySelector(":scope > .gfx-forge-mascot");
      if (on && !has) { const m = el("div", "gfx-forge-mascot"); m.append(heroNode(pick(anySd()))); center.prepend(m); }
      else if (!on && has) has.remove();
    }
  }
  const pick = (list) => (list.length ? list[Math.floor(Math.random() * list.length)] : "");

  /* ── Story lists open at the latest entry ──
   * Once per visit to the chapter list or a chapter's map, the list scrolls so the next thing to play (the
   * chapter with 계속, the node with 플레이) sits in the middle. A list the player has already scrolled is left
   * alone, and the game keeps that position across its own redraws. */
  let scrolledFor = "", scrolledBox = null, scrolledAt = 0;
  function paintScroll(root, enabled) {
    const h = host();
    const view = h && h._hudView;
    const spots = { chapters: [".sel-scroll", ".btn-go", ".btn-enter"], chapter: [".cap-scroll", "[data-play]", "[data-replay]"] };
    const spot = spots[view];
    if (!enabled || !spot) { if (!spot) scrolledFor = ""; return; }
    const key = view + ":" + (view === "chapter" ? String(h._planChapter ?? "") + ":" + (h._difficulty || "") : "");
    const box = root.querySelector(spot[0]);
    if (scrolledFor === key && (box === scrolledBox || !box || box.scrollTop > 8 || performance.now() - scrolledAt > 4000)) return;
    if (!box || box.scrollHeight <= box.clientHeight + 4) return;
    let target = root.querySelector(spot[1]);
    if (!target) { const all = root.querySelectorAll(spot[2]); target = all[all.length - 1]; }
    if (!target) return;
    if (scrolledFor !== key && box.scrollTop > 8) { scrolledFor = key; scrolledBox = box; return; }
    scrolledFor = key; scrolledBox = box; scrolledAt = performance.now();
    const row = target.closest(".node-row, .node, .ch, li, article") || target;
    const top = row.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    box.scrollTo({ top: Math.max(0, top - box.clientHeight / 2 + row.getBoundingClientRect().height / 2), behavior: "smooth" });
  }

  /* ── Story cast line-up (Trickcal manner) ──
   * The current open portrait slots are authoritative. Closed slots leave immediately, unknown full-frame art
   * is treated as CG, and characters without an SD use a contained portrait card in the same stage. */
  const MAX_STORY_CAST = 3;
  const vnCast = { renderedKey: "" };
  const CAST_X = { 1: [50], 2: [31, 69], 3: [18, 50, 82] };
  function activePlateImage(plate) {
    const front = plate.getAttribute("data-front") || "a";
    return plate.querySelector('.vn-art[data-art="' + front + '"] > img') || plate.querySelector(".vn-art img, img");
  }
  function storySnapshot(root, speaker) {
    const vn = root.querySelector(".vn");
    if (!vn) return { mode: "none", sceneKey: "", slots: [] };
    const choiceActive = !!vn.querySelector(".vn-choices:not([hidden]), .vn-choice:not([hidden]), [data-choice]:not([hidden]), .choices:not([hidden])");
    const open = Array.from(vn.querySelectorAll('.vn-plate[data-open="true"]'));
    const vr = vn.getBoundingClientRect();
    const largeUnknownArt = open.some((plate) => {
      const image = activePlateImage(plate), pr = plate.getBoundingClientRect();
      return image && !nameFromImg(image) && vr.width > 0 && vr.height > 0 && pr.width > vr.width * 0.55 && pr.height > vr.height * 0.55;
    });
    const cgActive = vn.hasAttribute("data-cg") || largeUnknownArt || !!vn.querySelector('.vn-cg:not([hidden]), .vn-illustration:not([hidden]), .scene-cg:not([hidden]), [data-illustration]:not([hidden]), .vn-art-full:not([hidden])');
    const mode = choiceActive ? "choice" : cgActive ? "cg" : "dialogue";
    const slots = [];
    if (mode === "dialogue") {
      for (const [i, plate] of open.entries()) {
        const image = activePlateImage(plate);
        const portrait = image?.getAttribute("src") || "";
        const exact = nameFromImg(image);
        const name = exact || (open.length === 1 ? speaker : "");
        if (!name || slots.some((s) => s.name === name)) continue;
        const w = world(), base = w?.cards.find((c) => c.name === name)?.portrait || "";
        if (w && portrait && pathOf(portrait) !== pathOf(base)) {
          if (!w.outfits.has(name)) w.outfits.set(name, new Set());
          w.outfits.get(name).add(pathOf(portrait));
        }
        slots.push({ id: plate.getAttribute("data-side") || String(i), name, portrait, plate });
      }
      if (!slots.length && speaker && sdUrl(speaker)) slots.push({ id: "speaker", name: speaker, portrait: "", plate: null });
    }
    const bgImage = root.querySelector(".vn-scene .vn-bg[data-on] img, .vn-scene img, .vn-bg img, .vn-back img, [data-background] img");
    const bgBox = root.querySelector(".vn-scene .vn-bg[data-on], .vn-scene .vn-bg, .vn-bg, .vn-back, [data-background]");
    const bg = bgImage?.getAttribute("src") || bgBox?.style.backgroundImage || (bgBox ? getComputedStyle(bgBox).backgroundImage : "") || "";
    const caption = (root.querySelector(".vn-caption")?.textContent || "").trim();
    return { mode, sceneKey: caption + "|" + bg, slots: slots.slice(-MAX_STORY_CAST) };
  }
  function clampCastPosition(layer, node) {
    if (!layer.clientWidth || !node.offsetWidth) return;
    const wanted = Number(node.dataset.x) || 50;
    const scale = Number(getComputedStyle(node).getPropertyValue("--hf")) || 1;
    const half = Math.min(45, (node.offsetWidth * scale / layer.clientWidth) * 50 + 1);
    node.style.left = clamp(wanted, half, 100 - half).toFixed(2) + "%";
  }
  function paintVnCast(root, enabled, speaker, snapshot = storySnapshot(root, speaker)) {
    const vn = root.querySelector(".vn");
    const stage = vn?.querySelector(":scope > .vn-stage") || vn;
    let layer = stage && stage.querySelector(":scope > .gfx-vn-cast");
    if (!vn || !enabled || snapshot.mode !== "dialogue" || !snapshot.slots.length) {
      layer?.remove();
      vnCast.renderedKey = "";
      return;
    }
    if (!layer) {
      layer = el("div", "gfx-vn-cast");
      stage.prepend(layer);
    }
    const slots = snapshot.slots;
    const key = snapshot.sceneKey + "|" + snapshot.mode + "|" + speaker + "|" + slots.map((s) => [s.id, s.name, s.portrait, sdUrl(s.name, s.portrait)].join("~")).join(";");
    if (layer.getAttribute("data-key") === key) return;
    layer.setAttribute("data-key", key);
    vnCast.renderedKey = key;
    const xs = CAST_X[slots.length] || [];
    const ids = new Set(slots.map((s) => s.id));
    for (const n of layer.querySelectorAll(":scope > .who")) if (!ids.has(n.getAttribute("data-slot"))) n.remove();
    slots.forEach((slot, i) => {
      const name = slot.name;
      let n = Array.from(layer.children).find((x) => x.getAttribute("data-slot") === slot.id);
      if (!n) {
        n = el("div", "who");
        n.setAttribute("data-slot", slot.id);
        n.setAttribute("data-name", name);
        const body = el("div", "body"), img = el("img");
        img.alt = name;
        img.draggable = false;
        body.style.animationDelay = (-(performance.now() / 1000) % 3.4).toFixed(2) + "s";
        body.append(img);
        n.append(body);
        layer.append(n);
      }
      n.setAttribute("data-name", name);
      n.dataset.x = String(xs[i]);
      n.style.left = xs[i] + "%";
      const im = n.querySelector("img");
      const sd = sdUrl(name, slot.portrait);
      im.classList.toggle("portrait", !sd);
      if (sd) setSprite(im, sd, needFlip(name, xs[i] < 50 ? "right" : xs[i] > 50 ? "left" : ""));
      else {
        if (im.getAttribute("src") !== slot.portrait) im.src = slot.portrait;
        im.style.scale = "";
        n.style.setProperty("--hf", "1");
      }
      const fit = () => {
        if (im.naturalWidth && im.naturalHeight) n.style.aspectRatio = im.naturalWidth + " / " + im.naturalHeight;
        requestAnimationFrame(() => clampCastPosition(layer, n));
      };
      if (im.complete) fit(); else im.addEventListener("load", fit, { once: true });
      const speaking = name === speaker;
      if (speaking !== n.hasAttribute("data-speaking")) {
        if (speaking) { n.setAttribute("data-speaking", ""); n.removeAttribute("data-hop"); void n.offsetWidth; n.setAttribute("data-hop", ""); }
        else n.removeAttribute("data-speaking");
      }
    });
  }

  /* ── Mochi foes ── */
  // Mushroom foes, the cap in the element's colour (the Trickcal field's little monsters).
  const AFF_FILL = { fire: "#F2884B", water: "#6FB2F2", wind: "#7FD39A", earth: "#D9A04E", light: "#F7CF4A", dark: "#A07FE0" };
  function foeSvg(aff) {
    const cap = AFF_FILL[aff] || "#F2884B";
    return '<svg class="gfx-mochi" viewBox="0 0 120 120" aria-hidden="true">'
      + '<path class="body" d="M30 70 Q28 112 60 112 Q92 112 90 70 Z"/>'
      + '<path class="body" style="fill:' + cap + '" d="M8 70 Q8 18 60 16 Q112 18 112 70 Q60 82 8 70 Z"/>'
      + '<ellipse class="shine" cx="38" cy="38" rx="9" ry="6" style="opacity:.7"/><ellipse class="shine" cx="80" cy="34" rx="6" ry="4.5" style="opacity:.7"/>'
      + '<ellipse class="shine" cx="62" cy="52" rx="5" ry="3.5" style="opacity:.55"/>'
      + '<ellipse class="eye" cx="48" cy="88" rx="4.5" ry="6"/><ellipse class="eye" cx="72" cy="88" rx="4.5" ry="6"/>'
      + '<circle class="shine" cx="49.5" cy="86" r="1.6"/><circle class="shine" cx="73.5" cy="86" r="1.6"/>'
      + '<ellipse class="blush" cx="38" cy="98" rx="6" ry="3.5"/><ellipse class="blush" cx="82" cy="98" rx="6" ry="3.5"/>'
      + '<path class="mouth" d="M55 99 Q60 103 65 99"/></svg>';
  }
  function placeFoe(card, aff) {
    let n = card.querySelector(":scope > .gfx-foe");
    if (aff === null) { if (n) n.remove(); if (card.hasAttribute("data-gfx-foe")) card.removeAttribute("data-gfx-foe"); return; }
    if (!n || n.getAttribute("data-aff") !== aff) {
      n?.remove();
      n = el("span", "gfx-foe");
      n.setAttribute("data-aff", aff);
      n.innerHTML = foeSvg(aff);
      card.append(n);
    }
    if (!card.hasAttribute("data-gfx-foe")) card.setAttribute("data-gfx-foe", "");
  }

  /* ── Team: formation slots and the briefing before a battle ── */
  function paintTeam(root, enabled) {
    for (const slot of root.querySelectorAll(".slot")) {
      const art = slot.querySelector(".slot-art img"), name = nameFromImg(art);
      const url = enabled && slot.classList.contains("filled") ? sdUrl(name, art?.getAttribute("src") || "") : "";
      if (url || slot.hasAttribute("data-gfx-sd")) placeSd(slot, url);
    }
    // The result screen after a win: the team that fought, jumping for joy.
    for (const verdict of root.querySelectorAll('[data-screen="result"] .rs-verdict')) {
      const screen = verdict.parentElement;
      let row = screen.querySelector(":scope > .gfx-team");
      const won = !verdict.closest(".root.lose");
      const members = enabled && won ? Array.from(screen.querySelectorAll(".rs-b-row .nm")).map((n) => ({ name: n.textContent.trim(), url: sdUrl(n.textContent.trim()) })).filter((x) => x.url) : [];
      const key = members.map((x) => x.url).join("|");
      if (row && row.getAttribute("data-key") === key) continue;
      row?.remove();
      if (!members.length) continue;
      row = el("div", "gfx-team win");
      row.setAttribute("data-key", key);
      members.forEach((member, i) => { const sp = el("span"), im = el("img"); setSprite(im, member.url, false); im.style.setProperty("--hf", String(Number(sdEntry(member.name).tall) || 1)); im.alt = ""; sp.style.animationDelay = (-i * 0.18).toFixed(2) + "s"; sp.append(im); row.append(sp); });
      verdict.after(row);
    }
    for (const brief of root.querySelectorAll(".briefing")) {
      let row = brief.querySelector(":scope > .gfx-team");
      if (!enabled) { row?.remove(); continue; }
      const team = Array.from(root.querySelectorAll(".side.allies .cbt")).map((c) => {
        const img = c.querySelector(".ava-photo");
        const name = nameFromImg(img) || (c.querySelector(".nm")?.textContent || "").trim();
        const portrait = img?.getAttribute("src") || "";
        return { name, url: sdUrl(name, portrait), portrait };
      }).filter((t) => t.url || t.portrait);
      const key = team.map((t) => t.url || t.portrait).join("|");
      if (row && row.getAttribute("data-key") === key) continue;
      row?.remove();
      if (!team.length) continue;
      row = el("div", "gfx-team");
      row.setAttribute("data-key", key);
      for (const t of team) {
        const s = el("span"), i = el("img", t.url ? "" : "portrait");
        if (t.url) { setSprite(i, t.url, false); i.style.setProperty("--hf", String(Number(sdEntry(t.name).tall) || 1)); }
        else i.src = t.portrait;
        i.alt = "";
        s.append(i);
        row.append(s);
      }
      const start = brief.querySelector(".fstart");
      if (start) start.before(row); else brief.append(row);
    }
  }

  /* ── Lines and cheeks, kept per character with its SD entry ──
   * sd[name] = { url, at, lines: [3], pinch: "", cheeks: [{x, y}] (0–1 of the image), cheekR (share of its width) } */
  const PINCH_LINES = ["아야야!", "볼 늘리지 마~!", "으에에…", "말랑하다고 막 당기기야?!"];
  const sdEntry = (name) => { const w = world(); return (w && name && w.sd[name]) || {}; };
  const linesFor = (name) => { const l = sdEntry(name).lines; return Array.isArray(l) && l.filter(Boolean).length ? l.filter(Boolean) : LOBBY_LINES; };
  const pinchFor = (name) => sdEntry(name).pinch || pick(PINCH_LINES);
  const cheeksOf = (name) => { const c = sdEntry(name).cheeks; return Array.isArray(c) && c.length ? c : null; };
  const cheekR = (name) => { const r = Number(sdEntry(name).cheekR); return r > 0 ? r : 0.04; };
  async function saveSdEntry(name, patch) {
    const w = world();
    if (!w) return;
    w.sd = { ...w.sd, [name]: { ...(w.sd[name] || {}), ...patch } };
    if (!(await storePatch({ ["sd:" + w.id]: w.sd }))) w.note = "이 브라우저에 보관했습니다. 서버 기록은 다시 시도합니다 (" + lastStoreError + ").";
  }
  function talk(who, text, ms = 2400) {
    who.querySelector(":scope > .say")?.remove();
    const say = el("span", "say", text);
    who.setAttribute("data-talk", "");
    who.append(say);
    setTimeout(() => { say.remove(); if (!who.querySelector(":scope > .say")) who.removeAttribute("data-talk"); }, ms);
  }

  /* ── Cheek pinch ──
   * Pressing near a cheek point swaps the sprite for a canvas copy whose cheek follows the pointer, the skin
   * round it stretching smoothly after it (see render). Letting go springs it back with a wobble. */
  function mirroredIn(node, stop) {
    let m = false;
    for (let n = node; n && n !== stop; n = n.parentElement) { const t = getComputedStyle(n).transform; if (t && t.startsWith("matrix(-")) m = !m; }
    return m;
  }
  function startPinch(img, e, cheeks, rFrac, stop, done, allowFree = true) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    // No cheek set for this SD: any press in the top part (the head of a chibi) pinches right where it lands.
    if (!cheeks || !cheeks.length) {
      if (!allowFree) return false;
      const b0 = img.getBoundingClientRect();
      const fy = (e.clientY - b0.top) / b0.height;
      if (!b0.height || fy < 0.08 || fy > 0.55) return false;
      cheeks = [{ x: 0.5, y: fy, free: true }];
      rFrac = Math.max(rFrac, 0.04);
      img.dataset.freePinch = "1";
    } else delete img.dataset.freePinch;
    const mx = Number(img.dataset.mx), my = Number(img.dataset.my), ox = Number(img.dataset.ox) || 0, oy = Number(img.dataset.oy) || 0;
    if (mx && my && !cheeks[0].free) { cheeks = cheeks.map((c) => ({ x: ox + c.x * mx, y: oy + c.y * my })); rFrac *= mx; }
    const box = img.getBoundingClientRect();
    if (!box.width || !box.height) return false;
    const mirrored = mirroredIn(img, stop);
    const lx = mirrored ? box.right - e.clientX : e.clientX - box.left, ly = e.clientY - box.top;
    const rPx = rFrac * box.width;
    let best = null, bestD = Infinity;
    for (const c of cheeks) { const d = c.free ? 0 : Math.hypot(c.x * box.width - lx, c.y * box.height - ly); if (d < bestD) { bestD = d; best = c; } }
    if (!best || bestD > rPx * 1.6) return false;
    if (best.free) best = { x: lx / box.width, y: ly / box.height };
    const w = img.offsetWidth, h = img.offsetHeight, sc = box.width / w;
    const dpr = Math.min(2, window.devicePixelRatio || 1), cw = Math.max(1, Math.round(w * dpr)), ch = Math.max(1, Math.round(h * dpr));
    const canvas = el("canvas", "gfx-pinch");
    canvas.width = cw; canvas.height = ch;
    canvas.style.cssText = "position:absolute;left:" + img.offsetLeft + "px;top:" + img.offsetTop + "px;width:" + w + "px;height:" + h + "px;pointer-events:none;filter:" + getComputedStyle(img).filter;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let src;
    try { ctx.drawImage(img, 0, 0, cw, ch); src = ctx.getImageData(0, 0, cw, ch); } catch { return false; }
    const out = ctx.createImageData(cw, ch);
    // The skin moves with the finger: a point q of the original art goes to q + d·g(|q − c|), g a gaussian
    // round the cheek. Each output pixel p finds the q that lands on it (q = p − d·g(|q − c|), a few fixed-point
    // steps; it converges while |d| stays under ~1.6σ, so the pull is soft-limited there) and is read with
    // bilinear filtering. Far from the cheek g is ~0 and the face stays exactly as drawn.
    // The gaussian is an ellipse turned along the pull: long that way (the stretch), narrow across it, so an
    // eye or mouth beside the cheek barely moves.
    const cx = best.x * cw, cy = best.y * ch, R = rFrac * cw, sig = R * 1.3, sigQ = R * 0.85, maxLen = sig * 1.55;
    const invP = 1 / (2 * sig * sig), invQ = 1 / (2 * sigQ * sigQ);
    const s = src.data, o = out.data;
    function sample(qx, qy, oi) {
      const x0 = Math.floor(qx), y0 = Math.floor(qy), fx = qx - x0, fy = qy - y0;
      const xa = Math.min(cw - 1, Math.max(0, x0)), xb = Math.min(cw - 1, Math.max(0, x0 + 1));
      const ya = Math.min(ch - 1, Math.max(0, y0)), yb = Math.min(ch - 1, Math.max(0, y0 + 1));
      const i00 = (ya * cw + xa) * 4, i10 = (ya * cw + xb) * 4, i01 = (yb * cw + xa) * 4, i11 = (yb * cw + xb) * 4;
      const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
      // Premultiplied by alpha, so the transparent margin does not bleed a dark fringe into the edge.
      const a00 = s[i00 + 3] * w00, a10 = s[i10 + 3] * w10, a01 = s[i01 + 3] * w01, a11 = s[i11 + 3] * w11, a = a00 + a10 + a01 + a11;
      if (a < 0.5) { o[oi + 3] = 0; return; }
      for (let k = 0; k < 3; k++) o[oi + k] = (s[i00 + k] * a00 + s[i10 + k] * a10 + s[i01 + k] * a01 + s[i11 + k] * a11) / a;
      o[oi + 3] = a;
    }
    function render(dx, dy) {
      // Soft limit: past maxLen the cheek keeps giving a little, never tearing.
      const raw = Math.hypot(dx, dy);
      if (raw > 0) { const len = maxLen * Math.tanh(raw / maxLen); dx *= len / raw; dy *= len / raw; }
      const len = Math.hypot(dx, dy);
      o.set(s);
      if (len > 0.3) {
        const ux = dx / len, uy = dy / len;
        const ext = sig * 3;
        const x0 = Math.max(0, Math.floor(Math.min(cx, cx + dx) - ext)), x1 = Math.min(cw - 1, Math.ceil(Math.max(cx, cx + dx) + ext));
        const y0 = Math.max(0, Math.floor(Math.min(cy, cy + dy) - ext)), y1 = Math.min(ch - 1, Math.ceil(Math.max(cy, cy + dy) + ext));
        for (let y = y0; y <= y1; y++) {
          for (let x = x0; x <= x1; x++) {
            let qx = x - dx, qy = y - dy;
            for (let it = 0; it < 5; it++) {
              const ex = qx - cx, ey = qy - cy, pu = ex * ux + ey * uy, pv = ey * ux - ex * uy, g = Math.exp(-(pu * pu * invP + pv * pv * invQ));
              qx = x - dx * g; qy = y - dy * g;
            }
            if (Math.abs(qx - x) < 0.02 && Math.abs(qy - y) < 0.02) continue;
            sample(qx, qy, (y * cw + x) * 4);
          }
        }
      }
      ctx.putImageData(out, 0, 0);
      // A stretched cheek flushes pink — painted only where the art is (source-atop).
      if (len > 0.3) {
        const t = Math.min(1, len / maxLen), gx = cx + dx * 0.7, gy = cy + dy * 0.7;
        const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, R * 1.4);
        grad.addColorStop(0, "rgba(255,120,140," + (0.38 * t).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(255,120,140,0)");
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = grad;
        ctx.fillRect(gx - R * 1.4, gy - R * 1.4, R * 2.8, R * 2.8);
        ctx.restore();
      }
    }
    render(0, 0);
    img.parentElement.append(canvas);
    img.style.visibility = "hidden";
    let dx = 0, dy = 0, frame = 0;
    const move = (ev) => {
      ev.preventDefault();
      dx = ((ev.clientX - e.clientX) / sc) * dpr * (mirrored ? -1 : 1);
      dy = ((ev.clientY - e.clientY) / sc) * dpr;
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; render(dx, dy); });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (frame) cancelAnimationFrame(frame);
      const d0x = dx, d0y = dy, pulled = Math.hypot(dx, dy) > R * 0.35, t0 = performance.now();
      if (!pulled) {
        canvas.remove();
        img.style.visibility = "";
        done && done(false);
        return;
      }
      // Snaps back past the rest point and wobbles out, like dough let go.
      const spring = (now) => {
        const t = now - t0, k = Math.exp(-t / 150) * Math.cos(t / 62);
        render(d0x * k, d0y * k);
        if (t < 760) requestAnimationFrame(spring);
        else { canvas.remove(); img.style.visibility = ""; done && done(pulled); }
      };
      requestAnimationFrame(spring);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    e.preventDefault();
    return true;
  }

  /* ── AI-written lines ──
   * One call to the world's own text connection writes three lobby lines and one pinch reaction per character,
   * from the personality and profile Gacha Forge keeps for each. */
  let linesBusy = false;
  function modelText(v, depth = 0) {
    if (depth > 6 || v == null) return "";
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v.map((x) => modelText(x, depth + 1)).filter(Boolean).join("\n");
    if (typeof v !== "object" || ["reasoning", "thinking", "redacted_thinking"].includes(v.type)) return "";
    for (const k of ["content", "text", "output_text", "output", "response", "message", "choices", "data", "result"]) { const t = modelText(v[k], depth + 1); if (t) return t; }
    return "";
  }
  async function makeLines(onlyMissing) {
    const w = world(), run = host()?._run;
    if (!w || !run || linesBusy) return;
    const targets = w.cards.filter((c) => !onlyMissing || !(Array.isArray(w.sd[c.name]?.lines) && w.sd[c.name].lines.length));
    if (!targets.length) { w.note = "모든 캐릭터에 이미 대사가 있습니다."; paintSettings(); return; }
    linesBusy = true;
    w.note = "캐릭터 대사를 쓰는 중입니다…";
    paintSettings();
    try {
      const units = await Promise.all(targets.map((c) => gf("/unit", { runId: w.id, unitId: c.id }).then((u) => u.unit || {}).catch(() => ({}))));
      const cut = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
      const profiles = targets.map((c, i) => "- " + c.name + " (" + (units[i].role || c.role || "") + ")\n  성격: " + cut(units[i].personality, 400) + "\n  설정: " + cut(units[i].description, 400)).join("\n");
      const system = "너는 트릭컬 리바이브 같은 귀엽고 유쾌한 모바일 수집형 게임의 로비 대사 작가다. 캐릭터마다 성격과 말투를 살려, 로비에서 플레이어가 캐릭터를 눌렀을 때 하는 짧은 대사 3개와, 볼을 꼬집혀 쭉 늘어났을 때의 반응 1개를 한국어로 쓴다. 각 대사는 25자 이내, 이모지·따옴표 없이, 서로 다른 내용으로. 반드시 JSON 하나만 출력한다: {\"캐릭터 이름\": {\"lines\": [\"대사1\", \"대사2\", \"대사3\"], \"pinch\": \"반응\"}}";
      const user = "세계: " + cut(run.name, 80) + "\n" + cut(run.scenario, 600) + "\n\n캐릭터:\n" + profiles;
      const res = await fetch("/api/generate/raw", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "content-type": "application/json", "x-marinara-csrf": "1" },
        body: JSON.stringify({ connectionId: run.connectionId, runId: w.id, streaming: false,
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
          parameters: { maxTokens: 2400, temperature: 0.9 } }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw Error(String(body?.error || body?.message || "HTTP " + res.status));
      const text = modelText(body);
      const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
      let n = 0;
      const next = { ...w.sd };
      for (const c of targets) {
        const got = json[c.name];
        if (!got || !Array.isArray(got.lines)) continue;
        next[c.name] = { ...(next[c.name] || {}), lines: got.lines.map((l) => cut(l, 60)).filter(Boolean).slice(0, 3), pinch: cut(got.pinch, 60) };
        n++;
      }
      w.sd = next;
      await storePatch({ ["sd:" + w.id]: w.sd });
      w.note = n + "명의 대사를 만들었습니다. 편집에서 고칠 수 있습니다.";
    } catch (e) {
      w.note = "대사 만들기 실패: " + e.message;
    } finally {
      linesBusy = false;
      sdEditKey = "";
      linesRev++;
      paintSettings();
    }
  }

  /* ── Home lobby ── */
  let lobbyEdit = false, floorEdit = false, lobbyPicked = "";
  const DEFAULT_FLOOR = { vpX: 50, vpY: 42, backL: 22, backR: 78, backY: 66, frontL: 3, frontR: 97, frontY: 106 };
  function lobbyScene() {
    const w = world(), raw = w && prefs.homeScene[w.id];
    return raw || DEFAULT_FLOOR;
  }
  function setLobbyScene(patch) {
    const w = world();
    if (!w) return;
    prefs.homeScene[w.id] = { ...DEFAULT_FLOOR, ...(prefs.homeScene[w.id] || {}), ...patch };
  }
  function floorBoundsAt(y, scene = lobbyScene()) {
    const t = Math.min(1, Math.max(0, (y - scene.backY) / Math.max(1, scene.frontY - scene.backY)));
    return {
      left: scene.backL + (scene.frontL - scene.backL) * t,
      right: scene.backR + (scene.frontR - scene.backR) * t,
    };
  }
  function clampToFloor(x, y, scene = lobbyScene()) {
    const cy = Math.min(scene.frontY, Math.max(scene.backY, y));
    const edge = floorBoundsAt(cy, scene);
    return { x: Math.min(edge.right, Math.max(edge.left, x)), y: cy };
  }
  function autoFloorPoint(i, n, back) {
    const scene = lobbyScene(), y = back ? scene.backY + (scene.frontY - scene.backY) * 0.35 : scene.frontY - 4;
    const edge = floorBoundsAt(y, scene), t = n === 1 ? 0.5 : 0.08 + (i / (n - 1)) * 0.84;
    return { x: edge.left + (edge.right - edge.left) * t, y };
  }
  function homeCast() {
    const w = world();
    if (!w) return [];
    const mine = prefs.home[w.id] || {};
    const list = w.cards.filter((c) => sdUrl(c.name) && (mine[c.name] ? mine[c.name].on : true));
    return list.map((c, i) => {
      const e = mine[c.name] || {};
      // Two rows: the front row low and large, the back row higher up between them.
      const n = list.length, back = n > 2 && i % 2 === 1;
      const auto = autoFloorPoint(i, n, back);
      const live = lobbyEdit && roam.get(c.name);
      const placed = clampToFloor(live ? live.x : Number.isFinite(e.x) ? e.x : auto.x, live ? live.y : Number.isFinite(e.y) ? e.y : auto.y);
      return { name: c.name, url: sdUrl(c.name), x: placed.x, y: placed.y, s: 1 };
    });
  }
  function setHome(name, patch) {
    const w = world();
    if (!w) return;
    const cast = (prefs.home[w.id] = prefs.home[w.id] || {});
    cast[name] = { on: true, x: NaN, y: NaN, s: 1, ...cast[name], ...patch };
  }
  const SWORDS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6M16 16l4 4M19 21l2-2"/><path d="M9.5 17.5 21 6V3h-3L6.5 14.5"/><path d="m11 19-6-6M8 16l-4 4M5 21l-2-2"/></svg>';
  function paintLobby(root, enabled) {
    // The big story card leaves the lobby; its button lives in the menu row instead, like Trickcal's 전투.
    for (const dock of root.querySelectorAll(".hm-dock")) {
      let tile = dock.querySelector(":scope > .gfx-battle-tile");
      if (!enabled) { tile?.remove(); continue; }
      if (tile) continue;
      tile = el("button", "hm-tile gfx-battle-tile");
      tile.type = "button";
      tile.innerHTML = SWORDS;
      tile.append(el("span", "nm", "전투"));
      on(tile, "click", (e) => { e.stopPropagation(); root.querySelector(".hm-cta")?.click(); });
      dock.append(tile);
    }
    for (const screen of root.querySelectorAll(".hm-screen")) {
      let lobby = screen.querySelector(":scope > .gfx-lobby");
      if (!enabled) { lobby?.remove(); continue; }
      const cast = homeCast();
      const floorKey = Object.values(lobbyScene()).map((v) => Number(v).toFixed(1)).join(",");
      const key = (lobbyEdit ? "E:" + (floorEdit ? "F:" : "C:") + lobbyPicked + ":" : "") + floorKey + ":" + cast.map((c) => [c.name, c.url, c.x.toFixed(1), c.y.toFixed(1), faceOf(c.name)].join(",")).join("|");
      if (lobby && lobby.getAttribute("data-key") === key) continue;
      lobby?.remove();
      lobby = el("div", "gfx-lobby");
      lobby.setAttribute("data-key", key);
      if (lobbyEdit) lobby.setAttribute("data-edit", "");
      if (lobbyEdit && floorEdit) lobby.setAttribute("data-floor-edit", "");
      cast.forEach((c, i) => lobby.append(makeWho(c, i)));
      if (lobbyEdit && floorEdit) lobby.append(floorGuide(lobby));
      lobby.append(lobbyTools());
      const scene = screen.querySelector(":scope > .hm-scene");
      if (scene) scene.after(lobby); else screen.append(lobby);
      startRoam(lobby);
    }
  }
  /* ── Lobby roaming ──
   * Each character wanders the floor round the spot it was given in [배치]: walks to a random point, waits,
   * walks on. The higher its feet stand, the further away it is — smaller, slower, and behind the ones lower
   * down — and it faces the way it walks. State is kept by name, so a lobby the game redraws carries on from
   * where everyone was. Only one transform per character is written per frame; nothing is laid out again. */
  const roam = new Map(); // name -> { x, y, tx, ty, ax, ay, s, face, wait, dir }
  const RANGE = { x: 24, y: 18 };
  let lobbySize = { w: 0, h: 0 }, lobbyRO = null, roamFrame = 0, roamLast = 0;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function depthOf(x, y, scene = lobbyScene()) {
    const bx = (scene.backL + scene.backR) / 2, fx = (scene.frontL + scene.frontR) / 2;
    const dist = Math.hypot((x - scene.vpX) * 0.45, y - scene.vpY);
    const far = Math.hypot((bx - scene.vpX) * 0.45, scene.backY - scene.vpY);
    const near = Math.hypot((fx - scene.vpX) * 0.45, scene.frontY - scene.vpY);
    return clamp((dist - far) / Math.max(1, near - far), 0, 1);
  }
  function roamState(c) {
    let st = roam.get(c.name);
    if (!st) { st = { x: c.x, y: c.y, tx: c.x, ty: c.y, wait: 0.4 + Math.random() * 2.6, dir: Math.random() < 0.5 ? -1 : 1 }; roam.set(c.name, st); }
    // A moved anchor (from [배치]) takes the character there.
    if (st.ax !== undefined && (st.ax !== c.x || st.ay !== c.y)) { st.x = st.tx = c.x; st.y = st.ty = c.y; st.wait = 1 + Math.random() * 2; }
    const safe = clampToFloor(st.x, st.y);
    st.x = safe.x; st.y = safe.y;
    const target = clampToFloor(st.tx, st.ty);
    st.tx = target.x; st.ty = target.y;
    st.ax = c.x; st.ay = c.y; st.s = c.s; st.face = faceOf(c.name);
    return st;
  }
  function placeWho(who, st) {
    const { w, h } = lobbySize;
    if (!w || !h) return;
    const k = st.s * (prefs.lobbyScale || 1) * (0.5 + 0.5 * depthOf(st.x, st.y));
    const transform = "translate(" + ((st.x / 100) * w).toFixed(1) + "px," + ((st.y / 100) * h).toFixed(1) + "px) scale(" + k.toFixed(3) + ") translate(-50%,-100%)";
    if (who.style.transform !== transform) who.style.transform = transform;
    const z = String(Math.round(st.y * 10));
    if (who.style.zIndex !== z) who.style.zIndex = z;
    // Art facing right is mirrored to walk left, art facing left to walk right; front-facing art never turns.
    const flip = st.face === "right" ? st.dir < 0 : st.face === "left" ? st.dir > 0 : false;
    const f = flip ? "scaleX(-1)" : "", fl = who.firstElementChild;
    if (fl && fl.style.transform !== f) fl.style.transform = f;
  }
  function pickTarget(st) {
    const p = clampToFloor(st.ax + (Math.random() * 2 - 1) * RANGE.x, st.ay + (Math.random() * 2 - 1) * RANGE.y);
    st.tx = p.x; st.ty = p.y;
  }
  function roamTick(t) {
    roamFrame = 0;
    const lobby = gameRoot()?.querySelector(".gfx-lobby");
    if (!lobby || disposed) { roamLast = 0; return; }
    const dt = roamLast ? Math.min(0.1, (t - roamLast) / 1000) : 0;
    roamLast = t;
    for (const who of lobby.children) {
      if (!who.classList.contains("who")) continue;
      const st = roam.get(who.getAttribute("data-name"));
      if (!st) continue;
      const busy = lobbyEdit || who.hasAttribute("data-talk") || who.hasAttribute("data-pinch");
      let walking = false;
      if (!busy && dt) {
        if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0) pickTarget(st); }
        else {
          // Depth counts for more than width, so a walk "into" the room is slower on screen, as it should be.
          const dx = st.tx - st.x, dy = (st.ty - st.y) * 1.7, dist = Math.hypot(dx, dy);
          const step = 5.5 * (0.6 + 0.4 * depthOf(st.x, st.y)) * dt;
          if (dist <= step) { st.x = st.tx; st.y = st.ty; st.wait = 1.4 + Math.random() * 3.6; }
          else {
            st.x += (dx / dist) * step;
            st.y += ((dy / dist) * step) / 1.7;
            if (Math.abs(dx) > 0.4) st.dir = dx > 0 ? 1 : -1;
            walking = true;
          }
        }
      }
      if (walking !== who.hasAttribute("data-walk")) { if (walking) who.setAttribute("data-walk", ""); else who.removeAttribute("data-walk"); }
      placeWho(who, st);
    }
    roamFrame = requestAnimationFrame(roamTick);
  }
  function startRoam(lobby) {
    if (!lobbyRO) lobbyRO = new ResizeObserver((entries) => { for (const e of entries) lobbySize = { w: e.contentRect.width, h: e.contentRect.height }; });
    lobbyRO.disconnect();
    lobbyRO.observe(lobby);
    lobbySize = { w: lobby.clientWidth, h: lobby.clientHeight };
    for (const who of lobby.querySelectorAll(":scope > .who")) { const st = roam.get(who.getAttribute("data-name")); if (st) placeWho(who, st); }
    if (!roamFrame) roamFrame = requestAnimationFrame(roamTick);
  }
  function makeWho(c, i) {
    const who = el("div", "who");
    who.setAttribute("data-name", c.name);
    // The idle bob's delay comes from the clock, so a redrawn lobby carries on mid-bob.
    who.style.setProperty("--bdl", (-((performance.now() / 1000 + i * 0.7) % 1.9)).toFixed(2) + "s");
    const st = roamState(c);
    if (lobbyEdit && c.name === lobbyPicked) who.style.outlineStyle = "solid";
    const flip = el("div", "flip"), body = el("div", "body"), img = el("img");
    const fit = () => {
      if (img.naturalWidth && img.naturalHeight) who.style.aspectRatio = img.naturalWidth + " / " + img.naturalHeight;
      who.style.setProperty("--hf", img.style.getPropertyValue("--hf") || "1");
    };
    img.addEventListener("load", fit);
    setSprite(img, c.url, false);
    if (img.complete) fit();
    img.alt = c.name;
    img.draggable = false;
    body.append(img);
    flip.append(body);
    who.append(flip);
    on(who, "pointerdown", (e) => {
      e.stopPropagation();
      if (!lobbyEdit) {
        // A press on a cheek pulls it; let go and it snaps back with a word from them.
        who.setAttribute("data-pinch", "");
        const started = startPinch(img, e, cheeksOf(c.name), cheekR(c.name), who, (pulled) => {
          who.removeAttribute("data-pinch");
          who.removeAttribute("data-squish"); void who.offsetWidth; who.setAttribute("data-squish", "");
          talk(who, pulled ? pinchFor(c.name) : pick(linesFor(c.name)), 2600);
        });
        if (started) who.setAttribute("data-pinched", ""); else who.removeAttribute("data-pinch");
        return;
      }
      if (floorEdit) return;
      e.preventDefault();
      lobbyPicked = c.name;
      const box = who.parentElement.getBoundingClientRect();
      who.setPointerCapture(e.pointerId);
      // The feet keep the offset they had from the pointer, so the character does not jump under it.
      const at = (ev) => [((ev.clientX - box.left) / box.width) * 100, ((ev.clientY - box.top) / box.height) * 100];
      const [px0, py0] = at(e), ox = st.x - px0, oy = st.y - py0;
      const move = (ev) => {
        const [px, py] = at(ev);
        const p = clampToFloor(px + ox, py + oy);
        c.x = st.x = st.tx = p.x;
        c.y = st.y = st.ty = p.y;
        placeWho(who, st);
      };
      const up = () => {
        who.removeEventListener("pointermove", move);
        who.removeEventListener("pointerup", up);
        who.removeEventListener("pointercancel", up);
        who.removeEventListener("lostpointercapture", up);
        setHome(c.name, { x: c.x, y: c.y });
        savePrefs();
        refresh();
      };
      who.addEventListener("pointermove", move);
      who.addEventListener("pointerup", up);
      who.addEventListener("pointercancel", up);
      who.addEventListener("lostpointercapture", up);
    });
    on(who, "click", (e) => {
      e.stopPropagation();
      if (lobbyEdit) return;
      if (who.hasAttribute("data-pinched")) { who.removeAttribute("data-pinched"); return; }
      who.removeAttribute("data-squish");
      void who.offsetWidth;
      who.setAttribute("data-squish", "");
      talk(who, pick(linesFor(c.name)), 2400);
    });
    on(who, "wheel", (e) => {
      if (!lobbyEdit) return;
      e.preventDefault();
      e.stopPropagation();
      resizeLobby(e.deltaY < 0 ? 1.06 : 0.94);
    }, { passive: false });
    return who;
  }
  // The lobby's size, all at once; the loop reads it every frame, so nothing is rebuilt.
  function resizeLobby(f) {
    prefs.lobbyScale = Math.min(2, Math.max(0.5, +((prefs.lobbyScale || 1) * f).toFixed(3)));
    savePrefs();
  }
  function floorGuide(lobby) {
    const guide = el("div", "gfx-lobby-floor");
    const ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    const area = document.createElementNS(ns, "polygon");
    const rays = [0, 1, 2, 3].map(() => document.createElementNS(ns, "line"));
    svg.append(area, ...rays);
    guide.append(svg);
    const specs = [
      ["vp", "소실", "vpX", "vpY"], ["bl", "뒤L", "backL", "backY"], ["br", "뒤R", "backR", "backY"],
      ["fl", "앞L", "frontL", "frontY"], ["fr", "앞R", "frontR", "frontY"],
    ];
    const handles = new Map();
    const draw = () => {
      const s = lobbyScene(), corners = [[s.backL, s.backY], [s.backR, s.backY], [s.frontR, s.frontY], [s.frontL, s.frontY]];
      area.setAttribute("points", corners.map((p) => p.join(",")).join(" "));
      corners.forEach((p, i) => {
        rays[i].setAttribute("x1", String(s.vpX)); rays[i].setAttribute("y1", String(s.vpY));
        rays[i].setAttribute("x2", String(p[0])); rays[i].setAttribute("y2", String(p[1]));
      });
      for (const [id, , xk, yk] of specs) {
        const h = handles.get(id);
        h.style.left = s[xk] + "%"; h.style.top = s[yk] + "%";
      }
      for (const who of lobby.querySelectorAll(":scope > .who")) {
        const name = who.getAttribute("data-name"), st = roam.get(name);
        if (!st) continue;
        const p = clampToFloor(st.x, st.y, s), tp = clampToFloor(st.tx, st.ty, s);
        st.x = p.x; st.y = p.y; st.tx = tp.x; st.ty = tp.y;
        placeWho(who, st);
      }
    };
    for (const [id, label, xk, yk] of specs) {
      const h = el("button", "", label);
      h.type = "button";
      h.setAttribute("data-floor-handle", id);
      handles.set(id, h);
      on(h, "pointerdown", (e) => {
        e.preventDefault(); e.stopPropagation(); h.setPointerCapture(e.pointerId);
        const move = (ev) => {
          const box = lobby.getBoundingClientRect();
          let x = clamp(((ev.clientX - box.left) / box.width) * 100, 0, 100);
          let y = clamp(((ev.clientY - box.top) / box.height) * 100, 0, 110);
          const s = lobbyScene(), patch = {};
          if (id === "vp") { patch.vpX = x; patch.vpY = clamp(y, 0, s.backY - 4); }
          else if (id === "bl") { patch.backL = clamp(x, 0, s.backR - 6); patch.backY = clamp(y, 42, s.frontY - 8); }
          else if (id === "br") { patch.backR = clamp(x, s.backL + 6, 100); patch.backY = clamp(y, 42, s.frontY - 8); }
          else if (id === "fl") { patch.frontL = clamp(x, 0, s.frontR - 6); patch.frontY = clamp(y, s.backY + 8, 110); }
          else { patch.frontR = clamp(x, s.frontL + 6, 100); patch.frontY = clamp(y, s.backY + 8, 110); }
          setLobbyScene(patch);
          draw();
        };
        const up = () => {
          h.removeEventListener("pointermove", move); h.removeEventListener("pointerup", up);
          h.removeEventListener("pointercancel", up); h.removeEventListener("lostpointercapture", up);
          for (const [name, st] of roam) setHome(name, { x: st.x, y: st.y });
          savePrefs(); refresh();
        };
        h.addEventListener("pointermove", move); h.addEventListener("pointerup", up);
        h.addEventListener("pointercancel", up); h.addEventListener("lostpointercapture", up);
      });
      guide.append(h);
    }
    draw();
    return guide;
  }
  function lobbyTools() {
    const tools = el("div", "gfx-lobby-tools");
    const btn = (text, fn, attr) => {
      const b = el("button", "", text);
      b.type = "button";
      if (attr) b.setAttribute(attr, "");
      on(b, "click", (e) => { e.stopPropagation(); fn(); });
      on(b, "pointerdown", (e) => e.stopPropagation());
      return b;
    };
    if (lobbyEdit) {
      tools.append(btn("완료", () => { lobbyEdit = false; floorEdit = false; lobbyPicked = ""; refresh(); }, "data-main"),
        btn(floorEdit ? "캐릭터 배치" : "소실점 · 바닥", () => { floorEdit = !floorEdit; lobbyPicked = ""; refresh(); }),
        btn("모두 크게", () => resizeLobby(1.1)), btn("모두 작게", () => resizeLobby(0.9)),
        btn("자동 배치", () => { const w = world(); if (w) { for (const e of Object.values(prefs.home[w.id] || {})) { e.x = NaN; e.y = NaN; e.s = 1; } savePrefs(); refresh(); } }));
      if (floorEdit) tools.append(btn("바닥 초기화", () => { setLobbyScene(DEFAULT_FLOOR); savePrefs(); refresh(); }));
      // Who stands in the lobby: every character with an SD, pressed ones are out.
      const w = world(), mine = (w && prefs.home[w.id]) || {};
      const cast = el("div", "gfx-lobby-cast");
      for (const c of w ? w.cards.filter((x) => sdUrl(x.name)) : []) {
        const shown = mine[c.name] ? mine[c.name].on : true;
        const b = btn((shown ? "✓ " : "") + c.name, () => { setHome(c.name, { on: !shown }); savePrefs(); refresh(); });
        b.setAttribute("aria-pressed", String(shown));
        cast.append(b);
      }
      tools.append(cast);
    } else tools.append(btn("✥ 배치", () => { lobbyEdit = true; floorEdit = false; refresh(); }, "data-edit-toggle"));
    return tools;
  }

  const chatter = setInterval(() => {
    if (disposed || lobbyEdit || !current || !prefs.opts.lobby) return;
    const cast = Array.from(gameRoot()?.querySelectorAll(".gfx-lobby .who:not([data-talk])") || []);
    const who = pick(cast);
    if (!who || document.hidden || who.hasAttribute("data-pinch")) return;
    talk(who, pick(linesFor(who.getAttribute("data-name"))), 2600);
  }, 7000);

  /* ── Attendance ── */
  // One listener on the game's root: the game redraws the board often, so a listener on the button goes stale.
  const boundRoots = new WeakSet();
  function bindAttend(root) {
    if (boundRoots.has(root)) return;
    boundRoots.add(root);
    on(root, "click", (e) => {
      const claim = e.target.closest?.('.ev-panel[data-gfx-attendance] [data-events-claim]');
      if (!current || !prefs.opts.attend || !claim) return;
      // The stamp lands at once; when the game has taken the claim, the board closes by itself.
      root.querySelector(".ev-panel .ev-day.next")?.classList.add("gfx-stamped");
      const t0 = performance.now();
      const wait = setInterval(() => {
        const live = root.querySelector(".ev-panel");
        const done = !live || !live.querySelector("[data-events-claim]:not(:disabled)") || !live.querySelector(".ev-day.next");
        if (!done && performance.now() - t0 < 6000) return;
        clearInterval(wait);
        setTimeout(() => root.querySelector("[data-events-close]")?.click(), 550);
      }, 120);
    }, { capture: true });
  }
  function paintAttend(root, enabled) {
    bindAttend(root);
    for (const panel of root.querySelectorAll(".ev-panel")) {
      let m = panel.querySelector(":scope > .gfx-ev-mascot");
      const attendance = enabled && !!panel.querySelector(".ev-day");
      if (attendance) panel.setAttribute("data-gfx-attendance", "");
      else panel.removeAttribute("data-gfx-attendance");
      if (!attendance) { m?.remove(); continue; }

      if (m) continue;
      m = el("div", "gfx-ev-mascot");
      const body = el("div", "body");
      body.append(heroNode(pick(anySd())));
      const claimed = panel.querySelector(".ev-day.next") ? "오늘 도장 찍으러 왔구나!" : "내일도 꼭 와야 해~";
      m.append(body, el("span", "say", claimed));
      panel.append(m);
    }
  }

  /* ── Loading screen ──
   * The game shows its own short loading states per screen; the screen's state field says when. The overlay
   * lives in the game's shadow root (the game element itself is what goes fullscreen), so it is put back
   * straight away whenever the game rewrites the root. */
  const LOADING_BY_VIEW = {
    combat: (h) => h._combatPhase === "loading", beat: (h) => h._beatState === "loading",
    chapters: (h) => h._chaptersState === "loading", chapter: (h) => h._planState === "loading",
    summon: (h) => h._summonBannerState === "loading", tower: (h) => h._towerState === "loading",
    farm: (h) => h._farmState === "loading", roster: (h) => h._rosterState === "loading",
    inventory: (h) => h._inventoryState === "loading", formation: (h) => h._formationState === "loading",
  };
  function loadingNow(h) {
    if (!h || !h.shadowRoot) return false;
    if (h._boot === "idle" || h._boot === "loading") return true;
    const test = LOADING_BY_VIEW[h._hudView];
    try { return !!(test && test(h)); } catch { return false; }
  }
  let load = null; // { node, since, progress, tipAt, shownAt, ending }
  function makeLoad() {
    const node = el("div", "gfx-load");
    node.setAttribute("data-gfx-ui", "");
    const title = el("div", "gfx-load-title", "Now Loading");
    for (let i = 0; i < 3; i++) title.append(el("i", "", "."));
    const name = host()?._run?.name;
    const worldName = el("div", "gfx-load-world", name ? String(name) : "");
    const stage = el("div", "gfx-load-stage");
    const hero = el("div", "gfx-load-hero");
    const sds = anySd();
    hero.append(heroNode(pick(sds)));
    stage.append(el("i", "gfx-load-shadow"), hero);
    on(stage, "click", (e) => {
      e.stopPropagation();
      stage.removeAttribute("data-squish");
      void stage.offsetWidth;
      stage.setAttribute("data-squish", "");
      const pop = el("span", "gfx-load-pop", pick(["말랑!", "꾹!", "몰캉~", "뿌잉"]));
      stage.append(pop);
      setTimeout(() => pop.remove(), 650);
    });
    const foot = el("div", "gfx-load-foot");
    const tip = el("div", "gfx-load-tip");
    tip.append(el("b", "", "TIP"), el("span", "", pick(TIPS)));
    const bar = el("div", "gfx-load-bar");
    const fill = el("i", "gfx-load-fill");
    const runner = el("div", "gfx-load-runner");
    runner.append(heroNode(pick(sds)));
    bar.append(fill, runner, el("em", "gfx-load-pct", "0%"));
    foot.append(tip, bar);
    node.append(title, worldName, stage, foot);
    return node;
  }
  function paintLoad() {
    if (!load) return;
    const box = load.node.getBoundingClientRect();
    if (box.width) load.node.style.setProperty("--u", Math.max(5, Math.min(box.height * 0.016, box.width * 0.009)).toFixed(2) + "px");
    const p = Math.round(load.progress);
    const fill = load.node.querySelector(".gfx-load-fill"), runner = load.node.querySelector(".gfx-load-runner");
    if (fill) fill.style.width = "calc((100% - 6px) * " + p / 100 + ")";
    if (runner) runner.style.left = "calc(3px + (100% - 6px) * " + p / 100 + ")";
    const pct = load.node.querySelector(".gfx-load-pct");
    if (pct) pct.textContent = p + "%";
  }
  function ensureLoadMounted() {
    const root = gameRoot();
    if (!root) return;
    const target = root.querySelector(".gf-stage") || root.querySelector(".gf-arena");
    if (!target) return;
    let mount = target.querySelector(":scope > .gfx-load-host");
    if (!load) { if (mount && !mount.childElementCount) mount.remove(); return; }
    if (!mount) { mount = el("div", "gfx-load-host"); target.append(mount); }
    if (load.node.parentNode !== mount) mount.append(load.node);
  }
  let loadingSince = 0;
  function tickLoading() {
    if (disposed) return;
    const h = host();
    // The battle phase as a host attribute, for rules that differ before and during the fight.
    const phase = h && h._hudView === "combat" ? String(h._combatPhase || "") : "";
    if (h && (h.getAttribute("data-gfx-phase") || "") !== phase) { if (phase) h.setAttribute("data-gfx-phase", phase); else h.removeAttribute("data-gfx-phase"); }
    const want = !!current && prefs.opts.loading && loadingNow(h);
    const now = performance.now();
    if (want) {
      if (!loadingSince) loadingSince = now;
      // Short waits stay quiet: only a load still running after 160ms gets the screen (and a stuck one only once).
      if (!load && now - loadingSince > 350 && now - loadingSince < 25000) {
        load = { node: makeLoad(), progress: 4, tipAt: now, shownAt: now, ending: 0 };
        ensureLoadMounted();
      }
    } else loadingSince = 0;
    if (!load) return;
    ensureLoadMounted();
    // A state the game never clears (an error it shows on its own screen) must not hide that screen: 25s at most.
    if (!load.ending && ((!want && now - load.shownAt > 450) || now - load.shownAt > 25000)) load.ending = now;
    if (load.ending) {
      load.progress = Math.min(100, load.progress + 30);
      if (load.progress >= 100 && now - load.ending > 120) {
        const node = load.node;
        node.setAttribute("data-out", "");
        load = null;
        const mount = node.parentElement;
        setTimeout(() => { node.remove(); if (mount && !mount.childElementCount) mount.remove(); }, 280);
        return;
      }
    } else {
      load.progress += (92 - load.progress) * 0.035;
      if (now - load.tipAt > 4200) {
        load.tipAt = now;
        const span = load.node.querySelector(".gfx-load-tip span");
        if (span) { const n = el("span", "", pick(TIPS.filter((t) => t !== span.textContent))); span.replaceWith(n); }
      }
    }
    paintLoad();
  }

  /* ═════════════ Settings → 화면 → UI 스타일 ═════════════ */
  function makeCard([id, label, desc]) {
    const c = prefs.colors;
    const b = el("button", "st-sty");
    b.type = "button";
    b.setAttribute("data-gfx-set", id);
    const mini = el("span", "st-mini");
    mini.style.background = c.sky1;
    for (const [l, t, w, hgt, bg] of [[8, 10, 84, 14, c.card], [8, 31, 50, 34, c.card], [62, 31, 30, 15, c.accent], [8, 72, 84, 18, c.card]]) {
      const i = el("i");
      i.style.cssText = "left:" + l + "%;top:" + t + "%;width:" + w + "%;height:" + hgt + "%;background:" + bg;
      mini.append(i);
    }
    const lbl = el("span", "st-swlbl");
    lbl.append(el("b", "", label), el("span", "", desc));
    b.append(mini, el("span", "st-tick", "✓"), lbl);
    on(b, "click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (disposed) return;
      current = id;
      writeStyle(current);
      refresh();
      loadWorld();
    });
    return b;
  }
  let settingsView = "ui";
  function plate(title, key) {
    const p = el("div", "st-plate");
    p.setAttribute("data-gfx-plate", key);
    p.setAttribute("data-gfx-section", key === "sd" ? "sd" : "ui");
    const hd = el("div", "hd");
    hd.append(el("h3", "", title));
    p.append(hd);
    return p;
  }
  function settingsNav(container) {
    const nav = el("div", "gfx-settings-nav");
    nav.setAttribute("data-gfx-plate", "nav");
    nav.setAttribute("data-gfx-settings-nav", "");
    for (const [id, label] of [["ui", "UI 설정"], ["sd", "SD 관리"]]) {
      const b = chip(label, () => {
        settingsView = id;
        container?.setAttribute("data-gfx-settings-view", settingsView);
        for (const x of nav.querySelectorAll("button")) x.setAttribute("aria-pressed", String(x === b));
        if (id === "sd") { loadConnections(); loadWorld(); paintSettings(true); }
      });
      b.setAttribute("aria-pressed", String(settingsView === id));
      nav.append(b);
    }
    return nav;
  }
  function hint(text, key) {
    const p = el("p", "hint", text);
    p.style.cssText = "display:block;margin:.7em 0 0";
    if (key) p.setAttribute("data-gfx-note", key);
    return p;
  }
  function chip(text, fn, attrs = {}) {
    const b = el("button", "st-chip", text);
    b.type = "button";
    for (const [k, v] of Object.entries(attrs)) b.setAttribute(k, v);
    on(b, "click", (e) => { e.stopPropagation(); fn(b); });
    return b;
  }

  function colorPlate() {
    const p = plate("말랑 색상", "colors");
    const row = el("div", "st-chips");
    for (const [id, label, colors] of PRESETS) {
      row.append(chip(label, () => { prefs.colors = { ...colors }; prefs.preset = id; savePrefs(); refresh(); }, { "data-gfx-preset": id }));
    }
    const grid = el("div", "gfx-colors");
    for (const [k, label] of COLOR_FIELDS) {
      const lab = el("label", "gfx-color");
      const input = el("input");
      input.type = "color";
      input.setAttribute("data-gfx-color", k);
      on(input, "input", () => { prefs.colors[k] = cleanColor(input.value, prefs.colors[k]); prefs.preset = ""; apply(); paintVars(); });
      on(input, "change", () => { savePrefs(); paintSettings(); });
      on(lab, "click", (e) => e.stopPropagation());
      lab.append(input, el("span", "", label));
      grid.append(lab);
    }
    const fontRow = el("div", "st-chips");
    fontRow.style.marginTop = ".7em";
    fontRow.append(chip("글꼴 받기", () => fetchFonts(), { "data-gfx-font-get": "" }));
    p.append(row, grid, hint("", "fonts"), fontRow);
    return p;
  }
  function optionPlate() {
    const p = plate("스토리 · 전투 이미지", "opts");
    const grid = el("div", "gfx-toggles");
    for (const [k, label, desc] of OPTION_FIELDS) {
      const b = el("button", "gfx-toggle");
      b.type = "button";
      b.setAttribute("data-gfx-opt", k);
      b.append(el("b", "", label), el("span", "", desc));
      on(b, "click", (e) => { e.stopPropagation(); prefs.opts[k] = !prefs.opts[k]; savePrefs(); refresh(); });
      grid.append(b);
    }
    p.append(grid);
    return p;
  }

  function toggleGrid(fields) {
    const grid = el("div", "gfx-toggles");
    for (const [k, label, desc] of fields) {
      const b = el("button", "gfx-toggle");
      b.type = "button";
      b.setAttribute("data-gfx-opt", k);
      b.append(el("b", "", label), el("span", "", desc));
      on(b, "click", (e) => { e.stopPropagation(); prefs.opts[k] = !prefs.opts[k]; savePrefs(); refresh(); });
      grid.append(b);
    }
    return grid;
  }
  function screenPlate() {
    const p = plate("트릭컬 화면", "screens");
    p.append(toggleGrid(SCREEN_FIELDS), hint("홈 로비에 둘 캐릭터 (SD가 있는 캐릭터만 나옵니다)"));
    const list = el("div", "st-chips");
    list.setAttribute("data-gfx-home-list", "");
    p.append(list, hint("", "home"));
    return p;
  }
  function paintHomeList(root) {
    const w = world();
    const cards = w ? w.cards.filter((c) => sdUrl(c.name)) : [];
    const mine = (w && prefs.home[w.id]) || {};
    for (const list of root.querySelectorAll("[data-gfx-home-list]")) {
      const key = cards.map((c) => c.name + ":" + (mine[c.name] ? mine[c.name].on : true)).join("|");
      if (list.getAttribute("data-key") === key) continue;
      list.setAttribute("data-key", key);
      list.textContent = "";
      for (const c of cards) {
        const b = chip(c.name, () => { setHome(c.name, { on: !(mine[c.name] ? mine[c.name].on : true) }); savePrefs(); refresh(); });
        b.setAttribute("aria-pressed", String(mine[c.name] ? mine[c.name].on : true));
        list.append(b);
      }
    }
    const text = !cards.length ? "아직 SD가 있는 캐릭터가 없습니다. 아래 SD 캐릭터 만들기에서 먼저 그려 주세요."
      : "누른 캐릭터가 홈에 섭니다. 홈 왼쪽 위 [✥ 배치]를 누르면 끌어서 옮기고, 휠이나 [크게]·[작게]로 크기를 바꿉니다.";
    for (const n of root.querySelectorAll('[data-gfx-note="home"]')) n.textContent = text;
  }

  let connections = null; // [{id, name, model}]
  async function loadConnections() {
    if (connections) return;
    connections = [];
    try {
      const list = await fetch("/api/connections", { credentials: "same-origin" }).then((r) => r.json());
      connections = (Array.isArray(list) ? list : []).filter((c) => c && c.provider === "image_generation")
        .map((c) => ({ id: String(c.id), name: String(c.name || c.model || c.id), model: String(c.model || "") }));
    } catch {}
    paintSettings(true);
  }
  function sdPlate() {
    const p = plate("SD 캐릭터 만들기", "sd");
    p.append(hint("세계의 캐릭터 외형으로 투명 배경 SD(치비) 이미지를 그려 스토리 · 전투 · 로딩 화면에 씁니다. 이미지는 갤러리에 저장되고, 그릴 때마다 이미지 연결의 사용량(NovelAI는 Anlas)이 듭니다."));
    const conn = el("label", "gfx-field");
    conn.append(el("span", "", "이미지 연결"));
    const sel = el("select");
    sel.setAttribute("data-gfx-conn", "");
    on(sel, "change", () => { prefs.gen.connectionId = sel.value; savePrefs(); });
    on(sel, "click", (e) => e.stopPropagation());
    conn.append(sel);
    const tpl = el("label", "gfx-field");
    tpl.append(el("span", "", "프롬프트 ({appearance} = 캐릭터 외형, {name} = 이름)"));
    const ta = el("textarea");
    ta.setAttribute("data-gfx-tpl", "");
    ta.value = prefs.gen.template;
    on(ta, "change", () => { prefs.gen.template = ta.value.trim() || DEFAULT_GEN.template; savePrefs(); });
    on(ta, "click", (e) => e.stopPropagation());
    tpl.append(ta);
    const neg = el("label", "gfx-field");
    neg.append(el("span", "", "네거티브 프롬프트"));
    const nta = el("textarea");
    nta.setAttribute("data-gfx-neg", "");
    nta.style.minHeight = "2.4em";
    nta.value = prefs.gen.negative;
    on(nta, "change", () => { prefs.gen.negative = nta.value.trim(); savePrefs(); });
    on(nta, "click", (e) => e.stopPropagation());
    neg.append(nta);
    const sizes = el("div", "st-chips");
    sizes.style.marginTop = ".7em";
    for (const [s, label] of SIZES) sizes.append(chip(label, () => { prefs.gen.size = s; savePrefs(); paintSettings(); }, { "data-gfx-size": s }));
    sizes.append(chip("프롬프트 기본값", () => { prefs.gen.template = DEFAULT_GEN.template; prefs.gen.negative = DEFAULT_GEN.negative; savePrefs(); paintSettings(true); }));
    const all = el("div", "st-chips");
    all.style.marginTop = ".7em";
    all.append(chip("없는 캐릭터 전부 그리기", () => makeAll(), { "data-gfx-all": "" }),
      chip("갤러리에서 되찾기", () => recoverSd(false)),
      chip("대사 만들기 (AI)", () => makeLines(false), { "data-gfx-lines": "" }),
      chip("없는 대사만", () => makeLines(true), { "data-gfx-lines": "" }));
    const list = el("div", "gfx-sd-list");
    list.setAttribute("data-gfx-sd-list", "");
    const edit = el("div", "gfx-sd-edit");
    edit.setAttribute("data-gfx-sd-edit", "");
    edit.hidden = true;
    p.append(conn, tpl, neg, sizes, all, hint("", "sd"),
      hint("[대사 만들기]는 이 세계의 AI 연결로 캐릭터마다 성격에 맞는 로비 대사 3개와 볼 꼬집기 반응을 씁니다. 캐릭터의 [편집]에서 볼 위치와 대사를 고칩니다."), list, edit);
    return p;
  }

  function paintSdList(root) {
    const w = world();
    for (const list of root.querySelectorAll("[data-gfx-sd-list]")) {
      const cards = w ? w.cards : [];
      const keyNow = sdEditing + "/" + cards.map((c) => c.name + ":" + (w.sd[c.name]?.url || "") + ":" + JSON.stringify(w.sd[c.name]?.variants || {}) + ":" + (w.busy.has(c.name) ? 1 : 0)).join("|");
      if (list.getAttribute("data-key") === keyNow) continue;
      list.setAttribute("data-key", keyNow);
      list.textContent = "";
      for (const c of cards) {
        const card = el("div", "gfx-sd-card");
        if (w.busy.has(c.name)) card.setAttribute("data-busy", "");
        const thumb = el("div", "gfx-sd-thumb");
        const url = w.sd[c.name]?.url;
        const img = el("img", url ? "" : "portrait");
        img.alt = "";
        if (url || c.portrait) img.src = url || c.portrait;
        thumb.append(img);
        const chips = el("div", "st-chips");
        chips.append(chip(url ? "다시" : "그리기", () => makeSd(c)));
        if (url) chips.append(chip("지우기", () => removeSd(c.name)));
        chips.append(chip("편집", () => { sdEditing = sdEditing === c.name ? "" : c.name; sdEditKey = ""; paintSettings(); }, { "aria-pressed": String(sdEditing === c.name) }));
        card.append(thumb, el("b", "", c.name), chips);
        list.append(card);
      }
    }
    paintSdEditor(root);
  }

  /* ── One character's editor: cheek points on the sprite, its three lines and its pinch reaction ── */
  // linesRev moves when the AI rewrites lines, so the editor shows them; typing never rebuilds it.
  let sdEditing = "", sdEditKey = "", linesRev = 0;
  function paintSdEditor(root) {
    const w = world();
    const c = w && w.cards.find((x) => x.name === sdEditing);
    for (const box of root.querySelectorAll("[data-gfx-sd-edit]")) {
      const e = c ? sdEntry(c.name) : {};
      const key = c ? [c.name, e.url || "", JSON.stringify(e.variants || {}), JSON.stringify(e.cheeks || []), cheekR(c.name), faceOf(c.name), e.tall || 1, linesRev].join("|") : "";
      if (box.getAttribute("data-key") === key) continue;
      box._gfxMarkerRO?.disconnect();
      box._gfxMarkerRO = null;
      box.setAttribute("data-key", key);
      box.textContent = "";
      box.hidden = !c;
      if (!c) continue;
      const pad = el("div", "gfx-cheek-pad");
      const side = el("div", "gfx-sd-edit-side");
      box.append(pad, side);
      if (e.url) {
        const img = el("img");
        img.src = e.url;
        img.alt = c.name;
        img.draggable = false;
        pad.append(img);
        const marks = () => {
          for (const m of pad.querySelectorAll(".mark")) m.remove();
          for (const p of cheeksOf(c.name) || []) {
            const m = el("i", "mark");
            m.style.cssText = "left:" + (img.offsetLeft + p.x * img.offsetWidth) + "px;top:" + (img.offsetTop + p.y * img.offsetHeight) + "px;width:" + cheekR(c.name) * 2 * img.offsetWidth + "px";
            pad.append(m);
          }
        };
        if (img.complete) requestAnimationFrame(marks); else img.addEventListener("load", marks, { once: true });
        const markerRO = new ResizeObserver(marks);
        markerRO.observe(pad);
        box._gfxMarkerRO = markerRO;
        let pinched = false;
        on(pad, "pointerdown", (ev) => {
          ev.stopPropagation();
          pinched = startPinch(img, ev, cheeksOf(c.name), cheekR(c.name), pad, (pulled) => { if (pulled) setEditNote(pinchFor(c.name)); }, false);
        });
        on(pad, "click", (ev) => {
          ev.stopPropagation();
          if (pinched) { pinched = false; return; }
          const r = img.getBoundingClientRect();
          const p = { x: +((ev.clientX - r.left) / r.width).toFixed(3), y: +((ev.clientY - r.top) / r.height).toFixed(3) };
          if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) return;
          const now = (cheeksOf(c.name) || []).slice();
          // Two cheeks at most: a third tap moves the nearer one.
          if (now.length >= 2) now.splice(now.findIndex((q, i, a) => Math.hypot(q.x - p.x, q.y - p.y) === Math.min(...a.map((z) => Math.hypot(z.x - p.x, z.y - p.y)))), 1, p);
          else now.push(p);
          saveSdEntry(c.name, { cheeks: now });
          sdEditKey = "";
          paintSettings();
        });
      } else pad.append(el("p", "hint", "먼저 SD를 그려 주세요."));
      side.append(el("b", "", c.name));
      side.append(hint("그림에서 볼을 누르면 볼 위치(최대 2곳)가 정해집니다. 정한 곳을 누른 채 끌면 미리 당겨 볼 수 있습니다.", ""));
      const size = el("div", "st-chips");
      for (const [r, label] of [[0.025, "볼 작게"], [0.04, "보통"], [0.055, "볼 크게"]]) {
        const b = chip(label, () => { saveSdEntry(c.name, { cheekR: r }); sdEditKey = ""; paintSettings(); });
        b.setAttribute("aria-pressed", String(Math.abs(cheekR(c.name) - r) < 0.001));
        size.append(b);
      }
      size.append(chip("볼 지우기", () => saveSdEntry(c.name, { cheeks: [] }).then(() => paintSettings())));
      side.append(size);
      side.append(hint("그림 속 캐릭터가 바라보는 쪽 — 로비에서 걷는 방향, 스토리·전투에서 서로 마주 보는 방향이 이것을 따릅니다.", ""));
      const face = el("div", "st-chips");
      for (const [f, label] of [["left", "← 왼쪽을 봄"], ["front", "정면"], ["right", "오른쪽을 봄 →"]]) {
        const b = chip(label, () => saveSdEntry(c.name, { face: f }).then(() => { paintSettings(); refresh(); }));
        b.setAttribute("aria-pressed", String(faceOf(c.name) === f));
        face.append(b);
      }
      side.append(face);
      side.append(hint("키 — 그림마다 캐릭터가 그림 높이를 가득 채워서, 어린 캐릭터는 여기서 작게 하면 다른 캐릭터와 비율이 맞습니다.", ""));
      const tall = el("div", "st-chips");
      for (const [t, label] of [[0.8, "작게"], [0.9, "조금 작게"], [1, "보통"], [1.15, "크게"]]) {
        const b = chip(label, () => saveSdEntry(c.name, { tall: t }).then(() => { paintSettings(); refreshSprites(); }));
        b.setAttribute("aria-pressed", String(Math.abs((Number(e.tall) || 1) - t) < 0.001));
        tall.append(b);
      }
      side.append(tall);
      const outfits = Array.from(w.outfits.get(c.name) || []);
      if (outfits.length) {
        side.append(hint("의상별 SD — 스토리에서 발견한 다른 의상입니다. 의상마다 따로 만들면 해당 초상이 나올 때 자동으로 바뀝니다.", ""));
        const variants = el("div", "st-chips");
        outfits.forEach((variantKey, i) => {
          const exists = !!e.variants?.[variantKey];
          variants.append(chip("의상 " + (i + 1) + (exists ? " 다시" : " 만들기"), () => makeSd(c, variantKey)));
          if (exists) variants.append(chip("의상 " + (i + 1) + " 지우기", () => removeSdVariant(c.name, variantKey)));
        });
        side.append(variants);
      }
      const field = (label, value, save) => {
        const lab = el("label", "gfx-field");
        lab.append(el("span", "", label));
        const input = el("input");
        input.type = "text";
        input.maxLength = 60;
        input.value = value || "";
        on(input, "click", (ev) => ev.stopPropagation());
        on(input, "keydown", (ev) => ev.stopPropagation());
        on(input, "change", () => save(input.value.trim()));
        lab.append(input);
        return lab;
      };
      const lines = Array.isArray(e.lines) ? e.lines.slice(0, 3) : [];
      for (let i = 0; i < 3; i++) {
        side.append(field("대사 " + (i + 1), lines[i], (v) => { const next = (sdEntry(c.name).lines || []).slice(0, 3); while (next.length < 3) next.push(""); next[i] = v; saveSdEntry(c.name, { lines: next }).then(() => setEditNote(lastStoreError ? "이 브라우저에 보관, 서버 저장은 다시 시도합니다 (" + lastStoreError + ")" : "저장했습니다", true)); }));
      }
      side.append(field("볼을 꼬집혔을 때", e.pinch, (v) => saveSdEntry(c.name, { pinch: v }).then(() => setEditNote(lastStoreError ? "이 브라우저에 보관, 서버 저장은 다시 시도합니다 (" + lastStoreError + ")" : "저장했습니다", true))));
      const note = hint("", "");
      note.setAttribute("data-gfx-edit-note", "");
      side.append(note);
    }
  }
  // A spoken line shows in quotes; a save status (plain) does not.
  function setEditNote(text, plain = false) {
    for (const n of gameRoot()?.querySelectorAll("[data-gfx-edit-note]") || []) n.textContent = plain ? text : "“" + text + "”";
  }

  function paintSettings(full = false) {
    const root = gameRoot();
    if (!root) return;
    for (const b of root.querySelectorAll("[data-gfx-preset]")) b.setAttribute("aria-pressed", String(b.getAttribute("data-gfx-preset") === prefs.preset));
    for (const i of root.querySelectorAll("[data-gfx-color]")) { const v = prefs.colors[i.getAttribute("data-gfx-color")]; if (i.value.toUpperCase() !== v) i.value = v; }
    for (const b of root.querySelectorAll("[data-gfx-opt]")) b.setAttribute("aria-pressed", String(!!prefs.opts[b.getAttribute("data-gfx-opt")]));
    for (const b of root.querySelectorAll("[data-gfx-size]")) b.setAttribute("aria-pressed", String(b.getAttribute("data-gfx-size") === prefs.gen.size));
    const fontText = fonts.status === "loading" ? "글꼴 목록을 확인하는 중입니다."
      : fonts.status === "ok" ? "둥근 글꼴 Jua · Gowun Dodum을 쓰고 있습니다."
      : fonts.status === "fetching" ? "Google Fonts에서 글꼴을 받는 중입니다…"
      : fonts.status === "error" ? "글꼴 목록을 읽지 못했습니다. 지금은 맑은 고딕으로 보입니다."
      : "둥근 글꼴(" + fonts.missing.join(" · ") + ")이 아직 없어서 맑은 고딕으로 보입니다. [글꼴 받기]를 누르면 Marinara 글꼴 보관함(data/fonts)에 내려받습니다.";
    for (const n of root.querySelectorAll('[data-gfx-note="fonts"]')) n.textContent = fonts.note ? fonts.note + " " + fontText : fontText;
    for (const b of root.querySelectorAll("[data-gfx-font-get]")) { b.style.display = fonts.status === "ok" ? "none" : ""; b.disabled = fonts.status === "fetching" || fonts.status === "loading"; }
    for (const sel of root.querySelectorAll("[data-gfx-conn]")) {
      const list = connections || [];
      const fallback = host()?._run?.images?.connectionId || "";
      const chosen = list.some((c) => c.id === prefs.gen.connectionId) ? prefs.gen.connectionId : list.some((c) => c.id === fallback) ? fallback : list[0]?.id || "";
      if (full || sel.options.length !== list.length) {
        sel.textContent = "";
        for (const c of list) { const o = el("option", "", c.name + (c.id === fallback ? " (이 세계 기본)" : "")); o.value = c.id; sel.append(o); }
      }
      if (sel.value !== chosen) sel.value = chosen;
    }
    if (full) {
      for (const t of root.querySelectorAll("[data-gfx-tpl]")) t.value = prefs.gen.template;
      for (const t of root.querySelectorAll("[data-gfx-neg]")) t.value = prefs.gen.negative;
    }
    const w = world();
    const sdText = !runId() ? "세계를 연 뒤에 그릴 수 있습니다."
      : !w || w.state === "loading" || w.state === "new" ? "캐릭터 목록을 불러오는 중입니다."
      : w.state === "error" ? w.note
      : !(connections || []).length ? "이미지 생성 연결이 없습니다. Marinara 연결 설정에서 이미지 연결을 먼저 만들어 주세요."
      : (w.note ? w.note + " " : "") + w.cards.length + "명 중 " + w.cards.filter((c) => w.sd[c.name]?.url).length + "명의 SD가 있습니다.";
    for (const n of root.querySelectorAll('[data-gfx-note="sd"]')) n.textContent = sdText;
    for (const b of root.querySelectorAll("[data-gfx-all]")) b.disabled = !w || w.state !== "ready" || w.busy.size > 0 || !(connections || []).length;
    for (const b of root.querySelectorAll("[data-gfx-lines]")) b.disabled = !w || w.state !== "ready" || linesBusy;
    paintSdList(root);
    paintHomeList(root);
  }

  /* ── Drawing SD sprites ── */
  function dataUrlToBlob(dataUrl) {
    const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl || "");
    if (!m) throw Error("이미지 데이터가 아닙니다");
    const bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: m[1] });
  }
  const extOf = (mime) => (/png/.test(mime) ? ".png" : /webp/.test(mime) ? ".webp" : /jpe?g/.test(mime) ? ".jpg" : ".png");
  async function makeSd(card, variantKey = "") {
    const w = world();
    if (!w || w.busy.has(card.name)) return;
    const connId = gameRoot()?.querySelector("[data-gfx-conn]")?.value || prefs.gen.connectionId || host()?._run?.images?.connectionId || "";
    const conn = (connections || []).find((c) => c.id === connId);
    if (!conn) { w.note = "이미지 연결을 골라 주세요."; paintSettings(); return; }
    w.busy.add(card.name);
    w.note = "";
    paintSettings();
    try {
      const u = await gf("/unit", { runId: w.id, unitId: card.id });
      const appearance = String((u.unit && u.unit.appearance) || "").trim();
      const prompt = prefs.gen.template.replace(/\{appearance\}/g, appearance || card.name).replace(/\{name\}/g, card.name).replace(/\s+/g, " ").trim();
      const [width, height] = prefs.gen.size.split("x").map(Number);
      const res = await fetch("/api/characters/avatar-generation", {
        method: "POST", credentials: "same-origin", headers: JSON_HEADERS,
        body: JSON.stringify({
          connectionId: conn.id, name: "gfx-sd", appearance: prompt, purpose: "avatar", width, height,
          promptOverrides: [{ id: "avatar:gfx-sd", prompt, negativePrompt: prefs.gen.negative }],
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.image) throw Error((data && data.error) || "HTTP " + res.status);
      const blob = dataUrlToBlob(data.image);
      const form = new FormData();
      form.append("prompt", prompt);
      form.append("provider", "image_generation");
      form.append("model", conn.model || "unknown");
      form.append("width", String(width));
      form.append("height", String(height));
      form.append("file", blob, "gfx-sd" + extOf(blob.type));
      const up = await fetch("/api/global-gallery/upload", { method: "POST", credentials: "same-origin", headers: CSRF, body: form });
      const saved = await up.json().catch(() => null);
      if (!up.ok || !saved || !saved.url) throw Error((saved && saved.error) || "갤러리 저장 실패 (HTTP " + up.status + ")");
      const old = w.sd[card.name] || {};
      const next = variantKey
        ? { ...old, variants: { ...(old.variants || {}), [variantKey]: { url: saved.url, at: Date.now() } } }
        : { ...old, url: saved.url, at: Date.now() };
      w.sd = { ...w.sd, [card.name]: next };
      if (!(await storePatch({ ["sd:" + w.id]: w.sd }))) w.note = "그림은 갤러리에 저장했고 이 브라우저에 보관했습니다. 서버 기록은 다시 시도합니다 (" + lastStoreError + ").";
    } catch (e) {
      w.note = card.name + " 그리기 실패: " + e.message;
    } finally {
      w.busy.delete(card.name);
      refresh();
    }
  }
  /* An SD this extension drew is in the gallery with its prompt, which holds the character's appearance text;
   * that is enough to tell whose it is. The newest picture wins. */
  let recovering = false;
  async function recoverSd(quiet) {
    const w = world();
    if (!w || recovering) return;
    recovering = true;
    try {
      const list = await fetch("/api/global-gallery", { credentials: "same-origin" }).then((r) => r.json());
      const ours = (Array.isArray(list) ? list : []).filter((g) => g && g.url && /chibi only|Transparent background/i.test(g.prompt || ""))
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
      if (!ours.length) { if (!quiet) w.note = "갤러리에서 SD를 찾지 못했습니다."; return; }
      const want = w.cards.filter((c) => !w.sd[c.name]?.url);
      const units = await Promise.all(want.map((c) => gf("/unit", { runId: w.id, unitId: c.id }).then((u) => u.unit || {}).catch(() => ({}))));
      const found = {};
      want.forEach((c, i) => {
        const look = String(units[i].appearance || "").replace(/\s+/g, " ").trim().slice(0, 90);
        if (look.length < 20) return;
        const hit = ours.find((g) => String(g.prompt || "").replace(/\s+/g, " ").includes(look));
        if (hit) found[c.name] = { ...(w.sd[c.name] || {}), url: hit.url, at: Date.parse(hit.createdAt) || Date.now() };
      });
      const n = Object.keys(found).length;
      if (n) {
        w.sd = { ...w.sd, ...found };
        const ok = await storePatch({ ["sd:" + w.id]: w.sd });
        w.note = "갤러리에서 SD " + n + "개를 되찾았습니다." + (ok ? "" : " (서버 기록은 다시 시도합니다: " + lastStoreError + ")");
      } else if (!quiet) w.note = "갤러리의 SD 중 이 세계 캐릭터와 맞는 것을 찾지 못했습니다.";
    } catch (e) {
      if (!quiet) w.note = "되찾기 실패: " + e.message;
    } finally {
      recovering = false;
      refresh();
    }
  }
  async function makeAll() {
    const w = world();
    if (!w) return;
    for (const c of w.cards.filter((c) => !w.sd[c.name]?.url)) {
      if (disposed || !current) break;
      await makeSd(c);
    }
  }
  async function removeSd(name) {
    const w = world();
    if (!w) return;
    const next = { ...w.sd };
    delete next[name];
    w.sd = next;
    await storePatch({ ["sd:" + w.id]: w.sd });
    refresh();
  }
  async function removeSdVariant(name, variantKey) {
    const w = world(), old = w?.sd[name];
    if (!w || !old) return;
    const variants = { ...(old.variants || {}) };
    delete variants[variantKey];
    w.sd = { ...w.sd, [name]: { ...old, variants } };
    await storePatch({ ["sd:" + w.id]: w.sd });
    sdEditKey = "";
    refresh();
  }

  // While one of ours is on, the game's own cards all read unpressed and ours reads pressed.
  function paintCards(root) {
    for (const list of root.querySelectorAll(".st-styles")) {
      for (const b of list.querySelectorAll("[data-gfx-set]")) b.setAttribute("aria-pressed", String(b.getAttribute("data-gfx-set") === current));
      if (current) for (const b of list.querySelectorAll("[data-style-set]")) if (b.getAttribute("aria-pressed") !== "false") b.setAttribute("aria-pressed", "false");
    }
  }
  const boundLists = new WeakSet();
  function mountSettings(root) {
    for (const list of root.querySelectorAll(".st-styles")) {
      if (!list.querySelector("[data-gfx-set]")) list.append(...STYLES.map(makeCard));
      if (!boundLists.has(list)) {
        boundLists.add(list);
        // Any of the game's cards hands the look back to the game; the game then saves its pick as usual.
        on(list, "click", (e) => {
          if (disposed || !e.target.closest?.("[data-style-set]") || !current) return;
          current = "";
          writeStyle("");
          refresh();
        }, { capture: true });
      }
      const stylePlate = list.closest(".st-plate");
      if (!stylePlate) continue;
      const container = stylePlate.parentElement;
      if (container && current) container.setAttribute("data-gfx-settings-view", settingsView);
      else container?.removeAttribute("data-gfx-settings-view");
      const mine = [];
      for (let n = stylePlate.nextElementSibling; n && n.hasAttribute("data-gfx-plate"); n = n.nextElementSibling) mine.push(n);
      if (current && !mine.length) {
        stylePlate.after(settingsNav(container), colorPlate(), screenPlate(), optionPlate(), sdPlate());
        loadConnections();
        loadWorld();
        paintSettings(true);
      } else if (!current && mine.length) for (const n of mine) n.remove();
    }
    paintCards(root);
  }

  /* ═════════════ Following the game ═════════════ */
  let observed = null, observer = null, scheduled = false, lastRun = "";
  function refresh() {
    if (disposed) return;
    apply();
    const root = gameRoot();
    if (!root) return;
    const id = runId();
    if (id !== lastRun) { lastRun = id; if (current) loadWorld(); }
    if (root.querySelector(".st-styles, [data-gfx-plate]")) {
      mountSettings(root);
      paintSettings();
    }
    paintSprites(root);
    ensureLoadMounted();
  }
  // Before the next paint, once per frame: the game's redraw and this extension's touches land in the same frame.
  function schedule() {
    if (disposed || scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; refresh(); });
  }
  const OWN_SELECTOR = "[data-gfx-ui], [data-gfx-plate], [data-gfx-set], .gfx-sd-list, .gfx-lobby, .gfx-team, .gfx-ev-mascot, .gfx-foe, .gfx-vn-cast, .gfx-load-host, img.gfx-sd";
  function isOwnNode(node) {
    return !!(node && node.nodeType === 1 && (node.matches?.(OWN_SELECTOR) || node.closest?.(OWN_SELECTOR)));
  }
  function isOwnMutation(record) {
    if (isOwnNode(record.target)) return true;
    if (record.type !== "childList") return false;
    const changed = [...record.addedNodes, ...record.removedNodes];
    return changed.length > 0 && changed.every((node) => node.nodeType === 1 ? isOwnNode(node) : isOwnNode(record.target));
  }
  function watch() {
    if (disposed) return;
    const root = gameRoot();
    if (root !== observed) {
      observer?.disconnect();
      observed = root;
      if (root) {
        observer = new MutationObserver((records) => {
          // The loading screen goes back at once (before paint); the rest can wait a frame or two.
          ensureLoadMounted();
          for (const r of records) {
            if (isOwnMutation(r)) continue;
            return schedule();
          }
        });
        observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-open", "data-front", "data-cg", "data-on", "src", "hidden"] });
      }
      refresh();
    }
  }
  const interval = setInterval(watch, 2000);
  // The game element is made when its tab opens (and again on reload): watch for it, so the style is on it in
  // the same frame rather than up to 1.5s later with the game's own look showing meanwhile.
  const pageObserver = new MutationObserver((records) => {
    for (const r of records) for (const n of r.addedNodes) {
      if (n.nodeType === 1 && (n.localName === HOST_TAG || n.querySelector?.(HOST_TAG))) { watch(); return; }
    }
  });
  pageObserver.observe(document.documentElement, { childList: true, subtree: true });
  const loadTick = setInterval(tickLoading, 120);
  watch();
  loadFonts();
  // Pending browser changes win until the serialized server write acknowledges them.
  storeGet().then((v) => {
    if (disposed || (!v.prefs && !readPending().prefs)) return;
    prefs = normalizePrefs({ ...(v.prefs || {}), ...(readPending().prefs || {}) });
    try { localStorage.setItem(CACHE, JSON.stringify(prefs)); } catch {}
    refresh();
    paintSettings(true);
  });
  // Another tab of the same browser changed the style.
  on(window, "storage", (e) => { if (e.key === STORE) { current = readStyle(); refresh(); } });

  window[KEY] = () => {
    if (disposed) return;
    disposed = true;
    life.abort();
    clearInterval(interval);
    clearInterval(loadTick);
    clearInterval(chatter);
    clearInterval(retryTimer);
    pageObserver.disconnect();
    if (roamFrame) cancelAnimationFrame(roamFrame);
    lobbyRO?.disconnect();
    observer?.disconnect();
    for (const baked of bakedMap.values()) if (baked && typeof baked === "object" && baked.url) URL.revokeObjectURL(baked.url);
    bakedMap.clear();
    const h = host(), root = h?.shadowRoot;
    for (const a of [ATTR, "data-gfx-box", "data-gfx-sticker", "data-gfx-motion", "data-gfx-field", "data-gfx-team", "data-gfx-hideplate", "data-gfx-attend", "data-gfx-phase", "data-gfx-lobby"]) h?.removeAttribute(a);
    if (root) root.adoptedStyleSheets = root.adoptedStyleSheets.filter((s) => s !== sheet && s !== varSheet);
    for (const n of root?.querySelectorAll("[data-gfx-set], [data-gfx-plate], [data-gfx-ui], img.gfx-sd, .gfx-forge-mascot, .gfx-foe, .gfx-team, .gfx-lobby, .gfx-ev-mascot, .gfx-tiles, .gfx-vn-cast, .gfx-load-host") || []) n.remove();
    for (const n of root?.querySelectorAll("[data-gfx-sd], [data-gfx-foe], [data-gfx-attendance], [data-gfx-settings-view]") || []) {
      n.removeAttribute("data-gfx-sd"); n.removeAttribute("data-gfx-foe"); n.removeAttribute("data-gfx-attendance"); n.removeAttribute("data-gfx-settings-view");
    }
    if (window[KEY]) delete window[KEY];
  };
})();
