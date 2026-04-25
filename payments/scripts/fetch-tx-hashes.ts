/**
 * Fetch on-chain Arc Testnet transaction hashes for the 50 nanopayments.
 *
 * Why this exists:
 * Circle Gateway batches off-chain payment authorizations and settles them
 * in bulk on-chain. The benchmark JSON stores Circle Gateway *transfer IDs*
 * (UUIDs), not raw Arc tx hashes. This script asks Circle's Gateway API
 * for each transfer's on-chain settlement hash so we can produce a clean
 * "Live on Arc Testnet" link table for the README.
 *
 * Usage:
 *   npx tsx scripts/fetch-tx-hashes.ts                       # uses latest result-*.json
 *   npx tsx scripts/fetch-tx-hashes.ts payments/benchmark/result-2026-04-24.json
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { loadConfig } from "../src/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPLORER_BASE = "https://testnet.arcscan.app/tx/";

async function main() {
  const config = loadConfig();
  const { GatewayClient } = await import("@circle-fin/x402-batching/client");
  const gateway = new GatewayClient({
    chain: config.chainName as any,
    privateKey: config.buyerPrivateKey as `0x${string}`,
  });

  const inputArg = process.argv[2];
  const benchDir = path.resolve(__dirname, "..", "benchmark");
  const jsonFile = inputArg
    ? path.resolve(inputArg)
    : path.join(benchDir, "result-2026-04-24.json");

  console.log(`📂 Reading: ${jsonFile}`);
  const data = JSON.parse(fs.readFileSync(jsonFile, "utf-8"));
  const tasks: Array<{ id: number; category: string; txHash?: string; status?: string }> =
    data.tasks || [];

  console.log(`🔎 Looking up ${tasks.length} Gateway transfer IDs via Circle API...\n`);

  const results: Array<{
    id: number;
    category: string;
    transferId: string;
    onchainHash?: string;
    explorerLink?: string;
    status: string;
  }> = [];

  // Try GatewayClient.searchTransfers first — single API call gets all transfers
  let searchTransfers: any[] = [];
  try {
    const search = await gateway.searchTransfers({
      from: gateway.address,
      pageSize: 100,
    } as any);
    searchTransfers = search.transfers || [];
    console.log(`✅ Circle API returned ${searchTransfers.length} transfers for buyer ${gateway.address}\n`);

    // 🔍 DUMP RAW SHAPE of first transfer so we can find the right field name
    if (searchTransfers.length > 0) {
      console.log("🔍 RAW SHAPE of first transfer from searchTransfers:");
      console.log("    Keys:", Object.keys(searchTransfers[0]).join(", "));
      console.log("    Full JSON:");
      console.log(JSON.stringify(searchTransfers[0], null, 2));

      // ALSO try getTransferById — single-record endpoint sometimes returns more fields
      try {
        const single = await (gateway as any).getTransferById(searchTransfers[0].id);
        console.log("\n🔍 RAW SHAPE of same transfer from getTransferById:");
        console.log("    Keys:", Object.keys(single).join(", "));
        console.log("    Full JSON:");
        console.log(JSON.stringify(single, null, 2));
      } catch (err) {
        console.log("\n⚠️ getTransferById failed:", (err instanceof Error ? err.message : String(err)));
      }
      console.log("");
    }
  } catch (err: unknown) {
    console.warn(`⚠️  searchTransfers failed: ${(err instanceof Error ? err.message : String(err))}`);
    console.warn("   Falling back to per-ID lookup via getTransferById...\n");
  }

  // Build a lookup map: transferId → transfer record from Circle
  const byId = new Map<string, any>();
  for (const t of searchTransfers) {
    if (t?.id) byId.set(t.id, t);
  }

  for (const task of tasks) {
    const tid = task.txHash;
    if (!tid) {
      results.push({
        id: task.id,
        category: task.category,
        transferId: "(missing)",
        status: "no-id",
      });
      continue;
    }

    let transfer = byId.get(tid);
    if (!transfer) {
      // Fallback: ask Circle directly for this transfer
      try {
        transfer = await (gateway as any).getTransferById(tid);
      } catch (err: unknown) {
        results.push({
          id: task.id,
          category: task.category,
          transferId: tid,
          status: `lookup-failed: ${(err instanceof Error ? err.message : String(err))}`,
        });
        continue;
      }
    }

    // Different Circle response shapes — try common fields for the on-chain hash.
    const onchain =
      transfer?.transactionHash ||
      transfer?.txHash ||
      transfer?.onChainTxHash ||
      transfer?.recipientTxHash ||
      transfer?.sourceTxHash ||
      transfer?.destinationTxHash ||
      transfer?.settlement?.transactionHash ||
      transfer?.settlement?.txHash;

    results.push({
      id: task.id,
      category: task.category,
      transferId: tid,
      onchainHash: onchain,
      explorerLink: onchain ? `${EXPLORER_BASE}${onchain}` : undefined,
      status: transfer?.status || "unknown",
    });
  }

  // Print pretty table
  console.log("📋 Results\n");
  for (const r of results.slice(0, 10)) {
    if (r.explorerLink) {
      console.log(`  ✅ #${String(r.id).padStart(2, "0")} ${r.category.padEnd(11)} ${r.status.padEnd(10)} ${r.explorerLink}`);
    } else {
      console.log(`  ⏳ #${String(r.id).padStart(2, "0")} ${r.category.padEnd(11)} ${r.status.padEnd(10)} (transfer-id: ${r.transferId.slice(0, 12)}…)`);
    }
  }
  if (results.length > 10) console.log(`  …and ${results.length - 10} more`);

  // Save full results to a file for the README
  const outFile = path.join(benchDir, "tx-hashes-2026-04-24.json");
  fs.writeFileSync(outFile, JSON.stringify({
    runDate: data.runDate,
    chain: data.chain,
    network: data.network,
    explorerBase: EXPLORER_BASE,
    buyer: gateway.address,
    fetchedAt: new Date().toISOString(),
    results,
  }, null, 2));
  console.log(`\n💾 Saved full results → ${outFile}`);

  const settled = results.filter((r) => r.onchainHash).length;
  const total = results.length;
  console.log(`\n📊 Summary: ${settled}/${total} have on-chain hashes available.`);
  if (settled === 0) {
    console.log(`\n⚠️  Zero on-chain hashes returned. This means either:`);
    console.log(`   • Circle hasn't batched-and-settled these yet (try again in a few hours)`);
    console.log(`   • The transfer record uses a different field name for the hash`);
    console.log(`     → Inspect raw shape: see tx-hashes-2026-04-24.json`);
    console.log(`   • The Gateway API needs an API key (set CIRCLE_API_KEY in .env)`);
  } else if (settled >= 5) {
    console.log(`\n✅ Pick the 5 cleanest — paste those URLs into your team-lead reply.`);
  }
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
