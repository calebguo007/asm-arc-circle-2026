# SEP: Service Value Annotations for MCP ToolAnnotations

> **Status**: Draft
> **Author**: Yi Guo (Caleb)
> **Created**: 2026-04-07
> **Target**: MCP Specification 2026.x
> **Repository**: https://github.com/asm-protocol/asm-spec

---

## Abstract

This Specification Enhancement Proposal (SEP) introduces **Service Value Annotations** — a standardized set of metadata fields for MCP `ToolAnnotations` that enable agents to evaluate the economic value of tools and services. The proposal adds structured pricing, quality, SLA, and trust information to MCP tool definitions, allowing agents to make autonomous, preference-aware service selection decisions without leaving the MCP protocol boundary.

---

## 1. Motivation

### 1.1 The Problem

MCP currently describes **what a tool can do** (capabilities, parameters, return types) but not **what a tool is worth** (cost, quality, latency, reliability). When an agent discovers multiple tools that can fulfill the same task — for example, three image generation tools — it has no structured data to choose between them.

The MCP 2026 Roadmap [1] prioritizes transport evolution, agentic communication, governance maturity, and enterprise readiness, but contains **no mention of pricing, marketplace, or service economics**. This leaves a critical gap: agents must either make blind selections or rely on unstructured information (web scraping, hardcoded preferences) to evaluate service value.

### 1.2 Real-World Impact

Consider an agent workflow that requires:
- An LLM call (3 candidates: $3/M tokens, $2.50/M tokens, $1.25/M tokens)
- An image generation (3 candidates: $0.04/image, $0.04/image, $0.03/image)
- A TTS call (2 candidates: $0.30/1K chars, $15/1M chars)

Without structured value data, the agent cannot optimize this pipeline. Blind selection can result in **3–10× cost overrun** compared to preference-aware selection, as demonstrated in our evaluation with 14 real-world services [2].

### 1.3 Existing Precedent

- **AWS Marketplace MCP Server** [3]: Amazon has released an MCP server for agent-driven product discovery and comparison within AWS Marketplace, validating the demand for agent-automated service evaluation — but as a closed, platform-locked solution.
- **MCP ToolAnnotations**: The existing `ToolAnnotations` type already supports metadata hints (`readOnlyHint`, `destructiveHint`, `openWorldHint`). Service value annotations follow the same pattern.
- **Agent Service Manifest (ASM)** [2]: An open protocol with 14 real-world manifests, a scoring engine, and an MCP server implementation, demonstrating feasibility.

---

## 2. Proposal

### 2.1 Overview

Add an optional `x-asm` field to `ToolAnnotations` containing structured service value metadata. This follows MCP's existing extensibility pattern and requires **zero breaking changes**.

### 2.2 Schema Addition

```typescript
interface ToolAnnotations {
  // Existing fields
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;

  // Proposed addition
  "x-asm"?: ServiceValueAnnotation;
}

interface ServiceValueAnnotation {
  /** Globally unique service identifier */
  service_id: string;

  /** Standardized service category (e.g., "ai.llm.chat") */
  taxonomy: string;

  /** Pricing information */
  pricing?: {
    billing_dimensions: Array<{
      dimension: "input_token" | "output_token" | "token" | "character" |
                 "word" | "image" | "pixel" | "second" | "minute" |
                 "request" | "gpu_second" | "byte" | "query" | "custom";
      unit: "per_1" | "per_1K" | "per_1M";
      cost_per_unit: number;
      currency?: string;  // ISO 4217, default "USD"
    }>;
    estimated?: boolean;
  };

  /** Quality metrics */
  quality?: {
    metrics: Array<{
      name: string;
      score: number;
      scale?: string;
      self_reported?: boolean;
    }>;
  };

  /** Service Level Agreement */
  sla?: {
    latency_p50?: string;
    uptime?: number;
  };

  /** Trust verification */
  verification?: {
    receipt_endpoint?: string;
    protocol?: "signed-receipts-acta" | "w3c-vc" | "custom";
  };
}
```

### 2.3 Example

```json
{
  "name": "generate_image",
  "description": "Generate an image from a text prompt",
  "inputSchema": {
    "type": "object",
    "properties": {
      "prompt": { "type": "string" }
    }
  },
  "annotations": {
    "title": "FLUX 1.1 Pro Image Generation",
    "readOnlyHint": true,
    "openWorldHint": true,
    "x-asm": {
      "service_id": "bfl/flux-1.1-pro@1.1",
      "taxonomy": "ai.vision.image_generation",
      "pricing": {
        "billing_dimensions": [
          {
            "dimension": "image",
            "unit": "per_1",
            "cost_per_unit": 0.04,
            "currency": "USD"
          }
        ]
      },
      "quality": {
        "metrics": [
          {
            "name": "FID",
            "score": 5.2,
            "scale": "lower_is_better",
            "self_reported": false
          }
        ]
      },
      "sla": {
        "latency_p50": "3s",
        "uptime": 0.995
      }
    }
  }
}
```

### 2.4 Taxonomy

A hierarchical, prefix-queryable classification system:

```
ai.llm.chat                     ai.audio.tts
ai.llm.completion                ai.audio.stt
ai.llm.embedding                 ai.audio.music
ai.vision.image_generation       ai.code.generation
ai.vision.image_editing          ai.data.extraction
ai.vision.ocr                    ai.data.search
ai.video.generation              infra.compute.gpu
ai.video.subtitle                infra.storage.object
ai.video.editing                 infra.storage.vector
```

