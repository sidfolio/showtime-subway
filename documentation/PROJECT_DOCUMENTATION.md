# Showtime — Subway Performer

Project documentation, implementation record, and delivery guide.

**Document status:** living document  
**Current project state:** Version 2 local 3D prototype with an opt-in Reactor visual layer  
**Primary runtime:** browser, Vite, vanilla JavaScript, Three.js  
**Canonical gameplay render target:** 1280 × 832 pixels  
**Last consolidated:** October 12, 2026

## Context confirmation

I have the project context contained in this conversation and in the shared project folder. That includes the original game idea, the gameplay and realism requirements, the Figma discussion, the supplied subway references, the Meshy character workflow, the local implementation, the Reactor integration attempts, the test results, the browser checks, and the recorded documentation media.

This document records the project evidence available here. It does not assume access to private Figma edits, Reactor dashboard state, or files that were never shared in the conversation or copied into the project folder.

## 1. Product idea

Showtime is a browser game set inside a moving New York City subway car. The player is a street performer who has to move through a crowded car, use poles, perform tricks, react to turbulence, and earn tips while keeping passengers safe.

The central tension is speed versus awareness:

- Perform quickly to build a tip combo.
- Treat passengers and poles as solid objects.
- Avoid waking sleeping passengers.
- Brace or grip a pole when the train lurches.
- Make room during boarding and aggressive encounters.
- Keep the game playable even when the optional visual enhancement is unavailable.

The product goal developed during the project was not simply a side-view arcade game. It became a spatial subway experience with front, rear, and side camera views; mouse look and zoom; articulated characters; pole contact; crowd movement; resting and sleeping passengers; train sway; and a visual style based on supplied NYC subway photographs.

## 2. How the project evolved

### Initial concept

The first version was a playable subway-performer prototype with a flat canvas, keyboard movement, tricks, scoring, strikes, and a basic train interior. The player could move, climb, dance, flip, and spin while the train simulated stations and lurches.

### Realism requirements

The design then expanded around the details that make an NYC subway feel occupied and physical:

- A train body with actual windows rather than opaque side plates.
- Front, rear, side, and enclosed in-car views.
- Camera drag, pan, and zoom without leaving the car.
- Collision with passengers, poles, benches, and the train shell.
- Fast, readable pole actions with hands remaining attached.
- Falls when turbulence catches an unsecured player.
- Sitting, lying down, sleeping, standing, boarding, and exiting passengers.
- Dirt, graffiti, litter, spills, worn surfaces, curved benches, and dim side lighting.
- Prompts that appear only when an action is available.
- A watch-only tutorial that demonstrates the controls beside the live scene.
- A delayed end-of-line warning that does not interrupt the opening experience.

### Version 2 direction

Version 2 moved the project from a procedural visual prototype toward a real-time 3D subway scene. Meshy GLB characters were added, the train was rebuilt in Three.js, camera containment was added, and the simulation was strengthened with spatial collision and fall rules.

Reactor was then introduced as an optional visual layer. The local game remains the source of truth for motion, collisions, score, timing, and safety. Reactor is intended to repaint the live render, not to replace those systems.

## 3. Design and reference pipeline

The project followed this pipeline:

1. **Ideation:** define the performer fantasy, subway constraints, scoring, danger, and desired realism.
2. **Reference collection:** use the supplied subway interior photographs and videos to identify window placement, seat colors, pole density, lighting, grime, passenger posture, and crowd behavior.
3. **Interaction design:** define the keyboard actions, contextual prompts, turbulence warnings, tutorial sequence, scoring feedback, and pause flow.
4. **Figma design:** use the shared `Game UI.fig` file and Figma file `21DQmYBRyZo7SsQ5izSss5` as the visual source for the HUD, pause panel, controls, tutorial, and rewards.
5. **Character creation:** generate and rig commuter identities with Meshy AI, download GLB files with humanoid rigs and animation clips, then copy runtime-safe assets into `public/assets/characters`.
6. **Local simulation:** implement movement, collisions, crowd behavior, rests, turbulence, actions, scoring, and stations as plain JavaScript state and rules.
7. **3D rendering:** build the car, materials, windows, benches, poles, signs, lights, tunnel, passenger actors, cameras, and rigged poses with Three.js.
8. **Validation:** run automated gameplay tests, load every character, inspect grip targets, verify camera containment, and play the game in the browser.
9. **Reactor experiment:** capture the canvas, request a short-lived JWT on the server, connect the X2 model, send a visual prompt, and overlay the returned video when the user presses `R`.
10. **Delivery:** keep source, assets, tests, screenshots, videos, and documentation together so the game can be demonstrated and continued.

