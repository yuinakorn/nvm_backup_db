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
const datetime = moment().format('YYYY-MM-DD HH:mm:ss');

const backup_dir = CUR_DIR + '/backup';
const table_list = CUR_DIR + '/tablelist.txt';

fs.readFile(table_list, 'utf8', function (err, data) {
    if (err) throw err;
    var tbl = '';
    for (var i in data.split('\n')) {
        var table = data.split('\n')[i];
        tbl += ' ' + table;
    }
    var cmd = 'mysqldump -h ' + DB_HOST + ' -u root -p' + DB_USER_PASSWORD + ' --databases ' + DB_NAME + ' --tables ' + tbl + ' > ' +
        backup_dir + '/' + DB_NAME + '.sql';
    console.log(cmd);
    let backup_file = backup_dir + '/' + DB_NAME + '.sql';
    console.log(backup_file);

    exec(cmd, function (error) {
        if (error !== null) {
            console.log('exec error: ' + error);
        }
        compress(backup_file);
    });

});

function compress(backup_file) {
    let cmd = 'gzip --force ' + backup_file;
    console.log(cmd);
    exec(cmd, function (error) {
        if (error !== null) {
            console.log('exec error: ' + error);
        }
        console.log('backup && compress success');
        //    write log file
        let log = 'backup success at ' + datetime + '';
        fs.appendFile(backup_dir + '/log.txt', log, function (err) {
                if (err) throw err;
                console.log('log saved');
            }
        );


    });
}

