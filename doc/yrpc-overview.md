# yrpc 概述



## 缘起

- grpc目前是比较通用的rpc实现,其语法实现很贴合实际交互需要,虽然性能有所损失,但是作为基于protobuf跨语言的rpc,目前还没有比它更好的了
- grpc-web的实现目前还是不够好用,特别对于双向流支持极其不足,或者要求太高,其实现没有使用protobuf.js,这对于用习惯了protobuf.js的人感觉不太适应
- 除了web端的实现外,还有简单地C++版本,适用于嵌入式使用,在里面无法使用当前的grpc c/c++实现,毕竟当前官方的实现过于复杂
- 后端的grpc实现已经很丰富了,只需要给前端(web/embedded)一个简单地代理,它们也就能使用上grpc



## yrpc实现

- 制订一个相对简单地协议,把yrpc实现为grpc的前端代理
- 采用和grpc同样的语法,同样的语义,单次调用,流式调用等
- 增加消息系统的api(nats,pulsar), 给系统的交互增加方便
- 通信通道多样化,tcp/udp/websocket/webrtc/kcp/ycp等,看实际的需要
- yrpc的协议采用protobuf描述



## 协议说明

 yrpc作为grpc的代理,使用的语法当然是protobuf的语法,以下为例子:

```protobuf
// The demo service definition.
service demo {
  //service version
  option (yrpc).ver="1.2";
  // 单次调用
  rpc SayHello (Request) returns (Reply) {}
  //Ynocare调用
  rpc SayHelloNocare (Request) returns (yrpc.Ynocare) {}
  // 客户端流
  rpc SayHelloCliStream (stream Request) returns (Reply) {}
  // 服务端流
  rpc SayHelloServStream (Request) returns (stream Reply) {}
  //双向流
  rpc SayHelloBidiStream (stream Request) returns (stream Reply) {}
  
}

// The request message containing the user's name.
message Request {
  string name = 1;
}

// The response message containing the greetings
message Reply {
  string message = 1;
}
```



yrpc的底层数据包格式如下:

```protobuf
syntax = "proto3";
package yrpc;

option optimize_for = LITE_RUNTIME;

//系统中所有的消息交互底层都以此为包装,这是yrpc中的最小交互数据包
message Ypacket {

  //整个yrpc packet的长度，不包含此字段
  //虽然这个长度可以很长，但是为了避免大包阻塞其它操作，通常都要限制长度,采用分包多发机制
  //当使用基于包的传输通道时(udp/kcp/websocket)，此值可能为0(此时长度为收到的整个包的长度)
  //当填写了值时,为proto编码的长度-5
  fixed32 len = 1;

  // rpc command,rpc的命令和option
  // b15-b0(uint16):为rpc命令
  // b17-b16:body压缩方式 0:无压缩 1:lz4 2:zlib inflate/deflate
  // b19-b18:optbin压缩方式 0:无压缩 1:lz4 2:zlib inflate/deflate
  // b31-b20: not used yet
  fixed32 cmd = 2;

  //rpc call id,给分辨不同的rpc调用使用,调用方增1循环使用
  uint32 cid=3;

  // rpc no,从0开始增1使用,用于区分收到重复的包,特别是udp的情况下
  // 每一个rpc 流式调用有其自己的序号流,从0开始
  uint32 no = 4;

  // response code
  sint32 res = 5;

  // packet body
  bytes body = 10;

  // optional str parameter,额外的信息,一般不会有,有些特殊命令里面可能用到
  string optstr = 11;

  // optional binary parameter,额外的信息,一般不会有,有些特殊命令里面可能用到
  bytes optbin = 12;
  
  //optional meta info,key=meta[i],value=meta[i+1]
  repeated string meta=13;
  
};
```



## yrpc交互流程



###  一次调用

  - Ypacket.cmd=1,
  - api版本放在Ypacket.meta里面key="ver", value="1.2",没有特定版本时不用放,有些api是不需要理会版本的
  - Ypacket.optstr=grpc.method签名(/pkg.service/method)
  - Ypacket.body=Request
  - Ypacket.no=0
  - Ypacket.cid为本次rpc调用的唯一标识
  - client端将上述数据打包后发送到服务器端
  - server端收到调用后进行处理,处理结果返回如下:
    - Ypacket.cid与调用者的相同
    - 正常流程
      - Ypacket.body=Reply
      - Ypacket.res=0
      - Ypacket.cmd=1
    - 出错流程
      - Ypacket.res!=0
      - Ypacket.ostr=err str
      - Ypacket.cmd=4
- 对于没有数据的参数或者返回值,使用Yempty

#### 返回值为Ynocare的单次调用

- ynocare表示只调用,不关注成功和结果,类似udp
- Ypacket.cmd=2
- 只有发送过程,没有回应
- 对于需要没有数据的回应不能使用Ynocare,应该使用Yempty



### 客户端流

- 按照一次调用先发送调用请求,Ypacket.cmd=3, Ypacket.no=0
- server收到3后,如果建立grpc成功,则回应cmd=3,Ypacket.body无内容,如果grpc不成功,回应cmd=4
- 从第二个数据包开始,Ypacket.cmd=5,Ypacket.ostr不需要填写method签名
- Ypacket.no以1开始标识cmd=5的包,cmd=5的第一个包为整个客户端流的第二个包
- server收到后回应收到调用数据
  - Ypacket.cmd=5
  - Ypacket.no=client发送的Ypacket.no
  - Ypacket.cid=client发送的cid
