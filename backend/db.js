const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'findhome_db'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('U lidha me databazën!');
});

module.exports = connection;