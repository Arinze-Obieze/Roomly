import { useEffect, useState } from "react";

export default function useDelayedBoolean(value, delayMs = 180) {
  const [delayedValue, setDelayedValue] = useState(value);

  useEffect(() => {
    if (!value) {
      setDelayedValue(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setDelayedValue(true);
    }, delayMs);

    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return delayedValue;
}
