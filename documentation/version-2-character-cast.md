# Version 2 character cast

The game now includes the eight supplied exports from this update:

- Music Enthusiast → standing passenger
- Weary Hospital Worker → seated passenger
- Gym Enthusiast → seated passenger
- Smartphone Gamer → seated passenger
- Bodega Food Lover → seated passenger (existing export retained; supplied file matches it)
- Midnight Clubber → standing passenger (existing export retained; supplied file matches it)
- Subway Orator → standing passenger
- Protective Pet Owner → seated passenger

The six new files are copied into `public/assets/characters` with stable web-safe names. The existing Bodega and Clubber files were byte-for-byte identical to the supplied downloads, so they were not duplicated.

Rush Hour now creates 16 active passengers plus its sleeper, enough to exercise the full 16-person passenger roster. Every GLB is loaded through the same loader used by the prior cast: textures are resized for runtime memory, skeletons are cloned per rider, and simulation translation remains separate from imported animation root motion. The rig inspection found 23 joints and the clips `Running`, `Walking`, and `Armature|clip0|baselayer` in each of the six new identities.

The cast assignment lives in `src/game/character-catalog.js`. The assets are loaded by `src/render/commuter.js`, and `tests/character-cast.test.js` checks that every new identity exists, has a corresponding file, and appears in the Rush Hour roster.
