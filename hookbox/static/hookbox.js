;(function(){

    var preloaded_source = {
'jsio.env.': {"url": "jsio/env/__init__.js", "src": "require('jsio', ['getEnvironment', 'log', 'bind', 'test']);\n\nfunction getObj(objectName, transportName, envName) {\n\tenvName = envName || getEnvironment();\n\ttry {\n\t\tvar what = {};\n\t\twhat[objectName] = 'result';\n\t\trequire('.' + envName + '.' + transportName, what);\n\t} catch(e) {\n\t\tthrow new Error('No ' + objectName + ' found for ' + transportName + ' in ' + envName);\n\t}\n\treturn result;\n}\n\nexports.getListener = bind(this, getObj, 'Listener');\nexports.getConnector = bind(this, getObj, 'Connector');\n"},
'jsio.protocols.delimited': {"url": "jsio/protocols/delimited.js", "src": "require('jsio', ['Class', 'log']);\nrequire('jsio.logging');\nrequire('jsio.interfaces');\n\nvar logger = jsio.logging.getLogger('DelimitedProtocol')\nexports.DelimitedProtocol = Class(jsio.interfaces.Protocol, function(supr) {\n\n    this.init = function(delimiter) {\n        if (!delimiter) {\n            delimiter = '\\r\\n'\n        }\n        this.delimiter = delimiter;\n        this.buffer = \"\"\n    }\n\n    this.connectionMade = function() {\n        logger.debug('connectionMade');\n    }\n    \n    this.dataReceived = function(data) {\n        logger.debug('dataReceived:', JSON.stringify(data));\n        this.buffer += data;\n        var i;\n        while ((i = this.buffer.indexOf(this.delimiter)) != -1) {\n            var line = this.buffer.slice(0, i);\n            this.buffer = this.buffer.slice(i + this.delimiter.length);\n            this.lineReceived(line);\n        }\n    }\n\n    this.lineReceived = function(line) {\n        logger.debug('Not implemented, lineReceived:', line);\n    }\n\n    this.connectionLost = function() {\n        logger.debug('connectionLost');\n    }\n});\n\n"},
'jsio.logging': {"url": "jsio/logging.js", "src": "require('jsio', ['Class', 'log']);\n\nvar loggers = {}\nvar levels = exports.levels = {\n    DEBUG: 0,\n    LOG: 1,\n    INFO: 2,\n    WARN: 3,\n    ERROR: 4\n};\nexports.getLogger = function(name) {\n    if (!(name in loggers)) {\n        loggers[name] = new exports.Logger(name);\n    }\n    return loggers[name];\n}\n\nexports.Logger = Class(function() {\n    \n    this.init = function(name, level) {\n        if (!level) {\n            level = levels.LOG;\n        }\n        this.name = name;\n        this.level = level;\n    }\n    this.setLevel = function(level) {\n        this.level = level;\n    }\n    function makeLogFunction(level, type) {\n        var a = [];\n        return function() {\n            if (level < this.level) return;\n            a.splice.call(arguments,0,0,type, this.name)\n            log.apply(log, arguments);\n        }\n    }\n\n    this.debug = makeLogFunction(levels.DEBUG, \"DEBUG\");\n    this.log = makeLogFunction(levels.LOG, \"LOG\");\n    this.info = makeLogFunction(levels.INFO, \"INFO\");\n    this.warn = makeLogFunction(levels.WARN, \"WARN\");\n    this.error = makeLogFunction(levels.ERROR, \"ERROR\");\n\n})\n"},
'jsio.base64': {"url": "jsio/base64.js", "src": "/*\n\"URL-safe\" Base64 Codec, by Jacob Rus\n\nThis library happily strips off as many trailing '=' as are included in the\ninput to 'decode', and doesn't worry whether its length is an even multiple\nof 4. It does not include trailing '=' in its own output. It uses the\n'URL safe' base64 alphabet, where the last two characters are '-' and '_'.\n\n--------------------\n\nCopyright (c) 2009 Jacob Rus\n\nPermission is hereby granted, free of charge, to any person\nobtaining a copy of this software and associated documentation\nfiles (the \"Software\"), to deal in the Software without\nrestriction, including without limitation the rights to use,\ncopy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the\nSoftware is furnished to do so, subject to the following\nconditions:\n\nThe above copyright notice and this permission notice shall be\nincluded in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND,\nEXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES\nOF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND\nNONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT\nHOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,\nWHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING\nFROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR\nOTHER DEALINGS IN THE SOFTWARE.\n*/\n\n(function() {\n\nvar alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef' +\n               'ghijklmnopqrstuvwxyz0123456789-_';\nvar pad = '=';\n\nvar UnicodeCodecError = this.UnicodeCodecError = function (message) { this.message = message; };\nthis.UnicodeCodecError.prototype.toString = function () {\n  return 'UnicodeCodecError' + (this.message ? ': ' + this.message : '');\n};\n\nvar shorten = function (array, number) {\n  // remove 'number' characters from the end of 'array', in place (no return)\n  for (var i = number; i > 0; i--){ array.pop(); };\n};\n\nvar decode_map = {};\nfor (var i=0, n=alphabet.length; i < n; i++) {\n  decode_map[alphabet[i]] = i;\n};\n// use this regexp in the decode function to sniff out invalid characters.\nvar alphabet_inverse = new RegExp('[^' + alphabet + ']');\nvar Base64CodecError = this.Base64CodecError = function (message) { this.message = message; };\nBase64CodecError.prototype.toString = function () {\n  return 'Base64CodecError' + (this.message ? ': ' + this.message : '');\n};\nvar assertOrBadInput = function (exp, message) {\n  if (!exp) { throw new Base64CodecError(message) };\n};\nthis.encode = function (bytes) {\n  assertOrBadInput(!(/[^\\x00-\\xFF]/.test(bytes)), // disallow two-byte chars\n                   'Input contains out-of-range characters.');\n  var padding = '\\x00\\x00\\x00'.slice((bytes.length % 3) || 3);\n  bytes += padding; // pad with null bytes\n  var out_array = [];\n  for (var i=0, n=bytes.length; i < n; i+=3) {\n    var newchars = (\n      (bytes.charCodeAt(i)   << 020) +\n      (bytes.charCodeAt(i+1) << 010) +\n      (bytes.charCodeAt(i+2)));\n    out_array.push(\n      alphabet[(newchars >> 18) & 077],\n      alphabet[(newchars >> 12) & 077],\n      alphabet[(newchars >> 6)  & 077], \n      alphabet[(newchars)       & 077]);      \n  };\n  shorten(out_array, padding.length);\n  return out_array.join('');\n};\nthis.decode = function (b64text) {\n  b64text = b64text.replace(/\\s/g, '') // kill whitespace\n  // strip trailing pad characters from input; // XXX maybe some better way?\n  var i = b64text.length; while (b64text[--i] === pad) {}; b64text = b64text.slice(0, i + 1);\n  assertOrBadInput(!alphabet_inverse.test(b64text),\n                   'Input contains out-of-range characters.');\n  var padding = Array(5 - ((b64text.length % 4) || 4)).join(alphabet[alphabet.length - 1]);\n  b64text += padding; // pad with last letter of alphabet\n  var out_array = [];\n  for (var i=0, n=b64text.length; i < n; i+=4) {\n    newchars = (\n      (decode_map[b64text[i]]   << 18) +\n      (decode_map[b64text[i+1]] << 12) +\n      (decode_map[b64text[i+2]] << 6)  +\n      (decode_map[b64text[i+3]]));\n    out_array.push(\n      (newchars >> 020) & 0xFF,\n      (newchars >> 010) & 0xFF, \n      (newchars)        & 0xFF);\n  };\n  shorten(out_array, padding.length);\n  return String.fromCharCode.apply(String, out_array);\n};\n}).call(typeof(exports) != 'undefined' ? exports : (function() { window.base64 = {}; return base64; })())"},
'jsio.interfaces': {"url": "jsio/interfaces.js", "src": "// Sort of like a twisted protocol\nrequire('jsio', ['Class'])\n\nexports.Protocol = Class(function() {\n    this.connectionMade = function(isReconnect) {\n    }\n\n    this.dataReceived = function(data) {\n    }\n\n    this.connectionLost = function(reason) {\n    }\n    \n    this.connectionFailed = function() {\n\n    }\n\n});\n\n// Sort of like a twisted factory\nexports.Server = Class(function() {\n    this.init = function(protocolClass) {\n        this._protocolClass = protocolClass;\n    }\n\n    this.buildProtocol = function() {\n        return new this._protocolClass();\n    }\n    \n});\n\nexports.Transport = Class(function() {\n    this.write = function(data, encoding) {\n        throw new Error(\"Not implemented\");\n    }\n    this.getPeer = function() {\n        throw new Error(\"Not implemented\");\n    }\n});\n\nexports.Listener = Class(function() {\n\tthis.init = function(server, opts) {\n\t\tthis._server = server;\n\t\tthis._opts = opts || {};\n\t}\n\t\n\tthis.onConnect = function(transport) {\n\t\tvar p = this._server.buildProtocol();\n\t\tp.transport = transport;\n        p.server = this._server;\n\t\ttransport.protocol = p;\n\t\ttransport.makeConnection(p);\n\t\tp.connectionMade();\n\t}\n\t\n\tthis.listen = function() { throw new Error('Abstract class'); }\n\tthis.stop = function() {}\n});\n\nexports.Connector = Class(function() {\n\tthis.init = function(protocol, opts) {\n\t\tthis._protocol = protocol;\n\t\tthis._opts = opts;\n\t}\n\t\n\tthis.onConnect = function(transport) {\n\t\ttransport.makeConnection(this._protocol);\n\t\tthis._protocol.transport = transport;\n\t\tthis._protocol.connectionMade();\n\t}\n\t\n\tthis.getProtocol = function() { return this._protocol; }\n});\n\nexports.PubSub = Class(function() {\n\tthis.publish = function(signal) {\n\t\tif(!this._subscribers) { return; }\n\t\t\n\t\tvar args = Array.prototype.slice.call(arguments, 1);\n\t\tif(this._subscribers.__any) {\n\t\t\tvar anyArgs = [signal].concat(args);\n\t\t\tfor(var i = 0, sub; sub = this._subscribers.__any[i]; ++i) {\n\t\t\t\tsub.apply(window, args);\n\t\t\t}\n\t\t}\n\t\t\n\t\tif(!this._subscribers[signal]) { return; }\t\t\n\t\tfor(var i = 0, sub; sub = this._subscribers[signal][i]; ++i) {\n\t\t\tsub.apply(window, args);\n\t\t}\n\t}\n\t\n\tthis.subscribe = function(signal) {\n\t\tif(!this._subscribers) { this._subscribers = {}; }\n\t\tif(!this._subscribers[signal]) { this._subscribers[signal] = []; }\n\t\tthis._subscribers[signal].push(bind.apply(jsio, Array.prototype.slice.call(arguments, 1)));\n\t}\n});"},
'jsio.csp.client': {"url": "jsio/csp/client.js", "src": ";(function(global) {\n\nvar BACKOFF = 50;\n\nif (!global.csp) {\n    // For jsonp callbacks\n    global.csp = {}\n}\nvar csp = this;\nif (typeof(require) != 'undefined' && require.__jsio) {\n    require('..base64');\n    require('..utf8')\n}\nvar id = 0;\ncsp.readyState = {\n    'initial': 0,\n    'opening': 1,\n    'open':    2,\n    'closing': 3,\n    'closed':  4\n};\ncsp.util = {};\nconsole.log('csp is', csp);\n// Add useful url parsing library to socket.util\n(function() {\n// parseUri 1.2.2\n// (c) Steven Levithan <stevenlevithan.com>\n// MIT License\nfunction parseUri (str) {\n    var o   = parseUri.options,\n        m   = o.parser[o.strictMode ? \"strict\" : \"loose\"].exec(str),\n        uri = {},\n        i   = 14;\n    while (i--) uri[o.key[i]] = m[i] || \"\";\n    uri[o.q.name] = {};\n    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {\n        if ($1) uri[o.q.name][$1] = $2;\n    });\n    return uri;\n};\nparseUri.options = {\n    strictMode: false,\n    key: [\"source\",\"protocol\",\"authority\",\"userInfo\",\"user\",\"password\",\"host\",\"port\",\"relative\",\"path\",\"directory\",\"file\",\"query\",\"anchor\"],\n    q:   {\n        name:   \"queryKey\",\n        parser: /(?:^|&)([^&=]*)=?([^&]*)/g\n    },\n    parser: {\n        strict: /^(?:([^:\\/?#]+):)?(?:\\/\\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\\/?#]*)(?::(\\d*))?))?((((?:[^?#\\/]*\\/)*)([^?#]*))(?:\\?([^#]*))?(?:#(.*))?)/,\n        loose:  /^(?:(?![^:@]+:[^:@\\/]*@)([^:\\/?#.]+):)?(?:\\/\\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\\/?#]*)(?::(\\d*))?)(((\\/(?:[^?#](?![^?#\\/]*\\.[^?#\\/.]+(?:[?#]|$)))*\\/?)?([^?#\\/]*))(?:\\?([^#]*))?(?:#(.*))?)/\n    }\n};\ncsp.util.parseUri = parseUri;\n})();\n\ncsp.util.isSameDomain = function(urlA, urlB) {\n    var a = csp.util.parseUri(urlA);\n    var b = csp.util.parseUri(urlB);\n    return ((urlA.port == urlB.port ) && (urlA.host == urlB.host) && (urlA.protocol = urlB.protocol))\n}\n\ncsp.util.chooseTransport = function(url, options) {\n//    console.log(location.toString())\n    var test = location.toString().match('file://');\n    if (test && test.index === 0) {\n//      console.log('local file, use jsonp')\n      return transports.jsonp // XXX      \n    }\n//    console.log('choosing');\n    if (csp.util.isSameDomain(url, location.toString())) {\n//        console.log('same domain, xhr');\n        return transports.xhr;\n    }\n//    console.log('not xhr');\n    try {\n        if (window.XMLHttpRequest && (new XMLHttpRequest()).withCredentials !== undefined) {\n//            console.log('xhr')\n            return transports.xhr;\n        }\n    } catch(e) { }\n//    console.log('jsonp');\n    return transports.jsonp\n}\n\n\nvar PARAMS = {\n    'xhrstream':   {\"is\": \"1\", \"bs\": \"\\n\"},\n    'xhrpoll':     {\"du\": \"0\"},\n    'xhrlongpoll': {},\n    'sselongpoll': {\"bp\": \"data: \", \"bs\": \"\\r\\n\", \"se\": \"1\"},\n    'ssestream':   {\"bp\": \"data: \", \"bs\": \"\\r\\n\", \"se\": \"1\", \"is\": \"1\"}\n};\n\ncsp.CometSession = function() {\n    var self = this;\n    self.id = ++id;\n    self.url = null;\n    self.readyState = csp.readyState.initial;\n    self.sessionKey = null;\n    var transport = null;\n    var options = null;\n    var buffer = \"\";\n    self.write = function() { throw new Error(\"invalid readyState\"); }\n    self.onopen = function() {\n\t//               console.log('onopen', self.sessionKey);\n    }\n\n    self.onclose = function(code) {\n\t//        console.log('onclose', code);\n    }\n\n    self.onread = function(data) {\n\t//        console.log('onread', data);\n    }\n\n    self.setEncoding = function(encoding) {\n        switch(encoding) {\n            case 'plain':\n                if (buffer) {\n                    self.onread(buffer);\n                    buffer = \"\";\n                }\n                break;\n            case 'utf8':\n                break\n            default:\n                throw new Error(\"Invalid encoding\")\n        }\n        options.encoding = encoding;\n    }\n\n    // XXX: transport_onread and self.write both need to use an incremental\n    //      utf8 codec.\n\n    var transport_onread = function(data) {\n        if (options.encoding == 'utf8') {\n            self.onread(utf8.decode(data));\n        }\n        else if (options.encoding == 'plain') {\n            self.onread(data);\n        }\n    }\n\n    self.write = function(data) {\n        switch(options.encoding) {\n            case 'plain':\n                transport.send(data);\n                break;\n            case 'utf8':\n                transport.send(utf8.encode(data));\n                break;\n        }\n    }\n\n    self.connect = function(url, _options) {\n        options = _options || {};\n        if (!options.encoding) { options.encoding = 'utf8' }\n        var timeout = options.timeout || 10000;\n        self.readyState = csp.readyState.opening;\n        self.url = url;\n\n        transport = new (csp.util.chooseTransport(url, options))(self.id, url, options);\n        var handshakeTimer = window.setTimeout(self.close, timeout);\n        transport.onHandshake = function(data) {\n            self.readyState = csp.readyState.open;\n            self.sessionKey = data.session;\n            transport.onPacket = transport_onread;\n            transport.resume(self.sessionKey, 0, 0);\n            clearTimeout(handshakeTimer);\n            self.onopen();\n        }\n        transport.handshake();\n    }\n    self.close = function() {\n        transport.close();\n        self.readyState = csp.readyState.closed;\n        self.onclose();\n    }\n}\n\nvar Transport = function(cspId, url) {\n//    console.log('url', url);\n    var self = this;\n    self.opened = false;\n    self.cspId = cspId;\n    self.url = url;\n    self.buffer = \"\";\n    self.packetsInFlight = null;\n    self.sending = false;\n    self.sessionKey = null;\n    self.lastEventId = null;\n    \n    this.handshake = function() {\n        self.opened = true;\n    }\n    self.processPackets = function(packets) {\n        for (var i = 0; i < packets.length; i++) {\n            var p = packets[i];\n            if (p === null)\n                return self.doClose();\n            var ackId = p[0];\n            var encoding = p[1];\n            var data = p[2];\n            if (self.lastEventId != null && ackId <= self.lastEventId)\n                continue;\n            if (self.lastEventId != null && ackId != self.lastEventId+1)\n                throw new Error(\"CSP Transport Protocol Error\");\n            self.lastEventId = ackId;\n            if (encoding == 1) { // base64 encoding\n                try {\n                    data = base64.decode(data);\n                } catch(e) {\n                    self.close()\n                    return;\n                }\n            }\n            self.onPacket(data);\n        }\n    }\n    self.resume = function(sessionKey, lastEventId, lastSentId) {\n        self.sessionKey = sessionKey;\n        self.lastEventId = lastEventId;\n        self.lastSentId = lastSentId;\n        self.reconnect();\n    }\n    self.send = function(data) {\n        self.buffer += data;\n        if (!self.packetsInFlight) {\n            self.doSend();\n        }\n    }\n    self.doSend = function() {\n        throw new Error(\"Not Implemented\");\n    }\n    self.close = function() {\n        self.stop();\n    }\n    self.stop = function() {\n        self.opened = false;\n        clearTimeout(cometTimer);\n        clearTimeout(sendTimer);\n        clearTimeout(handshakeTimer);\n    }\n    var cometBackoff = BACKOFF; // msg\n    var backoff = BACKOFF;\n    var handshakeTimer = null;\n    var sendTimer = null;\n    var cometTimer = null;\n    self.handshakeCb = function(data) {\n        if (self.opened) {\n            self.onHandshake(data);\n            backoff = BACKOFF;\n        }\n    }\n    self.handshakeErr = function() {\n        if (Math.round(Math.log(backoff) / Math.log(BACKOFF)) == 7) {\n            return self.close()\n        }\n        if (self.opened) {\n            handshakeTimer = setTimeout(self.handshake, backoff);\n            backoff *= 2;\n        }\n    }\n    self.sendCb = function() {\n        self.packetsInFlight = null;\n        backoff = BACKOFF;\n        if (self.opened) {\n            if (self.buffer) {\n                self.doSend();\n            }\n        }\n    }\n    self.sendErr = function() {\n        if (Math.round(Math.log(backoff) / Math.log(BACKOFF)) == 7) {\n            return self.close()\n        }\n        if (self.opened) {\n            sendTimer = setTimeout(self.doSend, backoff);\n            backoff *= BACKOFF;\n        }\n    }\n    self.cometCb = function(data) {\n        if (self.opened) {\n            self.processPackets(data);\n            self.reconnect();\n        }\n    }\n    self.cometErr = function() {\n        if (Math.round(Math.log(cometBackoff) / Math.log(BACKOFF)) == 7) {\n            return self.close()\n        }\n        if (self.opened) {\n            cometTimer = setTimeout(self.reconnect, cometBackoff);\n            cometBackoff *= 2;\n        }\n    }\n}\n\nvar transports = {};\n\ntransports.xhr = function(cspId, url) {\n    var self = this;\n    Transport.call(self, cspId, url);\n    var makeXhr = function() {\n        if (window.XDomainRequest) {\n            return new XDomainRequest();\n        }\n        // TODO: use XDomainRequest where available.\n        return new XMLHttpRequest();\n    }\n    var sendXhr = makeXhr();\n    var cometXhr = makeXhr();\n    if (!csp.util.isSameDomain(url, location.toString())) {\n        if (!window.XDomainRequest)\n        if (sendXhr.withCredentials === undefined) {\n            throw new Error(\"Invalid cross-domain transport\");\n        }\n    }\n\n    var makeRequest = function(type, url, args, cb, eb, timeout) {\n        var xhr;\n        if (type == 'send') { xhr = sendXhr; }\n        if (type == 'comet') { xhr = cometXhr; }\n        url += '?'\n        for (key in args) {\n            if (key != 'd')\n                url += key + '=' + args[key] + '&';\n        }\n        var payload = \"\";\n        if (args.d) {\n            payload = args.d;\n        }\n        xhr.open('POST', self.url + url, true);\n        xhr.setRequestHeader('Content-Type', 'text/plain')\n        var aborted = false;\n        var timer = null;\n//        console.log('setting on ready state change');\n        xhr.onreadystatechange = function() {\n//            console.log('ready state', xhr.readyState)\n            try {\n//              console.log('status', xhr.status)\n            } catch (e) {}\n            if (aborted) { \n                //console.log('aborted'); \n                return eb(); \n            }\n            if (xhr.readyState == 4) {\n                try {\n                    if (xhr.status == 200) {\n                        clearTimeout(timer);\n                        // XXX: maybe the spec shouldn't wrap ALL responses in ( ).\n                        //      -mcarter 8/11/09\n                        var data = JSON.parse(xhr.responseText.substring(1, xhr.responseText.length-1));\n\t\t\t\t\t}\n\t\t\t\t} catch(e) {}\n\t\t\t\t\n\t\t\t\tif(data) {\n\t\t\t        try {\n\t                    // try-catch the callback since we parsed the response\n\t                    cb(data);\n\t                } catch(e) {\n\t\t\t\t\t\t// use a timeout to get proper tracebacks\n\t\t\t\t\t\tsetTimeout(function() {\n\t\t\t\t\t\t\t//\t\tconsole.log(e);\n\t\t\t\t\t\t\tthrow e;\n\t\t\t\t\t\t}, 0);\n\t                }\n\t\t\t\t\treturn;\n\t\t\t\t}\n\n                try {\n//                    console.log('xhr.responseText', xhr.responseText);\n                } catch(e) { \n                    //console.log('ex'); \n                }\n                return eb();\n            }\n        }\n        if (timeout) {\n            timer = setTimeout(function() { aborted = true; xhr.abort(); }, timeout*1000);\n        }\n//        console.log('send xhr', payload);\n        xhr.send(payload)\n\n    }\n\n    this.handshake = function() {\n        self.opened = true;\n        makeRequest(\"send\", \"/handshake\", { d:\"{}\" }, self.handshakeCb, self.handshakeErr, 10);\n    }\n    this.doSend = function() {\n        var args;\n        if (!self.packetsInFlight) {\n            self.packetsInFlight = self.toPayload(self.buffer)\n            self.buffer = \"\";\n        }\n        args = { s: self.sessionKey, d: self.packetsInFlight };\n        makeRequest(\"send\", \"/send\", args, self.sendCb, self.sendErr, 10);\n    }\n    this.reconnect = function() {\n        var args = { s: self.sessionKey, a: self.lastEventId }\n        makeRequest(\"comet\", \"/comet\", args, self.cometCb, self.cometErr, 40);\n    }\n    this.toPayload = function(data) {\n        // TODO: only base64 encode sometimes.\n        var payload = JSON.stringify([[++self.lastSentId, 1, base64.encode(data)]]);\n        return payload\n    }\n}\nconsole.log('csp is', csp);\nconsole.log('global.csp is', global.csp);\nif (!global.csp) {\n    console.log('obliterate csp', global.csp);\n    global.csp = {}\n}\nglobal.csp._jsonp = {}\nvar _jsonpId = 0;\nfunction setJsonpCallbacks(cb, eb) {\n    global.csp._jsonp['cb' + (++_jsonpId)] = cb;\n    global.csp._jsonp['eb' + (_jsonpId)] = eb;\n    return _jsonpId;\n}\nfunction removeJsonpCallback(id) {\n    delete global.csp._jsonp['cb' + id];\n    delete global.csp._jsonp['eb' + id];\n}\nfunction getJsonpErrbackPath(id) {\n    return 'parent.csp._jsonp.eb' + id;\n}\nfunction getJsonpCallbackPath(id) {\n    return 'parent.csp._jsonp.cb' + id;\n}\n\ntransports.jsonp = function(cspId, url) {\n    var self = this;\n    Transport.call(self, cspId, url);\n    var createIframe = function() {\n        var i = document.createElement(\"iframe\");\n        i.style.display = 'block';\n        i.style.width = '0';\n        i.style.height = '0';\n        i.style.border = '0';\n        i.style.margin = '0';\n        i.style.padding = '0';\n        i.style.overflow = 'hidden';\n        i.style.visibility = 'hidden';\n        return i;\n    }\n    var ifr = {\n        'bar':   createIframe(),\n        'send':  createIframe(),\n        'comet': createIframe()\n    };\n\n    var killLoadingBar = function() {\n        window.setTimeout(function() {\n            document.body.appendChild(ifr.bar);\n            document.body.removeChild(ifr.bar);\n        }, 0);\n    }\n    var rId = 0;\n    var makeRequest = function(rType, url, args, cb, eb, timeout) {\n        args.n = Math.random();\n        window.setTimeout(function() {\n            var temp = ifr[rType];\n            // IE6+ uses contentWindow.document, the others use temp.contentDocument.\n            var doc = temp.contentDocument || temp.contentWindow.document || temp.document;\n            var head = doc.getElementsByTagName('head')[0] || doc.getElementsByTagName('body')[0];\n            var errorSuppressed = false;\n            function errback(isIe) {\n                if (!isIe) {\n                    var scripts = doc.getElementsByTagName('script');\n                    var s1 = doc.getElementsByTagName('script')[0]; \n                    var s2 = doc.getElementsByTagName('script')[1]; \n                    s1.parentNode.removeChild(s1);\n                    s2.parentNode.removeChild(s2);\n                }\n                removeJsonpCallback(jsonpId);\n                if (!errorSuppressed && self.opened) {\n                    eb.apply(null, arguments);\n                }\n            }\n            function callback() {\n                errorSuppressed = true;\n                if (self.opened) {\n                    cb.apply(null, arguments);\n                }\n                else {\n//                    console.log('suppressing callback', rType, url, args, cb, eb, timeout);\n                }\n            }\n            var jsonpId = setJsonpCallbacks(callback, errback);\n            url += '?'\n            for (key in args) {\n                url += key + '=' + args[key] + '&';\n            }\n            if (rType == \"send\") {\n                url += 'rs=;&rp=' + getJsonpCallbackPath(jsonpId);\n            }\n            else if (rType == \"comet\") {\n                url += 'bs=;&bp=' + getJsonpCallbackPath(jsonpId);\n            }\n            var s = doc.createElement(\"script\");\n            s.src = self.url + url;\n            head.appendChild(s);\n\n            if (s.onreadystatechange === null) { // IE\n                // TODO: I suspect that if IE gets half of an HTTP body when\n                //       the connection resets, it will go ahead and execute\n                //       the script tag as if all were well, and then fail\n                //       silently without a loaded event. For this reason\n                //       we should probably also set a timer of DURATION + 10\n                //       or something to catch timeouts eventually.\n                //      -Mcarter 8/11/09\n                s.onreadystatechange = function() {\n                    if (s.readyState == \"loaded\") {\n                        errback(true);\n                    }\n                }\n            }\n            else {\n                var s = doc.createElement(\"script\");\n                s.innerHTML = getJsonpErrbackPath(jsonpId) + '(false);'\n                head.appendChild(s);\n                killLoadingBar();\n            }\n        }, 0);\n\n    }\n\n    this.handshake = function() {\n        self.opened = true;\n        // This setTimeout is necessary to avoid timing issues with the iframe onload status\n        setTimeout(function() {\n            makeRequest(\"send\", \"/handshake\", {d: \"{}\"}, self.handshakeCb, self.handshakeErr, 10)\n        }, 0);\n    }\n    this.doSend = function() {\n        var args;\n        if (!self.packetsInFlight) {\n            self.packetsInFlight = self.toPayload(self.buffer)\n            self.buffer = \"\";\n        }\n        args = { s: self.sessionKey, d: self.packetsInFlight };\n        makeRequest(\"send\", \"/send\", args, self.sendCb, self.sendErr, 10);\n    }\n    this.reconnect = function() {\n        var args = { s: self.sessionKey, a: self.lastEventId }\n        makeRequest(\"comet\", \"/comet\", args, self.cometCb, self.cometErr, 40);\n    }\n    this.toPayload = function(data) {\n        // TODO: don't always base64?\n        var payload = JSON.stringify([[++self.lastSentId, 1, base64.encode(data)]]);\n        return payload\n    }\n    document.body.appendChild(ifr.send);\n    document.body.appendChild(ifr.comet);\n    killLoadingBar();\n}\n}).call(typeof(exports) != 'undefined' ? exports : (function() { window.csp = {}; return csp; })(), typeof(global) == 'undefined' ? window : global)\n"},
'jsio.protocols.rtjp': {"url": "jsio/protocols/rtjp.js", "src": "require('jsio', ['Class', 'bind']);\nrequire('jsio.interfaces');\nrequire('jsio.logging')\nrequire('jsio.protocols.delimited', ['DelimitedProtocol'])\n\nvar logger = jsio.logging.getLogger('RTJPProtocol')\nexports.RTJPProtocol = Class(DelimitedProtocol, function(supr) {\n    this.init = function() {\n        supr(this, 'init', ['\\n']);\n        this.frameId = 0;\n    }\n\n    this.connectionMade = function() {\n        logger.debug(\"connectionMade\");\n    }\n    \n    var error = function(e) {\n        // TODO: send back an error?\n    }\n    \n    // Inherit and overwrite\n    this.frameReceived = function(id, name, args) {\n    }\n\n    // Public\n    this.sendFrame = function(name, args) {\n        if (!args) {\n            args = {}\n        }\n        logger.debug('sendFrame', name, args);\n        this.transport.write(JSON.stringify([++this.frameId, name, args]) + '\\r\\n');\n    }\n\n    this.lineReceived = function(line) {\n//        logger.debug(\"lineReceived\", line);\n        try {\n            var frame = JSON.parse(line);\n            if (frame.length != 3) {\n                return error.call(this, \"Invalid frame length\");\n            }\n            if (typeof(frame[0]) != \"number\") {\n                return error.call(this, \"Invalid frame id\");\n            }\n            if (typeof(frame[1]) != \"string\") {\n                return error.call(this, \"Invalid frame name\");\n            }\n            if (typeof(frame[2]) != \"object\") {\n                return error.call(this, \"Invalid frame args\");\n            }\n            logger.debug(\"frameReceived:\", frame[0], frame[1], frame[2]);\n            this.frameReceived(frame[0], frame[1], frame[2]);\n        } catch(e) {\n            error.call(this, e);\n        }\n    }\n\n    this.connectionLost = function() {\n        log('conn lost');\n    }\n});\n\n\n\n"},
'hookbox': {"url": "hookbox.js", "src": "require('jsio', ['bind', 'Class'])\nrequire('jsio', {'connect': 'jsioConnect'})\nrequire('jsio.protocols.rtjp', ['RTJPProtocol'])\nrequire('jsio.logging');\nvar logger = jsio.logging.getLogger('hookbox');\n\nexports.logging = jsio.logging\n\nexports.connect = function(url) {\n    var p = new HookBoxProtocol();\n    jsioConnect(p, 'csp', {url: url})\n    return p;\n}\n\nvar Subscription = Class(function(supr) {\n    this.init = function(destination) {\n    }\n\n    this.onCancel = function() { }\n\n    this.onFrame = function(frame) { }\n    this.onSetup = function(frame) { }\n\n    this.getDestination = function() {\n        return this.channel;\n    }\n\n    this.cancel = function() {\n\n    }\n\n})\n\nHookBoxProtocol = Class([RTJPProtocol], function(supr) {\n    // Public api\n    this.onopen = function() { }\n    this.onclose = function() { }\n    this.onerror = function() { }\n\n    this.init = function(url) {\n        supr(this, 'init', []);\n        this.url = url;\n        this.connected = false;\n        this._subscriptions = {}\n        this._publishes = []\n    }\n\n    this.subscribe = function(dest) {\n        var s = new Subscription();\n        console.log('s is', s);\n        var subscribers;\n        s.onCancel = bind(function() {\n            var i = subscribers.indexOf(s);\n            subscribers.splice(i, 1);\n            if (!subscribers.length) {\n                delete this._subscriptions[dest];\n            }\n            delete s.onCancel;\n        })\n        if (subscribers = this._subscriptions[dest]) {\n            subscribers.push(s);\n        } else {\n            subscribers = [ s ];\n            this._subscriptions[dest] = subscribers;\n            if (this.connected) {\n                this.sendFrame('SUBSCRIBE', {destination: dest});\n            }\n        }\n        return s;   \n    }\n\n    this.publish = function(destination, data) {\n        if (this.connected) {\n            this.sendFrame('PUBLISH', { destination: destination, payload: JSON.stringify(data) });\n        } else {\n            this._publishes.push([destination, data]);\n        }\n        \n    }\n\n    this.connectionMade = function() {\n        logger.debug('connectionMade');\n        this.sendFrame('CONNECT', { cookie: document.cookie });\n    }\n\n    this.frameReceived = function(fId, fName, fArgs) {\n        logger.debug('frameReceived', fId, fName, fArgs);\n        switch(fName) {\n            case 'CONNECTED':\n                this.connected = true;\n                for (key in this._subscriptions) {\n                    this.sendFrame('SUBSCRIBE', {destination: key});\n                }\n                while (this._publishes.length) {\n                    var pub = this._publishes.splice(0, 1)[0];\n                    this.publish.apply(this, pub);\n                }\n                this.onopen();\n                break;\n            case 'PUBLISH':\n                var subscribers;\n                if (subscribers = this._subscriptions[fArgs.destination]) {\n                    for (var i = 0, subscriber; subscriber = subscribers[i]; ++i) {\n                        try {\n                            subscriber.onFrame(fArgs);\n                        } catch(e) {\n                            setTimeout(function() { throw e; }, 0);\n                        }\n                    }\n                }\n                break;\n            case 'ERROR':\n                this.onerror(fArgs);\n                break;\n        }\n    }\n    this.connectionLost = function() {\n        logger.debug('connectionLost');\n        this.connected = false;\n        this.onclose();\n    }\n    // TODO: we need another var besides this.connnected, as that becomes true\n    //       only after we get a CONNECTED frame. Maybe our transport is \n    //       connected, but we haven't gotten the frame yet. For now, no one\n    //       should be calling this anyway until they get an onclose.\n    this.reconnect = function() {\n        jsioConnect(this, this.url);\n    }\n    \n})\n\n\n"},
'jsio.utf8': {"url": "jsio/utf8.js", "src": "/*\nJavaScript UTF-8 encoder/decoder, by Jacob Rus.\n\nInspired by the observation by Johan Sundstr\u00f6m published at:\nhttp://ecmanaut.blogspot.com/2006/07/encoding-decoding-utf8-in-javascript.html\n\nNote that this code throws an error for invalid UTF-8. Because it is so much\nfaster than other kinds of implementations, the recommended way to do lenient\nparsing is to first try this decoder, and then fall back on a slower lenient\ndecoder if necessary for the particular use case.\n\n--------------------\n\nCopyright (c) 2009 Jacob Rus\n\nPermission is hereby granted, free of charge, to any person\nobtaining a copy of this software and associated documentation\nfiles (the \"Software\"), to deal in the Software without\nrestriction, including without limitation the rights to use,\ncopy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the\nSoftware is furnished to do so, subject to the following\nconditions:\n\nThe above copyright notice and this permission notice shall be\nincluded in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND,\nEXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES\nOF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND\nNONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT\nHOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,\nWHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING\nFROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR\nOTHER DEALINGS IN THE SOFTWARE.\n*/\n(function() {\nvar UnicodeCodecError = this.UnicodeCodecError = function (message) { this.message = message; };\nthis.UnicodeCodecError.prototype.toString = function () {\n  return 'UnicodeCodecError' + (this.message ? ': ' + this.message : '');\n};\nthis.encode = function (unicode_string) {\n  // Unicode encoder: Given an arbitrary unicode string, returns a string\n  // of characters with code points in range 0x00 - 0xFF corresponding to\n  // the bytes of the utf-8 representation of those characters.\n  try {\n    return unescape(encodeURIComponent(unicode_string));\n  }\n  catch (err) {\n    throw new UnicodeCodecError('invalid input string');\n  };\n};\nthis.decode = function (bytes) {\n  // Unicode decoder: Given a string of characters with code points in\n  // range 0x00 - 0xFF, which, when interpreted as bytes, are valid UTF-8,\n  // returns the unicode string for those characters.\n  if (/[^\\x00-\\xFF]/.test(bytes)) {\n    throw new UnicodeCodecError('invalid utf-8 bytes');\n  };\n  try {\n    return decodeURIComponent(escape(bytes));\n  }\n  catch (err) {\n    throw new UnicodeCodecError('invalid utf-8 bytes');\n  };\n};\n}).call(typeof(exports) != 'undefined' ? exports : (function() { window.utf8 = {}; return utf8; })())"}
    };

    var pre_require = [
        // Insert pre-require dependancies here
    ];

	if(typeof exports == 'undefined') {
		exports = {};
		window.jsio = exports;
	}
	
	exports.getEnvironment = function() {
		if (typeof(node) !== 'undefined' && node.version) {
			return 'node';
		}
		return 'browser';
	};

	exports.bind = function(context, method/*, arg1, arg2, ... */){
		var args = Array.prototype.slice.call(arguments, 2);
		return function(){
			method = (typeof method == 'string' ? context[method] : method);
			return method.apply(context, args.concat(Array.prototype.slice.call(arguments, 0)))
		}
	};
	
	var bind = exports.bind;
	
	exports.Class = function(parent, proto) {
		if(!parent) { throw new Error('parent or prototype not provided'); }
		if(!proto) { proto = parent; }
		else if(parent instanceof Array) { // multiple inheritance, use at your own risk =)
			proto.prototype = {};
			for(var i = 0, p; p = parent[i]; ++i) {
				for(var item in p.prototype) {
					if(!(item in proto.prototype)) {
						proto.prototype[item] = p.prototype[item];
					}
				}
			}
			parent = parent[0]; 
		} else { 
			proto.prototype = parent.prototype;
		}
		
		var cls = function() { if(this.init) { this.init.apply(this, arguments); }}
		cls.prototype = new proto(function(context, method, args) {
			var args = args || [];
			var target = parent;
			while(target = target.prototype) {
				if(target[method]) {
					return target[method].apply(context, args);
				}
			}
			throw new Error('method ' + method + ' does not exist');
		});
		cls.prototype.constructor = cls;
		return cls;
	}
	var modulePathCache = {}
	var getModulePathPossibilities = function(pathString) {
		var segments = pathString.split('.')
		var modPath = pathString.split('.').join('/');
		var isModule = modPath[modPath.length-1] == '/';
		var out;
		if (segments[0] in modulePathCache) {
			out = [[modulePathCache[segments[0]] + '/' + segments.join('/') + (isModule ? '__init__.js' : '.js'), null]]
		}
		else {
			out = [];
			for (var i = 0, path; path = exports.path[i]; ++i) {
				out.push([path + '/' + modPath + (isModule ? '__init__.js' : '.js'), path])
			}
		}
		return out;
	}
	
	exports.path = ['.']
	switch(exports.getEnvironment()) {
		case 'node':
			exports.log = function() {
			for (var i = 0, item; item=arguments[i]; ++i) {
				if (typeof(item) == 'object') {
					arguments[i] = JSON.stringify(arguments[i]);
				}
			}
				node.stdio.writeError([].slice.call(arguments, 0).join(' ') + "\n");
			}
			console = {log: exports.log};
			window = process;
			var compile = function(context, args) {
				var fn = node.compile("function(_){with(_){delete _;(function(){" + args.src + "\n})()}}", args.url);
				fn.call(context.exports, context);
			}

			var windowCompile = function(context, args) {
				var fn = node.compile("function(_){with(_){with(_.window){delete _;(function(){" + args.src + "\n})()}}}", args.url);
				fn.call(context.exports, context);
			}
			
			var windowCompile = function(context, args) {
				var fn = node.compile("function(_){with(_){with(_.window){delete _;(function(){" + args.src + "\n})()}}}", args.url);
				fn.call(context.exports, context);
			}
			
			var cwd = node.cwd();
			var makeRelative = function(path) {
				var i = path.match('^' + cwd);
				if (i && i[0] == cwd) {
					var offset = path[cwd.length] == '/' ? 1 : 0
					return path.slice(cwd.length + offset);
				}
				return path;
			}
			var getModuleSourceAndPath = function(pathString) {
				var baseMod = pathString.split('.')[0];
				var urls = getModulePathPossibilities(pathString);
				var cwd = node.cwd() + '/';
				for (var i = 0, url; url = urls[i]; ++i) {
					var cachePath = url[1];
					var url = url[0];
					try {
						var out = {src: node.fs.cat(url, "utf8").wait(), url: url};
						if (!(baseMod in modulePathCache)) {
							modulePathCache[baseMod] = cachePath;
						}
						return out;
					} catch(e) {}
				}
				throw new Error("Module not found: " + pathString);
			}
			var segments = __filename.split('/');

			var jsioPath = segments.slice(0,segments.length-2).join('/');
			if (jsioPath) {
				exports.path.push(jsioPath)
				modulePathCache.jsio = jsioPath;
			}
			else {
				modulePathCache.jsio = '.';
			}
			break;
		default:
			exports.log = function() {
				if (typeof console != 'undefined' && console.log) {
					console.log.apply(console, arguments);
				}
			}
			
			var compile = function(context, args) {
				var code = "var fn = function(_){with(_){delete _;(function(){" + args.src + "\n}).call(this)}}\n//@ sourceURL=" + args.url;
				eval(code);
				fn.call(context.exports, context);
			}

			var windowCompile = function(context, args) {
				var f = "var fn = function(_){with(_){with(_.window){delete _;(function(){" + args.src + "\n}).call(this)}}}\n//@ sourceURL=" + args.url;
				eval(f);
				fn.call(context.exports, context);
			}
			
			var windowCompile = function(context, args) {
				var f = "var fn = function(_){with(_){with(_.window){delete _;(function(){" + args.src + "\n}).call(this)}}}\n//@ sourceURL=" + args.url;
				eval(f);
				fn.call(context.exports, context);
			}
			
			var makeRelative = function(path) {
				return path;
			}
			
			var getModuleSourceAndPath = function(pathString) {
                if (preloaded_source[pathString]) {
                    return preloaded_source[pathString];
                }
				var baseMod = pathString.split('.')[0];
				var urls = getModulePathPossibilities(pathString);
				for (var i = 0, url; url = urls[i]; ++i) {
					var cachePath = url[1];
					var url = url[0];
					var xhr = new XMLHttpRequest()
					var failed = false;
					try {
						var xhr = new XMLHttpRequest()
						xhr.open('GET', url, false);
						xhr.send(null);
					} catch(e) {
						failed = true;
					}
					if (failed || // firefox file://
						xhr.status == 404 || // all browsers, http://
						xhr.status == -1100 || // safari file://
						// XXX: We have no way to tell in opera if a file exists and is empty, or is 404
						// XXX: Use flash?
						//(!failed && xhr.status == 0 && !xhr.responseText && EXISTS)) // opera
						false)
					{
						continue;
					}
					if (!(baseMod in modulePathCache)) {
						modulePathCache[baseMod] = cachePath;
					}
					return {src: xhr.responseText, url: url};
				}
				throw new Error("Module not found: " + pathString);
			}
			try {
				var scripts = document.getElementsByTagName('script');
				for (var i = 0, script; script = scripts[i]; ++i) {
					if (script.src.match('jsio/jsio.js$')) {
						var segments = script.src.split('/')
						var jsioPath = segments.slice(0,segments.length-2).join('/');
						exports.path.push(jsioPath);
						modulePathCache.jsio = jsioPath;
						break;
					}
				}
			} catch(e) {}
			break;
	}
	exports.basePath = exports.path[exports.path.length-1];
	var modules = {jsio: exports};
	var _require = function(external, context, path, pkg, what) {
		var origPkg = pkg;
		if(pkg.charAt(0) == '.') {
			pkg = pkg.slice(1);
			// resolve relative paths
			var segments = path.split('.');
			while(pkg.charAt(0) == '.') {
				pkg = pkg.slice(1);
				segments.pop();
			}
			var prefix = segments.join('.');
			if (prefix) {
				pkg = segments.join('.') + '.' + pkg;
			}
		}

		var segments = pkg.split('.');
		if(!(pkg in modules)) {
			var result = getModuleSourceAndPath(pkg);
			var newRelativePath = segments.slice(0, segments.length - 1).join('.');
			var newContext = {};
			if(!external) {
				newContext.exports = {};
				newContext.global = window;
				newContext.require = bind(this, _require, false, newContext, newRelativePath);
				newContext.require.__jsio = true;
				// TODO: FIX for "trailing ." case
				var tmp = result.url.split('/')
				newContext.require.__dir = makeRelative(tmp.slice(0,tmp.length-1).join('/'));
				newContext.require.__path = makeRelative(result.url);
				newContext.external = bind(this, _require, true, newContext, newRelativePath);
				newContext.jsio = {require: newContext.require, external: newContext.external};
				compile(newContext, result);
				modules[pkg] = newContext.exports;
			} else {
				newContext['window'] = {};
				if(what instanceof Array) {
					for(var i = 0, key; key = what[i]; ++i) {
						newContext['window'][key] = null;
					}
				} else if(what instanceof Object) {
					for(var key in what) {
						newContext['window'][key] = null;
					}
				} else {
					newContext['window'][what] = null;
				}
				windowCompile(newContext, result);
				modules[pkg] = newContext.window;
			}
		}

		if(what == '*') {
			for(var i in modules[pkg]) {
				context[i] = modules[pkg][i];
			}
		} else if(!what) {
			var segments = origPkg.split('.');
			// Remove trailing dot
			while (segments[segments.length-1] == "") {
				segments.pop()
			}
			var c = context;
			var len = segments.length - 1;
			for(var i = 0, segment; (segment = segments[i]) && i < len; ++i) {
				if(!segment) continue;
				if (!c[segment]) {
					c[segment] = {};
				}
				c = c[segment]
			}
			c[segments[len]] = modules[pkg];
			
		} else if(typeof what == 'string') {
			context[what] = modules[pkg][what];
		} else if(what.constructor == Object) {
			for(var item in what) {
				context[what[item]] = modules[pkg][item];
			}
		} else {
			for(var i = 0, item; item = what[i]; ++i) {
				context[item] = modules[pkg][item];
			}
		}
	}
	
	// create the external require function bound to the current context
	exports.require = bind(this, _require, false, window, '');
	exports.external = bind(this, _require, true, window, '');
	
	// create the internal require function bound to a local context
	var _localContext = {jsio: {}};
	var jsio = _localContext.jsio;
	var require = bind(this, _require, false, _localContext, '');
	
	require('jsio.env.');
	exports.listen = function(server, transportName, opts) {
		var listener = new (jsio.env.getListener(transportName))(server, opts);
		listener.listen();
		return listener;
	}
	
	exports.connect = function(protocolInstance, transportName, opts) {
		var connector = new (jsio.env.getConnector(transportName))(protocolInstance, opts);
		connector.connect();
		return connector;
	}
	exports.quickServer = function(protocolClass) {
		require('jsio.interfaces');
		return new jsio.interfaces.Server(protocolClass);
	}

    for (var i =0, target; target=pre_require[i]; ++i) {
        exports.require(target);    
    }
    

})();





