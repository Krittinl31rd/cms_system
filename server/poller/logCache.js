const logCache=new Map();

function shouldLog(ip, address, intervalSeconds) {
    const key=`${ip}_${address}`;
    const now=Date.now();
    const lastLogged=logCache.get(key)||0;

    if (now-lastLogged>=intervalSeconds*1000) {
        logCache.set(key, now);
        return true;
    }
    return false;
}



module.exports={
    shouldLog,
};
