import _ from 'lodash';
import CopyService, {
  type AST,
  type CopyFile,
  type CopySubkeys,
  type RegisteredCopyNode
} from './CopyService.js';
import ErrorHandler from './ErrorHandler/ErrorHandler.js';

export interface LanguageHierarchy {
  [language: string]: string | null;
}

interface IntlCopyServiceAdditionalOptions {
  serviceOptions?: { copy?: CopyFile; language?: string | null; };
  copy?: { [language: string]: CopyFile; };
  errorOnMissingRefs?: boolean | null;
}

/**
 * Provides the same interface as `CopyService`, but adds support for multiple
 * languages.
 *
 * Methods on this service will use the current `language` by default, but many methods
 * allow specifying a specific language as a final argument.
 *
 * This server uses a hierarchy of languages to handle fallbacks for missing copy. For example,
 * for the hierarchy:
 *
 * {
 *   "en-us": null,
 *   "en-uk": "en-us",
 *   "spanish": "en-us",
 *   "portuguese": "spanish",
 *   "german": null
 * }.
 *
 * Here, `en-us` and `german` are root languages. Missing copy for `en-uk` will fall back to
 * `en-us`. Likewise, missing copy for `portuguese` will fall back to spanish then english.
 *
 * The keys on the hierarchy object define the set of supported languages. Under the hood, there
 * is an independent `CopyService` for each supported language.
 *
 * The `IntlCopyService` can be used with any evaluator just like for `CopyService` can.
 */
class IntlCopyService {
  private _hierarchy: LanguageHierarchy;

  private _services: Record<string, CopyService>;

  language!: string;

  errorOnMissingRefs: boolean;

  /**
   * Constructor for `IntlCopyService`.
   */
  constructor(
    defaultLanguage: string,
    hierarchy: LanguageHierarchy,
    options: IntlCopyServiceAdditionalOptions = {}
  ) {
    this._hierarchy = hierarchy;
    this.setLanguage(defaultLanguage);

    // create a copy service for each language in the hierarchy
    this._services = {};
    _.forEach(_.keys(hierarchy), (lang) => {
      this._services[lang] = new CopyService({ language: lang, ...options.serviceOptions });
    });

    // register any copy provided on options
    _.forEach(options.copy, (copy, lang) => {
      this.registerCopy(copy, lang);
    });

    this.errorOnMissingRefs = options.errorOnMissingRefs || false;
  }

  /**
   * Sets the current `language`, which is the language that will be used if none is
   * otherwise specified.
   */
  setLanguage(language: string): void {
    if (_.isUndefined(this._hierarchy[language])) {
      ErrorHandler.handleError(
        'IntlCopyService',
        `language '${language}' not found in hierarchy`
      );

      return;
    }

    this.language = language;
  }

  /**
   * Gets the copy service specific to the given language. If none is specified, the current
   * language from `setLanguage` will be used.
   */
  getLanguageService(language?: string | null): CopyService {
    const currentLanguage = language || this.language;
    return this._services[currentLanguage];
  }

  /**
   * See `CopyService` documentation for `registerCopy`.
   */
  registerCopy(jsonCopyConfig: CopyFile, language?: string | null): void {
    this.getLanguageService(language).registerCopy(jsonCopyConfig);
  }

  /**
   * See `CopyService` documentation for `buildSubKeys`. Will merge results up the hierarchy tree.
   */
  buildSubkeys(key: string, language?: string | null): CopySubkeys {
    const currentLanguage = language || this.language;
    return this._mergeFromHierarchy(currentLanguage, 'buildSubkeys', key) as CopySubkeys;
  }

  /**
   * See `CopyService` documentation for `getSubKeys`. Will merge results up the hierarchy tree.
   */
  getSubkeys(key: string, language?: string | null): RegisteredCopyNode | undefined {
    const currentLanguage = language || this.language;
    return this._mergeFromHierarchy(currentLanguage, 'getSubkeys', key) as RegisteredCopyNode | undefined;
  }

  /**
   * See `CopyService` documentation for `buildSubKeys`. Will return `true` if any language in the
   * hierarchy has the key.
   */
  hasKey(key: string, language?: string | null): boolean {
    const currentLanguage = language || this.language;

    return this._getFromHierarchy(
      currentLanguage,
      'hasKey',
      (value) => !value, // keep looking if false
      key
    ) as boolean;
  }

