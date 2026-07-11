import v2 from "./v2.json";
import type {
  DimensionConfig,
  FrameworkConfig,
  ReferenceSource,
} from "./types";

const referenceSources: ReferenceSource[] = [
  { id: "nist-ai-rmf", publisher: "NIST", title: "AI Risk Management Framework 1.0", url: "https://www.nist.gov/itl/ai-risk-management-framework", sourceType: "risk-framework", publicationDate: "2023-01-26", scope: "Organization-wide trustworthy AI governance through Govern, Map, Measure, and Manage." },
  { id: "nist-genai-profile", publisher: "NIST", title: "AI RMF: Generative AI Profile (NIST AI 600-1)", url: "https://doi.org/10.6028/NIST.AI.600-1", sourceType: "risk-framework", publicationDate: "2024-07-26", scope: "Risks unique to or amplified by generative AI and recommended risk treatments." },
  { id: "iso-42001", publisher: "ISO/IEC", title: "ISO/IEC 42001:2023 — AI management systems", url: "https://www.iso.org/standard/42001", sourceType: "standard", publicationDate: "2023-12", scope: "Requirements for establishing and continually improving an AI management system." },
  { id: "iso-42005", publisher: "ISO/IEC", title: "ISO/IEC 42005:2025 — AI system impact assessment", url: "https://www.iso.org/standard/42005", sourceType: "standard", publicationDate: "2025", scope: "Repeatable assessment of intended and unintended impacts of AI systems." },
  { id: "aws-ml-lens", publisher: "AWS", title: "Well-Architected Machine Learning Lens", url: "https://docs.aws.amazon.com/wellarchitected/latest/machine-learning-lens/", sourceType: "architecture-guidance", scope: "Lifecycle and operational practices for traditional machine-learning workloads." },
  { id: "aws-genai-lens", publisher: "AWS", title: "Well-Architected Generative AI Lens", url: "https://docs.aws.amazon.com/wellarchitected/latest/generative-ai-lens/generative-ai-lens.html", sourceType: "architecture-guidance", publicationDate: "2025-11-19", scope: "Secure, reliable, efficient GenAI systems across scoping, model selection, customization, deployment, and improvement." },
  { id: "aws-agentic-lens", publisher: "AWS", title: "Well-Architected Agentic AI Lens", url: "https://docs.aws.amazon.com/wellarchitected/latest/agentic-ai-lens/agentic-ai-lens.html", sourceType: "architecture-guidance", publicationDate: "2026-06-10", scope: "Operational, identity, memory, tool-use, reliability, cost, and governance practices for agentic systems." },
  { id: "aws-responsible-ai", publisher: "AWS", title: "Well-Architected Responsible AI Lens", url: "https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/responsible-ai-lens.html", sourceType: "architecture-guidance", publicationDate: "2025-11-19", scope: "Responsible design and operation of AI workloads." },
  { id: "microsoft-mlops", publisher: "Microsoft", title: "MLOps maturity model", url: "https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/mlops-maturity-model", sourceType: "maturity-model", scope: "Five levels from manual ML delivery to fully automated MLOps." },
  { id: "microsoft-genaiops", publisher: "Microsoft", title: "MLOps and GenAIOps for AI workloads", url: "https://learn.microsoft.com/en-us/azure/well-architected/ai/mlops-genaiops", sourceType: "architecture-guidance", scope: "Evaluation, deployment, monitoring, and continuous improvement for ML and GenAI." },
  { id: "microsoft-agentic", publisher: "Microsoft", title: "Agentic AI adoption maturity model", url: "https://learn.microsoft.com/en-us/agents/adoption-maturity-model/", sourceType: "maturity-model", publicationDate: "2026", scope: "Enterprise progression across agent strategy, value, governance, architecture, operations, and culture." },
  { id: "google-ai-adoption", publisher: "Google Cloud", title: "AI Adoption Framework", url: "https://cloud.google.com/resources/cloud-ai-adoption-framework-whitepaper", sourceType: "maturity-model", scope: "Assessment and evolution of enterprise AI capability." },
  { id: "imda-genai-governance", publisher: "Singapore IMDA / AI Verify Foundation", title: "Model AI Governance Framework for Generative AI", url: "https://www.imda.gov.sg/how-we-can-help/ai-verify", sourceType: "risk-framework", publicationDate: "2024", scope: "Practical GenAI governance, testing, accountability, and ecosystem responsibilities." },
  { id: "owasp-genai-2025", publisher: "OWASP", title: "Top 10 for LLM and GenAI Applications 2025", url: "https://genai.owasp.org/llm-top-10/", sourceType: "risk-framework", publicationDate: "2025", scope: "Application security risks including prompt injection, disclosure, supply chain, poisoning, and excessive agency." },
  { id: "owasp-agentic-2025", publisher: "OWASP", title: "Top 10 for Agentic Applications", url: "https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/", sourceType: "risk-framework", publicationDate: "2025-12-09", scope: "Security risks and mitigations for autonomous and tool-using agents." },
  { id: "mit-future-ready", publisher: "MIT CISR", title: "Pathways to Future Ready", url: "https://cisr.mit.edu/content/classic-topics-future-ready", sourceType: "research", scope: "Digital business transformation through customer experience and operational efficiency." },
  { id: "mckinsey-dq", publisher: "McKinsey & Company", title: "Raising your Digital Quotient", url: "https://www.mckinsey.com/capabilities/strategy-and-corporate-finance/our-insights/raising-your-digital-quotient", sourceType: "research", publicationDate: "2015-06", scope: "Strategy, capabilities, culture, and organization associated with digital performance." },
];

