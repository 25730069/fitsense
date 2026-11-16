/* ===== 화면 2: 브랜드(카테고리·브랜드) · 상품 목록 · 브랜드 상세 · 상품 상세 · 후기 · 답글 ===== */
const heartBtn = (kind, id, cls = 'hb') => `<button class="${cls} ${S.likes[kind].includes(id) ? 'on' : ''}" data-a="like" data-k="${kind}" data-v="${esc(id)}" aria-label="관심 ${S.likes[kind].includes(id) ? '해제' : '추가'}">${ico('heart')}</button>`;
ACT.like = t => {
  const arr = S.likes[t.dataset.k], id = t.dataset.v, i = arr.indexOf(id);
  if (i >= 0) arr.splice(i, 1); else arr.unshift(id);
  save(); toast(i >= 0 ? '좋아요를 취소했어요' : '좋아요에 담았어요'); reRender();
};
ACT.back = () => back();
ACT.openBrand = t => { DF = { id: t.dataset.v, cat: '전체', q: '', sort: null, tab: 'prod' }; go('brandDetail', { id: t.dataset.v }); };
ACT.openProduct = t => { openProduct(t.dataset.v); };
const newLF = (sort = 'helpful') => ({ sort, sizes: [], h: null, w: null, op: null, similar: false, kw: [] });
function openProduct(id, tabName = 'info') {
  S.recent = [id, ...S.recent.filter(x => x !== id)].slice(0, 12); save();
  LF = newLF(); go('product', { id, tab: tabName });
}

/* ---------- 상품 카드 · 정렬 · 보기 전환(3열 · 2열 · 리스트) ---------- */
const clamp2 = 'white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden';
const NOPHOTO = p => `<div class="ph"><span>이미지</span>${pimg(p.id)}</div>`;
function pcardHTML(p, v = S.pview) {
  const rs = revByProd[p.id] || [], rec = quickRec(p), ss = simStat(p.id), heart = heartBtn('product', p.id, 'hb');
  if (v === 'list') return `<div class="prow"><button class="prow-b" data-a="openProduct" data-v="${p.id}">${NOPHOTO(p)}<span class="grow" style="min-width:0"><span class="xs mute" style="display:block">${esc(brandById[p.b].n)}</span><b class="sm" style="display:block;line-height:1.35">${esc(p.n)}</b><b class="num" style="display:block;margin-top:2px">${p.pr ? won(p.pr) : NO_INFO}</b><span class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap">${rec ? `<span class="pill dark">내 추천 ${rec}</span>` : ''}${ss ? `<span class="pill ok">비슷한 체형 정사이즈 ${ss.pct}%</span>` : ''}<span class="xs mute">후기 ${rs.length}</span></span></span></button>${heart}</div>`;
  return `<div class="pcard v${v}"><button class="pcard-b" data-a="openProduct" data-v="${p.id}"><span class="pimg">${NOPHOTO(p)}${rec ? `<span class="rb pill dark">내 추천 ${rec}</span>` : ''}</span><span class="bn">${esc(brandById[p.b].n)}</span><span class="nm">${esc(p.n)}</span><span class="pr num">${p.pr ? won(p.pr) : NO_INFO}</span><span class="mt">${ratingLine(p.id)}${ss ? `<span class="okc"> · 정사이즈 ${ss.pct}%</span>` : ''}</span></button>${heart}</div>`;
}
const pgridHTML = (ps, rst = '') => ps.length ? `<div class="${S.pview === 'list' ? 'plist-rows' : 'pgrid v' + S.pview}">${ps.map(p => pcardHTML(p)).join('')}</div>` : emptyHTML('', (rst ? emptyBtn(rst, '필터 초기화') + ' ' : '') + emptyBtn('askOpen', '상품 추가 요청하기', 'data-v="상품"'));
const viewTg = () => `<span class="viewtg" role="group" aria-label="보기 방식">${[['3', '▦', '3열'], ['2', '▥', '2열'], ['list', '☰', '리스트']].map(([k, g, l]) => `<button class="${S.pview === k ? 'on' : ''}" data-a="pView" data-v="${k}" aria-label="${l}">${g}</button>`).join('')}</span>`;
ACT.pView = t => { S.pview = t.dataset.v; save(); const y = $('#view').scrollTop; reRender(); $('#view').scrollTop = y; };
const sortSelect = (cur, c) => `<select class="inp sortsel" data-c="${c}" aria-label="정렬">${SORTS.map(s => `<option ${cur === s ? 'selected' : ''}>${s}</option>`).join('')}</select>`;
const sortHint = s => (!S.body && ['내 핏 맞는 순', '비슷한 체형 만족도순'].includes(s)) ? `<div class="hint" style="padding:0 16px">신체 사이즈를 입력하면 이 정렬을 쓸 수 있어요.</div>` : '';

