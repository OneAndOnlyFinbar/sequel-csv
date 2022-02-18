const fs = require('fs');
const escapeString = require('../utils/escapeString.js');

class Table {
    _path = null;
    _name = null;
    _headers = [];
    _entries = [];
    rows = [];

    constructor(file) {
        if (!fs.existsSync(file)) return {};
        const lines = fs.readFileSync(file).toString().split('\n');
        const headers = lines.shift().split(',');
        this._headers = headers;
        this._entries = lines;
        this._path = file;
        this._name = file.split('/').pop().split('.')[0];

        for(let i = 0; i < lines.length; i++){
            const row = lines[i].split(',');
            const obj = {};
            for(let j = 0; j < row.length; j++)
                obj[headers[j].replace(/[\n\r]/g, '')] = row[j].replace(/[\n\r]/g, '');
            this.rows.push(obj);
        }
    }

    /**
     * @returns {Object} []<Row>
     * @param {String} query Query
     * @param {Array} [args] []Params
     **/
    async query(query, args){
        let rows = [...this.rows];
        let filteredRows = [...rows];

        if(!args) args = [];

        for(let i = 0; i < args.length; i++)
            query = query.replace('?', args[i]);

        if(query.includes('WHERE')){
            let condition;
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
                const querySequential = query.toString().split(' ').splice(1);
                const columns = [];
                for(let i = 0; i < querySequential.length; i++){
                    if(['WHERE', 'FROM'].includes(querySequential[i])) break
                    else columns.push(querySequential[i]);
                }

                if(query.toString().includes('ORDER BY')){
                    const orderBy = query.toString().split('ORDER BY')[1].trim();
                    const orderByComponents = orderBy.split(' ');
                    const orderByKey = orderByComponents[0];
                    const orderByDirection = orderByComponents[1];
                    filteredRows.sort((a, b) => {
                        if(orderByDirection === 'ASC'){
                            if(a[orderByKey] < b[orderByKey]) return -1;
                            else if(a[orderByKey] > b[orderByKey]) return 1;
                            else return 0;
                        }
                        else if(orderByDirection === 'DESC'){
                            if(a[orderByKey] < b[orderByKey]) return 1;
                            else if(a[orderByKey] > b[orderByKey]) return -1;
                            else return 0;
                        }
                    });
                }

                if(query.includes('LIMIT')){
                    const limit = query.toString().split('LIMIT')[1].trim();
                    filteredRows = filteredRows.slice(0, parseInt(limit));
                }

                if(columns[0] === '*') return filteredRows;

                let realColumns = Array.from(columns);
                for(let i = 0; i < realColumns.length; i++) if(realColumns[i].includes('AS')) realColumns.splice(i, 2);

                if(realColumns.length > 1){
                    const returnRows = [];
                    let aliasedAggregateFunction = false;
                    for(let i = 0; i < columns.length; i++){
                        const column = columns[i].replaceAll(',', '');
                        const alias = query.split(`${column} AS`)?.[1] ? query.split(`${column} AS`)[1].trim().split(' ')[0].trim().replaceAll(',', '') : null;
                        const maxRegex = /MAX\(([^)]+)\)/g;
                        const minRegex = /MIN\(([^)]+)\)/g;

                        if(maxRegex.test(column)){
                            const maxColumn = column.match(maxRegex)[0].replace('MAX(', '').replace(')', '');
                            const returnOBJ = {};
                            let max = 0;
                            filteredRows.forEach(row => {
                                if(!max || parseInt(row[maxColumn]) > parseInt(max)) max = row[maxColumn];
                            });
                            if(alias) returnOBJ[alias] = max;
                            else returnOBJ[maxColumn] = max;
                            returnRows.push(returnOBJ);
                            aliasedAggregateFunction = true;
                        }

                        if(minRegex.test(column)){
                            const minColumn = column.match(minRegex)[0].replace('MIN(', '').replace(')', '').split(' ')[0];
                            const returnOBJ = {};
                            let min = 0;
                            filteredRows.forEach(row => {
                                if(!min || parseInt(row[minColumn]) < parseInt(min)) min = row[minColumn];
                            });
                            if(alias) returnOBJ[alias] = min;
                            else returnOBJ[minColumn] = min;
                            returnRows.push(returnOBJ);
                            aliasedAggregateFunction = true;
                        }
                    }

                    for(let i = 0; i < filteredRows.length; i++){
                        const filteredRow = {};
                        for(let j = 0; j < columns.length; j++){
                            const column = columns[j].replaceAll(',', '');
                            const alias = query.split(`${column} AS`)?.[1] ? query.split(`${column} AS`)[1].trim().split(' ')[0].trim().replaceAll(',', '') : null;
                            if([alias, 'AS'].includes(column)) continue;
                            if(alias && !aliasedAggregateFunction){
                                filteredRow[alias] = filteredRows[i][column];
                            }else{
                                if(filteredRows[i]?.[column]) filteredRow[column] = filteredRows[i][column];
                            }
                        }
                        returnRows.push(filteredRow);
                    }
                    return returnRows;
                }else{
                    const column = columns[0];
                    const alias = query.split(`${column} AS`)?.[1] ? query.split(`${column} AS`)[1].trim().split(' ')[0].trim() : null;

                    const maxRegex = /MAX\(([^)]+)\)/g;
                    const minRegex = /MIN\(([^)]+)\)/g;
                    const avgRegex = /AVG\(([^)]+)\)/g;
                    const countRegex = /COUNT\(([^)]+)\)/g;
                    const standardDeviationRegex = /STDEV\(([^)]+)\)/g;
                    const sumRegex = /SUM\(([^)]+)\)/g;

                    if(maxRegex.test(column)){
                        const maxColumn = column.match(maxRegex)[0].replace('MAX(', '').replace(')', '');
                        const returnOBJ = {};
                        return await new Promise(resolve => {
                            let max = 0;
                            filteredRows.forEach(row => {
                                if(!max || parseInt(row[maxColumn]) > parseInt(max)) max = row[maxColumn];
                            });
                            alias ? returnOBJ[alias] = max : returnOBJ[maxColumn] = max;
                            resolve(returnOBJ);
                        });
                    }

                    if(minRegex.test(column)){
                        const minColumn = column.match(minRegex)[0].replace('MIN(', '').replace(')', '').split(' ')[0];
                        const returnOBJ = {};
                        return await new Promise(resolve => {
                            let min = 0;
                            filteredRows.forEach(row => {
                                if(!min || parseInt(row[minColumn]) < parseInt(min)) min = row[minColumn];
                            });
                            alias ? returnOBJ[alias] = min : returnOBJ[minColumn] = min;
                            resolve(returnOBJ);
                        });
                    }

                    if(avgRegex.test(column)){
                        const avgColumn = column.match(avgRegex)[0].replace('AVG(', '').replace(')', '').split(' ')[0];
                        const returnOBJ = {};
                        return await new Promise(resolve => {
                            let avg = 0;
                            filteredRows.forEach(row => {
                                avg += parseInt(row[avgColumn]);
                            });
                            avg = avg / filteredRows.length;
                            alias ? returnOBJ[alias] = avg : returnOBJ[avgColumn] = avg;
                            resolve(returnOBJ);
                        });
                    }

                    if(countRegex.test(column)){
                        const obj = {};
                        alias ? obj[alias] = filteredRows.length : obj[column] = filteredRows.length;
                        return obj;
                    }

                    if(standardDeviationRegex.test(column)){
                        const avgColumn = column.match(standardDeviationRegex)[0].replace('STDEV(', '').replace(')', '').split(' ')[0];
                        const returnOBJ = {};
                        return await new Promise(resolve => {
                            let avg = 0;
                            filteredRows.forEach(row => {
                                avg += parseInt(row[avgColumn]);
                            });
                            avg = avg / filteredRows.length;
                            let sum = 0;
                            filteredRows.forEach(row => {
                                sum += Math.pow(parseInt(row[avgColumn]) - avg, 2);
                            });
                            const standardDeviation = Math.sqrt(sum / filteredRows.length);
                            alias ? returnOBJ[alias] = standardDeviation : returnOBJ[avgColumn] = standardDeviation;
                            resolve(returnOBJ);
                        });
                    }

                    if(sumRegex.test(column)){
                        const sumColumn = column.match(sumRegex)[0].replace('SUM(', '').replace(')', '').split(' ')[0];
                        const returnOBJ = {};
                        return await new Promise(resolve => {
                            let sum = 0;
                            filteredRows.forEach(row => {
                                sum += parseInt(row[sumColumn]);
                            });
                            alias ? returnOBJ[alias] = sum : returnOBJ[sumColumn] = sum;
                            resolve(returnOBJ);
                        });
                    }

                    const result = [];
                    filteredRows
                        .map(row => row[column])
                        .forEach(value => {
                            let obj = {};
                            alias ? obj[alias] = value : obj[column] = value;
                            result.push(obj);
                        });
                    return result;
                }
            }
            case 'insert': {
                let columns = query.split('(')[1].split(')')[0].split(',');
                columns = columns.map(column => column.trim());
                let values = query.split('VALUES')[1].toString().replaceAll(/[()]/g, '').trim().split(',');
                let rowString = '';
                for(let i = 0; i < this._headers.length; i++){
                    if(columns.includes(this._headers[i]))
                        rowString += i === 0 ? values[columns.indexOf(this._headers[i])] : `,${values[columns.indexOf(this._headers[i])]}`;
                    else
                        rowString += ',';
                }
                rowString = rowString.split(',').map(value => value.trim()).toString();
                this.#appendRow(rowString);
                break;
            }
            case 'delete': {
                let entries = this._entries;
                await new Promise(resolve => {
                    filteredRows.forEach(row => {
                        entries.splice(entries.indexOf(Object.values(row).join(',')), 1);
                    })
                    resolve();
                })
                fs.writeFileSync(this._path, `${this._headers}\n${entries.join('\n')}`);
            }
        }
    }

    #appendRow(row){
        fs.appendFileSync(this._path, `\n${row}`);
    }
}

module.exports = Table;