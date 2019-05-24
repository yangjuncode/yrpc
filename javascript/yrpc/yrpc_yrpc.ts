import pako from 'pako'

import {addCallback2Map, delCallbackFromMap, isCallbackInMap} from './mapUtil'
import ypubsub from './ypubsub'
import {yrpc} from './yrpc'

export interface IResult {
    //result is  the result of grpc return
    (result: any, pkt: yrpc.Ypacket): void
}

//got remote server err
export interface IServerErr {
    (errPkt: yrpc.Ypacket): void
}

//got rpc finished packet
export interface IRpcFinished {
    (finishedPkt: yrpc.Ypacket): void
}

export interface ILocalErr {
    (err: any): void
}

//got cancel response
export interface ICancel {
    (pkt: yrpc.Ypacket): void
}

//got client send pkt to server confirm
export interface IPacketSendOK {
    (cid: number, no: number, rpcStream: TRpcStream): void
}

export interface ICallOption {
    timeout?: number
    OnResult?: IResult
    OnFinished?: IRpcFinished
    OnServerErr?: IServerErr
    OnLocalErr?: ILocalErr
    OnTimeout?: Function
    OnCancel?: ICancel
    Meta?: TYrpcMeta
}

export class TCallOption implements ICallOption {
    //timeout in seconds
    timeout: number
    OnResult?: IResult
    OnFinished?: IRpcFinished
    OnServerErr?: IServerErr
    OnLocalErr?: ILocalErr
    OnTimeout?: Function
    OnCancel?: ICancel
    Meta?: TYrpcMeta

    constructor(options?: ICallOption) {
        options && Object.assign(this, options)
        if (!this.timeout || this.timeout <= 0) {
            this.timeout = 60
        }
    }
}

export class TYrpcMeta {
    Meta?: Map<string, string>

    metaCount(): number {
        if (!this.Meta) {
            return 0
        }

        return this.Meta.size
    }

    initMetaMap() {
        if (!this.Meta) {
            this.Meta = new Map<string, string>()
        }
    }

    addMeta(key: string, val: string) {
        this.initMetaMap()
        // @ts-ignore
        this.Meta.set(key, val)
    }

    addMetas(metas?: Map<string, string>) {
        if (!metas) {
            return
        }
        this.initMetaMap()

        metas.forEach((value, key) => {
            // @ts-ignore
            this.Meta.set(key, value)
        })
    }

    getVal(key: string): string {
        if (!this.Meta) {
            return ""
        }
        let val = this.Meta.get(key)
        if (val) {
            return val
        } else {
            return ""
        }
    }

    encodeYrpcMeta(): string[] {
        if (!this.Meta) {
            return []
        }

        let r: string[] = []
        this.Meta.forEach((value, key) => {
            r.push(key)
            r.push(value)
        })

        return r
    }

    decodeYrpcMeta(pkt: yrpc.Ypacket) {
        if (pkt.meta.length === 0) {
            return
        }
        this.initMetaMap()
        for (let i = 1; i < pkt.meta.length; i += 2) {
            // @ts-ignore
            this.Meta.set(pkt.meta[i - 1], pkt.meta[i])
        }
    }

    copyOtherMeta(otherMeta: TYrpcMeta) {
        if (!otherMeta.Meta) {
            return
        }
        if (otherMeta.metaCount() === 0) {
            return;
        }
        this.initMetaMap()
        otherMeta.Meta.forEach((value, key) => {
            // @ts-ignore
            this.Meta.set(key, value)
        })
    }
}

export class TRpcStream {
    callOpt: TCallOption
    api: string
    apiVerion: number
    cid: number
    resultType: any
    resultCount: number = 0
    rpcType: number
    private newNo: number = 0
    LastSendTime: number = Date.now()
    LastRecvTime: number = Date.now()
    private intervalTmrId: number = -1

    SendFirstOK: boolean = false
    firstHasSent2Socket: boolean = false

    private sendOkCallbacks: Map<number, IPacketSendOK>

    constructor(api: string, v: number, resultType: any, rpcType: number, callOpt?: TCallOption) {
        this.api = api
        this.apiVerion = v
        this.resultType = resultType
        this.rpcType = rpcType
        this.cid = rpcCon.NewCid()
        ypubsub.subscribeInt(this.cid, this.onRpcPacket)

        if (!callOpt) {
            callOpt = new TCallOption()
        }
        if (callOpt.timeout <= 0) {
            callOpt.timeout = 30
        }
        this.callOpt = callOpt

        this.intervalTmrId = window.setInterval(() => {
            this.intervalCheck()
        }, 5000)
    }

