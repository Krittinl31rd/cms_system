require('dotenv').config();
const { createWebSocketClient }=require('./websocketClient');

const MODBUS_DEVICES=[
    // { ip: '192.168.1.66', port: 502 },
    { ip: '192.168.1.30', port: 502 },
];


createWebSocketClient(process.env.WSS, MODBUS_DEVICES);
