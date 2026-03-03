import * as React from "react";
import { useEffect, useState } from "react";

interface UseDebouncedSearchOptions {
  delay?: number;
  minLength?: number;
}

export function useDebouncedSearch(
  value: string,
  { delay = 400, minLength = 2 }: UseDebouncedSearchOptions = {},
): string {
  const [debouncedValue, setDebouncedValue] = useState("");
  const prevValueRef = React.useRef(value);

  useEffect(() => {
    const normalized = value.trim();
    const prevValue = prevValueRef.current.trim();
    prevValueRef.current = value;

    // Aggressive debounce for deletion: if the new value is shorter than the previous one,
    // we use a longer delay (e.g., 800ms) to prevent excessive requests while backspacing.
    const isDeleting = normalized.length < prevValue.length;
    const finalDelay = isDeleting ? Math.max(delay, 800) : delay;

    if (normalized.length < minLength) {
      setDebouncedValue("");
      return;
    }

    const handler = window.setTimeout(() => {
      setDebouncedValue(normalized);
    }, finalDelay);

    return () => window.clearTimeout(handler);
  }, [value, delay, minLength]);

  return debouncedValue;
}
