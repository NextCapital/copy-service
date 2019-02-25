import ErrorHandler from './ErrorHandler';

describe('ErrorHandler', () => {
  describe('handleError', () => {
    let name, error, options;

    beforeEach(() => {
      name = 'some name';
      error = 'some error';
      options = {};

      jest.spyOn(console, 'error').mockImplementation();
    });

    describe('when options.halt is true', () => {
      beforeEach(() => {
        options.halt = true;
      });

      test('throws the error', () => {
        expect(() => ErrorHandler.handleError(name, error, options)).toThrow(
          `${name}: ${error}`
        );
      });
    });

    describe('when options.halt is false', () => {
      describe('when is dev mode', () => {
        beforeEach(() => {
          jest.spyOn(ErrorHandler, 'isInDevMode').mockReturnValue(true);
        });

        test('logs the error', () => {
          ErrorHandler.handleError(name, error, options);
          expect(console.error).toBeCalledWith(`${name}: ${error}`);
        });
      });

      describe('when not in dev mode', () => {
        beforeEach(() => {
          jest.spyOn(ErrorHandler, 'isInDevMode').mockReturnValue(false);
        });

        test('does nothing', () => {
          ErrorHandler.handleError(name, error, options);
          expect(console.error).not.toBeCalled();
        });
      });
    });
  });

  describe('isInDevMode', () => {
    test('returns true if NODE_ENV is not production', () => {
      process.env.NODE_ENV = 'development';
      expect(ErrorHandler.isInDevMode()).toBe(true);
    });

    test('returns false if NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      expect(ErrorHandler.isInDevMode()).toBe(false);
    });
  });
});
