# 핏센스 데이터 명세서 (6주차 기준 · 7주차 연결본)

파일은 모두 `data/` 폴더의 **최상위가 배열인 JSON**이다. 화면 코드는 `js/data.js`의 `loadAll()`이 4개 파일을 한 번에 읽는다.

| 파일 | 건수 | 한 줄 설명 |
|---|---|---|
| `brands.json` | 9 | 브랜드 (실제 브랜드명·공식 사이트) |
| `products.json` | 73 | 상품 + 사이즈별 실측표 (더미 72 + 실제 후기가 달린 실제 상품 1) |
| `users.json` | 131 | 후기 작성자의 신체 데이터 (더미 130 + 실제 후기 작성자 1) |
| `reviews.json` | 300 | 사이즈 후기 (더미 299 + 실제 1) |

`data/legacy/`는 이전 버전(items.json, user.json, brands_women.json)이며 화면에서 읽지 않는다.

## ID 규칙
| 필드 | 형식 | 예시 |
|---|---|---|
| `brand_id` | 숫자 | `7` |
| `product_id` | `브랜드코드_카테고리코드_순번` (문자열) | `ZARA_OUTER_01`, 실제 상품 `MSS_TOP_R01` |
| `user_id` | `U` + 3자리 (문자열), `U000`은 실제 후기 작성자 | `U042` |
| `review_id` | `R` + 3자리 (문자열) | `R125` |

## 허용값
| 필드 | 허용값 |
|---|---|
| `category` | 상의 · 하의 · 원피스 · 아우터 |
| `fit_type` | 슬림 · 레귤러 · 오버 |
| `sleeve_type` | 민소매 · 반소매 · 긴소매 (하의는 `null`, 아우터는 긴소매) |
| `stretch` | 없음 · 약간 · 좋음 |
| `fit_preference` | 슬림 핏 · 기본 핏 · 여유 핏 (앱의 PREF 이름과 같음) |
| `purchased_size`, `fitted_size`, 사이즈표 키 | XS · S · M · L · XL |
| `size_opinion` | 작은 편 · 정사이즈 · 큰 편 |
| `fit_details` 값 | 어깨·가슴·허리·힙·허벅지: 타이트 · 적당 · 여유 / 소매·총장: 짧은 편 · 적당 · 긴 편 |
| `data_type` | real · dummy |

## 필드 (핵심만)
**products.json**
`product_id`, `brand_id`, `brand`, `product_name`(더미는 "(가상)" 접두), `category`, `sub_category`, `gender`, `fit_type`, `sleeve_type`, `stretch`, `design_length_cm`(M 사이즈·키160 기준 설계 총장), `price`(원), `colors`, `sizes`, `size_chart`(사이즈별 `{어깨, 가슴, 허리, 힙, 허벅지, 소매, 총장}` 중 카테고리에 해당하는 부위, cm), `meta`
- 부위 구성: 상의·아우터 = 어깨·가슴(+소매)·총장 / 하의 = 허리·힙(+허벅지, 스커트 제외)·총장 / 원피스 = 어깨·가슴·허리(+소매)·총장
- 가슴·허리·힙·허벅지는 **둘레**, 어깨·소매·총장은 길이

**users.json**
`user_id`, `data_type`, `gender`, `height_cm`, `weight_kg`, `shoulder_cm`, `chest_cm`, `waist_cm`, `hip_cm`, `thigh_cm`, `arm_cm`, `fit_preference`, `meta`

**reviews.json**
`review_id`, `data_type`, `product_id`, `user_id`, `brand`, `category`, `review_date`, `rating`(1~5), `purchased_size`, `size_opinion`, `size_score`(큰 편 +1 / 정사이즈 0 / 작은 편 −1), `length_opinion`, `length_score`(긴 편 +1 / 적당 0 / 짧은 편 −1), `fit_details`(부위별 판정), `ease_cm`(부위별 옷−몸 cm, 총장은 기준 길이 대비 차이), `size_matched`(구매=추천), `size_limit`(XS/XL 한계로 추천 사이즈가 충분히 못 움직임), `fitted_size`(이 체형에 맞았을 사이즈), `review_text`, `source`, `source_url`, `meta`
- 후기의 키·몸무게는 `user_id`로 `users.json`에서 가져온다(후기에 복사해 두지 않음).
- `brand`, `category`는 상품에서 복사한 조회용 필드이며 상품과 같아야 한다(검증됨).

## 관리용 필드 `meta` (화면에 직접 보여주지 않음)
| 키 | 의미 |
|---|---|
| `meta.source` | `"json"` (저장 JSON만 사용). 이 프로젝트는 API 미연동이라 `"api"` 항목 없음 |
| `meta.real` | 공개 원본·직접 확인한 실제 값 필드 |
| `meta.dummy` | 임의·AI 생성 더미 값 필드 |
| `meta.unknown` | 확인하지 못한 값(화면에 "미확인"/"정보 없음") |
| `meta.derived` | 실제 값에서 규칙으로 계산한 값 (실제 후기 1건에만 사용) |

화면의 실제/더미/미확인 태그는 이 `meta`만 보고 정한다. 더미 필드를 직접 조사해 확인하면 `dummy` → `real`로 옮기면 된다.

## 일관성 규칙 (tools/validate_data.py 가 검사)
1. ID 중복 없음, 후기→상품·사용자 참조가 모두 존재, 후기의 brand/category가 상품과 같음
2. 사이즈표가 XS→XL로 계속 커짐, 부위 구성이 카테고리와 맞음, 하의는 힙 > 허리
3. 사용자 신체 치수가 키·몸무게에서 기대되는 범위 안(앱 `bodyOf()` 추정식 ± 허용 오차), 가슴·힙 > 허리
4. **후기 판정이 계산과 일치**: `사이즈표 − 신체 치수`로 부위별 판정(`fit_details`), 사이즈감(`size_opinion`), 추천 사이즈(`fitted_size`)를 다시 계산해 후기와 비교
5. `size_opinion` ↔ `size_score` ↔ `size_matched` ↔ `fitted_size` 관계 (큰 편이면 추천이 더 작은 사이즈, 작은 편이면 더 큰 사이즈, XS/XL 한계는 `size_limit`)
6. 후기 본문에 키·몸무게·구매 사이즈·사이즈감·추천 문구가 데이터와 같게 들어 있음
7. 후기 300건(실제 1), 상품마다 후기 3건 이상, 모든 사용자가 후기 1건 이상, 같은 사용자가 같은 상품에 중복 후기 없음
8. 정사이즈 후기의 평균 별점이 작은 편·큰 편보다 높음

## 핏 판정 규칙 요약 (tools/fit_model.py)
- 기준 체형(키 160·52kg)의 치수 + 컷별 여유량 + 브랜드 보정 + 상품별 편차 = 사이즈 M의 옷 치수, 사이즈마다 가슴 6cm·허리 4cm 등으로 증가
- "적당" 기준 = 컷별 의도 여유량 + 사용자 선호 핏 이동 + 신축성 이동 ± 허용 범위
- 사이즈감은 가중 평균 편차를 사이즈 단계로 환산해 정한다(0.5단계 이상이면 큰/작은 편)
- 구매 사이즈는 사용자의 "평소 사이즈"(브랜드·상품을 모를 때의 기본 컷 기준 최적 사이즈)에서 80%는 그대로, 10%씩 ±1단계
