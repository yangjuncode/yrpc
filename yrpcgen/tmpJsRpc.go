package yrpcgen

var tmpJsRpcHead = `


import {Writer} from 'protobufjs'

import {rpcCon} from '@/yrpc/yrpc'
import {TCallOption} from '@/yrpc/yrpc'
import {TRpcStream} from '@/yrpc/yrpc'

`

var tmpJsRpcClass = `
{{$className := .className}}
class {{$className}} {
{{ range $no,$rpc := .unaryNocareCalls }}
 public static {{$rpc.MethodName}}(req:{{$rpc.InputType}}):Error | null{
	let w:Writer={{$rpc.InputType}}.encode(req)
	let reqData=w.finish()
	
	let api='{{$rpc.Api}}'
	const v={{$rpc.Version}}

	return rpcCon.NocareCall(reqData,api,v)
	
}
{{ end }}

{{ range $no,$rpc := .unaryCalls }}
 public static {{$rpc.MethodName}}(req:{{$rpc.InputType}},callOpt?:TCallOption):Error | null{
	let w:Writer={{$rpc.InputType}}.encode(req)
	let reqData=w.finish()
	
	let api='{{$rpc.Api}}'
	const v={{$rpc.Version}}

	return rpcCon.UnaryCall(reqData,api,v,{{$rpc.OutputType}},callOpt)
	
}
{{ end }}

{{ range $no,$rpc := .clientStreamCalls }}
 public static {{$rpc.MethodName}}(req:{{$rpc.InputType}},callOpt?:TCallOption):TRpcStream{
	let api='{{$rpc.Api}}'
	const v={{$rpc.Version}}
	
	let r=new TRpcStream(api,v,{{$rpc.OutputType}},callOpt)
	
	r.sendFirst(req)

	return r
}
{{ end }}

{{ range $no,$rpc := .serverStreamCalls }}
 public static {{$rpc.MethodName}}(req:{{$rpc.InputType}},callOpt?:TCallOption):TRpcStream{
	let api='{{$rpc.Api}}'
	const v={{$rpc.Version}}
	let r=new TRpcStream(api,v,{{$rpc.OutputType}},callOpt)

	r.sendFirst(req)

	return r
}
{{ end }}

{{ range $no,$rpc := .bidiStreamCalls }}
 public static {{$rpc.MethodName}}(req:{{$rpc.InputType}},callOpt?:TCallOption):TRpcStream{
	let api='{{$rpc.Api}}'
	const v={{$rpc.Version}}
	let r=new TRpcStream(api,v,{{$rpc.OutputType}},callOpt)

	r.sendFirst(req)

	return r
}
{{ end }}

}
`
