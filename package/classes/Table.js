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
        let rows = [...this.rows];
        const filteredRows = [...rows];

        let condition;
        if(query.includes('WHERE')){
            condition = query.split('WHERE')[1].trim();
            const conditions = condition.split('AND');
            for(let i = 0; i < conditions.length; i++){
                let components = conditions[i].split(/(=|!=|<=|>=|<|>)/);
                let key = components[0].trim();
                let comparison = components[1].trim();
                let value = components[2].trim().split(' ')[0];

                const toRemove = [];

                switch(comparison){
                    case '=':
                        filteredRows.forEach(row => {
                            if(row[key] !== value) toRemove.push(row);
                        });
                    break;
                    case '!=':
                        filteredRows.forEach(row => {
                            if(row[key] === value && filteredRows.includes(row)){
                                filteredRows.push(row);
                                filteredRows.splice(filteredRows.indexOf(row), 1);
                            }
                        });
                    break;
                    case '>':
                        filteredRows.forEach(row => {
                            if(parseInt(row[key]) < value && filteredRows.includes(row)){
                                filteredRows.push(row);
                                filteredRows.splice(filteredRows.indexOf(row), 1);
                            }
                        });
                    break;
                    case '<':
                        filteredRows.forEach(row => {
                            if(parseInt(row[key]) > value && filteredRows.includes(row)){
                                filteredRows.push(row);
                                filteredRows.splice(filteredRows.indexOf(row), 1);
                            }
                        });
                    break;
                    case '>=':
                        filteredRows.forEach(row => {
                            if(parseInt(row[key]) <= value && filteredRows.includes(row)){
                                filteredRows.push(row);
                                filteredRows.splice(filteredRows.indexOf(row), 1);
                            }
                        });
                    break;
                    case '<=':
                        filteredRows.forEach(row => {
                            if(parseInt(row[key]) >= value && filteredRows.includes(row)){
                                filteredRows.push(row);
                                filteredRows.splice(filteredRows.indexOf(row), 1);
                            }
                        });
                    break;
                }
                toRemove.forEach(row => {
                    filteredRows.splice(filteredRows.indexOf(row), 1);
                });
            }
        }

        const operation = query.split(' ')[0].toLowerCase();
        switch(operation){
            case 'select': {
                const column = query.split(' ')[1];
                if(column === '*') return filteredRows;

                for(let i = 0; i < filteredRows.length; i++){
                    const row = filteredRows[i];
                    if(filteredRows[i].hasOwnProperty(column)) result.push(row[column]);
                }
                return filteredRows;
            }
        }
    }
}

module.exports = Table;