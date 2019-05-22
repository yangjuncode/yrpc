package yrpcgen

import (
	"strconv"
	"strings"

	"github.com/golang/protobuf/protoc-gen-go/descriptor"
	plugin "github.com/golang/protobuf/protoc-gen-go/plugin"
)

type TrpcItem struct {
	FileName      string
	PkgName       string
	ServiceName   string
	MethodName    string
	MethodComment string
	InputType     string
	OutputType    string
	// Identifies if client streams multiple client messages
	ClientStreaming bool
	// Identifies if server streams multiple server messages
	ServerStreaming bool
	Version         int

	RpcSrvDescriptor    *descriptor.ServiceDescriptorProto
	RpcMethodDescriptor *descriptor.MethodDescriptorProto
}

func (this *TrpcItem) Api() string {
	api := "/" + this.PkgName + "." + this.ServiceName + "/" + this.MethodName
	if this.Version > 0 {
		api += "/v"
		api += strconv.Itoa(this.Version)
	}

	return api
}

func (this *TrpcItem) Key() string {
	return "/" + this.PkgName + "." + this.ServiceName + "/" + this.MethodName
}

func GetRpcVersionFromComment(srvComment string, methodComment string) (verion int) {
	verion = GetVersionFromComment(methodComment)
	if verion > 0 {
		return
	}

	verion = GetVersionFromComment(srvComment)

	return
}
func GetVersionFromComment(comment string) (verion int) {
	commentLines := strings.Split(comment, "\n")
	for _, line := range commentLines {
		if strings.HasPrefix(line, "@ver") {
			verion, _ = strconv.Atoi(line[4:])
			return
		}
	}

	return 0
}

func YrpcGenJs(request *plugin.CodeGeneratorRequest) (genFiles []*plugin.CodeGeneratorResponse_File) {

	//gen yrpc files
	genFiles = append(genFiles, jsGenRpc(request)...)

	return
}
