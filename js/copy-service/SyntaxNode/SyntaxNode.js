import _ from 'lodash';

class SyntaxNode {
  static isAST(node) {
    return _.isNil(node) || node instanceof SyntaxNode;
  }

  toSyntax() {
    return '';
  }

  isCacheable(copyService) {
    return false;
  }
}

export default SyntaxNode;