- client端发送完数据后发送结束命令Ypacket.cmd=6
- server端收到client.cmd=6后,先发送cmd=6确认收到包,然后结束相关调用接着发送结果数据
  - Ypacket.cmd=12
  - Ypacket.body=Reply
- client收到cmd=12时,需要回应收到数据包
  - Ypacket.cmd=12
  - Ypacket.cid跟第一次一样
  - Ypacket.no=server端的Ypacket.no
- server收到client对12的确认后发送最终回应
  - Ypacket.cmd=13
  - Ypacket.body=空


### 服务端流

- 按照一次调用先发送调用请求,Ypacket.cmd=7,Ypacket.body=Request
- server端收到调用后进行处理,如果建立grpc成功,返回Ypacket.cmd=7确认调用建立成功
- 如果有错误,则返回Ypacket.cmd=4
- 正常返回数据时
  - Ypacket.cmd=12
  - Ypacket.cid为调用时的值
  - Ypacket.no从0开始计数发送
  - Ypacket.body=Replay
- client收到cmd=12时,需要回应收到数据包
  - Ypacket.cmd=12
  - Ypacket.cid跟第一次一样
  - Ypacket.no=server端的Ypacket.no
- server端结束时发送命令Ypacket.cmd=13
  - Ypacket.body为空
- client发送cmd=13确认收到结束指令

### 双向流

- 按照一次调用先发送调用请求,Ypacket.cmd=8, server回应成功时Ypacket.cmd=8,不成功时回应cmd=4
- 从第二个数据包开始,Ypacket.cmd=5,Ypacket.ostr不需要填写method签名
- Ypacket.no以1开始标识cmd=5的包,cmd=5的第一个包为整个双向流的第二个包
- server收到后回应收到调用数据
  - Ypacket.cmd=5
  - Ypacket.no=client发送的Ypacket.no
  - Ypacket.cid=client发送的cid
  - Ypacket.optstr=server的nats sub uuid
- server端随时可以发送回应流
  - Ypacket.cmd=12
  - Ypacket.cid为调用时的值
  - Ypacket.no从0开始计数发送
  - Ypacket.body=Replay
- client收到server.cmd=12时,需要回应收到数据包
  - Ypacket.cmd=12
  - Ypacket.cid跟第一次一样
  - Ypacket.no=server端的Ypacket.no
- client端发送完数据后发送结束命令Ypacket.cmd=6,server端收到cmd=6后需要回应cmd=6表示收到结束调用,然后结束client stream send
- server端发送最终回应(可以在client发送结束命令cmd=6前发送)
  - Ypacket.cmd=13
  - Ypacket.body=为空
- client回应cmd=13通知server 收到调用结束包

### 取消rpc请求

- 对于流式调用,,发起调用后,任何时候client都可以取消请求
- Ypacket.cmd=4
- Ypacket.cid为调用时的值
- 后端收到取消请求后取消,然后返回取消成功 Ypacket.cmd=44
- 对于单次调用,后端无法取消,只能调用者自己取消掉回调处理,不再处理回调结果


### 双向Ping

- 双向ping用于确认对方是否还在线和保持心跳

- ping socket连接的对方: Ypacket.cmd=14 res=0

- pong: Ypacket.cmd=14 res=1 cid为原值

- ping: Ypacket.optstr="1"时为请求对方的时间,此时对方回应的Ypacket.body=UnixTime
  - ```protobuf
    message UnixTime {
      // Unix time, the number of miliseconds elapsed since January 1, 1970 UTC
      sint64 time_unix = 1;
      //utc time yyyy-MM-dd hh:mm:ss.zzz
      string time_str = 2;
    }
    ```




### 所有命令列表
| 上行命令 | 说明                              | 下行命令 |           |
| -------- | --------------------------------- | -------- | --------- |
| 1        | 单次调用                          | 1        | 调用成功  |
|          |                                   | 4        | 调用失败  |
| 2        | Nocare调用                        | 无       |           |
| 3        | 客户端流调用                      | 3        | 调用成功  |
|          |                                   | 4        | 调用失败  |
| 4        | 取消流rpc调用                     | 44       | 取消成功  |
| 5        | 客户端调用,后续的send             | 5        | 调用成功  |
|          |                                   | 4        | 调用失败  |
| 6        | 客户端流发送结束,closesendandrecv | 6        | 调用成功  |
|          |                                   | 4        | 调用失败  |
| 7        | 服务端流调用                      | 7        | 调用成功  |
|          |                                   | 4        | 调用失败  |
|          | 服务端数据回来                    | 12       | 服务端流  |
| 12       | 回应收到服务端流数据              |          |           |
|          | 服务端流结束                      | 13       |           |
| 13       | 回应服务端流结束                  |          |           |
| 8        | 双向流调用                        | 8        | 调用成功  |
|          |                                   | 4        | 调用失败  |
| 9        | nats publish                      | 9        | 调用成功  |
|          |                                   | 4        | 调用失败  |
| 10       | nats sub/unsub                    | 10       | 调用成功  |
|          |                                   | 4        | 调用失败  |
|          | got nats msg                      | 11       | 后端推送  |
| 14       | ping/pong server                  | 14       | keepalive |


