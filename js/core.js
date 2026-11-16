/* ===== 핏센스 프로토타입 · 핵심 로직 ===== */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SZ = ['XS', 'S', 'M', 'L', 'XL'];
const SZ_WIDE = ['4XS', '3XS', '2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'FREE'];
const CATS = ['상의', '하의', '원피스', '아우터'];   // 측정·기록 가능한 카테고리
const BCATS = [...CATS];
const CODE_OF = { 상의: 'top', 하의: 'bottom', 원피스: 'dress', 아우터: 'outer' };
const PREFS = ['슬림 핏', '기본 핏', '여유 핏'];
const PARTS = { 상의: ['어깨', '가슴', '소매', '총장'], 아우터: ['어깨', '가슴', '소매', '총장'], 하의: ['허리', '힙', '허벅지', '총장'], 원피스: ['어깨', '가슴', '허리', '총장'] };

const MNUM = { 상의: { 총장: 1, 어깨: 2, 가슴: 3, 소매: 4 }, 아우터: { 총장: 1, 어깨: 2, 가슴: 3, 소매: 4 }, 하의: { 총장: 1, 허리: 2, 힙: 3, 허벅지: 4 }, 원피스: { 총장: 1, 어깨: 2, 가슴: 3, 허리: 4 } };
const partsByNum = c => [...PARTS[c]].sort((a, b) => MNUM[c][a] - MNUM[c][b]);
const nbTag = (c, k) => `<i class="nbt">${MNUM[c][k]}</i>`;
function measureSVG(c) {
  const bd = (x, y, n) => `<g><rect x="${x - 9}" y="${y - 9}" width="18" height="18" rx="3" fill="#111"/><text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${n}</text></g>`;
  const ln = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9aa0aa" stroke-width="1.2" marker-start="url(#ah)" marker-end="url(#ah)"/>`;
  let shape = '', marks = '';
  if (c === '하의') { shape = 'M80 24 L160 24 L170 176 L128 176 L120 78 L112 176 L70 176 Z'; marks = ln(32, 24, 32, 176) + bd(32, 100, 1) + ln(80, 14, 160, 14) + bd(120, 14, 2) + ln(76, 56, 164, 56) + bd(120, 56, 3) + ln(72, 98, 116, 98) + bd(94, 98, 4); }
  else if (c === '원피스') { shape = 'M92 26 L106 18 Q120 30 134 18 L148 26 L158 62 L150 72 L170 180 L70 180 L90 72 L82 62 Z'; marks = ln(32, 18, 32, 180) + bd(32, 100, 1) + ln(92, 10, 148, 10) + bd(120, 10, 2) + ln(84, 56, 156, 56) + bd(120, 56, 3) + ln(90, 84, 150, 84) + bd(120, 84, 4); }
  else { shape = 'M72 32 L102 22 Q120 38 138 22 L168 32 L208 70 L188 92 L170 78 L170 176 L70 176 L70 78 L52 92 L32 70 Z'; marks = ln(26, 22, 26, 176) + bd(26, 100, 1) + ln(72, 12, 168, 12) + bd(120, 12, 2) + ln(70, 112, 170, 112) + bd(120, 112, 3) + ln(178, 38, 212, 76) + bd(214, 54, 4); }
  return `<svg class="mdiag" viewBox="0 0 240 190" role="img" aria-label="${c} 실측 부위 번호"><defs><marker id="ah" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L6 3 L0 6z" fill="#9aa0aa"/></marker></defs><path d="${shape}" fill="#fff" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>${marks}</svg>`;
}
// 핏 판정 규칙: zip의 tools/fit_model.py 값을 그대로 가져온 것(실습용 가정값)
const TARGET = { 상의: { 어깨: 1.5, 가슴: 14, 소매: 4 }, 아우터: { 어깨: 3, 가슴: 22, 소매: 6 }, 하의: { 허리: 4, 힙: 7, 허벅지: 5 }, 원피스: { 어깨: 1.5, 가슴: 12, 허리: 14 } };
const PREF_K = { '슬림 핏': -1, '기본 핏': 0, '여유 핏': 1.2 };
const PREF_SCALE = { 어깨: 1.2, 가슴: 5, 허리: 3, 힙: 3, 허벅지: 2.5, 소매: 0 };
const TOL = { 어깨: 1.6, 가슴: 4.5, 허리: 3, 힙: 3, 허벅지: 2.5, 소매: 2.5 };
const W = { 상의: { 어깨: .25, 가슴: .75 }, 아우터: { 어깨: .3, 가슴: .7 }, 하의: { 허리: .4, 힙: .4, 허벅지: .2 }, 원피스: { 어깨: .15, 가슴: .45, 허리: .4 } };
const INC = { 어깨: 1.2, 가슴: 6, 허리: 4, 힙: 4, 허벅지: 3, 소매: 1, 총장: 1.5 };
const LENR = { 상의: .378, 아우터: .397, 원피스: .6 }, LENTOL = { 상의: 3.5, 아우터: 5, 원피스: 6 };
// AI가 사진에서 읽었다고 가정하는 샘플값(M 기준). 프로토타입에서는 고정
const SAMPLE_M = { 상의: { 어깨: 41, 가슴: 100, 소매: 58, 총장: 62 }, 아우터: { 어깨: 44, 가슴: 112, 소매: 61, 총장: 66 }, 하의: { 허리: 70, 힙: 100, 허벅지: 60, 총장: 98 }, 원피스: { 어깨: 40, 가슴: 96, 허리: 80, 총장: 100 } };
const VLABEL = { tight: '타이트', ok: '적당', loose: '여유', short: '짧은 편', long: '긴 편', na: '—' };

/* ---------- 데이터 인덱스 ---------- */
const BR = DB.B, PR = DB.P, RV = DB.R, TX = DB.TX || [];
const prodById = Object.fromEntries(PR.map(p => [p.id, p]));
const brandById = Object.fromEntries(BR.map(b => [b.id, b]));
const revByProd = {}; RV.forEach(r => (revByProd[r.p] ||= []).push(r));
const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const helpfulBase = r => 3 + hash(r.id) % 41, likeBase = r => hash(r.id + 'l') % 19;
const won = n => n ? n.toLocaleString('ko-KR') + '원' : '가격 미확인';
const r1 = x => Math.round(x * 10) / 10;
const sgn = x => (x > 0 ? '+' : x < 0 ? '−' : '±') + Math.abs(r1(x));
const today = () => new Date().toISOString().slice(0, 10).replace(/-/g, '.');

function brandStat(bid) {
  const ids = PR.filter(p => p.b === bid).map(p => p.id), rs = ids.flatMap(i => revByProd[i] || []);
  const ok = rs.filter(r => r.op === '정사이즈').length;
  return { n: PR.filter(p => p.b === bid).length, rv: rs.length, pct: rs.length ? Math.round(ok / rs.length * 100) : 0 };
}
function similarBrandPct(bid, body) {
  const h = +body?.h || 160, w = +body?.w || 52;
  const rs = PR.filter(p => p.b === bid).flatMap(p => revByProd[p.id] || []).filter(r => { const u = DB.U[r.u]; return u && Math.abs(u[0] - h) <= 6 && Math.abs(u[1] - w) <= 7; });
  if (rs.length < 3) return null;
  return { pct: Math.round(rs.filter(r => r.op === '정사이즈').length / rs.length * 100), n: rs.length };
}

/* ---------- 상태 + 저장 ---------- */
const KEY = 'fitsense_wf_v5';
const freshS = () => ({ rview: '2', nset: {}, notifs: null, pview: '3', inquiries: [], account: null, loggedIn: false, photos: [], bodyPhotoId: null, replies: {}, hiddenReplies: [], tutorialHide: false, bodyPhoto: null, body: null, bodyHistory: [], profile: { nick: '핏센스 유저', uid: 'fit_user01', styles: [], stylePub: true, img: null, gender: '여성', bio: '', showBody: true }, records: [], closet: [], likes: { brand: [], product: [], review: [] }, helpful: {}, recent: [], seeded: false });
let S = freshS();
try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(freshS(), JSON.parse(raw)); } catch (e) { }
S.profile = Object.assign(freshS().profile, S.profile); S.nset = S.nset || {};
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };

