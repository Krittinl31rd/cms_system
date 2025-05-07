const sequelize=require('../config/db');
const { shouldLog }=require('./logCache');
const skipAddresses=[49, 50, 51, 52, 53, 54, 55];
const logEvery10MinAddresses=[60,61,62,63,64,65,70,71];

const updatedToDB=async (ip_address, data) => {
    try {
        const rooms=await sequelize.query(
            `SELECT room_id FROM rooms WHERE ip_address = :ip_address`,
            {
                replacements: { ip_address },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        if (rooms.length>0) {
            const room_id=rooms[0].room_id;

            const attributes=await sequelize.query(
                `SELECT holding_address, value FROM attributes WHERE room_id = :room_id`,
                {
                    replacements: { room_id },
                    type: sequelize.QueryTypes.SELECT,
                }
            );

            const attributesMap=new Map();
            attributes.forEach((attr) => {
                attributesMap.set(attr.holding_address, attr.value);
            });

            await Promise.all(
                data.map(async (item) => {
                    if (skipAddresses.includes(item.address)) return;

                    let addressToUpdate=null;

                    if (item.fc==3&&item.address!=-1) {
                        addressToUpdate=item.address;
                    } else if (item.fc==1&&item.address!==-1) {
                        addressToUpdate=item.address;
                    }

                    if (addressToUpdate!==null) {
                        const existingValue=attributesMap.get(addressToUpdate);

                        if (existingValue!==item.value) {
                            await sequelize.query(
                                `UPDATE attributes
                                 SET value = :value
                                 WHERE room_id = :room_id AND holding_address = :holding_address`,
                                {
                                    replacements: {
                                        value: item.value,
                                        room_id,
                                        holding_address: addressToUpdate,
                                    },
                                    type: sequelize.QueryTypes.UPDATE,
                                }
                            );
                            console.log(
                                `DB: Updated address ${addressToUpdate} at room_id ${room_id}`
                            );
                        }
                    }
                })
            );
        }

    } catch (err) {
        console.log('updatedToDB error:', err);
    }
};



const insertToDB=async (ip_address, data, source) => {
    try {
        const rooms=await sequelize.query(
            `SELECT * FROM rooms WHERE ip_address = :ip_address`,
            {
                replacements: { ip_address },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        if (rooms.length>0) {
            const room_id=rooms[0].room_id;

            await Promise.all(data
                .filter(item => !skipAddresses.includes(item.address)) // 
                .map(async (item) => {
                    const result=await sequelize.query(
                        `SELECT device_id, attr_id FROM attributes
                         WHERE room_id = :room_id AND holding_address = :holding_address`,
                        {
                            replacements: {
                                room_id,
                                holding_address: item.address
                            },
                            type: sequelize.QueryTypes.SELECT,
                        }
                    );

                    if (result.length>0) {
                        let shouldInsert=false;

                        if (logEvery10MinAddresses.includes(item.address)) {
                            shouldInsert=shouldLog(ip_address, item.address, 600);
                        } else {
                            shouldInsert=true;
                        }

                        if (shouldInsert) {
                            await sequelize.query(
                                `INSERT INTO device_control_log (member_id, room_id, device_id, attr_id, value, timestamp)
                                 VALUES (:member_id, :room_id, :device_id, :attr_id, :value, NOW())`,
                                {
                                    replacements: {
                                        member_id: source==0? null:source,
                                        room_id,
                                        device_id: result[0].device_id,
                                        attr_id: result[0].attr_id,
                                        value: item.value
                                    },
                                    type: sequelize.QueryTypes.INSERT,
                                }
                            );
                            console.log(`DB: Inserted log for address ${item.address} at room_id ${room_id}`);
                        }
                    }
                }));
        }
    } catch (err) {
        console.log(err);
    }
};

module.exports={
    updatedToDB,
    insertToDB
};