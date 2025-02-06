from pymongo import MongoClient, DESCENDING
from bson.objectid import ObjectId
from datetime import datetime
import logging

# Configure the MongoDB connection
try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client["imperious"]
    users_collection = db["users"]
    feeds_collection = db["feeds"]
    news_events_collection = db["news_events"]  # Add news_events collection
    client.admin.command("ping")
    print("Connected successfully to MongoDB")
except Exception as e:
    print(f"Could not connect to MongoDB: {e}")


class User:
    def __init__(self, name, dept, regno, batch, email, password, role="student"):
        self.email = email
        self.password = password
        self.role = role
        self.dept = dept
        self.name = name
        self.regno = regno
        self.batch = batch

    def save(self):
        user_data = {
            "email": self.email,
            "password": self.password,  # This should be already hashed
            "role": self.role,
            "dept": self.dept,
            "name": self.name,
            "regno": self.regno,
            "batch": self.batch,
        }
        users_collection.insert_one(user_data)

    @staticmethod
    def find_by_email(email):
        return users_collection.find_one({"email": email})

    @staticmethod
    def update_by_email(email, data):
        # Don't allow updating sensitive fields
        safe_data = {k: v for k, v in data.items() if k not in ["email", "password"]}
        if safe_data:
            users_collection.update_one({"email": email}, {"$set": safe_data})
        return True

    @staticmethod
    def create_feed(email, content):
        feed = {"content": content, "author": email, "timestamp": datetime.utcnow()}
        result = feeds_collection.insert_one(feed)
        return str(result.inserted_id)


class Feed:
    def __init__(self, content, author):
        self.content = content
        self.author = author  # Email of the user
        self.timestamp = datetime.utcnow()

    def save(self):
        feed_data = {
            "content": self.content,
            "author": self.author,
            "timestamp": self.timestamp,
        }
        result = feeds_collection.insert_one(feed_data)
        feed_data["_id"] = str(result.inserted_id)
        return feed_data

    @staticmethod
    def get_all():
        feeds = feeds_collection.find().sort("timestamp", -1)  # Latest first
        feed_list = []
        for feed in feeds:
            # Get author details from users collection
            author = users_collection.find_one({"email": feed["author"]})
            feed_data = {
                "_id": str(feed["_id"]),
                "content": feed["content"],
                "author": {
                    "email": author["email"],
                    "name": author["name"],
                },
                "timestamp": feed["timestamp"].isoformat(),
            }
            feed_list.append(feed_data)
        return feed_list


class NewsEvent:
    def __init__(
        self,
        title,
        description,
        type,
        author_id,
        image_path=None,
        event_date=None,
        location=None,
    ):
        self.title = title
        self.description = description
        self.type = type
        self.author_id = author_id
        self.image_path = image_path
        self.event_date = event_date
        self.location = location
        self.created_at = datetime.utcnow()

    @staticmethod
    def create(data, author_id, image_path=None):
        news_event = {
            "title": data["title"],
            "description": data["description"],
            "type": data["type"],
            "author_id": author_id,
            "image_path": image_path,
            "created_at": datetime.utcnow(),
        }

        if data["type"] == "event":
            news_event["event_date"] = (
                datetime.strptime(data["event_date"], "%Y-%m-%d")
                if "event_date" in data
                else None
            )
            news_event["location"] = data.get("location")

        result = news_events_collection.insert_one(news_event)
        return str(result.inserted_id)

    @staticmethod
    def get_all(page=1, limit=10, type=None, sort_by="created_at", order=-1):
        skip = (page - 1) * limit
        query = {}
        if type:
            query["type"] = type.lower()  # Ensure case-insensitive comparison

        # Add debug logging
        logging.info(f"MongoDB query: {query}")

        total = news_events_collection.count_documents(query)
        items = list(
            news_events_collection.find(query)
            .sort(sort_by, DESCENDING if order == -1 else 1)
            .skip(skip)
            .limit(limit)
        )

        # Add debug logging
        logging.info(f"Found {len(items)} items in database")

        # Convert ObjectId to string for JSON serialization
        for item in items:
            item["_id"] = str(item["_id"])
            if "author_id" in item:
                item["author_id"] = str(item["author_id"])
            # Ensure dates are properly formatted
            if "event_date" in item and item["event_date"]:
                item["event_date"] = item["event_date"].isoformat()
            if "created_at" in item:
                item["created_at"] = item["created_at"].isoformat()

        return {"items": items, "total": total, "pages": (total + limit - 1) // limit}

    @staticmethod
    def get_by_id(id):
        try:
            item = news_events_collection.find_one({"_id": ObjectId(id)})
            if item:
                item["_id"] = str(item["_id"])
                if "author_id" in item:
                    item["author_id"] = str(item["author_id"])
            return item
        except:
            return None

    @staticmethod
    def update(id, data):
        try:
            result = news_events_collection.update_one(
                {"_id": ObjectId(id)}, {"$set": data}
            )
            return result.modified_count > 0
        except:
            return False

    @staticmethod
    def delete(id):
        try:
            result = news_events_collection.delete_one({"_id": ObjectId(id)})
            return result.deleted_count > 0
        except:
            return False
