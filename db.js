const mssql = require('mssql');

var config = {
    user: DB_USER,
    password: DB_PASSWORD,
    server: DB_SERVER,
    database: DB_DATABASE,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        trustServerCertificate: true
    }
}

var actualizarRegistro = (id, calificacion) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('id', id)
                .input('calificacion', calificacion)
                .execute('SP_ACTUALIZAR_REGISTRO')
        })
            .then(result => {
                resolve({ 'response': result });
            })
            .catch(err => {
                reject({ 'Error': err });
            })
    });
}

module.exports = {
    actualizarRegistro: actualizarRegistro
}