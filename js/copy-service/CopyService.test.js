const _ = require('lodash');

const Parser = require('./Parser/Parser');
const SyntaxNode = require('./SyntaxNode/SyntaxNode').default;

const ErrorHandler = require('./ErrorHandler/ErrorHandler').default;

const CopyService = require('./CopyService');

describe('CopyService', () => {
  let copyService;

  beforeEach(() => {
    copyService = new CopyService();
  });

  describe('constructor', () => {
    describe('when options are passed', () => {
      describe('copy option', () => {
        test('sets _registeredCopy with the passed copy', () => {
          const copy = { some: 'unparsed copy' };

          copyService = new CopyService({ copy });
          expect(copyService._registeredCopy).toEqual(copy);
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
        copyService._registeredCopy = parsedCopy;

        copyService.registerCopy();
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
        copyService._registeredCopy = alreadyParsedCopy;

        copyService.registerCopy(unparsedCopy);
        expect(copyService._registeredCopy).toEqual(_.merge(alreadyParsedCopy, unparsedCopy));
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

      copyService._registeredCopy = parsedCopy;
      jest.spyOn(copyService, 'getSubkeys');
    });

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

  describe('getSubkeys', () => {
    test('returns parsedCopy at key', () => {
      const key = {
        some: 'parsed copy',
        more: 'stuff'
      };
      const parsedCopy = { key };
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
        jest.spyOn(copyService, 'getSubkeys').mockReturnValue();
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
        const rawCopy = copyService._registeredCopy.some.key;
        const parsed = new SyntaxNode();

        jest.spyOn(Parser, 'parseSingle').mockReturnValue(parsed);
        expect(copyService.getAstForKey(key)).toBe(parsed);
        expect(copyService._registeredCopy.some.key).toBe(parsed);
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
            key: new SyntaxNode()
          }
        });
      });

      test('returns the value as-is', () => {
        expect(copyService.getAstForKey('some.key')).toBe(
          copyService._registeredCopy.some.key
        );
      });
    });

    describe('when the copy at the key is not found', () => {
      beforeEach(() => {
        copyService.registerCopy({
          some: {}
        });
      });

      test('warns and returns null', () => {
        expect(copyService.getAstForKey('some.key')).toBeNull();

        expect(ErrorHandler.handleError).toHaveBeenCalledWith(
          'CopyService',
          'No AST found for copy key: some.key. Returning null...'
        );
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

      test('warns and returns null', () => {
        expect(copyService.getAstForKey('some.key')).toBeNull();

        expect(ErrorHandler.handleError).toHaveBeenCalledWith(
          'CopyService',
          'No AST found for copy key: some.key. Returning null...'
        );
      });
    });
  });

  describe('getRegisteredCopy', () => {
    let copy;

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
      test('returns null and logs a warning', () => {
        expect(copyService.getRegisteredCopyForKey('some.fake')).toBeNull();

        expect(ErrorHandler.handleError).toHaveBeenCalledWith(
          'CopyService',
          'No AST found for copy key: some.fake. Returning null...'
        );
      });
    });

    describe('when not a leaf node', () => {
      test('returns null and logs a warning', () => {
        expect(copyService.getRegisteredCopyForKey('some.deep')).toBeNull();

        expect(ErrorHandler.handleError).toHaveBeenCalledWith(
          'CopyService',
          'No AST found for copy key: some.deep. Returning null...'
        );
      });
    });

    describe('when null', () => {
      beforeEach(() => {
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
      expect(Parser.parseLeaves).toHaveBeenCalledWith(copyService._registeredCopy);
    });
  });
});
