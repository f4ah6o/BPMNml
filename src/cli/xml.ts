import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { URI } from 'langium';
import { NodeFileSystem } from 'langium/node';
import type { BPMN } from '../generated/ast.js';
import { createBPMNmlServices } from '../language/bpmn/bpmn-module.js';
import { BPMNXMLGenerator } from './generator.js';

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const sanitizedArgs = args[0] === '--' ? args.slice(1) : args;
    const [inputPath, outputPath] = sanitizedArgs;
    if (!inputPath) {
        console.error('Usage: pnpm bpmnxml -- <input.bpmn> [output.xml]');
        process.exit(1);
    }

    const absoluteInputPath = resolve(process.cwd(), inputPath);
    const source = await readFile(absoluteInputPath, 'utf-8');

    const { shared } = createBPMNmlServices(NodeFileSystem);
    const uri = URI.file(absoluteInputPath);
    const document = shared.workspace.LangiumDocuments.createDocument(uri, source);
    await shared.workspace.DocumentBuilder.build([document], { validation: true });

    const diagnostics = document.diagnostics ?? [];
    const errors = diagnostics.filter((diag) => diag.severity === DiagnosticSeverity.Error);
    if (errors.length > 0) {
        for (const error of errors) {
            const line = error.range.start.line + 1;
            const column = error.range.start.character + 1;
            console.error(`${absoluteInputPath}:${line}:${column} ${error.message}`);
        }
        process.exit(1);
    }

    const model = document.parseResult.value as BPMN;
    const xml = new BPMNXMLGenerator().generateXML(model);

    if (outputPath) {
        const absoluteOutputPath = resolve(process.cwd(), outputPath);
        await writeFile(absoluteOutputPath, xml, 'utf-8');
    } else {
        process.stdout.write(xml);
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
