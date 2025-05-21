import Verbatim from '../Verbatim/Verbatim';

import Substitute from './Substitute';

describe('Substitute', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const options = {
        sibling: new Substitute({
          key: 'some key',
          sibling: null
        }),
        key: 'some key'
      };

      const substitute = new Substitute(options);
      expect(substitute).toEqual(expect.objectContaining(options));
    });
  });

  describe('isCacheable', () => {
    test('returns false', () => {
      const options = {
        sibling: new Substitute({
          key: 'some key',
          sibling: null
        }),
        key: 'some key'
      };

      const substitute = new Substitute(options);

      expect(substitute.isCacheable()).toBe(false);
    });
  });

  describe('toSyntax', () => {
    test('converts back to a copy string', () => {
      const reference = new Substitute({
        key: 'some.sub.key',
        sibling: new Verbatim({
          text: '.',
          sibling: null
        })
      });

      expect(reference.toSyntax()).toBe('#{some.sub.key}.');
    });
  });
});
