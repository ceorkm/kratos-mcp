#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../utils/logger.js';

const logger = new Logger('CI-Hooks');

/**
 * CI/CD Integration Hooks for Kratos Protocol
 * 
 * These hooks can be integrated into your CI/CD pipeline to:
 * - Run leak detection tests
 * - Perform TTL cleanup
 * - Validate project configurations
 * - Generate memory reports
 */

class KratosCIHooks {
  
  /**
   * Pre-commit hook: Run leak detection tests
   */
  static async preCommitHook(): Promise<boolean> {
    logger.info('Running pre-commit leak detection...');
    
    try {
      // Run leak detection tests
      const testResult = await KratosCIHooks.runCommand('npm', ['run', 'test:leak']);
      
      if (testResult.exitCode !== 0) {
        logger.error('❌ Leak detection tests failed!');
        logger.error('Output:', testResult.output);
        return false;
      }
      
      logger.info('✅ Leak detection tests passed');
      return true;
      
    } catch (error) {
      logger.error('Pre-commit hook failed:', error);
      return false;
    }
  }

  /**
   * Pre-push hook: Validate all project configurations
   */
  static async prePushHook(): Promise<boolean> {
    logger.info('Running pre-push validation...');
    
    try {
      // Find all Kratos projects in the repository
      const projects = await KratosCIHooks.findKratosProjects();
      
      if (projects.length === 0) {
        logger.info('No Kratos projects found, skipping validation');
        return true;
      }
      
      logger.info(`Found ${projects.length} Kratos projects`);
      
      // Validate each project
      for (const project of projects) {
        const isValid = await KratosCIHooks.validateProject(project);
        if (!isValid) {
          logger.error(`❌ Project validation failed: ${project}`);
          return false;
        }
      }
      
      logger.info('✅ All projects validated successfully');
      return true;
      
    } catch (error) {
      logger.error('Pre-push hook failed:', error);
      return false;
    }
  }

