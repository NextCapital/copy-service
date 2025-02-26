const _ = require('lodash');

const CopyService = require('./CopyService');

const ErrorHandler = require('./ErrorHandler/ErrorHandler');

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
  /**
   * Constructor for `IntlCopyService`.
   *
   * @param {string} defaultLanguage Language to set as the default.
   * @param {object} hierarchy Language hierarchy. See the example above.
   * @param {object} options Additional options.
   * @param {object} [options.serviceOptions] Options for each language's CopyService.
   * @param {object} [options.copy] Initial copy for each language, where the key is the language
   *   and the value is the copy for that language.
   */
  constructor(defaultLanguage, hierarchy, options = {}) {
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
  }

  /**
   * Sets the current `language`, which is the language that will be used if none is
   * otherwise specified.
   *
   * @param {string} language The language to set.
   */
  setLanguage(language) {
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
   *
   * @param {string} [language=null]
   * @returns {CopyService}
   */
  getLanguageService(language = null) {
    const currentLanguage = language || this.language;
    return this._services[currentLanguage];
  }

  /**
   * See `CopyService` documentation for `registerCopy`.
   *
   * @param {object} jsonCopyConfig Copy to register.
   * @param {string} [language=null] Language to register the copy for. Will use the current if not
   *   specified.
   */
  registerCopy(jsonCopyConfig, language = null) {
    this.getLanguageService(language).registerCopy(jsonCopyConfig);
  }

  /**
   * See `CopyService` documentation for `buildSubKeys`. Will merge results up the hierarchy tree.
   *
   * @param {string} key
   * @param {string} [language=null] Initial language to use. Will use the current if not specified.
   * @returns {object} An object of the same structure where the value is the copy key path.
   */
  buildSubkeys(key, language = null) {
    const currentLanguage = language || this.language;
    return this._mergeFromHierarchy(currentLanguage, 'buildSubkeys', key);
  }

  /**
   * See `CopyService` documentation for `getSubKeys`. Will merge results up the hierarchy tree.
   *
   * @param {string} key
   * @param {string} [language=null] Initial language to use. Will use the current if not specified.
   * @returns {object|string} The copy object or copy AST at a given key.
   */
  getSubkeys(key, language = null) {
    const currentLanguage = language || this.language;
    return this._mergeFromHierarchy(currentLanguage, 'getSubkeys', key);
  }

  /**
   * See `CopyService` documentation for `buildSubKeys`. Will return `true` if any language in the
   * hierarchy has the key.
   *
   * @param {string} key
   * @param {string} [language=null] Initial language to use. Will use the current if not specified.
   * @returns {boolean}
   */
  hasKey(key, language = null) {
    const currentLanguage = language || this.language;

    return this._getFromHierarchy(
      currentLanguage,
      'hasKey',
      (value) => !value, // keep looking if false
      key
    );
  }

  /**
   * See `CopyService` documentation for `getAstForKey`. Will return the first non-null value from
   * the hierarchy, and `null` if none has an AST.
   *
   * @param {string} key
   * @param {string} [language=null] Initial language to use. Will use the current if not specified.
   * @returns {AST}
   */
  getAstForKey(key, language = null) {
    const currentLanguage = language || this.language;
    const result = this._getFromHierarchy(
      currentLanguage,
      'getAstForKey',
      (r) => _.isUndefined(r), // keep looking if undefined
      key
    );

    if (_.isUndefined(result)) {
      ErrorHandler.handleError(
        'IntlCopyService',
        `No AST found for copy key for any language: ${key}. Returning null...`
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
   *
   * @param {string} [language=null] Initial language to use. Will use the current if not specified.
   * @returns {object} The registered copy, in un-parsed form.
   */
  getRegisteredCopy(language = null) {
    const currentLanguage = language || this.language;
    return this._mergeFromHierarchy(currentLanguage, 'getRegisteredCopy');
  }

  /**
   * See `CopyService` documentation for `getRegisteredCopyForKey`. Will merge results up the
   * hierarchy tree.
   *
   * @param {string} key
   * @param {string} [language=null] Initial language to use. Will use the current if not specified.
   * @returns {string|null} Registered copy at the key, or null if none.
   */
  getRegisteredCopyForKey(key, language = null) {
    const currentLanguage = language || this.language;

    const result = this._getFromHierarchy(
      currentLanguage,
      'getRegisteredCopyForKey',
      (r) => _.isNil(r), // keep looking if null
      key
    );

    if (_.isNil(result)) {
      ErrorHandler.handleError(
        'IntlCopyService',
        `No AST found for copy key for any language: ${key}. Returning null...`
      );
    }

    return result;
  }

  /**
   * Parses all copy that has not yet been parsed to an AST, for each language.
   *
   * Notably, this will throw an error if any copy fails to parse.
   */
  parseAllCopy() {
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
   * @param {string} language The starting language in the hierarchy.
   * @yields {string} The current entry in the hierarchy.
   * @private
   */
  * _getHierarchy(language) {
    let currentLanguage = language;
    yield currentLanguage;

    while (this._hierarchy[currentLanguage]) {
      currentLanguage = this._hierarchy[currentLanguage];
      yield currentLanguage;
    }
  }

  /**
   * Calls the method with the args on each copy service in the hierarchy, merging the results
   * such that the most specific (eg: `portuguese`) overrides the most general (eg: `en-us`).
   *
   * @param {string} language Language to start the hierarchy at.
   * @param {string} method Method to call on the server.
   * @param {*} args Arguments to pass to each service.
   * @returns {object} The merged result.
   * @private
   */
  _mergeFromHierarchy(language, method, ...args) {
    if (this._hierarchy[language] === null) { // root language, no merging needed
      return this.getLanguageService(language)[method](...args);
    }

    return _.reduceRight(Array.from(this._getHierarchy(language)), (result, lang) => (
      _.merge(result, this.getLanguageService(lang)[method](...args))
    ), {});
  }

  /**
   * Returns the first non-skipped result from calling the method with the args in
   * each copy service in the hierarchy from leaf to root. The root result will be returned,
   * even if it is skipped.
   *
   * @param {string} language Language to start the hierarchy at.
   * @param {string} method Method to call on the server.
   * @param {Function} skip Method called with the result, which should return `true` if it should
   *   not be returned. If this returns `false`, the result will be returned.
   * @param {*} args Arguments to pass to each service.
   * @returns {*} The first truthy result, or the final result from the the hierarchy.
   * @private
   */
  _getFromHierarchy(language, method, skip, ...args) {
    let result;

    // eslint-disable-next-line no-restricted-syntax
    for (const lang of this._getHierarchy(language)) {
      result = this.getLanguageService(lang)[method](...args);
      if (!skip(result)) {
        return result;
      }
    }

    return result;
  }
}

module.exports = IntlCopyService;
