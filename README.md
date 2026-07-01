# MMM-LeanRSS

MagicMirror module for a zero-dependency scrolling RSS ticker.

![MagicMirror](https://img.shields.io/badge/MagicMirror-v2.33.0-blue)
![Node](https://img.shields.io/badge/Node-%3E%3D22-brightgreen)
![Version](https://img.shields.io/badge/Version-0.1.26-green)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

<p align="center">
  <img src="screenshot.png" alt="MMM-LeanRSS" width="600"/>
</p>

## Footprint

| File | Lines | Budget |
|------|------:|------:|
| `MMM-LeanRSS.js` | 47 | 100 |
| `node_helper.js` | 76 | 120 |
| `styles.css` | 40 | 80 |
| `package.json` | 10 | — |

## Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/th3pajay/MMM-LeanRSS.git
```

No `npm install` needed — zero dependencies.

## Configuration

```js
{
  module: "MMM-LeanRSS",
  position: "bottom_bar",
  config: {
    feeds: [
      { url: "https://feeds.bbci.co.uk/news/world/rss.xml",  label: "BBC",     color: "#ff6b6b" }, 
      { url: "https://feeds.bbci.co.uk/news/technology/rss.xml?edition=uk",  label: "Science",     color: "#fedb03" }, 
      { url: "https://feeds.bbci.co.uk/news/technology/rss.xml",  label: "TECH",     color: "#674ea7" }, 
      { url: "https://feeds.feedburner.com/ign/all",  label: "IGN",     color: "#6aa84f" },
    ],
    display: {
      maxItems:     20,       // headlines per rotation
      scrollSpeed:  60,       // px/s — higher = faster
      pauseOnHover: true,
      showSource:   true,     // prepend "[Label]" in feed color
      showAge:      false,    // append "· 2h ago"
      separator:    "·",      // character between headlines
      scale:        1.0,      // CSS scale transform on the panel
      compact:      false,    // reduces padding and font size
      direction:    "ttb",    // ticker animation direction "rtl" | "ltr" | "ttb" | "btt"  
    },
    polling: {
      updateInterval: 300000, // ms between re-fetches (min: 60000)
      fetchTimeout:   8000,   // per-feed timeout ms
      maxAgeHours:    24,     // drop items older than N hours (0 = off)
    },
  }
}
```
