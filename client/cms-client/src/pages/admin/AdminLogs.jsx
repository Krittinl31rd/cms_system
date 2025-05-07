import React, { useState, useEffect, useMemo } from "react";
import useCmsStore from '../../store/cmsstore';
import { getDevicesControlLogs } from '../../api/Devices';
import DataTable from "react-data-table-component";
import { RefreshCcw } from "lucide-react";

const columns=[
    { name: "Room", selector: row => row.room_name, sortable: true },
    { name: "Device", selector: row => row.device_name, sortable: true },
    { name: "Attribute", selector: row => row.attribute_name, sortable: true },
    {
        name: "Value",
        selector: row => row.value,
        sortable: true,
        cell: row => {
            if (row.device_type==888) { //sensor
                if (row.attr_id==0&&!isNaN(row.value)) {
                    return `${(row.value/10).toFixed(1)} °C`;
                } else if (row.attr_id==1&&!isNaN(row.value)) {
                    return `${(row.value/10).toFixed(1)} %`;
                }
            } else if (row.device_type==0) { //roomservice
                if (row.attr_id==0&&!isNaN(row.value)) {
                    return row.value==0? "Off":"On";
                } else if (row.attr_id==1&&!isNaN(row.value)) {
                    return row.value==0? "Check Out":"Check In";
                } else if (row.attr_id==2&&!isNaN(row.value)) {
                    return row.value==0? "Off":"On";
                } else if (row.attr_id==3&&!isNaN(row.value)) {
                    return row.value==1? "Occupied Dirty":row.value==2? "Occupied Clean":row.value==3? "Unoccupied Clean":row.value==4? "Unoccupied Dirty":"Not active";
                } else if (row.attr_id==4&&!isNaN(row.value)) {
                    return row.value==0? "Off":"On";
                } else if (row.attr_id==5&&!isNaN(row.value)) {
                    return row.value==0? "Off":"On";
                } else if (row.attr_id==6&&!isNaN(row.value)) {
                    return row.value==0? "Off":"On";
                } else if (row.attr_id==7&&!isNaN(row.value)) {
                    return row.value==0? "Off":"On";
                } else if (row.attr_id==8&&!isNaN(row.value)) {
                    return row.value==0? "Off":"On";
                } else if (row.attr_id==9&&!isNaN(row.value)) {
                    return row.value==0? "Off":"On";
                } else if (row.attr_id==10&&!isNaN(row.value)) {
                    return `ESM${row.value}`;
                } else if (row.attr_id==11&&!isNaN(row.value)) {
                    return row.value==0? "Off":"On";
                }
            } else if (row.device_type==1) { //air
                if (row.attr_id==0&&!isNaN(row.value)) {
                    return row.value==0? "Offline":"Online";
                } else if (row.attr_id==1&&!isNaN(row.value)) {
                    return row.value==1? "Low":row.value==2? "Medium":row.value==3? "High":row.value==0? "Off":row.value;
                } else if (row.attr_id==2&&!isNaN(row.value)) {
                    return `${row.value} °C`
                } else if (row.attr_id==3&&!isNaN(row.value)) {
                    return `${row.value} °C`
                }
            } else if (row.device_type==3) { //dim
                if (row.attr_id==0&&!isNaN(row.value)) {
                    return row.value==0? "Offline":"Online";
                } else if (row.attr_id==1&&!isNaN(row.value)) {
                    return row.value==0? "Off":`${row.value} %`;
                }
            } else if (row.device_type==4) { //light
                if (row.attr_id==0&&!isNaN(row.value)) {
                    return row.value==0? "Offline":"Online";
                } else if (row.attr_id==1&&!isNaN(row.value)) {
                    return row.value==0? "Off":"On";
                }
            } else if (row.device_type==7) { //power cons
                if (row.attr_id==0&&!isNaN(row.value)) {
                    return (row.value/10).toFixed(2)
                } else if (row.attr_id==1&&!isNaN(row.value)) {
                    return (row.value/1000).toFixed(2)
                } else if (row.attr_id==2&&!isNaN(row.value)) {
                    return (row.value/10).toFixed(2)
                } else if (row.attr_id==3&&!isNaN(row.value)) {
                    return (row.value/100).toFixed(2)
                } else if (row.attr_id==4&&!isNaN(row.value)) {
                    return (row.value/100).toFixed(2)
                } else if (row.attr_id==5&&!isNaN(row.value)) {
                    return (row.value/10).toFixed(2)
                }
            } else if (row.device_type==999) { //config
                if ([6, 7, 15, 18, 25, 26, 27, 29, 30].includes(row.attr_id)) {
                    const minutes=Math.floor(row.value/60);
                    const seconds=row.value%60;
                    return `${minutes}m ${seconds}s`;
                }
            }
            return row.value;
        }
    },
    {
        name: "source", selector: row => row.username, sortable: true,
        cell: row => {
            if (row.username==null) return "system";
            return row.username;
        }
    },
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
