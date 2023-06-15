import { replaceEnvVariable, setupConfig, ConfigPersistor } from 'src/boot';

async function getConfig() {
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

export default async function pocketBrowser() {
    let config = await getConfig();
    config = replaceEnvVariable(config);
    return setupConfig(config);
}