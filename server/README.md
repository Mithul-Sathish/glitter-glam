# Glitter & Glam online server

Optional. The game works fully offline without it. Running this server adds:

- **Accounts**: a nickname and password (no email).
- **Cloud saves**: progress follows the player to any device they log in on.
- **World rankings**: best score per minigame and best runway rating.

Payments are not part of this server.

## Run it

Needs Node 18 or newer. No packages to install.

```bash
node server/server.js
```

| Setting | Default | What it does |
| --- | --- | --- |
| `PORT` | `8787` | Port to listen on |
| `DATA_FILE` | `server/data/db.json` | Where accounts and scores are stored. Put it on a disk that survives restarts. |
| `ALLOWED_ORIGINS` | `*` | Comma-separated sites allowed to use the server, e.g. `https://yourname.github.io` |

## Turn it on in the game

1. Host this folder on any Node host that gives you an `https://` address and
   a persistent disk for `DATA_FILE`.
2. Set `ALLOWED_ORIGINS` to the address the game is served from.
3. Put the server address in `src/config.js`:
   ```js
   export const ONLINE_API = 'https://your-server.example.com';
   ```

With `ONLINE_API` empty the game shows no account button and makes no network
requests. Use that build for portals that do not allow outside servers.

To try it locally, run the server and open the game on localhost with
`?api=http://localhost:8787` added to the address.

## What is stored

Per player: nickname, a salted scrypt hash of the password, the game save, and
best scores. Login tokens are stored hashed and expire after 90 days. Players
can delete their account from the game, which removes all of it.

There is no password reset, because no email is collected.

## Before going live

- The game is aimed at young players. Check the privacy rules that apply to
  you (for example COPPA in the US and GDPR in Europe) and publish a short
  privacy note.
- Scores are sent by the browser, so a determined player can fake one. The
  server only rejects impossible values. Remove a cheater by deleting their
  entry from the data file while the server is stopped.
- The nickname filter is a short blocklist, not full moderation.
- Data lives in one JSON file, which suits a few thousand players. Move to a
  database before growing past that.
- Back up `DATA_FILE`.
