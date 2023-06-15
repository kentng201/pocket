import getNodeConfig from 'src/boot/node';
import { replaceEnvVariable, setupConfig } from './boot';

export const boot = async () => {
    let config = await getNodeConfig();
    config = replaceEnvVariable(config);
    return setupConfig(config);
};