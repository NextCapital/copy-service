import CopyService from '../CopyService';
import Verbatim from '../Verbatim/Verbatim';
import WordBreak from './WordBreak';

describe('WordBreak', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const options = { sibling: new WordBreak({ sibling: new WordBreak({ sibling: null }) }) };

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
      } as any;

      const wordbreak = new WordBreak(options);
      expect((wordbreak as any).ast).toBeUndefined();
      expect((wordbreak as any).text).toBeUndefined();
      expect((wordbreak as any).arg).toBeUndefined();
      expect((wordbreak as any).key).toBeUndefined();
      expect((wordbreak as any).copy).toBeUndefined();
    });
  });

  describe('isCacheable', () => {
    let copyService: CopyService;

    beforeEach(() => {
      copyService = new CopyService();
    });

    describe('when there is a sibling', () => {
      test('defers to the sibling', () => {
        const options = { sibling: new WordBreak({ sibling: null }) };
        
        const wordbreak = new WordBreak(options);

        const isCacheableSpy = jest.spyOn(wordbreak.sibling as WordBreak, 'isCacheable').mockReturnValue(false);
        expect(wordbreak.isCacheable(copyService)).toBe(false);
        expect(isCacheableSpy).toHaveBeenCalledWith(copyService);
      });
    });

    describe('when there is no sibling', () => {
      test('returns true', () => {
        const wordbreak = new WordBreak({ sibling: null });
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
