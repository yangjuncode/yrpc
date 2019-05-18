package yrpcgen

import (
	"strconv"
	"strings"
)

type TrpcItem struct {
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
}

func (this *TrpcItem) Api() string {
	api := "/" + this.PkgName + "." + this.ServiceName + "/" + this.MethodName
	if this.Version > 0 {
		api += "/v"
		api += strconv.Itoa(this.Version)
	}

	return api
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
