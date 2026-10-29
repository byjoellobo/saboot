import { useEffect, useState } from "react";

export type Step = "details" | "records" | "devices" | "generate" | "log";

export type Route =
  | { readonly name: "home" }
  | { readonly name: "learn" }
  | { readonly name: "case"; readonly id: string; readonly step: Step };

const STEPS: readonly Step[] = ["details", "records", "devices", "generate", "log"];

function isStep(value: string | undefined): value is Step {
  return STEPS.some((s) => s === value);
}

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "learn") return { name: "learn" };
  if (parts[0] === "case" && parts[1]) {
    let id: string;
    try {
      id = decodeURIComponent(parts[1]);
    } catch {
      return { name: "home" };
    }
    return { name: "case", id, step: isStep(parts[2]) ? parts[2] : "details" };
  }
  return { name: "home" };
}

export function href(route: Route): string {
  switch (route.name) {
    case "home":
      return "#/";
    case "learn":
      return "#/learn";
    case "case":
      return `#/case/${encodeURIComponent(route.id)}/${route.step}`;
  }
}

export function navigate(route: Route): void {
  window.location.hash = href(route);
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