/* ---------- 업로드 사진 보관함(전신·사이즈표·착용샷). 사진마다 따로 지울 수 있다 ---------- */
function addPhoto(kind, src) { const id = 'P' + Date.now() + Math.floor(Math.random() * 1000); S.photos.unshift({ id, kind, src, date: today() }); return id; }
function delPhoto(id) {
  if (!id) return; S.photos = S.photos.filter(p => p.id !== id);
  if (S.bodyPhotoId === id) { S.bodyPhoto = null; S.bodyPhotoId = null; }
  S.closet.forEach(c => { if (c.photoId === id) { c.photo = null; c.photoId = null; } });
  if (typeof M !== 'undefined' && M && M.photoId === id) { M.photo = null; M.photoId = null; }
  if (typeof FB !== 'undefined' && FB && FB.photoId === id) { FB.photo = null; FB.photoId = null; }
  save();
}

/* ---------- 핏 계산 ---------- */
function bodyVals(b) {
  b = b || {};
  const h = +b.h || 160, w = +b.w || 52, n = x => (x ? +x : 0), est = {};
  const pick = (k, v, f) => { const x = n(v); if (!x) est[k] = true; return x || f; };
  const sho = pick('어깨', b.sho, h * .238), chest = pick('가슴', b.chest, h * .5 + (w - 52) * .6 + 2), waist = pick('허리', b.waist, h * .4 + (w - 52) * .6), hip = pick('힙', b.hip, h * .575 + (w - 52) * .6);
  const thigh = pick('허벅지', b.thigh, hip * .595), arm = pick('소매', b.arm, h * .3375);
  return { h, w, 어깨: r1(sho), 가슴: r1(chest), 허리: r1(waist), 힙: r1(hip), 허벅지: r1(thigh), 소매: r1(arm), est };
}
function evalSize(cat, g, bv, pref, pers = {}) {
  const rows = []; let score = 0;
  PARTS[cat].forEach(p => {
    if (g[p] == null || g[p] === '') return;
    const gv = +g[p];
    if (p === '총장') {
      const ratio = LENR[cat];
      if (ratio) { const exp = bv.h * ratio, d = gv - exp, t = LENTOL[cat]; rows.push({ part: p, body: r1(exp), garment: gv, diff: d, v: d < -t ? 'short' : d > t ? 'long' : 'ok', len: true }); }
      else rows.push({ part: p, body: null, garment: gv, diff: null, v: 'na', len: true });
      return;
    }
    const tg = TARGET[cat][p] + PREF_K[pref] * PREF_SCALE[p] + (pers[p] || 0), ease = gv - bv[p], d = ease - tg, tol = TOL[p];
    rows.push({ part: p, body: bv[p], garment: gv, ease, target: tg, diff: d, tol, v: d < -tol ? 'tight' : d > tol ? 'loose' : 'ok', est: !!bv.est[p] });
    if (W[cat][p]) score += W[cat][p] * Math.abs(d) / tol;
  });
  return { rows, score };
}
// 한 사이즈만 아는 경우 나머지는 사이즈 간격으로 추정(ex 표시)
function fullChart(cat, given) {
  const ks = SZ.filter(s => given[s]); if (!ks.length) return { chart: {}, ex: {} };
  const chart = {}, ex = {};
  SZ.forEach((s, i) => {
    if (given[s]) { chart[s] = { ...given[s] }; return; }
    const near = ks.reduce((a, k) => Math.abs(SZ.indexOf(k) - i) < Math.abs(SZ.indexOf(a) - i) ? k : a, ks[0]), d = i - SZ.indexOf(near);
    chart[s] = {}; PARTS[cat].forEach(p => { if (given[near][p] != null) chart[s][p] = r1(+given[near][p] + INC[p] * d); }); ex[s] = true;
  });
  return { chart, ex };
}
function recommend(cat, chart, bv, pref, pers = {}) {
  const sc = SZ.filter(s => chart[s]).map(s => ({ s, ...evalSize(cat, chart[s], bv, pref, pers) }));
  sc.sort((a, b) => a.score - b.score);
  return { best: sc[0].s, all: Object.fromEntries(sc.map(x => [x.s, x.score])), gap: sc[1] ? sc[1].score - sc[0].score : 9 };
}
function quickRec(prod) {
  if (!prod?.ch || !S.body) return null;
  const cat = prod.c, bv = bodyVals(S.body), pref = S.body.pref || '기본 핏';
  try { return recommend(cat, prod.ch, bv, pref, persInfo().shift).best; } catch (e) { return null; }
}
function buildAnalysis(d) {
  // d: 측정 초안. 우선순위 = 직접 입력 > 불러온 상품 > AI 샘플
  const cat = d.cat, prod = d.productId ? prodById[d.productId] : null;
  const typed = {}; PARTS[cat].forEach(p => { if (d.rows[p] !== undefined && d.rows[p] !== '') typed[p] = +d.rows[p]; });
  let given, source;
  if (prod?.ch) {
    // 상품 사이즈표를 불러온 경우: 그대로 쓰되, 사용자가 고친 값은 모든 사이즈에 같은 차이만큼 반영
    given = JSON.parse(JSON.stringify(prod.ch)); source = 'product';
    if (d.touched && given[d.size]) {
      PARTS[cat].forEach(p => { if (typed[p] != null && given[d.size][p] != null) { const dl = typed[p] - given[d.size][p]; if (Math.abs(dl) > 0.01) { source = 'manual'; SZ.forEach(z => { if (given[z] && given[z][p] != null) given[z][p] = r1(given[z][p] + dl); }); } } });
    }
  }
  else if (Object.keys(typed).length >= 2) { given = { [d.size]: typed }; source = 'manual'; }
  else { given = { M: SAMPLE_M[cat] }; source = 'sample'; }
  const { chart, ex } = fullChart(cat, given);
  const bv = bodyVals(S.body), pref = S.body?.pref || '기본 핏', pi = persInfo(), rec = recommend(cat, chart, bv, pref, pi.shift);
  return {
    id: 'A' + Date.now(), date: today(), cat, brandId: d.brandId, brandName: d.brandId ? brandById[d.brandId].n : (d.brandText || '직접 입력'),
    productId: d.productId || null, productName: prod ? prod.n : (d.name || ''), photoType: '사이즈표', link: d.link || '', hasPhoto: !!d.photo, source, chart, ex,
    sel: rec.best, rec: rec.best, gap: rec.gap, body: { ...S.body }, pref, pers: pi, corrected: false, fb: null
  };
}
function analysisView(A) { // 선택한 사이즈 기준 평가 + 추천 재계산
  const bv = bodyVals(A.body), sh = A.pers?.shift || {}, ev = evalSize(A.cat, A.chart[A.sel] || {}, bv, A.pref, sh), rec = recommend(A.cat, A.chart, bv, A.pref, sh);
  return { bv, ev, rec };
}

