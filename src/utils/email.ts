'use server'
import nodemailer from 'nodemailer';

export async function sendRegistrationEmail(toEmail: string, userName: string) {
  try {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.warn("SMTP credentials not configured. Skipping registration email for", toEmail);
      console.log(`[Mock Email] To: ${toEmail}\nSubject: Welcome to RootX Waste Management!\nBody: Hello ${userName},\n\nThank you for registering on RootX Waste Management! You are now ready to help keep Gandhinagar clean and earn rewards.`);
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"RootX Waste Management" <${smtpUser}>`,
      to: toEmail,
      subject: 'Welcome to RootX Waste Management! 🌿',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #10b981; text-align: center;">Welcome to RootX, ${userName}!</h2>
          <p>Thank you for registering on <strong>RootX Waste Management</strong>. You have taken the first step towards making Gandhinagar clean, green, and sustainable!</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0;">Your Account Details:</h4>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${userName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${toEmail}</p>
            <p style="margin: 5px 0;"><strong>Role:</strong> Citizen (User)</p>
          </div>
          <p>Start reporting waste in your area and earn rewards/points that you can redeem later.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to RootX App</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e0e0e0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">RootX Waste Management App &copy; 2026. All rights reserved.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Registration email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending registration email:", error);
    return false;
  }
}
