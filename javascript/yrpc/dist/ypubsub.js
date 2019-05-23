"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Tpubsub {
    constructor() {
        this.fns = new Map();
        this.fnsOnce = new Map();
        this.fnsInt = new Map();
        this.fnsIntOnce = new Map();
    }
    publishFn(subject, args, fnsMap) {
        let fns = fnsMap.get(subject) || [];
        fns.forEach((fn) => {
            fn.apply(this, args);
        });
    }
    publish(subject, ...args) {
        this.publishFn(subject, args, this.fns);
        this.publishFn(subject, args, this.fnsOnce);
        // delete fnsOnce register callback
        this.fnsOnce.delete(subject);
    }
    subscribe(subject, Fn) {
        let fns = this.fns.get(subject) || [];
        if (fns.includes(Fn)) {
            return;
        }
        fns.push(Fn);
        this.fns.set(subject, fns);
    }
    subscribeOnce(subject, Fn) {
        let fnsOnce = this.fnsOnce.get(subject) || [];
        if (fnsOnce.includes(Fn)) {
            return;
        }
        fnsOnce.push(Fn);
        this.fnsOnce.set(subject, fnsOnce);
    }
    unsubscribe(subject, Fn) {
        if (!Fn) {
            this.fns.delete(subject);
            return;
        }
        let fns = this.fns.get(subject) || [];
        if (!fns.includes(Fn)) {
            return;
        }
        fns = fns.filter((v) => {
            return v !== Fn;
        });
        this.fnsOnce.set(subject, fns);
    }
    publishFnInt(subject, args, fnsIntMap) {
        let fns = fnsIntMap.get(subject) || [];
        fns.forEach((fn) => {
            fn.apply(this, args);
        });
    }
    publishInt(subject, ...args) {
        this.publishFnInt(subject, args, this.fnsInt);
        this.publishFnInt(subject, args, this.fnsIntOnce);
        // delete fnsOnce register callback
        this.fnsIntOnce.delete(subject);
    }
    subscribeInt(subject, Fn) {
        let fns = this.fnsInt.get(subject) || [];
        if (fns.includes(Fn)) {
            return;
        }
        fns.push(Fn);
        this.fnsInt.set(subject, fns);
    }
    subscribeOnceInt(subject, Fn) {
        let fnsOnce = this.fnsIntOnce.get(subject) || [];
        if (fnsOnce.includes(Fn)) {
            return;
        }
        fnsOnce.push(Fn);
        this.fnsIntOnce.set(subject, fnsOnce);
    }
    unsubscribeInt(subject, Fn) {
        if (!Fn) {
            this.fnsInt.delete(subject);
            return;
        }
        let fns = this.fnsInt.get(subject) || [];
        if (!fns.includes(Fn)) {
            return;
        }
        fns = fns.filter((v) => {
            return v !== Fn;
        });
        this.fnsInt.set(subject, fns);
    }
    hasSubscribe(subject) {
        return this.fns.has(subject) || this.fnsOnce.has(subject);
    }
    hasSubscribeInt(subject) {
        return this.fnsInt.has(subject) || this.fnsIntOnce.has(subject);
    }
}
exports.Tpubsub = Tpubsub;
exports.default = new Tpubsub();
