import fs from 'node:fs/promises';
const dir='public/assets/ui';await fs.mkdir(dir,{recursive:true});
const assets=JSON.parse(await fs.readFile('documentation/figma-ui/assets.json','utf8'));
const done=new Set();for(const a of Object.values(assets)){if(done.has(a.file))continue;done.add(a.file);const r=await fetch(a.url);if(!r.ok)throw new Error(`${a.file}: ${r.status}`);await fs.writeFile(`${dir}/${a.file}`,Buffer.from(await r.arrayBuffer()));}
const css=await (await fetch('https://fonts.googleapis.com/css2?family=Koulen&display=swap')).text();
const url=css.match(/url\(([^)]+)\)/)?.[1];if(!url)throw new Error('Koulen font unavailable');const r=await fetch(url);if(!r.ok)throw new Error('Font download failed');await fs.writeFile(`${dir}/koulen.ttf`,Buffer.from(await r.arrayBuffer()));
console.log(`Saved ${done.size} Figma assets and Koulen font.`);

