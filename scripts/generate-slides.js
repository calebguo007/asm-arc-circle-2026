const pptxgen = require("pptxgenjs");

const C = {
  bg: "0A0A0F", bgCard: "1A1A2E", border: "2A2A4A",
  text: "E0E0E0", textDim: "888888",
  blue: "00D4FF", purple: "7B2FF7", green: "00FF88",
  yellow: "FFD700", coral: "FF6B6B", white: "FFFFFF",
};
const makeShadow = () => ({ type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.3 });

let pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Yi Guo";
pres.title = "ASM x Circle Nanopayments";

// ── Slide 1: Title ──
{
  let s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.blue } });
  s.addShape(pres.shapes.RECTANGLE, { x: 3.3, y: 0, w: 3.4, h: 0.06, fill: { color: C.purple } });
  s.addShape(pres.shapes.RECTANGLE, { x: 6.7, y: 0, w: 3.3, h: 0.06, fill: { color: C.green } });
  s.addText("ASM", { x: 0.8, y: 1.2, w: 8.4, h: 1.2, fontSize: 72, fontFace: "Arial Black", color: C.blue, bold: true, align: "left", margin: 0 });
  s.addText("Agent Service Manifest", { x: 0.8, y: 2.2, w: 8.4, h: 0.6, fontSize: 28, fontFace: "Arial", color: C.text, align: "left", margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.2, w: 8.4, h: 0.02, fill: { color: C.border } });
  s.addText("The first protocol that lets AI agents discover, evaluate, and pay for services autonomously \u2014 per API call, at sub-cent precision, settled on Arc in USDC.", { x: 0.8, y: 3.5, w: 8.4, h: 0.8, fontSize: 16, fontFace: "Arial", color: C.textDim, italic: true, align: "left", margin: 0 });
  s.addText("Agentic Economy on Arc  \u2022  April 2026  \u2022  Yi Guo", { x: 0.8, y: 4.8, w: 8.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: C.textDim, align: "left", margin: 0 });
}

// ── Slide 2: Problem ──
{
  let s = pres.addSlide();
  s.background = { color: C.bg };
  s.addText("The Problem", { x: 0.8, y: 0.4, w: 8.4, h: 0.7, fontSize: 36, fontFace: "Arial Black", color: C.coral, bold: true, align: "left", margin: 0 });
  s.addText("AI agents have zero structured data to choose between service providers.", { x: 0.8, y: 1.2, w: 8.4, h: 0.5, fontSize: 18, fontFace: "Arial", color: C.text, align: "left", margin: 0 });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 2.0, w: 4.0, h: 2.8, fill: { color: "1C1020" }, shadow: makeShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 2.0, w: 4.0, h: 0.05, fill: { color: C.coral } });
  s.addText("Without ASM", { x: 1.1, y: 2.2, w: 3.5, h: 0.4, fontSize: 16, fontFace: "Arial", color: C.coral, bold: true, margin: 0 });
  s.addText([
    { text: "\u274C  Blind selection (hardcoded API keys)", options: { breakLine: true, fontSize: 13 } },
    { text: "\u274C  3-10x cost overrun or quality mismatch", options: { breakLine: true, fontSize: 13 } },
    { text: "\u274C  Decisions are non-reproducible", options: { breakLine: true, fontSize: 13 } },
    { text: "\u274C  Zero intelligence at selection step", options: { fontSize: 13 } },
  ], { x: 1.1, y: 2.7, w: 3.5, h: 1.8, fontFace: "Arial", color: C.textDim, lineSpacingMultiple: 1.6, margin: 0 });

  s.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 2.0, w: 4.0, h: 2.8, fill: { color: "0A1A20" }, shadow: makeShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 2.0, w: 4.0, h: 0.05, fill: { color: C.green } });
  s.addText("With ASM", { x: 5.5, y: 2.2, w: 3.5, h: 0.4, fontSize: 16, fontFace: "Arial", color: C.green, bold: true, margin: 0 });
  s.addText([
    { text: "\u2705  Structured multi-criteria matching", options: { breakLine: true, fontSize: 13 } },
    { text: "\u2705  Optimal cost-quality tradeoff", options: { breakLine: true, fontSize: 13 } },
    { text: "\u2705  Deterministic, auditable, explainable", options: { breakLine: true, fontSize: 13 } },
    { text: "\u2705  Full autonomous decision capability", options: { fontSize: 13 } },
  ], { x: 5.5, y: 2.7, w: 3.5, h: 1.8, fontFace: "Arial", color: C.textDim, lineSpacingMultiple: 1.6, margin: 0 });

  s.addText("This is not a model intelligence problem \u2014 it\u2019s a data problem.", { x: 0.8, y: 5.0, w: 8.4, h: 0.4, fontSize: 14, fontFace: "Arial", color: C.yellow, italic: true, align: "center", margin: 0 });
}

