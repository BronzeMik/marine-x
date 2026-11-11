import { ImageResponse } from 'next/og';

export const alt = 'Marine X — By Design. Not Default.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, background: '#101110', color: '#e9e8e2' }}>
        <div style={{ fontSize: 40, letterSpacing: 8, color: '#ed6536', display: 'flex' }}>MARINE X</div>
        <div style={{ fontSize: 150, fontWeight: 900, lineHeight: 0.95, marginTop: 24, display: 'flex', flexDirection: 'column' }}>
          <span>LIVE BY DESIGN.</span>
          <span style={{ color: '#ed6536' }}>NOT DEFAULT.</span>
        </div>
      </div>
    ),
    size,
  );
}
