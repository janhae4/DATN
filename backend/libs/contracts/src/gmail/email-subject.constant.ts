const SUPPORT_EMAIL = 'example@gmail.com';
const APP_NAME = 'My App';
const LOGIN_URL = 'http://localhost:3000/auth/login';

export const loginNotificationSubject = 'New sign-in detected';
export const loginNotificationTemplate = (
  name: string,
  datetime: string,
  ip: string,
  securityUrl = '',
  supportEmail: string = SUPPORT_EMAIL,
) => `
<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;background:#f5f7fb;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:20px 0;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:24px;text-align:left;">
                <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">New sign-in detected</h2>
                <p style="margin:0 0 16px;color:#374151;">Hi ${name},</p>
                <p style="margin:0 0 12px;color:#374151;">
                  We detected a login to your account on <strong>${datetime}</strong> from IP <strong>${ip}</strong>.
                </p>
                <p style="margin:0 0 16px;color:#374151;">
                  If this was you, no action is needed. If you don't recognize this activity, please <a href="{{securityUrl}}" style="color:#2563eb;text-decoration:none;">secure your account</a> or contact us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.
                </p>

                <div style="margin-top:20px;">
                  <a href="${securityUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Secure account</a>
                </div>

                <hr style="margin:20px 0;border:none;border-top:1px solid #eef2ff;" />

                <p style="margin:0;color:#9ca3af;font-size:12px;">
                  If you have questions, reply to this email or contact <a href="mailto:${supportEmail}">${supportEmail}</a>.
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

export const registerNotificationSubject = 'New account created';
export const registerNotificationTemplate = (
  name: string,
  loginUrl: string = LOGIN_URL,
  appName: string = APP_NAME,
  supportEmail: string = SUPPORT_EMAIL,
) => `
<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;background:#f7fafc;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:28px 0;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;">
            <tr>
              <td style="padding:28px;text-align:center;">
                <h1 style="margin:0 0 8px;font-size:24px;color:#0f172a;">Welcome, ${name}!</h1>
                <p style="margin:0 0 16px;color:#374151;">Your account at <strong>${appName}</strong> is now active.</p>

                <p style="margin:0 0 20px;color:#374151;">Click below to sign in and get started.</p>

                <a href="${loginUrl}" style="display:inline-block;padding:12px 20px;background:#10b981;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Sign in to your account</a>

                <hr style="margin:22px 0;border:none;border-top:1px solid #eef2ff;" />

                <p style="margin:0;color:#9ca3af;font-size:13px;">
                  Questions? Contact <a href="mailto:${supportEmail}">${supportEmail}</a>.
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

export const passwordChangeNotificationSubject = 'Password changed';
export const passwordChangeNotificationTemplate = (
  name: string,
  datetime: string,
  resetUrl: string = '',
  supportEmail: string = SUPPORT_EMAIL,
) => `
<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;background:#fffaf0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:24px 0;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:20px;">
                <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Password changed</h2>
                <p style="margin:0 0 12px;color:#374151;">Hi ${name},</p>
                <p style="margin:0 0 12px;color:#374151;">
                  Your account password was changed on <strong>${datetime}</strong>.
                </p>
                <p style="margin:0 0 16px;color:#374151;">
                  If you performed this change, no action is required. If not, please reset your password immediately:
                </p>

                <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#ef4444;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Reset password</a>

                <hr style="margin:18px 0;border:none;border-top:1px solid #f3e8ff;" />

                <p style="margin:0;color:#9ca3af;font-size:12px;">
                  Need help? Contact <a href="mailto:${supportEmail}">${supportEmail}</a>.
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

export const resetPasswordNotificationSubject = 'Reset your password';
export const resetPasswordNotificationTemplate = (
  name: string,
  expiryMinutes: number = 15,
  resetUrl: string = '',
  code: string = '',
  appName: string = APP_NAME,
  supportEmail: string = SUPPORT_EMAIL,
) => `
<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;background:#f8fafc;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:28px 0;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;">
            <tr>
              <td style="padding:28px;text-align:left;">
                <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Reset your password</h2>
                <p style="margin:0 0 12px;color:#374151;">Hi ${name},</p>
                <p style="margin:0 0 12px;color:#374151;">
                  We received a request to reset the password for your ${appName} account.
                  You can use the verification code below, or click the reset button.
                  This code and link will expire in ${expiryMinutes} minutes.
                </p>

                <!-- CODE HIỂN THỊ TRƯỚC NÚT RESET -->
                <div style="margin:18px 0;text-align:center;">
                  <p style="margin:0 0 8px;color:#374151;">Your verification code:</p>
                  <div style="display:inline-block;padding:10px 16px;border:1px dashed #2563eb;border-radius:8px;font-size:18px;font-weight:bold;color:#2563eb;">
                    ${code}
                  </div>
                </div>

                <p style="margin:18px 0;text-align:center;">
                  <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">Reset password</a>
                </p>

                <p style="margin:0 0 12px;color:#374151;">
                  If you did not request a password reset, please ignore this email or contact <a href="mailto:${supportEmail}">${supportEmail}</a>.
                </p>

                <hr style="margin:20px 0;border:none;border-top:1px solid #eef2ff;" />
                <p style="margin:0;color:#9ca3af;font-size:12px;">
                  For your safety, do not share this code or link.
                  If the button doesn’t work, you can also paste this URL into your browser: <br />
                  <a href="${resetUrl}" style="word-break:break-all;color:#2563eb;">${resetUrl}</a>
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
