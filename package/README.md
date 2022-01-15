# Sequel-CSV

Package for executing simple sql queries against a csv file.

Complete with sql injection protection
# Installation

NPM
```
npm i sequel-csv
```
Yarn
```
yarn add sequel-csv
```

# Usage

##### ./table.csv

```csv
userId,level
1,5
2,10
3,40
```
##### main.js
```js
const { Database } = require('./package/index.js');
const database = new Database();
database.registerSchema('./table.csv') // Register a table (table name is the same as the file name excluding file extension and directory)

//Get all rows
const results = await table.query('SELECT * FROM test');
console.log(results) // [{ userId: 1, level: 5 }, { userId: 2, level: 10 }, { userId: 3, level: 40 }]

//Examples of filtering results
const results = await table.query('SELECT * FROM test WHERE level > 10');
console.log(results); // [{ userId: 3, level: 40 }]

const results = await table.query('SELECT * FROM test WHERE userId = 1');
console.log(results); // [{ userId: 1, level: 5 }]
```

# Compatibility

### Comparison

Available comparison operators:

| Keyword     | Description              |
|-------------|--------------------------|
| =           | Equal                    |
| <>          | Not Equal to             |
| \>          | Greater than             |
| \<          | Less than                |
| \>=         | Greater than or equal to |
| \<=         | Less than or equal to    |
| IS NULL     | Is null                  |
| IS NOT NULL | Is not null              |

### Primary Commands

| Keyword | Description                 |
|---------|-----------------------------|
| SELECT  | Select one or multiple rows |
| INSERT  | Insert a new row            |

### All Commands

| Name   | Description                 |
|--------|-----------------------------|
| SELECT | Select one or multiple rows |
| INSERT | Insert a new row            |
| MAX()  | Maximum value for column    |
| MIN()  | Minimum value for column    |

### Roadmap

Delete Command<br>
Update Command<br>
Colon separated commands<br>