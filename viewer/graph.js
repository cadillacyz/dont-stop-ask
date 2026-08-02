/* dont-stop-ask · 不停问 — question graph viewer
   Renders a question set emitted by the dont-stop-research skill.
   Reads visibility:both fields only; the schema forbids spoiler fields in this file. */

const SKILL = 'Read and follow ./skills/dont-stop-research/SKILL.md completely, including every referenced instruction file required for this task. Then run the skill for:';
const POLL_MS = 4000;

const COLOR = {
  easy: '#6fd48a',
  middle: '#f0b24a',
  technical: '#f0625d',
  reading: '#8d96b8',
  root: '#a78bfa'
};

const el = {
  svg: d3.select('#graph'),
  stage: document.getElementById('stage'),
  tip: document.getElementById('tip'),
  panel: document.getElementById('panel'),
  meta: document.getElementById('meta'),
  closePanel: document.getElementById('closepanel'),
  readerSmaller: document.getElementById('reader-smaller'),
  readerLarger: document.getElementById('reader-larger'),
  banner: document.getElementById('banner'),
  intro: document.getElementById('intro'),
  portal: document.getElementById('portal'),
  brightness: Array.from(document.querySelectorAll('[data-brightness]')),
  ask: document.getElementById('ask'),
  status: document.getElementById('status'),
  pick: document.getElementById('setpick'),
  form: document.getElementById('askform'),
  q: document.getElementById('q'),
  ctx: document.getElementById('ctx'),
  mode: document.getElementById('mode'),
  agent: document.getElementById('agent'),
  go: document.getElementById('go'),
  progress: document.getElementById('progress'),
  progText: document.getElementById('progtext'),
  progLog: document.getElementById('proglog'),
  cancelJob: document.getElementById('canceljob'),
  askFoot: document.getElementById('askfoot')
};

let DATA = null;
let HELPER = null;          // /api/status payload, or null when served as plain static files
let sim = null;
let zoom = null;
let selectedId = null;
let loaded = { url: null, mtime: 0, question: null };
let pollTimer = null;
let jobTimer = null;
let activeJobId = null;
let initialNewestMtime = 0;
let pendingGenerationSnapshot = null;

/* ---------- language ----------
   Research content stays in the language it was written in. The switch only
   changes interface chrome, labels, and help text. */

const ZH = {
  'Brightness': '亮度',
  'Choose a world to begin': '选择一个世界开始',
  'Start here': '从这里开始',
  'Every question is a world.': '每个问题都是一个世界。',
  'Every question is a world': '每个问题都是一个世界',
  'Drift toward whatever pulls at your attention. Each world opens a different way into the unknown.': '靠近那个一直吸引你注意的问题。每个世界都提供一种进入未知的方式。',
  'Start with the question you cannot stop thinking about. We will turn it into smaller questions and readings you can explore.': '从那个你一直放不下的问题开始。我们会把它变成更小的问题和可探索的阅读材料。',
  'Ask a question': '提出问题',
  'Begin here': '从这里进入',
  'Start with one question': '从一个问题开始',
  'Click here to begin': '点击这里开始',
  'Past questions': '历史问题',
  'Ask something else': '提出新问题',
  'Fit view': '适应视图',
  'Begin with uncertainty': '从不确定开始',
  'What question have you been thinking about?': '你最近一直在思考什么问题？',
  'Ask the unfinished question. We’ll turn it into a map of sharper questions and readings worth opening.': '写下这个还没有答案的问题。我们会把它变成更清晰的问题地图，并推荐值得阅读的资料。',
  'Write it in your own words. You will get a map of smaller questions and readings to explore.': '用你自己的话写下来。你会得到一张由更小的问题和阅读材料组成的探索地图。',
  'Your question': '你的问题',
  'What do you want to understand?': '你想理解什么？',
  "What you already know, and why you're asking (optional, but it sharpens the set)": '你已经知道什么，以及为什么会问这个问题（可选，但有助于把问题说清楚）',
  'One question is enough to begin.': '一个问题就足以开始。',
  'Add context or change research settings': '添加背景或更改研究设置',
  'Context (optional)': '背景信息（可选）',
  'What do you already know, and why are you asking?': '你已经知道什么？为什么会问这个问题？',
  'Researching for': '研究对象',
  'Research with': '研究工具',
  'researching it myself': '我自己研究',
  'helping someone else research it': '帮助别人研究',
  'with': '使用',
  'Ask': '提问',
  'Cancel': '取消',
  'easier': '较容易',
  'middle': '中等',
  'most technical': '技术性最高',
  'reading': '阅读资料',
  'your question': '你的问题',
  'drag dots · scroll to zoom · click for readings': '拖动节点 · 滚轮缩放 · 点击查看阅读资料',
  'Checking for past questions…': '正在查找历史问题…',
  'Choose a past question…': '选择一个历史问题…',
  'No past questions yet': '还没有历史问题',
  'best available agent': '最佳可用智能体',
  'no helper': '本地服务未启动',
  'agent needed': '需要安装智能体',
  'ready': '已就绪',
  'Explore the question galaxy': '探索问题星系',
  'Do Not Stop Ask on GitHub': '在 GitHub 上查看 Do Not Stop Ask',
  'Interface language': '界面语言',
  'Scene brightness': '场景亮度',
  'Reading observatory': '阅读观测站',
  'Reading text size': '阅读文字大小',
  'Make reading text smaller': '缩小阅读文字',
  'Make reading text larger': '放大阅读文字',
  'Back to question map': '返回问题地图',
  'Map': '地图',
  'Begin with one question world': '从一个问题世界开始',
  'Local helper status': '本地服务状态',
  'Open a past question': '打开一个历史问题',
  'Question graph': '问题图谱',
  'Who the briefing is written for': '研究简报为谁而写',
  'Local agent used to research the question': '用于研究问题的本地智能体',
  'Agent': '智能体',
  'Click a question to see its readings and how to work it.': '点击一个问题，查看它的阅读材料和使用方法。',
  'Nothing loaded yet. Ask a question, and the graph will appear here.': '还没有加载任何内容。提出一个问题，图谱就会出现在这里。',
  'Nobody has looked this set over yet.': '这套问题还没有人审阅过。',
  'Working question · sharpened by triage': '工作问题 · 已经审题磨锋利',
  'Refined question': '优化后的问题',
  'Original question': '原始问题',
  'Asked as:': '原本的问法：',
  'Question card': '问题卡',
  'Reading source': '阅读来源',
  'A letter prefix and number identify a question in this set.': '字母前缀和数字共同标识这套问题中的一个问题。',
  'S identifies a reading source used by questions.': 'S 表示问题引用的一条阅读来源。',
  'Readings, ranked': '阅读材料（按相关度排序）',
  'Check before reading': '阅读前先核查',
  'Look for while reading': '阅读时留意',
  'Recommended readings': '推荐阅读',
  'Question details': '问题详情',
  'Reading details': '阅读详情',
  'Why one reading': '为什么只有一份阅读',
  'Open reading': '打开阅读材料',
  'Difficulty': '难度',
  'Question group': '问题组',
  'Question type': '问题类型',
  'Verification': '核实情况',
  'Access': '获取方式',
  'Estimated time': '预计时间',
  'Used by:': '被引用于：',
  'Free route:': '免费途径：',
  'How we checked:': '我们如何核实：',
  'What makes it hard:': '难在哪里：',
  'Find it:': '如何找到：',
  'Unconfirmed:': '未确认：',
  'Reading': '阅读材料',
  'Source ID': '来源编号',
  'no reading': '无需阅读',
  'Thinking-only card.': '纯思考卡——不需要阅读。',
  'One reading because:': '只配一份阅读材料，因为：',
  'core group': '核心组',
  'supporting group': '支撑组',
  'context group': '外围组',
  'Expand into more': '展开成更多问题',
  'Copy expansion prompt': '复制展开指令',
  'Copied — paste into Claude Code': '已复制——粘贴进 Claude Code',
  'expansion': '次展开',
  'Archive branch': '归档分支',
  'Keep it': '保留',
  'Ask once. Your local agent researches it here, and the question map opens when it is ready.': '只需提问一次。本地智能体会在这里研究，完成后自动打开问题地图。',
  'Space, ↑, or tap to jump while you wait.': '等待时可按空格键、↑ 或点击画面来跳跃。',
  'Install Codex, Claude Code, Cursor, or GitHub Copilot, then restart this helper to ask without copy and paste.': '安装 Codex、Claude Code、Cursor 或 GitHub Copilot，然后重启本地服务，即可直接提问，无需复制粘贴。',
  'Start with python scripts/serve.py so this page can run your local agent for you.': '先运行 python scripts/serve.py，这个页面就能替你调用本地智能体。',
  'Meaning': '含义', 'Landscape': '全景', 'Mechanism': '机制', 'Tension': '张力',
  'Evidence': '证据', 'Scope': '边界', 'Stake': '意义'
};

