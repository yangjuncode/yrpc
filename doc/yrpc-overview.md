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