/*
	http://www.JSON.org/json2.js
	2009-08-17

	Public Domain.

	NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

	See http://www.JSON.org/js.html

	This file creates a global JSON object containing two methods: stringify
	and parse.

		JSON.stringify(value, replacer, space)
			value		any JavaScript value, usually an object or array.

			replacer	an optional parameter that determines how object
						values are stringified for objects. It can be a
						function or an array of strings.

			space		an optional parameter that specifies the indentation
						of nested structures. If it is omitted, the text will
						be packed without extra whitespace. If it is a number,
						it will specify the number of spaces to indent at each
						level. If it is a string (such as '\t' or '&nbsp;'),
						it contains the characters used to indent at each level.

			This method produces a JSON text from a JavaScript value.

			When an object value is found, if the object contains a toJSON
			method, its toJSON method will be called and the result will be
			stringified. A toJSON method does not serialize: it returns the
			value represented by the name/value pair that should be serialized,
			or undefined if nothing should be serialized. The toJSON method
			will be passed the key associated with the value, and this will be
			bound to the value

			For example, this would serialize Dates as ISO strings.

				Date.prototype.toJSON = function (key) {
					function f(n) {
						// Format integers to have at least two digits.
						return n < 10 ? '0' + n : n;
					}

					return this.getUTCFullYear()   + '-' +
						 f(this.getUTCMonth() + 1) + '-' +
						 f(this.getUTCDate())	   + 'T' +
						 f(this.getUTCHours())	   + ':' +
						 f(this.getUTCMinutes())   + ':' +
						 f(this.getUTCSeconds())   + 'Z';
				};

			You can provide an optional replacer method. It will be passed the
			key and value of each member, with this bound to the containing
			object. The value that is returned from your method will be
			serialized. If your method returns undefined, then the member will
			be excluded from the serialization.

			If the replacer parameter is an array of strings, then it will be
			used to select the members to be serialized. It filters the results
			such that only members with keys listed in the replacer array are
			stringified.

			Values that do not have JSON representations, such as undefined or
			functions, will not be serialized. Such values in objects will be
			dropped; in arrays they will be replaced with null. You can use
			a replacer function to replace those with JSON values.
			JSON.stringify(undefined) returns undefined.

			The optional space parameter produces a stringification of the
			value that is filled with line breaks and indentation to make it
			easier to read.

			If the space parameter is a non-empty string, then that string will
			be used for indentation. If the space parameter is a number, then
			the indentation will be that many spaces.

			Example:

			text = JSON.stringify(['e', {pluribus: 'unum'}]);
			// text is '["e",{"pluribus":"unum"}]'


			text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
			// text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

			text = JSON.stringify([new Date()], function (key, value) {
				return this[key] instanceof Date ?
					'Date(' + this[key] + ')' : value;
			});
			// text is '["Date(---current time---)"]'


		JSON.parse(text, reviver)
			This method parses a JSON text to produce an object or array.
			It can throw a SyntaxError exception.

			The optional reviver parameter is a function that can filter and
			transform the results. It receives each of the keys and values,
			and its return value is used instead of the original value.
			If it returns what it received, then the structure is not modified.
			If it returns undefined then the member is deleted.

			Example:

			// Parse the text. Values that look like ISO date strings will
			// be converted to Date objects.

			myData = JSON.parse(text, function (key, value) {
				var a;
				if (typeof value === 'string') {
					a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
					if (a) {
						return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
							+a[5], +a[6]));
					}
				}
				return value;
			});

			myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
				var d;
				if (typeof value === 'string' &&
						value.slice(0, 5) === 'Date(' &&
						value.slice(-1) === ')') {
					d = new Date(value.slice(5, -1));
					if (d) {
						return d;
					}
				}
				return value;
			});


	This is a reference implementation. You are free to copy, modify, or
	redistribute.

	This code should be minified before deployment.
	See http://javascript.crockford.com/jsmin.html

	USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
	NOT CONTROL.
*/

