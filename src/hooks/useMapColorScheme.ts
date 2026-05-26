import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/** Resolves map tiles to light or dark from app theme (system / user preference). */
export function useMapColorScheme(): "light" | "dark" {
  const { resolvedTheme } = useTheme();
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  if (resolvedTheme === "dark") return "dark";
  if (resolvedTheme === "light") return "light";
  return systemPrefersDark ? "dark" : "light";
}
