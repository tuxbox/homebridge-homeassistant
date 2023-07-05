const nunjucks = require('nunjucks');

const template = nunjucks.compile('{{ value_json.POWER }}');

console.log(template.render({"value":"{\"POWER\":\"ON\"}","value_json":{"POWER":"ON"}}));