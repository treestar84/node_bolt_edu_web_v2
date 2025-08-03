/**
 * @fileoverview Script to generate Swagger documentation
 * @description Generates swagger.json file from JSDoc comments in route files
 */

import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerConfig from '../swagger.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Generating Swagger documentation...');

try {
  // Generate OpenAPI specification
  const specs = swaggerJsdoc(swaggerConfig);
  
  // Write to swagger.json
  const outputPath = path.join(__dirname, '..', 'swagger.json');
  fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2));
  
  console.log('✅ Swagger documentation generated successfully!');
  console.log(`📄 File saved to: ${outputPath}`);
  console.log(`📊 Total paths documented: ${Object.keys(specs.paths || {}).length}`);
  
  // List all documented endpoints
  if (specs.paths) {
    console.log('\n📋 Documented endpoints:');
    Object.entries(specs.paths).forEach(([path, methods]) => {
      Object.keys(methods).forEach(method => {
        const methodUpper = method.toUpperCase();
        const summary = methods[method].summary || 'No summary';
        console.log(`  ${methodUpper.padEnd(6)} ${path} - ${summary}`);
      });
    });
  }
  
  console.log('\n🌐 To view the documentation:');
  console.log('  1. Run: npm run swagger:serve');
  console.log('  2. Or open swagger.json in Swagger Editor: https://editor.swagger.io/');
  
} catch (error) {
  console.error('❌ Error generating Swagger documentation:', error.message);
  process.exit(1);
}