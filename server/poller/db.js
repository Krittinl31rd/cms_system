const sequelize=require('../config/db');
let count=0;
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

        count++;
    } catch (err) {
        console.log(err);
    }
}

module.exports={
    updatedToDB,
};