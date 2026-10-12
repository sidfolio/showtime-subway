# Version 2 character cast

All eleven supplied models are integrated. Showtime Acrobat is the player. Sleep Master remains the sleeping passenger model. Other supplied models populate seated and standing passenger mixes; the earlier Rush Hour Commuter is retained too.

`src/game/character-catalog.js` defines local assets and deterministic passenger assignments. Rush Hour includes every passenger identity; quieter levels contain smaller subsets. Sleepers retain their appearance after waking. A dedicated aggressor model has not been supplied, so its existing placeholder remains.

`src/render/commuter.js` loads one GLB at a time and caches shared geometry/textures, while cloning skeletons for independent poses. Runtime texture copies are capped at 2048 pixels for passengers and 4096 for the performer. Original GLBs are intact. Large embedded image buffers and decoder bitmaps are released after preparation. The first complete cast load takes longer than subsequent runs.

All new files contain humanoid rigs and walking/running clips. Custom pole animations are not embedded; the existing game poses drive the Acrobat skeleton. `src/render/skinned-pose.js` measures real bone lengths, corrects torso reach, and solves the hands against train-space grip targets. Imported root motion cannot change simulation positions or bypass colliders.

Validation: 24 automated tests passed, including all cast roles in Rush Hour and grip accuracy on the actual exported Acrobat skeleton. Browser checks confirmed all twelve catalog assets loaded without errors, and hands stayed attached during pole orbit, two-pole somersault, and aerial spin. Production build passed.
