import * as fs from "fs";
import * as path from "path";
import type { TaxonomyRecord } from "./index.js";

function prettifyTaxonomy(taxonomy: string): string {
  return taxonomy
    .split(".")
    .slice(1)
    .join(" ")
    .replaceAll("_", " ");
}

function aliasesForTaxonomy(taxonomy: string): string[] {
  const common: Record<string, string[]> = {
    "ai.llm.chat": ["chatbot", "conversation", "copywriting", "text generation"],
    "ai.vision.image_generation": ["image gen", "text to image", "creative visuals"],
    "ai.video.generation": ["video gen", "clip generation", "text to video"],
    "ai.audio.tts": ["text to speech", "voiceover", "voice synthesis"],
    "ai.audio.stt": ["speech to text", "transcription", "audio transcript"],
    "ai.nlp.translation": ["translate", "localization", "multilingual conversion"],
    "tool.data.scraping": ["web scraping", "crawler", "extract website data"],
    "tool.data.search": ["web search", "search api", "retrieval"],
    "ai.code.completion": ["code generation", "coding assistant", "autocomplete"],
    "infra.database.postgres": ["postgres", "sql database", "relational db"],
    "tool.devops.deployment": ["deploy", "hosting", "ship release"],
  };
  return common[taxonomy] ?? [];
}

export function loadTaxonomyCatalogFromManifests(repoRoot: string): TaxonomyRecord[] {
  const manifestDir = path.join(repoRoot, "manifests");
  const files = fs.readdirSync(manifestDir).filter((f) => f.endsWith(".asm.json"));
  const set = new Set<string>();
  for (const file of files) {
    const fullPath = path.join(manifestDir, file);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const parsed = JSON.parse(raw) as { taxonomy?: string };
    if (parsed.taxonomy) set.add(parsed.taxonomy);
  }
  return Array.from(set)
    .sort()
    .map((taxonomy) => ({
      taxonomy,
      description: `Service category for ${prettifyTaxonomy(taxonomy)}`,
      aliases: aliasesForTaxonomy(taxonomy),
    }));
}
