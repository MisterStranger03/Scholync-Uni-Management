// Vercel serverless function — handles OTP email delivery.
// The Render backend calls this because Render's free tier blocks SMTP ports.
// Protected by a shared INTERNAL_API_KEY header.
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const authHeader = req.headers['x-internal-key'];
  if (!authHeader || authHeader !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { to, otp, purpose } = req.body;
  if (!to || !otp) return res.status(400).json({ message: 'Missing to or otp' });

  const recipient = process.env.EMAIL_REDIRECT_TO || to;
  const isReset   = purpose === 'reset';

  try {
    await transporter.sendMail({
      from:    `"Scholync" <${process.env.EMAIL_USER}>`,
      to:      recipient,
      subject: isReset ? 'Scholync — Password Reset Code' : 'Scholync — Verify Your Account',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f172a;border-radius:16px;color:#f1f5f9;">
          <h2 style="margin:0 0 8px;color:#fff;">${isReset ? 'Reset Your Password' : 'Verify Your Account'}</h2>
          <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;">
            ${isReset ? 'Use the code below to set a new password.' : 'Use the code below to verify your email address.'}
          </p>
          <div style="background:#1e293b;border-radius:12px;padding:24px;text-align:center;letter-spacing:10px;font-size:36px;font-weight:700;color:#3b82f6;">
            ${otp}
          </div>
          <p style="margin:20px 0 0;color:#64748b;font-size:12px;">
            This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
          </p>
        </div>
      `,
    });
    res.status(200).json({ message: 'OTP sent' });
  } catch (err) {
    console.error('[send-otp]', err.message);
    res.status(500).json({ message: 'Failed to send email' });
  }
};
