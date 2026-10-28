# MMM-LeanRSS

A lean, zero-dependency RSS/Atom ticker for [MagicMirror²](https://magicmirror.builders). Click a headline to open the article.

![MagicMirror](https://img.shields.io/badge/MagicMirror-v2.33.0-blue)
![Node](https://img.shields.io/badge/Node-%3E%3D22-brightgreen)
![Version](https://img.shields.io/badge/Version-0.1.32-green)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

<p align="center">
  <img src="screenanim.gif" alt="MMM-LeanRSS" width="600"/>
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
| `display.direction` | `"ptf"` | `ptf` (one headline at a time, wipe-in) · `rtl` · `ltr` · `ttb` (moves down) · `btt` (moves up) |
| `display.pauseOnHover` | `true` | Pause the ticker while hovering |
| `display.showSource` | `true` | Prepend the label as a pill in the feed colour |
| `display.showAge` | `false` | Append a `2h` / `3d` age chip |
| `display.scale` | `1.0` | Scale of the panel |
| `display.compact` | `false` | Smaller padding and font |
| `polling.updateInterval` | `300000` | ms between fetches (min `60000`) |
| `polling.fetchTimeout` | `8000` | ms per feed |
| `polling.maxAgeHours` | `0` | Drop older items, `0` = off |

Any subset of `display` / `polling` keys can be set; the rest keep their defaults. Feeds are fetched with `ETag` / `Last-Modified`, so unchanged feeds cost a `304`. Failed fetches keep the last headlines and retry with backoff (up to 8× the interval). The ticker pauses while the module is hidden. Debug with `pm2 logs MagicMirror` and filter `[MMM-LeanRSS]`.

## Size

`MMM-LeanRSS.js` 76 / 100 · `node_helper.js` 82 / 120 · `styles.css` 37 / 80 lines.

## License

MIT
