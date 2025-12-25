import logging
from flask import Flask, request, jsonify, redirect, url_for
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from flasgger import Swagger
from flasgger import swag_from
import json
import sys
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

#-------------------- UNITS --------------------#
@app.route('/units', methods=['GET'])
@swag_template('docs/generic_get.yml', name='Units')
def get_units():
    return get_baseData('UnitData')

@app.route('/units/<id>', methods=['GET'])
@swag_template('docs/generic_get_id.yml', name='Unit', tag='Units')
def get_unit(id):
    return get_item_by_id('UnitData', id)

@app.route('/units/<id>', methods=['PUT'])
@swag_template('docs/generic_put_id.yml', name='Unit', tag='Units')
def update_unit(id):
    return update_item_by_id("UnitData", id)


#-------------------- SHIPS --------------------#
@app.route('/ships', methods=['GET'])
@swag_template('docs/generic_get.yml', name='Ships')
def get_ships():
    return get_baseData('ShipData')

@app.route('/ships/<id>', methods=['GET'])
@swag_template('docs/generic_get_id.yml', name='Ship', tag='Ships')
def get_ship(id):
    return get_item_by_id('ShipData', id)

@app.route('/ships/<id>', methods=['PUT'])
@swag_template('docs/generic_put_id.yml', name='Ship', tag='Ships')
def update_ship(id):
    return update_item_by_id("ShipData", id)

#-------------------- MACHINES --------------------#
@app.route('/machines', methods=['GET'])
@swag_template('docs/generic_get.yml', name='Machines')
def get_machines():
    return get_baseData('MachineData')

@app.route('/machines/<id>', methods=['GET'])
@swag_template('docs/generic_get_id.yml', name='Machine', tag='Machines')
def get_machine(id):
    return get_item_by_id('MachineData', id)

@app.route('/machines/<id>', methods=['PUT'])
@swag_template('docs/generic_put_id.yml', name='Machine', tag='Machines')
def update_machine(id):
    return update_item_by_id("MachineData", id)

#-------------------- NATIONS --------------------#
@app.route('/nations', methods=['GET'])
@swag_template('docs/generic_get.yml', name='Nations')
def get_nations():
    return get_baseData('NationData')

@app.route('/nations/<id>', methods=['GET'])
@swag_template('docs/generic_get_id.yml', name='Nation', tag='Nations')
def get_nation(id):
    return get_item_by_id('NationData', id)

@app.route('/nations/<id>', methods=['PUT'])
@swag_template('docs/generic_put_id.yml', name='Nation', tag='Nations')
def update_nation(id):
    return update_item_by_id("NationData", id)


#-------------------- FIELDS --------------------#
@app.route('/fields', methods=['GET'])
@swag_template('docs/generic_get.yml', name='Fields')
def get_fields():
    return get_baseData('FieldData')

@app.route('/fields/<id>', methods=['GET'])
@swag_template('docs/generic_get_id.yml', name='Field', tag='Fields')
def get_field(id):
    return get_item_by_id('FieldData', id)

@app.route('/fields/<id>', methods=['PUT'])
@swag_template('docs/generic_put_id.yml', name='Field', tag='Fields')
def update_fields(id):
    return update_item_by_id("FieldData", id)


#-------------------- BUILDINGS --------------------#
@app.route('/buildings', methods=['GET'])
@swag_template('docs/generic_get.yml', name='Buildings')
def get_buildings():
    return get_baseData('BuildingData')

@app.route('/buildings/<id>', methods=['GET'])
@swag_template('docs/generic_get_id.yml', name='Building', tag='Buildings')
def get_building(id):
    return get_item_by_id('BuildingData', id)

@app.route('/buildings/<id>', methods=['PUT'])
@swag_template('docs/generic_put_id.yml', name='Building', tag='Buildings')
def update_buildings(id):
    return update_item_by_id("BuildingData", id)


#-------------------- RULES --------------------#
@app.route('/rules', methods=['GET'])
@swag_template('docs/generic_get.yml', name='Rules')
def get_rules():
    return get_baseData('RuleData')


#-------------------- CHANGE LOGS --------------------#
@app.route('/changelog', methods=['GET'])
@swag_template('docs/generic_get.yml', name='ChangeLogs')
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
    
    # 1. Get the collection
    collection = db_BaseData["StartData"]
    
    # 2. Find the document
    item = collection.find_one({"name": data_name})
    
    if not item:
        return jsonify({'error': f'Data container "{data_name}" not found'}), 404

    # 3. Parse Request Body
    data = request.get_json()
    if not data or 'key' not in data or 'value' not in data:
        return jsonify({'error': 'Request body must contain "key" and "value"'}), 400

    target_key = str(data['key']) 
    new_value = data['value']
    
    # 4. Validate: Does Key Exist?
    if target_key not in item:
        return jsonify({'error': f'Key "{target_key}" does not exist in "{data_name}". Creating new keys is forbidden.'}), 400

    # 5. Validate: Data Type Consistency
    current_value = item[target_key]
    
    if isinstance(current_value, (int, float)) and isinstance(new_value, (int, float)):
        # If both are numbers, we allow the update regardless of specific type.
        # This allows a DB 'int' (1) to be overwritten by a 'float' (0.5), correcting the type in the DB.
        pass        
    # Check if types match
    elif type(current_value) != type(new_value):
        return jsonify({
            'error': f'Type Mismatch. Key "{target_key}" expects {type(current_value).__name__}, but got {type(new_value).__name__}'
        }), 400

# --- LOGGING CHANGES START ---
    # Only log if the value actually changed
    if current_value != new_value:
        
        # Helper to stringify complex objects for logging
        def format_for_log(val):
            # If it's a simple primitive, keep it as is
            if isinstance(val, (int, float, str, bool)):
                return val
            # If it's none, return None
            if val is None:
                return None
            # Otherwise (dict, list, tuple, etc.), dump to JSON string
            try:
                import json
                return json.dumps(val)
            except:
                return str(val)

        # Apply formatting
        log_old = format_for_log(current_value)
        log_new = format_for_log(new_value)

        changes = {
            target_key: {
                'old': log_old, 
                'new': log_new
            }
        }
        
        try:
            # Using data_name (e.g. "Trade") as the identifier
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
    # --- LOGGING CHANGES END ---

    # 6. Perform the Update
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
    logging.debug(f'Nb of Items in Collection: {len(items)}')
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
    logging.info(f'Data = {data}')
    # Ensure that the data is structured as {'$set': {field_name: new_value}}
    update_data = json.loads(data['body'])
    logging.info(f'Update Data = {update_data}')
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
        logging.debug(changes)
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


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response



# if __name__ == '__main__':
#     logging.info("Test")
#     # run app in debug mode on port 81
#     app.run(debug=True, port=81, host='0.0.0.0', ssl_context='adhoc')


if __name__ == "__main__":
    load_dotenv()
    port = os.getenv('PORT',5000)
    app.run(host="0.0.0.0", port=port)



# load page using https://192.168.178.23:81/apidocs/