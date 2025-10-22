const VerificationEmail = (username, otp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding: 40px 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(6, 182, 212, 0.3);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(6, 182, 212, 0.2);
        }
        .header {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);
          padding: 40px 30px;
          text-align: center;
          border-bottom: 1px solid rgba(6, 182, 212, 0.2);
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 200px;
          height: 200px;
          background: rgba(6, 182, 212, 0.1);
          border-radius: 50%;
          filter: blur(60px);
        }
        .icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%);
          border-radius: 20px;
          margin-bottom: 20px;
          box-shadow: 0 10px 30px rgba(6, 182, 212, 0.5);
        }
        .icon-wrapper svg {
          width: 40px;
          height: 40px;
          color: white;
        }
        .header h1 {
          color: #ffffff;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
        }
        .header p {
          color: #94a3b8;
          font-size: 16px;
          position: relative;
          z-index: 1;
        }
        .greeting {
          color: #06b6d4;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .content p {
          color: #cbd5e1;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .otp-container {
          background: rgba(6, 182, 212, 0.1);
          border: 2px dashed rgba(6, 182, 212, 0.5);
          border-radius: 16px;
          padding: 30px;
          margin: 30px 0;
          position: relative;
        }
        .otp-label {
          color: #06b6d4;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 15px;
          display: block;
        }
        .otp {
          font-size: 36px;
          font-weight: 700;
          color: #06b6d4;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
          text-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
        }
        .warning {
          background: rgba(239, 68, 68, 0.1);
          border-left: 4px solid #ef4444;
          padding: 15px 20px;
          margin: 30px 0;
          border-radius: 8px;
        }
        .warning p {
          color: #fca5a5;
          font-size: 14px;
          margin: 0;
          text-align: left;
        }
        .footer {
          background: rgba(15, 23, 42, 0.5);
          padding: 30px;
          text-align: center;
          border-top: 1px solid rgba(6, 182, 212, 0.2);
        }
        .footer p {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .footer .copyright {
          color: #94a3b8;
          font-weight: 600;
          margin-bottom: 15px;
        }
        .footer .small-text {
          font-size: 12px;
          color: #475569;
          line-height: 1.5;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.3);
          border-radius: 20px;
          padding: 8px 16px;
          margin-top: 20px;
        }
        .badge-dot {
          width: 8px;
          height: 8px;
          background: #06b6d4;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .badge-text {
          color: #06b6d4;
          font-size: 12px;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1>Email Verification Required</h1>
          <p>Hi <span class="greeting">${username}</span>! Welcome to NASA Space Biology</p>
        </div>
        
        <div class="content">
          <p>Thank you for joining our community! To complete your registration and start exploring cutting-edge space biology research, please verify your email address using the code below:</p>
          
          <div class="otp-container">
            <span class="otp-label">Your Verification Code</span>
            <div class="otp">${otp}</div>
            <div class="badge">
              <div class="badge-dot"></div>
              <span class="badge-text">Valid for 10 minutes</span>
            </div>
          </div>
          
          <p>Enter this code on the verification page to activate your account and gain access to our research database.</p>
          
          <div class="warning">
            <p><strong>⚠️ Security Notice:</strong> If you didn't create an account with NASA Space Biology, please ignore this email. Your email address will not be used without verification.</p>
          </div>
        </div>
        
        <div class="footer">
          <p class="copyright">🚀 NASA Space Biology Knowledge Base</p>
          <p>&copy; 2024 NASA Space Biology. All rights reserved.</p>
          <p class="small-text">You received this email because you signed up for an account.<br/>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default VerificationEmail;