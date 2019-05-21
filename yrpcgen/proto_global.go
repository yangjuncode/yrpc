package yrpcgen

import (
	"log"

	plugin "github.com/golang/protobuf/protoc-gen-go/plugin"
)

type TmsgItem struct {
	Filename string
	PkgName  string
	MsgName  string
}

//all proto msg map
// "pkgname.msgname" -> tmsgItem
var AllProtoMsgs = make(map[string]TmsgItem)

func FillAllProtoMsgInfo(request *plugin.CodeGeneratorRequest) {
	for _, fd := range request.GetProtoFile() {
		Filename := ExtractFilename(fd.GetName())
		pkgName := ProtoPackageName(fd)
		for _, msg := range fd.MessageType {
			msgItem := TmsgItem{
				Filename: Filename,
				PkgName:  pkgName,
				MsgName:  *msg.Name,
			}

			msgKey := msgItem.PkgName + "." + msgItem.MsgName
			prev, exist := AllProtoMsgs[msgKey]
			if exist {
				log.Fatal("dup proto Msg Name:", prev, msgItem)
			} else {
				AllProtoMsgs[msgKey] = msgItem
			}
		}
	}
}

func FillAllProtoGlobalInfo(request *plugin.CodeGeneratorRequest) {
	FillAllProtoMsgInfo(request)
}
