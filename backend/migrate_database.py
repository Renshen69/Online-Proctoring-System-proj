import sqlite3
import os

def migrate_database():
    """Migrate the database to add new columns and tables."""
    db_path = "proctoring.db"
    
    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Starting database migration...")
        
        # Check if violations table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='violations'
        """)
        
        if not cursor.fetchone():
            print("Creating violations table...")
            cursor.execute('''
                CREATE TABLE violations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    roll_no TEXT NOT NULL,
                    violation_type TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES sessions (session_id)
                )
            ''')
            print("✓ Violations table created")
        else:
            print("✓ Violations table already exists")
        
        # Check if mouse_out_count column exists in results table
        cursor.execute("PRAGMA table_info(results)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'mouse_out_count' not in columns:
            print("Adding mouse_out_count column to results table...")
            cursor.execute("""
                ALTER TABLE results 
                ADD COLUMN mouse_out_count INTEGER DEFAULT 0
            """)
            print("✓ mouse_out_count column added")
        else:
            print("✓ mouse_out_count column already exists")
        
        if 'tab_switch_count' not in columns:
            print("Adding tab_switch_count column to results table...")
            cursor.execute("""
                ALTER TABLE results 
                ADD COLUMN tab_switch_count INTEGER DEFAULT 0
            """)
            print("✓ tab_switch_count column added")
        else:
            print("✓ tab_switch_count column already exists")
        
        conn.commit()
        print("\n✅ Database migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
