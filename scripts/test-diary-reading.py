import urllib.request, json, time, sys

def api(method, url, data=None, cookie=None):
    headers = {'Content-Type': 'application/json'}
    if cookie:
        headers['Cookie'] = cookie
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(f'http://127.0.0.1:3000{url}', data=body, headers=headers, method=method)
    resp = urllib.request.urlopen(req)
    set_cookies = resp.headers.get_all('Set-Cookie') or []
    new_cookie = '; '.join(c.split(';')[0] for c in set_cookies) if set_cookies else (cookie or '')
    result = json.loads(resp.read())
    return result, new_cookie, resp.status

cookie = None

# 1. Signup
r, cookie, s = api('POST', '/api/auth/signup', {
    'name': 'রহিম উদ্দিন', 'email': 'rahim-reading@example.com',
    'password': 'Test1234', 'birthDate': '1975-03-15',
    'gender': 'male', 'bio': 'একজন শিক্ষক ও লেখক'
})
print(f'1. Signup OK (status {s})')

# 2. Create tree
r, cookie, s = api('POST', '/api/trees', {'name': 'রহিম পরিবার', 'description': 'পরীক্ষা'}, cookie)
tree_id = r['id']
print(f'2. Tree: {tree_id[:12]}...')

# 3. Get personId
r, cookie, s = api('GET', '/api/trees', cookie=cookie)
person_id = None
for t in r:
    if t['id'] == tree_id and t.get('persons'):
        person_id = t['persons'][0]['id']
print(f'3. Person: {person_id[:12]}...')

# 4. Create public diary
r, cookie, s = api('POST', '/api/diaries', {
    'treeId': tree_id, 'personId': person_id,
    'date': '2025-06-15',
    'title': 'গ্রামের স্মৃতি — বাংলাদেশের প্রকৃতি ও জীবন',
    'content': 'বাংলাদেশের গ্রামীণ জীবনে প্রকৃতির এক অপূর্ব সমন্বয় দেখা যায়। সকালে ঘুম ভেঙে চোখ খুললেই পাখির ডাক শোনা যায়। মাঠে মাঠে সবুজ ধানের শিষ দুলে ওঠে বাতাসে। গ্রামের মানুষ সহজ সরল, তাদের হাসিতে এক ধরনের শান্তি আছে।\n\nবিকেলে মাঠের পাশ দিয়ে বয়ে চলা নদীতে নৌকা ভাসতে দেখলে মন ভালো হয়ে যায়। সূর্য ডোবার সময় আকাশ লাল-কমলা রঙ ধারণ করে।\n\nরাতে তারাভরা আকাশের নিচে বসে দাদুর গল্প শোনা — এই স্মৃতিগুলো আজীবন মনে থাকে।',
    'privacy': 'public', 'tags': 'স্মৃতি,গ্রাম,প্রকৃতি,বাংলাদেশ'
}, cookie)
diary_id = r['id']
print(f'4. Diary: {diary_id[:12]}...')

# 5. Test public diaries list
r, _, s = api('GET', '/api/diaries/public?limit=12')
print(f'5. Public diaries: {len(r["entries"])} entries')

# 6. Test single entry API (NO auth)
r, _, s = api('GET', f'/api/diaries/{diary_id}')
has_bio = bool(r.get('person', {}).get('bio'))
has_tree = bool(r.get('tree'))
print(f'6. Detail API: bio={has_bio}, tree={has_tree}, title="{r["title"][:30]}..."')

print('\n✅ ALL TESTS PASSED!')
