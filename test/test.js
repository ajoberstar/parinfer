/* global describe, it */

// -----------------------------------------------------------------------------
// Compile tests from Markdown to JSON

require('./cases/build.js').buildAll()
const indentCases = require('./cases/indent-mode.json')
const parenCases = require('./cases/paren-mode.json')
const smartCases = require('./cases/smart-mode.json')

// NOTE:
// Add some additional tests that do not participate in the "test cases in markdown" system
// This is a hack in order to ensure that adding configurable comment characters
// did not break anything.
// Long-term: I want to refactor the "test cases in markdown" approach
// -- C. Oakman, 06 Sep 2020

const indentModeCommentTest9000 = {
  text: '(def foo \\,\n(def bar \\ # <-- space',
  options: {
    commentChars: ['#']
  },
  result: {
    text: '(def foo \\,)\n(def bar \\ )# <-- space',
    success: true
  },
  source: {
    lineNo: 9000,
    in: [
      '(def foo \\,\n(def bar \\ # <-- space'
    ],
    out: '(def foo \\,)\n(def bar \\ )# <-- space'
  }
}

const indentModeCommentTest9050 = {
  text: '(def foo q)',
  options: { commentChars: 'q' },
  result: {
    text: '(def foo) q)',
    success: true
  },
  source: {
    lineNo: 9050,
    in: [
      '(def foo q)'
    ],
    out: '(def foo) q)'
  }
}

const indentModeCommentTest9100 = {
  text: '(def foo [a b]\n  # "my multiline\n  # docstring."\nret)',
  options: { commentChars: ['#'] },
  result: {
    text: '(def foo [a b])\n  # "my multiline\n  # docstring."\nret',
    success: true
  },
  source: {
    lineNo: 9100,
    in: [
      '(def foo [a b]\n  # "my multiline\n  # docstring."\nret)'
    ],
    out: '(def foo [a b])\n  # "my multiline\n  # docstring."\nret'
  }
}

const indentModeCommentTest9150 = {
  text: '(let [a 1\n      b 2\n      c {:foo 1\n         ## :bar 2}]\n  ret)',
  options: { commentChars: '#' },
  result: {
    text: '(let [a 1\n      b 2\n      c {:foo 1}]\n         ## :bar 2}]\n  ret)',
    success: true
  },
  source: {
    lineNo: 9150,
    in: [
      '(let [a 1\n      b 2\n      c {:foo 1\n         ## :bar 2}]\n  ret)'
    ],
    out: '(let [a 1\n      b 2\n      c {:foo 1}]\n         ## :bar 2}]\n  ret)'
  }
}

indentCases.push(indentModeCommentTest9000)
indentCases.push(indentModeCommentTest9050)
indentCases.push(indentModeCommentTest9100)
indentCases.push(indentModeCommentTest9150)

const parenModeCommentTest8000 = {
  text: '(let [foo 1\n      ]# <-- spaces\n  foo)',
  options: { commentChars: '#' },
  result: {
    text: '(let [foo 1]\n      # <-- spaces\n  foo)',
    success: true
  },
  source: {
    lineNo: 8000,
    in: [
      '(let [foo 1\n      ]# <-- spaces\n  foo)'
    ],
    out: '(let [foo 1]\n      # <-- spaces\n  foo)'
  }
}

const parenModeCommentTest8100 = {
  text: '(let [foo 1\n      bar 2\n\n     ] (+ foo bar\n  )% <-- spaces\n)',
  options: { commentChars: [';', '%'] },
  result: {
    text: '(let [foo 1\n      bar 2]\n\n     (+ foo bar))\n  % <-- spaces\n',
    success: true
  },
  source: {
    lineNo: 8100,
    in: [
      '(let [foo 1\n      bar 2\n\n     ] (+ foo bar\n  )% <-- spaces\n)'
    ],
    out: '(let [foo 1\n      bar 2]\n\n     (+ foo bar))\n  % <-- spaces\n'
  }
}

