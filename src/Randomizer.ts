import gen from "random-seed";

export class RandomizerController {
  seed: number;
  randomizer: gen.RandomSeed;
  constructor(seed?: number, randomizer?: gen.RandomSeed) {
    this.seed = seed ?? Math.round(Math.random() * 9999)
    this.randomizer = randomizer ?? gen.create(`${this.seed}`);
  }

  setSeed(seed: number) {
    this.seed = seed;
    this.randomizer = gen.create(`${seed}`);
  }

  reset() {
    this.randomizer.initState();
  }

  getRandom(max: number, floor: boolean = true) {
    if (floor) {
      return this.randomizer?.intBetween(0, max) || 0;
    }
    return this.randomizer?.floatBetween(0, max) || 0;
  }

  getSeed() {
    return this.seed;
  }
}

export const Randomizer = new RandomizerController();