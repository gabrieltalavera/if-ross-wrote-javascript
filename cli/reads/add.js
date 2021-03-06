#! /usr/bin/env node
const actionFactory = require('./prompt');

let questions = [
  {
    dataKey: 'title',
    msg: 'What\'s the title?'
  },
  {
    dataKey: 'author',
    msg: 'What\'s the author\'s name? <fmt: lastName, firstName>'
  },
  {
    dataKey: 'startedAt',
    msg: 'Start date?'
  },
];

return actionFactory({
  methodName: 'POST', 
  questions: questions
});