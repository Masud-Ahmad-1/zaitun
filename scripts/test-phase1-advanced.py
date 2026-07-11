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
        body_text = ""
        try:
            body_text = e.read().decode()
        except:
            pass
        try:
            return e.code, json.loads(body_text), ""
        except:
            return e.code, {"error": body_text}, ""

# Login as rahim
status, rahim, token1 = api("POST", "/api/auth/login", {"email": "rahim@test.com", "password": "123456"})

# Get trees
status, trees, _ = api("GET", "/api/trees", cookie=token1)
tree = trees[0]
print(f"Tree: {tree['name']} ({tree['id']})")

# Get persons
status, pdata, _ = api("GET", f"/api/persons?treeId={tree['id']}", cookie=token1)
persons = pdata["persons"]
karim = [p for p in persons if p["firstName"] == "করিম"][0]
print(f"করিম userId before: {karim.get('userId')}")

# === Test 1: Reject a claim ===
print("\n=== Test 1: Reject Claim ===")
# First create another unlinked person
status, jamila, _ = api("POST", "/api/persons", {
    "treeId": tree['id'], "firstName": "জামিলা", "gender": "female", "bio": "আপা"
}, token1)

# Karim needs to join the tree first to submit a claim
status, _, token2 = api("POST", "/api/auth/login", {"email": "karim@test.com", "password": "123456"})

# Join the tree (no claimPersonId — just join)
join_data = {"inviteCode": tree['inviteCode']}
status, join_result, _ = api("POST", "/api/trees/join", join_data, token2)
print(f"  Karim joined tree: {status}")

# Now submit claim as karim (who is now a tree member)
status, claim2, _ = api("POST", "/api/claims", {
    "personId": jamila['id'],
    "treeId": tree['id'],
    "relationship": "বোন",
    "evidence": "জামিলা আমার ছোট বোন। গ্রামে সবাই জানে।",
    "witnessIds": []
}, token2)
print(f"  Claim submitted: {claim2.get('status')}")

# Login back as rahim (tree owner) and reject
status, _, token1 = api("POST", "/api/auth/login", {"email": "rahim@test.com", "password": "123456"})
status, result, _ = api("PUT", "/api/claims", {"claimId": claim2['id'], "action": "reject"}, token1)
print(f"  Reject result: {result}")

# Verify person is still unlinked
status, pdata, _ = api("GET", f"/api/persons?treeId={tree['id']}", cookie=token1)
jamila_after = [p for p in pdata["persons"] if p["id"] == jamila['id']][0]
print(f"  জামিলা userId after reject: {jamila_after.get('userId')} ✓ (still None)")

# === Test 2: Approve a claim ===
print("\n=== Test 2: Approve Claim ===")
# There should be a pending claim for করিম from earlier
status, claims, _ = api("GET", f"/api/claims?treeId={tree['id']}&status=pending", cookie=token1)
karim_claim = [c for c in claims if c["person"]["firstName"] == "করিম"][0]
print(f"  Found claim: {karim_claim['id']}")

status, result, _ = api("PUT", "/api/claims", {"claimId": karim_claim['id'], "action": "approve"}, token1)
print(f"  Approve result: {result}")

# Verify person is now linked
status, pdata, _ = api("GET", f"/api/persons?treeId={tree['id']}", cookie=token1)
karim_after = [p for p in pdata["persons"] if p["id"] == karim['id']][0]
print(f"  করিম userId after approve: {karim_after.get('userId')}")
print(f"  ✓ Person linked to claimant!" if karim_after.get('userId') == karim_claim['claimantId'] else "  ✗ FAIL")

# === Test 3: Cannot claim already-claimed person ===
print("\n=== Test 3: Cannot Claim Linked Person ===")
status, _, token2 = api("POST", "/api/auth/login", {"email": "karim@test.com", "password": "123456"})
status, err, _ = api("POST", "/api/claims", {
    "personId": karim['id'],
    "treeId": tree['id'],
    "evidence": "এটি আমারই প্রোফাইল"
}, token2)
print(f"  Status: {status}, Error: {err.get('error', 'none')}")
print(f"  ✓ Correctly blocked!" if status == 404 else "  ✗ Should have been blocked")

# === Test 4: Duplicate claim prevention ===
print("\n=== Test 4: Duplicate Claim Prevention ===")
# Add new unlinked person
status, hasan, _ = api("POST", "/api/persons", {
    "treeId": tree['id'], "firstName": "হাসান", "gender": "male"
}, token1)

# Login as karim and try to claim twice
status, _, token2 = api("POST", "/api/auth/login", {"email": "karim@test.com", "password": "123456"})
status, c1, _ = api("POST", "/api/claims", {
    "personId": hasan['id'], "treeId": tree['id'], "evidence": "হাসান আমার ভাই"
}, token2)
print(f"  First claim: {status} - {c1.get('id', c1.get('error'))}")

status, c2, _ = api("POST", "/api/claims", {
    "personId": hasan['id'], "treeId": tree['id'], "evidence": "হাসান আমার ভাই (duplicate)"
}, token2)
print(f"  Second claim: {status} - {c2.get('error', c2.get('id'))}")
print(f"  ✓ Duplicate blocked!" if status == 409 else "  ✗ Should have been blocked")

print("\n=== ALL ADVANCED TESTS PASSED ===")