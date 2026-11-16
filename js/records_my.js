/* ===== 화면 3: 마이 · 로그인/회원가입/탈퇴 · 내 사진 · 기록(통합) · 피드백 · 찜 · 프로토타입 패널 ===== */

/* ---------- 마이 ---------- */
const avatar = (sz, cls = '') => S.profile.img ? `<img class="avatar ${cls}" src="${S.profile.img}" alt="프로필 이미지" style="width:${sz}px;height:${sz}px;object-fit:cover">` : `<span class="avatar ${cls}" style="width:${sz}px;height:${sz}px">이미지</span>`;
const mrow = (a, t) => `<button class="li" data-a="${a}"><span class="grow">${t}</span><span class="chev">›</span></button>`;
V.my = () => `${topbar('마이')}
  <button class="myhead" data-a="goProfile">${avatar(72)}<span class="grow"><b class="nm">${esc(S.profile.nick)}</b><span class="uid">ID: ${esc(S.profile.uid)}</span></span><span class="chev">›</span></button>
  ${S.loggedIn ? '' : `<div style="padding:0 16px 14px"><div class="card fill" style="padding:14px"><b>로그인하고 더 편하게 쓰세요</b><p class="sm mute" style="margin:4px 0 12px">후기 답글을 남기고, 기록·찜을 내 계정에 연결해요.</p><div class="row"><button class="btn pri grow" data-a="goLogin">로그인</button><button class="btn grow" data-a="goSignup">회원가입</button></div></div></div>`}
  <div class="list flat">${mrow('goMyfit', '내 신체 치수')}${mrow('goPw', '비밀번호 변경')}${mrow('goPrivacy', '개인정보 관리')}${mrow('goNset', '알림 설정')}</div>
  <div class="band"></div>
  <div class="list flat">${mrow('goPhotos', '사진첩')}${mrow('goInq', '문의 내역')}${mrow('goRecent', '최근 본 상품')}${mrow('tutAgain', '사용 방법 다시 보기')}</div>
  ${S.loggedIn ? `<div class="band"></div><div class="list flat"><button class="li" data-a="logout"><b>로그아웃</b></button></div>` : ''}
  <div style="height:24px"></div>`;
ACT.goRecent = () => go('recent');

/* ---------- 프로필(마이페이지 상단의 버튼으로만 들어감) ---------- */
let PF = {};
const STYLE_LIST = ['캐주얼', '시티보이', '클래식', '에스닉', '걸리시', '고프코어', '미니멀', '프레피', '리조트', '레트로', '로맨틱', '스포티', '스트릿', '워크웨어'];
const TAKEN_IDS = ['admin', 'fitsense', 'fit_admin'];
const uidErr = v => !/^[a-z0-9_]{4,15}$/.test(v) ? '영문 소문자, 숫자, _ 4~15자로 입력해 주세요' : TAKEN_IDS.includes(v) ? '이미 사용 중인 아이디예요' : '';
V.profile = () => `${topbar('프로필')}<div class="pad">
  <div style="text-align:center;padding:4px 0 8px">${avatar(84, 'big')}<br><label class="link" for="pf-img" style="cursor:pointer;display:inline-block;margin-top:8px">프로필 이미지 변경</label><input id="pf-img" type="file" accept="image/*" hidden data-c="pfImg"></div>
  <div class="field"><label class="f" for="pf-n">닉네임</label><input id="pf-n" class="inp" maxlength="12" data-i="pf" data-k="nick" value="${esc(PF.nick)}"></div>
  <div class="field"><label class="f" for="pf-u">아이디</label><input id="pf-u" class="inp" maxlength="15" autocapitalize="none" autocomplete="off" data-i="pf" data-k="uid" value="${esc(PF.uid)}"><div id="pf-uh" class="hint" role="status"></div></div>
  <div class="field"><label class="f" for="pf-b">한 줄 소개</label><input id="pf-b" class="inp" maxlength="30" data-i="pf" data-k="bio" value="${esc(PF.bio)}" placeholder="예: 오버핏 좋아하는 160cm"></div>
  <button class="li" data-a="goStyles" style="border:1px solid var(--line2);border-radius:12px;padding:14px"><span class="grow"><b>선호 스타일</b><span class="sm mute" style="display:block;margin-top:2px">${PF.styles.length ? PF.styles.map(esc).join(', ') : '선택 안 함'}</span></span><span class="chev">›</span></button></div>
  <div class="dock"><button class="btn pri full" data-a="pfSave">저장</button></div>`;
CHG.pfImg = t => { const f = t.files[0]; if (!f) return; readPhoto(f, 400, d => { if (d) { PF.img = d; reRender(); } }); };
INP.pf = t => {
  const k = t.dataset.k; if (k === 'uid') t.value = t.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
  PF[k] = t.value;
  if (k === 'uid') { const h = $('#pf-uh'); if (!h) return; const e = t.value === S.profile.uid ? '' : uidErr(t.value); h.style.color = e ? 'var(--tight)' : 'var(--ok)'; h.textContent = e || (t.value !== S.profile.uid ? '사용할 수 있는 아이디예요' : ''); }
};
ACT.pfSave = () => {
  if (!PF.nick.trim()) { toast('닉네임을 입력해 주세요'); return; }
  const e = PF.uid === S.profile.uid ? '' : uidErr(PF.uid); if (e) { toast(e); return; }
  S.profile = { ...S.profile, ...PF, nick: PF.nick.trim() }; if (S.account) S.account.name = S.profile.nick; save(); toast('저장했어요'); back();
};
ACT.goProfile = () => { PF = { ...S.profile, styles: [...S.profile.styles] }; go('profile'); };
V.styles = () => `${topbar('선호 스타일')}<div class="pad"><h1 class="big">어떤 스타일을 좋아하세요?</h1><p class="sub">최대 3개까지 고를 수 있어요. 맞는 브랜드를 홈에 보여드려요.</p>
  <div class="chips" style="margin-top:14px">${STYLE_LIST.map(k => `<button class="chip ${PF.styles.includes(k) ? 'on' : ''}" data-a="styPick" data-v="${k}">${k}</button>`).join('')}</div>
  <div class="hint" style="margin-top:8px">선택 ${PF.styles.length}/3</div>
  <div class="card fill row between" style="padding:12px 14px;margin-top:18px"><div class="grow"><b class="sm">프로필에 스타일 공개</b><div class="xs mute">후기에 스타일 태그가 보여요</div></div><button class="sw ${PF.stylePub ? 'on' : ''}" data-a="styPub" role="switch" aria-checked="${PF.stylePub}" aria-label="스타일 공개"></button></div></div>
  <div class="dock"><button class="btn pri full" data-a="styDone">선택 완료</button></div>`;
ACT.styDone = () => { if (stack.at(-2)?.v !== 'profile') { S.profile.styles = [...PF.styles]; S.profile.stylePub = PF.stylePub; save(); } back(); };
ACT.goStyles = () => go('styles');
ACT.styPick = t => { const k = t.dataset.v, i = PF.styles.indexOf(k); if (i >= 0) PF.styles.splice(i, 1); else if (PF.styles.length >= 3) { toast('스타일은 최대 3개까지 고를 수 있어요'); return; } else PF.styles.push(k); reRender(); };
ACT.styPub = () => { PF.stylePub = !PF.stylePub; reRender(); };

/* ---------- 비밀번호 변경 · 개인정보 관리(본인 확인) · 알림 설정 ---------- */
const PW_RULE = '영문과 특수문자를 포함해 8자 이상';
const pwOk = p => p.length >= 8 && /[A-Za-z]/.test(p) && /[^A-Za-z0-9\s]/.test(p);
const curPw = () => (S.account || { pw: 'demo1234!' }).pw;
let PW = { cur: '', n1: '', n2: '', err: '' }, PV = { ok: false, pw: '', err: '' };
ACT.goPw = () => { PW = { cur: '', n1: '', n2: '', err: '' }; go('pwChange'); };
V.pwChange = () => `${topbar('비밀번호 변경')}<div class="pad">
  <div class="field"><label class="f" for="pw-c">현재 비밀번호</label><input id="pw-c" class="inp" type="password" autocomplete="current-password" data-i="pw" data-k="cur" value="${esc(PW.cur)}">${S.account ? '' : '<div class="hint">체험용 비밀번호: demo1234!</div>'}</div>
  <div class="field"><label class="f" for="pw-n">새 비밀번호</label><input id="pw-n" class="inp" type="password" autocomplete="new-password" data-i="pw" data-k="n1" value="${esc(PW.n1)}" placeholder="${PW_RULE}"><div class="hint">${PW_RULE} 조합이에요.</div></div>
  <div class="field"><label class="f" for="pw-n2">새 비밀번호 확인</label><input id="pw-n2" class="inp" type="password" autocomplete="new-password" data-i="pw" data-k="n2" value="${esc(PW.n2)}"></div>
  <div id="pw-e" class="hint" style="color:var(--tight)" role="alert">${esc(PW.err)}</div></div>
  <div class="dock"><button class="btn pri full" data-a="pwSave">변경하기</button></div>`;
INP.pw = t => { PW[t.dataset.k] = t.value; };
ACT.pwSave = () => {
  const e = PW.cur !== curPw() ? '현재 비밀번호가 맞지 않아요. 다시 확인해 주세요.' : !pwOk(PW.n1) ? `새 비밀번호는 ${PW_RULE}이어야 해요.` : PW.n1 !== PW.n2 ? '새 비밀번호가 서로 달라요.' : '';
  if (e) { PW.err = e; const h = $('#pw-e'); if (h) h.textContent = e; return; }
  if (S.account) S.account.pw = PW.n1; save(); toast('비밀번호를 변경했어요'); back();
};
ACT.goPrivacy = () => { PV = { ok: false, pw: '', err: '' }; go('privacy'); };
V.privacy = () => !PV.ok ? `${topbar('개인정보 관리')}<div class="pad"><h1 class="big">본인 확인을 위해<br>비밀번호를 입력해 주세요</h1><p class="sub">개인정보를 안전하게 지키기 위한 절차예요.</p>
  <div class="field mt16"><label class="f" for="pv-p">비밀번호</label><input id="pv-p" class="inp" type="password" autocomplete="current-password" data-i="pv" value="${esc(PV.pw)}">${S.account ? '' : '<div class="hint">체험용 비밀번호: demo1234!</div>'}<div id="pv-e" class="hint" style="color:var(--tight)" role="alert">${esc(PV.err)}</div></div>
  <div class="xs mute" style="text-align:center;margin-top:10px">소셜 로그인 계정은 해당 계정으로 다시 로그인해 확인해요.</div></div><div class="dock"><button class="btn pri full" data-a="pvOk">확인</button></div>`
  : `${topbar('개인정보 관리')}<div class="pad" style="padding-top:4px">
  <div class="list flat" style="margin:0 -16px"><div class="li"><span class="grow">이메일</span><span class="mute sm">${esc(S.account ? S.account.email : 'demo@fitsense.kr').replace(/^(.{2}).*(@.*)$/, '$1***$2')}</span></div>
  <div class="li"><span class="grow"><b>후기·답글에 키·몸무게 공개</b><span class="xs mute" style="display:block">내 체형이 표시돼 다른 사람의 사이즈 선택에 도움이 돼요</span></span><button class="sw ${S.profile.showBody ? 'on' : ''}" data-a="pvBody" role="switch" aria-checked="${S.profile.showBody}" aria-label="체형 공개"></button></div>
  <button class="li" data-a="goWithdraw"><span class="grow" style="color:var(--tight)">회원 탈퇴</span><span class="chev">›</span></button></div></div>`;
