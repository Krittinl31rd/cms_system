const ModbusRTU=require('modbus-serial');
const sequelize=require('../config/db');

let lastSavedTimes={};
let lastData={};
let count=0

exports.PoolModbusData=async (client, totalRegisters, chunkSize, wsClients, ip) => {
    try {
        const newData=await exports.ReadAllRegisters(client, totalRegisters, chunkSize);

        if (!lastData[ip]) {
            lastData[ip]=new Array(totalRegisters).fill(null);
        }

        const changedData=newData.reduce((changes, value, index) => {
            if (lastData[ip][index]!==value&&
                ![29, 91, 88, 89, 90, 50, 51, 52, 53, 54, 55].includes(index)
            ) {
                changes.push({ address: index, value });
            }
            return changes;
        }, []);

        if (changedData.length>0) {
            // console.log(`Changed data for ${ip}:`, changedData);
            lastData[ip]=[...newData];


            await updatedToDB(ip, changedData);
            await saveToDB(ip, changedData);

            wsClients.forEach(client => {
                if (client.isLogin==true&&client.updated==true&&client.member.role=='admin') {
                    // if (client.isLogin && client.ip==ip) {
                    client.socket.send(JSON.stringify({
                        cmd: 'data_update',
                        param: { status: 'success', data: changedData, ip }
                    }));
                }
            });
            count++
        }
    } catch (error) {
        console.error("Error during polling:", error);
    }
};

exports.ConnectModbus=async (client, IP, port) => {
    try {
        await client.connectTCP(IP, { port });
        client.setID(1);
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


const updatedToDB=async (ip_address, data) => {
    // console.log({ ip_address, data });
    try {
        const rooms=await sequelize.query(
            `SELECT * FROM rooms WHERE ip_address = :ip_address`,
            {
                replacements: { ip_address },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        if (rooms.length>0) {
            await Promise.all(data.map(async (item) => {
                const result=await sequelize.query(
                    `SELECT holding_address FROM attributes
                        WHERE room_id = :room_id AND holding_address = :holding_address`,
                    {
                        replacements: { room_id: rooms[0].room_id, holding_address: item.address },
                        type: sequelize.QueryTypes.SELECT,
                    }
                );

                if (count==0) {
                    if (result.length>0) {
                        await sequelize.query(
                            `UPDATE attributes SET value = :value WHERE holding_address = :holding_address`,
                            {
                                replacements: { value: item.value, holding_address: item.address },
                                type: sequelize.QueryTypes.UPDATE,
                            }
                        );
                        console.log(`DB: Updated attribute with holding_address ${item.address} at room_id ${rooms[0].room_id}`);
                    }
                } else {
                    if (result.length>0&&
                        ![60, 61, 62, 63, 64, 65, 70, 71, 49, 50, 51, 52, 53, 54, 55].includes(result[0].holding_address)
                    ) {
                        await sequelize.query(
                            `UPDATE attributes SET value = :value WHERE holding_address = :holding_address`,
                            {
                                replacements: { value: item.value, holding_address: item.address },
                                type: sequelize.QueryTypes.UPDATE,
                            }
                        );
                        console.log(`DB: Updated attribute with holding_address ${item.address} at room_id ${rooms[0].room_id}`);
                    }
                }

            }));

        }

    } catch (err) {
        console.log(err);
    }
}

const saveToDB=async (ip_address, data) => {
    try {
        const rooms=await sequelize.query(
            `SELECT * FROM rooms WHERE ip_address = :ip_address`,
            {
                replacements: { ip_address },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        if (rooms.length>0) {
            await Promise.all(data.map(async (item) => {
                const result=await sequelize.query(
                    `SELECT device_id, attr_id FROM attributes
                        WHERE room_id = :room_id AND holding_address = :holding_address`,
                    {
                        replacements: { room_id: rooms[0].room_id, holding_address: item.address },
                        type: sequelize.QueryTypes.SELECT,
                    }
                );

                if (count!=0) {
                    if (result.length>0) {
                        if ([60, 61, 62, 63, 64, 65, 70, 71].includes(item.address)) {
                            const currentTime=Date.now();
                            const lastSavedTime=lastSavedTimes[item.address]||0;

                            if (currentTime-lastSavedTime>=600000) {
                                if (result.length>0) {
                                    await sequelize.query(
                                        `INSERT INTO device_control_log (room_id, device_id, attr_id, value)
                                  VALUES (:room_id, :device_id, :attr_id, :value)`,
                                        {
                                            replacements: {
                                                room_id: rooms[0].room_id,
                                                device_id: result[0].device_id,
                                                attr_id: result[0].attr_id,
                                                value: item.value,
                                            },
                                            type: sequelize.QueryTypes.INSERT,
                                        }
                                    );
                                    console.log(`DB: INSERT attribute with holding_address ${item.address} at room_id ${rooms[0].room_id}`);

                                    lastSavedTimes[item.address]=currentTime;
                                }
                            }
                        } else {
                            if (result.length>0&&![49, 50, 51, 52, 53, 54, 55].includes(item.address)) {
                                await sequelize.query(
                                    `INSERT INTO device_control_log (room_id, device_id, attr_id, value)
                              VALUES (:room_id, :device_id, :attr_id, :value)`,
                                    {
                                        replacements: {
                                            room_id: rooms[0].room_id,
                                            device_id: result[0].device_id,
                                            attr_id: result[0].attr_id,
                                            value: item.value,
                                        },
                                        type: sequelize.QueryTypes.INSERT,
                                    }
                                );
                                console.log(`DB: INSERT attribute with holding_address ${item.address} at room_id ${rooms[0].room_id}`);
                            }
                        }
                    }
                }

            }));

        }

    } catch (err) {
        console.log(err);
    }
}




