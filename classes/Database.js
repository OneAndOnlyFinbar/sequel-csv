const Table = require('./Table');
const Query = require('./Query.js');

/**
 * Database class
 * @description Instantiate a database class.
 */

class Database{
    _tables = [];
    constructor(){

    }
    /**
     * @param {string} path Path to csv file
     * @param {string} [name] Name of table
     */
    registerSchema(path, name){
        const table = new Table(path);
        if(name?.length > 0) table._name = name;
        this._tables.push(table);
    }
    /**
     * @param {string} query Database
     * @param {Array} [args] Arguments
     * @returns {Object}
     */
    async query(query, args){
        const tableName = query.match(/\s(FROM|INTO|UPDATE)\s(\w+)/i)[2];
        const table = this._tables.find(table => table._name === tableName);
        if(!table) throw new Error(`Table ${tableName} not found`);
        new Query(query, args, table);
        query = query.replace(/\s(FROM|INTO|UPDATE)\s(\w+)/i, '');
        return table.query(query, args);
    }
}

module.exports = Database;