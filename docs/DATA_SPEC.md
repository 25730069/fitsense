# 데이터 명세

공통 규칙: ID는 문자열·중복 없음 / 날짜 `YYYY-MM-DD` / 불리언 `true|false` / 값이 없으면 `null`(빈 문자열·"N/A" 금지) / 사이즈표 단위 cm(가슴·허리·힙·허벅지는 **둘레**).

## brands.json (64행)
| 필드 | 타입 | 필수 | 허용값/예시 |
|---|---|---|---|
| brand_id | string | ✔ | `BR001` |
| name_kr / name_en | string | ✔ | `유니클로` / `UNIQLO` |
| site_url | string | ✔ | 공식 사이트 |
| size_guide_url | string/null | | |
| genders | string[] | ✔ | `여성`, `남성` (공용 상품이 있으면 둘 다) |
| categories | string[] | ✔ | `상의` `하의` `아우터` `원피스` |
| styles | string[] | ✔ | 1~3개: 캐주얼·시티·시티보이·클래식·에스닉·걸리시·고프코어·미니멀·프레피·리조트·레트로·로맨틱·스포티·스트릿·워크웨어 |
| size_tendency | string | ✔ | `작게 나옴` `정사이즈` `크게 나옴` |
| price_tier | string | ✔ | `저가` `중가` `고가` `프리미엄` |
| meta | object | ✔ | source, source_url, real[], dummy[], site_verified, api, collected_at |

## products.json (725행, 브랜드당 10~13개)
| 필드 | 타입 | 필수 | 허용값/예시 |
|---|---|---|---|
| product_id | string | ✔ | `P0001` |
| brand_id | string | ✔ | brands.json 참조 |
| name | string | ✔ | `(가상) 베이직 티셔츠` |
| category | string | ✔ | `상의` `하의` `아우터` `원피스` (신발 없음) |
| sub_category | string | ✔ | 티셔츠·니트·데님 팬츠·패딩·롱 원피스 등 |
| gender | string | ✔ | `여성` `남성` `공용` |
| fit_type | string | ✔ | `슬림` `레귤러` `오버` |
| sleeve_type | string/null | | `반소매` `긴소매` `민소매` / 하의는 null |
| stretch | string | ✔ | `없음` `약간` `좋음` |
| price | number | ✔ | 원 단위 정수 |
| colors / sizes | string[] | ✔ | 색상명 / `XS`~`XL` |
| size_chart | object/null | | `{ "M": { "어깨":.., "가슴":.. } }` 부위는 아래 |
| release_date | string | ✔ | 최신순 정렬 |
| product_url | string/null | | |
| meta | object | ✔ | |

size_chart 부위: 상의·아우터 `어깨 가슴 소매 총장` / 하의 `허리 힙 허벅지 총장` / 원피스 `어깨 가슴 허리 총장`. 사이즈가 커질수록 값이 커져야 합니다.

## reviews.json (4,713행, 상품당 5~16개)
| 필드 | 타입 | 필수 | 허용값/예시 |
|---|---|---|---|
| review_id / product_id | string | ✔ | `R00001` / products 참조 |
| reviewer_id / reviewer_nick / reviewer_handle | string | ✔ | `U0001` / 닉네임 / 공개용 ID |
| review_date | string | ✔ | `2026-10-24` |
| rating | number | ✔ | 1~5 정수 |
| height_cm / weight_kg | number | ✔ | |
| fit_preference | string | | `슬림 핏` `기본 핏` `여유 핏` |
| purchased_size / fitted_size | string | ✔ | 상품 sizes 중 하나 |
| size_opinion | string | ✔ | `작은 편` `정사이즈` `큰 편` |
| length_opinion | string | ✔ | `짧은 편` `적당` `긴 편` |
| fit_details | object | | 부위별 `타이트` `적당` `여유` |
| keywords | string[] | | 앱 키워드 목록 중 최대 6개 |
| color / review_text | string | | |
| data_type | string | ✔ | `dummy` |
| meta | object | ✔ | |

## test_cases.json
`[테스트]` 접두어 상품(사이즈표 없음, 매우 긴 이름)과 **0건이 나오는 필터 조합** 목록. 앱 기본 화면에서는 읽지 않습니다.
