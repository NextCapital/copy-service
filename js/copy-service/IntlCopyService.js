import _ from 'lodash';

import CopyService from './CopyService';

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
 * }
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
   * Constructor for `IntlCopyService`
   *
   * @param {string} defaultLanguage Language to set as the default
   * @param {object} hierarchy Language hierarchy. See the example above.
   * @param {object} options Additional options
   * @param {object} [options.serviceOptions] Options for each language's CopyService
   * @param {object} [options.copy] Initial copy for each language, where the key is the language
   *   and the value is the copy for that language.
   */
  constructor(defaultLanguage, hierarchy, options = {}) {
    this._hierarchy = hierarchy;
    this.setLanguage(defaultLanguage);

    // create a copy service for each language in the hierarchy
    this._services = _.reduce(_.keys(hierarchy), (services, lang) => {
      services[lang] = new CopyService(options.serviceOptions);
      return services;
    }, {});

    // register any copy provided on options
    _.forEach(options.copy, (copy, lang) => {
      this.registerCopy(copy, lang);
    });
  }

  /**
   * Sets the current `language`, which is the language that will be used if none is
   * otherwise specified.
   *
   * @param {string} language The language to set
   */
  setLanguage(language) {
    if (_.isUndefined(this._hierarchy[language])) {
      throw new Error(`CopyService: language ${language} not found in hierarchy`);
    }

    this.language = language;
  }

  /**
   * Gets the copy service specific to the given language. If none is specified, the current
   * language from `setLanguage` will be used.
   *
   * @param {string} [language=null]
   */
  getLanguageService(language = null) {
    const currentLanguage = language || this.language;
    return this._services[currentLanguage];
  }

  /**
   * See `CopyService` documentation for `registerCopy`.
   *
   * @param {object} jsonCopyConfig Copy to register
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
   * @return {Object} An object of the same structure where the value is the copy key path.
   */
  buildSubKeys(key, language = null) {
    const currentLanguage = language || this.language;
    return this._mergeFromHierarchy(currentLanguage, 'buildSubKeys', key);
  }

  /**
   * See `CopyService` documentation for `getSubKeys`. Will merge results up the hierarchy tree.
   *
   * @param {string} key
   * @param {string} [language=null] Initial language to use. Will use the current if not specified.
   * @return {object|string} The copy object or copy AST at a given key.
   */
  getSubKeys(key, language = null) {
    const currentLanguage = language || this.language;
    return this._mergeFromHierarchy(currentLanguage, 'getSubKeys', key);
  }

  /**
   * See `CopyService` documentation for `buildSubKeys`. Will return `true` if any language in the
   * hierarchy has the key.
   *
   * @param {string} key
   * @param {string} [language=null] Initial language to use. Will use the current if not specified.
   * @return {boolean}
   */
  hasKey(key, language = null) {
    const currentLanguage = language || this.language;
    return this._getFromHierarchy(currentLanguage, 'hasKey', key) || false;
  }

  /**
   * See `CopyService` documentation for `getAstForKey`. Will return the first non-null value from
   * the hierarchy, and `null` if none has an AST.
   *
   * @param {string} key
   * @param {string} [language=null] Initial language to use. Will use the current if not specified.
   * @return {AST}
   */
  getAstForKey(key, language = null) {
    const currentLanguage = language || this.language;
    return this._getFromHierarchy(currentLanguage, 'getAstForKey', key);
  }

  /**
   * See `CopyService` documentation for `getRegisteredCopy`. Will merge results up the hierarchy
   * tree.
   *
   * @param {string} [language=null] Initial language to use. Will use the current if not specified.
   * @return {object} The registered copy, in un-parsed form.
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
   * @return {string|null} Registered copy at the key, or null if none.
   */
  getRegisteredCopyForKey(key, language = null) {
    const currentLanguage = language || this.language;
    return this._getFromHierarchy(currentLanguage, 'getRegisteredCopyForKey', key);
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
   * Returns the hierarchy from leaf to root starting at the given language. For example,
   * using the hierarchy from the comments at the top of this file, `_getHierarchy('portuguese')`
   * would produce `['portuguese', 'spanish', 'en-us']`.
   *
   * @param {string} language The starting language in the hierarchy
   * @return {string[]} The hierarchy from most leaf to root
   * @private
   */
  _getHierarchy(language) {
    const result = [language];
    let currentLanguage = language;

    while (this._hierarchy[currentLanguage]) {
      currentLanguage = this._hierarchy[currentLanguage];
      result.push(currentLanguage);
    }

    return result;
  }

  /**
   * Calls the method with the args on each copy service in the hierarchy, merging the results
   * such that the most specific (eg: `portuguese`) overrides the most general (eg: `en-us`).
   *
   * @param {string} language Language to start the hierarchy at
   * @param {string} method Method to call on the server
   * @param {*} args Arguments to pass to each service
   * @return {object} The merged result.
   * @private
   */
  _mergeFromHierarchy(language, method, ...args) {
    return _.reduceRight(this._getHierarchy(language), (result, lang) => {
      return _.merge(result, this.getLanguageService(lang)[method](...args));
    }, {});
  }

  /**
   * Returns the first non-null/undefined/false result from calling the method with the args in
   * each copy service in the hierarchy from leaf to root.
   *
   * If the method returns a boolean, this will either return `true` or `null`.
   *
   * @param {string} language Language to start the hierarchy at
   * @param {string} method Method to call on the server
   * @param {*} args Arguments to pass to each service
   * @return {*} The first truthy result, or null.
   * @private
   */
  _getFromHierarchy(language, method, ...args) {
    for (const lang of this._getHierarchy(language)) {
      const result = this.getLanguageService(lang)[method](...args);
      if (!_.isNil(result) && result !== false) {
        return result;
      }
    }

    return null;
  }
}

export default IntlCopyService;
