# Migrating to ESM (v7.0.0)

## Breaking Change

Version 7.0.0 of `@nextcapital/copy-service` has migrated from CommonJS to ES Modules (ESM). This is a **breaking change** that requires consumers to update their import statements.

## Required Changes

### Import Syntax

**Before (CommonJS):**

```javascript
const { CopyService } = require('@nextcapital/copy-service');
const HtmlEvaluator = require('@nextcapital/copy-service/HtmlEvaluator').default;
```

**After (ESM):**

```javascript
import { CopyService } from '@nextcapital/copy-service';
import HtmlEvaluator from '@nextcapital/copy-service/HtmlEvaluator';
```

### All Available Exports

All exports are now available as named exports:

```javascript
import {
  CopyService,
  IntlCopyService,
  Evaluator,
  ErrorHandler,
  Substitutions,
  HtmlEvaluator,
  PlainTextEvaluator,
  ReactEvaluator,
  Formatting,
  Functional,
  Newline,
  Reference,
  RefSubstitute,
  Substitute,
  Switch,
  Verbatim,
  WordBreak
} from '@nextcapital/copy-service';
```

### Subpath Exports

The evaluator subpath exports now use default exports:

```javascript
// HtmlEvaluator
import HtmlEvaluator from '@nextcapital/copy-service/HtmlEvaluator';

// PlainTextEvaluator
import PlainTextEvaluator from '@nextcapital/copy-service/PlainTextEvaluator';

// ReactEvaluator
import ReactEvaluator from '@nextcapital/copy-service/ReactEvaluator';
```

## Requirements

- **Node.js >= 18.0.0** (already required by previous versions)
- Your project must use ESM:
  - Add `"type": "module"` to your package.json, OR
  - Use `.mjs` file extensions for ES modules

## Common Migration Issues

### 1. Cannot use `require()`

**Problem:** `require()` is not available in ESM modules.

**Solution:** Use dynamic imports for conditional loading:

```javascript
// Instead of:
const service = condition ? require('@nextcapital/copy-service') : null;

// Use:
const service = condition ? await import('@nextcapital/copy-service') : null;
```

### 2. Jest Compatibility

**Problem:** Jest may not work with ESM modules by default.

**Solution:** Update your `jest.config.js` (or rename to `jest.config.cjs`):

```javascript
module.exports = {
  // ... other config
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        esModuleInterop: true
      }
    }]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx']
};
```

### 3. TypeScript Configuration

**Problem:** TypeScript may not compile ESM modules correctly.

**Solution:** Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "node16",
    "esModuleInterop": true
  }
}
```

### 4. Webpack/Bundler Configuration

**Problem:** Older webpack configurations may not handle ESM.

**Solution:** Modern bundlers (webpack 5+, vite, rollup) handle ESM natively. Ensure you're using a recent version:

- Webpack: >= 5.0.0
- Vite: Any version (ESM-first)
- Rollup: >= 2.0.0

### 5. `__dirname` and `__filename` Not Available

**Problem:** CommonJS globals are not available in ESM.

**Solution:** Use `import.meta.url`:

```javascript
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

## Benefits of ESM Migration

- **Better Tree Shaking:** Unused exports are eliminated from production bundles
- **Native Browser Support:** ES modules work directly in modern browsers
- **Faster Module Loading:** Asynchronous module loading improves performance
- **Better Static Analysis:** Tools can better understand module dependencies
- **Future-Proof:** ESM is the JavaScript standard going forward

## Need Help?

If you encounter issues during migration, please:

1. Check this guide for common issues
2. Review the [Node.js ESM documentation](https://nodejs.org/api/esm.html)
3. Open an issue on [GitHub](https://github.com/nextcapital/copy-service/issues)

## Version History

- **v7.0.0:** Migrated to ESM (breaking change)
- **v6.0.0:** Last CommonJS version
