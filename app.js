const dotenv = require('dotenv');
const moment = require('moment');
const fs = require("fs");
const shell = require("shelljs");
const exec = require('child_process').exec;


// load env
dotenv.config();
// get env
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
