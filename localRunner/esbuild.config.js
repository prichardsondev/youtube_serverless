// esbuild.config.js
import { build } from 'esbuild';

build({
  entryPoints: ['./createUserHandler.mjs'],
  outfile: 'dist/index.mjs',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',  // 👈 Keeps ESM output
  sourcemap: true,
  minify: true,
  external: [      // Optional: leave SDK out if Lambda runtime provides it
    '@aws-sdk/credential-provider-sso',
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/lib-dynamodb'
  ]
}).catch(() => process.exit(1));
