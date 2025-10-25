import sqlite3
import json
from datetime import datetime
from typing import Dict, List, Optional
import uuid

class DatabaseManager:
    def __init__(self, db_path: str = "proctoring.db"):
        self.db_path = db_path
        self.init_database()
        self.migrate_database()
    
    def init_database(self):
        """Initialize the database with required tables."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                google_form_link TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active'
            )
        ''')
        
        # Students table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                roll_no TEXT NOT NULL,
                status TEXT DEFAULT 'Not Started',
                started_at TIMESTAMP,
                ended_at TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions (session_id),
                UNIQUE(session_id, roll_no)
            )
        ''')
        
        # Events table (for frame analysis data)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                roll_no TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                num_faces INTEGER,
                head_pose_yaw REAL,
                head_pose_pitch REAL,
                gaze_x REAL,
                gaze_y REAL,
                device_detected BOOLEAN,
                phone_detected BOOLEAN,
                attention_score REAL,
                state TEXT,
                raw_data TEXT, -- JSON string of complete analysis
                FOREIGN KEY (session_id) REFERENCES sessions (session_id)
            )
        ''')
        
        # Results table (final session results)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                roll_no TEXT NOT NULL,
                average_attention_score REAL,
                distracted_count INTEGER,
                multiple_faces_count INTEGER,
                no_face_count INTEGER,
                device_detected_count INTEGER,
                total_events INTEGER,
                session_duration REAL, -- in seconds
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions (session_id),
                UNIQUE(session_id, roll_no)
            )
        ''')
        
        # Admin credentials table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS admin_credentials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                is_verified BOOLEAN DEFAULT 0,
                otp_code TEXT,
                otp_expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def migrate_database(self):
        """Migrate existing database to new schema."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if email column exists
            cursor.execute("PRAGMA table_info(admin_credentials)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if 'email' not in columns:
                print("Migrating admin_credentials table to add email column...")
                # Add new columns
                cursor.execute('ALTER TABLE admin_credentials ADD COLUMN email TEXT')
                cursor.execute('ALTER TABLE admin_credentials ADD COLUMN is_verified BOOLEAN DEFAULT 0')
                cursor.execute('ALTER TABLE admin_credentials ADD COLUMN otp_code TEXT')
                cursor.execute('ALTER TABLE admin_credentials ADD COLUMN otp_expires_at TIMESTAMP')
                
                # Update existing admin record with default email
                cursor.execute('UPDATE admin_credentials SET email = ? WHERE email IS NULL', ('admin@proctorhub.com',))
                
                conn.commit()
                print("Database migration completed successfully!")
            
            conn.close()
            return True
        except Exception as e:
            print(f"Error during database migration: {e}")
            return False
    
    def create_session(self, session_id: str, google_form_link: str, students: List[str]) -> bool:
        """Create a new session in the database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Insert session
            cursor.execute('''
                INSERT INTO sessions (session_id, google_form_link)
                VALUES (?, ?)
            ''', (session_id, google_form_link))
            
            # Insert students
            for roll_no in students:
                cursor.execute('''
                    INSERT INTO students (session_id, roll_no)
                    VALUES (?, ?)
                ''', (session_id, roll_no))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error creating session: {e}")
            return False
    
    def save_event(self, session_id: str, roll_no: str, analysis_data: Dict) -> bool:
        """Save a frame analysis event to the database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO events (
                    session_id, roll_no, num_faces, head_pose_yaw, head_pose_pitch,
                    gaze_x, gaze_y, device_detected, phone_detected, attention_score,
                    state, raw_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                session_id,
                roll_no,
                analysis_data.get('num_faces', 0),
                analysis_data.get('head_pose', {}).get('yaw', 0),
                analysis_data.get('head_pose', {}).get('pitch', 0),
                analysis_data.get('gaze', {}).get('x', 0),
                analysis_data.get('gaze', {}).get('y', 0),
                analysis_data.get('device', {}).get('device_detected', False),
                analysis_data.get('device', {}).get('phone_detected', False),
                analysis_data.get('attention_score', 0),
                analysis_data.get('state', 'unknown'),
                json.dumps(analysis_data)
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error saving event: {e}")
            return False
    
    def update_student_status(self, session_id: str, roll_no: str, status: str) -> bool:
        """Update student status in the database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            if status == "Started":
                cursor.execute('''
                    UPDATE students 
                    SET status = ?, started_at = CURRENT_TIMESTAMP
                    WHERE session_id = ? AND roll_no = ?
                ''', (status, session_id, roll_no))
            elif status == "Finished":
                cursor.execute('''
                    UPDATE students 
                    SET status = ?, ended_at = CURRENT_TIMESTAMP
                    WHERE session_id = ? AND roll_no = ?
                ''', (status, session_id, roll_no))
            else:
                cursor.execute('''
                    UPDATE students 
                    SET status = ?
                    WHERE session_id = ? AND roll_no = ?
                ''', (status, session_id, roll_no))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error updating student status: {e}")
            return False
    
    def save_session_results(self, session_id: str, roll_no: str, results: Dict) -> bool:
        """Save final session results to the database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get session duration
            cursor.execute('''
                SELECT started_at, ended_at FROM students 
                WHERE session_id = ? AND roll_no = ?
            ''', (session_id, roll_no))
            
            duration_row = cursor.fetchone()
            duration = 0
            if duration_row and duration_row[0] and duration_row[1]:
                start_time = datetime.fromisoformat(duration_row[0])
                end_time = datetime.fromisoformat(duration_row[1])
                duration = (end_time - start_time).total_seconds()
            
            # Get total events count
            cursor.execute('''
                SELECT COUNT(*) FROM events 
                WHERE session_id = ? AND roll_no = ?
            ''', (session_id, roll_no))
            
            total_events = cursor.fetchone()[0]
            
            # Insert results
            cursor.execute('''
                INSERT OR REPLACE INTO results (
                    session_id, roll_no, average_attention_score, distracted_count,
                    multiple_faces_count, no_face_count, device_detected_count,
                    total_events, session_duration
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                session_id,
                roll_no,
                results.get('average_attention_score', 0),
                results.get('distracted_count', 0),
                results.get('multiple_faces_count', 0),
                results.get('no_face_count', 0),
                results.get('device_detected_count', 0),
                total_events,
                duration
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error saving session results: {e}")
            return False
    
    def get_session_data(self, session_id: str) -> Optional[Dict]:
        """Get complete session data from database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get session info
            cursor.execute('''
                SELECT google_form_link, created_at, status 
                FROM sessions WHERE session_id = ?
            ''', (session_id,))
            
            session_row = cursor.fetchone()
            if not session_row:
                conn.close()
                return None
            
            session_data = {
                'google_form_link': session_row[0],
                'created_at': session_row[1],
                'status': session_row[2],
                'students': {}
            }
            
            # Get students data
            cursor.execute('''
                SELECT roll_no, status, started_at, ended_at
                FROM students WHERE session_id = ?
            ''', (session_id,))
            
            students_rows = cursor.fetchall()
            for row in students_rows:
                roll_no = row[0]
                session_data['students'][roll_no] = {
                    'status': row[1],
                    'started_at': row[2],
                    'ended_at': row[3]
                }
                
                # Get results if available
                cursor.execute('''
                    SELECT average_attention_score, distracted_count, multiple_faces_count,
                           no_face_count, device_detected_count, total_events, session_duration
                    FROM results WHERE session_id = ? AND roll_no = ?
                ''', (session_id, roll_no))
                
                results_row = cursor.fetchone()
                if results_row:
                    session_data['students'][roll_no]['results'] = {
                        'average_attention_score': results_row[0],
                        'distracted_count': results_row[1],
                        'multiple_faces_count': results_row[2],
                        'no_face_count': results_row[3],
                        'device_detected_count': results_row[4],
                        'total_events': results_row[5],
                        'session_duration': results_row[6]
                    }
            
            conn.close()
            return session_data
        except Exception as e:
            print(f"Error getting session data: {e}")
            return None
    
    def get_all_sessions(self) -> Dict:
        """Get all sessions data from database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get all sessions
            cursor.execute('''
                SELECT session_id, google_form_link, created_at, status
                FROM sessions ORDER BY created_at DESC
            ''')
            
            sessions_rows = cursor.fetchall()
            sessions = {}
            
            for row in sessions_rows:
                session_id = row[0]
                sessions[session_id] = {
                    'google_form_link': row[1],
                    'created_at': row[2],
                    'status': row[3],
                    'students': {}
                }
                
                # Get students for this session
                cursor.execute('''
                    SELECT roll_no, status, started_at, ended_at
                    FROM students WHERE session_id = ?
                ''', (session_id,))
                
                students_rows = cursor.fetchall()
                for student_row in students_rows:
                    roll_no = student_row[0]
                    sessions[session_id]['students'][roll_no] = {
                        'status': student_row[1],
                        'started_at': student_row[2],
                        'ended_at': student_row[3]
                    }
                    
                    # Get results if available
                    cursor.execute('''
                        SELECT average_attention_score, distracted_count, multiple_faces_count,
                               no_face_count, device_detected_count, total_events, session_duration
                        FROM results WHERE session_id = ? AND roll_no = ?
                    ''', (session_id, roll_no))
                    
                    results_row = cursor.fetchone()
                    if results_row:
                        sessions[session_id]['students'][roll_no]['results'] = {
                            'average_attention_score': results_row[0],
                            'distracted_count': results_row[1],
                            'multiple_faces_count': results_row[2],
                            'no_face_count': results_row[3],
                            'device_detected_count': results_row[4],
                            'total_events': results_row[5],
                            'session_duration': results_row[6]
                        }
            
            conn.close()
            return sessions
        except Exception as e:
            print(f"Error getting all sessions: {e}")
            return {}
    
    def get_session_events(self, session_id: str, roll_no: str) -> List[Dict]:
        """Get all events for a specific student session."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT timestamp, raw_data FROM events 
                WHERE session_id = ? AND roll_no = ?
                ORDER BY timestamp ASC
            ''', (session_id, roll_no))
            
            events_rows = cursor.fetchall()
            events = []
            
            for row in events_rows:
                event_data = json.loads(row[1])
                event_data['timestamp'] = row[0]
                events.append(event_data)
            
            conn.close()
            return events
        except Exception as e:
            print(f"Error getting session events: {e}")
            return []
    
    def create_admin(self, username: str, email: str, password: str) -> bool:
        """Create a new admin user."""
        try:
            import hashlib
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO admin_credentials (username, email, password_hash)
                VALUES (?, ?, ?)
            ''', (username, email, password_hash))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error creating admin: {e}")
            return False
    
    def create_admin_with_otp(self, username: str, email: str, password: str, otp_code: str) -> bool:
        """Create a new admin user with OTP verification."""
        try:
            import hashlib
            from datetime import datetime, timedelta
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            # OTP expires in 10 minutes
            otp_expires = datetime.now() + timedelta(minutes=10)
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO admin_credentials (username, email, password_hash, otp_code, otp_expires_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (username, email, password_hash, otp_code, otp_expires.isoformat()))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error creating admin with OTP: {e}")
            return False
    
    def verify_admin(self, username: str, password: str) -> bool:
        """Verify admin credentials."""
        try:
            import hashlib
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT password_hash FROM admin_credentials 
                WHERE username = ? AND is_active = 1 AND is_verified = 1
            ''', (username,))
            
            result = cursor.fetchone()
            conn.close()
            
            return result and result[0] == password_hash
        except Exception as e:
            print(f"Error verifying admin: {e}")
            return False
    
    def verify_admin_by_email(self, email: str, password: str) -> bool:
        """Verify admin credentials using email."""
        try:
            import hashlib
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT password_hash FROM admin_credentials 
                WHERE email = ? AND is_active = 1 AND is_verified = 1
            ''', (email,))
            
            result = cursor.fetchone()
            conn.close()
            
            return result and result[0] == password_hash
        except Exception as e:
            print(f"Error verifying admin by email: {e}")
            return False
    
    def verify_otp(self, email: str, otp_code: str) -> bool:
        """Verify OTP code for admin registration."""
        try:
            from datetime import datetime
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT otp_code, otp_expires_at FROM admin_credentials 
                WHERE email = ? AND is_verified = 0
            ''', (email,))
            
            result = cursor.fetchone()
            if not result:
                conn.close()
                return False
            
            stored_otp, expires_at = result
            
            # Check if OTP is expired
            if expires_at:
                expires_time = datetime.fromisoformat(expires_at)
                if datetime.now() > expires_time:
                    conn.close()
                    return False
            
            # Verify OTP
            if stored_otp == otp_code:
                # Mark as verified
                cursor.execute('''
                    UPDATE admin_credentials 
                    SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL
                    WHERE email = ?
                ''', (email,))
                conn.commit()
                conn.close()
                return True
            
            conn.close()
            return False
        except Exception as e:
            print(f"Error verifying OTP: {e}")
            return False
    
    def get_admin_by_email(self, email: str) -> dict:
        """Get admin details by email."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT username, email, is_verified, created_at FROM admin_credentials 
                WHERE email = ?
            ''', (email,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                return {
                    'username': result[0],
                    'email': result[1],
                    'is_verified': result[2],
                    'created_at': result[3]
                }
            return None
        except Exception as e:
            print(f"Error getting admin by email: {e}")
            return None

# Global database instance
db = DatabaseManager()