The project instruction file, `C:\Users\Sid\Downloads\CLAUDE.md`, is treated as guidance for the build. It says to use plain JavaScript rather than TypeScript or React, keep secrets server-side, preserve offline playability, and iterate in small testable milestones. Where historical planning text differs from the current implementation, the source code and current test suite describe the implementation that exists today.

## 4. Current technical architecture

```text
Keyboard / mouse / touch
            │
            ▼
       src/input.js ───── src/input-camera.js
            │
            ▼
       Plain game state
            │
   ┌────────┼─────────┐
   ▼        ▼         ▼
performer passengers train
   │        │         │
   └────────┼─────────┘
            ▼
          rules
            │
            ▼
   Three.js renderer / HUD / prompts
            │
       optional R toggle
            ▼
 canvas.captureStream(24)
            │
            ▼
       Reactor X2 video
```

The simulation does not read pixels from the renderer, and the renderer does not change game state. That separation keeps gameplay deterministic and allows the game to continue when Reactor is off.

### Runtime files

- [`index.html`](../index.html): DOM shell, canvas, video overlay, HUD, pause panel, tutorial panel, and controls.
- [`src/main.js`](../src/main.js): boot, fixed-timestep loop, screen switching, camera selection, Reactor toggle, tutorial lifecycle, and rendering calls.
- [`src/input.js`](../src/input.js): keyboard and touch actions mapped to one shared input state. WASD and arrow keys are supported.
- [`src/input-camera.js`](../src/input-camera.js): camera-relative movement mapping.
- [`src/game/state.js`](../src/game/state.js): the plain state object and session values.
- [`src/game/performer.js`](../src/game/performer.js): movement, jumping, ducking, pole grip, climbing, tricks, balance, falls, rest, and recovery.
- [`src/game/passengers.js`](../src/game/passengers.js): passenger placement, movement, seats, sleepers, boarding, exiting, and reactions.
- [`src/game/collision.js`](../src/game/collision.js): solid passenger and pole movement with swept steps and sliding.
- [`src/game/spatial.js`](../src/game/spatial.js): seats, stunt clearance, camera-safe spatial helpers, and passenger footprints.
- [`src/game/rest.js`](../src/game/rest.js): sitting, lying, floor rest, bench occupancy, and safe standing positions.
- [`src/game/train.js`](../src/game/train.js): stations, doors, boarding phases, lurch timing, and train motion state.
- [`src/game/rules.js`](../src/game/rules.js): strikes, wake-ups, aggressor encounters, rewards, combos, end conditions, and safety rules.
- [`src/game/levels.js`](../src/game/levels.js): data-only level configuration.
- [`src/game/tutorial.js`](../src/game/tutorial.js): ten watch-only tutorial scenes driven by the actual game rules.
- [`src/game/prompts.js`](../src/game/prompts.js): contextual action and turbulence guidance.
- [`src/game/character-catalog.js`](../src/game/character-catalog.js): stable character identities and role assignments.
- [`src/render/subway3d.js`](../src/render/subway3d.js): Three.js train, materials, windows, lights, doors, cameras, tunnel, props, actors, sway, and rendering.
- [`src/render/commuter.js`](../src/render/commuter.js): GLB loading, caching, texture sizing, skeleton cloning, and cast progress.
- [`src/render/rig.js`](../src/render/rig.js): procedural and imported poses, torso smoothing, and pole hand targets.
- [`src/render/skinned-pose.js`](../src/render/skinned-pose.js): bone-length inspection and two-bone reach correction.
- [`src/render/interface.js`](../src/render/interface.js): Figma-derived DOM UI, pause/menu behavior, prompts, rewards, warnings, and responsive layout scaling.
- [`src/render/hud.js`](../src/render/hud.js): score, strikes, balance, noise, and status feedback.
- [`src/render/canvas.js`](../src/render/canvas.js): fallback renderer and documentation capture input.
- [`src/audio.js`](../src/audio.js): synthesized feedback for movement, lurches, snores, and tips.
- [`src/reactor/skin.js`](../src/reactor/skin.js): opt-in Reactor connection, canvas publishing, prompt, returned video overlay, and fallback status.
- [`server.js`](../server.js): Express token endpoint for server-side Reactor API-key exchange.
- [`vite.config.js`](../vite.config.js): Vite development middleware for `/api/token`, recording, references, and dependency handling.

