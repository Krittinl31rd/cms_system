const sequelize=require('../config/db')
const { getPollIntervals }=require('../utilities/pollInterval.js');


exports.GetStatus=async (req, res) => {
    try {
        const rooms=await sequelize.query(`SELECT * FROM rooms`, {
            type: sequelize.QueryTypes.SELECT
        });

        const roomList=await Promise.all(rooms.map(async (room) => {
            const devices=await sequelize.query(
                `SELECT d.device_id, d.name, d.device_type 
                 FROM devices d
                 WHERE d.room_id = :room_id`,
                {
                    replacements: { room_id: room.room_id },
                    type: sequelize.QueryTypes.SELECT,
                }
            );

            const result={
                room_id: room.room_id
            };

            for (const device of devices) {
                const attributes=await sequelize.query(
                    `SELECT attr.attr_id, attr.name, attr.value, attr.holding_address
                     FROM attributes attr
                     WHERE attr.device_id = :device_id AND attr.room_id = :room_id`,
                    {
                        replacements: { device_id: device.device_id, room_id: room.room_id },
                        type: sequelize.QueryTypes.SELECT,
                    }
                );

                if (device.device_type==4) { //light
                    const lightStatus=attributes.find(attr => attr.attr_id==1);
                    result[device.name]=lightStatus?.value==1? 'on':'off';
                } else if (device.device_type==0) { // roomservice
                    attributes.forEach((attr) => {
                        if (attr.attr_id==3) {
                            result[attr.name]=attr?.value==1? 'Occupied Dirty'
                                :attr?.value==2? 'Occupied Clean'
                                    :attr?.value==3? 'Unoccupied Clean'
                                        :attr?.value==4? 'Unoccupied Dirty'
                                            :false;
                        } else if (attr.attr_id==10) {
                            result[attr.name]=attr?.value;
                        } else {
                            result[attr.name]=attr?.value==1? true:false;
                        }
                    })
                } else if (device.device_type==1) { // air
                    const aircon={};
                    attributes.forEach((attr) => {
                        if (attr.attr_id==2) aircon.temperature=Number(attr.value);
                        if (attr.attr_id==1) aircon['fan-speed']=attr?.value==0? 'Off'
                            :attr?.value==1? 'Low'
                                :attr?.value==2? 'Medium'
                                    :attr?.value==3? 'High'
                                        :false;
                        if (attr.attr_id==3) aircon['room-temp']=Number(attr.value);
                        result[device.name]=aircon;
                    })
                } else if (device.device_type==3) { // dim
                    const dimStatus=attributes.find(attr => attr.attr_id==1);
                    result[device.name]=dimStatus?.value==0? 'off':dimStatus?.value;
                } else if (device.device_type==7) { //power con
                    const power={}
                    attributes.forEach((attr) => {
                        if (attr.attr_id==0) power[attr.name]=(attr.value/10).toFixed(2);
                        if (attr.attr_id==1) power[attr.name]=(attr.value/1000).toFixed(2);
                        if (attr.attr_id==2) power[attr.name]=(attr.value/10).toFixed(2);
                        if (attr.attr_id==3) power[attr.name]=(attr.value/100).toFixed(2);
                        if (attr.attr_id==4) power[attr.name]=(attr.value/100).toFixed(2);
                        if (attr.attr_id==5) power[attr.name]=(attr.value/10).toFixed(2);

                        result[device.name]=power;
                    })
                } else if (device.device_type==888) { //sensor
                    const sensor={}
                    attributes.forEach((attr) => {
                        if (attr.attr_id==0||attr.attr_id==1) {
                            sensor[attr.name]=(attr.value/10).toFixed(1);
                            result[device.name]=sensor;
                        } else {
                            sensor[attr.name]=attr.value==1? true:false;
                            result[device.name]=sensor;
                        }
                    })
                }
            }

            return result;
        }));

        res.status(200).json(roomList);

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.ControlLight=async (req, res) => {
    try {
        const { room_id, device_id, value }=req.body;
        const result=await sequelize.query(`
        SELECT
            rooms.ip_address AS ip_address,
            attributes.holding_address AS holding_address
        FROM rooms
        JOIN devices ON rooms.room_id = devices.room_id
        JOIN attributes ON devices.device_id = attributes.device_id
        WHERE rooms.room_id = :room_id AND devices.device_id = :device_id AND attr_id = 1
    `, {
            replacements: { room_id, device_id, },
            type: sequelize.QueryTypes.SELECT,
        }
        );

        if (result.length==0) {
            return res.status(404).json({ success: false, message: 'No attributes found' });
        }
        const modbusClient=getPollIntervals().find(server => server.ip==result[0].ip_address)?.client;
        if (!modbusClient) {
            return res.status(404).json({ success: false, message: 'Modbus client not found' });
        }
        modbusClient.setID(1);
        await modbusClient.writeRegister(result[0].holding_address, value);
        res.status(200).json({ success: true });

    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internet server error' })
    }
}

exports.ControlDimmer=async (req, res) => {
    try {
        const { room_id, device_id, value }=req.body;
        const result=await sequelize.query(`
        SELECT
            rooms.ip_address AS ip_address,
            attributes.holding_address AS holding_address
        FROM rooms
        JOIN devices ON rooms.room_id = devices.room_id
        JOIN attributes ON devices.device_id = attributes.device_id
        WHERE rooms.room_id = :room_id AND devices.device_id = :device_id AND attr_id = 1
    `, {
            replacements: { room_id, device_id, },
            type: sequelize.QueryTypes.SELECT,
        }
        );

        if (result.length==0) {
            return res.status(404).json({ success: false, message: 'No attributes found' });
        }

        const modbusClient=getPollIntervals().find(server => server.ip==result[0].ip_address)?.client;
        if (!modbusClient) {
            return res.status(404).json({ success: false, message: 'Modbus client not found' });
        }
        modbusClient.setID(1);
        await modbusClient.writeRegister(result[0].holding_address, value);
        res.status(200).json({ success: true });

    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internet server error' })
    }
}

exports.ControlAircon=async (req, res) => {
    try {
        const { room_id, device_id, fan, temp }=req.body;

        const result=await sequelize.query(`
            SELECT
                rooms.ip_address AS ip_address,
                attributes.attr_id AS attr_id,
                attributes.holding_address AS holding_address
            FROM rooms
            JOIN devices ON rooms.room_id = devices.room_id
            JOIN attributes ON devices.device_id = attributes.device_id
            WHERE rooms.room_id = :room_id AND devices.device_id = :device_id
                AND attributes.attr_id IN (1, 2)
        `, {
            replacements: { room_id, device_id },
            type: sequelize.QueryTypes.SELECT,
        });

        if (result.length==0) {
            return res.status(404).json({ success: false, message: 'No attributes found' });
        }

        for (const item of result) {
            const modbusClient=getPollIntervals().find(server => server.ip===item.ip_address)?.client;
            if (!modbusClient) {
                return res.status(404).json({ success: false, message: 'Modbus client not found' });
            }

            modbusClient.setID(1);

            const value=item.attr_id==1? fan:temp;
            await modbusClient.writeRegister(item.holding_address, value);
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.GetConfig=async (req, res) => {
    try {
        const { room_id }=req.query;
        const rooms=await sequelize.query(`SELECT * FROM rooms WHERE room_id = :room_id`, {
            replacements: { room_id },
            type: sequelize.QueryTypes.SELECT
        });

        if (rooms.length==0) {
            return res.status(404).json({ success: false, message: 'No room_id' });
        }


        const roomList=await Promise.all(rooms.map(async (room) => {
            const devices=await sequelize.query(
                `SELECT d.device_id, d.name, d.device_type 
                 FROM devices d
                 WHERE d.room_id = :room_id and d.device_id = :device_id`,
                {
                    replacements: { room_id: room.room_id, device_id: 999 },
                    type: sequelize.QueryTypes.SELECT,
                }
            );

            const result={
                room_id: room.room_id
            };

            for (const device of devices) {
                const attributes=await sequelize.query(
                    `SELECT attr.attr_id, attr.name, attr.value, attr.holding_address
                     FROM attributes attr
                     WHERE attr.device_id = :device_id AND attr.room_id = :room_id AND attr.attr_id != 11`,
                    {
                        replacements: { device_id: device.device_id, room_id: room.room_id },
                        type: sequelize.QueryTypes.SELECT,
                    }
                );
                attributes.forEach((attr) => {
                    result[attr.name]=attr.value;
                })
            }

            return result;
        }));

        res.status(200).json(roomList[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

exports.UpdateConfig=async (req, res) => {
    try {
        const { room_id, config }=req.body;
        const rooms=await sequelize.query(
            `SELECT * FROM rooms WHERE room_id = :room_id`,
            {
                replacements: { room_id },
                type: sequelize.QueryTypes.SELECT
            }
        );


        if (rooms.length==0) {
            return res.status(404).json({ success: false, message: 'No rooms found' });
        }

        const result=await Promise.all(rooms.map(async (room) => {
            const configList=await Promise.all(config.map(async (cf) => {
                const attributes=await sequelize.query(`
                    SELECT
                        rooms.ip_address AS ip_address,
                        attributes.attr_id AS attr_id,
                        attributes.holding_address AS holding_address
                    FROM rooms
                    JOIN devices ON rooms.room_id = devices.room_id
                    JOIN attributes ON devices.device_id = attributes.device_id
                    WHERE rooms.room_id = :room_id
                        AND attributes.device_id = 999
                        AND attributes.attr_id = :attr_id
                `, {
                    replacements: { room_id, attr_id: cf.attr_id },
                    type: sequelize.QueryTypes.SELECT,
                });

                return attributes.map(attr => ({
                    ip_address: attr.ip_address,
                    holding_address: attr.holding_address,
                    value: cf.value
                }));
            }));

            return configList.flat();
        }));

        if (result.length==0) {
            return res.status(404).json({ success: false, message: 'No attributes found' });
        }

        for (const item of result.flat()) {
            const modbusClient=getPollIntervals().find(server => server.ip==item.ip_address)?.client;
            if (!modbusClient) {
                return res.status(404).json({ success: false, message: 'Modbus client not found' });
            }
            modbusClient.setID(1);
            await modbusClient.writeRegister(item.holding_address, item.value);
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