    clearCall() {
        ypubsub.unsubscribeInt(this.cid)
        if (this.intervalTmrId >= 0) {
            clearInterval(this.intervalTmrId)
            this.intervalTmrId = -1
        }
    }


    //return the no of pkt,if not send to socket, return <0
    sendFirst(reqData: Uint8Array): number {
        let pkt = new yrpc.Ypacket()
        pkt.cmd = this.rpcType
        pkt.body = reqData
        pkt.optstr = this.api
        pkt.cid = this.cid
        pkt.no = 0
        this.newNo = 1

        TrpcCon.AssignPacketMeta(pkt, this.apiVerion, this.callOpt)

        let sendOk = rpcCon.sendRpcPacket(pkt)
        if (sendOk) {
            this.firstHasSent2Socket = true
            this.LastSendTime = Date.now()
            return 0
        } else {
            return -1
        }

    }

    //return rpc no,if <0: not send to socket
    sendNext(reqData: Uint8Array, sendCallback?: IPacketSendOK): number {
        if (!this.firstHasSent2Socket) {
            return -1
        }
        let pkt = new yrpc.Ypacket()
        pkt.cmd = 5
        pkt.body = reqData
        pkt.cid = this.cid
        pkt.no = this.newNo

        if (!rpcCon.sendRpcPacket(pkt)) {
            return -1
        } else {
            ++this.newNo
            this.LastSendTime = Date.now()
            if (sendCallback) {
                this.sendOkCallbacks.set(pkt.no, sendCallback)
            }
        }
        return pkt.no
    }

    //send client stream finish
    //return if send the pkt to socket
    sendFinish(): boolean {
        if (!this.firstHasSent2Socket) {
            return false
        }
        let pkt = new yrpc.Ypacket()
        pkt.cmd = 6
        pkt.cid = this.cid
        let sendOk = rpcCon.sendRpcPacket(pkt)
        if (sendOk) {
            this.LastSendTime = Date.now()
        }
        return sendOk
    }

    //cancel the rpc call
    //return if send the pkt to socket
    cancel(): boolean {
        if (!this.firstHasSent2Socket) {
            return false
        }
        let pkt = new yrpc.Ypacket()
        pkt.cmd = 4
        pkt.cid = this.cid
        let sendOk = rpcCon.sendRpcPacket(pkt)
        if (sendOk) {
            this.LastSendTime = Date.now()
        }
        return sendOk
    }

    onRpcPacket(pkt: yrpc.Ypacket) {
        this.LastRecvTime = rpcCon.LastRecvTime
        let res: any = null
        switch (pkt.cmd) {
            case 3:
                //client stream first response
                this.SendFirstOK = true
                break
            case 4:
                //rpc call err
                this.clearCall()

                if (this.callOpt.OnServerErr) {
                    this.callOpt.OnServerErr(pkt)
                }
                break
            case 5:
                //client stream sendNext response
                let sendOKCallBack = this.sendOkCallbacks.get(pkt.no)
                if (sendOKCallBack) {
                    sendOKCallBack(pkt.cid, pkt.no, this)
                    this.sendOkCallbacks.delete(pkt.no)
                }
                break
            case 6:
                //client stream send finish response from server
                this.clearCall()

                if (this.callOpt.OnFinished) {
                    this.callOpt.OnFinished(pkt)
                }

                break
            case 7:
                //server stream sendFirst response
                this.SendFirstOK = true
                break
            case 8:
                //bidi stream call sendFirst response
                this.SendFirstOK = true
                break
            case 12:
                //server stream send result
                ++this.resultCount
                if (this.callOpt.OnResult) {
                    res = this.resultType.decode(pkt.body)
                    this.callOpt.OnResult(res, pkt)
                }
                rpcCon.sendRpcPacket({
                    cid: pkt.cid,
                    cmd: pkt.cmd,
                    no: pkt.no,
                })

                break
            case 13:
                //server stream end
                this.clearCall()

                if (this.callOpt.OnFinished) {
                    this.callOpt.OnFinished(pkt)
                }
                rpcCon.sendRpcPacket(pkt)
                break
            case 44:
                //rpc cancel response
                this.clearCall()
                if (this.callOpt.OnCancel) {
                    this.callOpt.OnCancel(pkt)
                }
                break
        }
    }

