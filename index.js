'use strict';

const $plugin = Symbol(require('./package.json').name);

/**
 * Apply `CommentPlugin` to `Sequelize` connection factory
 * @param {function(new: import('@types/sequelize').Sequelize)} Sequelize connection class
 * @param {Object} [options={}] plugin options
 * @param {boolean} [options.newline=false] use newline as comment and query delimiter
 *
 * @example
 * const CommentPlugin = require('sequelize-comment');
 * const Sequelize = require('sequelize');
 *
 * // Apply the plug-in to the Sequelize connection factory.
 * CommentPlugin(Sequelize);
 * const sequelize = new Sequelize(...);
 */
module.exports = (Sequelize, { newline = false } = {}) => {
  if (Sequelize[$plugin]) return;
  const delimiter = newline ? '\n' : ' ';
  const { query } = Sequelize.prototype;
  Sequelize.prototype.query = function(sql, { comment, ...options } = {}) {
    if (!comment) return query.call(this, sql, options);
    comment = `/* ${escapeComment(this.escape(comment))} */`;
    if (typeof sql === 'object') {
      sql.query = [comment, sql.query].join(delimiter);
      return query.call(this, sql, options);
    }
    sql = [comment, sql].join(delimiter);
    return query.call(this, sql, options);
  };
  Sequelize[$plugin] = true;
};

function escapeComment(comment) {
  return comment
    .replace(/[\n\r]/g, match => {
      if (match === '\n') return '\\n';
      if (match === '\r') return '\\r';
    })
    .replace(/\/\*|\*\//g, match => {
      return match.replace(/./g, '\\$&');
    });
}
