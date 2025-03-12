const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "ajaynagar78080@gmail.com",
    pass: process.env.EMAIL_PASS || "iwuw jgcr kops kcya",
  },
});

// Welcome Email
async function sendWelcomeEmail(to, username) {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Inspira</title>
      <link href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #18181b;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%);">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: rgba(39, 39, 42, 0.95); border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.1);">
              <tr>
                <td align="center" style="padding: 30px 20px 20px;">
                  <i style="font-size: 48px; color: #dc2626;" class="ri-lightbulb-flash-line"></i>
                  <h1 style="color: #f4f4f5; font-size: 28px; margin: 15px 0 5px;">Welcome to Inspira, ${username}!</h1>
                  <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Where ideas spark and creativity flows</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 20px;">
                  <p style="color: #d4d4d8; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                    We’re thrilled to have you join our community! Inspira is your space to ignite creativity, share ideas, and connect with others who inspire you.
                  </p>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <a href="https://inspira-nmhu.onrender.com/profile" style="display: inline-block; background: #dc2626; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">Explore Your Profile</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                  <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 10px;">Need help? <a href="mailto:support@yourapp.com" style="color: #dc2626; text-decoration: none;">Contact us</a></p>
                  <p style="color: #71717a; font-size: 10px; margin: 0;">
                    © 2025 Inspira. All rights reserved. | <a href="https://inspira-nmhu.onrender.com/privacy" style="color: #a1a1aa; text-decoration: none;">Privacy Policy</a> | <a href="https://inspira-nmhu.onrender.com/terms" style="color: #a1a1aa; text-decoration: none;">Terms of Service</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  await transporter.sendMail({
    from: "your-email@gmail.com",
    to,
    subject: "Welcome to Inspira!",
    html: htmlTemplate,
  });
  console.log(`Welcome email sent to ${to}`);
}

// Password Reset Request Email
async function sendPasswordResetRequest(to, resetUrl) {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Inspira Password</title>
      <link href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #18181b;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%);">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: rgba(39, 39, 42, 0.95); border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.1);">
              <tr>
                <td align="center" style="padding: 30px 20px 20px;">
                  <i style="font-size: 48px; color: #dc2626;" class="ri-lock-line"></i>
                  <h1 style="color: #f4f4f5; font-size: 28px; margin: 15px 0 5px;">Reset Your Password</h1>
                  <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Secure your Inspira account</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 20px;">
                  <p style="color: #d4d4d8; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                    Forgot your password? No worries! Click the button below to reset it. This link expires in 1 hour for your security.
                  </p>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <a href="${resetUrl}" style="display: inline-block; background: #dc2626; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">Reset Password</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                  <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 10px;">Didn’t request this? <a href="mailto:support@yourapp.com" style="color: #dc2626; text-decoration: none;">Contact us</a></p>
                  <p style="color: #71717a; font-size: 10px; margin: 0;">
                    © 2025 Inspira. All rights reserved. | <a href="https://inspira-nmhu.onrender.com/privacy" style="color: #a1a1aa; text-decoration: none;">Privacy Policy</a> | <a href="https://inspira-nmhu.onrender.com/terms" style="color: #a1a1aa; text-decoration: none;">Terms of Service</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  await transporter.sendMail({
    from: "your-email@gmail.com",
    to,
    subject: "Reset Your Inspira Password",
    html: htmlTemplate,
  });
  console.log(`Password reset request sent to ${to}`);
}

// Password Reset Confirmation Email
async function sendPasswordResetConfirmation(to, username) {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Successful</title>
      <link href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #18181b;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%);">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: rgba(39, 39, 42, 0.95); border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.1);">
              <tr>
                <td align="center" style="padding: 30px 20px 20px;">
                  <i style="font-size: 48px; color: #dc2626;" class="ri-check-line"></i>
                  <h1 style="color: #f4f4f5; font-size: 28px; margin: 15px 0 5px;">Password Reset Successful, ${username}!</h1>
                  <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Your account is secure</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 20px;">
                  <p style="color: #d4d4d8; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                    Your password has been updated successfully. You can now log in with your new credentials and continue sparking creativity on Inspira.
                  </p>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <a href="https://inspira-nmhu.onrender.com/login" style="display: inline-block; background: #dc2626; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">Log In Now</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                  <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 10px;">Questions? <a href="mailto:support@yourapp.com" style="color: #dc2626; text-decoration: none;">Contact us</a></p>
                  <p style="color: #71717a; font-size: 10px; margin: 0;">
                    © 2025 Inspira. All rights reserved. | <a href="https://inspira-nmhu.onrender.com/privacy" style="color: #a1a1aa; text-decoration: none;">Privacy Policy</a> | <a href="https://inspira-nmhu.onrender.com/terms" style="color: #a1a1aa; text-decoration: none;">Terms of Service</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  await transporter.sendMail({
    from: "your-email@gmail.com",
    to,
    subject: "Password Reset Successful",
    html: htmlTemplate,
  });
  console.log(`Password reset confirmation sent to ${to}`);
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetRequest,
  sendPasswordResetConfirmation,
};
