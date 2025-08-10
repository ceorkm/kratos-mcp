#!/usr/bin/env node

// Disable all debug output
delete process.env.KRATOS_DEBUG;

// Import the server module
import('../dist/index.js');