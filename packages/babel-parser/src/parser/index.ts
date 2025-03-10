import type { Options } from "../options.ts";
import type * as N from "../types.ts";
import { getOptions } from "../options.ts";
import StatementParser from "./statement.ts";
import ScopeHandler from "../util/scope.ts";

export type PluginsMap = Map<
  string,
  {
    [x: string]: any;
  }
>;

//// 继承链路Parser->StatementParser->ExpressionParser->LValParser->NodeUtils->UtilParser->Tokenizer->CommentsParser->BaseParser
export default class Parser extends StatementParser {
  // Forward-declaration so typescript plugin can override jsx plugin
  // todo(flow->ts) - this probably can be removed
  // abstract jsxParseOpeningElementAfterName(
  //   node: N.JSXOpeningElement,
  // ): N.JSXOpeningElement;

  constructor(
    options: Options | undefined | null,
    input: string,
    pluginsMap: PluginsMap,
  ) {
    options = getOptions(options);
    super(options, input);

    this.options = options;
    this.initializeScopes();
    this.plugins = pluginsMap;
    this.filename = options.sourceFilename;
  }

  // This can be overwritten, for example, by the TypeScript plugin.
  getScopeHandler(): new (...args: any) => ScopeHandler {
    return ScopeHandler;
  }

  //// 核心的parse函数
  parse(): N.File {
    //// UtilParser 进入初始上下文
    this.enterInitialScopes();

    //// NodeUtils 新建结果对象
    const file = this.startNode<N.File>();

    //// NodeUtils 新建程序节点对象
    const program = this.startNode<N.Program>();

    //// Tokenizer 获取当前token并处理下一个token js->token
    this.nextToken();

    file.errors = null;

    //// StatementParser 从最外层开始解析ast token->ast
    this.parseTopLevel(file, program);

    file.errors = this.state.errors;

    file.comments.length = this.state.commentsLen;

    //// 返回结果对象
    return file as N.File;
  }
}
