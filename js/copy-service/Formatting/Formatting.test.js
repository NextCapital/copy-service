import Formatting from './Formatting';
import Verbatim from '../Verbatim/Verbatim';
import CopyService from '../CopyService';

describe('Formatting', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const options = {
        sibling: new Formatting({}),
        copy: new Verbatim({ text: 'some copy' }),
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
    let copyService;

    beforeEach(() => {
      copyService = new CopyService();
    });

    describe('when there is a sibling', () => {
      describe('when there is no copy', () => {
        test('defers to the sibling', () => {
          const options = {
            sibling: new Formatting({}),
            copy: null,
            tag: 'some tag'
          };

          const formatting = new Formatting(options);

          jest.spyOn(formatting.sibling, 'isCacheable').mockReturnValue(false);
          expect(formatting.isCacheable(copyService)).toBe(false);
          expect(formatting.sibling.isCacheable).toBeCalledWith(copyService);
        });
      });

      describe('when there is copy', () => {
        describe('when the copy is cacheable', () => {
          describe('when the sibling is cacheable', () => {
            test('returns true', () => {
              const options = {
                sibling: new Verbatim({ text: 'some copy' }),
                copy: new Verbatim({ text: 'some copy' }),
                tag: 'some tag'
              };

              const formatting = new Formatting(options);
              jest.spyOn(formatting.copy, 'isCacheable').mockReturnValue(true);
              jest.spyOn(formatting.sibling, 'isCacheable').mockReturnValue(true);

              expect(formatting.isCacheable(copyService)).toBe(true);
            });
          });

          describe('when the sibling is not cacheable', () => {
            test('returns false', () => {
              const options = {
                sibling: new Verbatim({ text: 'some copy' }),
                copy: new Verbatim({ text: 'some copy' }),
                tag: 'some tag'
              };

              const formatting = new Formatting(options);
              jest.spyOn(formatting.copy, 'isCacheable').mockReturnValue(true);
              jest.spyOn(formatting.sibling, 'isCacheable').mockReturnValue(false);

              expect(formatting.isCacheable(copyService)).toBe(false);
            });
          });
        });

        describe('when the copy is not cacheable', () => {
          test('returns false', () => {
            const options = {
              sibling: new Verbatim({ text: 'some copy' }),
              copy: new Verbatim({ text: 'some copy' }),
              tag: 'some tag'
            };

            const formatting = new Formatting(options);
            jest.spyOn(formatting.copy, 'isCacheable').mockReturnValue(false);
            jest.spyOn(formatting.sibling, 'isCacheable').mockReturnValue(true);

            expect(formatting.isCacheable(copyService)).toBe(false);
          });
        });
      });
    });

    describe('when there is no sibling', () => {
      describe('when there is copy', () => {
        test('defers to isCacheable on the copy', () => {
          const options = {
            sibling: null,
            copy: new Verbatim({ text: 'some copy' }),
            tag: 'some tag'
          };

          const formatting = new Formatting(options);
          jest.spyOn(formatting.copy, 'isCacheable').mockReturnValue(false);

          expect(formatting.isCacheable(copyService)).toBe(false);
          expect(formatting.copy.isCacheable).toBeCalledWith(copyService);
        });
      });

      describe('when there is not copy', () => {
        test('returns true', () => {
          const options = {
            sibling: null,
            copy: null,
            tag: 'some tag'
          };

          const formatting = new Formatting(options);

          expect(formatting.isCacheable(copyService)).toBe(true);
        });
      });
    });
  });

  describe('toSyntax', () => {
    test('converts copy back to a string', () => {
      const formatting = new Formatting({
        tag: 'strong',
        copy: new Verbatim({ text: 'some text' }),
        sibling: new Verbatim({ text: '.' })
      });

      expect(formatting.toSyntax()).toBe(
        '<strong>some text</strong>.'
      );
    });
  });
});
