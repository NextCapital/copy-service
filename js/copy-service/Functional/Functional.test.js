import Functional from './Functional';

describe('Functional', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const options = {
        sibling: new Functional({ key: 'some key' }),
        copy: 'some copy',
        key: 'some key',
        args: ['some args', 'some more args']
      };

      const functional = new Functional(options);
      expect(functional).toEqual(expect.objectContaining(options));
    });

    test('does not set invalid options to the instance', () => {
      const options = {
        ast: 'some ast',
        text: 'some text',
        arg: 'some arg',

        key: 'some key'
      };

      const functional = new Functional(options);
      expect(functional.ast).toBeUndefined();
      expect(functional.text).toBeUndefined();
      expect(functional.arg).toBeUndefined();
    });
  });
});