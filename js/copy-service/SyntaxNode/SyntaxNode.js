import _ from 'lodash';

class SyntaxNode {
  static isAST(node) {
    return _.isNil(node) || node instanceof SyntaxNode;
  }

  static safeToSyntax(node) {
    if (_.isNil(node)) {
      return '';
    }

    return node.toSyntax();
  }

  toSyntax() {
    return '';
  }

  safeToSyntax(node) {
    return this.constructor.safeToSyntax(node);
  }

  isCacheable(copyService) {
    return false;
  }
}

export default SyntaxNode;
