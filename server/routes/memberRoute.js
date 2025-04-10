const express=require('express');
const { Login, Register, CurrentMember }=require('../controllers/memberController');
const { AuthCheck, AuthAdmin, AuthEngineer, AuthHousekeeper }=require('../middleware/authCheck');
const router=express.Router();

router.post('/api/login', Login);
router.post('/api/register', Register);
router.post('/api/current-member', AuthCheck, CurrentMember);
router.post('/api/current-admin', AuthCheck, AuthAdmin, CurrentMember);
router.post('/api/current-housekeeper', AuthCheck, AuthHousekeeper, CurrentMember);
router.post('/api/current-engineer', AuthCheck, AuthEngineer, CurrentMember);

module.exports=router;