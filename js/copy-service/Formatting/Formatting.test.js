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

  describe('isCacheable', () => {
    describe('when there is a sibling', () => {
      test('defers to the sibling', () => {
        const options = {
          sibling: new Formatting({}),
          copy: 'some copy',
          tag: 'some tag'
        };

        const formatting = new Formatting(options);

        jest.spyOn(formatting.sibling, 'isCacheable').mockReturnValue(false);
        expect(formatting.isCacheable()).toBe(false);
        expect(formatting.sibling.isCacheable).toBeCalled();
      });
    });

    describe('when there is no sibling', () => {
      test('returns true', () => {
        const options = {
          sibling: null,
          copy: 'some copy',
          tag: 'some tag'
        };

        const formatting = new Formatting(options);

        expect(formatting.isCacheable()).toBe(true);
      });
    });
  });
});
