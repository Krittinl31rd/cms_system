let ws=null;

function setWebSocket(client) {
    ws=client;
}

function sendToWebSocketServer(data) {
    if (ws&&ws.readyState==1) {
        ws.send(typeof data=='string'? data:JSON.stringify(data));
    } else {
        console.warn('WebSocket not open:', data);
    }
}

module.exports={
    setWebSocket,
    sendToWebSocketServer
};
