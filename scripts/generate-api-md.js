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
  anchor: 'dom-reference',
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
  anchor: 'disposable-reference',
  description: `
See [Disposables](dispose) for background.
`,
  memberFiles: /^(dispose|domDispose)/,
}, {
  name: 'Observables reference',
  anchor: 'observables-reference',
  description: `
See [Observables](basics#observables) for background.
`,
  memberFiles: /^(computed|pureComputed|obs|binding|subscribe)/,
}];

// References to types mentioned in grainjs signatures, which we can link to something useful
// externally. Linking is done in docs/.vitepress/theme/linkifyRefs.js:
//    - 'tsutil#' becomes 'https://www.typescriptlang.org/docs/handbook/utility-types.html#'
//    - 'mdn#' becomes 'https://developer.mozilla.org/en-US/docs/Web/API/'
const externalRefLinks = {
  '!ConstructorParameters:type': 'tsutil#constructorparameterstype',
  '!Exclude:type': 'tsutil#excludeuniontype-excludedmembers',
  '!InstanceType:type': 'tsutil#instancetypetype',
  '!NodeListOf:interface': 'mdn#NodeList',
  '!NonNullable:type': 'tsutil#nonnullabletype',
  '!DocumentFragment:interface': 'mdn#DocumentFragment',
  '!Element:interface': 'mdn#Element',
  '!Event:interface': 'mdn#Event',
  '!EventTarget:interface': 'mdn#EventTarget',
  '!HTMLElement:interface': 'mdn#HTMLElement',
  '!HTMLInputElement:interface': 'mdn#HTMLInputElement',
  '!HTMLSelectElement:interface': 'mdn#HTMLSelectElement',
  '!Node:interface': 'mdn#Node',
  '!SVGElement:interface': 'mdn#SVGElement',
};

const ignoreTypeRefs = new Set([
  '!Array:interface',
  '!HTMLElementEventMap:interface',
  '!HTMLElementTagNameMap:interface',

  // Don't linkify these undocumented members. They are essentially internal, although present in
  // signatures of some public members.
  'grainjs!LLink:class',
  'grainjs!~Owner:type',
  'grainjs!~creator:var',
]);

const tsdocParser = new TSDocParser();

