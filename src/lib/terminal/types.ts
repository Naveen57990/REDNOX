export type LineKind = "out" | "dim" | "ok" | "warn" | "err" | "cyan" | "title";

export interface Line {
  t: string;
  c?: LineKind;
}

export interface ExecResult {
  out: Line[];
  cwd?: string;
  clear?: boolean;
  running?: string[];
}