# Sequelize Comment Plug-in

[![build status](https://badgen.net/travis/bennadel/sequelize-comment/master)](https://travis-ci.com/bennadel/sequelize-comment) [![install size](https://badgen.net/packagephobia/install/sequelize-comment)](https://packagephobia.now.sh/result?p=sequelize-comment) [![npm package version](https://badgen.net/npm/v/sequelize-comment)](https://npm.im/sequelize-comment) [![npm license](https://badgen.net/npm/license/sequelize-comment)](https://github.com/bennadel/sequelize-comment/blob/master/LICENSE.md) [![js semistandard style](https://badgen.net/badge/code%20style/prettier/pink)](https://github.com/prettier/prettier)

by [Ben Nadel][1] (on [Google+][2])

**Version: 1.0.1**

This is a Sequelize instance plug-in that will prepend a SQL comment to the generated
SQL statements based on the `options.comment` property. These comments do not
affect the execution of the SQL; but, they do provide critical debugging information
for database administrators who can see these comments in the `general_log` and
`slow_log` records (which will help people who are unfamiliar with the code quickly
locate and debug problematic queries).

The plug-in must be applied to an instance of Sequelize, not to the root library:

```js
const CommentPlugin = require('sequelize-comment');
const Sequelize = require('sequelize');

// Apply the plug-in to the Sequelize connection factory.
CommentPlugin(Sequelize);
const sequelize = new Sequelize(/* configuration */);
```

Once applied, you can then pass a `comment` option with your basic CRUD queries:

```js
// Example comment usage:
Model.findAll({
  where: { typeID: 4 },
  comment: 'DEBUG: Running a SELECT command.'
});

// Example comment usage:
Model.create(
  { id: 1, value: 'Hello world' },
  { comment: 'DEBUG: Running an INSERT command.' }
);

// Example comment usage:
Model.update(
  { value: 'Good morning world' },
  {
    where: { value: 'Hello world' },
    comment: 'DEBUG: Running an UPDATE command.'
  }
);
```

These Sequelize methods will generate SQL fragments that then include (starts with)
comments that look like this:

```sql
/* 'DEBUG: Running a SELECT command.' */ SELECT ...
/* 'DEBUG: Running an INSERT command.' */ INSERT INTO ...
/* 'DEBUG: Running an UPDATE command.' */ UPDATE ...
```

Personally, I like to include the name of the calling component and method in the
DEBUG comment. This way, the people who are debugging the problematic queries
that show up in the slow logs will have some indication as to where the originating
file is located:

```sql
/* 'DEBUG: userRepository.getUser().' */ ...
/* 'DEBUG: loginRepository.logFailedAuthentication().' */ ...
/* 'DEBUG: activityGateway.generateActivityReport().' */ ...
```

This type of comment also allows `slow_log` queries and `general_log` queries to
be more easily aggregated due to the concrete statement prefix.

_**Read More**: [Putting DEBUG Comments In Your SQL Statements Makes Debugging Performance Problems Easier][3]_

By default, the delimiter between the comment and the actual SQL command is space
character `' '`. However, you can change that to be a newline `'\n'` if you apply the
`CommentPlugin` with additional settings:

```js
const CommentPlugin = require('sequelize-comment');
const Sequelize = require('sequelize');

// Use newline delimiter.
CommentPlugin(Sequelize, { newline: true });
const sequelize = new Sequelize(/* configuration */);
```

## Technical Approach

This plug-in works by overriding `query` method of your `Sequelize`
connection instance. As such, this plug-in isn't tied to specific set of methods;
but, rather gets applied to all possible (CRUD) model operations.

_**Read More**: [Experiment: Putting DEBUG Comments In Your Sequelize-Generated Queries In Node.js][4]_

## Tests

You can run the tests using `npm run test`. Tests use in-memory SQLite3 database.

[1]: http://www.bennadel.com
[2]: https://plus.google.com/108976367067760160494?rel=author
[3]: https://www.bennadel.com/blog/3058-putting-debug-comments-in-your-sql-statements-makes-debugging-performance-problems-easier.htm
[4]: https://www.bennadel.com/blog/3265-experiment-putting-debug-comments-in-your-sequelize-generated-queries-in-node-js.htm
