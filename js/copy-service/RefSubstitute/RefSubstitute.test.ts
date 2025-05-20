import Verbatim from '../Verbatim/Verbatim';

import RefSubstitute from './RefSubstitute';

describe('RefSubstitute', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const options = {
        sibling: new RefSubstitute({
          key: 'some key',
          sibling: null
        }),
        key: 'some key'
      };

      const reference = new RefSubstitute(options);
      expect(reference).toEqual(expect.objectContaining(options));
    });
  });

  describe('isCacheable', () => {
    test('returns false', () => {
      const options = {
        sibling: new RefSubstitute({
          key: 'some key',
          sibling: null
        }),
        key: 'some key'
      };

      const reference = new RefSubstitute(options);

      expect(reference.isCacheable()).toBe(false);
    });
  });

  describe('toSyntax', () => {
    test('converts back to a copy string', () => {
      const reference = new RefSubstitute({
        key: 'some.copy.key',
        sibling: new Verbatim({
          sibling: null,
          text: '.'
        })
      });

      expect(reference.toSyntax()).toBe('%{some.copy.key}.');
    });
  });
});
