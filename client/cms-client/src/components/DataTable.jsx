import React, { useState, useEffect } from 'react';

const DataTable=({ data, loading, statusFilter, setStatusFilter }) => {
    const [filterText, setFilterText]=useState('');
    const [currentPage, setCurrentPage]=useState(1);
    const [rowsPerPage, setRowsPerPage]=useState(5);


    const filteredData=data
        ?.filter(row => {
            const matchesText=
                row.room_id?.toString().includes(filterText)||
                row.room_name?.toLowerCase().includes(filterText.toLowerCase());

            const matchesStatus=statusFilter
                ? row.device_list?.find(device => device.device_id==0)?.attributes?.[3]?.value==statusFilter
                :true;

            return matchesText&&matchesStatus;
        })
        ||[];

    const totalPages=Math.ceil(filteredData.length/rowsPerPage);
    const startRow=(currentPage-1)*rowsPerPage+1;
    const endRow=Math.min(currentPage*rowsPerPage, filteredData.length);

    const paginatedData=filteredData.slice(startRow-1, endRow);

    const handlePageChange=(pageNumber) => {
        if (pageNumber>=1&&pageNumber<=totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const handleRowsPerPageChange=(e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    useEffect(() => {
        if (currentPage>totalPages) {
            setCurrentPage(totalPages||1);
        }
    }, [filteredData, totalPages]);


    const handleStatusFilter=(status) => {
        setStatusFilter(status);
    };

    return (
        <div className="w-full space-y-6 p-4">
            <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <input
                    type="text"
                    placeholder="Search Room..."
                    className="border rounded-lg px-4 py-2 w-full sm:w-64 focus:outline-none focus:ring focus:none shadow-sm"
                    value={filterText}
                    onChange={(e) => {
                        setFilterText(e.target.value);
                        setCurrentPage(1);
                    }}
                />

                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold">Rows:</label>
                    <select
                        value={rowsPerPage}
                        onChange={handleRowsPerPageChange}
                        className="border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:none shadow-sm"
                    >
                        {[5, 10, 20, 50].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </div>

            </div>

            <div className="flex flex-wrap gap-4">
                <button
                    onClick={() => handleStatusFilter(1)}
                    className="cursor-pointer px-4 py-2 bg-red-200 text-red-700 rounded-lg hover:bg-red-300"
                >
                    Occupied Dirty
                </button>
                <button
                    onClick={() => handleStatusFilter(2)}
                    className="cursor-pointer px-4 py-2 bg-green-200 text-green-700 rounded-lg hover:bg-green-300"
                >
                    Occupied Clean
                </button>
                <button
                    onClick={() => handleStatusFilter(3)}
                    className="cursor-pointer px-4 py-2 bg-blue-200 text-blue-700 rounded-lg hover:bg-blue-300"
                >
                    Unoccupied Clean
                </button>
                <button
                    onClick={() => handleStatusFilter(4)}
                    className="cursor-pointer px-4 py-2 bg-orange-200 text-orange-700 rounded-lg hover:bg-orange-300"
                >
                    Unoccupied Dirty
                </button>
                <button
                    onClick={() => handleStatusFilter('')}
                    className="cursor-pointer px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                    Reset Filter
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                {loading? (
                    <div className="flex justify-center items-center h-40">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ):(
                    <>
                        <table className="min-w-full text-sm text-gray-700">
                            <thead className="bg-blue-100">
                                <tr>
                                    <th className="text-left py-3 px-4 font-semibold">Room Number</th>
                                    <th className="text-left py-3 px-4 font-semibold">Avaliable</th>
                                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50 transition rounded-md text-lg">
                                        <td className="py-3 px-4">
                                            <span className="font-semibold">{row.room_id}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {(() => {
                                                const value=row.device_list?.find(device => device.device_id==0)?.attributes?.[1]?.value;
                                                if (value==1) {
                                                    return <span className="text-green-500 font-semibold">Check In</span>;
                                                } else if (value==0) {
                                                    return <span className="text-red-500 font-semibold">Check Out</span>;
                                                } else {
                                                    return <span className="text-gray-400 italic">Unknown</span>;
                                                }
                                            })()}
                                        </td>
                                        <td className="py-3 px-4">
                                            {(() => {
                                                const value=row.device_list?.find(device => device.device_id==0)?.attributes?.[3]?.value;
                                                if (value==1) {
                                                    return <span className="text-red-500 font-semibold">Occupied Dirty</span>;
                                                } else if (value==2) {
                                                    return <span className="text-green-500 font-semibold">Occupied Clean</span>;
                                                } else if (value==3) {
                                                    return <span className="text-blue-500 font-semibold">Unoccupied Clean</span>;
                                                } else if (value==4) {
                                                    return <span className="text-orange-500 font-semibold">Unoccupied Dirty</span>;
                                                }
                                                else {
                                                    return <span className="text-gray-400 italic">Unknown</span>;
                                                }
                                            })()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredData.length===0&&(
                            <div className="text-center py-6 text-gray-500">No results found.</div>
                        )}
                    </>
                )}
            </div>

            {/* Pagination */}
            {!loading&&filteredData.length>0&&(
                <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    {/* Showing */}
                    <div className="text-sm text-gray-600">
                        Showing {startRow}–{endRow} of {filteredData.length} results
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage-1)}
                            disabled={currentPage==1}
                            className="px-4 py-2 bg-blue-200 text-blue-700 rounded-lg hover:bg-blue-300 disabled:opacity-50"
                        >
                            Previous
                        </button>

                        <span className="text-sm font-medium">{currentPage} / {totalPages}</span>

                        <button
                            onClick={() => handlePageChange(currentPage+1)}
                            disabled={currentPage==totalPages}
                            className="px-4 py-2 bg-blue-200 text-blue-700 rounded-lg hover:bg-blue-300 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;
