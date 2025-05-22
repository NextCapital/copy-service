import Verbatim from '../Verbatim/Verbatim';

import Functional from './Functional';

describe('Functional', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const nestedOption = {
        key: 'some key',
        sibling: null,
        copy: null,
        args: []
      };
      const options = {
        sibling: new Functional(nestedOption),
        copy: new Functional(nestedOption),
        key: 'some key',
        args: ['some args', 'some more args']
      };

      const functional = new Functional(options);
      expect(functional).toEqual(expect.objectContaining(options));
    });

    test('defaults args to an empty array', () => {
      const functional = new Functional({
        key: 'some key',
        sibling: null,
        copy: null,
        args: []
      });
      expect(functional.args).toEqual([]);
    });
  });

  describe('isCacheable', () => {
    test('returns false', () => {
      const nestedOption = {
        key: 'some key',
        sibling: null,
        copy: null,
        args: []
      };
      const options = {
        sibling: new Functional(nestedOption),
        copy: new Functional(nestedOption),
        key: 'some key',
        args: ['some args', 'some more args']
      };

      const functional = new Functional(options);

      expect(functional.isCacheable()).toBe(false);
    });
  });

  describe('toSyntax', () => {
    describe('when there are args', () => {
      test('converts back to a copy string', () => {
        const functional = new Functional({
          sibling: new Verbatim({
            sibling: null,
            text: '.'
          }),
          copy: new Verbatim({
            sibling: null,
            text: 'some copy'
          }),
          key: 'some.key',
          args: ['one', 'two']
        });

        expect(functional.toSyntax()).toBe(
          '^{some copy}{some.key}[one,two].'
        );
      });
    });

    describe('when there are not args', () => {
      test('converts back to a copy string', () => {
        const functional = new Functional({
          sibling: new Verbatim({
            sibling: null,
            text: '.'
          }),
          copy: new Verbatim({
            sibling: null,
            text: 'some copy'
          }),
          key: 'some.key',
          args: []
        });

        expect(functional.toSyntax()).toBe(
          '^{some copy}{some.key}.'
        );
      });
    });
  });
});
