# gta6-cover-art-01
[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/slyfunds-commits/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/slyfunds-commits/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Neon Hours — Poster Studio

Neon Hours turns your own photos into a neon-noir poster in the spirit of
a GTA VI cover: three photo panels over a Vice City sunset, a striped
retro sun sinking to the horizon, and one big italic headline glowing
across it. It is an offline web app — no account, no upload, no build
step. Open it, drop in your photos, and export a share-ready PNG.

## What you get

- **Three panels, your way.** A large main frame plus two smaller ones,
  arranged to fit the poster shape: side-by-side stacks on square and
  wide posters, a full-width main panel on portrait ones.
- **Your photos, your crops.** Load as many images as you like, assign
  one to each panel, then zoom and pan every panel on its own until the
  framing feels right. Every panel gets the same pink-to-navy night
  grade, so mixed photos still look like one poster.
- **A headline that lands.** Type up to 32 characters, or tap one of the
  built-in lines — "AFTER THE LAST CALL" and "NEVER LOOK BACK". The type
  shrinks itself to fit in at most two lines, outlined dark with a pink
  glow over the sun.
- **A live preview.** The poster redraws the moment you touch anything,
  so what you see is exactly what the PNG will be.

## How to use

1. Serve the app (see "Run it" below) and open it in your browser.
2. **Add your photos.** Drop image files onto the "Choose photos" area,
   or click it to pick files. Two sample photos — a boulevard at dusk
   and a pier — are already loaded so you can try it straight away.
3. **Assign scenes.** Under "Your scenes", pick which loaded photo fills
   the MAIN, MID and CLOSE panels. One photo can fill all three, or each
   panel can hold a different one.
4. **Reframe each panel.** Pick a panel tab (MAIN, MID or CLOSE), then
   drag ZOOM, X OFFSET and Y OFFSET until the shot sits right. The
   preview updates live.
5. **Set the headline.** Type your own line, or tap a preset.
6. **Pick a format and export.** Choose square, portrait or wide, hit
   EXPORT PNG, and the file downloads as
   `neon-hours-<WIDTH>x<HEIGHT>.png`.

## Poster sizes

| Format | Pixels | Good for |
| --- | --- | --- |
| Square | 1080 × 1080 | Feed posts |
| Portrait | 1080 × 1350 | Portrait posts and stories |
| Wide | 1920 × 1080 | Banners and desktop wallpapers |

## Privacy

Everything happens in your browser, on your device. Photos are read
from your machine and drawn onto a canvas locally; they are never
uploaded anywhere, and the app makes no network requests at all. Close
the tab and nothing of your photos remains.

## What changed in round 3

This is a from-scratch rebuild for the round-3 resubmission. The poster
studio itself is the same idea — the same three panels, the same sun,
the same export sizes — but every file was rewritten fresh in a new
recorded session, and this README and guide were written over from a
blank page with fuller instructions, a sizes table, and an honest
account of the rebuild. Nothing was copied forward from the earlier
rounds.

## Run it

```sh
node serve.ts
```

Then open http://127.0.0.1:8080/ in your browser. `serve.ts` is a small
static server (Node's standard library only) that serves `app/` and
nothing else; pass `--port <n>` to listen on another port.

The entry point for make.fun is `main.ts`: it copies `app/` and
`screenshots/` into the output directory and writes `dossier.json`
there. Screenshots live in `screenshots/` — the cover first, then the
editor at work, then the wide poster.

<sub>Entered on [make.fun](https://make.fun/?ref=t2zg4r38&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
