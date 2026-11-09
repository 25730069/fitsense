/** 핏센스 - 와이어프레임 앱 스크립트 (저장: localStorage) */
const KEY = 'fitsense_v1', PREF = { '슬림 핏': .5, '기본 핏': 1, '여유 핏': 1.6 };
const SH = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const row3 = o => [['어깨', b => b.sho, i => 37 + 1.5 * i, 1], ['가슴', b => b.chest, i => 84 + 6 * i + o, 6], ['허리', b => b.waist, i => 76 + 6 * i + o, 6]];
const C = {
  top: { n: '상의', sz: SH, rows: row3(0) },
  bottom: { n: '하의', sz: ['26', '28', '30', '32', '34', '36'], rows: [['허리', b => b.waist, i => 66 + 5 * i, 3], ['힙', b => b.hip, i => 90 + 5 * i, 6]] },
  dress: { n: '원피스', sz: SH.slice(0, 5), rows: row3(2) },
  outer: { n: '아우터', sz: SH, rows: row3(6) },
  hat: { n: '모자', sz: ['S', 'M', 'L'], rows: [['머리둘레', b => b.head, i => 54 + 2 * i, 1.5]] },
  shoes: { n: '신발', sz: ['220', '230', '240', '250', '260', '270', '280', '290'], rows: [['발길이(mm)', b => b.foot, i => 220 + 10 * i, 5]] }
};
const CK = Object.keys(C);
// 브랜드 목록: [이름, 카테고리, 정사이즈 후기 %, 후기 수, 치수 보정(+작게/-크게), 경향]
// 7주차부터 코드에 적지 않고 data/*.json 에서 읽어 data.js 의 buildBR() 가 만든다
let BR = [];
const SEED = [
  { id: 1, date: '2026.10.10', ex: 1, name: '유니클로 옥스포드 셔츠', cat: 'top', size: 'M', pref: '기본 핏', rows: [['어깨', 46, 48], ['가슴', 96, 108], ['허리', 80, 92]], fb: null },
  { id: 2, date: '2026.10.04', ex: 1, name: '무인양품 워시드 셔츠', cat: 'top', size: 'M', pref: '기본 핏', rows: [['어깨', 46, 47], ['가슴', 96, 106], ['허리', 80, 90]], fb: { size: 'M', fit: '정핏' } }];
const freshState = () => ({ records: SEED.map(r => ({...r, rows:r.rows.map(x=>[...x]), fb:r.fb?{...r.fb}:null})), brands: [], prof: null, pref: '기본 핏', clothPhotos: [], feedbackPhotos: {}, bodyPhoto: null });
let S = freshState();
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
let currentUser = localStorage.getItem('fitsense_auth_user') || '';
let authMode = 'login';
const save = () => { try { localStorage.setItem(currentUser ? KEY + '_' + currentUser : KEY, JSON.stringify(S)); } catch (e) {} };
const $ = id => document.getElementById(id), sgn = v => (v > 0 ? '+' : '') + Math.round(v * 10) / 10 + 'cm';
let cur = { cat: 'dress', label: '프리' }, brandCat = '상의';

