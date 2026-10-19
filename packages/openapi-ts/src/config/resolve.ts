import path from 'node:path';
import { styleText } from 'node:util';

import { detectInteractiveSession } from '@hey-api/codegen-core';
import { ConfigError, getInput, getLogs, getParser, resolvePlugins } from '@hey-api/shared';

import { defaultPluginConfigs, defaultPlugins } from '../plugins/config';
import { getOutput } from './output/config';
import type { Config } from './types';
import type { ValidationResult } from './validate';

export type ResolvedJob = {
  config: Config;
  errors: Array<Error>;
  index: number;
};

function isRelativeFilePath(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    !path.isAbsolute(value) &&
    // URLs and shorthands such as `https://`, `readme:` or `scalar:`
    !/^[a-z][a-z\d+.-]+:/i.test(value)
  );
}

export function resolveConfig(
  validated: ValidationResult,
  dependencies: Record<string, string>,
): ResolvedJob {
  const cwd = path.resolve(validated.job.config.cwd ?? '.');
  const logs = getLogs(validated.job.config.logs);
  const input = getInput(validated.job.config);
  if (validated.job.config.cwd !== undefined) {
    for (const item of input) {
      if (isRelativeFilePath(item.path)) {
        item.path = path.resolve(cwd, item.path);
      }
    }
  }
  const output = getOutput(validated.job.config);
  const parser = getParser(validated.job.config);

  let plugins: Pick<Config, 'plugins' | 'pluginOrder'>;

  try {
    plugins = resolvePlugins({
      defaultPluginConfigs,
      defaultPlugins,
      dependencies,
      userConfig: validated.job.config,
    });
  } catch (error) {
    if (error instanceof ConfigError) {
      validated.errors.push(error);
    }
    plugins = {
      pluginOrder: [],
      plugins: {},
    };
  }

  const config: Config = {
    configFile: validated.job.config.configFile ?? '',
    cwd,
    dryRun: validated.job.config.dryRun ?? false,
    input,
    interactive: validated.job.config.interactive ?? detectInteractiveSession(),
    logs,
    output,
    parser,
    pluginOrder: plugins.pluginOrder,
    plugins: plugins.plugins,
    presets: validated.job.config.presets ?? [],
  };

  if (logs.level === 'debug') {
    const jobPrefix = styleText('gray', `[Job ${validated.job.index}] `);
    console.warn(`${jobPrefix}${styleText('cyan', 'config:')}`, config);
  }

  return {
    config,
    errors: validated.errors,
    index: validated.job.index,
  };
}
