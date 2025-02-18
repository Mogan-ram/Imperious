import os

# Get the base directory of the backend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Path to the students Excel file
STUDENT_DATA_FILE = os.path.join(BASE_DIR, "students.xlsx")
