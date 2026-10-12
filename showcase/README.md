# AGI Coffee Showcase

One responsive screen based on Figma's dark luxury slider, node `771:2819`, with four products from the client's brief. Buildless HTML/CSS and vendored Three.js. All assets and fonts are served locally.

The 3D pouch uses the client's supplied `coffee_packaging(2).glb`, adapted to the AGI photos: width/height 0.505, reduced depth, a shorter planar heat-sealed top and softly rounded sides. The original folds are retained with two subdivision passes. Foreign artwork is removed. Original AGI photographic label crops are projected onto the actual front surface. The result is a visual approximation, not a manufacturing model.

The black laminated film has low metalness, moderate roughness, restrained clearcoat and a fine surface bump. A natural-window HDRI is assigned to `scene.environment` only; the canvas stays transparent. Four rectangular lights provide a warm key, a narrow rim, a quiet label fill and a small top highlight. The label has its own matte material.

A full-screen AGI logo preloader displays progress from completed resources. The model, all four labels, film texture and HDRI load concurrently. It waits for initial decorative images, fonts, shader compilation and the first rendered frame before fading out. Reduced-motion users get an immediate exit. If WebGL or an asset fails, the photograph remains available; an independent 20-second watchdog also releases the page if the application module fails.

The three decorative bean cutouts were repaired using built-in ImageGen background extraction, preserving the original bean orientation and texture while removing detached fragments and matte fringes. The transparent branch was inspected and retained. Alpha contours were checked on dark and light backgrounds.

Decor is decoded before each transition. Staggered animations hold their initial frame during delays and persist final styles before releasing animation effects, without relying on commitStyles(). Queued transitions wait for all incoming animations to settle.

Validation: `node --experimental-loader ./tests/vendor-loader.mjs --test tests/*.test.js` parses the deployed GLB with Three.js, checks photographic proportions and the thin top seal, confirms the label stays on the mesh, initializes the area-light uniforms, verifies delayed decor animations and checks loading/fallback completion. The old procedural mesh's geometry tests are retained. A separate native OpenGL render was used to inspect the imported shape, label and reflections; it is a PBR approximation, not the exact browser renderer. Browser animation QA was unavailable in this environment.

Transitions last 1850 ms: full rotation; label changes while the front is hidden; outgoing text and decor fade, incoming items enter with a stagger. Includes buttons, arrow keys, touch swipe, a last-request queue, reduced-motion handling, visibility pause, and a functioning manager email CTA.

Sources:
- Original AGI package photographs supplied by the client.
- Supplied Coffee Packaging model by walteraraujo, CC BY 4.0: https://sketchfab.com/3d-models/coffee-packaging-62e5f2ddf6f1437db4da89791a3200eb. See `dist/assets/coffee-packaging-license.txt` for attribution and modifications.
- Figma layout, branch, glow and arrow assets from the linked coffee page.
- Three.js, MIT, see `dist/vendor/LICENSE`.
- Studio Country Hall by Sergej Majboroda / Poly Haven, CC0: https://polyhaven.com/a/studio_country_hall
- Cormorant Garamond and Manrope from Google Fonts, SIL Open Font License: https://fonts.google.com/specimen/Cormorant+Garamond and https://fonts.google.com/specimen/Manrope

Serve `dist/` using an HTTP server. No build step is required.

To regenerate the adapted GLB, run `python scripts/prepare-pouch.py /path/to/coffee_packaging.glb dist/assets/agi-coffee-pouch.glb` with NumPy installed. The output retains the model's source license metadata.
