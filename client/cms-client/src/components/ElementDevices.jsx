import React, { useState } from "react";
import { LampCeiling, SunDim, AirVent, CircleGauge, Settings } from 'lucide-react'
import { toast } from "react-toastify";

const ElementDevices=({ ip_address, device_list, sendWebSocketMessage }) => {
    // console.log(device_list)
    const [sliderValues, setSliderValues]=useState({});
    const [tabs, setTabs]=useState({});
    const [formData, setFormData]=useState({});
    const [btnDisabledMap, setBtnDisabledMap]=useState({});
    ;
    const delay=(ms) => new Promise(resolve => setTimeout(resolve, ms));

    const handleSave=async (deviceId) => {
        setBtnDisabledMap(prev => ({ ...prev, [deviceId]: true }));

        const device=device_list.find(d => d.device_id==deviceId);
        if (!device) {
            setBtnDisabledMap(prev => ({ ...prev, [deviceId]: false }));
            return;
        }

        const activeTab=tabs[deviceId]||'tab1';
        const updatedFields=formData[deviceId]||{};

        const filterByTab=(attr) => {
            if (activeTab==='tab1') {
                return attr.attr_id!==11&&attr.attr_id<=12;
            } else if (activeTab==='tab2') {
                return (attr.attr_id>=13&&attr.attr_id<=18)||(attr.attr_id>=25&&attr.attr_id<=30);
            } else if (activeTab==='tab3') {
                return attr.attr_id>=19&&attr.attr_id<=24;
            }
            return false;
        };

        const filteredAttributes=device.attributes.filter(filterByTab);

        for (const { holding_address, attr_id, value: defaultValue } of filteredAttributes) {
            const rawValue=updatedFields[attr_id]??defaultValue;
            const value=parseInt(rawValue);
            if (isNaN(value)) continue;
            const payload={
                cmd: 'modbus_write',
                param: {
                    address: holding_address,
                    value,
                    slaveId: 1,
                    ip: ip_address
                }
            };
            sendWebSocketMessage(payload);
            await delay(1000);
        }

        sendWebSocketMessage({
            cmd: 'modbus_write',
            param: {
                address: 49,
                value: 1,
                slaveId: 1,
                ip: ip_address
            }
        });

        setBtnDisabledMap(prev => ({ ...prev, [deviceId]: false }));
    };





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

    const formatSecondsToHHMMSS=(value) => {
        const totalSeconds=parseInt(value);
        if (isNaN(totalSeconds)) return "00:00:00";

        const hours=String(Math.floor(totalSeconds/3600)).padStart(2, "0");
        const minutes=String(Math.floor((totalSeconds%3600)/60)).padStart(2, "0");
        const seconds=String(totalSeconds%60).padStart(2, "0");

        return `${hours}:${minutes}:${seconds}`;
    };



    return (

        <div className="grid grid-cols-3 items-start justify-center gap-4">
            <div className="flex items-center justify-end col-span-3 gap-4">
                <button
                    className="cursor-pointer inline-flex items-center justify-center py-1 px-2 rounded-full font-semibold bg-yellow-300"
                    onClick={() => {
                        sendWebSocketMessage({
                            cmd: 'modbus_write',
                            param: {
                                address: 4,
                                value: 1,
                                slaveId: 1,
                                ip: ip_address
                            }
                        });
                    }}
                >Master ON</button>
                <button
                    className="cursor-pointer inline-flex items-center justify-center py-1 px-2 rounded-full font-semibold bg-red-400"
                    onClick={() => {
                        sendWebSocketMessage({
                            cmd: 'modbus_write',
                            param: {
                                address: 4,
                                value: 0,
                                slaveId: 1,
                                ip: ip_address
                            }
                        });
                    }}
                >Master OFF</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {device_list.map((item) => {
                    if (item.type_id==4) {
                        return (
                            <div key={item.device_id} className="flex flex-col items-center  gap-2 w-full h-[130px] bg-gray-100 rounded-xl shadow-xl py-2 px-2">
                                {item.attributes.map((attr) => {
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
                        const activeTab=tabs[item.device_id]||'tab1';
                        return (
                            <div key={item.device_id} className="flex flex-col items-start  gap-2 w-full  bg-gray-100 rounded-xl shadow-xl py-2 px-2">
                                <div className="w-full flex items-center gap-2">
                                    <Settings className='text-gray-900' size={32} />
                                    <h3 className="font-semibold">
                                        {item.device_name}
                                    </h3>
                                </div>
                                {/* tab btn */}
                                <div className="w-full flex items-center gap-2 border-b border-gray-300">
                                    {['tab1', 'tab2', 'tab3'].map((tabKey, idx) => (
                                        <button
                                            key={tabKey}
                                            className={`px-2 py-0 font-medium ${activeTab===tabKey? 'border-b-2 border-blue-500 text-blue-500':'text-gray-600 hover:text-blue-500'}`}
                                            onClick={() => setTabs(prev => ({ ...prev, [item.device_id]: tabKey }))}
                                        >
                                            {['Tab1', 'Tab2', 'Tab3'][idx]}
                                        </button>
                                    ))}
                                </div>
                                {/* 
    ESM
    '101', '999', '0', 'Fan Check-In', '3', '-1', '37'
'101', '999', '1', 'Temp Check-In', '23', '-1', '38'
'101', '999', '2', 'Fan Check-Out', '1', '-1', '39'
'101', '999', '3', 'Temp Check-Out', '28', '-1', '40'
'101', '999', '4', 'Fan ESM3', '0', '-1', '41'
'101', '999', '5', 'Temp ESM3', '25', '-1', '42'
'101', '999', '6', 'Time Delay ESM3', '10', '-1', '43'
'101', '999', '13', 'Fan ESM4', '3', '-1', '81'
'101', '999', '14', 'Temp ESM4', '22', '-1', '82'
'101', '999', '15', 'Time Delay ESM4', '150', '-1', '83'
'101', '999', '16', 'Fan ESM5', '3', '-1', '84'
'101', '999', '17', 'Temp ESM5', '16', '-1', '85'
'101', '999', '18', 'Time Delay ESM5', '196', '-1', '86'
SLEEP
'101', '999', '25', 'Hour Sleep Start', '24', '-1', '21'
'101', '999', '26', 'Min Sleep Start', '15', '-1', '22'
'101', '999', '27', 'Sleep ESM Time', '2', '-1', '23'
'101', '999', '28', 'Sleep Temp Max', '5', '-1', '24'
'101', '999', '29', 'Hour Sleep Reverse', '15', '-1', '25'

*/}
                                {/* tab content */}
                                {(activeTab==='tab1'||activeTab==='tab2'||activeTab==='tab3')&&(
                                    <form className="w-full grid grid-cols-3 gap-2">
                                        {item.attributes
                                            .filter(attr => {
                                                if (activeTab=='tab1') return attr.attr_id!==11&&attr.attr_id<=12;
                                                if (activeTab=='tab2') return (attr.attr_id>=13&&attr.attr_id<=18)||(attr.attr_id>=25&&attr.attr_id<=30);
                                                if (activeTab=='tab3') return attr.attr_id>=19&&attr.attr_id<=24;
                                                return false;
                                            })
                                            .map((attr) => (
                                                <div key={attr.attr_id} className="w-full flex flex-col items-start justify-start">
                                                    <label htmlFor={attr.attr_id} className="text-sm font-semibold">
                                                        {attr.attr_name}
                                                    </label>
                                                    <input
                                                        id={attr.attr_id}
                                                        type="text"
                                                        value={formData[item.device_id]?.[attr.attr_id]??attr.value}
                                                        onChange={(e) => {
                                                            let raw=e.target.value;

                                                            // Always allow only numeric input
                                                            let value=raw.replace(/\D/g, '');
                                                            let num=parseInt(value);
                                                            if (isNaN(num)) num='';


                                                            const fanAttrIds=[0, 4, 9, 12, 13, 16];

                                                            if (fanAttrIds.includes(attr.attr_id)) {
                                                                if (num!=='') {
                                                                    if (num<=0) num=0;
                                                                    else if (num>=3) num=3;
                                                                }
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    [item.device_id]: {
                                                                        ...prev[item.device_id],
                                                                        [attr.attr_id]: num
                                                                    }
                                                                }));
                                                            } else {
                                                                // Other attributes just accept numeric input as-is
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    [item.device_id]: {
                                                                        ...prev[item.device_id],
                                                                        [attr.attr_id]: num
                                                                    }
                                                                }));
                                                            }
                                                        }}
                                                        className="w-full border border-gray-300 rounded-sm p-1 text-sm"
                                                    />


                                                    {(attr.attr_id==6||attr.attr_id==7||attr.attr_id==15||attr.attr_id==18)&&(
                                                        <label htmlFor={attr.attr_id} className="text-xs">
                                                            {formatSecondsToHHMMSS(formData[item.device_id]?.[attr.attr_id]??attr.value)}
                                                        </label>
                                                    )}
                                                </div>
                                            ))}

                                        <div className="col-span-3 w-full">
                                            {/* <button
                                                type="button"
                                                onClick={() => handleSave(item.device_id)}
                                                className="cursor-pointer font-bold text-white w-full bg-blue-500 rounded-lg py-1"
                                                disabled={btnDisabledMap[item.device_id]}
                                            >
                                                Save
                                            </button> */}
                                            <button
                                                type="button"
                                                onClick={() => handleSave(item.device_id)}
                                                className="cursor-pointer font-bold text-white w-full bg-blue-500 rounded-lg py-1 flex items-center justify-center disabled:opacity-50"
                                                disabled={btnDisabledMap[item.device_id]}
                                            >
                                                {btnDisabledMap[item.device_id]? (
                                                    <>
                                                        <svg
                                                            className="animate-spin h-4 w-4 mr-2 text-white"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            ></circle>
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                                                            ></path>
                                                        </svg>
                                                        Saving...
                                                    </>
                                                ):(
                                                    "Save"
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )
                    }
                })}
            </div>

        </div>
    )
}
export default ElementDevices