/* ---------- 로컬 데모 로그인/회원가입 ---------- */
function authUsers(){ try{return JSON.parse(localStorage.getItem('fitsense_accounts')||'{}')}catch(e){return {}} }
function initializeAuth(){
  if(currentUser){
    try { const saved=localStorage.getItem(KEY+'_'+currentUser); if(saved) S=Object.assign(freshState(),JSON.parse(saved)); }
    catch(e) { S=freshState(); }
  }
  applyAuthState();
}
function applyAuthState(){
  const logged=!!currentUser, auth=$('auth-screen'), app=$('app-shell');
  if(auth) auth.style.display=logged?'none':'flex';
  if(app) app.style.display=logged?'flex':'none';
  if(logged){ const name=$('header-username'), avatar=$('header-avatar'); if(name)name.textContent=currentUser+'님 ∨'; if(avatar)avatar.textContent=currentUser.slice(0,1).toUpperCase(); }
}
function toggleAuthMode(){
  authMode=authMode==='login'?'signup':'login';
  $('auth-title').textContent=authMode==='login'?'로그인':'회원가입';
  $('auth-description').textContent=authMode==='login'?'내 핏 기록을 이어서 확인해 보세요.':'아이디와 비밀번호만으로 계정을 만들어요.';
  $('auth-submit').textContent=authMode==='login'?'로그인':'회원가입';
  $('auth-switch').textContent=authMode==='login'?'계정이 없으신가요? 회원가입':'이미 계정이 있으신가요? 로그인';
  $('auth-password').autocomplete=authMode==='login'?'current-password':'new-password'; $('auth-message').textContent='';
}
function submitAuth(event){
  event.preventDefault(); const id=$('auth-id').value.trim(), pw=$('auth-password').value, msg=$('auth-message');
  if(!/^[a-zA-Z0-9_가-힣]{3,24}$/.test(id)){msg.textContent='아이디는 3~24자의 한글, 영문, 숫자, 밑줄만 사용할 수 있어요.';return;}
  const users=authUsers();
  if(authMode==='signup'){
    if(users[id]){msg.textContent='이미 사용 중인 아이디예요.';return;}
    if(pw.length<4){msg.textContent='비밀번호는 4자 이상 입력해 주세요.';return;}
    users[id]=pw; localStorage.setItem('fitsense_accounts',JSON.stringify(users)); currentUser=id;
    // 첫 가입 시 기존 브라우저에 있던 데이터를 해당 계정으로 이전
    localStorage.setItem(KEY+'_'+currentUser,JSON.stringify(S));
  } else {
    if(!users[id]||users[id]!==pw){msg.textContent='아이디 또는 비밀번호를 확인해 주세요.';return;}
    currentUser=id;
    try { S=Object.assign(freshState(),JSON.parse(localStorage.getItem(KEY+'_'+currentUser)||'{}')); } catch(e) { S=freshState(); }
  }
  localStorage.setItem('fitsense_auth_user',currentUser); save(); applyAuthState();
  renderProfileForm(); renderHome(); renderMy(); renderClothPhotos(); renderFeedbackPhoto();
  $('auth-form').reset(); navigateTo('home');
}
function logoutUser(){
  save(); localStorage.removeItem('fitsense_auth_user'); currentUser=''; authMode='login';
  $('auth-title').textContent='로그인'; $('auth-description').textContent='내 핏 기록을 이어서 확인해 보세요.'; $('auth-submit').textContent='로그인'; $('auth-switch').textContent='계정이 없으신가요? 회원가입'; $('auth-message').textContent='';
  applyAuthState(); $('auth-form').reset(); $('auth-id').focus();
}

