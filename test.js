'use strict';

const Sequelize = require('sequelize');
const sinon = require('sinon');
const test = require('ava');

require('./')(Sequelize);
const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });

const ValueModel = sequelize.define(
  'ValueModel',
  {
    id: {
      type: Sequelize.DataTypes.INTEGER(0),
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

test.before(async () => {
  await sequelize.authenticate();
  const queryGenerator = sequelize.getQueryInterface().QueryGenerator;
  await queryGenerator.dropTableQuery(ValueModel.getTableName());
  return sequelize.query(
    queryGenerator.createTableQuery(
      ValueModel.getTableName(),
      queryGenerator.attributesToSQL(ValueModel.rawAttributes),
      {}
    )
  );
});

const sandbox = sinon.createSandbox();

test.beforeEach(async t => {
  const db = await sequelize.connectionManager.getConnection();
  t.context.db = db;
  sandbox.spy(db, 'run');
  sandbox.spy(db, 'get');
  sandbox.spy(db, 'all');
  sandbox.spy(db, 'each');
  sandbox.spy(db, 'prepare');
});

test.afterEach.always(() => sandbox.restore());

test.serial('bulkCreate query accepts comment', async t => {
  await ValueModel.bulkCreate(
    [({ id: 1, value: 'One' }, { id: 2, value: 'Two' })],
    { comment: 'BULK CREATE' }
  );
  sandbox.assert.pass = t.pass;
  sandbox.assert.calledWith(
    t.context.db.run,
    `/* 'BULK CREATE' */ INSERT INTO \`__sequelize_comment_plugin_test__\` (\`id\`,\`value\`) VALUES (2,'Two');`
  );
});

test.serial('insert query accepts comment', async t => {
  await ValueModel.create({ id: 3, value: 'Three' }, { comment: 'INSERT' });
  sandbox.assert.pass = t.pass;
  sandbox.assert.calledWith(
    t.context.db.run,
    `/* 'INSERT' */ INSERT INTO \`__sequelize_comment_plugin_test__\` (\`id\`,\`value\`) VALUES ($1,$2);`
  );
});

test.serial('update query accepts comment', async t => {
  await ValueModel.update(
    { value: 'Three (updated)' },
    { where: { id: 3 }, comment: 'UPDATE' }
  );
  sandbox.assert.pass = t.pass;
  sandbox.assert.calledWith(
    t.context.db.run,
    `/* 'UPDATE' */ UPDATE \`__sequelize_comment_plugin_test__\` SET \`value\`=$1 WHERE \`id\` = $2`
  );
});

test.serial('delete query accepts comment', async t => {
  await ValueModel.destroy({ where: { id: 3 }, comment: 'DELETE' });
  sandbox.assert.pass = t.pass;
  sandbox.assert.calledWith(
    t.context.db.run,
    `/* 'DELETE' */ DELETE FROM \`__sequelize_comment_plugin_test__\` WHERE \`id\` = 3`
  );
});

test.serial('select query accepts comment', async t => {
  await ValueModel.findAll({ comment: 'SELECT' });
  sandbox.assert.pass = t.pass;
  sandbox.assert.calledWith(
    t.context.db.all,
    `/* 'SELECT' */ SELECT \`id\`, \`value\` FROM \`__sequelize_comment_plugin_test__\` AS \`ValueModel\`;`
  );
});