/* ---------- 브랜드 탭: [카테고리 | 브랜드] × [전체 · 남성 · 여성] ---------- */
let BF = { tab: 'cat', q: '', letter: null, liked: false, sort: 'pop', g: '전체', rail: '전체' };
const INIT = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const initOf = n => { const c = n[0]; if (/[가-힣]/.test(c)) { const k = choOf(c); return { ㄲ: 'ㄱ', ㄸ: 'ㄷ', ㅃ: 'ㅂ', ㅆ: 'ㅅ', ㅉ: 'ㅈ' }[k] || k; } return /[a-z]/i.test(c) ? c.toUpperCase() : '#'; };
const plAttr = o => `data-a="plGo" data-pl="${esc(JSON.stringify(o))}"`;
const gOk = g => BF.g === '전체' || !g || g === '공용' || g === BF.g;
const catsFor = () => BCATS.filter(c => TX.some(t => t.code === CODE_OF[c] && (BF.g === '전체' || t.g === BF.g)));
function subsFor(c) {   // 브랜드 분류표(brands.json)의 소분류 중 상품이 있는 것
  const names = [...new Set(TX.filter(t => t.code === CODE_OF[c] && (BF.g === '전체' || t.g === BF.g)).map(t => t.s))];
  return names.map(n => [n, PR.filter(p => p.c === c && p.sc === n && gOk(p.g)).length]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'));
}
function catSection(c) {
  const ps = PR.filter(p => p.c === c && gOk(p.g)), subs = subsFor(c);
  if (!ps.length) return '';
  return `<section id="sec-${c}" class="csec"><button class="cfold cgo" ${plAttr({ c, g: BF.g === '전체' ? null : BF.g })}><b>${c}</b><span class="cgo-a">›</span></button>
  <div class="cbody"><div class="subgrid">${subs.map(([sc, n]) => `<button class="subtile" ${plAttr({ c, sc, g: BF.g === '전체' ? null : BF.g })}><span class="subic">이미지</span><span class="sn">${esc(sc)}</span></button>`).join('')}</div></div></section>`;
}
function brandCatHTML() {
  const cs = catsFor().filter(c => PR.some(p => p.c === c && gOk(p.g))), rail = cs.includes(BF.rail) ? BF.rail : '전체', all = rail === '전체', list = all ? cs : [rail];
  const total = PR.filter(p => gOk(p.g)).length;
  if (!total) return emptyHTML(`${BF.g} 상품은 아직 없어요`, emptyBtn('askOpen', '상품 추가 요청하기', 'data-v="상품"'), '40px 16px');
  return `<div class="catwrap"><nav class="rail" aria-label="카테고리">${['전체', ...cs].map(c => `<button class="${rail === c ? 'on' : ''}" data-a="railGo" data-v="${c}">${c}</button>`).join('')}</nav><div class="catmain">${all ? `<button class="btn full flat s" ${plAttr({ g: BF.g === '전체' ? null : BF.g })} style="margin-bottom:6px">전체 상품 보기 ›</button>` : ''}${list.map(catSection).join('')}</div></div>`;
}
const brandItems = () => {
  let items = BR.filter(x => (BF.g === '전체' || x.g.includes(BF.g)) && (!BF.liked || S.likes.brand.includes(String(x.id))) && (!BF.letter || initOf(x.n) === BF.letter));
  return BF.sort === 'abc' ? items.sort((x, y) => x.n.localeCompare(y.n, 'ko')) : items.sort((x, y) => brandStat(y.id).rv - brandStat(x.id).rv || x.n.localeCompare(y.n, 'ko'));
};
function brandListHTML() {
  const items = brandItems(), have = new Set(BR.map(x => initOf(x.n)));
  const idx = `<div class="initrow" role="group" aria-label="초성"><button class="${!BF.letter && !BF.liked ? 'on' : ''}" data-a="bcLetter" data-v="">전체</button><button class="${BF.liked ? 'on' : ''}" data-a="bcLiked" aria-label="찜한 브랜드">♡</button>${INIT.map(l => `<button class="${BF.letter === l ? 'on' : ''}" data-a="bcLetter" data-v="${l}" ${have.has(l) ? '' : 'disabled'}>${l}</button>`).join('')}</div>`;
  let last = '', rows = '';
  items.forEach(x => {
    const ini = initOf(x.n), st = brandStat(x.id), sim = similarBrandPct(x.id, S.body), tn = brandTend(x.id);
    if (BF.sort === 'abc' && ini !== last) { rows += `<div class="ihead">${ini}</div>`; last = ini; }
    rows += `<div class="brand-row" style="padding:12px 8px 12px 16px;border-bottom:1px solid var(--line)"><button class="row grow" style="background:none;border:0;text-align:left;padding:0;gap:12px;min-width:0" data-a="openBrand" data-v="${x.id}"><span class="logo im">이미지</span><span class="grow" style="min-width:0"><b>${esc(x.n)}</b> <span class="xs mute">${esc(x.en)}</span><span class="row" style="gap:6px;margin-top:4px;flex-wrap:wrap">${st.rv ? `<span class="pill ok">${sim ? '체형 일치' : '정사이즈'} ${sim ? sim.pct : st.pct}%</span>` : `<span class="pill gray">${NO_INFO}</span>`}<span class="pill ${tn.cls}">${tn.label}</span></span></span></button>${heartBtn('brand', String(x.id), 'ib heart')}</div>`;
  });
  return `${idx}<div class="row between" style="padding:10px 16px 4px"><span class="sm mute">브랜드 ${items.length}개</span><button class="sorttg" data-a="bSort" aria-label="정렬 바꾸기">${BF.sort === 'pop' ? '인기순' : '가나다순'} ⇅</button></div>${rows || emptyHTML('', emptyBtn('bfReset', '필터 초기화') + ' ' + emptyBtn('askOpen', '추가 요청하기', 'data-v="브랜드"'))}`;
}
function brandSearchHTML() {
  const q = BF.q.trim(), bs = BR.filter(b => findIn(b.n, q) || findIn(b.en, q)), ps = PR.filter(p => findIn(p.n, q) || findIn(p.sc || '', q));
  return `<div class="sec" style="padding-top:12px"><div class="sec-h"><h3>브랜드 ${bs.length}</h3></div></div>${bs.length ? `<div class="list">${bs.map(b => `<button class="brand-row" data-a="openBrand" data-v="${b.id}"><span class="logo im">이미지</span><span class="grow"><b>${hl(b.n, q)}</b> <span class="xs mute">${esc(b.en)}</span></span><span class="chev">${ico('chev', 'ico')}</span></button>`).join('')}</div>` : emptyHTML('', emptyBtn('askOpen', '브랜드 추가 요청하기', `data-v="브랜드|${esc(q)}"`), '20px 16px')}
  <div class="sec" style="padding-top:12px"><div class="sec-h"><h3>상품 ${ps.length}</h3>${ps.length > 6 ? `<button class="link" ${plAttr({ q })}>전체 보기 ›</button>` : ''}</div></div>${pgridHTML(sortProducts(ps).slice(0, 9))}`;
}
const brandContent = () => BF.q.trim() ? brandSearchHTML() : BF.tab === 'cat' ? brandCatHTML() : brandListHTML();
V.brand = () => `<div class="tabs t0">${[['cat', '카테고리'], ['brand', '브랜드']].map(([k, l]) => `<button class="${BF.tab === k ? 'on' : ''}" data-a="btab" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="sub3" role="tablist" aria-label="성별">${['전체', '남성', '여성'].map(g => `<button role="tab" aria-selected="${BF.g === g}" class="${BF.g === g ? 'on' : ''}" data-a="bGender" data-v="${g}">${g}</button>`).join('')}</div>
  <div class="pad" style="padding:0 16px 8px"><div class="search"><input id="bq" class="inp" data-i="bq" value="${esc(BF.q)}" placeholder="브랜드·상품 검색 (초성 가능)" autocomplete="off">${ico('search')}</div></div>
  <div id="bcontent">${brandContent()}</div><div style="height:20px"></div>`;
INP.bq = t => { BF.q = t.value; $('#bcontent').innerHTML = brandContent(); syncCars(); };
ACT.btab = t => { BF.tab = t.dataset.v; BF.q = ''; reRender(); $('#view').scrollTop = 0; };
ACT.bGender = t => { BF.g = t.dataset.v; BF.letter = null; reRender(); };
ACT.railGo = t => { BF.rail = t.dataset.v; reRender(); $('#view').scrollTop = 0; };
ACT.bcLiked = () => { BF.liked = !BF.liked; BF.letter = null; reRender(); };
ACT.bcLetter = t => { BF.letter = t.dataset.v || null; BF.liked = false; reRender(); };
ACT.bSort = () => { BF.sort = BF.sort === 'pop' ? 'abc' : 'pop'; reRender(); };
ACT.bfReset = () => { BF = { ...BF, letter: null, liked: false, q: '', g: '전체' }; reRender(); };

/* ---------- 상품 목록(카테고리·핏·소매·신축성·컬러·브랜드 필터) ---------- */
const newPL = (o = {}) => ({ c: null, sc: null, g: null, fit: [], sl: [], st: [], col: [], b: [], q: '', sort: null, ...o });
let PL = newPL(), PLt = null;
ACT.plGo = t => { PL = newPL(JSON.parse(t.dataset.pl || '{}')); go('plist'); };
function plFilter(f = PL) {
  return sortProducts(PR.filter(p => (!f.c || p.c === f.c) && (!f.sc || p.sc === f.sc) && (!f.g || !p.g || p.g === '공용' || p.g === f.g) && (!f.fit.length || f.fit.includes(p.fit)) && (!f.sl.length || f.sl.includes(p.sl)) && (!f.st.length || f.st.includes(p.st)) && (!f.col.length || (p.col || []).some(c => f.col.includes(c))) && (!f.b.length || f.b.includes(p.b)) && (!f.q.trim() || findIn(p.n, f.q) || findIn(p.sc || '', f.q) || findIn(brandById[p.b].n, f.q))), f.sort);
}
const plActive = () => [...(PL.g ? [['g', PL.g, PL.g]] : []), ...(PL.c ? [['c', PL.c, PL.c]] : []), ...(PL.sc ? [['sc', PL.sc, PL.sc]] : []), ...PL.fit.map(v => ['fit', v, FIT_LBL[v]]), ...PL.sl.map(v => ['sl', v, v]), ...PL.st.map(v => ['st', v, '신축성 ' + v]), ...PL.col.map(v => ['col', v, v]), ...PL.b.map(v => ['b', v, brandById[v].n])];
V.plist = () => {
  const ps = plFilter(), af = plActive();
  return `${topbar(PL.sc || PL.c || '전체 상품')}
  <div class="pad" style="padding-bottom:8px"><div class="search"><input id="plq" class="inp" data-i="plq" value="${esc(PL.q)}" placeholder="상품·브랜드 검색" autocomplete="off">${ico('search')}</div></div>
  <div class="selrow2" style="padding:0 0 2px"><div class="chips scroll" id="plchips"><button class="chip ${af.length ? 'on' : ''}" data-a="plOpen" style="flex:none">필터${af.length ? ' ' + af.length : ''} ▾</button>${af.map(([k, v, l]) => `<button class="chip sel x" style="flex:none" data-a="plRm" data-k="${k}" data-v="${esc(v)}" aria-label="${esc(l)} 해제">${k === 'col' ? cdot(v) : ''}${esc(l)}</button>`).join('')}${af.length ? `<button class="chip" style="flex:none;border-style:dashed" data-a="plClear">전체 해제</button>` : ''}</div></div>
  <div class="row between" style="padding:8px 16px"><span class="sm mute" id="plcnt">${ps.length}개</span><span class="row" style="gap:8px">${sortSelect(PL.sort || defSort(), 'plSort')}${viewTg()}</span></div>${sortHint(PL.sort || defSort())}
  <div id="plgrid">${pgridHTML(ps, 'plClear')}</div>`;
};
INP.plq = t => { PL.q = t.value; const ps = plFilter(); $('#plgrid').innerHTML = pgridHTML(ps, 'plClear'); $('#plcnt').textContent = ps.length + '개'; };
CHG.plSort = t => { PL.sort = t.value; reRender(); };
ACT.plRm = t => { const k = t.dataset.k, v = t.dataset.v; if (k === 'g') PL.g = null; else if (k === 'c') { PL.c = null; PL.sc = null; } else if (k === 'sc') PL.sc = null; else if (k === 'b') PL.b = PL.b.filter(x => String(x) !== v); else PL[k] = PL[k].filter(x => x !== v); reRender(); };
ACT.plOpen = () => { PLt = JSON.parse(JSON.stringify(PL)); plSheet(); };
function plSheet() {
  const n = plFilter(PLt).length, ch = (arr, cur, k, lab = x => x) => arr.map(x => `<button class="chip ${(Array.isArray(cur) ? cur.map(String).includes(String(x)) : cur === x) ? 'on' : ''}" data-a="plT" data-k="${k}" data-v="${esc(x)}">${esc(lab(x))}</button>`).join('');
  const grp = (title, body) => `<div class="field"><label class="f">${title}</label><div class="chips">${body}</div></div>`;
  const cols = Object.keys(COLOR_HEX).map(c => `<button class="chip cchip ${PLt.col.includes(c) ? 'on' : ''}" data-a="plT" data-k="col" data-v="${c}">${cdot(c)}${c}</button>`).join('');
  sheet(`<h3>상품 필터</h3><div class="mt16">${grp('카테고리', ch(BCATS, PLt.c, 'c'))}${PLt.c ? grp('세부 카테고리', ch(SUBS[PLt.c].map(x => x[0]), PLt.sc, 'sc')) : ''}${grp('핏', ch(['슬림', '레귤러', '오버'], PLt.fit, 'fit', x => FIT_LBL[x]))}${grp('소매', ch(['민소매', '반소매', '긴소매'], PLt.sl, 'sl'))}${grp('신축성', ch(['없음', '약간', '좋음'], PLt.st, 'st'))}${grp('컬러', cols)}${grp('브랜드', ch(BR.map(b => b.id), PLt.b, 'b', id => brandById[id].n))}</div>
  <div class="row mt16"><button class="btn flat" data-a="plReset" style="width:96px">초기화</button><button class="btn pri grow" data-a="plApply">${n}개 보기</button></div>`);
}
ACT.plT = t => {
  const k = t.dataset.k, v = t.dataset.v;
  if (k === 'c') { PLt.c = PLt.c === v ? null : v; PLt.sc = null; } else if (k === 'sc') PLt.sc = PLt.sc === v ? null : v;
  else if (k === 'b') { const id = +v; PLt.b = PLt.b.includes(id) ? PLt.b.filter(x => x !== id) : [...PLt.b, id]; }
  else PLt[k] = PLt[k].includes(v) ? PLt[k].filter(x => x !== v) : [...PLt[k], v];
  const sc = $('#scrim .sheet'), y = sc ? sc.scrollTop : 0; plSheet(); const s2 = $('#scrim .sheet'); if (s2) s2.scrollTop = y;
};
ACT.plReset = () => { PLt = newPL({ q: PL.q, sort: PL.sort }); plSheet(); };
ACT.plClear = () => { PL = newPL({ sort: PL.sort }); reRender(); };
ACT.plApply = () => { PL = PLt; closeSheet(); reRender(); };

/* ---------- 브랜드 상세(헤더 · 3버튼 · 탭: 상품 / 사이즈 경향 / 후기) ---------- */
let DF = { id: 1, cat: '전체', q: '', sort: null, tab: 'prod' };
function dfProducts() { return sortProducts(PR.filter(p => p.b === DF.id && (DF.cat === '전체' || p.c === DF.cat) && (!DF.q.trim() || findIn(p.n, DF.q) || findIn(p.sc || '', DF.q))), DF.sort); }
const kfmt = n => n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + '천' : String(n);
V.brandDetail = p => {
  const b = brandById[p.id], st = brandStat(b.id), tn = brandTend(b.id), host = (b.site || '').replace(/^https?:\/\/(www\d?\.)?/, '').replace(/\/.*$/, ''), liked = S.likes.brand.includes(String(b.id));
  const hc = 120 + hash('bl' + b.id) % 880 + (liked ? 1 : 0);
  const head = `${topbar('', { right: heartBtn('brand', String(b.id), 'ib heart') })}
  <div class="hd1"><div class="en">${esc(b.en)}</div><h1>${esc(b.n)}</h1><div class="row" style="gap:6px;flex-wrap:wrap">${st.rv ? `<span class="pill ${tn.cls}">${tn.label}</span><span class="pill gray">정사이즈 ${st.pct}%</span>` : `<span class="pill gray">${NO_INFO}</span>`}<span class="pill gray">상품 ${st.n}</span><span class="pill gray">후기 ${st.rv}</span></div></div>
  <div class="btn3"><button class="btn flat" data-a="like" data-k="brand" data-v="${b.id}"><span class="heart ${liked ? 'on' : ''}">${ico('heart')}</span> ${kfmt(hc)}</button>${b.site ? `<a class="btn flat" href="${esc(b.site)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">공식 사이트 ↗</a>` : `<button class="btn flat" disabled>${NO_INFO}</button>`}<button class="btn flat" data-a="dfTab" data-v="tend">사이즈 경향</button></div>
  <div class="tabs t0">${[['prod', '상품'], ['tend', '사이즈 경향'], ['rev', '후기']].map(([k, l]) => `<button class="${DF.tab === k ? 'on' : ''}" data-a="dfTab" data-v="${k}">${l}</button>`).join('')}</div>`;
  let body = '';
  if (DF.tab === 'tend') {
    body = `<div class="pad"><div class="card" style="padding:14px"><div class="row between"><b>사이즈 경향</b><span class="pill ${tn.cls}">${tn.label}</span></div>${st.rv ? `
    <div class="tbar mt8"><i style="width:${tn.sm}%;background:var(--tight)"></i><i style="width:${tn.ok}%;background:var(--ok)"></i><i style="width:${tn.bg}%;background:var(--loose)"></i></div>
    <div class="row between xs mt8" style="margin-top:6px"><span style="color:var(--tight)">작은 편 ${tn.sm}%</span><span style="color:var(--ok)">정사이즈 ${tn.ok}%</span><span style="color:var(--loose)">큰 편 ${tn.bg}%</span></div>
    <div class="chips mt12" style="gap:6px">${BCATS.filter(c => PR.some(q => q.b === b.id && q.c === c)).map(c => { const t = brandTend(b.id, c); return `<span class="pill ${t.cls}">${c} ${t.label.replace('나오는 편', '').replace('경향', '')}</span>`; }).join('')}</div>
    <p class="hint">이 브랜드 상품에 달린 사이즈 후기 ${st.rv}건 기준이에요.</p>` : `<p class="sm mute" style="margin:10px 0 0">${NO_INFO}</p>`}</div></div>`;
  } else if (DF.tab === 'rev') {
    const rs = PR.filter(q => q.b === b.id).flatMap(q => revByProd[q.id] || []).sort((x, y) => (y.d || '').localeCompare(x.d || '')).slice(0, 30);
    body = rs.length ? rs.map(reviewCard).join('') : emptyHTML('아직 후기가 없어요');
  } else {
    body = `<div style="padding:10px 16px 0"><div class="search"><input id="pq" class="inp" data-i="pq" value="${esc(DF.q)}" placeholder="이 브랜드 상품 검색" autocomplete="off">${ico('search')}</div></div>
    <div style="padding-top:10px"><div class="chips scroll">${chipsHTML(['전체', ...BCATS.filter(c => PR.some(q => q.b === b.id && q.c === c))], DF.cat, 'dfCat')}</div></div>
    <div class="row between" style="padding:8px 16px"><span class="sm mute" id="dfcnt">${dfProducts().length}개</span><span class="row" style="gap:8px">${sortSelect(DF.sort || defSort(), 'dfSort')}${viewTg()}</span></div>${sortHint(DF.sort || defSort())}
    <div id="pgrid">${pgridHTML(dfProducts(), 'dfClear')}</div>`;
  }
  return head + body + '<div style="height:20px"></div>';
};
ACT.dfTab = t => { DF.tab = t.dataset.v; reRender(); };
INP.pq = t => { DF.q = t.value; const ps = dfProducts(); $('#pgrid').innerHTML = pgridHTML(ps, 'dfClear'); $('#dfcnt').textContent = ps.length + '개'; };
ACT.dfClear = () => { DF = { ...DF, cat: '전체', q: '', sort: null }; reRender(); };
ACT.dfCat = t => { DF.cat = t.dataset.v; reRender(); };
CHG.dfSort = t => { DF.sort = t.value; reRender(); };
/* ---------- 후기 목록 · 필터 ---------- */
let LF = newLF();
const HR = [['~155', 0, 155], ['155~160', 155, 160], ['160~165', 160, 165], ['165~', 165, 999]], WR = [['~45kg', 0, 45], ['45~50kg', 45, 50], ['50~55kg', 50, 55], ['55kg~', 55, 999]];
const OPCLS = { '작은 편': 'tight', '정사이즈': 'ok', '큰 편': 'loose' }, FDCLS = { '타이트': 'tight', '적당': 'ok', '여유': 'loose', '짧은 편': 'short', '긴 편': 'long' };
const helpN = r => helpfulBase(r) + (S.helpful[r.id] ? 1 : 0), likeN = r => likeBase(r) + (S.likes.review.includes(r.id) ? 1 : 0);
function filterReviews(pid) {
  let rs = (revByProd[pid] || []).slice(); const U = r => DB.U[r.u];
  if (LF.sizes.length) rs = rs.filter(r => LF.sizes.includes(r.sz));
  if (LF.h) { const x = HR.find(a => a[0] === LF.h); rs = rs.filter(r => U(r)[0] >= x[1] && U(r)[0] < x[2]); }
  if (LF.w) { const x = WR.find(a => a[0] === LF.w); rs = rs.filter(r => U(r)[1] >= x[1] && U(r)[1] < x[2]); }
  if (LF.op) rs = rs.filter(r => r.op === LF.op);
  if (LF.kw.length) rs = rs.filter(r => LF.kw.every(k => kwOf(r).includes(k)));
  if (LF.similar && S.body) rs = rs.filter(r => Math.abs(U(r)[0] - S.body.h) <= 6 && Math.abs(U(r)[1] - S.body.w) <= 7);
  const s = { helpful: (a, b) => helpN(b) - helpN(a), recent: (a, b) => (b.d || '').localeCompare(a.d || ''), high: (a, b) => b.rt - a.rt, low: (a, b) => a.rt - b.rt }[LF.sort];
  return rs.sort(s);
}
const activeFilters = () => [...LF.sizes.map(s => ['sizes', s, '구매 ' + s]), ...(LF.h ? [['h', LF.h, '키 ' + LF.h]] : []), ...(LF.w ? [['w', LF.w, '몸무게 ' + LF.w]] : []), ...(LF.op ? [['op', LF.op, LF.op]] : []), ...LF.kw.map(k => ['kw', k, '#' + k]), ...(LF.similar ? [['similar', 1, '내 체형 후기']] : [])];
const kwTop = (rs, n = 10) => topOf(rs.flatMap(kwOf).reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {})).slice(0, n);
const repN = r => repliesOf(r).length;
function reviewCard(r) {
  const u = DB.U[r.u], helped = !!S.helpful[r.id], liked = S.likes.review.includes(r.id);
  return `<div class="rv" role="button" tabindex="0" data-a="openReview" data-v="${r.id}">
  <div class="row between"><span class="row" style="gap:8px;min-width:0"><span class="avatar sm">이미지</span><span style="min-width:0"><b class="sm">${esc(nickOfU(r.u))}</b> <span class="xs mute">${uidOf(r.u)}</span><span class="xs mute" style="display:block">${r.d || NO_INFO}${r.real ? '<span class="tag-real">실제 후기</span>' : ''}</span></span></span>${stars(r.rt)}</div>
  <div class="sm mt8" style="margin-top:6px"><b>키 ${u[0]}cm · ${u[1]}kg</b> <span class="mute">· 구매 ${r.sz} → 추천 ${r.fs}</span></div>
  <div class="chips mt8" style="margin-top:6px"><span class="pill ${OPCLS[r.op]}">${r.op}</span>${r.fd ? Object.entries(r.fd).slice(0, 3).map(([k, v]) => `<span class="pill ${FDCLS[v]}">${k} ${v}</span>`).join('') : ''}</div>
  <div class="kws">${kwOf(r).slice(0, 4).map(k => `<span class="kw">#${esc(k)}</span>`).join('')}</div>
  <div class="txt">${esc(r.t)}</div>
  <div class="row" style="gap:8px"><button class="act heart ${liked ? 'on' : ''}" data-a="like" data-k="review" data-v="${r.id}">${ico('heart')}${likeN(r)}</button><span class="act" style="pointer-events:none">${ico('chat')}답글 ${repN(r)}</span></div></div>`;
}
function reviewBlock(pid) {
  const all = revByProd[pid] || [], rs = filterReviews(pid), n = all.length, avg = n ? all.reduce((a, r) => a + r.rt, 0) / n : 0;
  const d = o => n ? Math.round(all.filter(r => r.op === o).length / n * 100) : 0, af = activeFilters(), kt = kwTop(all, 8);
  return `<div class="pad"><div class="row" style="gap:18px"><div style="text-align:center"><div style="font-size:30px;font-weight:800">${n ? avg.toFixed(1) : '–'}</div>${stars(Math.round(avg))}<div class="xs mute">후기 ${n}건</div></div>
  <div class="grow">${['작은 편', '정사이즈', '큰 편'].map(o => `<div class="row" style="gap:8px;margin:3px 0"><span class="xs" style="width:48px">${o}</span><div class="bar"><i style="width:${d(o)}%"></i></div><span class="xs num mute" style="width:32px;text-align:right">${d(o)}%</span></div>`).join('')}</div></div>
  ${kt.length ? `<div class="sublabel" style="margin-top:14px">자주 나온 키워드</div><div class="chips">${kt.map(([k, c]) => `<button class="chip kwc ${LF.kw.includes(k) ? 'on' : ''}" data-a="rvKw" data-v="${esc(k)}">#${esc(k)} <span class="mute">${c}</span></button>`).join('')}</div>` : ''}</div>
  <div style="padding:0 16px 10px;border-bottom:1px solid var(--line)"><div class="chips scroll"><button class="chip ${af.length ? 'on' : ''}" data-a="openFilter">필터${af.length ? ' ' + af.length : ''} ▾</button>${af.map(([k, v, l]) => `<button class="chip x" data-a="rmFilter" data-k="${k}" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>
  <div class="chips scroll mt8" style="margin-top:8px">${[['helpful', '도움순'], ['recent', '최신순'], ['high', '별점 높은순'], ['low', '별점 낮은순']].map(([k, l]) => `<button class="chip ${LF.sort === k ? 'on' : ''}" data-a="rvSort" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="xs mute mt8" style="margin-top:8px">${rs.length}건 ${af.length ? `(전체 ${n}건 중)` : ''}</div></div>
  ${rs.length ? rs.map(reviewCard).join('') : emptyHTML('', emptyBtn('rvReset', '필터 초기화'))}`;
}
ACT.helpful = t => { const id = t.dataset.v; if (S.helpful[id]) delete S.helpful[id]; else S.helpful[id] = 1; save(); reRender(); };
ACT.rvSort = t => { LF.sort = t.dataset.v; reRender(); };
ACT.rvReset = () => { LF = newLF(LF.sort); reRender(); };
ACT.rvKw = t => { const k = t.dataset.v; LF.kw = LF.kw.includes(k) ? LF.kw.filter(x => x !== k) : [...LF.kw, k]; reRender(); };
ACT.rmFilter = t => { const k = t.dataset.k, v = t.dataset.v; if (k === 'sizes') LF.sizes = LF.sizes.filter(x => x !== v); else if (k === 'kw') LF.kw = LF.kw.filter(x => x !== v); else if (k === 'similar') LF.similar = false; else LF[k] = null; reRender(); };
let LFt = null;
ACT.openFilter = () => { LFt = JSON.parse(JSON.stringify(LF)); filterSheet(); };
function filterSheet() {
  const pid = stack.at(-1).p.id, keep = LF; LF = LFt; const n = filterReviews(pid).length; LF = keep;
  const grp = (title, body) => `<div class="field"><label class="f">${title}</label><div class="chips">${body}</div></div>`;
  const ch = (arr, cur, k) => arr.map(x => `<button class="chip ${(Array.isArray(cur) ? cur.includes(x) : cur === x) ? 'on' : ''}" data-a="fT" data-k="${k}" data-v="${esc(x)}">${esc(x)}</button>`).join('');
  const kt = kwTop(revByProd[pid] || [], 16).map(x => x[0]);
  sheet(`<h3>후기 필터</h3><div class="mt16">${grp('구매 사이즈', ch(SZ, LFt.sizes, 'sizes'))}${grp('키', ch(HR.map(a => a[0]), LFt.h, 'h'))}${grp('몸무게', ch(WR.map(a => a[0]), LFt.w, 'w'))}${grp('사이즈감', ch(['작은 편', '정사이즈', '큰 편'], LFt.op, 'op'))}${kt.length ? grp('키워드', ch(kt, LFt.kw, 'kw')) : ''}
  <div class="row between card fill" style="padding:12px 14px"><div><b class="sm">내 체형과 비슷한 후기만</b><div class="xs mute">${S.body ? `키 ±6cm · 몸무게 ±7kg (${S.body.h}cm·${S.body.w}kg)` : '신체 사이즈를 입력하면 쓸 수 있어요'}</div></div><button class="sw ${LFt.similar ? 'on' : ''}" data-a="fT" data-k="similar" data-v="1" role="switch" aria-checked="${LFt.similar}" aria-label="내 체형 후기만" ${S.body ? '' : 'disabled'}></button></div></div>
  <div class="row mt16"><button class="btn flat" data-a="fReset" style="width:96px">초기화</button><button class="btn pri grow" data-a="fApply">${n}건 보기</button></div>`);
}
ACT.fT = t => { const k = t.dataset.k, v = t.dataset.v; if (k === 'sizes' || k === 'kw') LFt[k] = LFt[k].includes(v) ? LFt[k].filter(x => x !== v) : [...LFt[k], v]; else if (k === 'similar') LFt.similar = !LFt.similar; else LFt[k] = LFt[k] === v ? null : v; const sc = $('#scrim .sheet'), y = sc ? sc.scrollTop : 0; filterSheet(); const s2 = $('#scrim .sheet'); if (s2) s2.scrollTop = y; };
ACT.fReset = () => { LFt = newLF(LF.sort); filterSheet(); };
ACT.fApply = () => { LF = LFt; closeSheet(); reRender(); };

/* ---------- 상품 상세: 속성은 모두 눌러서 같은 속성의 상품 목록으로 ---------- */
const officialUrl = (pr, b) => pr.url || b.site || '';
V.product = p => {
  const pr = prodById[p.id], b = brandById[pr.b], rs = revByProd[pr.id] || [], rec = quickRec(pr), tabName = p.tab;
  let body = '';
  const lk = (label, o, pre = '') => `<button class="chip lk" ${plAttr(o)}>${pre}${esc(label)}</button>`;
  if (tabName === 'info') {
    const rows = [
      ['브랜드', `<button class="chip lk" data-a="openBrand" data-v="${b.id}">${esc(b.n)}</button>`],
      ['카테고리', lk(pr.c, { c: pr.c }) + (pr.sc ? lk(pr.sc, { c: pr.c, sc: pr.sc }) : '')],
      ['핏', pr.fit ? lk(FIT_LBL[pr.fit], { c: pr.c, fit: [pr.fit] }) : '<span class="sm mute">${NO_INFO}</span>'],
      ['소매', pr.sl ? lk(pr.sl, { c: pr.c, sl: [pr.sl] }) : '<span class="sm mute">${NO_INFO}</span>'],
      ['신축성', pr.st ? lk('신축성 ' + pr.st, { c: pr.c, st: [pr.st] }) : '<span class="sm mute">${NO_INFO}</span>'],
      ['컬러', (pr.col || []).map(c => lk(c, { c: pr.c, col: [c] }, cdot(c))).join('') || '<span class="sm mute">${NO_INFO}</span>']
    ];
    const kt = kwTop(rs, 8);
    body = `<div class="pad"><div class="list card">${rows.map(([k, v]) => `<div class="li" style="padding:11px 14px;align-items:flex-start"><span class="mute sm" style="width:60px;padding-top:6px">${k}</span><span class="chips grow">${v}</span></div>`).join('')}${pr.len ? `<div class="li" style="padding:11px 14px"><span class="mute sm" style="width:60px">설계 총장</span><span class="sm">${pr.len}cm (M, 키 160 기준)</span></div>` : ''}</div>
    <p class="hint">칩을 누르면 같은 ${esc(pr.c)} 중에서 그 속성을 가진 상품만 모아 볼 수 있어요.</p>
    ${kt.length ? `<div class="mt16"><b>후기에서 자주 나온 키워드</b><div class="chips mt8">${kt.map(([k, c]) => `<button class="chip kwc" data-a="kwGo" data-v="${esc(k)}">#${esc(k)} <span class="mute">${c}</span></button>`).join('')}</div></div>` : ''}
    ${rec ? `<div class="card fill pad mt16" style="padding:14px"><div class="sm mute">내 체형(${S.body.h}cm·${S.body.w}kg) 기준</div><div class="row between mt8" style="margin-top:4px"><b style="font-size:20px">추천 ${rec}</b><button class="btn s pri" data-a="measureWith" data-v="${pr.id}">정밀 측정</button></div></div>` : `<div class="card fill pad mt16 sm" style="padding:14px">${pr.ch ? '신체 사이즈를 입력하면 추천 사이즈를 보여드려요.' : '이 상품은 사이즈표가 없어 추천을 계산할 수 없어요.'}</div>`}</div>`;
  } else if (tabName === 'chart') {
    if (!pr.ch) body = `<div class="empty"><b class="en">${NO_INFO}</b><span class="sm">사이즈표 데이터가 없는 상품이에요</span></div>`;
    else { const parts = PARTS[pr.c].filter(k => Object.values(pr.ch).some(v => v[k] != null)), bv = bodyVals(S.body);
      body = `<div class="pad"><div class="mdwrap">${measureSVG(pr.c)}<p class="xs mute" style="text-align:center;margin:2px 0 10px">표의 번호는 그림의 부위와 같아요</p></div><div class="tbl-wrap"><table class="t"><thead><tr><th>(cm)</th><th>마이핏</th>${pr.sz.map(s => `<th class="${s === rec ? 'hl' : ''}">${s}${s === rec ? ' ★' : ''}</th>`).join('')}</tr></thead><tbody>${partsByNum(pr.c).filter(k => parts.includes(k)).map(k => `<tr><td>${nbTag(pr.c, k)}${k}</td><td class="mute">${k === '총장' ? '–' : bv[k]}${bv.est[k] && k !== '총장' ? '*' : ''}</td>${pr.sz.map(s => `<td class="${s === rec ? 'hl' : ''}">${pr.ch[s][k] ?? '–'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <p class="hint">가슴·허리·힙·허벅지는 둘레, 어깨·소매·총장은 길이예요. * 표시는 키·몸무게로 추정한 마이핏 치수예요. ★는 내 추천 사이즈예요.</p></div>`; }
  } else body = reviewBlock(pr.id);
  const off = officialUrl(pr, b);
  return `${topbar(pr.n, { left: 'close', right: heartBtn('product', pr.id, 'ib heart') })}
  <div class="ph" style="height:230px;border-radius:0;border-left:0;border-right:0"><span>이미지</span>${pimg(pr.id)}</div>
  <div class="pad" style="padding-bottom:12px"><button class="link" data-a="openBrand" data-v="${b.id}" style="text-decoration:none">${esc(b.n)} ›</button><div class="b" style="font-size:17px;line-height:1.4">${esc(pr.n)}${pr.real ? '<span class="tag-real">실제 상품</span>' : ''}</div><div class="num b" style="font-size:18px;margin-top:2px">${won(pr.pr)}</div>
  ${off ? `<a class="btn full flat mt12" href="${esc(off)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;justify-content:space-between"><span>공식 사이트에서 보기</span><span class="mute sm">↗</span></a>${pr.url ? '' : '<div class="xs mute" style="margin-top:4px">상품 직접 링크(product_url)가 없어 브랜드 공식 사이트로 연결돼요</div>'}` : ''}</div>
  <div class="tabs">${[['info', '상품 정보'], ['chart', '사이즈표'], ['review', `사이즈 후기 ${rs.length}`]].map(([k, l]) => `<button class="${tabName === k ? 'on' : ''}" data-a="pTab" data-v="${k}">${l}</button>`).join('')}</div>
  <div id="ptab">${body}</div><div style="height:20px"></div>`;
};
ACT.pTab = t => { stack.at(-1).p.tab = t.dataset.v; const y = $('#view').scrollTop; render(); $('#view').scrollTop = Math.max(y, 0); };
ACT.kwGo = t => { LF = newLF(); LF.kw = [t.dataset.v]; stack.at(-1).p.tab = 'review'; render(); $('#view').scrollTop = 0; };
ACT.measureWith = t => { const pr = prodById[t.dataset.v]; M = newM(S.body ? 2 : 1); M.cat = pr.c; M.brandId = pr.b; M.brandText = brandById[pr.b].n; M.productId = pr.id; M.size = 'M'; fillFromProduct(); M.open = true; loadBD(); stack = [{ v: 'home', p: {} }, { v: 'measure', p: {} }]; render(); $('#view').scrollTop = 0; };

/* ---------- 후기 상세 + 답글 ---------- */
const REPLY_POOL = ['저도 키 163에 53kg인데 M 입었는데 딱 맞았어요!', '혹시 세탁 후에 줄어드는 편인가요?', '사진 참고했는데 어깨선이 정말 비슷하네요. 도움 됐어요 :)', '저는 한 치수 업했는데 여유 있게 입기 좋았어요.', '기장은 어느 정도인가요? 160 정도인데 고민 중이에요.', '허리가 남는다는 말씀이 참고됐어요. 감사합니다!', '같은 제품 블랙 입어봤는데 비침 거의 없었어요.', '정사이즈로 가도 될까요? 슬림핏 선호하는 편이에요.'];
function repliesOf(r) {   // 더미 답글(후기마다 0~3개) + 내가 쓴 답글
  const n = hash(r.id + 'rp') % 4, out = [];
  for (let i = 0; i < n; i++) { const h = hash(r.id + 'r' + i); out.push({ id: r.id + '-d' + i, name: nickOfU(r.id + 'r' + i), uid: uidOf(r.id + 'r' + i), h: 152 + h % 28, w: 42 + (h >> 3) % 24, text: REPLY_POOL[(h + i * 3) % REPLY_POOL.length], date: '2026.11.0' + (1 + h % 8) }); }
  return [...out, ...(S.replies[r.id] || [])].filter(x => !S.hiddenReplies.includes(x.id));
}
let RP = '';
const replyHTML = x => `<div class="rp"><span class="avatar sm">이미지</span><div class="grow"><div class="row" style="gap:6px;flex-wrap:wrap"><b class="sm">${esc(x.name)}</b><span class="xs mute">${esc(x.uid || '')}</span>${x.mine ? '<span class="pill dark">내 답글</span>' : ''}${x.h ? `<span class="xs mute">키 ${x.h} · ${x.w}kg</span>` : ''}<span class="xs mute">${x.date}</span></div><p class="sm" style="margin:2px 0 4px;white-space:pre-wrap">${esc(x.text)}</p>${x.mine ? `<button class="link xs" data-a="rpDel" data-v="${x.id}">삭제</button>` : `<button class="link xs" data-a="rpReport" data-v="${x.id}">신고</button>`}</div></div>`;
V.review = p => {
  const r = RV.find(x => x.id === p.id), pr = prodById[r.p], u = DB.U[r.u], me = S.body, liked = S.likes.review.includes(r.id), helped = !!S.helpful[r.id], rps = repliesOf(r);
  const dh = me ? u[0] - me.h : null, dw = me ? u[1] - me.w : null;
  return `${topbar('사이즈 후기')}
  <div class="pad"><button class="card li" style="width:100%" data-a="openProduct" data-v="${pr.id}"><span class="ph" style="width:44px;height:44px;flex:none"><span>이미지</span>${pimg(pr.id)}</span><span class="grow"><span class="xs mute">${esc(brandById[pr.b].n)}</span><b class="sm ellip" style="display:block">${esc(pr.n)}</b></span><span class="chev">${ico('chev', 'ico')}</span></button>
  <div class="row mt16" style="gap:12px"><span class="avatar">이미지</span><div class="grow"><b>${esc(nickOfU(r.u))}</b> <span class="sm mute">${uidOf(r.u)}</span><div class="sm mute">키 ${u[0]}cm · ${u[1]}kg · 선호 ${u[2] || '미확인'}</div></div>${stars(r.rt)}</div>
  ${me ? `<div class="card fill sm mt12" style="padding:10px 12px">나와 비교하면 키 <b>${sgn(dh)}cm</b>, 몸무게 <b>${sgn(dw)}kg</b> ${Math.abs(dh) <= 6 && Math.abs(dw) <= 7 ? '· <span class="pill ok">비슷한 체형</span>' : ''}</div>` : ''}
  <div class="grid3 mt16" style="gap:8px"><div class="card fill" style="padding:10px;text-align:center"><div class="xs mute">구매 사이즈</div><b style="font-size:18px">${r.sz}</b></div><div class="card fill" style="padding:10px;text-align:center"><div class="xs mute">딱 맞는 사이즈</div><b style="font-size:18px">${r.fs}</b></div><div class="card fill" style="padding:10px;text-align:center"><div class="xs mute">사이즈감</div><span class="pill ${OPCLS[r.op]}" style="margin-top:4px">${r.op}</span></div></div>
  <div class="mt16"><b>부위별 착용감</b>${r.fd ? `<div class="card mt8" style="padding:2px 14px">${Object.entries(r.fd).map(([k, v]) => `<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--line)"><span class="sm">${k}</span><span class="row" style="gap:8px">${r.ez && r.ez[k] != null ? `<span class="xs mute num">${k === '총장' ? '기준 대비 ' : '여유 '}${sgn(r.ez[k])}cm</span>` : ''}<span class="pill ${FDCLS[v]}">${v}</span></span></div>`).join('')}</div>` : `<p class="sm mute">부위별 정보 미확인</p>`}</div>
  <div class="mt16"><b>후기 키워드</b><div class="kws" style="margin-top:8px">${kwOf(r).map(k => `<span class="kw">#${esc(k)}</span>`).join('')}</div></div>
  <div class="mt16"><b>후기</b><p style="margin:6px 0 0;white-space:pre-wrap">${esc(r.t)}</p><div class="xs mute mt8">${r.d || '작성일 미확인'}${r.real ? ' · <span class="tag-real" style="margin:0">실제 후기</span>' : ' · 더미 데이터'}</div></div>
  <div class="mt16" style="border-top:1px solid var(--line);padding-top:14px"><b>답글 ${rps.length}</b><p class="xs mute" style="margin:2px 0 0">같은 고민을 한 사람끼리 사이즈 이야기를 나눠 보세요.</p>
    <div id="rplist">${rps.map(replyHTML).join('') || `<div class="empty" style="padding:18px"><b class="en">아직 답글이 없어요</b>${S.loggedIn ? '' : ''}<span class="sm">첫 답글을 남겨 보세요</span></div>`}</div>
    ${S.loggedIn ? `<div class="rpbox"><textarea id="rp-t" class="inp" rows="2" maxlength="300" data-i="rp" placeholder="사이즈가 궁금하거나 도움이 됐다면 답글을 남겨요">${esc(RP)}</textarea><button class="btn pri s" data-a="rpSend" data-v="${r.id}">등록</button></div><div class="xs mute" style="margin-top:4px">${S.profile.showBody && S.body ? `내 키·몸무게(${S.body.h}cm · ${S.body.w}kg)가 함께 표시돼요` : '키·몸무게 없이 닉네임만 표시돼요'}</div>`
      : `<div class="card fill row between" style="padding:12px 14px;margin-top:10px"><span class="sm">답글은 로그인 후 남길 수 있어요</span><button class="btn s pri" data-a="goLogin">로그인</button></div>`}</div></div><div style="height:90px"></div>
  <div class="dock" style="position:sticky;bottom:0"><div class="row"><button class="btn grow ${liked ? 'liked' : ''}" data-a="like" data-k="review" data-v="${r.id}">${ico('heart', 'ico')} 좋아요 ${likeN(r)}</button></div></div>`;
};
ACT.openReview = t => go('review', { id: t.dataset.v });
INP.rp = t => { RP = t.value; };
ACT.rpSend = t => {
  if (!S.loggedIn) { goLoginSheet(); return; }
  const text = RP.trim(); if (!text) { toast('답글 내용을 입력해 주세요'); return; }
  const id = t.dataset.v, b = S.profile.showBody ? S.body : null;
  (S.replies[id] ||= []).push({ id: 'RP' + Date.now(), name: nick(), uid: S.profile.uid, h: b?.h, w: b?.w, text, date: today(), mine: true });
  RP = ''; save(); toast('답글을 등록했어요'); reRender();
};
ACT.rpDel = t => { const id = t.dataset.v; Object.keys(S.replies).forEach(k => { S.replies[k] = S.replies[k].filter(x => x.id !== id); }); save(); toast('답글을 삭제했어요'); reRender(); };
ACT.rpReport = t => sheet(`<h3>답글을 신고할까요?</h3><p class="sub">신고 사유를 선택해 주세요. 확인되는 동안 이 답글은 내 화면에서 숨겨져요.</p><div class="list" style="margin:8px -16px 0">${['스팸·광고', '욕설·비방', '개인정보 노출', '기타'].map(x => `<button class="li" data-a="rpReportDo" data-v="${t.dataset.v}" style="padding:13px 16px"><b class="sm">${x}</b><span class="chev">${ico('chev', 'ico')}</span></button>`).join('')}</div><button class="btn flat full mt12" data-a="sheetClose">취소</button>`);
ACT.rpReportDo = t => { S.hiddenReplies.push(t.dataset.v); save(); closeSheet(); toast('신고가 접수됐어요'); reRender(); };
function goLoginSheet() { sheet(`<h3>로그인이 필요해요</h3><p class="sub">답글은 로그인한 회원만 남길 수 있어요.</p><div class="row mt16"><button class="btn flat grow" data-a="sheetClose">나중에</button><button class="btn pri grow" data-a="goLogin">로그인</button></div>`, true); }
