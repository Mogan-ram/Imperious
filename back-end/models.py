from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime

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
    @staticmethod
    def create(data, author_id):
        news_event = {
            "title": data["title"],
            "description": data["description"],
            "type": data["type"],  # 'news' or 'event'
            "author_id": author_id,
            "date": data.get("date", datetime.utcnow()),
            "event_date": data.get("event_date"),  # Only for events
            "location": data.get("location"),  # Only for events
            "tags": data.get("tags", []),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True,
        }
        result = news_events_collection.insert_one(news_event)
        return str(result.inserted_id)

    @staticmethod
    def get_all(page=1, limit=10, type=None):
        skip = (page - 1) * limit
        query = {"is_active": True}
        if type:
            query["type"] = type

        total = news_events_collection.count_documents(query)
        items = (
            news_events_collection.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )

        # Convert ObjectId to string for JSON serialization
        items_list = []
        for item in items:
            item["_id"] = str(item["_id"])
            items_list.append(item)

        return {
            "items": items_list,
            "total": total,
            "page": page,
            "pages": (total + limit - 1) // limit,
        }

    @staticmethod
    def get_by_id(id):
        result = news_events_collection.find_one(
            {"_id": ObjectId(id), "is_active": True}
        )
        if result:
            result["_id"] = str(result["_id"])
        return result

    @staticmethod
    def update(id, data):
        data["updated_at"] = datetime.utcnow()
        news_events_collection.update_one({"_id": ObjectId(id)}, {"$set": data})
        return True

    @staticmethod
    def delete(id):
        news_events_collection.update_one(
            {"_id": ObjectId(id)}, {"$set": {"is_active": False}}
        )
        return True
