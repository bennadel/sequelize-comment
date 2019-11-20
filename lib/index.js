"use strict";

// I am the key that gets applied to the Sequelize instance in order to make sure that
// the same plugin doesn't get applied more than once.
var trackingKey = "__comment_plugin__";


// ---
// PUBLIC METHODS.
// ---


// I apply the Comment plug-in to the given sequelize instance.
module.exports = function CommentPlugin( sequelizeDialect, settings ) {

	// Make sure we're not trying to apply the plug-in more than once to this instance.
	if ( hasPlugin( sequelizeDialect ) ) {

		return( sequelizeDialect );

	} else {

		recordPlugin( sequelizeDialect );

	}

	settings = ensureSettings( settings );

	// Since the method signatures are not the same for all of the generator methods that
	// we're targeting, we have to explicitly define which argument offset includes the 
	// options hash (that will contain our "comment" property).
	// --
	// - selectQuery(tableName, options, model)
	// - insertQuery(table, valueHash, modelAttributes, options)
	// - updateQuery(tableName, attrValueHash, where, options, attributes)
	// - deleteQuery(tableName, where, options)
	// - bulkInsertQuery(tableName, attrValueHashes, options, rawAttributes)
	var methods = [
		{
			name: "selectQuery",
			optionsArgument: 1
		},
		{
			name: "insertQuery",
			optionsArgument: 3
		},
		{
			name: "updateQuery",
			optionsArgument: 3
		},
		{
			name: "deleteQuery",
			optionsArgument: 2
		},
		{
			name: "bulkInsertQuery",
			optionsArgument: 2
		}
	];

	var queryGenerator = sequelizeDialect.getQueryInterface().QueryGenerator;

	// Proxy each query generator method. The proxy will invoke the underlying / original
	// method and then prefix the comment (if the option exists) before passing on the 
	// resultant SQL fragment.
	methods.forEach(
		function iterator( method ) {

			var originalGeneratorMethod = queryGenerator[ method.name ];

			queryGenerator[ method.name ] = function proxyMethod( /* arguments */ ) {

				var baseFragment = originalGeneratorMethod.apply( this, arguments );
				var options = arguments[ method.optionsArgument ];

				var fragment = ( options && options.comment )
					? prependComment( options.comment, getDelimiter( settings ), baseFragment )
					: baseFragment
				;

				return( fragment );

			};

		}
	);

	return( sequelizeDialect );

};


// ---
// PRIVATE METHODS.
// ---


// I ensure that the settings object exists and contains expected values.
function ensureSettings( settings ) {

	settings = ( settings || {} );

	if ( ! settings.hasOwnProperty( "newline" ) ) {

		settings.newline = true;

	}

	return( settings );

}


// I return the delimiter that separates the comment from the SQL fragment.
function getDelimiter( settings ) {

	return( ( settings.newline && "\n" ) || " " );

}


// I determine if the given Sequelize instance already has the plug-in applied to it.
function hasPlugin( sequelizeDialect ) {

	return( !! sequelizeDialect[ trackingKey ] );

}


// I prepare and prepend the given comment to the given SQL fragment.
function prependComment( comment, delimiter, fragment ) {
	if ( typeof fragment === "object" ) {
		var parts = [
		  "/* ",
		  sanitizeComment( comment ),
		  " */",
		  delimiter,
		  fragment.query
		];
		fragment.query = parts.join( "" );
		return( fragment );
	  } else {
		var parts = [
		  "/* ",
		  sanitizeComment( comment ),
		  " */",
		  delimiter,
		  fragment
		];
	
		return( parts.join( "" ) );
	  }
}


// I record the fact that the plug-in is being applied to the given Sequelize instance.
function recordPlugin( sequelizeDialect ) {

	sequelizeDialect[ trackingKey ] = true;

}


// I sanitize the given comment value, ensuring that it won't break the syntax of the 
// SQL comment in which it will be contained.
function sanitizeComment( comment ) {

	var sanitizedComment = String( comment )
		.replace( /[\r\n]+/g, " " ) // Strip new lines.
		.replace( /\/\*|\*\\/g, " " ) // Strip comments.
	;

	return( sanitizedComment );

}