  /**
   * See `CopyService` documentation for `getAstForKey`. Will return the first non-null value from
   * the hierarchy, and `null` if none has an AST.
   *
   * Note: While CopyService.getAstForKey may return undefined, IntlCopyService.getAstForKey
   * will never actually return undefined - it converts undefined to null. The return type includes
   * undefined for type compatibility with CopyService when used polymorphically.
   */
  getAstForKey(key: string, language?: string | null): AST | undefined {
    const currentLanguage = language || this.language;
    const result = this._getFromHierarchy(
      currentLanguage,
      'getAstForKey',
      (r) => _.isUndefined(r), // keep looking if undefined
      key
    ) as AST | undefined;

    if (_.isUndefined(result)) {
      ErrorHandler.handleError(
        'IntlCopyService',
        `No AST found for copy key for any language: ${key}. Returning null...`,
        { halt: this.errorOnMissingRefs }
      );

      return null;
    }

    return result;
  }

  /**
   * See `CopyService` documentation for `getRegisteredCopy`. Will merge results up the hierarchy
   * tree.
   *
   * This method is helpful for making clear exactly what copy will be used for each key for a
   * given language.
   */
  getRegisteredCopy(language?: string | null): { [key: string]: RegisteredCopyNode; } {
    const currentLanguage = language || this.language;
    return this._mergeFromHierarchy(currentLanguage, 'getRegisteredCopy') as { [key: string]: RegisteredCopyNode; };
  }

  /**
   * See `CopyService` documentation for `getRegisteredCopyForKey`. Will merge results up the
   * hierarchy tree.
   */
  getRegisteredCopyForKey(key: string, language?: string | null): string | null {
    const currentLanguage = language || this.language;

    const result = this._getFromHierarchy(
      currentLanguage,
      'getRegisteredCopyForKey',
      (r) => _.isNil(r), // keep looking if null
      key
    ) as string | null;

    if (_.isNil(result)) {
      ErrorHandler.handleError(
        'IntlCopyService',
        `No AST found for copy key for any language: ${key}. Returning null...`,
        { halt: this.errorOnMissingRefs }
      );
    }

    return result;
  }

  /**
   * Parses all copy that has not yet been parsed to an AST, for each language.
   *
   * Notably, this will throw an error if any copy fails to parse.
   */
  parseAllCopy(): void {
    _.forEach(this._services, (service) => {
      service.parseAllCopy();
    });
  }

  /**
   * Yields the hierarchy from leaf to root starting at the given language. For example,
   * using the hierarchy from the comments at the top of this file, `_getHierarchy('portuguese')`
   * would yield 'portuguese', 'spanish', and finally 'en-us'.
   *
   * NOTE: This is a generator, in order to avoid array allocations in `getAstForKey`.
   *
   * @yields The current language in the hierarchy.
   */
  private* _getHierarchy(language: string): IterableIterator<string> {
    let currentLanguage = language;
    yield currentLanguage;

    while (this._hierarchy[currentLanguage]) {
      currentLanguage = this._hierarchy[currentLanguage]!;
      yield currentLanguage;
    }
  }

  /**
   * Calls the method with the args on each copy service in the hierarchy, merging the results
   * such that the most specific (eg: `portuguese`) overrides the most general (eg: `en-us`).
   *
   * The return type is unknown to force explicit casting by the caller, as `method` could return
   * anything.
   */
  private _mergeFromHierarchy(language: string, method: string, ...args: any[]): unknown { // eslint-disable-line @typescript-eslint/no-explicit-any, @stylistic/max-len
    if (this._hierarchy[language] === null) { // root language, no merging needed
      const languageService = this.getLanguageService(language);
      return _.invoke(languageService, method, ...args);
    }

    return _.reduceRight(
      Array.from(this._getHierarchy(language)),
      (result, lang) => (
        _.merge(result, _.invoke(this.getLanguageService(lang), method, ...args))
      ),
      {}
    );
  }

  /**
   * Returns the first non-skipped result from calling the method with the args in
   * each copy service in the hierarchy from leaf to root. The root result will be returned,
   * even if it is skipped.
   *
   * The return type is unknown to force explicit casting by the caller, as `method` could return
   * anything.
   */
  private _getFromHierarchy(
    language: string,
    method: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    skip: (value: any) => boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ): unknown {
    let result;

    // eslint-disable-next-line no-restricted-syntax
    for (const lang of this._getHierarchy(language)) {
      result = _.invoke(this.getLanguageService(lang), method, ...args);
      if (!skip(result)) {
        return result;
      }
    }

    return result;
  }
}

export default IntlCopyService;
