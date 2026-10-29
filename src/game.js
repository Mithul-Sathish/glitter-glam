// Global game context, filled in by main.js. Import G anywhere.
export const G = {
  app: null,
  W: 0,       // logical width  (screen px / S)
  H: 0,       // logical height (screen px / S)
  S: 1,       // UI scale: 1 on phones, up to 2 on large desktop screens
  /** switchScene(SceneClass, params) */
  go: null,
  scene: null,
  /** Convert a pointer event's screen position to logical coords. */
  ev(e) { return { x: e.global.x / G.S, y: e.global.y / G.S }; },
  /** Convert any screen-space point (e.g. getGlobalPosition) to logical coords. */
  pt(p) { return { x: p.x / G.S, y: p.y / G.S }; },
};
