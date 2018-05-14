import Evaluator from './Evaluator';

describe('Evaluator', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('throws error', () => {
      expect(() => new Evaluator()).toThrow('Evaluator: Evaluator is a singleton');
    });
  });

  describe('evalAST', () => {
    test('throws error', () => {
      expect(() => Evaluator.evalAST()).toThrow(
        'evalAST is abstract and must be implemented by the extending class'
      );
    });
  });

  describe('_getInitialResult', () => {
    test('throws error', () => {
      expect(() => Evaluator._getInitialResult()).toThrow(
        '_getInitialResult is abstract and must be implemented by the extending class'
      );
    });
  });

  describe('_trySubstitution', () => {
    describe('when the substitution is found in the passed substitutions', () => {
      test('returns substitution value', () => {
        const key = 'key';
        const substitutions = { [key]: 'value' };

        expect(Evaluator._trySubstitution(substitutions, key)).toBe(substitutions[key]);
      });
    });

    describe('when the substitution is not found in the passed substitutions', () => {
      beforeEach(() => {
        jest.spyOn(Evaluator, '_handleError').mockImplementation();
      });

      afterEach(() => {
        Evaluator._handleError.mockRestore();
      });

      test('logs error', () => {
        const substitutionKey = 'some.key';

        Evaluator._trySubstitution({}, substitutionKey);
        expect(Evaluator._handleError).toBeCalledWith(
          `No value for substitution at key ${substitutionKey} provided`
        );
      });

      test('returns empty string', () => {
        expect(Evaluator._trySubstitution({}, 'some.key')).toBe('');
      });
    });
  });

  describe('_handleError', () => {
    describe('when options.halt is true', () => {
      describe('when in dev mode', () => {
        beforeEach(() => {
          jest.spyOn(Evaluator, '_isInDevMode').mockReturnValue(true);
        });

        afterEach(() => {
          Evaluator._isInDevMode.mockRestore();
        });

        test('throws error', () => {
          const error = 'some error';
          expect(() => Evaluator._handleError(error, { halt: true })).toThrow(
            `Evaluator: ${error}`
          );
        });
      });

      describe('when not in dev mode', () => {
        beforeEach(() => {
          jest.spyOn(Evaluator, '_isInDevMode').mockReturnValue(false);
        });

        afterEach(() => {
          Evaluator._isInDevMode.mockRestore();
        });

        test('throws error', () => {
          const error = 'some error';
          expect(() => Evaluator._handleError(error, { halt: true })).toThrow(
            `Evaluator: ${error}`
          );
        });
      });
    });

    describe('when options.halt is falsy', () => {
      beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation();
      });

      afterEach(() => {
        console.error.mockRestore(); // eslint-disable-line no-console
      });

      describe('when in dev mode', () => {
        beforeEach(() => {
          jest.spyOn(Evaluator, '_isInDevMode').mockReturnValue(true);
        });

        afterEach(() => {
          Evaluator._isInDevMode.mockRestore();
        });

        test('does not throw error', () => {
          const error = 'some error';
          expect(() => Evaluator._handleError(error)).not.toThrow();
        });

        test('logs error to console', () => {
          const error = 'some error';

          Evaluator._handleError(error, { halt: false });
          // eslint-disable-next-line no-console
          expect(console.error).toBeCalledWith(`Evaluator: ${error}`);
        });
      });

      describe('when not in dev mode', () => {
        beforeEach(() => {
          jest.spyOn(Evaluator, '_isInDevMode').mockReturnValue(false);
        });

        afterEach(() => {
          Evaluator._isInDevMode.mockRestore();
        });

        test('does not throw error', () => {
          const error = 'some error';
          expect(() => Evaluator._handleError(error, { halt: false })).not.toThrow();
        });

        test('does not log error to console', () => {
          const error = 'some error';

          Evaluator._handleError(error, { halt: false });
          expect(console.error).not.toBeCalled(); // eslint-disable-line no-console
        });
      });
    });
  });

  describe('_isInDevMode', () => {
    test('returns DEV_MODE', () => {
      expect(Evaluator._isInDevMode()).toBe(global.DEV_MODE);
    });
  });
});
