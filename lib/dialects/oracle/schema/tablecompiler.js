'use strict';

var inherits = require('inherits');
var utils = require('../utils');
var TableCompiler = require('../../../schema/tablecompiler');
var helpers = require('../../../helpers');
var assign = require('lodash/object/assign');

// Table Compiler
// ------

function TableCompiler_Oracle() {
  TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_Oracle, TableCompiler);

assign(TableCompiler_Oracle.prototype, {

  // Compile a rename column command.
  renameColumn: function renameColumn(from, to) {
    return this.pushQuery({
      sql: 'alter table ' + this.tableName() + ' rename column ' + this.formatter.wrap(from) + ' to ' + this.formatter.wrap(to)
    });
  },

  compileAdd: function compileAdd(builder) {
    var table = this.formatter.wrap(builder);
    var columns = this.prefixArray('add column', this.getColumns(builder));
    return this.pushQuery({
      sql: 'alter table ' + table + ' ' + columns.join(', ')
    });
  },

  // Adds the "create" query to the query sequence.
  createQuery: function createQuery(columns, ifNot) {
    var sql = 'create table ' + this.tableName() + ' (' + columns.sql.join(', ') + ')';
    this.pushQuery({
      // catch "name is already used by an existing object" for workaround for "if not exists"
      sql: ifNot ? utils.wrapSqlWithCatch(sql, -955) : sql,
      bindings: columns.bindings
    });
    if (this.single.comment) this.comment(this.single.comment);
  },

  // Compiles the comment on the table.
  comment: function comment(_comment) {
    this.pushQuery('comment on table ' + this.tableName() + ' is ' + "'" + (_comment || '') + "'");
  },

  addColumnsPrefix: 'add ',

  dropColumn: function dropColumn() {
    var columns = helpers.normalizeArr.apply(null, arguments);
    this.pushQuery('alter table ' + this.tableName() + ' drop (' + this.formatter.columnize(columns) + ')');
  },

  changeType: function changeType() {
    // alter table + table + ' modify ' + wrapped + '// type';
  },

  _indexCommand: function _indexCommand(type, tableName, columns) {
    return this.formatter.wrap(utils.generateCombinedName(type, tableName, columns));
  },

  primary: function primary(columns) {
    this.pushQuery('alter table ' + this.tableName() + " add primary key (" + this.formatter.columnize(columns) + ")");
  },

  dropPrimary: function dropPrimary() {
    this.pushQuery('alter table ' + this.tableName() + ' drop primary key');
  },

  index: function index(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('create index ' + indexName + ' on ' + this.tableName() + ' (' + this.formatter.columnize(columns) + ')');
  },

  dropIndex: function dropIndex(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('drop index ' + indexName);
  },

  unique: function unique(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' add constraint ' + indexName + ' unique (' + this.formatter.columnize(columns) + ')');
  },

  dropUnique: function dropUnique(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
  },

  dropForeign: function dropForeign(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
  }

});

module.exports = TableCompiler_Oracle;