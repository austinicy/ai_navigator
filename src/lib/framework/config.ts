import { FrameworkConfig } from "./types";
import v1 from "./v1.json";

const configs: Record<string, FrameworkConfig> = {
  "v1.0": v1 as FrameworkConfig,
};

export function loadFramework(version: string = "v1.0"): FrameworkConfig {
  const config = configs[version];
  if (!config) throw new Error(`Framework version ${version} not found`);
  return config;
}

export function getActiveFrameworkVersion(): string {
  return "v1.0";
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