const genAIDimension: DimensionConfig = {
  id: "genai",
  name: "GenAI & Agentic Systems",
  weight: 0,
  includeInOverall: false,
  references: referenceSources.filter((source) => ["nist-genai-profile", "aws-genai-lens", "aws-agentic-lens", "microsoft-agentic", "owasp-genai-2025", "owasp-agentic-2025"].includes(source.id)).map((source) => source.title),
  sourceIds: ["nist-genai-profile", "aws-genai-lens", "aws-agentic-lens", "microsoft-agentic", "microsoft-genaiops", "imda-genai-governance", "owasp-genai-2025", "owasp-agentic-2025"],
  weightingRationale: "Cross-cutting capability module reported separately from Digital Maturity to avoid double-counting strategy, data, governance, talent, and operations.",
  criteria: [
    {
      id: "value_portfolio",
      name: "GenAI Value Portfolio & Product Ownership",
      weight: 1,
      genAIReadinessComponent: "value_strategy",
      targetLevel: 3,
      dependsOn: ["strategy.digital_vision", "strategy.governance_structure"],
      sourceIds: ["microsoft-agentic", "aws-genai-lens", "google-ai-adoption"],
      levels: {
        "1": "Unmanaged employee experimentation with no approved use cases, owners, or value measures.",
        "2": "Isolated pilots exist, but prioritization, product ownership, and benefit measurement are inconsistent.",
        "3": "A governed portfolio selects use cases by value, feasibility, risk, and adoption, with named product owners and outcome metrics.",
        "4": "Reusable capabilities and operating-model changes scale proven use cases across functions, with benefits tracked against cost and risk.",
        "5": "GenAI and agents reshape products and operating models through continuously optimized, evidence-led investment portfolios."
      }
    },
    {
      id: "model_platform",
      name: "Foundation Model & Platform Strategy",
      weight: 1,
      genAIReadinessComponent: "platform_architecture",
      targetLevel: 3,
      dependsOn: ["technology.cloud_maturity", "technology.api_architecture", "technology.platform_engineering"],
      sourceIds: ["aws-genai-lens", "microsoft-genaiops"],
      levels: {
        "1": "Teams use disconnected public tools with no approved model, hosting, integration, or data-boundary strategy.",
        "2": "One or more providers are approved for pilots, but model choice, portability, access, and cost controls are mostly manual.",
        "3": "A managed platform standardizes model access, identity, gateways, model selection, fallbacks, quotas, and environment separation.",
        "4": "The platform supports multi-model routing, reusable services, policy enforcement, resilience, and workload-specific optimization.",
        "5": "A portable, self-optimizing AI platform continuously balances quality, latency, risk, sustainability, and cost across models."
      }
    },
    {
      id: "knowledge_rag",
      name: "Knowledge, RAG & Unstructured Data Readiness",
      weight: 1,
      genAIReadinessComponent: "knowledge_readiness",
      targetLevel: 3,
      dependsOn: ["data_ai.data_quality", "data_ai.data_governance"],
      sourceIds: ["aws-genai-lens", "nist-genai-profile"],
      levels: {
        "1": "Knowledge is fragmented, unowned, stale, and unsuitable for governed retrieval or grounding.",
        "2": "Teams create manual document collections or vector indexes with limited permissions, lineage, quality, and refresh controls.",
        "3": "Priority knowledge has owners, access controls, ingestion pipelines, metadata, lineage, freshness targets, and retrieval evaluation.",
        "4": "Enterprise RAG services provide permission-aware retrieval, hybrid search, provenance, feedback loops, and automated quality monitoring.",
        "5": "Knowledge products are continuously curated and optimized for trusted multimodal grounding across enterprise AI systems."
      }
    },
    {
      id: "genaiops_evaluation",
      name: "GenAIOps, Evaluation & Observability",
      weight: 1,
      genAIReadinessComponent: "genai_operations",
      targetLevel: 3,
      dependsOn: ["data_ai.mlops_maturity", "operations.devops_maturity", "genai.model_platform"],
      sourceIds: ["aws-genai-lens", "microsoft-genaiops", "nist-genai-profile"],
      levels: {
        "1": "Prompts and configurations are changed manually with no repeatable evaluation, tracing, or production quality measures.",
        "2": "Teams maintain basic prompt versions and ad hoc test sets, but release gates and production telemetry are inconsistent.",
        "3": "Versioned prompts, models, retrieval and policies pass automated task, safety, latency, and cost evaluations before release.",
        "4": "End-to-end traces, online evaluation, drift detection, red-teaming, canaries, and feedback drive controlled improvement.",
        "5": "Continuous evaluation and policy-based optimization safely tune model, context, prompt, and routing choices against business outcomes."
      }
    },
    {
      id: "security_safety",
      name: "GenAI Security, Safety & Content Provenance",
      weight: 1,
      genAIReadinessComponent: "trust_security",
      targetLevel: 3,
      dependsOn: ["ai_governance.risk_management", "ai_governance.compliance_framework"],
      sourceIds: ["nist-genai-profile", "owasp-genai-2025", "imda-genai-governance", "iso-42001", "iso-42005"],
      levels: {
        "1": "No GenAI-specific controls exist for sensitive data, harmful output, prompt injection, IP, or third-party models.",
        "2": "Acceptable-use rules and manual reviews exist, but threat modeling, testing, provenance, and incident handling are limited.",
        "3": "Risk-tiered controls cover privacy, security testing, prompt injection, output safety, human review, provenance, vendors, and incidents.",
        "4": "Automated guardrails, adversarial testing, continuous control monitoring, impact assessment, and audit evidence cover the lifecycle.",
        "5": "Trust controls adapt continuously to models, threats, regulation, and observed harms with independent assurance and transparent reporting."
      }
    },
    {
      id: "workforce_oversight",
      name: "Workforce Adoption & Human Oversight",
      weight: 1,
      genAIReadinessComponent: "adoption_oversight",
      targetLevel: 3,
      dependsOn: ["culture.digital_literacy", "culture.change_readiness"],
      sourceIds: ["microsoft-agentic", "nist-genai-profile", "iso-42001"],
      levels: {
        "1": "GenAI use is hidden or prohibited without role guidance, training, oversight, or workflow redesign.",
        "2": "General awareness and voluntary training exist, but adoption, review responsibilities, and job impacts remain unclear.",
        "3": "Role-based enablement, approved workflows, human-review rules, communities of practice, and adoption measures are established.",
        "4": "Work is systematically redesigned around human-AI collaboration with capability pathways, quality assurance, and workforce planning.",
        "5": "Human and AI roles evolve continuously using outcome, skill, trust, and employee-experience evidence."
      }
    },
    {
      id: "agentic_controls",
      name: "Agentic Autonomy, Identity & Tool Controls",
      weight: 1,
      genAIReadinessComponent: "agentic_readiness",
      targetLevel: 2,
      dependsOn: ["genai.genaiops_evaluation", "genai.security_safety", "technology.api_architecture"],
      sourceIds: ["aws-agentic-lens", "owasp-agentic-2025", "microsoft-agentic"],
      levels: {
        "1": "Agents are absent or experimental scripts act with shared credentials, broad permissions, and no reliable audit trail.",
        "2": "Agents operate in constrained pilots with manual approval, limited tools, and basic action logging.",
        "3": "Each agent has scoped identity, least-privilege tools, action limits, memory controls, approval gates, tracing, and kill switches.",
        "4": "Policy engines, behavioral monitoring, simulation, recovery, and multi-agent controls manage autonomous workflows at scale.",
        "5": "Autonomy is dynamically risk-adjusted using verified behavior, continuous assurance, accountable ownership, and resilient orchestration."
      }
    }
  ]
};

