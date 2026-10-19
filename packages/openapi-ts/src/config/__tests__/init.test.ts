import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { Logger } from '@hey-api/codegen-core';

import { resolveJobs } from '../init';
import type { UserConfig } from '../types';

describe('resolveJobs', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'openapi-ts-init-'));
    fs.writeFileSync(
      path.join(cwd, 'package.json'),
      JSON.stringify({ dependencies: { zod: '^3.22.0' }, name: 'app' }),
    );
  });

  afterEach(() => {
    fs.rmSync(cwd, { force: true, recursive: true });
  });

  it('loads the config file from cwd and resolves its relative paths against cwd', async () => {
    fs.writeFileSync(
      path.join(cwd, 'openapi-ts.config.mjs'),
      "export default { input: './openapi.json', output: './src/client' };\n",
    );
    fs.writeFileSync(path.join(cwd, '.openapi-tsrc'), 'dryRun=true\n');

    const { dependencies, jobs } = await resolveJobs({
      logger: new Logger(),
      userConfigs: [{ cwd } as UserConfig],
    });

    expect(jobs).toHaveLength(1);
    const { config } = jobs[0]!;
    expect(config.cwd).toBe(cwd);
    expect(config.dryRun).toBe(true);
    expect(config.input[0]!.path).toBe(path.join(cwd, 'openapi.json'));
    expect(config.output.path).toBe(path.join(cwd, 'src/client'));
    expect(dependencies).toEqual({ zod: '^3.22.0' });
  });

  it('reads dependencies from cwd when there is no config file', async () => {
    const { dependencies, jobs } = await resolveJobs({
      logger: new Logger(),
      userConfigs: [{ cwd, input: 'openapi.json', output: 'src/client' }],
    });

    const { config } = jobs[0]!;
    expect(config.input[0]!.path).toBe(path.join(cwd, 'openapi.json'));
    expect(config.output.path).toBe(path.join(cwd, 'src/client'));
    expect(dependencies).toEqual({ zod: '^3.22.0' });
  });

  it('leaves URLs untouched', async () => {
    const { jobs } = await resolveJobs({
      logger: new Logger(),
      userConfigs: [{ cwd, input: 'https://example.com/openapi.json', output: 'src/client' }],
    });

    expect(jobs[0]!.config.input[0]!.path).toBe('https://example.com/openapi.json');
  });

  it('defaults cwd to process.cwd()', async () => {
    const { jobs } = await resolveJobs({
      logger: new Logger(),
      userConfigs: [{ input: 'openapi.json', output: path.join(cwd, 'src/client') }],
    });

    const { config } = jobs[0]!;
    expect(config.cwd).toBe(process.cwd());
    expect(config.input[0]!.path).toBe('openapi.json');
  });
});
