const mysql = require("mysql");


// hdc
const hdc = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'hdc'
});

// server 73
const ser73 = mysql.createConnection({
    host: '122.155.219.73',
    user: 'ssjcmi',
    password: 'admin@1234@cmpho',
    database: 'hdc'
});

module.exports = {
    hdc,
    ser73
}