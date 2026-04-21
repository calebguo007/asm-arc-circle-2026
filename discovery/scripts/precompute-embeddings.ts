import * as path from "path";
import { fileURLToPath } from "url";
import { buildIndex, writeIndex } from "../src/index.js";
import { FakeHashEmbedder, OpenAIEmbedder } from "../src/embedders.js";
import { loadTaxonomyCatalogFromManifests } from "../src/taxonomy-catalog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const catalog = loadTaxonomyCatalogFromManifests(repoRoot);
  const openAiKey = process.env.OPENAI_API_KEY;

  const embedder = openAiKey
    ? new OpenAIEmbedder(openAiKey)
    : new FakeHashEmbedder(128);

  const index = await buildIndex(catalog, embedder);
  const outputPath = path.join(repoRoot, "discovery", "data", "taxonomy-index.json");
  writeIndex(outputPath, index);
  console.log(`Wrote taxonomy index: ${outputPath}`);
  console.log(`Taxonomies: ${index.taxonomies.length}, model: ${index.model}, dim: ${index.dimensions}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
