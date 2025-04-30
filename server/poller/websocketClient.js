const WebSocket=require('ws');
const { connectAndPoll }=require('../poller/modbusPoller');
const { addToQueue }=require('../poller/queue');

function createWebSocketClient(serverHost, serverPort, modbusIPs) {
    const ws=new WebSocket(`ws://${serverHost}:${serverPort}`);

    ws.on('open', () => {
        console.log('Connected to WebSocket server');
        ws.send(JSON.stringify({ cmd: 'login', param: { isModbusClient: true } }));
    });

    ws.on('message', async (msg) => {
        const data=JSON.parse(msg);
        if (data.cmd==='login'&&data.param.status==='success') {
            for (const { ip, port } of modbusIPs) {
                connectAndPoll(ip, port, (ip, data) => {
                    ws.send(JSON.stringify({ cmd: 'data_update', param: { ip, data } }));
                });
            }
        }

        if (data.cmd==='write_register') {
            const { ip, address, value, slaveId }=data.param;
            addToQueue(ip, { address, value, slaveId });
        }

        if (data.cmd=='write_register_test') {
            const { ip, address, value, slaveId, count }=data.param;
            for(let i=0; i<count; i++) {
                addToQueue(ip, { address: address+i, value, slaveId });
            }
            addToQueue(ip, { address, value, slaveId });
        }
    });

    ws.on('error', err => console.error('WebSocket error:', err.message));
}

module.exports={
    createWebSocketClient
};
