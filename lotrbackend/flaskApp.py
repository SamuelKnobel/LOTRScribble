import logging
from flask import Flask, request, jsonify, redirect, url_for
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from flasgger import Swagger
import json
import sys
import Utils
import atexit

from logging.config import dictConfig

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

@app.route('/units', methods=['GET'])
def get_units():
    """
    Get a list of all units.
    ---
    responses:
      200:
        description: List of items.
      404:
        description: Items not found.
    """
    data = get_baseData('UnitData')
    return data

@app.route('/ships', methods=['GET'])
def get_ships():
    """
    Get a list of all ships.
    ---
    responses:
      200:
        description: List of items.
      404:
        description: Items not found.
    """
    return get_baseData('ShipData')

@app.route('/machines', methods=['GET'])
def get_machines():
    """
    Get a list of all machines.
    ---
    responses:
      200:
        description: List of items.
      404:
        description: Items not found.
    """
    return get_baseData('MachineData')

@app.route('/nations', methods=['GET'])
def get_nations():
    """
    Get a list of all nations.
    ---
    responses:
      200:
        description: List of items.
      404:
        description: Items not found.
    """
    return get_baseData('NationData')

@app.route('/fields', methods=['GET'])
def get_fields():
    """
    Get a list of all fields.
    ---
    responses:
      200:
        description: List of items.
      404:
        description: Items not found.
    """
    return get_baseData('FieldData')


@app.route('/buildings', methods=['GET'])
def get_buildings():
    """
    Get a list of all buildings.
    ---
    responses:
      200:
        description: List of items.
      404:
        description: Items not found.
    """
    return get_baseData('BuildingData')


@app.route('/rules', methods=['GET'])
def get_rules():
    """
     Get a list of all rules.
     ---
     responses:
       200:
         description: List of items.
       404:
         description: Items not found.
     """
    return get_baseData('RuleData')

@app.route('/changelog', methods=['GET'])
def get_changelog():
    """
     Get a list of all changes that were made.
     ---
     responses:
       200:
         description: List of changes.
       404:
         description: no changes found.
     """
    return get_baseData('ChangeLogs')

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
    logging.info(f'Items in Collection: {items}')
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
    collection = db_GameData["StartData"]
    items = list(collection.find())
    for item in items:
        if item["name"] == data_name:
            logging.info(f'Found Data: {item}')
            item["_id"] = Utils.convert_objectid_to_string(item["_id"])
            return item
    return jsonify({'error': f'Data: {data_name} not found'}), 404

@app.route('/StartData/<data_name>', methods=['GET'])
def get_startdata(data_name):
    """
    Get specified StartData Data.

    - FertSeason: Fertitily Modifier Per Season

    - Trade: Money per Trade Value

    - Food_UnitType: BaseFood per Unit Type

    - Varia: e.g. StartGold

    - FoodSize: returns a Tuple -> Food = (BasicFood + Unit-Typ Faktor + Unit-Size Faktor1)* Unit-Size Faktor2

    ---
    parameters:
      - name: data_name
        in: path
        type: string
        description: The name of the data to retrieve.
    responses:
      200: 
        description: JSON data.
      404: 
        description: Data not found.
    """

    return get_gameData(data_name)

