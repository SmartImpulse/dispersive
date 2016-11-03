const assert = require('assert');
const sinon = require('sinon');
const Dispersive = require('./dispersive');


describe('Store', () => {

  let Fellow = null;

  const schema = {
    age: new Dispersive.IndexedField(),
    name: null,
  };
  
  const store = new Dispersive.Store();
  
  beforeEach(() => {
    store.forget('fellows');
    Fellow = store.register('fellows', {model: Fellow, schema});
  });

  it('should register sub store', () => {
    const rootStore = new Dispersive.Store();
    const market = new Dispersive.Store();

    market.register('products');

    rootStore.register('market', market);
    assert.deepEqual(rootStore.models, ['market.products']);
  });

  describe('models', () => {

    it('should create a new entry with objects.create', () => {
      Fellow.objects.create({age: 42});
      assert.equal(Fellow.objects.get().age, 42);
    });


    it('should create a new entry model.save', () => {
      const fellow = new Fellow({age: 42});
      fellow.save();
      assert.equal(Fellow.objects.get().age, 42);
    });

    it('should update an existing model', () => {
      Fellow.objects.create({age: 0});
      Fellow.objects.get().update({age: 42});

      assert.equal(Fellow.objects.get().age, 42);
    });

    it('should delete a given entry', () => {
      const fellow = Fellow.objects.create({age: 42});
      
      fellow.delete();

      assert.equal(Fellow.objects.count(), 0);
    });

  });

  describe('objects', () => {

    it('should trigger a new object', (done) => {
      Fellow.objects.changed(() => done());
      Fellow.objects.create();
    });

    it('should not trigger a deleted object', (done) => {
      const fellow = Fellow.objects.create();

      Fellow.objects.changed(() => done());
      fellow.delete();
    });

    it('should create a SetIndex for each indexed field', () => {
      const schema = {
        age: new Dispersive.Schema.IndexedField(),
        name: null,
      };

      assert('age' in Fellow.objects.index);
      assert.equal('name' in Fellow.objects.index, false);
    });

    it('should add values to SetIndex', () => {
      const fellow = Fellow.objects.create({age: 20, name: 'joe'});
      const values = Fellow.objects.index.id.get(fellow.id);

      assert.equal(Fellow.objects.index.age.refs[values.id], 20);
      assert(Fellow.objects.index.age.sets[20].has(values.id));
    });

    it('should remove values from SetIndex', () => {
      const fellow = Fellow.objects.create({age: 20, name: 'joe'});
      const values = Fellow.objects.index.id.get(fellow.id);

      fellow.delete();

      assert.equal(Object.keys(Fellow.objects.index.age.refs).length, 0);
      assert.equal(Fellow.objects.index.age.sets[20].has(values), false);
    });

    it('should remove all entries', () => {
      Fellow.objects.create({age: 20, name: 'joe'});
      Fellow.objects.create({age: 20, name: 'jack'});

      assert.equal(Fellow.objects.count(), 2);

      Fellow.objects.delete();

      assert.equal(Fellow.objects.count(), 0);
    });

  })

  describe('emitter', () => {

    it('should emit on all other models pointing on the same entry id', () => {
      const {id} = Fellow.objects.create();
      const listener = sinon.spy();

      const first = Fellow.objects.get({id});
      const second = Fellow.objects.get({id});

      first.changed(listener);
      second.save();

      assert(listener.called);
    });

    it('should be able to unsubscribe an event', () => {
      const {id} = Fellow.objects.create();
      const listener = sinon.spy();

      const first = Fellow.objects.get({id});
      const second = Fellow.objects.get({id});

      const subscription = first.changed(listener);

      subscription.remove();
      second.save();

      assert.equal(listener.called, false);
    });

  });


  describe('bugfix', () => {

    it('should be able to create than save a model (#6)', () => {
      const fellow = Fellow.objects.create({age: 42});
      fellow.save();
      assert.equal(Fellow.objects.first().age, 42);
    });

    it('should be able to index null values (#7)', () => {
      Fellow.objects.create({age: false});
      
      assert.equal(Fellow.objects.filter({age: false}).count(), 1);
    });

    it('should update set-indexed values without creating others (#19)', () => {
      const store = new Dispersive.Store();

      store.register('fellows', {schema: {age: new Dispersive.IndexedField(), name: null}});

      const joe = store.fellows.create({age: 20, name: 'joe'});

      joe.save();

      assert.equal(store.fellows.filter({age: 20}).count(), 1);
    });

    it('should be able to use empty arrays as initial values (#21)', () => {
      const store = new Dispersive.Store();
      const Pokemon = store.register('pokemons', {schema: {name: null, words: []}});
      const nobody = Pokemon.objects.create({name: 'nobody'});

      assert.deepEqual([], nobody.words);

      const pikachu = Pokemon.objects.create({name: 'pikachu', words: ['pikapika', 'pikachu']});

      assert.deepEqual(['pikapika', 'pikachu'], pikachu.words);
    });


  });


})