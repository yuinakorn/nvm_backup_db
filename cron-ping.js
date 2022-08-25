const cron = require('node-cron');
const moment = require("moment");
const fs = require("fs");
let datetime = '';
// Schedule tasks to be run on the server.
cron.schedule('* * * * *', function() {
    console.log('running a task every minute');
    // write log
    write_log('running a task every minute');

});

function write_log(message) {
    //    write log file
    datetime = moment().format('YYYY-MM-DD HH:mm:ss');
    let log = datetime + ' '+ message + "\r\n";
    fs.appendFile(backup_dir + '/hi.txt', log, function (err) {
            if (err) throw err;
        }
    );
}