import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { loadConfigFile } from '../config/load';
import { Logger } from '../logger';

describe('loadConfigFile', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'codegen-core-load-'));
  });

  afterEach(() => {
    fs.rmSync(cwd, { force: true, recursive: true });
  });

  it('looks up the config file and rc file in cwd', async () => {
    fs.writeFileSync(
      path.join(cwd, 'heyapi-test.config.mjs'),
      "export default { fromFile: 'file' };\n",
    );
    fs.writeFileSync(path.join(cwd, '.heyapi-testrc'), 'fromRc=rc\n');

    const loaded = await loadConfigFile({
      configFile: undefined,
      cwd,
      logger: new Logger(),
      name: 'heyapi-test',
      userConfig: {},
    });

    expect(loaded.foundConfig).toBe(true);
    expect(loaded.configFile).toBe(path.join(cwd, 'heyapi-test.config.mjs'));
    expect(loaded.configs).toEqual([{ fromFile: 'file', fromRc: 'rc' }]);
  });

  it('resolves a relative config file against cwd', async () => {
    fs.mkdirSync(path.join(cwd, 'nested'));
    fs.writeFileSync(
      path.join(cwd, 'nested', 'custom.mjs'),
      "export default { fromFile: 'nested' };\n",
    );

    const loaded = await loadConfigFile({
      configFile: 'nested/custom',
      cwd,
      logger: new Logger(),
      name: 'heyapi-test',
      userConfig: { fromUser: 'user' },
    });

    expect(loaded.configFile).toBe(path.join(cwd, 'nested', 'custom.mjs'));
    expect(loaded.configs).toEqual([{ fromFile: 'nested', fromUser: 'user' }]);
  });
});
