import { FrameworkConfig } from "./types";
import v1 from "./v1.json";
import v2 from "./v2.json";

const configs: Record<string, FrameworkConfig> = {
  "v1.0": v1 as FrameworkConfig,
  "v2.0": v2 as FrameworkConfig,
};

export function loadFramework(version: string = "v2.0"): FrameworkConfig {
  const config = configs[version];
  if (!config) throw new Error(`Framework version ${version} not found`);
  return config;
}

export function getActiveFrameworkVersion(): string {
  return "v2.0";
}

export function getDimensionById(config: FrameworkConfig, dimensionId: string) {
  return config.dimensions.find((d) => d.id === dimensionId);
}

export function getCriteriaByAIReadinessComponent(
  config: FrameworkConfig,
  componentId: string
) {
  return config.dimensions.flatMap((d) =>
    d.criteria
      .filter((c) => c.aiReadinessComponent === componentId)
      .map((c) => ({ ...c, dimensionId: d.id, dimensionName: d.name }))
  );
}
