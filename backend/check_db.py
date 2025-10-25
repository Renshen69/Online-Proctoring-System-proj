import sqlite3

def check_database():
    """Check database structure and data."""
    conn = sqlite3.connect("proctoring.db")
    cursor = conn.cursor()
    
    try:
        # Check sessions
        cursor.execute("SELECT COUNT(*) FROM sessions")
        session_count = cursor.fetchone()[0]
        print(f"Total sessions: {session_count}")
        
        if session_count > 0:
            cursor.execute("SELECT session_id, exam_title, exam_type FROM sessions LIMIT 5")
            print("\nSample sessions:")
            for row in cursor.fetchall():
                print(f"  - {row[0][:8]}... | {row[1]} | {row[2]}")
        
        # Check students
        cursor.execute("SELECT COUNT(*) FROM students")
        student_count = cursor.fetchone()[0]
        print(f"\nTotal students: {student_count}")
        
        # Check results table structure
        cursor.execute("PRAGMA table_info(results)")
        print("\nResults table structure:")
        for column in cursor.fetchall():
            print(f"  - {column[1]} ({column[2]})")
        
        # Check violations table
        cursor.execute("SELECT COUNT(*) FROM violations")
        violation_count = cursor.fetchone()[0]
        print(f"\nTotal violations: {violation_count}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_database()
