from datetime import datetime
from bson import ObjectId
from app.models.base import bug_reports_collection


def create(data):
    """
    Create a new bug report.

    Args:
        data: Dictionary containing bug report data

    Returns:
        str: ID of the created bug report
    """
    try:
        # Prepare bug report data
        bug_report_data = {
            "name": data["name"],
            "email": data["email"],
            "description": data["description"],
            "status": "new",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        # Insert bug report
        result = bug_reports_collection.insert_one(bug_report_data)
        return str(result.inserted_id)
    except Exception as e:
        print(f"Error creating bug report: {e}")
        return None
