import Newline from './Newline';

describe('Newline', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const options = { sibling: new Newline({}) };

      const newline = new Newline(options);
      expect(newline).toEqual(expect.objectContaining(options));
    });

    test('does not set invalid options to the instance', () => {
      const options = {
        ast: 'some ast',
        text: 'some text',
        arg: 'some arg',
        key: 'some key',
        copy: 'some copy'
      };

      const newline = new Newline(options);
      expect(newline.ast).toBeUndefined();
      expect(newline.text).toBeUndefined();
      expect(newline.arg).toBeUndefined();
      expect(newline.key).toBeUndefined();
      expect(newline.copy).toBeUndefined();
    });
  });
});
