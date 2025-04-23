import React, { useState, useEffect, useMemo } from "react";
import useCmsStore from '../../store/cmsstore';
import { getDevicesControlLogs } from '../../api/Devices';
import DataTable from "react-data-table-component";
import { RefreshCcw } from "lucide-react";

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
    const [isRefreshing, setIsRefreshing]=useState(false);

    const fetchLogs=async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            const res=await getDevicesControlLogs(token);
            setLogs(res.data.data||[]);
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        } finally {
            setTimeout(() => {
                setIsRefreshing(false);
            }, 2000);
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
            <div className="w-full flex items-center justify-end mb-4">
                <button
                    onClick={fetchLogs}
                    disabled={isRefreshing}
                    className={`border p-1 rounded-lg ${isRefreshing? 'opacity-50 cursor-not-allowed':'cursor-pointer'}`}
                    title={isRefreshing? "Please wait...":"Refresh logs"}
                >
                    <RefreshCcw size={16} />
                </button>
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
