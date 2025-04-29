import { useState, useEffect, useRef } from 'react';
import useCmsStore from '../../store/cmsstore';
import { getAllDevicesAllRooms } from '../../api/Devices';
import DataTable from '../../components/DataTable';


const HousekeeperDashboard=() => {
    const { token }=useCmsStore((state) => state);
    const [rooms, setRooms]=useState([]);
    const [statusFilter, setStatusFilter]=useState('');
    const [isWsReady, setIsWsReady]=useState(false);
    const ws=useRef(null);

    useEffect(() => {
        ws.current=new WebSocket(import.meta.env.VITE_WS_URL);

        ws.current.onopen=() => {
            console.log('WebSocket Connected');
            setIsWsReady(true);
        };

        ws.current.onmessage=(event) => {
            const msg=JSON.parse(event.data);
            handleCommand(msg)
        };

        ws.current.onerror=(error) => {
            console.error('WebSocket Error:', error);
        };

        ws.current.onclose=() => {
            console.log('WebSocket Disconnected');
            setIsWsReady(false);
        };

        return () => {
            ws.current.close();
        };
    }, [token]);

    useEffect(() => {
        if (isWsReady&&token) {
            sendWebSocketMessage({ cmd: 'login', param: { token } });
        }
    }, [isWsReady, token]);

    useEffect(() => {
        fetchRoomsData(token);
    }, [token]);

    const fetchRoomsData=async (token) => {
        try {
            const res=await getAllDevicesAllRooms(token);
            setRooms(res.data.data);
        } catch (err) {
            console.log(err);
        }
    };

    const sendWebSocketMessage=(message) => {
        if (ws.current&&ws.current.readyState==WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not open, retrying...');
            setTimeout(() => sendWebSocketMessage(message), 500);
        }
    };

    const handleCommand=(msg) => {
        const { cmd, param }=msg;
        switch (cmd) {
            case ('room-status-update'):
                console.log('Room Status Updated:', param.data);
                setRooms((prevData) => {
                    const updatedData=prevData.map((room) => {
                        if (room.room_id==param.data.room_id) {
                            const updatedRoom={
                                ...room,
                                device_list: room.device_list.map((device) => {
                                    if (device.device_id!=param.data.device_id) return device;
                                    return {
                                        ...device,
                                        attributes: device.attributes.map((attr) => {
                                            if (attr.attr_id!=param.data.attr_id) return attr;
                                            return {
                                                ...attr,
                                                value: param.data.value,
                                            };
                                        }),
                                    };
                                }),
                            };
                            return updatedRoom;
                        }
                        return room;
                    });
                    // console.log(updatedData)
                    return updatedData;
                });

                break;
        }
    };


    // useEffect(() => {
    //   console.log('Rooms updated:', rooms);
    // }, [rooms]);

    const totalRooms=rooms.length;
    const occupiedDirty=rooms.filter((room) => room.device_list?.find(device => device.device_id==0)?.attributes?.[3]?.value==1).length;
    const occupiedClean=rooms.filter((room) => room.device_list?.find(device => device.device_id==0)?.attributes?.[3]?.value==2).length;
    const unoccupiedClean=rooms.filter((room) => room.device_list?.find(device => device.device_id==0)?.attributes?.[3]?.value==3).length;
    const unoccupiedDirty=rooms.filter((room) => room.device_list?.find(device => device.device_id==0)?.attributes?.[3]?.value==4).length;

    return (
        <div className="flex flex-col items-start justify-start w-full h-full overflow-auto gap-4">
            {isWsReady? (
                <h3 className="text-end font-semibold text-green-500 mb-4">WebSocket is ready</h3>
            ):(
                <h3 className="text-end font-semibold text-red-500 mb-4">WebSocket is not ready</h3>
            )}
            <div className="w-full grid sm:grid-cols-2  md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 place-items-center">

                <button
                    className="cursor-pointer w-[200px] h-[200px] rounded-lg shadow-xl p-4 gap-4 flex flex-col items-center justify-center"
                    onClick={() => setStatusFilter('')}
                >
                    <h1 className='text-7xl font-bold text-indigo-500 break-all'>{totalRooms}</h1>
                    <div className='w-full flex items-center justify-start'>
                        <h3 className='text-xl text-gray-800 font-semibold'>Total Rooms</h3>
                    </div>
                </button>

                <button
                    className="cursor-pointer w-[200px] h-[200px] rounded-lg shadow-xl p-4 gap-4 flex flex-col items-center justify-center"
                    onClick={() => setStatusFilter(1)}
                >
                    <h1 className='text-7xl font-bold text-red-400 break-all'>{occupiedDirty}</h1>
                    <div className='w-full flex items-center justify-start'>
                        <h3 className='text-xl text-gray-800 font-semibold'>Occupied Dirty</h3>
                    </div>
                </button>

                <button
                    className="cursor-pointer w-[200px] h-[200px] rounded-lg shadow-xl p-4 gap-4 flex flex-col items-center justify-center"
                    onClick={() => setStatusFilter(2)}
                >
                    <h1 className='text-7xl font-bold text-green-400 break-all'>{occupiedClean}</h1>
                    <div className='w-full flex items-center justify-start'>
                        <h3 className='text-xl text-gray-800 font-semibold'>Occupied Clean</h3>
                    </div>
                </button>

                <button
                    className="cursor-pointer w-[200px] h-[200px] rounded-lg shadow-xl p-4 gap-4 flex flex-col items-center justify-center"
                    onClick={() => setStatusFilter(3)}
                >
                    <h1 className='text-7xl font-bold text-blue-400 break-all'>{unoccupiedClean}</h1>
                    <div className='w-full flex items-center justify-start'>
                        <h3 className='text-xl text-gray-800 font-semibold'>Unoccupied Clean</h3>
                    </div>
                </button>

                <button
                    className="cursor-pointer w-[200px] h-[200px] rounded-lg shadow-xl p-4 gap-4 flex flex-col items-center justify-center"
                    onClick={() => setStatusFilter(4)}
                >
                    <h1 className='text-6xl font-bold text-orange-400 break-all'>{unoccupiedDirty}</h1>
                    <div className='w-full flex items-center justify-start'>
                        <h3 className='text-xl text-gray-800 font-semibold'>Unoccupied Dirty</h3>
                    </div>
                </button>

            </div>

            <DataTable
                data={rooms}
                loading={rooms.length==0}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
            />


        </div>

    );
}
export default HousekeeperDashboard