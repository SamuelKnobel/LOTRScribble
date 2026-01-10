from pymongo import MongoClient
from bson.json_util import dumps
import Utils
import os
import json
from datetime import datetime

# 1. Connect
client = Utils.connect_to_mongodb()

SOURCE_DB_NAME = 'LOTR_BaseData'

# Create timestamp suffix
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
BACKUP_DB_NAME = f"LOTR_BaseData_Backup_{timestamp}"

source_db = client[SOURCE_DB_NAME]
backup_db = client[BACKUP_DB_NAME]

print(f"--- STARTING BACKUP OF {SOURCE_DB_NAME} ---")
print(f"Backup DB will be: {BACKUP_DB_NAME}")

# ---------------------------------------------------------
# PART 1: BACKUP (Cloud Copy & Local Download)
# ---------------------------------------------------------

# Get all collections
collections = source_db.list_collection_names()

# Create timestamped backup directory locally
backup_dir = os.path.join(os.getcwd(), f"backup_json_{timestamp}")
os.makedirs(backup_dir, exist_ok=True)

for col_name in collections:
    print(f"Processing collection: {col_name}...")

    # Fetch all data from source
    data = list(source_db[col_name].find())

    if len(data) > 0:
        # 1. Copy to new DB (Cloud Backup)
        backup_db[col_name].insert_many(data)

        # 2. Save to JSON File (Local Backup)
        file_path = os.path.join(backup_dir, f"{col_name}.json")
        with open(file_path, "w", encoding='utf-8') as f:
            f.write(dumps(data, indent=2))

print(f"✅ Backup complete!")
print(f"1. DB created: {BACKUP_DB_NAME}")
print(f"2. Files saved in: {backup_dir}")
print("-" * 30)