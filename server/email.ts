import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function sendInvitationEmail(
  email: string,
  role: string,
  invitationLink: string,
  inviterName?: string
): Promise<void> {
  try {
    console.log('📧 Attempting to send invitation email...');
    console.log('- To:', email);
    console.log('- Role:', role);
    
    const { client: resend, fromEmail } = await getUncachableResendClient();
    console.log('- From email configured:', fromEmail || 'Lab Management <onboarding@resend.dev>');
    
    const result = await resend.emails.send({
      from: fromEmail || 'Lab Management <onboarding@resend.dev>',
      to: email,
      subject: `You've been invited to join the Laboratory Management System as ${role}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation to Laboratory Management System</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f4f4f4; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <h1 style="color: #2563eb; margin-bottom: 20px;">You're Invited!</h1>
              <p style="font-size: 16px; margin-bottom: 15px;">
                ${inviterName ? `${inviterName} has` : 'You have been'} invited you to join the <strong>Laboratory Animal Management System</strong> as a <strong>${role}</strong>.
              </p>
              <p style="font-size: 16px; margin-bottom: 25px;">
                Click the button below to accept your invitation and set up your account:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationLink}" 
                   style="background-color: #2563eb; 
                          color: white; 
                          padding: 14px 28px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          display: inline-block;
                          font-weight: bold;
                          font-size: 16px;">
                  Accept Invitation
                </a>
              </div>
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 25px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  ⚠️ <strong>Important:</strong> This invitation will expire in 7 days. Please accept it soon to gain access to the system.
                </p>
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 25px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="font-size: 12px; color: #2563eb; word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
                ${invitationLink}
              </p>
            </div>
            <div style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} Laboratory Management System. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      text: `
You've been invited to join the Laboratory Animal Management System!

${inviterName ? `${inviterName} has` : 'You have been'} invited you to join as a ${role}.

To accept your invitation and set up your account, visit this link:
${invitationLink}

⚠️ Important: This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} Laboratory Management System. All rights reserved.
      `.trim(),
    });
    
    console.log('✅ Email sent successfully! Result:', result);
  } catch (error: any) {
    console.error('❌ Error sending invitation email:', {
      message: error.message,
      stack: error.stack,
      response: error.response,
      statusCode: error.statusCode
    });
    throw error;
  }
}
