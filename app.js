// require dotenv
const dotenv = require('dotenv');
const moment = require('moment');
const fs = require("fs");
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

const backup_dir = CUR_DIR + '/backup';
const table_list = CUR_DIR + '/tablelist.txt';

console.log('[1/5] ' + datetime + ' start processing');

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

    exec(cmd, function (error) {
        if (error !== null) {
            console.log('exec error: ' + error);
            let log = datetime + ' mysql dump error' + "\r\n";
            fs.appendFile(backup_dir + '/log.txt', log, function (err) {
                    if (err) throw err;
                }
            );
        }
        compress(backup_file);
    });

});

function compress(backup_file) {
    let cmd = 'gzip --force ' + backup_file;
    exec(cmd, async function (error) {
        if (error !== null) {
            console.log('exec error: ' + error);
        }
        datetime = moment().format('YYYY-MM-DD HH:mm:ss');
        console.log('[2/5] ' + datetime + ' backup && compress completed');
        console.log('[3/5] ' + datetime + ' log saved');
        write_log();
        let backup_file_gz = DB_NAME + '.sql.gz';
        upload(backup_file_gz);

    });
}

// upload to server
function upload(backup_file_gz) {
    let cmd = 'sshpass -p \"' + ROMOTE_PASSWORD + '\" scp -P ' + SSH_PORT + ' ' + backup_dir + '/' + backup_file_gz
        + ' ' + REMOTE_USER + ':/var/backup/';
    datetime = moment().format('YYYY-MM-DD HH:mm:ss');
    console.log('[4/5] ' + datetime + ' start upload');

    exec(cmd, function (error) {
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {
                datetime = moment().format('YYYY-MM-DD HH:mm:ss');
                console.log('[5/5] ' + datetime + ' upload completed');
            }

        }
    );
}

// write log
function write_log() {
    //    write log file
    datetime = moment().format('YYYY-MM-DD HH:mm:ss');
    let log = datetime + ' backup completed' + "\r\n";
    fs.appendFile(backup_dir + '/log.txt', log, function (err) {
            if (err) throw err;
        }
    );
}

