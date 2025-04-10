const { Sequelize }=require('sequelize');

const sequelize=new Sequelize(process.env.DB_NAME, process.env.DB_HOST, process.env.DB_PASSWORD, {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
});

const testConnection=async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection to SQL has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

testConnection();

module.exports=sequelize;