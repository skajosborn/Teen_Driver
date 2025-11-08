import "dotenv/config";
import "tsconfig-paths/register";

import { readFile } from "fs/promises";
import path from "path";
import { mapPreferencesToProfile, toAgentVehicleCandidate, type IncomingPreference } from "@/lib/preferences";
import { getTopVehicles } from "@/lib/retrieval";
import { generateRecommendations, type AgentPreference } from "@/lib/agent";

async function loadFixture(filePath: string) {
  const resolved = path.resolve(process.cwd(), filePath);
  const raw = await readFile(resolved, "utf-8");
  return JSON.parse(raw) as {
    description?: string;
    preferences: IncomingPreference[];
    metadata?: Record<string, unknown>;
    limit?: number;
    runAgent?: boolean;
  };
}

function parseArgs() {
  const [, , fixturePath, ...rest] = process.argv;
  if (!fixturePath) {
    console.error("Usage: npm run eval:fixture <path-to-fixture.json> [--no-agent] [--limit=N]");
    process.exit(1);
  }

  const runAgent = !rest.includes("--no-agent");
  const limitFlag = rest.find((flag) => flag.startsWith("--limit="));
  const limit = limitFlag ? Number.parseInt(limitFlag.split("=")[1], 10) : undefined;

  return { fixturePath, runAgent, limit };
}

async function main() {
  try {
    const { fixturePath, runAgent, limit } = parseArgs();
    const fixture = await loadFixture(fixturePath);

    console.log(`\n🧪  Running fixture: ${fixturePath}`);
    if (fixture.description) {
      console.log(`   ${fixture.description}`);
    }

    const { profile, context } = mapPreferencesToProfile(fixture.preferences);
    const topVehicles = await getTopVehicles(profile, fixture.limit ?? limit ?? 4);
    const candidates = topVehicles.map(toAgentVehicleCandidate);

    console.log("\n🎯 Preference profile:");
    console.dir(profile, { depth: null });

    console.log("\n🧠 Context summary:");
    console.dir(context, { depth: null });

    console.log("\n🚗 Top vehicle candidates:");
    candidates.forEach((candidate, index) => {
      console.log(`  ${index + 1}. ${candidate.name} (score: ${candidate.score})`);
    });

    if (!runAgent) {
      console.log("\nSkipping agent call (--no-agent)");
      return;
    }

    const agentPayload = {
      preferences: fixture.preferences as AgentPreference[],
      context,
      candidates,
      metadata: {
        fixture: fixture.metadata?.fixture ?? path.basename(fixturePath, ".json"),
        ...fixture.metadata,
      },
    };

    console.log("\n🤖 Requesting recommendations from agent...");
    const recommendations = await generateRecommendations(agentPayload);
    console.log("\n📦 Agent response:");
    console.log(recommendations.recommendations);
  } catch (error) {
    console.error("Fixture execution failed:", error);
    process.exitCode = 1;
  }
}

void main();

