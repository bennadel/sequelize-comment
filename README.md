
# Sequelize Comment Plug-in

by [Ben Nadel][1] (on [Google+][2])

This is a Sequelize instance plug-in that will prepend a SQL comment to the generated SQL
statements based on the `{options.comment}` property. These comments do not affect the 
execution of the SQL; but, they do provide critical debugging information for database 
administrators who can see these comments in the `general_log` and `slow_log` records 
(which will help people who are unfamiliar with the code quickly locate and debug 
problematic queries).

The following query types are supported:

* `SELECT` Query.
* `INSERT` Query.
* `UPDATE` Query.
* `DELETE` Query.
* Bulk Insert Query.

The plug-in must be applied to an instance of Sequelize, not to the root library:

```js
var commentPlugin = require( "sequelize-comment" );
var Sequelize = require( "sequelize" );

var sequelize = new Sequelize( /* configuration */ );

// Apply the plug-in to the Sequelize dialect instance.
commentPlugin( sequelize );
```

Once applied, you can then pass a `comment` option with your basic CRUD queries:

```js
// Example comment usage:
Model.findAll(
	{
		where: {
			typeID: 4
		},
		comment: "DEBUG: Running a SELECT command."
	}
);

// Example comment usage:
Model.create(
	{
		id: 1, 
		value: "Hello world"
	},
	{
		comment: "DEBUG: Running an INSERT command."
	}
);

// Example comment usage:
Model.update(
	{
		value: "Good morning world"
	},
	{
		where: {
			value: "Hello world"
		},
		comment: "DEBUG: Running an UPDATE command."
	}
);
```

These Sequelize methods will generate SQL fragments that then include (starts with) 
comments that look like this:

```sql
/* DEBUG: Running a SELECT command. */ SELECT ...
/* DEBUG: Running an INSERT command. */ INSERT INTO ...
/* DEBUG: Running an UPDATE command. */ UPDATE ...
```

Personally, I like to include the name of the calling component and method in the DEBUG
comment. This way, the people who are debugging the problematic queries that show up in
the slow logs will have some indication as to where the originating file is located:

```sql
/* DEBUG: userRepository.getUser(). */ ...
/* DEBUG: loginRepository.logFailedAuthentication(). */ ...
/* DEBUG: activityGateway.generateActivityReport(). */ ...
```

This type of comment also allows `slow_log` queries and `general_log` queries to be more
easily aggregated due to the concrete statement prefix.
_**Read More**: [Putting DEBUG Comments In Your SQL Statements Makes Debugging Performance Problems Easier][3]_

By default, the delimiter between the comment and the actual SQL command is a newline 
`\n` character. However, you can change that to be a space ` ` if you apply the 
CommentPlugin() with additional settings:

```js
var commentPlugin = require( "sequelize-comment" );
var Sequelize = require( "sequelize" );

var sequelize = new Sequelize( /* configuration */ );

// Disable the newline delimiter -- will use space instead.
commentPlugin( sequelize, { newline: false } );
```

[1]: http://www.bennadel.com
[2]: https://plus.google.com/108976367067760160494?rel=author
[3]: https://www.bennadel.com/blog/3058-putting-debug-comments-in-your-sql-statements-makes-debugging-performance-problems-easier.htm
