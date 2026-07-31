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
  'Every question is a world.': '每个问题都是一个世界。',
  'Every question is a world': '每个问题都是一个世界',
  'Drift toward whatever pulls at your attention. Each world opens a different way into the unknown.': '靠近那个一直吸引你注意的问题。每个世界都提供一种进入未知的方式。',
  'Click here to begin': '点击这里开始',
  'Past questions': '历史问题',
  'Ask something else': '提出新问题',
  'Fit view': '适应视图',
  'Begin with uncertainty': '从不确定开始',
  'What question have you been thinking about?': '你最近一直在思考什么问题？',
  'Ask the unfinished question. We’ll turn it into a map of sharper questions and readings worth opening.': '写下这个还没有答案的问题。我们会把它变成更清晰的问题地图，并推荐值得阅读的资料。',
  'Your question': '你的问题',
  'What do you want to understand?': '你想理解什么？',
  "What you already know, and why you're asking (optional, but it sharpens the set)": '你已经知道什么，以及为什么会问这个问题（可选，但有助于把问题说清楚）',
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
  'Check first:': '读前先查：',
  'Read for:': '读什么：',
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
  'Expand into nine more': '展开成更多问题',
  'Copy expansion prompt': '复制展开指令',
  'Copied — paste into Claude Code': '已复制——粘贴进 Claude Code',
  'expansion': '次展开',
  'Archive branch': '归档分支',
  'Keep it': '保留',
  'Ask once. Your local agent researches it here, and the question map opens when it is ready.': '只需提问一次。本地智能体会在这里研究，完成后自动打开问题地图。',
  'Install Codex or Claude Code, then restart this helper to ask without copy and paste.': '安装 Codex 或 Claude Code，然后重启本地服务，即可直接提问，无需复制粘贴。',
  'Start with python scripts/serve.py so this page can run Codex or Claude Code for you.': '先运行 python scripts/serve.py，这个页面就能替你调用 Codex 或 Claude Code。',
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
      ? '安装 Codex 或 Claude Code，然后重启本地服务。'
      : 'Install Codex or Claude Code, then restart this helper.';
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
  document.body.className = 'ask-mode';
  if (!DATA) { el.meta.innerHTML = ''; resetPanel(); }
  updateAskFoot();
  setTimeout(() => el.q.focus(), 50);
}

function updateAskFoot() {
  el.askFoot.textContent = T(HELPER
    ? (HELPER.cli
        ? 'Ask once. Your local agent researches it here, and the question map opens when it is ready.'
        : 'Install Codex or Claude Code, then restart this helper to ask without copy and paste.')
    : 'Start with python scripts/serve.py so this page can run Codex or Claude Code for you.');
}

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
}

function stopProgress() {
  clearInterval(jobTimer);
  jobTimer = null;
  el.progress.hidden = true;
  el.go.disabled = false;
  el.cancelJob.hidden = true;
  el.cancelJob.disabled = false;
  activeJobId = null;
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
      ? '请安装 Codex 或 Claude Code，重启本地服务后再次提问。'
      : 'Install Codex or Claude Code, restart the helper, and then ask again.', 'error');
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
  const value = Math.max(45, Math.min(100, Number(rawValue) || 68));
  document.documentElement.style.setProperty('--scene-brightness', String(value / 100));
  el.brightness.forEach(input => {
    input.value = String(value);
    input.setAttribute('aria-valuetext', `${value}%`);
  });
  if (persist) {
    try { localStorage.setItem('dsa-brightness', String(value)); } catch {}
  }
}

