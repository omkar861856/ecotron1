'use client';

import { useEffect, useRef } from 'react';

interface AdBannerProps {
  height: number;
  width: number;
  adKey: string;
}

export default function AdBanner({ height, width, adKey }: AdBannerProps) {
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

  return (
    <div 
      className="ad-wrapper" 
      style={{ 
        minHeight: `${height}px`, 
        minWidth: `${width}px`,
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
    </div>
  );
}
