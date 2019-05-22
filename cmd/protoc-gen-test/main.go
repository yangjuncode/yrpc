package main

import (
	"io/ioutil"
	"os"

	"github.com/golang/protobuf/proto"
	plugin "github.com/golang/protobuf/protoc-gen-go/plugin"
	"github.com/rs/zerolog/log"
	"github.com/yangjuncode/yrpc/yrpcgen"
)

var request plugin.CodeGeneratorRequest

func main() {

	data, err := ioutil.ReadAll(os.Stdin)
	if err != nil {
		log.Fatal().Err(err).Msg("error reading input")
		return
	}

	if err := proto.Unmarshal(data, &request); err != nil {
		log.Fatal().Err(err).Msg("error: parsing input proto")
	}

	yrpcgen.FillAllProtoGlobalInfo(&request)

	for pkgMsg, msgitem := range yrpcgen.GlobalAllProtoMsgs {
		msgitem.MsgDescriptorProto = nil
		msgitem.MsgFileDescriptorProto = nil
		log.Info().Msgf("%s:%v", pkgMsg, msgitem)
	}

	for _, fd := range request.GetProtoFile() {
		Filename := yrpcgen.ExtractFilename(fd.GetName())
		pkgName := yrpcgen.ProtoPackageName(fd)

		for _, service := range fd.Service {

			_, srvComment := yrpcgen.GetProtoServiceLeadingComments(fd, service)
			srvVersion := yrpcgen.GetVersionFromComment(srvComment)
			for _, rpc := range service.Method {
				_, methodComment := yrpcgen.GetProtoRpcLeadingComments(fd, service, rpc)
				clientStream := false
				if rpc.ClientStreaming != nil {
					clientStream = *rpc.ClientStreaming
				}
				serverStream := false
				if rpc.ServerStreaming != nil {
					serverStream = *rpc.ServerStreaming
				}
				rpcItem := yrpcgen.TrpcItem{
					FileName:        Filename,
					PkgName:         pkgName,
					ServiceName:     *service.Name,
					MethodName:      *rpc.Name,
					MethodComment:   methodComment,
					InputType:       (*rpc.InputType),
					OutputType:      (*rpc.OutputType),
					ClientStreaming: clientStream,
					ServerStreaming: serverStream,
					Version:         srvVersion,
					//RpcSrvDescriptor:    service,
					//RpcMethodDescriptor: rpc,
				}

				log.Info().Msgf("rpcItem:%v", rpcItem)

			}
		}
	}

}
