# 핏센스 (와이어프레임)

## 실행
JSON을 `fetch`로 읽기 때문에 `index.html`을 더블클릭(`file://`)하면 데이터가 안 뜹니다. 아래 중 하나로 여세요.
- GitHub Pages 배포 주소 (수업 방식)
- 로컬: 프로젝트 폴더에서 `python -m http.server 8000` → http://localhost:8000

## 폴더
```
index.html          화면
css/style.css
js/data.js          데이터 연결(fetch·점검·집계·브랜드 상세·상품 상세)  ← 7주차 추가
js/app.js           기존 화면 로직(홈·사이즈 측정·마이페이지·브랜드 목록)
data/               brands / products / users / reviews .json  (legacy/ 는 이전 버전)
tools/              generate_data.py(생성) · validate_data.py(검증) · fit_model.py(핏 규칙)
docs/               DATA_SPEC.md(명세서) · DATA_SOURCES.md(출처·구분표)
```

## 화면 흐름
홈/브랜드 탭 → **브랜드 선택** → 카테고리별 상품 목록 → **상품 선택** → 사이즈표 + 사이즈 후기(작성자 키·몸무게, 구매→추천 사이즈, 부위별 핏)

## 데이터를 고칠 때
1. `data/*.json` 수정 후 `python tools/validate_data.py` 로 일관성 확인 (오류 0건이어야 함)
2. 처음부터 다시 만들려면 `python tools/generate_data.py` (같은 시드면 같은 결과). 건수·브랜드 경향은 파일 맨 위 상수에서 바꿈
3. 커밋·푸시 → Actions 에서 Pages 배포 확인 → 배포 주소에서 강력 새로고침
4. 브라우저 Console 의 `[데이터 점검]` 로그에서 건수·경고 확인

> 상품·후기·체형 데이터는 실습용 더미입니다(실제 후기 1건 포함). 자세한 구분은 docs/DATA_SOURCES.md.
