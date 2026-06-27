---
name: mcp-tool-development
description: Guidelines and step-by-step instructions for adding or modifying MCP tools in the Japan Real Estate Intel MCP project.
---
# MCP Tool Development Skill

Use this skill when you need to add, modify, or debug MCP tools in this codebase.

## Step-by-Step Tool Creation Workflow

1. **Define Schema**:
   Open `src/schemas.ts` and define the input Zod schema and output TypeScript type:
   ```typescript
   export const MyNewToolInput = z.object({
     prefecture: z.string().describe('Target prefecture name in JA or EN'),
     // ... other parameters
   });
   export type MyNewToolInput = z.infer<typeof MyNewToolInput>;
   export type MyNewToolOutput = {
     // ... output structure
   };
   ```

2. **Implement Logic**:
   Create a new file in `src/tools/my_new_tool.ts`:
   ```typescript
   import type { MyNewToolInput, MyNewToolOutput } from '../schemas.js';
   import { resolvePrefecture } from '../prefecture/resolver.js';
   import { getLoader } from '../data-loaders/index.js';

   export async function myNewTool(input: MyNewToolInput): Promise<MyNewToolOutput> {
     const prefKey = resolvePrefecture(input.prefecture);
     const loader = getLoader(prefKey);
     // ... logic
     return { ... };
   }
   ```

3. **Register Tool**:
   Open `src/server.ts` and register the tool:
   - Import the tool implementation and its input schema.
   - Register it with `server.tool` inside `createServer()` using `withErrorHandling`.
   ```typescript
   server.tool(
     'my_new_tool',
     'Description of what the tool does in both Japanese and English.',
     MyNewToolInput,
     (args) => withErrorHandling('my_new_tool', args.prefecture, async () => {
       const result = await myNewTool(args);
       return {
         content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
         structuredContent: result,
       };
     })
   );
   ```

4. **Add Tests**:
   Create `tests/my_new_tool.test.ts` or add tests in existing test suite under `tests/`. Use Vitest:
   - Run `npm run test` to verify.

5. **Lint and Format**:
   Run `npm run lint` and `npm run format`.
