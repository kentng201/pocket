import { ConfigPersistor } from '..';

export default async function getConfig() {
    try {
        const configFilePath = process.cwd() + '/pocket.config.json';
        const fs = require('fs');
        const file = fs.readFileSync(configFilePath, 'utf8');
        const config = JSON.parse(file);
        ConfigPersistor.set(config);
        return config;
    } catch (error) {
        return ConfigPersistor.get();
    }
}