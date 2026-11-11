import Link from 'next/link';
import type { ReactNode } from 'react';

export function AffiliateDisclosure({ compact = false }: { compact?: boolean }) {
  return (
    <p className="affiliate-disclosure" role="note">
      <strong>Affiliate disclosure:</strong> {compact ? 'Links marked "affiliate" may earn Marine X a commission at no extra cost to you.' : 'Some links on this site are affiliate links, including Amazon Associates and other partner programs. As an Amazon Associate, Marine X earns from qualifying purchases. Purchases from affiliate links are completed with the retailer, not through the Marine X shop, and retailer prices and availability may differ from what you see elsewhere.'}
    </p>
  );
}

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="gear-page">
      <header className="shell gear-header">
        <Link className="brand" href="/">MARINE<span>X</span><i>.</i></Link>
        <nav className="gear-nav" aria-label="Primary">
          <Link href="/gear">GEAR</Link>
          <Link href="/videos">SHOP THE VIDEO</Link>
          <Link className="under-link" href="/">HOME ↗</Link>
        </nav>
      </header>
      {children}
      <footer className="shell gear-footer">© {new Date().getFullYear()} MARINE X · Some links may earn a commission.</footer>
    </main>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={it.label}>{it.href ? <Link href={it.href}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}{i < items.length - 1 && ' / '}</span>
      ))}
    </nav>
  );
}
