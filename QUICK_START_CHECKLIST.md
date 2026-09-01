# Device Bridge Quick Start Checklist

Complete these steps in order to get real Archive.org channels loading in Liberty Play instead of demo fallback content.

---

## Phase 1: Device Bridge Setup (on your machine)

- [ ] Open terminal/PowerShell on your machine
- [ ] Create device bridge directory:
  ```bash
  mkdir -p ~/Projects/ajn-device-bridge
  cd ~/Projects/ajn-device-bridge
  ```
- [ ] Copy these 3 files from Liberty Play repo to device bridge directory:
  - [ ] `archive_m3u_device_adapter.ts`
  - [ ] `device_bridge_server.ts`
  - [ ] Create `package.json` with dependencies (see DEVICE_BRIDGE_INTEGRATION_GUIDE.md)
- [ ] Install dependencies:
  ```bash
  npm install
  ```
- [ ] Start device bridge:
  ```bash
  npm start
  ```
- [ ] Verify it says: `[Device Bridge Server] 🚀 Started on port 3000`
- [ ] **KEEP THIS TERMINAL RUNNING** (don't close it)

---

## Phase 2: Configure Liberty Play App

- [ ] Clone/update Liberty Play repo:
  ```bash
  git clone https://github.com/banamine/Liberty-Play-project-store.git
  cd Liberty-Play-project-store
  ```
- [ ] Create `.env` file in project root with:
  ```bash
  VITE_DEVICE_BRIDGE_ENDPOINT="http://localhost:3000/api/device-m3u-fetch"
  VITE_ARCHIVE_M3U_URL="https://archive.org/download/daily-highlights/Alex%2024.m3u"
  VITE_RSS_FEEDS="https://rss.alexjones.media/"
  ```
- [ ] Save `.env` file

---

## Phase 3: Start Liberty Play

- [ ] In a NEW terminal, start Liberty Play:
  ```bash
  npm install  # if needed
  npm run dev
  ```
- [ ] Wait for Vite to start (should say `Local: http://localhost:5173`)
- [ ] Open http://localhost:5173 in your browser

---

## Phase 4: Verify Real Channels Load

- [ ] Open browser DevTools (F12)
- [ ] Look at Console tab
- [ ] You should see:
  ```
  [Orchestrator] Fetching Archive M3U from device bridge: http://localhost:3000/api/device-m3u-fetch
  [Orchestrator] ✅ Device bridge returned 42 channels
  ```
- [ ] In the app sidebar, you should see real Archive.org streams (NOT Big Buck Bunny, Sintel, etc.)
- [ ] Try clicking on a channel and pressing play
- [ ] Stream should start playing (or show error if stream is unavailable, but it's real content)

---

## Phase 5: Test & Troubleshoot

### If device bridge endpoint fails:
- [ ] Check device bridge terminal — any error messages?
- [ ] Is device bridge still running? (port 3000 listener)
- [ ] Try manually testing endpoint:
  ```bash
  curl -X POST http://localhost:3000/api/device-m3u-fetch \
    -H "Content-Type: application/json" \
    -d '{"m3uUrl":"https://archive.org/download/daily-highlights/Alex%2024.m3u"}'
  ```
  Should return JSON with channels

### If still showing demo channels:
- [ ] Check browser console for errors
- [ ] Verify `.env` file has correct `VITE_DEVICE_BRIDGE_ENDPOINT`
- [ ] Restart Liberty Play (stop and `npm run dev` again)
- [ ] Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### If M3U parse error:
- [ ] Try different Archive.org M3U file (see list in DEVICE_BRIDGE_INTEGRATION_GUIDE.md)
- [ ] Update `VITE_ARCHIVE_M3U_URL` in `.env` and restart app

---

## Success Criteria

✅ App displays real Archive.org channels (40+ streams)  
✅ Sidebar shows channel titles, logos, and categories  
✅ Player shows real .mp4 URLs (not test-streams.mux.dev)  
✅ Console shows `[Orchestrator] ✅ Device bridge returned X channels`  
✅ No more Big Buck Bunny, Sintel, or Tears of Steel demo content  

---

## Need Help?

See **DEVICE_BRIDGE_INTEGRATION_GUIDE.md** for detailed setup and troubleshooting.

Key sections:
- Part 1: Device Bridge setup (detailed steps)
- Part 2: Liberty Play configuration
- Part 3: Verification checklist
- Troubleshooting table with solutions
