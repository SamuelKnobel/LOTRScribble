"""Integration tests for POST /revert/<changelog_id> (the guarded per-field revert)."""
from bson.objectid import ObjectId

UNIT_COLL = "UnitData"


def _seed_unit(base_db, attack=6):
    item_id = ObjectId()
    base_db[UNIT_COLL].insert_one({
        "_id": item_id,
        "Identifier": "Isildur_Pferd_Numenor",
        "attack_KK_FK": attack,
        "price": 30,
        "rules": ["Reiter"],
    })
    return item_id


def _seed_changelog(base_db, item_id, old=4, new=6, field="attack_KK_FK", reverted=None):
    doc = {
        "_id": ObjectId(),
        "collection_name": UNIT_COLL,
        "item_id": str(item_id),
        "item_identifier": "Isildur_Pferd_Numenor",
        "changes": {field: {"old": old, "new": new}},
    }
    if reverted:
        doc["reverted"] = reverted
    base_db["ChangeLogs"].insert_one(doc)
    return doc["_id"]


def test_revert_success_reverts_logs_and_stamps(flask_client, base_db):
    item_id = _seed_unit(base_db, attack=6)          # current == logged new
    cl_id = _seed_changelog(base_db, item_id, old=4, new=6)

    resp = flask_client.post(f"/revert/{cl_id}", json={"field": "attack_KK_FK"})
    assert resp.status_code == 200

    # 1. field restored to the old value
    doc = base_db[UNIT_COLL].find_one({"_id": item_id})
    assert doc["attack_KK_FK"] == 4

    # 2. the revert is recorded as its own changelog entry
    rev = base_db["ChangeLogs"].find_one({"type": "revert"})
    assert rev is not None
    assert rev["reverted_from"] == str(cl_id)
    assert rev["changes"]["attack_KK_FK"] == {"old": 6, "new": 4}

    # 3. the original entry is stamped per-field
    orig = base_db["ChangeLogs"].find_one({"_id": cl_id})
    assert "attack_KK_FK" in orig.get("reverted", {})


def test_revert_guard_blocks_when_current_value_drifted(flask_client, base_db):
    item_id = _seed_unit(base_db, attack=99)         # current != logged new (6)
    cl_id = _seed_changelog(base_db, item_id, old=4, new=6)

    resp = flask_client.post(f"/revert/{cl_id}", json={"field": "attack_KK_FK"})
    assert resp.status_code == 409

    doc = base_db[UNIT_COLL].find_one({"_id": item_id})
    assert doc["attack_KK_FK"] == 99                 # untouched
    assert base_db["ChangeLogs"].count_documents({"type": "revert"}) == 0


def test_revert_null_to_value_case(flask_client, base_db):
    # The attack_KK_FK==None crash record: old value in the log is a real int.
    item_id = _seed_unit(base_db, attack=None)
    cl_id = _seed_changelog(base_db, item_id, old=5, new=None)

    resp = flask_client.post(f"/revert/{cl_id}", json={"field": "attack_KK_FK"})
    assert resp.status_code == 200
    assert base_db[UNIT_COLL].find_one({"_id": item_id})["attack_KK_FK"] == 5


def test_revert_already_reverted_conflicts(flask_client, base_db):
    item_id = _seed_unit(base_db, attack=6)
    cl_id = _seed_changelog(
        base_db, item_id, old=4, new=6,
        reverted={"attack_KK_FK": {"reverted_at": "2026-07-20"}},
    )
    resp = flask_client.post(f"/revert/{cl_id}", json={"field": "attack_KK_FK"})
    assert resp.status_code == 409


def test_revert_missing_field_in_body(flask_client, base_db):
    cl_id = _seed_changelog(base_db, _seed_unit(base_db))
    assert flask_client.post(f"/revert/{cl_id}", json={}).status_code == 400


def test_revert_field_not_part_of_entry(flask_client, base_db):
    cl_id = _seed_changelog(base_db, _seed_unit(base_db))
    resp = flask_client.post(f"/revert/{cl_id}", json={"field": "price"})
    assert resp.status_code == 400


def test_revert_changelog_not_found(flask_client):
    resp = flask_client.post(f"/revert/{ObjectId()}", json={"field": "attack_KK_FK"})
    assert resp.status_code == 404


def test_revert_item_not_found(flask_client, base_db):
    cl_id = _seed_changelog(base_db, ObjectId())     # item_id points to nothing
    resp = flask_client.post(f"/revert/{cl_id}", json={"field": "attack_KK_FK"})
    assert resp.status_code == 404


def test_revert_non_whitelisted_collection(flask_client, base_db):
    doc = {
        "_id": ObjectId(),
        "collection_name": "ChangeLogs",            # not a revertable collection
        "item_id": str(ObjectId()),
        "item_identifier": "x",
        "changes": {"attack_KK_FK": {"old": 4, "new": 6}},
    }
    base_db["ChangeLogs"].insert_one(doc)
    resp = flask_client.post(f"/revert/{doc['_id']}", json={"field": "attack_KK_FK"})
    assert resp.status_code == 400