// ── Slide 3: Solution ──
{
  let s = pres.addSlide();
  s.background = { color: C.bg };
  s.addText("The Solution: 3 Layers", { x: 0.8, y: 0.4, w: 8.4, h: 0.7, fontSize: 36, fontFace: "Arial Black", color: C.blue, bold: true, align: "left", margin: 0 });

  const layers = [
    { icon: "\U0001F4CB", title: "Discover", subtitle: "Structured Manifests", desc: "14 real-world AI services\nacross 6 categories\n(LLM, Image, Video, TTS,\nEmbedding, GPU)", color: C.blue },
    { icon: "\u2696\uFE0F", title: "Evaluate", subtitle: "TOPSIS Scoring", desc: "Multi-criteria decision\nmaking with custom\npreference weights.\nPython + TypeScript parity.", color: C.purple },
    { icon: "\U0001F4B0", title: "Pay", subtitle: "Circle Nanopayments", desc: "$0.002-$0.005 USDC\nper API call on Arc.\nx402 protocol.\nFully autonomous.", color: C.green },
  ];

  layers.forEach((layer, i) => {
    const x = 0.8 + i * 3.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.4, w: 2.8, h: 3.6, fill: { color: C.bgCard }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.4, w: 2.8, h: 0.05, fill: { color: layer.color } });
    s.addText(layer.icon, { x, y: 1.6, w: 2.8, h: 0.6, fontSize: 32, align: "center", margin: 0 });
    s.addText(layer.title, { x, y: 2.2, w: 2.8, h: 0.4, fontSize: 20, fontFace: "Arial", color: layer.color, bold: true, align: "center", margin: 0 });
    s.addText(layer.subtitle, { x, y: 2.6, w: 2.8, h: 0.3, fontSize: 12, fontFace: "Arial", color: C.textDim, align: "center", margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: x + 0.3, y: 3.1, w: 2.2, h: 0.02, fill: { color: C.border } });
    s.addText(layer.desc, { x: x + 0.2, y: 3.3, w: 2.4, h: 1.5, fontSize: 12, fontFace: "Arial", color: C.text, align: "center", margin: 0, lineSpacingMultiple: 1.4 });
  });

  s.addText("Agent Task  \u2192  Taxonomy  \u2192  Registry Query  \u2192  TOPSIS Score ($0.005)  \u2192  Service Call  \u2192  Receipt  \u2192  Trust Update", { x: 0.5, y: 5.1, w: 9.0, h: 0.3, fontSize: 10, fontFace: "Consolas", color: C.textDim, align: "center", margin: 0 });
}

