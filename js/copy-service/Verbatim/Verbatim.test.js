const Verbatim = require('./Verbatim');
const CopyService = require('../CopyService');

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

  describe('isCacheable', () => {
    let copyService;

    beforeEach(() => {
      copyService = new CopyService();
    });

    describe('when there is a sibling', () => {
      test('defers to the sibling', () => {
        const options = {
          sibling: new Verbatim({ key: 'some key' }),
          text: 'some text'
        };

        const verbatim = new Verbatim(options);

        jest.spyOn(verbatim.sibling, 'isCacheable').mockReturnValue(false);
        expect(verbatim.isCacheable(copyService)).toBe(false);
        expect(verbatim.sibling.isCacheable).toHaveBeenCalledWith(copyService);
      });
    });

    describe('when there is no sibling', () => {
      test('returns true', () => {
        const options = {
          sibling: null,
          text: 'some text'
        };

        const verbatim = new Verbatim(options);

        expect(verbatim.isCacheable(copyService)).toBe(true);
      });
    });
  });

  describe('toSyntax', () => {
    test('converts back to a copy string', () => {
      const verbatim = new Verbatim({
        text: 'some text',
        sibling: new Verbatim({ text: '.' })
      });

      expect(verbatim.toSyntax()).toBe('some text.');
    });
  });
});
