import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.sender_email = os.getenv('SENDER_EMAIL', '')
        self.sender_password = os.getenv('SENDER_PASSWORD', '')
        self.sender_name = os.getenv('SENDER_NAME', 'ProctorHub Admin')
    
    def generate_otp(self, length: int = 6) -> str:
        """Generate a random OTP code."""
        return ''.join(random.choices(string.digits, k=length))
    
    def send_otp_email(self, recipient_email: str, otp_code: str, username: str) -> bool:
        """Send OTP verification email."""
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = f"{self.sender_name} <{self.sender_email}>"
            msg['To'] = recipient_email
            msg['Subject'] = "ProctorHub Admin Registration - OTP Verification"
            
            # Email body
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .otp-code {{ background: #667eea; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 ProctorHub Admin Registration</h1>
                        <p>Welcome to ProctorHub Admin Panel</p>
                    </div>
                    <div class="content">
                        <h2>Hello {username}!</h2>
                        <p>Thank you for registering as an admin for ProctorHub. To complete your registration, please use the OTP code below:</p>
                        
                        <div class="otp-code">{otp_code}</div>
                        
                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>This OTP code will expire in 10 minutes</li>
                            <li>Do not share this code with anyone</li>
                            <li>If you didn't request this registration, please ignore this email</li>
                        </ul>
                        
                        <p>Once verified, you'll be able to access the admin dashboard and manage proctoring sessions.</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message from ProctorHub Admin System</p>
                        <p>© 2024 ProctorHub. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(html_body, 'html'))
            
            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            text = msg.as_string()
            server.sendmail(self.sender_email, recipient_email, text)
            server.quit()
            
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    
    def send_welcome_email(self, recipient_email: str, username: str) -> bool:
        """Send welcome email after successful verification."""
        try:
            msg = MIMEMultipart()
            msg['From'] = f"{self.sender_name} <{self.sender_email}>"
            msg['To'] = recipient_email
            msg['Subject'] = "Welcome to ProctorHub Admin Panel"
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .success {{ background: #d4edda; color: #155724; padding: 15px; border-radius: 8px; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Welcome to ProctorHub!</h1>
                        <p>Your admin account has been successfully verified</p>
                    </div>
                    <div class="content">
                        <div class="success">
                            <strong>✅ Account Verified Successfully!</strong>
                        </div>
                        
                        <h2>Hello {username}!</h2>
                        <p>Congratulations! Your admin account has been successfully created and verified. You can now access the ProctorHub admin panel with the following features:</p>
                        
                        <ul>
                            <li>Create and manage proctoring sessions</li>
                            <li>Monitor student activities in real-time</li>
                            <li>View detailed analytics and reports</li>
                            <li>Manage student roll numbers and Google Form links</li>
                        </ul>
                        
                        <p>You can now log in to the admin panel using your email address and password.</p>
                        
                        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(html_body, 'html'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            text = msg.as_string()
            server.sendmail(self.sender_email, recipient_email, text)
            server.quit()
            
            return True
        except Exception as e:
            print(f"Error sending welcome email: {e}")
            return False

# Global email service instance
email_service = EmailService()
