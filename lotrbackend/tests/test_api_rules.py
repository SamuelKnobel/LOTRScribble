"""The API must never return the deprecated _rules mirror field."""
from bson.objectid import ObjectId

# Example shape taken from Test.txt (a machine/ship-like doc): rules is a list,
# _rules is the joined-string mirror that should be stripped from responses.
SAMPLE = {
    "Identifier": "Speerschleuder Schiff_ohne_Gondor",
    "rules": ["Artillerietabelle Speerschleuder"],
    "_rules": "Artillerietabelle Speerschleuder",
    "price": 100,
}


def test_get_list_strips_rules_mirror(flask_client, base_db):
    base_db["UnitData"].insert_one({"_id": ObjectId(), **SAMPLE})
    data = flask_client.get("/units").get_json()
    assert len(data) == 1
    assert data[0]["rules"] == ["Artillerietabelle Speerschleuder"]
    assert "_rules" not in data[0]


def test_get_by_id_strips_rules_mirror(flask_client, base_db):
    oid = ObjectId()
    base_db["UnitData"].insert_one({"_id": oid, **SAMPLE})
    data = flask_client.get(f"/units/{oid}").get_json()
    assert "rules" in data
    assert "_rules" not in data


def test_changelog_strips_nested_rules(flask_client, base_db):
    base_db["ChangeLogs"].insert_one({
        "_id": ObjectId(),
        "collection_name": "UnitData",
        "item_id": "abc",
        "item_identifier": "X",
        "changes": {
            "rules": {"old": ["A"], "new": ["A", "B"]},
            "_rules": {"old": "A", "new": "A, B"},
        },
    })
    data = flask_client.get("/changelog").get_json()
    assert len(data) == 1
    assert "rules" in data[0]["changes"]
    assert "_rules" not in data[0]["changes"]
