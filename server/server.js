require("dotenv").config();
const express=require('express');
const morgan=require('morgan');
const cors=require('cors');
const { readdirSync }=require("fs");
const { wss }=require('./websocketServer');

const app=express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));

readdirSync("./routes/").map((c) => {
    app.use(require("./routes/"+c))
});

const port=process.env.API_PORT;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`WebSocket server running on port ${process.env.WS_PORT}`);
});



