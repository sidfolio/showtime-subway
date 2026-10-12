# Showtime — first playable draft

The complete project history, architecture, character and UI pipelines, Reactor plan, validation evidence, and delivery checklist are in [documentation/PROJECT_DOCUMENTATION.md](documentation/PROJECT_DOCUMENTATION.md).

## Run on Windows

Open Command Prompt in `D:\NYU\Reactor project`:

```
npm install
npm run dev
```

Open the Local URL Vite prints. The Vite development server exposes `/api/token` for Reactor; `npm run server` is an optional standalone token server. `npm test` runs gameplay checks; `npm run build` produces `dist`.

## Deploy through GitHub and Vercel

The repository includes a Vercel serverless token endpoint at `api/token.js` and a Vite deployment configuration in `vercel.json`. Push the source to GitHub, import that repository from Vercel, set the framework to Vite, keep the build command as `npm run build`, and use `dist` as the output directory. Add `REACTOR_API_KEY` as a Vercel environment variable for Preview and Production; never commit `.env`.

The Hobby plan can host the code and serverless endpoint at no hosting charge, but Reactor X2 generation still uses Reactor credits. The current GLB character library is about 1.14 GB, so it is too large for a free Vercel static deployment. For a fast free demo, keep only the core characters in `public/assets/characters` and push the rest later. For the full cast, use Git LFS and enable Git LFS in Vercel's Project Settings → Git, or move the GLBs to object storage and point the loader at those URLs.

## Play

Choose a level. The first run begins with a skippable watch-only live tutorial (about 51 seconds). It demonstrates the actual game logic, with key presses and explanations beside the scene. Use Watch tutorial to replay it. This is a scripted live demo rather than a prerecorded video. P pauses the demo; Skip & play starts your chosen level. Movement controls cannot interfere with the demo.

The performer enters through the doors and walks into the aisle. Switch front, rear, or side cameras with the toolbar or 1 / 2 / 3. WASD and arrow keys move relative to the camera: left/right always point toward their screen edges; front/rear W/S move along the car, while side W/S move across it. Near a pole, E grabs it; W/S or up/down always climb while holding. E releases. Space jumps, Q braces, Shift ducks. J spins, K does a somersault between a pair of poles, L dances or does an aerial spin. Chain moves within six seconds for a larger combo. Tricks require clearance from passengers throughout the move. Contextual tags explain available actions, and a top banner warns three seconds before a shake.

People and poles are solid. Moving into a passenger stops the performer, produces a bump reaction, and records a strike; step sideways to go around. Ducking lowers the stance but does not remove collisions. Subdivided movement prevents walking through obstacles even during a long timestep. Boarding passengers also respect bodies and rods, and incoming queues wait for exiting passengers to clear the doorway.

Watch the warning before each lurch. Hold Q or a pole to protect balance. At stations, dismount, move to the marked green safe pocket, and wait until doors close. Tricks are disabled during boarding. Passengers enter across the doorway, then walk along the aisle; standing passengers exit through the doors. Passengers have no damage or health mechanic. Nearby jumps and tricks raise individual sleeper noise meters. Three strikes end your run at the next station.

Level 1 runs for two minutes. Level 2 runs for two and a half minutes and introduces an aggressive fictional passenger after 45 seconds. Hold F to block; G dodges; H creates space when no bystander is nearby. Three successful defensive actions defuse the situation. The aggressor is separate from sleeping passengers. Level 3 adds larger crowds and stronger lurches. Reach the tip target by the end of the timed ride. Endless practice removes the timer, but three strikes still end a run. End run stops a session whenever you want. P / Esc pauses; hiding the tab also pauses. Sound defaults to off.

## Files and architecture

- `src/main.js`: screens and a 60 Hz fixed timestep; rendering runs on browser animation frames. The simulation never reads canvas pixels.
- `src/game/`: plain state, performer actions, crowds, stations, level data, scoring and safety rules. A JS plain object works much like a Python dict with named fields.
- `src/render/subway3d.js`: Three.js car, lighting, materials, doors, cameras, and train sway. `rig.js` poses individual limbs and solves pole hand contacts after torso smoothing. `canvas.js` remains a WebGL initialization fallback. The DOM HUD remains separate from the fixed 1280×832 canvas. The surrounding interface makes the full layout 1280×960; narrower browsers scale the whole layout proportionally.
- `src/game/spatial.js` checks the swept stunt area around passengers; `src/input-camera.js` maps movement to the selected camera without changing the simulation.
- `src/game/collision.js` handles solid movement and sliding around bodies / poles; `prompts.js` supplies action and turbulence guidance; `tutorial.js` drives ten demonstration scenes using the real performer and rules logic.
- `src/input.js` and `src/audio.js`: shared keyboard/touch actions and optional synthesized feedback.
- `src/reactor/skin.js`, `server.js`, and `api/token.js`: Reactor X2 connection and server-side token exchange. The browser receives only a short-lived JWT; the API key stays in local/Vercel environment variables.

## Reference review and limits

All six supplied local files loaded and decoded in the browser: approximately 10.1, 20.0, 59.5, 25.0, 34.0, and 19.3 seconds. Frames show pole-supported movements, flips, footwork, and crowd clearance. `/references.html` is a development-only viewer; Vite serves only the six named Downloads videos and never copies them into the production build. YouTube links were not needed for this review.

This is a playable 3D prototype using procedural articulated characters, not photorealistic people or motion capture. The car has continuous walls with actual glass openings, a passing tunnel outside, curved orange/yellow seats, dimmer side lighting, worn surfaces, small graffiti, spills, litter and a bag on a seat, based on the supplied references. Passengers fidget, use phones, sleep on benches or the floor, brace and stagger during lurches. Two-bone inverse kinematics keeps reachable hand contacts fixed to the swaying car during pole moves. The flip includes reaching, locked contact, tuck, and return phases. Animation, circle collisions, and crowd clearance are scripted rather than a full physics simulation. Higher quality rigged character assets and authored stunt animations are the next visual milestone. L on a pole performs a procedural aerial spin. The HUD and menu remain placeholders for your Figma designs. Mobile has directional touch buttons rather than the planned analog joystick; phone testing is still pending.

This draft covers the offline portions of M2/M3 and basic sound/touch controls. M1/M4 are intentionally deferred by your request to leave Reactor disconnected. `.env` is ignored and `.env.example` contains no secret.