/* ---------- 라우팅 ---------- */
function navigateTo(pageId) {
  document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
  const t = $('page-' + pageId); if (t) t.classList.add('active');
  const tab = pageId === 'analysis-result' ? 'size-input' : pageId === 'brand-detail' ? 'brand' : pageId;
  document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.target === tab));
  if (pageId === 'mypage') renderMy(); if (pageId === 'brand') renderBrands(); if (pageId === 'home') renderHome(); if (pageId === 'brand-detail') renderBrandDetail();
  const b = document.querySelector('.app-body'); if (b) b.scrollTop = 0;
}
function startMeasure() { navigateTo('size-input'); switchInputStep(1); }
function backToCloth() { navigateTo('size-input'); switchInputStep(2); }
function switchInputStep(step) {
  ['step-1-basic', 'step-1-detail', 'step-2-cloth'].forEach(id => $(id).classList.remove('active'));
  $(step === 1 ? 'step-1-basic' : step === 2 ? 'step-2-cloth' : 'step-1-detail').classList.add('active');
  $('step-tab-1').classList.toggle('active', step !== 2); $('step-tab-2').classList.toggle('active', step === 2);
  if (step === 2) { renderCloth(); renderClothPhotos(); }
}
function switchMypageTab(n) {
  ['record','brands','profile'].forEach(k => $('mypage-tab-' + k).classList.toggle('active', k === n));
  ['record','brands','profile'].forEach((k,i) => $('mypage-subtab-' + (i+1)).classList.toggle('active', k === n));
  if (n === 'brands') renderMypageBrands();
  if (n === 'record') renderFeedbackList();
}
function compressImageFile(file, callback) {
  const reader = new FileReader(); reader.onload = ev => { const img = new Image(); img.onload = () => { const max = 1200, scale = Math.min(1, max / Math.max(img.width, img.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale)); canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height); callback(canvas.toDataURL('image/jpeg', .78)); }; img.onerror = () => callback(ev.target.result); img.src = ev.target.result; }; reader.readAsDataURL(file);
}
function handleClothFiles(e) {
  const files = [...(e.target.files || [])];
  files.forEach(file => { if (!file.type.startsWith('image/')) return; compressImageFile(file, src => { S.clothPhotos = S.clothPhotos || []; S.clothPhotos.push({id:Date.now()+Math.random(), src, type:'착용 사진', name:file.name}); save(); renderClothPhotos(); }); });
  e.target.value = '';
}
function renderClothPhotos() {
  const box = $('cloth-attach-list'); if (!box) return;
  box.innerHTML = (S.clothPhotos || []).map(p => `<div class="attach-row photo-attach-row"><img class="attach-thumb" src="${p.src}" alt="추가한 사진"><select class="select-box" onchange="setClothPhotoType('${p.id}',this.value)"><option ${p.type==='착용 사진'?'selected':''}>착용 사진</option><option ${p.type==='사이즈표 캡처'?'selected':''}>사이즈표 캡처</option></select><button type="button" class="del-btn" aria-label="사진 삭제" onclick="removeClothPhoto('${p.id}')">✕</button></div>`).join('') || '<p class="sub-info">추가한 사진이 여기에 표시돼요.</p>';
}
function setClothPhotoType(id,type) { const p=(S.clothPhotos||[]).find(x=>String(x.id)===String(id)); if(p){p.type=type;save();} }
function removeClothPhoto(id) { S.clothPhotos=(S.clothPhotos||[]).filter(p=>String(p.id)!==String(id)); save(); renderClothPhotos(); }
function handleFeedbackPhoto(e) {
  const file=e.target.files && e.target.files[0]; if(!file) return; if(!file.type.startsWith('image/')) return alert('이미지 파일을 선택해 주세요.');
  compressImageFile(file, src=>{const id=$('fb-target').value; S.feedbackPhotos=S.feedbackPhotos||{}; S.feedbackPhotos[id]=src; save(); renderFeedbackPhoto();}); e.target.value='';
}
function renderFeedbackPhoto() { const id=$('fb-target')?.value, src=(S.feedbackPhotos||{})[id], box=$('fb-photo-preview'); if(!box)return; box.innerHTML=src?`<div class="feedback-photo-wrap"><img src="${src}" alt="착용 피드백 사진"><button type="button" class="photo-remove" onclick="removeFeedbackPhoto()">✕</button></div>`:''; }
function removeFeedbackPhoto(){const id=$('fb-target').value;if(S.feedbackPhotos)delete S.feedbackPhotos[id];save();renderFeedbackPhoto();}

function handleBodyPhoto(e) {
  const f = e.target.files[0]; if (!f) return;
  compressImageFile(f, src => { S.bodyPhoto=src; save(); renderBodyPhoto(); }); e.target.value='';
}
function renderBodyPhoto(){ const b=$('body-photo-preview'); if(!b)return; if(S.bodyPhoto){b.style.backgroundImage=`url(${S.bodyPhoto})`;b.style.backgroundSize='cover';b.style.backgroundPosition='center';b.innerHTML='';}else{b.style.backgroundImage='';b.innerHTML='<button class="inner-btn">+ 전신 사진 올리기</button>';} }
function delPhoto() { S.bodyPhoto=null; save(); renderBodyPhoto(); alert('저장된 전신 사진을 삭제했어요.'); }
function deletePhotoData(){ if(!confirm('저장된 전신 사진과 옷 입력 사진을 모두 삭제할까요?'))return; S.bodyPhoto=null; S.clothPhotos=[]; save(); renderBodyPhoto(); renderClothPhotos(); alert('전신 사진과 옷 사진을 삭제했어요.'); }
function deleteAllRecords(){ if(!confirm('분석 기록과 저장한 피드백을 모두 삭제할까요? 이 작업은 되돌릴 수 없어요.'))return; S.records=[]; S.feedbackPhotos={}; save(); renderMy(); renderFeedbackPhoto(); alert('전체 피드백 및 기록을 삭제했어요.'); }
function openModal(id) { $(id).classList.add('active'); } function closeModal(id) { $(id).classList.remove('active'); }

