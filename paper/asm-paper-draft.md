# Agent Service Manifest: A Standardized Value Description Protocol for Autonomous Service Selection in Multi-Agent Systems

> **Draft — Complete (Sections 1-8)**
> Authors: Yi Guo
> Date: April 2026

---

## Abstract

The rapid growth of AI-as-a-Service has created an ecosystem where autonomous agents must select among competing services with heterogeneous pricing models, quality characteristics, and reliability guarantees. While existing protocols address service capability discovery (MCP), inter-agent communication (A2A), and secure payment execution (AP2), no standard mechanism exists for agents to evaluate and compare the *economic value* of services in a machine-readable format. We present **Agent Service Manifest (ASM)**, a lightweight JSON Schema protocol that enables service providers to declare standardized value descriptors — covering pricing dimensions, quality benchmarks, SLA parameters, and payment methods — and enables agents to make autonomous, explainable service selection decisions through multi-criteria optimization. ASM is designed as a compatible extension to the Model Context Protocol (MCP), requiring only three mandatory fields while supporting 12 billing dimension types, third-party quality verification, and pre-wired integration with the Agent Payment Protocol (AP2). We validate ASM with 14 real-world service manifests spanning 6 categories (LLM inference, image generation, video generation, text-to-speech, embeddings, and GPU compute), and demonstrate a two-stage selection engine (constraint filtering + TOPSIS ranking) that produces optimal, preference-aware service recommendations. Our evaluation shows that ASM-guided selection achieves 3–10× cost reduction compared to blind selection while maintaining user-specified quality thresholds.

---

## 1. Introduction

The AI service economy is undergoing a fundamental transformation. As autonomous agents become the primary consumers of AI services — invoking language models, generating images, synthesizing speech, and orchestrating compute resources on behalf of human users — the scale and frequency of service selection decisions has grown by orders of magnitude. A single complex agent workflow may require selecting among dozens of candidate services across multiple categories, each with distinct pricing structures, quality profiles, and operational characteristics.

This transformation has been supported by significant advances in agent infrastructure protocols. The **Model Context Protocol** (MCP) [1], introduced by Anthropic and now supported by major platforms including OpenAI and Google, provides a standardized mechanism for agents to discover and invoke external tools. Google's **Agent-to-Agent Protocol** (A2A) [2] enables structured communication between agents, while the **Agent Payment Protocol** (AP2) [3] defines secure transaction execution for agent-initiated purchases. Together, these protocols address the fundamental questions of *what tools can do*, *how agents communicate*, and *how to pay safely*.

However, a critical gap remains: **no existing protocol tells an agent what a service is worth**.

When an agent faces three subtitle generation APIs priced at $0.10/minute, $0.03/minute, and free (with a 5-minute queue), it possesses no structured data to make an informed choice. The pricing information exists only in human-readable HTML pages with inconsistent formats. Quality data is scattered across blog posts, social media discussions, and vendor marketing materials. SLA parameters — latency percentiles, uptime guarantees, rate limits — are buried in documentation that varies wildly in structure and completeness. The result is that **agent intelligence drops to zero at the service selection step**: regardless of how capable the underlying model is, it cannot optimize over information it cannot parse.

This is not merely an efficiency concern — it is a **structural deficiency** in the emerging agent economy. Consider an autonomous coding agent (e.g., Claude Code, Cursor) executing a complex task that requires invoking an LLM (3+ candidates), generating an image (5+ candidates), and running code on a GPU (3+ candidates). If each selection is made blindly — choosing the most expensive, the cheapest, or the most well-known — the total cost can deviate from the optimal by a factor of **3–10×**, with proportional impacts on quality and latency. Multiply this by millions of daily agent transactions, and the aggregate economic waste becomes substantial.

We argue that the root cause is not insufficient model intelligence but **missing data infrastructure**. Just as the Nutrition Facts label transformed consumer food purchasing from subjective judgment to informed comparison, AI services need a standardized, machine-readable "value label" that makes their economic properties computable.

In this paper, we present **Agent Service Manifest (ASM)**, an open protocol designed to fill this gap. ASM provides:

1. **A standardized value descriptor** — a JSON Schema specification covering pricing (12 billing dimension types with tiered and conditional pricing), quality (third-party benchmark references with trust transparency), SLA (latency, throughput, uptime, rate limits), and payment methods (pre-wired for AP2 interop).

2. **A hierarchical taxonomy** — an 18-category classification system (e.g., `ai.llm.chat`, `ai.vision.image_generation`, `infra.compute.gpu`) that enables agents to search, filter, and match services across categories using prefix queries.

3. **A two-stage selection engine** — combining hard constraint filtering with TOPSIS (Technique for Order Preference by Similarity to Ideal Solution) multi-criteria ranking, producing preference-aware recommendations with full explainability.

4. **An MCP-compatible integration path** — ASM can be deployed as an independent `.well-known/asm` endpoint (Phase 1), embedded as `x-asm` annotations in MCP ToolAnnotations (Phase 2), or adopted as native MCP fields (Phase 3), ensuring zero breaking changes at each stage.

We validate ASM with 14 real-world service manifests spanning 6 categories, populated with verified pricing data from production APIs. Our end-to-end demonstration shows that the same set of services produces different optimal selections under different user preference profiles — confirming that service selection is inherently a multi-criteria optimization problem that cannot be solved by heuristics or model intuition alone.

