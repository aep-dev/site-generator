import * as fs from 'fs';
import * as path from 'path';
import sampleCode from '../src/components/utils/sample';
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

console.log('\n🎉 All tests passed!'); 