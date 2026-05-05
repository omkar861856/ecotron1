'use client';

import { useEffect, useRef } from 'react';

interface AdBannerProps {
  id: string;
  format: 'iframe';
  height: number;
  width: number;
  key: string;
}

export default function AdBanner({ id, format, height, width, key }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current && !adRef.current.firstChild) {
      const script = document.createElement('script');
      const inlineScript = document.createElement('script');
      
      inlineScript.innerHTML = `
        atOptions = {
          'key' : '${key}',
          'format' : '${format}',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      `;
      
      script.src = `https://developdomicile.com/${key}/invoke.js`;
      script.async = true;

      adRef.current.appendChild(inlineScript);
      adRef.current.appendChild(script);
    }
  }, [key, format, height, width]);

  return (
    <div 
      className="ad-container" 
      style={{ 
        minHeight: `${height}px`, 
        minWidth: `${width}px`,
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
      }}
      ref={adRef}
    />
  );
}
