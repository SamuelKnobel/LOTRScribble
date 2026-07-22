"""Rules / spells / battlefield expose the same routes as every other entity.

These pin the behaviour so it can be proven identical before and after those
three are registered from ENTITY_CONFIGS instead of by hand.
"""
from bson.objectid import ObjectId


def test_rules_list_and_by_id(flask_client, base_db):
    oid = ObjectId()
    base_db["RuleData"].insert_one({"_id": oid, "name": "Horde", "Description": "old"})

    listed = flask_client.get("/rules").get_json()
    assert len(listed) == 1 and listed[0]["name"] == "Horde"

    one = flask_client.get(f"/rules/{oid}").get_json()
    assert one["name"] == "Horde"


def test_rules_update_requires_key_and_logs_the_change(flask_client, base_db):
    oid = ObjectId()
    base_db["RuleData"].insert_one({"_id": oid, "name": "Horde", "Description": "old"})

    unauth = flask_client.put(
        f"/rules/{oid}", json={"Description": "new"}, headers={"X-API-Key": None}
    )
    assert unauth.status_code == 401

    resp = flask_client.put(f"/rules/{oid}", json={"Description": "new"})
    assert resp.status_code == 200
    assert base_db["RuleData"].find_one({"_id": oid})["Description"] == "new"

    log = base_db["ChangeLogs"].find_one({"item_id": str(oid)})
    assert log["collection_name"] == "RuleData"
    # RuleData has no Identifier field, so logging falls back to 'name'
    assert log["item_identifier"] == "Horde"
    assert log["changes"]["Description"] == {"old": "old", "new": "new"}


def test_spells_list_and_update(flask_client, base_db):
    oid = ObjectId()
    base_db["SpellData"].insert_one({"_id": oid, "name": "Feuerball", "focus": 3})

    assert len(flask_client.get("/spells").get_json()) == 1

    resp = flask_client.put(f"/spells/{oid}", json={"focus": 4})
    assert resp.status_code == 200
    assert base_db["SpellData"].find_one({"_id": oid})["focus"] == 4


def test_battlefield_list_and_by_id(flask_client, base_db):
    oid = ObjectId()
    base_db["BattleRuleData"].insert_one({"_id": oid, "name": "Schilde", "Description": "x"})

    assert len(flask_client.get("/battlefield").get_json()) == 1
    assert flask_client.get(f"/battlefield/{oid}").get_json()["name"] == "Schilde"
