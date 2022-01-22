# Sequel-CSV

Package for executing simple sql queries against a csv file.

<a href="https://www.npmjs.com/package/sequel-csv"><img height="40px" src="https://img.shields.io/npm/v/sequel-csv?style=plastic" alt=""></a>
<a href='https://ko-fi.com/K3K47LTWF' target='_blank'><img height="40px" src='https://cdn.ko-fi.com/cdn/kofi3.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

# Installation

NPM
```
npm i sequel-csv
```
Yarn
```
yarn add sequel-csv
```

# [Documentation on GitHub](https://github.com/OneAndonlyFinbar/sequel-csv/wiki)

# Usage

##### ./table.csv

```css
userId,level
1,5
2,10
3,40
```
##### main.js
```js
const { Database } = require('./package/index.js');
const database = new Database();

/*
By default when registering a new table the table name is taken from the file name, excluding path and
extension.
To set a custom schema name provide the name as a string in the second parameter.
 */
database.registerSchema('./table.csv')

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

### Primary Commands

| Keyword | Description                 |
|---------|-----------------------------|
| SELECT  | Select one or multiple rows |
| INSERT  | Insert a new row            |
| DELETE  | Delete a row                |

### All Commands

| Name   | Description                 |
|--------|-----------------------------|
| SELECT | Select one or multiple rows |
| INSERT | Insert a new row            |
| DELETE | Delete a row                |
| WHERE  | Start condtionals           |
| AND    | Logical AND                 |
| AS     | Alias a single column       |

### Aggregate Functions

| Name    | Description                   |
|---------|-------------------------------|
| MAX()   | Maximum value for column      |
| MIN()   | Minimum value for column      |
| AVG()   | Get average column value      |
| COUNT() | Get row count                 |
| STDEV() | Get column standard deviation |
| SUM()   | Get column sum                |


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

### Roadmap

Update Command<br>
Semicolon separated commands<br>
Select multiple columns instead of singular or all