function apiJsonToMarkdown(json, markdown) {
  const emit = (block) => { if (block) { markdown.push(block); } };
  emit("# API Reference");
  const entrypoint = json.members[0];
  assert.equal(entrypoint.kind, "EntryPoint");

  collectDomMethodsUnderDom(entrypoint);
  collectFunctionOverrides(entrypoint.members);

  const seenMembers = new Set();
  const miscTypeMembers = new Set();
  const membersByName = new Map(entrypoint.members.map(m => [m.name, m]));
  const refsLinked = new Set();
  const refsPresent = new Set(Object.keys(externalRefLinks));

  for (const grouping of groupings) {
    emit(`- [${grouping.name}](${grouping.anchor})`);
  }
  emit(`- [Other](#other)`);
  emit(`- [Misc Types](#misc-types)`);

  for (const grouping of groupings) {
    emit(`## ${grouping.name} {#${grouping.anchor}}`);
    emit(grouping.description);
    for (const member of entrypoint.members) {
      if (!member.docComment && ['TypeAlias', 'Interface'].includes(member.kind)) {
        miscTypeMembers.add(member);
        continue;
      }
      if (grouping.memberFiles.test(path.basename(member.fileUrlPath, '.d.ts'))) {
        renderItem(member);
        seenMembers.add(member);
      }
    }
  }

  emit("## Other");
  for (const item of entrypoint.members) {
    if (!seenMembers.has(item) && !miscTypeMembers.has(item)) {
      renderItem(item);
    }
  }

  emit("## Misc types");
  for (const item of entrypoint.members) {
    if (miscTypeMembers.has(item)) {
      renderOneItem(item, null, {hideHeader: true});
    }
  }

  const badRefs = [...refsLinked].filter(r => !refsPresent.has(r)).sort();
  if (badRefs.length > 0) {
    console.warn("References to undefined types:", badRefs);
  }

  function renderItem(member, optParent) {
    renderOneItem(member, optParent);
    if (member.members && !['TypeAlias', 'Interface'].includes(member.kind)) {
      collectFunctionOverrides(member.members);
      // Move static members to the beginning.
      member.members.sort((a, b) => b.isStatic - a.isStatic);
      for (const item of member.members) {
        renderItem(item, member);
      }
    }
  }

  function renderOneItem(member, optParent, options) {
    // Don't emit undocumented members without names (like some constructors) or which are
    // overloads of something else.
    if (!member.docComment && (!member.name || member.overloadIndex >= 2)) { return; }

    // Also don't emit documentation consisting only of "@override" tag.
    if (/^\W*@override\W*$/.test(member.docComment)) { return; }

    // Skip the utterly pointless auto-generated (by api-extractor) constructor documentation.
    // (In fact, marking it as "@internal" might be clearer, but that causes api-extractor to
    // generate more misleading remarks on the class itself.)
    if (/^\W*Constructs a new instance of the [^ ]+ class\W*$/.test(member.docComment)) { return; }

    // Parse the canonical reference.
    const name = member.useName || extractCanonicalName(member.canonicalReference) || member.name;

    // Heading.
    const hideHeader = options?.hideHeader ? ' .hidden-heading' : '';
    emit(`### ${name} {#${extractCanonicalName(member.canonicalReference)}${hideHeader}}`);
    refsPresent.add(member.canonicalReference);
    getFunctionExcerptWithOverrides(member).forEach(t => addRefs(t, refsLinked));

    if (['TypeAlias', 'Interface'].includes(member.kind)) {
      renderTypeBody(member);
    } else {
      if (!member.docComment) {
        console.warn("UNDOCUMENTED:", name);
      }

      // Function signature.
      const excerpts = getFunctionExcerptWithOverrides(member).map(getSignature);
      const refs = getFunctionExcerptWithOverrides(member).map(getRefs).flat();
      emit("```ts refs=" + refs.join('|') + "\n" + excerpts.join('\n') + "\n```");
    }

    // Link to source code.
    const fileUrlPath = member.fileUrlPath || optParent?.fileUrlPath;
    if (fileUrlPath) {
      const file = path.basename(fileUrlPath, ".d.ts") + ".ts";
      emit(`\n<div class="source-link"><a href="${getSourceUrl(file)}" target="_blank">Defined in ${file}</a></div>\n`);
    }

    // Documentation.
    const {docComment} = tsdocParser.parseString(member.docComment);
    emit(renderNode(docComment));
  }

  function renderTypeBody(member) {
    const fullMembers = [member, ...(member.members || [])];
    const refs = fullMembers.map(m => getRefs(m.excerptTokens)).flat();
    emit("```ts refs=" + refs.join('|'));
    const content = [getSignature(member.excerptTokens)];
    if (member.members) {
      if (!member.members.length) {
        content.push(' {}');
      } else {
        content.push(' {\n');
        for (const item of member.members) {
          content.push('  ' + getSignature(item.excerptTokens) + '\n');
        }
        content.push('}');
      }
    }
    emit(content.join(''));
    emit("```");
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

function getFunctionExcerptWithOverrides(item) {
  return [item.excerptTokens, ...(item.overrides || [])];
}

function collectFunctionOverrides(members) {
  // Whe we have function overrides, there is one function that's documented, and a few more by
  // the same name that are undocumented and will be omitted. Collect their excerpts into the
  // first function to show all variants in its documentation.
  let primary = null;
  for (const member of members) {
    if (member.docComment) {
      primary = member;
    } else if (primary && member.name === primary.name && member.overloadIndex >= 2) {
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
    .filter(t => !ignoreTypeRefs.has(t.canonicalReference))
    .map(t => {
      const ref = externalRefLinks[t.canonicalReference] || t.canonicalReference;
      return `${t.text}=${ref}`;
    });
}

function addRefs(excerptTokens, refsSeen) {
  excerptTokens.filter(t => t.kind === "Reference")
    .filter(t => !ignoreTypeRefs.has(t.canonicalReference))
    .forEach(t => refsSeen.add(t.canonicalReference));
}

function extractCanonicalName(canonicalReference) {
  const match = canonicalReference.match(/^grainjs!([^:]+):(\w+).*$/);
  if (!match) { return null; }
  if (match[2] === 'constructor') { return match[1] + '#constructor'; }
  return match[1];
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
