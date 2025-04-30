const jwt=require("jsonwebtoken");
const WebSocket=require('ws');
const { v4: uuidv4 }=require('uuid');
const wss=new WebSocket.Server({ port: process.env.WS_PORT });
const wsClients=[];
const { updatedToDB }=require('./poller/db');

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
            // console.log(JSON.parse(message));
            // infoClient.lastTimestamp=Date.now();

            if (cmd=='login') {
                const { token, isModbusClient }=param;

                if (infoClient.isLogin) {
                    return ws.send(JSON.stringify({
                        cmd: 'login',
                        param: { status: 'success', message: 'Already logged in' }
                    }));
                }

                if (isModbusClient) {
                    infoClient.isLogin=true;
                    infoClient.member={ role: 'modbusClient' };
                    console.log(`Client ${infoClient.id} login success`);
                    ws.send(JSON.stringify({
                        cmd: 'login',
                        param: { status: 'success', }
                    }));
                    return;
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
                } catch (err) {
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

            if (cmd=='data_update') {
                const { ip, data: changedData }=param;
                console.log(`Data from ${ip}:`, changedData);
                // await updatedToDB(ip, changedData);
                broadcastToLoggedInClients(JSON.stringify({
                    cmd: 'forward_update',
                    param: { ip, data: changedData }
                }));
                return;
            }


            // if (cmd=='getdata') {
            //     try {
            //         const { ip }=param;
            //         infoClient.ip=ip;
            //         const modbusClient=getPollIntervals().find(server => server.ip===infoClient.ip)?.client;
            //         if (modbusClient) {
            //             const allData=await ReadAllRegisters(modbusClient, MODBUS_TOTAL_REGISTERS, MODBUS_CHUNK_SIZE, infoClient.ip);

            //             ws.send(JSON.stringify({
            //                 cmd: 'getdata',
            //                 param: { status: 'success', data: allData }
            //             }));
            //         } else {
            //             ws.send(JSON.stringify({
            //                 cmd: 'getdata',
            //                 param: { status: 'error', message: `Modbus client not found for IP: ${infoClient.ip}` }
            //             }));
            //         }
            //     } catch (error) {
            //         ws.send(JSON.stringify({
            //             cmd: 'getdata',
            //             param: { status: 'error', message: error.message }
            //         }));
            //     }
            //     return;
            // }

            if (cmd=='write_register') {
                const wsModbusClient=wsClients.find(client => client.member.role=='modbusClient');
                if (wsModbusClient==undefined) {
                    return ws.send(JSON.stringify({
                        cmd: 'write_register',
                        param: { status: 'error', message: 'Modbus client not connected' }
                    }));
                }
                wsModbusClient.socket.send(JSON.stringify({
                    cmd: 'write_register',
                    param
                }));
                console.log(`Send Write to ModbusClient: `, param);
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
        if (client.isLogin&&client.member.role!='modbusClient'&&client.socket.readyState===WebSocket.OPEN) {
            client.socket.send(message);
        }
    });
}

module.exports={ wss, wsClients };





