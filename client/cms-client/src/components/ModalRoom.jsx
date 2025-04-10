
import LabelStatus from "./LabelStatus";
import ElementDevices from "./ElementDevices";
import { useState, useEffect } from 'react';

const ModalRoom=({ isOpen, onClose, room, sendWebSocketMessage }) => {


    const handleBgClick=(e) => {
        if (e.target==e.currentTarget) {
            onClose();
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50" onClick={handleBgClick} >
            <div className="bg-white rounded-lg w-full max-w-5xl p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">{room?.room_name}</h2>
                </div>
                <div className="modal-content max-h-[700px] overflow-y-auto mr-0.5 space-y-4">
                    <LabelStatus ip_address={room?.ip_address} device_list={room?.device_list} sendWebSocketMessage={sendWebSocketMessage} />
                    <ElementDevices ip_address={room?.ip_address} device_list={room?.device_list} sendWebSocketMessage={sendWebSocketMessage} />
                </div>
            </div>
        </div>
    );
};

export default ModalRoom;
