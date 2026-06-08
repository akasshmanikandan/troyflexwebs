module.exports = async function handler(req, res) {
  // CORS Headers for Vercel Serverless Function
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { name, email, company, interest, details } = req.body;
    const brevoApiKey = process.env.BREVO_API_KEY;

    // 1. Send notification to support@troyflex.dev
    const teamResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Troyflex', email: 'support@troyflex.dev' },
        to: [{ email: 'support@troyflex.dev' }],
        replyTo: { email: email },
        subject: `New Quote Request from ${name}`,
        htmlContent: `
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
        `
      })
    });

    if (!teamResponse.ok) {
      console.error("❌ Brevo Team Error:", await teamResponse.text());
    }

    // 2. Send auto-reply to the customer
    const customerResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Troyflex Support', email: 'support@troyflex.dev' },
        to: [{ email: email }],
        replyTo: { email: 'support@troyflex.dev' },
        subject: `Proposal Request Received - Troyflex`,
        htmlContent: `
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
        `
      })
    });

    if (!customerResponse.ok) {
      console.error("❌ Brevo Auto-reply Error:", await customerResponse.text());
    }

    return res.status(200).json({ success: true, message: "Request processed via Brevo." });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ success: false, message: "Failed to process request", error: error.message });
  }
};