const base = structuredClone(v2) as FrameworkConfig;

const coreSourceIds: Record<string, string[]> = {
  strategy: ["mckinsey-dq", "google-ai-adoption", "microsoft-agentic", "iso-42001"],
  technology: ["mckinsey-dq", "google-ai-adoption", "aws-ml-lens", "aws-genai-lens"],
  data_ai: ["aws-ml-lens", "aws-genai-lens", "microsoft-mlops", "microsoft-genaiops", "google-ai-adoption"],
  ai_governance: ["nist-ai-rmf", "nist-genai-profile", "iso-42001", "iso-42005", "aws-responsible-ai", "imda-genai-governance", "owasp-genai-2025"],
  culture: ["mckinsey-dq", "mit-future-ready", "google-ai-adoption", "microsoft-agentic"],
  operations: ["mit-future-ready", "mckinsey-dq", "microsoft-mlops", "microsoft-genaiops"],
  customer: ["mit-future-ready", "mckinsey-dq", "google-ai-adoption"],
};

const coreDimensions = base.dimensions.map((dimension) => {
  const sourceIds = coreSourceIds[dimension.id] ?? [];
  return {
    ...dimension,
    sourceIds,
    references: sourceIds.map(
      (sourceId) => referenceSources.find((source) => source.id === sourceId)!.title
    ),
  };
});

