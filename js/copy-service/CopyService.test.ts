import _ from 'lodash';

import Parser from './Parser/Parser.js';
import SyntaxNode from './SyntaxNode/SyntaxNode.js';
import ErrorHandler from './ErrorHandler/ErrorHandler.js';
import CopyService, { type AST, type CopyFile } from './CopyService.js';

describe('CopyService', () => {
  let copyService: CopyService;

  beforeEach(() => {
    copyService = new CopyService();
  });

  describe('constructor', () => {
    describe('when options are passed', () => {
      describe('copy option', () => {
        test('sets _registeredCopy with the passed copy', () => {
          const copy = { some: 'unparsed copy' };

          copyService = new CopyService({ copy });
          // @ts-expect-error Accessing private property for testing
          expect(copyService._registeredCopy).toEqual(copy);
        });
      });

      describe('errorOnMissingRefs option', () => {
        test('sets errorOnMissingRefs with the passed value', () => {
          copyService = new CopyService({ errorOnMissingRefs: true });
          expect(copyService.errorOnMissingRefs).toBe(true);
        });

        test('sets errorOnMissingRefs to false if not passed', () => {
          copyService = new CopyService();
          expect(copyService.errorOnMissingRefs).toBe(false);
        });
      });
    });
  });

  describe('registerCopy', () => {
    describe('when an empty copy config is passed', () => {
      beforeEach(() => {
        jest.spyOn(ErrorHandler, 'handleError').mockImplementation();
      });

      test('logs error', () => {
        copyService.registerCopy();
        expect(ErrorHandler.handleError).toHaveBeenCalledWith(
          'CopyService', 'Copy provided in wrong format.'
        );
      });

      test('does not modify _registeredCopy', () => {
        const parsedCopy = {};
        // @ts-expect-error Accessing private property for testing
        copyService._registeredCopy = parsedCopy;

        copyService.registerCopy();
        // @ts-expect-error Accessing private property for testing
        expect(copyService._registeredCopy).toBe(parsedCopy);
      });

      test('returns undefined', () => {
        expect(copyService.registerCopy()).toBeUndefined();
      });
    });

    describe('when a populated copy config is passed', () => {
      test('merges _registeredCopy with parsed copy', () => {
        const unparsedCopy = { some: 'unparsed copy' };
        const alreadyParsedCopy = {
          some: 'already parsedCopy',
          more: {
            stuff: 'copy'
          }
        };
        // @ts-expect-error Accessing private property for testing
        copyService._registeredCopy = alreadyParsedCopy;

        copyService.registerCopy(unparsedCopy);
        // @ts-expect-error Accessing private property for testing
        expect(copyService._registeredCopy).toEqual(_.merge(alreadyParsedCopy, unparsedCopy));
      });
    });
  });

  describe('buildSubkeys', () => {
    interface TestParsedCopy {
      [key: string]: string | AST | TestParsedCopy;
    }

    let parsedCopy: TestParsedCopy;

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

      // @ts-expect-error Accessing private property for testing
      copyService._registeredCopy = parsedCopy;
      jest.spyOn(copyService, 'getSubkeys');
    });

    describe('when the key contains subkeys', () => {
      test('calls getSubkeys', () => {
        const key = 'level2';

        copyService.buildSubkeys(key);
        expect(copyService.getSubkeys).toHaveBeenCalledWith(key);
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

    describe('when the key does not contain any subkeys', () => {
      test('returns an empty object', () => {
        const key = 'level1';

        expect(copyService.buildSubkeys(key)).toEqual({});
      });
    });
  });

  describe('getSubkeys', () => {
    test('returns parsedCopy at key', () => {
      const key = {
        some: 'parsed copy',
        more: 'stuff'
      };
      const parsedCopy = { key };
      // @ts-expect-error Accessing private property for testing
      copyService._registeredCopy = parsedCopy;

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
        jest.spyOn(copyService, 'getSubkeys').mockReturnValue(undefined);
        expect(copyService.hasKey('key')).toBe(false);
      });
    });
  });

  describe('getAstForKey', () => {
    beforeEach(() => {
      jest.spyOn(ErrorHandler, 'handleError').mockImplementation();
    });

    describe('when the copy at the key has not been parsed', () => {
      const key = 'some.key';

      beforeEach(() => {
        copyService.registerCopy({
          some: {
            key: 'this copy needs to be parsed'
          }
        });
      });

      test('parses the key and sets it in the registered copy', () => {
        // @ts-expect-error Accessing private property for testing
        const rawCopy = (copyService._registeredCopy.some as CopyFile).key;
        const parsed = new SyntaxNode();

        jest.spyOn(Parser, 'parseSingle').mockReturnValue(parsed);
        expect(copyService.getAstForKey(key)).toBe(parsed);
        // @ts-expect-error Accessing private property for testing
        expect((copyService._registeredCopy.some as CopyFile).key).toBe(parsed);
        expect(Parser.parseSingle).toHaveBeenCalledWith(key, rawCopy);
      });

      describe('when the copy fails to parse', () => {
        test('logs a waring and returns nil', () => {
          jest.spyOn(Parser, 'parseSingle').mockImplementation(() => { throw new Error(); });

          expect(copyService.getAstForKey(key)).toBeNull();
          expect(ErrorHandler.handleError).toHaveBeenCalledWith(
            'CopyService',
            `Failed to parse copy key: ${key}. Returning null...`
          );
        });
      });
    });

    describe('when the copy at the key has been parsed', () => {
      beforeEach(() => {
        copyService.registerCopy({
          some: {
            // @ts-expect-error Registering AST directly for testing
            key: new SyntaxNode()
          }
        });
      });

      test('returns the value as-is', () => {
        // @ts-expect-error Accessing private property for testing
        const some = copyService._registeredCopy.some as { [key: string]: AST; };
        const registeredValue = some.key;
        expect(copyService.getAstForKey('some.key')).toBe(registeredValue);
      });
    });

    describe('when the copy at the key is not found', () => {
      beforeEach(() => {
        copyService.registerCopy({
          some: {}
        });
      });

      describe('when errorOnMissingRefs is false', () => {
        test('warns and returns null', () => {
          expect(copyService.getAstForKey('some.key')).toBeNull();

          expect(ErrorHandler.handleError).toHaveBeenCalledWith(
            'CopyService',
            'No AST found for copy key: some.key. Returning null...',
            { halt: false }
          );
        });
      });

      describe('when errorOnMissingRefs is true', () => {
        beforeEach(() => {
          copyService.errorOnMissingRefs = true;
        });

        test('errors and will halt', () => {
          expect(copyService.getAstForKey('some.key')).toBeNull();

          expect(ErrorHandler.handleError).toHaveBeenCalledWith(
            'CopyService',
            'No AST found for copy key: some.key. Returning null...',
            { halt: true }
          );
        });
      });
    });

    describe('when the copy at the key is not convertible to an AST', () => {
      beforeEach(() => {
        copyService.registerCopy({
          some: {
            key: {
              recursive: 'string'
            }
          }
        });
      });

      describe('when errorOnMissingRefs is false', () => {
        test('warns and returns null', () => {
          expect(copyService.getAstForKey('some.key')).toBeNull();

          expect(ErrorHandler.handleError).toHaveBeenCalledWith(
            'CopyService',
            'No AST found for copy key: some.key. Returning null...',
            { halt: false }
          );
        });
      });

      describe('when errorOnMissingRefs is true', () => {
        beforeEach(() => {
          copyService.errorOnMissingRefs = true;

          jest.spyOn(ErrorHandler, 'handleError').mockImplementation(() => {
            throw new Error();
          });
        });

        test('errors and will halt', () => {
          expect(() => copyService.getAstForKey('some.key')).toThrow();

          expect(ErrorHandler.handleError).toHaveBeenCalledWith(
            'CopyService',
            'No AST found for copy key: some.key. Returning null...',
            { halt: true }
          );
        });
      });
    });
  });

  describe('getRegisteredCopy', () => {
    let copy: CopyFile;

    beforeEach(() => {
      copy = {
        some: {
          key: 'Hello world',
          other: '${some.key}!',
          deep: {
            complex: '#{some.thing} is *{up}{down}{thing}!',
            blank: ''
          }
        },
        other: 'Copy is fun!'
      };

      copyService.registerCopy(copy);
    });

    test('gets original registered copy when parsed', () => {
      copyService.parseAllCopy();
      expect(copyService.getRegisteredCopy()).toEqual(copy);
    });

    test('gets original registered copy when not parsed', () => {
      expect(copyService.getRegisteredCopy()).toEqual(copy);
    });
  });

  describe('getRegisteredCopyForKey', () => {
    beforeEach(() => {
      jest.spyOn(ErrorHandler, 'handleError').mockImplementation();

      copyService.registerCopy({
        some: {
          key: 'some #{key} yo!',
          blank: '',
          deep: {
            thing: 'hello'
          }
        }
      });
    });

    describe('when not found', () => {
      describe('when errorOnMissingRefs is false', () => {
        test('returns null and logs a warning', () => {
          expect(copyService.getRegisteredCopyForKey('some.fake')).toBeNull();

          expect(ErrorHandler.handleError).toHaveBeenCalledWith(
            'CopyService',
            'No AST found for copy key: some.fake. Returning null...',
            { halt: false }
          );
        });
      });

      describe('when errorOnMissingRefs is true', () => {
        beforeEach(() => {
          copyService.errorOnMissingRefs = true;

          jest.spyOn(ErrorHandler, 'handleError').mockImplementation(() => {
            throw new Error();
          });
        });

        test('returns null and logs a warning', () => {
          expect(() => copyService.getRegisteredCopyForKey('some.fake')).toThrow();

          expect(ErrorHandler.handleError).toHaveBeenCalledWith(
            'CopyService',
            'No AST found for copy key: some.fake. Returning null...',
            { halt: true }
          );
        });
      });
    });

    describe('when not a leaf node', () => {
      test('returns null and logs a warning', () => {
        expect(copyService.getRegisteredCopyForKey('some.deep')).toBeNull();

        expect(ErrorHandler.handleError).toHaveBeenCalledWith(
          'CopyService',
          'No AST found for copy key: some.deep. Returning null...',
          { halt: false }
        );
      });
    });

    describe('when null', () => {
      beforeEach(() => {
        // @ts-expect-error Accessing private property for testing
        _.set(copyService._registeredCopy, 'some.blank', null);
      });

      test('returns an empty string', () => {
        expect(copyService.getRegisteredCopyForKey('some.blank')).toBe('');
      });
    });

    describe('when a string', () => {
      test('returns the string', () => {
        expect(copyService.getRegisteredCopyForKey('some.key')).toBe('some #{key} yo!');
      });
    });

    describe('when an AST', () => {
      const key = 'some.key';

      beforeEach(() => {
        // @ts-expect-error Accessing private property for testing
        _.set(copyService._registeredCopy, key, Parser.parseSingle(key, 'some #{key} yo!'));
      });

      test('returns the corresponding string', () => {
        expect(copyService.getRegisteredCopyForKey('some.key')).toBe('some #{key} yo!');
      });
    });
  });

  describe('parseAllCopy', () => {
    test('calls Parser.parseLeaves on the registered copy', () => {
      jest.spyOn(Parser, 'parseLeaves').mockImplementation();
      copyService.parseAllCopy();
      // @ts-expect-error Accessing private property for testing
      expect(Parser.parseLeaves).toHaveBeenCalledWith(copyService._registeredCopy);
    });
  });
});
