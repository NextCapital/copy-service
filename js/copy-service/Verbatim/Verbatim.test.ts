import CopyService from '../CopyService';
import Verbatim from './Verbatim';

describe('Verbatim', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const options = {
        sibling: new Verbatim({
          sibling: null,
          text: 'child'
        }),
        text: 'some text'
      };

      const verbatim = new Verbatim(options);
      expect(verbatim).toEqual(expect.objectContaining(options));
    });
  });

  describe('isCacheable', () => {
    let copyService: CopyService;

    beforeEach(() => {
      copyService = new CopyService();
    });

    describe('when there is a sibling', () => {
      test('defers to the sibling', () => {
        const options = {
          sibling: new Verbatim({
            sibling: null,
            text: 'child'
          }),
          text: 'some text'
        };

        const verbatim = new Verbatim(options);

        const isCacheableSpy = jest.spyOn(verbatim.sibling!, 'isCacheable').mockReturnValue(false);
        expect(verbatim.isCacheable(copyService)).toBe(false);
        expect(isCacheableSpy).toHaveBeenCalledWith(copyService);
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
        sibling: new Verbatim({
          sibling: null,
          text: '.'
        })
      });

      expect(verbatim.toSyntax()).toBe('some text.');
    });
  });
});