let uiLang = 'en';

function isZh() {
  return uiLang === 'zh';
}

function T(s) {
  return (isZh() && ZH[s]) || s;
}

function applyLanguage(lang, persist = true) {
  uiLang = lang === 'zh' ? 'zh' : 'en';
  document.documentElement.lang = uiLang === 'zh' ? 'zh-CN' : 'en';

  document.querySelectorAll('[data-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.language === uiLang));
  });
  document.querySelectorAll('[data-i18n]').forEach(node => {
    node.textContent = T(node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(node => {
    node.placeholder = T(node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(node => {
    node.setAttribute('aria-label', T(node.dataset.i18nAriaLabel));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(node => {
    node.title = T(node.dataset.i18nTitle);
  });

  if (persist) {
    try { localStorage.setItem('dsa-language', uiLang); } catch {}
  }

  setStatus();
  syncPicker();
  updateAskFoot();

  if (DATA) {
    const keep = selectedId;
    renderMeta();
    render();
    if (keep) reselect(keep);
    else resetPanel();
  } else {
    resetPanel();
  }
}

/* ---------- small helpers ---------- */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function banner(msg, kind) {
  if (!msg) { el.banner.hidden = true; el.banner.innerHTML = ''; return; }
  el.banner.hidden = false;
  el.banner.classList.toggle('err', kind === 'error');
  el.banner.innerHTML = msg;
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { return false; }
}

function askPrompt() {
  const bits = [`${SKILL} ${el.q.value.trim()}`];
  if (el.ctx.value.trim()) bits.push(`context: ${el.ctx.value.trim()}`);
  bits.push(`mode: ${el.mode.value}`);
  bits.push('output_dir: ./question-sets/');
  return bits.join('\n');
}

function expandPrompt(node, question) {
  const rel = (loaded.url || './question-sets/your-set.json').replace(/^\//, '');
  return `${SKILL} expand_from: ${rel}#${node}\n\n` +
    `Expand this node: "${question}"\n` +
    `Generate up to nine verified follow-up questions (fewer if any would be padding), each with ` +
    `one to three ranked readings, grouped by relevance to this node's question. Append the ` +
    `cluster to the existing artifact and write a new JSON containing the union of old and new ` +
    `nodes, per STAGE 4 of the skill.\n` +
    `output_dir: ./question-sets/`;
}

function apiHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-DSA-Token': (HELPER && HELPER.token) || ''
  };
}

function safeHttpUrl(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') ? url.href : null;
  } catch {
    return null;
  }
}

/* ---------- loading ---------- */

function validate(d) {
  const problems = [];
  if (!d || typeof d !== 'object') return ['not a JSON object'];
  if (!d.meta || typeof d.meta !== 'object') problems.push('missing meta');
  if (!d.root || d.root.id !== 'root') problems.push('missing root');
  if (!Array.isArray(d.questions) || !d.questions.length) problems.push('missing questions');
  if (!d.sources || typeof d.sources !== 'object' || Array.isArray(d.sources)) problems.push('missing sources');
  const leaked = ['why_this', 'they_might_say', 'if_stuck'];
  const ids = new Set();
  (d.questions || []).forEach(q => {
    if (!q || typeof q !== 'object') { problems.push('question is not an object'); return; }
    if (!/^[A-Z]+[0-9]+$/.test(q.id || '')) problems.push(`bad question id ${q.id || '(missing)'}`);
    if (ids.has(q.id)) problems.push(`duplicate question id ${q.id}`);
    ids.add(q.id);
    ['parent', 'question', 'label', 'check_first', 'read_for', 'level'].forEach(k => {
      if (typeof q[k] !== 'string' || !q[k].trim()) problems.push(`${q.id || '(missing)'} missing ${k}`);
    });
    if (!Array.isArray(q.readings)) problems.push(`${q.id || '(missing)'} missing readings`);
    leaked.forEach(k => { if (k in q) problems.push(`${q.id} contains spoiler field "${k}"`); });
    (q.readings || []).forEach(r => {
      if (!r || typeof r !== 'object') { problems.push(`${q.id} has an invalid reading`); return; }
      if (!d.sources || !d.sources[r.source]) problems.push(`${q.id} cites unknown source ${r.source}`);
    });
  });
  Object.entries(d.sources || {}).forEach(([sid, source]) => {
    if (!source || typeof source !== 'object') { problems.push(`${sid} is not a source object`); return; }
    if (!source.citation) problems.push(`${sid} missing citation`);
    if (source.url && !safeHttpUrl(source.url)) problems.push(`${sid} has an unsafe or invalid URL`);
  });
  return problems;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, { cache: 'no-store', ...options });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function accept(d, source) {
  const problems = validate(d);
  if (problems.length) {
    banner(`This set does not match the schema: ${esc(problems.slice(0, 3).join('; '))}`, 'error');
    return false;
  }
  DATA = d;
  if (source) loaded = { url: source.url, mtime: source.mtime || 0, question: (d.meta || {}).working_question };
  hideAsk();
  renderMeta();
  render();
  resetPanel();
  return true;
}

async function loadSet(entry, opts = {}) {
  try {
    const d = await fetchJson(entry.url);
    const keep = opts.keepSelection ? selectedId : null;
    if (!accept(d, entry)) return false;
    if (keep) reselect(keep);
    if (opts.note) banner(opts.note);
    syncPicker();
    return true;
  } catch (err) {
    banner(`Could not load ${esc(entry.url)} — ${esc(err.message)}`, 'error');
    return false;
  }
}

async function boot() {
  const param = new URLSearchParams(location.search).get('data');

  try {
    HELPER = await fetchJson('/api/status');
  } catch {
    HELPER = null;
  }

  setStatus();

  const generated = ((HELPER && HELPER.sets) || []).filter(s => s.origin === 'question-sets');
  initialNewestMtime = generated.length ? generated[0].mtime : 0;
  syncPicker();

  if (param) {
    await loadSet({ url: param, mtime: 0 });
  } else {
    showIntro();
  }

  if (HELPER) startWatching();
}

function setStatus() {
  if (!HELPER) {
    el.status.className = 'status';
    el.status.textContent = T('no helper');
    el.status.title = isZh()
      ? '当前以静态文件方式打开。运行 scripts/serve.py 可自动加载。'
      : 'Opened as plain files. Run scripts/serve.py for auto-loading.';
    return;
  }
  if (HELPER.cli) {
    el.status.className = 'status live';
    const chosen = (HELPER.agents || [])[0];
    el.status.textContent = chosen ? `${T('ready')} · ${chosen.label}` : `${T('ready')} · local agent`;
    el.status.title = isZh()
      ? `正在监看 ${HELPER.sets_dir}。问题将直接交给${chosen ? chosen.label : '本地智能体'}运行。`
      : `Watching ${HELPER.sets_dir}. Questions run directly with ${chosen ? chosen.label : 'the local agent'}.`;
    el.agent.innerHTML = `<option value="auto">${T('best available agent')}</option>` +
      (HELPER.agents || []).map(agent => `<option value="${esc(agent.id)}">${esc(agent.label)}</option>`).join('');
  } else {
    el.status.className = 'status partial';
    el.status.textContent = T('agent needed');
    el.status.title = isZh()
      ? '安装 Codex、Claude Code、Cursor 或 GitHub Copilot，然后重启本地服务。'
      : 'Install Codex, Claude Code, Cursor, or GitHub Copilot, then restart this helper.';
  }
}

/* ---------- watching the folder ---------- */

function startWatching() {
  clearInterval(pollTimer);
  pollTimer = setInterval(poll, POLL_MS);
}

function currentSetSnapshot() {
  return Object.fromEntries(
    ((HELPER && HELPER.sets) || [])
      .filter(set => set.origin === 'question-sets')
      .map(set => [set.url, set.mtime])
  );
}

async function poll() {
  let sets;
  try { sets = (await fetchJson('/api/sets')).sets || []; }
  catch { return; }

  if (HELPER) HELPER.sets = sets;
  syncPicker();

  // Only ever auto-follow generated sets. The bundled example is loaded on
  // request, never pushed at anyone.
  const newest = sets.filter(s => s.origin === 'question-sets')[0];
  if (!newest) return;

  if (pendingGenerationSnapshot &&
      (!(newest.url in pendingGenerationSnapshot) ||
       newest.mtime > pendingGenerationSnapshot[newest.url])) {
    pendingGenerationSnapshot = null;
    stopProgress();
    await loadSet(newest, {
      note: isZh()
        ? `<strong>${esc(newest.name)}</strong> 已生成并自动打开。`
        : `<strong>${esc(newest.name)}</strong> was generated and opened automatically.`
    });
    return;
  }

  // Nothing loaded yet: the first set to appear wins, which is the moment
  // a freshly generated set shows up on its own.
  if (!DATA && newest.mtime > initialNewestMtime) {
    stopProgress();
    await loadSet(newest, {
      note: isZh()
        ? `<strong>${esc(newest.name)}</strong> 刚刚生成，已自动加载。`
        : `<strong>${esc(newest.name)}</strong> just appeared — loaded it.`
    });
    return;
  }

  if (newest.url === loaded.url) {
    if (newest.mtime > loaded.mtime) {
      await loadSet(newest, {
        keepSelection: true,
        note: isZh()
          ? `<strong>${esc(newest.name)}</strong> 已在磁盘上更新，现已重新加载。`
          : `<strong>${esc(newest.name)}</strong> changed on disk — reloaded.`
      });
      stopProgress();
    }
    return;
  }

  if (newest.mtime <= loaded.mtime) return;

  // A different, newer file. If it is about the same question it is a
  // regeneration or an expansion of what we are looking at, so follow it.
  if (newest.working_question && newest.working_question === loaded.question) {
    await loadSet(newest, {
      keepSelection: true,
      note: isZh()
        ? `已跟随 <strong>${esc(newest.name)}</strong>——同一个问题的更新文件。`
        : `Followed <strong>${esc(newest.name)}</strong> — same question, newer file.`
    });
    stopProgress();
  } else {
    banner(isZh()
      ? `磁盘上有更新的问题集：<strong>${esc(newest.name)}</strong>——<a href="#" id="loadnew">加载</a>`
      : `A newer set is on disk: <strong>${esc(newest.name)}</strong> — <a href="#" id="loadnew">load it</a>`);
    const link = document.getElementById('loadnew');
    if (link) link.addEventListener('click', async ev => {
      ev.preventDefault();
      stopProgress();
      await loadSet(newest, { note: null });
      banner(null);
    });
  }
}

function syncPicker() {
  const sets = ((HELPER && HELPER.sets) || []).filter(s => s.origin === 'question-sets');
  if (!sets.length) {
    el.pick.disabled = true;
    el.pick.innerHTML = `<option value="">${T('No past questions yet')}</option>`;
    return;
  }

  el.pick.disabled = false;
  const current = loaded.url;
  const hasCurrent = sets.some(s => s.url === current);
  const placeholder = hasCurrent
    ? ''
    : `<option value="" selected>${T('Choose a past question…')}</option>`;
  el.pick.innerHTML = placeholder + sets.map(s =>
    `<option value="${esc(s.url)}"${s.url === current ? ' selected' : ''}>${esc(s.working_question || s.name)}</option>`
  ).join('');
}

el.pick.addEventListener('change', async e => {
  if (!e.target.value) return;
  const entry = ((HELPER && HELPER.sets) || []).find(s => s.url === e.target.value);
  if (entry) { banner(null); await loadSet(entry); }
});

/* ---------- the ask flow ---------- */

function showIntro() {
  el.intro.hidden = false;
  el.ask.hidden = true;
  document.body.className = 'intro-mode';
  setTimeout(() => el.portal.focus(), 50);
}

function showAsk() {
  el.intro.hidden = true;
  el.ask.hidden = false;
  el.progress.hidden = true;
  banner(null);
  document.body.className = 'ask-mode';
  if (!DATA) { el.meta.innerHTML = ''; resetPanel(); }
  updateAskFoot();
  setTimeout(() => el.q.focus(), 50);
}

function updateAskFoot() {
  el.askFoot.textContent = T(HELPER
    ? (HELPER.cli
        ? 'Ask once. Your local agent researches it here, and the question map opens when it is ready.'
        : 'Install Codex, Claude Code, Cursor, or GitHub Copilot, then restart this helper to ask without copy and paste.')
    : 'Start with python scripts/serve.py so this page can run your local agent for you.');
}

/* ---------- a small dino-runner to play while the real research job works ----------
   Purely decorative: never reflects job state, never blocks it, and stops the moment
   startProgress()/stopProgress() do. Skipped entirely under prefers-reduced-motion. */
const waitGame = (() => {
  const canvas = document.getElementById('waitgame');
  if (!canvas) return { start() {}, stop() {} };
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const GROUND_Y = H - 24;
  const GRAVITY = 0.9;
  const JUMP_V = -13;
  const CAT_X = 40, CAT_W = 26, CAT_H = 20;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Five furniture pieces, each a fixed size/shape rather than a random box,
     so they read as distinct obstacles instead of interchangeable blocks. */
  const FURNITURE = [
    { kind: 'chair', w: 14, h: 18 },
    { kind: 'table', w: 30, h: 14 },
    { kind: 'lamp', w: 10, h: 32 },
    { kind: 'sofa', w: 36, h: 16 },
    { kind: 'shelf', w: 16, h: 36 }
  ];

  let running = false;
  let raf = null;
  let catY, velY, onGround, obstacles, speed, score, alive, sinceSpawn;

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function reset() {
    catY = GROUND_Y - CAT_H;
    velY = 0;
    onGround = true;
    obstacles = [];
    speed = 5;
    score = 0;
    alive = true;
    sinceSpawn = 0;
  }

  function jump() {
    if (!running) return;
    if (!alive) { reset(); return; }
    if (onGround) { velY = JUMP_V; onGround = false; }
  }

  function spawnObstacle() {
    const piece = FURNITURE[Math.floor(Math.random() * FURNITURE.length)];
    obstacles.push({ x: W + 10, w: piece.w, h: piece.h, kind: piece.kind });
  }

  function fillShape(x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, w, h);
    }
  }

  /* A fat, round, unmistakably cute cat — an oval body, a round head with
     triangle ears, dot eyes, and a curled tail — built from primitive shapes
     so no image asset is needed. */
  function drawCat(y) {
    const bodyW = CAT_W, bodyH = CAT_H * 0.66;
    const cx = CAT_X + bodyW / 2;
    const bodyCy = y + CAT_H - bodyH / 2;
    const fur = cssVar('--ember', '#ffbd73');
    const ink = cssVar('--bg', '#070a12');

    ctx.fillStyle = fur;
    ctx.strokeStyle = fur;

    // curled tail, drawn first so the body overlaps its base
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - bodyW * 0.42, bodyCy + bodyH * 0.15);
    ctx.quadraticCurveTo(cx - bodyW * 0.95, bodyCy - bodyH * 0.55, cx - bodyW * 0.55, bodyCy - bodyH * 0.95);
    ctx.stroke();

    // fat oval body
    ctx.beginPath();
    ctx.ellipse(cx, bodyCy, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // round head with a slight muzzle bump
    const headR = CAT_H * 0.32;
    const headCx = cx + bodyW * 0.24;
    const headCy = y + headR * 0.95;
    ctx.beginPath();
    ctx.arc(headCx, headCy, headR, 0, Math.PI * 2);
    ctx.fill();

    // ears
    ctx.beginPath();
    ctx.moveTo(headCx - headR * 0.75, headCy - headR * 0.55);
    ctx.lineTo(headCx - headR * 0.25, headCy - headR * 1.65);
    ctx.lineTo(headCx + headR * 0.1, headCy - headR * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(headCx + headR * 0.25, headCy - headR * 0.75);
    ctx.lineTo(headCx + headR * 0.7, headCy - headR * 1.7);
    ctx.lineTo(headCx + headR * 0.95, headCy - headR * 0.55);
    ctx.closePath();
    ctx.fill();

    // eyes
    ctx.fillStyle = ink;
    ctx.beginPath(); ctx.arc(headCx - headR * 0.3, headCy - headR * 0.05, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(headCx + headR * 0.35, headCy - headR * 0.05, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  function drawFurniture(o) {
    const x = o.x, w = o.w, h = o.h;
    const topY = GROUND_Y - h;
    const wood = cssVar('--reading', '#8d96b8');
    const cutout = cssVar('--bg', '#070a12');
    ctx.fillStyle = wood;
    ctx.strokeStyle = cutout;

    switch (o.kind) {
      case 'chair': {
        const seatH = h * 0.42;
        fillShape(x, GROUND_Y - seatH, w, seatH, 1.5);
        fillShape(x + w - 4, topY, 4, h, 1.5);
        break;
      }
      case 'table': {
        fillShape(x, topY, w, 4, 1.5);
        ctx.fillRect(x + 1.5, topY + 4, 2.5, h - 4);
        ctx.fillRect(x + w - 4, topY + 4, 2.5, h - 4);
        break;
      }
      case 'lamp': {
        ctx.fillRect(x + w / 2 - 1.5, topY + 9, 3, h - 9);
        ctx.beginPath();
        ctx.moveTo(x + w / 2 - 5, topY + 9);
        ctx.lineTo(x + w / 2 + 5, topY + 9);
        ctx.lineTo(x + w / 2 + 3, topY);
        ctx.lineTo(x + w / 2 - 3, topY);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'sofa': {
        fillShape(x, GROUND_Y - h * 0.6, w, h * 0.6, 3);
        fillShape(x, topY, 5, h, 2);
        fillShape(x + w - 5, topY, 5, h, 2);
        break;
      }
      case 'shelf': {
        fillShape(x, topY, w, h, 1.5);
        ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
          const ly = topY + (h / 3) * i;
          ctx.beginPath();
          ctx.moveTo(x + 2, ly);
          ctx.lineTo(x + w - 2, ly);
          ctx.stroke();
        }
        break;
      }
      default:
        fillShape(x, topY, w, h, 1.5);
    }
  }

  function step() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = cssVar('--line', '#242c40');
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 1);
    ctx.lineTo(W, GROUND_Y + 1);
    ctx.stroke();

    if (alive) {
      velY += GRAVITY;
      catY += velY;
      if (catY >= GROUND_Y - CAT_H) { catY = GROUND_Y - CAT_H; velY = 0; onGround = true; }

      sinceSpawn++;
      if (sinceSpawn > 55 - Math.min(25, Math.floor(speed * 2))) {
        spawnObstacle();
        sinceSpawn = 0;
      }
      obstacles.forEach(o => { o.x -= speed; });
      obstacles = obstacles.filter(o => o.x + o.w > -5);
      speed = Math.min(11, speed + 0.0025);
      score += 0.1;

      /* A small inset on the cat's hitbox so close calls feel fair rather than cheap. */
      const dx1 = CAT_X + 3, dx2 = CAT_X + CAT_W - 3, dy1 = catY + 3, dy2 = catY + CAT_H;
      for (const o of obstacles) {
        const ox1 = o.x, ox2 = o.x + o.w, oy1 = GROUND_Y - o.h, oy2 = GROUND_Y;
        if (dx2 > ox1 && dx1 < ox2 && dy2 > oy1 && dy1 < oy2) { alive = false; break; }
      }
    }

    obstacles.forEach(drawFurniture);
    drawCat(catY);

    ctx.fillStyle = cssVar('--fg-3', '#9ed8ff');
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(String(Math.floor(score)).padStart(5, '0'), W - 8, 16);

    if (!alive) {
      ctx.fillStyle = cssVar('--fg', '#f1f4ff');
      ctx.textAlign = 'center';
      ctx.font = '13px ui-monospace, monospace';
      ctx.fillText(
        isZh() ? '游戏结束 — 再次跳跃即可重新开始' : 'Game over — jump again to retry',
        W / 2, H / 2
      );
    }

    raf = requestAnimationFrame(step);
  }

  canvas.addEventListener('click', jump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, { passive: false });
  window.addEventListener('keydown', e => {
    if (!running) return;
    if (e.key !== ' ' && e.key !== 'ArrowUp') return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    e.preventDefault();
    jump();
  });

  return {
    start() {
      if (reduceMotion || running) return;
      running = true;
      reset();
      raf = requestAnimationFrame(step);
    },
    stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      ctx.clearRect(0, 0, W, H);
    }
  };
})();

function hideAsk() {
  el.intro.hidden = true;
  el.ask.hidden = true;
  document.body.className = 'graph-mode';
  stopProgress();
}

function startProgress(text) {
  el.progress.hidden = false;
  el.progText.textContent = text;
  el.progLog.textContent = '';
  el.go.disabled = true;
  el.cancelJob.hidden = true;
  el.cancelJob.disabled = false;
  waitGame.start();
}

function stopProgress() {
  clearInterval(jobTimer);
  jobTimer = null;
  el.progress.hidden = true;
  el.go.disabled = false;
  el.cancelJob.hidden = true;
  el.cancelJob.disabled = false;
  activeJobId = null;
  waitGame.stop();
}

function watchJob(jobId, generationSnapshot = currentSetSnapshot()) {
  clearInterval(jobTimer);
  activeJobId = jobId;
  pendingGenerationSnapshot = generationSnapshot;
  el.cancelJob.hidden = false;
  jobTimer = setInterval(async () => {
    let job;
    try { job = await fetchJson(`/api/jobs/${jobId}`, { headers: { 'X-DSA-Token': HELPER.token } }); }
    catch { return; }
    const terminal = job.state !== 'running';
    el.progText.textContent = isZh()
      ? (job.state === 'running'
          ? `正在研究… ${job.elapsed} 秒。核实来源可能需要几分钟。`
          : job.state === 'done' ? '研究完成，正在等待文件…'
            : job.state === 'cancelled' ? '已取消。'
              : job.state === 'timed_out' ? '达到时间限制，已停止。'
                : '本次运行失败。')
      : (job.state === 'running'
          ? `Working… ${job.elapsed}s. Verifying sources takes a few minutes.`
          : job.state === 'done' ? 'Finished. Waiting for the file…'
            : job.state === 'cancelled' ? 'Cancelled.'
              : job.state === 'timed_out' ? 'Stopped after reaching the time limit.'
                : 'That run failed.');
    el.progLog.textContent = (job.log || []).join('\n');
    el.progLog.scrollTop = el.progLog.scrollHeight;
    if (terminal) {
      clearInterval(jobTimer);
      jobTimer = null;
      activeJobId = null;
      el.cancelJob.hidden = true;
      el.go.disabled = false;
    }
    if (['failed', 'cancelled', 'timed_out'].includes(job.state)) {
      pendingGenerationSnapshot = null;
      stopProgress();
      const message = isZh()
        ? (job.state === 'cancelled' ? '生成任务已取消。'
          : job.state === 'timed_out' ? '生成任务已达到时间限制。' : '生成任务失败。')
        : (job.state === 'cancelled' ? 'The generation run was cancelled.'
          : job.state === 'timed_out' ? 'The generation run reached its time limit.'
            : 'The generation run failed.');
      banner(message, job.state === 'cancelled' ? null : 'error');
    }
  }, 1500);
}

el.cancelJob.addEventListener('click', async () => {
  if (!activeJobId || !HELPER) return;
  el.cancelJob.disabled = true;
  try {
    const res = await fetch(`/api/jobs/${activeJobId}/cancel`, {
      method: 'POST',
      headers: apiHeaders(),
      body: '{}'
    });
    if (!res.ok) throw new Error(`${res.status}`);
    pendingGenerationSnapshot = null;
    stopProgress();
    banner(isZh() ? '生成任务已取消。' : 'The generation run was cancelled.');
  } catch {
    el.cancelJob.disabled = false;
    banner(isZh() ? '无法取消该任务，它可能已经结束。' : 'Could not cancel that run. It may have already finished.', 'error');
  }
});

el.form.addEventListener('submit', async ev => {
  ev.preventDefault();
  const question = el.q.value.trim();
  if (question.length < 8) { el.q.focus(); return; }
  banner(null);

  if (!HELPER) {
    return banner(isZh()
      ? '请使用 scripts/serve.py 启动应用，以便运行本地智能体。'
      : 'Start this app with scripts/serve.py so it can run a local agent.', 'error');
  }
  if (!HELPER.cli) {
    return banner(isZh()
      ? '请安装 Codex、Claude Code、Cursor 或 GitHub Copilot，重启本地服务后再次提问。'
      : 'Install Codex, Claude Code, Cursor, or GitHub Copilot, restart the helper, and then ask again.', 'error');
  }

  startProgress(isZh() ? '正在启动…' : 'Starting…');
  const generationSnapshot = currentSetSnapshot();
  let res;
  try {
    res = await fetch('/api/ask', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ question, context: el.ctx.value, mode: el.mode.value, agent: el.agent.value })
    });
  } catch (err) {
    stopProgress();
    return banner(isZh()
      ? `无法连接本地服务：${esc(err.message)}`
      : `Could not reach the local helper: ${esc(err.message)}`, 'error');
  }

  const body = await res.json().catch(() => ({}));
  if (res.ok && body.job) { watchJob(body.job, generationSnapshot); return; }
  stopProgress();
  banner(esc(body.message || body.error || 'Could not start the local agent.'), 'error');
});

el.portal.addEventListener('click', showAsk);

function applyBrightness(rawValue, persist = true) {
  const value = Math.max(45, Math.min(100, Number(rawValue) || 56));
  document.documentElement.style.setProperty('--scene-brightness', String(value / 100));
  el.brightness.forEach(input => {
    input.value = String(value);
    input.setAttribute('aria-valuetext', `${value}%`);
  });
  if (persist) {
    try { localStorage.setItem('dsa-brightness', String(value)); } catch {}
  }
}

let savedBrightness = 56;
try { savedBrightness = localStorage.getItem('dsa-brightness') || 56; } catch {}
applyBrightness(savedBrightness, false);
el.brightness.forEach(input => input.addEventListener('input', event => applyBrightness(event.target.value)));
document.querySelectorAll('[data-language]').forEach(button => {
  button.addEventListener('click', () => applyLanguage(button.dataset.language));
});

document.getElementById('newq').addEventListener('click', () => {
  el.q.value = '';
  el.ctx.value = '';
  showAsk();
});

document.getElementById('fit').addEventListener('click', () => {
  const fn = el.svg.node().__fit;
  if (fn) fn();
});

/* ---------- meta ---------- */

function renderMeta() {
  const m = DATA.meta || {};
  const draft = m.status === 'draft';
  const bits = [];
  if (m.status) bits.push(`<span class="pill ${draft ? 'draft' : ''}">${esc(m.status)}</span>`);
  if (m.generated_at) bits.push(`<span class="pill">${esc(m.generated_at)}</span>`);
  if (m.mode) bits.push(`<span class="pill">${esc(m.mode)}</span>`);
  const nExp = (m.expansions || []).length;
  if (nExp) bits.push(`<span class="pill">${nExp} ${isZh() ? T('expansion') : 'expansion' + (nExp > 1 ? 's' : '')}</span>`);

  el.meta.innerHTML =
    `<h1>${esc(m.working_question || '(no working question)')}</h1>` +
    `<p>${bits.join(' ')}</p>` +
    (draft ? `<p class="muted" style="margin-top:8px">${T('Nobody has looked this set over yet.')}</p>` : '');
}

/* ---------- graph ---------- */

function buildGraph() {
  const nodes = [];
  const links = [];
  const rootId = (DATA.root && DATA.root.id) || 'root';
  const visibleQuestions = DATA.questions.filter(q => !q.archived_at);

  nodes.push({
    id: rootId,
    kind: 'root',
    r: 16,
    col: COLOR.root,
    label: (DATA.root && DATA.root.label) || 'Working question'
  });

  visibleQuestions.forEach(q => {
    nodes.push({
      id: q.id,
      kind: 'question',
      r: q.load_bearing ? 12.5 : 10.5,
      col: COLOR[q.difficulty] || COLOR.middle,
      label: q.label || q.id,
      q
    });
    links.push({ source: q.parent || rootId, target: q.id, strong: true });
    (q.readings || []).forEach(rd => {
      links.push({ source: q.id, target: rd.source, strong: rd.role === 'primary' });
    });
  });

  const used = new Set();
  visibleQuestions.forEach(q => (q.readings || []).forEach(rd => used.add(rd.source)));
  Object.keys(DATA.sources || {}).forEach(sid => {
    if (!used.has(sid)) return;
    const s = DATA.sources[sid];
    nodes.push({
      id: sid,
      kind: 'source',
      r: 5.5,
      col: COLOR.reading,
      label: s.short || sid,
      unconfirmed: s.verified === 'unconfirmed'
    });
  });

  const known = new Set(nodes.map(n => n.id));
  return { nodes, links: links.filter(l => known.has(l.source) && known.has(l.target)) };
}

/* Relevance groups become gravity wells, one ring per parent cluster,
   so an expansion settles beside its parent rather than on top of it. */
function anchors(nodes, W, H) {
  const parents = [...new Set(nodes.filter(n => n.kind === 'question').map(n => n.q.parent))];
  const map = {};
  const cx = W / 2, cy = H / 2;
  const spread = Math.min(W, H) * 0.36;
  parents.forEach((p, i) => {
    const base = parents.length === 1 ? 0 : (-Math.PI / 2) + (i * 2 * Math.PI / parents.length);
    const px = parents.length === 1 ? cx : cx + Math.cos(base) * spread * 0.95;
    const py = parents.length === 1 ? cy : cy + Math.sin(base) * spread * 0.95;
    ['core', 'supporting', 'context'].forEach((g, j) => {
      const a = base + (j - 1) * 0.85;
      map[`${p}|${g}`] = {
        x: px + Math.cos(a) * spread * (0.5 + j * 0.12),
        y: py + Math.sin(a) * spread * (0.5 + j * 0.12)
      };
    });
  });
  return map;
}

function render() {
  el.svg.selectAll('*').remove();
  const { nodes, links } = buildGraph();
  const W = el.stage.clientWidth || 900;
  const H = el.stage.clientHeight || 600;
  el.svg.attr('viewBox', [0, 0, W, H]);

  const defs = el.svg.append('defs');
  const gradients = [
    ['root-world', '#f2dcff', '#9e62ea', '#24104f'],
    ['easy-world', '#dcfff4', '#42caa4', '#093d42'],
    ['middle-world', '#fff0aa', '#f2764d', '#541531'],
    ['technical-world', '#ffd2da', '#e64d73', '#3a0d36'],
    ['reading-world', '#e5efff', '#7889c5', '#171b3d']
  ];
  gradients.forEach(([id, light, mid, dark]) => {
    /* Limb-darkening: a sphere reads as solid only if the rim is darker than the
       midtone, not just a fade to the same "dark" stop used for the base color. */
    const rim = d3.color(dark).darker(0.85).formatHex();
    const gradient = defs.append('radialGradient')
      .attr('id', id).attr('cx', '30%').attr('cy', '24%').attr('r', '70%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#fff');
    gradient.append('stop').attr('offset', '5%').attr('stop-color', light);
    gradient.append('stop').attr('offset', '28%').attr('stop-color', mid);
    gradient.append('stop').attr('offset', '66%').attr('stop-color', dark);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', rim);
  });

  const g = el.svg.append('g');
  zoom = d3.zoom().scaleExtent([0.35, 3]).on('zoom', e => g.attr('transform', e.transform));
  el.svg.call(zoom);

  const A = anchors(nodes, W, H);
  const anchorOf = n => (n.kind === 'question' ? A[`${n.q.parent}|${n.q.relevance_group}`] : null);

  sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(l => (l.strong ? 118 : 160)).strength(0.45))
    .force('charge', d3.forceManyBody().strength(-580).distanceMax(Math.min(W, H) * 0.8))
    .force('center', d3.forceCenter(W / 2, H / 2).strength(0.06))
    /* Collide radius covers the label sitting above each dot, not just the dot. */
    .force('collide', d3.forceCollide().radius(d => (d.kind === 'source' ? d.r + 16 : d.r + 30)))
    .force('x', d3.forceX(d => (anchorOf(d) || { x: W / 2 }).x).strength(d => (anchorOf(d) ? 0.11 : 0.015)))
    .force('y', d3.forceY(d => (anchorOf(d) || { y: H / 2 }).y).strength(d => (anchorOf(d) ? 0.11 : 0.015)));

  const edge = g.append('g').selectAll('path').data(links).join('path')
    .attr('class', l => 'edge' + (l.strong ? '' : ' weak'));

  const halo = g.append('g').selectAll('circle').data(nodes).join('circle')
    .attr('class', 'halo').attr('r', d => d.r * 2.4).attr('fill', d => d.col);

  const planetFill = d => {
    if (d.kind === 'root') return 'url(#root-world)';
    if (d.kind === 'source') return 'url(#reading-world)';
    return `url(#${d.q.difficulty || 'middle'}-world)`;
  };

  /* Reading/source nodes stay plain gradient dots — there can be many of
     them per set, and the textured planet look is reserved for the root and
     question nodes that carry the actual visual weight of the graph. */
  const dot = g.append('g').selectAll('circle').data(nodes.filter(n => n.kind === 'source')).join('circle')
    .attr('class', d => `dot dot-${d.kind}`)
    .attr('r', d => d.r).attr('fill', planetFill)
    /* currentColor drives the per-node glow (see .dot filter in style.css); without
       this every world glows the same neutral white instead of its own hue. */
    .style('color', d => d.col)
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr('aria-label', d => `${T('Reading')} ${d.id}: ${DATA.sources[d.id].citation}`)
    .attr('stroke', d => (d.unconfirmed ? '#f0b24a' : null))
    .attr('stroke-width', d => (d.unconfirmed ? 1.2 : null))
    .attr('stroke-dasharray', d => (d.unconfirmed ? '2 2' : null));

  /* Root and question nodes render as a pre-rendered planet picture (see
     assets/planet-*.svg) instead of a live-animated element: one small
     static file per type, no per-node DOM subtree and no running animation,
     which matters once a graph has dozens of nodes on screen at once. */
  const PLANET_IMAGE = {
    root: 'assets/planet-root.svg',
    easy: 'assets/planet-easy.svg',
    middle: 'assets/planet-middle.svg',
    technical: 'assets/planet-technical.svg'
  };
  const planetImage = d => (d.kind === 'root' ? PLANET_IMAGE.root : PLANET_IMAGE[d.q.difficulty || 'middle']);

  const planet = g.append('g').selectAll('image')
    .data(nodes.filter(n => n.kind !== 'source')).join('image')
    .attr('class', 'node-planet')
    .attr('href', planetImage)
    .attr('width', d => d.r * 2).attr('height', d => d.r * 2)
    /* currentColor drives the per-node glow, same as the reading dots. */
    .style('color', d => d.col)
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr('aria-label', d => (d.kind === 'question' ? `${d.id}: ${d.q.question}` : d.label));

  const label = g.append('g').selectAll('text')
    .data(nodes.filter(n => n.kind !== 'source')).join('text')
    .attr('class', 'node-label').attr('text-anchor', 'middle').text(d => d.label);

  /* Drag, hover tooltip, click, and keyboard activation are identical for the
     plain reading dots and the planet images; only how each renders
     differs, so both selections share this wiring. */
  function wireInteractions(sel) {
    sel.call(d3.drag()
      .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

    sel.on('mouseenter', (e, d) => {
        el.tip.hidden = false;
        el.tip.textContent = d.kind === 'source'
          ? DATA.sources[d.id].citation
          : (d.kind === 'question' ? `${d.id} · ${d.label}` : d.label);
      })
      .on('mousemove', e => {
        const b = el.stage.getBoundingClientRect();
        el.tip.style.left = `${e.clientX - b.left + 14}px`;
        el.tip.style.top = `${e.clientY - b.top + 10}px`;
      })
      .on('mouseleave', () => { el.tip.hidden = true; });

    sel.on('click', function (e, d) {
      activateNode(this, d);
    }).on('keydown', function (e, d) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      activateNode(this, d);
    });
  }

  function setSelected(id) {
    selectedId = id;
    dot.classed('sel', n => n.id === id);
    planet.classed('sel', n => n.id === id);
  }

  function activateNode(target, d) {
    if (d.kind === 'source') {
      d3.select(target).transition().duration(140).attr('r', d.r * 1.8)
        .transition().duration(220).attr('r', d.r);
    } else {
      target.classList.add('pulse');
      target.addEventListener('animationend', () => target.classList.remove('pulse'), { once: true });
    }
    setSelected(d.id);
    openNode(d);
  }

  wireInteractions(dot);
  wireInteractions(planet);

  el.svg.node().__dots = dot;
  el.svg.node().__planets = planet;
  el.svg.node().__fit = () => {
    el.svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
    sim.alpha(0.4).restart();
  };

  sim.on('tick', () => {
    edge.attr('d', l => {
      const dx = l.target.x - l.source.x, dy = l.target.y - l.source.y;
      const r = Math.sqrt(dx * dx + dy * dy) * 1.6;
      return `M${l.source.x},${l.source.y}A${r},${r} 0 0,1 ${l.target.x},${l.target.y}`;
    });
    halo.attr('cx', d => d.x).attr('cy', d => d.y);
    dot.attr('cx', d => d.x).attr('cy', d => d.y);
    planet.attr('x', d => d.x - d.r).attr('y', d => d.y - d.r);
    label.attr('x', d => d.x).attr('y', d => d.y - d.r - 7);
  });
}

