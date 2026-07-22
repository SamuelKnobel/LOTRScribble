import logging
from flask import Flask, request, jsonify, redirect, url_for
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from flasgger import Swagger
from flasgger import swag_from
import json
import Utils
import atexit
import os
from logging.config import dictConfig
from dotenv import load_dotenv
from decorators import swag_template
from typing import Optional
from datetime import datetime
from functools import wraps

dictConfig({
    'version': 1,
    'formatters': {'default': {
        'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
    }},
    'handlers': {'wsgi': {
        'class': 'logging.StreamHandler',
        'stream': 'ext://flask.logging.wsgi_errors_stream',
        'formatter': 'default'
    }},
    'root': {
        'level': 'INFO',
        'handlers': ['wsgi']
    }
})
# Connect to MongoDB
client = Utils.connect_to_mongodb()
db_BaseData = client['LOTR_BaseData']
db_GameData = client['LOTR_GameData']
db_Admin = client['LOTR_Admin']


# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS
Swagger(app)


def require_write_key(view):
    """Gate write endpoints behind a shared key sent in the X-API-Key header.

    The expected key is read from WRITE_API_KEY at request time. Reads (GET) and
    the Unity-used /startdata/constants PUT are intentionally left open. Fails
    closed: if WRITE_API_KEY is unset, all guarded writes are rejected.
    """
    @wraps(view)
    def wrapper(*args, **kwargs):
        expected = os.getenv('WRITE_API_KEY')
        provided = request.headers.get('X-API-Key')
        if not expected or provided != expected:
            return jsonify({'error': 'Unauthorized'}), 401
        return view(*args, **kwargs)
    return wrapper


def require_download_key(view):
    """Gate the downloads listing behind the download password.

    Compares the X-Download-Key header (a SHA-256 hash sent by the webpage)
    against DOWNLOAD_PASSWORD_HASH. Fails closed if the env var is unset.
    """
    @wraps(view)
    def wrapper(*args, **kwargs):
        expected = os.getenv('DOWNLOAD_PASSWORD_HASH')
        provided = request.headers.get('X-Download-Key')
        if not expected or provided != expected:
            return jsonify({'error': 'Unauthorized'}), 401
        return view(*args, **kwargs)
    return wrapper

@app.route('/apidocs/')
def APIHOME():
    return " LOTR Backend API Documentation Home. Navigate to /apidocs/index.html for Swagger UI."


@app.route('/')
def index():
    return redirect(url_for("APIHOME"))

@atexit.register
def shutdown_db_client():
    client.close()
    print("MongoDB client closed on exit.")


# Configuration: (URL Slug, DB Collection Name, Display Name for Docs, Tag)
# Every data entity is registered from here; see register_entity_routes below.
ENTITY_CONFIGS = [
    ('units',       'UnitData',       'Units',             'Units'),
    ('ships',       'ShipData',       'Ships',             'Ships'),
    ('machines',    'MachineData',    'Machines',          'Machines'),
    ('nations',     'NationData',     'Nations',           'Nations'),
    ('fields',      'FieldData',      'Fields',            'Fields'),
    ('buildings',   'BuildingData',   'Buildings',         'Buildings'),
    ('rules',       'RuleData',       'Rules',             'Rules'),
    ('spells',      'SpellData',      'Spells',            'Spells'),
    ('battlefield', 'BattleRuleData', 'Battlefield Rules', 'Battlefield'),
]

def register_entity_routes(app, url_slug, collection_name, display_name, tag_name):
    """
    Dynamically registers GET (List), GET (ID), and PUT (ID) routes 
    for a specific entity type.
    """
    
    # --- 1. GET ALL (List) ---
    @app.route(f'/{url_slug}', methods=['GET'], endpoint=f'get_{url_slug}')
    @swag_template('docs/generic_get.yml', name=display_name, tag=tag_name)
    def get_all():
        return get_baseData(collection_name)

    # --- 2. GET BY ID ---
    @app.route(f'/{url_slug}/<id>', methods=['GET'], endpoint=f'get_{url_slug}_id')
    @swag_template('docs/generic_get_id.yml', name=display_name[:-1], tag=tag_name) # "Unit" vs "Units"
    def get_one(id):
        return get_item_by_id(collection_name, id)

    # --- 3. UPDATE BY ID ---
    @app.route(f'/{url_slug}/<id>', methods=['PUT'], endpoint=f'update_{url_slug}')
    @swag_template('docs/generic_put_id.yml', name=display_name[:-1], tag=tag_name)
    @require_write_key
    def update_one(id):
        return update_item_by_id(collection_name, id)

