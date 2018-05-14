import Verbatim from './Verbatim';

describe('Verbatim', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const options = {
        sibling: new Verbatim({ key: 'some key' }),
        text: 'some text'
      };

      const verbatim = new Verbatim(options);
      expect(verbatim).toEqual(expect.objectContaining(options));
    });

    test('does not set invalid options to the instance', () => {
      const options = {
        ast: 'some ast',
        arg: 'some arg',
        copy: 'some copy',
        key: 'some key'
      };

      const verbatim = new Verbatim(options);
      expect(verbatim.ast).toBeUndefined();
      expect(verbatim.arg).toBeUndefined();
      expect(verbatim.copy).toBeUndefined();
      expect(verbatim.key).toBeUndefined();
    });
  });
});
