Module.register('MMM-LeanRSS', {
  defaults: {
    feeds: [],
    display: { maxItems: 20, scrollSpeed: 60, pauseOnHover: true, showSource: true, showAge: false, separator: '•', scale: 1.0, compact: false, direction: 'rtl' },
    polling: { updateInterval: 300000, fetchTimeout: 8000, maxAgeHours: 0 },
  },

  getStyles() { return [this.file('styles.css')]; },

  start() { this.items = []; this.sendSocketNotification('RSS_INIT', this.config); },

  socketNotificationReceived(n, p) { if (n !== 'RSS_UPDATE') return; this.items = p.items; this.updateDom(); },

  getDom() {
    const d = this.config.display, wrap = document.createElement('div');
    wrap.className = 'mmm-rss' + (d.compact ? ' mmm-rss--compact' : '');
    if (d.scale !== 1) wrap.style.transform = `scale(${d.scale})`;
    if (!this.items.length) { wrap.classList.add('mmm-rss--loading'); return wrap; }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const ul = document.createElement('ul'); ul.className = 'rss-static-list';
      this.items.forEach(i => { const li = document.createElement('li'); li.textContent = i.title; ul.appendChild(li); });
      wrap.appendChild(ul); return wrap;
    }

    const dir = d.direction || 'rtl', vertical = dir === 'ttb' || dir === 'btt';
    if (vertical) wrap.classList.add('mmm-rss--vertical');
    const track = document.createElement('div');
    track.className = 'rss-ticker-track rss-ticker-track--' + dir + (d.pauseOnHover ? '' : ' rss-ticker-track--no-pause');
    const mk = (cls, txt) => { const e = document.createElement('span'); e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
    const frag = document.createDocumentFragment();
    this.items.forEach((item, idx) => {
      const span = mk('rss-item');
      span.style.setProperty('--rss-item-color', item.color);
      if (d.showSource) span.appendChild(mk('rss-source', `[${item.source}] `));
      span.appendChild(mk('rss-title', item.title));
      if (d.showAge) { const h = Math.floor((Date.now() - item.pubDate) / 3_600_000); span.appendChild(mk('rss-age', ` · ${h < 1 ? '<1h' : h + 'h'} ago`)); }
      frag.appendChild(span);
      if (!vertical && idx < this.items.length - 1) frag.appendChild(mk('rss-sep', d.separator));
    });
    track.append(frag, frag.cloneNode(true));
    const spd = Math.max(d.scrollSpeed, 1), chars = this.items.reduce((n, i) => n + i.title.length + (d.showSource ? i.source.length + 3 : 0), 0) + (this.items.length - 1) * 2;
    track.style.animationDuration = `${(vertical ? this.items.length * 35 : chars * 8) / spd}s`;
    wrap.appendChild(track);
    return wrap;
  },
});