#-------------------- CHANGE LOGS --------------------#
@app.route('/changelog', methods=['GET'])
@swag_template('docs/changelog_get.yml')
def get_changelog():
    # Newest first, with optional pagination (?skip=&limit=). Also drops the
    # deprecated nested changes._rules so it is never returned.
    skip = request.args.get('skip', default=0, type=int)
    limit = request.args.get('limit', default=0, type=int)
    cursor = db_BaseData['ChangeLogs'].find({}, {'changes._rules': 0}).sort('timestamp', -1)
    if skip:
        cursor = cursor.skip(skip)
    if limit:
        cursor = cursor.limit(limit)
    return jsonify(Utils.convert_objectid_to_string(list(cursor)))


# Collections whose entries may be reverted: every registered data entity, plus
# the StartData constants edited from the Start Settings tab.
VALID_REVERT_COLLECTIONS = {cfg[1] for cfg in ENTITY_CONFIGS} | {'Constants'}


@app.route('/revert/<changelog_id>', methods=['POST'])
@swag_template('docs/revert_post.yml')
@require_write_key
def revert_change(changelog_id):
    """
    Revert a single field of a logged change back to its previous ('old') value.

    Body: { "field": "<field name from the changelog entry's 'changes'>" }

    Guard: the field's CURRENT value in the target document must still equal the
    'new' value recorded in the changelog entry. If it drifted (a later edit, or
    an already-applied revert), the revert is aborted with 409 and nothing is written.

    On success it also (1) logs the revert as its own changelog entry and
    (2) stamps the original entry with reverted.<field> metadata.
    """
    body = request.get_json(silent=True) or {}
    field = body.get('field')
    if not field:
        return jsonify({'error': "Missing 'field' in request body"}), 400

    changelogs = db_BaseData['ChangeLogs']
    try:
        log_entry = changelogs.find_one({'_id': ObjectId(changelog_id)})
    except Exception:
        return jsonify({'error': f'Invalid changelog id: {changelog_id}'}), 400
    if not log_entry:
        return jsonify({'error': f'Changelog entry {changelog_id} not found'}), 404

    changes = log_entry.get('changes', {})
    if field not in changes:
        return jsonify({'error': f"Field '{field}' is not part of this changelog entry"}), 400

    # Already reverted? (per-field metadata stamp)
    if field in (log_entry.get('reverted') or {}):
        return jsonify({'error': f"Field '{field}' has already been reverted"}), 409

    collection_name = log_entry.get('collection_name')
    if collection_name not in VALID_REVERT_COLLECTIONS:
        return jsonify({'error': f"Collection '{collection_name}' cannot be reverted"}), 400

    item_id = log_entry.get('item_id')
    collection = db_BaseData[collection_name]
    try:
        doc = collection.find_one({'_id': ObjectId(item_id)})
    except Exception:
        return jsonify({'error': f'Invalid item id: {item_id}'}), 400
    if not doc:
        return jsonify({'error': f'Item {item_id} not found in {collection_name}'}), 404

    old_value = changes[field].get('old')
    expected_value = changes[field].get('new')
    current_value = doc.get(field)

    # GUARD: current value must still match the change we are reverting
    if not Utils.values_equal(current_value, expected_value):
        return jsonify({
            'error': 'Revert aborted: the current value no longer matches the change being reverted.',
            'field': field,
            'expected_current': expected_value,
            'actual_current': current_value,
        }), 409

    # Perform the revert
    collection.update_one({'_id': ObjectId(item_id)}, {'$set': {field: old_value}})

    # Record the revert as its own changelog entry
    revert_log_id = Utils.log_changes(
        db_BaseData,
        collection_name,
        item_id,
        log_entry.get('item_identifier', 'item'),
        {field: {'old': current_value, 'new': old_value}},
        extra={
            'type': 'revert',
            'reverted_from': str(changelog_id),
            'reverted_field': field,
        },
    )

    # Stamp the original entry with additive per-field metadata (no delete)
    changelogs.update_one(
        {'_id': ObjectId(changelog_id)},
        {'$set': {f'reverted.{field}': {
            'reverted_at': datetime.now(),
            'reverted_by_log_id': str(revert_log_id),
        }}},
    )

    updated = collection.find_one({'_id': ObjectId(item_id)})
    return jsonify({
        'message': f"Reverted '{field}' successfully.",
        'field': field,
        'reverted_to': old_value,
        'item': Utils.convert_objectid_to_string(updated),
    }), 200


