# Cozy Pomodoro

A cozy pixel-art Pomodoro focus timer. Set an intention, focus, reflect,
review your day — over a living scene with seasons, weather and ambient sound.

Everything runs in your browser. No account, no server; your data stays on
your computer.

## Run it

```bash
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app for development (reloads as you edit) |
| `npm test` | Run the unit tests |
| `npm run build` | Check types and build the finished app into `dist/` |
| `npm run preview` | Serve the built app from `dist/` (this is the installable, offline version) |
| `npm run generate-audio` | Regenerate the placeholder sounds |
| `npm run generate-icons` | Regenerate the app icons |

## Install it / use it offline

Offline support and installing only work in the **built** app, not in `npm run dev`:

```bash
npm run build
npm run preview
```

Open the address it prints. After the first load the app works without a
network connection. In Chrome or Edge, use the install button in the address
bar to add it as an app.

Note that the built app is at a different address from `npm run dev`, and
browsers keep data separately per address — so it starts with empty history.
Use **Settings → Data → Export / Import** to move your data across.

## Where things are

```
src/
  timer/       the timer's rules (pure, unit-tested) and actions
  state/       stores: timer, settings, history, tags, open dialog
  scene/       the pixel scene: theme data, layers, weather, sprites, renderer
  audio/       sound layers, mix logic, Howler wrapper, chime
  components/  the panels and dialogs
  lib/         stats, export/import, retention, review logic
scripts/       generators for sounds and icons; the offline service worker
public/        sounds, icons, web app manifest
```

See [CREDITS.md](CREDITS.md) for assets and licences.
