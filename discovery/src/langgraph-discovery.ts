import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
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
  rerankedTaxonomy: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  rerankReasoning: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
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

async function llmRerankCandidates(
  task: string,
  candidates: Array<{ taxonomy: string; score: number }>,
): Promise<{ taxonomy: string | null; reasoning: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || candidates.length === 0) {
    return { taxonomy: null, reasoning: "LLM rerank skipped (missing OPENAI_API_KEY)." };
  }
  const defaultModel = process.env.OPENAI_BASE_URL?.includes("openrouter.ai")
    ? "openrouter/auto"
    : "gpt-4o-mini";
  const model = new ChatOpenAI({
    apiKey,
    model: process.env.OPENAI_CHAT_MODEL || defaultModel,
    configuration: process.env.OPENAI_BASE_URL
      ? { baseURL: process.env.OPENAI_BASE_URL }
      : undefined,
    temperature: 0,
  });
  const prompt = [
    "You are ranking ASM taxonomy candidates for a user task.",
    "Return strict JSON only: {\"taxonomy\": string, \"reasoning\": string}.",
    `Task: ${task}`,
    `Candidates: ${candidates.map((c) => `${c.taxonomy} (similarity=${c.score.toFixed(4)})`).join(", ")}`,
    "Pick exactly one taxonomy from Candidates.",
  ].join("\n");
  const response = await model.invoke(prompt);
  const text = typeof response.content === "string"
    ? response.content
    : Array.isArray(response.content)
      ? response.content.map((p: any) => (typeof p === "string" ? p : p?.text ?? "")).join("")
      : "";
  try {
    const jsonLike = text.includes("{")
      ? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)
      : text;
    const parsed = JSON.parse(jsonLike) as { taxonomy?: string; reasoning?: string };
    if (parsed.taxonomy && candidates.some((c) => c.taxonomy === parsed.taxonomy)) {
      return {
        taxonomy: parsed.taxonomy,
        reasoning: parsed.reasoning ?? "LLM rerank selected taxonomy.",
      };
    }
  } catch {
    // Ignore malformed JSON; fallback below.
  }
  const heuristic = candidates[0]?.taxonomy ?? null;
  return {
    taxonomy: heuristic,
    reasoning: "LLM rerank returned invalid output; fallback to top similarity candidate.",
  };
}

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
    .addNode("rerankCandidates", async (state) => {
      const reranked = await llmRerankCandidates(state.task, state.candidates);
      return {
        rerankedTaxonomy: reranked.taxonomy,
        rerankReasoning: reranked.reasoning,
      };
    })
    .addNode("selectWinner", async (state) => {
      const reranked = state.rerankedTaxonomy
        ? state.candidates.find((c) => c.taxonomy === state.rerankedTaxonomy)
        : null;
      const best = reranked ?? state.candidates[0];
      if (!best || best.score < minConfidence) {
        return {
          taxonomy: null,
          confidence: best?.score ?? 0,
          reasoning: `LangGraph: low confidence for "${state.task}". ${state.rerankReasoning}`.trim(),
        };
      }
      return {
        taxonomy: best.taxonomy,
        confidence: best.score,
        reasoning: `LangGraph: selected ${best.taxonomy} for "${state.task}" (${best.score.toFixed(3)}). ${state.rerankReasoning}`.trim(),
      };
    })
    .addEdge(START, "embedTask")
    .addEdge("embedTask", "retrieveCandidates")
    .addEdge("retrieveCandidates", "rerankCandidates")
    .addEdge("rerankCandidates", "selectWinner")
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
