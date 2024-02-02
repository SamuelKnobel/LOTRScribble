from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient, collection
from bson import ObjectId
from flasgger import Swagger
from bson.json_util import dumps

import Utils

# Connect to MongoDB
client = Utils.connect_to_mongodb()
db = client['LOTR_BaseData']
collection = db['UnitData']

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS
Swagger(app)

# Route to get all units
# @app.route('/units', methods=['GET'])
# def get_units():
#     """
#     Get a list of all units.
#
#     ---
#     responses:
#       200:
#         description: List of units.
#       404:
#         description: Units not found.
#     """
#     units = list(collection.find())
#     for unit in units:
#         unit['_id'] = str(unit['_id'])  # Convert ObjectId to string
#     return jsonify(units)


@app.route('/units', methods=['GET'])
def get_units():
    """
    Get a list of all units.

    ---
    responses:
      200:
        description: List of units.
      404:
        description: Units not found.
    """
    units = list(collection.find())

    # Serialize ObjectId to string using bson.json_util.dumps
    units_json = dumps(units, indent=2)

    return units_json


# Route to get a specific unit by ID
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
        description: Information about the unit.
      404:
        description: Unit not found.
    """
    unit = collection.find_one({'_id': ObjectId(id)})
    if unit:
        unit['_id'] = str(unit['_id'])  # Convert ObjectId to string
        return dumps(unit, indent=2)
    else:
        return dumps({'error': 'Unit not found'}), 404

# Route to update a specific unit by ID
@app.route('/units/<id>', methods=['PUT'])
def update_unit(id):
    """
    Update information about a specific unit by its ID.

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
    """
    data = request.get_json()
    # Ensure that the data is structured as {'$set': {field_name: new_value}}
    update_data = {'$set': {data['field_name']: data['new_value']}}

    collection.update_one({'_id': ObjectId(id)}, update_data)
    return dumps({'message': 'Unit updated successfully'})

# @app.after_request
# def after_request(response):
#     response.headers.add('Access-Control-Allow-Origin', '*')
#     response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
#     response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
#     return response



if __name__ == '__main__':
    app.run(debug=True)

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

