"""
Test setup: patch the Mongo connection with an in-memory mongomock client BEFORE
flaskApp is imported, so tests never touch the real Atlas database.
"""
import os
import sys

import pytest
import mongomock

# Make the backend importable and set cwd so swag_template can find docs/*.yml.
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)
os.chdir(BACKEND_DIR)

import Utils  # noqa: E402

# One shared in-memory client for the whole test session.
_mock_client = mongomock.MongoClient()
Utils.connect_to_mongodb = lambda: _mock_client

import flaskApp  # noqa: E402  (imported after the patch -> uses the mock client)


@pytest.fixture
def flask_client():
    flaskApp.app.config["TESTING"] = True
    return flaskApp.app.test_client()


@pytest.fixture
def base_db():
    return _mock_client["LOTR_BaseData"]


@pytest.fixture(autouse=True)
def _clean_db():
    """Empty every collection before each test for isolation."""
    db = _mock_client["LOTR_BaseData"]
    for name in db.list_collection_names():
        db[name].delete_many({})
    yield
