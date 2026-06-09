const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Validate env vars
  const smtpUser = process.env.EMAIL_UNAME;
  const smtpPass = process.env.EMAIL_PASS;

  if (!smtpUser || !smtpPass) {
    console.error('❌ EMAIL_UNAME or EMAIL_PASS is not set!');
    return res.status(500).json({ success: false, message: 'Server configuration error.' });
  }

  try {
    const { name, email, company, interest, details } = req.body;

    if (!name || !email || !details) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    // Create Brevo SMTP transporter (no IP restrictions!)
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // 1. Send notification to support@troyflex.dev
    await transporter.sendMail({
      from: '"Troyflex Website" <support@troyflex.dev>',
      to: 'support@troyflex.dev',
      replyTo: email,
      subject: `New Quote Request from ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 24px; border-radius: 8px;">
          <h2 style="color: #4361ee; border-bottom: 2px solid #00f5d4; padding-bottom: 10px;">New Quote Request</h2>
          <p>You have received a new inquiry from the Troyflex website:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
            <tr><td style="padding: 8px 0; font-weight: bold; width: 150px; color: #555;">Name:</td><td>${name}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td><td>${email}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Company:</td><td>${company || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Interest:</td><td>${interest}</td></tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 6px;">
            <h4 style="margin-top: 0; color: #333;">Project Details:</h4>
            <p style="white-space: pre-wrap; color: #555;">${details}</p>
          </div>
        </div>
      `,
    });

    console.log('✅ Team notification sent to support@troyflex.dev');

    // 2. Send auto-reply to the customer
    await transporter.sendMail({
      from: '"Troyflex Support" <support@troyflex.dev>',
      to: email,
      replyTo: 'support@troyflex.dev',
      subject: `We received your proposal request — Troyflex`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 24px; border-radius: 8px;">
          <p>Dear <strong>${name}</strong>,</p>
          <p>Thank you for reaching out to <strong>Troyflex</strong>.</p>
          <p>We have received your proposal request for <strong>${interest}</strong> and our team is already reviewing your details.</p>
          <p>You can expect a personalized response from us within the next <strong>2 business hours</strong>.</p>
          <br/>
          <p>Best Regards,<br/><strong>Team Troyflex</strong><br/>Premium Website Design, Development &amp; Optimization</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">This is an automated response. For urgent queries, email us directly at support@troyflex.dev.</p>
        </div>
      `,
    });

    console.log('✅ Auto-reply sent to customer:', email);

    return res.status(200).json({ success: true, message: 'Request sent successfully.' });

  } catch (error) {
    console.error('❌ Email Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to send email.', error: error.message });
  }
};
