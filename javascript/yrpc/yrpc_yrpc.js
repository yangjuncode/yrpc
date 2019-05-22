"use strict";
exports.__esModule = true;
var rpc_1 = require("./rpc");
var pako_1 = require("pako");
var mapUtil_1 = require("./mapUtil");
var ypubsub_1 = require("./ypubsub");
var TCallOption = /** @class */ (function () {
    function TCallOption() {
        //timeout in seconds
        this.timeout = 30;
    }
    return TCallOption;
}());
exports.TCallOption = TCallOption;
var TRpcStream = /** @class */ (function () {
    function TRpcStream(api, v, resType, callOpt) {
        var _this = this;
        this.newNo = 0;
        this.LastRecvTime = Date.now();
        this.intervalTmrId = -1;
        this.api = api;
        this.apiVerion = v;
        this.resType = resType;
        this.cid = exports.rpcCon.NewCid();
        ypubsub_1["default"].subscribeInt(this.cid, this.onRpc);
        if (!callOpt) {
            callOpt = new TCallOption();
            callOpt.timeout = 30;
        }
        if (callOpt.timeout <= 0) {
            callOpt.timeout = 30;
        }
        this.callOpt = callOpt;
        setInterval(function () {
            _this.intervalCheck();
        }, 5000);
    }
    TRpcStream.prototype.clearCall = function () {
        ypubsub_1["default"].unsubscribeInt(this.cid);
        if (this.intervalTmrId >= 0) {
            clearInterval(this.intervalTmrId);
            this.intervalTmrId = -1;
        }
    };
    TRpcStream.prototype.sendFirst = function (reqData) {
        var rpc = new rpc_1.yrpc.Ypacket();
        if (this.apiVerion > 0) {
            rpc.cmd = 1 | (this.apiVerion << 24);
        }
        else {
            rpc.cmd = 1;
        }
        rpc.body = reqData;
        rpc.optstr = this.api;
        rpc.cid = this.cid;
        rpc.no = 0;
        this.newNo = 1;
        var sendOk = exports.rpcCon.sendRpc(rpc);
        if (sendOk) {
            this.LastSendTime = Date.now();
        }
    };
    //return rpc no,if <0: not send to socket
    TRpcStream.prototype.sendNext = function (reqData) {
        var rpc = new rpc_1.yrpc.Ypacket();
        if (this.apiVerion > 0) {
            rpc.cmd = 7 | (this.apiVerion << 24);
        }
        else {
            rpc.cmd = 7;
        }
        rpc.body = reqData;
        rpc.cid = this.cid;
        rpc.no = this.newNo;
        ++this.newNo;
        if (!exports.rpcCon.sendRpc(rpc)) {
            return -1;
        }
        else {
            this.LastSendTime = Date.now();
        }
        return rpc.no;
    };
    //client stream finish
    TRpcStream.prototype.sendFinish = function () {
        var rpc = new rpc_1.yrpc.Ypacket();
        rpc.cmd = 9;
        rpc.cid = this.cid;
        var sendOk = exports.rpcCon.sendRpc(rpc);
        if (sendOk) {
            this.LastSendTime = Date.now();
        }
    };
    //cancel the rpc call
    TRpcStream.prototype.cancel = function () {
        var rpc = new rpc_1.yrpc.Ypacket();
        rpc.cmd = 44;
        rpc.cid = this.cid;
        var sendOk = exports.rpcCon.sendRpc(rpc);
        if (sendOk) {
            this.LastSendTime = Date.now();
        }
    };
    //ping
    TRpcStream.prototype.ping = function () {
        var rpc = new rpc_1.yrpc.Ypacket();
        rpc.cmd = 3;
        rpc.cid = exports.rpcCon.NewCid();
        var sendOk = exports.rpcCon.sendRpc(rpc);
        if (sendOk) {
            this.LastSendTime = Date.now();
        }
    };
    TRpcStream.prototype.onRpc = function (rpc) {
        this.LastRecvTime = exports.rpcCon.LastRecvTime;
        var res = null;
        switch (rpc.cmd) {
            case 2:
                this.clearCall();
                if (rpc.body.length > 0) {
                    res = this.resType.decode(rpc.body);
                }
                if (this.callOpt.OnResult) {
                    this.callOpt.OnResult(res, rpc);
                }
                break;
            case 3:
                if (this.callOpt.OnPong) {
                    this.callOpt.OnPong(rpc);
                }
                break;
            case 4:
                this.clearCall();
                if (rpc.res === 44) {
                    if (this.callOpt.OnCancel) {
                        this.callOpt.OnCancel(rpc);
                        break;
                    }
                }
                if (this.callOpt.OnServerErr) {
                    this.callOpt.OnServerErr(rpc);
                }
                break;
            case 5:
                res = this.resType.decode(rpc.body);
                if (this.callOpt.OnResult) {
                    this.callOpt.OnResult(res, rpc);
                }
                break;
        }
    };
    TRpcStream.prototype.intervalCheck = function () {
        var nowTime = Date.now();
    };
    return TRpcStream;
}());
exports.TRpcStream = TRpcStream;
var TrpcCon = /** @class */ (function () {
    function TrpcCon() {
        this.wsCon = null;
        this.LastRecvTime = -1;
        this.LastSendTime = -1;
        this.wsReconnectTmrId = -1;
        this.cid = 0;
        this.OnceSubscribeList = new Map();
        this.SubscribeList = new Map();
    }
    TrpcCon.prototype.initWsCon = function (url) {
        if (this.wsCon) {
            this.wsCon.close();
        }
        this.wsCon = new WebSocket(url);
        this.wsUrl = url;
        this.wsCon.onmessage = this.onWsMsg;
        this.wsCon.onclose = this.onWsClose;
        this.wsCon.onerror = this.onWsErr;
        this.wsCon.onopen = this.onWsOpen;
    };
    TrpcCon.prototype.isWsConnected = function () {
        if (!this.wsCon) {
            return false;
        }
        if (this.wsCon.readyState !== 2) {
            return false;
        }
        return true;
    };
    TrpcCon.prototype.sendRpcData = function (rpcData) {
        if (!this.wsCon) {
            return false;
        }
        if (this.wsCon.readyState !== 2) {
            return false;
        }
        this.wsCon.send(rpcData);
        this.LastSendTime = Date.now();
        return true;
    };
    TrpcCon.prototype.sendRpc = function (rpc) {
        var w = rpc_1.yrpc.Ypacket.encode(rpc);
        var rpcData = w.finish();
        return this.sendRpcData(rpcData);
    };
    TrpcCon.prototype.onWsMsg = function (ev) {
        this.LastRecvTime = Date.now();
        var rpcData = new Uint8Array(ev.data);
        var rpc = rpc_1.yrpc.Ypacket.decode(rpcData);
        if (rpc.body.length > 0) {
            var zipType = rpc.cmd & 0x000f0000;
            switch (zipType) {
                case 0x00010000: //lz4
                    throw new Error("no lz4 support now");
                    break;
                case 0x00020000: //zlib
                    rpc.body = pako_1["default"].inflate(rpc.body);
                    break;
            }
        }
        if (rpc.optbin.length > 0) {
            var zipType = rpc.cmd & 0x00f00000;
            switch (zipType) {
                case 0x00100000: //lz4
                    throw new Error("no lz4 support now");
                    break;
                case 0x00200000: //zlib
                    rpc.optbin = pako_1["default"].inflate(rpc.optbin);
                    break;
            }
        }
        rpc.cmd = rpc.cmd & 0xffff;
        switch (rpc.cmd) {
            // publish response
            case 11:
                break;
            // sub/unsub response
            case 12:
                break;
            // nats recv msg
            case 13:
                break;
        }
    };
    TrpcCon.prototype.onWsErr = function (ev) {
        console.log("ws err:", ev);
    };
    TrpcCon.prototype.onWsClose = function (ev) {
        var _this = this;
        this.wsCon = null;
        this.wsReconnectTmrId = window.setInterval(function () {
            if (_this.isWsConnected()) {
                clearInterval(_this.wsReconnectTmrId);
                return;
            }
            _this.initWsCon(_this.wsUrl);
        }, 5000);
    };
    TrpcCon.prototype.onWsOpen = function (ev) {
        console.log("ws open:", ev);
    };
    //return cid in rpccmd, <0: not send
    TrpcCon.prototype.NatsPublish = function (subject, data, natsOpt) {
        if (!this.isWsConnected()) {
            return -1;
        }
        var rpc = new rpc_1.yrpc.Ypacket();
        rpc.cmd = 11;
        rpc.cid = this.NewCid();
        rpc.optstr = subject;
        rpc.body = data;
        if (natsOpt) {
            var w = rpc_1.yrpc.natsOption.encode(natsOpt);
            var obin = w.finish();
            rpc.optbin = obin;
        }
        this.sendRpc(rpc);
        return rpc.cid;
    };
    TrpcCon.prototype.NatsSubsribe = function (subject, FnMsg) {
        if (!this.isWsConnected()) {
            return false;
        }
        var hasExist = mapUtil_1.isCallbackInMap(subject, FnMsg, this.SubscribeList);
        if (hasExist) {
            return true;
        }
        var rpc = new rpc_1.yrpc.Ypacket();
        rpc.cmd = 12;
        rpc.res = 1;
        rpc.cid = this.NewCid();
        rpc.optstr = subject;
        mapUtil_1.addCallback2Map(subject, FnMsg, this.SubscribeList);
        return this.sendRpc(rpc);
    };
    TrpcCon.prototype.NatsSubsribeOnce = function (subject, FnMsg) {
        if (!this.isWsConnected()) {
            return false;
        }
        var hasExist = mapUtil_1.isCallbackInMap(subject, FnMsg, this.OnceSubscribeList);
        if (hasExist) {
            return true;
        }
        var rpc = new rpc_1.yrpc.Ypacket();
        rpc.cmd = 12;
        rpc.res = 1;
        rpc.cid = this.NewCid();
        rpc.optstr = subject;
        mapUtil_1.addCallback2Map(subject, FnMsg, this.OnceSubscribeList);
        return this.sendRpc(rpc);
    };
    TrpcCon.prototype.NatsUnsubsribe = function (subject, FnMsg) {
        var rpc = new rpc_1.yrpc.Ypacket();
        rpc.cmd = 12;
        rpc.res = 2;
        rpc.cid = this.NewCid();
        rpc.optstr = subject;
        this.sendRpc(rpc);
        if (!FnMsg) {
            this.OnceSubscribeList["delete"](subject);
            this.SubscribeList["delete"](subject);
        }
        else {
            mapUtil_1.delCallbackFromMap(subject, FnMsg, this.OnceSubscribeList);
            mapUtil_1.delCallbackFromMap(subject, FnMsg, this.SubscribeList);
        }
    };
    TrpcCon.prototype.NewCid = function () {
        while (true) {
            var newCid = this.genCid();
            if (ypubsub_1["default"].hasSubscribeInt(newCid)) {
                continue;
            }
            return newCid;
        }
    };
    TrpcCon.prototype.genCid = function () {
        if (this.cid === 0xFFFFFFFF) {
            this.cid = 0;
            return 0xFFFFFFFF;
        }
        return this.cid++;
    };
    TrpcCon.prototype.ping = function () {
        var rpc = new rpc_1.yrpc.Ypacket();
        rpc.cmd = 3;
        this.sendRpc(rpc);
    };
    TrpcCon.prototype.NocareCall = function (reqData, api, v) {
        var rpc = new rpc_1.yrpc.Ypacket();
        if (v > 0) {
            rpc.cmd = 10 | (v << 24);
        }
        else {
            rpc.cmd = 10;
        }
        rpc.body = reqData;
        rpc.optstr = api;
        this.sendRpc(rpc);
    };
    TrpcCon.prototype.UnaryCall = function (reqData, api, v, resType, callOpt) {
        var rpc = new rpc_1.yrpc.Ypacket();
        if (v > 0) {
            rpc.cmd = 1 | (v << 24);
        }
        else {
            rpc.cmd = 1;
        }
        rpc.cid = exports.rpcCon.NewCid();
        rpc.body = reqData;
        rpc.optstr = api;
        var sendOk = this.sendRpc(rpc);
        if (!callOpt) {
            return;
        }
        if (!sendOk) {
            if (callOpt.OnLocalErr) {
                callOpt.OnLocalErr("can not send to socket");
            }
            return;
        }
        if (callOpt.timeout <= 0) {
            callOpt.timeout = 30;
        }
        var timeoutId = window.setTimeout(function () {
            ypubsub_1["default"].unsubscribeInt(rpc.cid);
            if (!callOpt.OnTimeout) {
                callOpt.OnTimeout();
            }
        }, callOpt.timeout * 1000);
        ypubsub_1["default"].subscribeOnceInt(rpc.cid, function (resRpc) {
            switch (resRpc.cmd) {
                case 2:
                    var res = resType.decode(resRpc.body);
                    if (callOpt.OnResult) {
                        callOpt.OnResult(res, resRpc);
                    }
                    break;
                case 4:
                    if (callOpt.OnServerErr) {
                        callOpt.OnServerErr(resRpc);
                    }
                    break;
                default:
                    console.log("unary call bad:res:", resRpc);
            }
            clearTimeout(timeoutId);
        });
    };
    return TrpcCon;
}());
exports.TrpcCon = TrpcCon;
exports.rpcCon = new TrpcCon();
