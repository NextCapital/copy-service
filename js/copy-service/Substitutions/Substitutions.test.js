const ErrorHandler = require('../ErrorHandler/ErrorHandler');
const Substitutions = require('./Substitutions');

describe('Substitutions', () => {
  let substitutions, input;

  beforeEach(() => {
    input = {
      some: 'subs',
      to: 'use',
      deep: {
        test: 'word'
      }
    };

    substitutions = new Substitutions(input);
  });

  describe('constructor', () => {
    test('sets _substitutions', () => {
      expect(substitutions._substitutions).toBe(input);
    });
  });

  describe('get substitutions', () => {
    describe('when _substitutions is a function', () => {
      let func, result;

      beforeEach(() => {
        result = { some: 'result' };
        func = jest.fn().mockReturnValue(result);
        substitutions._substitutions = func;
      });

      test('calls the function and returns the result', () => {
        expect(substitutions.substitutions).toBe(result);
      });

      test('sets _substitutions to the function result', () => {
        expect(substitutions.substitutions).toBe(substitutions._substitutions);
      });
    });

    describe('when _substitutions is not a function', () => {
      test('returns _substitutions', () => {
        expect(substitutions.substitutions).toBe(input);
      });
    });
  });

  describe('get', () => {
    test('deeply gets the value from substitutions', () => {
      expect(substitutions.get('deep.test')).toBe(input.deep.test);
    });

    describe('when the value is undefined', () => {
      beforeEach(() => {
        jest.spyOn(ErrorHandler, 'handleError');
      });

      test('handles the error', () => {
        substitutions.get('fake');
        expect(ErrorHandler.handleError).toBeCalledWith(
          'Substitutions',
          'No value for substitution at key \'fake\' provided'
        );
      });

      test('returns an empty string', () => {
        expect(substitutions.get('fake')).toBe('');
      });
    });
  });

  describe('getBoolean', () => {
    test('gets the substitution for the key', () => {
      const key = 'some.key';
      jest.spyOn(substitutions, 'get').mockReturnValue('');
      substitutions.getBoolean(key);
      expect(substitutions.get).toBeCalledWith(key);
    });

    const testValue = (value, expectedResult) => {
      jest.spyOn(substitutions, 'get').mockReturnValue(value);
      expect(substitutions.getBoolean('some.key')).toBe(expectedResult);
    };

    describe('when a number', () => {
      test('returns true for 1', () => {
        testValue(1, true);
      });

      test('returns false for other numbers', () => {
        testValue(0, false);
        testValue(2, false);
      });
    });

    describe('when not a number', () => {
      test('returns true for truthy values', () => {
        testValue(true, true);
        testValue('test', true);
        testValue(() => 42, true);
      });

      test('returns false for falsy ones', () => {
        testValue(false, false);
        testValue('', false);
        testValue(null, false);
      });
    });
  });
});