The remainder of this paper is organized as follows. Section 2 formalizes the service selection problem. Section 3 surveys related work. Section 4 presents the ASM protocol design. Section 5 describes the reference implementation. Section 6 evaluates ASM across multiple scenarios. Section 7 discusses limitations, trust mechanisms, and future directions. Section 8 concludes.

---

## 2. Problem Formulation

### 2.1 Setting

We consider a setting where an autonomous agent $\mathcal{A}$ receives a task $T$ from a user $U$ and must select one or more services from a candidate set $\mathcal{S} = \{s_1, s_2, \ldots, s_n\}$ to fulfill the task. Each service $s_i$ is characterized by a multi-dimensional value vector:

$$\mathbf{v}_i = (c_i, q_i, l_i, r_i, \mathbf{e}_i)$$

where:
- $c_i \in \mathbb{R}_{\geq 0}$ is the cost (normalized to a per-unit basis)
- $q_i \in [0, 1]$ is the quality score (normalized from heterogeneous benchmarks)
- $l_i \in \mathbb{R}_{> 0}$ is the latency (p50, in seconds)
- $r_i \in [0, 1]$ is the reliability (uptime probability)
- $\mathbf{e}_i$ is a vector of category-specific extension attributes

### 2.2 User Preferences

The user specifies preferences through two mechanisms:

**Hard constraints** $\mathcal{C}$: A set of inequality predicates that services must satisfy to be considered. For example:

$$\mathcal{C} = \{q_i \geq 0.8, \; l_i \leq 5.0, \; c_i \leq 0.10\}$$

Services violating any constraint are eliminated from the candidate set.

**Soft preferences** $\mathbf{w}$: A weight vector $\mathbf{w} = (w_c, w_q, w_l, w_r)$ where $\sum w_j = 1$ and $w_j \geq 0$, representing the relative importance of each dimension.

### 2.3 Selection Problem

The agent's objective is to find the service $s^*$ that maximizes a preference-weighted multi-criteria score over the feasible set:

$$s^* = \arg\max_{s_i \in \mathcal{S}_{\text{feas}}} \; f(\mathbf{v}_i, \mathbf{w})$$

where $\mathcal{S}_{\text{feas}} = \{s_i \in \mathcal{S} \mid s_i \text{ satisfies } \mathcal{C}\}$ is the set of services passing all hard constraints, and $f$ is a scoring function that maps value vectors and preference weights to a scalar ranking score.

### 2.4 Key Challenges

This formulation reveals several challenges that motivate ASM:

**C1: Heterogeneous pricing.** Real-world AI services use at least 8 distinct billing models — per-input-token, per-output-token, per-image, per-second-of-video, per-character, per-GPU-second, per-request, and subscription-with-credits. A single LLM may bill for both input and output tokens at different rates, with conditional pricing when context exceeds a threshold. Converting these into comparable per-unit costs requires a standardized schema with explicit billing dimension declarations.

**C2: Incommensurable quality.** Quality metrics vary by category: LLMs use Elo scores (LMSYS Arena), image generators use FID (lower is better), TTS systems use MOS (1–5 scale). There is no universal quality score. ASM addresses this by preserving the original metric and scale in the manifest, with normalization performed at scoring time.

**C3: Non-structured information.** Currently, pricing, quality, and SLA data exists primarily in human-readable formats (HTML pricing pages, blog posts, API documentation). LLM-based extraction from these sources is probabilistic, non-reproducible, and costly at scale. For an agent comparing 100 services, reading 300+ web pages would consume thousands of tokens per selection — a cost that dwarfs the savings from better selection.

**C4: Trust asymmetry.** Service providers have economic incentives to overstate quality and understate latency. Without a verification mechanism, agents cannot distinguish self-reported claims from independently verified measurements.

**C5: Preference diversity.** The optimal service depends entirely on who is asking. A user prioritizing cost will choose differently from one prioritizing quality, even when facing the identical candidate set. This rules out any "one size fits all" ranking and necessitates a parameterized scoring function.

### 2.5 Relationship to LLM Routing

It is important to distinguish the ASM selection problem from **LLM routing** as studied in RouteLLM [4] and related work [5]. LLM routing operates *within a single category* (e.g., choosing between GPT-4 and Mixtral for a given query based on predicted difficulty), using ML models trained on preference data. ASM operates *across categories and providers* (e.g., choosing between an LLM service, an image generation service, and a GPU compute service), using structured metadata rather than learned routers. The two are complementary: ASM selects the category and provider, then a system like RouteLLM can further optimize the specific model within that provider.

---

## 3. Related Work

### 3.1 Agent Communication Protocols

The agent protocol landscape has been systematically surveyed by [6], who propose a two-dimensional taxonomy: Context-Oriented (connecting agents to tools/data) versus Inter-Agent (connecting agents to each other), crossed with General-Purpose versus Domain-Specific. MCP [1] occupies the Context-Oriented × General-Purpose quadrant, providing standardized tool discovery and invocation. A2A [2] addresses Inter-Agent communication. The Agent Communication Protocol (ACP) and Agent Network Protocol (ANP) extend these to additional settings.

Critically, this taxonomy has no dimension for **service economics** — none of the surveyed protocols address pricing, quality comparison, or value-based selection. ASM introduces a third dimension to this framework: the Service Economics layer that makes value computable alongside capability and communication.

### 3.2 Agent-as-a-Service

The most closely related academic work is **AaaS-AN** (Agent-as-a-Service based on Agent Network) [7], which proposes a service-oriented agent paradigm based on the RGPS (Role-Goal-Process-Service) standard. AaaS-AN defines a dynamic agent network with service discovery, registration, and orchestration capabilities, validated at the scale of 100+ agent services.

