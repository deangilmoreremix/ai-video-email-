import { createClient } from 'npm:@supabase/supabase-js@2';

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: string;
  }[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (settingsError) throw settingsError;

    const emailData: EmailRequest = await req.json();

    if (!settings || settings.email_api_provider === 'mailto') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Email provider not configured. Please configure your email settings.',
          useMailto: true 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let emailSent = false;
    let errorMessage = '';

    switch (settings.email_api_provider) {
      case 'sendgrid':
        emailSent = await sendViaSendGrid(settings, emailData);
        break;
      case 'resend':
        emailSent = await sendViaResend(settings, emailData);
        break;
      case 'mailgun':
        emailSent = await sendViaMailgun(settings, emailData);
        break;
      case 'smtp':
        throw new Error('SMTP sending is not yet supported');
      default:
        throw new Error('Unsupported email provider');
    }

    if (settings.zapier_enabled && settings.zapier_webhook_url) {
      try {
        await fetch(settings.zapier_webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'email_sent',
            to: emailData.to,
            subject: emailData.subject,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (zapierError) {
        console.error('Zapier webhook failed:', zapierError);
      }
    }

    return new Response(
      JSON.stringify({ success: emailSent }),
      {
        status: emailSent ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function sendViaSendGrid(settings: any, emailData: EmailRequest): Promise<boolean> {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.email_api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: emailData.to }] }],
      from: { 
        email: settings.email_from_address,
        name: settings.email_from_name || 'AI Video Assistant'
      },
      subject: emailData.subject,
      content: [{ type: 'text/html', value: emailData.html }],
    }),
  });

  return response.ok;
}

async function sendViaResend(settings: any, emailData: EmailRequest): Promise<boolean> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.email_api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${settings.email_from_name || 'AI Video Assistant'} <${settings.email_from_address}>`,
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
    }),
  });

  return response.ok;
}

async function sendViaMailgun(settings: any, emailData: EmailRequest): Promise<boolean> {
  const domain = settings.email_from_address?.split('@')[1] || '';
  const formData = new FormData();
  formData.append('from', `${settings.email_from_name || 'AI Video Assistant'} <${settings.email_from_address}>`);
  formData.append('to', emailData.to);
  formData.append('subject', emailData.subject);
  formData.append('html', emailData.html);

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${settings.email_api_key}`)}`,
    },
    body: formData,
  });

  return response.ok;
}
