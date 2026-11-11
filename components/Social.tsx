'use client';
import { useState, FormEvent } from 'react';
import { Facebook, Instagram, Youtube, ArrowUpRight, Send, Loader2 } from 'lucide-react';

export const socials = {
  youtube: 'https://www.youtube.com/@MarineX',
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://www.facebook.com/themarinex',
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://www.instagram.com/themarinex',
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || 'https://www.tiktok.com/@themarinex',
  discord: process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.gg/marinex',
};

export function TikTokIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.6 6.7a5.2 5.2 0 0 1-3.2-1.1A5.2 5.2 0 0 1 15 2h-3.4v13.3a2.9 2.9 0 1 1-2-2.8V9a6.3 6.3 0 1 0 5.4 6.3V9.1a8.6 8.6 0 0 0 4.6 1.5z"/></svg>;
}

export function DiscordIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.2.5a18.4 18.4 0 0 0-6.4 0L8.6 3a19.8 19.8 0 0 0-4.9 1.4C.6 9 -.2 13.5.2 18a19.9 19.9 0 0 0 6 3l1.3-2.1a13 13 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12 0l.5.4a13 13 0 0 1-2 1l1.3 2.1a19.9 19.9 0 0 0 6-3c.5-5.200-.8-9.700-3.500-13.600zM8.500 15.300c-1.200 0-2.100-1.100-2.100-2.400s.9-2.400 2.100-2.400 2.100 1.100 2.100 2.400-.9 2.400-2.100 2.400zm7 0c-1.200 0-2.100-1.100-2.100-2.400s.9-2.400 2.100-2.400 2.100 1.100 2.100 2.400-.9 2.400-2.100 2.400z"/></svg>;
}

export function SocialLinks({ className = '' }: { className?: string }) {
  const items = [
    { label: 'YouTube', href: socials.youtube, icon: <Youtube size={18} /> },
    { label: 'Instagram', href: socials.instagram, icon: <Instagram size={18} /> },
    { label: 'TikTok', href: socials.tiktok, icon: <TikTokIcon /> },
    { label: 'Facebook', href: socials.facebook, icon: <Facebook size={18} /> },
    { label: 'Discord', href: socials.discord, icon: <DiscordIcon /> },
  ];
  return (
    <div className={`social-links ${className}`}>
      {items.map(i => (
        <a key={i.label} href={i.href} target="_blank" rel="noopener noreferrer" aria-label={i.label} title={i.label}>{i.icon}</a>
      ))}
    </div>
  );
}

export function DiscordSection() {
  return (
    <section className="discord-section" id="community">
      <div className="shell discord-inner reveal">
        <div>
          <span className="mini">JOIN THE COMMUNITY</span>
          <h2>JOIN THE <em>CREW.</em><br />ON DISCORD.</h2>
          <p>Talk gear, share your carry, get early looks at new videos, and swap honest opinions with people who care about the same things you do.</p>
          <a className="button-primary" href={socials.discord} target="_blank" rel="noopener noreferrer"><DiscordIcon size={19} /> JOIN THE DISCORD <ArrowUpRight size={18} /></a>
        </div>
        <ul className="discord-perks">
          <li><b>01</b> Gear talk &amp; carry showcases</li>
          <li><b>02</b> Early access to new videos</li>
          <li><b>03</b> Giveaways &amp; community events</li>
          <li><b>04</b> Direct line to Marine X</li>
        </ul>
      </div>
    </section>
  );
}

export function PartnerSection() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setStatus('sent');
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  }

  return (
    <section className="partner-section" id="partner">
      <div className="shell partner-inner">
        <div className="reveal">
          <span className="mini">WORK WITH MARINE X</span>
          <h2>PARTNER <em>WITH ME.</em></h2>
          <p>Brand deals, sponsored reviews, product sends, or collaborations. If your gear earns its place, let&rsquo;s talk. Tell me about your brand and what you have in mind.</p>
        </div>
        <form className="partner-form reveal" onSubmit={onSubmit}>
          <div className="form-row">
            <label>NAME<input name="name" required maxLength={100} autoComplete="name" /></label>
            <label>EMAIL<input name="email" type="email" required maxLength={150} autoComplete="email" /></label>
          </div>
          <div className="form-row">
            <label>BRAND / COMPANY<input name="company" maxLength={120} autoComplete="organization" /></label>
            <label>INTEREST
              <select name="type" defaultValue="Sponsorship">
                <option>Sponsorship</option>
                <option>Product review</option>
                <option>Affiliate partnership</option>
                <option>Collaboration</option>
                <option>Other</option>
              </select>
            </label>
          </div>
          <label>MESSAGE<textarea name="message" required rows={5} maxLength={3000} /></label>
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
          <button className="button-primary" type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? <><Loader2 size={17} className="spin" /> SENDING</> : <><Send size={17} /> SEND INQUIRY</>}
          </button>
          {status === 'sent' && <p className="form-ok" role="status">Message sent. I&rsquo;ll get back to you soon.</p>}
          {status === 'error' && <p className="form-err" role="alert">{error}</p>}
        </form>
      </div>
    </section>
  );
}
