import Switch from './Switch';

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
});
