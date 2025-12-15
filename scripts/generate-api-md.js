const assert = require('assert');
const fs = require('fs');
const path = require('path');
const escape = require('lodash/escape');
const sortBy = require('lodash/sortBy');
const {TSDocEmitter, TSDocParser, StringBuilder, DocNodeKind} = require('@microsoft/tsdoc');
const {DeclarationReference} = require('@microsoft/tsdoc');

const apiJsonPath = "temp/grainjs.api.json";
const outPath = "docs/api/index.md";
const sourceBaseUrl = "https://github.com/gristlabs/grainjs/blob/master/";

const groupings = [{
  name: "DOM reference",
  description: `
We refer to the functions like \`dom.cls()\`, which can be used as arguments to the \`dom()\`
function as "dom-methods". These often take an argument of type \`BindableValue\`, which means
that either a plain value (e.g. string) may be supplied, or an \`Observable\` (or \`Computed\`)
containing that type, or a "use callback" to create a \`Computed\` from
(e.g. \`use => use(obs1) && use(obs2)\`).

Note that all the bindings are one-way: if the supplied value is an observable, the method will
listen to it, and update something about DOM when that observable changes.
`,
  memberFiles: /^(dom(?!Dispose)|styled)/,
}, {
  name: 'Disposable reference',
  description: `
See [Disposables](dispose) for background.
`,
  memberFiles: /^(dispose|domDispose)/,
}, {
  name: 'Observables reference',
  description: '',
  memberFiles: /^(computed|pureComputed|obs|binding|subscribe)/,
}];

const tsdocParser = new TSDocParser();

function apiJsonToMarkdown(json, markdown) {
  const emit = (block) => { if (block) { markdown.push(block); } };
  emit("# API Reference");
  const entrypoint = json.members[0];
  assert.equal(entrypoint.kind, "EntryPoint");

  collectDomMethodsUnderDom(entrypoint);
  collectFunctionOverrides(entrypoint.members);

  const seenMembers = new Set();
  const membersByName = new Map(entrypoint.members.map(m => [m.name, m]));

  for (const grouping of groupings) {
    emit(`## ${grouping.name}`);
    emit(grouping.description);
    for (const member of entrypoint.members) {
      if (grouping.memberFiles.test(path.basename(member.fileUrlPath, '.d.ts'))) {
        renderItem(member, 3);
        seenMembers.add(member);
      }
    }
  }

  emit("## Other");
  for (const item of entrypoint.members) {
    if (!seenMembers.has(item)) {
      renderItem(item, 3);
    }
  }

  function renderItem(member, level) {
    renderOneItem(member, level);
    if (member.members) {
      collectFunctionOverrides(member.members);
      for (const item of member.members) {
        renderItem(item, level);
      }
    }
  }

  function renderOneItem(member, level) {
    // Don't emit undocumented members or those without a name (api-extractor generates some
    // unnamed 'constructor' entries).
    if (!member.docComment || !member.name) { return; }

    // Parse the canonical reference.
    const name = member.useName || extractCanonicalName(member.canonicalReference) || member.name;

    // Heading.
    emit("#".repeat(level) + ' ' + name + ' {#'  + extractCanonicalName(member.canonicalReference) + '}');

    // Function signature.
    const excerpts = [
      getSignature(member.excerptTokens),
      ...(member.overrides || []).map(t => getSignature(t))
    ];
    const refs = [getRefs(member.excerptTokens),
      ...(member.overrides || []).map(t => getRefs(t))].flat();
    emit("```ts refs=" + refs.join('|') + "\n" + excerpts.join('\n') + "\n```");

    // Link to source code.
    if (member.fileUrlPath) {
      const file = path.basename(member.fileUrlPath, ".d.ts") + ".ts";
      emit(`\n<div class="source-link"><a href="${getSourceUrl(file)}" target="_blank">Defined in ${file}</a></div>\n`);
    }

    // Documentation.
    const {docComment} = tsdocParser.parseString(member.docComment);
    emit(renderNode(docComment));
  }
}

function collectDomMethodsUnderDom(entrypoint) {
  // GrainJS exposes a `dom` function, which is also a namespace containing various DOM-related
  // methods. The same methods are exposed as top-level, and under `dom`. We document them all as
  // being under `dom`, to keep a single reference for each, with recommended usage.
  const domFunction = entrypoint.members.find(m => m.name === 'dom' && m.kind === 'Function');
  const domNamespace = entrypoint.members.find(m => m.name === 'dom' && m.kind === 'Namespace');
  const domMembers = new Set(domNamespace.members.map(m => m.name));
  for (const member of entrypoint.members) {
    if (domMembers.has(member.name)) {
      member.useName = `dom.${member.name}`;
    }
  }
  entrypoint.members = entrypoint.members.filter(m => m !== domNamespace);
  entrypoint.members = sortBy(entrypoint.members, m => (m.useName || m.name).toLowerCase());
}

function collectFunctionOverrides(members) {
  // Whe we have function overrides, there is one function that's documented, and a few more by
  // the same name that are undocumented and will be omitted. Collect their excerpts into the
  // first function to show all variants in its documentation.
  let primary = null;
  for (const member of members) {
    if (member.docComment) {
      primary = member;
    } else if (primary && member.name === primary.name) {
      if (!primary.overrides) { primary.overrides = []; }
      primary.overrides.push(member.excerptTokens);
    }
  }
}

function getSourceUrl(file) {
  return new URL(`lib/${file}`, sourceBaseUrl).href;
}

function getSignature(excerptTokens) {
  return excerptTokens.map(t => t.text).join("")
    .replace(/(export\s+)?(declare\s+)?(function\s+)?/, '').trim();
}

function getRefs(excerptTokens) {
  return excerptTokens.filter(t => t.kind === "Reference")
    .map(t => `${t.text}=${t.canonicalReference}`);
}

function extractCanonicalName(canonicalReference) {
  const match = canonicalReference.match(/^([^!]+)!([^:]+):.*$/);
  return match?.[2];
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
          this._writeContent('| Parameter | Description |\n')
          this._writeContent('| --- | --- |\n')
          super._renderNode(docNode);
          this._ensureLineSkipped();
        }
        break;
      case DocNodeKind.ParamBlock: {
        this._ensureAtStartOfLine();
        const content = renderNode(docNode.content).trim().split('\n');
        this._writeContent(`| \`${docNode.parameterName}\` | ${content[0]} |`);
        for (const line of content.slice(1)) {
          this._writeContent(`\\\n| | ${line} |`);
        }
        break;
      }
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
