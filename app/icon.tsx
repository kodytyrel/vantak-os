import { ImageResponse } from 'next/og';

export const alt = 'VantakOS - No more gatekeeping';
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default async function Icon() {
  // Note: Next.js will use /logo.png from metadata.icons for the favicon
  // This icon.tsx serves as a fallback and generates a simple icon
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#38BDF8',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0F172A',
          fontWeight: 900,
          borderRadius: '8px',
          fontFamily: 'system-ui',
        }}
      >
        V
      </div>
    ),
    {
      ...size,
    }
  );
}

