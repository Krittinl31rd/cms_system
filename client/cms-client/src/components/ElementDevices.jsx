import { Lightbulb, Power } from 'lucide-react'

const ElementDevices=({ ip_address, device_list, sendWebSocketMessage }) => {
    console.log(device_list)


    const handleAction=async (address, value) => {
        sendWebSocketMessage({
            cmd: 'modbus_write',
            param: {
                address,
                value: value,
                slaveId: 1,
                ip: ip_address
            }
        })
    }

    return (
        <div className="grid grid-cols-3 items-start justify-center gap-4">
            <div className="grid grid-cols-2 gap-4">
                {device_list.map((item) => {
                    if (item.type_id==4) {
                        return (
                            <div key={item.device_id} className="flex flex-col items-center  gap-2 w-full h-[100px] bg-gray-200 rounded-xl shadow-xl py-4 px-2">
                                {item.attributes.map((attr) => {
                                    if (attr.attr_id==1) {
                                        return (
                                            <div key={attr.attr_id} className='w-full flex items-center'>
                                                <Lightbulb className={attr.value==0? 'text-black':'text-yellow-500'} size={32} />
                                                <div className='h-full flex-1 flex items-start justify-end gap-2 font-semibold text-xs'>
                                                    {attr.value==0? (<span>OFF</span>):(<span>ON</span>)}
                                                    <button
                                                        onClick={() => handleAction(attr.holding_address, attr.value==0? 1:0)}
                                                        className='cursor-pointer w-8 h-4 rounded-full bg-gray-400/80 inline-flex relative'>
                                                        {attr.value==0? (
                                                            <span className='w-4 h-4 bg-gray-500 rounded-full absolute top-0 left-0'></span>
                                                        ):(
                                                            <span className='w-4 h-4 bg-green-600 rounded-full absolute top-0 right-0'></span>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    }
                                })}
                                <div className='w-full flex-1'>
                                    <h3 className='font-semibold'>{item.device_name}</h3>
                                </div>
                            </div>
                        )
                    }
                }
                )}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="w-full h-[120px] border"></div>
                <div className="w-full h-[120px] border"></div>
            </div>
            <div className="grid grid-cols-1 gap-4">
                <div className="w-full h-[120px] border"></div>
            </div>
        </div>
    )
}
export default ElementDevices