import { replaceEnvVariable, setupConfig, ConfigPersistor } from 'src/boot';
import { MultiPocketConfig, SinglePocketConfig } from 'src/definitions/boot';

export async function setConfig(config: SinglePocketConfig | MultiPocketConfig) {
    ConfigPersistor.set(config);
    return config;
}
export function hasPersistedConfig() {
    return !!ConfigPersistor.get();
}

async function getConfig() {
    if (hasPersistedConfig()) {
        return ConfigPersistor.get();
    }
    const configFilePath = 'pocket.config.json';
    try {
        const file = await fetch(configFilePath);
        const result = await file.text();
        const config = JSON.parse(result);
        ConfigPersistor.set(config);
        return config;
    } catch (error) {
        return ConfigPersistor.get();
    }
}
export default async function pocket() {
    let config = await getConfig();
    config = replaceEnvVariable(config);
    return setupConfig(config);
}