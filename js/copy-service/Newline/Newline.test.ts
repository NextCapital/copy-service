import CopyService from '../CopyService';
import Verbatim from '../Verbatim/Verbatim';

import Newline from './Newline';

describe('Newline', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const options = {
        sibling: new Newline({
          sibling: null
        })
      };

      const newline = new Newline(options);
      expect(newline).toEqual(expect.objectContaining(options));
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
          sibling: new Newline({
            sibling: null
          })
        };

        const newline = new Newline(options);

        const isCacheableSpy = jest.spyOn(
          newline.sibling!,
          'isCacheable'
        ).mockReturnValue(false);
        expect(newline.isCacheable(copyService)).toBe(false);
        expect(isCacheableSpy).toHaveBeenCalledWith(copyService);
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
      const newline = new Newline({
        sibling: new Verbatim({
          text: 'some text',
          sibling: null
        })
      });
      expect(newline.toSyntax()).toBe('\nsome text');
    });
  });
});
