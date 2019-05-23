import { yrpc } from './yrpc';
export interface IResult {
    (res: any, rpcCmd: yrpc.Ypacket): void;
}
export interface IServerErr {
    (errRpc: yrpc.Ypacket): void;
}
export interface ILocalErr {
    (err: any): void;
}
export interface IPong {
    (rpcCmd: yrpc.Ypacket): void;
}
export interface ICancel {
    (rpcCmd: yrpc.Ypacket): void;
}
export declare class TCallOption {
    timeout: number;
    OnResult: IResult;
    OnServerErr: IServerErr;
    OnLocalErr: ILocalErr;
    OnPong: IPong;
    OnTimeout: Function;
    OnCancel: ICancel;
}
export declare class TRpcStream {
    callOpt: TCallOption;
    api: string;
    apiVerion: number;
    cid: number;
    resType: any;
    private newNo;
    LastSendTime: number;
    LastRecvTime: number;
    private intervalTmrId;
    constructor(api: string, v: number, resType: any, callOpt?: TCallOption);
    clearCall(): void;
    sendFirst(reqData: Uint8Array): void;
    sendNext(reqData: Uint8Array): number;
    sendFinish(): void;
    cancel(): void;
    ping(): void;
    onRpc(rpc: yrpc.Ypacket): void;
    intervalCheck(): void;
}
export declare class TrpcCon {
    Sid: Uint8Array;
    wsUrl: string;
    wsCon: WebSocket | null;
    LastRecvTime: number;
    LastSendTime: number;
    private wsReconnectTmrId;
    private cid;
    OnceSubscribeList: Map<string, Function[]>;
    SubscribeList: Map<string, Function[]>;
    initWsCon(url: string): void;
    isWsConnected(): boolean;
    sendRpcData(rpcData: Uint8Array): boolean;
    sendRpc(rpc: yrpc.Ypacket): boolean;
    onWsMsg(ev: MessageEvent): void;
    onWsErr(ev: Event): void;
    onWsClose(ev: CloseEvent): void;
    onWsOpen(ev: Event): void;
    NatsPublish(subject: string, data: Uint8Array, natsOpt?: yrpc.natsOption): number;
    NatsSubsribe(subject: string, FnMsg: Function): boolean;
    NatsSubsribeOnce(subject: string, FnMsg: Function): boolean;
    NatsUnsubsribe(subject: string, FnMsg?: Function): void;
    NewCid(): number;
    private genCid;
    ping(): void;
    NocareCall(reqData: Uint8Array, api: string, v: number): void;
    UnaryCall(reqData: Uint8Array, api: string, v: number, resType: any, callOpt?: TCallOption): void;
}
export declare let rpcCon: TrpcCon;
