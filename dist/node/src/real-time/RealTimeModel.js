"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.needToReload = exports.setRealtime = exports.setDocChangeEventListener = exports.emitChangeEvent = exports.docEvent = exports.isRealTime = void 0;
const DatabaseManager_1 = require("../manager/DatabaseManager");
const Model_1 = require("../model/Model");
const events_1 = __importDefault(require("events"));
const __1 = require("..");
exports.isRealTime = false;
const dbChangeListenerMap = {};
exports.docEvent = new events_1.default();
function emitChangeEvent(_id, doc) {
    exports.docEvent.emit('docChange', _id, doc);
}
exports.emitChangeEvent = emitChangeEvent;
function setDocChangeEventListener(listener) {
    return exports.docEvent.on('docChange', listener);
}
exports.setDocChangeEventListener = setDocChangeEventListener;
function setRealtime(realTime) {
    exports.isRealTime = realTime;
    const onRealTimeChange = (change, name) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const _id = ((_a = change.doc) === null || _a === void 0 ? void 0 : _a._id) || change.id;
        let doc = change.doc;
        if (!doc) {
            doc = yield ((_b = DatabaseManager_1.DatabaseManager.get(name)) === null || _b === void 0 ? void 0 : _b.get(_id));
            doc._rev = change.changes[0].rev;
        }
        doc.id = _id;
        delete doc._id;
        const modelName = (0, __1.getModelName)(_id.split('.')[0]);
        if (!modelName)
            return;
        const ExpectedModelClass = (0, __1.getModelClass)(modelName);
        if (!ExpectedModelClass)
            return;
        doc = new ExpectedModelClass(doc);
        emitChangeEvent(doc.id, doc);
    });
    if (exports.isRealTime) {
        Object.values(DatabaseManager_1.DatabaseManager.databases).forEach((db) => {
            if (!db)
                return;
            if (dbChangeListenerMap[db.name])
                return;
            dbChangeListenerMap[db.name] = db.changes({
                since: 'now',
                include_docs: true,
                live: true,
            }).on('change', (change) => onRealTimeChange(change, db.name));
        });
    }
    else {
        Object.values(DatabaseManager_1.DatabaseManager.databases).forEach((db) => {
            db === null || db === void 0 ? void 0 : db.removeAllListeners('change');
        });
    }
}
exports.setRealtime = setRealtime;
function needToReload(model, changeDocId) {
    let needReload = false;
    for (const key of Object.keys(model)) {
        if (model.docId === changeDocId) {
            needReload = true;
            break;
        }
        if (model[key] === changeDocId) {
            needReload = true;
            break;
        }
        if (model[key] instanceof Model_1.Model) {
            needReload = needToReload(model[key], changeDocId);
            if (needReload)
                break;
        }
        if (model[key] instanceof Array && model[key].length > 0 && model[key][0] instanceof Model_1.Model) {
            needReload = model[key].some((m) => needToReload(m, changeDocId));
            if (needReload)
                break;
        }
    }
    return needReload;
}
exports.needToReload = needToReload;
//# sourceMappingURL=RealTimeModel.js.map