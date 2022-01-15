class Query{
    constructor(query, args){
        this._query = query;
        this._args = args;
        this.query = this._query;

        for(let i = 0; i < this._args.length; i++){
            this.query = this.query.replace(/\?/, this._args[i].replaceAll('\'', '\\\''));
        }
    }
    build(){
        return this.query;
    }
}

module.exports = Query;