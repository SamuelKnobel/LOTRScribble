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


# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS
Swagger(app)

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
ENTITY_CONFIGS = [
    ('units',     'UnitData',     'Units',     'Units'),
    ('ships',     'ShipData',     'Ships',     'Ships'),
    ('machines',  'MachineData',  'Machines',  'Machines'),
    ('nations',   'NationData',   'Nations',   'Nations'),
    ('fields',    'FieldData',    'Fields',    'Fields'),
    ('buildings', 'BuildingData', 'Buildings', 'Buildings')
    # ('rules',     'RuleData',     'Rules',     'Rules'),
]

def register_entity_routes(app, url_slug, collection_name, display_name, tag_name):
    """
    Dynamically registers GET (List), GET (ID), and PUT (ID) routes 
    for a specific entity type.
    """
    
    # --- 1. GET ALL (List) ---
    @app.route(f'/{url_slug}', methods=['GET'], endpoint=f'get_{url_slug}')
    @swag_template('docs/generic_get.yml', name=display_name)
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
    def update_one(id):
        return update_item_by_id(collection_name, id)

#-------------------- RULES --------------------# 
@app.route('/rules', methods=['GET'])
@swag_template('docs/generic_get.yml', name='Rules')
def get_rules():
    return get_baseData('RuleData')

@app.route('/rules/<id>', methods=['GET'])
@swag_template('docs/generic_get_id.yml', name='Rule', tag='Rules')
def get_rule(id):
    return get_item_by_id('RuleData', id)

#### TODO: Needs Identifier field to be added to RuleData collection, if added then it can be put back into the ENTITY_CONFIGS and registered automatically
# @app.route('/rules/<id>', methods=['PUT'])
# @swag_template('docs/generic_put_id.yml', name='Rule', tag='Rules')
# def update_rules(id):
#     return update_item_by_id("RuleData", id)


#-------------------- CHANGE LOGS --------------------#
@app.route('/changelog', methods=['GET'])
@swag_template('docs/changelog_get.yml')
def get_changelog():
    return get_baseData('ChangeLogs')

#-------------------- START DATA --------------------#
@app.route('/StartData/<data_name>', methods=['GET'])
@swag_template('docs/startdata_get.yml')
def get_startdata(data_name):
    return get_gameData(data_name)

@app.route('/StartData/<data_name>', methods=['PUT'])
@swag_template('docs/startdata_put.yml')
def update_startdata(data_name):
    logging.info(f'Attempting to update StartData: {data_name}')
    
    # --- 1. SETUP & PARSING ---
    collection = db_BaseData["StartData"]
    item = collection.find_one({"name": data_name})
    
    if not item:
        return jsonify({'error': f'Data container "{data_name}" not found'}), 404

    data = request.get_json()
    if not data or 'key' not in data or 'value' not in data:
        return jsonify({'error': 'Request body must contain "key" and "value"'}), 400

    target_key = str(data['key']) 
    new_value = data['value']

    # --- 2. VALIDATION (Delegated to Utils) ---
    # Check if key exists
    if target_key not in item:
        return jsonify({'error': f'Key "{target_key}" does not exist in "{data_name}".'}), 400

    current_value = item[target_key]

    # Check type compatibility
    is_valid, error_msg = Utils.validate_type_compatibility(current_value, new_value)
    if not is_valid:
        return jsonify({'error': error_msg}), 400

    # --- 3. LOGGING CHANGES ---
    if current_value != new_value:
        changes = {
            target_key: {
                'old': Utils.format_for_log(current_value), 
                'new': Utils.format_for_log(new_value)
            }
        }
        try:
            Utils.log_changes(
                db=db_BaseData,
                collection_name="StartData",
                item_id=str(item["_id"]), 
                item_identifier=data_name, 
                changes=changes
            )
            logging.info(f"Logged changes for {data_name}: {changes}")
        except Exception as log_error:
            logging.error(f"Failed to log changes: {log_error}")

    # --- 4. EXECUTE UPDATE ---
    try:
        collection.update_one(
            {"_id": item["_id"]},
            {"$set": {target_key: new_value}}
        )
        logging.info(f'Updated {data_name} -> {target_key} to {new_value}')
        
        return jsonify({
            'success': True, 
            'message': f'Updated {target_key} to {new_value}',
            'newValue': new_value
        }), 200
        
    except Exception as e:
        logging.error(f"Database update failed: {e}")
        return jsonify({'error': 'Internal Database Error'}), 500

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
    collection = db_BaseData[collection_name]
    item = collection.find_one({'_id': ObjectId(item_id)})

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
      200:
        description: List of items.
      404:
        description: Items not found.
    """
    logging.info(f'Collection Name: {collection_name}')
    collection = db_BaseData[collection_name]
    items = list(collection.find())
    logging.info(f'Nb of Items in Collection: {len(items)}')
    logging.debug(f'Items in Collection: {items}')

    items_clean = Utils.convert_objectid_to_string(items)

    return jsonify(items_clean)

def get_gameData(data_name: str):
    """
    Get a list of all items in the specified collection.
    ---
    parameters:
      - name: collection_name
        in: path
        type: string
        description: The name of the collection to retrieve data from.
    responses:
      200:
        description: List of items.
      404:
        description: Items not found.
    """
    logging.info(f'Collection Name: {"StartData"}')
    collection = db_BaseData["StartData"]
    items = list(collection.find())
    for item in items:
        if item["name"] == data_name:
            logging.info(f'Found Data: {item}')
            item["_id"] = Utils.convert_objectid_to_string(item["_id"])
            return item
    return jsonify({'error': f'Data: {data_name} not found'}), 404



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

    # Returns the result from the PUT request<-- new data that should be written
    data = request.get_json()
    logging.debug(f'Data = {data}')
    # Ensure that the data is structured as {'$set': {field_name: new_value}}
    update_data = json.loads(data['body'])
    logging.debug(f'Update Data = {update_data}')
    update_data.pop("_id", None)

    # Get the existing item data
    collection = db_BaseData[collection_name]
    existing_item = collection.find_one({'_id': ObjectId(item_id)})

    if existing_item:
        filter_ = {'_id': ObjectId(item_id)}
        new_values = {"$set": update_data}

        # Compare existing values with new values to detect changes
        changes = {}
        for key, value in existing_item.items():
            if key in update_data and value != update_data[key]:
                changes[key] = {'old': value, 'new': update_data[key]}
        logging.info(changes)
        if changes:
            identifier = "item"
            # Log changes
            if existing_item['Identifier']:
                identifier = existing_item['Identifier']
            elif existing_item['name']:
                identifier = existing_item['name']

            # currently logs are not saved, each trigger of this function recreates the ChangeLog Collection
            Utils.log_changes(db_BaseData, collection_name, item_id, identifier, changes)

        collection.update_one(filter_, new_values)
        return jsonify({'message': 'Unit updated successfully'})

    else:
        return jsonify({'error': f'Item: {item_id} or {collection_name.capitalize()} not found'}), 404


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