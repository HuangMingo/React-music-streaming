import { Connection, Request } from 'tedious';

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USERNAME || 'your_username',
      password: process.env.DB_PASSWORD || 'your_password'
    }
  },
  options: {
    database: process.env.DB_NAME || 'master',
    trustServerCertificate: true,
    encrypt: false
  }
};

function createConnection() {
  return new Connection(dbConfig);
}

export function executeQuery(query) {
  return new Promise((resolve, reject) => {
    const connection = createConnection();
    const rows = [];

    connection.on('connect', (err) => {
      if (err) {
        reject(err);
        return;
      }

      const request = new Request(query, (requestErr, rowCount) => {
        connection.close();

        if (requestErr) {
          reject(requestErr);
          return;
        }

        resolve({ rowCount, rows });
      });

      request.on('row', (columns) => {
        const row = {};

        columns.forEach((column) => {
          row[column.metadata.colName] = column.value;
        });

        rows.push(row);
      });

      connection.execSql(request);
    });
  });
}
