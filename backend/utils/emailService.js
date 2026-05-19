const nodemailer = require('nodemailer');

/**
 * Send a task assignment email to the assignee.
 * @param {Object} task  - populated task document
 */
const sendTaskAssignmentEmail = async (task) => {
  const { title, description, priority, deadline, assignedTo, assignedBy } = task;

  const assigneeName  = assignedTo?.name  || 'Team Member';
  const assigneeEmail = assignedTo?.email;
  const assignerName  = assignedBy?.name  || 'Your Manager';
  const assignerEmail = assignedBy?.email || process.env.EMAIL_USER;
  const assignerRole  = assignedBy?.role  ? `(${assignedBy.role.charAt(0).toUpperCase() + assignedBy.role.slice(1)})` : '';

  // Guard: skip if credentials or recipient not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[Email] EMAIL_USER or EMAIL_PASS not set — skipping notification.');
    return;
  }
  if (!assigneeEmail) {
    console.warn('[Email] No assignee email found — skipping notification.');
    return;
  }

  // Create transporter fresh each time so env vars are always up-to-date
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS.replace(/\s/g, ''), // strip spaces from app password
    },
  });

  const deadlineStr = deadline
    ? new Date(deadline).toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'No deadline set';

  const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
  const priorityColor  = priorityColors[priority] || '#6b7280';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Task Assigned</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">
                📋 New Task Assigned
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                You have a new task waiting for you
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 24px;font-size:15px;color:#374151;">
                Hi <strong>${assigneeName}</strong>,
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
                <strong>${assignerName}</strong> has assigned you a new task on <strong>TaskTrack</strong>. 
                Please review the details below and get started.
              </p>

              <!-- Task Card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;">

                    <!-- Title -->
                    <h2 style="margin:0 0 16px;font-size:20px;color:#111827;font-weight:700;">
                      ${title}
                    </h2>

                    <!-- Description -->
                    <p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.7;background:#ffffff;
                      border-left:3px solid #4f46e5;padding:12px 16px;border-radius:0 6px 6px 0;">
                      ${description}
                    </p>

                    <!-- Meta row -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;width:50%;">
                          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;">
                            <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
                              Priority
                            </div>
                            <div style="display:inline-block;background:${priorityColor};color:#fff;
                              font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:capitalize;">
                              ${priority || 'medium'}
                            </div>
                          </div>
                        </td>
                        <td style="padding-left:12px;width:50%;">
                          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;">
                            <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
                              Deadline
                            </div>
                            <div style="font-size:13px;font-weight:600;color:#111827;">
                              📅 ${deadlineStr}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
                Please log in to <strong>TaskTrack</strong> to view your full task list and update your progress.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:8px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}"
                  style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);
                  color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;
                  padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
                  View My Tasks →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an automated notification from TaskTrack. Please do not reply to this email.
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

  try {
    await transporter.sendMail({
      from: `"${assignerName} ${assignerRole} via TaskTrack" <${process.env.EMAIL_USER}>`,
      replyTo: `"${assignerName}" <${assignerEmail}>`,
      to: assigneeEmail,
      subject: `📋 New Task Assigned by ${assignerName}: ${title}`,
      html,
    });
    console.log(`[Email] Task assignment email sent to ${assigneeEmail} (on behalf of ${assignerEmail})`);
  } catch (err) {
    // Log but don't crash the request if email fails
    console.error('[Email] Failed to send assignment email:', err.message);
  }
};

module.exports = { sendTaskAssignmentEmail };
