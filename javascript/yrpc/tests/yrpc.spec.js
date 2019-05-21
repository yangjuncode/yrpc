const ws = new WebSocket("ws://localhost:8000/ws")
ws.onopen = () => {
  console.log('ws onopen')
}
ws.onclose = (e) => {
  console.warn('ws onclose:', e)
}
ws.onmessage = ({data}) => {
  console.log('ws onmessage:', data)
  document.write(data + "\n")
}

