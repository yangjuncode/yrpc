export declare type TFns = Function[];
export declare type TFnsMap = Map<string, TFns>;
export declare type TFnsIntMap = Map<number, TFns>;
export declare class Tpubsub {
    private fns;
    private fnsOnce;
    private fnsInt;
    private fnsIntOnce;
    protected publishFn(subject: string, args: any[], fnsMap: TFnsMap): void;
    publish(subject: string, ...args: any[]): void;
    subscribe(subject: string, Fn: Function): void;
    subscribeOnce(subject: string, Fn: Function): void;
    unsubscribe(subject: string, Fn?: Function): void;
    protected publishFnInt(subject: number, args: any[], fnsIntMap: TFnsIntMap): void;
    publishInt(subject: number, ...args: any[]): void;
    subscribeInt(subject: number, Fn: Function): void;
    subscribeOnceInt(subject: number, Fn: Function): void;
    unsubscribeInt(subject: number, Fn?: Function): void;
    hasSubscribe(subject: string): boolean;
    hasSubscribeInt(subject: number): boolean;
}
declare const _default: Tpubsub;
export default _default;
