import React, { useState } from "react";
import { LampCeiling, SunDim, AirVent, CircleGauge, Settings } from 'lucide-react'
import useCmsStore from "../store/cmsstore";

const ElementDevices=({ ip_address, device_list, sendWebSocketMessage }) => {
    // console.log(device_list)
    const { member }=useCmsStore((state) => state);
    const [sliderValues, setSliderValues]=useState({});

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

    const handleChangeSlider=(deviceId, e) => {
        setSliderValues(prev => ({
            ...prev,
            [deviceId]: e.target.value
        }));
    };


    return (

        <div className="grid grid-cols-3 items-start justify-center gap-4">
            <div className="grid grid-cols-2 gap-4">
                {device_list.map((item) => {
                    if (item.type_id==4) {
                        return (
                            <div key={item.device_id} className="flex flex-col items-center  gap-2 w-full h-[130px] bg-gray-100 rounded-xl shadow-xl py-2 px-2">
                                { item.attributes.map((attr) => {
                                    if (attr.attr_id==1) {
                                        return (
                                            <div key={attr.attr_id} className='w-full flex items-center'>
                                                <LampCeiling className={attr.value==0? 'text-gray-500':'text-yellow-500'} size={32} />
                                                <div className='h-full flex-1 flex items-start justify-end gap-2 font-semibold text-xs'>
                                                    {attr.value==0? (<span>OFF</span>):(<span>ON</span>)}
                                                    <button
                                                        onClick={() => handleAction(attr.holding_address, attr.value==0? 1:0)}
                                                        className='cursor-pointer w-8 h-4 rounded-full bg-gray-300 inline-flex relative'>
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
                                <div className='w-full flex-1 flex items-center'>
                                    <h3 className='font-semibold'>{item.device_name}</h3>
                                </div>
                            </div>
                        )
                    }
                }
                )}
            </div>
            <div className="grid grid-cols-1 gap-4">
                {device_list.map((item) => {
                    if (item.type_id==3) {
                        return (
                            <div key={item.device_id} className="flex flex-col items-center gap-2 w-full h-[130px] bg-gray-100 rounded-xl shadow-xl py-2 px-2">
                                {item.attributes.map((attr) => {
                                    if (attr.attr_id==1) {
                                        return (
                                            <div key={attr.attr_id} className='w-full flex items-center gap-2'>
                                                <SunDim className={attr.value<=0? 'text-gray-500':'text-yellow-500'} size={32} />
                                                <h3 className='font-semibold'>{item.device_name}</h3>
                                            </div>
                                        )
                                    }
                                })}
                                <div className='w-full flex-1 flex items-center'>
                                    {item.attributes.map((attr) => {
                                        if (attr.attr_id==1) {
                                            return (
                                                <div key={attr.attr_id} className="w-full flex flex-col items-center justify-center">
                                                    <label htmlFor="slider" className="font-semibold">
                                                        {sliderValues[item.device_id]??attr.value}%
                                                    </label>
                                                    <input
                                                        id="slider"
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={sliderValues[item.device_id]??attr.value}
                                                        onChange={(e) => handleChangeSlider(item.device_id, e)}
                                                        onMouseUp={(e) => handleAction(attr.holding_address, e.target.value)}
                                                        className="
                                    w-full h-4 rounded-lg appearance-none bg-gray-300
                                    focus:outline-none
                                    [&::-webkit-slider-thumb]:appearance-none
                                    [&::-webkit-slider-thumb]:w-5
                                    [&::-webkit-slider-thumb]:h-5
                                    [&::-webkit-slider-thumb]:bg-yellow-400
                                    [&::-webkit-slider-thumb]:rounded-full
                                    [&::-webkit-slider-thumb]:cursor-pointer
                                    [&::-moz-range-thumb]:appearance-none
                                    [&::-moz-range-thumb]:w-5
                                    [&::-moz-range-thumb]:h-5
                                    [&::-moz-range-thumb]:bg-yellow-400
                                    [&::-moz-range-thumb]:rounded-full
                                    [&::-moz-range-thumb]:cursor-pointer
                                    transition-all duration-300
                                "
                                                    />
                                                </div>
                                            )
                                        }
                                    })}
                                </div>
                            </div>
                        )
                    }
                }
                )}
            </div>
            <div className="grid grid-cols-1 gap-4">
                {device_list.map((item) => {
                    if (item.type_id==1) {
                        const FanSpeed=item.attributes.find(attr => attr.attr_id==1);
                        const Temp=item.attributes.find(attr => attr.attr_id==2);
                        const RoomTemp=item.attributes.find(attr => attr.attr_id==3);

                        return (
                            <div key={item.device_id} className="flex flex-col items-center  gap-2 w-full h-[130px] bg-gray-100 rounded-xl shadow-xl py-2 px-2">
                                <div className='w-full flex items-center gap-2'>
                                    <AirVent className={FanSpeed.value==0? 'text-gray-500':'text-sky-500'} size={32} />
                                    <h3 className='font-semibold'>{item.device_name}</h3>
                                    <div className="flex-1 flex items-center justify-end">
                                        <span className="font-semibold">Room: <span className="font-normal">{RoomTemp.value}</span>°C </span></div>
                                </div>
                                <div className='w-full flex items-center justify-center gap-2 text-xs'>
                                    <button
                                        onClick={() => handleAction(FanSpeed.holding_address, 0)}
                                        className={FanSpeed.value==0? "cursor-pointer inline-flex items-center justify-center w-12 py-1 rounded-full font-semibold bg-green-400":
                                            "cursor-pointer inline-flex items-center justify-center w-12 py-1 rounded-full font-semibold bg-gray-200"
                                        }>
                                        OFF
                                    </button>
                                    <button
                                        onClick={() => handleAction(FanSpeed.holding_address, 1)}
                                        className={FanSpeed.value==1? "cursor-pointer inline-flex items-center justify-center w-12 py-1 rounded-full font-semibold bg-green-400":
                                            "cursor-pointer inline-flex items-center justify-center w-12 py-1 rounded-full font-semibold bg-gray-200"
                                        }>
                                        LOW
                                    </button>
                                    <button
                                        onClick={() => handleAction(FanSpeed.holding_address, 2)}
                                        className={FanSpeed.value==2? "cursor-pointer inline-flex items-center justify-center w-12 py-1 rounded-full font-semibold bg-green-400":
                                            "cursor-pointer inline-flex items-center justify-center w-12 py-1 rounded-full font-semibold bg-gray-200"
                                        }>
                                        MED
                                    </button>
                                    <button
                                        onClick={() => handleAction(FanSpeed.holding_address, 3)}
                                        className={FanSpeed.value==3? "cursor-pointer inline-flex items-center justify-center w-12 py-1 rounded-full font-semibold bg-green-400":
                                            "cursor-pointer inline-flex items-center justify-center w-12 py-1 rounded-full font-semibold bg-gray-200"
                                        }>
                                        HIGH
                                    </button>
                                </div>
                                <div className='w-full flex items-center'>
                                    <div className="w-full flex flex-col items-center justify-center">
                                        <label htmlFor="slider" className="font-semibold">
                                            {sliderValues[item.device_id]??Temp.value}°C
                                        </label>
                                        <input
                                            id="slider"
                                            type="range"
                                            min="16"
                                            max="36"
                                            value={sliderValues[item.device_id]??Temp.value}
                                            onChange={(e) => handleChangeSlider(item.device_id, e)}
                                            onMouseUp={(e) => handleAction(Temp.holding_address, e.target.value)}
                                            className="
                                                        w-full h-4 rounded-lg appearance-none bg-gray-300
                                                        focus:outline-none
                                                        [&::-webkit-slider-thumb]:appearance-none
                                                        [&::-webkit-slider-thumb]:w-5
                                                        [&::-webkit-slider-thumb]:h-5
                                                        [&::-webkit-slider-thumb]:bg-sky-400
                                                        [&::-webkit-slider-thumb]:rounded-full
                                                        [&::-webkit-slider-thumb]:cursor-pointer
                                                        [&::-moz-range-thumb]:appearance-none
                                                        [&::-moz-range-thumb]:w-5
                                                        [&::-moz-range-thumb]:h-5
                                                        [&::-moz-range-thumb]:bg-sky-400
                                                        [&::-moz-range-thumb]:rounded-full
                                                        [&::-moz-range-thumb]:cursor-pointer
                                                        transition-all duration-300
                                                    "
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    }
                })}
            </div>

            <div className="grid">
                {device_list.map((item) => {
                    if (item.type_id==7) {
                        const Voltage=item.attributes.find(attr => attr.attr_id==0);
                        const Current=item.attributes.find(attr => attr.attr_id==1);
                        const Watt=item.attributes.find(attr => attr.attr_id==2);
                        const PF=item.attributes.find(attr => attr.attr_id==3);
                        const Energy=item.attributes.find(attr => attr.attr_id==4);
                        const Freq=item.attributes.find(attr => attr.attr_id==5);

                        return (
                            <div key={item.device_id} className="flex flex-col items-start  gap-2 w-full  bg-gray-100 rounded-xl shadow-xl py-2 px-2">
                                <div className="w-full flex items-center gap-2">
                                    <CircleGauge className='text-orange-500' size={32} />
                                    <h3 className="font-semibold">
                                        {item.device_name}
                                    </h3>
                                </div>
                                <div className="flex-1 w-full">
                                    <div className="grid grid-cols-3">
                                        <span className="font-semibold">{Voltage.attr_name}</span>
                                        <span className="text-end">{(Voltage.value/10).toFixed(2)}</span>
                                        <span className="text-end font-semibold">Volt</span>
                                    </div>
                                    <div className="grid grid-cols-3">
                                        <span className="font-semibold">{Current.attr_name}</span>
                                        <span className="text-end">{(Current.value/1000).toFixed(2)}</span>
                                        <span className="text-end font-semibold">Amp</span>
                                    </div>
                                    <div className="grid grid-cols-3">
                                        <span className="font-semibold">{Watt.attr_name}</span>
                                        <span className="text-end">{(Watt.value/10).toFixed(2)}</span>
                                        <span className="text-end font-semibold">Watt</span>
                                    </div>
                                    <div className="grid grid-cols-3">
                                        <span className="font-semibold">{PF.attr_name}</span>
                                        <span className="text-end">{(PF.value/100).toFixed(2)}</span>
                                        <span className="text-end font-semibold">Unit</span>
                                    </div>
                                    <div className="grid grid-cols-3">
                                        <span className="font-semibold">{Energy.attr_name}</span>
                                        <span className="text-end">{(Energy.value/100).toFixed(2)}</span>
                                        <span className="text-end font-semibold"></span>
                                    </div>
                                    <div className="grid grid-cols-3">
                                        <span className="font-semibold">{Freq.attr_name}</span>
                                        <span className="text-end">{(Freq.value/10).toFixed(1)}</span>
                                        <span className="text-end font-semibold">Hz</span>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                })}
            </div>

            <div className="grid col-span-2 gap-4">
                {device_list.map((item) => {
                    if (item.type_id==999) {
                        return (
                            <div key={item.device_id} className="flex flex-col items-start  gap-2 w-full  bg-gray-100 rounded-xl shadow-xl py-2 px-2">
                                <div className="w-full flex items-center gap-2">
                                    <Settings className='text-gray-900' size={32} />
                                    <h3 className="font-semibold">
                                        {item.device_name}
                                    </h3>
                                </div>
                                <form className="w-full grid grid-cols-3 gap-2">
                                    {item.attributes.map((attr) => {
                                        return (
                                            <div key={attr.attr_id} className="w-full flex flex-col items-start justify-start">
                                                <label htmlFor={attr.attr_id} className="text-sm font-semibold">
                                                    {attr.attr_name}
                                                </label>
                                                <input
                                                    id={attr.attr_id}
                                                    type="text"
                                                    // value={attr.value}
                                                    defaultValue={attr.value}
                                                    className="w-full border border-gray-300 rounded-sm p-1 text-sm" />
                                            </div>
                                        )
                                    })}
                                    <div className="col-span-3 w-full">
                                        <button type="button" className="cursor-pointer font-bold text-white w-full bg-blue-500 rounded-lg py-1">Save</button>
                                    </div>
                                </form>
                            </div>
                        )
                    }
                })}
            </div>
        </div>
    )
}
export default ElementDevices