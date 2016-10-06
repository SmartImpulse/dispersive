import {Model} from 'dispersive';
import actions from '../actions';
import moment from 'moment';


const schema = {
  title: null,
  posterUrl: null,
  releaseDate: null,
};


class Movie extends Model.use(schema) {

  constructor(feed = {}) {
    super(feed);
    if (!!feed) this.parse(feed);
  }

  parse(feed) {
    this.releaseDate = this.releaseDate || feed.release_date;
    this.posterUrl = this.posterUrl || this.getPoster(feed.poster_path);
  }

  getPoster(path) {
    return `https://image.tmdb.org/t/p/w500${path}`;
  }

  static createAll(feeds) {
    for (const feed of feeds.results) {
      Movie.objects.create(feed, {emitChange: false});
    }

    this.objects.emitChange();
  }

}


actions.fetchMovies.subscribe(feeds => Movie.createAll(feeds));

export default Movie;