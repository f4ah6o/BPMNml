import * as esbuild from 'esbuild';
import { argv } from 'node:process';

const watch = argv.includes('--watch');

const ctx = await esbuild.context({
    entryPoints: ['src/language-server/main.ts'],
    outfile: 'out/language-server/bundle.js',
    bundle: true,
    target: 'ES2022',
    format: 'esm',
    loader: { '.ts': 'ts' },
    external: ['vscode'],
    platform: 'node',
    sourcemap: true,
});

if (watch) {
    await ctx.watch();
    console.log('Watching...');
} else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log('Build complete');
}