  /**
   * Nightly cleanup: Remove expired memories and compact databases
   */
  static async nightlyCleanup(): Promise<void> {
    logger.info('Running nightly cleanup...');
    
    try {
      const projects = await KratosCIHooks.findKratosProjects();
      
      for (const project of projects) {
        await KratosCIHooks.cleanupProject(project);
      }
      
      // Generate cleanup report
      await KratosCIHooks.generateCleanupReport(projects);
      
      logger.info('✅ Nightly cleanup completed');
      
    } catch (error) {
      logger.error('Nightly cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Security audit: Check for potential data leaks and vulnerabilities
   */
  static async securityAudit(): Promise<{ passed: boolean; report: any }> {
    logger.info('Running security audit...');
    
    const report: any = {
      timestamp: new Date().toISOString(),
      projects: [],
      globalConcepts: {},
      vulnerabilities: [],
      recommendations: [],
    };
    
    try {
      const projects = await KratosCIHooks.findKratosProjects();
      
      for (const project of projects) {
        const projectAudit = await KratosCIHooks.auditProject(project);
        report.projects.push(projectAudit);
        
        // Check for vulnerabilities
        if (projectAudit.secretsFound > 0) {
          report.vulnerabilities.push({
            type: 'secrets-in-memories',
            project: project,
            count: projectAudit.secretsFound,
            severity: 'high'
          });
        }
        
        if (projectAudit.crossProjectRefs > 0) {
          report.vulnerabilities.push({
            type: 'cross-project-references',
            project: project,
            count: projectAudit.crossProjectRefs,
            severity: 'medium'
          });
        }
      }
      
      // Global concept store audit
      report.globalConcepts = await KratosCIHooks.auditConceptStore();
      
      // Generate recommendations
      report.recommendations = KratosCIHooks.generateSecurityRecommendations(report);
      
      const passed = report.vulnerabilities.length === 0;
      logger.info(passed ? '✅ Security audit passed' : '⚠️ Security issues found');
      
      return { passed, report };
      
    } catch (error) {
      logger.error('Security audit failed:', error);
      throw error;
    }
  }

  /**
   * Memory report: Generate statistics about memory usage across projects
   */
  static async generateMemoryReport(): Promise<any> {
    logger.info('Generating memory usage report...');
    
    const report: any = {
      timestamp: new Date().toISOString(),
      summary: {
        totalProjects: 0,
        totalMemories: 0,
        totalConcepts: 0,
        diskUsage: 0,
      },
      projects: [],
      topTags: {},
      recommendations: [],
    };
    
    try {
      const projects = await KratosCIHooks.findKratosProjects();
      report.summary.totalProjects = projects.length;
      
      const allTags = new Map<string, number>();
      
      for (const project of projects) {
        const projectStats = await KratosCIHooks.getProjectStats(project);
        report.projects.push(projectStats);
        
        report.summary.totalMemories += projectStats.memoryCount;
        report.summary.diskUsage += projectStats.diskUsage;
        
        // Aggregate tags
        for (const [tag, count] of Object.entries(projectStats.topTags)) {
          allTags.set(tag, (allTags.get(tag) || 0) + (count as number));
        }
      }
      
      // Get global concept stats
      const conceptStats = await KratosCIHooks.getConceptStats();
      report.summary.totalConcepts = conceptStats.totalConcepts;
      
      // Top tags across all projects
      report.topTags = Object.fromEntries(
        Array.from(allTags.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 20)
      );
      
      // Generate recommendations
      report.recommendations = KratosCIHooks.generateMemoryRecommendations(report);
      
      logger.info('✅ Memory report generated');
      return report;
      
    } catch (error) {
      logger.error('Memory report generation failed:', error);
      throw error;
    }
  }

  // Helper methods

  private static async findKratosProjects(): Promise<string[]> {
    const projects = [];
    
    // Search for .kratos directories
    const findCommand = process.platform === 'win32' 
      ? ['find', '.', '-name', '.kratos', '-type', 'd']
      : ['find', '.', '-name', '.kratos', '-type', 'd'];
    
    const result = await KratosCIHooks.runCommand('find', ['.', '-name', '.kratos', '-type', 'd']);
    
    if (result.exitCode === 0) {
      const lines = result.output.split('\n').filter(line => line.trim());
      for (const line of lines) {
        const projectRoot = path.dirname(line);
        projects.push(path.resolve(projectRoot));
      }
    }
    
    return projects;
  }

  private static async validateProject(projectPath: string): Promise<boolean> {
    const kratosDir = path.join(projectPath, '.kratos');
    
    // Check required files
    const requiredFiles = ['project.json'];
    for (const file of requiredFiles) {
      if (!await fs.pathExists(path.join(kratosDir, file))) {
        logger.error(`Missing required file: ${file} in ${projectPath}`);
        return false;
      }
    }
    
    // Validate project.json
    try {
      const projectConfig = await fs.readJson(path.join(kratosDir, 'project.json'));
      if (!projectConfig.project_id || !projectConfig.name) {
        logger.error(`Invalid project.json in ${projectPath}`);
        return false;
      }
    } catch (error) {
      logger.error(`Invalid project.json in ${projectPath}:`, error);
      return false;
    }
    
    return true;
  }

  private static async cleanupProject(projectPath: string): Promise<void> {
    logger.info(`Cleaning up project: ${projectPath}`);
    
    const dbPath = path.join(projectPath, '.kratos', 'memory.db');
    
    if (await fs.pathExists(dbPath)) {
      // Run VACUUM on SQLite database to reclaim space
      await KratosCIHooks.runCommand('sqlite3', [dbPath, 'VACUUM;']);
      
      // Clean up expired memories (handled by the database itself via triggers)
      logger.info(`Database cleaned: ${dbPath}`);
    }
  }

  private static async auditProject(projectPath: string): Promise<any> {
    const audit = {
      project: projectPath,
      memoryCount: 0,
      secretsFound: 0,
      crossProjectRefs: 0,
      largestMemory: 0,
      oldestMemory: null,
      diskUsage: 0,
    };
    
    try {
      const dbPath = path.join(projectPath, '.kratos', 'memory.db');
      
      if (await fs.pathExists(dbPath)) {
        const stats = await fs.stat(dbPath);
        audit.diskUsage = stats.size;
        
        // Run security queries on the database
        const secretsResult = await KratosCIHooks.runCommand('sqlite3', [
          dbPath,
          `SELECT COUNT(*) FROM memories WHERE 
           text LIKE '%api_key%' OR 
           text LIKE '%password%' OR 
           text LIKE '%secret%' OR 
           text LIKE '%token%';`
        ]);
        
        if (secretsResult.exitCode === 0) {
          audit.secretsFound = parseInt(secretsResult.output.trim()) || 0;
        }
      }
    } catch (error) {
      logger.warn(`Audit failed for ${projectPath}:`, error);
    }
    
    return audit;
  }

  private static async auditConceptStore(): Promise<any> {
    const audit = {
      totalConcepts: 0,
      averageLength: 0,
      topTags: {},
      diskUsage: 0,
    };
    
    try {
      const conceptDbPath = path.join(require('os').homedir(), '.kratos', 'concept_store.db');
      
      if (await fs.pathExists(conceptDbPath)) {
        const stats = await fs.stat(conceptDbPath);
        audit.diskUsage = stats.size;
        
        const countResult = await KratosCIHooks.runCommand('sqlite3', [
          conceptDbPath,
          'SELECT COUNT(*) FROM concepts;'
        ]);
        
        if (countResult.exitCode === 0) {
          audit.totalConcepts = parseInt(countResult.output.trim()) || 0;
        }
      }
    } catch (error) {
      logger.warn('Concept store audit failed:', error);
    }
    
    return audit;
  }

  private static async getProjectStats(projectPath: string): Promise<any> {
    const stats = {
      project: projectPath,
      memoryCount: 0,
      diskUsage: 0,
      topTags: {},
      avgImportance: 0,
    };
    
    try {
      const dbPath = path.join(projectPath, '.kratos', 'memory.db');
      
      if (await fs.pathExists(dbPath)) {
        const fileStats = await fs.stat(dbPath);
        stats.diskUsage = fileStats.size;
        
        // Get memory count
        const countResult = await KratosCIHooks.runCommand('sqlite3', [
          dbPath,
          'SELECT COUNT(*) FROM memories;'
        ]);
        
        if (countResult.exitCode === 0) {
          stats.memoryCount = parseInt(countResult.output.trim()) || 0;
        }
      }
    } catch (error) {
      logger.warn(`Stats collection failed for ${projectPath}:`, error);
    }
    
    return stats;
  }

  private static async getConceptStats(): Promise<any> {
    const stats = {
      totalConcepts: 0,
      diskUsage: 0,
    };
    
    try {
      const conceptDbPath = path.join(require('os').homedir(), '.kratos', 'concept_store.db');
      
      if (await fs.pathExists(conceptDbPath)) {
        const fileStats = await fs.stat(conceptDbPath);
        stats.diskUsage = fileStats.size;
        
        const countResult = await KratosCIHooks.runCommand('sqlite3', [
          conceptDbPath,
          'SELECT COUNT(*) FROM concepts;'
        ]);
        
        if (countResult.exitCode === 0) {
          stats.totalConcepts = parseInt(countResult.output.trim()) || 0;
        }
      }
    } catch (error) {
      logger.warn('Concept stats collection failed:', error);
    }
    
    return stats;
  }

  private static generateSecurityRecommendations(report: any): string[] {
    const recommendations: string[] = [];
    
    if (report.vulnerabilities.some((v: any) => v.type === 'secrets-in-memories')) {
      recommendations.push('Review and remove any secrets stored in memories');
      recommendations.push('Implement stronger redaction patterns in middleware');
    }
    
    if (report.vulnerabilities.some((v: any) => v.type === 'cross-project-references')) {
      recommendations.push('Audit cross-project references for potential data leaks');
      recommendations.push('Consider using concept store for shared knowledge');
    }
    
    return recommendations;
  }

  private static generateMemoryRecommendations(report: any): string[] {
    const recommendations: string[] = [];
    
    const avgMemoriesPerProject = report.summary.totalMemories / report.summary.totalProjects;
    
    if (avgMemoriesPerProject > 1000) {
      recommendations.push('Consider implementing more aggressive TTL policies');
      recommendations.push('Review memory importance scoring to prioritize retention');
    }
    
    if (report.summary.diskUsage > 100 * 1024 * 1024) { // 100MB
      recommendations.push('Database size is large - consider archiving old memories');
      recommendations.push('Run VACUUM on SQLite databases to reclaim space');
    }
    
    return recommendations;
  }

  private static async generateCleanupReport(projects: string[]): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      projectsCleaned: projects.length,
      totalSizeReclaimed: 0,
      memoriesExpired: 0,
    };
    
    const reportPath = path.join(process.cwd(), '.kratos-cleanup-report.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });
    
    logger.info(`Cleanup report saved: ${reportPath}`);
  }

  private static async runCommand(command: string, args: string[]): Promise<{
    exitCode: number;
    output: string;
  }> {
    return new Promise((resolve) => {
      const child = spawn(command, args, { stdio: 'pipe' });
      let output = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      child.on('close', (code) => {
        resolve({
          exitCode: code || 0,
          output: output.trim(),
        });
      });
      
      child.on('error', (error) => {
        resolve({
          exitCode: 1,
          output: error.message,
        });
      });
    });
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'pre-commit':
        const preCommitPassed = await KratosCIHooks.preCommitHook();
        process.exit(preCommitPassed ? 0 : 1);
        break;
        
      case 'pre-push':
        const prePushPassed = await KratosCIHooks.prePushHook();
        process.exit(prePushPassed ? 0 : 1);
        break;
        
      case 'nightly-cleanup':
        await KratosCIHooks.nightlyCleanup();
        break;
        
      case 'security-audit':
        const { passed, report } = await KratosCIHooks.securityAudit();
        console.log(JSON.stringify(report, null, 2));
        process.exit(passed ? 0 : 1);
        break;
        
      case 'memory-report':
        const memoryReport = await KratosCIHooks.generateMemoryReport();
        console.log(JSON.stringify(memoryReport, null, 2));
        break;
        
      default:
        console.log('Usage: kratos-ci-hooks <command>');
        console.log('Commands:');
        console.log('  pre-commit      - Run leak detection tests');
        console.log('  pre-push        - Validate project configurations');
        console.log('  nightly-cleanup - Clean up expired memories');
        console.log('  security-audit  - Check for security vulnerabilities');
        console.log('  memory-report   - Generate memory usage statistics');
        process.exit(1);
    }
  } catch (error) {
    logger.error('CI hook failed:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { KratosCIHooks };