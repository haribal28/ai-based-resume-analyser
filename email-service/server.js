/**
 * email-service/server.js
 * Nodemailer-based microservice for sending candidate emails.
 * Runs on port 5001 (separate from the Flask backend on 5000).
 *
 * Endpoints:
 *   POST /api/send-email   — send selection / rejection email
 *   GET  /api/health       — health check
 */

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.EMAIL_SERVICE_PORT || 5001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Nodemailer transporter ────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_SERVER || "smtp.gmail.com",
    port: parseInt(process.env.MAIL_PORT || "587", 10),
    secure: process.env.MAIL_USE_SSL === "true",   // true for port 465, false for 587
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false,  // allow self-signed certs during development
    },
});

// Verify SMTP connection on startup
transporter.verify((err) => {
    if (err) {
        console.error("❌  SMTP connection failed:", err.message);
    } else {
        console.log("✅  SMTP connection verified — ready to send emails.");
    }
});

// ── Helper: build email body ──────────────────────────────────────────────────
function buildEmailBody(status, candidateName, jobTitle, matchScore, customMessage) {
    if (customMessage && customMessage.trim()) return customMessage.trim();

    if (status === "selected") {
        return (
            `Dear ${candidateName},\n\n` +
            `We are delighted to inform you that you have been SELECTED for the role of ${jobTitle}.\n\n` +
            `Your AI match score for this role was ${matchScore}%.\n\n` +
            `Our HR team will reach out shortly with the next steps.\n\n` +
            `Congratulations once again!\n\n` +
            `Best regards,\nHR Team`
        );
    }

    return (
        `Dear ${candidateName},\n\n` +
        `Thank you for your interest in the role of ${jobTitle}.\n\n` +
        `After careful consideration, we regret to inform you that we will not ` +
        `be moving forward with your application at this time.\n\n` +
        `We encourage you to apply for future openings that match your profile.\n\n` +
        `Best regards,\nHR Team`
    );
}

// ── Helper: build HTML body ───────────────────────────────────────────────────
function buildHtmlBody(status, candidateName, jobTitle, matchScore, customMessage) {
    const isSelected = status === "selected";
    const color = isSelected ? "#16a34a" : "#dc2626";
    const badge = isSelected ? "✅ Selected" : "❌ Not Selected";

    const bodyText = buildEmailBody(status, candidateName, jobTitle, matchScore, customMessage);
    const bodyHtml = bodyText.replace(/\n/g, "<br/>");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Arial, sans-serif; background:#f3f4f6; margin:0; padding:24px; }
    .card { background:#fff; max-width:560px; margin:auto; border-radius:12px;
            box-shadow:0 2px 12px rgba(0,0,0,.08); overflow:hidden; }
    .header { background:${color}; color:#fff; padding:28px 32px; }
    .header h1 { margin:0; font-size:22px; }
    .badge { display:inline-block; background:rgba(255,255,255,.25);
             border-radius:999px; padding:4px 14px; font-size:13px; margin-top:8px; }
    .body { padding:28px 32px; color:#374151; line-height:1.7; }
    .score-box { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px;
                 padding:14px 20px; margin:18px 0; }
    .score-box .label { font-size:12px; color:#6b7280; text-transform:uppercase;
                        letter-spacing:.05em; }
    .score-box .value { font-size:28px; font-weight:700; color:${color}; }
    .footer { background:#f9fafb; padding:16px 32px; font-size:12px; color:#9ca3af;
              text-align:center; border-top:1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Application Update — ${jobTitle}</h1>
      <span class="badge">${badge}</span>
    </div>
    <div class="body">
      <p>${bodyHtml}</p>
      ${!customMessage
            ? `<div class="score-box">
               <div class="label">AI Match Score</div>
               <div class="value">${matchScore}%</div>
             </div>`
            : ""
        }
    </div>
    <div class="footer">This is an automated message — please do not reply to this email.</div>
  </div>
</body>
</html>`;
}

// ── POST /api/send-email ──────────────────────────────────────────────────────
app.post("/api/send-email", async (req, res) => {
    const {
        candidate_email,
        candidate_name = "Candidate",
        job_title = "the position",
        match_score = 0,
        message = "",
        status = "selected",
    } = req.body || {};

    if (!candidate_email || !candidate_email.trim()) {
        return res.status(400).json({ error: "candidate_email is required." });
    }

    const normalizedStatus = status.toLowerCase();
    const subject =
        normalizedStatus === "selected"
            ? `🎉 Congratulations! You've been selected for ${job_title}`
            : `Update on your application for ${job_title}`;

    const mailOptions = {
        from: `"HR Team" <${process.env.MAIL_USERNAME}>`,
        to: candidate_email.trim(),
        subject,
        text: buildEmailBody(normalizedStatus, candidate_name, job_title, match_score, message),
        html: buildHtmlBody(normalizedStatus, candidate_name, job_title, match_score, message),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`📧  Email sent to ${candidate_email} — messageId: ${info.messageId}`);
        return res.status(200).json({
            message: `Email sent successfully to ${candidate_email}`,
            messageId: info.messageId,
            status: normalizedStatus,
        });
    } catch (err) {
        console.error("❌  Failed to send email:", err.message);
        return res.status(500).json({
            error: "Failed to send email. Check your SMTP settings in email-service/.env",
            detail: err.message,
        });
    }
});

// ── GET /api/health ───────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "nodemailer-email-service" });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀  Email service running on http://localhost:${PORT}`);
});
