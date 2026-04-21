import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import type { DiscoveryIndex, DiscoveryResult, Embedder } from "./index.js";

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

const DiscoveryState = Annotation.Root({
  task: Annotation<string>(),
  taskEmbedding: Annotation<number[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  candidates: Annotation<Array<{ taxonomy: string; score: number }>>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  taxonomy: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  confidence: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),
  reasoning: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
});

export async function discoverTaxonomyWithLangGraph(
  task: string,
  index: DiscoveryIndex,
  embedder: Embedder,
  opts: { topK?: number; minConfidence?: number } = {},
): Promise<DiscoveryResult> {
  const topK = opts.topK ?? 5;
  const minConfidence = opts.minConfidence ?? 0.3;

  const graph = new StateGraph(DiscoveryState)
    .addNode("embedTask", async (state) => {
      const taskEmbedding = await embedder.embed(state.task);
      return { taskEmbedding };
    })
    .addNode("retrieveCandidates", async (state) => {
      const candidates = index.taxonomies
        .map((t) => ({
          taxonomy: t.taxonomy,
          score: Number(cosineSimilarity(state.taskEmbedding, t.embedding).toFixed(4)),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
      return { candidates };
    })
    .addNode("selectWinner", async (state) => {
      const best = state.candidates[0];
      if (!best || best.score < minConfidence) {
        return {
          taxonomy: null,
          confidence: best?.score ?? 0,
          reasoning: `LangGraph: low confidence for "${state.task}"`,
        };
      }
      return {
        taxonomy: best.taxonomy,
        confidence: best.score,
        reasoning: `LangGraph: selected ${best.taxonomy} for "${state.task}" (${best.score.toFixed(3)})`,
      };
    })
    .addEdge(START, "embedTask")
    .addEdge("embedTask", "retrieveCandidates")
    .addEdge("retrieveCandidates", "selectWinner")
    .addEdge("selectWinner", END)
    .compile();

  const result = await graph.invoke({ task });
  return {
    taxonomy: result.taxonomy,
    confidence: result.confidence,
    candidates: result.candidates,
    reasoning: result.reasoning,
  };
}
