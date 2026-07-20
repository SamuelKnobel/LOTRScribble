"""Unit tests for the pure helpers in Utils (no database)."""
import json

from bson.objectid import ObjectId

import Utils


def test_values_equal_numbers():
    assert Utils.values_equal(5, 5)
    assert Utils.values_equal(5, 5.0)  # int/float interchangeable
    assert not Utils.values_equal(5, 6)


def test_values_equal_lists_and_none():
    assert Utils.values_equal(["a", "b"], ["a", "b"])
    assert not Utils.values_equal(["a"], ["a", "b"])
    assert Utils.values_equal(None, None)
    assert not Utils.values_equal(None, "")   # null != empty string
    assert not Utils.values_equal(-99, None)  # the revert-guard "empty vs -99" case


def test_validate_type_compatibility_allows_numbers_and_same_type():
    assert Utils.validate_type_compatibility(5, 7)[0]
    assert Utils.validate_type_compatibility(5, 7.5)[0]      # int -> float ok
    assert Utils.validate_type_compatibility("a", "b")[0]


def test_validate_type_compatibility_rejects_mismatches():
    # int field set to null -> the crash we guard against
    assert not Utils.validate_type_compatibility(5, None)[0]
    # rules list overwritten by a string -> the string/list bug
    assert not Utils.validate_type_compatibility(["A"], "A")[0]
    assert not Utils.validate_type_compatibility("x", 5)[0]


def test_convert_objectid_to_string_recurses():
    oid = ObjectId()
    data = {"_id": oid, "nested": {"id": oid}, "list": [oid, 1, "x"], "n": 5}
    out = Utils.convert_objectid_to_string(data)
    assert out["_id"] == str(oid)
    assert out["nested"]["id"] == str(oid)
    assert out["list"][0] == str(oid)
    assert out["list"][1] == 1 and out["n"] == 5


def test_format_for_log():
    assert Utils.format_for_log(5) == 5
    assert Utils.format_for_log("x") == "x"
    assert Utils.format_for_log(None) is None
    assert json.loads(Utils.format_for_log(["a", "b"])) == ["a", "b"]
