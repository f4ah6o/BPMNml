# BPMNml Implementation

This document describes the implementation details of the BPMNml project.

## Project Structure

```
BPMNml/
├── src/
│   ├── generated/          # Auto-generated files by Langium
│   │   ├── ast.ts          # AST type definitions
│   │   ├── grammar.ts      # Parser grammar
│   │   └── module.ts       # Langium module
│   ├── language/
│   │   ├── common/
│   │   │   └── common.langium    # Common Mermaid grammar fragments
│   │   └── bpmn/
│   │       ├── bpmn.langium      # BPMN grammar definition
│   │       ├── bpmn-module.ts    # BPMN language module
│   │       ├── bpmn-validator.ts # Validation rules
│   │       └── bpmn-scope-provider.ts  # Scoping rules
│   ├── language-server/
│   │   └── main.ts         # Language server entry point
│   └── cli/
│       └── generator.ts    # BPMN XML generator
├── examples/               # Example BPMN files
├── test/                   # Test files
├── out/                    # Build output
├── syntaxes/               # TextMate grammar for syntax highlighting
├── package.json
├── tsconfig.json
├── langium-config.json
└── esbuild.mjs

```

## Key Components

### 1. Grammar Definition (src/language/bpmn/bpmn.langium)

The grammar defines the BPMN markup language syntax based on Mermaid conventions:

- **Entry rule**: `BPMN` - starts with `bpmn-beta` keyword
- **Elements**: Events, Tasks, Gateways, Pools, Lanes
- **Connections**: Defines relationships between nodes
- **Annotations**: Type annotations using `<<type>>` syntax

### 2. Validation (src/language/bpmn/bpmn-validator.ts)

Implements validation rules:
- Connection source/target validation
- Duplicate node name detection
- Container (Pool/Lane) validation
- Cross-reference checking

### 3. Scoping (src/language/bpmn/bpmn-scope-provider.ts)

Manages name resolution:
- Pool/Lane scope isolation
- Global scope for top-level elements
- Cross-reference resolution

### 4. Language Server (src/language-server/main.ts)

Provides LSP features:
- Syntax highlighting
- Error reporting
- Auto-completion (extensible)
- Go-to-definition (extensible)

### 5. XML Generator (src/cli/generator.ts)

Converts BPMNml AST to BPMN 2.0 XML:
- Element mapping
- ID generation
- Sequence flow generation

## Building

```bash
npm install
npm run langium:generate  # Generate parser from grammar
npm run build             # Build with esbuild
```

## Features Implemented

- ✅ Basic BPMN elements (Events, Tasks, Gateways)
- ✅ Event types (start, end, intermediate, message, timer, etc.)
- ✅ Task types (service, user, manual, send, receive, script, business-rule)
- ✅ Gateway types (exclusive, parallel, inclusive, event-based, complex)
- ✅ Pools and Lanes
- ✅ Connections with labels
- ✅ Validation rules
- ✅ Scope management
- ✅ BPMN XML code generator
- ✅ Example files

## Features To-Do

- ⬜ Full collaboration diagram support
- ⬜ Message flows between pools
- ⬜ Data objects and associations
- ⬜ Boundary events
- ⬜ Sub-processes
- ⬜ Advanced validation rules
- ⬜ VS Code extension
- ⬜ CLI tool for XML generation
- ⬜ Integration with bpmn.io

## Technical Notes

### TypeScript Configuration

The project uses ESNext modules with Bundler module resolution. Import paths use `.ts` extensions which are resolved correctly by esbuild.

### Build Process

1. Langium CLI generates TypeScript code from `.langium` files
2. esbuild bundles the entire project directly from TypeScript sources
3. No intermediate `tsc` compilation step required

### Module Resolution

Due to TypeScript module resolution complexities, the project:
- Uses explicit `.ts` extensions in imports for generated files
- Corrected paths from `../generated/*` to `../../generated/*`
- Builds directly with esbuild instead of tsc

## References

- [Langium Documentation](https://langium.org/docs/)
- [BPMN 2.0 Specification](https://www.omg.org/spec/BPMN/)
- [Mermaid Class Diagrams](https://mermaid.js.org/syntax/classDiagram.html)
