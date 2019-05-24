package yrpcgen

var tmpJsRpcClass = `
{{$className := .className}}
{{$srvVersion := .srvVersion}}
export class {{$className}} {
public static readonly ver={{$srvVersion}}
{{ range $no,$rpc := .unaryNocareCalls }}
 public static {{$rpc.MethodName}}(req:{{$rpc.InputTypeInterface}}):void{
	let w:Writer={{$rpc.InputType}}.encode(req)
	let reqData=w.finish()
	rpcCon.NocareCall(reqData,'{{$rpc.Api}}',{{$rpc.Version}})
	
}
{{ end }}

{{ range $no,$rpc := .unaryCalls }}
 public static {{$rpc.MethodName}}(req:{{$rpc.InputTypeInterface}},callOpt?:TCallOption):void{
	let w:Writer={{$rpc.InputType}}.encode(req)
	let reqData=w.finish()
	rpcCon.UnaryCall(reqData,'{{$rpc.Api}}',{{$rpc.Version}},{{$rpc.OutputType}},callOpt)
	
}
{{ end }}

{{ range $no,$rpc := .clientStreamCalls }}
 public static {{$rpc.MethodName}}(req:{{$rpc.InputTypeInterface}},callOpt?:TCallOption):TRpcStream{
	let r=new TRpcStream('{{$rpc.Api}}',{{$rpc.Version}},{{$rpc.OutputType}},3,callOpt)
	r.sendFirst(req)
	return r
}
{{ end }}

{{ range $no,$rpc := .serverStreamCalls }}
 public static {{$rpc.MethodName}}(req:{{$rpc.InputTypeInterface}},callOpt?:TCallOption):TRpcStream{
	let r=new TRpcStream('{{$rpc.Api}}',{{$rpc.Version}},{{$rpc.OutputType}},7,callOpt)
	r.sendFirst(req)
	return r
}
{{ end }}

{{ range $no,$rpc := .bidiStreamCalls }}
 public static {{$rpc.MethodName}}(req:{{$rpc.InputTypeInterface}},callOpt?:TCallOption):TRpcStream{
	let r=new TRpcStream('{{$rpc.Api}}',{{$rpc.Version}},{{$rpc.OutputType}},8,callOpt)
	r.sendFirst(req)
	return r
}
{{ end }}

}
`
