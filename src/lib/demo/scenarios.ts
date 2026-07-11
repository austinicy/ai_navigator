import type { AssessmentEngine } from "../assessment/engine";
import type { ChatMessage, DocumentSignal, OrgProfile } from "../assessment/types";

export interface DemoScenario {
  id: string;
  companyName: string;
  industry: string;
  title: string;
  description: string;
  progressLabel: string;
  nextQuestion: string;
  profile: Partial<OrgProfile>;
  documents: Array<{ filename: string; extractedText: string; signals: DocumentSignal[] }>;
  messages: Array<Pick<ChatMessage, "role" | "content">>;
}

const documentSignal = (
  id: string,
  text: string,
  dimensionId: string,
  criterionId: string,
  score: number,
  gap?: string
): DocumentSignal => ({
  id,
  text,
  source: "document",
  dimensionId,
  criterionId,
  score,
  gap,
  strength: 1,
  timestamp: 1,
});

export const demoScenarios: DemoScenario[] = [
  {
    id: "northstar-manufacturing",
    companyName: "Northstar Components",
    industry: "Industrial manufacturing",
    title: "Manufacturing AI scale-up",
    description: "A plant network moving from analytics pilots to governed GenAI and automation.",
    progressLabel: "Strategy, data, operations, and GenAI context already loaded",
    nextQuestion:
      "Your internal maintenance copilot uses plant manuals. How do you test its answers, control access to source documents, and approve any actions it recommends?",
    profile: {
      name: "Northstar Components",
      industry: "Industrial manufacturing",
      size: "enterprise",
      geography: "United States and Mexico",
      existingInitiatives: ["Predictive maintenance", "Plant knowledge copilot", "ERP modernization"],
      constraints: { budget: "medium", timeline: "moderate", talentAvailability: "moderate" },
    },
    documents: [
      {
        filename: "FY26-digital-operations-plan.pdf",
        extractedText: "Northstar has funded a three-year digital operations plan. Two plants run predictive-maintenance models. Data quality ownership is inconsistent across plants and the ERP modernization is in progress.",
        signals: [
          documentSignal("northstar-s1", "Three-year digital operations plan with executive funding.", "strategy", "digital_vision", 3),
          documentSignal("northstar-s2", "Two production plants run predictive-maintenance models.", "data_ai", "ml_ai_adoption", 3),
          documentSignal("northstar-s3", "Data ownership and quality definitions differ across plants.", "data_ai", "data_governance", 2, "Plant data ownership is inconsistent."),
          documentSignal("northstar-s4", "ERP modernization is underway but integrations remain fragmented.", "technology", "api_architecture", 2, "Legacy integrations limit automation."),
        ],
      },
      {
        filename: "maintenance-copilot-pilot-brief.docx",
        extractedText: "A maintenance copilot retrieves approved manuals for technicians. It is a limited pilot and does not yet have automated answer-quality evaluation, source freshness monitoring, or formal agent tool permissions.",
        signals: [
          documentSignal("northstar-s5", "Maintenance copilot retrieves approved equipment manuals for technicians.", "genai", "knowledge_rag", 3),
          documentSignal("northstar-s6", "Copilot pilot lacks automated answer-quality evaluation and freshness monitoring.", "genai", "genaiops_evaluation", 2, "No repeatable evaluation or retrieval freshness monitoring."),
          documentSignal("northstar-s7", "The pilot has no formal agent tool permissions or action approvals.", "genai", "agentic_controls", 1, "Agent identity and approval controls are not defined."),
        ],
      },
    ],
    messages: [
      { role: "assistant", content: "I’ve reviewed Northstar’s operations plan and maintenance-copilot pilot brief." },
      { role: "user", content: "We are standardizing plant data and have two predictive-maintenance models in production, but each plant manages its own data definitions." },
    ],
  },
  {
    id: "harbor-retail",
    companyName: "Harbor & Pine Retail",
    industry: "Omnichannel retail",
    title: "Retail personalization and GenAI service",
    description: "An omnichannel retailer with strong digital demand and an early customer-service assistant.",
    progressLabel: "Customer, cloud, and GenAI service-assistant evidence already loaded",
    nextQuestion:
      "When the service assistant cannot answer, how does it hand off to a person, and how do you measure answer quality, safety, and customer outcomes after release?",
    profile: {
      name: "Harbor & Pine Retail",
      industry: "Omnichannel retail",
      size: "mid-market",
      geography: "United Kingdom",
      existingInitiatives: ["Loyalty personalization", "Customer-service assistant", "Cloud commerce migration"],
      constraints: { budget: "medium", timeline: "aggressive", talentAvailability: "moderate" },
    },
    documents: [
      {
        filename: "commerce-and-loyalty-roadmap.pdf",
        extractedText: "Harbor & Pine has migrated its storefront and loyalty platform to cloud services. Teams use customer segments for email campaigns, while cross-channel journey orchestration remains manual.",
        signals: [
          documentSignal("harbor-s1", "Storefront and loyalty platform are cloud-based.", "technology", "cloud_maturity", 4),
          documentSignal("harbor-s2", "Customer segments drive email campaigns.", "customer", "personalization", 3),
          documentSignal("harbor-s3", "Cross-channel journey orchestration remains manual.", "customer", "journey_orchestration", 2, "Customer journeys are not orchestrated across channels."),
        ],
      },
      {
        filename: "customer-assistant-pilot.docx",
        extractedText: "The customer-service assistant answers order and returns questions using a curated policy knowledge base. Human agents take over complex cases. Prompt changes are reviewed manually and safety testing is ad hoc.",
        signals: [
          documentSignal("harbor-s4", "Customer assistant answers order and returns questions from a curated policy knowledge base.", "genai", "knowledge_rag", 3),
          documentSignal("harbor-s5", "Human agents take over complex customer-service cases.", "genai", "workforce_oversight", 3),
          documentSignal("harbor-s6", "Prompt changes and safety checks are manual and ad hoc.", "genai", "security_safety", 2, "Safety testing is not repeatable before release."),
        ],
      },
    ],
    messages: [
      { role: "assistant", content: "I’ve reviewed the commerce roadmap and customer-assistant pilot notes." },
      { role: "user", content: "The assistant handles routine order and return questions, while complex cases go to our contact-centre team." },
    ],
  },
  {
    id: "beacon-financial",
    companyName: "Beacon Mutual",
    industry: "Financial services",
    title: "Governed GenAI in financial services",
    description: "A regulated insurer piloting advisor copilots with a strong risk focus and limited operating controls.",
    progressLabel: "Governance, data, and regulated GenAI-pilot evidence already loaded",
    nextQuestion:
      "For the advisor copilot, who approves the model, data sources, and changes—and what audit trail, risk tests, and kill switch exist before it can affect a customer decision?",
    profile: {
      name: "Beacon Mutual",
      industry: "Financial services",
      size: "enterprise",
      geography: "Canada",
      regulatoryEnvironment: ["Insurance conduct", "Privacy", "Model risk management"],
      existingInitiatives: ["Advisor copilot", "Enterprise data catalog", "Model-risk inventory"],
      constraints: { budget: "high", timeline: "moderate", talentAvailability: "scarce" },
    },
    documents: [
      {
        filename: "ai-risk-and-data-controls.pdf",
        extractedText: "Beacon maintains a model-risk inventory and enterprise data catalog. The organization has formal privacy review but GenAI-specific risk tiers and vendor controls are still being drafted.",
        signals: [
          documentSignal("beacon-s1", "Enterprise data catalog and named data stewards are in place.", "data_ai", "data_governance", 4),
          documentSignal("beacon-s2", "Formal privacy review is required for analytics and AI initiatives.", "ai_governance", "compliance_framework", 3),
          documentSignal("beacon-s3", "GenAI-specific risk tiers and vendor controls are still being drafted.", "ai_governance", "risk_management", 2, "GenAI risk tiering and vendor control standards are incomplete."),
        ],
      },
      {
        filename: "advisor-copilot-pilot-charter.docx",
        extractedText: "A supervised advisor copilot summarizes policy information from approved sources. The pilot requires advisor review, cannot submit transactions, and records prompts. It lacks automated red-teaming and formal model-change evaluation.",
        signals: [
          documentSignal("beacon-s4", "Advisor copilot uses approved policy sources and records prompts.", "genai", "knowledge_rag", 3),
          documentSignal("beacon-s5", "Advisor review is required and the copilot cannot submit transactions.", "genai", "agentic_controls", 2),
          documentSignal("beacon-s6", "Pilot lacks automated red-teaming and formal model-change evaluation.", "genai", "genaiops_evaluation", 2, "No automated evaluation or red-team release gate."),
        ],
      },
    ],
    messages: [
      { role: "assistant", content: "I’ve reviewed Beacon Mutual’s AI risk controls and advisor-copilot pilot charter." },
      { role: "user", content: "The copilot is supervised, cannot submit transactions, and our advisors review its output before using it." },
    ],
  },
];

export function getDemoScenario(id: string | null | undefined): DemoScenario | undefined {
  return demoScenarios.find((scenario) => scenario.id === id);
}

export function seedDemoScenario(engine: AssessmentEngine, scenario: DemoScenario): void {
  engine.updateOrgProfile(scenario.profile);
  for (const document of scenario.documents) engine.addDocument(document);
  for (const message of scenario.messages) engine.addConversationMessage(message.role, message.content);
  engine.addConversationMessage("assistant", scenario.nextQuestion);
}
