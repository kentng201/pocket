import { Persistor } from '../helpers/Persistor';
import { MultiPocketConfig, SinglePocketConfig } from '../definitions/boot';
export declare class ConfigPersistor extends Persistor {
}
export declare function replaceEnvVariable<Config extends SinglePocketConfig | MultiPocketConfig>(config: Config): Config;
export declare function setupConfig<Config extends SinglePocketConfig | MultiPocketConfig>(config?: Config): Promise<void>;