/* ---------- 계산 ---------- */
const dIn = () => [...document.querySelectorAll('#step-1-detail input')], gIn = () => [...document.querySelectorAll('#step-2-cloth .unit-input input')];
function readBody() { const d = dIn().map(i => i.value); return { h: $('input-height').value, w: $('input-weight').value, sho: d[2], arm: d[3], chest: d[4], waist: d[5], hip: d[6], leg: d[7] }; }
function bodyOf(v) {
  const h = +v.h || 160, w = +v.w || 52, n = x => (x ? +x : 0);
  return { h, w, sho: n(v.sho) || Math.round(h * .238), chest: n(v.chest) || Math.round(h * .5 + (w - 52) * .6 + 2), waist: n(v.waist) || Math.round(h * .4 + (w - 52) * .6), hip: n(v.hip) || Math.round(h * .575 + (w - 52) * .6), head: Math.round(h * .345), foot: Math.round(h * 1.55) };
}
function evalCat(k, b, pref, iSel, t) {
  const c = C[k], m = PREF[pref] || 1, gv = (r, i) => (i === iSel && t && t[r[0]] ? t[r[0]] : r[2](i));
  const errs = c.sz.map((_, i) => c.rows.reduce((a, r) => a + Math.abs(gv(r, i) - r[1](b) - r[3] * m), 0));
  return { gv, errs, best: errs.indexOf(Math.min(...errs)) };
}
const myBody = () => bodyOf(S.prof || {});
function brandSize(br, k) { const c = C[k], e = evalCat(k, myBody(), S.pref); return c.sz[Math.max(0, Math.min(c.sz.length - 1, e.best + br[4]))]; }
const lenLabel = (l, h) => { const r = l / h; return r < .4 ? '허리 위' : r < .55 ? '엉덩이 부근' : r < .7 ? '무릎 위' : '무릎 아래'; };

/* ---------- 2. 옷 입력 ---------- */
function renderCloth() {
  $('cat-pills').innerHTML = CK.map(k => `<button class="pill ${k === cur.cat ? 'active' : ''}" onclick="pickCat('${k}')">${C[k].n}</button>`).join('');
  const ex = cur.cat === 'shoes' ? [] : ['프리', '직접 입력'];
  $('size-chips').innerHTML = C[cur.cat].sz.concat(ex).map(s => `<button class="chip ${s === cur.label ? 'active' : ''}" onclick="pickSize('${s}')">${s}</button>`).join('');
  $('custom-size').hidden = cur.label !== '직접 입력';
}
function pickCat(k) { cur.cat = k; cur.label = k === 'shoes' ? '' : '프리'; renderCloth(); }
function pickSize(s) { cur.label = s; renderCloth(); }

