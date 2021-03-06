package main

import (
	"context"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"
	"github.com/yangjuncode/yrpc"
	"github.com/yangjuncode/yrpc/util"
	"google.golang.org/grpc"
)

var httpAddr = flag.String("http-addr", ":8000", "http service address")
var wwwDir = flag.String("www-dir", ".", "http www doc dir")
var grpcAddr = flag.String("grpc-addr", "127.0.0.1:6000", "grpc service address")

func main() {
	flag.Parse()

	WebServe()
}
func WebServe() {
	fileInfo, err := os.Stat(*wwwDir)
	if err != nil {
		log.Fatal().Err(err).Msg("get www-dir state err")
		return
	}
	if !fileInfo.IsDir() {
		//not dir
		log.Fatal().Str("www-dir", *wwwDir).Msg("www-dir is not real dir")
		return
	}

	r := mux.NewRouter()

	r.HandleFunc("/ws", yrpcWebsocket)

	r.PathPrefix("/").Handler(
		handlers.CompressHandler(http.StripPrefix("/",

			http.FileServer(http.Dir(*wwwDir)))))

	http.Handle("/", r)

	err = http.ListenAndServe(*httpAddr, nil)
	if err != nil {
		log.Error().Err(err).Str("httpAddr", *httpAddr).Msg("http server err")
	}

}

var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool {
	return true
}}

func yrpcWebsocket(w http.ResponseWriter, r *http.Request) {
	wsCon, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Info().Err(err).Msg("ws upgrade err")
		return
	}

	go processingOneWebsocket(wsCon)

}

func processingOneWebsocket(conn *websocket.Conn) {
	log.Info().Str("ip", conn.RemoteAddr().String()).Msg("got one ws connected")

	rpcManager := TrpcStreamManagerNew()
	for {
		//conn.SetReadDeadline(time.Now().Add(time.Minute * 10))

		_, pktData, err := conn.ReadMessage()

		if err != nil {
			log.Info().Err(err).Msg("ws read err")
			conn.Close()
			return
		}
		pkt := &yrpc.Ypacket{}

		err = pkt.Unmarshal(pktData)

		if err != nil {
			log.Error().Err(err).Msg("ypacket decode err")
			conn.Close()
			return
		}

		fmt.Println("got pkt:", pkt)

		switch pkt.Cmd {
		case 1:
			yrpcUnaryCall(conn, pkt)
		case 2:
			yrpcNocareCall(conn, pkt)
		case 3:
			fallthrough
		case 7:
			fallthrough
		case 8:
			stream := NewRpcStreamCall(conn, pkt)
			if stream != nil {
				rpcManager.NewRpcStream(stream)
			}
		case 4:
			fallthrough
		case 5:
			fallthrough
		case 6:
			stream := rpcManager.GetRpcStream(pkt)
			if stream != nil {
				stream.GotPacket(pkt)
			}
		case 9:
		case 10:
		case 11:
			//no used yet
		case 12:
		case 13:
		case 14:
			yrpcPing(conn, pkt)
		}
	}
}

func yrpcPing(conn *websocket.Conn, pkt *yrpc.Ypacket) {
	if pkt.Res != 0 {
		//pong
		log.Info().Str("ip", conn.RemoteAddr().String()).Msg("got pong")
		return
	}

	pkt.Res = 1

	if len(pkt.Optstr) > 0 {
		unixTime := yrpc.UnixTime{
			TimeUnix: util.GetNowUnixEpochInMilliseconds(),
			TimeStr:  util.GetNowTimeUtcStrzzz(),
		}

		pkt.Body, _ = unixTime.Marshal()
	}

	err := writeWebsocketPacket(conn, pkt)
	if err != nil {
		log.Error().Err(err).Msg("response ping err")
	}
}

func writeWebsocketData(conn *websocket.Conn, data []byte) (err error) {
	err = conn.WriteMessage(websocket.BinaryMessage, data)
	return
}
func writeWebsocketPacket(conn *websocket.Conn, pkt *yrpc.Ypacket) (err error) {
	data, _ := pkt.Marshal()
	err = conn.WriteMessage(websocket.BinaryMessage, data)
	fmt.Println("sent pkt:", err, conn.RemoteAddr().String(), pkt)

	return
}

func yrpcUnaryCall(conn *websocket.Conn, pkt *yrpc.Ypacket) {
	grpcCon, err := getGrpcConn(*grpcAddr)

	if err != nil {
		responseRpcErr(conn, pkt, err)
		return
	}

	var replyB []byte
	replyB, err = grpcCon.InvokeForward(context.Background(), pkt.Optstr, pkt.Body)
	if err != nil {
		responseRpcErr(conn, pkt, err)
		return
	} else {
		responseRpcUnary(conn, pkt, replyB)
	}
}

func yrpcNocareCall(conn *websocket.Conn, pkt *yrpc.Ypacket) {
	grpcCon, err := getGrpcConn(*grpcAddr)

	if err != nil {
		return
	}

	_, _ = grpcCon.InvokeForward(context.Background(), pkt.Optstr, pkt.Body)
}

func responseRpcErr(conn *websocket.Conn, pkt *yrpc.Ypacket, err error) {
	pkt.Res = -1
	pkt.Optstr = err.Error()
	pkt.Cmd = 4

	_ = writeWebsocketPacket(conn, pkt)

}

func responseRpcUnary(conn *websocket.Conn, reqpkt *yrpc.Ypacket, result []byte) {
	reqpkt.Body = result
	reqpkt.Res = 0

	fmt.Println("response unary call:", reqpkt)

	err := writeWebsocketPacket(conn, reqpkt)
	if err != nil {
		log.Info().Err(err).Msg("send ws response err")
	}
}

