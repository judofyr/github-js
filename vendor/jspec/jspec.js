
// JSpec - Core - Copyright TJ Holowaychuk <tj@vision-media.ca> (MIT Licensed)

(function(){

  JSpec = {

    version  : '1.1.5',
    file     : '',
    suites   : [],
    matchers : {},
    stats    : { specs : 0, assertions : 0, failures : 0, passes : 0 },
    options  : { profile : false },

    /**
     * Default context in which bodies are evaluated.
     * This allows specs and hooks to use the 'this' keyword in
     * order to store variables, as well as allowing the context
     * to provide helper methods or properties.
     *
     * Replace context simply by setting JSpec.context
     * to your own like below:
     *
     * JSpec.context = { foo : 'bar' }
     *
     * Contexts can be changed within any body, this can be useful
     * in order to provide specific helper methods to specific suites.
     *
     * To reset (usually in after hook) simply set to null like below:
     *
     * JSpec.context = null
     *
     */

    defaultContext : {
      sandbox : function(name) {
        sandbox = document.createElement('div')
        sandbox.setAttribute('class', 'jspec-sandbox')
        document.body.appendChild(sandbox)
        return sandbox
      }
    },

    // --- Objects
    
    formatters : {

      /**
       * Default formatter, outputting to the DOM.
       *
       * Options:
       *   - reportToId    id of element to output reports to, defaults to 'jspec'
       *   - failuresOnly  displays only suites with failing specs
       *
       * @api public
       */

      DOM : function(results, options) {
        id = option('reportToId') || 'jspec'
        report = document.getElementById(id)
        failuresOnly = option('failuresOnly')
        classes = results.stats.failures ? 'has-failures' : ''
        if (!report) error('requires the element #' + id + ' to output its reports')

        markup =
        '<div id="jspec-report" class="' + classes + '"><div class="heading">           \
        <span class="passes">Passes: <em>' + results.stats.passes + '</em></span>       \
        <span class="failures">Failures: <em>' + results.stats.failures + '</em></span> \
        </div><table class="suites">'
          
        renderSuite = function(suite) {
          displaySuite = failuresOnly ? suite.ran && !suite.passed() : suite.ran
          if (displaySuite && suite.hasSpecs()) {
            markup += '<tr class="description"><td colspan="2">' + suite.description + '</td></tr>'
            each(suite.specs, function(i, spec){
              markup += '<tr class="' + (i % 2 ? 'odd' : 'even') + '">'
              if (spec.requiresImplementation())
                markup += '<td class="requires-implementation" colspan="2">' + spec.description + '</td>'
              else if (spec.passed() && !failuresOnly)
                markup += '<td class="pass">' + spec.description+ '</td><td>' + spec.assertionsGraph() + '</td>'
              else if(!spec.passed())
                markup += '<td class="fail">' + spec.description + ' <em>' + spec.failure().message + '</em>' + '</td><td>' + spec.assertionsGraph() + '</td>'
              markup += '<tr class="body" style="display: none;"><td colspan="2">' + spec.body + '</td></tr>'
            })
            markup += '</tr>'
          }
        }  
        
        renderSuites = function(suites) {
          each(suites, function(suite){
            renderSuite(suite)
            if (suite.hasSuites()) renderSuites(suite.suites)
          })
        }
        
        renderSuites(results.suites)

        markup += '</table></div>'

        report.innerHTML = markup
      },
      
      /**
       * Terminal formatter.
       *
       * @api public
       */
       
       Terminal : function(results, options) {
         failuresOnly = option('failuresOnly')
         puts(color("\n Passes: ", 'bold') + color(results.stats.passes, 'green') + 
              color(" Failures: ", 'bold') + color(results.stats.failures, 'red') + "\n")
              
         indent = function(string) {
           return string.replace(/^(.)/gm, '  $1')
         }

         renderSuite = function(suite) {
           displaySuite = failuresOnly ? suite.ran && !suite.passed() : suite.ran
           if (displaySuite && suite.hasSpecs()) {
             puts(color(' ' + suite.description, 'bold'))
             results.each(suite.specs, function(spec){
               assertionsGraph = inject(spec.assertions, '', function(graph, assertion){
                 return graph + color('.', assertion.passed ? 'green' : 'red')
               })
               if (spec.requiresImplementation())
                 puts(color('  ' + spec.description, 'blue') + assertionsGraph)
               else if (spec.passed() && !failuresOnly)
                 puts(color('  ' + spec.description, 'green') + assertionsGraph)
               else 
                 puts(color('  ' + spec.description, 'red') + assertionsGraph + 
                      "\n" + indent(spec.failure().message) + "\n")
             })
             puts('')
           }          
         }

         renderSuites = function(suites) {
           each(suites, function(suite){
             renderSuite(suite)
             if (suite.hasSuites()) renderSuites(suite.suites)
           })
         }

         renderSuites(results.suites)
       },

      /**
       * Console formatter, tested with Firebug and Safari 4.
       *
       * @api public
       */

      Console : function(results, options) {
        console.log('')
        console.log('Passes: ' + results.stats.passes + ' Failures: ' + results.stats.failures)
        
        renderSuite = function(suite) {
          if (suite.ran) {
            console.group(suite.description)
            results.each(suite.specs, function(spec){
              assertionCount = spec.assertions.length + ':'
              if (spec.requiresImplementation())
                console.warn(spec.description)
              else if (spec.passed())
                console.log(assertionCount + ' ' + spec.description)
              else 
                console.error(assertionCount + ' ' + spec.description + ', ' + spec.failure().message)
            })
            console.groupEnd()
          }          
        }
        
        renderSuites = function(suites) {
          each(suites, function(suite){
            renderSuite(suite)
            if (suite.hasSuites()) renderSuites(suite.suites)
          })
        }
        
        renderSuites(results.suites)
      }
    },
    
    Assertion : function(matcher, actual, expected, negate) {
      extend(this, {
        message : '',
        passed : false,
        actual : actual,
        negate : negate,
        matcher : matcher,
        expected : expected,
        record : function(result) {
          result ? JSpec.stats.passes++ : JSpec.stats.failures++
        },
        
        exec : function() {
          // TODO: remove unshifting of expected
          expected.unshift(actual == null ? null : actual.valueOf())
          result = matcher.match.apply(JSpec, expected)
          this.passed = negate ? !result : result
          this.record(this.passed)
          if (!this.passed) this.message = matcher.message(actual, expected, negate, matcher.name)
          return this
        }
      })
    },
    
    /**
     * Specification Suite block object.
     *
     * @param {string} description
     * @param {function} body
     * @api private
     */

    Suite : function(description, body) {
      extend(this, {
        body: body,
        description: description,
        suites: [],
        specs: [],
        ran: false,
        hooks: { 'before' : [], 'after' : [], 'before_each' : [], 'after_each' : [] },
        
        // Add a spec to the suite

        it : function(description, body) {
          spec = new JSpec.Spec(description, body)
          this.specs.push(spec)
          spec.suite = this
        },

        // Add a hook to the suite

        addHook : function(hook, body) {
          this.hooks[hook].push(body)
        },

        // Add a nested suite

        describe : function(description, body) {
          suite = new JSpec.Suite(description, body)
          suite.description = this.description + ' ' + suite.description
          this.suites.push(suite)
          suite.suite = this
        },

        // Invoke a hook in context to this suite

        hook : function(hook) {
          if (this.suite) this.suite.hook(hook)
          each(this.hooks[hook], function(body) {
            JSpec.evalBody(body, "Error in hook '" + hook + "', suite '" + this.description + "': ")
          })
        },

        // Check if nested suites are present

        hasSuites : function() {
          return this.suites.length  
        },

        // Check if this suite has specs

        hasSpecs : function() {
          return this.specs.length
        },

        // Check if the entire suite passed

        passed : function() {
          var passed = true
          each(this.specs, function(spec){
            if (!spec.passed()) passed = false
          })
          return passed
        }
      })
    },
    
    /**
     * Specification block object.
     *
     * @param {string} description
     * @param {function} body
     * @api private
     */

    Spec : function(description, body) {
      extend(this, {
        body : body,
        description : description,
        assertions : [],
        
        // Find first failing assertion

        failure : function() {
          return inject(this.assertions, null, function(failure, assertion){
            return !assertion.passed && !failure ? assertion : failure
          })
        },

        // Find all failing assertions

        failures : function() {
          return inject(this.assertions, [], function(failures, assertion){
            if (!assertion.passed) failures.push(assertion)
            return failures
          })
        },

        // Weither or not the spec passed

        passed : function() {
          return !this.failure()
        },

        // Weither or not the spec requires implementation (no assertions)

        requiresImplementation : function() {
          return this.assertions.length == 0
        },

        // Sprite based assertions graph

        assertionsGraph : function() {
          return map(this.assertions, function(assertion){
            return '<span class="assertion ' + (assertion.passed ? 'passed' : 'failed') + '"></span>'
          }).join('')
        }
      })
    },

    // --- Methods
    
    /**
     * Return ANSI-escaped colored string.
     *
     * @param  {string} string
     * @param  {string} color
     * @return {string}
     * @api public
     */
    
    color : function(string, color) {
      return "\u001B[" + {
       bold    : 1,
       black   : 30,
       red     : 31,
       green   : 32,
       yellow  : 33,
       blue    : 34,
       magenta : 35,
       cyan    : 36,
       white   : 37,
      }[color] + 'm' + string + "\u001B[0m"
    },
    
    /**
     * Default matcher message callback.
     *
     * @api private
     */
    
    defaultMatcherMessage : function(actual, expected, negate, name) {
      return 'expected ' + print(actual) + ' to ' + 
               (negate ? 'not ' : '') + 
                  name.replace(/_/g, ' ') +
                    ' ' + print.apply(this, expected.slice(1))
    },
    
    /**
     * Normalize a matcher message.
     *
     * When no messge callback is present the defaultMatcherMessage
     * will be assigned, will suffice for most matchers.
     *
     * @param  {hash} matcher
     * @return {hash}
     * @api public
     */
    
    normalizeMatcherMessage : function(matcher) {
      if (typeof matcher.message != 'function') 
        matcher.message = this.defaultMatcherMessage
      return matcher
    },
    
    /**
     * Normalize a matcher body
     * 
     * This process allows the following conversions until
     * the matcher is in its final normalized hash state.
     *
     * - '==' becomes 'actual == expected'
     * - 'actual == expected' becomes 'return actual == expected'
     * - function(actual, expected) { return actual == expected } becomes 
     *   { match : function(actual, expected) { return actual == expected }}
     *
     * @param  {mixed} body
     * @return {hash}
     * @api public
     */
    
    normalizeMatcherBody : function(body) {
      switch (body.constructor) {
        case String:
          if (captures = body.match(/^alias (\w+)/)) return JSpec.matchers[last(captures)]
          if (body.length < 4) body = 'actual ' + body + ' expected'
          return { match : function(actual, expected) { return eval(body) }}  
          
        case Function:
          return { match : body }
          
        default:
          return body
      }
    },
    
    /**
     * Get option value. This method first checks if
     * the option key has been set via the query string,
     * otherwise returning the options hash value.
     *
     * @param  {string} key
     * @return {mixed}
     * @api public
     */
     
     option : function(key) {
       return (value = query(key)) !== null ? value :
                JSpec.options[key] || null
     },

    /**
     * Generates a hash of the object passed.
     *
     * @param  {object} object
     * @return {string}
     * @api private
     */

    hash : function(object) {
      serialize = function(prefix) {
        return inject(object, prefix + ':', function(buffer, key, value){
          return buffer += hash(value)
        })
      }
      switch (object.constructor) {
        case Array:  return serialize('a')
        case Object: return serialize('o')
        case RegExp: return 'r:' + object.toString()
        case Number: return 'n:' + object.toString()
        case String: return 's:' + object.toString()
        default: return object.toString()
      }
    },

    /**
     * Return last element of an array.
     *
     * @param  {array} array
     * @return {object}
     * @api public
     */

    last : function(array) {
      return array[array.length - 1]
    },

    /**
     * Convert object(s) to a print-friend string.
     *
     * @param  {object, ...} object
     * @return {string}
     * @api public
     */

    print : function(object) {
      if (arguments.length > 1) {
        list = []
        for (i = 0; i < arguments.length; i++) list.push(print(arguments[i]))
        return list.join(', ')
      }
      if (object === undefined) return ''
      if (object === null) return 'null'
      if (object === true) return 'true'
      if (object === false) return 'false'
      if (object.jquery && object.selector.length > 0) return 'selector ' + print(object.selector) + ''
      if (object.jquery) return escape(object.html())
      if (object.nodeName) return escape(object.outerHTML)
      switch (object.constructor) {
        case String: return "'" + escape(object) + "'"
        case Number: return object
        case Array :
          buff = '['
          each(object, function(v){ buff += ', ' + print(v) })
          return buff.replace('[,', '[') + ' ]'
        case Object:
          buff = '{'
          each(object, function(k, v){ buff += ', ' + print(k) + ' : ' + print(v)})
          return buff.replace('{,', '{') + ' }'
        default: 
          return escape(object.toString())
      }
    },

    /**
     * Escape HTML.
     *
     * @param  {string} html
     * @return {string}
     * @api public
     */

     escape : function(html) {
       if (typeof html != 'string') return html
       return html.
         replace(/&/gmi, '&amp;').
         replace(/"/gmi, '&quot;').
         replace(/>/gmi, '&gt;').
         replace(/</gmi, '&lt;')
     },

    /**
     * Invoke a matcher.
     *
     * this.match('test', 'should', 'be_a', [String])
     *
     * @param  {object} actual
     * @param  {bool, string} negate
     * @param  {string} name
     * @param  {array} expected
     * @return {bool}
     * @api private
     */

    match : function(actual, negate, name, expected) {
      if (typeof negate == 'string') negate = negate == 'should' ? false : true
      assertion = new JSpec.Assertion(this.matchers[name], actual, expected, negate)
      this.currentSpec.assertions.push(assertion.exec())
      return assertion.passed
    },

    /**
     * Iterate an object, invoking the given callback.
     *
     * @param  {hash, array, string} object
     * @param  {function} callback
     * @return {JSpec}
     * @api public
     */

    each : function(object, callback) {
      if (typeof object == 'string') object = object.split(' ')
      for (key in object) {
        if (object.hasOwnProperty(key))
          callback.length == 1 ?
            callback.call(JSpec, object[key]):
              callback.call(JSpec, key, object[key])
      }
      return JSpec
    },

    /**
     * Iterate with memo.
     *
     * @param  {hash, array} object
     * @param  {object} initial
     * @param  {function} callback
     * @return {object}
     * @api public
     */

    inject : function(object, initial, callback) {
      each(object, function(key, value){
        initial = callback.length == 2 ?
          callback.call(JSpec, initial, value):
            callback.call(JSpec, initial, key, value) || initial
      })
      return initial
    },
    
    /**
     * Strim whitespace or chars.
     *
     * @param  {string} string
     * @param  {string} chars
     * @return {string}
     * @api public
     */

     strip : function(string, chars) {
       return string.
         replace(new RegExp('['  + (chars || '\\s') + ']*$'), '').
         replace(new RegExp('^[' + (chars || '\\s') + ']*'),  '')
     },
     
     /**
      * Extend an object with another.
      *
      * @param  {object} object
      * @param  {object} other
      * @api public
      */
     
     extend : function(object, other) {
      each(other, function(property, value){
        object[property] = value
      })
     },
    
    /**
     * Map callback return values.
     *
     * @param  {hash, array} object
     * @param  {function} callback
     * @return {array}
     * @api public
     */

    map : function(object, callback) {
      return inject(object, [], function(memo, key, value){
        memo.push(callback.length == 1 ?
          callback.call(JSpec, value):
            callback.call(JSpec, key, value))
      })
    },
    
    /**
     * Returns true if the callback returns true at least once.
     *
     * @param  {hash, array} object
     * @param  {function} callback
     * @return {bool}
     * @api public
     */
         
    any : function(object, callback) {
      return inject(object, false, function(state, key, value){
        if (state) return true
        return callback.length == 1 ?
          callback.call(JSpec, value):
            callback.call(JSpec, key, value)
      })
    },

    /**
     * Define matchers.
     *
     * @param  {hash} matchers
     * @return {JSpec}
     * @api public
     */

    addMatchers : function(matchers) {
      each(matchers, function(name, body){
        this.addMatcher(name, body)  
      })
      return this
    },
    
    /**
     * Define a matcher.
     *
     * @param  {string} name
     * @param  {hash, function, string} body
     * @return {JSpec}
     * @api public
     */
    
    addMatcher : function(name, body) {
      this.matchers[name] = this.normalizeMatcherMessage(this.normalizeMatcherBody(body))
      this.matchers[name].name = name
      return this
    },
    
    /**
     * Add a root suite to JSpec.
     *
     * @param  {string} description
     * @param  {body} function
     * @return {JSpec}
     * @api public
     */
    
    describe : function(description, body) {
      this.suites.push(new JSpec.Suite(description, body))
      return this
    },

    /**
     * Evaluate a JSpec capture body.
     *
     * @param  {function} body
     * @param  {string} errorMessage (optional)
     * @return {Type}
     * @api private
     */

    evalBody : function(body, errorMessage) {
      try { body.call(this.context || this.defaultContext) }
      catch(e) { error(errorMessage, e) }
    },

    /**
     * Pre-process a string of JSpec.
     *
     * @param  {string} input
     * @return {string}
     * @api private
     */

    preprocess : function(input) {
      return input.
        replace(/describe (.*?)$/m, 'JSpec.describe($1, function(){').
        replace(/describe (.*?)$/gm, 'this.describe($1, function(){').
        replace(/\bit (.*?)$/gm, 'this.it($1, function(){').
        replace(/^(?: *)(before_each|after_each|before|after)(?= |\n|$)/gm, 'this.addHook("$1", function(){').
        replace(/end(?= |\n|$)/gm, '});').
        replace(/-\{/g, 'function(){').
        replace(/(\d+)\.\.(\d+)/g, function(_, a, b){ return range(a, b) }).
        replace(/([\s\(]+)\./gm, '$1this.').
        replace(/\.should([_\.]not)?[_\.](\w+)(?: |$)(.*)$/gm, '.should$1_$2($3)').
        replace(/([\/ ]*)(.+?)\.(should(?:[_\.]not)?)[_\.](\w+)\((.*)\)$/gm, '$1 JSpec.match($2, "$3", "$4", [$5]);')
    },

    /**
     * Create a range string which can be evaluated to a native array.
     *
     * @param  {int} start
     * @param  {int} end
     * @return {string}
     * @api public
     */

    range : function(start, end) {
      current = parseInt(start), end = parseInt(end), values = [current]
      if (end > current) while (++current <= end) values.push(current)
      else               while (--current >= end) values.push(current)
      return '[' + values + ']'
    },

    /**
     * Report on the results. 
     *
     * @api public
     */

    report : function() {
      this.options.formatter ? 
        new this.options.formatter(this, this.options):
          new this.formatters.DOM(this, this.options)
    },

    /**
     * Run the spec suites. Options are merged
     * with JSpec options when present.
     *
     * @param  {hash} options
     * @return {JSpec}
     * @api public
     */

    run : function(options) {
      if (options) extend(this.options, options)
      if (option('profile')) console.group('Profile')
      each(this.suites, function(suite) { this.runSuite(suite) })
      if (option('profile')) console.groupEnd()
      return this
    },

    /**
     * Run a suite.
     *
     * @param  {Suite} suite
     * @return {JSpec}
     * @api public
     */

    runSuite : function(suite) {
      suite.body()
      suite.ran = true
      suite.hook('before')
      each(suite.specs, function(spec) {
        suite.hook('before_each')
        this.runSpec(spec)
        suite.hook('after_each')
      })
      if (suite.hasSuites()) {
        each(suite.suites, function(suite) {
          this.runSuite(suite)
        })
      }
      suite.hook('after')
      return this
    },
         
    /**
     * Report a failure for the current spec.
     *
     * @param  {string} message
     * @api public
     */
     
     fail : function(message) {
       JSpec.currentSpec.assertions.push({ passed : false, message : message })
       JSpec.stats.failures++
     },

    /**
     * Run a spec.
     *
     * @param  {Spec} spec
     * @api public
     */

    runSpec : function(spec) {
      this.currentSpec = spec
      this.stats.specs++
      if (option('profile')) console.time(spec.description)
      try { this.evalBody(spec.body) }
      catch (e) { fail(e) }
      if (option('profile')) console.timeEnd(spec.description)
      this.stats.assertions += spec.assertions.length
    },

    /**
     * Require a dependency, with optional message.
     *
     * @param  {string} dependency
     * @param  {string} message (optional)
     * @api public
     */

    requires : function(dependency, message) {
      try { eval(dependency) }
      catch (e) { error('JSpec depends on ' + dependency + ' ' + message, '') }
    },

    /**
     * Query against the current query strings keys
     * or the queryString specified.
     *
     * @param  {string} key
     * @param  {string} queryString
     * @return {string, null}
     * @api private
     */

    query : function(key, queryString) {
      queryString = (queryString || (main.location ? main.location.search : null) || '').substring(1)
      return inject(queryString.split('&'), null, function(value, pair){
        parts = pair.split('=')
        return parts[0] == key ? parts[1].replace(/%20|\+/gmi, ' ') : value
      })
    },

    /**
     * Throw a JSpec related error.
     *
     * @param {string} message
     * @param {Exception} e
     * @api public
     */

    error : function(message, e) {
      throw (message ? message : '') + e.toString() + 
              (e.line ? ' near line ' + e.line : '') +
                (JSpec.file ? ' in ' + JSpec.file : '')
    },
    
    /**
     * Ad-hoc POST request for JSpec server usage.
     *
     * @param  {string} url
     * @param  {string} data
     * @api private
     */
    
    post : function(url, data) {
      request = this.xhr()
      request.open('POST', url, false)
      request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
      request.send(data)
    },

    /**
     * Report back to server with statistics.
     *
     * @api private
     */
    
    reportToServer : function() {
      JSpec.post('http://localhost:4444', 'passes=' + JSpec.stats.passes + '&failures=' + JSpec.stats.failures)
			if ('close' in window) window.close()
    },
    
    /**
     * Instantiate an XMLHttpRequest.
     *
     * @return {ActiveXObject, XMLHttpRequest}
     * @api private
     */
    
    xhr : function() {
      return window.ActiveXObject ? 
               new ActiveXObject("Microsoft.XMLHTTP"): 
                 new XMLHttpRequest()
    },
    
    /**
     * Check for HTTP request support.
     *
     * @return {bool}
     * @api private
     */
    
    hasXhr : function() {
      return 'XMLHttpRequest' in main || 'ActiveXObject' in main
    },

    /**
     * Load a files contents.
     *
     * @param  {string} file
     * @return {string}
     * @api public
     */

    load : function(file) {
      this.file = file
      if (this.hasXhr()) {
        request = this.xhr()
        request.open('GET', file, false)
        request.send(null)
        if (request.readyState == 4) return request.responseText
      }
      else if ('readFile' in main)
        return readFile(file)
      else
        error('cannot load ' + file)
    },

    /**
     * Load, pre-process, and evaluate a file.
     *
     * @param {string} file
     * @param {JSpec}
     * @api public
     */

    exec : function(file) {
      eval(this.preprocess(this.load(file)))
      return this
    }
  }

  // --- Utility functions

  main   = this
  puts   = print
  map    = JSpec.map
  any    = JSpec.any
  last   = JSpec.last
  fail   = JSpec.fail
  range  = JSpec.range
  each   = JSpec.each
  option = JSpec.option
  inject = JSpec.inject
  error  = JSpec.error
  escape = JSpec.escape
  extend = JSpec.extend
  print  = JSpec.print
  hash   = JSpec.hash
  query  = JSpec.query
  strip  = JSpec.strip
  color  = JSpec.color
  addMatchers = JSpec.addMatchers

  // --- Matchers

  addMatchers({
    equal              : "===",
    be                 : "alias equal",
    be_greater_than    : ">",
    be_less_than       : "<",
    be_at_least        : ">=",
    be_at_most         : "<=",
    be_a               : "actual.constructor == expected",
    be_an              : "alias be_a",
    be_an_instance_of  : "actual instanceof expected",
    be_null            : "actual == null",
    be_empty           : "actual.length == 0",
    be_true            : "actual == true",
    be_false           : "actual == false",
    be_type            : "typeof actual == expected",
    match              : "typeof actual == 'string' ? actual.match(expected) : false",
    respond_to         : "typeof actual[expected] == 'function'",
    have_length        : "actual.length == expected",
    be_within          : "actual >= expected[0] && actual <= last(expected)",
    have_length_within : "actual.length >= expected[0] && actual.length <= last(expected)",

    eql : function(actual, expected) {
      return actual.constructor == Array ||
               actual instanceof Object ? 
                 hash(actual) == hash(expected):
                   actual == expected
    },

    include : function(actual) {
      for (state = true, i = 1; i < arguments.length; i++) {
        arg = arguments[i]
        switch (actual.constructor) {
          case String: 
          case Number:
          case RegExp:
          case Function:
            state = actual.toString().match(arg.toString())
            break
         
          case Object:
            state = arg in actual
            break
          
          case Array: 
            state = any(actual, function(value){ return hash(value) == hash(arg) })
            break
        }
        if (!state) return false
      }
      return true
    },

    throw_error : function(actual, expected) {
      try { actual() }
      catch (e) {
        if (expected == undefined) return true
        switch (expected.constructor) {
          case RegExp:   return expected.test(e)
          case Function: return e instanceof expected
          case String:   return expected == e.toString()
        }
      }
    },
    
    have : function(actual, length, property) {
      return actual[property].length == length
    },
    
    have_at_least : function(actual, length, property) {
      return actual[property].length >= length
    },
    
    have_at_most :function(actual, length, property) {
      return actual[property].length <= length
    },
    
    have_within : function(actual, range, property) {
      length = actual[property].length
      return length >= range.shift() && length <= range.pop()
    },
    
    have_prop : function(actual, property, value) {
      return actual[property] == null || 
               actual[property] instanceof Function ? false:
                 value == null ? true:
                   JSpec.matchers.eql.match(actual[property], value)
    },
    
    have_property : function(actual, property, value) {
      return actual[property] == null ||
               actual[property] instanceof Function ? false:
                 value == null ? true:
                   value === actual[property]
    }
  })

  // --- Expose
  
  this.JSpec = JSpec

})();