/* ---------- 3. 분석 결과 ---------- */
let last = null;
function calc() {
  const c = C[cur.cat], b = bodyOf(readBody()), g = gIn().map(i => +i.value || 0), iSel = c.sz.indexOf(cur.label);
  const t = { '어깨': g[1], '가슴': g[2] * 2 }, e = evalCat(cur.cat, b, S.pref, iSel, t), size = c.sz[e.best];
  const filled = dIn().slice(2).filter(i => i.value).length;
  last = { cat: cur.cat, name: $('item-name').value.trim() || `${c.n} ${cur.label === '직접 입력' ? ($('custom-size').value || '직접 입력') : (cur.label || '')}`.trim(), size, pref: S.pref,
    rows: c.rows.map(r => [r[0], Math.round(r[1](b)), Math.round(e.gv(r, e.best) * 10) / 10]), pcts: e.errs.map(x => Math.max(8, Math.round(100 - x * 4))), len: g[0], h: b.h, conf: filled >= 6 ? '높음 · ±1cm' : '중간 · ±2cm', label: cur.label };
}
function table(rows) { return `<table class="wire-table"><thead><tr><th>부위</th><th>신체</th><th>옷</th><th>차이</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="bold">${sgn(r[2] - r[1])}</td></tr>`).join('')}</tbody></table>`; }
function runAnalysis() { calc(); renderResult(); navigateTo('analysis-result'); }
function setPref(v) { S.pref = v; save(); calc(); renderResult(); }
function renderResult() {
  const r = last, c = C[r.cat];
  $('result-body').innerHTML = `<div class="wire-card text-center"><p class="sub-text">추천 사이즈 <span class="highlight-lg">${r.size}</span> ${c.n} · ${r.label || '사이즈 미선택'} · ${r.pref} 기준</p>
    <div class="size-bar-chart">${c.sz.map((s, i) => `<div class="chart-col ${s === r.size ? 'active' : ''}"><div class="bar" style="height:${r.pcts[i]}%"></div><span>${s} ${r.pcts[i]}%</span></div>`).join('')}</div></div>
    <div class="wire-card"><h4>핏 시각화</h4><div class="toggle-group"><button class="toggle-btn active">정면</button> <button class="toggle-btn">측면</button> <button class="toggle-btn dashed">3D 회전 ↺</button></div>
    <div class="fit-canvas"><div class="body-wireframe-shape"></div><div class="cloth-dashed-shape"></div><p class="canvas-note">예측 시각화 · 회색 신체 모형 / 점선 옷 윤곽</p></div></div>
    <div class="wire-card"><h4>부위별 차이</h4>${table(r.rows)}</div>
    <div class="grid-2col"><div class="wire-card"><p class="sub-text">기장 위치 (키 ${r.h}cm)</p><h5>${r.len && ['top', 'bottom', 'dress', 'outer'].includes(r.cat) ? lenLabel(r.len, r.h) + ' · 총장 ' + r.len + 'cm' : '해당 없음'}</h5></div><div class="wire-card"><p class="sub-text">신뢰도</p><h5>${r.conf}</h5></div></div>
    <div class="btn-row"><button class="btn btn-outline" onclick="backToCloth()">입력 수정</button><button class="btn btn-outline" onclick="startMeasure()">사진 교체</button>
    <select class="select-box" onchange="setPref(this.value)">${Object.keys(PREF).map(p => `<option ${p === r.pref ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
    <div class="btn-row mt-10"><button class="btn btn-outline flex-1" onclick="backToCloth()">다시 분석</button><button class="btn btn-dark flex-1" onclick="saveResult()">저장</button></div>`;
}
function saveResult() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  S.records.unshift({ id: Date.now(), date: `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`, name: last.name, cat: last.cat, size: last.size, pref: last.pref, rows: last.rows, fb: null });
  S.prof = readBody(); S.flash = '분석과 신체 사이즈를 저장했어요. 아래 분석 기록에서 확인하세요.'; save(); renderProfileForm();
  navigateTo('mypage'); switchMypageTab('record');
}