const parenModeCommentTest8200 = {
  text: '(def foo [a b]\n  # "my string\nret)',
  options: { commentChars: ['#'] },
  result: {
    error: {
      name: 'quote-danger',
      lineNo: 1,
      x: 4
    },
    text: '(def foo [a b]\n  # "my string\nret)',
    success: false
  },
  source: {
    lineNo: 8200,
    in: [
      '(def foo [a b]\n  # "my string\nret)'
    ],
    out: '(def foo [a b]\n  # "my string\n    ^ error: quote-danger\nret)'
  }
}

parenCases.push(parenModeCommentTest8000)
parenCases.push(parenModeCommentTest8100)
parenCases.push(parenModeCommentTest8200)

const smartModeCommentTest4100 = {
  text: '(let [a 1\n      ])$ <-- spaces',
  options: {
    commentChars: [';', '$']
  },
  result: {
    text: '(let [a 1])\n      $ <-- spaces',
    success: true
  },
  source: {
    lineNo: 4100,
    in: [
      '(let [a 1\n      ])$ <-- spaces'
    ],
    out: '(let [a 1])\n      $ <-- spaces'
  }
}

const smartModeCommentTest4200 = {
  text: '(defn foo\n    [a b]\n    # comment 1\n    bar)\n    # comment 2',
  options: {
    commentChars: ['#'],
    changes: [
      {
        lineNo: 0,
        x: 0,
        oldText: '  ',
        newText: ''
      }
    ]
  },
  result: {
    text: '(defn foo\n  [a b]\n  # comment 1\n  bar)\n  # comment 2',
    success: true
  },
  source: {
    lineNo: 4200,
    in: [
      '  (defn foo\n--\n    [a b]\n    # comment 1\n    bar)\n    # comment 2'
    ],
    out: '(defn foo\n  [a b]\n  # comment 1\n  bar)\n  # comment 2'
  }
}

smartCases.push(smartModeCommentTest4100)
smartCases.push(smartModeCommentTest4200)

// -----------------------------------------------------------------------------
// STRUCTURE TEST
// Diff the relevant result properties.

const parinfer = require('../parinfer.js')
const assert = require('assert')

function assertStructure (actual, expected, description) {
  assert.strictEqual(actual.text, expected.text)
  assert.strictEqual(actual.success, expected.success)
  assert.strictEqual(actual.cursorX, expected.cursorX)
  assert.strictEqual(actual.cursorLine, expected.cursorLine)

  assert.strictEqual(actual.error == null, expected.error == null)
  if (actual.error) {
    // NOTE: we currently do not test 'message' and 'extra'
    assert.strictEqual(actual.error.name, expected.error.name)
    assert.strictEqual(actual.error.lineNo, expected.error.lineNo)
    assert.strictEqual(actual.error.x, expected.error.x)
  }

  if (expected.tabStops) {
    assert.strictEqual(actual.tabStops == null, false)
    var i
    for (i = 0; i < actual.tabStops.length; i++) {
      assert.strictEqual(actual.tabStops[i].lineNo, expected.tabStops[i].lineNo)
      assert.strictEqual(actual.tabStops[i].x, expected.tabStops[i].x)
      assert.strictEqual(actual.tabStops[i].ch, expected.tabStops[i].ch)
      assert.strictEqual(actual.tabStops[i].argX, expected.tabStops[i].argX)
    }
  }

  if (expected.parenTrails) {
    assert.deepStrictEqual(actual.parenTrails, expected.parenTrails)
  }
}

