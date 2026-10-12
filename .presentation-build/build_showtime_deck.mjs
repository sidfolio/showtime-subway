import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "file:///C:/Users/Sid/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const ROOT = "D:/NYU/Reactor project";
const BUILD = path.join(ROOT, ".presentation-build");
const PREVIEWS = path.join(BUILD, "previews");
const OUT = path.join(ROOT, "presentation");
const C = {
  ink: "#11171B",
  panel: "#20272B",
  panel2: "#30383D",
  cream: "#F1EEE3",
  muted: "#A8B1B5",
  green: "#C9FF3D",
  orange: "#F0A51A",
  red: "#E63838",
  blue: "#5D8EA0",
  white: "#FFFFFF",
};
const FONT = "Arial";
const W = 1280;
const H = 720;

async function bytes(file) {
  const b = await fs.readFile(file);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

function text(slide, value, left, top, width, height, size, color = C.cream, opts = {}) {
  const box = slide.shapes.add({
    geometry: "textbox",
    name: opts.name,
    position: { left, top, width, height },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  box.text = value;
  box.text.style = {
    fontFamily: FONT,
    fontSize: size,
    color,
    bold: Boolean(opts.bold),
    italic: Boolean(opts.italic),
    alignment: opts.align || "left",
  };
  return box;
}

function rect(slide, left, top, width, height, fill, opts = {}) {
  return slide.shapes.add({
    geometry: opts.geometry || "rect",
    name: opts.name,
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill: opts.line || fill, width: opts.lineWidth ?? 0 },
    borderRadius: opts.radius,
  });
}

function line(slide, x1, y1, x2, y2, color = C.muted, width = 2) {
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const extentW = Math.max(Math.abs(x2 - x1), 1);
  const extentH = Math.max(Math.abs(y2 - y1), 1);
  const s = slide.shapes.add({
    geometry: "line",
    position: { left, top, width: extentW, height: extentH },
    fill: "none",
    line: { style: "solid", fill: color, width },
  });
  return s;
}

async function image(slide, file, left, top, width, height, opts = {}) {
  const ext = path.extname(file).toLowerCase();
  const contentType = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : ext === ".webp" ? "image/webp" : "image/png";
  return slide.images.add({
    blob: await bytes(file),
    contentType,
    alt: opts.alt || path.basename(file),
    fit: opts.fit || "cover",
    position: { left, top, width, height },
    geometry: opts.geometry,
    borderRadius: opts.radius,
  });
}

function base(slide, title, kicker, number) {
  slide.background.fill = C.ink;
  rect(slide, 0, 0, 7, H, C.green);
  text(slide, kicker.toUpperCase(), 54, 36, 400, 20, 13, C.green, { bold: true });
  text(slide, title, 54, 62, 900, 54, 33, C.cream, { bold: true });
  line(slide, 54, 128, 1226, 128, C.panel2, 1);
  text(slide, `SHOWTIME / SUBWAY PERFORMER     ${String(number).padStart(2, "0")}`, 54, 688, 600, 16, 11, C.muted, { bold: true });
}

function note(slide, value) {
  text(slide, value, 54, 654, 1170, 18, 11, C.muted, { italic: true });
}

function bulletList(slide, items, left, top, width, size = 20, gap = 39, color = C.cream) {
  items.forEach((item, i) => {
    rect(slide, left, top + i * gap + 8, 8, 8, i === 0 ? C.green : C.orange, { geometry: "ellipse" });
    text(slide, item, left + 22, top + i * gap, width - 22, gap - 4, size, color);
  });
}

async function main() {
  await fs.mkdir(PREVIEWS, { recursive: true });
  await fs.mkdir(OUT, { recursive: true });
  const p = Presentation.create({ slideSize: { width: W, height: H } });

  // 1 — Cover
  {
    const s = p.slides.add();
    await image(s, path.join(ROOT, "preview-3d.png"), 0, 0, W, H, { alt: "3D subway performer prototype" });
    rect(s, 0, 0, 760, H, C.ink);
    rect(s, 54, 70, 9, 220, C.green);
    text(s, "SHOWTIME", 92, 78, 900, 76, 62, C.cream, { bold: true });
    text(s, "SUBWAY PERFORMER", 96, 166, 900, 48, 34, C.green, { bold: true });
    text(s, "A playable NYC subway performance game", 96, 242, 700, 38, 23, C.cream);
    text(s, "Process documentation / Version 2", 96, 320, 600, 24, 15, C.muted, { bold: true });
    text(s, "A local 3D game with an optional real-time visual enhancement layer", 96, 592, 760, 28, 17, C.cream);
    text(s, "OCTOBER 2026", 96, 650, 260, 18, 12, C.green, { bold: true });
  }

  // 2 — Premise
  {
    const s = p.slides.add(); base(s, "A performance game inside a moving NYC subway car", "The premise", 2);
    text(s, "The player is a street performer working a crowded car. Every move earns attention, but every mistake costs safety.", 54, 170, 510, 96, 27, C.cream, { bold: true });
    bulletList(s, ["Move through a live crowd", "Use poles for fast tricks", "Read turbulence before it hits", "Earn tips without hitting passengers"], 58, 318, 480, 21, 48);
    rect(s, 650, 164, 564, 402, C.panel2, { geometry: "roundRect", radius: "rounded-xl" });
    await image(s, path.join(ROOT, "preview-updated-car.png"), 660, 174, 544, 382, { alt: "Playable 3D subway interior", geometry: "roundRect", radius: "rounded-lg" });
    note(s, "The prototype keeps play readable first: the car, the crowd, and the rules stay visible during performance.");
  }

  // 3 — Design target
  {
    const s = p.slides.add(); base(s, "The target moved from flat action to a physical space", "Design target", 3);
    rect(s, 54, 164, 548, 380, C.panel2, { geometry: "roundRect", radius: "rounded-lg" });
    await image(s, path.join(ROOT, "preview.png"), 64, 174, 528, 320, { alt: "Early subway performer prototype", geometry: "roundRect", radius: "rounded-lg" });
    text(s, "EARLY PLAYABLE DRAFT", 78, 510, 420, 20, 13, C.orange, { bold: true });
    text(s, "Strong game loop, limited spatial depth", 78, 532, 460, 24, 18, C.cream);
    rect(s, 672, 164, 548, 380, C.panel2, { geometry: "roundRect", radius: "rounded-lg" });
    await image(s, path.join(ROOT, "preview-updated-car.png"), 682, 174, 528, 320, { alt: "Version 2 subway interior", geometry: "roundRect", radius: "rounded-lg" });
    text(s, "VERSION 2 DIRECTION", 696, 510, 420, 20, 13, C.green, { bold: true });
    text(s, "Enclosed train, solid obstacles, articulated riders", 696, 532, 470, 24, 18, C.cream);
    note(s, "The visual ambition grew from a playable canvas into a contained 3D world with readable physical rules.");
  }

  // 4 — Process timeline
  {
    const s = p.slides.add(); base(s, "The project grew through short, testable passes", "Build process", 4);
    text(s, "Each pass answered one practical question before the next layer was added.", 54, 164, 800, 34, 23, C.cream, { bold: true });
    const steps = [
      ["01", "IDEA", "Performer fantasy and subway rules"],
      ["02", "REFERENCES", "NYC interiors, movement, crowd behavior"],
      ["03", "MESHY", "Rigged GLB commuter identities"],
      ["04", "SIMULATION", "Collision, balance, tricks, stations"],
      ["05", "FIGMA", "HUD, menus, prompts, tutorial"],
      ["06", "REACTOR", "Optional live visual enhancement"],
    ];
    line(s, 112, 340, 1152, 340, C.panel2, 4);
    steps.forEach(([n, head, body], i) => {
      const x = 76 + i * 205;
      rect(s, x, 306, 68, 68, i === 5 ? C.green : C.panel2, { geometry: "ellipse", line: C.muted, lineWidth: 1 });
      text(s, n, x, 325, 68, 22, 18, i === 5 ? C.ink : C.green, { bold: true, align: "center" });
      text(s, head, x - 18, 414, 104, 22, 14, C.green, { bold: true, align: "center" });
      text(s, body, x - 33, 448, 134, 76, 15, C.cream, { align: "center" });
    });
    note(s, "The working rule was simple: keep the game playable without Reactor, then add visual ambition around a stable simulation.");
  }

  // 5 — Game loop
  {
    const s = p.slides.add(); base(s, "The game loop turns attention into movement", "Game loop", 5);
    text(s, "The player constantly chooses between performance and safe positioning.", 54, 164, 800, 34, 23, C.cream, { bold: true });
    const items = [
      ["MOVE", "Find a clear pocket", C.blue],
      ["GRIP", "Attach to a rod", C.orange],
      ["PERFORM", "Spin, flip, dance", C.green],
      ["RECOVER", "Read the crowd and shake", C.red],
      ["EARN", "Bank tips and combo", C.orange],
    ];
    items.forEach(([head, body, color], i) => {
      const x = 58 + i * 236;
      rect(s, x, 270, 190, 190, C.panel2, { geometry: "roundRect", radius: "rounded-lg", line: color, lineWidth: 3 });
      rect(s, x + 18, 292, 48, 8, color);
      text(s, head, x + 18, 322, 154, 28, 22, color, { bold: true });
      text(s, body, x + 18, 374, 150, 56, 18, C.cream);
      if (i < items.length - 1) text(s, "+", x + 198, 345, 36, 36, 28, C.muted, { bold: true, align: "center" });
    });
    note(s, "Tips are the visible reward. Strikes, noise, balance, and clearance create the pressure underneath.");
  }

  // 6 — Train
  {
    const s = p.slides.add(); base(s, "The train is a playable object, not a backdrop", "World building", 6);
    await image(s, path.join(ROOT, "preview-updated-car.png"), 54, 164, 720, 414, { alt: "3D subway car with windows, seats, poles, and passengers", geometry: "roundRect", radius: "rounded-lg" });
    const callouts = [
      ["WINDOWS", "Openings show tunnel motion", 824, 190, C.blue],
      ["POLES", "Reachable contact points", 824, 280, C.orange],
      ["BENCHES", "Seats and lie-down surfaces", 824, 370, C.green],
      ["LIGHT", "Side fluorescent strips", 824, 460, C.cream],
    ];
    callouts.forEach(([head, body, x, y, color]) => {
      rect(s, x, y + 6, 9, 42, color);
      text(s, head, x + 24, y, 300, 24, 16, color, { bold: true });
      text(s, body, x + 24, y + 28, 320, 24, 17, C.cream);
    });
    note(s, "The renderer uses a 1280 × 832 gameplay target while the browser scales the canvas and interface to the viewport.");
  }

  // 7 — Characters
  {
    const s = p.slides.add(); base(s, "Characters begin as roles, then become riders", "Character pipeline", 7);
    await image(s, path.join(ROOT, "documentation", "version-2-expanded-character-cast.png"), 54, 164, 570, 414, { alt: "Expanded Meshy character cast", geometry: "roundRect", radius: "rounded-lg" });
    text(s, "MESHY AI → GLB → RIGGED RUNTIME ACTOR", 676, 180, 500, 24, 15, C.green, { bold: true });
    text(s, "18 stable identities", 676, 226, 450, 44, 34, C.cream, { bold: true });
    bulletList(s, ["Showtime Acrobat as the player", "Sleep Master for resting passengers", "Seated, standing, commuter, and role-specific riders", "Independent skeletons for every actor"], 678, 310, 500, 18, 47);
    text(s, "Meshy supplies the base humanoid rigs. The game adds procedural poses for contact, rests, flips, falls, and pole work.", 676, 514, 500, 60, 17, C.muted);
    note(s, "The source GLBs remain intact; runtime copies use stable web-safe names and shared loading code.");
  }

  // 8 — Movement/contact
  {
    const s = p.slides.add(); base(s, "Movement is built around contact and consequence", "Simulation", 8);
    await image(s, path.join(ROOT, "documentation", "version-2-turbulence-fall.png"), 54, 164, 650, 414, { alt: "Performer falling during train turbulence", geometry: "roundRect", radius: "rounded-lg" });
    text(s, "A train lurch is a test of preparation.", 760, 178, 450, 48, 28, C.cream, { bold: true });
    bulletList(s, ["Unsecured grip → directional fall", "Q beside a reachable rod → brace", "Crowd and poles stop movement", "Clearance is checked through the stunt"], 762, 286, 440, 19, 50);
    text(s, "The simulation owns the timing, collision, balance, score, and strike. Rendering follows the result.", 762, 520, 440, 54, 17, C.muted);
    note(s, "The visual goal is fast action that still reads clearly: hands, poles, bodies, and consequences remain legible.");
  }

  // 9 — UI
  {
    const s = p.slides.add(); base(s, "The interface came from Figma, then became live state", "UI workflow", 9);
    await image(s, path.join(ROOT, "documentation", "figma-ui", "thumbnail.png"), 54, 164, 548, 414, { alt: "Figma UI reference contact sheet", geometry: "roundRect", radius: "rounded-lg" });
    text(s, "DESIGN SOURCE", 658, 180, 260, 20, 14, C.orange, { bold: true });
    text(s, "Game UI.fig", 658, 214, 420, 38, 30, C.cream, { bold: true });
    bulletList(s, ["HUD and cumulative tips", "Pause and mode selection", "Tutorial and action prompts", "Turbulence and line warnings", "Expanded controls and rewards"], 660, 300, 470, 18, 41);
    text(s, "SVG surfaces and the Koulen display type were brought into the browser as editable HTML/CSS, while values stay connected to the simulation.", 660, 526, 490, 48, 17, C.muted);
    note(s, "The Figma file defines the visual language; the game state defines what the UI is allowed to say.");
  }

  // 10 — Architecture
  {
    const s = p.slides.add(); base(s, "A simple architecture keeps the experiment changeable", "Implementation", 10);
    text(s, "One state object drives the rules. Rendering stays downstream.", 54, 164, 800, 34, 23, C.cream, { bold: true });
    const nodes = [
      ["INPUT", 64, 278, 174, 76, C.blue],
      ["GAME STATE", 304, 278, 194, 76, C.orange],
      ["RULES", 566, 278, 174, 76, C.red],
      ["RENDER", 808, 220, 174, 76, C.green],
      ["HUD / UI", 808, 342, 174, 76, C.cream],
      ["REACTOR", 1048, 278, 174, 76, C.green],
    ];
    nodes.forEach(([label,x,y,w,h,color])=>{rect(s,x,y,w,h,C.panel2,{geometry:"roundRect",radius:"rounded-lg",line:color,lineWidth:2});text(s,label,x,y+25,w,26,18,color,{bold:true,align:"center"});});
    line(s, 238, 316, 304, 316, C.muted, 3);line(s, 498, 316, 566, 316, C.muted, 3);line(s, 740, 316, 808, 258, C.muted, 3);line(s, 740, 316, 808, 380, C.muted, 3);line(s, 982, 258, 1048, 316, C.muted, 3);
    text(s, "The same simulation can render locally, record to MP4, or feed the optional visual model.", 54, 500, 1100, 32, 19, C.muted);
    note(s, "The separation makes the offline game dependable and keeps Reactor from owning the player’s physics.");
  }

  // 11 — Reactor
  {
    const s = p.slides.add(); base(s, "Reactor adds a visual pass after the game is already working", "Reactor direction", 11);
    text(s, "LOCAL 3D RENDER", 54, 186, 250, 24, 15, C.blue, { bold: true });
    rect(s, 54, 226, 282, 116, C.panel2, { geometry: "roundRect", radius: "rounded-lg", line: C.blue, lineWidth: 2 });
    text(s, "Canvas captureStream(24)", 74, 270, 242, 28, 20, C.cream, { bold: true, align: "center" });
    text(s, "geometry + gameplay truth", 74, 304, 242, 20, 14, C.muted, { align: "center" });
    text(s, "+", 358, 260, 40, 38, 30, C.muted, { bold: true, align: "center" });
    rect(s, 414, 226, 300, 116, C.panel2, { geometry: "roundRect", radius: "rounded-lg", line: C.green, lineWidth: 2 });
    text(s, "X2 model + NYC prompt", 434, 270, 260, 28, 20, C.green, { bold: true, align: "center" });
    text(s, "materials + lighting + realism", 434, 304, 260, 20, 14, C.muted, { align: "center" });
    text(s, "=", 736, 260, 40, 38, 30, C.muted, { bold: true, align: "center" });
    rect(s, 792, 226, 420, 116, C.panel2, { geometry: "roundRect", radius: "rounded-lg", line: C.orange, lineWidth: 2 });
    text(s, "Returned main_video", 812, 270, 380, 28, 20, C.orange, { bold: true, align: "center" });
    text(s, "optional enhanced exhibition view", 812, 304, 380, 20, 14, C.muted, { align: "center" });
    text(s, "Prompt direction", 54, 414, 240, 22, 16, C.green, { bold: true });
    text(s, "Consistent stainless-steel NYC subway car, curved orange benches, dark speckled floor, side fluorescent lights, dim aisle, worn ads, grime, fingerprints, graffiti, tunnel motion. Preserve framing, poles, players, passengers, and gameplay actions.", 54, 448, 760, 84, 19, C.cream);
    text(s, "STATUS", 926, 414, 120, 22, 16, C.orange, { bold: true });
    text(s, "Wired in the local app. Stable LIVE verification remains the next technical gate.", 926, 448, 286, 74, 18, C.muted);
    note(s, "Reactor can repaint the frames. It should not decide whether a player collides, grips, falls, scores, or wins.");
  }

  // 12 — Evidence
  {
    const s = p.slides.add(); base(s, "The prototype is documented as a playable system", "Evidence", 12);
    const metrics = [
      ["30", "automated checks passing", C.green],
      ["18", "stable character identities", C.orange],
      ["3", "contained camera views", C.blue],
      ["10", "watch-only tutorial scenes", C.red],
      ["1280 × 832", "gameplay render target", C.cream],
    ];
    metrics.forEach(([value,label,color],i)=>{const x=54+i*236;rect(s,x,184,206,130,C.panel2,{geometry:"roundRect",radius:"rounded-lg",line:color,lineWidth:2});text(s,value,x+18,208,170,42,32,color,{bold:true,align:"center"});text(s,label,x+18,264,170,34,15,C.cream,{align:"center"});});
    await image(s, path.join(ROOT, "documentation", "Showtime-Version-1-Contact-Sheet.png"), 54, 370, 560, 220, { alt: "Version 1 walkthrough contact sheet", geometry: "roundRect", radius: "rounded-lg" });
    await image(s, path.join(ROOT, "documentation", "version-2-character-cast.png"), 640, 370, 280, 220, { alt: "Version 2 character cast evidence", geometry: "roundRect", radius: "rounded-lg" });
    await image(s, path.join(ROOT, "documentation", "commuter-integrated.png"), 944, 370, 280, 220, { alt: "Integrated commuter evidence", geometry: "roundRect", radius: "rounded-lg" });
    note(s, "Evidence includes gameplay videos, contact sheets, browser captures, character loading checks, and automated regression tests.");
  }

  // 13 — Roadmap
  {
    const s = p.slides.add(); base(s, "The next milestone is visual consistency under pressure", "Next version", 13);
    const rows = [
      ["NOW", "Stabilize local 3D game", "Responsive layout, character loading, camera framing, fast actions", C.green],
      ["NEXT", "Verify Reactor in a controlled scene", "Token, SDK, source publishing, prompt acceptance, returned video", C.orange],
      ["THEN", "Add reference conditioning", "One subway interior image before a session begins", C.blue],
      ["TEST", "Stress the risky actions", "Pole grip, flips, turbulence falls, dense crowds", C.red],
      ["DELIVER", "Package the exhibition build", "Clean walkthrough, source, documentation, and MP4 evidence", C.cream],
    ];
    rows.forEach(([tag,head,body,color],i)=>{const y=172+i*91;rect(s,54,y,86,46,color,{geometry:"roundRect",radius:"rounded-lg"});text(s,tag,54,y+14,86,18,13,C.ink,{bold:true,align:"center"});text(s,head,176,y+3,380,24,20,C.cream,{bold:true});text(s,body,176,y+31,780,20,16,C.muted);line(s,1110,y+23,1194,y+23,color,4);});
    note(s, "The exhibition version should show a reliable local game first, then make the Reactor pass visible as an enhancement rather than a dependency.");
  }

  // 14 — Handoff
  {
    const s = p.slides.add();
    s.background.fill = C.ink;
    rect(s, 0, 0, 7, H, C.green);
    text(s, "SHOWTIME", 54, 72, 500, 64, 52, C.cream, { bold: true });
    text(s, "SUBWAY PERFORMER", 54, 138, 520, 40, 28, C.green, { bold: true });
    text(s, "An exhibition-ready prototype about movement, attention, and shared space.", 54, 230, 600, 56, 28, C.cream, { bold: true });
    text(s, "DELIVERY PACKAGE", 54, 366, 300, 20, 14, C.orange, { bold: true });
    bulletList(s, ["Playable Vite project", "Meshy GLB character cast", "Figma-derived interface", "Automated gameplay tests", "Walkthrough videos and screenshots", "Living project documentation"], 58, 410, 520, 18, 38);
    rect(s, 742, 112, 430, 430, C.panel2, { geometry: "roundRect", radius: "rounded-lg" });
    await image(s, path.join(ROOT, "preview-updated-car.png"), 758, 128, 398, 280, { alt: "Showtime subway performer final prototype", geometry: "roundRect", radius: "rounded-lg" });
    text(s, "BUILD THE WORLD FIRST.\nTHEN LET THE VISUAL LAYER PUSH IT FURTHER.", 778, 438, 360, 62, 20, C.green, { bold: true, align: "center" });
    text(s, "Version 2 process documentation / 2026", 54, 674, 500, 18, 12, C.muted);
  }

  for (const [i, slide] of p.slides.items.entries()) {
    const png = await p.export({ slide, format: "png", scale: 1 });
    await fs.writeFile(path.join(PREVIEWS, `slide-${String(i + 1).padStart(2, "0")}.png`), new Uint8Array(await png.arrayBuffer()));
  }

  const candidate = path.join(BUILD, "showtime-exhibition-candidate.pptx");
  const pptx = await PresentationFile.exportPptx(p);
  await pptx.save(candidate);
  console.log(JSON.stringify({ candidate, slides: p.slides.items.length }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
