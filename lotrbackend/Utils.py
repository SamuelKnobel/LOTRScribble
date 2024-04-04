import json
import logging
from datetime import datetime

from pymongo.collection import Collection
from pymongo.database import Database
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from pymongo.server_api import ServerApi
from bson import ObjectId, json_util

# logging.basicConfig(level=logging.DEBUG)
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')


def connect_to_mongodb():
    # Load environment variables from .env file
    load_dotenv()
    mongo_username = os.getenv('MONGO_USERNAME')
    mongo_password = os.getenv('MONGO_PASSWORD')
    mongo_cluster = os.getenv('MONGO_CLUSTER_NAME')

    # uri = f"mongodb+srv://User0:Admin1@cluster0.ela823u.mongodb.net/?retryWrites=true&w=majority"
    uri = f"mongodb+srv://{mongo_username}:{mongo_password}@{mongo_cluster}.mongodb.net/?retryWrites=true&w=majority"
    # Create a new client and connect to the server
    client = MongoClient(uri, server_api=ServerApi('1'))

    # Send a ping to confirm a successful connection
    try:
        client.admin.command('ping')
        logging.info("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        logging.warning(e)
    return client


def collection_exists(db: Database, collection: Collection) -> bool:
    """
    Check if a collection exists in the specified database.

    Parameters:
    - db (Database): The MongoDB database.
    - collection (Collection): The MongoDB collection.

    Returns:
    - bool: True if the collection exists, False otherwise.
    """
    return collection.name in db.list_collection_names()


def database_exists(client: MongoClient, database: str) -> bool:
    """
    Check if a database exists in the MongoDB client.

    Parameters:
    - client (MongoClient): The MongoDB client.
    - database (str): The name of the database.

    Returns:
    - bool: True if the database exists, False otherwise.
    """
    return database in client.list_database_names()


def recreate_collection(database: Database, collection: Collection, collection_name: str, recreate: bool) -> Collection:
    """
    Recreate a MongoDB collection. If the collection exists, drop it and create a new one.

    Parameters:
    - database (Database): The MongoDB database.
    - collection (Collection): The MongoDB collection.
    - collection_name (str): The name of the collection.

    Returns:
    - Collection: The recreated MongoDB collection.
    """
    if not collection_exists(database, collection):
        logging.info(f"Database not existing, create new Database: {collection_name}")

        return database.create_collection(collection_name)
    else:
        if recreate:
            logging.info(f"Drop and Recreate Database: {collection_name}")
            collection.drop()
            return database.create_collection(collection_name)
        else:
            logging.info(f"Database existing, return Database: {collection_name}. "
                         f"To reset database, set recreate to true ")
            return collection


def write_to_db_from_json(path: str, collection: Collection) -> Collection:
    """
    Write data from a JSON file to a MongoDB collection.

    Parameters:
    - path (str): The path to the JSON file.
    - collection (Collection): The MongoDB collection to write data to.

    Returns:
    - Collection: The updated MongoDB collection.
    """
    with open(path, 'r', encoding='utf-8') as jsonfile:
        _data = json.load(jsonfile)

    # Insert the nation data into the Nation collection
    for _name, data in _data.items():
        data['Version'] = "1.0"
        # Use update_one with upsert=True to insert or update the document in the collection
        collection.update_one({"name": _name}, {"$set": data}, upsert=True)
    logging.info(f"Write data ({path}) to: {collection.name}")
    return collection


def link_collections(source_collection: Collection, target_collection: Collection, link_field_source: str,
                     link_field_target: str):
    """
    Update documents in the target collection to set links based on a specific field in the source collection.

    Parameters:
    - source_collection (Collection): The MongoDB collection containing data for linking.
    - target_collection (Collection): The MongoDB collection to update with links.
    - link_field_source (str): The field name in the source collection representing the link.
    - link_field_target (str): The field name in the target collection to be updated with links.

    Returns:
    - None
    """
    source_ids = {}
    source_map = {}
    source_names = []

    # Retrieve the source document names and IDs
    for source_document in source_collection.find({}):
        source_name = source_document['name']
        source_id = source_document['_id']
        source_ids[source_name] = source_id
        source_names.append(source_name)
        source_document_index = source_document[link_field_source]
        source_map[source_document_index] = source_name
    logging.debug(source_map)

    # Update documents in the target collection to set links
    for target_document_name in target_collection.distinct("name"):
        current_target_document = target_collection.find_one({"name": target_document_name})

        source_document_name = source_map.get(current_target_document[link_field_target])
        # Find the corresponding IDs for the source document
        source_document_id = source_ids.get(source_document_name)

        # Update the document in the target collection with the corresponding IDs
        target_collection.update_one(
            {"name": target_document_name},
            {"$set": {
                f"{link_field_target}_id": str(source_document_id),
                f"{link_field_target}_string": source_document_name
            }}
        )

    logging.info(f"Link data from {source_collection.name} to {target_collection.name}")
        # link_collections(source_collection, target_collection, "eBuilding", "linked_building")


def convert_objectid_to_string(data):
    """
    Recursively converts ObjectId fields to string in a dictionary or a list.
    ---
    Parameters:
    - data: Dictionary or list containing MongoDB ObjectId fields.

    Returns:
    - Dictionary or list with ObjectId fields converted to strings.
    """
    logging.debug(data)
    if isinstance(data, list):
        return [convert_objectid_to_string(item) for item in data]
    elif isinstance(data, dict):
        return {key: convert_objectid_to_string(value) for key, value in data.items()}
    elif isinstance(data, ObjectId):
        return str(data)
    else:
        return data


# # Example usage
# units = list(collection.find())
# units_json = json_util.dumps(convert_objectid_to_string(units), indent=2)


def log_changes(db, collection_name, item_id, item_identifier, changes):
    """
    Log changes between existing data and updated data.

    Parameters:
    - collection_name: The name of the collection where the update occurred.
    - item_id: The ID of the item that was updated.
    - changes: A dictionary containing the changes.
    """
    change_logs_collection = recreate_collection(db, db['ChangeLogs'], 'ChangeLogs', False)

    change_log_entry = {
        'timestamp': datetime.now(),
        'collection_name': collection_name,
        'item_id': item_id,
        'item_identifier': item_identifier,
        'changes': changes
    }
    change_logs_collection.insert_one(change_log_entry)
