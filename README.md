# 핏센스 (와이어프레임 v3)

## 실행
JSON을 `fetch`로 읽기 때문에 `index.html`을 더블클릭(`file://`)하면 데이터가 안 뜹니다. 아래 중 하나로 여세요.
- GitHub Pages 배포 주소 (수업 방식)
- 로컬: 프로젝트 폴더에서 `python -m http.server 8000` → http://localhost:8000

## 폴더
```
index.html          화면 틀(왼쪽 프로토타입 패널 + 폰 프레임) + 시작 코드(data.js → app.js 순서로 로드)
css/style.css
js/data.js          data/*.json 불러오기(fetchRaw) + 앱 형식으로 변환(mapDB)   ← JSON 이 바뀌면 여기만 보면 됨
js/app.js           핏 계산·마이핏드백 보정·라우터 / 튜토리얼·홈·사이즈 측정·결과 / 브랜드·상품·후기·기록·찜·마이
data/               brands / products / users / reviews .json  (legacy/ 는 이전 버전)
tools/              generate_data.py · validate_data.py · fit_model.py(핏 규칙, app.js 계산식의 기준)
docs/               DATA_SPEC.md(명세서) · DATA_SOURCES.md(출처·구분표)
```

## 화면 구조 (하단 탭 5개)
홈 · 브랜드 · 기록(분석 기록 / 마이핏드백) · 찜 · 마이. 사이즈 측정은 홈 배너(그리고 상품 상세의 정밀 측정)에서 시작합니다.
흐름: 튜토리얼(다시 보지 않기) → ① 바디 프로필 → ② 옷 입력(브랜드 검색·DB 상품 선택(선택)·사진·링크(선택)·실측 직접 입력) → 분석 중 → 사이즈별 의견 → 저장 완료

## JSON에 새로 추가할 수 있는 선택 필드
없으면 화면이 더미 값으로 채웁니다(더미일 때는 "더미 값"이라고 표시).
| 파일 | 필드 | 쓰이는 곳 |
|---|---|---|
| brands.json | `size_tendency` ("작게 나오는 편" / "정사이즈 경향" / "크게 나오는 편") | 브랜드 사이즈 경향 (없으면 후기에서 계산) |
| products.json | `lowest_price`(원), `lowest_shop`, `product_url` | 최저가, 구매 링크 |

## 마이핏드백 반영 방식 (js/app.js `persInfo`)
분석 기록 피드백 + 내 옷장 기록에서 부위별 "타이트"가 많으면 그 부위의 선호 여유를 늘리고, "여유"가 많으면 줄입니다. 전체 핏이 작음/여유이면 가슴·허리·힙에 절반 가중치로 반영하며, 보정폭은 부위 허용오차의 최대 ±1배입니다.
브라우저(localStorage 키 `fitsense_wf_v3`)에 저장되는 프로토타입이므로 서버 저장은 아직 없습니다.