func getGrpcConn(grpcAddr string) (conn *grpc.ClientConn, err error) {
	grpConn, err := grpc.Dial(grpcAddr, grpc.WithInsecure())
	if err != nil {
		return nil, err
	}

	return grpConn, nil
}

type TyrpcStream struct {
	GrpcConn   *grpc.ClientConn
	GrpcStream grpc.ClientStream

	HasCancel    bool
	CancelFn     context.CancelFunc
	HasCloseSent bool
	Cid          uint32
	RpcType      uint32
	Api          string

	responseNo uint32

	WsConn *websocket.Conn

	manager *TrpcStreamManager
}

func NewRpcStreamCall(conn *websocket.Conn, pkt *yrpc.Ypacket) (stream *TyrpcStream) {
	grpcCon, err := getGrpcConn(*grpcAddr)

	if err != nil {
		fmt.Println("make grpc con err:", err, pkt.Optstr)
		responseRpcErr(conn, pkt, err)
		return nil
	}

	sreamDesc := &grpc.StreamDesc{
		ClientStreams: pkt.Cmd == 3 || pkt.Cmd == 8,
		ServerStreams: pkt.Cmd == 7 || pkt.Cmd == 8,
	}
	ctx, cancelFn := context.WithCancel(context.Background())
	rpcStream, err := grpc.NewClientStream(ctx, sreamDesc, grpcCon, pkt.Optstr)
	if err != nil {
		fmt.Println("make rpc stream err:", err, pkt.Optstr)
		responseRpcErr(conn, pkt, err)
		grpcCon.Close()
		return nil
	}

	stream = &TyrpcStream{
		RpcType:    pkt.Cmd,
		Cid:        pkt.Cid,
		WsConn:     conn,
		GrpcConn:   grpcCon,
		GrpcStream: rpcStream,
		CancelFn:   cancelFn,
		Api:        pkt.Optstr,
	}

	err = stream.GrpcStream.SendMsgForward(pkt.Body)
	if err != nil {
		fmt.Println("make rpc stream err:", err, pkt.Optstr)
		responseRpcErr(conn, pkt, err)
		stream.CancelFn()
		grpcCon.Close()
		return nil
	}

	stream.RpcCallEstablished(pkt)

	if stream.RpcType == 7 {
		//server stream
		stream.CloseSend(pkt)
	}

	go stream.Recv()

	return stream
}
func (this *TyrpcStream) RpcCallEstablished(pkt *yrpc.Ypacket) {
	resPkt := &yrpc.Ypacket{
		Cid: pkt.Cid,
		Cmd: pkt.Cmd,
		No:  pkt.No,
	}
	writeWebsocketPacket(this.WsConn, resPkt)
}
func (this *TyrpcStream) Cancel() {
	if this.HasCancel {
		return
	}
	this.CancelFn()
	this.HasCancel = true
}
func (this *TyrpcStream) CloseSend(pkt *yrpc.Ypacket) {
	if this.HasCloseSent || this.HasCancel {
		return
	}
	this.GrpcStream.CloseSend()
}
func (this *TyrpcStream) GotPacket(pkt *yrpc.Ypacket) {
	if this.HasCancel {
		return
	}
	switch pkt.Cmd {
	case 4:
		//cancel
		this.Cancel()
		this.manager.DestroyRpcStream(this)
	case 5:
		this.SendNext(pkt)
	case 6:
		this.CloseSend(pkt)
	case 13:
		this.manager.DestroyRpcStream(this)
	}
}
func (this *TyrpcStream) Recv() {

	for {
		msgB, err := this.GrpcStream.RecvMsgForward()
		if err == io.EOF {
			this.RpcEnd()
			return
		}
		if err != nil {
			responseRpcErr(this.WsConn, &yrpc.Ypacket{
				Cid: this.Cid,
			}, err)

			this.manager.DestroyRpcStream(this)
			return
		}

		resPkt := &yrpc.Ypacket{
			Cmd:  12,
			Cid:  this.Cid,
			No:   this.GetResponseNo(),
			Body: msgB,
		}
		err = writeWebsocketPacket(this.WsConn, resPkt)
		if err != nil {
			fmt.Println("send ws response 12 err:", this.Api)
		}
	}
}
func (this *TyrpcStream) GetResponseNo() uint32 {
	r := this.responseNo
	this.responseNo++
	return r
}
func (this *TyrpcStream) RpcEnd() {
	pkt := &yrpc.Ypacket{
		Cmd: 13,
		Cid: this.Cid,
	}

	writeWebsocketPacket(this.WsConn, pkt)
}
func (this *TyrpcStream) SendNext(pkt *yrpc.Ypacket) (err error) {
	if this.HasCloseSent {
		return
	}
	err = this.GrpcStream.SendMsgForward(pkt.Body)
	if err != nil {
		return err
	}

	return nil
}

type TrpcStreamManager struct {
	Streams sync.Map
}

func TrpcStreamManagerNew() *TrpcStreamManager {
	return &TrpcStreamManager{
		Streams: sync.Map{},
	}
}
func (this *TrpcStreamManager) GetRpcStream(pkt *yrpc.Ypacket) (stream *TyrpcStream) {
	s, exists := this.Streams.Load(pkt.Cid)
	if !exists {
		return nil
	}

	return s.(*TyrpcStream)
}
func (this *TrpcStreamManager) NewRpcStream(stream *TyrpcStream) {
	oldS, exists := this.Streams.Load(stream.Cid)
	if exists {
		oldstream := oldS.(*TyrpcStream)
		oldstream.Cancel()
	}
	stream.manager = this
	this.Streams.Store(stream.Cid, stream)
}
func (this *TrpcStreamManager) DestroyRpcStream(stream *TyrpcStream) {
	this.Streams.Delete(stream.Cid)
}
