# MMM-LeanRSS

A lean, zero-dependency RSS/Atom ticker for [MagicMirror²](https://magicmirror.builders). Click a headline to open the article.

![MagicMirror](https://img.shields.io/badge/MagicMirror-v2.33.0-blue)
![Node](https://img.shields.io/badge/Node-%3E%3D22-brightgreen)
![Version](https://img.shields.io/badge/Version-0.1.31-green)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

<p align="center">
  <img src="screenshot.png" alt="MMM-LeanRSS" width="600"/>
</p>

## Install

```bash
cd ~/MagicMirror/modules
git clone https://github.com/th3pajay/MMM-LeanRSS.git
```

No `npm install` — no dependencies.

## Config

```js
{
  module: "MMM-LeanRSS",
  position: "bottom_bar",
  config: {
    feeds: [
      { url: "https://feeds.bbci.co.uk/news/rss.xml", label: "BBC", color: "#ff6b6b" },
    ],
  },
}
```

Everything else is optional. See [`config.js.example`](config.js.example) for a full config.

## Options

`feeds[]`: `url` (RSS or Atom), `label` (source tag), `color` (tag colour).

| Option | Default | Description |
|--------|---------|-------------|
| `display.maxItems` | `20` | Headlines per rotation |
| `display.scrollSpeed` | `60` | px/s, higher is faster |
| `display.direction` | `"rtl"` | `rtl` · `ltr` · `ttb` · `btt` · `ptf` (one headline at a time) |
| `display.pauseOnHover` | `true` | Pause the ticker while hovering |
| `display.showSource` | `true` | Prepend `[Label]` in the feed colour |
| `display.showAge` | `false` | Append `· 2h ago` |
| `display.separator` | `"•"` | Between headlines (horizontal only) |
| `display.scale` | `1.0` | Scale of the panel |
| `display.compact` | `false` | Smaller padding and font |
| `polling.updateInterval` | `300000` | ms between fetches (min `60000`) |
| `polling.fetchTimeout` | `8000` | ms per feed |
| `polling.maxAgeHours` | `0` | Drop older items, `0` = off |

Failed fetches keep the last headlines and retry with backoff (up to 8× the interval). Debug with `pm2 logs MagicMirror` and filter `[MMM-LeanRSS]`.

## Size

`MMM-LeanRSS.js` 66 / 100 · `node_helper.js` 82 / 120 · `styles.css` 41 / 80 lines.

## License

MIT
