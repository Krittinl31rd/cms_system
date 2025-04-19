import React, { useState, useEffect, useMemo } from "react";
import useCmsStore from '../../store/cmsstore';
import { getDevicesControlLogs } from '../../api/Devices';
import DataTable from "react-data-table-component";

const columns=[
    { name: "Room", selector: row => row.room_name, sortable: true },
    { name: "Device", selector: row => row.device_name, sortable: true },
    { name: "Attribute", selector: row => row.attribute_name, sortable: true },
    { name: "Value", selector: row => row.value, sortable: true },
    { name: "Timestamp", selector: row => row.timestamp, sortable: true },
];

const AdminLogs=() => {
    const { token }=useCmsStore((state) => state);
    const [logs, setLogs]=useState([]);
    const [filterText, setFilterText]=useState("");

    const fetchLogs=async () => {
        try {
            const res=await getDevicesControlLogs(token);
            setLogs(res.data.data||[]);
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        }
    };

    useEffect(() => {
        if (token) fetchLogs();
    }, [token]);

    const filteredData=useMemo(() => {
        return logs.filter(item =>
            item.timestamp?.toLowerCase().includes(filterText.toLowerCase())||
            item.room_name?.toLowerCase().includes(filterText.toLowerCase())||
            item.device_name?.toLowerCase().includes(filterText.toLowerCase())||
            item.attribute_name?.toLowerCase().includes(filterText.toLowerCase())||
            String(item.value).toLowerCase().includes(filterText.toLowerCase())
        );
    }, [logs, filterText]);

    return (
        <div className="p-4 w-full mx-auto">
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search logs..."
                    className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />
            </div>

            <DataTable
                title="Device Control Logs"
                columns={columns}
                data={filteredData}
                pagination
                highlightOnHover
                dense
                striped
                responsive
                persistTableHead
            />
        </div>
    );
};

export default AdminLogs;