function openNode(d) {
  if (d.kind === 'question') showQuestion(d.q);
  else if (d.kind === 'root') showRoot();
  else showSource(d.id);
}

/* Re-open whatever was selected before a hot reload, if it still exists. */
function reselect(id) {
  const dot = el.svg.node().__dots;
  const planetBody = el.svg.node().__planets;
  if (!dot || !planetBody) return;
  const match = dot.data().find(n => n.id === id) || planetBody.data().find(n => n.id === id);
  if (!match) return;
  selectedId = id;
  dot.classed('sel', n => n.id === id);
  planetBody.classed('sel', n => n.id === id);
  openNode(match);
}

/* ---------- panel ---------- */

function resetPanel() {
  selectedId = null;
  document.body.classList.remove('detail-open');
  const dots = el.svg.node() && el.svg.node().__dots;
  const planets = el.svg.node() && el.svg.node().__planets;
  if (dots) dots.classed('sel', false);
  if (planets) planets.classed('sel', false);
  el.panel.innerHTML = DATA
    ? `<p class="muted">${T('Click a question to see its readings and how to work it.')}</p>`
    : `<p class="muted">${T('Nothing loaded yet. Ask a question, and the graph will appear here.')}</p>`;
}

function sourceLine(sid, role) {
  const s = DATA.sources[sid];
  if (!s) return `<article class="reading-card"><p><span class="role">${esc(role)}</span>unknown source ${esc(sid)}</p></article>`;
  const name = esc(s.citation);
  const url = safeHttpUrl(s.url);
  const title = url
    ? `<a href="${esc(url)}" target="_blank" rel="noopener">${name}<span class="open-reading">${T('Open reading')} ↗</span></a>`
    : name;
  const facts = [
    s.access_tier ? `<span>${T('Access')}: ${esc(s.access_tier)}</span>` : '',
    s.verified ? `<span>${T('Verification')}: ${esc(s.verified)}</span>` : '',
    s.time_estimate ? `<span>${T('Estimated time')}: ${esc(s.time_estimate)} min</span>` : ''
  ].filter(Boolean).join('');
  let out = `<article class="reading-card">` +
    `<div class="reading-card-head"><span class="source-id" title="${esc(T('Source ID'))}">${esc(sid)}</span>` +
    `<span class="role ${esc(role)}">${esc(role)}</span></div>` +
    `<p class="reading-title">${title}</p>` +
    (facts ? `<div class="reading-facts">${facts}</div>` : '');
  if (s.verified === 'unconfirmed' && s.unconfirmed_detail) {
    out += `<p class="flag"><strong>${T('Unconfirmed:')}</strong> ${esc(s.unconfirmed_detail)}</p>`;
  }
  if (s.access_tier === 'T4' && s.paired_with) {
    out += `<p class="muted">${T('Free route:')} ${esc(s.paired_with)}</p>`;
  }
  return out + `</article>`;
}