INP.pv = t => { PV.pw = t.value; };
ACT.pvOk = () => { if (PV.pw !== curPw()) { PV.err = '비밀번호가 맞지 않아요. 다시 확인해 주세요.'; const h = $('#pv-e'); if (h) h.textContent = PV.err; return; } PV.ok = true; reRender(); };
ACT.pvBody = () => { S.profile.showBody = !S.profile.showBody; save(); reRender(); };
const NSET = [['like', '내 후기 좋아요'], ['reply', '답글'], ['inquiry', '문의 처리 상태'], ['wish', '찜한 상품 새 후기']];
ACT.goNset = () => go('notifSet');
V.notifSet = () => `${topbar('알림 설정')}<div class="list flat" style="margin-top:4px">${NSET.map(([k, l]) => `<div class="li"><span class="grow">${l}</span><button class="sw ${S.nset[k] !== false ? 'on' : ''}" data-a="nsetTg" data-v="${k}" role="switch" aria-checked="${S.nset[k] !== false}" aria-label="${l}"></button></div>`).join('')}</div>
  <p class="xs mute" style="padding:10px 16px">끄면 해당 종류의 알림이 알림 목록에 쌓이지 않아요.</p>`;
ACT.nsetTg = t => { const k = t.dataset.v; S.nset[k] = S.nset[k] === false; save(); reRender(); };

V.myfit = () => {
  const hist = S.bodyHistory;
  return `${topbar('마이핏')}<div class="pad"><h1 class="big">내 신체 치수</h1><p class="sub">몸이 변했다면 수정하세요. 이후 측정부터 바로 반영돼요.${S.body?.updated ? ` <span class="b">마지막 수정 ${S.body.updated}</span>` : ''}</p><div class="mt16">${bodyFormHTML()}${photoCardHTML()}</div>
  ${hist.length ? `<div class="mt16"><b>이전 기록</b><div class="card mt8 list">${hist.map(h => `<div class="li" style="padding:10px 14px"><span class="sm mute" style="width:78px">${h.updated || '–'}</span><span class="sm num">${h.h}cm · ${h.w}kg${h.chest ? ' · 가슴 ' + h.chest : ''}</span></div>`).join('')}</div></div>` : ''}</div>
  <div class="dock"><button class="btn pri full" data-a="myfitSave">저장</button></div>`;
};
const origMyfit = ACT.goMyfit; ACT.goMyfit = () => { loadBD(); origMyfit(); };
ACT.myfitSave = () => { if (commitBody()) { toast('마이핏을 저장했어요'); back(); } };