Pattern: `^[a-z]+\.[a-z_]+(?:\.[a-z_]+)?$`

---

## 3. Design Decisions

### 3.1 Why `x-asm` in ToolAnnotations?

**Alternative A: Separate MCP resource type.** Rejected because it requires agents to make additional resource queries and doesn't co-locate value data with tool definitions.

**Alternative B: New top-level MCP field.** Rejected because it requires core specification changes and breaks backward compatibility.

**Alternative C: `x-asm` in ToolAnnotations (chosen).** Leverages existing extensibility, co-locates value data with tool definitions, requires zero spec changes, and follows the established `x-` prefix convention for extensions.

### 3.2 Why Structured Pricing Instead of Free-Text?

Free-text pricing (e.g., `"$3 per million input tokens"`) requires LLM parsing, which is:
- **Non-deterministic**: Different models parse differently
- **Expensive**: Parsing 100 pricing strings costs thousands of tokens
- **Error-prone**: Edge cases (tiered pricing, conditional pricing) are frequently misinterpreted

Structured billing dimensions eliminate all three problems.

### 3.3 Why `self_reported` Flag?

MCP's existing ToolAnnotations documentation states: "hints should not be trusted." The `self_reported` flag makes this trust distinction explicit and machine-actionable: agents can apply differential weighting to self-reported vs. independently verified metrics.

### 3.4 Why Exponential Decay for Trust?

Alternative trust models considered:
- **Simple average**: Weights all receipts equally — a service that was dishonest 6 months ago is penalized as much as one that was dishonest yesterday
- **Sliding window**: Binary cutoff — receipts inside the window count fully, outside count zero
- **Exponential decay (chosen)**: Smooth, continuous weighting that naturally prioritizes recent behavior while retaining historical signal. Mathematically principled (memoryless property) and tunable via half-life parameter.

---

## 4. Backward Compatibility

This proposal is **fully backward compatible**:

1. The `x-asm` field is optional — existing tools without it continue to work unchanged
2. Clients that don't understand `x-asm` simply ignore it (standard JSON behavior)
3. No existing MCP messages, methods, or types are modified
4. The `x-` prefix follows established convention for vendor extensions

### Migration Path

| Phase | Description | Breaking Changes |
|-------|-------------|-----------------|
| Phase 1 (current) | `x-asm` in ToolAnnotations | None |
| Phase 2 (future) | Promote to `asm` (drop `x-` prefix) | None (additive) |
| Phase 3 (long-term) | Native MCP fields (e.g., `pricing`, `quality`) | None (additive) |

---

## 5. Implementation

### 5.1 Existing Implementation

A complete reference implementation is available:

- **Schema**: JSON Schema v0.3 with full validation ([asm-v0.3.schema.json](https://github.com/asm-protocol/asm-spec/blob/main/schema/asm-v0.3.schema.json))
- **Scoring Engine**: Python, pure stdlib, TOPSIS + trust delta ([scorer.py](https://github.com/asm-protocol/asm-spec/blob/main/scorer/scorer.py))
- **MCP Server**: TypeScript, 6 tools, stdio transport ([index.ts](https://github.com/asm-protocol/asm-spec/blob/main/registry/src/index.ts))
- **Manifests**: 14 real-world services across 6 categories
- **Demos**: E2E selection demo + Signed Receipts trust pipeline demo

### 5.2 Adoption Effort

For **MCP server developers**: Add an `x-asm` object to existing `ToolAnnotations`. Minimal effort — a single JSON object with 2 required fields (`service_id`, `taxonomy`) and optional pricing/quality/SLA.

For **MCP client developers**: Parse `x-asm` from `ToolAnnotations` and pass to a scoring function. The reference scorer is ~200 lines of code with no dependencies.

For **the MCP specification**: No changes required for Phase 1. Phase 2 would add `x-asm` to the ToolAnnotations documentation as a recognized extension.

---

## 6. Security Considerations

### 6.1 Trust

Service value annotations are **hints, not guarantees** — consistent with MCP's existing ToolAnnotations philosophy. The `self_reported` flag and Signed Receipts integration provide mechanisms for trust verification, but agents should not blindly trust declared values.

### 6.2 Price Manipulation

A malicious server could declare artificially low prices to attract selection, then charge more at execution time. Mitigations:
- Signed Receipts record actual costs, enabling trust delta detection
- AP2 integration provides pre-authorized payment limits
- Agents can maintain blocklists for services with high trust deltas

### 6.3 Information Leakage

Service value annotations are public metadata (pricing pages are already public). No private user data is included in the `x-asm` annotation.

---

## 7. References

[1] MCP 2026 Roadmap. https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/

[2] Y. Guo. "Agent Service Manifest: A Standardized Value Description Protocol for Autonomous Service Selection in Multi-Agent Systems." 2026. https://github.com/asm-protocol/asm-spec

[3] AWS Marketplace MCP Server. https://docs.aws.amazon.com/marketplace/latest/APIReference/marketplace-mcp-server.html

[4] Anthropic. Model Context Protocol Specification. 2025. https://spec.modelcontextprotocol.io

[5] Agent Receipts SDK. https://github.com/agent-receipts/ar

---

## Appendix A: Full ASM Schema Reference

The complete ASM v0.3 JSON Schema is available at:
https://github.com/asm-protocol/asm-spec/blob/main/schema/asm-v0.3.schema.json

## Appendix B: Scoring Algorithm

The TOPSIS scoring algorithm is documented in Section 5.1 of the ASM paper [2] and implemented in:
https://github.com/asm-protocol/asm-spec/blob/main/scorer/scorer.py
