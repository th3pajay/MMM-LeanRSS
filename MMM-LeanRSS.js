Module.register('MMM-LeanRSS', {
  defaults: {
    feeds: [],
    display: { maxItems: 20, scrollSpeed: 60, pauseOnHover: true, showSource: true, showAge: false, scale: 1.0, compact: false, direction: 'ptf' },
    polling: { updateInterval: 300000, fetchTimeout: 8000, maxAgeHours: 0 },
  },

  getStyles() { return [this.file('styles.css')]; },

  start() {
    for (const k of ['display', 'polling']) this.config[k] = { ...this.defaults[k], ...this.config[k] };
    this.items = []; this.ptfIdx = 0; this.ptfTimer = null; this.sendSocketNotification('RSS_INIT', this.config);
  },

  socketNotificationReceived(n, p) {
    if (n !== 'RSS_UPDATE') return;
    const sig = p.items.map(i => i.url).join() + (this.config.display.showAge ? Date.now() / 3_600_000 | 0 : '');
    if (sig === this.sig) return; this.sig = sig; this.items = p.items; this.updateDom(); this.scheduleTick();
  },

  suspend() { clearTimeout(this.ptfTimer); document.getElementById(this.identifier).classList.add('rss-paused'); },
  resume() { document.getElementById(this.identifier).classList.remove('rss-paused'); this.scheduleTick(); },

  scheduleTick() {
    clearTimeout(this.ptfTimer);
    if (this.config.display.direction !== 'ptf' || this.items.length < 2) return;
    const spd = Math.max(this.config.display.scrollSpeed, 1), dwell = Math.max(this.items[this.ptfIdx % this.items.length].title.length * 8 / spd, 2) * 1000;
    this.ptfTimer = setTimeout(() => { this.ptfIdx = (this.ptfIdx + 1) % this.items.length; this.updateDom(); this.scheduleTick(); }, dwell);
  },

  getDom() {
    const d = this.config.display, wrap = document.createElement('div');
    wrap.className = 'mmm-rss' + (d.compact ? ' mmm-rss--compact' : '');
    if (d.scale !== 1) wrap.style.zoom = d.scale;
    if (!this.items.length) return wrap;

    const mk = (cls, txt) => { const e = document.createElement('span'); e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
    const buildItem = item => {
      const span = document.createElement('a');
      span.className = 'rss-item'; span.href = item.url; span.target = '_blank';
      if (item.color) span.style.setProperty('--rss-item-color', item.color);
      if (d.showSource && item.source) span.appendChild(mk('rss-source', item.source));
      span.appendChild(mk('rss-title', item.title));
      if (d.showAge) { const h = Math.floor((Date.now() - item.pubDate) / 3_600_000); span.appendChild(mk('rss-age', h < 1 ? '<1h' : h < 24 ? h + 'h' : (h / 24 | 0) + 'd')); }
      return span;
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const ul = document.createElement('ul'); ul.className = 'rss-static-list';
      this.items.forEach(i => { const li = document.createElement('li'); li.appendChild(buildItem(i)); ul.appendChild(li); });
      wrap.appendChild(ul); return wrap;
    }

    const dir = d.direction;
    if (dir === 'ptf') {
      wrap.classList.add('mmm-rss--ptf');
      wrap.appendChild(buildItem(this.items[this.ptfIdx % this.items.length]));
      return wrap;
    }

    const vertical = dir === 'ttb' || dir === 'btt';
    if (vertical) wrap.classList.add('mmm-rss--vertical');
    const track = document.createElement('div');
    track.className = 'rss-ticker-track rss-ticker-track--' + dir + (d.pauseOnHover ? '' : ' rss-ticker-track--no-pause');
    const frag = document.createDocumentFragment();
    this.items.forEach(item => { frag.appendChild(buildItem(item)); if (!vertical) frag.appendChild(mk('rss-sep')); });
    track.append(frag, frag.cloneNode(true));
    const spd = Math.max(d.scrollSpeed, 1), chars = this.items.reduce((n, i) => n + i.title.length + 3 + (d.showSource ? i.source.length + 3 : 0), 0);
    track.style.animationDuration = `${(vertical ? this.items.length * 35 : chars * 8) / spd}s`;
    wrap.appendChild(track);
    return wrap;
  },
});
