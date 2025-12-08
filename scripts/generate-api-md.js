const assert = require('assert');
const fs = require('fs');
const path = require('path');
const escape = require('lodash/escape');
const {TSDocEmitter, TSDocParser, StringBuilder, DocNodeKind} = require('@microsoft/tsdoc');

const apiJsonPath = "temp/grainjs.api.json";
const outPath = "docs/api/index.md";
const sourceBaseUrl = "https://github.com/gristlabs/grainjs/blob/master/";

const tsdocParser = new TSDocParser();

function apiJsonToMarkdown(json, markdown) {
  const emit = (block) => { if (block) { markdown.push(block); } };
  emit("# API Reference");
  const entrypoint = json.members[0];
  assert.equal(entrypoint.kind, "EntryPoint");
  for (const member of entrypoint.members) {
    emit(`## ${member.name}`);
    let excerpt = member.excerptTokens.map(t => t.text).join("");
    excerpt = excerpt.replace(/(export\s+)?(declare\s+)?(function\s+)?/, '').trim();
    emit("```ts\n" + excerpt + "\n```");
    if (member.fileUrlPath) {
      const file = path.basename(member.fileUrlPath, ".d.ts") + ".ts";
      emit(`\n<div class="source-link"><a href="${getSourceUrl(file)}" target="_blank">Defined in ${file}</a></div>\n`);
    }
    if (member.name.startsWith("attr")) {
      const {docComment} = tsdocParser.parseString(member.docComment);
      emit(renderNode(docComment));
    }
  }
}

function getSourceUrl(file) {
  return new URL(`lib/${file}`, sourceBaseUrl).href;
}

function renderNode(node) {
  const stringBuilder = new StringBuilder();
  const emitter = new CustomEmitter();
  emitter.renderHtmlTag(stringBuilder, node);
  return stringBuilder.toString();
}

class CustomEmitter extends TSDocEmitter {
  _skipNextBlockTag = false;

  _renderNode(docNode) {
    switch (docNode?.kind) {
      case DocNodeKind.BlockTag:
        if (this._skipNextBlockTag) {
          this._skipNextBlockTag = false;
        } else {
          super._renderNode(docNode);
        }
        break;
      case DocNodeKind.ParamCollection:
        if (docNode.blocks?.length > 0) {
          this._ensureLineSkipped();
          this._writeContent('\n<table><thead>\n');
          this._writeContent('<tr><th>Parameter</th><th>Description</th></tr>\n');
          this._writeContent('</thead>\n<tbody>\n');
          super._renderNode(docNode);
          this._writeContent('\n</tbody></table>\n');
        }
        break;
      case DocNodeKind.ParamBlock:
        this._ensureAtStartOfLine();
        this._writeContent(`<tr><td><code>${escape(docNode.parameterName)}</code></td>`);
        this._writeContent(`<td>${renderNode(docNode.content)}</td></tr>`);
        break;
      case DocNodeKind.Block:
        this._skipNextBlockTag = true;
        this._writeContent(`\n::: info ${tagToTitle(docNode.blockTag.tagName)}\n`);
        super._renderNode(docNode);
        this._writeContent('\n:::\n');
        break;
      default:
        super._renderNode(docNode);
    }
  }
}

function tagToTitle(tagName) {
  if (tagName.startsWith('@')) { tagName = tagName.slice(1); }
  return tagName.charAt(0).toUpperCase() + tagName.slice(1);
}

const json = JSON.parse(fs.readFileSync(apiJsonPath, {encoding: 'utf8'}));
const markdown = [];
apiJsonToMarkdown(json, markdown);
fs.writeFileSync(outPath, markdown.join("\n"), "utf8");
console.log("Wrote", outPath);
