const Reference = require('./Reference');
const Verbatim = require('../Verbatim/Verbatim').default;
const CopyService = require('../CopyService');

describe('Reference', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const options = {
        sibling: new Reference({ key: 'some key' }),
        key: 'some key'
      };

      const reference = new Reference(options);
      expect(reference).toEqual(expect.objectContaining(options));
    });

    test('does not set invalid options to the instance', () => {
      const options = {
        ast: 'some ast',
        text: 'some text',
        arg: 'some arg',
        copy: 'some copy',

        key: 'some key'
      };

      const reference = new Reference(options);
      expect(reference.ast).toBeUndefined();
      expect(reference.text).toBeUndefined();
      expect(reference.arg).toBeUndefined();
      expect(reference.copy).toBeUndefined();
    });
  });

  describe('isCacheable', () => {
    let copyService;

    beforeEach(() => {
      copyService = new CopyService();
    });

    describe('when the referenced ast node is found', () => {
      let node;

      beforeEach(() => {
        node = new Reference({ key: 'some.other.key' });
        jest.spyOn(copyService, 'getAstForKey').mockReturnValue(node);
      });

      describe('when the node is cacheable', () => {
        beforeEach(() => {
          jest.spyOn(node, 'isCacheable').mockReturnValue(true);
        });

        describe('when there is a sibling', () => {
          describe('when the sibling is cacheable', () => {
            test('returns true', () => {
              const options = {
                sibling: new Reference({ key: 'some key' }),
                key: 'some key'
              };

              const reference = new Reference(options);
              jest.spyOn(reference.sibling, 'isCacheable').mockReturnValue(true);

              expect(reference.isCacheable(copyService)).toBe(true);
              expect(reference.sibling.isCacheable).toHaveBeenCalledWith(copyService);
            });
          });

          describe('when the sibling is not cacheable', () => {
            test('returns false', () => {
              const options = {
                sibling: new Reference({ key: 'some key' }),
                key: 'some key'
              };

              const reference = new Reference(options);
              jest.spyOn(reference.sibling, 'isCacheable').mockReturnValue(false);

              expect(reference.isCacheable(copyService)).toBe(false);
              expect(reference.sibling.isCacheable).toHaveBeenCalledWith(copyService);
            });
          });
        });

        describe('when there is not a sibling', () => {
          test('returns true', () => {
            const options = {
              sibling: null,
              key: 'some key'
            };

            const reference = new Reference(options);

            expect(reference.isCacheable(copyService)).toBe(true);
          });
        });
      });

      describe('when the node is not cacheable', () => {
        beforeEach(() => {
          jest.spyOn(node, 'isCacheable').mockReturnValue(false);
        });

        test('returns false', () => {
          const options = {
            sibling: new Reference({ key: 'some key' }),
            key: 'some key'
          };

          const reference = new Reference(options);

          expect(reference.isCacheable(copyService)).toBe(false);
          expect(node.isCacheable).toHaveBeenCalledWith(copyService);
        });
      });
    });

    describe('when the referenced ast node is not found', () => {
      beforeEach(() => {
        jest.spyOn(copyService, 'getAstForKey').mockReturnValue(null);
      });

      test('returns false', () => {
        const options = {
          sibling: new Reference({ key: 'some key' }),
          key: 'some key'
        };

        const reference = new Reference(options);

        expect(reference.isCacheable(copyService)).toBe(false);
      });
    });
  });

  describe('toSyntax', () => {
    test('converts back to a copy string', () => {
      const reference = new Reference({
        key: 'some.copy.key',
        sibling: new Verbatim({
          sibling: null,
          text: '.'
        })
      });

      expect(reference.toSyntax()).toBe('${some.copy.key}.');
    });
  });
});