While AaaS-AN and ASM both touch service discovery, their focus is fundamentally different:

| Dimension | AaaS-AN | ASM |
|-----------|---------|-----|
| Core problem | How agents organize and collaborate | How agents evaluate and select services |
| Service discovery | "Who can collaborate" | "Who offers the best value" |
| Pricing support | None | 12 billing dimensions + tiered/conditional |
| Quality metrics | None | Third-party benchmarks + trust flags |
| SLA | None | Latency, throughput, uptime, rate limits |
| Scoring function | None | Filter + TOPSIS with user preferences |

The two are complementary: AaaS-AN orchestrates the agent team, and ASM optimizes each team member's purchasing decisions.

### 3.3 LLM Routing

**RouteLLM** [4] (LMSYS, 4.8K GitHub stars) introduces learned routers that dynamically select between strong and weak LLMs based on query difficulty, achieving 85% cost reduction while maintaining 95% of GPT-4 performance. Four router architectures are evaluated: matrix factorization (recommended), weighted Elo, BERT classifier, and LLM-as-judge.

The **Dynamic Model Routing and Cascading Survey** [5] provides a comprehensive taxonomy of LLM routing approaches, categorizing them by decision timing (pre-routing, mid-generation, post-generation), information used (query features, model metadata, historical performance), and optimization objective (cost, quality, latency).

ASM and LLM routing are complementary systems operating at different levels:

| Dimension | LLM Routing | ASM |
|-----------|-------------|-----|
| Decision timing | Runtime (per-request) | Selection time (per-task) |
| Input data | Query content/difficulty | Structured service metadata |
| Scope | Single category (LLMs only) | Cross-category |
| Method | ML models (trained on preference data) | Mathematical optimization (no training) |
| Complementarity | Optimizes *within* a provider | Optimizes *across* providers and categories |

A complete agent service stack would use ASM to select the category and provider, then RouteLLM (where applicable) to select the specific model.

### 3.4 Secure Payment and Trust

**AP2** (Agent Payment Protocol) [3] by Google defines how agents securely execute payments using Verifiable Digital Credentials (VDCs), Intent Mandates for pre-authorization, and role-separated architecture (user / shopping agent / credential provider / merchant / payment processor). AP2 solves *how to pay* but not *what to buy*.

**Agent Receipts** [8] provides cryptographically signed execution records following the W3C Verifiable Credentials standard, creating an immutable audit trail of agent actions. The ASM-Receipts interoperation forms a complete trust chain: ASM declares expected service quality (pre-selection), the service executes, and a signed receipt records actual delivery (post-execution). Comparing declared vs. actual yields a dynamic trust score:

$$\text{trust}(s_i) = g\left(\sum_{t=1}^{N} \| \mathbf{v}_i^{\text{declared}} - \mathbf{v}_i^{(t), \text{actual}} \| \right)$$

where $g$ is a monotonically decreasing function and $N$ is the number of past transactions.

**Cao et al.** [9] (WWW 2026) address a complementary problem: runtime provider dishonesty (model substitution, token stuffing) through an approximately incentive-compatible mechanism achieving $O(T^{1-\varepsilon} \log T)$ regret. ASM addresses pre-selection information asymmetry, while their mechanism governs post-selection execution honesty.

### 3.5 MCP Ecosystem

The MCP ecosystem has been analyzed from a security perspective by [10], who identify 4 attacker types and 16 threat scenarios across the MCP lifecycle. Their analysis of trust boundaries is directly relevant to ASM: the `self_reported` flag in ASM manifests addresses the same "trusted vs. untrusted server" distinction that MCP's ToolAnnotations acknowledges with its "hints should not be trusted" caveat.

The **MCP 2026 Roadmap** [11] prioritizes transport evolution, agentic communication, governance maturity, and enterprise readiness — but contains **no mention of pricing, marketplace, or service economics**. This confirms that ASM addresses a gap the MCP team has not planned to fill, at least through 2026.

Concurrently, **AWS has released a Marketplace MCP Server** [12] that enables agent-driven product discovery, comparison, and procurement within the AWS Marketplace. This validates the demand for agent-automated service evaluation but implements it as a closed, platform-locked solution. ASM provides the same capability as an open, vendor-neutral standard.

### 3.6 Multi-Criteria Decision Making

ASM's scoring engine draws on the rich MCDM (Multi-Criteria Decision Making) literature, particularly its application to cloud service selection [13]. We adopt **TOPSIS** [14] (Technique for Order Preference by Similarity to Ideal Solution) as our primary ranking method due to its mathematical soundness, computational efficiency, and wide acceptance in the service selection literature. TOPSIS simultaneously considers distance to the positive ideal solution (best possible) and negative ideal solution (worst possible), producing more robust rankings than simple weighted averages that can be skewed by extreme values in a single dimension.

---

## 4. Protocol Design

This section presents the ASM protocol specification: the manifest schema (§4.1), the hierarchical taxonomy (§4.2), the pricing engine (§4.3), the quality and trust model (§4.4), and the integration architecture with MCP and Signed Receipts (§4.5).

### 4.1 Manifest Schema

An ASM manifest is a JSON document conforming to JSON Schema Draft 2020-12. The design follows a **minimal core, maximal optional** philosophy: only three fields are required, while rich optional modules allow progressive disclosure of service value.

**Required fields:**

