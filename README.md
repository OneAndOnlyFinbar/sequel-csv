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

```css
userId, level
1, 5
2, 10
3, 40
```
##### main.js
```js
const { Table } = require('./package/index.js');
const table = new Table('./table.csv');

//Example Basic Select Query
const results = await table.query('SELECT * WHERE userId = 1');
console.log(results) // [{ userId: 1, level: 5 }]

//Get users with greater than 10 level
const results = await table.query('SELECT * WHERE level > 10');
console.log(results); // [{ userId: 3, level: 40 }]

//Using AND operator
const results = await table.query('SELECT * WHERE userId = 2 AND level >= 10');
console.log(results); // [{ userId: 2, level: 10 }]
```

# Important 

Due to the nature of only querying a single file at a time, keywords like `FROM` and `INTO` are not necessary.

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

### Roadmap

 - [ ] Colon separated commands
 - [ ] Delete Command
 - [ ] Update Command
 - [ ] Switch from singular tables to database objects to introduce usage of `FROM` and `INTO` keywords