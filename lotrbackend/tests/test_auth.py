"""Write endpoints require the X-API-Key; reads and the Unity /startdata PUT stay open."""
import json

from bson.objectid import ObjectId

NO_KEY = {"X-API-Key": None}  # KeyedClient drops the header entirely


def test_get_is_open_without_key(flask_client, base_db):
    base_db["UnitData"].insert_one({"_id": ObjectId(), "Identifier": "X", "attack_KK_FK": 5})
    resp = flask_client.get("/units", headers=NO_KEY)
    assert resp.status_code == 200


def test_put_without_key_is_rejected(flask_client, base_db):
    oid = ObjectId()
    base_db["UnitData"].insert_one({"_id": oid, "Identifier": "X", "attack_KK_FK": 5})
    resp = flask_client.put(
        f"/units/{oid}", json={"body": json.dumps({"attack_KK_FK": 6})}, headers=NO_KEY
    )
    assert resp.status_code == 401
    assert base_db["UnitData"].find_one({"_id": oid})["attack_KK_FK"] == 5  # untouched


def test_put_with_wrong_key_is_rejected(flask_client, base_db):
    oid = ObjectId()
    base_db["UnitData"].insert_one({"_id": oid, "Identifier": "X", "attack_KK_FK": 5})
    resp = flask_client.put(
        f"/units/{oid}",
        json={"body": json.dumps({"attack_KK_FK": 6})},
        headers={"X-API-Key": "wrong"},
    )
    assert resp.status_code == 401


def test_revert_without_key_is_rejected(flask_client, base_db):
    doc = {
        "_id": ObjectId(),
        "collection_name": "UnitData",
        "item_id": str(ObjectId()),
        "item_identifier": "X",
        "changes": {"attack_KK_FK": {"old": 4, "new": 6}},
    }
    base_db["ChangeLogs"].insert_one(doc)
    resp = flask_client.post(
        f"/revert/{doc['_id']}", json={"field": "attack_KK_FK"}, headers=NO_KEY
    )
    assert resp.status_code == 401


# --- Downloads listing is gated by the download-password hash ---

def test_versions_without_download_key_is_rejected(flask_client, admin_db):
    admin_db["Versions"].insert_one({"_id": ObjectId(), "version": "2.4", "url": "http://x"})
    resp = flask_client.get("/admin/versions")  # no X-Download-Key
    assert resp.status_code == 401


def test_versions_with_wrong_download_key_is_rejected(flask_client, admin_db):
    admin_db["Versions"].insert_one({"_id": ObjectId(), "version": "2.4", "url": "http://x"})
    resp = flask_client.get("/admin/versions", headers={"X-Download-Key": "nope"})
    assert resp.status_code == 401


def test_versions_with_correct_download_key_returns_data(flask_client, admin_db):
    admin_db["Versions"].insert_one({"_id": ObjectId(), "version": "2.4", "url": "http://x"})
    resp = flask_client.get("/admin/versions", headers={"X-Download-Key": "test-download-key"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 1 and data[0]["version"] == "2.4"