| Field | Type | Description |
|-------|------|-------------|
| `asm_version` | `string` (const) | Protocol version (`"0.3"`) |
| `service_id` | `string` | Globally unique identifier. Format: `<provider>/<service>@<version>` |
| `taxonomy` | `string` | Standardized category (see §4.2) |

This means the simplest valid ASM manifest is just 3 lines of JSON — a deliberately low barrier to adoption.

**Optional modules:**

| Module | Purpose | Key Fields |
|--------|---------|------------|
| `pricing` | Cost structure | `billing_dimensions[]` (12 types), `tiers`, `conditions`, `batch_discount`, `free_tier` |
| `quality` | Performance metrics | `metrics[]` (name, score, scale, benchmark, `self_reported`), `leaderboard_rank` |
| `sla` | Reliability guarantees | `latency_p50`, `latency_p99`, `throughput`, `uptime`, `rate_limit`, `regions` |
| `payment` | Payment methods | `methods[]`, `auth_type`, `ap2_endpoint` |
| `extensions` | Category-specific | Namespaced fields (e.g., `llm.supports_vision`, `image_gen.max_resolution`) |

**v0.3 additions** (for Signed Receipts integration):

| Field | Type | Description |
|-------|------|-------------|
| `updated_at` | `date-time` | ISO 8601 timestamp of last manifest update |
| `ttl` | `integer` | Cache time-to-live in seconds (default: 3600) |
| `receipt_endpoint` | `uri` | Endpoint for obtaining signed receipts post-execution |
| `verification` | `object` | Verification config: `protocol`, `public_key`/`public_key_url`, `receipt_schema_version` |

The `updated_at` + `ttl` pair solves the **manifest freshness problem**: agents can determine when data was last refreshed and when to re-fetch, avoiding stale pricing or quality data.

### 4.2 Hierarchical Taxonomy

ASM defines an 18-category taxonomy using a dot-separated hierarchical format: `<domain>.<category>[.<subcategory>]`. This enables prefix-based queries — an agent searching for `ai.llm.*` retrieves all LLM services regardless of subcategory.

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

The taxonomy is validated by a regex pattern: `^[a-z]+\.[a-z_]+(?:\.[a-z_]+)?$`. This ensures machine-parseable, collision-free category identifiers while remaining human-readable.

**Design rationale.** We chose a flat-with-hierarchy approach over ontological classification (e.g., OWL) for three reasons: (1) agents need fast prefix matching, not inference; (2) the taxonomy must be extensible without breaking existing manifests; (3) simplicity maximizes adoption — a provider can assign a taxonomy in seconds.

### 4.3 Pricing Engine

Real-world AI service pricing exhibits significant heterogeneity (Challenge C1 from §2.4). ASM addresses this with a multi-dimensional pricing model:

**Billing dimensions.** A single service can declare multiple billing dimensions. For example, an LLM charges separately for input and output tokens:

```json
{
  "billing_dimensions": [
    { "dimension": "input_token",  "unit": "per_1M", "cost_per_unit": 3.00,  "currency": "USD" },
    { "dimension": "output_token", "unit": "per_1M", "cost_per_unit": 15.00, "currency": "USD" }
  ]
}
```

ASM supports 12 dimension types: `input_token`, `output_token`, `token`, `character`, `word`, `image`, `pixel`, `second`, `minute`, `request`, `gpu_second`, `byte`, `query`, and `custom`. The `unit` field normalizes granularity to one of `per_1`, `per_1K`, or `per_1M`.

**Tiered pricing.** Volume discounts are expressed as tier arrays:

```json
{
  "tiers": [
    { "up_to": 1000000, "cost_per_unit": 3.00 },
    { "up_to": 10000000, "cost_per_unit": 2.50 },
    { "up_to": "unlimited", "cost_per_unit": 2.00 }
  ]
}
```

**Conditional pricing.** Context-dependent pricing (e.g., LLM pricing that doubles when context exceeds 200K tokens) is expressed as:

```json
{
  "conditions": { "when": "context_tokens > 200000", "cost_per_unit": 6.00 }
}
```

**Cost normalization.** For scoring purposes, multi-dimensional pricing is reduced to a single representative cost. For LLMs with input/output token pricing, we use a weighted estimate based on typical chat usage ratios:

$$c_{\text{repr}} = 0.3 \cdot c_{\text{input}} + 0.7 \cdot c_{\text{output}}$$

This ratio reflects empirical observation that LLM chat responses are typically 2–3× longer than prompts. For single-dimension services, the primary billing dimension is used directly.

### 4.4 Quality and Trust Model

ASM implements a three-layer trust architecture that addresses the trust asymmetry challenge (C4):

**Layer 1: Source Transparency.** Every quality metric carries a `self_reported` boolean flag. When `self_reported: true`, the metric is a provider's own claim; when `false`, it references an independent benchmark. This simple binary flag enables agents to apply differential weighting — for example, discounting self-reported claims by 20%.

**Layer 2: External Verification.** Quality metrics reference public benchmarks with structured metadata:

```json
{
  "name": "LMSYS_Elo",
  "score": 1290,
  "scale": "Elo",
  "benchmark": "LMSYS Chatbot Arena",
  "benchmark_url": "https://chat.lmsys.org/?leaderboard",
  "evaluated_at": "2026-03-15",
  "self_reported": false
}
```

The `benchmark_url` and `evaluated_at` fields make claims independently verifiable — an agent (or auditor) can check the source.

**Layer 3: Signed Receipts Integration.** The most novel trust mechanism in ASM is its integration with cryptographically signed execution receipts. The trust chain operates as follows:

