package yrpcgen

import (
	"bytes"
	"log"
	"strings"
	"text/template"

	"github.com/golang/protobuf/proto"
	plugin "github.com/golang/protobuf/protoc-gen-go/plugin"
)

type TjsrpcImportManager struct {
	FileName string
	PkgName  string

	RawImport map[string]string
	MsgImport map[string]*TmsgItem
}

func NewjsrpcImportManager(filename, pkgname string) (m *TjsrpcImportManager) {
	m = &TjsrpcImportManager{
		FileName:  filename,
		PkgName:   pkgname,
		RawImport: make(map[string]string, 0),
		MsgImport: make(map[string]*TmsgItem, 0),
	}
	return
}

func (this *TjsrpcImportManager) ImportMsgType(pkgName string, msgName string) {
	msgKey := pkgName + "." + msgName
	this.ImportMsgTypeByKey(msgKey)
}
func (this *TjsrpcImportManager) ImportMsgTypeByKey(msgKey string) {
	msgItem := GetMsgItem(msgKey)
	if msgItem == nil {
		log.Fatal("cann't get msgItem for:", msgKey)
	}

	//if msgItem.PkgName == this.PkgName && msgItem.Filename == this.FileName {
	//	log.Fatal("rpc can not write with message in the same file,pleae seperate it")
	//}

	this.MsgImport[msgKey] = msgItem
}
func (this *TjsrpcImportManager) AddRawImportType(key string, path string) {
	this.RawImport[key] = path
}
func (this *TjsrpcImportManager) GenerateImport() string {
	//translate to raw import
	for _, msgItem := range this.MsgImport {
		this.AddRawImportType(msgItem.ImportName(), "../"+msgItem.PkgName+"/"+msgItem.Filename)
	}

	//gen raw import
	r := strings.Builder{}
	for key, path := range this.RawImport {
		r.WriteString("import " + key + " from '" + path + "'\r\n")
	}

	return r.String()
}

//jsGenRpc gen js yrpc code
func jsGenRpc(request *plugin.CodeGeneratorRequest) (genFiles []*plugin.CodeGeneratorResponse_File) {

	for _, fd := range request.GetProtoFile() {

		if len(fd.Service) == 0 {
			continue
		}

		pkgName := ProtoPackageName(fd)
		fileName := ExtractFilename(fd.GetName())

		importManager := NewjsrpcImportManager(fileName, pkgName)
		//importManager.AddRawImportType("{Writer}", "protobufjs")
		importManager.AddRawImportType("{rpcCon}", "../yrpc/yrpc_yrpc")
		importManager.AddRawImportType("{ProtoEncode}", "../yrpc/yrpc_yrpc")
		importManager.AddRawImportType("{TCallOption}", "../yrpc/yrpc_yrpc")

		fileRpcPostfix := ""
		if len(fd.MessageType) > 0 {
			fileRpcPostfix = "Yrpc"
		}
		jsYrpcFilename := pkgName + "/" + fileName + fileRpcPostfix + ".ts"
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
				inputType := (*rpc.InputType)[1:]
				inputMsgItem := GetMsgItem(inputType)
				if inputMsgItem == nil {
					log.Fatal("can not found msg for:", inputType)
				}
				outputType := (*rpc.OutputType)[1:]
				outputMsgItem := GetMsgItem(outputType)
				if outputMsgItem == nil {
					log.Fatal("can not found msg for:", outputType)
				}

				rpcItem := TrpcItem{
					PkgName:         pkgName,
					ServiceName:     *service.Name,
					MethodName:      *rpc.Name,
					MethodComment:   methodComment,
					InputType:       inputMsgItem.ImportName() + (*rpc.InputType),
					OutputType:      outputMsgItem.ImportName() + (*rpc.OutputType),
					ClientStreaming: clientStream,
					ServerStreaming: serverStream,
					Version:         srvVersion,
				}

				importManager.ImportMsgTypeByKey(inputType)
				importManager.ImportMsgTypeByKey(outputType)
				if rpcItem.ClientStreaming || rpcItem.ServerStreaming {
					importManager.AddRawImportType("{TRpcStream}", "../yrpc/yrpc_yrpc")

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
			tplContent["srvVersion"] = srvVersion

			t := template.Must(template.New("yrp-js").Parse(tmpJsRpcClass))

			var tplBytes bytes.Buffer
			if err := t.Execute(&tplBytes, tplContent); err != nil {
				log.Fatal(err)
			}

			oneClassContents := tplBytes.String()
			jsYrpcFileContent += oneClassContents

			//gen one class
		}

		//gen import
		jsYrpcFileContent = importManager.GenerateImport() + jsYrpcFileContent

		genFile := &plugin.CodeGeneratorResponse_File{
			Name:    proto.String(jsYrpcFilename),
			Content: proto.String(jsYrpcFileContent),
		}

		genFiles = append(genFiles, genFile)
	}
	return
}