// ── Slide 4: Why Nanopayments ──
{
  let s = pres.addSlide();
  s.background = { color: C.bg };
  s.addText("Why Traditional Gas Models Can\u2019t Do This", { x: 0.8, y: 0.4, w: 8.4, h: 0.7, fontSize: 32, fontFace: "Arial Black", color: C.yellow, bold: true, align: "left", margin: 0 });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.4, w: 4.0, h: 2.0, fill: { color: "1C1020" }, shadow: makeShadow() });
  s.addText("Traditional L1 Gas", { x: 0.8, y: 1.5, w: 4.0, h: 0.3, fontSize: 12, fontFace: "Arial", color: C.coral, align: "center", bold: true, margin: 0 });
  s.addText("$0.50+", { x: 0.8, y: 1.9, w: 4.0, h: 0.8, fontSize: 48, fontFace: "Arial Black", color: C.coral, align: "center", margin: 0 });
  s.addText("per transaction", { x: 0.8, y: 2.7, w: 4.0, h: 0.3, fontSize: 12, fontFace: "Arial", color: C.textDim, align: "center", margin: 0 });

  s.addText("vs", { x: 4.5, y: 2.0, w: 1.0, h: 0.5, fontSize: 16, fontFace: "Arial", color: C.textDim, align: "center", margin: 0 });

  s.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.4, w: 4.0, h: 2.0, fill: { color: "0A1A20" }, shadow: makeShadow() });
  s.addText("Circle Nanopayments on Arc", { x: 5.2, y: 1.5, w: 4.0, h: 0.3, fontSize: 12, fontFace: "Arial", color: C.green, align: "center", bold: true, margin: 0 });
  s.addText("$0.005", { x: 5.2, y: 1.9, w: 4.0, h: 0.8, fontSize: 48, fontFace: "Arial Black", color: C.green, align: "center", margin: 0 });
  s.addText("per transaction (batched)", { x: 5.2, y: 2.7, w: 4.0, h: 0.3, fontSize: 12, fontFace: "Arial", color: C.textDim, align: "center", margin: 0 });

  s.addText([
    { text: "100x cheaper", options: { bold: true, color: C.green, fontSize: 14, breakLine: true } },
    { text: "  When gas > payment amount, micro-payments are impossible.", options: { color: C.textDim, fontSize: 12, breakLine: true } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "Batched settlement", options: { bold: true, color: C.green, fontSize: 14, breakLine: true } },
    { text: "  Multiple micro-payments settled in a single on-chain tx.", options: { color: C.textDim, fontSize: 12, breakLine: true } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "USDC-native", options: { bold: true, color: C.green, fontSize: 14, breakLine: true } },
    { text: "  No volatile gas token. No price uncertainty for agents.", options: { color: C.textDim, fontSize: 12 } },
  ], { x: 0.8, y: 3.7, w: 8.4, h: 1.8, fontFace: "Arial", margin: 0 });
}

