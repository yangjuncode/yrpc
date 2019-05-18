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

	var response plugin.CodeGeneratorResponse
	if err := proto.Unmarshal(data, &request); err != nil {
		log.Fatal().Err(err).Msg("error: parsing input proto")
	}

	yrpcgen.FillAllProtoGlobalInfo(&request)

	genJsFiles := yrpcgen.YrpcGenJs(&request)

	for _, f := range genJsFiles {
		response.File = append(response.File, f)
	}

	//genGoFiles := yrpcgen.YrpcGenGo(&request)
	//
	//for _, f := range genGoFiles {
	//	response.File = append(response.File, f)
	//}

	if data, err = proto.Marshal(&response); err != nil {
		log.Fatal().Err(err).Msg("error: failed to marshal output proto")
	}
	if _, err := os.Stdout.Write(data); err != nil {
		log.Fatal().Err(err).Msg("error: failed to write output proto")
	}
}
