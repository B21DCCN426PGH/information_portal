const nodemailer = require('nodemailer');

// Tạo transporter cho email
const createTransporter = () => {
  // Sử dụng Gmail hoặc SMTP server khác
  // Cần cấu hình trong .env:
  // EMAIL_HOST=smtp.gmail.com
  // EMAIL_PORT=587
  // EMAIL_USER=your-email@gmail.com
  // EMAIL_PASS=your-app-password
  // EMAIL_FROM=noreply@fit-portal.com

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App password cho Gmail
    },
  });

  return transporter;
};

// Gửi email reset password
const sendPasswordResetEmail = async (email, resetToken, studentName) => {
  try {
    const transporter = createTransporter();
    
    // URL reset password (frontend URL)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"Khoa CNTT" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Khôi phục mật khẩu - Cổng thông tin Khoa CNTT',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Khôi phục mật khẩu</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${studentName || 'Sinh viên'}</strong>,</p>
              <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.</p>
              <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu mới:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
              </div>
              <p>Hoặc copy và paste link sau vào trình duyệt:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              <p><strong>Lưu ý:</strong> Link này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động, vui lòng không trả lời.</p>
              <p>&copy; ${new Date().getFullYear()} Khoa Công nghệ Thông tin</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Khôi phục mật khẩu - Cổng thông tin Khoa CNTT
        
        Xin chào ${studentName || 'Sinh viên'},
        
        Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.
        Vui lòng truy cập link sau để đặt lại mật khẩu mới:
        
        ${resetUrl}
        
        Lưu ý: Link này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.
        
        Email này được gửi tự động, vui lòng không trả lời.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
  }
};

module.exports = {
  sendPasswordResetEmail,
};