/* ---------- 마이페이지 ---------- */
const pIn = () => [...document.querySelectorAll('#mypage-tab-profile input[type=number]')];
function renderProfileForm() {
  const p = S.prof, i = pIn(); if (p) { [p.h, p.chest, p.waist, p.hip].forEach((v, n) => { if (v) i[n].value = v; }); ['input-height', 'input-weight'].forEach((id, n) => { const v = n ? p.w : p.h; if (v) $(id).value = v; });
    const d = dIn(); [p.h, p.w, p.sho, p.arm, p.chest, p.waist, p.hip, p.leg].forEach((v, n) => { if (v) d[n].value = v; }); }
  document.querySelectorAll('.pref-box').forEach(b => { const on = b.querySelector('strong').textContent.replace(' ✓', '') === S.pref; b.classList.toggle('active', on); b.querySelector('strong').textContent = S.pref === b.querySelector('strong').textContent.replace(' ✓', '') ? S.pref + ' ✓' : b.querySelector('strong').textContent.replace(' ✓', ''); });
}
function saveProfile() {
  const i = pIn().map(x => x.value), p = S.prof || readBody(); Object.assign(p, { h: i[0], chest: i[1], waist: i[2], hip: i[3] });
  const a = document.querySelector('.pref-box.active strong'); if (a) S.pref = a.textContent.replace(' ✓', ''); S.prof = p; save(); renderProfileForm(); renderMy(); alert('프로필 저장 완료');
}
function resetProfile() { S.prof = null; S.pref = '기본 핏'; save(); pIn().forEach(x => x.value = ''); renderProfileForm(); renderMy(); alert('프로필을 초기화했어요.'); }
function recCard(r) {
  return `<div class="record-card"><div class="rec-head"><span>${r.date}${r.ex ? ' · 예시' : ''}</span><span class="dots">···</span></div><div class="rec-body"><div class="wire-x-box square-50"></div><div><h5>${r.name}</h5>
    <div class="badge-group"><span class="badge">${r.size} · ${r.pref}</span><span class="badge ${r.fb ? '' : 'active'}">${r.fb ? '피드백 완료' : '피드백 작성 중'}</span></div><p class="sub-info">${r.rows.map(x => x[0] + ' ' + sgn(x[2] - x[1])).join(' · ')}</p></div></div>
    <div class="rec-actions"><button class="link-action" onclick="openAnalysis(${r.id})">결과 보기 ↗</button><button class="link-action" onclick="startMeasure()">입력값 재사용</button><button class="link-action text-del" onclick="delRec(${r.id})">삭제</button></div></div>`;
}
function renderMy() {
  $('mypage-flash').innerHTML = S.flash ? `<div class="flash">${S.flash}</div>` : ''; if (S.flash) { S.flash = ''; save(); }
  $('record-list').innerHTML = S.records.length ? S.records.map(recCard).join('') : '<p class="sub-info">저장한 분석이 없어요. 사이즈 측정 후 저장해 보세요.</p>';
  $('sum-saved').textContent = S.records.length + '건'; $('sum-fb').textContent = S.records.filter(r => r.fb).length + '건'; $('sum-pref').textContent = S.pref;
  const cur0 = $('fb-target').value; $('fb-target').innerHTML = S.records.map(r => `<option value="${r.id}">${r.name} · ${r.size}</option>`).join(''); if (cur0) $('fb-target').value = cur0; fillFbSize(); renderMypageBrands(); renderFeedbackList(); renderFeedbackPhoto();
}
function fillFbSize() {
  const r = S.records.find(x => x.id == $('fb-target').value), sz = r ? C[r.cat].sz : SH; $('fb-size').innerHTML = sz.concat(['프리']).map(s => `<option ${r && s === r.size ? 'selected' : ''}>${s}</option>`).join(''); renderFeedbackPhoto(); if(r && r.fb){ $('fb-memo').value=r.fb.memo||''; const chips=[...document.querySelectorAll('#mypage-tab-record .chip-group .chip')]; chips.forEach(c=>{const val=c.textContent.replace(' ✓','').trim();c.classList.toggle('active',val===r.fb.fit);c.textContent=val+(val===r.fb.fit?' ✓':'');}); }
}
function openAnalysis(id) {
  const r = S.records.find(x => x.id === id); if (!r) return;
  $('analysis-modal-body').innerHTML = `<p class="sub-info mb-10">${C[r.cat].n} · ${r.pref} 기준 · ${r.date} 저장</p><div class="wire-card text-center"><h4>${r.name} · 추천 사이즈 ${r.size}</h4></div><h4>부위별 차이</h4>${table(r.rows)}
    <div class="btn-row mt-15"><button class="btn btn-dark flex-1" onclick="closeModal('modal-saved-analysis');startMeasure()">다시 분석</button><button class="btn btn-outline flex-1" onclick="delRec(${id})">저장 삭제</button></div>`;
  openModal('modal-saved-analysis');
}
function delRec(id) { S.records = S.records.filter(r => r.id !== id); save(); closeModal('modal-saved-analysis'); renderMy(); }
function saveFeedback() {
  const r = S.records.find(x => x.id == $('fb-target').value); if (!r) return alert('분석 기록을 먼저 저장해 주세요.');
  const parts = {}, g = [...document.querySelectorAll('.fit-grid-eval > div')]; g.forEach((d, n) => { const a = d.parentNode.querySelectorAll('.chip-sm.active')[n]; parts[d.textContent] = a ? a.textContent : ''; });
  const f = document.querySelector('#mypage-tab-record .chip-group .chip.active');
  r.fb = { size: $('fb-size').value, fit: f ? f.textContent.replace(' ✓', '').trim() : '', parts, memo: $('fb-memo').value, photo: (S.feedbackPhotos||{})[String(r.id)] || null, savedAt: new Date().toLocaleString('ko-KR') }; save(); renderMy(); renderFeedbackList(); alert('피드백 저장 완료');
}

