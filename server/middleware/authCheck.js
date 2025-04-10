const jwt=require("jsonwebtoken");
const sequelize=require('../config/db')

exports.AuthCheck=async (req, res, next) => {
    try {
        const headerToken=req.headers.authorization;
        if (!headerToken) {
            return res.status(401).json({ message: "No Token, Authorization" });
        }
        const token=headerToken.split(" ")[1];
        const decode=jwt.verify(token, process.env.JWT_SECRET);
        req.member=decode;
        const member=await sequelize.query(`SELECT * FROM members WHERE email=:email`, {
            replacements: { email: decode.email },
            type: sequelize.QueryTypes.SELECT,
        });
        if (member.length==0) {
            return res.status(400).json({ message: "This account cannot access" });
        }
        next();
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

exports.AuthAdmin=async (req, res, next) => {
    try {
        const { email }=req.member;
        const member=await sequelize.query(`SELECT * FROM members WHERE email=:email`, {
            replacements: { email },
            type: sequelize.QueryTypes.SELECT,
        });
        if (member.length>1||member[0].role!=="admin") {
            return res.status(403).json({ message: "Acess Denied: Admin Only" });
        }
        next();
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error Admin access denied" });
    }
}

exports.AuthHousekeeper=async (req, res, next) => {
    try {
        const { email }=req.member;
        const member=await sequelize.query(`SELECT * FROM members WHERE email=:email`, {
            replacements: { email },
            type: sequelize.QueryTypes.SELECT,
        });
        if (member.length>1||member[0].role!=="housekeeper") {
            return res.status(403).json({ message: "Acess Denied: Housekeeper Only" });
        }
        next();
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error Housekeeper access denied" });
    }
}

exports.AuthEngineer=async (req, res, next) => {
    try {
        const { email }=req.member;
        const member=await sequelize.query(`SELECT * FROM members WHERE email=:email`, {
            replacements: { email },
            type: sequelize.QueryTypes.SELECT,
        });
        if (member.length>1||member[0].role!=="engineer") {
            return res.status(403).json({ message: "Acess Denied: Engineer Only" });
        }
        next();
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error Engineer access denied" });
    }
}