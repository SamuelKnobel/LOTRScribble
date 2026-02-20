from pymongo import MongoClient
import Utils


def restore_missing_rules():
    # 1. Connect to your local MongoDB (Update the URI if your DB is hosted elsewhere)
    client = Utils.connect_to_mongodb()

    # 2. Define your Databases
    # Assuming LOTR_BaseData and the Backup are the Database names
    db_backup = client["LOTR_BaseData_Backup_20260110_213008"]
    db_main = client["LOTR_BaseData"]

    # 3. Define the Collections (Tables)
    collection_backup = db_backup["RuleData"]
    collection_main = db_main["RuleData"]

    print("Fetching rules from both databases...")

    # 4. Get all rule names currently in the Main Database
    # We use a Set for lightning-fast lookups
    existing_main_rule_names = set()
    for rule in collection_main.find({}, {"name": 1}):
        if "name" in rule:
            existing_main_rule_names.add(rule["name"])

    print(f"Found {len(existing_main_rule_names)} rules currently in Main Database.")

    # 5. Compare and find missing rules from the Backup
    rules_to_insert = []
    
    for backup_rule in collection_backup.find():
        rule_name = backup_rule.get("name")
        
        # If the rule from the backup is NOT in the main database
        if rule_name and rule_name not in existing_main_rule_names:
            
            # Remove the old MongoDB _id so it safely generates a fresh one upon insert
            if "_id" in backup_rule:
                del backup_rule["_id"]
                
            rules_to_insert.append(backup_rule)

    # 6. Insert the missing rules
    if rules_to_insert:
        print(f"Found {len(rules_to_insert)} missing rules in the backup. Inserting into Main Database...")
        collection_main.insert_many(rules_to_insert)
        print("✅ Successfully added missing rules!")
    else:
        print("✅ Main Database is already up to date. No missing rules found.")

if __name__ == "__main__":
    restore_missing_rules()