/*jslint evil: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
	call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
	getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
	lastIndex, length, parse, prototype, push, replace, slice, stringify,
	test, toJSON, toString, valueOf
*/

"use strict";

// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
	this.JSON = {};
}

(function () {

	function f(n) {
		// Format integers to have at least two digits.
		return n < 10 ? '0' + n : n;
	}

	if (typeof Date.prototype.toJSON !== 'function') {

		Date.prototype.toJSON = function (key) {

			return isFinite(this.valueOf()) ?
				   this.getUTCFullYear()   + '-' +
				 f(this.getUTCMonth() + 1) + '-' +
				 f(this.getUTCDate())	   + 'T' +
				 f(this.getUTCHours())	   + ':' +
				 f(this.getUTCMinutes())   + ':' +
				 f(this.getUTCSeconds())   + 'Z' : null;
		};

		String.prototype.toJSON =
		Number.prototype.toJSON =
		Boolean.prototype.toJSON = function (key) {
			return this.valueOf();
		};
	}

	var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		gap,
		indent,
		meta = {	// table of character substitutions
			'\b': '\\b',
			'\t': '\\t',
			'\n': '\\n',
			'\f': '\\f',
			'\r': '\\r',
			'"' : '\\"',
			'\\': '\\\\'
		},
		rep;


	function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

		escapable.lastIndex = 0;
		return escapable.test(string) ?
			'"' + string.replace(escapable, function (a) {
				var c = meta[a];
				return typeof c === 'string' ? c :
					'\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
			}) + '"' :
			'"' + string + '"';
	}


	function str(key, holder) {

// Produce a string from holder[key].

		var i,			// The loop counter.
			k,			// The member key.
			v,			// The member value.
			length,
			mind = gap,
			partial,
			value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

		if (value && typeof value === 'object' &&
				typeof value.toJSON === 'function') {
			value = value.toJSON(key);
		}

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

		if (typeof rep === 'function') {
			value = rep.call(holder, key, value);
		}

// What happens next depends on the value's type.

		switch (typeof value) {
		case 'string':
			return quote(value);

		case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

			return isFinite(value) ? String(value) : 'null';

		case 'boolean':
		case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

			return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

		case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

			if (!value) {
				return 'null';
			}

// Make an array to hold the partial results of stringifying this object value.

			gap += indent;
			partial = [];

// Is the value an array?

			if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

				length = value.length;
				for (i = 0; i < length; i += 1) {
					partial[i] = str(i, value) || 'null';
				}

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

				v = partial.length === 0 ? '[]' :
					gap ? '[\n' + gap +
							partial.join(',\n' + gap) + '\n' +
								mind + ']' :
						  '[' + partial.join(',') + ']';
				gap = mind;
				return v;
			}

// If the replacer is an array, use it to select the members to be stringified.

			if (rep && typeof rep === 'object') {
				length = rep.length;
				for (i = 0; i < length; i += 1) {
					k = rep[i];
					if (typeof k === 'string') {
						v = str(k, value);
						if (v) {
							partial.push(quote(k) + (gap ? ': ' : ':') + v);
						}
					}
				}
			} else {

// Otherwise, iterate through all of the keys in the object.

				for (k in value) {
					if (Object.hasOwnProperty.call(value, k)) {
						v = str(k, value);
						if (v) {
							partial.push(quote(k) + (gap ? ': ' : ':') + v);
						}
					}
				}
			}

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

			v = partial.length === 0 ? '{}' :
				gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
						mind + '}' : '{' + partial.join(',') + '}';
			gap = mind;
			return v;
		}
	}

