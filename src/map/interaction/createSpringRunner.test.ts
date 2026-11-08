import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSpringRunner } from './createSpringRunner.js';

// A frame clock we drive by hand
const frames = new Map<number, (time: number) => void>();
let clock = 0;
let nextFrame = 0;
const advance = (ms: number) => {
  clock += ms;
  [...frames.entries()].forEach(([id, callback]) => {
    frames.delete(id);
    callback(clock);
  });
};

const movement = () => ({
  id: 'a',
  from: { x: 0, y: 0 },
  to: { x: 100, y: 0 },
  reportsMove: true,
  onFrame: vi.fn(),
  onArrive: vi.fn(),
});

describe('Spring runner', () => {
  beforeEach(() => {
    frames.clear();
    clock = 0;
    nextFrame = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
    vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) => {
      nextFrame += 1;
      frames.set(nextFrame, callback);
      return nextFrame;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('when a spring runs to its end', () => {
    it('ends at the destination and then arrives', () => {
      const runner = createSpringRunner();
      const spring = movement();

      runner.run(spring);
      advance(1000);

      expect(spring.onFrame).toHaveBeenLastCalledWith({ x: 100, y: 0 });
      expect(spring.onArrive).toHaveBeenCalledTimes(1);
      expect(runner.finish()).toBeNull();
    });
  });

  describe('when a running spring is finished early', () => {
    it('says where it was heading and never arrives', () => {
      const runner = createSpringRunner();
      const spring = movement();
      runner.run(spring);
      advance(50);

      const finished = runner.finish();
      advance(1000);

      expect(finished).toEqual({ id: 'a', destination: { x: 100, y: 0 }, reportsMove: true });
      expect(spring.onArrive).not.toHaveBeenCalled();
    });
  });

  describe('when a second spring starts', () => {
    it('stops the first one', () => {
      const runner = createSpringRunner();
      const first = movement();
      const second = movement();

      runner.run(first);
      runner.run(second);
      advance(1000);

      expect(first.onArrive).not.toHaveBeenCalled();
      expect(second.onArrive).toHaveBeenCalledTimes(1);
    });
  });
});