function renderFeedbackList(){
 const box=$('feedback-list'); if(!box)return; const rows=S.records.filter(r=>r.fb);
 box.innerHTML=rows.length?rows.map(r=>`<div class="record-card feedback-saved"><div class="rec-head"><span>${r.date} · ${r.name}</span><span class="badge">저장됨</span></div><p class="mt-5"><strong>실제 사이즈 ${r.fb.size||'-'} · ${r.fb.fit||'핏 미입력'}</strong></p><p class="sub-info mt-5">${Object.entries(r.fb.parts||{}).map(([k,v])=>`${k} ${v}`).join(' · ')}</p>${r.fb.memo?`<p class="feedback-memo mt-5">${escapeHtml(r.fb.memo)}</p>`:''}${(S.feedbackPhotos||{})[String(r.id)]?`<img class="saved-feedback-image mt-5" src="${S.feedbackPhotos[String(r.id)]}" alt="저장된 착용 사진">`:''}<div class="rec-actions"><button class="link-action" onclick="loadFeedback('${r.id}')">수정하기</button></div></div>`).join(''):'<p class="sub-info">아직 저장한 피드백이 없어요. 피드백을 작성하고 저장해 주세요.</p>';
}
function loadFeedback(id){$('fb-target').value=id;fillFbSize();$('fb-memo').value=(S.records.find(r=>String(r.id)===String(id))||{}).fb?.memo||'';}
function renderMypageBrands(){const box=$('mypage-saved-brands');if(!box)return;const ids=BR.map((b,i)=>({b,i})).filter(x=>S.brands.includes(x.b[0]));box.innerHTML=ids.length?ids.map(({b,i})=>`<div class="wire-card brand-row"><div class="brand-item-row"><div class="brand-mini-icon">${b[0].slice(0,1)}</div><div class="brand-copy"><h4>${b[0]}</h4><p class="sub-info">${b[1].split(',').join(' · ')}</p></div><button class="btn btn-outline btn-sm" onclick="toggleBrand(${i});renderMypageBrands()">저장 해제</button></div></div>`).join(''):'<p class="sub-info">저장한 브랜드가 없어요. 브랜드 탭에서 마음에 드는 브랜드를 저장해 보세요.</p>';}
function escapeHtml(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

/* ---------- 브랜드 ---------- */
function brandRow(i, btn) {
  const b = BR[i], k = CK.find(x => C[x].n === (brandCat in { 전체: 1 } ? b[1].split(',')[0] : brandCat)) || CK.find(x => C[x].n === b[1].split(',')[0]);
  return `<div class="wire-card brand-row clickable" onclick="openBrandDetail(${i})"><div class="brand-item-row"><div class="wire-x-box square-40"></div><div style="flex:1"><h4>${b[0]}</h4><span class="badge">추천 사이즈 ${brandSize(b, k)}</span>
    <p class="sub-info mt-5">${escapeHtml(b[5])} · 정사이즈 후기 ${b[2]}% · 후기 ${b[3]}건</p></div>${btn || '<span class="row-chev">›</span>'}</div></div>`;
}
function renderHome() {
  if (dataState !== 'ready') { $('home-brands').innerHTML = stateBox(); return; }
  const ix = BR.map((b, i) => i).filter(i => BR[i][1].includes('상의')).sort((a, b) => BR[b][2] - BR[a][2]).slice(0, 3); const keep = brandCat; brandCat = '상의';
  $('home-brands').innerHTML = ix.map(i => brandRow(i, '')).join('') + '<button class="btn btn-outline full-btn" onclick="navigateTo(\'brand\')">브랜드 더 보기</button>'; brandCat = keep;
}
function renderBrands() {
  $('brand-cats').innerHTML = CK.filter(k => CAT_NAMES.includes(C[k].n)).map(k => `<button class="pill ${C[k].n === brandCat ? 'active' : ''}" onclick="brandCat='${C[k].n}';renderBrands()">${C[k].n}</button>`).join('');
  if (dataState !== 'ready') { $('brand-list').innerHTML = stateBox(); $('saved-brands').innerHTML = ''; return; }
  const ix = BR.map((b, i) => i).filter(i => BR[i][1].split(',').includes(brandCat)).sort((a, b) => BR[b][2] - BR[a][2]);
  $('brand-list').innerHTML = ix.map(i => { const on = S.brands.includes(BR[i][0]); return brandRow(i, `<button class="btn btn-sm ${on ? 'btn-dark' : 'btn-outline'}" onclick="event.stopPropagation();toggleBrand(${i})">${on ? '저장됨' : '♡ 저장'}</button>`); }).join('') || '<p class="sub-info">이 카테고리의 브랜드가 없어요.</p>';
  const sv = BR.map((b, i) => i).filter(i => S.brands.includes(BR[i][0]));
  $('saved-brands').innerHTML = sv.length ? sv.map(i => `<div class="wire-card clickable brand-row" onclick="openBrand(${i})"><div class="brand-item-row"><div class="wire-x-box square-40"></div><div><h4>${BR[i][0]}</h4><span class="badge">${BR[i][1].split(',').join(' · ')}</span></div></div></div>`).join('') : '<p class="sub-info">저장한 브랜드가 없어요.</p>';
}
function toggleBrand(i) { const n = BR[i][0], x = S.brands.indexOf(n); x < 0 ? S.brands.push(n) : S.brands.splice(x, 1); save(); renderBrands(); }
function openBrand(i) {
  const b = BR[i]; $('brand-modal-body').innerHTML = `<div class="wire-card mt-10"><h3>${b[0]}</h3><div class="brand-size-grid">${b[1].split(',').map(n => { const k = CK.find(x => C[x].n === n); return `<div class="brand-size-cell"><span>${n}</span><strong>${brandSize(b, k)}</strong></div>`; }).join('')}</div></div>
    <div class="wire-card"><h5>사이즈 경향</h5><h4>${b[5]}</h4><p class="sub-info">정사이즈 후기 ${b[2]}% · 후기 ${b[3]}건 · 더미 데이터 기준</p></div>
    <button class="btn btn-dark full-btn" onclick="closeModal('modal-saved-brand');openBrandDetail(${i})">상품 보기</button>
    <button class="btn btn-outline full-btn mt-5" onclick="closeModal('modal-saved-brand');brandCat='${b[1].split(',')[0]}';navigateTo('brand')">브랜드 목록에서 다시 찾기</button>
    <button class="btn btn-outline full-btn mt-5" onclick="toggleBrand(${i});closeModal('modal-saved-brand')">저장 해제</button>`;
  openModal('modal-saved-brand');
}

/* ---------- 선택 요소(칩·라디오·핏 박스) ---------- */
function pick(el, sel) { el.parentNode.querySelectorAll(sel).forEach(x => x.classList.remove('active')); el.classList.add('active'); }
document.addEventListener('click', e => {
  const t = e.target;
  const pb = t.closest('.pref-box'); if (pb) { pick(pb, '.pref-box'); pb.parentNode.querySelectorAll('strong').forEach(s => s.textContent = s.textContent.replace(' ✓', '')); pb.querySelector('strong').textContent += ' ✓'; return; }
  const cs = t.closest('.chip-sm'); if (cs) { const all = [...cs.parentNode.querySelectorAll('.chip-sm')], i = all.indexOf(cs), s = i - i % 3; all.slice(s, s + 3).forEach(x => x.classList.remove('active')); cs.classList.add('active'); return; }
  const ch = t.closest('#mypage-tab-record .chip-group .chip'); if (ch) { pick(ch, '.chip'); ch.parentNode.querySelectorAll('.chip').forEach(x => x.textContent = x.textContent.replace(' ✓', '')); ch.textContent += ' ✓'; }
});
document.addEventListener('change', e => { const rb = e.target.closest('.radio-box'); if (rb) pick(rb, '.radio-box'); if(e.target.id==='fb-target'){fillFbSize();} });
document.addEventListener('input', e => { if (e.target.id === 'input-height' || e.target.id === 'input-weight') dIn()[e.target.id === 'input-height' ? 0 : 1].value = e.target.value; });
initializeAuth(); renderProfileForm(); renderHome(); renderMy(); renderClothPhotos(); renderBodyPhoto();
loadAll();   // data/*.json 불러오기 (data.js)
