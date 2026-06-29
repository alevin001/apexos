"use client";

import { useCallback, useState } from "react";

export function useAsyncAction<T>(
  action: () => Promise<T>
): {
  execute: () => Promise<T | undefined>;
  loading: boolean;
  error: string | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [action]);

  return { execute, loading, error };
}
