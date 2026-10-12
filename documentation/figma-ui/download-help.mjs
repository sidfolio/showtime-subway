import fs from 'node:fs/promises';
const r=await fetch('https://www.figma.com/api/mcp/asset/62671daa-c7a6-40d7-82ce-830b04134b3d/b57cb.svg');if(!r.ok)throw new Error(String(r.status));await fs.writeFile('public/assets/ui/b57cb.svg',Buffer.from(await r.arrayBuffer()));