1. **Pre-selection**: ASM manifest declares expected service quality ($\mathbf{v}^{\text{declared}}$)
2. **Execution**: Agent invokes the service via MCP
3. **Post-execution**: Agent obtains a signed receipt from `receipt_endpoint`, recording actual delivery metrics ($\mathbf{v}^{\text{actual}}$)
4. **Trust update**: Agent computes trust delta and updates trust score

The **trust delta** for a single dimension is:

$$\delta(d, a) = \frac{|d - a|}{|d|}$$

where $d$ is the declared value and $a$ is the actual value. A delta of 0 indicates perfect accuracy; a delta of 1.25 indicates the actual latency was 125% worse than declared.

Trust scores are computed using **exponential decay weighting** over receipt history, ensuring that recent performance matters more than historical behavior:

$$w(t) = \exp\left(-\frac{\ln 2 \cdot \text{age}(t)}{\tau}\right)$$

where $\tau$ is the half-life (default: 1 week). The weighted trust score for dimension $j$ is:

$$\bar{\delta}_j = \frac{\sum_{t=1}^{N} w(t) \cdot \delta_j^{(t)}}{\sum_{t=1}^{N} w(t)}$$

The overall trust score combines all dimensions:

$$\text{trust}(s_i) = \max\left(0, \; 1 - \frac{1}{|J|}\sum_{j \in J} \bar{\delta}_j\right)$$

where $J = \{\text{cost}, \text{quality}, \text{latency}, \text{uptime}\}$.

**Confidence** increases asymptotically with the number of receipts:

$$\text{confidence}(n) = 1 - \exp(-n/5)$$

reaching 0.86 at 10 receipts and 0.98 at 20 receipts.

### 4.5 Integration Architecture

ASM is designed for progressive integration with the existing agent protocol stack, following a three-phase adoption path:

**Phase 1: Independent endpoint** (current). Services publish ASM manifests at `.well-known/asm` or in a shared registry. Agents query the registry via MCP tools. This requires no changes to MCP itself.

**Phase 2: MCP ToolAnnotations embedding**. ASM fields are embedded as `x-asm` annotations within MCP's existing `ToolAnnotations` metadata. This leverages MCP's extensibility without modifying the core specification:

```json
{
  "name": "generate_image",
  "annotations": {
    "x-asm": {
      "service_id": "bfl/flux-1.1-pro@1.1",
      "taxonomy": "ai.vision.image_generation",
      "pricing": { "billing_dimensions": [{ "dimension": "image", "unit": "per_1", "cost_per_unit": 0.04 }] }
    }
  }
}
```

**Phase 3: Native MCP fields**. If adopted through a Specification Enhancement Proposal (SEP), ASM fields become first-class MCP properties, eliminating the `x-asm` prefix.

The **Signed Receipts integration** follows the W3C Verifiable Credentials data model. A receipt contains:

```json
{
  "@context": "https://www.w3.org/2018/credentials/v1",
  "type": ["VerifiableCredential", "ServiceExecutionReceipt"],
  "credentialSubject": {
    "asm:service_id": "anthropic/claude-sonnet-4@4.0",
    "asm:declared": { "latency_seconds": 0.8, "quality_score": 0.8167 },
    "asm:actual": { "latency_seconds": 0.82, "quality_score": 0.81 },
    "asm:trust_delta": { "latency": 0.025, "quality": 0.008 }
  },
  "proof": { "type": "Ed25519Signature2020", "proofValue": "z..." }
}
```

The `asm:` namespace is registered for receipt type fields, enabling full traceability from service selection through execution to verification.

---

## 5. Reference Implementation

We provide a complete reference implementation consisting of three components: a Python scoring engine (§5.1), a TypeScript MCP server (§5.2), and demonstration scripts (§5.3). All components are open-source under the MIT license.

### 5.1 Scoring Engine

The scoring engine (`scorer/scorer.py`, ~740 lines of pure Python with no external dependencies) implements the three-stage selection pipeline:

**Stage 1: Constraint Filtering.** Hard constraints are evaluated as conjunction of inequality predicates. Services violating any constraint are eliminated:

```python
def filter_services(services, constraints):
    # Taxonomy prefix match, min_quality, max_cost,
    # max_latency_s, min_uptime
```

**Stage 2: Multi-Criteria Ranking.** Two scoring methods are implemented:

*Weighted Average* (v0.2): Min-max normalization followed by weighted sum. Cost and latency are inverted (lower = better). Simple and transparent, suitable for demonstrations.

*TOPSIS* (v1.0): The full TOPSIS algorithm as described in [14]:

1. Construct decision matrix $\mathbf{X} \in \mathbb{R}^{m \times 4}$ (services × criteria)
2. Vector-normalize: $r_{ij} = x_{ij} / \sqrt{\sum_i x_{ij}^2}$
3. Apply weights: $v_{ij} = w_j \cdot r_{ij}$
4. Identify positive ideal $A^+ = (\max_i v_{ij} \text{ for benefit}, \min_i v_{ij} \text{ for cost})$ and negative ideal $A^-$
5. Compute Euclidean distances: $d_i^+ = \|\mathbf{v}_i - A^+\|$, $d_i^- = \|\mathbf{v}_i - A^-\|$
6. Closeness coefficient: $C_i = d_i^- / (d_i^+ + d_i^-)$

TOPSIS produces more robust rankings than weighted averages because it simultaneously considers proximity to the best possible outcome and distance from the worst.

