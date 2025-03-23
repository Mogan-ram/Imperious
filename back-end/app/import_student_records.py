import pandas as pd
from pymongo import MongoClient
import sys
import os

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import STUDENT_DATA_FILE


def import_excel_to_mongodb(excel_file=STUDENT_DATA_FILE):
    try:
        # Verify file exists
        if not os.path.exists(excel_file):
            print(f"Error: Student data file not found at {excel_file}")
            sys.exit(1)

        # Read the Excel file
        print(f"Reading data from {excel_file}")
        df = pd.read_excel(excel_file)

        # Clean the DataFrame - remove rows with empty regno
        df = df.dropna(subset=["regno"])

        # Connect to MongoDB
        client = MongoClient("mongodb://localhost:27017/")
        db = client["imperious"]
        student_records_collection = db["student_records"]

        # Drop existing collection to avoid duplicates
        student_records_collection.drop()

        # Process each record
        processed_records = []
        for _, record in df.iterrows():
            # Clean and format the data
            regno = str(record.get("regno", "")).strip()
            if regno:  # Only process records with valid regno
                processed_record = {
                    "name": str(record.get("name", "")).strip(),
                    "regno": regno.upper(),  # Standardize registration numbers
                    "dept": str(record.get("dept", "")).strip(),
                    "batch": int(record.get("batch", 0)),
                    "is_alumni": bool(record.get("is_alumni", False)),
                }
                processed_records.append(processed_record)

        if not processed_records:
            print("No valid records found in Excel file")
            return

        # Create an index on regno for faster lookups
        student_records_collection.create_index("regno", unique=True)

        # Insert the records
        result = student_records_collection.insert_many(processed_records)
        print(f"Successfully imported {len(result.inserted_ids)} records")

        # Verify the sample student exists
        sample_student = {
            "name": "Mogan Ram",
            "regno": "6176AC21UCS182",
            "dept": "CSE",
            "batch": 2021,
            "is_alumni": False,
        }

        # Check if sample student already exists
        existing_student = student_records_collection.find_one(
            {"regno": sample_student["regno"]}
        )
        if not existing_student:
            student_records_collection.insert_one(sample_student)
            print("Added sample student record")

    except Exception as e:
        print(f"Error importing data: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    # If file path is provided as argument, use that instead of default
    if len(sys.argv) > 1:
        excel_file = sys.argv[1]
        import_excel_to_mongodb(excel_file)
    else:
        # Use default file path
        import_excel_to_mongodb()
