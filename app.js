const cron = require('node-cron');
const shell = require('shelljs');
const dotenv = require('dotenv');
const moment = require('moment');
const fs = require("fs");
const mysql = require('mysql');

const connection = require('./database.js');

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
let server_name = '150';


// hdc
const connect_hdc = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_USER_PASSWORD,
    database: process.env.DB_NAME
});

// server 73
const connect_ser73 = mysql.createConnection({
    host: process.env.REMOTE_HOST,
    user: process.env.REMOTE_DB_USER,
    password: 'admin@1234@cmpho',
    database: 'hdc'
});


function hdc_time() {
    return new Promise(resolve => {
        let sql = "SELECT p_date FROM hdc_log WHERE p_name = 'end_process' ORDER BY p_date DESC LIMIT 1";
        connection.hdc.query(sql, (err, result) => {
            if (err) throw err;
            resolve(result[0].p_date);
            return result[0].p_date;
        });
    });
}

function serv73_time() {
    return new Promise(resolve => {
        let sql = "SELECT p_date FROM hdc_log WHERE p_name = 'end_process' ORDER BY p_date DESC LIMIT 1";
        connection.ser73.query(sql, (err, result) => {
            if (err) throw err;
            resolve(result[0].p_date);
            return result[0].p_date;
        });
    });
}

async function compare_date() {

    let result = await hdc_time();
    let date1 = result.getTime()
    // console.log(date1);
    const result2 = await serv73_time();
    let date2 = result2.getTime()
    // console.log(date2);

    return date1 === date2;
}

function insert_log(msg) {
    return new Promise(resolve => {
        let sql = "INSERT INTO hdc_log_cm (server_name, process_name, process_date) VALUES (?, ?, ?);";
        let values = [server_name, msg, datetime];

        connection.ser73.query(sql, values, (err, result) => {
            if (err) throw err;
            resolve(result);
            console.log(`record ${msg}`);
        });
    });
}

function callsame() {
    console.log("same");
}

async function call_notsame() {
    console.log("not same");
    let msg = "1_start_process_dumping";
    await insert_log(msg);

    datetime = moment().format('YYYY-MM-DD HH:mm:ss');
    // console.log(datetime + ' 1_start processing');


    fs.readFile(table_list, 'utf8', async function (error, data) {
        if (error) throw error;
        let tbl = '';
        for (let i in data.split('\n')) {
            let table = data.split('\n')[i];
            tbl += ' ' + table;
        }
        let cmd = 'mysqldump -h ' + DB_HOST + ' -u root -p' + DB_USER_PASSWORD + ' -f --databases ' + DB_NAME + ' --tables '
            + tbl + ' > ' + backup_dir + '/' + DB_NAME + '.sql';

        let backup_file = backup_dir + '/' + DB_NAME + '.sql';

        if (shell.exec(cmd).code !== 0) {
            console.log('exec error: ' + error);
        } else {
            let datetime = moment().format('YYYY-MM-DD HH:mm:ss');
            // console.log(datetime + ' 2_mysqldump completed');
            await insert_log("2_mysqldump_completed");
            await compress(backup_file);
        }

    });
}

async function compress(backup_file) {
    let cmd = 'gzip --force ' + backup_file;
    if (shell.exec(cmd).code !== 0) {
        console.log('exec error: ' + error);
    } else {
        datetime = moment().format('YYYY-MM-DD HH:mm:ss');
        // console.log(datetime + ' 3_zip completed');
        await insert_log("3_zip_completed");
        let backup_file_gz = DB_NAME + '.sql.gz';
        await upload(backup_file_gz);
    }
}

async function upload(backup_file_gz) {
    let cmd = 'sshpass -p \"' + ROMOTE_PASSWORD + '\" scp -P ' + SSH_PORT + ' ' + backup_dir + '/' + backup_file_gz
        + ' ' + REMOTE_USER + ':/var/backup/';
    if (shell.exec(cmd).code !== 0) {
        console.log('exec error: ' + error);
    } else {
        datetime = moment().format('YYYY-MM-DD HH:mm:ss');
        // console.log(datetime + ' 4_end process upload done!');
        await insert_log("4_end_process");
        process.exit(0);
    }
}


function check_status() {
    return new Promise(resolve => {
        let sql = "select left(process_name,1) as p_name  from hdc_log_cm order by process_date desc limit 1";
        connection.ser73.query(sql, (err, result) => {
            if (err) throw err;

            if (result.length > 0) {
                resolve(result[0].p_name);
                return result[0].p_name;
            } else {
                resolve('6');
                return '6';
            }
        });
    });
}


async function main() {
    const result_of_compare = await compare_date();
    let result_check_status = await check_status();
    const status_int = parseInt(result_check_status);
    if (result_of_compare) {
        callsame();
    } else if (result_of_compare === false && status_int === 6) {
        console.log(status_int);
        call_notsame();
    } else if (result_of_compare === false && status_int !== 6) {
        console.log(`process is running (${status_int})`);
    } else {
        console.log('error');
    }
}

// cron.schedule(CRON_TIME, () => {
    main();
// });