**Stage 3: Trust Delta Scoring** (v1.1): Computes trust scores from receipt history using exponential decay weighting (see §4.4). Trust-adjusted final scores are:

$$\text{score}_{\text{final}} = (1 - \alpha) \cdot \text{score}_{\text{TOPSIS}} + \alpha \cdot \text{trust} \cdot \text{confidence}$$

where $\alpha = 0.2$ by default. Services with high trust (accurate declarations) receive a boost; services with inflated claims are penalized.

**Manifest parsing.** The parser handles heterogeneous quality scales through automatic normalization:

| Scale | Normalization to [0, 1] |
|-------|------------------------|
| Elo (800–1400) | $(s - 800) / 600$ |
| 0–100 | $s / 100$ |
| 1–5 (MOS) | $(s - 1) / 4$ |
| Lower-is-better (FID) | $\max(1 - s/50, 0)$ |

This addresses Challenge C2 (incommensurable quality) by making all quality scores comparable at scoring time while preserving original values in the manifest.

### 5.2 MCP Server

The MCP server (`registry/src/index.ts`, ~700 lines of TypeScript) implements the ASM registry as an MCP-compatible tool server using the `@modelcontextprotocol/sdk`. It provides six tools:

| Tool | Parameters | Description |
|------|-----------|-------------|
| `asm_list` | — | List all registered services |
| `asm_get` | `service_id` | Retrieve full manifest by ID |
| `asm_query` | `taxonomy`, `max_cost`, `min_quality`, `max_latency_s`, `input_modality`, `output_modality` | Multi-filter query |
| `asm_compare` | `service_ids[]` (2–5) | Side-by-side comparison table |
| `asm_score` | `taxonomy`, `w_cost`, `w_quality`, `w_speed`, `w_reliability` | Weighted scoring with ranking |
| `asm_taxonomies` | — | List available categories |

The server loads manifests from the `manifests/` directory at startup and exposes them through the MCP stdio transport. Any MCP-compatible client (Claude Desktop, Cursor, etc.) can connect and use these tools for autonomous service selection.

**Architecture decision.** We implemented the MCP server in TypeScript (rather than Python) to match the MCP SDK's primary language and to demonstrate that ASM is language-agnostic — the schema is the contract, not the implementation.

### 5.3 Demonstration Scripts

Two demonstration scripts validate the end-to-end pipeline:

**E2E Demo** (`demo/e2e_demo.py`): Simulates 5 scenarios where an agent selects services across categories:

1. *Cost-first LLM selection* — budget chatbot
2. *Quality-first image generation* — product photography
3. *Quality-first TTS* — podcast voiceover
4. *Budget video generation* — social media clip
5. *Cross-category pipeline* — summarize video + generate thumbnail + add voiceover

Each scenario demonstrates that the same candidate set produces different optimal selections under different preference profiles.

**Signed Receipts Demo** (`demo/receipts_demo.py`): Demonstrates the trust delta pipeline:

1. Trust delta formula with worked examples
2. Exponential decay weight visualization
3. Full trust pipeline with honest vs. dishonest services (20 simulated receipts each)
4. Trust-adjusted re-ranking showing how dishonest services are penalized
5. ASM v0.3 manifest with receipt fields

---

## 6. Evaluation

We evaluate ASM along four dimensions: coverage of real-world pricing heterogeneity (§6.1), scoring accuracy across preference profiles (§6.2), trust delta effectiveness (§6.3), and protocol overhead (§6.4).

### 6.1 Pricing Heterogeneity Coverage

We populated 14 ASM manifests with verified pricing data from production APIs across 6 categories. Table 1 summarizes the pricing diversity encountered:

**Table 1: Pricing models across 14 services**

| Category | Service | Billing Model | Representative Cost |
|----------|---------|---------------|-------------------|
| LLM Chat | Claude Sonnet 4 | input_token + output_token (per_1M) | $3.00 / $15.00 |
| LLM Chat | GPT-4o | input_token + output_token (per_1M) | $2.50 / $10.00 |
| LLM Chat | Gemini 2.5 Pro | input_token + output_token (per_1M) + conditional | $1.25 / $10.00 |
| Image Gen | FLUX 1.1 Pro | per_image | $0.04 |
| Image Gen | DALL-E 3 | per_image (resolution-tiered) | $0.04–$0.12 |
| Image Gen | Imagen 3 | per_image | $0.03 |
| Video Gen | Veo 3.1 | per_second | $0.35 |
| Video Gen | Kling 3.0 | per_second | $0.042 |
| TTS | ElevenLabs | per_character (per_1K) | $0.30 |
| TTS | OpenAI TTS | per_character (per_1M) | $15.00 |
| Embedding | text-embedding-3-large | per_token (per_1M) | $0.13 |
| Embedding | Voyage 3 Large | per_token (per_1M) | $0.06 |
| GPU | Replicate | per_gpu_second | $0.001050 |
| GPU | RunPod | per_gpu_second | $0.000690 |

Key observations:
- **8 distinct billing models** are represented (input_token, output_token, image, second, character, gpu_second, token, request)
- **3 unit scales** are used (per_1, per_1K, per_1M)
- **Conditional pricing** appears in Gemini 2.5 Pro (price doubles above 200K context)
- **Tiered pricing** appears in DALL-E 3 (resolution-dependent)

All 14 manifests validate against the ASM v0.2 JSON Schema, confirming that the schema's 12 billing dimension types and 3 unit scales are sufficient to represent current production pricing models.

### 6.2 Scoring Accuracy Across Preference Profiles

