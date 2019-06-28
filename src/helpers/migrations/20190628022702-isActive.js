'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = (db, callback) => {
  db.addColumn("Users", "isActive", {
    type: "boolean",
    defaultValue: true,
    allowNull: false
  }, callback)
};

exports.down = (db) => {
  db.removeColumn("Users", "isActive")
};

exports._meta = {
  "version": 1
};
