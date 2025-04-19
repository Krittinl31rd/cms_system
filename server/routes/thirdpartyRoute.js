const express=require('express');
const { AuthCheck, AuthAdmin, AuthEngineer, AuthHousekeeper }=require('../middleware/authCheck');
const { GetStatus, ControlLight, ControlAircon, ControlDimmer, GetConfig, UpdateConfig }=require('../controllers/thirdpartyController');
const router=express.Router();

router.get('/rcu-api/status', GetStatus);
router.get('/rcu-api/config', AuthCheck, GetConfig);

router.post('/rcu-api/config', AuthCheck, UpdateConfig);
router.post('/rcu-api/control/light', AuthCheck, ControlLight);
router.post('/rcu-api/control/aircon', AuthCheck, ControlAircon);
router.post('/rcu-api/control/dimmer', AuthCheck, ControlDimmer);


module.exports=router;
