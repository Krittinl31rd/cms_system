const WebSocket=require('ws');
const { connectAndPoll }=require('./modbusPoller');
const { addToQueue }=require('./queue');
const { setWebSocket, sendToWebSocketServer }=require('./websocketHelper');
const { getAllModbusStatuses }=require('./modbusStatus');

function createWebSocketClient(serverHost, modbusIPs) {
    const ws=new WebSocket(serverHost);
    setWebSocket(ws);

    ws.on('open', () => {
        console.log('Connected to WebSocket server');
        sendToWebSocketServer({
            cmd: 'login_gateway',
            param: {
                username: "gateway101",
                password: "123456789"
            }
        });
    });

    ws.on('message', async (msg) => {
        const data=JSON.parse(msg);
        if (data.cmd=='login'&&data.param.status=='success') {
            for (const { ip, port } of modbusIPs) {
                connectAndPoll(ip, port, (ip, data, source) => {
                    sendToWebSocketServer({ cmd: 'data_update', param: { ip, data, source } });
                });
            }
        }

        if (data.cmd=='modbus_status') {
            sendToWebSocketServer({ cmd: 'modbus_status', param: { data: getAllModbusStatuses() } });
        }

        if (data.cmd=='write_register') {
            const { ip, address, value, slaveId, memberId }=data.param;
            const source=memberId||0;
            addToQueue(ip, { address, value, slaveId, source });
        }


    });

    ws.on('error', err => console.error('WebSocket error:', err.message));
}

module.exports={
    createWebSocketClient,
};
