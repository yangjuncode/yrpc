import * as $protobuf from "protobufjs";
/** Namespace yrpc. */
export namespace yrpc {

    /** Properties of a Ypacket. */
    interface IYpacket {

        /** Ypacket len */
        len?: (number|null);

        /** Ypacket cmd */
        cmd?: (number|null);

        /** Ypacket cid */
        cid?: (number|null);

        /** Ypacket no */
        no?: (number|null);

        /** Ypacket res */
        res?: (number|null);

        /** Ypacket body */
        body?: (Uint8Array|null);

        /** Ypacket optstr */
        optstr?: (string|null);

        /** Ypacket optbin */
        optbin?: (Uint8Array|null);

        /** Ypacket meta */
        meta?: (string[]|null);
    }

    /** Represents a Ypacket. */
    class Ypacket implements IYpacket {

        /**
         * Constructs a new Ypacket.
         * @param [properties] Properties to set
         */
        constructor(properties?: yrpc.IYpacket);

        /** Ypacket len. */
        public len: number;

        /** Ypacket cmd. */
        public cmd: number;

        /** Ypacket cid. */
        public cid: number;

        /** Ypacket no. */
        public no: number;

        /** Ypacket res. */
        public res: number;

        /** Ypacket body. */
        public body: Uint8Array;

        /** Ypacket optstr. */
        public optstr: string;

        /** Ypacket optbin. */
        public optbin: Uint8Array;

        /** Ypacket meta. */
        public meta: string[];

        /**
         * Encodes the specified Ypacket message. Does not implicitly {@link yrpc.Ypacket.verify|verify} messages.
         * @param message Ypacket message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: yrpc.IYpacket, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Ypacket message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Ypacket
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): yrpc.Ypacket;
    }

    /** Properties of a Yempty. */
    interface IYempty {
    }

    /** Represents a Yempty. */
    class Yempty implements IYempty {

        /**
         * Constructs a new Yempty.
         * @param [properties] Properties to set
         */
        constructor(properties?: yrpc.IYempty);

        /**
         * Encodes the specified Yempty message. Does not implicitly {@link yrpc.Yempty.verify|verify} messages.
         * @param message Yempty message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: yrpc.IYempty, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Yempty message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Yempty
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): yrpc.Yempty;
    }

    /** Properties of a Ynocare. */
    interface IYnocare {
    }

    /** Represents a Ynocare. */
    class Ynocare implements IYnocare {

        /**
         * Constructs a new Ynocare.
         * @param [properties] Properties to set
         */
        constructor(properties?: yrpc.IYnocare);

        /**
         * Encodes the specified Ynocare message. Does not implicitly {@link yrpc.Ynocare.verify|verify} messages.
         * @param message Ynocare message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: yrpc.IYnocare, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Ynocare message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Ynocare
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): yrpc.Ynocare;
    }

    /** Properties of an UnixTime. */
    interface IUnixTime {

        /** UnixTime timeUnix */
        timeUnix?: (Long|null);

        /** UnixTime timeStr */
        timeStr?: (string|null);
    }

    /** Represents an UnixTime. */
    class UnixTime implements IUnixTime {

        /**
         * Constructs a new UnixTime.
         * @param [properties] Properties to set
         */
        constructor(properties?: yrpc.IUnixTime);

        /** UnixTime timeUnix. */
        public timeUnix: Long;

        /** UnixTime timeStr. */
        public timeStr: string;

        /**
         * Encodes the specified UnixTime message. Does not implicitly {@link yrpc.UnixTime.verify|verify} messages.
         * @param message UnixTime message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: yrpc.IUnixTime, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an UnixTime message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns UnixTime
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): yrpc.UnixTime;
    }

    /** Properties of a natsOption. */
    interface InatsOption {

        /** natsOption origSid */
        origSid?: (Uint8Array|null);

        /** natsOption origCid */
        origCid?: (number|null);

        /** natsOption reply */
        reply?: (string|null);

        /** natsOption obin */
        obin?: (Uint8Array|null);
    }

    /** Represents a natsOption. */
    class natsOption implements InatsOption {

        /**
         * Constructs a new natsOption.
         * @param [properties] Properties to set
         */
        constructor(properties?: yrpc.InatsOption);

        /** natsOption origSid. */
        public origSid: Uint8Array;

        /** natsOption origCid. */
        public origCid: number;

        /** natsOption reply. */
        public reply: string;

        /** natsOption obin. */
        public obin: Uint8Array;

        /**
         * Encodes the specified natsOption message. Does not implicitly {@link yrpc.natsOption.verify|verify} messages.
         * @param message natsOption message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: yrpc.InatsOption, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a natsOption message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns natsOption
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): yrpc.natsOption;
    }
}
