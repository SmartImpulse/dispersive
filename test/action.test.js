const {assert, expect} = require('chai');
const {spy} = require('sinon');
const {createModel, createAction} = require('../src');
const {withOne, withMany} = require('../src/relation');
const {withField} = require('../src/field');
const {createChangesFunnelEmitter} = require('../src/emitter');
const {runAsAction} = require('../src/action');



describe('action', () => {

  it('should commit change to models', () => {
    const Book = createModel();
    const createBook = createAction(() => Book.objects.create(), [Book]);

    createBook();

    expect(Book.objects.length).to.equal(1);
  });

  it('should update a given entry', () => {
    const Book = createModel([
      withField('title'),
    ]);

    const emptyBook = createAction(() => Book.objects.create(), [Book])();
    const peterPan = createAction(({key}) => {
      const book = Book.objects.get(key);

      return book.update({title: 'Peter Pan'});
    }, Book)(emptyBook);

    Book.objects.forEach(a => null)
    expect(Book.objects.get().title).to.equal('Peter Pan');
  });

  it('should emit events before resolving the promise', () => {
    const Book = createModel();
    const renderer = spy();
    const createBook = createAction(() => Book.objects.create(), [Book]);

    const subscription = Book.emitter.changed(() => renderer(Book.objects.length));

    createBook();

    subscription.remove();

    assert(renderer.called);
    assert(renderer.calledWith(1));
  });


  it('should trig a funnel just once', () => {
    const Book = createModel([
      withField('title'),
    ]);
    const Author = createModel([
      withField('name'),
      withMany('books', Book),
    ]);

    const render = spy();

    createChangesFunnelEmitter({models: [Book, Author]})
      .changed(() => render(Book.objects.length, Author.objects.length));

    createAction(() => {
      const jmBarrie = Author.objects.getOrCreate({name: 'J.M. Barrie'});
      const peterPan = Book.objects.create({author: jmBarrie, title: 'Peter Pan'});
    }, [Book, Author])();

    assert.equal(render.callCount, 1);
    assert(render.calledWith(1, 1));
  });

  it('should allow to read current transaction entries', () => {
    const Book = createModel([
      withField('title'),
    ]);

    const peterPan = runAsAction(() => {
      Book.objects.create({ title: 'Peter Pan' });

      return Book.objects.get({ title: 'Peter Pan' });
    }, [Book]);

    assert(peterPan, 'Could not retreived created model');
  });

  it('should manage crossed relations (album/broadcast bug)', () => {
    const Track = createModel([
      withField('title'),
    ]);

    const Album = createModel([
      withField('title'),
      withMany('tracks', {
        model: Track,
        relatedName: 'album',
      }),
    ]);

    const Artist = createModel([
      withField('name'),
      withMany('tracks', {
        model: Track,
        relatedName: 'artist',
      }),
      withMany('albums', {
        model: Album,
        relatedName: 'artist',
      }),
    ]);

    const Playlist = createModel([
      withMany('tracks', Track),
    ]);

    const Broadcast = createModel([
      withOne('playlist', Playlist),
    ]);

    const store = [Broadcast, Playlist, Album, Track, Artist];

    const broadcast = runAsAction(() => {
      const avantasia = Artist.objects.create({ name: 'Avantasia' });
      const metalOpera = Album.objects.create({ title: 'Metal Opera', artist: avantasia });
      const playlist = Playlist.objects.create();

      metalOpera.tracks.add([
        'Farewell',
        'Sign Of The Cross'
      ].map(title => Track.objects.create({ artist: avantasia, title })));

      playlist.tracks.add(metalOpera.tracks);

      return Broadcast.objects.create({ playlist });
    }, store);

    assert(Album.objects.first().artist.name === 'Avantasia')
    expect(broadcast.playlist.tracks.length).to.equal(2);
    assert(broadcast.playlist.tracks.every(track => track.album.title === 'Metal Opera'));
    assert(broadcast.playlist.tracks.every(track => track.artist.name === 'Avantasia'));
  });

})
