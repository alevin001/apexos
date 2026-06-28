export type ParsedArtifact = {
  repositoryPath: string;
  frontmatter: Record<string, unknown>;
  body: string;
  externalId: string;
};

export type LinkSpec = {
  sourceTable: string;
  sourceId: string;
  targetRef: string;
  linkType: string;
  tier?: string;
};

export type UpsertResult = {
  table: string;
  externalId: string;
  recordId: string;
  repositoryPath: string;
  architectureLayer: string;
  title: string;
  status: string;
  skipped: boolean;
  links: LinkSpec[];
};

export type IngestReport = {
  ingested: number;
  skipped: number;
  errors: string[];
  registry: UpsertResult[];
};

export type TraceabilityChain = {
  context_spec: string;
  retrieval_request: string;
  evidence_package: string;
  context_package: string;
  interpretation: string;
  recommendation: string;
  outcome_capture: string;
  validation: string;
  learning: string;
};

export type ValidationResult = {
  check: string;
  passed: boolean;
  detail: string;
};

export type ReviewResult = {
  review: string;
  passed: boolean;
  criteria: { criterion: string; result: "PASS" | "FAIL"; notes?: string }[];
};