    intervalCheck() {
        let nowTime = Date.now()
        let leaseTime = nowTime - this.LastRecvTime

        if (leaseTime / 1000 > this.callOpt.timeout) {
            this.clearCall()
            if (this.callOpt.OnTimeout) {
                this.callOpt.OnTimeout()
            }
        }
    }

}

export class TrpcCon {
    Sid: Uint8Array = new Uint8Array()
    wsUrl: string = ''
    wsCon: WebSocket | null = null
    LastRecvTime: number = -1
    LastSendTime: number = -1
    private wsReconnectTmrId: number = -1
    private cid: number = 0
    Meta: TYrpcMeta = new TYrpcMeta()

    OnceSubscribeList: Map<string, Function[]> = new Map<string, Function[]>()
    SubscribeList: Map<string, Function[]> = new Map<string, Function[]>()


    initWsCon(url: string) {

        if (this.wsCon) {
            this.wsCon.close()
        }

        this.wsCon = new WebSocket(url)
        this.wsUrl = url

        this.wsCon.onmessage = this.onWsMsg
        this.wsCon.onclose = this.onWsClose
        this.wsCon.onerror = this.onWsErr
        this.wsCon.onopen = this.onWsOpen

    }


    isWsConnected(): boolean {
        if (!this.wsCon) {
            return false
        }
        if (this.wsCon.readyState !== WebSocket.OPEN) {
            return false
        }
        return true
    }

    sendRpcData(rpcData: Uint8Array): boolean {
        if (!this.wsCon) {
            return false
        }
        if (this.wsCon.readyState !== WebSocket.OPEN) {
            return false
        }

        this.wsCon.send(rpcData)
        this.LastSendTime = Date.now()
        return true
    }

    sendRpcPacket(pkt: yrpc.IYpacket): boolean {
        let w = yrpc.Ypacket.encode(pkt)
        let rpcData = w.finish()
        return this.sendRpcData(rpcData)
    }

    onWsMsg(ev: MessageEvent): void {
        this.LastRecvTime = Date.now()
        let rpcData = new Uint8Array(ev.data)
        let rpc = yrpc.Ypacket.decode(rpcData)

        if (rpc.body.length > 0) {
            let zipType = rpc.cmd & 0x000f0000
            switch (zipType) {
                case 0x00010000://lz4
                    throw new Error('no lz4 support now')
                    break
                case 0x00020000://zlib
                    rpc.body = pako.inflate(rpc.body)
                    break
            }

        }
        if (rpc.optbin.length > 0) {
            let zipType = rpc.cmd & 0x00f00000
            switch (zipType) {
                case 0x00100000://lz4
                    throw new Error('no lz4 support now')
                    break
                case 0x00200000://zlib
                    rpc.optbin = pako.inflate(rpc.optbin)
                    break
            }
        }

        rpc.cmd = rpc.cmd & 0xffff
        switch (rpc.cmd) {
            // publish response
            case 11:
                break

            // sub/unsub response
            case 12:
                break

            // nats recv msg
            case 13:
                break
        }

    }

    onWsErr(ev: Event): void {
        console.log('ws err:', ev)
    }

    onWsClose(ev: CloseEvent): void {
        this.wsCon = null

        this.wsReconnectTmrId = window.setInterval(() => {
            if (this.isWsConnected()) {
                clearInterval(this.wsReconnectTmrId)
                return
            }
            this.initWsCon(this.wsUrl)
        }, 5000)
    }

    onWsOpen(ev: Event) {
        console.log('ws open:', ev)
    }


    //return cid in rpccmd, <0: not send
    NatsPublish(subject: string, data: Uint8Array, natsOpt?: yrpc.natsOption): number {
        if (!this.isWsConnected()) {
            return -1
        }

        let rpc = new yrpc.Ypacket()
        rpc.cmd = 11
        rpc.cid = this.NewCid()
        rpc.optstr = subject
        rpc.body = data

        if (natsOpt) {
            let w = yrpc.natsOption.encode(natsOpt)
            let obin = w.finish()
            rpc.optbin = obin
        }
        this.sendRpcPacket(rpc)
        return rpc.cid
    }

