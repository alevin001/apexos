import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import type { ParsedArtifact } from "../shared/types.js";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

export function parseFrontmatterFile(filePath: string, repositoryPath: string): ParsedArtifact {
  const raw = readFileSync(filePath, "utf-8");
  return parseFrontmatterContent(raw, repositoryPath);
}

export function parseFrontmatterContent(raw: string, repositoryPath: string): ParsedArtifact {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    throw new Error(`No YAML frontmatter found in ${repositoryPath}`);
  }

  const frontmatter = parseYaml(match[1]) as Record<string, unknown>;
  const body = match[2].trim();
  const externalId = String(frontmatter.id ?? frontmatter.external_id ?? "");
  if (!externalId) {
    throw new Error(`Missing id in frontmatter: ${repositoryPath}`);
  }

  return { repositoryPath, frontmatter, body, externalId };
}

export function isMarkdownArtifact(path: string): boolean {
  return path.endsWith(".md") && !path.endsWith("INDEX.md");
}

export function isKnowledgeMeta(path: string): boolean {
  return path.endsWith(".meta.md");
}
