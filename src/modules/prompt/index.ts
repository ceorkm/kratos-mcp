import { PromptTemplate } from '../../types/index.js';
import { MCPLogger as Logger } from '../../utils/mcp-logger.js';
import { randomUUID } from 'crypto';

export class PromptManager {
  private logger: Logger;
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.logger = new Logger('PromptManager');
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Pre-built templates for common scenarios
    const templates: PromptTemplate[] = [
      {
        id: 'bug-fix',
        name: 'Bug Fix Template',
        role: 'Senior Software Engineer specializing in debugging',
        stack: ['${tech_stack}'],
        goal: 'Fix the ${bug_description} issue',
        scopeConstraints: [
          'Only modify files in ${affected_files}',
          'Preserve existing functionality',
          'Follow existing code patterns'
        ],
        fileContext: ['${relevant_files}'],
        plan: [
          'Reproduce the bug',
          'Identify root cause',
          'Implement fix',
          'Add tests if applicable'
        ],
        memoryRecall: ['Check for similar bugs in memory'],
        verification: [
          'Run existing tests',
          'Test the specific bug scenario',
          'Verify no regressions'
        ]
      },
      {
        id: 'new-feature',
        name: 'New Feature Template',
        role: 'Full-stack Developer',
        stack: ['${tech_stack}'],
        goal: 'Implement ${feature_name}',
        scopeConstraints: [
          'Follow project architecture',
          'Use existing patterns and utilities',
          'Maintain consistency with current codebase'
        ],
        fileContext: ['${related_files}'],
        plan: [
          'Review PRD requirements',
          'Create necessary components/modules',
          'Implement business logic',
          'Add API endpoints if needed',
          'Write tests'
        ],
        memoryRecall: ['Similar features', 'Architecture patterns'],
        verification: [
          'Feature works as specified in PRD',
          'All tests pass',
          'Code follows project conventions'
        ]
      },
      {
        id: 'refactor',
        name: 'Refactoring Template',
        role: 'Senior Software Architect',
        stack: ['${tech_stack}'],
        goal: 'Refactor ${target_code} to improve ${improvement_goal}',
        scopeConstraints: [
          'Maintain existing functionality',
          'Improve code quality metrics',
          'Preserve public APIs'
        ],
        fileContext: ['${files_to_refactor}'],
        plan: [
          'Analyze current implementation',
          'Identify improvement opportunities',
          'Plan refactoring approach',
          'Implement changes incrementally',
          'Ensure tests still pass'
        ],
        memoryRecall: ['Code patterns', 'Architecture decisions'],
        verification: [
          'All tests pass',
          'Performance benchmarks maintained or improved',
          'Code quality metrics improved'
        ]
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  async generatePrompt(args: {
    task: string;
    role?: string;
    stack?: string[];
    fileContext?: string[];
    templateId?: string;
  }) {
    let prompt: string;

    if (args.templateId && this.templates.has(args.templateId)) {
      prompt = this.buildFromTemplate(args.templateId, args);
    } else {
      prompt = this.buildCustomPrompt(args);
    }

    // Analyze task to add intelligent suggestions
    const suggestions = this.analyzeTaskForSuggestions(args.task);
    if (suggestions.length > 0) {
      prompt += '\n\n## Additional Suggestions\n' + suggestions.join('\n');
    }

    return {
      content: [
        {
          type: 'text',
          text: prompt,
        },
      ],
    };
  }

  private buildFromTemplate(templateId: string, args: any): string {
    const template = this.templates.get(templateId)!;
    
    let prompt = `# Role & Stack\n`;
    prompt += `You are a ${args.role || template.role}.\n`;
    prompt += `Tech stack: ${(args.stack || template.stack).join(', ')}\n\n`;

    prompt += `# Goal\n${template.goal}\n\n`;

    prompt += `# Scope Constraints\n`;
    template.scopeConstraints.forEach(constraint => {
      prompt += `- ${constraint}\n`;
    });
    prompt += '\n';

    if (args.fileContext && args.fileContext.length > 0) {
      prompt += `# File Context\nFocus on these files:\n`;
      args.fileContext.forEach((file: string) => {
        prompt += `- ${file}\n`;
      });
      prompt += '\n';
    }

    prompt += `# Plan\n`;
    template.plan.forEach((step, index) => {
      prompt += `${index + 1}. ${step}\n`;
    });
    prompt += '\n';

    prompt += `# Memory Recall\nCheck memory for:\n`;
    template.memoryRecall.forEach(item => {
      prompt += `- ${item}\n`;
    });
    prompt += '\n';

    prompt += `# Verification\nAfter implementation:\n`;
    template.verification.forEach(item => {
      prompt += `- ${item}\n`;
    });

    return prompt;
  }

  private buildCustomPrompt(args: {
    task: string;
    role?: string;
    stack?: string[];
    fileContext?: string[];
  }): string {
    let prompt = `# Task\n${args.task}\n\n`;

    if (args.role) {
      prompt += `# Role\nYou are a ${args.role}.\n\n`;
    }

    if (args.stack && args.stack.length > 0) {
      prompt += `# Tech Stack\n${args.stack.join(', ')}\n\n`;
    }

    if (args.fileContext && args.fileContext.length > 0) {
      prompt += `# File Context\nFocus on these files:\n`;
      args.fileContext.forEach((file: string) => {
        prompt += `- ${file}\n`;
      });
      prompt += '\n';
    }

    // Add intelligent sections based on task analysis
    const taskLower = args.task.toLowerCase();
    
    if (taskLower.includes('bug') || taskLower.includes('fix') || taskLower.includes('error')) {
      prompt += `# Approach\n`;
      prompt += `1. Reproduce the issue\n`;
      prompt += `2. Identify root cause\n`;
      prompt += `3. Implement minimal fix\n`;
      prompt += `4. Verify fix doesn't break existing functionality\n\n`;
    } else if (taskLower.includes('implement') || taskLower.includes('create') || taskLower.includes('add')) {
      prompt += `# Approach\n`;
      prompt += `1. Review requirements\n`;
      prompt += `2. Check existing patterns in codebase\n`;
      prompt += `3. Implement following project conventions\n`;
      prompt += `4. Add appropriate tests\n\n`;
    } else if (taskLower.includes('optimize') || taskLower.includes('improve') || taskLower.includes('performance')) {
      prompt += `# Approach\n`;
      prompt += `1. Measure current performance\n`;
      prompt += `2. Identify bottlenecks\n`;
      prompt += `3. Implement optimizations\n`;
      prompt += `4. Verify improvements with benchmarks\n\n`;
    }

    prompt += `# Verification\n`;
    prompt += `- Ensure all tests pass\n`;
    prompt += `- Follow project code style\n`;
    prompt += `- Document any significant changes\n`;

    return prompt;
  }

  private analyzeTaskForSuggestions(task: string): string[] {
    const suggestions: string[] = [];
    const taskLower = task.toLowerCase();

    // Authentication related
    if (taskLower.includes('auth') || taskLower.includes('login') || taskLower.includes('security')) {
      suggestions.push('- Consider OWASP security best practices');
      suggestions.push('- Implement proper session management');
      suggestions.push('- Add rate limiting for authentication endpoints');
    }

    // API related
    if (taskLower.includes('api') || taskLower.includes('endpoint') || taskLower.includes('route')) {
      suggestions.push('- Follow RESTful conventions');
      suggestions.push('- Implement proper error handling and status codes');
      suggestions.push('- Add input validation and sanitization');
      suggestions.push('- Consider API versioning strategy');
    }

    // Database related
    if (taskLower.includes('database') || taskLower.includes('query') || taskLower.includes('migration')) {
      suggestions.push('- Use database transactions where appropriate');
      suggestions.push('- Consider query performance and indexing');
      suggestions.push('- Implement proper error handling for database operations');
    }

    // Performance related
    if (taskLower.includes('performance') || taskLower.includes('optimize') || taskLower.includes('slow')) {
      suggestions.push('- Profile before optimizing');
      suggestions.push('- Consider caching strategies');
      suggestions.push('- Look for N+1 query problems');
      suggestions.push('- Check for unnecessary re-renders (if frontend)');
    }

    // Testing related
    if (taskLower.includes('test') || taskLower.includes('testing')) {
      suggestions.push('- Write unit tests for business logic');
      suggestions.push('- Add integration tests for API endpoints');
      suggestions.push('- Consider edge cases and error scenarios');
      suggestions.push('- Aim for meaningful test coverage, not just high percentages');
    }

    return suggestions;
  }

  async createCustomTemplate(args: {
    name: string;
    role: string;
    stack: string[];
    goal: string;
    scopeConstraints: string[];
    plan: string[];
    verification: string[];
  }) {
    const template: PromptTemplate = {
      id: randomUUID(),
      name: args.name,
      role: args.role,
      stack: args.stack,
      goal: args.goal,
      scopeConstraints: args.scopeConstraints,
      fileContext: [],
      plan: args.plan,
      memoryRecall: [],
      verification: args.verification,
    };

    this.templates.set(template.id, template);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Created custom template: ${args.name}\nID: ${template.id}`,
        },
      ],
    };
  }

  async listTemplates() {
    const templates = Array.from(this.templates.values()).map(t => ({
      id: t.id,
      name: t.name,
      role: t.role,
      goal: t.goal,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(templates, null, 2),
        },
      ],
    };
  }

  async validatePrompt(prompt: string): Promise<{
    isValid: boolean;
    suggestions: string[];
    score: number;
  }> {
    const suggestions: string[] = [];
    let score = 100;

    // Check for essential sections
    const sections = {
      role: /role|you are/i,
      goal: /goal|objective|task/i,
      context: /context|background|files/i,
      verification: /verification|test|check/i,
    };

    for (const [section, pattern] of Object.entries(sections)) {
      if (!pattern.test(prompt)) {
        suggestions.push(`Consider adding a ${section} section`);
        score -= 10;
      }
    }

    // Check prompt length
    const wordCount = prompt.split(/\s+/).length;
    if (wordCount < 50) {
      suggestions.push('Prompt might be too brief. Consider adding more detail.');
      score -= 15;
    } else if (wordCount > 1000) {
      suggestions.push('Prompt might be too long. Consider focusing on essential information.');
      score -= 10;
    }

    // Check for vague language
    const vagueTerms = ['maybe', 'possibly', 'might', 'could', 'should probably'];
    vagueTerms.forEach(term => {
      if (prompt.toLowerCase().includes(term)) {
        suggestions.push(`Avoid vague terms like "${term}". Be specific.`);
        score -= 5;
      }
    });

    return {
      isValid: score >= 70,
      suggestions,
      score,
    };
  }
}