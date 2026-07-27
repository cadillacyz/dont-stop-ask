/* dont-stop-ask · 不停问 — question graph viewer
   Renders a question set emitted by the HTeen-Research skill.
   Reads visibility:both fields only; the schema forbids adult-only fields in this file. */

const DEFAULT_DATA = '../examples/us-china-tariffs/question-set.json';

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
  dropzone: document.getElementById('dropzone'),
  file: document.getElementById('file')
};

let DATA = null;
let sim = null;
let zoom = null;
let lastSource = null;
let selectedId = null;

/* ---------- loading ---------- */

function banner(msg, isError) {
  if (!msg) { el.banner.hidden = true; return; }
  el.banner.hidden = false;
  el.banner.textContent = msg;
  el.banner.classList.toggle('err', !!isError);
}

function dataUrl() {
  const q = new URLSearchParams(location.search).get('data');
  return q || DEFAULT_DATA;
}

async function loadFromUrl(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function validate(d) {
  const problems = [];
  if (!d || typeof d !== 'object') return ['not a JSON object'];
  if (!d.meta) problems.push('missing meta');
  if (!Array.isArray(d.questions) || !d.questions.length) problems.push('missing questions');
  if (!d.sources) problems.push('missing sources');
  const leaked = ['why_this', 'they_might_say', 'if_stuck'];
  (d.questions || []).forEach(q => {
    leaked.forEach(k => { if (k in q) problems.push(`${q.id} contains adult-only field "${k}"`); });
    (q.readings || []).forEach(r => {
      if (!d.sources || !d.sources[r.source]) problems.push(`${q.id} cites unknown source ${r.source}`);
    });
  });
  return problems;
}

async function boot() {
  lastSource = { kind: 'url', value: dataUrl() };
  try {
    const d = await loadFromUrl(lastSource.value);
    accept(d);
  } catch (err) {
    el.dropzone.hidden = false;
    banner(`Could not load ${lastSource.value} — ${err.message}. Open a file instead.`, true);
  }
}

function accept(d) {
  const problems = validate(d);
  if (problems.length) {
    banner(`This file does not match the schema: ${problems.slice(0, 3).join('; ')}`, true);
    if (!d || !Array.isArray(d.questions)) return;
  } else {
    banner(null);
  }
  DATA = d;
  el.dropzone.hidden = true;
  renderMeta();
  render();
  resetPanel();
}

function resetPanel() {
  selectedId = null;
  el.panel.innerHTML = '<p class="muted">Click a question dot to see its readings and how to work it.</p>';
}

/* ---------- meta ---------- */

function renderMeta() {
  const m = DATA.meta || {};
  const draft = m.status === 'draft';
  const bits = [];
  if (m.status) bits.push(`<span class="pill ${draft ? 'draft' : ''}">${esc(m.status)}</span>`);
  if (m.generated_at) bits.push(`<span class="pill">${esc(m.generated_at)}</span>`);
  const nExp = (m.expansions || []).length;
  if (nExp) bits.push(`<span class="pill">${nExp} expansion${nExp > 1 ? 's' : ''}</span>`);

  el.meta.innerHTML =
    `<h1>${esc(m.working_question || '(no working question)')}</h1>` +
    `<p>${bits.join(' ')}</p>` +
    (draft ? '<p class="muted" style="margin-top:8px">Not yet reviewed by an adult.</p>' : '');
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
  const spread = Math.min(W, H) * 0.29;
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
    .force('link', d3.forceLink(links).id(d => d.id).distance(l => (l.strong ? 64 : 92)).strength(0.5))
    .force('charge', d3.forceManyBody().strength(-150))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collide', d3.forceCollide().radius(d => d.r + 13))
    .force('x', d3.forceX(d => (anchorOf(d) || { x: W / 2 }).x).strength(d => (anchorOf(d) ? 0.13 : 0.02)))
    .force('y', d3.forceY(d => (anchorOf(d) || { y: H / 2 }).y).strength(d => (anchorOf(d) ? 0.13 : 0.02)));

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
    if (d.kind === 'question') showQuestion(d.q);
    else if (d.kind === 'root') showRoot();
    else showSource(d.id);
  });

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

  el.svg.node().__fit = () => {
    el.svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
    sim.alpha(0.4).restart();
  };
}

/* ---------- panel ---------- */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
    out += `<p class="flag"><strong>Unconfirmed:</strong> ${esc(s.unconfirmed_detail)}</p>`;
  }
  if (s.access_tier === 'T4' && s.paired_with) {
    out += `<p class="muted">Free route: ${esc(s.paired_with)}</p>`;
  }
  return out;
}

function expandButton(node, label) {
  return `<button class="btn" id="expand" data-node="${esc(node)}" data-q="${esc(label)}"
    style="margin-top:6px">Copy expansion prompt</button>`;
}

function wireExpand() {
  const b = document.getElementById('expand');
  if (!b) return;
  b.addEventListener('click', async () => {
    const url = new URLSearchParams(location.search).get('data') || DEFAULT_DATA;
    const prompt =
      `/HTeen-Research expand_from: ${url}#${b.dataset.node}\n\n` +
      `Expand this node: "${b.dataset.q}"\n` +
      `Generate up to nine verified follow-up questions (fewer if any would be padding), each with ` +
      `one to three ranked readings, grouped by relevance to this node's question. Append the ` +
      `cluster to the existing artifact and write a new JSON containing the union of old and new ` +
      `nodes, per STAGE 4 of the skill.`;
    try {
      await navigator.clipboard.writeText(prompt);
      b.textContent = 'Copied — paste into Claude Code';
    } catch {
      b.textContent = 'Copy failed — select the prompt below';
      el.panel.insertAdjacentHTML('beforeend',
        `<pre class="sec muted" style="white-space:pre-wrap;user-select:all">${esc(prompt)}</pre>`);
    }
    setTimeout(() => { b.textContent = 'Copy expansion prompt'; }, 4000);
  });
}