/* ---------- 핏 시각화(SVG 실루엣) ---------- */
function fitSVG(cat, rows, h) {
  const C = { tight: 'var(--tight)', ok: 'var(--ok)', loose: 'var(--loose)', short: 'var(--tight)', long: 'var(--loose)', na: 'var(--mute)' };
  const by = Object.fromEntries(rows.map(r => [r.part, r]));
  const z = (p, shape) => by[p] ? shape(C[by[p].v]) : '';
  const fillz = c => `style="fill:${c};fill-opacity:.42;stroke:${c}" stroke-width="1.6"`;
  const ARM_L = 'M106 82 C94 100 88 150 84 216 L98 218 C102 168 108 124 116 96 Z', ARM_R = 'M194 82 C206 100 212 150 216 216 L202 218 C198 168 192 124 184 96 Z';
  const tagY = { 어깨: 84, 가슴: 118, 소매: 152, 허리: cat === '하의' ? 156 : 158, 힙: 204, 허벅지: 258 };
  const zoneEdge = { 어깨: [194, 81], 가슴: [188, 115], 소매: [211, 150], 허리: [178, 155], 힙: [196, 204], 허벅지: [192, 258] };
  let tags = '';
  rows.forEach(r => {
    if (r.len) return;
    const y = tagY[r.part], e = zoneEdge[r.part], c = C[r.v], txt = `${r.part} ${r1(r.ease) > 0 ? '+' : ''}${r1(r.ease)}`;
    tags += `<line x1="${e[0]}" y1="${e[1]}" x2="224" y2="${y}" style="stroke:${c}" stroke-width="1" stroke-dasharray="2 2"/><rect x="224" y="${y - 10}" width="74" height="20" rx="10" style="fill:var(--s0);stroke:${c}"/><text x="261" y="${y + 4}" text-anchor="middle" font-size="10.5" font-weight="700" style="fill:${c}">${txt}</text>`;
  });
  let len = '';
  const L = by['총장'];
  if (L) {
    const k = 407 / h, y0 = cat === '하의' ? 152 : 77, y1 = Math.min(432, y0 + L.garment * k), c = C[L.v];
    len = `<line x1="64" y1="${y0}" x2="64" y2="${y1}" style="stroke:${c}" stroke-width="2"/><line x1="58" y1="${y0}" x2="70" y2="${y0}" style="stroke:${c}" stroke-width="2"/><line x1="58" y1="${y1}" x2="70" y2="${y1}" style="stroke:${c}" stroke-width="2"/>
    <line x1="70" y1="${y1}" x2="230" y2="${y1}" style="stroke:${c}" stroke-width="1.4" stroke-dasharray="5 4"/>
    <rect x="2" y="${Math.min(y1 - 10, 414)}" width="56" height="20" rx="10" style="fill:var(--s0);stroke:${c}"/><text x="30" y="${Math.min(y1 + 4, 428)}" text-anchor="middle" font-size="10.5" font-weight="700" style="fill:${c}">총장 ${L.diff != null ? (r1(L.diff) > 0 ? '+' : '') + r1(L.diff) : r1(L.garment)}</text>`;
  }
  return `<svg class="fitsvg" viewBox="0 0 300 440" role="img" aria-label="부위별 핏 실루엣">
  <g style="fill:var(--s1);stroke:var(--line2)" stroke-width="1.4">
    <circle cx="150" cy="36" r="19"/><path d="M143 54 L143 70 L157 70 L157 54"/>
    <path d="M108 80 C106 108 120 128 124 158 C118 180 106 196 104 218 L196 218 C194 196 182 180 176 158 C180 128 194 108 192 80 Q150 68 108 80Z"/>
    <path d="M104 218 L149 218 L145 300 L141 424 L121 424 L116 300 Z"/><path d="M196 218 L151 218 L155 300 L159 424 L179 424 L184 300 Z"/>
    <path d="${ARM_L}"/><path d="${ARM_R}"/>
  </g>
  ${z('소매', c => `<path d="${ARM_L}" ${fillz(c)}/><path d="${ARM_R}" ${fillz(c)}/>`)}
  ${z('어깨', c => `<rect x="106" y="74" width="88" height="14" rx="7" ${fillz(c)}/>`)}
  ${z('가슴', c => `<rect x="112" y="104" width="76" height="22" rx="6" ${fillz(c)}/>`)}
  ${z('허리', c => `<rect x="122" y="146" width="56" height="18" rx="6" ${fillz(c)}/>`)}
  ${z('힙', c => `<rect x="104" y="192" width="92" height="24" rx="8" ${fillz(c)}/>`)}
  ${z('허벅지', c => `<rect x="108" y="226" width="38" height="64" rx="10" ${fillz(c)}/><rect x="154" y="226" width="38" height="64" rx="10" ${fillz(c)}/>`)}
  ${len}${tags}</svg>`;
}

