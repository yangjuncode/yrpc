package yrpcgen

import (
	"log"

	plugin "github.com/golang/protobuf/protoc-gen-go/plugin"
)

type TmsgItem struct {
	Filename string
	Pkg      string
	Msg      string
}

//all proto msg map
var AllProtoMsgInfos = make(map[string]TmsgItem)

func FillAllProtoMsgInfo(request *plugin.CodeGeneratorRequest) {
	for _, fd := range request.GetProtoFile() {
		Filename := ExtractFilename(fd.GetName())
		pkgName := ProtoPackageName(fd)
		for _, msg := range fd.MessageType {
			msgItem := TmsgItem{
				Filename: Filename,
				Pkg:      pkgName,
				Msg:      *msg.Name,
			}

			prev, exist := AllProtoMsgInfos[msgItem.Msg]
			if exist {
				log.Fatal("dup Msg Name:", prev, msgItem)
			} else {
				AllProtoMsgInfos[msgItem.Msg] = msgItem
			}
		}
	}
}

func FillAllProtoGlobalInfo(request *plugin.CodeGeneratorRequest) {
	FillAllProtoMsgInfo(request)
}
