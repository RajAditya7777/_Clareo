import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env from frontend/.env
load_dotenv("./frontend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

migration_sql = [
    "ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_name VARCHAR;",
    "ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_path VARCHAR;"
]

with engine.connect() as conn:
    print("Connected to database. Running migrations...")
    for sql in migration_sql:
        try:
            conn.execute(text(sql))
            conn.commit()
            print(f"Executed: {sql}")
        except Exception as e:
            print(f"Error executing {sql}: {e}")
    print("Done.")
