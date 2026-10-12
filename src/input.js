export const actions={held:new Set(),pressed:new Set()};
const keys=new Set(['w','a','s','d',' ','e','q','shift','j','k','l','f','g','h','p','escape','r','1','2','3','c','x','z','c','x','z']);
const aliases={arrowup:'w',arrowleft:'a',arrowdown:'s',arrowright:'d'};
const keyboardHeld=new Set();
const gameKey=key=>aliases[key]||key;
function down(key){if(!actions.held.has(key))actions.pressed.add(key);actions.held.add(key)}
window.addEventListener('keydown',e=>{const raw=e.key.toLowerCase(),k=gameKey(raw);if(e.target.closest('button')&&[' ','enter'].includes(k))return;if(keys.has(k)&&!['SELECT','INPUT'].includes(e.target.tagName)){e.preventDefault();keyboardHeld.add(raw);down(k)}});
window.addEventListener('keyup',e=>{const raw=e.key.toLowerCase(),k=gameKey(raw);keyboardHeld.delete(raw);if(![...keyboardHeld].some(key=>gameKey(key)===k))actions.held.delete(k)});
window.addEventListener('blur',()=>{keyboardHeld.clear();actions.held.clear();actions.pressed.clear()});
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);down(b.dataset.key)});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>actions.held.delete(b.dataset.key))});
export function clearPressed(){actions.pressed.clear()}
