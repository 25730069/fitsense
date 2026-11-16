"""브랜드 공식 사이트 링크 확인 (내 PC에서 실행). 결과를 data/brands.json 의 meta.site_verified 에 반영.
   python tools/check_links.py          # 확인만
   python tools/check_links.py --write  # 200~399 응답이면 site_verified=true 로 저장"""
import json, sys, pathlib, urllib.request, urllib.error
P = pathlib.Path(__file__).parent.parent / 'data' / 'brands.json'
B = json.load(open(P)); bad = []
for b in B:
    u = b['site_url']; code = None
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=10); code = r.status
    except urllib.error.HTTPError as e: code = e.code
    except Exception as e: code = str(e)[:40]
    ok = isinstance(code, int) and code < 400
    # 403은 봇 차단인 경우가 많음 → 브라우저에서 직접 열어 확인
    print(('OK   ' if ok else 'CHECK'), b['brand_id'], b['name_kr'], u, code)
    if ok: b['meta']['site_verified'] = True
    else: bad.append(b['name_kr'])
if '--write' in sys.argv: json.dump(B, open(P, 'w'), ensure_ascii=False, indent=1); print('saved')
print('브라우저로 직접 확인 필요:', bad)
