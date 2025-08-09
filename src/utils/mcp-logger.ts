/**
 * MCP-safe logger that outputs to stderr to avoid corrupting JSON-RPC protocol
 */
export class MCPLogger {
  private service: string;
  private enabled: boolean;

  constructor(service: string) {
    this.service = service;
    // Only enable logging if explicitly requested
    this.enabled = process.env.KRATOS_DEBUG === 'true';
  }

  private log(level: string, message: string, meta?: any) {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.service,
      message,
      ...meta
    };
    
    // CRITICAL: Output to stderr, not stdout
    // stdout is reserved for JSON-RPC protocol
    process.stderr.write(JSON.stringify(logEntry) + '\n');
  }

  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }

  error(message: string, error?: any) {
    this.log('error', message, { error: error?.message || error });
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }

  debug(message: string, meta?: any) {
    this.log('debug', message, meta);
  }
}