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
exports.decrypt = exports.encrypt = exports.setEncryptionPassword = exports.transformer = void 0;
const libsodium_wrappers_1 = __importDefault(require("libsodium-wrappers"));
const key = {};
const nonce = {};
exports.transformer = {
    dbName: '',
    incoming: function (doc) {
        const encrypted = encrypt(Object.assign({}, doc), this.dbName);
        return {
            _id: doc._id,
            _rev: doc._rev,
            payload: encrypted,
        };
    },
    outgoing: function (doc) {
        if (!doc.payload) {
            return doc;
        }
        const output = decrypt(doc.payload, this.dbName);
        return Object.assign({ _id: doc._id, _rev: doc._rev }, output);
    },
};
function setEncryptionPassword(password, dbName) {
    return __awaiter(this, void 0, void 0, function* () {
        yield libsodium_wrappers_1.default.ready;
        const encoder = new TextEncoder();
        const passwordBytes = encoder.encode(password.padEnd(32, ' '));
        key[dbName] = passwordBytes.slice(0, libsodium_wrappers_1.default.crypto_secretbox_KEYBYTES);
        const nonceBytes = encoder.encode(password.padEnd(24, ' '));
        nonce[dbName] = nonceBytes.slice(0, libsodium_wrappers_1.default.crypto_secretbox_NONCEBYTES);
    });
}
exports.setEncryptionPassword = setEncryptionPassword;
function encrypt(data, dbName) {
    delete data._id;
    delete data._rev;
    const ciphertext = libsodium_wrappers_1.default.crypto_secretbox_easy(JSON.stringify(data), nonce[dbName], key[dbName]);
    const base64CipherText = libsodium_wrappers_1.default.to_base64(ciphertext);
    return base64CipherText;
}
exports.encrypt = encrypt;
function decrypt(data, dbName) {
    const ciphertext = libsodium_wrappers_1.default.from_base64(data);
    const decrypted = libsodium_wrappers_1.default.crypto_secretbox_open_easy(ciphertext, nonce[dbName], key[dbName]);
    const decoder = new TextDecoder('utf-8');
    const decryptedString = decoder.decode(decrypted);
    return JSON.parse(decryptedString);
}
exports.decrypt = decrypt;
//# sourceMappingURL=encryption.js.map