#-------------------- START DATA --------------------#
@app.route('/startdata/constants/<data_name>', methods=['GET'])
@swag_template('docs/gameStartData_get.yml') 
def get_startdata_constant(data_name):
    return get_start_data_generic("Constants", doc_name=data_name)

@app.route('/startdata/constants/<data_name>', methods=['PUT'])
@swag_template('docs/gameStartData_put.yml')
def update_startdata_constant(data_name):
    return update_start_data_generic("Constants", doc_name=data_name)


@app.route('/startdata/startfields', methods=['GET'])
@swag_template('docs/generic_get.yml', name='StartFields', tag='StartData') 
def get_startdata_fields():
    return get_start_data_generic("StartFields")

@app.route('/startdata/startnations', methods=['GET'])
@swag_template('docs/generic_get.yml', name='StartNations', tag='StartData')
def get_startdata_nations():
    return get_start_data_generic("StartNations")

@app.route('/startdata/startbuildings', methods=['GET'])
@swag_template('docs/generic_get.yml', name='StartBuildings', tag='StartData')
def get_startdata_buildings():
    return get_start_data_generic("StartBuildings")


@app.route('/admin/versions', methods=['GET'])
@swag_template('docs/versions.yml')
@require_download_key
def get_versions():
    collection = db_Admin["Versions"]
    items = list(collection.find())
    items_clean = Utils.convert_objectid_to_string(items)

    return items_clean
    

# Fields retained in the DB but never returned by the API (derived / deprecated).
# _rules is the old joined-string mirror of the rules list; clients use rules.
API_HIDDEN_FIELDS = {'_rules': 0}


def get_item_by_id(collection_name, item_id):
    """
      Helper function to retrieve a specific item by its ID from the database.

      Args:
          collection_name (str): The name of the MongoDB collection to query.
          item_id (str): The unique MongoDB ID (ObjectId) string of the item.

      Returns:
          tuple: A tuple containing:
              - flask.Response: A JSON response with the item data or an error message.
              - int: The HTTP status code (200 for success, 404 for not found).

                  print(collection_name)
    """
    try:
        oid = ObjectId(item_id)
    except Exception:
        return jsonify({'error': f'Invalid id: {item_id}'}), 400

    collection = db_BaseData[collection_name]
    item = collection.find_one({'_id': oid}, API_HIDDEN_FIELDS)

    if item:
        item_clean = Utils.convert_objectid_to_string(item)
        return jsonify(item_clean)
    else:
        return jsonify({'error': f'{collection_name.capitalize()} not found'}), 404


def get_baseData(collection_name):
    """
    Get a list of all items in the specified collection.
    ---
    parameters:
      - name: collection_name
        in: path
        type: string
        description: The name of the collection to retrieve data from.
    responses:
    """
    logging.info(f'Collection Name: {collection_name}')
    collection = db_BaseData[collection_name]
    # Optional pagination (default: everything, so Unity's full reads are unaffected).
    skip = request.args.get('skip', default=0, type=int)
    limit = request.args.get('limit', default=0, type=int)
    cursor = collection.find({}, API_HIDDEN_FIELDS)
    if skip:
        cursor = cursor.skip(skip)
    if limit:
        cursor = cursor.limit(limit)
    items = list(cursor)
    logging.info(f'Nb of Items in Collection: {len(items)}')
    logging.debug(f'Items in Collection: {items}')

    items_clean = Utils.convert_objectid_to_string(items)

    return jsonify(items_clean)

