import * as path from "path";
import { fileURLToPath } from "url";
import { FakeHashEmbedder } from "../src/embedders.js";
import { discoverTaxonomy, readIndex } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const indexPath = path.join(repoRoot, "discovery", "data", "taxonomy-index.json");
  const index = readIndex(indexPath);
  const embedder = new FakeHashEmbedder(index.dimensions || 128);

  const tasks = [
    "I need to translate launch copy to Japanese and German.",
    "Generate a short product demo video with subtitle overlays.",
    "Scrape latest reddit posts about ADHD productivity tools.",
    "Find me a cheap postgres database for campaign metrics.",
  ];

  for (const task of tasks) {
    const vector = await embedder.embed(task);
    const result = discoverTaxonomy(task, index, vector);
    console.log(`Task: ${task}`);
    console.log(`  taxonomy=${result.taxonomy} confidence=${result.confidence.toFixed(3)}`);
    console.log(`  candidates=${result.candidates.map((c) => `${c.taxonomy}:${c.score.toFixed(3)}`).join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
