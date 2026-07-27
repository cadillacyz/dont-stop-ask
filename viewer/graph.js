/* dont-stop-ask · 不停问 — question graph viewer
   Renders a question set emitted by the dont-stop-research skill.
   Reads visibility:both fields only; the schema forbids spoiler fields in this file. */

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
  banner: document.getElementById('banner'),
  ask: document.getElementById('ask'),
  status: document.getElementById('status'),
  pick: document.getElementById('setpick'),
  file: document.getElementById('file'),
  form: document.getElementById('askform'),
  q: document.getElementById('q'),
  ctx: document.getElementById('ctx'),
  mode: document.getElementById('mode'),
  go: document.getElementById('go'),
  handoff: document.getElementById('handoff'),
  handoffCmd: document.getElementById('handoffcmd'),
  watching: document.getElementById('watching'),
  progress: document.getElementById('progress'),
  progText: document.getElementById('progtext'),
  progLog: document.getElementById('proglog'),
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

/* ---------- language ----------
   The set's content arrives in whatever language the question was asked in.
   The viewer's own chrome follows: CJK in the working question flips it to
   Chinese. Field names, ids and enums stay ASCII per the schema. */

const ZH = {
  'Click a question to see its readings and how to work it.': '点击一个问题，查看它的阅读材料和使用方法。',
  'Nothing loaded yet. Ask a question, and the graph will appear here.': '还没有加载任何内容。提出一个问题，图谱就会出现在这里。',
  'Nobody has looked this set over yet.': '这套问题还没有人审阅过。',
  'Working question · sharpened by triage': '工作问题 · 已经审题磨锋利',
  'Asked as:': '原本的问法：',
  'Readings, ranked': '阅读材料（按相关度排序）',
  'Check first:': '读前先查：',
  'Read for:': '读什么：',
  'Used by:': '被引用于：',
  'Free route:': '免费途径：',
  'How we checked:': '我们如何核实：',
  'What makes it hard:': '难在哪里：',
  'Find it:': '如何找到：',
  'Unconfirmed:': '未确认：',
  'Reading': '阅读材料',
  'no reading': '无需阅读',
  'Thinking-only card.': '纯思考卡——不需要阅读。',
  'One reading because:': '只配一份阅读材料，因为：',
  'core group': '核心组',
  'supporting group': '支撑组',
  'context group': '外围组',
  'Expand into nine more': '展开成更多问题',
  'Copy expansion prompt': '复制展开指令',
  'Copied — paste into your AI tool': '已复制——粘贴进你的 AI 工具',
  'expansion': '次展开',
  'Meaning': '含义', 'Landscape': '全景', 'Mechanism': '机制', 'Tension': '张力',
  'Evidence': '证据', 'Scope': '边界', 'Stake': '意义'
};

function isZh() {
  return DATA && /[一-鿿]/.test(((DATA.meta || {}).working_question) || '');
}

