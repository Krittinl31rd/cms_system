import { Droplet, Thermometer, DoorClosed, DoorOpen } from 'lucide-react'

const LabelSensor=({ device_list }) => {
    return (
        <div className="w-full flex items-center  justify-end gap-2 text-sm">
            {device_list.map((item) =>
                item.type_id==888
                    ? item.attributes.map((attr) => {
                        switch (attr.attr_id) {
                            case 0:
                                return (
                                    <div key={attr.attr_id} className="flex items-center text-center gap-0 py-0 px-0">
                                        <Thermometer className='text-orange-400' size={32} />
                                        <span className="font-bold mr-1">{attr.attr_name}</span>
                                        <span>{(attr.value/10).toFixed(1)}</span>
                                        <span className="font-bold ml-1"> °C</span>
                                    </div>
                                );

                            case 1:
                                return (
                                    <div key={attr.attr_id} className="flex items-center text-center gap-0 py-0 px-0">
                                        <Droplet className='text-sky-400' size={32} />
                                        <span className="font-bold mr-1">{attr.attr_name}</span>
                                        <span>{(attr.value/10).toFixed(1)}</span>
                                        <span className="font-bold ml-1">%</span>
                                    </div>
                                );

                            case 2:
                                return (
                                    <div key={attr.attr_id} className="flex items-center text-center gap-0 py-0 px-0">
                                        {attr.value==0?
                                            (<>
                                                <DoorOpen className='text-yellow-400' size={32} />
                                                <span className='font-bold '>Open</span>
                                            </>
                                            )
                                            :(<>
                                                <DoorClosed className='text-red-400' size={32} />
                                                <span className='font-bold '>Closed</span>
                                            </>
                                            )}

                                    </div>
                                );

                            default:
                                return null;
                        }
                    })
                    :[]
            )}
        </div>
    )
}
export default LabelSensor