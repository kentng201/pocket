import getBrowserConfig from 'src/boot/browser';
import { replaceEnvVariable, setupConfig } from './boot';

export const boot = async () => {
    let config = await getBrowserConfig();
    config = replaceEnvVariable(config);
    return setupConfig(config);
};