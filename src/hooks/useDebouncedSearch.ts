import { useEffect, useState } from "react";

interface UseDebouncedSearchOptions {
  delay?: number;
  minLength?: number;
}

export function useDebouncedSearch(
  value: string,
  { delay = 400, minLength = 3 }: UseDebouncedSearchOptions = {}
): string {
  const [debouncedValue, setDebouncedValue] = useState("");

  useEffect(() => {
    const normalized = value.trim();

    if (normalized.length < minLength) {
      setDebouncedValue("");
      return;
    }

    const handler = window.setTimeout(() => {
      setDebouncedValue(normalized);
    }, delay);

    return () => window.clearTimeout(handler);
  }, [value, delay, minLength]);

  return debouncedValue;
}
