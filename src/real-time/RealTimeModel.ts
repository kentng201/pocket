import { ModelKey } from 'src/definitions/Model';
import { DatabaseManager } from 'src/manager/DatabaseManager';
import { Model } from '..';

export let isRealTime = false;

const weakReferences: { [_id: string]: WeakRef<any>[] } = {};

export function addWeakRef<T extends Model>(_id: string, doc: T) {
    if (!weakReferences[_id]) {
        weakReferences[_id] = [];
    }
    weakReferences[_id].push(new WeakRef(doc));
}
export function notifyWeakRef<T extends Model>(_id: string, doc: T) {
    if (!weakReferences[_id]) return;
    const newAttributes: Partial<T> = {};
    for (const field in doc) {
        if (typeof field === 'function') continue;
        if (field === '_dirty') continue;
        if (field === '_before_dirty') continue;
        if (field === '_real_time_updating') continue;
        if (field === '_fallback_api_doc') continue;
        if (field === 'relationships') continue;
        if (field === 'needTimestamp') continue;
        if (field === 'cName') continue;
        if (doc.relationships && Object.keys(doc.relationships).includes(field)) continue;
        newAttributes[field as keyof Partial<T>] = doc[field as ModelKey<Partial<T>>];
    }
    weakReferences[_id].forEach((ref) => {
        const sameIdDoc = ref.deref();
        if (!sameIdDoc.rtUpdate) return;
        if (sameIdDoc && sameIdDoc instanceof Model && sameIdDoc._rev != doc._rev) {
            sameIdDoc._real_time_updating = true;
            sameIdDoc._rev = doc._rev;
            sameIdDoc.fill(newAttributes);
            sameIdDoc._real_time_updating = false;
            sameIdDoc._dirty = {};
            sameIdDoc._before_dirty = {};
        }
    });
}

export function setRealtime(realTime: boolean) {

    isRealTime = realTime;
    const onRealTimeChange = (change: PouchDB.Core.ChangesResponseChange<any>) => {
        const _id = change.doc?._id;
        const doc = change.doc;
        notifyWeakRef(_id, doc as Model);
    };


    if (isRealTime) {
        Object.values(DatabaseManager.databases).forEach((db) => {
            db.changes({
                since: 'now',
                include_docs: true,
                live: true,
            }).on('change', onRealTimeChange);
        });
    } else {
        Object.values(DatabaseManager.databases).forEach((db) => {
            db.removeListener('change', onRealTimeChange);
        });
    }
}

