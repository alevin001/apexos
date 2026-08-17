/**
 * Build 19 Checkpoint G — staging-root path safety.
 * Reject escapes; never follow symlinks outside the declared root.
 */
import { promises as fs } from "node:fs";
import { isAbsolute, normalize, relative, resolve, sep } from "node:path";

export class PathEscapeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathEscapeError";
  }
}

/** True when candidate resolves inside root (after normalize). */
export function isPathInsideRoot(rootPath: string, candidatePath: string): boolean {
  const root = resolve(rootPath);
  const candidate = resolve(root, candidatePath);
  const rel = relative(root, candidate);
  if (!rel && candidate === root) return true;
  return Boolean(rel) && !rel.startsWith("..") && !isAbsolute(rel);
}

/**
 * Resolve a path under root or throw. Does not follow the final path for existence.
 */
export function resolveUnderRoot(rootPath: string, relativeOrAbsolute: string): string {
  const root = resolve(rootPath);
  const candidate = isAbsolute(relativeOrAbsolute)
    ? resolve(relativeOrAbsolute)
    : resolve(root, relativeOrAbsolute);
  if (!isPathInsideRoot(root, candidate)) {
    throw new PathEscapeError(
      `Path escape refused: “${relativeOrAbsolute}” is outside declared staging root “${root}”.`
    );
  }
  return candidate;
}

/**
 * Ensure realpath of candidate stays under realpath of root (symlink escape guard).
 */
export async function assertRealPathInsideRoot(
  rootPath: string,
  absolutePath: string
): Promise<string> {
  const root = resolve(rootPath);
  let rootReal: string;
  try {
    rootReal = await fs.realpath(root);
  } catch {
    rootReal = root;
  }

  let candidateReal: string;
  try {
    candidateReal = await fs.realpath(absolutePath);
  } catch {
    // Missing target — still require lexical containment of the absolute path
    if (!isPathInsideRoot(root, absolutePath)) {
      throw new PathEscapeError(
        `Path escape refused: “${absolutePath}” is outside declared staging root.`
      );
    }
    return absolutePath;
  }

  const rel = relative(rootReal, candidateReal);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new PathEscapeError(
      `Symlink escape refused: “${absolutePath}” resolves to “${candidateReal}” outside staging root “${rootReal}”.`
    );
  }
  return candidateReal;
}

/** Named deterministic system/sidecar exclusion rule. */
export const SYSTEM_SIDECAR_EXCLUSION_RULE = "build19-system-sidecar-v1" as const;

const EXCLUDED_NAMES = new Set([
  ".ds_store",
  "thumbs.db",
  "desktop.ini",
  "readme.md",
  ".gitkeep",
]);

export function matchSystemSidecarExclusion(filename: string): {
  excluded: boolean;
  rule: typeof SYSTEM_SIDECAR_EXCLUSION_RULE;
  reason: string;
} | null {
  const lower = filename.toLowerCase();
  if (
    EXCLUDED_NAMES.has(lower) ||
    lower.endsWith(".meta.md") ||
    lower.endsWith(".manifest.json")
  ) {
    return {
      excluded: true,
      rule: SYSTEM_SIDECAR_EXCLUSION_RULE,
      reason: `Excluded under named rule ${SYSTEM_SIDECAR_EXCLUSION_RULE}: system/sidecar/inventory noise (“${filename}”) — visibly recorded, never silently ignored.`,
    };
  }
  return null;
}

export function normalizeIntakeRelative(root: string, absolutePath: string): string {
  return relative(resolve(root), resolve(absolutePath)).split(sep).join("/");
}
