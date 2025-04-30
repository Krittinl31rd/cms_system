const sequelize=require('../config/db')
const { wsClients }=require('../websocketServer')
// const { getPollIntervals }=require('../utilities/pollInterval.js');

exports.GetAllDevices=async (req, res) => {
    try {
        const rooms=await sequelize.query(`SELECT * FROM rooms`, {
            type: sequelize.QueryTypes.SELECT
        })

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

            const deviceList=await Promise.all(devices.map(async (device) => {
                const attributes=await sequelize.query(
                    `SELECT attr.attr_id, attr.name, attr.value, attr.holding_address
                        FROM attributes attr
                        WHERE attr.device_id = :device_id AND attr.room_id = :room_id`,
                    {
                        replacements: { device_id: device.device_id, room_id: room.room_id },
                        type: sequelize.QueryTypes.SELECT,
                    }
                );

                return {
                    device_id: device.device_id,
                    device_name: device.name,
                    type_id: device.device_type,
                    attributes: attributes.map(attr => ({
                        attr_id: attr.attr_id,
                        attr_name: attr.name,
                        value: attr.value,
                        holding_address: attr.holding_address,
                    }))
                };
            }));

            return {
                room_id: room.room_id,
                room_name: room.name,
                ip_address: room.ip_address,
                mac_address: room.mac_address,
                is_online: room.is_online,
                device_list: deviceList,
            };
        }));

        res.status(200).json({
            message: 'Get all devices successfully',
            data: roomList
        })
        

    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error' })
    }
}


// exports.GetAllDevicesByRoom=async (req, res) => {
//     try {
//         const { room_id }=req.params
//         console.log(room_id);
//         // const querySearch=`SELECT * FROM devices WHERE room_id=:room_id`;
//         // const results=await sequelize.query(querySearch, {
//         //     replacements: { room_id },
//         //     type: sequelize.QueryTypes.SELECT
//         // })
//         // res.status(200).json({ message: 'Get all devices by room successfully', data: results })
//     } catch (err) {
//         console.log(err)
//         res.status(500).json({ message: 'Internal server error' })
//     }
// }



exports.SendRoomStatus=async (req, res) => {
    const { room_id, device_id, attr_id, value }=req.body;

    const broadcastUpdate=(status, dataOrMessage) => {
        wsClients.forEach((client) => {
            if (!client.isLogin) return;
            try {
                client.socket.send(JSON.stringify({
                    cmd: 'room-status-update',
                    param: status=='success'
                        ? { status, data: dataOrMessage }
                        :{ status, message: dataOrMessage }
                }));
            } catch (wsErr) {
                console.error('WebSocket send error:', wsErr);
            }
        });
    };

    try {

        await sequelize.query(`
            UPDATE attributes
            SET value = :value
            WHERE room_id = :room_id AND device_id = :device_id AND attr_id = :attr_id
        `, {
            replacements: { room_id, device_id, attr_id, value },
            type: sequelize.QueryTypes.UPDATE
        });

        await sequelize.query(`
            INSERT INTO device_control_log (room_id, device_id, attr_id, value)
            VALUES (:room_id, :device_id, :attr_id, :value)
        `, {
            replacements: { room_id, device_id, attr_id, value },
            type: sequelize.QueryTypes.INSERT,
        });

        broadcastUpdate('success', { room_id, device_id, attr_id, value });

        if (device_id===0&&(attr_id===7||attr_id===8)) {
            const [room]=await sequelize.query(`
                SELECT ip_address FROM rooms WHERE room_id = :room_id
            `, {
                replacements: { room_id },
                type: sequelize.QueryTypes.SELECT,
            });

            if (!room) {
                return res.status(404).json({ success: false, message: 'Room not found' });
            }

            // const modbusClient=getPollIntervals().find(server => server.ip===room.ip_address)?.client;
            // if (!modbusClient) {
            //     return res.status(404).json({ success: false, message: 'Modbus client not found' });
            // }

            // modbusClient.setID(1);
            // await modbusClient.writeRegister(20, value===0? 0:1);
        }

        res.status(200).json({
            message: `Updated attribute ${attr_id} in room ${room_id} with value ${value} successfully`
        });

    } catch (err) {
        console.error('SendRoomStatus Error:', err);
        broadcastUpdate('error', 'Internal server error');
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.GetDeviceControlLog=async (req, res) => {
    try {
        const data=await sequelize.query(`
        SELECT
            dcl.id,
            dcl.value AS value,
            dcl.timestamp,

            r.room_id AS room_id,
            r.name AS room_name,

            d.device_id AS device_id,
            d.name AS device_name,
            d.device_type,

            a.attr_id AS attr_id,
            a.name AS attribute_name

        FROM device_control_log dcl
        JOIN rooms r ON dcl.room_id = r.room_id
        JOIN devices d ON dcl.room_id = d.room_id AND dcl.device_id = d.device_id
        JOIN attributes a ON dcl.room_id = a.room_id 
                        AND dcl.device_id = a.device_id 
                        AND dcl.attr_id = a.attr_id
        ORDER BY dcl.timestamp DESC`, {
            type: sequelize.QueryTypes.SELECT
        });
        res.status(200).json({ data })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error' })
    }
}

