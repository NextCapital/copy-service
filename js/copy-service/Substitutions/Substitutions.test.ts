import ErrorHandler from '../ErrorHandler/ErrorHandler.js';

import Substitutions from './Substitutions.js';

describe('Substitutions', () => {
  let substitutions: Substitutions;
  let input: {
    some: string;
    to: string;
    deep: {
      test: string;
    };
  };

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
      // @ts-expect-error - Accessing private property for testing
      expect(substitutions._substitutions).toBe(input);
    });
  });

  describe('get substitutions', () => {
    describe('when _substitutions is a function', () => {
      let func: () => object;
      let result: {
        some: string;
      };

      beforeEach(() => {
        result = { some: 'result' };
        func = jest.fn().mockReturnValue(result);
        // @ts-expect-error - Accessing private property for testing
        substitutions._substitutions = func;
      });

      test('calls the function and returns the result', () => {
        expect(substitutions.substitutions).toBe(result);
      });

      test('sets _substitutions to the function result', () => {
        // @ts-expect-error - Accessing private property for testing
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
        expect(ErrorHandler.handleError).toHaveBeenCalledWith(
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
      expect(substitutions.get).toHaveBeenCalledWith(key);
    });

    const testValue = (
      testMessage: string,
      value: any, // eslint-disable-line @typescript-eslint/no-explicit-any
      expectedResult: boolean
    ) => {
      test(testMessage, () => { // eslint-disable-line jest/valid-title
        jest.spyOn(substitutions, 'get').mockReturnValue(value);
        expect(substitutions.getBoolean('some.key')).toBe(expectedResult);
      });
    };

    describe('when a number', () => {
      testValue('returns true for 1', 1, true);
      testValue('returns false for other numbers', 0, false);
      testValue('returns false for other numbers', 2, false);
    });

    describe('when not a number', () => {
      testValue('returns true for truthy values', true, true);
      testValue('returns true for truthy values', 'test', true);
      testValue('returns true for truthy values', () => 42, true);

      testValue('returns false for falsy ones', false, false);
      testValue('returns false for falsy ones', '', false);
      testValue('returns false for falsy ones', null, false);
    });
  });
});
