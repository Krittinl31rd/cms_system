const jwt=require("jsonwebtoken");
const WebSocket=require('ws');
const { v4: uuidv4 }=require('uuid');
const ModbusRTU=require('modbus-serial');
const { ConnectModbus, PoolModbusData, ReadAllRegisters }=require('./utilities/modbus.js');
const wss=new WebSocket.Server({ port: process.env.WS_PORT });
const wsClients=[];
const MODBUS_TCP_IPS=[
    // { ip: '58.136.212.5', port: 502 },
    { ip: '192.168.1.66', port: 502 },
];
// 58.136.212.55
const MODBUS_SLAVE_ID=1;
const MODBUS_TOTAL_REGISTERS=90;
const MODBUS_CHUNK_SIZE=125;

const { addPollInterval, removePollInterval, getPollIntervals }=require('./utilities/pollInterval.js');

function broadcastStatusUpdate(ip, status) {
    wsClients.forEach(client => {
        if (client.isLogin==true) {
            client.socket.send(JSON.stringify({
                cmd: 'isOnline',
                param: { ip_address: ip, isOnline: status }
            }));
        }
    });
}

async function startPolling() {
    try {
        for (let { ip, port } of MODBUS_TCP_IPS) {
            await setupPollingClient(ip, port);
        }
    } catch (error) {
        console.error('Initial Modbus connection failed:', error);
        setTimeout(startPolling, 5000); // Retry after 5 seconds
    }
}
async function setupPollingClient(ip, port) {
    const client=new ModbusRTU();
    try {
        await ConnectModbus(client, ip, port);

        broadcastStatusUpdate(ip, true);

        const pollInterval=setInterval(() => pollModbusData(client, ip, port), 1000);
        // pollIntervals.push({ ip, port, pollInterval, client });
        addPollInterval({ ip, port, pollInterval, client })
        //// Successful connection, start polling
        // const pollInterval=setInterval(() => pollModbusData(client, ip, port), 1000);
        // pollIntervals.push({ ip, port, pollInterval, client});

        // // Initially mark as online
        // const entry={ ip, port, pollInterval: null, client, isOnline: true };
        // pollIntervals.push(entry);

        // // Start polling
        // const pollInterval=setInterval(() => pollModbusData(entry), 1000);
        // entry.pollInterval=pollInterval;
    } catch (err) {
        console.error(`Failed to connect to ${ip}:${port}, retrying in 5 seconds...`);
        setTimeout(() => setupPollingClient(ip, port), 5000);
    }
}

async function pollModbusData(client, ip, port) {
    try {
        if (!client.isOpen) {
            console.warn(`Modbus connection to ${ip} is closed. Reconnecting...`);
            broadcastStatusUpdate(ip, false);
            await reconnectModbusClient(ip, port);
            return;
        }

        await PoolModbusData(client, MODBUS_TOTAL_REGISTERS, MODBUS_CHUNK_SIZE, wsClients, ip);
    } catch (error) {
        console.error(`Polling error on ${ip}:`, error);
        broadcastStatusUpdate(ip, false);
        await reconnectModbusClient(ip, port);
    }
}




async function reconnectModbusClient(ip, port) {
    const entry=getPollIntervals().find(item => item.ip===ip&&item.port===port);
    if (entry) {
        // Clear the existing polling interval
        clearInterval(entry.pollInterval);
        try {
            if (entry.client.isOpen) {
                await entry.client.close(); // Close the Modbus client connection
            }
        } catch (e) {
            console.warn(`Failed to close client for ${ip}:${port}:`, e.message);
        }
        // pollIntervals=pollIntervals.filter(item => item.ip!==ip||item.port!==port);
        removePollInterval(ip, port)
    }
    console.log(`Reconnecting to ${ip}:${port} in 5 seconds...`);
    setTimeout(() => setupPollingClient(ip, port), 5000);
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
        // console.log(JSON.parse(message));
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

                            getPollIntervals().forEach(({ ip }) => {
                                ws.send(JSON.stringify({
                                    cmd: 'isOnline',
                                    param: { ip_address: ip, isOnline: true }
                                }));
                            });

                            console.log(`Client ${infoClient.id}  getalldata`);
                            infoClient.updated=true
                            const allResults=[];
                            for (const server of getPollIntervals()) {
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
                    const modbusClient=getPollIntervals().find(server => server.ip===infoClient.ip)?.client;
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
                    const modbusClient=getPollIntervals().find(server => server.ip==ip)?.client;
                    if (modbusClient) {
                        modbusClient.setID(slaveId);
                        await modbusClient.writeRegister(address, value);
                        console.log({ address, value, slaveId, ip })
                        ws.send(JSON.stringify({
                            cmd: 'modbus_write',
                            param: { status: 'success', message: 'Write successful' }
                        }));
                        // console.log({ status: 'success', param })
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

        for (const server of getPollIntervals()) {
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