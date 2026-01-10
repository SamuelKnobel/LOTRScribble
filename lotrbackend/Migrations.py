from pymongo import MongoClient
from bson.json_util import dumps
import Utils  # Assuming this is your file from previous context
import os
import json

def perform_safe_migration():
    # 1. Connect
    client = Utils.connect_to_mongodb()
    
    SOURCE_DB_NAME = 'LOTR_BaseData'
    TARGET_COLLECTION = 'MachineData'
    
    source_db = client[SOURCE_DB_NAME]

    # ---------------------------------------------------------
    # PART 2: RENAME FIELD (Size -> size)
    # ---------------------------------------------------------
    print(f"--- STARTING MIGRATION ON {TARGET_COLLECTION} ---")
    
    collection = source_db[TARGET_COLLECTION]
    
    # Check how many need updating first (for logging)
    count_before = collection.count_documents({"Size": {"$exists": True}})
    print(f"Documents with old 'Size' field found: {count_before}")
    
    if count_before > 0:
        # The $rename operator updates the field name
        result = collection.update_many(
            {"Size": {"$exists": True}},  # Filter: Only touch docs where Size exists
            {"$rename": {"Size": "size"}} # Action: Rename Size to size
        )
        
        print(f"✅ Migration successful.")
        print(f"Matched: {result.matched_count}")
        print(f"Modified: {result.modified_count}")
        
        # Verification check
        sample = collection.find_one({"size": {"$exists": True}})
        print(f"\nSample of updated document (name: {sample.get('name')}):")
        print(f"New 'size' field value: {sample.get('size')}")
    else:
        print("No documents found with 'Size'. Maybe they are already named 'size'?")

if __name__ == "__main__":
    perform_safe_migration()