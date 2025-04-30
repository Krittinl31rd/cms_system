const writeQueues={};

function initQueue(ip) {
    if (!writeQueues[ip]) {
        writeQueues[ip]=[];
    }
}

function addToQueue(ip, writeCommand) {
    initQueue(ip);
    writeQueues[ip].push(writeCommand);
}

function getNextFromQueue(ip) {
    if (writeQueues[ip]&&writeQueues[ip].length>0) {
        return writeQueues[ip].shift();
    }
    return null;
}

function hasQueue(ip) {
    return writeQueues[ip]&&writeQueues[ip].length>0;
}

module.exports={
    addToQueue,
    getNextFromQueue,
    hasQueue,
    initQueue
};