function expandButton(node, label) {
  const verb = T('Expand into more');
  return `<button class="btn" id="expand" data-node="${esc(node)}" data-q="${esc(label)}"
    style="margin-top:6px">${verb}</button><span id="expandnote" class="muted"></span>`;
}

function wireExpand() {
  const b = document.getElementById('expand');
  if (!b) return;
  b.addEventListener('click', async () => {
    const note = document.getElementById('expandnote');

    if (HELPER && HELPER.cli) {
      b.disabled = true;
      note.textContent = isZh() ? ' 正在运行…' : ' running…';
      const generationSnapshot = currentSetSnapshot();
      try {
        const res = await fetch('/api/expand', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ set: loaded.url, node: b.dataset.node, question: b.dataset.q, agent: 'auto' })
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.job) {
          el.ask.hidden = false;
          startProgress(isZh() ? `正在展开 ${b.dataset.node}…` : `Expanding ${b.dataset.node}…`);
          watchJob(body.job, generationSnapshot);
          return;
        }
        note.textContent = '';
        b.disabled = false;
        note.textContent = ` ${body.message || body.error || 'could not start'}`;
      } catch {
        note.textContent = isZh() ? ' 无法连接本地服务' : ' could not reach the local helper';
        b.disabled = false;
      }
      return;
    }
    note.textContent = isZh()
      ? ' 安装 Codex、Claude Code、Cursor 或 GitHub Copilot 后即可自动展开'
      : ' install Codex, Claude Code, Cursor, or GitHub Copilot to expand automatically';
  });
}