function testStructure (testCase, mode) {
  var expected = testCase.result
  var text = testCase.text
  var options = testCase.options
  var actual, actual2, actual3

  // We are not yet verifying that the returned paren tree is correct.
  // We are simply setting it to ensure it is constructed in a way that doesn't
  // throw an exception.
  options.returnParens = true

  it('should generate the correct result structure', function () {
    switch (mode) {
      case 'indent': actual = parinfer.indentMode(text, options); break
      case 'paren': actual = parinfer.parenMode(text, options); break
      case 'smart': actual = parinfer.smartMode(text, options); break
    }
    assertStructure(actual, expected)

    // FIXME: not checking paren trails after this main check
    // (causing problems, and not a priority at time of writing)
    if (actual.parenTrails) {
      delete actual.parenTrails
    }
  })

  if (expected.error ||
      expected.tabStops ||
      expected.parenTrails ||
      testCase.options.changes) {
    return
  }

  it('should generate the same result structure on idempotence check', function () {
    const options2 = {
      cursorX: actual.cursorX,
      cursorLine: actual.cursorLine
    }
    if (testCase.options && testCase.options.commentChars) {
      options2.commentChars = testCase.options.commentChars
    }
    switch (mode) {
      case 'indent': actual2 = parinfer.indentMode(actual.text, options2); break
      case 'paren': actual2 = parinfer.parenMode(actual.text, options2); break
      case 'smart': actual2 = parinfer.smartMode(actual.text, options2); break
    }
    assertStructure(actual2, actual)
  })

  it('should generate the same result structure on cross-mode check', function () {
    var hasCursor = expected.cursorX != null
    const options3 = {}
    if (testCase.options && testCase.options.commentChars) {
      options3.commentChars = testCase.options.commentChars
    }
    if (!hasCursor) {
      switch (mode) {
        case 'indent': actual3 = parinfer.parenMode(actual.text, options3); break
        case 'paren': actual3 = parinfer.indentMode(actual.text, options3); break
        case 'smart': actual3 = parinfer.parenMode(actual.text, options3); break
      }
      assertStructure(actual3, actual)
    }
  })
}

// -----------------------------------------------------------------------------
// STRING TESTS
// Diff the annotated text instead of the data for easy reading.
// (requires extra parser/printer code that we may not want to port)

const parinferTest = require('../testParsingLib.js')

function testString (testCase, mode) {
  var expected = testCase.result
  var source = testCase.source

  const prettyOptions = {
    printTabStops: expected.tabStops,
    printParenTrails: expected.parenTrails
  }
  if (testCase.options && testCase.options.commentChars) {
    prettyOptions.commentChars = testCase.options.commentChars
  }

  var pretty, pretty2, pretty3

  it('should generate the correct annotated output', function () {
    switch (mode) {
      case 'indent': pretty = parinferTest.indentMode(source.in, prettyOptions); break
      case 'paren': pretty = parinferTest.parenMode(source.in, prettyOptions); break
      case 'smart': pretty = parinferTest.smartMode(source.in, prettyOptions); break
    }
    assert.strictEqual(pretty, source.out, '\n\nINPUT:\n' + source.in + '\n')
  })

  if (expected.error ||
      expected.tabStops ||
      expected.parenTrails ||
      testCase.options.changes) {
    return
  }

  it('should generate the same annotated output on idempotence check', function () {
    switch (mode) {
      case 'indent': pretty2 = parinferTest.indentMode(pretty, prettyOptions); break
      case 'paren': pretty2 = parinferTest.parenMode(pretty, prettyOptions); break
      case 'smart': pretty2 = parinferTest.smartMode(pretty, prettyOptions); break
    }
    assert.strictEqual(pretty2, pretty)
  })

  it('should generate the same annotated output on cross-mode check', function () {
    const hasCursor = expected.cursorX != null
    if (!hasCursor) {
      switch (mode) {
        case 'indent': pretty3 = parinferTest.parenMode(pretty, prettyOptions); break
        case 'paren': pretty3 = parinferTest.indentMode(pretty, prettyOptions); break
        case 'smart': pretty3 = parinferTest.parenMode(pretty, prettyOptions); break
      }
      assert.strictEqual(pretty3, pretty)
    }
  })
}

// -----------------------------------------------------------------------------
// Test execution order

function runTest (testCase, mode, filename) {
  describe(filename + ':' + testCase.source.lineNo, function () {
    testString(testCase, mode)
    testStructure(testCase, mode)
  })
}

describe('Indent Mode cases from markdown', function () {
  for (var i = 0; i < indentCases.length; i++) {
    runTest(indentCases[i], 'indent', 'cases/indent-mode.md')
  }
})

describe('Paren Mode cases from markdown', function () {
  for (var i = 0; i < parenCases.length; i++) {
    runTest(parenCases[i], 'paren', 'cases/paren-mode.md')
  }
})

describe('Smart Mode cases from markdown', function () {
  for (var i = 0; i < smartCases.length; i++) {
    runTest(smartCases[i], 'smart', 'cases/smart-mode.md')
  }
})
