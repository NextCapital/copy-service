import Verbatim from '../Verbatim/Verbatim';

import Switch from './Switch';

describe('Switch', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const nestedOptions = {
        key: 'some key',
        sibling: null,
        left: null,
        right: null
      };

      const options = {
        sibling: new Switch(nestedOptions),
        key: 'some key',
        left: new Switch(nestedOptions),
        right: new Switch(nestedOptions)
      };

      const switchInstance = new Switch(options);

      expect(switchInstance).toEqual(expect.objectContaining(options));
    });
  });

  describe('isCacheable', () => {
    test('returns false', () => {
      const options = {
        key: 'some key',
        sibling: null,
        left: null,
        right: null
      };

      const switchInstance = new Switch({
        sibling: new Switch(options),
        key: 'some key',
        left: new Switch(options),
        right: new Switch(options)
      });

      expect(switchInstance.isCacheable()).toBe(false);
    });
  });

  describe('toSyntax', () => {
    test('converts back to a copy string', () => {
      const switchInstance = new Switch({
        sibling: new Verbatim({
          text: '.',
          sibling: null
        }),
        key: 'switch.key',
        left: new Verbatim({
          text: 'left',
          sibling: null
        }),
        right: new Verbatim({
          text: 'right',
          sibling: null
        })
      });

      expect(switchInstance.toSyntax()).toBe(
        '*{left}{right}{switch.key}.'
      );
    });
  });
});
