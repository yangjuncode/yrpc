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

	for pkgMsg, msgitem := range yrpcgen.AllProtoMsgs {
		log.Info().Msgf("%s:%v", pkgMsg, msgitem)
	}

}
