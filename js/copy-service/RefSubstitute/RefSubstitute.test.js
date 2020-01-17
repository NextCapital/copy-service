import RefSubstitute from './RefSubstitute';

describe('RefSubstitute', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const options = {
        sibling: new RefSubstitute({ key: 'some key' }),
        key: 'some key'
      };

      const reference = new RefSubstitute(options);
      expect(reference).toEqual(expect.objectContaining(options));
    });

    test('does not set invalid options to the instance', () => {
      const options = {
        ast: 'some ast',
        text: 'some text',
        arg: 'some arg',
        copy: 'some copy',

        key: 'some key'
      };

      const reference = new RefSubstitute(options);
      expect(reference.ast).toBeUndefined();
      expect(reference.text).toBeUndefined();
      expect(reference.arg).toBeUndefined();
      expect(reference.copy).toBeUndefined();
    });
  });

  describe('isCacheable', () => {
    test('returns false', () => {
      const options = {
        sibling: new RefSubstitute({ key: 'some key' }),
        key: 'some key'
      };

      const reference = new RefSubstitute(options);

      expect(reference.isCacheable()).toBe(false);
    });
  });
});
