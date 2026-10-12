# AGI — Золотой маршрут

Independent responsive single-screen Site, based on the existing premium dark
AGI Figma composition. Uses the original flat World silhouette, original ship,
Cormorant Garamond and Manrope. No WebGL, Three.js or CSS 3D transforms.

Serve `dist/` with an HTTP server. All fonts and images are local.

## Animation

The map fades in; Ethiopia's marker appears; a golden line draws along the
original curve toward Russia; the destination lights up. The ship appears with
a delayed translate/scale transition. Cursor motion and mobile scrolling move
the map and foreground at different rates; subtle ship drift and occasional
light travel remain after the intro. Replay resets the sequence; pause freezes
time while pointer inspection stays available. Reduced-motion preferences show
the complete static scene, and the SVG itself is usable without JavaScript.

The line is a schematic direction of trade, not a literal maritime route.

Figma source: `yUAFW3qmkuFKkOpWpnaMSf`, frame `767:2497`, World `767:2498`,
ship `767:2509`, curve style `778:2789`. Markers were corrected to lie inside
the ET and RU vector countries; the ship sits slightly lower to keep the origin visible.

## Verification

JavaScript syntax, local references, SVG route endpoints and timeline boundaries
checked. Browser visual QA unavailable: control-browser is not installed in
the managed environment.
