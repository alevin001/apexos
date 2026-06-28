import { readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { REPO_ROOT } from "../shared/config.js";
import { fetchRegistry } from "../shared/supabase.js";
import type { IngestReport, LinkSpec } from "../shared/types.js";
import { parseFrontmatterFile } from "./parse-frontmatter.js";
import { detectTableMapping } from "./map-artifact.js";
import {
  upsertArtifact,
  registerArtifact,
  buildSlugMaps,
  upsertRelationshipParticipants,
  uploadKnowledgeBinary,
} from "./upsert.js";
import { resolvePendingLinks, backfillPipelineLinks } from "./resolve-links.js";

type Manifest = { ingestion_order: string[] };

export async function ingestScenario(scenarioSlug: string): Promise<IngestReport> {
  const scenarioDir = join(REPO_ROOT, "scenarios", scenarioSlug);
  const manifestPath = join(scenarioDir, "manifest.json");

  if (!existsSync(manifestPath)) {
    throw new Error(`Scenario manifest not found: ${manifestPath}`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as Manifest;
  const report: IngestReport = { ingested: 0, skipped: 0, errors: [], registry: [] };
  const pendingLinks: LinkSpec[] = [];

  let registry = await fetchRegistry();
  let slugs = await buildSlugMaps();

  for (const relPath of manifest.ingestion_order) {
    const absPath = join(scenarioDir, relPath);
    const repositoryPath = relative(REPO_ROOT, absPath).replace(/\\/g, "/");

    try {
      const artifact = parseFrontmatterFile(absPath, repositoryPath);
      const mapping = detectTableMapping(artifact);

      const result = await upsertArtifact(artifact, registry, slugs, pendingLinks);

      if (result.skipped) {
        report.skipped++;
      } else {
        report.ingested++;
        await registerArtifact(artifact, result.table, result.recordId, mapping);

        if (result.table === "relationships") {
          await upsertRelationshipParticipants(artifact, result.recordId, slugs);
        }
        if (result.table === "knowledge_sources") {
          await uploadKnowledgeBinary(artifact, result.recordId, REPO_ROOT);
        }

        if (["persons", "situations", "relationships"].includes(result.table)) {
          slugs = await buildSlugMaps();
        }
      }

      registry = await fetchRegistry();
    } catch (err) {
      report.errors.push(`${relPath}: ${(err as Error).message}`);
    }
  }

  await backfillPipelineLinks();

  const linkResult = await resolvePendingLinks(pendingLinks);
  if (linkResult.unresolved.length > 0) {
    console.warn(`[links] ${linkResult.unresolved.length} unresolved:`);
    linkResult.unresolved.slice(0, 10).forEach((u) => console.warn(`  - ${u}`));
  }
  console.log(`[links] Created ${linkResult.created} artifact links`);

  return report;
}
