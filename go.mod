module github.com/yangjuncode/yrpc

go 1.12

require (
	github.com/gogo/protobuf v1.2.1
	github.com/golang/protobuf v1.3.1
	github.com/gorilla/handlers v1.4.0
	github.com/gorilla/mux v1.7.2
	github.com/gorilla/websocket v1.4.0
	github.com/rs/zerolog v1.14.3
	google.golang.org/grpc v0.0.0-00010101000000-000000000000
)

replace google.golang.org/grpc => github.com/yangjuncode/grpc-go v1.20.2
