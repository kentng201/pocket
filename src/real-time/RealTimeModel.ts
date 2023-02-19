import { ModelKey } from 'src/definitions/Model';
import { DatabaseManager } from 'src/manager/DatabaseManager';
import { Model } from '..';

export let isRealTime = false;

const weakReferences: {[_id: string]: WeakRef<any>[]} = {};

export function getWeakRef(_id: string) {
    return weakReferences[_id];
}
export function setWeakRef<T extends Model>(_id: string, doc: T) {
    if (!weakReferences[_id]) {
        weakReferences[_id] = [];
    }
    weakReferences[_id].forEach((ref) => {
        const deref = ref.deref();
        if (deref && deref instanceof Model) {
            const newAttributes: Partial<T> = {};
            for (const field in doc) {
                if (typeof field === 'function') continue;
                if (field === '_dirty') continue;
                if (field === 'relationships') continue;
                if (field === 'needTimestamp') continue;
                if (field === 'cName') continue;
                if (field === 'modelName') continue;
                newAttributes[field as keyof Partial<T>] = doc[field as ModelKey<Partial<T>>];
            }
            deref.fill(newAttributes);
            deref._dirty = {};
        }
    });
    weakReferences[_id].push(new WeakRef(doc));
}

export function setRealtime(realTime: boolean) {
    isRealTime = realTime;
    if (isRealTime) {
        Object.values(DatabaseManager.databases).forEach((db) => {
            db.changes({
                since: 'now',
                include_docs: true,
                live: true,
            }).on('change', function (change) {
                if (change.doc) {
                    const _id = change.doc._id;
                    const doc = change.doc;
                    setWeakRef(_id, doc as Model);
                }
            });
        });
    }
}

