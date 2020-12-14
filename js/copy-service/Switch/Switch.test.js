const Switch = require('./Switch');
const Verbatim = require('../Verbatim/Verbatim');

describe('Switch', () => {
  describe('constructor', () => {
    test('sets valid options to the instance', () => {
      const options = {
        sibling: new Switch({ key: 'some key' }),
        key: 'some key',
        left: new Switch({ key: 'some key' }),
        right: new Switch({ key: 'some key' })
      };

      const switchInstance = new Switch(options);
      expect(switchInstance).toEqual(expect.objectContaining(options));
    });

    test('does not set invalid options to the instance', () => {
      const options = {
        ast: 'some ast',
        text: 'some text',
        arg: 'some arg',
        copy: 'some copy',

        key: 'some key'
      };

      const switchInstance = new Switch(options);
      expect(switchInstance.ast).toBeUndefined();
      expect(switchInstance.text).toBeUndefined();
      expect(switchInstance.arg).toBeUndefined();
      expect(switchInstance.copy).toBeUndefined();
    });
  });

  describe('isCacheable', () => {
    test('returns false', () => {
      const options = {
        sibling: new Switch({ key: 'some key' }),
        key: 'some key',
        left: new Switch({ key: 'some key' }),
        right: new Switch({ key: 'some key' })
      };

      const switchInstance = new Switch(options);

      expect(switchInstance.isCacheable()).toBe(false);
    });
  });

  describe('toSyntax', () => {
    test('converts back to a copy string', () => {
      const switchInstance = new Switch({
        sibling: new Verbatim({ text: '.' }),
        key: 'switch.key',
        left: new Verbatim({ text: 'left' }),
        right: new Verbatim({ text: 'right' })
      });

      expect(switchInstance.toSyntax()).toBe(
        '*{left}{right}{switch.key}.'
      );
    });
  });
});
