'use strict';

// Require the core node modules.
const assert = require('assert');
const chalk = require('chalk');
// const mysql = require('mysql');
const Sequelize = require('sequelize');

// Require the application modules.
const commentPlugin = require('../');

// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

console.log(
  chalk.red.bold('CAUTION:'),
  chalk.red(
    'These tests turn on and then turn off the GLOBAL general_log. This may leave your GLOBAL database logging in an unexecpted state.'
  )
);
console.log(chalk.red("> SET GLOBAL general_log = 'ON';"));
console.log(chalk.red("> SET GLOBAL log_output = 'TABLE';"));
console.log(chalk.red('>', chalk.italic('... then... ')));
console.log(chalk.red("> SET GLOBAL general_log = 'OFF';"));

// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

// Setup our Sequelize instance.
const sequelize = new Sequelize(
  process.env.DATABASE || 'testing',
  process.env.USERNAME || 'root',
  process.env.PASSWORD || '',
  {
    host: 'localhost',
    dialect: 'mysql',
    dialectOptions: {
      multipleStatements: true
    }
  }
);

// Apply the comment plugin (which we'll confirm in the general_log).
commentPlugin(sequelize, { newline: false });

// Define the ORM (Object-Relational Mapping) model that we'll use for testing the SQL
// commands.
const ValueModel = sequelize.define(
  'ValueModel',
  {
    id: {
      type: Sequelize.DataTypes.INTEGER(0).UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    value: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false
    }
  },
  {
    tableName: '__sequelize_comment_plugin_test__',
    createdAt: false,
    updatedAt: false
  }
);

const queryGenerator = sequelize.getQueryInterface().QueryGenerator;
const startedAt = new Date().toISOString();

Promise.resolve()
  .then(function dropTestTable() {
    const promise = queryGenerator.dropTableQuery(ValueModel.getTableName());

    return promise;
  })
  .then(function createTestTable() {
    const promise = sequelize.query(
      queryGenerator.createTableQuery(
        ValueModel.getTableName(),
        queryGenerator.attributesToSQL(ValueModel.rawAttributes),
        {}
      )
    );

    return promise;
  })
  .then(function enableGeneralLog() {
    const promise = sequelize.query(
      "SET GLOBAL general_log = 'ON'; SET GLOBAL log_output = 'TABLE';"
    );

    return promise;
  })
  .then(function runBulkCreate() {
    const promise = ValueModel.bulkCreate(
      [
        {
          id: 1,
          value: 'One'
        },
        {
          id: 2,
          value: 'Two'
        }
      ],
      {
        comment: 'BULK CREATE'
      }
    );

    return promise;
  })
  .then(function runInsert() {
    const promise = ValueModel.create(
      {
        id: 3,
        value: 'Three'
      },
      {
        comment: 'INSERT'
      }
    );

    return promise;
  })
  .then(function runUpdate() {
    const promise = ValueModel.update(
      {
        value: 'Three (updated)'
      },
      {
        where: {
          id: 3
        },
        comment: 'UPDATE'
      }
    );

    return promise;
  })
  .then(function runDelete() {
    const promise = ValueModel.destroy({
      where: {
        id: 3
      },
      comment: 'DELETE'
    });

    return promise;
  })
  .then(function runSelect() {
    const promise = ValueModel.findAll({
      comment: 'SELECT'
    });

    return promise;
  })
  .then(function assertSelectResults(results) {
    assert.ok(results.length === 2);
    assert.ok(results[0].id === 1);
    assert.ok(results[0].value === 'One');
    assert.ok(results[1].id === 2);
    assert.ok(results[1].value === 'Two');
  })
  .then(function disableGeneralLog() {
    const promise = sequelize.query("SET GLOBAL general_log = 'OFF';");

    return promise;
  })
  .then(function dropTestTable() {
    const promise = sequelize.query(
      queryGenerator.dropTableQuery(ValueModel.getTableName())
    );

    return promise;
  })
  .then(function getGeneralLogResults() {
    const promise = sequelize.query(
      'SELECT * FROM mysql.general_log WHERE event_time >= ? AND argument LIKE ? ORDER BY event_time ASC',
      {
        replacements: [startedAt, '%' + ValueModel.getTableName() + '%'],
        raw: true
      }
    );

    return promise;
  })
  .then(function assertGeneralLogResults(results) {
    const records = results[0];
    let offset = 0;

    console.log('Analyzing general_log....');
    assert.ok(
      records[offset++].argument.toString().indexOf('/* BULK CREATE */') === 0
    );
    assert.ok(
      records[offset++].argument.toString().indexOf('/* INSERT */') === 0
    );
    assert.ok(
      records[offset++].argument.toString().indexOf('/* UPDATE */') === 0
    );
    assert.ok(
      records[offset++].argument.toString().indexOf('/* DELETE */') === 0
    );
    assert.ok(
      records[offset++].argument.toString().indexOf('/* SELECT */') === 0
    );

    console.log(chalk.green.bold('TESTS PASS'));
  })
  .catch(function handleTestFailure(error) {
    console.log(chalk.red.bold('TESTS FAIL'));
    console.log(error);
  })
  .then(
    function closeDatabaseConnections() {
      sequelize.close();
    },
    function closeDatabaseConnections() {
      sequelize.close();
    }
  );
