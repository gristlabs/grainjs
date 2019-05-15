import {dom, domDisposeHooks, makeTestId, obsArray, observable, setupKoDisposal, styled} from 'index';
import * as ko from 'knockout';

const testId = makeTestId('test-');

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function koOnDispose(func: () => void) {
  return (node: Node) => { ko.utils.domNodeDisposal.addDisposeCallback(node, func); };
}

function setupTest() {
  // Keep track of how many nodes are disposed by each of knockout and grainjs. Note that grainjs
  // visits text nodes too -- we verify the counts, but don't expect them equal. (See comment
  // about text nodes that in setupKoDisposal().)
  const grainNodeCount = observable<number>(0);
  const grainTextCount = observable<number>(0);
  const koNodeCount = observable<number>(0);

  // Override grainjs disposeNode, to call the original and also update counts.
  const origDisposeNode = domDisposeHooks.disposeNode;
  domDisposeHooks.disposeNode = (node) => {
    origDisposeNode(node);
    if (node.nodeType === Node.TEXT_NODE) {
      grainTextCount.set(grainTextCount.get() + 1);
    } else {
      grainNodeCount.set(grainNodeCount.get() + 1);
    }
  };

  // Set up knockout disposal to update counts.
  const origKnockoutClean = (ko.utils.domNodeDisposal as any).cleanExternalData;
  (ko.utils.domNodeDisposal as any).cleanExternalData = (node: Node) => {
    origKnockoutClean(node);
    koNodeCount.set(koNodeCount.get() + 1);
  };

  // ----------------------------------------------------------------------
  // Set up the grainjs-knockout disposal integration. That's what's really being tested.
  setupKoDisposal(ko);
  // ----------------------------------------------------------------------

  const messages = obsArray<string>();
  function show(msg: string) {
    messages.push(msg);
  }

  let container: Node;
  let content: Node;

  async function koDispose() {
    ko.removeNode(content);
    await delay(1);
    container.appendChild(content = buildDom(show));
  }

  async function grainDispose() {
    dom.domDispose(content);
    container.removeChild(content);
    await delay(1);
    container.appendChild(content = buildDom(show));
  }

  return [
    // Rebuild button will rebuild both content blocks.
    dom('div',
      cssButton({type: 'button', value: 'Knockout Dispose'}, testId('ko-dispose'),
        dom.on('click', koDispose)),
      cssButton({type: 'button', value: 'Grainjs Dispose'}, testId('grain-dispose'),
        dom.on('click', grainDispose)),
      cssButton({type: 'button', value: 'Clear Log'}, testId('clear-log'),
        dom.on('click', () => {
          messages.splice(0, messages.get().length);
          grainNodeCount.set(0);
          grainTextCount.set(0);
          koNodeCount.set(0);
        })),
    ),

    container = cssTestBox(content = buildDom(show)),

    // Show results of disposers that get run.
    cssTestBox(
      dom('div', 'grain disposed nodes: ', dom('span', dom.text((use) => String(use(grainNodeCount))),
        testId('grain-node-count'))),
      dom('div', 'grain disposed text nodes: ', dom('span', dom.text((use) => String(use(grainTextCount))),
        testId('grain-text-count'))),
      dom('div', 'knockout disposed nodes: ', dom('span', dom.text((use) => String(use(koNodeCount))),
        testId('ko-node-count'))),
      dom('ul',
        dom.forEach(messages, (msg) => dom('li', msg)),
        testId('log'),
      ),
    ),
  ];
}

function buildDom(show: (msg: string) => void) {
  return cssItem('outer',
    cssItem('ga', dom.onDispose(() => show('ga')),
      cssItem('plain'),
      cssItem('ga_gb', dom.onDispose(() => show('ga_gb')),
        cssItem('ga_gb_gc', dom.onDispose(() => show('ga_gb_gc')),
          cssItem('plain',
            cssItem('ga_gb_gc_kd', koOnDispose(() => show('ga_gb_gc_kd'))),
          ),
        ),
        cssItem('ga_gb_kc', koOnDispose(() => show('ga_gb_kc')),
          cssItem('plain',
            cssItem('ga_gb_kc_gd', dom.onDispose(() => show('ga_gb_kc_gd'))),
          ),
        ),
      ),
    ),
    cssItem('plain',
      // Include a comment in the test, to ensure we clean those up with either grainjs or knockout,
      // since comment node matter for some purposes (e.g. dom.domComputed relies on them).
      dom.update(document.createComment('comment'),
        koOnDispose(() => show('kcomment')),
        dom.onDispose(() => show('gcomment')),
      ),
    ),
    cssItem('ka', koOnDispose(() => show('ka')),
      cssItem('plain'),
      cssItem('ka_kb', koOnDispose(() => show('ka_kb')),
        cssItem('ka_kb_kc', koOnDispose(() => show('ka_kb_kc')),
          cssItem('plain',
            cssItem('ka_kb_kc_gd', dom.onDispose(() => show('ka_kb_kc_gd'))),
          ),
        ),
        cssItem('ka_kb_gc', dom.onDispose(() => show('ka_kb_gc')),
          cssItem('plain',
            cssItem('ka_kb_gc_kd', koOnDispose(() => show('ka_kb_gc_kd'))),
          ),
        ),
      ),
    ),
  );
}

const cssItem = styled('div', `
  margin-left: 8px;
`);

const cssTestBox = styled('div', `
  float: left;
  margin-top: 20px;
  margin-left: 20px;
  padding: 10px;
  width: 300px;
  font-family: sans-serif;
  font-size: 1rem;
  box-shadow: 1px 1px 4px 2px #AAA;

  & span { padding: 4px; }
`);

const cssButton = styled('input', `
  margin: 16px;
`);

dom.update(document.body, setupTest());
