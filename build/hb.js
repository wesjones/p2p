/*
* Hummingbird v.0.8.20
* Obogo - MIT 2015
* https://github.com/obogo/hummingbird/
*/
(function(exports, global) {
    global["hb"] = exports;
    var $$ = exports.$$ || function(name) {
        if (!$$[name]) {
            $$[name] = {};
        }
        return $$[name];
    };
    var cache = $$("c");
    var internals = $$("i");
    var pending = $$("p");
    exports.$$ = $$;
    var toArray = function(args) {
        return Array.prototype.slice.call(args);
    };
    var _ = function(name) {
        var args = toArray(arguments);
        var val = args[1];
        if (typeof val === "function") {
            this.c[name] = val();
        } else {
            cache[name] = args[2];
            cache[name].$inject = val;
            cache[name].$internal = this.i;
        }
    };
    var define = function() {
        _.apply({
            i: false,
            c: exports
        }, toArray(arguments));
    };
    var internal = function() {
        _.apply({
            i: true,
            c: internals
        }, toArray(arguments));
    };
    var resolve = function(name, fn) {
        pending[name] = true;
        var injections = fn.$inject;
        var args = [];
        var injectionName;
        for (var i in injections) {
            if (injections.hasOwnProperty(i)) {
                injectionName = injections[i];
                if (cache[injectionName]) {
                    if (pending.hasOwnProperty(injectionName)) {
                        throw new Error('Cyclical reference: "' + name + '" referencing "' + injectionName + '"');
                    }
                    resolve(injectionName, cache[injectionName]);
                    delete cache[injectionName];
                }
            }
        }
        if (!exports[name] && !internals[name]) {
            for (var n in injections) {
                injectionName = injections[n];
                args.push(exports.hasOwnProperty(injectionName) && exports[injectionName] || internals.hasOwnProperty(injectionName) && internals[injectionName]);
            }
            if (fn.$internal) {
                internals[name] = fn.apply(null, args) || name;
            } else {
                exports[name] = fn.apply(null, args) || name;
            }
        }
        Object.defineProperty(exports, "$$", {
            enumerable: false,
            writable: false
        });
        delete pending[name];
    };
    //! node_modules/hbjs/src/utils/ajax/http.js
    define("http", [ "extend" ], function(extend) {
        var serialize = function(obj) {
            var str = [];
            for (var p in obj) if (obj.hasOwnProperty(p)) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
            return str.join("&");
        };
        var win = window, CORSxhr = function() {
            var xhr;
            if (win.XMLHttpRequest && "withCredentials" in new win.XMLHttpRequest()) {
                xhr = win.XMLHttpRequest;
            } else if (win.XDomainRequest) {
                xhr = win.XDomainRequest;
            }
            return xhr;
        }(), methods = [ "head", "get", "post", "put", "delete" ], i, methodsLength = methods.length, result = {};
        function Request(options) {
            this.init(options);
        }
        function getRequestResult(that) {
            var headers = parseResponseHeaders(this.getAllResponseHeaders());
            var response = this.responseText.trim();
            var start;
            var end;
            if (response) {
                start = response[0];
                end = response[response.length - 1];
            }
            if (response && (start === "{" && end === "}") || start === "[" && end === "]") {
                response = response ? JSON.parse(response.replace(/\/\*.*?\*\//g, "")) : response;
            }
            return {
                data: response,
                request: {
                    method: that.method,
                    url: that.url,
                    data: that.data,
                    headers: that.headers
                },
                headers: headers,
                status: this.status
            };
        }
        Request.prototype.init = function(options) {
            var that = this;
            that.xhr = new CORSxhr();
            that.method = options.method;
            that.url = options.url;
            that.success = options.success;
            that.error = options.error;
            that.data = options.data;
            that.headers = options.headers;
            if (options.credentials === true) {
                that.xhr.withCredentials = true;
            }
            that.send();
            return that;
        };
        Request.prototype.send = function() {
            var that = this;
            if (that.method === "GET" && that.data) {
                var concat = that.url.indexOf("?") > -1 ? "&" : "?";
                that.url += concat + serialize(that.data);
            } else {
                that.data = JSON.stringify(that.data);
            }
            if (that.success !== undefined) {
                that.xhr.onload = function() {
                    var result = getRequestResult.call(this, that), self = this;
                    function onLoad() {
                        if (self.status >= 200 && self.status < 400) {
                            that.success.call(self, result);
                        } else if (that.error !== undefined) {
                            that.error.call(self, result);
                        }
                    }
                    if (this.onloadInterceptor) {
                        this.onloadInterceptor(onLoad, result);
                    } else {
                        onLoad();
                    }
                };
            }
            if (that.error !== undefined) {
                that.xhr.error = function() {
                    var result = getRequestResult.call(this, that);
                    that.error.call(this, result);
                };
            }
            that.xhr.open(that.method, that.url, true);
            if (that.headers !== undefined) {
                that.setHeaders();
            }
            that.xhr.send(that.data, true);
            return that;
        };
        Request.prototype.setHeaders = function() {
            var that = this, headers = that.headers, key;
            for (key in headers) {
                if (headers.hasOwnProperty(key)) {
                    that.xhr.setRequestHeader(key, headers[key]);
                }
            }
            return that;
        };
        function parseResponseHeaders(str) {
            var list = str.split("\n");
            var headers = {};
            var parts;
            var i = 0, len = list.length;
            while (i < len) {
                parts = list[i].split(": ");
                if (parts[0] && parts[1]) {
                    parts[0] = parts[0].split("-").join("").split("");
                    parts[0][0] = parts[0][0].toLowerCase();
                    headers[parts[0].join("")] = parts[1];
                }
                i += 1;
            }
            return headers;
        }
        function addDefaults(options, defaults) {
            return extend(options, defaults);
        }
        function handleInterceptor(options) {
            return !!(result.intercept && result.intercept(options, Request));
        }
        for (i = 0; i < methodsLength; i += 1) {
            (function() {
                var method = methods[i];
                result[method] = function(url, success, error) {
                    var options = {};
                    if (url === undefined) {
                        throw new Error("CORS: url must be defined");
                    }
                    if (typeof url === "object") {
                        options = url;
                    } else {
                        if (typeof success === "function") {
                            options.success = success;
                        }
                        if (typeof error === "function") {
                            options.error = error;
                        }
                        options.url = url;
                    }
                    options.method = method.toUpperCase();
                    addDefaults(options, result.defaults);
                    if (handleInterceptor(options)) {
                        return;
                    }
                    return new Request(options).xhr;
                };
            })();
        }
        result.intercept = null;
        result.defaults = {
            headers: {}
        };
        return result;
    });
    //! node_modules/hbjs/src/utils/data/extend.js
    define("extend", [ "toArray" ], function(toArray) {
        var extend = function(target, source) {
            var args = toArray(arguments), i = 1, len = args.length, item, j;
            var options = this || {}, copy;
            if (!target && source && typeof source === "object") {
                target = {};
            }
            while (i < len) {
                item = args[i];
                for (j in item) {
                    if (item.hasOwnProperty(j)) {
                        if (j === "length" && target instanceof Array) {} else if (target[j] && typeof target[j] === "object" && !item[j] instanceof Array) {
                            target[j] = extend.apply(options, [ target[j], item[j] ]);
                        } else if (item[j] instanceof Array) {
                            copy = options && options.concat ? (target[j] || []).concat(item[j]) : item[j];
                            if (options && options.arrayAsObject) {
                                if (!target[j]) {
                                    target[j] = {
                                        length: copy.length
                                    };
                                }
                                if (target[j] instanceof Array) {
                                    target[j] = extend.apply(options, [ {}, target[j] ]);
                                }
                            } else {
                                target[j] = target[j] || [];
                            }
                            if (copy.length) {
                                target[j] = extend.apply(options, [ target[j], copy ]);
                            }
                        } else if (item[j] && typeof item[j] === "object") {
                            if (options.objectAsArray && typeof item[j].length === "number") {
                                if (!(target[j] instanceof Array)) {
                                    target[j] = extend.apply(options, [ [], target[j] ]);
                                }
                            }
                            target[j] = extend.apply(options, [ target[j] || {}, item[j] ]);
                        } else if (options.override !== false || target[j] === undefined) {
                            target[j] = item[j];
                        }
                    }
                }
                i += 1;
            }
            return target;
        };
        return extend;
    });
    //! node_modules/hbjs/src/utils/formatters/toArray.js
    define("toArray", [ "isArguments", "isArray", "isUndefined" ], function(isArguments, isArray, isUndefined) {
        var toArray = function(value) {
            if (isArguments(value)) {
                return Array.prototype.slice.call(value, 0) || [];
            }
            try {
                if (isArray(value)) {
                    return value;
                }
                if (!isUndefined(value)) {
                    return [].concat(value);
                }
            } catch (e) {}
            return [];
        };
        return toArray;
    });
    //! node_modules/hbjs/src/utils/validators/isArguments.js
    define("isArguments", [ "toString" ], function(toString) {
        var isArguments = function(value) {
            var str = String(value);
            var isArguments = str === "[object Arguments]";
            if (!isArguments) {
                isArguments = str !== "[object Array]" && value !== null && typeof value === "object" && typeof value.length === "number" && value.length >= 0 && (!value.callee || toString.call(value.callee) === "[object Function]");
            }
            return isArguments;
        };
        return isArguments;
    });
    //! node_modules/hbjs/src/utils/validators/isArray.js
    define("isArray", function() {
        Array.prototype.__isArray = true;
        Object.defineProperty(Array.prototype, "__isArray", {
            enumerable: false,
            writable: true
        });
        var isArray = function(val) {
            return val ? !!val.__isArray : false;
        };
        return isArray;
    });
    //! node_modules/hbjs/src/utils/validators/isUndefined.js
    define("isUndefined", function() {
        var isUndefined = function(val) {
            return typeof val === "undefined";
        };
        return isUndefined;
    });
    for (var name in cache) {
        resolve(name, cache[name]);
    }
})(this["hb"] || {}, function() {
    return this;
}());