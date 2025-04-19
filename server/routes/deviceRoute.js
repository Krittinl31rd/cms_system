const express=require('express');
const { AuthCheck, AuthAdmin, AuthEngineer, AuthHousekeeper }=require('../middleware/authCheck');
const { GetAllDevices, SendRoomStatus, GetDeviceControlLog }=require('../controllers/deviceController');
const router=express.Router();

router.get('/api/get-alldevices', GetAllDevices);
router.post('/api/send-room-status', AuthCheck, SendRoomStatus);
router.get('/api/get-device-control-logs', AuthCheck, GetDeviceControlLog);

module.exports=router;