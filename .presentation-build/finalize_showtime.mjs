import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const workspaceDir = "D:/NYU/Reactor project";
const skillDir = "C:/Users/Sid/.codex/plugins/cache/openai-primary-runtime/presentations/26.1007.11041/skills/presentations";
const runtimePython = "C:/Users/Sid/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";
const candidatePath = path.join(workspaceDir, ".presentation-build", "showtime-exhibition-candidate.pptx");
const finalPath = path.join(workspaceDir, "presentation", "Showtime_Subway_Performer_Exhibition_Deck.pptx");
const stagingDir = path.join(workspaceDir, ".codex-finalizer");
const { finalizePresentation } = await import(pathToFileURL(path.join(skillDir, "container_tools", "artifact_tool_utils.mjs")).href);
await fs.mkdir(stagingDir, { recursive: true });
await fs.mkdir(path.dirname(finalPath), { recursive: true });

const result = await finalizePresentation({
  explicitTotalSlideCount: 14,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  workspaceDir,
  candidatePath,
  finalPath,
  pythonExecutable: runtimePython,
  integrityValidatorPath: path.join(skillDir, "container_tools", "inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(skillDir, "container_tools", "inspect_presentation_layout_geometry.py"),
  layoutArgs: [
    "--expected-slide-size-emu", "12192000,6858000",
    "--validate-bullet-geometry",
    "--validate-heading-fit",
  ],
  fontPolicy: { basis: "design", families: ["Aptos"] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, `${path.basename(finalPath)}.validation.json`),
});
console.log(JSON.stringify(result, null, 2));
