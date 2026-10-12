# AGI — От истоков до вашей чашки

An independent responsive screen based on the AGI dark premium Figma concept.

## Run / embed

Serve `dist/` with any static HTTP server. All runtime fonts, textures, images,
Three.js and HDR lighting are local. `dist/index.html` is the entrypoint.
Embed the published screen with an iframe, or copy the `hero` section,
styles, assets and JS modules into an existing page. Keep the import map before
the module script. The Three.js canvas has an alpha channel and no background.

## Animation

The globe settles from Africa toward Russia in about 4 seconds. The origin
marker appears first, followed by a raised golden arc, destination marker and
the original ship from Figma. Idle motion and light pulses are subtle. Dragging
rotates the globe; location buttons focus the origin/destination. Replay restarts
the sequence. Pause, reduced-motion settings and a WebGL fallback are supported.

The arc communicates the direction of trade; it is not a literal sea route.

## Assets / credits

- Design / content / ship: user's AGI Figma file, node `767:2497`; ship `767:2509`.
- Fonts: Cormorant Garamond and Manrope, existing AGI project assets.
- Three.js: MIT, license included in `dist/vendor/LICENSE`.
- Geography: Natural Earth 1:110m countries, public domain:
  https://www.naturalearthdata.com/about/terms-of-use/
  https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson
- Studio environment: Poly Haven `studio_small_09`, CC0:
  https://polyhaven.com/a/studio_small_09

`scripts/build-map.py` reproduces local texture assets from the retained GeoJSON
using Pillow. No geography data or image URLs are fetched at runtime.

## Validation

Local JS syntax, dependency links, geography/UV alignment, endpoint projection,
route geometry, draw-range bounds and referenced files checked. Browser visual
QA unavailable in the managed environment: control-browser is not installed.
