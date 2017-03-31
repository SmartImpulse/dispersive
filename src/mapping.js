const Immutable = require('immutable');

const map = init => Immutable.Map(init);
const extractMaps = ({ maps = { src: map(), dest: map() } }) => maps;


class ReversedMapping {

  constructor({ mapping }) {
    this.mapping = mapping;
    this.reversed = mapping;
  }

  attach(srcKey, destKey) {
    return this.mapping.attach(destKey, srcKey);
  }

  detach(srcKey, destKey) {
    return this.mapping.detach(destKey, srcKey);
  }

  get(destKey) {
    return this.mapping.getFromDest(destKey);
  }

}

class Mapping {

  constructor(opts = {}) {
    this.maps = extractMaps(opts);
    this.reversed = new ReversedMapping({ mapping: this });
  }

  getFromSrc(srcKey) {
    return this.maps.src.get(srcKey);
  }

  getFromDest(destKey) {
    return this.maps.dest.get(destKey);
  }

  get(srcKey) {
    return this.maps.src.get(srcKey);
  }

}


class OneToOneMapping extends Mapping {

  attach(srcKey, destKey) {
    const lastPointedDestKey = this.maps.src.get(srcKey);
    const lastPointedSrcKey = this.maps.dest.get(destKey);

    this.maps.src = this.maps.src.remove(lastPointedSrcKey).set(srcKey, destKey);
    this.maps.dest = this.maps.dest.remove(lastPointedDestKey).set(destKey, srcKey);
  }

  normalizedDetach(srcKey, destKey) {
    this.maps.src = this.maps.src.remove(srcKey);
    this.maps.dest = this.maps.dest.remove(destKey);
  }

  detach(srcKey, destKey) {
    this.normalizedDetach(srcKey || this.maps.dest.get(destKey), destKey || this.maps.src.get(srcKey));
  }

}

class OneToManyMapping extends Mapping {

  attach(srcKey, destKey) {
    const lastPointedDestKey = this.maps.src.get(srcKey);

    if (!this.maps.dest.has(destKey)) {
      this.maps.dest = this.maps.dest.set(destKey, Immutable.Set());
    }

    this.maps.src = this.maps.src.set(srcKey, destKey);

    if (lastPointedDestKey) {
      this.maps.dest = this.maps.dest.set(
        lastPointedDestKey,
        this.maps.dest.get(lastPointedDestKey).remove(srcKey)
      )
    }

    this.maps.dest = this.maps.dest.set(
      destKey,
      this.maps.dest.get(destKey).add(srcKey)
    );
  }

  normalizedDetach(srcKey, destKey) {
    this.maps.dest = this.maps.dest.set(destKey, this.maps.dest.get(destKey).remove(srcKey));
    this.maps.src = this.maps.src.remove(srcKey);
  }

  detach(srcKey, destKey) {
    this.normalizedDetach(srcKey, destKey || this.maps.src.get(srcKey));
  }

}


class ManyToOneMapping extends ReversedMapping {

  constructor() {
    super({ mapping: new OneToManyMapping() });
  }

}

module.exports = {
  OneToOneMapping,
  OneToManyMapping,
  ManyToOneMapping,
};
