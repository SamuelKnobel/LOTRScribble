"""Tests for the core write path: PUT /<slug>/<id> (update_item_by_id).

This is what produces the ChangeLogs entries that the revert endpoint consumes,
so the logged {field: {old, new}} shape is contractually important.
"""
import json

from bson.objectid import ObjectId


def _seed(base_db, **fields):
    oid = ObjectId()
    base_db["UnitData"].insert_one({"_id": oid, "Identifier": "Test_Unit", **fields})
    return oid


def _put(flask_client, oid, update):
    # The frontend wraps the payload as {"body": "<json string>"}.
    return flask_client.put(f"/units/{oid}", json={"body": json.dumps(update)})


def test_update_changes_field_and_logs_change(flask_client, base_db):
    oid = _seed(base_db, attack_KK_FK=4)
    resp = _put(flask_client, oid, {"attack_KK_FK": 6})
    assert resp.status_code == 200

    assert base_db["UnitData"].find_one({"_id": oid})["attack_KK_FK"] == 6

    log = base_db["ChangeLogs"].find_one({"item_id": str(oid)})
    assert log is not None
    assert log["collection_name"] == "UnitData"
    assert log["item_identifier"] == "Test_Unit"
    assert log["changes"]["attack_KK_FK"] == {"old": 4, "new": 6}


def test_update_with_no_actual_change_logs_nothing(flask_client, base_db):
    oid = _seed(base_db, attack_KK_FK=4)
    resp = _put(flask_client, oid, {"attack_KK_FK": 4})
    assert resp.status_code == 200
    assert base_db["ChangeLogs"].count_documents({}) == 0


def test_update_logs_only_the_changed_fields(flask_client, base_db):
    oid = _seed(base_db, attack_KK_FK=4, price=30)
    _put(flask_client, oid, {"attack_KK_FK": 6, "price": 30})  # price unchanged
    log = base_db["ChangeLogs"].find_one({"item_id": str(oid)})
    assert set(log["changes"].keys()) == {"attack_KK_FK"}


def test_update_rules_list_roundtrips_and_logs(flask_client, base_db):
    oid = _seed(base_db, rules=["A"])
    resp = _put(flask_client, oid, {"rules": ["A", "B"]})
    assert resp.status_code == 200

    assert base_db["UnitData"].find_one({"_id": oid})["rules"] == ["A", "B"]
    log = base_db["ChangeLogs"].find_one({"item_id": str(oid)})
    assert log["changes"]["rules"] == {"old": ["A"], "new": ["A", "B"]}


def test_update_item_not_found_returns_404(flask_client):
    resp = _put(flask_client, ObjectId(), {"attack_KK_FK": 6})
    assert resp.status_code == 404


def test_revert_can_undo_a_logged_update_end_to_end(flask_client, base_db):
    # PUT logs the change, then revert restores it — proves the two share a contract.
    oid = _seed(base_db, attack_KK_FK=4)
    _put(flask_client, oid, {"attack_KK_FK": 6})
    cl_id = base_db["ChangeLogs"].find_one({"item_id": str(oid)})["_id"]

    resp = flask_client.post(f"/revert/{cl_id}", json={"field": "attack_KK_FK"})
    assert resp.status_code == 200
    assert base_db["UnitData"].find_one({"_id": oid})["attack_KK_FK"] == 4
