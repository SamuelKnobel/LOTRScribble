from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import json
import Utils

client = Utils.connect_to_mongodb()


# Access the database
db = client.LOTR_BaseData
# Check if the LOTR_BaseData database exists and create it if not
if not Utils.database_exists(client, 'LOTR_BaseData'):
    client.create_database('LOTR_BaseData')

# Access the Nation collection
pathToNationData = 'C:/Users/samue/PycharmProjects/BattleScribeClone2/Data_Binary/BasicNationData.basic.json'
pathToBuildingData = 'C:/Users/samue/PycharmProjects/BattleScribeClone2/Data_Binary/BasicBuildingData.basic.json'
pathToFieldData = 'C:/Users/samue/PycharmProjects/BattleScribeClone2/Data_Binary/BasicFieldData.basic.json'
pathToUnitData = 'C:/Users/samue/PycharmProjects/BattleScribeClone2/Data_Binary/BasicUnitData.basic.json'
pathToMachineData = 'C:/Users/samue/PycharmProjects/BattleScribeClone2/Data_Binary/BasicMaschineData.basic.json'
pathToShipData = 'C:/Users/samue/PycharmProjects/BattleScribeClone2/Data_Binary/BasicShipData.basic.json'
pathToRules = 'C:/Users/samue/PycharmProjects/BattleScribeClone2/Data_Binary/Rules.basic.json'


nation_collection = Utils.recreate_collection(db, db.NationData, 'NationData', True)
building_collection = Utils.recreate_collection(db, db.BuildingData, 'BuildingData', True)
field_collection = Utils.recreate_collection(db, db.FieldData, 'FieldData', True)
unit_collection = Utils.recreate_collection(db, db.UnitData, 'UnitData', True)
machine_collection = Utils.recreate_collection(db, db.MachineData, 'MachineData', True)
ship_collection = Utils.recreate_collection(db, db.ShipData, 'ShipData', True)
rules_collection = Utils.recreate_collection(db, db.RuleData, 'RuleData', True)

nation_collection = Utils.write_to_db_from_json(pathToNationData, nation_collection)
building_collection = Utils.write_to_db_from_json(pathToBuildingData, building_collection)
field_collection = Utils.write_to_db_from_json(pathToFieldData, field_collection)
unit_collection = Utils.write_to_db_from_json(pathToUnitData, unit_collection)
machine_collection = Utils.write_to_db_from_json(pathToMachineData, machine_collection)
ship_collection = Utils.write_to_db_from_json(pathToShipData, ship_collection)
rules_collection = Utils.write_to_db_from_json(pathToRules, rules_collection)

# linking buildings
Utils.link_collections(building_collection, building_collection, 'next_eBuilding', 'next_eBuilding')
Utils.link_collections(building_collection, building_collection, 'prevoius_eBuilding', 'prevoius_eBuilding')

# linking units to nations
Utils.link_collections(nation_collection, unit_collection, 'nation', 'nation')
Utils.link_collections(nation_collection, ship_collection, 'eNation', 'nation')
Utils.link_collections(nation_collection, machine_collection, 'eNation', 'nation')



# Close the MongoDB connection
client.close()
