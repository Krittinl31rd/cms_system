const ModbusRTU=require('modbus-serial');
const { addPollInterval, removePollInterval, getPollIntervals }=require('./pollInterval');
const { addToQueue, getNextFromQueue, hasQueue }=require('../poller/queue');

const MODBUS_TOTAL_REGISTERS=90;
const MODBUS_CHUNK_SIZE=125;
const cache={};

async function connectAndPoll(ip, port, onChangeCallback) {
    const client=new ModbusRTU();

    try {
        await client.connectTCP(ip, { port });
        console.log(`Connected to ${ip}:${port}`);
        const interval=setInterval(() => handlePolling(client, ip, port, onChangeCallback), 1000);
        addPollInterval({ ip, port, client, pollInterval: interval });
    } catch (err) {
        console.error(`Failed to connect to ${ip}:${port}`, err.message);
        setTimeout(() => connectAndPoll(ip, port, onChangeCallback), 5000);
    }
}

async function handlePolling(client, ip, port, onChangeCallback) {
    try {
        if (!client.isOpen) {
            return reconnectClient(ip, port, onChangeCallback);
        }

        if (hasQueue(ip)) {
            const task=getNextFromQueue(ip);
            try {
                client.setID(task.slaveId);
                await client.writeRegister(task.address, task.value);
                console.log(`Write success to ${ip}: ${task.address} = ${task.value}`);
            } catch (err) {
                console.error(`Write failed on ${ip}:`, err.message);
            }
        }

        const changedData=await PoolModbusData(client, MODBUS_TOTAL_REGISTERS, MODBUS_CHUNK_SIZE, ip);
        if (changedData&&changedData.length>0) {
            onChangeCallback(ip, changedData);
        }
    } catch (err) {
        console.error(`Polling error on ${ip}:`, err.message);
        await reconnectClient(ip, port, onChangeCallback);
    }
}

async function reconnectClient(ip, port, onChangeCallback) {
    const existing=getPollIntervals().find(e => e.ip===ip&&e.port===port);
    if (existing) {
        clearInterval(existing.pollInterval);
        try {
            if (existing.client.isOpen) await existing.client.close();
        } catch { }
        removePollInterval(ip, port);
    }
    setTimeout(() => connectAndPoll(ip, port, onChangeCallback), 5000);
}

async function PoolModbusData(client, totalRegisters, chunkSize, ip) {
    const newData=[];
    const prevData=cache[ip]||{};

    for (let start=0; start<totalRegisters; start+=chunkSize) {
        const length=Math.min(chunkSize, totalRegisters-start);
        try {
            const res=await client.readHoldingRegisters(start, length);
            for (let i=0; i<res.data.length; i++) {
                const address=start+i;
                const value=res.data[i];

                if (prevData[address]!==value) {
                    newData.push({ address, value });
                    prevData[address]=value; // update cache
                }
            }
        } catch (err) {
            console.error(`Read error on ${ip} at ${start}-${start+length-1}:`, err.message);
            return null;
        }
    }

    cache[ip]=prevData;
    return newData;
}



module.exports={
    connectAndPoll,
    reconnectClient
};