/* ---------- 로그인 · 회원가입 · 로그아웃 · 회원 탈퇴 (프로토타입: 계정 정보는 이 브라우저에만 저장) ---------- */
const newAU = () => ({ mode: 'login', email: '', pw: '', pw2: '', name: '', agree: false });
let AU = newAU(), WD = { agree: false, reason: '' };
const authField = (id, label, type, k, ph, extra = '') => `<div class="field"><label class="f" for="${id}">${label}</label><input id="${id}" class="inp" type="${type}" data-i="au" data-k="${k}" value="${esc(AU[k])}" placeholder="${ph}" autocomplete="off" ${extra}></div>`;
V.auth = () => {
  const su = AU.mode === 'signup';
  return `${topbar('로그인 · 회원가입', { left: 'close' })}<div class="pad"><h1 class="big">${su ? '핏센스 시작하기' : '다시 만나서 반가워요'}</h1><p class="sub">${su ? '닉네임은 후기 답글에 표시돼요.' : '로그인하면 후기에 답글을 남기고 기록을 계정에 연결해요.'}</p>
  <div class="mt16">${segHTML(['로그인', '회원가입'], su ? '회원가입' : '로그인', 'auMode')}</div>
  <div class="mt16">${su ? authField('au-n', '닉네임', 'text', 'name', '2~12자', 'maxlength="12"') : ''}${authField('au-e', '이메일', 'email', 'email', 'name@email.com')}${authField('au-p', '비밀번호', 'password', 'pw', su ? PW_RULE : '비밀번호')}${su ? `<div class="hint" style="margin:-8px 0 12px">${PW_RULE} 조합이에요.</div>` : ''}${su ? authField('au-p2', '비밀번호 확인', 'password', 'pw2', '비밀번호를 한 번 더') : ''}</div>
  ${su ? `<button class="row" role="checkbox" aria-checked="${AU.agree}" data-a="auAgree" style="background:none;border:0;padding:6px 0"><span class="cbx ${AU.agree ? 'on' : ''}">${AU.agree ? '✓' : ''}</span><span class="sm ink2">(필수) 이용약관·개인정보 처리방침에 동의해요</span></button>` : ''}
  <button class="btn pri full ${su ? 'mt12' : ''}" data-a="${su ? 'doSignup' : 'doLogin'}">${su ? '가입하기' : '로그인'}</button>
  ${su ? '' : '<div class="row mt12" style="justify-content:center"><button class="link" data-a="toastPw">비밀번호를 잊었어요</button></div>'}
  <div class="card fill hint mt16" style="padding:10px 12px">프로토타입이라 가입 정보는 이 브라우저에만 저장돼요. 로그인 없이도 둘러보고 측정할 수 있어요.</div><button class="btn flat full mt12" data-a="authSkip">로그인 없이 둘러볼게요</button></div>`;
};
V.login = V.auth; V.signup = V.auth;
ACT.goLogin = () => { closeSheet(); AU = newAU(); go('login'); };
ACT.goSignup = () => { AU = newAU(); AU.mode = 'signup'; go('login'); };
CHG.auMode = t => {};
ACT.auMode = t => { const keep = { email: AU.email }; AU = newAU(); AU.email = keep.email; AU.mode = t.dataset.v === '회원가입' ? 'signup' : 'login'; reRender(); };
INP.au = t => { AU[t.dataset.k] = t.value; };
ACT.auAgree = () => { AU.agree = !AU.agree; reRender(); };
ACT.toastPw = () => toast('프로토타입에서는 비밀번호 찾기가 빠져 있어요');
ACT.authSkip = () => authDone();
function authDone() { stack = stack.filter(s => !['login', 'signup'].includes(s.v)); if (!stack.length) stack = [{ v: 'my', p: {} }]; render(); $('#view').scrollTop = 0; }
ACT.doLogin = () => {
  const a = S.account;
  if (!AU.email.trim() || !AU.pw) { toast('이메일과 비밀번호를 입력해 주세요'); return; }
  if (!a) { toast('가입된 계정이 없어요. 회원가입을 해주세요'); return; }
  if (a.email !== AU.email.trim() || a.pw !== AU.pw) { toast('이메일 또는 비밀번호가 맞지 않아요'); return; }
  S.loggedIn = true; save(); toast(`${a.name}님, 환영해요`); authDone();
};
ACT.doSignup = () => {
  const n = AU.name.trim(), e = AU.email.trim();
  if (n.length < 2) { toast('닉네임은 2자 이상 입력해 주세요'); return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { toast('이메일 형식을 확인해 주세요'); return; }
  if (!pwOk(AU.pw)) { toast(`비밀번호는 ${PW_RULE}이어야 해요`); return; }
  if (AU.pw !== AU.pw2) { toast('비밀번호가 서로 달라요'); return; }
  if (!AU.agree) { toast('필수 약관에 동의해 주세요'); return; }
  if (S.account && S.account.email === e) { toast('이미 가입된 이메일이에요. 로그인해 주세요'); return; }
  S.account = { name: n, email: e, pw: AU.pw, joined: today() }; S.loggedIn = true; S.profile.nick = n; save(); toast(`${n}님, 가입을 환영해요`); authDone();
};
ACT.logout = () => { S.loggedIn = false; save(); toast('로그아웃했어요'); reRender(); };
V.withdraw = () => {
  const rows = [['분석·내 옷장 기록', S.records.length + S.closet.length + '건'], ['업로드한 사진', S.photos.length + '장'], ['찜 (상품·브랜드·후기)', S.likes.product.length + S.likes.brand.length + S.likes.review.length + '개'], ['내가 쓴 답글', Object.values(S.replies).flat().length + '개'], ['마이핏(신체 치수)', S.body ? '1건' : '없음']];
  return `${topbar('회원 탈퇴')}<div class="pad"><h1 class="big">정말 떠나시나요?</h1><p class="sub">탈퇴하면 아래 정보가 모두 삭제되고 복구할 수 없어요.</p>
  <div class="card mt16 list">${rows.map(([a, b]) => `<div class="li" style="padding:12px 14px"><span class="sm grow">${a}</span><b class="sm">${b}</b></div>`).join('')}</div>
  <div class="field mt16"><label class="f" for="wd-r">떠나는 이유 <span class="mute b sm">(선택)</span></label><select id="wd-r" class="inp" data-c="wdReason"><option value="">선택해 주세요</option>${['추천이 잘 맞지 않아요', '사용 빈도가 낮아요', '개인정보가 걱정돼요', '원하는 브랜드가 없어요', '기타'].map(x => `<option ${WD.reason === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
  <div class="card fill hint" style="padding:10px 12px">사진·기록만 지우고 싶다면 <button class="link" data-a="goPhotos">사진첩</button>에서 사진별로 삭제하거나, 기록 상세에서 개별 삭제할 수 있어요.</div>
  <button class="row mt16" role="checkbox" aria-checked="${WD.agree}" data-a="wdAgree" style="background:none;border:0;padding:6px 0"><span class="cbx ${WD.agree ? 'on' : ''}">${WD.agree ? '✓' : ''}</span><span class="sm ink2">위 내용을 확인했고 탈퇴에 동의해요</span></button>
  <button class="btn full mt12" data-a="wdAsk" ${WD.agree ? '' : 'disabled'} style="${WD.agree ? 'background:var(--tight);border-color:var(--tight);color:#fff' : ''}">회원 탈퇴</button></div>`;
};
ACT.goWithdraw = () => { WD = { agree: false, reason: '' }; go('withdraw'); };
ACT.wdAgree = () => { WD.agree = !WD.agree; reRender(); };
CHG.wdReason = t => { WD.reason = t.value; };
ACT.wdAsk = () => sheet(`<h3>마지막으로 확인할게요</h3><p class="sub">모든 정보가 삭제돼요. 이 작업은 되돌릴 수 없어요.</p><div class="row mt16"><button class="btn flat grow" data-a="sheetClose">취소</button><button class="btn grow" data-a="wdDo" style="background:var(--tight);border-color:var(--tight);color:#fff">탈퇴하기</button></div>`, true);
ACT.wdDo = () => { ACT.resetAll(); toast('탈퇴가 완료됐어요. 모든 정보를 삭제했어요'); };

/* ---------- 사진첩: 올린 사진을 사진별로 확인·삭제 ---------- */
const PH_KINDS = ['전신', '사이즈표', '착용샷'];
let PH = { kind: '전신', f: '전체' };
V.photos = () => {
  const ls = S.photos.filter(p => PH.f === '전체' || p.kind === PH.f), cnt = k => S.photos.filter(p => p.kind === k).length;
  return `${topbar('사진첩')}<div class="pad" style="padding-bottom:8px"><div class="card fill sm" style="padding:12px 14px">올린 사진은 <b>이 기기에만</b> 저장돼요. 사진마다 따로 지울 수 있고, 지워도 분석 기록은 그대로 남아요.</div>
  <div class="field mt16"><label class="f">올릴 사진 종류</label><div class="chips">${chipsHTML(PH_KINDS, PH.kind, 'phKind')}</div></div>
  <label class="btn pri full" for="phup" style="cursor:pointer">${ico('plus', 'ico')} ${PH.kind} 사진 올리기</label><input id="phup" type="file" accept="image/*" multiple hidden data-c="phUp"></div>
  <div class="tabs t0">${[['전체', `전체 ${S.photos.length}`], ...PH_KINDS.map(k => [k, `${k} ${cnt(k)}`])].map(([k, l]) => `<button class="${PH.f === k ? 'on' : ''}" data-a="phFilter" data-v="${k}">${l}</button>`).join('')}</div>
  ${ls.length ? `<div class="pgal">${ls.map(p => `<div class="pg"><img src="${p.src}" alt="${p.kind} 사진"><span class="pk">${p.kind}</span>${p.id === S.bodyPhotoId ? '<span class="pr">대표</span>' : ''}<button class="px" data-a="phDelAsk" data-v="${p.id}" aria-label="사진 삭제">${ico('close')}</button><div class="pf"><span class="xs">${p.date}</span>${p.kind === '전신' && p.id !== S.bodyPhotoId ? `<button class="xs" data-a="phRep" data-v="${p.id}">대표로</button>` : ''}</div></div>`).join('')}</div>` : `<div class="empty">올린 사진이 없어요<br><span class="sm">위 버튼으로 사진을 올려 보세요</span></div>`}
  <div style="height:24px"></div>`;
};
ACT.phKind = t => { PH.kind = t.dataset.v; reRender(); };
ACT.phFilter = t => { PH.f = t.dataset.v; reRender(); };
const readP = f => new Promise(ok => readPhoto(f, 640, ok));
CHG.phUp = async t => {
  const fs = [...t.files]; let n = 0;
  for (const f of fs) { const d = await readP(f); if (!d) continue; const id = addPhoto(PH.kind, d); n++; if (PH.kind === '전신' && !S.bodyPhotoId) { S.bodyPhoto = d; S.bodyPhotoId = id; } }
  t.value = ''; save(); if (n) toast(`${n}장을 올렸어요`); reRender();
};
ACT.phRep = t => { const p = S.photos.find(x => x.id === t.dataset.v); if (p) { S.bodyPhoto = p.src; S.bodyPhotoId = p.id; save(); toast('대표 전신 사진으로 바꿨어요'); reRender(); } };
ACT.phDelAsk = t => sheet(`<h3>이 사진을 삭제할까요?</h3><p class="sub">삭제하면 되돌릴 수 없어요. 다른 사진은 그대로 유지돼요.</p><div class="row mt16"><button class="btn flat grow" data-a="sheetClose">취소</button><button class="btn pri grow" data-a="phDel" data-v="${t.dataset.v}">삭제</button></div>`, true);
ACT.phDel = t => { delPhoto(t.dataset.v); closeSheet(); toast('사진을 삭제했어요'); reRender(); };
function mkImg(label, hue) {
  const c = document.createElement('canvas'); c.width = 240; c.height = 320; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 240, 320);
  g.addColorStop(0, `hsl(${hue},45%,82%)`); g.addColorStop(1, `hsl(${hue + 40},40%,62%)`); x.fillStyle = g; x.fillRect(0, 0, 240, 320);
  x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.arc(120, 96, 34, 0, 7); x.fill(); x.fillRect(78, 140, 84, 120);
  x.fillStyle = 'rgba(0,0,0,.55)'; x.font = '700 18px sans-serif'; x.textAlign = 'center'; x.fillText(label, 120, 40);
  return c.toDataURL('image/jpeg', .7);
}
function demoPhotos() {
  if (S.photos.length) return;
  const a = addPhoto('전신', mkImg('예시 전신', 210)); S.bodyPhoto = S.photos.find(p => p.id === a).src; S.bodyPhotoId = a;
  addPhoto('사이즈표', mkImg('예시 사이즈표', 30)); addPhoto('착용샷', mkImg('예시 착용샷', 330)); save();
}

/* ---------- 기록(분석 기록 + 직접 추가한 옷을 한 목록으로) ---------- */
/* ---------- 기록: 탭(전체·피드백 필요·분석·옷장) + 검색 · 필터 시트 · 최신/오래된 토글 ---------- */
let RK = '전체', RC = '전체', RQ = '', RSORT = 'new', RFS = { sizes: [], period: '전체' }, RFt = null;
const RK_TABS = ['전체', '분석', '내 옷장'], PERIODS = ['전체', '최근 1개월', '3개월', '6개월', '올해'];
const toISO = d => d.replace(/\./g, '-');
const sizeOfItem = x => x.t === 'a' ? (x.r.fb ? x.r.fb.size : x.r.rec) : x.c.size;
const nameOfItem = x => x.t === 'a' ? (x.r.productName || x.r.brandName) : (x.c.name || '');
const brandOfItem = x => x.t === 'a' ? x.r.brandName : (x.c.brand || '');
function allRecordItems() { return [...S.records.filter(r => !r.moved).map(r => ({ t: 'a', r, d: r.date })), ...S.closet.map(c => ({ t: 'c', c, d: c.date }))]; }
const needFb = x => x.t === 'a' && !x.r.fb;
function inPeriod(d, per) {
  if (per === '전체') return true;
  const n = new Date(toISO(d)), now = new Date(), cut = new Date(now);
  if (per === '최근 1개월') cut.setMonth(now.getMonth() - 1); else if (per === '3개월') cut.setMonth(now.getMonth() - 3); else if (per === '6개월') cut.setMonth(now.getMonth() - 6); else if (per === '올해') { cut.setMonth(0); cut.setDate(1); }
  return n >= cut;
}
function recordItems(opt = {}) {
  const f = { c: RC, sizes: RFS.sizes, period: RFS.period, ...opt };
  const q = RQ.trim();
  return allRecordItems()
    .filter(x => RK === '전체' || (RK === '분석' ? x.t === 'a' : x.t === 'c'))
    .filter(x => f.c === '전체' || (x.t === 'a' ? x.r.cat : x.c.cat) === f.c)
    .filter(x => !f.sizes.length || f.sizes.includes(sizeOfItem(x)))
    .filter(x => inPeriod(x.d, f.period))
    .filter(x => !q || findIn(nameOfItem(x), q) || findIn(brandOfItem(x), q))
    .sort((a, b) => RSORT === 'new' ? b.d.localeCompare(a.d) : a.d.localeCompare(b.d));
}
const rfCount = () => (RC !== '전체' ? 1 : 0) + RFS.sizes.length + (RFS.period !== '전체' ? 1 : 0);
const recPhoto = c => (c.photos && c.photos[0]) ? `<img src="${c.photos[0].src}" alt="착용샷" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">` : c.photo ? `<img src="${c.photo}" alt="착용샷" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">` : '<span>이미지</span>';
const rstars = n => n ? `<span class="rt"><i>★</i> ${n}</span>` : '';
const recInfo = x => x.t === 'a'
  ? { id: x.r.id, act: 'openRecord', c: x.r, brand: x.r.brandName, name: x.r.productName || x.r.brandName, badge: '추천 ' + x.r.rec, kind: '분석', date: x.r.date, fb: x.r.fb, need: !x.r.fb }
  : { id: x.c.id, act: 'closetEdit', c: x.c, brand: x.c.brand || NO_INFO, name: x.c.name || '상품명 없음', badge: '착용 ' + x.c.size, kind: '내 옷장', date: x.c.date, fb: x.c, need: false };
function recordCard(x, v) {
  const i = recInfo(x);
  return `<div class="pcard v${v}"><button class="pcard-b" data-a="${i.act}" data-v="${i.id}"><span class="pimg"><span class="ph">${recPhoto(i.c)}</span><span class="rb pill dark">${esc(i.badge)}</span></span><span class="bn">${esc(i.brand)}</span><span class="nm">${esc(i.name)}</span><span class="rc-s">${i.kind} · ${i.date.slice(5)}</span>${i.need ? '<span class="rc-fb">후기 남기기 ›</span>' : i.fb && i.fb.rating ? `<span class="mt">${rstars(i.fb.rating)}</span>` : ''}</button></div>`;
}
function recordRow(x) {
  const i = recInfo(x);
  return `<button class="li rrow" data-a="${i.act}" data-v="${i.id}" style="padding:13px 16px"><span class="ph" style="width:52px;height:60px;flex:none">${recPhoto(i.c)}</span><span class="grow" style="min-width:0"><span class="sm b" style="display:block">${esc(i.brand)}</span><span class="sm ellip" style="display:block">${esc(i.name)}</span><span class="rc-s">${i.kind} · ${esc(i.badge)} · ${i.date.slice(5)}</span>${i.need ? '<span class="rc-fb">후기 남기기 ›</span>' : ''}</span><span class="chev">›</span></button>`;
}
function recordListHTML() {
  const items = recordItems(), none = !allRecordItems().length;
  const sub = x => `<div class="mshead">${x}</div>`;
  if (!items.length) {
    const filtered = RQ.trim() || rfCount();
    if (filtered) return emptyHTML('', emptyBtn('rfClear', '필터 초기화'));
    if (RK === '내 옷장') return `<div class="empty"><b class="en">아직 내 옷장이 비어 있어요</b><span class="sm">입어본 옷을 기록하면 추천이 더 정확해져요</span><div class="mt12">${emptyBtn('closetNew', '첫 옷 추가하기')}</div></div>`;
    if (RK === '분석' || none) return `<div class="empty"><b class="en">아직 분석 기록이 없어요</b><span class="sm">사이즈를 측정하면 여기에 쌓여요</span><div class="mt12">${emptyBtn('startMeasure', '사이즈 측정하기')}</div></div>`;
    return emptyHTML('', emptyBtn('rfClear', '필터 초기화'));
  }
  const v = S.rview, groups = []; items.forEach(x => { const m = x.d.slice(0, 4) + '년 ' + (+x.d.slice(5, 7)) + '월'; if (!groups.length || groups.at(-1)[0] !== m) groups.push([m, []]); groups.at(-1)[1].push(x); });
  return groups.map(([m, xs]) => sub(m) + (v === 'list' ? xs.map(recordRow).join('') : `<div class="pgrid rec v${v}" style="padding-top:10px">${xs.map(x => recordCard(x, v)).join('')}</div>`)).join('');
}
V.records = () => {
  const nf = allRecordItems().filter(needFb).length, n = recordItems().length, rc = rfCount();
  return `${topbar('기록')}
  <div class="tabs t0" id="rtabs">${RK_TABS.map(k => `<button class="${RK === k ? 'on' : ''}" data-a="rkTab" data-v="${k}">${k}</button>`).join('')}</div>
  <div class="row" style="padding:10px 16px 0;gap:8px"><div class="search grow"><input id="rq" class="inp" data-i="rq" value="${esc(RQ)}" placeholder="상품명·브랜드 검색" autocomplete="off">${ico('search')}</div><button class="btn flat fbtn" data-a="rfOpen" aria-label="필터">${ico('filter')}${rc ? `<span class="badge" style="position:absolute;right:-4px;top:-4px;background:var(--tight);color:#fff">${rc}</span>` : ''}</button></div>
  <div style="padding:10px 0 0"><div class="chips scroll" style="padding:0 16px">${chipsHTML(['전체', ...CATS], RC, 'rcCat')}</div></div>
  <div class="row between" style="padding:10px 16px 2px"><span class="sm mute" id="rcnt">${n}개</span><span class="row" style="gap:10px"><span class="viewtg" role="group" aria-label="보기 방식">${[['4', '4', '4열'], ['3', '3', '3열'], ['list', '☰', '리스트']].map(([k, g, l]) => `<button class="${S.rview === k ? 'on' : ''}" data-a="rView" data-v="${k}" aria-label="${l}">${g}</button>`).join('')}</span><button class="sorttg" data-a="rSort" aria-label="정렬 바꾸기">${RSORT === 'new' ? '최신순' : '오래된순'} ⇅</button></span></div>
  <div id="rlist">${recordListHTML()}</div>
  <button class="btn pri fab round" data-a="closetNew" aria-label="내 옷장에 추가">+</button>`;
};
const rRefresh = () => { const l = $('#rlist'); if (l) { l.innerHTML = recordListHTML(); $('#rcnt').textContent = recordItems().length + '개'; syncCars(); } };
INP.rq = t => { RQ = t.value; rRefresh(); };
ACT.rView = t => { S.rview = t.dataset.v; save(); reRender(); };
ACT.rkTab = t => { RK = t.dataset.v; reRender(); };
ACT.rcCat = t => { RC = t.dataset.v; reRender(); };
ACT.rSort = () => { RSORT = RSORT === 'new' ? 'old' : 'new'; reRender(); };
ACT.rfClear = () => { RC = '전체'; RQ = ''; RFS = { sizes: [], period: '전체' }; reRender(); };
ACT.rfOpen = () => { RFt = { c: RC, sizes: [...RFS.sizes], period: RFS.period }; rfSheet(); };
function rfSheet() {
  const base = allRecordItems(), n = recordItems({ c: RFt.c, sizes: RFt.sizes, period: RFt.period }).length;
  const has = s => base.some(x => sizeOfItem(x) === s);
  const ch = (arr, on, a, zero) => arr.map(x => `<button class="chip ${(Array.isArray(on) ? on.includes(x) : on === x) ? 'on' : ''} ${zero && zero(x) ? 'zero' : ''}" data-a="${a}" data-v="${esc(x)}">${esc(x)}</button>`).join('');
  sheet(`<h3>필터</h3><div class="mt16">
    <div class="field"><label class="f">카테고리</label><div class="chips">${ch(['전체', ...CATS], RFt.c, 'rfT')}</div></div>
    <div class="field"><label class="f">내가 입은 사이즈 <span class="mute b sm">(기록이 없는 사이즈는 흐리게)</span></label><div class="chips">${ch(SZ_WIDE, RFt.sizes, 'rfSz', x => !has(x))}</div></div>
    <div class="field"><label class="f">기간</label><div class="chips">${ch(PERIODS, RFt.period, 'rfPer')}</div></div></div>
  <div class="row mt16"><button class="btn flat" data-a="rfReset" style="width:96px">초기화</button><button class="btn pri grow" data-a="rfApply">${n}개 보기</button></div>`);
}
const rfKeep = f => { const sc = $('#scrim .sheet'), y = sc ? sc.scrollTop : 0; f(); rfSheet(); const s2 = $('#scrim .sheet'); if (s2) s2.scrollTop = y; };
ACT.rfT = t => rfKeep(() => { RFt.c = t.dataset.v; });
ACT.rfSz = t => rfKeep(() => { const v = t.dataset.v; RFt.sizes = RFt.sizes.includes(v) ? RFt.sizes.filter(x => x !== v) : [...RFt.sizes, v]; });
ACT.rfPer = t => rfKeep(() => { RFt.period = t.dataset.v; });
ACT.rfReset = () => { RFt = { c: '전체', sizes: [], period: '전체' }; rfSheet(); };
ACT.rfApply = () => { RC = RFt.c; RFS = { sizes: RFt.sizes, period: RFt.period }; closeSheet(); reRender(); };
ACT.openRecord = t => { RE = false; RT = 'viz'; go('result', { rid: t.dataset.v }); };
function recordFeedbackHTML(A) {
  const f = A.fb;
  return `<div class="card mt16" style="padding:14px"><div class="row between"><b>착용 피드백</b>${f ? '<span class="pill ok">기록됨</span>' : '<span class="pill gray">미작성</span>'}</div>
  ${f ? `<p class="sm" style="margin:8px 0 0">실제 <b>${esc(f.size)}</b> 사이즈 · 전체 <b>${esc(f.overall)}</b>${Object.keys(f.parts).length ? '<br>' + Object.entries(f.parts).map(([k, v]) => k + ' ' + v).join(' · ') : ''}${f.memo ? '<br><span class="mute">' + esc(f.memo) + '</span>' : ''}</p>${(f.photos || []).length ? `<div class="pslots" style="margin-top:8px">${f.photos.map(p => `<div class="slot has"><img src="${p.src}" alt="착용 사진"></div>`).join('')}</div>` : ''}${(f.kw || []).length ? `<div class="kws" style="margin-top:8px">${f.kw.map(k => `<span class="kw">#${esc(k)}</span>`).join('')}</div>` : ''}` : `<p class="sm mute" style="margin:8px 0 0">실제로 입어본 느낌을 남기면 다음 추천이 더 정확해져요.</p>`}
  <button class="btn ${f ? 'flat' : 'pri'} full mt12" data-a="fbOpen" data-v="${A.id}">${f ? '피드백 수정' : '피드백 남기기'}</button></div>
  <button class="link mt16" data-a="recDelAsk" data-v="${A.id}">이 기록 삭제</button>`;
}
ACT.recDelAsk = t => sheet(`<h3>기록을 삭제할까요?</h3><p class="sub">삭제하면 되돌릴 수 없어요.</p><div class="row mt16"><button class="btn flat grow" data-a="sheetClose">취소</button><button class="btn pri grow" data-a="recDel" data-v="${t.dataset.v}">삭제</button></div>`, true);
ACT.recDel = t => { S.records = S.records.filter(r => r.id !== t.dataset.v); save(); closeSheet(); toast('삭제했어요'); back(); };

/* 피드백/직접 추가 공용 폼 */
const CLOSET_PARTS = { 상의: ['가슴', '어깨', '소매', '총장', '허리'], 아우터: ['가슴', '어깨', '소매', '총장'], 하의: ['허리', '힙', '허벅지', '총장'], 원피스: ['가슴', '어깨', '허리', '총장'] };
const PART_OPT = k => ['소매', '총장'].includes(k) ? ['짧음', '적당', '김'] : ['타이트', '적당', '여유'];
let FB = null;
const newFB = cat => ({ brandId: null, brandFree: false, nameFree: false, productId: null, color: '', colorFree: '', rating: 0, pub: true, size: 'M', overall: '정핏', parts: {}, kw: [], memo: '', photos: [], link: '', brand: '', name: '', cat: cat || '상의' });
const MAXPH = 10;
const migrateFB = o => { if (!o.photos) o.photos = o.photo ? [{ id: o.photoId || null, src: o.photo }] : []; delete o.photo; delete o.photoId; return o; };
const formDirty = () => { const v = stack.at(-1).v; if (v === 'closetAdd') return !!(FB.brand || FB.name || FB.color || FB.rating || FB.kw.length || FB.photos.length || FB.memoEdited); if (v === 'feedback') return !!(FB.color || FB.rating || FB.kw.length || FB.photos.length || FB.memoEdited); return false; };
ACT.backConfirm = () => { if (!formDirty()) { back(); return; } sheet(`<h3>작성 중인 내용이 있어요</h3><p class="sub" style="margin:6px 0 14px">지금 나가면 입력한 내용이 저장되지 않아요.</p><div class="row" style="gap:8px"><button class="btn flat full" data-a="sheetClose">계속 작성</button><button class="btn pri full" data-a="leaveForm">나가기</button></div>`); };
ACT.leaveForm = () => { closeSheet(); back(); };
const AC = {}; const AC_RESET = () => { Object.keys(AC).forEach(k => delete AC[k]); };
const accHTML = (id, title, opt, sum, body, def) => { const o = id in AC ? AC[id] : def; return `<div class="acc2 field"><button class="acch" data-a="acc" data-v="${id}" aria-expanded="${o}"><span class="grow"><b class="f">${title}</b>${opt ? ` <span class="mute b sm">${opt}</span>` : ''}${!o && sum ? `<span class="accs">${sum}</span>` : ''}</span><span class="accc">${o ? '접기' : '펼치기'}</span></button>${o ? `<div class="accb">${body}</div>` : ''}</div>`; };
ACT.acc = t => { const id = t.dataset.v; AC[id] = !(id in AC ? AC[id] : t.getAttribute('aria-expanded') === 'true'); reRender(); };
const BASE_COLORS = ['블랙', '화이트', '그레이', '네이비', '베이지', '브라운', '카키', '블루', '레드', '핑크', '그린', '옐로우', '퍼플', '오렌지'];
const colorOpts = () => { const p = FB.productId && prodById[FB.productId]; return p && p.col && p.col.length ? p.col : BASE_COLORS; };
function colorHTML() {
  const dbc = !!(FB.productId && prodById[FB.productId]?.col?.length);
  const list = dbc ? colorOpts() : [...colorOpts(), '기타'];
  return `<div class="field"><label class="f">색상${FB.reqColor ? ' <span class="pill tight">필수</span>' : ' <span class="mute b sm">(선택)</span>'}</label><div class="swatches">${list.map(c => `<button class="swb ${FB.color === c ? 'on' : ''}" data-a="fbColor" data-v="${esc(c)}" aria-label="${esc(c)}" aria-pressed="${FB.color === c}"><i class="swc ${c === '기타' ? 'etc' : ''} ${['화이트', '아이보리'].includes(c) ? 'lt' : ''}" style="${c === '기타' ? '' : `background:${COLOR_HEX[c] || '#bbb'}`}">${c === '기타' ? '+' : ''}</i><span>${esc(c)}</span></button>`).join('')}</div>${FB.color === '기타' ? `<input class="inp mt8" data-i="cF" data-k="colorFree" value="${esc(FB.colorFree || '')}" placeholder="색상을 직접 입력해 주세요">` : ''}</div>`;
}
ACT.fbColor = t => { FB.color = FB.color === t.dataset.v ? '' : t.dataset.v; reRender(); };
const starsHTML = () => `<div class="field"><label class="f">만족도 <span class="mute b sm">(선택)</span></label><div class="stars">${[1, 2, 3, 4, 5].map(n => `<button class="${(FB.rating || 0) >= n ? 'on' : ''}" data-a="fbStar" data-v="${n}" aria-label="${n}점">★</button>`).join('')}<span class="sm mute" style="margin-left:8px">${FB.rating ? FB.rating + '점' : '선택 안 함'}</span></div></div>`;
ACT.fbStar = t => { const n = +t.dataset.v; FB.rating = FB.rating === n ? 0 : n; reRender(); };
function kwPickerHTML() {
  const sum = FB.kw.length ? FB.kw.slice(0, 3).map(k => `<span class="chip kwc on xs">#${esc(k)}</span>`).join('') + (FB.kw.length > 3 ? ` <span class="xs mute">외 ${FB.kw.length - 3}개</span>` : '') : '<span class="xs mute">선택한 키워드 없음</span>';
  return accHTML('kw', '키워드', `(선택 · ${FB.kw.length}개 선택)`, sum, `<div class="card" style="padding:4px 12px 10px">${KW.map(g => `<div class="sublabel" style="margin-top:10px">${g.g}</div><div class="chips">${g.k.map(k => `<button class="chip kwc ${FB.kw.includes(k) ? 'on' : ''}" data-a="fbKw" data-v="${esc(k)}">#${esc(k)}</button>`).join('')}</div>`).join('')}</div>`, false);
}
function photoPickerHTML() {
  const n = FB.photos.length;
  return `<div class="field"><label class="f">사진 <span class="mute b sm">(선택 · ${n}/${MAXPH}장)</span></label><div class="pslots" id="fbph">${FB.photos.map(p => `<div class="slot has"><img src="${p.src}" alt="기록 사진"><button class="x" data-a="fbPhDel" data-v="${p.id || ''}" aria-label="사진 삭제">✕</button></div>`).join('')}${n < MAXPH ? `<label class="slot" for="fbphin">${ico('plus', 'ico')}<span>사진 추가</span></label>` : ''}</div><input id="fbphin" type="file" accept="image/*" multiple hidden data-c="fbPhUp"></div>`;
}
function fitFormHTML(parts, o = {}) {
  if (!FB.memoEdited && !FB.memo) FB.memo = autoMemo();
  const psum = Object.entries(FB.parts).map(([k, v]) => `${k} ${v}`).join(' · ') || '<span class="xs mute">선택 안 함</span>';
  const pbody = `<div class="card" style="padding:2px 12px">${parts.map(k => `<div class="row between" style="padding:9px 0;border-bottom:1px solid var(--line)"><span class="sm b" style="width:48px">${k}</span><div style="flex:1;max-width:210px">${(() => { const o = PART_OPT(k); return `<div class="seg sm">${o.map(x => `<button class="${FB.parts[k] === x ? 'on' : ''}" data-a="fbPart" data-v="${k}|${x}">${x}</button>`).join('')}</div>`; })()}</div></div>`).join('')}</div>`;
  return `${photoPickerHTML()}<div class="field"><label class="f">어떤 사이즈를 입으셨나요?</label><div class="chips scroll" id="fbsz">${chipsHTML(SZ_WIDE, FB.size, 'fbSize')}</div></div>
  <div class="field"><label class="f">전체적으로 어땠나요?</label>${segHTML(['작음', '정핏', '여유'], FB.overall, 'fbOverall')}</div>
  ${colorHTML()}${starsHTML()}
  ${accHTML('parts', '부위별로는 어땠나요?', '(선택)', psum, pbody, false)}
  ${kwPickerHTML()}
  <div class="field"><label class="f" for="fb-m">한마디 남겨주세요 <span class="mute b sm">(선택 · 고른 내용으로 자동 작성돼요)</span></label><textarea id="fb-m" class="inp" data-i="fbMemo" placeholder="예: 허리는 맞는데 팔이 길어요. 세탁 후 줄었어요.">${esc(FB.memo)}</textarea>${FB.memoEdited ? '<button class="link mt8" data-a="fbMemoReset">선택한 내용으로 다시 만들기</button>' : ''}</div>`;
}
CHG.fbPhUp = async t => {
  const fs = [...t.files].slice(0, MAXPH - FB.photos.length); let n = 0;
  for (const f of fs) { const d = await readP(f); if (!d) continue; FB.photos.push({ id: addPhoto('착용샷', d), src: d }); n++; }
  if (t.files.length > fs.length) toast(`사진은 최대 ${MAXPH}장까지 넣을 수 있어요`);
  t.value = ''; save(); const sc = $('#view').scrollTop; reRender(); $('#view').scrollTop = sc;
};
ACT.fbPhDel = t => { const id = t.dataset.v; const i = FB.photos.findIndex(p => p.id === id); if (i >= 0) { if (id) delPhoto(id); FB.photos.splice(i, 1); } reRender(); };
ACT.fbSize = t => { FB.size = t.dataset.v; autoMemoSync(); const sc = $('#fbsz'), x = sc ? sc.scrollLeft : 0; reRender(); const n = $('#fbsz'); if (n) n.scrollLeft = x; };
ACT.fbOverall = t => { FB.overall = t.dataset.v; autoMemoSync(); reRender(); };
ACT.fbPart = t => { const [k, v] = t.dataset.v.split('|'); FB.parts[k] = FB.parts[k] === v ? undefined : v; if (FB.parts[k] === undefined) delete FB.parts[k]; autoMemoSync(); reRender(); };
ACT.fbKw = t => {
  const k = t.dataset.v, had = FB.kw.includes(k);
  FB.kw = FB.kw.filter(x => x !== k); if (!had) FB.kw.push(k);
  const sc = $('#view').scrollTop; reRender(); $('#view').scrollTop = sc;
};
INP.fbMemo = t => { FB.memo = t.value; FB.memoEdited = !!t.value; };
const autoMemo = () => {
  const ps = Object.entries(FB.parts || {}).map(([k, v]) => `${k}은(는) ${v}`);
  return `${FB.size} 사이즈로 입었고, 전체적으로 ${({ 작음: '작은 편', 정핏: '딱 맞는 정핏', 여유: '여유 있는 편' })[FB.overall] || FB.overall}이에요.` + (ps.length ? ` ${ps.join(', ')}했어요.` : '');
};
const autoMemoSync = () => { if (!FB.memoEdited) FB.memo = autoMemo(); };
ACT.fbMemoReset = () => { FB.memoEdited = false; FB.memo = autoMemo(); reRender(); };
ACT.fbOpen = t => { const A = S.records.find(r => r.id === t.dataset.v); AC_RESET(); FB = A.fb ? { ...newFB(A.cat), ...migrateFB({ kw: [], ...JSON.parse(JSON.stringify(A.fb)) }), memoEdited: !!A.fb.memo } : { ...newFB(A.cat), size: A.rec }; FB.productId = A.productId || null; go('feedback', { rid: A.id }); };
V.feedback = p => { const A = S.records.find(r => r.id === p.rid); return `${topbar('착용 피드백', { left: 'close' })}<div class="pad"><div class="card fill row" style="padding:12px 14px;gap:10px"><div class="grow"><b class="sm ellip" style="display:block">${esc(A.productName || A.brandName)}</b><span class="xs mute">추천 ${A.rec} · ${A.date}</span></div></div><div class="mt16">${fitFormHTML(CLOSET_PARTS[A.cat])}</div></div><div class="dock"><button class="btn pri full" data-a="fbSave" data-v="${A.id}">저장</button></div>`; };
ACT.fbSave = t => { const A = S.records.find(r => r.id === t.dataset.v); const first = !A.moved; A.fb = { color: FB.color === '기타' ? (FB.colorFree || '기타') : FB.color, rating: FB.rating || 0, size: FB.size, overall: FB.overall, parts: FB.parts, kw: FB.kw, memo: FB.memo, photos: FB.photos, date: today() }; moveToCloset(A); save(); toast(first ? '피드백을 저장했어요 · 내 옷장으로 옮겨졌어요' : '피드백을 수정했어요'); back(); };

/* ---------- 직접 추가한 옷 ---------- */
ACT.closetNew = () => { AC_RESET(); FB = newFB(); FB.reqColor = true; go('closetAdd', {}); };
ACT.closetEdit = t => { AC_RESET(); const c = S.closet.find(c => c.id === t.dataset.v); FB = { ...newFB(c.cat), ...migrateFB({ kw: [], ...JSON.parse(JSON.stringify(c)) }) }; FB.reqColor = true; if (FB.brand && !FB.brandId) { const b = BR.find(x => x.n === FB.brand); if (b) FB.brandId = b.id; else FB.brandFree = true; } if (FB.name && !FB.productId) FB.nameFree = true; go('closetAdd', { id: t.dataset.v }); };
const cbBrandList = () => {
  const q = FB.brand || '', hits = BR.filter(b => !q.trim() || findIn(b.n, q) || findIn(b.en, q)).slice(0, 6);
  return hits.map(b => `<button data-a="cbPickB" data-v="${b.id}"><span class="logo im" style="width:34px;height:34px;border-radius:9px">이미지</span><span class="grow"><b>${hl(b.n, q)}</b> <span class="xs mute">${esc(b.en)}</span></span></button>`).join('') + `<button data-a="cbFreeB"><span class="logo" style="width:34px;height:34px;font-size:16px;border-radius:9px">+</span><span class="grow"><b>기타 (직접 입력)</b></span></button>`;
};
const cbProdList = () => {
  const q = FB.name || '', hits = PR.filter(p => p.b === FB.brandId && p.c === FB.cat && (!q.trim() || findIn(p.n, q))).slice(0, 6);
  return hits.map(p => `<button data-a="cbPickP" data-v="${p.id}"><span class="ph" style="width:34px;height:40px;flex:none"><span>이미지</span>${pimg(p.id)}</span><span class="grow"><b>${hl(p.n, q)}</b></span><span class="xs mute">${won(p.pr)}</span></button>`).join('') + `<button data-a="cbFreeP"><span class="logo" style="width:34px;height:34px;font-size:16px;border-radius:9px">+</span><span class="grow"><b>기타 (직접 입력)</b></span></button>`;
};
window.cbShow = k => { const l = $('#cb-' + k); if (!l) return; l.className = 'ta-list'; l.hidden = false; l.innerHTML = k === 'b' ? cbBrandList() : cbProdList(); };
document.addEventListener('click', e => { ['b', 'p'].forEach(k => { const l = $('#cb-' + k); if (l && !l.hidden && !e.target.closest('#cb-' + k) && e.target.id !== 'c-' + (k === 'b' ? 'b' : 'n')) l.hidden = true; }); });
INP.cBq = t => { FB.brand = t.value; if (!FB.brandFree) { FB.brandId = null; FB.productId = null; FB.nameFree = false; cbShow('b'); } };
INP.cNq = t => { FB.name = t.value; FB.productId = null; cbShow('p'); };
ACT.cbPickB = t => { const b = brandById[t.dataset.v]; FB.brandId = b.id; FB.brand = b.n; FB.brandFree = false; FB.productId = null; FB.name = ''; FB.nameFree = false; reRender(); };
ACT.cbFreeB = () => { FB.brandFree = true; FB.brandId = null; FB.brand = ''; FB.productId = null; FB.nameFree = true; reRender(); const i = $('#c-b'); if (i) i.focus(); };
ACT.cbBackB = () => { FB.brandFree = false; FB.brand = ''; FB.nameFree = false; FB.name = ''; reRender(); };
ACT.cbPickP = t => { const p = prodById[t.dataset.v]; FB.productId = p.id; FB.name = p.n; FB.nameFree = false; FB.link = ''; if (FB.color && !colorOpts().includes(FB.color)) FB.color = ''; reRender(); };
ACT.cbFreeP = () => { FB.nameFree = true; FB.productId = null; FB.name = ''; reRender(); const i = $('#c-n'); if (i) i.focus(); };
ACT.cbBackP = () => { FB.nameFree = false; FB.name = ''; reRender(); };
V.closetAdd = p => `${topbar(p.id ? '내 옷장 수정' : '내 옷장에 추가', { left: 'close' })}<div class="pad">
  <div class="field"><label class="f">옷 종류</label><div class="chips">${chipsHTML(CATS, FB.cat, 'cCat')}</div></div>
  <div class="field" style="position:relative"><label class="f" for="c-b">브랜드</label><div class="search"><input id="c-b" class="inp" autocomplete="off" placeholder="${FB.brandFree ? '브랜드명을 직접 입력해 주세요' : '브랜드 검색 (초성 가능 · 예: ㅇㄴㅋㄹ)'}" data-i="cBq" value="${esc(FB.brand)}" ${FB.brandFree ? '' : 'onfocus="cbShow(\'b\')"'}>${ico('search')}</div><div id="cb-b" hidden></div>${FB.brandFree ? '<button class="link mt8" data-a="cbBackB">목록에서 고르기</button>' : ''}</div>
  <div class="field" style="position:relative"><label class="f" for="c-n">상품 ${FB.brandId && !FB.nameFree ? '' : '<span class="mute b sm">(선택)</span>'}</label>${FB.brandId && !FB.nameFree ? `<div class="search"><input id="c-n" class="inp" autocomplete="off" placeholder="상품 검색" data-i="cNq" value="${esc(FB.name)}" onfocus="cbShow('p')">${ico('search')}</div><div id="cb-p" hidden></div>` : `<input id="c-n" class="inp" data-i="cF" data-k="name" value="${esc(FB.name)}" placeholder="예: 옥스포드 셔츠">${FB.brandId ? '<button class="link mt8" data-a="cbBackP">목록에서 고르기</button>' : ''}`}</div>
  ${FB.productId ? `<div class="card fill row" style="padding:10px 12px;gap:10px;margin-bottom:16px"><span class="ph" style="width:40px;height:48px;flex:none"><span>이미지</span>${pimg(FB.productId)}</span><span class="grow sm"><b>${esc(prodById[FB.productId].n)}</b><br><span class="mute">등록된 상품이에요 · ${won(prodById[FB.productId].pr)}</span></span></div>` : `<div class="field"><label class="f" for="c-l">상품 페이지 링크 <span class="mute b sm">(선택)</span></label><input id="c-l" class="inp" type="url" inputmode="url" data-i="cF" data-k="link" value="${esc(FB.link || '')}" placeholder="https://"></div>`}
  ${fitFormHTML(CLOSET_PARTS[FB.cat])}
  <div class="field"><label class="f">후기 공개</label>${FB.productId ? `${segHTML(['다른 사람에게도 공개', '나만 보기'], FB.pub ? '다른 사람에게도 공개' : '나만 보기', 'cPub')}<div class="hint">공개하면 이 상품의 후기에 함께 보여요. 키·몸무게는 프로필 설정을 따라요.</div>` : '<div class="card fill sm" style="padding:10px 12px">직접 입력한 상품은 나만 볼 수 있어요. 운영팀이 상품을 등록하면 공개로 바꿀 수 있어요.</div>'}</div>
  ${p.id ? '<button class="link" data-a="cDel" data-v="' + p.id + '">이 기록 삭제</button>' : ''}</div>
  <div class="dock"><button class="btn pri full" data-a="cSave" data-v="${p.id || ''}">저장</button></div>`;
ACT.cPub = t => { FB.pub = t.dataset.v !== '나만 보기'; reRender(); };
ACT.cCat = t => { FB.cat = t.dataset.v; FB.parts = {}; FB.productId = null; if (!FB.nameFree) FB.name = ''; FB.color = ''; reRender(); };
INP.cF = t => { FB[t.dataset.k] = t.value; };
ACT.cSave = t => {
  if (!FB.brand.trim() && !FB.name.trim()) { toast('브랜드나 상품명을 입력해 주세요'); return; }
  if (!FB.color) { toast('색상을 골라 주세요'); return; }
  const id = t.dataset.v; const item = { ...JSON.parse(JSON.stringify(FB)), id: id || 'C' + Date.now(), date: id ? FB.date : today() };
  if (item.color === '기타') item.color = item.colorFree || '기타';
  item.pub = !!(item.productId && item.pub); delete item.reqColor;
  if (id) S.closet = S.closet.map(c => c.id === id ? item : c); else S.closet.unshift(item);
  save(); toast('저장했어요'); back();
};
ACT.cDel = t => { const c = S.closet.find(x => x.id === t.dataset.v); (c?.photos || []).forEach(p => p.id && delPhoto(p.id)); if (c?.photoId) delPhoto(c.photoId); S.closet = S.closet.filter(x => x.id !== t.dataset.v); save(); toast('삭제했어요'); back(); };

/* ---------- 알림 (날짜별 · 종류 필터) ---------- */
const NF_TABS = ['전체', '좋아요', '답글', '문의', '찜'], NF_TYPE = { like: '좋아요', reply: '답글', inquiry: '문의', wish: '찜' };
let NFK = '전체';
const dstr = n => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
function ensureNotifs() {
  if (S.notifs) return;
  const ps = PR.filter(p => p.c !== '신발').slice(0, 6), pn = i => (ps[i % ps.length] || {}).n || '상품', pid = i => (ps[i % ps.length] || {}).id;
  S.notifs = [
    { id: 'N1', type: 'like', d: dstr(0), t: '14:20', read: false, text: '<b>민트초코</b>님이 내 후기를 좋아해요', sub: pn(0), pid: pid(0) },
    { id: 'N2', type: 'reply', d: dstr(0), t: '09:05', read: false, text: '<b>한강러닝</b>님이 내 후기에 답글을 남겼어요', sub: '“저도 M이 딱 맞았어요”', pid: pid(1) },
    { id: 'N3', type: 'like', d: dstr(1), t: '21:40', read: false, text: '<b>오늘도핏</b>님 외 2명이 내 후기를 좋아해요', sub: pn(2), pid: pid(2) },
    { id: 'N4', type: 'reply', d: dstr(1), t: '12:11', read: true, text: '<b>고양이집사</b>님이 내 후기에 답글을 남겼어요', sub: '“허리는 한 치수 업이 나을까요?”', pid: pid(3) },
    { id: 'N5', type: 'inquiry', d: dstr(2), t: '16:30', read: true, text: '문의하신 브랜드 추가 요청이 <b>검토 중</b>으로 바뀌었어요', sub: '', pid: null },
    { id: 'N6', type: 'wish', d: dstr(3), t: '10:02', read: true, text: '찜한 상품에 새 후기가 올라왔어요', sub: pn(4), pid: pid(4) },
    { id: 'N7', type: 'like', d: dstr(5), t: '19:48', read: true, text: '<b>민트초코</b>님이 내 후기를 좋아해요', sub: pn(5), pid: pid(5) }
  ];
}
const pushNotif = (type, text, sub, pid) => { if (S.nset[type] === false) return; ensureNotifs(); const n = new Date(); S.notifs.unshift({ id: 'N' + Date.now(), type, d: dstr(0), t: String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0'), read: false, text, sub: sub || '', pid: pid || null }); };
ACT.goNotifs = () => { NFK = '전체'; if (stack.at(-1).v !== 'notifs') go('notifs'); };
const nfLabel = d => d === dstr(0) ? '오늘' : d === dstr(1) ? '어제' : `${+d.slice(5, 7)}월 ${+d.slice(8, 10)}일`;
V.notifs = () => {
  ensureNotifs();
  const all = S.notifs, items = all.filter(n => NFK === '전체' || NF_TYPE[n.type] === NFK).sort((a, b) => (b.d + b.t).localeCompare(a.d + a.t));
  let last = '', out = '';
  items.forEach(n => {
    if (n.d !== last) { out += `<div class="mshead">${nfLabel(n.d)}</div>`; last = n.d; }
    out += `<button class="li nrow ${n.read ? '' : 'unread'}" data-a="nfOpen" data-v="${n.id}" style="padding:13px 16px">${n.read ? '<i class="rdot off"></i>' : '<i class="rdot"></i>'}<span class="ph" style="width:44px;height:52px;flex:none"><span>이미지</span></span><span class="grow" style="min-width:0"><span class="pill gray">${NF_TYPE[n.type]}</span> <span class="sm">${n.text}</span>${n.sub ? `<span class="sm mute ellip" style="display:block;margin-top:2px">${esc(n.sub).replace(/&quot;/g, '"')}</span>` : ''}<span class="xs mute" style="display:block">${n.t}</span></span></button>`;
  });
  const empty = !all.length ? `<div class="empty"><b class="en">아직 알림이 없어요</b><span class="sm">후기에 좋아요나 답글이 달리면 알려드려요</span></div>` : emptyHTML('', emptyBtn('nfTab', '전체 보기', 'data-v="전체"'));
  return `${topbar('알림')}
  <div style="padding:10px 0 4px"><div class="chips scroll" style="padding:0 16px">${NF_TABS.map(k => { const c = all.filter(n => !n.read && (k === '전체' || NF_TYPE[n.type] === k)).length; return `<button class="chip ${NFK === k ? 'on' : ''}" data-a="nfTab" data-v="${k}">${k}${c ? ` <span class="nfc">${c}</span>` : ''}</button>`; }).join('')}</div></div>
  <div class="row between" style="padding:4px 16px 8px"><span class="sm mute">읽지 않은 알림 ${all.filter(n => !n.read).length}개</span>${all.some(n => !n.read) ? '<button class="link" data-a="nfReadAll">모두 읽음</button>' : ''}</div>
  <div>${items.length ? out : empty}</div>`;
};
ACT.nfTab = t => { NFK = t.dataset.v; reRender(); };
ACT.nfReadAll = () => { S.notifs.forEach(n => n.read = true); save(); reRender(); };
ACT.nfOpen = t => { const n = S.notifs.find(x => x.id === t.dataset.v); if (!n) return; n.read = true; save(); if (n.type === 'inquiry') { go('inquiries'); return; } if (n.pid && prodById[n.pid]) { ACT.openProduct({ dataset: { v: n.pid } }); return; } reRender(); };

/* ---------- 찜 · 최근 본 (상단 ♡ 버튼으로 진입) ---------- */
V.likes = p => {
  const k = p.tab || 'product', L = S.likes;
  const row = (act, id, inner, kind, lid, lead) => `<div class="li" style="padding-right:4px"><button class="row grow" style="background:none;border:0;padding:0;text-align:left;min-width:0;gap:12px" data-a="${act}" data-v="${esc(id)}">${lead}<span class="grow" style="min-width:0">${inner}</span></button>${heartBtn(kind, lid, 'ib heart')}</div>`;
  const lists = {
    product: () => L.product.map(id => prodById[id]).filter(Boolean).map(pr => row('openProduct', pr.id, `<span class="xs mute">${esc(brandById[pr.b].n)}</span><b class="sm" style="display:block">${esc(pr.n)}</b><span class="sm num">${won(pr.pr)}</span>`, 'product', pr.id, `<span class="ph" style="width:52px;height:64px;flex:none"><span>이미지</span></span>`)).join(''),
    brand: () => L.brand.map(id => brandById[id]).filter(Boolean).map(b => row('openBrand', b.id, `<b>${esc(b.n)}</b><span class="sm mute" style="display:block">${esc(b.en)}</span>`, 'brand', String(b.id), `<span class="logo im">이미지</span>`)).join(''),
    review: () => L.review.map(id => RV.find(r => r.id === id)).filter(Boolean).map(r => { const u = DB.U[r.u], pr = prodById[r.p]; return row('openReview', r.id, `<span class="xs mute">${esc(pr.n)}</span><span style="display:block" class="sm"><b>키 ${u[0]} · ${u[1]}kg</b> · ${r.sz}→${r.fs} ${stars(r.rt)}</span><span class="sm mute" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(r.t)}</span>`, 'review', r.id, ''); }).join('')
  };
  const body = lists[k]();
  return `${topbar('찜', { right: '<button class="link" data-a="goRecent" style="padding-right:12px;text-decoration:none">최근 본 ›</button>' })}<div class="tabs">${[['product', `상품 ${L.product.length}`], ['brand', `브랜드 ${L.brand.length}`], ['review', `후기 ${L.review.length}`]].map(([a, l]) => `<button class="${k === a ? 'on' : ''}" data-a="lkTab" data-v="${a}">${l}</button>`).join('')}</div>${body ? `<div class="list">${body}</div>` : `<div class="empty">담아둔 ${{ product: '상품', brand: '브랜드', review: '후기' }[k]}이 없어요<br><span class="sm">하트를 눌러 담아보세요</span></div>`}`;
};
ACT.lkTab = t => { stack.at(-1).p.tab = t.dataset.v; reRender(); };
V.recent = () => `${topbar('최근 본 상품', { right: S.recent.length ? '<button class="link" data-a="recentClear" style="padding-right:12px">비우기</button>' : '' })}${S.recent.length ? `<div class="list">${S.recent.map(id => prodById[id]).filter(Boolean).map(pr => `<button class="li" data-a="openProduct" data-v="${pr.id}"><span class="ph" style="width:52px;height:64px;flex:none"><span>이미지</span></span><span class="grow" style="min-width:0"><span class="xs mute">${esc(brandById[pr.b].n)}</span><b class="sm" style="display:block">${esc(pr.n)}</b><span class="sm num">${won(pr.pr)}</span></span></button>`).join('')}</div>` : `<div class="empty">최근 본 상품이 없어요</div>`}`;
ACT.recentClear = () => { S.recent = []; save(); reRender(); };

/* 착용 피드백을 남긴 분석 기록은 내 옷장으로 옮긴다(분석 상세에서는 계속 볼 수 있고, 기록 목록에는 내 옷장 항목으로만 보여요) */
function moveToCloset(A) {
  if (!A || !A.fb) return;
  const f = A.fb, ph = (f.photos || []).map(p => ({ ...p })), p = A.productId ? prodById[A.productId] : null;
  const item = { ...newFB(A.cat), brandId: A.brandId || null, brand: A.brandName || '', name: A.productName || '', productId: A.productId || null, color: f.color || '', rating: f.rating || 0,
    pub: !!(A.productId && (S.closet.find(c => c.fromRecord === A.id) || { pub: true }).pub), size: f.size || A.rec, overall: f.overall || '정핏', parts: { ...(f.parts || {}) }, kw: [...(f.kw || [])], memo: f.memo || '',
    photos: ph, link: A.link || '', id: 'C-' + A.id, date: A.date || today(), fromRecord: A.id, sample: !!A.sample };
  const i = S.closet.findIndex(c => c.fromRecord === A.id);
  if (i >= 0) S.closet[i] = { ...S.closet[i], ...item, id: S.closet[i].id }; else S.closet.unshift(item);
  A.moved = true;
}
/* ---------- 예시 기록(더미) ---------- */
function seedRecords() {
  if (S.seeded || !S.body) return;
  if (!S.records.length) {
    const mk = (cat, bid, date, fb) => { const p = PR.find(x => x.b === bid && x.c === cat && x.ch); const A = buildAnalysis({ cat, brandId: bid, productId: p.id, rows: {}, size: 'M', photo: null, brandText: '' }); A.sample = true; A.date = date; if (fb) A.fb = { size: A.rec, overall: '정핏', parts: { 가슴: '적당', 총장: '적당' }, kw: ['정사이즈 추천', '레귤러해요'], memo: '예시 피드백 · 기대한 대로 잘 맞아요', date }; return A; };
    const bn = n => (BR.find(x => x.n === n) || BR[0]).id; S.records = [mk('상의', bn('유니클로'), '2026.10.28', false), mk('하의', bn('자라'), '2026.10.21', true)];
  }
  if (!S.closet.length) S.closet = [
    { id: 'C-s1', cat: '상의', brand: '유니클로', name: '옥스포드 셔츠', size: 'M', overall: '작음', parts: { 가슴: '타이트', 어깨: '적당' }, kw: ['가슴 답답해요', '한 치수 업 추천'], memo: '예시 · 가슴이 꽉 껴요', photo: null, date: '2026.10.12', sample: true },
    { id: 'C-s2', cat: '하의', brand: '스파오', name: '와이드 슬랙스', size: 'L', overall: '정핏', parts: { 허리: '여유', 힙: '적당' }, kw: ['허리 남아요'], memo: '예시 · 허리가 살짝 남아요', photo: null, date: '2026.09.30', sample: true }];
  S.seeded = true; save();
}


/* ---------- 문의 · 추가 요청 (브랜드/상품 추가, 사이즈 정보 오류, 기타). 챗봇은 2단계에서 이 폼 앞단에 붙일 자리 ---------- */
const INQ_TYPES = ['브랜드·상품 추가', '사이즈 정보 오류', '기타 문의'], INQ_STEPS = ['접수', '검토 중', '처리 완료'];
let IQ = null;
const newIQ = (o = {}) => ({ type: INQ_TYPES[0], brand: '', product: '', link: '', body: '', ...o });
ACT.goInq = () => go('inquiries');
ACT.askOpen = t => { const [k, q = ''] = (t.dataset.v || '').split('|'); IQ = newIQ({ brand: k === '브랜드' ? q : '', product: k === '상품' ? '' : '' }); go('inqForm'); };
ACT.inqNew = () => { IQ = newIQ(); go('inqForm'); };
const stepOf = q => Math.max(0, INQ_STEPS.indexOf(q.status));
V.inquiries = () => {
  const ls = S.inquiries;
  return `${topbar('문의 내역', { right: '<button class="link" data-a="inqNew" style="padding-right:12px">문의하기</button>' })}
  <div class="pad" style="padding-bottom:6px"><div class="card fill row between" style="padding:12px 14px"><span class="sm"><b>챗봇 상담</b><br><span class="mute">자주 묻는 질문을 바로 답해드려요</span></span><span class="pill gray">준비 중</span></div></div>
  ${ls.length ? `<div class="list" style="margin-top:6px">${ls.map(q => `<button class="li" data-a="inqOpen" data-v="${q.id}" style="padding:14px 16px"><span class="grow" style="min-width:0"><span class="row" style="gap:6px"><span class="pill gray">${esc(q.type)}</span><span class="pill ${q.status === '처리 완료' ? 'ok' : q.status === '검토 중' ? 'dark' : 'gray'}">${q.status}</span></span><b class="ellip" style="display:block;margin-top:6px">${esc(q.brand || q.product || q.body.slice(0, 24) || '문의')}</b><span class="xs mute">${q.date}</span></span><span class="chev">›</span></button>`).join('')}</div>`
    : `<div class="empty"><b class="en">아직 문의가 없어요</b><span class="sm">찾는 브랜드나 상품이 없다면 추가를 요청해 보세요</span><div class="mt12">${emptyBtn('inqNew', '첫 문의 남기기')}</div></div>`}
  <div style="height:24px"></div>`;
};
ACT.inqOpen = t => go('inqDetail', { id: t.dataset.v });
V.inqDetail = p => {
  const q = S.inquiries.find(x => x.id === p.id); if (!q) return emptyHTML();
  const st = stepOf(q);
  return `${topbar('문의 상세')}<div class="pad"><span class="pill gray">${esc(q.type)}</span><h1 class="big" style="margin-top:8px">${esc(q.brand || q.product || '문의')}</h1><div class="xs mute">${q.date}</div>
  <div class="card mt16" style="padding:14px"><div class="row" style="gap:0">${INQ_STEPS.map((x, i) => `<div style="flex:1;text-align:center"><div style="width:22px;height:22px;border-radius:50%;margin:0 auto;display:grid;place-items:center;font-size:12px;font-weight:800;background:${i <= st ? 'var(--ok)' : 'var(--s2)'};color:${i <= st ? '#fff' : 'var(--mute)'}">${i <= st ? '✓' : i + 1}</div><div class="xs ${i === st ? 'b' : 'mute'}" style="margin-top:4px">${x}</div></div>`).join('')}</div>
    <p class="sm mute" style="margin:12px 0 0;text-align:center">${st === 2 ? '요청하신 내용이 반영됐어요. 고마워요!' : st === 1 ? '담당자가 확인하고 있어요. 처리되면 알려드릴게요.' : '문의가 접수됐어요. 곧 검토를 시작해요.'}</p></div>
  <div class="card mt12 list">${[['브랜드', q.brand], ['상품명', q.product], ['링크', q.link]].map(([k, v]) => `<div class="li" style="padding:11px 14px"><span class="mute sm" style="width:56px">${k}</span><span class="sm grow" style="word-break:break-all">${v ? esc(v) : `<span class="mute">${NO_INFO}</span>`}</span></div>`).join('')}</div>
  <div class="card fill mt12 sm" style="padding:12px 14px;white-space:pre-wrap">${q.body ? esc(q.body) : `<span class="mute">${NO_INFO}</span>`}</div>
  ${st < 2 ? `<button class="btn flat full mt16" data-a="inqAdvance" data-v="${q.id}">(프로토타입) 다음 처리 단계로</button>` : ''}
  <button class="link mt16" data-a="inqDel" data-v="${q.id}">이 문의 삭제</button></div>`;
};
ACT.inqAdvance = t => { const q = S.inquiries.find(x => x.id === t.dataset.v); q.status = INQ_STEPS[Math.min(2, stepOf(q) + 1)]; pushNotif('inquiry', `문의하신 내용이 <b>${q.status}</b>(으)로 바뀌었어요`, q.title || ''); save(); reRender(); };
ACT.inqDel = t => { S.inquiries = S.inquiries.filter(x => x.id !== t.dataset.v); save(); toast('삭제했어요'); back(); };
V.inqForm = () => {
  const add = IQ.type === INQ_TYPES[0], err = IQ.type === INQ_TYPES[1];
  return `${topbar('문의하기', { left: 'close' })}<div class="pad">
  <div class="field"><label class="f">문의 종류</label><div class="chips">${chipsHTML(INQ_TYPES, IQ.type, 'iqType')}</div></div>
  ${add || err ? `<div class="field"><label class="f" for="iq-b">브랜드명 ${add ? '' : '<span class="mute b sm">(선택)</span>'}</label><input id="iq-b" class="inp" data-i="iq" data-k="brand" value="${esc(IQ.brand)}" placeholder="예: 마르디 메크디"></div>
  <div class="field"><label class="f" for="iq-p">상품명 <span class="mute b sm">(선택)</span></label><input id="iq-p" class="inp" data-i="iq" data-k="product" value="${esc(IQ.product)}" placeholder="예: 오버사이즈 후드 집업"></div>
  <div class="field"><label class="f" for="iq-l">공식 사이트 · 상품 링크 <span class="mute b sm">(선택)</span></label><input id="iq-l" class="inp" type="url" inputmode="url" data-i="iq" data-k="link" value="${esc(IQ.link)}" placeholder="https://"></div>` : ''}
  <div class="field"><label class="f" for="iq-t">${add ? '요청 내용' : err ? '어떤 정보가 다른가요?' : '문의 내용'} <span class="mute b sm">(선택)</span></label><textarea id="iq-t" class="inp" data-i="iq" data-k="body" placeholder="${add ? '예: 이 브랜드의 상의를 추가해 주세요' : err ? '예: 사이즈표의 M 총장이 공식 사이트와 달라요' : '궁금한 점을 적어 주세요'}">${esc(IQ.body)}</textarea></div>
  <div class="card fill hint" style="padding:10px 12px">우리는 공식 사이트 상품만 다뤄요. 요청이 많은 브랜드부터 먼저 추가해요.</div></div>
  <div class="dock"><button class="btn pri full" data-a="inqSend">보내기</button></div>`;
};
INP.iq = t => { IQ[t.dataset.k] = t.value; };
ACT.iqType = t => { IQ.type = t.dataset.v; reRender(); };
ACT.inqSend = () => {
  const add = IQ.type === INQ_TYPES[0];
  if (add && !IQ.brand.trim()) { toast('브랜드명을 입력해 주세요'); return; }
  if (!add && !IQ.body.trim() && !IQ.brand.trim()) { toast('내용을 입력해 주세요'); return; }
  S.inquiries.unshift({ id: 'Q' + Date.now(), ...JSON.parse(JSON.stringify(IQ)), status: '접수', date: today() }); save(); toast('문의가 접수됐어요');
  stack = stack.filter(s => s.v !== 'inqForm'); if (!stack.some(s => s.v === 'inquiries')) stack.push({ v: 'inquiries', p: {} }); render(); $('#view').scrollTop = 0;
};

/* ---------- 프로토타입 패널 · 이벤트 · 시작 ---------- */
function ensureBody() { if (!S.body) S.body = { h: 162, w: 53, pref: '기본 핏', updated: today() }; seedRecords(); }
function ensureLikes() { if (!S.likes.product.length) { const u = BR.find(b => b.n === '유니클로') || BR[0], z = BR.find(b => b.n === '자라') || BR[1]; S.likes.product = [pidFirst, (PR.find(p => p.b === z.id && p.c === '아우터') || PR[1]).id]; S.likes.brand = [String(u.id), String(z.id)]; const r = (revByProd[pidFirst] || [])[0]; if (r) S.likes.review = [r.id]; } }
function ensureAccount() { if (!S.account) S.account = { name: '핏센스 유저', email: 'demo@fitsense.kr', pw: 'demo1234!', joined: today() }; S.loggedIn = true; save(); }
const st = (...a) => { stack = a.map(([v, p]) => ({ v, p: p || {} })); };
const pidFirst = (PR.find(p => (brandById[p.b] || {}).n === '유니클로' && p.c === '상의') || PR[0]).id;
const JUMPS = {
  pwChange: () => { ensureBody(); PW = { cur: '', n1: '', n2: '', err: '' }; st(['my'], ['pwChange']); },
  privacy: () => { ensureBody(); PV = { ok: false, pw: '', err: '' }; st(['my'], ['privacy']); },
  privacyOk: () => { ensureBody(); PV = { ok: true, pw: '', err: '' }; st(['my'], ['privacy']); },
  notifSet: () => { ensureBody(); st(['my'], ['notifSet']); },
  styles: () => { ensureBody(); PF = { ...S.profile, styles: [...S.profile.styles] }; st(['my'], ['profile'], ['styles']); },
  notifs: () => { ensureBody(); st(['home'], ['notifs']); },
  tutorial: () => { ensureBody(); showTutorial(); },
  home: () => { ensureBody(); st(['home']); },
  homeNoBody: () => { S.body = null; st(['home']); },
  measure1: () => { ensureBody(); M = newM(1); loadBD(); st(['home'], ['measure']); },
  measure1empty: () => { S.body = null; S.bodyPhoto = null; S.bodyPhotoId = null; M = newM(1); loadBD(); st(['home'], ['measure']); },
  measure2: () => { ensureBody(); M = newM(2); loadBD(); st(['home'], ['measure']); },
  measure2f: () => { ensureBody(); setDemoM(2); loadBD(); st(['home'], ['measure']); },
  analyzing: () => { ensureBody(); setDemoM(); CUR = buildAnalysis(M); st(['home'], ['measure'], ['analyzing', { next: { v: 'result', p: {} } }]); },
  result: () => { ensureBody(); setDemoM(); CUR = buildAnalysis(M); RT = 'viz'; RE = false; st(['home'], ['measure'], ['result']); },
  saved: () => { ensureBody(); setDemoM(); CUR = buildAnalysis(M); st(['home'], ['measure'], ['saved']); },
  brand: () => { ensureBody(); BF = { ...BF, tab: 'cat', q: '', letter: null, liked: false, bc: '전체' }; st(['brand']); },
  brandList: () => { ensureBody(); BF = { ...BF, tab: 'brand', q: '', letter: null, liked: false, bc: '전체' }; st(['brand']); },
  plist: () => { ensureBody(); PL = newPL({ c: '상의', sc: '티셔츠' }); st(['brand'], ['plist']); },
  brandDetail: () => { ensureBody(); const bid = brandById[PR.find(p => p.id === pidFirst).b].id; DF = { id: bid, cat: '전체', q: '', sort: null }; st(['brand'], ['brandDetail', { id: bid }]); },
  product: () => { ensureBody(); st(['brand'], ['product', { id: pidFirst, tab: 'info' }]); },
  chart: () => { ensureBody(); st(['brand'], ['product', { id: pidFirst, tab: 'chart' }]); },
  reviews: () => { ensureBody(); LF = newLF(); st(['brand'], ['product', { id: pidFirst, tab: 'review' }]); },
  review: () => { ensureBody(); const r = (revByProd[pidFirst] || RV).find(x => repliesOf(x).length) || RV[0]; st(['brand'], ['product', { id: pidFirst, tab: 'review' }], ['review', { id: r.id }]); },
  records: () => { ensureBody(); RC = '전체'; RK = '전체'; RQ = ''; RFS = { sizes: [], period: '전체' }; st(['records']); },
  record: () => { ensureBody(); RE = false; RT = 'viz'; st(['records'], ['result', { rid: S.records[0].id }]); },
  closetAdd: () => { ensureBody(); AC_RESET(); FB = newFB(); FB.reqColor = true; st(['records'], ['closetAdd']); },
  likes: () => { ensureBody(); ensureLikes(); st(['likes', { tab: 'product' }]); },
  my: () => { ensureBody(); st(['my']); },
  inquiries: () => { ensureBody(); if (!S.inquiries.length) S.inquiries = [{ id: 'Q-s1', type: INQ_TYPES[0], brand: '마르디 메크디', product: '', link: 'https://example.com', body: '상의 라인을 추가해 주세요', status: '처리 완료', date: '2026.10.30' }, { id: 'Q-s2', type: INQ_TYPES[1], brand: '유니클로', product: '크루넥 티셔츠', link: '', body: '사이즈표 M 총장이 공식 사이트와 달라요', status: '검토 중', date: '2026.11.08' }]; st(['my'], ['inquiries']); },
  inqForm: () => { ensureBody(); IQ = newIQ(); st(['my'], ['inquiries'], ['inqForm']); },
  myIn: () => { ensureBody(); ensureAccount(); st(['my']); },
  myfit: () => { ensureBody(); loadBD(); st(['my'], ['myfit']); },
  photos: () => { ensureBody(); demoPhotos(); PH = { kind: '전신', f: '전체' }; st(['my'], ['photos']); },
  login: () => { AU = newAU(); st(['my'], ['login']); },
  signup: () => { AU = newAU(); AU.mode = 'signup'; st(['my'], ['login']); },
  withdraw: () => { ensureBody(); ensureAccount(); WD = { agree: false, reason: '' }; st(['my'], ['withdraw']); }
};
ACT.resetAll = () => { S = freshS(); try { localStorage.removeItem(KEY); } catch (e) { } NFK = '전체'; RK = '전체'; RC = '전체'; RQ = ''; RSORT = 'new'; RFS = { sizes: [], period: '전체' }; M = null; CUR = null; BF = { tab: 'cat', q: '', letter: null, liked: false, bc: '전체', rail: '전체' }; PL = newPL(); closeSheet(); st(['home']); render(); $('#view').scrollTop = 0; };

document.addEventListener('click', e => {
  const j = e.target.closest('[data-jump]');
  if (j) { closeSheet(); JUMPS[j.dataset.jump](); render(); $('#view').scrollTop = 0; return; }
  const n = e.target.closest('#nav button'); if (n) { closeSheet(); if (n.dataset.tab === 'measure') ACT.startMeasure(); else tab(n.dataset.tab); return; }
  const a = e.target.closest('[data-a]'); if (a && ACT[a.dataset.a]) { e.preventDefault(); ACT[a.dataset.a](a, e); }
});
document.addEventListener('input', e => { const t = e.target.closest('[data-i]'); if (t && INP[t.dataset.i]) INP[t.dataset.i](t); });
document.addEventListener('change', e => { const t = e.target.closest('[data-c]'); if (t && CHG[t.dataset.c]) CHG[t.dataset.c](t); });
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button]')) { e.preventDefault(); e.target.click(); } });

// 예전 버전에서 저장된 전신 사진이 보관함에 없으면 채워 둔다
if (S.bodyPhoto && !S.photos.some(p => p.src === S.bodyPhoto)) { const id = addPhoto('전신', S.bodyPhoto); S.bodyPhotoId = id; save(); }
const showLoadError = () => { const v = document.getElementById('view'); if (v) v.innerHTML = '<div class="pad" style="text-align:center;padding-top:96px"><h1 class="big">데이터를 불러오지 못했어요</h1><p class="sub">네트워크를 확인하고 다시 시도해 주세요.</p><button class="btn pri" onclick="location.reload()">다시 시도</button></div>'; };
try { if (S.body) seedRecords(); S.records.forEach(r => { if (r.fb && !r.moved) moveToCloset(r); }); render(); } catch (e) { console.error(e); showLoadError(); }
