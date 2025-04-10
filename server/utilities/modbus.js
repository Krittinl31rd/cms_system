const ModbusRTU=require('modbus-serial');

let lastData={};

exports.PoolModbusData=async (client, totalRegisters, chunkSize, wsClients, ip) => {
    try {
        const newData=await exports.ReadAllRegisters(client, totalRegisters, chunkSize);

        if (!lastData[ip]) {
            lastData[ip]=new Array(totalRegisters).fill(null);
        }

        const changedData=newData.reduce((changes, value, index) => {
            if (lastData[ip][index]!==value) {
                changes.push({ address: index, value });
            }
            return changes;
        }, []);

        if (changedData.length>0) {
            // console.log(`Changed data for ${ip}:`, changedData);
            lastData[ip]=[...newData];

            wsClients.forEach(client => {
                if (client.isLogin==true&&client.updated==true) {
                    // if (client.isLogin && client.ip==ip) {
                    client.socket.send(JSON.stringify({
                        cmd: 'data_update',
                        param: { status: 'success', data: changedData, ip }
                    }));
                }
            });
        }
    } catch (error) {
        console.error("Error during polling:", error);
    }
};

exports.ConnectModbus=async (client, IP, port) => {
    try {
        await client.connectTCP(IP, { port });
        client.setID(1);
        console.log(`Connected to Modbus device at ${IP}:${port}`);
    } catch (error) {
        console.error("Failed to connect to Modbus:", error);
    }
};

exports.ReadAllRegisters=async (client, totalRegisters, chunkSize, ip=null) => {
    let allData=[];
    try {

        if (!client.isOpen) {
            throw new Error("Modbus connection is not open.");
        }

        for (let i=0; i<totalRegisters; i+=chunkSize) {
            const length=Math.min(chunkSize, totalRegisters-i);

            const data=await client.readHoldingRegisters(i, length);

            if (!data||!data.data||data.data.length<length) {
                throw new Error(`Failed to read complete data at address ${i}`);
            }

            allData.push(...data.data);
        }

        return allData;
    } catch (error) {
        console.error(`Error reading Modbus registers from ${ip}:`, error.message);
        throw error;
    }
};


