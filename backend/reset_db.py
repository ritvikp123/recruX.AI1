from sqlalchemy import text
from utils.database import engine, Base, init_db

def reset_db():
    print("Resetting database tables...")
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS user_job_matches CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS profiles CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS jobs CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        print("Dropped existing tables.")
    
    init_db()
    print("Database re-initialized with correct vector dimensions (1536).")

if __name__ == "__main__":
    reset_db()
