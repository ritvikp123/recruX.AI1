import os
import sys
from sqlalchemy import text
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from utils.database import engine, Base

def drop_all_tables():
    print("Dropping all tables...")
    # Drop tables in reverse order of dependencies
    with engine.begin() as conn:
        # Disable foreign key checks if needed (Postgres style)
        conn.execute(text("DROP TABLE IF EXISTS user_job_matches CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS profiles CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS jobs CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS users CASCADE;"))
    print("Tables dropped successfully.")

if __name__ == "__main__":
    drop_all_tables()
