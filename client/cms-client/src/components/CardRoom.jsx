import { sendStatusRoom } from "../api/Devices"
import useCmsStore from "../store/cmsstore";

const CardRoom=({ item, onClick, sendWebSocketMessage }) => {
    const { token, member }=useCmsStore((state) => state);

    const handleAction=async (device_id, attr_id, address, value) => {
        sendWebSocketMessage({
            cmd: 'modbus_write',
            param: {
                address,
                value: value,
                slaveId: 1,
                ip: item.ip_address
            }
        })

        if (attr_id==1) {
            handleSendStatus(device_id, 3, value==1? 1:4)
        }
    }

    const handleSendStatus=async (device_id, attr_id, value) => {
        try {
            await sendStatusRoom(token,
                {
                    room_id: item.room_id,
                    device_id,
                    attr_id,
                    value
                })
            // console.log(res);
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <div className="w-full flex flex-col justify-between rounded-2xl p-4 shadow bg-white hover:shadow-xl space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{item.room_name}</h2>
                <div className="flex items-center gap-1">
                    {item.is_online==0?
                        (<>
                            <span className="w-2 h-2 rounded-xl bg-red-500"></span>
                            <span className="text-red-500">Offline</span>
                        </>):
                        (<>
                            <span className="w-2 h-2 rounded-xl bg-green-500"></span>
                            <span className="text-green-500">Online</span>
                        </>)}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
                {item.device_list.length===0? (
                    <div className="col-span-2 text-center text-gray-400">
                        No Device
                    </div>
                ):(
                    item.device_list.map((item) =>
                        item.type_id==0
                            ? item.attributes.map((attr) => {
                                const DND=item.attributes.find(attr => attr.attr_id==11);
                                switch (attr.attr_id) {

                                    case 1:
                                        if (attr.value==1) {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4 font-semibold rounded-xl bg-green-200 text-green-700">
                                                    <span className="font-bold"> Check-In</span>
                                                </span>
                                            );
                                        } else {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4 font-semibold rounded-xl bg-red-200 text-red-700">
                                                    <span className="font-bold"> Check-Out</span>
                                                </span>
                                            );
                                        }

                                    case 0:
                                        if (attr.value==1) {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4 font-semibold rounded-xl bg-blue-200 text-blue-700">
                                                    <span className="font-bold"> Keycard</span>
                                                </span>
                                            );
                                        } else {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4 font-semibold rounded-xl bg-gray-200 text-gray-700">
                                                    <span className="font-bold"> Keycard</span>
                                                </span>
                                            );
                                        }

                                    case 2: //MUR
                                        if (attr.value==0&&DND.value==1) {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-red-200 text-red-700">
                                                    <span className="font-bold">Do Not Disturb</span>
                                                </span>
                                            );
                                        } if (attr.value==1&&DND.value==0) {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-sky-200 text-sky-700">
                                                    <span className="font-bold">Make Up Room</span>
                                                </span>
                                            );
                                        } else {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-gray-200 text-gray-700">
                                                    <span className="font-bold">DND/MUR</span>
                                                </span>
                                            );
                                        }

                                    case 3:
                                        if (attr.value==1) {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-yellow-200 text-yellow-700">
                                                    <span className="font-bold">Occupied Dirty</span>
                                                </span>
                                            )
                                        } else if (attr.value==2) {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-green-200 text-green-700">
                                                    <span className="font-bold"> Occupied Clean</span>
                                                </span>
                                            )
                                        } else if (attr.value==3) {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-green-200 text-green-700">
                                                    <span className="font-bold">Unoccupied Clean</span>
                                                </span>
                                            )
                                        } else if (attr.value==4) {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-yellow-200 text-yellow-700">
                                                    <span className="font-bold">Unoccupied Dirty</span>
                                                </span>
                                            )
                                        } else {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-gray-200 text-gray-700">
                                                    <span className="font-bold"> Occupied Dirty</span>
                                                </span>
                                            );
                                        }

                                    case 4:
                                        if (attr.value==1) {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-red-200 text-red-700">
                                                    <span className="font-bold">Room Offline</span>
                                                </span>
                                            )
                                        } else {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-gray-200 text-gray-700">
                                                    <span className="font-bold">Room Offline</span>
                                                </span>
                                            )
                                        }

                                    case 6:
                                        if (attr.value==0) {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-gray-200 text-gray-700">
                                                    <span className="font-bold">Guest Out Room</span>
                                                </span>
                                            )
                                        } else {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-blue-200 text-blue-700">
                                                    <span className="font-bold">Guest In Room</span>
                                                </span>
                                            )
                                        }

                                    case 7:
                                        if (attr.value==0) {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-gray-200 text-gray-700">
                                                    <span className="font-bold">Maid Out Room</span>
                                                </span>
                                            )
                                        } else {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-pink-200 text-pink-700">
                                                    <span className="font-bold">Maid In Room</span>
                                                </span>
                                            )
                                        }

                                    case 8:
                                        if (attr.value==0) {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-gray-200 text-gray-700">
                                                    <span className="font-bold">Techniacn Out Room</span>
                                                </span>
                                            )
                                        } else {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-purple-200 text-purple-700">
                                                    <span className="font-bold">Techniacn In Room</span>
                                                </span>
                                            )
                                        }

                                    case 10:
                                        if (attr.value==0) {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-gray-200 text-gray-700">
                                                    <span className="font-bold">ESM</span>
                                                </span>
                                            )
                                        } else {
                                            return (
                                                <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-green-200 text-green-700">
                                                    <span className="font-bold">ESM{attr.value}</span>
                                                </span>
                                            )
                                        }


                                    default:
                                        return null;
                                }
                            })
                            :[]
                    )
                )}
            </div>
            {member?.role=='admin'? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                    {item.device_list.length===0? (
                        <>
                            <button
                                className="flex-1 cursor-pointer p-2 bg-gray-200 text-gray-700 font-semibold rounded-xl"
                            >
                                Control
                            </button>
                            <button
                                className="flex-1 cursor-pointer p-2 bg-red-200 text-red-700 font-semibold rounded-xl"
                            >
                                Check-Out
                            </button>
                        </>
                    ):(
                        item.device_list.map((item) =>
                            item.type_id===0
                                ? item.attributes.map((attr) => {
                                    switch (attr.attr_id) {
                                        case 1:
                                            return (
                                                <div key={attr.attr_id} className="col-span-2 flex items-center gap-2">
                                                    <button
                                                        onClick={onClick}
                                                        className="flex-1 cursor-pointer p-2 bg-gray-200 text-gray-700 font-semibold rounded-xl"
                                                    >
                                                        Control
                                                    </button>
                                                    <button
                                                    disabled={attr.value==1?true:false}
                                                        onClick={() =>
                                                            handleAction(
                                                                item.device_id,
                                                                attr.attr_id,
                                                                attr.holding_address,
                                                                1
                                                            )
                                                        }
                                                        className={`${attr.value==1? 'opacity-70 cursor-not-allowed':'cursor-pointer'}
                                                        flex-1 p-2 bg-green-200 text-green-700 font-semibold rounded-xl`}
                                                    >
                                                        Check-In
                                                    </button>
                                                    <button
                                                        disabled={attr.value==0? true:false}
                                                        onClick={() =>
                                                            handleAction(
                                                                item.device_id,
                                                                attr.attr_id,
                                                                attr.holding_address,
                                                                0
                                                            )
                                                        }
                                                        className={`${attr.value==0? 'opacity-70 cursor-not-allowed':'cursor-pointer'}
                                                            flex-1  p-2 bg-red-200 text-red-700 font-semibold rounded-xl`}
                                                    >
                                                        Check-Out
                                                    </button>
                                                </div>
                                            );
                                        default:
                                            return null;
                                    }
                                }):[]
                        )
                    )}
                </div>
            ):(
                null
            )}


        </div>
    )
}
export default CardRoom