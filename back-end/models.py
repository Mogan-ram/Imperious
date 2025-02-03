from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime

# Configure the MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["imperious"]
users_collection = db["users"]
feeds_collection = db["feeds"]  # New feeds collection


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
            "password": self.password,
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
        users_collection.update_one({"email": email}, {"$set": data})


class Feed:
    def __init__(self, content, author):
        self.content = content
        self.author = author  # Email or username of the user
        self.timestamp = datetime.utcnow()

    def save(self):
        feed_data = {
            "content": self.content,
            "author": self.author,
            "timestamp": self.timestamp,
        }
        feeds_collection.insert_one(feed_data)

    @staticmethod
    def get_all():
        feeds = feeds_collection.find().sort("timestamp", -1)  # Latest first
        return [
            {
                "_id": str(feed["_id"]),
                "content": feed["content"],
                "author": feed["author"],
                "timestamp": feed["timestamp"].isoformat(),
            }
            for feed in feeds
        ]
