const ObjectManager = require('./manager');
const Schema = require('./schema');
const Model = require('./model');
const Tree = require('./tree');

const isStoreObject = spec => (
  (spec instanceof ObjectManager) || (spec instanceof Model)
);

class Store extends Tree {

  static _createObjects({model = null, schema = {}, manager = ObjectManager}) {
    const ModelType = model || class extends Model {};
    const ManagerType = ModelType.manager || manager;

    ModelType.schema = new Schema(ModelType.schemaFields || schema);
    ModelType.objects = new ManagerType(ModelType);

    return ModelType.objects;
  }

  static createObjects(spec = {}) {
    return Store._createObjects(spec);
  }

  static createObjectsFromSchema(schema = {}) {
    return Store._createObjects({schema});
  }

  static createUniqueObject(spec = {}) {
    const objects = this.createObjects(spec);
    return objects.create();
  }

  static createUniqueObjectFromSchema(schema = {}) {
    return Store.createUniqueObject({schema});
  }

  _register(name, spec = {}) {
    const objects = isStoreObject(spec) ? spec : Store.createObjects(spec);

    this[name] = objects;
    this._leafs.add(name);

    return this[name];
  }

  create(data) {
    const tree = {};

    for (const childName of Object.keys(data)) {
      tree[childName] = this[childName].create(data[childName]);
    }

    return tree;
  }

  flush() {
    for (const [name, child] of this.children()) {
      child.flush(name);
    }
  }

  values(opts) {
    const values = {};

    for (const [name, child] of this.children()) {
      values[name] = child.values(opts);
    }

    return values;
  }

}

module.exports = Store;