/* ---------- 라우터 ---------- */
let stack = [{ v: 'home', p: {} }];
const V = {}; // 화면 함수 모음(app2.js)
let sheetOpen = false;
function render(keepScroll) {
  const cur = stack.at(-1), view = $('#view');
  view.innerHTML = '<div class="scr">' + (V[cur.v] ? V[cur.v](cur.p) : '<div class="empty">화면 없음</div>') + '</div>';
  view.scrollTop = keepScroll ? (cur.sy || 0) : (cur.sy || 0);
  const full = ['tutorial', 'analyzing'].includes(cur.v);
  $('#nav').style.display = full ? 'none' : '';
  const rootOf = { home: 'home', brand: 'brand', brandDetail: 'brand', plist: 'brand', product: 'brand', review: 'brand', measure: 'measure', tutorial: 'measure', analyzing: 'measure', saved: 'measure', records: 'records', feedback: 'records', closetAdd: 'records', likes: '', notifs: '', my: 'my', profile: 'my', myfit: 'my', recent: 'my', photos: 'my', login: 'my', signup: 'my', withdraw: 'my' };
  let t = rootOf[cur.v] ?? 'my';
  if (cur.v === 'result') t = cur.p.rid ? 'records' : 'measure';
  if (cur.v === 'saved' && cur.p.rid) t = 'records';
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  if (typeof ensureNotifs === 'function') { ensureNotifs(); const nd = $('#nfdot'); if (nd) nd.hidden = !S.notifs.some(n => !n.read); const nb = $('#ab-notif'); if (nb) nb.classList.toggle('on', cur.v === 'notifs'); }
  const lk = $('#ab-likes'); if (lk) lk.classList.toggle('on', cur.v === 'likes');
  syncCars();
  if (V[cur.v + '$after']) V[cur.v + '$after'](cur.p);
}
function go(v, p = {}) { stack.at(-1).sy = $('#view').scrollTop; stack.push({ v, p }); $('#view').scrollTop = 0; render(); $('#view').scrollTop = 0; }
function back() { if (stack.length > 1) { stack.pop(); render(); } else tab('home'); }
function tab(t) { stack = [{ v: t === 'my' ? 'my' : t, p: {} }]; render(); $('#view').scrollTop = 0; }
function replaceTop(v, p = {}) { stack[stack.length - 1] = { v, p }; render(); $('#view').scrollTop = 0; }
function reRender() { const y = $('#view').scrollTop; render(); $('#view').scrollTop = y; }

