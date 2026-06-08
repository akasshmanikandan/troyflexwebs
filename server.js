require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Resend } = require("resend");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

const resend = new Resend(process.env.RESEND_API_KEY);

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, company, interest, details } = req.body;

    // 1. Send notification to support@troyflex.dev
    const { data: teamData, error: teamError } = await resend.emails.send({
      from: "Troyflex <support@troyflex.dev>",
      to: ["support@troyflex.dev"],
      replyTo: email,
      subject: `New Quote Request from ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #4361ee; border-bottom: 2px solid #00f5d4; padding-bottom: 10px;">New Quote Request</h2>
          <p>You have received a new inquiry from the website:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; width: 150px;">Name:</td><td>${name}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td>${email}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Company:</td><td>${company || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Interest:</td><td>${interest}</td></tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
            <h4 style="margin-top: 0;">Message/Details:</h4>
            <p style="white-space: pre-wrap;">${details}</p>
          </div>
        </div>
      `,
    });

    if (teamError) {
      console.error("❌ Resend Team Error:", teamError);
    }

    // 2. Send auto-reply to the customer
    const { data: customerData, error: customerError } = await resend.emails.send({
      from: "Troyflex Support <support@troyflex.dev>",
      to: [email],
      replyTo: "support@troyflex.dev",
      subject: `Proposal Request Received - Troyflex`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <p>Dear <strong>${name}</strong>,</p>
          <p>Thank you for reaching out to <strong>Troyflex</strong>.</p>
          <p>We have received your proposal request for <strong>${interest}</strong> and our team is reviewing the details you provided.</p>
          <p>You can expect a detailed response or a personalized video audit from us within the next <strong>2 business hours</strong>.</p>
          <br/>
          <p>Best Regards,</p>
          <p><strong>Team Troyflex</strong><br>Premium Website Design, Development & Optimization</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            This is an automated response. Please do not reply directly to this email if you have urgent queries; instead, contact us directly at support@troyflex.dev.
          </p>
        </div>
      `,
    });

    if (customerError) {
      console.error("❌ Resend Auto-reply Error:", customerError);
    }

    return res.status(200).json({ success: true, message: "Request processed via Resend." });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ success: false, message: "Failed to process request", error: error.message });
  }
});

// Fallback to index.html for all other routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start the server only if running locally, otherwise export for Serverless (Vercel)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
