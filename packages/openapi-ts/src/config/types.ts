import type {
  BaseConfig,
  BaseUserConfig,
  Plugin,
  PluginConfigMap,
  PluginNames,
} from '@hey-api/shared';

import type { Output, UserOutput } from './output/types';

export type UserConfig = BaseUserConfig<UserOutput> & {
  /**
   * Directory to resolve relative paths against: the config file and
   * `.openapi-tsrc` lookup, the `package.json` that dependencies are read
   * from when no config file is found, `input` file paths, `output.path`,
   * and plugin paths such as `runtimeConfigPath`. A relative value resolves
   * against `process.cwd()`.
   *
   * Set this when calling `createClient()` for a project other than the
   * current working directory.
   *
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * Plugins generate artifacts from `input`. By default, we generate an SDK
   * and TypeScript interfaces. If you manually define `plugins`, you need to
   * include the default plugins if you wish to use them.
   *
   * @default ['@hey-api/typescript', '@hey-api/sdk']
   */
  plugins?: ReadonlyArray<
    | PluginNames
    | {
        [K in PluginNames]: PluginConfigMap[K]['config'] & {
          name: K;
        };
      }[PluginNames]
  >;
};

export type Config = BaseConfig<UserConfig, Output> & {
  pluginOrder: ReadonlyArray<keyof PluginConfigMap>;
  plugins: {
    [K in PluginNames]?: Plugin.Stored<PluginConfigMap[K]>;
  };
};
