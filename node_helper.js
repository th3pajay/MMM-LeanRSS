'use strict';
const NodeHelper = require('node_helper');
const C = { DEFAULT_UPDATE_INTERVAL_MS: 300000, MIN_UPDATE_INTERVAL_MS: 60000, MAX_TITLE_LENGTH: 120, MAX_CONSECUTIVE_FAILURES: 5 };
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function clean(s) {
  return s.trim().replace(/^<!\[CDATA\[|\]\]>$/g, '').trim()
    .replace(/&(?:#(x?)([\da-f]+)|(\w+));/gi, (m, x, n, e) => n ? String.fromCodePoint(parseInt(n, x ? 16 : 10)) : ENT[e] ?? m);
}

module.exports = NodeHelper.create({
  start() { this.config = this.timer = null; this.isFetching = false; this.failures = 0; this.lastItems = []; this.cache = {}; },

  socketNotificationReceived(n, p) {
    if (n !== 'RSS_INIT') return;
    this.config = p;
    if (this.lastItems.length) this.sendSocketNotification('RSS_UPDATE', { items: this.lastItems });
    this.schedule(0);
  },

  schedule(delay) { clearTimeout(this.timer); this.timer = setTimeout(() => this.fetchAll(), delay); },

  async fetchAll() {
    if (this.isFetching) return;
    this.isFetching = true;
    try {
      const { feeds, polling, display } = this.config, now = Date.now();
      const timeout = Math.max(polling.fetchTimeout, 1000), maxAgeMs = polling.maxAgeHours * 3_600_000;
      const base = Math.max(polling.updateInterval, C.MIN_UPDATE_INTERVAL_MS);
      if (!feeds.length) { this.schedule(base); return; }

      const perFeed = Math.ceil(display.maxItems / feeds.length);
      const fresh = i => !maxAgeMs || now - i.pubDate <= maxAgeMs;
      const cols = await Promise.all(feeds.map(f =>
        fetch(f.url, { signal: AbortSignal.timeout(timeout), headers: { 'User-Agent': 'MagicMirror', ...this.cache[f.url]?.headers } })
          .then(async r => {
            if (r.status === 304) return this.cache[f.url].items.filter(fresh);
            if (!r.ok) throw new Error(r.status);
            const xml = await r.text(), items = [], re = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
            let m;
            while (items.length < perFeed && (m = re.exec(xml)) !== null) {
              const b = m[1];
              const t = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(b);
              const l = /<link[^>]+href="([^"]+)"/i.exec(b) || /<link[^>]*>([\s\S]*?)<\/link>/i.exec(b);
              const d = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(b)
                     || /<published[^>]*>([\s\S]*?)<\/published>/i.exec(b)
                     || /<updated[^>]*>([\s\S]*?)<\/updated>/i.exec(b);
              if (!t || !l) continue;
              const title = clean(t[1]);
              const item = { title: title.length > C.MAX_TITLE_LENGTH ? title.slice(0, C.MAX_TITLE_LENGTH - 1) + '…' : title, source: f.label ?? '', url: clean(l[1]), pubDate: d ? new Date(clean(d[1])).getTime() || now : now, color: f.color };
              if (fresh(item)) items.push(item);
            }
            this.cache[f.url] = { items, headers: Object.fromEntries([['If-None-Match', r.headers.get('etag')], ['If-Modified-Since', r.headers.get('last-modified')]].filter(h => h[1])) };
            return items;
          })
          .catch(e => { console.error(`[MMM-LeanRSS] [HELPER] ${f.label}: ${e.message}`); return []; })
      ));

      const seen = {};
      const items = Array.from({ length: Math.max(...cols.map(a => a.length)) })
        .flatMap((_, n) => cols.map(a => a[n]).filter(Boolean))
        .filter(i => { const k = i.title.toLowerCase(); return !seen[k] && (seen[k] = 1); })
        .slice(0, display.maxItems);

      if (items.length) { this.failures = 0; this.lastItems = items; }
      else {
        this.failures = Math.min(this.failures + 1, C.MAX_CONSECUTIVE_FAILURES);
        this.sendSocketNotification('RSS_ERROR', { message: 'all feeds failed or returned no items', failures: this.failures });
      }
      this.sendSocketNotification('RSS_UPDATE', { items: this.lastItems });
      this.schedule(this.failures ? Math.min(base * 2 ** (this.failures - 1), 8 * base) : base);
    } catch {
      this.schedule(C.DEFAULT_UPDATE_INTERVAL_MS);
    } finally {
      this.isFetching = false;
    }
  },

  stop() { clearTimeout(this.timer); },
});
