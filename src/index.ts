export * from 'src/manager/DatabaseManager';
export * from 'src/manager/RepoManager';

export * from 'src/model/Model';
export * from 'src/query-builder/QueryBuilder';
export * from 'src/real-time/RealTimeModel';
export * from 'src/real-time/DatabaseSync';
export * from 'src/relationships/RelationshipDecorator';
export * from 'src/model/ModelDecorator';
export * from 'src/boot';

import { boot as bootBrowser } from 'src/boot-browser';
import { boot as bootNode } from 'src/boot-node';
export default {
    browser: bootBrowser,
    node: bootNode,
};