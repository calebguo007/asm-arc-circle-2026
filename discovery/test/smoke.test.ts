import test from "node:test";
import assert from "node:assert/strict";
import * as path from "path";
import { fileURLToPath } from "url";
import { FakeHashEmbedder } from "../src/embedders.js";
import { buildIndex, discoverTaxonomy } from "../src/index.js";
import { loadTaxonomyCatalogFromManifests } from "../src/taxonomy-catalog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("discovery smoke test with FakeHashEmbedder", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const catalog = loadTaxonomyCatalogFromManifests(repoRoot);
  const embedder = new FakeHashEmbedder(128);

  const index = await buildIndex(catalog, embedder);
  assert.ok(index.taxonomies.length >= 15);

  const query = "translate app launch copy to japanese";
  const vector = await embedder.embed(query);
  const result = discoverTaxonomy(query, index, vector, { topK: 5, minConfidence: 0 });

  assert.ok(result.candidates.length > 0);
  assert.ok(typeof result.confidence === "number");
  assert.ok(result.candidates.every((c) => c.taxonomy.includes(".")));
});
