const { SQLCONNECT } = require('../sql/SQLConnect');  

module.exports = {
    SELECT: function(table, expression = null){
        const connection = SQLCONNECT();
        return new Promise((success, failure) => {
            connection.query(`
            SELECT * FROM ${table}
            ${(expression) ? 'WHERE '+ expression : ``}`, 
            function(error, result){
                if (error){
                    return failure(error);
                }
                return success(result.map(value => {
                    var data = {};
                    for(key in value) data[key] = value[key];
                    return data;
                }));
            })
            connection.end();
        })
    },
    INSERT: function(table, keys, values) {
        const connection = SQLCONNECT();
        return new Promise((success, failure) => {
            connection.query(`
            INSERT INTO ${table} 
            (${keys.join()}) VALUES ("${values.join(`","`)}")`, 
            function(error, result) {
                if (error) {
                    console.log(error)
                    return failure({
                        code: "400", 
                        message: error.message
                    });
                }
                return success({
                    code: 200, 
                    message: "Successfully inserted data!"
                });
            });
            connection.end();
        })
    }
}