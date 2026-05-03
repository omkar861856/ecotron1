(function() {
  const SCRIPT_URL = 'https://ads.ecotron.co.in';
  const CDN_URL = 'https://cdn.ecotron.co.in';

  const init = async () => {
    const scripts = document.getElementsByTagName('script');
    const currentScript = scripts[scripts.length - 1];
    const placementId = currentScript.getAttribute('data-placement') || 'default';

    try {
      const response = await fetch(`${SCRIPT_URL}/serve?placement=${placementId}`);
      const data = await response.json();

      if (data.status === 'success' || data.creative) {
        renderAd(currentScript, data);
      }
    } catch (err) {
      console.error('[ECOTRON] Placement Failed:', err);
    }
  };

  const renderAd = (target, data) => {
    const container = document.createElement('div');
    container.style.cssText = 'width:300px; height:250px; position:relative; overflow:hidden; border-radius:12px; font-family:sans-serif; background:#f8fafc; border:1px solid #e2e8f0;';
    
    container.innerHTML = `
      <a href="${data.link}" target="_blank" style="text-decoration:none; color:inherit;">
        <img src="${data.creative}" style="width:100%; height:100%; object-fit:cover;" />
        <div style="position:absolute; bottom:0; left:0; right:0; background:rgba(255,255,255,0.9); padding:8px; font-size:10px; font-weight:bold; color:#64748b; text-align:center;">
          Ads by ECOTRON
        </div>
      </a>
      <img src="${data.pixel}" style="display:none;" />
    `;
    
    target.parentNode.insertBefore(container, target);
  };

  init();
})();