function showRoot() {
  const m = DATA.meta || {};
  el.panel.innerHTML =
    `<h2>Working question · sharpened by triage</h2>` +
    `<p class="q">${esc(m.working_question || '')}</p>` +
    (m.original_question ? `<div class="sec"><p><span class="lbl">They asked:</span> ${esc(m.original_question)}</p>` +
      (m.triage_summary ? `<p>${esc(m.triage_summary)}</p>` : '') + `</div>` : '') +
    expandButton('root', m.working_question || '');
  wireExpand();
}

function showQuestion(q) {
  const groupName = { core: 'core group', supporting: 'supporting group', context: 'context group' }[q.relevance_group] || q.relevance_group;
  const typeName = q.type ? `${q.type.name}${q.type.move ? ' · ' + q.type.move : ''}` : '';
  let h = `<h2>${esc(q.id)} · ${esc(groupName)}${typeName ? ' · ' + esc(typeName) : ''}</h2>`;
  h += `<p class="q">${esc(q.question)}</p>`;
  h += `<div class="sec">`;
  if (q.readings && q.readings.length) {
    h += `<p class="lbl">Readings, ranked</p>`;
    q.readings.forEach(r => { h += sourceLine(r.source, r.role); });
  } else {
    h += `<p><span class="role background">no reading</span>${esc(q.single_reading_reason || 'Thinking-only card.')}</p>`;
  }
  if (q.readings && q.readings.length === 1 && q.single_reading_reason) {
    h += `<p class="muted">One reading because: ${esc(q.single_reading_reason)}</p>`;
  }
  h += `<p style="margin-top:9px"><span class="lbl">Check first:</span> ${esc(q.check_first)}</p>`;
  h += `<p><span class="lbl">Read for:</span> ${esc(q.read_for)}</p>`;
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
    .map(q => {
      const role = q.readings.find(r => r.source === sid).role;
      return `${q.id} (${role})`;
    });
  let h = `<h2>Reading · ${esc([s.access_tier, s.verified].filter(Boolean).join(' · '))}</h2>`;
  h += `<p class="q">${s.url
    ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.citation)}</a>`
    : esc(s.citation)}</p>`;
  h += `<div class="sec">`;
  if (s.verified === 'unconfirmed' && s.unconfirmed_detail) {
    h += `<p class="flag"><strong>Unconfirmed:</strong> ${esc(s.unconfirmed_detail)}</p>`;
  }
  if (!s.url && s.reachable_at) h += `<p><span class="lbl">Find it:</span> ${esc(s.reachable_at)}</p>`;
  if (s.paired_with) h += `<p><span class="lbl">Free route:</span> ${esc(s.paired_with)}</p>`;
  if (s.verified_how) h += `<p><span class="lbl">How we checked:</span> ${esc(s.verified_how)}</p>`;
  if (s.complexity) h += `<p><span class="lbl">What makes it hard:</span> ${esc(s.complexity)}</p>`;
  h += `<p><span class="lbl">Used by:</span> ${esc(users.join(', ') || 'nothing')}</p>`;
  h += `</div>`;
  el.panel.innerHTML = h;
}

/* ---------- controls ---------- */

el.file.addEventListener('change', e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  lastSource = { kind: 'file', value: f };
  const r = new FileReader();
  r.onload = () => {
    try { accept(JSON.parse(r.result)); }
    catch (err) { banner(`That file is not valid JSON — ${err.message}`, true); }
  };
  r.readAsText(f);
});

document.getElementById('reload').addEventListener('click', async () => {
  if (!lastSource) return boot();
  if (lastSource.kind === 'url') {
    try { accept(await loadFromUrl(lastSource.value)); banner(null); }
    catch (err) { banner(`Reload failed — ${err.message}`, true); }
  } else {
    banner('Browsers cannot re-read a picked file. Choose it again to pick up changes.', false);
  }
});

document.getElementById('fit').addEventListener('click', () => {
  const fn = el.svg.node().__fit;
  if (fn) fn();
});

['dragenter', 'dragover'].forEach(t => {
  el.stage.addEventListener(t, e => {
    e.preventDefault();
    el.dropzone.hidden = false;
    el.dropzone.classList.add('over');
  });
});
el.stage.addEventListener('dragleave', () => {
  el.dropzone.classList.remove('over');
  if (DATA) el.dropzone.hidden = true;
});
el.stage.addEventListener('drop', e => {
  e.preventDefault();
  el.dropzone.classList.remove('over');
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  if (!f) return;
  lastSource = { kind: 'file', value: f };
  const r = new FileReader();
  r.onload = () => {
    try { accept(JSON.parse(r.result)); }
    catch (err) { banner(`That file is not valid JSON — ${err.message}`, true); }
  };
  r.readAsText(f);
});

let rt = null;
window.addEventListener('resize', () => {
  if (!DATA) return;
  clearTimeout(rt);
  rt = setTimeout(() => { const s = selectedId; render(); selectedId = s; }, 200);
});

boot();
