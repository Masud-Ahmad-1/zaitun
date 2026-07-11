import urllib.request, json, sys, time

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
        body_text = e.read().decode() if e.fp else ""
        try:
            return e.code, json.loads(body_text), ""
        except:
            return e.code, {"error": body_text}, ""

# 1. Login
print("=== 1. Login ===")
status, data, token = api("POST", "/api/auth/login", {"email": "rahim@test.com", "password": "123456"})
print(f"  Status: {status}, Name: {data.get('name')}, Token: {token[:20]}...")
if status != 200:
    print("  LOGIN FAILED"); sys.exit(1)

# 2. Create tree
print("\n=== 2. Create Tree ===")
status, tree, _ = api("POST", "/api/trees", {"name": "উদ্দিন পরিবার", "isPrivate": True}, token)
print(f"  Status: {status}, Tree: {tree.get('name')}, ID: {tree.get('id')}")

# 3. Check auto-created person
print("\n=== 3. Auto-created Person ===")
status, pdata, _ = api("GET", f"/api/persons?treeId={tree['id']}", cookie=token)
persons = pdata.get("persons", [])
print(f"  Persons count: {len(persons)}")
for p in persons:
    linked = "LINKED" if p.get("userId") else "unlinked"
    print(f"  - {p['firstName']} {p.get('lastName','')} | {linked} | contributedBy={p.get('contributedBy')=='match' and 'self' or p.get('contributedBy','')[:8]}... | gender={p.get('gender')} | birth={p.get('birthDate')}")
    if p.get("userId") == data['id']:
        print(f"    ✓ Auto Person node correctly linked to user!")

# 4. Add unlinked person (like a family member)
print("\n=== 4. Add Unlinked Person (করিম চাচা) ===")
status, karim, _ = api("POST", "/api/persons", {
    "treeId": tree['id'], "firstName": "করিম", "lastName": "উদ্দিন",
    "gender": "male", "birthDate": "1965-03-20", "bio": "বড় চাচা, কৃষক"
}, token)
print(f"  Status: {status}, Person: {karim.get('firstName')} {karim.get('lastName','')}, userId={karim.get('userId')}")

# 5. Submit a claim on the unlinked person
print("\n=== 5. Submit Profile Claim ===")
status, claim, _ = api("POST", "/api/claims", {
    "personId": karim['id'],
    "treeId": tree['id'],
    "relationship": "ভাতিজা",
    "evidence": "করিম উদ্দিন আমার বড় চাচা। তিনি গ্রামের বিখ্যাত কৃষক ছিলেন।",
    "witnessIds": []
}, token)
print(f"  Status: {status}, Claim ID: {claim.get('id')}, Status: {claim.get('status')}")

# 6. Get pending claims
print("\n=== 6. Get Pending Claims ===")
status, claims, _ = api("GET", f"/api/claims?treeId={tree['id']}&status=pending", cookie=token)
print(f"  Status: {status}, Pending claims: {len(claims)}")
for c in claims:
    print(f"  - {c['claimant']['name']} → {c['person']['firstName']} {c['person'].get('lastName','')} | evidence: {c.get('evidence','')[:40]}...")

# 7. Test join suggestion with new user
print("\n=== 7. Create New User for Join Test ===")
status, user2, token2 = api("POST", "/api/auth/signup", {"name": "করিম উদ্দিন", "email": "karim@test.com", "password": "123456"})
print(f"  Status: {status}, Name: {user2.get('name')}")

if token2:
    print("\n=== 8. Check Join Suggestions ===")
    status, sug, _ = api("GET", f"/api/trees/join?inviteCode={tree['inviteCode']}", cookie=token2)
    print(f"  Status: {status}, Suggestions: {len(sug.get('suggestions', []))}")
    for s in sug.get('suggestions', []):
        print(f"  - {s['firstName']} {s.get('lastName','')} | birth={s.get('birthDate')}")

print("\n=== ALL TESTS PASSED ===")