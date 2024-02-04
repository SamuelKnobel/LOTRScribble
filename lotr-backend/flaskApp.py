import logging

from flask import Flask, request, jsonify
from flask_cors import CORS
from bson import ObjectId
from flasgger import Swagger
from bson.json_util import dumps
import json
import Utils

# Connect to MongoDB
client = Utils.connect_to_mongodb()
db = client['LOTR_BaseData']

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS
Swagger(app)

logging.basicConfig(level=logging.DEBUG)




@app.route('/units', methods=['GET'])
def get_units():
    """
    Get a list of all units in the specified collection.

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
    return get_data('UnitData')

@app.route('/ships', methods=['GET'])
def get_ships():
    """
    Get a list of all ships in the specified collection.

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
    return get_data('ShipData')

@app.route('/machines', methods=['GET'])
def get_machines():
    """
    Get a list of all machines in the specified collection.

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
    return get_data('MachineData')

@app.route('/nations', methods=['GET'])
def get_nations():
    """
    Get a list of all nations in the specified collection.

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
    return get_data('NationData')


@app.route('/fields', methods=['GET'])
def get_fields():
    """
    Get a list of all fields in the specified collection.

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
    return get_data('FieldData')


@app.route('/buildings', methods=['GET'])
def get_buildings():
    """
    Get a list of all buildings in the specified collection.

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
    return get_data('BuildingData')


@app.route('/rules', methods=['GET'])
def get_rules():
    """
    Get a list of all Rules in the specified collection.

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
    return get_data('RuleData')


def get_data(collection_name):
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
    collection = db[collection_name]
    items = list(collection.find())
    items_clean = Utils.convert_objectid_to_string(items)

    return jsonify(items_clean)


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
    collection = db[collection_name]
    item = collection.find_one({'_id': ObjectId(item_id)})

    if item:
        item_clean = Utils.convert_objectid_to_string(item)
        return jsonify(item_clean)
    else:
        return jsonify({'error': f'{collection_name.capitalize()} not found'}), 404


@app.route('/units/<id>', methods=['GET'])
def get_unit(id):
    """
     Get information about a specific unit by its ID from the specified collection.
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
    return get_item_by_id('UnitData', id)


@app.route('/nations/<id>', methods=['GET'])
def get_nation(id):
    """
     Get information about a specific nation by its ID from the specified collection.
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
    return get_item_by_id('NationData', id)


@app.route('/buildings/<id>', methods=['GET'])
def get_building(id):
    """
     Get information about a specific building by its ID from the specified collection.
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
    return get_item_by_id('BuildingData', id)


@app.route('/fields/<id>', methods=['GET'])
def get_field(id):
    """
     Get information about a specific field by its ID from the specified collection.
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
    return get_item_by_id('FieldData', id)


# # Route to update a specific unit by ID
# @app.route('/units/<id>', methods=['PUT'])
# def update_unit(id):
#     """
#     Update information about a specific unit by its ID.
#
#     ---
#     parameters:
#       - name: id
#         in: path
#         type: string
#         required: true
#         description: ID of the unit.
#
#     requestBody:
#       content:
#         application/json:
#           schema:
#             type: object
#             properties:
#               field_name:
#                 type: string
#                 description: The field to be updated.
#               new_value:
#                 type: string
#                 description: The new value for the field.
#
#     responses:
#       200:
#         description: Unit updated successfully.
#     """
#     collection = db['UnitData']
#     data = request.get_json()
#     # Ensure that the data is structured as {'$set': {field_name: new_value}}
#     # update_data = {'$set': {data['field_name']: data['new_value']}}
#     update_data = json.loads(data['body'])
#     update_data.pop("_id", None)
#
#     filter_ = {'_id': ObjectId(id)}
#     new_values = {"$set": update_data}
#     collection.update_one(filter_, new_values)
#
#     return dumps({'message': 'Unit updated successfully'})

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
        description: Nation updated successfully.
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
    return update_item_by_id("BuildingData", id)

def update_item_by_id(collection_name, item_id):
    """
    Update information about a specific item by its ID.

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
        description: Item updated successfully.
      404:
        description: Update Failed
    """
    collection = db[collection_name]
    data = request.get_json()
    # Ensure that the data is structured as {'$set': {field_name: new_value}}
    update_data = json.loads(data['body'])
    update_data.pop("_id", None)

    # Get the existing item data
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
            Utils.log_changes(db, collection_name, item_id, identifier, changes)

        collection.update_one(filter_, new_values)
        return dumps({'message': 'Unit updated successfully'})

    else:
        return jsonify({'error': f'Item: {item_id} or {collection_name.capitalize()} not found'}), 404

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response



if __name__ == '__main__':
    # run app in debug mode on port 81
    app.run(debug=True, port=81, host='0.0.0.0')


#### EXample how to Use it from the PowerShell
# # Set the URL and payload
# $url = "http://localhost:5000/units/65badde7c1bcc52822641697"
# $body = @{
#     field_name = "Equipment"
#     new_value = "Sword"
# }
#
# # Create a hash table for headers
# $headers = @{
#     "Content-Type" = "application/json"
# }
#
# # Convert the payload to JSON
# $jsonBody = $body | ConvertTo-Json
#
# # Make the request
# $response = Invoke-WebRequest -Uri $url -Method Put -Headers $headers -Body $jsonBody -ContentType "application/json"
#
# # Display the response
# $response.Content

### Another example that works:
# Invoke-RestMethod -Uri "http://127.0.0.1:5000/units/65badde7c1bcc52822641697" -Method PUT -Headers @{"Content-Type"="application/json"} -Body '{"field_name": "Equipment", "new_value": "Sword,Shield"}'

