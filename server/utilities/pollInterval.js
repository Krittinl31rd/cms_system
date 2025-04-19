
let pollIntervals=[];

function addPollInterval(entry) {
    pollIntervals.push(entry);
}

function removePollInterval(ip, port) {
    pollIntervals=pollIntervals.filter(item => !(item.ip==ip&&item.port==port));
}

function getPollIntervals() {
    return pollIntervals;
}

module.exports={ addPollInterval, removePollInterval, getPollIntervals };
