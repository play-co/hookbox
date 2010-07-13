var fs = require('fs');

fs.writeFileSync('tmp_test_compiled.js', fs.readFileSync('tmp_test_compiled.js')
	.replace('jsio("import test as test")', ''));

require('./tmp_test_compiled');
var code = ['util.browser', 'util.sizzle', '.test'];

var result = [];
for (var i = 0, name; name = code[i]; ++i) {
	var src = jsio.getCachedSrc(name) || jsio.getCachedSrc(name.replace(/^\.+/, ''));
	result.push('jsio.setCachedSrc("' + name + '", "' + src.filePath + '",' + JSON.stringify(src.src) + ');\n');
}

fs.writeFileSync('../../static/test.html', fs.readFileSync('test.html')
	.replace(/<script src="[\w\s.-\/\\]+hookbox\.js"><\/script>/i, '<script src="hookbox.js"></script>')
	.replace(/<script src="[\w\s.-\/\\]+jsio\.js"><\/script>/i, '')
	.replace('<!-- cachedScripts -->', result.join('')));

