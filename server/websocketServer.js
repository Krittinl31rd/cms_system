const jwt=require("jsonwebtoken");
const WebSocket=require('ws');
const { v4: uuidv4 }=require('uuid');
const wss=new WebSocket.Server({ port: process.env.WS_PORT });
const wsClients=[];
const { updatedToDB, insertToDB }=require('./poller/db');
const { GatewayLogin }=require('./controllers/memberController');


wss.on('connection', (ws) => {
    console.log('Client connected');
    const infoClient={
        id: uuidv4(),
        socket: ws,
        lastTimestamp: Date.now(),
        isLogin: false,
        ip: null,
        member: null,
        updated: false
    };
    wsClients.push(infoClient);

    ws.on('message', async (message) => {
        // console.log(JSON.parse(message));
        try {
            const { cmd, param }=JSON.parse(message);

            if (cmd=='login_gateway') {
                const { username, password }=param;

                if (infoClient.isLogin) {
                    return ws.send(JSON.stringify({
                        cmd: 'login',
                        param: { status: 'success', message: 'Already logged in' }
                    }));
                }

                try {
                    const { token }=await GatewayLogin(username, password);
                    const decoded=await jwt.verify(token, process.env.JWT_SECRET)
                    infoClient.isLogin=true;
                    infoClient.member=decoded;
                    console.log(`Client ${infoClient.id} login success`);
                    ws.send(JSON.stringify({
                        cmd: 'login',
                        param: { status: 'success', message: 'Login successful', clientId: infoClient.id }
                    }));
                    return;
                } catch (err) {
                    ws.send(JSON.stringify({
                        cmd: 'login_gateway',
                        param: {
                            status: 'error',
                            message: err.message
                        }
                    }));
                }
            }

            if (cmd=='login') {
                const { token }=param;

                if (infoClient.isLogin) {
                    return ws.send(JSON.stringify({
                        cmd: 'login',
                        param: { status: 'success', message: 'Already logged in' }
                    }));
                }
                try {
                    const decoded=await jwt.verify(token, process.env.JWT_SECRET)
                    infoClient.isLogin=true;
                    infoClient.member=decoded;
                    console.log(`Client ${infoClient.id} login success`);
                    ws.send(JSON.stringify({
                        cmd: 'login',
                        param: { status: 'success', message: 'Login successful', clientId: infoClient.id }
                    }));
                    setTimeout(() => {
                        const wsModbusClient=wsClients.find(client => client.member.role=='gateway');
                        if (wsModbusClient!=undefined) {
                            wsModbusClient.socket.send(JSON.stringify({
                                cmd: 'modbus_status',
                                param: {}
                            }));
                        }
                    }, 500);
                    return;
                } catch (err) {
                    console.log(`Client ${infoClient.id} login failed: ${err.message}`);
                    return ws.send(JSON.stringify({
                        cmd: 'login',
                        param: { status: 'error', message: 'Invalid token' }
                    }));
                }
            }

            if (infoClient.isLogin==false) {
                return ws.send(JSON.stringify({
                    cmd: 'login',
                    param: { status: 'error', message: 'Unauthorized. Please login first.' }
                }));
            }

            if (cmd=='modbus_status') {
                console.log(`Modbus Status from ${param.ip}: ${param.status}`);
                broadcastToLoggedInClients(JSON.stringify({
                    cmd: 'modbus_status',
                    param
                }));
                return;
            }

            if(cmd=='data_init') {
                const { ip, data: changedData }=param;
                updatedToDB(ip, changedData);
            }

            if (cmd=='data_update') {
                const { ip, data: changedData, source }=param;
                console.log(`Data from ${ip} by ${source}:`, changedData);
                insertToDB(ip, changedData, source);
                broadcastToLoggedInClients(JSON.stringify({
                    cmd: 'forward_update',
                    param: { ip, data: changedData }
                }));
                return;
            }

            if (cmd=='write_register') {
                const wsModbusClient=wsClients.find(client => client.member.role=='gateway');
                if (wsModbusClient==undefined) {
                    return ws.send(JSON.stringify({
                        cmd: 'write_register',
                        param: { status: 'error', message: 'Modbus client not connected' }
                    }));
                }
                wsModbusClient.socket.send(JSON.stringify({
                    cmd: 'write_register',
                    param: {
                        ip: param.ip, address: param.address, value: param.value, slaveId: param.slaveId, fc: param.fc, memberId: infoClient.member.id
                    }
                }));
                console.log(`Send Write to ModbusClient: `, param);
                return;
            }

            if (cmd=='test_write_register') {
                const wsModbusClient=wsClients.find(client => client.member.role==='gateway');
                if (!wsModbusClient) {
                    return ws.send(JSON.stringify({
                        cmd: 'test_write_register',
                        param: { status: 'error', message: 'Modbus client not connected' }
                    }));
                }
                (async () => {
                    for (let i=0; i<param.count; i++) {
                        const value=i%2;
                        const newParam={ ip: param.ip, value: value, slaveId: param.slaveId, address: param.address };
                        wsModbusClient.socket.send(JSON.stringify({
                            cmd: 'write_register',
                            param: newParam
                        }));

                        console.log(`Send Write to ModbusClient: `, param);
                        await delay(1000);
                    }
                })();
                return;
            }




        } catch (err) {
            console.error("Error processing message:", err);
            ws.send(JSON.stringify({
                cmd: 'error',
                param: { status: 'error', message: 'Invalid message format' }
            }));
        }
    });

    ws.on('close', () => {
        console.log(`Client ${infoClient.id} disconnected`);
        const index=wsClients.findIndex((client) => client.id===infoClient.id);
        if (index!==-1) {
            wsClients.splice(index, 1);
        }
    });
});

function broadcastToLoggedInClients(message) {
    wsClients.forEach(client => {
        if (client.isLogin&&client.member.role!='gateway'&&client.socket.readyState===WebSocket.OPEN) {
            client.socket.send(message);
        }
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports={ wss, wsClients };