/* ---------- 시트·토스트 ---------- */
function sheet(html, mid) {
  closeSheet();
  const d = document.createElement('div'); d.className = 'scrim' + (mid ? ' mid' : ''); d.id = 'scrim';
  d.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  d.addEventListener('click', e => { if (e.target === d) closeSheet(); });
  $('#phone').appendChild(d); if (typeof syncCars === 'function') syncCars();
}
function closeSheet() { const s = $('#scrim'); if (s) s.remove(); }
let tt;
function toast(msg) {
  const old = $('#toast'); if (old) old.remove();
  const t = document.createElement('div'); t.className = 'toast'; t.id = 'toast'; t.textContent = msg; $('#phone').appendChild(t);
  clearTimeout(tt); tt = setTimeout(() => t.remove(), 1800);
}

/* ---------- 이미지 축소(저장 용량 절약) ---------- */
function readPhoto(file, max, cb) {
  const fr = new FileReader();
  fr.onload = () => { const im = new Image(); im.onload = () => {
    const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k;
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', .72));
  }; im.onerror = () => cb(null); im.src = fr.result; };
  fr.readAsDataURL(file);
}

/* ---------- 초성 검색 ---------- */
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const choOf = s => [...s].map(c => { const k = c.charCodeAt(0) - 44032; return k >= 0 && k < 11172 ? CHO[Math.floor(k / 588)] : c; }).join('');
function findIn(text, q) {
  q = q.trim().toLowerCase(); if (!q) return null;
  const t = text.toLowerCase(); let i = t.indexOf(q);
  if (i < 0 && /^[ㄱ-ㅎ]+$/.test(q)) i = choOf(text).indexOf(q);
  return i < 0 ? null : [i, q.length];
}
function hl(text, q) { const m = findIn(text, q); return m ? esc(text.slice(0, m[0])) + '<mark>' + esc(text.slice(m[0], m[0] + m[1])) + '</mark>' + esc(text.slice(m[0] + m[1])) : esc(text); }

/* ---------- 아이콘 ---------- */
const IC = {
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  measure: '<rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>',
  brand: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  my: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
  heart: '<path d="M12 20s-7-4.6-9-9.2C1.8 7 4 4 7 4c2 0 3.500 1 5 3 1.500-2 3-3 5-3 3 0 5.200 3 4 6.800C19 15.400 12 20 12 20z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  thumb: '<path d="M7 11v9H4v-9zM7 11l4-8c2 0 3 1 3 3l-1 4h6a2 2 0 0 1 2 2.300l-1.300 6A2 2 0 0 1 17.800 20H7"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.700 7L4 20l1.200-4.400A8 8 0 1 1 21 12z"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="M5 12.500l4.500 4.500L19 7.500"/>', chev: '<path d="M9 5l7 7-7 7"/>'
};
const ico = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24">${IC[n]}</svg>`;

/* ---------- 기록의 피드백 → 개인 보정값 ----------
   피드백(분석 기록 피드백 + 직접 추가한 옷)에서 부위별 "타이트"가 많으면 그 부위의 선호 여유를 늘리고, "여유"가 많으면 줄인다.
   전체 핏이 작음/여유면 가슴·허리·힙에 절반 가중치로 반영. 보정폭은 부위 허용오차(TOL)의 최대 ±1배. */
function persInfo() {
  const items = [...S.records.filter(r => r.fb).map(r => r.fb), ...S.closet];
  const t = {}, l = {}, kwc = {};
  items.forEach(f => {
    Object.entries(f.parts || {}).forEach(([k, v]) => { if (v === '타이트') t[k] = (t[k] || 0) + 1; if (v === '여유') l[k] = (l[k] || 0) + 1; });
    (f.kw || []).forEach(w => { kwc[w] = (kwc[w] || 0) + 1; const m = KW_PART[w]; if (m) { const mm = m[1] === 't' ? t : l; mm[m[0]] = (mm[m[0]] || 0) + .5; } });
    const o = f.overall === '작음' ? 1 : f.overall === '여유' ? -1 : 0;
    if (o) ['가슴', '허리', '힙'].forEach(k => { const m = o > 0 ? t : l; m[k] = (m[k] || 0) + .5; });
  });
  const shift = {};
  Object.keys(TOL).forEach(k => { const d = (t[k] || 0) - (l[k] || 0); if (d) shift[k] = r1(Math.max(-1, Math.min(1, d * .35)) * TOL[k]); });
  return { n: items.length, shift, kw: Object.entries(kwc).sort((x, y) => y[1] - x[1]) };
}
/* ---------- 브랜드 사이즈 경향 (JSON에 size_tendency 가 없으면 후기에서 계산) ---------- */
function brandTend(bid, cat) {
  const rs = PR.filter(p => p.b === bid && (!cat || p.c === cat)).flatMap(p => revByProd[p.id] || []), n = rs.length || 1;
  const sm = Math.round(rs.filter(r => r.op === '작은 편').length / n * 100), bg = Math.round(rs.filter(r => r.op === '큰 편').length / n * 100), ok = 100 - sm - bg;
  const given = cat ? null : brandById[bid]?.tend;
  const label = given || (bg - sm >= 12 ? '크게 나오는 편' : sm - bg >= 12 ? '작게 나오는 편' : '정사이즈 경향');
  return { sm, ok, bg, label, cls: label.includes('크게') ? 'loose' : label.includes('작게') ? 'tight' : 'ok' };
}
/* 한 사이즈에 대한 전체 의견: 부위별 편차를 가중 평균 */
function sizeVerdict(cat, ev) {
  let s = 0, w = 0; ev.rows.forEach(r => { if (r.len || r.diff == null) return; const k = W[cat][r.part] || .1; s += k * r.diff / r.tol; w += k; });
  const m = w ? s / w : 0;
  return m < -.8 ? { t: '작게 느껴져요', c: 'tight' } : m > .8 ? { t: '크게 느껴져요', c: 'loose' } : { t: '잘 맞아요', c: 'ok' };
}

