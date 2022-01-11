const fs = require('fs');

class Table {
    _entries = [];
    rows = [];

    constructor(file) {
        if (!fs.existsSync(file)) return {};
        const lines = fs.readFileSync(file).toString().split('\n');
        const headers = lines.shift().split(',');
        this._entries = lines;

        for(let i = 0; i < lines.length; i++){
            const row = lines[i].split(',');
            const obj = {};
            for(let j = 0; j < row.length; j++)
                obj[headers[j].replace(/\n|\r/g, '')] = row[j].replace(/\n|\r/g, '');
            this.rows.push(obj);
        }
    }

    async query(query){
        const rows = [...this.rows];
        const filteredRows = [];

        const operation = query.split(' ')[0].toLowerCase();

        let condition;
        if(query.includes('WHERE')){
            condition = query.split('WHERE')[1].trim();
            const conditions = condition.split('AND');
            for(let i = 0; i < conditions.length; i++){
                let [ key, comparison, value ] = conditions[i].split(/(=|!=|<=|>=|<|>)/);
                [ key, comparison, value ] = [ key.trim(), comparison?.trim(), value?.trim() ];
                switch(comparison){
                    case '=':
                        rows.forEach(row => {
                            if(row[key] !== value) rows.splice(rows.indexOf(row), 1);
                        });
                    break;
                    case '!=':
                        rows.forEach(row => {
                            if(row[key] === value) rows.splice(rows.indexOf(row), 1);
                        });
                    break;
                    case '>':
                        rows.forEach(row => {
                            if(parseInt(row[key]) < value) rows.splice(rows.indexOf(row), 1);
                        });
                    break;
                    case '<':
                        rows.forEach(row => {
                            if(parseInt(row[key]) > value) rows.splice(rows.indexOf(row), 1);
                        });
                    break;
                    case '>=':
                        rows.forEach(row => {
                            if(parseInt(row[key]) <= value) rows.splice(rows.indexOf(row), 1);
                        });
                    break;
                    case '<=':
                        rows.forEach(row => {
                            if(parseInt(row[key]) >= value) rows.splice(rows.indexOf(row), 1);
                        });
                    break;
                    case undefined:
                        rows.forEach(row => {
                            if(row[key] !== 'undefined' && row[key] !== 'null') filteredRows.push(row);
                        });
                    break;
                }
            }
        }

        const result = [];
        switch(operation){
            case 'select': {
                const column = query.split(' ')[1];
                if(column === '*') return rows;

                for(let i = 0; i < rows.length; i++){
                    const row = rows[i];
                    if(rows[i].hasOwnProperty(column)) result.push(row[column]);
                }
                return result;
            }
        }
    }
}

module.exports = Table;