let savedBrightness = 68;
try { savedBrightness = localStorage.getItem('dsa-brightness') || 68; } catch {}
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
    const gradient = defs.append('radialGradient')
      .attr('id', id).attr('cx', '31%').attr('cy', '26%').attr('r', '76%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#fff');
    gradient.append('stop').attr('offset', '8%').attr('stop-color', light);
    gradient.append('stop').attr('offset', '38%').attr('stop-color', mid);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', dark);
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

  const dot = g.append('g').selectAll('circle').data(nodes).join('circle')
    .attr('class', d => `dot dot-${d.kind}${d.q ? ` dot-${d.q.difficulty || 'middle'}` : ''}`)
    .attr('r', d => d.r).attr('fill', planetFill)
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr('aria-label', d => d.kind === 'source'
      ? `${T('Reading')} ${d.id}: ${DATA.sources[d.id].citation}`
      : (d.kind === 'question' ? `${d.id}: ${d.q.question}` : d.label))
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

  function activateNode(target, d) {
    d3.select(target).transition().duration(140).attr('r', d.r * 1.8)
      .transition().duration(220).attr('r', d.r);
    selectedId = d.id;
    dot.classed('sel', n => n.id === selectedId);
    openNode(d);
  }

  dot.on('click', function (e, d) {
    activateNode(this, d);
  }).on('keydown', function (e, d) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    activateNode(this, d);
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
  const url = safeHttpUrl(s.url);
  const body = url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${name}</a>` : name;
  const tier = [s.access_tier, s.verified, s.time_estimate ? `${s.time_estimate} min` : null]
    .filter(Boolean).join(' · ');
  let out = `<p><span class="source-id" title="${esc(T('Source ID'))}">${esc(sid)}</span>` +
    `<span class="role ${esc(role)}">${esc(role)}</span>${body} <span class="muted">(${esc(tier)})</span></p>`;
  if (s.verified === 'unconfirmed' && s.unconfirmed_detail) {
    out += `<p class="flag"><strong>${T('Unconfirmed:')}</strong> ${esc(s.unconfirmed_detail)}</p>`;
  }
  if (s.access_tier === 'T4' && s.paired_with) {
    out += `<p class="muted">${T('Free route:')} ${esc(s.paired_with)}</p>`;
  }
  return out;
}

function expandButton(node, label) {
  const verb = T('Expand into nine more');
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
      ? ' 安装 Codex 或 Claude Code 后即可自动展开'
      : ' install Codex or Claude Code to expand automatically';
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
    `<h2>${T('Refined question')}</h2>` +
    `<p class="q">${esc(m.working_question || '')}</p>` +
    `<section class="original-question">` +
      `<p class="original-label">${T('Original question')}</p>` +
      `<blockquote>${esc(original)}</blockquote>` +
      (m.triage_summary ? `<p class="triage-summary">${esc(m.triage_summary)}</p>` : '') +
    `</section>` +
    `<div class="panel-actions">${expandButton('root', m.working_question || '')}</div>`;
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
  h += cardIdentity(q.id, 'question');
  el.panel.innerHTML = h;
  wireExpand();
  wireArchive();
}

function showSource(sid) {
  const s = DATA.sources[sid];
  const url = safeHttpUrl(s.url);
  const users = DATA.questions
    .filter(q => !q.archived_at && (q.readings || []).some(r => r.source === sid))
    .map(q => `${q.id} (${q.readings.find(r => r.source === sid).role})`);
  let h = `<h2>${T('Reading')} ${esc(sid)} · ${esc([s.access_tier, s.verified].filter(Boolean).join(' · '))}</h2>`;
  h += `<p class="q">${url
    ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(s.citation)}</a>`
    : esc(s.citation)}</p>`;
  h += `<div class="sec">`;
  if (s.verified === 'unconfirmed' && s.unconfirmed_detail) {
    h += `<p class="flag"><strong>${T('Unconfirmed:')}</strong> ${esc(s.unconfirmed_detail)}</p>`;
  }
  if (!url && s.reachable_at) h += `<p><span class="lbl">${T('Find it:')}</span> ${esc(s.reachable_at)}</p>`;
  if (s.paired_with) h += `<p><span class="lbl">${T('Free route:')}</span> ${esc(s.paired_with)}</p>`;
  if (s.verified_how) h += `<p><span class="lbl">${T('How we checked:')}</span> ${esc(s.verified_how)}</p>`;
  if (s.complexity) h += `<p><span class="lbl">${T('What makes it hard:')}</span> ${esc(s.complexity)}</p>`;
  h += `<p><span class="lbl">${T('Used by:')}</span> ${esc(users.join(', ') || 'nothing')}</p>`;
  h += `</div>`;
  h += cardIdentity(sid, 'source');
  el.panel.innerHTML = h;
}

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
