const fs = require('fs');
const escapeString = require('../utils/escapeString.js');

class Table {
    _entries = [];
    _path = null;
    _name = null;
    rows = [];

    constructor(file) {
        if (!fs.existsSync(file)) return {};
        const lines = fs.readFileSync(file).toString().split('\n');
        const headers = lines.shift().split(',');
        this._entries = lines;
        this._path = file;
        this._name = file.split('/').pop().split('.')[0];

        for(let i = 0; i < lines.length; i++){
            const row = lines[i].split(',');
            const obj = {};
            for(let j = 0; j < row.length; j++)
                obj[headers[j].replace(/\n|\r/g, '')] = row[j].replace(/\n|\r/g, '');
            this.rows.push(obj);
        }
    }

    /**
     * @returns {Object} ?[]<Row>
     * @param {String} query Query
     * @param {Array} [args] []Params
     **/
    async query(query, args){
        let rows = [...this.rows];
        const filteredRows = [...rows];

        if(!args) args = [];

        if(query.match(/\?/) ? query.match(/\?/) : 0 !== args.length) return console.log(`ERR: Query arguments do not match query placeholders in query "${query}"`);
        for(let i = 0; i < args.length; i++){
            query = query.replace('?', args[i]);
        }

        let condition;
        if(query.includes('WHERE')){
            condition = query.split('WHERE')[1].trim();
            const conditions = condition.split('AND');
            for(let i = 0; i < conditions.length; i++){
                let components = conditions[i].split(/(=|<>|<=|>=|<|>|IS NULL|IS NOT NULL)/);
                let key = components[0].trim();
                let comparison = components[1].trim();
                let value = components[2].trim().match(/(["'])(?:(?=(\\?))\2.)*?\1/g) ? escapeString(components[2].trim().match(/(["'])(?:(?=(\\?))\2.)*?\1/g)[0].replaceAll(/['"]/g, '')) : escapeString(components[2].trim());

                const toRemove = [];
                switch(comparison){
                    case '=':
                        filteredRows.forEach(row => {
                            if(row[key] !== value) toRemove.push(row);
                        });
                        break;
                    case '<>':
                        filteredRows.forEach(row => {
                            if(row[key] === value) toRemove.push(row);
                        });
                        break;
                    case '>':
                        filteredRows.forEach(row => {
                            if(parseInt(row[key]) <= value) toRemove.push(row);
                        });
                        break;
                    case '<':
                        filteredRows.forEach(row => {
                            if(parseInt(row[key]) >= value) toRemove.push(row);
                        });
                        break;
                    case '>=':
                        filteredRows.forEach(row => {
                            if(parseInt(row[key]) < value) toRemove.push(row);
                        });
                        break;
                    case '<=':
                        filteredRows.forEach(row => {
                            if(parseInt(row[key]) > value) toRemove.push(row);
                        });
                        break;
                    case 'IS NULL':
                        filteredRows.forEach(row => {
                            if(![undefined, null, 'undefined', 'null'].includes(row[key])) toRemove.push(row);
                        });
                        break;
                    case 'IS NOT NULL':
                        filteredRows.forEach(row => {
                            if([undefined, null, 'undefined', 'null'].includes(row[key])) toRemove.push(row);
                        });
                        break;
                }
                toRemove.forEach(row => {
                    filteredRows.splice(filteredRows.indexOf(row), 1);
                });
            }
        }

        const operation = query.toString().split(' ')[0].toLowerCase();
        switch(operation){
            case 'select': {
                const column = query.toString().split(' ')[1];
                if(column === '*') return filteredRows;
                const maxRegex = /MAX\(([^)]+)\)/g;
                const minRegex = /MIN\(([^)]+)\)/g;

                if(maxRegex.test(column)){
                    const maxColumn = column.match(maxRegex)[0].replace('MAX(', '').replace(')', '');
                    return await new Promise(resolve => {
                        let max = 0;
                        filteredRows.forEach(row => {
                            if(!max || parseInt(row[maxColumn]) > parseInt(max)) max = row[maxColumn];
                        });
                        resolve(max);
                    });
                }

                if(minRegex.test(column)){
                    const minColumn = column.match(minRegex)[0].replace('MIN(', '').replace(')', '');
                    return await new Promise(resolve => {
                        let min = 0;
                        filteredRows.forEach(row => {
                            if(!min || parseInt(row[minColumn]) < parseInt(min)) min = row[minColumn];
                        });
                        resolve(min);
                    });
                }

                return [...filteredRows].map(row => row[column]);
            }
            case 'insert': {
                const columns = query.split('(')[1].split(')')[0].split(',');
                const values = query.split('VALUES')[1].toString().replaceAll(/[()]/g, '');
                if(columns.length !== values.split(',').length) return console.error(`ERR: Mismatch in columns count and values count. "${query}".`);
                let rowString = '';
                for(let i = 0; i < columns.length; i++)
                    rowString += i ? `${values.split(',')[i].trim()}` : `${values.split(',')[i].trim()},`;
                rowString = rowString.replaceAll(/['"]/g, '');
                fs.appendFileSync(this._path, `\n${rowString}`);
            }
        }
    }
}

module.exports = Table;