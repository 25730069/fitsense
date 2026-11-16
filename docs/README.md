# 핏센스 (FitSense)

내 키·몸무게와 옷의 실측 사이즈표를 비교해 **어떤 사이즈가 맞을지 추천**하는 의류 사이즈 추천 서비스의 웹 프로토타입입니다.
후기에 쓰인 체형·구매 사이즈·체감(작은 편/정사이즈/큰 편)을 모아, 나와 비슷한 체형의 후기를 근거로 보여줍니다.

## 실행 방법
JSON을 `fetch`로 읽기 때문에 `index.html`을 더블클릭(`file://`)하면 데이터가 안 뜹니다.
- **GitHub Pages**: 저장소 Settings → Pages → Branch `main` / root → 발급된 주소로 접속
- **로컬**: 이 폴더에서 `python -m http.server 8000` 실행 후 http://localhost:8000

## 폴더
```
index.html              화면 틀 + 시작 코드(데이터 fetch → checkData → 화면)
css/style.css           스타일 (모바일 우선, PC에서는 중앙 정렬)
js/data.js              data/*.json → 앱 형식으로 변환(mapDB), 이미지 경로 규칙
js/check.js             checkData(): REQUIRED / ALLOWED / TYPES / ID 참조 검사
js/core.js              핏 계산(evalSize·recommend), 상태(state)·localStorage, 라우터, SVG
js/home_measure.js      홈 · 사이즈 측정(① 내 신체 ② 옷 입력) · 결과
js/browse.js            브랜드 · 상품 목록(검색/필터/정렬) · 상품 상세 · 후기
js/records_my.js        기록 · 내 옷장 · 찜 · 알림 · 마이 · 문의
data/                   brands / products / reviews .json (+ test_cases.json: 테스트 전용)
asset/products/         상품 이미지 (파일명 = product_id.jpg). 없으면 "이미지" 자리표시
tools/                  gen_data.py(더미 생성) · check_data.py(검증) · check_links.py(링크 확인)
docs/                   DATA_SPEC.md(데이터 명세) · SOURCES.md(출처·실제/더미 구분표)
```

## 주요 기능
| 기능 | 설명 |
|---|---|
| 사이즈 측정 | 키·몸무게(+선택 실측) 입력 → 상품 사이즈표와 비교해 부위별 타이트/적당/여유 판정, 추천 사이즈 |
| 브랜드·상품 탐색 | 성별·카테고리·세부 카테고리, 검색, 필터(핏·소매·신축성·가격·색상), 정렬 |
| 후기 | 나와 비슷한 체형(키 ±6cm·몸무게 ±7kg) 후기만 보기, 사이즈·키워드 필터 |
| 기록 · 내 옷장 | 분석 기록, 입어본 옷 피드백 → 다음 추천에 반영(마이핏드백) |
| 마이 | 프로필, 선호 스타일, 알림, 비밀번호·개인정보, 찜 |

## 데이터: JSON과 LocalStorage의 구분
| 저장 위치 | 내용 |
|---|---|
| `data/*.json` (읽기 전용) | 브랜드 64 · 상품 725 · 후기 4,713 (상품·후기는 전부 더미) |
| 브라우저 LocalStorage (`fitsense_wf_v5`) | 내 신체 치수, 프로필, 선호 스타일, 찜, 내 옷장·기록, 알림, 사용자가 쓴 후기·답글 |

자세한 필드·허용값은 `docs/DATA_SPEC.md`, 출처와 실제/더미 구분은 `docs/SOURCES.md`를 보세요.

## 데이터 검증
```
python tools/check_data.py      # 필수값·허용값·ID 참조·사이즈표·수량 검사
python tools/check_links.py     # 브랜드 사이트 링크 확인 (--write 로 meta.site_verified 반영)
```
브라우저에서는 `checkData()`가 열 때마다 실행되고, 문제는 콘솔과 `window.DATA_ISSUES`에 남습니다.

## 알려진 한계
- 상품·후기는 **더미**입니다. 실제 상품 정보나 실제 구매자 후기가 아닙니다.
- 브랜드 사이트 링크는 `meta.site_verified`가 `false`인 항목이 있습니다(check_links.py로 확인).
- 로그인·후기·좋아요 등 사용자 데이터는 서버가 아니라 **내 브라우저에만** 저장됩니다(심화 트랙에서 DB 연동 예정).
