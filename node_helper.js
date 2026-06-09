'use strict';
const NodeHelper = require('node_helper');
const C = { DEFAULT_UPDATE_INTERVAL_MS: 300000, MIN_UPDATE_INTERVAL_MS: 60000, DEFAULT_FETCH_TIMEOUT_MS: 8000, MAX_ITEMS: 50, MAX_TITLE_LENGTH: 120, MAX_BACKOFF_MS: 60000, MAX_CONSECUTIVE_FAILURES: 5 };

function clean(s) {
  return s.replace(/^<!\[CDATA\[|\]\]>$/g, '').trim()
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

module.exports = NodeHelper.create({
  start() { this.config = this.timer = null; this.isFetching = false; this.failures = 0; this.lastItems = []; },

  socketNotificationReceived(n, p) { if (n !== 'RSS_INIT') return; this.config = p; this.schedule(0); },

  schedule(delay) { clearTimeout(this.timer); this.timer = setTimeout(() => this.fetchAll(), delay); },

  async fetchAll() {
    if (this.isFetching) return;
    this.isFetching = true;
    try {
      const { feeds, polling = {}, display = {} } = this.config;
      const timeout = polling.fetchTimeout ?? C.DEFAULT_FETCH_TIMEOUT_MS;
      const maxAgeMs = (polling.maxAgeHours ?? 0) * 3_600_000;
      const limit = display.maxItems ?? C.MAX_ITEMS;
      const base = Math.max(polling.updateInterval ?? C.DEFAULT_UPDATE_INTERVAL_MS, C.MIN_UPDATE_INTERVAL_MS);
      if (!feeds?.length) { this.schedule(base); return; }

      const perFeed = Math.ceil(limit / feeds.length);
      const results = await Promise.allSettled(
        feeds.map(f =>
          fetch(f.url, { signal: AbortSignal.timeout(timeout), headers: { 'User-Agent': 'MagicMirror' } })
            .then(r => r.text())
            .then(xml => {
              const items = [];
              const re = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
              let m;
              while ((m = re.exec(xml)) !== null) {
                const b = m[1];
                const t = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(b);
                const l = /<link[^>]+href="([^"]+)"/i.exec(b) || /<link[^>]*>([\s\S]*?)<\/link>/i.exec(b);
                const d = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(b)
                       || /<published[^>]*>([\s\S]*?)<\/published>/i.exec(b)
                       || /<updated[^>]*>([\s\S]*?)<\/updated>/i.exec(b);
                if (!t || !l) continue;
                items.push({ title: clean(t[1]).slice(0, C.MAX_TITLE_LENGTH), source: f.label, url: clean(l[1]), pubDate: d ? new Date(clean(d[1])).getTime() : Date.now(), color: f.color ?? '#ffffff' });
              }
              console.log(`[MMM-LeanRSS] [HELPER] ${f.label}: ${items.length} items`);
              return items.slice(0, perFeed);
            })
            .catch(e => { console.error(`[MMM-LeanRSS] [HELPER] ${f.label}: ${e.message}`); return []; })
        )
      );

      const seen = {};
      const cols = results.map(r => r.value);
      const items = Array.from({length: Math.max(...cols.map(a => a.length))})
        .flatMap((_, n) => cols.map(a => a[n]).filter(Boolean))
        .filter(i => {
          let h = 5381;
          for (let j = 0; j < i.title.length; j++) h = ((h << 5) + h) ^ i.title.charCodeAt(j);
          const k = (h >>> 0).toString(16).slice(0, 8);
          return (seen[k] ? false : (seen[k] = 1)) && (!maxAgeMs || Date.now() - i.pubDate <= maxAgeMs);
        })
        .slice(0, limit);

      if (items.length) { this.failures = 0; this.lastItems = items; }
      else this.failures = Math.min(this.failures + 1, C.MAX_CONSECUTIVE_FAILURES);
      this.sendSocketNotification('RSS_UPDATE', { items: this.lastItems, fetchedAt: Date.now() });
      this.schedule(this.failures ? Math.min(base * 2 ** (this.failures - 1), C.MAX_BACKOFF_MS) : base);
    } finally {
      this.isFetching = false;
    }
  },

  stop() { clearTimeout(this.timer); },
});