// ── Slide 5: Live Data ──
{
  let s = pres.addSlide();
  s.background = { color: C.bg };
  s.addText("Live Demo Results", { x: 0.8, y: 0.4, w: 8.4, h: 0.7, fontSize: 36, fontFace: "Arial Black", color: C.green, bold: true, align: "left", margin: 0 });

  const stats = [
    { label: "TRANSACTIONS", value: "51", color: C.green },
    { label: "TOTAL VOLUME", value: "$0.243", color: C.blue },
    { label: "AI SERVICES", value: "14", color: C.purple },
    { label: "AGENT PERSONAS", value: "6", color: C.yellow },
  ];
  stats.forEach((stat, i) => {
    const x = 0.8 + i * 2.25;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.3, w: 2.0, h: 1.4, fill: { color: C.bgCard }, shadow: makeShadow() });
    s.addText(stat.label, { x, y: 1.4, w: 2.0, h: 0.3, fontSize: 9, fontFace: "Arial", color: C.textDim, align: "center", margin: 0, charSpacing: 2 });
    s.addText(stat.value, { x, y: 1.7, w: 2.0, h: 0.7, fontSize: 36, fontFace: "Arial Black", color: stat.color, align: "center", margin: 0 });
  });

  s.addText("6 Agent Personas \u00D7 Diverse Scenarios", { x: 0.8, y: 3.0, w: 8.4, h: 0.4, fontSize: 16, fontFace: "Arial", color: C.text, bold: true, margin: 0 });

  const agents = [
    ["\U0001F916 ChatBot Agent", "ai.llm.chat", "Cost-optimized LLM selection"],
    ["\U0001F3A8 Creative Agent", "ai.vision.*", "Quality-first image/video gen"],
    ["\U0001F50A Voice Agent", "ai.audio.tts", "Best TTS for natural speech"],
    ["\U0001F4DA RAG Agent", "ai.llm + ai.embedding", "High io_ratio cost optimization"],
    ["\u26A1 DevOps Agent", "cloud.compute.gpu", "Speed + reliability priority"],
    ["\U0001F310 Multi-Modal Agent", "all categories", "Balanced cross-category selection"],
  ];

  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.5, w: 8.4, h: 0.35, fill: { color: C.bgCard } });
  s.addText("Agent", { x: 0.9, y: 3.5, w: 2.2, h: 0.35, fontSize: 10, fontFace: "Arial", color: C.textDim, bold: true, margin: 0, valign: "middle" });
  s.addText("Taxonomy", { x: 3.1, y: 3.5, w: 2.5, h: 0.35, fontSize: 10, fontFace: "Arial", color: C.textDim, bold: true, margin: 0, valign: "middle" });
  s.addText("Strategy", { x: 5.8, y: 3.5, w: 3.2, h: 0.35, fontSize: 10, fontFace: "Arial", color: C.textDim, bold: true, margin: 0, valign: "middle" });

  agents.forEach((row, i) => {
    const y = 3.9 + i * 0.28;
    if (i % 2 === 0) s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y, w: 8.4, h: 0.28, fill: { color: "12122A" } });
    s.addText(row[0], { x: 0.9, y, w: 2.2, h: 0.28, fontSize: 10, fontFace: "Arial", color: C.text, margin: 0, valign: "middle" });
    s.addText(row[1], { x: 3.1, y, w: 2.5, h: 0.28, fontSize: 10, fontFace: "Consolas", color: C.blue, margin: 0, valign: "middle" });
    s.addText(row[2], { x: 5.8, y, w: 3.2, h: 0.28, fontSize: 10, fontFace: "Arial", color: C.textDim, margin: 0, valign: "middle" });
  });
}

// ── Slide 6: Trust Model ──
{
  let s = pres.addSlide();
  s.background = { color: C.bg };
  s.addText("Trust Model: Verify, Don\u2019t Trust", { x: 0.8, y: 0.4, w: 8.4, h: 0.7, fontSize: 32, fontFace: "Arial Black", color: C.purple, bold: true, align: "left", margin: 0 });
  s.addText("3-layer trust architecture \u2014 from self-reported claims to cryptographic proof", { x: 0.8, y: 1.1, w: 8.4, h: 0.4, fontSize: 14, fontFace: "Arial", color: C.textDim, italic: true, margin: 0 });

  const trustLayers = [
    { label: "L1", title: "Transparency", desc: "self_reported flag on every metric. Agent knows who says this.", color: C.blue, y: 1.7 },
    { label: "L2", title: "Verification", desc: "Third-party benchmarks with URLs. Independently checkable.", color: C.purple, y: 2.8 },
    { label: "L3", title: "Receipts", desc: "Signed Receipts prove actual performance. trust_delta = |declared - actual| / declared", color: C.green, y: 3.9 },
  ];
  trustLayers.forEach((layer) => {
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: layer.y, w: 8.4, h: 0.9, fill: { color: C.bgCard }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: layer.y, w: 0.06, h: 0.9, fill: { color: layer.color } });
    s.addText(layer.label, { x: 1.1, y: layer.y + 0.05, w: 0.6, h: 0.35, fontSize: 14, fontFace: "Arial Black", color: layer.color, margin: 0 });
    s.addText(layer.title, { x: 1.8, y: layer.y + 0.05, w: 3.0, h: 0.35, fontSize: 16, fontFace: "Arial", color: C.text, bold: true, margin: 0 });
    s.addText(layer.desc, { x: 1.8, y: layer.y + 0.4, w: 7.0, h: 0.45, fontSize: 11, fontFace: "Arial", color: C.textDim, margin: 0 });
  });
  s.addText("Payment \u2192 Delivery \u2192 Verification loop is self-sustaining", { x: 0.8, y: 5.0, w: 8.4, h: 0.3, fontSize: 13, fontFace: "Arial", color: C.yellow, italic: true, align: "center", margin: 0 });
}

