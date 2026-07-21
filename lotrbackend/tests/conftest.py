"""
Test setup: patch the Mongo connection with an in-memory mongomock client BEFORE
flaskApp is imported, so tests never touch the real Atlas database.
"""
import os
import sys

import pytest
import mongomock
from flask.testing import FlaskClient

# Make the backend importable and set cwd so swag_template can find docs/*.yml.
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)
os.chdir(BACKEND_DIR)

# Configure the shared write key before the app imports/reads it.
TEST_WRITE_KEY = "test-key"
os.environ["WRITE_API_KEY"] = TEST_WRITE_KEY

import Utils  # noqa: E402

# One shared in-memory client for the whole test session.
_mock_client = mongomock.MongoClient()
Utils.connect_to_mongodb = lambda: _mock_client

import flaskApp  # noqa: E402  (imported after the patch -> uses the mock client)


class KeyedClient(FlaskClient):
    """Auto-attach the write key so normal tests don't repeat it.
    Pass headers={'X-API-Key': None} to simulate an unauthenticated request.
    """
    def open(self, *args, **kwargs):
        headers = dict(kwargs.pop("headers", None) or {})
        if "X-API-Key" not in headers:
            headers["X-API-Key"] = TEST_WRITE_KEY
        elif headers["X-API-Key"] is None:
            del headers["X-API-Key"]
        kwargs["headers"] = headers
        return super().open(*args, **kwargs)


@pytest.fixture
def flask_client():
    flaskApp.app.config["TESTING"] = True
    flaskApp.app.test_client_class = KeyedClient
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
