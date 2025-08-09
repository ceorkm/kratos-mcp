export interface PRD {
  id: string;
  projectName: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  
  pages: PageDefinition[];
  apiEndpoints: APIEndpoint[];
  dataStructures: DataStructure[];
  userFlows: UserFlow[];
  edgeCases: EdgeCase[];
  integrations: Integration[];
}

export interface PageDefinition {
  path: string;
  name: string;
  description: string;
  components: string[];
  dataRequirements: string[];
}

export interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  requestBody?: object;
  responseBody?: object;
  authentication: boolean;
}

export interface DataStructure {
  name: string;
  schema: object;
  relationships: string[];
}

export interface UserFlow {
  name: string;
  steps: string[];
  entryPoint: string;
  exitPoints: string[];
}

export interface EdgeCase {
  scenario: string;
  handling: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Integration {
  name: string;
  type: string;
  configuration: object;
}

export interface Memory {
  id: string;
  type: 'architecture' | 'fixed-guide' | 'open-issue' | 'audit' | 'reference' | 'progress' | 'feature';
  title: string;
  content: string;
  metadata: MemoryMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryMetadata {
  tags: string[];
  relatedFiles: string[];
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  autoSaved: boolean;
  conversationId?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  role: string;
  stack: string[];
  goal: string;
  scopeConstraints: string[];
  fileContext: string[];
  plan: string[];
  memoryRecall: string[];
  verification: string[];
}

export interface ContextRule {
  id: string;
  name: string;
  trigger: RuleTrigger;
  action: RuleAction;
  priority: number;
  enabled: boolean;
}

export interface RuleTrigger {
  type: 'always' | 'intelligent' | 'file-pattern' | 'manual';
  patterns?: string[];
  keywords?: string[];
  conditions?: object;
}

export interface RuleAction {
  type: 'inject-memory' | 'inject-prd' | 'inject-context' | 'warn';
  targets: string[];
  message?: string;
}

export interface AutoMemoryConfig {
  enabled: boolean;
  triggers: {
    bugFixes: boolean;
    architecture: boolean;
    features: boolean;
    optimizations: boolean;
  };
  excludePatterns: string[];
  requireConfirmation: boolean;
  smartMerge: boolean;
}

export interface ConversationAnalysis {
  hasBugFix: boolean;
  hasArchitectureDecision: boolean;
  hasFeatureImplementation: boolean;
  hasOptimization: boolean;
  extractedTitle?: string;
  extractedContent?: string;
  suggestedType?: Memory['type'];
  confidence: number;
}

export interface ConversationMemory {
  id: string;
  projectId: string;
  timestamp: Date;
  conversation: ConversationTurn[];
  extractedInsights: ExtractedInsights;
  tags: string[];
  importance: 'low' | 'medium' | 'high';
  summary?: string;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ExtractedInsights {
  decisions: string[];
  implementations: string[];
  problems: string[];
  solutions: string[];
  learnings: string[];
  codeSnippets: CodeSnippet[];
  dependencies: string[];
  todos: string[];
}

export interface CodeSnippet {
  language: string;
  code: string;
  description?: string;
  file?: string;
}