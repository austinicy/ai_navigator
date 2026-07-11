import { AssessmentSession, DimensionAssessment, AIReadinessBreakdown } from "../assessment/types";
import type { Roadmap } from "../roadmap/types";

const demoDimensionScores: Record<string, DimensionAssessment> = {
  strategy: {
    dimensionId: "strategy",
    score: 3.2,
    confidence: 0.85,
    evidence: [
      { id: "e1", text: "Digital transformation strategy published in 2024", source: "conversation", dimensionId: "strategy", criterionId: "digital_vision", timestamp: Date.now() },
      { id: "e2", text: "CTO sponsors transformation program", source: "conversation", dimensionId: "strategy", criterionId: "executive_sponsorship", timestamp: Date.now() },
      { id: "e3", text: "Annual digital budget of $2M allocated", source: "conversation", dimensionId: "strategy", criterionId: "investment_commitment", timestamp: Date.now() },
    ],
    gaps: ["No formal governance structure for transformation decisions"],
    criterionScores: { digital_vision: 4, executive_sponsorship: 3, investment_commitment: 3, governance_structure: 2 },
    criterionConfidence: { digital_vision: 1, executive_sponsorship: 1, investment_commitment: 1, governance_structure: 1 },
  },
  technology: {
    dimensionId: "technology",
    score: 2.8,
    confidence: 0.8,
    evidence: [
      { id: "e4", text: "60% workloads migrated to AWS", source: "conversation", dimensionId: "technology", criterionId: "cloud_maturity", timestamp: Date.now() },
      { id: "e5", text: "Legacy ERP system still on-premises", source: "conversation", dimensionId: "technology", criterionId: "tech_debt_management", timestamp: Date.now() },
      { id: "e6", text: "No API gateway or service mesh", source: "conversation", dimensionId: "technology", criterionId: "api_architecture", timestamp: Date.now() },
    ],
    gaps: ["Legacy system modernization", "API architecture needs overhaul", "No infrastructure automation"],
    criterionScores: { cloud_maturity: 3, tech_debt_management: 2, api_architecture: 2, infra_automation: 3, platform_engineering: 2 },
    criterionConfidence: { cloud_maturity: 1, tech_debt_management: 1, api_architecture: 1, infra_automation: 1, platform_engineering: 1 },
  },
  data_ai: {
    dimensionId: "data_ai",
    score: 2.1,
    confidence: 0.75,
    evidence: [
      { id: "e7", text: "Data warehouse exists but data quality is inconsistent", source: "conversation", dimensionId: "data_ai", criterionId: "data_quality", timestamp: Date.now() },
      { id: "e8", text: "Two ML models in production for demand forecasting", source: "conversation", dimensionId: "data_ai", criterionId: "ml_ai_adoption", timestamp: Date.now() },
      { id: "e9", text: "No formal data governance policy", source: "conversation", dimensionId: "data_ai", criterionId: "data_governance", timestamp: Date.now() },
    ],
    gaps: ["Data quality and accessibility", "No MLOps pipeline", "Data governance missing"],
    criterionScores: { data_quality: 2, data_governance: 1, analytics_maturity: 3, ml_ai_adoption: 2, mlops_maturity: 2 },
    criterionConfidence: { data_quality: 1, data_governance: 1, analytics_maturity: 1, ml_ai_adoption: 1, mlops_maturity: 1 },
  },
  ai_governance: {
    dimensionId: "ai_governance",
    score: 1.5,
    confidence: 0.7,
    evidence: [
      { id: "e10", text: "No responsible AI policy in place", source: "conversation", dimensionId: "ai_governance", criterionId: "responsible_ai_policy", timestamp: Date.now() },
      { id: "e11", text: "Basic GDPR compliance but no AI-specific compliance", source: "conversation", dimensionId: "ai_governance", criterionId: "compliance_framework", timestamp: Date.now() },
      { id: "e12", text: "No model monitoring or bias detection", source: "conversation", dimensionId: "ai_governance", criterionId: "model_monitoring", timestamp: Date.now() },
    ],
    gaps: ["No responsible AI policy", "No model monitoring", "No AI risk management"],
    criterionScores: { responsible_ai_policy: 1, risk_management: 1, compliance_framework: 2, model_monitoring: 1 },
    criterionConfidence: { responsible_ai_policy: 1, risk_management: 1, compliance_framework: 1, model_monitoring: 1 },
  },
  culture: {
    dimensionId: "culture",
    score: 3.5,
    confidence: 0.8,
    evidence: [
      { id: "e13", text: "Innovation lab established with quarterly hackathons", source: "conversation", dimensionId: "culture", criterionId: "innovation_culture", timestamp: Date.now() },
      { id: "e14", text: "Digital literacy training program launched", source: "conversation", dimensionId: "culture", criterionId: "digital_literacy", timestamp: Date.now() },
      { id: "e15", text: "Struggling to hire ML engineers", source: "conversation", dimensionId: "culture", criterionId: "ai_talent_strategy", timestamp: Date.now() },
    ],
    gaps: ["ML talent acquisition", "Change management maturity"],
    criterionScores: { digital_literacy: 4, change_readiness: 3, innovation_culture: 4, ai_talent_strategy: 2 },
    criterionConfidence: { digital_literacy: 1, change_readiness: 1, innovation_culture: 1, ai_talent_strategy: 1 },
  },
  operations: {
    dimensionId: "operations",
    score: 2.5,
    confidence: 0.75,
    evidence: [
      { id: "e16", text: "Core processes partially digitized", source: "conversation", dimensionId: "operations", criterionId: "process_digitization", timestamp: Date.now() },
      { id: "e17", text: "CI/CD pipeline for web apps but not for ML", source: "conversation", dimensionId: "operations", criterionId: "devops_maturity", timestamp: Date.now() },
      { id: "e18", text: "Some RPA for invoice processing", source: "conversation", dimensionId: "operations", criterionId: "automation_level", timestamp: Date.now() },
    ],
    gaps: ["Process digitization incomplete", "No ML deployment pipeline", "Delivery agility limited"],
    criterionScores: { process_digitization: 3, automation_level: 2, delivery_agility: 2, devops_maturity: 3 },
    criterionConfidence: { process_digitization: 1, automation_level: 1, delivery_agility: 1, devops_maturity: 1 },
  },
  customer: {
    dimensionId: "customer",
    score: 3.0,
    confidence: 0.75,
    evidence: [
      { id: "e19", text: "Mobile app and web portal launched", source: "conversation", dimensionId: "customer", criterionId: "digital_channels", timestamp: Date.now() },
      { id: "e20", text: "Basic personalization using customer segments", source: "conversation", dimensionId: "customer", criterionId: "personalization", timestamp: Date.now() },
      { id: "e21", text: "NPS surveys conducted quarterly", source: "conversation", dimensionId: "customer", criterionId: "feedback_loops", timestamp: Date.now() },
    ],
    gaps: ["Journey orchestration missing", "AI-powered CX not implemented"],
    criterionScores: { digital_channels: 4, personalization: 2, journey_orchestration: 2, feedback_loops: 3 },
    criterionConfidence: { digital_channels: 1, personalization: 1, journey_orchestration: 1, feedback_loops: 1 },
  },
};

