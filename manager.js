const Immutable = require('immutable');
const assert = require('./assert');
const {createTransaction} = require('./transaction');


class ObjectManager {

  constructor(deps = {createTransaction}) {
    this.list = Immutable.List();
    this.transaction = null;
    this.deps = deps;
  }

  createTransaction() {
    assert.hasNoTransaction(this);
    this.transaction = this.deps.createTransaction(this);

    return this.transaction;
  }

  commitTransaction() {
    this.list = this.transaction.list;
    this.transaction = null;
  }

  abortTransaction() {
    this.transaction = null;
  }

  create(values = {}) {
    const entry = this.deps.model.factory({
      values,
      model: this.deps.model,
      manager: this,
    });

    entry.save();
  }

  sync(entry) {
    assert.hasTransaction(this);
    this.transaction.create(entry.values);
  }

  get length() {
    return this.list.count();
  }

}


const createObjects = ({model}) => new ObjectManager({createTransaction, model});


module.exports = {
  ObjectManager,
  createObjects,
};
