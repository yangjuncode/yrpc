"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pako_1 = require("pako");
const mapUtil_1 = require("./mapUtil");
const yrpc_1 = require("./yrpc");
const ypubsub_1 = require("./ypubsub");
class TCallOption {
    constructor() {
        //timeout in seconds
        this.timeout = 30;
    }
}
exports.TCallOption = TCallOption;
class TRpcStream {
    constructor(api, v, resType, callOpt) {
        this.newNo = 0;
        this.LastRecvTime = Date.now();
        this.intervalTmrId = -1;
        this.api = api;
        this.apiVerion = v;
        this.resType = resType;
        this.cid = exports.rpcCon.NewCid();
        ypubsub_1.default.subscribeInt(this.cid, this.onRpc);
        if (!callOpt) {
            callOpt = new TCallOption();
            callOpt.timeout = 30;
        }
        if (callOpt.timeout <= 0) {
            callOpt.timeout = 30;
        }
        this.callOpt = callOpt;
        setInterval(() => {
            this.intervalCheck();
        }, 5000);
    }
    clearCall() {
        ypubsub_1.default.unsubscribeInt(this.cid);
        if (this.intervalTmrId >= 0) {
            clearInterval(this.intervalTmrId);
            this.intervalTmrId = -1;
        }
    }
    sendFirst(reqData) {
        let rpc = new yrpc_1.yrpc.Ypacket();
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
        let sendOk = exports.rpcCon.sendRpc(rpc);
        if (sendOk) {
            this.LastSendTime = Date.now();
        }
    }
    //return rpc no,if <0: not send to socket
    sendNext(reqData) {
        let rpc = new yrpc_1.yrpc.Ypacket();
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
    }
    //client stream finish
    sendFinish() {
        let rpc = new yrpc_1.yrpc.Ypacket();
        rpc.cmd = 9;
        rpc.cid = this.cid;
        let sendOk = exports.rpcCon.sendRpc(rpc);
        if (sendOk) {
            this.LastSendTime = Date.now();
        }
    }
    //cancel the rpc call
    cancel() {
        let rpc = new yrpc_1.yrpc.Ypacket();
        rpc.cmd = 44;
        rpc.cid = this.cid;
        let sendOk = exports.rpcCon.sendRpc(rpc);
        if (sendOk) {
            this.LastSendTime = Date.now();
        }
    }
    //ping
    ping() {
        let rpc = new yrpc_1.yrpc.Ypacket();
        rpc.cmd = 3;
        rpc.cid = exports.rpcCon.NewCid();
        let sendOk = exports.rpcCon.sendRpc(rpc);
        if (sendOk) {
            this.LastSendTime = Date.now();
        }
    }
    onRpc(rpc) {
        this.LastRecvTime = exports.rpcCon.LastRecvTime;
        let res = null;
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
    }
    intervalCheck() {
        let nowTime = Date.now();
    }
}
exports.TRpcStream = TRpcStream;
class TrpcCon {
    constructor() {
        this.wsCon = null;
        this.LastRecvTime = -1;
        this.LastSendTime = -1;
        this.wsReconnectTmrId = -1;
        this.cid = 0;
        this.OnceSubscribeList = new Map();
        this.SubscribeList = new Map();
    }
    initWsCon(url) {
        if (this.wsCon) {
            this.wsCon.close();
        }
        this.wsCon = new WebSocket(url);
        this.wsUrl = url;
        this.wsCon.onmessage = this.onWsMsg;
        this.wsCon.onclose = this.onWsClose;
        this.wsCon.onerror = this.onWsErr;
        this.wsCon.onopen = this.onWsOpen;
    }
    isWsConnected() {
        if (!this.wsCon) {
            return false;
        }
        if (this.wsCon.readyState !== WebSocket.OPEN) {
            return false;
        }
        return true;
    }
    sendRpcData(rpcData) {
        if (!this.wsCon) {
            return false;
        }
        if (this.wsCon.readyState !== WebSocket.OPEN) {
            return false;
        }
        this.wsCon.send(rpcData);
        this.LastSendTime = Date.now();
        return true;
    }
    sendRpc(rpc) {
        let w = yrpc_1.yrpc.Ypacket.encode(rpc);
        let rpcData = w.finish();
        return this.sendRpcData(rpcData);
    }
    onWsMsg(ev) {
        this.LastRecvTime = Date.now();
        let rpcData = new Uint8Array(ev.data);
        let rpc = yrpc_1.yrpc.Ypacket.decode(rpcData);
        if (rpc.body.length > 0) {
            let zipType = rpc.cmd & 0x000f0000;
            switch (zipType) {
                case 0x00010000: //lz4
                    throw new Error('no lz4 support now');
                    break;
                case 0x00020000: //zlib
                    rpc.body = pako_1.default.inflate(rpc.body);
                    break;
            }
        }
        if (rpc.optbin.length > 0) {
            let zipType = rpc.cmd & 0x00f00000;
            switch (zipType) {
                case 0x00100000: //lz4
                    throw new Error('no lz4 support now');
                    break;
                case 0x00200000: //zlib
                    rpc.optbin = pako_1.default.inflate(rpc.optbin);
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
    }
    onWsErr(ev) {
        console.log('ws err:', ev);
    }
    onWsClose(ev) {
        this.wsCon = null;
        this.wsReconnectTmrId = window.setInterval(() => {
            if (this.isWsConnected()) {
                clearInterval(this.wsReconnectTmrId);
                return;
            }
            this.initWsCon(this.wsUrl);
        }, 5000);
    }
    onWsOpen(ev) {
        console.log('ws open:', ev);
    }
    //return cid in rpccmd, <0: not send
    NatsPublish(subject, data, natsOpt) {
        if (!this.isWsConnected()) {
            return -1;
        }
        let rpc = new yrpc_1.yrpc.Ypacket();
        rpc.cmd = 11;
        rpc.cid = this.NewCid();
        rpc.optstr = subject;
        rpc.body = data;
        if (natsOpt) {
            let w = yrpc_1.yrpc.natsOption.encode(natsOpt);
            let obin = w.finish();
            rpc.optbin = obin;
        }
        this.sendRpc(rpc);
        return rpc.cid;
    }
    NatsSubsribe(subject, FnMsg) {
        if (!this.isWsConnected()) {
            return false;
        }
        let hasExist = mapUtil_1.isCallbackInMap(subject, FnMsg, this.SubscribeList);
        if (hasExist) {
            return true;
        }
        let rpc = new yrpc_1.yrpc.Ypacket();
        rpc.cmd = 12;
        rpc.res = 1;
        rpc.cid = this.NewCid();
        rpc.optstr = subject;
        mapUtil_1.addCallback2Map(subject, FnMsg, this.SubscribeList);
        return this.sendRpc(rpc);
    }
    NatsSubsribeOnce(subject, FnMsg) {
        if (!this.isWsConnected()) {
            return false;
        }
        let hasExist = mapUtil_1.isCallbackInMap(subject, FnMsg, this.OnceSubscribeList);
        if (hasExist) {
            return true;
        }
        let rpc = new yrpc_1.yrpc.Ypacket();
        rpc.cmd = 12;
        rpc.res = 1;
        rpc.cid = this.NewCid();
        rpc.optstr = subject;
        mapUtil_1.addCallback2Map(subject, FnMsg, this.OnceSubscribeList);
        return this.sendRpc(rpc);
    }
    NatsUnsubsribe(subject, FnMsg) {
        let rpc = new yrpc_1.yrpc.Ypacket();
        rpc.cmd = 12;
        rpc.res = 2;
        rpc.cid = this.NewCid();
        rpc.optstr = subject;
        this.sendRpc(rpc);
        if (!FnMsg) {
            this.OnceSubscribeList.delete(subject);
            this.SubscribeList.delete(subject);
        }
        else {
            mapUtil_1.delCallbackFromMap(subject, FnMsg, this.OnceSubscribeList);
            mapUtil_1.delCallbackFromMap(subject, FnMsg, this.SubscribeList);
        }
    }
    NewCid() {
        while (true) {
            let newCid = this.genCid();
            if (ypubsub_1.default.hasSubscribeInt(newCid)) {
                continue;
            }
            return newCid;
        }
    }
    genCid() {
        if (this.cid === 0xFFFFFFFF) {
            this.cid = 0;
            return 0xFFFFFFFF;
        }
        return this.cid++;
    }
    ping() {
        let rpc = new yrpc_1.yrpc.Ypacket();
        rpc.cmd = 3;
        this.sendRpc(rpc);
    }
    NocareCall(reqData, api, v) {
        let rpc = new yrpc_1.yrpc.Ypacket();
        if (v > 0) {
            rpc.cmd = 10 | (v << 24);
        }
        else {
            rpc.cmd = 10;
        }
        rpc.body = reqData;
        rpc.optstr = api;
        this.sendRpc(rpc);
    }
    UnaryCall(reqData, api, v, resType, callOpt) {
        let rpc = new yrpc_1.yrpc.Ypacket();
        if (v > 0) {
            rpc.cmd = 1 | (v << 24);
        }
        else {
            rpc.cmd = 1;
        }
        rpc.cid = exports.rpcCon.NewCid();
        rpc.body = reqData;
        rpc.optstr = api;
        let sendOk = this.sendRpc(rpc);
        if (!callOpt) {
            return;
        }
        if (!sendOk) {
            if (callOpt.OnLocalErr) {
                callOpt.OnLocalErr('can not send to socket');
            }
            return;
        }
        if (callOpt.timeout <= 0) {
            callOpt.timeout = 30;
        }
        let timeoutId = window.setTimeout(() => {
            ypubsub_1.default.unsubscribeInt(rpc.cid);
            if (callOpt.OnTimeout) {
                callOpt.OnTimeout();
            }
        }, callOpt.timeout * 1000);
        ypubsub_1.default.subscribeOnceInt(rpc.cid, function (resRpc) {
            switch (resRpc.cmd) {
                case 2:
                    let res = resType.decode(resRpc.body);
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
                    console.log('unary call bad:res:', resRpc);
            }
            clearTimeout(timeoutId);
        });
    }
}
exports.TrpcCon = TrpcCon;
exports.rpcCon = new TrpcCon();
