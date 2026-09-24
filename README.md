# Spy or Safe — Polished Local Build

Realtime social-deduction party game for 2–8 players.

## Modes
- 2 players: 1v1 Spy Duel
- 3–8 players: Standard Spy mode
- 5 rounds by default

## Included
- Room codes and real-time WebSocket play
- Private role / secret-word reveal
- Clue submission, voting, final Spy guess
- Reconnect support
- Animated spy-themed UI
- Responsive mobile layout
- Inline original vector artwork (no external image dependency)
- Windows `start.bat` launcher that installs dependencies and opens the browser

## Run
### Windows
Double-click `start.bat`.

### Terminal
```bash
npm install
npm start
```

Open http://localhost:3000

## LAN multiplayer
On the same Wi-Fi, other devices can open:
`http://YOUR-PC-LAN-IP:3000`

Keep the server terminal open while playing.

### Visual update
The current build includes an original spy-agent illustration, animated dossier/scan effects, professional mission UI, rules/scoring modal, responsive cards, and no external image dependency.


### Random player avatars
Each player automatically gets a deterministic random-looking agent avatar based on their private player ID. The avatar stays the same across rounds and reconnects. No external avatar service is required.


## Reliability pass
- 2-player rooms use a real 1v1 Duel: the Safe player's vote decides whether the Spy is caught.
- Private role/word data is only included in each player's own state until the reveal phase.
- Reconnect resumes the same player/session token; host ownership is reassigned if the host disconnects.
- Duel rounds are voided if a player disconnects and does not return, avoiding an unfair one-player continuation.
- Scoring matches the UI: Safe voter +2, Spy escape +3, caught Spy correct guess +2.
- Tied standard votes eliminate nobody and give the Spy a word guess; no elimination occurs.
- The final round transitions to the final leaderboard automatically after its reveal.

Run the integration check with the server running in FAST mode:
```bash
FAST=1 npm start
# in another terminal
FAST=1 npm test
```
