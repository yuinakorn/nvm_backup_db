const cron = require('node-cron');
const shell = require('shelljs');
const dotenv = require('dotenv');
const moment = require('moment');
const fs = require("fs");

dotenv.config();
const DB_HOST = process.env.DB_HOST
const DB_NAME = process.env.DB_NAME
const DB_USER_PASSWORD = process.env.DB_USER_PASSWORD;
const ROMOTE_PASSWORD = process.env.ROMOTE_PASSWORD;
const SSH_PORT = process.env.SSH_PORT;
const REMOTE_USER = process.env.REMOTE_USER;
const CUR_DIR = process.cwd();
let datetime = moment().format('YYYY-MM-DD HH:mm:ss');
let message = '';
const backup_dir = CUR_DIR + '/backup';
const table_list = CUR_DIR + '/tablelist.txt';



cron.schedule('15 19 * * *', function() {
    console.log('---------------------');
    console.log('[1/5] ' + datetime + ' start processing');
    message = 'start process';
    write_log(message);
    if (shell.exec('echo test shell').code !== 0) {
        shell.exit(1);
    }
    else {
        shell.echo('Database backup complete');
    }
});

function write_log(message) {
    //    write log file
    datetime = moment().format('YYYY-MM-DD HH:mm:ss');
    let log = datetime + ' ' + message + "\r\n";
    fs.appendFile(backup_dir + '/log.txt', log, function (err) {
            if (err) throw err;
        }
    );
}