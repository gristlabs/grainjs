import {IDisposableOwner, MultiHolder} from '../..';
import {obsArray, Observable, Computed} from '../..';
import {dom, DomContents, styled} from '../..';

type Squares = Array<'X'|'O'|null>;

function board(
  owner: IDisposableOwner,
  xIsNext: Observable<boolean>,
  squares: Observable<Squares>,
  onPlay: (nextSquares: Squares) => void,
): DomContents {
  const winner = Computed.create(owner, use => calculateWinner(use(squares)));

  function handleClick(i: number) {
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
          dom.text(use => use(squares)[i] || ''),
          dom.on('click', () => handleClick(i))
        )
      )),
    ),
  ];
}

function game(owner: MultiHolder): DomContents {
  const history = owner.autoDispose(obsArray<Squares>([Array(9).fill(null)]));
  const currentMove = Observable.create(owner, 0);
  const xIsNext = Computed.create(owner, use => use(currentMove) % 2 === 0);
  const currentSquares = Computed.create(owner, use => use(history)[use(currentMove)]);

  function handlePlay(nextSquares: Squares) {
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

function calculateWinner(squares: Squares) {
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
