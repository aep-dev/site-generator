import * as fs from 'fs';
import * as path from 'path';
import sampleCode from '../src/components/utils/sample';
import { buildLLMsTxt } from '../scripts/generate';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple test function
function runTest(testName: string, testFn: () => void) {
  try {
    testFn();
    console.log(`✅ ${testName} - PASSED`);
  } catch (error) {
    console.error(`❌ ${testName} - FAILED:`, error);
    process.exit(1);
  }
}

// Test 1: sampleCode function with YAML type and book path property
runTest('sampleCode function with YAML type and book path property', () => {
  // Read the test file content
  const testFilePath = path.join(__dirname, 'example.oas.yaml');
  const code = fs.readFileSync(testFilePath, 'utf-8');
  
  // Test parameters as specified
  const type = 'yml';
  const token1 = '$.components.schemas.book.properties.path';
  const token2 = '';
  
  // Call the sampleCode function
  const result = sampleCode(code, type, token1, token2);
  
  // Expected result should be a YAML structure containing the path property
  // from the book schema. The sampleYaml function creates a nested structure
  // where the final segment (path) becomes a key containing the actual value.
  const expectedYaml = `components:
  schemas:
    book:
      properties:
        path:
          type: string
          readOnly: true
`;
  
  // Assert the result matches expected output
  if (result.trim() !== expectedYaml.trim()) {
    throw new Error(`Expected:\n${expectedYaml}\n\nGot:\n${result}`);
  }
});

// Test 2: sampleCode function should throw error for invalid JSON path
runTest('sampleCode function should throw error for invalid JSON path', () => {
  const code = `components:
  schemas:
    book:
      properties:
        path:
          type: string
`;
  
  const type = 'yml';
  const token1 = '$.components.schemas.book.properties.nonexistent';
  const token2 = '';
  
  // Should throw an error for invalid path
  try {
    sampleCode(code, type, token1, token2);
    throw new Error('Expected error was not thrown');
  } catch (error) {
    if (!error.message.includes('Invalid JSON Path')) {
      throw new Error(`Expected 'Invalid JSON Path' error, got: ${error.message}`);
    }
  }
});

// Test 3: sampleCode function should throw error for unsupported type
runTest('sampleCode function should throw error for unsupported type', () => {
  const code = 'some code';
  const type = 'unsupported';
  const token1 = 'some.token';
  const token2 = '';
  
  // Should throw an error for unsupported type
  try {
    sampleCode(code, type, token1, token2);
    throw new Error('Expected error was not thrown');
  } catch (error) {
    if (!error.message.includes('Type not found')) {
      throw new Error(`Expected 'Type not found' error, got: ${error.message}`);
    }
  }
});

// Test 4: buildLLMsTxt function generates correct format
runTest('buildLLMsTxt function generates correct llms.txt format', () => {
  // Mock AEP data
  const mockAeps = [
    {
      id: '140',
      title: 'Field Behavior',
      contents: { 
        contents: 'This AEP defines field behavior patterns.\n\n## Overview\n\nField behavior is important for APIs.' 
      }
    },
    {
      id: '1',
      title: 'AEP Purpose and Guidelines',
      contents: { 
        contents: 'This document describes the AEP process.\n\n## What is an AEP?\n\nAn AEP is a design document providing information.' 
      }
    },
    {
      id: '133',
      title: 'Standard Methods: Create',
      contents: { 
        contents: 'import { Sample } from "../../components/Sample.astro";\n\nThis AEP defines create methods.\n\n<Sample type="proto" /><!-- Comment -->\n\n{/* JSX comment */}' 
      }
    }
  ];
  
  const result = buildLLMsTxt(mockAeps);
  
  // Verify AEPs are sorted by ID
  const lines = result.split('\n');
  const aep1Index = lines.findIndex(line => line.includes('AEP-1 AEP Purpose'));
  const aep133Index = lines.findIndex(line => line.includes('AEP-133 Standard Methods'));
  const aep140Index = lines.findIndex(line => line.includes('AEP-140 Field Behavior'));
  
  if (aep1Index === -1 || aep133Index === -1 || aep140Index === -1) {
    throw new Error('Not all AEPs found in output');
  }
  
  if (!(aep1Index < aep133Index && aep133Index < aep140Index)) {
    throw new Error('AEPs not sorted correctly by ID');
  }
  
  // Verify section separators
  if (!result.includes('\n---\n')) {
    throw new Error('Section separators not found');
  }
  
  // Verify MDX artifacts are removed
  if (result.includes('import {') || result.includes('<Sample') || result.includes('{/* JSX comment */}')) {
    throw new Error('MDX artifacts not properly removed');
  }
  
  // Verify HTML comments are removed
  if (result.includes('<!-- Comment -->')) {
    throw new Error('HTML comments not properly removed');
  }
  
  // Verify proper heading format
  if (!result.includes('# AEP-1 AEP Purpose and Guidelines') || 
      !result.includes('# AEP-133 Standard Methods: Create') ||
      !result.includes('# AEP-140 Field Behavior')) {
    throw new Error('Heading format incorrect');
  }
  
  // Verify content is present
  if (!result.includes('This document describes the AEP process') ||
      !result.includes('Field behavior is important for APIs') ||
      !result.includes('This AEP defines create methods')) {
    throw new Error('Content not properly included');
  }
});

console.log('\n🎉 All tests passed!'); 