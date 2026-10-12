# AGI Engrave coffee slider

Separate buildless HTML/CSS/JS site based on the latest Figma Engrave desktop slider (`798:3991`, `798:4775`, `798:4835`, `798:4895`). Uses the original four bag photographs, existing taste engravings, the exact original Russian copy, Onest Light and Manrope. All assets and fonts are local.

Two-dimensional transitions synchronize the bag, description and each ingredient illustration. Each transition lasts around 1.5 seconds. Automatic rotation every 7.2 seconds, pause button, keyboard arrows, swipe, pause on hover/focus/background tab, reduced-motion support and a last-request queue. No WebGL, Three.js, perspective or 3D transforms.

`dist/` is the complete website. Serve through any static HTTP host. `npm test` checks queued transitions, wrapping, failure recovery and asset availability. Browser visual QA was unavailable in this session.

Bag photographs were supplied by the client. Engravings were created with ImageGen for the Figma design. Google Fonts: Onest and Manrope (SIL Open Font License).