## 5. Gameplay and control design

| Action | Keyboard | Behavior |
|---|---|---|
| Move | W/A/S/D or arrow keys | Camera-relative movement; left and right match the screen edges. |
| Jump | Space | Quick vertical movement with collision and sleeper noise effects. |
| Duck | Shift | Lowers the performer’s posture for tighter spaces; it does not remove collisions. |
| Grab / release | E | Instantly attaches to or releases a reachable pole. |
| Climb | W/S or Up/Down while gripping | Moves along the held pole. |
| Brace | Hold Q beside a reachable pole | Protects against a train lurch when a grip is not already secured. |
| Pole spin | J | Fast spin while holding a pole. |
| Two-pole flip | K | Flip between two poles when clearance exists. |
| Dance / aerial | L | Floor dance in open space or aerial spin while gripping. |
| Sit | C | Sits on a nearby empty seat or clear floor. |
| Lie down | X | Lies across an available bench section or clear floor. |
| Stand | Z | Stands in a clear aisle position. Movement also attempts to stand. |
| Camera presets | 1 / 2 / 3 | Front aisle, rear aisle, and side aisle. |
| Look | Left mouse drag | Looks around within the car. |
| Pan | Shift-drag or right drag | Moves the view spatially while remaining contained. |
| Zoom | Mouse wheel | Zooms in and out within safe camera limits. |
| Pause | P or Esc | Pauses or resumes the current run. |
| Reactor enhancement | R | Loads the optional Reactor visual layer. |
| Help | Backslash | Hides or shows instructions. |

The arrow-key direction issue was corrected by routing both WASD and arrows through the camera-relative movement mapper. While gripping, the vertical keys remain dedicated to climbing so pole movement stays predictable.

## 6. Simulation rules

### Movement and collision

Passengers and poles are solid. The performer cannot walk through them, and long movement steps are subdivided to prevent tunneling. When a passenger blocks the path, movement stops or slides around the body. A bump creates a reaction and can add a strike. Ducking changes posture but does not make the performer intangible.

### Poles and tricks

Pole actions require a reachable pole and sufficient clearance. The prompt layer shows the action only when it is available. Pole hand targets are solved in train space after torso smoothing, so hands remain attached as the car sways. The flip has reach, locked-contact, tuck, and return phases rather than teleporting between poses.

### Turbulence and falling

Train lurches have direction, strength, timing, and a warning period. An unsecured performer loses balance and can fall forward, backward, or sideways. A pole grip, a valid Q brace, a marked safe pocket, or a low resting posture protects the performer. Falls cancel an active trick, create an impact/recovery sequence, and affect strikes and combo state.

### Rest and sleepers

The player can sit on an empty seat, sit on clear floor, lie across a bench, lie on clear floor, and stand again only when a safe location exists. Bench sleepers reserve neighboring seat space. Sleepers keep their character identity when noise wakes them. Nearby jumps and tricks raise each sleeper’s noise meter; waking a sleeper is a strike condition.

### Stations and boarding

At a station, doors open, passengers exit, queued passengers board, and the performer is expected to move to the safe pocket. Tricks are disabled during boarding. Incoming passengers respect existing bodies and rods, and waiting queues do not cross the doorway until the path is clear.

### Scoring and safety

The top tips value is the running total, including combo earnings. Reward popups show the completed move’s actual delta. Consecutive moves within the combo window receive the appropriate multiplier. Three strikes end the run at the next station. Endless practice removes the timer but preserves collision and strike rules.

## 7. Levels

The current data configuration contains:

| Level | Crowd | Sleepers | Shake profile | Stations | Tip target | Duration |
|---|---:|---|---|---:|---:|---:|
| Late Night Local | 5 | 3 | gentle | 3 | 700 | 120 s |
| Off-Peak | 9 | 2 | moderate | 4 | 1,200 | 150 s |
| Rush Hour Express | 16 | 1 | strong and frequent | 5 | 1,800 | 180 s |

