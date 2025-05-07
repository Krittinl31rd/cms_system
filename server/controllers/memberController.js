const sequelize=require('../config/db')
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');

exports.Login=async (req, res) => {
    try {
        const { username, password }=req.body
        const querySearch=`
            SELECT * FROM members WHERE username=:username
        `;
        const results=await sequelize.query(querySearch, {
            replacements: { username },
            type: sequelize.QueryTypes.SELECT
        })
        if (results.length==0) {
            return res.status(400).json({ message: 'Invalid username or password' })
        }

        const isMatch=await bcrypt.compare(password, results[0].password_hash)
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' })
        }

        const payload={
            id: results[0].id,
            username: results[0].username,
            email: results[0].email,
            role: results[0].role
        }

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }, (err, token) => {
            if (err) {
                return res.status(500).json({ message: 'Internal server error' })
            }
            res.status(200).json({ message: 'Login successful', payload, token })
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error' })
    }
}

exports.Register=async (req, res) => {
    try {
        const { username, password, email, role }=req.body
        const querySearch=`
            SELECT * FROM members WHERE email=:email
        `;
        const results=await sequelize.query(querySearch, {
            replacements: { email },
            type: sequelize.QueryTypes.SELECT
        })
        if (results.length>0) {
            return res.status(400).json({ message: 'Email already exists' })
        }

        const password_hash=await bcrypt.hash(password, 10)
        const queryInsert=`
            INSERT INTO members (username, password_hash, email, role) VALUES (:username, :password_hash, :email, :role)
        `;
        await sequelize.query(queryInsert, {
            replacements: { username, password_hash, email, role },
            type: sequelize.QueryTypes.INSERT
        })

        res.status(200).json({ message: 'Register successful' })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error' })
    }
}

exports.CurrentMember=async (req, res) => {
    try {
        const query=`
            SELECT * FROM members WHERE username=:username
        `;
        const result=await sequelize.query(query, {
            replacements: { username: req.member.username },
            type: sequelize.QueryTypes.SELECT
        })
        res.status(200).json({ message: 'Get current member successful', member: result[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal server error' })
    }
}



exports.GatewayLogin=async (username, password) => {
    try {
        const querySearch=`
            SELECT * FROM members WHERE username=:username
        `;
        const results=await sequelize.query(querySearch, {
            replacements: { username },
            type: sequelize.QueryTypes.SELECT
        });
        if (results.length==0) {
            throw new Error("Invalid username or password");
        }

        const isMatch=await bcrypt.compare(password, results[0].password_hash);
        if (!isMatch) {
            throw new Error("Invalid username or password");
        }

        const payload={
            id: results[0].id,
            username: results[0].username,
            email: results[0].email,
            role: results[0].role
        };

        const token=await new Promise((resolve, reject) => {
            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1y' }, (err, token) => {
                if (err) reject(new Error("Internal server error"));
                else resolve(token);
            });
        });
        return { token };
    } catch (err) {
        console.log(err);
        throw err;
    }
};