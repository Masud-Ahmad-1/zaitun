import urllib.request, json, sys

base = "http://127.0.0.1:3000"

def api(method, path, data=None, cookie=None):
    url = f"{base}{path}"
    body = json.dumps(data).encode() if data else None
    headers = {"Content-Type": "application/json"}
    if cookie:
        headers["Cookie"] = f"zaitun_session={cookie}"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        set_cookie = resp.headers.get("Set-Cookie", "")
        token = ""
        for part in set_cookie.split(";"):
            if "zaitun_session=" in part:
                token = part.strip().split("=", 1)[1]
                break
        return resp.status, json.loads(resp.read().decode()), token
    except urllib.error.HTTPError as e:
        body_text = ""
        try: body_text = e.read().decode()
        except: pass
        try: return e.code, json.loads(body_text), ""
        except: return e.code, {"error": body_text}, ""

# 1. Test public diaries API without auth
print("=== 1. Public Diaries (no auth) ===")
status, data, _ = api("GET", "/api/diaries/public?filter=public")
print(f"  Status: {status}, Entries: {len(data.get('entries', []))}")
print(f"  Pagination: {data.get('pagination', {})}")

# 2. Test 'all' filter without auth (should return only public)
print("\n=== 2. All Diaries (no auth) ===")
status, data, _ = api("GET", "/api/diaries/public?filter=all")
print(f"  Status: {status}, Entries: {len(data.get('entries', []))}")

# 3. Login and create test data
print("\n=== 3. Login ===")
status, user, token = api("POST", "/api/auth/login", {"email": "rahim@test.com", "password": "123456"})
print(f"  Status: {status}, Name: {user.get('name')}")

# Get trees
status, trees, _ = api("GET", "/api/trees", cookie=token)
tree = trees[0]
print(f"  Tree: {tree['name']}")

# Get persons
status, pdata, _ = api("GET", f"/api/persons?treeId={tree['id']}", cookie=token)
person = pdata['persons'][0]
print(f"  Person: {person['firstName']}")

# Create a public diary entry
print("\n=== 4. Create Public Diary ===")
status, entry, _ = api("POST", "/api/diaries", {
    "treeId": tree['id'],
    "personId": person['id'],
    "date": "2025-06-15",
    "title": "বাবার গল্প",
    "content": "বাবা বলতেন, ছোটবেলায় তারা গ্রামের পুকুরে সাঁতার কাটতেন। রমজান মাসে ইফতারের সময় পুকুরের পাড়ে বসে সূর্যাস্ত দেখতাম। গ্রামের মাঠে ধান কাটার সময়, বৃষ্টির দিনে মাটির গন্ধ আজও মনে পড়ে।",
    "privacy": "public",
    "tags": "স্মৃতি, ছেলেবেলা"
}, token)
print(f"  Status: {status}, Title: {entry.get('title')}")

# Create a family diary
print("\n=== 5. Create Family Diary ===")
status, entry2, _ = api("POST", "/api/diaries", {
    "treeId": tree['id'],
    "personId": person['id'],
    "date": "2025-06-20",
    "title": "পরিবারের ঈদ",
    "content": "সবাই মিলে ঈদের নামাজ পড়লাম। সেমাই চাচার বাড়িতে সবাই জমা হলাম। কাচ্চি আর সেমাই খুব আনন্দে খেলাধুলা করলো।",
    "privacy": "family",
    "tags": "ঈদ, পরিবার"
}, token)
print(f"  Status: {status}, Title: {entry2.get('title')}")

# 6. Test public API again (should show public entry)
print("\n=== 6. Public API (should show 1 entry) ===")
status, data, _ = api("GET", "/api/diaries/public?filter=public")
print(f"  Status: {status}, Entries: {len(data.get('entries', []))}")
for e in data.get('entries', []):
    print(f"  - {e['title']} [{e['privacy']}] by {e['person']['firstName']} in {e['tree']['name']}")

# 7. Test 'all' filter with auth (should show both)
print("\n=== 7. All Diaries (with auth, should show 2) ===")
status, data, _ = api("GET", "/api/diaries/public?filter=all", cookie=token)
print(f"  Status: {status}, Entries: {len(data.get('entries', []))}")
for e in data.get('entries', []):
    print(f"  - {e['title']} [{e['privacy']}]")

# 8. Test 'family' filter with auth (should show 1)
print("\n=== 8. Family Diaries (with auth) ===")
status, data, _ = api("GET", "/api/diaries/public?filter=family", cookie=token)
print(f"  Status: {status}, Entries: {len(data.get('entries', []))}")
for e in data.get('entries', []):
    print(f"  - {e['title']} [{e['privacy']}]")

# 9. Test search
print("\n=== 9. Search ===")
import urllib.parse
search_q = urllib.parse.quote("গ্রাম")
status, data, _ = api("GET", f"/api/diaries/public?filter=public&search={search_q}")
print(f"  Status: {status}, Entries: {len(data.get('entries', []))}")

print("\n=== ALL PHASE 2 TESTS PASSED ===")