function T(s) {
  return (isZh() && ZH[s]) || s;
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

/* Prompts are tool-agnostic: they route through portable/dont-stop-research.md,
   which any agent can follow. In Claude Code the repo's CLAUDE.md (or the optional
   /dont-stop-research skill) picks this up; in Codex/Cursor/Gemini CLI, AGENTS.md does. */
function askPrompt() {
  const bits = [
    `Follow portable/dont-stop-research.md in this repository and run it on this question:`,
    ``,
    `${el.q.value.trim()}`
  ];
  if (el.ctx.value.trim()) bits.push(``, `context: ${el.ctx.value.trim()}`);
  bits.push(`mode: ${el.mode.value}`,
    ``,
    `Verify every source by web search, then write the JSON to question-sets/ per AGENTS.md.`);
  return bits.join('\n');
}

function expandPrompt(node, question) {
  const rel = (loaded.url || './question-sets/your-set.json').replace(/^\//, '');
  return `Follow the Expansion section of portable/dont-stop-research.md in this repository.\n\n` +
    `Expand node ${node} of ${rel}: "${question}"\n\n` +
    `Generate up to nine verified follow-up questions (fewer if any would be padding), each with ` +
    `one to three ranked readings, grouped by relevance to this node's question. Write a new JSON ` +
    `to the same file containing the union of the old and new nodes.`;
}

/* ---------- loading ---------- */

function validate(d) {
  const problems = [];
  if (!d || typeof d !== 'object') return ['not a JSON object'];
  if (!d.meta) problems.push('missing meta');
  if (!Array.isArray(d.questions) || !d.questions.length) problems.push('missing questions');
  if (!d.sources) problems.push('missing sources');
  const leaked = ['why_this', 'they_might_say', 'if_stuck'];
  (d.questions || []).forEach(q => {
    leaked.forEach(k => { if (k in q) problems.push(`${q.id} contains spoiler field "${k}"`); });
    (q.readings || []).forEach(r => {
      if (!d.sources || !d.sources[r.source]) problems.push(`${q.id} cites unknown source ${r.source}`);
    });
  });
  return problems;
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function accept(d, source) {
  const problems = validate(d);
  if (problems.length) {
    banner(`This set does not match the schema: ${esc(problems.slice(0, 3).join('; '))}`, 'error');
    if (!d || !Array.isArray(d.questions)) return;
  }
  DATA = d;
  if (source) loaded = { url: source.url, mtime: source.mtime || 0, question: (d.meta || {}).working_question };
  hideAsk();
  renderMeta();
  render();
  resetPanel();
}

async function loadSet(entry, opts = {}) {
  try {
    const d = await fetchJson(entry.url);
    const keep = opts.keepSelection ? selectedId : null;
    accept(d, entry);
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

  // Only auto-load sets the user generated. Landing on the bundled example
  // would look like an answer to a question nobody asked.
  const generated = ((HELPER && HELPER.sets) || []).filter(s => s.origin === 'question-sets');

  if (param) {
    await loadSet({ url: param, mtime: 0 });
  } else if (generated.length) {
    await loadSet(generated[0], {
      note: `Loaded <strong>${esc(generated[0].name)}</strong> — the newest set in question-sets/.`
    });
  } else {
    showAsk();
  }

  if (HELPER) startWatching();
}

function setStatus() {
  if (!HELPER) {
    el.status.className = 'status';
    el.status.textContent = 'no helper';
    el.status.title = 'Opened as plain files. Run scripts/serve.py for auto-loading.';
    return;
  }
  if (HELPER.cli) {
    el.status.className = 'status live';
    el.status.textContent = 'live · can generate';
    el.status.title = `Watching ${HELPER.sets_dir} · claude CLI at ${HELPER.cli_path}`;
  } else {
    el.status.className = 'status partial';
    el.status.textContent = 'live · watching';
    el.status.title = `Watching ${HELPER.sets_dir}. No claude CLI on PATH, so asking hands you a prompt.`;
  }
}

/* ---------- watching the folder ---------- */

function startWatching() {
  clearInterval(pollTimer);
  pollTimer = setInterval(poll, POLL_MS);
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

  // Nothing loaded yet: the first set to appear wins, which is the moment
  // a freshly generated set shows up on its own.
  if (!DATA) {
    stopProgress();
    await loadSet(newest, { note: `<strong>${esc(newest.name)}</strong> just appeared — loaded it.` });
    return;
  }

  if (newest.url === loaded.url) {
    if (newest.mtime > loaded.mtime) {
      await loadSet(newest, {
        keepSelection: true,
        note: `<strong>${esc(newest.name)}</strong> changed on disk — reloaded.`
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
      note: `Followed <strong>${esc(newest.name)}</strong> — same question, newer file.`
    });
    stopProgress();
  } else {
    banner(
      `A newer set is on disk: <strong>${esc(newest.name)}</strong> — ` +
      `<a href="#" id="loadnew">load it</a>`
    );
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
  const sets = (HELPER && HELPER.sets) || [];
  if (sets.length < 2) { el.pick.hidden = true; return; }
  el.pick.hidden = false;
  const current = loaded.url;
  el.pick.innerHTML = sets.map(s =>
    `<option value="${esc(s.url)}"${s.url === current ? ' selected' : ''}>${esc(s.name)}</option>`
  ).join('');
}

el.pick.addEventListener('change', async e => {
  const entry = ((HELPER && HELPER.sets) || []).find(s => s.url === e.target.value);
  if (entry) { banner(null); await loadSet(entry); }
});

/* ---------- the ask flow ---------- */

function showAsk() {
  el.ask.hidden = false;
  el.handoff.hidden = true;
  el.progress.hidden = true;
  if (!DATA) { el.meta.innerHTML = ''; resetPanel(); }
  el.askFoot.textContent = HELPER
    ? (HELPER.cli
        ? 'Asking runs the skill here and the graph loads itself when it finishes.'
        : 'No claude CLI on PATH, so asking hands you a prompt to paste. The graph still loads itself once the file appears.')
    : 'Opened as plain files. Run python scripts/serve.py for auto-loading and folder watching.';
  setTimeout(() => el.q.focus(), 50);
}

function hideAsk() {
  el.ask.hidden = true;
  stopProgress();
}

function startProgress(text) {
  el.progress.hidden = false;
  el.handoff.hidden = true;
  el.progText.textContent = text;
  el.progLog.textContent = '';
  el.go.disabled = true;
}

function stopProgress() {
  clearInterval(jobTimer);
  jobTimer = null;
  el.progress.hidden = true;
  el.go.disabled = false;
}

function watchJob(jobId) {
  clearInterval(jobTimer);
  jobTimer = setInterval(async () => {
    let job;
    try { job = await fetchJson(`/api/jobs/${jobId}`); }
    catch { return; }
    el.progText.textContent = job.state === 'running'
      ? `Working… ${job.elapsed}s. Verifying sources takes a few minutes.`
      : (job.state === 'done' ? 'Finished. Waiting for the file…' : 'That run failed.');
    el.progLog.textContent = (job.log || []).join('\n');
    el.progLog.scrollTop = el.progLog.scrollHeight;
    if (job.state === 'failed') {
      stopProgress();
      banner('The generation run failed — the log above says why.', 'error');
    }
  }, 1500);
}

async function handoff(prompt, lead) {
  const ok = await copy(prompt);
  el.handoff.hidden = false;
  el.progress.hidden = true;
  el.go.disabled = false;
  document.querySelector('.handoff-lead').textContent = ok
    ? (lead || "Paste this into your AI tool — it's on your clipboard already.")
    : 'Copy this into your AI tool (clipboard was blocked, so select it manually).';
  el.handoffCmd.textContent = prompt;
  el.watching.textContent = HELPER
    ? `Watching ${HELPER.sets_dir}.`
    : 'Start scripts/serve.py first, or drop the file here when it exists.';
}

el.form.addEventListener('submit', async ev => {
  ev.preventDefault();
  const question = el.q.value.trim();
  if (question.length < 8) { el.q.focus(); return; }
  banner(null);

  if (!HELPER) return handoff(askPrompt());

  startProgress('Starting…');
  let res;
  try {
    res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context: el.ctx.value, mode: el.mode.value })
    });
  } catch (err) {
    stopProgress();
    return handoff(askPrompt());
  }

  const body = await res.json().catch(() => ({}));
  if (res.ok && body.job) { watchJob(body.job); return; }
  stopProgress();
  handoff(body.prompt || askPrompt());
});

document.getElementById('qmark').addEventListener('click', () => {
  const q = document.getElementById('qmark');
  q.classList.remove('wiggle');
  void q.offsetWidth;
  q.classList.add('wiggle');
  el.q.focus();
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

el.file.addEventListener('change', e => {
  const f = e.target.files && e.target.files[0];
  if (f) readFile(f);
});

function readFile(f) {
  const r = new FileReader();
  r.onload = () => {
    try {
      accept(JSON.parse(r.result), { url: null, mtime: 0 });
      banner(`Loaded ${esc(f.name)} from disk. Re-pick it to see later changes.`);
    } catch (err) { banner(`That file is not valid JSON — ${esc(err.message)}`, 'error'); }
  };
  r.readAsText(f);
}

['dragenter', 'dragover'].forEach(t => {
  el.stage.addEventListener(t, e => { e.preventDefault(); el.ask.classList.add('over'); el.ask.hidden = false; });
});
el.stage.addEventListener('dragleave', () => {
  el.ask.classList.remove('over');
  if (DATA) el.ask.hidden = true;
});
el.stage.addEventListener('drop', e => {
  e.preventDefault();
  el.ask.classList.remove('over');
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) readFile(f);
  else if (DATA) el.ask.hidden = true;
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

  nodes.push({
    id: rootId,
    kind: 'root',
    r: 11,
    col: COLOR.root,
    label: (DATA.root && DATA.root.label) || 'Working question'
  });

  DATA.questions.forEach(q => {
    nodes.push({
      id: q.id,
      kind: 'question',
      r: q.load_bearing ? 9.5 : 8,
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
  DATA.questions.forEach(q => (q.readings || []).forEach(rd => used.add(rd.source)));
  Object.keys(DATA.sources || {}).forEach(sid => {
    if (!used.has(sid)) return;
    const s = DATA.sources[sid];
    nodes.push({
      id: sid,
      kind: 'source',
      r: 4.5,
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

  const g = el.svg.append('g');
  zoom = d3.zoom().scaleExtent([0.35, 3]).on('zoom', e => g.attr('transform', e.transform));
  el.svg.call(zoom);

  const A = anchors(nodes, W, H);
  const anchorOf = n => (n.kind === 'question' ? A[`${n.q.parent}|${n.q.relevance_group}`] : null);

  sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(l => (l.strong ? 88 : 124)).strength(0.45))
    .force('charge', d3.forceManyBody().strength(-420).distanceMax(Math.min(W, H) * 0.8))
    .force('center', d3.forceCenter(W / 2, H / 2).strength(0.06))
    /* Collide radius covers the label sitting above each dot, not just the dot. */
    .force('collide', d3.forceCollide().radius(d => (d.kind === 'source' ? d.r + 16 : d.r + 30)))
    .force('x', d3.forceX(d => (anchorOf(d) || { x: W / 2 }).x).strength(d => (anchorOf(d) ? 0.11 : 0.015)))
    .force('y', d3.forceY(d => (anchorOf(d) || { y: H / 2 }).y).strength(d => (anchorOf(d) ? 0.11 : 0.015)));

  const edge = g.append('g').selectAll('path').data(links).join('path')
    .attr('class', l => 'edge' + (l.strong ? '' : ' weak'));

  const halo = g.append('g').selectAll('circle').data(nodes).join('circle')
    .attr('class', 'halo').attr('r', d => d.r * 2.4).attr('fill', d => d.col);

  const dot = g.append('g').selectAll('circle').data(nodes).join('circle')
    .attr('class', 'dot').attr('r', d => d.r).attr('fill', d => d.col)
    .attr('stroke', d => (d.unconfirmed ? '#f0b24a' : null))
    .attr('stroke-width', d => (d.unconfirmed ? 1.2 : null))
    .attr('stroke-dasharray', d => (d.unconfirmed ? '2 2' : null));

  const label = g.append('g').selectAll('text')
    .data(nodes.filter(n => n.kind !== 'source')).join('text')
    .attr('class', 'node-label').attr('text-anchor', 'middle').text(d => d.label);

  dot.call(d3.drag()
    .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
    .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
    .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

  dot.on('mouseenter', (e, d) => {
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

  dot.on('click', function (e, d) {
    d3.select(this).transition().duration(140).attr('r', d.r * 1.8)
      .transition().duration(220).attr('r', d.r);
    selectedId = d.id;
    dot.classed('sel', n => n.id === selectedId);
    openNode(d);
  });

  el.svg.node().__dots = dot;
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
  if (!dot) return;
  const match = dot.data().find(n => n.id === id);
  if (!match) return;
  selectedId = id;
  dot.classed('sel', n => n.id === id);
  openNode(match);
}

/* ---------- panel ---------- */

function resetPanel() {
  selectedId = null;
  el.panel.innerHTML = DATA
    ? `<p class="muted">${T('Click a question to see its readings and how to work it.')}</p>`
    : `<p class="muted">${T('Nothing loaded yet. Ask a question, and the graph will appear here.')}</p>`;
}

function sourceLine(sid, role) {
  const s = DATA.sources[sid];
  if (!s) return `<p><span class="role">${esc(role)}</span>unknown source ${esc(sid)}</p>`;
  const name = esc(s.citation);
  const body = s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${name}</a>` : name;
  const tier = [s.access_tier, s.verified, s.time_estimate ? `${s.time_estimate} min` : null]
    .filter(Boolean).join(' · ');
  let out = `<p><span class="role ${esc(role)}">${esc(role)}</span>${body} <span class="muted">(${esc(tier)})</span></p>`;
  if (s.verified === 'unconfirmed' && s.unconfirmed_detail) {
    out += `<p class="flag"><strong>${T('Unconfirmed:')}</strong> ${esc(s.unconfirmed_detail)}</p>`;
  }
  if (s.access_tier === 'T4' && s.paired_with) {
    out += `<p class="muted">${T('Free route:')} ${esc(s.paired_with)}</p>`;
  }
  return out;
}

function expandButton(node, label) {
  const verb = HELPER && HELPER.cli ? T('Expand into nine more') : T('Copy expansion prompt');
  return `<button class="btn" id="expand" data-node="${esc(node)}" data-q="${esc(label)}"
    style="margin-top:6px">${verb}</button><span id="expandnote" class="muted"></span>`;
}

function wireExpand() {
  const b = document.getElementById('expand');
  if (!b) return;
  b.addEventListener('click', async () => {
    const prompt = expandPrompt(b.dataset.node, b.dataset.q);
    const note = document.getElementById('expandnote');

    if (HELPER && HELPER.cli) {
      b.disabled = true;
      note.textContent = ' running…';
      try {
        const res = await fetch('/api/expand', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ set: loaded.url, node: b.dataset.node, question: b.dataset.q })
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.job) {
          el.ask.hidden = false;
          startProgress(`Expanding ${b.dataset.node}…`);
          watchJob(body.job);
          return;
        }
        note.textContent = '';
        b.disabled = false;
        await handoffInPanel(prompt);
      } catch {
        note.textContent = '';
        b.disabled = false;
        await handoffInPanel(prompt);
      }
      return;
    }

    await handoffInPanel(prompt);
    b.textContent = (await copy(prompt)) ? T('Copied — paste into your AI tool') : 'Select the prompt below';
    setTimeout(() => { b.textContent = T('Copy expansion prompt'); }, 4000);
  });
}

async function handoffInPanel(prompt) {
  await copy(prompt);
  if (document.getElementById('panelprompt')) return;
  el.panel.insertAdjacentHTML('beforeend',
    `<pre id="panelprompt" class="handoff-cmd" style="margin-top:10px">${esc(prompt)}</pre>` +
    `<p class="muted" style="font-size:12px">Paste into whichever AI you use. The graph reloads itself ` +
    `when the new file lands.</p>`);
}

function showRoot() {
  const m = DATA.meta || {};
  el.panel.innerHTML =
    `<h2>${T('Working question · sharpened by triage')}</h2>` +
    `<p class="q">${esc(m.working_question || '')}</p>` +
    (m.original_question
      ? `<div class="sec"><p><span class="lbl">${T('Asked as:')}</span> ${esc(m.original_question)}</p>` +
        (m.triage_summary ? `<p>${esc(m.triage_summary)}</p>` : '') + `</div>`
      : '') +
    expandButton('root', m.working_question || '');
  wireExpand();
}

function showQuestion(q) {
  const groupName = T({ core: 'core group', supporting: 'supporting group', context: 'context group' }[q.relevance_group] || q.relevance_group);
  const typeName = q.type ? `${T(q.type.name)}${q.type.move ? ' · ' + q.type.move : ''}` : '';
  let h = `<h2>${esc(q.id)} · ${esc(groupName)}${typeName ? ' · ' + esc(typeName) : ''}</h2>`;
  h += `<p class="q">${esc(q.question)}</p>`;
  h += `<div class="sec">`;
  if (q.readings && q.readings.length) {
    h += `<p class="lbl">${T('Readings, ranked')}</p>`;
    q.readings.forEach(r => { h += sourceLine(r.source, r.role); });
  } else {
    h += `<p><span class="role background">${T('no reading')}</span>${esc(q.single_reading_reason || T('Thinking-only card.'))}</p>`;
  }
  if (q.readings && q.readings.length === 1 && q.single_reading_reason) {
    h += `<p class="muted">${T('One reading because:')} ${esc(q.single_reading_reason)}</p>`;
  }
  h += `<p style="margin-top:9px"><span class="lbl">${T('Check first:')}</span> ${esc(q.check_first)}</p>`;
  h += `<p><span class="lbl">${T('Read for:')}</span> ${esc(q.read_for)}</p>`;
  h += `<p>${esc(q.level)}</p>`;
  h += `</div>`;
  h += expandButton(q.id, q.question);
  el.panel.innerHTML = h;
  wireExpand();
}

function showSource(sid) {
  const s = DATA.sources[sid];
  const users = DATA.questions
    .filter(q => (q.readings || []).some(r => r.source === sid))
    .map(q => `${q.id} (${q.readings.find(r => r.source === sid).role})`);
  let h = `<h2>${T('Reading')} · ${esc([s.access_tier, s.verified].filter(Boolean).join(' · '))}</h2>`;
  h += `<p class="q">${s.url
    ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.citation)}</a>`
    : esc(s.citation)}</p>`;
  h += `<div class="sec">`;
  if (s.verified === 'unconfirmed' && s.unconfirmed_detail) {
    h += `<p class="flag"><strong>${T('Unconfirmed:')}</strong> ${esc(s.unconfirmed_detail)}</p>`;
  }
  if (!s.url && s.reachable_at) h += `<p><span class="lbl">${T('Find it:')}</span> ${esc(s.reachable_at)}</p>`;
  if (s.paired_with) h += `<p><span class="lbl">${T('Free route:')}</span> ${esc(s.paired_with)}</p>`;
  if (s.verified_how) h += `<p><span class="lbl">${T('How we checked:')}</span> ${esc(s.verified_how)}</p>`;
  if (s.complexity) h += `<p><span class="lbl">${T('What makes it hard:')}</span> ${esc(s.complexity)}</p>`;
  h += `<p><span class="lbl">${T('Used by:')}</span> ${esc(users.join(', ') || 'nothing')}</p>`;
  h += `</div>`;
  el.panel.innerHTML = h;
}

let rt = null;
window.addEventListener('resize', () => {
  if (!DATA) return;
  clearTimeout(rt);
  rt = setTimeout(() => { const s = selectedId; render(); if (s) reselect(s); }, 200);
});

boot();
