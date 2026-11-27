/* Dimau share button v1: one Share button for every Dimau app.
   Opens the phone's share sheet (WhatsApp, Messenger, email...) or copies the link on a computer.
   Usage: <script src="/dimau-share.js" defer></script>  Optional: data-text="short line" */
(function () {
  if (window.__dimauShare) return; window.__dimauShare = 1;
  var me = document.currentScript;
  function go() {
    if (document.querySelector('[data-dimau-share]')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('data-dimau-share', ''); b.setAttribute('aria-label', 'Share this app');
    b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg><span>Share</span>';
    var s = document.createElement('style');
    s.textContent = '[data-dimau-share]{position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:2147483000;display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 18px;border-radius:999px;border:1px solid rgba(255,255,255,.75);background:rgba(135,206,235,.72);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);color:#0B2E4A;font:600 15px/1 Manrope,Lexend,system-ui,sans-serif;box-shadow:0 6px 20px rgba(11,46,74,.18);cursor:pointer}[data-dimau-share]:hover{background:rgba(135,206,235,.9)}@media(max-width:767px){[data-dimau-share]{bottom:calc(84px + env(safe-area-inset-bottom));min-width:48px;padding:0 14px}[data-dimau-share] span{display:none}}@media print{[data-dimau-share]{display:none}}';
    document.head.appendChild(s);
    b.addEventListener('click', function () {
      var d = { title: document.title, text: (me && me.dataset.text) || (document.querySelector('meta[name="description"]') || {}).content || '', url: location.href };
      if (navigator.share) { navigator.share(d).catch(function () {}); return; }
      var done = function () { var t = b.querySelector('span'); var o = t.textContent; t.textContent = 'Link copied'; b.querySelector('span').style.display = 'inline'; setTimeout(function () { t.textContent = o; t.style.display = ''; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(d.url).then(done, function () { prompt('Copy this link', d.url); });
      else prompt('Copy this link', d.url);
    });
    document.body.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
