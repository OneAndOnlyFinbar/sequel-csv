class Query{
    /**
     * @param {String} query
     * @param {Array} [args]
     * @param {Object} table
     */
    constructor(query, args, table){
        this._query = query;
        this._args = args;
        this._columns = table._headers;
        this._statement = this._query.split(' ')[0];

        this.query = this._query;

        if(!['SELECT', 'DELETE', 'INSERT'].includes(this._statement))
            throw new Error(this._statement ? `Invalid query statement: ${this._statement}` : 'Invalid query statement');

        if(!Array.isArray(this._args) && args)
            throw new Error('Query args must be an array');

        if(typeof this._query !== 'string')
            throw new Error('Query must be a string');

        if(this._args?.length !== this._query.match(/\?/g)?.length && this._query.match(/\?/g)?.length)
            throw new Error(`Query placeholders do not match args in query: \n "${this._query}"`);

        for(let i = 0; i < this._args?.length; i++)
            this.query = this.query.replace(/\?/, this._args[i].replaceAll('\'', '\\\''));

        for(let i = 0; i < this._columns?.length; i++)
            this._columns[i] = this._columns[i].replaceAll('\r', '').replaceAll('\n', '');

        switch(this._statement){
            case 'SELECT': {
                try{
                    this.validateSelect(this.query, this._columns);
                }catch(e){
                    throw new Error(e);
                }
            }
            break;
            case 'INSERT': {
                try{
                    this.validateInsert(this.query, this._columns);
                }catch(e){
                    throw new Error(e);
                }
            }
            break;
            case 'DELETE': {
                try{
                    this.validateDelete(this.query, this._columns);
                }catch(e){
                    throw new Error(e);
                }
            }
            break;
        }

        if(this._query.includes('WHERE')){
            try{
                this.validateWhereClause(this.query, this._columns);
            }catch(e){
                throw new Error(e);
            }
        }
    }

    validateSelect(query, columns){
        const querySequential = query.toString().split(' ').splice(1);
        let queryColumns = [];
        let isAggregateFunction = false;
        //Get columns
        for(let i = 0; i < querySequential.length; i++){
            if(querySequential[i] === 'AS') querySequential.splice(i, 2);
            if(['WHERE', 'FROM'].includes(querySequential[i])) break
            else queryColumns.push(querySequential[i]);
        }
        for(let i = 0; i < queryColumns.length; i++){
            let column = queryColumns[i].replaceAll(',', '');
            if(column === '*') break;
            //Check if columns is aggregate function
            const aggregateFunctions = ['AVG', 'COUNT', 'MAX', 'MIN', 'SUM', 'STDEV'];
            //if query includes an aggregate function, get the aggregate function
            if(aggregateFunctions.includes(column.split('(')[0])){
                isAggregateFunction = true;
                column = column.split('(')[1].split(')')[0];
            }
            //check if column exists
            if(!columns.includes(column) && column !== '*')
                throw new Error(`Column ${column} does not exist`);
        }
        //Check order by columns (As of version 1.4.1 you can only order by a single column but this will be changed in the future, therefore this checks multiple columns)
        if(query.includes('ORDER BY')){
            let orderByColumns = query.toString().split('ORDER BY')[1].split(',');
            for(let i = 0; i < orderByColumns.length; i++)
                if(i !== orderByColumns.length - 1)
                    orderByColumns[i] = orderByColumns[i].replaceAll(',', '').replaceAll(' ', '');
                else
                    orderByColumns[i] = orderByColumns[i].toString().trim().split(' ')[0];
            if(queryColumns && columns){
                for(let i = 0; i < orderByColumns.length; i++)
                    if(!columns.includes(orderByColumns[i])) throw new Error(`Column ${orderByColumns[i]} does not exist`);
            }
        }
        //Check limit
        if(query.includes('LIMIT')){
            let limit = query.toString().split('LIMIT ')[1].split(' ')[0];
            if(!Number.isInteger(parseInt(limit))){
                throw new Error(`Invalid LIMIT value: ${limit}`);
            }
        }
    }

    validateInsert(query, columns){
        const querySequential = query.toString().split(' ').splice(1);
        let queryColumns = [];
        const tableName = query.split('INTO')[1].split('(')[0].trim();
        //Get columns
        const tableColumns = query.split('INTO')[1].split('(')[1].split(')')[0].split(',');
        //Filter columns
            for(let i = 0; i < tableColumns.length; i ++)
                tableColumns[i] = tableColumns[i].trim();
        for(let column of tableColumns){
            if(!columns.includes(column))
                throw new Error(`Column ${column} does not exist`);
        }
        //Get values
        const values = query.split('VALUES')[1].split('(')[1].split(')')[0].split(',');
        //Filter values
        for(let i = 0; i < values.length; i ++)
            values[i] = values[i].trim();
        //Check if value count matches column count
        if(values.length !== tableColumns.length)
            throw new Error(`Column count does not match value count`);
    }

    validateDelete(query, columns){

    }

    validateWhereClause(column){
        const conditions = column.toString().split('WHERE')[1].trim().split('AND');
        for(let clause of conditions){
            let condition = clause.trim().split('=')[0].trim();
            if(!this._columns.includes(condition))
                throw new Error(`Column ${condition} does not exist in where clause "${clause.trim()}"`);
        }
    }
}

module.exports = Query;