function archiveImpact(nodeId) {
  const active = DATA.questions.filter(q => !q.archived_at);
  const branch = new Set([nodeId]);
  let size = 0;
  while (size !== branch.size) {
    size = branch.size;
    active.forEach(q => { if (branch.has(q.parent)) branch.add(q.id); });
  }
  const archivedRefs = new Set();
  const remainingRefs = new Set();
  active.forEach(q => (q.readings || []).forEach(r =>
    (branch.has(q.id) ? archivedRefs : remainingRefs).add(r.source)
  ));
  return {
    questions: branch.size,
    sources: [...archivedRefs].filter(source => !remainingRefs.has(source)).length
  };
}

function wireArchive() {
  const archive = document.getElementById('archive');
  if (!archive) return;
  const confirm = document.getElementById('archiveconfirm');
  const commit = document.getElementById('archivecommit');
  const cancel = document.getElementById('archivecancel');
  const impact = archiveImpact(archive.dataset.node);
  document.getElementById('archiveimpact').textContent = isZh()
    ? `${impact.questions} 个问题和 ${impact.sources} 条未被其他问题使用的阅读资料将离开图谱。记录仍会归档保留在这个 JSON 文件中。`
    : `${impact.questions} question${impact.questions === 1 ? '' : 's'} and ${impact.sources} unshared reading${impact.sources === 1 ? '' : 's'} will leave the graph. The records stay archived in this JSON file.`;

  archive.addEventListener('click', () => {
    confirm.hidden = false;
    archive.hidden = true;
    commit.focus();
  });
  cancel.addEventListener('click', () => {
    confirm.hidden = true;
    archive.hidden = false;
    archive.focus();
  });
  commit.addEventListener('click', async () => {
    commit.disabled = true;
    cancel.disabled = true;
    try {
      const res = await fetch('/api/archive', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ set: loaded.url, node: archive.dataset.node })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `${res.status}`);
      const result = body.archived;
      const entry = {
        url: loaded.url,
        mtime: Math.floor(Date.now() / 1000),
        working_question: loaded.question
      };
      await loadSet(entry, {
        note: isZh()
          ? `已归档 <strong>${esc(result.questions.join(', '))}</strong>。${result.sources.length} 条未共享的阅读资料也已离开图谱。`
          : `Archived <strong>${esc(result.questions.join(', '))}</strong>. ${result.sources.length} unshared reading${result.sources.length === 1 ? '' : 's'} also left the graph.`
      });
    } catch (err) {
      commit.disabled = false;
      cancel.disabled = false;
      banner(isZh()
        ? `无法归档该分支——${esc(err.message)}`
        : `Could not archive that branch — ${esc(err.message)}`, 'error');
    }
  });
}

