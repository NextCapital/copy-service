import Verbatim from '../Verbatim/Verbatim';

import Functional from './Functional';

describe('Functional', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const options = {
        sibling: new Functional({ key: 'some key' }),
        copy: 'some copy',
        key: 'some key',
        args: ['some args', 'some more args']
      };

      const functional = new Functional(options);
      expect(functional).toEqual(expect.objectContaining(options));
    });

    test('defaults args to an empty array', () => {
      const functional = new Functional({ key: 'some key' });
      expect(functional.args).toEqual([]);
    });

    test('does not set invalid options to the instance', () => {
      const options = {
        ast: 'some ast',
        text: 'some text',
        arg: 'some arg',

        key: 'some key'
      };

      const functional = new Functional(options);
      expect('ast' in functional).toBe(false);
      expect('test' in functional).toBe(false);
      expect('arg' in functional).toBe(false);
    });
  });

  describe('isCacheable', () => {
    test('returns false', () => {
      const options = {
        sibling: new Functional({ key: 'some key' }),
        copy: 'some copy',
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
          sibling: new Verbatim({ text: '.' }),
          copy: new Verbatim({ text: 'some copy' }),
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
          sibling: new Verbatim({ text: '.' }),
          copy: new Verbatim({ text: 'some copy' }),
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