Level 2 also introduces the fictional aggressor encounter after its delay. Blocking, dodging, and pushing back are level-specific defensive actions. The aggressor is not one of the supplied Meshy commuter identities and remains a procedural/placeholder actor.

## 8. Character production pipeline

Characters were produced in Meshy AI from role descriptions and reference intent, then downloaded as GLB files with humanoid skeletons and animation clips. The selected download path used a rigged character and all added animations. The runtime does not depend on Mixamo for the current cast because the Meshy exports already contain usable humanoid rigs; the game adds its own procedural poses for custom pole and fall actions.

### Stable cast

The catalog currently contains 18 stable identities, including the player and passenger roles:

- Showtime Acrobat — player performer.
- Unfazed Sleep Master — sleeper model.
- Rush Hour Commuter — retained commuter identity.
- Midnight Clubber.
- Video Caller.
- Neighborhood Elder.
- Observant Writer.
- Lost Tourist.
- Pole-Leaning Commuter.
- Beauty Expert.
- Underground Scholar.
- Bodega Food Lover.
- Music Enthusiast.
- Weary Hospital Worker.
- Gym Enthusiast.
- Smartphone Gamer.
- Subway Orator.
- Protective Pet Owner.

The source GLBs are copied to stable web-safe names in [`public/assets/characters`](../public/assets/characters). `src/game/character-catalog.js` assigns identities deterministically so a rider does not change appearance when waking, boarding, or reacting. Rush Hour uses the full passenger roster needed to exercise the cast.

### Runtime character handling

`src/render/commuter.js` loads one GLB at a time, caches shared geometry and textures, clones skeletons for independent actors, caps runtime texture sizes, and releases temporary decoder resources. The simulation position is separate from imported root motion, so an animation cannot bypass collision rules. Imported walking and running clips supplement the procedural pose system; pole actions, rests, flips, and falls are driven by the game’s own pose code.

### Known character limits

The Meshy characters are rigged game assets rather than motion-captured NYC performers. Custom stunt animation clips are not embedded in the supplied files. The most reliable route is to keep simulation and grip contacts local, then add authored animation polish or Reactor visual enhancement after the physical behavior is stable.

## 9. Train and visual production

The Three.js car is a continuous subway shell with real window openings, thin frames, doors, curved seats, poles, signs, a floor, a ceiling, side lighting, and an outside tunnel. The current geometry uses a long narrow car sized approximately 15.4 units by 3.05 units by 2.70 units, while the renderer uses a 1280 × 832 internal target and scales the canvas responsively in the browser.

The visual pass follows the supplied reference images:

- Stainless-steel and pale worn surfaces.
- Orange, yellow, and red curved bench seats.
- Fluorescent lights along the sides, with a dimmer central aisle.
- Dark speckled rubber floor.
- Fingerprints, scratches, streaks, small graffiti marks, litter, spills, cups, and a bag prop.
- Tunnel motion visible through the windows.
- Destination signs and door details inside the car.
- Train rotation and vertical motion during lurches.

The windows are intentionally transparent openings with thin frames. The camera is contained inside the car by `camera-space.js` and additional lens-avoidance checks in `subway3d.js`.

## 10. UI and Figma workflow

The Figma file was shared as `Game UI.fig` and the Figma design URL `21DQmYBRyZo7SsQ5izSss5`. The implementation uses locally downloaded SVG surfaces and the Koulen font under `public/assets/ui`.

The UI work followed this sequence:

1. Read the Figma screens and interaction annotations.
2. Extract reusable panel and button surfaces into local assets.
3. Build the HUD, pause/mode panel, tutorial panel, live controls drawer, reward feedback, turbulence banner, line warning, and status badges in HTML/CSS.
4. Connect every displayed value to real state rather than hard-coded demo text.
5. Verify mode selection, pause/resume, help disclosure, tutorial, reward totals, and end-session behavior in the browser.

The top tips tab is the cumulative total, including combo earnings. The reward popup is a separate event presentation layer and does not modify the score. Reward presentation is deduplicated and freezes while paused or while a safety warning is active.

The responsive layout uses the 1280 × 832 gameplay coordinate system as its base and scales the UI to the available viewport. The gameplay canvas remains the fixed internal render target while CSS makes it fill the browser window.

