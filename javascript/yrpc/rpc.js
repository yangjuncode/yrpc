/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.yrpc = (function() {

    /**
     * Namespace yrpc.
     * @exports yrpc
     * @namespace
     */
    var yrpc = {};

    yrpc.Ypacket = (function() {

        /**
         * Properties of a Ypacket.
         * @memberof yrpc
         * @interface IYpacket
         * @property {number|null} [len] Ypacket len
         * @property {number|null} [cmd] Ypacket cmd
         * @property {number|null} [cid] Ypacket cid
         * @property {number|null} [no] Ypacket no
         * @property {number|null} [res] Ypacket res
         * @property {Uint8Array|null} [body] Ypacket body
         * @property {string|null} [optstr] Ypacket optstr
         * @property {Uint8Array|null} [optbin] Ypacket optbin
         * @property {Array.<string>|null} [meta] Ypacket meta
         */

        /**
         * Constructs a new Ypacket.
         * @memberof yrpc
         * @classdesc Represents a Ypacket.
         * @implements IYpacket
         * @constructor
         * @param {yrpc.IYpacket=} [properties] Properties to set
         */
        function Ypacket(properties) {
            this.meta = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Ypacket len.
         * @member {number} len
         * @memberof yrpc.Ypacket
         * @instance
         */
        Ypacket.prototype.len = 0;

        /**
         * Ypacket cmd.
         * @member {number} cmd
         * @memberof yrpc.Ypacket
         * @instance
         */
        Ypacket.prototype.cmd = 0;

        /**
         * Ypacket cid.
         * @member {number} cid
         * @memberof yrpc.Ypacket
         * @instance
         */
        Ypacket.prototype.cid = 0;

        /**
         * Ypacket no.
         * @member {number} no
         * @memberof yrpc.Ypacket
         * @instance
         */
        Ypacket.prototype.no = 0;

        /**
         * Ypacket res.
         * @member {number} res
         * @memberof yrpc.Ypacket
         * @instance
         */
        Ypacket.prototype.res = 0;

        /**
         * Ypacket body.
         * @member {Uint8Array} body
         * @memberof yrpc.Ypacket
         * @instance
         */
        Ypacket.prototype.body = $util.newBuffer([]);

        /**
         * Ypacket optstr.
         * @member {string} optstr
         * @memberof yrpc.Ypacket
         * @instance
         */
        Ypacket.prototype.optstr = "";

        /**
         * Ypacket optbin.
         * @member {Uint8Array} optbin
         * @memberof yrpc.Ypacket
         * @instance
         */
        Ypacket.prototype.optbin = $util.newBuffer([]);

        /**
         * Ypacket meta.
         * @member {Array.<string>} meta
         * @memberof yrpc.Ypacket
         * @instance
         */
        Ypacket.prototype.meta = $util.emptyArray;

        /**
         * Encodes the specified Ypacket message. Does not implicitly {@link yrpc.Ypacket.verify|verify} messages.
         * @function encode
         * @memberof yrpc.Ypacket
         * @static
         * @param {yrpc.IYpacket} message Ypacket message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Ypacket.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.len != null && message.hasOwnProperty("len"))
                writer.uint32(/* id 1, wireType 5 =*/13).fixed32(message.len);
            if (message.cmd != null && message.hasOwnProperty("cmd"))
                writer.uint32(/* id 2, wireType 5 =*/21).fixed32(message.cmd);
            if (message.cid != null && message.hasOwnProperty("cid"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.cid);
            if (message.no != null && message.hasOwnProperty("no"))
                writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.no);
            if (message.res != null && message.hasOwnProperty("res"))
                writer.uint32(/* id 5, wireType 0 =*/40).sint32(message.res);
            if (message.body != null && message.hasOwnProperty("body"))
                writer.uint32(/* id 10, wireType 2 =*/82).bytes(message.body);
            if (message.optstr != null && message.hasOwnProperty("optstr"))
                writer.uint32(/* id 11, wireType 2 =*/90).string(message.optstr);
            if (message.optbin != null && message.hasOwnProperty("optbin"))
                writer.uint32(/* id 12, wireType 2 =*/98).bytes(message.optbin);
            if (message.meta != null && message.meta.length)
                for (var i = 0; i < message.meta.length; ++i)
                    writer.uint32(/* id 13, wireType 2 =*/106).string(message.meta[i]);
            return writer;
        };

        /**
         * Decodes a Ypacket message from the specified reader or buffer.
         * @function decode
         * @memberof yrpc.Ypacket
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {yrpc.Ypacket} Ypacket
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Ypacket.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.yrpc.Ypacket();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.len = reader.fixed32();
                    break;
                case 2:
                    message.cmd = reader.fixed32();
                    break;
                case 3:
                    message.cid = reader.uint32();
                    break;
                case 4:
                    message.no = reader.uint32();
                    break;
                case 5:
                    message.res = reader.sint32();
                    break;
                case 10:
                    message.body = reader.bytes();
                    break;
                case 11:
                    message.optstr = reader.string();
                    break;
                case 12:
                    message.optbin = reader.bytes();
                    break;
                case 13:
                    if (!(message.meta && message.meta.length))
                        message.meta = [];
                    message.meta.push(reader.string());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Ypacket;
    })();

    yrpc.Yempty = (function() {

        /**
         * Properties of a Yempty.
         * @memberof yrpc
         * @interface IYempty
         */

        /**
         * Constructs a new Yempty.
         * @memberof yrpc
         * @classdesc Represents a Yempty.
         * @implements IYempty
         * @constructor
         * @param {yrpc.IYempty=} [properties] Properties to set
         */
        function Yempty(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Encodes the specified Yempty message. Does not implicitly {@link yrpc.Yempty.verify|verify} messages.
         * @function encode
         * @memberof yrpc.Yempty
         * @static
         * @param {yrpc.IYempty} message Yempty message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Yempty.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Decodes a Yempty message from the specified reader or buffer.
         * @function decode
         * @memberof yrpc.Yempty
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {yrpc.Yempty} Yempty
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Yempty.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.yrpc.Yempty();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Yempty;
    })();

    yrpc.Ynocare = (function() {

        /**
         * Properties of a Ynocare.
         * @memberof yrpc
         * @interface IYnocare
         */

        /**
         * Constructs a new Ynocare.
         * @memberof yrpc
         * @classdesc Represents a Ynocare.
         * @implements IYnocare
         * @constructor
         * @param {yrpc.IYnocare=} [properties] Properties to set
         */
        function Ynocare(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Encodes the specified Ynocare message. Does not implicitly {@link yrpc.Ynocare.verify|verify} messages.
         * @function encode
         * @memberof yrpc.Ynocare
         * @static
         * @param {yrpc.IYnocare} message Ynocare message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Ynocare.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Decodes a Ynocare message from the specified reader or buffer.
         * @function decode
         * @memberof yrpc.Ynocare
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {yrpc.Ynocare} Ynocare
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Ynocare.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.yrpc.Ynocare();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return Ynocare;
    })();

    yrpc.UnixTime = (function() {

        /**
         * Properties of an UnixTime.
         * @memberof yrpc
         * @interface IUnixTime
         * @property {Long|null} [timeUnix] UnixTime timeUnix
         * @property {string|null} [timeStr] UnixTime timeStr
         */

        /**
         * Constructs a new UnixTime.
         * @memberof yrpc
         * @classdesc Represents an UnixTime.
         * @implements IUnixTime
         * @constructor
         * @param {yrpc.IUnixTime=} [properties] Properties to set
         */
        function UnixTime(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * UnixTime timeUnix.
         * @member {Long} timeUnix
         * @memberof yrpc.UnixTime
         * @instance
         */
        UnixTime.prototype.timeUnix = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * UnixTime timeStr.
         * @member {string} timeStr
         * @memberof yrpc.UnixTime
         * @instance
         */
        UnixTime.prototype.timeStr = "";

        /**
         * Encodes the specified UnixTime message. Does not implicitly {@link yrpc.UnixTime.verify|verify} messages.
         * @function encode
         * @memberof yrpc.UnixTime
         * @static
         * @param {yrpc.IUnixTime} message UnixTime message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        UnixTime.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.timeUnix != null && message.hasOwnProperty("timeUnix"))
                writer.uint32(/* id 1, wireType 0 =*/8).sint64(message.timeUnix);
            if (message.timeStr != null && message.hasOwnProperty("timeStr"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.timeStr);
            return writer;
        };

        /**
         * Decodes an UnixTime message from the specified reader or buffer.
         * @function decode
         * @memberof yrpc.UnixTime
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {yrpc.UnixTime} UnixTime
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        UnixTime.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.yrpc.UnixTime();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.timeUnix = reader.sint64();
                    break;
                case 2:
                    message.timeStr = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        return UnixTime;
    })();

    return yrpc;
})();

module.exports = $root;
