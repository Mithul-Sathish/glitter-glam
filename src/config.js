// Online features (player accounts, cloud saves, world rankings).
//
// Leave ONLINE_API empty and the game is fully offline: no account button, no
// network requests, nothing stored anywhere but this device. That is the mode
// to ship to portals that do not allow outside servers.
//
// To switch online features on, host the small server in /server (see
// server/README.md) and put its address here, e.g.
//   export const ONLINE_API = 'https://glitter-glam.example.com';
// For local testing you can also add ?api=http://localhost:8787 to the page
// address when the page itself is running on localhost.
export const ONLINE_API = '';
