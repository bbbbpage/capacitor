import { Capacitor, Plugins } from './global';
import { WebPlugin } from './web';

const PLUGIN_REGISTRY = new (class {
  protected readonly plugins: {
    [plugin: string]: RegisteredPlugin<unknown>;
  } = {};

  get(name: string): RegisteredPlugin<unknown> | undefined {
    return this.plugins[name];
  }

  getAll(): RegisteredPlugin<unknown>[] {
    return Object.values(this.plugins);
  }

  has(name: string): boolean {
    return !!this.get(name);
  }

  register(plugin: RegisteredPlugin<unknown>): void {
    this.plugins[plugin.name] = plugin;
  }
})();

/**
 * A map of plugin implementations.
 *
 * Each key should be the lowercased platform name as recognized by Capacitor,
 * e.g. 'android', 'ios', and 'web'. Each value must be an instance of a plugin
 * implementation for the respective platform.
 */
export type PluginImplementations<T> = {
  [platform: string]: T;
};

/**
 * Represents a plugin registered with Capacitor.
 */
export class RegisteredPlugin<T> {
  constructor(
    readonly name: string,
    readonly implementations: Readonly<PluginImplementations<T>>,
  ) {}

  /**
   * Return the appropriate implementation of this plugin.
   *
   * Supply a platform to return the implementation for it, otherwise this
   * method will return the implementation for the current platform as detected
   * by Capacitor.
   *
   * @param platform Optionally return the implementation of the given
   *                 platform.
   */
  getImplementation(platform?: string): T | undefined {
    return this.implementations[platform ? platform : Capacitor.platform];
  }
}

/**
 * Register plugin implementations with Capacitor.
 *
 * This function will create and register an instance that contains the
 * implementations of the plugin.
 *
 * Each plugin has multiple implementations, one per platform. Each
 * implementation must adhere to a common interface to ensure client code
 * behaves consistently across each platform.
 *
 * @param name The unique CamelCase name of this plugin.
 * @param implementations The map of plugin implementations.
 */
export const registerPlugin = <T>(
  name: string,
  implementations: Readonly<PluginImplementations<T>>,
): RegisteredPlugin<T> => {
  const plugin = new RegisteredPlugin(name, implementations);
  PLUGIN_REGISTRY.register(plugin);

  return plugin;
};

/**
 * TODO
 *
 * @deprecated Don't use this.
 */
export const registerWebPlugin = (plugin: WebPlugin) => {
  console.warn(
    `Capacitor plugin ${plugin.config.name} is using deprecated method 'registerWebPlugin'`,
  ); // TODO: add link to upgrade guide

  if (!PLUGIN_REGISTRY.has(plugin.config.name)) {
    const { name, platforms = ['web'] } = plugin.config;
    const implementations: PluginImplementations<unknown> = {};

    PLUGIN_REGISTRY.register(
      new RegisteredPlugin(
        name,
        platforms.reduce((acc, value) => {
          acc[value] = plugin;
          return acc;
        }, implementations),
      ),
    );

    mergeWebPlugin(plugin);
  }
};

const shouldMergeWebPlugin = (plugin: WebPlugin) => {
  return (
    plugin.config.platforms &&
    plugin.config.platforms.indexOf(Capacitor.platform) >= 0
  );
};

const mergeWebPlugin = (plugin: WebPlugin) => {
  if (
    Plugins.hasOwnProperty(plugin.config.name) &&
    !shouldMergeWebPlugin(plugin)
  ) {
    return;
  }

  Plugins[plugin.config.name] = plugin;
};