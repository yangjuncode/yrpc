"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isCallbackInMap(key, callBack, _map) {
    var mapItem = _map.get(key);
    if (!mapItem) {
        return false;
    }
    return mapItem.includes(callBack);
}
exports.isCallbackInMap = isCallbackInMap;
function addCallback2Map(key, callBack, _map) {
    var calbacks = _map.get(key);
    if (!calbacks) {
        calbacks = [callBack];
    }
    else {
        calbacks.push(callBack);
    }
    _map.set(key, calbacks);
}
exports.addCallback2Map = addCallback2Map;
function delCallbackFromMap(key, callBack, _map) {
    var calbacks = _map.get(key);
    if (!calbacks) {
        return;
    }
    calbacks = calbacks.filter(function (v) {
        return v !== callBack;
    });
    _map.set(key, calbacks);
}
exports.delCallbackFromMap = delCallbackFromMap;
