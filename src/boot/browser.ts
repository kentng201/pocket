import { ConfigPersistor } from '..';

export default async function getConfig() {
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