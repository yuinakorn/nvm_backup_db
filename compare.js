const mysql = require("mysql");
// hdc
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'hdc'
});

// server 73
let connection2 = mysql.createConnection({
    host: '122.155.219.73',
    user: 'ssjcmi',
    password: 'admin@1234@cmpho',
    database: 'hdc'
});

let sql = "SELECT p_date FROM hdc_log WHERE p_name = 'end_process' ORDER BY p_date DESC LIMIT 1";


async function compare_date() {

    try {
        let data1 = await new Promise((resolve, reject) => {
                connection.query(sql, function (err, result) {
                    if (err) throw err;
                    resolve(result[0].p_date);
                });
            }
        );

        let data2 = await new Promise((resolve, reject) => {
                connection2.query(sql, function (err, result) {
                    if (err) throw err;
                    resolve(result[0].p_date);
                });
            }
        );


        if (data1.getTime() === data2.getTime()) {
            console.log('same');
        } else {
            console.log('different');
        }


    } catch (error) {
        console.log(error);
    }

    end_connection();
}


compare_date();

function end_connection() {
    connection.end(function (err) {
        if (err) {
            return console.log('error:' + err.message);
        }
        console.log('Close the database connection.');
        process.exit();
    });
}