/// <reference types="node" />
import { BaseModel } from '../model/Model';
import EventEmitter from 'events';
export declare let isRealTime: boolean;
export declare const docEvent: EventEmitter;
export declare function emitChangeEvent(_id: string, doc: BaseModel): void;
export declare function setDocChangeEventListener(listener: (id: string, doc: BaseModel) => void | Promise<void>): EventEmitter;
export declare function setRealtime(realTime: boolean): void;
export declare function needToReload(model: BaseModel, changeDocId: string): boolean;
