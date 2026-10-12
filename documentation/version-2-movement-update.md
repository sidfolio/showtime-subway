# Version 2 movement and interior update

Unsecured standing performers fall during a lurch after a short reaction window. Each lurch has an identity and one of four knockdown directions. Falling cancels the move, slides the body through the existing solid collision system, and plays a full tip, floor impact, and recovery pose. A pole held with E, Q beside a reachable rod, the marked safe pocket, or a low resting posture protects the player. Q in an open aisle does not create an invisible grip.

## Controls

- WASD or arrows: move relative to the current camera. While gripping, W/Up climbs and S/Down descends.
- E: immediate grip/release. J: 0.75-second pole spin. K: 1-second flip. L: 0.85-second aerial spin or 0.65-second floor dance.
- C: sit on a nearby empty seat, otherwise sit on clear floor.
- X: lie across a nearby empty continuous bench section, otherwise lie on clear floor.
- Z: stand into a clear aisle position. Movement also attempts to stand.
- Left mouse drag: look around. Shift-drag or right drag: pan. Wheel: zoom.
- 1/2/3: reset to front/rear/side aisle presets. All eyes remain inside the car.
- Level 2 only: F blocks, G dodges, H pushes back when bystanders have clearance. Attacks have a visible windup, swing, and recovery.

Bench sleepers reserve neighboring seats. Lying bodies have extended collision footprints. Dirt, streaks, seat scratches, spills, litter, and discarded cups add wear without covering window openings.

## Files

- `src/game/rest.js`: empty-seat selection, floor clearance, and safe standing positions.
- `src/game/performer.js`, `rules.js`, `train.js`: responsive actions, directional falls, secured grips, fast defensive encounters.
- `src/render/rig.js`: imported and procedural character poses for resting, full falls, and attack motion.
- `src/render/subway3d.js`, `camera-space.js`: enclosed camera presets, mouse controls, lens avoidance, and surface wear.
- `src/render/interface.js`, `src/game/prompts.js`: new control mappings and contextual safety prompts.

Verification: 29 automated checks pass, including the actual exported Acrobat's hand contacts, rest occupancy, all four fall directions, continuous camera-relative movement, camera bounds, tutorial flow, and fast defense. Browser checks confirmed mouse drag/zoom, floor lying, enclosed side view, and a real timed lurch causing a fall and strike. The production build succeeds. Reactor remains disconnected.
