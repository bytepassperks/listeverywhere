'use client';

import { useState } from 'react';

interface CompanyLogoProps {
  name: string;
  website: string;
  logoUrl: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { wh: 'w-10 h-10', text: 'text-lg', rounded: 'rounded-lg' },
  md: { wh: 'w-12 h-12', text: 'text-xl', rounded: 'rounded-lg' },
  lg: { wh: 'w-16 h-16', text: 'text-2xl', rounded: 'rounded-xl' },
};

const COLORS = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-pink-500 to-rose-500',
  'from-violet-500 to-indigo-500',
];

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % COLORS.length;
}

function getHostname(website: string): string {
  try {
    return new URL(website).hostname;
  } catch {
    return '';
  }
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ name, website, logoUrl, size = 'md' }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [faviconFailed, setFaviconFailed] = useState(false);
  const s = SIZES[size];
  const hostname = getHostname(website);

  const imgSrc = logoUrl || (hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=128` : '');

  if (!imgFailed && imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={name}
        className={`${s.wh} ${s.rounded} object-cover flex-shrink-0`}
        onError={() => setImgFailed(true)}
      />
    );
  }

  if (!faviconFailed && hostname && logoUrl) {
    const faviconSrc = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
    return (
      <img
        src={faviconSrc}
        alt={name}
        className={`${s.wh} ${s.rounded} object-cover flex-shrink-0`}
        onError={() => setFaviconFailed(true)}
      />
    );
  }

  const colorClass = COLORS[getColorIndex(name)];
  return (
    <div
      className={`${s.wh} ${s.rounded} bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}
    >
      <span className={`${s.text} font-bold text-white`}>
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
};