export const v3: FrameworkConfig = {
  ...base,
  version: "3.0",
  name: "Digital, AI & GenAI Maturity Framework",
  description: "A source-traceable enterprise maturity framework with seven core digital dimensions, an explicit GenAI and agentic capability module, separate AI and GenAI readiness scores, evidence confidence, target levels, and dependency-aware roadmaps.",
  versionNotes: "Adds GenAI and agentic readiness as a cross-cutting eighth assessment section excluded from the core Digital Maturity aggregate; replaces generic reference links with a structured primary-source ledger; introduces recommended target levels distinct from empirical benchmarks.",
  dimensions: [...coreDimensions, genAIDimension],
  genAIReadinessComponents: [
    { id: "value_strategy", name: "Value Strategy", sourceDimension: "genai", weight: 1.25, description: "Governed portfolio, product ownership, adoption, and measurable business outcomes." },
    { id: "platform_architecture", name: "Platform Architecture", sourceDimension: "genai", weight: 1, description: "Managed foundation-model access, integration, resilience, portability, and cost control." },
    { id: "knowledge_readiness", name: "Knowledge Readiness", sourceDimension: "genai", weight: 1.25, description: "Governed unstructured knowledge, RAG, retrieval quality, lineage, and freshness." },
    { id: "genai_operations", name: "GenAIOps & Evaluation", sourceDimension: "genai", weight: 1.25, description: "Repeatable evaluation, release controls, observability, red-teaming, and improvement." },
    { id: "trust_security", name: "Trust & Security", sourceDimension: "genai", weight: 1.5, description: "Security, safety, privacy, impact assessment, provenance, and lifecycle assurance." },
    { id: "adoption_oversight", name: "Adoption & Oversight", sourceDimension: "genai", weight: 1, description: "Role-based enablement, human oversight, workflow redesign, and workforce planning." },
    { id: "agentic_readiness", name: "Agentic Readiness", sourceDimension: "genai", weight: 1, description: "Scoped identity, tool permissions, memory, approvals, monitoring, and controlled autonomy." }
  ],
  referenceSources,
  referenceFrameworks: Object.fromEntries(referenceSources.map((source) => [`${source.publisher} — ${source.title}`, source.url])),
};

export default v3;
