"""StartData constants: update via /startdata/constants and revert the change.

Covers the FoodSize tuple case, which used to be logged as a JSON string and
was therefore impossible to revert.
"""
from bson.objectid import ObjectId


def _seed_constants(base_db):
    base_db["Constants"].insert_one({
        "_id": ObjectId(), "name": "FertSeason",
        "Spring": 0.5, "Summer": 2.0, "Fall": 0.5, "Winter": 0.2,
    })
    base_db["Constants"].insert_one({
        "_id": ObjectId(), "name": "FoodSize",
        "S": {"Item1": 0.0, "Item2": 1.0},
        "R": {"Item1": 0.5, "Item2": 2.0},
    })


def test_update_constant_logs_raw_value(flask_client, base_db):
    _seed_constants(base_db)
    resp = flask_client.put("/startdata/constants/FertSeason",
                            json={"key": "Summer", "value": 3.0})
    assert resp.status_code == 200
    assert base_db["Constants"].find_one({"name": "FertSeason"})["Summer"] == 3.0

    log = base_db["ChangeLogs"].find_one({"collection_name": "Constants"})
    assert log["changes"]["Summer"] == {"old": 2.0, "new": 3.0}


def test_revert_a_constant_change(flask_client, base_db):
    _seed_constants(base_db)
    flask_client.put("/startdata/constants/FertSeason", json={"key": "Summer", "value": 3.0})
    cl_id = base_db["ChangeLogs"].find_one({"collection_name": "Constants"})["_id"]

    resp = flask_client.post(f"/revert/{cl_id}", json={"field": "Summer"})
    assert resp.status_code == 200
    assert base_db["Constants"].find_one({"name": "FertSeason"})["Summer"] == 2.0


def test_revert_a_foodsize_tuple_change(flask_client, base_db):
    """The tuple must be logged and restored as an object, not a JSON string."""
    _seed_constants(base_db)
    new_tuple = {"Item1": 0.5, "Item2": 4.0}
    resp = flask_client.put("/startdata/constants/FoodSize",
                            json={"key": "R", "value": new_tuple})
    assert resp.status_code == 200

    log = base_db["ChangeLogs"].find_one({"collection_name": "Constants"})
    assert log["changes"]["R"]["old"] == {"Item1": 0.5, "Item2": 2.0}  # object, not str

    resp = flask_client.post(f"/revert/{log['_id']}", json={"field": "R"})
    assert resp.status_code == 200
    restored = base_db["Constants"].find_one({"name": "FoodSize"})["R"]
    assert restored == {"Item1": 0.5, "Item2": 2.0}
