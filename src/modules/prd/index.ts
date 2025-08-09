import { PRD, PageDefinition, APIEndpoint, DataStructure, UserFlow } from '../../types/index.js';
import { MCPLogger as Logger } from '../../utils/mcp-logger.js';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export class PRDManager {
  private logger: Logger;
  private prdPath: string;
  private currentPRD: PRD | null = null;

  constructor() {
    this.logger = new Logger('PRDManager');
    this.prdPath = path.join(process.cwd(), '.kratos', 'prd.json');
    this.initialize();
  }

  private async initialize() {
    try {
      const kratosDir = path.dirname(this.prdPath);
      await fs.mkdir(kratosDir, { recursive: true });
      
      // Try to load existing PRD
      try {
        const content = await fs.readFile(this.prdPath, 'utf-8');
        this.currentPRD = JSON.parse(content);
        this.logger.info('Loaded existing PRD');
      } catch {
        this.logger.info('No existing PRD found');
      }
    } catch (error) {
      this.logger.error('Failed to initialize PRD manager', error);
    }
  }

  async createPRD(args: {
    projectName: string;
    pages?: any[];
    apiEndpoints?: any[];
    dataStructures?: any[];
    userFlows?: any[];
    edgeCases?: any[];
    integrations?: any[];
  }) {
    this.currentPRD = {
      id: randomUUID(),
      projectName: args.projectName,
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      pages: args.pages || [],
      apiEndpoints: args.apiEndpoints || [],
      dataStructures: args.dataStructures || [],
      userFlows: args.userFlows || [],
      edgeCases: args.edgeCases || [],
      integrations: args.integrations || [],
    };

    await this.savePRD();

    return {
      content: [
        {
          type: 'text',
          text: `✅ PRD created for project: ${args.projectName}\n\nNext steps:\n1. Add pages with their paths and components\n2. Define API endpoints\n3. Document data structures\n4. Map out user flows`,
        },
      ],
    };
  }

  async updatePRD(section: string, data: any) {
    if (!this.currentPRD) {
      throw new Error('No PRD exists. Create one first.');
    }

    switch (section) {
      case 'pages':
        this.currentPRD.pages = data;
        break;
      case 'api':
        this.currentPRD.apiEndpoints = data;
        break;
      case 'data':
        this.currentPRD.dataStructures = data;
        break;
      case 'flows':
        this.currentPRD.userFlows = data;
        break;
      case 'edges':
        this.currentPRD.edgeCases = data;
        break;
      case 'integrations':
        this.currentPRD.integrations = data;
        break;
      default:
        throw new Error(`Unknown PRD section: ${section}`);
    }

    this.currentPRD.updatedAt = new Date();
    await this.savePRD();

    return {
      content: [
        {
          type: 'text',
          text: `✅ Updated PRD section: ${section}`,
        },
      ],
    };
  }

  async getPRD(section?: string) {
    if (!this.currentPRD) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ No PRD found. Create one first using create_prd tool.',
          },
        ],
      };
    }

    let result: any;

    if (!section || section === 'all') {
      result = this.currentPRD;
    } else {
      switch (section) {
        case 'pages':
          result = {
            pages: this.currentPRD.pages,
            summary: `${this.currentPRD.pages.length} pages defined`,
          };
          break;
        case 'api':
          result = {
            endpoints: this.currentPRD.apiEndpoints,
            summary: `${this.currentPRD.apiEndpoints.length} API endpoints defined`,
          };
          break;
        case 'data':
          result = {
            structures: this.currentPRD.dataStructures,
            summary: `${this.currentPRD.dataStructures.length} data structures defined`,
          };
          break;
        case 'flows':
          result = {
            userFlows: this.currentPRD.userFlows,
            summary: `${this.currentPRD.userFlows.length} user flows defined`,
          };
          break;
        default:
          throw new Error(`Unknown section: ${section}`);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async validatePRD(): Promise<{ isValid: boolean; missingElements: string[] }> {
    if (!this.currentPRD) {
      return { isValid: false, missingElements: ['No PRD exists'] };
    }

    const missingElements: string[] = [];

    if (this.currentPRD.pages.length === 0) {
      missingElements.push('Pages - Define all application pages with paths');
    }

    if (this.currentPRD.apiEndpoints.length === 0) {
      missingElements.push('API Endpoints - Document all API routes');
    }

    if (this.currentPRD.dataStructures.length === 0) {
      missingElements.push('Data Structures - Define your data models');
    }

    if (this.currentPRD.userFlows.length === 0) {
      missingElements.push('User Flows - Map out user journeys');
    }

    return {
      isValid: missingElements.length === 0,
      missingElements,
    };
  }

  async generatePRDTemplate(projectType: string) {
    const templates: Record<string, Partial<PRD>> = {
      'web-app': {
        pages: [
          { path: '/', name: 'Home', description: 'Landing page', components: ['Header', 'Hero', 'Features'], dataRequirements: [] },
          { path: '/login', name: 'Login', description: 'User authentication', components: ['LoginForm'], dataRequirements: ['user'] },
          { path: '/dashboard', name: 'Dashboard', description: 'Main app interface', components: ['Sidebar', 'MainContent'], dataRequirements: ['user', 'data'] },
        ],
        apiEndpoints: [
          { method: 'POST', path: '/api/auth/login', description: 'User login', authentication: false },
          { method: 'POST', path: '/api/auth/logout', description: 'User logout', authentication: true },
          { method: 'GET', path: '/api/user/profile', description: 'Get user profile', authentication: true },
        ],
        dataStructures: [
          { name: 'User', schema: { id: 'string', email: 'string', name: 'string' }, relationships: [] },
        ],
        userFlows: [
          { name: 'Authentication', steps: ['Visit login', 'Enter credentials', 'Submit form', 'Redirect to dashboard'], entryPoint: '/login', exitPoints: ['/dashboard'] },
        ],
      },
      'api': {
        apiEndpoints: [
          { method: 'GET', path: '/api/v1/health', description: 'Health check', authentication: false },
          { method: 'POST', path: '/api/v1/resources', description: 'Create resource', authentication: true },
          { method: 'GET', path: '/api/v1/resources', description: 'List resources', authentication: true },
        ],
        dataStructures: [
          { name: 'Resource', schema: { id: 'string', name: 'string', createdAt: 'datetime' }, relationships: ['User'] },
        ],
      },
    };

    const template = templates[projectType] || templates['web-app'];
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(template, null, 2),
        },
      ],
    };
  }

  async getCurrentPRD(): Promise<PRD | null> {
    return this.currentPRD;
  }

  private async savePRD() {
    if (!this.currentPRD) return;
    
    await fs.writeFile(this.prdPath, JSON.stringify(this.currentPRD, null, 2));
    this.logger.info('PRD saved successfully');
  }
}