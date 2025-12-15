# Complete example

To give you a taste of GrainJS in action, here are some complete examples built in GrainJS.

## Temperature converter

This example is based on a similar example from [React's
documentation](https://legacy.reactjs.org/docs/lifting-state-up.html).

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