const demoAIReadiness: AIReadinessBreakdown = {
  score: 28,
  components: {
    ai_strategy: 40,
    data_readiness: 20,
    infrastructure_readiness: 35,
    talent_readiness: 30,
    governance_readiness: 10,
    operational_readiness: 25,
  },
};

const demoRoadmap: Roadmap = {
  orgName: "Acme Corporation",
  industry: "Manufacturing",
  overallScore: 2.7,
  aiReadinessScore: 28,
  generatedAt: Date.now(),
  criticalGaps: [
    "Responsible AI policy and model monitoring are not yet in place.",
    "Data quality and governance gaps limit scalable AI use cases.",
    "Legacy ERP and API architecture constrain process automation.",
  ],
  quickWins: [
    {
      id: "qw-data-quality",
      title: "Stand up a data quality scorecard",
      description: "Track completeness, accuracy, and freshness for the highest-value production and customer datasets.",
      dimensionId: "data_ai",
      effort: "low",
      impact: "high",
      urgency: "high",
      successMetrics: ["Top 10 datasets have named owners", "Weekly quality dashboard reviewed by data council"],
    },
    {
      id: "qw-ai-policy",
      title: "Publish interim responsible AI guardrails",
      description: "Create lightweight rules for approved AI use, human review, data privacy, and vendor model evaluation.",
      dimensionId: "ai_governance",
      effort: "low",
      impact: "high",
      urgency: "high",
      successMetrics: ["Policy approved by legal and technology leadership", "All active AI pilots registered"],
    },
  ],
  phases: [
    {
      id: "phase-1",
      name: "Stabilize Foundations",
      timeframe: "0-90 days",
      description: "Close governance and data reliability gaps before expanding AI pilots.",
      actions: [
        {
          id: "policy-baseline",
          title: "Launch responsible AI baseline",
          description: "Define risk tiers, review gates, model owner responsibilities, and minimum monitoring expectations.",
          dimensionId: "ai_governance",
          effort: "medium",
          impact: "high",
          urgency: "high",
          successMetrics: ["Risk tiering model adopted", "AI inventory covers all known pilots"],
        },
        {
          id: "data-ownership",
          title: "Assign critical data owners",
          description: "Name accountable business and technical owners for demand, inventory, customer, and supplier datasets.",
          dimensionId: "data_ai",
          effort: "medium",
          impact: "high",
          urgency: "high",
          successMetrics: ["Owner named for each critical dataset", "Quality targets agreed for each dataset"],
        },
      ],
    },
    {
      id: "phase-2",
      name: "Modernize Delivery",
      timeframe: "3-6 months",
      description: "Improve integration, automation, and cloud operating practices to reduce delivery friction.",
      actions: [
        {
          id: "api-roadmap",
          title: "Create API modernization roadmap",
          description: "Prioritize gateway, ERP integration, and service boundaries for processes that block automation.",
          dimensionId: "technology",
          effort: "high",
          impact: "high",
          urgency: "medium",
          successMetrics: ["API gateway pilot live", "Top 5 integration pain points ranked and funded"],
        },
        {
          id: "ml-delivery",
          title: "Extend CI/CD patterns to ML models",
          description: "Add reproducible model packaging, test gates, and deployment promotion for demand forecasting models.",
          dimensionId: "operations",
          effort: "medium",
          impact: "medium",
          urgency: "medium",
          successMetrics: ["Forecast model has automated test/deploy pipeline", "Rollback process documented"],
        },
      ],
    },
    {
      id: "phase-3",
      name: "Scale AI Value",
      timeframe: "6-12 months",
      description: "Use stronger foundations to scale AI in customer, supply chain, and operations workflows.",
      actions: [
        {
          id: "personalized-cx",
          title: "Pilot AI-assisted customer personalization",
          description: "Use governed customer segments and feedback loops to personalize portal and mobile recommendations.",
          dimensionId: "customer",
          effort: "medium",
          impact: "high",
          urgency: "medium",
          successMetrics: ["Pilot improves conversion or retention by 5%", "Human review workflow defined"],
          dependencies: ["data-ownership", "policy-baseline"],
        },
        {
          id: "talent-plan",
          title: "Build the AI talent plan",
          description: "Blend targeted hiring, partner support, and internal upskilling for product, data, and platform teams.",
          dimensionId: "culture",
          effort: "medium",
          impact: "medium",
          urgency: "medium",
          successMetrics: ["Role gap map complete", "Two cohorts complete applied AI training"],
        },
      ],
    },
  ],
};

export function getDemoSession(): Partial<AssessmentSession> {
  return {
    id: "demo-acme-corp",
    frameworkVersion: "2.0",
    orgProfile: {
      name: "Acme Corporation",
      industry: "Manufacturing",
      size: "mid-market",
      geography: "Southeast Asia",
      regulatoryEnvironment: ["PDPA"],
      existingInitiatives: ["Cloud migration to AWS", "Data warehouse modernization"],
      constraints: {
        budget: "medium",
        timeline: "moderate",
        talentAvailability: "scarce",
      },
    },
    dimensions: demoDimensionScores,
    aiReadiness: demoAIReadiness,
    isComplete: true,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now(),
  };
}

export function getDemoRoadmap(): Roadmap {
  return demoRoadmap;
}