    NatsSubsribe(subject: string, FnMsg: Function): boolean {
        if (!this.isWsConnected()) {
            return false
        }
        let hasExist = isCallbackInMap(subject, FnMsg, this.SubscribeList)
        if (hasExist) {
            return true
        }
        let rpc = new yrpc.Ypacket()
        rpc.cmd = 12
        rpc.res = 1
        rpc.cid = this.NewCid()
        rpc.optstr = subject

        addCallback2Map(subject, FnMsg, this.SubscribeList)

        return this.sendRpcPacket(rpc)

    }

    NatsSubsribeOnce(subject: string, FnMsg: Function) {
        if (!this.isWsConnected()) {
            return false
        }
        let hasExist = isCallbackInMap(subject, FnMsg, this.OnceSubscribeList)
        if (hasExist) {
            return true
        }
        let rpc = new yrpc.Ypacket()
        rpc.cmd = 12
        rpc.res = 1
        rpc.cid = this.NewCid()
        rpc.optstr = subject

        addCallback2Map(subject, FnMsg, this.OnceSubscribeList)

        return this.sendRpcPacket(rpc)
    }

    NatsUnsubsribe(subject: string, FnMsg?: Function) {
        let rpc = new yrpc.Ypacket()
        rpc.cmd = 12
        rpc.res = 2
        rpc.cid = this.NewCid()
        rpc.optstr = subject
        this.sendRpcPacket(rpc)

        if (!FnMsg) {
            this.OnceSubscribeList.delete(subject)
            this.SubscribeList.delete(subject)
        } else {
            delCallbackFromMap(subject, FnMsg, this.OnceSubscribeList)
            delCallbackFromMap(subject, FnMsg, this.SubscribeList)
        }

    }

    NewCid(): number {

        while (true) {
            let newCid = this.genCid()
            if (ypubsub.hasSubscribeInt(newCid)) {
                continue
            }
            return newCid
        }


    }

    private genCid(): number {
        if (this.cid === 0xFFFFFFFF) {
            this.cid = 0
            return 0xFFFFFFFF
        }


        return this.cid++
    }

    ping(): void {
        let pkt = new yrpc.Ypacket()
        pkt.cmd = 14
        this.sendRpcPacket(pkt)

    }

    static AssignPacketMeta(pkt: yrpc.Ypacket, v: number, callOpt?: TCallOption) {
        let meta = callOpt ? callOpt.Meta : undefined

        if (v > 0) {
            if (!meta) {
                meta = new TYrpcMeta()
            }

            meta.addMeta("ver", v + '')
            pkt.meta = meta.encodeYrpcMeta()
        }
    }

    NocareCall(reqData: Uint8Array, api: string, v: number, callOpt?: TCallOption): void {
        let pkt = new yrpc.Ypacket()
        pkt.cmd = 2
        pkt.body = reqData
        pkt.optstr = api

        TrpcCon.AssignPacketMeta(pkt, v, callOpt)

        this.sendRpcPacket(pkt)
    }

    UnaryCall(reqData: Uint8Array, api: string, v: number, resultType: any, callOpt?: TCallOption) {
        let pkt = new yrpc.Ypacket()

        pkt.cmd = 1
        pkt.cid = rpcCon.NewCid()
        pkt.body = reqData
        pkt.optstr = api

        TrpcCon.AssignPacketMeta(pkt, v, callOpt)

        let sendOk = this.sendRpcPacket(pkt)

        if (!callOpt) {
            return
        }

        if (!sendOk) {
            if (callOpt.OnLocalErr) {
                callOpt.OnLocalErr('can not send to socket:' + api)
            }
            return
        }
        if (callOpt.timeout <= 0) {
            callOpt.timeout = 30
        }
        let timeoutId: number = window.setTimeout(() => {
            ypubsub.unsubscribeInt(pkt.cid)
            if (callOpt.OnTimeout) {
                callOpt.OnTimeout()
            }
        }, callOpt.timeout * 1000)


        ypubsub.subscribeOnceInt(pkt.cid, function (resPkt: yrpc.Ypacket) {
            switch (resPkt.cmd) {
                case 1:
                    let res = resultType.decode(resPkt.body)
                    if (callOpt.OnResult) {
                        callOpt.OnResult(res, resPkt)
                    }
                    break
                case 4:
                    if (callOpt.OnServerErr) {
                        callOpt.OnServerErr(resPkt)
                    }
                    break
                default:
                    console.log('unary call bad:res:', api, resPkt)
            }
            clearTimeout(timeoutId)
        })

    }

}

export let rpcCon = new TrpcCon()
