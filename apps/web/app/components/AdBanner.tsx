'use client';

import { useEffect, useRef } from 'react';

interface AdBannerProps {
  height: number;
  width: number;
  adKey: string;
  className?: string;
}

export default function AdBanner({ height, width, adKey, className = "" }: AdBannerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        const adHtml = `
          <html>
            <body style="margin:0; padding:0; display:flex; justify-content:center; align-items:center; background:transparent;">
              <script type="text/javascript">
                atOptions = {
                  'key' : '${adKey}',
                  'format' : 'iframe',
                  'height' : ${height},
                  'width' : ${width},
                  'params' : {}
                };
              </script>
              <script type="text/javascript" src="//developdomicile.com/${adKey}/invoke.js"></script>
            </body>
          </html>
        `;
        doc.open();
        doc.write(adHtml);
        doc.close();
      }
    }
  }, [adKey, height, width]);

  // Hide ads that are wider than 300px on small screens
  const isTooWideForMobile = width > 300;

  return (
    <div 
      className={`ad-wrapper ${className} ${isTooWideForMobile ? 'desktop-only-ad' : ''}`} 
      style={{ 
        minHeight: `${height}px`, 
        minWidth: isTooWideForMobile ? `${width}px` : 'auto',
        display: 'flex',
        justifyContent: 'center',
        margin: '20px auto',
        overflow: 'hidden'
      }}
    >
      <iframe
        ref={iframeRef}
        width={width}
        height={height}
        frameBorder="0"
        scrolling="no"
        style={{ border: 'none', overflow: 'hidden' }}
        title="Advertisement"
      />
      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-only-ad {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
