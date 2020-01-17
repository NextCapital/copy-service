import Substitute from './Substitute';

describe('Substitute', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const options = {
        sibling: new Substitute({ key: 'some key' }),
        key: 'some key'
      };

      const substitute = new Substitute(options);
      expect(substitute).toEqual(expect.objectContaining(options));
    });

    test('does not set invalid options to the instance', () => {
      const options = {
        ast: 'some ast',
        text: 'some text',
        arg: 'some arg',
        copy: 'some copy',

        key: 'some key'
      };

      const substitute = new Substitute(options);
      expect(substitute.ast).toBeUndefined();
      expect(substitute.text).toBeUndefined();
      expect(substitute.arg).toBeUndefined();
      expect(substitute.copy).toBeUndefined();
    });
  });

  describe('isCacheable', () => {
    test('returns false', () => {
      const options = {
        sibling: new Substitute({ key: 'some key' }),
        key: 'some key'
      };

      const substitute = new Substitute(options);

      expect(substitute.isCacheable()).toBe(false);
    });
  });
});
