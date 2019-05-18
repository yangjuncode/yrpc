"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Tpubsub = /** @class */ (function () {
    function Tpubsub() {
        this.fns = new Map();
        this.fnsOnce = new Map();
        this.fnsInt = new Map();
        this.fnsIntOnce = new Map();
    }
    Tpubsub.prototype.publishFn = function (subject, args, fnsMap) {
        var _this = this;
        var fns = fnsMap.get(subject) || [];
        fns.forEach(function (fn) {
            fn.apply(_this, args);
        });
    };
    Tpubsub.prototype.publish = function (subject) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.publishFn(subject, args, this.fns);
        this.publishFn(subject, args, this.fnsOnce);
        // delete fnsOnce register callback
        this.fnsOnce.delete(subject);
    };
    Tpubsub.prototype.subscribe = function (subject, Fn) {
        var fns = this.fns.get(subject) || [];
        if (fns.includes(Fn)) {
            return;
        }
        fns.push(Fn);
        this.fns.set(subject, fns);
    };
    Tpubsub.prototype.subscribeOnce = function (subject, Fn) {
        var fnsOnce = this.fnsOnce.get(subject) || [];
        if (fnsOnce.includes(Fn)) {
            return;
        }
        fnsOnce.push(Fn);
        this.fnsOnce.set(subject, fnsOnce);
    };
    Tpubsub.prototype.unsubscribe = function (subject, Fn) {
        if (!Fn) {
            this.fns.delete(subject);
            return;
        }
        var fns = this.fns.get(subject) || [];
        if (!fns.includes(Fn)) {
            return;
        }
        fns = fns.filter(function (v) {
            return v !== Fn;
        });
        this.fnsOnce.set(subject, fns);
    };
    Tpubsub.prototype.publishFnInt = function (subject, args, fnsIntMap) {
        var _this = this;
        var fns = fnsIntMap.get(subject) || [];
        fns.forEach(function (fn) {
            fn.apply(_this, args);
        });
    };
    Tpubsub.prototype.publishInt = function (subject) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.publishFnInt(subject, args, this.fnsInt);
        this.publishFnInt(subject, args, this.fnsIntOnce);
        // delete fnsOnce register callback
        this.fnsIntOnce.delete(subject);
    };
    Tpubsub.prototype.subscribeInt = function (subject, Fn) {
        var fns = this.fnsInt.get(subject) || [];
        if (fns.includes(Fn)) {
            return;
        }
        fns.push(Fn);
        this.fnsInt.set(subject, fns);
    };
    Tpubsub.prototype.subscribeOnceInt = function (subject, Fn) {
        var fnsOnce = this.fnsIntOnce.get(subject) || [];
        if (fnsOnce.includes(Fn)) {
            return;
        }
        fnsOnce.push(Fn);
        this.fnsIntOnce.set(subject, fnsOnce);
    };
    Tpubsub.prototype.unsubscribeInt = function (subject, Fn) {
        if (!Fn) {
            this.fnsInt.delete(subject);
            return;
        }
        var fns = this.fnsInt.get(subject) || [];
        if (!fns.includes(Fn)) {
            return;
        }
        fns = fns.filter(function (v) {
            return v !== Fn;
        });
        this.fnsInt.set(subject, fns);
    };
    Tpubsub.prototype.hasSubscribe = function (subject) {
        return this.fns.has(subject) || this.fnsOnce.has(subject);
    };
    Tpubsub.prototype.hasSubscribeInt = function (subject) {
        return this.fnsInt.has(subject) || this.fnsIntOnce.has(subject);
    };
    return Tpubsub;
}());
exports.Tpubsub = Tpubsub;
exports.default = new Tpubsub();