@app.route('/StartData/<data_name>', methods=['PUT'])
def update_startdata(data_name):
    """
    Update a specific key in a StartData document.
    Expects JSON body: { "key": "some_key", "value": new_value }
    ---
    parameters:
      - name: data_name
        in: path
        type: string
        description: The name of the StartData document to update.
    responses:
      200:
        description: Update successful.
      400:
        description: Bad request (e.g., key does not exist or type mismatch).
      404:
        description: Data container not found.
    """
    logging.info(f'Attempting to update StartData: {data_name}')
    
    # 1. Get the collection
    collection = db_GameData["StartData"]
    
    # 2. Find the document
    item = collection.find_one({"name": data_name})
    
    if not item:
        return jsonify({'error': f'Data container "{data_name}" not found'}), 404

    # 3. Parse Request Body
    data = request.get_json()
    if not data or 'key' not in data or 'value' not in data:
        return jsonify({'error': 'Request body must contain "key" and "value"'}), 400

    target_key = str(data['key']) # Ensure key is string (matches your Trade.json format "0", "1")
    new_value = data['value']
    
    # 4. Validate: Does Key Exist? (No new keys allowed)
    if target_key not in item:
        return jsonify({'error': f'Key "{target_key}" does not exist in "{data_name}". Creating new keys is forbidden.'}), 400

    # 5. Validate: Data Type Consistency
    current_value = item[target_key]
    
    # Special handling for Numbers (Allow Int to update Float, but cast it)
    if isinstance(current_value, float) and isinstance(new_value, (int, float)):
        new_value = float(new_value)
    # Check if types match (excluding the number exception above)
    elif type(current_value) != type(new_value):
        return jsonify({
            'error': f'Type Mismatch. Key "{target_key}" expects {type(current_value).__name__}, but got {type(new_value).__name__}'
        }), 400

    # 6. Perform the Update
    try:
        # Use $set to update only the specific key
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
    Get information about a specific item by its ID from the specified collection.
    ---
    parameters:
      - name: collection_name
        in: path
        type: string
        description: The name of the collection.
      - name: item_id
        in: path
        type: string
        required: true
        description: ID of the item.
    responses:
      200:
        description: Information about the item.
      404:
        description: Item not found.
    """
    print(collection_name)

    collection = db_BaseData[collection_name]
    item = collection.find_one({'_id': ObjectId(item_id)})

    if item:
        item_clean = Utils.convert_objectid_to_string(item)
        return jsonify(item_clean)
    else:
        return jsonify({'error': f'{collection_name.capitalize()} not found'}), 404


@app.route('/units/<id>', methods=['GET'])
def get_unit(id):
    """
     Get information about a specific unit by its ID.
     ---
     parameters:
       - name: id
         in: path
         type: string
         required: true
         description: ID of the unit.

     responses:
       200:
         description: Information about the item.
       404:
         description: Item not found.
     """
    return get_item_by_id('UnitData', id)


@app.route('/nations/<id>', methods=['GET'])
def get_nation(id):
    """
     Get information about a specific nation by its ID.
     ---
     parameters:
       - name: id
         in: path
         type: string
         required: true
         description: ID of the nation.

     responses:
       200:
         description: Information about the item.
       404:
         description: Item not found.
     """
    return get_item_by_id('NationData', id)


@app.route('/buildings/<id>', methods=['GET'])
def get_building(id):
    """
     Get information about a specific building by its ID.
     ---
     parameters:
       - name: id
         in: path
         type: string
         required: true
         description: ID of the building.

     responses:
       200:
         description: Information about the item.
       404:
         description: Item not found.
     """
    return get_item_by_id('BuildingData', id)


@app.route('/fields/<id>', methods=['GET'])
def get_field(id):
    """
     Get information about a specific field by its ID.
     ---
     parameters:
       - name: id
         in: path
         type: string
         required: true
         description: ID of the field.

     responses:
       200:
         description: Information about the item.
       404:
         description: Item not found.
     """
    return get_item_by_id('FieldData', id)

@app.route('/units/<id>', methods=['PUT'])
def update_unit(id):
    """
    Update information about a specific Unit by its ID.
    ---
    parameters:
      - name: id
        in: path
        type: string
        required: true
        description: ID of the unit.

    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              field_name:
                type: string
                description: The field to be updated.
              new_value:
                type: string
                description: The new value for the field.

    responses:
      200:
        description: Unit updated successfully.
      404:
        description: Update Failed
    """
    return update_item_by_id("UnitData", id)

@app.route('/nations/<id>', methods=['PUT'])
def update_nation(id):
    """
    Update information about a specific Nation by its ID.
    ---
    parameters:
      - name: id
        in: path
        type: string
        required: true
        description: ID of the unit.

    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              field_name:
                type: string
                description: The field to be updated.
              new_value:
                type: string
                description: The new value for the field.

    responses:
      200:
        description: Nation updated successfully.
      404:
        description: Update Failed
    """
    return update_item_by_id("NationData", id)


@app.route('/fields/<id>', methods=['PUT'])
def update_fields(id):
    """
    Update information about a specific Field by its ID.
    ---
    parameters:
      - name: id
        in: path
        type: string
        required: true
        description: ID of the unit.

    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              field_name:
                type: string
                description: The field to be updated.
              new_value:
                type: string
                description: The new value for the field.

    responses:
      200:
        description: Field updated successfully.
      404:
        description: Update Failed
    """
    return update_item_by_id("FieldData", id)


@app.route('/buildings/<id>', methods=['PUT'])
def update_buildings(id):
    """
     Update information about a specific Building by its ID.
     ---
     parameters:
       - name: id
         in: path
         type: string
         required: true
         description: ID of the Building.

     requestBody:
       content:
         application/json:
           schema:
             type: object
             properties:
               field_name:
                 type: string
                 description: The field to be updated.
               new_value:
                 type: string
                 description: The new value for the field.

     responses:
       200:
         description: Building updated successfully.
       404:
         description: Update Failed
     """
    return update_item_by_id("BuildingData", id)


def update_item_by_id(collection_name, item_id):
    """
    Update information about a specific item by its ID. Used as PUT request.

    parameters:
      - collection_name: id
        in: path
        type: string
        required: true
        description: Collection name to look for.
      - item_id: id
        in: path
        type: string
        required: true
        description: ID of the element.


    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              field_name:
                type: string
                description: The field to be updated.
              new_value:
                type: string
                description: The new value for the field.

    responses:
      200:
        description: Item updated successfully.
      404:
        description: Update Failed
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



if __name__ == '__main__':
    logging.info("Test")
    # run app in debug mode on port 81
    app.run(debug=True, port=81, host='0.0.0.0', ssl_context='adhoc')


# load page using https://192.168.178.23:81/apidocs/