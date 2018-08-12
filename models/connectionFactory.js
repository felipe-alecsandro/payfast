var mysql = require('mysql');

function createDBConnetion(){

        return mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'payfast'
        });
}

module.exports = function(){
    return createDBConnetion;
}