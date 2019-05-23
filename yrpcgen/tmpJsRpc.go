package yrpcgen

var tmpJsRpcClass = `
{{$className := .className}}
{{$srvVersion := .srvVersion}}
export class {{$className}} {
public static readonly ver={{$srvVersion}}
{{ range $no,$rpc := .unaryNocareCalls }}
 public static {{$rpc.MethodName}}(req:{{$rpc.InputType}}):void{
	let w:Writer={{$rpc.InputType}}.encode(req)
	let reqData=w.finish()
	
	let api='{{$rpc.Api}}'

	rpcCon.NocareCall(reqData,api,{{$rpc.Version}})
	
}
{{ end }}

{{ range $no,$rpc := .unaryCalls }}
 public static {{$rpc.MethodName}}(req:{{$rpc.InputType}},callOpt?:TCallOption):void{
	let w:Writer={{$rpc.InputType}}.encode(req)
	let reqData=w.finish()
	
	let api='{{$rpc.Api}}'

	rpcCon.UnaryCall(reqData,api,{{$rpc.Version}},{{$rpc.OutputType}},callOpt)
	
}
{{ end }}

{{ range $no,$rpc := .clientStreamCalls }}
 public static {{$rpc.MethodName}}(req:{{$rpc.InputType}},callOpt?:TCallOption):TRpcStream{
	let api='{{$rpc.Api}}'
	
	let r=new TRpcStream(api,{{$rpc.Version}},{{$rpc.OutputType}},callOpt)
	
	r.sendFirst(req)

	return r
}
{{ end }}

{{ range $no,$rpc := .serverStreamCalls }}
 public static {{$rpc.MethodName}}(req:{{$rpc.InputType}},callOpt?:TCallOption):TRpcStream{
	let api='{{$rpc.Api}}'
	let r=new TRpcStream(api,{{$rpc.Version}},{{$rpc.OutputType}},callOpt)

	r.sendFirst(req)

	return r
}
{{ end }}

{{ range $no,$rpc := .bidiStreamCalls }}
 public static {{$rpc.MethodName}}(req:{{$rpc.InputType}},callOpt?:TCallOption):TRpcStream{
	let api='{{$rpc.Api}}'
	let r=new TRpcStream(api,{{$rpc.Version}},{{$rpc.OutputType}},callOpt)

	r.sendFirst(req)

	return r
}
{{ end }}

}
`
