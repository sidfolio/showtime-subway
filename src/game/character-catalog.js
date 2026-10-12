// Stable identities: a rider never changes models when waking or boarding.
export const characterFiles={
 acrobat:'acrobat.glb',sleeper:'sleep-master.glb',commuter:'rush-hour-commuter.glb',
 'midnight-clubber':'midnight-clubber.glb','video-caller':'video-caller.glb',
 'neighborhood-elder':'neighborhood-elder.glb','observant-writer':'observant-writer.glb',
 'lost-tourist':'lost-tourist.glb','pole-leaner':'pole-leaner.glb',
 'beauty-expert':'beauty-expert.glb','underground-scholar':'underground-scholar.glb',
 'bodega-food-lover':'bodega-food-lover.glb',
 'music-enthusiast':'music-enthusiast.glb','hospital-worker':'hospital-worker.glb',
 'gym-enthusiast':'gym-enthusiast.glb','smartphone-gamer':'smartphone-gamer.glb',
 'subway-orator':'subway-orator.glb','protective-pet-owner':'protective-pet-owner.glb',
};
const seated=['neighborhood-elder','observant-writer','beauty-expert','underground-scholar','bodega-food-lover','commuter','video-caller','gym-enthusiast','smartphone-gamer','hospital-worker','protective-pet-owner'];
const standing=['pole-leaner','midnight-clubber','lost-tourist','music-enthusiast','subway-orator'];
// The aggressor is a real imported rider too. Keeping this identity stable
// prevents the procedural placeholder from appearing when the encounter starts.
export function passengerCharacter(n){if(n.id===999)return 'subway-orator';if(n.id<10)return 'sleeper';const list=n.seated?seated:standing;return list[(n.seated?n.id-10:n.id)%list.length];}
