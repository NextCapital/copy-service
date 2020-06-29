import _ from 'lodash';

import Parser from './Parser/Parser';

import ErrorHandler from './ErrorHandler/ErrorHandler';

import CopyService from './CopyService';

describe('CopyService', () => {
  let copyService;

  beforeEach(() => {
    copyService = new CopyService();
  });

  describe('constructor', () => {
    describe('when options are passed', () => {
      describe('copy option', () => {
        let parsedCopy;

        beforeEach(() => {
          parsedCopy = { some: 'parsed copy' };
          jest.spyOn(Parser, 'parseLeaves').mockReturnValue(parsedCopy);
        });

        test('parses the passed copy and sets _registeredCopy', () => {
          const copy = { some: 'unparsed copy' };

          const copyService = new CopyService({ copy });
          expect(Parser.parseLeaves).toBeCalledWith(copy);
          expect(copyService._registeredCopy).toEqual(parsedCopy);
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
        expect(ErrorHandler.handleError).toBeCalledWith(
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
      let parsedCopy;

      beforeEach(() => {
        parsedCopy = { some: 'parsed copy' };
        jest.spyOn(Parser, 'parseLeaves').mockReturnValue(parsedCopy);
      });

      test('calls Parser.parseLeaves with the unparsed copy', () => {
        const unparsedCopy = { some: 'unparsed copy' };

        copyService.registerCopy(unparsedCopy);
        expect(Parser.parseLeaves).toBeCalledWith(unparsedCopy);
      });

      test('merges _registeredCopy with parsed copy', () => {
        const unparsedCopy = { some: 'unparsed copy' };
        const alreadyParsedCopy = {
          some: 'already parsedCopy',
          more: {
            'stuff': 'copy'
          }
        };
        copyService._registeredCopy = alreadyParsedCopy;

        copyService.registerCopy(unparsedCopy);
        expect(copyService._registeredCopy).toEqual(_.merge(alreadyParsedCopy, parsedCopy));
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
});