// ── Slide 7: Protocol Stack ──
{
  let s = pres.addSlide();
  s.background = { color: C.bg };
  s.addText("Where ASM Fits", { x: 0.8, y: 0.4, w: 8.4, h: 0.7, fontSize: 36, fontFace: "Arial Black", color: C.blue, bold: true, align: "left", margin: 0 });

  const stack = [
    { proto: "MCP", desc: "\u201Cwhat a tool can do\u201D", status: "\u2705 Solved (Anthropic)", isASM: false },
    { proto: "A2A", desc: "\u201Chow agents communicate\u201D", status: "\u2705 Solved (Google)", isASM: false },
    { proto: "AP2", desc: "\u201Chow to pay safely\u201D", status: "\u2705 Solved (Google)", isASM: false },
    { proto: "ASM", desc: "\u201Cwhat a service is worth\u201D", status: "\U0001F195 ASM + Circle Nanopayments", isASM: true },
  ];
  stack.forEach((item, i) => {
    const y = 1.3 + i * 0.85;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y, w: 8.4, h: 0.7, fill: { color: item.isASM ? "0A2A20" : C.bgCard }, shadow: item.isASM ? makeShadow() : undefined });
    if (item.isASM) s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y, w: 8.4, h: 0.05, fill: { color: C.green } });
    s.addText(item.proto, { x: 1.0, y, w: 1.0, h: 0.7, fontSize: 18, fontFace: "Arial Black", color: item.isASM ? C.green : C.blue, margin: 0, valign: "middle" });
    s.addText(item.desc, { x: 2.2, y, w: 3.0, h: 0.7, fontSize: 14, fontFace: "Arial", color: C.text, margin: 0, valign: "middle" });
    s.addText(item.status, { x: 5.5, y, w: 3.5, h: 0.7, fontSize: 12, fontFace: "Arial", color: item.isASM ? C.green : C.textDim, margin: 0, valign: "middle", align: "right" });
  });
  s.addText("ASM is the missing layer between MCP (capability) and AP2 (payment).", { x: 0.8, y: 4.9, w: 8.4, h: 0.4, fontSize: 15, fontFace: "Arial", color: C.yellow, bold: true, align: "center", margin: 0 });
}

