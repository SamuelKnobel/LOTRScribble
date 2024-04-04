from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import json
import Utils
import os
client = Utils.connect_to_mongodb()


# Access the database
db = client.LOTR_BaseData
# Check if the LOTR_BaseData database exists and create it if not
if not Utils.database_exists(client, 'LOTR_BaseData'):
    client.create_database('LOTR_BaseData')

cwd = os.getcwd()
# Access the Nation collection
pathToNationData = cwd + '/Data_Binary/BasicNationData.basic.json'
pathToBuildingData = cwd + '/Data_Binary/BasicBuildingData.basic.json'
pathToFieldData = cwd + '/Data_Binary/BasicFieldData.basic.json'
pathToUnitData = cwd + '/Data_Binary/BasicUnitData.basic.json'
pathToMachineData = cwd + '/Data_Binary/BasicMaschineData.basic.json'
pathToShipData = cwd + '/Data_Binary/BasicShipData.basic.json'
pathToRules = cwd + '/Data_Binary/Rules.basic.json'

recreate = False

nation_collection = Utils.recreate_collection(db, db.NationData, 'NationData', recreate)
building_collection = Utils.recreate_collection(db, db.BuildingData, 'BuildingData', recreate)
field_collection = Utils.recreate_collection(db, db.FieldData, 'FieldData', recreate)
unit_collection = Utils.recreate_collection(db, db.UnitData, 'UnitData', recreate)
machine_collection = Utils.recreate_collection(db, db.MachineData, 'MachineData', recreate)
ship_collection = Utils.recreate_collection(db, db.ShipData, 'ShipData', recreate)
rules_collection = Utils.recreate_collection(db, db.RuleData, 'RuleData', recreate)

nation_collection = Utils.write_to_db_from_json(pathToNationData, nation_collection)
building_collection = Utils.write_to_db_from_json(pathToBuildingData, building_collection)
field_collection = Utils.write_to_db_from_json(pathToFieldData, field_collection)
unit_collection = Utils.write_to_db_from_json(pathToUnitData, unit_collection)
machine_collection = Utils.write_to_db_from_json(pathToMachineData, machine_collection)
ship_collection = Utils.write_to_db_from_json(pathToShipData, ship_collection)
rules_collection = Utils.write_to_db_from_json(pathToRules, rules_collection)

# linking buildings
Utils.link_collections(building_collection, building_collection, 'eBuilding', 'next_eBuilding')
Utils.link_collections(building_collection, building_collection, 'eBuilding', 'prevoius_eBuilding')

# # # linking units to nations
Utils.link_collections(nation_collection, unit_collection, 'eNation', 'nation')
Utils.link_collections(nation_collection, ship_collection, 'eNation', 'eNation')
Utils.link_collections(nation_collection, machine_collection, 'eNation', 'eNation')



# Close the MongoDB connection
client.close()
