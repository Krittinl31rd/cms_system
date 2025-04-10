const jwt=require("jsonwebtoken");
const WebSocket=require('ws');
const { v4: uuidv4 }=require('uuid');
const ModbusRTU=require('modbus-serial');
const { ConnectModbus, PoolModbusData, ReadAllRegisters }=require('./utilities/modbus.js');
const wss=new WebSocket.Server({ port: process.env.WS_PORT });
const wsClients=[];
const MODBUS_TCP_IPS=[
    // { ip: '58.136.161.55', port: 502 },
    { ip: '192.168.1.66', port: 502 },
];
const MODBUS_SLAVE_ID=1;
const MODBUS_TOTAL_REGISTERS=90;
const MODBUS_CHUNK_SIZE=125;

let pollIntervals=[];

async function startPolling() {
    try {
        // Connect to multiple Modbus servers
        for (let { ip, port } of MODBUS_TCP_IPS) {
            const client=new ModbusRTU();
            await ConnectModbus(client, ip, port);
            // console.log(`Connected to Modbus server at ${ip}:${port}`);

            // Start polling for each server
            const pollInterval=setInterval(() => pollModbusData(client, ip), 1000);
            pollIntervals.push({ ip, pollInterval, client });
        }
    } catch (error) {
        console.error('Failed to connect to Modbus server:', error);
        setTimeout(startPolling, 5000);
    }
}

function stopPolling() {
    pollIntervals.forEach(({ pollInterval, client }) => {
        clearInterval(pollInterval);
        console.log(`Polling stopped for server ${client._host}`);
    });
    pollIntervals=[];
}

async function pollModbusData(client, ip) {
    try {
        if (!client.isOpen) {
            console.log(`Modbus connection to ${ip} is not open, skipping polling...`);
            return;
        }
        await PoolModbusData(client, MODBUS_TOTAL_REGISTERS, MODBUS_CHUNK_SIZE, wsClients, ip);
    } catch (error) {
        console.error(`Error during polling for ${ip}:`, error);
        stopPolling();
    }
}

startPolling();

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
        try {
            const { cmd, param }=JSON.parse(message);
            // infoClient.lastTimestamp=Date.now();

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

                    setTimeout(async () => {
                        try {
                            console.log(`Client ${infoClient.id}  getalldata`);
                            infoClient.updated=true
                            const allResults=[];
                            for (const server of pollIntervals) {
                                const modbusClient=server.client;
                                if (modbusClient&&modbusClient.isOpen) {

                                    const allData=await ReadAllRegisters(modbusClient, MODBUS_TOTAL_REGISTERS, MODBUS_CHUNK_SIZE);

                                    allResults.push({
                                        ip: server.ip,
                                        data: allData,
                                    });
                                } else {
                                    allResults.push({
                                        ip: server.ip,
                                        data: [],
                                        error: `Modbus client not open or found for IP: ${server.ip}`,
                                    });
                                }
                            }
                            ws.send(JSON.stringify({
                                cmd: 'getalldata',
                                param: { status: 'success', data: allResults }
                            }));
                        } catch (error) {
                            infoClient.updated=false
                            ws.send(JSON.stringify({
                                cmd: 'getalldata',
                                param: { status: 'error', message: error.message }
                            }));
                        }
                    }, 500)


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

            if (cmd=='getdata') {
                try {
                    const { ip }=param;
                    infoClient.ip=ip;
                    const modbusClient=pollIntervals.find(server => server.ip===infoClient.ip)?.client;
                    if (modbusClient) {
                        const allData=await ReadAllRegisters(modbusClient, MODBUS_TOTAL_REGISTERS, MODBUS_CHUNK_SIZE, infoClient.ip);

                        ws.send(JSON.stringify({
                            cmd: 'getdata',
                            param: { status: 'success', data: allData }
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            cmd: 'getdata',
                            param: { status: 'error', message: `Modbus client not found for IP: ${infoClient.ip}` }
                        }));
                    }
                } catch (error) {
                    ws.send(JSON.stringify({
                        cmd: 'getdata',
                        param: { status: 'error', message: error.message }
                    }));
                }
                return;
            }


            if (cmd=='modbus_write') {
                try {
                    const { address, value, slaveId, ip }=param;
                    const modbusClient=pollIntervals.find(server => server.ip==ip)?.client;
                    if (modbusClient) {
                        modbusClient.setID(slaveId);
                        await modbusClient.writeRegister(address, value);
                        ws.send(JSON.stringify({
                            cmd: 'modbus_write',
                            param: { status: 'success', message: 'Write successful' }
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            cmd: 'modbus_write',
                            param: { status: 'error', message: 'Modbus client not found for this IP' }
                        }));
                    }
                } catch (error) {
                    ws.send(JSON.stringify({
                        cmd: 'modbus_write',
                        param: { status: 'error', message: error.message }
                    }));
                }
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


// setInterval(() => {
//     const now=Date.now();
//     wsClients.forEach((client) => {
//         if (client.isLogin==false&&now-client.lastTimestamp>30000) {
//             console.log(`Inactive client ${client.id} removed due to no login activity`);
//             client.socket.send(JSON.stringify({ status: 'error', message: 'Timeout due to inactivity' }));
//             client.socket.close();

//             const index=wsClients.findIndex((c) => c.id===client.id);
//             if (index!==-1) {
//                 wsClients.splice(index, 1);
//             }
//         }
//     });
// }, 5000);


async function sendAllData(ws) {
    try {
        const allResults=[];

        for (const server of pollIntervals) {
            const modbusClient=server.client;
            if (modbusClient&&modbusClient.isOpen) {
                const allData=await ReadAllRegisters(modbusClient, MODBUS_TOTAL_REGISTERS, MODBUS_CHUNK_SIZE);
                allResults.push({ ip: server.ip, data: allData });
            } else {
                allResults.push({
                    ip: server.ip,
                    data: null,
                    error: `Modbus client not open for IP: ${server.ip}`,
                });
            }
        }

        ws.send(JSON.stringify({
            cmd: 'getalldata',
            param: { status: 'success', data: allResults }
        }));

    } catch (error) {
        ws.send(JSON.stringify({
            cmd: 'getalldata',
            param: { status: 'error', message: error.message }
        }));
    }
}

module.exports={ wss, wsClients };