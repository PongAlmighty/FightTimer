---
created: 2026-03-15T00:21:15.619Z
title: Poll hardware timer and sync web display
area: ui
files:
  - static/js/websocket.js
  - static/js/timer.js
  - src/WebServer.cpp (Arena-Timer-Firmware-Standalone)
---

## Problem

The web client has 5 timer displays. When a physical hardware timer (RP2040 running Arena Timer firmware) is present on the network, the web display should reflect whatever time the hardware is showing — not the other way around. Currently there is no mechanism for the web client to discover or poll the hardware.

The hardware exposes a REST API at `http://arenatimer.local` (mDNS) or `http://10.0.0.21` (static fallback). Relevant endpoints:
- `GET /api/status` — returns `{ "isPaused": bool }`
- `GET /api/settings` — returns current display settings
- `GET /api/websocket/status` — returns WebSocket connection status

**No firmware changes are allowed** — this is a shared firmware owned by another collaborator.

## Solution

On the web client side only:
- Every ~10 seconds, attempt a fetch to the hardware's REST API (try `arenatimer.local` first, fall back to `10.0.0.21`)
- If reachable and timer is running, read the current time and sync the web timer display to match
- If unreachable, do nothing (hardware is optional — web timer works standalone)
- This is one-way: hardware → web display only. The web control panel still sends commands to the software timer as normal.

Open question: the hardware `/api/status` only returns `isPaused`, not the current time remaining. May need to use `/api/settings` or find another endpoint that exposes time. Worth checking the full WebServer.cpp for a time-returning endpoint before implementing.