/* ---------- 컬러 · 상품 속성 라벨 ---------- */
const COLOR_HEX = { 블랙: '#1b1b1d', 그레이: '#9a9ca3', 베이지: '#d8c6a3', 아이보리: '#f3eedd', 화이트: '#ffffff', 네이비: '#1f2a4d', 카키: '#6b6b3f', 차콜: '#44464c', 진청: '#2c4a78', 연청: '#8fb0d6', 스카이블루: '#87c3ec', 핑크: '#f2a9c2', 브라운: '#6f4e37', 블루: '#2f6fd0', 레드: '#d23b3b', 그린: '#3f8f5a', 옐로우: '#f1cf4b', 퍼플: '#7a4fb0', 오렌지: '#ef8a3a', 민트: '#9fdcc8', 와인: '#6d1f3a' };
const cdot = c => `<i class="cdot ${['화이트', '아이보리'].includes(c) ? 'lt' : ''}" style="background:${COLOR_HEX[c] || '#bbb'}" title="${esc(c)}"></i>`;
const FIT_LBL = { 슬림: '슬림핏', 레귤러: '레귤러핏', 오버: '오버핏' };
const attrCount = (ps, f) => { const m = {}; ps.forEach(p => { const v = f(p); (Array.isArray(v) ? v : [v]).forEach(x => { if (x) m[x] = (m[x] || 0) + 1; }); }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
const SUBS = Object.fromEntries(BCATS.map(c => [c, attrCount(PR.filter(p => p.c === c), p => p.sc)]));

/* ---------- 후기 키워드(사이즈 관련 위주). 메모 외에 고를 수 있는 값 ----------
   ex:true 인 그룹은 하나만 선택. JSON 에 reviews.keywords 가 없으면 후기 데이터에서 더미로 만든다 */
const KW = [
  { g: '사이즈 조언', k: ['정사이즈 추천', '한 치수 업 추천', '한 치수 다운 추천', '평소 사이즈 그대로', '여유 있게 입으려면 업'] },
  { g: '핏 느낌', k: ['슬림해요', '레귤러해요', '루즈해요', '박시해요', '몸에 붙어요', '라인이 예뻐요'] },
  { g: '부위 체감', k: ['어깨 좁아요', '어깨 넉넉해요', '가슴 답답해요', '팔 길어요', '팔 짧아요', '허리 꽉 껴요', '허리 남아요', '힙 꽉 껴요', '허벅지 꽉 껴요', '기장 길어요', '기장 짧아요'] },
  { g: '두께감', k: ['얇아요', '적당한 두께', '도톰해요'] },
  { g: '비침', k: ['비침 없어요', '살짝 비쳐요', '많이 비쳐요'] },
  { g: '촉감', k: ['부드러워요', '까슬해요', '뻣뻣해요', '따뜻해요', '시원해요'] },
  { g: '신축성 체감', k: ['안 늘어나요', '적당히 늘어나요', '잘 늘어나요'] },
  { g: '무게감', k: ['가벼워요', '묵직해요'] },
  { g: '세탁 후', k: ['변형 없어요', '줄어들어요', '늘어나요', '보풀 생겨요'] },
  { g: '입는 상황', k: ['데일리', '출근', '운동', '하객·모임'] },
  { g: '구매 이유', k: ['비슷한 체형 후기 보고', '브랜드 신뢰', '핏 사진 참고'] }
];
// 키워드가 알고리즘에 주는 영향: 부위가 "꽉 낌/좁음"이면 타이트, "남음/넉넉"이면 여유로 반(0.5건) 가중
const KW_PART = { '어깨 좁아요': ['어깨', 't'], '가슴 답답해요': ['가슴', 't'], '허리 꽉 껴요': ['허리', 't'], '힙 꽉 껴요': ['힙', 't'], '허벅지 꽉 껴요': ['허벅지', 't'], '어깨 넉넉해요': ['어깨', 'l'], '허리 남아요': ['허리', 'l'] };
const kwCache = {};
function kwOf(r) {
  if (r.kw) return r.kw; if (kwCache[r.id]) return kwCache[r.id];
  const p = prodById[r.p] || {}, h = hash(r.id + 'kw'), o = [], pick = (arr, i) => arr[(h >> i) % arr.length];
  o.push(r.op === '정사이즈' ? '정사이즈 추천' : r.op === '작은 편' ? '한 치수 업 추천' : '한 치수 다운 추천');
  o.push(p.fit === '슬림' ? '슬림해요' : p.fit === '오버' ? pick(['루즈해요', '박시해요'], 1) : '레귤러해요');
  Object.entries(r.fd || {}).forEach(([k, v]) => {
    if (v === '타이트') { const w = { 어깨: '어깨 좁아요', 가슴: '가슴 답답해요', 허리: '허리 꽉 껴요', 힙: '힙 꽉 껴요', 허벅지: '허벅지 꽉 껴요' }[k]; if (w) o.push(w); }
    if (v === '여유') { const w = { 어깨: '어깨 넉넉해요', 허리: '허리 남아요' }[k]; if (w) o.push(w); }
    if (k === '소매' && v === '긴 편') o.push('팔 길어요'); if (k === '소매' && v === '짧은 편') o.push('팔 짧아요');
    if (k === '총장' && v === '긴 편') o.push('기장 길어요'); if (k === '총장' && v === '짧은 편') o.push('기장 짧아요');
  });
  o.push(p.st === '좋음' ? '잘 늘어나요' : p.st === '없음' ? '안 늘어나요' : '적당히 늘어나요');
  o.push(['패딩', '후리스', '코트'].includes(p.sc) ? '도톰해요' : pick(['얇아요', '적당한 두께', '도톰해요'], 2));
  if (p.c !== '하의' && (p.col || []).some(c => ['화이트', '아이보리', '베이지'].includes(c))) o.push(pick(['비침 없어요', '살짝 비쳐요'], 3));
  if (h % 3 === 0) o.push(pick(['부드러워요', '까슬해요', '뻣뻣해요', '따뜻해요', '시원해요'], 4));
  if (h % 4 === 1) o.push(pick(['변형 없어요', '줄어들어요', '늘어나요', '보풀 생겨요'], 5));
  if (h % 2 === 0) o.push(pick(['데일리', '출근', '운동', '하객·모임'], 6));
  return kwCache[r.id] = [...new Set(o)].slice(0, 8);
}

/* ---------- 상품 점수: 내 핏 · 비슷한 체형 만족도 · 관심 속성 ---------- */
function fitScore(p, shift) {
  if (!S.body || !p.ch) return null;
  try { const r = recommend(p.c, p.ch, bodyVals(S.body), S.body.pref || '기본 핏', shift || {}); return r.all[r.best]; } catch (e) { return null; }
}
function simStat(pid, tH = 8, tW = 10) {
  const b = S.body; if (!b) return null;
  const rs = (revByProd[pid] || []).filter(r => { const u = DB.U[r.u]; return u && Math.abs(u[0] - b.h) <= tH && Math.abs(u[1] - b.w) <= tW; });
  if (!rs.length) return null;
  const ok = rs.filter(r => r.op === '정사이즈').length; return { n: rs.length, ok, pct: Math.round(ok / rs.length * 100) };
}
const SORTS = ['내 핏 맞는 순', '비슷한 체형 만족도순', '후기 많은 순', '낮은 가격순', '높은 가격순'];
const defSort = () => S.body ? SORTS[0] : SORTS[2];
function sortProducts(ps, sort) {
  const s = sort || defSort(), shift = persInfo().shift, by = (f, dir = 1) => { const m = new Map(ps.map(p => [p.id, f(p)])); return [...ps].sort((a, b) => dir * (m.get(a.id) - m.get(b.id)) || (a.pr || 0) - (b.pr || 0) || a.id.localeCompare(b.id)); };
  if (s === '내 핏 맞는 순') return by(p => fitScore(p, shift) ?? 99);
  if (s === '비슷한 체형 만족도순') return by(p => { const t = simStat(p.id); return t ? -(t.pct + Math.min(t.n, 5) * .5) : 1; });
  if (s === '후기 많은 순') return by(p => -((revByProd[p.id] || []).length));
  if (s === '높은 가격순') return by(p => -(p.pr || 0));
  return by(p => p.pr || 9e9);
}
const revByUser = {}; RV.forEach(r => (revByUser[r.u] ||= []).push(r));
const topOf = o => Object.entries(o).sort((a, b) => b[1] - a[1]);
function styleAffinity() {   // 찜·최근 본·분석한·직접 추가한 상품의 핏/소매/신축성/컬러/카테고리 성향
  const ids = [...S.likes.product, ...S.recent, ...S.closet.map(c => c.productId).filter(Boolean), ...S.records.map(r => r.productId).filter(Boolean)];
  const m = { fit: {}, col: {}, sl: {}, c: {}, st: {} };
  ids.forEach(id => { const p = prodById[id]; if (!p) return; const add = (k, v) => { if (v) m[k][v] = (m[k][v] || 0) + 1; }; add('fit', p.fit); add('sl', p.sl); add('st', p.st); add('c', p.c); (p.col || []).forEach(c => add('col', c)); });
  return { m, n: ids.length };
}
function affinityScore(p, A) {
  if (!A.n) return 0; let s = 0;
  [['fit', p.fit], ['sl', p.sl], ['st', p.st], ['c', p.c]].forEach(([k, v]) => { if (v && A.m[k][v]) s += A.m[k][v] / A.n; });
  (p.col || []).forEach(c => { if (A.m.col[c]) s += .5 * A.m.col[c] / A.n; });
  return s;
}
function affinityTags(A) {
  const t = []; const f = topOf(A.m.fit)[0], c = topOf(A.m.col)[0], sl = topOf(A.m.sl)[0], st = topOf(A.m.st)[0];
  if (f) t.push(FIT_LBL[f[0]]); if (sl) t.push(sl[0]); if (c) t.push(c[0]); if (st && st[0] !== '없음') t.push('신축성 ' + st[0]);
  return A.n ? t : [];
}
/* 홈 맞춤 상품: 나와 가장 비슷한 체형의 유저(키·몸무게·선호 핏 거리)가 잘 맞게 입은 상품. 내 관심 속성이 겹치면 가산 */
function personalProducts(n = 8) {
  const b = S.body; if (!b) return [];
  const sims = Object.entries(DB.U).map(([id, u]) => ({ id, d: Math.abs(u[0] - b.h) / 6 + Math.abs(u[1] - b.w) / 7 + (u[2] === b.pref ? 0 : .4) })).filter(x => x.d <= 2.4);
  const A = styleAffinity(), agg = {};
  sims.forEach(({ id, d }) => (revByUser[id] || []).forEach(r => {
    if (!(r.op === '정사이즈' || r.rt >= 4)) return;
    const a = (agg[r.p] ||= { score: 0, users: new Set(), sizes: {}, ok: 0 });
    a.score += (1 / (1 + d)) * (r.op === '정사이즈' ? 1 : .6) + (r.rt >= 5 ? .1 : 0); a.users.add(id); if (r.op === '정사이즈') a.ok++;
    const sz = r.op === '정사이즈' ? r.sz : r.fs; a.sizes[sz] = (a.sizes[sz] || 0) + 1;
  }));
  return Object.entries(agg).map(([pid, a]) => { const p = prodById[pid]; return p && { p, users: a.users.size, ok: a.ok, size: topOf(a.sizes)[0][0], score: a.score * (1 + affinityScore(p, A)) }; }).filter(Boolean).sort((x, y) => y.score - x.score || x.p.id.localeCompare(y.p.id)).slice(0, n);
}

/* ---------- 가로 스크롤 + 넘김(>) 버튼 ---------- */
const carousel = (id, inner) => `<div class="car" data-car="${id}"><button class="car-b p" data-a="carGo" data-v="${id}|-1" aria-label="이전">${ico('back')}</button><div class="hscroll" id="car-${id}">${inner}</div><button class="car-b n" data-a="carGo" data-v="${id}|1" aria-label="다음">${ico('chev')}</button></div>`;
function autoCar() {
  document.querySelectorAll('.chips.scroll, .initrow, .hscroll, .sizecards, .pslots').forEach(el => {
    if (el.closest('.car') || el.dataset.sc) return;
    const w = document.createElement('div'); w.className = 'car' + (el.classList.contains('hscroll') ? '' : ' sm');
    const id = 'auto' + (++AUTOID); el.dataset.sc = id; el.id = el.id || 'car-' + id; const key = el.id.replace(/^car-/, '');
    const cs = getComputedStyle(el), ps = getComputedStyle(el.parentNode), plp = parseFloat(ps.paddingLeft) || 0, prp = parseFloat(ps.paddingRight) || 0;
    if (!el.classList.contains('hscroll')) { if (plp < 12 && (parseFloat(cs.paddingLeft) || 0) < 12) el.style.paddingLeft = '16px'; w.style.setProperty('--cm', prp >= 12 ? '0px' : '12px'); }
    el.parentNode.insertBefore(w, el);
    w.innerHTML = `<button class="car-b p" data-a="carGo" data-v="${key}|-1" aria-label="이전">${ico('back')}</button><button class="car-b n" data-a="carGo" data-v="${key}|1" aria-label="다음">${ico('chev')}</button>`;
    w.insertBefore(el, w.lastChild);
  });
}
let AUTOID = 0;
function syncCars() { autoCar(); document.querySelectorAll('.car').forEach(c => { const h = c.querySelector('.hscroll, [data-sc]'); if (!h) return; c.classList.toggle('no-p', h.scrollLeft < 4); c.classList.toggle('no-n', h.scrollLeft + h.clientWidth >= h.scrollWidth - 4); }); }
document.addEventListener('scroll', e => { const t = e.target; if (t.classList && (t.classList.contains('hscroll') || t.dataset.sc)) syncCars(); }, true);
/* 마우스 드래그로도 가로 스크롤 */
(() => { let d = null, moved = false;
  document.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; const el = e.target.closest('.hscroll, [data-sc]'); if (!el || e.target.closest('input,select,textarea')) return; d = { el, x: e.clientX, l: el.scrollLeft }; moved = false; });
  document.addEventListener('pointermove', e => { if (!d) return; const dx = e.clientX - d.x; if (Math.abs(dx) > 5) { moved = true; d.el.style.scrollBehavior = 'auto'; d.el.style.scrollSnapType = 'none'; d.el.scrollLeft = d.l - dx; } });
  const end = () => { if (!d) return; const el = d.el; d = null; setTimeout(() => { el.style.scrollBehavior = ''; el.style.scrollSnapType = ''; }, 0); };
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
  document.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
})();
/* 빈 상태: 기본 문구는 "결과 없음", 아래에 다음 행동 버튼 하나. 필드 하나가 비었을 땐 NO_INFO */
const NO_INFO = '정보 없음';
const emptyHTML = (sub = '', btn = '', pad = '') => `<div class="empty" ${pad ? `style="padding:${pad}"` : ''}><b class="en">결과 없음</b>${sub ? `<span class="sm">${sub}</span>` : ''}${btn ? `<div class="mt12">${btn}</div>` : ''}</div>`;
const emptyBtn = (a, label, extra = '') => `<button class="btn s flat" data-a="${a}" ${extra}>${label}</button>`;