def update_item_by_id(collection_name, item_id):
    """
    Helper function to handle the update logic for a specific item in a collection.

    It extracts the update data from the request, detects changes for logging, 
    updates the MongoDB document, and returns a standard Flask JSON response.

    Args:
        collection_name (str): The name of the MongoDB collection (e.g., 'UnitData').
        item_id (str): The unique MongoDB ID (ObjectId) string of the item to update.

    Returns:
        tuple: A tuple containing:
            - flask.Response: A JSON response with a success message or error.
            - int: The HTTP status code (200 for success, 404 for not found).
    """

    # The update payload is the JSON body itself (the fields to change).
    update_data = request.get_json(silent=True)
    if not isinstance(update_data, dict):
        return jsonify({'error': 'Request body must be a JSON object'}), 400
    logging.debug(f'Update Data = {update_data}')
    update_data.pop("_id", None)

    try:
        oid = ObjectId(item_id)
    except Exception:
        return jsonify({'error': f'Invalid id: {item_id}'}), 400

    # Get the existing item data
    collection = db_BaseData[collection_name]
    existing_item = collection.find_one({'_id': oid})

    if existing_item:
        filter_ = {'_id': oid}
        new_values = {"$set": update_data}

        # Compare existing values with new values to detect changes, and refuse
        # any change that would corrupt the data for other clients (e.g. Unity).
        changes = {}
        rejected = {}
        for key, value in existing_item.items():
            if key in update_data and value != update_data[key]:
                reason = Utils.is_unsafe_change(value, update_data[key])
                if reason:
                    rejected[key] = reason
                else:
                    changes[key] = {'old': value, 'new': update_data[key]}

        if rejected:
            return jsonify({
                'error': 'Update rejected: unsafe field change(s).',
                'fields': rejected,
            }), 400

        logging.info(changes)
        if changes:
            # Label for the changelog entry: prefer Identifier, fall back to name
            # (RuleData/SpellData/BattleRuleData only have a name).
            identifier = "item"
            if existing_item.get('Identifier'):
                identifier = existing_item['Identifier']
            elif existing_item.get('name'):
                identifier = existing_item['name']
            else:
                logging.warning(
                    "No Identifier or name on %s/%s; logging the change as 'item'.",
                    collection_name, item_id,
                )

            Utils.log_changes(db_BaseData, collection_name, item_id, identifier, changes)

        collection.update_one(filter_, new_values)
        return jsonify({'message': 'Unit updated successfully'})

    else:
        return jsonify({'error': f'Item: {item_id} or {collection_name.capitalize()} not found'}), 404


def get_start_data_generic(collection_name: str, doc_name:Optional[str] = None):
    """
    Retrieves StartData configurations from the database.
    
    This generic function handles two retrieval modes:
    1. **Collection Mode** (doc_name=None): Returns a list of ALL documents in the collection.
       Useful for collections like 'StartFields' or 'StartNations'.
    2. **Single Item Mode** (doc_name set): Returns a SINGLE document where the 'name' field matches.
       Useful for the 'Constants' collection (e.g., retrieving 'FertSeason').

    Args:
        collection_name (str): The name of the MongoDB collection (e.g., 'Constants', 'StartFields').
        doc_name (str, optional): The specific 'name' identifier to find. Defaults to None.

    Returns:
        tuple: A tuple containing:
            - flask.Response: JSON data (List of items OR Single item) or error message.
            - int: HTTP Status Code (200 for success, 404 for not found).
    """
    logging.info(f'Fetching StartData | Collection: {collection_name} | Target: {doc_name if doc_name else "ALL"}')
    collection = db_BaseData[collection_name]

    if doc_name:
        # OPTIMIZATION: Query MongoDB directly for the specific name 
        # instead of loading the whole list into memory.
        item = collection.find_one({"name": doc_name})
        
        if item:
            logging.info(f'Found Data: {doc_name}')
            clean_item = Utils.convert_objectid_to_string(item)
            return jsonify(clean_item), 200
        else:
            logging.warning(f'Data "{doc_name}" not found in {collection_name}')
            return jsonify({'error': f'Data "{doc_name}" not found'}), 404
            
    else:
        # Return the full list of documents
        items = list(collection.find())
        logging.info(f'Retrieved {len(items)} items from {collection_name}')
        clean_items = Utils.convert_objectid_to_string(items)
        return jsonify(clean_items), 200