function showRoot() {
  const m = DATA.meta || {};
  const original = m.original_question || m.working_question || '';
  el.panel.innerHTML =
    `<header class="observatory-heading">` +
      `<p class="observatory-eyebrow">${T('Refined question')}</p>` +
      `<h2 class="question-title">${esc(m.working_question || '')}</h2>` +
    `</header>` +
    `<section class="original-question">` +
      `<p class="original-label">${T('Original question')}</p>` +
      `<blockquote>${esc(original)}</blockquote>` +
      (m.triage_summary ? `<p class="triage-summary">${esc(m.triage_summary)}</p>` : '') +
    `</section>` +
    `<div class="panel-actions">${expandButton('root', m.working_question || '')}</div>`;
  document.body.classList.add('detail-open');
  wireExpand();
}

function cardIdentity(id, kind) {
  const source = kind === 'source';
  const label = T(source ? 'Reading source' : 'Question card');
  const explanation = T(source
    ? 'S identifies a reading source used by questions.'
    : 'A letter prefix and number identify a question in this set.');
  return `<div class="card-identity"><code>${esc(id)}</code><div>` +
    `<strong>${label}</strong><p>${explanation}</p></div></div>`;
}

function showQuestion(q) {
  const groupName = T({ core: 'core group', supporting: 'supporting group', context: 'context group' }[q.relevance_group] || q.relevance_group);
  const typeName = q.type ? `${T(q.type.name)}${q.type.move ? ' · ' + q.type.move : ''}` : '';
  let h = `<header class="observatory-heading">` +
    `<div class="question-meta"><span>${esc(q.id)}</span><span>${esc(groupName)}</span></div>` +
    `<h2 class="question-title">${esc(q.question)}</h2>` +
    `</header>`;
  h += `<div class="guidance-grid">` +
    `<section class="guidance-card check-card"><h3>${T('Check before reading')}</h3><p>${esc(q.check_first)}</p></section>` +
    `<section class="guidance-card look-card"><h3>${T('Look for while reading')}</h3><p>${esc(q.read_for)}</p></section>` +
    `</div>`;
  h += `<section class="reading-section"><h3 class="section-title">${T('Recommended readings')}</h3>`;
  if (q.readings && q.readings.length) {
    h += `<div class="reading-list">`;
    q.readings.forEach(r => { h += sourceLine(r.source, r.role); });
    h += `</div>`;
  } else {
    h += `<div class="reading-empty"><span class="role background">${T('no reading')}</span><p>${esc(q.single_reading_reason || T('Thinking-only card.'))}</p></div>`;
  }
  if (q.readings && q.readings.length === 1 && q.single_reading_reason) {
    h += `<p class="single-reading-reason"><strong>${T('Why one reading')}:</strong> ${esc(q.single_reading_reason)}</p>`;
  }
  h += `</section>`;
  h += `<div class="panel-actions">${expandButton(q.id, q.question)}`;
  if (HELPER && loaded.url && loaded.url.startsWith('/question-sets/')) {
    h += `<button class="btn archive-btn" id="archive" data-node="${esc(q.id)}" type="button">${T('Archive branch')}</button>`;
  }
  h += `</div>`;
  h += `<div id="archiveconfirm" class="archive-confirm" hidden>` +
    `<p id="archiveimpact"></p><div>` +
    `<button class="btn" id="archivecancel" type="button">${T('Keep it')}</button>` +
    `<button class="btn archive-commit" id="archivecommit" type="button">${T('Archive branch')}</button>` +
    `</div></div>`;
  h += `<details class="observatory-details"><summary>${T('Question details')}</summary>` +
    `<dl><div><dt>${T('Difficulty')}</dt><dd>${esc(q.level)}</dd></div>` +
    `<div><dt>${T('Question group')}</dt><dd>${esc(groupName)}</dd></div>` +
    (typeName ? `<div><dt>${T('Question type')}</dt><dd>${esc(typeName)}</dd></div>` : '') +
    `</dl>${cardIdentity(q.id, 'question')}</details>`;
  el.panel.innerHTML = h;
  document.body.classList.add('detail-open');
  wireExpand();
  wireArchive();
}

