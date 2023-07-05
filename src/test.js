const nunjucks = require('nunjucks');

const template = nunjucks.compile('{{ value_json }}');

console.log(template.render({ value: 'xkcd', value_json: JSON.parse('"x"') }));