// ── Slide 8: Roadmap ──
{
  let s = pres.addSlide();
  s.background = { color: C.bg };
  s.addText("Roadmap", { x: 0.8, y: 0.4, w: 8.4, h: 0.7, fontSize: 36, fontFace: "Arial Black", color: C.blue, bold: true, align: "left", margin: 0 });

  const milestones = [
    { phase: "Now", items: "14 manifests \u2022 TOPSIS scorer \u2022 MCP Server\nx402 integration \u2022 50+ test transactions", color: C.green, done: true },
    { phase: "Q2 2026", items: "Mainnet deployment \u2022 Automated manifest crawler\nProvider-verified manifests \u2022 LangChain integration", color: C.blue, done: false },
    { phase: "Q3 2026", items: "100+ services \u2022 Trust reputation marketplace\nMulti-chain support (Base, Arbitrum, Arc)", color: C.purple, done: false },
    { phase: "Q4 2026", items: "Agent SDK (Python + TypeScript + Rust)\nDecentralized registry \u2022 Governance token", color: C.yellow, done: false },
  ];

  s.addShape(pres.shapes.RECTANGLE, { x: 2.0, y: 1.4, w: 0.04, h: 3.6, fill: { color: C.border } });
  milestones.forEach((m, i) => {
    const y = 1.3 + i * 0.9;
    s.addShape(pres.shapes.OVAL, { x: 1.88, y: y + 0.15, w: 0.28, h: 0.28, fill: { color: m.done ? m.color : C.bgCard }, line: { color: m.color, width: 2 } });
    s.addText(m.phase, { x: 0.5, y: y + 0.05, w: 1.3, h: 0.5, fontSize: 13, fontFace: "Arial", color: m.color, bold: true, align: "right", margin: 0 });
    s.addText(m.items, { x: 2.5, y, w: 6.5, h: 0.8, fontSize: 12, fontFace: "Arial", color: m.done ? C.text : C.textDim, margin: 0, lineSpacingMultiple: 1.3 });
  });
  s.addText("Open source \u2022 MIT License \u2022 github.com/calebguo007/asm-spec", { x: 0.8, y: 5.0, w: 8.4, h: 0.3, fontSize: 12, fontFace: "Arial", color: C.textDim, align: "center", margin: 0 });
}

// ── Slide 9: Closing ──
{
  let s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: C.blue } });
  s.addShape(pres.shapes.RECTANGLE, { x: 3.3, y: 5.565, w: 3.4, h: 0.06, fill: { color: C.purple } });
  s.addShape(pres.shapes.RECTANGLE, { x: 6.7, y: 5.565, w: 3.3, h: 0.06, fill: { color: C.green } });

  s.addText([
    { text: "OpenAPI describes what a service ", options: { color: C.textDim, fontSize: 20 } },
    { text: "CAN DO", options: { color: C.text, fontSize: 20, bold: true } },
    { text: ".", options: { color: C.textDim, fontSize: 20, breakLine: true } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "ASM describes what a service ", options: { color: C.textDim, fontSize: 20 } },
    { text: "IS WORTH", options: { color: C.green, fontSize: 20, bold: true } },
    { text: ".", options: { color: C.textDim, fontSize: 20, breakLine: true } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "Nanopayments make the evaluation ", options: { color: C.textDim, fontSize: 20 } },
    { text: "SELF-SUSTAINING", options: { color: C.blue, fontSize: 20, bold: true } },
    { text: ".", options: { color: C.textDim, fontSize: 20 } },
  ], { x: 0.8, y: 1.2, w: 8.4, h: 2.5, fontFace: "Georgia", align: "center", margin: 0, lineSpacingMultiple: 1.5 });

  s.addShape(pres.shapes.RECTANGLE, { x: 3.5, y: 3.6, w: 3.0, h: 0.02, fill: { color: C.border } });
  s.addText("ASM \u00D7 Circle Nanopayments", { x: 0.8, y: 3.9, w: 8.4, h: 0.4, fontSize: 18, fontFace: "Arial", color: C.blue, bold: true, align: "center", margin: 0 });
  s.addText([
    { text: "github.com/calebguo007/asm-spec", options: { breakLine: true, color: C.textDim } },
    { text: "Yi Guo  \u2022  @calebguo007", options: { color: C.textDim } },
  ], { x: 0.8, y: 4.4, w: 8.4, h: 0.6, fontSize: 13, fontFace: "Arial", align: "center", margin: 0, lineSpacingMultiple: 1.5 });
}

const outputPath = "/Users/guoyi/Desktop/asm/ASM-Pitch-Deck.pptx";
pres.writeFile({ fileName: outputPath }).then(() => {
  console.log("PPT generated: " + outputPath);
}).catch(err => {
  console.error("Failed:", err);
});
