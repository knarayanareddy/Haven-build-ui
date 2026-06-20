// ─── P1-10 FIX: Use chrome.storage.session for access token ───
// chrome.storage.session is in-memory only and cleared when the browser
// session ends. It is NOT accessible to other extensions.
// chrome.storage.local is unencrypted on disk and readable by any extension
// with the "storage" permission.

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== 'HAVEN_PAGE_RISK') return;

  // P1-10 FIX: prefer session storage; fall back to local with a warning
  const storageArea = chrome.storage.session || chrome.storage.local;

  storageArea.get(['havenSupabaseUrl', 'havenAccessToken', 'havenElderId']).then(async (config) => {
    if (!config.havenSupabaseUrl || !config.havenAccessToken || !config.havenElderId) return;
    try {
      await fetch(`${config.havenSupabaseUrl}/functions/v1/fn-browser-shield`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${config.havenAccessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          elder_id: config.havenElderId,
          url: message.url,
          page_title: message.page_title,
          visible_text: message.visible_text,
        }),
      });
    } catch {
      // Silently fail — browser shield is best-effort
    }
  });
});