def update_start_data_generic(collection_name, doc_name):
    """
    Generic logic to update a single field in a named StartData document.
    
    Performs the following steps:
    1. Validates existence of the document and target field.
    2. Enforces type safety (using Utils).
    3. Logs changes to the ChangeLogs collection (using Utils).
    4. Updates the MongoDB document.

    Args:
        collection_name (str): The name of the MongoDB collection (e.g., 'Constants').
        doc_name (str): The 'name' identifier of the document to update (e.g., 'FertSeason').

    Returns:
        tuple: (flask.Response, int) - JSON response and HTTP status code.
    """
    logging.info(f'Update Request | Collection: {collection_name} | Document: {doc_name}')
    
    # --- 1. SETUP & FIND ---
    collection = db_BaseData[collection_name]
    item = collection.find_one({"name": doc_name})
    
    if not item:
        return jsonify({'error': f'Document "{doc_name}" not found in {collection_name}'}), 404

    # --- 2. PARSE REQUEST ---
    data = request.get_json()
    if not data or 'key' not in data or 'value' not in data:
        return jsonify({'error': 'Request body must contain "key" and "value"'}), 400

    target_key = str(data['key']) 
    new_value = data['value']

    # --- 3. VALIDATION ---
    # Security: Prevent creating new keys (Schema enforcement)
    if target_key not in item:
        return jsonify({'error': f'Key "{target_key}" does not exist in "{doc_name}". Creating new keys is forbidden.'}), 400

    # Type Safety: Check if new value matches old value type (allowing Int <-> Float)
    current_value = item[target_key]
    is_valid, error_msg = Utils.validate_type_compatibility(current_value, new_value)
    if not is_valid:
        return jsonify({'error': error_msg}), 400

    # --- 4. LOGGING ---
    if current_value != new_value:
        # Log the raw values (Mongo stores nested objects natively). Stringifying
        # them here would make tuple fields like FoodSize impossible to revert,
        # and this matches how update_item_by_id logs base-data changes.
        changes = {
            target_key: {'old': current_value, 'new': new_value}
        }
        try:
            # Use identifier if available, fallback to doc_name
            identifier = item.get('Identifier', doc_name)
            
            Utils.log_changes(
                db=db_BaseData,
                collection_name=collection_name,
                item_id=str(item["_id"]), 
                item_identifier=identifier, 
                changes=changes
            )
            logging.info(f"Change Logged: {changes}")
        except Exception as log_error:
            logging.error(f"Failed to log changes: {log_error}")

    # --- 5. UPDATE EXECUTION ---
    try:
        collection.update_one(
            {"_id": item["_id"]},
            {"$set": {target_key: new_value}}
        )
        logging.info(f'Success: Updated {doc_name}.{target_key} to {new_value}')
        
        return jsonify({
            'success': True, 
            'message': f'Updated {target_key}',
            'newValue': new_value
        }), 200
        
    except Exception as e:
        logging.error(f"Database update failed: {e}")
        return jsonify({'error': 'Internal Database Error'}), 500



# @app.after_request
# def after_request(response):
#     response.headers.add('Access-Control-Allow-Origin', '*')
#     response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
#     response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
#     return response

# Register all standard CRUD routes automatically
for url, col, name, tag in ENTITY_CONFIGS:
    register_entity_routes(app, url, col, name, tag)

# if __name__ == '__main__':
#     logging.info("Test")
#     # run app in debug mode on port 81
#     app.run(debug=True, port=81, host='0.0.0.0', ssl_context='adhoc')


if __name__ == "__main__":
    load_dotenv()
    port = os.getenv('PORT',5000)
    app.run(host="0.0.0.0", port=port)



# load page using https://192.168.178.23:81/apidocs/