import { useEffect, useState } from "react";
import {
  getBuilderMarketplace,
  getProjectMarketplace,
  type BuilderMarketplaceCard,
  type ProjectMarketplaceCard,
  type BuilderMarketplaceParams,
  type ProjectMarketplaceParams,
} from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";

export function useBuilderMarketplace(initialParams: BuilderMarketplaceParams = {}) {
  const [params, setParams] = useState<BuilderMarketplaceParams>(initialParams);
  const [data, setData] = useState<BuilderMarketplaceCard[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setStatus("loading");
      setError(null);
      try {
        const results = await getBuilderMarketplace(params);
        if (!cancelled) {
          setData(results);
          setStatus("success");
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message || "Failed to load builders");
          setStatus("error");
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(params)]);

  return {
    data,
    status,
    error,
    params,
    setParams,
    isLoading: status === "loading",
  };
}

export function useProjectMarketplace(initialParams: ProjectMarketplaceParams = {}) {
  const [params, setParams] = useState<ProjectMarketplaceParams>(initialParams);
  const [data, setData] = useState<ProjectMarketplaceCard[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setStatus("loading");
      setError(null);
      try {
        const results = await getProjectMarketplace(params);
        if (!cancelled) {
          setData(results);
          setStatus("success");
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message || "Failed to load projects");
          setStatus("error");
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(params)]);

  return {
    data,
    status,
    error,
    params,
    setParams,
    isLoading: status === "loading",
  };
}