// If the JSON object does not yet have a stringify method, give it one.

	if (typeof JSON.stringify !== 'function') {
		JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

			var i;
			gap = '';
			indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

			if (typeof space === 'number') {
				for (i = 0; i < space; i += 1) {
					indent += ' ';
				}

// If the space parameter is a string, it will be used as the indent string.

			} else if (typeof space === 'string') {
				indent = space;
			}

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

			rep = replacer;
			if (replacer && typeof replacer !== 'function' &&
					(typeof replacer !== 'object' ||
					 typeof replacer.length !== 'number')) {
				throw new Error('JSON.stringify');
			}

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

			return str('', {'': value});
		};
	}


// If the JSON object does not yet have a parse method, give it one.

	if (typeof JSON.parse !== 'function') {
		JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

			var j;

			function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

				var k, v, value = holder[key];
				if (value && typeof value === 'object') {
					for (k in value) {
						if (Object.hasOwnProperty.call(value, k)) {
							v = walk(value, k);
							if (v !== undefined) {
								value[k] = v;
							} else {
								delete value[k];
							}
						}
					}
				}
				return reviver.call(holder, key, value);
			}


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

			cx.lastIndex = 0;
			if (cx.test(text)) {
				text = text.replace(cx, function (a) {
					return '\\u' +
						('0000' + a.charCodeAt(0).toString(16)).slice(-4);
				});
			}

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

			if (/^[\],:{}\s]*$/.
test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

				j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

				return typeof reviver === 'function' ?
					walk({'': j}, '') : j;
			}

// If the text is not JSON parseable, then a SyntaxError is thrown.

			throw new SyntaxError('JSON.parse');
		};
	}
}());


jsio.require("hookbox");
delete jsio;
