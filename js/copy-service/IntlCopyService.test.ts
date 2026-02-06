import _ from 'lodash';
import CopyService, { type CopyFile } from './CopyService.js';
import ErrorHandler from './ErrorHandler/ErrorHandler.js';
import IntlCopyService, { type LanguageHierarchy } from './IntlCopyService.js';
import Verbatim from './Verbatim/Verbatim.js';

/**
 * NOTE: Private methods are implicitly tested through other methods.
 */
describe('IntlCopyService', () => {
  let language: string;
  let hierarchy: LanguageHierarchy;
  let copyService: IntlCopyService;

  beforeEach(() => {
    language = 'spanish';
    hierarchy = {
      'en-us': null,
      'en-uk': 'en-us',
      spanish: 'en-us',
      portuguese: 'spanish',
      german: null
    };

    copyService = new IntlCopyService(language, hierarchy);
  });

  describe('constructor', () => {
    test('sets the hierarchy and default language', () => {
      expect(copyService.language).toBe(language);
      // @ts-expect-error Accessing private property for testing
      expect(copyService._hierarchy).toBe(hierarchy);
    });

    test('creates a service for each language with correct args', () => {
      _.forEach(_.keys(hierarchy), (lang) => {
        // @ts-expect-error Accessing private property for testing
        expect(copyService._services[lang]).toBeInstanceOf(CopyService);
        // @ts-expect-error Accessing private property for testing
        expect(copyService._services[lang].language).toBe(lang);
      });
    });

    describe('when copy is provided on options', () => {
      test('sets it for each language', () => {
        jest.spyOn(IntlCopyService.prototype, 'registerCopy').mockImplementation();

        const testHierarchy = {
          'en-us': null,
          'en-uk': 'en-us',
          spanish: 'en-us',
          portuguese: 'spanish',
          german: null
        };

        const copy = {
          'en-us': { some: 'copy' },
          'en-uk': { extremely: 'chuffed' },
          spanish: { los: 'gringos' },
          portuguese: { also: 'brazil' },
          german: { volkswagen: 'beetle' }
        };

        copyService = new IntlCopyService(language, testHierarchy, { copy });

        _.forEach(copy, (langCopy, lang) => {
          expect(IntlCopyService.prototype.registerCopy).toHaveBeenCalledWith(langCopy, lang);
        });
      });
    });

    describe('errorOnMissingRefs option', () => {
      test('sets errorOnMissingRefs with the passed value', () => {
        copyService = new IntlCopyService(language, hierarchy, { errorOnMissingRefs: true });
        expect(copyService.errorOnMissingRefs).toBe(true);
      });

      test('sets errorOnMissingRefs to false if not passed', () => {
        copyService = new IntlCopyService(language, hierarchy);
        expect(copyService.errorOnMissingRefs).toBe(false);
      });
    });
  });

  describe('setLanguage', () => {
    test('sets the language', () => {
      copyService.setLanguage('en-uk');
      expect(copyService.language).toBe('en-uk');
    });

    describe('when the language is unknown', () => {
      beforeEach(() => {
        jest.spyOn(ErrorHandler, 'handleError').mockImplementation();
      });

      test('logs an error and does not set the language', () => {
        copyService.setLanguage('fake');
        expect(copyService.language).toBe(language);

        expect(ErrorHandler.handleError).toHaveBeenCalledWith(
          'IntlCopyService',
          'language \'fake\' not found in hierarchy'
        );
      });
    });
  });

  describe('getLanguageService', () => {
    describe('when no language is specified', () => {
      test('returns the service for the current language', () => {
        // @ts-expect-error Accessing private property for testing
        expect(copyService.getLanguageService()).toBe(copyService._services[language]);
      });
    });

    describe('when a language is specified', () => {
      test('returns the service for the provided language', () => {
        // @ts-expect-error Accessing private property for testing
        expect(copyService.getLanguageService('en-us')).toBe(copyService._services['en-us']);
      });
    });
  });

  describe('registerCopy', () => {
    let copy: CopyFile;

    beforeEach(() => {
      copy = { some: 'copy' };
      // @ts-expect-error Accessing private property for testing
      jest.spyOn(copyService._services[language], 'registerCopy').mockImplementation();
      // @ts-expect-error Accessing private property for testing
      jest.spyOn(copyService._services['en-us'], 'registerCopy').mockImplementation();
    });

    describe('when no language is specified', () => {
      test('registers copy for the current language', () => {
        copyService.registerCopy(copy);
        // @ts-expect-error Accessing private property for testing
        expect(copyService._services[language].registerCopy).toHaveBeenCalledWith(copy);
      });
    });

    describe('when a language is specified', () => {
      test('registers copy for the provided language', () => {
        copyService.registerCopy(copy, 'en-us');
        // @ts-expect-error Accessing private property for testing
        expect(copyService._services['en-us'].registerCopy).toHaveBeenCalledWith(copy);
      });
    });
  });

  describe('buildSubkeys', () => {
    beforeEach(() => {
      copyService.registerCopy({
        example: {
          some: 'copy',
          keys: {
            indeed: 'yes'
          }
        },
        ignored: 'goodbye'
      }, 'en-us');
      copyService.registerCopy({
        example: {
          some: 'override',
          keys: {
            additional: 'content'
          }
        },
        other: 'hello'
      }, language);
    });

    test('merges results according to the hierarchy', () => {
      expect(copyService.buildSubkeys('example')).toEqual({
        some: 'example.some',
        keys: {
          indeed: 'example.keys.indeed',
          additional: 'example.keys.additional'
        }
      });
    });

    describe('when a language is provided', () => {
      test('merges results for that language', () => {
        expect(copyService.buildSubkeys('example', 'en-us')).toEqual({
          some: 'example.some',
          keys: {
            indeed: 'example.keys.indeed'
          }
        });
      });
    });
  });

  describe('getSubkeys', () => {
    beforeEach(() => {
      copyService.registerCopy({
        example: {
          some: 'copy',
          keys: {
            indeed: 'yes'
          }
        },
        ignored: 'goodbye'
      }, 'en-us');
      copyService.registerCopy({
        example: {
          some: 'override',
          keys: {
            additional: 'content'
          }
        },
        other: 'hello'
      }, language);
    });

    test('merges results according to the hierarchy', () => {
      expect(copyService.getSubkeys('example')).toEqual({
        some: 'override',
        keys: {
          indeed: 'yes',
          additional: 'content'
        }
      });
    });

    describe('when a language is provided', () => {
      test('merges results for that language', () => {
        expect(copyService.getSubkeys('example', 'en-us')).toEqual({
          some: 'copy',
          keys: {
            indeed: 'yes'
          }
        });
      });
    });
  });

  describe('hasKey', () => {
    beforeEach(() => {
      copyService.registerCopy({
        example: {
          some: 'copy',
          keys: {
            indeed: 'yes'
          }
        },
        ignored: 'goodbye'
      }, 'en-us');
      copyService.registerCopy({
        example: {
          some: 'override',
          keys: {
            additional: 'content'
          }
        },
        other: 'hello'
      }, language);
    });

    test('returns true if the key exists according to the hierarchy', () => {
      expect(copyService.hasKey('example.keys.additional')).toBe(true);
      expect(copyService.hasKey('example.keys.indeed')).toBe(true);
    });

    test('returns false if the key does not exist according to the hierarchy', () => {
      expect(copyService.hasKey('example.keys.fake')).toBe(false);
    });

    describe('when a language is provided', () => {
      test('returns true if the key exists according to the hierarchy', () => {
        expect(copyService.hasKey('example.keys.indeed', 'en-us')).toBe(true);
      });

      test('returns false if the key does not exist according to the hierarchy', () => {
        expect(copyService.hasKey('example.keys.additional', 'en-us')).toBe(false);
      });
    });
  });

  describe('getAstForKey', () => {
    beforeEach(() => {
      copyService.registerCopy({
        example: {
          some: 'copy',
          keys: {
            indeed: 'yes'
          }
        }
      }, 'en-us');
      copyService.registerCopy({
        example: {
          empty: '',
          some: 'override',
          keys: {
            additional: 'content'
          }
        }
      }, language);

      jest.spyOn(ErrorHandler, 'handleError').mockImplementation();
    });

    test('returns the result from the first entry in the hierarchy with one', () => {
      expect(copyService.getAstForKey('example.some')).toEqual(new Verbatim({
        text: 'override', sibling: null
      }));
      expect(copyService.getAstForKey('example.keys.indeed')).toEqual(new Verbatim({
        text: 'yes', sibling: null
      }));
    });

    test('handles null ASTs correctly', () => {
      expect(copyService.getAstForKey('example.empty')).toBeNull();
      expect(ErrorHandler.handleError).not.toHaveBeenCalled();
    });

    describe('when all languages have missing copy', () => {
      describe('when errorOnMissingRefs is false', () => {
        test('returns null and handles error', () => {
          expect(copyService.getAstForKey('example.fake')).toBeNull();
          expect(ErrorHandler.handleError).toHaveBeenCalledWith(
            'IntlCopyService',
            'No AST found for copy key for any language: example.fake. Returning null...',
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

        test('returns null and handles error', () => {
          expect(() => copyService.getAstForKey('example.fake')).toThrow();
          expect(ErrorHandler.handleError).toHaveBeenCalledWith(
            'IntlCopyService',
            'No AST found for copy key for any language: example.fake. Returning null...',
            { halt: true }
          );
        });
      });
    });

    describe('when a language is specified', () => {
      test('starts the hierarchy at that language', () => {
        expect(copyService.getAstForKey('example.some', 'en-us')).toEqual(new Verbatim({
          text: 'copy', sibling: null
        }));
      });
    });
  });

  describe('getRegisteredCopy', () => {
    let childCopy: CopyFile;
    let parentCopy: CopyFile;

    beforeEach(() => {
      parentCopy = {
        example: {
          some: 'copy',
          keys: {
            indeed: 'yes'
          }
        }
      };
      copyService.registerCopy(parentCopy, 'en-us');

      childCopy = {
        example: {
          empty: '',
          some: 'override',
          keys: {
            additional: 'content'
          }
        }
      };
      copyService.registerCopy(childCopy, language);
    });

    test('merges all copy according to the hierarchy', () => {
      expect(copyService.getRegisteredCopy()).toEqual(
        _.merge({}, parentCopy, childCopy)
      );
    });

    describe('when a language is provided', () => {
      test('merges all copy starting from the given language', () => {
        expect(copyService.getRegisteredCopy('en-us')).toEqual(parentCopy);
      });
    });
  });

  describe('getRegisteredCopyForKey', () => {
    beforeEach(() => {
      copyService.registerCopy({
        example: {
          some: 'copy',
          keys: {
            indeed: 'yes'
          }
        }
      }, 'en-us');
      copyService.registerCopy({
        example: {
          empty: '',
          some: 'override',
          keys: {
            additional: 'content'
          }
        }
      }, language);

      jest.spyOn(ErrorHandler, 'handleError').mockImplementation();
    });

    test('returns the first copy from the hierarchy', () => {
      expect(copyService.getRegisteredCopyForKey('example.some')).toEqual('override');
      expect(copyService.getRegisteredCopyForKey('example.keys.indeed')).toEqual('yes');
    });

    test('handles empty copy correctly', () => {
      expect(copyService.getRegisteredCopyForKey('example.empty')).toEqual('');
      expect(ErrorHandler.handleError).not.toHaveBeenCalled();
    });

    describe('when no languages have copy', () => {
      describe('when errorOnMissingRefs is false', () => {
        test('returns null and logs an error if no language has copy', () => {
          expect(copyService.getRegisteredCopyForKey('example.fake')).toBeNull();
          expect(ErrorHandler.handleError).toHaveBeenCalledWith(
            'IntlCopyService',
            'No AST found for copy key for any language: example.fake. Returning null...',
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

        test('logs an error if no language has copy', () => {
          expect(() => copyService.getRegisteredCopyForKey('example.fake')).toThrow();
          expect(ErrorHandler.handleError).toHaveBeenCalledWith(
            'IntlCopyService',
            'No AST found for copy key for any language: example.fake. Returning null...',
            { halt: true }
          );
        });
      });
    });

    describe('when a language is provided', () => {
      test('starts looking from that language', () => {
        expect(copyService.getRegisteredCopyForKey('example.some', 'en-us')).toEqual('copy');
      });
    });
  });

  describe('parseAllCopy', () => {
    test('calls parseAllCopy on each service', () => {
      _.forEach(
        // @ts-expect-error Accessing private property for testing
        copyService._services,
        (service) => jest.spyOn(service, 'parseAllCopy').mockImplementation()
      );

      copyService.parseAllCopy();

      _.forEach(
        // @ts-expect-error Accessing private property for testing
        copyService._services,
        (service) => expect(service.parseAllCopy).toHaveBeenCalled()
      );
    });
  });
});
