package yrpcgen

import (
	"bytes"
	"log"
	"text/template"

	"github.com/golang/protobuf/proto"
	plugin "github.com/golang/protobuf/protoc-gen-go/plugin"
)

//jsGenRpc gen js yrpc code
func jsGenRpc(request *plugin.CodeGeneratorRequest) (genFiles []*plugin.CodeGeneratorResponse_File) {

	for _, fd := range request.GetProtoFile() {

		if len(fd.Service) == 0 {
			continue
		}

		pkgName := ProtoPackageName(fd)

		jsYrpcFilename := "yrpc/" + pkgName + "/" + ExtractFilename(fd.GetName()) + ".ts"
		jsYrpcFileContent := ""

		for _, service := range fd.Service {

			tplContent := make(map[string]interface{})

			unaryCalls := []TrpcItem{}
			unaryNocareCalls := []TrpcItem{}
			clientStreamCalls := []TrpcItem{}
			serverStreamCalls := []TrpcItem{}
			bidiStreamCalls := []TrpcItem{}

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
					PkgName:         pkgName,
					ServiceName:     *service.Name,
					MethodName:      *rpc.Name,
					MethodComment:   methodComment,
					InputType:       (*rpc.InputType)[1:],
					OutputType:      (*rpc.OutputType)[1:],
					ClientStreaming: clientStream,
					ServerStreaming: serverStream,
					Version:         GetVersionFromComment(methodComment),
				}

				//log.Println("rpcItem:", rpcItem)

				if rpcItem.Version == 0 && srvVersion > 0 {
					rpcItem.Version = srvVersion
				}

				if rpcItem.ClientStreaming {
					if rpcItem.ServerStreaming {
						bidiStreamCalls = append(bidiStreamCalls, rpcItem)
						continue
					} else {
						clientStreamCalls = append(clientStreamCalls, rpcItem)
						continue
					}
				}

				if rpcItem.ServerStreaming {
					serverStreamCalls = append(serverStreamCalls, rpcItem)
					continue
				}

				if rpcItem.OutputType == "Ynocare" {
					unaryNocareCalls = append(unaryNocareCalls, rpcItem)
				} else {
					unaryCalls = append(unaryCalls, rpcItem)
				}
			}

			tplContent["unaryCalls"] = unaryCalls
			tplContent["unaryNocareCalls"] = unaryNocareCalls
			tplContent["clientStreamCalls"] = clientStreamCalls
			tplContent["serverStreamCalls"] = serverStreamCalls
			tplContent["bidiStreamCalls"] = bidiStreamCalls

			tplContent["className"] = *service.Name

			t := template.Must(template.New("yrp-js").Parse(tmpJsRpcClass))

			var tplBytes bytes.Buffer
			if err := t.Execute(&tplBytes, tplContent); err != nil {
				log.Fatal(err)
			}

			oneClassContents := tplBytes.String()
			jsYrpcFileContent += oneClassContents

			//gen one class
		}

		genFile := &plugin.CodeGeneratorResponse_File{
			Name:    proto.String(jsYrpcFilename),
			Content: proto.String(jsYrpcFileContent),
		}

		genFiles = append(genFiles, genFile)
	}
	return
}