function showSource(sid) {
  const s = DATA.sources[sid];
  const url = safeHttpUrl(s.url);
  const users = DATA.questions
    .filter(q => !q.archived_at && (q.readings || []).some(r => r.source === sid))
    .map(q => `${q.id} (${q.readings.find(r => r.source === sid).role})`);
  let h = `<header class="observatory-heading">` +
    `<div class="question-meta"><span>${T('Reading')} ${esc(sid)}</span></div>` +
    `<h2 class="source-title">${url
    ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(s.citation)}</a>`
    : esc(s.citation)}</h2>` +
    `</header>`;
  h += `<section class="source-details">`;
  if (s.verified === 'unconfirmed' && s.unconfirmed_detail) {
    h += `<p class="flag"><strong>${T('Unconfirmed:')}</strong> ${esc(s.unconfirmed_detail)}</p>`;
  }
  if (!url && s.reachable_at) h += `<div class="detail-row"><h3>${T('Find it:')}</h3><p>${esc(s.reachable_at)}</p></div>`;
  if (s.paired_with) h += `<div class="detail-row"><h3>${T('Free route:')}</h3><p>${esc(s.paired_with)}</p></div>`;
  if (s.verified_how) h += `<div class="detail-row"><h3>${T('How we checked:')}</h3><p>${esc(s.verified_how)}</p></div>`;
  if (s.complexity) h += `<div class="detail-row"><h3>${T('What makes it hard:')}</h3><p>${esc(s.complexity)}</p></div>`;
  h += `</section>`;
  h += `<details class="observatory-details"><summary>${T('Reading details')}</summary>` +
    `<dl><div><dt>${T('Access')}</dt><dd>${esc(s.access_tier || '—')}</dd></div>` +
    `<div><dt>${T('Verification')}</dt><dd>${esc(s.verified || '—')}</dd></div>` +
    `<div><dt>${T('Used by:')}</dt><dd>${esc(users.join(', ') || 'nothing')}</dd></div></dl>` +
    `${cardIdentity(sid, 'source')}</details>`;
  el.panel.innerHTML = h;
  document.body.classList.add('detail-open');
}

let readerScale = 1;
try { readerScale = Number(localStorage.getItem('dsa-reader-scale')) || 1; } catch {}
readerScale = Math.min(1.2, Math.max(.9, readerScale));

function applyReaderScale(next) {
  readerScale = Math.min(1.2, Math.max(.9, Math.round(next * 10) / 10));
  document.documentElement.style.setProperty('--reader-scale', String(readerScale));
  el.readerSmaller.disabled = readerScale <= .9;
  el.readerLarger.disabled = readerScale >= 1.2;
  try { localStorage.setItem('dsa-reader-scale', String(readerScale)); } catch {}
}

el.readerSmaller.addEventListener('click', () => applyReaderScale(readerScale - .1));
el.readerLarger.addEventListener('click', () => applyReaderScale(readerScale + .1));
el.closePanel.addEventListener('click', () => {
  const dots = el.svg.node() && el.svg.node().__dots;
  const planets = el.svg.node() && el.svg.node().__planets;
  const previous = (dots && dots.filter(node => node.id === selectedId).node())
    || (planets && planets.filter(node => node.id === selectedId).node());
  resetPanel();
  if (previous) previous.focus({ preventScroll: true });
});
applyReaderScale(readerScale);

let rt = null;
window.addEventListener('resize', () => {
  if (!DATA) return;
  clearTimeout(rt);
  rt = setTimeout(() => { const s = selectedId; render(); if (s) reselect(s); }, 200);
});

let savedLanguage = 'en';
try { savedLanguage = localStorage.getItem('dsa-language') || 'en'; } catch {}
applyLanguage(savedLanguage, false);
boot();
