import _ from 'lodash';

import Parser from './Parser/Parser';

import CopyService from './CopyService';

describe('CopyService', () => {
  let copyService;

  beforeEach(() => {
    copyService = new CopyService();
  });

  afterEach(() => {
    copyService = null;
  });

  describe('constructor', () => {
    describe('when no options are passed', () => {
      test('assigns default properties', () => {
        const copyService = new CopyService();
        expect(copyService).toEqual({
          _parsedCopy: {},
          evaluator: undefined
        });
      });
    });

    describe('when options are passed', () => {
      describe('evaluator option', () => {
        test('sets evaluator', () => {
          const evaluator = 'some evaluator';

          const copyService = new CopyService({ evaluator });
          expect(copyService.evaluator).toBe(evaluator);
        });
      });

      describe('copy option', () => {
        let parsedCopy;

        beforeEach(() => {
          parsedCopy = { some: 'parsed copy' };
          jest.spyOn(Parser, 'parseLeaves').mockReturnValue(parsedCopy);
        });

        afterEach(() => {
          parsedCopy = null;
          Parser.parseLeaves.mockRestore();
        });

        test('parses the passed copy', () => {
          const copy = { some: 'unparsed copy' };

          const copyService = new CopyService({ copy });
          expect(Parser.parseLeaves).toBeCalledWith(copy);
        });

        test('sets _parsedCopy with parsed copy', () => {
          const copy = { some: 'unparsed copy' };

          const copyService = new CopyService({ copy });
          expect(copyService._parsedCopy).toEqual(parsedCopy);
        });
      });
    });
  });

  describe('registerCopy', () => {
    describe('when an empty copy config is passed', () => {
      beforeEach(() => {
        jest.spyOn(copyService, '_handleError').mockImplementation();
      });

      afterEach(() => {
        copyService._handleError.mockRestore();
      });

      test('logs error', () => {
        copyService.registerCopy();
        expect(copyService._handleError).toBeCalledWith('Copy provided in wrong format.');
      });

      test('does not modify _parsedCopy', () => {
        const parsedCopy = {};
        copyService._parsedCopy = parsedCopy;

        copyService.registerCopy();
        expect(copyService._parsedCopy).toBe(parsedCopy);
      });

      test('returns undefined', () => {
        expect(copyService.registerCopy()).toBeUndefined();
      });
    });

    describe('when a populated copy config is passed', () => {
      let parsedCopy;

      beforeEach(() => {
        parsedCopy = { some: 'parsed copy' };
        jest.spyOn(Parser, 'parseLeaves').mockReturnValue(parsedCopy);
      });

      afterEach(() => {
        parsedCopy = null;
        Parser.parseLeaves.mockRestore();
      });

      test('calls Parser.parseLeaves with the unparsed copy', () => {
        const unparsedCopy = { some: 'unparsed copy' };

        copyService.registerCopy(unparsedCopy);
        expect(Parser.parseLeaves).toBeCalledWith(unparsedCopy);
      });

      test('merges _parsedCopy with parsed copy', () => {
        const unparsedCopy = { some: 'unparsed copy' };
        const alreadyParsedCopy = {
          some: 'already parsedCopy',
          more: {
            'stuff': 'copy'
          }
        };
        copyService._parsedCopy = alreadyParsedCopy;

        copyService.registerCopy(unparsedCopy);
        expect(copyService._parsedCopy).toEqual(_.merge(alreadyParsedCopy, parsedCopy));
      });
    });
  });

  describe('getCopy', () => {
    describe('when a key with parsed copy is passed', () => {
      test('calls evaluator.evalAST with the AST for the key and any substitutions', () => {
        const initialResult = 'some initialResult';
        const key = 'some key';
        const parsedCopy = { 'key': key };
        const substitutions = { some: 'substitutions' };

        copyService._parsedCopy = parsedCopy;
        copyService.evaluator = {
          evalAST: jest.fn(),
          _getInitialResult: jest.fn().mockReturnValue(initialResult)
        };

        copyService.getCopy('key', substitutions);
        expect(copyService.evaluator.evalAST).toBeCalledWith(initialResult, key, substitutions);
      });

      test('returns result of evaluator.evalAST', () => {
        const key = 'some key';
        const parsedCopy = { 'key': key };
        const evaluatedCopy = 'some evaluated copy';

        copyService._parsedCopy = parsedCopy;
        copyService.evaluator = {
          evalAST: jest.fn().mockReturnValue(evaluatedCopy),
          _getInitialResult: jest.fn().mockReturnValue('')
        };

        expect(copyService.getCopy('key')).toBe(evaluatedCopy);
      });
    });

    describe('when an invalid key is passed', () => {
      beforeEach(() => {
        copyService.evaluator = {
          evalAST: jest.fn(),
          _getInitialResult: jest.fn().mockReturnValue('')
        }

        jest.spyOn(copyService, '_handleError').mockImplementation();
      });

      afterEach(() => {
        copyService._handleError.mockRestore();
      });

      test('logs error', () => {
        const key = 'some.key.with.no.copy';
        copyService.getCopy(key);
        expect(copyService._handleError).toBeCalledWith(`No AST found for copy key: ${key}`);
      });

      test('returns undefined', () => {
        const key = 'some.key.with.no.copy';
        expect(copyService.getCopy(key)).toBeUndefined();
      });
    });
  });

  describe('buildSubkeys', () => {
    let parsedCopy;

    beforeEach(() => {
      parsedCopy = {
        level1: 'some text',
        level2: {
          text: 'some text',
          level3: {
            text: 'some text'
          }
        }
      };

      copyService._parsedCopy = parsedCopy;
      jest.spyOn(copyService, 'getSubkeys');
    });

    afterEach(() => {
      parsedCopy = null;
    });

    test('calls getSubkeys', () => {
      const key = 'level2';

      copyService.buildSubkeys(key);
      expect(copyService.getSubkeys).toBeCalledWith(key);
    });

    test('returns the paths of every subkey of the passed key', () => {
      const key = 'level2';

      expect(copyService.buildSubkeys(key)).toEqual({
        text: 'level2.text',
        level3: {
          text: 'level2.level3.text'
        }
      });
    });
  });

  describe('getSubkeys', () => {
    test('returns parsedCopy at key', () => {
      const key = {
        some: 'parsed copy',
        more: 'stuff'
      };
      const parsedCopy = { 'key': key };
      copyService._parsedCopy = parsedCopy;

      expect(copyService.getSubkeys('key')).toBe(key);
    });
  });

  describe('hasKey', () => {
    describe('when the key exists in parsed copy', () => {
      test('returns true', () => {
        const key = 'key';
        jest.spyOn(copyService, 'getSubkeys').mockReturnValue({ [key]: 'parsed copy' });
        expect(copyService.hasKey(key)).toBe(true);
      });
    });

    describe('when the key does not exist in parsed copy', () => {
      test('returns false', () => {
        jest.spyOn(copyService, 'getSubkeys').mockReturnValue();
        expect(copyService.hasKey('key')).toBe(false);
      });
    });
  });

  describe('_handleError', () => {
    describe('when options.halt is true', () => {
      describe('when in dev mode', () => {
        beforeEach(() => {
          jest.spyOn(copyService, '_isInDevMode').mockReturnValue(true);
        });

        afterEach(() => {
          copyService._isInDevMode.mockRestore();
        });

        test('throws error', () => {
          const error = 'some error';
          expect(() => copyService._handleError(error, { halt: true })).toThrow(`CopyService: ${error}`);
        });
      });

      describe('when not in dev mode', () => {
        beforeEach(() => {
          jest.spyOn(copyService, '_isInDevMode').mockReturnValue(false);
        });

        afterEach(() => {
          copyService._isInDevMode.mockRestore();
        });

        test('throws error', () => {
          const error = 'some error';
          expect(() => copyService._handleError(error, { halt: true })).toThrow(`CopyService: ${error}`);
        });
      });
    });

    describe('when options.halt is falsy', () => {
      beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation();
      });

      afterEach(() => {
        console.error.mockRestore();
      });

      describe('when in dev mode', () => {
        beforeEach(() => {
          jest.spyOn(copyService, '_isInDevMode').mockReturnValue(true);
        });

        afterEach(() => {
          copyService._isInDevMode.mockRestore();
        });

        test('does not throw error', () => {
          const error = 'some error';
          expect(() => copyService._handleError(error)).not.toThrow();
        });

        test('logs error to console', () => {
          const error = 'some error';

          copyService._handleError(error);
          expect(console.error).toBeCalledWith(`CopyService: ${error}`);
        });
      });

      describe('when not in dev mode', () => {
        beforeEach(() => {
          jest.spyOn(copyService, '_isInDevMode').mockReturnValue(false);
        });

        afterEach(() => {
          copyService._isInDevMode.mockRestore();
        });

        test('does not throw error', () => {
          const error = 'some error';
          expect(() => copyService._handleError(error)).not.toThrow();
        });

        test('does not log error to console', () => {
          const error = 'some error';

          copyService._handleError(error);
          expect(console.error).not.toBeCalled();
        });
      });
    });
  });

  describe('_isInDevMode', () => {
    test('returns DEV_MODE', () => {
      expect(copyService._isInDevMode()).toBe(global.DEV_MODE);
    });
  });
});
