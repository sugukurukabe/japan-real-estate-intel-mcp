#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import { logger } from './logger.js';

async function main() {
  logger.info('Starting japan-real-estate-intel-mcp (stdio)');
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('MCP server connected via stdio');
}

main().catch((err) => {
  logger.fatal({ err }, 'Fatal error — exiting');
  process.exit(1);
});
