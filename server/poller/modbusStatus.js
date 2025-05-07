
const statusMap=new Map();

function updateModbusStatus(ip, status) {
    const prev=statusMap.get(ip);
    const isChanged=!prev||prev.status!==status
    statusMap.set(ip, { status });
    return isChanged;
}

function getAllModbusStatuses() {
    const result=[];
    for (const [ip, value] of statusMap.entries()) {
        result.push({ ip, ...value });
    }
    return result;
}

module.exports={
    updateModbusStatus,
    getAllModbusStatuses
};
