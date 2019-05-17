package main

import (
	"flag"
	"net/http"
	"os"

	"github.com/yangjuncode/yrpc/yrpc"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"
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

	http.ListenAndServe(*httpAddr, nil)

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
	for {
		//conn.SetReadDeadline(time.Now().Add(time.Minute * 10))

		_, pktData, err := conn.ReadMessage()

		if err != nil {
			log.Info().Err(err).Msg("ws read err")
			conn.Close()
			return
		}
		ypacket := &yrpc.Ypacket{}

		err = ypacket.Unmarshal(pktData)

		if err != nil {
			log.Error().Err(err).Msg("ypacket decode err")
			conn.Close()
			return
		}

		switch ypacket.Cmd {
		case 1:
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
		case 7:
		case 8:
		case 9:
		case 10:
		case 11:
			//no used yet
		case 12:
		case 13:
		case 14:

		}
	}
}
