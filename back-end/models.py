from pymongo import MongoClient
from bson.objectid import ObjectId

# Configure the MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["imperious"]
users_collection = db["users"]


class User:
    def __init__(self, email, password, role="student"):
        self.email = email
        self.password = password
        self.role = role

    def save(self):
        user_data = {
            "email": self.email,
            "password": self.password,
            "role": self.role,
        }
        users_collection.insert_one(user_data)

    @staticmethod
    def find_by_email(email):
        return users_collection.find_one({"email": email})

    @staticmethod
    def update_by_email(email, data):
        users_collection.update_one({"email": email}, {"$set": data})
