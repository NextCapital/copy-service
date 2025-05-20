const Verbatim = require('../Verbatim/Verbatim');
const WordBreak = require('./WordBreak');
const CopyService = require('../CopyService');

describe('WordBreak', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const options = { sibling: new WordBreak({}) };

      const wordbreak = new WordBreak(options);
      expect(wordbreak).toEqual(expect.objectContaining(options));
    });

    test('does not set invalid options to the instance', () => {
      const options = {
        ast: 'some ast',
        text: 'some text',
        arg: 'some arg',
        key: 'some key',
        copy: 'some copy'
      };

      const wordbreak = new WordBreak(options);
      expect(wordbreak.ast).toBeUndefined();
      expect(wordbreak.text).toBeUndefined();
      expect(wordbreak.arg).toBeUndefined();
      expect(wordbreak.key).toBeUndefined();
      expect(wordbreak.copy).toBeUndefined();
    });
  });

  describe('isCacheable', () => {
    let copyService;

    beforeEach(() => {
      copyService = new CopyService();
    });

    describe('when there is a sibling', () => {
      test('defers to the sibling', () => {
        const options = { sibling: new WordBreak({}) };

        const wordbreak = new WordBreak(options);

        jest.spyOn(wordbreak.sibling, 'isCacheable').mockReturnValue(false);
        expect(wordbreak.isCacheable(copyService)).toBe(false);
        expect(wordbreak.sibling.isCacheable).toHaveBeenCalledWith(copyService);
      });
    });

    describe('when there is no sibling', () => {
      test('returns true', () => {
        const options = { sibling: null };

        const wordbreak = new WordBreak(options);

        expect(wordbreak.isCacheable(copyService)).toBe(true);
      });
    });
  });

  describe('toSyntax', () => {
    test('converts back to a copy string', () => {
      const wordbreak = new WordBreak({ sibling: new Verbatim({ text: 'some text' }) });
      expect(wordbreak.toSyntax()).toBe('\bsome text');
    });
  });
});