## 11. Tutorial and onboarding

The opening tutorial is a watch-only demonstration driven by the same state and rules used in play. It demonstrates:

1. Going around poles.
2. Ducking.
3. Floor dancing.
4. Gripping and climbing.
5. Pole spinning.
6. Two-pole flipping.
7. Aerial spinning.
8. Giving passengers space.
9. Bracing for turbulence.
10. Boarding safety.

The side panel shows the current action and keys while the player is not controlling the scene. `P` pauses the demonstration, and Skip & Play starts the selected run.

## 12. Reactor integration plan and current state

### Intended role

Reactor is a visual enhancement layer. The local game continues to own the authoritative state. The browser captures the local canvas at 24 fps, publishes its video track to the model, sets a visual editing prompt, and displays the returned `main_video` stream over the local render.

### Current implementation

[`src/reactor/skin.js`](../src/reactor/skin.js) currently:

1. Loads the X2 model lazily when `R` is pressed, so a Reactor SDK failure cannot prevent the game UI from booting.
2. Requests a short-lived JWT from `POST /api/token`.
3. Creates an `X2Model` client.
4. Publishes `canvas.captureStream(24).getVideoTracks()[0]` with `publishSource`.
5. Sends an NYC subway visual prompt with `setPrompt`.
6. Displays the returned main video in `#reactor-video`.
7. Shows CONNECTING, LIVE, ERROR, and OFF states.
8. Disconnects and returns to the local render when toggled off or when connection fails.

The prompt currently asks for a consistent R160-inspired stainless-steel car, curved orange benches, dark speckled floor, side fluorescent lighting, a dimmer aisle, worn advertisements, fingerprints, grime, subtle graffiti, tunnel motion, fixed camera framing, unchanged gameplay actions, and preserved pole contacts.

### Reference conditioning

The X2 package documentation supports uploading a reference image with `uploadFile()` and applying it with `setReferenceImage()`. A subway interior photograph can anchor the car appearance, while the text prompt supplies the material, lighting, cleanliness, and preservation rules. Replacing a reference during a run restarts generation, so reference selection should happen before the session begins.

The recommended enhancement experiment is:

1. Use one high-quality empty-car interior photo as the environment reference.
2. Use the local 3D train for exact windows, poles, seats, and collision geometry.
3. Keep the prompt focused on repainting materials, lighting, grime, and realism.
4. Test the same short gameplay scene with Reactor off and on.
5. Keep the local canvas visible as a small minimap or fallback while the returned video is being evaluated.

### What Reactor will not guarantee

Reactor is not the collision system, skeletal animation solver, train simulator, or authoritative camera. Video-to-video generation can soften, morph, or hallucinate fast limbs and pole contacts. That is why the local game must remain playable without it and why fast flips, grips, falls, and crowd collisions need to be correct before the visual layer is trusted.

### Current verification status

The server-side token exchange is implemented in both `server.js` and the Vite development middleware. The Reactor path has previously reached dependency/WASM errors in the browser, so the connection should be considered **wired but not yet production-verified** until pressing `R` produces a stable `LIVE` status and a visible returned video stream. The lazy-load boundary now protects the normal game from those errors.

## 13. Security and environment setup

The Reactor API key belongs only in `.env` and is never placed in client-side JavaScript. `.env` is ignored by Git, and `.env.example` contains the variable names only.

Create or edit the local file in PowerShell or a text editor; do not type `REACTOR_API_KEY=...` as a PowerShell command. The file format is:

```env
REACTOR_API_KEY=your_reactor_key_here
PORT=3001
```

Run the project from the project directory:

```powershell
Set-Location "D:\NYU\Reactor project"
npm.cmd install
npm.cmd run dev -- --port 5173 --force
```

Open:

```text
http://localhost:5173/
```

If using the separate Express token server instead of Vite middleware:

```powershell
npm.cmd run server
```

The server is intended to stay local. Never commit `.env`, paste the key into browser code, or expose it in a screenshot or recording.

## 14. Validation and evidence

The automated suite currently contains 30 passing checks. It covers:

