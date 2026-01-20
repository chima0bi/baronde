import "dotenv/config";
import { createTransport } from "nodemailer";

const testEmail = async () => {
  try {
    console.log("Testing SMTP connection...");
    console.log("Host:", process.env.EMAIL_HOSTING_SERVICE);
    console.log("User:", process.env.EMAIL_USER_NAME);
    console.log("Pass length:", process.env.EMAIL_PASS?.length);

    const transport = createTransport({
      host: process.env.EMAIL_HOSTING_SERVICE,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER_NAME,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Test the connection
    await transport.verify();
    console.log("✅ SMTP connection successful!");

    // Send a test email
    const mailOptions = {
      from: process.env.EMAIL_USER_NAME,
      to: process.env.EMAIL_USER_NAME,
      subject: "SMTP Test",
      text: "This is a test email to verify SMTP configuration."
    };

    const result = await transport.sendMail(mailOptions);
    console.log("✅ Email sent successfully!");
    console.log("Message ID:", result.messageId);

  } catch (error) {
    console.error("❌ SMTP Error:", error.message);
    if (error.code) console.error("Error code:", error.code);
    if (error.response) console.error("SMTP response:", error.response);
  }
};

testEmail();