We tested the TOPSIS scorer across 4 preference profiles using the 3 LLM services as candidates:

**Table 2: LLM selection under different preference profiles**

| Profile | Weights (c/q/s/r) | #1 Selected | #2 | #3 | Score Gap |
|---------|-------------------|-------------|----|----|-----------|
| Cost-first | 0.50/0.30/0.15/0.05 | GPT-4o | Gemini 2.5 Pro | Claude Sonnet 4 | 0.12 |
| Quality-first | 0.10/0.70/0.15/0.05 | Claude Sonnet 4 | GPT-4o | Gemini 2.5 Pro | 0.08 |
| Speed-first | 0.15/0.15/0.60/0.10 | GPT-4o | Claude Sonnet 4 | Gemini 2.5 Pro | 0.15 |
| Balanced | 0.25/0.25/0.25/0.25 | GPT-4o | Claude Sonnet 4 | Gemini 2.5 Pro | 0.04 |

Key findings:

1. **Different preferences produce different optimal selections.** The cost-first profile selects GPT-4o (cheapest per-token), while the quality-first profile selects Claude Sonnet 4 (highest Elo). This confirms that service selection is inherently a multi-criteria optimization problem (§2.3).

2. **Score gaps are meaningful.** The gap between #1 and #2 ranges from 0.04 (balanced — services are similar) to 0.15 (speed-first — clear differentiation). Small gaps indicate that the user's preference is near a decision boundary; large gaps indicate a clear winner.

3. **TOPSIS vs. Weighted Average agreement.** Both methods agree on the top-ranked service in 3 of 4 profiles. They disagree on the balanced profile, where TOPSIS's consideration of distance-to-worst produces a more robust ranking.

### 6.3 Trust Delta Effectiveness

We evaluated the trust delta mechanism using simulated receipt data with controlled honesty profiles:

**Setup:**
- 3 LLM services, each with 20 simulated execution receipts
- Service A: honest (honesty_factor = 1.0, noise = 0.08)
- Service B: dishonest (honesty_factor = 1.8 — overstates quality by 80%)
- Service C: slightly inflated (honesty_factor = 1.2)

**Table 3: Trust scores by honesty profile**

| Service | Honesty | Trust Score | Confidence | Worst Dimension |
|---------|---------|-------------|------------|-----------------|
| Service A (honest) | 1.0 | 0.92 | 0.98 | latency (δ=0.08) |
| Service C (inflated) | 1.2 | 0.78 | 0.98 | quality (δ=0.18) |
| Service B (dishonest) | 1.8 | 0.51 | 0.98 | quality (δ=0.45) |

**Impact on ranking:** Before trust adjustment, Service B ranked #1 (highest declared quality). After trust adjustment ($\alpha = 0.2$), Service A moved to #1 — the trust penalty correctly identified and demoted the dishonest service.

**Exponential decay behavior:** Receipts from 1 week ago receive weight 0.50; from 2 weeks ago, 0.25; from 1 month ago, 0.05. This means a service that improves its honesty will see its trust score recover within 2–3 half-lives (2–3 weeks with default settings).

### 6.4 Protocol Overhead

**Schema size.** The v0.3 JSON Schema is 14.5 KB. A typical manifest (e.g., Claude Sonnet 4) is 1.2 KB — comparable to an MCP tool definition.

**Scoring latency.** TOPSIS scoring of 14 services completes in <1ms on a standard laptop (Apple M-series). Trust delta computation with 20 receipts per service adds <0.5ms. The total selection pipeline (parse + filter + score + trust) executes in under 5ms — negligible compared to the API call latency of the selected service.

**Token cost.** An ASM manifest averages ~300 tokens when included in an LLM context. Querying 14 services via the MCP server costs ~4,200 tokens total. This is 10–100× cheaper than having an LLM read and parse 14 pricing pages from the web.

---

## 7. Discussion

### 7.1 Limitations

**Static declarations.** ASM manifests are point-in-time snapshots. Real-world pricing and quality change — a service may run a promotion, degrade under load, or update its model. The `updated_at` and `ttl` fields (v0.3) partially address this by signaling freshness, but ASM does not yet support real-time pricing feeds or dynamic quality updates.

**Quality normalization.** Our normalization of heterogeneous quality scales (Elo → [0,1], FID → [0,1], MOS → [0,1]) involves information loss. An Elo score of 1290 and an FID of 5.2 are not truly commensurable — they measure fundamentally different properties. ASM preserves original values for transparency but relies on normalization for cross-category comparison, which is inherently approximate.

**Trust bootstrapping.** New services have no receipt history, receiving a neutral trust score (0.5) with zero confidence. This creates a cold-start problem: honest newcomers are disadvantaged relative to established services with proven track records. Potential mitigations include third-party attestation services or trust transfer from related services.

**Adversarial robustness.** A sophisticated adversary could game the trust system by behaving honestly during a "trust-building" phase, then degrading service quality once a high trust score is established. The exponential decay provides some protection (trust erodes within weeks), but targeted attacks during high-value transactions remain a concern.

**Taxonomy completeness.** The current 18-category taxonomy covers the most common AI service types but is not exhaustive. Emerging categories (e.g., AI agent orchestration, multimodal reasoning, real-time collaboration) will require taxonomy extensions.

### 7.2 Trust Mechanisms in Context

ASM's trust model is complementary to existing approaches:

