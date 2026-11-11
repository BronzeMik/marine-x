import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Delivery: set PARTNER_WEBHOOK_URL to a Discord webhook URL (or a Slack-compatible one).
// Optionally set PARTNER_FORM_ENDPOINT (e.g. a Formspree URL) to forward as JSON instead.
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  if (clean(body.website, 50)) return NextResponse.json({ ok: true }); // honeypot

  const name = clean(body.name, 100);
  const email = clean(body.email, 150);
  const company = clean(body.company, 120);
  const type = clean(body.type, 50);
  const message = clean(body.message, 3000);

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please fill in your name, a valid email, and a message.' }, { status: 400 });
  }

  const webhook = process.env.PARTNER_WEBHOOK_URL;
  const endpoint = process.env.PARTNER_FORM_ENDPOINT;
  if (!webhook && !endpoint) {
    console.log('[partner inquiry]', { name, email, company, type, message });
    return NextResponse.json({ error: 'Contact form is not configured yet. Please reach out via social media.' }, { status: 503 });
  }

  try {
    let res: Response;
    if (endpoint) {
      res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ name, email, company, type, message }) });
    } else {
      const content = `**New partner inquiry**\n**Name:** ${name}\n**Email:** ${email}\n**Company:** ${company || '-'}\n**Interest:** ${type || '-'}\n**Message:**\n${message}`.slice(0, 1900);
      res = await fetch(webhook!, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, text: content, allowed_mentions: { parse: [] } }) });
    }
    if (!res.ok) throw new Error(String(res.status));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not send your message. Please try again later.' }, { status: 502 });
  }
}
