# GrainJS examples

To give you a taste of GrainJS in action, here are some examples built in GrainJS.

## Unix timestamp converter

This is an extra simple example: it lets the user enter or paste in a unix timestamp (seconds
since Jan 1, 1970) and show the time it corresponds to.

[Try it in Codepen.](https://codepen.io/dsagal/pen/ByKgyGM?editors=0010)

```ts
// If building typescript, you'd use: import {...} from 'grainjs'
const {dom, Observable, styled} = grainjs;

// Define a div with some styling.
const cssConverter = styled('div', `
  background-color: #caf2ff;
  padding: 8px 16px;
  border-radius: 16px;
  font-family: sans-serif;
`);

// Insert the converter component into DOM.
dom.update(document.body, dom.create((owner) => {
  const timestamp = Observable.create(owner, Math.floor(Date.now() / 1000));
  return cssConverter(
    dom('p', 'Enter Unix timestamp'),
    dom('input', {type: 'number', value: String(timestamp.get())},
      dom.on('input', (ev, elem) => timestamp.set(elem.value))),
    dom('p', 'Corresponding time is: ',
      dom('strong', dom.text(use =>
        (new Date(Number.parseFloat(use(timestamp)) * 1000)).toISOString()))
    )
  );
}));
```
<GrainJsExample heightRem=10 />

[Try it in Codepen.](https://codepen.io/dsagal/pen/ByKgyGM?editors=0010)

## Tic-Tac-Toe

This much larger example is translated from [React's Tic-Tac-Toe
tutorial](https://react.dev/learn/tutorial-tic-tac-toe), and intentionally follows its pattern
in case you are interested in a comparison.

:::info Things to note

- GrainJS is ideally used with TypeScript, with an editor that shows type errors and warnings. This
  example lacks types, so that it can run in the browser without a build step.
- GrainJS uses observables for reactivity, which is similar to [Vue's
  `ref`](https://vuejs.org/api/reactivity-core#ref), but different from react.
- In GrainJS, it's normal to build DOM inline in JS.
- In GrainJS, it's normal to _style_ DOM in JS too. It's typical to place styles at the end of a
  file.
- Any time we create anything, we have an "owner", which is responsible for disposal of the
  created object. This doesn't matter for a toy example, but matters for long-lived apps.

:::

[Try it in Codepen.](https://codepen.io/dsagal/pen/myPZbKN?editors=0010)

```ts
const {dom, obsArray, Observable, Computed, styled} = grainjs;

function board(owner, xIsNext, squares, onPlay) {
  const winner = Computed.create(owner, use => calculateWinner(use(squares)));

  function handleClick(i) {
    if (winner.get() || squares.get()[i]) {
      return;
    }
    const nextSquares = squares.get().slice();
    nextSquares[i] = xIsNext.get() ? 'X' : 'O';
    onPlay(nextSquares);
  }

  return [
    cssStatus(dom.text(use => use(winner) ?
      'Winner: ' + use(winner) : 'Next player: ' + (use(xIsNext) ? 'X' : 'O')
    )),
    [[0, 1, 2], [3, 4, 5], [6, 7, 8]].map(
      row => cssBoardRow(row.map(
        i => cssSquare(
          dom.text(use => use(squares)[i]),
          dom.on('click', () => handleClick(i))
        )
      )),
    ),
  ];
}

function game(owner) {
  const history = owner.autoDispose(obsArray([Array(9).fill(null)]));
  const currentMove = Observable.create(owner, 0);
  const xIsNext = Computed.create(owner, use => use(currentMove) % 2 === 0);
  const currentSquares = Computed.create(owner, use => use(history)[use(currentMove)]);

  function handlePlay(nextSquares) {
    history.splice(currentMove.get() + 1, Infinity, nextSquares);
    currentMove.set(history.get().length - 1);
  }

  return cssGame(
    cssGameBoard(
      dom.create(board, xIsNext, currentSquares, handlePlay)
    ),
    cssGameInfo(
      dom('ol', dom.forEach(history, (squares, move) =>
        dom('li',
          dom('button',
            (move > 0 ? 'Go to move #' + move : 'Go to game start'),
            dom.on('click', () => currentMove.set(move))
          )
        )
      ))
    ),
  );
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

// Styles for our game.

const cssGame = styled('div', `
  font-family: sans-serif;
  margin: 20px;
  display: flex;
  flex-direction: row;
`);
const cssGameBoard = styled('div', `
`);
const cssGameInfo = styled('div', `
  margin-left: 20px;
`);
const cssSquare = styled('button', `
  background: #fff;
  border: 1px solid #999;
  float: left;
  font-size: 24px;
  font-weight: bold;
  line-height: 34px;
  height: 34px;
  margin-right: -1px;
  margin-top: -1px;
  padding: 0;
  text-align: center;
  width: 34px;
`);
const cssStatus = styled('div', `
  margin-bottom: 10px;
`);
const cssBoardRow = styled('div', `
  &:after {
    clear: both;
    content: '';
    display: table;
  }
`);

dom.update(document.body, dom.create(game));
```
<GrainJsExample heightRem=15 />

[Try it in Codepen.](https://codepen.io/dsagal/pen/myPZbKN?editors=0010)

## Temperature converter

This is another converter, based on another example from [React's
documentation](https://legacy.reactjs.org/docs/lifting-state-up.html).
This one converts in either direction, which is a little tricky.

[Try it in Codepen.](https://codepen.io/dsagal/pen/EaKBYXQ?editors=0010)

```js
const { Computed, Disposable, Observable, dom, styled } = grainjs;

const toCelsius = (fahrenheit) => (fahrenheit - 32) * 5 / 9;
const toFahrenheit = (celsius) => (celsius * 9 / 5) + 32;
const cleanNumber = (num) => Number.isNaN(num) ? '' : num.toFixed(3);

function buildCalculator(owner) {
  // Pair [temp, isCelsius] of raw temperature last entered and
  // whether it was entered in Celsius.
  const tempObs = Observable.create(owner, ['', true]);

  // Numerical temp in Celsius, either from raw input or converted.
  const celsius = Computed.create(owner, tempObs, (use, [temp, isCelsius]) =>
      isCelsius ? temp : cleanNumber(toCelsius(parseFloat(temp))));

  // Numerical temp in Fahrenheit, either from raw input or converted.
  const fahrenheit = Computed.create(owner, tempObs, (use, [temp, isCelsius]) =>
      !isCelsius ? temp : cleanNumber(toFahrenheit(parseFloat(temp))));

  // Is it above boiling point?
  const willBoil = Computed.create(owner, use => use(celsius) >= 100);

  function makeInput(temperature, isCelsius, scaleName) {
    return cssFieldSet(
      dom('legend', 'Enter temperature in ', scaleName),
      cssInput(dom.prop('value', temperature),
        dom.on('input', e => tempObs.set([e.target.value, isCelsius]))
      ),
    );
  }

  return cssContainer(
    makeInput(celsius, true, 'Celsius'),
    makeInput(fahrenheit, false, 'Fahrenheit'),
    cssVerdict(dom.text(use => use(willBoil) ?
      'The water would boil.' : 'The water would not boil.')
    ),
  );
}

// We define styles right inline in the same file.

const cssContainer = styled('div', `
  font: 16px/1.4 system-ui, sans-serif;
  margin: 0 1rem;
`);

const cssFieldSet = styled('fieldset', `
  margin: 1rem 0;
  border: 1px solid lightgrey;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  & legend {
    color: darkblue;
  }
`);

const cssInput = styled('input', `
  padding: .5rem;
  border: 1px solid lightgrey;
  border-radius: 6px;
`);

const cssVerdict = styled('p', `
  margin: 1rem 0;
  color: brown;
`);

dom.update(document.body, dom.create(buildCalculator));
```
<GrainJsExample heightRem=15 />

:::details HTML file

The HTML file is just a stub that loads GrainJS and our code (assumed to be in `./index.js`).

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/grainjs@1/dist/grain-full.min.js" defer></script>
    <script src="./index.js" defer></script>
  </head>
  <body>
  </body>
</html>
```

:::

[Try it in Codepen.](https://codepen.io/dsagal/pen/EaKBYXQ?editors=0010)
