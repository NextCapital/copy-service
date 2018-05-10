import Formatting from './Formatting';

describe('Formatting', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const options = {
        sibling: new Formatting({}),
        copy: 'some copy',
        tag: 'some tag'
      };

      const formatting = new Formatting(options);
      expect(formatting).toEqual(expect.objectContaining(options));
    });

    test('does not set invalid options to the instance', () => {
      const options = {
        key: 'some key',
        text: 'some text',
        arg: 'some arg'
      };

      const formatting = new Formatting(options);
      expect(formatting.key).toBeUndefined();
      expect(formatting.text).toBeUndefined();
      expect(formatting.arg).toBeUndefined();
    });
  });
});
