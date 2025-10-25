#!/usr/bin/env python3
"""
Authentication module for admin login system
"""
import sqlite3
import hashlib
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import json

class AuthManager:
    def __init__(self, db_path: str = "proctoring.db"):
        self.db_path = db_path
        self.init_auth_tables()
    
    def init_auth_tables(self):
        """Initialize authentication tables"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create admins table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS admins (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    name TEXT NOT NULL,
                    is_verified BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                )
            ''')
            
            # Create OTP table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS otp_codes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    otp_code TEXT NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    is_used BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            conn.close()
            print("Authentication tables initialized successfully")
        except Exception as e:
            print(f"Error initializing auth tables: {e}")
    
    def hash_password(self, password: str) -> str:
        """Hash password using SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def generate_otp(self) -> str:
        """Generate a 6-digit OTP"""
        return str(secrets.randbelow(900000) + 100000)
    
    def send_otp_email(self, email: str, otp: str, name: str) -> bool:
        """Send OTP via email"""
        try:
            # Email configuration
            smtp_server = "smtp.gmail.com"
            smtp_port = 587
            sender_email = "lalithkumargb8055@gmail.com"
            app_password = "euzu zecu pgyz xhkb"  # App password for Gmail
            
            # Create message
            msg = MIMEMultipart()
            msg['From'] = f"Proctoring System <{sender_email}>"
            msg['To'] = email
            msg['Subject'] = "OTP Verification - Proctoring System"
            
            # Email body
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">Proctoring System</h1>
                        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Admin Verification</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #667eea;">
                        <h2 style="color: #333; margin-top: 0;">Hello {name}!</h2>
                        <p>Thank you for signing up for the Proctoring System. To complete your registration, please use the following OTP code:</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #667eea;">
                            <h1 style="color: #667eea; font-size: 36px; margin: 0; letter-spacing: 5px; font-family: 'Courier New', monospace;">{otp}</h1>
                        </div>
                        
                        <p><strong>This OTP will expire in 10 minutes.</strong></p>
                        <p>If you didn't request this verification, please ignore this email.</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
                        <p>© 2024 Proctoring System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            # Send email
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(sender_email, app_password)
            text = msg.as_string()
            server.sendmail(sender_email, email, text)
            server.quit()
            
            print(f"OTP sent successfully to {email}")
            return True
            
        except Exception as e:
            print(f"Error sending OTP email: {e}")
            return False
    
    def create_admin(self, email: str, password: str, name: str) -> dict:
        """Create a new admin account"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if admin already exists
            cursor.execute('SELECT id FROM admins WHERE email = ?', (email,))
            if cursor.fetchone():
                conn.close()
                return {"success": False, "message": "Admin with this email already exists"}
            
            # Hash password
            password_hash = self.hash_password(password)
            
            # Insert admin
            cursor.execute('''
                INSERT INTO admins (email, password_hash, name, is_verified)
                VALUES (?, ?, ?, FALSE)
            ''', (email, password_hash, name))
            
            admin_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            # Generate and send OTP
            otp = self.generate_otp()
            if self.save_otp(email, otp) and self.send_otp_email(email, otp, name):
                return {
                    "success": True, 
                    "message": "Admin created successfully. Please check your email for OTP verification.",
                    "admin_id": admin_id
                }
            else:
                return {
                    "success": False, 
                    "message": "Admin created but failed to send OTP. Please contact support."
                }
                
        except Exception as e:
            print(f"Error creating admin: {e}")
            return {"success": False, "message": f"Error creating admin: {str(e)}"}
    
    def save_otp(self, email: str, otp: str) -> bool:
        """Save OTP to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Delete any existing OTPs for this email
            cursor.execute('DELETE FROM otp_codes WHERE email = ?', (email,))
            
            # Save new OTP (expires in 10 minutes)
            expires_at = datetime.now() + timedelta(minutes=10)
            cursor.execute('''
                INSERT INTO otp_codes (email, otp_code, expires_at)
                VALUES (?, ?, ?)
            ''', (email, otp, expires_at))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"Error saving OTP: {e}")
            return False
    
    def verify_otp(self, email: str, otp: str) -> dict:
        """Verify OTP and activate admin account"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get OTP from database
            cursor.execute('''
                SELECT id, expires_at FROM otp_codes 
                WHERE email = ? AND otp_code = ? AND is_used = FALSE
                ORDER BY created_at DESC LIMIT 1
            ''', (email, otp))
            
            otp_record = cursor.fetchone()
            if not otp_record:
                conn.close()
                return {"success": False, "message": "Invalid or expired OTP"}
            
            # Check if OTP is expired
            expires_at = datetime.fromisoformat(otp_record[1])
            if datetime.now() > expires_at:
                conn.close()
                return {"success": False, "message": "OTP has expired"}
            
            # Mark OTP as used
            cursor.execute('UPDATE otp_codes SET is_used = TRUE WHERE id = ?', (otp_record[0],))
            
            # Activate admin account
            cursor.execute('UPDATE admins SET is_verified = TRUE WHERE email = ?', (email,))
            
            conn.commit()
            conn.close()
            
            return {"success": True, "message": "Account verified successfully"}
            
        except Exception as e:
            print(f"Error verifying OTP: {e}")
            return {"success": False, "message": f"Error verifying OTP: {str(e)}"}
    
    def login_admin(self, email: str, password: str) -> dict:
        """Login admin"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get admin by email
            cursor.execute('''
                SELECT id, email, password_hash, name, is_verified FROM admins 
                WHERE email = ?
            ''', (email,))
            
            admin = cursor.fetchone()
            if not admin:
                conn.close()
                return {"success": False, "message": "Invalid email or password"}
            
            # Check if account is verified
            if not admin[4]:  # is_verified
                conn.close()
                return {"success": False, "message": "Account not verified. Please check your email for OTP."}
            
            # Verify password
            password_hash = self.hash_password(password)
            if admin[2] != password_hash:  # password_hash
                conn.close()
                return {"success": False, "message": "Invalid email or password"}
            
            # Update last login
            cursor.execute('UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?', (admin[0],))
            conn.commit()
            conn.close()
            
            return {
                "success": True, 
                "message": "Login successful",
                "admin": {
                    "id": admin[0],
                    "email": admin[1],
                    "name": admin[3]
                }
            }
            
        except Exception as e:
            print(f"Error logging in admin: {e}")
            return {"success": False, "message": f"Error logging in: {str(e)}"}
    
    def resend_otp(self, email: str) -> dict:
        """Resend OTP for email verification"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if admin exists
            cursor.execute('SELECT name, is_verified FROM admins WHERE email = ?', (email,))
            admin = cursor.fetchone()
            if not admin:
                conn.close()
                return {"success": False, "message": "Admin not found"}
            
            if admin[1]:  # is_verified
                conn.close()
                return {"success": False, "message": "Account already verified"}
            
            conn.close()
            
            # Generate and send new OTP
            otp = self.generate_otp()
            if self.save_otp(email, otp) and self.send_otp_email(email, otp, admin[0]):
                return {"success": True, "message": "OTP sent successfully"}
            else:
                return {"success": False, "message": "Failed to send OTP"}
                
        except Exception as e:
            print(f"Error resending OTP: {e}")
            return {"success": False, "message": f"Error resending OTP: {str(e)}"}

# Global auth manager instance
auth_manager = AuthManager()