- Full character-cast presence and sleeper identity retention.
- Actual Acrobat rig hand contacts during pole actions.
- Camera-relative movement and left/right direction.
- Solid pole and passenger collision.
- Sliding around obstacles.
- NPC movement and doorway queues.
- Turbulence falls, recovery, and secured grips.
- Seating, lying, bench occupancy, and standing.
- Fast aggressor actions and defense.
- Prompts, tutorial flow, rewards, combos, and completion accounting.
- Camera containment and mouse-spatial behavior.

The project also contains browser evidence and deliverable media:

- [`documentation/Showtime-Version-1-Walkthrough.mp4`](Showtime-Version-1-Walkthrough.mp4)
- [`documentation/showtime-v1-capture.mp4`](showtime-v1-capture.mp4)
- [`documentation/Showtime-Version-1-Contact-Sheet.png`](Showtime-Version-1-Contact-Sheet.png)
- [`documentation/Showtime-Version-2-Edge-to-Edge.png`](Showtime-Version-2-Edge-to-Edge.png)
- [`documentation/version-2-character-cast.png`](version-2-character-cast.png)
- [`documentation/version-2-expanded-character-cast.png`](version-2-expanded-character-cast.png)
- [`documentation/version-2-turbulence-fall.png`](version-2-turbulence-fall.png)
- [`documentation/figma-ui/`](figma-ui/)
- [`Documentation videos/Version 1.mp4`](../Documentation%20videos/Version%201.mp4)

Build and test commands:

```powershell
npm.cmd test
npm.cmd run build
```

The test command is the quickest gameplay regression check. The production build confirms that the browser bundle can be generated. Browser verification is still required for WebGL, asset loading, responsive layout, audio, and Reactor video behavior.

## 15. Delivery package

The project can be delivered as a folder containing:

- Source files under `src/`.
- `index.html`, `package.json`, `package-lock.json`, and `vite.config.js`.
- Character assets under `public/assets/characters`.
- Figma-derived UI assets under `public/assets/ui`.
- Tests under `tests/`.
- Documentation, screenshots, contact sheets, and walkthrough videos under `documentation/`.
- `README.md` for the short run guide.
- `.env.example` for safe configuration guidance.

The private `.env` file must be excluded from the delivery archive unless the recipient has an approved secure secret-sharing process.

## 16. Known limitations

- Reactor X2 is opt-in and remains unverified until a stable LIVE stream is observed in the current browser environment.
- Reactor may alter fast limbs or pole contacts because it repaints video frames rather than controlling the 3D rig.
- Character motions are procedural and imported locomotion clips; they are not full motion-capture performances.
- The aggressor model is still a placeholder.
- Mobile touch controls use directional buttons rather than a polished analog joystick.
- The final visual quality still depends on the quality and consistency of the supplied Meshy assets.
- The game currently uses generated materials and local procedural wear; a full production art pass would add authored textures, decals, and lighting calibration.
- The project has not yet completed a full Reactor cost/latency benchmark across all camera views and stunt actions.

## 17. Recommended next milestones

### Milestone A — stabilize the local game

Keep the Reactor toggle off and finish responsive layout, asset loading, camera framing, and fast action behavior. This is the dependable delivery build.

### Milestone B — validate Reactor with a controlled scene

Use a short, low-motion scene: a stationary performer in the completed train. Verify token exchange, SDK load, source publishing, prompt acceptance, returned video, latency, and cost before testing flips or dense crowds.

### Milestone C — add reference conditioning

Upload one subway interior reference before generation and compare the returned video against the local render. Keep the prompt under the model’s documented limit and avoid changing the reference mid-session.

### Milestone D — test high-risk actions

Test pole grip, climb, spin, two-pole flip, aerial spin, turbulence fall, and crowd clearance. Reject any visual enhancement that breaks hand attachment or makes the action unreadable.

### Milestone E — prepare the final handoff

Run the tests and production build, capture a clean walkthrough, update this document with the final Reactor result, remove secrets from the package, and deliver the source plus MP4 evidence.

## 18. Source-of-truth order

When two notes disagree, use this order:

1. Current source code and passing tests for implemented behavior.
2. The current Figma file and confirmed interaction decisions for UI appearance.
3. Supplied subway images/videos for environmental reference.
4. `CLAUDE.md` for workflow and security guidance.
5. Earlier planning notes and screenshots for historical context.

This order keeps the document honest about what was intended, what was designed, and what is actually running.
