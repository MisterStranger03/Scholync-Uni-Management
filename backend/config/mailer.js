const https = require('https');
const http  = require('http');

// In production, delegates to a Vercel serverless function to avoid
// SMTP port blocks on Render. Falls back to direct nodemailer for local dev.
async function sendOtpEmail(to, otp, purpose = 'verification') {
  const vercelUrl = process.env.VERCEL_APP_URL;

  if (!vercelUrl) {
    // Local dev: send directly via Gmail SMTP
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    const isReset = purpose === 'reset';
    await transporter.sendMail({
      from: `"Scholync" <${process.env.EMAIL_USER}>`,
      to:   process.env.EMAIL_REDIRECT_TO || to,
      subject: isReset ? 'Scholync — Password Reset Code' : 'Scholync — Verify Your Account',
      html: `<div style="font-family:sans-serif;padding:32px;background:#0f172a;border-radius:16px;color:#f1f5f9;">
               <h2>${isReset ? 'Reset Your Password' : 'Verify Your Account'}</h2>
               <div style="letter-spacing:10px;font-size:36px;font-weight:700;color:#3b82f6;">${otp}</div>
               <p style="color:#64748b;font-size:12px;">Expires in 10 minutes.</p>
             </div>`,
    });
    return;
  }

  // Production: POST to Vercel serverless function
  const url = new URL(`${vercelUrl}/api/send-otp`);
  const payload = JSON.stringify({ to, otp, purpose });

  await new Promise((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: url.hostname,
      path:     url.pathname,
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-internal-key': process.env.INTERNAL_API_KEY,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => res.statusCode === 200 ? resolve() : reject(new Error(`${res.statusCode}: ${data}`)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = { sendOtpEmail };
