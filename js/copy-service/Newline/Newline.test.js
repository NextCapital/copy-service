const Newline = require('./Newline');
const Verbatim = require('../Verbatim/Verbatim');
const CopyService = require('../CopyService');

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

  describe('isCacheable', () => {
    let copyService;

    beforeEach(() => {
      copyService = new CopyService();
    });

    describe('when there is a sibling', () => {
      test('defers to the sibling', () => {
        const options = { sibling: new Newline({}) };

        const newline = new Newline(options);

        jest.spyOn(newline.sibling, 'isCacheable').mockReturnValue(false);
        expect(newline.isCacheable(copyService)).toBe(false);
        expect(newline.sibling.isCacheable).toBeCalledWith(copyService);
      });
    });

    describe('when there is no sibling', () => {
      test('returns true', () => {
        const options = { sibling: null };

        const newline = new Newline(options);

        expect(newline.isCacheable(copyService)).toBe(true);
      });
    });
  });

  describe('toSyntax', () => {
    test('converts back to a copy string', () => {
      const newline = new Newline({ sibling: new Verbatim({ text: 'some text' }) });
      expect(newline.toSyntax()).toBe('\nsome text');
    });
  });
});
