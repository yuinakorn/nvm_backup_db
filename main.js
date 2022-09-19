const cron = require('node-cron');
const shell = require('shelljs');
const dotenv = require('dotenv');
const moment = require('moment');
const fs = require("fs");
const mysql = require('mysql');
// import compare.js
// const compare = require('./compare.js');


dotenv.config();

const DB_HOST = process.env.DB_HOST
const DB_NAME = process.env.DB_NAME
const DB_USER_PASSWORD = process.env.DB_USER_PASSWORD;
const ROMOTE_PASSWORD = process.env.ROMOTE_PASSWORD;
const SSH_PORT = process.env.SSH_PORT;
const REMOTE_USER = process.env.REMOTE_USER;
const CUR_DIR = process.cwd();
const backup_dir = CUR_DIR + '/backup';
const table_list = CUR_DIR + '/tablelist.txt';
const CRON_TIME = process.env.CRON_TIME;

let datetime = moment().format('YYYY-MM-DD HH:mm:ss');
let message = '';

// connect to mysql


cron.schedule(CRON_TIME, function () {

    // let connection = mysql.createConnection({
    //     host: 'localhost',
    //     user: 'root',
    //     password: '123456',
    //     database: 'hdc'
    // });
    //
    // let sql = 'SELECT * FROM `hdc_log` ORDER BY p_date limit 10';
    // connection.query(sql, function (err, result) {
    //     if (err) throw err;
    //     console.log(result);
    // } );

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
                console.log('[1/2] ' + datetime + ' start processing');
                message = 'start process';
                write_log(message);

                fs.readFile(table_list, 'utf8', function (err, data) {
                    if (err) throw err;
                    let tbl = '';
                    for (let i in data.split('\n')) {
                        let table = data.split('\n')[i];
                        tbl += ' ' + table;
                    }
                    let cmd = 'mysqldump -h ' + DB_HOST + ' -u root -p' + DB_USER_PASSWORD + ' --databases ' + DB_NAME + ' --tables '
                        + tbl + ' > ' + backup_dir + '/' + DB_NAME + '.sql';

                    let backup_file = backup_dir + '/' + DB_NAME + '.sql';

                    if (shell.exec(cmd).code !== 0) {
                        console.log('exec error: ' + error);
                        message = 'exec error: ' + error;
                        write_log(message);
                    } else {
                        message = 'mysqldump completed';
                        write_log(message);
                        compress(backup_file);
                    }
                });


                function compress(backup_file) {
                    let cmd = 'gzip --force ' + backup_file;
                    if (shell.exec(cmd).code !== 0) {
                        console.log('exec error: ' + error);
                    } else {
                        datetime = moment().format('YYYY-MM-DD HH:mm:ss');
                        message = 'compress completed';
                        write_log(message);
                        let backup_file_gz = DB_NAME + '.sql.gz';
                        upload(backup_file_gz);
                    }
                }


                function upload(backup_file_gz) {
                    let cmd = 'sshpass -p \"' + ROMOTE_PASSWORD + '\" scp -P ' + SSH_PORT + ' ' + backup_dir + '/' + backup_file_gz
                        + ' ' + REMOTE_USER + ':/var/backup/';
                    if (shell.exec(cmd).code !== 0) {
                        console.log('exec error: ' + error);
                        message = 'exec error: ' + error;
                        write_log(message);
                    } else {
                        datetime = moment().format('YYYY-MM-DD HH:mm:ss');
                        console.log('[2/2] ' + datetime + ' end process upload done!');
                        message = 'end process upload done!';
                        write_log(message);
                    }
                }

                function write_log(message) {
                    datetime = moment().format('YYYY-MM-DD HH:mm:ss');
                    let log = datetime + ' ' + message + "\r\n";
                    fs.appendFile(backup_dir + '/log.txt', log, function (err) {
                            if (err) throw err;
                        }
                    );
                }

            }


        } catch (error) {
            console.log(error);
        }

        connection.end();
        connection2.end();
        // process.exit();

    }

    compare_date();




    // function end_connection() {
    //     connection.end(function (err) {
    //         if (err) {
    //             return console.log('error:' + err.message);
    //         }
    //         console.log('Close the database connection.');
    //     });
    // }

});

