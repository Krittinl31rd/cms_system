

const LabelStatus=({ device_list }) => {


    return (
        <div className="grid grid-cols-4 gap-2 text-sm">
            {device_list.map((item) =>
                item.type_id==0
                    ? item.attributes.map((attr) => {
                        switch (attr.attr_id) {
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

                            case 1:
                                if (attr.value==1) {
                                    return (
                                        <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-green-200 text-green-700">
                                            <span className="font-bold">Check-In</span>
                                        </span>
                                    );
                                } else {
                                    return (
                                        <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-red-200 text-red-700">
                                            <span className="font-bold">Check-Out</span>
                                        </span>
                                    );
                                }

                            case 2:
                                if (attr.value==0) {
                                    return (
                                        <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-red-200 text-red-700">
                                            <span className="font-bold">Do Not Disturb</span>
                                        </span>
                                    );
                                } if (attr.value==1) {
                                    return (
                                        <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-sky-200 text-sky-700">
                                            <span className="font-bold">Make Up Room</span>
                                        </span>
                                    );
                                } else {
                                    return (
                                        <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-gray-200 text-gray-700">
                                            <span className="font-bold">N/A</span>
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
                                        <span key={attr.attr_id} className="text-center py-2 px-4  font-semibold rounded-xl bg-blue-200 text-blue-700">
                                            <span className="font-bold">ESM</span>
                                        </span>
                                    )
                                }

                            default:
                                return null;
                        }
                    })
                    :[]
            )}
        </div>
    )
}

export default LabelStatus