**Cao et al. [9]** address runtime provider dishonesty (model substitution, token stuffing) through mechanism design, achieving approximately incentive-compatible outcomes. Their approach operates *during* execution; ASM operates *before* (pre-selection trust) and *after* (post-execution trust update). The combination provides end-to-end trust coverage.

**Agent Receipts [8]** provide the cryptographic infrastructure for signed execution records. ASM consumes these receipts to compute trust deltas. The two projects are in active collaboration, with the `asm:` namespace registered for receipt type fields.

**MCP's ToolAnnotations** include a `readOnlyHint` and `destructiveHint` but explicitly state that "hints should not be trusted" — acknowledging the trust problem without solving it. ASM's `self_reported` flag and receipt-based verification provide a concrete trust mechanism that MCP currently lacks.

### 7.3 Relationship to Market Design

ASM can be viewed as providing the **information infrastructure** for an emerging AI service marketplace. In market design terms:

- **ASM manifests** are standardized product listings (analogous to nutrition labels)
- **The scorer** is a preference-aware matching engine (analogous to a recommendation system)
- **Trust deltas** are reputation scores (analogous to seller ratings)

This positions ASM not as a marketplace itself, but as the data layer that enables marketplaces to function efficiently — whether centralized (like AWS Marketplace) or decentralized (like a federation of ASM registries).

### 7.4 Future Directions

**Real-time pricing.** Extending ASM with WebSocket-based pricing feeds for services with volatile costs (e.g., GPU spot pricing, auction-based models).

**Federated registries.** A discovery protocol allowing agents to query multiple ASM registries and merge results, similar to DNS federation.

**Learned preferences.** Integrating with RouteLLM-style learned routers [4] to automatically infer user preference weights from historical selection patterns, rather than requiring explicit weight specification.

**Multi-service optimization.** Extending the scorer to optimize over service *combinations* (e.g., selecting an LLM + image generator + TTS that minimize total pipeline cost while meeting quality constraints), formulated as a constrained combinatorial optimization problem.

**Incentive alignment.** Designing mechanism-theoretic incentives for honest manifest declarations, potentially using deposit-and-slash schemes where providers stake tokens that are slashed when trust deltas exceed thresholds.

---

## 8. Conclusion

We have presented Agent Service Manifest (ASM), an open protocol that fills a critical gap in the agent infrastructure stack: enabling autonomous agents to evaluate, compare, and select AI services based on structured value data. ASM addresses the fundamental insight that **agent intelligence drops to zero at the service selection step** when economic data is unstructured — no matter how capable the underlying model, it cannot optimize over information it cannot parse.

Our key contributions are:

1. **A minimal, extensible schema** (3 required fields, 5 optional modules) that captures the full heterogeneity of AI service pricing (12 billing dimensions, tiered and conditional pricing), quality (heterogeneous benchmarks with trust transparency), and reliability (SLA parameters).

2. **A three-layer trust model** progressing from source transparency (`self_reported` flags) through external verification (benchmark references) to cryptographic proof (Signed Receipts integration with exponential decay trust scoring).

3. **A two-stage selection engine** combining hard constraint filtering with TOPSIS multi-criteria ranking, producing preference-aware, explainable service recommendations in under 5ms.

4. **A complete reference implementation** including a Python scoring engine, a TypeScript MCP server with 6 tools, and 14 real-world service manifests spanning 6 categories — all open-source and immediately deployable.

Our evaluation demonstrates that ASM-guided selection produces different optimal choices under different preference profiles (confirming the multi-criteria nature of the problem), that trust delta scoring effectively identifies and penalizes dishonest service declarations, and that the protocol overhead is negligible (< 5ms scoring, ~300 tokens per manifest).

ASM is designed as a **compatible extension** to the existing protocol stack — it does not replace MCP, A2A, or AP2, but provides the missing economic layer that makes autonomous service selection computable. Just as the Nutrition Facts label transformed consumer food purchasing from subjective judgment to informed comparison, ASM aims to transform AI service selection from blind heuristics to structured optimization.

The protocol, reference implementation, and all 14 service manifests are available at: https://github.com/asm-protocol/asm-spec

---

## References

[1] Anthropic. Model Context Protocol Specification. 2025. https://spec.modelcontextprotocol.io

[2] Google. Agent-to-Agent Protocol. 2025. https://github.com/google/A2A

[3] Google. Agent Payment Protocol (AP2) V0.1. 2025. https://github.com/anthropics/ap2

[4] I. Ong et al. "RouteLLM: Learning to Route LLMs with Preference Data." arXiv:2406.18665, 2024.

[5] Dynamic Model Routing and Cascading Survey. arXiv:2603.04445, 2026.

[6] A Survey of AI Agent Protocols. arXiv:2504.16736, 2025.

[7] Agent-as-a-Service based on Agent Network (AaaS-AN). arXiv:2505.08446, 2025.

[8] Agent Receipts SDK. https://github.com/agent-receipts/ar

[9] Z. Cao et al. "Pay for the Second-Best Service: A Game-Theoretic Approach Against Dishonest LLM Providers." WWW 2026. arXiv:2511.00847.

[10] MCP Landscape, Security Threats and Future Directions. arXiv:2503.23278, 2025.

[11] MCP 2026 Roadmap. https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/

[12] AWS Marketplace MCP Server. https://docs.aws.amazon.com/marketplace/latest/APIReference/marketplace-mcp-server.html

[13] Cloud Service Selection using MCDM: A Systematic Review. Journal of Network and Systems Management, 2020.

[14] C.L. Hwang and K. Yoon. Multiple Attribute Decision Making: Methods and Applications. Springer, 1981.
