package yrpcgen

import (
	"log"

	"github.com/golang/protobuf/protoc-gen-go/descriptor"
	plugin "github.com/golang/protobuf/protoc-gen-go/plugin"
)

type TmsgItem struct {
	Filename               string
	PkgName                string
	MsgName                string
	MsgFileDescriptorProto *descriptor.FileDescriptorProto
	MsgDescriptorProto     *descriptor.DescriptorProto
}

//all proto msg map
// "pkgname.msgname" -> tmsgItem
var AllProtoMsgs = make(map[string]*TmsgItem)

// "/pkgname.srvname/rpcname" -> TrpcItem
var AllProtoRpcs = make(map[string]*TrpcItem)

func FillAllProtoMsgInfo(request *plugin.CodeGeneratorRequest) {
	for _, fd := range request.GetProtoFile() {
		Filename := ExtractFilename(fd.GetName())
		pkgName := ProtoPackageName(fd)
		for _, msg := range fd.MessageType {
			msgItem := TmsgItem{
				Filename:               Filename,
				PkgName:                pkgName,
				MsgName:                *msg.Name,
				MsgFileDescriptorProto: fd,
				MsgDescriptorProto:     msg,
			}

			msgKey := msgItem.PkgName + "." + msgItem.MsgName
			prev, exist := AllProtoMsgs[msgKey]
			if exist {
				log.Fatal("dup proto Msg Name:", prev, msgItem)
			} else {
				AllProtoMsgs[msgKey] = &msgItem
			}
		}
	}
}

func FillAllProtoRpcInfo(request *plugin.CodeGeneratorRequest) {
	for _, fd := range request.GetProtoFile() {
		//Filename := ExtractFilename(fd.GetName())
		pkgName := ProtoPackageName(fd)

		for _, service := range fd.Service {

			_, srvComment := GetProtoServiceLeadingComments(fd, service)
			srvVersion := GetVersionFromComment(srvComment)
			for _, rpc := range service.Method {
				_, methodComment := GetProtoRpcLeadingComments(fd, service, rpc)
				clientStream := false
				if rpc.ClientStreaming != nil {
					clientStream = *rpc.ClientStreaming
				}
				serverStream := false
				if rpc.ServerStreaming != nil {
					serverStream = *rpc.ServerStreaming
				}
				rpcItem := TrpcItem{
					PkgName:             pkgName,
					ServiceName:         *service.Name,
					MethodName:          *rpc.Name,
					MethodComment:       methodComment,
					InputType:           (*rpc.InputType)[1:],
					OutputType:          (*rpc.OutputType)[1:],
					ClientStreaming:     clientStream,
					ServerStreaming:     serverStream,
					Version:             srvVersion,
					RpcSrvDescriptor:    service,
					RpcMethodDescriptor: rpc,
				}

				rpcKey := "/" + rpcItem.PkgName + "." + rpcItem.ServiceName + "/" + rpcItem.MethodName
				prev, exist := AllProtoRpcs[rpcKey]
				if exist {
					log.Fatal("dup proto rpc Name:", prev, rpcItem)
				} else {
					AllProtoRpcs[rpcKey] = &rpcItem
				}
			}

		}

	}
}

func FillAllProtoGlobalInfo(request *plugin.CodeGeneratorRequest) {
	FillAllProtoMsgInfo(request)
	FillAllProtoRpcInfo(request)
}
