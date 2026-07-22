// GoatCounter integration.
//
// Two limitations of GoatCounter's count.js drive this file:
//   1. It records `location.pathname + location.search` — the URL hash is
//      stripped. We use HashRouter, so every route would otherwise report the
//      same path and all pages would be lumped together.
//   2. It only counts the initial page load (no history/hashchange listeners),
//      so client-side navigation is invisible.
//
// So the script is loaded with {"no_onload": true} (see public/index.html) and
// we count every view ourselves.

const MAX_TRIES = 10;
const RETRY_MS = 200;

export function trackPageview(path, title) {
  let tries = 0;
  const send = () => {
    const gc = window.goatcounter;
    if (gc && typeof gc.count === 'function') {
      gc.count({ path, title });
      return;
    }
    // The script tag is async, so it may not be ready on first render.
    if (tries++ < MAX_TRIES) setTimeout(send, RETRY_MS);
  };
  send();
}
