'use strict';

window.whatInput = function () {

  'use strict';

  /*
    ---------------
    variables
    ---------------
  */

  // array of actively pressed keys

  var activeKeys = [];

  // cache document.body
  var body;

  // boolean: true if touch buffer timer is running
  var buffer = false;

  // the last used input type
  var currentInput = null;

  // `input` types that don't accept text
  var nonTypingInputs = ['button', 'checkbox', 'file', 'image', 'radio', 'reset', 'submit'];

  // detect version of mouse wheel event to use
  // via https://developer.mozilla.org/en-US/docs/Web/Events/wheel
  var mouseWheel = detectWheel();

  // list of modifier keys commonly used with the mouse and
  // can be safely ignored to prevent false keyboard detection
  var ignoreMap = [16, // shift
  17, // control
  18, // alt
  91, // Windows key / left Apple cmd
  93 // Windows menu / right Apple cmd
  ];

  // mapping of events to input types
  var inputMap = {
    'keydown': 'keyboard',
    'keyup': 'keyboard',
    'mousedown': 'mouse',
    'mousemove': 'mouse',
    'MSPointerDown': 'pointer',
    'MSPointerMove': 'pointer',
    'pointerdown': 'pointer',
    'pointermove': 'pointer',
    'touchstart': 'touch'
  };

  // add correct mouse wheel event mapping to `inputMap`
  inputMap[detectWheel()] = 'mouse';

  // array of all used input types
  var inputTypes = [];

  // mapping of key codes to a common name
  var keyMap = {
    9: 'tab',
    13: 'enter',
    16: 'shift',
    27: 'esc',
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };

  // map of IE 10 pointer events
  var pointerMap = {
    2: 'touch',
    3: 'touch', // treat pen like touch
    4: 'mouse'
  };

  // touch buffer timer
  var timer;

  /*
    ---------------
    functions
    ---------------
  */

  // allows events that are also triggered to be filtered out for `touchstart`
  function eventBuffer() {
    clearTimer();
    setInput(event);

    buffer = true;
    timer = window.setTimeout(function () {
      buffer = false;
    }, 650);
  }

  function bufferedEvent(event) {
    if (!buffer) setInput(event);
  }

  function unBufferedEvent(event) {
    clearTimer();
    setInput(event);
  }

  function clearTimer() {
    window.clearTimeout(timer);
  }

  function setInput(event) {
    var eventKey = key(event);
    var value = inputMap[event.type];
    if (value === 'pointer') value = pointerType(event);

    // don't do anything if the value matches the input type already set
    if (currentInput !== value) {
      var eventTarget = target(event);
      var eventTargetNode = eventTarget.nodeName.toLowerCase();
      var eventTargetType = eventTargetNode === 'input' ? eventTarget.getAttribute('type') : null;

      if ( // only if the user flag to allow typing in form fields isn't set
      !body.hasAttribute('data-whatinput-formtyping') &&

      // only if currentInput has a value
      currentInput &&

      // only if the input is `keyboard`
      value === 'keyboard' &&

      // not if the key is `TAB`
      keyMap[eventKey] !== 'tab' && (

      // only if the target is a form input that accepts text
      eventTargetNode === 'textarea' || eventTargetNode === 'select' || eventTargetNode === 'input' && nonTypingInputs.indexOf(eventTargetType) < 0) ||
      // ignore modifier keys
      ignoreMap.indexOf(eventKey) > -1) {
        // ignore keyboard typing
      } else {
        switchInput(value);
      }
    }

    if (value === 'keyboard') logKeys(eventKey);
  }

  function switchInput(string) {
    currentInput = string;
    body.setAttribute('data-whatinput', currentInput);

    if (inputTypes.indexOf(currentInput) === -1) inputTypes.push(currentInput);
  }

  function key(event) {
    return event.keyCode ? event.keyCode : event.which;
  }

  function target(event) {
    return event.target || event.srcElement;
  }

  function pointerType(event) {
    if (typeof event.pointerType === 'number') {
      return pointerMap[event.pointerType];
    } else {
      return event.pointerType === 'pen' ? 'touch' : event.pointerType; // treat pen like touch
    }
  }

  // keyboard logging
  function logKeys(eventKey) {
    if (activeKeys.indexOf(keyMap[eventKey]) === -1 && keyMap[eventKey]) activeKeys.push(keyMap[eventKey]);
  }

  function unLogKeys(event) {
    var eventKey = key(event);
    var arrayPos = activeKeys.indexOf(keyMap[eventKey]);

    if (arrayPos !== -1) activeKeys.splice(arrayPos, 1);
  }

  function bindEvents() {
    body = document.body;

    // pointer events (mouse, pen, touch)
    if (window.PointerEvent) {
      body.addEventListener('pointerdown', bufferedEvent);
      body.addEventListener('pointermove', bufferedEvent);
    } else if (window.MSPointerEvent) {
      body.addEventListener('MSPointerDown', bufferedEvent);
      body.addEventListener('MSPointerMove', bufferedEvent);
    } else {

      // mouse events
      body.addEventListener('mousedown', bufferedEvent);
      body.addEventListener('mousemove', bufferedEvent);

      // touch events
      if ('ontouchstart' in window) {
        body.addEventListener('touchstart', eventBuffer);
      }
    }

    // mouse wheel
    body.addEventListener(mouseWheel, bufferedEvent);

    // keyboard events
    body.addEventListener('keydown', unBufferedEvent);
    body.addEventListener('keyup', unBufferedEvent);
    document.addEventListener('keyup', unLogKeys);
  }

  /*
    ---------------
    utilities
    ---------------
  */

  // detect version of mouse wheel event to use
  // via https://developer.mozilla.org/en-US/docs/Web/Events/wheel
  function detectWheel() {
    return mouseWheel = 'onwheel' in document.createElement('div') ? 'wheel' : // Modern browsers support "wheel"

    document.onmousewheel !== undefined ? 'mousewheel' : // Webkit and IE support at least "mousewheel"
    'DOMMouseScroll'; // let's assume that remaining browsers are older Firefox
  }

  /*
    ---------------
    init
      don't start script unless browser cuts the mustard,
    also passes if polyfills are used
    ---------------
  */

  if ('addEventListener' in window && Array.prototype.indexOf) {

    // if the dom is already ready already (script was placed at bottom of <body>)
    if (document.body) {
      bindEvents();

      // otherwise wait for the dom to load (script was placed in the <head>)
    } else {
      document.addEventListener('DOMContentLoaded', bindEvents);
    }
  }

  /*
    ---------------
    api
    ---------------
  */

  return {

    // returns string: the current input type
    ask: function () {
      return currentInput;
    },

    // returns array: currently pressed keys
    keys: function () {
      return activeKeys;
    },

    // returns array: all the detected input types
    types: function () {
      return inputTypes;
    },

    // accepts string: manually set the input type
    set: switchInput
  };
}();
;!function ($) {

  "use strict";

  var FOUNDATION_VERSION = '6.2.1';

  // Global Foundation object
  // This is attached to the window, or used as a module for AMD/Browserify
  var Foundation = {
    version: FOUNDATION_VERSION,

    /**
     * Stores initialized plugins.
     */
    _plugins: {},

    /**
     * Stores generated unique ids for plugin instances
     */
    _uuids: [],

    /**
     * Returns a boolean for RTL support
     */
    rtl: function () {
      return $('html').attr('dir') === 'rtl';
    },
    /**
     * Defines a Foundation plugin, adding it to the `Foundation` namespace and the list of plugins to initialize when reflowing.
     * @param {Object} plugin - The constructor of the plugin.
     */
    plugin: function (plugin, name) {
      // Object key to use when adding to global Foundation object
      // Examples: Foundation.Reveal, Foundation.OffCanvas
      var className = name || functionName(plugin);
      // Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
      // Examples: data-reveal, data-off-canvas
      var attrName = hyphenate(className);

      // Add to the Foundation object and the plugins list (for reflowing)
      this._plugins[attrName] = this[className] = plugin;
    },
    /**
     * @function
     * Populates the _uuids array with pointers to each individual plugin instance.
     * Adds the `zfPlugin` data-attribute to programmatically created plugins to allow use of $(selector).foundation(method) calls.
     * Also fires the initialization event for each plugin, consolidating repeditive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @param {String} name - the name of the plugin, passed as a camelCased string.
     * @fires Plugin#init
     */
    registerPlugin: function (plugin, name) {
      var pluginName = name ? hyphenate(name) : functionName(plugin.constructor).toLowerCase();
      plugin.uuid = this.GetYoDigits(6, pluginName);

      if (!plugin.$element.attr('data-' + pluginName)) {
        plugin.$element.attr('data-' + pluginName, plugin.uuid);
      }
      if (!plugin.$element.data('zfPlugin')) {
        plugin.$element.data('zfPlugin', plugin);
      }
      /**
       * Fires when the plugin has initialized.
       * @event Plugin#init
       */
      plugin.$element.trigger('init.zf.' + pluginName);

      this._uuids.push(plugin.uuid);

      return;
    },
    /**
     * @function
     * Removes the plugins uuid from the _uuids array.
     * Removes the zfPlugin data attribute, as well as the data-plugin-name attribute.
     * Also fires the destroyed event for the plugin, consolidating repeditive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @fires Plugin#destroyed
     */
    unregisterPlugin: function (plugin) {
      var pluginName = hyphenate(functionName(plugin.$element.data('zfPlugin').constructor));

      this._uuids.splice(this._uuids.indexOf(plugin.uuid), 1);
      plugin.$element.removeAttr('data-' + pluginName).removeData('zfPlugin')
      /**
       * Fires when the plugin has been destroyed.
       * @event Plugin#destroyed
       */
      .trigger('destroyed.zf.' + pluginName);
      for (var prop in plugin) {
        plugin[prop] = null; //clean up script to prep for garbage collection.
      }
      return;
    },

    /**
     * @function
     * Causes one or more active plugins to re-initialize, resetting event listeners, recalculating positions, etc.
     * @param {String} plugins - optional string of an individual plugin key, attained by calling `$(element).data('pluginName')`, or string of a plugin class i.e. `'dropdown'`
     * @default If no argument is passed, reflow all currently active plugins.
     */
    reInit: function (plugins) {
      var isJQ = plugins instanceof $;
      try {
        if (isJQ) {
          plugins.each(function () {
            $(this).data('zfPlugin')._init();
          });
        } else {
          var type = typeof plugins,
              _this = this,
              fns = {
            'object': function (plgs) {
              plgs.forEach(function (p) {
                p = hyphenate(p);
                $('[data-' + p + ']').foundation('_init');
              });
            },
            'string': function () {
              plugins = hyphenate(plugins);
              $('[data-' + plugins + ']').foundation('_init');
            },
            'undefined': function () {
              this['object'](Object.keys(_this._plugins));
            }
          };
          fns[type](plugins);
        }
      } catch (err) {
        console.error(err);
      } finally {
        return plugins;
      }
    },

    /**
     * returns a random base-36 uid with namespacing
     * @function
     * @param {Number} length - number of random base-36 digits desired. Increase for more random strings.
     * @param {String} namespace - name of plugin to be incorporated in uid, optional.
     * @default {String} '' - if no plugin name is provided, nothing is appended to the uid.
     * @returns {String} - unique id
     */
    GetYoDigits: function (length, namespace) {
      length = length || 6;
      return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)).toString(36).slice(1) + (namespace ? '-' + namespace : '');
    },
    /**
     * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
     * @param {Object} elem - jQuery object containing the element to check inside. Also checks the element itself, unless it's the `document` object.
     * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
     */
    reflow: function (elem, plugins) {

      // If plugins is undefined, just grab everything
      if (typeof plugins === 'undefined') {
        plugins = Object.keys(this._plugins);
      }
      // If plugins is a string, convert it to an array with one item
      else if (typeof plugins === 'string') {
          plugins = [plugins];
        }

      var _this = this;

      // Iterate through each plugin
      $.each(plugins, function (i, name) {
        // Get the current plugin
        var plugin = _this._plugins[name];

        // Localize the search to all elements inside elem, as well as elem itself, unless elem === document
        var $elem = $(elem).find('[data-' + name + ']').addBack('[data-' + name + ']');

        // For each plugin found, initialize it
        $elem.each(function () {
          var $el = $(this),
              opts = {};
          // Don't double-dip on plugins
          if ($el.data('zfPlugin')) {
            console.warn("Tried to initialize " + name + " on an element that already has a Foundation plugin.");
            return;
          }

          if ($el.attr('data-options')) {
            var thing = $el.attr('data-options').split(';').forEach(function (e, i) {
              var opt = e.split(':').map(function (el) {
                return el.trim();
              });
              if (opt[0]) opts[opt[0]] = parseValue(opt[1]);
            });
          }
          try {
            $el.data('zfPlugin', new plugin($(this), opts));
          } catch (er) {
            console.error(er);
          } finally {
            return;
          }
        });
      });
    },
    getFnName: functionName,
    transitionend: function ($elem) {
      var transitions = {
        'transition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'otransitionend'
      };
      var elem = document.createElement('div'),
          end;

      for (var t in transitions) {
        if (typeof elem.style[t] !== 'undefined') {
          end = transitions[t];
        }
      }
      if (end) {
        return end;
      } else {
        end = setTimeout(function () {
          $elem.triggerHandler('transitionend', [$elem]);
        }, 1);
        return 'transitionend';
      }
    }
  };

  Foundation.util = {
    /**
     * Function for applying a debounce effect to a function call.
     * @function
     * @param {Function} func - Function to be called at end of timeout.
     * @param {Number} delay - Time in ms to delay the call of `func`.
     * @returns function
     */
    throttle: function (func, delay) {
      var timer = null;

      return function () {
        var context = this,
            args = arguments;

        if (timer === null) {
          timer = setTimeout(function () {
            func.apply(context, args);
            timer = null;
          }, delay);
        }
      };
    }
  };

  // TODO: consider not making this a jQuery function
  // TODO: need way to reflow vs. re-initialize
  /**
   * The Foundation jQuery method.
   * @param {String|Array} method - An action to perform on the current jQuery object.
   */
  var foundation = function (method) {
    var type = typeof method,
        $meta = $('meta.foundation-mq'),
        $noJS = $('.no-js');

    if (!$meta.length) {
      $('<meta class="foundation-mq">').appendTo(document.head);
    }
    if ($noJS.length) {
      $noJS.removeClass('no-js');
    }

    if (type === 'undefined') {
      //needs to initialize the Foundation object, or an individual plugin.
      Foundation.MediaQuery._init();
      Foundation.reflow(this);
    } else if (type === 'string') {
      //an individual method to invoke on a plugin or group of plugins
      var args = Array.prototype.slice.call(arguments, 1); //collect all the arguments, if necessary
      var plugClass = this.data('zfPlugin'); //determine the class of plugin

      if (plugClass !== undefined && plugClass[method] !== undefined) {
        //make sure both the class and method exist
        if (this.length === 1) {
          //if there's only one, call it directly.
          plugClass[method].apply(plugClass, args);
        } else {
          this.each(function (i, el) {
            //otherwise loop through the jQuery collection and invoke the method on each
            plugClass[method].apply($(el).data('zfPlugin'), args);
          });
        }
      } else {
        //error for no class or no method
        throw new ReferenceError("We're sorry, '" + method + "' is not an available method for " + (plugClass ? functionName(plugClass) : 'this element') + '.');
      }
    } else {
      //error for invalid argument type
      throw new TypeError('We\'re sorry, ' + type + ' is not a valid parameter. You must use a string representing the method you wish to invoke.');
    }
    return this;
  };

  window.Foundation = Foundation;
  $.fn.foundation = foundation;

  // Polyfill for requestAnimationFrame
  (function () {
    if (!Date.now || !window.Date.now) window.Date.now = Date.now = function () {
      return new Date().getTime();
    };

    var vendors = ['webkit', 'moz'];
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
      var vp = vendors[i];
      window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
    }
    if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
      var lastTime = 0;
      window.requestAnimationFrame = function (callback) {
        var now = Date.now();
        var nextTime = Math.max(lastTime + 16, now);
        return setTimeout(function () {
          callback(lastTime = nextTime);
        }, nextTime - now);
      };
      window.cancelAnimationFrame = clearTimeout;
    }
    /**
     * Polyfill for performance.now, required by rAF
     */
    if (!window.performance || !window.performance.now) {
      window.performance = {
        start: Date.now(),
        now: function () {
          return Date.now() - this.start;
        }
      };
    }
  })();
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP = function () {},
          fBound = function () {
        return fToBind.apply(this instanceof fNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
      };

      if (this.prototype) {
        // native functions don't have a prototype
        fNOP.prototype = this.prototype;
      }
      fBound.prototype = new fNOP();

      return fBound;
    };
  }
  // Polyfill to get the name of a function in IE9
  function functionName(fn) {
    if (Function.prototype.name === undefined) {
      var funcNameRegex = /function\s([^(]{1,})\(/;
      var results = funcNameRegex.exec(fn.toString());
      return results && results.length > 1 ? results[1].trim() : "";
    } else if (fn.prototype === undefined) {
      return fn.constructor.name;
    } else {
      return fn.prototype.constructor.name;
    }
  }
  function parseValue(str) {
    if (/true/.test(str)) return true;else if (/false/.test(str)) return false;else if (!isNaN(str * 1)) return parseFloat(str);
    return str;
  }
  // Convert PascalCase to kebab-case
  // Thank you: http://stackoverflow.com/a/8955580
  function hyphenate(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
}(jQuery);
;'use strict';

!function ($) {

  Foundation.Box = {
    ImNotTouchingYou: ImNotTouchingYou,
    GetDimensions: GetDimensions,
    GetOffsets: GetOffsets
  };

  /**
   * Compares the dimensions of an element to a container and determines collision events with container.
   * @function
   * @param {jQuery} element - jQuery object to test for collisions.
   * @param {jQuery} parent - jQuery object to use as bounding container.
   * @param {Boolean} lrOnly - set to true to check left and right values only.
   * @param {Boolean} tbOnly - set to true to check top and bottom values only.
   * @default if no parent object passed, detects collisions with `window`.
   * @returns {Boolean} - true if collision free, false if a collision in any direction.
   */
  function ImNotTouchingYou(element, parent, lrOnly, tbOnly) {
    var eleDims = GetDimensions(element),
        top,
        bottom,
        left,
        right;

    if (parent) {
      var parDims = GetDimensions(parent);

      bottom = eleDims.offset.top + eleDims.height <= parDims.height + parDims.offset.top;
      top = eleDims.offset.top >= parDims.offset.top;
      left = eleDims.offset.left >= parDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= parDims.width;
    } else {
      bottom = eleDims.offset.top + eleDims.height <= eleDims.windowDims.height + eleDims.windowDims.offset.top;
      top = eleDims.offset.top >= eleDims.windowDims.offset.top;
      left = eleDims.offset.left >= eleDims.windowDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= eleDims.windowDims.width;
    }

    var allDirs = [bottom, top, left, right];

    if (lrOnly) {
      return left === right === true;
    }

    if (tbOnly) {
      return top === bottom === true;
    }

    return allDirs.indexOf(false) === -1;
  };

  /**
   * Uses native methods to return an object of dimension values.
   * @function
   * @param {jQuery || HTML} element - jQuery object or DOM element for which to get the dimensions. Can be any element other that document or window.
   * @returns {Object} - nested object of integer pixel values
   * TODO - if element is window, return only those values.
   */
  function GetDimensions(elem, test) {
    elem = elem.length ? elem[0] : elem;

    if (elem === window || elem === document) {
      throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");
    }

    var rect = elem.getBoundingClientRect(),
        parRect = elem.parentNode.getBoundingClientRect(),
        winRect = document.body.getBoundingClientRect(),
        winY = window.pageYOffset,
        winX = window.pageXOffset;

    return {
      width: rect.width,
      height: rect.height,
      offset: {
        top: rect.top + winY,
        left: rect.left + winX
      },
      parentDims: {
        width: parRect.width,
        height: parRect.height,
        offset: {
          top: parRect.top + winY,
          left: parRect.left + winX
        }
      },
      windowDims: {
        width: winRect.width,
        height: winRect.height,
        offset: {
          top: winY,
          left: winX
        }
      }
    };
  }

  /**
   * Returns an object of top and left integer pixel values for dynamically rendered elements,
   * such as: Tooltip, Reveal, and Dropdown
   * @function
   * @param {jQuery} element - jQuery object for the element being positioned.
   * @param {jQuery} anchor - jQuery object for the element's anchor point.
   * @param {String} position - a string relating to the desired position of the element, relative to it's anchor
   * @param {Number} vOffset - integer pixel value of desired vertical separation between anchor and element.
   * @param {Number} hOffset - integer pixel value of desired horizontal separation between anchor and element.
   * @param {Boolean} isOverflow - if a collision event is detected, sets to true to default the element to full width - any desired offset.
   * TODO alter/rewrite to work with `em` values as well/instead of pixels
   */
  function GetOffsets(element, anchor, position, vOffset, hOffset, isOverflow) {
    var $eleDims = GetDimensions(element),
        $anchorDims = anchor ? GetDimensions(anchor) : null;

    switch (position) {
      case 'top':
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top
        };
        break;
      case 'right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset,
          top: $anchorDims.offset.top
        };
        break;
      case 'center top':
        return {
          left: $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'center bottom':
        return {
          left: isOverflow ? hOffset : $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
        break;
      case 'center left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset + 1,
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center':
        return {
          left: $eleDims.windowDims.offset.left + $eleDims.windowDims.width / 2 - $eleDims.width / 2,
          top: $eleDims.windowDims.offset.top + $eleDims.windowDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'reveal':
        return {
          left: ($eleDims.windowDims.width - $eleDims.width) / 2,
          top: $eleDims.windowDims.offset.top + vOffset
        };
      case 'reveal full':
        return {
          left: $eleDims.windowDims.offset.left,
          top: $eleDims.windowDims.offset.top
        };
        break;
      case 'left bottom':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top + $anchorDims.height
        };
        break;
      case 'right bottom':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset - $eleDims.width,
          top: $anchorDims.offset.top + $anchorDims.height
        };
        break;
      default:
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
    }
  }
}(jQuery);
;/*******************************************
 *                                         *
 * This util was created by Marius Olbertz *
 * Please thank Marius on GitHub /owlbertz *
 * or the web http://www.mariusolbertz.de/ *
 *                                         *
 ******************************************/

'use strict';

!function ($) {

  var keyCodes = {
    9: 'TAB',
    13: 'ENTER',
    27: 'ESCAPE',
    32: 'SPACE',
    37: 'ARROW_LEFT',
    38: 'ARROW_UP',
    39: 'ARROW_RIGHT',
    40: 'ARROW_DOWN'
  };

  var commands = {};

  var Keyboard = {
    keys: getKeyCodes(keyCodes),

    /**
     * Parses the (keyboard) event and returns a String that represents its key
     * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
     * @param {Event} event - the event generated by the event handler
     * @return String key - String that represents the key pressed
     */
    parseKey: function (event) {
      var key = keyCodes[event.which || event.keyCode] || String.fromCharCode(event.which).toUpperCase();
      if (event.shiftKey) key = 'SHIFT_' + key;
      if (event.ctrlKey) key = 'CTRL_' + key;
      if (event.altKey) key = 'ALT_' + key;
      return key;
    },


    /**
     * Handles the given (keyboard) event
     * @param {Event} event - the event generated by the event handler
     * @param {String} component - Foundation component's name, e.g. Slider or Reveal
     * @param {Objects} functions - collection of functions that are to be executed
     */
    handleKey: function (event, component, functions) {
      var commandList = commands[component],
          keyCode = this.parseKey(event),
          cmds,
          command,
          fn;

      if (!commandList) return console.warn('Component not defined!');

      if (typeof commandList.ltr === 'undefined') {
        // this component does not differentiate between ltr and rtl
        cmds = commandList; // use plain list
      } else {
        // merge ltr and rtl: if document is rtl, rtl overwrites ltr and vice versa
        if (Foundation.rtl()) cmds = $.extend({}, commandList.ltr, commandList.rtl);else cmds = $.extend({}, commandList.rtl, commandList.ltr);
      }
      command = cmds[keyCode];

      fn = functions[command];
      if (fn && typeof fn === 'function') {
        // execute function  if exists
        fn.apply();
        if (functions.handled || typeof functions.handled === 'function') {
          // execute function when event was handled
          functions.handled.apply();
        }
      } else {
        if (functions.unhandled || typeof functions.unhandled === 'function') {
          // execute function when event was not handled
          functions.unhandled.apply();
        }
      }
    },


    /**
     * Finds all focusable elements within the given `$element`
     * @param {jQuery} $element - jQuery object to search within
     * @return {jQuery} $focusable - all focusable elements within `$element`
     */
    findFocusable: function ($element) {
      return $element.find('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]').filter(function () {
        if (!$(this).is(':visible') || $(this).attr('tabindex') < 0) {
          return false;
        } //only have visible elements and those that have a tabindex greater or equal 0
        return true;
      });
    },


    /**
     * Returns the component name name
     * @param {Object} component - Foundation component, e.g. Slider or Reveal
     * @return String componentName
     */

    register: function (componentName, cmds) {
      commands[componentName] = cmds;
    }
  };

  /*
   * Constants for easier comparing.
   * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
   */
  function getKeyCodes(kcs) {
    var k = {};
    for (var kc in kcs) {
      k[kcs[kc]] = kcs[kc];
    }return k;
  }

  Foundation.Keyboard = Keyboard;
}(jQuery);
;'use strict';

!function ($) {

  // Default set of media queries
  var defaultQueries = {
    'default': 'only screen',
    landscape: 'only screen and (orientation: landscape)',
    portrait: 'only screen and (orientation: portrait)',
    retina: 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 'only screen and (min--moz-device-pixel-ratio: 2),' + 'only screen and (-o-min-device-pixel-ratio: 2/1),' + 'only screen and (min-device-pixel-ratio: 2),' + 'only screen and (min-resolution: 192dpi),' + 'only screen and (min-resolution: 2dppx)'
  };

  var MediaQuery = {
    queries: [],

    current: '',

    /**
     * Initializes the media query helper, by extracting the breakpoint list from the CSS and activating the breakpoint watcher.
     * @function
     * @private
     */
    _init: function () {
      var self = this;
      var extractedStyles = $('.foundation-mq').css('font-family');
      var namedQueries;

      namedQueries = parseStyleToObject(extractedStyles);

      for (var key in namedQueries) {
        self.queries.push({
          name: key,
          value: 'only screen and (min-width: ' + namedQueries[key] + ')'
        });
      }

      this.current = this._getCurrentSize();

      this._watcher();
    },


    /**
     * Checks if the screen is at least as wide as a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to check.
     * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
     */
    atLeast: function (size) {
      var query = this.get(size);

      if (query) {
        return window.matchMedia(query).matches;
      }

      return false;
    },


    /**
     * Gets the media query of a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to get.
     * @returns {String|null} - The media query of the breakpoint, or `null` if the breakpoint doesn't exist.
     */
    get: function (size) {
      for (var i in this.queries) {
        var query = this.queries[i];
        if (size === query.name) return query.value;
      }

      return null;
    },


    /**
     * Gets the current breakpoint name by testing every breakpoint and returning the last one to match (the biggest one).
     * @function
     * @private
     * @returns {String} Name of the current breakpoint.
     */
    _getCurrentSize: function () {
      var matched;

      for (var i = 0; i < this.queries.length; i++) {
        var query = this.queries[i];

        if (window.matchMedia(query.value).matches) {
          matched = query;
        }
      }

      if (typeof matched === 'object') {
        return matched.name;
      } else {
        return matched;
      }
    },


    /**
     * Activates the breakpoint watcher, which fires an event on the window whenever the breakpoint changes.
     * @function
     * @private
     */
    _watcher: function () {
      var _this = this;

      $(window).on('resize.zf.mediaquery', function () {
        var newSize = _this._getCurrentSize();

        if (newSize !== _this.current) {
          // Broadcast the media query change on the window
          $(window).trigger('changed.zf.mediaquery', [newSize, _this.current]);

          // Change the current media query
          _this.current = newSize;
        }
      });
    }
  };

  Foundation.MediaQuery = MediaQuery;

  // matchMedia() polyfill - Test a CSS media type/query in JS.
  // Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license
  window.matchMedia || (window.matchMedia = function () {
    'use strict';

    // For browsers that support matchMedium api such as IE 9 and webkit

    var styleMedia = window.styleMedia || window.media;

    // For those that don't support matchMedium
    if (!styleMedia) {
      var style = document.createElement('style'),
          script = document.getElementsByTagName('script')[0],
          info = null;

      style.type = 'text/css';
      style.id = 'matchmediajs-test';

      script.parentNode.insertBefore(style, script);

      // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
      info = 'getComputedStyle' in window && window.getComputedStyle(style, null) || style.currentStyle;

      styleMedia = {
        matchMedium: function (media) {
          var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

          // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
          if (style.styleSheet) {
            style.styleSheet.cssText = text;
          } else {
            style.textContent = text;
          }

          // Test if media query is true or false
          return info.width === '1px';
        }
      };
    }

    return function (media) {
      return {
        matches: styleMedia.matchMedium(media || 'all'),
        media: media || 'all'
      };
    };
  }());

  // Thank you: https://github.com/sindresorhus/query-string
  function parseStyleToObject(str) {
    var styleObject = {};

    if (typeof str !== 'string') {
      return styleObject;
    }

    str = str.trim().slice(1, -1); // browsers re-quote string style values

    if (!str) {
      return styleObject;
    }

    styleObject = str.split('&').reduce(function (ret, param) {
      var parts = param.replace(/\+/g, ' ').split('=');
      var key = parts[0];
      var val = parts[1];
      key = decodeURIComponent(key);

      // missing `=` should be `null`:
      // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
      val = val === undefined ? null : decodeURIComponent(val);

      if (!ret.hasOwnProperty(key)) {
        ret[key] = val;
      } else if (Array.isArray(ret[key])) {
        ret[key].push(val);
      } else {
        ret[key] = [ret[key], val];
      }
      return ret;
    }, {});

    return styleObject;
  }

  Foundation.MediaQuery = MediaQuery;
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Motion module.
   * @module foundation.motion
   */

  var initClasses = ['mui-enter', 'mui-leave'];
  var activeClasses = ['mui-enter-active', 'mui-leave-active'];

  var Motion = {
    animateIn: function (element, animation, cb) {
      animate(true, element, animation, cb);
    },

    animateOut: function (element, animation, cb) {
      animate(false, element, animation, cb);
    }
  };

  function Move(duration, elem, fn) {
    var anim,
        prog,
        start = null;
    // console.log('called');

    function move(ts) {
      if (!start) start = window.performance.now();
      // console.log(start, ts);
      prog = ts - start;
      fn.apply(elem);

      if (prog < duration) {
        anim = window.requestAnimationFrame(move, elem);
      } else {
        window.cancelAnimationFrame(anim);
        elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
      }
    }
    anim = window.requestAnimationFrame(move);
  }

  /**
   * Animates an element in or out using a CSS transition class.
   * @function
   * @private
   * @param {Boolean} isIn - Defines if the animation is in or out.
   * @param {Object} element - jQuery or HTML object to animate.
   * @param {String} animation - CSS class to use.
   * @param {Function} cb - Callback to run when animation is finished.
   */
  function animate(isIn, element, animation, cb) {
    element = $(element).eq(0);

    if (!element.length) return;

    var initClass = isIn ? initClasses[0] : initClasses[1];
    var activeClass = isIn ? activeClasses[0] : activeClasses[1];

    // Set up the animation
    reset();

    element.addClass(animation).css('transition', 'none');

    requestAnimationFrame(function () {
      element.addClass(initClass);
      if (isIn) element.show();
    });

    // Start the animation
    requestAnimationFrame(function () {
      element[0].offsetWidth;
      element.css('transition', '').addClass(activeClass);
    });

    // Clean up the animation when it finishes
    element.one(Foundation.transitionend(element), finish);

    // Hides the element (for out animations), resets the element, and runs a callback
    function finish() {
      if (!isIn) element.hide();
      reset();
      if (cb) cb.apply(element);
    }

    // Resets transitions and removes motion-specific classes
    function reset() {
      element[0].style.transitionDuration = 0;
      element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
    }
  }

  Foundation.Move = Move;
  Foundation.Motion = Motion;
}(jQuery);
;'use strict';

!function ($) {

  var Nest = {
    Feather: function (menu) {
      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'zf';

      menu.attr('role', 'menubar');

      var items = menu.find('li').attr({ 'role': 'menuitem' }),
          subMenuClass = 'is-' + type + '-submenu',
          subItemClass = subMenuClass + '-item',
          hasSubClass = 'is-' + type + '-submenu-parent';

      menu.find('a:first').attr('tabindex', 0);

      items.each(function () {
        var $item = $(this),
            $sub = $item.children('ul');

        if ($sub.length) {
          $item.addClass(hasSubClass).attr({
            'aria-haspopup': true,
            'aria-expanded': false,
            'aria-label': $item.children('a:first').text()
          });

          $sub.addClass('submenu ' + subMenuClass).attr({
            'data-submenu': '',
            'aria-hidden': true,
            'role': 'menu'
          });
        }

        if ($item.parent('[data-submenu]').length) {
          $item.addClass('is-submenu-item ' + subItemClass);
        }
      });

      return;
    },
    Burn: function (menu, type) {
      var items = menu.find('li').removeAttr('tabindex'),
          subMenuClass = 'is-' + type + '-submenu',
          subItemClass = subMenuClass + '-item',
          hasSubClass = 'is-' + type + '-submenu-parent';

      menu.find('*').removeClass(subMenuClass + ' ' + subItemClass + ' ' + hasSubClass + ' is-submenu-item submenu is-active').removeAttr('data-submenu').css('display', '');

      // console.log(      menu.find('.' + subMenuClass + ', .' + subItemClass + ', .has-submenu, .is-submenu-item, .submenu, [data-submenu]')
      //           .removeClass(subMenuClass + ' ' + subItemClass + ' has-submenu is-submenu-item submenu')
      //           .removeAttr('data-submenu'));
      // items.each(function(){
      //   var $item = $(this),
      //       $sub = $item.children('ul');
      //   if($item.parent('[data-submenu]').length){
      //     $item.removeClass('is-submenu-item ' + subItemClass);
      //   }
      //   if($sub.length){
      //     $item.removeClass('has-submenu');
      //     $sub.removeClass('submenu ' + subMenuClass).removeAttr('data-submenu');
      //   }
      // });
    }
  };

  Foundation.Nest = Nest;
}(jQuery);
;'use strict';

!function ($) {

  function Timer(elem, options, cb) {
    var _this = this,
        duration = options.duration,
        //options is an object for easily adding features later.
    nameSpace = Object.keys(elem.data())[0] || 'timer',
        remain = -1,
        start,
        timer;

    this.isPaused = false;

    this.restart = function () {
      remain = -1;
      clearTimeout(timer);
      this.start();
    };

    this.start = function () {
      this.isPaused = false;
      // if(!elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      remain = remain <= 0 ? duration : remain;
      elem.data('paused', false);
      start = Date.now();
      timer = setTimeout(function () {
        if (options.infinite) {
          _this.restart(); //rerun the timer.
        }
        cb();
      }, remain);
      elem.trigger('timerstart.zf.' + nameSpace);
    };

    this.pause = function () {
      this.isPaused = true;
      //if(elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      elem.data('paused', true);
      var end = Date.now();
      remain = remain - (end - start);
      elem.trigger('timerpaused.zf.' + nameSpace);
    };
  }

  /**
   * Runs a callback function when images are fully loaded.
   * @param {Object} images - Image(s) to check if loaded.
   * @param {Func} callback - Function to execute when image is fully loaded.
   */
  function onImagesLoaded(images, callback) {
    var self = this,
        unloaded = images.length;

    if (unloaded === 0) {
      callback();
    }

    images.each(function () {
      if (this.complete) {
        singleImageLoaded();
      } else if (typeof this.naturalWidth !== 'undefined' && this.naturalWidth > 0) {
        singleImageLoaded();
      } else {
        $(this).one('load', function () {
          singleImageLoaded();
        });
      }
    });

    function singleImageLoaded() {
      unloaded--;
      if (unloaded === 0) {
        callback();
      }
    }
  }

  Foundation.Timer = Timer;
  Foundation.onImagesLoaded = onImagesLoaded;
}(jQuery);
;//**************************************************
//**Work inspired by multiple jquery swipe plugins**
//**Done by Yohai Ararat ***************************
//**************************************************
(function ($) {

		$.spotSwipe = {
				version: '1.0.0',
				enabled: 'ontouchstart' in document.documentElement,
				preventDefault: false,
				moveThreshold: 75,
				timeThreshold: 200
		};

		var startPosX,
		    startPosY,
		    startTime,
		    elapsedTime,
		    isMoving = false;

		function onTouchEnd() {
				//  alert(this);
				this.removeEventListener('touchmove', onTouchMove);
				this.removeEventListener('touchend', onTouchEnd);
				isMoving = false;
		}

		function onTouchMove(e) {
				if ($.spotSwipe.preventDefault) {
						e.preventDefault();
				}
				if (isMoving) {
						var x = e.touches[0].pageX;
						var y = e.touches[0].pageY;
						var dx = startPosX - x;
						var dy = startPosY - y;
						var dir;
						elapsedTime = new Date().getTime() - startTime;
						if (Math.abs(dx) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
								dir = dx > 0 ? 'left' : 'right';
						}
						// else if(Math.abs(dy) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
						//   dir = dy > 0 ? 'down' : 'up';
						// }
						if (dir) {
								e.preventDefault();
								onTouchEnd.call(this);
								$(this).trigger('swipe', dir).trigger('swipe' + dir);
						}
				}
		}

		function onTouchStart(e) {
				if (e.touches.length == 1) {
						startPosX = e.touches[0].pageX;
						startPosY = e.touches[0].pageY;
						isMoving = true;
						startTime = new Date().getTime();
						this.addEventListener('touchmove', onTouchMove, false);
						this.addEventListener('touchend', onTouchEnd, false);
				}
		}

		function init() {
				this.addEventListener && this.addEventListener('touchstart', onTouchStart, false);
		}

		function teardown() {
				this.removeEventListener('touchstart', onTouchStart);
		}

		$.event.special.swipe = { setup: init };

		$.each(['left', 'up', 'down', 'right'], function () {
				$.event.special['swipe' + this] = { setup: function () {
								$(this).on('swipe', $.noop);
						} };
		});
})(jQuery);
/****************************************************
 * Method for adding psuedo drag events to elements *
 ***************************************************/
!function ($) {
		$.fn.addTouch = function () {
				this.each(function (i, el) {
						$(el).bind('touchstart touchmove touchend touchcancel', function () {
								//we pass the original event object because the jQuery event
								//object is normalized to w3c specs and does not provide the TouchList
								handleTouch(event);
						});
				});

				var handleTouch = function (event) {
						var touches = event.changedTouches,
						    first = touches[0],
						    eventTypes = {
								touchstart: 'mousedown',
								touchmove: 'mousemove',
								touchend: 'mouseup'
						},
						    type = eventTypes[event.type],
						    simulatedEvent;

						if ('MouseEvent' in window && typeof window.MouseEvent === 'function') {
								simulatedEvent = window.MouseEvent(type, {
										'bubbles': true,
										'cancelable': true,
										'screenX': first.screenX,
										'screenY': first.screenY,
										'clientX': first.clientX,
										'clientY': first.clientY
								});
						} else {
								simulatedEvent = document.createEvent('MouseEvent');
								simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0 /*left*/, null);
						}
						first.target.dispatchEvent(simulatedEvent);
				};
		};
}(jQuery);

//**********************************
//**From the jQuery Mobile Library**
//**need to recreate functionality**
//**and try to improve if possible**
//**********************************

/* Removing the jQuery function ****
************************************

(function( $, window, undefined ) {

	var $document = $( document ),
		// supportTouch = $.mobile.support.touch,
		touchStartEvent = 'touchstart'//supportTouch ? "touchstart" : "mousedown",
		touchStopEvent = 'touchend'//supportTouch ? "touchend" : "mouseup",
		touchMoveEvent = 'touchmove'//supportTouch ? "touchmove" : "mousemove";

	// setup new event shortcuts
	$.each( ( "touchstart touchmove touchend " +
		"swipe swipeleft swiperight" ).split( " " ), function( i, name ) {

		$.fn[ name ] = function( fn ) {
			return fn ? this.bind( name, fn ) : this.trigger( name );
		};

		// jQuery < 1.8
		if ( $.attrFn ) {
			$.attrFn[ name ] = true;
		}
	});

	function triggerCustomEvent( obj, eventType, event, bubble ) {
		var originalType = event.type;
		event.type = eventType;
		if ( bubble ) {
			$.event.trigger( event, undefined, obj );
		} else {
			$.event.dispatch.call( obj, event );
		}
		event.type = originalType;
	}

	// also handles taphold

	// Also handles swipeleft, swiperight
	$.event.special.swipe = {

		// More than this horizontal displacement, and we will suppress scrolling.
		scrollSupressionThreshold: 30,

		// More time than this, and it isn't a swipe.
		durationThreshold: 1000,

		// Swipe horizontal displacement must be more than this.
		horizontalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		// Swipe vertical displacement must be less than this.
		verticalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		getLocation: function ( event ) {
			var winPageX = window.pageXOffset,
				winPageY = window.pageYOffset,
				x = event.clientX,
				y = event.clientY;

			if ( event.pageY === 0 && Math.floor( y ) > Math.floor( event.pageY ) ||
				event.pageX === 0 && Math.floor( x ) > Math.floor( event.pageX ) ) {

				// iOS4 clientX/clientY have the value that should have been
				// in pageX/pageY. While pageX/page/ have the value 0
				x = x - winPageX;
				y = y - winPageY;
			} else if ( y < ( event.pageY - winPageY) || x < ( event.pageX - winPageX ) ) {

				// Some Android browsers have totally bogus values for clientX/Y
				// when scrolling/zooming a page. Detectable since clientX/clientY
				// should never be smaller than pageX/pageY minus page scroll
				x = event.pageX - winPageX;
				y = event.pageY - winPageY;
			}

			return {
				x: x,
				y: y
			};
		},

		start: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ],
						origin: $( event.target )
					};
		},

		stop: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ]
					};
		},

		handleSwipe: function( start, stop, thisObject, origTarget ) {
			if ( stop.time - start.time < $.event.special.swipe.durationThreshold &&
				Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.horizontalDistanceThreshold &&
				Math.abs( start.coords[ 1 ] - stop.coords[ 1 ] ) < $.event.special.swipe.verticalDistanceThreshold ) {
				var direction = start.coords[0] > stop.coords[ 0 ] ? "swipeleft" : "swiperight";

				triggerCustomEvent( thisObject, "swipe", $.Event( "swipe", { target: origTarget, swipestart: start, swipestop: stop }), true );
				triggerCustomEvent( thisObject, direction,$.Event( direction, { target: origTarget, swipestart: start, swipestop: stop } ), true );
				return true;
			}
			return false;

		},

		// This serves as a flag to ensure that at most one swipe event event is
		// in work at any given time
		eventInProgress: false,

		setup: function() {
			var events,
				thisObject = this,
				$this = $( thisObject ),
				context = {};

			// Retrieve the events data for this element and add the swipe context
			events = $.data( this, "mobile-events" );
			if ( !events ) {
				events = { length: 0 };
				$.data( this, "mobile-events", events );
			}
			events.length++;
			events.swipe = context;

			context.start = function( event ) {

				// Bail if we're already working on a swipe event
				if ( $.event.special.swipe.eventInProgress ) {
					return;
				}
				$.event.special.swipe.eventInProgress = true;

				var stop,
					start = $.event.special.swipe.start( event ),
					origTarget = event.target,
					emitted = false;

				context.move = function( event ) {
					if ( !start || event.isDefaultPrevented() ) {
						return;
					}

					stop = $.event.special.swipe.stop( event );
					if ( !emitted ) {
						emitted = $.event.special.swipe.handleSwipe( start, stop, thisObject, origTarget );
						if ( emitted ) {

							// Reset the context to make way for the next swipe event
							$.event.special.swipe.eventInProgress = false;
						}
					}
					// prevent scrolling
					if ( Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.scrollSupressionThreshold ) {
						event.preventDefault();
					}
				};

				context.stop = function() {
						emitted = true;

						// Reset the context to make way for the next swipe event
						$.event.special.swipe.eventInProgress = false;
						$document.off( touchMoveEvent, context.move );
						context.move = null;
				};

				$document.on( touchMoveEvent, context.move )
					.one( touchStopEvent, context.stop );
			};
			$this.on( touchStartEvent, context.start );
		},

		teardown: function() {
			var events, context;

			events = $.data( this, "mobile-events" );
			if ( events ) {
				context = events.swipe;
				delete events.swipe;
				events.length--;
				if ( events.length === 0 ) {
					$.removeData( this, "mobile-events" );
				}
			}

			if ( context ) {
				if ( context.start ) {
					$( this ).off( touchStartEvent, context.start );
				}
				if ( context.move ) {
					$document.off( touchMoveEvent, context.move );
				}
				if ( context.stop ) {
					$document.off( touchStopEvent, context.stop );
				}
			}
		}
	};
	$.each({
		swipeleft: "swipe.left",
		swiperight: "swipe.right"
	}, function( event, sourceEvent ) {

		$.event.special[ event ] = {
			setup: function() {
				$( this ).bind( sourceEvent, $.noop );
			},
			teardown: function() {
				$( this ).unbind( sourceEvent );
			}
		};
	});
})( jQuery, this );
*/
;'use strict';

!function ($) {

  var MutationObserver = function () {
    var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
    for (var i = 0; i < prefixes.length; i++) {
      if (prefixes[i] + 'MutationObserver' in window) {
        return window[prefixes[i] + 'MutationObserver'];
      }
    }
    return false;
  }();

  var triggers = function (el, type) {
    el.data(type).split(' ').forEach(function (id) {
      $('#' + id)[type === 'close' ? 'trigger' : 'triggerHandler'](type + '.zf.trigger', [el]);
    });
  };
  // Elements with [data-open] will reveal a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-open]', function () {
    triggers($(this), 'open');
  });

  // Elements with [data-close] will close a plugin that supports it when clicked.
  // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
  $(document).on('click.zf.trigger', '[data-close]', function () {
    var id = $(this).data('close');
    if (id) {
      triggers($(this), 'close');
    } else {
      $(this).trigger('close.zf.trigger');
    }
  });

  // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-toggle]', function () {
    triggers($(this), 'toggle');
  });

  // Elements with [data-closable] will respond to close.zf.trigger events.
  $(document).on('close.zf.trigger', '[data-closable]', function (e) {
    e.stopPropagation();
    var animation = $(this).data('closable');

    if (animation !== '') {
      Foundation.Motion.animateOut($(this), animation, function () {
        $(this).trigger('closed.zf');
      });
    } else {
      $(this).fadeOut().trigger('closed.zf');
    }
  });

  $(document).on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', function () {
    var id = $(this).data('toggle-focus');
    $('#' + id).triggerHandler('toggle.zf.trigger', [$(this)]);
  });

  /**
  * Fires once after all other scripts have loaded
  * @function
  * @private
  */
  $(window).load(function () {
    checkListeners();
  });

  function checkListeners() {
    eventsListener();
    resizeListener();
    scrollListener();
    closemeListener();
  }

  //******** only fires this function once on load, if there's something to watch ********
  function closemeListener(pluginName) {
    var yetiBoxes = $('[data-yeti-box]'),
        plugNames = ['dropdown', 'tooltip', 'reveal'];

    if (pluginName) {
      if (typeof pluginName === 'string') {
        plugNames.push(pluginName);
      } else if (typeof pluginName === 'object' && typeof pluginName[0] === 'string') {
        plugNames.concat(pluginName);
      } else {
        console.error('Plugin names must be strings');
      }
    }
    if (yetiBoxes.length) {
      var listeners = plugNames.map(function (name) {
        return 'closeme.zf.' + name;
      }).join(' ');

      $(window).off(listeners).on(listeners, function (e, pluginId) {
        var plugin = e.namespace.split('.')[0];
        var plugins = $('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');

        plugins.each(function () {
          var _this = $(this);

          _this.triggerHandler('close.zf.trigger', [_this]);
        });
      });
    }
  }

  function resizeListener(debounce) {
    var timer = void 0,
        $nodes = $('[data-resize]');
    if ($nodes.length) {
      $(window).off('resize.zf.trigger').on('resize.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('resizeme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a resize event
          $nodes.attr('data-events', "resize");
        }, debounce || 10); //default time to emit resize event
      });
    }
  }

  function scrollListener(debounce) {
    var timer = void 0,
        $nodes = $('[data-scroll]');
    if ($nodes.length) {
      $(window).off('scroll.zf.trigger').on('scroll.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('scrollme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a scroll event
          $nodes.attr('data-events', "scroll");
        }, debounce || 10); //default time to emit scroll event
      });
    }
  }

  function eventsListener() {
    if (!MutationObserver) {
      return false;
    }
    var nodes = document.querySelectorAll('[data-resize], [data-scroll], [data-mutate]');

    //element callback
    var listeningElementsMutation = function (mutationRecordsList) {
      var $target = $(mutationRecordsList[0].target);
      //trigger the event handler for the element depending on type
      switch ($target.attr("data-events")) {

        case "resize":
          $target.triggerHandler('resizeme.zf.trigger', [$target]);
          break;

        case "scroll":
          $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
          break;

        // case "mutate" :
        // console.log('mutate', $target);
        // $target.triggerHandler('mutate.zf.trigger');
        //
        // //make sure we don't get stuck in an infinite loop from sloppy codeing
        // if ($target.index('[data-mutate]') == $("[data-mutate]").length-1) {
        //   domMutationObserver();
        // }
        // break;

        default:
          return false;
        //nothing
      }
    };

    if (nodes.length) {
      //for each element that needs to listen for resizing, scrolling, (or coming soon mutation) add a single observer
      for (var i = 0; i <= nodes.length - 1; i++) {
        var elementObserver = new MutationObserver(listeningElementsMutation);
        elementObserver.observe(nodes[i], { attributes: true, childList: false, characterData: false, subtree: false, attributeFilter: ["data-events"] });
      }
    }
  }

  // ------------------------------------

  // [PH]
  // Foundation.CheckWatchers = checkWatchers;
  Foundation.IHearYou = checkListeners;
  // Foundation.ISeeYou = scrollListener;
  // Foundation.IFeelYou = closemeListener;
}(jQuery);

// function domMutationObserver(debounce) {
//   // !!! This is coming soon and needs more work; not active  !!! //
//   var timer,
//   nodes = document.querySelectorAll('[data-mutate]');
//   //
//   if (nodes.length) {
//     // var MutationObserver = (function () {
//     //   var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
//     //   for (var i=0; i < prefixes.length; i++) {
//     //     if (prefixes[i] + 'MutationObserver' in window) {
//     //       return window[prefixes[i] + 'MutationObserver'];
//     //     }
//     //   }
//     //   return false;
//     // }());
//
//
//     //for the body, we need to listen for all changes effecting the style and class attributes
//     var bodyObserver = new MutationObserver(bodyMutation);
//     bodyObserver.observe(document.body, { attributes: true, childList: true, characterData: false, subtree:true, attributeFilter:["style", "class"]});
//
//
//     //body callback
//     function bodyMutation(mutate) {
//       //trigger all listening elements and signal a mutation event
//       if (timer) { clearTimeout(timer); }
//
//       timer = setTimeout(function() {
//         bodyObserver.disconnect();
//         $('[data-mutate]').attr('data-events',"mutate");
//       }, debounce || 150);
//     }
//   }
// }
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Abide module.
   * @module foundation.abide
   */

  var Abide = function () {
    /**
     * Creates a new instance of Abide.
     * @class
     * @fires Abide#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Abide(element) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, Abide);

      this.$element = element;
      this.options = $.extend({}, Abide.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Abide');
    }

    /**
     * Initializes the Abide plugin and calls functions to get Abide functioning on load.
     * @private
     */


    _createClass(Abide, [{
      key: '_init',
      value: function _init() {
        this.$inputs = this.$element.find('input, textarea, select').not('[data-abide-ignore]');

        this._events();
      }

      /**
       * Initializes events for Abide.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this2 = this;

        this.$element.off('.abide').on('reset.zf.abide', function () {
          _this2.resetForm();
        }).on('submit.zf.abide', function () {
          return _this2.validateForm();
        });

        if (this.options.validateOn === 'fieldChange') {
          this.$inputs.off('change.zf.abide').on('change.zf.abide', function (e) {
            _this2.validateInput($(e.target));
          });
        }

        if (this.options.liveValidate) {
          this.$inputs.off('input.zf.abide').on('input.zf.abide', function (e) {
            _this2.validateInput($(e.target));
          });
        }
      }

      /**
       * Calls necessary functions to update Abide upon DOM change
       * @private
       */

    }, {
      key: '_reflow',
      value: function _reflow() {
        this._init();
      }

      /**
       * Checks whether or not a form element has the required attribute and if it's checked or not
       * @param {Object} element - jQuery object to check for required attribute
       * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
       */

    }, {
      key: 'requiredCheck',
      value: function requiredCheck($el) {
        if (!$el.attr('required')) return true;

        var isGood = true;

        switch ($el[0].type) {
          case 'select':
          case 'select-one':
          case 'select-multiple':
            var opt = $el.find('option:selected');
            if (!opt.length || !opt.val()) isGood = false;
            break;

          default:
            if (!$el.val() || !$el.val().length) isGood = false;
        }

        return isGood;
      }

      /**
       * Based on $el, get the first element with selector in this order:
       * 1. The element's direct sibling('s).
       * 3. The element's parent's children.
       *
       * This allows for multiple form errors per input, though if none are found, no form errors will be shown.
       *
       * @param {Object} $el - jQuery object to use as reference to find the form error selector.
       * @returns {Object} jQuery object with the selector.
       */

    }, {
      key: 'findFormError',
      value: function findFormError($el) {
        var $error = $el.siblings(this.options.formErrorSelector);

        if (!$error.length) {
          $error = $el.parent().find(this.options.formErrorSelector);
        }

        return $error;
      }

      /**
       * Get the first element in this order:
       * 2. The <label> with the attribute `[for="someInputId"]`
       * 3. The `.closest()` <label>
       *
       * @param {Object} $el - jQuery object to check for required attribute
       * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
       */

    }, {
      key: 'findLabel',
      value: function findLabel($el) {
        var id = $el[0].id;
        var $label = this.$element.find('label[for="' + id + '"]');

        if (!$label.length) {
          return $el.closest('label');
        }

        return $label;
      }

      /**
       * Get the set of labels associated with a set of radio els in this order
       * 2. The <label> with the attribute `[for="someInputId"]`
       * 3. The `.closest()` <label>
       *
       * @param {Object} $el - jQuery object to check for required attribute
       * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
       */

    }, {
      key: 'findRadioLabels',
      value: function findRadioLabels($els) {
        var _this3 = this;

        var labels = $els.map(function (i, el) {
          var id = el.id;
          var $label = _this3.$element.find('label[for="' + id + '"]');

          if (!$label.length) {
            $label = $(el).closest('label');
          }
          return $label[0];
        });

        return $(labels);
      }

      /**
       * Adds the CSS error class as specified by the Abide settings to the label, input, and the form
       * @param {Object} $el - jQuery object to add the class to
       */

    }, {
      key: 'addErrorClasses',
      value: function addErrorClasses($el) {
        var $label = this.findLabel($el);
        var $formError = this.findFormError($el);

        if ($label.length) {
          $label.addClass(this.options.labelErrorClass);
        }

        if ($formError.length) {
          $formError.addClass(this.options.formErrorClass);
        }

        $el.addClass(this.options.inputErrorClass).attr('data-invalid', '');
      }

      /**
       * Remove CSS error classes etc from an entire radio button group
       * @param {String} groupName - A string that specifies the name of a radio button group
       *
       */

    }, {
      key: 'removeRadioErrorClasses',
      value: function removeRadioErrorClasses(groupName) {
        var $els = this.$element.find(':radio[name="' + groupName + '"]');
        var $labels = this.findRadioLabels($els);
        var $formErrors = this.findFormError($els);

        if ($labels.length) {
          $labels.removeClass(this.options.labelErrorClass);
        }

        if ($formErrors.length) {
          $formErrors.removeClass(this.options.formErrorClass);
        }

        $els.removeClass(this.options.inputErrorClass).removeAttr('data-invalid');
      }

      /**
       * Removes CSS error class as specified by the Abide settings from the label, input, and the form
       * @param {Object} $el - jQuery object to remove the class from
       */

    }, {
      key: 'removeErrorClasses',
      value: function removeErrorClasses($el) {
        // radios need to clear all of the els
        if ($el[0].type == 'radio') {
          return this.removeRadioErrorClasses($el.attr('name'));
        }

        var $label = this.findLabel($el);
        var $formError = this.findFormError($el);

        if ($label.length) {
          $label.removeClass(this.options.labelErrorClass);
        }

        if ($formError.length) {
          $formError.removeClass(this.options.formErrorClass);
        }

        $el.removeClass(this.options.inputErrorClass).removeAttr('data-invalid');
      }

      /**
       * Goes through a form to find inputs and proceeds to validate them in ways specific to their type
       * @fires Abide#invalid
       * @fires Abide#valid
       * @param {Object} element - jQuery object to validate, should be an HTML input
       * @returns {Boolean} goodToGo - If the input is valid or not.
       */

    }, {
      key: 'validateInput',
      value: function validateInput($el) {
        var clearRequire = this.requiredCheck($el),
            validated = false,
            customValidator = true,
            validator = $el.attr('data-validator'),
            equalTo = true;

        switch ($el[0].type) {
          case 'radio':
            validated = this.validateRadio($el.attr('name'));
            break;

          case 'checkbox':
            validated = clearRequire;
            break;

          case 'select':
          case 'select-one':
          case 'select-multiple':
            validated = clearRequire;
            break;

          default:
            validated = this.validateText($el);
        }

        if (validator) {
          customValidator = this.matchValidation($el, validator, $el.attr('required'));
        }

        if ($el.attr('data-equalto')) {
          equalTo = this.options.validators.equalTo($el);
        }

        var goodToGo = [clearRequire, validated, customValidator, equalTo].indexOf(false) === -1;
        var message = (goodToGo ? 'valid' : 'invalid') + '.zf.abide';

        this[goodToGo ? 'removeErrorClasses' : 'addErrorClasses']($el);

        /**
         * Fires when the input is done checking for validation. Event trigger is either `valid.zf.abide` or `invalid.zf.abide`
         * Trigger includes the DOM element of the input.
         * @event Abide#valid
         * @event Abide#invalid
         */
        $el.trigger(message, [$el]);

        return goodToGo;
      }

      /**
       * Goes through a form and if there are any invalid inputs, it will display the form error element
       * @returns {Boolean} noError - true if no errors were detected...
       * @fires Abide#formvalid
       * @fires Abide#forminvalid
       */

    }, {
      key: 'validateForm',
      value: function validateForm() {
        var acc = [];
        var _this = this;

        this.$inputs.each(function () {
          acc.push(_this.validateInput($(this)));
        });

        var noError = acc.indexOf(false) === -1;

        this.$element.find('[data-abide-error]').css('display', noError ? 'none' : 'block');

        /**
         * Fires when the form is finished validating. Event trigger is either `formvalid.zf.abide` or `forminvalid.zf.abide`.
         * Trigger includes the element of the form.
         * @event Abide#formvalid
         * @event Abide#forminvalid
         */
        this.$element.trigger((noError ? 'formvalid' : 'forminvalid') + '.zf.abide', [this.$element]);

        return noError;
      }

      /**
       * Determines whether or a not a text input is valid based on the pattern specified in the attribute. If no matching pattern is found, returns true.
       * @param {Object} $el - jQuery object to validate, should be a text input HTML element
       * @param {String} pattern - string value of one of the RegEx patterns in Abide.options.patterns
       * @returns {Boolean} Boolean value depends on whether or not the input value matches the pattern specified
       */

    }, {
      key: 'validateText',
      value: function validateText($el, pattern) {
        // A pattern can be passed to this function, or it will be infered from the input's "pattern" attribute, or it's "type" attribute
        pattern = pattern || $el.attr('pattern') || $el.attr('type');
        var inputText = $el.val();
        var valid = false;

        if (inputText.length) {
          // If the pattern attribute on the element is in Abide's list of patterns, then test that regexp
          if (this.options.patterns.hasOwnProperty(pattern)) {
            valid = this.options.patterns[pattern].test(inputText);
          }
          // If the pattern name isn't also the type attribute of the field, then test it as a regexp
          else if (pattern !== $el.attr('type')) {
              valid = new RegExp(pattern).test(inputText);
            } else {
              valid = true;
            }
        }
        // An empty field is valid if it's not required
        else if (!$el.prop('required')) {
            valid = true;
          }

        return valid;
      }

      /**
       * Determines whether or a not a radio input is valid based on whether or not it is required and selected. Although the function targets a single `<input>`, it validates by checking the `required` and `checked` properties of all radio buttons in its group.
       * @param {String} groupName - A string that specifies the name of a radio button group
       * @returns {Boolean} Boolean value depends on whether or not at least one radio input has been selected (if it's required)
       */

    }, {
      key: 'validateRadio',
      value: function validateRadio(groupName) {
        // If at least one radio in the group has the `required` attribute, the group is considered required
        // Per W3C spec, all radio buttons in a group should have `required`, but we're being nice
        var $group = this.$element.find(':radio[name="' + groupName + '"]');
        var valid = false;

        // .attr() returns undefined if no elements in $group have the attribute "required"
        if ($group.attr('required') === undefined) {
          valid = true;
        }

        // For the group to be valid, at least one radio needs to be checked
        $group.each(function (i, e) {
          if ($(e).prop('checked')) {
            valid = true;
          }
        });

        return valid;
      }

      /**
       * Determines if a selected input passes a custom validation function. Multiple validations can be used, if passed to the element with `data-validator="foo bar baz"` in a space separated listed.
       * @param {Object} $el - jQuery input element.
       * @param {String} validators - a string of function names matching functions in the Abide.options.validators object.
       * @param {Boolean} required - self explanatory?
       * @returns {Boolean} - true if validations passed.
       */

    }, {
      key: 'matchValidation',
      value: function matchValidation($el, validators, required) {
        var _this4 = this;

        required = required ? true : false;

        var clear = validators.split(' ').map(function (v) {
          return _this4.options.validators[v]($el, required, $el.parent());
        });
        return clear.indexOf(false) === -1;
      }

      /**
       * Resets form inputs and styles
       * @fires Abide#formreset
       */

    }, {
      key: 'resetForm',
      value: function resetForm() {
        var $form = this.$element,
            opts = this.options;

        $('.' + opts.labelErrorClass, $form).not('small').removeClass(opts.labelErrorClass);
        $('.' + opts.inputErrorClass, $form).not('small').removeClass(opts.inputErrorClass);
        $(opts.formErrorSelector + '.' + opts.formErrorClass).removeClass(opts.formErrorClass);
        $form.find('[data-abide-error]').css('display', 'none');
        $(':input', $form).not(':button, :submit, :reset, :hidden, [data-abide-ignore]').val('').removeAttr('data-invalid');
        /**
         * Fires when the form has been reset.
         * @event Abide#formreset
         */
        $form.trigger('formreset.zf.abide', [$form]);
      }

      /**
       * Destroys an instance of Abide.
       * Removes error styles and classes from elements, without resetting their values.
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        var _this = this;
        this.$element.off('.abide').find('[data-abide-error]').css('display', 'none');

        this.$inputs.off('.abide').each(function () {
          _this.removeErrorClasses($(this));
        });

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Abide;
  }();

  /**
   * Default settings for plugin
   */


  Abide.defaults = {
    /**
     * The default event to validate inputs. Checkboxes and radios validate immediately.
     * Remove or change this value for manual validation.
     * @option
     * @example 'fieldChange'
     */
    validateOn: 'fieldChange',

    /**
     * Class to be applied to input labels on failed validation.
     * @option
     * @example 'is-invalid-label'
     */
    labelErrorClass: 'is-invalid-label',

    /**
     * Class to be applied to inputs on failed validation.
     * @option
     * @example 'is-invalid-input'
     */
    inputErrorClass: 'is-invalid-input',

    /**
     * Class selector to use to target Form Errors for show/hide.
     * @option
     * @example '.form-error'
     */
    formErrorSelector: '.form-error',

    /**
     * Class added to Form Errors on failed validation.
     * @option
     * @example 'is-visible'
     */
    formErrorClass: 'is-visible',

    /**
     * Set to true to validate text inputs on any value change.
     * @option
     * @example false
     */
    liveValidate: false,

    patterns: {
      alpha: /^[a-zA-Z]+$/,
      alpha_numeric: /^[a-zA-Z0-9]+$/,
      integer: /^[-+]?\d+$/,
      number: /^[-+]?\d*(?:[\.\,]\d+)?$/,

      // amex, visa, diners
      card: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
      cvv: /^([0-9]){3,4}$/,

      // http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
      email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,

      url: /^(https?|ftp|file|ssh):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/,
      // abc.de
      domain: /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8}$/,

      datetime: /^([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))$/,
      // YYYY-MM-DD
      date: /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/,
      // HH:MM:SS
      time: /^(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/,
      dateISO: /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
      // MM/DD/YYYY
      month_day_year: /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.]\d{4}$/,
      // DD/MM/YYYY
      day_month_year: /^(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.]\d{4}$/,

      // #FFF or #FFFFFF
      color: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/
    },

    /**
     * Optional validation functions to be used. `equalTo` being the only default included function.
     * Functions should return only a boolean if the input is valid or not. Functions are given the following arguments:
     * el : The jQuery element to validate.
     * required : Boolean value of the required attribute be present or not.
     * parent : The direct parent of the input.
     * @option
     */
    validators: {
      equalTo: function (el, required, parent) {
        return $('#' + el.attr('data-equalto')).val() === el.val();
      }
    }
  };

  // Window exports
  Foundation.plugin(Abide, 'Abide');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Accordion module.
   * @module foundation.accordion
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   */

  var Accordion = function () {
    /**
     * Creates a new instance of an accordion.
     * @class
     * @fires Accordion#init
     * @param {jQuery} element - jQuery object to make into an accordion.
     * @param {Object} options - a plain object with settings to override the default options.
     */
    function Accordion(element, options) {
      _classCallCheck(this, Accordion);

      this.$element = element;
      this.options = $.extend({}, Accordion.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Accordion');
      Foundation.Keyboard.register('Accordion', {
        'ENTER': 'toggle',
        'SPACE': 'toggle',
        'ARROW_DOWN': 'next',
        'ARROW_UP': 'previous'
      });
    }

    /**
     * Initializes the accordion by animating the preset active pane(s).
     * @private
     */


    _createClass(Accordion, [{
      key: '_init',
      value: function _init() {
        this.$element.attr('role', 'tablist');
        this.$tabs = this.$element.children('li, [data-accordion-item]');

        this.$tabs.each(function (idx, el) {
          var $el = $(el),
              $content = $el.children('[data-tab-content]'),
              id = $content[0].id || Foundation.GetYoDigits(6, 'accordion'),
              linkId = el.id || id + '-label';

          $el.find('a:first').attr({
            'aria-controls': id,
            'role': 'tab',
            'id': linkId,
            'aria-expanded': false,
            'aria-selected': false
          });

          $content.attr({ 'role': 'tabpanel', 'aria-labelledby': linkId, 'aria-hidden': true, 'id': id });
        });
        var $initActive = this.$element.find('.is-active').children('[data-tab-content]');
        if ($initActive.length) {
          this.down($initActive, true);
        }
        this._events();
      }

      /**
       * Adds event handlers for items within the accordion.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        this.$tabs.each(function () {
          var $elem = $(this);
          var $tabContent = $elem.children('[data-tab-content]');
          if ($tabContent.length) {
            $elem.children('a').off('click.zf.accordion keydown.zf.accordion').on('click.zf.accordion', function (e) {
              // $(this).children('a').on('click.zf.accordion', function(e) {
              e.preventDefault();
              if ($elem.hasClass('is-active')) {
                if (_this.options.allowAllClosed || $elem.siblings().hasClass('is-active')) {
                  _this.up($tabContent);
                }
              } else {
                _this.down($tabContent);
              }
            }).on('keydown.zf.accordion', function (e) {
              Foundation.Keyboard.handleKey(e, 'Accordion', {
                toggle: function () {
                  _this.toggle($tabContent);
                },
                next: function () {
                  var $a = $elem.next().find('a').focus();
                  if (!_this.options.multiExpand) {
                    $a.trigger('click.zf.accordion');
                  }
                },
                previous: function () {
                  var $a = $elem.prev().find('a').focus();
                  if (!_this.options.multiExpand) {
                    $a.trigger('click.zf.accordion');
                  }
                },
                handled: function () {
                  e.preventDefault();
                  e.stopPropagation();
                }
              });
            });
          }
        });
      }

      /**
       * Toggles the selected content pane's open/close state.
       * @param {jQuery} $target - jQuery object of the pane to toggle.
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle($target) {
        if ($target.parent().hasClass('is-active')) {
          if (this.options.allowAllClosed || $target.parent().siblings().hasClass('is-active')) {
            this.up($target);
          } else {
            return;
          }
        } else {
          this.down($target);
        }
      }

      /**
       * Opens the accordion tab defined by `$target`.
       * @param {jQuery} $target - Accordion pane to open.
       * @param {Boolean} firstTime - flag to determine if reflow should happen.
       * @fires Accordion#down
       * @function
       */

    }, {
      key: 'down',
      value: function down($target, firstTime) {
        var _this2 = this;

        if (!this.options.multiExpand && !firstTime) {
          var $currentActive = this.$element.children('.is-active').children('[data-tab-content]');
          if ($currentActive.length) {
            this.up($currentActive);
          }
        }

        $target.attr('aria-hidden', false).parent('[data-tab-content]').addBack().parent().addClass('is-active');

        $target.slideDown(this.options.slideSpeed, function () {
          /**
           * Fires when the tab is done opening.
           * @event Accordion#down
           */
          _this2.$element.trigger('down.zf.accordion', [$target]);
        });

        $('#' + $target.attr('aria-labelledby')).attr({
          'aria-expanded': true,
          'aria-selected': true
        });
      }

      /**
       * Closes the tab defined by `$target`.
       * @param {jQuery} $target - Accordion tab to close.
       * @fires Accordion#up
       * @function
       */

    }, {
      key: 'up',
      value: function up($target) {
        var $aunts = $target.parent().siblings(),
            _this = this;
        var canClose = this.options.multiExpand ? $aunts.hasClass('is-active') : $target.parent().hasClass('is-active');

        if (!this.options.allowAllClosed && !canClose) {
          return;
        }

        // Foundation.Move(this.options.slideSpeed, $target, function(){
        $target.slideUp(_this.options.slideSpeed, function () {
          /**
           * Fires when the tab is done collapsing up.
           * @event Accordion#up
           */
          _this.$element.trigger('up.zf.accordion', [$target]);
        });
        // });

        $target.attr('aria-hidden', true).parent().removeClass('is-active');

        $('#' + $target.attr('aria-labelledby')).attr({
          'aria-expanded': false,
          'aria-selected': false
        });
      }

      /**
       * Destroys an instance of an accordion.
       * @fires Accordion#destroyed
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.find('[data-tab-content]').slideUp(0).css('display', '');
        this.$element.find('a').off('.zf.accordion');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Accordion;
  }();

  Accordion.defaults = {
    /**
     * Amount of time to animate the opening of an accordion pane.
     * @option
     * @example 250
     */
    slideSpeed: 250,
    /**
     * Allow the accordion to have multiple open panes.
     * @option
     * @example false
     */
    multiExpand: false,
    /**
     * Allow the accordion to close all panes.
     * @option
     * @example false
     */
    allowAllClosed: false
  };

  // Window exports
  Foundation.plugin(Accordion, 'Accordion');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * AccordionMenu module.
   * @module foundation.accordionMenu
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   * @requires foundation.util.nest
   */

  var AccordionMenu = function () {
    /**
     * Creates a new instance of an accordion menu.
     * @class
     * @fires AccordionMenu#init
     * @param {jQuery} element - jQuery object to make into an accordion menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function AccordionMenu(element, options) {
      _classCallCheck(this, AccordionMenu);

      this.$element = element;
      this.options = $.extend({}, AccordionMenu.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'accordion');

      this._init();

      Foundation.registerPlugin(this, 'AccordionMenu');
      Foundation.Keyboard.register('AccordionMenu', {
        'ENTER': 'toggle',
        'SPACE': 'toggle',
        'ARROW_RIGHT': 'open',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'close',
        'ESCAPE': 'closeAll',
        'TAB': 'down',
        'SHIFT_TAB': 'up'
      });
    }

    /**
     * Initializes the accordion menu by hiding all nested menus.
     * @private
     */


    _createClass(AccordionMenu, [{
      key: '_init',
      value: function _init() {
        this.$element.find('[data-submenu]').not('.is-active').slideUp(0); //.find('a').css('padding-left', '1rem');
        this.$element.attr({
          'role': 'tablist',
          'aria-multiselectable': this.options.multiOpen
        });

        this.$menuLinks = this.$element.find('.is-accordion-submenu-parent');
        this.$menuLinks.each(function () {
          var linkId = this.id || Foundation.GetYoDigits(6, 'acc-menu-link'),
              $elem = $(this),
              $sub = $elem.children('[data-submenu]'),
              subId = $sub[0].id || Foundation.GetYoDigits(6, 'acc-menu'),
              isActive = $sub.hasClass('is-active');
          $elem.attr({
            'aria-controls': subId,
            'aria-expanded': isActive,
            'role': 'tab',
            'id': linkId
          });
          $sub.attr({
            'aria-labelledby': linkId,
            'aria-hidden': !isActive,
            'role': 'tabpanel',
            'id': subId
          });
        });
        var initPanes = this.$element.find('.is-active');
        if (initPanes.length) {
          var _this = this;
          initPanes.each(function () {
            _this.down($(this));
          });
        }
        this._events();
      }

      /**
       * Adds event handlers for items within the menu.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        this.$element.find('li').each(function () {
          var $submenu = $(this).children('[data-submenu]');

          if ($submenu.length) {
            $(this).children('a').off('click.zf.accordionMenu').on('click.zf.accordionMenu', function (e) {
              e.preventDefault();

              _this.toggle($submenu);
            });
          }
        }).on('keydown.zf.accordionmenu', function (e) {
          var $element = $(this),
              $elements = $element.parent('ul').children('li'),
              $prevElement,
              $nextElement,
              $target = $element.children('[data-submenu]');

          $elements.each(function (i) {
            if ($(this).is($element)) {
              $prevElement = $elements.eq(Math.max(0, i - 1)).find('a').first();
              $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1)).find('a').first();

              if ($(this).children('[data-submenu]:visible').length) {
                // has open sub menu
                $nextElement = $element.find('li:first-child').find('a').first();
              }
              if ($(this).is(':first-child')) {
                // is first element of sub menu
                $prevElement = $element.parents('li').first().find('a').first();
              } else if ($prevElement.children('[data-submenu]:visible').length) {
                // if previous element has open sub menu
                $prevElement = $prevElement.find('li:last-child').find('a').first();
              }
              if ($(this).is(':last-child')) {
                // is last element of sub menu
                $nextElement = $element.parents('li').first().next('li').find('a').first();
              }

              return;
            }
          });
          Foundation.Keyboard.handleKey(e, 'AccordionMenu', {
            open: function () {
              if ($target.is(':hidden')) {
                _this.down($target);
                $target.find('li').first().find('a').first().focus();
              }
            },
            close: function () {
              if ($target.length && !$target.is(':hidden')) {
                // close active sub of this item
                _this.up($target);
              } else if ($element.parent('[data-submenu]').length) {
                // close currently open sub
                _this.up($element.parent('[data-submenu]'));
                $element.parents('li').first().find('a').first().focus();
              }
            },
            up: function () {
              $prevElement.attr('tabindex', -1).focus();
              e.preventDefault();
            },
            down: function () {
              $nextElement.attr('tabindex', -1).focus();
              e.preventDefault();
            },
            toggle: function () {
              if ($element.children('[data-submenu]').length) {
                _this.toggle($element.children('[data-submenu]'));
              }
            },
            closeAll: function () {
              _this.hideAll();
            },
            handled: function () {
              e.stopImmediatePropagation();
            }
          });
        }); //.attr('tabindex', 0);
      }

      /**
       * Closes all panes of the menu.
       * @function
       */

    }, {
      key: 'hideAll',
      value: function hideAll() {
        this.$element.find('[data-submenu]').slideUp(this.options.slideSpeed);
      }

      /**
       * Toggles the open/close state of a submenu.
       * @function
       * @param {jQuery} $target - the submenu to toggle
       */

    }, {
      key: 'toggle',
      value: function toggle($target) {
        if (!$target.is(':animated')) {
          if (!$target.is(':hidden')) {
            this.up($target);
          } else {
            this.down($target);
          }
        }
      }

      /**
       * Opens the sub-menu defined by `$target`.
       * @param {jQuery} $target - Sub-menu to open.
       * @fires AccordionMenu#down
       */

    }, {
      key: 'down',
      value: function down($target) {
        var _this = this;

        if (!this.options.multiOpen) {
          this.up(this.$element.find('.is-active').not($target.parentsUntil(this.$element).add($target)));
        }

        $target.addClass('is-active').attr({ 'aria-hidden': false }).parent('.is-accordion-submenu-parent').attr({ 'aria-expanded': true });

        Foundation.Move(this.options.slideSpeed, $target, function () {
          $target.slideDown(_this.options.slideSpeed, function () {
            /**
             * Fires when the menu is done opening.
             * @event AccordionMenu#down
             */
            _this.$element.trigger('down.zf.accordionMenu', [$target]);
          });
        });
      }

      /**
       * Closes the sub-menu defined by `$target`. All sub-menus inside the target will be closed as well.
       * @param {jQuery} $target - Sub-menu to close.
       * @fires AccordionMenu#up
       */

    }, {
      key: 'up',
      value: function up($target) {
        var _this = this;
        Foundation.Move(this.options.slideSpeed, $target, function () {
          $target.slideUp(_this.options.slideSpeed, function () {
            /**
             * Fires when the menu is done collapsing up.
             * @event AccordionMenu#up
             */
            _this.$element.trigger('up.zf.accordionMenu', [$target]);
          });
        });

        var $menus = $target.find('[data-submenu]').slideUp(0).addBack().attr('aria-hidden', true);

        $menus.parent('.is-accordion-submenu-parent').attr('aria-expanded', false);
      }

      /**
       * Destroys an instance of accordion menu.
       * @fires AccordionMenu#destroyed
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.find('[data-submenu]').slideDown(0).css('display', '');
        this.$element.find('a').off('click.zf.accordionMenu');

        Foundation.Nest.Burn(this.$element, 'accordion');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return AccordionMenu;
  }();

  AccordionMenu.defaults = {
    /**
     * Amount of time to animate the opening of a submenu in ms.
     * @option
     * @example 250
     */
    slideSpeed: 250,
    /**
     * Allow the menu to have multiple open panes.
     * @option
     * @example true
     */
    multiOpen: true
  };

  // Window exports
  Foundation.plugin(AccordionMenu, 'AccordionMenu');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Drilldown module.
   * @module foundation.drilldown
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   * @requires foundation.util.nest
   */

  var Drilldown = function () {
    /**
     * Creates a new instance of a drilldown menu.
     * @class
     * @param {jQuery} element - jQuery object to make into an accordion menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Drilldown(element, options) {
      _classCallCheck(this, Drilldown);

      this.$element = element;
      this.options = $.extend({}, Drilldown.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'drilldown');

      this._init();

      Foundation.registerPlugin(this, 'Drilldown');
      Foundation.Keyboard.register('Drilldown', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'previous',
        'ESCAPE': 'close',
        'TAB': 'down',
        'SHIFT_TAB': 'up'
      });
    }

    /**
     * Initializes the drilldown by creating jQuery collections of elements
     * @private
     */


    _createClass(Drilldown, [{
      key: '_init',
      value: function _init() {
        this.$submenuAnchors = this.$element.find('li.is-drilldown-submenu-parent').children('a');
        this.$submenus = this.$submenuAnchors.parent('li').children('[data-submenu]');
        this.$menuItems = this.$element.find('li').not('.js-drilldown-back').attr('role', 'menuitem').find('a');

        this._prepareMenu();

        this._keyboardEvents();
      }

      /**
       * prepares drilldown menu by setting attributes to links and elements
       * sets a min height to prevent content jumping
       * wraps the element if not already wrapped
       * @private
       * @function
       */

    }, {
      key: '_prepareMenu',
      value: function _prepareMenu() {
        var _this = this;
        // if(!this.options.holdOpen){
        //   this._menuLinkEvents();
        // }
        this.$submenuAnchors.each(function () {
          var $sub = $(this);
          var $link = $sub.find('a:first');
          if (_this.options.parentLink) {
            $link.clone().prependTo($sub.children('[data-submenu]')).wrap('<li class="is-submenu-parent-item is-submenu-item is-drilldown-submenu-item" role="menu-item"></li>');
          }
          $link.data('savedHref', $link.attr('href')).removeAttr('href');
          $sub.children('[data-submenu]').attr({
            'aria-hidden': true,
            'tabindex': 0,
            'role': 'menu'
          });
          _this._events($sub);
        });
        this.$submenus.each(function () {
          var $menu = $(this),
              $back = $menu.find('.js-drilldown-back');
          if (!$back.length) {
            $menu.prepend(_this.options.backButton);
          }
          _this._back($menu);
        });
        if (!this.$element.parent().hasClass('is-drilldown')) {
          this.$wrapper = $(this.options.wrapper).addClass('is-drilldown').css(this._getMaxDims());
          this.$element.wrap(this.$wrapper);
        }
      }

      /**
       * Adds event handlers to elements in the menu.
       * @function
       * @private
       * @param {jQuery} $elem - the current menu item to add handlers to.
       */

    }, {
      key: '_events',
      value: function _events($elem) {
        var _this = this;

        $elem.off('click.zf.drilldown').on('click.zf.drilldown', function (e) {
          if ($(e.target).parentsUntil('ul', 'li').hasClass('is-drilldown-submenu-parent')) {
            e.stopImmediatePropagation();
            e.preventDefault();
          }

          // if(e.target !== e.currentTarget.firstElementChild){
          //   return false;
          // }
          _this._show($elem.parent('li'));

          if (_this.options.closeOnClick) {
            var $body = $('body').not(_this.$wrapper);
            $body.off('.zf.drilldown').on('click.zf.drilldown', function (e) {
              e.preventDefault();
              _this._hideAll();
              $body.off('.zf.drilldown');
            });
          }
        });
      }

      /**
       * Adds keydown event listener to `li`'s in the menu.
       * @private
       */

    }, {
      key: '_keyboardEvents',
      value: function _keyboardEvents() {
        var _this = this;

        this.$menuItems.add(this.$element.find('.js-drilldown-back > a')).on('keydown.zf.drilldown', function (e) {

          var $element = $(this),
              $elements = $element.parent('li').parent('ul').children('li').children('a'),
              $prevElement,
              $nextElement;

          $elements.each(function (i) {
            if ($(this).is($element)) {
              $prevElement = $elements.eq(Math.max(0, i - 1));
              $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1));
              return;
            }
          });

          Foundation.Keyboard.handleKey(e, 'Drilldown', {
            next: function () {
              if ($element.is(_this.$submenuAnchors)) {
                _this._show($element.parent('li'));
                $element.parent('li').one(Foundation.transitionend($element), function () {
                  $element.parent('li').find('ul li a').filter(_this.$menuItems).first().focus();
                });
                e.preventDefault();
              }
            },
            previous: function () {
              _this._hide($element.parent('li').parent('ul'));
              $element.parent('li').parent('ul').one(Foundation.transitionend($element), function () {
                setTimeout(function () {
                  $element.parent('li').parent('ul').parent('li').children('a').first().focus();
                }, 1);
              });
              e.preventDefault();
            },
            up: function () {
              $prevElement.focus();
              e.preventDefault();
            },
            down: function () {
              $nextElement.focus();
              e.preventDefault();
            },
            close: function () {
              _this._back();
              //_this.$menuItems.first().focus(); // focus to first element
            },
            open: function () {
              if (!$element.is(_this.$menuItems)) {
                // not menu item means back button
                _this._hide($element.parent('li').parent('ul'));
                $element.parent('li').parent('ul').one(Foundation.transitionend($element), function () {
                  setTimeout(function () {
                    $element.parent('li').parent('ul').parent('li').children('a').first().focus();
                  }, 1);
                });
                e.preventDefault();
              } else if ($element.is(_this.$submenuAnchors)) {
                _this._show($element.parent('li'));
                $element.parent('li').one(Foundation.transitionend($element), function () {
                  $element.parent('li').find('ul li a').filter(_this.$menuItems).first().focus();
                });
                e.preventDefault();
              }
            },
            handled: function () {
              e.stopImmediatePropagation();
            }
          });
        }); // end keyboardAccess
      }

      /**
       * Closes all open elements, and returns to root menu.
       * @function
       * @fires Drilldown#closed
       */

    }, {
      key: '_hideAll',
      value: function _hideAll() {
        var $elem = this.$element.find('.is-drilldown-submenu.is-active').addClass('is-closing');
        $elem.one(Foundation.transitionend($elem), function (e) {
          $elem.removeClass('is-active is-closing');
        });
        /**
         * Fires when the menu is fully closed.
         * @event Drilldown#closed
         */
        this.$element.trigger('closed.zf.drilldown');
      }

      /**
       * Adds event listener for each `back` button, and closes open menus.
       * @function
       * @fires Drilldown#back
       * @param {jQuery} $elem - the current sub-menu to add `back` event.
       */

    }, {
      key: '_back',
      value: function _back($elem) {
        var _this = this;
        $elem.off('click.zf.drilldown');
        $elem.children('.js-drilldown-back').on('click.zf.drilldown', function (e) {
          e.stopImmediatePropagation();
          // console.log('mouseup on back');
          _this._hide($elem);
        });
      }

      /**
       * Adds event listener to menu items w/o submenus to close open menus on click.
       * @function
       * @private
       */

    }, {
      key: '_menuLinkEvents',
      value: function _menuLinkEvents() {
        var _this = this;
        this.$menuItems.not('.is-drilldown-submenu-parent').off('click.zf.drilldown').on('click.zf.drilldown', function (e) {
          // e.stopImmediatePropagation();
          setTimeout(function () {
            _this._hideAll();
          }, 0);
        });
      }

      /**
       * Opens a submenu.
       * @function
       * @fires Drilldown#open
       * @param {jQuery} $elem - the current element with a submenu to open, i.e. the `li` tag.
       */

    }, {
      key: '_show',
      value: function _show($elem) {
        $elem.children('[data-submenu]').addClass('is-active');

        this.$element.trigger('open.zf.drilldown', [$elem]);
      }
    }, {
      key: '_hide',


      /**
       * Hides a submenu
       * @function
       * @fires Drilldown#hide
       * @param {jQuery} $elem - the current sub-menu to hide, i.e. the `ul` tag.
       */
      value: function _hide($elem) {
        var _this = this;
        $elem.addClass('is-closing').one(Foundation.transitionend($elem), function () {
          $elem.removeClass('is-active is-closing');
          $elem.blur();
        });
        /**
         * Fires when the submenu is has closed.
         * @event Drilldown#hide
         */
        $elem.trigger('hide.zf.drilldown', [$elem]);
      }

      /**
       * Iterates through the nested menus to calculate the min-height, and max-width for the menu.
       * Prevents content jumping.
       * @function
       * @private
       */

    }, {
      key: '_getMaxDims',
      value: function _getMaxDims() {
        var max = 0,
            result = {};
        this.$submenus.add(this.$element).each(function () {
          var numOfElems = $(this).children('li').length;
          max = numOfElems > max ? numOfElems : max;
        });

        result['min-height'] = max * this.$menuItems[0].getBoundingClientRect().height + 'px';
        result['max-width'] = this.$element[0].getBoundingClientRect().width + 'px';

        return result;
      }

      /**
       * Destroys the Drilldown Menu
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this._hideAll();
        Foundation.Nest.Burn(this.$element, 'drilldown');
        this.$element.unwrap().find('.js-drilldown-back, .is-submenu-parent-item').remove().end().find('.is-active, .is-closing, .is-drilldown-submenu').removeClass('is-active is-closing is-drilldown-submenu').end().find('[data-submenu]').removeAttr('aria-hidden tabindex role').off('.zf.drilldown').end().off('zf.drilldown');
        this.$element.find('a').each(function () {
          var $link = $(this);
          if ($link.data('savedHref')) {
            $link.attr('href', $link.data('savedHref')).removeData('savedHref');
          } else {
            return;
          }
        });
        Foundation.unregisterPlugin(this);
      }
    }]);

    return Drilldown;
  }();

  Drilldown.defaults = {
    /**
     * Markup used for JS generated back button. Prepended to submenu lists and deleted on `destroy` method, 'js-drilldown-back' class required. Remove the backslash (`\`) if copy and pasting.
     * @option
     * @example '<\li><\a>Back<\/a><\/li>'
     */
    backButton: '<li class="js-drilldown-back"><a tabindex="0">Back</a></li>',
    /**
     * Markup used to wrap drilldown menu. Use a class name for independent styling; the JS applied class: `is-drilldown` is required. Remove the backslash (`\`) if copy and pasting.
     * @option
     * @example '<\div class="is-drilldown"><\/div>'
     */
    wrapper: '<div></div>',
    /**
     * Adds the parent link to the submenu.
     * @option
     * @example false
     */
    parentLink: false,
    /**
     * Allow the menu to return to root list on body click.
     * @option
     * @example false
     */
    closeOnClick: false
    // holdOpen: false
  };

  // Window exports
  Foundation.plugin(Drilldown, 'Drilldown');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Dropdown module.
   * @module foundation.dropdown
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.triggers
   */

  var Dropdown = function () {
    /**
     * Creates a new instance of a dropdown.
     * @class
     * @param {jQuery} element - jQuery object to make into a dropdown.
     *        Object should be of the dropdown panel, rather than its anchor.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Dropdown(element, options) {
      _classCallCheck(this, Dropdown);

      this.$element = element;
      this.options = $.extend({}, Dropdown.defaults, this.$element.data(), options);
      this._init();

      Foundation.registerPlugin(this, 'Dropdown');
      Foundation.Keyboard.register('Dropdown', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ESCAPE': 'close',
        'TAB': 'tab_forward',
        'SHIFT_TAB': 'tab_backward'
      });
    }

    /**
     * Initializes the plugin by setting/checking options and attributes, adding helper variables, and saving the anchor.
     * @function
     * @private
     */


    _createClass(Dropdown, [{
      key: '_init',
      value: function _init() {
        var $id = this.$element.attr('id');

        this.$anchor = $('[data-toggle="' + $id + '"]') || $('[data-open="' + $id + '"]');
        this.$anchor.attr({
          'aria-controls': $id,
          'data-is-focus': false,
          'data-yeti-box': $id,
          'aria-haspopup': true,
          'aria-expanded': false

        });

        this.options.positionClass = this.getPositionClass();
        this.counter = 4;
        this.usedPositions = [];
        this.$element.attr({
          'aria-hidden': 'true',
          'data-yeti-box': $id,
          'data-resize': $id,
          'aria-labelledby': this.$anchor[0].id || Foundation.GetYoDigits(6, 'dd-anchor')
        });
        this._events();
      }

      /**
       * Helper function to determine current orientation of dropdown pane.
       * @function
       * @returns {String} position - string value of a position class.
       */

    }, {
      key: 'getPositionClass',
      value: function getPositionClass() {
        var verticalPosition = this.$element[0].className.match(/(top|left|right|bottom)/g);
        verticalPosition = verticalPosition ? verticalPosition[0] : '';
        var horizontalPosition = /float-(.+)\s/.exec(this.$anchor[0].className);
        horizontalPosition = horizontalPosition ? horizontalPosition[1] : '';
        var position = horizontalPosition ? horizontalPosition + ' ' + verticalPosition : verticalPosition;
        return position;
      }

      /**
       * Adjusts the dropdown panes orientation by adding/removing positioning classes.
       * @function
       * @private
       * @param {String} position - position class to remove.
       */

    }, {
      key: '_reposition',
      value: function _reposition(position) {
        this.usedPositions.push(position ? position : 'bottom');
        //default, try switching to opposite side
        if (!position && this.usedPositions.indexOf('top') < 0) {
          this.$element.addClass('top');
        } else if (position === 'top' && this.usedPositions.indexOf('bottom') < 0) {
          this.$element.removeClass(position);
        } else if (position === 'left' && this.usedPositions.indexOf('right') < 0) {
          this.$element.removeClass(position).addClass('right');
        } else if (position === 'right' && this.usedPositions.indexOf('left') < 0) {
          this.$element.removeClass(position).addClass('left');
        }

        //if default change didn't work, try bottom or left first
        else if (!position && this.usedPositions.indexOf('top') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.$element.addClass('left');
          } else if (position === 'top' && this.usedPositions.indexOf('bottom') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.$element.removeClass(position).addClass('left');
          } else if (position === 'left' && this.usedPositions.indexOf('right') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.$element.removeClass(position);
          } else if (position === 'right' && this.usedPositions.indexOf('left') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.$element.removeClass(position);
          }
          //if nothing cleared, set to bottom
          else {
              this.$element.removeClass(position);
            }
        this.classChanged = true;
        this.counter--;
      }

      /**
       * Sets the position and orientation of the dropdown pane, checks for collisions.
       * Recursively calls itself if a collision is detected, with a new position class.
       * @function
       * @private
       */

    }, {
      key: '_setPosition',
      value: function _setPosition() {
        if (this.$anchor.attr('aria-expanded') === 'false') {
          return false;
        }
        var position = this.getPositionClass(),
            $eleDims = Foundation.Box.GetDimensions(this.$element),
            $anchorDims = Foundation.Box.GetDimensions(this.$anchor),
            _this = this,
            direction = position === 'left' ? 'left' : position === 'right' ? 'left' : 'top',
            param = direction === 'top' ? 'height' : 'width',
            offset = param === 'height' ? this.options.vOffset : this.options.hOffset;

        if ($eleDims.width >= $eleDims.windowDims.width || !this.counter && !Foundation.Box.ImNotTouchingYou(this.$element)) {
          this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$anchor, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
            'width': $eleDims.windowDims.width - this.options.hOffset * 2,
            'height': 'auto'
          });
          this.classChanged = true;
          return false;
        }

        this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$anchor, position, this.options.vOffset, this.options.hOffset));

        while (!Foundation.Box.ImNotTouchingYou(this.$element, false, true) && this.counter) {
          this._reposition(position);
          this._setPosition();
        }
      }

      /**
       * Adds event listeners to the element utilizing the triggers utility library.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;
        this.$element.on({
          'open.zf.trigger': this.open.bind(this),
          'close.zf.trigger': this.close.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this),
          'resizeme.zf.trigger': this._setPosition.bind(this)
        });

        if (this.options.hover) {
          this.$anchor.off('mouseenter.zf.dropdown mouseleave.zf.dropdown').on('mouseenter.zf.dropdown', function () {
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function () {
              _this.open();
              _this.$anchor.data('hover', true);
            }, _this.options.hoverDelay);
          }).on('mouseleave.zf.dropdown', function () {
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function () {
              _this.close();
              _this.$anchor.data('hover', false);
            }, _this.options.hoverDelay);
          });
          if (this.options.hoverPane) {
            this.$element.off('mouseenter.zf.dropdown mouseleave.zf.dropdown').on('mouseenter.zf.dropdown', function () {
              clearTimeout(_this.timeout);
            }).on('mouseleave.zf.dropdown', function () {
              clearTimeout(_this.timeout);
              _this.timeout = setTimeout(function () {
                _this.close();
                _this.$anchor.data('hover', false);
              }, _this.options.hoverDelay);
            });
          }
        }
        this.$anchor.add(this.$element).on('keydown.zf.dropdown', function (e) {

          var $target = $(this),
              visibleFocusableElements = Foundation.Keyboard.findFocusable(_this.$element);

          Foundation.Keyboard.handleKey(e, 'Dropdown', {
            tab_forward: function () {
              if (_this.$element.find(':focus').is(visibleFocusableElements.eq(-1))) {
                // left modal downwards, setting focus to first element
                if (_this.options.trapFocus) {
                  // if focus shall be trapped
                  visibleFocusableElements.eq(0).focus();
                  e.preventDefault();
                } else {
                  // if focus is not trapped, close dropdown on focus out
                  _this.close();
                }
              }
            },
            tab_backward: function () {
              if (_this.$element.find(':focus').is(visibleFocusableElements.eq(0)) || _this.$element.is(':focus')) {
                // left modal upwards, setting focus to last element
                if (_this.options.trapFocus) {
                  // if focus shall be trapped
                  visibleFocusableElements.eq(-1).focus();
                  e.preventDefault();
                } else {
                  // if focus is not trapped, close dropdown on focus out
                  _this.close();
                }
              }
            },
            open: function () {
              if ($target.is(_this.$anchor)) {
                _this.open();
                _this.$element.attr('tabindex', -1).focus();
                e.preventDefault();
              }
            },
            close: function () {
              _this.close();
              _this.$anchor.focus();
            }
          });
        });
      }

      /**
       * Adds an event handler to the body to close any dropdowns on a click.
       * @function
       * @private
       */

    }, {
      key: '_addBodyHandler',
      value: function _addBodyHandler() {
        var $body = $(document.body).not(this.$element),
            _this = this;
        $body.off('click.zf.dropdown').on('click.zf.dropdown', function (e) {
          if (_this.$anchor.is(e.target) || _this.$anchor.find(e.target).length) {
            return;
          }
          if (_this.$element.find(e.target).length) {
            return;
          }
          _this.close();
          $body.off('click.zf.dropdown');
        });
      }

      /**
       * Opens the dropdown pane, and fires a bubbling event to close other dropdowns.
       * @function
       * @fires Dropdown#closeme
       * @fires Dropdown#show
       */

    }, {
      key: 'open',
      value: function open() {
        // var _this = this;
        /**
         * Fires to close other open dropdowns
         * @event Dropdown#closeme
         */
        this.$element.trigger('closeme.zf.dropdown', this.$element.attr('id'));
        this.$anchor.addClass('hover').attr({ 'aria-expanded': true });
        // this.$element/*.show()*/;
        this._setPosition();
        this.$element.addClass('is-open').attr({ 'aria-hidden': false });

        if (this.options.autoFocus) {
          var $focusable = Foundation.Keyboard.findFocusable(this.$element);
          if ($focusable.length) {
            $focusable.eq(0).focus();
          }
        }

        if (this.options.closeOnClick) {
          this._addBodyHandler();
        }

        /**
         * Fires once the dropdown is visible.
         * @event Dropdown#show
         */
        this.$element.trigger('show.zf.dropdown', [this.$element]);
      }

      /**
       * Closes the open dropdown pane.
       * @function
       * @fires Dropdown#hide
       */

    }, {
      key: 'close',
      value: function close() {
        if (!this.$element.hasClass('is-open')) {
          return false;
        }
        this.$element.removeClass('is-open').attr({ 'aria-hidden': true });

        this.$anchor.removeClass('hover').attr('aria-expanded', false);

        if (this.classChanged) {
          var curPositionClass = this.getPositionClass();
          if (curPositionClass) {
            this.$element.removeClass(curPositionClass);
          }
          this.$element.addClass(this.options.positionClass)
          /*.hide()*/.css({ height: '', width: '' });
          this.classChanged = false;
          this.counter = 4;
          this.usedPositions.length = 0;
        }
        this.$element.trigger('hide.zf.dropdown', [this.$element]);
      }

      /**
       * Toggles the dropdown pane's visibility.
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.$element.hasClass('is-open')) {
          if (this.$anchor.data('hover')) return;
          this.close();
        } else {
          this.open();
        }
      }

      /**
       * Destroys the dropdown.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.trigger').hide();
        this.$anchor.off('.zf.dropdown');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Dropdown;
  }();

  Dropdown.defaults = {
    /**
     * Amount of time to delay opening a submenu on hover event.
     * @option
     * @example 250
     */
    hoverDelay: 250,
    /**
     * Allow submenus to open on hover events
     * @option
     * @example false
     */
    hover: false,
    /**
     * Don't close dropdown when hovering over dropdown pane
     * @option
     * @example true
     */
    hoverPane: false,
    /**
     * Number of pixels between the dropdown pane and the triggering element on open.
     * @option
     * @example 1
     */
    vOffset: 1,
    /**
     * Number of pixels between the dropdown pane and the triggering element on open.
     * @option
     * @example 1
     */
    hOffset: 1,
    /**
     * Class applied to adjust open position. JS will test and fill this in.
     * @option
     * @example 'top'
     */
    positionClass: '',
    /**
     * Allow the plugin to trap focus to the dropdown pane if opened with keyboard commands.
     * @option
     * @example false
     */
    trapFocus: false,
    /**
     * Allow the plugin to set focus to the first focusable element within the pane, regardless of method of opening.
     * @option
     * @example true
     */
    autoFocus: false,
    /**
     * Allows a click on the body to close the dropdown.
     * @option
     * @example false
     */
    closeOnClick: false
  };

  // Window exports
  Foundation.plugin(Dropdown, 'Dropdown');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * DropdownMenu module.
   * @module foundation.dropdown-menu
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.nest
   */

  var DropdownMenu = function () {
    /**
     * Creates a new instance of DropdownMenu.
     * @class
     * @fires DropdownMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function DropdownMenu(element, options) {
      _classCallCheck(this, DropdownMenu);

      this.$element = element;
      this.options = $.extend({}, DropdownMenu.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'dropdown');
      this._init();

      Foundation.registerPlugin(this, 'DropdownMenu');
      Foundation.Keyboard.register('DropdownMenu', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'previous',
        'ESCAPE': 'close'
      });
    }

    /**
     * Initializes the plugin, and calls _prepareMenu
     * @private
     * @function
     */


    _createClass(DropdownMenu, [{
      key: '_init',
      value: function _init() {
        var subs = this.$element.find('li.is-dropdown-submenu-parent');
        this.$element.children('.is-dropdown-submenu-parent').children('.is-dropdown-submenu').addClass('first-sub');

        this.$menuItems = this.$element.find('[role="menuitem"]');
        this.$tabs = this.$element.children('[role="menuitem"]');
        this.$tabs.find('ul.is-dropdown-submenu').addClass(this.options.verticalClass);

        if (this.$element.hasClass(this.options.rightClass) || this.options.alignment === 'right' || Foundation.rtl() || this.$element.parents('.top-bar-right').is('*')) {
          this.options.alignment = 'right';
          subs.addClass('opens-left');
        } else {
          subs.addClass('opens-right');
        }
        this.changed = false;
        this._events();
      }
    }, {
      key: '_events',

      /**
       * Adds event listeners to elements within the menu
       * @private
       * @function
       */
      value: function _events() {
        var _this = this,
            hasTouch = 'ontouchstart' in window || typeof window.ontouchstart !== 'undefined',
            parClass = 'is-dropdown-submenu-parent';

        if (this.options.clickOpen || hasTouch) {
          this.$menuItems.on('click.zf.dropdownmenu touchstart.zf.dropdownmenu', function (e) {
            var $elem = $(e.target).parentsUntil('ul', '.' + parClass),
                hasSub = $elem.hasClass(parClass),
                hasClicked = $elem.attr('data-is-click') === 'true',
                $sub = $elem.children('.is-dropdown-submenu');

            if (hasSub) {
              if (hasClicked) {
                if (!_this.options.closeOnClick || !_this.options.clickOpen && !hasTouch || _this.options.forceFollow && hasTouch) {
                  return;
                } else {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                  _this._hide($elem);
                }
              } else {
                e.preventDefault();
                e.stopImmediatePropagation();
                _this._show($elem.children('.is-dropdown-submenu'));
                $elem.add($elem.parentsUntil(_this.$element, '.' + parClass)).attr('data-is-click', true);
              }
            } else {
              return;
            }
          });
        }

        if (!this.options.disableHover) {
          this.$menuItems.on('mouseenter.zf.dropdownmenu', function (e) {
            e.stopImmediatePropagation();
            var $elem = $(this),
                hasSub = $elem.hasClass(parClass);

            if (hasSub) {
              clearTimeout(_this.delay);
              _this.delay = setTimeout(function () {
                _this._show($elem.children('.is-dropdown-submenu'));
              }, _this.options.hoverDelay);
            }
          }).on('mouseleave.zf.dropdownmenu', function (e) {
            var $elem = $(this),
                hasSub = $elem.hasClass(parClass);
            if (hasSub && _this.options.autoclose) {
              if ($elem.attr('data-is-click') === 'true' && _this.options.clickOpen) {
                return false;
              }

              clearTimeout(_this.delay);
              _this.delay = setTimeout(function () {
                _this._hide($elem);
              }, _this.options.closingTime);
            }
          });
        }
        this.$menuItems.on('keydown.zf.dropdownmenu', function (e) {
          var $element = $(e.target).parentsUntil('ul', '[role="menuitem"]'),
              isTab = _this.$tabs.index($element) > -1,
              $elements = isTab ? _this.$tabs : $element.siblings('li').add($element),
              $prevElement,
              $nextElement;

          $elements.each(function (i) {
            if ($(this).is($element)) {
              $prevElement = $elements.eq(i - 1);
              $nextElement = $elements.eq(i + 1);
              return;
            }
          });

          var nextSibling = function () {
            if (!$element.is(':last-child')) $nextElement.children('a:first').focus();
          },
              prevSibling = function () {
            $prevElement.children('a:first').focus();
          },
              openSub = function () {
            var $sub = $element.children('ul.is-dropdown-submenu');
            if ($sub.length) {
              _this._show($sub);
              $element.find('li > a:first').focus();
            } else {
              return;
            }
          },
              closeSub = function () {
            //if ($element.is(':first-child')) {
            var close = $element.parent('ul').parent('li');
            close.children('a:first').focus();
            _this._hide(close);
            //}
          };
          var functions = {
            open: openSub,
            close: function () {
              _this._hide(_this.$element);
              _this.$menuItems.find('a:first').focus(); // focus to first element
            },
            handled: function () {
              e.preventDefault();
              e.stopImmediatePropagation();
            }
          };

          if (isTab) {
            if (_this.vertical) {
              // vertical menu
              if (_this.options.alignment === 'left') {
                // left aligned
                $.extend(functions, {
                  down: nextSibling,
                  up: prevSibling,
                  next: openSub,
                  previous: closeSub
                });
              } else {
                // right aligned
                $.extend(functions, {
                  down: nextSibling,
                  up: prevSibling,
                  next: closeSub,
                  previous: openSub
                });
              }
            } else {
              // horizontal menu
              $.extend(functions, {
                next: nextSibling,
                previous: prevSibling,
                down: openSub,
                up: closeSub
              });
            }
          } else {
            // not tabs -> one sub
            if (_this.options.alignment === 'left') {
              // left aligned
              $.extend(functions, {
                next: openSub,
                previous: closeSub,
                down: nextSibling,
                up: prevSibling
              });
            } else {
              // right aligned
              $.extend(functions, {
                next: closeSub,
                previous: openSub,
                down: nextSibling,
                up: prevSibling
              });
            }
          }
          Foundation.Keyboard.handleKey(e, 'DropdownMenu', functions);
        });
      }

      /**
       * Adds an event handler to the body to close any dropdowns on a click.
       * @function
       * @private
       */

    }, {
      key: '_addBodyHandler',
      value: function _addBodyHandler() {
        var $body = $(document.body),
            _this = this;
        $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu').on('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu', function (e) {
          var $link = _this.$element.find(e.target);
          if ($link.length) {
            return;
          }

          _this._hide();
          $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu');
        });
      }

      /**
       * Opens a dropdown pane, and checks for collisions first.
       * @param {jQuery} $sub - ul element that is a submenu to show
       * @function
       * @private
       * @fires DropdownMenu#show
       */

    }, {
      key: '_show',
      value: function _show($sub) {
        var idx = this.$tabs.index(this.$tabs.filter(function (i, el) {
          return $(el).find($sub).length > 0;
        }));
        var $sibs = $sub.parent('li.is-dropdown-submenu-parent').siblings('li.is-dropdown-submenu-parent');
        this._hide($sibs, idx);
        $sub.css('visibility', 'hidden').addClass('js-dropdown-active').attr({ 'aria-hidden': false }).parent('li.is-dropdown-submenu-parent').addClass('is-active').attr({ 'aria-expanded': true });
        var clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
        if (!clear) {
          var oldClass = this.options.alignment === 'left' ? '-right' : '-left',
              $parentLi = $sub.parent('.is-dropdown-submenu-parent');
          $parentLi.removeClass('opens' + oldClass).addClass('opens-' + this.options.alignment);
          clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
          if (!clear) {
            $parentLi.removeClass('opens-' + this.options.alignment).addClass('opens-inner');
          }
          this.changed = true;
        }
        $sub.css('visibility', '');
        if (this.options.closeOnClick) {
          this._addBodyHandler();
        }
        /**
         * Fires when the new dropdown pane is visible.
         * @event DropdownMenu#show
         */
        this.$element.trigger('show.zf.dropdownmenu', [$sub]);
      }

      /**
       * Hides a single, currently open dropdown pane, if passed a parameter, otherwise, hides everything.
       * @function
       * @param {jQuery} $elem - element with a submenu to hide
       * @param {Number} idx - index of the $tabs collection to hide
       * @private
       */

    }, {
      key: '_hide',
      value: function _hide($elem, idx) {
        var $toClose;
        if ($elem && $elem.length) {
          $toClose = $elem;
        } else if (idx !== undefined) {
          $toClose = this.$tabs.not(function (i, el) {
            return i === idx;
          });
        } else {
          $toClose = this.$element;
        }
        var somethingToClose = $toClose.hasClass('is-active') || $toClose.find('.is-active').length > 0;

        if (somethingToClose) {
          $toClose.find('li.is-active').add($toClose).attr({
            'aria-expanded': false,
            'data-is-click': false
          }).removeClass('is-active');

          $toClose.find('ul.js-dropdown-active').attr({
            'aria-hidden': true
          }).removeClass('js-dropdown-active');

          if (this.changed || $toClose.find('opens-inner').length) {
            var oldClass = this.options.alignment === 'left' ? 'right' : 'left';
            $toClose.find('li.is-dropdown-submenu-parent').add($toClose).removeClass('opens-inner opens-' + this.options.alignment).addClass('opens-' + oldClass);
            this.changed = false;
          }
          /**
           * Fires when the open menus are closed.
           * @event DropdownMenu#hide
           */
          this.$element.trigger('hide.zf.dropdownmenu', [$toClose]);
        }
      }

      /**
       * Destroys the plugin.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$menuItems.off('.zf.dropdownmenu').removeAttr('data-is-click').removeClass('is-right-arrow is-left-arrow is-down-arrow opens-right opens-left opens-inner');
        $(document.body).off('.zf.dropdownmenu');
        Foundation.Nest.Burn(this.$element, 'dropdown');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return DropdownMenu;
  }();

  /**
   * Default settings for plugin
   */


  DropdownMenu.defaults = {
    /**
     * Disallows hover events from opening submenus
     * @option
     * @example false
     */
    disableHover: false,
    /**
     * Allow a submenu to automatically close on a mouseleave event, if not clicked open.
     * @option
     * @example true
     */
    autoclose: true,
    /**
     * Amount of time to delay opening a submenu on hover event.
     * @option
     * @example 50
     */
    hoverDelay: 50,
    /**
     * Allow a submenu to open/remain open on parent click event. Allows cursor to move away from menu.
     * @option
     * @example true
     */
    clickOpen: false,
    /**
     * Amount of time to delay closing a submenu on a mouseleave event.
     * @option
     * @example 500
     */

    closingTime: 500,
    /**
     * Position of the menu relative to what direction the submenus should open. Handled by JS.
     * @option
     * @example 'left'
     */
    alignment: 'left',
    /**
     * Allow clicks on the body to close any open submenus.
     * @option
     * @example true
     */
    closeOnClick: true,
    /**
     * Class applied to vertical oriented menus, Foundation default is `vertical`. Update this if using your own class.
     * @option
     * @example 'vertical'
     */
    verticalClass: 'vertical',
    /**
     * Class applied to right-side oriented menus, Foundation default is `align-right`. Update this if using your own class.
     * @option
     * @example 'align-right'
     */
    rightClass: 'align-right',
    /**
     * Boolean to force overide the clicking of links to perform default action, on second touch event for mobile.
     * @option
     * @example false
     */
    forceFollow: true
  };

  // Window exports
  Foundation.plugin(DropdownMenu, 'DropdownMenu');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Equalizer module.
   * @module foundation.equalizer
   */

  var Equalizer = function () {
    /**
     * Creates a new instance of Equalizer.
     * @class
     * @fires Equalizer#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Equalizer(element, options) {
      _classCallCheck(this, Equalizer);

      this.$element = element;
      this.options = $.extend({}, Equalizer.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Equalizer');
    }

    /**
     * Initializes the Equalizer plugin and calls functions to get equalizer functioning on load.
     * @private
     */


    _createClass(Equalizer, [{
      key: '_init',
      value: function _init() {
        var eqId = this.$element.attr('data-equalizer') || '';
        var $watched = this.$element.find('[data-equalizer-watch="' + eqId + '"]');

        this.$watched = $watched.length ? $watched : this.$element.find('[data-equalizer-watch]');
        this.$element.attr('data-resize', eqId || Foundation.GetYoDigits(6, 'eq'));

        this.hasNested = this.$element.find('[data-equalizer]').length > 0;
        this.isNested = this.$element.parentsUntil(document.body, '[data-equalizer]').length > 0;
        this.isOn = false;

        var imgs = this.$element.find('img');
        var tooSmall;
        if (this.options.equalizeOn) {
          tooSmall = this._checkMQ();
          $(window).on('changed.zf.mediaquery', this._checkMQ.bind(this));
        } else {
          this._events();
        }
        if (tooSmall !== undefined && tooSmall === false || tooSmall === undefined) {
          if (imgs.length) {
            Foundation.onImagesLoaded(imgs, this._reflow.bind(this));
          } else {
            this._reflow();
          }
        }
      }

      /**
       * Removes event listeners if the breakpoint is too small.
       * @private
       */

    }, {
      key: '_pauseEvents',
      value: function _pauseEvents() {
        this.isOn = false;
        this.$element.off('.zf.equalizer resizeme.zf.trigger');
      }

      /**
       * Initializes events for Equalizer.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;
        this._pauseEvents();
        if (this.hasNested) {
          this.$element.on('postequalized.zf.equalizer', function (e) {
            if (e.target !== _this.$element[0]) {
              _this._reflow();
            }
          });
        } else {
          this.$element.on('resizeme.zf.trigger', this._reflow.bind(this));
        }
        this.isOn = true;
      }

      /**
       * Checks the current breakpoint to the minimum required size.
       * @private
       */

    }, {
      key: '_checkMQ',
      value: function _checkMQ() {
        var tooSmall = !Foundation.MediaQuery.atLeast(this.options.equalizeOn);
        if (tooSmall) {
          if (this.isOn) {
            this._pauseEvents();
            this.$watched.css('height', 'auto');
          }
        } else {
          if (!this.isOn) {
            this._events();
          }
        }
        return tooSmall;
      }

      /**
       * A noop version for the plugin
       * @private
       */

    }, {
      key: '_killswitch',
      value: function _killswitch() {
        return;
      }

      /**
       * Calls necessary functions to update Equalizer upon DOM change
       * @private
       */

    }, {
      key: '_reflow',
      value: function _reflow() {
        if (!this.options.equalizeOnStack) {
          if (this._isStacked()) {
            this.$watched.css('height', 'auto');
            return false;
          }
        }
        if (this.options.equalizeByRow) {
          this.getHeightsByRow(this.applyHeightByRow.bind(this));
        } else {
          this.getHeights(this.applyHeight.bind(this));
        }
      }

      /**
       * Manually determines if the first 2 elements are *NOT* stacked.
       * @private
       */

    }, {
      key: '_isStacked',
      value: function _isStacked() {
        return this.$watched[0].offsetTop !== this.$watched[1].offsetTop;
      }

      /**
       * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
       * @param {Function} cb - A non-optional callback to return the heights array to.
       * @returns {Array} heights - An array of heights of children within Equalizer container
       */

    }, {
      key: 'getHeights',
      value: function getHeights(cb) {
        var heights = [];
        for (var i = 0, len = this.$watched.length; i < len; i++) {
          this.$watched[i].style.height = 'auto';
          heights.push(this.$watched[i].offsetHeight);
        }
        cb(heights);
      }

      /**
       * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
       * @param {Function} cb - A non-optional callback to return the heights array to.
       * @returns {Array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
       */

    }, {
      key: 'getHeightsByRow',
      value: function getHeightsByRow(cb) {
        var lastElTopOffset = this.$watched.length ? this.$watched.first().offset().top : 0,
            groups = [],
            group = 0;
        //group by Row
        groups[group] = [];
        for (var i = 0, len = this.$watched.length; i < len; i++) {
          this.$watched[i].style.height = 'auto';
          //maybe could use this.$watched[i].offsetTop
          var elOffsetTop = $(this.$watched[i]).offset().top;
          if (elOffsetTop != lastElTopOffset) {
            group++;
            groups[group] = [];
            lastElTopOffset = elOffsetTop;
          }
          groups[group].push([this.$watched[i], this.$watched[i].offsetHeight]);
        }

        for (var j = 0, ln = groups.length; j < ln; j++) {
          var heights = $(groups[j]).map(function () {
            return this[1];
          }).get();
          var max = Math.max.apply(null, heights);
          groups[j].push(max);
        }
        cb(groups);
      }

      /**
       * Changes the CSS height property of each child in an Equalizer parent to match the tallest
       * @param {array} heights - An array of heights of children within Equalizer container
       * @fires Equalizer#preequalized
       * @fires Equalizer#postequalized
       */

    }, {
      key: 'applyHeight',
      value: function applyHeight(heights) {
        var max = Math.max.apply(null, heights);
        /**
         * Fires before the heights are applied
         * @event Equalizer#preequalized
         */
        this.$element.trigger('preequalized.zf.equalizer');

        this.$watched.css('height', max);

        /**
         * Fires when the heights have been applied
         * @event Equalizer#postequalized
         */
        this.$element.trigger('postequalized.zf.equalizer');
      }

      /**
       * Changes the CSS height property of each child in an Equalizer parent to match the tallest by row
       * @param {array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
       * @fires Equalizer#preequalized
       * @fires Equalizer#preequalizedRow
       * @fires Equalizer#postequalizedRow
       * @fires Equalizer#postequalized
       */

    }, {
      key: 'applyHeightByRow',
      value: function applyHeightByRow(groups) {
        /**
         * Fires before the heights are applied
         */
        this.$element.trigger('preequalized.zf.equalizer');
        for (var i = 0, len = groups.length; i < len; i++) {
          var groupsILength = groups[i].length,
              max = groups[i][groupsILength - 1];
          if (groupsILength <= 2) {
            $(groups[i][0][0]).css({ 'height': 'auto' });
            continue;
          }
          /**
            * Fires before the heights per row are applied
            * @event Equalizer#preequalizedRow
            */
          this.$element.trigger('preequalizedrow.zf.equalizer');
          for (var j = 0, lenJ = groupsILength - 1; j < lenJ; j++) {
            $(groups[i][j][0]).css({ 'height': max });
          }
          /**
            * Fires when the heights per row have been applied
            * @event Equalizer#postequalizedRow
            */
          this.$element.trigger('postequalizedrow.zf.equalizer');
        }
        /**
         * Fires when the heights have been applied
         */
        this.$element.trigger('postequalized.zf.equalizer');
      }

      /**
       * Destroys an instance of Equalizer.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this._pauseEvents();
        this.$watched.css('height', 'auto');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Equalizer;
  }();

  /**
   * Default settings for plugin
   */


  Equalizer.defaults = {
    /**
     * Enable height equalization when stacked on smaller screens.
     * @option
     * @example true
     */
    equalizeOnStack: true,
    /**
     * Enable height equalization row by row.
     * @option
     * @example false
     */
    equalizeByRow: false,
    /**
     * String representing the minimum breakpoint size the plugin should equalize heights on.
     * @option
     * @example 'medium'
     */
    equalizeOn: ''
  };

  // Window exports
  Foundation.plugin(Equalizer, 'Equalizer');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Interchange module.
   * @module foundation.interchange
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.timerAndImageLoader
   */

  var Interchange = function () {
    /**
     * Creates a new instance of Interchange.
     * @class
     * @fires Interchange#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Interchange(element, options) {
      _classCallCheck(this, Interchange);

      this.$element = element;
      this.options = $.extend({}, Interchange.defaults, options);
      this.rules = [];
      this.currentPath = '';

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'Interchange');
    }

    /**
     * Initializes the Interchange plugin and calls functions to get interchange functioning on load.
     * @function
     * @private
     */


    _createClass(Interchange, [{
      key: '_init',
      value: function _init() {
        this._addBreakpoints();
        this._generateRules();
        this._reflow();
      }

      /**
       * Initializes events for Interchange.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        $(window).on('resize.zf.interchange', Foundation.util.throttle(this._reflow.bind(this), 50));
      }

      /**
       * Calls necessary functions to update Interchange upon DOM change
       * @function
       * @private
       */

    }, {
      key: '_reflow',
      value: function _reflow() {
        var match;

        // Iterate through each rule, but only save the last match
        for (var i in this.rules) {
          var rule = this.rules[i];

          if (window.matchMedia(rule.query).matches) {
            match = rule;
          }
        }

        if (match) {
          this.replace(match.path);
        }
      }

      /**
       * Gets the Foundation breakpoints and adds them to the Interchange.SPECIAL_QUERIES object.
       * @function
       * @private
       */

    }, {
      key: '_addBreakpoints',
      value: function _addBreakpoints() {
        for (var i in Foundation.MediaQuery.queries) {
          var query = Foundation.MediaQuery.queries[i];
          Interchange.SPECIAL_QUERIES[query.name] = query.value;
        }
      }

      /**
       * Checks the Interchange element for the provided media query + content pairings
       * @function
       * @private
       * @param {Object} element - jQuery object that is an Interchange instance
       * @returns {Array} scenarios - Array of objects that have 'mq' and 'path' keys with corresponding keys
       */

    }, {
      key: '_generateRules',
      value: function _generateRules(element) {
        var rulesList = [];
        var rules;

        if (this.options.rules) {
          rules = this.options.rules;
        } else {
          rules = this.$element.data('interchange').match(/\[.*?\]/g);
        }

        for (var i in rules) {
          var rule = rules[i].slice(1, -1).split(', ');
          var path = rule.slice(0, -1).join('');
          var query = rule[rule.length - 1];

          if (Interchange.SPECIAL_QUERIES[query]) {
            query = Interchange.SPECIAL_QUERIES[query];
          }

          rulesList.push({
            path: path,
            query: query
          });
        }

        this.rules = rulesList;
      }

      /**
       * Update the `src` property of an image, or change the HTML of a container, to the specified path.
       * @function
       * @param {String} path - Path to the image or HTML partial.
       * @fires Interchange#replaced
       */

    }, {
      key: 'replace',
      value: function replace(path) {
        if (this.currentPath === path) return;

        var _this = this,
            trigger = 'replaced.zf.interchange';

        // Replacing images
        if (this.$element[0].nodeName === 'IMG') {
          this.$element.attr('src', path).load(function () {
            _this.currentPath = path;
          }).trigger(trigger);
        }
        // Replacing background images
        else if (path.match(/\.(gif|jpg|jpeg|png|svg|tiff)([?#].*)?/i)) {
            this.$element.css({ 'background-image': 'url(' + path + ')' }).trigger(trigger);
          }
          // Replacing HTML
          else {
              $.get(path, function (response) {
                _this.$element.html(response).trigger(trigger);
                $(response).foundation();
                _this.currentPath = path;
              });
            }

        /**
         * Fires when content in an Interchange element is done being loaded.
         * @event Interchange#replaced
         */
        // this.$element.trigger('replaced.zf.interchange');
      }

      /**
       * Destroys an instance of interchange.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        //TODO this.
      }
    }]);

    return Interchange;
  }();

  /**
   * Default settings for plugin
   */


  Interchange.defaults = {
    /**
     * Rules to be applied to Interchange elements. Set with the `data-interchange` array notation.
     * @option
     */
    rules: null
  };

  Interchange.SPECIAL_QUERIES = {
    'landscape': 'screen and (orientation: landscape)',
    'portrait': 'screen and (orientation: portrait)',
    'retina': 'only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (min--moz-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min-device-pixel-ratio: 2), only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx)'
  };

  // Window exports
  Foundation.plugin(Interchange, 'Interchange');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Magellan module.
   * @module foundation.magellan
   */

  var Magellan = function () {
    /**
     * Creates a new instance of Magellan.
     * @class
     * @fires Magellan#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Magellan(element, options) {
      _classCallCheck(this, Magellan);

      this.$element = element;
      this.options = $.extend({}, Magellan.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Magellan');
    }

    /**
     * Initializes the Magellan plugin and calls functions to get equalizer functioning on load.
     * @private
     */


    _createClass(Magellan, [{
      key: '_init',
      value: function _init() {
        var id = this.$element[0].id || Foundation.GetYoDigits(6, 'magellan');
        var _this = this;
        this.$targets = $('[data-magellan-target]');
        this.$links = this.$element.find('a');
        this.$element.attr({
          'data-resize': id,
          'data-scroll': id,
          'id': id
        });
        this.$active = $();
        this.scrollPos = parseInt(window.pageYOffset, 10);

        this._events();
      }

      /**
       * Calculates an array of pixel values that are the demarcation lines between locations on the page.
       * Can be invoked if new elements are added or the size of a location changes.
       * @function
       */

    }, {
      key: 'calcPoints',
      value: function calcPoints() {
        var _this = this,
            body = document.body,
            html = document.documentElement;

        this.points = [];
        this.winHeight = Math.round(Math.max(window.innerHeight, html.clientHeight));
        this.docHeight = Math.round(Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight));

        this.$targets.each(function () {
          var $tar = $(this),
              pt = Math.round($tar.offset().top - _this.options.threshold);
          $tar.targetPoint = pt;
          _this.points.push(pt);
        });
      }

      /**
       * Initializes events for Magellan.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this,
            $body = $('html, body'),
            opts = {
          duration: _this.options.animationDuration,
          easing: _this.options.animationEasing
        };
        $(window).one('load', function () {
          if (_this.options.deepLinking) {
            if (location.hash) {
              _this.scrollToLoc(location.hash);
            }
          }
          _this.calcPoints();
          _this._updateActive();
        });

        this.$element.on({
          'resizeme.zf.trigger': this.reflow.bind(this),
          'scrollme.zf.trigger': this._updateActive.bind(this)
        }).on('click.zf.magellan', 'a[href^="#"]', function (e) {
          e.preventDefault();
          var arrival = this.getAttribute('href');
          _this.scrollToLoc(arrival);
        });
      }

      /**
       * Function to scroll to a given location on the page.
       * @param {String} loc - a properly formatted jQuery id selector. Example: '#foo'
       * @function
       */

    }, {
      key: 'scrollToLoc',
      value: function scrollToLoc(loc) {
        var scrollPos = Math.round($(loc).offset().top - this.options.threshold / 2 - this.options.barOffset);

        $('html, body').stop(true).animate({ scrollTop: scrollPos }, this.options.animationDuration, this.options.animationEasing);
      }

      /**
       * Calls necessary functions to update Magellan upon DOM change
       * @function
       */

    }, {
      key: 'reflow',
      value: function reflow() {
        this.calcPoints();
        this._updateActive();
      }

      /**
       * Updates the visibility of an active location link, and updates the url hash for the page, if deepLinking enabled.
       * @private
       * @function
       * @fires Magellan#update
       */

    }, {
      key: '_updateActive',
      value: function _updateActive() /*evt, elem, scrollPos*/{
        var winPos = /*scrollPos ||*/parseInt(window.pageYOffset, 10),
            curIdx;

        if (winPos + this.winHeight === this.docHeight) {
          curIdx = this.points.length - 1;
        } else if (winPos < this.points[0]) {
          curIdx = 0;
        } else {
          var isDown = this.scrollPos < winPos,
              _this = this,
              curVisible = this.points.filter(function (p, i) {
            return isDown ? p <= winPos : p - _this.options.threshold <= winPos; //&& winPos >= _this.points[i -1] - _this.options.threshold;
          });
          curIdx = curVisible.length ? curVisible.length - 1 : 0;
        }

        this.$active.removeClass(this.options.activeClass);
        this.$active = this.$links.eq(curIdx).addClass(this.options.activeClass);

        if (this.options.deepLinking) {
          var hash = this.$active[0].getAttribute('href');
          if (window.history.pushState) {
            window.history.pushState(null, null, hash);
          } else {
            window.location.hash = hash;
          }
        }

        this.scrollPos = winPos;
        /**
         * Fires when magellan is finished updating to the new active element.
         * @event Magellan#update
         */
        this.$element.trigger('update.zf.magellan', [this.$active]);
      }

      /**
       * Destroys an instance of Magellan and resets the url of the window.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.trigger .zf.magellan').find('.' + this.options.activeClass).removeClass(this.options.activeClass);

        if (this.options.deepLinking) {
          var hash = this.$active[0].getAttribute('href');
          window.location.hash.replace(hash, '');
        }

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Magellan;
  }();

  /**
   * Default settings for plugin
   */


  Magellan.defaults = {
    /**
     * Amount of time, in ms, the animated scrolling should take between locations.
     * @option
     * @example 500
     */
    animationDuration: 500,
    /**
     * Animation style to use when scrolling between locations.
     * @option
     * @example 'ease-in-out'
     */
    animationEasing: 'linear',
    /**
     * Number of pixels to use as a marker for location changes.
     * @option
     * @example 50
     */
    threshold: 50,
    /**
     * Class applied to the active locations link on the magellan container.
     * @option
     * @example 'active'
     */
    activeClass: 'active',
    /**
     * Allows the script to manipulate the url of the current page, and if supported, alter the history.
     * @option
     * @example true
     */
    deepLinking: false,
    /**
     * Number of pixels to offset the scroll of the page on item click if using a sticky nav bar.
     * @option
     * @example 25
     */
    barOffset: 0
  };

  // Window exports
  Foundation.plugin(Magellan, 'Magellan');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * OffCanvas module.
   * @module foundation.offcanvas
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.triggers
   * @requires foundation.util.motion
   */

  var OffCanvas = function () {
    /**
     * Creates a new instance of an off-canvas wrapper.
     * @class
     * @fires OffCanvas#init
     * @param {Object} element - jQuery object to initialize.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function OffCanvas(element, options) {
      _classCallCheck(this, OffCanvas);

      this.$element = element;
      this.options = $.extend({}, OffCanvas.defaults, this.$element.data(), options);
      this.$lastTrigger = $();

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'OffCanvas');
    }

    /**
     * Initializes the off-canvas wrapper by adding the exit overlay (if needed).
     * @function
     * @private
     */


    _createClass(OffCanvas, [{
      key: '_init',
      value: function _init() {
        var id = this.$element.attr('id');

        this.$element.attr('aria-hidden', 'true');

        // Find triggers that affect this element and add aria-expanded to them
        $(document).find('[data-open="' + id + '"], [data-close="' + id + '"], [data-toggle="' + id + '"]').attr('aria-expanded', 'false').attr('aria-controls', id);

        // Add a close trigger over the body if necessary
        if (this.options.closeOnClick) {
          if ($('.js-off-canvas-exit').length) {
            this.$exiter = $('.js-off-canvas-exit');
          } else {
            var exiter = document.createElement('div');
            exiter.setAttribute('class', 'js-off-canvas-exit');
            $('[data-off-canvas-content]').append(exiter);

            this.$exiter = $(exiter);
          }
        }

        this.options.isRevealed = this.options.isRevealed || new RegExp(this.options.revealClass, 'g').test(this.$element[0].className);

        if (this.options.isRevealed) {
          this.options.revealOn = this.options.revealOn || this.$element[0].className.match(/(reveal-for-medium|reveal-for-large)/g)[0].split('-')[2];
          this._setMQChecker();
        }
        if (!this.options.transitionTime) {
          this.options.transitionTime = parseFloat(window.getComputedStyle($('[data-off-canvas-wrapper]')[0]).transitionDuration) * 1000;
        }
      }

      /**
       * Adds event handlers to the off-canvas wrapper and the exit overlay.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        this.$element.off('.zf.trigger .zf.offcanvas').on({
          'open.zf.trigger': this.open.bind(this),
          'close.zf.trigger': this.close.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this),
          'keydown.zf.offcanvas': this._handleKeyboard.bind(this)
        });

        if (this.options.closeOnClick && this.$exiter.length) {
          this.$exiter.on({ 'click.zf.offcanvas': this.close.bind(this) });
        }
      }

      /**
       * Applies event listener for elements that will reveal at certain breakpoints.
       * @private
       */

    }, {
      key: '_setMQChecker',
      value: function _setMQChecker() {
        var _this = this;

        $(window).on('changed.zf.mediaquery', function () {
          if (Foundation.MediaQuery.atLeast(_this.options.revealOn)) {
            _this.reveal(true);
          } else {
            _this.reveal(false);
          }
        }).one('load.zf.offcanvas', function () {
          if (Foundation.MediaQuery.atLeast(_this.options.revealOn)) {
            _this.reveal(true);
          }
        });
      }

      /**
       * Handles the revealing/hiding the off-canvas at breakpoints, not the same as open.
       * @param {Boolean} isRevealed - true if element should be revealed.
       * @function
       */

    }, {
      key: 'reveal',
      value: function reveal(isRevealed) {
        var $closer = this.$element.find('[data-close]');
        if (isRevealed) {
          this.close();
          this.isRevealed = true;
          // if (!this.options.forceTop) {
          //   var scrollPos = parseInt(window.pageYOffset);
          //   this.$element[0].style.transform = 'translate(0,' + scrollPos + 'px)';
          // }
          // if (this.options.isSticky) { this._stick(); }
          this.$element.off('open.zf.trigger toggle.zf.trigger');
          if ($closer.length) {
            $closer.hide();
          }
        } else {
          this.isRevealed = false;
          // if (this.options.isSticky || !this.options.forceTop) {
          //   this.$element[0].style.transform = '';
          //   $(window).off('scroll.zf.offcanvas');
          // }
          this.$element.on({
            'open.zf.trigger': this.open.bind(this),
            'toggle.zf.trigger': this.toggle.bind(this)
          });
          if ($closer.length) {
            $closer.show();
          }
        }
      }

      /**
       * Opens the off-canvas menu.
       * @function
       * @param {Object} event - Event object passed from listener.
       * @param {jQuery} trigger - element that triggered the off-canvas to open.
       * @fires OffCanvas#opened
       */

    }, {
      key: 'open',
      value: function open(event, trigger) {
        if (this.$element.hasClass('is-open') || this.isRevealed) {
          return;
        }
        var _this = this,
            $body = $(document.body);

        if (this.options.forceTop) {
          $('body').scrollTop(0);
        }
        // window.pageYOffset = 0;

        // if (!this.options.forceTop) {
        //   var scrollPos = parseInt(window.pageYOffset);
        //   this.$element[0].style.transform = 'translate(0,' + scrollPos + 'px)';
        //   if (this.$exiter.length) {
        //     this.$exiter[0].style.transform = 'translate(0,' + scrollPos + 'px)';
        //   }
        // }
        /**
         * Fires when the off-canvas menu opens.
         * @event OffCanvas#opened
         */
        Foundation.Move(this.options.transitionTime, this.$element, function () {
          $('[data-off-canvas-wrapper]').addClass('is-off-canvas-open is-open-' + _this.options.position);

          _this.$element.addClass('is-open');

          // if (_this.options.isSticky) {
          //   _this._stick();
          // }
        });
        this.$element.attr('aria-hidden', 'false').trigger('opened.zf.offcanvas');

        if (this.options.closeOnClick) {
          this.$exiter.addClass('is-visible');
        }

        if (trigger) {
          this.$lastTrigger = trigger.attr('aria-expanded', 'true');
        }

        if (this.options.autoFocus) {
          this.$element.one(Foundation.transitionend(this.$element), function () {
            _this.$element.find('a, button').eq(0).focus();
          });
        }

        if (this.options.trapFocus) {
          $('[data-off-canvas-content]').attr('tabindex', '-1');
          this._trapFocus();
        }
      }

      /**
       * Traps focus within the offcanvas on open.
       * @private
       */

    }, {
      key: '_trapFocus',
      value: function _trapFocus() {
        var focusable = Foundation.Keyboard.findFocusable(this.$element),
            first = focusable.eq(0),
            last = focusable.eq(-1);

        focusable.off('.zf.offcanvas').on('keydown.zf.offcanvas', function (e) {
          if (e.which === 9 || e.keycode === 9) {
            if (e.target === last[0] && !e.shiftKey) {
              e.preventDefault();
              first.focus();
            }
            if (e.target === first[0] && e.shiftKey) {
              e.preventDefault();
              last.focus();
            }
          }
        });
      }

      /**
       * Allows the offcanvas to appear sticky utilizing translate properties.
       * @private
       */
      // OffCanvas.prototype._stick = function() {
      //   var elStyle = this.$element[0].style;
      //
      //   if (this.options.closeOnClick) {
      //     var exitStyle = this.$exiter[0].style;
      //   }
      //
      //   $(window).on('scroll.zf.offcanvas', function(e) {
      //     console.log(e);
      //     var pageY = window.pageYOffset;
      //     elStyle.transform = 'translate(0,' + pageY + 'px)';
      //     if (exitStyle !== undefined) { exitStyle.transform = 'translate(0,' + pageY + 'px)'; }
      //   });
      //   // this.$element.trigger('stuck.zf.offcanvas');
      // };
      /**
       * Closes the off-canvas menu.
       * @function
       * @param {Function} cb - optional cb to fire after closure.
       * @fires OffCanvas#closed
       */

    }, {
      key: 'close',
      value: function close(cb) {
        if (!this.$element.hasClass('is-open') || this.isRevealed) {
          return;
        }

        var _this = this;

        //  Foundation.Move(this.options.transitionTime, this.$element, function() {
        $('[data-off-canvas-wrapper]').removeClass('is-off-canvas-open is-open-' + _this.options.position);
        _this.$element.removeClass('is-open');
        // Foundation._reflow();
        // });
        this.$element.attr('aria-hidden', 'true')
        /**
         * Fires when the off-canvas menu opens.
         * @event OffCanvas#closed
         */
        .trigger('closed.zf.offcanvas');
        // if (_this.options.isSticky || !_this.options.forceTop) {
        //   setTimeout(function() {
        //     _this.$element[0].style.transform = '';
        //     $(window).off('scroll.zf.offcanvas');
        //   }, this.options.transitionTime);
        // }
        if (this.options.closeOnClick) {
          this.$exiter.removeClass('is-visible');
        }

        this.$lastTrigger.attr('aria-expanded', 'false');
        if (this.options.trapFocus) {
          $('[data-off-canvas-content]').removeAttr('tabindex');
        }
      }

      /**
       * Toggles the off-canvas menu open or closed.
       * @function
       * @param {Object} event - Event object passed from listener.
       * @param {jQuery} trigger - element that triggered the off-canvas to open.
       */

    }, {
      key: 'toggle',
      value: function toggle(event, trigger) {
        if (this.$element.hasClass('is-open')) {
          this.close(event, trigger);
        } else {
          this.open(event, trigger);
        }
      }

      /**
       * Handles keyboard input when detected. When the escape key is pressed, the off-canvas menu closes, and focus is restored to the element that opened the menu.
       * @function
       * @private
       */

    }, {
      key: '_handleKeyboard',
      value: function _handleKeyboard(event) {
        if (event.which !== 27) return;

        event.stopPropagation();
        event.preventDefault();
        this.close();
        this.$lastTrigger.focus();
      }

      /**
       * Destroys the offcanvas plugin.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.close();
        this.$element.off('.zf.trigger .zf.offcanvas');
        this.$exiter.off('.zf.offcanvas');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return OffCanvas;
  }();

  OffCanvas.defaults = {
    /**
     * Allow the user to click outside of the menu to close it.
     * @option
     * @example true
     */
    closeOnClick: true,

    /**
     * Amount of time in ms the open and close transition requires. If none selected, pulls from body style.
     * @option
     * @example 500
     */
    transitionTime: 0,

    /**
     * Direction the offcanvas opens from. Determines class applied to body.
     * @option
     * @example left
     */
    position: 'left',

    /**
     * Force the page to scroll to top on open.
     * @option
     * @example true
     */
    forceTop: true,

    /**
     * Allow the offcanvas to remain open for certain breakpoints.
     * @option
     * @example false
     */
    isRevealed: false,

    /**
     * Breakpoint at which to reveal. JS will use a RegExp to target standard classes, if changing classnames, pass your class with the `revealClass` option.
     * @option
     * @example reveal-for-large
     */
    revealOn: null,

    /**
     * Force focus to the offcanvas on open. If true, will focus the opening trigger on close.
     * @option
     * @example true
     */
    autoFocus: true,

    /**
     * Class used to force an offcanvas to remain open. Foundation defaults for this are `reveal-for-large` & `reveal-for-medium`.
     * @option
     * TODO improve the regex testing for this.
     * @example reveal-for-large
     */
    revealClass: 'reveal-for-',

    /**
     * Triggers optional focus trapping when opening an offcanvas. Sets tabindex of [data-off-canvas-content] to -1 for accessibility purposes.
     * @option
     * @example true
     */
    trapFocus: false
  };

  // Window exports
  Foundation.plugin(OffCanvas, 'OffCanvas');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Orbit module.
   * @module foundation.orbit
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   * @requires foundation.util.timerAndImageLoader
   * @requires foundation.util.touch
   */

  var Orbit = function () {
    /**
    * Creates a new instance of an orbit carousel.
    * @class
    * @param {jQuery} element - jQuery object to make into an Orbit Carousel.
    * @param {Object} options - Overrides to the default plugin settings.
    */
    function Orbit(element, options) {
      _classCallCheck(this, Orbit);

      this.$element = element;
      this.options = $.extend({}, Orbit.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Orbit');
      Foundation.Keyboard.register('Orbit', {
        'ltr': {
          'ARROW_RIGHT': 'next',
          'ARROW_LEFT': 'previous'
        },
        'rtl': {
          'ARROW_LEFT': 'next',
          'ARROW_RIGHT': 'previous'
        }
      });
    }

    /**
    * Initializes the plugin by creating jQuery collections, setting attributes, and starting the animation.
    * @function
    * @private
    */


    _createClass(Orbit, [{
      key: '_init',
      value: function _init() {
        this.$wrapper = this.$element.find('.' + this.options.containerClass);
        this.$slides = this.$element.find('.' + this.options.slideClass);
        var $images = this.$element.find('img'),
            initActive = this.$slides.filter('.is-active');

        if (!initActive.length) {
          this.$slides.eq(0).addClass('is-active');
        }

        if (!this.options.useMUI) {
          this.$slides.addClass('no-motionui');
        }

        if ($images.length) {
          Foundation.onImagesLoaded($images, this._prepareForOrbit.bind(this));
        } else {
          this._prepareForOrbit(); //hehe
        }

        if (this.options.bullets) {
          this._loadBullets();
        }

        this._events();

        if (this.options.autoPlay && this.$slides.length > 1) {
          this.geoSync();
        }

        if (this.options.accessible) {
          // allow wrapper to be focusable to enable arrow navigation
          this.$wrapper.attr('tabindex', 0);
        }
      }

      /**
      * Creates a jQuery collection of bullets, if they are being used.
      * @function
      * @private
      */

    }, {
      key: '_loadBullets',
      value: function _loadBullets() {
        this.$bullets = this.$element.find('.' + this.options.boxOfBullets).find('button');
      }

      /**
      * Sets a `timer` object on the orbit, and starts the counter for the next slide.
      * @function
      */

    }, {
      key: 'geoSync',
      value: function geoSync() {
        var _this = this;
        this.timer = new Foundation.Timer(this.$element, {
          duration: this.options.timerDelay,
          infinite: false
        }, function () {
          _this.changeSlide(true);
        });
        this.timer.start();
      }

      /**
      * Sets wrapper and slide heights for the orbit.
      * @function
      * @private
      */

    }, {
      key: '_prepareForOrbit',
      value: function _prepareForOrbit() {
        var _this = this;
        this._setWrapperHeight(function (max) {
          _this._setSlideHeight(max);
        });
      }

      /**
      * Calulates the height of each slide in the collection, and uses the tallest one for the wrapper height.
      * @function
      * @private
      * @param {Function} cb - a callback function to fire when complete.
      */

    }, {
      key: '_setWrapperHeight',
      value: function _setWrapperHeight(cb) {
        //rewrite this to `for` loop
        var max = 0,
            temp,
            counter = 0;

        this.$slides.each(function () {
          temp = this.getBoundingClientRect().height;
          $(this).attr('data-slide', counter);

          if (counter) {
            //if not the first slide, set css position and display property
            $(this).css({ 'position': 'relative', 'display': 'none' });
          }
          max = temp > max ? temp : max;
          counter++;
        });

        if (counter === this.$slides.length) {
          this.$wrapper.css({ 'height': max }); //only change the wrapper height property once.
          cb(max); //fire callback with max height dimension.
        }
      }

      /**
      * Sets the max-height of each slide.
      * @function
      * @private
      */

    }, {
      key: '_setSlideHeight',
      value: function _setSlideHeight(height) {
        this.$slides.each(function () {
          $(this).css('max-height', height);
        });
      }

      /**
      * Adds event listeners to basically everything within the element.
      * @function
      * @private
      */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        //***************************************
        //**Now using custom event - thanks to:**
        //**      Yohai Ararat of Toronto      **
        //***************************************
        if (this.$slides.length > 1) {

          if (this.options.swipe) {
            this.$slides.off('swipeleft.zf.orbit swiperight.zf.orbit').on('swipeleft.zf.orbit', function (e) {
              e.preventDefault();
              _this.changeSlide(true);
            }).on('swiperight.zf.orbit', function (e) {
              e.preventDefault();
              _this.changeSlide(false);
            });
          }
          //***************************************

          if (this.options.autoPlay) {
            this.$slides.on('click.zf.orbit', function () {
              _this.$element.data('clickedOn', _this.$element.data('clickedOn') ? false : true);
              _this.timer[_this.$element.data('clickedOn') ? 'pause' : 'start']();
            });

            if (this.options.pauseOnHover) {
              this.$element.on('mouseenter.zf.orbit', function () {
                _this.timer.pause();
              }).on('mouseleave.zf.orbit', function () {
                if (!_this.$element.data('clickedOn')) {
                  _this.timer.start();
                }
              });
            }
          }

          if (this.options.navButtons) {
            var $controls = this.$element.find('.' + this.options.nextClass + ', .' + this.options.prevClass);
            $controls.attr('tabindex', 0)
            //also need to handle enter/return and spacebar key presses
            .on('click.zf.orbit touchend.zf.orbit', function (e) {
              e.preventDefault();
              _this.changeSlide($(this).hasClass(_this.options.nextClass));
            });
          }

          if (this.options.bullets) {
            this.$bullets.on('click.zf.orbit touchend.zf.orbit', function () {
              if (/is-active/g.test(this.className)) {
                return false;
              } //if this is active, kick out of function.
              var idx = $(this).data('slide'),
                  ltr = idx > _this.$slides.filter('.is-active').data('slide'),
                  $slide = _this.$slides.eq(idx);

              _this.changeSlide(ltr, $slide, idx);
            });
          }

          this.$wrapper.add(this.$bullets).on('keydown.zf.orbit', function (e) {
            // handle keyboard event with keyboard util
            Foundation.Keyboard.handleKey(e, 'Orbit', {
              next: function () {
                _this.changeSlide(true);
              },
              previous: function () {
                _this.changeSlide(false);
              },
              handled: function () {
                // if bullet is focused, make sure focus moves
                if ($(e.target).is(_this.$bullets)) {
                  _this.$bullets.filter('.is-active').focus();
                }
              }
            });
          });
        }
      }

      /**
      * Changes the current slide to a new one.
      * @function
      * @param {Boolean} isLTR - flag if the slide should move left to right.
      * @param {jQuery} chosenSlide - the jQuery element of the slide to show next, if one is selected.
      * @param {Number} idx - the index of the new slide in its collection, if one chosen.
      * @fires Orbit#slidechange
      */

    }, {
      key: 'changeSlide',
      value: function changeSlide(isLTR, chosenSlide, idx) {
        var $curSlide = this.$slides.filter('.is-active').eq(0);

        if (/mui/g.test($curSlide[0].className)) {
          return false;
        } //if the slide is currently animating, kick out of the function

        var $firstSlide = this.$slides.first(),
            $lastSlide = this.$slides.last(),
            dirIn = isLTR ? 'Right' : 'Left',
            dirOut = isLTR ? 'Left' : 'Right',
            _this = this,
            $newSlide;

        if (!chosenSlide) {
          //most of the time, this will be auto played or clicked from the navButtons.
          $newSlide = isLTR ? //if wrapping enabled, check to see if there is a `next` or `prev` sibling, if not, select the first or last slide to fill in. if wrapping not enabled, attempt to select `next` or `prev`, if there's nothing there, the function will kick out on next step. CRAZY NESTED TERNARIES!!!!!
          this.options.infiniteWrap ? $curSlide.next('.' + this.options.slideClass).length ? $curSlide.next('.' + this.options.slideClass) : $firstSlide : $curSlide.next('.' + this.options.slideClass) : //pick next slide if moving left to right
          this.options.infiniteWrap ? $curSlide.prev('.' + this.options.slideClass).length ? $curSlide.prev('.' + this.options.slideClass) : $lastSlide : $curSlide.prev('.' + this.options.slideClass); //pick prev slide if moving right to left
        } else {
          $newSlide = chosenSlide;
        }

        if ($newSlide.length) {
          if (this.options.bullets) {
            idx = idx || this.$slides.index($newSlide); //grab index to update bullets
            this._updateBullets(idx);
          }

          if (this.options.useMUI) {
            Foundation.Motion.animateIn($newSlide.addClass('is-active').css({ 'position': 'absolute', 'top': 0 }), this.options['animInFrom' + dirIn], function () {
              $newSlide.css({ 'position': 'relative', 'display': 'block' }).attr('aria-live', 'polite');
            });

            Foundation.Motion.animateOut($curSlide.removeClass('is-active'), this.options['animOutTo' + dirOut], function () {
              $curSlide.removeAttr('aria-live');
              if (_this.options.autoPlay && !_this.timer.isPaused) {
                _this.timer.restart();
              }
              //do stuff?
            });
          } else {
            $curSlide.removeClass('is-active is-in').removeAttr('aria-live').hide();
            $newSlide.addClass('is-active is-in').attr('aria-live', 'polite').show();
            if (this.options.autoPlay && !this.timer.isPaused) {
              this.timer.restart();
            }
          }
          /**
          * Triggers when the slide has finished animating in.
          * @event Orbit#slidechange
          */
          this.$element.trigger('slidechange.zf.orbit', [$newSlide]);
        }
      }

      /**
      * Updates the active state of the bullets, if displayed.
      * @function
      * @private
      * @param {Number} idx - the index of the current slide.
      */

    }, {
      key: '_updateBullets',
      value: function _updateBullets(idx) {
        var $oldBullet = this.$element.find('.' + this.options.boxOfBullets).find('.is-active').removeClass('is-active').blur(),
            span = $oldBullet.find('span:last').detach(),
            $newBullet = this.$bullets.eq(idx).addClass('is-active').append(span);
      }

      /**
      * Destroys the carousel and hides the element.
      * @function
      */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.orbit').find('*').off('.zf.orbit').end().hide();
        Foundation.unregisterPlugin(this);
      }
    }]);

    return Orbit;
  }();

  Orbit.defaults = {
    /**
    * Tells the JS to look for and loadBullets.
    * @option
    * @example true
    */
    bullets: true,
    /**
    * Tells the JS to apply event listeners to nav buttons
    * @option
    * @example true
    */
    navButtons: true,
    /**
    * motion-ui animation class to apply
    * @option
    * @example 'slide-in-right'
    */
    animInFromRight: 'slide-in-right',
    /**
    * motion-ui animation class to apply
    * @option
    * @example 'slide-out-right'
    */
    animOutToRight: 'slide-out-right',
    /**
    * motion-ui animation class to apply
    * @option
    * @example 'slide-in-left'
    *
    */
    animInFromLeft: 'slide-in-left',
    /**
    * motion-ui animation class to apply
    * @option
    * @example 'slide-out-left'
    */
    animOutToLeft: 'slide-out-left',
    /**
    * Allows Orbit to automatically animate on page load.
    * @option
    * @example true
    */
    autoPlay: true,
    /**
    * Amount of time, in ms, between slide transitions
    * @option
    * @example 5000
    */
    timerDelay: 5000,
    /**
    * Allows Orbit to infinitely loop through the slides
    * @option
    * @example true
    */
    infiniteWrap: true,
    /**
    * Allows the Orbit slides to bind to swipe events for mobile, requires an additional util library
    * @option
    * @example true
    */
    swipe: true,
    /**
    * Allows the timing function to pause animation on hover.
    * @option
    * @example true
    */
    pauseOnHover: true,
    /**
    * Allows Orbit to bind keyboard events to the slider, to animate frames with arrow keys
    * @option
    * @example true
    */
    accessible: true,
    /**
    * Class applied to the container of Orbit
    * @option
    * @example 'orbit-container'
    */
    containerClass: 'orbit-container',
    /**
    * Class applied to individual slides.
    * @option
    * @example 'orbit-slide'
    */
    slideClass: 'orbit-slide',
    /**
    * Class applied to the bullet container. You're welcome.
    * @option
    * @example 'orbit-bullets'
    */
    boxOfBullets: 'orbit-bullets',
    /**
    * Class applied to the `next` navigation button.
    * @option
    * @example 'orbit-next'
    */
    nextClass: 'orbit-next',
    /**
    * Class applied to the `previous` navigation button.
    * @option
    * @example 'orbit-previous'
    */
    prevClass: 'orbit-previous',
    /**
    * Boolean to flag the js to use motion ui classes or not. Default to true for backwards compatability.
    * @option
    * @example true
    */
    useMUI: true
  };

  // Window exports
  Foundation.plugin(Orbit, 'Orbit');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * ResponsiveMenu module.
   * @module foundation.responsiveMenu
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.accordionMenu
   * @requires foundation.util.drilldown
   * @requires foundation.util.dropdown-menu
   */

  var ResponsiveMenu = function () {
    /**
     * Creates a new instance of a responsive menu.
     * @class
     * @fires ResponsiveMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function ResponsiveMenu(element, options) {
      _classCallCheck(this, ResponsiveMenu);

      this.$element = $(element);
      this.rules = this.$element.data('responsive-menu');
      this.currentMq = null;
      this.currentPlugin = null;

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveMenu');
    }

    /**
     * Initializes the Menu by parsing the classes from the 'data-ResponsiveMenu' attribute on the element.
     * @function
     * @private
     */


    _createClass(ResponsiveMenu, [{
      key: '_init',
      value: function _init() {
        // The first time an Interchange plugin is initialized, this.rules is converted from a string of "classes" to an object of rules
        if (typeof this.rules === 'string') {
          var rulesTree = {};

          // Parse rules from "classes" pulled from data attribute
          var rules = this.rules.split(' ');

          // Iterate through every rule found
          for (var i = 0; i < rules.length; i++) {
            var rule = rules[i].split('-');
            var ruleSize = rule.length > 1 ? rule[0] : 'small';
            var rulePlugin = rule.length > 1 ? rule[1] : rule[0];

            if (MenuPlugins[rulePlugin] !== null) {
              rulesTree[ruleSize] = MenuPlugins[rulePlugin];
            }
          }

          this.rules = rulesTree;
        }

        if (!$.isEmptyObject(this.rules)) {
          this._checkMediaQueries();
        }
      }

      /**
       * Initializes events for the Menu.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        $(window).on('changed.zf.mediaquery', function () {
          _this._checkMediaQueries();
        });
        // $(window).on('resize.zf.ResponsiveMenu', function() {
        //   _this._checkMediaQueries();
        // });
      }

      /**
       * Checks the current screen width against available media queries. If the media query has changed, and the plugin needed has changed, the plugins will swap out.
       * @function
       * @private
       */

    }, {
      key: '_checkMediaQueries',
      value: function _checkMediaQueries() {
        var matchedMq,
            _this = this;
        // Iterate through each rule and find the last matching rule
        $.each(this.rules, function (key) {
          if (Foundation.MediaQuery.atLeast(key)) {
            matchedMq = key;
          }
        });

        // No match? No dice
        if (!matchedMq) return;

        // Plugin already initialized? We good
        if (this.currentPlugin instanceof this.rules[matchedMq].plugin) return;

        // Remove existing plugin-specific CSS classes
        $.each(MenuPlugins, function (key, value) {
          _this.$element.removeClass(value.cssClass);
        });

        // Add the CSS class for the new plugin
        this.$element.addClass(this.rules[matchedMq].cssClass);

        // Create an instance of the new plugin
        if (this.currentPlugin) this.currentPlugin.destroy();
        this.currentPlugin = new this.rules[matchedMq].plugin(this.$element, {});
      }

      /**
       * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.currentPlugin.destroy();
        $(window).off('.zf.ResponsiveMenu');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return ResponsiveMenu;
  }();

  ResponsiveMenu.defaults = {};

  // The plugin matches the plugin classes with these plugin instances.
  var MenuPlugins = {
    dropdown: {
      cssClass: 'dropdown',
      plugin: Foundation._plugins['dropdown-menu'] || null
    },
    drilldown: {
      cssClass: 'drilldown',
      plugin: Foundation._plugins['drilldown'] || null
    },
    accordion: {
      cssClass: 'accordion-menu',
      plugin: Foundation._plugins['accordion-menu'] || null
    }
  };

  // Window exports
  Foundation.plugin(ResponsiveMenu, 'ResponsiveMenu');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * ResponsiveToggle module.
   * @module foundation.responsiveToggle
   * @requires foundation.util.mediaQuery
   */

  var ResponsiveToggle = function () {
    /**
     * Creates a new instance of Tab Bar.
     * @class
     * @fires ResponsiveToggle#init
     * @param {jQuery} element - jQuery object to attach tab bar functionality to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function ResponsiveToggle(element, options) {
      _classCallCheck(this, ResponsiveToggle);

      this.$element = $(element);
      this.options = $.extend({}, ResponsiveToggle.defaults, this.$element.data(), options);

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveToggle');
    }

    /**
     * Initializes the tab bar by finding the target element, toggling element, and running update().
     * @function
     * @private
     */


    _createClass(ResponsiveToggle, [{
      key: '_init',
      value: function _init() {
        var targetID = this.$element.data('responsive-toggle');
        if (!targetID) {
          console.error('Your tab bar needs an ID of a Menu as the value of data-tab-bar.');
        }

        this.$targetMenu = $('#' + targetID);
        this.$toggler = this.$element.find('[data-toggle]');

        this._update();
      }

      /**
       * Adds necessary event handlers for the tab bar to work.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        $(window).on('changed.zf.mediaquery', this._update.bind(this));

        this.$toggler.on('click.zf.responsiveToggle', this.toggleMenu.bind(this));
      }

      /**
       * Checks the current media query to determine if the tab bar should be visible or hidden.
       * @function
       * @private
       */

    }, {
      key: '_update',
      value: function _update() {
        // Mobile
        if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
          this.$element.show();
          this.$targetMenu.hide();
        }

        // Desktop
        else {
            this.$element.hide();
            this.$targetMenu.show();
          }
      }

      /**
       * Toggles the element attached to the tab bar. The toggle only happens if the screen is small enough to allow it.
       * @function
       * @fires ResponsiveToggle#toggled
       */

    }, {
      key: 'toggleMenu',
      value: function toggleMenu() {
        if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
          this.$targetMenu.toggle(0);

          /**
           * Fires when the element attached to the tab bar toggles.
           * @event ResponsiveToggle#toggled
           */
          this.$element.trigger('toggled.zf.responsiveToggle');
        }
      }
    }, {
      key: 'destroy',
      value: function destroy() {
        //TODO this...
      }
    }]);

    return ResponsiveToggle;
  }();

  ResponsiveToggle.defaults = {
    /**
     * The breakpoint after which the menu is always shown, and the tab bar is hidden.
     * @option
     * @example 'medium'
     */
    hideFor: 'medium'
  };

  // Window exports
  Foundation.plugin(ResponsiveToggle, 'ResponsiveToggle');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Reveal module.
   * @module foundation.reveal
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.motion if using animations
   */

  var Reveal = function () {
    /**
     * Creates a new instance of Reveal.
     * @class
     * @param {jQuery} element - jQuery object to use for the modal.
     * @param {Object} options - optional parameters.
     */
    function Reveal(element, options) {
      _classCallCheck(this, Reveal);

      this.$element = element;
      this.options = $.extend({}, Reveal.defaults, this.$element.data(), options);
      this._init();

      Foundation.registerPlugin(this, 'Reveal');
      Foundation.Keyboard.register('Reveal', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ESCAPE': 'close',
        'TAB': 'tab_forward',
        'SHIFT_TAB': 'tab_backward'
      });
    }

    /**
     * Initializes the modal by adding the overlay and close buttons, (if selected).
     * @private
     */


    _createClass(Reveal, [{
      key: '_init',
      value: function _init() {
        this.id = this.$element.attr('id');
        this.isActive = false;
        this.cached = { mq: Foundation.MediaQuery.current };
        this.isiOS = iPhoneSniff();

        if (this.isiOS) {
          this.$element.addClass('is-ios');
        }

        this.$anchor = $('[data-open="' + this.id + '"]').length ? $('[data-open="' + this.id + '"]') : $('[data-toggle="' + this.id + '"]');

        if (this.$anchor.length) {
          var anchorId = this.$anchor[0].id || Foundation.GetYoDigits(6, 'reveal');

          this.$anchor.attr({
            'aria-controls': this.id,
            'id': anchorId,
            'aria-haspopup': true,
            'tabindex': 0
          });
          this.$element.attr({ 'aria-labelledby': anchorId });
        }

        if (this.options.fullScreen || this.$element.hasClass('full')) {
          this.options.fullScreen = true;
          this.options.overlay = false;
        }
        if (this.options.overlay && !this.$overlay) {
          this.$overlay = this._makeOverlay(this.id);
        }

        this.$element.attr({
          'role': 'dialog',
          'aria-hidden': true,
          'data-yeti-box': this.id,
          'data-resize': this.id
        });

        if (this.$overlay) {
          this.$element.detach().appendTo(this.$overlay);
        } else {
          this.$element.detach().appendTo($('body'));
          this.$element.addClass('without-overlay');
        }
        this._events();
        if (this.options.deepLink && window.location.hash === '#' + this.id) {
          $(window).one('load.zf.reveal', this.open.bind(this));
        }
      }

      /**
       * Creates an overlay div to display behind the modal.
       * @private
       */

    }, {
      key: '_makeOverlay',
      value: function _makeOverlay(id) {
        var $overlay = $('<div></div>').addClass('reveal-overlay').attr({ 'tabindex': -1, 'aria-hidden': true }).appendTo('body');
        return $overlay;
      }

      /**
       * Updates position of modal
       * TODO:  Figure out if we actually need to cache these values or if it doesn't matter
       * @private
       */

    }, {
      key: '_updatePosition',
      value: function _updatePosition() {
        var width = this.$element.outerWidth();
        var outerWidth = $(window).width();
        var height = this.$element.outerHeight();
        var outerHeight = $(window).height();
        var left, top;
        if (this.options.hOffset === 'auto') {
          left = parseInt((outerWidth - width) / 2, 10);
        } else {
          left = parseInt(this.options.hOffset, 10);
        }
        if (this.options.vOffset === 'auto') {
          if (height > outerHeight) {
            top = parseInt(Math.min(100, outerHeight / 10), 10);
          } else {
            top = parseInt((outerHeight - height) / 4, 10);
          }
        } else {
          top = parseInt(this.options.vOffset, 10);
        }
        this.$element.css({ top: top + 'px' });
        // only worry about left if we don't have an overlay or we havea  horizontal offset,
        // otherwise we're perfectly in the middle
        if (!this.$overlay || this.options.hOffset !== 'auto') {
          this.$element.css({ left: left + 'px' });
          this.$element.css({ margin: '0px' });
        }
      }

      /**
       * Adds event handlers for the modal.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        this.$element.on({
          'open.zf.trigger': this.open.bind(this),
          'close.zf.trigger': this.close.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this),
          'resizeme.zf.trigger': function () {
            _this._updatePosition();
          }
        });

        if (this.$anchor.length) {
          this.$anchor.on('keydown.zf.reveal', function (e) {
            if (e.which === 13 || e.which === 32) {
              e.stopPropagation();
              e.preventDefault();
              _this.open();
            }
          });
        }

        if (this.options.closeOnClick && this.options.overlay) {
          this.$overlay.off('.zf.reveal').on('click.zf.reveal', function (e) {
            if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target)) {
              return;
            }
            _this.close();
          });
        }
        if (this.options.deepLink) {
          $(window).on('popstate.zf.reveal:' + this.id, this._handleState.bind(this));
        }
      }

      /**
       * Handles modal methods on back/forward button clicks or any other event that triggers popstate.
       * @private
       */

    }, {
      key: '_handleState',
      value: function _handleState(e) {
        if (window.location.hash === '#' + this.id && !this.isActive) {
          this.open();
        } else {
          this.close();
        }
      }

      /**
       * Opens the modal controlled by `this.$anchor`, and closes all others by default.
       * @function
       * @fires Reveal#closeme
       * @fires Reveal#open
       */

    }, {
      key: 'open',
      value: function open() {
        var _this2 = this;

        if (this.options.deepLink) {
          var hash = '#' + this.id;

          if (window.history.pushState) {
            window.history.pushState(null, null, hash);
          } else {
            window.location.hash = hash;
          }
        }

        this.isActive = true;

        // Make elements invisible, but remove display: none so we can get size and positioning
        this.$element.css({ 'visibility': 'hidden' }).show().scrollTop(0);
        if (this.options.overlay) {
          this.$overlay.css({ 'visibility': 'hidden' }).show();
        }

        this._updatePosition();

        this.$element.hide().css({ 'visibility': '' });

        if (this.$overlay) {
          this.$overlay.css({ 'visibility': '' }).hide();
        }

        if (!this.options.multipleOpened) {
          /**
           * Fires immediately before the modal opens.
           * Closes any other modals that are currently open
           * @event Reveal#closeme
           */
          this.$element.trigger('closeme.zf.reveal', this.id);
        }

        // Motion UI method of reveal
        if (this.options.animationIn) {
          if (this.options.overlay) {
            Foundation.Motion.animateIn(this.$overlay, 'fade-in');
          }
          Foundation.Motion.animateIn(this.$element, this.options.animationIn, function () {
            _this2.focusableElements = Foundation.Keyboard.findFocusable(_this2.$element);
          });
        }
        // jQuery method of reveal
        else {
            if (this.options.overlay) {
              this.$overlay.show(0);
            }
            this.$element.show(this.options.showDelay);
          }

        // handle accessibility
        this.$element.attr({
          'aria-hidden': false,
          'tabindex': -1
        }).focus();

        /**
         * Fires when the modal has successfully opened.
         * @event Reveal#open
         */
        this.$element.trigger('open.zf.reveal');

        if (this.isiOS) {
          var scrollPos = window.pageYOffset;
          $('html, body').addClass('is-reveal-open').scrollTop(scrollPos);
        } else {
          $('body').addClass('is-reveal-open');
        }

        $('body').addClass('is-reveal-open').attr('aria-hidden', this.options.overlay || this.options.fullScreen ? true : false);

        setTimeout(function () {
          _this2._extraHandlers();
        }, 0);
      }

      /**
       * Adds extra event handlers for the body and window if necessary.
       * @private
       */

    }, {
      key: '_extraHandlers',
      value: function _extraHandlers() {
        var _this = this;
        this.focusableElements = Foundation.Keyboard.findFocusable(this.$element);

        if (!this.options.overlay && this.options.closeOnClick && !this.options.fullScreen) {
          $('body').on('click.zf.reveal', function (e) {
            if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target)) {
              return;
            }
            _this.close();
          });
        }

        if (this.options.closeOnEsc) {
          $(window).on('keydown.zf.reveal', function (e) {
            Foundation.Keyboard.handleKey(e, 'Reveal', {
              close: function () {
                if (_this.options.closeOnEsc) {
                  _this.close();
                  _this.$anchor.focus();
                }
              }
            });
          });
        }

        // lock focus within modal while tabbing
        this.$element.on('keydown.zf.reveal', function (e) {
          var $target = $(this);
          // handle keyboard event with keyboard util
          Foundation.Keyboard.handleKey(e, 'Reveal', {
            tab_forward: function () {
              if (_this.$element.find(':focus').is(_this.focusableElements.eq(-1))) {
                // left modal downwards, setting focus to first element
                _this.focusableElements.eq(0).focus();
                e.preventDefault();
              }
              if (_this.focusableElements.length === 0) {
                // no focusable elements inside the modal at all, prevent tabbing in general
                e.preventDefault();
              }
            },
            tab_backward: function () {
              if (_this.$element.find(':focus').is(_this.focusableElements.eq(0)) || _this.$element.is(':focus')) {
                // left modal upwards, setting focus to last element
                _this.focusableElements.eq(-1).focus();
                e.preventDefault();
              }
              if (_this.focusableElements.length === 0) {
                // no focusable elements inside the modal at all, prevent tabbing in general
                e.preventDefault();
              }
            },
            open: function () {
              if (_this.$element.find(':focus').is(_this.$element.find('[data-close]'))) {
                setTimeout(function () {
                  // set focus back to anchor if close button has been activated
                  _this.$anchor.focus();
                }, 1);
              } else if ($target.is(_this.focusableElements)) {
                // dont't trigger if acual element has focus (i.e. inputs, links, ...)
                _this.open();
              }
            },
            close: function () {
              if (_this.options.closeOnEsc) {
                _this.close();
                _this.$anchor.focus();
              }
            }
          });
        });
      }

      /**
       * Closes the modal.
       * @function
       * @fires Reveal#closed
       */

    }, {
      key: 'close',
      value: function close() {
        if (!this.isActive || !this.$element.is(':visible')) {
          return false;
        }
        var _this = this;

        // Motion UI method of hiding
        if (this.options.animationOut) {
          if (this.options.overlay) {
            Foundation.Motion.animateOut(this.$overlay, 'fade-out', finishUp);
          } else {
            finishUp();
          }

          Foundation.Motion.animateOut(this.$element, this.options.animationOut);
        }
        // jQuery method of hiding
        else {
            if (this.options.overlay) {
              this.$overlay.hide(0, finishUp);
            } else {
              finishUp();
            }

            this.$element.hide(this.options.hideDelay);
          }

        // Conditionals to remove extra event listeners added on open
        if (this.options.closeOnEsc) {
          $(window).off('keydown.zf.reveal');
        }

        if (!this.options.overlay && this.options.closeOnClick) {
          $('body').off('click.zf.reveal');
        }

        this.$element.off('keydown.zf.reveal');

        function finishUp() {
          if (_this.isiOS) {
            $('html, body').removeClass('is-reveal-open');
          } else {
            $('body').removeClass('is-reveal-open');
          }

          $('body').attr({
            'aria-hidden': false,
            'tabindex': ''
          });

          _this.$element.attr('aria-hidden', true);

          /**
          * Fires when the modal is done closing.
          * @event Reveal#closed
          */
          _this.$element.trigger('closed.zf.reveal');
        }

        /**
        * Resets the modal content
        * This prevents a running video to keep going in the background
        */
        if (this.options.resetOnClose) {
          this.$element.html(this.$element.html());
        }

        this.isActive = false;
        if (_this.options.deepLink) {
          if (window.history.replaceState) {
            window.history.replaceState("", document.title, window.location.pathname);
          } else {
            window.location.hash = '';
          }
        }
      }

      /**
       * Toggles the open/closed state of a modal.
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.isActive) {
          this.close();
        } else {
          this.open();
        }
      }
    }, {
      key: 'destroy',


      /**
       * Destroys an instance of a modal.
       * @function
       */
      value: function destroy() {
        if (this.options.overlay) {
          this.$element.appendTo($('body')); // move $element outside of $overlay to prevent error unregisterPlugin()
          this.$overlay.hide().off().remove();
        }
        this.$element.hide().off();
        this.$anchor.off('.zf');
        $(window).off('.zf.reveal:' + this.id);

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Reveal;
  }();

  Reveal.defaults = {
    /**
     * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
     * @option
     * @example 'slide-in-left'
     */
    animationIn: '',
    /**
     * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
     * @option
     * @example 'slide-out-right'
     */
    animationOut: '',
    /**
     * Time, in ms, to delay the opening of a modal after a click if no animation used.
     * @option
     * @example 10
     */
    showDelay: 0,
    /**
     * Time, in ms, to delay the closing of a modal after a click if no animation used.
     * @option
     * @example 10
     */
    hideDelay: 0,
    /**
     * Allows a click on the body/overlay to close the modal.
     * @option
     * @example true
     */
    closeOnClick: true,
    /**
     * Allows the modal to close if the user presses the `ESCAPE` key.
     * @option
     * @example true
     */
    closeOnEsc: true,
    /**
     * If true, allows multiple modals to be displayed at once.
     * @option
     * @example false
     */
    multipleOpened: false,
    /**
     * Distance, in pixels, the modal should push down from the top of the screen.
     * @option
     * @example auto
     */
    vOffset: 'auto',
    /**
     * Distance, in pixels, the modal should push in from the side of the screen.
     * @option
     * @example auto
     */
    hOffset: 'auto',
    /**
     * Allows the modal to be fullscreen, completely blocking out the rest of the view. JS checks for this as well.
     * @option
     * @example false
     */
    fullScreen: false,
    /**
     * Percentage of screen height the modal should push up from the bottom of the view.
     * @option
     * @example 10
     */
    btmOffsetPct: 10,
    /**
     * Allows the modal to generate an overlay div, which will cover the view when modal opens.
     * @option
     * @example true
     */
    overlay: true,
    /**
     * Allows the modal to remove and reinject markup on close. Should be true if using video elements w/o using provider's api, otherwise, videos will continue to play in the background.
     * @option
     * @example false
     */
    resetOnClose: false,
    /**
     * Allows the modal to alter the url on open/close, and allows the use of the `back` button to close modals. ALSO, allows a modal to auto-maniacally open on page load IF the hash === the modal's user-set id.
     * @option
     * @example false
     */
    deepLink: false
  };

  // Window exports
  Foundation.plugin(Reveal, 'Reveal');

  function iPhoneSniff() {
    return (/iP(ad|hone|od).*OS/.test(window.navigator.userAgent)
    );
  }
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Slider module.
   * @module foundation.slider
   * @requires foundation.util.motion
   * @requires foundation.util.triggers
   * @requires foundation.util.keyboard
   * @requires foundation.util.touch
   */

  var Slider = function () {
    /**
     * Creates a new instance of a drilldown menu.
     * @class
     * @param {jQuery} element - jQuery object to make into an accordion menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Slider(element, options) {
      _classCallCheck(this, Slider);

      this.$element = element;
      this.options = $.extend({}, Slider.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Slider');
      Foundation.Keyboard.register('Slider', {
        'ltr': {
          'ARROW_RIGHT': 'increase',
          'ARROW_UP': 'increase',
          'ARROW_DOWN': 'decrease',
          'ARROW_LEFT': 'decrease',
          'SHIFT_ARROW_RIGHT': 'increase_fast',
          'SHIFT_ARROW_UP': 'increase_fast',
          'SHIFT_ARROW_DOWN': 'decrease_fast',
          'SHIFT_ARROW_LEFT': 'decrease_fast'
        },
        'rtl': {
          'ARROW_LEFT': 'increase',
          'ARROW_RIGHT': 'decrease',
          'SHIFT_ARROW_LEFT': 'increase_fast',
          'SHIFT_ARROW_RIGHT': 'decrease_fast'
        }
      });
    }

    /**
     * Initilizes the plugin by reading/setting attributes, creating collections and setting the initial position of the handle(s).
     * @function
     * @private
     */


    _createClass(Slider, [{
      key: '_init',
      value: function _init() {
        this.inputs = this.$element.find('input');
        this.handles = this.$element.find('[data-slider-handle]');

        this.$handle = this.handles.eq(0);
        this.$input = this.inputs.length ? this.inputs.eq(0) : $('#' + this.$handle.attr('aria-controls'));
        this.$fill = this.$element.find('[data-slider-fill]').css(this.options.vertical ? 'height' : 'width', 0);

        var isDbl = false,
            _this = this;
        if (this.options.disabled || this.$element.hasClass(this.options.disabledClass)) {
          this.options.disabled = true;
          this.$element.addClass(this.options.disabledClass);
        }
        if (!this.inputs.length) {
          this.inputs = $().add(this.$input);
          this.options.binding = true;
        }
        this._setInitAttr(0);
        this._events(this.$handle);

        if (this.handles[1]) {
          this.options.doubleSided = true;
          this.$handle2 = this.handles.eq(1);
          this.$input2 = this.inputs.length > 1 ? this.inputs.eq(1) : $('#' + this.$handle2.attr('aria-controls'));

          if (!this.inputs[1]) {
            this.inputs = this.inputs.add(this.$input2);
          }
          isDbl = true;

          this._setHandlePos(this.$handle, this.options.initialStart, true, function () {

            _this._setHandlePos(_this.$handle2, _this.options.initialEnd, true);
          });
          // this.$handle.triggerHandler('click.zf.slider');
          this._setInitAttr(1);
          this._events(this.$handle2);
        }

        if (!isDbl) {
          this._setHandlePos(this.$handle, this.options.initialStart, true);
        }
      }

      /**
       * Sets the position of the selected handle and fill bar.
       * @function
       * @private
       * @param {jQuery} $hndl - the selected handle to move.
       * @param {Number} location - floating point between the start and end values of the slider bar.
       * @param {Function} cb - callback function to fire on completion.
       * @fires Slider#moved
       * @fires Slider#changed
       */

    }, {
      key: '_setHandlePos',
      value: function _setHandlePos($hndl, location, noInvert, cb) {
        //might need to alter that slightly for bars that will have odd number selections.
        location = parseFloat(location); //on input change events, convert string to number...grumble.

        // prevent slider from running out of bounds, if value exceeds the limits set through options, override the value to min/max
        if (location < this.options.start) {
          location = this.options.start;
        } else if (location > this.options.end) {
          location = this.options.end;
        }

        var isDbl = this.options.doubleSided;

        if (isDbl) {
          //this block is to prevent 2 handles from crossing eachother. Could/should be improved.
          if (this.handles.index($hndl) === 0) {
            var h2Val = parseFloat(this.$handle2.attr('aria-valuenow'));
            location = location >= h2Val ? h2Val - this.options.step : location;
          } else {
            var h1Val = parseFloat(this.$handle.attr('aria-valuenow'));
            location = location <= h1Val ? h1Val + this.options.step : location;
          }
        }

        //this is for single-handled vertical sliders, it adjusts the value to account for the slider being "upside-down"
        //for click and drag events, it's weird due to the scale(-1, 1) css property
        if (this.options.vertical && !noInvert) {
          location = this.options.end - location;
        }

        var _this = this,
            vert = this.options.vertical,
            hOrW = vert ? 'height' : 'width',
            lOrT = vert ? 'top' : 'left',
            handleDim = $hndl[0].getBoundingClientRect()[hOrW],
            elemDim = this.$element[0].getBoundingClientRect()[hOrW],

        //percentage of bar min/max value based on click or drag point
        pctOfBar = percent(location - this.options.start, this.options.end - this.options.start).toFixed(2),

        //number of actual pixels to shift the handle, based on the percentage obtained above
        pxToMove = (elemDim - handleDim) * pctOfBar,

        //percentage of bar to shift the handle
        movement = (percent(pxToMove, elemDim) * 100).toFixed(this.options.decimal);
        //fixing the decimal value for the location number, is passed to other methods as a fixed floating-point value
        location = parseFloat(location.toFixed(this.options.decimal));
        // declare empty object for css adjustments, only used with 2 handled-sliders
        var css = {};

        this._setValues($hndl, location);

        // TODO update to calculate based on values set to respective inputs??
        if (isDbl) {
          var isLeftHndl = this.handles.index($hndl) === 0,

          //empty variable, will be used for min-height/width for fill bar
          dim,

          //percentage w/h of the handle compared to the slider bar
          handlePct = ~~(percent(handleDim, elemDim) * 100);
          //if left handle, the math is slightly different than if it's the right handle, and the left/top property needs to be changed for the fill bar
          if (isLeftHndl) {
            //left or top percentage value to apply to the fill bar.
            css[lOrT] = movement + '%';
            //calculate the new min-height/width for the fill bar.
            dim = parseFloat(this.$handle2[0].style[lOrT]) - movement + handlePct;
            //this callback is necessary to prevent errors and allow the proper placement and initialization of a 2-handled slider
            //plus, it means we don't care if 'dim' isNaN on init, it won't be in the future.
            if (cb && typeof cb === 'function') {
              cb();
            } //this is only needed for the initialization of 2 handled sliders
          } else {
            //just caching the value of the left/bottom handle's left/top property
            var handlePos = parseFloat(this.$handle[0].style[lOrT]);
            //calculate the new min-height/width for the fill bar. Use isNaN to prevent false positives for numbers <= 0
            //based on the percentage of movement of the handle being manipulated, less the opposing handle's left/top position, plus the percentage w/h of the handle itself
            dim = movement - (isNaN(handlePos) ? this.options.initialStart / ((this.options.end - this.options.start) / 100) : handlePos) + handlePct;
          }
          // assign the min-height/width to our css object
          css['min-' + hOrW] = dim + '%';
        }

        this.$element.one('finished.zf.animate', function () {
          /**
           * Fires when the handle is done moving.
           * @event Slider#moved
           */
          _this.$element.trigger('moved.zf.slider', [$hndl]);
        });

        //because we don't know exactly how the handle will be moved, check the amount of time it should take to move.
        var moveTime = this.$element.data('dragging') ? 1000 / 60 : this.options.moveTime;

        Foundation.Move(moveTime, $hndl, function () {
          //adjusting the left/top property of the handle, based on the percentage calculated above
          $hndl.css(lOrT, movement + '%');

          if (!_this.options.doubleSided) {
            //if single-handled, a simple method to expand the fill bar
            _this.$fill.css(hOrW, pctOfBar * 100 + '%');
          } else {
            //otherwise, use the css object we created above
            _this.$fill.css(css);
          }
        });

        /**
         * Fires when the value has not been change for a given time.
         * @event Slider#changed
         */
        clearTimeout(_this.timeout);
        _this.timeout = setTimeout(function () {
          _this.$element.trigger('changed.zf.slider', [$hndl]);
        }, _this.options.changedDelay);
      }

      /**
       * Sets the initial attribute for the slider element.
       * @function
       * @private
       * @param {Number} idx - index of the current handle/input to use.
       */

    }, {
      key: '_setInitAttr',
      value: function _setInitAttr(idx) {
        var id = this.inputs.eq(idx).attr('id') || Foundation.GetYoDigits(6, 'slider');
        this.inputs.eq(idx).attr({
          'id': id,
          'max': this.options.end,
          'min': this.options.start,
          'step': this.options.step
        });
        this.handles.eq(idx).attr({
          'role': 'slider',
          'aria-controls': id,
          'aria-valuemax': this.options.end,
          'aria-valuemin': this.options.start,
          'aria-valuenow': idx === 0 ? this.options.initialStart : this.options.initialEnd,
          'aria-orientation': this.options.vertical ? 'vertical' : 'horizontal',
          'tabindex': 0
        });
      }

      /**
       * Sets the input and `aria-valuenow` values for the slider element.
       * @function
       * @private
       * @param {jQuery} $handle - the currently selected handle.
       * @param {Number} val - floating point of the new value.
       */

    }, {
      key: '_setValues',
      value: function _setValues($handle, val) {
        var idx = this.options.doubleSided ? this.handles.index($handle) : 0;
        this.inputs.eq(idx).val(val);
        $handle.attr('aria-valuenow', val);
      }

      /**
       * Handles events on the slider element.
       * Calculates the new location of the current handle.
       * If there are two handles and the bar was clicked, it determines which handle to move.
       * @function
       * @private
       * @param {Object} e - the `event` object passed from the listener.
       * @param {jQuery} $handle - the current handle to calculate for, if selected.
       * @param {Number} val - floating point number for the new value of the slider.
       * TODO clean this up, there's a lot of repeated code between this and the _setHandlePos fn.
       */

    }, {
      key: '_handleEvent',
      value: function _handleEvent(e, $handle, val) {
        var value, hasVal;
        if (!val) {
          //click or drag events
          e.preventDefault();
          var _this = this,
              vertical = this.options.vertical,
              param = vertical ? 'height' : 'width',
              direction = vertical ? 'top' : 'left',
              pageXY = vertical ? e.pageY : e.pageX,
              halfOfHandle = this.$handle[0].getBoundingClientRect()[param] / 2,
              barDim = this.$element[0].getBoundingClientRect()[param],
              barOffset = this.$element.offset()[direction] - pageXY,

          //if the cursor position is less than or greater than the elements bounding coordinates, set coordinates within those bounds
          barXY = barOffset > 0 ? -halfOfHandle : barOffset - halfOfHandle < -barDim ? barDim : Math.abs(barOffset),
              offsetPct = percent(barXY, barDim);
          value = (this.options.end - this.options.start) * offsetPct + this.options.start;

          // turn everything around for RTL, yay math!
          if (Foundation.rtl() && !this.options.vertical) {
            value = this.options.end - value;
          }

          value = _this._adjustValue(null, value);
          //boolean flag for the setHandlePos fn, specifically for vertical sliders
          hasVal = false;

          if (!$handle) {
            //figure out which handle it is, pass it to the next function.
            var firstHndlPos = absPosition(this.$handle, direction, barXY, param),
                secndHndlPos = absPosition(this.$handle2, direction, barXY, param);
            $handle = firstHndlPos <= secndHndlPos ? this.$handle : this.$handle2;
          }
        } else {
          //change event on input
          value = this._adjustValue(null, val);
          hasVal = true;
        }

        this._setHandlePos($handle, value, hasVal);
      }

      /**
       * Adjustes value for handle in regard to step value. returns adjusted value
       * @function
       * @private
       * @param {jQuery} $handle - the selected handle.
       * @param {Number} value - value to adjust. used if $handle is falsy
       */

    }, {
      key: '_adjustValue',
      value: function _adjustValue($handle, value) {
        var val,
            step = this.options.step,
            div = parseFloat(step / 2),
            left,
            prev_val,
            next_val;
        if (!!$handle) {
          val = parseFloat($handle.attr('aria-valuenow'));
        } else {
          val = value;
        }
        left = val % step;
        prev_val = val - left;
        next_val = prev_val + step;
        if (left === 0) {
          return val;
        }
        val = val >= prev_val + div ? next_val : prev_val;
        return val;
      }

      /**
       * Adds event listeners to the slider elements.
       * @function
       * @private
       * @param {jQuery} $handle - the current handle to apply listeners to.
       */

    }, {
      key: '_events',
      value: function _events($handle) {
        if (this.options.disabled) {
          return false;
        }

        var _this = this,
            curHandle,
            timer;

        this.inputs.off('change.zf.slider').on('change.zf.slider', function (e) {
          var idx = _this.inputs.index($(this));
          _this._handleEvent(e, _this.handles.eq(idx), $(this).val());
        });

        if (this.options.clickSelect) {
          this.$element.off('click.zf.slider').on('click.zf.slider', function (e) {
            if (_this.$element.data('dragging')) {
              return false;
            }

            if (!$(e.target).is('[data-slider-handle]')) {
              if (_this.options.doubleSided) {
                _this._handleEvent(e);
              } else {
                _this._handleEvent(e, _this.$handle);
              }
            }
          });
        }

        if (this.options.draggable) {
          this.handles.addTouch();

          var $body = $('body');
          $handle.off('mousedown.zf.slider').on('mousedown.zf.slider', function (e) {
            $handle.addClass('is-dragging');
            _this.$fill.addClass('is-dragging'); //
            _this.$element.data('dragging', true);

            curHandle = $(e.currentTarget);

            $body.on('mousemove.zf.slider', function (e) {
              e.preventDefault();

              _this._handleEvent(e, curHandle);
            }).on('mouseup.zf.slider', function (e) {
              _this._handleEvent(e, curHandle);

              $handle.removeClass('is-dragging');
              _this.$fill.removeClass('is-dragging');
              _this.$element.data('dragging', false);

              $body.off('mousemove.zf.slider mouseup.zf.slider');
            });
          });
        }

        $handle.off('keydown.zf.slider').on('keydown.zf.slider', function (e) {
          var _$handle = $(this),
              idx = _this.options.doubleSided ? _this.handles.index(_$handle) : 0,
              oldValue = parseFloat(_this.inputs.eq(idx).val()),
              newValue;

          // handle keyboard event with keyboard util
          Foundation.Keyboard.handleKey(e, 'Slider', {
            decrease: function () {
              newValue = oldValue - _this.options.step;
            },
            increase: function () {
              newValue = oldValue + _this.options.step;
            },
            decrease_fast: function () {
              newValue = oldValue - _this.options.step * 10;
            },
            increase_fast: function () {
              newValue = oldValue + _this.options.step * 10;
            },
            handled: function () {
              // only set handle pos when event was handled specially
              e.preventDefault();
              _this._setHandlePos(_$handle, newValue, true);
            }
          });
          /*if (newValue) { // if pressed key has special function, update value
            e.preventDefault();
            _this._setHandlePos(_$handle, newValue);
          }*/
        });
      }

      /**
       * Destroys the slider plugin.
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.handles.off('.zf.slider');
        this.inputs.off('.zf.slider');
        this.$element.off('.zf.slider');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Slider;
  }();

  Slider.defaults = {
    /**
     * Minimum value for the slider scale.
     * @option
     * @example 0
     */
    start: 0,
    /**
     * Maximum value for the slider scale.
     * @option
     * @example 100
     */
    end: 100,
    /**
     * Minimum value change per change event.
     * @option
     * @example 1
     */
    step: 1,
    /**
     * Value at which the handle/input *(left handle/first input)* should be set to on initialization.
     * @option
     * @example 0
     */
    initialStart: 0,
    /**
     * Value at which the right handle/second input should be set to on initialization.
     * @option
     * @example 100
     */
    initialEnd: 100,
    /**
     * Allows the input to be located outside the container and visible. Set to by the JS
     * @option
     * @example false
     */
    binding: false,
    /**
     * Allows the user to click/tap on the slider bar to select a value.
     * @option
     * @example true
     */
    clickSelect: true,
    /**
     * Set to true and use the `vertical` class to change alignment to vertical.
     * @option
     * @example false
     */
    vertical: false,
    /**
     * Allows the user to drag the slider handle(s) to select a value.
     * @option
     * @example true
     */
    draggable: true,
    /**
     * Disables the slider and prevents event listeners from being applied. Double checked by JS with `disabledClass`.
     * @option
     * @example false
     */
    disabled: false,
    /**
     * Allows the use of two handles. Double checked by the JS. Changes some logic handling.
     * @option
     * @example false
     */
    doubleSided: false,
    /**
     * Potential future feature.
     */
    // steps: 100,
    /**
     * Number of decimal places the plugin should go to for floating point precision.
     * @option
     * @example 2
     */
    decimal: 2,
    /**
     * Time delay for dragged elements.
     */
    // dragDelay: 0,
    /**
     * Time, in ms, to animate the movement of a slider handle if user clicks/taps on the bar. Needs to be manually set if updating the transition time in the Sass settings.
     * @option
     * @example 200
     */
    moveTime: 200, //update this if changing the transition time in the sass
    /**
     * Class applied to disabled sliders.
     * @option
     * @example 'disabled'
     */
    disabledClass: 'disabled',
    /**
     * Will invert the default layout for a vertical<span data-tooltip title="who would do this???"> </span>slider.
     * @option
     * @example false
     */
    invertVertical: false,
    /**
     * Milliseconds before the `changed.zf-slider` event is triggered after value change. 
     * @option
     * @example 500
     */
    changedDelay: 500
  };

  function percent(frac, num) {
    return frac / num;
  }
  function absPosition($handle, dir, clickPos, param) {
    return Math.abs($handle.position()[dir] + $handle[param]() / 2 - clickPos);
  }

  // Window exports
  Foundation.plugin(Slider, 'Slider');
}(jQuery);

//*********this is in case we go to static, absolute positions instead of dynamic positioning********
// this.setSteps(function() {
//   _this._events();
//   var initStart = _this.options.positions[_this.options.initialStart - 1] || null;
//   var initEnd = _this.options.initialEnd ? _this.options.position[_this.options.initialEnd - 1] : null;
//   if (initStart || initEnd) {
//     _this._handleEvent(initStart, initEnd);
//   }
// });

//***********the other part of absolute positions*************
// Slider.prototype.setSteps = function(cb) {
//   var posChange = this.$element.outerWidth() / this.options.steps;
//   var counter = 0
//   while(counter < this.options.steps) {
//     if (counter) {
//       this.options.positions.push(this.options.positions[counter - 1] + posChange);
//     } else {
//       this.options.positions.push(posChange);
//     }
//     counter++;
//   }
//   cb();
// };
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Sticky module.
   * @module foundation.sticky
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   */

  var Sticky = function () {
    /**
     * Creates a new instance of a sticky thing.
     * @class
     * @param {jQuery} element - jQuery object to make sticky.
     * @param {Object} options - options object passed when creating the element programmatically.
     */
    function Sticky(element, options) {
      _classCallCheck(this, Sticky);

      this.$element = element;
      this.options = $.extend({}, Sticky.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Sticky');
    }

    /**
     * Initializes the sticky element by adding classes, getting/setting dimensions, breakpoints and attributes
     * @function
     * @private
     */


    _createClass(Sticky, [{
      key: '_init',
      value: function _init() {
        var $parent = this.$element.parent('[data-sticky-container]'),
            id = this.$element[0].id || Foundation.GetYoDigits(6, 'sticky'),
            _this = this;

        if (!$parent.length) {
          this.wasWrapped = true;
        }
        this.$container = $parent.length ? $parent : $(this.options.container).wrapInner(this.$element);
        this.$container.addClass(this.options.containerClass);

        this.$element.addClass(this.options.stickyClass).attr({ 'data-resize': id });

        this.scrollCount = this.options.checkEvery;
        this.isStuck = false;
        $(window).one('load.zf.sticky', function () {
          if (_this.options.anchor !== '') {
            _this.$anchor = $('#' + _this.options.anchor);
          } else {
            _this._parsePoints();
          }

          _this._setSizes(function () {
            _this._calc(false);
          });
          _this._events(id.split('-').reverse().join('-'));
        });
      }

      /**
       * If using multiple elements as anchors, calculates the top and bottom pixel values the sticky thing should stick and unstick on.
       * @function
       * @private
       */

    }, {
      key: '_parsePoints',
      value: function _parsePoints() {
        var top = this.options.topAnchor,
            btm = this.options.btmAnchor,
            pts = [top, btm],
            breaks = {};
        if (top && btm) {

          for (var i = 0, len = pts.length; i < len && pts[i]; i++) {
            var pt;
            if (typeof pts[i] === 'number') {
              pt = pts[i];
            } else {
              var place = pts[i].split(':'),
                  anchor = $('#' + place[0]);

              pt = anchor.offset().top;
              if (place[1] && place[1].toLowerCase() === 'bottom') {
                pt += anchor[0].getBoundingClientRect().height;
              }
            }
            breaks[i] = pt;
          }
        } else {
          breaks = { 0: 1, 1: document.documentElement.scrollHeight };
        }

        this.points = breaks;
        return;
      }

      /**
       * Adds event handlers for the scrolling element.
       * @private
       * @param {String} id - psuedo-random id for unique scroll event listener.
       */

    }, {
      key: '_events',
      value: function _events(id) {
        var _this = this,
            scrollListener = this.scrollListener = 'scroll.zf.' + id;
        if (this.isOn) {
          return;
        }
        if (this.canStick) {
          this.isOn = true;
          $(window).off(scrollListener).on(scrollListener, function (e) {
            if (_this.scrollCount === 0) {
              _this.scrollCount = _this.options.checkEvery;
              _this._setSizes(function () {
                _this._calc(false, window.pageYOffset);
              });
            } else {
              _this.scrollCount--;
              _this._calc(false, window.pageYOffset);
            }
          });
        }

        this.$element.off('resizeme.zf.trigger').on('resizeme.zf.trigger', function (e, el) {
          _this._setSizes(function () {
            _this._calc(false);
            if (_this.canStick) {
              if (!_this.isOn) {
                _this._events(id);
              }
            } else if (_this.isOn) {
              _this._pauseListeners(scrollListener);
            }
          });
        });
      }

      /**
       * Removes event handlers for scroll and change events on anchor.
       * @fires Sticky#pause
       * @param {String} scrollListener - unique, namespaced scroll listener attached to `window`
       */

    }, {
      key: '_pauseListeners',
      value: function _pauseListeners(scrollListener) {
        this.isOn = false;
        $(window).off(scrollListener);

        /**
         * Fires when the plugin is paused due to resize event shrinking the view.
         * @event Sticky#pause
         * @private
         */
        this.$element.trigger('pause.zf.sticky');
      }

      /**
       * Called on every `scroll` event and on `_init`
       * fires functions based on booleans and cached values
       * @param {Boolean} checkSizes - true if plugin should recalculate sizes and breakpoints.
       * @param {Number} scroll - current scroll position passed from scroll event cb function. If not passed, defaults to `window.pageYOffset`.
       */

    }, {
      key: '_calc',
      value: function _calc(checkSizes, scroll) {
        if (checkSizes) {
          this._setSizes();
        }

        if (!this.canStick) {
          if (this.isStuck) {
            this._removeSticky(true);
          }
          return false;
        }

        if (!scroll) {
          scroll = window.pageYOffset;
        }

        if (scroll >= this.topPoint) {
          if (scroll <= this.bottomPoint) {
            if (!this.isStuck) {
              this._setSticky();
            }
          } else {
            if (this.isStuck) {
              this._removeSticky(false);
            }
          }
        } else {
          if (this.isStuck) {
            this._removeSticky(true);
          }
        }
      }

      /**
       * Causes the $element to become stuck.
       * Adds `position: fixed;`, and helper classes.
       * @fires Sticky#stuckto
       * @function
       * @private
       */

    }, {
      key: '_setSticky',
      value: function _setSticky() {
        var stickTo = this.options.stickTo,
            mrgn = stickTo === 'top' ? 'marginTop' : 'marginBottom',
            notStuckTo = stickTo === 'top' ? 'bottom' : 'top',
            css = {};

        css[mrgn] = this.options[mrgn] + 'em';
        css[stickTo] = 0;
        css[notStuckTo] = 'auto';
        css['left'] = this.$container.offset().left + parseInt(window.getComputedStyle(this.$container[0])["padding-left"], 10);
        this.isStuck = true;
        this.$element.removeClass('is-anchored is-at-' + notStuckTo).addClass('is-stuck is-at-' + stickTo).css(css)
        /**
         * Fires when the $element has become `position: fixed;`
         * Namespaced to `top` or `bottom`, e.g. `sticky.zf.stuckto:top`
         * @event Sticky#stuckto
         */
        .trigger('sticky.zf.stuckto:' + stickTo);
      }

      /**
       * Causes the $element to become unstuck.
       * Removes `position: fixed;`, and helper classes.
       * Adds other helper classes.
       * @param {Boolean} isTop - tells the function if the $element should anchor to the top or bottom of its $anchor element.
       * @fires Sticky#unstuckfrom
       * @private
       */

    }, {
      key: '_removeSticky',
      value: function _removeSticky(isTop) {
        var stickTo = this.options.stickTo,
            stickToTop = stickTo === 'top',
            css = {},
            anchorPt = (this.points ? this.points[1] - this.points[0] : this.anchorHeight) - this.elemHeight,
            mrgn = stickToTop ? 'marginTop' : 'marginBottom',
            notStuckTo = stickToTop ? 'bottom' : 'top',
            topOrBottom = isTop ? 'top' : 'bottom';

        css[mrgn] = 0;

        if (isTop && !stickToTop || stickToTop && !isTop) {
          css[stickTo] = anchorPt;
          css[notStuckTo] = 0;
        } else {
          css[stickTo] = 0;
          css[notStuckTo] = anchorPt;
        }

        css['left'] = '';
        this.isStuck = false;
        this.$element.removeClass('is-stuck is-at-' + stickTo).addClass('is-anchored is-at-' + topOrBottom).css(css)
        /**
         * Fires when the $element has become anchored.
         * Namespaced to `top` or `bottom`, e.g. `sticky.zf.unstuckfrom:bottom`
         * @event Sticky#unstuckfrom
         */
        .trigger('sticky.zf.unstuckfrom:' + topOrBottom);
      }

      /**
       * Sets the $element and $container sizes for plugin.
       * Calls `_setBreakPoints`.
       * @param {Function} cb - optional callback function to fire on completion of `_setBreakPoints`.
       * @private
       */

    }, {
      key: '_setSizes',
      value: function _setSizes(cb) {
        this.canStick = Foundation.MediaQuery.atLeast(this.options.stickyOn);
        if (!this.canStick) {
          cb();
        }
        var _this = this,
            newElemWidth = this.$container[0].getBoundingClientRect().width,
            comp = window.getComputedStyle(this.$container[0]),
            pdng = parseInt(comp['padding-right'], 10);

        if (this.$anchor && this.$anchor.length) {
          this.anchorHeight = this.$anchor[0].getBoundingClientRect().height;
        } else {
          this._parsePoints();
        }

        this.$element.css({
          'max-width': newElemWidth - pdng + 'px'
        });

        var newContainerHeight = this.$element[0].getBoundingClientRect().height || this.containerHeight;
        this.containerHeight = newContainerHeight;
        this.$container.css({
          height: newContainerHeight
        });
        this.elemHeight = newContainerHeight;

        if (this.isStuck) {
          this.$element.css({ "left": this.$container.offset().left + parseInt(comp['padding-left'], 10) });
        }

        this._setBreakPoints(newContainerHeight, function () {
          if (cb) {
            cb();
          }
        });
      }

      /**
       * Sets the upper and lower breakpoints for the element to become sticky/unsticky.
       * @param {Number} elemHeight - px value for sticky.$element height, calculated by `_setSizes`.
       * @param {Function} cb - optional callback function to be called on completion.
       * @private
       */

    }, {
      key: '_setBreakPoints',
      value: function _setBreakPoints(elemHeight, cb) {
        if (!this.canStick) {
          if (cb) {
            cb();
          } else {
            return false;
          }
        }
        var mTop = emCalc(this.options.marginTop),
            mBtm = emCalc(this.options.marginBottom),
            topPoint = this.points ? this.points[0] : this.$anchor.offset().top,
            bottomPoint = this.points ? this.points[1] : topPoint + this.anchorHeight,

        // topPoint = this.$anchor.offset().top || this.points[0],
        // bottomPoint = topPoint + this.anchorHeight || this.points[1],
        winHeight = window.innerHeight;

        if (this.options.stickTo === 'top') {
          topPoint -= mTop;
          bottomPoint -= elemHeight + mTop;
        } else if (this.options.stickTo === 'bottom') {
          topPoint -= winHeight - (elemHeight + mBtm);
          bottomPoint -= winHeight - mBtm;
        } else {
          //this would be the stickTo: both option... tricky
        }

        this.topPoint = topPoint;
        this.bottomPoint = bottomPoint;

        if (cb) {
          cb();
        }
      }

      /**
       * Destroys the current sticky element.
       * Resets the element to the top position first.
       * Removes event listeners, JS-added css properties and classes, and unwraps the $element if the JS added the $container.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this._removeSticky(true);

        this.$element.removeClass(this.options.stickyClass + ' is-anchored is-at-top').css({
          height: '',
          top: '',
          bottom: '',
          'max-width': ''
        }).off('resizeme.zf.trigger');

        this.$anchor.off('change.zf.sticky');
        $(window).off(this.scrollListener);

        if (this.wasWrapped) {
          this.$element.unwrap();
        } else {
          this.$container.removeClass(this.options.containerClass).css({
            height: ''
          });
        }
        Foundation.unregisterPlugin(this);
      }
    }]);

    return Sticky;
  }();

  Sticky.defaults = {
    /**
     * Customizable container template. Add your own classes for styling and sizing.
     * @option
     * @example '&lt;div data-sticky-container class="small-6 columns"&gt;&lt;/div&gt;'
     */
    container: '<div data-sticky-container></div>',
    /**
     * Location in the view the element sticks to.
     * @option
     * @example 'top'
     */
    stickTo: 'top',
    /**
     * If anchored to a single element, the id of that element.
     * @option
     * @example 'exampleId'
     */
    anchor: '',
    /**
     * If using more than one element as anchor points, the id of the top anchor.
     * @option
     * @example 'exampleId:top'
     */
    topAnchor: '',
    /**
     * If using more than one element as anchor points, the id of the bottom anchor.
     * @option
     * @example 'exampleId:bottom'
     */
    btmAnchor: '',
    /**
     * Margin, in `em`'s to apply to the top of the element when it becomes sticky.
     * @option
     * @example 1
     */
    marginTop: 1,
    /**
     * Margin, in `em`'s to apply to the bottom of the element when it becomes sticky.
     * @option
     * @example 1
     */
    marginBottom: 1,
    /**
     * Breakpoint string that is the minimum screen size an element should become sticky.
     * @option
     * @example 'medium'
     */
    stickyOn: 'medium',
    /**
     * Class applied to sticky element, and removed on destruction. Foundation defaults to `sticky`.
     * @option
     * @example 'sticky'
     */
    stickyClass: 'sticky',
    /**
     * Class applied to sticky container. Foundation defaults to `sticky-container`.
     * @option
     * @example 'sticky-container'
     */
    containerClass: 'sticky-container',
    /**
     * Number of scroll events between the plugin's recalculating sticky points. Setting it to `0` will cause it to recalc every scroll event, setting it to `-1` will prevent recalc on scroll.
     * @option
     * @example 50
     */
    checkEvery: -1
  };

  /**
   * Helper function to calculate em values
   * @param Number {em} - number of em's to calculate into pixels
   */
  function emCalc(em) {
    return parseInt(window.getComputedStyle(document.body, null).fontSize, 10) * em;
  }

  // Window exports
  Foundation.plugin(Sticky, 'Sticky');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Tabs module.
   * @module foundation.tabs
   * @requires foundation.util.keyboard
   * @requires foundation.util.timerAndImageLoader if tabs contain images
   */

  var Tabs = function () {
    /**
     * Creates a new instance of tabs.
     * @class
     * @fires Tabs#init
     * @param {jQuery} element - jQuery object to make into tabs.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Tabs(element, options) {
      _classCallCheck(this, Tabs);

      this.$element = element;
      this.options = $.extend({}, Tabs.defaults, this.$element.data(), options);

      this._init();
      Foundation.registerPlugin(this, 'Tabs');
      Foundation.Keyboard.register('Tabs', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'previous',
        'ARROW_DOWN': 'next',
        'ARROW_LEFT': 'previous'
        // 'TAB': 'next',
        // 'SHIFT_TAB': 'previous'
      });
    }

    /**
     * Initializes the tabs by showing and focusing (if autoFocus=true) the preset active tab.
     * @private
     */


    _createClass(Tabs, [{
      key: '_init',
      value: function _init() {
        var _this = this;

        this.$tabTitles = this.$element.find('.' + this.options.linkClass);
        this.$tabContent = $('[data-tabs-content="' + this.$element[0].id + '"]');

        this.$tabTitles.each(function () {
          var $elem = $(this),
              $link = $elem.find('a'),
              isActive = $elem.hasClass('is-active'),
              hash = $link[0].hash.slice(1),
              linkId = $link[0].id ? $link[0].id : hash + '-label',
              $tabContent = $('#' + hash);

          $elem.attr({ 'role': 'presentation' });

          $link.attr({
            'role': 'tab',
            'aria-controls': hash,
            'aria-selected': isActive,
            'id': linkId
          });

          $tabContent.attr({
            'role': 'tabpanel',
            'aria-hidden': !isActive,
            'aria-labelledby': linkId
          });

          if (isActive && _this.options.autoFocus) {
            $link.focus();
          }
        });

        if (this.options.matchHeight) {
          var $images = this.$tabContent.find('img');

          if ($images.length) {
            Foundation.onImagesLoaded($images, this._setHeight.bind(this));
          } else {
            this._setHeight();
          }
        }

        this._events();
      }

      /**
       * Adds event handlers for items within the tabs.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        this._addKeyHandler();
        this._addClickHandler();

        if (this.options.matchHeight) {
          $(window).on('changed.zf.mediaquery', this._setHeight.bind(this));
        }
      }

      /**
       * Adds click handlers for items within the tabs.
       * @private
       */

    }, {
      key: '_addClickHandler',
      value: function _addClickHandler() {
        var _this = this;

        this.$element.off('click.zf.tabs').on('click.zf.tabs', '.' + this.options.linkClass, function (e) {
          e.preventDefault();
          e.stopPropagation();
          if ($(this).hasClass('is-active')) {
            return;
          }
          _this._handleTabChange($(this));
        });
      }

      /**
       * Adds keyboard event handlers for items within the tabs.
       * @private
       */

    }, {
      key: '_addKeyHandler',
      value: function _addKeyHandler() {
        var _this = this;
        var $firstTab = _this.$element.find('li:first-of-type');
        var $lastTab = _this.$element.find('li:last-of-type');

        this.$tabTitles.off('keydown.zf.tabs').on('keydown.zf.tabs', function (e) {
          if (e.which === 9) return;
          e.stopPropagation();
          e.preventDefault();

          var $element = $(this),
              $elements = $element.parent('ul').children('li'),
              $prevElement,
              $nextElement;

          $elements.each(function (i) {
            if ($(this).is($element)) {
              if (_this.options.wrapOnKeys) {
                $prevElement = i === 0 ? $elements.last() : $elements.eq(i - 1);
                $nextElement = i === $elements.length - 1 ? $elements.first() : $elements.eq(i + 1);
              } else {
                $prevElement = $elements.eq(Math.max(0, i - 1));
                $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1));
              }
              return;
            }
          });

          // handle keyboard event with keyboard util
          Foundation.Keyboard.handleKey(e, 'Tabs', {
            open: function () {
              $element.find('[role="tab"]').focus();
              _this._handleTabChange($element);
            },
            previous: function () {
              $prevElement.find('[role="tab"]').focus();
              _this._handleTabChange($prevElement);
            },
            next: function () {
              $nextElement.find('[role="tab"]').focus();
              _this._handleTabChange($nextElement);
            }
          });
        });
      }

      /**
       * Opens the tab `$targetContent` defined by `$target`.
       * @param {jQuery} $target - Tab to open.
       * @fires Tabs#change
       * @function
       */

    }, {
      key: '_handleTabChange',
      value: function _handleTabChange($target) {
        var $tabLink = $target.find('[role="tab"]'),
            hash = $tabLink[0].hash,
            $targetContent = this.$tabContent.find(hash),
            $oldTab = this.$element.find('.' + this.options.linkClass + '.is-active').removeClass('is-active').find('[role="tab"]').attr({ 'aria-selected': 'false' });

        $('#' + $oldTab.attr('aria-controls')).removeClass('is-active').attr({ 'aria-hidden': 'true' });

        $target.addClass('is-active');

        $tabLink.attr({ 'aria-selected': 'true' });

        $targetContent.addClass('is-active').attr({ 'aria-hidden': 'false' });

        /**
         * Fires when the plugin has successfully changed tabs.
         * @event Tabs#change
         */
        this.$element.trigger('change.zf.tabs', [$target]);
      }

      /**
       * Public method for selecting a content pane to display.
       * @param {jQuery | String} elem - jQuery object or string of the id of the pane to display.
       * @function
       */

    }, {
      key: 'selectTab',
      value: function selectTab(elem) {
        var idStr;

        if (typeof elem === 'object') {
          idStr = elem[0].id;
        } else {
          idStr = elem;
        }

        if (idStr.indexOf('#') < 0) {
          idStr = '#' + idStr;
        }

        var $target = this.$tabTitles.find('[href="' + idStr + '"]').parent('.' + this.options.linkClass);

        this._handleTabChange($target);
      }
    }, {
      key: '_setHeight',

      /**
       * Sets the height of each panel to the height of the tallest panel.
       * If enabled in options, gets called on media query change.
       * If loading content via external source, can be called directly or with _reflow.
       * @function
       * @private
       */
      value: function _setHeight() {
        var max = 0;
        this.$tabContent.find('.' + this.options.panelClass).css('height', '').each(function () {
          var panel = $(this),
              isActive = panel.hasClass('is-active');

          if (!isActive) {
            panel.css({ 'visibility': 'hidden', 'display': 'block' });
          }

          var temp = this.getBoundingClientRect().height;

          if (!isActive) {
            panel.css({
              'visibility': '',
              'display': ''
            });
          }

          max = temp > max ? temp : max;
        }).css('height', max + 'px');
      }

      /**
       * Destroys an instance of an tabs.
       * @fires Tabs#destroyed
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.find('.' + this.options.linkClass).off('.zf.tabs').hide().end().find('.' + this.options.panelClass).hide();

        if (this.options.matchHeight) {
          $(window).off('changed.zf.mediaquery');
        }

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Tabs;
  }();

  Tabs.defaults = {
    /**
     * Allows the window to scroll to content of active pane on load if set to true.
     * @option
     * @example false
     */
    autoFocus: false,

    /**
     * Allows keyboard input to 'wrap' around the tab links.
     * @option
     * @example true
     */
    wrapOnKeys: true,

    /**
     * Allows the tab content panes to match heights if set to true.
     * @option
     * @example false
     */
    matchHeight: false,

    /**
     * Class applied to `li`'s in tab link list.
     * @option
     * @example 'tabs-title'
     */
    linkClass: 'tabs-title',

    /**
     * Class applied to the content containers.
     * @option
     * @example 'tabs-panel'
     */
    panelClass: 'tabs-panel'
  };

  function checkClass($elem) {
    return $elem.hasClass('is-active');
  }

  // Window exports
  Foundation.plugin(Tabs, 'Tabs');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Toggler module.
   * @module foundation.toggler
   * @requires foundation.util.motion
   * @requires foundation.util.triggers
   */

  var Toggler = function () {
    /**
     * Creates a new instance of Toggler.
     * @class
     * @fires Toggler#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Toggler(element, options) {
      _classCallCheck(this, Toggler);

      this.$element = element;
      this.options = $.extend({}, Toggler.defaults, element.data(), options);
      this.className = '';

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'Toggler');
    }

    /**
     * Initializes the Toggler plugin by parsing the toggle class from data-toggler, or animation classes from data-animate.
     * @function
     * @private
     */


    _createClass(Toggler, [{
      key: '_init',
      value: function _init() {
        var input;
        // Parse animation classes if they were set
        if (this.options.animate) {
          input = this.options.animate.split(' ');

          this.animationIn = input[0];
          this.animationOut = input[1] || null;
        }
        // Otherwise, parse toggle class
        else {
            input = this.$element.data('toggler');
            // Allow for a . at the beginning of the string
            this.className = input[0] === '.' ? input.slice(1) : input;
          }

        // Add ARIA attributes to triggers
        var id = this.$element[0].id;
        $('[data-open="' + id + '"], [data-close="' + id + '"], [data-toggle="' + id + '"]').attr('aria-controls', id);
        // If the target is hidden, add aria-hidden
        this.$element.attr('aria-expanded', this.$element.is(':hidden') ? false : true);
      }

      /**
       * Initializes events for the toggle trigger.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        this.$element.off('toggle.zf.trigger').on('toggle.zf.trigger', this.toggle.bind(this));
      }

      /**
       * Toggles the target class on the target element. An event is fired from the original trigger depending on if the resultant state was "on" or "off".
       * @function
       * @fires Toggler#on
       * @fires Toggler#off
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        this[this.options.animate ? '_toggleAnimate' : '_toggleClass']();
      }
    }, {
      key: '_toggleClass',
      value: function _toggleClass() {
        this.$element.toggleClass(this.className);

        var isOn = this.$element.hasClass(this.className);
        if (isOn) {
          /**
           * Fires if the target element has the class after a toggle.
           * @event Toggler#on
           */
          this.$element.trigger('on.zf.toggler');
        } else {
          /**
           * Fires if the target element does not have the class after a toggle.
           * @event Toggler#off
           */
          this.$element.trigger('off.zf.toggler');
        }

        this._updateARIA(isOn);
      }
    }, {
      key: '_toggleAnimate',
      value: function _toggleAnimate() {
        var _this = this;

        if (this.$element.is(':hidden')) {
          Foundation.Motion.animateIn(this.$element, this.animationIn, function () {
            _this._updateARIA(true);
            this.trigger('on.zf.toggler');
          });
        } else {
          Foundation.Motion.animateOut(this.$element, this.animationOut, function () {
            _this._updateARIA(false);
            this.trigger('off.zf.toggler');
          });
        }
      }
    }, {
      key: '_updateARIA',
      value: function _updateARIA(isOn) {
        this.$element.attr('aria-expanded', isOn ? true : false);
      }

      /**
       * Destroys the instance of Toggler on the element.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.toggler');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return Toggler;
  }();

  Toggler.defaults = {
    /**
     * Tells the plugin if the element should animated when toggled.
     * @option
     * @example false
     */
    animate: false
  };

  // Window exports
  Foundation.plugin(Toggler, 'Toggler');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Tooltip module.
   * @module foundation.tooltip
   * @requires foundation.util.box
   * @requires foundation.util.triggers
   */

  var Tooltip = function () {
    /**
     * Creates a new instance of a Tooltip.
     * @class
     * @fires Tooltip#init
     * @param {jQuery} element - jQuery object to attach a tooltip to.
     * @param {Object} options - object to extend the default configuration.
     */
    function Tooltip(element, options) {
      _classCallCheck(this, Tooltip);

      this.$element = element;
      this.options = $.extend({}, Tooltip.defaults, this.$element.data(), options);

      this.isActive = false;
      this.isClick = false;
      this._init();

      Foundation.registerPlugin(this, 'Tooltip');
    }

    /**
     * Initializes the tooltip by setting the creating the tip element, adding it's text, setting private variables and setting attributes on the anchor.
     * @private
     */


    _createClass(Tooltip, [{
      key: '_init',
      value: function _init() {
        var elemId = this.$element.attr('aria-describedby') || Foundation.GetYoDigits(6, 'tooltip');

        this.options.positionClass = this._getPositionClass(this.$element);
        this.options.tipText = this.options.tipText || this.$element.attr('title');
        this.template = this.options.template ? $(this.options.template) : this._buildTemplate(elemId);

        this.template.appendTo(document.body).text(this.options.tipText).hide();

        this.$element.attr({
          'title': '',
          'aria-describedby': elemId,
          'data-yeti-box': elemId,
          'data-toggle': elemId,
          'data-resize': elemId
        }).addClass(this.triggerClass);

        //helper variables to track movement on collisions
        this.usedPositions = [];
        this.counter = 4;
        this.classChanged = false;

        this._events();
      }

      /**
       * Grabs the current positioning class, if present, and returns the value or an empty string.
       * @private
       */

    }, {
      key: '_getPositionClass',
      value: function _getPositionClass(element) {
        if (!element) {
          return '';
        }
        // var position = element.attr('class').match(/top|left|right/g);
        var position = element[0].className.match(/\b(top|left|right)\b/g);
        position = position ? position[0] : '';
        return position;
      }
    }, {
      key: '_buildTemplate',

      /**
       * builds the tooltip element, adds attributes, and returns the template.
       * @private
       */
      value: function _buildTemplate(id) {
        var templateClasses = (this.options.tooltipClass + ' ' + this.options.positionClass + ' ' + this.options.templateClasses).trim();
        var $template = $('<div></div>').addClass(templateClasses).attr({
          'role': 'tooltip',
          'aria-hidden': true,
          'data-is-active': false,
          'data-is-focus': false,
          'id': id
        });
        return $template;
      }

      /**
       * Function that gets called if a collision event is detected.
       * @param {String} position - positioning class to try
       * @private
       */

    }, {
      key: '_reposition',
      value: function _reposition(position) {
        this.usedPositions.push(position ? position : 'bottom');

        //default, try switching to opposite side
        if (!position && this.usedPositions.indexOf('top') < 0) {
          this.template.addClass('top');
        } else if (position === 'top' && this.usedPositions.indexOf('bottom') < 0) {
          this.template.removeClass(position);
        } else if (position === 'left' && this.usedPositions.indexOf('right') < 0) {
          this.template.removeClass(position).addClass('right');
        } else if (position === 'right' && this.usedPositions.indexOf('left') < 0) {
          this.template.removeClass(position).addClass('left');
        }

        //if default change didn't work, try bottom or left first
        else if (!position && this.usedPositions.indexOf('top') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.template.addClass('left');
          } else if (position === 'top' && this.usedPositions.indexOf('bottom') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.template.removeClass(position).addClass('left');
          } else if (position === 'left' && this.usedPositions.indexOf('right') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.template.removeClass(position);
          } else if (position === 'right' && this.usedPositions.indexOf('left') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.template.removeClass(position);
          }
          //if nothing cleared, set to bottom
          else {
              this.template.removeClass(position);
            }
        this.classChanged = true;
        this.counter--;
      }

      /**
       * sets the position class of an element and recursively calls itself until there are no more possible positions to attempt, or the tooltip element is no longer colliding.
       * if the tooltip is larger than the screen width, default to full width - any user selected margin
       * @private
       */

    }, {
      key: '_setPosition',
      value: function _setPosition() {
        var position = this._getPositionClass(this.template),
            $tipDims = Foundation.Box.GetDimensions(this.template),
            $anchorDims = Foundation.Box.GetDimensions(this.$element),
            direction = position === 'left' ? 'left' : position === 'right' ? 'left' : 'top',
            param = direction === 'top' ? 'height' : 'width',
            offset = param === 'height' ? this.options.vOffset : this.options.hOffset,
            _this = this;

        if ($tipDims.width >= $tipDims.windowDims.width || !this.counter && !Foundation.Box.ImNotTouchingYou(this.template)) {
          this.template.offset(Foundation.Box.GetOffsets(this.template, this.$element, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
            // this.$element.offset(Foundation.GetOffsets(this.template, this.$element, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
            'width': $anchorDims.windowDims.width - this.options.hOffset * 2,
            'height': 'auto'
          });
          return false;
        }

        this.template.offset(Foundation.Box.GetOffsets(this.template, this.$element, 'center ' + (position || 'bottom'), this.options.vOffset, this.options.hOffset));

        while (!Foundation.Box.ImNotTouchingYou(this.template) && this.counter) {
          this._reposition(position);
          this._setPosition();
        }
      }

      /**
       * reveals the tooltip, and fires an event to close any other open tooltips on the page
       * @fires Tooltip#closeme
       * @fires Tooltip#show
       * @function
       */

    }, {
      key: 'show',
      value: function show() {
        if (this.options.showOn !== 'all' && !Foundation.MediaQuery.atLeast(this.options.showOn)) {
          // console.error('The screen is too small to display this tooltip');
          return false;
        }

        var _this = this;
        this.template.css('visibility', 'hidden').show();
        this._setPosition();

        /**
         * Fires to close all other open tooltips on the page
         * @event Closeme#tooltip
         */
        this.$element.trigger('closeme.zf.tooltip', this.template.attr('id'));

        this.template.attr({
          'data-is-active': true,
          'aria-hidden': false
        });
        _this.isActive = true;
        // console.log(this.template);
        this.template.stop().hide().css('visibility', '').fadeIn(this.options.fadeInDuration, function () {
          //maybe do stuff?
        });
        /**
         * Fires when the tooltip is shown
         * @event Tooltip#show
         */
        this.$element.trigger('show.zf.tooltip');
      }

      /**
       * Hides the current tooltip, and resets the positioning class if it was changed due to collision
       * @fires Tooltip#hide
       * @function
       */

    }, {
      key: 'hide',
      value: function hide() {
        // console.log('hiding', this.$element.data('yeti-box'));
        var _this = this;
        this.template.stop().attr({
          'aria-hidden': true,
          'data-is-active': false
        }).fadeOut(this.options.fadeOutDuration, function () {
          _this.isActive = false;
          _this.isClick = false;
          if (_this.classChanged) {
            _this.template.removeClass(_this._getPositionClass(_this.template)).addClass(_this.options.positionClass);

            _this.usedPositions = [];
            _this.counter = 4;
            _this.classChanged = false;
          }
        });
        /**
         * fires when the tooltip is hidden
         * @event Tooltip#hide
         */
        this.$element.trigger('hide.zf.tooltip');
      }

      /**
       * adds event listeners for the tooltip and its anchor
       * TODO combine some of the listeners like focus and mouseenter, etc.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;
        var $template = this.template;
        var isFocus = false;

        if (!this.options.disableHover) {

          this.$element.on('mouseenter.zf.tooltip', function (e) {
            if (!_this.isActive) {
              _this.timeout = setTimeout(function () {
                _this.show();
              }, _this.options.hoverDelay);
            }
          }).on('mouseleave.zf.tooltip', function (e) {
            clearTimeout(_this.timeout);
            if (!isFocus || !_this.isClick && _this.options.clickOpen) {
              _this.hide();
            }
          });
        }

        if (this.options.clickOpen) {
          this.$element.on('mousedown.zf.tooltip', function (e) {
            e.stopImmediatePropagation();
            if (_this.isClick) {
              _this.hide();
              // _this.isClick = false;
            } else {
              _this.isClick = true;
              if ((_this.options.disableHover || !_this.$element.attr('tabindex')) && !_this.isActive) {
                _this.show();
              }
            }
          });
        }

        if (!this.options.disableForTouch) {
          this.$element.on('tap.zf.tooltip touchend.zf.tooltip', function (e) {
            _this.isActive ? _this.hide() : _this.show();
          });
        }

        this.$element.on({
          // 'toggle.zf.trigger': this.toggle.bind(this),
          // 'close.zf.trigger': this.hide.bind(this)
          'close.zf.trigger': this.hide.bind(this)
        });

        this.$element.on('focus.zf.tooltip', function (e) {
          isFocus = true;
          // console.log(_this.isClick);
          if (_this.isClick) {
            return false;
          } else {
            // $(window)
            _this.show();
          }
        }).on('focusout.zf.tooltip', function (e) {
          isFocus = false;
          _this.isClick = false;
          _this.hide();
        }).on('resizeme.zf.trigger', function () {
          if (_this.isActive) {
            _this._setPosition();
          }
        });
      }

      /**
       * adds a toggle method, in addition to the static show() & hide() functions
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.isActive) {
          this.hide();
        } else {
          this.show();
        }
      }

      /**
       * Destroys an instance of tooltip, removes template element from the view.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.attr('title', this.template.text()).off('.zf.trigger .zf.tootip')
        //  .removeClass('has-tip')
        .removeAttr('aria-describedby').removeAttr('data-yeti-box').removeAttr('data-toggle').removeAttr('data-resize');

        this.template.remove();

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Tooltip;
  }();

  Tooltip.defaults = {
    disableForTouch: false,
    /**
     * Time, in ms, before a tooltip should open on hover.
     * @option
     * @example 200
     */
    hoverDelay: 200,
    /**
     * Time, in ms, a tooltip should take to fade into view.
     * @option
     * @example 150
     */
    fadeInDuration: 150,
    /**
     * Time, in ms, a tooltip should take to fade out of view.
     * @option
     * @example 150
     */
    fadeOutDuration: 150,
    /**
     * Disables hover events from opening the tooltip if set to true
     * @option
     * @example false
     */
    disableHover: false,
    /**
     * Optional addtional classes to apply to the tooltip template on init.
     * @option
     * @example 'my-cool-tip-class'
     */
    templateClasses: '',
    /**
     * Non-optional class added to tooltip templates. Foundation default is 'tooltip'.
     * @option
     * @example 'tooltip'
     */
    tooltipClass: 'tooltip',
    /**
     * Class applied to the tooltip anchor element.
     * @option
     * @example 'has-tip'
     */
    triggerClass: 'has-tip',
    /**
     * Minimum breakpoint size at which to open the tooltip.
     * @option
     * @example 'small'
     */
    showOn: 'small',
    /**
     * Custom template to be used to generate markup for tooltip.
     * @option
     * @example '&lt;div class="tooltip"&gt;&lt;/div&gt;'
     */
    template: '',
    /**
     * Text displayed in the tooltip template on open.
     * @option
     * @example 'Some cool space fact here.'
     */
    tipText: '',
    touchCloseText: 'Tap to close.',
    /**
     * Allows the tooltip to remain open if triggered with a click or touch event.
     * @option
     * @example true
     */
    clickOpen: true,
    /**
     * Additional positioning classes, set by the JS
     * @option
     * @example 'top'
     */
    positionClass: '',
    /**
     * Distance, in pixels, the template should push away from the anchor on the Y axis.
     * @option
     * @example 10
     */
    vOffset: 10,
    /**
     * Distance, in pixels, the template should push away from the anchor on the X axis, if aligned to a side.
     * @option
     * @example 12
     */
    hOffset: 12
  };

  /**
   * TODO utilize resize event trigger
   */

  // Window exports
  Foundation.plugin(Tooltip, 'Tooltip');
}(jQuery);
;'use strict';

// Polyfill for requestAnimationFrame

(function () {
  if (!Date.now) Date.now = function () {
    return new Date().getTime();
  };

  var vendors = ['webkit', 'moz'];
  for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
    var vp = vendors[i];
    window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
  }
  if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
    var lastTime = 0;
    window.requestAnimationFrame = function (callback) {
      var now = Date.now();
      var nextTime = Math.max(lastTime + 16, now);
      return setTimeout(function () {
        callback(lastTime = nextTime);
      }, nextTime - now);
    };
    window.cancelAnimationFrame = clearTimeout;
  }
})();

var initClasses = ['mui-enter', 'mui-leave'];
var activeClasses = ['mui-enter-active', 'mui-leave-active'];

// Find the right "transitionend" event for this browser
var endEvent = function () {
  var transitions = {
    'transition': 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'transitionend',
    'OTransition': 'otransitionend'
  };
  var elem = window.document.createElement('div');

  for (var t in transitions) {
    if (typeof elem.style[t] !== 'undefined') {
      return transitions[t];
    }
  }

  return null;
}();

function animate(isIn, element, animation, cb) {
  element = $(element).eq(0);

  if (!element.length) return;

  if (endEvent === null) {
    isIn ? element.show() : element.hide();
    cb();
    return;
  }

  var initClass = isIn ? initClasses[0] : initClasses[1];
  var activeClass = isIn ? activeClasses[0] : activeClasses[1];

  // Set up the animation
  reset();
  element.addClass(animation);
  element.css('transition', 'none');
  requestAnimationFrame(function () {
    element.addClass(initClass);
    if (isIn) element.show();
  });

  // Start the animation
  requestAnimationFrame(function () {
    element[0].offsetWidth;
    element.css('transition', '');
    element.addClass(activeClass);
  });

  // Clean up the animation when it finishes
  element.one('transitionend', finish);

  // Hides the element (for out animations), resets the element, and runs a callback
  function finish() {
    if (!isIn) element.hide();
    reset();
    if (cb) cb.apply(element);
  }

  // Resets transitions and removes motion-specific classes
  function reset() {
    element[0].style.transitionDuration = 0;
    element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
  }
}

var MotionUI = {
  animateIn: function (element, animation, cb) {
    animate(true, element, animation, cb);
  },

  animateOut: function (element, animation, cb) {
    animate(false, element, animation, cb);
  }
};
;'use strict';

$(document).ready(function () {
    $('.accordion-title').prepend('<div class="accordion-plus-button">+</div>');
});

$('.accordion-expand-all').click(function () {
    console.log('Clicked');
    $('#action-plan').foundation('down', $('.accordion-content'));
});
;'use strict';

;(function ($) {

  function animateAuto(element, options, duration, easing, callback) {

    var $el = $(element),
        settings = $.extend({}, $.fn.animateAuto.defaults, options),
        dimension = settings.dimension,
        oppositeDimension = dimension === 'height' ? 'width' : 'height';

    // Determine which function to run based on the setting `action`.
    switch (settings.action) {
      case 'open':
        openEl($el);
        break;
      case 'close':
        closeEl($el);
        break;
      case 'toggle':
        toggleEl($el);
        break;
      default:
        throw new Error('jquery.animateAuto only performs the actions "open", "close" and "toggle". You seem to have tried something else.');
    }

    function getTargetDimension($el) {
      // Create a hidden clone of $el, appended to
      // $el's parent and with $el's `oppositeDimension`,
      // to ensure it will have dimensions tailored to
      // $el's context.
      // Return the clone's relevant dimension.
      var $clone = $el.clone().css({
        oppositeDimension: $el.css(oppositeDimension),
        'visibility': 'hidden'
      }).appendTo($el.parent());
      var cloneContentDimension = $clone.css(dimension, 'auto').css(dimension);
      $clone.remove();
      return cloneContentDimension;
    }

    function openEl($el) {
      // Pass jQuery.animate() $el's target dimension
      // and all the other parameters.
      // As part of the callback, set $el's
      // inline-style dimension to `auto`.
      // And add the `openClass`.
      if (!$el.hasClass(settings.openClass)) {
        var animObj = {};
        animObj[dimension] = getTargetDimension($el);
        $el.animate(animObj, duration, easing, function () {
          $el.css(dimension, 'auto');
          callback();
        }).addClass(settings.openClass);
      }
    }

    function closeEl($el) {
      // Pass jQuery.animate() $el's `closed`
      // and all the other parameters.
      // And remove the `openClass`.
      if ($el.css(dimension) !== settings.closed) {
        var animObj = {};
        animObj[dimension] = settings.closed;
        $el.animate(animObj, duration, easing, callback).removeClass(settings.openClass);
      }
    }

    function toggleEl($el) {
      if ($el.hasClass(settings.openClass)) {
        closeEl($el);
      } else {
        openEl($el);
      }
    }
  }

  function processArgs() {
    // User can pass the 4 possible arguments in any order.
    // `options` are plugins-specific settings.
    // The options `dimensions` and `action` can also
    // be passed as isolated strings.
    // `duration`, `easing`, and `callback` corresponds to
    // (and become) jQuery.animate() arguments.
    var options = {},
        callback = function () {},
        duration,
        easing;
    var l = arguments.length;
    for (var i = 0; i < l; i++) {
      var arg = arguments[i],
          argType = typeof arg;
      if (!arg) {
        continue;
      }
      // Check for pre-established string values.
      switch (arg) {
        // Check for `dimension` string.
        case 'height':
        case 'width':
          $.extend(options, { dimension: arg });
          continue;
        // Check for `action` string.
        case 'open':
        case 'close':
        case 'toggle':
          $.extend(options, { action: arg });
          continue;
        // Check for `duration` string (in jQuery API).
        case 'fast':
        case 'slow':
          duration = arg;
          continue;
      }
      // For other arguments.
      switch (argType) {
        // Numbers will always be durations.
        case 'number':
          duration = arg;
          continue;
        // Strings, after above filtering, will
        // always be easing.
        case 'string':
          easing = arg;
          continue;
        // Functions will always be callbacks.
        case 'function':
          callback = arg;
          continue;
        // Objects will always be arguments.
        case 'object':
          $.extend(options, arg);
          continue;
      }
    }
    return [options, duration, easing, callback];
  }

  $.fn.animateAuto = function () {
    var argsArray = processArgs.apply(this, arguments);
    return this.each(function () {
      animateAuto.apply(null, [this].concat(argsArray));
    });
  };

  $.fn.animateAuto.defaults = {
    dimension: 'height', // or 'width'
    action: 'toggle', // or 'open' or 'close'
    closed: 0,
    openClass: 'is-opened'
  };
})(jQuery);
;'use strict';

jQuery('iframe[src*="youtube.com"]').wrap("<div class='flex-video widescreen'/>");
jQuery('iframe[src*="vimeo.com"]').wrap("<div class='flex-video widescreen vimeo'/>");
;"use strict";

$(document).foundation();
;'use strict';

// Joyride demo
$('#start-jr').on('click', function () {
  $(document).foundation('joyride', 'start');
});
;"use strict";
;'use strict';

$('.read-more-link').click(function () {
    $('.read-more-content').css('height', 'auto');
    $('.read-more-link').css('display', 'none');
});
;'use strict';

$(window).bind(' load resize orientationChange ', function () {
   var footer = $("#footer-container");
   var pos = footer.position();
   var height = $(window).height();
   height = height - pos.top;
   height = height - footer.height() - 1;

   function stickyFooter() {
      footer.css({
         'margin-top': height + 'px'
      });
   }

   if (height > 0) {
      stickyFooter();
   }
});
;'use strict';

$(document).ready(function () {
    $('.top-bar-right > .menu > li:last-child').addClass('top-bar-donate');
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndoYXQtaW5wdXQuanMiLCJmb3VuZGF0aW9uLmNvcmUuanMiLCJmb3VuZGF0aW9uLnV0aWwuYm94LmpzIiwiZm91bmRhdGlvbi51dGlsLmtleWJvYXJkLmpzIiwiZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnkuanMiLCJmb3VuZGF0aW9uLnV0aWwubW90aW9uLmpzIiwiZm91bmRhdGlvbi51dGlsLm5lc3QuanMiLCJmb3VuZGF0aW9uLnV0aWwudGltZXJBbmRJbWFnZUxvYWRlci5qcyIsImZvdW5kYXRpb24udXRpbC50b3VjaC5qcyIsImZvdW5kYXRpb24udXRpbC50cmlnZ2Vycy5qcyIsImZvdW5kYXRpb24uYWJpZGUuanMiLCJmb3VuZGF0aW9uLmFjY29yZGlvbi5qcyIsImZvdW5kYXRpb24uYWNjb3JkaW9uTWVudS5qcyIsImZvdW5kYXRpb24uZHJpbGxkb3duLmpzIiwiZm91bmRhdGlvbi5kcm9wZG93bi5qcyIsImZvdW5kYXRpb24uZHJvcGRvd25NZW51LmpzIiwiZm91bmRhdGlvbi5lcXVhbGl6ZXIuanMiLCJmb3VuZGF0aW9uLmludGVyY2hhbmdlLmpzIiwiZm91bmRhdGlvbi5tYWdlbGxhbi5qcyIsImZvdW5kYXRpb24ub2ZmY2FudmFzLmpzIiwiZm91bmRhdGlvbi5vcmJpdC5qcyIsImZvdW5kYXRpb24ucmVzcG9uc2l2ZU1lbnUuanMiLCJmb3VuZGF0aW9uLnJlc3BvbnNpdmVUb2dnbGUuanMiLCJmb3VuZGF0aW9uLnJldmVhbC5qcyIsImZvdW5kYXRpb24uc2xpZGVyLmpzIiwiZm91bmRhdGlvbi5zdGlja3kuanMiLCJmb3VuZGF0aW9uLnRhYnMuanMiLCJmb3VuZGF0aW9uLnRvZ2dsZXIuanMiLCJmb3VuZGF0aW9uLnRvb2x0aXAuanMiLCJtb3Rpb24tdWkuanMiLCJhY2NvcmRpb24tYWRkaXRpb25zLmpzIiwiYW5pbWF0ZWF1dG8uanMiLCJmbGV4LXZpZGVvLmpzIiwiaW5pdC1mb3VuZGF0aW9uLmpzIiwiam95cmlkZS1kZW1vLmpzIiwib2ZmQ2FudmFzLmpzIiwicmVhZC1tb3JlLmpzIiwic3RpY2t5Zm9vdGVyLmpzIiwidG9wLWJhci1hZGRpdGlvbnMuanMiXSwibmFtZXMiOlsid2luZG93Iiwid2hhdElucHV0IiwiYWN0aXZlS2V5cyIsImJvZHkiLCJidWZmZXIiLCJjdXJyZW50SW5wdXQiLCJub25UeXBpbmdJbnB1dHMiLCJtb3VzZVdoZWVsIiwiZGV0ZWN0V2hlZWwiLCJpZ25vcmVNYXAiLCJpbnB1dE1hcCIsImlucHV0VHlwZXMiLCJrZXlNYXAiLCJwb2ludGVyTWFwIiwidGltZXIiLCJldmVudEJ1ZmZlciIsImNsZWFyVGltZXIiLCJzZXRJbnB1dCIsImV2ZW50Iiwic2V0VGltZW91dCIsImJ1ZmZlcmVkRXZlbnQiLCJ1bkJ1ZmZlcmVkRXZlbnQiLCJjbGVhclRpbWVvdXQiLCJldmVudEtleSIsImtleSIsInZhbHVlIiwidHlwZSIsInBvaW50ZXJUeXBlIiwiZXZlbnRUYXJnZXQiLCJ0YXJnZXQiLCJldmVudFRhcmdldE5vZGUiLCJub2RlTmFtZSIsInRvTG93ZXJDYXNlIiwiZXZlbnRUYXJnZXRUeXBlIiwiZ2V0QXR0cmlidXRlIiwiaGFzQXR0cmlidXRlIiwiaW5kZXhPZiIsInN3aXRjaElucHV0IiwibG9nS2V5cyIsInN0cmluZyIsInNldEF0dHJpYnV0ZSIsInB1c2giLCJrZXlDb2RlIiwid2hpY2giLCJzcmNFbGVtZW50IiwidW5Mb2dLZXlzIiwiYXJyYXlQb3MiLCJzcGxpY2UiLCJiaW5kRXZlbnRzIiwiZG9jdW1lbnQiLCJQb2ludGVyRXZlbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiTVNQb2ludGVyRXZlbnQiLCJjcmVhdGVFbGVtZW50Iiwib25tb3VzZXdoZWVsIiwidW5kZWZpbmVkIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJhc2siLCJrZXlzIiwidHlwZXMiLCJzZXQiLCIkIiwiRk9VTkRBVElPTl9WRVJTSU9OIiwiRm91bmRhdGlvbiIsInZlcnNpb24iLCJfcGx1Z2lucyIsIl91dWlkcyIsInJ0bCIsImF0dHIiLCJwbHVnaW4iLCJuYW1lIiwiY2xhc3NOYW1lIiwiZnVuY3Rpb25OYW1lIiwiYXR0ck5hbWUiLCJoeXBoZW5hdGUiLCJyZWdpc3RlclBsdWdpbiIsInBsdWdpbk5hbWUiLCJjb25zdHJ1Y3RvciIsInV1aWQiLCJHZXRZb0RpZ2l0cyIsIiRlbGVtZW50IiwiZGF0YSIsInRyaWdnZXIiLCJ1bnJlZ2lzdGVyUGx1Z2luIiwicmVtb3ZlQXR0ciIsInJlbW92ZURhdGEiLCJwcm9wIiwicmVJbml0IiwicGx1Z2lucyIsImlzSlEiLCJlYWNoIiwiX2luaXQiLCJfdGhpcyIsImZucyIsInBsZ3MiLCJmb3JFYWNoIiwicCIsImZvdW5kYXRpb24iLCJPYmplY3QiLCJlcnIiLCJjb25zb2xlIiwiZXJyb3IiLCJsZW5ndGgiLCJuYW1lc3BhY2UiLCJNYXRoIiwicm91bmQiLCJwb3ciLCJyYW5kb20iLCJ0b1N0cmluZyIsInNsaWNlIiwicmVmbG93IiwiZWxlbSIsImkiLCIkZWxlbSIsImZpbmQiLCJhZGRCYWNrIiwiJGVsIiwib3B0cyIsIndhcm4iLCJ0aGluZyIsInNwbGl0IiwiZSIsIm9wdCIsIm1hcCIsImVsIiwidHJpbSIsInBhcnNlVmFsdWUiLCJlciIsImdldEZuTmFtZSIsInRyYW5zaXRpb25lbmQiLCJ0cmFuc2l0aW9ucyIsImVuZCIsInQiLCJzdHlsZSIsInRyaWdnZXJIYW5kbGVyIiwidXRpbCIsInRocm90dGxlIiwiZnVuYyIsImRlbGF5IiwiY29udGV4dCIsImFyZ3MiLCJhcmd1bWVudHMiLCJhcHBseSIsIm1ldGhvZCIsIiRtZXRhIiwiJG5vSlMiLCJhcHBlbmRUbyIsImhlYWQiLCJyZW1vdmVDbGFzcyIsIk1lZGlhUXVlcnkiLCJjYWxsIiwicGx1Z0NsYXNzIiwiUmVmZXJlbmNlRXJyb3IiLCJUeXBlRXJyb3IiLCJmbiIsIkRhdGUiLCJub3ciLCJnZXRUaW1lIiwidmVuZG9ycyIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInZwIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJ0ZXN0IiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwibGFzdFRpbWUiLCJjYWxsYmFjayIsIm5leHRUaW1lIiwibWF4IiwicGVyZm9ybWFuY2UiLCJzdGFydCIsIkZ1bmN0aW9uIiwiYmluZCIsIm9UaGlzIiwiYUFyZ3MiLCJmVG9CaW5kIiwiZk5PUCIsImZCb3VuZCIsImNvbmNhdCIsImZ1bmNOYW1lUmVnZXgiLCJyZXN1bHRzIiwiZXhlYyIsInN0ciIsImlzTmFOIiwicGFyc2VGbG9hdCIsInJlcGxhY2UiLCJqUXVlcnkiLCJCb3giLCJJbU5vdFRvdWNoaW5nWW91IiwiR2V0RGltZW5zaW9ucyIsIkdldE9mZnNldHMiLCJlbGVtZW50IiwicGFyZW50IiwibHJPbmx5IiwidGJPbmx5IiwiZWxlRGltcyIsInRvcCIsImJvdHRvbSIsImxlZnQiLCJyaWdodCIsInBhckRpbXMiLCJvZmZzZXQiLCJoZWlnaHQiLCJ3aWR0aCIsIndpbmRvd0RpbXMiLCJhbGxEaXJzIiwiRXJyb3IiLCJyZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwicGFyUmVjdCIsInBhcmVudE5vZGUiLCJ3aW5SZWN0Iiwid2luWSIsInBhZ2VZT2Zmc2V0Iiwid2luWCIsInBhZ2VYT2Zmc2V0IiwicGFyZW50RGltcyIsImFuY2hvciIsInBvc2l0aW9uIiwidk9mZnNldCIsImhPZmZzZXQiLCJpc092ZXJmbG93IiwiJGVsZURpbXMiLCIkYW5jaG9yRGltcyIsImtleUNvZGVzIiwiY29tbWFuZHMiLCJLZXlib2FyZCIsImdldEtleUNvZGVzIiwicGFyc2VLZXkiLCJTdHJpbmciLCJmcm9tQ2hhckNvZGUiLCJ0b1VwcGVyQ2FzZSIsInNoaWZ0S2V5IiwiY3RybEtleSIsImFsdEtleSIsImhhbmRsZUtleSIsImNvbXBvbmVudCIsImZ1bmN0aW9ucyIsImNvbW1hbmRMaXN0IiwiY21kcyIsImNvbW1hbmQiLCJsdHIiLCJleHRlbmQiLCJoYW5kbGVkIiwidW5oYW5kbGVkIiwiZmluZEZvY3VzYWJsZSIsImZpbHRlciIsImlzIiwicmVnaXN0ZXIiLCJjb21wb25lbnROYW1lIiwia2NzIiwiayIsImtjIiwiZGVmYXVsdFF1ZXJpZXMiLCJsYW5kc2NhcGUiLCJwb3J0cmFpdCIsInJldGluYSIsInF1ZXJpZXMiLCJjdXJyZW50Iiwic2VsZiIsImV4dHJhY3RlZFN0eWxlcyIsImNzcyIsIm5hbWVkUXVlcmllcyIsInBhcnNlU3R5bGVUb09iamVjdCIsIl9nZXRDdXJyZW50U2l6ZSIsIl93YXRjaGVyIiwiYXRMZWFzdCIsInNpemUiLCJxdWVyeSIsImdldCIsIm1hdGNoTWVkaWEiLCJtYXRjaGVzIiwibWF0Y2hlZCIsIm9uIiwibmV3U2l6ZSIsInN0eWxlTWVkaWEiLCJtZWRpYSIsInNjcmlwdCIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwiaW5mbyIsImlkIiwiaW5zZXJ0QmVmb3JlIiwiZ2V0Q29tcHV0ZWRTdHlsZSIsImN1cnJlbnRTdHlsZSIsIm1hdGNoTWVkaXVtIiwidGV4dCIsInN0eWxlU2hlZXQiLCJjc3NUZXh0IiwidGV4dENvbnRlbnQiLCJzdHlsZU9iamVjdCIsInJlZHVjZSIsInJldCIsInBhcmFtIiwicGFydHMiLCJ2YWwiLCJkZWNvZGVVUklDb21wb25lbnQiLCJoYXNPd25Qcm9wZXJ0eSIsImlzQXJyYXkiLCJpbml0Q2xhc3NlcyIsImFjdGl2ZUNsYXNzZXMiLCJNb3Rpb24iLCJhbmltYXRlSW4iLCJhbmltYXRpb24iLCJjYiIsImFuaW1hdGUiLCJhbmltYXRlT3V0IiwiTW92ZSIsImR1cmF0aW9uIiwiYW5pbSIsInByb2ciLCJtb3ZlIiwidHMiLCJpc0luIiwiZXEiLCJpbml0Q2xhc3MiLCJhY3RpdmVDbGFzcyIsInJlc2V0IiwiYWRkQ2xhc3MiLCJzaG93Iiwib2Zmc2V0V2lkdGgiLCJvbmUiLCJmaW5pc2giLCJoaWRlIiwidHJhbnNpdGlvbkR1cmF0aW9uIiwiTmVzdCIsIkZlYXRoZXIiLCJtZW51IiwiaXRlbXMiLCJzdWJNZW51Q2xhc3MiLCJzdWJJdGVtQ2xhc3MiLCJoYXNTdWJDbGFzcyIsIiRpdGVtIiwiJHN1YiIsImNoaWxkcmVuIiwiQnVybiIsIlRpbWVyIiwib3B0aW9ucyIsIm5hbWVTcGFjZSIsInJlbWFpbiIsImlzUGF1c2VkIiwicmVzdGFydCIsImluZmluaXRlIiwicGF1c2UiLCJvbkltYWdlc0xvYWRlZCIsImltYWdlcyIsInVubG9hZGVkIiwiY29tcGxldGUiLCJzaW5nbGVJbWFnZUxvYWRlZCIsIm5hdHVyYWxXaWR0aCIsInNwb3RTd2lwZSIsImVuYWJsZWQiLCJkb2N1bWVudEVsZW1lbnQiLCJwcmV2ZW50RGVmYXVsdCIsIm1vdmVUaHJlc2hvbGQiLCJ0aW1lVGhyZXNob2xkIiwic3RhcnRQb3NYIiwic3RhcnRQb3NZIiwic3RhcnRUaW1lIiwiZWxhcHNlZFRpbWUiLCJpc01vdmluZyIsIm9uVG91Y2hFbmQiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwib25Ub3VjaE1vdmUiLCJ4IiwidG91Y2hlcyIsInBhZ2VYIiwieSIsInBhZ2VZIiwiZHgiLCJkeSIsImRpciIsImFicyIsIm9uVG91Y2hTdGFydCIsImluaXQiLCJ0ZWFyZG93biIsInNwZWNpYWwiLCJzd2lwZSIsInNldHVwIiwibm9vcCIsImFkZFRvdWNoIiwiaGFuZGxlVG91Y2giLCJjaGFuZ2VkVG91Y2hlcyIsImZpcnN0IiwiZXZlbnRUeXBlcyIsInRvdWNoc3RhcnQiLCJ0b3VjaG1vdmUiLCJ0b3VjaGVuZCIsInNpbXVsYXRlZEV2ZW50IiwiTW91c2VFdmVudCIsInNjcmVlblgiLCJzY3JlZW5ZIiwiY2xpZW50WCIsImNsaWVudFkiLCJjcmVhdGVFdmVudCIsImluaXRNb3VzZUV2ZW50IiwiZGlzcGF0Y2hFdmVudCIsIk11dGF0aW9uT2JzZXJ2ZXIiLCJwcmVmaXhlcyIsInRyaWdnZXJzIiwic3RvcFByb3BhZ2F0aW9uIiwiZmFkZU91dCIsImxvYWQiLCJjaGVja0xpc3RlbmVycyIsImV2ZW50c0xpc3RlbmVyIiwicmVzaXplTGlzdGVuZXIiLCJzY3JvbGxMaXN0ZW5lciIsImNsb3NlbWVMaXN0ZW5lciIsInlldGlCb3hlcyIsInBsdWdOYW1lcyIsImxpc3RlbmVycyIsImpvaW4iLCJvZmYiLCJwbHVnaW5JZCIsIm5vdCIsImRlYm91bmNlIiwiJG5vZGVzIiwibm9kZXMiLCJxdWVyeVNlbGVjdG9yQWxsIiwibGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbiIsIm11dGF0aW9uUmVjb3Jkc0xpc3QiLCIkdGFyZ2V0IiwiZWxlbWVudE9ic2VydmVyIiwib2JzZXJ2ZSIsImF0dHJpYnV0ZXMiLCJjaGlsZExpc3QiLCJjaGFyYWN0ZXJEYXRhIiwic3VidHJlZSIsImF0dHJpYnV0ZUZpbHRlciIsIklIZWFyWW91IiwiQWJpZGUiLCJkZWZhdWx0cyIsIiRpbnB1dHMiLCJfZXZlbnRzIiwicmVzZXRGb3JtIiwidmFsaWRhdGVGb3JtIiwidmFsaWRhdGVPbiIsInZhbGlkYXRlSW5wdXQiLCJsaXZlVmFsaWRhdGUiLCJpc0dvb2QiLCIkZXJyb3IiLCJzaWJsaW5ncyIsImZvcm1FcnJvclNlbGVjdG9yIiwiJGxhYmVsIiwiY2xvc2VzdCIsIiRlbHMiLCJsYWJlbHMiLCJmaW5kTGFiZWwiLCIkZm9ybUVycm9yIiwiZmluZEZvcm1FcnJvciIsImxhYmVsRXJyb3JDbGFzcyIsImZvcm1FcnJvckNsYXNzIiwiaW5wdXRFcnJvckNsYXNzIiwiZ3JvdXBOYW1lIiwiJGxhYmVscyIsImZpbmRSYWRpb0xhYmVscyIsIiRmb3JtRXJyb3JzIiwicmVtb3ZlUmFkaW9FcnJvckNsYXNzZXMiLCJjbGVhclJlcXVpcmUiLCJyZXF1aXJlZENoZWNrIiwidmFsaWRhdGVkIiwiY3VzdG9tVmFsaWRhdG9yIiwidmFsaWRhdG9yIiwiZXF1YWxUbyIsInZhbGlkYXRlUmFkaW8iLCJ2YWxpZGF0ZVRleHQiLCJtYXRjaFZhbGlkYXRpb24iLCJ2YWxpZGF0b3JzIiwiZ29vZFRvR28iLCJtZXNzYWdlIiwiYWNjIiwibm9FcnJvciIsInBhdHRlcm4iLCJpbnB1dFRleHQiLCJ2YWxpZCIsInBhdHRlcm5zIiwiUmVnRXhwIiwiJGdyb3VwIiwicmVxdWlyZWQiLCJjbGVhciIsInYiLCIkZm9ybSIsInJlbW92ZUVycm9yQ2xhc3NlcyIsImFscGhhIiwiYWxwaGFfbnVtZXJpYyIsImludGVnZXIiLCJudW1iZXIiLCJjYXJkIiwiY3Z2IiwiZW1haWwiLCJ1cmwiLCJkb21haW4iLCJkYXRldGltZSIsImRhdGUiLCJ0aW1lIiwiZGF0ZUlTTyIsIm1vbnRoX2RheV95ZWFyIiwiZGF5X21vbnRoX3llYXIiLCJjb2xvciIsIkFjY29yZGlvbiIsIiR0YWJzIiwiaWR4IiwiJGNvbnRlbnQiLCJsaW5rSWQiLCIkaW5pdEFjdGl2ZSIsImRvd24iLCIkdGFiQ29udGVudCIsImhhc0NsYXNzIiwiYWxsb3dBbGxDbG9zZWQiLCJ1cCIsInRvZ2dsZSIsIm5leHQiLCIkYSIsImZvY3VzIiwibXVsdGlFeHBhbmQiLCJwcmV2aW91cyIsInByZXYiLCJmaXJzdFRpbWUiLCIkY3VycmVudEFjdGl2ZSIsInNsaWRlRG93biIsInNsaWRlU3BlZWQiLCIkYXVudHMiLCJjYW5DbG9zZSIsInNsaWRlVXAiLCJBY2NvcmRpb25NZW51IiwibXVsdGlPcGVuIiwiJG1lbnVMaW5rcyIsInN1YklkIiwiaXNBY3RpdmUiLCJpbml0UGFuZXMiLCIkc3VibWVudSIsIiRlbGVtZW50cyIsIiRwcmV2RWxlbWVudCIsIiRuZXh0RWxlbWVudCIsIm1pbiIsInBhcmVudHMiLCJvcGVuIiwiY2xvc2UiLCJjbG9zZUFsbCIsImhpZGVBbGwiLCJzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24iLCJwYXJlbnRzVW50aWwiLCJhZGQiLCIkbWVudXMiLCJEcmlsbGRvd24iLCIkc3VibWVudUFuY2hvcnMiLCIkc3VibWVudXMiLCIkbWVudUl0ZW1zIiwiX3ByZXBhcmVNZW51IiwiX2tleWJvYXJkRXZlbnRzIiwiJGxpbmsiLCJwYXJlbnRMaW5rIiwiY2xvbmUiLCJwcmVwZW5kVG8iLCJ3cmFwIiwiJG1lbnUiLCIkYmFjayIsInByZXBlbmQiLCJiYWNrQnV0dG9uIiwiX2JhY2siLCIkd3JhcHBlciIsIndyYXBwZXIiLCJfZ2V0TWF4RGltcyIsIl9zaG93IiwiY2xvc2VPbkNsaWNrIiwiJGJvZHkiLCJfaGlkZUFsbCIsIl9oaWRlIiwiYmx1ciIsInJlc3VsdCIsIm51bU9mRWxlbXMiLCJ1bndyYXAiLCJyZW1vdmUiLCJEcm9wZG93biIsIiRpZCIsIiRhbmNob3IiLCJwb3NpdGlvbkNsYXNzIiwiZ2V0UG9zaXRpb25DbGFzcyIsImNvdW50ZXIiLCJ1c2VkUG9zaXRpb25zIiwidmVydGljYWxQb3NpdGlvbiIsIm1hdGNoIiwiaG9yaXpvbnRhbFBvc2l0aW9uIiwiY2xhc3NDaGFuZ2VkIiwiZGlyZWN0aW9uIiwiX3JlcG9zaXRpb24iLCJfc2V0UG9zaXRpb24iLCJob3ZlciIsInRpbWVvdXQiLCJob3ZlckRlbGF5IiwiaG92ZXJQYW5lIiwidmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzIiwidGFiX2ZvcndhcmQiLCJ0cmFwRm9jdXMiLCJ0YWJfYmFja3dhcmQiLCJhdXRvRm9jdXMiLCIkZm9jdXNhYmxlIiwiX2FkZEJvZHlIYW5kbGVyIiwiY3VyUG9zaXRpb25DbGFzcyIsIkRyb3Bkb3duTWVudSIsInN1YnMiLCJ2ZXJ0aWNhbENsYXNzIiwicmlnaHRDbGFzcyIsImFsaWdubWVudCIsImNoYW5nZWQiLCJoYXNUb3VjaCIsIm9udG91Y2hzdGFydCIsInBhckNsYXNzIiwiY2xpY2tPcGVuIiwiaGFzU3ViIiwiaGFzQ2xpY2tlZCIsImZvcmNlRm9sbG93IiwiZGlzYWJsZUhvdmVyIiwiYXV0b2Nsb3NlIiwiY2xvc2luZ1RpbWUiLCJpc1RhYiIsImluZGV4IiwibmV4dFNpYmxpbmciLCJwcmV2U2libGluZyIsIm9wZW5TdWIiLCJjbG9zZVN1YiIsInZlcnRpY2FsIiwiJHNpYnMiLCJvbGRDbGFzcyIsIiRwYXJlbnRMaSIsIiR0b0Nsb3NlIiwic29tZXRoaW5nVG9DbG9zZSIsIkVxdWFsaXplciIsImVxSWQiLCIkd2F0Y2hlZCIsImhhc05lc3RlZCIsImlzTmVzdGVkIiwiaXNPbiIsImltZ3MiLCJ0b29TbWFsbCIsImVxdWFsaXplT24iLCJfY2hlY2tNUSIsIl9yZWZsb3ciLCJfcGF1c2VFdmVudHMiLCJlcXVhbGl6ZU9uU3RhY2siLCJfaXNTdGFja2VkIiwiZXF1YWxpemVCeVJvdyIsImdldEhlaWdodHNCeVJvdyIsImFwcGx5SGVpZ2h0QnlSb3ciLCJnZXRIZWlnaHRzIiwiYXBwbHlIZWlnaHQiLCJvZmZzZXRUb3AiLCJoZWlnaHRzIiwibGVuIiwib2Zmc2V0SGVpZ2h0IiwibGFzdEVsVG9wT2Zmc2V0IiwiZ3JvdXBzIiwiZ3JvdXAiLCJlbE9mZnNldFRvcCIsImoiLCJsbiIsImdyb3Vwc0lMZW5ndGgiLCJsZW5KIiwiSW50ZXJjaGFuZ2UiLCJydWxlcyIsImN1cnJlbnRQYXRoIiwiX2FkZEJyZWFrcG9pbnRzIiwiX2dlbmVyYXRlUnVsZXMiLCJydWxlIiwicGF0aCIsIlNQRUNJQUxfUVVFUklFUyIsInJ1bGVzTGlzdCIsInJlc3BvbnNlIiwiaHRtbCIsIk1hZ2VsbGFuIiwiJHRhcmdldHMiLCIkbGlua3MiLCIkYWN0aXZlIiwic2Nyb2xsUG9zIiwicGFyc2VJbnQiLCJwb2ludHMiLCJ3aW5IZWlnaHQiLCJpbm5lckhlaWdodCIsImNsaWVudEhlaWdodCIsImRvY0hlaWdodCIsInNjcm9sbEhlaWdodCIsIiR0YXIiLCJwdCIsInRocmVzaG9sZCIsInRhcmdldFBvaW50IiwiYW5pbWF0aW9uRHVyYXRpb24iLCJlYXNpbmciLCJhbmltYXRpb25FYXNpbmciLCJkZWVwTGlua2luZyIsImxvY2F0aW9uIiwiaGFzaCIsInNjcm9sbFRvTG9jIiwiY2FsY1BvaW50cyIsIl91cGRhdGVBY3RpdmUiLCJhcnJpdmFsIiwibG9jIiwiYmFyT2Zmc2V0Iiwic3RvcCIsInNjcm9sbFRvcCIsIndpblBvcyIsImN1cklkeCIsImlzRG93biIsImN1clZpc2libGUiLCJoaXN0b3J5IiwicHVzaFN0YXRlIiwiT2ZmQ2FudmFzIiwiJGxhc3RUcmlnZ2VyIiwiJGV4aXRlciIsImV4aXRlciIsImFwcGVuZCIsImlzUmV2ZWFsZWQiLCJyZXZlYWxDbGFzcyIsInJldmVhbE9uIiwiX3NldE1RQ2hlY2tlciIsInRyYW5zaXRpb25UaW1lIiwiX2hhbmRsZUtleWJvYXJkIiwicmV2ZWFsIiwiJGNsb3NlciIsImZvcmNlVG9wIiwiX3RyYXBGb2N1cyIsImZvY3VzYWJsZSIsImxhc3QiLCJrZXljb2RlIiwiT3JiaXQiLCJjb250YWluZXJDbGFzcyIsIiRzbGlkZXMiLCJzbGlkZUNsYXNzIiwiJGltYWdlcyIsImluaXRBY3RpdmUiLCJ1c2VNVUkiLCJfcHJlcGFyZUZvck9yYml0IiwiYnVsbGV0cyIsIl9sb2FkQnVsbGV0cyIsImF1dG9QbGF5IiwiZ2VvU3luYyIsImFjY2Vzc2libGUiLCIkYnVsbGV0cyIsImJveE9mQnVsbGV0cyIsInRpbWVyRGVsYXkiLCJjaGFuZ2VTbGlkZSIsIl9zZXRXcmFwcGVySGVpZ2h0IiwiX3NldFNsaWRlSGVpZ2h0IiwidGVtcCIsInBhdXNlT25Ib3ZlciIsIm5hdkJ1dHRvbnMiLCIkY29udHJvbHMiLCJuZXh0Q2xhc3MiLCJwcmV2Q2xhc3MiLCIkc2xpZGUiLCJpc0xUUiIsImNob3NlblNsaWRlIiwiJGN1clNsaWRlIiwiJGZpcnN0U2xpZGUiLCIkbGFzdFNsaWRlIiwiZGlySW4iLCJkaXJPdXQiLCIkbmV3U2xpZGUiLCJpbmZpbml0ZVdyYXAiLCJfdXBkYXRlQnVsbGV0cyIsIiRvbGRCdWxsZXQiLCJzcGFuIiwiZGV0YWNoIiwiJG5ld0J1bGxldCIsImFuaW1JbkZyb21SaWdodCIsImFuaW1PdXRUb1JpZ2h0IiwiYW5pbUluRnJvbUxlZnQiLCJhbmltT3V0VG9MZWZ0IiwiUmVzcG9uc2l2ZU1lbnUiLCJjdXJyZW50TXEiLCJjdXJyZW50UGx1Z2luIiwicnVsZXNUcmVlIiwicnVsZVNpemUiLCJydWxlUGx1Z2luIiwiTWVudVBsdWdpbnMiLCJpc0VtcHR5T2JqZWN0IiwiX2NoZWNrTWVkaWFRdWVyaWVzIiwibWF0Y2hlZE1xIiwiY3NzQ2xhc3MiLCJkZXN0cm95IiwiZHJvcGRvd24iLCJkcmlsbGRvd24iLCJhY2NvcmRpb24iLCJSZXNwb25zaXZlVG9nZ2xlIiwidGFyZ2V0SUQiLCIkdGFyZ2V0TWVudSIsIiR0b2dnbGVyIiwiX3VwZGF0ZSIsInRvZ2dsZU1lbnUiLCJoaWRlRm9yIiwiUmV2ZWFsIiwiY2FjaGVkIiwibXEiLCJpc2lPUyIsImlQaG9uZVNuaWZmIiwiYW5jaG9ySWQiLCJmdWxsU2NyZWVuIiwib3ZlcmxheSIsIiRvdmVybGF5IiwiX21ha2VPdmVybGF5IiwiZGVlcExpbmsiLCJvdXRlcldpZHRoIiwib3V0ZXJIZWlnaHQiLCJtYXJnaW4iLCJfdXBkYXRlUG9zaXRpb24iLCJjb250YWlucyIsIl9oYW5kbGVTdGF0ZSIsIm11bHRpcGxlT3BlbmVkIiwiYW5pbWF0aW9uSW4iLCJmb2N1c2FibGVFbGVtZW50cyIsInNob3dEZWxheSIsIl9leHRyYUhhbmRsZXJzIiwiY2xvc2VPbkVzYyIsImFuaW1hdGlvbk91dCIsImZpbmlzaFVwIiwiaGlkZURlbGF5IiwicmVzZXRPbkNsb3NlIiwicmVwbGFjZVN0YXRlIiwidGl0bGUiLCJwYXRobmFtZSIsImJ0bU9mZnNldFBjdCIsIlNsaWRlciIsImlucHV0cyIsImhhbmRsZXMiLCIkaGFuZGxlIiwiJGlucHV0IiwiJGZpbGwiLCJpc0RibCIsImRpc2FibGVkIiwiZGlzYWJsZWRDbGFzcyIsImJpbmRpbmciLCJfc2V0SW5pdEF0dHIiLCJkb3VibGVTaWRlZCIsIiRoYW5kbGUyIiwiJGlucHV0MiIsIl9zZXRIYW5kbGVQb3MiLCJpbml0aWFsU3RhcnQiLCJpbml0aWFsRW5kIiwiJGhuZGwiLCJub0ludmVydCIsImgyVmFsIiwic3RlcCIsImgxVmFsIiwidmVydCIsImhPclciLCJsT3JUIiwiaGFuZGxlRGltIiwiZWxlbURpbSIsInBjdE9mQmFyIiwicGVyY2VudCIsInRvRml4ZWQiLCJweFRvTW92ZSIsIm1vdmVtZW50IiwiZGVjaW1hbCIsIl9zZXRWYWx1ZXMiLCJpc0xlZnRIbmRsIiwiZGltIiwiaGFuZGxlUGN0IiwiaGFuZGxlUG9zIiwibW92ZVRpbWUiLCJjaGFuZ2VkRGVsYXkiLCJoYXNWYWwiLCJwYWdlWFkiLCJoYWxmT2ZIYW5kbGUiLCJiYXJEaW0iLCJiYXJYWSIsIm9mZnNldFBjdCIsIl9hZGp1c3RWYWx1ZSIsImZpcnN0SG5kbFBvcyIsImFic1Bvc2l0aW9uIiwic2VjbmRIbmRsUG9zIiwiZGl2IiwicHJldl92YWwiLCJuZXh0X3ZhbCIsImN1ckhhbmRsZSIsIl9oYW5kbGVFdmVudCIsImNsaWNrU2VsZWN0IiwiZHJhZ2dhYmxlIiwiY3VycmVudFRhcmdldCIsIl8kaGFuZGxlIiwib2xkVmFsdWUiLCJuZXdWYWx1ZSIsImRlY3JlYXNlIiwiaW5jcmVhc2UiLCJkZWNyZWFzZV9mYXN0IiwiaW5jcmVhc2VfZmFzdCIsImludmVydFZlcnRpY2FsIiwiZnJhYyIsIm51bSIsImNsaWNrUG9zIiwiU3RpY2t5IiwiJHBhcmVudCIsIndhc1dyYXBwZWQiLCIkY29udGFpbmVyIiwiY29udGFpbmVyIiwid3JhcElubmVyIiwic3RpY2t5Q2xhc3MiLCJzY3JvbGxDb3VudCIsImNoZWNrRXZlcnkiLCJpc1N0dWNrIiwiX3BhcnNlUG9pbnRzIiwiX3NldFNpemVzIiwiX2NhbGMiLCJyZXZlcnNlIiwidG9wQW5jaG9yIiwiYnRtIiwiYnRtQW5jaG9yIiwicHRzIiwiYnJlYWtzIiwicGxhY2UiLCJjYW5TdGljayIsIl9wYXVzZUxpc3RlbmVycyIsImNoZWNrU2l6ZXMiLCJzY3JvbGwiLCJfcmVtb3ZlU3RpY2t5IiwidG9wUG9pbnQiLCJib3R0b21Qb2ludCIsIl9zZXRTdGlja3kiLCJzdGlja1RvIiwibXJnbiIsIm5vdFN0dWNrVG8iLCJpc1RvcCIsInN0aWNrVG9Ub3AiLCJhbmNob3JQdCIsImFuY2hvckhlaWdodCIsImVsZW1IZWlnaHQiLCJ0b3BPckJvdHRvbSIsInN0aWNreU9uIiwibmV3RWxlbVdpZHRoIiwiY29tcCIsInBkbmciLCJuZXdDb250YWluZXJIZWlnaHQiLCJjb250YWluZXJIZWlnaHQiLCJfc2V0QnJlYWtQb2ludHMiLCJtVG9wIiwiZW1DYWxjIiwibWFyZ2luVG9wIiwibUJ0bSIsIm1hcmdpbkJvdHRvbSIsImVtIiwiZm9udFNpemUiLCJUYWJzIiwiJHRhYlRpdGxlcyIsImxpbmtDbGFzcyIsIm1hdGNoSGVpZ2h0IiwiX3NldEhlaWdodCIsIl9hZGRLZXlIYW5kbGVyIiwiX2FkZENsaWNrSGFuZGxlciIsIl9oYW5kbGVUYWJDaGFuZ2UiLCIkZmlyc3RUYWIiLCIkbGFzdFRhYiIsIndyYXBPbktleXMiLCIkdGFiTGluayIsIiR0YXJnZXRDb250ZW50IiwiJG9sZFRhYiIsImlkU3RyIiwicGFuZWxDbGFzcyIsInBhbmVsIiwiY2hlY2tDbGFzcyIsIlRvZ2dsZXIiLCJpbnB1dCIsInRvZ2dsZUNsYXNzIiwiX3VwZGF0ZUFSSUEiLCJUb29sdGlwIiwiaXNDbGljayIsImVsZW1JZCIsIl9nZXRQb3NpdGlvbkNsYXNzIiwidGlwVGV4dCIsInRlbXBsYXRlIiwiX2J1aWxkVGVtcGxhdGUiLCJ0cmlnZ2VyQ2xhc3MiLCJ0ZW1wbGF0ZUNsYXNzZXMiLCJ0b29sdGlwQ2xhc3MiLCIkdGVtcGxhdGUiLCIkdGlwRGltcyIsInNob3dPbiIsImZhZGVJbiIsImZhZGVJbkR1cmF0aW9uIiwiZmFkZU91dER1cmF0aW9uIiwiaXNGb2N1cyIsImRpc2FibGVGb3JUb3VjaCIsInRvdWNoQ2xvc2VUZXh0IiwiZW5kRXZlbnQiLCJNb3Rpb25VSSIsInJlYWR5IiwiY2xpY2siLCJsb2ciLCJhbmltYXRlQXV0byIsInNldHRpbmdzIiwiZGltZW5zaW9uIiwib3Bwb3NpdGVEaW1lbnNpb24iLCJhY3Rpb24iLCJvcGVuRWwiLCJjbG9zZUVsIiwidG9nZ2xlRWwiLCJnZXRUYXJnZXREaW1lbnNpb24iLCIkY2xvbmUiLCJjbG9uZUNvbnRlbnREaW1lbnNpb24iLCJvcGVuQ2xhc3MiLCJhbmltT2JqIiwiY2xvc2VkIiwicHJvY2Vzc0FyZ3MiLCJsIiwiYXJnIiwiYXJnVHlwZSIsImFyZ3NBcnJheSIsImZvb3RlciIsInBvcyIsInN0aWNreUZvb3RlciJdLCJtYXBwaW5ncyI6Ijs7QUFBQUEsT0FBT0MsU0FBUCxHQUFvQixZQUFXOztBQUU3Qjs7QUFFQTs7Ozs7O0FBTUE7O0FBQ0EsTUFBSUMsYUFBYSxFQUFqQjs7QUFFQTtBQUNBLE1BQUlDLElBQUo7O0FBRUE7QUFDQSxNQUFJQyxTQUFTLEtBQWI7O0FBRUE7QUFDQSxNQUFJQyxlQUFlLElBQW5COztBQUVBO0FBQ0EsTUFBSUMsa0JBQWtCLENBQ3BCLFFBRG9CLEVBRXBCLFVBRm9CLEVBR3BCLE1BSG9CLEVBSXBCLE9BSm9CLEVBS3BCLE9BTG9CLEVBTXBCLE9BTm9CLEVBT3BCLFFBUG9CLENBQXRCOztBQVVBO0FBQ0E7QUFDQSxNQUFJQyxhQUFhQyxhQUFqQjs7QUFFQTtBQUNBO0FBQ0EsTUFBSUMsWUFBWSxDQUNkLEVBRGMsRUFDVjtBQUNKLElBRmMsRUFFVjtBQUNKLElBSGMsRUFHVjtBQUNKLElBSmMsRUFJVjtBQUNKLElBTGMsQ0FLVjtBQUxVLEdBQWhCOztBQVFBO0FBQ0EsTUFBSUMsV0FBVztBQUNiLGVBQVcsVUFERTtBQUViLGFBQVMsVUFGSTtBQUdiLGlCQUFhLE9BSEE7QUFJYixpQkFBYSxPQUpBO0FBS2IscUJBQWlCLFNBTEo7QUFNYixxQkFBaUIsU0FOSjtBQU9iLG1CQUFlLFNBUEY7QUFRYixtQkFBZSxTQVJGO0FBU2Isa0JBQWM7QUFURCxHQUFmOztBQVlBO0FBQ0FBLFdBQVNGLGFBQVQsSUFBMEIsT0FBMUI7O0FBRUE7QUFDQSxNQUFJRyxhQUFhLEVBQWpCOztBQUVBO0FBQ0EsTUFBSUMsU0FBUztBQUNYLE9BQUcsS0FEUTtBQUVYLFFBQUksT0FGTztBQUdYLFFBQUksT0FITztBQUlYLFFBQUksS0FKTztBQUtYLFFBQUksT0FMTztBQU1YLFFBQUksTUFOTztBQU9YLFFBQUksSUFQTztBQVFYLFFBQUksT0FSTztBQVNYLFFBQUk7QUFUTyxHQUFiOztBQVlBO0FBQ0EsTUFBSUMsYUFBYTtBQUNmLE9BQUcsT0FEWTtBQUVmLE9BQUcsT0FGWSxFQUVIO0FBQ1osT0FBRztBQUhZLEdBQWpCOztBQU1BO0FBQ0EsTUFBSUMsS0FBSjs7QUFHQTs7Ozs7O0FBTUE7QUFDQSxXQUFTQyxXQUFULEdBQXVCO0FBQ3JCQztBQUNBQyxhQUFTQyxLQUFUOztBQUVBZCxhQUFTLElBQVQ7QUFDQVUsWUFBUWQsT0FBT21CLFVBQVAsQ0FBa0IsWUFBVztBQUNuQ2YsZUFBUyxLQUFUO0FBQ0QsS0FGTyxFQUVMLEdBRkssQ0FBUjtBQUdEOztBQUVELFdBQVNnQixhQUFULENBQXVCRixLQUF2QixFQUE4QjtBQUM1QixRQUFJLENBQUNkLE1BQUwsRUFBYWEsU0FBU0MsS0FBVDtBQUNkOztBQUVELFdBQVNHLGVBQVQsQ0FBeUJILEtBQXpCLEVBQWdDO0FBQzlCRjtBQUNBQyxhQUFTQyxLQUFUO0FBQ0Q7O0FBRUQsV0FBU0YsVUFBVCxHQUFzQjtBQUNwQmhCLFdBQU9zQixZQUFQLENBQW9CUixLQUFwQjtBQUNEOztBQUVELFdBQVNHLFFBQVQsQ0FBa0JDLEtBQWxCLEVBQXlCO0FBQ3ZCLFFBQUlLLFdBQVdDLElBQUlOLEtBQUosQ0FBZjtBQUNBLFFBQUlPLFFBQVFmLFNBQVNRLE1BQU1RLElBQWYsQ0FBWjtBQUNBLFFBQUlELFVBQVUsU0FBZCxFQUF5QkEsUUFBUUUsWUFBWVQsS0FBWixDQUFSOztBQUV6QjtBQUNBLFFBQUliLGlCQUFpQm9CLEtBQXJCLEVBQTRCO0FBQzFCLFVBQUlHLGNBQWNDLE9BQU9YLEtBQVAsQ0FBbEI7QUFDQSxVQUFJWSxrQkFBa0JGLFlBQVlHLFFBQVosQ0FBcUJDLFdBQXJCLEVBQXRCO0FBQ0EsVUFBSUMsa0JBQW1CSCxvQkFBb0IsT0FBckIsR0FBZ0NGLFlBQVlNLFlBQVosQ0FBeUIsTUFBekIsQ0FBaEMsR0FBbUUsSUFBekY7O0FBRUEsVUFDRSxDQUFDO0FBQ0QsT0FBQy9CLEtBQUtnQyxZQUFMLENBQWtCLDJCQUFsQixDQUFEOztBQUVBO0FBQ0E5QixrQkFIQTs7QUFLQTtBQUNBb0IsZ0JBQVUsVUFOVjs7QUFRQTtBQUNBYixhQUFPVyxRQUFQLE1BQXFCLEtBVHJCOztBQVdBO0FBRUdPLDBCQUFvQixVQUFwQixJQUNBQSxvQkFBb0IsUUFEcEIsSUFFQ0Esb0JBQW9CLE9BQXBCLElBQStCeEIsZ0JBQWdCOEIsT0FBaEIsQ0FBd0JILGVBQXhCLElBQTJDLENBZjlFLENBREE7QUFrQkU7QUFDQXhCLGdCQUFVMkIsT0FBVixDQUFrQmIsUUFBbEIsSUFBOEIsQ0FBQyxDQXBCbkMsRUFzQkU7QUFDQTtBQUNELE9BeEJELE1Bd0JPO0FBQ0xjLG9CQUFZWixLQUFaO0FBQ0Q7QUFDRjs7QUFFRCxRQUFJQSxVQUFVLFVBQWQsRUFBMEJhLFFBQVFmLFFBQVI7QUFDM0I7O0FBRUQsV0FBU2MsV0FBVCxDQUFxQkUsTUFBckIsRUFBNkI7QUFDM0JsQyxtQkFBZWtDLE1BQWY7QUFDQXBDLFNBQUtxQyxZQUFMLENBQWtCLGdCQUFsQixFQUFvQ25DLFlBQXBDOztBQUVBLFFBQUlNLFdBQVd5QixPQUFYLENBQW1CL0IsWUFBbkIsTUFBcUMsQ0FBQyxDQUExQyxFQUE2Q00sV0FBVzhCLElBQVgsQ0FBZ0JwQyxZQUFoQjtBQUM5Qzs7QUFFRCxXQUFTbUIsR0FBVCxDQUFhTixLQUFiLEVBQW9CO0FBQ2xCLFdBQVFBLE1BQU13QixPQUFQLEdBQWtCeEIsTUFBTXdCLE9BQXhCLEdBQWtDeEIsTUFBTXlCLEtBQS9DO0FBQ0Q7O0FBRUQsV0FBU2QsTUFBVCxDQUFnQlgsS0FBaEIsRUFBdUI7QUFDckIsV0FBT0EsTUFBTVcsTUFBTixJQUFnQlgsTUFBTTBCLFVBQTdCO0FBQ0Q7O0FBRUQsV0FBU2pCLFdBQVQsQ0FBcUJULEtBQXJCLEVBQTRCO0FBQzFCLFFBQUksT0FBT0EsTUFBTVMsV0FBYixLQUE2QixRQUFqQyxFQUEyQztBQUN6QyxhQUFPZCxXQUFXSyxNQUFNUyxXQUFqQixDQUFQO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsYUFBUVQsTUFBTVMsV0FBTixLQUFzQixLQUF2QixHQUFnQyxPQUFoQyxHQUEwQ1QsTUFBTVMsV0FBdkQsQ0FESyxDQUMrRDtBQUNyRTtBQUNGOztBQUVEO0FBQ0EsV0FBU1csT0FBVCxDQUFpQmYsUUFBakIsRUFBMkI7QUFDekIsUUFBSXJCLFdBQVdrQyxPQUFYLENBQW1CeEIsT0FBT1csUUFBUCxDQUFuQixNQUF5QyxDQUFDLENBQTFDLElBQStDWCxPQUFPVyxRQUFQLENBQW5ELEVBQXFFckIsV0FBV3VDLElBQVgsQ0FBZ0I3QixPQUFPVyxRQUFQLENBQWhCO0FBQ3RFOztBQUVELFdBQVNzQixTQUFULENBQW1CM0IsS0FBbkIsRUFBMEI7QUFDeEIsUUFBSUssV0FBV0MsSUFBSU4sS0FBSixDQUFmO0FBQ0EsUUFBSTRCLFdBQVc1QyxXQUFXa0MsT0FBWCxDQUFtQnhCLE9BQU9XLFFBQVAsQ0FBbkIsQ0FBZjs7QUFFQSxRQUFJdUIsYUFBYSxDQUFDLENBQWxCLEVBQXFCNUMsV0FBVzZDLE1BQVgsQ0FBa0JELFFBQWxCLEVBQTRCLENBQTVCO0FBQ3RCOztBQUVELFdBQVNFLFVBQVQsR0FBc0I7QUFDcEI3QyxXQUFPOEMsU0FBUzlDLElBQWhCOztBQUVBO0FBQ0EsUUFBSUgsT0FBT2tELFlBQVgsRUFBeUI7QUFDdkIvQyxXQUFLZ0QsZ0JBQUwsQ0FBc0IsYUFBdEIsRUFBcUMvQixhQUFyQztBQUNBakIsV0FBS2dELGdCQUFMLENBQXNCLGFBQXRCLEVBQXFDL0IsYUFBckM7QUFDRCxLQUhELE1BR08sSUFBSXBCLE9BQU9vRCxjQUFYLEVBQTJCO0FBQ2hDakQsV0FBS2dELGdCQUFMLENBQXNCLGVBQXRCLEVBQXVDL0IsYUFBdkM7QUFDQWpCLFdBQUtnRCxnQkFBTCxDQUFzQixlQUF0QixFQUF1Qy9CLGFBQXZDO0FBQ0QsS0FITSxNQUdBOztBQUVMO0FBQ0FqQixXQUFLZ0QsZ0JBQUwsQ0FBc0IsV0FBdEIsRUFBbUMvQixhQUFuQztBQUNBakIsV0FBS2dELGdCQUFMLENBQXNCLFdBQXRCLEVBQW1DL0IsYUFBbkM7O0FBRUE7QUFDQSxVQUFJLGtCQUFrQnBCLE1BQXRCLEVBQThCO0FBQzVCRyxhQUFLZ0QsZ0JBQUwsQ0FBc0IsWUFBdEIsRUFBb0NwQyxXQUFwQztBQUNEO0FBQ0Y7O0FBRUQ7QUFDQVosU0FBS2dELGdCQUFMLENBQXNCNUMsVUFBdEIsRUFBa0NhLGFBQWxDOztBQUVBO0FBQ0FqQixTQUFLZ0QsZ0JBQUwsQ0FBc0IsU0FBdEIsRUFBaUM5QixlQUFqQztBQUNBbEIsU0FBS2dELGdCQUFMLENBQXNCLE9BQXRCLEVBQStCOUIsZUFBL0I7QUFDQTRCLGFBQVNFLGdCQUFULENBQTBCLE9BQTFCLEVBQW1DTixTQUFuQztBQUNEOztBQUdEOzs7Ozs7QUFNQTtBQUNBO0FBQ0EsV0FBU3JDLFdBQVQsR0FBdUI7QUFDckIsV0FBT0QsYUFBYSxhQUFhMEMsU0FBU0ksYUFBVCxDQUF1QixLQUF2QixDQUFiLEdBQ2xCLE9BRGtCLEdBQ1I7O0FBRVZKLGFBQVNLLFlBQVQsS0FBMEJDLFNBQTFCLEdBQ0UsWUFERixHQUNpQjtBQUNmLG9CQUxKLENBRHFCLENBTUM7QUFDdkI7O0FBR0Q7Ozs7Ozs7O0FBU0EsTUFDRSxzQkFBc0J2RCxNQUF0QixJQUNBd0QsTUFBTUMsU0FBTixDQUFnQnJCLE9BRmxCLEVBR0U7O0FBRUE7QUFDQSxRQUFJYSxTQUFTOUMsSUFBYixFQUFtQjtBQUNqQjZDOztBQUVGO0FBQ0MsS0FKRCxNQUlPO0FBQ0xDLGVBQVNFLGdCQUFULENBQTBCLGtCQUExQixFQUE4Q0gsVUFBOUM7QUFDRDtBQUNGOztBQUdEOzs7Ozs7QUFNQSxTQUFPOztBQUVMO0FBQ0FVLFNBQUssWUFBVztBQUFFLGFBQU9yRCxZQUFQO0FBQXNCLEtBSG5DOztBQUtMO0FBQ0FzRCxVQUFNLFlBQVc7QUFBRSxhQUFPekQsVUFBUDtBQUFvQixLQU5sQzs7QUFRTDtBQUNBMEQsV0FBTyxZQUFXO0FBQUUsYUFBT2pELFVBQVA7QUFBb0IsS0FUbkM7O0FBV0w7QUFDQWtELFNBQUt4QjtBQVpBLEdBQVA7QUFlRCxDQXRTbUIsRUFBcEI7Q0NBQSxDQUFDLFVBQVN5QixDQUFULEVBQVk7O0FBRWI7O0FBRUEsTUFBSUMscUJBQXFCLE9BQXpCOztBQUVBO0FBQ0E7QUFDQSxNQUFJQyxhQUFhO0FBQ2ZDLGFBQVNGLGtCQURNOztBQUdmOzs7QUFHQUcsY0FBVSxFQU5LOztBQVFmOzs7QUFHQUMsWUFBUSxFQVhPOztBQWFmOzs7QUFHQUMsU0FBSyxZQUFVO0FBQ2IsYUFBT04sRUFBRSxNQUFGLEVBQVVPLElBQVYsQ0FBZSxLQUFmLE1BQTBCLEtBQWpDO0FBQ0QsS0FsQmM7QUFtQmY7Ozs7QUFJQUMsWUFBUSxVQUFTQSxNQUFULEVBQWlCQyxJQUFqQixFQUF1QjtBQUM3QjtBQUNBO0FBQ0EsVUFBSUMsWUFBYUQsUUFBUUUsYUFBYUgsTUFBYixDQUF6QjtBQUNBO0FBQ0E7QUFDQSxVQUFJSSxXQUFZQyxVQUFVSCxTQUFWLENBQWhCOztBQUVBO0FBQ0EsV0FBS04sUUFBTCxDQUFjUSxRQUFkLElBQTBCLEtBQUtGLFNBQUwsSUFBa0JGLE1BQTVDO0FBQ0QsS0FqQ2M7QUFrQ2Y7Ozs7Ozs7OztBQVNBTSxvQkFBZ0IsVUFBU04sTUFBVCxFQUFpQkMsSUFBakIsRUFBc0I7QUFDcEMsVUFBSU0sYUFBYU4sT0FBT0ksVUFBVUosSUFBVixDQUFQLEdBQXlCRSxhQUFhSCxPQUFPUSxXQUFwQixFQUFpQzlDLFdBQWpDLEVBQTFDO0FBQ0FzQyxhQUFPUyxJQUFQLEdBQWMsS0FBS0MsV0FBTCxDQUFpQixDQUFqQixFQUFvQkgsVUFBcEIsQ0FBZDs7QUFFQSxVQUFHLENBQUNQLE9BQU9XLFFBQVAsQ0FBZ0JaLElBQWhCLFdBQTZCUSxVQUE3QixDQUFKLEVBQStDO0FBQUVQLGVBQU9XLFFBQVAsQ0FBZ0JaLElBQWhCLFdBQTZCUSxVQUE3QixFQUEyQ1AsT0FBT1MsSUFBbEQ7QUFBMEQ7QUFDM0csVUFBRyxDQUFDVCxPQUFPVyxRQUFQLENBQWdCQyxJQUFoQixDQUFxQixVQUFyQixDQUFKLEVBQXFDO0FBQUVaLGVBQU9XLFFBQVAsQ0FBZ0JDLElBQWhCLENBQXFCLFVBQXJCLEVBQWlDWixNQUFqQztBQUEyQztBQUM1RTs7OztBQUlOQSxhQUFPVyxRQUFQLENBQWdCRSxPQUFoQixjQUFtQ04sVUFBbkM7O0FBRUEsV0FBS1YsTUFBTCxDQUFZMUIsSUFBWixDQUFpQjZCLE9BQU9TLElBQXhCOztBQUVBO0FBQ0QsS0ExRGM7QUEyRGY7Ozs7Ozs7O0FBUUFLLHNCQUFrQixVQUFTZCxNQUFULEVBQWdCO0FBQ2hDLFVBQUlPLGFBQWFGLFVBQVVGLGFBQWFILE9BQU9XLFFBQVAsQ0FBZ0JDLElBQWhCLENBQXFCLFVBQXJCLEVBQWlDSixXQUE5QyxDQUFWLENBQWpCOztBQUVBLFdBQUtYLE1BQUwsQ0FBWXBCLE1BQVosQ0FBbUIsS0FBS29CLE1BQUwsQ0FBWS9CLE9BQVosQ0FBb0JrQyxPQUFPUyxJQUEzQixDQUFuQixFQUFxRCxDQUFyRDtBQUNBVCxhQUFPVyxRQUFQLENBQWdCSSxVQUFoQixXQUFtQ1IsVUFBbkMsRUFBaURTLFVBQWpELENBQTRELFVBQTVEO0FBQ007Ozs7QUFETixPQUtPSCxPQUxQLG1CQUsrQk4sVUFML0I7QUFNQSxXQUFJLElBQUlVLElBQVIsSUFBZ0JqQixNQUFoQixFQUF1QjtBQUNyQkEsZUFBT2lCLElBQVAsSUFBZSxJQUFmLENBRHFCLENBQ0Q7QUFDckI7QUFDRDtBQUNELEtBakZjOztBQW1GZjs7Ozs7O0FBTUNDLFlBQVEsVUFBU0MsT0FBVCxFQUFpQjtBQUN2QixVQUFJQyxPQUFPRCxtQkFBbUIzQixDQUE5QjtBQUNBLFVBQUc7QUFDRCxZQUFHNEIsSUFBSCxFQUFRO0FBQ05ELGtCQUFRRSxJQUFSLENBQWEsWUFBVTtBQUNyQjdCLGNBQUUsSUFBRixFQUFRb0IsSUFBUixDQUFhLFVBQWIsRUFBeUJVLEtBQXpCO0FBQ0QsV0FGRDtBQUdELFNBSkQsTUFJSztBQUNILGNBQUlsRSxPQUFPLE9BQU8rRCxPQUFsQjtBQUFBLGNBQ0FJLFFBQVEsSUFEUjtBQUFBLGNBRUFDLE1BQU07QUFDSixzQkFBVSxVQUFTQyxJQUFULEVBQWM7QUFDdEJBLG1CQUFLQyxPQUFMLENBQWEsVUFBU0MsQ0FBVCxFQUFXO0FBQ3RCQSxvQkFBSXRCLFVBQVVzQixDQUFWLENBQUo7QUFDQW5DLGtCQUFFLFdBQVVtQyxDQUFWLEdBQWEsR0FBZixFQUFvQkMsVUFBcEIsQ0FBK0IsT0FBL0I7QUFDRCxlQUhEO0FBSUQsYUFORztBQU9KLHNCQUFVLFlBQVU7QUFDbEJULHdCQUFVZCxVQUFVYyxPQUFWLENBQVY7QUFDQTNCLGdCQUFFLFdBQVUyQixPQUFWLEdBQW1CLEdBQXJCLEVBQTBCUyxVQUExQixDQUFxQyxPQUFyQztBQUNELGFBVkc7QUFXSix5QkFBYSxZQUFVO0FBQ3JCLG1CQUFLLFFBQUwsRUFBZUMsT0FBT3hDLElBQVAsQ0FBWWtDLE1BQU0zQixRQUFsQixDQUFmO0FBQ0Q7QUFiRyxXQUZOO0FBaUJBNEIsY0FBSXBFLElBQUosRUFBVStELE9BQVY7QUFDRDtBQUNGLE9BekJELENBeUJDLE9BQU1XLEdBQU4sRUFBVTtBQUNUQyxnQkFBUUMsS0FBUixDQUFjRixHQUFkO0FBQ0QsT0EzQkQsU0EyQlE7QUFDTixlQUFPWCxPQUFQO0FBQ0Q7QUFDRixLQXpIYTs7QUEySGY7Ozs7Ozs7O0FBUUFULGlCQUFhLFVBQVN1QixNQUFULEVBQWlCQyxTQUFqQixFQUEyQjtBQUN0Q0QsZUFBU0EsVUFBVSxDQUFuQjtBQUNBLGFBQU9FLEtBQUtDLEtBQUwsQ0FBWUQsS0FBS0UsR0FBTCxDQUFTLEVBQVQsRUFBYUosU0FBUyxDQUF0QixJQUEyQkUsS0FBS0csTUFBTCxLQUFnQkgsS0FBS0UsR0FBTCxDQUFTLEVBQVQsRUFBYUosTUFBYixDQUF2RCxFQUE4RU0sUUFBOUUsQ0FBdUYsRUFBdkYsRUFBMkZDLEtBQTNGLENBQWlHLENBQWpHLEtBQXVHTixrQkFBZ0JBLFNBQWhCLEdBQThCLEVBQXJJLENBQVA7QUFDRCxLQXRJYztBQXVJZjs7Ozs7QUFLQU8sWUFBUSxVQUFTQyxJQUFULEVBQWV2QixPQUFmLEVBQXdCOztBQUU5QjtBQUNBLFVBQUksT0FBT0EsT0FBUCxLQUFtQixXQUF2QixFQUFvQztBQUNsQ0Esa0JBQVVVLE9BQU94QyxJQUFQLENBQVksS0FBS08sUUFBakIsQ0FBVjtBQUNEO0FBQ0Q7QUFIQSxXQUlLLElBQUksT0FBT3VCLE9BQVAsS0FBbUIsUUFBdkIsRUFBaUM7QUFDcENBLG9CQUFVLENBQUNBLE9BQUQsQ0FBVjtBQUNEOztBQUVELFVBQUlJLFFBQVEsSUFBWjs7QUFFQTtBQUNBL0IsUUFBRTZCLElBQUYsQ0FBT0YsT0FBUCxFQUFnQixVQUFTd0IsQ0FBVCxFQUFZMUMsSUFBWixFQUFrQjtBQUNoQztBQUNBLFlBQUlELFNBQVN1QixNQUFNM0IsUUFBTixDQUFlSyxJQUFmLENBQWI7O0FBRUE7QUFDQSxZQUFJMkMsUUFBUXBELEVBQUVrRCxJQUFGLEVBQVFHLElBQVIsQ0FBYSxXQUFTNUMsSUFBVCxHQUFjLEdBQTNCLEVBQWdDNkMsT0FBaEMsQ0FBd0MsV0FBUzdDLElBQVQsR0FBYyxHQUF0RCxDQUFaOztBQUVBO0FBQ0EyQyxjQUFNdkIsSUFBTixDQUFXLFlBQVc7QUFDcEIsY0FBSTBCLE1BQU12RCxFQUFFLElBQUYsQ0FBVjtBQUFBLGNBQ0l3RCxPQUFPLEVBRFg7QUFFQTtBQUNBLGNBQUlELElBQUluQyxJQUFKLENBQVMsVUFBVCxDQUFKLEVBQTBCO0FBQ3hCbUIsb0JBQVFrQixJQUFSLENBQWEseUJBQXVCaEQsSUFBdkIsR0FBNEIsc0RBQXpDO0FBQ0E7QUFDRDs7QUFFRCxjQUFHOEMsSUFBSWhELElBQUosQ0FBUyxjQUFULENBQUgsRUFBNEI7QUFDMUIsZ0JBQUltRCxRQUFRSCxJQUFJaEQsSUFBSixDQUFTLGNBQVQsRUFBeUJvRCxLQUF6QixDQUErQixHQUEvQixFQUFvQ3pCLE9BQXBDLENBQTRDLFVBQVMwQixDQUFULEVBQVlULENBQVosRUFBYztBQUNwRSxrQkFBSVUsTUFBTUQsRUFBRUQsS0FBRixDQUFRLEdBQVIsRUFBYUcsR0FBYixDQUFpQixVQUFTQyxFQUFULEVBQVk7QUFBRSx1QkFBT0EsR0FBR0MsSUFBSCxFQUFQO0FBQW1CLGVBQWxELENBQVY7QUFDQSxrQkFBR0gsSUFBSSxDQUFKLENBQUgsRUFBV0wsS0FBS0ssSUFBSSxDQUFKLENBQUwsSUFBZUksV0FBV0osSUFBSSxDQUFKLENBQVgsQ0FBZjtBQUNaLGFBSFcsQ0FBWjtBQUlEO0FBQ0QsY0FBRztBQUNETixnQkFBSW5DLElBQUosQ0FBUyxVQUFULEVBQXFCLElBQUlaLE1BQUosQ0FBV1IsRUFBRSxJQUFGLENBQVgsRUFBb0J3RCxJQUFwQixDQUFyQjtBQUNELFdBRkQsQ0FFQyxPQUFNVSxFQUFOLEVBQVM7QUFDUjNCLG9CQUFRQyxLQUFSLENBQWMwQixFQUFkO0FBQ0QsV0FKRCxTQUlRO0FBQ047QUFDRDtBQUNGLFNBdEJEO0FBdUJELE9BL0JEO0FBZ0NELEtBMUxjO0FBMkxmQyxlQUFXeEQsWUEzTEk7QUE0TGZ5RCxtQkFBZSxVQUFTaEIsS0FBVCxFQUFlO0FBQzVCLFVBQUlpQixjQUFjO0FBQ2hCLHNCQUFjLGVBREU7QUFFaEIsNEJBQW9CLHFCQUZKO0FBR2hCLHlCQUFpQixlQUhEO0FBSWhCLHVCQUFlO0FBSkMsT0FBbEI7QUFNQSxVQUFJbkIsT0FBTy9ELFNBQVNJLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBWDtBQUFBLFVBQ0krRSxHQURKOztBQUdBLFdBQUssSUFBSUMsQ0FBVCxJQUFjRixXQUFkLEVBQTBCO0FBQ3hCLFlBQUksT0FBT25CLEtBQUtzQixLQUFMLENBQVdELENBQVgsQ0FBUCxLQUF5QixXQUE3QixFQUF5QztBQUN2Q0QsZ0JBQU1ELFlBQVlFLENBQVosQ0FBTjtBQUNEO0FBQ0Y7QUFDRCxVQUFHRCxHQUFILEVBQU87QUFDTCxlQUFPQSxHQUFQO0FBQ0QsT0FGRCxNQUVLO0FBQ0hBLGNBQU1qSCxXQUFXLFlBQVU7QUFDekIrRixnQkFBTXFCLGNBQU4sQ0FBcUIsZUFBckIsRUFBc0MsQ0FBQ3JCLEtBQUQsQ0FBdEM7QUFDRCxTQUZLLEVBRUgsQ0FGRyxDQUFOO0FBR0EsZUFBTyxlQUFQO0FBQ0Q7QUFDRjtBQW5OYyxHQUFqQjs7QUFzTkFsRCxhQUFXd0UsSUFBWCxHQUFrQjtBQUNoQjs7Ozs7OztBQU9BQyxjQUFVLFVBQVVDLElBQVYsRUFBZ0JDLEtBQWhCLEVBQXVCO0FBQy9CLFVBQUk3SCxRQUFRLElBQVo7O0FBRUEsYUFBTyxZQUFZO0FBQ2pCLFlBQUk4SCxVQUFVLElBQWQ7QUFBQSxZQUFvQkMsT0FBT0MsU0FBM0I7O0FBRUEsWUFBSWhJLFVBQVUsSUFBZCxFQUFvQjtBQUNsQkEsa0JBQVFLLFdBQVcsWUFBWTtBQUM3QnVILGlCQUFLSyxLQUFMLENBQVdILE9BQVgsRUFBb0JDLElBQXBCO0FBQ0EvSCxvQkFBUSxJQUFSO0FBQ0QsV0FITyxFQUdMNkgsS0FISyxDQUFSO0FBSUQ7QUFDRixPQVREO0FBVUQ7QUFyQmUsR0FBbEI7O0FBd0JBO0FBQ0E7QUFDQTs7OztBQUlBLE1BQUl6QyxhQUFhLFVBQVM4QyxNQUFULEVBQWlCO0FBQ2hDLFFBQUl0SCxPQUFPLE9BQU9zSCxNQUFsQjtBQUFBLFFBQ0lDLFFBQVFuRixFQUFFLG9CQUFGLENBRFo7QUFBQSxRQUVJb0YsUUFBUXBGLEVBQUUsUUFBRixDQUZaOztBQUlBLFFBQUcsQ0FBQ21GLE1BQU0xQyxNQUFWLEVBQWlCO0FBQ2Z6QyxRQUFFLDhCQUFGLEVBQWtDcUYsUUFBbEMsQ0FBMkNsRyxTQUFTbUcsSUFBcEQ7QUFDRDtBQUNELFFBQUdGLE1BQU0zQyxNQUFULEVBQWdCO0FBQ2QyQyxZQUFNRyxXQUFOLENBQWtCLE9BQWxCO0FBQ0Q7O0FBRUQsUUFBRzNILFNBQVMsV0FBWixFQUF3QjtBQUFDO0FBQ3ZCc0MsaUJBQVdzRixVQUFYLENBQXNCMUQsS0FBdEI7QUFDQTVCLGlCQUFXK0MsTUFBWCxDQUFrQixJQUFsQjtBQUNELEtBSEQsTUFHTSxJQUFHckYsU0FBUyxRQUFaLEVBQXFCO0FBQUM7QUFDMUIsVUFBSW1ILE9BQU9yRixNQUFNQyxTQUFOLENBQWdCcUQsS0FBaEIsQ0FBc0J5QyxJQUF0QixDQUEyQlQsU0FBM0IsRUFBc0MsQ0FBdEMsQ0FBWCxDQUR5QixDQUMyQjtBQUNwRCxVQUFJVSxZQUFZLEtBQUt0RSxJQUFMLENBQVUsVUFBVixDQUFoQixDQUZ5QixDQUVhOztBQUV0QyxVQUFHc0UsY0FBY2pHLFNBQWQsSUFBMkJpRyxVQUFVUixNQUFWLE1BQXNCekYsU0FBcEQsRUFBOEQ7QUFBQztBQUM3RCxZQUFHLEtBQUtnRCxNQUFMLEtBQWdCLENBQW5CLEVBQXFCO0FBQUM7QUFDbEJpRCxvQkFBVVIsTUFBVixFQUFrQkQsS0FBbEIsQ0FBd0JTLFNBQXhCLEVBQW1DWCxJQUFuQztBQUNILFNBRkQsTUFFSztBQUNILGVBQUtsRCxJQUFMLENBQVUsVUFBU3NCLENBQVQsRUFBWVksRUFBWixFQUFlO0FBQUM7QUFDeEIyQixzQkFBVVIsTUFBVixFQUFrQkQsS0FBbEIsQ0FBd0JqRixFQUFFK0QsRUFBRixFQUFNM0MsSUFBTixDQUFXLFVBQVgsQ0FBeEIsRUFBZ0QyRCxJQUFoRDtBQUNELFdBRkQ7QUFHRDtBQUNGLE9BUkQsTUFRSztBQUFDO0FBQ0osY0FBTSxJQUFJWSxjQUFKLENBQW1CLG1CQUFtQlQsTUFBbkIsR0FBNEIsbUNBQTVCLElBQW1FUSxZQUFZL0UsYUFBYStFLFNBQWIsQ0FBWixHQUFzQyxjQUF6RyxJQUEySCxHQUE5SSxDQUFOO0FBQ0Q7QUFDRixLQWZLLE1BZUQ7QUFBQztBQUNKLFlBQU0sSUFBSUUsU0FBSixvQkFBOEJoSSxJQUE5QixrR0FBTjtBQUNEO0FBQ0QsV0FBTyxJQUFQO0FBQ0QsR0FsQ0Q7O0FBb0NBMUIsU0FBT2dFLFVBQVAsR0FBb0JBLFVBQXBCO0FBQ0FGLElBQUU2RixFQUFGLENBQUt6RCxVQUFMLEdBQWtCQSxVQUFsQjs7QUFFQTtBQUNBLEdBQUMsWUFBVztBQUNWLFFBQUksQ0FBQzBELEtBQUtDLEdBQU4sSUFBYSxDQUFDN0osT0FBTzRKLElBQVAsQ0FBWUMsR0FBOUIsRUFDRTdKLE9BQU80SixJQUFQLENBQVlDLEdBQVosR0FBa0JELEtBQUtDLEdBQUwsR0FBVyxZQUFXO0FBQUUsYUFBTyxJQUFJRCxJQUFKLEdBQVdFLE9BQVgsRUFBUDtBQUE4QixLQUF4RTs7QUFFRixRQUFJQyxVQUFVLENBQUMsUUFBRCxFQUFXLEtBQVgsQ0FBZDtBQUNBLFNBQUssSUFBSTlDLElBQUksQ0FBYixFQUFnQkEsSUFBSThDLFFBQVF4RCxNQUFaLElBQXNCLENBQUN2RyxPQUFPZ0sscUJBQTlDLEVBQXFFLEVBQUUvQyxDQUF2RSxFQUEwRTtBQUN0RSxVQUFJZ0QsS0FBS0YsUUFBUTlDLENBQVIsQ0FBVDtBQUNBakgsYUFBT2dLLHFCQUFQLEdBQStCaEssT0FBT2lLLEtBQUcsdUJBQVYsQ0FBL0I7QUFDQWpLLGFBQU9rSyxvQkFBUCxHQUErQmxLLE9BQU9pSyxLQUFHLHNCQUFWLEtBQ0RqSyxPQUFPaUssS0FBRyw2QkFBVixDQUQ5QjtBQUVIO0FBQ0QsUUFBSSx1QkFBdUJFLElBQXZCLENBQTRCbkssT0FBT29LLFNBQVAsQ0FBaUJDLFNBQTdDLEtBQ0MsQ0FBQ3JLLE9BQU9nSyxxQkFEVCxJQUNrQyxDQUFDaEssT0FBT2tLLG9CQUQ5QyxFQUNvRTtBQUNsRSxVQUFJSSxXQUFXLENBQWY7QUFDQXRLLGFBQU9nSyxxQkFBUCxHQUErQixVQUFTTyxRQUFULEVBQW1CO0FBQzlDLFlBQUlWLE1BQU1ELEtBQUtDLEdBQUwsRUFBVjtBQUNBLFlBQUlXLFdBQVcvRCxLQUFLZ0UsR0FBTCxDQUFTSCxXQUFXLEVBQXBCLEVBQXdCVCxHQUF4QixDQUFmO0FBQ0EsZUFBTzFJLFdBQVcsWUFBVztBQUFFb0osbUJBQVNELFdBQVdFLFFBQXBCO0FBQWdDLFNBQXhELEVBQ1dBLFdBQVdYLEdBRHRCLENBQVA7QUFFSCxPQUxEO0FBTUE3SixhQUFPa0ssb0JBQVAsR0FBOEI1SSxZQUE5QjtBQUNEO0FBQ0Q7OztBQUdBLFFBQUcsQ0FBQ3RCLE9BQU8wSyxXQUFSLElBQXVCLENBQUMxSyxPQUFPMEssV0FBUCxDQUFtQmIsR0FBOUMsRUFBa0Q7QUFDaEQ3SixhQUFPMEssV0FBUCxHQUFxQjtBQUNuQkMsZUFBT2YsS0FBS0MsR0FBTCxFQURZO0FBRW5CQSxhQUFLLFlBQVU7QUFBRSxpQkFBT0QsS0FBS0MsR0FBTCxLQUFhLEtBQUtjLEtBQXpCO0FBQWlDO0FBRi9CLE9BQXJCO0FBSUQ7QUFDRixHQS9CRDtBQWdDQSxNQUFJLENBQUNDLFNBQVNuSCxTQUFULENBQW1Cb0gsSUFBeEIsRUFBOEI7QUFDNUJELGFBQVNuSCxTQUFULENBQW1Cb0gsSUFBbkIsR0FBMEIsVUFBU0MsS0FBVCxFQUFnQjtBQUN4QyxVQUFJLE9BQU8sSUFBUCxLQUFnQixVQUFwQixFQUFnQztBQUM5QjtBQUNBO0FBQ0EsY0FBTSxJQUFJcEIsU0FBSixDQUFjLHNFQUFkLENBQU47QUFDRDs7QUFFRCxVQUFJcUIsUUFBVXZILE1BQU1DLFNBQU4sQ0FBZ0JxRCxLQUFoQixDQUFzQnlDLElBQXRCLENBQTJCVCxTQUEzQixFQUFzQyxDQUF0QyxDQUFkO0FBQUEsVUFDSWtDLFVBQVUsSUFEZDtBQUFBLFVBRUlDLE9BQVUsWUFBVyxDQUFFLENBRjNCO0FBQUEsVUFHSUMsU0FBVSxZQUFXO0FBQ25CLGVBQU9GLFFBQVFqQyxLQUFSLENBQWMsZ0JBQWdCa0MsSUFBaEIsR0FDWixJQURZLEdBRVpILEtBRkYsRUFHQUMsTUFBTUksTUFBTixDQUFhM0gsTUFBTUMsU0FBTixDQUFnQnFELEtBQWhCLENBQXNCeUMsSUFBdEIsQ0FBMkJULFNBQTNCLENBQWIsQ0FIQSxDQUFQO0FBSUQsT0FSTDs7QUFVQSxVQUFJLEtBQUtyRixTQUFULEVBQW9CO0FBQ2xCO0FBQ0F3SCxhQUFLeEgsU0FBTCxHQUFpQixLQUFLQSxTQUF0QjtBQUNEO0FBQ0R5SCxhQUFPekgsU0FBUCxHQUFtQixJQUFJd0gsSUFBSixFQUFuQjs7QUFFQSxhQUFPQyxNQUFQO0FBQ0QsS0F4QkQ7QUF5QkQ7QUFDRDtBQUNBLFdBQVN6RyxZQUFULENBQXNCa0YsRUFBdEIsRUFBMEI7QUFDeEIsUUFBSWlCLFNBQVNuSCxTQUFULENBQW1CYyxJQUFuQixLQUE0QmhCLFNBQWhDLEVBQTJDO0FBQ3pDLFVBQUk2SCxnQkFBZ0Isd0JBQXBCO0FBQ0EsVUFBSUMsVUFBV0QsYUFBRCxDQUFnQkUsSUFBaEIsQ0FBc0IzQixFQUFELENBQUs5QyxRQUFMLEVBQXJCLENBQWQ7QUFDQSxhQUFRd0UsV0FBV0EsUUFBUTlFLE1BQVIsR0FBaUIsQ0FBN0IsR0FBa0M4RSxRQUFRLENBQVIsRUFBV3ZELElBQVgsRUFBbEMsR0FBc0QsRUFBN0Q7QUFDRCxLQUpELE1BS0ssSUFBSTZCLEdBQUdsRyxTQUFILEtBQWlCRixTQUFyQixFQUFnQztBQUNuQyxhQUFPb0csR0FBRzdFLFdBQUgsQ0FBZVAsSUFBdEI7QUFDRCxLQUZJLE1BR0E7QUFDSCxhQUFPb0YsR0FBR2xHLFNBQUgsQ0FBYXFCLFdBQWIsQ0FBeUJQLElBQWhDO0FBQ0Q7QUFDRjtBQUNELFdBQVN3RCxVQUFULENBQW9Cd0QsR0FBcEIsRUFBd0I7QUFDdEIsUUFBRyxPQUFPcEIsSUFBUCxDQUFZb0IsR0FBWixDQUFILEVBQXFCLE9BQU8sSUFBUCxDQUFyQixLQUNLLElBQUcsUUFBUXBCLElBQVIsQ0FBYW9CLEdBQWIsQ0FBSCxFQUFzQixPQUFPLEtBQVAsQ0FBdEIsS0FDQSxJQUFHLENBQUNDLE1BQU1ELE1BQU0sQ0FBWixDQUFKLEVBQW9CLE9BQU9FLFdBQVdGLEdBQVgsQ0FBUDtBQUN6QixXQUFPQSxHQUFQO0FBQ0Q7QUFDRDtBQUNBO0FBQ0EsV0FBUzVHLFNBQVQsQ0FBbUI0RyxHQUFuQixFQUF3QjtBQUN0QixXQUFPQSxJQUFJRyxPQUFKLENBQVksaUJBQVosRUFBK0IsT0FBL0IsRUFBd0MxSixXQUF4QyxFQUFQO0FBQ0Q7QUFFQSxDQXpYQSxDQXlYQzJKLE1BelhELENBQUQ7Q0NBQTs7QUFFQSxDQUFDLFVBQVM3SCxDQUFULEVBQVk7O0FBRWJFLGFBQVc0SCxHQUFYLEdBQWlCO0FBQ2ZDLHNCQUFrQkEsZ0JBREg7QUFFZkMsbUJBQWVBLGFBRkE7QUFHZkMsZ0JBQVlBO0FBSEcsR0FBakI7O0FBTUE7Ozs7Ozs7Ozs7QUFVQSxXQUFTRixnQkFBVCxDQUEwQkcsT0FBMUIsRUFBbUNDLE1BQW5DLEVBQTJDQyxNQUEzQyxFQUFtREMsTUFBbkQsRUFBMkQ7QUFDekQsUUFBSUMsVUFBVU4sY0FBY0UsT0FBZCxDQUFkO0FBQUEsUUFDSUssR0FESjtBQUFBLFFBQ1NDLE1BRFQ7QUFBQSxRQUNpQkMsSUFEakI7QUFBQSxRQUN1QkMsS0FEdkI7O0FBR0EsUUFBSVAsTUFBSixFQUFZO0FBQ1YsVUFBSVEsVUFBVVgsY0FBY0csTUFBZCxDQUFkOztBQUVBSyxlQUFVRixRQUFRTSxNQUFSLENBQWVMLEdBQWYsR0FBcUJELFFBQVFPLE1BQTdCLElBQXVDRixRQUFRRSxNQUFSLEdBQWlCRixRQUFRQyxNQUFSLENBQWVMLEdBQWpGO0FBQ0FBLFlBQVVELFFBQVFNLE1BQVIsQ0FBZUwsR0FBZixJQUFzQkksUUFBUUMsTUFBUixDQUFlTCxHQUEvQztBQUNBRSxhQUFVSCxRQUFRTSxNQUFSLENBQWVILElBQWYsSUFBdUJFLFFBQVFDLE1BQVIsQ0FBZUgsSUFBaEQ7QUFDQUMsY0FBVUosUUFBUU0sTUFBUixDQUFlSCxJQUFmLEdBQXNCSCxRQUFRUSxLQUE5QixJQUF1Q0gsUUFBUUcsS0FBekQ7QUFDRCxLQVBELE1BUUs7QUFDSE4sZUFBVUYsUUFBUU0sTUFBUixDQUFlTCxHQUFmLEdBQXFCRCxRQUFRTyxNQUE3QixJQUF1Q1AsUUFBUVMsVUFBUixDQUFtQkYsTUFBbkIsR0FBNEJQLFFBQVFTLFVBQVIsQ0FBbUJILE1BQW5CLENBQTBCTCxHQUF2RztBQUNBQSxZQUFVRCxRQUFRTSxNQUFSLENBQWVMLEdBQWYsSUFBc0JELFFBQVFTLFVBQVIsQ0FBbUJILE1BQW5CLENBQTBCTCxHQUExRDtBQUNBRSxhQUFVSCxRQUFRTSxNQUFSLENBQWVILElBQWYsSUFBdUJILFFBQVFTLFVBQVIsQ0FBbUJILE1BQW5CLENBQTBCSCxJQUEzRDtBQUNBQyxjQUFVSixRQUFRTSxNQUFSLENBQWVILElBQWYsR0FBc0JILFFBQVFRLEtBQTlCLElBQXVDUixRQUFRUyxVQUFSLENBQW1CRCxLQUFwRTtBQUNEOztBQUVELFFBQUlFLFVBQVUsQ0FBQ1IsTUFBRCxFQUFTRCxHQUFULEVBQWNFLElBQWQsRUFBb0JDLEtBQXBCLENBQWQ7O0FBRUEsUUFBSU4sTUFBSixFQUFZO0FBQ1YsYUFBT0ssU0FBU0MsS0FBVCxLQUFtQixJQUExQjtBQUNEOztBQUVELFFBQUlMLE1BQUosRUFBWTtBQUNWLGFBQU9FLFFBQVFDLE1BQVIsS0FBbUIsSUFBMUI7QUFDRDs7QUFFRCxXQUFPUSxRQUFRMUssT0FBUixDQUFnQixLQUFoQixNQUEyQixDQUFDLENBQW5DO0FBQ0Q7O0FBRUQ7Ozs7Ozs7QUFPQSxXQUFTMEosYUFBVCxDQUF1QjlFLElBQXZCLEVBQTZCbUQsSUFBN0IsRUFBa0M7QUFDaENuRCxXQUFPQSxLQUFLVCxNQUFMLEdBQWNTLEtBQUssQ0FBTCxDQUFkLEdBQXdCQSxJQUEvQjs7QUFFQSxRQUFJQSxTQUFTaEgsTUFBVCxJQUFtQmdILFNBQVMvRCxRQUFoQyxFQUEwQztBQUN4QyxZQUFNLElBQUk4SixLQUFKLENBQVUsOENBQVYsQ0FBTjtBQUNEOztBQUVELFFBQUlDLE9BQU9oRyxLQUFLaUcscUJBQUwsRUFBWDtBQUFBLFFBQ0lDLFVBQVVsRyxLQUFLbUcsVUFBTCxDQUFnQkYscUJBQWhCLEVBRGQ7QUFBQSxRQUVJRyxVQUFVbkssU0FBUzlDLElBQVQsQ0FBYzhNLHFCQUFkLEVBRmQ7QUFBQSxRQUdJSSxPQUFPck4sT0FBT3NOLFdBSGxCO0FBQUEsUUFJSUMsT0FBT3ZOLE9BQU93TixXQUpsQjs7QUFNQSxXQUFPO0FBQ0xaLGFBQU9JLEtBQUtKLEtBRFA7QUFFTEQsY0FBUUssS0FBS0wsTUFGUjtBQUdMRCxjQUFRO0FBQ05MLGFBQUtXLEtBQUtYLEdBQUwsR0FBV2dCLElBRFY7QUFFTmQsY0FBTVMsS0FBS1QsSUFBTCxHQUFZZ0I7QUFGWixPQUhIO0FBT0xFLGtCQUFZO0FBQ1ZiLGVBQU9NLFFBQVFOLEtBREw7QUFFVkQsZ0JBQVFPLFFBQVFQLE1BRk47QUFHVkQsZ0JBQVE7QUFDTkwsZUFBS2EsUUFBUWIsR0FBUixHQUFjZ0IsSUFEYjtBQUVOZCxnQkFBTVcsUUFBUVgsSUFBUixHQUFlZ0I7QUFGZjtBQUhFLE9BUFA7QUFlTFYsa0JBQVk7QUFDVkQsZUFBT1EsUUFBUVIsS0FETDtBQUVWRCxnQkFBUVMsUUFBUVQsTUFGTjtBQUdWRCxnQkFBUTtBQUNOTCxlQUFLZ0IsSUFEQztBQUVOZCxnQkFBTWdCO0FBRkE7QUFIRTtBQWZQLEtBQVA7QUF3QkQ7O0FBRUQ7Ozs7Ozs7Ozs7OztBQVlBLFdBQVN4QixVQUFULENBQW9CQyxPQUFwQixFQUE2QjBCLE1BQTdCLEVBQXFDQyxRQUFyQyxFQUErQ0MsT0FBL0MsRUFBd0RDLE9BQXhELEVBQWlFQyxVQUFqRSxFQUE2RTtBQUMzRSxRQUFJQyxXQUFXakMsY0FBY0UsT0FBZCxDQUFmO0FBQUEsUUFDSWdDLGNBQWNOLFNBQVM1QixjQUFjNEIsTUFBZCxDQUFULEdBQWlDLElBRG5EOztBQUdBLFlBQVFDLFFBQVI7QUFDRSxXQUFLLEtBQUw7QUFDRSxlQUFPO0FBQ0xwQixnQkFBT3ZJLFdBQVdJLEdBQVgsS0FBbUI0SixZQUFZdEIsTUFBWixDQUFtQkgsSUFBbkIsR0FBMEJ3QixTQUFTbkIsS0FBbkMsR0FBMkNvQixZQUFZcEIsS0FBMUUsR0FBa0ZvQixZQUFZdEIsTUFBWixDQUFtQkgsSUFEdkc7QUFFTEYsZUFBSzJCLFlBQVl0QixNQUFaLENBQW1CTCxHQUFuQixJQUEwQjBCLFNBQVNwQixNQUFULEdBQWtCaUIsT0FBNUM7QUFGQSxTQUFQO0FBSUE7QUFDRixXQUFLLE1BQUw7QUFDRSxlQUFPO0FBQ0xyQixnQkFBTXlCLFlBQVl0QixNQUFaLENBQW1CSCxJQUFuQixJQUEyQndCLFNBQVNuQixLQUFULEdBQWlCaUIsT0FBNUMsQ0FERDtBQUVMeEIsZUFBSzJCLFlBQVl0QixNQUFaLENBQW1CTDtBQUZuQixTQUFQO0FBSUE7QUFDRixXQUFLLE9BQUw7QUFDRSxlQUFPO0FBQ0xFLGdCQUFNeUIsWUFBWXRCLE1BQVosQ0FBbUJILElBQW5CLEdBQTBCeUIsWUFBWXBCLEtBQXRDLEdBQThDaUIsT0FEL0M7QUFFTHhCLGVBQUsyQixZQUFZdEIsTUFBWixDQUFtQkw7QUFGbkIsU0FBUDtBQUlBO0FBQ0YsV0FBSyxZQUFMO0FBQ0UsZUFBTztBQUNMRSxnQkFBT3lCLFlBQVl0QixNQUFaLENBQW1CSCxJQUFuQixHQUEyQnlCLFlBQVlwQixLQUFaLEdBQW9CLENBQWhELEdBQXVEbUIsU0FBU25CLEtBQVQsR0FBaUIsQ0FEekU7QUFFTFAsZUFBSzJCLFlBQVl0QixNQUFaLENBQW1CTCxHQUFuQixJQUEwQjBCLFNBQVNwQixNQUFULEdBQWtCaUIsT0FBNUM7QUFGQSxTQUFQO0FBSUE7QUFDRixXQUFLLGVBQUw7QUFDRSxlQUFPO0FBQ0xyQixnQkFBTXVCLGFBQWFELE9BQWIsR0FBeUJHLFlBQVl0QixNQUFaLENBQW1CSCxJQUFuQixHQUEyQnlCLFlBQVlwQixLQUFaLEdBQW9CLENBQWhELEdBQXVEbUIsU0FBU25CLEtBQVQsR0FBaUIsQ0FEakc7QUFFTFAsZUFBSzJCLFlBQVl0QixNQUFaLENBQW1CTCxHQUFuQixHQUF5QjJCLFlBQVlyQixNQUFyQyxHQUE4Q2lCO0FBRjlDLFNBQVA7QUFJQTtBQUNGLFdBQUssYUFBTDtBQUNFLGVBQU87QUFDTHJCLGdCQUFNeUIsWUFBWXRCLE1BQVosQ0FBbUJILElBQW5CLElBQTJCd0IsU0FBU25CLEtBQVQsR0FBaUJpQixPQUE1QyxDQUREO0FBRUx4QixlQUFNMkIsWUFBWXRCLE1BQVosQ0FBbUJMLEdBQW5CLEdBQTBCMkIsWUFBWXJCLE1BQVosR0FBcUIsQ0FBaEQsR0FBdURvQixTQUFTcEIsTUFBVCxHQUFrQjtBQUZ6RSxTQUFQO0FBSUE7QUFDRixXQUFLLGNBQUw7QUFDRSxlQUFPO0FBQ0xKLGdCQUFNeUIsWUFBWXRCLE1BQVosQ0FBbUJILElBQW5CLEdBQTBCeUIsWUFBWXBCLEtBQXRDLEdBQThDaUIsT0FBOUMsR0FBd0QsQ0FEekQ7QUFFTHhCLGVBQU0yQixZQUFZdEIsTUFBWixDQUFtQkwsR0FBbkIsR0FBMEIyQixZQUFZckIsTUFBWixHQUFxQixDQUFoRCxHQUF1RG9CLFNBQVNwQixNQUFULEdBQWtCO0FBRnpFLFNBQVA7QUFJQTtBQUNGLFdBQUssUUFBTDtBQUNFLGVBQU87QUFDTEosZ0JBQU93QixTQUFTbEIsVUFBVCxDQUFvQkgsTUFBcEIsQ0FBMkJILElBQTNCLEdBQW1Dd0IsU0FBU2xCLFVBQVQsQ0FBb0JELEtBQXBCLEdBQTRCLENBQWhFLEdBQXVFbUIsU0FBU25CLEtBQVQsR0FBaUIsQ0FEekY7QUFFTFAsZUFBTTBCLFNBQVNsQixVQUFULENBQW9CSCxNQUFwQixDQUEyQkwsR0FBM0IsR0FBa0MwQixTQUFTbEIsVUFBVCxDQUFvQkYsTUFBcEIsR0FBNkIsQ0FBaEUsR0FBdUVvQixTQUFTcEIsTUFBVCxHQUFrQjtBQUZ6RixTQUFQO0FBSUE7QUFDRixXQUFLLFFBQUw7QUFDRSxlQUFPO0FBQ0xKLGdCQUFNLENBQUN3QixTQUFTbEIsVUFBVCxDQUFvQkQsS0FBcEIsR0FBNEJtQixTQUFTbkIsS0FBdEMsSUFBK0MsQ0FEaEQ7QUFFTFAsZUFBSzBCLFNBQVNsQixVQUFULENBQW9CSCxNQUFwQixDQUEyQkwsR0FBM0IsR0FBaUN1QjtBQUZqQyxTQUFQO0FBSUYsV0FBSyxhQUFMO0FBQ0UsZUFBTztBQUNMckIsZ0JBQU13QixTQUFTbEIsVUFBVCxDQUFvQkgsTUFBcEIsQ0FBMkJILElBRDVCO0FBRUxGLGVBQUswQixTQUFTbEIsVUFBVCxDQUFvQkgsTUFBcEIsQ0FBMkJMO0FBRjNCLFNBQVA7QUFJQTtBQUNGLFdBQUssYUFBTDtBQUNFLGVBQU87QUFDTEUsZ0JBQU15QixZQUFZdEIsTUFBWixDQUFtQkgsSUFBbkIsSUFBMkJ3QixTQUFTbkIsS0FBVCxHQUFpQmlCLE9BQTVDLENBREQ7QUFFTHhCLGVBQUsyQixZQUFZdEIsTUFBWixDQUFtQkwsR0FBbkIsR0FBeUIyQixZQUFZckI7QUFGckMsU0FBUDtBQUlBO0FBQ0YsV0FBSyxjQUFMO0FBQ0UsZUFBTztBQUNMSixnQkFBTXlCLFlBQVl0QixNQUFaLENBQW1CSCxJQUFuQixHQUEwQnlCLFlBQVlwQixLQUF0QyxHQUE4Q2lCLE9BQTlDLEdBQXdERSxTQUFTbkIsS0FEbEU7QUFFTFAsZUFBSzJCLFlBQVl0QixNQUFaLENBQW1CTCxHQUFuQixHQUF5QjJCLFlBQVlyQjtBQUZyQyxTQUFQO0FBSUE7QUFDRjtBQUNFLGVBQU87QUFDTEosZ0JBQU92SSxXQUFXSSxHQUFYLEtBQW1CNEosWUFBWXRCLE1BQVosQ0FBbUJILElBQW5CLEdBQTBCd0IsU0FBU25CLEtBQW5DLEdBQTJDb0IsWUFBWXBCLEtBQTFFLEdBQWtGb0IsWUFBWXRCLE1BQVosQ0FBbUJILElBRHZHO0FBRUxGLGVBQUsyQixZQUFZdEIsTUFBWixDQUFtQkwsR0FBbkIsR0FBeUIyQixZQUFZckIsTUFBckMsR0FBOENpQjtBQUY5QyxTQUFQO0FBekVKO0FBOEVEO0FBRUEsQ0FoTUEsQ0FnTUNqQyxNQWhNRCxDQUFEO0NDRkE7Ozs7Ozs7O0FBUUE7O0FBRUEsQ0FBQyxVQUFTN0gsQ0FBVCxFQUFZOztBQUViLE1BQU1tSyxXQUFXO0FBQ2YsT0FBRyxLQURZO0FBRWYsUUFBSSxPQUZXO0FBR2YsUUFBSSxRQUhXO0FBSWYsUUFBSSxPQUpXO0FBS2YsUUFBSSxZQUxXO0FBTWYsUUFBSSxVQU5XO0FBT2YsUUFBSSxhQVBXO0FBUWYsUUFBSTtBQVJXLEdBQWpCOztBQVdBLE1BQUlDLFdBQVcsRUFBZjs7QUFFQSxNQUFJQyxXQUFXO0FBQ2J4SyxVQUFNeUssWUFBWUgsUUFBWixDQURPOztBQUdiOzs7Ozs7QUFNQUksWUFUYSxZQVNKbk4sS0FUSSxFQVNHO0FBQ2QsVUFBSU0sTUFBTXlNLFNBQVMvTSxNQUFNeUIsS0FBTixJQUFlekIsTUFBTXdCLE9BQTlCLEtBQTBDNEwsT0FBT0MsWUFBUCxDQUFvQnJOLE1BQU15QixLQUExQixFQUFpQzZMLFdBQWpDLEVBQXBEO0FBQ0EsVUFBSXROLE1BQU11TixRQUFWLEVBQW9Cak4saUJBQWVBLEdBQWY7QUFDcEIsVUFBSU4sTUFBTXdOLE9BQVYsRUFBbUJsTixnQkFBY0EsR0FBZDtBQUNuQixVQUFJTixNQUFNeU4sTUFBVixFQUFrQm5OLGVBQWFBLEdBQWI7QUFDbEIsYUFBT0EsR0FBUDtBQUNELEtBZlk7OztBQWlCYjs7Ozs7O0FBTUFvTixhQXZCYSxZQXVCSDFOLEtBdkJHLEVBdUJJMk4sU0F2QkosRUF1QmVDLFNBdkJmLEVBdUIwQjtBQUNyQyxVQUFJQyxjQUFjYixTQUFTVyxTQUFULENBQWxCO0FBQUEsVUFDRW5NLFVBQVUsS0FBSzJMLFFBQUwsQ0FBY25OLEtBQWQsQ0FEWjtBQUFBLFVBRUU4TixJQUZGO0FBQUEsVUFHRUMsT0FIRjtBQUFBLFVBSUV0RixFQUpGOztBQU1BLFVBQUksQ0FBQ29GLFdBQUwsRUFBa0IsT0FBTzFJLFFBQVFrQixJQUFSLENBQWEsd0JBQWIsQ0FBUDs7QUFFbEIsVUFBSSxPQUFPd0gsWUFBWUcsR0FBbkIsS0FBMkIsV0FBL0IsRUFBNEM7QUFBRTtBQUMxQ0YsZUFBT0QsV0FBUCxDQUR3QyxDQUNwQjtBQUN2QixPQUZELE1BRU87QUFBRTtBQUNMLFlBQUkvSyxXQUFXSSxHQUFYLEVBQUosRUFBc0I0SyxPQUFPbEwsRUFBRXFMLE1BQUYsQ0FBUyxFQUFULEVBQWFKLFlBQVlHLEdBQXpCLEVBQThCSCxZQUFZM0ssR0FBMUMsQ0FBUCxDQUF0QixLQUVLNEssT0FBT2xMLEVBQUVxTCxNQUFGLENBQVMsRUFBVCxFQUFhSixZQUFZM0ssR0FBekIsRUFBOEIySyxZQUFZRyxHQUExQyxDQUFQO0FBQ1I7QUFDREQsZ0JBQVVELEtBQUt0TSxPQUFMLENBQVY7O0FBRUFpSCxXQUFLbUYsVUFBVUcsT0FBVixDQUFMO0FBQ0EsVUFBSXRGLE1BQU0sT0FBT0EsRUFBUCxLQUFjLFVBQXhCLEVBQW9DO0FBQUU7QUFDcENBLFdBQUdaLEtBQUg7QUFDQSxZQUFJK0YsVUFBVU0sT0FBVixJQUFxQixPQUFPTixVQUFVTSxPQUFqQixLQUE2QixVQUF0RCxFQUFrRTtBQUFFO0FBQ2hFTixvQkFBVU0sT0FBVixDQUFrQnJHLEtBQWxCO0FBQ0g7QUFDRixPQUxELE1BS087QUFDTCxZQUFJK0YsVUFBVU8sU0FBVixJQUF1QixPQUFPUCxVQUFVTyxTQUFqQixLQUErQixVQUExRCxFQUFzRTtBQUFFO0FBQ3BFUCxvQkFBVU8sU0FBVixDQUFvQnRHLEtBQXBCO0FBQ0g7QUFDRjtBQUNGLEtBcERZOzs7QUFzRGI7Ozs7O0FBS0F1RyxpQkEzRGEsWUEyRENySyxRQTNERCxFQTJEVztBQUN0QixhQUFPQSxTQUFTa0MsSUFBVCxDQUFjLDhLQUFkLEVBQThMb0ksTUFBOUwsQ0FBcU0sWUFBVztBQUNyTixZQUFJLENBQUN6TCxFQUFFLElBQUYsRUFBUTBMLEVBQVIsQ0FBVyxVQUFYLENBQUQsSUFBMkIxTCxFQUFFLElBQUYsRUFBUU8sSUFBUixDQUFhLFVBQWIsSUFBMkIsQ0FBMUQsRUFBNkQ7QUFBRSxpQkFBTyxLQUFQO0FBQWUsU0FEdUksQ0FDdEk7QUFDL0UsZUFBTyxJQUFQO0FBQ0QsT0FITSxDQUFQO0FBSUQsS0FoRVk7OztBQWtFYjs7Ozs7O0FBTUFvTCxZQXhFYSxZQXdFSkMsYUF4RUksRUF3RVdWLElBeEVYLEVBd0VpQjtBQUM1QmQsZUFBU3dCLGFBQVQsSUFBMEJWLElBQTFCO0FBQ0Q7QUExRVksR0FBZjs7QUE2RUE7Ozs7QUFJQSxXQUFTWixXQUFULENBQXFCdUIsR0FBckIsRUFBMEI7QUFDeEIsUUFBSUMsSUFBSSxFQUFSO0FBQ0EsU0FBSyxJQUFJQyxFQUFULElBQWVGLEdBQWY7QUFBb0JDLFFBQUVELElBQUlFLEVBQUosQ0FBRixJQUFhRixJQUFJRSxFQUFKLENBQWI7QUFBcEIsS0FDQSxPQUFPRCxDQUFQO0FBQ0Q7O0FBRUQ1TCxhQUFXbUssUUFBWCxHQUFzQkEsUUFBdEI7QUFFQyxDQXhHQSxDQXdHQ3hDLE1BeEdELENBQUQ7Q0NWQTs7QUFFQSxDQUFDLFVBQVM3SCxDQUFULEVBQVk7O0FBRWI7QUFDQSxNQUFNZ00saUJBQWlCO0FBQ3JCLGVBQVksYUFEUztBQUVyQkMsZUFBWSwwQ0FGUztBQUdyQkMsY0FBVyx5Q0FIVTtBQUlyQkMsWUFBUyx5REFDUCxtREFETyxHQUVQLG1EQUZPLEdBR1AsOENBSE8sR0FJUCwyQ0FKTyxHQUtQO0FBVG1CLEdBQXZCOztBQVlBLE1BQUkzRyxhQUFhO0FBQ2Y0RyxhQUFTLEVBRE07O0FBR2ZDLGFBQVMsRUFITTs7QUFLZjs7Ozs7QUFLQXZLLFNBVmUsY0FVUDtBQUNOLFVBQUl3SyxPQUFPLElBQVg7QUFDQSxVQUFJQyxrQkFBa0J2TSxFQUFFLGdCQUFGLEVBQW9Cd00sR0FBcEIsQ0FBd0IsYUFBeEIsQ0FBdEI7QUFDQSxVQUFJQyxZQUFKOztBQUVBQSxxQkFBZUMsbUJBQW1CSCxlQUFuQixDQUFmOztBQUVBLFdBQUssSUFBSTdPLEdBQVQsSUFBZ0IrTyxZQUFoQixFQUE4QjtBQUM1QkgsYUFBS0YsT0FBTCxDQUFhek4sSUFBYixDQUFrQjtBQUNoQjhCLGdCQUFNL0MsR0FEVTtBQUVoQkMsa0RBQXNDOE8sYUFBYS9PLEdBQWIsQ0FBdEM7QUFGZ0IsU0FBbEI7QUFJRDs7QUFFRCxXQUFLMk8sT0FBTCxHQUFlLEtBQUtNLGVBQUwsRUFBZjs7QUFFQSxXQUFLQyxRQUFMO0FBQ0QsS0EzQmM7OztBQTZCZjs7Ozs7O0FBTUFDLFdBbkNlLFlBbUNQQyxJQW5DTyxFQW1DRDtBQUNaLFVBQUlDLFFBQVEsS0FBS0MsR0FBTCxDQUFTRixJQUFULENBQVo7O0FBRUEsVUFBSUMsS0FBSixFQUFXO0FBQ1QsZUFBTzdRLE9BQU8rUSxVQUFQLENBQWtCRixLQUFsQixFQUF5QkcsT0FBaEM7QUFDRDs7QUFFRCxhQUFPLEtBQVA7QUFDRCxLQTNDYzs7O0FBNkNmOzs7Ozs7QUFNQUYsT0FuRGUsWUFtRFhGLElBbkRXLEVBbURMO0FBQ1IsV0FBSyxJQUFJM0osQ0FBVCxJQUFjLEtBQUtpSixPQUFuQixFQUE0QjtBQUMxQixZQUFJVyxRQUFRLEtBQUtYLE9BQUwsQ0FBYWpKLENBQWIsQ0FBWjtBQUNBLFlBQUkySixTQUFTQyxNQUFNdE0sSUFBbkIsRUFBeUIsT0FBT3NNLE1BQU1wUCxLQUFiO0FBQzFCOztBQUVELGFBQU8sSUFBUDtBQUNELEtBMURjOzs7QUE0RGY7Ozs7OztBQU1BZ1AsbUJBbEVlLGNBa0VHO0FBQ2hCLFVBQUlRLE9BQUo7O0FBRUEsV0FBSyxJQUFJaEssSUFBSSxDQUFiLEVBQWdCQSxJQUFJLEtBQUtpSixPQUFMLENBQWEzSixNQUFqQyxFQUF5Q1UsR0FBekMsRUFBOEM7QUFDNUMsWUFBSTRKLFFBQVEsS0FBS1gsT0FBTCxDQUFhakosQ0FBYixDQUFaOztBQUVBLFlBQUlqSCxPQUFPK1EsVUFBUCxDQUFrQkYsTUFBTXBQLEtBQXhCLEVBQStCdVAsT0FBbkMsRUFBNEM7QUFDMUNDLG9CQUFVSixLQUFWO0FBQ0Q7QUFDRjs7QUFFRCxVQUFJLE9BQU9JLE9BQVAsS0FBbUIsUUFBdkIsRUFBaUM7QUFDL0IsZUFBT0EsUUFBUTFNLElBQWY7QUFDRCxPQUZELE1BRU87QUFDTCxlQUFPME0sT0FBUDtBQUNEO0FBQ0YsS0FsRmM7OztBQW9GZjs7Ozs7QUFLQVAsWUF6RmUsY0F5Rko7QUFBQTs7QUFDVDVNLFFBQUU5RCxNQUFGLEVBQVVrUixFQUFWLENBQWEsc0JBQWIsRUFBcUMsWUFBTTtBQUN6QyxZQUFJQyxVQUFVLE1BQUtWLGVBQUwsRUFBZDs7QUFFQSxZQUFJVSxZQUFZLE1BQUtoQixPQUFyQixFQUE4QjtBQUM1QjtBQUNBck0sWUFBRTlELE1BQUYsRUFBVW1GLE9BQVYsQ0FBa0IsdUJBQWxCLEVBQTJDLENBQUNnTSxPQUFELEVBQVUsTUFBS2hCLE9BQWYsQ0FBM0M7O0FBRUE7QUFDQSxnQkFBS0EsT0FBTCxHQUFlZ0IsT0FBZjtBQUNEO0FBQ0YsT0FWRDtBQVdEO0FBckdjLEdBQWpCOztBQXdHQW5OLGFBQVdzRixVQUFYLEdBQXdCQSxVQUF4Qjs7QUFFQTtBQUNBO0FBQ0F0SixTQUFPK1EsVUFBUCxLQUFzQi9RLE9BQU8rUSxVQUFQLEdBQW9CLFlBQVc7QUFDbkQ7O0FBRUE7O0FBQ0EsUUFBSUssYUFBY3BSLE9BQU9vUixVQUFQLElBQXFCcFIsT0FBT3FSLEtBQTlDOztBQUVBO0FBQ0EsUUFBSSxDQUFDRCxVQUFMLEVBQWlCO0FBQ2YsVUFBSTlJLFFBQVVyRixTQUFTSSxhQUFULENBQXVCLE9BQXZCLENBQWQ7QUFBQSxVQUNBaU8sU0FBY3JPLFNBQVNzTyxvQkFBVCxDQUE4QixRQUE5QixFQUF3QyxDQUF4QyxDQURkO0FBQUEsVUFFQUMsT0FBYyxJQUZkOztBQUlBbEosWUFBTTVHLElBQU4sR0FBYyxVQUFkO0FBQ0E0RyxZQUFNbUosRUFBTixHQUFjLG1CQUFkOztBQUVBSCxhQUFPbkUsVUFBUCxDQUFrQnVFLFlBQWxCLENBQStCcEosS0FBL0IsRUFBc0NnSixNQUF0Qzs7QUFFQTtBQUNBRSxhQUFRLHNCQUFzQnhSLE1BQXZCLElBQWtDQSxPQUFPMlIsZ0JBQVAsQ0FBd0JySixLQUF4QixFQUErQixJQUEvQixDQUFsQyxJQUEwRUEsTUFBTXNKLFlBQXZGOztBQUVBUixtQkFBYTtBQUNYUyxtQkFEVyxZQUNDUixLQURELEVBQ1E7QUFDakIsY0FBSVMsbUJBQWlCVCxLQUFqQiwyQ0FBSjs7QUFFQTtBQUNBLGNBQUkvSSxNQUFNeUosVUFBVixFQUFzQjtBQUNwQnpKLGtCQUFNeUosVUFBTixDQUFpQkMsT0FBakIsR0FBMkJGLElBQTNCO0FBQ0QsV0FGRCxNQUVPO0FBQ0x4SixrQkFBTTJKLFdBQU4sR0FBb0JILElBQXBCO0FBQ0Q7O0FBRUQ7QUFDQSxpQkFBT04sS0FBSzVFLEtBQUwsS0FBZSxLQUF0QjtBQUNEO0FBYlUsT0FBYjtBQWVEOztBQUVELFdBQU8sVUFBU3lFLEtBQVQsRUFBZ0I7QUFDckIsYUFBTztBQUNMTCxpQkFBU0ksV0FBV1MsV0FBWCxDQUF1QlIsU0FBUyxLQUFoQyxDQURKO0FBRUxBLGVBQU9BLFNBQVM7QUFGWCxPQUFQO0FBSUQsS0FMRDtBQU1ELEdBM0N5QyxFQUExQzs7QUE2Q0E7QUFDQSxXQUFTYixrQkFBVCxDQUE0QmpGLEdBQTVCLEVBQWlDO0FBQy9CLFFBQUkyRyxjQUFjLEVBQWxCOztBQUVBLFFBQUksT0FBTzNHLEdBQVAsS0FBZSxRQUFuQixFQUE2QjtBQUMzQixhQUFPMkcsV0FBUDtBQUNEOztBQUVEM0csVUFBTUEsSUFBSXpELElBQUosR0FBV2hCLEtBQVgsQ0FBaUIsQ0FBakIsRUFBb0IsQ0FBQyxDQUFyQixDQUFOLENBUCtCLENBT0E7O0FBRS9CLFFBQUksQ0FBQ3lFLEdBQUwsRUFBVTtBQUNSLGFBQU8yRyxXQUFQO0FBQ0Q7O0FBRURBLGtCQUFjM0csSUFBSTlELEtBQUosQ0FBVSxHQUFWLEVBQWUwSyxNQUFmLENBQXNCLFVBQVNDLEdBQVQsRUFBY0MsS0FBZCxFQUFxQjtBQUN2RCxVQUFJQyxRQUFRRCxNQUFNM0csT0FBTixDQUFjLEtBQWQsRUFBcUIsR0FBckIsRUFBMEJqRSxLQUExQixDQUFnQyxHQUFoQyxDQUFaO0FBQ0EsVUFBSWpHLE1BQU04USxNQUFNLENBQU4sQ0FBVjtBQUNBLFVBQUlDLE1BQU1ELE1BQU0sQ0FBTixDQUFWO0FBQ0E5USxZQUFNZ1IsbUJBQW1CaFIsR0FBbkIsQ0FBTjs7QUFFQTtBQUNBO0FBQ0ErUSxZQUFNQSxRQUFRaFAsU0FBUixHQUFvQixJQUFwQixHQUEyQmlQLG1CQUFtQkQsR0FBbkIsQ0FBakM7O0FBRUEsVUFBSSxDQUFDSCxJQUFJSyxjQUFKLENBQW1CalIsR0FBbkIsQ0FBTCxFQUE4QjtBQUM1QjRRLFlBQUk1USxHQUFKLElBQVcrUSxHQUFYO0FBQ0QsT0FGRCxNQUVPLElBQUkvTyxNQUFNa1AsT0FBTixDQUFjTixJQUFJNVEsR0FBSixDQUFkLENBQUosRUFBNkI7QUFDbEM0USxZQUFJNVEsR0FBSixFQUFTaUIsSUFBVCxDQUFjOFAsR0FBZDtBQUNELE9BRk0sTUFFQTtBQUNMSCxZQUFJNVEsR0FBSixJQUFXLENBQUM0USxJQUFJNVEsR0FBSixDQUFELEVBQVcrUSxHQUFYLENBQVg7QUFDRDtBQUNELGFBQU9ILEdBQVA7QUFDRCxLQWxCYSxFQWtCWCxFQWxCVyxDQUFkOztBQW9CQSxXQUFPRixXQUFQO0FBQ0Q7O0FBRURsTyxhQUFXc0YsVUFBWCxHQUF3QkEsVUFBeEI7QUFFQyxDQS9NQSxDQStNQ3FDLE1BL01ELENBQUQ7Q0NGQTs7QUFFQSxDQUFDLFVBQVM3SCxDQUFULEVBQVk7O0FBRWI7Ozs7O0FBS0EsTUFBTTZPLGNBQWdCLENBQUMsV0FBRCxFQUFjLFdBQWQsQ0FBdEI7QUFDQSxNQUFNQyxnQkFBZ0IsQ0FBQyxrQkFBRCxFQUFxQixrQkFBckIsQ0FBdEI7O0FBRUEsTUFBTUMsU0FBUztBQUNiQyxlQUFXLFVBQVM5RyxPQUFULEVBQWtCK0csU0FBbEIsRUFBNkJDLEVBQTdCLEVBQWlDO0FBQzFDQyxjQUFRLElBQVIsRUFBY2pILE9BQWQsRUFBdUIrRyxTQUF2QixFQUFrQ0MsRUFBbEM7QUFDRCxLQUhZOztBQUtiRSxnQkFBWSxVQUFTbEgsT0FBVCxFQUFrQitHLFNBQWxCLEVBQTZCQyxFQUE3QixFQUFpQztBQUMzQ0MsY0FBUSxLQUFSLEVBQWVqSCxPQUFmLEVBQXdCK0csU0FBeEIsRUFBbUNDLEVBQW5DO0FBQ0Q7QUFQWSxHQUFmOztBQVVBLFdBQVNHLElBQVQsQ0FBY0MsUUFBZCxFQUF3QnBNLElBQXhCLEVBQThCMkMsRUFBOUIsRUFBaUM7QUFDL0IsUUFBSTBKLElBQUo7QUFBQSxRQUFVQyxJQUFWO0FBQUEsUUFBZ0IzSSxRQUFRLElBQXhCO0FBQ0E7O0FBRUEsYUFBUzRJLElBQVQsQ0FBY0MsRUFBZCxFQUFpQjtBQUNmLFVBQUcsQ0FBQzdJLEtBQUosRUFBV0EsUUFBUTNLLE9BQU8wSyxXQUFQLENBQW1CYixHQUFuQixFQUFSO0FBQ1g7QUFDQXlKLGFBQU9FLEtBQUs3SSxLQUFaO0FBQ0FoQixTQUFHWixLQUFILENBQVMvQixJQUFUOztBQUVBLFVBQUdzTSxPQUFPRixRQUFWLEVBQW1CO0FBQUVDLGVBQU9yVCxPQUFPZ0sscUJBQVAsQ0FBNkJ1SixJQUE3QixFQUFtQ3ZNLElBQW5DLENBQVA7QUFBa0QsT0FBdkUsTUFDSTtBQUNGaEgsZUFBT2tLLG9CQUFQLENBQTRCbUosSUFBNUI7QUFDQXJNLGFBQUs3QixPQUFMLENBQWEscUJBQWIsRUFBb0MsQ0FBQzZCLElBQUQsQ0FBcEMsRUFBNEN1QixjQUE1QyxDQUEyRCxxQkFBM0QsRUFBa0YsQ0FBQ3ZCLElBQUQsQ0FBbEY7QUFDRDtBQUNGO0FBQ0RxTSxXQUFPclQsT0FBT2dLLHFCQUFQLENBQTZCdUosSUFBN0IsQ0FBUDtBQUNEOztBQUVEOzs7Ozs7Ozs7QUFTQSxXQUFTTixPQUFULENBQWlCUSxJQUFqQixFQUF1QnpILE9BQXZCLEVBQWdDK0csU0FBaEMsRUFBMkNDLEVBQTNDLEVBQStDO0FBQzdDaEgsY0FBVWxJLEVBQUVrSSxPQUFGLEVBQVcwSCxFQUFYLENBQWMsQ0FBZCxDQUFWOztBQUVBLFFBQUksQ0FBQzFILFFBQVF6RixNQUFiLEVBQXFCOztBQUVyQixRQUFJb04sWUFBWUYsT0FBT2QsWUFBWSxDQUFaLENBQVAsR0FBd0JBLFlBQVksQ0FBWixDQUF4QztBQUNBLFFBQUlpQixjQUFjSCxPQUFPYixjQUFjLENBQWQsQ0FBUCxHQUEwQkEsY0FBYyxDQUFkLENBQTVDOztBQUVBO0FBQ0FpQjs7QUFFQTdILFlBQ0c4SCxRQURILENBQ1lmLFNBRFosRUFFR3pDLEdBRkgsQ0FFTyxZQUZQLEVBRXFCLE1BRnJCOztBQUlBdEcsMEJBQXNCLFlBQU07QUFDMUJnQyxjQUFROEgsUUFBUixDQUFpQkgsU0FBakI7QUFDQSxVQUFJRixJQUFKLEVBQVV6SCxRQUFRK0gsSUFBUjtBQUNYLEtBSEQ7O0FBS0E7QUFDQS9KLDBCQUFzQixZQUFNO0FBQzFCZ0MsY0FBUSxDQUFSLEVBQVdnSSxXQUFYO0FBQ0FoSSxjQUNHc0UsR0FESCxDQUNPLFlBRFAsRUFDcUIsRUFEckIsRUFFR3dELFFBRkgsQ0FFWUYsV0FGWjtBQUdELEtBTEQ7O0FBT0E7QUFDQTVILFlBQVFpSSxHQUFSLENBQVlqUSxXQUFXa0UsYUFBWCxDQUF5QjhELE9BQXpCLENBQVosRUFBK0NrSSxNQUEvQzs7QUFFQTtBQUNBLGFBQVNBLE1BQVQsR0FBa0I7QUFDaEIsVUFBSSxDQUFDVCxJQUFMLEVBQVd6SCxRQUFRbUksSUFBUjtBQUNYTjtBQUNBLFVBQUliLEVBQUosRUFBUUEsR0FBR2pLLEtBQUgsQ0FBU2lELE9BQVQ7QUFDVDs7QUFFRDtBQUNBLGFBQVM2SCxLQUFULEdBQWlCO0FBQ2Y3SCxjQUFRLENBQVIsRUFBVzFELEtBQVgsQ0FBaUI4TCxrQkFBakIsR0FBc0MsQ0FBdEM7QUFDQXBJLGNBQVEzQyxXQUFSLENBQXVCc0ssU0FBdkIsU0FBb0NDLFdBQXBDLFNBQW1EYixTQUFuRDtBQUNEO0FBQ0Y7O0FBRUQvTyxhQUFXbVAsSUFBWCxHQUFrQkEsSUFBbEI7QUFDQW5QLGFBQVc2TyxNQUFYLEdBQW9CQSxNQUFwQjtBQUVDLENBaEdBLENBZ0dDbEgsTUFoR0QsQ0FBRDtDQ0ZBOztBQUVBLENBQUMsVUFBUzdILENBQVQsRUFBWTs7QUFFYixNQUFNdVEsT0FBTztBQUNYQyxXQURXLFlBQ0hDLElBREcsRUFDZ0I7QUFBQSxVQUFiN1MsSUFBYSx1RUFBTixJQUFNOztBQUN6QjZTLFdBQUtsUSxJQUFMLENBQVUsTUFBVixFQUFrQixTQUFsQjs7QUFFQSxVQUFJbVEsUUFBUUQsS0FBS3BOLElBQUwsQ0FBVSxJQUFWLEVBQWdCOUMsSUFBaEIsQ0FBcUIsRUFBQyxRQUFRLFVBQVQsRUFBckIsQ0FBWjtBQUFBLFVBQ0lvUSx1QkFBcUIvUyxJQUFyQixhQURKO0FBQUEsVUFFSWdULGVBQWtCRCxZQUFsQixVQUZKO0FBQUEsVUFHSUUsc0JBQW9CalQsSUFBcEIsb0JBSEo7O0FBS0E2UyxXQUFLcE4sSUFBTCxDQUFVLFNBQVYsRUFBcUI5QyxJQUFyQixDQUEwQixVQUExQixFQUFzQyxDQUF0Qzs7QUFFQW1RLFlBQU03TyxJQUFOLENBQVcsWUFBVztBQUNwQixZQUFJaVAsUUFBUTlRLEVBQUUsSUFBRixDQUFaO0FBQUEsWUFDSStRLE9BQU9ELE1BQU1FLFFBQU4sQ0FBZSxJQUFmLENBRFg7O0FBR0EsWUFBSUQsS0FBS3RPLE1BQVQsRUFBaUI7QUFDZnFPLGdCQUNHZCxRQURILENBQ1lhLFdBRFosRUFFR3RRLElBRkgsQ0FFUTtBQUNKLDZCQUFpQixJQURiO0FBRUosNkJBQWlCLEtBRmI7QUFHSiwwQkFBY3VRLE1BQU1FLFFBQU4sQ0FBZSxTQUFmLEVBQTBCaEQsSUFBMUI7QUFIVixXQUZSOztBQVFBK0MsZUFDR2YsUUFESCxjQUN1QlcsWUFEdkIsRUFFR3BRLElBRkgsQ0FFUTtBQUNKLDRCQUFnQixFQURaO0FBRUosMkJBQWUsSUFGWDtBQUdKLG9CQUFRO0FBSEosV0FGUjtBQU9EOztBQUVELFlBQUl1USxNQUFNM0ksTUFBTixDQUFhLGdCQUFiLEVBQStCMUYsTUFBbkMsRUFBMkM7QUFDekNxTyxnQkFBTWQsUUFBTixzQkFBa0NZLFlBQWxDO0FBQ0Q7QUFDRixPQXpCRDs7QUEyQkE7QUFDRCxLQXZDVTtBQXlDWEssUUF6Q1csWUF5Q05SLElBekNNLEVBeUNBN1MsSUF6Q0EsRUF5Q007QUFDZixVQUFJOFMsUUFBUUQsS0FBS3BOLElBQUwsQ0FBVSxJQUFWLEVBQWdCOUIsVUFBaEIsQ0FBMkIsVUFBM0IsQ0FBWjtBQUFBLFVBQ0lvUCx1QkFBcUIvUyxJQUFyQixhQURKO0FBQUEsVUFFSWdULGVBQWtCRCxZQUFsQixVQUZKO0FBQUEsVUFHSUUsc0JBQW9CalQsSUFBcEIsb0JBSEo7O0FBS0E2UyxXQUNHcE4sSUFESCxDQUNRLEdBRFIsRUFFR2tDLFdBRkgsQ0FFa0JvTCxZQUZsQixTQUVrQ0MsWUFGbEMsU0FFa0RDLFdBRmxELHlDQUdHdFAsVUFISCxDQUdjLGNBSGQsRUFHOEJpTCxHQUg5QixDQUdrQyxTQUhsQyxFQUc2QyxFQUg3Qzs7QUFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Q7QUFsRVUsR0FBYjs7QUFxRUF0TSxhQUFXcVEsSUFBWCxHQUFrQkEsSUFBbEI7QUFFQyxDQXpFQSxDQXlFQzFJLE1BekVELENBQUQ7Q0NGQTs7QUFFQSxDQUFDLFVBQVM3SCxDQUFULEVBQVk7O0FBRWIsV0FBU2tSLEtBQVQsQ0FBZWhPLElBQWYsRUFBcUJpTyxPQUFyQixFQUE4QmpDLEVBQTlCLEVBQWtDO0FBQ2hDLFFBQUluTixRQUFRLElBQVo7QUFBQSxRQUNJdU4sV0FBVzZCLFFBQVE3QixRQUR2QjtBQUFBLFFBQ2dDO0FBQzVCOEIsZ0JBQVkvTyxPQUFPeEMsSUFBUCxDQUFZcUQsS0FBSzlCLElBQUwsRUFBWixFQUF5QixDQUF6QixLQUErQixPQUYvQztBQUFBLFFBR0lpUSxTQUFTLENBQUMsQ0FIZDtBQUFBLFFBSUl4SyxLQUpKO0FBQUEsUUFLSTdKLEtBTEo7O0FBT0EsU0FBS3NVLFFBQUwsR0FBZ0IsS0FBaEI7O0FBRUEsU0FBS0MsT0FBTCxHQUFlLFlBQVc7QUFDeEJGLGVBQVMsQ0FBQyxDQUFWO0FBQ0E3VCxtQkFBYVIsS0FBYjtBQUNBLFdBQUs2SixLQUFMO0FBQ0QsS0FKRDs7QUFNQSxTQUFLQSxLQUFMLEdBQWEsWUFBVztBQUN0QixXQUFLeUssUUFBTCxHQUFnQixLQUFoQjtBQUNBO0FBQ0E5VCxtQkFBYVIsS0FBYjtBQUNBcVUsZUFBU0EsVUFBVSxDQUFWLEdBQWMvQixRQUFkLEdBQXlCK0IsTUFBbEM7QUFDQW5PLFdBQUs5QixJQUFMLENBQVUsUUFBVixFQUFvQixLQUFwQjtBQUNBeUYsY0FBUWYsS0FBS0MsR0FBTCxFQUFSO0FBQ0EvSSxjQUFRSyxXQUFXLFlBQVU7QUFDM0IsWUFBRzhULFFBQVFLLFFBQVgsRUFBb0I7QUFDbEJ6UCxnQkFBTXdQLE9BQU4sR0FEa0IsQ0FDRjtBQUNqQjtBQUNEckM7QUFDRCxPQUxPLEVBS0xtQyxNQUxLLENBQVI7QUFNQW5PLFdBQUs3QixPQUFMLG9CQUE4QitQLFNBQTlCO0FBQ0QsS0FkRDs7QUFnQkEsU0FBS0ssS0FBTCxHQUFhLFlBQVc7QUFDdEIsV0FBS0gsUUFBTCxHQUFnQixJQUFoQjtBQUNBO0FBQ0E5VCxtQkFBYVIsS0FBYjtBQUNBa0csV0FBSzlCLElBQUwsQ0FBVSxRQUFWLEVBQW9CLElBQXBCO0FBQ0EsVUFBSWtELE1BQU13QixLQUFLQyxHQUFMLEVBQVY7QUFDQXNMLGVBQVNBLFVBQVUvTSxNQUFNdUMsS0FBaEIsQ0FBVDtBQUNBM0QsV0FBSzdCLE9BQUwscUJBQStCK1AsU0FBL0I7QUFDRCxLQVJEO0FBU0Q7O0FBRUQ7Ozs7O0FBS0EsV0FBU00sY0FBVCxDQUF3QkMsTUFBeEIsRUFBZ0NsTCxRQUFoQyxFQUF5QztBQUN2QyxRQUFJNkYsT0FBTyxJQUFYO0FBQUEsUUFDSXNGLFdBQVdELE9BQU9sUCxNQUR0Qjs7QUFHQSxRQUFJbVAsYUFBYSxDQUFqQixFQUFvQjtBQUNsQm5MO0FBQ0Q7O0FBRURrTCxXQUFPOVAsSUFBUCxDQUFZLFlBQVc7QUFDckIsVUFBSSxLQUFLZ1EsUUFBVCxFQUFtQjtBQUNqQkM7QUFDRCxPQUZELE1BR0ssSUFBSSxPQUFPLEtBQUtDLFlBQVosS0FBNkIsV0FBN0IsSUFBNEMsS0FBS0EsWUFBTCxHQUFvQixDQUFwRSxFQUF1RTtBQUMxRUQ7QUFDRCxPQUZJLE1BR0E7QUFDSDlSLFVBQUUsSUFBRixFQUFRbVEsR0FBUixDQUFZLE1BQVosRUFBb0IsWUFBVztBQUM3QjJCO0FBQ0QsU0FGRDtBQUdEO0FBQ0YsS0FaRDs7QUFjQSxhQUFTQSxpQkFBVCxHQUE2QjtBQUMzQkY7QUFDQSxVQUFJQSxhQUFhLENBQWpCLEVBQW9CO0FBQ2xCbkw7QUFDRDtBQUNGO0FBQ0Y7O0FBRUR2RyxhQUFXZ1IsS0FBWCxHQUFtQkEsS0FBbkI7QUFDQWhSLGFBQVd3UixjQUFYLEdBQTRCQSxjQUE1QjtBQUVDLENBbkZBLENBbUZDN0osTUFuRkQsQ0FBRDtDQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxVQUFTN0gsQ0FBVCxFQUFZOztBQUVYQSxJQUFFZ1MsU0FBRixHQUFjO0FBQ1o3UixhQUFTLE9BREc7QUFFWjhSLGFBQVMsa0JBQWtCOVMsU0FBUytTLGVBRnhCO0FBR1pDLG9CQUFnQixLQUhKO0FBSVpDLG1CQUFlLEVBSkg7QUFLWkMsbUJBQWU7QUFMSCxHQUFkOztBQVFBLE1BQU1DLFNBQU47QUFBQSxNQUNNQyxTQUROO0FBQUEsTUFFTUMsU0FGTjtBQUFBLE1BR01DLFdBSE47QUFBQSxNQUlNQyxXQUFXLEtBSmpCOztBQU1BLFdBQVNDLFVBQVQsR0FBc0I7QUFDcEI7QUFDQSxTQUFLQyxtQkFBTCxDQUF5QixXQUF6QixFQUFzQ0MsV0FBdEM7QUFDQSxTQUFLRCxtQkFBTCxDQUF5QixVQUF6QixFQUFxQ0QsVUFBckM7QUFDQUQsZUFBVyxLQUFYO0FBQ0Q7O0FBRUQsV0FBU0csV0FBVCxDQUFxQmpQLENBQXJCLEVBQXdCO0FBQ3RCLFFBQUk1RCxFQUFFZ1MsU0FBRixDQUFZRyxjQUFoQixFQUFnQztBQUFFdk8sUUFBRXVPLGNBQUY7QUFBcUI7QUFDdkQsUUFBR08sUUFBSCxFQUFhO0FBQ1gsVUFBSUksSUFBSWxQLEVBQUVtUCxPQUFGLENBQVUsQ0FBVixFQUFhQyxLQUFyQjtBQUNBLFVBQUlDLElBQUlyUCxFQUFFbVAsT0FBRixDQUFVLENBQVYsRUFBYUcsS0FBckI7QUFDQSxVQUFJQyxLQUFLYixZQUFZUSxDQUFyQjtBQUNBLFVBQUlNLEtBQUtiLFlBQVlVLENBQXJCO0FBQ0EsVUFBSUksR0FBSjtBQUNBWixvQkFBYyxJQUFJM00sSUFBSixHQUFXRSxPQUFYLEtBQXVCd00sU0FBckM7QUFDQSxVQUFHN1AsS0FBSzJRLEdBQUwsQ0FBU0gsRUFBVCxLQUFnQm5ULEVBQUVnUyxTQUFGLENBQVlJLGFBQTVCLElBQTZDSyxlQUFlelMsRUFBRWdTLFNBQUYsQ0FBWUssYUFBM0UsRUFBMEY7QUFDeEZnQixjQUFNRixLQUFLLENBQUwsR0FBUyxNQUFULEdBQWtCLE9BQXhCO0FBQ0Q7QUFDRDtBQUNBO0FBQ0E7QUFDQSxVQUFHRSxHQUFILEVBQVE7QUFDTnpQLFVBQUV1TyxjQUFGO0FBQ0FRLG1CQUFXbE4sSUFBWCxDQUFnQixJQUFoQjtBQUNBekYsVUFBRSxJQUFGLEVBQVFxQixPQUFSLENBQWdCLE9BQWhCLEVBQXlCZ1MsR0FBekIsRUFBOEJoUyxPQUE5QixXQUE4Q2dTLEdBQTlDO0FBQ0Q7QUFDRjtBQUNGOztBQUVELFdBQVNFLFlBQVQsQ0FBc0IzUCxDQUF0QixFQUF5QjtBQUN2QixRQUFJQSxFQUFFbVAsT0FBRixDQUFVdFEsTUFBVixJQUFvQixDQUF4QixFQUEyQjtBQUN6QjZQLGtCQUFZMU8sRUFBRW1QLE9BQUYsQ0FBVSxDQUFWLEVBQWFDLEtBQXpCO0FBQ0FULGtCQUFZM08sRUFBRW1QLE9BQUYsQ0FBVSxDQUFWLEVBQWFHLEtBQXpCO0FBQ0FSLGlCQUFXLElBQVg7QUFDQUYsa0JBQVksSUFBSTFNLElBQUosR0FBV0UsT0FBWCxFQUFaO0FBQ0EsV0FBSzNHLGdCQUFMLENBQXNCLFdBQXRCLEVBQW1Dd1QsV0FBbkMsRUFBZ0QsS0FBaEQ7QUFDQSxXQUFLeFQsZ0JBQUwsQ0FBc0IsVUFBdEIsRUFBa0NzVCxVQUFsQyxFQUE4QyxLQUE5QztBQUNEO0FBQ0Y7O0FBRUQsV0FBU2EsSUFBVCxHQUFnQjtBQUNkLFNBQUtuVSxnQkFBTCxJQUF5QixLQUFLQSxnQkFBTCxDQUFzQixZQUF0QixFQUFvQ2tVLFlBQXBDLEVBQWtELEtBQWxELENBQXpCO0FBQ0Q7O0FBRUQsV0FBU0UsUUFBVCxHQUFvQjtBQUNsQixTQUFLYixtQkFBTCxDQUF5QixZQUF6QixFQUF1Q1csWUFBdkM7QUFDRDs7QUFFRHZULElBQUU1QyxLQUFGLENBQVFzVyxPQUFSLENBQWdCQyxLQUFoQixHQUF3QixFQUFFQyxPQUFPSixJQUFULEVBQXhCOztBQUVBeFQsSUFBRTZCLElBQUYsQ0FBTyxDQUFDLE1BQUQsRUFBUyxJQUFULEVBQWUsTUFBZixFQUF1QixPQUF2QixDQUFQLEVBQXdDLFlBQVk7QUFDbEQ3QixNQUFFNUMsS0FBRixDQUFRc1csT0FBUixXQUF3QixJQUF4QixJQUFrQyxFQUFFRSxPQUFPLFlBQVU7QUFDbkQ1VCxVQUFFLElBQUYsRUFBUW9OLEVBQVIsQ0FBVyxPQUFYLEVBQW9CcE4sRUFBRTZULElBQXRCO0FBQ0QsT0FGaUMsRUFBbEM7QUFHRCxHQUpEO0FBS0QsQ0F4RUQsRUF3RUdoTSxNQXhFSDtBQXlFQTs7O0FBR0EsQ0FBQyxVQUFTN0gsQ0FBVCxFQUFXO0FBQ1ZBLElBQUU2RixFQUFGLENBQUtpTyxRQUFMLEdBQWdCLFlBQVU7QUFDeEIsU0FBS2pTLElBQUwsQ0FBVSxVQUFTc0IsQ0FBVCxFQUFXWSxFQUFYLEVBQWM7QUFDdEIvRCxRQUFFK0QsRUFBRixFQUFNZ0QsSUFBTixDQUFXLDJDQUFYLEVBQXVELFlBQVU7QUFDL0Q7QUFDQTtBQUNBZ04sb0JBQVkzVyxLQUFaO0FBQ0QsT0FKRDtBQUtELEtBTkQ7O0FBUUEsUUFBSTJXLGNBQWMsVUFBUzNXLEtBQVQsRUFBZTtBQUMvQixVQUFJMlYsVUFBVTNWLE1BQU00VyxjQUFwQjtBQUFBLFVBQ0lDLFFBQVFsQixRQUFRLENBQVIsQ0FEWjtBQUFBLFVBRUltQixhQUFhO0FBQ1hDLG9CQUFZLFdBREQ7QUFFWEMsbUJBQVcsV0FGQTtBQUdYQyxrQkFBVTtBQUhDLE9BRmpCO0FBQUEsVUFPSXpXLE9BQU9zVyxXQUFXOVcsTUFBTVEsSUFBakIsQ0FQWDtBQUFBLFVBUUkwVyxjQVJKOztBQVdBLFVBQUcsZ0JBQWdCcFksTUFBaEIsSUFBMEIsT0FBT0EsT0FBT3FZLFVBQWQsS0FBNkIsVUFBMUQsRUFBc0U7QUFDcEVELHlCQUFpQnBZLE9BQU9xWSxVQUFQLENBQWtCM1csSUFBbEIsRUFBd0I7QUFDdkMscUJBQVcsSUFENEI7QUFFdkMsd0JBQWMsSUFGeUI7QUFHdkMscUJBQVdxVyxNQUFNTyxPQUhzQjtBQUl2QyxxQkFBV1AsTUFBTVEsT0FKc0I7QUFLdkMscUJBQVdSLE1BQU1TLE9BTHNCO0FBTXZDLHFCQUFXVCxNQUFNVTtBQU5zQixTQUF4QixDQUFqQjtBQVFELE9BVEQsTUFTTztBQUNMTCx5QkFBaUJuVixTQUFTeVYsV0FBVCxDQUFxQixZQUFyQixDQUFqQjtBQUNBTix1QkFBZU8sY0FBZixDQUE4QmpYLElBQTlCLEVBQW9DLElBQXBDLEVBQTBDLElBQTFDLEVBQWdEMUIsTUFBaEQsRUFBd0QsQ0FBeEQsRUFBMkQrWCxNQUFNTyxPQUFqRSxFQUEwRVAsTUFBTVEsT0FBaEYsRUFBeUZSLE1BQU1TLE9BQS9GLEVBQXdHVCxNQUFNVSxPQUE5RyxFQUF1SCxLQUF2SCxFQUE4SCxLQUE5SCxFQUFxSSxLQUFySSxFQUE0SSxLQUE1SSxFQUFtSixDQUFuSixDQUFvSixRQUFwSixFQUE4SixJQUE5SjtBQUNEO0FBQ0RWLFlBQU1sVyxNQUFOLENBQWErVyxhQUFiLENBQTJCUixjQUEzQjtBQUNELEtBMUJEO0FBMkJELEdBcENEO0FBcUNELENBdENBLENBc0NDek0sTUF0Q0QsQ0FBRDs7QUF5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NDL0hBOztBQUVBLENBQUMsVUFBUzdILENBQVQsRUFBWTs7QUFFYixNQUFNK1UsbUJBQW9CLFlBQVk7QUFDcEMsUUFBSUMsV0FBVyxDQUFDLFFBQUQsRUFBVyxLQUFYLEVBQWtCLEdBQWxCLEVBQXVCLElBQXZCLEVBQTZCLEVBQTdCLENBQWY7QUFDQSxTQUFLLElBQUk3UixJQUFFLENBQVgsRUFBY0EsSUFBSTZSLFNBQVN2UyxNQUEzQixFQUFtQ1UsR0FBbkMsRUFBd0M7QUFDdEMsVUFBTzZSLFNBQVM3UixDQUFULENBQUgseUJBQW9DakgsTUFBeEMsRUFBZ0Q7QUFDOUMsZUFBT0EsT0FBVThZLFNBQVM3UixDQUFULENBQVYsc0JBQVA7QUFDRDtBQUNGO0FBQ0QsV0FBTyxLQUFQO0FBQ0QsR0FSeUIsRUFBMUI7O0FBVUEsTUFBTThSLFdBQVcsVUFBQ2xSLEVBQUQsRUFBS25HLElBQUwsRUFBYztBQUM3Qm1HLE9BQUczQyxJQUFILENBQVF4RCxJQUFSLEVBQWMrRixLQUFkLENBQW9CLEdBQXBCLEVBQXlCekIsT0FBekIsQ0FBaUMsY0FBTTtBQUNyQ2xDLGNBQU0yTixFQUFOLEVBQWEvUCxTQUFTLE9BQVQsR0FBbUIsU0FBbkIsR0FBK0IsZ0JBQTVDLEVBQWlFQSxJQUFqRSxrQkFBb0YsQ0FBQ21HLEVBQUQsQ0FBcEY7QUFDRCxLQUZEO0FBR0QsR0FKRDtBQUtBO0FBQ0EvRCxJQUFFYixRQUFGLEVBQVlpTyxFQUFaLENBQWUsa0JBQWYsRUFBbUMsYUFBbkMsRUFBa0QsWUFBVztBQUMzRDZILGFBQVNqVixFQUFFLElBQUYsQ0FBVCxFQUFrQixNQUFsQjtBQUNELEdBRkQ7O0FBSUE7QUFDQTtBQUNBQSxJQUFFYixRQUFGLEVBQVlpTyxFQUFaLENBQWUsa0JBQWYsRUFBbUMsY0FBbkMsRUFBbUQsWUFBVztBQUM1RCxRQUFJTyxLQUFLM04sRUFBRSxJQUFGLEVBQVFvQixJQUFSLENBQWEsT0FBYixDQUFUO0FBQ0EsUUFBSXVNLEVBQUosRUFBUTtBQUNOc0gsZUFBU2pWLEVBQUUsSUFBRixDQUFULEVBQWtCLE9BQWxCO0FBQ0QsS0FGRCxNQUdLO0FBQ0hBLFFBQUUsSUFBRixFQUFRcUIsT0FBUixDQUFnQixrQkFBaEI7QUFDRDtBQUNGLEdBUkQ7O0FBVUE7QUFDQXJCLElBQUViLFFBQUYsRUFBWWlPLEVBQVosQ0FBZSxrQkFBZixFQUFtQyxlQUFuQyxFQUFvRCxZQUFXO0FBQzdENkgsYUFBU2pWLEVBQUUsSUFBRixDQUFULEVBQWtCLFFBQWxCO0FBQ0QsR0FGRDs7QUFJQTtBQUNBQSxJQUFFYixRQUFGLEVBQVlpTyxFQUFaLENBQWUsa0JBQWYsRUFBbUMsaUJBQW5DLEVBQXNELFVBQVN4SixDQUFULEVBQVc7QUFDL0RBLE1BQUVzUixlQUFGO0FBQ0EsUUFBSWpHLFlBQVlqUCxFQUFFLElBQUYsRUFBUW9CLElBQVIsQ0FBYSxVQUFiLENBQWhCOztBQUVBLFFBQUc2TixjQUFjLEVBQWpCLEVBQW9CO0FBQ2xCL08saUJBQVc2TyxNQUFYLENBQWtCSyxVQUFsQixDQUE2QnBQLEVBQUUsSUFBRixDQUE3QixFQUFzQ2lQLFNBQXRDLEVBQWlELFlBQVc7QUFDMURqUCxVQUFFLElBQUYsRUFBUXFCLE9BQVIsQ0FBZ0IsV0FBaEI7QUFDRCxPQUZEO0FBR0QsS0FKRCxNQUlLO0FBQ0hyQixRQUFFLElBQUYsRUFBUW1WLE9BQVIsR0FBa0I5VCxPQUFsQixDQUEwQixXQUExQjtBQUNEO0FBQ0YsR0FYRDs7QUFhQXJCLElBQUViLFFBQUYsRUFBWWlPLEVBQVosQ0FBZSxrQ0FBZixFQUFtRCxxQkFBbkQsRUFBMEUsWUFBVztBQUNuRixRQUFJTyxLQUFLM04sRUFBRSxJQUFGLEVBQVFvQixJQUFSLENBQWEsY0FBYixDQUFUO0FBQ0FwQixZQUFNMk4sRUFBTixFQUFZbEosY0FBWixDQUEyQixtQkFBM0IsRUFBZ0QsQ0FBQ3pFLEVBQUUsSUFBRixDQUFELENBQWhEO0FBQ0QsR0FIRDs7QUFLQTs7Ozs7QUFLQUEsSUFBRTlELE1BQUYsRUFBVWtaLElBQVYsQ0FBZSxZQUFNO0FBQ25CQztBQUNELEdBRkQ7O0FBSUEsV0FBU0EsY0FBVCxHQUEwQjtBQUN4QkM7QUFDQUM7QUFDQUM7QUFDQUM7QUFDRDs7QUFFRDtBQUNBLFdBQVNBLGVBQVQsQ0FBeUIxVSxVQUF6QixFQUFxQztBQUNuQyxRQUFJMlUsWUFBWTFWLEVBQUUsaUJBQUYsQ0FBaEI7QUFBQSxRQUNJMlYsWUFBWSxDQUFDLFVBQUQsRUFBYSxTQUFiLEVBQXdCLFFBQXhCLENBRGhCOztBQUdBLFFBQUc1VSxVQUFILEVBQWM7QUFDWixVQUFHLE9BQU9BLFVBQVAsS0FBc0IsUUFBekIsRUFBa0M7QUFDaEM0VSxrQkFBVWhYLElBQVYsQ0FBZW9DLFVBQWY7QUFDRCxPQUZELE1BRU0sSUFBRyxPQUFPQSxVQUFQLEtBQXNCLFFBQXRCLElBQWtDLE9BQU9BLFdBQVcsQ0FBWCxDQUFQLEtBQXlCLFFBQTlELEVBQXVFO0FBQzNFNFUsa0JBQVV0TyxNQUFWLENBQWlCdEcsVUFBakI7QUFDRCxPQUZLLE1BRUQ7QUFDSHdCLGdCQUFRQyxLQUFSLENBQWMsOEJBQWQ7QUFDRDtBQUNGO0FBQ0QsUUFBR2tULFVBQVVqVCxNQUFiLEVBQW9CO0FBQ2xCLFVBQUltVCxZQUFZRCxVQUFVN1IsR0FBVixDQUFjLFVBQUNyRCxJQUFELEVBQVU7QUFDdEMsK0JBQXFCQSxJQUFyQjtBQUNELE9BRmUsRUFFYm9WLElBRmEsQ0FFUixHQUZRLENBQWhCOztBQUlBN1YsUUFBRTlELE1BQUYsRUFBVTRaLEdBQVYsQ0FBY0YsU0FBZCxFQUF5QnhJLEVBQXpCLENBQTRCd0ksU0FBNUIsRUFBdUMsVUFBU2hTLENBQVQsRUFBWW1TLFFBQVosRUFBcUI7QUFDMUQsWUFBSXZWLFNBQVNvRCxFQUFFbEIsU0FBRixDQUFZaUIsS0FBWixDQUFrQixHQUFsQixFQUF1QixDQUF2QixDQUFiO0FBQ0EsWUFBSWhDLFVBQVUzQixhQUFXUSxNQUFYLFFBQXNCd1YsR0FBdEIsc0JBQTZDRCxRQUE3QyxRQUFkOztBQUVBcFUsZ0JBQVFFLElBQVIsQ0FBYSxZQUFVO0FBQ3JCLGNBQUlFLFFBQVEvQixFQUFFLElBQUYsQ0FBWjs7QUFFQStCLGdCQUFNMEMsY0FBTixDQUFxQixrQkFBckIsRUFBeUMsQ0FBQzFDLEtBQUQsQ0FBekM7QUFDRCxTQUpEO0FBS0QsT0FURDtBQVVEO0FBQ0Y7O0FBRUQsV0FBU3dULGNBQVQsQ0FBd0JVLFFBQXhCLEVBQWlDO0FBQy9CLFFBQUlqWixjQUFKO0FBQUEsUUFDSWtaLFNBQVNsVyxFQUFFLGVBQUYsQ0FEYjtBQUVBLFFBQUdrVyxPQUFPelQsTUFBVixFQUFpQjtBQUNmekMsUUFBRTlELE1BQUYsRUFBVTRaLEdBQVYsQ0FBYyxtQkFBZCxFQUNDMUksRUFERCxDQUNJLG1CQURKLEVBQ3lCLFVBQVN4SixDQUFULEVBQVk7QUFDbkMsWUFBSTVHLEtBQUosRUFBVztBQUFFUSx1QkFBYVIsS0FBYjtBQUFzQjs7QUFFbkNBLGdCQUFRSyxXQUFXLFlBQVU7O0FBRTNCLGNBQUcsQ0FBQzBYLGdCQUFKLEVBQXFCO0FBQUM7QUFDcEJtQixtQkFBT3JVLElBQVAsQ0FBWSxZQUFVO0FBQ3BCN0IsZ0JBQUUsSUFBRixFQUFReUUsY0FBUixDQUF1QixxQkFBdkI7QUFDRCxhQUZEO0FBR0Q7QUFDRDtBQUNBeVIsaUJBQU8zVixJQUFQLENBQVksYUFBWixFQUEyQixRQUEzQjtBQUNELFNBVE8sRUFTTDBWLFlBQVksRUFUUCxDQUFSLENBSG1DLENBWWhCO0FBQ3BCLE9BZEQ7QUFlRDtBQUNGOztBQUVELFdBQVNULGNBQVQsQ0FBd0JTLFFBQXhCLEVBQWlDO0FBQy9CLFFBQUlqWixjQUFKO0FBQUEsUUFDSWtaLFNBQVNsVyxFQUFFLGVBQUYsQ0FEYjtBQUVBLFFBQUdrVyxPQUFPelQsTUFBVixFQUFpQjtBQUNmekMsUUFBRTlELE1BQUYsRUFBVTRaLEdBQVYsQ0FBYyxtQkFBZCxFQUNDMUksRUFERCxDQUNJLG1CQURKLEVBQ3lCLFVBQVN4SixDQUFULEVBQVc7QUFDbEMsWUFBRzVHLEtBQUgsRUFBUztBQUFFUSx1QkFBYVIsS0FBYjtBQUFzQjs7QUFFakNBLGdCQUFRSyxXQUFXLFlBQVU7O0FBRTNCLGNBQUcsQ0FBQzBYLGdCQUFKLEVBQXFCO0FBQUM7QUFDcEJtQixtQkFBT3JVLElBQVAsQ0FBWSxZQUFVO0FBQ3BCN0IsZ0JBQUUsSUFBRixFQUFReUUsY0FBUixDQUF1QixxQkFBdkI7QUFDRCxhQUZEO0FBR0Q7QUFDRDtBQUNBeVIsaUJBQU8zVixJQUFQLENBQVksYUFBWixFQUEyQixRQUEzQjtBQUNELFNBVE8sRUFTTDBWLFlBQVksRUFUUCxDQUFSLENBSGtDLENBWWY7QUFDcEIsT0FkRDtBQWVEO0FBQ0Y7O0FBRUQsV0FBU1gsY0FBVCxHQUEwQjtBQUN4QixRQUFHLENBQUNQLGdCQUFKLEVBQXFCO0FBQUUsYUFBTyxLQUFQO0FBQWU7QUFDdEMsUUFBSW9CLFFBQVFoWCxTQUFTaVgsZ0JBQVQsQ0FBMEIsNkNBQTFCLENBQVo7O0FBRUE7QUFDQSxRQUFJQyw0QkFBNEIsVUFBU0MsbUJBQVQsRUFBOEI7QUFDNUQsVUFBSUMsVUFBVXZXLEVBQUVzVyxvQkFBb0IsQ0FBcEIsRUFBdUJ2WSxNQUF6QixDQUFkO0FBQ0E7QUFDQSxjQUFRd1ksUUFBUWhXLElBQVIsQ0FBYSxhQUFiLENBQVI7O0FBRUUsYUFBSyxRQUFMO0FBQ0FnVyxrQkFBUTlSLGNBQVIsQ0FBdUIscUJBQXZCLEVBQThDLENBQUM4UixPQUFELENBQTlDO0FBQ0E7O0FBRUEsYUFBSyxRQUFMO0FBQ0FBLGtCQUFROVIsY0FBUixDQUF1QixxQkFBdkIsRUFBOEMsQ0FBQzhSLE9BQUQsRUFBVXJhLE9BQU9zTixXQUFqQixDQUE5QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGlCQUFPLEtBQVA7QUFDQTtBQXRCRjtBQXdCRCxLQTNCRDs7QUE2QkEsUUFBRzJNLE1BQU0xVCxNQUFULEVBQWdCO0FBQ2Q7QUFDQSxXQUFLLElBQUlVLElBQUksQ0FBYixFQUFnQkEsS0FBS2dULE1BQU0xVCxNQUFOLEdBQWEsQ0FBbEMsRUFBcUNVLEdBQXJDLEVBQTBDO0FBQ3hDLFlBQUlxVCxrQkFBa0IsSUFBSXpCLGdCQUFKLENBQXFCc0IseUJBQXJCLENBQXRCO0FBQ0FHLHdCQUFnQkMsT0FBaEIsQ0FBd0JOLE1BQU1oVCxDQUFOLENBQXhCLEVBQWtDLEVBQUV1VCxZQUFZLElBQWQsRUFBb0JDLFdBQVcsS0FBL0IsRUFBc0NDLGVBQWUsS0FBckQsRUFBNERDLFNBQVEsS0FBcEUsRUFBMkVDLGlCQUFnQixDQUFDLGFBQUQsQ0FBM0YsRUFBbEM7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQ7O0FBRUE7QUFDQTtBQUNBNVcsYUFBVzZXLFFBQVgsR0FBc0IxQixjQUF0QjtBQUNBO0FBQ0E7QUFFQyxDQXpNQSxDQXlNQ3hOLE1Bek1ELENBQUQ7O0FBMk1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0NDOU9BOzs7Ozs7QUFFQSxDQUFDLFVBQVM3SCxDQUFULEVBQVk7O0FBRWI7Ozs7O0FBRmEsTUFPUGdYLEtBUE87QUFRWDs7Ozs7OztBQU9BLG1CQUFZOU8sT0FBWixFQUFtQztBQUFBLFVBQWRpSixPQUFjLHVFQUFKLEVBQUk7O0FBQUE7O0FBQ2pDLFdBQUtoUSxRQUFMLEdBQWdCK0csT0FBaEI7QUFDQSxXQUFLaUosT0FBTCxHQUFnQm5SLEVBQUVxTCxNQUFGLENBQVMsRUFBVCxFQUFhMkwsTUFBTUMsUUFBbkIsRUFBNkIsS0FBSzlWLFFBQUwsQ0FBY0MsSUFBZCxFQUE3QixFQUFtRCtQLE9BQW5ELENBQWhCOztBQUVBLFdBQUtyUCxLQUFMOztBQUVBNUIsaUJBQVdZLGNBQVgsQ0FBMEIsSUFBMUIsRUFBZ0MsT0FBaEM7QUFDRDs7QUFFRDs7Ozs7O0FBeEJXO0FBQUE7QUFBQSw4QkE0Qkg7QUFDTixhQUFLb1csT0FBTCxHQUFlLEtBQUsvVixRQUFMLENBQWNrQyxJQUFkLENBQW1CLHlCQUFuQixFQUE4QzJTLEdBQTlDLENBQWtELHFCQUFsRCxDQUFmOztBQUVBLGFBQUttQixPQUFMO0FBQ0Q7O0FBRUQ7Ozs7O0FBbENXO0FBQUE7QUFBQSxnQ0FzQ0Q7QUFBQTs7QUFDUixhQUFLaFcsUUFBTCxDQUFjMlUsR0FBZCxDQUFrQixRQUFsQixFQUNHMUksRUFESCxDQUNNLGdCQUROLEVBQ3dCLFlBQU07QUFDMUIsaUJBQUtnSyxTQUFMO0FBQ0QsU0FISCxFQUlHaEssRUFKSCxDQUlNLGlCQUpOLEVBSXlCLFlBQU07QUFDM0IsaUJBQU8sT0FBS2lLLFlBQUwsRUFBUDtBQUNELFNBTkg7O0FBUUEsWUFBSSxLQUFLbEcsT0FBTCxDQUFhbUcsVUFBYixLQUE0QixhQUFoQyxFQUErQztBQUM3QyxlQUFLSixPQUFMLENBQ0dwQixHQURILENBQ08saUJBRFAsRUFFRzFJLEVBRkgsQ0FFTSxpQkFGTixFQUV5QixVQUFDeEosQ0FBRCxFQUFPO0FBQzVCLG1CQUFLMlQsYUFBTCxDQUFtQnZYLEVBQUU0RCxFQUFFN0YsTUFBSixDQUFuQjtBQUNELFdBSkg7QUFLRDs7QUFFRCxZQUFJLEtBQUtvVCxPQUFMLENBQWFxRyxZQUFqQixFQUErQjtBQUM3QixlQUFLTixPQUFMLENBQ0dwQixHQURILENBQ08sZ0JBRFAsRUFFRzFJLEVBRkgsQ0FFTSxnQkFGTixFQUV3QixVQUFDeEosQ0FBRCxFQUFPO0FBQzNCLG1CQUFLMlQsYUFBTCxDQUFtQnZYLEVBQUU0RCxFQUFFN0YsTUFBSixDQUFuQjtBQUNELFdBSkg7QUFLRDtBQUNGOztBQUVEOzs7OztBQWhFVztBQUFBO0FBQUEsZ0NBb0VEO0FBQ1IsYUFBSytELEtBQUw7QUFDRDs7QUFFRDs7Ozs7O0FBeEVXO0FBQUE7QUFBQSxvQ0E2RUd5QixHQTdFSCxFQTZFUTtBQUNqQixZQUFJLENBQUNBLElBQUloRCxJQUFKLENBQVMsVUFBVCxDQUFMLEVBQTJCLE9BQU8sSUFBUDs7QUFFM0IsWUFBSWtYLFNBQVMsSUFBYjs7QUFFQSxnQkFBUWxVLElBQUksQ0FBSixFQUFPM0YsSUFBZjtBQUNFLGVBQUssUUFBTDtBQUNBLGVBQUssWUFBTDtBQUNBLGVBQUssaUJBQUw7QUFDRSxnQkFBSWlHLE1BQU1OLElBQUlGLElBQUosQ0FBUyxpQkFBVCxDQUFWO0FBQ0EsZ0JBQUksQ0FBQ1EsSUFBSXBCLE1BQUwsSUFBZSxDQUFDb0IsSUFBSTRLLEdBQUosRUFBcEIsRUFBK0JnSixTQUFTLEtBQVQ7QUFDL0I7O0FBRUY7QUFDRSxnQkFBRyxDQUFDbFUsSUFBSWtMLEdBQUosRUFBRCxJQUFjLENBQUNsTCxJQUFJa0wsR0FBSixHQUFVaE0sTUFBNUIsRUFBb0NnVixTQUFTLEtBQVQ7QUFUeEM7O0FBWUEsZUFBT0EsTUFBUDtBQUNEOztBQUVEOzs7Ozs7Ozs7OztBQWpHVztBQUFBO0FBQUEsb0NBMkdHbFUsR0EzR0gsRUEyR1E7QUFDakIsWUFBSW1VLFNBQVNuVSxJQUFJb1UsUUFBSixDQUFhLEtBQUt4RyxPQUFMLENBQWF5RyxpQkFBMUIsQ0FBYjs7QUFFQSxZQUFJLENBQUNGLE9BQU9qVixNQUFaLEVBQW9CO0FBQ2xCaVYsbUJBQVNuVSxJQUFJNEUsTUFBSixHQUFhOUUsSUFBYixDQUFrQixLQUFLOE4sT0FBTCxDQUFheUcsaUJBQS9CLENBQVQ7QUFDRDs7QUFFRCxlQUFPRixNQUFQO0FBQ0Q7O0FBRUQ7Ozs7Ozs7OztBQXJIVztBQUFBO0FBQUEsZ0NBNkhEblUsR0E3SEMsRUE2SEk7QUFDYixZQUFJb0ssS0FBS3BLLElBQUksQ0FBSixFQUFPb0ssRUFBaEI7QUFDQSxZQUFJa0ssU0FBUyxLQUFLMVcsUUFBTCxDQUFja0MsSUFBZCxpQkFBaUNzSyxFQUFqQyxRQUFiOztBQUVBLFlBQUksQ0FBQ2tLLE9BQU9wVixNQUFaLEVBQW9CO0FBQ2xCLGlCQUFPYyxJQUFJdVUsT0FBSixDQUFZLE9BQVosQ0FBUDtBQUNEOztBQUVELGVBQU9ELE1BQVA7QUFDRDs7QUFFRDs7Ozs7Ozs7O0FBeElXO0FBQUE7QUFBQSxzQ0FnSktFLElBaEpMLEVBZ0pXO0FBQUE7O0FBQ3BCLFlBQUlDLFNBQVNELEtBQUtqVSxHQUFMLENBQVMsVUFBQ1gsQ0FBRCxFQUFJWSxFQUFKLEVBQVc7QUFDL0IsY0FBSTRKLEtBQUs1SixHQUFHNEosRUFBWjtBQUNBLGNBQUlrSyxTQUFTLE9BQUsxVyxRQUFMLENBQWNrQyxJQUFkLGlCQUFpQ3NLLEVBQWpDLFFBQWI7O0FBRUEsY0FBSSxDQUFDa0ssT0FBT3BWLE1BQVosRUFBb0I7QUFDbEJvVixxQkFBUzdYLEVBQUUrRCxFQUFGLEVBQU0rVCxPQUFOLENBQWMsT0FBZCxDQUFUO0FBQ0Q7QUFDRCxpQkFBT0QsT0FBTyxDQUFQLENBQVA7QUFDRCxTQVJZLENBQWI7O0FBVUEsZUFBTzdYLEVBQUVnWSxNQUFGLENBQVA7QUFDRDs7QUFFRDs7Ozs7QUE5Slc7QUFBQTtBQUFBLHNDQWtLS3pVLEdBbEtMLEVBa0tVO0FBQ25CLFlBQUlzVSxTQUFTLEtBQUtJLFNBQUwsQ0FBZTFVLEdBQWYsQ0FBYjtBQUNBLFlBQUkyVSxhQUFhLEtBQUtDLGFBQUwsQ0FBbUI1VSxHQUFuQixDQUFqQjs7QUFFQSxZQUFJc1UsT0FBT3BWLE1BQVgsRUFBbUI7QUFDakJvVixpQkFBTzdILFFBQVAsQ0FBZ0IsS0FBS21CLE9BQUwsQ0FBYWlILGVBQTdCO0FBQ0Q7O0FBRUQsWUFBSUYsV0FBV3pWLE1BQWYsRUFBdUI7QUFDckJ5VixxQkFBV2xJLFFBQVgsQ0FBb0IsS0FBS21CLE9BQUwsQ0FBYWtILGNBQWpDO0FBQ0Q7O0FBRUQ5VSxZQUFJeU0sUUFBSixDQUFhLEtBQUttQixPQUFMLENBQWFtSCxlQUExQixFQUEyQy9YLElBQTNDLENBQWdELGNBQWhELEVBQWdFLEVBQWhFO0FBQ0Q7O0FBRUQ7Ozs7OztBQWpMVztBQUFBO0FBQUEsOENBdUxhZ1ksU0F2TGIsRUF1THdCO0FBQ2pDLFlBQUlSLE9BQU8sS0FBSzVXLFFBQUwsQ0FBY2tDLElBQWQsbUJBQW1Da1YsU0FBbkMsUUFBWDtBQUNBLFlBQUlDLFVBQVUsS0FBS0MsZUFBTCxDQUFxQlYsSUFBckIsQ0FBZDtBQUNBLFlBQUlXLGNBQWMsS0FBS1AsYUFBTCxDQUFtQkosSUFBbkIsQ0FBbEI7O0FBRUEsWUFBSVMsUUFBUS9WLE1BQVosRUFBb0I7QUFDbEIrVixrQkFBUWpULFdBQVIsQ0FBb0IsS0FBSzRMLE9BQUwsQ0FBYWlILGVBQWpDO0FBQ0Q7O0FBRUQsWUFBSU0sWUFBWWpXLE1BQWhCLEVBQXdCO0FBQ3RCaVcsc0JBQVluVCxXQUFaLENBQXdCLEtBQUs0TCxPQUFMLENBQWFrSCxjQUFyQztBQUNEOztBQUVETixhQUFLeFMsV0FBTCxDQUFpQixLQUFLNEwsT0FBTCxDQUFhbUgsZUFBOUIsRUFBK0MvVyxVQUEvQyxDQUEwRCxjQUExRDtBQUVEOztBQUVEOzs7OztBQXhNVztBQUFBO0FBQUEseUNBNE1RZ0MsR0E1TVIsRUE0TWE7QUFDdEI7QUFDQSxZQUFHQSxJQUFJLENBQUosRUFBTzNGLElBQVAsSUFBZSxPQUFsQixFQUEyQjtBQUN6QixpQkFBTyxLQUFLK2EsdUJBQUwsQ0FBNkJwVixJQUFJaEQsSUFBSixDQUFTLE1BQVQsQ0FBN0IsQ0FBUDtBQUNEOztBQUVELFlBQUlzWCxTQUFTLEtBQUtJLFNBQUwsQ0FBZTFVLEdBQWYsQ0FBYjtBQUNBLFlBQUkyVSxhQUFhLEtBQUtDLGFBQUwsQ0FBbUI1VSxHQUFuQixDQUFqQjs7QUFFQSxZQUFJc1UsT0FBT3BWLE1BQVgsRUFBbUI7QUFDakJvVixpQkFBT3RTLFdBQVAsQ0FBbUIsS0FBSzRMLE9BQUwsQ0FBYWlILGVBQWhDO0FBQ0Q7O0FBRUQsWUFBSUYsV0FBV3pWLE1BQWYsRUFBdUI7QUFDckJ5VixxQkFBVzNTLFdBQVgsQ0FBdUIsS0FBSzRMLE9BQUwsQ0FBYWtILGNBQXBDO0FBQ0Q7O0FBRUQ5VSxZQUFJZ0MsV0FBSixDQUFnQixLQUFLNEwsT0FBTCxDQUFhbUgsZUFBN0IsRUFBOEMvVyxVQUE5QyxDQUF5RCxjQUF6RDtBQUNEOztBQUVEOzs7Ozs7OztBQWhPVztBQUFBO0FBQUEsb0NBdU9HZ0MsR0F2T0gsRUF1T1E7QUFDakIsWUFBSXFWLGVBQWUsS0FBS0MsYUFBTCxDQUFtQnRWLEdBQW5CLENBQW5CO0FBQUEsWUFDSXVWLFlBQVksS0FEaEI7QUFBQSxZQUVJQyxrQkFBa0IsSUFGdEI7QUFBQSxZQUdJQyxZQUFZelYsSUFBSWhELElBQUosQ0FBUyxnQkFBVCxDQUhoQjtBQUFBLFlBSUkwWSxVQUFVLElBSmQ7O0FBTUEsZ0JBQVExVixJQUFJLENBQUosRUFBTzNGLElBQWY7QUFDRSxlQUFLLE9BQUw7QUFDRWtiLHdCQUFZLEtBQUtJLGFBQUwsQ0FBbUIzVixJQUFJaEQsSUFBSixDQUFTLE1BQVQsQ0FBbkIsQ0FBWjtBQUNBOztBQUVGLGVBQUssVUFBTDtBQUNFdVksd0JBQVlGLFlBQVo7QUFDQTs7QUFFRixlQUFLLFFBQUw7QUFDQSxlQUFLLFlBQUw7QUFDQSxlQUFLLGlCQUFMO0FBQ0VFLHdCQUFZRixZQUFaO0FBQ0E7O0FBRUY7QUFDRUUsd0JBQVksS0FBS0ssWUFBTCxDQUFrQjVWLEdBQWxCLENBQVo7QUFoQko7O0FBbUJBLFlBQUl5VixTQUFKLEVBQWU7QUFDYkQsNEJBQWtCLEtBQUtLLGVBQUwsQ0FBcUI3VixHQUFyQixFQUEwQnlWLFNBQTFCLEVBQXFDelYsSUFBSWhELElBQUosQ0FBUyxVQUFULENBQXJDLENBQWxCO0FBQ0Q7O0FBRUQsWUFBSWdELElBQUloRCxJQUFKLENBQVMsY0FBVCxDQUFKLEVBQThCO0FBQzVCMFksb0JBQVUsS0FBSzlILE9BQUwsQ0FBYWtJLFVBQWIsQ0FBd0JKLE9BQXhCLENBQWdDMVYsR0FBaEMsQ0FBVjtBQUNEOztBQUdELFlBQUkrVixXQUFXLENBQUNWLFlBQUQsRUFBZUUsU0FBZixFQUEwQkMsZUFBMUIsRUFBMkNFLE9BQTNDLEVBQW9EM2EsT0FBcEQsQ0FBNEQsS0FBNUQsTUFBdUUsQ0FBQyxDQUF2RjtBQUNBLFlBQUlpYixVQUFVLENBQUNELFdBQVcsT0FBWCxHQUFxQixTQUF0QixJQUFtQyxXQUFqRDs7QUFFQSxhQUFLQSxXQUFXLG9CQUFYLEdBQWtDLGlCQUF2QyxFQUEwRC9WLEdBQTFEOztBQUVBOzs7Ozs7QUFNQUEsWUFBSWxDLE9BQUosQ0FBWWtZLE9BQVosRUFBcUIsQ0FBQ2hXLEdBQUQsQ0FBckI7O0FBRUEsZUFBTytWLFFBQVA7QUFDRDs7QUFFRDs7Ozs7OztBQTFSVztBQUFBO0FBQUEscUNBZ1NJO0FBQ2IsWUFBSUUsTUFBTSxFQUFWO0FBQ0EsWUFBSXpYLFFBQVEsSUFBWjs7QUFFQSxhQUFLbVYsT0FBTCxDQUFhclYsSUFBYixDQUFrQixZQUFXO0FBQzNCMlgsY0FBSTdhLElBQUosQ0FBU29ELE1BQU13VixhQUFOLENBQW9CdlgsRUFBRSxJQUFGLENBQXBCLENBQVQ7QUFDRCxTQUZEOztBQUlBLFlBQUl5WixVQUFVRCxJQUFJbGIsT0FBSixDQUFZLEtBQVosTUFBdUIsQ0FBQyxDQUF0Qzs7QUFFQSxhQUFLNkMsUUFBTCxDQUFja0MsSUFBZCxDQUFtQixvQkFBbkIsRUFBeUNtSixHQUF6QyxDQUE2QyxTQUE3QyxFQUF5RGlOLFVBQVUsTUFBVixHQUFtQixPQUE1RTs7QUFFQTs7Ozs7O0FBTUEsYUFBS3RZLFFBQUwsQ0FBY0UsT0FBZCxDQUFzQixDQUFDb1ksVUFBVSxXQUFWLEdBQXdCLGFBQXpCLElBQTBDLFdBQWhFLEVBQTZFLENBQUMsS0FBS3RZLFFBQU4sQ0FBN0U7O0FBRUEsZUFBT3NZLE9BQVA7QUFDRDs7QUFFRDs7Ozs7OztBQXZUVztBQUFBO0FBQUEsbUNBNlRFbFcsR0E3VEYsRUE2VE9tVyxPQTdUUCxFQTZUZ0I7QUFDekI7QUFDQUEsa0JBQVdBLFdBQVduVyxJQUFJaEQsSUFBSixDQUFTLFNBQVQsQ0FBWCxJQUFrQ2dELElBQUloRCxJQUFKLENBQVMsTUFBVCxDQUE3QztBQUNBLFlBQUlvWixZQUFZcFcsSUFBSWtMLEdBQUosRUFBaEI7QUFDQSxZQUFJbUwsUUFBUSxLQUFaOztBQUVBLFlBQUlELFVBQVVsWCxNQUFkLEVBQXNCO0FBQ3BCO0FBQ0EsY0FBSSxLQUFLME8sT0FBTCxDQUFhMEksUUFBYixDQUFzQmxMLGNBQXRCLENBQXFDK0ssT0FBckMsQ0FBSixFQUFtRDtBQUNqREUsb0JBQVEsS0FBS3pJLE9BQUwsQ0FBYTBJLFFBQWIsQ0FBc0JILE9BQXRCLEVBQStCclQsSUFBL0IsQ0FBb0NzVCxTQUFwQyxDQUFSO0FBQ0Q7QUFDRDtBQUhBLGVBSUssSUFBSUQsWUFBWW5XLElBQUloRCxJQUFKLENBQVMsTUFBVCxDQUFoQixFQUFrQztBQUNyQ3FaLHNCQUFRLElBQUlFLE1BQUosQ0FBV0osT0FBWCxFQUFvQnJULElBQXBCLENBQXlCc1QsU0FBekIsQ0FBUjtBQUNELGFBRkksTUFHQTtBQUNIQyxzQkFBUSxJQUFSO0FBQ0Q7QUFDRjtBQUNEO0FBYkEsYUFjSyxJQUFJLENBQUNyVyxJQUFJOUIsSUFBSixDQUFTLFVBQVQsQ0FBTCxFQUEyQjtBQUM5Qm1ZLG9CQUFRLElBQVI7QUFDRDs7QUFFRCxlQUFPQSxLQUFQO0FBQ0E7O0FBRUY7Ozs7OztBQXhWVztBQUFBO0FBQUEsb0NBNlZHckIsU0E3VkgsRUE2VmM7QUFDdkI7QUFDQTtBQUNBLFlBQUl3QixTQUFTLEtBQUs1WSxRQUFMLENBQWNrQyxJQUFkLG1CQUFtQ2tWLFNBQW5DLFFBQWI7QUFDQSxZQUFJcUIsUUFBUSxLQUFaOztBQUVBO0FBQ0EsWUFBSUcsT0FBT3haLElBQVAsQ0FBWSxVQUFaLE1BQTRCZCxTQUFoQyxFQUEyQztBQUN6Q21hLGtCQUFRLElBQVI7QUFDRDs7QUFFRDtBQUNBRyxlQUFPbFksSUFBUCxDQUFZLFVBQUNzQixDQUFELEVBQUlTLENBQUosRUFBVTtBQUNwQixjQUFJNUQsRUFBRTRELENBQUYsRUFBS25DLElBQUwsQ0FBVSxTQUFWLENBQUosRUFBMEI7QUFDeEJtWSxvQkFBUSxJQUFSO0FBQ0Q7QUFDRixTQUpEOztBQU1BLGVBQU9BLEtBQVA7QUFDRDs7QUFFRDs7Ozs7Ozs7QUFsWFc7QUFBQTtBQUFBLHNDQXlYS3JXLEdBelhMLEVBeVhVOFYsVUF6WFYsRUF5WHNCVyxRQXpYdEIsRUF5WGdDO0FBQUE7O0FBQ3pDQSxtQkFBV0EsV0FBVyxJQUFYLEdBQWtCLEtBQTdCOztBQUVBLFlBQUlDLFFBQVFaLFdBQVcxVixLQUFYLENBQWlCLEdBQWpCLEVBQXNCRyxHQUF0QixDQUEwQixVQUFDb1csQ0FBRCxFQUFPO0FBQzNDLGlCQUFPLE9BQUsvSSxPQUFMLENBQWFrSSxVQUFiLENBQXdCYSxDQUF4QixFQUEyQjNXLEdBQTNCLEVBQWdDeVcsUUFBaEMsRUFBMEN6VyxJQUFJNEUsTUFBSixFQUExQyxDQUFQO0FBQ0QsU0FGVyxDQUFaO0FBR0EsZUFBTzhSLE1BQU0zYixPQUFOLENBQWMsS0FBZCxNQUF5QixDQUFDLENBQWpDO0FBQ0Q7O0FBRUQ7Ozs7O0FBbFlXO0FBQUE7QUFBQSxrQ0FzWUM7QUFDVixZQUFJNmIsUUFBUSxLQUFLaFosUUFBakI7QUFBQSxZQUNJcUMsT0FBTyxLQUFLMk4sT0FEaEI7O0FBR0FuUixnQkFBTXdELEtBQUs0VSxlQUFYLEVBQThCK0IsS0FBOUIsRUFBcUNuRSxHQUFyQyxDQUF5QyxPQUF6QyxFQUFrRHpRLFdBQWxELENBQThEL0IsS0FBSzRVLGVBQW5FO0FBQ0FwWSxnQkFBTXdELEtBQUs4VSxlQUFYLEVBQThCNkIsS0FBOUIsRUFBcUNuRSxHQUFyQyxDQUF5QyxPQUF6QyxFQUFrRHpRLFdBQWxELENBQThEL0IsS0FBSzhVLGVBQW5FO0FBQ0F0WSxVQUFLd0QsS0FBS29VLGlCQUFWLFNBQStCcFUsS0FBSzZVLGNBQXBDLEVBQXNEOVMsV0FBdEQsQ0FBa0UvQixLQUFLNlUsY0FBdkU7QUFDQThCLGNBQU05VyxJQUFOLENBQVcsb0JBQVgsRUFBaUNtSixHQUFqQyxDQUFxQyxTQUFyQyxFQUFnRCxNQUFoRDtBQUNBeE0sVUFBRSxRQUFGLEVBQVltYSxLQUFaLEVBQW1CbkUsR0FBbkIsQ0FBdUIsd0RBQXZCLEVBQWlGdkgsR0FBakYsQ0FBcUYsRUFBckYsRUFBeUZsTixVQUF6RixDQUFvRyxjQUFwRztBQUNBOzs7O0FBSUE0WSxjQUFNOVksT0FBTixDQUFjLG9CQUFkLEVBQW9DLENBQUM4WSxLQUFELENBQXBDO0FBQ0Q7O0FBRUQ7Ozs7O0FBdFpXO0FBQUE7QUFBQSxnQ0EwWkQ7QUFDUixZQUFJcFksUUFBUSxJQUFaO0FBQ0EsYUFBS1osUUFBTCxDQUNHMlUsR0FESCxDQUNPLFFBRFAsRUFFR3pTLElBRkgsQ0FFUSxvQkFGUixFQUdLbUosR0FITCxDQUdTLFNBSFQsRUFHb0IsTUFIcEI7O0FBS0EsYUFBSzBLLE9BQUwsQ0FDR3BCLEdBREgsQ0FDTyxRQURQLEVBRUdqVSxJQUZILENBRVEsWUFBVztBQUNmRSxnQkFBTXFZLGtCQUFOLENBQXlCcGEsRUFBRSxJQUFGLENBQXpCO0FBQ0QsU0FKSDs7QUFNQUUsbUJBQVdvQixnQkFBWCxDQUE0QixJQUE1QjtBQUNEO0FBeGFVOztBQUFBO0FBQUE7O0FBMmFiOzs7OztBQUdBMFYsUUFBTUMsUUFBTixHQUFpQjtBQUNmOzs7Ozs7QUFNQUssZ0JBQVksYUFQRzs7QUFTZjs7Ozs7QUFLQWMscUJBQWlCLGtCQWRGOztBQWdCZjs7Ozs7QUFLQUUscUJBQWlCLGtCQXJCRjs7QUF1QmY7Ozs7O0FBS0FWLHVCQUFtQixhQTVCSjs7QUE4QmY7Ozs7O0FBS0FTLG9CQUFnQixZQW5DRDs7QUFxQ2Y7Ozs7O0FBS0FiLGtCQUFjLEtBMUNDOztBQTRDZnFDLGNBQVU7QUFDUlEsYUFBUSxhQURBO0FBRVJDLHFCQUFnQixnQkFGUjtBQUdSQyxlQUFVLFlBSEY7QUFJUkMsY0FBUywwQkFKRDs7QUFNUjtBQUNBQyxZQUFPLHVKQVBDO0FBUVJDLFdBQU0sZ0JBUkU7O0FBVVI7QUFDQUMsYUFBUSx1SUFYQTs7QUFhUkMsV0FBTSxvdENBYkU7QUFjUjtBQUNBQyxjQUFTLGtFQWZEOztBQWlCUkMsZ0JBQVcsb0hBakJIO0FBa0JSO0FBQ0FDLFlBQU8sZ0lBbkJDO0FBb0JSO0FBQ0FDLFlBQU8sMENBckJDO0FBc0JSQyxlQUFVLG1DQXRCRjtBQXVCUjtBQUNBQyxzQkFBaUIsOERBeEJUO0FBeUJSO0FBQ0FDLHNCQUFpQiw4REExQlQ7O0FBNEJSO0FBQ0FDLGFBQVE7QUE3QkEsS0E1Q0s7O0FBNEVmOzs7Ozs7OztBQVFBL0IsZ0JBQVk7QUFDVkosZUFBUyxVQUFVbFYsRUFBVixFQUFjaVcsUUFBZCxFQUF3QjdSLE1BQXhCLEVBQWdDO0FBQ3ZDLGVBQU9uSSxRQUFNK0QsR0FBR3hELElBQUgsQ0FBUSxjQUFSLENBQU4sRUFBaUNrTyxHQUFqQyxPQUEyQzFLLEdBQUcwSyxHQUFILEVBQWxEO0FBQ0Q7QUFIUztBQXBGRyxHQUFqQjs7QUEyRkE7QUFDQXZPLGFBQVdNLE1BQVgsQ0FBa0J3VyxLQUFsQixFQUF5QixPQUF6QjtBQUVDLENBNWdCQSxDQTRnQkNuUCxNQTVnQkQsQ0FBRDtDQ0ZBOzs7Ozs7QUFFQSxDQUFDLFVBQVM3SCxDQUFULEVBQVk7O0FBRWI7Ozs7Ozs7QUFGYSxNQVNQcWIsU0FUTztBQVVYOzs7Ozs7O0FBT0EsdUJBQVluVCxPQUFaLEVBQXFCaUosT0FBckIsRUFBOEI7QUFBQTs7QUFDNUIsV0FBS2hRLFFBQUwsR0FBZ0IrRyxPQUFoQjtBQUNBLFdBQUtpSixPQUFMLEdBQWVuUixFQUFFcUwsTUFBRixDQUFTLEVBQVQsRUFBYWdRLFVBQVVwRSxRQUF2QixFQUFpQyxLQUFLOVYsUUFBTCxDQUFjQyxJQUFkLEVBQWpDLEVBQXVEK1AsT0FBdkQsQ0FBZjs7QUFFQSxXQUFLclAsS0FBTDs7QUFFQTVCLGlCQUFXWSxjQUFYLENBQTBCLElBQTFCLEVBQWdDLFdBQWhDO0FBQ0FaLGlCQUFXbUssUUFBWCxDQUFvQnNCLFFBQXBCLENBQTZCLFdBQTdCLEVBQTBDO0FBQ3hDLGlCQUFTLFFBRCtCO0FBRXhDLGlCQUFTLFFBRitCO0FBR3hDLHNCQUFjLE1BSDBCO0FBSXhDLG9CQUFZO0FBSjRCLE9BQTFDO0FBTUQ7O0FBRUQ7Ozs7OztBQWhDVztBQUFBO0FBQUEsOEJBb0NIO0FBQ04sYUFBS3hLLFFBQUwsQ0FBY1osSUFBZCxDQUFtQixNQUFuQixFQUEyQixTQUEzQjtBQUNBLGFBQUsrYSxLQUFMLEdBQWEsS0FBS25hLFFBQUwsQ0FBYzZQLFFBQWQsQ0FBdUIsMkJBQXZCLENBQWI7O0FBRUEsYUFBS3NLLEtBQUwsQ0FBV3paLElBQVgsQ0FBZ0IsVUFBUzBaLEdBQVQsRUFBY3hYLEVBQWQsRUFBa0I7QUFDaEMsY0FBSVIsTUFBTXZELEVBQUUrRCxFQUFGLENBQVY7QUFBQSxjQUNJeVgsV0FBV2pZLElBQUl5TixRQUFKLENBQWEsb0JBQWIsQ0FEZjtBQUFBLGNBRUlyRCxLQUFLNk4sU0FBUyxDQUFULEVBQVk3TixFQUFaLElBQWtCek4sV0FBV2dCLFdBQVgsQ0FBdUIsQ0FBdkIsRUFBMEIsV0FBMUIsQ0FGM0I7QUFBQSxjQUdJdWEsU0FBUzFYLEdBQUc0SixFQUFILElBQVlBLEVBQVosV0FIYjs7QUFLQXBLLGNBQUlGLElBQUosQ0FBUyxTQUFULEVBQW9COUMsSUFBcEIsQ0FBeUI7QUFDdkIsNkJBQWlCb04sRUFETTtBQUV2QixvQkFBUSxLQUZlO0FBR3ZCLGtCQUFNOE4sTUFIaUI7QUFJdkIsNkJBQWlCLEtBSk07QUFLdkIsNkJBQWlCO0FBTE0sV0FBekI7O0FBUUFELG1CQUFTamIsSUFBVCxDQUFjLEVBQUMsUUFBUSxVQUFULEVBQXFCLG1CQUFtQmtiLE1BQXhDLEVBQWdELGVBQWUsSUFBL0QsRUFBcUUsTUFBTTlOLEVBQTNFLEVBQWQ7QUFDRCxTQWZEO0FBZ0JBLFlBQUkrTixjQUFjLEtBQUt2YSxRQUFMLENBQWNrQyxJQUFkLENBQW1CLFlBQW5CLEVBQWlDMk4sUUFBakMsQ0FBMEMsb0JBQTFDLENBQWxCO0FBQ0EsWUFBRzBLLFlBQVlqWixNQUFmLEVBQXNCO0FBQ3BCLGVBQUtrWixJQUFMLENBQVVELFdBQVYsRUFBdUIsSUFBdkI7QUFDRDtBQUNELGFBQUt2RSxPQUFMO0FBQ0Q7O0FBRUQ7Ozs7O0FBL0RXO0FBQUE7QUFBQSxnQ0FtRUQ7QUFDUixZQUFJcFYsUUFBUSxJQUFaOztBQUVBLGFBQUt1WixLQUFMLENBQVd6WixJQUFYLENBQWdCLFlBQVc7QUFDekIsY0FBSXVCLFFBQVFwRCxFQUFFLElBQUYsQ0FBWjtBQUNBLGNBQUk0YixjQUFjeFksTUFBTTROLFFBQU4sQ0FBZSxvQkFBZixDQUFsQjtBQUNBLGNBQUk0SyxZQUFZblosTUFBaEIsRUFBd0I7QUFDdEJXLGtCQUFNNE4sUUFBTixDQUFlLEdBQWYsRUFBb0I4RSxHQUFwQixDQUF3Qix5Q0FBeEIsRUFDUTFJLEVBRFIsQ0FDVyxvQkFEWCxFQUNpQyxVQUFTeEosQ0FBVCxFQUFZO0FBQzdDO0FBQ0VBLGdCQUFFdU8sY0FBRjtBQUNBLGtCQUFJL08sTUFBTXlZLFFBQU4sQ0FBZSxXQUFmLENBQUosRUFBaUM7QUFDL0Isb0JBQUc5WixNQUFNb1AsT0FBTixDQUFjMkssY0FBZCxJQUFnQzFZLE1BQU11VSxRQUFOLEdBQWlCa0UsUUFBakIsQ0FBMEIsV0FBMUIsQ0FBbkMsRUFBMEU7QUFDeEU5Wix3QkFBTWdhLEVBQU4sQ0FBU0gsV0FBVDtBQUNEO0FBQ0YsZUFKRCxNQUtLO0FBQ0g3WixzQkFBTTRaLElBQU4sQ0FBV0MsV0FBWDtBQUNEO0FBQ0YsYUFaRCxFQVlHeE8sRUFaSCxDQVlNLHNCQVpOLEVBWThCLFVBQVN4SixDQUFULEVBQVc7QUFDdkMxRCx5QkFBV21LLFFBQVgsQ0FBb0JTLFNBQXBCLENBQThCbEgsQ0FBOUIsRUFBaUMsV0FBakMsRUFBOEM7QUFDNUNvWSx3QkFBUSxZQUFXO0FBQ2pCamEsd0JBQU1pYSxNQUFOLENBQWFKLFdBQWI7QUFDRCxpQkFIMkM7QUFJNUNLLHNCQUFNLFlBQVc7QUFDZixzQkFBSUMsS0FBSzlZLE1BQU02WSxJQUFOLEdBQWE1WSxJQUFiLENBQWtCLEdBQWxCLEVBQXVCOFksS0FBdkIsRUFBVDtBQUNBLHNCQUFJLENBQUNwYSxNQUFNb1AsT0FBTixDQUFjaUwsV0FBbkIsRUFBZ0M7QUFDOUJGLHVCQUFHN2EsT0FBSCxDQUFXLG9CQUFYO0FBQ0Q7QUFDRixpQkFUMkM7QUFVNUNnYiwwQkFBVSxZQUFXO0FBQ25CLHNCQUFJSCxLQUFLOVksTUFBTWtaLElBQU4sR0FBYWpaLElBQWIsQ0FBa0IsR0FBbEIsRUFBdUI4WSxLQUF2QixFQUFUO0FBQ0Esc0JBQUksQ0FBQ3BhLE1BQU1vUCxPQUFOLENBQWNpTCxXQUFuQixFQUFnQztBQUM5QkYsdUJBQUc3YSxPQUFILENBQVcsb0JBQVg7QUFDRDtBQUNGLGlCQWYyQztBQWdCNUNpSyx5QkFBUyxZQUFXO0FBQ2xCMUgsb0JBQUV1TyxjQUFGO0FBQ0F2TyxvQkFBRXNSLGVBQUY7QUFDRDtBQW5CMkMsZUFBOUM7QUFxQkQsYUFsQ0Q7QUFtQ0Q7QUFDRixTQXhDRDtBQXlDRDs7QUFFRDs7Ozs7O0FBakhXO0FBQUE7QUFBQSw2QkFzSEpxQixPQXRISSxFQXNISztBQUNkLFlBQUdBLFFBQVFwTyxNQUFSLEdBQWlCMFQsUUFBakIsQ0FBMEIsV0FBMUIsQ0FBSCxFQUEyQztBQUN6QyxjQUFHLEtBQUsxSyxPQUFMLENBQWEySyxjQUFiLElBQStCdkYsUUFBUXBPLE1BQVIsR0FBaUJ3UCxRQUFqQixHQUE0QmtFLFFBQTVCLENBQXFDLFdBQXJDLENBQWxDLEVBQW9GO0FBQ2xGLGlCQUFLRSxFQUFMLENBQVF4RixPQUFSO0FBQ0QsV0FGRCxNQUVPO0FBQUU7QUFBUztBQUNuQixTQUpELE1BSU87QUFDTCxlQUFLb0YsSUFBTCxDQUFVcEYsT0FBVjtBQUNEO0FBQ0Y7O0FBRUQ7Ozs7Ozs7O0FBaElXO0FBQUE7QUFBQSwyQkF1SU5BLE9BdklNLEVBdUlHZ0csU0F2SUgsRUF1SWM7QUFBQTs7QUFDdkIsWUFBSSxDQUFDLEtBQUtwTCxPQUFMLENBQWFpTCxXQUFkLElBQTZCLENBQUNHLFNBQWxDLEVBQTZDO0FBQzNDLGNBQUlDLGlCQUFpQixLQUFLcmIsUUFBTCxDQUFjNlAsUUFBZCxDQUF1QixZQUF2QixFQUFxQ0EsUUFBckMsQ0FBOEMsb0JBQTlDLENBQXJCO0FBQ0EsY0FBR3dMLGVBQWUvWixNQUFsQixFQUF5QjtBQUN2QixpQkFBS3NaLEVBQUwsQ0FBUVMsY0FBUjtBQUNEO0FBQ0Y7O0FBRURqRyxnQkFDR2hXLElBREgsQ0FDUSxhQURSLEVBQ3VCLEtBRHZCLEVBRUc0SCxNQUZILENBRVUsb0JBRlYsRUFHRzdFLE9BSEgsR0FJRzZFLE1BSkgsR0FJWTZILFFBSlosQ0FJcUIsV0FKckI7O0FBTUF1RyxnQkFBUWtHLFNBQVIsQ0FBa0IsS0FBS3RMLE9BQUwsQ0FBYXVMLFVBQS9CLEVBQTJDLFlBQU07QUFDL0M7Ozs7QUFJQSxpQkFBS3ZiLFFBQUwsQ0FBY0UsT0FBZCxDQUFzQixtQkFBdEIsRUFBMkMsQ0FBQ2tWLE9BQUQsQ0FBM0M7QUFDRCxTQU5EOztBQVFBdlcsZ0JBQU11VyxRQUFRaFcsSUFBUixDQUFhLGlCQUFiLENBQU4sRUFBeUNBLElBQXpDLENBQThDO0FBQzVDLDJCQUFpQixJQUQyQjtBQUU1QywyQkFBaUI7QUFGMkIsU0FBOUM7QUFJRDs7QUFFRDs7Ozs7OztBQW5LVztBQUFBO0FBQUEseUJBeUtSZ1csT0F6S1EsRUF5S0M7QUFDVixZQUFJb0csU0FBU3BHLFFBQVFwTyxNQUFSLEdBQWlCd1AsUUFBakIsRUFBYjtBQUFBLFlBQ0k1VixRQUFRLElBRFo7QUFFQSxZQUFJNmEsV0FBVyxLQUFLekwsT0FBTCxDQUFhaUwsV0FBYixHQUEyQk8sT0FBT2QsUUFBUCxDQUFnQixXQUFoQixDQUEzQixHQUEwRHRGLFFBQVFwTyxNQUFSLEdBQWlCMFQsUUFBakIsQ0FBMEIsV0FBMUIsQ0FBekU7O0FBRUEsWUFBRyxDQUFDLEtBQUsxSyxPQUFMLENBQWEySyxjQUFkLElBQWdDLENBQUNjLFFBQXBDLEVBQThDO0FBQzVDO0FBQ0Q7O0FBRUQ7QUFDRXJHLGdCQUFRc0csT0FBUixDQUFnQjlhLE1BQU1vUCxPQUFOLENBQWN1TCxVQUE5QixFQUEwQyxZQUFZO0FBQ3BEOzs7O0FBSUEzYSxnQkFBTVosUUFBTixDQUFlRSxPQUFmLENBQXVCLGlCQUF2QixFQUEwQyxDQUFDa1YsT0FBRCxDQUExQztBQUNELFNBTkQ7QUFPRjs7QUFFQUEsZ0JBQVFoVyxJQUFSLENBQWEsYUFBYixFQUE0QixJQUE1QixFQUNRNEgsTUFEUixHQUNpQjVDLFdBRGpCLENBQzZCLFdBRDdCOztBQUdBdkYsZ0JBQU11VyxRQUFRaFcsSUFBUixDQUFhLGlCQUFiLENBQU4sRUFBeUNBLElBQXpDLENBQThDO0FBQzdDLDJCQUFpQixLQUQ0QjtBQUU3QywyQkFBaUI7QUFGNEIsU0FBOUM7QUFJRDs7QUFFRDs7Ozs7O0FBck1XO0FBQUE7QUFBQSxnQ0EwTUQ7QUFDUixhQUFLWSxRQUFMLENBQWNrQyxJQUFkLENBQW1CLG9CQUFuQixFQUF5Q3daLE9BQXpDLENBQWlELENBQWpELEVBQW9EclEsR0FBcEQsQ0FBd0QsU0FBeEQsRUFBbUUsRUFBbkU7QUFDQSxhQUFLckwsUUFBTCxDQUFja0MsSUFBZCxDQUFtQixHQUFuQixFQUF3QnlTLEdBQXhCLENBQTRCLGVBQTVCOztBQUVBNVYsbUJBQVdvQixnQkFBWCxDQUE0QixJQUE1QjtBQUNEO0FBL01VOztBQUFBO0FBQUE7O0FBa05iK1osWUFBVXBFLFFBQVYsR0FBcUI7QUFDbkI7Ozs7O0FBS0F5RixnQkFBWSxHQU5PO0FBT25COzs7OztBQUtBTixpQkFBYSxLQVpNO0FBYW5COzs7OztBQUtBTixvQkFBZ0I7QUFsQkcsR0FBckI7O0FBcUJBO0FBQ0E1YixhQUFXTSxNQUFYLENBQWtCNmEsU0FBbEIsRUFBNkIsV0FBN0I7QUFFQyxDQTFPQSxDQTBPQ3hULE1BMU9ELENBQUQ7Q0NGQTs7Ozs7O0FBRUEsQ0FBQyxVQUFTN0gsQ0FBVCxFQUFZOztBQUViOzs7Ozs7OztBQUZhLE1BVVA4YyxhQVZPO0FBV1g7Ozs7Ozs7QUFPQSwyQkFBWTVVLE9BQVosRUFBcUJpSixPQUFyQixFQUE4QjtBQUFBOztBQUM1QixXQUFLaFEsUUFBTCxHQUFnQitHLE9BQWhCO0FBQ0EsV0FBS2lKLE9BQUwsR0FBZW5SLEVBQUVxTCxNQUFGLENBQVMsRUFBVCxFQUFheVIsY0FBYzdGLFFBQTNCLEVBQXFDLEtBQUs5VixRQUFMLENBQWNDLElBQWQsRUFBckMsRUFBMkQrUCxPQUEzRCxDQUFmOztBQUVBalIsaUJBQVdxUSxJQUFYLENBQWdCQyxPQUFoQixDQUF3QixLQUFLclAsUUFBN0IsRUFBdUMsV0FBdkM7O0FBRUEsV0FBS1csS0FBTDs7QUFFQTVCLGlCQUFXWSxjQUFYLENBQTBCLElBQTFCLEVBQWdDLGVBQWhDO0FBQ0FaLGlCQUFXbUssUUFBWCxDQUFvQnNCLFFBQXBCLENBQTZCLGVBQTdCLEVBQThDO0FBQzVDLGlCQUFTLFFBRG1DO0FBRTVDLGlCQUFTLFFBRm1DO0FBRzVDLHVCQUFlLE1BSDZCO0FBSTVDLG9CQUFZLElBSmdDO0FBSzVDLHNCQUFjLE1BTDhCO0FBTTVDLHNCQUFjLE9BTjhCO0FBTzVDLGtCQUFVLFVBUGtDO0FBUTVDLGVBQU8sTUFScUM7QUFTNUMscUJBQWE7QUFUK0IsT0FBOUM7QUFXRDs7QUFJRDs7Ozs7O0FBMUNXO0FBQUE7QUFBQSw4QkE4Q0g7QUFDTixhQUFLeEssUUFBTCxDQUFja0MsSUFBZCxDQUFtQixnQkFBbkIsRUFBcUMyUyxHQUFyQyxDQUF5QyxZQUF6QyxFQUF1RDZHLE9BQXZELENBQStELENBQS9ELEVBRE0sQ0FDNEQ7QUFDbEUsYUFBSzFiLFFBQUwsQ0FBY1osSUFBZCxDQUFtQjtBQUNqQixrQkFBUSxTQURTO0FBRWpCLGtDQUF3QixLQUFLNFEsT0FBTCxDQUFhNEw7QUFGcEIsU0FBbkI7O0FBS0EsYUFBS0MsVUFBTCxHQUFrQixLQUFLN2IsUUFBTCxDQUFja0MsSUFBZCxDQUFtQiw4QkFBbkIsQ0FBbEI7QUFDQSxhQUFLMlosVUFBTCxDQUFnQm5iLElBQWhCLENBQXFCLFlBQVU7QUFDN0IsY0FBSTRaLFNBQVMsS0FBSzlOLEVBQUwsSUFBV3pOLFdBQVdnQixXQUFYLENBQXVCLENBQXZCLEVBQTBCLGVBQTFCLENBQXhCO0FBQUEsY0FDSWtDLFFBQVFwRCxFQUFFLElBQUYsQ0FEWjtBQUFBLGNBRUkrUSxPQUFPM04sTUFBTTROLFFBQU4sQ0FBZSxnQkFBZixDQUZYO0FBQUEsY0FHSWlNLFFBQVFsTSxLQUFLLENBQUwsRUFBUXBELEVBQVIsSUFBY3pOLFdBQVdnQixXQUFYLENBQXVCLENBQXZCLEVBQTBCLFVBQTFCLENBSDFCO0FBQUEsY0FJSWdjLFdBQVduTSxLQUFLOEssUUFBTCxDQUFjLFdBQWQsQ0FKZjtBQUtBelksZ0JBQU03QyxJQUFOLENBQVc7QUFDVCw2QkFBaUIwYyxLQURSO0FBRVQsNkJBQWlCQyxRQUZSO0FBR1Qsb0JBQVEsS0FIQztBQUlULGtCQUFNekI7QUFKRyxXQUFYO0FBTUExSyxlQUFLeFEsSUFBTCxDQUFVO0FBQ1IsK0JBQW1Ca2IsTUFEWDtBQUVSLDJCQUFlLENBQUN5QixRQUZSO0FBR1Isb0JBQVEsVUFIQTtBQUlSLGtCQUFNRDtBQUpFLFdBQVY7QUFNRCxTQWxCRDtBQW1CQSxZQUFJRSxZQUFZLEtBQUtoYyxRQUFMLENBQWNrQyxJQUFkLENBQW1CLFlBQW5CLENBQWhCO0FBQ0EsWUFBRzhaLFVBQVUxYSxNQUFiLEVBQW9CO0FBQ2xCLGNBQUlWLFFBQVEsSUFBWjtBQUNBb2Isb0JBQVV0YixJQUFWLENBQWUsWUFBVTtBQUN2QkUsa0JBQU00WixJQUFOLENBQVczYixFQUFFLElBQUYsQ0FBWDtBQUNELFdBRkQ7QUFHRDtBQUNELGFBQUttWCxPQUFMO0FBQ0Q7O0FBRUQ7Ozs7O0FBbkZXO0FBQUE7QUFBQSxnQ0F1RkQ7QUFDUixZQUFJcFYsUUFBUSxJQUFaOztBQUVBLGFBQUtaLFFBQUwsQ0FBY2tDLElBQWQsQ0FBbUIsSUFBbkIsRUFBeUJ4QixJQUF6QixDQUE4QixZQUFXO0FBQ3ZDLGNBQUl1YixXQUFXcGQsRUFBRSxJQUFGLEVBQVFnUixRQUFSLENBQWlCLGdCQUFqQixDQUFmOztBQUVBLGNBQUlvTSxTQUFTM2EsTUFBYixFQUFxQjtBQUNuQnpDLGNBQUUsSUFBRixFQUFRZ1IsUUFBUixDQUFpQixHQUFqQixFQUFzQjhFLEdBQXRCLENBQTBCLHdCQUExQixFQUFvRDFJLEVBQXBELENBQXVELHdCQUF2RCxFQUFpRixVQUFTeEosQ0FBVCxFQUFZO0FBQzNGQSxnQkFBRXVPLGNBQUY7O0FBRUFwUSxvQkFBTWlhLE1BQU4sQ0FBYW9CLFFBQWI7QUFDRCxhQUpEO0FBS0Q7QUFDRixTQVZELEVBVUdoUSxFQVZILENBVU0sMEJBVk4sRUFVa0MsVUFBU3hKLENBQVQsRUFBVztBQUMzQyxjQUFJekMsV0FBV25CLEVBQUUsSUFBRixDQUFmO0FBQUEsY0FDSXFkLFlBQVlsYyxTQUFTZ0gsTUFBVCxDQUFnQixJQUFoQixFQUFzQjZJLFFBQXRCLENBQStCLElBQS9CLENBRGhCO0FBQUEsY0FFSXNNLFlBRko7QUFBQSxjQUdJQyxZQUhKO0FBQUEsY0FJSWhILFVBQVVwVixTQUFTNlAsUUFBVCxDQUFrQixnQkFBbEIsQ0FKZDs7QUFNQXFNLG9CQUFVeGIsSUFBVixDQUFlLFVBQVNzQixDQUFULEVBQVk7QUFDekIsZ0JBQUluRCxFQUFFLElBQUYsRUFBUTBMLEVBQVIsQ0FBV3ZLLFFBQVgsQ0FBSixFQUEwQjtBQUN4Qm1jLDZCQUFlRCxVQUFVek4sRUFBVixDQUFhak4sS0FBS2dFLEdBQUwsQ0FBUyxDQUFULEVBQVl4RCxJQUFFLENBQWQsQ0FBYixFQUErQkUsSUFBL0IsQ0FBb0MsR0FBcEMsRUFBeUM0USxLQUF6QyxFQUFmO0FBQ0FzSiw2QkFBZUYsVUFBVXpOLEVBQVYsQ0FBYWpOLEtBQUs2YSxHQUFMLENBQVNyYSxJQUFFLENBQVgsRUFBY2thLFVBQVU1YSxNQUFWLEdBQWlCLENBQS9CLENBQWIsRUFBZ0RZLElBQWhELENBQXFELEdBQXJELEVBQTBENFEsS0FBMUQsRUFBZjs7QUFFQSxrQkFBSWpVLEVBQUUsSUFBRixFQUFRZ1IsUUFBUixDQUFpQix3QkFBakIsRUFBMkN2TyxNQUEvQyxFQUF1RDtBQUFFO0FBQ3ZEOGEsK0JBQWVwYyxTQUFTa0MsSUFBVCxDQUFjLGdCQUFkLEVBQWdDQSxJQUFoQyxDQUFxQyxHQUFyQyxFQUEwQzRRLEtBQTFDLEVBQWY7QUFDRDtBQUNELGtCQUFJalUsRUFBRSxJQUFGLEVBQVEwTCxFQUFSLENBQVcsY0FBWCxDQUFKLEVBQWdDO0FBQUU7QUFDaEM0UiwrQkFBZW5jLFNBQVNzYyxPQUFULENBQWlCLElBQWpCLEVBQXVCeEosS0FBdkIsR0FBK0I1USxJQUEvQixDQUFvQyxHQUFwQyxFQUF5QzRRLEtBQXpDLEVBQWY7QUFDRCxlQUZELE1BRU8sSUFBSXFKLGFBQWF0TSxRQUFiLENBQXNCLHdCQUF0QixFQUFnRHZPLE1BQXBELEVBQTREO0FBQUU7QUFDbkU2YSwrQkFBZUEsYUFBYWphLElBQWIsQ0FBa0IsZUFBbEIsRUFBbUNBLElBQW5DLENBQXdDLEdBQXhDLEVBQTZDNFEsS0FBN0MsRUFBZjtBQUNEO0FBQ0Qsa0JBQUlqVSxFQUFFLElBQUYsRUFBUTBMLEVBQVIsQ0FBVyxhQUFYLENBQUosRUFBK0I7QUFBRTtBQUMvQjZSLCtCQUFlcGMsU0FBU3NjLE9BQVQsQ0FBaUIsSUFBakIsRUFBdUJ4SixLQUF2QixHQUErQmdJLElBQS9CLENBQW9DLElBQXBDLEVBQTBDNVksSUFBMUMsQ0FBK0MsR0FBL0MsRUFBb0Q0USxLQUFwRCxFQUFmO0FBQ0Q7O0FBRUQ7QUFDRDtBQUNGLFdBbkJEO0FBb0JBL1QscUJBQVdtSyxRQUFYLENBQW9CUyxTQUFwQixDQUE4QmxILENBQTlCLEVBQWlDLGVBQWpDLEVBQWtEO0FBQ2hEOFosa0JBQU0sWUFBVztBQUNmLGtCQUFJbkgsUUFBUTdLLEVBQVIsQ0FBVyxTQUFYLENBQUosRUFBMkI7QUFDekIzSixzQkFBTTRaLElBQU4sQ0FBV3BGLE9BQVg7QUFDQUEsd0JBQVFsVCxJQUFSLENBQWEsSUFBYixFQUFtQjRRLEtBQW5CLEdBQTJCNVEsSUFBM0IsQ0FBZ0MsR0FBaEMsRUFBcUM0USxLQUFyQyxHQUE2Q2tJLEtBQTdDO0FBQ0Q7QUFDRixhQU4rQztBQU9oRHdCLG1CQUFPLFlBQVc7QUFDaEIsa0JBQUlwSCxRQUFROVQsTUFBUixJQUFrQixDQUFDOFQsUUFBUTdLLEVBQVIsQ0FBVyxTQUFYLENBQXZCLEVBQThDO0FBQUU7QUFDOUMzSixzQkFBTWdhLEVBQU4sQ0FBU3hGLE9BQVQ7QUFDRCxlQUZELE1BRU8sSUFBSXBWLFNBQVNnSCxNQUFULENBQWdCLGdCQUFoQixFQUFrQzFGLE1BQXRDLEVBQThDO0FBQUU7QUFDckRWLHNCQUFNZ2EsRUFBTixDQUFTNWEsU0FBU2dILE1BQVQsQ0FBZ0IsZ0JBQWhCLENBQVQ7QUFDQWhILHlCQUFTc2MsT0FBVCxDQUFpQixJQUFqQixFQUF1QnhKLEtBQXZCLEdBQStCNVEsSUFBL0IsQ0FBb0MsR0FBcEMsRUFBeUM0USxLQUF6QyxHQUFpRGtJLEtBQWpEO0FBQ0Q7QUFDRixhQWQrQztBQWVoREosZ0JBQUksWUFBVztBQUNidUIsMkJBQWEvYyxJQUFiLENBQWtCLFVBQWxCLEVBQThCLENBQUMsQ0FBL0IsRUFBa0M0YixLQUFsQztBQUNBdlksZ0JBQUV1TyxjQUFGO0FBQ0QsYUFsQitDO0FBbUJoRHdKLGtCQUFNLFlBQVc7QUFDZjRCLDJCQUFhaGQsSUFBYixDQUFrQixVQUFsQixFQUE4QixDQUFDLENBQS9CLEVBQWtDNGIsS0FBbEM7QUFDQXZZLGdCQUFFdU8sY0FBRjtBQUNELGFBdEIrQztBQXVCaEQ2SixvQkFBUSxZQUFXO0FBQ2pCLGtCQUFJN2EsU0FBUzZQLFFBQVQsQ0FBa0IsZ0JBQWxCLEVBQW9Ddk8sTUFBeEMsRUFBZ0Q7QUFDOUNWLHNCQUFNaWEsTUFBTixDQUFhN2EsU0FBUzZQLFFBQVQsQ0FBa0IsZ0JBQWxCLENBQWI7QUFDRDtBQUNGLGFBM0IrQztBQTRCaEQ0TSxzQkFBVSxZQUFXO0FBQ25CN2Isb0JBQU04YixPQUFOO0FBQ0QsYUE5QitDO0FBK0JoRHZTLHFCQUFTLFlBQVc7QUFDbEIxSCxnQkFBRWthLHdCQUFGO0FBQ0Q7QUFqQytDLFdBQWxEO0FBbUNELFNBeEVELEVBSFEsQ0EyRUw7QUFDSjs7QUFFRDs7Ozs7QUFyS1c7QUFBQTtBQUFBLGdDQXlLRDtBQUNSLGFBQUszYyxRQUFMLENBQWNrQyxJQUFkLENBQW1CLGdCQUFuQixFQUFxQ3daLE9BQXJDLENBQTZDLEtBQUsxTCxPQUFMLENBQWF1TCxVQUExRDtBQUNEOztBQUVEOzs7Ozs7QUE3S1c7QUFBQTtBQUFBLDZCQWtMSm5HLE9BbExJLEVBa0xJO0FBQ2IsWUFBRyxDQUFDQSxRQUFRN0ssRUFBUixDQUFXLFdBQVgsQ0FBSixFQUE2QjtBQUMzQixjQUFJLENBQUM2SyxRQUFRN0ssRUFBUixDQUFXLFNBQVgsQ0FBTCxFQUE0QjtBQUMxQixpQkFBS3FRLEVBQUwsQ0FBUXhGLE9BQVI7QUFDRCxXQUZELE1BR0s7QUFDSCxpQkFBS29GLElBQUwsQ0FBVXBGLE9BQVY7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQ7Ozs7OztBQTdMVztBQUFBO0FBQUEsMkJBa01OQSxPQWxNTSxFQWtNRztBQUNaLFlBQUl4VSxRQUFRLElBQVo7O0FBRUEsWUFBRyxDQUFDLEtBQUtvUCxPQUFMLENBQWE0TCxTQUFqQixFQUE0QjtBQUMxQixlQUFLaEIsRUFBTCxDQUFRLEtBQUs1YSxRQUFMLENBQWNrQyxJQUFkLENBQW1CLFlBQW5CLEVBQWlDMlMsR0FBakMsQ0FBcUNPLFFBQVF3SCxZQUFSLENBQXFCLEtBQUs1YyxRQUExQixFQUFvQzZjLEdBQXBDLENBQXdDekgsT0FBeEMsQ0FBckMsQ0FBUjtBQUNEOztBQUVEQSxnQkFBUXZHLFFBQVIsQ0FBaUIsV0FBakIsRUFBOEJ6UCxJQUE5QixDQUFtQyxFQUFDLGVBQWUsS0FBaEIsRUFBbkMsRUFDRzRILE1BREgsQ0FDVSw4QkFEVixFQUMwQzVILElBRDFDLENBQytDLEVBQUMsaUJBQWlCLElBQWxCLEVBRC9DOztBQUdFTCxtQkFBV21QLElBQVgsQ0FBZ0IsS0FBSzhCLE9BQUwsQ0FBYXVMLFVBQTdCLEVBQXlDbkcsT0FBekMsRUFBa0QsWUFBVztBQUMzREEsa0JBQVFrRyxTQUFSLENBQWtCMWEsTUFBTW9QLE9BQU4sQ0FBY3VMLFVBQWhDLEVBQTRDLFlBQVk7QUFDdEQ7Ozs7QUFJQTNhLGtCQUFNWixRQUFOLENBQWVFLE9BQWYsQ0FBdUIsdUJBQXZCLEVBQWdELENBQUNrVixPQUFELENBQWhEO0FBQ0QsV0FORDtBQU9ELFNBUkQ7QUFTSDs7QUFFRDs7Ozs7O0FBdk5XO0FBQUE7QUFBQSx5QkE0TlJBLE9BNU5RLEVBNE5DO0FBQ1YsWUFBSXhVLFFBQVEsSUFBWjtBQUNBN0IsbUJBQVdtUCxJQUFYLENBQWdCLEtBQUs4QixPQUFMLENBQWF1TCxVQUE3QixFQUF5Q25HLE9BQXpDLEVBQWtELFlBQVU7QUFDMURBLGtCQUFRc0csT0FBUixDQUFnQjlhLE1BQU1vUCxPQUFOLENBQWN1TCxVQUE5QixFQUEwQyxZQUFZO0FBQ3BEOzs7O0FBSUEzYSxrQkFBTVosUUFBTixDQUFlRSxPQUFmLENBQXVCLHFCQUF2QixFQUE4QyxDQUFDa1YsT0FBRCxDQUE5QztBQUNELFdBTkQ7QUFPRCxTQVJEOztBQVVBLFlBQUkwSCxTQUFTMUgsUUFBUWxULElBQVIsQ0FBYSxnQkFBYixFQUErQndaLE9BQS9CLENBQXVDLENBQXZDLEVBQTBDdlosT0FBMUMsR0FBb0QvQyxJQUFwRCxDQUF5RCxhQUF6RCxFQUF3RSxJQUF4RSxDQUFiOztBQUVBMGQsZUFBTzlWLE1BQVAsQ0FBYyw4QkFBZCxFQUE4QzVILElBQTlDLENBQW1ELGVBQW5ELEVBQW9FLEtBQXBFO0FBQ0Q7O0FBRUQ7Ozs7O0FBN09XO0FBQUE7QUFBQSxnQ0FpUEQ7QUFDUixhQUFLWSxRQUFMLENBQWNrQyxJQUFkLENBQW1CLGdCQUFuQixFQUFxQ29aLFNBQXJDLENBQStDLENBQS9DLEVBQWtEalEsR0FBbEQsQ0FBc0QsU0FBdEQsRUFBaUUsRUFBakU7QUFDQSxhQUFLckwsUUFBTCxDQUFja0MsSUFBZCxDQUFtQixHQUFuQixFQUF3QnlTLEdBQXhCLENBQTRCLHdCQUE1Qjs7QUFFQTVWLG1CQUFXcVEsSUFBWCxDQUFnQlUsSUFBaEIsQ0FBcUIsS0FBSzlQLFFBQTFCLEVBQW9DLFdBQXBDO0FBQ0FqQixtQkFBV29CLGdCQUFYLENBQTRCLElBQTVCO0FBQ0Q7QUF2UFU7O0FBQUE7QUFBQTs7QUEwUGJ3YixnQkFBYzdGLFFBQWQsR0FBeUI7QUFDdkI7Ozs7O0FBS0F5RixnQkFBWSxHQU5XO0FBT3ZCOzs7OztBQUtBSyxlQUFXO0FBWlksR0FBekI7O0FBZUE7QUFDQTdjLGFBQVdNLE1BQVgsQ0FBa0JzYyxhQUFsQixFQUFpQyxlQUFqQztBQUVDLENBNVFBLENBNFFDalYsTUE1UUQsQ0FBRDtDQ0ZBOzs7Ozs7QUFFQSxDQUFDLFVBQVM3SCxDQUFULEVBQVk7O0FBRWI7Ozs7Ozs7O0FBRmEsTUFVUGtlLFNBVk87QUFXWDs7Ozs7O0FBTUEsdUJBQVloVyxPQUFaLEVBQXFCaUosT0FBckIsRUFBOEI7QUFBQTs7QUFDNUIsV0FBS2hRLFFBQUwsR0FBZ0IrRyxPQUFoQjtBQUNBLFdBQUtpSixPQUFMLEdBQWVuUixFQUFFcUwsTUFBRixDQUFTLEVBQVQsRUFBYTZTLFVBQVVqSCxRQUF2QixFQUFpQyxLQUFLOVYsUUFBTCxDQUFjQyxJQUFkLEVBQWpDLEVBQXVEK1AsT0FBdkQsQ0FBZjs7QUFFQWpSLGlCQUFXcVEsSUFBWCxDQUFnQkMsT0FBaEIsQ0FBd0IsS0FBS3JQLFFBQTdCLEVBQXVDLFdBQXZDOztBQUVBLFdBQUtXLEtBQUw7O0FBRUE1QixpQkFBV1ksY0FBWCxDQUEwQixJQUExQixFQUFnQyxXQUFoQztBQUNBWixpQkFBV21LLFFBQVgsQ0FBb0JzQixRQUFwQixDQUE2QixXQUE3QixFQUEwQztBQUN4QyxpQkFBUyxNQUQrQjtBQUV4QyxpQkFBUyxNQUYrQjtBQUd4Qyx1QkFBZSxNQUh5QjtBQUl4QyxvQkFBWSxJQUo0QjtBQUt4QyxzQkFBYyxNQUwwQjtBQU14QyxzQkFBYyxVQU4wQjtBQU94QyxrQkFBVSxPQVA4QjtBQVF4QyxlQUFPLE1BUmlDO0FBU3hDLHFCQUFhO0FBVDJCLE9BQTFDO0FBV0Q7O0FBRUQ7Ozs7OztBQXZDVztBQUFBO0FBQUEsOEJBMkNIO0FBQ04sYUFBS3dTLGVBQUwsR0FBdUIsS0FBS2hkLFFBQUwsQ0FBY2tDLElBQWQsQ0FBbUIsZ0NBQW5CLEVBQXFEMk4sUUFBckQsQ0FBOEQsR0FBOUQsQ0FBdkI7QUFDQSxhQUFLb04sU0FBTCxHQUFpQixLQUFLRCxlQUFMLENBQXFCaFcsTUFBckIsQ0FBNEIsSUFBNUIsRUFBa0M2SSxRQUFsQyxDQUEyQyxnQkFBM0MsQ0FBakI7QUFDQSxhQUFLcU4sVUFBTCxHQUFrQixLQUFLbGQsUUFBTCxDQUFja0MsSUFBZCxDQUFtQixJQUFuQixFQUF5QjJTLEdBQXpCLENBQTZCLG9CQUE3QixFQUFtRHpWLElBQW5ELENBQXdELE1BQXhELEVBQWdFLFVBQWhFLEVBQTRFOEMsSUFBNUUsQ0FBaUYsR0FBakYsQ0FBbEI7O0FBRUEsYUFBS2liLFlBQUw7O0FBRUEsYUFBS0MsZUFBTDtBQUNEOztBQUVEOzs7Ozs7OztBQXJEVztBQUFBO0FBQUEscUNBNERJO0FBQ2IsWUFBSXhjLFFBQVEsSUFBWjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQUtvYyxlQUFMLENBQXFCdGMsSUFBckIsQ0FBMEIsWUFBVTtBQUNsQyxjQUFJa1AsT0FBTy9RLEVBQUUsSUFBRixDQUFYO0FBQ0EsY0FBSXdlLFFBQVF6TixLQUFLMU4sSUFBTCxDQUFVLFNBQVYsQ0FBWjtBQUNBLGNBQUd0QixNQUFNb1AsT0FBTixDQUFjc04sVUFBakIsRUFBNEI7QUFDMUJELGtCQUFNRSxLQUFOLEdBQWNDLFNBQWQsQ0FBd0I1TixLQUFLQyxRQUFMLENBQWMsZ0JBQWQsQ0FBeEIsRUFBeUQ0TixJQUF6RCxDQUE4RCxxR0FBOUQ7QUFDRDtBQUNESixnQkFBTXBkLElBQU4sQ0FBVyxXQUFYLEVBQXdCb2QsTUFBTWplLElBQU4sQ0FBVyxNQUFYLENBQXhCLEVBQTRDZ0IsVUFBNUMsQ0FBdUQsTUFBdkQ7QUFDQXdQLGVBQUtDLFFBQUwsQ0FBYyxnQkFBZCxFQUNLelEsSUFETCxDQUNVO0FBQ0osMkJBQWUsSUFEWDtBQUVKLHdCQUFZLENBRlI7QUFHSixvQkFBUTtBQUhKLFdBRFY7QUFNQXdCLGdCQUFNb1YsT0FBTixDQUFjcEcsSUFBZDtBQUNELFNBZEQ7QUFlQSxhQUFLcU4sU0FBTCxDQUFldmMsSUFBZixDQUFvQixZQUFVO0FBQzVCLGNBQUlnZCxRQUFRN2UsRUFBRSxJQUFGLENBQVo7QUFBQSxjQUNJOGUsUUFBUUQsTUFBTXhiLElBQU4sQ0FBVyxvQkFBWCxDQURaO0FBRUEsY0FBRyxDQUFDeWIsTUFBTXJjLE1BQVYsRUFBaUI7QUFDZm9jLGtCQUFNRSxPQUFOLENBQWNoZCxNQUFNb1AsT0FBTixDQUFjNk4sVUFBNUI7QUFDRDtBQUNEamQsZ0JBQU1rZCxLQUFOLENBQVlKLEtBQVo7QUFDRCxTQVBEO0FBUUEsWUFBRyxDQUFDLEtBQUsxZCxRQUFMLENBQWNnSCxNQUFkLEdBQXVCMFQsUUFBdkIsQ0FBZ0MsY0FBaEMsQ0FBSixFQUFvRDtBQUNsRCxlQUFLcUQsUUFBTCxHQUFnQmxmLEVBQUUsS0FBS21SLE9BQUwsQ0FBYWdPLE9BQWYsRUFBd0JuUCxRQUF4QixDQUFpQyxjQUFqQyxFQUFpRHhELEdBQWpELENBQXFELEtBQUs0UyxXQUFMLEVBQXJELENBQWhCO0FBQ0EsZUFBS2plLFFBQUwsQ0FBY3lkLElBQWQsQ0FBbUIsS0FBS00sUUFBeEI7QUFDRDtBQUNGOztBQUVEOzs7Ozs7O0FBOUZXO0FBQUE7QUFBQSw4QkFvR0g5YixLQXBHRyxFQW9HSTtBQUNiLFlBQUlyQixRQUFRLElBQVo7O0FBRUFxQixjQUFNMFMsR0FBTixDQUFVLG9CQUFWLEVBQ0MxSSxFQURELENBQ0ksb0JBREosRUFDMEIsVUFBU3hKLENBQVQsRUFBVztBQUNuQyxjQUFHNUQsRUFBRTRELEVBQUU3RixNQUFKLEVBQVlnZ0IsWUFBWixDQUF5QixJQUF6QixFQUErQixJQUEvQixFQUFxQ2xDLFFBQXJDLENBQThDLDZCQUE5QyxDQUFILEVBQWdGO0FBQzlFalksY0FBRWthLHdCQUFGO0FBQ0FsYSxjQUFFdU8sY0FBRjtBQUNEOztBQUVEO0FBQ0E7QUFDQTtBQUNBcFEsZ0JBQU1zZCxLQUFOLENBQVlqYyxNQUFNK0UsTUFBTixDQUFhLElBQWIsQ0FBWjs7QUFFQSxjQUFHcEcsTUFBTW9QLE9BQU4sQ0FBY21PLFlBQWpCLEVBQThCO0FBQzVCLGdCQUFJQyxRQUFRdmYsRUFBRSxNQUFGLEVBQVVnVyxHQUFWLENBQWNqVSxNQUFNbWQsUUFBcEIsQ0FBWjtBQUNBSyxrQkFBTXpKLEdBQU4sQ0FBVSxlQUFWLEVBQTJCMUksRUFBM0IsQ0FBOEIsb0JBQTlCLEVBQW9ELFVBQVN4SixDQUFULEVBQVc7QUFDN0RBLGdCQUFFdU8sY0FBRjtBQUNBcFEsb0JBQU15ZCxRQUFOO0FBQ0FELG9CQUFNekosR0FBTixDQUFVLGVBQVY7QUFDRCxhQUpEO0FBS0Q7QUFDRixTQXBCRDtBQXFCRDs7QUFFRDs7Ozs7QUE5SFc7QUFBQTtBQUFBLHdDQWtJTztBQUNoQixZQUFJL1QsUUFBUSxJQUFaOztBQUVBLGFBQUtzYyxVQUFMLENBQWdCTCxHQUFoQixDQUFvQixLQUFLN2MsUUFBTCxDQUFja0MsSUFBZCxDQUFtQix3QkFBbkIsQ0FBcEIsRUFBa0UrSixFQUFsRSxDQUFxRSxzQkFBckUsRUFBNkYsVUFBU3hKLENBQVQsRUFBVzs7QUFFdEcsY0FBSXpDLFdBQVduQixFQUFFLElBQUYsQ0FBZjtBQUFBLGNBQ0lxZCxZQUFZbGMsU0FBU2dILE1BQVQsQ0FBZ0IsSUFBaEIsRUFBc0JBLE1BQXRCLENBQTZCLElBQTdCLEVBQW1DNkksUUFBbkMsQ0FBNEMsSUFBNUMsRUFBa0RBLFFBQWxELENBQTJELEdBQTNELENBRGhCO0FBQUEsY0FFSXNNLFlBRko7QUFBQSxjQUdJQyxZQUhKOztBQUtBRixvQkFBVXhiLElBQVYsQ0FBZSxVQUFTc0IsQ0FBVCxFQUFZO0FBQ3pCLGdCQUFJbkQsRUFBRSxJQUFGLEVBQVEwTCxFQUFSLENBQVd2SyxRQUFYLENBQUosRUFBMEI7QUFDeEJtYyw2QkFBZUQsVUFBVXpOLEVBQVYsQ0FBYWpOLEtBQUtnRSxHQUFMLENBQVMsQ0FBVCxFQUFZeEQsSUFBRSxDQUFkLENBQWIsQ0FBZjtBQUNBb2EsNkJBQWVGLFVBQVV6TixFQUFWLENBQWFqTixLQUFLNmEsR0FBTCxDQUFTcmEsSUFBRSxDQUFYLEVBQWNrYSxVQUFVNWEsTUFBVixHQUFpQixDQUEvQixDQUFiLENBQWY7QUFDQTtBQUNEO0FBQ0YsV0FORDs7QUFRQXZDLHFCQUFXbUssUUFBWCxDQUFvQlMsU0FBcEIsQ0FBOEJsSCxDQUE5QixFQUFpQyxXQUFqQyxFQUE4QztBQUM1Q3FZLGtCQUFNLFlBQVc7QUFDZixrQkFBSTlhLFNBQVN1SyxFQUFULENBQVkzSixNQUFNb2MsZUFBbEIsQ0FBSixFQUF3QztBQUN0Q3BjLHNCQUFNc2QsS0FBTixDQUFZbGUsU0FBU2dILE1BQVQsQ0FBZ0IsSUFBaEIsQ0FBWjtBQUNBaEgseUJBQVNnSCxNQUFULENBQWdCLElBQWhCLEVBQXNCZ0ksR0FBdEIsQ0FBMEJqUSxXQUFXa0UsYUFBWCxDQUF5QmpELFFBQXpCLENBQTFCLEVBQThELFlBQVU7QUFDdEVBLDJCQUFTZ0gsTUFBVCxDQUFnQixJQUFoQixFQUFzQjlFLElBQXRCLENBQTJCLFNBQTNCLEVBQXNDb0ksTUFBdEMsQ0FBNkMxSixNQUFNc2MsVUFBbkQsRUFBK0RwSyxLQUEvRCxHQUF1RWtJLEtBQXZFO0FBQ0QsaUJBRkQ7QUFHQXZZLGtCQUFFdU8sY0FBRjtBQUNEO0FBQ0YsYUFUMkM7QUFVNUNrSyxzQkFBVSxZQUFXO0FBQ25CdGEsb0JBQU0wZCxLQUFOLENBQVl0ZSxTQUFTZ0gsTUFBVCxDQUFnQixJQUFoQixFQUFzQkEsTUFBdEIsQ0FBNkIsSUFBN0IsQ0FBWjtBQUNBaEgsdUJBQVNnSCxNQUFULENBQWdCLElBQWhCLEVBQXNCQSxNQUF0QixDQUE2QixJQUE3QixFQUFtQ2dJLEdBQW5DLENBQXVDalEsV0FBV2tFLGFBQVgsQ0FBeUJqRCxRQUF6QixDQUF2QyxFQUEyRSxZQUFVO0FBQ25GOUQsMkJBQVcsWUFBVztBQUNwQjhELDJCQUFTZ0gsTUFBVCxDQUFnQixJQUFoQixFQUFzQkEsTUFBdEIsQ0FBNkIsSUFBN0IsRUFBbUNBLE1BQW5DLENBQTBDLElBQTFDLEVBQWdENkksUUFBaEQsQ0FBeUQsR0FBekQsRUFBOERpRCxLQUE5RCxHQUFzRWtJLEtBQXRFO0FBQ0QsaUJBRkQsRUFFRyxDQUZIO0FBR0QsZUFKRDtBQUtBdlksZ0JBQUV1TyxjQUFGO0FBQ0QsYUFsQjJDO0FBbUI1QzRKLGdCQUFJLFlBQVc7QUFDYnVCLDJCQUFhbkIsS0FBYjtBQUNBdlksZ0JBQUV1TyxjQUFGO0FBQ0QsYUF0QjJDO0FBdUI1Q3dKLGtCQUFNLFlBQVc7QUFDZjRCLDJCQUFhcEIsS0FBYjtBQUNBdlksZ0JBQUV1TyxjQUFGO0FBQ0QsYUExQjJDO0FBMkI1Q3dMLG1CQUFPLFlBQVc7QUFDaEI1YixvQkFBTWtkLEtBQU47QUFDQTtBQUNELGFBOUIyQztBQStCNUN2QixrQkFBTSxZQUFXO0FBQ2Ysa0JBQUksQ0FBQ3ZjLFNBQVN1SyxFQUFULENBQVkzSixNQUFNc2MsVUFBbEIsQ0FBTCxFQUFvQztBQUFFO0FBQ3BDdGMsc0JBQU0wZCxLQUFOLENBQVl0ZSxTQUFTZ0gsTUFBVCxDQUFnQixJQUFoQixFQUFzQkEsTUFBdEIsQ0FBNkIsSUFBN0IsQ0FBWjtBQUNBaEgseUJBQVNnSCxNQUFULENBQWdCLElBQWhCLEVBQXNCQSxNQUF0QixDQUE2QixJQUE3QixFQUFtQ2dJLEdBQW5DLENBQXVDalEsV0FBV2tFLGFBQVgsQ0FBeUJqRCxRQUF6QixDQUF2QyxFQUEyRSxZQUFVO0FBQ25GOUQsNkJBQVcsWUFBVztBQUNwQjhELDZCQUFTZ0gsTUFBVCxDQUFnQixJQUFoQixFQUFzQkEsTUFBdEIsQ0FBNkIsSUFBN0IsRUFBbUNBLE1BQW5DLENBQTBDLElBQTFDLEVBQWdENkksUUFBaEQsQ0FBeUQsR0FBekQsRUFBOERpRCxLQUE5RCxHQUFzRWtJLEtBQXRFO0FBQ0QsbUJBRkQsRUFFRyxDQUZIO0FBR0QsaUJBSkQ7QUFLQXZZLGtCQUFFdU8sY0FBRjtBQUNELGVBUkQsTUFRTyxJQUFJaFIsU0FBU3VLLEVBQVQsQ0FBWTNKLE1BQU1vYyxlQUFsQixDQUFKLEVBQXdDO0FBQzdDcGMsc0JBQU1zZCxLQUFOLENBQVlsZSxTQUFTZ0gsTUFBVCxDQUFnQixJQUFoQixDQUFaO0FBQ0FoSCx5QkFBU2dILE1BQVQsQ0FBZ0IsSUFBaEIsRUFBc0JnSSxHQUF0QixDQUEwQmpRLFdBQVdrRSxhQUFYLENBQXlCakQsUUFBekIsQ0FBMUIsRUFBOEQsWUFBVTtBQUN0RUEsMkJBQVNnSCxNQUFULENBQWdCLElBQWhCLEVBQXNCOUUsSUFBdEIsQ0FBMkIsU0FBM0IsRUFBc0NvSSxNQUF0QyxDQUE2QzFKLE1BQU1zYyxVQUFuRCxFQUErRHBLLEtBQS9ELEdBQXVFa0ksS0FBdkU7QUFDRCxpQkFGRDtBQUdBdlksa0JBQUV1TyxjQUFGO0FBQ0Q7QUFDRixhQS9DMkM7QUFnRDVDN0cscUJBQVMsWUFBVztBQUNsQjFILGdCQUFFa2Esd0JBQUY7QUFDRDtBQWxEMkMsV0FBOUM7QUFvREQsU0FuRUQsRUFIZ0IsQ0FzRVo7QUFDTDs7QUFFRDs7Ozs7O0FBM01XO0FBQUE7QUFBQSxpQ0FnTkE7QUFDVCxZQUFJMWEsUUFBUSxLQUFLakMsUUFBTCxDQUFja0MsSUFBZCxDQUFtQixpQ0FBbkIsRUFBc0QyTSxRQUF0RCxDQUErRCxZQUEvRCxDQUFaO0FBQ0E1TSxjQUFNK00sR0FBTixDQUFValEsV0FBV2tFLGFBQVgsQ0FBeUJoQixLQUF6QixDQUFWLEVBQTJDLFVBQVNRLENBQVQsRUFBVztBQUNwRFIsZ0JBQU1tQyxXQUFOLENBQWtCLHNCQUFsQjtBQUNELFNBRkQ7QUFHSTs7OztBQUlKLGFBQUtwRSxRQUFMLENBQWNFLE9BQWQsQ0FBc0IscUJBQXRCO0FBQ0Q7O0FBRUQ7Ozs7Ozs7QUE1Tlc7QUFBQTtBQUFBLDRCQWtPTCtCLEtBbE9LLEVBa09FO0FBQ1gsWUFBSXJCLFFBQVEsSUFBWjtBQUNBcUIsY0FBTTBTLEdBQU4sQ0FBVSxvQkFBVjtBQUNBMVMsY0FBTTROLFFBQU4sQ0FBZSxvQkFBZixFQUNHNUQsRUFESCxDQUNNLG9CQUROLEVBQzRCLFVBQVN4SixDQUFULEVBQVc7QUFDbkNBLFlBQUVrYSx3QkFBRjtBQUNBO0FBQ0EvYixnQkFBTTBkLEtBQU4sQ0FBWXJjLEtBQVo7QUFDRCxTQUxIO0FBTUQ7O0FBRUQ7Ozs7OztBQTdPVztBQUFBO0FBQUEsd0NBa1BPO0FBQ2hCLFlBQUlyQixRQUFRLElBQVo7QUFDQSxhQUFLc2MsVUFBTCxDQUFnQnJJLEdBQWhCLENBQW9CLDhCQUFwQixFQUNLRixHQURMLENBQ1Msb0JBRFQsRUFFSzFJLEVBRkwsQ0FFUSxvQkFGUixFQUU4QixVQUFTeEosQ0FBVCxFQUFXO0FBQ25DO0FBQ0F2RyxxQkFBVyxZQUFVO0FBQ25CMEUsa0JBQU15ZCxRQUFOO0FBQ0QsV0FGRCxFQUVHLENBRkg7QUFHSCxTQVBIO0FBUUQ7O0FBRUQ7Ozs7Ozs7QUE5UFc7QUFBQTtBQUFBLDRCQW9RTHBjLEtBcFFLLEVBb1FFO0FBQ1hBLGNBQU00TixRQUFOLENBQWUsZ0JBQWYsRUFBaUNoQixRQUFqQyxDQUEwQyxXQUExQzs7QUFFQSxhQUFLN08sUUFBTCxDQUFjRSxPQUFkLENBQXNCLG1CQUF0QixFQUEyQyxDQUFDK0IsS0FBRCxDQUEzQztBQUNEO0FBeFFVO0FBQUE7OztBQTBRWDs7Ozs7O0FBMVFXLDRCQWdSTEEsS0FoUkssRUFnUkU7QUFDWCxZQUFJckIsUUFBUSxJQUFaO0FBQ0FxQixjQUFNNE0sUUFBTixDQUFlLFlBQWYsRUFDTUcsR0FETixDQUNValEsV0FBV2tFLGFBQVgsQ0FBeUJoQixLQUF6QixDQURWLEVBQzJDLFlBQVU7QUFDOUNBLGdCQUFNbUMsV0FBTixDQUFrQixzQkFBbEI7QUFDQW5DLGdCQUFNc2MsSUFBTjtBQUNELFNBSk47QUFLQTs7OztBQUlBdGMsY0FBTS9CLE9BQU4sQ0FBYyxtQkFBZCxFQUFtQyxDQUFDK0IsS0FBRCxDQUFuQztBQUNEOztBQUVEOzs7Ozs7O0FBOVJXO0FBQUE7QUFBQSxvQ0FvU0c7QUFDWixZQUFJdUQsTUFBTSxDQUFWO0FBQUEsWUFBYWdaLFNBQVMsRUFBdEI7QUFDQSxhQUFLdkIsU0FBTCxDQUFlSixHQUFmLENBQW1CLEtBQUs3YyxRQUF4QixFQUFrQ1UsSUFBbEMsQ0FBdUMsWUFBVTtBQUMvQyxjQUFJK2QsYUFBYTVmLEVBQUUsSUFBRixFQUFRZ1IsUUFBUixDQUFpQixJQUFqQixFQUF1QnZPLE1BQXhDO0FBQ0FrRSxnQkFBTWlaLGFBQWFqWixHQUFiLEdBQW1CaVosVUFBbkIsR0FBZ0NqWixHQUF0QztBQUNELFNBSEQ7O0FBS0FnWixlQUFPLFlBQVAsSUFBMEJoWixNQUFNLEtBQUswWCxVQUFMLENBQWdCLENBQWhCLEVBQW1CbFYscUJBQW5CLEdBQTJDTixNQUEzRTtBQUNBOFcsZUFBTyxXQUFQLElBQXlCLEtBQUt4ZSxRQUFMLENBQWMsQ0FBZCxFQUFpQmdJLHFCQUFqQixHQUF5Q0wsS0FBbEU7O0FBRUEsZUFBTzZXLE1BQVA7QUFDRDs7QUFFRDs7Ozs7QUFqVFc7QUFBQTtBQUFBLGdDQXFURDtBQUNSLGFBQUtILFFBQUw7QUFDQXRmLG1CQUFXcVEsSUFBWCxDQUFnQlUsSUFBaEIsQ0FBcUIsS0FBSzlQLFFBQTFCLEVBQW9DLFdBQXBDO0FBQ0EsYUFBS0EsUUFBTCxDQUFjMGUsTUFBZCxHQUNjeGMsSUFEZCxDQUNtQiw2Q0FEbkIsRUFDa0V5YyxNQURsRSxHQUVjeGIsR0FGZCxHQUVvQmpCLElBRnBCLENBRXlCLGdEQUZ6QixFQUUyRWtDLFdBRjNFLENBRXVGLDJDQUZ2RixFQUdjakIsR0FIZCxHQUdvQmpCLElBSHBCLENBR3lCLGdCQUh6QixFQUcyQzlCLFVBSDNDLENBR3NELDJCQUh0RCxFQUljdVUsR0FKZCxDQUlrQixlQUpsQixFQUltQ3hSLEdBSm5DLEdBSXlDd1IsR0FKekMsQ0FJNkMsY0FKN0M7QUFLQSxhQUFLM1UsUUFBTCxDQUFja0MsSUFBZCxDQUFtQixHQUFuQixFQUF3QnhCLElBQXhCLENBQTZCLFlBQVU7QUFDckMsY0FBSTJjLFFBQVF4ZSxFQUFFLElBQUYsQ0FBWjtBQUNBLGNBQUd3ZSxNQUFNcGQsSUFBTixDQUFXLFdBQVgsQ0FBSCxFQUEyQjtBQUN6Qm9kLGtCQUFNamUsSUFBTixDQUFXLE1BQVgsRUFBbUJpZSxNQUFNcGQsSUFBTixDQUFXLFdBQVgsQ0FBbkIsRUFBNENJLFVBQTVDLENBQXVELFdBQXZEO0FBQ0QsV0FGRCxNQUVLO0FBQUU7QUFBUztBQUNqQixTQUxEO0FBTUF0QixtQkFBV29CLGdCQUFYLENBQTRCLElBQTVCO0FBQ0Q7QUFwVVU7O0FBQUE7QUFBQTs7QUF1VWI0YyxZQUFVakgsUUFBVixHQUFxQjtBQUNuQjs7Ozs7QUFLQStILGdCQUFZLDZEQU5PO0FBT25COzs7OztBQUtBRyxhQUFTLGFBWlU7QUFhbkI7Ozs7O0FBS0FWLGdCQUFZLEtBbEJPO0FBbUJuQjs7Ozs7QUFLQWEsa0JBQWM7QUFDZDtBQXpCbUIsR0FBckI7O0FBNEJBO0FBQ0FwZixhQUFXTSxNQUFYLENBQWtCMGQsU0FBbEIsRUFBNkIsV0FBN0I7QUFFQyxDQXRXQSxDQXNXQ3JXLE1BdFdELENBQUQ7Q0NGQTs7Ozs7O0FBRUEsQ0FBQyxVQUFTN0gsQ0FBVCxFQUFZOztBQUViOzs7Ozs7OztBQUZhLE1BVVArZixRQVZPO0FBV1g7Ozs7Ozs7QUFPQSxzQkFBWTdYLE9BQVosRUFBcUJpSixPQUFyQixFQUE4QjtBQUFBOztBQUM1QixXQUFLaFEsUUFBTCxHQUFnQitHLE9BQWhCO0FBQ0EsV0FBS2lKLE9BQUwsR0FBZW5SLEVBQUVxTCxNQUFGLENBQVMsRUFBVCxFQUFhMFUsU0FBUzlJLFFBQXRCLEVBQWdDLEtBQUs5VixRQUFMLENBQWNDLElBQWQsRUFBaEMsRUFBc0QrUCxPQUF0RCxDQUFmO0FBQ0EsV0FBS3JQLEtBQUw7O0FBRUE1QixpQkFBV1ksY0FBWCxDQUEwQixJQUExQixFQUFnQyxVQUFoQztBQUNBWixpQkFBV21LLFFBQVgsQ0FBb0JzQixRQUFwQixDQUE2QixVQUE3QixFQUF5QztBQUN2QyxpQkFBUyxNQUQ4QjtBQUV2QyxpQkFBUyxNQUY4QjtBQUd2QyxrQkFBVSxPQUg2QjtBQUl2QyxlQUFPLGFBSmdDO0FBS3ZDLHFCQUFhO0FBTDBCLE9BQXpDO0FBT0Q7O0FBRUQ7Ozs7Ozs7QUFqQ1c7QUFBQTtBQUFBLDhCQXNDSDtBQUNOLFlBQUlxVSxNQUFNLEtBQUs3ZSxRQUFMLENBQWNaLElBQWQsQ0FBbUIsSUFBbkIsQ0FBVjs7QUFFQSxhQUFLMGYsT0FBTCxHQUFlamdCLHFCQUFtQmdnQixHQUFuQixZQUErQmhnQixtQkFBaUJnZ0IsR0FBakIsUUFBOUM7QUFDQSxhQUFLQyxPQUFMLENBQWExZixJQUFiLENBQWtCO0FBQ2hCLDJCQUFpQnlmLEdBREQ7QUFFaEIsMkJBQWlCLEtBRkQ7QUFHaEIsMkJBQWlCQSxHQUhEO0FBSWhCLDJCQUFpQixJQUpEO0FBS2hCLDJCQUFpQjs7QUFMRCxTQUFsQjs7QUFTQSxhQUFLN08sT0FBTCxDQUFhK08sYUFBYixHQUE2QixLQUFLQyxnQkFBTCxFQUE3QjtBQUNBLGFBQUtDLE9BQUwsR0FBZSxDQUFmO0FBQ0EsYUFBS0MsYUFBTCxHQUFxQixFQUFyQjtBQUNBLGFBQUtsZixRQUFMLENBQWNaLElBQWQsQ0FBbUI7QUFDakIseUJBQWUsTUFERTtBQUVqQiwyQkFBaUJ5ZixHQUZBO0FBR2pCLHlCQUFlQSxHQUhFO0FBSWpCLDZCQUFtQixLQUFLQyxPQUFMLENBQWEsQ0FBYixFQUFnQnRTLEVBQWhCLElBQXNCek4sV0FBV2dCLFdBQVgsQ0FBdUIsQ0FBdkIsRUFBMEIsV0FBMUI7QUFKeEIsU0FBbkI7QUFNQSxhQUFLaVcsT0FBTDtBQUNEOztBQUVEOzs7Ozs7QUEvRFc7QUFBQTtBQUFBLHlDQW9FUTtBQUNqQixZQUFJbUosbUJBQW1CLEtBQUtuZixRQUFMLENBQWMsQ0FBZCxFQUFpQlQsU0FBakIsQ0FBMkI2ZixLQUEzQixDQUFpQywwQkFBakMsQ0FBdkI7QUFDSUQsMkJBQW1CQSxtQkFBbUJBLGlCQUFpQixDQUFqQixDQUFuQixHQUF5QyxFQUE1RDtBQUNKLFlBQUlFLHFCQUFxQixlQUFlaFosSUFBZixDQUFvQixLQUFLeVksT0FBTCxDQUFhLENBQWIsRUFBZ0J2ZixTQUFwQyxDQUF6QjtBQUNJOGYsNkJBQXFCQSxxQkFBcUJBLG1CQUFtQixDQUFuQixDQUFyQixHQUE2QyxFQUFsRTtBQUNKLFlBQUkzVyxXQUFXMlcscUJBQXFCQSxxQkFBcUIsR0FBckIsR0FBMkJGLGdCQUFoRCxHQUFtRUEsZ0JBQWxGO0FBQ0EsZUFBT3pXLFFBQVA7QUFDRDs7QUFFRDs7Ozs7OztBQTdFVztBQUFBO0FBQUEsa0NBbUZDQSxRQW5GRCxFQW1GVztBQUNwQixhQUFLd1csYUFBTCxDQUFtQjFoQixJQUFuQixDQUF3QmtMLFdBQVdBLFFBQVgsR0FBc0IsUUFBOUM7QUFDQTtBQUNBLFlBQUcsQ0FBQ0EsUUFBRCxJQUFjLEtBQUt3VyxhQUFMLENBQW1CL2hCLE9BQW5CLENBQTJCLEtBQTNCLElBQW9DLENBQXJELEVBQXdEO0FBQ3RELGVBQUs2QyxRQUFMLENBQWM2TyxRQUFkLENBQXVCLEtBQXZCO0FBQ0QsU0FGRCxNQUVNLElBQUduRyxhQUFhLEtBQWIsSUFBdUIsS0FBS3dXLGFBQUwsQ0FBbUIvaEIsT0FBbkIsQ0FBMkIsUUFBM0IsSUFBdUMsQ0FBakUsRUFBb0U7QUFDeEUsZUFBSzZDLFFBQUwsQ0FBY29FLFdBQWQsQ0FBMEJzRSxRQUExQjtBQUNELFNBRkssTUFFQSxJQUFHQSxhQUFhLE1BQWIsSUFBd0IsS0FBS3dXLGFBQUwsQ0FBbUIvaEIsT0FBbkIsQ0FBMkIsT0FBM0IsSUFBc0MsQ0FBakUsRUFBb0U7QUFDeEUsZUFBSzZDLFFBQUwsQ0FBY29FLFdBQWQsQ0FBMEJzRSxRQUExQixFQUNLbUcsUUFETCxDQUNjLE9BRGQ7QUFFRCxTQUhLLE1BR0EsSUFBR25HLGFBQWEsT0FBYixJQUF5QixLQUFLd1csYUFBTCxDQUFtQi9oQixPQUFuQixDQUEyQixNQUEzQixJQUFxQyxDQUFqRSxFQUFvRTtBQUN4RSxlQUFLNkMsUUFBTCxDQUFjb0UsV0FBZCxDQUEwQnNFLFFBQTFCLEVBQ0ttRyxRQURMLENBQ2MsTUFEZDtBQUVEOztBQUVEO0FBTE0sYUFNRCxJQUFHLENBQUNuRyxRQUFELElBQWMsS0FBS3dXLGFBQUwsQ0FBbUIvaEIsT0FBbkIsQ0FBMkIsS0FBM0IsSUFBb0MsQ0FBQyxDQUFuRCxJQUEwRCxLQUFLK2hCLGFBQUwsQ0FBbUIvaEIsT0FBbkIsQ0FBMkIsTUFBM0IsSUFBcUMsQ0FBbEcsRUFBcUc7QUFDeEcsaUJBQUs2QyxRQUFMLENBQWM2TyxRQUFkLENBQXVCLE1BQXZCO0FBQ0QsV0FGSSxNQUVDLElBQUduRyxhQUFhLEtBQWIsSUFBdUIsS0FBS3dXLGFBQUwsQ0FBbUIvaEIsT0FBbkIsQ0FBMkIsUUFBM0IsSUFBdUMsQ0FBQyxDQUEvRCxJQUFzRSxLQUFLK2hCLGFBQUwsQ0FBbUIvaEIsT0FBbkIsQ0FBMkIsTUFBM0IsSUFBcUMsQ0FBOUcsRUFBaUg7QUFDckgsaUJBQUs2QyxRQUFMLENBQWNvRSxXQUFkLENBQTBCc0UsUUFBMUIsRUFDS21HLFFBREwsQ0FDYyxNQURkO0FBRUQsV0FISyxNQUdBLElBQUduRyxhQUFhLE1BQWIsSUFBd0IsS0FBS3dXLGFBQUwsQ0FBbUIvaEIsT0FBbkIsQ0FBMkIsT0FBM0IsSUFBc0MsQ0FBQyxDQUEvRCxJQUFzRSxLQUFLK2hCLGFBQUwsQ0FBbUIvaEIsT0FBbkIsQ0FBMkIsUUFBM0IsSUFBdUMsQ0FBaEgsRUFBbUg7QUFDdkgsaUJBQUs2QyxRQUFMLENBQWNvRSxXQUFkLENBQTBCc0UsUUFBMUI7QUFDRCxXQUZLLE1BRUEsSUFBR0EsYUFBYSxPQUFiLElBQXlCLEtBQUt3VyxhQUFMLENBQW1CL2hCLE9BQW5CLENBQTJCLE1BQTNCLElBQXFDLENBQUMsQ0FBL0QsSUFBc0UsS0FBSytoQixhQUFMLENBQW1CL2hCLE9BQW5CLENBQTJCLFFBQTNCLElBQXVDLENBQWhILEVBQW1IO0FBQ3ZILGlCQUFLNkMsUUFBTCxDQUFjb0UsV0FBZCxDQUEwQnNFLFFBQTFCO0FBQ0Q7QUFDRDtBQUhNLGVBSUY7QUFDRixtQkFBSzFJLFFBQUwsQ0FBY29FLFdBQWQsQ0FBMEJzRSxRQUExQjtBQUNEO0FBQ0QsYUFBSzRXLFlBQUwsR0FBb0IsSUFBcEI7QUFDQSxhQUFLTCxPQUFMO0FBQ0Q7O0FBRUQ7Ozs7Ozs7QUFySFc7QUFBQTtBQUFBLHFDQTJISTtBQUNiLFlBQUcsS0FBS0gsT0FBTCxDQUFhMWYsSUFBYixDQUFrQixlQUFsQixNQUF1QyxPQUExQyxFQUFrRDtBQUFFLGlCQUFPLEtBQVA7QUFBZTtBQUNuRSxZQUFJc0osV0FBVyxLQUFLc1csZ0JBQUwsRUFBZjtBQUFBLFlBQ0lsVyxXQUFXL0osV0FBVzRILEdBQVgsQ0FBZUUsYUFBZixDQUE2QixLQUFLN0csUUFBbEMsQ0FEZjtBQUFBLFlBRUkrSSxjQUFjaEssV0FBVzRILEdBQVgsQ0FBZUUsYUFBZixDQUE2QixLQUFLaVksT0FBbEMsQ0FGbEI7QUFBQSxZQUdJbGUsUUFBUSxJQUhaO0FBQUEsWUFJSTJlLFlBQWE3VyxhQUFhLE1BQWIsR0FBc0IsTUFBdEIsR0FBaUNBLGFBQWEsT0FBZCxHQUF5QixNQUF6QixHQUFrQyxLQUpuRjtBQUFBLFlBS0kwRSxRQUFTbVMsY0FBYyxLQUFmLEdBQXdCLFFBQXhCLEdBQW1DLE9BTC9DO0FBQUEsWUFNSTlYLFNBQVUyRixVQUFVLFFBQVgsR0FBdUIsS0FBSzRDLE9BQUwsQ0FBYXJILE9BQXBDLEdBQThDLEtBQUtxSCxPQUFMLENBQWFwSCxPQU54RTs7QUFVQSxZQUFJRSxTQUFTbkIsS0FBVCxJQUFrQm1CLFNBQVNsQixVQUFULENBQW9CRCxLQUF2QyxJQUFrRCxDQUFDLEtBQUtzWCxPQUFOLElBQWlCLENBQUNsZ0IsV0FBVzRILEdBQVgsQ0FBZUMsZ0JBQWYsQ0FBZ0MsS0FBSzVHLFFBQXJDLENBQXZFLEVBQXVIO0FBQ3JILGVBQUtBLFFBQUwsQ0FBY3lILE1BQWQsQ0FBcUIxSSxXQUFXNEgsR0FBWCxDQUFlRyxVQUFmLENBQTBCLEtBQUs5RyxRQUEvQixFQUF5QyxLQUFLOGUsT0FBOUMsRUFBdUQsZUFBdkQsRUFBd0UsS0FBSzlPLE9BQUwsQ0FBYXJILE9BQXJGLEVBQThGLEtBQUtxSCxPQUFMLENBQWFwSCxPQUEzRyxFQUFvSCxJQUFwSCxDQUFyQixFQUFnSnlDLEdBQWhKLENBQW9KO0FBQ2xKLHFCQUFTdkMsU0FBU2xCLFVBQVQsQ0FBb0JELEtBQXBCLEdBQTZCLEtBQUtxSSxPQUFMLENBQWFwSCxPQUFiLEdBQXVCLENBRHFGO0FBRWxKLHNCQUFVO0FBRndJLFdBQXBKO0FBSUEsZUFBSzBXLFlBQUwsR0FBb0IsSUFBcEI7QUFDQSxpQkFBTyxLQUFQO0FBQ0Q7O0FBRUQsYUFBS3RmLFFBQUwsQ0FBY3lILE1BQWQsQ0FBcUIxSSxXQUFXNEgsR0FBWCxDQUFlRyxVQUFmLENBQTBCLEtBQUs5RyxRQUEvQixFQUF5QyxLQUFLOGUsT0FBOUMsRUFBdURwVyxRQUF2RCxFQUFpRSxLQUFLc0gsT0FBTCxDQUFhckgsT0FBOUUsRUFBdUYsS0FBS3FILE9BQUwsQ0FBYXBILE9BQXBHLENBQXJCOztBQUVBLGVBQU0sQ0FBQzdKLFdBQVc0SCxHQUFYLENBQWVDLGdCQUFmLENBQWdDLEtBQUs1RyxRQUFyQyxFQUErQyxLQUEvQyxFQUFzRCxJQUF0RCxDQUFELElBQWdFLEtBQUtpZixPQUEzRSxFQUFtRjtBQUNqRixlQUFLTyxXQUFMLENBQWlCOVcsUUFBakI7QUFDQSxlQUFLK1csWUFBTDtBQUNEO0FBQ0Y7O0FBRUQ7Ozs7OztBQXhKVztBQUFBO0FBQUEsZ0NBNkpEO0FBQ1IsWUFBSTdlLFFBQVEsSUFBWjtBQUNBLGFBQUtaLFFBQUwsQ0FBY2lNLEVBQWQsQ0FBaUI7QUFDZiw2QkFBbUIsS0FBS3NRLElBQUwsQ0FBVTNXLElBQVYsQ0FBZSxJQUFmLENBREo7QUFFZiw4QkFBb0IsS0FBSzRXLEtBQUwsQ0FBVzVXLElBQVgsQ0FBZ0IsSUFBaEIsQ0FGTDtBQUdmLCtCQUFxQixLQUFLaVYsTUFBTCxDQUFZalYsSUFBWixDQUFpQixJQUFqQixDQUhOO0FBSWYsaUNBQXVCLEtBQUs2WixZQUFMLENBQWtCN1osSUFBbEIsQ0FBdUIsSUFBdkI7QUFKUixTQUFqQjs7QUFPQSxZQUFHLEtBQUtvSyxPQUFMLENBQWEwUCxLQUFoQixFQUFzQjtBQUNwQixlQUFLWixPQUFMLENBQWFuSyxHQUFiLENBQWlCLCtDQUFqQixFQUNLMUksRUFETCxDQUNRLHdCQURSLEVBQ2tDLFlBQVU7QUFDdEM1UCx5QkFBYXVFLE1BQU0rZSxPQUFuQjtBQUNBL2Usa0JBQU0rZSxPQUFOLEdBQWdCempCLFdBQVcsWUFBVTtBQUNuQzBFLG9CQUFNMmIsSUFBTjtBQUNBM2Isb0JBQU1rZSxPQUFOLENBQWM3ZSxJQUFkLENBQW1CLE9BQW5CLEVBQTRCLElBQTVCO0FBQ0QsYUFIZSxFQUdiVyxNQUFNb1AsT0FBTixDQUFjNFAsVUFIRCxDQUFoQjtBQUlELFdBUEwsRUFPTzNULEVBUFAsQ0FPVSx3QkFQVixFQU9vQyxZQUFVO0FBQ3hDNVAseUJBQWF1RSxNQUFNK2UsT0FBbkI7QUFDQS9lLGtCQUFNK2UsT0FBTixHQUFnQnpqQixXQUFXLFlBQVU7QUFDbkMwRSxvQkFBTTRiLEtBQU47QUFDQTViLG9CQUFNa2UsT0FBTixDQUFjN2UsSUFBZCxDQUFtQixPQUFuQixFQUE0QixLQUE1QjtBQUNELGFBSGUsRUFHYlcsTUFBTW9QLE9BQU4sQ0FBYzRQLFVBSEQsQ0FBaEI7QUFJRCxXQWJMO0FBY0EsY0FBRyxLQUFLNVAsT0FBTCxDQUFhNlAsU0FBaEIsRUFBMEI7QUFDeEIsaUJBQUs3ZixRQUFMLENBQWMyVSxHQUFkLENBQWtCLCtDQUFsQixFQUNLMUksRUFETCxDQUNRLHdCQURSLEVBQ2tDLFlBQVU7QUFDdEM1UCwyQkFBYXVFLE1BQU0rZSxPQUFuQjtBQUNELGFBSEwsRUFHTzFULEVBSFAsQ0FHVSx3QkFIVixFQUdvQyxZQUFVO0FBQ3hDNVAsMkJBQWF1RSxNQUFNK2UsT0FBbkI7QUFDQS9lLG9CQUFNK2UsT0FBTixHQUFnQnpqQixXQUFXLFlBQVU7QUFDbkMwRSxzQkFBTTRiLEtBQU47QUFDQTViLHNCQUFNa2UsT0FBTixDQUFjN2UsSUFBZCxDQUFtQixPQUFuQixFQUE0QixLQUE1QjtBQUNELGVBSGUsRUFHYlcsTUFBTW9QLE9BQU4sQ0FBYzRQLFVBSEQsQ0FBaEI7QUFJRCxhQVRMO0FBVUQ7QUFDRjtBQUNELGFBQUtkLE9BQUwsQ0FBYWpDLEdBQWIsQ0FBaUIsS0FBSzdjLFFBQXRCLEVBQWdDaU0sRUFBaEMsQ0FBbUMscUJBQW5DLEVBQTBELFVBQVN4SixDQUFULEVBQVk7O0FBRXBFLGNBQUkyUyxVQUFVdlcsRUFBRSxJQUFGLENBQWQ7QUFBQSxjQUNFaWhCLDJCQUEyQi9nQixXQUFXbUssUUFBWCxDQUFvQm1CLGFBQXBCLENBQWtDekosTUFBTVosUUFBeEMsQ0FEN0I7O0FBR0FqQixxQkFBV21LLFFBQVgsQ0FBb0JTLFNBQXBCLENBQThCbEgsQ0FBOUIsRUFBaUMsVUFBakMsRUFBNkM7QUFDM0NzZCx5QkFBYSxZQUFXO0FBQ3RCLGtCQUFJbmYsTUFBTVosUUFBTixDQUFla0MsSUFBZixDQUFvQixRQUFwQixFQUE4QnFJLEVBQTlCLENBQWlDdVYseUJBQXlCclIsRUFBekIsQ0FBNEIsQ0FBQyxDQUE3QixDQUFqQyxDQUFKLEVBQXVFO0FBQUU7QUFDdkUsb0JBQUk3TixNQUFNb1AsT0FBTixDQUFjZ1EsU0FBbEIsRUFBNkI7QUFBRTtBQUM3QkYsMkNBQXlCclIsRUFBekIsQ0FBNEIsQ0FBNUIsRUFBK0J1TSxLQUEvQjtBQUNBdlksb0JBQUV1TyxjQUFGO0FBQ0QsaUJBSEQsTUFHTztBQUFFO0FBQ1BwUSx3QkFBTTRiLEtBQU47QUFDRDtBQUNGO0FBQ0YsYUFWMEM7QUFXM0N5RCwwQkFBYyxZQUFXO0FBQ3ZCLGtCQUFJcmYsTUFBTVosUUFBTixDQUFla0MsSUFBZixDQUFvQixRQUFwQixFQUE4QnFJLEVBQTlCLENBQWlDdVYseUJBQXlCclIsRUFBekIsQ0FBNEIsQ0FBNUIsQ0FBakMsS0FBb0U3TixNQUFNWixRQUFOLENBQWV1SyxFQUFmLENBQWtCLFFBQWxCLENBQXhFLEVBQXFHO0FBQUU7QUFDckcsb0JBQUkzSixNQUFNb1AsT0FBTixDQUFjZ1EsU0FBbEIsRUFBNkI7QUFBRTtBQUM3QkYsMkNBQXlCclIsRUFBekIsQ0FBNEIsQ0FBQyxDQUE3QixFQUFnQ3VNLEtBQWhDO0FBQ0F2WSxvQkFBRXVPLGNBQUY7QUFDRCxpQkFIRCxNQUdPO0FBQUU7QUFDUHBRLHdCQUFNNGIsS0FBTjtBQUNEO0FBQ0Y7QUFDRixhQXBCMEM7QUFxQjNDRCxrQkFBTSxZQUFXO0FBQ2Ysa0JBQUluSCxRQUFRN0ssRUFBUixDQUFXM0osTUFBTWtlLE9BQWpCLENBQUosRUFBK0I7QUFDN0JsZSxzQkFBTTJiLElBQU47QUFDQTNiLHNCQUFNWixRQUFOLENBQWVaLElBQWYsQ0FBb0IsVUFBcEIsRUFBZ0MsQ0FBQyxDQUFqQyxFQUFvQzRiLEtBQXBDO0FBQ0F2WSxrQkFBRXVPLGNBQUY7QUFDRDtBQUNGLGFBM0IwQztBQTRCM0N3TCxtQkFBTyxZQUFXO0FBQ2hCNWIsb0JBQU00YixLQUFOO0FBQ0E1YixvQkFBTWtlLE9BQU4sQ0FBYzlELEtBQWQ7QUFDRDtBQS9CMEMsV0FBN0M7QUFpQ0QsU0F0Q0Q7QUF1Q0Q7O0FBRUQ7Ozs7OztBQTNPVztBQUFBO0FBQUEsd0NBZ1BPO0FBQ2YsWUFBSW9ELFFBQVF2ZixFQUFFYixTQUFTOUMsSUFBWCxFQUFpQjJaLEdBQWpCLENBQXFCLEtBQUs3VSxRQUExQixDQUFaO0FBQUEsWUFDSVksUUFBUSxJQURaO0FBRUF3ZCxjQUFNekosR0FBTixDQUFVLG1CQUFWLEVBQ00xSSxFQUROLENBQ1MsbUJBRFQsRUFDOEIsVUFBU3hKLENBQVQsRUFBVztBQUNsQyxjQUFHN0IsTUFBTWtlLE9BQU4sQ0FBY3ZVLEVBQWQsQ0FBaUI5SCxFQUFFN0YsTUFBbkIsS0FBOEJnRSxNQUFNa2UsT0FBTixDQUFjNWMsSUFBZCxDQUFtQk8sRUFBRTdGLE1BQXJCLEVBQTZCMEUsTUFBOUQsRUFBc0U7QUFDcEU7QUFDRDtBQUNELGNBQUdWLE1BQU1aLFFBQU4sQ0FBZWtDLElBQWYsQ0FBb0JPLEVBQUU3RixNQUF0QixFQUE4QjBFLE1BQWpDLEVBQXlDO0FBQ3ZDO0FBQ0Q7QUFDRFYsZ0JBQU00YixLQUFOO0FBQ0E0QixnQkFBTXpKLEdBQU4sQ0FBVSxtQkFBVjtBQUNELFNBVk47QUFXRjs7QUFFRDs7Ozs7OztBQWhRVztBQUFBO0FBQUEsNkJBc1FKO0FBQ0w7QUFDQTs7OztBQUlBLGFBQUszVSxRQUFMLENBQWNFLE9BQWQsQ0FBc0IscUJBQXRCLEVBQTZDLEtBQUtGLFFBQUwsQ0FBY1osSUFBZCxDQUFtQixJQUFuQixDQUE3QztBQUNBLGFBQUswZixPQUFMLENBQWFqUSxRQUFiLENBQXNCLE9BQXRCLEVBQ0t6UCxJQURMLENBQ1UsRUFBQyxpQkFBaUIsSUFBbEIsRUFEVjtBQUVBO0FBQ0EsYUFBS3FnQixZQUFMO0FBQ0EsYUFBS3pmLFFBQUwsQ0FBYzZPLFFBQWQsQ0FBdUIsU0FBdkIsRUFDS3pQLElBREwsQ0FDVSxFQUFDLGVBQWUsS0FBaEIsRUFEVjs7QUFHQSxZQUFHLEtBQUs0USxPQUFMLENBQWFrUSxTQUFoQixFQUEwQjtBQUN4QixjQUFJQyxhQUFhcGhCLFdBQVdtSyxRQUFYLENBQW9CbUIsYUFBcEIsQ0FBa0MsS0FBS3JLLFFBQXZDLENBQWpCO0FBQ0EsY0FBR21nQixXQUFXN2UsTUFBZCxFQUFxQjtBQUNuQjZlLHVCQUFXMVIsRUFBWCxDQUFjLENBQWQsRUFBaUJ1TSxLQUFqQjtBQUNEO0FBQ0Y7O0FBRUQsWUFBRyxLQUFLaEwsT0FBTCxDQUFhbU8sWUFBaEIsRUFBNkI7QUFBRSxlQUFLaUMsZUFBTDtBQUF5Qjs7QUFFeEQ7Ozs7QUFJQSxhQUFLcGdCLFFBQUwsQ0FBY0UsT0FBZCxDQUFzQixrQkFBdEIsRUFBMEMsQ0FBQyxLQUFLRixRQUFOLENBQTFDO0FBQ0Q7O0FBRUQ7Ozs7OztBQXBTVztBQUFBO0FBQUEsOEJBeVNIO0FBQ04sWUFBRyxDQUFDLEtBQUtBLFFBQUwsQ0FBYzBhLFFBQWQsQ0FBdUIsU0FBdkIsQ0FBSixFQUFzQztBQUNwQyxpQkFBTyxLQUFQO0FBQ0Q7QUFDRCxhQUFLMWEsUUFBTCxDQUFjb0UsV0FBZCxDQUEwQixTQUExQixFQUNLaEYsSUFETCxDQUNVLEVBQUMsZUFBZSxJQUFoQixFQURWOztBQUdBLGFBQUswZixPQUFMLENBQWExYSxXQUFiLENBQXlCLE9BQXpCLEVBQ0toRixJQURMLENBQ1UsZUFEVixFQUMyQixLQUQzQjs7QUFHQSxZQUFHLEtBQUtrZ0IsWUFBUixFQUFxQjtBQUNuQixjQUFJZSxtQkFBbUIsS0FBS3JCLGdCQUFMLEVBQXZCO0FBQ0EsY0FBR3FCLGdCQUFILEVBQW9CO0FBQ2xCLGlCQUFLcmdCLFFBQUwsQ0FBY29FLFdBQWQsQ0FBMEJpYyxnQkFBMUI7QUFDRDtBQUNELGVBQUtyZ0IsUUFBTCxDQUFjNk8sUUFBZCxDQUF1QixLQUFLbUIsT0FBTCxDQUFhK08sYUFBcEM7QUFDSSxxQkFESixDQUNnQjFULEdBRGhCLENBQ29CLEVBQUMzRCxRQUFRLEVBQVQsRUFBYUMsT0FBTyxFQUFwQixFQURwQjtBQUVBLGVBQUsyWCxZQUFMLEdBQW9CLEtBQXBCO0FBQ0EsZUFBS0wsT0FBTCxHQUFlLENBQWY7QUFDQSxlQUFLQyxhQUFMLENBQW1CNWQsTUFBbkIsR0FBNEIsQ0FBNUI7QUFDRDtBQUNELGFBQUt0QixRQUFMLENBQWNFLE9BQWQsQ0FBc0Isa0JBQXRCLEVBQTBDLENBQUMsS0FBS0YsUUFBTixDQUExQztBQUNEOztBQUVEOzs7OztBQWpVVztBQUFBO0FBQUEsK0JBcVVGO0FBQ1AsWUFBRyxLQUFLQSxRQUFMLENBQWMwYSxRQUFkLENBQXVCLFNBQXZCLENBQUgsRUFBcUM7QUFDbkMsY0FBRyxLQUFLb0UsT0FBTCxDQUFhN2UsSUFBYixDQUFrQixPQUFsQixDQUFILEVBQStCO0FBQy9CLGVBQUt1YyxLQUFMO0FBQ0QsU0FIRCxNQUdLO0FBQ0gsZUFBS0QsSUFBTDtBQUNEO0FBQ0Y7O0FBRUQ7Ozs7O0FBOVVXO0FBQUE7QUFBQSxnQ0FrVkQ7QUFDUixhQUFLdmMsUUFBTCxDQUFjMlUsR0FBZCxDQUFrQixhQUFsQixFQUFpQ3pGLElBQWpDO0FBQ0EsYUFBSzRQLE9BQUwsQ0FBYW5LLEdBQWIsQ0FBaUIsY0FBakI7O0FBRUE1VixtQkFBV29CLGdCQUFYLENBQTRCLElBQTVCO0FBQ0Q7QUF2VlU7O0FBQUE7QUFBQTs7QUEwVmJ5ZSxXQUFTOUksUUFBVCxHQUFvQjtBQUNsQjs7Ozs7QUFLQThKLGdCQUFZLEdBTk07QUFPbEI7Ozs7O0FBS0FGLFdBQU8sS0FaVztBQWFsQjs7Ozs7QUFLQUcsZUFBVyxLQWxCTztBQW1CbEI7Ozs7O0FBS0FsWCxhQUFTLENBeEJTO0FBeUJsQjs7Ozs7QUFLQUMsYUFBUyxDQTlCUztBQStCbEI7Ozs7O0FBS0FtVyxtQkFBZSxFQXBDRztBQXFDbEI7Ozs7O0FBS0FpQixlQUFXLEtBMUNPO0FBMkNsQjs7Ozs7QUFLQUUsZUFBVyxLQWhETztBQWlEbEI7Ozs7O0FBS0EvQixrQkFBYztBQXRESSxHQUFwQjs7QUF5REE7QUFDQXBmLGFBQVdNLE1BQVgsQ0FBa0J1ZixRQUFsQixFQUE0QixVQUE1QjtBQUVDLENBdFpBLENBc1pDbFksTUF0WkQsQ0FBRDtDQ0ZBOzs7Ozs7QUFFQSxDQUFDLFVBQVM3SCxDQUFULEVBQVk7O0FBRWI7Ozs7Ozs7O0FBRmEsTUFVUHloQixZQVZPO0FBV1g7Ozs7Ozs7QUFPQSwwQkFBWXZaLE9BQVosRUFBcUJpSixPQUFyQixFQUE4QjtBQUFBOztBQUM1QixXQUFLaFEsUUFBTCxHQUFnQitHLE9BQWhCO0FBQ0EsV0FBS2lKLE9BQUwsR0FBZW5SLEVBQUVxTCxNQUFGLENBQVMsRUFBVCxFQUFhb1csYUFBYXhLLFFBQTFCLEVBQW9DLEtBQUs5VixRQUFMLENBQWNDLElBQWQsRUFBcEMsRUFBMEQrUCxPQUExRCxDQUFmOztBQUVBalIsaUJBQVdxUSxJQUFYLENBQWdCQyxPQUFoQixDQUF3QixLQUFLclAsUUFBN0IsRUFBdUMsVUFBdkM7QUFDQSxXQUFLVyxLQUFMOztBQUVBNUIsaUJBQVdZLGNBQVgsQ0FBMEIsSUFBMUIsRUFBZ0MsY0FBaEM7QUFDQVosaUJBQVdtSyxRQUFYLENBQW9Cc0IsUUFBcEIsQ0FBNkIsY0FBN0IsRUFBNkM7QUFDM0MsaUJBQVMsTUFEa0M7QUFFM0MsaUJBQVMsTUFGa0M7QUFHM0MsdUJBQWUsTUFINEI7QUFJM0Msb0JBQVksSUFKK0I7QUFLM0Msc0JBQWMsTUFMNkI7QUFNM0Msc0JBQWMsVUFONkI7QUFPM0Msa0JBQVU7QUFQaUMsT0FBN0M7QUFTRDs7QUFFRDs7Ozs7OztBQXJDVztBQUFBO0FBQUEsOEJBMENIO0FBQ04sWUFBSStWLE9BQU8sS0FBS3ZnQixRQUFMLENBQWNrQyxJQUFkLENBQW1CLCtCQUFuQixDQUFYO0FBQ0EsYUFBS2xDLFFBQUwsQ0FBYzZQLFFBQWQsQ0FBdUIsNkJBQXZCLEVBQXNEQSxRQUF0RCxDQUErRCxzQkFBL0QsRUFBdUZoQixRQUF2RixDQUFnRyxXQUFoRzs7QUFFQSxhQUFLcU8sVUFBTCxHQUFrQixLQUFLbGQsUUFBTCxDQUFja0MsSUFBZCxDQUFtQixtQkFBbkIsQ0FBbEI7QUFDQSxhQUFLaVksS0FBTCxHQUFhLEtBQUtuYSxRQUFMLENBQWM2UCxRQUFkLENBQXVCLG1CQUF2QixDQUFiO0FBQ0EsYUFBS3NLLEtBQUwsQ0FBV2pZLElBQVgsQ0FBZ0Isd0JBQWhCLEVBQTBDMk0sUUFBMUMsQ0FBbUQsS0FBS21CLE9BQUwsQ0FBYXdRLGFBQWhFOztBQUVBLFlBQUksS0FBS3hnQixRQUFMLENBQWMwYSxRQUFkLENBQXVCLEtBQUsxSyxPQUFMLENBQWF5USxVQUFwQyxLQUFtRCxLQUFLelEsT0FBTCxDQUFhMFEsU0FBYixLQUEyQixPQUE5RSxJQUF5RjNoQixXQUFXSSxHQUFYLEVBQXpGLElBQTZHLEtBQUthLFFBQUwsQ0FBY3NjLE9BQWQsQ0FBc0IsZ0JBQXRCLEVBQXdDL1IsRUFBeEMsQ0FBMkMsR0FBM0MsQ0FBakgsRUFBa0s7QUFDaEssZUFBS3lGLE9BQUwsQ0FBYTBRLFNBQWIsR0FBeUIsT0FBekI7QUFDQUgsZUFBSzFSLFFBQUwsQ0FBYyxZQUFkO0FBQ0QsU0FIRCxNQUdPO0FBQ0wwUixlQUFLMVIsUUFBTCxDQUFjLGFBQWQ7QUFDRDtBQUNELGFBQUs4UixPQUFMLEdBQWUsS0FBZjtBQUNBLGFBQUszSyxPQUFMO0FBQ0Q7QUExRFU7QUFBQTs7QUEyRFg7Ozs7O0FBM0RXLGdDQWdFRDtBQUNSLFlBQUlwVixRQUFRLElBQVo7QUFBQSxZQUNJZ2dCLFdBQVcsa0JBQWtCN2xCLE1BQWxCLElBQTZCLE9BQU9BLE9BQU84bEIsWUFBZCxLQUErQixXQUQzRTtBQUFBLFlBRUlDLFdBQVcsNEJBRmY7O0FBSUEsWUFBSSxLQUFLOVEsT0FBTCxDQUFhK1EsU0FBYixJQUEwQkgsUUFBOUIsRUFBd0M7QUFDdEMsZUFBSzFELFVBQUwsQ0FBZ0JqUixFQUFoQixDQUFtQixrREFBbkIsRUFBdUUsVUFBU3hKLENBQVQsRUFBWTtBQUNqRixnQkFBSVIsUUFBUXBELEVBQUU0RCxFQUFFN0YsTUFBSixFQUFZZ2dCLFlBQVosQ0FBeUIsSUFBekIsUUFBbUNrRSxRQUFuQyxDQUFaO0FBQUEsZ0JBQ0lFLFNBQVMvZSxNQUFNeVksUUFBTixDQUFlb0csUUFBZixDQURiO0FBQUEsZ0JBRUlHLGFBQWFoZixNQUFNN0MsSUFBTixDQUFXLGVBQVgsTUFBZ0MsTUFGakQ7QUFBQSxnQkFHSXdRLE9BQU8zTixNQUFNNE4sUUFBTixDQUFlLHNCQUFmLENBSFg7O0FBS0EsZ0JBQUltUixNQUFKLEVBQVk7QUFDVixrQkFBSUMsVUFBSixFQUFnQjtBQUNkLG9CQUFJLENBQUNyZ0IsTUFBTW9QLE9BQU4sQ0FBY21PLFlBQWYsSUFBZ0MsQ0FBQ3ZkLE1BQU1vUCxPQUFOLENBQWMrUSxTQUFmLElBQTRCLENBQUNILFFBQTdELElBQTJFaGdCLE1BQU1vUCxPQUFOLENBQWNrUixXQUFkLElBQTZCTixRQUE1RyxFQUF1SDtBQUFFO0FBQVMsaUJBQWxJLE1BQ0s7QUFDSG5lLG9CQUFFa2Esd0JBQUY7QUFDQWxhLG9CQUFFdU8sY0FBRjtBQUNBcFEsd0JBQU0wZCxLQUFOLENBQVlyYyxLQUFaO0FBQ0Q7QUFDRixlQVBELE1BT087QUFDTFEsa0JBQUV1TyxjQUFGO0FBQ0F2TyxrQkFBRWthLHdCQUFGO0FBQ0EvYixzQkFBTXNkLEtBQU4sQ0FBWWpjLE1BQU00TixRQUFOLENBQWUsc0JBQWYsQ0FBWjtBQUNBNU4sc0JBQU00YSxHQUFOLENBQVU1YSxNQUFNMmEsWUFBTixDQUFtQmhjLE1BQU1aLFFBQXpCLFFBQXVDOGdCLFFBQXZDLENBQVYsRUFBOEQxaEIsSUFBOUQsQ0FBbUUsZUFBbkUsRUFBb0YsSUFBcEY7QUFDRDtBQUNGLGFBZEQsTUFjTztBQUFFO0FBQVM7QUFDbkIsV0FyQkQ7QUFzQkQ7O0FBRUQsWUFBSSxDQUFDLEtBQUs0USxPQUFMLENBQWFtUixZQUFsQixFQUFnQztBQUM5QixlQUFLakUsVUFBTCxDQUFnQmpSLEVBQWhCLENBQW1CLDRCQUFuQixFQUFpRCxVQUFTeEosQ0FBVCxFQUFZO0FBQzNEQSxjQUFFa2Esd0JBQUY7QUFDQSxnQkFBSTFhLFFBQVFwRCxFQUFFLElBQUYsQ0FBWjtBQUFBLGdCQUNJbWlCLFNBQVMvZSxNQUFNeVksUUFBTixDQUFlb0csUUFBZixDQURiOztBQUdBLGdCQUFJRSxNQUFKLEVBQVk7QUFDVjNrQiwyQkFBYXVFLE1BQU04QyxLQUFuQjtBQUNBOUMsb0JBQU04QyxLQUFOLEdBQWN4SCxXQUFXLFlBQVc7QUFDbEMwRSxzQkFBTXNkLEtBQU4sQ0FBWWpjLE1BQU00TixRQUFOLENBQWUsc0JBQWYsQ0FBWjtBQUNELGVBRmEsRUFFWGpQLE1BQU1vUCxPQUFOLENBQWM0UCxVQUZILENBQWQ7QUFHRDtBQUNGLFdBWEQsRUFXRzNULEVBWEgsQ0FXTSw0QkFYTixFQVdvQyxVQUFTeEosQ0FBVCxFQUFZO0FBQzlDLGdCQUFJUixRQUFRcEQsRUFBRSxJQUFGLENBQVo7QUFBQSxnQkFDSW1pQixTQUFTL2UsTUFBTXlZLFFBQU4sQ0FBZW9HLFFBQWYsQ0FEYjtBQUVBLGdCQUFJRSxVQUFVcGdCLE1BQU1vUCxPQUFOLENBQWNvUixTQUE1QixFQUF1QztBQUNyQyxrQkFBSW5mLE1BQU03QyxJQUFOLENBQVcsZUFBWCxNQUFnQyxNQUFoQyxJQUEwQ3dCLE1BQU1vUCxPQUFOLENBQWMrUSxTQUE1RCxFQUF1RTtBQUFFLHVCQUFPLEtBQVA7QUFBZTs7QUFFeEYxa0IsMkJBQWF1RSxNQUFNOEMsS0FBbkI7QUFDQTlDLG9CQUFNOEMsS0FBTixHQUFjeEgsV0FBVyxZQUFXO0FBQ2xDMEUsc0JBQU0wZCxLQUFOLENBQVlyYyxLQUFaO0FBQ0QsZUFGYSxFQUVYckIsTUFBTW9QLE9BQU4sQ0FBY3FSLFdBRkgsQ0FBZDtBQUdEO0FBQ0YsV0F0QkQ7QUF1QkQ7QUFDRCxhQUFLbkUsVUFBTCxDQUFnQmpSLEVBQWhCLENBQW1CLHlCQUFuQixFQUE4QyxVQUFTeEosQ0FBVCxFQUFZO0FBQ3hELGNBQUl6QyxXQUFXbkIsRUFBRTRELEVBQUU3RixNQUFKLEVBQVlnZ0IsWUFBWixDQUF5QixJQUF6QixFQUErQixtQkFBL0IsQ0FBZjtBQUFBLGNBQ0kwRSxRQUFRMWdCLE1BQU11WixLQUFOLENBQVlvSCxLQUFaLENBQWtCdmhCLFFBQWxCLElBQThCLENBQUMsQ0FEM0M7QUFBQSxjQUVJa2MsWUFBWW9GLFFBQVExZ0IsTUFBTXVaLEtBQWQsR0FBc0JuYSxTQUFTd1csUUFBVCxDQUFrQixJQUFsQixFQUF3QnFHLEdBQXhCLENBQTRCN2MsUUFBNUIsQ0FGdEM7QUFBQSxjQUdJbWMsWUFISjtBQUFBLGNBSUlDLFlBSko7O0FBTUFGLG9CQUFVeGIsSUFBVixDQUFlLFVBQVNzQixDQUFULEVBQVk7QUFDekIsZ0JBQUluRCxFQUFFLElBQUYsRUFBUTBMLEVBQVIsQ0FBV3ZLLFFBQVgsQ0FBSixFQUEwQjtBQUN4Qm1jLDZCQUFlRCxVQUFVek4sRUFBVixDQUFhek0sSUFBRSxDQUFmLENBQWY7QUFDQW9hLDZCQUFlRixVQUFVek4sRUFBVixDQUFhek0sSUFBRSxDQUFmLENBQWY7QUFDQTtBQUNEO0FBQ0YsV0FORDs7QUFRQSxjQUFJd2YsY0FBYyxZQUFXO0FBQzNCLGdCQUFJLENBQUN4aEIsU0FBU3VLLEVBQVQsQ0FBWSxhQUFaLENBQUwsRUFBaUM2UixhQUFhdk0sUUFBYixDQUFzQixTQUF0QixFQUFpQ21MLEtBQWpDO0FBQ2xDLFdBRkQ7QUFBQSxjQUVHeUcsY0FBYyxZQUFXO0FBQzFCdEYseUJBQWF0TSxRQUFiLENBQXNCLFNBQXRCLEVBQWlDbUwsS0FBakM7QUFDRCxXQUpEO0FBQUEsY0FJRzBHLFVBQVUsWUFBVztBQUN0QixnQkFBSTlSLE9BQU81UCxTQUFTNlAsUUFBVCxDQUFrQix3QkFBbEIsQ0FBWDtBQUNBLGdCQUFJRCxLQUFLdE8sTUFBVCxFQUFpQjtBQUNmVixvQkFBTXNkLEtBQU4sQ0FBWXRPLElBQVo7QUFDQTVQLHVCQUFTa0MsSUFBVCxDQUFjLGNBQWQsRUFBOEI4WSxLQUE5QjtBQUNELGFBSEQsTUFHTztBQUFFO0FBQVM7QUFDbkIsV0FWRDtBQUFBLGNBVUcyRyxXQUFXLFlBQVc7QUFDdkI7QUFDQSxnQkFBSW5GLFFBQVF4YyxTQUFTZ0gsTUFBVCxDQUFnQixJQUFoQixFQUFzQkEsTUFBdEIsQ0FBNkIsSUFBN0IsQ0FBWjtBQUNFd1Ysa0JBQU0zTSxRQUFOLENBQWUsU0FBZixFQUEwQm1MLEtBQTFCO0FBQ0FwYSxrQkFBTTBkLEtBQU4sQ0FBWTlCLEtBQVo7QUFDRjtBQUNELFdBaEJEO0FBaUJBLGNBQUkzUyxZQUFZO0FBQ2QwUyxrQkFBTW1GLE9BRFE7QUFFZGxGLG1CQUFPLFlBQVc7QUFDaEI1YixvQkFBTTBkLEtBQU4sQ0FBWTFkLE1BQU1aLFFBQWxCO0FBQ0FZLG9CQUFNc2MsVUFBTixDQUFpQmhiLElBQWpCLENBQXNCLFNBQXRCLEVBQWlDOFksS0FBakMsR0FGZ0IsQ0FFMEI7QUFDM0MsYUFMYTtBQU1kN1EscUJBQVMsWUFBVztBQUNsQjFILGdCQUFFdU8sY0FBRjtBQUNBdk8sZ0JBQUVrYSx3QkFBRjtBQUNEO0FBVGEsV0FBaEI7O0FBWUEsY0FBSTJFLEtBQUosRUFBVztBQUNULGdCQUFJMWdCLE1BQU1naEIsUUFBVixFQUFvQjtBQUFFO0FBQ3BCLGtCQUFJaGhCLE1BQU1vUCxPQUFOLENBQWMwUSxTQUFkLEtBQTRCLE1BQWhDLEVBQXdDO0FBQUU7QUFDeEM3aEIsa0JBQUVxTCxNQUFGLENBQVNMLFNBQVQsRUFBb0I7QUFDbEIyUSx3QkFBTWdILFdBRFk7QUFFbEI1RyxzQkFBSTZHLFdBRmM7QUFHbEIzRyx3QkFBTTRHLE9BSFk7QUFJbEJ4Ryw0QkFBVXlHO0FBSlEsaUJBQXBCO0FBTUQsZUFQRCxNQU9PO0FBQUU7QUFDUDlpQixrQkFBRXFMLE1BQUYsQ0FBU0wsU0FBVCxFQUFvQjtBQUNsQjJRLHdCQUFNZ0gsV0FEWTtBQUVsQjVHLHNCQUFJNkcsV0FGYztBQUdsQjNHLHdCQUFNNkcsUUFIWTtBQUlsQnpHLDRCQUFVd0c7QUFKUSxpQkFBcEI7QUFNRDtBQUNGLGFBaEJELE1BZ0JPO0FBQUU7QUFDUDdpQixnQkFBRXFMLE1BQUYsQ0FBU0wsU0FBVCxFQUFvQjtBQUNsQmlSLHNCQUFNMEcsV0FEWTtBQUVsQnRHLDBCQUFVdUcsV0FGUTtBQUdsQmpILHNCQUFNa0gsT0FIWTtBQUlsQjlHLG9CQUFJK0c7QUFKYyxlQUFwQjtBQU1EO0FBQ0YsV0F6QkQsTUF5Qk87QUFBRTtBQUNQLGdCQUFJL2dCLE1BQU1vUCxPQUFOLENBQWMwUSxTQUFkLEtBQTRCLE1BQWhDLEVBQXdDO0FBQUU7QUFDeEM3aEIsZ0JBQUVxTCxNQUFGLENBQVNMLFNBQVQsRUFBb0I7QUFDbEJpUixzQkFBTTRHLE9BRFk7QUFFbEJ4RywwQkFBVXlHLFFBRlE7QUFHbEJuSCxzQkFBTWdILFdBSFk7QUFJbEI1RyxvQkFBSTZHO0FBSmMsZUFBcEI7QUFNRCxhQVBELE1BT087QUFBRTtBQUNQNWlCLGdCQUFFcUwsTUFBRixDQUFTTCxTQUFULEVBQW9CO0FBQ2xCaVIsc0JBQU02RyxRQURZO0FBRWxCekcsMEJBQVV3RyxPQUZRO0FBR2xCbEgsc0JBQU1nSCxXQUhZO0FBSWxCNUcsb0JBQUk2RztBQUpjLGVBQXBCO0FBTUQ7QUFDRjtBQUNEMWlCLHFCQUFXbUssUUFBWCxDQUFvQlMsU0FBcEIsQ0FBOEJsSCxDQUE5QixFQUFpQyxjQUFqQyxFQUFpRG9ILFNBQWpEO0FBRUQsU0F4RkQ7QUF5RkQ7O0FBRUQ7Ozs7OztBQWxOVztBQUFBO0FBQUEsd0NBdU5PO0FBQ2hCLFlBQUl1VSxRQUFRdmYsRUFBRWIsU0FBUzlDLElBQVgsQ0FBWjtBQUFBLFlBQ0kwRixRQUFRLElBRFo7QUFFQXdkLGNBQU16SixHQUFOLENBQVUsa0RBQVYsRUFDTTFJLEVBRE4sQ0FDUyxrREFEVCxFQUM2RCxVQUFTeEosQ0FBVCxFQUFZO0FBQ2xFLGNBQUk0YSxRQUFRemMsTUFBTVosUUFBTixDQUFla0MsSUFBZixDQUFvQk8sRUFBRTdGLE1BQXRCLENBQVo7QUFDQSxjQUFJeWdCLE1BQU0vYixNQUFWLEVBQWtCO0FBQUU7QUFBUzs7QUFFN0JWLGdCQUFNMGQsS0FBTjtBQUNBRixnQkFBTXpKLEdBQU4sQ0FBVSxrREFBVjtBQUNELFNBUE47QUFRRDs7QUFFRDs7Ozs7Ozs7QUFwT1c7QUFBQTtBQUFBLDRCQTJPTC9FLElBM09LLEVBMk9DO0FBQ1YsWUFBSXdLLE1BQU0sS0FBS0QsS0FBTCxDQUFXb0gsS0FBWCxDQUFpQixLQUFLcEgsS0FBTCxDQUFXN1AsTUFBWCxDQUFrQixVQUFTdEksQ0FBVCxFQUFZWSxFQUFaLEVBQWdCO0FBQzNELGlCQUFPL0QsRUFBRStELEVBQUYsRUFBTVYsSUFBTixDQUFXME4sSUFBWCxFQUFpQnRPLE1BQWpCLEdBQTBCLENBQWpDO0FBQ0QsU0FGMEIsQ0FBakIsQ0FBVjtBQUdBLFlBQUl1Z0IsUUFBUWpTLEtBQUs1SSxNQUFMLENBQVksK0JBQVosRUFBNkN3UCxRQUE3QyxDQUFzRCwrQkFBdEQsQ0FBWjtBQUNBLGFBQUs4SCxLQUFMLENBQVd1RCxLQUFYLEVBQWtCekgsR0FBbEI7QUFDQXhLLGFBQUt2RSxHQUFMLENBQVMsWUFBVCxFQUF1QixRQUF2QixFQUFpQ3dELFFBQWpDLENBQTBDLG9CQUExQyxFQUFnRXpQLElBQWhFLENBQXFFLEVBQUMsZUFBZSxLQUFoQixFQUFyRSxFQUNLNEgsTUFETCxDQUNZLCtCQURaLEVBQzZDNkgsUUFEN0MsQ0FDc0QsV0FEdEQsRUFFS3pQLElBRkwsQ0FFVSxFQUFDLGlCQUFpQixJQUFsQixFQUZWO0FBR0EsWUFBSTBaLFFBQVEvWixXQUFXNEgsR0FBWCxDQUFlQyxnQkFBZixDQUFnQ2dKLElBQWhDLEVBQXNDLElBQXRDLEVBQTRDLElBQTVDLENBQVo7QUFDQSxZQUFJLENBQUNrSixLQUFMLEVBQVk7QUFDVixjQUFJZ0osV0FBVyxLQUFLOVIsT0FBTCxDQUFhMFEsU0FBYixLQUEyQixNQUEzQixHQUFvQyxRQUFwQyxHQUErQyxPQUE5RDtBQUFBLGNBQ0lxQixZQUFZblMsS0FBSzVJLE1BQUwsQ0FBWSw2QkFBWixDQURoQjtBQUVBK2Esb0JBQVUzZCxXQUFWLFdBQThCMGQsUUFBOUIsRUFBMENqVCxRQUExQyxZQUE0RCxLQUFLbUIsT0FBTCxDQUFhMFEsU0FBekU7QUFDQTVILGtCQUFRL1osV0FBVzRILEdBQVgsQ0FBZUMsZ0JBQWYsQ0FBZ0NnSixJQUFoQyxFQUFzQyxJQUF0QyxFQUE0QyxJQUE1QyxDQUFSO0FBQ0EsY0FBSSxDQUFDa0osS0FBTCxFQUFZO0FBQ1ZpSixzQkFBVTNkLFdBQVYsWUFBK0IsS0FBSzRMLE9BQUwsQ0FBYTBRLFNBQTVDLEVBQXlEN1IsUUFBekQsQ0FBa0UsYUFBbEU7QUFDRDtBQUNELGVBQUs4UixPQUFMLEdBQWUsSUFBZjtBQUNEO0FBQ0QvUSxhQUFLdkUsR0FBTCxDQUFTLFlBQVQsRUFBdUIsRUFBdkI7QUFDQSxZQUFJLEtBQUsyRSxPQUFMLENBQWFtTyxZQUFqQixFQUErQjtBQUFFLGVBQUtpQyxlQUFMO0FBQXlCO0FBQzFEOzs7O0FBSUEsYUFBS3BnQixRQUFMLENBQWNFLE9BQWQsQ0FBc0Isc0JBQXRCLEVBQThDLENBQUMwUCxJQUFELENBQTlDO0FBQ0Q7O0FBRUQ7Ozs7Ozs7O0FBeFFXO0FBQUE7QUFBQSw0QkErUUwzTixLQS9RSyxFQStRRW1ZLEdBL1FGLEVBK1FPO0FBQ2hCLFlBQUk0SCxRQUFKO0FBQ0EsWUFBSS9mLFNBQVNBLE1BQU1YLE1BQW5CLEVBQTJCO0FBQ3pCMGdCLHFCQUFXL2YsS0FBWDtBQUNELFNBRkQsTUFFTyxJQUFJbVksUUFBUTliLFNBQVosRUFBdUI7QUFDNUIwakIscUJBQVcsS0FBSzdILEtBQUwsQ0FBV3RGLEdBQVgsQ0FBZSxVQUFTN1MsQ0FBVCxFQUFZWSxFQUFaLEVBQWdCO0FBQ3hDLG1CQUFPWixNQUFNb1ksR0FBYjtBQUNELFdBRlUsQ0FBWDtBQUdELFNBSk0sTUFLRjtBQUNINEgscUJBQVcsS0FBS2hpQixRQUFoQjtBQUNEO0FBQ0QsWUFBSWlpQixtQkFBbUJELFNBQVN0SCxRQUFULENBQWtCLFdBQWxCLEtBQWtDc0gsU0FBUzlmLElBQVQsQ0FBYyxZQUFkLEVBQTRCWixNQUE1QixHQUFxQyxDQUE5Rjs7QUFFQSxZQUFJMmdCLGdCQUFKLEVBQXNCO0FBQ3BCRCxtQkFBUzlmLElBQVQsQ0FBYyxjQUFkLEVBQThCMmEsR0FBOUIsQ0FBa0NtRixRQUFsQyxFQUE0QzVpQixJQUE1QyxDQUFpRDtBQUMvQyw2QkFBaUIsS0FEOEI7QUFFL0MsNkJBQWlCO0FBRjhCLFdBQWpELEVBR0dnRixXQUhILENBR2UsV0FIZjs7QUFLQTRkLG1CQUFTOWYsSUFBVCxDQUFjLHVCQUFkLEVBQXVDOUMsSUFBdkMsQ0FBNEM7QUFDMUMsMkJBQWU7QUFEMkIsV0FBNUMsRUFFR2dGLFdBRkgsQ0FFZSxvQkFGZjs7QUFJQSxjQUFJLEtBQUt1YyxPQUFMLElBQWdCcUIsU0FBUzlmLElBQVQsQ0FBYyxhQUFkLEVBQTZCWixNQUFqRCxFQUF5RDtBQUN2RCxnQkFBSXdnQixXQUFXLEtBQUs5UixPQUFMLENBQWEwUSxTQUFiLEtBQTJCLE1BQTNCLEdBQW9DLE9BQXBDLEdBQThDLE1BQTdEO0FBQ0FzQixxQkFBUzlmLElBQVQsQ0FBYywrQkFBZCxFQUErQzJhLEdBQS9DLENBQW1EbUYsUUFBbkQsRUFDUzVkLFdBRFQsd0JBQzBDLEtBQUs0TCxPQUFMLENBQWEwUSxTQUR2RCxFQUVTN1IsUUFGVCxZQUUyQmlULFFBRjNCO0FBR0EsaUJBQUtuQixPQUFMLEdBQWUsS0FBZjtBQUNEO0FBQ0Q7Ozs7QUFJQSxlQUFLM2dCLFFBQUwsQ0FBY0UsT0FBZCxDQUFzQixzQkFBdEIsRUFBOEMsQ0FBQzhoQixRQUFELENBQTlDO0FBQ0Q7QUFDRjs7QUFFRDs7Ozs7QUF0VFc7QUFBQTtBQUFBLGdDQTBURDtBQUNSLGFBQUs5RSxVQUFMLENBQWdCdkksR0FBaEIsQ0FBb0Isa0JBQXBCLEVBQXdDdlUsVUFBeEMsQ0FBbUQsZUFBbkQsRUFDS2dFLFdBREwsQ0FDaUIsK0VBRGpCO0FBRUF2RixVQUFFYixTQUFTOUMsSUFBWCxFQUFpQnlaLEdBQWpCLENBQXFCLGtCQUFyQjtBQUNBNVYsbUJBQVdxUSxJQUFYLENBQWdCVSxJQUFoQixDQUFxQixLQUFLOVAsUUFBMUIsRUFBb0MsVUFBcEM7QUFDQWpCLG1CQUFXb0IsZ0JBQVgsQ0FBNEIsSUFBNUI7QUFDRDtBQWhVVTs7QUFBQTtBQUFBOztBQW1VYjs7Ozs7QUFHQW1nQixlQUFheEssUUFBYixHQUF3QjtBQUN0Qjs7Ozs7QUFLQXFMLGtCQUFjLEtBTlE7QUFPdEI7Ozs7O0FBS0FDLGVBQVcsSUFaVztBQWF0Qjs7Ozs7QUFLQXhCLGdCQUFZLEVBbEJVO0FBbUJ0Qjs7Ozs7QUFLQW1CLGVBQVcsS0F4Qlc7QUF5QnRCOzs7Ozs7QUFNQU0saUJBQWEsR0EvQlM7QUFnQ3RCOzs7OztBQUtBWCxlQUFXLE1BckNXO0FBc0N0Qjs7Ozs7QUFLQXZDLGtCQUFjLElBM0NRO0FBNEN0Qjs7Ozs7QUFLQXFDLG1CQUFlLFVBakRPO0FBa0R0Qjs7Ozs7QUFLQUMsZ0JBQVksYUF2RFU7QUF3RHRCOzs7OztBQUtBUyxpQkFBYTtBQTdEUyxHQUF4Qjs7QUFnRUE7QUFDQW5pQixhQUFXTSxNQUFYLENBQWtCaWhCLFlBQWxCLEVBQWdDLGNBQWhDO0FBRUMsQ0F6WUEsQ0F5WUM1WixNQXpZRCxDQUFEO0NDRkE7Ozs7OztBQUVBLENBQUMsVUFBUzdILENBQVQsRUFBWTs7QUFFYjs7Ozs7QUFGYSxNQU9QcWpCLFNBUE87QUFRWDs7Ozs7OztBQU9BLHVCQUFZbmIsT0FBWixFQUFxQmlKLE9BQXJCLEVBQTZCO0FBQUE7O0FBQzNCLFdBQUtoUSxRQUFMLEdBQWdCK0csT0FBaEI7QUFDQSxXQUFLaUosT0FBTCxHQUFnQm5SLEVBQUVxTCxNQUFGLENBQVMsRUFBVCxFQUFhZ1ksVUFBVXBNLFFBQXZCLEVBQWlDLEtBQUs5VixRQUFMLENBQWNDLElBQWQsRUFBakMsRUFBdUQrUCxPQUF2RCxDQUFoQjs7QUFFQSxXQUFLclAsS0FBTDs7QUFFQTVCLGlCQUFXWSxjQUFYLENBQTBCLElBQTFCLEVBQWdDLFdBQWhDO0FBQ0Q7O0FBRUQ7Ozs7OztBQXhCVztBQUFBO0FBQUEsOEJBNEJIO0FBQ04sWUFBSXdpQixPQUFPLEtBQUtuaUIsUUFBTCxDQUFjWixJQUFkLENBQW1CLGdCQUFuQixLQUF3QyxFQUFuRDtBQUNBLFlBQUlnakIsV0FBVyxLQUFLcGlCLFFBQUwsQ0FBY2tDLElBQWQsNkJBQTZDaWdCLElBQTdDLFFBQWY7O0FBRUEsYUFBS0MsUUFBTCxHQUFnQkEsU0FBUzlnQixNQUFULEdBQWtCOGdCLFFBQWxCLEdBQTZCLEtBQUtwaUIsUUFBTCxDQUFja0MsSUFBZCxDQUFtQix3QkFBbkIsQ0FBN0M7QUFDQSxhQUFLbEMsUUFBTCxDQUFjWixJQUFkLENBQW1CLGFBQW5CLEVBQW1DK2lCLFFBQVFwakIsV0FBV2dCLFdBQVgsQ0FBdUIsQ0FBdkIsRUFBMEIsSUFBMUIsQ0FBM0M7O0FBRUEsYUFBS3NpQixTQUFMLEdBQWlCLEtBQUtyaUIsUUFBTCxDQUFja0MsSUFBZCxDQUFtQixrQkFBbkIsRUFBdUNaLE1BQXZDLEdBQWdELENBQWpFO0FBQ0EsYUFBS2doQixRQUFMLEdBQWdCLEtBQUt0aUIsUUFBTCxDQUFjNGMsWUFBZCxDQUEyQjVlLFNBQVM5QyxJQUFwQyxFQUEwQyxrQkFBMUMsRUFBOERvRyxNQUE5RCxHQUF1RSxDQUF2RjtBQUNBLGFBQUtpaEIsSUFBTCxHQUFZLEtBQVo7O0FBRUEsWUFBSUMsT0FBTyxLQUFLeGlCLFFBQUwsQ0FBY2tDLElBQWQsQ0FBbUIsS0FBbkIsQ0FBWDtBQUNBLFlBQUl1Z0IsUUFBSjtBQUNBLFlBQUcsS0FBS3pTLE9BQUwsQ0FBYTBTLFVBQWhCLEVBQTJCO0FBQ3pCRCxxQkFBVyxLQUFLRSxRQUFMLEVBQVg7QUFDQTlqQixZQUFFOUQsTUFBRixFQUFVa1IsRUFBVixDQUFhLHVCQUFiLEVBQXNDLEtBQUswVyxRQUFMLENBQWMvYyxJQUFkLENBQW1CLElBQW5CLENBQXRDO0FBQ0QsU0FIRCxNQUdLO0FBQ0gsZUFBS29RLE9BQUw7QUFDRDtBQUNELFlBQUl5TSxhQUFhbmtCLFNBQWIsSUFBMEJta0IsYUFBYSxLQUF4QyxJQUFrREEsYUFBYW5rQixTQUFsRSxFQUE0RTtBQUMxRSxjQUFHa2tCLEtBQUtsaEIsTUFBUixFQUFlO0FBQ2J2Qyx1QkFBV3dSLGNBQVgsQ0FBMEJpUyxJQUExQixFQUFnQyxLQUFLSSxPQUFMLENBQWFoZCxJQUFiLENBQWtCLElBQWxCLENBQWhDO0FBQ0QsV0FGRCxNQUVLO0FBQ0gsaUJBQUtnZCxPQUFMO0FBQ0Q7QUFDRjtBQUNGOztBQUVEOzs7OztBQXhEVztBQUFBO0FBQUEscUNBNERJO0FBQ2IsYUFBS0wsSUFBTCxHQUFZLEtBQVo7QUFDQSxhQUFLdmlCLFFBQUwsQ0FBYzJVLEdBQWQsQ0FBa0IsbUNBQWxCO0FBQ0Q7O0FBRUQ7Ozs7O0FBakVXO0FBQUE7QUFBQSxnQ0FxRUQ7QUFDUixZQUFJL1QsUUFBUSxJQUFaO0FBQ0EsYUFBS2lpQixZQUFMO0FBQ0EsWUFBRyxLQUFLUixTQUFSLEVBQWtCO0FBQ2hCLGVBQUtyaUIsUUFBTCxDQUFjaU0sRUFBZCxDQUFpQiw0QkFBakIsRUFBK0MsVUFBU3hKLENBQVQsRUFBVztBQUN4RCxnQkFBR0EsRUFBRTdGLE1BQUYsS0FBYWdFLE1BQU1aLFFBQU4sQ0FBZSxDQUFmLENBQWhCLEVBQWtDO0FBQUVZLG9CQUFNZ2lCLE9BQU47QUFBa0I7QUFDdkQsV0FGRDtBQUdELFNBSkQsTUFJSztBQUNILGVBQUs1aUIsUUFBTCxDQUFjaU0sRUFBZCxDQUFpQixxQkFBakIsRUFBd0MsS0FBSzJXLE9BQUwsQ0FBYWhkLElBQWIsQ0FBa0IsSUFBbEIsQ0FBeEM7QUFDRDtBQUNELGFBQUsyYyxJQUFMLEdBQVksSUFBWjtBQUNEOztBQUVEOzs7OztBQWxGVztBQUFBO0FBQUEsaUNBc0ZBO0FBQ1QsWUFBSUUsV0FBVyxDQUFDMWpCLFdBQVdzRixVQUFYLENBQXNCcUgsT0FBdEIsQ0FBOEIsS0FBS3NFLE9BQUwsQ0FBYTBTLFVBQTNDLENBQWhCO0FBQ0EsWUFBR0QsUUFBSCxFQUFZO0FBQ1YsY0FBRyxLQUFLRixJQUFSLEVBQWE7QUFDWCxpQkFBS00sWUFBTDtBQUNBLGlCQUFLVCxRQUFMLENBQWMvVyxHQUFkLENBQWtCLFFBQWxCLEVBQTRCLE1BQTVCO0FBQ0Q7QUFDRixTQUxELE1BS0s7QUFDSCxjQUFHLENBQUMsS0FBS2tYLElBQVQsRUFBYztBQUNaLGlCQUFLdk0sT0FBTDtBQUNEO0FBQ0Y7QUFDRCxlQUFPeU0sUUFBUDtBQUNEOztBQUVEOzs7OztBQXJHVztBQUFBO0FBQUEsb0NBeUdHO0FBQ1o7QUFDRDs7QUFFRDs7Ozs7QUE3R1c7QUFBQTtBQUFBLGdDQWlIRDtBQUNSLFlBQUcsQ0FBQyxLQUFLelMsT0FBTCxDQUFhOFMsZUFBakIsRUFBaUM7QUFDL0IsY0FBRyxLQUFLQyxVQUFMLEVBQUgsRUFBcUI7QUFDbkIsaUJBQUtYLFFBQUwsQ0FBYy9XLEdBQWQsQ0FBa0IsUUFBbEIsRUFBNEIsTUFBNUI7QUFDQSxtQkFBTyxLQUFQO0FBQ0Q7QUFDRjtBQUNELFlBQUksS0FBSzJFLE9BQUwsQ0FBYWdULGFBQWpCLEVBQWdDO0FBQzlCLGVBQUtDLGVBQUwsQ0FBcUIsS0FBS0MsZ0JBQUwsQ0FBc0J0ZCxJQUF0QixDQUEyQixJQUEzQixDQUFyQjtBQUNELFNBRkQsTUFFSztBQUNILGVBQUt1ZCxVQUFMLENBQWdCLEtBQUtDLFdBQUwsQ0FBaUJ4ZCxJQUFqQixDQUFzQixJQUF0QixDQUFoQjtBQUNEO0FBQ0Y7O0FBRUQ7Ozs7O0FBL0hXO0FBQUE7QUFBQSxtQ0FtSUU7QUFDWCxlQUFPLEtBQUt3YyxRQUFMLENBQWMsQ0FBZCxFQUFpQmlCLFNBQWpCLEtBQStCLEtBQUtqQixRQUFMLENBQWMsQ0FBZCxFQUFpQmlCLFNBQXZEO0FBQ0Q7O0FBRUQ7Ozs7OztBQXZJVztBQUFBO0FBQUEsaUNBNElBdFYsRUE1SUEsRUE0SUk7QUFDYixZQUFJdVYsVUFBVSxFQUFkO0FBQ0EsYUFBSSxJQUFJdGhCLElBQUksQ0FBUixFQUFXdWhCLE1BQU0sS0FBS25CLFFBQUwsQ0FBYzlnQixNQUFuQyxFQUEyQ1UsSUFBSXVoQixHQUEvQyxFQUFvRHZoQixHQUFwRCxFQUF3RDtBQUN0RCxlQUFLb2dCLFFBQUwsQ0FBY3BnQixDQUFkLEVBQWlCcUIsS0FBakIsQ0FBdUJxRSxNQUF2QixHQUFnQyxNQUFoQztBQUNBNGIsa0JBQVE5bEIsSUFBUixDQUFhLEtBQUs0a0IsUUFBTCxDQUFjcGdCLENBQWQsRUFBaUJ3aEIsWUFBOUI7QUFDRDtBQUNEelYsV0FBR3VWLE9BQUg7QUFDRDs7QUFFRDs7Ozs7O0FBckpXO0FBQUE7QUFBQSxzQ0EwSkt2VixFQTFKTCxFQTBKUztBQUNsQixZQUFJMFYsa0JBQW1CLEtBQUtyQixRQUFMLENBQWM5Z0IsTUFBZCxHQUF1QixLQUFLOGdCLFFBQUwsQ0FBY3RQLEtBQWQsR0FBc0JyTCxNQUF0QixHQUErQkwsR0FBdEQsR0FBNEQsQ0FBbkY7QUFBQSxZQUNJc2MsU0FBUyxFQURiO0FBQUEsWUFFSUMsUUFBUSxDQUZaO0FBR0E7QUFDQUQsZUFBT0MsS0FBUCxJQUFnQixFQUFoQjtBQUNBLGFBQUksSUFBSTNoQixJQUFJLENBQVIsRUFBV3VoQixNQUFNLEtBQUtuQixRQUFMLENBQWM5Z0IsTUFBbkMsRUFBMkNVLElBQUl1aEIsR0FBL0MsRUFBb0R2aEIsR0FBcEQsRUFBd0Q7QUFDdEQsZUFBS29nQixRQUFMLENBQWNwZ0IsQ0FBZCxFQUFpQnFCLEtBQWpCLENBQXVCcUUsTUFBdkIsR0FBZ0MsTUFBaEM7QUFDQTtBQUNBLGNBQUlrYyxjQUFjL2tCLEVBQUUsS0FBS3VqQixRQUFMLENBQWNwZ0IsQ0FBZCxDQUFGLEVBQW9CeUYsTUFBcEIsR0FBNkJMLEdBQS9DO0FBQ0EsY0FBSXdjLGVBQWFILGVBQWpCLEVBQWtDO0FBQ2hDRTtBQUNBRCxtQkFBT0MsS0FBUCxJQUFnQixFQUFoQjtBQUNBRiw4QkFBZ0JHLFdBQWhCO0FBQ0Q7QUFDREYsaUJBQU9DLEtBQVAsRUFBY25tQixJQUFkLENBQW1CLENBQUMsS0FBSzRrQixRQUFMLENBQWNwZ0IsQ0FBZCxDQUFELEVBQWtCLEtBQUtvZ0IsUUFBTCxDQUFjcGdCLENBQWQsRUFBaUJ3aEIsWUFBbkMsQ0FBbkI7QUFDRDs7QUFFRCxhQUFLLElBQUlLLElBQUksQ0FBUixFQUFXQyxLQUFLSixPQUFPcGlCLE1BQTVCLEVBQW9DdWlCLElBQUlDLEVBQXhDLEVBQTRDRCxHQUE1QyxFQUFpRDtBQUMvQyxjQUFJUCxVQUFVemtCLEVBQUU2a0IsT0FBT0csQ0FBUCxDQUFGLEVBQWFsaEIsR0FBYixDQUFpQixZQUFVO0FBQUUsbUJBQU8sS0FBSyxDQUFMLENBQVA7QUFBaUIsV0FBOUMsRUFBZ0RrSixHQUFoRCxFQUFkO0FBQ0EsY0FBSXJHLE1BQWNoRSxLQUFLZ0UsR0FBTCxDQUFTMUIsS0FBVCxDQUFlLElBQWYsRUFBcUJ3ZixPQUFyQixDQUFsQjtBQUNBSSxpQkFBT0csQ0FBUCxFQUFVcm1CLElBQVYsQ0FBZWdJLEdBQWY7QUFDRDtBQUNEdUksV0FBRzJWLE1BQUg7QUFDRDs7QUFFRDs7Ozs7OztBQXBMVztBQUFBO0FBQUEsa0NBMExDSixPQTFMRCxFQTBMVTtBQUNuQixZQUFJOWQsTUFBTWhFLEtBQUtnRSxHQUFMLENBQVMxQixLQUFULENBQWUsSUFBZixFQUFxQndmLE9BQXJCLENBQVY7QUFDQTs7OztBQUlBLGFBQUt0akIsUUFBTCxDQUFjRSxPQUFkLENBQXNCLDJCQUF0Qjs7QUFFQSxhQUFLa2lCLFFBQUwsQ0FBYy9XLEdBQWQsQ0FBa0IsUUFBbEIsRUFBNEI3RixHQUE1Qjs7QUFFQTs7OztBQUlDLGFBQUt4RixRQUFMLENBQWNFLE9BQWQsQ0FBc0IsNEJBQXRCO0FBQ0Y7O0FBRUQ7Ozs7Ozs7OztBQTNNVztBQUFBO0FBQUEsdUNBbU5Nd2pCLE1Bbk5OLEVBbU5jO0FBQ3ZCOzs7QUFHQSxhQUFLMWpCLFFBQUwsQ0FBY0UsT0FBZCxDQUFzQiwyQkFBdEI7QUFDQSxhQUFLLElBQUk4QixJQUFJLENBQVIsRUFBV3VoQixNQUFNRyxPQUFPcGlCLE1BQTdCLEVBQXFDVSxJQUFJdWhCLEdBQXpDLEVBQStDdmhCLEdBQS9DLEVBQW9EO0FBQ2xELGNBQUkraEIsZ0JBQWdCTCxPQUFPMWhCLENBQVAsRUFBVVYsTUFBOUI7QUFBQSxjQUNJa0UsTUFBTWtlLE9BQU8xaEIsQ0FBUCxFQUFVK2hCLGdCQUFnQixDQUExQixDQURWO0FBRUEsY0FBSUEsaUJBQWUsQ0FBbkIsRUFBc0I7QUFDcEJsbEIsY0FBRTZrQixPQUFPMWhCLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixDQUFGLEVBQW1CcUosR0FBbkIsQ0FBdUIsRUFBQyxVQUFTLE1BQVYsRUFBdkI7QUFDQTtBQUNEO0FBQ0Q7Ozs7QUFJQSxlQUFLckwsUUFBTCxDQUFjRSxPQUFkLENBQXNCLDhCQUF0QjtBQUNBLGVBQUssSUFBSTJqQixJQUFJLENBQVIsRUFBV0csT0FBUUQsZ0JBQWMsQ0FBdEMsRUFBMENGLElBQUlHLElBQTlDLEVBQXFESCxHQUFyRCxFQUEwRDtBQUN4RGhsQixjQUFFNmtCLE9BQU8xaEIsQ0FBUCxFQUFVNmhCLENBQVYsRUFBYSxDQUFiLENBQUYsRUFBbUJ4WSxHQUFuQixDQUF1QixFQUFDLFVBQVM3RixHQUFWLEVBQXZCO0FBQ0Q7QUFDRDs7OztBQUlBLGVBQUt4RixRQUFMLENBQWNFLE9BQWQsQ0FBc0IsK0JBQXRCO0FBQ0Q7QUFDRDs7O0FBR0MsYUFBS0YsUUFBTCxDQUFjRSxPQUFkLENBQXNCLDRCQUF0QjtBQUNGOztBQUVEOzs7OztBQW5QVztBQUFBO0FBQUEsZ0NBdVBEO0FBQ1IsYUFBSzJpQixZQUFMO0FBQ0EsYUFBS1QsUUFBTCxDQUFjL1csR0FBZCxDQUFrQixRQUFsQixFQUE0QixNQUE1Qjs7QUFFQXRNLG1CQUFXb0IsZ0JBQVgsQ0FBNEIsSUFBNUI7QUFDRDtBQTVQVTs7QUFBQTtBQUFBOztBQStQYjs7Ozs7QUFHQStoQixZQUFVcE0sUUFBVixHQUFxQjtBQUNuQjs7Ozs7QUFLQWdOLHFCQUFpQixJQU5FO0FBT25COzs7OztBQUtBRSxtQkFBZSxLQVpJO0FBYW5COzs7OztBQUtBTixnQkFBWTtBQWxCTyxHQUFyQjs7QUFxQkE7QUFDQTNqQixhQUFXTSxNQUFYLENBQWtCNmlCLFNBQWxCLEVBQTZCLFdBQTdCO0FBRUMsQ0ExUkEsQ0EwUkN4YixNQTFSRCxDQUFEO0NDRkE7Ozs7OztBQUVBLENBQUMsVUFBUzdILENBQVQsRUFBWTs7QUFFYjs7Ozs7OztBQUZhLE1BU1BvbEIsV0FUTztBQVVYOzs7Ozs7O0FBT0EseUJBQVlsZCxPQUFaLEVBQXFCaUosT0FBckIsRUFBOEI7QUFBQTs7QUFDNUIsV0FBS2hRLFFBQUwsR0FBZ0IrRyxPQUFoQjtBQUNBLFdBQUtpSixPQUFMLEdBQWVuUixFQUFFcUwsTUFBRixDQUFTLEVBQVQsRUFBYStaLFlBQVluTyxRQUF6QixFQUFtQzlGLE9BQW5DLENBQWY7QUFDQSxXQUFLa1UsS0FBTCxHQUFhLEVBQWI7QUFDQSxXQUFLQyxXQUFMLEdBQW1CLEVBQW5COztBQUVBLFdBQUt4akIsS0FBTDtBQUNBLFdBQUtxVixPQUFMOztBQUVBalgsaUJBQVdZLGNBQVgsQ0FBMEIsSUFBMUIsRUFBZ0MsYUFBaEM7QUFDRDs7QUFFRDs7Ozs7OztBQTdCVztBQUFBO0FBQUEsOEJBa0NIO0FBQ04sYUFBS3lrQixlQUFMO0FBQ0EsYUFBS0MsY0FBTDtBQUNBLGFBQUt6QixPQUFMO0FBQ0Q7O0FBRUQ7Ozs7OztBQXhDVztBQUFBO0FBQUEsZ0NBNkNEO0FBQ1IvakIsVUFBRTlELE1BQUYsRUFBVWtSLEVBQVYsQ0FBYSx1QkFBYixFQUFzQ2xOLFdBQVd3RSxJQUFYLENBQWdCQyxRQUFoQixDQUF5QixLQUFLb2YsT0FBTCxDQUFhaGQsSUFBYixDQUFrQixJQUFsQixDQUF6QixFQUFrRCxFQUFsRCxDQUF0QztBQUNEOztBQUVEOzs7Ozs7QUFqRFc7QUFBQTtBQUFBLGdDQXNERDtBQUNSLFlBQUl3WixLQUFKOztBQUVBO0FBQ0EsYUFBSyxJQUFJcGQsQ0FBVCxJQUFjLEtBQUtraUIsS0FBbkIsRUFBMEI7QUFDeEIsY0FBSUksT0FBTyxLQUFLSixLQUFMLENBQVdsaUIsQ0FBWCxDQUFYOztBQUVBLGNBQUlqSCxPQUFPK1EsVUFBUCxDQUFrQndZLEtBQUsxWSxLQUF2QixFQUE4QkcsT0FBbEMsRUFBMkM7QUFDekNxVCxvQkFBUWtGLElBQVI7QUFDRDtBQUNGOztBQUVELFlBQUlsRixLQUFKLEVBQVc7QUFDVCxlQUFLM1ksT0FBTCxDQUFhMlksTUFBTW1GLElBQW5CO0FBQ0Q7QUFDRjs7QUFFRDs7Ozs7O0FBdkVXO0FBQUE7QUFBQSx3Q0E0RU87QUFDaEIsYUFBSyxJQUFJdmlCLENBQVQsSUFBY2pELFdBQVdzRixVQUFYLENBQXNCNEcsT0FBcEMsRUFBNkM7QUFDM0MsY0FBSVcsUUFBUTdNLFdBQVdzRixVQUFYLENBQXNCNEcsT0FBdEIsQ0FBOEJqSixDQUE5QixDQUFaO0FBQ0FpaUIsc0JBQVlPLGVBQVosQ0FBNEI1WSxNQUFNdE0sSUFBbEMsSUFBMENzTSxNQUFNcFAsS0FBaEQ7QUFDRDtBQUNGOztBQUVEOzs7Ozs7OztBQW5GVztBQUFBO0FBQUEscUNBMEZJdUssT0ExRkosRUEwRmE7QUFDdEIsWUFBSTBkLFlBQVksRUFBaEI7QUFDQSxZQUFJUCxLQUFKOztBQUVBLFlBQUksS0FBS2xVLE9BQUwsQ0FBYWtVLEtBQWpCLEVBQXdCO0FBQ3RCQSxrQkFBUSxLQUFLbFUsT0FBTCxDQUFha1UsS0FBckI7QUFDRCxTQUZELE1BR0s7QUFDSEEsa0JBQVEsS0FBS2xrQixRQUFMLENBQWNDLElBQWQsQ0FBbUIsYUFBbkIsRUFBa0NtZixLQUFsQyxDQUF3QyxVQUF4QyxDQUFSO0FBQ0Q7O0FBRUQsYUFBSyxJQUFJcGQsQ0FBVCxJQUFja2lCLEtBQWQsRUFBcUI7QUFDbkIsY0FBSUksT0FBT0osTUFBTWxpQixDQUFOLEVBQVNILEtBQVQsQ0FBZSxDQUFmLEVBQWtCLENBQUMsQ0FBbkIsRUFBc0JXLEtBQXRCLENBQTRCLElBQTVCLENBQVg7QUFDQSxjQUFJK2hCLE9BQU9ELEtBQUt6aUIsS0FBTCxDQUFXLENBQVgsRUFBYyxDQUFDLENBQWYsRUFBa0I2UyxJQUFsQixDQUF1QixFQUF2QixDQUFYO0FBQ0EsY0FBSTlJLFFBQVEwWSxLQUFLQSxLQUFLaGpCLE1BQUwsR0FBYyxDQUFuQixDQUFaOztBQUVBLGNBQUkyaUIsWUFBWU8sZUFBWixDQUE0QjVZLEtBQTVCLENBQUosRUFBd0M7QUFDdENBLG9CQUFRcVksWUFBWU8sZUFBWixDQUE0QjVZLEtBQTVCLENBQVI7QUFDRDs7QUFFRDZZLG9CQUFVam5CLElBQVYsQ0FBZTtBQUNiK21CLGtCQUFNQSxJQURPO0FBRWIzWSxtQkFBT0E7QUFGTSxXQUFmO0FBSUQ7O0FBRUQsYUFBS3NZLEtBQUwsR0FBYU8sU0FBYjtBQUNEOztBQUVEOzs7Ozs7O0FBdkhXO0FBQUE7QUFBQSw4QkE2SEhGLElBN0hHLEVBNkhHO0FBQ1osWUFBSSxLQUFLSixXQUFMLEtBQXFCSSxJQUF6QixFQUErQjs7QUFFL0IsWUFBSTNqQixRQUFRLElBQVo7QUFBQSxZQUNJVixVQUFVLHlCQURkOztBQUdBO0FBQ0EsWUFBSSxLQUFLRixRQUFMLENBQWMsQ0FBZCxFQUFpQmxELFFBQWpCLEtBQThCLEtBQWxDLEVBQXlDO0FBQ3ZDLGVBQUtrRCxRQUFMLENBQWNaLElBQWQsQ0FBbUIsS0FBbkIsRUFBMEJtbEIsSUFBMUIsRUFBZ0N0USxJQUFoQyxDQUFxQyxZQUFXO0FBQzlDclQsa0JBQU11akIsV0FBTixHQUFvQkksSUFBcEI7QUFDRCxXQUZELEVBR0Nya0IsT0FIRCxDQUdTQSxPQUhUO0FBSUQ7QUFDRDtBQU5BLGFBT0ssSUFBSXFrQixLQUFLbkYsS0FBTCxDQUFXLHlDQUFYLENBQUosRUFBMkQ7QUFDOUQsaUJBQUtwZixRQUFMLENBQWNxTCxHQUFkLENBQWtCLEVBQUUsb0JBQW9CLFNBQU9rWixJQUFQLEdBQVksR0FBbEMsRUFBbEIsRUFDS3JrQixPQURMLENBQ2FBLE9BRGI7QUFFRDtBQUNEO0FBSkssZUFLQTtBQUNIckIsZ0JBQUVnTixHQUFGLENBQU0wWSxJQUFOLEVBQVksVUFBU0csUUFBVCxFQUFtQjtBQUM3QjlqQixzQkFBTVosUUFBTixDQUFlMmtCLElBQWYsQ0FBb0JELFFBQXBCLEVBQ014a0IsT0FETixDQUNjQSxPQURkO0FBRUFyQixrQkFBRTZsQixRQUFGLEVBQVl6akIsVUFBWjtBQUNBTCxzQkFBTXVqQixXQUFOLEdBQW9CSSxJQUFwQjtBQUNELGVBTEQ7QUFNRDs7QUFFRDs7OztBQUlBO0FBQ0Q7O0FBRUQ7Ozs7O0FBaEtXO0FBQUE7QUFBQSxnQ0FvS0Q7QUFDUjtBQUNEO0FBdEtVOztBQUFBO0FBQUE7O0FBeUtiOzs7OztBQUdBTixjQUFZbk8sUUFBWixHQUF1QjtBQUNyQjs7OztBQUlBb08sV0FBTztBQUxjLEdBQXZCOztBQVFBRCxjQUFZTyxlQUFaLEdBQThCO0FBQzVCLGlCQUFhLHFDQURlO0FBRTVCLGdCQUFZLG9DQUZnQjtBQUc1QixjQUFVO0FBSGtCLEdBQTlCOztBQU1BO0FBQ0F6bEIsYUFBV00sTUFBWCxDQUFrQjRrQixXQUFsQixFQUErQixhQUEvQjtBQUVDLENBN0xBLENBNkxDdmQsTUE3TEQsQ0FBRDtDQ0ZBOzs7Ozs7QUFFQSxDQUFDLFVBQVM3SCxDQUFULEVBQVk7O0FBRWI7Ozs7O0FBRmEsTUFPUCtsQixRQVBPO0FBUVg7Ozs7Ozs7QUFPQSxzQkFBWTdkLE9BQVosRUFBcUJpSixPQUFyQixFQUE4QjtBQUFBOztBQUM1QixXQUFLaFEsUUFBTCxHQUFnQitHLE9BQWhCO0FBQ0EsV0FBS2lKLE9BQUwsR0FBZ0JuUixFQUFFcUwsTUFBRixDQUFTLEVBQVQsRUFBYTBhLFNBQVM5TyxRQUF0QixFQUFnQyxLQUFLOVYsUUFBTCxDQUFjQyxJQUFkLEVBQWhDLEVBQXNEK1AsT0FBdEQsQ0FBaEI7O0FBRUEsV0FBS3JQLEtBQUw7O0FBRUE1QixpQkFBV1ksY0FBWCxDQUEwQixJQUExQixFQUFnQyxVQUFoQztBQUNEOztBQUVEOzs7Ozs7QUF4Qlc7QUFBQTtBQUFBLDhCQTRCSDtBQUNOLFlBQUk2TSxLQUFLLEtBQUt4TSxRQUFMLENBQWMsQ0FBZCxFQUFpQndNLEVBQWpCLElBQXVCek4sV0FBV2dCLFdBQVgsQ0FBdUIsQ0FBdkIsRUFBMEIsVUFBMUIsQ0FBaEM7QUFDQSxZQUFJYSxRQUFRLElBQVo7QUFDQSxhQUFLaWtCLFFBQUwsR0FBZ0JobUIsRUFBRSx3QkFBRixDQUFoQjtBQUNBLGFBQUtpbUIsTUFBTCxHQUFjLEtBQUs5a0IsUUFBTCxDQUFja0MsSUFBZCxDQUFtQixHQUFuQixDQUFkO0FBQ0EsYUFBS2xDLFFBQUwsQ0FBY1osSUFBZCxDQUFtQjtBQUNqQix5QkFBZW9OLEVBREU7QUFFakIseUJBQWVBLEVBRkU7QUFHakIsZ0JBQU1BO0FBSFcsU0FBbkI7QUFLQSxhQUFLdVksT0FBTCxHQUFlbG1CLEdBQWY7QUFDQSxhQUFLbW1CLFNBQUwsR0FBaUJDLFNBQVNscUIsT0FBT3NOLFdBQWhCLEVBQTZCLEVBQTdCLENBQWpCOztBQUVBLGFBQUsyTixPQUFMO0FBQ0Q7O0FBRUQ7Ozs7OztBQTVDVztBQUFBO0FBQUEsbUNBaURFO0FBQ1gsWUFBSXBWLFFBQVEsSUFBWjtBQUFBLFlBQ0kxRixPQUFPOEMsU0FBUzlDLElBRHBCO0FBQUEsWUFFSXlwQixPQUFPM21CLFNBQVMrUyxlQUZwQjs7QUFJQSxhQUFLbVUsTUFBTCxHQUFjLEVBQWQ7QUFDQSxhQUFLQyxTQUFMLEdBQWlCM2pCLEtBQUtDLEtBQUwsQ0FBV0QsS0FBS2dFLEdBQUwsQ0FBU3pLLE9BQU9xcUIsV0FBaEIsRUFBNkJULEtBQUtVLFlBQWxDLENBQVgsQ0FBakI7QUFDQSxhQUFLQyxTQUFMLEdBQWlCOWpCLEtBQUtDLEtBQUwsQ0FBV0QsS0FBS2dFLEdBQUwsQ0FBU3RLLEtBQUtxcUIsWUFBZCxFQUE0QnJxQixLQUFLc29CLFlBQWpDLEVBQStDbUIsS0FBS1UsWUFBcEQsRUFBa0VWLEtBQUtZLFlBQXZFLEVBQXFGWixLQUFLbkIsWUFBMUYsQ0FBWCxDQUFqQjs7QUFFQSxhQUFLcUIsUUFBTCxDQUFjbmtCLElBQWQsQ0FBbUIsWUFBVTtBQUMzQixjQUFJOGtCLE9BQU8zbUIsRUFBRSxJQUFGLENBQVg7QUFBQSxjQUNJNG1CLEtBQUtqa0IsS0FBS0MsS0FBTCxDQUFXK2pCLEtBQUsvZCxNQUFMLEdBQWNMLEdBQWQsR0FBb0J4RyxNQUFNb1AsT0FBTixDQUFjMFYsU0FBN0MsQ0FEVDtBQUVBRixlQUFLRyxXQUFMLEdBQW1CRixFQUFuQjtBQUNBN2tCLGdCQUFNc2tCLE1BQU4sQ0FBYTFuQixJQUFiLENBQWtCaW9CLEVBQWxCO0FBQ0QsU0FMRDtBQU1EOztBQUVEOzs7OztBQWxFVztBQUFBO0FBQUEsZ0NBc0VEO0FBQ1IsWUFBSTdrQixRQUFRLElBQVo7QUFBQSxZQUNJd2QsUUFBUXZmLEVBQUUsWUFBRixDQURaO0FBQUEsWUFFSXdELE9BQU87QUFDTDhMLG9CQUFVdk4sTUFBTW9QLE9BQU4sQ0FBYzRWLGlCQURuQjtBQUVMQyxrQkFBVWpsQixNQUFNb1AsT0FBTixDQUFjOFY7QUFGbkIsU0FGWDtBQU1Bam5CLFVBQUU5RCxNQUFGLEVBQVVpVSxHQUFWLENBQWMsTUFBZCxFQUFzQixZQUFVO0FBQzlCLGNBQUdwTyxNQUFNb1AsT0FBTixDQUFjK1YsV0FBakIsRUFBNkI7QUFDM0IsZ0JBQUdDLFNBQVNDLElBQVosRUFBaUI7QUFDZnJsQixvQkFBTXNsQixXQUFOLENBQWtCRixTQUFTQyxJQUEzQjtBQUNEO0FBQ0Y7QUFDRHJsQixnQkFBTXVsQixVQUFOO0FBQ0F2bEIsZ0JBQU13bEIsYUFBTjtBQUNELFNBUkQ7O0FBVUEsYUFBS3BtQixRQUFMLENBQWNpTSxFQUFkLENBQWlCO0FBQ2YsaUNBQXVCLEtBQUtuSyxNQUFMLENBQVk4RCxJQUFaLENBQWlCLElBQWpCLENBRFI7QUFFZixpQ0FBdUIsS0FBS3dnQixhQUFMLENBQW1CeGdCLElBQW5CLENBQXdCLElBQXhCO0FBRlIsU0FBakIsRUFHR3FHLEVBSEgsQ0FHTSxtQkFITixFQUcyQixjQUgzQixFQUcyQyxVQUFTeEosQ0FBVCxFQUFZO0FBQ25EQSxZQUFFdU8sY0FBRjtBQUNBLGNBQUlxVixVQUFZLEtBQUtwcEIsWUFBTCxDQUFrQixNQUFsQixDQUFoQjtBQUNBMkQsZ0JBQU1zbEIsV0FBTixDQUFrQkcsT0FBbEI7QUFDSCxTQVBEO0FBUUQ7O0FBRUQ7Ozs7OztBQWpHVztBQUFBO0FBQUEsa0NBc0dDQyxHQXRHRCxFQXNHTTtBQUNmLFlBQUl0QixZQUFZeGpCLEtBQUtDLEtBQUwsQ0FBVzVDLEVBQUV5bkIsR0FBRixFQUFPN2UsTUFBUCxHQUFnQkwsR0FBaEIsR0FBc0IsS0FBSzRJLE9BQUwsQ0FBYTBWLFNBQWIsR0FBeUIsQ0FBL0MsR0FBbUQsS0FBSzFWLE9BQUwsQ0FBYXVXLFNBQTNFLENBQWhCOztBQUVBMW5CLFVBQUUsWUFBRixFQUFnQjJuQixJQUFoQixDQUFxQixJQUFyQixFQUEyQnhZLE9BQTNCLENBQW1DLEVBQUV5WSxXQUFXekIsU0FBYixFQUFuQyxFQUE2RCxLQUFLaFYsT0FBTCxDQUFhNFYsaUJBQTFFLEVBQTZGLEtBQUs1VixPQUFMLENBQWE4VixlQUExRztBQUNEOztBQUVEOzs7OztBQTVHVztBQUFBO0FBQUEsK0JBZ0hGO0FBQ1AsYUFBS0ssVUFBTDtBQUNBLGFBQUtDLGFBQUw7QUFDRDs7QUFFRDs7Ozs7OztBQXJIVztBQUFBO0FBQUEsc0NBMkhHLHdCQUEwQjtBQUN0QyxZQUFJTSxTQUFTLGdCQUFpQnpCLFNBQVNscUIsT0FBT3NOLFdBQWhCLEVBQTZCLEVBQTdCLENBQTlCO0FBQUEsWUFDSXNlLE1BREo7O0FBR0EsWUFBR0QsU0FBUyxLQUFLdkIsU0FBZCxLQUE0QixLQUFLRyxTQUFwQyxFQUE4QztBQUFFcUIsbUJBQVMsS0FBS3pCLE1BQUwsQ0FBWTVqQixNQUFaLEdBQXFCLENBQTlCO0FBQWtDLFNBQWxGLE1BQ0ssSUFBR29sQixTQUFTLEtBQUt4QixNQUFMLENBQVksQ0FBWixDQUFaLEVBQTJCO0FBQUV5QixtQkFBUyxDQUFUO0FBQWEsU0FBMUMsTUFDRDtBQUNGLGNBQUlDLFNBQVMsS0FBSzVCLFNBQUwsR0FBaUIwQixNQUE5QjtBQUFBLGNBQ0k5bEIsUUFBUSxJQURaO0FBQUEsY0FFSWltQixhQUFhLEtBQUszQixNQUFMLENBQVk1YSxNQUFaLENBQW1CLFVBQVN0SixDQUFULEVBQVlnQixDQUFaLEVBQWM7QUFDNUMsbUJBQU80a0IsU0FBUzVsQixLQUFLMGxCLE1BQWQsR0FBdUIxbEIsSUFBSUosTUFBTW9QLE9BQU4sQ0FBYzBWLFNBQWxCLElBQStCZ0IsTUFBN0QsQ0FENEMsQ0FDd0I7QUFDckUsV0FGWSxDQUZqQjtBQUtBQyxtQkFBU0UsV0FBV3ZsQixNQUFYLEdBQW9CdWxCLFdBQVd2bEIsTUFBWCxHQUFvQixDQUF4QyxHQUE0QyxDQUFyRDtBQUNEOztBQUVELGFBQUt5akIsT0FBTCxDQUFhM2dCLFdBQWIsQ0FBeUIsS0FBSzRMLE9BQUwsQ0FBYXJCLFdBQXRDO0FBQ0EsYUFBS29XLE9BQUwsR0FBZSxLQUFLRCxNQUFMLENBQVlyVyxFQUFaLENBQWVrWSxNQUFmLEVBQXVCOVgsUUFBdkIsQ0FBZ0MsS0FBS21CLE9BQUwsQ0FBYXJCLFdBQTdDLENBQWY7O0FBRUEsWUFBRyxLQUFLcUIsT0FBTCxDQUFhK1YsV0FBaEIsRUFBNEI7QUFDMUIsY0FBSUUsT0FBTyxLQUFLbEIsT0FBTCxDQUFhLENBQWIsRUFBZ0I5bkIsWUFBaEIsQ0FBNkIsTUFBN0IsQ0FBWDtBQUNBLGNBQUdsQyxPQUFPK3JCLE9BQVAsQ0FBZUMsU0FBbEIsRUFBNEI7QUFDMUJoc0IsbUJBQU8rckIsT0FBUCxDQUFlQyxTQUFmLENBQXlCLElBQXpCLEVBQStCLElBQS9CLEVBQXFDZCxJQUFyQztBQUNELFdBRkQsTUFFSztBQUNIbHJCLG1CQUFPaXJCLFFBQVAsQ0FBZ0JDLElBQWhCLEdBQXVCQSxJQUF2QjtBQUNEO0FBQ0Y7O0FBRUQsYUFBS2pCLFNBQUwsR0FBaUIwQixNQUFqQjtBQUNBOzs7O0FBSUEsYUFBSzFtQixRQUFMLENBQWNFLE9BQWQsQ0FBc0Isb0JBQXRCLEVBQTRDLENBQUMsS0FBSzZrQixPQUFOLENBQTVDO0FBQ0Q7O0FBRUQ7Ozs7O0FBOUpXO0FBQUE7QUFBQSxnQ0FrS0Q7QUFDUixhQUFLL2tCLFFBQUwsQ0FBYzJVLEdBQWQsQ0FBa0IsMEJBQWxCLEVBQ0t6UyxJQURMLE9BQ2MsS0FBSzhOLE9BQUwsQ0FBYXJCLFdBRDNCLEVBQzBDdkssV0FEMUMsQ0FDc0QsS0FBSzRMLE9BQUwsQ0FBYXJCLFdBRG5FOztBQUdBLFlBQUcsS0FBS3FCLE9BQUwsQ0FBYStWLFdBQWhCLEVBQTRCO0FBQzFCLGNBQUlFLE9BQU8sS0FBS2xCLE9BQUwsQ0FBYSxDQUFiLEVBQWdCOW5CLFlBQWhCLENBQTZCLE1BQTdCLENBQVg7QUFDQWxDLGlCQUFPaXJCLFFBQVAsQ0FBZ0JDLElBQWhCLENBQXFCeGYsT0FBckIsQ0FBNkJ3ZixJQUE3QixFQUFtQyxFQUFuQztBQUNEOztBQUVEbG5CLG1CQUFXb0IsZ0JBQVgsQ0FBNEIsSUFBNUI7QUFDRDtBQTVLVTs7QUFBQTtBQUFBOztBQStLYjs7Ozs7QUFHQXlrQixXQUFTOU8sUUFBVCxHQUFvQjtBQUNsQjs7Ozs7QUFLQThQLHVCQUFtQixHQU5EO0FBT2xCOzs7OztBQUtBRSxxQkFBaUIsUUFaQztBQWFsQjs7Ozs7QUFLQUosZUFBVyxFQWxCTztBQW1CbEI7Ozs7O0FBS0EvVyxpQkFBYSxRQXhCSztBQXlCbEI7Ozs7O0FBS0FvWCxpQkFBYSxLQTlCSztBQStCbEI7Ozs7O0FBS0FRLGVBQVc7QUFwQ08sR0FBcEI7O0FBdUNBO0FBQ0F4bkIsYUFBV00sTUFBWCxDQUFrQnVsQixRQUFsQixFQUE0QixVQUE1QjtBQUVDLENBNU5BLENBNE5DbGUsTUE1TkQsQ0FBRDtDQ0ZBOzs7Ozs7QUFFQSxDQUFDLFVBQVM3SCxDQUFULEVBQVk7O0FBRWI7Ozs7Ozs7O0FBRmEsTUFVUG1vQixTQVZPO0FBV1g7Ozs7Ozs7QUFPQSx1QkFBWWpnQixPQUFaLEVBQXFCaUosT0FBckIsRUFBOEI7QUFBQTs7QUFDNUIsV0FBS2hRLFFBQUwsR0FBZ0IrRyxPQUFoQjtBQUNBLFdBQUtpSixPQUFMLEdBQWVuUixFQUFFcUwsTUFBRixDQUFTLEVBQVQsRUFBYThjLFVBQVVsUixRQUF2QixFQUFpQyxLQUFLOVYsUUFBTCxDQUFjQyxJQUFkLEVBQWpDLEVBQXVEK1AsT0FBdkQsQ0FBZjtBQUNBLFdBQUtpWCxZQUFMLEdBQW9CcG9CLEdBQXBCOztBQUVBLFdBQUs4QixLQUFMO0FBQ0EsV0FBS3FWLE9BQUw7O0FBRUFqWCxpQkFBV1ksY0FBWCxDQUEwQixJQUExQixFQUFnQyxXQUFoQztBQUNEOztBQUVEOzs7Ozs7O0FBN0JXO0FBQUE7QUFBQSw4QkFrQ0g7QUFDTixZQUFJNk0sS0FBSyxLQUFLeE0sUUFBTCxDQUFjWixJQUFkLENBQW1CLElBQW5CLENBQVQ7O0FBRUEsYUFBS1ksUUFBTCxDQUFjWixJQUFkLENBQW1CLGFBQW5CLEVBQWtDLE1BQWxDOztBQUVBO0FBQ0FQLFVBQUViLFFBQUYsRUFDR2tFLElBREgsQ0FDUSxpQkFBZXNLLEVBQWYsR0FBa0IsbUJBQWxCLEdBQXNDQSxFQUF0QyxHQUF5QyxvQkFBekMsR0FBOERBLEVBQTlELEdBQWlFLElBRHpFLEVBRUdwTixJQUZILENBRVEsZUFGUixFQUV5QixPQUZ6QixFQUdHQSxJQUhILENBR1EsZUFIUixFQUd5Qm9OLEVBSHpCOztBQUtBO0FBQ0EsWUFBSSxLQUFLd0QsT0FBTCxDQUFhbU8sWUFBakIsRUFBK0I7QUFDN0IsY0FBSXRmLEVBQUUscUJBQUYsRUFBeUJ5QyxNQUE3QixFQUFxQztBQUNuQyxpQkFBSzRsQixPQUFMLEdBQWVyb0IsRUFBRSxxQkFBRixDQUFmO0FBQ0QsV0FGRCxNQUVPO0FBQ0wsZ0JBQUlzb0IsU0FBU25wQixTQUFTSSxhQUFULENBQXVCLEtBQXZCLENBQWI7QUFDQStvQixtQkFBTzVwQixZQUFQLENBQW9CLE9BQXBCLEVBQTZCLG9CQUE3QjtBQUNBc0IsY0FBRSwyQkFBRixFQUErQnVvQixNQUEvQixDQUFzQ0QsTUFBdEM7O0FBRUEsaUJBQUtELE9BQUwsR0FBZXJvQixFQUFFc29CLE1BQUYsQ0FBZjtBQUNEO0FBQ0Y7O0FBRUQsYUFBS25YLE9BQUwsQ0FBYXFYLFVBQWIsR0FBMEIsS0FBS3JYLE9BQUwsQ0FBYXFYLFVBQWIsSUFBMkIsSUFBSTFPLE1BQUosQ0FBVyxLQUFLM0ksT0FBTCxDQUFhc1gsV0FBeEIsRUFBcUMsR0FBckMsRUFBMENwaUIsSUFBMUMsQ0FBK0MsS0FBS2xGLFFBQUwsQ0FBYyxDQUFkLEVBQWlCVCxTQUFoRSxDQUFyRDs7QUFFQSxZQUFJLEtBQUt5USxPQUFMLENBQWFxWCxVQUFqQixFQUE2QjtBQUMzQixlQUFLclgsT0FBTCxDQUFhdVgsUUFBYixHQUF3QixLQUFLdlgsT0FBTCxDQUFhdVgsUUFBYixJQUF5QixLQUFLdm5CLFFBQUwsQ0FBYyxDQUFkLEVBQWlCVCxTQUFqQixDQUEyQjZmLEtBQTNCLENBQWlDLHVDQUFqQyxFQUEwRSxDQUExRSxFQUE2RTVjLEtBQTdFLENBQW1GLEdBQW5GLEVBQXdGLENBQXhGLENBQWpEO0FBQ0EsZUFBS2dsQixhQUFMO0FBQ0Q7QUFDRCxZQUFJLENBQUMsS0FBS3hYLE9BQUwsQ0FBYXlYLGNBQWxCLEVBQWtDO0FBQ2hDLGVBQUt6WCxPQUFMLENBQWF5WCxjQUFiLEdBQThCamhCLFdBQVd6TCxPQUFPMlIsZ0JBQVAsQ0FBd0I3TixFQUFFLDJCQUFGLEVBQStCLENBQS9CLENBQXhCLEVBQTJEc1Esa0JBQXRFLElBQTRGLElBQTFIO0FBQ0Q7QUFDRjs7QUFFRDs7Ozs7O0FBckVXO0FBQUE7QUFBQSxnQ0EwRUQ7QUFDUixhQUFLblAsUUFBTCxDQUFjMlUsR0FBZCxDQUFrQiwyQkFBbEIsRUFBK0MxSSxFQUEvQyxDQUFrRDtBQUNoRCw2QkFBbUIsS0FBS3NRLElBQUwsQ0FBVTNXLElBQVYsQ0FBZSxJQUFmLENBRDZCO0FBRWhELDhCQUFvQixLQUFLNFcsS0FBTCxDQUFXNVcsSUFBWCxDQUFnQixJQUFoQixDQUY0QjtBQUdoRCwrQkFBcUIsS0FBS2lWLE1BQUwsQ0FBWWpWLElBQVosQ0FBaUIsSUFBakIsQ0FIMkI7QUFJaEQsa0NBQXdCLEtBQUs4aEIsZUFBTCxDQUFxQjloQixJQUFyQixDQUEwQixJQUExQjtBQUp3QixTQUFsRDs7QUFPQSxZQUFJLEtBQUtvSyxPQUFMLENBQWFtTyxZQUFiLElBQTZCLEtBQUsrSSxPQUFMLENBQWE1bEIsTUFBOUMsRUFBc0Q7QUFDcEQsZUFBSzRsQixPQUFMLENBQWFqYixFQUFiLENBQWdCLEVBQUMsc0JBQXNCLEtBQUt1USxLQUFMLENBQVc1VyxJQUFYLENBQWdCLElBQWhCLENBQXZCLEVBQWhCO0FBQ0Q7QUFDRjs7QUFFRDs7Ozs7QUF2Rlc7QUFBQTtBQUFBLHNDQTJGSztBQUNkLFlBQUloRixRQUFRLElBQVo7O0FBRUEvQixVQUFFOUQsTUFBRixFQUFVa1IsRUFBVixDQUFhLHVCQUFiLEVBQXNDLFlBQVc7QUFDL0MsY0FBSWxOLFdBQVdzRixVQUFYLENBQXNCcUgsT0FBdEIsQ0FBOEI5SyxNQUFNb1AsT0FBTixDQUFjdVgsUUFBNUMsQ0FBSixFQUEyRDtBQUN6RDNtQixrQkFBTSttQixNQUFOLENBQWEsSUFBYjtBQUNELFdBRkQsTUFFTztBQUNML21CLGtCQUFNK21CLE1BQU4sQ0FBYSxLQUFiO0FBQ0Q7QUFDRixTQU5ELEVBTUczWSxHQU5ILENBTU8sbUJBTlAsRUFNNEIsWUFBVztBQUNyQyxjQUFJalEsV0FBV3NGLFVBQVgsQ0FBc0JxSCxPQUF0QixDQUE4QjlLLE1BQU1vUCxPQUFOLENBQWN1WCxRQUE1QyxDQUFKLEVBQTJEO0FBQ3pEM21CLGtCQUFNK21CLE1BQU4sQ0FBYSxJQUFiO0FBQ0Q7QUFDRixTQVZEO0FBV0Q7O0FBRUQ7Ozs7OztBQTNHVztBQUFBO0FBQUEsNkJBZ0hKTixVQWhISSxFQWdIUTtBQUNqQixZQUFJTyxVQUFVLEtBQUs1bkIsUUFBTCxDQUFja0MsSUFBZCxDQUFtQixjQUFuQixDQUFkO0FBQ0EsWUFBSW1sQixVQUFKLEVBQWdCO0FBQ2QsZUFBSzdLLEtBQUw7QUFDQSxlQUFLNkssVUFBTCxHQUFrQixJQUFsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFLcm5CLFFBQUwsQ0FBYzJVLEdBQWQsQ0FBa0IsbUNBQWxCO0FBQ0EsY0FBSWlULFFBQVF0bUIsTUFBWixFQUFvQjtBQUFFc21CLG9CQUFRMVksSUFBUjtBQUFpQjtBQUN4QyxTQVZELE1BVU87QUFDTCxlQUFLbVksVUFBTCxHQUFrQixLQUFsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBS3JuQixRQUFMLENBQWNpTSxFQUFkLENBQWlCO0FBQ2YsK0JBQW1CLEtBQUtzUSxJQUFMLENBQVUzVyxJQUFWLENBQWUsSUFBZixDQURKO0FBRWYsaUNBQXFCLEtBQUtpVixNQUFMLENBQVlqVixJQUFaLENBQWlCLElBQWpCO0FBRk4sV0FBakI7QUFJQSxjQUFJZ2lCLFFBQVF0bUIsTUFBWixFQUFvQjtBQUNsQnNtQixvQkFBUTlZLElBQVI7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQ7Ozs7Ozs7O0FBNUlXO0FBQUE7QUFBQSwyQkFtSk43UyxLQW5KTSxFQW1KQ2lFLE9BbkpELEVBbUpVO0FBQ25CLFlBQUksS0FBS0YsUUFBTCxDQUFjMGEsUUFBZCxDQUF1QixTQUF2QixLQUFxQyxLQUFLMk0sVUFBOUMsRUFBMEQ7QUFBRTtBQUFTO0FBQ3JFLFlBQUl6bUIsUUFBUSxJQUFaO0FBQUEsWUFDSXdkLFFBQVF2ZixFQUFFYixTQUFTOUMsSUFBWCxDQURaOztBQUdBLFlBQUksS0FBSzhVLE9BQUwsQ0FBYTZYLFFBQWpCLEVBQTJCO0FBQ3pCaHBCLFlBQUUsTUFBRixFQUFVNG5CLFNBQVYsQ0FBb0IsQ0FBcEI7QUFDRDtBQUNEOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUFJQTFuQixtQkFBV21QLElBQVgsQ0FBZ0IsS0FBSzhCLE9BQUwsQ0FBYXlYLGNBQTdCLEVBQTZDLEtBQUt6bkIsUUFBbEQsRUFBNEQsWUFBVztBQUNyRW5CLFlBQUUsMkJBQUYsRUFBK0JnUSxRQUEvQixDQUF3QyxnQ0FBK0JqTyxNQUFNb1AsT0FBTixDQUFjdEgsUUFBckY7O0FBRUE5SCxnQkFBTVosUUFBTixDQUNHNk8sUUFESCxDQUNZLFNBRFo7O0FBR0E7QUFDQTtBQUNBO0FBQ0QsU0FURDtBQVVBLGFBQUs3TyxRQUFMLENBQWNaLElBQWQsQ0FBbUIsYUFBbkIsRUFBa0MsT0FBbEMsRUFDS2MsT0FETCxDQUNhLHFCQURiOztBQUdBLFlBQUksS0FBSzhQLE9BQUwsQ0FBYW1PLFlBQWpCLEVBQStCO0FBQzdCLGVBQUsrSSxPQUFMLENBQWFyWSxRQUFiLENBQXNCLFlBQXRCO0FBQ0Q7O0FBRUQsWUFBSTNPLE9BQUosRUFBYTtBQUNYLGVBQUsrbUIsWUFBTCxHQUFvQi9tQixRQUFRZCxJQUFSLENBQWEsZUFBYixFQUE4QixNQUE5QixDQUFwQjtBQUNEOztBQUVELFlBQUksS0FBSzRRLE9BQUwsQ0FBYWtRLFNBQWpCLEVBQTRCO0FBQzFCLGVBQUtsZ0IsUUFBTCxDQUFjZ1AsR0FBZCxDQUFrQmpRLFdBQVdrRSxhQUFYLENBQXlCLEtBQUtqRCxRQUE5QixDQUFsQixFQUEyRCxZQUFXO0FBQ3BFWSxrQkFBTVosUUFBTixDQUFla0MsSUFBZixDQUFvQixXQUFwQixFQUFpQ3VNLEVBQWpDLENBQW9DLENBQXBDLEVBQXVDdU0sS0FBdkM7QUFDRCxXQUZEO0FBR0Q7O0FBRUQsWUFBSSxLQUFLaEwsT0FBTCxDQUFhZ1EsU0FBakIsRUFBNEI7QUFDMUJuaEIsWUFBRSwyQkFBRixFQUErQk8sSUFBL0IsQ0FBb0MsVUFBcEMsRUFBZ0QsSUFBaEQ7QUFDQSxlQUFLMG9CLFVBQUw7QUFDRDtBQUNGOztBQUVEOzs7OztBQXpNVztBQUFBO0FBQUEsbUNBNk1FO0FBQ1gsWUFBSUMsWUFBWWhwQixXQUFXbUssUUFBWCxDQUFvQm1CLGFBQXBCLENBQWtDLEtBQUtySyxRQUF2QyxDQUFoQjtBQUFBLFlBQ0k4UyxRQUFRaVYsVUFBVXRaLEVBQVYsQ0FBYSxDQUFiLENBRFo7QUFBQSxZQUVJdVosT0FBT0QsVUFBVXRaLEVBQVYsQ0FBYSxDQUFDLENBQWQsQ0FGWDs7QUFJQXNaLGtCQUFVcFQsR0FBVixDQUFjLGVBQWQsRUFBK0IxSSxFQUEvQixDQUFrQyxzQkFBbEMsRUFBMEQsVUFBU3hKLENBQVQsRUFBWTtBQUNwRSxjQUFJQSxFQUFFL0UsS0FBRixLQUFZLENBQVosSUFBaUIrRSxFQUFFd2xCLE9BQUYsS0FBYyxDQUFuQyxFQUFzQztBQUNwQyxnQkFBSXhsQixFQUFFN0YsTUFBRixLQUFhb3JCLEtBQUssQ0FBTCxDQUFiLElBQXdCLENBQUN2bEIsRUFBRStHLFFBQS9CLEVBQXlDO0FBQ3ZDL0csZ0JBQUV1TyxjQUFGO0FBQ0E4QixvQkFBTWtJLEtBQU47QUFDRDtBQUNELGdCQUFJdlksRUFBRTdGLE1BQUYsS0FBYWtXLE1BQU0sQ0FBTixDQUFiLElBQXlCclEsRUFBRStHLFFBQS9CLEVBQXlDO0FBQ3ZDL0csZ0JBQUV1TyxjQUFGO0FBQ0FnWCxtQkFBS2hOLEtBQUw7QUFDRDtBQUNGO0FBQ0YsU0FYRDtBQVlEOztBQUVEOzs7O0FBSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7QUFuUFc7QUFBQTtBQUFBLDRCQXlQTGpOLEVBelBLLEVBeVBEO0FBQ1IsWUFBSSxDQUFDLEtBQUsvTixRQUFMLENBQWMwYSxRQUFkLENBQXVCLFNBQXZCLENBQUQsSUFBc0MsS0FBSzJNLFVBQS9DLEVBQTJEO0FBQUU7QUFBUzs7QUFFdEUsWUFBSXptQixRQUFRLElBQVo7O0FBRUE7QUFDQS9CLFVBQUUsMkJBQUYsRUFBK0J1RixXQUEvQixpQ0FBeUV4RCxNQUFNb1AsT0FBTixDQUFjdEgsUUFBdkY7QUFDQTlILGNBQU1aLFFBQU4sQ0FBZW9FLFdBQWYsQ0FBMkIsU0FBM0I7QUFDRTtBQUNGO0FBQ0EsYUFBS3BFLFFBQUwsQ0FBY1osSUFBZCxDQUFtQixhQUFuQixFQUFrQyxNQUFsQztBQUNFOzs7O0FBREYsU0FLS2MsT0FMTCxDQUthLHFCQUxiO0FBTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBSSxLQUFLOFAsT0FBTCxDQUFhbU8sWUFBakIsRUFBK0I7QUFDN0IsZUFBSytJLE9BQUwsQ0FBYTlpQixXQUFiLENBQXlCLFlBQXpCO0FBQ0Q7O0FBRUQsYUFBSzZpQixZQUFMLENBQWtCN25CLElBQWxCLENBQXVCLGVBQXZCLEVBQXdDLE9BQXhDO0FBQ0EsWUFBSSxLQUFLNFEsT0FBTCxDQUFhZ1EsU0FBakIsRUFBNEI7QUFDMUJuaEIsWUFBRSwyQkFBRixFQUErQnVCLFVBQS9CLENBQTBDLFVBQTFDO0FBQ0Q7QUFDRjs7QUFFRDs7Ozs7OztBQXpSVztBQUFBO0FBQUEsNkJBK1JKbkUsS0EvUkksRUErUkdpRSxPQS9SSCxFQStSWTtBQUNyQixZQUFJLEtBQUtGLFFBQUwsQ0FBYzBhLFFBQWQsQ0FBdUIsU0FBdkIsQ0FBSixFQUF1QztBQUNyQyxlQUFLOEIsS0FBTCxDQUFXdmdCLEtBQVgsRUFBa0JpRSxPQUFsQjtBQUNELFNBRkQsTUFHSztBQUNILGVBQUtxYyxJQUFMLENBQVV0Z0IsS0FBVixFQUFpQmlFLE9BQWpCO0FBQ0Q7QUFDRjs7QUFFRDs7Ozs7O0FBeFNXO0FBQUE7QUFBQSxzQ0E2U0tqRSxLQTdTTCxFQTZTWTtBQUNyQixZQUFJQSxNQUFNeUIsS0FBTixLQUFnQixFQUFwQixFQUF3Qjs7QUFFeEJ6QixjQUFNOFgsZUFBTjtBQUNBOVgsY0FBTStVLGNBQU47QUFDQSxhQUFLd0wsS0FBTDtBQUNBLGFBQUt5SyxZQUFMLENBQWtCak0sS0FBbEI7QUFDRDs7QUFFRDs7Ozs7QUF0VFc7QUFBQTtBQUFBLGdDQTBURDtBQUNSLGFBQUt3QixLQUFMO0FBQ0EsYUFBS3hjLFFBQUwsQ0FBYzJVLEdBQWQsQ0FBa0IsMkJBQWxCO0FBQ0EsYUFBS3VTLE9BQUwsQ0FBYXZTLEdBQWIsQ0FBaUIsZUFBakI7O0FBRUE1VixtQkFBV29CLGdCQUFYLENBQTRCLElBQTVCO0FBQ0Q7QUFoVVU7O0FBQUE7QUFBQTs7QUFtVWI2bUIsWUFBVWxSLFFBQVYsR0FBcUI7QUFDbkI7Ozs7O0FBS0FxSSxrQkFBYyxJQU5LOztBQVFuQjs7Ozs7QUFLQXNKLG9CQUFnQixDQWJHOztBQWVuQjs7Ozs7QUFLQS9lLGNBQVUsTUFwQlM7O0FBc0JuQjs7Ozs7QUFLQW1mLGNBQVUsSUEzQlM7O0FBNkJuQjs7Ozs7QUFLQVIsZ0JBQVksS0FsQ087O0FBb0NuQjs7Ozs7QUFLQUUsY0FBVSxJQXpDUzs7QUEyQ25COzs7OztBQUtBckgsZUFBVyxJQWhEUTs7QUFrRG5COzs7Ozs7QUFNQW9ILGlCQUFhLGFBeERNOztBQTBEbkI7Ozs7O0FBS0F0SCxlQUFXO0FBL0RRLEdBQXJCOztBQWtFQTtBQUNBamhCLGFBQVdNLE1BQVgsQ0FBa0IybkIsU0FBbEIsRUFBNkIsV0FBN0I7QUFFQyxDQXhZQSxDQXdZQ3RnQixNQXhZRCxDQUFEO0NDRkE7Ozs7OztBQUVBLENBQUMsVUFBUzdILENBQVQsRUFBWTs7QUFFYjs7Ozs7Ozs7O0FBRmEsTUFXUHFwQixLQVhPO0FBWVg7Ozs7OztBQU1BLG1CQUFZbmhCLE9BQVosRUFBcUJpSixPQUFyQixFQUE2QjtBQUFBOztBQUMzQixXQUFLaFEsUUFBTCxHQUFnQitHLE9BQWhCO0FBQ0EsV0FBS2lKLE9BQUwsR0FBZW5SLEVBQUVxTCxNQUFGLENBQVMsRUFBVCxFQUFhZ2UsTUFBTXBTLFFBQW5CLEVBQTZCLEtBQUs5VixRQUFMLENBQWNDLElBQWQsRUFBN0IsRUFBbUQrUCxPQUFuRCxDQUFmOztBQUVBLFdBQUtyUCxLQUFMOztBQUVBNUIsaUJBQVdZLGNBQVgsQ0FBMEIsSUFBMUIsRUFBZ0MsT0FBaEM7QUFDQVosaUJBQVdtSyxRQUFYLENBQW9Cc0IsUUFBcEIsQ0FBNkIsT0FBN0IsRUFBc0M7QUFDcEMsZUFBTztBQUNMLHlCQUFlLE1BRFY7QUFFTCx3QkFBYztBQUZULFNBRDZCO0FBS3BDLGVBQU87QUFDTCx3QkFBYyxNQURUO0FBRUwseUJBQWU7QUFGVjtBQUw2QixPQUF0QztBQVVEOztBQUVEOzs7Ozs7O0FBckNXO0FBQUE7QUFBQSw4QkEwQ0g7QUFDTixhQUFLdVQsUUFBTCxHQUFnQixLQUFLL2QsUUFBTCxDQUFja0MsSUFBZCxPQUF1QixLQUFLOE4sT0FBTCxDQUFhbVksY0FBcEMsQ0FBaEI7QUFDQSxhQUFLQyxPQUFMLEdBQWUsS0FBS3BvQixRQUFMLENBQWNrQyxJQUFkLE9BQXVCLEtBQUs4TixPQUFMLENBQWFxWSxVQUFwQyxDQUFmO0FBQ0EsWUFBSUMsVUFBVSxLQUFLdG9CLFFBQUwsQ0FBY2tDLElBQWQsQ0FBbUIsS0FBbkIsQ0FBZDtBQUFBLFlBQ0FxbUIsYUFBYSxLQUFLSCxPQUFMLENBQWE5ZCxNQUFiLENBQW9CLFlBQXBCLENBRGI7O0FBR0EsWUFBSSxDQUFDaWUsV0FBV2puQixNQUFoQixFQUF3QjtBQUN0QixlQUFLOG1CLE9BQUwsQ0FBYTNaLEVBQWIsQ0FBZ0IsQ0FBaEIsRUFBbUJJLFFBQW5CLENBQTRCLFdBQTVCO0FBQ0Q7O0FBRUQsWUFBSSxDQUFDLEtBQUttQixPQUFMLENBQWF3WSxNQUFsQixFQUEwQjtBQUN4QixlQUFLSixPQUFMLENBQWF2WixRQUFiLENBQXNCLGFBQXRCO0FBQ0Q7O0FBRUQsWUFBSXlaLFFBQVFobkIsTUFBWixFQUFvQjtBQUNsQnZDLHFCQUFXd1IsY0FBWCxDQUEwQitYLE9BQTFCLEVBQW1DLEtBQUtHLGdCQUFMLENBQXNCN2lCLElBQXRCLENBQTJCLElBQTNCLENBQW5DO0FBQ0QsU0FGRCxNQUVPO0FBQ0wsZUFBSzZpQixnQkFBTCxHQURLLENBQ21CO0FBQ3pCOztBQUVELFlBQUksS0FBS3pZLE9BQUwsQ0FBYTBZLE9BQWpCLEVBQTBCO0FBQ3hCLGVBQUtDLFlBQUw7QUFDRDs7QUFFRCxhQUFLM1MsT0FBTDs7QUFFQSxZQUFJLEtBQUtoRyxPQUFMLENBQWE0WSxRQUFiLElBQXlCLEtBQUtSLE9BQUwsQ0FBYTltQixNQUFiLEdBQXNCLENBQW5ELEVBQXNEO0FBQ3BELGVBQUt1bkIsT0FBTDtBQUNEOztBQUVELFlBQUksS0FBSzdZLE9BQUwsQ0FBYThZLFVBQWpCLEVBQTZCO0FBQUU7QUFDN0IsZUFBSy9LLFFBQUwsQ0FBYzNlLElBQWQsQ0FBbUIsVUFBbkIsRUFBK0IsQ0FBL0I7QUFDRDtBQUNGOztBQUVEOzs7Ozs7QUE3RVc7QUFBQTtBQUFBLHFDQWtGSTtBQUNiLGFBQUsycEIsUUFBTCxHQUFnQixLQUFLL29CLFFBQUwsQ0FBY2tDLElBQWQsT0FBdUIsS0FBSzhOLE9BQUwsQ0FBYWdaLFlBQXBDLEVBQW9EOW1CLElBQXBELENBQXlELFFBQXpELENBQWhCO0FBQ0Q7O0FBRUQ7Ozs7O0FBdEZXO0FBQUE7QUFBQSxnQ0EwRkQ7QUFDUixZQUFJdEIsUUFBUSxJQUFaO0FBQ0EsYUFBSy9FLEtBQUwsR0FBYSxJQUFJa0QsV0FBV2dSLEtBQWYsQ0FDWCxLQUFLL1AsUUFETSxFQUVYO0FBQ0VtTyxvQkFBVSxLQUFLNkIsT0FBTCxDQUFhaVosVUFEekI7QUFFRTVZLG9CQUFVO0FBRlosU0FGVyxFQU1YLFlBQVc7QUFDVHpQLGdCQUFNc29CLFdBQU4sQ0FBa0IsSUFBbEI7QUFDRCxTQVJVLENBQWI7QUFTQSxhQUFLcnRCLEtBQUwsQ0FBVzZKLEtBQVg7QUFDRDs7QUFFRDs7Ozs7O0FBeEdXO0FBQUE7QUFBQSx5Q0E2R1E7QUFDakIsWUFBSTlFLFFBQVEsSUFBWjtBQUNBLGFBQUt1b0IsaUJBQUwsQ0FBdUIsVUFBUzNqQixHQUFULEVBQWE7QUFDbEM1RSxnQkFBTXdvQixlQUFOLENBQXNCNWpCLEdBQXRCO0FBQ0QsU0FGRDtBQUdEOztBQUVEOzs7Ozs7O0FBcEhXO0FBQUE7QUFBQSx3Q0EwSE91SSxFQTFIUCxFQTBIVztBQUFDO0FBQ3JCLFlBQUl2SSxNQUFNLENBQVY7QUFBQSxZQUFhNmpCLElBQWI7QUFBQSxZQUFtQnBLLFVBQVUsQ0FBN0I7O0FBRUEsYUFBS21KLE9BQUwsQ0FBYTFuQixJQUFiLENBQWtCLFlBQVc7QUFDM0Iyb0IsaUJBQU8sS0FBS3JoQixxQkFBTCxHQUE2Qk4sTUFBcEM7QUFDQTdJLFlBQUUsSUFBRixFQUFRTyxJQUFSLENBQWEsWUFBYixFQUEyQjZmLE9BQTNCOztBQUVBLGNBQUlBLE9BQUosRUFBYTtBQUFDO0FBQ1pwZ0IsY0FBRSxJQUFGLEVBQVF3TSxHQUFSLENBQVksRUFBQyxZQUFZLFVBQWIsRUFBeUIsV0FBVyxNQUFwQyxFQUFaO0FBQ0Q7QUFDRDdGLGdCQUFNNmpCLE9BQU83akIsR0FBUCxHQUFhNmpCLElBQWIsR0FBb0I3akIsR0FBMUI7QUFDQXlaO0FBQ0QsU0FURDs7QUFXQSxZQUFJQSxZQUFZLEtBQUttSixPQUFMLENBQWE5bUIsTUFBN0IsRUFBcUM7QUFDbkMsZUFBS3ljLFFBQUwsQ0FBYzFTLEdBQWQsQ0FBa0IsRUFBQyxVQUFVN0YsR0FBWCxFQUFsQixFQURtQyxDQUNDO0FBQ3BDdUksYUFBR3ZJLEdBQUgsRUFGbUMsQ0FFMUI7QUFDVjtBQUNGOztBQUVEOzs7Ozs7QUE5SVc7QUFBQTtBQUFBLHNDQW1KS2tDLE1BbkpMLEVBbUphO0FBQ3RCLGFBQUswZ0IsT0FBTCxDQUFhMW5CLElBQWIsQ0FBa0IsWUFBVztBQUMzQjdCLFlBQUUsSUFBRixFQUFRd00sR0FBUixDQUFZLFlBQVosRUFBMEIzRCxNQUExQjtBQUNELFNBRkQ7QUFHRDs7QUFFRDs7Ozs7O0FBekpXO0FBQUE7QUFBQSxnQ0E4SkQ7QUFDUixZQUFJOUcsUUFBUSxJQUFaOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBSSxLQUFLd25CLE9BQUwsQ0FBYTltQixNQUFiLEdBQXNCLENBQTFCLEVBQTZCOztBQUUzQixjQUFJLEtBQUswTyxPQUFMLENBQWF3QyxLQUFqQixFQUF3QjtBQUN0QixpQkFBSzRWLE9BQUwsQ0FBYXpULEdBQWIsQ0FBaUIsd0NBQWpCLEVBQ0MxSSxFQURELENBQ0ksb0JBREosRUFDMEIsVUFBU3hKLENBQVQsRUFBVztBQUNuQ0EsZ0JBQUV1TyxjQUFGO0FBQ0FwUSxvQkFBTXNvQixXQUFOLENBQWtCLElBQWxCO0FBQ0QsYUFKRCxFQUlHamQsRUFKSCxDQUlNLHFCQUpOLEVBSTZCLFVBQVN4SixDQUFULEVBQVc7QUFDdENBLGdCQUFFdU8sY0FBRjtBQUNBcFEsb0JBQU1zb0IsV0FBTixDQUFrQixLQUFsQjtBQUNELGFBUEQ7QUFRRDtBQUNEOztBQUVBLGNBQUksS0FBS2xaLE9BQUwsQ0FBYTRZLFFBQWpCLEVBQTJCO0FBQ3pCLGlCQUFLUixPQUFMLENBQWFuYyxFQUFiLENBQWdCLGdCQUFoQixFQUFrQyxZQUFXO0FBQzNDckwsb0JBQU1aLFFBQU4sQ0FBZUMsSUFBZixDQUFvQixXQUFwQixFQUFpQ1csTUFBTVosUUFBTixDQUFlQyxJQUFmLENBQW9CLFdBQXBCLElBQW1DLEtBQW5DLEdBQTJDLElBQTVFO0FBQ0FXLG9CQUFNL0UsS0FBTixDQUFZK0UsTUFBTVosUUFBTixDQUFlQyxJQUFmLENBQW9CLFdBQXBCLElBQW1DLE9BQW5DLEdBQTZDLE9BQXpEO0FBQ0QsYUFIRDs7QUFLQSxnQkFBSSxLQUFLK1AsT0FBTCxDQUFhc1osWUFBakIsRUFBK0I7QUFDN0IsbUJBQUt0cEIsUUFBTCxDQUFjaU0sRUFBZCxDQUFpQixxQkFBakIsRUFBd0MsWUFBVztBQUNqRHJMLHNCQUFNL0UsS0FBTixDQUFZeVUsS0FBWjtBQUNELGVBRkQsRUFFR3JFLEVBRkgsQ0FFTSxxQkFGTixFQUU2QixZQUFXO0FBQ3RDLG9CQUFJLENBQUNyTCxNQUFNWixRQUFOLENBQWVDLElBQWYsQ0FBb0IsV0FBcEIsQ0FBTCxFQUF1QztBQUNyQ1csd0JBQU0vRSxLQUFOLENBQVk2SixLQUFaO0FBQ0Q7QUFDRixlQU5EO0FBT0Q7QUFDRjs7QUFFRCxjQUFJLEtBQUtzSyxPQUFMLENBQWF1WixVQUFqQixFQUE2QjtBQUMzQixnQkFBSUMsWUFBWSxLQUFLeHBCLFFBQUwsQ0FBY2tDLElBQWQsT0FBdUIsS0FBSzhOLE9BQUwsQ0FBYXlaLFNBQXBDLFdBQW1ELEtBQUt6WixPQUFMLENBQWEwWixTQUFoRSxDQUFoQjtBQUNBRixzQkFBVXBxQixJQUFWLENBQWUsVUFBZixFQUEyQixDQUEzQjtBQUNBO0FBREEsYUFFQzZNLEVBRkQsQ0FFSSxrQ0FGSixFQUV3QyxVQUFTeEosQ0FBVCxFQUFXO0FBQ3hEQSxnQkFBRXVPLGNBQUY7QUFDT3BRLG9CQUFNc29CLFdBQU4sQ0FBa0JycUIsRUFBRSxJQUFGLEVBQVE2YixRQUFSLENBQWlCOVosTUFBTW9QLE9BQU4sQ0FBY3laLFNBQS9CLENBQWxCO0FBQ0QsYUFMRDtBQU1EOztBQUVELGNBQUksS0FBS3paLE9BQUwsQ0FBYTBZLE9BQWpCLEVBQTBCO0FBQ3hCLGlCQUFLSyxRQUFMLENBQWM5YyxFQUFkLENBQWlCLGtDQUFqQixFQUFxRCxZQUFXO0FBQzlELGtCQUFJLGFBQWEvRyxJQUFiLENBQWtCLEtBQUszRixTQUF2QixDQUFKLEVBQXVDO0FBQUUsdUJBQU8sS0FBUDtBQUFlLGVBRE0sQ0FDTjtBQUN4RCxrQkFBSTZhLE1BQU12YixFQUFFLElBQUYsRUFBUW9CLElBQVIsQ0FBYSxPQUFiLENBQVY7QUFBQSxrQkFDQWdLLE1BQU1tUSxNQUFNeFosTUFBTXduQixPQUFOLENBQWM5ZCxNQUFkLENBQXFCLFlBQXJCLEVBQW1DckssSUFBbkMsQ0FBd0MsT0FBeEMsQ0FEWjtBQUFBLGtCQUVBMHBCLFNBQVMvb0IsTUFBTXduQixPQUFOLENBQWMzWixFQUFkLENBQWlCMkwsR0FBakIsQ0FGVDs7QUFJQXhaLG9CQUFNc29CLFdBQU4sQ0FBa0JqZixHQUFsQixFQUF1QjBmLE1BQXZCLEVBQStCdlAsR0FBL0I7QUFDRCxhQVBEO0FBUUQ7O0FBRUQsZUFBSzJELFFBQUwsQ0FBY2xCLEdBQWQsQ0FBa0IsS0FBS2tNLFFBQXZCLEVBQWlDOWMsRUFBakMsQ0FBb0Msa0JBQXBDLEVBQXdELFVBQVN4SixDQUFULEVBQVk7QUFDbEU7QUFDQTFELHVCQUFXbUssUUFBWCxDQUFvQlMsU0FBcEIsQ0FBOEJsSCxDQUE5QixFQUFpQyxPQUFqQyxFQUEwQztBQUN4Q3FZLG9CQUFNLFlBQVc7QUFDZmxhLHNCQUFNc29CLFdBQU4sQ0FBa0IsSUFBbEI7QUFDRCxlQUh1QztBQUl4Q2hPLHdCQUFVLFlBQVc7QUFDbkJ0YSxzQkFBTXNvQixXQUFOLENBQWtCLEtBQWxCO0FBQ0QsZUFOdUM7QUFPeEMvZSx1QkFBUyxZQUFXO0FBQUU7QUFDcEIsb0JBQUl0TCxFQUFFNEQsRUFBRTdGLE1BQUosRUFBWTJOLEVBQVosQ0FBZTNKLE1BQU1tb0IsUUFBckIsQ0FBSixFQUFvQztBQUNsQ25vQix3QkFBTW1vQixRQUFOLENBQWV6ZSxNQUFmLENBQXNCLFlBQXRCLEVBQW9DMFEsS0FBcEM7QUFDRDtBQUNGO0FBWHVDLGFBQTFDO0FBYUQsV0FmRDtBQWdCRDtBQUNGOztBQUVEOzs7Ozs7Ozs7QUE1T1c7QUFBQTtBQUFBLGtDQW9QQzRPLEtBcFBELEVBb1BRQyxXQXBQUixFQW9QcUJ6UCxHQXBQckIsRUFvUDBCO0FBQ25DLFlBQUkwUCxZQUFZLEtBQUsxQixPQUFMLENBQWE5ZCxNQUFiLENBQW9CLFlBQXBCLEVBQWtDbUUsRUFBbEMsQ0FBcUMsQ0FBckMsQ0FBaEI7O0FBRUEsWUFBSSxPQUFPdkosSUFBUCxDQUFZNGtCLFVBQVUsQ0FBVixFQUFhdnFCLFNBQXpCLENBQUosRUFBeUM7QUFBRSxpQkFBTyxLQUFQO0FBQWUsU0FIdkIsQ0FHd0I7O0FBRTNELFlBQUl3cUIsY0FBYyxLQUFLM0IsT0FBTCxDQUFhdFYsS0FBYixFQUFsQjtBQUFBLFlBQ0FrWCxhQUFhLEtBQUs1QixPQUFMLENBQWFKLElBQWIsRUFEYjtBQUFBLFlBRUFpQyxRQUFRTCxRQUFRLE9BQVIsR0FBa0IsTUFGMUI7QUFBQSxZQUdBTSxTQUFTTixRQUFRLE1BQVIsR0FBaUIsT0FIMUI7QUFBQSxZQUlBaHBCLFFBQVEsSUFKUjtBQUFBLFlBS0F1cEIsU0FMQTs7QUFPQSxZQUFJLENBQUNOLFdBQUwsRUFBa0I7QUFBRTtBQUNsQk0sc0JBQVlQLFFBQVE7QUFDbkIsZUFBSzVaLE9BQUwsQ0FBYW9hLFlBQWIsR0FBNEJOLFVBQVVoUCxJQUFWLE9BQW1CLEtBQUs5SyxPQUFMLENBQWFxWSxVQUFoQyxFQUE4Qy9tQixNQUE5QyxHQUF1RHdvQixVQUFVaFAsSUFBVixPQUFtQixLQUFLOUssT0FBTCxDQUFhcVksVUFBaEMsQ0FBdkQsR0FBdUcwQixXQUFuSSxHQUFpSkQsVUFBVWhQLElBQVYsT0FBbUIsS0FBSzlLLE9BQUwsQ0FBYXFZLFVBQWhDLENBRHRJLEdBQ29MO0FBRS9MLGVBQUtyWSxPQUFMLENBQWFvYSxZQUFiLEdBQTRCTixVQUFVM08sSUFBVixPQUFtQixLQUFLbkwsT0FBTCxDQUFhcVksVUFBaEMsRUFBOEMvbUIsTUFBOUMsR0FBdUR3b0IsVUFBVTNPLElBQVYsT0FBbUIsS0FBS25MLE9BQUwsQ0FBYXFZLFVBQWhDLENBQXZELEdBQXVHMkIsVUFBbkksR0FBZ0pGLFVBQVUzTyxJQUFWLE9BQW1CLEtBQUtuTCxPQUFMLENBQWFxWSxVQUFoQyxDQUhqSixDQURnQixDQUlnTDtBQUNqTSxTQUxELE1BS087QUFDTDhCLHNCQUFZTixXQUFaO0FBQ0Q7O0FBRUQsWUFBSU0sVUFBVTdvQixNQUFkLEVBQXNCO0FBQ3BCLGNBQUksS0FBSzBPLE9BQUwsQ0FBYTBZLE9BQWpCLEVBQTBCO0FBQ3hCdE8sa0JBQU1BLE9BQU8sS0FBS2dPLE9BQUwsQ0FBYTdHLEtBQWIsQ0FBbUI0SSxTQUFuQixDQUFiLENBRHdCLENBQ29CO0FBQzVDLGlCQUFLRSxjQUFMLENBQW9CalEsR0FBcEI7QUFDRDs7QUFFRCxjQUFJLEtBQUtwSyxPQUFMLENBQWF3WSxNQUFqQixFQUF5QjtBQUN2QnpwQix1QkFBVzZPLE1BQVgsQ0FBa0JDLFNBQWxCLENBQ0VzYyxVQUFVdGIsUUFBVixDQUFtQixXQUFuQixFQUFnQ3hELEdBQWhDLENBQW9DLEVBQUMsWUFBWSxVQUFiLEVBQXlCLE9BQU8sQ0FBaEMsRUFBcEMsQ0FERixFQUVFLEtBQUsyRSxPQUFMLGdCQUEwQmlhLEtBQTFCLENBRkYsRUFHRSxZQUFVO0FBQ1JFLHdCQUFVOWUsR0FBVixDQUFjLEVBQUMsWUFBWSxVQUFiLEVBQXlCLFdBQVcsT0FBcEMsRUFBZCxFQUNDak0sSUFERCxDQUNNLFdBRE4sRUFDbUIsUUFEbkI7QUFFSCxhQU5EOztBQVFBTCx1QkFBVzZPLE1BQVgsQ0FBa0JLLFVBQWxCLENBQ0U2YixVQUFVMWxCLFdBQVYsQ0FBc0IsV0FBdEIsQ0FERixFQUVFLEtBQUs0TCxPQUFMLGVBQXlCa2EsTUFBekIsQ0FGRixFQUdFLFlBQVU7QUFDUkosd0JBQVUxcEIsVUFBVixDQUFxQixXQUFyQjtBQUNBLGtCQUFHUSxNQUFNb1AsT0FBTixDQUFjNFksUUFBZCxJQUEwQixDQUFDaG9CLE1BQU0vRSxLQUFOLENBQVlzVSxRQUExQyxFQUFtRDtBQUNqRHZQLHNCQUFNL0UsS0FBTixDQUFZdVUsT0FBWjtBQUNEO0FBQ0Q7QUFDRCxhQVRIO0FBVUQsV0FuQkQsTUFtQk87QUFDTDBaLHNCQUFVMWxCLFdBQVYsQ0FBc0IsaUJBQXRCLEVBQXlDaEUsVUFBekMsQ0FBb0QsV0FBcEQsRUFBaUU4TyxJQUFqRTtBQUNBaWIsc0JBQVV0YixRQUFWLENBQW1CLGlCQUFuQixFQUFzQ3pQLElBQXRDLENBQTJDLFdBQTNDLEVBQXdELFFBQXhELEVBQWtFMFAsSUFBbEU7QUFDQSxnQkFBSSxLQUFLa0IsT0FBTCxDQUFhNFksUUFBYixJQUF5QixDQUFDLEtBQUsvc0IsS0FBTCxDQUFXc1UsUUFBekMsRUFBbUQ7QUFDakQsbUJBQUt0VSxLQUFMLENBQVd1VSxPQUFYO0FBQ0Q7QUFDRjtBQUNIOzs7O0FBSUUsZUFBS3BRLFFBQUwsQ0FBY0UsT0FBZCxDQUFzQixzQkFBdEIsRUFBOEMsQ0FBQ2lxQixTQUFELENBQTlDO0FBQ0Q7QUFDRjs7QUFFRDs7Ozs7OztBQWpUVztBQUFBO0FBQUEscUNBdVRJL1AsR0F2VEosRUF1VFM7QUFDbEIsWUFBSWtRLGFBQWEsS0FBS3RxQixRQUFMLENBQWNrQyxJQUFkLE9BQXVCLEtBQUs4TixPQUFMLENBQWFnWixZQUFwQyxFQUNoQjltQixJQURnQixDQUNYLFlBRFcsRUFDR2tDLFdBREgsQ0FDZSxXQURmLEVBQzRCbWEsSUFENUIsRUFBakI7QUFBQSxZQUVBZ00sT0FBT0QsV0FBV3BvQixJQUFYLENBQWdCLFdBQWhCLEVBQTZCc29CLE1BQTdCLEVBRlA7QUFBQSxZQUdBQyxhQUFhLEtBQUsxQixRQUFMLENBQWN0YSxFQUFkLENBQWlCMkwsR0FBakIsRUFBc0J2TCxRQUF0QixDQUErQixXQUEvQixFQUE0Q3VZLE1BQTVDLENBQW1EbUQsSUFBbkQsQ0FIYjtBQUlEOztBQUVEOzs7OztBQTlUVztBQUFBO0FBQUEsZ0NBa1VEO0FBQ1IsYUFBS3ZxQixRQUFMLENBQWMyVSxHQUFkLENBQWtCLFdBQWxCLEVBQStCelMsSUFBL0IsQ0FBb0MsR0FBcEMsRUFBeUN5UyxHQUF6QyxDQUE2QyxXQUE3QyxFQUEwRHhSLEdBQTFELEdBQWdFK0wsSUFBaEU7QUFDQW5RLG1CQUFXb0IsZ0JBQVgsQ0FBNEIsSUFBNUI7QUFDRDtBQXJVVTs7QUFBQTtBQUFBOztBQXdVYituQixRQUFNcFMsUUFBTixHQUFpQjtBQUNmOzs7OztBQUtBNFMsYUFBUyxJQU5NO0FBT2Y7Ozs7O0FBS0FhLGdCQUFZLElBWkc7QUFhZjs7Ozs7QUFLQW1CLHFCQUFpQixnQkFsQkY7QUFtQmY7Ozs7O0FBS0FDLG9CQUFnQixpQkF4QkQ7QUF5QmY7Ozs7OztBQU1BQyxvQkFBZ0IsZUEvQkQ7QUFnQ2Y7Ozs7O0FBS0FDLG1CQUFlLGdCQXJDQTtBQXNDZjs7Ozs7QUFLQWpDLGNBQVUsSUEzQ0s7QUE0Q2Y7Ozs7O0FBS0FLLGdCQUFZLElBakRHO0FBa0RmOzs7OztBQUtBbUIsa0JBQWMsSUF2REM7QUF3RGY7Ozs7O0FBS0E1WCxXQUFPLElBN0RRO0FBOERmOzs7OztBQUtBOFcsa0JBQWMsSUFuRUM7QUFvRWY7Ozs7O0FBS0FSLGdCQUFZLElBekVHO0FBMEVmOzs7OztBQUtBWCxvQkFBZ0IsaUJBL0VEO0FBZ0ZmOzs7OztBQUtBRSxnQkFBWSxhQXJGRztBQXNGZjs7Ozs7QUFLQVcsa0JBQWMsZUEzRkM7QUE0RmY7Ozs7O0FBS0FTLGVBQVcsWUFqR0k7QUFrR2Y7Ozs7O0FBS0FDLGVBQVcsZ0JBdkdJO0FBd0dmOzs7OztBQUtBbEIsWUFBUTtBQTdHTyxHQUFqQjs7QUFnSEE7QUFDQXpwQixhQUFXTSxNQUFYLENBQWtCNm9CLEtBQWxCLEVBQXlCLE9BQXpCO0FBRUMsQ0EzYkEsQ0EyYkN4aEIsTUEzYkQsQ0FBRDtDQ0ZBOzs7Ozs7QUFFQSxDQUFDLFVBQVM3SCxDQUFULEVBQVk7O0FBRWI7Ozs7Ozs7Ozs7QUFGYSxNQVlQaXNCLGNBWk87QUFhWDs7Ozs7OztBQU9BLDRCQUFZL2pCLE9BQVosRUFBcUJpSixPQUFyQixFQUE4QjtBQUFBOztBQUM1QixXQUFLaFEsUUFBTCxHQUFnQm5CLEVBQUVrSSxPQUFGLENBQWhCO0FBQ0EsV0FBS21kLEtBQUwsR0FBYSxLQUFLbGtCLFFBQUwsQ0FBY0MsSUFBZCxDQUFtQixpQkFBbkIsQ0FBYjtBQUNBLFdBQUs4cUIsU0FBTCxHQUFpQixJQUFqQjtBQUNBLFdBQUtDLGFBQUwsR0FBcUIsSUFBckI7O0FBRUEsV0FBS3JxQixLQUFMO0FBQ0EsV0FBS3FWLE9BQUw7O0FBRUFqWCxpQkFBV1ksY0FBWCxDQUEwQixJQUExQixFQUFnQyxnQkFBaEM7QUFDRDs7QUFFRDs7Ozs7OztBQWhDVztBQUFBO0FBQUEsOEJBcUNIO0FBQ047QUFDQSxZQUFJLE9BQU8sS0FBS3VrQixLQUFaLEtBQXNCLFFBQTFCLEVBQW9DO0FBQ2xDLGNBQUkrRyxZQUFZLEVBQWhCOztBQUVBO0FBQ0EsY0FBSS9HLFFBQVEsS0FBS0EsS0FBTCxDQUFXMWhCLEtBQVgsQ0FBaUIsR0FBakIsQ0FBWjs7QUFFQTtBQUNBLGVBQUssSUFBSVIsSUFBSSxDQUFiLEVBQWdCQSxJQUFJa2lCLE1BQU01aUIsTUFBMUIsRUFBa0NVLEdBQWxDLEVBQXVDO0FBQ3JDLGdCQUFJc2lCLE9BQU9KLE1BQU1saUIsQ0FBTixFQUFTUSxLQUFULENBQWUsR0FBZixDQUFYO0FBQ0EsZ0JBQUkwb0IsV0FBVzVHLEtBQUtoakIsTUFBTCxHQUFjLENBQWQsR0FBa0JnakIsS0FBSyxDQUFMLENBQWxCLEdBQTRCLE9BQTNDO0FBQ0EsZ0JBQUk2RyxhQUFhN0csS0FBS2hqQixNQUFMLEdBQWMsQ0FBZCxHQUFrQmdqQixLQUFLLENBQUwsQ0FBbEIsR0FBNEJBLEtBQUssQ0FBTCxDQUE3Qzs7QUFFQSxnQkFBSThHLFlBQVlELFVBQVosTUFBNEIsSUFBaEMsRUFBc0M7QUFDcENGLHdCQUFVQyxRQUFWLElBQXNCRSxZQUFZRCxVQUFaLENBQXRCO0FBQ0Q7QUFDRjs7QUFFRCxlQUFLakgsS0FBTCxHQUFhK0csU0FBYjtBQUNEOztBQUVELFlBQUksQ0FBQ3BzQixFQUFFd3NCLGFBQUYsQ0FBZ0IsS0FBS25ILEtBQXJCLENBQUwsRUFBa0M7QUFDaEMsZUFBS29ILGtCQUFMO0FBQ0Q7QUFDRjs7QUFFRDs7Ozs7O0FBaEVXO0FBQUE7QUFBQSxnQ0FxRUQ7QUFDUixZQUFJMXFCLFFBQVEsSUFBWjs7QUFFQS9CLFVBQUU5RCxNQUFGLEVBQVVrUixFQUFWLENBQWEsdUJBQWIsRUFBc0MsWUFBVztBQUMvQ3JMLGdCQUFNMHFCLGtCQUFOO0FBQ0QsU0FGRDtBQUdBO0FBQ0E7QUFDQTtBQUNEOztBQUVEOzs7Ozs7QUFoRlc7QUFBQTtBQUFBLDJDQXFGVTtBQUNuQixZQUFJQyxTQUFKO0FBQUEsWUFBZTNxQixRQUFRLElBQXZCO0FBQ0E7QUFDQS9CLFVBQUU2QixJQUFGLENBQU8sS0FBS3dqQixLQUFaLEVBQW1CLFVBQVMzbkIsR0FBVCxFQUFjO0FBQy9CLGNBQUl3QyxXQUFXc0YsVUFBWCxDQUFzQnFILE9BQXRCLENBQThCblAsR0FBOUIsQ0FBSixFQUF3QztBQUN0Q2d2Qix3QkFBWWh2QixHQUFaO0FBQ0Q7QUFDRixTQUpEOztBQU1BO0FBQ0EsWUFBSSxDQUFDZ3ZCLFNBQUwsRUFBZ0I7O0FBRWhCO0FBQ0EsWUFBSSxLQUFLUCxhQUFMLFlBQThCLEtBQUs5RyxLQUFMLENBQVdxSCxTQUFYLEVBQXNCbHNCLE1BQXhELEVBQWdFOztBQUVoRTtBQUNBUixVQUFFNkIsSUFBRixDQUFPMHFCLFdBQVAsRUFBb0IsVUFBUzd1QixHQUFULEVBQWNDLEtBQWQsRUFBcUI7QUFDdkNvRSxnQkFBTVosUUFBTixDQUFlb0UsV0FBZixDQUEyQjVILE1BQU1ndkIsUUFBakM7QUFDRCxTQUZEOztBQUlBO0FBQ0EsYUFBS3hyQixRQUFMLENBQWM2TyxRQUFkLENBQXVCLEtBQUtxVixLQUFMLENBQVdxSCxTQUFYLEVBQXNCQyxRQUE3Qzs7QUFFQTtBQUNBLFlBQUksS0FBS1IsYUFBVCxFQUF3QixLQUFLQSxhQUFMLENBQW1CUyxPQUFuQjtBQUN4QixhQUFLVCxhQUFMLEdBQXFCLElBQUksS0FBSzlHLEtBQUwsQ0FBV3FILFNBQVgsRUFBc0Jsc0IsTUFBMUIsQ0FBaUMsS0FBS1csUUFBdEMsRUFBZ0QsRUFBaEQsQ0FBckI7QUFDRDs7QUFFRDs7Ozs7QUFqSFc7QUFBQTtBQUFBLGdDQXFIRDtBQUNSLGFBQUtnckIsYUFBTCxDQUFtQlMsT0FBbkI7QUFDQTVzQixVQUFFOUQsTUFBRixFQUFVNFosR0FBVixDQUFjLG9CQUFkO0FBQ0E1VixtQkFBV29CLGdCQUFYLENBQTRCLElBQTVCO0FBQ0Q7QUF6SFU7O0FBQUE7QUFBQTs7QUE0SGIycUIsaUJBQWVoVixRQUFmLEdBQTBCLEVBQTFCOztBQUVBO0FBQ0EsTUFBSXNWLGNBQWM7QUFDaEJNLGNBQVU7QUFDUkYsZ0JBQVUsVUFERjtBQUVSbnNCLGNBQVFOLFdBQVdFLFFBQVgsQ0FBb0IsZUFBcEIsS0FBd0M7QUFGeEMsS0FETTtBQUtqQjBzQixlQUFXO0FBQ1JILGdCQUFVLFdBREY7QUFFUm5zQixjQUFRTixXQUFXRSxRQUFYLENBQW9CLFdBQXBCLEtBQW9DO0FBRnBDLEtBTE07QUFTaEIyc0IsZUFBVztBQUNUSixnQkFBVSxnQkFERDtBQUVUbnNCLGNBQVFOLFdBQVdFLFFBQVgsQ0FBb0IsZ0JBQXBCLEtBQXlDO0FBRnhDO0FBVEssR0FBbEI7O0FBZUE7QUFDQUYsYUFBV00sTUFBWCxDQUFrQnlyQixjQUFsQixFQUFrQyxnQkFBbEM7QUFFQyxDQWpKQSxDQWlKQ3BrQixNQWpKRCxDQUFEO0NDRkE7Ozs7OztBQUVBLENBQUMsVUFBUzdILENBQVQsRUFBWTs7QUFFYjs7Ozs7O0FBRmEsTUFRUGd0QixnQkFSTztBQVNYOzs7Ozs7O0FBT0EsOEJBQVk5a0IsT0FBWixFQUFxQmlKLE9BQXJCLEVBQThCO0FBQUE7O0FBQzVCLFdBQUtoUSxRQUFMLEdBQWdCbkIsRUFBRWtJLE9BQUYsQ0FBaEI7QUFDQSxXQUFLaUosT0FBTCxHQUFlblIsRUFBRXFMLE1BQUYsQ0FBUyxFQUFULEVBQWEyaEIsaUJBQWlCL1YsUUFBOUIsRUFBd0MsS0FBSzlWLFFBQUwsQ0FBY0MsSUFBZCxFQUF4QyxFQUE4RCtQLE9BQTlELENBQWY7O0FBRUEsV0FBS3JQLEtBQUw7QUFDQSxXQUFLcVYsT0FBTDs7QUFFQWpYLGlCQUFXWSxjQUFYLENBQTBCLElBQTFCLEVBQWdDLGtCQUFoQztBQUNEOztBQUVEOzs7Ozs7O0FBMUJXO0FBQUE7QUFBQSw4QkErQkg7QUFDTixZQUFJbXNCLFdBQVcsS0FBSzlyQixRQUFMLENBQWNDLElBQWQsQ0FBbUIsbUJBQW5CLENBQWY7QUFDQSxZQUFJLENBQUM2ckIsUUFBTCxFQUFlO0FBQ2IxcUIsa0JBQVFDLEtBQVIsQ0FBYyxrRUFBZDtBQUNEOztBQUVELGFBQUswcUIsV0FBTCxHQUFtQmx0QixRQUFNaXRCLFFBQU4sQ0FBbkI7QUFDQSxhQUFLRSxRQUFMLEdBQWdCLEtBQUtoc0IsUUFBTCxDQUFja0MsSUFBZCxDQUFtQixlQUFuQixDQUFoQjs7QUFFQSxhQUFLK3BCLE9BQUw7QUFDRDs7QUFFRDs7Ozs7O0FBM0NXO0FBQUE7QUFBQSxnQ0FnREQ7QUFDUixZQUFJcnJCLFFBQVEsSUFBWjs7QUFFQS9CLFVBQUU5RCxNQUFGLEVBQVVrUixFQUFWLENBQWEsdUJBQWIsRUFBc0MsS0FBS2dnQixPQUFMLENBQWFybUIsSUFBYixDQUFrQixJQUFsQixDQUF0Qzs7QUFFQSxhQUFLb21CLFFBQUwsQ0FBYy9mLEVBQWQsQ0FBaUIsMkJBQWpCLEVBQThDLEtBQUtpZ0IsVUFBTCxDQUFnQnRtQixJQUFoQixDQUFxQixJQUFyQixDQUE5QztBQUNEOztBQUVEOzs7Ozs7QUF4RFc7QUFBQTtBQUFBLGdDQTZERDtBQUNSO0FBQ0EsWUFBSSxDQUFDN0csV0FBV3NGLFVBQVgsQ0FBc0JxSCxPQUF0QixDQUE4QixLQUFLc0UsT0FBTCxDQUFhbWMsT0FBM0MsQ0FBTCxFQUEwRDtBQUN4RCxlQUFLbnNCLFFBQUwsQ0FBYzhPLElBQWQ7QUFDQSxlQUFLaWQsV0FBTCxDQUFpQjdjLElBQWpCO0FBQ0Q7O0FBRUQ7QUFMQSxhQU1LO0FBQ0gsaUJBQUtsUCxRQUFMLENBQWNrUCxJQUFkO0FBQ0EsaUJBQUs2YyxXQUFMLENBQWlCamQsSUFBakI7QUFDRDtBQUNGOztBQUVEOzs7Ozs7QUEzRVc7QUFBQTtBQUFBLG1DQWdGRTtBQUNYLFlBQUksQ0FBQy9QLFdBQVdzRixVQUFYLENBQXNCcUgsT0FBdEIsQ0FBOEIsS0FBS3NFLE9BQUwsQ0FBYW1jLE9BQTNDLENBQUwsRUFBMEQ7QUFDeEQsZUFBS0osV0FBTCxDQUFpQmxSLE1BQWpCLENBQXdCLENBQXhCOztBQUVBOzs7O0FBSUEsZUFBSzdhLFFBQUwsQ0FBY0UsT0FBZCxDQUFzQiw2QkFBdEI7QUFDRDtBQUNGO0FBMUZVO0FBQUE7QUFBQSxnQ0E0RkQ7QUFDUjtBQUNEO0FBOUZVOztBQUFBO0FBQUE7O0FBaUdiMnJCLG1CQUFpQi9WLFFBQWpCLEdBQTRCO0FBQzFCOzs7OztBQUtBcVcsYUFBUztBQU5pQixHQUE1Qjs7QUFTQTtBQUNBcHRCLGFBQVdNLE1BQVgsQ0FBa0J3c0IsZ0JBQWxCLEVBQW9DLGtCQUFwQztBQUVDLENBN0dBLENBNkdDbmxCLE1BN0dELENBQUQ7Q0NGQTs7Ozs7O0FBRUEsQ0FBQyxVQUFTN0gsQ0FBVCxFQUFZOztBQUViOzs7Ozs7Ozs7O0FBRmEsTUFZUHV0QixNQVpPO0FBYVg7Ozs7OztBQU1BLG9CQUFZcmxCLE9BQVosRUFBcUJpSixPQUFyQixFQUE4QjtBQUFBOztBQUM1QixXQUFLaFEsUUFBTCxHQUFnQitHLE9BQWhCO0FBQ0EsV0FBS2lKLE9BQUwsR0FBZW5SLEVBQUVxTCxNQUFGLENBQVMsRUFBVCxFQUFha2lCLE9BQU90VyxRQUFwQixFQUE4QixLQUFLOVYsUUFBTCxDQUFjQyxJQUFkLEVBQTlCLEVBQW9EK1AsT0FBcEQsQ0FBZjtBQUNBLFdBQUtyUCxLQUFMOztBQUVBNUIsaUJBQVdZLGNBQVgsQ0FBMEIsSUFBMUIsRUFBZ0MsUUFBaEM7QUFDQVosaUJBQVdtSyxRQUFYLENBQW9Cc0IsUUFBcEIsQ0FBNkIsUUFBN0IsRUFBdUM7QUFDckMsaUJBQVMsTUFENEI7QUFFckMsaUJBQVMsTUFGNEI7QUFHckMsa0JBQVUsT0FIMkI7QUFJckMsZUFBTyxhQUo4QjtBQUtyQyxxQkFBYTtBQUx3QixPQUF2QztBQU9EOztBQUVEOzs7Ozs7QUFsQ1c7QUFBQTtBQUFBLDhCQXNDSDtBQUNOLGFBQUtnQyxFQUFMLEdBQVUsS0FBS3hNLFFBQUwsQ0FBY1osSUFBZCxDQUFtQixJQUFuQixDQUFWO0FBQ0EsYUFBSzJjLFFBQUwsR0FBZ0IsS0FBaEI7QUFDQSxhQUFLc1EsTUFBTCxHQUFjLEVBQUNDLElBQUl2dEIsV0FBV3NGLFVBQVgsQ0FBc0I2RyxPQUEzQixFQUFkO0FBQ0EsYUFBS3FoQixLQUFMLEdBQWFDLGFBQWI7O0FBRUEsWUFBRyxLQUFLRCxLQUFSLEVBQWM7QUFBRSxlQUFLdnNCLFFBQUwsQ0FBYzZPLFFBQWQsQ0FBdUIsUUFBdkI7QUFBbUM7O0FBRW5ELGFBQUtpUSxPQUFMLEdBQWVqZ0IsbUJBQWlCLEtBQUsyTixFQUF0QixTQUE4QmxMLE1BQTlCLEdBQXVDekMsbUJBQWlCLEtBQUsyTixFQUF0QixRQUF2QyxHQUF1RTNOLHFCQUFtQixLQUFLMk4sRUFBeEIsUUFBdEY7O0FBRUEsWUFBSSxLQUFLc1MsT0FBTCxDQUFheGQsTUFBakIsRUFBeUI7QUFDdkIsY0FBSW1yQixXQUFXLEtBQUszTixPQUFMLENBQWEsQ0FBYixFQUFnQnRTLEVBQWhCLElBQXNCek4sV0FBV2dCLFdBQVgsQ0FBdUIsQ0FBdkIsRUFBMEIsUUFBMUIsQ0FBckM7O0FBRUEsZUFBSytlLE9BQUwsQ0FBYTFmLElBQWIsQ0FBa0I7QUFDaEIsNkJBQWlCLEtBQUtvTixFQUROO0FBRWhCLGtCQUFNaWdCLFFBRlU7QUFHaEIsNkJBQWlCLElBSEQ7QUFJaEIsd0JBQVk7QUFKSSxXQUFsQjtBQU1BLGVBQUt6c0IsUUFBTCxDQUFjWixJQUFkLENBQW1CLEVBQUMsbUJBQW1CcXRCLFFBQXBCLEVBQW5CO0FBQ0Q7O0FBRUQsWUFBSSxLQUFLemMsT0FBTCxDQUFhMGMsVUFBYixJQUEyQixLQUFLMXNCLFFBQUwsQ0FBYzBhLFFBQWQsQ0FBdUIsTUFBdkIsQ0FBL0IsRUFBK0Q7QUFDN0QsZUFBSzFLLE9BQUwsQ0FBYTBjLFVBQWIsR0FBMEIsSUFBMUI7QUFDQSxlQUFLMWMsT0FBTCxDQUFhMmMsT0FBYixHQUF1QixLQUF2QjtBQUNEO0FBQ0QsWUFBSSxLQUFLM2MsT0FBTCxDQUFhMmMsT0FBYixJQUF3QixDQUFDLEtBQUtDLFFBQWxDLEVBQTRDO0FBQzFDLGVBQUtBLFFBQUwsR0FBZ0IsS0FBS0MsWUFBTCxDQUFrQixLQUFLcmdCLEVBQXZCLENBQWhCO0FBQ0Q7O0FBRUQsYUFBS3hNLFFBQUwsQ0FBY1osSUFBZCxDQUFtQjtBQUNmLGtCQUFRLFFBRE87QUFFZix5QkFBZSxJQUZBO0FBR2YsMkJBQWlCLEtBQUtvTixFQUhQO0FBSWYseUJBQWUsS0FBS0E7QUFKTCxTQUFuQjs7QUFPQSxZQUFHLEtBQUtvZ0IsUUFBUixFQUFrQjtBQUNoQixlQUFLNXNCLFFBQUwsQ0FBY3dxQixNQUFkLEdBQXVCdG1CLFFBQXZCLENBQWdDLEtBQUswb0IsUUFBckM7QUFDRCxTQUZELE1BRU87QUFDTCxlQUFLNXNCLFFBQUwsQ0FBY3dxQixNQUFkLEdBQXVCdG1CLFFBQXZCLENBQWdDckYsRUFBRSxNQUFGLENBQWhDO0FBQ0EsZUFBS21CLFFBQUwsQ0FBYzZPLFFBQWQsQ0FBdUIsaUJBQXZCO0FBQ0Q7QUFDRCxhQUFLbUgsT0FBTDtBQUNBLFlBQUksS0FBS2hHLE9BQUwsQ0FBYThjLFFBQWIsSUFBeUIveEIsT0FBT2lyQixRQUFQLENBQWdCQyxJQUFoQixXQUErQixLQUFLelosRUFBakUsRUFBd0U7QUFDdEUzTixZQUFFOUQsTUFBRixFQUFVaVUsR0FBVixDQUFjLGdCQUFkLEVBQWdDLEtBQUt1TixJQUFMLENBQVUzVyxJQUFWLENBQWUsSUFBZixDQUFoQztBQUNEO0FBQ0Y7O0FBRUQ7Ozs7O0FBdkZXO0FBQUE7QUFBQSxtQ0EyRkU0RyxFQTNGRixFQTJGTTtBQUNmLFlBQUlvZ0IsV0FBVy90QixFQUFFLGFBQUYsRUFDRWdRLFFBREYsQ0FDVyxnQkFEWCxFQUVFelAsSUFGRixDQUVPLEVBQUMsWUFBWSxDQUFDLENBQWQsRUFBaUIsZUFBZSxJQUFoQyxFQUZQLEVBR0U4RSxRQUhGLENBR1csTUFIWCxDQUFmO0FBSUEsZUFBTzBvQixRQUFQO0FBQ0Q7O0FBRUQ7Ozs7OztBQW5HVztBQUFBO0FBQUEsd0NBd0dPO0FBQ2hCLFlBQUlqbEIsUUFBUSxLQUFLM0gsUUFBTCxDQUFjK3NCLFVBQWQsRUFBWjtBQUNBLFlBQUlBLGFBQWFsdUIsRUFBRTlELE1BQUYsRUFBVTRNLEtBQVYsRUFBakI7QUFDQSxZQUFJRCxTQUFTLEtBQUsxSCxRQUFMLENBQWNndEIsV0FBZCxFQUFiO0FBQ0EsWUFBSUEsY0FBY251QixFQUFFOUQsTUFBRixFQUFVMk0sTUFBVixFQUFsQjtBQUNBLFlBQUlKLElBQUosRUFBVUYsR0FBVjtBQUNBLFlBQUksS0FBSzRJLE9BQUwsQ0FBYXBILE9BQWIsS0FBeUIsTUFBN0IsRUFBcUM7QUFDbkN0QixpQkFBTzJkLFNBQVMsQ0FBQzhILGFBQWFwbEIsS0FBZCxJQUF1QixDQUFoQyxFQUFtQyxFQUFuQyxDQUFQO0FBQ0QsU0FGRCxNQUVPO0FBQ0xMLGlCQUFPMmQsU0FBUyxLQUFLalYsT0FBTCxDQUFhcEgsT0FBdEIsRUFBK0IsRUFBL0IsQ0FBUDtBQUNEO0FBQ0QsWUFBSSxLQUFLb0gsT0FBTCxDQUFhckgsT0FBYixLQUF5QixNQUE3QixFQUFxQztBQUNuQyxjQUFJakIsU0FBU3NsQixXQUFiLEVBQTBCO0FBQ3hCNWxCLGtCQUFNNmQsU0FBU3pqQixLQUFLNmEsR0FBTCxDQUFTLEdBQVQsRUFBYzJRLGNBQWMsRUFBNUIsQ0FBVCxFQUEwQyxFQUExQyxDQUFOO0FBQ0QsV0FGRCxNQUVPO0FBQ0w1bEIsa0JBQU02ZCxTQUFTLENBQUMrSCxjQUFjdGxCLE1BQWYsSUFBeUIsQ0FBbEMsRUFBcUMsRUFBckMsQ0FBTjtBQUNEO0FBQ0YsU0FORCxNQU1PO0FBQ0xOLGdCQUFNNmQsU0FBUyxLQUFLalYsT0FBTCxDQUFhckgsT0FBdEIsRUFBK0IsRUFBL0IsQ0FBTjtBQUNEO0FBQ0QsYUFBSzNJLFFBQUwsQ0FBY3FMLEdBQWQsQ0FBa0IsRUFBQ2pFLEtBQUtBLE1BQU0sSUFBWixFQUFsQjtBQUNBO0FBQ0E7QUFDQSxZQUFHLENBQUMsS0FBS3dsQixRQUFOLElBQW1CLEtBQUs1YyxPQUFMLENBQWFwSCxPQUFiLEtBQXlCLE1BQS9DLEVBQXdEO0FBQ3RELGVBQUs1SSxRQUFMLENBQWNxTCxHQUFkLENBQWtCLEVBQUMvRCxNQUFNQSxPQUFPLElBQWQsRUFBbEI7QUFDQSxlQUFLdEgsUUFBTCxDQUFjcUwsR0FBZCxDQUFrQixFQUFDNGhCLFFBQVEsS0FBVCxFQUFsQjtBQUNEO0FBRUY7O0FBRUQ7Ozs7O0FBdElXO0FBQUE7QUFBQSxnQ0EwSUQ7QUFDUixZQUFJcnNCLFFBQVEsSUFBWjs7QUFFQSxhQUFLWixRQUFMLENBQWNpTSxFQUFkLENBQWlCO0FBQ2YsNkJBQW1CLEtBQUtzUSxJQUFMLENBQVUzVyxJQUFWLENBQWUsSUFBZixDQURKO0FBRWYsOEJBQW9CLEtBQUs0VyxLQUFMLENBQVc1VyxJQUFYLENBQWdCLElBQWhCLENBRkw7QUFHZiwrQkFBcUIsS0FBS2lWLE1BQUwsQ0FBWWpWLElBQVosQ0FBaUIsSUFBakIsQ0FITjtBQUlmLGlDQUF1QixZQUFXO0FBQ2hDaEYsa0JBQU1zc0IsZUFBTjtBQUNEO0FBTmMsU0FBakI7O0FBU0EsWUFBSSxLQUFLcE8sT0FBTCxDQUFheGQsTUFBakIsRUFBeUI7QUFDdkIsZUFBS3dkLE9BQUwsQ0FBYTdTLEVBQWIsQ0FBZ0IsbUJBQWhCLEVBQXFDLFVBQVN4SixDQUFULEVBQVk7QUFDL0MsZ0JBQUlBLEVBQUUvRSxLQUFGLEtBQVksRUFBWixJQUFrQitFLEVBQUUvRSxLQUFGLEtBQVksRUFBbEMsRUFBc0M7QUFDcEMrRSxnQkFBRXNSLGVBQUY7QUFDQXRSLGdCQUFFdU8sY0FBRjtBQUNBcFEsb0JBQU0yYixJQUFOO0FBQ0Q7QUFDRixXQU5EO0FBT0Q7O0FBRUQsWUFBSSxLQUFLdk0sT0FBTCxDQUFhbU8sWUFBYixJQUE2QixLQUFLbk8sT0FBTCxDQUFhMmMsT0FBOUMsRUFBdUQ7QUFDckQsZUFBS0MsUUFBTCxDQUFjalksR0FBZCxDQUFrQixZQUFsQixFQUFnQzFJLEVBQWhDLENBQW1DLGlCQUFuQyxFQUFzRCxVQUFTeEosQ0FBVCxFQUFZO0FBQ2hFLGdCQUFJQSxFQUFFN0YsTUFBRixLQUFhZ0UsTUFBTVosUUFBTixDQUFlLENBQWYsQ0FBYixJQUFrQ25CLEVBQUVzdUIsUUFBRixDQUFXdnNCLE1BQU1aLFFBQU4sQ0FBZSxDQUFmLENBQVgsRUFBOEJ5QyxFQUFFN0YsTUFBaEMsQ0FBdEMsRUFBK0U7QUFBRTtBQUFTO0FBQzFGZ0Usa0JBQU00YixLQUFOO0FBQ0QsV0FIRDtBQUlEO0FBQ0QsWUFBSSxLQUFLeE0sT0FBTCxDQUFhOGMsUUFBakIsRUFBMkI7QUFDekJqdUIsWUFBRTlELE1BQUYsRUFBVWtSLEVBQVYseUJBQW1DLEtBQUtPLEVBQXhDLEVBQThDLEtBQUs0Z0IsWUFBTCxDQUFrQnhuQixJQUFsQixDQUF1QixJQUF2QixDQUE5QztBQUNEO0FBQ0Y7O0FBRUQ7Ozs7O0FBM0tXO0FBQUE7QUFBQSxtQ0ErS0VuRCxDQS9LRixFQStLSztBQUNkLFlBQUcxSCxPQUFPaXJCLFFBQVAsQ0FBZ0JDLElBQWhCLEtBQTJCLE1BQU0sS0FBS3paLEVBQXRDLElBQTZDLENBQUMsS0FBS3VQLFFBQXRELEVBQStEO0FBQUUsZUFBS1EsSUFBTDtBQUFjLFNBQS9FLE1BQ0k7QUFBRSxlQUFLQyxLQUFMO0FBQWU7QUFDdEI7O0FBR0Q7Ozs7Ozs7QUFyTFc7QUFBQTtBQUFBLDZCQTJMSjtBQUFBOztBQUNMLFlBQUksS0FBS3hNLE9BQUwsQ0FBYThjLFFBQWpCLEVBQTJCO0FBQ3pCLGNBQUk3RyxhQUFXLEtBQUt6WixFQUFwQjs7QUFFQSxjQUFJelIsT0FBTytyQixPQUFQLENBQWVDLFNBQW5CLEVBQThCO0FBQzVCaHNCLG1CQUFPK3JCLE9BQVAsQ0FBZUMsU0FBZixDQUF5QixJQUF6QixFQUErQixJQUEvQixFQUFxQ2QsSUFBckM7QUFDRCxXQUZELE1BRU87QUFDTGxyQixtQkFBT2lyQixRQUFQLENBQWdCQyxJQUFoQixHQUF1QkEsSUFBdkI7QUFDRDtBQUNGOztBQUVELGFBQUtsSyxRQUFMLEdBQWdCLElBQWhCOztBQUVBO0FBQ0EsYUFBSy9iLFFBQUwsQ0FDS3FMLEdBREwsQ0FDUyxFQUFFLGNBQWMsUUFBaEIsRUFEVCxFQUVLeUQsSUFGTCxHQUdLMlgsU0FITCxDQUdlLENBSGY7QUFJQSxZQUFJLEtBQUt6VyxPQUFMLENBQWEyYyxPQUFqQixFQUEwQjtBQUN4QixlQUFLQyxRQUFMLENBQWN2aEIsR0FBZCxDQUFrQixFQUFDLGNBQWMsUUFBZixFQUFsQixFQUE0Q3lELElBQTVDO0FBQ0Q7O0FBRUQsYUFBS29lLGVBQUw7O0FBRUEsYUFBS2x0QixRQUFMLENBQ0drUCxJQURILEdBRUc3RCxHQUZILENBRU8sRUFBRSxjQUFjLEVBQWhCLEVBRlA7O0FBSUEsWUFBRyxLQUFLdWhCLFFBQVIsRUFBa0I7QUFDaEIsZUFBS0EsUUFBTCxDQUFjdmhCLEdBQWQsQ0FBa0IsRUFBQyxjQUFjLEVBQWYsRUFBbEIsRUFBc0M2RCxJQUF0QztBQUNEOztBQUdELFlBQUksQ0FBQyxLQUFLYyxPQUFMLENBQWFxZCxjQUFsQixFQUFrQztBQUNoQzs7Ozs7QUFLQSxlQUFLcnRCLFFBQUwsQ0FBY0UsT0FBZCxDQUFzQixtQkFBdEIsRUFBMkMsS0FBS3NNLEVBQWhEO0FBQ0Q7O0FBRUQ7QUFDQSxZQUFJLEtBQUt3RCxPQUFMLENBQWFzZCxXQUFqQixFQUE4QjtBQUM1QixjQUFJLEtBQUt0ZCxPQUFMLENBQWEyYyxPQUFqQixFQUEwQjtBQUN4QjV0Qix1QkFBVzZPLE1BQVgsQ0FBa0JDLFNBQWxCLENBQTRCLEtBQUsrZSxRQUFqQyxFQUEyQyxTQUEzQztBQUNEO0FBQ0Q3dEIscUJBQVc2TyxNQUFYLENBQWtCQyxTQUFsQixDQUE0QixLQUFLN04sUUFBakMsRUFBMkMsS0FBS2dRLE9BQUwsQ0FBYXNkLFdBQXhELEVBQXFFLFlBQU07QUFDekUsbUJBQUtDLGlCQUFMLEdBQXlCeHVCLFdBQVdtSyxRQUFYLENBQW9CbUIsYUFBcEIsQ0FBa0MsT0FBS3JLLFFBQXZDLENBQXpCO0FBQ0QsV0FGRDtBQUdEO0FBQ0Q7QUFSQSxhQVNLO0FBQ0gsZ0JBQUksS0FBS2dRLE9BQUwsQ0FBYTJjLE9BQWpCLEVBQTBCO0FBQ3hCLG1CQUFLQyxRQUFMLENBQWM5ZCxJQUFkLENBQW1CLENBQW5CO0FBQ0Q7QUFDRCxpQkFBSzlPLFFBQUwsQ0FBYzhPLElBQWQsQ0FBbUIsS0FBS2tCLE9BQUwsQ0FBYXdkLFNBQWhDO0FBQ0Q7O0FBRUQ7QUFDQSxhQUFLeHRCLFFBQUwsQ0FDR1osSUFESCxDQUNRO0FBQ0oseUJBQWUsS0FEWDtBQUVKLHNCQUFZLENBQUM7QUFGVCxTQURSLEVBS0c0YixLQUxIOztBQU9BOzs7O0FBSUEsYUFBS2hiLFFBQUwsQ0FBY0UsT0FBZCxDQUFzQixnQkFBdEI7O0FBRUEsWUFBSSxLQUFLcXNCLEtBQVQsRUFBZ0I7QUFDZCxjQUFJdkgsWUFBWWpxQixPQUFPc04sV0FBdkI7QUFDQXhKLFlBQUUsWUFBRixFQUFnQmdRLFFBQWhCLENBQXlCLGdCQUF6QixFQUEyQzRYLFNBQTNDLENBQXFEekIsU0FBckQ7QUFDRCxTQUhELE1BSUs7QUFDSG5tQixZQUFFLE1BQUYsRUFBVWdRLFFBQVYsQ0FBbUIsZ0JBQW5CO0FBQ0Q7O0FBRURoUSxVQUFFLE1BQUYsRUFDR2dRLFFBREgsQ0FDWSxnQkFEWixFQUVHelAsSUFGSCxDQUVRLGFBRlIsRUFFd0IsS0FBSzRRLE9BQUwsQ0FBYTJjLE9BQWIsSUFBd0IsS0FBSzNjLE9BQUwsQ0FBYTBjLFVBQXRDLEdBQW9ELElBQXBELEdBQTJELEtBRmxGOztBQUlBeHdCLG1CQUFXLFlBQU07QUFDZixpQkFBS3V4QixjQUFMO0FBQ0QsU0FGRCxFQUVHLENBRkg7QUFHRDs7QUFFRDs7Ozs7QUFyUlc7QUFBQTtBQUFBLHVDQXlSTTtBQUNmLFlBQUk3c0IsUUFBUSxJQUFaO0FBQ0EsYUFBSzJzQixpQkFBTCxHQUF5Qnh1QixXQUFXbUssUUFBWCxDQUFvQm1CLGFBQXBCLENBQWtDLEtBQUtySyxRQUF2QyxDQUF6Qjs7QUFFQSxZQUFJLENBQUMsS0FBS2dRLE9BQUwsQ0FBYTJjLE9BQWQsSUFBeUIsS0FBSzNjLE9BQUwsQ0FBYW1PLFlBQXRDLElBQXNELENBQUMsS0FBS25PLE9BQUwsQ0FBYTBjLFVBQXhFLEVBQW9GO0FBQ2xGN3RCLFlBQUUsTUFBRixFQUFVb04sRUFBVixDQUFhLGlCQUFiLEVBQWdDLFVBQVN4SixDQUFULEVBQVk7QUFDMUMsZ0JBQUlBLEVBQUU3RixNQUFGLEtBQWFnRSxNQUFNWixRQUFOLENBQWUsQ0FBZixDQUFiLElBQWtDbkIsRUFBRXN1QixRQUFGLENBQVd2c0IsTUFBTVosUUFBTixDQUFlLENBQWYsQ0FBWCxFQUE4QnlDLEVBQUU3RixNQUFoQyxDQUF0QyxFQUErRTtBQUFFO0FBQVM7QUFDMUZnRSxrQkFBTTRiLEtBQU47QUFDRCxXQUhEO0FBSUQ7O0FBRUQsWUFBSSxLQUFLeE0sT0FBTCxDQUFhMGQsVUFBakIsRUFBNkI7QUFDM0I3dUIsWUFBRTlELE1BQUYsRUFBVWtSLEVBQVYsQ0FBYSxtQkFBYixFQUFrQyxVQUFTeEosQ0FBVCxFQUFZO0FBQzVDMUQsdUJBQVdtSyxRQUFYLENBQW9CUyxTQUFwQixDQUE4QmxILENBQTlCLEVBQWlDLFFBQWpDLEVBQTJDO0FBQ3pDK1oscUJBQU8sWUFBVztBQUNoQixvQkFBSTViLE1BQU1vUCxPQUFOLENBQWMwZCxVQUFsQixFQUE4QjtBQUM1QjlzQix3QkFBTTRiLEtBQU47QUFDQTViLHdCQUFNa2UsT0FBTixDQUFjOUQsS0FBZDtBQUNEO0FBQ0Y7QUFOd0MsYUFBM0M7QUFRRCxXQVREO0FBVUQ7O0FBRUQ7QUFDQSxhQUFLaGIsUUFBTCxDQUFjaU0sRUFBZCxDQUFpQixtQkFBakIsRUFBc0MsVUFBU3hKLENBQVQsRUFBWTtBQUNoRCxjQUFJMlMsVUFBVXZXLEVBQUUsSUFBRixDQUFkO0FBQ0E7QUFDQUUscUJBQVdtSyxRQUFYLENBQW9CUyxTQUFwQixDQUE4QmxILENBQTlCLEVBQWlDLFFBQWpDLEVBQTJDO0FBQ3pDc2QseUJBQWEsWUFBVztBQUN0QixrQkFBSW5mLE1BQU1aLFFBQU4sQ0FBZWtDLElBQWYsQ0FBb0IsUUFBcEIsRUFBOEJxSSxFQUE5QixDQUFpQzNKLE1BQU0yc0IsaUJBQU4sQ0FBd0I5ZSxFQUF4QixDQUEyQixDQUFDLENBQTVCLENBQWpDLENBQUosRUFBc0U7QUFBRTtBQUN0RTdOLHNCQUFNMnNCLGlCQUFOLENBQXdCOWUsRUFBeEIsQ0FBMkIsQ0FBM0IsRUFBOEJ1TSxLQUE5QjtBQUNBdlksa0JBQUV1TyxjQUFGO0FBQ0Q7QUFDRCxrQkFBSXBRLE1BQU0yc0IsaUJBQU4sQ0FBd0Jqc0IsTUFBeEIsS0FBbUMsQ0FBdkMsRUFBMEM7QUFBRTtBQUMxQ21CLGtCQUFFdU8sY0FBRjtBQUNEO0FBQ0YsYUFUd0M7QUFVekNpUCwwQkFBYyxZQUFXO0FBQ3ZCLGtCQUFJcmYsTUFBTVosUUFBTixDQUFla0MsSUFBZixDQUFvQixRQUFwQixFQUE4QnFJLEVBQTlCLENBQWlDM0osTUFBTTJzQixpQkFBTixDQUF3QjllLEVBQXhCLENBQTJCLENBQTNCLENBQWpDLEtBQW1FN04sTUFBTVosUUFBTixDQUFldUssRUFBZixDQUFrQixRQUFsQixDQUF2RSxFQUFvRztBQUFFO0FBQ3BHM0osc0JBQU0yc0IsaUJBQU4sQ0FBd0I5ZSxFQUF4QixDQUEyQixDQUFDLENBQTVCLEVBQStCdU0sS0FBL0I7QUFDQXZZLGtCQUFFdU8sY0FBRjtBQUNEO0FBQ0Qsa0JBQUlwUSxNQUFNMnNCLGlCQUFOLENBQXdCanNCLE1BQXhCLEtBQW1DLENBQXZDLEVBQTBDO0FBQUU7QUFDMUNtQixrQkFBRXVPLGNBQUY7QUFDRDtBQUNGLGFBbEJ3QztBQW1CekN1TCxrQkFBTSxZQUFXO0FBQ2Ysa0JBQUkzYixNQUFNWixRQUFOLENBQWVrQyxJQUFmLENBQW9CLFFBQXBCLEVBQThCcUksRUFBOUIsQ0FBaUMzSixNQUFNWixRQUFOLENBQWVrQyxJQUFmLENBQW9CLGNBQXBCLENBQWpDLENBQUosRUFBMkU7QUFDekVoRywyQkFBVyxZQUFXO0FBQUU7QUFDdEIwRSx3QkFBTWtlLE9BQU4sQ0FBYzlELEtBQWQ7QUFDRCxpQkFGRCxFQUVHLENBRkg7QUFHRCxlQUpELE1BSU8sSUFBSTVGLFFBQVE3SyxFQUFSLENBQVczSixNQUFNMnNCLGlCQUFqQixDQUFKLEVBQXlDO0FBQUU7QUFDaEQzc0Isc0JBQU0yYixJQUFOO0FBQ0Q7QUFDRixhQTNCd0M7QUE0QnpDQyxtQkFBTyxZQUFXO0FBQ2hCLGtCQUFJNWIsTUFBTW9QLE9BQU4sQ0FBYzBkLFVBQWxCLEVBQThCO0FBQzVCOXNCLHNCQUFNNGIsS0FBTjtBQUNBNWIsc0JBQU1rZSxPQUFOLENBQWM5RCxLQUFkO0FBQ0Q7QUFDRjtBQWpDd0MsV0FBM0M7QUFtQ0QsU0F0Q0Q7QUF1Q0Q7O0FBRUQ7Ozs7OztBQTNWVztBQUFBO0FBQUEsOEJBZ1dIO0FBQ04sWUFBSSxDQUFDLEtBQUtlLFFBQU4sSUFBa0IsQ0FBQyxLQUFLL2IsUUFBTCxDQUFjdUssRUFBZCxDQUFpQixVQUFqQixDQUF2QixFQUFxRDtBQUNuRCxpQkFBTyxLQUFQO0FBQ0Q7QUFDRCxZQUFJM0osUUFBUSxJQUFaOztBQUVBO0FBQ0EsWUFBSSxLQUFLb1AsT0FBTCxDQUFhMmQsWUFBakIsRUFBK0I7QUFDN0IsY0FBSSxLQUFLM2QsT0FBTCxDQUFhMmMsT0FBakIsRUFBMEI7QUFDeEI1dEIsdUJBQVc2TyxNQUFYLENBQWtCSyxVQUFsQixDQUE2QixLQUFLMmUsUUFBbEMsRUFBNEMsVUFBNUMsRUFBd0RnQixRQUF4RDtBQUNELFdBRkQsTUFHSztBQUNIQTtBQUNEOztBQUVEN3VCLHFCQUFXNk8sTUFBWCxDQUFrQkssVUFBbEIsQ0FBNkIsS0FBS2pPLFFBQWxDLEVBQTRDLEtBQUtnUSxPQUFMLENBQWEyZCxZQUF6RDtBQUNEO0FBQ0Q7QUFWQSxhQVdLO0FBQ0gsZ0JBQUksS0FBSzNkLE9BQUwsQ0FBYTJjLE9BQWpCLEVBQTBCO0FBQ3hCLG1CQUFLQyxRQUFMLENBQWMxZCxJQUFkLENBQW1CLENBQW5CLEVBQXNCMGUsUUFBdEI7QUFDRCxhQUZELE1BR0s7QUFDSEE7QUFDRDs7QUFFRCxpQkFBSzV0QixRQUFMLENBQWNrUCxJQUFkLENBQW1CLEtBQUtjLE9BQUwsQ0FBYTZkLFNBQWhDO0FBQ0Q7O0FBRUQ7QUFDQSxZQUFJLEtBQUs3ZCxPQUFMLENBQWEwZCxVQUFqQixFQUE2QjtBQUMzQjd1QixZQUFFOUQsTUFBRixFQUFVNFosR0FBVixDQUFjLG1CQUFkO0FBQ0Q7O0FBRUQsWUFBSSxDQUFDLEtBQUszRSxPQUFMLENBQWEyYyxPQUFkLElBQXlCLEtBQUszYyxPQUFMLENBQWFtTyxZQUExQyxFQUF3RDtBQUN0RHRmLFlBQUUsTUFBRixFQUFVOFYsR0FBVixDQUFjLGlCQUFkO0FBQ0Q7O0FBRUQsYUFBSzNVLFFBQUwsQ0FBYzJVLEdBQWQsQ0FBa0IsbUJBQWxCOztBQUVBLGlCQUFTaVosUUFBVCxHQUFvQjtBQUNsQixjQUFJaHRCLE1BQU0yckIsS0FBVixFQUFpQjtBQUNmMXRCLGNBQUUsWUFBRixFQUFnQnVGLFdBQWhCLENBQTRCLGdCQUE1QjtBQUNELFdBRkQsTUFHSztBQUNIdkYsY0FBRSxNQUFGLEVBQVV1RixXQUFWLENBQXNCLGdCQUF0QjtBQUNEOztBQUVEdkYsWUFBRSxNQUFGLEVBQVVPLElBQVYsQ0FBZTtBQUNiLDJCQUFlLEtBREY7QUFFYix3QkFBWTtBQUZDLFdBQWY7O0FBS0F3QixnQkFBTVosUUFBTixDQUFlWixJQUFmLENBQW9CLGFBQXBCLEVBQW1DLElBQW5DOztBQUVBOzs7O0FBSUF3QixnQkFBTVosUUFBTixDQUFlRSxPQUFmLENBQXVCLGtCQUF2QjtBQUNEOztBQUVEOzs7O0FBSUEsWUFBSSxLQUFLOFAsT0FBTCxDQUFhOGQsWUFBakIsRUFBK0I7QUFDN0IsZUFBSzl0QixRQUFMLENBQWMya0IsSUFBZCxDQUFtQixLQUFLM2tCLFFBQUwsQ0FBYzJrQixJQUFkLEVBQW5CO0FBQ0Q7O0FBRUQsYUFBSzVJLFFBQUwsR0FBZ0IsS0FBaEI7QUFDQyxZQUFJbmIsTUFBTW9QLE9BQU4sQ0FBYzhjLFFBQWxCLEVBQTRCO0FBQzFCLGNBQUkveEIsT0FBTytyQixPQUFQLENBQWVpSCxZQUFuQixFQUFpQztBQUMvQmh6QixtQkFBTytyQixPQUFQLENBQWVpSCxZQUFmLENBQTRCLEVBQTVCLEVBQWdDL3ZCLFNBQVNnd0IsS0FBekMsRUFBZ0RqekIsT0FBT2lyQixRQUFQLENBQWdCaUksUUFBaEU7QUFDRCxXQUZELE1BRU87QUFDTGx6QixtQkFBT2lyQixRQUFQLENBQWdCQyxJQUFoQixHQUF1QixFQUF2QjtBQUNEO0FBQ0Y7QUFDSDs7QUFFRDs7Ozs7QUFoYlc7QUFBQTtBQUFBLCtCQW9iRjtBQUNQLFlBQUksS0FBS2xLLFFBQVQsRUFBbUI7QUFDakIsZUFBS1MsS0FBTDtBQUNELFNBRkQsTUFFTztBQUNMLGVBQUtELElBQUw7QUFDRDtBQUNGO0FBMWJVO0FBQUE7OztBQTRiWDs7OztBQTViVyxnQ0FnY0Q7QUFDUixZQUFJLEtBQUt2TSxPQUFMLENBQWEyYyxPQUFqQixFQUEwQjtBQUN4QixlQUFLM3NCLFFBQUwsQ0FBY2tFLFFBQWQsQ0FBdUJyRixFQUFFLE1BQUYsQ0FBdkIsRUFEd0IsQ0FDVztBQUNuQyxlQUFLK3RCLFFBQUwsQ0FBYzFkLElBQWQsR0FBcUJ5RixHQUFyQixHQUEyQmdLLE1BQTNCO0FBQ0Q7QUFDRCxhQUFLM2UsUUFBTCxDQUFja1AsSUFBZCxHQUFxQnlGLEdBQXJCO0FBQ0EsYUFBS21LLE9BQUwsQ0FBYW5LLEdBQWIsQ0FBaUIsS0FBakI7QUFDQTlWLFVBQUU5RCxNQUFGLEVBQVU0WixHQUFWLGlCQUE0QixLQUFLbkksRUFBakM7O0FBRUF6TixtQkFBV29CLGdCQUFYLENBQTRCLElBQTVCO0FBQ0Q7QUExY1U7O0FBQUE7QUFBQTs7QUE2Y2Jpc0IsU0FBT3RXLFFBQVAsR0FBa0I7QUFDaEI7Ozs7O0FBS0F3WCxpQkFBYSxFQU5HO0FBT2hCOzs7OztBQUtBSyxrQkFBYyxFQVpFO0FBYWhCOzs7OztBQUtBSCxlQUFXLENBbEJLO0FBbUJoQjs7Ozs7QUFLQUssZUFBVyxDQXhCSztBQXlCaEI7Ozs7O0FBS0ExUCxrQkFBYyxJQTlCRTtBQStCaEI7Ozs7O0FBS0F1UCxnQkFBWSxJQXBDSTtBQXFDaEI7Ozs7O0FBS0FMLG9CQUFnQixLQTFDQTtBQTJDaEI7Ozs7O0FBS0Exa0IsYUFBUyxNQWhETztBQWlEaEI7Ozs7O0FBS0FDLGFBQVMsTUF0RE87QUF1RGhCOzs7OztBQUtBOGpCLGdCQUFZLEtBNURJO0FBNkRoQjs7Ozs7QUFLQXdCLGtCQUFjLEVBbEVFO0FBbUVoQjs7Ozs7QUFLQXZCLGFBQVMsSUF4RU87QUF5RWhCOzs7OztBQUtBbUIsa0JBQWMsS0E5RUU7QUErRWhCOzs7OztBQUtBaEIsY0FBVTtBQXBGTSxHQUFsQjs7QUF1RkE7QUFDQS90QixhQUFXTSxNQUFYLENBQWtCK3NCLE1BQWxCLEVBQTBCLFFBQTFCOztBQUVBLFdBQVNJLFdBQVQsR0FBdUI7QUFDckIsV0FBTyxzQkFBcUJ0bkIsSUFBckIsQ0FBMEJuSyxPQUFPb0ssU0FBUCxDQUFpQkMsU0FBM0M7QUFBUDtBQUNEO0FBRUEsQ0EzaUJBLENBMmlCQ3NCLE1BM2lCRCxDQUFEO0NDRkE7Ozs7OztBQUVBLENBQUMsVUFBUzdILENBQVQsRUFBWTs7QUFFYjs7Ozs7Ozs7O0FBRmEsTUFXUHN2QixNQVhPO0FBWVg7Ozs7OztBQU1BLG9CQUFZcG5CLE9BQVosRUFBcUJpSixPQUFyQixFQUE4QjtBQUFBOztBQUM1QixXQUFLaFEsUUFBTCxHQUFnQitHLE9BQWhCO0FBQ0EsV0FBS2lKLE9BQUwsR0FBZW5SLEVBQUVxTCxNQUFGLENBQVMsRUFBVCxFQUFhaWtCLE9BQU9yWSxRQUFwQixFQUE4QixLQUFLOVYsUUFBTCxDQUFjQyxJQUFkLEVBQTlCLEVBQW9EK1AsT0FBcEQsQ0FBZjs7QUFFQSxXQUFLclAsS0FBTDs7QUFFQTVCLGlCQUFXWSxjQUFYLENBQTBCLElBQTFCLEVBQWdDLFFBQWhDO0FBQ0FaLGlCQUFXbUssUUFBWCxDQUFvQnNCLFFBQXBCLENBQTZCLFFBQTdCLEVBQXVDO0FBQ3JDLGVBQU87QUFDTCx5QkFBZSxVQURWO0FBRUwsc0JBQVksVUFGUDtBQUdMLHdCQUFjLFVBSFQ7QUFJTCx3QkFBYyxVQUpUO0FBS0wsK0JBQXFCLGVBTGhCO0FBTUwsNEJBQWtCLGVBTmI7QUFPTCw4QkFBb0IsZUFQZjtBQVFMLDhCQUFvQjtBQVJmLFNBRDhCO0FBV3JDLGVBQU87QUFDTCx3QkFBYyxVQURUO0FBRUwseUJBQWUsVUFGVjtBQUdMLDhCQUFvQixlQUhmO0FBSUwsK0JBQXFCO0FBSmhCO0FBWDhCLE9BQXZDO0FBa0JEOztBQUVEOzs7Ozs7O0FBN0NXO0FBQUE7QUFBQSw4QkFrREg7QUFDTixhQUFLNGpCLE1BQUwsR0FBYyxLQUFLcHVCLFFBQUwsQ0FBY2tDLElBQWQsQ0FBbUIsT0FBbkIsQ0FBZDtBQUNBLGFBQUttc0IsT0FBTCxHQUFlLEtBQUtydUIsUUFBTCxDQUFja0MsSUFBZCxDQUFtQixzQkFBbkIsQ0FBZjs7QUFFQSxhQUFLb3NCLE9BQUwsR0FBZSxLQUFLRCxPQUFMLENBQWE1ZixFQUFiLENBQWdCLENBQWhCLENBQWY7QUFDQSxhQUFLOGYsTUFBTCxHQUFjLEtBQUtILE1BQUwsQ0FBWTlzQixNQUFaLEdBQXFCLEtBQUs4c0IsTUFBTCxDQUFZM2YsRUFBWixDQUFlLENBQWYsQ0FBckIsR0FBeUM1UCxRQUFNLEtBQUt5dkIsT0FBTCxDQUFhbHZCLElBQWIsQ0FBa0IsZUFBbEIsQ0FBTixDQUF2RDtBQUNBLGFBQUtvdkIsS0FBTCxHQUFhLEtBQUt4dUIsUUFBTCxDQUFja0MsSUFBZCxDQUFtQixvQkFBbkIsRUFBeUNtSixHQUF6QyxDQUE2QyxLQUFLMkUsT0FBTCxDQUFhNFIsUUFBYixHQUF3QixRQUF4QixHQUFtQyxPQUFoRixFQUF5RixDQUF6RixDQUFiOztBQUVBLFlBQUk2TSxRQUFRLEtBQVo7QUFBQSxZQUNJN3RCLFFBQVEsSUFEWjtBQUVBLFlBQUksS0FBS29QLE9BQUwsQ0FBYTBlLFFBQWIsSUFBeUIsS0FBSzF1QixRQUFMLENBQWMwYSxRQUFkLENBQXVCLEtBQUsxSyxPQUFMLENBQWEyZSxhQUFwQyxDQUE3QixFQUFpRjtBQUMvRSxlQUFLM2UsT0FBTCxDQUFhMGUsUUFBYixHQUF3QixJQUF4QjtBQUNBLGVBQUsxdUIsUUFBTCxDQUFjNk8sUUFBZCxDQUF1QixLQUFLbUIsT0FBTCxDQUFhMmUsYUFBcEM7QUFDRDtBQUNELFlBQUksQ0FBQyxLQUFLUCxNQUFMLENBQVk5c0IsTUFBakIsRUFBeUI7QUFDdkIsZUFBSzhzQixNQUFMLEdBQWN2dkIsSUFBSWdlLEdBQUosQ0FBUSxLQUFLMFIsTUFBYixDQUFkO0FBQ0EsZUFBS3ZlLE9BQUwsQ0FBYTRlLE9BQWIsR0FBdUIsSUFBdkI7QUFDRDtBQUNELGFBQUtDLFlBQUwsQ0FBa0IsQ0FBbEI7QUFDQSxhQUFLN1ksT0FBTCxDQUFhLEtBQUtzWSxPQUFsQjs7QUFFQSxZQUFJLEtBQUtELE9BQUwsQ0FBYSxDQUFiLENBQUosRUFBcUI7QUFDbkIsZUFBS3JlLE9BQUwsQ0FBYThlLFdBQWIsR0FBMkIsSUFBM0I7QUFDQSxlQUFLQyxRQUFMLEdBQWdCLEtBQUtWLE9BQUwsQ0FBYTVmLEVBQWIsQ0FBZ0IsQ0FBaEIsQ0FBaEI7QUFDQSxlQUFLdWdCLE9BQUwsR0FBZSxLQUFLWixNQUFMLENBQVk5c0IsTUFBWixHQUFxQixDQUFyQixHQUF5QixLQUFLOHNCLE1BQUwsQ0FBWTNmLEVBQVosQ0FBZSxDQUFmLENBQXpCLEdBQTZDNVAsUUFBTSxLQUFLa3dCLFFBQUwsQ0FBYzN2QixJQUFkLENBQW1CLGVBQW5CLENBQU4sQ0FBNUQ7O0FBRUEsY0FBSSxDQUFDLEtBQUtndkIsTUFBTCxDQUFZLENBQVosQ0FBTCxFQUFxQjtBQUNuQixpQkFBS0EsTUFBTCxHQUFjLEtBQUtBLE1BQUwsQ0FBWXZSLEdBQVosQ0FBZ0IsS0FBS21TLE9BQXJCLENBQWQ7QUFDRDtBQUNEUCxrQkFBUSxJQUFSOztBQUVBLGVBQUtRLGFBQUwsQ0FBbUIsS0FBS1gsT0FBeEIsRUFBaUMsS0FBS3RlLE9BQUwsQ0FBYWtmLFlBQTlDLEVBQTRELElBQTVELEVBQWtFLFlBQVc7O0FBRTNFdHVCLGtCQUFNcXVCLGFBQU4sQ0FBb0JydUIsTUFBTW11QixRQUExQixFQUFvQ251QixNQUFNb1AsT0FBTixDQUFjbWYsVUFBbEQsRUFBOEQsSUFBOUQ7QUFDRCxXQUhEO0FBSUE7QUFDQSxlQUFLTixZQUFMLENBQWtCLENBQWxCO0FBQ0EsZUFBSzdZLE9BQUwsQ0FBYSxLQUFLK1ksUUFBbEI7QUFDRDs7QUFFRCxZQUFJLENBQUNOLEtBQUwsRUFBWTtBQUNWLGVBQUtRLGFBQUwsQ0FBbUIsS0FBS1gsT0FBeEIsRUFBaUMsS0FBS3RlLE9BQUwsQ0FBYWtmLFlBQTlDLEVBQTRELElBQTVEO0FBQ0Q7QUFDRjs7QUFFRDs7Ozs7Ozs7Ozs7QUEvRlc7QUFBQTtBQUFBLG9DQXlHR0UsS0F6R0gsRUF5R1VwSixRQXpHVixFQXlHb0JxSixRQXpHcEIsRUF5RzhCdGhCLEVBekc5QixFQXlHa0M7QUFDN0M7QUFDRWlZLG1CQUFXeGYsV0FBV3dmLFFBQVgsQ0FBWCxDQUYyQyxDQUVYOztBQUVoQztBQUNBLFlBQUlBLFdBQVcsS0FBS2hXLE9BQUwsQ0FBYXRLLEtBQTVCLEVBQW1DO0FBQUVzZ0IscUJBQVcsS0FBS2hXLE9BQUwsQ0FBYXRLLEtBQXhCO0FBQWdDLFNBQXJFLE1BQ0ssSUFBSXNnQixXQUFXLEtBQUtoVyxPQUFMLENBQWE3TSxHQUE1QixFQUFpQztBQUFFNmlCLHFCQUFXLEtBQUtoVyxPQUFMLENBQWE3TSxHQUF4QjtBQUE4Qjs7QUFFdEUsWUFBSXNyQixRQUFRLEtBQUt6ZSxPQUFMLENBQWE4ZSxXQUF6Qjs7QUFFQSxZQUFJTCxLQUFKLEVBQVc7QUFBRTtBQUNYLGNBQUksS0FBS0osT0FBTCxDQUFhOU0sS0FBYixDQUFtQjZOLEtBQW5CLE1BQThCLENBQWxDLEVBQXFDO0FBQ25DLGdCQUFJRSxRQUFROW9CLFdBQVcsS0FBS3VvQixRQUFMLENBQWMzdkIsSUFBZCxDQUFtQixlQUFuQixDQUFYLENBQVo7QUFDQTRtQix1QkFBV0EsWUFBWXNKLEtBQVosR0FBb0JBLFFBQVEsS0FBS3RmLE9BQUwsQ0FBYXVmLElBQXpDLEdBQWdEdkosUUFBM0Q7QUFDRCxXQUhELE1BR087QUFDTCxnQkFBSXdKLFFBQVFocEIsV0FBVyxLQUFLOG5CLE9BQUwsQ0FBYWx2QixJQUFiLENBQWtCLGVBQWxCLENBQVgsQ0FBWjtBQUNBNG1CLHVCQUFXQSxZQUFZd0osS0FBWixHQUFvQkEsUUFBUSxLQUFLeGYsT0FBTCxDQUFhdWYsSUFBekMsR0FBZ0R2SixRQUEzRDtBQUNEO0FBQ0Y7O0FBRUQ7QUFDQTtBQUNBLFlBQUksS0FBS2hXLE9BQUwsQ0FBYTRSLFFBQWIsSUFBeUIsQ0FBQ3lOLFFBQTlCLEVBQXdDO0FBQ3RDckoscUJBQVcsS0FBS2hXLE9BQUwsQ0FBYTdNLEdBQWIsR0FBbUI2aUIsUUFBOUI7QUFDRDs7QUFFRCxZQUFJcGxCLFFBQVEsSUFBWjtBQUFBLFlBQ0k2dUIsT0FBTyxLQUFLemYsT0FBTCxDQUFhNFIsUUFEeEI7QUFBQSxZQUVJOE4sT0FBT0QsT0FBTyxRQUFQLEdBQWtCLE9BRjdCO0FBQUEsWUFHSUUsT0FBT0YsT0FBTyxLQUFQLEdBQWUsTUFIMUI7QUFBQSxZQUlJRyxZQUFZUixNQUFNLENBQU4sRUFBU3BuQixxQkFBVCxHQUFpQzBuQixJQUFqQyxDQUpoQjtBQUFBLFlBS0lHLFVBQVUsS0FBSzd2QixRQUFMLENBQWMsQ0FBZCxFQUFpQmdJLHFCQUFqQixHQUF5QzBuQixJQUF6QyxDQUxkOztBQU1JO0FBQ0FJLG1CQUFXQyxRQUFRL0osV0FBVyxLQUFLaFcsT0FBTCxDQUFhdEssS0FBaEMsRUFBdUMsS0FBS3NLLE9BQUwsQ0FBYTdNLEdBQWIsR0FBbUIsS0FBSzZNLE9BQUwsQ0FBYXRLLEtBQXZFLEVBQThFc3FCLE9BQTlFLENBQXNGLENBQXRGLENBUGY7O0FBUUk7QUFDQUMsbUJBQVcsQ0FBQ0osVUFBVUQsU0FBWCxJQUF3QkUsUUFUdkM7O0FBVUk7QUFDQUksbUJBQVcsQ0FBQ0gsUUFBUUUsUUFBUixFQUFrQkosT0FBbEIsSUFBNkIsR0FBOUIsRUFBbUNHLE9BQW5DLENBQTJDLEtBQUtoZ0IsT0FBTCxDQUFhbWdCLE9BQXhELENBWGY7QUFZSTtBQUNBbkssbUJBQVd4ZixXQUFXd2YsU0FBU2dLLE9BQVQsQ0FBaUIsS0FBS2hnQixPQUFMLENBQWFtZ0IsT0FBOUIsQ0FBWCxDQUFYO0FBQ0E7QUFDSixZQUFJOWtCLE1BQU0sRUFBVjs7QUFFQSxhQUFLK2tCLFVBQUwsQ0FBZ0JoQixLQUFoQixFQUF1QnBKLFFBQXZCOztBQUVBO0FBQ0EsWUFBSXlJLEtBQUosRUFBVztBQUNULGNBQUk0QixhQUFhLEtBQUtoQyxPQUFMLENBQWE5TSxLQUFiLENBQW1CNk4sS0FBbkIsTUFBOEIsQ0FBL0M7O0FBQ0k7QUFDQWtCLGFBRko7O0FBR0k7QUFDQUMsc0JBQWEsQ0FBQyxFQUFFUixRQUFRSCxTQUFSLEVBQW1CQyxPQUFuQixJQUE4QixHQUFoQyxDQUpsQjtBQUtBO0FBQ0EsY0FBSVEsVUFBSixFQUFnQjtBQUNkO0FBQ0FobEIsZ0JBQUlza0IsSUFBSixJQUFlTyxRQUFmO0FBQ0E7QUFDQUksa0JBQU05cEIsV0FBVyxLQUFLdW9CLFFBQUwsQ0FBYyxDQUFkLEVBQWlCMXJCLEtBQWpCLENBQXVCc3NCLElBQXZCLENBQVgsSUFBMkNPLFFBQTNDLEdBQXNESyxTQUE1RDtBQUNBO0FBQ0E7QUFDQSxnQkFBSXhpQixNQUFNLE9BQU9BLEVBQVAsS0FBYyxVQUF4QixFQUFvQztBQUFFQTtBQUFPLGFBUC9CLENBTytCO0FBQzlDLFdBUkQsTUFRTztBQUNMO0FBQ0EsZ0JBQUl5aUIsWUFBWWhxQixXQUFXLEtBQUs4bkIsT0FBTCxDQUFhLENBQWIsRUFBZ0JqckIsS0FBaEIsQ0FBc0Jzc0IsSUFBdEIsQ0FBWCxDQUFoQjtBQUNBO0FBQ0E7QUFDQVcsa0JBQU1KLFlBQVkzcEIsTUFBTWlxQixTQUFOLElBQW1CLEtBQUt4Z0IsT0FBTCxDQUFha2YsWUFBYixJQUEyQixDQUFDLEtBQUtsZixPQUFMLENBQWE3TSxHQUFiLEdBQWlCLEtBQUs2TSxPQUFMLENBQWF0SyxLQUEvQixJQUFzQyxHQUFqRSxDQUFuQixHQUEyRjhxQixTQUF2RyxJQUFvSEQsU0FBMUg7QUFDRDtBQUNEO0FBQ0FsbEIsdUJBQVdxa0IsSUFBWCxJQUF3QlksR0FBeEI7QUFDRDs7QUFFRCxhQUFLdHdCLFFBQUwsQ0FBY2dQLEdBQWQsQ0FBa0IscUJBQWxCLEVBQXlDLFlBQVc7QUFDcEM7Ozs7QUFJQXBPLGdCQUFNWixRQUFOLENBQWVFLE9BQWYsQ0FBdUIsaUJBQXZCLEVBQTBDLENBQUNrdkIsS0FBRCxDQUExQztBQUNILFNBTmI7O0FBUUE7QUFDQSxZQUFJcUIsV0FBVyxLQUFLendCLFFBQUwsQ0FBY0MsSUFBZCxDQUFtQixVQUFuQixJQUFpQyxPQUFLLEVBQXRDLEdBQTJDLEtBQUsrUCxPQUFMLENBQWF5Z0IsUUFBdkU7O0FBRUExeEIsbUJBQVdtUCxJQUFYLENBQWdCdWlCLFFBQWhCLEVBQTBCckIsS0FBMUIsRUFBaUMsWUFBVztBQUMxQztBQUNBQSxnQkFBTS9qQixHQUFOLENBQVVza0IsSUFBVixFQUFtQk8sUUFBbkI7O0FBRUEsY0FBSSxDQUFDdHZCLE1BQU1vUCxPQUFOLENBQWM4ZSxXQUFuQixFQUFnQztBQUM5QjtBQUNBbHVCLGtCQUFNNHRCLEtBQU4sQ0FBWW5qQixHQUFaLENBQWdCcWtCLElBQWhCLEVBQXlCSSxXQUFXLEdBQXBDO0FBQ0QsV0FIRCxNQUdPO0FBQ0w7QUFDQWx2QixrQkFBTTR0QixLQUFOLENBQVluakIsR0FBWixDQUFnQkEsR0FBaEI7QUFDRDtBQUNGLFNBWEQ7O0FBYUE7Ozs7QUFJQWhQLHFCQUFhdUUsTUFBTStlLE9BQW5CO0FBQ0EvZSxjQUFNK2UsT0FBTixHQUFnQnpqQixXQUFXLFlBQVU7QUFDbkMwRSxnQkFBTVosUUFBTixDQUFlRSxPQUFmLENBQXVCLG1CQUF2QixFQUE0QyxDQUFDa3ZCLEtBQUQsQ0FBNUM7QUFDRCxTQUZlLEVBRWJ4dUIsTUFBTW9QLE9BQU4sQ0FBYzBnQixZQUZELENBQWhCO0FBR0Q7O0FBRUQ7Ozs7Ozs7QUFuTlc7QUFBQTtBQUFBLG1DQXlORXRXLEdBek5GLEVBeU5PO0FBQ2hCLFlBQUk1TixLQUFLLEtBQUs0aEIsTUFBTCxDQUFZM2YsRUFBWixDQUFlMkwsR0FBZixFQUFvQmhiLElBQXBCLENBQXlCLElBQXpCLEtBQWtDTCxXQUFXZ0IsV0FBWCxDQUF1QixDQUF2QixFQUEwQixRQUExQixDQUEzQztBQUNBLGFBQUtxdUIsTUFBTCxDQUFZM2YsRUFBWixDQUFlMkwsR0FBZixFQUFvQmhiLElBQXBCLENBQXlCO0FBQ3ZCLGdCQUFNb04sRUFEaUI7QUFFdkIsaUJBQU8sS0FBS3dELE9BQUwsQ0FBYTdNLEdBRkc7QUFHdkIsaUJBQU8sS0FBSzZNLE9BQUwsQ0FBYXRLLEtBSEc7QUFJdkIsa0JBQVEsS0FBS3NLLE9BQUwsQ0FBYXVmO0FBSkUsU0FBekI7QUFNQSxhQUFLbEIsT0FBTCxDQUFhNWYsRUFBYixDQUFnQjJMLEdBQWhCLEVBQXFCaGIsSUFBckIsQ0FBMEI7QUFDeEIsa0JBQVEsUUFEZ0I7QUFFeEIsMkJBQWlCb04sRUFGTztBQUd4QiwyQkFBaUIsS0FBS3dELE9BQUwsQ0FBYTdNLEdBSE47QUFJeEIsMkJBQWlCLEtBQUs2TSxPQUFMLENBQWF0SyxLQUpOO0FBS3hCLDJCQUFpQjBVLFFBQVEsQ0FBUixHQUFZLEtBQUtwSyxPQUFMLENBQWFrZixZQUF6QixHQUF3QyxLQUFLbGYsT0FBTCxDQUFhbWYsVUFMOUM7QUFNeEIsOEJBQW9CLEtBQUtuZixPQUFMLENBQWE0UixRQUFiLEdBQXdCLFVBQXhCLEdBQXFDLFlBTmpDO0FBT3hCLHNCQUFZO0FBUFksU0FBMUI7QUFTRDs7QUFFRDs7Ozs7Ozs7QUE1T1c7QUFBQTtBQUFBLGlDQW1QQTBNLE9BblBBLEVBbVBTaGhCLEdBblBULEVBbVBjO0FBQ3ZCLFlBQUk4TSxNQUFNLEtBQUtwSyxPQUFMLENBQWE4ZSxXQUFiLEdBQTJCLEtBQUtULE9BQUwsQ0FBYTlNLEtBQWIsQ0FBbUIrTSxPQUFuQixDQUEzQixHQUF5RCxDQUFuRTtBQUNBLGFBQUtGLE1BQUwsQ0FBWTNmLEVBQVosQ0FBZTJMLEdBQWYsRUFBb0I5TSxHQUFwQixDQUF3QkEsR0FBeEI7QUFDQWdoQixnQkFBUWx2QixJQUFSLENBQWEsZUFBYixFQUE4QmtPLEdBQTlCO0FBQ0Q7O0FBRUQ7Ozs7Ozs7Ozs7OztBQXpQVztBQUFBO0FBQUEsbUNBb1FFN0ssQ0FwUUYsRUFvUUs2ckIsT0FwUUwsRUFvUWNoaEIsR0FwUWQsRUFvUW1CO0FBQzVCLFlBQUk5USxLQUFKLEVBQVdtMEIsTUFBWDtBQUNBLFlBQUksQ0FBQ3JqQixHQUFMLEVBQVU7QUFBQztBQUNUN0ssWUFBRXVPLGNBQUY7QUFDQSxjQUFJcFEsUUFBUSxJQUFaO0FBQUEsY0FDSWdoQixXQUFXLEtBQUs1UixPQUFMLENBQWE0UixRQUQ1QjtBQUFBLGNBRUl4VSxRQUFRd1UsV0FBVyxRQUFYLEdBQXNCLE9BRmxDO0FBQUEsY0FHSXJDLFlBQVlxQyxXQUFXLEtBQVgsR0FBbUIsTUFIbkM7QUFBQSxjQUlJZ1AsU0FBU2hQLFdBQVduZixFQUFFc1AsS0FBYixHQUFxQnRQLEVBQUVvUCxLQUpwQztBQUFBLGNBS0lnZixlQUFlLEtBQUt2QyxPQUFMLENBQWEsQ0FBYixFQUFnQnRtQixxQkFBaEIsR0FBd0NvRixLQUF4QyxJQUFpRCxDQUxwRTtBQUFBLGNBTUkwakIsU0FBUyxLQUFLOXdCLFFBQUwsQ0FBYyxDQUFkLEVBQWlCZ0kscUJBQWpCLEdBQXlDb0YsS0FBekMsQ0FOYjtBQUFBLGNBT0ltWixZQUFhLEtBQUt2bUIsUUFBTCxDQUFjeUgsTUFBZCxHQUF1QjhYLFNBQXZCLElBQXFDcVIsTUFQdEQ7O0FBUUk7QUFDQUcsa0JBQVF4SyxZQUFZLENBQVosR0FBZ0IsQ0FBQ3NLLFlBQWpCLEdBQWlDdEssWUFBWXNLLFlBQWIsR0FBNkIsQ0FBQ0MsTUFBOUIsR0FBdUNBLE1BQXZDLEdBQWdEdHZCLEtBQUsyUSxHQUFMLENBQVNvVSxTQUFULENBVDVGO0FBQUEsY0FVSXlLLFlBQVlqQixRQUFRZ0IsS0FBUixFQUFlRCxNQUFmLENBVmhCO0FBV0F0MEIsa0JBQVEsQ0FBQyxLQUFLd1QsT0FBTCxDQUFhN00sR0FBYixHQUFtQixLQUFLNk0sT0FBTCxDQUFhdEssS0FBakMsSUFBMENzckIsU0FBMUMsR0FBc0QsS0FBS2hoQixPQUFMLENBQWF0SyxLQUEzRTs7QUFFQTtBQUNBLGNBQUkzRyxXQUFXSSxHQUFYLE1BQW9CLENBQUMsS0FBSzZRLE9BQUwsQ0FBYTRSLFFBQXRDLEVBQWdEO0FBQUNwbEIsb0JBQVEsS0FBS3dULE9BQUwsQ0FBYTdNLEdBQWIsR0FBbUIzRyxLQUEzQjtBQUFrQzs7QUFFbkZBLGtCQUFRb0UsTUFBTXF3QixZQUFOLENBQW1CLElBQW5CLEVBQXlCejBCLEtBQXpCLENBQVI7QUFDQTtBQUNBbTBCLG1CQUFTLEtBQVQ7O0FBRUEsY0FBSSxDQUFDckMsT0FBTCxFQUFjO0FBQUM7QUFDYixnQkFBSTRDLGVBQWVDLFlBQVksS0FBSzdDLE9BQWpCLEVBQTBCL08sU0FBMUIsRUFBcUN3UixLQUFyQyxFQUE0QzNqQixLQUE1QyxDQUFuQjtBQUFBLGdCQUNJZ2tCLGVBQWVELFlBQVksS0FBS3BDLFFBQWpCLEVBQTJCeFAsU0FBM0IsRUFBc0N3UixLQUF0QyxFQUE2QzNqQixLQUE3QyxDQURuQjtBQUVJa2hCLHNCQUFVNEMsZ0JBQWdCRSxZQUFoQixHQUErQixLQUFLOUMsT0FBcEMsR0FBOEMsS0FBS1MsUUFBN0Q7QUFDTDtBQUVGLFNBNUJELE1BNEJPO0FBQUM7QUFDTnZ5QixrQkFBUSxLQUFLeTBCLFlBQUwsQ0FBa0IsSUFBbEIsRUFBd0IzakIsR0FBeEIsQ0FBUjtBQUNBcWpCLG1CQUFTLElBQVQ7QUFDRDs7QUFFRCxhQUFLMUIsYUFBTCxDQUFtQlgsT0FBbkIsRUFBNEI5eEIsS0FBNUIsRUFBbUNtMEIsTUFBbkM7QUFDRDs7QUFFRDs7Ozs7Ozs7QUExU1c7QUFBQTtBQUFBLG1DQWlURXJDLE9BalRGLEVBaVRXOXhCLEtBalRYLEVBaVRrQjtBQUMzQixZQUFJOFEsR0FBSjtBQUFBLFlBQ0VpaUIsT0FBTyxLQUFLdmYsT0FBTCxDQUFhdWYsSUFEdEI7QUFBQSxZQUVFOEIsTUFBTTdxQixXQUFXK29CLE9BQUssQ0FBaEIsQ0FGUjtBQUFBLFlBR0Vqb0IsSUFIRjtBQUFBLFlBR1FncUIsUUFIUjtBQUFBLFlBR2tCQyxRQUhsQjtBQUlBLFlBQUksQ0FBQyxDQUFDakQsT0FBTixFQUFlO0FBQ2JoaEIsZ0JBQU05RyxXQUFXOG5CLFFBQVFsdkIsSUFBUixDQUFhLGVBQWIsQ0FBWCxDQUFOO0FBQ0QsU0FGRCxNQUdLO0FBQ0hrTyxnQkFBTTlRLEtBQU47QUFDRDtBQUNEOEssZUFBT2dHLE1BQU1paUIsSUFBYjtBQUNBK0IsbUJBQVdoa0IsTUFBTWhHLElBQWpCO0FBQ0FpcUIsbUJBQVdELFdBQVcvQixJQUF0QjtBQUNBLFlBQUlqb0IsU0FBUyxDQUFiLEVBQWdCO0FBQ2QsaUJBQU9nRyxHQUFQO0FBQ0Q7QUFDREEsY0FBTUEsT0FBT2drQixXQUFXRCxHQUFsQixHQUF3QkUsUUFBeEIsR0FBbUNELFFBQXpDO0FBQ0EsZUFBT2hrQixHQUFQO0FBQ0Q7O0FBRUQ7Ozs7Ozs7QUF0VVc7QUFBQTtBQUFBLDhCQTRVSGdoQixPQTVVRyxFQTRVTTtBQUNmLFlBQUksS0FBS3RlLE9BQUwsQ0FBYTBlLFFBQWpCLEVBQTJCO0FBQUUsaUJBQU8sS0FBUDtBQUFlOztBQUU1QyxZQUFJOXRCLFFBQVEsSUFBWjtBQUFBLFlBQ0k0d0IsU0FESjtBQUFBLFlBRUkzMUIsS0FGSjs7QUFJRSxhQUFLdXlCLE1BQUwsQ0FBWXpaLEdBQVosQ0FBZ0Isa0JBQWhCLEVBQW9DMUksRUFBcEMsQ0FBdUMsa0JBQXZDLEVBQTJELFVBQVN4SixDQUFULEVBQVk7QUFDckUsY0FBSTJYLE1BQU14WixNQUFNd3RCLE1BQU4sQ0FBYTdNLEtBQWIsQ0FBbUIxaUIsRUFBRSxJQUFGLENBQW5CLENBQVY7QUFDQStCLGdCQUFNNndCLFlBQU4sQ0FBbUJodkIsQ0FBbkIsRUFBc0I3QixNQUFNeXRCLE9BQU4sQ0FBYzVmLEVBQWQsQ0FBaUIyTCxHQUFqQixDQUF0QixFQUE2Q3ZiLEVBQUUsSUFBRixFQUFReU8sR0FBUixFQUE3QztBQUNELFNBSEQ7O0FBS0EsWUFBSSxLQUFLMEMsT0FBTCxDQUFhMGhCLFdBQWpCLEVBQThCO0FBQzVCLGVBQUsxeEIsUUFBTCxDQUFjMlUsR0FBZCxDQUFrQixpQkFBbEIsRUFBcUMxSSxFQUFyQyxDQUF3QyxpQkFBeEMsRUFBMkQsVUFBU3hKLENBQVQsRUFBWTtBQUNyRSxnQkFBSTdCLE1BQU1aLFFBQU4sQ0FBZUMsSUFBZixDQUFvQixVQUFwQixDQUFKLEVBQXFDO0FBQUUscUJBQU8sS0FBUDtBQUFlOztBQUV0RCxnQkFBSSxDQUFDcEIsRUFBRTRELEVBQUU3RixNQUFKLEVBQVkyTixFQUFaLENBQWUsc0JBQWYsQ0FBTCxFQUE2QztBQUMzQyxrQkFBSTNKLE1BQU1vUCxPQUFOLENBQWM4ZSxXQUFsQixFQUErQjtBQUM3Qmx1QixzQkFBTTZ3QixZQUFOLENBQW1CaHZCLENBQW5CO0FBQ0QsZUFGRCxNQUVPO0FBQ0w3QixzQkFBTTZ3QixZQUFOLENBQW1CaHZCLENBQW5CLEVBQXNCN0IsTUFBTTB0QixPQUE1QjtBQUNEO0FBQ0Y7QUFDRixXQVZEO0FBV0Q7O0FBRUgsWUFBSSxLQUFLdGUsT0FBTCxDQUFhMmhCLFNBQWpCLEVBQTRCO0FBQzFCLGVBQUt0RCxPQUFMLENBQWExYixRQUFiOztBQUVBLGNBQUl5TCxRQUFRdmYsRUFBRSxNQUFGLENBQVo7QUFDQXl2QixrQkFDRzNaLEdBREgsQ0FDTyxxQkFEUCxFQUVHMUksRUFGSCxDQUVNLHFCQUZOLEVBRTZCLFVBQVN4SixDQUFULEVBQVk7QUFDckM2ckIsb0JBQVF6ZixRQUFSLENBQWlCLGFBQWpCO0FBQ0FqTyxrQkFBTTR0QixLQUFOLENBQVkzZixRQUFaLENBQXFCLGFBQXJCLEVBRnFDLENBRUQ7QUFDcENqTyxrQkFBTVosUUFBTixDQUFlQyxJQUFmLENBQW9CLFVBQXBCLEVBQWdDLElBQWhDOztBQUVBdXhCLHdCQUFZM3lCLEVBQUU0RCxFQUFFbXZCLGFBQUosQ0FBWjs7QUFFQXhULGtCQUFNblMsRUFBTixDQUFTLHFCQUFULEVBQWdDLFVBQVN4SixDQUFULEVBQVk7QUFDMUNBLGdCQUFFdU8sY0FBRjs7QUFFQXBRLG9CQUFNNndCLFlBQU4sQ0FBbUJodkIsQ0FBbkIsRUFBc0IrdUIsU0FBdEI7QUFFRCxhQUxELEVBS0d2bEIsRUFMSCxDQUtNLG1CQUxOLEVBSzJCLFVBQVN4SixDQUFULEVBQVk7QUFDckM3QixvQkFBTTZ3QixZQUFOLENBQW1CaHZCLENBQW5CLEVBQXNCK3VCLFNBQXRCOztBQUVBbEQsc0JBQVFscUIsV0FBUixDQUFvQixhQUFwQjtBQUNBeEQsb0JBQU00dEIsS0FBTixDQUFZcHFCLFdBQVosQ0FBd0IsYUFBeEI7QUFDQXhELG9CQUFNWixRQUFOLENBQWVDLElBQWYsQ0FBb0IsVUFBcEIsRUFBZ0MsS0FBaEM7O0FBRUFtZSxvQkFBTXpKLEdBQU4sQ0FBVSx1Q0FBVjtBQUNELGFBYkQ7QUFjSCxXQXZCRDtBQXdCRDs7QUFFRDJaLGdCQUFRM1osR0FBUixDQUFZLG1CQUFaLEVBQWlDMUksRUFBakMsQ0FBb0MsbUJBQXBDLEVBQXlELFVBQVN4SixDQUFULEVBQVk7QUFDbkUsY0FBSW92QixXQUFXaHpCLEVBQUUsSUFBRixDQUFmO0FBQUEsY0FDSXViLE1BQU14WixNQUFNb1AsT0FBTixDQUFjOGUsV0FBZCxHQUE0Qmx1QixNQUFNeXRCLE9BQU4sQ0FBYzlNLEtBQWQsQ0FBb0JzUSxRQUFwQixDQUE1QixHQUE0RCxDQUR0RTtBQUFBLGNBRUlDLFdBQVd0ckIsV0FBVzVGLE1BQU13dEIsTUFBTixDQUFhM2YsRUFBYixDQUFnQjJMLEdBQWhCLEVBQXFCOU0sR0FBckIsRUFBWCxDQUZmO0FBQUEsY0FHSXlrQixRQUhKOztBQUtBO0FBQ0FoekIscUJBQVdtSyxRQUFYLENBQW9CUyxTQUFwQixDQUE4QmxILENBQTlCLEVBQWlDLFFBQWpDLEVBQTJDO0FBQ3pDdXZCLHNCQUFVLFlBQVc7QUFDbkJELHlCQUFXRCxXQUFXbHhCLE1BQU1vUCxPQUFOLENBQWN1ZixJQUFwQztBQUNELGFBSHdDO0FBSXpDMEMsc0JBQVUsWUFBVztBQUNuQkYseUJBQVdELFdBQVdseEIsTUFBTW9QLE9BQU4sQ0FBY3VmLElBQXBDO0FBQ0QsYUFOd0M7QUFPekMyQywyQkFBZSxZQUFXO0FBQ3hCSCx5QkFBV0QsV0FBV2x4QixNQUFNb1AsT0FBTixDQUFjdWYsSUFBZCxHQUFxQixFQUEzQztBQUNELGFBVHdDO0FBVXpDNEMsMkJBQWUsWUFBVztBQUN4QkoseUJBQVdELFdBQVdseEIsTUFBTW9QLE9BQU4sQ0FBY3VmLElBQWQsR0FBcUIsRUFBM0M7QUFDRCxhQVp3QztBQWF6Q3BsQixxQkFBUyxZQUFXO0FBQUU7QUFDcEIxSCxnQkFBRXVPLGNBQUY7QUFDQXBRLG9CQUFNcXVCLGFBQU4sQ0FBb0I0QyxRQUFwQixFQUE4QkUsUUFBOUIsRUFBd0MsSUFBeEM7QUFDRDtBQWhCd0MsV0FBM0M7QUFrQkE7Ozs7QUFJRCxTQTdCRDtBQThCRDs7QUFFRDs7OztBQXBhVztBQUFBO0FBQUEsZ0NBdWFEO0FBQ1IsYUFBSzFELE9BQUwsQ0FBYTFaLEdBQWIsQ0FBaUIsWUFBakI7QUFDQSxhQUFLeVosTUFBTCxDQUFZelosR0FBWixDQUFnQixZQUFoQjtBQUNBLGFBQUszVSxRQUFMLENBQWMyVSxHQUFkLENBQWtCLFlBQWxCOztBQUVBNVYsbUJBQVdvQixnQkFBWCxDQUE0QixJQUE1QjtBQUNEO0FBN2FVOztBQUFBO0FBQUE7O0FBZ2JiZ3VCLFNBQU9yWSxRQUFQLEdBQWtCO0FBQ2hCOzs7OztBQUtBcFEsV0FBTyxDQU5TO0FBT2hCOzs7OztBQUtBdkMsU0FBSyxHQVpXO0FBYWhCOzs7OztBQUtBb3NCLFVBQU0sQ0FsQlU7QUFtQmhCOzs7OztBQUtBTCxrQkFBYyxDQXhCRTtBQXlCaEI7Ozs7O0FBS0FDLGdCQUFZLEdBOUJJO0FBK0JoQjs7Ozs7QUFLQVAsYUFBUyxLQXBDTztBQXFDaEI7Ozs7O0FBS0E4QyxpQkFBYSxJQTFDRztBQTJDaEI7Ozs7O0FBS0E5UCxjQUFVLEtBaERNO0FBaURoQjs7Ozs7QUFLQStQLGVBQVcsSUF0REs7QUF1RGhCOzs7OztBQUtBakQsY0FBVSxLQTVETTtBQTZEaEI7Ozs7O0FBS0FJLGlCQUFhLEtBbEVHO0FBbUVoQjs7O0FBR0E7QUFDQTs7Ozs7QUFLQXFCLGFBQVMsQ0E1RU87QUE2RWhCOzs7QUFHQTtBQUNBOzs7OztBQUtBTSxjQUFVLEdBdEZNLEVBc0ZGO0FBQ2Q7Ozs7O0FBS0E5QixtQkFBZSxVQTVGQztBQTZGaEI7Ozs7O0FBS0F5RCxvQkFBZ0IsS0FsR0E7QUFtR2hCOzs7OztBQUtBMUIsa0JBQWM7QUF4R0UsR0FBbEI7O0FBMkdBLFdBQVNYLE9BQVQsQ0FBaUJzQyxJQUFqQixFQUF1QkMsR0FBdkIsRUFBNEI7QUFDMUIsV0FBUUQsT0FBT0MsR0FBZjtBQUNEO0FBQ0QsV0FBU25CLFdBQVQsQ0FBcUI3QyxPQUFyQixFQUE4QnBjLEdBQTlCLEVBQW1DcWdCLFFBQW5DLEVBQTZDbmxCLEtBQTdDLEVBQW9EO0FBQ2xELFdBQU81TCxLQUFLMlEsR0FBTCxDQUFVbWMsUUFBUTVsQixRQUFSLEdBQW1Cd0osR0FBbkIsSUFBMkJvYyxRQUFRbGhCLEtBQVIsTUFBbUIsQ0FBL0MsR0FBcURtbEIsUUFBOUQsQ0FBUDtBQUNEOztBQUVEO0FBQ0F4ekIsYUFBV00sTUFBWCxDQUFrQjh1QixNQUFsQixFQUEwQixRQUExQjtBQUVDLENBcmlCQSxDQXFpQkN6bkIsTUFyaUJELENBQUQ7O0FBdWlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtDQ2hrQkE7Ozs7OztBQUVBLENBQUMsVUFBUzdILENBQVQsRUFBWTs7QUFFYjs7Ozs7OztBQUZhLE1BU1AyekIsTUFUTztBQVVYOzs7Ozs7QUFNQSxvQkFBWXpyQixPQUFaLEVBQXFCaUosT0FBckIsRUFBOEI7QUFBQTs7QUFDNUIsV0FBS2hRLFFBQUwsR0FBZ0IrRyxPQUFoQjtBQUNBLFdBQUtpSixPQUFMLEdBQWVuUixFQUFFcUwsTUFBRixDQUFTLEVBQVQsRUFBYXNvQixPQUFPMWMsUUFBcEIsRUFBOEIsS0FBSzlWLFFBQUwsQ0FBY0MsSUFBZCxFQUE5QixFQUFvRCtQLE9BQXBELENBQWY7O0FBRUEsV0FBS3JQLEtBQUw7O0FBRUE1QixpQkFBV1ksY0FBWCxDQUEwQixJQUExQixFQUFnQyxRQUFoQztBQUNEOztBQUVEOzs7Ozs7O0FBekJXO0FBQUE7QUFBQSw4QkE4Qkg7QUFDTixZQUFJOHlCLFVBQVUsS0FBS3p5QixRQUFMLENBQWNnSCxNQUFkLENBQXFCLHlCQUFyQixDQUFkO0FBQUEsWUFDSXdGLEtBQUssS0FBS3hNLFFBQUwsQ0FBYyxDQUFkLEVBQWlCd00sRUFBakIsSUFBdUJ6TixXQUFXZ0IsV0FBWCxDQUF1QixDQUF2QixFQUEwQixRQUExQixDQURoQztBQUFBLFlBRUlhLFFBQVEsSUFGWjs7QUFJQSxZQUFJLENBQUM2eEIsUUFBUW54QixNQUFiLEVBQXFCO0FBQ25CLGVBQUtveEIsVUFBTCxHQUFrQixJQUFsQjtBQUNEO0FBQ0QsYUFBS0MsVUFBTCxHQUFrQkYsUUFBUW54QixNQUFSLEdBQWlCbXhCLE9BQWpCLEdBQTJCNXpCLEVBQUUsS0FBS21SLE9BQUwsQ0FBYTRpQixTQUFmLEVBQTBCQyxTQUExQixDQUFvQyxLQUFLN3lCLFFBQXpDLENBQTdDO0FBQ0EsYUFBSzJ5QixVQUFMLENBQWdCOWpCLFFBQWhCLENBQXlCLEtBQUttQixPQUFMLENBQWFtWSxjQUF0Qzs7QUFFQSxhQUFLbm9CLFFBQUwsQ0FBYzZPLFFBQWQsQ0FBdUIsS0FBS21CLE9BQUwsQ0FBYThpQixXQUFwQyxFQUNjMXpCLElBRGQsQ0FDbUIsRUFBQyxlQUFlb04sRUFBaEIsRUFEbkI7O0FBR0EsYUFBS3VtQixXQUFMLEdBQW1CLEtBQUsvaUIsT0FBTCxDQUFhZ2pCLFVBQWhDO0FBQ0EsYUFBS0MsT0FBTCxHQUFlLEtBQWY7QUFDQXAwQixVQUFFOUQsTUFBRixFQUFVaVUsR0FBVixDQUFjLGdCQUFkLEVBQWdDLFlBQVU7QUFDeEMsY0FBR3BPLE1BQU1vUCxPQUFOLENBQWN2SCxNQUFkLEtBQXlCLEVBQTVCLEVBQStCO0FBQzdCN0gsa0JBQU1rZSxPQUFOLEdBQWdCamdCLEVBQUUsTUFBTStCLE1BQU1vUCxPQUFOLENBQWN2SCxNQUF0QixDQUFoQjtBQUNELFdBRkQsTUFFSztBQUNIN0gsa0JBQU1zeUIsWUFBTjtBQUNEOztBQUVEdHlCLGdCQUFNdXlCLFNBQU4sQ0FBZ0IsWUFBVTtBQUN4QnZ5QixrQkFBTXd5QixLQUFOLENBQVksS0FBWjtBQUNELFdBRkQ7QUFHQXh5QixnQkFBTW9WLE9BQU4sQ0FBY3hKLEdBQUdoSyxLQUFILENBQVMsR0FBVCxFQUFjNndCLE9BQWQsR0FBd0IzZSxJQUF4QixDQUE2QixHQUE3QixDQUFkO0FBQ0QsU0FYRDtBQVlEOztBQUVEOzs7Ozs7QUE1RFc7QUFBQTtBQUFBLHFDQWlFSTtBQUNiLFlBQUl0TixNQUFNLEtBQUs0SSxPQUFMLENBQWFzakIsU0FBdkI7QUFBQSxZQUNJQyxNQUFNLEtBQUt2akIsT0FBTCxDQUFhd2pCLFNBRHZCO0FBQUEsWUFFSUMsTUFBTSxDQUFDcnNCLEdBQUQsRUFBTW1zQixHQUFOLENBRlY7QUFBQSxZQUdJRyxTQUFTLEVBSGI7QUFJQSxZQUFJdHNCLE9BQU9tc0IsR0FBWCxFQUFnQjs7QUFFZCxlQUFLLElBQUl2eEIsSUFBSSxDQUFSLEVBQVd1aEIsTUFBTWtRLElBQUlueUIsTUFBMUIsRUFBa0NVLElBQUl1aEIsR0FBSixJQUFXa1EsSUFBSXp4QixDQUFKLENBQTdDLEVBQXFEQSxHQUFyRCxFQUEwRDtBQUN4RCxnQkFBSXlqQixFQUFKO0FBQ0EsZ0JBQUksT0FBT2dPLElBQUl6eEIsQ0FBSixDQUFQLEtBQWtCLFFBQXRCLEVBQWdDO0FBQzlCeWpCLG1CQUFLZ08sSUFBSXp4QixDQUFKLENBQUw7QUFDRCxhQUZELE1BRU87QUFDTCxrQkFBSTJ4QixRQUFRRixJQUFJenhCLENBQUosRUFBT1EsS0FBUCxDQUFhLEdBQWIsQ0FBWjtBQUFBLGtCQUNJaUcsU0FBUzVKLFFBQU04MEIsTUFBTSxDQUFOLENBQU4sQ0FEYjs7QUFHQWxPLG1CQUFLaGQsT0FBT2hCLE1BQVAsR0FBZ0JMLEdBQXJCO0FBQ0Esa0JBQUl1c0IsTUFBTSxDQUFOLEtBQVlBLE1BQU0sQ0FBTixFQUFTNTJCLFdBQVQsT0FBMkIsUUFBM0MsRUFBcUQ7QUFDbkQwb0Isc0JBQU1oZCxPQUFPLENBQVAsRUFBVVQscUJBQVYsR0FBa0NOLE1BQXhDO0FBQ0Q7QUFDRjtBQUNEZ3NCLG1CQUFPMXhCLENBQVAsSUFBWXlqQixFQUFaO0FBQ0Q7QUFDRixTQWpCRCxNQWlCTztBQUNMaU8sbUJBQVMsRUFBQyxHQUFHLENBQUosRUFBTyxHQUFHMTFCLFNBQVMrUyxlQUFULENBQXlCd1UsWUFBbkMsRUFBVDtBQUNEOztBQUVELGFBQUtMLE1BQUwsR0FBY3dPLE1BQWQ7QUFDQTtBQUNEOztBQUVEOzs7Ozs7QUEvRlc7QUFBQTtBQUFBLDhCQW9HSGxuQixFQXBHRyxFQW9HQztBQUNWLFlBQUk1TCxRQUFRLElBQVo7QUFBQSxZQUNJeVQsaUJBQWlCLEtBQUtBLGNBQUwsa0JBQW1DN0gsRUFEeEQ7QUFFQSxZQUFJLEtBQUsrVixJQUFULEVBQWU7QUFBRTtBQUFTO0FBQzFCLFlBQUksS0FBS3FSLFFBQVQsRUFBbUI7QUFDakIsZUFBS3JSLElBQUwsR0FBWSxJQUFaO0FBQ0ExakIsWUFBRTlELE1BQUYsRUFBVTRaLEdBQVYsQ0FBY04sY0FBZCxFQUNVcEksRUFEVixDQUNhb0ksY0FEYixFQUM2QixVQUFTNVIsQ0FBVCxFQUFZO0FBQzlCLGdCQUFJN0IsTUFBTW15QixXQUFOLEtBQXNCLENBQTFCLEVBQTZCO0FBQzNCbnlCLG9CQUFNbXlCLFdBQU4sR0FBb0JueUIsTUFBTW9QLE9BQU4sQ0FBY2dqQixVQUFsQztBQUNBcHlCLG9CQUFNdXlCLFNBQU4sQ0FBZ0IsWUFBVztBQUN6QnZ5QixzQkFBTXd5QixLQUFOLENBQVksS0FBWixFQUFtQnI0QixPQUFPc04sV0FBMUI7QUFDRCxlQUZEO0FBR0QsYUFMRCxNQUtPO0FBQ0x6SCxvQkFBTW15QixXQUFOO0FBQ0FueUIsb0JBQU13eUIsS0FBTixDQUFZLEtBQVosRUFBbUJyNEIsT0FBT3NOLFdBQTFCO0FBQ0Q7QUFDSCxXQVhUO0FBWUQ7O0FBRUQsYUFBS3JJLFFBQUwsQ0FBYzJVLEdBQWQsQ0FBa0IscUJBQWxCLEVBQ2MxSSxFQURkLENBQ2lCLHFCQURqQixFQUN3QyxVQUFTeEosQ0FBVCxFQUFZRyxFQUFaLEVBQWdCO0FBQ3ZDaEMsZ0JBQU11eUIsU0FBTixDQUFnQixZQUFXO0FBQ3pCdnlCLGtCQUFNd3lCLEtBQU4sQ0FBWSxLQUFaO0FBQ0EsZ0JBQUl4eUIsTUFBTWd6QixRQUFWLEVBQW9CO0FBQ2xCLGtCQUFJLENBQUNoekIsTUFBTTJoQixJQUFYLEVBQWlCO0FBQ2YzaEIsc0JBQU1vVixPQUFOLENBQWN4SixFQUFkO0FBQ0Q7QUFDRixhQUpELE1BSU8sSUFBSTVMLE1BQU0yaEIsSUFBVixFQUFnQjtBQUNyQjNoQixvQkFBTWl6QixlQUFOLENBQXNCeGYsY0FBdEI7QUFDRDtBQUNGLFdBVEQ7QUFVaEIsU0FaRDtBQWFEOztBQUVEOzs7Ozs7QUF2SVc7QUFBQTtBQUFBLHNDQTRJS0EsY0E1SUwsRUE0SXFCO0FBQzlCLGFBQUtrTyxJQUFMLEdBQVksS0FBWjtBQUNBMWpCLFVBQUU5RCxNQUFGLEVBQVU0WixHQUFWLENBQWNOLGNBQWQ7O0FBRUE7Ozs7O0FBS0MsYUFBS3JVLFFBQUwsQ0FBY0UsT0FBZCxDQUFzQixpQkFBdEI7QUFDRjs7QUFFRDs7Ozs7OztBQXhKVztBQUFBO0FBQUEsNEJBOEpMNHpCLFVBOUpLLEVBOEpPQyxNQTlKUCxFQThKZTtBQUN4QixZQUFJRCxVQUFKLEVBQWdCO0FBQUUsZUFBS1gsU0FBTDtBQUFtQjs7QUFFckMsWUFBSSxDQUFDLEtBQUtTLFFBQVYsRUFBb0I7QUFDbEIsY0FBSSxLQUFLWCxPQUFULEVBQWtCO0FBQ2hCLGlCQUFLZSxhQUFMLENBQW1CLElBQW5CO0FBQ0Q7QUFDRCxpQkFBTyxLQUFQO0FBQ0Q7O0FBRUQsWUFBSSxDQUFDRCxNQUFMLEVBQWE7QUFBRUEsbUJBQVNoNUIsT0FBT3NOLFdBQWhCO0FBQThCOztBQUU3QyxZQUFJMHJCLFVBQVUsS0FBS0UsUUFBbkIsRUFBNkI7QUFDM0IsY0FBSUYsVUFBVSxLQUFLRyxXQUFuQixFQUFnQztBQUM5QixnQkFBSSxDQUFDLEtBQUtqQixPQUFWLEVBQW1CO0FBQ2pCLG1CQUFLa0IsVUFBTDtBQUNEO0FBQ0YsV0FKRCxNQUlPO0FBQ0wsZ0JBQUksS0FBS2xCLE9BQVQsRUFBa0I7QUFDaEIsbUJBQUtlLGFBQUwsQ0FBbUIsS0FBbkI7QUFDRDtBQUNGO0FBQ0YsU0FWRCxNQVVPO0FBQ0wsY0FBSSxLQUFLZixPQUFULEVBQWtCO0FBQ2hCLGlCQUFLZSxhQUFMLENBQW1CLElBQW5CO0FBQ0Q7QUFDRjtBQUNGOztBQUVEOzs7Ozs7OztBQTNMVztBQUFBO0FBQUEsbUNBa01FO0FBQ1gsWUFBSUksVUFBVSxLQUFLcGtCLE9BQUwsQ0FBYW9rQixPQUEzQjtBQUFBLFlBQ0lDLE9BQU9ELFlBQVksS0FBWixHQUFvQixXQUFwQixHQUFrQyxjQUQ3QztBQUFBLFlBRUlFLGFBQWFGLFlBQVksS0FBWixHQUFvQixRQUFwQixHQUErQixLQUZoRDtBQUFBLFlBR0kvb0IsTUFBTSxFQUhWOztBQUtBQSxZQUFJZ3BCLElBQUosSUFBZSxLQUFLcmtCLE9BQUwsQ0FBYXFrQixJQUFiLENBQWY7QUFDQWhwQixZQUFJK29CLE9BQUosSUFBZSxDQUFmO0FBQ0Evb0IsWUFBSWlwQixVQUFKLElBQWtCLE1BQWxCO0FBQ0FqcEIsWUFBSSxNQUFKLElBQWMsS0FBS3NuQixVQUFMLENBQWdCbHJCLE1BQWhCLEdBQXlCSCxJQUF6QixHQUFnQzJkLFNBQVNscUIsT0FBTzJSLGdCQUFQLENBQXdCLEtBQUtpbUIsVUFBTCxDQUFnQixDQUFoQixDQUF4QixFQUE0QyxjQUE1QyxDQUFULEVBQXNFLEVBQXRFLENBQTlDO0FBQ0EsYUFBS00sT0FBTCxHQUFlLElBQWY7QUFDQSxhQUFLanpCLFFBQUwsQ0FBY29FLFdBQWQsd0JBQStDa3dCLFVBQS9DLEVBQ2N6bEIsUUFEZCxxQkFDeUN1bEIsT0FEekMsRUFFYy9vQixHQUZkLENBRWtCQSxHQUZsQjtBQUdhOzs7OztBQUhiLFNBUWNuTCxPQVJkLHdCQVEyQ2swQixPQVIzQztBQVNEOztBQUVEOzs7Ozs7Ozs7QUF4Tlc7QUFBQTtBQUFBLG9DQWdPR0csS0FoT0gsRUFnT1U7QUFDbkIsWUFBSUgsVUFBVSxLQUFLcGtCLE9BQUwsQ0FBYW9rQixPQUEzQjtBQUFBLFlBQ0lJLGFBQWFKLFlBQVksS0FEN0I7QUFBQSxZQUVJL29CLE1BQU0sRUFGVjtBQUFBLFlBR0lvcEIsV0FBVyxDQUFDLEtBQUt2UCxNQUFMLEdBQWMsS0FBS0EsTUFBTCxDQUFZLENBQVosSUFBaUIsS0FBS0EsTUFBTCxDQUFZLENBQVosQ0FBL0IsR0FBZ0QsS0FBS3dQLFlBQXRELElBQXNFLEtBQUtDLFVBSDFGO0FBQUEsWUFJSU4sT0FBT0csYUFBYSxXQUFiLEdBQTJCLGNBSnRDO0FBQUEsWUFLSUYsYUFBYUUsYUFBYSxRQUFiLEdBQXdCLEtBTHpDO0FBQUEsWUFNSUksY0FBY0wsUUFBUSxLQUFSLEdBQWdCLFFBTmxDOztBQVFBbHBCLFlBQUlncEIsSUFBSixJQUFZLENBQVo7O0FBRUEsWUFBS0UsU0FBUyxDQUFDQyxVQUFYLElBQTJCQSxjQUFjLENBQUNELEtBQTlDLEVBQXNEO0FBQ3BEbHBCLGNBQUkrb0IsT0FBSixJQUFlSyxRQUFmO0FBQ0FwcEIsY0FBSWlwQixVQUFKLElBQWtCLENBQWxCO0FBQ0QsU0FIRCxNQUdPO0FBQ0xqcEIsY0FBSStvQixPQUFKLElBQWUsQ0FBZjtBQUNBL29CLGNBQUlpcEIsVUFBSixJQUFrQkcsUUFBbEI7QUFDRDs7QUFFRHBwQixZQUFJLE1BQUosSUFBYyxFQUFkO0FBQ0EsYUFBSzRuQixPQUFMLEdBQWUsS0FBZjtBQUNBLGFBQUtqekIsUUFBTCxDQUFjb0UsV0FBZCxxQkFBNENnd0IsT0FBNUMsRUFDY3ZsQixRQURkLHdCQUM0QytsQixXQUQ1QyxFQUVjdnBCLEdBRmQsQ0FFa0JBLEdBRmxCO0FBR2E7Ozs7O0FBSGIsU0FRY25MLE9BUmQsNEJBUStDMDBCLFdBUi9DO0FBU0Q7O0FBRUQ7Ozs7Ozs7QUFoUVc7QUFBQTtBQUFBLGdDQXNRRDdtQixFQXRRQyxFQXNRRztBQUNaLGFBQUs2bEIsUUFBTCxHQUFnQjcwQixXQUFXc0YsVUFBWCxDQUFzQnFILE9BQXRCLENBQThCLEtBQUtzRSxPQUFMLENBQWE2a0IsUUFBM0MsQ0FBaEI7QUFDQSxZQUFJLENBQUMsS0FBS2pCLFFBQVYsRUFBb0I7QUFBRTdsQjtBQUFPO0FBQzdCLFlBQUluTixRQUFRLElBQVo7QUFBQSxZQUNJazBCLGVBQWUsS0FBS25DLFVBQUwsQ0FBZ0IsQ0FBaEIsRUFBbUIzcUIscUJBQW5CLEdBQTJDTCxLQUQ5RDtBQUFBLFlBRUlvdEIsT0FBT2g2QixPQUFPMlIsZ0JBQVAsQ0FBd0IsS0FBS2ltQixVQUFMLENBQWdCLENBQWhCLENBQXhCLENBRlg7QUFBQSxZQUdJcUMsT0FBTy9QLFNBQVM4UCxLQUFLLGVBQUwsQ0FBVCxFQUFnQyxFQUFoQyxDQUhYOztBQUtBLFlBQUksS0FBS2pXLE9BQUwsSUFBZ0IsS0FBS0EsT0FBTCxDQUFheGQsTUFBakMsRUFBeUM7QUFDdkMsZUFBS296QixZQUFMLEdBQW9CLEtBQUs1VixPQUFMLENBQWEsQ0FBYixFQUFnQjlXLHFCQUFoQixHQUF3Q04sTUFBNUQ7QUFDRCxTQUZELE1BRU87QUFDTCxlQUFLd3JCLFlBQUw7QUFDRDs7QUFFRCxhQUFLbHpCLFFBQUwsQ0FBY3FMLEdBQWQsQ0FBa0I7QUFDaEIsdUJBQWdCeXBCLGVBQWVFLElBQS9CO0FBRGdCLFNBQWxCOztBQUlBLFlBQUlDLHFCQUFxQixLQUFLajFCLFFBQUwsQ0FBYyxDQUFkLEVBQWlCZ0kscUJBQWpCLEdBQXlDTixNQUF6QyxJQUFtRCxLQUFLd3RCLGVBQWpGO0FBQ0EsYUFBS0EsZUFBTCxHQUF1QkQsa0JBQXZCO0FBQ0EsYUFBS3RDLFVBQUwsQ0FBZ0J0bkIsR0FBaEIsQ0FBb0I7QUFDbEIzRCxrQkFBUXV0QjtBQURVLFNBQXBCO0FBR0EsYUFBS04sVUFBTCxHQUFrQk0sa0JBQWxCOztBQUVELFlBQUksS0FBS2hDLE9BQVQsRUFBa0I7QUFDakIsZUFBS2p6QixRQUFMLENBQWNxTCxHQUFkLENBQWtCLEVBQUMsUUFBTyxLQUFLc25CLFVBQUwsQ0FBZ0JsckIsTUFBaEIsR0FBeUJILElBQXpCLEdBQWdDMmQsU0FBUzhQLEtBQUssY0FBTCxDQUFULEVBQStCLEVBQS9CLENBQXhDLEVBQWxCO0FBQ0E7O0FBRUEsYUFBS0ksZUFBTCxDQUFxQkYsa0JBQXJCLEVBQXlDLFlBQVc7QUFDbEQsY0FBSWxuQixFQUFKLEVBQVE7QUFBRUE7QUFBTztBQUNsQixTQUZEO0FBR0Q7O0FBRUQ7Ozs7Ozs7QUF4U1c7QUFBQTtBQUFBLHNDQThTSzRtQixVQTlTTCxFQThTaUI1bUIsRUE5U2pCLEVBOFNxQjtBQUM5QixZQUFJLENBQUMsS0FBSzZsQixRQUFWLEVBQW9CO0FBQ2xCLGNBQUk3bEIsRUFBSixFQUFRO0FBQUVBO0FBQU8sV0FBakIsTUFDSztBQUFFLG1CQUFPLEtBQVA7QUFBZTtBQUN2QjtBQUNELFlBQUlxbkIsT0FBT0MsT0FBTyxLQUFLcmxCLE9BQUwsQ0FBYXNsQixTQUFwQixDQUFYO0FBQUEsWUFDSUMsT0FBT0YsT0FBTyxLQUFLcmxCLE9BQUwsQ0FBYXdsQixZQUFwQixDQURYO0FBQUEsWUFFSXZCLFdBQVcsS0FBSy9PLE1BQUwsR0FBYyxLQUFLQSxNQUFMLENBQVksQ0FBWixDQUFkLEdBQStCLEtBQUtwRyxPQUFMLENBQWFyWCxNQUFiLEdBQXNCTCxHQUZwRTtBQUFBLFlBR0k4c0IsY0FBYyxLQUFLaFAsTUFBTCxHQUFjLEtBQUtBLE1BQUwsQ0FBWSxDQUFaLENBQWQsR0FBK0IrTyxXQUFXLEtBQUtTLFlBSGpFOztBQUlJO0FBQ0E7QUFDQXZQLG9CQUFZcHFCLE9BQU9xcUIsV0FOdkI7O0FBUUEsWUFBSSxLQUFLcFYsT0FBTCxDQUFhb2tCLE9BQWIsS0FBeUIsS0FBN0IsRUFBb0M7QUFDbENILHNCQUFZbUIsSUFBWjtBQUNBbEIseUJBQWdCUyxhQUFhUyxJQUE3QjtBQUNELFNBSEQsTUFHTyxJQUFJLEtBQUtwbEIsT0FBTCxDQUFhb2tCLE9BQWIsS0FBeUIsUUFBN0IsRUFBdUM7QUFDNUNILHNCQUFhOU8sYUFBYXdQLGFBQWFZLElBQTFCLENBQWI7QUFDQXJCLHlCQUFnQi9PLFlBQVlvUSxJQUE1QjtBQUNELFNBSE0sTUFHQTtBQUNMO0FBQ0Q7O0FBRUQsYUFBS3RCLFFBQUwsR0FBZ0JBLFFBQWhCO0FBQ0EsYUFBS0MsV0FBTCxHQUFtQkEsV0FBbkI7O0FBRUEsWUFBSW5tQixFQUFKLEVBQVE7QUFBRUE7QUFBTztBQUNsQjs7QUFFRDs7Ozs7OztBQTNVVztBQUFBO0FBQUEsZ0NBaVZEO0FBQ1IsYUFBS2ltQixhQUFMLENBQW1CLElBQW5COztBQUVBLGFBQUtoMEIsUUFBTCxDQUFjb0UsV0FBZCxDQUE2QixLQUFLNEwsT0FBTCxDQUFhOGlCLFdBQTFDLDZCQUNjem5CLEdBRGQsQ0FDa0I7QUFDSDNELGtCQUFRLEVBREw7QUFFSE4sZUFBSyxFQUZGO0FBR0hDLGtCQUFRLEVBSEw7QUFJSCx1QkFBYTtBQUpWLFNBRGxCLEVBT2NzTixHQVBkLENBT2tCLHFCQVBsQjs7QUFTQSxhQUFLbUssT0FBTCxDQUFhbkssR0FBYixDQUFpQixrQkFBakI7QUFDQTlWLFVBQUU5RCxNQUFGLEVBQVU0WixHQUFWLENBQWMsS0FBS04sY0FBbkI7O0FBRUEsWUFBSSxLQUFLcWUsVUFBVCxFQUFxQjtBQUNuQixlQUFLMXlCLFFBQUwsQ0FBYzBlLE1BQWQ7QUFDRCxTQUZELE1BRU87QUFDTCxlQUFLaVUsVUFBTCxDQUFnQnZ1QixXQUFoQixDQUE0QixLQUFLNEwsT0FBTCxDQUFhbVksY0FBekMsRUFDZ0I5YyxHQURoQixDQUNvQjtBQUNIM0Qsb0JBQVE7QUFETCxXQURwQjtBQUlEO0FBQ0QzSSxtQkFBV29CLGdCQUFYLENBQTRCLElBQTVCO0FBQ0Q7QUF6V1U7O0FBQUE7QUFBQTs7QUE0V2JxeUIsU0FBTzFjLFFBQVAsR0FBa0I7QUFDaEI7Ozs7O0FBS0E4YyxlQUFXLG1DQU5LO0FBT2hCOzs7OztBQUtBd0IsYUFBUyxLQVpPO0FBYWhCOzs7OztBQUtBM3JCLFlBQVEsRUFsQlE7QUFtQmhCOzs7OztBQUtBNnFCLGVBQVcsRUF4Qks7QUF5QmhCOzs7OztBQUtBRSxlQUFXLEVBOUJLO0FBK0JoQjs7Ozs7QUFLQThCLGVBQVcsQ0FwQ0s7QUFxQ2hCOzs7OztBQUtBRSxrQkFBYyxDQTFDRTtBQTJDaEI7Ozs7O0FBS0FYLGNBQVUsUUFoRE07QUFpRGhCOzs7OztBQUtBL0IsaUJBQWEsUUF0REc7QUF1RGhCOzs7OztBQUtBM0ssb0JBQWdCLGtCQTVEQTtBQTZEaEI7Ozs7O0FBS0E2SyxnQkFBWSxDQUFDO0FBbEVHLEdBQWxCOztBQXFFQTs7OztBQUlBLFdBQVNxQyxNQUFULENBQWdCSSxFQUFoQixFQUFvQjtBQUNsQixXQUFPeFEsU0FBU2xxQixPQUFPMlIsZ0JBQVAsQ0FBd0IxTyxTQUFTOUMsSUFBakMsRUFBdUMsSUFBdkMsRUFBNkN3NkIsUUFBdEQsRUFBZ0UsRUFBaEUsSUFBc0VELEVBQTdFO0FBQ0Q7O0FBRUQ7QUFDQTEyQixhQUFXTSxNQUFYLENBQWtCbXpCLE1BQWxCLEVBQTBCLFFBQTFCO0FBRUMsQ0E1YkEsQ0E0YkM5ckIsTUE1YkQsQ0FBRDtDQ0ZBOzs7Ozs7QUFFQSxDQUFDLFVBQVM3SCxDQUFULEVBQVk7O0FBRWI7Ozs7Ozs7QUFGYSxNQVNQODJCLElBVE87QUFVWDs7Ozs7OztBQU9BLGtCQUFZNXVCLE9BQVosRUFBcUJpSixPQUFyQixFQUE4QjtBQUFBOztBQUM1QixXQUFLaFEsUUFBTCxHQUFnQitHLE9BQWhCO0FBQ0EsV0FBS2lKLE9BQUwsR0FBZW5SLEVBQUVxTCxNQUFGLENBQVMsRUFBVCxFQUFheXJCLEtBQUs3ZixRQUFsQixFQUE0QixLQUFLOVYsUUFBTCxDQUFjQyxJQUFkLEVBQTVCLEVBQWtEK1AsT0FBbEQsQ0FBZjs7QUFFQSxXQUFLclAsS0FBTDtBQUNBNUIsaUJBQVdZLGNBQVgsQ0FBMEIsSUFBMUIsRUFBZ0MsTUFBaEM7QUFDQVosaUJBQVdtSyxRQUFYLENBQW9Cc0IsUUFBcEIsQ0FBNkIsTUFBN0IsRUFBcUM7QUFDbkMsaUJBQVMsTUFEMEI7QUFFbkMsaUJBQVMsTUFGMEI7QUFHbkMsdUJBQWUsTUFIb0I7QUFJbkMsb0JBQVksVUFKdUI7QUFLbkMsc0JBQWMsTUFMcUI7QUFNbkMsc0JBQWM7QUFDZDtBQUNBO0FBUm1DLE9BQXJDO0FBVUQ7O0FBRUQ7Ozs7OztBQW5DVztBQUFBO0FBQUEsOEJBdUNIO0FBQ04sWUFBSTVKLFFBQVEsSUFBWjs7QUFFQSxhQUFLZzFCLFVBQUwsR0FBa0IsS0FBSzUxQixRQUFMLENBQWNrQyxJQUFkLE9BQXVCLEtBQUs4TixPQUFMLENBQWE2bEIsU0FBcEMsQ0FBbEI7QUFDQSxhQUFLcGIsV0FBTCxHQUFtQjViLDJCQUF5QixLQUFLbUIsUUFBTCxDQUFjLENBQWQsRUFBaUJ3TSxFQUExQyxRQUFuQjs7QUFFQSxhQUFLb3BCLFVBQUwsQ0FBZ0JsMUIsSUFBaEIsQ0FBcUIsWUFBVTtBQUM3QixjQUFJdUIsUUFBUXBELEVBQUUsSUFBRixDQUFaO0FBQUEsY0FDSXdlLFFBQVFwYixNQUFNQyxJQUFOLENBQVcsR0FBWCxDQURaO0FBQUEsY0FFSTZaLFdBQVc5WixNQUFNeVksUUFBTixDQUFlLFdBQWYsQ0FGZjtBQUFBLGNBR0l1TCxPQUFPNUksTUFBTSxDQUFOLEVBQVM0SSxJQUFULENBQWNwa0IsS0FBZCxDQUFvQixDQUFwQixDQUhYO0FBQUEsY0FJSXlZLFNBQVMrQyxNQUFNLENBQU4sRUFBUzdRLEVBQVQsR0FBYzZRLE1BQU0sQ0FBTixFQUFTN1EsRUFBdkIsR0FBK0J5WixJQUEvQixXQUpiO0FBQUEsY0FLSXhMLGNBQWM1YixRQUFNb25CLElBQU4sQ0FMbEI7O0FBT0Foa0IsZ0JBQU03QyxJQUFOLENBQVcsRUFBQyxRQUFRLGNBQVQsRUFBWDs7QUFFQWllLGdCQUFNamUsSUFBTixDQUFXO0FBQ1Qsb0JBQVEsS0FEQztBQUVULDZCQUFpQjZtQixJQUZSO0FBR1QsNkJBQWlCbEssUUFIUjtBQUlULGtCQUFNekI7QUFKRyxXQUFYOztBQU9BRyxzQkFBWXJiLElBQVosQ0FBaUI7QUFDZixvQkFBUSxVQURPO0FBRWYsMkJBQWUsQ0FBQzJjLFFBRkQ7QUFHZiwrQkFBbUJ6QjtBQUhKLFdBQWpCOztBQU1BLGNBQUd5QixZQUFZbmIsTUFBTW9QLE9BQU4sQ0FBY2tRLFNBQTdCLEVBQXVDO0FBQ3JDN0Msa0JBQU1yQyxLQUFOO0FBQ0Q7QUFDRixTQTFCRDs7QUE0QkEsWUFBRyxLQUFLaEwsT0FBTCxDQUFhOGxCLFdBQWhCLEVBQTZCO0FBQzNCLGNBQUl4TixVQUFVLEtBQUs3TixXQUFMLENBQWlCdlksSUFBakIsQ0FBc0IsS0FBdEIsQ0FBZDs7QUFFQSxjQUFJb21CLFFBQVFobkIsTUFBWixFQUFvQjtBQUNsQnZDLHVCQUFXd1IsY0FBWCxDQUEwQitYLE9BQTFCLEVBQW1DLEtBQUt5TixVQUFMLENBQWdCbndCLElBQWhCLENBQXFCLElBQXJCLENBQW5DO0FBQ0QsV0FGRCxNQUVPO0FBQ0wsaUJBQUttd0IsVUFBTDtBQUNEO0FBQ0Y7O0FBRUQsYUFBSy9mLE9BQUw7QUFDRDs7QUFFRDs7Ozs7QUF0Rlc7QUFBQTtBQUFBLGdDQTBGRDtBQUNSLGFBQUtnZ0IsY0FBTDtBQUNBLGFBQUtDLGdCQUFMOztBQUVBLFlBQUksS0FBS2ptQixPQUFMLENBQWE4bEIsV0FBakIsRUFBOEI7QUFDNUJqM0IsWUFBRTlELE1BQUYsRUFBVWtSLEVBQVYsQ0FBYSx1QkFBYixFQUFzQyxLQUFLOHBCLFVBQUwsQ0FBZ0Jud0IsSUFBaEIsQ0FBcUIsSUFBckIsQ0FBdEM7QUFDRDtBQUNGOztBQUVEOzs7OztBQW5HVztBQUFBO0FBQUEseUNBdUdRO0FBQ2pCLFlBQUloRixRQUFRLElBQVo7O0FBRUEsYUFBS1osUUFBTCxDQUNHMlUsR0FESCxDQUNPLGVBRFAsRUFFRzFJLEVBRkgsQ0FFTSxlQUZOLFFBRTJCLEtBQUsrRCxPQUFMLENBQWE2bEIsU0FGeEMsRUFFcUQsVUFBU3B6QixDQUFULEVBQVc7QUFDNURBLFlBQUV1TyxjQUFGO0FBQ0F2TyxZQUFFc1IsZUFBRjtBQUNBLGNBQUlsVixFQUFFLElBQUYsRUFBUTZiLFFBQVIsQ0FBaUIsV0FBakIsQ0FBSixFQUFtQztBQUNqQztBQUNEO0FBQ0Q5WixnQkFBTXMxQixnQkFBTixDQUF1QnIzQixFQUFFLElBQUYsQ0FBdkI7QUFDRCxTQVRIO0FBVUQ7O0FBRUQ7Ozs7O0FBdEhXO0FBQUE7QUFBQSx1Q0EwSE07QUFDZixZQUFJK0IsUUFBUSxJQUFaO0FBQ0EsWUFBSXUxQixZQUFZdjFCLE1BQU1aLFFBQU4sQ0FBZWtDLElBQWYsQ0FBb0Isa0JBQXBCLENBQWhCO0FBQ0EsWUFBSWswQixXQUFXeDFCLE1BQU1aLFFBQU4sQ0FBZWtDLElBQWYsQ0FBb0IsaUJBQXBCLENBQWY7O0FBRUEsYUFBSzB6QixVQUFMLENBQWdCamhCLEdBQWhCLENBQW9CLGlCQUFwQixFQUF1QzFJLEVBQXZDLENBQTBDLGlCQUExQyxFQUE2RCxVQUFTeEosQ0FBVCxFQUFXO0FBQ3RFLGNBQUlBLEVBQUUvRSxLQUFGLEtBQVksQ0FBaEIsRUFBbUI7QUFDbkIrRSxZQUFFc1IsZUFBRjtBQUNBdFIsWUFBRXVPLGNBQUY7O0FBRUEsY0FBSWhSLFdBQVduQixFQUFFLElBQUYsQ0FBZjtBQUFBLGNBQ0VxZCxZQUFZbGMsU0FBU2dILE1BQVQsQ0FBZ0IsSUFBaEIsRUFBc0I2SSxRQUF0QixDQUErQixJQUEvQixDQURkO0FBQUEsY0FFRXNNLFlBRkY7QUFBQSxjQUdFQyxZQUhGOztBQUtBRixvQkFBVXhiLElBQVYsQ0FBZSxVQUFTc0IsQ0FBVCxFQUFZO0FBQ3pCLGdCQUFJbkQsRUFBRSxJQUFGLEVBQVEwTCxFQUFSLENBQVd2SyxRQUFYLENBQUosRUFBMEI7QUFDeEIsa0JBQUlZLE1BQU1vUCxPQUFOLENBQWNxbUIsVUFBbEIsRUFBOEI7QUFDNUJsYSwrQkFBZW5hLE1BQU0sQ0FBTixHQUFVa2EsVUFBVThMLElBQVYsRUFBVixHQUE2QjlMLFVBQVV6TixFQUFWLENBQWF6TSxJQUFFLENBQWYsQ0FBNUM7QUFDQW9hLCtCQUFlcGEsTUFBTWthLFVBQVU1YSxNQUFWLEdBQWtCLENBQXhCLEdBQTRCNGEsVUFBVXBKLEtBQVYsRUFBNUIsR0FBZ0RvSixVQUFVek4sRUFBVixDQUFhek0sSUFBRSxDQUFmLENBQS9EO0FBQ0QsZUFIRCxNQUdPO0FBQ0xtYSwrQkFBZUQsVUFBVXpOLEVBQVYsQ0FBYWpOLEtBQUtnRSxHQUFMLENBQVMsQ0FBVCxFQUFZeEQsSUFBRSxDQUFkLENBQWIsQ0FBZjtBQUNBb2EsK0JBQWVGLFVBQVV6TixFQUFWLENBQWFqTixLQUFLNmEsR0FBTCxDQUFTcmEsSUFBRSxDQUFYLEVBQWNrYSxVQUFVNWEsTUFBVixHQUFpQixDQUEvQixDQUFiLENBQWY7QUFDRDtBQUNEO0FBQ0Q7QUFDRixXQVhEOztBQWFBO0FBQ0F2QyxxQkFBV21LLFFBQVgsQ0FBb0JTLFNBQXBCLENBQThCbEgsQ0FBOUIsRUFBaUMsTUFBakMsRUFBeUM7QUFDdkM4WixrQkFBTSxZQUFXO0FBQ2Z2Yyx1QkFBU2tDLElBQVQsQ0FBYyxjQUFkLEVBQThCOFksS0FBOUI7QUFDQXBhLG9CQUFNczFCLGdCQUFOLENBQXVCbDJCLFFBQXZCO0FBQ0QsYUFKc0M7QUFLdkNrYixzQkFBVSxZQUFXO0FBQ25CaUIsMkJBQWFqYSxJQUFiLENBQWtCLGNBQWxCLEVBQWtDOFksS0FBbEM7QUFDQXBhLG9CQUFNczFCLGdCQUFOLENBQXVCL1osWUFBdkI7QUFDRCxhQVJzQztBQVN2Q3JCLGtCQUFNLFlBQVc7QUFDZnNCLDJCQUFhbGEsSUFBYixDQUFrQixjQUFsQixFQUFrQzhZLEtBQWxDO0FBQ0FwYSxvQkFBTXMxQixnQkFBTixDQUF1QjlaLFlBQXZCO0FBQ0Q7QUFac0MsV0FBekM7QUFjRCxTQXRDRDtBQXVDRDs7QUFFRDs7Ozs7OztBQXhLVztBQUFBO0FBQUEsdUNBOEtNaEgsT0E5S04sRUE4S2U7QUFDeEIsWUFBSWtoQixXQUFXbGhCLFFBQVFsVCxJQUFSLENBQWEsY0FBYixDQUFmO0FBQUEsWUFDSStqQixPQUFPcVEsU0FBUyxDQUFULEVBQVlyUSxJQUR2QjtBQUFBLFlBRUlzUSxpQkFBaUIsS0FBSzliLFdBQUwsQ0FBaUJ2WSxJQUFqQixDQUFzQitqQixJQUF0QixDQUZyQjtBQUFBLFlBR0l1USxVQUFVLEtBQUt4MkIsUUFBTCxDQUNSa0MsSUFEUSxPQUNDLEtBQUs4TixPQUFMLENBQWE2bEIsU0FEZCxpQkFFUHp4QixXQUZPLENBRUssV0FGTCxFQUdQbEMsSUFITyxDQUdGLGNBSEUsRUFJUDlDLElBSk8sQ0FJRixFQUFFLGlCQUFpQixPQUFuQixFQUpFLENBSGQ7O0FBU0FQLGdCQUFNMjNCLFFBQVFwM0IsSUFBUixDQUFhLGVBQWIsQ0FBTixFQUNHZ0YsV0FESCxDQUNlLFdBRGYsRUFFR2hGLElBRkgsQ0FFUSxFQUFFLGVBQWUsTUFBakIsRUFGUjs7QUFJQWdXLGdCQUFRdkcsUUFBUixDQUFpQixXQUFqQjs7QUFFQXluQixpQkFBU2wzQixJQUFULENBQWMsRUFBQyxpQkFBaUIsTUFBbEIsRUFBZDs7QUFFQW0zQix1QkFDRzFuQixRQURILENBQ1ksV0FEWixFQUVHelAsSUFGSCxDQUVRLEVBQUMsZUFBZSxPQUFoQixFQUZSOztBQUlBOzs7O0FBSUEsYUFBS1ksUUFBTCxDQUFjRSxPQUFkLENBQXNCLGdCQUF0QixFQUF3QyxDQUFDa1YsT0FBRCxDQUF4QztBQUNEOztBQUVEOzs7Ozs7QUEzTVc7QUFBQTtBQUFBLGdDQWdORHJULElBaE5DLEVBZ05LO0FBQ2QsWUFBSTAwQixLQUFKOztBQUVBLFlBQUksT0FBTzEwQixJQUFQLEtBQWdCLFFBQXBCLEVBQThCO0FBQzVCMDBCLGtCQUFRMTBCLEtBQUssQ0FBTCxFQUFReUssRUFBaEI7QUFDRCxTQUZELE1BRU87QUFDTGlxQixrQkFBUTEwQixJQUFSO0FBQ0Q7O0FBRUQsWUFBSTAwQixNQUFNdDVCLE9BQU4sQ0FBYyxHQUFkLElBQXFCLENBQXpCLEVBQTRCO0FBQzFCczVCLHdCQUFZQSxLQUFaO0FBQ0Q7O0FBRUQsWUFBSXJoQixVQUFVLEtBQUt3Z0IsVUFBTCxDQUFnQjF6QixJQUFoQixhQUErQnUwQixLQUEvQixTQUEwQ3p2QixNQUExQyxPQUFxRCxLQUFLZ0osT0FBTCxDQUFhNmxCLFNBQWxFLENBQWQ7O0FBRUEsYUFBS0ssZ0JBQUwsQ0FBc0I5Z0IsT0FBdEI7QUFDRDtBQWhPVTtBQUFBOztBQWlPWDs7Ozs7OztBQWpPVyxtQ0F3T0U7QUFDWCxZQUFJNVAsTUFBTSxDQUFWO0FBQ0EsYUFBS2lWLFdBQUwsQ0FDR3ZZLElBREgsT0FDWSxLQUFLOE4sT0FBTCxDQUFhMG1CLFVBRHpCLEVBRUdyckIsR0FGSCxDQUVPLFFBRlAsRUFFaUIsRUFGakIsRUFHRzNLLElBSEgsQ0FHUSxZQUFXO0FBQ2YsY0FBSWkyQixRQUFROTNCLEVBQUUsSUFBRixDQUFaO0FBQUEsY0FDSWtkLFdBQVc0YSxNQUFNamMsUUFBTixDQUFlLFdBQWYsQ0FEZjs7QUFHQSxjQUFJLENBQUNxQixRQUFMLEVBQWU7QUFDYjRhLGtCQUFNdHJCLEdBQU4sQ0FBVSxFQUFDLGNBQWMsUUFBZixFQUF5QixXQUFXLE9BQXBDLEVBQVY7QUFDRDs7QUFFRCxjQUFJZ2UsT0FBTyxLQUFLcmhCLHFCQUFMLEdBQTZCTixNQUF4Qzs7QUFFQSxjQUFJLENBQUNxVSxRQUFMLEVBQWU7QUFDYjRhLGtCQUFNdHJCLEdBQU4sQ0FBVTtBQUNSLDRCQUFjLEVBRE47QUFFUix5QkFBVztBQUZILGFBQVY7QUFJRDs7QUFFRDdGLGdCQUFNNmpCLE9BQU83akIsR0FBUCxHQUFhNmpCLElBQWIsR0FBb0I3akIsR0FBMUI7QUFDRCxTQXJCSCxFQXNCRzZGLEdBdEJILENBc0JPLFFBdEJQLEVBc0JvQjdGLEdBdEJwQjtBQXVCRDs7QUFFRDs7Ozs7QUFuUVc7QUFBQTtBQUFBLGdDQXVRRDtBQUNSLGFBQUt4RixRQUFMLENBQ0drQyxJQURILE9BQ1ksS0FBSzhOLE9BQUwsQ0FBYTZsQixTQUR6QixFQUVHbGhCLEdBRkgsQ0FFTyxVQUZQLEVBRW1CekYsSUFGbkIsR0FFMEIvTCxHQUYxQixHQUdHakIsSUFISCxPQUdZLEtBQUs4TixPQUFMLENBQWEwbUIsVUFIekIsRUFJR3huQixJQUpIOztBQU1BLFlBQUksS0FBS2MsT0FBTCxDQUFhOGxCLFdBQWpCLEVBQThCO0FBQzVCajNCLFlBQUU5RCxNQUFGLEVBQVU0WixHQUFWLENBQWMsdUJBQWQ7QUFDRDs7QUFFRDVWLG1CQUFXb0IsZ0JBQVgsQ0FBNEIsSUFBNUI7QUFDRDtBQW5SVTs7QUFBQTtBQUFBOztBQXNSYncxQixPQUFLN2YsUUFBTCxHQUFnQjtBQUNkOzs7OztBQUtBb0ssZUFBVyxLQU5HOztBQVFkOzs7OztBQUtBbVcsZ0JBQVksSUFiRTs7QUFlZDs7Ozs7QUFLQVAsaUJBQWEsS0FwQkM7O0FBc0JkOzs7OztBQUtBRCxlQUFXLFlBM0JHOztBQTZCZDs7Ozs7QUFLQWEsZ0JBQVk7QUFsQ0UsR0FBaEI7O0FBcUNBLFdBQVNFLFVBQVQsQ0FBb0IzMEIsS0FBcEIsRUFBMEI7QUFDeEIsV0FBT0EsTUFBTXlZLFFBQU4sQ0FBZSxXQUFmLENBQVA7QUFDRDs7QUFFRDtBQUNBM2IsYUFBV00sTUFBWCxDQUFrQnMyQixJQUFsQixFQUF3QixNQUF4QjtBQUVDLENBbFVBLENBa1VDanZCLE1BbFVELENBQUQ7Q0NGQTs7Ozs7O0FBRUEsQ0FBQyxVQUFTN0gsQ0FBVCxFQUFZOztBQUViOzs7Ozs7O0FBRmEsTUFTUGc0QixPQVRPO0FBVVg7Ozs7Ozs7QUFPQSxxQkFBWTl2QixPQUFaLEVBQXFCaUosT0FBckIsRUFBOEI7QUFBQTs7QUFDNUIsV0FBS2hRLFFBQUwsR0FBZ0IrRyxPQUFoQjtBQUNBLFdBQUtpSixPQUFMLEdBQWVuUixFQUFFcUwsTUFBRixDQUFTLEVBQVQsRUFBYTJzQixRQUFRL2dCLFFBQXJCLEVBQStCL08sUUFBUTlHLElBQVIsRUFBL0IsRUFBK0MrUCxPQUEvQyxDQUFmO0FBQ0EsV0FBS3pRLFNBQUwsR0FBaUIsRUFBakI7O0FBRUEsV0FBS29CLEtBQUw7QUFDQSxXQUFLcVYsT0FBTDs7QUFFQWpYLGlCQUFXWSxjQUFYLENBQTBCLElBQTFCLEVBQWdDLFNBQWhDO0FBQ0Q7O0FBRUQ7Ozs7Ozs7QUE1Qlc7QUFBQTtBQUFBLDhCQWlDSDtBQUNOLFlBQUltM0IsS0FBSjtBQUNBO0FBQ0EsWUFBSSxLQUFLOW1CLE9BQUwsQ0FBYWhDLE9BQWpCLEVBQTBCO0FBQ3hCOG9CLGtCQUFRLEtBQUs5bUIsT0FBTCxDQUFhaEMsT0FBYixDQUFxQnhMLEtBQXJCLENBQTJCLEdBQTNCLENBQVI7O0FBRUEsZUFBSzhxQixXQUFMLEdBQW1Cd0osTUFBTSxDQUFOLENBQW5CO0FBQ0EsZUFBS25KLFlBQUwsR0FBb0JtSixNQUFNLENBQU4sS0FBWSxJQUFoQztBQUNEO0FBQ0Q7QUFOQSxhQU9LO0FBQ0hBLG9CQUFRLEtBQUs5MkIsUUFBTCxDQUFjQyxJQUFkLENBQW1CLFNBQW5CLENBQVI7QUFDQTtBQUNBLGlCQUFLVixTQUFMLEdBQWlCdTNCLE1BQU0sQ0FBTixNQUFhLEdBQWIsR0FBbUJBLE1BQU1qMUIsS0FBTixDQUFZLENBQVosQ0FBbkIsR0FBb0NpMUIsS0FBckQ7QUFDRDs7QUFFRDtBQUNBLFlBQUl0cUIsS0FBSyxLQUFLeE0sUUFBTCxDQUFjLENBQWQsRUFBaUJ3TSxFQUExQjtBQUNBM04sMkJBQWlCMk4sRUFBakIseUJBQXVDQSxFQUF2QywwQkFBOERBLEVBQTlELFNBQ0dwTixJQURILENBQ1EsZUFEUixFQUN5Qm9OLEVBRHpCO0FBRUE7QUFDQSxhQUFLeE0sUUFBTCxDQUFjWixJQUFkLENBQW1CLGVBQW5CLEVBQW9DLEtBQUtZLFFBQUwsQ0FBY3VLLEVBQWQsQ0FBaUIsU0FBakIsSUFBOEIsS0FBOUIsR0FBc0MsSUFBMUU7QUFDRDs7QUFFRDs7Ozs7O0FBekRXO0FBQUE7QUFBQSxnQ0E4REQ7QUFDUixhQUFLdkssUUFBTCxDQUFjMlUsR0FBZCxDQUFrQixtQkFBbEIsRUFBdUMxSSxFQUF2QyxDQUEwQyxtQkFBMUMsRUFBK0QsS0FBSzRPLE1BQUwsQ0FBWWpWLElBQVosQ0FBaUIsSUFBakIsQ0FBL0Q7QUFDRDs7QUFFRDs7Ozs7OztBQWxFVztBQUFBO0FBQUEsK0JBd0VGO0FBQ1AsYUFBTSxLQUFLb0ssT0FBTCxDQUFhaEMsT0FBYixHQUF1QixnQkFBdkIsR0FBMEMsY0FBaEQ7QUFDRDtBQTFFVTtBQUFBO0FBQUEscUNBNEVJO0FBQ2IsYUFBS2hPLFFBQUwsQ0FBYysyQixXQUFkLENBQTBCLEtBQUt4M0IsU0FBL0I7O0FBRUEsWUFBSWdqQixPQUFPLEtBQUt2aUIsUUFBTCxDQUFjMGEsUUFBZCxDQUF1QixLQUFLbmIsU0FBNUIsQ0FBWDtBQUNBLFlBQUlnakIsSUFBSixFQUFVO0FBQ1I7Ozs7QUFJQSxlQUFLdmlCLFFBQUwsQ0FBY0UsT0FBZCxDQUFzQixlQUF0QjtBQUNELFNBTkQsTUFPSztBQUNIOzs7O0FBSUEsZUFBS0YsUUFBTCxDQUFjRSxPQUFkLENBQXNCLGdCQUF0QjtBQUNEOztBQUVELGFBQUs4MkIsV0FBTCxDQUFpQnpVLElBQWpCO0FBQ0Q7QUFoR1U7QUFBQTtBQUFBLHVDQWtHTTtBQUNmLFlBQUkzaEIsUUFBUSxJQUFaOztBQUVBLFlBQUksS0FBS1osUUFBTCxDQUFjdUssRUFBZCxDQUFpQixTQUFqQixDQUFKLEVBQWlDO0FBQy9CeEwscUJBQVc2TyxNQUFYLENBQWtCQyxTQUFsQixDQUE0QixLQUFLN04sUUFBakMsRUFBMkMsS0FBS3N0QixXQUFoRCxFQUE2RCxZQUFXO0FBQ3RFMXNCLGtCQUFNbzJCLFdBQU4sQ0FBa0IsSUFBbEI7QUFDQSxpQkFBSzkyQixPQUFMLENBQWEsZUFBYjtBQUNELFdBSEQ7QUFJRCxTQUxELE1BTUs7QUFDSG5CLHFCQUFXNk8sTUFBWCxDQUFrQkssVUFBbEIsQ0FBNkIsS0FBS2pPLFFBQWxDLEVBQTRDLEtBQUsydEIsWUFBakQsRUFBK0QsWUFBVztBQUN4RS9zQixrQkFBTW8yQixXQUFOLENBQWtCLEtBQWxCO0FBQ0EsaUJBQUs5MkIsT0FBTCxDQUFhLGdCQUFiO0FBQ0QsV0FIRDtBQUlEO0FBQ0Y7QUFqSFU7QUFBQTtBQUFBLGtDQW1IQ3FpQixJQW5IRCxFQW1ITztBQUNoQixhQUFLdmlCLFFBQUwsQ0FBY1osSUFBZCxDQUFtQixlQUFuQixFQUFvQ21qQixPQUFPLElBQVAsR0FBYyxLQUFsRDtBQUNEOztBQUVEOzs7OztBQXZIVztBQUFBO0FBQUEsZ0NBMkhEO0FBQ1IsYUFBS3ZpQixRQUFMLENBQWMyVSxHQUFkLENBQWtCLGFBQWxCO0FBQ0E1VixtQkFBV29CLGdCQUFYLENBQTRCLElBQTVCO0FBQ0Q7QUE5SFU7O0FBQUE7QUFBQTs7QUFpSWIwMkIsVUFBUS9nQixRQUFSLEdBQW1CO0FBQ2pCOzs7OztBQUtBOUgsYUFBUztBQU5RLEdBQW5COztBQVNBO0FBQ0FqUCxhQUFXTSxNQUFYLENBQWtCdzNCLE9BQWxCLEVBQTJCLFNBQTNCO0FBRUMsQ0E3SUEsQ0E2SUNud0IsTUE3SUQsQ0FBRDtDQ0ZBOzs7Ozs7QUFFQSxDQUFDLFVBQVM3SCxDQUFULEVBQVk7O0FBRWI7Ozs7Ozs7QUFGYSxNQVNQbzRCLE9BVE87QUFVWDs7Ozs7OztBQU9BLHFCQUFZbHdCLE9BQVosRUFBcUJpSixPQUFyQixFQUE4QjtBQUFBOztBQUM1QixXQUFLaFEsUUFBTCxHQUFnQitHLE9BQWhCO0FBQ0EsV0FBS2lKLE9BQUwsR0FBZW5SLEVBQUVxTCxNQUFGLENBQVMsRUFBVCxFQUFhK3NCLFFBQVFuaEIsUUFBckIsRUFBK0IsS0FBSzlWLFFBQUwsQ0FBY0MsSUFBZCxFQUEvQixFQUFxRCtQLE9BQXJELENBQWY7O0FBRUEsV0FBSytMLFFBQUwsR0FBZ0IsS0FBaEI7QUFDQSxXQUFLbWIsT0FBTCxHQUFlLEtBQWY7QUFDQSxXQUFLdjJCLEtBQUw7O0FBRUE1QixpQkFBV1ksY0FBWCxDQUEwQixJQUExQixFQUFnQyxTQUFoQztBQUNEOztBQUVEOzs7Ozs7QUE1Qlc7QUFBQTtBQUFBLDhCQWdDSDtBQUNOLFlBQUl3M0IsU0FBUyxLQUFLbjNCLFFBQUwsQ0FBY1osSUFBZCxDQUFtQixrQkFBbkIsS0FBMENMLFdBQVdnQixXQUFYLENBQXVCLENBQXZCLEVBQTBCLFNBQTFCLENBQXZEOztBQUVBLGFBQUtpUSxPQUFMLENBQWErTyxhQUFiLEdBQTZCLEtBQUtxWSxpQkFBTCxDQUF1QixLQUFLcDNCLFFBQTVCLENBQTdCO0FBQ0EsYUFBS2dRLE9BQUwsQ0FBYXFuQixPQUFiLEdBQXVCLEtBQUtybkIsT0FBTCxDQUFhcW5CLE9BQWIsSUFBd0IsS0FBS3IzQixRQUFMLENBQWNaLElBQWQsQ0FBbUIsT0FBbkIsQ0FBL0M7QUFDQSxhQUFLazRCLFFBQUwsR0FBZ0IsS0FBS3RuQixPQUFMLENBQWFzbkIsUUFBYixHQUF3Qno0QixFQUFFLEtBQUttUixPQUFMLENBQWFzbkIsUUFBZixDQUF4QixHQUFtRCxLQUFLQyxjQUFMLENBQW9CSixNQUFwQixDQUFuRTs7QUFFQSxhQUFLRyxRQUFMLENBQWNwekIsUUFBZCxDQUF1QmxHLFNBQVM5QyxJQUFoQyxFQUNLMlIsSUFETCxDQUNVLEtBQUttRCxPQUFMLENBQWFxbkIsT0FEdkIsRUFFS25vQixJQUZMOztBQUlBLGFBQUtsUCxRQUFMLENBQWNaLElBQWQsQ0FBbUI7QUFDakIsbUJBQVMsRUFEUTtBQUVqQiw4QkFBb0IrM0IsTUFGSDtBQUdqQiwyQkFBaUJBLE1BSEE7QUFJakIseUJBQWVBLE1BSkU7QUFLakIseUJBQWVBO0FBTEUsU0FBbkIsRUFNR3RvQixRQU5ILENBTVksS0FBSzJvQixZQU5qQjs7QUFRQTtBQUNBLGFBQUt0WSxhQUFMLEdBQXFCLEVBQXJCO0FBQ0EsYUFBS0QsT0FBTCxHQUFlLENBQWY7QUFDQSxhQUFLSyxZQUFMLEdBQW9CLEtBQXBCOztBQUVBLGFBQUt0SixPQUFMO0FBQ0Q7O0FBRUQ7Ozs7O0FBM0RXO0FBQUE7QUFBQSx3Q0ErRE9qUCxPQS9EUCxFQStEZ0I7QUFDekIsWUFBSSxDQUFDQSxPQUFMLEVBQWM7QUFBRSxpQkFBTyxFQUFQO0FBQVk7QUFDNUI7QUFDQSxZQUFJMkIsV0FBVzNCLFFBQVEsQ0FBUixFQUFXeEgsU0FBWCxDQUFxQjZmLEtBQXJCLENBQTJCLHVCQUEzQixDQUFmO0FBQ0kxVyxtQkFBV0EsV0FBV0EsU0FBUyxDQUFULENBQVgsR0FBeUIsRUFBcEM7QUFDSixlQUFPQSxRQUFQO0FBQ0Q7QUFyRVU7QUFBQTs7QUFzRVg7Ozs7QUF0RVcscUNBMEVJOEQsRUExRUosRUEwRVE7QUFDakIsWUFBSWlyQixrQkFBa0IsQ0FBSSxLQUFLem5CLE9BQUwsQ0FBYTBuQixZQUFqQixTQUFpQyxLQUFLMW5CLE9BQUwsQ0FBYStPLGFBQTlDLFNBQStELEtBQUsvTyxPQUFMLENBQWF5bkIsZUFBNUUsRUFBK0Y1MEIsSUFBL0YsRUFBdEI7QUFDQSxZQUFJODBCLFlBQWE5NEIsRUFBRSxhQUFGLEVBQWlCZ1EsUUFBakIsQ0FBMEI0b0IsZUFBMUIsRUFBMkNyNEIsSUFBM0MsQ0FBZ0Q7QUFDL0Qsa0JBQVEsU0FEdUQ7QUFFL0QseUJBQWUsSUFGZ0Q7QUFHL0QsNEJBQWtCLEtBSDZDO0FBSS9ELDJCQUFpQixLQUo4QztBQUsvRCxnQkFBTW9OO0FBTHlELFNBQWhELENBQWpCO0FBT0EsZUFBT21yQixTQUFQO0FBQ0Q7O0FBRUQ7Ozs7OztBQXRGVztBQUFBO0FBQUEsa0NBMkZDanZCLFFBM0ZELEVBMkZXO0FBQ3BCLGFBQUt3VyxhQUFMLENBQW1CMWhCLElBQW5CLENBQXdCa0wsV0FBV0EsUUFBWCxHQUFzQixRQUE5Qzs7QUFFQTtBQUNBLFlBQUksQ0FBQ0EsUUFBRCxJQUFjLEtBQUt3VyxhQUFMLENBQW1CL2hCLE9BQW5CLENBQTJCLEtBQTNCLElBQW9DLENBQXRELEVBQTBEO0FBQ3hELGVBQUttNkIsUUFBTCxDQUFjem9CLFFBQWQsQ0FBdUIsS0FBdkI7QUFDRCxTQUZELE1BRU8sSUFBSW5HLGFBQWEsS0FBYixJQUF1QixLQUFLd1csYUFBTCxDQUFtQi9oQixPQUFuQixDQUEyQixRQUEzQixJQUF1QyxDQUFsRSxFQUFzRTtBQUMzRSxlQUFLbTZCLFFBQUwsQ0FBY2x6QixXQUFkLENBQTBCc0UsUUFBMUI7QUFDRCxTQUZNLE1BRUEsSUFBSUEsYUFBYSxNQUFiLElBQXdCLEtBQUt3VyxhQUFMLENBQW1CL2hCLE9BQW5CLENBQTJCLE9BQTNCLElBQXNDLENBQWxFLEVBQXNFO0FBQzNFLGVBQUttNkIsUUFBTCxDQUFjbHpCLFdBQWQsQ0FBMEJzRSxRQUExQixFQUNLbUcsUUFETCxDQUNjLE9BRGQ7QUFFRCxTQUhNLE1BR0EsSUFBSW5HLGFBQWEsT0FBYixJQUF5QixLQUFLd1csYUFBTCxDQUFtQi9oQixPQUFuQixDQUEyQixNQUEzQixJQUFxQyxDQUFsRSxFQUFzRTtBQUMzRSxlQUFLbTZCLFFBQUwsQ0FBY2x6QixXQUFkLENBQTBCc0UsUUFBMUIsRUFDS21HLFFBREwsQ0FDYyxNQURkO0FBRUQ7O0FBRUQ7QUFMTyxhQU1GLElBQUksQ0FBQ25HLFFBQUQsSUFBYyxLQUFLd1csYUFBTCxDQUFtQi9oQixPQUFuQixDQUEyQixLQUEzQixJQUFvQyxDQUFDLENBQW5ELElBQTBELEtBQUsraEIsYUFBTCxDQUFtQi9oQixPQUFuQixDQUEyQixNQUEzQixJQUFxQyxDQUFuRyxFQUF1RztBQUMxRyxpQkFBS202QixRQUFMLENBQWN6b0IsUUFBZCxDQUF1QixNQUF2QjtBQUNELFdBRkksTUFFRSxJQUFJbkcsYUFBYSxLQUFiLElBQXVCLEtBQUt3VyxhQUFMLENBQW1CL2hCLE9BQW5CLENBQTJCLFFBQTNCLElBQXVDLENBQUMsQ0FBL0QsSUFBc0UsS0FBSytoQixhQUFMLENBQW1CL2hCLE9BQW5CLENBQTJCLE1BQTNCLElBQXFDLENBQS9HLEVBQW1IO0FBQ3hILGlCQUFLbTZCLFFBQUwsQ0FBY2x6QixXQUFkLENBQTBCc0UsUUFBMUIsRUFDS21HLFFBREwsQ0FDYyxNQURkO0FBRUQsV0FITSxNQUdBLElBQUluRyxhQUFhLE1BQWIsSUFBd0IsS0FBS3dXLGFBQUwsQ0FBbUIvaEIsT0FBbkIsQ0FBMkIsT0FBM0IsSUFBc0MsQ0FBQyxDQUEvRCxJQUFzRSxLQUFLK2hCLGFBQUwsQ0FBbUIvaEIsT0FBbkIsQ0FBMkIsUUFBM0IsSUFBdUMsQ0FBakgsRUFBcUg7QUFDMUgsaUJBQUttNkIsUUFBTCxDQUFjbHpCLFdBQWQsQ0FBMEJzRSxRQUExQjtBQUNELFdBRk0sTUFFQSxJQUFJQSxhQUFhLE9BQWIsSUFBeUIsS0FBS3dXLGFBQUwsQ0FBbUIvaEIsT0FBbkIsQ0FBMkIsTUFBM0IsSUFBcUMsQ0FBQyxDQUEvRCxJQUFzRSxLQUFLK2hCLGFBQUwsQ0FBbUIvaEIsT0FBbkIsQ0FBMkIsUUFBM0IsSUFBdUMsQ0FBakgsRUFBcUg7QUFDMUgsaUJBQUttNkIsUUFBTCxDQUFjbHpCLFdBQWQsQ0FBMEJzRSxRQUExQjtBQUNEO0FBQ0Q7QUFITyxlQUlGO0FBQ0gsbUJBQUs0dUIsUUFBTCxDQUFjbHpCLFdBQWQsQ0FBMEJzRSxRQUExQjtBQUNEO0FBQ0QsYUFBSzRXLFlBQUwsR0FBb0IsSUFBcEI7QUFDQSxhQUFLTCxPQUFMO0FBQ0Q7O0FBRUQ7Ozs7OztBQTlIVztBQUFBO0FBQUEscUNBbUlJO0FBQ2IsWUFBSXZXLFdBQVcsS0FBSzB1QixpQkFBTCxDQUF1QixLQUFLRSxRQUE1QixDQUFmO0FBQUEsWUFDSU0sV0FBVzc0QixXQUFXNEgsR0FBWCxDQUFlRSxhQUFmLENBQTZCLEtBQUt5d0IsUUFBbEMsQ0FEZjtBQUFBLFlBRUl2dUIsY0FBY2hLLFdBQVc0SCxHQUFYLENBQWVFLGFBQWYsQ0FBNkIsS0FBSzdHLFFBQWxDLENBRmxCO0FBQUEsWUFHSXVmLFlBQWE3VyxhQUFhLE1BQWIsR0FBc0IsTUFBdEIsR0FBaUNBLGFBQWEsT0FBZCxHQUF5QixNQUF6QixHQUFrQyxLQUhuRjtBQUFBLFlBSUkwRSxRQUFTbVMsY0FBYyxLQUFmLEdBQXdCLFFBQXhCLEdBQW1DLE9BSi9DO0FBQUEsWUFLSTlYLFNBQVUyRixVQUFVLFFBQVgsR0FBdUIsS0FBSzRDLE9BQUwsQ0FBYXJILE9BQXBDLEdBQThDLEtBQUtxSCxPQUFMLENBQWFwSCxPQUx4RTtBQUFBLFlBTUloSSxRQUFRLElBTlo7O0FBUUEsWUFBS2czQixTQUFTandCLEtBQVQsSUFBa0Jpd0IsU0FBU2h3QixVQUFULENBQW9CRCxLQUF2QyxJQUFrRCxDQUFDLEtBQUtzWCxPQUFOLElBQWlCLENBQUNsZ0IsV0FBVzRILEdBQVgsQ0FBZUMsZ0JBQWYsQ0FBZ0MsS0FBSzB3QixRQUFyQyxDQUF4RSxFQUF5SDtBQUN2SCxlQUFLQSxRQUFMLENBQWM3dkIsTUFBZCxDQUFxQjFJLFdBQVc0SCxHQUFYLENBQWVHLFVBQWYsQ0FBMEIsS0FBS3d3QixRQUEvQixFQUF5QyxLQUFLdDNCLFFBQTlDLEVBQXdELGVBQXhELEVBQXlFLEtBQUtnUSxPQUFMLENBQWFySCxPQUF0RixFQUErRixLQUFLcUgsT0FBTCxDQUFhcEgsT0FBNUcsRUFBcUgsSUFBckgsQ0FBckIsRUFBaUp5QyxHQUFqSixDQUFxSjtBQUNySjtBQUNFLHFCQUFTdEMsWUFBWW5CLFVBQVosQ0FBdUJELEtBQXZCLEdBQWdDLEtBQUtxSSxPQUFMLENBQWFwSCxPQUFiLEdBQXVCLENBRm1GO0FBR25KLHNCQUFVO0FBSHlJLFdBQXJKO0FBS0EsaUJBQU8sS0FBUDtBQUNEOztBQUVELGFBQUswdUIsUUFBTCxDQUFjN3ZCLE1BQWQsQ0FBcUIxSSxXQUFXNEgsR0FBWCxDQUFlRyxVQUFmLENBQTBCLEtBQUt3d0IsUUFBL0IsRUFBeUMsS0FBS3QzQixRQUE5QyxFQUF1RCxhQUFhMEksWUFBWSxRQUF6QixDQUF2RCxFQUEyRixLQUFLc0gsT0FBTCxDQUFhckgsT0FBeEcsRUFBaUgsS0FBS3FILE9BQUwsQ0FBYXBILE9BQTlILENBQXJCOztBQUVBLGVBQU0sQ0FBQzdKLFdBQVc0SCxHQUFYLENBQWVDLGdCQUFmLENBQWdDLEtBQUswd0IsUUFBckMsQ0FBRCxJQUFtRCxLQUFLclksT0FBOUQsRUFBdUU7QUFDckUsZUFBS08sV0FBTCxDQUFpQjlXLFFBQWpCO0FBQ0EsZUFBSytXLFlBQUw7QUFDRDtBQUNGOztBQUVEOzs7Ozs7O0FBN0pXO0FBQUE7QUFBQSw2QkFtS0o7QUFDTCxZQUFJLEtBQUt6UCxPQUFMLENBQWE2bkIsTUFBYixLQUF3QixLQUF4QixJQUFpQyxDQUFDOTRCLFdBQVdzRixVQUFYLENBQXNCcUgsT0FBdEIsQ0FBOEIsS0FBS3NFLE9BQUwsQ0FBYTZuQixNQUEzQyxDQUF0QyxFQUEwRjtBQUN4RjtBQUNBLGlCQUFPLEtBQVA7QUFDRDs7QUFFRCxZQUFJajNCLFFBQVEsSUFBWjtBQUNBLGFBQUswMkIsUUFBTCxDQUFjanNCLEdBQWQsQ0FBa0IsWUFBbEIsRUFBZ0MsUUFBaEMsRUFBMEN5RCxJQUExQztBQUNBLGFBQUsyUSxZQUFMOztBQUVBOzs7O0FBSUEsYUFBS3pmLFFBQUwsQ0FBY0UsT0FBZCxDQUFzQixvQkFBdEIsRUFBNEMsS0FBS28zQixRQUFMLENBQWNsNEIsSUFBZCxDQUFtQixJQUFuQixDQUE1Qzs7QUFHQSxhQUFLazRCLFFBQUwsQ0FBY2w0QixJQUFkLENBQW1CO0FBQ2pCLDRCQUFrQixJQUREO0FBRWpCLHlCQUFlO0FBRkUsU0FBbkI7QUFJQXdCLGNBQU1tYixRQUFOLEdBQWlCLElBQWpCO0FBQ0E7QUFDQSxhQUFLdWIsUUFBTCxDQUFjOVEsSUFBZCxHQUFxQnRYLElBQXJCLEdBQTRCN0QsR0FBNUIsQ0FBZ0MsWUFBaEMsRUFBOEMsRUFBOUMsRUFBa0R5c0IsTUFBbEQsQ0FBeUQsS0FBSzluQixPQUFMLENBQWErbkIsY0FBdEUsRUFBc0YsWUFBVztBQUMvRjtBQUNELFNBRkQ7QUFHQTs7OztBQUlBLGFBQUsvM0IsUUFBTCxDQUFjRSxPQUFkLENBQXNCLGlCQUF0QjtBQUNEOztBQUVEOzs7Ozs7QUFwTVc7QUFBQTtBQUFBLDZCQXlNSjtBQUNMO0FBQ0EsWUFBSVUsUUFBUSxJQUFaO0FBQ0EsYUFBSzAyQixRQUFMLENBQWM5USxJQUFkLEdBQXFCcG5CLElBQXJCLENBQTBCO0FBQ3hCLHlCQUFlLElBRFM7QUFFeEIsNEJBQWtCO0FBRk0sU0FBMUIsRUFHRzRVLE9BSEgsQ0FHVyxLQUFLaEUsT0FBTCxDQUFhZ29CLGVBSHhCLEVBR3lDLFlBQVc7QUFDbERwM0IsZ0JBQU1tYixRQUFOLEdBQWlCLEtBQWpCO0FBQ0FuYixnQkFBTXMyQixPQUFOLEdBQWdCLEtBQWhCO0FBQ0EsY0FBSXQyQixNQUFNMGUsWUFBVixFQUF3QjtBQUN0QjFlLGtCQUFNMDJCLFFBQU4sQ0FDTWx6QixXQUROLENBQ2tCeEQsTUFBTXcyQixpQkFBTixDQUF3QngyQixNQUFNMDJCLFFBQTlCLENBRGxCLEVBRU16b0IsUUFGTixDQUVlak8sTUFBTW9QLE9BQU4sQ0FBYytPLGFBRjdCOztBQUlEbmUsa0JBQU1zZSxhQUFOLEdBQXNCLEVBQXRCO0FBQ0F0ZSxrQkFBTXFlLE9BQU4sR0FBZ0IsQ0FBaEI7QUFDQXJlLGtCQUFNMGUsWUFBTixHQUFxQixLQUFyQjtBQUNBO0FBQ0YsU0FmRDtBQWdCQTs7OztBQUlBLGFBQUt0ZixRQUFMLENBQWNFLE9BQWQsQ0FBc0IsaUJBQXRCO0FBQ0Q7O0FBRUQ7Ozs7OztBQW5PVztBQUFBO0FBQUEsZ0NBd09EO0FBQ1IsWUFBSVUsUUFBUSxJQUFaO0FBQ0EsWUFBSSsyQixZQUFZLEtBQUtMLFFBQXJCO0FBQ0EsWUFBSVcsVUFBVSxLQUFkOztBQUVBLFlBQUksQ0FBQyxLQUFLam9CLE9BQUwsQ0FBYW1SLFlBQWxCLEVBQWdDOztBQUU5QixlQUFLbmhCLFFBQUwsQ0FDQ2lNLEVBREQsQ0FDSSx1QkFESixFQUM2QixVQUFTeEosQ0FBVCxFQUFZO0FBQ3ZDLGdCQUFJLENBQUM3QixNQUFNbWIsUUFBWCxFQUFxQjtBQUNuQm5iLG9CQUFNK2UsT0FBTixHQUFnQnpqQixXQUFXLFlBQVc7QUFDcEMwRSxzQkFBTWtPLElBQU47QUFDRCxlQUZlLEVBRWJsTyxNQUFNb1AsT0FBTixDQUFjNFAsVUFGRCxDQUFoQjtBQUdEO0FBQ0YsV0FQRCxFQVFDM1QsRUFSRCxDQVFJLHVCQVJKLEVBUTZCLFVBQVN4SixDQUFULEVBQVk7QUFDdkNwRyx5QkFBYXVFLE1BQU0rZSxPQUFuQjtBQUNBLGdCQUFJLENBQUNzWSxPQUFELElBQWEsQ0FBQ3IzQixNQUFNczJCLE9BQVAsSUFBa0J0MkIsTUFBTW9QLE9BQU4sQ0FBYytRLFNBQWpELEVBQTZEO0FBQzNEbmdCLG9CQUFNc08sSUFBTjtBQUNEO0FBQ0YsV0FiRDtBQWNEOztBQUVELFlBQUksS0FBS2MsT0FBTCxDQUFhK1EsU0FBakIsRUFBNEI7QUFDMUIsZUFBSy9nQixRQUFMLENBQWNpTSxFQUFkLENBQWlCLHNCQUFqQixFQUF5QyxVQUFTeEosQ0FBVCxFQUFZO0FBQ25EQSxjQUFFa2Esd0JBQUY7QUFDQSxnQkFBSS9iLE1BQU1zMkIsT0FBVixFQUFtQjtBQUNqQnQyQixvQkFBTXNPLElBQU47QUFDQTtBQUNELGFBSEQsTUFHTztBQUNMdE8sb0JBQU1zMkIsT0FBTixHQUFnQixJQUFoQjtBQUNBLGtCQUFJLENBQUN0MkIsTUFBTW9QLE9BQU4sQ0FBY21SLFlBQWQsSUFBOEIsQ0FBQ3ZnQixNQUFNWixRQUFOLENBQWVaLElBQWYsQ0FBb0IsVUFBcEIsQ0FBaEMsS0FBb0UsQ0FBQ3dCLE1BQU1tYixRQUEvRSxFQUF5RjtBQUN2Rm5iLHNCQUFNa08sSUFBTjtBQUNEO0FBQ0Y7QUFDRixXQVhEO0FBWUQ7O0FBRUQsWUFBSSxDQUFDLEtBQUtrQixPQUFMLENBQWFrb0IsZUFBbEIsRUFBbUM7QUFDakMsZUFBS2w0QixRQUFMLENBQ0NpTSxFQURELENBQ0ksb0NBREosRUFDMEMsVUFBU3hKLENBQVQsRUFBWTtBQUNwRDdCLGtCQUFNbWIsUUFBTixHQUFpQm5iLE1BQU1zTyxJQUFOLEVBQWpCLEdBQWdDdE8sTUFBTWtPLElBQU4sRUFBaEM7QUFDRCxXQUhEO0FBSUQ7O0FBRUQsYUFBSzlPLFFBQUwsQ0FBY2lNLEVBQWQsQ0FBaUI7QUFDZjtBQUNBO0FBQ0EsOEJBQW9CLEtBQUtpRCxJQUFMLENBQVV0SixJQUFWLENBQWUsSUFBZjtBQUhMLFNBQWpCOztBQU1BLGFBQUs1RixRQUFMLENBQ0dpTSxFQURILENBQ00sa0JBRE4sRUFDMEIsVUFBU3hKLENBQVQsRUFBWTtBQUNsQ3cxQixvQkFBVSxJQUFWO0FBQ0E7QUFDQSxjQUFJcjNCLE1BQU1zMkIsT0FBVixFQUFtQjtBQUNqQixtQkFBTyxLQUFQO0FBQ0QsV0FGRCxNQUVPO0FBQ0w7QUFDQXQyQixrQkFBTWtPLElBQU47QUFDRDtBQUNGLFNBVkgsRUFZRzdDLEVBWkgsQ0FZTSxxQkFaTixFQVk2QixVQUFTeEosQ0FBVCxFQUFZO0FBQ3JDdzFCLG9CQUFVLEtBQVY7QUFDQXIzQixnQkFBTXMyQixPQUFOLEdBQWdCLEtBQWhCO0FBQ0F0MkIsZ0JBQU1zTyxJQUFOO0FBQ0QsU0FoQkgsRUFrQkdqRCxFQWxCSCxDQWtCTSxxQkFsQk4sRUFrQjZCLFlBQVc7QUFDcEMsY0FBSXJMLE1BQU1tYixRQUFWLEVBQW9CO0FBQ2xCbmIsa0JBQU02ZSxZQUFOO0FBQ0Q7QUFDRixTQXRCSDtBQXVCRDs7QUFFRDs7Ozs7QUFwVFc7QUFBQTtBQUFBLCtCQXdURjtBQUNQLFlBQUksS0FBSzFELFFBQVQsRUFBbUI7QUFDakIsZUFBSzdNLElBQUw7QUFDRCxTQUZELE1BRU87QUFDTCxlQUFLSixJQUFMO0FBQ0Q7QUFDRjs7QUFFRDs7Ozs7QUFoVVc7QUFBQTtBQUFBLGdDQW9VRDtBQUNSLGFBQUs5TyxRQUFMLENBQWNaLElBQWQsQ0FBbUIsT0FBbkIsRUFBNEIsS0FBS2s0QixRQUFMLENBQWN6cUIsSUFBZCxFQUE1QixFQUNjOEgsR0FEZCxDQUNrQix3QkFEbEI7QUFFWTtBQUZaLFNBR2N2VSxVQUhkLENBR3lCLGtCQUh6QixFQUljQSxVQUpkLENBSXlCLGVBSnpCLEVBS2NBLFVBTGQsQ0FLeUIsYUFMekIsRUFNY0EsVUFOZCxDQU15QixhQU56Qjs7QUFRQSxhQUFLazNCLFFBQUwsQ0FBYzNZLE1BQWQ7O0FBRUE1ZixtQkFBV29CLGdCQUFYLENBQTRCLElBQTVCO0FBQ0Q7QUFoVlU7O0FBQUE7QUFBQTs7QUFtVmI4MkIsVUFBUW5oQixRQUFSLEdBQW1CO0FBQ2pCb2lCLHFCQUFpQixLQURBO0FBRWpCOzs7OztBQUtBdFksZ0JBQVksR0FQSztBQVFqQjs7Ozs7QUFLQW1ZLG9CQUFnQixHQWJDO0FBY2pCOzs7OztBQUtBQyxxQkFBaUIsR0FuQkE7QUFvQmpCOzs7OztBQUtBN1csa0JBQWMsS0F6Qkc7QUEwQmpCOzs7OztBQUtBc1cscUJBQWlCLEVBL0JBO0FBZ0NqQjs7Ozs7QUFLQUMsa0JBQWMsU0FyQ0c7QUFzQ2pCOzs7OztBQUtBRixrQkFBYyxTQTNDRztBQTRDakI7Ozs7O0FBS0FLLFlBQVEsT0FqRFM7QUFrRGpCOzs7OztBQUtBUCxjQUFVLEVBdkRPO0FBd0RqQjs7Ozs7QUFLQUQsYUFBUyxFQTdEUTtBQThEakJjLG9CQUFnQixlQTlEQztBQStEakI7Ozs7O0FBS0FwWCxlQUFXLElBcEVNO0FBcUVqQjs7Ozs7QUFLQWhDLG1CQUFlLEVBMUVFO0FBMkVqQjs7Ozs7QUFLQXBXLGFBQVMsRUFoRlE7QUFpRmpCOzs7OztBQUtBQyxhQUFTO0FBdEZRLEdBQW5COztBQXlGQTs7OztBQUlBO0FBQ0E3SixhQUFXTSxNQUFYLENBQWtCNDNCLE9BQWxCLEVBQTJCLFNBQTNCO0FBRUMsQ0FuYkEsQ0FtYkN2d0IsTUFuYkQsQ0FBRDtDQ0ZBOztBQUVBOztBQUNBLENBQUMsWUFBVztBQUNWLE1BQUksQ0FBQy9CLEtBQUtDLEdBQVYsRUFDRUQsS0FBS0MsR0FBTCxHQUFXLFlBQVc7QUFBRSxXQUFPLElBQUlELElBQUosR0FBV0UsT0FBWCxFQUFQO0FBQThCLEdBQXREOztBQUVGLE1BQUlDLFVBQVUsQ0FBQyxRQUFELEVBQVcsS0FBWCxDQUFkO0FBQ0EsT0FBSyxJQUFJOUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJOEMsUUFBUXhELE1BQVosSUFBc0IsQ0FBQ3ZHLE9BQU9nSyxxQkFBOUMsRUFBcUUsRUFBRS9DLENBQXZFLEVBQTBFO0FBQ3RFLFFBQUlnRCxLQUFLRixRQUFROUMsQ0FBUixDQUFUO0FBQ0FqSCxXQUFPZ0sscUJBQVAsR0FBK0JoSyxPQUFPaUssS0FBRyx1QkFBVixDQUEvQjtBQUNBakssV0FBT2tLLG9CQUFQLEdBQStCbEssT0FBT2lLLEtBQUcsc0JBQVYsS0FDRGpLLE9BQU9pSyxLQUFHLDZCQUFWLENBRDlCO0FBRUg7QUFDRCxNQUFJLHVCQUF1QkUsSUFBdkIsQ0FBNEJuSyxPQUFPb0ssU0FBUCxDQUFpQkMsU0FBN0MsS0FDQyxDQUFDckssT0FBT2dLLHFCQURULElBQ2tDLENBQUNoSyxPQUFPa0ssb0JBRDlDLEVBQ29FO0FBQ2xFLFFBQUlJLFdBQVcsQ0FBZjtBQUNBdEssV0FBT2dLLHFCQUFQLEdBQStCLFVBQVNPLFFBQVQsRUFBbUI7QUFDOUMsVUFBSVYsTUFBTUQsS0FBS0MsR0FBTCxFQUFWO0FBQ0EsVUFBSVcsV0FBVy9ELEtBQUtnRSxHQUFMLENBQVNILFdBQVcsRUFBcEIsRUFBd0JULEdBQXhCLENBQWY7QUFDQSxhQUFPMUksV0FBVyxZQUFXO0FBQUVvSixpQkFBU0QsV0FBV0UsUUFBcEI7QUFBZ0MsT0FBeEQsRUFDV0EsV0FBV1gsR0FEdEIsQ0FBUDtBQUVILEtBTEQ7QUFNQTdKLFdBQU9rSyxvQkFBUCxHQUE4QjVJLFlBQTlCO0FBQ0Q7QUFDRixDQXRCRDs7QUF3QkEsSUFBSXFSLGNBQWdCLENBQUMsV0FBRCxFQUFjLFdBQWQsQ0FBcEI7QUFDQSxJQUFJQyxnQkFBZ0IsQ0FBQyxrQkFBRCxFQUFxQixrQkFBckIsQ0FBcEI7O0FBRUE7QUFDQSxJQUFJeXFCLFdBQVksWUFBVztBQUN6QixNQUFJbDFCLGNBQWM7QUFDaEIsa0JBQWMsZUFERTtBQUVoQix3QkFBb0IscUJBRko7QUFHaEIscUJBQWlCLGVBSEQ7QUFJaEIsbUJBQWU7QUFKQyxHQUFsQjtBQU1BLE1BQUluQixPQUFPaEgsT0FBT2lELFFBQVAsQ0FBZ0JJLGFBQWhCLENBQThCLEtBQTlCLENBQVg7O0FBRUEsT0FBSyxJQUFJZ0YsQ0FBVCxJQUFjRixXQUFkLEVBQTJCO0FBQ3pCLFFBQUksT0FBT25CLEtBQUtzQixLQUFMLENBQVdELENBQVgsQ0FBUCxLQUF5QixXQUE3QixFQUEwQztBQUN4QyxhQUFPRixZQUFZRSxDQUFaLENBQVA7QUFDRDtBQUNGOztBQUVELFNBQU8sSUFBUDtBQUNELENBaEJjLEVBQWY7O0FBa0JBLFNBQVM0SyxPQUFULENBQWlCUSxJQUFqQixFQUF1QnpILE9BQXZCLEVBQWdDK0csU0FBaEMsRUFBMkNDLEVBQTNDLEVBQStDO0FBQzdDaEgsWUFBVWxJLEVBQUVrSSxPQUFGLEVBQVcwSCxFQUFYLENBQWMsQ0FBZCxDQUFWOztBQUVBLE1BQUksQ0FBQzFILFFBQVF6RixNQUFiLEVBQXFCOztBQUVyQixNQUFJODJCLGFBQWEsSUFBakIsRUFBdUI7QUFDckI1cEIsV0FBT3pILFFBQVErSCxJQUFSLEVBQVAsR0FBd0IvSCxRQUFRbUksSUFBUixFQUF4QjtBQUNBbkI7QUFDQTtBQUNEOztBQUVELE1BQUlXLFlBQVlGLE9BQU9kLFlBQVksQ0FBWixDQUFQLEdBQXdCQSxZQUFZLENBQVosQ0FBeEM7QUFDQSxNQUFJaUIsY0FBY0gsT0FBT2IsY0FBYyxDQUFkLENBQVAsR0FBMEJBLGNBQWMsQ0FBZCxDQUE1Qzs7QUFFQTtBQUNBaUI7QUFDQTdILFVBQVE4SCxRQUFSLENBQWlCZixTQUFqQjtBQUNBL0csVUFBUXNFLEdBQVIsQ0FBWSxZQUFaLEVBQTBCLE1BQTFCO0FBQ0F0Ryx3QkFBc0IsWUFBVztBQUMvQmdDLFlBQVE4SCxRQUFSLENBQWlCSCxTQUFqQjtBQUNBLFFBQUlGLElBQUosRUFBVXpILFFBQVErSCxJQUFSO0FBQ1gsR0FIRDs7QUFLQTtBQUNBL0osd0JBQXNCLFlBQVc7QUFDL0JnQyxZQUFRLENBQVIsRUFBV2dJLFdBQVg7QUFDQWhJLFlBQVFzRSxHQUFSLENBQVksWUFBWixFQUEwQixFQUExQjtBQUNBdEUsWUFBUThILFFBQVIsQ0FBaUJGLFdBQWpCO0FBQ0QsR0FKRDs7QUFNQTtBQUNBNUgsVUFBUWlJLEdBQVIsQ0FBWSxlQUFaLEVBQTZCQyxNQUE3Qjs7QUFFQTtBQUNBLFdBQVNBLE1BQVQsR0FBa0I7QUFDaEIsUUFBSSxDQUFDVCxJQUFMLEVBQVd6SCxRQUFRbUksSUFBUjtBQUNYTjtBQUNBLFFBQUliLEVBQUosRUFBUUEsR0FBR2pLLEtBQUgsQ0FBU2lELE9BQVQ7QUFDVDs7QUFFRDtBQUNBLFdBQVM2SCxLQUFULEdBQWlCO0FBQ2Y3SCxZQUFRLENBQVIsRUFBVzFELEtBQVgsQ0FBaUI4TCxrQkFBakIsR0FBc0MsQ0FBdEM7QUFDQXBJLFlBQVEzQyxXQUFSLENBQW9Cc0ssWUFBWSxHQUFaLEdBQWtCQyxXQUFsQixHQUFnQyxHQUFoQyxHQUFzQ2IsU0FBMUQ7QUFDRDtBQUNGOztBQUVELElBQUl1cUIsV0FBVztBQUNieHFCLGFBQVcsVUFBUzlHLE9BQVQsRUFBa0IrRyxTQUFsQixFQUE2QkMsRUFBN0IsRUFBaUM7QUFDMUNDLFlBQVEsSUFBUixFQUFjakgsT0FBZCxFQUF1QitHLFNBQXZCLEVBQWtDQyxFQUFsQztBQUNELEdBSFk7O0FBS2JFLGNBQVksVUFBU2xILE9BQVQsRUFBa0IrRyxTQUFsQixFQUE2QkMsRUFBN0IsRUFBaUM7QUFDM0NDLFlBQVEsS0FBUixFQUFlakgsT0FBZixFQUF3QitHLFNBQXhCLEVBQW1DQyxFQUFuQztBQUNEO0FBUFksQ0FBZjs7O0FDaEdBbFAsRUFBR2IsUUFBSCxFQUFjczZCLEtBQWQsQ0FBb0IsWUFBVztBQUMzQno1QixNQUFFLGtCQUFGLEVBQXNCK2UsT0FBdEIsQ0FBOEIsNENBQTlCO0FBQ0gsQ0FGRDs7QUFJQS9lLEVBQUUsdUJBQUYsRUFBMkIwNUIsS0FBM0IsQ0FBaUMsWUFBVztBQUN4Q24zQixZQUFRbzNCLEdBQVIsQ0FBWSxTQUFaO0FBQ0EzNUIsTUFBRSxjQUFGLEVBQWtCb0MsVUFBbEIsQ0FBNkIsTUFBN0IsRUFBcUNwQyxFQUFFLG9CQUFGLENBQXJDO0FBQ0gsQ0FIRDs7O0FDSkEsQ0FBQyxDQUFDLFVBQVNBLENBQVQsRUFBWTs7QUFFWixXQUFTNDVCLFdBQVQsQ0FBcUIxeEIsT0FBckIsRUFBOEJpSixPQUE5QixFQUF1QzdCLFFBQXZDLEVBQWlEMFgsTUFBakQsRUFBeUR2Z0IsUUFBekQsRUFBbUU7O0FBRWpFLFFBQUlsRCxNQUFNdkQsRUFBRWtJLE9BQUYsQ0FBVjtBQUFBLFFBQ0kyeEIsV0FBVzc1QixFQUFFcUwsTUFBRixDQUFTLEVBQVQsRUFBYXJMLEVBQUU2RixFQUFGLENBQUsrekIsV0FBTCxDQUFpQjNpQixRQUE5QixFQUF3QzlGLE9BQXhDLENBRGY7QUFBQSxRQUVJMm9CLFlBQVlELFNBQVNDLFNBRnpCO0FBQUEsUUFHSUMsb0JBQXFCRCxjQUFjLFFBQWYsR0FBMkIsT0FBM0IsR0FBcUMsUUFIN0Q7O0FBS0E7QUFDQSxZQUFRRCxTQUFTRyxNQUFqQjtBQUNFLFdBQU0sTUFBTjtBQUNFQyxlQUFPMTJCLEdBQVA7QUFDQTtBQUNGLFdBQU0sT0FBTjtBQUNFMjJCLGdCQUFRMzJCLEdBQVI7QUFDQTtBQUNGLFdBQU0sUUFBTjtBQUNFNDJCLGlCQUFTNTJCLEdBQVQ7QUFDQTtBQUNGO0FBQ0UsY0FBTSxJQUFJMEYsS0FBSixDQUFVLG1IQUFWLENBQU47QUFYSjs7QUFjQSxhQUFTbXhCLGtCQUFULENBQTRCNzJCLEdBQTVCLEVBQWlDO0FBQy9CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFJODJCLFNBQVM5MkIsSUFBSW1iLEtBQUosR0FDVmxTLEdBRFUsQ0FDTjtBQUNIdXRCLDJCQUFtQngyQixJQUFJaUosR0FBSixDQUFRdXRCLGlCQUFSLENBRGhCO0FBRUgsc0JBQWM7QUFGWCxPQURNLEVBS1YxMEIsUUFMVSxDQUtEOUIsSUFBSTRFLE1BQUosRUFMQyxDQUFiO0FBTUEsVUFBSW15Qix3QkFBd0JELE9BQ3pCN3RCLEdBRHlCLENBQ3JCc3RCLFNBRHFCLEVBQ1YsTUFEVSxFQUV6QnR0QixHQUZ5QixDQUVyQnN0QixTQUZxQixDQUE1QjtBQUdBTyxhQUFPdmEsTUFBUDtBQUNBLGFBQU93YSxxQkFBUDtBQUNEOztBQUVELGFBQVNMLE1BQVQsQ0FBZ0IxMkIsR0FBaEIsRUFBcUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQUksQ0FBQ0EsSUFBSXNZLFFBQUosQ0FBYWdlLFNBQVNVLFNBQXRCLENBQUwsRUFBdUM7QUFDckMsWUFBSUMsVUFBVSxFQUFkO0FBQ0FBLGdCQUFRVixTQUFSLElBQXFCTSxtQkFBbUI3MkIsR0FBbkIsQ0FBckI7QUFDQUEsWUFBSTRMLE9BQUosQ0FBWXFyQixPQUFaLEVBQXFCbHJCLFFBQXJCLEVBQStCMFgsTUFBL0IsRUFBdUMsWUFBVztBQUNoRHpqQixjQUFJaUosR0FBSixDQUFRc3RCLFNBQVIsRUFBbUIsTUFBbkI7QUFDQXJ6QjtBQUNELFNBSEQsRUFJR3VKLFFBSkgsQ0FJWTZwQixTQUFTVSxTQUpyQjtBQUtEO0FBQ0Y7O0FBRUQsYUFBU0wsT0FBVCxDQUFpQjMyQixHQUFqQixFQUFzQjtBQUNwQjtBQUNBO0FBQ0E7QUFDQSxVQUFJQSxJQUFJaUosR0FBSixDQUFRc3RCLFNBQVIsTUFBdUJELFNBQVNZLE1BQXBDLEVBQTRDO0FBQzFDLFlBQUlELFVBQVUsRUFBZDtBQUNBQSxnQkFBUVYsU0FBUixJQUFxQkQsU0FBU1ksTUFBOUI7QUFDQWwzQixZQUFJNEwsT0FBSixDQUFZcXJCLE9BQVosRUFBcUJsckIsUUFBckIsRUFBK0IwWCxNQUEvQixFQUF1Q3ZnQixRQUF2QyxFQUNHbEIsV0FESCxDQUNlczBCLFNBQVNVLFNBRHhCO0FBRUQ7QUFDRjs7QUFFRCxhQUFTSixRQUFULENBQWtCNTJCLEdBQWxCLEVBQXVCO0FBQ3JCLFVBQUlBLElBQUlzWSxRQUFKLENBQWFnZSxTQUFTVSxTQUF0QixDQUFKLEVBQXNDO0FBQ3BDTCxnQkFBUTMyQixHQUFSO0FBQ0QsT0FGRCxNQUdLO0FBQ0gwMkIsZUFBTzEyQixHQUFQO0FBQ0Q7QUFDRjtBQUNGOztBQUVELFdBQVNtM0IsV0FBVCxHQUF1QjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFJdnBCLFVBQVUsRUFBZDtBQUFBLFFBQ0kxSyxXQUFXLFlBQVUsQ0FBRSxDQUQzQjtBQUFBLFFBRUk2SSxRQUZKO0FBQUEsUUFFYzBYLE1BRmQ7QUFHQSxRQUFJMlQsSUFBSTMxQixVQUFVdkMsTUFBbEI7QUFDQSxTQUFLLElBQUlVLElBQUUsQ0FBWCxFQUFhQSxJQUFFdzNCLENBQWYsRUFBaUJ4M0IsR0FBakIsRUFBc0I7QUFDcEIsVUFBSXkzQixNQUFNNTFCLFVBQVU3QixDQUFWLENBQVY7QUFBQSxVQUNJMDNCLFVBQVUsT0FBT0QsR0FEckI7QUFFQSxVQUFJLENBQUNBLEdBQUwsRUFBVTtBQUNSO0FBQ0Q7QUFDRDtBQUNBLGNBQVFBLEdBQVI7QUFDRTtBQUNBLGFBQUssUUFBTDtBQUNBLGFBQUssT0FBTDtBQUNFNTZCLFlBQUVxTCxNQUFGLENBQVM4RixPQUFULEVBQWtCLEVBQUUyb0IsV0FBV2MsR0FBYixFQUFsQjtBQUNBO0FBQ0Y7QUFDQSxhQUFLLE1BQUw7QUFDQSxhQUFLLE9BQUw7QUFDQSxhQUFLLFFBQUw7QUFDRTU2QixZQUFFcUwsTUFBRixDQUFTOEYsT0FBVCxFQUFrQixFQUFFNm9CLFFBQVFZLEdBQVYsRUFBbEI7QUFDQTtBQUNGO0FBQ0EsYUFBSyxNQUFMO0FBQ0EsYUFBSyxNQUFMO0FBQ0V0ckIscUJBQVdzckIsR0FBWDtBQUNBO0FBaEJKO0FBa0JBO0FBQ0EsY0FBUUMsT0FBUjtBQUNFO0FBQ0EsYUFBSyxRQUFMO0FBQ0V2ckIscUJBQVdzckIsR0FBWDtBQUNBO0FBQ0Y7QUFDQTtBQUNBLGFBQUssUUFBTDtBQUNFNVQsbUJBQVM0VCxHQUFUO0FBQ0E7QUFDRjtBQUNBLGFBQUssVUFBTDtBQUNFbjBCLHFCQUFXbTBCLEdBQVg7QUFDQTtBQUNGO0FBQ0EsYUFBSyxRQUFMO0FBQ0U1NkIsWUFBRXFMLE1BQUYsQ0FBUzhGLE9BQVQsRUFBa0J5cEIsR0FBbEI7QUFDQTtBQWpCSjtBQW1CRDtBQUNELFdBQU8sQ0FBQ3pwQixPQUFELEVBQVU3QixRQUFWLEVBQW9CMFgsTUFBcEIsRUFBNEJ2Z0IsUUFBNUIsQ0FBUDtBQUNEOztBQUVEekcsSUFBRTZGLEVBQUYsQ0FBSyt6QixXQUFMLEdBQW1CLFlBQVc7QUFDNUIsUUFBSWtCLFlBQVlKLFlBQVl6MUIsS0FBWixDQUFrQixJQUFsQixFQUF3QkQsU0FBeEIsQ0FBaEI7QUFDQSxXQUFPLEtBQUtuRCxJQUFMLENBQVUsWUFBWTtBQUMzQiszQixrQkFBWTMwQixLQUFaLENBQWtCLElBQWxCLEVBQXdCLENBQUMsSUFBRCxFQUFPb0MsTUFBUCxDQUFjeXpCLFNBQWQsQ0FBeEI7QUFDRCxLQUZNLENBQVA7QUFHRCxHQUxEOztBQU9BOTZCLElBQUU2RixFQUFGLENBQUsrekIsV0FBTCxDQUFpQjNpQixRQUFqQixHQUE0QjtBQUMxQjZpQixlQUFXLFFBRGUsRUFDTDtBQUNyQkUsWUFBUSxRQUZrQixFQUVSO0FBQ2xCUyxZQUFRLENBSGtCO0FBSTFCRixlQUFXO0FBSmUsR0FBNUI7QUFPRCxDQTVKQSxFQTRKRTF5QixNQTVKRjs7O0FDQURBLE9BQVEsNEJBQVIsRUFBc0MrVyxJQUF0QyxDQUEyQyxzQ0FBM0M7QUFDQS9XLE9BQVEsMEJBQVIsRUFBb0MrVyxJQUFwQyxDQUF5Qyw0Q0FBekM7OztBQ0RBNWUsRUFBRWIsUUFBRixFQUFZaUQsVUFBWjs7O0FDQUE7QUFDQXBDLEVBQUUsV0FBRixFQUFlb04sRUFBZixDQUFrQixPQUFsQixFQUEyQixZQUFXO0FBQ3BDcE4sSUFBRWIsUUFBRixFQUFZaUQsVUFBWixDQUF1QixTQUF2QixFQUFpQyxPQUFqQztBQUNELENBRkQ7Q0NEQTs7O0FDQUFwQyxFQUFFLGlCQUFGLEVBQXFCMDVCLEtBQXJCLENBQTJCLFlBQVc7QUFDbEMxNUIsTUFBRSxvQkFBRixFQUF3QndNLEdBQXhCLENBQTRCLFFBQTVCLEVBQXNDLE1BQXRDO0FBQ0F4TSxNQUFFLGlCQUFGLEVBQXFCd00sR0FBckIsQ0FBeUIsU0FBekIsRUFBb0MsTUFBcEM7QUFDSCxDQUhEOzs7QUNDQXhNLEVBQUU5RCxNQUFGLEVBQVU2SyxJQUFWLENBQWUsaUNBQWYsRUFBa0QsWUFBWTtBQUMzRCxPQUFJZzBCLFNBQVMvNkIsRUFBRSxtQkFBRixDQUFiO0FBQ0EsT0FBSWc3QixNQUFNRCxPQUFPbHhCLFFBQVAsRUFBVjtBQUNBLE9BQUloQixTQUFTN0ksRUFBRTlELE1BQUYsRUFBVTJNLE1BQVYsRUFBYjtBQUNBQSxZQUFTQSxTQUFTbXlCLElBQUl6eUIsR0FBdEI7QUFDQU0sWUFBU0EsU0FBU2t5QixPQUFPbHlCLE1BQVAsRUFBVCxHQUEwQixDQUFuQzs7QUFFQSxZQUFTb3lCLFlBQVQsR0FBd0I7QUFDdEJGLGFBQU92dUIsR0FBUCxDQUFXO0FBQ1AsdUJBQWMzRCxTQUFTO0FBRGhCLE9BQVg7QUFHRDs7QUFFRCxPQUFJQSxTQUFTLENBQWIsRUFBZ0I7QUFDZG95QjtBQUNEO0FBQ0gsQ0FoQkQ7OztBQ0RBajdCLEVBQUViLFFBQUYsRUFBWXM2QixLQUFaLENBQWtCLFlBQVc7QUFDekJ6NUIsTUFBRSx3Q0FBRixFQUE0Q2dRLFFBQTVDLENBQXFELGdCQUFyRDtBQUNILENBRkQiLCJmaWxlIjoiZm91bmRhdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIndpbmRvdy53aGF0SW5wdXQgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgLypcclxuICAgIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgdmFyaWFibGVzXHJcbiAgICAtLS0tLS0tLS0tLS0tLS1cclxuICAqL1xyXG5cclxuICAvLyBhcnJheSBvZiBhY3RpdmVseSBwcmVzc2VkIGtleXNcclxuICB2YXIgYWN0aXZlS2V5cyA9IFtdO1xyXG5cclxuICAvLyBjYWNoZSBkb2N1bWVudC5ib2R5XHJcbiAgdmFyIGJvZHk7XHJcblxyXG4gIC8vIGJvb2xlYW46IHRydWUgaWYgdG91Y2ggYnVmZmVyIHRpbWVyIGlzIHJ1bm5pbmdcclxuICB2YXIgYnVmZmVyID0gZmFsc2U7XHJcblxyXG4gIC8vIHRoZSBsYXN0IHVzZWQgaW5wdXQgdHlwZVxyXG4gIHZhciBjdXJyZW50SW5wdXQgPSBudWxsO1xyXG5cclxuICAvLyBgaW5wdXRgIHR5cGVzIHRoYXQgZG9uJ3QgYWNjZXB0IHRleHRcclxuICB2YXIgbm9uVHlwaW5nSW5wdXRzID0gW1xyXG4gICAgJ2J1dHRvbicsXHJcbiAgICAnY2hlY2tib3gnLFxyXG4gICAgJ2ZpbGUnLFxyXG4gICAgJ2ltYWdlJyxcclxuICAgICdyYWRpbycsXHJcbiAgICAncmVzZXQnLFxyXG4gICAgJ3N1Ym1pdCdcclxuICBdO1xyXG5cclxuICAvLyBkZXRlY3QgdmVyc2lvbiBvZiBtb3VzZSB3aGVlbCBldmVudCB0byB1c2VcclxuICAvLyB2aWEgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvRXZlbnRzL3doZWVsXHJcbiAgdmFyIG1vdXNlV2hlZWwgPSBkZXRlY3RXaGVlbCgpO1xyXG5cclxuICAvLyBsaXN0IG9mIG1vZGlmaWVyIGtleXMgY29tbW9ubHkgdXNlZCB3aXRoIHRoZSBtb3VzZSBhbmRcclxuICAvLyBjYW4gYmUgc2FmZWx5IGlnbm9yZWQgdG8gcHJldmVudCBmYWxzZSBrZXlib2FyZCBkZXRlY3Rpb25cclxuICB2YXIgaWdub3JlTWFwID0gW1xyXG4gICAgMTYsIC8vIHNoaWZ0XHJcbiAgICAxNywgLy8gY29udHJvbFxyXG4gICAgMTgsIC8vIGFsdFxyXG4gICAgOTEsIC8vIFdpbmRvd3Mga2V5IC8gbGVmdCBBcHBsZSBjbWRcclxuICAgIDkzICAvLyBXaW5kb3dzIG1lbnUgLyByaWdodCBBcHBsZSBjbWRcclxuICBdO1xyXG5cclxuICAvLyBtYXBwaW5nIG9mIGV2ZW50cyB0byBpbnB1dCB0eXBlc1xyXG4gIHZhciBpbnB1dE1hcCA9IHtcclxuICAgICdrZXlkb3duJzogJ2tleWJvYXJkJyxcclxuICAgICdrZXl1cCc6ICdrZXlib2FyZCcsXHJcbiAgICAnbW91c2Vkb3duJzogJ21vdXNlJyxcclxuICAgICdtb3VzZW1vdmUnOiAnbW91c2UnLFxyXG4gICAgJ01TUG9pbnRlckRvd24nOiAncG9pbnRlcicsXHJcbiAgICAnTVNQb2ludGVyTW92ZSc6ICdwb2ludGVyJyxcclxuICAgICdwb2ludGVyZG93bic6ICdwb2ludGVyJyxcclxuICAgICdwb2ludGVybW92ZSc6ICdwb2ludGVyJyxcclxuICAgICd0b3VjaHN0YXJ0JzogJ3RvdWNoJ1xyXG4gIH07XHJcblxyXG4gIC8vIGFkZCBjb3JyZWN0IG1vdXNlIHdoZWVsIGV2ZW50IG1hcHBpbmcgdG8gYGlucHV0TWFwYFxyXG4gIGlucHV0TWFwW2RldGVjdFdoZWVsKCldID0gJ21vdXNlJztcclxuXHJcbiAgLy8gYXJyYXkgb2YgYWxsIHVzZWQgaW5wdXQgdHlwZXNcclxuICB2YXIgaW5wdXRUeXBlcyA9IFtdO1xyXG5cclxuICAvLyBtYXBwaW5nIG9mIGtleSBjb2RlcyB0byBhIGNvbW1vbiBuYW1lXHJcbiAgdmFyIGtleU1hcCA9IHtcclxuICAgIDk6ICd0YWInLFxyXG4gICAgMTM6ICdlbnRlcicsXHJcbiAgICAxNjogJ3NoaWZ0JyxcclxuICAgIDI3OiAnZXNjJyxcclxuICAgIDMyOiAnc3BhY2UnLFxyXG4gICAgMzc6ICdsZWZ0JyxcclxuICAgIDM4OiAndXAnLFxyXG4gICAgMzk6ICdyaWdodCcsXHJcbiAgICA0MDogJ2Rvd24nXHJcbiAgfTtcclxuXHJcbiAgLy8gbWFwIG9mIElFIDEwIHBvaW50ZXIgZXZlbnRzXHJcbiAgdmFyIHBvaW50ZXJNYXAgPSB7XHJcbiAgICAyOiAndG91Y2gnLFxyXG4gICAgMzogJ3RvdWNoJywgLy8gdHJlYXQgcGVuIGxpa2UgdG91Y2hcclxuICAgIDQ6ICdtb3VzZSdcclxuICB9O1xyXG5cclxuICAvLyB0b3VjaCBidWZmZXIgdGltZXJcclxuICB2YXIgdGltZXI7XHJcblxyXG5cclxuICAvKlxyXG4gICAgLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBmdW5jdGlvbnNcclxuICAgIC0tLS0tLS0tLS0tLS0tLVxyXG4gICovXHJcblxyXG4gIC8vIGFsbG93cyBldmVudHMgdGhhdCBhcmUgYWxzbyB0cmlnZ2VyZWQgdG8gYmUgZmlsdGVyZWQgb3V0IGZvciBgdG91Y2hzdGFydGBcclxuICBmdW5jdGlvbiBldmVudEJ1ZmZlcigpIHtcclxuICAgIGNsZWFyVGltZXIoKTtcclxuICAgIHNldElucHV0KGV2ZW50KTtcclxuXHJcbiAgICBidWZmZXIgPSB0cnVlO1xyXG4gICAgdGltZXIgPSB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgYnVmZmVyID0gZmFsc2U7XHJcbiAgICB9LCA2NTApO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gYnVmZmVyZWRFdmVudChldmVudCkge1xyXG4gICAgaWYgKCFidWZmZXIpIHNldElucHV0KGV2ZW50KTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHVuQnVmZmVyZWRFdmVudChldmVudCkge1xyXG4gICAgY2xlYXJUaW1lcigpO1xyXG4gICAgc2V0SW5wdXQoZXZlbnQpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY2xlYXJUaW1lcigpIHtcclxuICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGltZXIpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gc2V0SW5wdXQoZXZlbnQpIHtcclxuICAgIHZhciBldmVudEtleSA9IGtleShldmVudCk7XHJcbiAgICB2YXIgdmFsdWUgPSBpbnB1dE1hcFtldmVudC50eXBlXTtcclxuICAgIGlmICh2YWx1ZSA9PT0gJ3BvaW50ZXInKSB2YWx1ZSA9IHBvaW50ZXJUeXBlKGV2ZW50KTtcclxuXHJcbiAgICAvLyBkb24ndCBkbyBhbnl0aGluZyBpZiB0aGUgdmFsdWUgbWF0Y2hlcyB0aGUgaW5wdXQgdHlwZSBhbHJlYWR5IHNldFxyXG4gICAgaWYgKGN1cnJlbnRJbnB1dCAhPT0gdmFsdWUpIHtcclxuICAgICAgdmFyIGV2ZW50VGFyZ2V0ID0gdGFyZ2V0KGV2ZW50KTtcclxuICAgICAgdmFyIGV2ZW50VGFyZ2V0Tm9kZSA9IGV2ZW50VGFyZ2V0Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgIHZhciBldmVudFRhcmdldFR5cGUgPSAoZXZlbnRUYXJnZXROb2RlID09PSAnaW5wdXQnKSA/IGV2ZW50VGFyZ2V0LmdldEF0dHJpYnV0ZSgndHlwZScpIDogbnVsbDtcclxuXHJcbiAgICAgIGlmIChcclxuICAgICAgICAoLy8gb25seSBpZiB0aGUgdXNlciBmbGFnIHRvIGFsbG93IHR5cGluZyBpbiBmb3JtIGZpZWxkcyBpc24ndCBzZXRcclxuICAgICAgICAhYm9keS5oYXNBdHRyaWJ1dGUoJ2RhdGEtd2hhdGlucHV0LWZvcm10eXBpbmcnKSAmJlxyXG5cclxuICAgICAgICAvLyBvbmx5IGlmIGN1cnJlbnRJbnB1dCBoYXMgYSB2YWx1ZVxyXG4gICAgICAgIGN1cnJlbnRJbnB1dCAmJlxyXG5cclxuICAgICAgICAvLyBvbmx5IGlmIHRoZSBpbnB1dCBpcyBga2V5Ym9hcmRgXHJcbiAgICAgICAgdmFsdWUgPT09ICdrZXlib2FyZCcgJiZcclxuXHJcbiAgICAgICAgLy8gbm90IGlmIHRoZSBrZXkgaXMgYFRBQmBcclxuICAgICAgICBrZXlNYXBbZXZlbnRLZXldICE9PSAndGFiJyAmJlxyXG5cclxuICAgICAgICAvLyBvbmx5IGlmIHRoZSB0YXJnZXQgaXMgYSBmb3JtIGlucHV0IHRoYXQgYWNjZXB0cyB0ZXh0XHJcbiAgICAgICAgKFxyXG4gICAgICAgICAgIGV2ZW50VGFyZ2V0Tm9kZSA9PT0gJ3RleHRhcmVhJyB8fFxyXG4gICAgICAgICAgIGV2ZW50VGFyZ2V0Tm9kZSA9PT0gJ3NlbGVjdCcgfHxcclxuICAgICAgICAgICAoZXZlbnRUYXJnZXROb2RlID09PSAnaW5wdXQnICYmIG5vblR5cGluZ0lucHV0cy5pbmRleE9mKGV2ZW50VGFyZ2V0VHlwZSkgPCAwKVxyXG4gICAgICAgICkpIHx8IChcclxuICAgICAgICAgIC8vIGlnbm9yZSBtb2RpZmllciBrZXlzXHJcbiAgICAgICAgICBpZ25vcmVNYXAuaW5kZXhPZihldmVudEtleSkgPiAtMVxyXG4gICAgICAgIClcclxuICAgICAgKSB7XHJcbiAgICAgICAgLy8gaWdub3JlIGtleWJvYXJkIHR5cGluZ1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHN3aXRjaElucHV0KHZhbHVlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh2YWx1ZSA9PT0gJ2tleWJvYXJkJykgbG9nS2V5cyhldmVudEtleSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBzd2l0Y2hJbnB1dChzdHJpbmcpIHtcclxuICAgIGN1cnJlbnRJbnB1dCA9IHN0cmluZztcclxuICAgIGJvZHkuc2V0QXR0cmlidXRlKCdkYXRhLXdoYXRpbnB1dCcsIGN1cnJlbnRJbnB1dCk7XHJcblxyXG4gICAgaWYgKGlucHV0VHlwZXMuaW5kZXhPZihjdXJyZW50SW5wdXQpID09PSAtMSkgaW5wdXRUeXBlcy5wdXNoKGN1cnJlbnRJbnB1dCk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBrZXkoZXZlbnQpIHtcclxuICAgIHJldHVybiAoZXZlbnQua2V5Q29kZSkgPyBldmVudC5rZXlDb2RlIDogZXZlbnQud2hpY2g7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB0YXJnZXQoZXZlbnQpIHtcclxuICAgIHJldHVybiBldmVudC50YXJnZXQgfHwgZXZlbnQuc3JjRWxlbWVudDtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHBvaW50ZXJUeXBlKGV2ZW50KSB7XHJcbiAgICBpZiAodHlwZW9mIGV2ZW50LnBvaW50ZXJUeXBlID09PSAnbnVtYmVyJykge1xyXG4gICAgICByZXR1cm4gcG9pbnRlck1hcFtldmVudC5wb2ludGVyVHlwZV07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gKGV2ZW50LnBvaW50ZXJUeXBlID09PSAncGVuJykgPyAndG91Y2gnIDogZXZlbnQucG9pbnRlclR5cGU7IC8vIHRyZWF0IHBlbiBsaWtlIHRvdWNoXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBrZXlib2FyZCBsb2dnaW5nXHJcbiAgZnVuY3Rpb24gbG9nS2V5cyhldmVudEtleSkge1xyXG4gICAgaWYgKGFjdGl2ZUtleXMuaW5kZXhPZihrZXlNYXBbZXZlbnRLZXldKSA9PT0gLTEgJiYga2V5TWFwW2V2ZW50S2V5XSkgYWN0aXZlS2V5cy5wdXNoKGtleU1hcFtldmVudEtleV0pO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdW5Mb2dLZXlzKGV2ZW50KSB7XHJcbiAgICB2YXIgZXZlbnRLZXkgPSBrZXkoZXZlbnQpO1xyXG4gICAgdmFyIGFycmF5UG9zID0gYWN0aXZlS2V5cy5pbmRleE9mKGtleU1hcFtldmVudEtleV0pO1xyXG5cclxuICAgIGlmIChhcnJheVBvcyAhPT0gLTEpIGFjdGl2ZUtleXMuc3BsaWNlKGFycmF5UG9zLCAxKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGJpbmRFdmVudHMoKSB7XHJcbiAgICBib2R5ID0gZG9jdW1lbnQuYm9keTtcclxuXHJcbiAgICAvLyBwb2ludGVyIGV2ZW50cyAobW91c2UsIHBlbiwgdG91Y2gpXHJcbiAgICBpZiAod2luZG93LlBvaW50ZXJFdmVudCkge1xyXG4gICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgYnVmZmVyZWRFdmVudCk7XHJcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCBidWZmZXJlZEV2ZW50KTtcclxuICAgIH0gZWxzZSBpZiAod2luZG93Lk1TUG9pbnRlckV2ZW50KSB7XHJcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyRG93bicsIGJ1ZmZlcmVkRXZlbnQpO1xyXG4gICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlck1vdmUnLCBidWZmZXJlZEV2ZW50KTtcclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAvLyBtb3VzZSBldmVudHNcclxuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBidWZmZXJlZEV2ZW50KTtcclxuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBidWZmZXJlZEV2ZW50KTtcclxuXHJcbiAgICAgIC8vIHRvdWNoIGV2ZW50c1xyXG4gICAgICBpZiAoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KSB7XHJcbiAgICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgZXZlbnRCdWZmZXIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbW91c2Ugd2hlZWxcclxuICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcihtb3VzZVdoZWVsLCBidWZmZXJlZEV2ZW50KTtcclxuXHJcbiAgICAvLyBrZXlib2FyZCBldmVudHNcclxuICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHVuQnVmZmVyZWRFdmVudCk7XHJcbiAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdW5CdWZmZXJlZEV2ZW50KTtcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdW5Mb2dLZXlzKTtcclxuICB9XHJcblxyXG5cclxuICAvKlxyXG4gICAgLS0tLS0tLS0tLS0tLS0tXHJcbiAgICB1dGlsaXRpZXNcclxuICAgIC0tLS0tLS0tLS0tLS0tLVxyXG4gICovXHJcblxyXG4gIC8vIGRldGVjdCB2ZXJzaW9uIG9mIG1vdXNlIHdoZWVsIGV2ZW50IHRvIHVzZVxyXG4gIC8vIHZpYSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9FdmVudHMvd2hlZWxcclxuICBmdW5jdGlvbiBkZXRlY3RXaGVlbCgpIHtcclxuICAgIHJldHVybiBtb3VzZVdoZWVsID0gJ29ud2hlZWwnIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpID9cclxuICAgICAgJ3doZWVsJyA6IC8vIE1vZGVybiBicm93c2VycyBzdXBwb3J0IFwid2hlZWxcIlxyXG5cclxuICAgICAgZG9jdW1lbnQub25tb3VzZXdoZWVsICE9PSB1bmRlZmluZWQgP1xyXG4gICAgICAgICdtb3VzZXdoZWVsJyA6IC8vIFdlYmtpdCBhbmQgSUUgc3VwcG9ydCBhdCBsZWFzdCBcIm1vdXNld2hlZWxcIlxyXG4gICAgICAgICdET01Nb3VzZVNjcm9sbCc7IC8vIGxldCdzIGFzc3VtZSB0aGF0IHJlbWFpbmluZyBicm93c2VycyBhcmUgb2xkZXIgRmlyZWZveFxyXG4gIH1cclxuXHJcblxyXG4gIC8qXHJcbiAgICAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGluaXRcclxuXHJcbiAgICBkb24ndCBzdGFydCBzY3JpcHQgdW5sZXNzIGJyb3dzZXIgY3V0cyB0aGUgbXVzdGFyZCxcclxuICAgIGFsc28gcGFzc2VzIGlmIHBvbHlmaWxscyBhcmUgdXNlZFxyXG4gICAgLS0tLS0tLS0tLS0tLS0tXHJcbiAgKi9cclxuXHJcbiAgaWYgKFxyXG4gICAgJ2FkZEV2ZW50TGlzdGVuZXInIGluIHdpbmRvdyAmJlxyXG4gICAgQXJyYXkucHJvdG90eXBlLmluZGV4T2ZcclxuICApIHtcclxuXHJcbiAgICAvLyBpZiB0aGUgZG9tIGlzIGFscmVhZHkgcmVhZHkgYWxyZWFkeSAoc2NyaXB0IHdhcyBwbGFjZWQgYXQgYm90dG9tIG9mIDxib2R5PilcclxuICAgIGlmIChkb2N1bWVudC5ib2R5KSB7XHJcbiAgICAgIGJpbmRFdmVudHMoKTtcclxuXHJcbiAgICAvLyBvdGhlcndpc2Ugd2FpdCBmb3IgdGhlIGRvbSB0byBsb2FkIChzY3JpcHQgd2FzIHBsYWNlZCBpbiB0aGUgPGhlYWQ+KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGJpbmRFdmVudHMpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIC8qXHJcbiAgICAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGFwaVxyXG4gICAgLS0tLS0tLS0tLS0tLS0tXHJcbiAgKi9cclxuXHJcbiAgcmV0dXJuIHtcclxuXHJcbiAgICAvLyByZXR1cm5zIHN0cmluZzogdGhlIGN1cnJlbnQgaW5wdXQgdHlwZVxyXG4gICAgYXNrOiBmdW5jdGlvbigpIHsgcmV0dXJuIGN1cnJlbnRJbnB1dDsgfSxcclxuXHJcbiAgICAvLyByZXR1cm5zIGFycmF5OiBjdXJyZW50bHkgcHJlc3NlZCBrZXlzXHJcbiAgICBrZXlzOiBmdW5jdGlvbigpIHsgcmV0dXJuIGFjdGl2ZUtleXM7IH0sXHJcblxyXG4gICAgLy8gcmV0dXJucyBhcnJheTogYWxsIHRoZSBkZXRlY3RlZCBpbnB1dCB0eXBlc1xyXG4gICAgdHlwZXM6IGZ1bmN0aW9uKCkgeyByZXR1cm4gaW5wdXRUeXBlczsgfSxcclxuXHJcbiAgICAvLyBhY2NlcHRzIHN0cmluZzogbWFudWFsbHkgc2V0IHRoZSBpbnB1dCB0eXBlXHJcbiAgICBzZXQ6IHN3aXRjaElucHV0XHJcbiAgfTtcclxuXHJcbn0oKSk7XHJcbiIsIiFmdW5jdGlvbigkKSB7XHJcblxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBGT1VOREFUSU9OX1ZFUlNJT04gPSAnNi4yLjEnO1xyXG5cclxuLy8gR2xvYmFsIEZvdW5kYXRpb24gb2JqZWN0XHJcbi8vIFRoaXMgaXMgYXR0YWNoZWQgdG8gdGhlIHdpbmRvdywgb3IgdXNlZCBhcyBhIG1vZHVsZSBmb3IgQU1EL0Jyb3dzZXJpZnlcclxudmFyIEZvdW5kYXRpb24gPSB7XHJcbiAgdmVyc2lvbjogRk9VTkRBVElPTl9WRVJTSU9OLFxyXG5cclxuICAvKipcclxuICAgKiBTdG9yZXMgaW5pdGlhbGl6ZWQgcGx1Z2lucy5cclxuICAgKi9cclxuICBfcGx1Z2luczoge30sXHJcblxyXG4gIC8qKlxyXG4gICAqIFN0b3JlcyBnZW5lcmF0ZWQgdW5pcXVlIGlkcyBmb3IgcGx1Z2luIGluc3RhbmNlc1xyXG4gICAqL1xyXG4gIF91dWlkczogW10sXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBib29sZWFuIGZvciBSVEwgc3VwcG9ydFxyXG4gICAqL1xyXG4gIHJ0bDogZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiAkKCdodG1sJykuYXR0cignZGlyJykgPT09ICdydGwnO1xyXG4gIH0sXHJcbiAgLyoqXHJcbiAgICogRGVmaW5lcyBhIEZvdW5kYXRpb24gcGx1Z2luLCBhZGRpbmcgaXQgdG8gdGhlIGBGb3VuZGF0aW9uYCBuYW1lc3BhY2UgYW5kIHRoZSBsaXN0IG9mIHBsdWdpbnMgdG8gaW5pdGlhbGl6ZSB3aGVuIHJlZmxvd2luZy5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gVGhlIGNvbnN0cnVjdG9yIG9mIHRoZSBwbHVnaW4uXHJcbiAgICovXHJcbiAgcGx1Z2luOiBmdW5jdGlvbihwbHVnaW4sIG5hbWUpIHtcclxuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gYWRkaW5nIHRvIGdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxyXG4gICAgLy8gRXhhbXBsZXM6IEZvdW5kYXRpb24uUmV2ZWFsLCBGb3VuZGF0aW9uLk9mZkNhbnZhc1xyXG4gICAgdmFyIGNsYXNzTmFtZSA9IChuYW1lIHx8IGZ1bmN0aW9uTmFtZShwbHVnaW4pKTtcclxuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gc3RvcmluZyB0aGUgcGx1Z2luLCBhbHNvIHVzZWQgdG8gY3JlYXRlIHRoZSBpZGVudGlmeWluZyBkYXRhIGF0dHJpYnV0ZSBmb3IgdGhlIHBsdWdpblxyXG4gICAgLy8gRXhhbXBsZXM6IGRhdGEtcmV2ZWFsLCBkYXRhLW9mZi1jYW52YXNcclxuICAgIHZhciBhdHRyTmFtZSAgPSBoeXBoZW5hdGUoY2xhc3NOYW1lKTtcclxuXHJcbiAgICAvLyBBZGQgdG8gdGhlIEZvdW5kYXRpb24gb2JqZWN0IGFuZCB0aGUgcGx1Z2lucyBsaXN0IChmb3IgcmVmbG93aW5nKVxyXG4gICAgdGhpcy5fcGx1Z2luc1thdHRyTmFtZV0gPSB0aGlzW2NsYXNzTmFtZV0gPSBwbHVnaW47XHJcbiAgfSxcclxuICAvKipcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBQb3B1bGF0ZXMgdGhlIF91dWlkcyBhcnJheSB3aXRoIHBvaW50ZXJzIHRvIGVhY2ggaW5kaXZpZHVhbCBwbHVnaW4gaW5zdGFuY2UuXHJcbiAgICogQWRkcyB0aGUgYHpmUGx1Z2luYCBkYXRhLWF0dHJpYnV0ZSB0byBwcm9ncmFtbWF0aWNhbGx5IGNyZWF0ZWQgcGx1Z2lucyB0byBhbGxvdyB1c2Ugb2YgJChzZWxlY3RvcikuZm91bmRhdGlvbihtZXRob2QpIGNhbGxzLlxyXG4gICAqIEFsc28gZmlyZXMgdGhlIGluaXRpYWxpemF0aW9uIGV2ZW50IGZvciBlYWNoIHBsdWdpbiwgY29uc29saWRhdGluZyByZXBlZGl0aXZlIGNvZGUuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpbiAtIGFuIGluc3RhbmNlIG9mIGEgcGx1Z2luLCB1c3VhbGx5IGB0aGlzYCBpbiBjb250ZXh0LlxyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gdGhlIG5hbWUgb2YgdGhlIHBsdWdpbiwgcGFzc2VkIGFzIGEgY2FtZWxDYXNlZCBzdHJpbmcuXHJcbiAgICogQGZpcmVzIFBsdWdpbiNpbml0XHJcbiAgICovXHJcbiAgcmVnaXN0ZXJQbHVnaW46IGZ1bmN0aW9uKHBsdWdpbiwgbmFtZSl7XHJcbiAgICB2YXIgcGx1Z2luTmFtZSA9IG5hbWUgPyBoeXBoZW5hdGUobmFtZSkgOiBmdW5jdGlvbk5hbWUocGx1Z2luLmNvbnN0cnVjdG9yKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgcGx1Z2luLnV1aWQgPSB0aGlzLkdldFlvRGlnaXRzKDYsIHBsdWdpbk5hbWUpO1xyXG5cclxuICAgIGlmKCFwbHVnaW4uJGVsZW1lbnQuYXR0cihgZGF0YS0ke3BsdWdpbk5hbWV9YCkpeyBwbHVnaW4uJGVsZW1lbnQuYXR0cihgZGF0YS0ke3BsdWdpbk5hbWV9YCwgcGx1Z2luLnV1aWQpOyB9XHJcbiAgICBpZighcGx1Z2luLiRlbGVtZW50LmRhdGEoJ3pmUGx1Z2luJykpeyBwbHVnaW4uJGVsZW1lbnQuZGF0YSgnemZQbHVnaW4nLCBwbHVnaW4pOyB9XHJcbiAgICAgICAgICAvKipcclxuICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIHBsdWdpbiBoYXMgaW5pdGlhbGl6ZWQuXHJcbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2luaXRcclxuICAgICAgICAgICAqL1xyXG4gICAgcGx1Z2luLiRlbGVtZW50LnRyaWdnZXIoYGluaXQuemYuJHtwbHVnaW5OYW1lfWApO1xyXG5cclxuICAgIHRoaXMuX3V1aWRzLnB1c2gocGx1Z2luLnV1aWQpO1xyXG5cclxuICAgIHJldHVybjtcclxuICB9LFxyXG4gIC8qKlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIFJlbW92ZXMgdGhlIHBsdWdpbnMgdXVpZCBmcm9tIHRoZSBfdXVpZHMgYXJyYXkuXHJcbiAgICogUmVtb3ZlcyB0aGUgemZQbHVnaW4gZGF0YSBhdHRyaWJ1dGUsIGFzIHdlbGwgYXMgdGhlIGRhdGEtcGx1Z2luLW5hbWUgYXR0cmlidXRlLlxyXG4gICAqIEFsc28gZmlyZXMgdGhlIGRlc3Ryb3llZCBldmVudCBmb3IgdGhlIHBsdWdpbiwgY29uc29saWRhdGluZyByZXBlZGl0aXZlIGNvZGUuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpbiAtIGFuIGluc3RhbmNlIG9mIGEgcGx1Z2luLCB1c3VhbGx5IGB0aGlzYCBpbiBjb250ZXh0LlxyXG4gICAqIEBmaXJlcyBQbHVnaW4jZGVzdHJveWVkXHJcbiAgICovXHJcbiAgdW5yZWdpc3RlclBsdWdpbjogZnVuY3Rpb24ocGx1Z2luKXtcclxuICAgIHZhciBwbHVnaW5OYW1lID0gaHlwaGVuYXRlKGZ1bmN0aW9uTmFtZShwbHVnaW4uJGVsZW1lbnQuZGF0YSgnemZQbHVnaW4nKS5jb25zdHJ1Y3RvcikpO1xyXG5cclxuICAgIHRoaXMuX3V1aWRzLnNwbGljZSh0aGlzLl91dWlkcy5pbmRleE9mKHBsdWdpbi51dWlkKSwgMSk7XHJcbiAgICBwbHVnaW4uJGVsZW1lbnQucmVtb3ZlQXR0cihgZGF0YS0ke3BsdWdpbk5hbWV9YCkucmVtb3ZlRGF0YSgnemZQbHVnaW4nKVxyXG4gICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBwbHVnaW4gaGFzIGJlZW4gZGVzdHJveWVkLlxyXG4gICAgICAgICAgICogQGV2ZW50IFBsdWdpbiNkZXN0cm95ZWRcclxuICAgICAgICAgICAqL1xyXG4gICAgICAgICAgLnRyaWdnZXIoYGRlc3Ryb3llZC56Zi4ke3BsdWdpbk5hbWV9YCk7XHJcbiAgICBmb3IodmFyIHByb3AgaW4gcGx1Z2luKXtcclxuICAgICAgcGx1Z2luW3Byb3BdID0gbnVsbDsvL2NsZWFuIHVwIHNjcmlwdCB0byBwcmVwIGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXHJcbiAgICB9XHJcbiAgICByZXR1cm47XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQ2F1c2VzIG9uZSBvciBtb3JlIGFjdGl2ZSBwbHVnaW5zIHRvIHJlLWluaXRpYWxpemUsIHJlc2V0dGluZyBldmVudCBsaXN0ZW5lcnMsIHJlY2FsY3VsYXRpbmcgcG9zaXRpb25zLCBldGMuXHJcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBsdWdpbnMgLSBvcHRpb25hbCBzdHJpbmcgb2YgYW4gaW5kaXZpZHVhbCBwbHVnaW4ga2V5LCBhdHRhaW5lZCBieSBjYWxsaW5nIGAkKGVsZW1lbnQpLmRhdGEoJ3BsdWdpbk5hbWUnKWAsIG9yIHN0cmluZyBvZiBhIHBsdWdpbiBjbGFzcyBpLmUuIGAnZHJvcGRvd24nYFxyXG4gICAqIEBkZWZhdWx0IElmIG5vIGFyZ3VtZW50IGlzIHBhc3NlZCwgcmVmbG93IGFsbCBjdXJyZW50bHkgYWN0aXZlIHBsdWdpbnMuXHJcbiAgICovXHJcbiAgIHJlSW5pdDogZnVuY3Rpb24ocGx1Z2lucyl7XHJcbiAgICAgdmFyIGlzSlEgPSBwbHVnaW5zIGluc3RhbmNlb2YgJDtcclxuICAgICB0cnl7XHJcbiAgICAgICBpZihpc0pRKXtcclxuICAgICAgICAgcGx1Z2lucy5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgJCh0aGlzKS5kYXRhKCd6ZlBsdWdpbicpLl9pbml0KCk7XHJcbiAgICAgICAgIH0pO1xyXG4gICAgICAgfWVsc2V7XHJcbiAgICAgICAgIHZhciB0eXBlID0gdHlwZW9mIHBsdWdpbnMsXHJcbiAgICAgICAgIF90aGlzID0gdGhpcyxcclxuICAgICAgICAgZm5zID0ge1xyXG4gICAgICAgICAgICdvYmplY3QnOiBmdW5jdGlvbihwbGdzKXtcclxuICAgICAgICAgICAgIHBsZ3MuZm9yRWFjaChmdW5jdGlvbihwKXtcclxuICAgICAgICAgICAgICAgcCA9IGh5cGhlbmF0ZShwKTtcclxuICAgICAgICAgICAgICAgJCgnW2RhdGEtJysgcCArJ10nKS5mb3VuZGF0aW9uKCdfaW5pdCcpO1xyXG4gICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgfSxcclxuICAgICAgICAgICAnc3RyaW5nJzogZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgIHBsdWdpbnMgPSBoeXBoZW5hdGUocGx1Z2lucyk7XHJcbiAgICAgICAgICAgICAkKCdbZGF0YS0nKyBwbHVnaW5zICsnXScpLmZvdW5kYXRpb24oJ19pbml0Jyk7XHJcbiAgICAgICAgICAgfSxcclxuICAgICAgICAgICAndW5kZWZpbmVkJzogZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgIHRoaXNbJ29iamVjdCddKE9iamVjdC5rZXlzKF90aGlzLl9wbHVnaW5zKSk7XHJcbiAgICAgICAgICAgfVxyXG4gICAgICAgICB9O1xyXG4gICAgICAgICBmbnNbdHlwZV0ocGx1Z2lucyk7XHJcbiAgICAgICB9XHJcbiAgICAgfWNhdGNoKGVycil7XHJcbiAgICAgICBjb25zb2xlLmVycm9yKGVycik7XHJcbiAgICAgfWZpbmFsbHl7XHJcbiAgICAgICByZXR1cm4gcGx1Z2lucztcclxuICAgICB9XHJcbiAgIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIHJldHVybnMgYSByYW5kb20gYmFzZS0zNiB1aWQgd2l0aCBuYW1lc3BhY2luZ1xyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsZW5ndGggLSBudW1iZXIgb2YgcmFuZG9tIGJhc2UtMzYgZGlnaXRzIGRlc2lyZWQuIEluY3JlYXNlIGZvciBtb3JlIHJhbmRvbSBzdHJpbmdzLlxyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2UgLSBuYW1lIG9mIHBsdWdpbiB0byBiZSBpbmNvcnBvcmF0ZWQgaW4gdWlkLCBvcHRpb25hbC5cclxuICAgKiBAZGVmYXVsdCB7U3RyaW5nfSAnJyAtIGlmIG5vIHBsdWdpbiBuYW1lIGlzIHByb3ZpZGVkLCBub3RoaW5nIGlzIGFwcGVuZGVkIHRvIHRoZSB1aWQuXHJcbiAgICogQHJldHVybnMge1N0cmluZ30gLSB1bmlxdWUgaWRcclxuICAgKi9cclxuICBHZXRZb0RpZ2l0czogZnVuY3Rpb24obGVuZ3RoLCBuYW1lc3BhY2Upe1xyXG4gICAgbGVuZ3RoID0gbGVuZ3RoIHx8IDY7XHJcbiAgICByZXR1cm4gTWF0aC5yb3VuZCgoTWF0aC5wb3coMzYsIGxlbmd0aCArIDEpIC0gTWF0aC5yYW5kb20oKSAqIE1hdGgucG93KDM2LCBsZW5ndGgpKSkudG9TdHJpbmcoMzYpLnNsaWNlKDEpICsgKG5hbWVzcGFjZSA/IGAtJHtuYW1lc3BhY2V9YCA6ICcnKTtcclxuICB9LFxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemUgcGx1Z2lucyBvbiBhbnkgZWxlbWVudHMgd2l0aGluIGBlbGVtYCAoYW5kIGBlbGVtYCBpdHNlbGYpIHRoYXQgYXJlbid0IGFscmVhZHkgaW5pdGlhbGl6ZWQuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW0gLSBqUXVlcnkgb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGVsZW1lbnQgdG8gY2hlY2sgaW5zaWRlLiBBbHNvIGNoZWNrcyB0aGUgZWxlbWVudCBpdHNlbGYsIHVubGVzcyBpdCdzIHRoZSBgZG9jdW1lbnRgIG9iamVjdC5cclxuICAgKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gcGx1Z2lucyAtIEEgbGlzdCBvZiBwbHVnaW5zIHRvIGluaXRpYWxpemUuIExlYXZlIHRoaXMgb3V0IHRvIGluaXRpYWxpemUgZXZlcnl0aGluZy5cclxuICAgKi9cclxuICByZWZsb3c6IGZ1bmN0aW9uKGVsZW0sIHBsdWdpbnMpIHtcclxuXHJcbiAgICAvLyBJZiBwbHVnaW5zIGlzIHVuZGVmaW5lZCwganVzdCBncmFiIGV2ZXJ5dGhpbmdcclxuICAgIGlmICh0eXBlb2YgcGx1Z2lucyA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgcGx1Z2lucyA9IE9iamVjdC5rZXlzKHRoaXMuX3BsdWdpbnMpO1xyXG4gICAgfVxyXG4gICAgLy8gSWYgcGx1Z2lucyBpcyBhIHN0cmluZywgY29udmVydCBpdCB0byBhbiBhcnJheSB3aXRoIG9uZSBpdGVtXHJcbiAgICBlbHNlIGlmICh0eXBlb2YgcGx1Z2lucyA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgcGx1Z2lucyA9IFtwbHVnaW5zXTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHBsdWdpblxyXG4gICAgJC5lYWNoKHBsdWdpbnMsIGZ1bmN0aW9uKGksIG5hbWUpIHtcclxuICAgICAgLy8gR2V0IHRoZSBjdXJyZW50IHBsdWdpblxyXG4gICAgICB2YXIgcGx1Z2luID0gX3RoaXMuX3BsdWdpbnNbbmFtZV07XHJcblxyXG4gICAgICAvLyBMb2NhbGl6ZSB0aGUgc2VhcmNoIHRvIGFsbCBlbGVtZW50cyBpbnNpZGUgZWxlbSwgYXMgd2VsbCBhcyBlbGVtIGl0c2VsZiwgdW5sZXNzIGVsZW0gPT09IGRvY3VtZW50XHJcbiAgICAgIHZhciAkZWxlbSA9ICQoZWxlbSkuZmluZCgnW2RhdGEtJytuYW1lKyddJykuYWRkQmFjaygnW2RhdGEtJytuYW1lKyddJyk7XHJcblxyXG4gICAgICAvLyBGb3IgZWFjaCBwbHVnaW4gZm91bmQsIGluaXRpYWxpemUgaXRcclxuICAgICAgJGVsZW0uZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgJGVsID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgb3B0cyA9IHt9O1xyXG4gICAgICAgIC8vIERvbid0IGRvdWJsZS1kaXAgb24gcGx1Z2luc1xyXG4gICAgICAgIGlmICgkZWwuZGF0YSgnemZQbHVnaW4nKSkge1xyXG4gICAgICAgICAgY29uc29sZS53YXJuKFwiVHJpZWQgdG8gaW5pdGlhbGl6ZSBcIituYW1lK1wiIG9uIGFuIGVsZW1lbnQgdGhhdCBhbHJlYWR5IGhhcyBhIEZvdW5kYXRpb24gcGx1Z2luLlwiKTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKCRlbC5hdHRyKCdkYXRhLW9wdGlvbnMnKSl7XHJcbiAgICAgICAgICB2YXIgdGhpbmcgPSAkZWwuYXR0cignZGF0YS1vcHRpb25zJykuc3BsaXQoJzsnKS5mb3JFYWNoKGZ1bmN0aW9uKGUsIGkpe1xyXG4gICAgICAgICAgICB2YXIgb3B0ID0gZS5zcGxpdCgnOicpLm1hcChmdW5jdGlvbihlbCl7IHJldHVybiBlbC50cmltKCk7IH0pO1xyXG4gICAgICAgICAgICBpZihvcHRbMF0pIG9wdHNbb3B0WzBdXSA9IHBhcnNlVmFsdWUob3B0WzFdKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAkZWwuZGF0YSgnemZQbHVnaW4nLCBuZXcgcGx1Z2luKCQodGhpcyksIG9wdHMpKTtcclxuICAgICAgICB9Y2F0Y2goZXIpe1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcik7XHJcbiAgICAgICAgfWZpbmFsbHl7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0sXHJcbiAgZ2V0Rm5OYW1lOiBmdW5jdGlvbk5hbWUsXHJcbiAgdHJhbnNpdGlvbmVuZDogZnVuY3Rpb24oJGVsZW0pe1xyXG4gICAgdmFyIHRyYW5zaXRpb25zID0ge1xyXG4gICAgICAndHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcclxuICAgICAgJ1dlYmtpdFRyYW5zaXRpb24nOiAnd2Via2l0VHJhbnNpdGlvbkVuZCcsXHJcbiAgICAgICdNb3pUcmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxyXG4gICAgICAnT1RyYW5zaXRpb24nOiAnb3RyYW5zaXRpb25lbmQnXHJcbiAgICB9O1xyXG4gICAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcclxuICAgICAgICBlbmQ7XHJcblxyXG4gICAgZm9yICh2YXIgdCBpbiB0cmFuc2l0aW9ucyl7XHJcbiAgICAgIGlmICh0eXBlb2YgZWxlbS5zdHlsZVt0XSAhPT0gJ3VuZGVmaW5lZCcpe1xyXG4gICAgICAgIGVuZCA9IHRyYW5zaXRpb25zW3RdO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZihlbmQpe1xyXG4gICAgICByZXR1cm4gZW5kO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIGVuZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAkZWxlbS50cmlnZ2VySGFuZGxlcigndHJhbnNpdGlvbmVuZCcsIFskZWxlbV0pO1xyXG4gICAgICB9LCAxKTtcclxuICAgICAgcmV0dXJuICd0cmFuc2l0aW9uZW5kJztcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG5Gb3VuZGF0aW9uLnV0aWwgPSB7XHJcbiAgLyoqXHJcbiAgICogRnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgZGVib3VuY2UgZWZmZWN0IHRvIGEgZnVuY3Rpb24gY2FsbC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIC0gRnVuY3Rpb24gdG8gYmUgY2FsbGVkIGF0IGVuZCBvZiB0aW1lb3V0LlxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBkZWxheSAtIFRpbWUgaW4gbXMgdG8gZGVsYXkgdGhlIGNhbGwgb2YgYGZ1bmNgLlxyXG4gICAqIEByZXR1cm5zIGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgdGhyb3R0bGU6IGZ1bmN0aW9uIChmdW5jLCBkZWxheSkge1xyXG4gICAgdmFyIHRpbWVyID0gbnVsbDtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XHJcblxyXG4gICAgICBpZiAodGltZXIgPT09IG51bGwpIHtcclxuICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcclxuICAgICAgICAgIHRpbWVyID0gbnVsbDtcclxuICAgICAgICB9LCBkZWxheSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gVE9ETzogY29uc2lkZXIgbm90IG1ha2luZyB0aGlzIGEgalF1ZXJ5IGZ1bmN0aW9uXHJcbi8vIFRPRE86IG5lZWQgd2F5IHRvIHJlZmxvdyB2cy4gcmUtaW5pdGlhbGl6ZVxyXG4vKipcclxuICogVGhlIEZvdW5kYXRpb24galF1ZXJ5IG1ldGhvZC5cclxuICogQHBhcmFtIHtTdHJpbmd8QXJyYXl9IG1ldGhvZCAtIEFuIGFjdGlvbiB0byBwZXJmb3JtIG9uIHRoZSBjdXJyZW50IGpRdWVyeSBvYmplY3QuXHJcbiAqL1xyXG52YXIgZm91bmRhdGlvbiA9IGZ1bmN0aW9uKG1ldGhvZCkge1xyXG4gIHZhciB0eXBlID0gdHlwZW9mIG1ldGhvZCxcclxuICAgICAgJG1ldGEgPSAkKCdtZXRhLmZvdW5kYXRpb24tbXEnKSxcclxuICAgICAgJG5vSlMgPSAkKCcubm8tanMnKTtcclxuXHJcbiAgaWYoISRtZXRhLmxlbmd0aCl7XHJcbiAgICAkKCc8bWV0YSBjbGFzcz1cImZvdW5kYXRpb24tbXFcIj4nKS5hcHBlbmRUbyhkb2N1bWVudC5oZWFkKTtcclxuICB9XHJcbiAgaWYoJG5vSlMubGVuZ3RoKXtcclxuICAgICRub0pTLnJlbW92ZUNsYXNzKCduby1qcycpO1xyXG4gIH1cclxuXHJcbiAgaWYodHlwZSA9PT0gJ3VuZGVmaW5lZCcpey8vbmVlZHMgdG8gaW5pdGlhbGl6ZSB0aGUgRm91bmRhdGlvbiBvYmplY3QsIG9yIGFuIGluZGl2aWR1YWwgcGx1Z2luLlxyXG4gICAgRm91bmRhdGlvbi5NZWRpYVF1ZXJ5Ll9pbml0KCk7XHJcbiAgICBGb3VuZGF0aW9uLnJlZmxvdyh0aGlzKTtcclxuICB9ZWxzZSBpZih0eXBlID09PSAnc3RyaW5nJyl7Ly9hbiBpbmRpdmlkdWFsIG1ldGhvZCB0byBpbnZva2Ugb24gYSBwbHVnaW4gb3IgZ3JvdXAgb2YgcGx1Z2luc1xyXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpOy8vY29sbGVjdCBhbGwgdGhlIGFyZ3VtZW50cywgaWYgbmVjZXNzYXJ5XHJcbiAgICB2YXIgcGx1Z0NsYXNzID0gdGhpcy5kYXRhKCd6ZlBsdWdpbicpOy8vZGV0ZXJtaW5lIHRoZSBjbGFzcyBvZiBwbHVnaW5cclxuXHJcbiAgICBpZihwbHVnQ2xhc3MgIT09IHVuZGVmaW5lZCAmJiBwbHVnQ2xhc3NbbWV0aG9kXSAhPT0gdW5kZWZpbmVkKXsvL21ha2Ugc3VyZSBib3RoIHRoZSBjbGFzcyBhbmQgbWV0aG9kIGV4aXN0XHJcbiAgICAgIGlmKHRoaXMubGVuZ3RoID09PSAxKXsvL2lmIHRoZXJlJ3Mgb25seSBvbmUsIGNhbGwgaXQgZGlyZWN0bHkuXHJcbiAgICAgICAgICBwbHVnQ2xhc3NbbWV0aG9kXS5hcHBseShwbHVnQ2xhc3MsIGFyZ3MpO1xyXG4gICAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSwgZWwpey8vb3RoZXJ3aXNlIGxvb3AgdGhyb3VnaCB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24gYW5kIGludm9rZSB0aGUgbWV0aG9kIG9uIGVhY2hcclxuICAgICAgICAgIHBsdWdDbGFzc1ttZXRob2RdLmFwcGx5KCQoZWwpLmRhdGEoJ3pmUGx1Z2luJyksIGFyZ3MpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9ZWxzZXsvL2Vycm9yIGZvciBubyBjbGFzcyBvciBubyBtZXRob2RcclxuICAgICAgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwiV2UncmUgc29ycnksICdcIiArIG1ldGhvZCArIFwiJyBpcyBub3QgYW4gYXZhaWxhYmxlIG1ldGhvZCBmb3IgXCIgKyAocGx1Z0NsYXNzID8gZnVuY3Rpb25OYW1lKHBsdWdDbGFzcykgOiAndGhpcyBlbGVtZW50JykgKyAnLicpO1xyXG4gICAgfVxyXG4gIH1lbHNley8vZXJyb3IgZm9yIGludmFsaWQgYXJndW1lbnQgdHlwZVxyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgV2UncmUgc29ycnksICR7dHlwZX0gaXMgbm90IGEgdmFsaWQgcGFyYW1ldGVyLiBZb3UgbXVzdCB1c2UgYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBtZXRob2QgeW91IHdpc2ggdG8gaW52b2tlLmApO1xyXG4gIH1cclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbndpbmRvdy5Gb3VuZGF0aW9uID0gRm91bmRhdGlvbjtcclxuJC5mbi5mb3VuZGF0aW9uID0gZm91bmRhdGlvbjtcclxuXHJcbi8vIFBvbHlmaWxsIGZvciByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcclxuKGZ1bmN0aW9uKCkge1xyXG4gIGlmICghRGF0ZS5ub3cgfHwgIXdpbmRvdy5EYXRlLm5vdylcclxuICAgIHdpbmRvdy5EYXRlLm5vdyA9IERhdGUubm93ID0gZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgfTtcclxuXHJcbiAgdmFyIHZlbmRvcnMgPSBbJ3dlYmtpdCcsICdtb3onXTtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IHZlbmRvcnMubGVuZ3RoICYmICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lOyArK2kpIHtcclxuICAgICAgdmFyIHZwID0gdmVuZG9yc1tpXTtcclxuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2cCsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XHJcbiAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9ICh3aW5kb3dbdnArJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ11cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgd2luZG93W3ZwKydDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXSk7XHJcbiAgfVxyXG4gIGlmICgvaVAoYWR8aG9uZXxvZCkuKk9TIDYvLnRlc3Qod2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpXHJcbiAgICB8fCAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCAhd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKSB7XHJcbiAgICB2YXIgbGFzdFRpbWUgPSAwO1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KCk7XHJcbiAgICAgICAgdmFyIG5leHRUaW1lID0gTWF0aC5tYXgobGFzdFRpbWUgKyAxNiwgbm93KTtcclxuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2sobGFzdFRpbWUgPSBuZXh0VGltZSk7IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFRpbWUgLSBub3cpO1xyXG4gICAgfTtcclxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGNsZWFyVGltZW91dDtcclxuICB9XHJcbiAgLyoqXHJcbiAgICogUG9seWZpbGwgZm9yIHBlcmZvcm1hbmNlLm5vdywgcmVxdWlyZWQgYnkgckFGXHJcbiAgICovXHJcbiAgaWYoIXdpbmRvdy5wZXJmb3JtYW5jZSB8fCAhd2luZG93LnBlcmZvcm1hbmNlLm5vdyl7XHJcbiAgICB3aW5kb3cucGVyZm9ybWFuY2UgPSB7XHJcbiAgICAgIHN0YXJ0OiBEYXRlLm5vdygpLFxyXG4gICAgICBub3c6IGZ1bmN0aW9uKCl7IHJldHVybiBEYXRlLm5vdygpIC0gdGhpcy5zdGFydDsgfVxyXG4gICAgfTtcclxuICB9XHJcbn0pKCk7XHJcbmlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcclxuICBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uKG9UaGlzKSB7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgLy8gY2xvc2VzdCB0aGluZyBwb3NzaWJsZSB0byB0aGUgRUNNQVNjcmlwdCA1XHJcbiAgICAgIC8vIGludGVybmFsIElzQ2FsbGFibGUgZnVuY3Rpb25cclxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgLSB3aGF0IGlzIHRyeWluZyB0byBiZSBib3VuZCBpcyBub3QgY2FsbGFibGUnKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgYUFyZ3MgICA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksXHJcbiAgICAgICAgZlRvQmluZCA9IHRoaXMsXHJcbiAgICAgICAgZk5PUCAgICA9IGZ1bmN0aW9uKCkge30sXHJcbiAgICAgICAgZkJvdW5kICA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIGZUb0JpbmQuYXBwbHkodGhpcyBpbnN0YW5jZW9mIGZOT1BcclxuICAgICAgICAgICAgICAgICA/IHRoaXNcclxuICAgICAgICAgICAgICAgICA6IG9UaGlzLFxyXG4gICAgICAgICAgICAgICAgIGFBcmdzLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICBpZiAodGhpcy5wcm90b3R5cGUpIHtcclxuICAgICAgLy8gbmF0aXZlIGZ1bmN0aW9ucyBkb24ndCBoYXZlIGEgcHJvdG90eXBlXHJcbiAgICAgIGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XHJcbiAgICB9XHJcbiAgICBmQm91bmQucHJvdG90eXBlID0gbmV3IGZOT1AoKTtcclxuXHJcbiAgICByZXR1cm4gZkJvdW5kO1xyXG4gIH07XHJcbn1cclxuLy8gUG9seWZpbGwgdG8gZ2V0IHRoZSBuYW1lIG9mIGEgZnVuY3Rpb24gaW4gSUU5XHJcbmZ1bmN0aW9uIGZ1bmN0aW9uTmFtZShmbikge1xyXG4gIGlmIChGdW5jdGlvbi5wcm90b3R5cGUubmFtZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICB2YXIgZnVuY05hbWVSZWdleCA9IC9mdW5jdGlvblxccyhbXihdezEsfSlcXCgvO1xyXG4gICAgdmFyIHJlc3VsdHMgPSAoZnVuY05hbWVSZWdleCkuZXhlYygoZm4pLnRvU3RyaW5nKCkpO1xyXG4gICAgcmV0dXJuIChyZXN1bHRzICYmIHJlc3VsdHMubGVuZ3RoID4gMSkgPyByZXN1bHRzWzFdLnRyaW0oKSA6IFwiXCI7XHJcbiAgfVxyXG4gIGVsc2UgaWYgKGZuLnByb3RvdHlwZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gZm4uY29uc3RydWN0b3IubmFtZTtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICByZXR1cm4gZm4ucHJvdG90eXBlLmNvbnN0cnVjdG9yLm5hbWU7XHJcbiAgfVxyXG59XHJcbmZ1bmN0aW9uIHBhcnNlVmFsdWUoc3RyKXtcclxuICBpZigvdHJ1ZS8udGVzdChzdHIpKSByZXR1cm4gdHJ1ZTtcclxuICBlbHNlIGlmKC9mYWxzZS8udGVzdChzdHIpKSByZXR1cm4gZmFsc2U7XHJcbiAgZWxzZSBpZighaXNOYU4oc3RyICogMSkpIHJldHVybiBwYXJzZUZsb2F0KHN0cik7XHJcbiAgcmV0dXJuIHN0cjtcclxufVxyXG4vLyBDb252ZXJ0IFBhc2NhbENhc2UgdG8ga2ViYWItY2FzZVxyXG4vLyBUaGFuayB5b3U6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzg5NTU1ODBcclxuZnVuY3Rpb24gaHlwaGVuYXRlKHN0cikge1xyXG4gIHJldHVybiBzdHIucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcclxufVxyXG5cclxufShqUXVlcnkpO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4hZnVuY3Rpb24oJCkge1xyXG5cclxuRm91bmRhdGlvbi5Cb3ggPSB7XHJcbiAgSW1Ob3RUb3VjaGluZ1lvdTogSW1Ob3RUb3VjaGluZ1lvdSxcclxuICBHZXREaW1lbnNpb25zOiBHZXREaW1lbnNpb25zLFxyXG4gIEdldE9mZnNldHM6IEdldE9mZnNldHNcclxufVxyXG5cclxuLyoqXHJcbiAqIENvbXBhcmVzIHRoZSBkaW1lbnNpb25zIG9mIGFuIGVsZW1lbnQgdG8gYSBjb250YWluZXIgYW5kIGRldGVybWluZXMgY29sbGlzaW9uIGV2ZW50cyB3aXRoIGNvbnRhaW5lci5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byB0ZXN0IGZvciBjb2xsaXNpb25zLlxyXG4gKiBAcGFyYW0ge2pRdWVyeX0gcGFyZW50IC0galF1ZXJ5IG9iamVjdCB0byB1c2UgYXMgYm91bmRpbmcgY29udGFpbmVyLlxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGxyT25seSAtIHNldCB0byB0cnVlIHRvIGNoZWNrIGxlZnQgYW5kIHJpZ2h0IHZhbHVlcyBvbmx5LlxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHRiT25seSAtIHNldCB0byB0cnVlIHRvIGNoZWNrIHRvcCBhbmQgYm90dG9tIHZhbHVlcyBvbmx5LlxyXG4gKiBAZGVmYXVsdCBpZiBubyBwYXJlbnQgb2JqZWN0IHBhc3NlZCwgZGV0ZWN0cyBjb2xsaXNpb25zIHdpdGggYHdpbmRvd2AuXHJcbiAqIEByZXR1cm5zIHtCb29sZWFufSAtIHRydWUgaWYgY29sbGlzaW9uIGZyZWUsIGZhbHNlIGlmIGEgY29sbGlzaW9uIGluIGFueSBkaXJlY3Rpb24uXHJcbiAqL1xyXG5mdW5jdGlvbiBJbU5vdFRvdWNoaW5nWW91KGVsZW1lbnQsIHBhcmVudCwgbHJPbmx5LCB0Yk9ubHkpIHtcclxuICB2YXIgZWxlRGltcyA9IEdldERpbWVuc2lvbnMoZWxlbWVudCksXHJcbiAgICAgIHRvcCwgYm90dG9tLCBsZWZ0LCByaWdodDtcclxuXHJcbiAgaWYgKHBhcmVudCkge1xyXG4gICAgdmFyIHBhckRpbXMgPSBHZXREaW1lbnNpb25zKHBhcmVudCk7XHJcblxyXG4gICAgYm90dG9tID0gKGVsZURpbXMub2Zmc2V0LnRvcCArIGVsZURpbXMuaGVpZ2h0IDw9IHBhckRpbXMuaGVpZ2h0ICsgcGFyRGltcy5vZmZzZXQudG9wKTtcclxuICAgIHRvcCAgICA9IChlbGVEaW1zLm9mZnNldC50b3AgPj0gcGFyRGltcy5vZmZzZXQudG9wKTtcclxuICAgIGxlZnQgICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ID49IHBhckRpbXMub2Zmc2V0LmxlZnQpO1xyXG4gICAgcmlnaHQgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgKyBlbGVEaW1zLndpZHRoIDw9IHBhckRpbXMud2lkdGgpO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGJvdHRvbSA9IChlbGVEaW1zLm9mZnNldC50b3AgKyBlbGVEaW1zLmhlaWdodCA8PSBlbGVEaW1zLndpbmRvd0RpbXMuaGVpZ2h0ICsgZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3ApO1xyXG4gICAgdG9wICAgID0gKGVsZURpbXMub2Zmc2V0LnRvcCA+PSBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCk7XHJcbiAgICBsZWZ0ICAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCA+PSBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LmxlZnQpO1xyXG4gICAgcmlnaHQgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgKyBlbGVEaW1zLndpZHRoIDw9IGVsZURpbXMud2luZG93RGltcy53aWR0aCk7XHJcbiAgfVxyXG5cclxuICB2YXIgYWxsRGlycyA9IFtib3R0b20sIHRvcCwgbGVmdCwgcmlnaHRdO1xyXG5cclxuICBpZiAobHJPbmx5KSB7XHJcbiAgICByZXR1cm4gbGVmdCA9PT0gcmlnaHQgPT09IHRydWU7XHJcbiAgfVxyXG5cclxuICBpZiAodGJPbmx5KSB7XHJcbiAgICByZXR1cm4gdG9wID09PSBib3R0b20gPT09IHRydWU7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gYWxsRGlycy5pbmRleE9mKGZhbHNlKSA9PT0gLTE7XHJcbn07XHJcblxyXG4vKipcclxuICogVXNlcyBuYXRpdmUgbWV0aG9kcyB0byByZXR1cm4gYW4gb2JqZWN0IG9mIGRpbWVuc2lvbiB2YWx1ZXMuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge2pRdWVyeSB8fCBIVE1MfSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCBvciBET00gZWxlbWVudCBmb3Igd2hpY2ggdG8gZ2V0IHRoZSBkaW1lbnNpb25zLiBDYW4gYmUgYW55IGVsZW1lbnQgb3RoZXIgdGhhdCBkb2N1bWVudCBvciB3aW5kb3cuXHJcbiAqIEByZXR1cm5zIHtPYmplY3R9IC0gbmVzdGVkIG9iamVjdCBvZiBpbnRlZ2VyIHBpeGVsIHZhbHVlc1xyXG4gKiBUT0RPIC0gaWYgZWxlbWVudCBpcyB3aW5kb3csIHJldHVybiBvbmx5IHRob3NlIHZhbHVlcy5cclxuICovXHJcbmZ1bmN0aW9uIEdldERpbWVuc2lvbnMoZWxlbSwgdGVzdCl7XHJcbiAgZWxlbSA9IGVsZW0ubGVuZ3RoID8gZWxlbVswXSA6IGVsZW07XHJcblxyXG4gIGlmIChlbGVtID09PSB3aW5kb3cgfHwgZWxlbSA9PT0gZG9jdW1lbnQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcIkknbSBzb3JyeSwgRGF2ZS4gSSdtIGFmcmFpZCBJIGNhbid0IGRvIHRoYXQuXCIpO1xyXG4gIH1cclxuXHJcbiAgdmFyIHJlY3QgPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxyXG4gICAgICBwYXJSZWN0ID0gZWxlbS5wYXJlbnROb2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxyXG4gICAgICB3aW5SZWN0ID0gZG9jdW1lbnQuYm9keS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcclxuICAgICAgd2luWSA9IHdpbmRvdy5wYWdlWU9mZnNldCxcclxuICAgICAgd2luWCA9IHdpbmRvdy5wYWdlWE9mZnNldDtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHdpZHRoOiByZWN0LndpZHRoLFxyXG4gICAgaGVpZ2h0OiByZWN0LmhlaWdodCxcclxuICAgIG9mZnNldDoge1xyXG4gICAgICB0b3A6IHJlY3QudG9wICsgd2luWSxcclxuICAgICAgbGVmdDogcmVjdC5sZWZ0ICsgd2luWFxyXG4gICAgfSxcclxuICAgIHBhcmVudERpbXM6IHtcclxuICAgICAgd2lkdGg6IHBhclJlY3Qud2lkdGgsXHJcbiAgICAgIGhlaWdodDogcGFyUmVjdC5oZWlnaHQsXHJcbiAgICAgIG9mZnNldDoge1xyXG4gICAgICAgIHRvcDogcGFyUmVjdC50b3AgKyB3aW5ZLFxyXG4gICAgICAgIGxlZnQ6IHBhclJlY3QubGVmdCArIHdpblhcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHdpbmRvd0RpbXM6IHtcclxuICAgICAgd2lkdGg6IHdpblJlY3Qud2lkdGgsXHJcbiAgICAgIGhlaWdodDogd2luUmVjdC5oZWlnaHQsXHJcbiAgICAgIG9mZnNldDoge1xyXG4gICAgICAgIHRvcDogd2luWSxcclxuICAgICAgICBsZWZ0OiB3aW5YXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGFuIG9iamVjdCBvZiB0b3AgYW5kIGxlZnQgaW50ZWdlciBwaXhlbCB2YWx1ZXMgZm9yIGR5bmFtaWNhbGx5IHJlbmRlcmVkIGVsZW1lbnRzLFxyXG4gKiBzdWNoIGFzOiBUb29sdGlwLCBSZXZlYWwsIGFuZCBEcm9wZG93blxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZWxlbWVudCBiZWluZyBwb3NpdGlvbmVkLlxyXG4gKiBAcGFyYW0ge2pRdWVyeX0gYW5jaG9yIC0galF1ZXJ5IG9iamVjdCBmb3IgdGhlIGVsZW1lbnQncyBhbmNob3IgcG9pbnQuXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBwb3NpdGlvbiAtIGEgc3RyaW5nIHJlbGF0aW5nIHRvIHRoZSBkZXNpcmVkIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50LCByZWxhdGl2ZSB0byBpdCdzIGFuY2hvclxyXG4gKiBAcGFyYW0ge051bWJlcn0gdk9mZnNldCAtIGludGVnZXIgcGl4ZWwgdmFsdWUgb2YgZGVzaXJlZCB2ZXJ0aWNhbCBzZXBhcmF0aW9uIGJldHdlZW4gYW5jaG9yIGFuZCBlbGVtZW50LlxyXG4gKiBAcGFyYW0ge051bWJlcn0gaE9mZnNldCAtIGludGVnZXIgcGl4ZWwgdmFsdWUgb2YgZGVzaXJlZCBob3Jpem9udGFsIHNlcGFyYXRpb24gYmV0d2VlbiBhbmNob3IgYW5kIGVsZW1lbnQuXHJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNPdmVyZmxvdyAtIGlmIGEgY29sbGlzaW9uIGV2ZW50IGlzIGRldGVjdGVkLCBzZXRzIHRvIHRydWUgdG8gZGVmYXVsdCB0aGUgZWxlbWVudCB0byBmdWxsIHdpZHRoIC0gYW55IGRlc2lyZWQgb2Zmc2V0LlxyXG4gKiBUT0RPIGFsdGVyL3Jld3JpdGUgdG8gd29yayB3aXRoIGBlbWAgdmFsdWVzIGFzIHdlbGwvaW5zdGVhZCBvZiBwaXhlbHNcclxuICovXHJcbmZ1bmN0aW9uIEdldE9mZnNldHMoZWxlbWVudCwgYW5jaG9yLCBwb3NpdGlvbiwgdk9mZnNldCwgaE9mZnNldCwgaXNPdmVyZmxvdykge1xyXG4gIHZhciAkZWxlRGltcyA9IEdldERpbWVuc2lvbnMoZWxlbWVudCksXHJcbiAgICAgICRhbmNob3JEaW1zID0gYW5jaG9yID8gR2V0RGltZW5zaW9ucyhhbmNob3IpIDogbnVsbDtcclxuXHJcbiAgc3dpdGNoIChwb3NpdGlvbikge1xyXG4gICAgY2FzZSAndG9wJzpcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBsZWZ0OiAoRm91bmRhdGlvbi5ydGwoKSA/ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gJGVsZURpbXMud2lkdGggKyAkYW5jaG9yRGltcy53aWR0aCA6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0KSxcclxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgLSAoJGVsZURpbXMuaGVpZ2h0ICsgdk9mZnNldClcclxuICAgICAgfVxyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ2xlZnQnOlxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gKCRlbGVEaW1zLndpZHRoICsgaE9mZnNldCksXHJcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wXHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdyaWdodCc6XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQsXHJcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wXHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdjZW50ZXIgdG9wJzpcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBsZWZ0OiAoJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAoJGFuY2hvckRpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSxcclxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgLSAoJGVsZURpbXMuaGVpZ2h0ICsgdk9mZnNldClcclxuICAgICAgfVxyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ2NlbnRlciBib3R0b20nOlxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGxlZnQ6IGlzT3ZlcmZsb3cgPyBoT2Zmc2V0IDogKCgkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICgkYW5jaG9yRGltcy53aWR0aCAvIDIpKSAtICgkZWxlRGltcy53aWR0aCAvIDIpKSxcclxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHQgKyB2T2Zmc2V0XHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdjZW50ZXIgbGVmdCc6XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgLSAoJGVsZURpbXMud2lkdGggKyBoT2Zmc2V0KSxcclxuICAgICAgICB0b3A6ICgkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgKCRhbmNob3JEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAnY2VudGVyIHJpZ2h0JzpcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICRhbmNob3JEaW1zLndpZHRoICsgaE9mZnNldCArIDEsXHJcbiAgICAgICAgdG9wOiAoJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICgkYW5jaG9yRGltcy5oZWlnaHQgLyAyKSkgLSAoJGVsZURpbXMuaGVpZ2h0IC8gMilcclxuICAgICAgfVxyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ2NlbnRlcic6XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgbGVmdDogKCRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LmxlZnQgKyAoJGVsZURpbXMud2luZG93RGltcy53aWR0aCAvIDIpKSAtICgkZWxlRGltcy53aWR0aCAvIDIpLFxyXG4gICAgICAgIHRvcDogKCRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCArICgkZWxlRGltcy53aW5kb3dEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAncmV2ZWFsJzpcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBsZWZ0OiAoJGVsZURpbXMud2luZG93RGltcy53aWR0aCAtICRlbGVEaW1zLndpZHRoKSAvIDIsXHJcbiAgICAgICAgdG9wOiAkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3AgKyB2T2Zmc2V0XHJcbiAgICAgIH1cclxuICAgIGNhc2UgJ3JldmVhbCBmdWxsJzpcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBsZWZ0OiAkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0LFxyXG4gICAgICAgIHRvcDogJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wXHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdsZWZ0IGJvdHRvbSc6XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgLSAoJGVsZURpbXMud2lkdGggKyBoT2Zmc2V0KSxcclxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHRcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdyaWdodCBib3R0b20nOlxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgJGFuY2hvckRpbXMud2lkdGggKyBoT2Zmc2V0IC0gJGVsZURpbXMud2lkdGgsXHJcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBsZWZ0OiAoRm91bmRhdGlvbi5ydGwoKSA/ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gJGVsZURpbXMud2lkdGggKyAkYW5jaG9yRGltcy53aWR0aCA6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0KSxcclxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHQgKyB2T2Zmc2V0XHJcbiAgICAgIH1cclxuICB9XHJcbn1cclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcclxuICogVGhpcyB1dGlsIHdhcyBjcmVhdGVkIGJ5IE1hcml1cyBPbGJlcnR6ICpcclxuICogUGxlYXNlIHRoYW5rIE1hcml1cyBvbiBHaXRIdWIgL293bGJlcnR6ICpcclxuICogb3IgdGhlIHdlYiBodHRwOi8vd3d3Lm1hcml1c29sYmVydHouZGUvICpcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG5jb25zdCBrZXlDb2RlcyA9IHtcclxuICA5OiAnVEFCJyxcclxuICAxMzogJ0VOVEVSJyxcclxuICAyNzogJ0VTQ0FQRScsXHJcbiAgMzI6ICdTUEFDRScsXHJcbiAgMzc6ICdBUlJPV19MRUZUJyxcclxuICAzODogJ0FSUk9XX1VQJyxcclxuICAzOTogJ0FSUk9XX1JJR0hUJyxcclxuICA0MDogJ0FSUk9XX0RPV04nXHJcbn1cclxuXHJcbnZhciBjb21tYW5kcyA9IHt9XHJcblxyXG52YXIgS2V5Ym9hcmQgPSB7XHJcbiAga2V5czogZ2V0S2V5Q29kZXMoa2V5Q29kZXMpLFxyXG5cclxuICAvKipcclxuICAgKiBQYXJzZXMgdGhlIChrZXlib2FyZCkgZXZlbnQgYW5kIHJldHVybnMgYSBTdHJpbmcgdGhhdCByZXByZXNlbnRzIGl0cyBrZXlcclxuICAgKiBDYW4gYmUgdXNlZCBsaWtlIEZvdW5kYXRpb24ucGFyc2VLZXkoZXZlbnQpID09PSBGb3VuZGF0aW9uLmtleXMuU1BBQ0VcclxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCAtIHRoZSBldmVudCBnZW5lcmF0ZWQgYnkgdGhlIGV2ZW50IGhhbmRsZXJcclxuICAgKiBAcmV0dXJuIFN0cmluZyBrZXkgLSBTdHJpbmcgdGhhdCByZXByZXNlbnRzIHRoZSBrZXkgcHJlc3NlZFxyXG4gICAqL1xyXG4gIHBhcnNlS2V5KGV2ZW50KSB7XHJcbiAgICB2YXIga2V5ID0ga2V5Q29kZXNbZXZlbnQud2hpY2ggfHwgZXZlbnQua2V5Q29kZV0gfHwgU3RyaW5nLmZyb21DaGFyQ29kZShldmVudC53aGljaCkudG9VcHBlckNhc2UoKTtcclxuICAgIGlmIChldmVudC5zaGlmdEtleSkga2V5ID0gYFNISUZUXyR7a2V5fWA7XHJcbiAgICBpZiAoZXZlbnQuY3RybEtleSkga2V5ID0gYENUUkxfJHtrZXl9YDtcclxuICAgIGlmIChldmVudC5hbHRLZXkpIGtleSA9IGBBTFRfJHtrZXl9YDtcclxuICAgIHJldHVybiBrZXk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlcyB0aGUgZ2l2ZW4gKGtleWJvYXJkKSBldmVudFxyXG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gdGhlIGV2ZW50IGdlbmVyYXRlZCBieSB0aGUgZXZlbnQgaGFuZGxlclxyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnQgLSBGb3VuZGF0aW9uIGNvbXBvbmVudCdzIG5hbWUsIGUuZy4gU2xpZGVyIG9yIFJldmVhbFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0c30gZnVuY3Rpb25zIC0gY29sbGVjdGlvbiBvZiBmdW5jdGlvbnMgdGhhdCBhcmUgdG8gYmUgZXhlY3V0ZWRcclxuICAgKi9cclxuICBoYW5kbGVLZXkoZXZlbnQsIGNvbXBvbmVudCwgZnVuY3Rpb25zKSB7XHJcbiAgICB2YXIgY29tbWFuZExpc3QgPSBjb21tYW5kc1tjb21wb25lbnRdLFxyXG4gICAgICBrZXlDb2RlID0gdGhpcy5wYXJzZUtleShldmVudCksXHJcbiAgICAgIGNtZHMsXHJcbiAgICAgIGNvbW1hbmQsXHJcbiAgICAgIGZuO1xyXG5cclxuICAgIGlmICghY29tbWFuZExpc3QpIHJldHVybiBjb25zb2xlLndhcm4oJ0NvbXBvbmVudCBub3QgZGVmaW5lZCEnKTtcclxuXHJcbiAgICBpZiAodHlwZW9mIGNvbW1hbmRMaXN0Lmx0ciA9PT0gJ3VuZGVmaW5lZCcpIHsgLy8gdGhpcyBjb21wb25lbnQgZG9lcyBub3QgZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIGx0ciBhbmQgcnRsXHJcbiAgICAgICAgY21kcyA9IGNvbW1hbmRMaXN0OyAvLyB1c2UgcGxhaW4gbGlzdFxyXG4gICAgfSBlbHNlIHsgLy8gbWVyZ2UgbHRyIGFuZCBydGw6IGlmIGRvY3VtZW50IGlzIHJ0bCwgcnRsIG92ZXJ3cml0ZXMgbHRyIGFuZCB2aWNlIHZlcnNhXHJcbiAgICAgICAgaWYgKEZvdW5kYXRpb24ucnRsKCkpIGNtZHMgPSAkLmV4dGVuZCh7fSwgY29tbWFuZExpc3QubHRyLCBjb21tYW5kTGlzdC5ydGwpO1xyXG5cclxuICAgICAgICBlbHNlIGNtZHMgPSAkLmV4dGVuZCh7fSwgY29tbWFuZExpc3QucnRsLCBjb21tYW5kTGlzdC5sdHIpO1xyXG4gICAgfVxyXG4gICAgY29tbWFuZCA9IGNtZHNba2V5Q29kZV07XHJcblxyXG4gICAgZm4gPSBmdW5jdGlvbnNbY29tbWFuZF07XHJcbiAgICBpZiAoZm4gJiYgdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gIGlmIGV4aXN0c1xyXG4gICAgICBmbi5hcHBseSgpO1xyXG4gICAgICBpZiAoZnVuY3Rpb25zLmhhbmRsZWQgfHwgdHlwZW9mIGZ1bmN0aW9ucy5oYW5kbGVkID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gd2hlbiBldmVudCB3YXMgaGFuZGxlZFxyXG4gICAgICAgICAgZnVuY3Rpb25zLmhhbmRsZWQuYXBwbHkoKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKGZ1bmN0aW9ucy51bmhhbmRsZWQgfHwgdHlwZW9mIGZ1bmN0aW9ucy51bmhhbmRsZWQgPT09ICdmdW5jdGlvbicpIHsgLy8gZXhlY3V0ZSBmdW5jdGlvbiB3aGVuIGV2ZW50IHdhcyBub3QgaGFuZGxlZFxyXG4gICAgICAgICAgZnVuY3Rpb25zLnVuaGFuZGxlZC5hcHBseSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogRmluZHMgYWxsIGZvY3VzYWJsZSBlbGVtZW50cyB3aXRoaW4gdGhlIGdpdmVuIGAkZWxlbWVudGBcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHNlYXJjaCB3aXRoaW5cclxuICAgKiBAcmV0dXJuIHtqUXVlcnl9ICRmb2N1c2FibGUgLSBhbGwgZm9jdXNhYmxlIGVsZW1lbnRzIHdpdGhpbiBgJGVsZW1lbnRgXHJcbiAgICovXHJcbiAgZmluZEZvY3VzYWJsZSgkZWxlbWVudCkge1xyXG4gICAgcmV0dXJuICRlbGVtZW50LmZpbmQoJ2FbaHJlZl0sIGFyZWFbaHJlZl0sIGlucHV0Om5vdChbZGlzYWJsZWRdKSwgc2VsZWN0Om5vdChbZGlzYWJsZWRdKSwgdGV4dGFyZWE6bm90KFtkaXNhYmxlZF0pLCBidXR0b246bm90KFtkaXNhYmxlZF0pLCBpZnJhbWUsIG9iamVjdCwgZW1iZWQsICpbdGFiaW5kZXhdLCAqW2NvbnRlbnRlZGl0YWJsZV0nKS5maWx0ZXIoZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmICghJCh0aGlzKS5pcygnOnZpc2libGUnKSB8fCAkKHRoaXMpLmF0dHIoJ3RhYmluZGV4JykgPCAwKSB7IHJldHVybiBmYWxzZTsgfSAvL29ubHkgaGF2ZSB2aXNpYmxlIGVsZW1lbnRzIGFuZCB0aG9zZSB0aGF0IGhhdmUgYSB0YWJpbmRleCBncmVhdGVyIG9yIGVxdWFsIDBcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjb21wb25lbnQgbmFtZSBuYW1lXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbXBvbmVudCAtIEZvdW5kYXRpb24gY29tcG9uZW50LCBlLmcuIFNsaWRlciBvciBSZXZlYWxcclxuICAgKiBAcmV0dXJuIFN0cmluZyBjb21wb25lbnROYW1lXHJcbiAgICovXHJcblxyXG4gIHJlZ2lzdGVyKGNvbXBvbmVudE5hbWUsIGNtZHMpIHtcclxuICAgIGNvbW1hbmRzW2NvbXBvbmVudE5hbWVdID0gY21kcztcclxuICB9XHJcbn1cclxuXHJcbi8qXHJcbiAqIENvbnN0YW50cyBmb3IgZWFzaWVyIGNvbXBhcmluZy5cclxuICogQ2FuIGJlIHVzZWQgbGlrZSBGb3VuZGF0aW9uLnBhcnNlS2V5KGV2ZW50KSA9PT0gRm91bmRhdGlvbi5rZXlzLlNQQUNFXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRLZXlDb2RlcyhrY3MpIHtcclxuICB2YXIgayA9IHt9O1xyXG4gIGZvciAodmFyIGtjIGluIGtjcykga1trY3Nba2NdXSA9IGtjc1trY107XHJcbiAgcmV0dXJuIGs7XHJcbn1cclxuXHJcbkZvdW5kYXRpb24uS2V5Ym9hcmQgPSBLZXlib2FyZDtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8vIERlZmF1bHQgc2V0IG9mIG1lZGlhIHF1ZXJpZXNcclxuY29uc3QgZGVmYXVsdFF1ZXJpZXMgPSB7XHJcbiAgJ2RlZmF1bHQnIDogJ29ubHkgc2NyZWVuJyxcclxuICBsYW5kc2NhcGUgOiAnb25seSBzY3JlZW4gYW5kIChvcmllbnRhdGlvbjogbGFuZHNjYXBlKScsXHJcbiAgcG9ydHJhaXQgOiAnb25seSBzY3JlZW4gYW5kIChvcmllbnRhdGlvbjogcG9ydHJhaXQpJyxcclxuICByZXRpbmEgOiAnb25seSBzY3JlZW4gYW5kICgtd2Via2l0LW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xyXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLS1tb3otZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcclxuICAgICdvbmx5IHNjcmVlbiBhbmQgKC1vLW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIvMSksJyArXHJcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcclxuICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi1yZXNvbHV0aW9uOiAxOTJkcGkpLCcgK1xyXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDJkcHB4KSdcclxufTtcclxuXHJcbnZhciBNZWRpYVF1ZXJ5ID0ge1xyXG4gIHF1ZXJpZXM6IFtdLFxyXG5cclxuICBjdXJyZW50OiAnJyxcclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIG1lZGlhIHF1ZXJ5IGhlbHBlciwgYnkgZXh0cmFjdGluZyB0aGUgYnJlYWtwb2ludCBsaXN0IGZyb20gdGhlIENTUyBhbmQgYWN0aXZhdGluZyB0aGUgYnJlYWtwb2ludCB3YXRjaGVyLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2luaXQoKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICB2YXIgZXh0cmFjdGVkU3R5bGVzID0gJCgnLmZvdW5kYXRpb24tbXEnKS5jc3MoJ2ZvbnQtZmFtaWx5Jyk7XHJcbiAgICB2YXIgbmFtZWRRdWVyaWVzO1xyXG5cclxuICAgIG5hbWVkUXVlcmllcyA9IHBhcnNlU3R5bGVUb09iamVjdChleHRyYWN0ZWRTdHlsZXMpO1xyXG5cclxuICAgIGZvciAodmFyIGtleSBpbiBuYW1lZFF1ZXJpZXMpIHtcclxuICAgICAgc2VsZi5xdWVyaWVzLnB1c2goe1xyXG4gICAgICAgIG5hbWU6IGtleSxcclxuICAgICAgICB2YWx1ZTogYG9ubHkgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAke25hbWVkUXVlcmllc1trZXldfSlgXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY3VycmVudCA9IHRoaXMuX2dldEN1cnJlbnRTaXplKCk7XHJcblxyXG4gICAgdGhpcy5fd2F0Y2hlcigpO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrcyBpZiB0aGUgc2NyZWVuIGlzIGF0IGxlYXN0IGFzIHdpZGUgYXMgYSBicmVha3BvaW50LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzaXplIC0gTmFtZSBvZiB0aGUgYnJlYWtwb2ludCB0byBjaGVjay5cclxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBicmVha3BvaW50IG1hdGNoZXMsIGBmYWxzZWAgaWYgaXQncyBzbWFsbGVyLlxyXG4gICAqL1xyXG4gIGF0TGVhc3Qoc2l6ZSkge1xyXG4gICAgdmFyIHF1ZXJ5ID0gdGhpcy5nZXQoc2l6ZSk7XHJcblxyXG4gICAgaWYgKHF1ZXJ5KSB7XHJcbiAgICAgIHJldHVybiB3aW5kb3cubWF0Y2hNZWRpYShxdWVyeSkubWF0Y2hlcztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgbWVkaWEgcXVlcnkgb2YgYSBicmVha3BvaW50LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzaXplIC0gTmFtZSBvZiB0aGUgYnJlYWtwb2ludCB0byBnZXQuXHJcbiAgICogQHJldHVybnMge1N0cmluZ3xudWxsfSAtIFRoZSBtZWRpYSBxdWVyeSBvZiB0aGUgYnJlYWtwb2ludCwgb3IgYG51bGxgIGlmIHRoZSBicmVha3BvaW50IGRvZXNuJ3QgZXhpc3QuXHJcbiAgICovXHJcbiAgZ2V0KHNpemUpIHtcclxuICAgIGZvciAodmFyIGkgaW4gdGhpcy5xdWVyaWVzKSB7XHJcbiAgICAgIHZhciBxdWVyeSA9IHRoaXMucXVlcmllc1tpXTtcclxuICAgICAgaWYgKHNpemUgPT09IHF1ZXJ5Lm5hbWUpIHJldHVybiBxdWVyeS52YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBjdXJyZW50IGJyZWFrcG9pbnQgbmFtZSBieSB0ZXN0aW5nIGV2ZXJ5IGJyZWFrcG9pbnQgYW5kIHJldHVybmluZyB0aGUgbGFzdCBvbmUgdG8gbWF0Y2ggKHRoZSBiaWdnZXN0IG9uZSkuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSBOYW1lIG9mIHRoZSBjdXJyZW50IGJyZWFrcG9pbnQuXHJcbiAgICovXHJcbiAgX2dldEN1cnJlbnRTaXplKCkge1xyXG4gICAgdmFyIG1hdGNoZWQ7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdmFyIHF1ZXJ5ID0gdGhpcy5xdWVyaWVzW2ldO1xyXG5cclxuICAgICAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKHF1ZXJ5LnZhbHVlKS5tYXRjaGVzKSB7XHJcbiAgICAgICAgbWF0Y2hlZCA9IHF1ZXJ5O1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBtYXRjaGVkID09PSAnb2JqZWN0Jykge1xyXG4gICAgICByZXR1cm4gbWF0Y2hlZC5uYW1lO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIG1hdGNoZWQ7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogQWN0aXZhdGVzIHRoZSBicmVha3BvaW50IHdhdGNoZXIsIHdoaWNoIGZpcmVzIGFuIGV2ZW50IG9uIHRoZSB3aW5kb3cgd2hlbmV2ZXIgdGhlIGJyZWFrcG9pbnQgY2hhbmdlcy5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF93YXRjaGVyKCkge1xyXG4gICAgJCh3aW5kb3cpLm9uKCdyZXNpemUuemYubWVkaWFxdWVyeScsICgpID0+IHtcclxuICAgICAgdmFyIG5ld1NpemUgPSB0aGlzLl9nZXRDdXJyZW50U2l6ZSgpO1xyXG5cclxuICAgICAgaWYgKG5ld1NpemUgIT09IHRoaXMuY3VycmVudCkge1xyXG4gICAgICAgIC8vIEJyb2FkY2FzdCB0aGUgbWVkaWEgcXVlcnkgY2hhbmdlIG9uIHRoZSB3aW5kb3dcclxuICAgICAgICAkKHdpbmRvdykudHJpZ2dlcignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgW25ld1NpemUsIHRoaXMuY3VycmVudF0pO1xyXG5cclxuICAgICAgICAvLyBDaGFuZ2UgdGhlIGN1cnJlbnQgbWVkaWEgcXVlcnlcclxuICAgICAgICB0aGlzLmN1cnJlbnQgPSBuZXdTaXplO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG5Gb3VuZGF0aW9uLk1lZGlhUXVlcnkgPSBNZWRpYVF1ZXJ5O1xyXG5cclxuLy8gbWF0Y2hNZWRpYSgpIHBvbHlmaWxsIC0gVGVzdCBhIENTUyBtZWRpYSB0eXBlL3F1ZXJ5IGluIEpTLlxyXG4vLyBBdXRob3JzICYgY29weXJpZ2h0IChjKSAyMDEyOiBTY290dCBKZWhsLCBQYXVsIElyaXNoLCBOaWNob2xhcyBaYWthcywgRGF2aWQgS25pZ2h0LiBEdWFsIE1JVC9CU0QgbGljZW5zZVxyXG53aW5kb3cubWF0Y2hNZWRpYSB8fCAod2luZG93Lm1hdGNoTWVkaWEgPSBmdW5jdGlvbigpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIC8vIEZvciBicm93c2VycyB0aGF0IHN1cHBvcnQgbWF0Y2hNZWRpdW0gYXBpIHN1Y2ggYXMgSUUgOSBhbmQgd2Via2l0XHJcbiAgdmFyIHN0eWxlTWVkaWEgPSAod2luZG93LnN0eWxlTWVkaWEgfHwgd2luZG93Lm1lZGlhKTtcclxuXHJcbiAgLy8gRm9yIHRob3NlIHRoYXQgZG9uJ3Qgc3VwcG9ydCBtYXRjaE1lZGl1bVxyXG4gIGlmICghc3R5bGVNZWRpYSkge1xyXG4gICAgdmFyIHN0eWxlICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpLFxyXG4gICAgc2NyaXB0ICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JylbMF0sXHJcbiAgICBpbmZvICAgICAgICA9IG51bGw7XHJcblxyXG4gICAgc3R5bGUudHlwZSAgPSAndGV4dC9jc3MnO1xyXG4gICAgc3R5bGUuaWQgICAgPSAnbWF0Y2htZWRpYWpzLXRlc3QnO1xyXG5cclxuICAgIHNjcmlwdC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShzdHlsZSwgc2NyaXB0KTtcclxuXHJcbiAgICAvLyAnc3R5bGUuY3VycmVudFN0eWxlJyBpcyB1c2VkIGJ5IElFIDw9IDggYW5kICd3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZScgZm9yIGFsbCBvdGhlciBicm93c2Vyc1xyXG4gICAgaW5mbyA9ICgnZ2V0Q29tcHV0ZWRTdHlsZScgaW4gd2luZG93KSAmJiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShzdHlsZSwgbnVsbCkgfHwgc3R5bGUuY3VycmVudFN0eWxlO1xyXG5cclxuICAgIHN0eWxlTWVkaWEgPSB7XHJcbiAgICAgIG1hdGNoTWVkaXVtKG1lZGlhKSB7XHJcbiAgICAgICAgdmFyIHRleHQgPSBgQG1lZGlhICR7bWVkaWF9eyAjbWF0Y2htZWRpYWpzLXRlc3QgeyB3aWR0aDogMXB4OyB9IH1gO1xyXG5cclxuICAgICAgICAvLyAnc3R5bGUuc3R5bGVTaGVldCcgaXMgdXNlZCBieSBJRSA8PSA4IGFuZCAnc3R5bGUudGV4dENvbnRlbnQnIGZvciBhbGwgb3RoZXIgYnJvd3NlcnNcclxuICAgICAgICBpZiAoc3R5bGUuc3R5bGVTaGVldCkge1xyXG4gICAgICAgICAgc3R5bGUuc3R5bGVTaGVldC5jc3NUZXh0ID0gdGV4dDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgc3R5bGUudGV4dENvbnRlbnQgPSB0ZXh0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVGVzdCBpZiBtZWRpYSBxdWVyeSBpcyB0cnVlIG9yIGZhbHNlXHJcbiAgICAgICAgcmV0dXJuIGluZm8ud2lkdGggPT09ICcxcHgnO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZnVuY3Rpb24obWVkaWEpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIG1hdGNoZXM6IHN0eWxlTWVkaWEubWF0Y2hNZWRpdW0obWVkaWEgfHwgJ2FsbCcpLFxyXG4gICAgICBtZWRpYTogbWVkaWEgfHwgJ2FsbCdcclxuICAgIH07XHJcbiAgfVxyXG59KCkpO1xyXG5cclxuLy8gVGhhbmsgeW91OiBodHRwczovL2dpdGh1Yi5jb20vc2luZHJlc29yaHVzL3F1ZXJ5LXN0cmluZ1xyXG5mdW5jdGlvbiBwYXJzZVN0eWxlVG9PYmplY3Qoc3RyKSB7XHJcbiAgdmFyIHN0eWxlT2JqZWN0ID0ge307XHJcblxyXG4gIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xyXG4gICAgcmV0dXJuIHN0eWxlT2JqZWN0O1xyXG4gIH1cclxuXHJcbiAgc3RyID0gc3RyLnRyaW0oKS5zbGljZSgxLCAtMSk7IC8vIGJyb3dzZXJzIHJlLXF1b3RlIHN0cmluZyBzdHlsZSB2YWx1ZXNcclxuXHJcbiAgaWYgKCFzdHIpIHtcclxuICAgIHJldHVybiBzdHlsZU9iamVjdDtcclxuICB9XHJcblxyXG4gIHN0eWxlT2JqZWN0ID0gc3RyLnNwbGl0KCcmJykucmVkdWNlKGZ1bmN0aW9uKHJldCwgcGFyYW0pIHtcclxuICAgIHZhciBwYXJ0cyA9IHBhcmFtLnJlcGxhY2UoL1xcKy9nLCAnICcpLnNwbGl0KCc9Jyk7XHJcbiAgICB2YXIga2V5ID0gcGFydHNbMF07XHJcbiAgICB2YXIgdmFsID0gcGFydHNbMV07XHJcbiAgICBrZXkgPSBkZWNvZGVVUklDb21wb25lbnQoa2V5KTtcclxuXHJcbiAgICAvLyBtaXNzaW5nIGA9YCBzaG91bGQgYmUgYG51bGxgOlxyXG4gICAgLy8gaHR0cDovL3czLm9yZy9UUi8yMDEyL1dELXVybC0yMDEyMDUyNC8jY29sbGVjdC11cmwtcGFyYW1ldGVyc1xyXG4gICAgdmFsID0gdmFsID09PSB1bmRlZmluZWQgPyBudWxsIDogZGVjb2RlVVJJQ29tcG9uZW50KHZhbCk7XHJcblxyXG4gICAgaWYgKCFyZXQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICByZXRba2V5XSA9IHZhbDtcclxuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyZXRba2V5XSkpIHtcclxuICAgICAgcmV0W2tleV0ucHVzaCh2YWwpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0W2tleV0gPSBbcmV0W2tleV0sIHZhbF07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmV0O1xyXG4gIH0sIHt9KTtcclxuXHJcbiAgcmV0dXJuIHN0eWxlT2JqZWN0O1xyXG59XHJcblxyXG5Gb3VuZGF0aW9uLk1lZGlhUXVlcnkgPSBNZWRpYVF1ZXJ5O1xyXG5cclxufShqUXVlcnkpO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4hZnVuY3Rpb24oJCkge1xyXG5cclxuLyoqXHJcbiAqIE1vdGlvbiBtb2R1bGUuXHJcbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5tb3Rpb25cclxuICovXHJcblxyXG5jb25zdCBpbml0Q2xhc3NlcyAgID0gWydtdWktZW50ZXInLCAnbXVpLWxlYXZlJ107XHJcbmNvbnN0IGFjdGl2ZUNsYXNzZXMgPSBbJ211aS1lbnRlci1hY3RpdmUnLCAnbXVpLWxlYXZlLWFjdGl2ZSddO1xyXG5cclxuY29uc3QgTW90aW9uID0ge1xyXG4gIGFuaW1hdGVJbjogZnVuY3Rpb24oZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xyXG4gICAgYW5pbWF0ZSh0cnVlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcclxuICB9LFxyXG5cclxuICBhbmltYXRlT3V0OiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XHJcbiAgICBhbmltYXRlKGZhbHNlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIE1vdmUoZHVyYXRpb24sIGVsZW0sIGZuKXtcclxuICB2YXIgYW5pbSwgcHJvZywgc3RhcnQgPSBudWxsO1xyXG4gIC8vIGNvbnNvbGUubG9nKCdjYWxsZWQnKTtcclxuXHJcbiAgZnVuY3Rpb24gbW92ZSh0cyl7XHJcbiAgICBpZighc3RhcnQpIHN0YXJ0ID0gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgLy8gY29uc29sZS5sb2coc3RhcnQsIHRzKTtcclxuICAgIHByb2cgPSB0cyAtIHN0YXJ0O1xyXG4gICAgZm4uYXBwbHkoZWxlbSk7XHJcblxyXG4gICAgaWYocHJvZyA8IGR1cmF0aW9uKXsgYW5pbSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobW92ZSwgZWxlbSk7IH1cclxuICAgIGVsc2V7XHJcbiAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShhbmltKTtcclxuICAgICAgZWxlbS50cmlnZ2VyKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgW2VsZW1dKS50cmlnZ2VySGFuZGxlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGFuaW0gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1vdmUpO1xyXG59XHJcblxyXG4vKipcclxuICogQW5pbWF0ZXMgYW4gZWxlbWVudCBpbiBvciBvdXQgdXNpbmcgYSBDU1MgdHJhbnNpdGlvbiBjbGFzcy5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNJbiAtIERlZmluZXMgaWYgdGhlIGFuaW1hdGlvbiBpcyBpbiBvciBvdXQuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9yIEhUTUwgb2JqZWN0IHRvIGFuaW1hdGUuXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBhbmltYXRpb24gLSBDU1MgY2xhc3MgdG8gdXNlLlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIENhbGxiYWNrIHRvIHJ1biB3aGVuIGFuaW1hdGlvbiBpcyBmaW5pc2hlZC5cclxuICovXHJcbmZ1bmN0aW9uIGFuaW1hdGUoaXNJbiwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xyXG4gIGVsZW1lbnQgPSAkKGVsZW1lbnQpLmVxKDApO1xyXG5cclxuICBpZiAoIWVsZW1lbnQubGVuZ3RoKSByZXR1cm47XHJcblxyXG4gIHZhciBpbml0Q2xhc3MgPSBpc0luID8gaW5pdENsYXNzZXNbMF0gOiBpbml0Q2xhc3Nlc1sxXTtcclxuICB2YXIgYWN0aXZlQ2xhc3MgPSBpc0luID8gYWN0aXZlQ2xhc3Nlc1swXSA6IGFjdGl2ZUNsYXNzZXNbMV07XHJcblxyXG4gIC8vIFNldCB1cCB0aGUgYW5pbWF0aW9uXHJcbiAgcmVzZXQoKTtcclxuXHJcbiAgZWxlbWVudFxyXG4gICAgLmFkZENsYXNzKGFuaW1hdGlvbilcclxuICAgIC5jc3MoJ3RyYW5zaXRpb24nLCAnbm9uZScpO1xyXG5cclxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG4gICAgZWxlbWVudC5hZGRDbGFzcyhpbml0Q2xhc3MpO1xyXG4gICAgaWYgKGlzSW4pIGVsZW1lbnQuc2hvdygpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBTdGFydCB0aGUgYW5pbWF0aW9uXHJcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcclxuICAgIGVsZW1lbnRbMF0ub2Zmc2V0V2lkdGg7XHJcbiAgICBlbGVtZW50XHJcbiAgICAgIC5jc3MoJ3RyYW5zaXRpb24nLCAnJylcclxuICAgICAgLmFkZENsYXNzKGFjdGl2ZUNsYXNzKTtcclxuICB9KTtcclxuXHJcbiAgLy8gQ2xlYW4gdXAgdGhlIGFuaW1hdGlvbiB3aGVuIGl0IGZpbmlzaGVzXHJcbiAgZWxlbWVudC5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKGVsZW1lbnQpLCBmaW5pc2gpO1xyXG5cclxuICAvLyBIaWRlcyB0aGUgZWxlbWVudCAoZm9yIG91dCBhbmltYXRpb25zKSwgcmVzZXRzIHRoZSBlbGVtZW50LCBhbmQgcnVucyBhIGNhbGxiYWNrXHJcbiAgZnVuY3Rpb24gZmluaXNoKCkge1xyXG4gICAgaWYgKCFpc0luKSBlbGVtZW50LmhpZGUoKTtcclxuICAgIHJlc2V0KCk7XHJcbiAgICBpZiAoY2IpIGNiLmFwcGx5KGVsZW1lbnQpO1xyXG4gIH1cclxuXHJcbiAgLy8gUmVzZXRzIHRyYW5zaXRpb25zIGFuZCByZW1vdmVzIG1vdGlvbi1zcGVjaWZpYyBjbGFzc2VzXHJcbiAgZnVuY3Rpb24gcmVzZXQoKSB7XHJcbiAgICBlbGVtZW50WzBdLnN0eWxlLnRyYW5zaXRpb25EdXJhdGlvbiA9IDA7XHJcbiAgICBlbGVtZW50LnJlbW92ZUNsYXNzKGAke2luaXRDbGFzc30gJHthY3RpdmVDbGFzc30gJHthbmltYXRpb259YCk7XHJcbiAgfVxyXG59XHJcblxyXG5Gb3VuZGF0aW9uLk1vdmUgPSBNb3ZlO1xyXG5Gb3VuZGF0aW9uLk1vdGlvbiA9IE1vdGlvbjtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbmNvbnN0IE5lc3QgPSB7XHJcbiAgRmVhdGhlcihtZW51LCB0eXBlID0gJ3pmJykge1xyXG4gICAgbWVudS5hdHRyKCdyb2xlJywgJ21lbnViYXInKTtcclxuXHJcbiAgICB2YXIgaXRlbXMgPSBtZW51LmZpbmQoJ2xpJykuYXR0cih7J3JvbGUnOiAnbWVudWl0ZW0nfSksXHJcbiAgICAgICAgc3ViTWVudUNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudWAsXHJcbiAgICAgICAgc3ViSXRlbUNsYXNzID0gYCR7c3ViTWVudUNsYXNzfS1pdGVtYCxcclxuICAgICAgICBoYXNTdWJDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnUtcGFyZW50YDtcclxuXHJcbiAgICBtZW51LmZpbmQoJ2E6Zmlyc3QnKS5hdHRyKCd0YWJpbmRleCcsIDApO1xyXG5cclxuICAgIGl0ZW1zLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciAkaXRlbSA9ICQodGhpcyksXHJcbiAgICAgICAgICAkc3ViID0gJGl0ZW0uY2hpbGRyZW4oJ3VsJyk7XHJcblxyXG4gICAgICBpZiAoJHN1Yi5sZW5ndGgpIHtcclxuICAgICAgICAkaXRlbVxyXG4gICAgICAgICAgLmFkZENsYXNzKGhhc1N1YkNsYXNzKVxyXG4gICAgICAgICAgLmF0dHIoe1xyXG4gICAgICAgICAgICAnYXJpYS1oYXNwb3B1cCc6IHRydWUsXHJcbiAgICAgICAgICAgICdhcmlhLWV4cGFuZGVkJzogZmFsc2UsXHJcbiAgICAgICAgICAgICdhcmlhLWxhYmVsJzogJGl0ZW0uY2hpbGRyZW4oJ2E6Zmlyc3QnKS50ZXh0KClcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkc3ViXHJcbiAgICAgICAgICAuYWRkQ2xhc3MoYHN1Ym1lbnUgJHtzdWJNZW51Q2xhc3N9YClcclxuICAgICAgICAgIC5hdHRyKHtcclxuICAgICAgICAgICAgJ2RhdGEtc3VibWVudSc6ICcnLFxyXG4gICAgICAgICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxyXG4gICAgICAgICAgICAncm9sZSc6ICdtZW51J1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICgkaXRlbS5wYXJlbnQoJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKSB7XHJcbiAgICAgICAgJGl0ZW0uYWRkQ2xhc3MoYGlzLXN1Ym1lbnUtaXRlbSAke3N1Ykl0ZW1DbGFzc31gKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuO1xyXG4gIH0sXHJcblxyXG4gIEJ1cm4obWVudSwgdHlwZSkge1xyXG4gICAgdmFyIGl0ZW1zID0gbWVudS5maW5kKCdsaScpLnJlbW92ZUF0dHIoJ3RhYmluZGV4JyksXHJcbiAgICAgICAgc3ViTWVudUNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudWAsXHJcbiAgICAgICAgc3ViSXRlbUNsYXNzID0gYCR7c3ViTWVudUNsYXNzfS1pdGVtYCxcclxuICAgICAgICBoYXNTdWJDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnUtcGFyZW50YDtcclxuXHJcbiAgICBtZW51XHJcbiAgICAgIC5maW5kKCcqJylcclxuICAgICAgLnJlbW92ZUNsYXNzKGAke3N1Yk1lbnVDbGFzc30gJHtzdWJJdGVtQ2xhc3N9ICR7aGFzU3ViQ2xhc3N9IGlzLXN1Ym1lbnUtaXRlbSBzdWJtZW51IGlzLWFjdGl2ZWApXHJcbiAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XHJcblxyXG4gICAgLy8gY29uc29sZS5sb2coICAgICAgbWVudS5maW5kKCcuJyArIHN1Yk1lbnVDbGFzcyArICcsIC4nICsgc3ViSXRlbUNsYXNzICsgJywgLmhhcy1zdWJtZW51LCAuaXMtc3VibWVudS1pdGVtLCAuc3VibWVudSwgW2RhdGEtc3VibWVudV0nKVxyXG4gICAgLy8gICAgICAgICAgIC5yZW1vdmVDbGFzcyhzdWJNZW51Q2xhc3MgKyAnICcgKyBzdWJJdGVtQ2xhc3MgKyAnIGhhcy1zdWJtZW51IGlzLXN1Ym1lbnUtaXRlbSBzdWJtZW51JylcclxuICAgIC8vICAgICAgICAgICAucmVtb3ZlQXR0cignZGF0YS1zdWJtZW51JykpO1xyXG4gICAgLy8gaXRlbXMuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgLy8gICB2YXIgJGl0ZW0gPSAkKHRoaXMpLFxyXG4gICAgLy8gICAgICAgJHN1YiA9ICRpdGVtLmNoaWxkcmVuKCd1bCcpO1xyXG4gICAgLy8gICBpZigkaXRlbS5wYXJlbnQoJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKXtcclxuICAgIC8vICAgICAkaXRlbS5yZW1vdmVDbGFzcygnaXMtc3VibWVudS1pdGVtICcgKyBzdWJJdGVtQ2xhc3MpO1xyXG4gICAgLy8gICB9XHJcbiAgICAvLyAgIGlmKCRzdWIubGVuZ3RoKXtcclxuICAgIC8vICAgICAkaXRlbS5yZW1vdmVDbGFzcygnaGFzLXN1Ym1lbnUnKTtcclxuICAgIC8vICAgICAkc3ViLnJlbW92ZUNsYXNzKCdzdWJtZW51ICcgKyBzdWJNZW51Q2xhc3MpLnJlbW92ZUF0dHIoJ2RhdGEtc3VibWVudScpO1xyXG4gICAgLy8gICB9XHJcbiAgICAvLyB9KTtcclxuICB9XHJcbn1cclxuXHJcbkZvdW5kYXRpb24uTmVzdCA9IE5lc3Q7XHJcblxyXG59KGpRdWVyeSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG5mdW5jdGlvbiBUaW1lcihlbGVtLCBvcHRpb25zLCBjYikge1xyXG4gIHZhciBfdGhpcyA9IHRoaXMsXHJcbiAgICAgIGR1cmF0aW9uID0gb3B0aW9ucy5kdXJhdGlvbiwvL29wdGlvbnMgaXMgYW4gb2JqZWN0IGZvciBlYXNpbHkgYWRkaW5nIGZlYXR1cmVzIGxhdGVyLlxyXG4gICAgICBuYW1lU3BhY2UgPSBPYmplY3Qua2V5cyhlbGVtLmRhdGEoKSlbMF0gfHwgJ3RpbWVyJyxcclxuICAgICAgcmVtYWluID0gLTEsXHJcbiAgICAgIHN0YXJ0LFxyXG4gICAgICB0aW1lcjtcclxuXHJcbiAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xyXG5cclxuICB0aGlzLnJlc3RhcnQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJlbWFpbiA9IC0xO1xyXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcclxuICAgIHRoaXMuc3RhcnQoKTtcclxuICB9XHJcblxyXG4gIHRoaXMuc3RhcnQgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxuICAgIC8vIGlmKCFlbGVtLmRhdGEoJ3BhdXNlZCcpKXsgcmV0dXJuIGZhbHNlOyB9Ly9tYXliZSBpbXBsZW1lbnQgdGhpcyBzYW5pdHkgY2hlY2sgaWYgdXNlZCBmb3Igb3RoZXIgdGhpbmdzLlxyXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcclxuICAgIHJlbWFpbiA9IHJlbWFpbiA8PSAwID8gZHVyYXRpb24gOiByZW1haW47XHJcbiAgICBlbGVtLmRhdGEoJ3BhdXNlZCcsIGZhbHNlKTtcclxuICAgIHN0YXJ0ID0gRGF0ZS5ub3coKTtcclxuICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICBpZihvcHRpb25zLmluZmluaXRlKXtcclxuICAgICAgICBfdGhpcy5yZXN0YXJ0KCk7Ly9yZXJ1biB0aGUgdGltZXIuXHJcbiAgICAgIH1cclxuICAgICAgY2IoKTtcclxuICAgIH0sIHJlbWFpbik7XHJcbiAgICBlbGVtLnRyaWdnZXIoYHRpbWVyc3RhcnQuemYuJHtuYW1lU3BhY2V9YCk7XHJcbiAgfVxyXG5cclxuICB0aGlzLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcclxuICAgIC8vaWYoZWxlbS5kYXRhKCdwYXVzZWQnKSl7IHJldHVybiBmYWxzZTsgfS8vbWF5YmUgaW1wbGVtZW50IHRoaXMgc2FuaXR5IGNoZWNrIGlmIHVzZWQgZm9yIG90aGVyIHRoaW5ncy5cclxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XHJcbiAgICBlbGVtLmRhdGEoJ3BhdXNlZCcsIHRydWUpO1xyXG4gICAgdmFyIGVuZCA9IERhdGUubm93KCk7XHJcbiAgICByZW1haW4gPSByZW1haW4gLSAoZW5kIC0gc3RhcnQpO1xyXG4gICAgZWxlbS50cmlnZ2VyKGB0aW1lcnBhdXNlZC56Zi4ke25hbWVTcGFjZX1gKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSdW5zIGEgY2FsbGJhY2sgZnVuY3Rpb24gd2hlbiBpbWFnZXMgYXJlIGZ1bGx5IGxvYWRlZC5cclxuICogQHBhcmFtIHtPYmplY3R9IGltYWdlcyAtIEltYWdlKHMpIHRvIGNoZWNrIGlmIGxvYWRlZC5cclxuICogQHBhcmFtIHtGdW5jfSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiBpbWFnZSBpcyBmdWxseSBsb2FkZWQuXHJcbiAqL1xyXG5mdW5jdGlvbiBvbkltYWdlc0xvYWRlZChpbWFnZXMsIGNhbGxiYWNrKXtcclxuICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgIHVubG9hZGVkID0gaW1hZ2VzLmxlbmd0aDtcclxuXHJcbiAgaWYgKHVubG9hZGVkID09PSAwKSB7XHJcbiAgICBjYWxsYmFjaygpO1xyXG4gIH1cclxuXHJcbiAgaW1hZ2VzLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICBpZiAodGhpcy5jb21wbGV0ZSkge1xyXG4gICAgICBzaW5nbGVJbWFnZUxvYWRlZCgpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIHRoaXMubmF0dXJhbFdpZHRoICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLm5hdHVyYWxXaWR0aCA+IDApIHtcclxuICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAkKHRoaXMpLm9uZSgnbG9hZCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHNpbmdsZUltYWdlTG9hZGVkKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICBmdW5jdGlvbiBzaW5nbGVJbWFnZUxvYWRlZCgpIHtcclxuICAgIHVubG9hZGVkLS07XHJcbiAgICBpZiAodW5sb2FkZWQgPT09IDApIHtcclxuICAgICAgY2FsbGJhY2soKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbkZvdW5kYXRpb24uVGltZXIgPSBUaW1lcjtcclxuRm91bmRhdGlvbi5vbkltYWdlc0xvYWRlZCA9IG9uSW1hZ2VzTG9hZGVkO1xyXG5cclxufShqUXVlcnkpO1xyXG4iLCIvLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbi8vKipXb3JrIGluc3BpcmVkIGJ5IG11bHRpcGxlIGpxdWVyeSBzd2lwZSBwbHVnaW5zKipcclxuLy8qKkRvbmUgYnkgWW9oYWkgQXJhcmF0ICoqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbihmdW5jdGlvbigkKSB7XHJcblxyXG4gICQuc3BvdFN3aXBlID0ge1xyXG4gICAgdmVyc2lvbjogJzEuMC4wJyxcclxuICAgIGVuYWJsZWQ6ICdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcclxuICAgIHByZXZlbnREZWZhdWx0OiBmYWxzZSxcclxuICAgIG1vdmVUaHJlc2hvbGQ6IDc1LFxyXG4gICAgdGltZVRocmVzaG9sZDogMjAwXHJcbiAgfTtcclxuXHJcbiAgdmFyICAgc3RhcnRQb3NYLFxyXG4gICAgICAgIHN0YXJ0UG9zWSxcclxuICAgICAgICBzdGFydFRpbWUsXHJcbiAgICAgICAgZWxhcHNlZFRpbWUsXHJcbiAgICAgICAgaXNNb3ZpbmcgPSBmYWxzZTtcclxuXHJcbiAgZnVuY3Rpb24gb25Ub3VjaEVuZCgpIHtcclxuICAgIC8vICBhbGVydCh0aGlzKTtcclxuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgb25Ub3VjaE1vdmUpO1xyXG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uVG91Y2hFbmQpO1xyXG4gICAgaXNNb3ZpbmcgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIG9uVG91Y2hNb3ZlKGUpIHtcclxuICAgIGlmICgkLnNwb3RTd2lwZS5wcmV2ZW50RGVmYXVsdCkgeyBlLnByZXZlbnREZWZhdWx0KCk7IH1cclxuICAgIGlmKGlzTW92aW5nKSB7XHJcbiAgICAgIHZhciB4ID0gZS50b3VjaGVzWzBdLnBhZ2VYO1xyXG4gICAgICB2YXIgeSA9IGUudG91Y2hlc1swXS5wYWdlWTtcclxuICAgICAgdmFyIGR4ID0gc3RhcnRQb3NYIC0geDtcclxuICAgICAgdmFyIGR5ID0gc3RhcnRQb3NZIC0geTtcclxuICAgICAgdmFyIGRpcjtcclxuICAgICAgZWxhcHNlZFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZTtcclxuICAgICAgaWYoTWF0aC5hYnMoZHgpID49ICQuc3BvdFN3aXBlLm1vdmVUaHJlc2hvbGQgJiYgZWxhcHNlZFRpbWUgPD0gJC5zcG90U3dpcGUudGltZVRocmVzaG9sZCkge1xyXG4gICAgICAgIGRpciA9IGR4ID4gMCA/ICdsZWZ0JyA6ICdyaWdodCc7XHJcbiAgICAgIH1cclxuICAgICAgLy8gZWxzZSBpZihNYXRoLmFicyhkeSkgPj0gJC5zcG90U3dpcGUubW92ZVRocmVzaG9sZCAmJiBlbGFwc2VkVGltZSA8PSAkLnNwb3RTd2lwZS50aW1lVGhyZXNob2xkKSB7XHJcbiAgICAgIC8vICAgZGlyID0gZHkgPiAwID8gJ2Rvd24nIDogJ3VwJztcclxuICAgICAgLy8gfVxyXG4gICAgICBpZihkaXIpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgb25Ub3VjaEVuZC5jYWxsKHRoaXMpO1xyXG4gICAgICAgICQodGhpcykudHJpZ2dlcignc3dpcGUnLCBkaXIpLnRyaWdnZXIoYHN3aXBlJHtkaXJ9YCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIG9uVG91Y2hTdGFydChlKSB7XHJcbiAgICBpZiAoZS50b3VjaGVzLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgIHN0YXJ0UG9zWCA9IGUudG91Y2hlc1swXS5wYWdlWDtcclxuICAgICAgc3RhcnRQb3NZID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xyXG4gICAgICBpc01vdmluZyA9IHRydWU7XHJcbiAgICAgIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlLCBmYWxzZSk7XHJcbiAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRvdWNoRW5kLCBmYWxzZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBpbml0KCkge1xyXG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVyICYmIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgZmFsc2UpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdGVhcmRvd24oKSB7XHJcbiAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBvblRvdWNoU3RhcnQpO1xyXG4gIH1cclxuXHJcbiAgJC5ldmVudC5zcGVjaWFsLnN3aXBlID0geyBzZXR1cDogaW5pdCB9O1xyXG5cclxuICAkLmVhY2goWydsZWZ0JywgJ3VwJywgJ2Rvd24nLCAncmlnaHQnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJC5ldmVudC5zcGVjaWFsW2Bzd2lwZSR7dGhpc31gXSA9IHsgc2V0dXA6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICQodGhpcykub24oJ3N3aXBlJywgJC5ub29wKTtcclxuICAgIH0gfTtcclxuICB9KTtcclxufSkoalF1ZXJ5KTtcclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICogTWV0aG9kIGZvciBhZGRpbmcgcHN1ZWRvIGRyYWcgZXZlbnRzIHRvIGVsZW1lbnRzICpcclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuIWZ1bmN0aW9uKCQpe1xyXG4gICQuZm4uYWRkVG91Y2ggPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGksZWwpe1xyXG4gICAgICAkKGVsKS5iaW5kKCd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbCcsZnVuY3Rpb24oKXtcclxuICAgICAgICAvL3dlIHBhc3MgdGhlIG9yaWdpbmFsIGV2ZW50IG9iamVjdCBiZWNhdXNlIHRoZSBqUXVlcnkgZXZlbnRcclxuICAgICAgICAvL29iamVjdCBpcyBub3JtYWxpemVkIHRvIHczYyBzcGVjcyBhbmQgZG9lcyBub3QgcHJvdmlkZSB0aGUgVG91Y2hMaXN0XHJcbiAgICAgICAgaGFuZGxlVG91Y2goZXZlbnQpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciBoYW5kbGVUb3VjaCA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgdmFyIHRvdWNoZXMgPSBldmVudC5jaGFuZ2VkVG91Y2hlcyxcclxuICAgICAgICAgIGZpcnN0ID0gdG91Y2hlc1swXSxcclxuICAgICAgICAgIGV2ZW50VHlwZXMgPSB7XHJcbiAgICAgICAgICAgIHRvdWNoc3RhcnQ6ICdtb3VzZWRvd24nLFxyXG4gICAgICAgICAgICB0b3VjaG1vdmU6ICdtb3VzZW1vdmUnLFxyXG4gICAgICAgICAgICB0b3VjaGVuZDogJ21vdXNldXAnXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgdHlwZSA9IGV2ZW50VHlwZXNbZXZlbnQudHlwZV0sXHJcbiAgICAgICAgICBzaW11bGF0ZWRFdmVudFxyXG4gICAgICAgIDtcclxuXHJcbiAgICAgIGlmKCdNb3VzZUV2ZW50JyBpbiB3aW5kb3cgJiYgdHlwZW9mIHdpbmRvdy5Nb3VzZUV2ZW50ID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgc2ltdWxhdGVkRXZlbnQgPSB3aW5kb3cuTW91c2VFdmVudCh0eXBlLCB7XHJcbiAgICAgICAgICAnYnViYmxlcyc6IHRydWUsXHJcbiAgICAgICAgICAnY2FuY2VsYWJsZSc6IHRydWUsXHJcbiAgICAgICAgICAnc2NyZWVuWCc6IGZpcnN0LnNjcmVlblgsXHJcbiAgICAgICAgICAnc2NyZWVuWSc6IGZpcnN0LnNjcmVlblksXHJcbiAgICAgICAgICAnY2xpZW50WCc6IGZpcnN0LmNsaWVudFgsXHJcbiAgICAgICAgICAnY2xpZW50WSc6IGZpcnN0LmNsaWVudFlcclxuICAgICAgICB9KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzaW11bGF0ZWRFdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50Jyk7XHJcbiAgICAgICAgc2ltdWxhdGVkRXZlbnQuaW5pdE1vdXNlRXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSwgd2luZG93LCAxLCBmaXJzdC5zY3JlZW5YLCBmaXJzdC5zY3JlZW5ZLCBmaXJzdC5jbGllbnRYLCBmaXJzdC5jbGllbnRZLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgMC8qbGVmdCovLCBudWxsKTtcclxuICAgICAgfVxyXG4gICAgICBmaXJzdC50YXJnZXQuZGlzcGF0Y2hFdmVudChzaW11bGF0ZWRFdmVudCk7XHJcbiAgICB9O1xyXG4gIH07XHJcbn0oalF1ZXJ5KTtcclxuXHJcblxyXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuLy8qKkZyb20gdGhlIGpRdWVyeSBNb2JpbGUgTGlicmFyeSoqXHJcbi8vKipuZWVkIHRvIHJlY3JlYXRlIGZ1bmN0aW9uYWxpdHkqKlxyXG4vLyoqYW5kIHRyeSB0byBpbXByb3ZlIGlmIHBvc3NpYmxlKipcclxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcblxyXG4vKiBSZW1vdmluZyB0aGUgalF1ZXJ5IGZ1bmN0aW9uICoqKipcclxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcblxyXG4oZnVuY3Rpb24oICQsIHdpbmRvdywgdW5kZWZpbmVkICkge1xyXG5cclxuXHR2YXIgJGRvY3VtZW50ID0gJCggZG9jdW1lbnQgKSxcclxuXHRcdC8vIHN1cHBvcnRUb3VjaCA9ICQubW9iaWxlLnN1cHBvcnQudG91Y2gsXHJcblx0XHR0b3VjaFN0YXJ0RXZlbnQgPSAndG91Y2hzdGFydCcvL3N1cHBvcnRUb3VjaCA/IFwidG91Y2hzdGFydFwiIDogXCJtb3VzZWRvd25cIixcclxuXHRcdHRvdWNoU3RvcEV2ZW50ID0gJ3RvdWNoZW5kJy8vc3VwcG9ydFRvdWNoID8gXCJ0b3VjaGVuZFwiIDogXCJtb3VzZXVwXCIsXHJcblx0XHR0b3VjaE1vdmVFdmVudCA9ICd0b3VjaG1vdmUnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNobW92ZVwiIDogXCJtb3VzZW1vdmVcIjtcclxuXHJcblx0Ly8gc2V0dXAgbmV3IGV2ZW50IHNob3J0Y3V0c1xyXG5cdCQuZWFjaCggKCBcInRvdWNoc3RhcnQgdG91Y2htb3ZlIHRvdWNoZW5kIFwiICtcclxuXHRcdFwic3dpcGUgc3dpcGVsZWZ0IHN3aXBlcmlnaHRcIiApLnNwbGl0KCBcIiBcIiApLCBmdW5jdGlvbiggaSwgbmFtZSApIHtcclxuXHJcblx0XHQkLmZuWyBuYW1lIF0gPSBmdW5jdGlvbiggZm4gKSB7XHJcblx0XHRcdHJldHVybiBmbiA/IHRoaXMuYmluZCggbmFtZSwgZm4gKSA6IHRoaXMudHJpZ2dlciggbmFtZSApO1xyXG5cdFx0fTtcclxuXHJcblx0XHQvLyBqUXVlcnkgPCAxLjhcclxuXHRcdGlmICggJC5hdHRyRm4gKSB7XHJcblx0XHRcdCQuYXR0ckZuWyBuYW1lIF0gPSB0cnVlO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG5cclxuXHRmdW5jdGlvbiB0cmlnZ2VyQ3VzdG9tRXZlbnQoIG9iaiwgZXZlbnRUeXBlLCBldmVudCwgYnViYmxlICkge1xyXG5cdFx0dmFyIG9yaWdpbmFsVHlwZSA9IGV2ZW50LnR5cGU7XHJcblx0XHRldmVudC50eXBlID0gZXZlbnRUeXBlO1xyXG5cdFx0aWYgKCBidWJibGUgKSB7XHJcblx0XHRcdCQuZXZlbnQudHJpZ2dlciggZXZlbnQsIHVuZGVmaW5lZCwgb2JqICk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHQkLmV2ZW50LmRpc3BhdGNoLmNhbGwoIG9iaiwgZXZlbnQgKTtcclxuXHRcdH1cclxuXHRcdGV2ZW50LnR5cGUgPSBvcmlnaW5hbFR5cGU7XHJcblx0fVxyXG5cclxuXHQvLyBhbHNvIGhhbmRsZXMgdGFwaG9sZFxyXG5cclxuXHQvLyBBbHNvIGhhbmRsZXMgc3dpcGVsZWZ0LCBzd2lwZXJpZ2h0XHJcblx0JC5ldmVudC5zcGVjaWFsLnN3aXBlID0ge1xyXG5cclxuXHRcdC8vIE1vcmUgdGhhbiB0aGlzIGhvcml6b250YWwgZGlzcGxhY2VtZW50LCBhbmQgd2Ugd2lsbCBzdXBwcmVzcyBzY3JvbGxpbmcuXHJcblx0XHRzY3JvbGxTdXByZXNzaW9uVGhyZXNob2xkOiAzMCxcclxuXHJcblx0XHQvLyBNb3JlIHRpbWUgdGhhbiB0aGlzLCBhbmQgaXQgaXNuJ3QgYSBzd2lwZS5cclxuXHRcdGR1cmF0aW9uVGhyZXNob2xkOiAxMDAwLFxyXG5cclxuXHRcdC8vIFN3aXBlIGhvcml6b250YWwgZGlzcGxhY2VtZW50IG11c3QgYmUgbW9yZSB0aGFuIHRoaXMuXHJcblx0XHRob3Jpem9udGFsRGlzdGFuY2VUaHJlc2hvbGQ6IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID49IDIgPyAxNSA6IDMwLFxyXG5cclxuXHRcdC8vIFN3aXBlIHZlcnRpY2FsIGRpc3BsYWNlbWVudCBtdXN0IGJlIGxlc3MgdGhhbiB0aGlzLlxyXG5cdFx0dmVydGljYWxEaXN0YW5jZVRocmVzaG9sZDogd2luZG93LmRldmljZVBpeGVsUmF0aW8gPj0gMiA/IDE1IDogMzAsXHJcblxyXG5cdFx0Z2V0TG9jYXRpb246IGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcblx0XHRcdHZhciB3aW5QYWdlWCA9IHdpbmRvdy5wYWdlWE9mZnNldCxcclxuXHRcdFx0XHR3aW5QYWdlWSA9IHdpbmRvdy5wYWdlWU9mZnNldCxcclxuXHRcdFx0XHR4ID0gZXZlbnQuY2xpZW50WCxcclxuXHRcdFx0XHR5ID0gZXZlbnQuY2xpZW50WTtcclxuXHJcblx0XHRcdGlmICggZXZlbnQucGFnZVkgPT09IDAgJiYgTWF0aC5mbG9vciggeSApID4gTWF0aC5mbG9vciggZXZlbnQucGFnZVkgKSB8fFxyXG5cdFx0XHRcdGV2ZW50LnBhZ2VYID09PSAwICYmIE1hdGguZmxvb3IoIHggKSA+IE1hdGguZmxvb3IoIGV2ZW50LnBhZ2VYICkgKSB7XHJcblxyXG5cdFx0XHRcdC8vIGlPUzQgY2xpZW50WC9jbGllbnRZIGhhdmUgdGhlIHZhbHVlIHRoYXQgc2hvdWxkIGhhdmUgYmVlblxyXG5cdFx0XHRcdC8vIGluIHBhZ2VYL3BhZ2VZLiBXaGlsZSBwYWdlWC9wYWdlLyBoYXZlIHRoZSB2YWx1ZSAwXHJcblx0XHRcdFx0eCA9IHggLSB3aW5QYWdlWDtcclxuXHRcdFx0XHR5ID0geSAtIHdpblBhZ2VZO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCB5IDwgKCBldmVudC5wYWdlWSAtIHdpblBhZ2VZKSB8fCB4IDwgKCBldmVudC5wYWdlWCAtIHdpblBhZ2VYICkgKSB7XHJcblxyXG5cdFx0XHRcdC8vIFNvbWUgQW5kcm9pZCBicm93c2VycyBoYXZlIHRvdGFsbHkgYm9ndXMgdmFsdWVzIGZvciBjbGllbnRYL1lcclxuXHRcdFx0XHQvLyB3aGVuIHNjcm9sbGluZy96b29taW5nIGEgcGFnZS4gRGV0ZWN0YWJsZSBzaW5jZSBjbGllbnRYL2NsaWVudFlcclxuXHRcdFx0XHQvLyBzaG91bGQgbmV2ZXIgYmUgc21hbGxlciB0aGFuIHBhZ2VYL3BhZ2VZIG1pbnVzIHBhZ2Ugc2Nyb2xsXHJcblx0XHRcdFx0eCA9IGV2ZW50LnBhZ2VYIC0gd2luUGFnZVg7XHJcblx0XHRcdFx0eSA9IGV2ZW50LnBhZ2VZIC0gd2luUGFnZVk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0eDogeCxcclxuXHRcdFx0XHR5OiB5XHJcblx0XHRcdH07XHJcblx0XHR9LFxyXG5cclxuXHRcdHN0YXJ0OiBmdW5jdGlvbiggZXZlbnQgKSB7XHJcblx0XHRcdHZhciBkYXRhID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzID9cclxuXHRcdFx0XHRcdGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlc1sgMCBdIDogZXZlbnQsXHJcblx0XHRcdFx0bG9jYXRpb24gPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZ2V0TG9jYXRpb24oIGRhdGEgKTtcclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRcdFx0dGltZTogKCBuZXcgRGF0ZSgpICkuZ2V0VGltZSgpLFxyXG5cdFx0XHRcdFx0XHRjb29yZHM6IFsgbG9jYXRpb24ueCwgbG9jYXRpb24ueSBdLFxyXG5cdFx0XHRcdFx0XHRvcmlnaW46ICQoIGV2ZW50LnRhcmdldCApXHJcblx0XHRcdFx0XHR9O1xyXG5cdFx0fSxcclxuXHJcblx0XHRzdG9wOiBmdW5jdGlvbiggZXZlbnQgKSB7XHJcblx0XHRcdHZhciBkYXRhID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzID9cclxuXHRcdFx0XHRcdGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlc1sgMCBdIDogZXZlbnQsXHJcblx0XHRcdFx0bG9jYXRpb24gPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZ2V0TG9jYXRpb24oIGRhdGEgKTtcclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRcdFx0dGltZTogKCBuZXcgRGF0ZSgpICkuZ2V0VGltZSgpLFxyXG5cdFx0XHRcdFx0XHRjb29yZHM6IFsgbG9jYXRpb24ueCwgbG9jYXRpb24ueSBdXHJcblx0XHRcdFx0XHR9O1xyXG5cdFx0fSxcclxuXHJcblx0XHRoYW5kbGVTd2lwZTogZnVuY3Rpb24oIHN0YXJ0LCBzdG9wLCB0aGlzT2JqZWN0LCBvcmlnVGFyZ2V0ICkge1xyXG5cdFx0XHRpZiAoIHN0b3AudGltZSAtIHN0YXJ0LnRpbWUgPCAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZHVyYXRpb25UaHJlc2hvbGQgJiZcclxuXHRcdFx0XHRNYXRoLmFicyggc3RhcnQuY29vcmRzWyAwIF0gLSBzdG9wLmNvb3Jkc1sgMCBdICkgPiAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuaG9yaXpvbnRhbERpc3RhbmNlVGhyZXNob2xkICYmXHJcblx0XHRcdFx0TWF0aC5hYnMoIHN0YXJ0LmNvb3Jkc1sgMSBdIC0gc3RvcC5jb29yZHNbIDEgXSApIDwgJC5ldmVudC5zcGVjaWFsLnN3aXBlLnZlcnRpY2FsRGlzdGFuY2VUaHJlc2hvbGQgKSB7XHJcblx0XHRcdFx0dmFyIGRpcmVjdGlvbiA9IHN0YXJ0LmNvb3Jkc1swXSA+IHN0b3AuY29vcmRzWyAwIF0gPyBcInN3aXBlbGVmdFwiIDogXCJzd2lwZXJpZ2h0XCI7XHJcblxyXG5cdFx0XHRcdHRyaWdnZXJDdXN0b21FdmVudCggdGhpc09iamVjdCwgXCJzd2lwZVwiLCAkLkV2ZW50KCBcInN3aXBlXCIsIHsgdGFyZ2V0OiBvcmlnVGFyZ2V0LCBzd2lwZXN0YXJ0OiBzdGFydCwgc3dpcGVzdG9wOiBzdG9wIH0pLCB0cnVlICk7XHJcblx0XHRcdFx0dHJpZ2dlckN1c3RvbUV2ZW50KCB0aGlzT2JqZWN0LCBkaXJlY3Rpb24sJC5FdmVudCggZGlyZWN0aW9uLCB7IHRhcmdldDogb3JpZ1RhcmdldCwgc3dpcGVzdGFydDogc3RhcnQsIHN3aXBlc3RvcDogc3RvcCB9ICksIHRydWUgKTtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblxyXG5cdFx0fSxcclxuXHJcblx0XHQvLyBUaGlzIHNlcnZlcyBhcyBhIGZsYWcgdG8gZW5zdXJlIHRoYXQgYXQgbW9zdCBvbmUgc3dpcGUgZXZlbnQgZXZlbnQgaXNcclxuXHRcdC8vIGluIHdvcmsgYXQgYW55IGdpdmVuIHRpbWVcclxuXHRcdGV2ZW50SW5Qcm9ncmVzczogZmFsc2UsXHJcblxyXG5cdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgZXZlbnRzLFxyXG5cdFx0XHRcdHRoaXNPYmplY3QgPSB0aGlzLFxyXG5cdFx0XHRcdCR0aGlzID0gJCggdGhpc09iamVjdCApLFxyXG5cdFx0XHRcdGNvbnRleHQgPSB7fTtcclxuXHJcblx0XHRcdC8vIFJldHJpZXZlIHRoZSBldmVudHMgZGF0YSBmb3IgdGhpcyBlbGVtZW50IGFuZCBhZGQgdGhlIHN3aXBlIGNvbnRleHRcclxuXHRcdFx0ZXZlbnRzID0gJC5kYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiApO1xyXG5cdFx0XHRpZiAoICFldmVudHMgKSB7XHJcblx0XHRcdFx0ZXZlbnRzID0geyBsZW5ndGg6IDAgfTtcclxuXHRcdFx0XHQkLmRhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiLCBldmVudHMgKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRldmVudHMubGVuZ3RoKys7XHJcblx0XHRcdGV2ZW50cy5zd2lwZSA9IGNvbnRleHQ7XHJcblxyXG5cdFx0XHRjb250ZXh0LnN0YXJ0ID0gZnVuY3Rpb24oIGV2ZW50ICkge1xyXG5cclxuXHRcdFx0XHQvLyBCYWlsIGlmIHdlJ3JlIGFscmVhZHkgd29ya2luZyBvbiBhIHN3aXBlIGV2ZW50XHJcblx0XHRcdFx0aWYgKCAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzICkge1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gdHJ1ZTtcclxuXHJcblx0XHRcdFx0dmFyIHN0b3AsXHJcblx0XHRcdFx0XHRzdGFydCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdGFydCggZXZlbnQgKSxcclxuXHRcdFx0XHRcdG9yaWdUYXJnZXQgPSBldmVudC50YXJnZXQsXHJcblx0XHRcdFx0XHRlbWl0dGVkID0gZmFsc2U7XHJcblxyXG5cdFx0XHRcdGNvbnRleHQubW92ZSA9IGZ1bmN0aW9uKCBldmVudCApIHtcclxuXHRcdFx0XHRcdGlmICggIXN0YXJ0IHx8IGV2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpICkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0c3RvcCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdG9wKCBldmVudCApO1xyXG5cdFx0XHRcdFx0aWYgKCAhZW1pdHRlZCApIHtcclxuXHRcdFx0XHRcdFx0ZW1pdHRlZCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5oYW5kbGVTd2lwZSggc3RhcnQsIHN0b3AsIHRoaXNPYmplY3QsIG9yaWdUYXJnZXQgKTtcclxuXHRcdFx0XHRcdFx0aWYgKCBlbWl0dGVkICkge1xyXG5cclxuXHRcdFx0XHRcdFx0XHQvLyBSZXNldCB0aGUgY29udGV4dCB0byBtYWtlIHdheSBmb3IgdGhlIG5leHQgc3dpcGUgZXZlbnRcclxuXHRcdFx0XHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vIHByZXZlbnQgc2Nyb2xsaW5nXHJcblx0XHRcdFx0XHRpZiAoIE1hdGguYWJzKCBzdGFydC5jb29yZHNbIDAgXSAtIHN0b3AuY29vcmRzWyAwIF0gKSA+ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zY3JvbGxTdXByZXNzaW9uVGhyZXNob2xkICkge1xyXG5cdFx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH07XHJcblxyXG5cdFx0XHRcdGNvbnRleHQuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRlbWl0dGVkID0gdHJ1ZTtcclxuXHJcblx0XHRcdFx0XHRcdC8vIFJlc2V0IHRoZSBjb250ZXh0IHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzd2lwZSBldmVudFxyXG5cdFx0XHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKTtcclxuXHRcdFx0XHRcdFx0Y29udGV4dC5tb3ZlID0gbnVsbDtcclxuXHRcdFx0XHR9O1xyXG5cclxuXHRcdFx0XHQkZG9jdW1lbnQub24oIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKVxyXG5cdFx0XHRcdFx0Lm9uZSggdG91Y2hTdG9wRXZlbnQsIGNvbnRleHQuc3RvcCApO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHQkdGhpcy5vbiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XHJcblx0XHR9LFxyXG5cclxuXHRcdHRlYXJkb3duOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIGV2ZW50cywgY29udGV4dDtcclxuXHJcblx0XHRcdGV2ZW50cyA9ICQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcclxuXHRcdFx0aWYgKCBldmVudHMgKSB7XHJcblx0XHRcdFx0Y29udGV4dCA9IGV2ZW50cy5zd2lwZTtcclxuXHRcdFx0XHRkZWxldGUgZXZlbnRzLnN3aXBlO1xyXG5cdFx0XHRcdGV2ZW50cy5sZW5ndGgtLTtcclxuXHRcdFx0XHRpZiAoIGV2ZW50cy5sZW5ndGggPT09IDAgKSB7XHJcblx0XHRcdFx0XHQkLnJlbW92ZURhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoIGNvbnRleHQgKSB7XHJcblx0XHRcdFx0aWYgKCBjb250ZXh0LnN0YXJ0ICkge1xyXG5cdFx0XHRcdFx0JCggdGhpcyApLm9mZiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICggY29udGV4dC5tb3ZlICkge1xyXG5cdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoIGNvbnRleHQuc3RvcCApIHtcclxuXHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoU3RvcEV2ZW50LCBjb250ZXh0LnN0b3AgKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9O1xyXG5cdCQuZWFjaCh7XHJcblx0XHRzd2lwZWxlZnQ6IFwic3dpcGUubGVmdFwiLFxyXG5cdFx0c3dpcGVyaWdodDogXCJzd2lwZS5yaWdodFwiXHJcblx0fSwgZnVuY3Rpb24oIGV2ZW50LCBzb3VyY2VFdmVudCApIHtcclxuXHJcblx0XHQkLmV2ZW50LnNwZWNpYWxbIGV2ZW50IF0gPSB7XHJcblx0XHRcdHNldHVwOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkKCB0aGlzICkuYmluZCggc291cmNlRXZlbnQsICQubm9vcCApO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHR0ZWFyZG93bjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCggdGhpcyApLnVuYmluZCggc291cmNlRXZlbnQgKTtcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHR9KTtcclxufSkoIGpRdWVyeSwgdGhpcyApO1xyXG4qL1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4hZnVuY3Rpb24oJCkge1xyXG5cclxuY29uc3QgTXV0YXRpb25PYnNlcnZlciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgdmFyIHByZWZpeGVzID0gWydXZWJLaXQnLCAnTW96JywgJ08nLCAnTXMnLCAnJ107XHJcbiAgZm9yICh2YXIgaT0wOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgIGlmIChgJHtwcmVmaXhlc1tpXX1NdXRhdGlvbk9ic2VydmVyYCBpbiB3aW5kb3cpIHtcclxuICAgICAgcmV0dXJuIHdpbmRvd1tgJHtwcmVmaXhlc1tpXX1NdXRhdGlvbk9ic2VydmVyYF07XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBmYWxzZTtcclxufSgpKTtcclxuXHJcbmNvbnN0IHRyaWdnZXJzID0gKGVsLCB0eXBlKSA9PiB7XHJcbiAgZWwuZGF0YSh0eXBlKS5zcGxpdCgnICcpLmZvckVhY2goaWQgPT4ge1xyXG4gICAgJChgIyR7aWR9YClbIHR5cGUgPT09ICdjbG9zZScgPyAndHJpZ2dlcicgOiAndHJpZ2dlckhhbmRsZXInXShgJHt0eXBlfS56Zi50cmlnZ2VyYCwgW2VsXSk7XHJcbiAgfSk7XHJcbn07XHJcbi8vIEVsZW1lbnRzIHdpdGggW2RhdGEtb3Blbl0gd2lsbCByZXZlYWwgYSBwbHVnaW4gdGhhdCBzdXBwb3J0cyBpdCB3aGVuIGNsaWNrZWQuXHJcbiQoZG9jdW1lbnQpLm9uKCdjbGljay56Zi50cmlnZ2VyJywgJ1tkYXRhLW9wZW5dJywgZnVuY3Rpb24oKSB7XHJcbiAgdHJpZ2dlcnMoJCh0aGlzKSwgJ29wZW4nKTtcclxufSk7XHJcblxyXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLWNsb3NlXSB3aWxsIGNsb3NlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxyXG4vLyBJZiB1c2VkIHdpdGhvdXQgYSB2YWx1ZSBvbiBbZGF0YS1jbG9zZV0sIHRoZSBldmVudCB3aWxsIGJ1YmJsZSwgYWxsb3dpbmcgaXQgdG8gY2xvc2UgYSBwYXJlbnQgY29tcG9uZW50LlxyXG4kKGRvY3VtZW50KS5vbignY2xpY2suemYudHJpZ2dlcicsICdbZGF0YS1jbG9zZV0nLCBmdW5jdGlvbigpIHtcclxuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ2Nsb3NlJyk7XHJcbiAgaWYgKGlkKSB7XHJcbiAgICB0cmlnZ2VycygkKHRoaXMpLCAnY2xvc2UnKTtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICAkKHRoaXMpLnRyaWdnZXIoJ2Nsb3NlLnpmLnRyaWdnZXInKTtcclxuICB9XHJcbn0pO1xyXG5cclxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS10b2dnbGVdIHdpbGwgdG9nZ2xlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxyXG4kKGRvY3VtZW50KS5vbignY2xpY2suemYudHJpZ2dlcicsICdbZGF0YS10b2dnbGVdJywgZnVuY3Rpb24oKSB7XHJcbiAgdHJpZ2dlcnMoJCh0aGlzKSwgJ3RvZ2dsZScpO1xyXG59KTtcclxuXHJcbi8vIEVsZW1lbnRzIHdpdGggW2RhdGEtY2xvc2FibGVdIHdpbGwgcmVzcG9uZCB0byBjbG9zZS56Zi50cmlnZ2VyIGV2ZW50cy5cclxuJChkb2N1bWVudCkub24oJ2Nsb3NlLnpmLnRyaWdnZXInLCAnW2RhdGEtY2xvc2FibGVdJywgZnVuY3Rpb24oZSl7XHJcbiAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICBsZXQgYW5pbWF0aW9uID0gJCh0aGlzKS5kYXRhKCdjbG9zYWJsZScpO1xyXG5cclxuICBpZihhbmltYXRpb24gIT09ICcnKXtcclxuICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVPdXQoJCh0aGlzKSwgYW5pbWF0aW9uLCBmdW5jdGlvbigpIHtcclxuICAgICAgJCh0aGlzKS50cmlnZ2VyKCdjbG9zZWQuemYnKTtcclxuICAgIH0pO1xyXG4gIH1lbHNle1xyXG4gICAgJCh0aGlzKS5mYWRlT3V0KCkudHJpZ2dlcignY2xvc2VkLnpmJyk7XHJcbiAgfVxyXG59KTtcclxuXHJcbiQoZG9jdW1lbnQpLm9uKCdmb2N1cy56Zi50cmlnZ2VyIGJsdXIuemYudHJpZ2dlcicsICdbZGF0YS10b2dnbGUtZm9jdXNdJywgZnVuY3Rpb24oKSB7XHJcbiAgbGV0IGlkID0gJCh0aGlzKS5kYXRhKCd0b2dnbGUtZm9jdXMnKTtcclxuICAkKGAjJHtpZH1gKS50cmlnZ2VySGFuZGxlcigndG9nZ2xlLnpmLnRyaWdnZXInLCBbJCh0aGlzKV0pO1xyXG59KTtcclxuXHJcbi8qKlxyXG4qIEZpcmVzIG9uY2UgYWZ0ZXIgYWxsIG90aGVyIHNjcmlwdHMgaGF2ZSBsb2FkZWRcclxuKiBAZnVuY3Rpb25cclxuKiBAcHJpdmF0ZVxyXG4qL1xyXG4kKHdpbmRvdykubG9hZCgoKSA9PiB7XHJcbiAgY2hlY2tMaXN0ZW5lcnMoKTtcclxufSk7XHJcblxyXG5mdW5jdGlvbiBjaGVja0xpc3RlbmVycygpIHtcclxuICBldmVudHNMaXN0ZW5lcigpO1xyXG4gIHJlc2l6ZUxpc3RlbmVyKCk7XHJcbiAgc2Nyb2xsTGlzdGVuZXIoKTtcclxuICBjbG9zZW1lTGlzdGVuZXIoKTtcclxufVxyXG5cclxuLy8qKioqKioqKiBvbmx5IGZpcmVzIHRoaXMgZnVuY3Rpb24gb25jZSBvbiBsb2FkLCBpZiB0aGVyZSdzIHNvbWV0aGluZyB0byB3YXRjaCAqKioqKioqKlxyXG5mdW5jdGlvbiBjbG9zZW1lTGlzdGVuZXIocGx1Z2luTmFtZSkge1xyXG4gIHZhciB5ZXRpQm94ZXMgPSAkKCdbZGF0YS15ZXRpLWJveF0nKSxcclxuICAgICAgcGx1Z05hbWVzID0gWydkcm9wZG93bicsICd0b29sdGlwJywgJ3JldmVhbCddO1xyXG5cclxuICBpZihwbHVnaW5OYW1lKXtcclxuICAgIGlmKHR5cGVvZiBwbHVnaW5OYW1lID09PSAnc3RyaW5nJyl7XHJcbiAgICAgIHBsdWdOYW1lcy5wdXNoKHBsdWdpbk5hbWUpO1xyXG4gICAgfWVsc2UgaWYodHlwZW9mIHBsdWdpbk5hbWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBwbHVnaW5OYW1lWzBdID09PSAnc3RyaW5nJyl7XHJcbiAgICAgIHBsdWdOYW1lcy5jb25jYXQocGx1Z2luTmFtZSk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgY29uc29sZS5lcnJvcignUGx1Z2luIG5hbWVzIG11c3QgYmUgc3RyaW5ncycpO1xyXG4gICAgfVxyXG4gIH1cclxuICBpZih5ZXRpQm94ZXMubGVuZ3RoKXtcclxuICAgIGxldCBsaXN0ZW5lcnMgPSBwbHVnTmFtZXMubWFwKChuYW1lKSA9PiB7XHJcbiAgICAgIHJldHVybiBgY2xvc2VtZS56Zi4ke25hbWV9YDtcclxuICAgIH0pLmpvaW4oJyAnKTtcclxuXHJcbiAgICAkKHdpbmRvdykub2ZmKGxpc3RlbmVycykub24obGlzdGVuZXJzLCBmdW5jdGlvbihlLCBwbHVnaW5JZCl7XHJcbiAgICAgIGxldCBwbHVnaW4gPSBlLm5hbWVzcGFjZS5zcGxpdCgnLicpWzBdO1xyXG4gICAgICBsZXQgcGx1Z2lucyA9ICQoYFtkYXRhLSR7cGx1Z2lufV1gKS5ub3QoYFtkYXRhLXlldGktYm94PVwiJHtwbHVnaW5JZH1cIl1gKTtcclxuXHJcbiAgICAgIHBsdWdpbnMuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICAgIGxldCBfdGhpcyA9ICQodGhpcyk7XHJcblxyXG4gICAgICAgIF90aGlzLnRyaWdnZXJIYW5kbGVyKCdjbG9zZS56Zi50cmlnZ2VyJywgW190aGlzXSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiByZXNpemVMaXN0ZW5lcihkZWJvdW5jZSl7XHJcbiAgbGV0IHRpbWVyLFxyXG4gICAgICAkbm9kZXMgPSAkKCdbZGF0YS1yZXNpemVdJyk7XHJcbiAgaWYoJG5vZGVzLmxlbmd0aCl7XHJcbiAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUuemYudHJpZ2dlcicpXHJcbiAgICAub24oJ3Jlc2l6ZS56Zi50cmlnZ2VyJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICBpZiAodGltZXIpIHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxyXG5cclxuICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsvL2ZhbGxiYWNrIGZvciBJRSA5XHJcbiAgICAgICAgICAkbm9kZXMuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAkKHRoaXMpLnRyaWdnZXJIYW5kbGVyKCdyZXNpemVtZS56Zi50cmlnZ2VyJyk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIHJlc2l6ZSBldmVudFxyXG4gICAgICAgICRub2Rlcy5hdHRyKCdkYXRhLWV2ZW50cycsIFwicmVzaXplXCIpO1xyXG4gICAgICB9LCBkZWJvdW5jZSB8fCAxMCk7Ly9kZWZhdWx0IHRpbWUgdG8gZW1pdCByZXNpemUgZXZlbnRcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc2Nyb2xsTGlzdGVuZXIoZGVib3VuY2Upe1xyXG4gIGxldCB0aW1lcixcclxuICAgICAgJG5vZGVzID0gJCgnW2RhdGEtc2Nyb2xsXScpO1xyXG4gIGlmKCRub2Rlcy5sZW5ndGgpe1xyXG4gICAgJCh3aW5kb3cpLm9mZignc2Nyb2xsLnpmLnRyaWdnZXInKVxyXG4gICAgLm9uKCdzY3JvbGwuemYudHJpZ2dlcicsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICBpZih0aW1lcil7IGNsZWFyVGltZW91dCh0aW1lcik7IH1cclxuXHJcbiAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICBpZighTXV0YXRpb25PYnNlcnZlcil7Ly9mYWxsYmFjayBmb3IgSUUgOVxyXG4gICAgICAgICAgJG5vZGVzLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcignc2Nyb2xsbWUuemYudHJpZ2dlcicpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vdHJpZ2dlciBhbGwgbGlzdGVuaW5nIGVsZW1lbnRzIGFuZCBzaWduYWwgYSBzY3JvbGwgZXZlbnRcclxuICAgICAgICAkbm9kZXMuYXR0cignZGF0YS1ldmVudHMnLCBcInNjcm9sbFwiKTtcclxuICAgICAgfSwgZGVib3VuY2UgfHwgMTApOy8vZGVmYXVsdCB0aW1lIHRvIGVtaXQgc2Nyb2xsIGV2ZW50XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGV2ZW50c0xpc3RlbmVyKCkge1xyXG4gIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgbGV0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtcmVzaXplXSwgW2RhdGEtc2Nyb2xsXSwgW2RhdGEtbXV0YXRlXScpO1xyXG5cclxuICAvL2VsZW1lbnQgY2FsbGJhY2tcclxuICB2YXIgbGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbiA9IGZ1bmN0aW9uKG11dGF0aW9uUmVjb3Jkc0xpc3QpIHtcclxuICAgIHZhciAkdGFyZ2V0ID0gJChtdXRhdGlvblJlY29yZHNMaXN0WzBdLnRhcmdldCk7XHJcbiAgICAvL3RyaWdnZXIgdGhlIGV2ZW50IGhhbmRsZXIgZm9yIHRoZSBlbGVtZW50IGRlcGVuZGluZyBvbiB0eXBlXHJcbiAgICBzd2l0Y2ggKCR0YXJnZXQuYXR0cihcImRhdGEtZXZlbnRzXCIpKSB7XHJcblxyXG4gICAgICBjYXNlIFwicmVzaXplXCIgOlxyXG4gICAgICAkdGFyZ2V0LnRyaWdnZXJIYW5kbGVyKCdyZXNpemVtZS56Zi50cmlnZ2VyJywgWyR0YXJnZXRdKTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlIFwic2Nyb2xsXCIgOlxyXG4gICAgICAkdGFyZ2V0LnRyaWdnZXJIYW5kbGVyKCdzY3JvbGxtZS56Zi50cmlnZ2VyJywgWyR0YXJnZXQsIHdpbmRvdy5wYWdlWU9mZnNldF0pO1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICAgIC8vIGNhc2UgXCJtdXRhdGVcIiA6XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdtdXRhdGUnLCAkdGFyZ2V0KTtcclxuICAgICAgLy8gJHRhcmdldC50cmlnZ2VySGFuZGxlcignbXV0YXRlLnpmLnRyaWdnZXInKTtcclxuICAgICAgLy9cclxuICAgICAgLy8gLy9tYWtlIHN1cmUgd2UgZG9uJ3QgZ2V0IHN0dWNrIGluIGFuIGluZmluaXRlIGxvb3AgZnJvbSBzbG9wcHkgY29kZWluZ1xyXG4gICAgICAvLyBpZiAoJHRhcmdldC5pbmRleCgnW2RhdGEtbXV0YXRlXScpID09ICQoXCJbZGF0YS1tdXRhdGVdXCIpLmxlbmd0aC0xKSB7XHJcbiAgICAgIC8vICAgZG9tTXV0YXRpb25PYnNlcnZlcigpO1xyXG4gICAgICAvLyB9XHJcbiAgICAgIC8vIGJyZWFrO1xyXG5cclxuICAgICAgZGVmYXVsdCA6XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgLy9ub3RoaW5nXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpZihub2Rlcy5sZW5ndGgpe1xyXG4gICAgLy9mb3IgZWFjaCBlbGVtZW50IHRoYXQgbmVlZHMgdG8gbGlzdGVuIGZvciByZXNpemluZywgc2Nyb2xsaW5nLCAob3IgY29taW5nIHNvb24gbXV0YXRpb24pIGFkZCBhIHNpbmdsZSBvYnNlcnZlclxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gbm9kZXMubGVuZ3RoLTE7IGkrKykge1xyXG4gICAgICBsZXQgZWxlbWVudE9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIobGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbik7XHJcbiAgICAgIGVsZW1lbnRPYnNlcnZlci5vYnNlcnZlKG5vZGVzW2ldLCB7IGF0dHJpYnV0ZXM6IHRydWUsIGNoaWxkTGlzdDogZmFsc2UsIGNoYXJhY3RlckRhdGE6IGZhbHNlLCBzdWJ0cmVlOmZhbHNlLCBhdHRyaWJ1dGVGaWx0ZXI6W1wiZGF0YS1ldmVudHNcIl19KTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuLy8gW1BIXVxyXG4vLyBGb3VuZGF0aW9uLkNoZWNrV2F0Y2hlcnMgPSBjaGVja1dhdGNoZXJzO1xyXG5Gb3VuZGF0aW9uLklIZWFyWW91ID0gY2hlY2tMaXN0ZW5lcnM7XHJcbi8vIEZvdW5kYXRpb24uSVNlZVlvdSA9IHNjcm9sbExpc3RlbmVyO1xyXG4vLyBGb3VuZGF0aW9uLklGZWVsWW91ID0gY2xvc2VtZUxpc3RlbmVyO1xyXG5cclxufShqUXVlcnkpO1xyXG5cclxuLy8gZnVuY3Rpb24gZG9tTXV0YXRpb25PYnNlcnZlcihkZWJvdW5jZSkge1xyXG4vLyAgIC8vICEhISBUaGlzIGlzIGNvbWluZyBzb29uIGFuZCBuZWVkcyBtb3JlIHdvcms7IG5vdCBhY3RpdmUgICEhISAvL1xyXG4vLyAgIHZhciB0aW1lcixcclxuLy8gICBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW11dGF0ZV0nKTtcclxuLy8gICAvL1xyXG4vLyAgIGlmIChub2Rlcy5sZW5ndGgpIHtcclxuLy8gICAgIC8vIHZhciBNdXRhdGlvbk9ic2VydmVyID0gKGZ1bmN0aW9uICgpIHtcclxuLy8gICAgIC8vICAgdmFyIHByZWZpeGVzID0gWydXZWJLaXQnLCAnTW96JywgJ08nLCAnTXMnLCAnJ107XHJcbi8vICAgICAvLyAgIGZvciAodmFyIGk9MDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XHJcbi8vICAgICAvLyAgICAgaWYgKHByZWZpeGVzW2ldICsgJ011dGF0aW9uT2JzZXJ2ZXInIGluIHdpbmRvdykge1xyXG4vLyAgICAgLy8gICAgICAgcmV0dXJuIHdpbmRvd1twcmVmaXhlc1tpXSArICdNdXRhdGlvbk9ic2VydmVyJ107XHJcbi8vICAgICAvLyAgICAgfVxyXG4vLyAgICAgLy8gICB9XHJcbi8vICAgICAvLyAgIHJldHVybiBmYWxzZTtcclxuLy8gICAgIC8vIH0oKSk7XHJcbi8vXHJcbi8vXHJcbi8vICAgICAvL2ZvciB0aGUgYm9keSwgd2UgbmVlZCB0byBsaXN0ZW4gZm9yIGFsbCBjaGFuZ2VzIGVmZmVjdGluZyB0aGUgc3R5bGUgYW5kIGNsYXNzIGF0dHJpYnV0ZXNcclxuLy8gICAgIHZhciBib2R5T2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihib2R5TXV0YXRpb24pO1xyXG4vLyAgICAgYm9keU9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwgeyBhdHRyaWJ1dGVzOiB0cnVlLCBjaGlsZExpc3Q6IHRydWUsIGNoYXJhY3RlckRhdGE6IGZhbHNlLCBzdWJ0cmVlOnRydWUsIGF0dHJpYnV0ZUZpbHRlcjpbXCJzdHlsZVwiLCBcImNsYXNzXCJdfSk7XHJcbi8vXHJcbi8vXHJcbi8vICAgICAvL2JvZHkgY2FsbGJhY2tcclxuLy8gICAgIGZ1bmN0aW9uIGJvZHlNdXRhdGlvbihtdXRhdGUpIHtcclxuLy8gICAgICAgLy90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIG11dGF0aW9uIGV2ZW50XHJcbi8vICAgICAgIGlmICh0aW1lcikgeyBjbGVhclRpbWVvdXQodGltZXIpOyB9XHJcbi8vXHJcbi8vICAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuLy8gICAgICAgICBib2R5T2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xyXG4vLyAgICAgICAgICQoJ1tkYXRhLW11dGF0ZV0nKS5hdHRyKCdkYXRhLWV2ZW50cycsXCJtdXRhdGVcIik7XHJcbi8vICAgICAgIH0sIGRlYm91bmNlIHx8IDE1MCk7XHJcbi8vICAgICB9XHJcbi8vICAgfVxyXG4vLyB9XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG4vKipcclxuICogQWJpZGUgbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uYWJpZGVcclxuICovXHJcblxyXG5jbGFzcyBBYmlkZSB7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBBYmlkZS5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAZmlyZXMgQWJpZGUjaW5pdFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIHRyaWdnZXIgdG8uXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMgPSB7fSkge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgID0gJC5leHRlbmQoe30sIEFiaWRlLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0FiaWRlJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgQWJpZGUgcGx1Z2luIGFuZCBjYWxscyBmdW5jdGlvbnMgdG8gZ2V0IEFiaWRlIGZ1bmN0aW9uaW5nIG9uIGxvYWQuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfaW5pdCgpIHtcclxuICAgIHRoaXMuJGlucHV0cyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnaW5wdXQsIHRleHRhcmVhLCBzZWxlY3QnKS5ub3QoJ1tkYXRhLWFiaWRlLWlnbm9yZV0nKTtcclxuXHJcbiAgICB0aGlzLl9ldmVudHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgQWJpZGUuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfZXZlbnRzKCkge1xyXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy5hYmlkZScpXHJcbiAgICAgIC5vbigncmVzZXQuemYuYWJpZGUnLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5yZXNldEZvcm0oKTtcclxuICAgICAgfSlcclxuICAgICAgLm9uKCdzdWJtaXQuemYuYWJpZGUnLCAoKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsaWRhdGVGb3JtKCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMudmFsaWRhdGVPbiA9PT0gJ2ZpZWxkQ2hhbmdlJykge1xyXG4gICAgICB0aGlzLiRpbnB1dHNcclxuICAgICAgICAub2ZmKCdjaGFuZ2UuemYuYWJpZGUnKVxyXG4gICAgICAgIC5vbignY2hhbmdlLnpmLmFiaWRlJywgKGUpID0+IHtcclxuICAgICAgICAgIHRoaXMudmFsaWRhdGVJbnB1dCgkKGUudGFyZ2V0KSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5saXZlVmFsaWRhdGUpIHtcclxuICAgICAgdGhpcy4kaW5wdXRzXHJcbiAgICAgICAgLm9mZignaW5wdXQuemYuYWJpZGUnKVxyXG4gICAgICAgIC5vbignaW5wdXQuemYuYWJpZGUnLCAoZSkgPT4ge1xyXG4gICAgICAgICAgdGhpcy52YWxpZGF0ZUlucHV0KCQoZS50YXJnZXQpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIG5lY2Vzc2FyeSBmdW5jdGlvbnMgdG8gdXBkYXRlIEFiaWRlIHVwb24gRE9NIGNoYW5nZVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX3JlZmxvdygpIHtcclxuICAgIHRoaXMuX2luaXQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrcyB3aGV0aGVyIG9yIG5vdCBhIGZvcm0gZWxlbWVudCBoYXMgdGhlIHJlcXVpcmVkIGF0dHJpYnV0ZSBhbmQgaWYgaXQncyBjaGVja2VkIG9yIG5vdFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBjaGVjayBmb3IgcmVxdWlyZWQgYXR0cmlidXRlXHJcbiAgICogQHJldHVybnMge0Jvb2xlYW59IEJvb2xlYW4gdmFsdWUgZGVwZW5kcyBvbiB3aGV0aGVyIG9yIG5vdCBhdHRyaWJ1dGUgaXMgY2hlY2tlZCBvciBlbXB0eVxyXG4gICAqL1xyXG4gIHJlcXVpcmVkQ2hlY2soJGVsKSB7XHJcbiAgICBpZiAoISRlbC5hdHRyKCdyZXF1aXJlZCcpKSByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICB2YXIgaXNHb29kID0gdHJ1ZTtcclxuXHJcbiAgICBzd2l0Y2ggKCRlbFswXS50eXBlKSB7XHJcbiAgICAgIGNhc2UgJ3NlbGVjdCc6XHJcbiAgICAgIGNhc2UgJ3NlbGVjdC1vbmUnOlxyXG4gICAgICBjYXNlICdzZWxlY3QtbXVsdGlwbGUnOlxyXG4gICAgICAgIHZhciBvcHQgPSAkZWwuZmluZCgnb3B0aW9uOnNlbGVjdGVkJyk7XHJcbiAgICAgICAgaWYgKCFvcHQubGVuZ3RoIHx8ICFvcHQudmFsKCkpIGlzR29vZCA9IGZhbHNlO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICBpZighJGVsLnZhbCgpIHx8ICEkZWwudmFsKCkubGVuZ3RoKSBpc0dvb2QgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaXNHb29kO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQmFzZWQgb24gJGVsLCBnZXQgdGhlIGZpcnN0IGVsZW1lbnQgd2l0aCBzZWxlY3RvciBpbiB0aGlzIG9yZGVyOlxyXG4gICAqIDEuIFRoZSBlbGVtZW50J3MgZGlyZWN0IHNpYmxpbmcoJ3MpLlxyXG4gICAqIDMuIFRoZSBlbGVtZW50J3MgcGFyZW50J3MgY2hpbGRyZW4uXHJcbiAgICpcclxuICAgKiBUaGlzIGFsbG93cyBmb3IgbXVsdGlwbGUgZm9ybSBlcnJvcnMgcGVyIGlucHV0LCB0aG91Z2ggaWYgbm9uZSBhcmUgZm91bmQsIG5vIGZvcm0gZXJyb3JzIHdpbGwgYmUgc2hvd24uXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gJGVsIC0galF1ZXJ5IG9iamVjdCB0byB1c2UgYXMgcmVmZXJlbmNlIHRvIGZpbmQgdGhlIGZvcm0gZXJyb3Igc2VsZWN0b3IuXHJcbiAgICogQHJldHVybnMge09iamVjdH0galF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBzZWxlY3Rvci5cclxuICAgKi9cclxuICBmaW5kRm9ybUVycm9yKCRlbCkge1xyXG4gICAgdmFyICRlcnJvciA9ICRlbC5zaWJsaW5ncyh0aGlzLm9wdGlvbnMuZm9ybUVycm9yU2VsZWN0b3IpO1xyXG5cclxuICAgIGlmICghJGVycm9yLmxlbmd0aCkge1xyXG4gICAgICAkZXJyb3IgPSAkZWwucGFyZW50KCkuZmluZCh0aGlzLm9wdGlvbnMuZm9ybUVycm9yU2VsZWN0b3IpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAkZXJyb3I7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIGZpcnN0IGVsZW1lbnQgaW4gdGhpcyBvcmRlcjpcclxuICAgKiAyLiBUaGUgPGxhYmVsPiB3aXRoIHRoZSBhdHRyaWJ1dGUgYFtmb3I9XCJzb21lSW5wdXRJZFwiXWBcclxuICAgKiAzLiBUaGUgYC5jbG9zZXN0KClgIDxsYWJlbD5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAkZWwgLSBqUXVlcnkgb2JqZWN0IHRvIGNoZWNrIGZvciByZXF1aXJlZCBhdHRyaWJ1dGVcclxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gQm9vbGVhbiB2YWx1ZSBkZXBlbmRzIG9uIHdoZXRoZXIgb3Igbm90IGF0dHJpYnV0ZSBpcyBjaGVja2VkIG9yIGVtcHR5XHJcbiAgICovXHJcbiAgZmluZExhYmVsKCRlbCkge1xyXG4gICAgdmFyIGlkID0gJGVsWzBdLmlkO1xyXG4gICAgdmFyICRsYWJlbCA9IHRoaXMuJGVsZW1lbnQuZmluZChgbGFiZWxbZm9yPVwiJHtpZH1cIl1gKTtcclxuXHJcbiAgICBpZiAoISRsYWJlbC5sZW5ndGgpIHtcclxuICAgICAgcmV0dXJuICRlbC5jbG9zZXN0KCdsYWJlbCcpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAkbGFiZWw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIHNldCBvZiBsYWJlbHMgYXNzb2NpYXRlZCB3aXRoIGEgc2V0IG9mIHJhZGlvIGVscyBpbiB0aGlzIG9yZGVyXHJcbiAgICogMi4gVGhlIDxsYWJlbD4gd2l0aCB0aGUgYXR0cmlidXRlIGBbZm9yPVwic29tZUlucHV0SWRcIl1gXHJcbiAgICogMy4gVGhlIGAuY2xvc2VzdCgpYCA8bGFiZWw+XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gJGVsIC0galF1ZXJ5IG9iamVjdCB0byBjaGVjayBmb3IgcmVxdWlyZWQgYXR0cmlidXRlXHJcbiAgICogQHJldHVybnMge0Jvb2xlYW59IEJvb2xlYW4gdmFsdWUgZGVwZW5kcyBvbiB3aGV0aGVyIG9yIG5vdCBhdHRyaWJ1dGUgaXMgY2hlY2tlZCBvciBlbXB0eVxyXG4gICAqL1xyXG4gIGZpbmRSYWRpb0xhYmVscygkZWxzKSB7XHJcbiAgICB2YXIgbGFiZWxzID0gJGVscy5tYXAoKGksIGVsKSA9PiB7XHJcbiAgICAgIHZhciBpZCA9IGVsLmlkO1xyXG4gICAgICB2YXIgJGxhYmVsID0gdGhpcy4kZWxlbWVudC5maW5kKGBsYWJlbFtmb3I9XCIke2lkfVwiXWApO1xyXG5cclxuICAgICAgaWYgKCEkbGFiZWwubGVuZ3RoKSB7XHJcbiAgICAgICAgJGxhYmVsID0gJChlbCkuY2xvc2VzdCgnbGFiZWwnKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gJGxhYmVsWzBdO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuICQobGFiZWxzKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgdGhlIENTUyBlcnJvciBjbGFzcyBhcyBzcGVjaWZpZWQgYnkgdGhlIEFiaWRlIHNldHRpbmdzIHRvIHRoZSBsYWJlbCwgaW5wdXQsIGFuZCB0aGUgZm9ybVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAkZWwgLSBqUXVlcnkgb2JqZWN0IHRvIGFkZCB0aGUgY2xhc3MgdG9cclxuICAgKi9cclxuICBhZGRFcnJvckNsYXNzZXMoJGVsKSB7XHJcbiAgICB2YXIgJGxhYmVsID0gdGhpcy5maW5kTGFiZWwoJGVsKTtcclxuICAgIHZhciAkZm9ybUVycm9yID0gdGhpcy5maW5kRm9ybUVycm9yKCRlbCk7XHJcblxyXG4gICAgaWYgKCRsYWJlbC5sZW5ndGgpIHtcclxuICAgICAgJGxhYmVsLmFkZENsYXNzKHRoaXMub3B0aW9ucy5sYWJlbEVycm9yQ2xhc3MpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICgkZm9ybUVycm9yLmxlbmd0aCkge1xyXG4gICAgICAkZm9ybUVycm9yLmFkZENsYXNzKHRoaXMub3B0aW9ucy5mb3JtRXJyb3JDbGFzcyk7XHJcbiAgICB9XHJcblxyXG4gICAgJGVsLmFkZENsYXNzKHRoaXMub3B0aW9ucy5pbnB1dEVycm9yQ2xhc3MpLmF0dHIoJ2RhdGEtaW52YWxpZCcsICcnKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZSBDU1MgZXJyb3IgY2xhc3NlcyBldGMgZnJvbSBhbiBlbnRpcmUgcmFkaW8gYnV0dG9uIGdyb3VwXHJcbiAgICogQHBhcmFtIHtTdHJpbmd9IGdyb3VwTmFtZSAtIEEgc3RyaW5nIHRoYXQgc3BlY2lmaWVzIHRoZSBuYW1lIG9mIGEgcmFkaW8gYnV0dG9uIGdyb3VwXHJcbiAgICpcclxuICAgKi9cclxuXHJcbiAgcmVtb3ZlUmFkaW9FcnJvckNsYXNzZXMoZ3JvdXBOYW1lKSB7XHJcbiAgICB2YXIgJGVscyA9IHRoaXMuJGVsZW1lbnQuZmluZChgOnJhZGlvW25hbWU9XCIke2dyb3VwTmFtZX1cIl1gKTtcclxuICAgIHZhciAkbGFiZWxzID0gdGhpcy5maW5kUmFkaW9MYWJlbHMoJGVscyk7XHJcbiAgICB2YXIgJGZvcm1FcnJvcnMgPSB0aGlzLmZpbmRGb3JtRXJyb3IoJGVscyk7XHJcblxyXG4gICAgaWYgKCRsYWJlbHMubGVuZ3RoKSB7XHJcbiAgICAgICRsYWJlbHMucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmxhYmVsRXJyb3JDbGFzcyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCRmb3JtRXJyb3JzLmxlbmd0aCkge1xyXG4gICAgICAkZm9ybUVycm9ycy5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuZm9ybUVycm9yQ2xhc3MpO1xyXG4gICAgfVxyXG5cclxuICAgICRlbHMucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmlucHV0RXJyb3JDbGFzcykucmVtb3ZlQXR0cignZGF0YS1pbnZhbGlkJyk7XHJcblxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBDU1MgZXJyb3IgY2xhc3MgYXMgc3BlY2lmaWVkIGJ5IHRoZSBBYmlkZSBzZXR0aW5ncyBmcm9tIHRoZSBsYWJlbCwgaW5wdXQsIGFuZCB0aGUgZm9ybVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAkZWwgLSBqUXVlcnkgb2JqZWN0IHRvIHJlbW92ZSB0aGUgY2xhc3MgZnJvbVxyXG4gICAqL1xyXG4gIHJlbW92ZUVycm9yQ2xhc3NlcygkZWwpIHtcclxuICAgIC8vIHJhZGlvcyBuZWVkIHRvIGNsZWFyIGFsbCBvZiB0aGUgZWxzXHJcbiAgICBpZigkZWxbMF0udHlwZSA9PSAncmFkaW8nKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnJlbW92ZVJhZGlvRXJyb3JDbGFzc2VzKCRlbC5hdHRyKCduYW1lJykpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciAkbGFiZWwgPSB0aGlzLmZpbmRMYWJlbCgkZWwpO1xyXG4gICAgdmFyICRmb3JtRXJyb3IgPSB0aGlzLmZpbmRGb3JtRXJyb3IoJGVsKTtcclxuXHJcbiAgICBpZiAoJGxhYmVsLmxlbmd0aCkge1xyXG4gICAgICAkbGFiZWwucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmxhYmVsRXJyb3JDbGFzcyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCRmb3JtRXJyb3IubGVuZ3RoKSB7XHJcbiAgICAgICRmb3JtRXJyb3IucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmZvcm1FcnJvckNsYXNzKTtcclxuICAgIH1cclxuXHJcbiAgICAkZWwucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmlucHV0RXJyb3JDbGFzcykucmVtb3ZlQXR0cignZGF0YS1pbnZhbGlkJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHb2VzIHRocm91Z2ggYSBmb3JtIHRvIGZpbmQgaW5wdXRzIGFuZCBwcm9jZWVkcyB0byB2YWxpZGF0ZSB0aGVtIGluIHdheXMgc3BlY2lmaWMgdG8gdGhlaXIgdHlwZVxyXG4gICAqIEBmaXJlcyBBYmlkZSNpbnZhbGlkXHJcbiAgICogQGZpcmVzIEFiaWRlI3ZhbGlkXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHZhbGlkYXRlLCBzaG91bGQgYmUgYW4gSFRNTCBpbnB1dFxyXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBnb29kVG9HbyAtIElmIHRoZSBpbnB1dCBpcyB2YWxpZCBvciBub3QuXHJcbiAgICovXHJcbiAgdmFsaWRhdGVJbnB1dCgkZWwpIHtcclxuICAgIHZhciBjbGVhclJlcXVpcmUgPSB0aGlzLnJlcXVpcmVkQ2hlY2soJGVsKSxcclxuICAgICAgICB2YWxpZGF0ZWQgPSBmYWxzZSxcclxuICAgICAgICBjdXN0b21WYWxpZGF0b3IgPSB0cnVlLFxyXG4gICAgICAgIHZhbGlkYXRvciA9ICRlbC5hdHRyKCdkYXRhLXZhbGlkYXRvcicpLFxyXG4gICAgICAgIGVxdWFsVG8gPSB0cnVlO1xyXG5cclxuICAgIHN3aXRjaCAoJGVsWzBdLnR5cGUpIHtcclxuICAgICAgY2FzZSAncmFkaW8nOlxyXG4gICAgICAgIHZhbGlkYXRlZCA9IHRoaXMudmFsaWRhdGVSYWRpbygkZWwuYXR0cignbmFtZScpKTtcclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgJ2NoZWNrYm94JzpcclxuICAgICAgICB2YWxpZGF0ZWQgPSBjbGVhclJlcXVpcmU7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlICdzZWxlY3QnOlxyXG4gICAgICBjYXNlICdzZWxlY3Qtb25lJzpcclxuICAgICAgY2FzZSAnc2VsZWN0LW11bHRpcGxlJzpcclxuICAgICAgICB2YWxpZGF0ZWQgPSBjbGVhclJlcXVpcmU7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHZhbGlkYXRlZCA9IHRoaXMudmFsaWRhdGVUZXh0KCRlbCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICBjdXN0b21WYWxpZGF0b3IgPSB0aGlzLm1hdGNoVmFsaWRhdGlvbigkZWwsIHZhbGlkYXRvciwgJGVsLmF0dHIoJ3JlcXVpcmVkJykpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICgkZWwuYXR0cignZGF0YS1lcXVhbHRvJykpIHtcclxuICAgICAgZXF1YWxUbyA9IHRoaXMub3B0aW9ucy52YWxpZGF0b3JzLmVxdWFsVG8oJGVsKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgdmFyIGdvb2RUb0dvID0gW2NsZWFyUmVxdWlyZSwgdmFsaWRhdGVkLCBjdXN0b21WYWxpZGF0b3IsIGVxdWFsVG9dLmluZGV4T2YoZmFsc2UpID09PSAtMTtcclxuICAgIHZhciBtZXNzYWdlID0gKGdvb2RUb0dvID8gJ3ZhbGlkJyA6ICdpbnZhbGlkJykgKyAnLnpmLmFiaWRlJztcclxuXHJcbiAgICB0aGlzW2dvb2RUb0dvID8gJ3JlbW92ZUVycm9yQ2xhc3NlcycgOiAnYWRkRXJyb3JDbGFzc2VzJ10oJGVsKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gdGhlIGlucHV0IGlzIGRvbmUgY2hlY2tpbmcgZm9yIHZhbGlkYXRpb24uIEV2ZW50IHRyaWdnZXIgaXMgZWl0aGVyIGB2YWxpZC56Zi5hYmlkZWAgb3IgYGludmFsaWQuemYuYWJpZGVgXHJcbiAgICAgKiBUcmlnZ2VyIGluY2x1ZGVzIHRoZSBET00gZWxlbWVudCBvZiB0aGUgaW5wdXQuXHJcbiAgICAgKiBAZXZlbnQgQWJpZGUjdmFsaWRcclxuICAgICAqIEBldmVudCBBYmlkZSNpbnZhbGlkXHJcbiAgICAgKi9cclxuICAgICRlbC50cmlnZ2VyKG1lc3NhZ2UsIFskZWxdKTtcclxuXHJcbiAgICByZXR1cm4gZ29vZFRvR287XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHb2VzIHRocm91Z2ggYSBmb3JtIGFuZCBpZiB0aGVyZSBhcmUgYW55IGludmFsaWQgaW5wdXRzLCBpdCB3aWxsIGRpc3BsYXkgdGhlIGZvcm0gZXJyb3IgZWxlbWVudFxyXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBub0Vycm9yIC0gdHJ1ZSBpZiBubyBlcnJvcnMgd2VyZSBkZXRlY3RlZC4uLlxyXG4gICAqIEBmaXJlcyBBYmlkZSNmb3JtdmFsaWRcclxuICAgKiBAZmlyZXMgQWJpZGUjZm9ybWludmFsaWRcclxuICAgKi9cclxuICB2YWxpZGF0ZUZvcm0oKSB7XHJcbiAgICB2YXIgYWNjID0gW107XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMuJGlucHV0cy5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICBhY2MucHVzaChfdGhpcy52YWxpZGF0ZUlucHV0KCQodGhpcykpKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciBub0Vycm9yID0gYWNjLmluZGV4T2YoZmFsc2UpID09PSAtMTtcclxuXHJcbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLWFiaWRlLWVycm9yXScpLmNzcygnZGlzcGxheScsIChub0Vycm9yID8gJ25vbmUnIDogJ2Jsb2NrJykpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB0aGUgZm9ybSBpcyBmaW5pc2hlZCB2YWxpZGF0aW5nLiBFdmVudCB0cmlnZ2VyIGlzIGVpdGhlciBgZm9ybXZhbGlkLnpmLmFiaWRlYCBvciBgZm9ybWludmFsaWQuemYuYWJpZGVgLlxyXG4gICAgICogVHJpZ2dlciBpbmNsdWRlcyB0aGUgZWxlbWVudCBvZiB0aGUgZm9ybS5cclxuICAgICAqIEBldmVudCBBYmlkZSNmb3JtdmFsaWRcclxuICAgICAqIEBldmVudCBBYmlkZSNmb3JtaW52YWxpZFxyXG4gICAgICovXHJcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoKG5vRXJyb3IgPyAnZm9ybXZhbGlkJyA6ICdmb3JtaW52YWxpZCcpICsgJy56Zi5hYmlkZScsIFt0aGlzLiRlbGVtZW50XSk7XHJcblxyXG4gICAgcmV0dXJuIG5vRXJyb3I7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgb3IgYSBub3QgYSB0ZXh0IGlucHV0IGlzIHZhbGlkIGJhc2VkIG9uIHRoZSBwYXR0ZXJuIHNwZWNpZmllZCBpbiB0aGUgYXR0cmlidXRlLiBJZiBubyBtYXRjaGluZyBwYXR0ZXJuIGlzIGZvdW5kLCByZXR1cm5zIHRydWUuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICRlbCAtIGpRdWVyeSBvYmplY3QgdG8gdmFsaWRhdGUsIHNob3VsZCBiZSBhIHRleHQgaW5wdXQgSFRNTCBlbGVtZW50XHJcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdHRlcm4gLSBzdHJpbmcgdmFsdWUgb2Ygb25lIG9mIHRoZSBSZWdFeCBwYXR0ZXJucyBpbiBBYmlkZS5vcHRpb25zLnBhdHRlcm5zXHJcbiAgICogQHJldHVybnMge0Jvb2xlYW59IEJvb2xlYW4gdmFsdWUgZGVwZW5kcyBvbiB3aGV0aGVyIG9yIG5vdCB0aGUgaW5wdXQgdmFsdWUgbWF0Y2hlcyB0aGUgcGF0dGVybiBzcGVjaWZpZWRcclxuICAgKi9cclxuICB2YWxpZGF0ZVRleHQoJGVsLCBwYXR0ZXJuKSB7XHJcbiAgICAvLyBBIHBhdHRlcm4gY2FuIGJlIHBhc3NlZCB0byB0aGlzIGZ1bmN0aW9uLCBvciBpdCB3aWxsIGJlIGluZmVyZWQgZnJvbSB0aGUgaW5wdXQncyBcInBhdHRlcm5cIiBhdHRyaWJ1dGUsIG9yIGl0J3MgXCJ0eXBlXCIgYXR0cmlidXRlXHJcbiAgICBwYXR0ZXJuID0gKHBhdHRlcm4gfHwgJGVsLmF0dHIoJ3BhdHRlcm4nKSB8fCAkZWwuYXR0cigndHlwZScpKTtcclxuICAgIHZhciBpbnB1dFRleHQgPSAkZWwudmFsKCk7XHJcbiAgICB2YXIgdmFsaWQgPSBmYWxzZTtcclxuXHJcbiAgICBpZiAoaW5wdXRUZXh0Lmxlbmd0aCkge1xyXG4gICAgICAvLyBJZiB0aGUgcGF0dGVybiBhdHRyaWJ1dGUgb24gdGhlIGVsZW1lbnQgaXMgaW4gQWJpZGUncyBsaXN0IG9mIHBhdHRlcm5zLCB0aGVuIHRlc3QgdGhhdCByZWdleHBcclxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYXR0ZXJucy5oYXNPd25Qcm9wZXJ0eShwYXR0ZXJuKSkge1xyXG4gICAgICAgIHZhbGlkID0gdGhpcy5vcHRpb25zLnBhdHRlcm5zW3BhdHRlcm5dLnRlc3QoaW5wdXRUZXh0KTtcclxuICAgICAgfVxyXG4gICAgICAvLyBJZiB0aGUgcGF0dGVybiBuYW1lIGlzbid0IGFsc28gdGhlIHR5cGUgYXR0cmlidXRlIG9mIHRoZSBmaWVsZCwgdGhlbiB0ZXN0IGl0IGFzIGEgcmVnZXhwXHJcbiAgICAgIGVsc2UgaWYgKHBhdHRlcm4gIT09ICRlbC5hdHRyKCd0eXBlJykpIHtcclxuICAgICAgICB2YWxpZCA9IG5ldyBSZWdFeHAocGF0dGVybikudGVzdChpbnB1dFRleHQpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHZhbGlkID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gQW4gZW1wdHkgZmllbGQgaXMgdmFsaWQgaWYgaXQncyBub3QgcmVxdWlyZWRcclxuICAgIGVsc2UgaWYgKCEkZWwucHJvcCgncmVxdWlyZWQnKSkge1xyXG4gICAgICB2YWxpZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHZhbGlkO1xyXG4gICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERldGVybWluZXMgd2hldGhlciBvciBhIG5vdCBhIHJhZGlvIGlucHV0IGlzIHZhbGlkIGJhc2VkIG9uIHdoZXRoZXIgb3Igbm90IGl0IGlzIHJlcXVpcmVkIGFuZCBzZWxlY3RlZC4gQWx0aG91Z2ggdGhlIGZ1bmN0aW9uIHRhcmdldHMgYSBzaW5nbGUgYDxpbnB1dD5gLCBpdCB2YWxpZGF0ZXMgYnkgY2hlY2tpbmcgdGhlIGByZXF1aXJlZGAgYW5kIGBjaGVja2VkYCBwcm9wZXJ0aWVzIG9mIGFsbCByYWRpbyBidXR0b25zIGluIGl0cyBncm91cC5cclxuICAgKiBAcGFyYW0ge1N0cmluZ30gZ3JvdXBOYW1lIC0gQSBzdHJpbmcgdGhhdCBzcGVjaWZpZXMgdGhlIG5hbWUgb2YgYSByYWRpbyBidXR0b24gZ3JvdXBcclxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gQm9vbGVhbiB2YWx1ZSBkZXBlbmRzIG9uIHdoZXRoZXIgb3Igbm90IGF0IGxlYXN0IG9uZSByYWRpbyBpbnB1dCBoYXMgYmVlbiBzZWxlY3RlZCAoaWYgaXQncyByZXF1aXJlZClcclxuICAgKi9cclxuICB2YWxpZGF0ZVJhZGlvKGdyb3VwTmFtZSkge1xyXG4gICAgLy8gSWYgYXQgbGVhc3Qgb25lIHJhZGlvIGluIHRoZSBncm91cCBoYXMgdGhlIGByZXF1aXJlZGAgYXR0cmlidXRlLCB0aGUgZ3JvdXAgaXMgY29uc2lkZXJlZCByZXF1aXJlZFxyXG4gICAgLy8gUGVyIFczQyBzcGVjLCBhbGwgcmFkaW8gYnV0dG9ucyBpbiBhIGdyb3VwIHNob3VsZCBoYXZlIGByZXF1aXJlZGAsIGJ1dCB3ZSdyZSBiZWluZyBuaWNlXHJcbiAgICB2YXIgJGdyb3VwID0gdGhpcy4kZWxlbWVudC5maW5kKGA6cmFkaW9bbmFtZT1cIiR7Z3JvdXBOYW1lfVwiXWApO1xyXG4gICAgdmFyIHZhbGlkID0gZmFsc2U7XHJcblxyXG4gICAgLy8gLmF0dHIoKSByZXR1cm5zIHVuZGVmaW5lZCBpZiBubyBlbGVtZW50cyBpbiAkZ3JvdXAgaGF2ZSB0aGUgYXR0cmlidXRlIFwicmVxdWlyZWRcIlxyXG4gICAgaWYgKCRncm91cC5hdHRyKCdyZXF1aXJlZCcpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdmFsaWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZvciB0aGUgZ3JvdXAgdG8gYmUgdmFsaWQsIGF0IGxlYXN0IG9uZSByYWRpbyBuZWVkcyB0byBiZSBjaGVja2VkXHJcbiAgICAkZ3JvdXAuZWFjaCgoaSwgZSkgPT4ge1xyXG4gICAgICBpZiAoJChlKS5wcm9wKCdjaGVja2VkJykpIHtcclxuICAgICAgICB2YWxpZCA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB2YWxpZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERldGVybWluZXMgaWYgYSBzZWxlY3RlZCBpbnB1dCBwYXNzZXMgYSBjdXN0b20gdmFsaWRhdGlvbiBmdW5jdGlvbi4gTXVsdGlwbGUgdmFsaWRhdGlvbnMgY2FuIGJlIHVzZWQsIGlmIHBhc3NlZCB0byB0aGUgZWxlbWVudCB3aXRoIGBkYXRhLXZhbGlkYXRvcj1cImZvbyBiYXIgYmF6XCJgIGluIGEgc3BhY2Ugc2VwYXJhdGVkIGxpc3RlZC5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gJGVsIC0galF1ZXJ5IGlucHV0IGVsZW1lbnQuXHJcbiAgICogQHBhcmFtIHtTdHJpbmd9IHZhbGlkYXRvcnMgLSBhIHN0cmluZyBvZiBmdW5jdGlvbiBuYW1lcyBtYXRjaGluZyBmdW5jdGlvbnMgaW4gdGhlIEFiaWRlLm9wdGlvbnMudmFsaWRhdG9ycyBvYmplY3QuXHJcbiAgICogQHBhcmFtIHtCb29sZWFufSByZXF1aXJlZCAtIHNlbGYgZXhwbGFuYXRvcnk/XHJcbiAgICogQHJldHVybnMge0Jvb2xlYW59IC0gdHJ1ZSBpZiB2YWxpZGF0aW9ucyBwYXNzZWQuXHJcbiAgICovXHJcbiAgbWF0Y2hWYWxpZGF0aW9uKCRlbCwgdmFsaWRhdG9ycywgcmVxdWlyZWQpIHtcclxuICAgIHJlcXVpcmVkID0gcmVxdWlyZWQgPyB0cnVlIDogZmFsc2U7XHJcblxyXG4gICAgdmFyIGNsZWFyID0gdmFsaWRhdG9ycy5zcGxpdCgnICcpLm1hcCgodikgPT4ge1xyXG4gICAgICByZXR1cm4gdGhpcy5vcHRpb25zLnZhbGlkYXRvcnNbdl0oJGVsLCByZXF1aXJlZCwgJGVsLnBhcmVudCgpKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGNsZWFyLmluZGV4T2YoZmFsc2UpID09PSAtMTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc2V0cyBmb3JtIGlucHV0cyBhbmQgc3R5bGVzXHJcbiAgICogQGZpcmVzIEFiaWRlI2Zvcm1yZXNldFxyXG4gICAqL1xyXG4gIHJlc2V0Rm9ybSgpIHtcclxuICAgIHZhciAkZm9ybSA9IHRoaXMuJGVsZW1lbnQsXHJcbiAgICAgICAgb3B0cyA9IHRoaXMub3B0aW9ucztcclxuXHJcbiAgICAkKGAuJHtvcHRzLmxhYmVsRXJyb3JDbGFzc31gLCAkZm9ybSkubm90KCdzbWFsbCcpLnJlbW92ZUNsYXNzKG9wdHMubGFiZWxFcnJvckNsYXNzKTtcclxuICAgICQoYC4ke29wdHMuaW5wdXRFcnJvckNsYXNzfWAsICRmb3JtKS5ub3QoJ3NtYWxsJykucmVtb3ZlQ2xhc3Mob3B0cy5pbnB1dEVycm9yQ2xhc3MpO1xyXG4gICAgJChgJHtvcHRzLmZvcm1FcnJvclNlbGVjdG9yfS4ke29wdHMuZm9ybUVycm9yQ2xhc3N9YCkucmVtb3ZlQ2xhc3Mob3B0cy5mb3JtRXJyb3JDbGFzcyk7XHJcbiAgICAkZm9ybS5maW5kKCdbZGF0YS1hYmlkZS1lcnJvcl0nKS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xyXG4gICAgJCgnOmlucHV0JywgJGZvcm0pLm5vdCgnOmJ1dHRvbiwgOnN1Ym1pdCwgOnJlc2V0LCA6aGlkZGVuLCBbZGF0YS1hYmlkZS1pZ25vcmVdJykudmFsKCcnKS5yZW1vdmVBdHRyKCdkYXRhLWludmFsaWQnKTtcclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB0aGUgZm9ybSBoYXMgYmVlbiByZXNldC5cclxuICAgICAqIEBldmVudCBBYmlkZSNmb3JtcmVzZXRcclxuICAgICAqL1xyXG4gICAgJGZvcm0udHJpZ2dlcignZm9ybXJlc2V0LnpmLmFiaWRlJywgWyRmb3JtXSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiBBYmlkZS5cclxuICAgKiBSZW1vdmVzIGVycm9yIHN0eWxlcyBhbmQgY2xhc3NlcyBmcm9tIGVsZW1lbnRzLCB3aXRob3V0IHJlc2V0dGluZyB0aGVpciB2YWx1ZXMuXHJcbiAgICovXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICB0aGlzLiRlbGVtZW50XHJcbiAgICAgIC5vZmYoJy5hYmlkZScpXHJcbiAgICAgIC5maW5kKCdbZGF0YS1hYmlkZS1lcnJvcl0nKVxyXG4gICAgICAgIC5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xyXG5cclxuICAgIHRoaXMuJGlucHV0c1xyXG4gICAgICAub2ZmKCcuYWJpZGUnKVxyXG4gICAgICAuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICBfdGhpcy5yZW1vdmVFcnJvckNsYXNzZXMoJCh0aGlzKSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZWZhdWx0IHNldHRpbmdzIGZvciBwbHVnaW5cclxuICovXHJcbkFiaWRlLmRlZmF1bHRzID0ge1xyXG4gIC8qKlxyXG4gICAqIFRoZSBkZWZhdWx0IGV2ZW50IHRvIHZhbGlkYXRlIGlucHV0cy4gQ2hlY2tib3hlcyBhbmQgcmFkaW9zIHZhbGlkYXRlIGltbWVkaWF0ZWx5LlxyXG4gICAqIFJlbW92ZSBvciBjaGFuZ2UgdGhpcyB2YWx1ZSBmb3IgbWFudWFsIHZhbGlkYXRpb24uXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICdmaWVsZENoYW5nZSdcclxuICAgKi9cclxuICB2YWxpZGF0ZU9uOiAnZmllbGRDaGFuZ2UnLFxyXG5cclxuICAvKipcclxuICAgKiBDbGFzcyB0byBiZSBhcHBsaWVkIHRvIGlucHV0IGxhYmVscyBvbiBmYWlsZWQgdmFsaWRhdGlvbi5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ2lzLWludmFsaWQtbGFiZWwnXHJcbiAgICovXHJcbiAgbGFiZWxFcnJvckNsYXNzOiAnaXMtaW52YWxpZC1sYWJlbCcsXHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIHRvIGJlIGFwcGxpZWQgdG8gaW5wdXRzIG9uIGZhaWxlZCB2YWxpZGF0aW9uLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnaXMtaW52YWxpZC1pbnB1dCdcclxuICAgKi9cclxuICBpbnB1dEVycm9yQ2xhc3M6ICdpcy1pbnZhbGlkLWlucHV0JyxcclxuXHJcbiAgLyoqXHJcbiAgICogQ2xhc3Mgc2VsZWN0b3IgdG8gdXNlIHRvIHRhcmdldCBGb3JtIEVycm9ycyBmb3Igc2hvdy9oaWRlLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnLmZvcm0tZXJyb3InXHJcbiAgICovXHJcbiAgZm9ybUVycm9yU2VsZWN0b3I6ICcuZm9ybS1lcnJvcicsXHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIGFkZGVkIHRvIEZvcm0gRXJyb3JzIG9uIGZhaWxlZCB2YWxpZGF0aW9uLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnaXMtdmlzaWJsZSdcclxuICAgKi9cclxuICBmb3JtRXJyb3JDbGFzczogJ2lzLXZpc2libGUnLFxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdG8gdHJ1ZSB0byB2YWxpZGF0ZSB0ZXh0IGlucHV0cyBvbiBhbnkgdmFsdWUgY2hhbmdlLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAqL1xyXG4gIGxpdmVWYWxpZGF0ZTogZmFsc2UsXHJcblxyXG4gIHBhdHRlcm5zOiB7XHJcbiAgICBhbHBoYSA6IC9eW2EtekEtWl0rJC8sXHJcbiAgICBhbHBoYV9udW1lcmljIDogL15bYS16QS1aMC05XSskLyxcclxuICAgIGludGVnZXIgOiAvXlstK10/XFxkKyQvLFxyXG4gICAgbnVtYmVyIDogL15bLStdP1xcZCooPzpbXFwuXFwsXVxcZCspPyQvLFxyXG5cclxuICAgIC8vIGFtZXgsIHZpc2EsIGRpbmVyc1xyXG4gICAgY2FyZCA6IC9eKD86NFswLTldezEyfSg/OlswLTldezN9KT98NVsxLTVdWzAtOV17MTR9fDYoPzowMTF8NVswLTldWzAtOV0pWzAtOV17MTJ9fDNbNDddWzAtOV17MTN9fDMoPzowWzAtNV18WzY4XVswLTldKVswLTldezExfXwoPzoyMTMxfDE4MDB8MzVcXGR7M30pXFxkezExfSkkLyxcclxuICAgIGN2diA6IC9eKFswLTldKXszLDR9JC8sXHJcblxyXG4gICAgLy8gaHR0cDovL3d3dy53aGF0d2cub3JnL3NwZWNzL3dlYi1hcHBzL2N1cnJlbnQtd29yay9tdWx0aXBhZ2Uvc3RhdGVzLW9mLXRoZS10eXBlLWF0dHJpYnV0ZS5odG1sI3ZhbGlkLWUtbWFpbC1hZGRyZXNzXHJcbiAgICBlbWFpbCA6IC9eW2EtekEtWjAtOS4hIyQlJicqK1xcLz0/Xl9ge3x9fi1dK0BbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8oPzpcXC5bYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8pKyQvLFxyXG5cclxuICAgIHVybCA6IC9eKGh0dHBzP3xmdHB8ZmlsZXxzc2gpOlxcL1xcLygoKChbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoJVtcXGRhLWZdezJ9KXxbIVxcJCYnXFwoXFwpXFwqXFwrLDs9XXw6KSpAKT8oKChcXGR8WzEtOV1cXGR8MVxcZFxcZHwyWzAtNF1cXGR8MjVbMC01XSlcXC4oXFxkfFsxLTldXFxkfDFcXGRcXGR8MlswLTRdXFxkfDI1WzAtNV0pXFwuKFxcZHxbMS05XVxcZHwxXFxkXFxkfDJbMC00XVxcZHwyNVswLTVdKVxcLihcXGR8WzEtOV1cXGR8MVxcZFxcZHwyWzAtNF1cXGR8MjVbMC01XSkpfCgoKFthLXpBLVpdfFxcZHxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KChbYS16QS1aXXxcXGR8W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKihbYS16QS1aXXxcXGR8W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKSlcXC4pKygoW2EtekEtWl18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCgoW2EtekEtWl18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKihbYS16QS1aXXxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkpKVxcLj8pKDpcXGQqKT8pKFxcLygoKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDp8QCkrKFxcLygoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KCVbXFxkYS1mXXsyfSl8WyFcXCQmJ1xcKFxcKVxcKlxcKyw7PV18OnxAKSopKik/KT8oXFw/KCgoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KCVbXFxkYS1mXXsyfSl8WyFcXCQmJ1xcKFxcKVxcKlxcKyw7PV18OnxAKXxbXFx1RTAwMC1cXHVGOEZGXXxcXC98XFw/KSopPyhcXCMoKChbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoJVtcXGRhLWZdezJ9KXxbIVxcJCYnXFwoXFwpXFwqXFwrLDs9XXw6fEApfFxcL3xcXD8pKik/JC8sXHJcbiAgICAvLyBhYmMuZGVcclxuICAgIGRvbWFpbiA6IC9eKFthLXpBLVowLTldKFthLXpBLVowLTlcXC1dezAsNjF9W2EtekEtWjAtOV0pP1xcLikrW2EtekEtWl17Miw4fSQvLFxyXG5cclxuICAgIGRhdGV0aW1lIDogL14oWzAtMl1bMC05XXszfSlcXC0oWzAtMV1bMC05XSlcXC0oWzAtM11bMC05XSlUKFswLTVdWzAtOV0pXFw6KFswLTVdWzAtOV0pXFw6KFswLTVdWzAtOV0pKFp8KFtcXC1cXCtdKFswLTFdWzAtOV0pXFw6MDApKSQvLFxyXG4gICAgLy8gWVlZWS1NTS1ERFxyXG4gICAgZGF0ZSA6IC8oPzoxOXwyMClbMC05XXsyfS0oPzooPzowWzEtOV18MVswLTJdKS0oPzowWzEtOV18MVswLTldfDJbMC05XSl8KD86KD8hMDIpKD86MFsxLTldfDFbMC0yXSktKD86MzApKXwoPzooPzowWzEzNTc4XXwxWzAyXSktMzEpKSQvLFxyXG4gICAgLy8gSEg6TU06U1NcclxuICAgIHRpbWUgOiAvXigwWzAtOV18MVswLTldfDJbMC0zXSkoOlswLTVdWzAtOV0pezJ9JC8sXHJcbiAgICBkYXRlSVNPIDogL15cXGR7NH1bXFwvXFwtXVxcZHsxLDJ9W1xcL1xcLV1cXGR7MSwyfSQvLFxyXG4gICAgLy8gTU0vREQvWVlZWVxyXG4gICAgbW9udGhfZGF5X3llYXIgOiAvXigwWzEtOV18MVswMTJdKVstIFxcLy5dKDBbMS05XXxbMTJdWzAtOV18M1swMV0pWy0gXFwvLl1cXGR7NH0kLyxcclxuICAgIC8vIEREL01NL1lZWVlcclxuICAgIGRheV9tb250aF95ZWFyIDogL14oMFsxLTldfFsxMl1bMC05XXwzWzAxXSlbLSBcXC8uXSgwWzEtOV18MVswMTJdKVstIFxcLy5dXFxkezR9JC8sXHJcblxyXG4gICAgLy8gI0ZGRiBvciAjRkZGRkZGXHJcbiAgICBjb2xvciA6IC9eIz8oW2EtZkEtRjAtOV17Nn18W2EtZkEtRjAtOV17M30pJC9cclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBPcHRpb25hbCB2YWxpZGF0aW9uIGZ1bmN0aW9ucyB0byBiZSB1c2VkLiBgZXF1YWxUb2AgYmVpbmcgdGhlIG9ubHkgZGVmYXVsdCBpbmNsdWRlZCBmdW5jdGlvbi5cclxuICAgKiBGdW5jdGlvbnMgc2hvdWxkIHJldHVybiBvbmx5IGEgYm9vbGVhbiBpZiB0aGUgaW5wdXQgaXMgdmFsaWQgb3Igbm90LiBGdW5jdGlvbnMgYXJlIGdpdmVuIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxyXG4gICAqIGVsIDogVGhlIGpRdWVyeSBlbGVtZW50IHRvIHZhbGlkYXRlLlxyXG4gICAqIHJlcXVpcmVkIDogQm9vbGVhbiB2YWx1ZSBvZiB0aGUgcmVxdWlyZWQgYXR0cmlidXRlIGJlIHByZXNlbnQgb3Igbm90LlxyXG4gICAqIHBhcmVudCA6IFRoZSBkaXJlY3QgcGFyZW50IG9mIHRoZSBpbnB1dC5cclxuICAgKiBAb3B0aW9uXHJcbiAgICovXHJcbiAgdmFsaWRhdG9yczoge1xyXG4gICAgZXF1YWxUbzogZnVuY3Rpb24gKGVsLCByZXF1aXJlZCwgcGFyZW50KSB7XHJcbiAgICAgIHJldHVybiAkKGAjJHtlbC5hdHRyKCdkYXRhLWVxdWFsdG8nKX1gKS52YWwoKSA9PT0gZWwudmFsKCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4vLyBXaW5kb3cgZXhwb3J0c1xyXG5Gb3VuZGF0aW9uLnBsdWdpbihBYmlkZSwgJ0FiaWRlJyk7XHJcblxyXG59KGpRdWVyeSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG4vKipcclxuICogQWNjb3JkaW9uIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmFjY29yZGlvblxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uXHJcbiAqL1xyXG5cclxuY2xhc3MgQWNjb3JkaW9uIHtcclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFuIGFjY29yZGlvbi5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAZmlyZXMgQWNjb3JkaW9uI2luaXRcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGFuIGFjY29yZGlvbi5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIGEgcGxhaW4gb2JqZWN0IHdpdGggc2V0dGluZ3MgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHQgb3B0aW9ucy5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcclxuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBBY2NvcmRpb24uZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcclxuXHJcbiAgICB0aGlzLl9pbml0KCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnQWNjb3JkaW9uJyk7XHJcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdBY2NvcmRpb24nLCB7XHJcbiAgICAgICdFTlRFUic6ICd0b2dnbGUnLFxyXG4gICAgICAnU1BBQ0UnOiAndG9nZ2xlJyxcclxuICAgICAgJ0FSUk9XX0RPV04nOiAnbmV4dCcsXHJcbiAgICAgICdBUlJPV19VUCc6ICdwcmV2aW91cydcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIGFjY29yZGlvbiBieSBhbmltYXRpbmcgdGhlIHByZXNldCBhY3RpdmUgcGFuZShzKS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9pbml0KCkge1xyXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdyb2xlJywgJ3RhYmxpc3QnKTtcclxuICAgIHRoaXMuJHRhYnMgPSB0aGlzLiRlbGVtZW50LmNoaWxkcmVuKCdsaSwgW2RhdGEtYWNjb3JkaW9uLWl0ZW1dJyk7XHJcblxyXG4gICAgdGhpcy4kdGFicy5lYWNoKGZ1bmN0aW9uKGlkeCwgZWwpIHtcclxuICAgICAgdmFyICRlbCA9ICQoZWwpLFxyXG4gICAgICAgICAgJGNvbnRlbnQgPSAkZWwuY2hpbGRyZW4oJ1tkYXRhLXRhYi1jb250ZW50XScpLFxyXG4gICAgICAgICAgaWQgPSAkY29udGVudFswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdhY2NvcmRpb24nKSxcclxuICAgICAgICAgIGxpbmtJZCA9IGVsLmlkIHx8IGAke2lkfS1sYWJlbGA7XHJcblxyXG4gICAgICAkZWwuZmluZCgnYTpmaXJzdCcpLmF0dHIoe1xyXG4gICAgICAgICdhcmlhLWNvbnRyb2xzJzogaWQsXHJcbiAgICAgICAgJ3JvbGUnOiAndGFiJyxcclxuICAgICAgICAnaWQnOiBsaW5rSWQsXHJcbiAgICAgICAgJ2FyaWEtZXhwYW5kZWQnOiBmYWxzZSxcclxuICAgICAgICAnYXJpYS1zZWxlY3RlZCc6IGZhbHNlXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgJGNvbnRlbnQuYXR0cih7J3JvbGUnOiAndGFicGFuZWwnLCAnYXJpYS1sYWJlbGxlZGJ5JzogbGlua0lkLCAnYXJpYS1oaWRkZW4nOiB0cnVlLCAnaWQnOiBpZH0pO1xyXG4gICAgfSk7XHJcbiAgICB2YXIgJGluaXRBY3RpdmUgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5pcy1hY3RpdmUnKS5jaGlsZHJlbignW2RhdGEtdGFiLWNvbnRlbnRdJyk7XHJcbiAgICBpZigkaW5pdEFjdGl2ZS5sZW5ndGgpe1xyXG4gICAgICB0aGlzLmRvd24oJGluaXRBY3RpdmUsIHRydWUpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5fZXZlbnRzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIGZvciBpdGVtcyB3aXRoaW4gdGhlIGFjY29yZGlvbi5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9ldmVudHMoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMuJHRhYnMuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgdmFyICRlbGVtID0gJCh0aGlzKTtcclxuICAgICAgdmFyICR0YWJDb250ZW50ID0gJGVsZW0uY2hpbGRyZW4oJ1tkYXRhLXRhYi1jb250ZW50XScpO1xyXG4gICAgICBpZiAoJHRhYkNvbnRlbnQubGVuZ3RoKSB7XHJcbiAgICAgICAgJGVsZW0uY2hpbGRyZW4oJ2EnKS5vZmYoJ2NsaWNrLnpmLmFjY29yZGlvbiBrZXlkb3duLnpmLmFjY29yZGlvbicpXHJcbiAgICAgICAgICAgICAgIC5vbignY2xpY2suemYuYWNjb3JkaW9uJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIC8vICQodGhpcykuY2hpbGRyZW4oJ2EnKS5vbignY2xpY2suemYuYWNjb3JkaW9uJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgaWYgKCRlbGVtLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSkge1xyXG4gICAgICAgICAgICBpZihfdGhpcy5vcHRpb25zLmFsbG93QWxsQ2xvc2VkIHx8ICRlbGVtLnNpYmxpbmdzKCkuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKXtcclxuICAgICAgICAgICAgICBfdGhpcy51cCgkdGFiQ29udGVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBfdGhpcy5kb3duKCR0YWJDb250ZW50KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KS5vbigna2V5ZG93bi56Zi5hY2NvcmRpb24nLCBmdW5jdGlvbihlKXtcclxuICAgICAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdBY2NvcmRpb24nLCB7XHJcbiAgICAgICAgICAgIHRvZ2dsZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgX3RoaXMudG9nZ2xlKCR0YWJDb250ZW50KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgdmFyICRhID0gJGVsZW0ubmV4dCgpLmZpbmQoJ2EnKS5mb2N1cygpO1xyXG4gICAgICAgICAgICAgIGlmICghX3RoaXMub3B0aW9ucy5tdWx0aUV4cGFuZCkge1xyXG4gICAgICAgICAgICAgICAgJGEudHJpZ2dlcignY2xpY2suemYuYWNjb3JkaW9uJylcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHByZXZpb3VzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICB2YXIgJGEgPSAkZWxlbS5wcmV2KCkuZmluZCgnYScpLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgaWYgKCFfdGhpcy5vcHRpb25zLm11bHRpRXhwYW5kKSB7XHJcbiAgICAgICAgICAgICAgICAkYS50cmlnZ2VyKCdjbGljay56Zi5hY2NvcmRpb24nKVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaGFuZGxlZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRvZ2dsZXMgdGhlIHNlbGVjdGVkIGNvbnRlbnQgcGFuZSdzIG9wZW4vY2xvc2Ugc3RhdGUuXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSBqUXVlcnkgb2JqZWN0IG9mIHRoZSBwYW5lIHRvIHRvZ2dsZS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICB0b2dnbGUoJHRhcmdldCkge1xyXG4gICAgaWYoJHRhcmdldC5wYXJlbnQoKS5oYXNDbGFzcygnaXMtYWN0aXZlJykpIHtcclxuICAgICAgaWYodGhpcy5vcHRpb25zLmFsbG93QWxsQ2xvc2VkIHx8ICR0YXJnZXQucGFyZW50KCkuc2libGluZ3MoKS5oYXNDbGFzcygnaXMtYWN0aXZlJykpe1xyXG4gICAgICAgIHRoaXMudXAoJHRhcmdldCk7XHJcbiAgICAgIH0gZWxzZSB7IHJldHVybjsgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5kb3duKCR0YXJnZXQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT3BlbnMgdGhlIGFjY29yZGlvbiB0YWIgZGVmaW5lZCBieSBgJHRhcmdldGAuXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSBBY2NvcmRpb24gcGFuZSB0byBvcGVuLlxyXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gZmlyc3RUaW1lIC0gZmxhZyB0byBkZXRlcm1pbmUgaWYgcmVmbG93IHNob3VsZCBoYXBwZW4uXHJcbiAgICogQGZpcmVzIEFjY29yZGlvbiNkb3duXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgZG93bigkdGFyZ2V0LCBmaXJzdFRpbWUpIHtcclxuICAgIGlmICghdGhpcy5vcHRpb25zLm11bHRpRXhwYW5kICYmICFmaXJzdFRpbWUpIHtcclxuICAgICAgdmFyICRjdXJyZW50QWN0aXZlID0gdGhpcy4kZWxlbWVudC5jaGlsZHJlbignLmlzLWFjdGl2ZScpLmNoaWxkcmVuKCdbZGF0YS10YWItY29udGVudF0nKTtcclxuICAgICAgaWYoJGN1cnJlbnRBY3RpdmUubGVuZ3RoKXtcclxuICAgICAgICB0aGlzLnVwKCRjdXJyZW50QWN0aXZlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgICR0YXJnZXRcclxuICAgICAgLmF0dHIoJ2FyaWEtaGlkZGVuJywgZmFsc2UpXHJcbiAgICAgIC5wYXJlbnQoJ1tkYXRhLXRhYi1jb250ZW50XScpXHJcbiAgICAgIC5hZGRCYWNrKClcclxuICAgICAgLnBhcmVudCgpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuXHJcbiAgICAkdGFyZ2V0LnNsaWRlRG93bih0aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgKCkgPT4ge1xyXG4gICAgICAvKipcclxuICAgICAgICogRmlyZXMgd2hlbiB0aGUgdGFiIGlzIGRvbmUgb3BlbmluZy5cclxuICAgICAgICogQGV2ZW50IEFjY29yZGlvbiNkb3duXHJcbiAgICAgICAqL1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2Rvd24uemYuYWNjb3JkaW9uJywgWyR0YXJnZXRdKTtcclxuICAgIH0pO1xyXG5cclxuICAgICQoYCMkeyR0YXJnZXQuYXR0cignYXJpYS1sYWJlbGxlZGJ5Jyl9YCkuYXR0cih7XHJcbiAgICAgICdhcmlhLWV4cGFuZGVkJzogdHJ1ZSxcclxuICAgICAgJ2FyaWEtc2VsZWN0ZWQnOiB0cnVlXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsb3NlcyB0aGUgdGFiIGRlZmluZWQgYnkgYCR0YXJnZXRgLlxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0gQWNjb3JkaW9uIHRhYiB0byBjbG9zZS5cclxuICAgKiBAZmlyZXMgQWNjb3JkaW9uI3VwXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgdXAoJHRhcmdldCkge1xyXG4gICAgdmFyICRhdW50cyA9ICR0YXJnZXQucGFyZW50KCkuc2libGluZ3MoKSxcclxuICAgICAgICBfdGhpcyA9IHRoaXM7XHJcbiAgICB2YXIgY2FuQ2xvc2UgPSB0aGlzLm9wdGlvbnMubXVsdGlFeHBhbmQgPyAkYXVudHMuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpIDogJHRhcmdldC5wYXJlbnQoKS5oYXNDbGFzcygnaXMtYWN0aXZlJyk7XHJcblxyXG4gICAgaWYoIXRoaXMub3B0aW9ucy5hbGxvd0FsbENsb3NlZCAmJiAhY2FuQ2xvc2UpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZvdW5kYXRpb24uTW92ZSh0aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgJHRhcmdldCwgZnVuY3Rpb24oKXtcclxuICAgICAgJHRhcmdldC5zbGlkZVVwKF90aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIHRhYiBpcyBkb25lIGNvbGxhcHNpbmcgdXAuXHJcbiAgICAgICAgICogQGV2ZW50IEFjY29yZGlvbiN1cFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIF90aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3VwLnpmLmFjY29yZGlvbicsIFskdGFyZ2V0XSk7XHJcbiAgICAgIH0pO1xyXG4gICAgLy8gfSk7XHJcblxyXG4gICAgJHRhcmdldC5hdHRyKCdhcmlhLWhpZGRlbicsIHRydWUpXHJcbiAgICAgICAgICAgLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuXHJcbiAgICAkKGAjJHskdGFyZ2V0LmF0dHIoJ2FyaWEtbGFiZWxsZWRieScpfWApLmF0dHIoe1xyXG4gICAgICdhcmlhLWV4cGFuZGVkJzogZmFsc2UsXHJcbiAgICAgJ2FyaWEtc2VsZWN0ZWQnOiBmYWxzZVxyXG4gICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGFuIGFjY29yZGlvbi5cclxuICAgKiBAZmlyZXMgQWNjb3JkaW9uI2Rlc3Ryb3llZFxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLXRhYi1jb250ZW50XScpLnNsaWRlVXAoMCkuY3NzKCdkaXNwbGF5JywgJycpO1xyXG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdhJykub2ZmKCcuemYuYWNjb3JkaW9uJyk7XHJcblxyXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH1cclxufVxyXG5cclxuQWNjb3JkaW9uLmRlZmF1bHRzID0ge1xyXG4gIC8qKlxyXG4gICAqIEFtb3VudCBvZiB0aW1lIHRvIGFuaW1hdGUgdGhlIG9wZW5pbmcgb2YgYW4gYWNjb3JkaW9uIHBhbmUuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDI1MFxyXG4gICAqL1xyXG4gIHNsaWRlU3BlZWQ6IDI1MCxcclxuICAvKipcclxuICAgKiBBbGxvdyB0aGUgYWNjb3JkaW9uIHRvIGhhdmUgbXVsdGlwbGUgb3BlbiBwYW5lcy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBtdWx0aUV4cGFuZDogZmFsc2UsXHJcbiAgLyoqXHJcbiAgICogQWxsb3cgdGhlIGFjY29yZGlvbiB0byBjbG9zZSBhbGwgcGFuZXMuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICovXHJcbiAgYWxsb3dBbGxDbG9zZWQ6IGZhbHNlXHJcbn07XHJcblxyXG4vLyBXaW5kb3cgZXhwb3J0c1xyXG5Gb3VuZGF0aW9uLnBsdWdpbihBY2NvcmRpb24sICdBY2NvcmRpb24nKTtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8qKlxyXG4gKiBBY2NvcmRpb25NZW51IG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmFjY29yZGlvbk1lbnVcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm5lc3RcclxuICovXHJcblxyXG5jbGFzcyBBY2NvcmRpb25NZW51IHtcclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFuIGFjY29yZGlvbiBtZW51LlxyXG4gICAqIEBjbGFzc1xyXG4gICAqIEBmaXJlcyBBY2NvcmRpb25NZW51I2luaXRcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGFuIGFjY29yZGlvbiBtZW51LlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcclxuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBBY2NvcmRpb25NZW51LmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5OZXN0LkZlYXRoZXIodGhpcy4kZWxlbWVudCwgJ2FjY29yZGlvbicpO1xyXG5cclxuICAgIHRoaXMuX2luaXQoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdBY2NvcmRpb25NZW51Jyk7XHJcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdBY2NvcmRpb25NZW51Jywge1xyXG4gICAgICAnRU5URVInOiAndG9nZ2xlJyxcclxuICAgICAgJ1NQQUNFJzogJ3RvZ2dsZScsXHJcbiAgICAgICdBUlJPV19SSUdIVCc6ICdvcGVuJyxcclxuICAgICAgJ0FSUk9XX1VQJzogJ3VwJyxcclxuICAgICAgJ0FSUk9XX0RPV04nOiAnZG93bicsXHJcbiAgICAgICdBUlJPV19MRUZUJzogJ2Nsb3NlJyxcclxuICAgICAgJ0VTQ0FQRSc6ICdjbG9zZUFsbCcsXHJcbiAgICAgICdUQUInOiAnZG93bicsXHJcbiAgICAgICdTSElGVF9UQUInOiAndXAnXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIGFjY29yZGlvbiBtZW51IGJ5IGhpZGluZyBhbGwgbmVzdGVkIG1lbnVzLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2luaXQoKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLXN1Ym1lbnVdJykubm90KCcuaXMtYWN0aXZlJykuc2xpZGVVcCgwKTsvLy5maW5kKCdhJykuY3NzKCdwYWRkaW5nLWxlZnQnLCAnMXJlbScpO1xyXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKHtcclxuICAgICAgJ3JvbGUnOiAndGFibGlzdCcsXHJcbiAgICAgICdhcmlhLW11bHRpc2VsZWN0YWJsZSc6IHRoaXMub3B0aW9ucy5tdWx0aU9wZW5cclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuJG1lbnVMaW5rcyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLmlzLWFjY29yZGlvbi1zdWJtZW51LXBhcmVudCcpO1xyXG4gICAgdGhpcy4kbWVudUxpbmtzLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgdmFyIGxpbmtJZCA9IHRoaXMuaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnYWNjLW1lbnUtbGluaycpLFxyXG4gICAgICAgICAgJGVsZW0gPSAkKHRoaXMpLFxyXG4gICAgICAgICAgJHN1YiA9ICRlbGVtLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpLFxyXG4gICAgICAgICAgc3ViSWQgPSAkc3ViWzBdLmlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2FjYy1tZW51JyksXHJcbiAgICAgICAgICBpc0FjdGl2ZSA9ICRzdWIuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAkZWxlbS5hdHRyKHtcclxuICAgICAgICAnYXJpYS1jb250cm9scyc6IHN1YklkLFxyXG4gICAgICAgICdhcmlhLWV4cGFuZGVkJzogaXNBY3RpdmUsXHJcbiAgICAgICAgJ3JvbGUnOiAndGFiJyxcclxuICAgICAgICAnaWQnOiBsaW5rSWRcclxuICAgICAgfSk7XHJcbiAgICAgICRzdWIuYXR0cih7XHJcbiAgICAgICAgJ2FyaWEtbGFiZWxsZWRieSc6IGxpbmtJZCxcclxuICAgICAgICAnYXJpYS1oaWRkZW4nOiAhaXNBY3RpdmUsXHJcbiAgICAgICAgJ3JvbGUnOiAndGFicGFuZWwnLFxyXG4gICAgICAgICdpZCc6IHN1YklkXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICB2YXIgaW5pdFBhbmVzID0gdGhpcy4kZWxlbWVudC5maW5kKCcuaXMtYWN0aXZlJyk7XHJcbiAgICBpZihpbml0UGFuZXMubGVuZ3RoKXtcclxuICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgaW5pdFBhbmVzLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgICBfdGhpcy5kb3duKCQodGhpcykpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIHRoaXMuX2V2ZW50cygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyBmb3IgaXRlbXMgd2l0aGluIHRoZSBtZW51LlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2V2ZW50cygpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdsaScpLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciAkc3VibWVudSA9ICQodGhpcykuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJyk7XHJcblxyXG4gICAgICBpZiAoJHN1Ym1lbnUubGVuZ3RoKSB7XHJcbiAgICAgICAgJCh0aGlzKS5jaGlsZHJlbignYScpLm9mZignY2xpY2suemYuYWNjb3JkaW9uTWVudScpLm9uKCdjbGljay56Zi5hY2NvcmRpb25NZW51JywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAgIF90aGlzLnRvZ2dsZSgkc3VibWVudSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pLm9uKCdrZXlkb3duLnpmLmFjY29yZGlvbm1lbnUnLCBmdW5jdGlvbihlKXtcclxuICAgICAgdmFyICRlbGVtZW50ID0gJCh0aGlzKSxcclxuICAgICAgICAgICRlbGVtZW50cyA9ICRlbGVtZW50LnBhcmVudCgndWwnKS5jaGlsZHJlbignbGknKSxcclxuICAgICAgICAgICRwcmV2RWxlbWVudCxcclxuICAgICAgICAgICRuZXh0RWxlbWVudCxcclxuICAgICAgICAgICR0YXJnZXQgPSAkZWxlbWVudC5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKTtcclxuXHJcbiAgICAgICRlbGVtZW50cy5lYWNoKGZ1bmN0aW9uKGkpIHtcclxuICAgICAgICBpZiAoJCh0aGlzKS5pcygkZWxlbWVudCkpIHtcclxuICAgICAgICAgICRwcmV2RWxlbWVudCA9ICRlbGVtZW50cy5lcShNYXRoLm1heCgwLCBpLTEpKS5maW5kKCdhJykuZmlyc3QoKTtcclxuICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50cy5lcShNYXRoLm1pbihpKzEsICRlbGVtZW50cy5sZW5ndGgtMSkpLmZpbmQoJ2EnKS5maXJzdCgpO1xyXG5cclxuICAgICAgICAgIGlmICgkKHRoaXMpLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XTp2aXNpYmxlJykubGVuZ3RoKSB7IC8vIGhhcyBvcGVuIHN1YiBtZW51XHJcbiAgICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50LmZpbmQoJ2xpOmZpcnN0LWNoaWxkJykuZmluZCgnYScpLmZpcnN0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoJCh0aGlzKS5pcygnOmZpcnN0LWNoaWxkJykpIHsgLy8gaXMgZmlyc3QgZWxlbWVudCBvZiBzdWIgbWVudVxyXG4gICAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkZWxlbWVudC5wYXJlbnRzKCdsaScpLmZpcnN0KCkuZmluZCgnYScpLmZpcnN0KCk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKCRwcmV2RWxlbWVudC5jaGlsZHJlbignW2RhdGEtc3VibWVudV06dmlzaWJsZScpLmxlbmd0aCkgeyAvLyBpZiBwcmV2aW91cyBlbGVtZW50IGhhcyBvcGVuIHN1YiBtZW51XHJcbiAgICAgICAgICAgICRwcmV2RWxlbWVudCA9ICRwcmV2RWxlbWVudC5maW5kKCdsaTpsYXN0LWNoaWxkJykuZmluZCgnYScpLmZpcnN0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoJCh0aGlzKS5pcygnOmxhc3QtY2hpbGQnKSkgeyAvLyBpcyBsYXN0IGVsZW1lbnQgb2Ygc3ViIG1lbnVcclxuICAgICAgICAgICAgJG5leHRFbGVtZW50ID0gJGVsZW1lbnQucGFyZW50cygnbGknKS5maXJzdCgpLm5leHQoJ2xpJykuZmluZCgnYScpLmZpcnN0KCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdBY2NvcmRpb25NZW51Jywge1xyXG4gICAgICAgIG9wZW46IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYgKCR0YXJnZXQuaXMoJzpoaWRkZW4nKSkge1xyXG4gICAgICAgICAgICBfdGhpcy5kb3duKCR0YXJnZXQpO1xyXG4gICAgICAgICAgICAkdGFyZ2V0LmZpbmQoJ2xpJykuZmlyc3QoKS5maW5kKCdhJykuZmlyc3QoKS5mb2N1cygpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYgKCR0YXJnZXQubGVuZ3RoICYmICEkdGFyZ2V0LmlzKCc6aGlkZGVuJykpIHsgLy8gY2xvc2UgYWN0aXZlIHN1YiBvZiB0aGlzIGl0ZW1cclxuICAgICAgICAgICAgX3RoaXMudXAoJHRhcmdldCk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKCRlbGVtZW50LnBhcmVudCgnW2RhdGEtc3VibWVudV0nKS5sZW5ndGgpIHsgLy8gY2xvc2UgY3VycmVudGx5IG9wZW4gc3ViXHJcbiAgICAgICAgICAgIF90aGlzLnVwKCRlbGVtZW50LnBhcmVudCgnW2RhdGEtc3VibWVudV0nKSk7XHJcbiAgICAgICAgICAgICRlbGVtZW50LnBhcmVudHMoJ2xpJykuZmlyc3QoKS5maW5kKCdhJykuZmlyc3QoKS5mb2N1cygpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdXA6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgJHByZXZFbGVtZW50LmF0dHIoJ3RhYmluZGV4JywgLTEpLmZvY3VzKCk7XHJcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkb3duOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICRuZXh0RWxlbWVudC5hdHRyKCd0YWJpbmRleCcsIC0xKS5mb2N1cygpO1xyXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdG9nZ2xlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmICgkZWxlbWVudC5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgX3RoaXMudG9nZ2xlKCRlbGVtZW50LmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGNsb3NlQWxsOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIF90aGlzLmhpZGVBbGwoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhhbmRsZWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7Ly8uYXR0cigndGFiaW5kZXgnLCAwKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsb3NlcyBhbGwgcGFuZXMgb2YgdGhlIG1lbnUuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgaGlkZUFsbCgpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtc3VibWVudV0nKS5zbGlkZVVwKHRoaXMub3B0aW9ucy5zbGlkZVNwZWVkKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRvZ2dsZXMgdGhlIG9wZW4vY2xvc2Ugc3RhdGUgb2YgYSBzdWJtZW51LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0gdGhlIHN1Ym1lbnUgdG8gdG9nZ2xlXHJcbiAgICovXHJcbiAgdG9nZ2xlKCR0YXJnZXQpe1xyXG4gICAgaWYoISR0YXJnZXQuaXMoJzphbmltYXRlZCcpKSB7XHJcbiAgICAgIGlmICghJHRhcmdldC5pcygnOmhpZGRlbicpKSB7XHJcbiAgICAgICAgdGhpcy51cCgkdGFyZ2V0KTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLmRvd24oJHRhcmdldCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE9wZW5zIHRoZSBzdWItbWVudSBkZWZpbmVkIGJ5IGAkdGFyZ2V0YC5cclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIFN1Yi1tZW51IHRvIG9wZW4uXHJcbiAgICogQGZpcmVzIEFjY29yZGlvbk1lbnUjZG93blxyXG4gICAqL1xyXG4gIGRvd24oJHRhcmdldCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICBpZighdGhpcy5vcHRpb25zLm11bHRpT3Blbikge1xyXG4gICAgICB0aGlzLnVwKHRoaXMuJGVsZW1lbnQuZmluZCgnLmlzLWFjdGl2ZScpLm5vdCgkdGFyZ2V0LnBhcmVudHNVbnRpbCh0aGlzLiRlbGVtZW50KS5hZGQoJHRhcmdldCkpKTtcclxuICAgIH1cclxuXHJcbiAgICAkdGFyZ2V0LmFkZENsYXNzKCdpcy1hY3RpdmUnKS5hdHRyKHsnYXJpYS1oaWRkZW4nOiBmYWxzZX0pXHJcbiAgICAgIC5wYXJlbnQoJy5pcy1hY2NvcmRpb24tc3VibWVudS1wYXJlbnQnKS5hdHRyKHsnYXJpYS1leHBhbmRlZCc6IHRydWV9KTtcclxuXHJcbiAgICAgIEZvdW5kYXRpb24uTW92ZSh0aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgJHRhcmdldCwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJHRhcmdldC5zbGlkZURvd24oX3RoaXMub3B0aW9ucy5zbGlkZVNwZWVkLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAvKipcclxuICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG1lbnUgaXMgZG9uZSBvcGVuaW5nLlxyXG4gICAgICAgICAgICogQGV2ZW50IEFjY29yZGlvbk1lbnUjZG93blxyXG4gICAgICAgICAgICovXHJcbiAgICAgICAgICBfdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdkb3duLnpmLmFjY29yZGlvbk1lbnUnLCBbJHRhcmdldF0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsb3NlcyB0aGUgc3ViLW1lbnUgZGVmaW5lZCBieSBgJHRhcmdldGAuIEFsbCBzdWItbWVudXMgaW5zaWRlIHRoZSB0YXJnZXQgd2lsbCBiZSBjbG9zZWQgYXMgd2VsbC5cclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIFN1Yi1tZW51IHRvIGNsb3NlLlxyXG4gICAqIEBmaXJlcyBBY2NvcmRpb25NZW51I3VwXHJcbiAgICovXHJcbiAgdXAoJHRhcmdldCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIEZvdW5kYXRpb24uTW92ZSh0aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgJHRhcmdldCwgZnVuY3Rpb24oKXtcclxuICAgICAgJHRhcmdldC5zbGlkZVVwKF90aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG1lbnUgaXMgZG9uZSBjb2xsYXBzaW5nIHVwLlxyXG4gICAgICAgICAqIEBldmVudCBBY2NvcmRpb25NZW51I3VwXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgX3RoaXMuJGVsZW1lbnQudHJpZ2dlcigndXAuemYuYWNjb3JkaW9uTWVudScsIFskdGFyZ2V0XSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyICRtZW51cyA9ICR0YXJnZXQuZmluZCgnW2RhdGEtc3VibWVudV0nKS5zbGlkZVVwKDApLmFkZEJhY2soKS5hdHRyKCdhcmlhLWhpZGRlbicsIHRydWUpO1xyXG5cclxuICAgICRtZW51cy5wYXJlbnQoJy5pcy1hY2NvcmRpb24tc3VibWVudS1wYXJlbnQnKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgZmFsc2UpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgYWNjb3JkaW9uIG1lbnUuXHJcbiAgICogQGZpcmVzIEFjY29yZGlvbk1lbnUjZGVzdHJveWVkXHJcbiAgICovXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtc3VibWVudV0nKS5zbGlkZURvd24oMCkuY3NzKCdkaXNwbGF5JywgJycpO1xyXG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdhJykub2ZmKCdjbGljay56Zi5hY2NvcmRpb25NZW51Jyk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5OZXN0LkJ1cm4odGhpcy4kZWxlbWVudCwgJ2FjY29yZGlvbicpO1xyXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH1cclxufVxyXG5cclxuQWNjb3JkaW9uTWVudS5kZWZhdWx0cyA9IHtcclxuICAvKipcclxuICAgKiBBbW91bnQgb2YgdGltZSB0byBhbmltYXRlIHRoZSBvcGVuaW5nIG9mIGEgc3VibWVudSBpbiBtcy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgMjUwXHJcbiAgICovXHJcbiAgc2xpZGVTcGVlZDogMjUwLFxyXG4gIC8qKlxyXG4gICAqIEFsbG93IHRoZSBtZW51IHRvIGhhdmUgbXVsdGlwbGUgb3BlbiBwYW5lcy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAqL1xyXG4gIG11bHRpT3BlbjogdHJ1ZVxyXG59O1xyXG5cclxuLy8gV2luZG93IGV4cG9ydHNcclxuRm91bmRhdGlvbi5wbHVnaW4oQWNjb3JkaW9uTWVudSwgJ0FjY29yZGlvbk1lbnUnKTtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8qKlxyXG4gKiBEcmlsbGRvd24gbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uZHJpbGxkb3duXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb25cclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5uZXN0XHJcbiAqL1xyXG5cclxuY2xhc3MgRHJpbGxkb3duIHtcclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGEgZHJpbGxkb3duIG1lbnUuXHJcbiAgICogQGNsYXNzXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhbiBhY2NvcmRpb24gbWVudS5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgRHJpbGxkb3duLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5OZXN0LkZlYXRoZXIodGhpcy4kZWxlbWVudCwgJ2RyaWxsZG93bicpO1xyXG5cclxuICAgIHRoaXMuX2luaXQoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdEcmlsbGRvd24nKTtcclxuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ0RyaWxsZG93bicsIHtcclxuICAgICAgJ0VOVEVSJzogJ29wZW4nLFxyXG4gICAgICAnU1BBQ0UnOiAnb3BlbicsXHJcbiAgICAgICdBUlJPV19SSUdIVCc6ICduZXh0JyxcclxuICAgICAgJ0FSUk9XX1VQJzogJ3VwJyxcclxuICAgICAgJ0FSUk9XX0RPV04nOiAnZG93bicsXHJcbiAgICAgICdBUlJPV19MRUZUJzogJ3ByZXZpb3VzJyxcclxuICAgICAgJ0VTQ0FQRSc6ICdjbG9zZScsXHJcbiAgICAgICdUQUInOiAnZG93bicsXHJcbiAgICAgICdTSElGVF9UQUInOiAndXAnXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBkcmlsbGRvd24gYnkgY3JlYXRpbmcgalF1ZXJ5IGNvbGxlY3Rpb25zIG9mIGVsZW1lbnRzXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfaW5pdCgpIHtcclxuICAgIHRoaXMuJHN1Ym1lbnVBbmNob3JzID0gdGhpcy4kZWxlbWVudC5maW5kKCdsaS5pcy1kcmlsbGRvd24tc3VibWVudS1wYXJlbnQnKS5jaGlsZHJlbignYScpO1xyXG4gICAgdGhpcy4kc3VibWVudXMgPSB0aGlzLiRzdWJtZW51QW5jaG9ycy5wYXJlbnQoJ2xpJykuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJyk7XHJcbiAgICB0aGlzLiRtZW51SXRlbXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2xpJykubm90KCcuanMtZHJpbGxkb3duLWJhY2snKS5hdHRyKCdyb2xlJywgJ21lbnVpdGVtJykuZmluZCgnYScpO1xyXG5cclxuICAgIHRoaXMuX3ByZXBhcmVNZW51KCk7XHJcblxyXG4gICAgdGhpcy5fa2V5Ym9hcmRFdmVudHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIHByZXBhcmVzIGRyaWxsZG93biBtZW51IGJ5IHNldHRpbmcgYXR0cmlidXRlcyB0byBsaW5rcyBhbmQgZWxlbWVudHNcclxuICAgKiBzZXRzIGEgbWluIGhlaWdodCB0byBwcmV2ZW50IGNvbnRlbnQganVtcGluZ1xyXG4gICAqIHdyYXBzIHRoZSBlbGVtZW50IGlmIG5vdCBhbHJlYWR5IHdyYXBwZWRcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIF9wcmVwYXJlTWVudSgpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAvLyBpZighdGhpcy5vcHRpb25zLmhvbGRPcGVuKXtcclxuICAgIC8vICAgdGhpcy5fbWVudUxpbmtFdmVudHMoKTtcclxuICAgIC8vIH1cclxuICAgIHRoaXMuJHN1Ym1lbnVBbmNob3JzLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgdmFyICRzdWIgPSAkKHRoaXMpO1xyXG4gICAgICB2YXIgJGxpbmsgPSAkc3ViLmZpbmQoJ2E6Zmlyc3QnKTtcclxuICAgICAgaWYoX3RoaXMub3B0aW9ucy5wYXJlbnRMaW5rKXtcclxuICAgICAgICAkbGluay5jbG9uZSgpLnByZXBlbmRUbygkc3ViLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpKS53cmFwKCc8bGkgY2xhc3M9XCJpcy1zdWJtZW51LXBhcmVudC1pdGVtIGlzLXN1Ym1lbnUtaXRlbSBpcy1kcmlsbGRvd24tc3VibWVudS1pdGVtXCIgcm9sZT1cIm1lbnUtaXRlbVwiPjwvbGk+Jyk7XHJcbiAgICAgIH1cclxuICAgICAgJGxpbmsuZGF0YSgnc2F2ZWRIcmVmJywgJGxpbmsuYXR0cignaHJlZicpKS5yZW1vdmVBdHRyKCdocmVmJyk7XHJcbiAgICAgICRzdWIuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJylcclxuICAgICAgICAgIC5hdHRyKHtcclxuICAgICAgICAgICAgJ2FyaWEtaGlkZGVuJzogdHJ1ZSxcclxuICAgICAgICAgICAgJ3RhYmluZGV4JzogMCxcclxuICAgICAgICAgICAgJ3JvbGUnOiAnbWVudSdcclxuICAgICAgICAgIH0pO1xyXG4gICAgICBfdGhpcy5fZXZlbnRzKCRzdWIpO1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLiRzdWJtZW51cy5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgIHZhciAkbWVudSA9ICQodGhpcyksXHJcbiAgICAgICAgICAkYmFjayA9ICRtZW51LmZpbmQoJy5qcy1kcmlsbGRvd24tYmFjaycpO1xyXG4gICAgICBpZighJGJhY2subGVuZ3RoKXtcclxuICAgICAgICAkbWVudS5wcmVwZW5kKF90aGlzLm9wdGlvbnMuYmFja0J1dHRvbik7XHJcbiAgICAgIH1cclxuICAgICAgX3RoaXMuX2JhY2soJG1lbnUpO1xyXG4gICAgfSk7XHJcbiAgICBpZighdGhpcy4kZWxlbWVudC5wYXJlbnQoKS5oYXNDbGFzcygnaXMtZHJpbGxkb3duJykpe1xyXG4gICAgICB0aGlzLiR3cmFwcGVyID0gJCh0aGlzLm9wdGlvbnMud3JhcHBlcikuYWRkQ2xhc3MoJ2lzLWRyaWxsZG93bicpLmNzcyh0aGlzLl9nZXRNYXhEaW1zKCkpO1xyXG4gICAgICB0aGlzLiRlbGVtZW50LndyYXAodGhpcy4kd3JhcHBlcik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIHRvIGVsZW1lbnRzIGluIHRoZSBtZW51LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtIC0gdGhlIGN1cnJlbnQgbWVudSBpdGVtIHRvIGFkZCBoYW5kbGVycyB0by5cclxuICAgKi9cclxuICBfZXZlbnRzKCRlbGVtKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgICRlbGVtLm9mZignY2xpY2suemYuZHJpbGxkb3duJylcclxuICAgIC5vbignY2xpY2suemYuZHJpbGxkb3duJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgIGlmKCQoZS50YXJnZXQpLnBhcmVudHNVbnRpbCgndWwnLCAnbGknKS5oYXNDbGFzcygnaXMtZHJpbGxkb3duLXN1Ym1lbnUtcGFyZW50Jykpe1xyXG4gICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBpZihlLnRhcmdldCAhPT0gZS5jdXJyZW50VGFyZ2V0LmZpcnN0RWxlbWVudENoaWxkKXtcclxuICAgICAgLy8gICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIC8vIH1cclxuICAgICAgX3RoaXMuX3Nob3coJGVsZW0ucGFyZW50KCdsaScpKTtcclxuXHJcbiAgICAgIGlmKF90aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKXtcclxuICAgICAgICB2YXIgJGJvZHkgPSAkKCdib2R5Jykubm90KF90aGlzLiR3cmFwcGVyKTtcclxuICAgICAgICAkYm9keS5vZmYoJy56Zi5kcmlsbGRvd24nKS5vbignY2xpY2suemYuZHJpbGxkb3duJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICBfdGhpcy5faGlkZUFsbCgpO1xyXG4gICAgICAgICAgJGJvZHkub2ZmKCcuemYuZHJpbGxkb3duJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBrZXlkb3duIGV2ZW50IGxpc3RlbmVyIHRvIGBsaWAncyBpbiB0aGUgbWVudS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9rZXlib2FyZEV2ZW50cygpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICBcclxuICAgIHRoaXMuJG1lbnVJdGVtcy5hZGQodGhpcy4kZWxlbWVudC5maW5kKCcuanMtZHJpbGxkb3duLWJhY2sgPiBhJykpLm9uKCdrZXlkb3duLnpmLmRyaWxsZG93bicsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICBcclxuICAgICAgdmFyICRlbGVtZW50ID0gJCh0aGlzKSxcclxuICAgICAgICAgICRlbGVtZW50cyA9ICRlbGVtZW50LnBhcmVudCgnbGknKS5wYXJlbnQoJ3VsJykuY2hpbGRyZW4oJ2xpJykuY2hpbGRyZW4oJ2EnKSxcclxuICAgICAgICAgICRwcmV2RWxlbWVudCxcclxuICAgICAgICAgICRuZXh0RWxlbWVudDtcclxuXHJcbiAgICAgICRlbGVtZW50cy5lYWNoKGZ1bmN0aW9uKGkpIHtcclxuICAgICAgICBpZiAoJCh0aGlzKS5pcygkZWxlbWVudCkpIHtcclxuICAgICAgICAgICRwcmV2RWxlbWVudCA9ICRlbGVtZW50cy5lcShNYXRoLm1heCgwLCBpLTEpKTtcclxuICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50cy5lcShNYXRoLm1pbihpKzEsICRlbGVtZW50cy5sZW5ndGgtMSkpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnRHJpbGxkb3duJywge1xyXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYgKCRlbGVtZW50LmlzKF90aGlzLiRzdWJtZW51QW5jaG9ycykpIHtcclxuICAgICAgICAgICAgX3RoaXMuX3Nob3coJGVsZW1lbnQucGFyZW50KCdsaScpKTtcclxuICAgICAgICAgICAgJGVsZW1lbnQucGFyZW50KCdsaScpLm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoJGVsZW1lbnQpLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICRlbGVtZW50LnBhcmVudCgnbGknKS5maW5kKCd1bCBsaSBhJykuZmlsdGVyKF90aGlzLiRtZW51SXRlbXMpLmZpcnN0KCkuZm9jdXMoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHByZXZpb3VzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIF90aGlzLl9oaWRlKCRlbGVtZW50LnBhcmVudCgnbGknKS5wYXJlbnQoJ3VsJykpO1xyXG4gICAgICAgICAgJGVsZW1lbnQucGFyZW50KCdsaScpLnBhcmVudCgndWwnKS5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKCRlbGVtZW50KSwgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAkZWxlbWVudC5wYXJlbnQoJ2xpJykucGFyZW50KCd1bCcpLnBhcmVudCgnbGknKS5jaGlsZHJlbignYScpLmZpcnN0KCkuZm9jdXMoKTtcclxuICAgICAgICAgICAgfSwgMSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHVwOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICRwcmV2RWxlbWVudC5mb2N1cygpO1xyXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZG93bjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAkbmV4dEVsZW1lbnQuZm9jdXMoKTtcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIF90aGlzLl9iYWNrKCk7XHJcbiAgICAgICAgICAvL190aGlzLiRtZW51SXRlbXMuZmlyc3QoKS5mb2N1cygpOyAvLyBmb2N1cyB0byBmaXJzdCBlbGVtZW50XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvcGVuOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmICghJGVsZW1lbnQuaXMoX3RoaXMuJG1lbnVJdGVtcykpIHsgLy8gbm90IG1lbnUgaXRlbSBtZWFucyBiYWNrIGJ1dHRvblxyXG4gICAgICAgICAgICBfdGhpcy5faGlkZSgkZWxlbWVudC5wYXJlbnQoJ2xpJykucGFyZW50KCd1bCcpKTtcclxuICAgICAgICAgICAgJGVsZW1lbnQucGFyZW50KCdsaScpLnBhcmVudCgndWwnKS5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKCRlbGVtZW50KSwgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgJGVsZW1lbnQucGFyZW50KCdsaScpLnBhcmVudCgndWwnKS5wYXJlbnQoJ2xpJykuY2hpbGRyZW4oJ2EnKS5maXJzdCgpLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgfSwgMSk7XHJcbiAgICAgICAgICAgIH0pOyAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKCRlbGVtZW50LmlzKF90aGlzLiRzdWJtZW51QW5jaG9ycykpIHtcclxuICAgICAgICAgICAgX3RoaXMuX3Nob3coJGVsZW1lbnQucGFyZW50KCdsaScpKTtcclxuICAgICAgICAgICAgJGVsZW1lbnQucGFyZW50KCdsaScpLm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoJGVsZW1lbnQpLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICRlbGVtZW50LnBhcmVudCgnbGknKS5maW5kKCd1bCBsaSBhJykuZmlsdGVyKF90aGlzLiRtZW51SXRlbXMpLmZpcnN0KCkuZm9jdXMoKTtcclxuICAgICAgICAgICAgfSk7ICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGhhbmRsZWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7IC8vIGVuZCBrZXlib2FyZEFjY2Vzc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xvc2VzIGFsbCBvcGVuIGVsZW1lbnRzLCBhbmQgcmV0dXJucyB0byByb290IG1lbnUuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQGZpcmVzIERyaWxsZG93biNjbG9zZWRcclxuICAgKi9cclxuICBfaGlkZUFsbCgpIHtcclxuICAgIHZhciAkZWxlbSA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLmlzLWRyaWxsZG93bi1zdWJtZW51LmlzLWFjdGl2ZScpLmFkZENsYXNzKCdpcy1jbG9zaW5nJyk7XHJcbiAgICAkZWxlbS5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKCRlbGVtKSwgZnVuY3Rpb24oZSl7XHJcbiAgICAgICRlbGVtLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUgaXMtY2xvc2luZycpO1xyXG4gICAgfSk7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgbWVudSBpcyBmdWxseSBjbG9zZWQuXHJcbiAgICAgICAgICogQGV2ZW50IERyaWxsZG93biNjbG9zZWRcclxuICAgICAgICAgKi9cclxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignY2xvc2VkLnpmLmRyaWxsZG93bicpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBldmVudCBsaXN0ZW5lciBmb3IgZWFjaCBgYmFja2AgYnV0dG9uLCBhbmQgY2xvc2VzIG9wZW4gbWVudXMuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQGZpcmVzIERyaWxsZG93biNiYWNrXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtIC0gdGhlIGN1cnJlbnQgc3ViLW1lbnUgdG8gYWRkIGBiYWNrYCBldmVudC5cclxuICAgKi9cclxuICBfYmFjaygkZWxlbSkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICRlbGVtLm9mZignY2xpY2suemYuZHJpbGxkb3duJyk7XHJcbiAgICAkZWxlbS5jaGlsZHJlbignLmpzLWRyaWxsZG93bi1iYWNrJylcclxuICAgICAgLm9uKCdjbGljay56Zi5kcmlsbGRvd24nLCBmdW5jdGlvbihlKXtcclxuICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdtb3VzZXVwIG9uIGJhY2snKTtcclxuICAgICAgICBfdGhpcy5faGlkZSgkZWxlbSk7XHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBldmVudCBsaXN0ZW5lciB0byBtZW51IGl0ZW1zIHcvbyBzdWJtZW51cyB0byBjbG9zZSBvcGVuIG1lbnVzIG9uIGNsaWNrLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX21lbnVMaW5rRXZlbnRzKCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHRoaXMuJG1lbnVJdGVtcy5ub3QoJy5pcy1kcmlsbGRvd24tc3VibWVudS1wYXJlbnQnKVxyXG4gICAgICAgIC5vZmYoJ2NsaWNrLnpmLmRyaWxsZG93bicpXHJcbiAgICAgICAgLm9uKCdjbGljay56Zi5kcmlsbGRvd24nLCBmdW5jdGlvbihlKXtcclxuICAgICAgICAgIC8vIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIF90aGlzLl9oaWRlQWxsKCk7XHJcbiAgICAgICAgICB9LCAwKTtcclxuICAgICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBPcGVucyBhIHN1Ym1lbnUuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQGZpcmVzIERyaWxsZG93biNvcGVuXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtIC0gdGhlIGN1cnJlbnQgZWxlbWVudCB3aXRoIGEgc3VibWVudSB0byBvcGVuLCBpLmUuIHRoZSBgbGlgIHRhZy5cclxuICAgKi9cclxuICBfc2hvdygkZWxlbSkge1xyXG4gICAgJGVsZW0uY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJykuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG5cclxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignb3Blbi56Zi5kcmlsbGRvd24nLCBbJGVsZW1dKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBIaWRlcyBhIHN1Ym1lbnVcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAZmlyZXMgRHJpbGxkb3duI2hpZGVcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW0gLSB0aGUgY3VycmVudCBzdWItbWVudSB0byBoaWRlLCBpLmUuIHRoZSBgdWxgIHRhZy5cclxuICAgKi9cclxuICBfaGlkZSgkZWxlbSkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICRlbGVtLmFkZENsYXNzKCdpcy1jbG9zaW5nJylcclxuICAgICAgICAgLm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoJGVsZW0pLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICRlbGVtLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUgaXMtY2xvc2luZycpO1xyXG4gICAgICAgICAgICRlbGVtLmJsdXIoKTtcclxuICAgICAgICAgfSk7XHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gdGhlIHN1Ym1lbnUgaXMgaGFzIGNsb3NlZC5cclxuICAgICAqIEBldmVudCBEcmlsbGRvd24jaGlkZVxyXG4gICAgICovXHJcbiAgICAkZWxlbS50cmlnZ2VyKCdoaWRlLnpmLmRyaWxsZG93bicsIFskZWxlbV0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSXRlcmF0ZXMgdGhyb3VnaCB0aGUgbmVzdGVkIG1lbnVzIHRvIGNhbGN1bGF0ZSB0aGUgbWluLWhlaWdodCwgYW5kIG1heC13aWR0aCBmb3IgdGhlIG1lbnUuXHJcbiAgICogUHJldmVudHMgY29udGVudCBqdW1waW5nLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2dldE1heERpbXMoKSB7XHJcbiAgICB2YXIgbWF4ID0gMCwgcmVzdWx0ID0ge307XHJcbiAgICB0aGlzLiRzdWJtZW51cy5hZGQodGhpcy4kZWxlbWVudCkuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICB2YXIgbnVtT2ZFbGVtcyA9ICQodGhpcykuY2hpbGRyZW4oJ2xpJykubGVuZ3RoO1xyXG4gICAgICBtYXggPSBudW1PZkVsZW1zID4gbWF4ID8gbnVtT2ZFbGVtcyA6IG1heDtcclxuICAgIH0pO1xyXG5cclxuICAgIHJlc3VsdFsnbWluLWhlaWdodCddID0gYCR7bWF4ICogdGhpcy4kbWVudUl0ZW1zWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodH1weGA7XHJcbiAgICByZXN1bHRbJ21heC13aWR0aCddID0gYCR7dGhpcy4kZWxlbWVudFswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aH1weGA7XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIHRoZSBEcmlsbGRvd24gTWVudVxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLl9oaWRlQWxsKCk7XHJcbiAgICBGb3VuZGF0aW9uLk5lc3QuQnVybih0aGlzLiRlbGVtZW50LCAnZHJpbGxkb3duJyk7XHJcbiAgICB0aGlzLiRlbGVtZW50LnVud3JhcCgpXHJcbiAgICAgICAgICAgICAgICAgLmZpbmQoJy5qcy1kcmlsbGRvd24tYmFjaywgLmlzLXN1Ym1lbnUtcGFyZW50LWl0ZW0nKS5yZW1vdmUoKVxyXG4gICAgICAgICAgICAgICAgIC5lbmQoKS5maW5kKCcuaXMtYWN0aXZlLCAuaXMtY2xvc2luZywgLmlzLWRyaWxsZG93bi1zdWJtZW51JykucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZSBpcy1jbG9zaW5nIGlzLWRyaWxsZG93bi1zdWJtZW51JylcclxuICAgICAgICAgICAgICAgICAuZW5kKCkuZmluZCgnW2RhdGEtc3VibWVudV0nKS5yZW1vdmVBdHRyKCdhcmlhLWhpZGRlbiB0YWJpbmRleCByb2xlJylcclxuICAgICAgICAgICAgICAgICAub2ZmKCcuemYuZHJpbGxkb3duJykuZW5kKCkub2ZmKCd6Zi5kcmlsbGRvd24nKTtcclxuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnYScpLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgdmFyICRsaW5rID0gJCh0aGlzKTtcclxuICAgICAgaWYoJGxpbmsuZGF0YSgnc2F2ZWRIcmVmJykpe1xyXG4gICAgICAgICRsaW5rLmF0dHIoJ2hyZWYnLCAkbGluay5kYXRhKCdzYXZlZEhyZWYnKSkucmVtb3ZlRGF0YSgnc2F2ZWRIcmVmJyk7XHJcbiAgICAgIH1lbHNleyByZXR1cm47IH1cclxuICAgIH0pO1xyXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH07XHJcbn1cclxuXHJcbkRyaWxsZG93bi5kZWZhdWx0cyA9IHtcclxuICAvKipcclxuICAgKiBNYXJrdXAgdXNlZCBmb3IgSlMgZ2VuZXJhdGVkIGJhY2sgYnV0dG9uLiBQcmVwZW5kZWQgdG8gc3VibWVudSBsaXN0cyBhbmQgZGVsZXRlZCBvbiBgZGVzdHJveWAgbWV0aG9kLCAnanMtZHJpbGxkb3duLWJhY2snIGNsYXNzIHJlcXVpcmVkLiBSZW1vdmUgdGhlIGJhY2tzbGFzaCAoYFxcYCkgaWYgY29weSBhbmQgcGFzdGluZy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJzxcXGxpPjxcXGE+QmFjazxcXC9hPjxcXC9saT4nXHJcbiAgICovXHJcbiAgYmFja0J1dHRvbjogJzxsaSBjbGFzcz1cImpzLWRyaWxsZG93bi1iYWNrXCI+PGEgdGFiaW5kZXg9XCIwXCI+QmFjazwvYT48L2xpPicsXHJcbiAgLyoqXHJcbiAgICogTWFya3VwIHVzZWQgdG8gd3JhcCBkcmlsbGRvd24gbWVudS4gVXNlIGEgY2xhc3MgbmFtZSBmb3IgaW5kZXBlbmRlbnQgc3R5bGluZzsgdGhlIEpTIGFwcGxpZWQgY2xhc3M6IGBpcy1kcmlsbGRvd25gIGlzIHJlcXVpcmVkLiBSZW1vdmUgdGhlIGJhY2tzbGFzaCAoYFxcYCkgaWYgY29weSBhbmQgcGFzdGluZy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJzxcXGRpdiBjbGFzcz1cImlzLWRyaWxsZG93blwiPjxcXC9kaXY+J1xyXG4gICAqL1xyXG4gIHdyYXBwZXI6ICc8ZGl2PjwvZGl2PicsXHJcbiAgLyoqXHJcbiAgICogQWRkcyB0aGUgcGFyZW50IGxpbmsgdG8gdGhlIHN1Ym1lbnUuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICovXHJcbiAgcGFyZW50TGluazogZmFsc2UsXHJcbiAgLyoqXHJcbiAgICogQWxsb3cgdGhlIG1lbnUgdG8gcmV0dXJuIHRvIHJvb3QgbGlzdCBvbiBib2R5IGNsaWNrLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAqL1xyXG4gIGNsb3NlT25DbGljazogZmFsc2VcclxuICAvLyBob2xkT3BlbjogZmFsc2VcclxufTtcclxuXHJcbi8vIFdpbmRvdyBleHBvcnRzXHJcbkZvdW5kYXRpb24ucGx1Z2luKERyaWxsZG93biwgJ0RyaWxsZG93bicpO1xyXG5cclxufShqUXVlcnkpOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG4vKipcclxuICogRHJvcGRvd24gbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uZHJvcGRvd25cclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmJveFxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXHJcbiAqL1xyXG5cclxuY2xhc3MgRHJvcGRvd24ge1xyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSBkcm9wZG93bi5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGEgZHJvcGRvd24uXHJcbiAgICogICAgICAgIE9iamVjdCBzaG91bGQgYmUgb2YgdGhlIGRyb3Bkb3duIHBhbmVsLCByYXRoZXIgdGhhbiBpdHMgYW5jaG9yLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcclxuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBEcm9wZG93bi5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xyXG4gICAgdGhpcy5faW5pdCgpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0Ryb3Bkb3duJyk7XHJcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdEcm9wZG93bicsIHtcclxuICAgICAgJ0VOVEVSJzogJ29wZW4nLFxyXG4gICAgICAnU1BBQ0UnOiAnb3BlbicsXHJcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnLFxyXG4gICAgICAnVEFCJzogJ3RhYl9mb3J3YXJkJyxcclxuICAgICAgJ1NISUZUX1RBQic6ICd0YWJfYmFja3dhcmQnXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBwbHVnaW4gYnkgc2V0dGluZy9jaGVja2luZyBvcHRpb25zIGFuZCBhdHRyaWJ1dGVzLCBhZGRpbmcgaGVscGVyIHZhcmlhYmxlcywgYW5kIHNhdmluZyB0aGUgYW5jaG9yLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2luaXQoKSB7XHJcbiAgICB2YXIgJGlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdpZCcpO1xyXG5cclxuICAgIHRoaXMuJGFuY2hvciA9ICQoYFtkYXRhLXRvZ2dsZT1cIiR7JGlkfVwiXWApIHx8ICQoYFtkYXRhLW9wZW49XCIkeyRpZH1cIl1gKTtcclxuICAgIHRoaXMuJGFuY2hvci5hdHRyKHtcclxuICAgICAgJ2FyaWEtY29udHJvbHMnOiAkaWQsXHJcbiAgICAgICdkYXRhLWlzLWZvY3VzJzogZmFsc2UsXHJcbiAgICAgICdkYXRhLXlldGktYm94JzogJGlkLFxyXG4gICAgICAnYXJpYS1oYXNwb3B1cCc6IHRydWUsXHJcbiAgICAgICdhcmlhLWV4cGFuZGVkJzogZmFsc2VcclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLm9wdGlvbnMucG9zaXRpb25DbGFzcyA9IHRoaXMuZ2V0UG9zaXRpb25DbGFzcygpO1xyXG4gICAgdGhpcy5jb3VudGVyID0gNDtcclxuICAgIHRoaXMudXNlZFBvc2l0aW9ucyA9IFtdO1xyXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKHtcclxuICAgICAgJ2FyaWEtaGlkZGVuJzogJ3RydWUnLFxyXG4gICAgICAnZGF0YS15ZXRpLWJveCc6ICRpZCxcclxuICAgICAgJ2RhdGEtcmVzaXplJzogJGlkLFxyXG4gICAgICAnYXJpYS1sYWJlbGxlZGJ5JzogdGhpcy4kYW5jaG9yWzBdLmlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2RkLWFuY2hvcicpXHJcbiAgICB9KTtcclxuICAgIHRoaXMuX2V2ZW50cygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGVscGVyIGZ1bmN0aW9uIHRvIGRldGVybWluZSBjdXJyZW50IG9yaWVudGF0aW9uIG9mIGRyb3Bkb3duIHBhbmUuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHJldHVybnMge1N0cmluZ30gcG9zaXRpb24gLSBzdHJpbmcgdmFsdWUgb2YgYSBwb3NpdGlvbiBjbGFzcy5cclxuICAgKi9cclxuICBnZXRQb3NpdGlvbkNsYXNzKCkge1xyXG4gICAgdmFyIHZlcnRpY2FsUG9zaXRpb24gPSB0aGlzLiRlbGVtZW50WzBdLmNsYXNzTmFtZS5tYXRjaCgvKHRvcHxsZWZ0fHJpZ2h0fGJvdHRvbSkvZyk7XHJcbiAgICAgICAgdmVydGljYWxQb3NpdGlvbiA9IHZlcnRpY2FsUG9zaXRpb24gPyB2ZXJ0aWNhbFBvc2l0aW9uWzBdIDogJyc7XHJcbiAgICB2YXIgaG9yaXpvbnRhbFBvc2l0aW9uID0gL2Zsb2F0LSguKylcXHMvLmV4ZWModGhpcy4kYW5jaG9yWzBdLmNsYXNzTmFtZSk7XHJcbiAgICAgICAgaG9yaXpvbnRhbFBvc2l0aW9uID0gaG9yaXpvbnRhbFBvc2l0aW9uID8gaG9yaXpvbnRhbFBvc2l0aW9uWzFdIDogJyc7XHJcbiAgICB2YXIgcG9zaXRpb24gPSBob3Jpem9udGFsUG9zaXRpb24gPyBob3Jpem9udGFsUG9zaXRpb24gKyAnICcgKyB2ZXJ0aWNhbFBvc2l0aW9uIDogdmVydGljYWxQb3NpdGlvbjtcclxuICAgIHJldHVybiBwb3NpdGlvbjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkanVzdHMgdGhlIGRyb3Bkb3duIHBhbmVzIG9yaWVudGF0aW9uIGJ5IGFkZGluZy9yZW1vdmluZyBwb3NpdGlvbmluZyBjbGFzc2VzLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBvc2l0aW9uIC0gcG9zaXRpb24gY2xhc3MgdG8gcmVtb3ZlLlxyXG4gICAqL1xyXG4gIF9yZXBvc2l0aW9uKHBvc2l0aW9uKSB7XHJcbiAgICB0aGlzLnVzZWRQb3NpdGlvbnMucHVzaChwb3NpdGlvbiA/IHBvc2l0aW9uIDogJ2JvdHRvbScpO1xyXG4gICAgLy9kZWZhdWx0LCB0cnkgc3dpdGNoaW5nIHRvIG9wcG9zaXRlIHNpZGVcclxuICAgIGlmKCFwb3NpdGlvbiAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3RvcCcpIDwgMCkpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCd0b3AnKTtcclxuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAndG9wJyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcclxuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAnbGVmdCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdyaWdodCcpIDwgMCkpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxyXG4gICAgICAgICAgLmFkZENsYXNzKCdyaWdodCcpO1xyXG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICdyaWdodCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSl7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pXHJcbiAgICAgICAgICAuYWRkQ2xhc3MoJ2xlZnQnKTtcclxuICAgIH1cclxuXHJcbiAgICAvL2lmIGRlZmF1bHQgY2hhbmdlIGRpZG4ndCB3b3JrLCB0cnkgYm90dG9tIG9yIGxlZnQgZmlyc3RcclxuICAgIGVsc2UgaWYoIXBvc2l0aW9uICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigndG9wJykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSl7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ2xlZnQnKTtcclxuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAndG9wJyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxyXG4gICAgICAgICAgLmFkZENsYXNzKCdsZWZ0Jyk7XHJcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ2xlZnQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigncmlnaHQnKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcclxuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAncmlnaHQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignYm90dG9tJykgPCAwKSl7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xyXG4gICAgfVxyXG4gICAgLy9pZiBub3RoaW5nIGNsZWFyZWQsIHNldCB0byBib3R0b21cclxuICAgIGVsc2V7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xyXG4gICAgfVxyXG4gICAgdGhpcy5jbGFzc0NoYW5nZWQgPSB0cnVlO1xyXG4gICAgdGhpcy5jb3VudGVyLS07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiBhbmQgb3JpZW50YXRpb24gb2YgdGhlIGRyb3Bkb3duIHBhbmUsIGNoZWNrcyBmb3IgY29sbGlzaW9ucy5cclxuICAgKiBSZWN1cnNpdmVseSBjYWxscyBpdHNlbGYgaWYgYSBjb2xsaXNpb24gaXMgZGV0ZWN0ZWQsIHdpdGggYSBuZXcgcG9zaXRpb24gY2xhc3MuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfc2V0UG9zaXRpb24oKSB7XHJcbiAgICBpZih0aGlzLiRhbmNob3IuYXR0cignYXJpYS1leHBhbmRlZCcpID09PSAnZmFsc2UnKXsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICB2YXIgcG9zaXRpb24gPSB0aGlzLmdldFBvc2l0aW9uQ2xhc3MoKSxcclxuICAgICAgICAkZWxlRGltcyA9IEZvdW5kYXRpb24uQm94LkdldERpbWVuc2lvbnModGhpcy4kZWxlbWVudCksXHJcbiAgICAgICAgJGFuY2hvckRpbXMgPSBGb3VuZGF0aW9uLkJveC5HZXREaW1lbnNpb25zKHRoaXMuJGFuY2hvciksXHJcbiAgICAgICAgX3RoaXMgPSB0aGlzLFxyXG4gICAgICAgIGRpcmVjdGlvbiA9IChwb3NpdGlvbiA9PT0gJ2xlZnQnID8gJ2xlZnQnIDogKChwb3NpdGlvbiA9PT0gJ3JpZ2h0JykgPyAnbGVmdCcgOiAndG9wJykpLFxyXG4gICAgICAgIHBhcmFtID0gKGRpcmVjdGlvbiA9PT0gJ3RvcCcpID8gJ2hlaWdodCcgOiAnd2lkdGgnLFxyXG4gICAgICAgIG9mZnNldCA9IChwYXJhbSA9PT0gJ2hlaWdodCcpID8gdGhpcy5vcHRpb25zLnZPZmZzZXQgOiB0aGlzLm9wdGlvbnMuaE9mZnNldDtcclxuXHJcblxyXG5cclxuICAgIGlmKCgkZWxlRGltcy53aWR0aCA+PSAkZWxlRGltcy53aW5kb3dEaW1zLndpZHRoKSB8fCAoIXRoaXMuY291bnRlciAmJiAhRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSh0aGlzLiRlbGVtZW50KSkpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50Lm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMuJGVsZW1lbnQsIHRoaXMuJGFuY2hvciwgJ2NlbnRlciBib3R0b20nLCB0aGlzLm9wdGlvbnMudk9mZnNldCwgdGhpcy5vcHRpb25zLmhPZmZzZXQsIHRydWUpKS5jc3Moe1xyXG4gICAgICAgICd3aWR0aCc6ICRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLSAodGhpcy5vcHRpb25zLmhPZmZzZXQgKiAyKSxcclxuICAgICAgICAnaGVpZ2h0JzogJ2F1dG8nXHJcbiAgICAgIH0pO1xyXG4gICAgICB0aGlzLmNsYXNzQ2hhbmdlZCA9IHRydWU7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLiRlbGVtZW50Lm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMuJGVsZW1lbnQsIHRoaXMuJGFuY2hvciwgcG9zaXRpb24sIHRoaXMub3B0aW9ucy52T2Zmc2V0LCB0aGlzLm9wdGlvbnMuaE9mZnNldCkpO1xyXG5cclxuICAgIHdoaWxlKCFGb3VuZGF0aW9uLkJveC5JbU5vdFRvdWNoaW5nWW91KHRoaXMuJGVsZW1lbnQsIGZhbHNlLCB0cnVlKSAmJiB0aGlzLmNvdW50ZXIpe1xyXG4gICAgICB0aGlzLl9yZXBvc2l0aW9uKHBvc2l0aW9uKTtcclxuICAgICAgdGhpcy5fc2V0UG9zaXRpb24oKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIHRoZSBlbGVtZW50IHV0aWxpemluZyB0aGUgdHJpZ2dlcnMgdXRpbGl0eSBsaWJyYXJ5LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2V2ZW50cygpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICB0aGlzLiRlbGVtZW50Lm9uKHtcclxuICAgICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxyXG4gICAgICAnY2xvc2UuemYudHJpZ2dlcic6IHRoaXMuY2xvc2UuYmluZCh0aGlzKSxcclxuICAgICAgJ3RvZ2dsZS56Zi50cmlnZ2VyJzogdGhpcy50b2dnbGUuYmluZCh0aGlzKSxcclxuICAgICAgJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInOiB0aGlzLl9zZXRQb3NpdGlvbi5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZih0aGlzLm9wdGlvbnMuaG92ZXIpe1xyXG4gICAgICB0aGlzLiRhbmNob3Iub2ZmKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3duIG1vdXNlbGVhdmUuemYuZHJvcGRvd24nKVxyXG4gICAgICAgICAgLm9uKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLnRpbWVvdXQpO1xyXG4gICAgICAgICAgICBfdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgIF90aGlzLm9wZW4oKTtcclxuICAgICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmRhdGEoJ2hvdmVyJywgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuaG92ZXJEZWxheSk7XHJcbiAgICAgICAgICB9KS5vbignbW91c2VsZWF2ZS56Zi5kcm9wZG93bicsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcclxuICAgICAgICAgICAgX3RoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZGF0YSgnaG92ZXInLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuaG92ZXJEZWxheSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgaWYodGhpcy5vcHRpb25zLmhvdmVyUGFuZSl7XHJcbiAgICAgICAgdGhpcy4kZWxlbWVudC5vZmYoJ21vdXNlZW50ZXIuemYuZHJvcGRvd24gbW91c2VsZWF2ZS56Zi5kcm9wZG93bicpXHJcbiAgICAgICAgICAgIC5vbignbW91c2VlbnRlci56Zi5kcm9wZG93bicsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLnRpbWVvdXQpO1xyXG4gICAgICAgICAgICB9KS5vbignbW91c2VsZWF2ZS56Zi5kcm9wZG93bicsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLnRpbWVvdXQpO1xyXG4gICAgICAgICAgICAgIF90aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMuJGFuY2hvci5kYXRhKCdob3ZlcicsIGZhbHNlKTtcclxuICAgICAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy4kYW5jaG9yLmFkZCh0aGlzLiRlbGVtZW50KS5vbigna2V5ZG93bi56Zi5kcm9wZG93bicsIGZ1bmN0aW9uKGUpIHtcclxuXHJcbiAgICAgIHZhciAkdGFyZ2V0ID0gJCh0aGlzKSxcclxuICAgICAgICB2aXNpYmxlRm9jdXNhYmxlRWxlbWVudHMgPSBGb3VuZGF0aW9uLktleWJvYXJkLmZpbmRGb2N1c2FibGUoX3RoaXMuJGVsZW1lbnQpO1xyXG5cclxuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ0Ryb3Bkb3duJywge1xyXG4gICAgICAgIHRhYl9mb3J3YXJkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmIChfdGhpcy4kZWxlbWVudC5maW5kKCc6Zm9jdXMnKS5pcyh2aXNpYmxlRm9jdXNhYmxlRWxlbWVudHMuZXEoLTEpKSkgeyAvLyBsZWZ0IG1vZGFsIGRvd253YXJkcywgc2V0dGluZyBmb2N1cyB0byBmaXJzdCBlbGVtZW50XHJcbiAgICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLnRyYXBGb2N1cykgeyAvLyBpZiBmb2N1cyBzaGFsbCBiZSB0cmFwcGVkXHJcbiAgICAgICAgICAgICAgdmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzLmVxKDApLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB9IGVsc2UgeyAvLyBpZiBmb2N1cyBpcyBub3QgdHJhcHBlZCwgY2xvc2UgZHJvcGRvd24gb24gZm9jdXMgb3V0XHJcbiAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdGFiX2JhY2t3YXJkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmIChfdGhpcy4kZWxlbWVudC5maW5kKCc6Zm9jdXMnKS5pcyh2aXNpYmxlRm9jdXNhYmxlRWxlbWVudHMuZXEoMCkpIHx8IF90aGlzLiRlbGVtZW50LmlzKCc6Zm9jdXMnKSkgeyAvLyBsZWZ0IG1vZGFsIHVwd2FyZHMsIHNldHRpbmcgZm9jdXMgdG8gbGFzdCBlbGVtZW50XHJcbiAgICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLnRyYXBGb2N1cykgeyAvLyBpZiBmb2N1cyBzaGFsbCBiZSB0cmFwcGVkXHJcbiAgICAgICAgICAgICAgdmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzLmVxKC0xKS5mb2N1cygpO1xyXG4gICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHsgLy8gaWYgZm9jdXMgaXMgbm90IHRyYXBwZWQsIGNsb3NlIGRyb3Bkb3duIG9uIGZvY3VzIG91dFxyXG4gICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIG9wZW46IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYgKCR0YXJnZXQuaXMoX3RoaXMuJGFuY2hvcikpIHtcclxuICAgICAgICAgICAgX3RoaXMub3BlbigpO1xyXG4gICAgICAgICAgICBfdGhpcy4kZWxlbWVudC5hdHRyKCd0YWJpbmRleCcsIC0xKS5mb2N1cygpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgX3RoaXMuJGFuY2hvci5mb2N1cygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYW4gZXZlbnQgaGFuZGxlciB0byB0aGUgYm9keSB0byBjbG9zZSBhbnkgZHJvcGRvd25zIG9uIGEgY2xpY2suXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfYWRkQm9keUhhbmRsZXIoKSB7XHJcbiAgICAgdmFyICRib2R5ID0gJChkb2N1bWVudC5ib2R5KS5ub3QodGhpcy4kZWxlbWVudCksXHJcbiAgICAgICAgIF90aGlzID0gdGhpcztcclxuICAgICAkYm9keS5vZmYoJ2NsaWNrLnpmLmRyb3Bkb3duJylcclxuICAgICAgICAgIC5vbignY2xpY2suemYuZHJvcGRvd24nLCBmdW5jdGlvbihlKXtcclxuICAgICAgICAgICAgaWYoX3RoaXMuJGFuY2hvci5pcyhlLnRhcmdldCkgfHwgX3RoaXMuJGFuY2hvci5maW5kKGUudGFyZ2V0KS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYoX3RoaXMuJGVsZW1lbnQuZmluZChlLnRhcmdldCkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgICAgICRib2R5Lm9mZignY2xpY2suemYuZHJvcGRvd24nKTtcclxuICAgICAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT3BlbnMgdGhlIGRyb3Bkb3duIHBhbmUsIGFuZCBmaXJlcyBhIGJ1YmJsaW5nIGV2ZW50IHRvIGNsb3NlIG90aGVyIGRyb3Bkb3ducy5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAZmlyZXMgRHJvcGRvd24jY2xvc2VtZVxyXG4gICAqIEBmaXJlcyBEcm9wZG93biNzaG93XHJcbiAgICovXHJcbiAgb3BlbigpIHtcclxuICAgIC8vIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHRvIGNsb3NlIG90aGVyIG9wZW4gZHJvcGRvd25zXHJcbiAgICAgKiBAZXZlbnQgRHJvcGRvd24jY2xvc2VtZVxyXG4gICAgICovXHJcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2Nsb3NlbWUuemYuZHJvcGRvd24nLCB0aGlzLiRlbGVtZW50LmF0dHIoJ2lkJykpO1xyXG4gICAgdGhpcy4kYW5jaG9yLmFkZENsYXNzKCdob3ZlcicpXHJcbiAgICAgICAgLmF0dHIoeydhcmlhLWV4cGFuZGVkJzogdHJ1ZX0pO1xyXG4gICAgLy8gdGhpcy4kZWxlbWVudC8qLnNob3coKSovO1xyXG4gICAgdGhpcy5fc2V0UG9zaXRpb24oKTtcclxuICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ2lzLW9wZW4nKVxyXG4gICAgICAgIC5hdHRyKHsnYXJpYS1oaWRkZW4nOiBmYWxzZX0pO1xyXG5cclxuICAgIGlmKHRoaXMub3B0aW9ucy5hdXRvRm9jdXMpe1xyXG4gICAgICB2YXIgJGZvY3VzYWJsZSA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZSh0aGlzLiRlbGVtZW50KTtcclxuICAgICAgaWYoJGZvY3VzYWJsZS5sZW5ndGgpe1xyXG4gICAgICAgICRmb2N1c2FibGUuZXEoMCkuZm9jdXMoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2speyB0aGlzLl9hZGRCb2R5SGFuZGxlcigpOyB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBvbmNlIHRoZSBkcm9wZG93biBpcyB2aXNpYmxlLlxyXG4gICAgICogQGV2ZW50IERyb3Bkb3duI3Nob3dcclxuICAgICAqL1xyXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdzaG93LnpmLmRyb3Bkb3duJywgW3RoaXMuJGVsZW1lbnRdKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsb3NlcyB0aGUgb3BlbiBkcm9wZG93biBwYW5lLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBmaXJlcyBEcm9wZG93biNoaWRlXHJcbiAgICovXHJcbiAgY2xvc2UoKSB7XHJcbiAgICBpZighdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpKXtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcygnaXMtb3BlbicpXHJcbiAgICAgICAgLmF0dHIoeydhcmlhLWhpZGRlbic6IHRydWV9KTtcclxuXHJcbiAgICB0aGlzLiRhbmNob3IucmVtb3ZlQ2xhc3MoJ2hvdmVyJylcclxuICAgICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIGZhbHNlKTtcclxuXHJcbiAgICBpZih0aGlzLmNsYXNzQ2hhbmdlZCl7XHJcbiAgICAgIHZhciBjdXJQb3NpdGlvbkNsYXNzID0gdGhpcy5nZXRQb3NpdGlvbkNsYXNzKCk7XHJcbiAgICAgIGlmKGN1clBvc2l0aW9uQ2xhc3Mpe1xyXG4gICAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoY3VyUG9zaXRpb25DbGFzcyk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyh0aGlzLm9wdGlvbnMucG9zaXRpb25DbGFzcylcclxuICAgICAgICAgIC8qLmhpZGUoKSovLmNzcyh7aGVpZ2h0OiAnJywgd2lkdGg6ICcnfSk7XHJcbiAgICAgIHRoaXMuY2xhc3NDaGFuZ2VkID0gZmFsc2U7XHJcbiAgICAgIHRoaXMuY291bnRlciA9IDQ7XHJcbiAgICAgIHRoaXMudXNlZFBvc2l0aW9ucy5sZW5ndGggPSAwO1xyXG4gICAgfVxyXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdoaWRlLnpmLmRyb3Bkb3duJywgW3RoaXMuJGVsZW1lbnRdKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRvZ2dsZXMgdGhlIGRyb3Bkb3duIHBhbmUncyB2aXNpYmlsaXR5LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIHRvZ2dsZSgpIHtcclxuICAgIGlmKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSl7XHJcbiAgICAgIGlmKHRoaXMuJGFuY2hvci5kYXRhKCdob3ZlcicpKSByZXR1cm47XHJcbiAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLm9wZW4oKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIHRoZSBkcm9wZG93bi5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50cmlnZ2VyJykuaGlkZSgpO1xyXG4gICAgdGhpcy4kYW5jaG9yLm9mZignLnpmLmRyb3Bkb3duJyk7XHJcblxyXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH1cclxufVxyXG5cclxuRHJvcGRvd24uZGVmYXVsdHMgPSB7XHJcbiAgLyoqXHJcbiAgICogQW1vdW50IG9mIHRpbWUgdG8gZGVsYXkgb3BlbmluZyBhIHN1Ym1lbnUgb24gaG92ZXIgZXZlbnQuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDI1MFxyXG4gICAqL1xyXG4gIGhvdmVyRGVsYXk6IDI1MCxcclxuICAvKipcclxuICAgKiBBbGxvdyBzdWJtZW51cyB0byBvcGVuIG9uIGhvdmVyIGV2ZW50c1xyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAqL1xyXG4gIGhvdmVyOiBmYWxzZSxcclxuICAvKipcclxuICAgKiBEb24ndCBjbG9zZSBkcm9wZG93biB3aGVuIGhvdmVyaW5nIG92ZXIgZHJvcGRvd24gcGFuZVxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgICovXHJcbiAgaG92ZXJQYW5lOiBmYWxzZSxcclxuICAvKipcclxuICAgKiBOdW1iZXIgb2YgcGl4ZWxzIGJldHdlZW4gdGhlIGRyb3Bkb3duIHBhbmUgYW5kIHRoZSB0cmlnZ2VyaW5nIGVsZW1lbnQgb24gb3Blbi5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgMVxyXG4gICAqL1xyXG4gIHZPZmZzZXQ6IDEsXHJcbiAgLyoqXHJcbiAgICogTnVtYmVyIG9mIHBpeGVscyBiZXR3ZWVuIHRoZSBkcm9wZG93biBwYW5lIGFuZCB0aGUgdHJpZ2dlcmluZyBlbGVtZW50IG9uIG9wZW4uXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDFcclxuICAgKi9cclxuICBoT2Zmc2V0OiAxLFxyXG4gIC8qKlxyXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gYWRqdXN0IG9wZW4gcG9zaXRpb24uIEpTIHdpbGwgdGVzdCBhbmQgZmlsbCB0aGlzIGluLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAndG9wJ1xyXG4gICAqL1xyXG4gIHBvc2l0aW9uQ2xhc3M6ICcnLFxyXG4gIC8qKlxyXG4gICAqIEFsbG93IHRoZSBwbHVnaW4gdG8gdHJhcCBmb2N1cyB0byB0aGUgZHJvcGRvd24gcGFuZSBpZiBvcGVuZWQgd2l0aCBrZXlib2FyZCBjb21tYW5kcy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICB0cmFwRm9jdXM6IGZhbHNlLFxyXG4gIC8qKlxyXG4gICAqIEFsbG93IHRoZSBwbHVnaW4gdG8gc2V0IGZvY3VzIHRvIHRoZSBmaXJzdCBmb2N1c2FibGUgZWxlbWVudCB3aXRoaW4gdGhlIHBhbmUsIHJlZ2FyZGxlc3Mgb2YgbWV0aG9kIG9mIG9wZW5pbmcuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIHRydWVcclxuICAgKi9cclxuICBhdXRvRm9jdXM6IGZhbHNlLFxyXG4gIC8qKlxyXG4gICAqIEFsbG93cyBhIGNsaWNrIG9uIHRoZSBib2R5IHRvIGNsb3NlIHRoZSBkcm9wZG93bi5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBjbG9zZU9uQ2xpY2s6IGZhbHNlXHJcbn1cclxuXHJcbi8vIFdpbmRvdyBleHBvcnRzXHJcbkZvdW5kYXRpb24ucGx1Z2luKERyb3Bkb3duLCAnRHJvcGRvd24nKTtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8qKlxyXG4gKiBEcm9wZG93bk1lbnUgbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uZHJvcGRvd24tbWVudVxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuYm94XHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubmVzdFxyXG4gKi9cclxuXHJcbmNsYXNzIERyb3Bkb3duTWVudSB7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBEcm9wZG93bk1lbnUuXHJcbiAgICogQGNsYXNzXHJcbiAgICogQGZpcmVzIERyb3Bkb3duTWVudSNpbml0XHJcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhIGRyb3Bkb3duIG1lbnUuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIERyb3Bkb3duTWVudS5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xyXG5cclxuICAgIEZvdW5kYXRpb24uTmVzdC5GZWF0aGVyKHRoaXMuJGVsZW1lbnQsICdkcm9wZG93bicpO1xyXG4gICAgdGhpcy5faW5pdCgpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0Ryb3Bkb3duTWVudScpO1xyXG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignRHJvcGRvd25NZW51Jywge1xyXG4gICAgICAnRU5URVInOiAnb3BlbicsXHJcbiAgICAgICdTUEFDRSc6ICdvcGVuJyxcclxuICAgICAgJ0FSUk9XX1JJR0hUJzogJ25leHQnLFxyXG4gICAgICAnQVJST1dfVVAnOiAndXAnLFxyXG4gICAgICAnQVJST1dfRE9XTic6ICdkb3duJyxcclxuICAgICAgJ0FSUk9XX0xFRlQnOiAncHJldmlvdXMnLFxyXG4gICAgICAnRVNDQVBFJzogJ2Nsb3NlJ1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgcGx1Z2luLCBhbmQgY2FsbHMgX3ByZXBhcmVNZW51XHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBfaW5pdCgpIHtcclxuICAgIHZhciBzdWJzID0gdGhpcy4kZWxlbWVudC5maW5kKCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpO1xyXG4gICAgdGhpcy4kZWxlbWVudC5jaGlsZHJlbignLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JykuY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51JykuYWRkQ2xhc3MoJ2ZpcnN0LXN1YicpO1xyXG5cclxuICAgIHRoaXMuJG1lbnVJdGVtcyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW3JvbGU9XCJtZW51aXRlbVwiXScpO1xyXG4gICAgdGhpcy4kdGFicyA9IHRoaXMuJGVsZW1lbnQuY2hpbGRyZW4oJ1tyb2xlPVwibWVudWl0ZW1cIl0nKTtcclxuICAgIHRoaXMuJHRhYnMuZmluZCgndWwuaXMtZHJvcGRvd24tc3VibWVudScpLmFkZENsYXNzKHRoaXMub3B0aW9ucy52ZXJ0aWNhbENsYXNzKTtcclxuXHJcbiAgICBpZiAodGhpcy4kZWxlbWVudC5oYXNDbGFzcyh0aGlzLm9wdGlvbnMucmlnaHRDbGFzcykgfHwgdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ3JpZ2h0JyB8fCBGb3VuZGF0aW9uLnJ0bCgpIHx8IHRoaXMuJGVsZW1lbnQucGFyZW50cygnLnRvcC1iYXItcmlnaHQnKS5pcygnKicpKSB7XHJcbiAgICAgIHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPSAncmlnaHQnO1xyXG4gICAgICBzdWJzLmFkZENsYXNzKCdvcGVucy1sZWZ0Jyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzdWJzLmFkZENsYXNzKCdvcGVucy1yaWdodCcpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5jaGFuZ2VkID0gZmFsc2U7XHJcbiAgICB0aGlzLl9ldmVudHMoKTtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIGVsZW1lbnRzIHdpdGhpbiB0aGUgbWVudVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgX2V2ZW50cygpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXMsXHJcbiAgICAgICAgaGFzVG91Y2ggPSAnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cgfHwgKHR5cGVvZiB3aW5kb3cub250b3VjaHN0YXJ0ICE9PSAndW5kZWZpbmVkJyksXHJcbiAgICAgICAgcGFyQ2xhc3MgPSAnaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnO1xyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xpY2tPcGVuIHx8IGhhc1RvdWNoKSB7XHJcbiAgICAgIHRoaXMuJG1lbnVJdGVtcy5vbignY2xpY2suemYuZHJvcGRvd25tZW51IHRvdWNoc3RhcnQuemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHZhciAkZWxlbSA9ICQoZS50YXJnZXQpLnBhcmVudHNVbnRpbCgndWwnLCBgLiR7cGFyQ2xhc3N9YCksXHJcbiAgICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKSxcclxuICAgICAgICAgICAgaGFzQ2xpY2tlZCA9ICRlbGVtLmF0dHIoJ2RhdGEtaXMtY2xpY2snKSA9PT0gJ3RydWUnLFxyXG4gICAgICAgICAgICAkc3ViID0gJGVsZW0uY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51Jyk7XHJcblxyXG4gICAgICAgIGlmIChoYXNTdWIpIHtcclxuICAgICAgICAgIGlmIChoYXNDbGlja2VkKSB7XHJcbiAgICAgICAgICAgIGlmICghX3RoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2sgfHwgKCFfdGhpcy5vcHRpb25zLmNsaWNrT3BlbiAmJiAhaGFzVG91Y2gpIHx8IChfdGhpcy5vcHRpb25zLmZvcmNlRm9sbG93ICYmIGhhc1RvdWNoKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIF90aGlzLl9zaG93KCRlbGVtLmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudScpKTtcclxuICAgICAgICAgICAgJGVsZW0uYWRkKCRlbGVtLnBhcmVudHNVbnRpbChfdGhpcy4kZWxlbWVudCwgYC4ke3BhckNsYXNzfWApKS5hdHRyKCdkYXRhLWlzLWNsaWNrJywgdHJ1ZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHsgcmV0dXJuOyB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5vcHRpb25zLmRpc2FibGVIb3Zlcikge1xyXG4gICAgICB0aGlzLiRtZW51SXRlbXMub24oJ21vdXNlZW50ZXIuemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgdmFyICRlbGVtID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgaGFzU3ViID0gJGVsZW0uaGFzQ2xhc3MocGFyQ2xhc3MpO1xyXG5cclxuICAgICAgICBpZiAoaGFzU3ViKSB7XHJcbiAgICAgICAgICBjbGVhclRpbWVvdXQoX3RoaXMuZGVsYXkpO1xyXG4gICAgICAgICAgX3RoaXMuZGVsYXkgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBfdGhpcy5fc2hvdygkZWxlbS5jaGlsZHJlbignLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKSk7XHJcbiAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSkub24oJ21vdXNlbGVhdmUuemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHZhciAkZWxlbSA9ICQodGhpcyksXHJcbiAgICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKTtcclxuICAgICAgICBpZiAoaGFzU3ViICYmIF90aGlzLm9wdGlvbnMuYXV0b2Nsb3NlKSB7XHJcbiAgICAgICAgICBpZiAoJGVsZW0uYXR0cignZGF0YS1pcy1jbGljaycpID09PSAndHJ1ZScgJiYgX3RoaXMub3B0aW9ucy5jbGlja09wZW4pIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLmRlbGF5KTtcclxuICAgICAgICAgIF90aGlzLmRlbGF5ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW0pO1xyXG4gICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5jbG9zaW5nVGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIHRoaXMuJG1lbnVJdGVtcy5vbigna2V5ZG93bi56Zi5kcm9wZG93bm1lbnUnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgIHZhciAkZWxlbWVudCA9ICQoZS50YXJnZXQpLnBhcmVudHNVbnRpbCgndWwnLCAnW3JvbGU9XCJtZW51aXRlbVwiXScpLFxyXG4gICAgICAgICAgaXNUYWIgPSBfdGhpcy4kdGFicy5pbmRleCgkZWxlbWVudCkgPiAtMSxcclxuICAgICAgICAgICRlbGVtZW50cyA9IGlzVGFiID8gX3RoaXMuJHRhYnMgOiAkZWxlbWVudC5zaWJsaW5ncygnbGknKS5hZGQoJGVsZW1lbnQpLFxyXG4gICAgICAgICAgJHByZXZFbGVtZW50LFxyXG4gICAgICAgICAgJG5leHRFbGVtZW50O1xyXG5cclxuICAgICAgJGVsZW1lbnRzLmVhY2goZnVuY3Rpb24oaSkge1xyXG4gICAgICAgIGlmICgkKHRoaXMpLmlzKCRlbGVtZW50KSkge1xyXG4gICAgICAgICAgJHByZXZFbGVtZW50ID0gJGVsZW1lbnRzLmVxKGktMSk7XHJcbiAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudHMuZXEoaSsxKTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIG5leHRTaWJsaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKCEkZWxlbWVudC5pcygnOmxhc3QtY2hpbGQnKSkgJG5leHRFbGVtZW50LmNoaWxkcmVuKCdhOmZpcnN0JykuZm9jdXMoKTtcclxuICAgICAgfSwgcHJldlNpYmxpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAkcHJldkVsZW1lbnQuY2hpbGRyZW4oJ2E6Zmlyc3QnKS5mb2N1cygpO1xyXG4gICAgICB9LCBvcGVuU3ViID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyICRzdWIgPSAkZWxlbWVudC5jaGlsZHJlbigndWwuaXMtZHJvcGRvd24tc3VibWVudScpO1xyXG4gICAgICAgIGlmICgkc3ViLmxlbmd0aCkge1xyXG4gICAgICAgICAgX3RoaXMuX3Nob3coJHN1Yik7XHJcbiAgICAgICAgICAkZWxlbWVudC5maW5kKCdsaSA+IGE6Zmlyc3QnKS5mb2N1cygpO1xyXG4gICAgICAgIH0gZWxzZSB7IHJldHVybjsgfVxyXG4gICAgICB9LCBjbG9zZVN1YiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vaWYgKCRlbGVtZW50LmlzKCc6Zmlyc3QtY2hpbGQnKSkge1xyXG4gICAgICAgIHZhciBjbG9zZSA9ICRlbGVtZW50LnBhcmVudCgndWwnKS5wYXJlbnQoJ2xpJyk7XHJcbiAgICAgICAgICBjbG9zZS5jaGlsZHJlbignYTpmaXJzdCcpLmZvY3VzKCk7XHJcbiAgICAgICAgICBfdGhpcy5faGlkZShjbG9zZSk7XHJcbiAgICAgICAgLy99XHJcbiAgICAgIH07XHJcbiAgICAgIHZhciBmdW5jdGlvbnMgPSB7XHJcbiAgICAgICAgb3Blbjogb3BlblN1YixcclxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBfdGhpcy5faGlkZShfdGhpcy4kZWxlbWVudCk7XHJcbiAgICAgICAgICBfdGhpcy4kbWVudUl0ZW1zLmZpbmQoJ2E6Zmlyc3QnKS5mb2N1cygpOyAvLyBmb2N1cyB0byBmaXJzdCBlbGVtZW50XHJcbiAgICAgICAgfSxcclxuICAgICAgICBoYW5kbGVkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgaWYgKGlzVGFiKSB7XHJcbiAgICAgICAgaWYgKF90aGlzLnZlcnRpY2FsKSB7IC8vIHZlcnRpY2FsIG1lbnVcclxuICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ2xlZnQnKSB7IC8vIGxlZnQgYWxpZ25lZFxyXG4gICAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcclxuICAgICAgICAgICAgICBkb3duOiBuZXh0U2libGluZyxcclxuICAgICAgICAgICAgICB1cDogcHJldlNpYmxpbmcsXHJcbiAgICAgICAgICAgICAgbmV4dDogb3BlblN1YixcclxuICAgICAgICAgICAgICBwcmV2aW91czogY2xvc2VTdWJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9IGVsc2UgeyAvLyByaWdodCBhbGlnbmVkXHJcbiAgICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xyXG4gICAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxyXG4gICAgICAgICAgICAgIHVwOiBwcmV2U2libGluZyxcclxuICAgICAgICAgICAgICBuZXh0OiBjbG9zZVN1YixcclxuICAgICAgICAgICAgICBwcmV2aW91czogb3BlblN1YlxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgeyAvLyBob3Jpem9udGFsIG1lbnVcclxuICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xyXG4gICAgICAgICAgICBuZXh0OiBuZXh0U2libGluZyxcclxuICAgICAgICAgICAgcHJldmlvdXM6IHByZXZTaWJsaW5nLFxyXG4gICAgICAgICAgICBkb3duOiBvcGVuU3ViLFxyXG4gICAgICAgICAgICB1cDogY2xvc2VTdWJcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHsgLy8gbm90IHRhYnMgLT4gb25lIHN1YlxyXG4gICAgICAgIGlmIChfdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ2xlZnQnKSB7IC8vIGxlZnQgYWxpZ25lZFxyXG4gICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XHJcbiAgICAgICAgICAgIG5leHQ6IG9wZW5TdWIsXHJcbiAgICAgICAgICAgIHByZXZpb3VzOiBjbG9zZVN1YixcclxuICAgICAgICAgICAgZG93bjogbmV4dFNpYmxpbmcsXHJcbiAgICAgICAgICAgIHVwOiBwcmV2U2libGluZ1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHsgLy8gcmlnaHQgYWxpZ25lZFxyXG4gICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XHJcbiAgICAgICAgICAgIG5leHQ6IGNsb3NlU3ViLFxyXG4gICAgICAgICAgICBwcmV2aW91czogb3BlblN1YixcclxuICAgICAgICAgICAgZG93bjogbmV4dFNpYmxpbmcsXHJcbiAgICAgICAgICAgIHVwOiBwcmV2U2libGluZ1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdEcm9wZG93bk1lbnUnLCBmdW5jdGlvbnMpO1xyXG5cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhbiBldmVudCBoYW5kbGVyIHRvIHRoZSBib2R5IHRvIGNsb3NlIGFueSBkcm9wZG93bnMgb24gYSBjbGljay5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9hZGRCb2R5SGFuZGxlcigpIHtcclxuICAgIHZhciAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSksXHJcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xyXG4gICAgJGJvZHkub2ZmKCdtb3VzZXVwLnpmLmRyb3Bkb3dubWVudSB0b3VjaGVuZC56Zi5kcm9wZG93bm1lbnUnKVxyXG4gICAgICAgICAub24oJ21vdXNldXAuemYuZHJvcGRvd25tZW51IHRvdWNoZW5kLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICB2YXIgJGxpbmsgPSBfdGhpcy4kZWxlbWVudC5maW5kKGUudGFyZ2V0KTtcclxuICAgICAgICAgICBpZiAoJGxpbmsubGVuZ3RoKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICBfdGhpcy5faGlkZSgpO1xyXG4gICAgICAgICAgICRib2R5Lm9mZignbW91c2V1cC56Zi5kcm9wZG93bm1lbnUgdG91Y2hlbmQuemYuZHJvcGRvd25tZW51Jyk7XHJcbiAgICAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT3BlbnMgYSBkcm9wZG93biBwYW5lLCBhbmQgY2hlY2tzIGZvciBjb2xsaXNpb25zIGZpcnN0LlxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkc3ViIC0gdWwgZWxlbWVudCB0aGF0IGlzIGEgc3VibWVudSB0byBzaG93XHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAZmlyZXMgRHJvcGRvd25NZW51I3Nob3dcclxuICAgKi9cclxuICBfc2hvdygkc3ViKSB7XHJcbiAgICB2YXIgaWR4ID0gdGhpcy4kdGFicy5pbmRleCh0aGlzLiR0YWJzLmZpbHRlcihmdW5jdGlvbihpLCBlbCkge1xyXG4gICAgICByZXR1cm4gJChlbCkuZmluZCgkc3ViKS5sZW5ndGggPiAwO1xyXG4gICAgfSkpO1xyXG4gICAgdmFyICRzaWJzID0gJHN1Yi5wYXJlbnQoJ2xpLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50Jykuc2libGluZ3MoJ2xpLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50Jyk7XHJcbiAgICB0aGlzLl9oaWRlKCRzaWJzLCBpZHgpO1xyXG4gICAgJHN1Yi5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJykuYWRkQ2xhc3MoJ2pzLWRyb3Bkb3duLWFjdGl2ZScpLmF0dHIoeydhcmlhLWhpZGRlbic6IGZhbHNlfSlcclxuICAgICAgICAucGFyZW50KCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpLmFkZENsYXNzKCdpcy1hY3RpdmUnKVxyXG4gICAgICAgIC5hdHRyKHsnYXJpYS1leHBhbmRlZCc6IHRydWV9KTtcclxuICAgIHZhciBjbGVhciA9IEZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UoJHN1YiwgbnVsbCwgdHJ1ZSk7XHJcbiAgICBpZiAoIWNsZWFyKSB7XHJcbiAgICAgIHZhciBvbGRDbGFzcyA9IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPT09ICdsZWZ0JyA/ICctcmlnaHQnIDogJy1sZWZ0JyxcclxuICAgICAgICAgICRwYXJlbnRMaSA9ICRzdWIucGFyZW50KCcuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKTtcclxuICAgICAgJHBhcmVudExpLnJlbW92ZUNsYXNzKGBvcGVucyR7b2xkQ2xhc3N9YCkuYWRkQ2xhc3MoYG9wZW5zLSR7dGhpcy5vcHRpb25zLmFsaWdubWVudH1gKTtcclxuICAgICAgY2xlYXIgPSBGb3VuZGF0aW9uLkJveC5JbU5vdFRvdWNoaW5nWW91KCRzdWIsIG51bGwsIHRydWUpO1xyXG4gICAgICBpZiAoIWNsZWFyKSB7XHJcbiAgICAgICAgJHBhcmVudExpLnJlbW92ZUNsYXNzKGBvcGVucy0ke3RoaXMub3B0aW9ucy5hbGlnbm1lbnR9YCkuYWRkQ2xhc3MoJ29wZW5zLWlubmVyJyk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5jaGFuZ2VkID0gdHJ1ZTtcclxuICAgIH1cclxuICAgICRzdWIuY3NzKCd2aXNpYmlsaXR5JywgJycpO1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spIHsgdGhpcy5fYWRkQm9keUhhbmRsZXIoKTsgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBuZXcgZHJvcGRvd24gcGFuZSBpcyB2aXNpYmxlLlxyXG4gICAgICogQGV2ZW50IERyb3Bkb3duTWVudSNzaG93XHJcbiAgICAgKi9cclxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignc2hvdy56Zi5kcm9wZG93bm1lbnUnLCBbJHN1Yl0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGlkZXMgYSBzaW5nbGUsIGN1cnJlbnRseSBvcGVuIGRyb3Bkb3duIHBhbmUsIGlmIHBhc3NlZCBhIHBhcmFtZXRlciwgb3RoZXJ3aXNlLCBoaWRlcyBldmVyeXRoaW5nLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbSAtIGVsZW1lbnQgd2l0aCBhIHN1Ym1lbnUgdG8gaGlkZVxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpZHggLSBpbmRleCBvZiB0aGUgJHRhYnMgY29sbGVjdGlvbiB0byBoaWRlXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfaGlkZSgkZWxlbSwgaWR4KSB7XHJcbiAgICB2YXIgJHRvQ2xvc2U7XHJcbiAgICBpZiAoJGVsZW0gJiYgJGVsZW0ubGVuZ3RoKSB7XHJcbiAgICAgICR0b0Nsb3NlID0gJGVsZW07XHJcbiAgICB9IGVsc2UgaWYgKGlkeCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICR0b0Nsb3NlID0gdGhpcy4kdGFicy5ub3QoZnVuY3Rpb24oaSwgZWwpIHtcclxuICAgICAgICByZXR1cm4gaSA9PT0gaWR4O1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAkdG9DbG9zZSA9IHRoaXMuJGVsZW1lbnQ7XHJcbiAgICB9XHJcbiAgICB2YXIgc29tZXRoaW5nVG9DbG9zZSA9ICR0b0Nsb3NlLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSB8fCAkdG9DbG9zZS5maW5kKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMDtcclxuXHJcbiAgICBpZiAoc29tZXRoaW5nVG9DbG9zZSkge1xyXG4gICAgICAkdG9DbG9zZS5maW5kKCdsaS5pcy1hY3RpdmUnKS5hZGQoJHRvQ2xvc2UpLmF0dHIoe1xyXG4gICAgICAgICdhcmlhLWV4cGFuZGVkJzogZmFsc2UsXHJcbiAgICAgICAgJ2RhdGEtaXMtY2xpY2snOiBmYWxzZVxyXG4gICAgICB9KS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcblxyXG4gICAgICAkdG9DbG9zZS5maW5kKCd1bC5qcy1kcm9wZG93bi1hY3RpdmUnKS5hdHRyKHtcclxuICAgICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlXHJcbiAgICAgIH0pLnJlbW92ZUNsYXNzKCdqcy1kcm9wZG93bi1hY3RpdmUnKTtcclxuXHJcbiAgICAgIGlmICh0aGlzLmNoYW5nZWQgfHwgJHRvQ2xvc2UuZmluZCgnb3BlbnMtaW5uZXInKS5sZW5ndGgpIHtcclxuICAgICAgICB2YXIgb2xkQ2xhc3MgPSB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID09PSAnbGVmdCcgPyAncmlnaHQnIDogJ2xlZnQnO1xyXG4gICAgICAgICR0b0Nsb3NlLmZpbmQoJ2xpLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JykuYWRkKCR0b0Nsb3NlKVxyXG4gICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKGBvcGVucy1pbm5lciBvcGVucy0ke3RoaXMub3B0aW9ucy5hbGlnbm1lbnR9YClcclxuICAgICAgICAgICAgICAgIC5hZGRDbGFzcyhgb3BlbnMtJHtvbGRDbGFzc31gKTtcclxuICAgICAgICB0aGlzLmNoYW5nZWQgPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICAvKipcclxuICAgICAgICogRmlyZXMgd2hlbiB0aGUgb3BlbiBtZW51cyBhcmUgY2xvc2VkLlxyXG4gICAgICAgKiBAZXZlbnQgRHJvcGRvd25NZW51I2hpZGVcclxuICAgICAgICovXHJcbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignaGlkZS56Zi5kcm9wZG93bm1lbnUnLCBbJHRvQ2xvc2VdKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIHRoZSBwbHVnaW4uXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuJG1lbnVJdGVtcy5vZmYoJy56Zi5kcm9wZG93bm1lbnUnKS5yZW1vdmVBdHRyKCdkYXRhLWlzLWNsaWNrJylcclxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2lzLXJpZ2h0LWFycm93IGlzLWxlZnQtYXJyb3cgaXMtZG93bi1hcnJvdyBvcGVucy1yaWdodCBvcGVucy1sZWZ0IG9wZW5zLWlubmVyJyk7XHJcbiAgICAkKGRvY3VtZW50LmJvZHkpLm9mZignLnpmLmRyb3Bkb3dubWVudScpO1xyXG4gICAgRm91bmRhdGlvbi5OZXN0LkJ1cm4odGhpcy4kZWxlbWVudCwgJ2Ryb3Bkb3duJyk7XHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogRGVmYXVsdCBzZXR0aW5ncyBmb3IgcGx1Z2luXHJcbiAqL1xyXG5Ecm9wZG93bk1lbnUuZGVmYXVsdHMgPSB7XHJcbiAgLyoqXHJcbiAgICogRGlzYWxsb3dzIGhvdmVyIGV2ZW50cyBmcm9tIG9wZW5pbmcgc3VibWVudXNcclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBkaXNhYmxlSG92ZXI6IGZhbHNlLFxyXG4gIC8qKlxyXG4gICAqIEFsbG93IGEgc3VibWVudSB0byBhdXRvbWF0aWNhbGx5IGNsb3NlIG9uIGEgbW91c2VsZWF2ZSBldmVudCwgaWYgbm90IGNsaWNrZWQgb3Blbi5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAqL1xyXG4gIGF1dG9jbG9zZTogdHJ1ZSxcclxuICAvKipcclxuICAgKiBBbW91bnQgb2YgdGltZSB0byBkZWxheSBvcGVuaW5nIGEgc3VibWVudSBvbiBob3ZlciBldmVudC5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgNTBcclxuICAgKi9cclxuICBob3ZlckRlbGF5OiA1MCxcclxuICAvKipcclxuICAgKiBBbGxvdyBhIHN1Ym1lbnUgdG8gb3Blbi9yZW1haW4gb3BlbiBvbiBwYXJlbnQgY2xpY2sgZXZlbnQuIEFsbG93cyBjdXJzb3IgdG8gbW92ZSBhd2F5IGZyb20gbWVudS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAqL1xyXG4gIGNsaWNrT3BlbjogZmFsc2UsXHJcbiAgLyoqXHJcbiAgICogQW1vdW50IG9mIHRpbWUgdG8gZGVsYXkgY2xvc2luZyBhIHN1Ym1lbnUgb24gYSBtb3VzZWxlYXZlIGV2ZW50LlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSA1MDBcclxuICAgKi9cclxuXHJcbiAgY2xvc2luZ1RpbWU6IDUwMCxcclxuICAvKipcclxuICAgKiBQb3NpdGlvbiBvZiB0aGUgbWVudSByZWxhdGl2ZSB0byB3aGF0IGRpcmVjdGlvbiB0aGUgc3VibWVudXMgc2hvdWxkIG9wZW4uIEhhbmRsZWQgYnkgSlMuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICdsZWZ0J1xyXG4gICAqL1xyXG4gIGFsaWdubWVudDogJ2xlZnQnLFxyXG4gIC8qKlxyXG4gICAqIEFsbG93IGNsaWNrcyBvbiB0aGUgYm9keSB0byBjbG9zZSBhbnkgb3BlbiBzdWJtZW51cy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAqL1xyXG4gIGNsb3NlT25DbGljazogdHJ1ZSxcclxuICAvKipcclxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHZlcnRpY2FsIG9yaWVudGVkIG1lbnVzLCBGb3VuZGF0aW9uIGRlZmF1bHQgaXMgYHZlcnRpY2FsYC4gVXBkYXRlIHRoaXMgaWYgdXNpbmcgeW91ciBvd24gY2xhc3MuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICd2ZXJ0aWNhbCdcclxuICAgKi9cclxuICB2ZXJ0aWNhbENsYXNzOiAndmVydGljYWwnLFxyXG4gIC8qKlxyXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gcmlnaHQtc2lkZSBvcmllbnRlZCBtZW51cywgRm91bmRhdGlvbiBkZWZhdWx0IGlzIGBhbGlnbi1yaWdodGAuIFVwZGF0ZSB0aGlzIGlmIHVzaW5nIHlvdXIgb3duIGNsYXNzLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnYWxpZ24tcmlnaHQnXHJcbiAgICovXHJcbiAgcmlnaHRDbGFzczogJ2FsaWduLXJpZ2h0JyxcclxuICAvKipcclxuICAgKiBCb29sZWFuIHRvIGZvcmNlIG92ZXJpZGUgdGhlIGNsaWNraW5nIG9mIGxpbmtzIHRvIHBlcmZvcm0gZGVmYXVsdCBhY3Rpb24sIG9uIHNlY29uZCB0b3VjaCBldmVudCBmb3IgbW9iaWxlLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAqL1xyXG4gIGZvcmNlRm9sbG93OiB0cnVlXHJcbn07XHJcblxyXG4vLyBXaW5kb3cgZXhwb3J0c1xyXG5Gb3VuZGF0aW9uLnBsdWdpbihEcm9wZG93bk1lbnUsICdEcm9wZG93bk1lbnUnKTtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8qKlxyXG4gKiBFcXVhbGl6ZXIgbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uZXF1YWxpemVyXHJcbiAqL1xyXG5cclxuY2xhc3MgRXF1YWxpemVyIHtcclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIEVxdWFsaXplci5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAZmlyZXMgRXF1YWxpemVyI2luaXRcclxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYWRkIHRoZSB0cmlnZ2VyIHRvLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKXtcclxuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgdGhpcy5vcHRpb25zICA9ICQuZXh0ZW5kKHt9LCBFcXVhbGl6ZXIuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcclxuXHJcbiAgICB0aGlzLl9pbml0KCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnRXF1YWxpemVyJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgRXF1YWxpemVyIHBsdWdpbiBhbmQgY2FsbHMgZnVuY3Rpb25zIHRvIGdldCBlcXVhbGl6ZXIgZnVuY3Rpb25pbmcgb24gbG9hZC5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9pbml0KCkge1xyXG4gICAgdmFyIGVxSWQgPSB0aGlzLiRlbGVtZW50LmF0dHIoJ2RhdGEtZXF1YWxpemVyJykgfHwgJyc7XHJcbiAgICB2YXIgJHdhdGNoZWQgPSB0aGlzLiRlbGVtZW50LmZpbmQoYFtkYXRhLWVxdWFsaXplci13YXRjaD1cIiR7ZXFJZH1cIl1gKTtcclxuXHJcbiAgICB0aGlzLiR3YXRjaGVkID0gJHdhdGNoZWQubGVuZ3RoID8gJHdhdGNoZWQgOiB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLWVxdWFsaXplci13YXRjaF0nKTtcclxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignZGF0YS1yZXNpemUnLCAoZXFJZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdlcScpKSk7XHJcblxyXG4gICAgdGhpcy5oYXNOZXN0ZWQgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLWVxdWFsaXplcl0nKS5sZW5ndGggPiAwO1xyXG4gICAgdGhpcy5pc05lc3RlZCA9IHRoaXMuJGVsZW1lbnQucGFyZW50c1VudGlsKGRvY3VtZW50LmJvZHksICdbZGF0YS1lcXVhbGl6ZXJdJykubGVuZ3RoID4gMDtcclxuICAgIHRoaXMuaXNPbiA9IGZhbHNlO1xyXG5cclxuICAgIHZhciBpbWdzID0gdGhpcy4kZWxlbWVudC5maW5kKCdpbWcnKTtcclxuICAgIHZhciB0b29TbWFsbDtcclxuICAgIGlmKHRoaXMub3B0aW9ucy5lcXVhbGl6ZU9uKXtcclxuICAgICAgdG9vU21hbGwgPSB0aGlzLl9jaGVja01RKCk7XHJcbiAgICAgICQod2luZG93KS5vbignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgdGhpcy5fY2hlY2tNUS5iaW5kKHRoaXMpKTtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLl9ldmVudHMoKTtcclxuICAgIH1cclxuICAgIGlmKCh0b29TbWFsbCAhPT0gdW5kZWZpbmVkICYmIHRvb1NtYWxsID09PSBmYWxzZSkgfHwgdG9vU21hbGwgPT09IHVuZGVmaW5lZCl7XHJcbiAgICAgIGlmKGltZ3MubGVuZ3RoKXtcclxuICAgICAgICBGb3VuZGF0aW9uLm9uSW1hZ2VzTG9hZGVkKGltZ3MsIHRoaXMuX3JlZmxvdy5iaW5kKHRoaXMpKTtcclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5fcmVmbG93KCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgZXZlbnQgbGlzdGVuZXJzIGlmIHRoZSBicmVha3BvaW50IGlzIHRvbyBzbWFsbC5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9wYXVzZUV2ZW50cygpIHtcclxuICAgIHRoaXMuaXNPbiA9IGZhbHNlO1xyXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi5lcXVhbGl6ZXIgcmVzaXplbWUuemYudHJpZ2dlcicpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciBFcXVhbGl6ZXIuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfZXZlbnRzKCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHRoaXMuX3BhdXNlRXZlbnRzKCk7XHJcbiAgICBpZih0aGlzLmhhc05lc3RlZCl7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQub24oJ3Bvc3RlcXVhbGl6ZWQuemYuZXF1YWxpemVyJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgaWYoZS50YXJnZXQgIT09IF90aGlzLiRlbGVtZW50WzBdKXsgX3RoaXMuX3JlZmxvdygpOyB9XHJcbiAgICAgIH0pO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQub24oJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInLCB0aGlzLl9yZWZsb3cuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmlzT24gPSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hlY2tzIHRoZSBjdXJyZW50IGJyZWFrcG9pbnQgdG8gdGhlIG1pbmltdW0gcmVxdWlyZWQgc2l6ZS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9jaGVja01RKCkge1xyXG4gICAgdmFyIHRvb1NtYWxsID0gIUZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KHRoaXMub3B0aW9ucy5lcXVhbGl6ZU9uKTtcclxuICAgIGlmKHRvb1NtYWxsKXtcclxuICAgICAgaWYodGhpcy5pc09uKXtcclxuICAgICAgICB0aGlzLl9wYXVzZUV2ZW50cygpO1xyXG4gICAgICAgIHRoaXMuJHdhdGNoZWQuY3NzKCdoZWlnaHQnLCAnYXV0bycpO1xyXG4gICAgICB9XHJcbiAgICB9ZWxzZXtcclxuICAgICAgaWYoIXRoaXMuaXNPbil7XHJcbiAgICAgICAgdGhpcy5fZXZlbnRzKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0b29TbWFsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgbm9vcCB2ZXJzaW9uIGZvciB0aGUgcGx1Z2luXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfa2lsbHN3aXRjaCgpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIG5lY2Vzc2FyeSBmdW5jdGlvbnMgdG8gdXBkYXRlIEVxdWFsaXplciB1cG9uIERPTSBjaGFuZ2VcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9yZWZsb3coKSB7XHJcbiAgICBpZighdGhpcy5vcHRpb25zLmVxdWFsaXplT25TdGFjayl7XHJcbiAgICAgIGlmKHRoaXMuX2lzU3RhY2tlZCgpKXtcclxuICAgICAgICB0aGlzLiR3YXRjaGVkLmNzcygnaGVpZ2h0JywgJ2F1dG8nKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuZXF1YWxpemVCeVJvdykge1xyXG4gICAgICB0aGlzLmdldEhlaWdodHNCeVJvdyh0aGlzLmFwcGx5SGVpZ2h0QnlSb3cuYmluZCh0aGlzKSk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5nZXRIZWlnaHRzKHRoaXMuYXBwbHlIZWlnaHQuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNYW51YWxseSBkZXRlcm1pbmVzIGlmIHRoZSBmaXJzdCAyIGVsZW1lbnRzIGFyZSAqTk9UKiBzdGFja2VkLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2lzU3RhY2tlZCgpIHtcclxuICAgIHJldHVybiB0aGlzLiR3YXRjaGVkWzBdLm9mZnNldFRvcCAhPT0gdGhpcy4kd2F0Y2hlZFsxXS5vZmZzZXRUb3A7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGaW5kcyB0aGUgb3V0ZXIgaGVpZ2h0cyBvZiBjaGlsZHJlbiBjb250YWluZWQgd2l0aGluIGFuIEVxdWFsaXplciBwYXJlbnQgYW5kIHJldHVybnMgdGhlbSBpbiBhbiBhcnJheVxyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gQSBub24tb3B0aW9uYWwgY2FsbGJhY2sgdG8gcmV0dXJuIHRoZSBoZWlnaHRzIGFycmF5IHRvLlxyXG4gICAqIEByZXR1cm5zIHtBcnJheX0gaGVpZ2h0cyAtIEFuIGFycmF5IG9mIGhlaWdodHMgb2YgY2hpbGRyZW4gd2l0aGluIEVxdWFsaXplciBjb250YWluZXJcclxuICAgKi9cclxuICBnZXRIZWlnaHRzKGNiKSB7XHJcbiAgICB2YXIgaGVpZ2h0cyA9IFtdO1xyXG4gICAgZm9yKHZhciBpID0gMCwgbGVuID0gdGhpcy4kd2F0Y2hlZC5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XHJcbiAgICAgIHRoaXMuJHdhdGNoZWRbaV0uc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nO1xyXG4gICAgICBoZWlnaHRzLnB1c2godGhpcy4kd2F0Y2hlZFtpXS5vZmZzZXRIZWlnaHQpO1xyXG4gICAgfVxyXG4gICAgY2IoaGVpZ2h0cyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGaW5kcyB0aGUgb3V0ZXIgaGVpZ2h0cyBvZiBjaGlsZHJlbiBjb250YWluZWQgd2l0aGluIGFuIEVxdWFsaXplciBwYXJlbnQgYW5kIHJldHVybnMgdGhlbSBpbiBhbiBhcnJheVxyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gQSBub24tb3B0aW9uYWwgY2FsbGJhY2sgdG8gcmV0dXJuIHRoZSBoZWlnaHRzIGFycmF5IHRvLlxyXG4gICAqIEByZXR1cm5zIHtBcnJheX0gZ3JvdXBzIC0gQW4gYXJyYXkgb2YgaGVpZ2h0cyBvZiBjaGlsZHJlbiB3aXRoaW4gRXF1YWxpemVyIGNvbnRhaW5lciBncm91cGVkIGJ5IHJvdyB3aXRoIGVsZW1lbnQsaGVpZ2h0IGFuZCBtYXggYXMgbGFzdCBjaGlsZFxyXG4gICAqL1xyXG4gIGdldEhlaWdodHNCeVJvdyhjYikge1xyXG4gICAgdmFyIGxhc3RFbFRvcE9mZnNldCA9ICh0aGlzLiR3YXRjaGVkLmxlbmd0aCA/IHRoaXMuJHdhdGNoZWQuZmlyc3QoKS5vZmZzZXQoKS50b3AgOiAwKSxcclxuICAgICAgICBncm91cHMgPSBbXSxcclxuICAgICAgICBncm91cCA9IDA7XHJcbiAgICAvL2dyb3VwIGJ5IFJvd1xyXG4gICAgZ3JvdXBzW2dyb3VwXSA9IFtdO1xyXG4gICAgZm9yKHZhciBpID0gMCwgbGVuID0gdGhpcy4kd2F0Y2hlZC5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XHJcbiAgICAgIHRoaXMuJHdhdGNoZWRbaV0uc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nO1xyXG4gICAgICAvL21heWJlIGNvdWxkIHVzZSB0aGlzLiR3YXRjaGVkW2ldLm9mZnNldFRvcFxyXG4gICAgICB2YXIgZWxPZmZzZXRUb3AgPSAkKHRoaXMuJHdhdGNoZWRbaV0pLm9mZnNldCgpLnRvcDtcclxuICAgICAgaWYgKGVsT2Zmc2V0VG9wIT1sYXN0RWxUb3BPZmZzZXQpIHtcclxuICAgICAgICBncm91cCsrO1xyXG4gICAgICAgIGdyb3Vwc1tncm91cF0gPSBbXTtcclxuICAgICAgICBsYXN0RWxUb3BPZmZzZXQ9ZWxPZmZzZXRUb3A7XHJcbiAgICAgIH1cclxuICAgICAgZ3JvdXBzW2dyb3VwXS5wdXNoKFt0aGlzLiR3YXRjaGVkW2ldLHRoaXMuJHdhdGNoZWRbaV0ub2Zmc2V0SGVpZ2h0XSk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaiA9IDAsIGxuID0gZ3JvdXBzLmxlbmd0aDsgaiA8IGxuOyBqKyspIHtcclxuICAgICAgdmFyIGhlaWdodHMgPSAkKGdyb3Vwc1tqXSkubWFwKGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzWzFdOyB9KS5nZXQoKTtcclxuICAgICAgdmFyIG1heCAgICAgICAgID0gTWF0aC5tYXguYXBwbHkobnVsbCwgaGVpZ2h0cyk7XHJcbiAgICAgIGdyb3Vwc1tqXS5wdXNoKG1heCk7XHJcbiAgICB9XHJcbiAgICBjYihncm91cHMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hhbmdlcyB0aGUgQ1NTIGhlaWdodCBwcm9wZXJ0eSBvZiBlYWNoIGNoaWxkIGluIGFuIEVxdWFsaXplciBwYXJlbnQgdG8gbWF0Y2ggdGhlIHRhbGxlc3RcclxuICAgKiBAcGFyYW0ge2FycmF5fSBoZWlnaHRzIC0gQW4gYXJyYXkgb2YgaGVpZ2h0cyBvZiBjaGlsZHJlbiB3aXRoaW4gRXF1YWxpemVyIGNvbnRhaW5lclxyXG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcHJlZXF1YWxpemVkXHJcbiAgICogQGZpcmVzIEVxdWFsaXplciNwb3N0ZXF1YWxpemVkXHJcbiAgICovXHJcbiAgYXBwbHlIZWlnaHQoaGVpZ2h0cykge1xyXG4gICAgdmFyIG1heCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGhlaWdodHMpO1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBiZWZvcmUgdGhlIGhlaWdodHMgYXJlIGFwcGxpZWRcclxuICAgICAqIEBldmVudCBFcXVhbGl6ZXIjcHJlZXF1YWxpemVkXHJcbiAgICAgKi9cclxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigncHJlZXF1YWxpemVkLnpmLmVxdWFsaXplcicpO1xyXG5cclxuICAgIHRoaXMuJHdhdGNoZWQuY3NzKCdoZWlnaHQnLCBtYXgpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB0aGUgaGVpZ2h0cyBoYXZlIGJlZW4gYXBwbGllZFxyXG4gICAgICogQGV2ZW50IEVxdWFsaXplciNwb3N0ZXF1YWxpemVkXHJcbiAgICAgKi9cclxuICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3Bvc3RlcXVhbGl6ZWQuemYuZXF1YWxpemVyJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGFuZ2VzIHRoZSBDU1MgaGVpZ2h0IHByb3BlcnR5IG9mIGVhY2ggY2hpbGQgaW4gYW4gRXF1YWxpemVyIHBhcmVudCB0byBtYXRjaCB0aGUgdGFsbGVzdCBieSByb3dcclxuICAgKiBAcGFyYW0ge2FycmF5fSBncm91cHMgLSBBbiBhcnJheSBvZiBoZWlnaHRzIG9mIGNoaWxkcmVuIHdpdGhpbiBFcXVhbGl6ZXIgY29udGFpbmVyIGdyb3VwZWQgYnkgcm93IHdpdGggZWxlbWVudCxoZWlnaHQgYW5kIG1heCBhcyBsYXN0IGNoaWxkXHJcbiAgICogQGZpcmVzIEVxdWFsaXplciNwcmVlcXVhbGl6ZWRcclxuICAgKiBAZmlyZXMgRXF1YWxpemVyI3ByZWVxdWFsaXplZFJvd1xyXG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcG9zdGVxdWFsaXplZFJvd1xyXG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcG9zdGVxdWFsaXplZFxyXG4gICAqL1xyXG4gIGFwcGx5SGVpZ2h0QnlSb3coZ3JvdXBzKSB7XHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGJlZm9yZSB0aGUgaGVpZ2h0cyBhcmUgYXBwbGllZFxyXG4gICAgICovXHJcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3ByZWVxdWFsaXplZC56Zi5lcXVhbGl6ZXInKTtcclxuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBncm91cHMubGVuZ3RoOyBpIDwgbGVuIDsgaSsrKSB7XHJcbiAgICAgIHZhciBncm91cHNJTGVuZ3RoID0gZ3JvdXBzW2ldLmxlbmd0aCxcclxuICAgICAgICAgIG1heCA9IGdyb3Vwc1tpXVtncm91cHNJTGVuZ3RoIC0gMV07XHJcbiAgICAgIGlmIChncm91cHNJTGVuZ3RoPD0yKSB7XHJcbiAgICAgICAgJChncm91cHNbaV1bMF1bMF0pLmNzcyh7J2hlaWdodCc6J2F1dG8nfSk7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuICAgICAgLyoqXHJcbiAgICAgICAgKiBGaXJlcyBiZWZvcmUgdGhlIGhlaWdodHMgcGVyIHJvdyBhcmUgYXBwbGllZFxyXG4gICAgICAgICogQGV2ZW50IEVxdWFsaXplciNwcmVlcXVhbGl6ZWRSb3dcclxuICAgICAgICAqL1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3ByZWVxdWFsaXplZHJvdy56Zi5lcXVhbGl6ZXInKTtcclxuICAgICAgZm9yICh2YXIgaiA9IDAsIGxlbkogPSAoZ3JvdXBzSUxlbmd0aC0xKTsgaiA8IGxlbkogOyBqKyspIHtcclxuICAgICAgICAkKGdyb3Vwc1tpXVtqXVswXSkuY3NzKHsnaGVpZ2h0JzptYXh9KTtcclxuICAgICAgfVxyXG4gICAgICAvKipcclxuICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIGhlaWdodHMgcGVyIHJvdyBoYXZlIGJlZW4gYXBwbGllZFxyXG4gICAgICAgICogQGV2ZW50IEVxdWFsaXplciNwb3N0ZXF1YWxpemVkUm93XHJcbiAgICAgICAgKi9cclxuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwb3N0ZXF1YWxpemVkcm93LnpmLmVxdWFsaXplcicpO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBoZWlnaHRzIGhhdmUgYmVlbiBhcHBsaWVkXHJcbiAgICAgKi9cclxuICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3Bvc3RlcXVhbGl6ZWQuemYuZXF1YWxpemVyJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiBFcXVhbGl6ZXIuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuX3BhdXNlRXZlbnRzKCk7XHJcbiAgICB0aGlzLiR3YXRjaGVkLmNzcygnaGVpZ2h0JywgJ2F1dG8nKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogRGVmYXVsdCBzZXR0aW5ncyBmb3IgcGx1Z2luXHJcbiAqL1xyXG5FcXVhbGl6ZXIuZGVmYXVsdHMgPSB7XHJcbiAgLyoqXHJcbiAgICogRW5hYmxlIGhlaWdodCBlcXVhbGl6YXRpb24gd2hlbiBzdGFja2VkIG9uIHNtYWxsZXIgc2NyZWVucy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAqL1xyXG4gIGVxdWFsaXplT25TdGFjazogdHJ1ZSxcclxuICAvKipcclxuICAgKiBFbmFibGUgaGVpZ2h0IGVxdWFsaXphdGlvbiByb3cgYnkgcm93LlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAqL1xyXG4gIGVxdWFsaXplQnlSb3c6IGZhbHNlLFxyXG4gIC8qKlxyXG4gICAqIFN0cmluZyByZXByZXNlbnRpbmcgdGhlIG1pbmltdW0gYnJlYWtwb2ludCBzaXplIHRoZSBwbHVnaW4gc2hvdWxkIGVxdWFsaXplIGhlaWdodHMgb24uXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICdtZWRpdW0nXHJcbiAgICovXHJcbiAgZXF1YWxpemVPbjogJydcclxufTtcclxuXHJcbi8vIFdpbmRvdyBleHBvcnRzXHJcbkZvdW5kYXRpb24ucGx1Z2luKEVxdWFsaXplciwgJ0VxdWFsaXplcicpO1xyXG5cclxufShqUXVlcnkpO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4hZnVuY3Rpb24oJCkge1xyXG5cclxuLyoqXHJcbiAqIEludGVyY2hhbmdlIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmludGVyY2hhbmdlXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRpbWVyQW5kSW1hZ2VMb2FkZXJcclxuICovXHJcblxyXG5jbGFzcyBJbnRlcmNoYW5nZSB7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBJbnRlcmNoYW5nZS5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAZmlyZXMgSW50ZXJjaGFuZ2UjaW5pdFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIHRyaWdnZXIgdG8uXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIEludGVyY2hhbmdlLmRlZmF1bHRzLCBvcHRpb25zKTtcclxuICAgIHRoaXMucnVsZXMgPSBbXTtcclxuICAgIHRoaXMuY3VycmVudFBhdGggPSAnJztcclxuXHJcbiAgICB0aGlzLl9pbml0KCk7XHJcbiAgICB0aGlzLl9ldmVudHMoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdJbnRlcmNoYW5nZScpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIEludGVyY2hhbmdlIHBsdWdpbiBhbmQgY2FsbHMgZnVuY3Rpb25zIHRvIGdldCBpbnRlcmNoYW5nZSBmdW5jdGlvbmluZyBvbiBsb2FkLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2luaXQoKSB7XHJcbiAgICB0aGlzLl9hZGRCcmVha3BvaW50cygpO1xyXG4gICAgdGhpcy5fZ2VuZXJhdGVSdWxlcygpO1xyXG4gICAgdGhpcy5fcmVmbG93KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyBldmVudHMgZm9yIEludGVyY2hhbmdlLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2V2ZW50cygpIHtcclxuICAgICQod2luZG93KS5vbigncmVzaXplLnpmLmludGVyY2hhbmdlJywgRm91bmRhdGlvbi51dGlsLnRocm90dGxlKHRoaXMuX3JlZmxvdy5iaW5kKHRoaXMpLCA1MCkpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgbmVjZXNzYXJ5IGZ1bmN0aW9ucyB0byB1cGRhdGUgSW50ZXJjaGFuZ2UgdXBvbiBET00gY2hhbmdlXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfcmVmbG93KCkge1xyXG4gICAgdmFyIG1hdGNoO1xyXG5cclxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHJ1bGUsIGJ1dCBvbmx5IHNhdmUgdGhlIGxhc3QgbWF0Y2hcclxuICAgIGZvciAodmFyIGkgaW4gdGhpcy5ydWxlcykge1xyXG4gICAgICB2YXIgcnVsZSA9IHRoaXMucnVsZXNbaV07XHJcblxyXG4gICAgICBpZiAod2luZG93Lm1hdGNoTWVkaWEocnVsZS5xdWVyeSkubWF0Y2hlcykge1xyXG4gICAgICAgIG1hdGNoID0gcnVsZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChtYXRjaCkge1xyXG4gICAgICB0aGlzLnJlcGxhY2UobWF0Y2gucGF0aCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBGb3VuZGF0aW9uIGJyZWFrcG9pbnRzIGFuZCBhZGRzIHRoZW0gdG8gdGhlIEludGVyY2hhbmdlLlNQRUNJQUxfUVVFUklFUyBvYmplY3QuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfYWRkQnJlYWtwb2ludHMoKSB7XHJcbiAgICBmb3IgKHZhciBpIGluIEZvdW5kYXRpb24uTWVkaWFRdWVyeS5xdWVyaWVzKSB7XHJcbiAgICAgIHZhciBxdWVyeSA9IEZvdW5kYXRpb24uTWVkaWFRdWVyeS5xdWVyaWVzW2ldO1xyXG4gICAgICBJbnRlcmNoYW5nZS5TUEVDSUFMX1FVRVJJRVNbcXVlcnkubmFtZV0gPSBxdWVyeS52YWx1ZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrcyB0aGUgSW50ZXJjaGFuZ2UgZWxlbWVudCBmb3IgdGhlIHByb3ZpZGVkIG1lZGlhIHF1ZXJ5ICsgY29udGVudCBwYWlyaW5nc1xyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRoYXQgaXMgYW4gSW50ZXJjaGFuZ2UgaW5zdGFuY2VcclxuICAgKiBAcmV0dXJucyB7QXJyYXl9IHNjZW5hcmlvcyAtIEFycmF5IG9mIG9iamVjdHMgdGhhdCBoYXZlICdtcScgYW5kICdwYXRoJyBrZXlzIHdpdGggY29ycmVzcG9uZGluZyBrZXlzXHJcbiAgICovXHJcbiAgX2dlbmVyYXRlUnVsZXMoZWxlbWVudCkge1xyXG4gICAgdmFyIHJ1bGVzTGlzdCA9IFtdO1xyXG4gICAgdmFyIHJ1bGVzO1xyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMucnVsZXMpIHtcclxuICAgICAgcnVsZXMgPSB0aGlzLm9wdGlvbnMucnVsZXM7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcnVsZXMgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ2ludGVyY2hhbmdlJykubWF0Y2goL1xcWy4qP1xcXS9nKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBpIGluIHJ1bGVzKSB7XHJcbiAgICAgIHZhciBydWxlID0gcnVsZXNbaV0uc2xpY2UoMSwgLTEpLnNwbGl0KCcsICcpO1xyXG4gICAgICB2YXIgcGF0aCA9IHJ1bGUuc2xpY2UoMCwgLTEpLmpvaW4oJycpO1xyXG4gICAgICB2YXIgcXVlcnkgPSBydWxlW3J1bGUubGVuZ3RoIC0gMV07XHJcblxyXG4gICAgICBpZiAoSW50ZXJjaGFuZ2UuU1BFQ0lBTF9RVUVSSUVTW3F1ZXJ5XSkge1xyXG4gICAgICAgIHF1ZXJ5ID0gSW50ZXJjaGFuZ2UuU1BFQ0lBTF9RVUVSSUVTW3F1ZXJ5XTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcnVsZXNMaXN0LnB1c2goe1xyXG4gICAgICAgIHBhdGg6IHBhdGgsXHJcbiAgICAgICAgcXVlcnk6IHF1ZXJ5XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucnVsZXMgPSBydWxlc0xpc3Q7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVcGRhdGUgdGhlIGBzcmNgIHByb3BlcnR5IG9mIGFuIGltYWdlLCBvciBjaGFuZ2UgdGhlIEhUTUwgb2YgYSBjb250YWluZXIsIHRvIHRoZSBzcGVjaWZpZWQgcGF0aC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCAtIFBhdGggdG8gdGhlIGltYWdlIG9yIEhUTUwgcGFydGlhbC5cclxuICAgKiBAZmlyZXMgSW50ZXJjaGFuZ2UjcmVwbGFjZWRcclxuICAgKi9cclxuICByZXBsYWNlKHBhdGgpIHtcclxuICAgIGlmICh0aGlzLmN1cnJlbnRQYXRoID09PSBwYXRoKSByZXR1cm47XHJcblxyXG4gICAgdmFyIF90aGlzID0gdGhpcyxcclxuICAgICAgICB0cmlnZ2VyID0gJ3JlcGxhY2VkLnpmLmludGVyY2hhbmdlJztcclxuXHJcbiAgICAvLyBSZXBsYWNpbmcgaW1hZ2VzXHJcbiAgICBpZiAodGhpcy4kZWxlbWVudFswXS5ub2RlTmFtZSA9PT0gJ0lNRycpIHtcclxuICAgICAgdGhpcy4kZWxlbWVudC5hdHRyKCdzcmMnLCBwYXRoKS5sb2FkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIF90aGlzLmN1cnJlbnRQYXRoID0gcGF0aDtcclxuICAgICAgfSlcclxuICAgICAgLnRyaWdnZXIodHJpZ2dlcik7XHJcbiAgICB9XHJcbiAgICAvLyBSZXBsYWNpbmcgYmFja2dyb3VuZCBpbWFnZXNcclxuICAgIGVsc2UgaWYgKHBhdGgubWF0Y2goL1xcLihnaWZ8anBnfGpwZWd8cG5nfHN2Z3x0aWZmKShbPyNdLiopPy9pKSkge1xyXG4gICAgICB0aGlzLiRlbGVtZW50LmNzcyh7ICdiYWNrZ3JvdW5kLWltYWdlJzogJ3VybCgnK3BhdGgrJyknIH0pXHJcbiAgICAgICAgICAudHJpZ2dlcih0cmlnZ2VyKTtcclxuICAgIH1cclxuICAgIC8vIFJlcGxhY2luZyBIVE1MXHJcbiAgICBlbHNlIHtcclxuICAgICAgJC5nZXQocGF0aCwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICBfdGhpcy4kZWxlbWVudC5odG1sKHJlc3BvbnNlKVxyXG4gICAgICAgICAgICAgLnRyaWdnZXIodHJpZ2dlcik7XHJcbiAgICAgICAgJChyZXNwb25zZSkuZm91bmRhdGlvbigpO1xyXG4gICAgICAgIF90aGlzLmN1cnJlbnRQYXRoID0gcGF0aDtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIGNvbnRlbnQgaW4gYW4gSW50ZXJjaGFuZ2UgZWxlbWVudCBpcyBkb25lIGJlaW5nIGxvYWRlZC5cclxuICAgICAqIEBldmVudCBJbnRlcmNoYW5nZSNyZXBsYWNlZFxyXG4gICAgICovXHJcbiAgICAvLyB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3JlcGxhY2VkLnpmLmludGVyY2hhbmdlJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiBpbnRlcmNoYW5nZS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBkZXN0cm95KCkge1xyXG4gICAgLy9UT0RPIHRoaXMuXHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogRGVmYXVsdCBzZXR0aW5ncyBmb3IgcGx1Z2luXHJcbiAqL1xyXG5JbnRlcmNoYW5nZS5kZWZhdWx0cyA9IHtcclxuICAvKipcclxuICAgKiBSdWxlcyB0byBiZSBhcHBsaWVkIHRvIEludGVyY2hhbmdlIGVsZW1lbnRzLiBTZXQgd2l0aCB0aGUgYGRhdGEtaW50ZXJjaGFuZ2VgIGFycmF5IG5vdGF0aW9uLlxyXG4gICAqIEBvcHRpb25cclxuICAgKi9cclxuICBydWxlczogbnVsbFxyXG59O1xyXG5cclxuSW50ZXJjaGFuZ2UuU1BFQ0lBTF9RVUVSSUVTID0ge1xyXG4gICdsYW5kc2NhcGUnOiAnc2NyZWVuIGFuZCAob3JpZW50YXRpb246IGxhbmRzY2FwZSknLFxyXG4gICdwb3J0cmFpdCc6ICdzY3JlZW4gYW5kIChvcmllbnRhdGlvbjogcG9ydHJhaXQpJyxcclxuICAncmV0aW5hJzogJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwgb25seSBzY3JlZW4gYW5kIChtaW4tLW1vei1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCBvbmx5IHNjcmVlbiBhbmQgKC1vLW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIvMSksIG9ubHkgc2NyZWVuIGFuZCAobWluLWRldmljZS1waXhlbC1yYXRpbzogMiksIG9ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDE5MmRwaSksIG9ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDJkcHB4KSdcclxufTtcclxuXHJcbi8vIFdpbmRvdyBleHBvcnRzXHJcbkZvdW5kYXRpb24ucGx1Z2luKEludGVyY2hhbmdlLCAnSW50ZXJjaGFuZ2UnKTtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8qKlxyXG4gKiBNYWdlbGxhbiBtb2R1bGUuXHJcbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5tYWdlbGxhblxyXG4gKi9cclxuXHJcbmNsYXNzIE1hZ2VsbGFuIHtcclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIE1hZ2VsbGFuLlxyXG4gICAqIEBjbGFzc1xyXG4gICAqIEBmaXJlcyBNYWdlbGxhbiNpbml0XHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGFkZCB0aGUgdHJpZ2dlciB0by5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgID0gJC5leHRlbmQoe30sIE1hZ2VsbGFuLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ01hZ2VsbGFuJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgTWFnZWxsYW4gcGx1Z2luIGFuZCBjYWxscyBmdW5jdGlvbnMgdG8gZ2V0IGVxdWFsaXplciBmdW5jdGlvbmluZyBvbiBsb2FkLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2luaXQoKSB7XHJcbiAgICB2YXIgaWQgPSB0aGlzLiRlbGVtZW50WzBdLmlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ21hZ2VsbGFuJyk7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgdGhpcy4kdGFyZ2V0cyA9ICQoJ1tkYXRhLW1hZ2VsbGFuLXRhcmdldF0nKTtcclxuICAgIHRoaXMuJGxpbmtzID0gdGhpcy4kZWxlbWVudC5maW5kKCdhJyk7XHJcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoe1xyXG4gICAgICAnZGF0YS1yZXNpemUnOiBpZCxcclxuICAgICAgJ2RhdGEtc2Nyb2xsJzogaWQsXHJcbiAgICAgICdpZCc6IGlkXHJcbiAgICB9KTtcclxuICAgIHRoaXMuJGFjdGl2ZSA9ICQoKTtcclxuICAgIHRoaXMuc2Nyb2xsUG9zID0gcGFyc2VJbnQod2luZG93LnBhZ2VZT2Zmc2V0LCAxMCk7XHJcblxyXG4gICAgdGhpcy5fZXZlbnRzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxjdWxhdGVzIGFuIGFycmF5IG9mIHBpeGVsIHZhbHVlcyB0aGF0IGFyZSB0aGUgZGVtYXJjYXRpb24gbGluZXMgYmV0d2VlbiBsb2NhdGlvbnMgb24gdGhlIHBhZ2UuXHJcbiAgICogQ2FuIGJlIGludm9rZWQgaWYgbmV3IGVsZW1lbnRzIGFyZSBhZGRlZCBvciB0aGUgc2l6ZSBvZiBhIGxvY2F0aW9uIGNoYW5nZXMuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgY2FsY1BvaW50cygpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXMsXHJcbiAgICAgICAgYm9keSA9IGRvY3VtZW50LmJvZHksXHJcbiAgICAgICAgaHRtbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcclxuXHJcbiAgICB0aGlzLnBvaW50cyA9IFtdO1xyXG4gICAgdGhpcy53aW5IZWlnaHQgPSBNYXRoLnJvdW5kKE1hdGgubWF4KHdpbmRvdy5pbm5lckhlaWdodCwgaHRtbC5jbGllbnRIZWlnaHQpKTtcclxuICAgIHRoaXMuZG9jSGVpZ2h0ID0gTWF0aC5yb3VuZChNYXRoLm1heChib2R5LnNjcm9sbEhlaWdodCwgYm9keS5vZmZzZXRIZWlnaHQsIGh0bWwuY2xpZW50SGVpZ2h0LCBodG1sLnNjcm9sbEhlaWdodCwgaHRtbC5vZmZzZXRIZWlnaHQpKTtcclxuXHJcbiAgICB0aGlzLiR0YXJnZXRzLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgdmFyICR0YXIgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgcHQgPSBNYXRoLnJvdW5kKCR0YXIub2Zmc2V0KCkudG9wIC0gX3RoaXMub3B0aW9ucy50aHJlc2hvbGQpO1xyXG4gICAgICAkdGFyLnRhcmdldFBvaW50ID0gcHQ7XHJcbiAgICAgIF90aGlzLnBvaW50cy5wdXNoKHB0KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciBNYWdlbGxhbi5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9ldmVudHMoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxyXG4gICAgICAgICRib2R5ID0gJCgnaHRtbCwgYm9keScpLFxyXG4gICAgICAgIG9wdHMgPSB7XHJcbiAgICAgICAgICBkdXJhdGlvbjogX3RoaXMub3B0aW9ucy5hbmltYXRpb25EdXJhdGlvbixcclxuICAgICAgICAgIGVhc2luZzogICBfdGhpcy5vcHRpb25zLmFuaW1hdGlvbkVhc2luZ1xyXG4gICAgICAgIH07XHJcbiAgICAkKHdpbmRvdykub25lKCdsb2FkJywgZnVuY3Rpb24oKXtcclxuICAgICAgaWYoX3RoaXMub3B0aW9ucy5kZWVwTGlua2luZyl7XHJcbiAgICAgICAgaWYobG9jYXRpb24uaGFzaCl7XHJcbiAgICAgICAgICBfdGhpcy5zY3JvbGxUb0xvYyhsb2NhdGlvbi5oYXNoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgX3RoaXMuY2FsY1BvaW50cygpO1xyXG4gICAgICBfdGhpcy5fdXBkYXRlQWN0aXZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLiRlbGVtZW50Lm9uKHtcclxuICAgICAgJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInOiB0aGlzLnJlZmxvdy5iaW5kKHRoaXMpLFxyXG4gICAgICAnc2Nyb2xsbWUuemYudHJpZ2dlcic6IHRoaXMuX3VwZGF0ZUFjdGl2ZS5iaW5kKHRoaXMpXHJcbiAgICB9KS5vbignY2xpY2suemYubWFnZWxsYW4nLCAnYVtocmVmXj1cIiNcIl0nLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHZhciBhcnJpdmFsICAgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xyXG4gICAgICAgIF90aGlzLnNjcm9sbFRvTG9jKGFycml2YWwpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGdW5jdGlvbiB0byBzY3JvbGwgdG8gYSBnaXZlbiBsb2NhdGlvbiBvbiB0aGUgcGFnZS5cclxuICAgKiBAcGFyYW0ge1N0cmluZ30gbG9jIC0gYSBwcm9wZXJseSBmb3JtYXR0ZWQgalF1ZXJ5IGlkIHNlbGVjdG9yLiBFeGFtcGxlOiAnI2ZvbydcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBzY3JvbGxUb0xvYyhsb2MpIHtcclxuICAgIHZhciBzY3JvbGxQb3MgPSBNYXRoLnJvdW5kKCQobG9jKS5vZmZzZXQoKS50b3AgLSB0aGlzLm9wdGlvbnMudGhyZXNob2xkIC8gMiAtIHRoaXMub3B0aW9ucy5iYXJPZmZzZXQpO1xyXG5cclxuICAgICQoJ2h0bWwsIGJvZHknKS5zdG9wKHRydWUpLmFuaW1hdGUoeyBzY3JvbGxUb3A6IHNjcm9sbFBvcyB9LCB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uRHVyYXRpb24sIHRoaXMub3B0aW9ucy5hbmltYXRpb25FYXNpbmcpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgbmVjZXNzYXJ5IGZ1bmN0aW9ucyB0byB1cGRhdGUgTWFnZWxsYW4gdXBvbiBET00gY2hhbmdlXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgcmVmbG93KCkge1xyXG4gICAgdGhpcy5jYWxjUG9pbnRzKCk7XHJcbiAgICB0aGlzLl91cGRhdGVBY3RpdmUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZXMgdGhlIHZpc2liaWxpdHkgb2YgYW4gYWN0aXZlIGxvY2F0aW9uIGxpbmssIGFuZCB1cGRhdGVzIHRoZSB1cmwgaGFzaCBmb3IgdGhlIHBhZ2UsIGlmIGRlZXBMaW5raW5nIGVuYWJsZWQuXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAZmlyZXMgTWFnZWxsYW4jdXBkYXRlXHJcbiAgICovXHJcbiAgX3VwZGF0ZUFjdGl2ZSgvKmV2dCwgZWxlbSwgc2Nyb2xsUG9zKi8pIHtcclxuICAgIHZhciB3aW5Qb3MgPSAvKnNjcm9sbFBvcyB8fCovIHBhcnNlSW50KHdpbmRvdy5wYWdlWU9mZnNldCwgMTApLFxyXG4gICAgICAgIGN1cklkeDtcclxuXHJcbiAgICBpZih3aW5Qb3MgKyB0aGlzLndpbkhlaWdodCA9PT0gdGhpcy5kb2NIZWlnaHQpeyBjdXJJZHggPSB0aGlzLnBvaW50cy5sZW5ndGggLSAxOyB9XHJcbiAgICBlbHNlIGlmKHdpblBvcyA8IHRoaXMucG9pbnRzWzBdKXsgY3VySWR4ID0gMDsgfVxyXG4gICAgZWxzZXtcclxuICAgICAgdmFyIGlzRG93biA9IHRoaXMuc2Nyb2xsUG9zIDwgd2luUG9zLFxyXG4gICAgICAgICAgX3RoaXMgPSB0aGlzLFxyXG4gICAgICAgICAgY3VyVmlzaWJsZSA9IHRoaXMucG9pbnRzLmZpbHRlcihmdW5jdGlvbihwLCBpKXtcclxuICAgICAgICAgICAgcmV0dXJuIGlzRG93biA/IHAgPD0gd2luUG9zIDogcCAtIF90aGlzLm9wdGlvbnMudGhyZXNob2xkIDw9IHdpblBvczsvLyYmIHdpblBvcyA+PSBfdGhpcy5wb2ludHNbaSAtMV0gLSBfdGhpcy5vcHRpb25zLnRocmVzaG9sZDtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICBjdXJJZHggPSBjdXJWaXNpYmxlLmxlbmd0aCA/IGN1clZpc2libGUubGVuZ3RoIC0gMSA6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy4kYWN0aXZlLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XHJcbiAgICB0aGlzLiRhY3RpdmUgPSB0aGlzLiRsaW5rcy5lcShjdXJJZHgpLmFkZENsYXNzKHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XHJcblxyXG4gICAgaWYodGhpcy5vcHRpb25zLmRlZXBMaW5raW5nKXtcclxuICAgICAgdmFyIGhhc2ggPSB0aGlzLiRhY3RpdmVbMF0uZ2V0QXR0cmlidXRlKCdocmVmJyk7XHJcbiAgICAgIGlmKHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZSl7XHJcbiAgICAgICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsIGhhc2gpO1xyXG4gICAgICB9ZWxzZXtcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9IGhhc2g7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNjcm9sbFBvcyA9IHdpblBvcztcclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiBtYWdlbGxhbiBpcyBmaW5pc2hlZCB1cGRhdGluZyB0byB0aGUgbmV3IGFjdGl2ZSBlbGVtZW50LlxyXG4gICAgICogQGV2ZW50IE1hZ2VsbGFuI3VwZGF0ZVxyXG4gICAgICovXHJcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3VwZGF0ZS56Zi5tYWdlbGxhbicsIFt0aGlzLiRhY3RpdmVdKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIE1hZ2VsbGFuIGFuZCByZXNldHMgdGhlIHVybCBvZiB0aGUgd2luZG93LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRyaWdnZXIgLnpmLm1hZ2VsbGFuJylcclxuICAgICAgICAuZmluZChgLiR7dGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzfWApLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XHJcblxyXG4gICAgaWYodGhpcy5vcHRpb25zLmRlZXBMaW5raW5nKXtcclxuICAgICAgdmFyIGhhc2ggPSB0aGlzLiRhY3RpdmVbMF0uZ2V0QXR0cmlidXRlKCdocmVmJyk7XHJcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoLnJlcGxhY2UoaGFzaCwgJycpO1xyXG4gICAgfVxyXG5cclxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZWZhdWx0IHNldHRpbmdzIGZvciBwbHVnaW5cclxuICovXHJcbk1hZ2VsbGFuLmRlZmF1bHRzID0ge1xyXG4gIC8qKlxyXG4gICAqIEFtb3VudCBvZiB0aW1lLCBpbiBtcywgdGhlIGFuaW1hdGVkIHNjcm9sbGluZyBzaG91bGQgdGFrZSBiZXR3ZWVuIGxvY2F0aW9ucy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgNTAwXHJcbiAgICovXHJcbiAgYW5pbWF0aW9uRHVyYXRpb246IDUwMCxcclxuICAvKipcclxuICAgKiBBbmltYXRpb24gc3R5bGUgdG8gdXNlIHdoZW4gc2Nyb2xsaW5nIGJldHdlZW4gbG9jYXRpb25zLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnZWFzZS1pbi1vdXQnXHJcbiAgICovXHJcbiAgYW5pbWF0aW9uRWFzaW5nOiAnbGluZWFyJyxcclxuICAvKipcclxuICAgKiBOdW1iZXIgb2YgcGl4ZWxzIHRvIHVzZSBhcyBhIG1hcmtlciBmb3IgbG9jYXRpb24gY2hhbmdlcy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgNTBcclxuICAgKi9cclxuICB0aHJlc2hvbGQ6IDUwLFxyXG4gIC8qKlxyXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gdGhlIGFjdGl2ZSBsb2NhdGlvbnMgbGluayBvbiB0aGUgbWFnZWxsYW4gY29udGFpbmVyLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnYWN0aXZlJ1xyXG4gICAqL1xyXG4gIGFjdGl2ZUNsYXNzOiAnYWN0aXZlJyxcclxuICAvKipcclxuICAgKiBBbGxvd3MgdGhlIHNjcmlwdCB0byBtYW5pcHVsYXRlIHRoZSB1cmwgb2YgdGhlIGN1cnJlbnQgcGFnZSwgYW5kIGlmIHN1cHBvcnRlZCwgYWx0ZXIgdGhlIGhpc3RvcnkuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIHRydWVcclxuICAgKi9cclxuICBkZWVwTGlua2luZzogZmFsc2UsXHJcbiAgLyoqXHJcbiAgICogTnVtYmVyIG9mIHBpeGVscyB0byBvZmZzZXQgdGhlIHNjcm9sbCBvZiB0aGUgcGFnZSBvbiBpdGVtIGNsaWNrIGlmIHVzaW5nIGEgc3RpY2t5IG5hdiBiYXIuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDI1XHJcbiAgICovXHJcbiAgYmFyT2Zmc2V0OiAwXHJcbn1cclxuXHJcbi8vIFdpbmRvdyBleHBvcnRzXHJcbkZvdW5kYXRpb24ucGx1Z2luKE1hZ2VsbGFuLCAnTWFnZWxsYW4nKTtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8qKlxyXG4gKiBPZmZDYW52YXMgbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ub2ZmY2FudmFzXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uXHJcbiAqL1xyXG5cclxuY2xhc3MgT2ZmQ2FudmFzIHtcclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFuIG9mZi1jYW52YXMgd3JhcHBlci5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAZmlyZXMgT2ZmQ2FudmFzI2luaXRcclxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gaW5pdGlhbGl6ZS5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgT2ZmQ2FudmFzLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcbiAgICB0aGlzLiRsYXN0VHJpZ2dlciA9ICQoKTtcclxuXHJcbiAgICB0aGlzLl9pbml0KCk7XHJcbiAgICB0aGlzLl9ldmVudHMoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdPZmZDYW52YXMnKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBvZmYtY2FudmFzIHdyYXBwZXIgYnkgYWRkaW5nIHRoZSBleGl0IG92ZXJsYXkgKGlmIG5lZWRlZCkuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfaW5pdCgpIHtcclxuICAgIHZhciBpZCA9IHRoaXMuJGVsZW1lbnQuYXR0cignaWQnKTtcclxuXHJcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcclxuXHJcbiAgICAvLyBGaW5kIHRyaWdnZXJzIHRoYXQgYWZmZWN0IHRoaXMgZWxlbWVudCBhbmQgYWRkIGFyaWEtZXhwYW5kZWQgdG8gdGhlbVxyXG4gICAgJChkb2N1bWVudClcclxuICAgICAgLmZpbmQoJ1tkYXRhLW9wZW49XCInK2lkKydcIl0sIFtkYXRhLWNsb3NlPVwiJytpZCsnXCJdLCBbZGF0YS10b2dnbGU9XCInK2lkKydcIl0nKVxyXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpXHJcbiAgICAgIC5hdHRyKCdhcmlhLWNvbnRyb2xzJywgaWQpO1xyXG5cclxuICAgIC8vIEFkZCBhIGNsb3NlIHRyaWdnZXIgb3ZlciB0aGUgYm9keSBpZiBuZWNlc3NhcnlcclxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKSB7XHJcbiAgICAgIGlmICgkKCcuanMtb2ZmLWNhbnZhcy1leGl0JykubGVuZ3RoKSB7XHJcbiAgICAgICAgdGhpcy4kZXhpdGVyID0gJCgnLmpzLW9mZi1jYW52YXMtZXhpdCcpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciBleGl0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBleGl0ZXIuc2V0QXR0cmlidXRlKCdjbGFzcycsICdqcy1vZmYtY2FudmFzLWV4aXQnKTtcclxuICAgICAgICAkKCdbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdJykuYXBwZW5kKGV4aXRlcik7XHJcblxyXG4gICAgICAgIHRoaXMuJGV4aXRlciA9ICQoZXhpdGVyKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMub3B0aW9ucy5pc1JldmVhbGVkID0gdGhpcy5vcHRpb25zLmlzUmV2ZWFsZWQgfHwgbmV3IFJlZ0V4cCh0aGlzLm9wdGlvbnMucmV2ZWFsQ2xhc3MsICdnJykudGVzdCh0aGlzLiRlbGVtZW50WzBdLmNsYXNzTmFtZSk7XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5pc1JldmVhbGVkKSB7XHJcbiAgICAgIHRoaXMub3B0aW9ucy5yZXZlYWxPbiA9IHRoaXMub3B0aW9ucy5yZXZlYWxPbiB8fCB0aGlzLiRlbGVtZW50WzBdLmNsYXNzTmFtZS5tYXRjaCgvKHJldmVhbC1mb3ItbWVkaXVtfHJldmVhbC1mb3ItbGFyZ2UpL2cpWzBdLnNwbGl0KCctJylbMl07XHJcbiAgICAgIHRoaXMuX3NldE1RQ2hlY2tlcigpO1xyXG4gICAgfVxyXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMudHJhbnNpdGlvblRpbWUpIHtcclxuICAgICAgdGhpcy5vcHRpb25zLnRyYW5zaXRpb25UaW1lID0gcGFyc2VGbG9hdCh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSgkKCdbZGF0YS1vZmYtY2FudmFzLXdyYXBwZXJdJylbMF0pLnRyYW5zaXRpb25EdXJhdGlvbikgKiAxMDAwO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyB0byB0aGUgb2ZmLWNhbnZhcyB3cmFwcGVyIGFuZCB0aGUgZXhpdCBvdmVybGF5LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2V2ZW50cygpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYudHJpZ2dlciAuemYub2ZmY2FudmFzJykub24oe1xyXG4gICAgICAnb3Blbi56Zi50cmlnZ2VyJzogdGhpcy5vcGVuLmJpbmQodGhpcyksXHJcbiAgICAgICdjbG9zZS56Zi50cmlnZ2VyJzogdGhpcy5jbG9zZS5iaW5kKHRoaXMpLFxyXG4gICAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxyXG4gICAgICAna2V5ZG93bi56Zi5vZmZjYW52YXMnOiB0aGlzLl9oYW5kbGVLZXlib2FyZC5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayAmJiB0aGlzLiRleGl0ZXIubGVuZ3RoKSB7XHJcbiAgICAgIHRoaXMuJGV4aXRlci5vbih7J2NsaWNrLnpmLm9mZmNhbnZhcyc6IHRoaXMuY2xvc2UuYmluZCh0aGlzKX0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXBwbGllcyBldmVudCBsaXN0ZW5lciBmb3IgZWxlbWVudHMgdGhhdCB3aWxsIHJldmVhbCBhdCBjZXJ0YWluIGJyZWFrcG9pbnRzLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX3NldE1RQ2hlY2tlcigpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KF90aGlzLm9wdGlvbnMucmV2ZWFsT24pKSB7XHJcbiAgICAgICAgX3RoaXMucmV2ZWFsKHRydWUpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIF90aGlzLnJldmVhbChmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgIH0pLm9uZSgnbG9hZC56Zi5vZmZjYW52YXMnLCBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KF90aGlzLm9wdGlvbnMucmV2ZWFsT24pKSB7XHJcbiAgICAgICAgX3RoaXMucmV2ZWFsKHRydWUpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZXMgdGhlIHJldmVhbGluZy9oaWRpbmcgdGhlIG9mZi1jYW52YXMgYXQgYnJlYWtwb2ludHMsIG5vdCB0aGUgc2FtZSBhcyBvcGVuLlxyXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNSZXZlYWxlZCAtIHRydWUgaWYgZWxlbWVudCBzaG91bGQgYmUgcmV2ZWFsZWQuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgcmV2ZWFsKGlzUmV2ZWFsZWQpIHtcclxuICAgIHZhciAkY2xvc2VyID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1jbG9zZV0nKTtcclxuICAgIGlmIChpc1JldmVhbGVkKSB7XHJcbiAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgdGhpcy5pc1JldmVhbGVkID0gdHJ1ZTtcclxuICAgICAgLy8gaWYgKCF0aGlzLm9wdGlvbnMuZm9yY2VUb3ApIHtcclxuICAgICAgLy8gICB2YXIgc2Nyb2xsUG9zID0gcGFyc2VJbnQod2luZG93LnBhZ2VZT2Zmc2V0KTtcclxuICAgICAgLy8gICB0aGlzLiRlbGVtZW50WzBdLnN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGUoMCwnICsgc2Nyb2xsUG9zICsgJ3B4KSc7XHJcbiAgICAgIC8vIH1cclxuICAgICAgLy8gaWYgKHRoaXMub3B0aW9ucy5pc1N0aWNreSkgeyB0aGlzLl9zdGljaygpOyB9XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdvcGVuLnpmLnRyaWdnZXIgdG9nZ2xlLnpmLnRyaWdnZXInKTtcclxuICAgICAgaWYgKCRjbG9zZXIubGVuZ3RoKSB7ICRjbG9zZXIuaGlkZSgpOyB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmlzUmV2ZWFsZWQgPSBmYWxzZTtcclxuICAgICAgLy8gaWYgKHRoaXMub3B0aW9ucy5pc1N0aWNreSB8fCAhdGhpcy5vcHRpb25zLmZvcmNlVG9wKSB7XHJcbiAgICAgIC8vICAgdGhpcy4kZWxlbWVudFswXS5zdHlsZS50cmFuc2Zvcm0gPSAnJztcclxuICAgICAgLy8gICAkKHdpbmRvdykub2ZmKCdzY3JvbGwuemYub2ZmY2FudmFzJyk7XHJcbiAgICAgIC8vIH1cclxuICAgICAgdGhpcy4kZWxlbWVudC5vbih7XHJcbiAgICAgICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxyXG4gICAgICAgICd0b2dnbGUuemYudHJpZ2dlcic6IHRoaXMudG9nZ2xlLmJpbmQodGhpcylcclxuICAgICAgfSk7XHJcbiAgICAgIGlmICgkY2xvc2VyLmxlbmd0aCkge1xyXG4gICAgICAgICRjbG9zZXIuc2hvdygpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBPcGVucyB0aGUgb2ZmLWNhbnZhcyBtZW51LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIEV2ZW50IG9iamVjdCBwYXNzZWQgZnJvbSBsaXN0ZW5lci5cclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gdHJpZ2dlciAtIGVsZW1lbnQgdGhhdCB0cmlnZ2VyZWQgdGhlIG9mZi1jYW52YXMgdG8gb3Blbi5cclxuICAgKiBAZmlyZXMgT2ZmQ2FudmFzI29wZW5lZFxyXG4gICAqL1xyXG4gIG9wZW4oZXZlbnQsIHRyaWdnZXIpIHtcclxuICAgIGlmICh0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykgfHwgdGhpcy5pc1JldmVhbGVkKSB7IHJldHVybjsgfVxyXG4gICAgdmFyIF90aGlzID0gdGhpcyxcclxuICAgICAgICAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSk7XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5mb3JjZVRvcCkge1xyXG4gICAgICAkKCdib2R5Jykuc2Nyb2xsVG9wKDApO1xyXG4gICAgfVxyXG4gICAgLy8gd2luZG93LnBhZ2VZT2Zmc2V0ID0gMDtcclxuXHJcbiAgICAvLyBpZiAoIXRoaXMub3B0aW9ucy5mb3JjZVRvcCkge1xyXG4gICAgLy8gICB2YXIgc2Nyb2xsUG9zID0gcGFyc2VJbnQod2luZG93LnBhZ2VZT2Zmc2V0KTtcclxuICAgIC8vICAgdGhpcy4kZWxlbWVudFswXS5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDAsJyArIHNjcm9sbFBvcyArICdweCknO1xyXG4gICAgLy8gICBpZiAodGhpcy4kZXhpdGVyLmxlbmd0aCkge1xyXG4gICAgLy8gICAgIHRoaXMuJGV4aXRlclswXS5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDAsJyArIHNjcm9sbFBvcyArICdweCknO1xyXG4gICAgLy8gICB9XHJcbiAgICAvLyB9XHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gdGhlIG9mZi1jYW52YXMgbWVudSBvcGVucy5cclxuICAgICAqIEBldmVudCBPZmZDYW52YXMjb3BlbmVkXHJcbiAgICAgKi9cclxuICAgIEZvdW5kYXRpb24uTW92ZSh0aGlzLm9wdGlvbnMudHJhbnNpdGlvblRpbWUsIHRoaXMuJGVsZW1lbnQsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAkKCdbZGF0YS1vZmYtY2FudmFzLXdyYXBwZXJdJykuYWRkQ2xhc3MoJ2lzLW9mZi1jYW52YXMtb3BlbiBpcy1vcGVuLScrIF90aGlzLm9wdGlvbnMucG9zaXRpb24pO1xyXG5cclxuICAgICAgX3RoaXMuJGVsZW1lbnRcclxuICAgICAgICAuYWRkQ2xhc3MoJ2lzLW9wZW4nKVxyXG5cclxuICAgICAgLy8gaWYgKF90aGlzLm9wdGlvbnMuaXNTdGlja3kpIHtcclxuICAgICAgLy8gICBfdGhpcy5fc3RpY2soKTtcclxuICAgICAgLy8gfVxyXG4gICAgfSk7XHJcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJylcclxuICAgICAgICAudHJpZ2dlcignb3BlbmVkLnpmLm9mZmNhbnZhcycpO1xyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKSB7XHJcbiAgICAgIHRoaXMuJGV4aXRlci5hZGRDbGFzcygnaXMtdmlzaWJsZScpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0cmlnZ2VyKSB7XHJcbiAgICAgIHRoaXMuJGxhc3RUcmlnZ2VyID0gdHJpZ2dlci5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9Gb2N1cykge1xyXG4gICAgICB0aGlzLiRlbGVtZW50Lm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQodGhpcy4kZWxlbWVudCksIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIF90aGlzLiRlbGVtZW50LmZpbmQoJ2EsIGJ1dHRvbicpLmVxKDApLmZvY3VzKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMudHJhcEZvY3VzKSB7XHJcbiAgICAgICQoJ1tkYXRhLW9mZi1jYW52YXMtY29udGVudF0nKS5hdHRyKCd0YWJpbmRleCcsICctMScpO1xyXG4gICAgICB0aGlzLl90cmFwRm9jdXMoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyYXBzIGZvY3VzIHdpdGhpbiB0aGUgb2ZmY2FudmFzIG9uIG9wZW4uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfdHJhcEZvY3VzKCkge1xyXG4gICAgdmFyIGZvY3VzYWJsZSA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZSh0aGlzLiRlbGVtZW50KSxcclxuICAgICAgICBmaXJzdCA9IGZvY3VzYWJsZS5lcSgwKSxcclxuICAgICAgICBsYXN0ID0gZm9jdXNhYmxlLmVxKC0xKTtcclxuXHJcbiAgICBmb2N1c2FibGUub2ZmKCcuemYub2ZmY2FudmFzJykub24oJ2tleWRvd24uemYub2ZmY2FudmFzJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICBpZiAoZS53aGljaCA9PT0gOSB8fCBlLmtleWNvZGUgPT09IDkpIHtcclxuICAgICAgICBpZiAoZS50YXJnZXQgPT09IGxhc3RbMF0gJiYgIWUuc2hpZnRLZXkpIHtcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIGZpcnN0LmZvY3VzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChlLnRhcmdldCA9PT0gZmlyc3RbMF0gJiYgZS5zaGlmdEtleSkge1xyXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgbGFzdC5mb2N1cygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBbGxvd3MgdGhlIG9mZmNhbnZhcyB0byBhcHBlYXIgc3RpY2t5IHV0aWxpemluZyB0cmFuc2xhdGUgcHJvcGVydGllcy5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIC8vIE9mZkNhbnZhcy5wcm90b3R5cGUuX3N0aWNrID0gZnVuY3Rpb24oKSB7XHJcbiAgLy8gICB2YXIgZWxTdHlsZSA9IHRoaXMuJGVsZW1lbnRbMF0uc3R5bGU7XHJcbiAgLy9cclxuICAvLyAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKSB7XHJcbiAgLy8gICAgIHZhciBleGl0U3R5bGUgPSB0aGlzLiRleGl0ZXJbMF0uc3R5bGU7XHJcbiAgLy8gICB9XHJcbiAgLy9cclxuICAvLyAgICQod2luZG93KS5vbignc2Nyb2xsLnpmLm9mZmNhbnZhcycsIGZ1bmN0aW9uKGUpIHtcclxuICAvLyAgICAgY29uc29sZS5sb2coZSk7XHJcbiAgLy8gICAgIHZhciBwYWdlWSA9IHdpbmRvdy5wYWdlWU9mZnNldDtcclxuICAvLyAgICAgZWxTdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDAsJyArIHBhZ2VZICsgJ3B4KSc7XHJcbiAgLy8gICAgIGlmIChleGl0U3R5bGUgIT09IHVuZGVmaW5lZCkgeyBleGl0U3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgwLCcgKyBwYWdlWSArICdweCknOyB9XHJcbiAgLy8gICB9KTtcclxuICAvLyAgIC8vIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignc3R1Y2suemYub2ZmY2FudmFzJyk7XHJcbiAgLy8gfTtcclxuICAvKipcclxuICAgKiBDbG9zZXMgdGhlIG9mZi1jYW52YXMgbWVudS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIG9wdGlvbmFsIGNiIHRvIGZpcmUgYWZ0ZXIgY2xvc3VyZS5cclxuICAgKiBAZmlyZXMgT2ZmQ2FudmFzI2Nsb3NlZFxyXG4gICAqL1xyXG4gIGNsb3NlKGNiKSB7XHJcbiAgICBpZiAoIXRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSB8fCB0aGlzLmlzUmV2ZWFsZWQpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICAvLyAgRm91bmRhdGlvbi5Nb3ZlKHRoaXMub3B0aW9ucy50cmFuc2l0aW9uVGltZSwgdGhpcy4kZWxlbWVudCwgZnVuY3Rpb24oKSB7XHJcbiAgICAkKCdbZGF0YS1vZmYtY2FudmFzLXdyYXBwZXJdJykucmVtb3ZlQ2xhc3MoYGlzLW9mZi1jYW52YXMtb3BlbiBpcy1vcGVuLSR7X3RoaXMub3B0aW9ucy5wb3NpdGlvbn1gKTtcclxuICAgIF90aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XHJcbiAgICAgIC8vIEZvdW5kYXRpb24uX3JlZmxvdygpO1xyXG4gICAgLy8gfSk7XHJcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKVxyXG4gICAgICAvKipcclxuICAgICAgICogRmlyZXMgd2hlbiB0aGUgb2ZmLWNhbnZhcyBtZW51IG9wZW5zLlxyXG4gICAgICAgKiBAZXZlbnQgT2ZmQ2FudmFzI2Nsb3NlZFxyXG4gICAgICAgKi9cclxuICAgICAgICAudHJpZ2dlcignY2xvc2VkLnpmLm9mZmNhbnZhcycpO1xyXG4gICAgLy8gaWYgKF90aGlzLm9wdGlvbnMuaXNTdGlja3kgfHwgIV90aGlzLm9wdGlvbnMuZm9yY2VUb3ApIHtcclxuICAgIC8vICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgIC8vICAgICBfdGhpcy4kZWxlbWVudFswXS5zdHlsZS50cmFuc2Zvcm0gPSAnJztcclxuICAgIC8vICAgICAkKHdpbmRvdykub2ZmKCdzY3JvbGwuemYub2ZmY2FudmFzJyk7XHJcbiAgICAvLyAgIH0sIHRoaXMub3B0aW9ucy50cmFuc2l0aW9uVGltZSk7XHJcbiAgICAvLyB9XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljaykge1xyXG4gICAgICB0aGlzLiRleGl0ZXIucmVtb3ZlQ2xhc3MoJ2lzLXZpc2libGUnKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLiRsYXN0VHJpZ2dlci5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnRyYXBGb2N1cykge1xyXG4gICAgICAkKCdbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdJykucmVtb3ZlQXR0cigndGFiaW5kZXgnKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRvZ2dsZXMgdGhlIG9mZi1jYW52YXMgbWVudSBvcGVuIG9yIGNsb3NlZC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSBFdmVudCBvYmplY3QgcGFzc2VkIGZyb20gbGlzdGVuZXIuXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9IHRyaWdnZXIgLSBlbGVtZW50IHRoYXQgdHJpZ2dlcmVkIHRoZSBvZmYtY2FudmFzIHRvIG9wZW4uXHJcbiAgICovXHJcbiAgdG9nZ2xlKGV2ZW50LCB0cmlnZ2VyKSB7XHJcbiAgICBpZiAodGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpKSB7XHJcbiAgICAgIHRoaXMuY2xvc2UoZXZlbnQsIHRyaWdnZXIpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRoaXMub3BlbihldmVudCwgdHJpZ2dlcik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGVzIGtleWJvYXJkIGlucHV0IHdoZW4gZGV0ZWN0ZWQuIFdoZW4gdGhlIGVzY2FwZSBrZXkgaXMgcHJlc3NlZCwgdGhlIG9mZi1jYW52YXMgbWVudSBjbG9zZXMsIGFuZCBmb2N1cyBpcyByZXN0b3JlZCB0byB0aGUgZWxlbWVudCB0aGF0IG9wZW5lZCB0aGUgbWVudS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9oYW5kbGVLZXlib2FyZChldmVudCkge1xyXG4gICAgaWYgKGV2ZW50LndoaWNoICE9PSAyNykgcmV0dXJuO1xyXG5cclxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIHRoaXMuY2xvc2UoKTtcclxuICAgIHRoaXMuJGxhc3RUcmlnZ2VyLmZvY3VzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95cyB0aGUgb2ZmY2FudmFzIHBsdWdpbi5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50cmlnZ2VyIC56Zi5vZmZjYW52YXMnKTtcclxuICAgIHRoaXMuJGV4aXRlci5vZmYoJy56Zi5vZmZjYW52YXMnKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfVxyXG59XHJcblxyXG5PZmZDYW52YXMuZGVmYXVsdHMgPSB7XHJcbiAgLyoqXHJcbiAgICogQWxsb3cgdGhlIHVzZXIgdG8gY2xpY2sgb3V0c2lkZSBvZiB0aGUgbWVudSB0byBjbG9zZSBpdC5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAqL1xyXG4gIGNsb3NlT25DbGljazogdHJ1ZSxcclxuXHJcbiAgLyoqXHJcbiAgICogQW1vdW50IG9mIHRpbWUgaW4gbXMgdGhlIG9wZW4gYW5kIGNsb3NlIHRyYW5zaXRpb24gcmVxdWlyZXMuIElmIG5vbmUgc2VsZWN0ZWQsIHB1bGxzIGZyb20gYm9keSBzdHlsZS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgNTAwXHJcbiAgICovXHJcbiAgdHJhbnNpdGlvblRpbWU6IDAsXHJcblxyXG4gIC8qKlxyXG4gICAqIERpcmVjdGlvbiB0aGUgb2ZmY2FudmFzIG9wZW5zIGZyb20uIERldGVybWluZXMgY2xhc3MgYXBwbGllZCB0byBib2R5LlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBsZWZ0XHJcbiAgICovXHJcbiAgcG9zaXRpb246ICdsZWZ0JyxcclxuXHJcbiAgLyoqXHJcbiAgICogRm9yY2UgdGhlIHBhZ2UgdG8gc2Nyb2xsIHRvIHRvcCBvbiBvcGVuLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgICovXHJcbiAgZm9yY2VUb3A6IHRydWUsXHJcblxyXG4gIC8qKlxyXG4gICAqIEFsbG93IHRoZSBvZmZjYW52YXMgdG8gcmVtYWluIG9wZW4gZm9yIGNlcnRhaW4gYnJlYWtwb2ludHMuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICovXHJcbiAgaXNSZXZlYWxlZDogZmFsc2UsXHJcblxyXG4gIC8qKlxyXG4gICAqIEJyZWFrcG9pbnQgYXQgd2hpY2ggdG8gcmV2ZWFsLiBKUyB3aWxsIHVzZSBhIFJlZ0V4cCB0byB0YXJnZXQgc3RhbmRhcmQgY2xhc3NlcywgaWYgY2hhbmdpbmcgY2xhc3NuYW1lcywgcGFzcyB5b3VyIGNsYXNzIHdpdGggdGhlIGByZXZlYWxDbGFzc2Agb3B0aW9uLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSByZXZlYWwtZm9yLWxhcmdlXHJcbiAgICovXHJcbiAgcmV2ZWFsT246IG51bGwsXHJcblxyXG4gIC8qKlxyXG4gICAqIEZvcmNlIGZvY3VzIHRvIHRoZSBvZmZjYW52YXMgb24gb3Blbi4gSWYgdHJ1ZSwgd2lsbCBmb2N1cyB0aGUgb3BlbmluZyB0cmlnZ2VyIG9uIGNsb3NlLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgICovXHJcbiAgYXV0b0ZvY3VzOiB0cnVlLFxyXG5cclxuICAvKipcclxuICAgKiBDbGFzcyB1c2VkIHRvIGZvcmNlIGFuIG9mZmNhbnZhcyB0byByZW1haW4gb3Blbi4gRm91bmRhdGlvbiBkZWZhdWx0cyBmb3IgdGhpcyBhcmUgYHJldmVhbC1mb3ItbGFyZ2VgICYgYHJldmVhbC1mb3ItbWVkaXVtYC5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogVE9ETyBpbXByb3ZlIHRoZSByZWdleCB0ZXN0aW5nIGZvciB0aGlzLlxyXG4gICAqIEBleGFtcGxlIHJldmVhbC1mb3ItbGFyZ2VcclxuICAgKi9cclxuICByZXZlYWxDbGFzczogJ3JldmVhbC1mb3ItJyxcclxuXHJcbiAgLyoqXHJcbiAgICogVHJpZ2dlcnMgb3B0aW9uYWwgZm9jdXMgdHJhcHBpbmcgd2hlbiBvcGVuaW5nIGFuIG9mZmNhbnZhcy4gU2V0cyB0YWJpbmRleCBvZiBbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdIHRvIC0xIGZvciBhY2Nlc3NpYmlsaXR5IHB1cnBvc2VzLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgICovXHJcbiAgdHJhcEZvY3VzOiBmYWxzZVxyXG59XHJcblxyXG4vLyBXaW5kb3cgZXhwb3J0c1xyXG5Gb3VuZGF0aW9uLnBsdWdpbihPZmZDYW52YXMsICdPZmZDYW52YXMnKTtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8qKlxyXG4gKiBPcmJpdCBtb2R1bGUuXHJcbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5vcmJpdFxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudGltZXJBbmRJbWFnZUxvYWRlclxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRvdWNoXHJcbiAqL1xyXG5cclxuY2xhc3MgT3JiaXQge1xyXG4gIC8qKlxyXG4gICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhbiBvcmJpdCBjYXJvdXNlbC5cclxuICAqIEBjbGFzc1xyXG4gICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhbiBPcmJpdCBDYXJvdXNlbC5cclxuICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAqL1xyXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpe1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgT3JiaXQuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcclxuXHJcbiAgICB0aGlzLl9pbml0KCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnT3JiaXQnKTtcclxuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ09yYml0Jywge1xyXG4gICAgICAnbHRyJzoge1xyXG4gICAgICAgICdBUlJPV19SSUdIVCc6ICduZXh0JyxcclxuICAgICAgICAnQVJST1dfTEVGVCc6ICdwcmV2aW91cydcclxuICAgICAgfSxcclxuICAgICAgJ3J0bCc6IHtcclxuICAgICAgICAnQVJST1dfTEVGVCc6ICduZXh0JyxcclxuICAgICAgICAnQVJST1dfUklHSFQnOiAncHJldmlvdXMnXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgKiBJbml0aWFsaXplcyB0aGUgcGx1Z2luIGJ5IGNyZWF0aW5nIGpRdWVyeSBjb2xsZWN0aW9ucywgc2V0dGluZyBhdHRyaWJ1dGVzLCBhbmQgc3RhcnRpbmcgdGhlIGFuaW1hdGlvbi5cclxuICAqIEBmdW5jdGlvblxyXG4gICogQHByaXZhdGVcclxuICAqL1xyXG4gIF9pbml0KCkge1xyXG4gICAgdGhpcy4kd3JhcHBlciA9IHRoaXMuJGVsZW1lbnQuZmluZChgLiR7dGhpcy5vcHRpb25zLmNvbnRhaW5lckNsYXNzfWApO1xyXG4gICAgdGhpcy4kc2xpZGVzID0gdGhpcy4kZWxlbWVudC5maW5kKGAuJHt0aGlzLm9wdGlvbnMuc2xpZGVDbGFzc31gKTtcclxuICAgIHZhciAkaW1hZ2VzID0gdGhpcy4kZWxlbWVudC5maW5kKCdpbWcnKSxcclxuICAgIGluaXRBY3RpdmUgPSB0aGlzLiRzbGlkZXMuZmlsdGVyKCcuaXMtYWN0aXZlJyk7XHJcblxyXG4gICAgaWYgKCFpbml0QWN0aXZlLmxlbmd0aCkge1xyXG4gICAgICB0aGlzLiRzbGlkZXMuZXEoMCkuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5vcHRpb25zLnVzZU1VSSkge1xyXG4gICAgICB0aGlzLiRzbGlkZXMuYWRkQ2xhc3MoJ25vLW1vdGlvbnVpJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCRpbWFnZXMubGVuZ3RoKSB7XHJcbiAgICAgIEZvdW5kYXRpb24ub25JbWFnZXNMb2FkZWQoJGltYWdlcywgdGhpcy5fcHJlcGFyZUZvck9yYml0LmJpbmQodGhpcykpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5fcHJlcGFyZUZvck9yYml0KCk7Ly9oZWhlXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5idWxsZXRzKSB7XHJcbiAgICAgIHRoaXMuX2xvYWRCdWxsZXRzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fZXZlbnRzKCk7XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hdXRvUGxheSAmJiB0aGlzLiRzbGlkZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICB0aGlzLmdlb1N5bmMoKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmFjY2Vzc2libGUpIHsgLy8gYWxsb3cgd3JhcHBlciB0byBiZSBmb2N1c2FibGUgdG8gZW5hYmxlIGFycm93IG5hdmlnYXRpb25cclxuICAgICAgdGhpcy4kd3JhcHBlci5hdHRyKCd0YWJpbmRleCcsIDApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgKiBDcmVhdGVzIGEgalF1ZXJ5IGNvbGxlY3Rpb24gb2YgYnVsbGV0cywgaWYgdGhleSBhcmUgYmVpbmcgdXNlZC5cclxuICAqIEBmdW5jdGlvblxyXG4gICogQHByaXZhdGVcclxuICAqL1xyXG4gIF9sb2FkQnVsbGV0cygpIHtcclxuICAgIHRoaXMuJGJ1bGxldHMgPSB0aGlzLiRlbGVtZW50LmZpbmQoYC4ke3RoaXMub3B0aW9ucy5ib3hPZkJ1bGxldHN9YCkuZmluZCgnYnV0dG9uJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAqIFNldHMgYSBgdGltZXJgIG9iamVjdCBvbiB0aGUgb3JiaXQsIGFuZCBzdGFydHMgdGhlIGNvdW50ZXIgZm9yIHRoZSBuZXh0IHNsaWRlLlxyXG4gICogQGZ1bmN0aW9uXHJcbiAgKi9cclxuICBnZW9TeW5jKCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHRoaXMudGltZXIgPSBuZXcgRm91bmRhdGlvbi5UaW1lcihcclxuICAgICAgdGhpcy4kZWxlbWVudCxcclxuICAgICAge1xyXG4gICAgICAgIGR1cmF0aW9uOiB0aGlzLm9wdGlvbnMudGltZXJEZWxheSxcclxuICAgICAgICBpbmZpbml0ZTogZmFsc2VcclxuICAgICAgfSxcclxuICAgICAgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgX3RoaXMuY2hhbmdlU2xpZGUodHJ1ZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgdGhpcy50aW1lci5zdGFydCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgKiBTZXRzIHdyYXBwZXIgYW5kIHNsaWRlIGhlaWdodHMgZm9yIHRoZSBvcmJpdC5cclxuICAqIEBmdW5jdGlvblxyXG4gICogQHByaXZhdGVcclxuICAqL1xyXG4gIF9wcmVwYXJlRm9yT3JiaXQoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgdGhpcy5fc2V0V3JhcHBlckhlaWdodChmdW5jdGlvbihtYXgpe1xyXG4gICAgICBfdGhpcy5fc2V0U2xpZGVIZWlnaHQobWF4KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgKiBDYWx1bGF0ZXMgdGhlIGhlaWdodCBvZiBlYWNoIHNsaWRlIGluIHRoZSBjb2xsZWN0aW9uLCBhbmQgdXNlcyB0aGUgdGFsbGVzdCBvbmUgZm9yIHRoZSB3cmFwcGVyIGhlaWdodC5cclxuICAqIEBmdW5jdGlvblxyXG4gICogQHByaXZhdGVcclxuICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gYSBjYWxsYmFjayBmdW5jdGlvbiB0byBmaXJlIHdoZW4gY29tcGxldGUuXHJcbiAgKi9cclxuICBfc2V0V3JhcHBlckhlaWdodChjYikgey8vcmV3cml0ZSB0aGlzIHRvIGBmb3JgIGxvb3BcclxuICAgIHZhciBtYXggPSAwLCB0ZW1wLCBjb3VudGVyID0gMDtcclxuXHJcbiAgICB0aGlzLiRzbGlkZXMuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgdGVtcCA9IHRoaXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0O1xyXG4gICAgICAkKHRoaXMpLmF0dHIoJ2RhdGEtc2xpZGUnLCBjb3VudGVyKTtcclxuXHJcbiAgICAgIGlmIChjb3VudGVyKSB7Ly9pZiBub3QgdGhlIGZpcnN0IHNsaWRlLCBzZXQgY3NzIHBvc2l0aW9uIGFuZCBkaXNwbGF5IHByb3BlcnR5XHJcbiAgICAgICAgJCh0aGlzKS5jc3Moeydwb3NpdGlvbic6ICdyZWxhdGl2ZScsICdkaXNwbGF5JzogJ25vbmUnfSk7XHJcbiAgICAgIH1cclxuICAgICAgbWF4ID0gdGVtcCA+IG1heCA/IHRlbXAgOiBtYXg7XHJcbiAgICAgIGNvdW50ZXIrKztcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChjb3VudGVyID09PSB0aGlzLiRzbGlkZXMubGVuZ3RoKSB7XHJcbiAgICAgIHRoaXMuJHdyYXBwZXIuY3NzKHsnaGVpZ2h0JzogbWF4fSk7IC8vb25seSBjaGFuZ2UgdGhlIHdyYXBwZXIgaGVpZ2h0IHByb3BlcnR5IG9uY2UuXHJcbiAgICAgIGNiKG1heCk7IC8vZmlyZSBjYWxsYmFjayB3aXRoIG1heCBoZWlnaHQgZGltZW5zaW9uLlxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgKiBTZXRzIHRoZSBtYXgtaGVpZ2h0IG9mIGVhY2ggc2xpZGUuXHJcbiAgKiBAZnVuY3Rpb25cclxuICAqIEBwcml2YXRlXHJcbiAgKi9cclxuICBfc2V0U2xpZGVIZWlnaHQoaGVpZ2h0KSB7XHJcbiAgICB0aGlzLiRzbGlkZXMuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgJCh0aGlzKS5jc3MoJ21heC1oZWlnaHQnLCBoZWlnaHQpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIGJhc2ljYWxseSBldmVyeXRoaW5nIHdpdGhpbiB0aGUgZWxlbWVudC5cclxuICAqIEBmdW5jdGlvblxyXG4gICogQHByaXZhdGVcclxuICAqL1xyXG4gIF9ldmVudHMoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgIC8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAvLyoqTm93IHVzaW5nIGN1c3RvbSBldmVudCAtIHRoYW5rcyB0bzoqKlxyXG4gICAgLy8qKiAgICAgIFlvaGFpIEFyYXJhdCBvZiBUb3JvbnRvICAgICAgKipcclxuICAgIC8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICBpZiAodGhpcy4kc2xpZGVzLmxlbmd0aCA+IDEpIHtcclxuXHJcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuc3dpcGUpIHtcclxuICAgICAgICB0aGlzLiRzbGlkZXMub2ZmKCdzd2lwZWxlZnQuemYub3JiaXQgc3dpcGVyaWdodC56Zi5vcmJpdCcpXHJcbiAgICAgICAgLm9uKCdzd2lwZWxlZnQuemYub3JiaXQnLCBmdW5jdGlvbihlKXtcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIF90aGlzLmNoYW5nZVNsaWRlKHRydWUpO1xyXG4gICAgICAgIH0pLm9uKCdzd2lwZXJpZ2h0LnpmLm9yYml0JywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICBfdGhpcy5jaGFuZ2VTbGlkZShmYWxzZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuXHJcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b1BsYXkpIHtcclxuICAgICAgICB0aGlzLiRzbGlkZXMub24oJ2NsaWNrLnpmLm9yYml0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBfdGhpcy4kZWxlbWVudC5kYXRhKCdjbGlja2VkT24nLCBfdGhpcy4kZWxlbWVudC5kYXRhKCdjbGlja2VkT24nKSA/IGZhbHNlIDogdHJ1ZSk7XHJcbiAgICAgICAgICBfdGhpcy50aW1lcltfdGhpcy4kZWxlbWVudC5kYXRhKCdjbGlja2VkT24nKSA/ICdwYXVzZScgOiAnc3RhcnQnXSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnBhdXNlT25Ib3Zlcikge1xyXG4gICAgICAgICAgdGhpcy4kZWxlbWVudC5vbignbW91c2VlbnRlci56Zi5vcmJpdCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBfdGhpcy50aW1lci5wYXVzZSgpO1xyXG4gICAgICAgICAgfSkub24oJ21vdXNlbGVhdmUuemYub3JiaXQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKCFfdGhpcy4kZWxlbWVudC5kYXRhKCdjbGlja2VkT24nKSkge1xyXG4gICAgICAgICAgICAgIF90aGlzLnRpbWVyLnN0YXJ0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5uYXZCdXR0b25zKSB7XHJcbiAgICAgICAgdmFyICRjb250cm9scyA9IHRoaXMuJGVsZW1lbnQuZmluZChgLiR7dGhpcy5vcHRpb25zLm5leHRDbGFzc30sIC4ke3RoaXMub3B0aW9ucy5wcmV2Q2xhc3N9YCk7XHJcbiAgICAgICAgJGNvbnRyb2xzLmF0dHIoJ3RhYmluZGV4JywgMClcclxuICAgICAgICAvL2Fsc28gbmVlZCB0byBoYW5kbGUgZW50ZXIvcmV0dXJuIGFuZCBzcGFjZWJhciBrZXkgcHJlc3Nlc1xyXG4gICAgICAgIC5vbignY2xpY2suemYub3JiaXQgdG91Y2hlbmQuemYub3JiaXQnLCBmdW5jdGlvbihlKXtcclxuXHQgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIF90aGlzLmNoYW5nZVNsaWRlKCQodGhpcykuaGFzQ2xhc3MoX3RoaXMub3B0aW9ucy5uZXh0Q2xhc3MpKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5idWxsZXRzKSB7XHJcbiAgICAgICAgdGhpcy4kYnVsbGV0cy5vbignY2xpY2suemYub3JiaXQgdG91Y2hlbmQuemYub3JiaXQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmICgvaXMtYWN0aXZlL2cudGVzdCh0aGlzLmNsYXNzTmFtZSkpIHsgcmV0dXJuIGZhbHNlOyB9Ly9pZiB0aGlzIGlzIGFjdGl2ZSwga2ljayBvdXQgb2YgZnVuY3Rpb24uXHJcbiAgICAgICAgICB2YXIgaWR4ID0gJCh0aGlzKS5kYXRhKCdzbGlkZScpLFxyXG4gICAgICAgICAgbHRyID0gaWR4ID4gX3RoaXMuJHNsaWRlcy5maWx0ZXIoJy5pcy1hY3RpdmUnKS5kYXRhKCdzbGlkZScpLFxyXG4gICAgICAgICAgJHNsaWRlID0gX3RoaXMuJHNsaWRlcy5lcShpZHgpO1xyXG5cclxuICAgICAgICAgIF90aGlzLmNoYW5nZVNsaWRlKGx0ciwgJHNsaWRlLCBpZHgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLiR3cmFwcGVyLmFkZCh0aGlzLiRidWxsZXRzKS5vbigna2V5ZG93bi56Zi5vcmJpdCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAvLyBoYW5kbGUga2V5Ym9hcmQgZXZlbnQgd2l0aCBrZXlib2FyZCB1dGlsXHJcbiAgICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ09yYml0Jywge1xyXG4gICAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIF90aGlzLmNoYW5nZVNsaWRlKHRydWUpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHByZXZpb3VzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgX3RoaXMuY2hhbmdlU2xpZGUoZmFsc2UpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGhhbmRsZWQ6IGZ1bmN0aW9uKCkgeyAvLyBpZiBidWxsZXQgaXMgZm9jdXNlZCwgbWFrZSBzdXJlIGZvY3VzIG1vdmVzXHJcbiAgICAgICAgICAgIGlmICgkKGUudGFyZ2V0KS5pcyhfdGhpcy4kYnVsbGV0cykpIHtcclxuICAgICAgICAgICAgICBfdGhpcy4kYnVsbGV0cy5maWx0ZXIoJy5pcy1hY3RpdmUnKS5mb2N1cygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgKiBDaGFuZ2VzIHRoZSBjdXJyZW50IHNsaWRlIHRvIGEgbmV3IG9uZS5cclxuICAqIEBmdW5jdGlvblxyXG4gICogQHBhcmFtIHtCb29sZWFufSBpc0xUUiAtIGZsYWcgaWYgdGhlIHNsaWRlIHNob3VsZCBtb3ZlIGxlZnQgdG8gcmlnaHQuXHJcbiAgKiBAcGFyYW0ge2pRdWVyeX0gY2hvc2VuU2xpZGUgLSB0aGUgalF1ZXJ5IGVsZW1lbnQgb2YgdGhlIHNsaWRlIHRvIHNob3cgbmV4dCwgaWYgb25lIGlzIHNlbGVjdGVkLlxyXG4gICogQHBhcmFtIHtOdW1iZXJ9IGlkeCAtIHRoZSBpbmRleCBvZiB0aGUgbmV3IHNsaWRlIGluIGl0cyBjb2xsZWN0aW9uLCBpZiBvbmUgY2hvc2VuLlxyXG4gICogQGZpcmVzIE9yYml0I3NsaWRlY2hhbmdlXHJcbiAgKi9cclxuICBjaGFuZ2VTbGlkZShpc0xUUiwgY2hvc2VuU2xpZGUsIGlkeCkge1xyXG4gICAgdmFyICRjdXJTbGlkZSA9IHRoaXMuJHNsaWRlcy5maWx0ZXIoJy5pcy1hY3RpdmUnKS5lcSgwKTtcclxuXHJcbiAgICBpZiAoL211aS9nLnRlc3QoJGN1clNsaWRlWzBdLmNsYXNzTmFtZSkpIHsgcmV0dXJuIGZhbHNlOyB9IC8vaWYgdGhlIHNsaWRlIGlzIGN1cnJlbnRseSBhbmltYXRpbmcsIGtpY2sgb3V0IG9mIHRoZSBmdW5jdGlvblxyXG5cclxuICAgIHZhciAkZmlyc3RTbGlkZSA9IHRoaXMuJHNsaWRlcy5maXJzdCgpLFxyXG4gICAgJGxhc3RTbGlkZSA9IHRoaXMuJHNsaWRlcy5sYXN0KCksXHJcbiAgICBkaXJJbiA9IGlzTFRSID8gJ1JpZ2h0JyA6ICdMZWZ0JyxcclxuICAgIGRpck91dCA9IGlzTFRSID8gJ0xlZnQnIDogJ1JpZ2h0JyxcclxuICAgIF90aGlzID0gdGhpcyxcclxuICAgICRuZXdTbGlkZTtcclxuXHJcbiAgICBpZiAoIWNob3NlblNsaWRlKSB7IC8vbW9zdCBvZiB0aGUgdGltZSwgdGhpcyB3aWxsIGJlIGF1dG8gcGxheWVkIG9yIGNsaWNrZWQgZnJvbSB0aGUgbmF2QnV0dG9ucy5cclxuICAgICAgJG5ld1NsaWRlID0gaXNMVFIgPyAvL2lmIHdyYXBwaW5nIGVuYWJsZWQsIGNoZWNrIHRvIHNlZSBpZiB0aGVyZSBpcyBhIGBuZXh0YCBvciBgcHJldmAgc2libGluZywgaWYgbm90LCBzZWxlY3QgdGhlIGZpcnN0IG9yIGxhc3Qgc2xpZGUgdG8gZmlsbCBpbi4gaWYgd3JhcHBpbmcgbm90IGVuYWJsZWQsIGF0dGVtcHQgdG8gc2VsZWN0IGBuZXh0YCBvciBgcHJldmAsIGlmIHRoZXJlJ3Mgbm90aGluZyB0aGVyZSwgdGhlIGZ1bmN0aW9uIHdpbGwga2ljayBvdXQgb24gbmV4dCBzdGVwLiBDUkFaWSBORVNURUQgVEVSTkFSSUVTISEhISFcclxuICAgICAgKHRoaXMub3B0aW9ucy5pbmZpbml0ZVdyYXAgPyAkY3VyU2xpZGUubmV4dChgLiR7dGhpcy5vcHRpb25zLnNsaWRlQ2xhc3N9YCkubGVuZ3RoID8gJGN1clNsaWRlLm5leHQoYC4ke3RoaXMub3B0aW9ucy5zbGlkZUNsYXNzfWApIDogJGZpcnN0U2xpZGUgOiAkY3VyU2xpZGUubmV4dChgLiR7dGhpcy5vcHRpb25zLnNsaWRlQ2xhc3N9YCkpLy9waWNrIG5leHQgc2xpZGUgaWYgbW92aW5nIGxlZnQgdG8gcmlnaHRcclxuICAgICAgOlxyXG4gICAgICAodGhpcy5vcHRpb25zLmluZmluaXRlV3JhcCA/ICRjdXJTbGlkZS5wcmV2KGAuJHt0aGlzLm9wdGlvbnMuc2xpZGVDbGFzc31gKS5sZW5ndGggPyAkY3VyU2xpZGUucHJldihgLiR7dGhpcy5vcHRpb25zLnNsaWRlQ2xhc3N9YCkgOiAkbGFzdFNsaWRlIDogJGN1clNsaWRlLnByZXYoYC4ke3RoaXMub3B0aW9ucy5zbGlkZUNsYXNzfWApKTsvL3BpY2sgcHJldiBzbGlkZSBpZiBtb3ZpbmcgcmlnaHQgdG8gbGVmdFxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgJG5ld1NsaWRlID0gY2hvc2VuU2xpZGU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCRuZXdTbGlkZS5sZW5ndGgpIHtcclxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5idWxsZXRzKSB7XHJcbiAgICAgICAgaWR4ID0gaWR4IHx8IHRoaXMuJHNsaWRlcy5pbmRleCgkbmV3U2xpZGUpOyAvL2dyYWIgaW5kZXggdG8gdXBkYXRlIGJ1bGxldHNcclxuICAgICAgICB0aGlzLl91cGRhdGVCdWxsZXRzKGlkeCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMudXNlTVVJKSB7XHJcbiAgICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZUluKFxyXG4gICAgICAgICAgJG5ld1NsaWRlLmFkZENsYXNzKCdpcy1hY3RpdmUnKS5jc3Moeydwb3NpdGlvbic6ICdhYnNvbHV0ZScsICd0b3AnOiAwfSksXHJcbiAgICAgICAgICB0aGlzLm9wdGlvbnNbYGFuaW1JbkZyb20ke2RpcklufWBdLFxyXG4gICAgICAgICAgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgJG5ld1NsaWRlLmNzcyh7J3Bvc2l0aW9uJzogJ3JlbGF0aXZlJywgJ2Rpc3BsYXknOiAnYmxvY2snfSlcclxuICAgICAgICAgICAgLmF0dHIoJ2FyaWEtbGl2ZScsICdwb2xpdGUnKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dChcclxuICAgICAgICAgICRjdXJTbGlkZS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyksXHJcbiAgICAgICAgICB0aGlzLm9wdGlvbnNbYGFuaW1PdXRUbyR7ZGlyT3V0fWBdLFxyXG4gICAgICAgICAgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgJGN1clNsaWRlLnJlbW92ZUF0dHIoJ2FyaWEtbGl2ZScpO1xyXG4gICAgICAgICAgICBpZihfdGhpcy5vcHRpb25zLmF1dG9QbGF5ICYmICFfdGhpcy50aW1lci5pc1BhdXNlZCl7XHJcbiAgICAgICAgICAgICAgX3RoaXMudGltZXIucmVzdGFydCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vZG8gc3R1ZmY/XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAkY3VyU2xpZGUucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZSBpcy1pbicpLnJlbW92ZUF0dHIoJ2FyaWEtbGl2ZScpLmhpZGUoKTtcclxuICAgICAgICAkbmV3U2xpZGUuYWRkQ2xhc3MoJ2lzLWFjdGl2ZSBpcy1pbicpLmF0dHIoJ2FyaWEtbGl2ZScsICdwb2xpdGUnKS5zaG93KCk7XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hdXRvUGxheSAmJiAhdGhpcy50aW1lci5pc1BhdXNlZCkge1xyXG4gICAgICAgICAgdGhpcy50aW1lci5yZXN0YXJ0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAvKipcclxuICAgICogVHJpZ2dlcnMgd2hlbiB0aGUgc2xpZGUgaGFzIGZpbmlzaGVkIGFuaW1hdGluZyBpbi5cclxuICAgICogQGV2ZW50IE9yYml0I3NsaWRlY2hhbmdlXHJcbiAgICAqL1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3NsaWRlY2hhbmdlLnpmLm9yYml0JywgWyRuZXdTbGlkZV0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgKiBVcGRhdGVzIHRoZSBhY3RpdmUgc3RhdGUgb2YgdGhlIGJ1bGxldHMsIGlmIGRpc3BsYXllZC5cclxuICAqIEBmdW5jdGlvblxyXG4gICogQHByaXZhdGVcclxuICAqIEBwYXJhbSB7TnVtYmVyfSBpZHggLSB0aGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgc2xpZGUuXHJcbiAgKi9cclxuICBfdXBkYXRlQnVsbGV0cyhpZHgpIHtcclxuICAgIHZhciAkb2xkQnVsbGV0ID0gdGhpcy4kZWxlbWVudC5maW5kKGAuJHt0aGlzLm9wdGlvbnMuYm94T2ZCdWxsZXRzfWApXHJcbiAgICAuZmluZCgnLmlzLWFjdGl2ZScpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKS5ibHVyKCksXHJcbiAgICBzcGFuID0gJG9sZEJ1bGxldC5maW5kKCdzcGFuOmxhc3QnKS5kZXRhY2goKSxcclxuICAgICRuZXdCdWxsZXQgPSB0aGlzLiRidWxsZXRzLmVxKGlkeCkuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpLmFwcGVuZChzcGFuKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICogRGVzdHJveXMgdGhlIGNhcm91c2VsIGFuZCBoaWRlcyB0aGUgZWxlbWVudC5cclxuICAqIEBmdW5jdGlvblxyXG4gICovXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYub3JiaXQnKS5maW5kKCcqJykub2ZmKCcuemYub3JiaXQnKS5lbmQoKS5oaWRlKCk7XHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfVxyXG59XHJcblxyXG5PcmJpdC5kZWZhdWx0cyA9IHtcclxuICAvKipcclxuICAqIFRlbGxzIHRoZSBKUyB0byBsb29rIGZvciBhbmQgbG9hZEJ1bGxldHMuXHJcbiAgKiBAb3B0aW9uXHJcbiAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgKi9cclxuICBidWxsZXRzOiB0cnVlLFxyXG4gIC8qKlxyXG4gICogVGVsbHMgdGhlIEpTIHRvIGFwcGx5IGV2ZW50IGxpc3RlbmVycyB0byBuYXYgYnV0dG9uc1xyXG4gICogQG9wdGlvblxyXG4gICogQGV4YW1wbGUgdHJ1ZVxyXG4gICovXHJcbiAgbmF2QnV0dG9uczogdHJ1ZSxcclxuICAvKipcclxuICAqIG1vdGlvbi11aSBhbmltYXRpb24gY2xhc3MgdG8gYXBwbHlcclxuICAqIEBvcHRpb25cclxuICAqIEBleGFtcGxlICdzbGlkZS1pbi1yaWdodCdcclxuICAqL1xyXG4gIGFuaW1JbkZyb21SaWdodDogJ3NsaWRlLWluLXJpZ2h0JyxcclxuICAvKipcclxuICAqIG1vdGlvbi11aSBhbmltYXRpb24gY2xhc3MgdG8gYXBwbHlcclxuICAqIEBvcHRpb25cclxuICAqIEBleGFtcGxlICdzbGlkZS1vdXQtcmlnaHQnXHJcbiAgKi9cclxuICBhbmltT3V0VG9SaWdodDogJ3NsaWRlLW91dC1yaWdodCcsXHJcbiAgLyoqXHJcbiAgKiBtb3Rpb24tdWkgYW5pbWF0aW9uIGNsYXNzIHRvIGFwcGx5XHJcbiAgKiBAb3B0aW9uXHJcbiAgKiBAZXhhbXBsZSAnc2xpZGUtaW4tbGVmdCdcclxuICAqXHJcbiAgKi9cclxuICBhbmltSW5Gcm9tTGVmdDogJ3NsaWRlLWluLWxlZnQnLFxyXG4gIC8qKlxyXG4gICogbW90aW9uLXVpIGFuaW1hdGlvbiBjbGFzcyB0byBhcHBseVxyXG4gICogQG9wdGlvblxyXG4gICogQGV4YW1wbGUgJ3NsaWRlLW91dC1sZWZ0J1xyXG4gICovXHJcbiAgYW5pbU91dFRvTGVmdDogJ3NsaWRlLW91dC1sZWZ0JyxcclxuICAvKipcclxuICAqIEFsbG93cyBPcmJpdCB0byBhdXRvbWF0aWNhbGx5IGFuaW1hdGUgb24gcGFnZSBsb2FkLlxyXG4gICogQG9wdGlvblxyXG4gICogQGV4YW1wbGUgdHJ1ZVxyXG4gICovXHJcbiAgYXV0b1BsYXk6IHRydWUsXHJcbiAgLyoqXHJcbiAgKiBBbW91bnQgb2YgdGltZSwgaW4gbXMsIGJldHdlZW4gc2xpZGUgdHJhbnNpdGlvbnNcclxuICAqIEBvcHRpb25cclxuICAqIEBleGFtcGxlIDUwMDBcclxuICAqL1xyXG4gIHRpbWVyRGVsYXk6IDUwMDAsXHJcbiAgLyoqXHJcbiAgKiBBbGxvd3MgT3JiaXQgdG8gaW5maW5pdGVseSBsb29wIHRocm91Z2ggdGhlIHNsaWRlc1xyXG4gICogQG9wdGlvblxyXG4gICogQGV4YW1wbGUgdHJ1ZVxyXG4gICovXHJcbiAgaW5maW5pdGVXcmFwOiB0cnVlLFxyXG4gIC8qKlxyXG4gICogQWxsb3dzIHRoZSBPcmJpdCBzbGlkZXMgdG8gYmluZCB0byBzd2lwZSBldmVudHMgZm9yIG1vYmlsZSwgcmVxdWlyZXMgYW4gYWRkaXRpb25hbCB1dGlsIGxpYnJhcnlcclxuICAqIEBvcHRpb25cclxuICAqIEBleGFtcGxlIHRydWVcclxuICAqL1xyXG4gIHN3aXBlOiB0cnVlLFxyXG4gIC8qKlxyXG4gICogQWxsb3dzIHRoZSB0aW1pbmcgZnVuY3Rpb24gdG8gcGF1c2UgYW5pbWF0aW9uIG9uIGhvdmVyLlxyXG4gICogQG9wdGlvblxyXG4gICogQGV4YW1wbGUgdHJ1ZVxyXG4gICovXHJcbiAgcGF1c2VPbkhvdmVyOiB0cnVlLFxyXG4gIC8qKlxyXG4gICogQWxsb3dzIE9yYml0IHRvIGJpbmQga2V5Ym9hcmQgZXZlbnRzIHRvIHRoZSBzbGlkZXIsIHRvIGFuaW1hdGUgZnJhbWVzIHdpdGggYXJyb3cga2V5c1xyXG4gICogQG9wdGlvblxyXG4gICogQGV4YW1wbGUgdHJ1ZVxyXG4gICovXHJcbiAgYWNjZXNzaWJsZTogdHJ1ZSxcclxuICAvKipcclxuICAqIENsYXNzIGFwcGxpZWQgdG8gdGhlIGNvbnRhaW5lciBvZiBPcmJpdFxyXG4gICogQG9wdGlvblxyXG4gICogQGV4YW1wbGUgJ29yYml0LWNvbnRhaW5lcidcclxuICAqL1xyXG4gIGNvbnRhaW5lckNsYXNzOiAnb3JiaXQtY29udGFpbmVyJyxcclxuICAvKipcclxuICAqIENsYXNzIGFwcGxpZWQgdG8gaW5kaXZpZHVhbCBzbGlkZXMuXHJcbiAgKiBAb3B0aW9uXHJcbiAgKiBAZXhhbXBsZSAnb3JiaXQtc2xpZGUnXHJcbiAgKi9cclxuICBzbGlkZUNsYXNzOiAnb3JiaXQtc2xpZGUnLFxyXG4gIC8qKlxyXG4gICogQ2xhc3MgYXBwbGllZCB0byB0aGUgYnVsbGV0IGNvbnRhaW5lci4gWW91J3JlIHdlbGNvbWUuXHJcbiAgKiBAb3B0aW9uXHJcbiAgKiBAZXhhbXBsZSAnb3JiaXQtYnVsbGV0cydcclxuICAqL1xyXG4gIGJveE9mQnVsbGV0czogJ29yYml0LWJ1bGxldHMnLFxyXG4gIC8qKlxyXG4gICogQ2xhc3MgYXBwbGllZCB0byB0aGUgYG5leHRgIG5hdmlnYXRpb24gYnV0dG9uLlxyXG4gICogQG9wdGlvblxyXG4gICogQGV4YW1wbGUgJ29yYml0LW5leHQnXHJcbiAgKi9cclxuICBuZXh0Q2xhc3M6ICdvcmJpdC1uZXh0JyxcclxuICAvKipcclxuICAqIENsYXNzIGFwcGxpZWQgdG8gdGhlIGBwcmV2aW91c2AgbmF2aWdhdGlvbiBidXR0b24uXHJcbiAgKiBAb3B0aW9uXHJcbiAgKiBAZXhhbXBsZSAnb3JiaXQtcHJldmlvdXMnXHJcbiAgKi9cclxuICBwcmV2Q2xhc3M6ICdvcmJpdC1wcmV2aW91cycsXHJcbiAgLyoqXHJcbiAgKiBCb29sZWFuIHRvIGZsYWcgdGhlIGpzIHRvIHVzZSBtb3Rpb24gdWkgY2xhc3NlcyBvciBub3QuIERlZmF1bHQgdG8gdHJ1ZSBmb3IgYmFja3dhcmRzIGNvbXBhdGFiaWxpdHkuXHJcbiAgKiBAb3B0aW9uXHJcbiAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgKi9cclxuICB1c2VNVUk6IHRydWVcclxufTtcclxuXHJcbi8vIFdpbmRvdyBleHBvcnRzXHJcbkZvdW5kYXRpb24ucGx1Z2luKE9yYml0LCAnT3JiaXQnKTtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8qKlxyXG4gKiBSZXNwb25zaXZlTWVudSBtb2R1bGUuXHJcbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5yZXNwb25zaXZlTWVudVxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmFjY29yZGlvbk1lbnVcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5kcmlsbGRvd25cclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5kcm9wZG93bi1tZW51XHJcbiAqL1xyXG5cclxuY2xhc3MgUmVzcG9uc2l2ZU1lbnUge1xyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSByZXNwb25zaXZlIG1lbnUuXHJcbiAgICogQGNsYXNzXHJcbiAgICogQGZpcmVzIFJlc3BvbnNpdmVNZW51I2luaXRcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGEgZHJvcGRvd24gbWVudS5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9ICQoZWxlbWVudCk7XHJcbiAgICB0aGlzLnJ1bGVzID0gdGhpcy4kZWxlbWVudC5kYXRhKCdyZXNwb25zaXZlLW1lbnUnKTtcclxuICAgIHRoaXMuY3VycmVudE1xID0gbnVsbDtcclxuICAgIHRoaXMuY3VycmVudFBsdWdpbiA9IG51bGw7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG4gICAgdGhpcy5fZXZlbnRzKCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnUmVzcG9uc2l2ZU1lbnUnKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBNZW51IGJ5IHBhcnNpbmcgdGhlIGNsYXNzZXMgZnJvbSB0aGUgJ2RhdGEtUmVzcG9uc2l2ZU1lbnUnIGF0dHJpYnV0ZSBvbiB0aGUgZWxlbWVudC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9pbml0KCkge1xyXG4gICAgLy8gVGhlIGZpcnN0IHRpbWUgYW4gSW50ZXJjaGFuZ2UgcGx1Z2luIGlzIGluaXRpYWxpemVkLCB0aGlzLnJ1bGVzIGlzIGNvbnZlcnRlZCBmcm9tIGEgc3RyaW5nIG9mIFwiY2xhc3Nlc1wiIHRvIGFuIG9iamVjdCBvZiBydWxlc1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLnJ1bGVzID09PSAnc3RyaW5nJykge1xyXG4gICAgICBsZXQgcnVsZXNUcmVlID0ge307XHJcblxyXG4gICAgICAvLyBQYXJzZSBydWxlcyBmcm9tIFwiY2xhc3Nlc1wiIHB1bGxlZCBmcm9tIGRhdGEgYXR0cmlidXRlXHJcbiAgICAgIGxldCBydWxlcyA9IHRoaXMucnVsZXMuc3BsaXQoJyAnKTtcclxuXHJcbiAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBldmVyeSBydWxlIGZvdW5kXHJcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcnVsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBsZXQgcnVsZSA9IHJ1bGVzW2ldLnNwbGl0KCctJyk7XHJcbiAgICAgICAgbGV0IHJ1bGVTaXplID0gcnVsZS5sZW5ndGggPiAxID8gcnVsZVswXSA6ICdzbWFsbCc7XHJcbiAgICAgICAgbGV0IHJ1bGVQbHVnaW4gPSBydWxlLmxlbmd0aCA+IDEgPyBydWxlWzFdIDogcnVsZVswXTtcclxuXHJcbiAgICAgICAgaWYgKE1lbnVQbHVnaW5zW3J1bGVQbHVnaW5dICE9PSBudWxsKSB7XHJcbiAgICAgICAgICBydWxlc1RyZWVbcnVsZVNpemVdID0gTWVudVBsdWdpbnNbcnVsZVBsdWdpbl07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLnJ1bGVzID0gcnVsZXNUcmVlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghJC5pc0VtcHR5T2JqZWN0KHRoaXMucnVsZXMpKSB7XHJcbiAgICAgIHRoaXMuX2NoZWNrTWVkaWFRdWVyaWVzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyBldmVudHMgZm9yIHRoZSBNZW51LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2V2ZW50cygpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBmdW5jdGlvbigpIHtcclxuICAgICAgX3RoaXMuX2NoZWNrTWVkaWFRdWVyaWVzKCk7XHJcbiAgICB9KTtcclxuICAgIC8vICQod2luZG93KS5vbigncmVzaXplLnpmLlJlc3BvbnNpdmVNZW51JywgZnVuY3Rpb24oKSB7XHJcbiAgICAvLyAgIF90aGlzLl9jaGVja01lZGlhUXVlcmllcygpO1xyXG4gICAgLy8gfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGVja3MgdGhlIGN1cnJlbnQgc2NyZWVuIHdpZHRoIGFnYWluc3QgYXZhaWxhYmxlIG1lZGlhIHF1ZXJpZXMuIElmIHRoZSBtZWRpYSBxdWVyeSBoYXMgY2hhbmdlZCwgYW5kIHRoZSBwbHVnaW4gbmVlZGVkIGhhcyBjaGFuZ2VkLCB0aGUgcGx1Z2lucyB3aWxsIHN3YXAgb3V0LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2NoZWNrTWVkaWFRdWVyaWVzKCkge1xyXG4gICAgdmFyIG1hdGNoZWRNcSwgX3RoaXMgPSB0aGlzO1xyXG4gICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGVhY2ggcnVsZSBhbmQgZmluZCB0aGUgbGFzdCBtYXRjaGluZyBydWxlXHJcbiAgICAkLmVhY2godGhpcy5ydWxlcywgZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgIGlmIChGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdChrZXkpKSB7XHJcbiAgICAgICAgbWF0Y2hlZE1xID0ga2V5O1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBObyBtYXRjaD8gTm8gZGljZVxyXG4gICAgaWYgKCFtYXRjaGVkTXEpIHJldHVybjtcclxuXHJcbiAgICAvLyBQbHVnaW4gYWxyZWFkeSBpbml0aWFsaXplZD8gV2UgZ29vZFxyXG4gICAgaWYgKHRoaXMuY3VycmVudFBsdWdpbiBpbnN0YW5jZW9mIHRoaXMucnVsZXNbbWF0Y2hlZE1xXS5wbHVnaW4pIHJldHVybjtcclxuXHJcbiAgICAvLyBSZW1vdmUgZXhpc3RpbmcgcGx1Z2luLXNwZWNpZmljIENTUyBjbGFzc2VzXHJcbiAgICAkLmVhY2goTWVudVBsdWdpbnMsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgX3RoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3ModmFsdWUuY3NzQ2xhc3MpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQWRkIHRoZSBDU1MgY2xhc3MgZm9yIHRoZSBuZXcgcGx1Z2luXHJcbiAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKHRoaXMucnVsZXNbbWF0Y2hlZE1xXS5jc3NDbGFzcyk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBuZXcgcGx1Z2luXHJcbiAgICBpZiAodGhpcy5jdXJyZW50UGx1Z2luKSB0aGlzLmN1cnJlbnRQbHVnaW4uZGVzdHJveSgpO1xyXG4gICAgdGhpcy5jdXJyZW50UGx1Z2luID0gbmV3IHRoaXMucnVsZXNbbWF0Y2hlZE1xXS5wbHVnaW4odGhpcy4kZWxlbWVudCwge30pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgdGhlIGluc3RhbmNlIG9mIHRoZSBjdXJyZW50IHBsdWdpbiBvbiB0aGlzIGVsZW1lbnQsIGFzIHdlbGwgYXMgdGhlIHdpbmRvdyByZXNpemUgaGFuZGxlciB0aGF0IHN3aXRjaGVzIHRoZSBwbHVnaW5zIG91dC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy5jdXJyZW50UGx1Z2luLmRlc3Ryb3koKTtcclxuICAgICQod2luZG93KS5vZmYoJy56Zi5SZXNwb25zaXZlTWVudScpO1xyXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH1cclxufVxyXG5cclxuUmVzcG9uc2l2ZU1lbnUuZGVmYXVsdHMgPSB7fTtcclxuXHJcbi8vIFRoZSBwbHVnaW4gbWF0Y2hlcyB0aGUgcGx1Z2luIGNsYXNzZXMgd2l0aCB0aGVzZSBwbHVnaW4gaW5zdGFuY2VzLlxyXG52YXIgTWVudVBsdWdpbnMgPSB7XHJcbiAgZHJvcGRvd246IHtcclxuICAgIGNzc0NsYXNzOiAnZHJvcGRvd24nLFxyXG4gICAgcGx1Z2luOiBGb3VuZGF0aW9uLl9wbHVnaW5zWydkcm9wZG93bi1tZW51J10gfHwgbnVsbFxyXG4gIH0sXHJcbiBkcmlsbGRvd246IHtcclxuICAgIGNzc0NsYXNzOiAnZHJpbGxkb3duJyxcclxuICAgIHBsdWdpbjogRm91bmRhdGlvbi5fcGx1Z2luc1snZHJpbGxkb3duJ10gfHwgbnVsbFxyXG4gIH0sXHJcbiAgYWNjb3JkaW9uOiB7XHJcbiAgICBjc3NDbGFzczogJ2FjY29yZGlvbi1tZW51JyxcclxuICAgIHBsdWdpbjogRm91bmRhdGlvbi5fcGx1Z2luc1snYWNjb3JkaW9uLW1lbnUnXSB8fCBudWxsXHJcbiAgfVxyXG59O1xyXG5cclxuLy8gV2luZG93IGV4cG9ydHNcclxuRm91bmRhdGlvbi5wbHVnaW4oUmVzcG9uc2l2ZU1lbnUsICdSZXNwb25zaXZlTWVudScpO1xyXG5cclxufShqUXVlcnkpO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4hZnVuY3Rpb24oJCkge1xyXG5cclxuLyoqXHJcbiAqIFJlc3BvbnNpdmVUb2dnbGUgbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ucmVzcG9uc2l2ZVRvZ2dsZVxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcclxuICovXHJcblxyXG5jbGFzcyBSZXNwb25zaXZlVG9nZ2xlIHtcclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIFRhYiBCYXIuXHJcbiAgICogQGNsYXNzXHJcbiAgICogQGZpcmVzIFJlc3BvbnNpdmVUb2dnbGUjaW5pdFxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhdHRhY2ggdGFiIGJhciBmdW5jdGlvbmFsaXR5IHRvLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50ID0gJChlbGVtZW50KTtcclxuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBSZXNwb25zaXZlVG9nZ2xlLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG4gICAgdGhpcy5fZXZlbnRzKCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnUmVzcG9uc2l2ZVRvZ2dsZScpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHRhYiBiYXIgYnkgZmluZGluZyB0aGUgdGFyZ2V0IGVsZW1lbnQsIHRvZ2dsaW5nIGVsZW1lbnQsIGFuZCBydW5uaW5nIHVwZGF0ZSgpLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2luaXQoKSB7XHJcbiAgICB2YXIgdGFyZ2V0SUQgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ3Jlc3BvbnNpdmUtdG9nZ2xlJyk7XHJcbiAgICBpZiAoIXRhcmdldElEKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1lvdXIgdGFiIGJhciBuZWVkcyBhbiBJRCBvZiBhIE1lbnUgYXMgdGhlIHZhbHVlIG9mIGRhdGEtdGFiLWJhci4nKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLiR0YXJnZXRNZW51ID0gJChgIyR7dGFyZ2V0SUR9YCk7XHJcbiAgICB0aGlzLiR0b2dnbGVyID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS10b2dnbGVdJyk7XHJcblxyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIG5lY2Vzc2FyeSBldmVudCBoYW5kbGVycyBmb3IgdGhlIHRhYiBiYXIgdG8gd29yay5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9ldmVudHMoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgICQod2luZG93KS5vbignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgdGhpcy5fdXBkYXRlLmJpbmQodGhpcykpO1xyXG5cclxuICAgIHRoaXMuJHRvZ2dsZXIub24oJ2NsaWNrLnpmLnJlc3BvbnNpdmVUb2dnbGUnLCB0aGlzLnRvZ2dsZU1lbnUuYmluZCh0aGlzKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGVja3MgdGhlIGN1cnJlbnQgbWVkaWEgcXVlcnkgdG8gZGV0ZXJtaW5lIGlmIHRoZSB0YWIgYmFyIHNob3VsZCBiZSB2aXNpYmxlIG9yIGhpZGRlbi5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF91cGRhdGUoKSB7XHJcbiAgICAvLyBNb2JpbGVcclxuICAgIGlmICghRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QodGhpcy5vcHRpb25zLmhpZGVGb3IpKSB7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQuc2hvdygpO1xyXG4gICAgICB0aGlzLiR0YXJnZXRNZW51LmhpZGUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEZXNrdG9wXHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy4kZWxlbWVudC5oaWRlKCk7XHJcbiAgICAgIHRoaXMuJHRhcmdldE1lbnUuc2hvdygpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVG9nZ2xlcyB0aGUgZWxlbWVudCBhdHRhY2hlZCB0byB0aGUgdGFiIGJhci4gVGhlIHRvZ2dsZSBvbmx5IGhhcHBlbnMgaWYgdGhlIHNjcmVlbiBpcyBzbWFsbCBlbm91Z2ggdG8gYWxsb3cgaXQuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQGZpcmVzIFJlc3BvbnNpdmVUb2dnbGUjdG9nZ2xlZFxyXG4gICAqL1xyXG4gIHRvZ2dsZU1lbnUoKSB7XHJcbiAgICBpZiAoIUZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KHRoaXMub3B0aW9ucy5oaWRlRm9yKSkge1xyXG4gICAgICB0aGlzLiR0YXJnZXRNZW51LnRvZ2dsZSgwKTtcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBGaXJlcyB3aGVuIHRoZSBlbGVtZW50IGF0dGFjaGVkIHRvIHRoZSB0YWIgYmFyIHRvZ2dsZXMuXHJcbiAgICAgICAqIEBldmVudCBSZXNwb25zaXZlVG9nZ2xlI3RvZ2dsZWRcclxuICAgICAgICovXHJcbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigndG9nZ2xlZC56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIC8vVE9ETyB0aGlzLi4uXHJcbiAgfVxyXG59XHJcblxyXG5SZXNwb25zaXZlVG9nZ2xlLmRlZmF1bHRzID0ge1xyXG4gIC8qKlxyXG4gICAqIFRoZSBicmVha3BvaW50IGFmdGVyIHdoaWNoIHRoZSBtZW51IGlzIGFsd2F5cyBzaG93biwgYW5kIHRoZSB0YWIgYmFyIGlzIGhpZGRlbi5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ21lZGl1bSdcclxuICAgKi9cclxuICBoaWRlRm9yOiAnbWVkaXVtJ1xyXG59O1xyXG5cclxuLy8gV2luZG93IGV4cG9ydHNcclxuRm91bmRhdGlvbi5wbHVnaW4oUmVzcG9uc2l2ZVRvZ2dsZSwgJ1Jlc3BvbnNpdmVUb2dnbGUnKTtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8qKlxyXG4gKiBSZXZlYWwgbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ucmV2ZWFsXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5ib3hcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb24gaWYgdXNpbmcgYW5pbWF0aW9uc1xyXG4gKi9cclxuXHJcbmNsYXNzIFJldmVhbCB7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBSZXZlYWwuXHJcbiAgICogQGNsYXNzXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHVzZSBmb3IgdGhlIG1vZGFsLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gb3B0aW9uYWwgcGFyYW1ldGVycy5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcclxuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBSZXZlYWwuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcclxuICAgIHRoaXMuX2luaXQoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdSZXZlYWwnKTtcclxuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ1JldmVhbCcsIHtcclxuICAgICAgJ0VOVEVSJzogJ29wZW4nLFxyXG4gICAgICAnU1BBQ0UnOiAnb3BlbicsXHJcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnLFxyXG4gICAgICAnVEFCJzogJ3RhYl9mb3J3YXJkJyxcclxuICAgICAgJ1NISUZUX1RBQic6ICd0YWJfYmFja3dhcmQnXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBtb2RhbCBieSBhZGRpbmcgdGhlIG92ZXJsYXkgYW5kIGNsb3NlIGJ1dHRvbnMsIChpZiBzZWxlY3RlZCkuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfaW5pdCgpIHtcclxuICAgIHRoaXMuaWQgPSB0aGlzLiRlbGVtZW50LmF0dHIoJ2lkJyk7XHJcbiAgICB0aGlzLmlzQWN0aXZlID0gZmFsc2U7XHJcbiAgICB0aGlzLmNhY2hlZCA9IHttcTogRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmN1cnJlbnR9O1xyXG4gICAgdGhpcy5pc2lPUyA9IGlQaG9uZVNuaWZmKCk7XHJcblxyXG4gICAgaWYodGhpcy5pc2lPUyl7IHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ2lzLWlvcycpOyB9XHJcblxyXG4gICAgdGhpcy4kYW5jaG9yID0gJChgW2RhdGEtb3Blbj1cIiR7dGhpcy5pZH1cIl1gKS5sZW5ndGggPyAkKGBbZGF0YS1vcGVuPVwiJHt0aGlzLmlkfVwiXWApIDogJChgW2RhdGEtdG9nZ2xlPVwiJHt0aGlzLmlkfVwiXWApO1xyXG5cclxuICAgIGlmICh0aGlzLiRhbmNob3IubGVuZ3RoKSB7XHJcbiAgICAgIHZhciBhbmNob3JJZCA9IHRoaXMuJGFuY2hvclswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdyZXZlYWwnKTtcclxuXHJcbiAgICAgIHRoaXMuJGFuY2hvci5hdHRyKHtcclxuICAgICAgICAnYXJpYS1jb250cm9scyc6IHRoaXMuaWQsXHJcbiAgICAgICAgJ2lkJzogYW5jaG9ySWQsXHJcbiAgICAgICAgJ2FyaWEtaGFzcG9wdXAnOiB0cnVlLFxyXG4gICAgICAgICd0YWJpbmRleCc6IDBcclxuICAgICAgfSk7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXR0cih7J2FyaWEtbGFiZWxsZWRieSc6IGFuY2hvcklkfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5mdWxsU2NyZWVuIHx8IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2Z1bGwnKSkge1xyXG4gICAgICB0aGlzLm9wdGlvbnMuZnVsbFNjcmVlbiA9IHRydWU7XHJcbiAgICAgIHRoaXMub3B0aW9ucy5vdmVybGF5ID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkgJiYgIXRoaXMuJG92ZXJsYXkpIHtcclxuICAgICAgdGhpcy4kb3ZlcmxheSA9IHRoaXMuX21ha2VPdmVybGF5KHRoaXMuaWQpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cih7XHJcbiAgICAgICAgJ3JvbGUnOiAnZGlhbG9nJyxcclxuICAgICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxyXG4gICAgICAgICdkYXRhLXlldGktYm94JzogdGhpcy5pZCxcclxuICAgICAgICAnZGF0YS1yZXNpemUnOiB0aGlzLmlkXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZih0aGlzLiRvdmVybGF5KSB7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQuZGV0YWNoKCkuYXBwZW5kVG8odGhpcy4kb3ZlcmxheSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLiRlbGVtZW50LmRldGFjaCgpLmFwcGVuZFRvKCQoJ2JvZHknKSk7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ3dpdGhvdXQtb3ZlcmxheScpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5fZXZlbnRzKCk7XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZXBMaW5rICYmIHdpbmRvdy5sb2NhdGlvbi5oYXNoID09PSAoIGAjJHt0aGlzLmlkfWApKSB7XHJcbiAgICAgICQod2luZG93KS5vbmUoJ2xvYWQuemYucmV2ZWFsJywgdGhpcy5vcGVuLmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhbiBvdmVybGF5IGRpdiB0byBkaXNwbGF5IGJlaGluZCB0aGUgbW9kYWwuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfbWFrZU92ZXJsYXkoaWQpIHtcclxuICAgIHZhciAkb3ZlcmxheSA9ICQoJzxkaXY+PC9kaXY+JylcclxuICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3JldmVhbC1vdmVybGF5JylcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cih7J3RhYmluZGV4JzogLTEsICdhcmlhLWhpZGRlbic6IHRydWV9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmRUbygnYm9keScpO1xyXG4gICAgcmV0dXJuICRvdmVybGF5O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXBkYXRlcyBwb3NpdGlvbiBvZiBtb2RhbFxyXG4gICAqIFRPRE86ICBGaWd1cmUgb3V0IGlmIHdlIGFjdHVhbGx5IG5lZWQgdG8gY2FjaGUgdGhlc2UgdmFsdWVzIG9yIGlmIGl0IGRvZXNuJ3QgbWF0dGVyXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfdXBkYXRlUG9zaXRpb24oKSB7XHJcbiAgICB2YXIgd2lkdGggPSB0aGlzLiRlbGVtZW50Lm91dGVyV2lkdGgoKTtcclxuICAgIHZhciBvdXRlcldpZHRoID0gJCh3aW5kb3cpLndpZHRoKCk7XHJcbiAgICB2YXIgaGVpZ2h0ID0gdGhpcy4kZWxlbWVudC5vdXRlckhlaWdodCgpO1xyXG4gICAgdmFyIG91dGVySGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpO1xyXG4gICAgdmFyIGxlZnQsIHRvcDtcclxuICAgIGlmICh0aGlzLm9wdGlvbnMuaE9mZnNldCA9PT0gJ2F1dG8nKSB7XHJcbiAgICAgIGxlZnQgPSBwYXJzZUludCgob3V0ZXJXaWR0aCAtIHdpZHRoKSAvIDIsIDEwKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGxlZnQgPSBwYXJzZUludCh0aGlzLm9wdGlvbnMuaE9mZnNldCwgMTApO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy52T2Zmc2V0ID09PSAnYXV0bycpIHtcclxuICAgICAgaWYgKGhlaWdodCA+IG91dGVySGVpZ2h0KSB7XHJcbiAgICAgICAgdG9wID0gcGFyc2VJbnQoTWF0aC5taW4oMTAwLCBvdXRlckhlaWdodCAvIDEwKSwgMTApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRvcCA9IHBhcnNlSW50KChvdXRlckhlaWdodCAtIGhlaWdodCkgLyA0LCAxMCk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRvcCA9IHBhcnNlSW50KHRoaXMub3B0aW9ucy52T2Zmc2V0LCAxMCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLiRlbGVtZW50LmNzcyh7dG9wOiB0b3AgKyAncHgnfSk7XHJcbiAgICAvLyBvbmx5IHdvcnJ5IGFib3V0IGxlZnQgaWYgd2UgZG9uJ3QgaGF2ZSBhbiBvdmVybGF5IG9yIHdlIGhhdmVhICBob3Jpem9udGFsIG9mZnNldCxcclxuICAgIC8vIG90aGVyd2lzZSB3ZSdyZSBwZXJmZWN0bHkgaW4gdGhlIG1pZGRsZVxyXG4gICAgaWYoIXRoaXMuJG92ZXJsYXkgfHwgKHRoaXMub3B0aW9ucy5oT2Zmc2V0ICE9PSAnYXV0bycpKSB7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQuY3NzKHtsZWZ0OiBsZWZ0ICsgJ3B4J30pO1xyXG4gICAgICB0aGlzLiRlbGVtZW50LmNzcyh7bWFyZ2luOiAnMHB4J30pO1xyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgZm9yIHRoZSBtb2RhbC5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9ldmVudHMoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMuJGVsZW1lbnQub24oe1xyXG4gICAgICAnb3Blbi56Zi50cmlnZ2VyJzogdGhpcy5vcGVuLmJpbmQodGhpcyksXHJcbiAgICAgICdjbG9zZS56Zi50cmlnZ2VyJzogdGhpcy5jbG9zZS5iaW5kKHRoaXMpLFxyXG4gICAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxyXG4gICAgICAncmVzaXplbWUuemYudHJpZ2dlcic6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIF90aGlzLl91cGRhdGVQb3NpdGlvbigpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAodGhpcy4kYW5jaG9yLmxlbmd0aCkge1xyXG4gICAgICB0aGlzLiRhbmNob3Iub24oJ2tleWRvd24uemYucmV2ZWFsJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGlmIChlLndoaWNoID09PSAxMyB8fCBlLndoaWNoID09PSAzMikge1xyXG4gICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIF90aGlzLm9wZW4oKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrICYmIHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XHJcbiAgICAgIHRoaXMuJG92ZXJsYXkub2ZmKCcuemYucmV2ZWFsJykub24oJ2NsaWNrLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpZiAoZS50YXJnZXQgPT09IF90aGlzLiRlbGVtZW50WzBdIHx8ICQuY29udGFpbnMoX3RoaXMuJGVsZW1lbnRbMF0sIGUudGFyZ2V0KSkgeyByZXR1cm47IH1cclxuICAgICAgICBfdGhpcy5jbG9zZSgpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuZGVlcExpbmspIHtcclxuICAgICAgJCh3aW5kb3cpLm9uKGBwb3BzdGF0ZS56Zi5yZXZlYWw6JHt0aGlzLmlkfWAsIHRoaXMuX2hhbmRsZVN0YXRlLmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlcyBtb2RhbCBtZXRob2RzIG9uIGJhY2svZm9yd2FyZCBidXR0b24gY2xpY2tzIG9yIGFueSBvdGhlciBldmVudCB0aGF0IHRyaWdnZXJzIHBvcHN0YXRlLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2hhbmRsZVN0YXRlKGUpIHtcclxuICAgIGlmKHdpbmRvdy5sb2NhdGlvbi5oYXNoID09PSAoICcjJyArIHRoaXMuaWQpICYmICF0aGlzLmlzQWN0aXZlKXsgdGhpcy5vcGVuKCk7IH1cclxuICAgIGVsc2V7IHRoaXMuY2xvc2UoKTsgfVxyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIE9wZW5zIHRoZSBtb2RhbCBjb250cm9sbGVkIGJ5IGB0aGlzLiRhbmNob3JgLCBhbmQgY2xvc2VzIGFsbCBvdGhlcnMgYnkgZGVmYXVsdC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAZmlyZXMgUmV2ZWFsI2Nsb3NlbWVcclxuICAgKiBAZmlyZXMgUmV2ZWFsI29wZW5cclxuICAgKi9cclxuICBvcGVuKCkge1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5kZWVwTGluaykge1xyXG4gICAgICB2YXIgaGFzaCA9IGAjJHt0aGlzLmlkfWA7XHJcblxyXG4gICAgICBpZiAod2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKSB7XHJcbiAgICAgICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsIGhhc2gpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gaGFzaDtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaXNBY3RpdmUgPSB0cnVlO1xyXG5cclxuICAgIC8vIE1ha2UgZWxlbWVudHMgaW52aXNpYmxlLCBidXQgcmVtb3ZlIGRpc3BsYXk6IG5vbmUgc28gd2UgY2FuIGdldCBzaXplIGFuZCBwb3NpdGlvbmluZ1xyXG4gICAgdGhpcy4kZWxlbWVudFxyXG4gICAgICAgIC5jc3MoeyAndmlzaWJpbGl0eSc6ICdoaWRkZW4nIH0pXHJcbiAgICAgICAgLnNob3coKVxyXG4gICAgICAgIC5zY3JvbGxUb3AoMCk7XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkpIHtcclxuICAgICAgdGhpcy4kb3ZlcmxheS5jc3Moeyd2aXNpYmlsaXR5JzogJ2hpZGRlbid9KS5zaG93KCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fdXBkYXRlUG9zaXRpb24oKTtcclxuXHJcbiAgICB0aGlzLiRlbGVtZW50XHJcbiAgICAgIC5oaWRlKClcclxuICAgICAgLmNzcyh7ICd2aXNpYmlsaXR5JzogJycgfSk7XHJcblxyXG4gICAgaWYodGhpcy4kb3ZlcmxheSkge1xyXG4gICAgICB0aGlzLiRvdmVybGF5LmNzcyh7J3Zpc2liaWxpdHknOiAnJ30pLmhpZGUoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMubXVsdGlwbGVPcGVuZWQpIHtcclxuICAgICAgLyoqXHJcbiAgICAgICAqIEZpcmVzIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgbW9kYWwgb3BlbnMuXHJcbiAgICAgICAqIENsb3NlcyBhbnkgb3RoZXIgbW9kYWxzIHRoYXQgYXJlIGN1cnJlbnRseSBvcGVuXHJcbiAgICAgICAqIEBldmVudCBSZXZlYWwjY2xvc2VtZVxyXG4gICAgICAgKi9cclxuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdjbG9zZW1lLnpmLnJldmVhbCcsIHRoaXMuaWQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1vdGlvbiBVSSBtZXRob2Qgb2YgcmV2ZWFsXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmFuaW1hdGlvbkluKSB7XHJcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xyXG4gICAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVJbih0aGlzLiRvdmVybGF5LCAnZmFkZS1pbicpO1xyXG4gICAgICB9XHJcbiAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVJbih0aGlzLiRlbGVtZW50LCB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uSW4sICgpID0+IHtcclxuICAgICAgICB0aGlzLmZvY3VzYWJsZUVsZW1lbnRzID0gRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlKHRoaXMuJGVsZW1lbnQpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIC8vIGpRdWVyeSBtZXRob2Qgb2YgcmV2ZWFsXHJcbiAgICBlbHNlIHtcclxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XHJcbiAgICAgICAgdGhpcy4kb3ZlcmxheS5zaG93KDApO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQuc2hvdyh0aGlzLm9wdGlvbnMuc2hvd0RlbGF5KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBoYW5kbGUgYWNjZXNzaWJpbGl0eVxyXG4gICAgdGhpcy4kZWxlbWVudFxyXG4gICAgICAuYXR0cih7XHJcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzogZmFsc2UsXHJcbiAgICAgICAgJ3RhYmluZGV4JzogLTFcclxuICAgICAgfSlcclxuICAgICAgLmZvY3VzKCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBtb2RhbCBoYXMgc3VjY2Vzc2Z1bGx5IG9wZW5lZC5cclxuICAgICAqIEBldmVudCBSZXZlYWwjb3BlblxyXG4gICAgICovXHJcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ29wZW4uemYucmV2ZWFsJyk7XHJcblxyXG4gICAgaWYgKHRoaXMuaXNpT1MpIHtcclxuICAgICAgdmFyIHNjcm9sbFBvcyA9IHdpbmRvdy5wYWdlWU9mZnNldDtcclxuICAgICAgJCgnaHRtbCwgYm9keScpLmFkZENsYXNzKCdpcy1yZXZlYWwtb3BlbicpLnNjcm9sbFRvcChzY3JvbGxQb3MpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICQoJ2JvZHknKS5hZGRDbGFzcygnaXMtcmV2ZWFsLW9wZW4nKTtcclxuICAgIH1cclxuXHJcbiAgICAkKCdib2R5JylcclxuICAgICAgLmFkZENsYXNzKCdpcy1yZXZlYWwtb3BlbicpXHJcbiAgICAgIC5hdHRyKCdhcmlhLWhpZGRlbicsICh0aGlzLm9wdGlvbnMub3ZlcmxheSB8fCB0aGlzLm9wdGlvbnMuZnVsbFNjcmVlbikgPyB0cnVlIDogZmFsc2UpO1xyXG5cclxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICB0aGlzLl9leHRyYUhhbmRsZXJzKCk7XHJcbiAgICB9LCAwKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgZXh0cmEgZXZlbnQgaGFuZGxlcnMgZm9yIHRoZSBib2R5IGFuZCB3aW5kb3cgaWYgbmVjZXNzYXJ5LlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2V4dHJhSGFuZGxlcnMoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgdGhpcy5mb2N1c2FibGVFbGVtZW50cyA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZSh0aGlzLiRlbGVtZW50KTtcclxuXHJcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5vdmVybGF5ICYmIHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2sgJiYgIXRoaXMub3B0aW9ucy5mdWxsU2NyZWVuKSB7XHJcbiAgICAgICQoJ2JvZHknKS5vbignY2xpY2suemYucmV2ZWFsJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGlmIChlLnRhcmdldCA9PT0gX3RoaXMuJGVsZW1lbnRbMF0gfHwgJC5jb250YWlucyhfdGhpcy4kZWxlbWVudFswXSwgZS50YXJnZXQpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIF90aGlzLmNsb3NlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkVzYykge1xyXG4gICAgICAkKHdpbmRvdykub24oJ2tleWRvd24uemYucmV2ZWFsJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdSZXZlYWwnLCB7XHJcbiAgICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLmNsb3NlT25Fc2MpIHtcclxuICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZm9jdXMoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBsb2NrIGZvY3VzIHdpdGhpbiBtb2RhbCB3aGlsZSB0YWJiaW5nXHJcbiAgICB0aGlzLiRlbGVtZW50Lm9uKCdrZXlkb3duLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgdmFyICR0YXJnZXQgPSAkKHRoaXMpO1xyXG4gICAgICAvLyBoYW5kbGUga2V5Ym9hcmQgZXZlbnQgd2l0aCBrZXlib2FyZCB1dGlsXHJcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdSZXZlYWwnLCB7XHJcbiAgICAgICAgdGFiX2ZvcndhcmQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYgKF90aGlzLiRlbGVtZW50LmZpbmQoJzpmb2N1cycpLmlzKF90aGlzLmZvY3VzYWJsZUVsZW1lbnRzLmVxKC0xKSkpIHsgLy8gbGVmdCBtb2RhbCBkb3dud2FyZHMsIHNldHRpbmcgZm9jdXMgdG8gZmlyc3QgZWxlbWVudFxyXG4gICAgICAgICAgICBfdGhpcy5mb2N1c2FibGVFbGVtZW50cy5lcSgwKS5mb2N1cygpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMubGVuZ3RoID09PSAwKSB7IC8vIG5vIGZvY3VzYWJsZSBlbGVtZW50cyBpbnNpZGUgdGhlIG1vZGFsIGF0IGFsbCwgcHJldmVudCB0YWJiaW5nIGluIGdlbmVyYWxcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdGFiX2JhY2t3YXJkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmIChfdGhpcy4kZWxlbWVudC5maW5kKCc6Zm9jdXMnKS5pcyhfdGhpcy5mb2N1c2FibGVFbGVtZW50cy5lcSgwKSkgfHwgX3RoaXMuJGVsZW1lbnQuaXMoJzpmb2N1cycpKSB7IC8vIGxlZnQgbW9kYWwgdXB3YXJkcywgc2V0dGluZyBmb2N1cyB0byBsYXN0IGVsZW1lbnRcclxuICAgICAgICAgICAgX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMuZXEoLTEpLmZvY3VzKCk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChfdGhpcy5mb2N1c2FibGVFbGVtZW50cy5sZW5ndGggPT09IDApIHsgLy8gbm8gZm9jdXNhYmxlIGVsZW1lbnRzIGluc2lkZSB0aGUgbW9kYWwgYXQgYWxsLCBwcmV2ZW50IHRhYmJpbmcgaW4gZ2VuZXJhbFxyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvcGVuOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmIChfdGhpcy4kZWxlbWVudC5maW5kKCc6Zm9jdXMnKS5pcyhfdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1jbG9zZV0nKSkpIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gc2V0IGZvY3VzIGJhY2sgdG8gYW5jaG9yIGlmIGNsb3NlIGJ1dHRvbiBoYXMgYmVlbiBhY3RpdmF0ZWRcclxuICAgICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmZvY3VzKCk7XHJcbiAgICAgICAgICAgIH0sIDEpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICgkdGFyZ2V0LmlzKF90aGlzLmZvY3VzYWJsZUVsZW1lbnRzKSkgeyAvLyBkb250J3QgdHJpZ2dlciBpZiBhY3VhbCBlbGVtZW50IGhhcyBmb2N1cyAoaS5lLiBpbnB1dHMsIGxpbmtzLCAuLi4pXHJcbiAgICAgICAgICAgIF90aGlzLm9wZW4oKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLmNsb3NlT25Fc2MpIHtcclxuICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcclxuICAgICAgICAgICAgX3RoaXMuJGFuY2hvci5mb2N1cygpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsb3NlcyB0aGUgbW9kYWwuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQGZpcmVzIFJldmVhbCNjbG9zZWRcclxuICAgKi9cclxuICBjbG9zZSgpIHtcclxuICAgIGlmICghdGhpcy5pc0FjdGl2ZSB8fCAhdGhpcy4kZWxlbWVudC5pcygnOnZpc2libGUnKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgIC8vIE1vdGlvbiBVSSBtZXRob2Qgb2YgaGlkaW5nXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmFuaW1hdGlvbk91dCkge1xyXG4gICAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkpIHtcclxuICAgICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlT3V0KHRoaXMuJG92ZXJsYXksICdmYWRlLW91dCcsIGZpbmlzaFVwKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBmaW5pc2hVcCgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlT3V0KHRoaXMuJGVsZW1lbnQsIHRoaXMub3B0aW9ucy5hbmltYXRpb25PdXQpO1xyXG4gICAgfVxyXG4gICAgLy8galF1ZXJ5IG1ldGhvZCBvZiBoaWRpbmdcclxuICAgIGVsc2Uge1xyXG4gICAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkpIHtcclxuICAgICAgICB0aGlzLiRvdmVybGF5LmhpZGUoMCwgZmluaXNoVXApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGZpbmlzaFVwKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuJGVsZW1lbnQuaGlkZSh0aGlzLm9wdGlvbnMuaGlkZURlbGF5KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDb25kaXRpb25hbHMgdG8gcmVtb3ZlIGV4dHJhIGV2ZW50IGxpc3RlbmVycyBhZGRlZCBvbiBvcGVuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25Fc2MpIHtcclxuICAgICAgJCh3aW5kb3cpLm9mZigna2V5ZG93bi56Zi5yZXZlYWwnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5vdmVybGF5ICYmIHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spIHtcclxuICAgICAgJCgnYm9keScpLm9mZignY2xpY2suemYucmV2ZWFsJyk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJ2tleWRvd24uemYucmV2ZWFsJyk7XHJcblxyXG4gICAgZnVuY3Rpb24gZmluaXNoVXAoKSB7XHJcbiAgICAgIGlmIChfdGhpcy5pc2lPUykge1xyXG4gICAgICAgICQoJ2h0bWwsIGJvZHknKS5yZW1vdmVDbGFzcygnaXMtcmV2ZWFsLW9wZW4nKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAkKCdib2R5JykucmVtb3ZlQ2xhc3MoJ2lzLXJldmVhbC1vcGVuJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgICQoJ2JvZHknKS5hdHRyKHtcclxuICAgICAgICAnYXJpYS1oaWRkZW4nOiBmYWxzZSxcclxuICAgICAgICAndGFiaW5kZXgnOiAnJ1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIF90aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgdHJ1ZSk7XHJcblxyXG4gICAgICAvKipcclxuICAgICAgKiBGaXJlcyB3aGVuIHRoZSBtb2RhbCBpcyBkb25lIGNsb3NpbmcuXHJcbiAgICAgICogQGV2ZW50IFJldmVhbCNjbG9zZWRcclxuICAgICAgKi9cclxuICAgICAgX3RoaXMuJGVsZW1lbnQudHJpZ2dlcignY2xvc2VkLnpmLnJldmVhbCcpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgKiBSZXNldHMgdGhlIG1vZGFsIGNvbnRlbnRcclxuICAgICogVGhpcyBwcmV2ZW50cyBhIHJ1bm5pbmcgdmlkZW8gdG8ga2VlcCBnb2luZyBpbiB0aGUgYmFja2dyb3VuZFxyXG4gICAgKi9cclxuICAgIGlmICh0aGlzLm9wdGlvbnMucmVzZXRPbkNsb3NlKSB7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQuaHRtbCh0aGlzLiRlbGVtZW50Lmh0bWwoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5pc0FjdGl2ZSA9IGZhbHNlO1xyXG4gICAgIGlmIChfdGhpcy5vcHRpb25zLmRlZXBMaW5rKSB7XHJcbiAgICAgICBpZiAod2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlKSB7XHJcbiAgICAgICAgIHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZShcIlwiLCBkb2N1bWVudC50aXRsZSwgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKTtcclxuICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gJyc7XHJcbiAgICAgICB9XHJcbiAgICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVG9nZ2xlcyB0aGUgb3Blbi9jbG9zZWQgc3RhdGUgb2YgYSBtb2RhbC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICB0b2dnbGUoKSB7XHJcbiAgICBpZiAodGhpcy5pc0FjdGl2ZSkge1xyXG4gICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLm9wZW4oKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiBhIG1vZGFsLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkpIHtcclxuICAgICAgdGhpcy4kZWxlbWVudC5hcHBlbmRUbygkKCdib2R5JykpOyAvLyBtb3ZlICRlbGVtZW50IG91dHNpZGUgb2YgJG92ZXJsYXkgdG8gcHJldmVudCBlcnJvciB1bnJlZ2lzdGVyUGx1Z2luKClcclxuICAgICAgdGhpcy4kb3ZlcmxheS5oaWRlKCkub2ZmKCkucmVtb3ZlKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLiRlbGVtZW50LmhpZGUoKS5vZmYoKTtcclxuICAgIHRoaXMuJGFuY2hvci5vZmYoJy56ZicpO1xyXG4gICAgJCh3aW5kb3cpLm9mZihgLnpmLnJldmVhbDoke3RoaXMuaWR9YCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH07XHJcbn1cclxuXHJcblJldmVhbC5kZWZhdWx0cyA9IHtcclxuICAvKipcclxuICAgKiBNb3Rpb24tVUkgY2xhc3MgdG8gdXNlIGZvciBhbmltYXRlZCBlbGVtZW50cy4gSWYgbm9uZSB1c2VkLCBkZWZhdWx0cyB0byBzaW1wbGUgc2hvdy9oaWRlLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnc2xpZGUtaW4tbGVmdCdcclxuICAgKi9cclxuICBhbmltYXRpb25JbjogJycsXHJcbiAgLyoqXHJcbiAgICogTW90aW9uLVVJIGNsYXNzIHRvIHVzZSBmb3IgYW5pbWF0ZWQgZWxlbWVudHMuIElmIG5vbmUgdXNlZCwgZGVmYXVsdHMgdG8gc2ltcGxlIHNob3cvaGlkZS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ3NsaWRlLW91dC1yaWdodCdcclxuICAgKi9cclxuICBhbmltYXRpb25PdXQ6ICcnLFxyXG4gIC8qKlxyXG4gICAqIFRpbWUsIGluIG1zLCB0byBkZWxheSB0aGUgb3BlbmluZyBvZiBhIG1vZGFsIGFmdGVyIGEgY2xpY2sgaWYgbm8gYW5pbWF0aW9uIHVzZWQuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDEwXHJcbiAgICovXHJcbiAgc2hvd0RlbGF5OiAwLFxyXG4gIC8qKlxyXG4gICAqIFRpbWUsIGluIG1zLCB0byBkZWxheSB0aGUgY2xvc2luZyBvZiBhIG1vZGFsIGFmdGVyIGEgY2xpY2sgaWYgbm8gYW5pbWF0aW9uIHVzZWQuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDEwXHJcbiAgICovXHJcbiAgaGlkZURlbGF5OiAwLFxyXG4gIC8qKlxyXG4gICAqIEFsbG93cyBhIGNsaWNrIG9uIHRoZSBib2R5L292ZXJsYXkgdG8gY2xvc2UgdGhlIG1vZGFsLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgICovXHJcbiAgY2xvc2VPbkNsaWNrOiB0cnVlLFxyXG4gIC8qKlxyXG4gICAqIEFsbG93cyB0aGUgbW9kYWwgdG8gY2xvc2UgaWYgdGhlIHVzZXIgcHJlc3NlcyB0aGUgYEVTQ0FQRWAga2V5LlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgICovXHJcbiAgY2xvc2VPbkVzYzogdHJ1ZSxcclxuICAvKipcclxuICAgKiBJZiB0cnVlLCBhbGxvd3MgbXVsdGlwbGUgbW9kYWxzIHRvIGJlIGRpc3BsYXllZCBhdCBvbmNlLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAqL1xyXG4gIG11bHRpcGxlT3BlbmVkOiBmYWxzZSxcclxuICAvKipcclxuICAgKiBEaXN0YW5jZSwgaW4gcGl4ZWxzLCB0aGUgbW9kYWwgc2hvdWxkIHB1c2ggZG93biBmcm9tIHRoZSB0b3Agb2YgdGhlIHNjcmVlbi5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgYXV0b1xyXG4gICAqL1xyXG4gIHZPZmZzZXQ6ICdhdXRvJyxcclxuICAvKipcclxuICAgKiBEaXN0YW5jZSwgaW4gcGl4ZWxzLCB0aGUgbW9kYWwgc2hvdWxkIHB1c2ggaW4gZnJvbSB0aGUgc2lkZSBvZiB0aGUgc2NyZWVuLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBhdXRvXHJcbiAgICovXHJcbiAgaE9mZnNldDogJ2F1dG8nLFxyXG4gIC8qKlxyXG4gICAqIEFsbG93cyB0aGUgbW9kYWwgdG8gYmUgZnVsbHNjcmVlbiwgY29tcGxldGVseSBibG9ja2luZyBvdXQgdGhlIHJlc3Qgb2YgdGhlIHZpZXcuIEpTIGNoZWNrcyBmb3IgdGhpcyBhcyB3ZWxsLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAqL1xyXG4gIGZ1bGxTY3JlZW46IGZhbHNlLFxyXG4gIC8qKlxyXG4gICAqIFBlcmNlbnRhZ2Ugb2Ygc2NyZWVuIGhlaWdodCB0aGUgbW9kYWwgc2hvdWxkIHB1c2ggdXAgZnJvbSB0aGUgYm90dG9tIG9mIHRoZSB2aWV3LlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAxMFxyXG4gICAqL1xyXG4gIGJ0bU9mZnNldFBjdDogMTAsXHJcbiAgLyoqXHJcbiAgICogQWxsb3dzIHRoZSBtb2RhbCB0byBnZW5lcmF0ZSBhbiBvdmVybGF5IGRpdiwgd2hpY2ggd2lsbCBjb3ZlciB0aGUgdmlldyB3aGVuIG1vZGFsIG9wZW5zLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgICovXHJcbiAgb3ZlcmxheTogdHJ1ZSxcclxuICAvKipcclxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIHJlbW92ZSBhbmQgcmVpbmplY3QgbWFya3VwIG9uIGNsb3NlLiBTaG91bGQgYmUgdHJ1ZSBpZiB1c2luZyB2aWRlbyBlbGVtZW50cyB3L28gdXNpbmcgcHJvdmlkZXIncyBhcGksIG90aGVyd2lzZSwgdmlkZW9zIHdpbGwgY29udGludWUgdG8gcGxheSBpbiB0aGUgYmFja2dyb3VuZC5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICByZXNldE9uQ2xvc2U6IGZhbHNlLFxyXG4gIC8qKlxyXG4gICAqIEFsbG93cyB0aGUgbW9kYWwgdG8gYWx0ZXIgdGhlIHVybCBvbiBvcGVuL2Nsb3NlLCBhbmQgYWxsb3dzIHRoZSB1c2Ugb2YgdGhlIGBiYWNrYCBidXR0b24gdG8gY2xvc2UgbW9kYWxzLiBBTFNPLCBhbGxvd3MgYSBtb2RhbCB0byBhdXRvLW1hbmlhY2FsbHkgb3BlbiBvbiBwYWdlIGxvYWQgSUYgdGhlIGhhc2ggPT09IHRoZSBtb2RhbCdzIHVzZXItc2V0IGlkLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAqL1xyXG4gIGRlZXBMaW5rOiBmYWxzZVxyXG59O1xyXG5cclxuLy8gV2luZG93IGV4cG9ydHNcclxuRm91bmRhdGlvbi5wbHVnaW4oUmV2ZWFsLCAnUmV2ZWFsJyk7XHJcblxyXG5mdW5jdGlvbiBpUGhvbmVTbmlmZigpIHtcclxuICByZXR1cm4gL2lQKGFkfGhvbmV8b2QpLipPUy8udGVzdCh3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCk7XHJcbn1cclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8qKlxyXG4gKiBTbGlkZXIgbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uc2xpZGVyXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRvdWNoXHJcbiAqL1xyXG5cclxuY2xhc3MgU2xpZGVyIHtcclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGEgZHJpbGxkb3duIG1lbnUuXHJcbiAgICogQGNsYXNzXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhbiBhY2NvcmRpb24gbWVudS5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgU2xpZGVyLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1NsaWRlcicpO1xyXG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignU2xpZGVyJywge1xyXG4gICAgICAnbHRyJzoge1xyXG4gICAgICAgICdBUlJPV19SSUdIVCc6ICdpbmNyZWFzZScsXHJcbiAgICAgICAgJ0FSUk9XX1VQJzogJ2luY3JlYXNlJyxcclxuICAgICAgICAnQVJST1dfRE9XTic6ICdkZWNyZWFzZScsXHJcbiAgICAgICAgJ0FSUk9XX0xFRlQnOiAnZGVjcmVhc2UnLFxyXG4gICAgICAgICdTSElGVF9BUlJPV19SSUdIVCc6ICdpbmNyZWFzZV9mYXN0JyxcclxuICAgICAgICAnU0hJRlRfQVJST1dfVVAnOiAnaW5jcmVhc2VfZmFzdCcsXHJcbiAgICAgICAgJ1NISUZUX0FSUk9XX0RPV04nOiAnZGVjcmVhc2VfZmFzdCcsXHJcbiAgICAgICAgJ1NISUZUX0FSUk9XX0xFRlQnOiAnZGVjcmVhc2VfZmFzdCdcclxuICAgICAgfSxcclxuICAgICAgJ3J0bCc6IHtcclxuICAgICAgICAnQVJST1dfTEVGVCc6ICdpbmNyZWFzZScsXHJcbiAgICAgICAgJ0FSUk9XX1JJR0hUJzogJ2RlY3JlYXNlJyxcclxuICAgICAgICAnU0hJRlRfQVJST1dfTEVGVCc6ICdpbmNyZWFzZV9mYXN0JyxcclxuICAgICAgICAnU0hJRlRfQVJST1dfUklHSFQnOiAnZGVjcmVhc2VfZmFzdCdcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWxpemVzIHRoZSBwbHVnaW4gYnkgcmVhZGluZy9zZXR0aW5nIGF0dHJpYnV0ZXMsIGNyZWF0aW5nIGNvbGxlY3Rpb25zIGFuZCBzZXR0aW5nIHRoZSBpbml0aWFsIHBvc2l0aW9uIG9mIHRoZSBoYW5kbGUocykuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfaW5pdCgpIHtcclxuICAgIHRoaXMuaW5wdXRzID0gdGhpcy4kZWxlbWVudC5maW5kKCdpbnB1dCcpO1xyXG4gICAgdGhpcy5oYW5kbGVzID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zbGlkZXItaGFuZGxlXScpO1xyXG5cclxuICAgIHRoaXMuJGhhbmRsZSA9IHRoaXMuaGFuZGxlcy5lcSgwKTtcclxuICAgIHRoaXMuJGlucHV0ID0gdGhpcy5pbnB1dHMubGVuZ3RoID8gdGhpcy5pbnB1dHMuZXEoMCkgOiAkKGAjJHt0aGlzLiRoYW5kbGUuYXR0cignYXJpYS1jb250cm9scycpfWApO1xyXG4gICAgdGhpcy4kZmlsbCA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtc2xpZGVyLWZpbGxdJykuY3NzKHRoaXMub3B0aW9ucy52ZXJ0aWNhbCA/ICdoZWlnaHQnIDogJ3dpZHRoJywgMCk7XHJcblxyXG4gICAgdmFyIGlzRGJsID0gZmFsc2UsXHJcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5kaXNhYmxlZCB8fCB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKHRoaXMub3B0aW9ucy5kaXNhYmxlZENsYXNzKSkge1xyXG4gICAgICB0aGlzLm9wdGlvbnMuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKHRoaXMub3B0aW9ucy5kaXNhYmxlZENsYXNzKTtcclxuICAgIH1cclxuICAgIGlmICghdGhpcy5pbnB1dHMubGVuZ3RoKSB7XHJcbiAgICAgIHRoaXMuaW5wdXRzID0gJCgpLmFkZCh0aGlzLiRpbnB1dCk7XHJcbiAgICAgIHRoaXMub3B0aW9ucy5iaW5kaW5nID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIHRoaXMuX3NldEluaXRBdHRyKDApO1xyXG4gICAgdGhpcy5fZXZlbnRzKHRoaXMuJGhhbmRsZSk7XHJcblxyXG4gICAgaWYgKHRoaXMuaGFuZGxlc1sxXSkge1xyXG4gICAgICB0aGlzLm9wdGlvbnMuZG91YmxlU2lkZWQgPSB0cnVlO1xyXG4gICAgICB0aGlzLiRoYW5kbGUyID0gdGhpcy5oYW5kbGVzLmVxKDEpO1xyXG4gICAgICB0aGlzLiRpbnB1dDIgPSB0aGlzLmlucHV0cy5sZW5ndGggPiAxID8gdGhpcy5pbnB1dHMuZXEoMSkgOiAkKGAjJHt0aGlzLiRoYW5kbGUyLmF0dHIoJ2FyaWEtY29udHJvbHMnKX1gKTtcclxuXHJcbiAgICAgIGlmICghdGhpcy5pbnB1dHNbMV0pIHtcclxuICAgICAgICB0aGlzLmlucHV0cyA9IHRoaXMuaW5wdXRzLmFkZCh0aGlzLiRpbnB1dDIpO1xyXG4gICAgICB9XHJcbiAgICAgIGlzRGJsID0gdHJ1ZTtcclxuXHJcbiAgICAgIHRoaXMuX3NldEhhbmRsZVBvcyh0aGlzLiRoYW5kbGUsIHRoaXMub3B0aW9ucy5pbml0aWFsU3RhcnQsIHRydWUsIGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICBfdGhpcy5fc2V0SGFuZGxlUG9zKF90aGlzLiRoYW5kbGUyLCBfdGhpcy5vcHRpb25zLmluaXRpYWxFbmQsIHRydWUpO1xyXG4gICAgICB9KTtcclxuICAgICAgLy8gdGhpcy4kaGFuZGxlLnRyaWdnZXJIYW5kbGVyKCdjbGljay56Zi5zbGlkZXInKTtcclxuICAgICAgdGhpcy5fc2V0SW5pdEF0dHIoMSk7XHJcbiAgICAgIHRoaXMuX2V2ZW50cyh0aGlzLiRoYW5kbGUyKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWlzRGJsKSB7XHJcbiAgICAgIHRoaXMuX3NldEhhbmRsZVBvcyh0aGlzLiRoYW5kbGUsIHRoaXMub3B0aW9ucy5pbml0aWFsU3RhcnQsIHRydWUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gb2YgdGhlIHNlbGVjdGVkIGhhbmRsZSBhbmQgZmlsbCBiYXIuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGhuZGwgLSB0aGUgc2VsZWN0ZWQgaGFuZGxlIHRvIG1vdmUuXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGxvY2F0aW9uIC0gZmxvYXRpbmcgcG9pbnQgYmV0d2VlbiB0aGUgc3RhcnQgYW5kIGVuZCB2YWx1ZXMgb2YgdGhlIHNsaWRlciBiYXIuXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBjYWxsYmFjayBmdW5jdGlvbiB0byBmaXJlIG9uIGNvbXBsZXRpb24uXHJcbiAgICogQGZpcmVzIFNsaWRlciNtb3ZlZFxyXG4gICAqIEBmaXJlcyBTbGlkZXIjY2hhbmdlZFxyXG4gICAqL1xyXG4gIF9zZXRIYW5kbGVQb3MoJGhuZGwsIGxvY2F0aW9uLCBub0ludmVydCwgY2IpIHtcclxuICAvL21pZ2h0IG5lZWQgdG8gYWx0ZXIgdGhhdCBzbGlnaHRseSBmb3IgYmFycyB0aGF0IHdpbGwgaGF2ZSBvZGQgbnVtYmVyIHNlbGVjdGlvbnMuXHJcbiAgICBsb2NhdGlvbiA9IHBhcnNlRmxvYXQobG9jYXRpb24pOy8vb24gaW5wdXQgY2hhbmdlIGV2ZW50cywgY29udmVydCBzdHJpbmcgdG8gbnVtYmVyLi4uZ3J1bWJsZS5cclxuXHJcbiAgICAvLyBwcmV2ZW50IHNsaWRlciBmcm9tIHJ1bm5pbmcgb3V0IG9mIGJvdW5kcywgaWYgdmFsdWUgZXhjZWVkcyB0aGUgbGltaXRzIHNldCB0aHJvdWdoIG9wdGlvbnMsIG92ZXJyaWRlIHRoZSB2YWx1ZSB0byBtaW4vbWF4XHJcbiAgICBpZiAobG9jYXRpb24gPCB0aGlzLm9wdGlvbnMuc3RhcnQpIHsgbG9jYXRpb24gPSB0aGlzLm9wdGlvbnMuc3RhcnQ7IH1cclxuICAgIGVsc2UgaWYgKGxvY2F0aW9uID4gdGhpcy5vcHRpb25zLmVuZCkgeyBsb2NhdGlvbiA9IHRoaXMub3B0aW9ucy5lbmQ7IH1cclxuXHJcbiAgICB2YXIgaXNEYmwgPSB0aGlzLm9wdGlvbnMuZG91YmxlU2lkZWQ7XHJcblxyXG4gICAgaWYgKGlzRGJsKSB7IC8vdGhpcyBibG9jayBpcyB0byBwcmV2ZW50IDIgaGFuZGxlcyBmcm9tIGNyb3NzaW5nIGVhY2hvdGhlci4gQ291bGQvc2hvdWxkIGJlIGltcHJvdmVkLlxyXG4gICAgICBpZiAodGhpcy5oYW5kbGVzLmluZGV4KCRobmRsKSA9PT0gMCkge1xyXG4gICAgICAgIHZhciBoMlZhbCA9IHBhcnNlRmxvYXQodGhpcy4kaGFuZGxlMi5hdHRyKCdhcmlhLXZhbHVlbm93JykpO1xyXG4gICAgICAgIGxvY2F0aW9uID0gbG9jYXRpb24gPj0gaDJWYWwgPyBoMlZhbCAtIHRoaXMub3B0aW9ucy5zdGVwIDogbG9jYXRpb247XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdmFyIGgxVmFsID0gcGFyc2VGbG9hdCh0aGlzLiRoYW5kbGUuYXR0cignYXJpYS12YWx1ZW5vdycpKTtcclxuICAgICAgICBsb2NhdGlvbiA9IGxvY2F0aW9uIDw9IGgxVmFsID8gaDFWYWwgKyB0aGlzLm9wdGlvbnMuc3RlcCA6IGxvY2F0aW9uO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy90aGlzIGlzIGZvciBzaW5nbGUtaGFuZGxlZCB2ZXJ0aWNhbCBzbGlkZXJzLCBpdCBhZGp1c3RzIHRoZSB2YWx1ZSB0byBhY2NvdW50IGZvciB0aGUgc2xpZGVyIGJlaW5nIFwidXBzaWRlLWRvd25cIlxyXG4gICAgLy9mb3IgY2xpY2sgYW5kIGRyYWcgZXZlbnRzLCBpdCdzIHdlaXJkIGR1ZSB0byB0aGUgc2NhbGUoLTEsIDEpIGNzcyBwcm9wZXJ0eVxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy52ZXJ0aWNhbCAmJiAhbm9JbnZlcnQpIHtcclxuICAgICAgbG9jYXRpb24gPSB0aGlzLm9wdGlvbnMuZW5kIC0gbG9jYXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIF90aGlzID0gdGhpcyxcclxuICAgICAgICB2ZXJ0ID0gdGhpcy5vcHRpb25zLnZlcnRpY2FsLFxyXG4gICAgICAgIGhPclcgPSB2ZXJ0ID8gJ2hlaWdodCcgOiAnd2lkdGgnLFxyXG4gICAgICAgIGxPclQgPSB2ZXJ0ID8gJ3RvcCcgOiAnbGVmdCcsXHJcbiAgICAgICAgaGFuZGxlRGltID0gJGhuZGxbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClbaE9yV10sXHJcbiAgICAgICAgZWxlbURpbSA9IHRoaXMuJGVsZW1lbnRbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClbaE9yV10sXHJcbiAgICAgICAgLy9wZXJjZW50YWdlIG9mIGJhciBtaW4vbWF4IHZhbHVlIGJhc2VkIG9uIGNsaWNrIG9yIGRyYWcgcG9pbnRcclxuICAgICAgICBwY3RPZkJhciA9IHBlcmNlbnQobG9jYXRpb24gLSB0aGlzLm9wdGlvbnMuc3RhcnQsIHRoaXMub3B0aW9ucy5lbmQgLSB0aGlzLm9wdGlvbnMuc3RhcnQpLnRvRml4ZWQoMiksXHJcbiAgICAgICAgLy9udW1iZXIgb2YgYWN0dWFsIHBpeGVscyB0byBzaGlmdCB0aGUgaGFuZGxlLCBiYXNlZCBvbiB0aGUgcGVyY2VudGFnZSBvYnRhaW5lZCBhYm92ZVxyXG4gICAgICAgIHB4VG9Nb3ZlID0gKGVsZW1EaW0gLSBoYW5kbGVEaW0pICogcGN0T2ZCYXIsXHJcbiAgICAgICAgLy9wZXJjZW50YWdlIG9mIGJhciB0byBzaGlmdCB0aGUgaGFuZGxlXHJcbiAgICAgICAgbW92ZW1lbnQgPSAocGVyY2VudChweFRvTW92ZSwgZWxlbURpbSkgKiAxMDApLnRvRml4ZWQodGhpcy5vcHRpb25zLmRlY2ltYWwpO1xyXG4gICAgICAgIC8vZml4aW5nIHRoZSBkZWNpbWFsIHZhbHVlIGZvciB0aGUgbG9jYXRpb24gbnVtYmVyLCBpcyBwYXNzZWQgdG8gb3RoZXIgbWV0aG9kcyBhcyBhIGZpeGVkIGZsb2F0aW5nLXBvaW50IHZhbHVlXHJcbiAgICAgICAgbG9jYXRpb24gPSBwYXJzZUZsb2F0KGxvY2F0aW9uLnRvRml4ZWQodGhpcy5vcHRpb25zLmRlY2ltYWwpKTtcclxuICAgICAgICAvLyBkZWNsYXJlIGVtcHR5IG9iamVjdCBmb3IgY3NzIGFkanVzdG1lbnRzLCBvbmx5IHVzZWQgd2l0aCAyIGhhbmRsZWQtc2xpZGVyc1xyXG4gICAgdmFyIGNzcyA9IHt9O1xyXG5cclxuICAgIHRoaXMuX3NldFZhbHVlcygkaG5kbCwgbG9jYXRpb24pO1xyXG5cclxuICAgIC8vIFRPRE8gdXBkYXRlIHRvIGNhbGN1bGF0ZSBiYXNlZCBvbiB2YWx1ZXMgc2V0IHRvIHJlc3BlY3RpdmUgaW5wdXRzPz9cclxuICAgIGlmIChpc0RibCkge1xyXG4gICAgICB2YXIgaXNMZWZ0SG5kbCA9IHRoaXMuaGFuZGxlcy5pbmRleCgkaG5kbCkgPT09IDAsXHJcbiAgICAgICAgICAvL2VtcHR5IHZhcmlhYmxlLCB3aWxsIGJlIHVzZWQgZm9yIG1pbi1oZWlnaHQvd2lkdGggZm9yIGZpbGwgYmFyXHJcbiAgICAgICAgICBkaW0sXHJcbiAgICAgICAgICAvL3BlcmNlbnRhZ2Ugdy9oIG9mIHRoZSBoYW5kbGUgY29tcGFyZWQgdG8gdGhlIHNsaWRlciBiYXJcclxuICAgICAgICAgIGhhbmRsZVBjdCA9ICB+fihwZXJjZW50KGhhbmRsZURpbSwgZWxlbURpbSkgKiAxMDApO1xyXG4gICAgICAvL2lmIGxlZnQgaGFuZGxlLCB0aGUgbWF0aCBpcyBzbGlnaHRseSBkaWZmZXJlbnQgdGhhbiBpZiBpdCdzIHRoZSByaWdodCBoYW5kbGUsIGFuZCB0aGUgbGVmdC90b3AgcHJvcGVydHkgbmVlZHMgdG8gYmUgY2hhbmdlZCBmb3IgdGhlIGZpbGwgYmFyXHJcbiAgICAgIGlmIChpc0xlZnRIbmRsKSB7XHJcbiAgICAgICAgLy9sZWZ0IG9yIHRvcCBwZXJjZW50YWdlIHZhbHVlIHRvIGFwcGx5IHRvIHRoZSBmaWxsIGJhci5cclxuICAgICAgICBjc3NbbE9yVF0gPSBgJHttb3ZlbWVudH0lYDtcclxuICAgICAgICAvL2NhbGN1bGF0ZSB0aGUgbmV3IG1pbi1oZWlnaHQvd2lkdGggZm9yIHRoZSBmaWxsIGJhci5cclxuICAgICAgICBkaW0gPSBwYXJzZUZsb2F0KHRoaXMuJGhhbmRsZTJbMF0uc3R5bGVbbE9yVF0pIC0gbW92ZW1lbnQgKyBoYW5kbGVQY3Q7XHJcbiAgICAgICAgLy90aGlzIGNhbGxiYWNrIGlzIG5lY2Vzc2FyeSB0byBwcmV2ZW50IGVycm9ycyBhbmQgYWxsb3cgdGhlIHByb3BlciBwbGFjZW1lbnQgYW5kIGluaXRpYWxpemF0aW9uIG9mIGEgMi1oYW5kbGVkIHNsaWRlclxyXG4gICAgICAgIC8vcGx1cywgaXQgbWVhbnMgd2UgZG9uJ3QgY2FyZSBpZiAnZGltJyBpc05hTiBvbiBpbml0LCBpdCB3b24ndCBiZSBpbiB0aGUgZnV0dXJlLlxyXG4gICAgICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHsgY2IoKTsgfS8vdGhpcyBpcyBvbmx5IG5lZWRlZCBmb3IgdGhlIGluaXRpYWxpemF0aW9uIG9mIDIgaGFuZGxlZCBzbGlkZXJzXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy9qdXN0IGNhY2hpbmcgdGhlIHZhbHVlIG9mIHRoZSBsZWZ0L2JvdHRvbSBoYW5kbGUncyBsZWZ0L3RvcCBwcm9wZXJ0eVxyXG4gICAgICAgIHZhciBoYW5kbGVQb3MgPSBwYXJzZUZsb2F0KHRoaXMuJGhhbmRsZVswXS5zdHlsZVtsT3JUXSk7XHJcbiAgICAgICAgLy9jYWxjdWxhdGUgdGhlIG5ldyBtaW4taGVpZ2h0L3dpZHRoIGZvciB0aGUgZmlsbCBiYXIuIFVzZSBpc05hTiB0byBwcmV2ZW50IGZhbHNlIHBvc2l0aXZlcyBmb3IgbnVtYmVycyA8PSAwXHJcbiAgICAgICAgLy9iYXNlZCBvbiB0aGUgcGVyY2VudGFnZSBvZiBtb3ZlbWVudCBvZiB0aGUgaGFuZGxlIGJlaW5nIG1hbmlwdWxhdGVkLCBsZXNzIHRoZSBvcHBvc2luZyBoYW5kbGUncyBsZWZ0L3RvcCBwb3NpdGlvbiwgcGx1cyB0aGUgcGVyY2VudGFnZSB3L2ggb2YgdGhlIGhhbmRsZSBpdHNlbGZcclxuICAgICAgICBkaW0gPSBtb3ZlbWVudCAtIChpc05hTihoYW5kbGVQb3MpID8gdGhpcy5vcHRpb25zLmluaXRpYWxTdGFydC8oKHRoaXMub3B0aW9ucy5lbmQtdGhpcy5vcHRpb25zLnN0YXJ0KS8xMDApIDogaGFuZGxlUG9zKSArIGhhbmRsZVBjdDtcclxuICAgICAgfVxyXG4gICAgICAvLyBhc3NpZ24gdGhlIG1pbi1oZWlnaHQvd2lkdGggdG8gb3VyIGNzcyBvYmplY3RcclxuICAgICAgY3NzW2BtaW4tJHtoT3JXfWBdID0gYCR7ZGltfSVgO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuJGVsZW1lbnQub25lKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgaGFuZGxlIGlzIGRvbmUgbW92aW5nLlxyXG4gICAgICAgICAgICAgICAgICAgICAqIEBldmVudCBTbGlkZXIjbW92ZWRcclxuICAgICAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdtb3ZlZC56Zi5zbGlkZXInLCBbJGhuZGxdKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgIC8vYmVjYXVzZSB3ZSBkb24ndCBrbm93IGV4YWN0bHkgaG93IHRoZSBoYW5kbGUgd2lsbCBiZSBtb3ZlZCwgY2hlY2sgdGhlIGFtb3VudCBvZiB0aW1lIGl0IHNob3VsZCB0YWtlIHRvIG1vdmUuXHJcbiAgICB2YXIgbW92ZVRpbWUgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ2RyYWdnaW5nJykgPyAxMDAwLzYwIDogdGhpcy5vcHRpb25zLm1vdmVUaW1lO1xyXG5cclxuICAgIEZvdW5kYXRpb24uTW92ZShtb3ZlVGltZSwgJGhuZGwsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAvL2FkanVzdGluZyB0aGUgbGVmdC90b3AgcHJvcGVydHkgb2YgdGhlIGhhbmRsZSwgYmFzZWQgb24gdGhlIHBlcmNlbnRhZ2UgY2FsY3VsYXRlZCBhYm92ZVxyXG4gICAgICAkaG5kbC5jc3MobE9yVCwgYCR7bW92ZW1lbnR9JWApO1xyXG5cclxuICAgICAgaWYgKCFfdGhpcy5vcHRpb25zLmRvdWJsZVNpZGVkKSB7XHJcbiAgICAgICAgLy9pZiBzaW5nbGUtaGFuZGxlZCwgYSBzaW1wbGUgbWV0aG9kIHRvIGV4cGFuZCB0aGUgZmlsbCBiYXJcclxuICAgICAgICBfdGhpcy4kZmlsbC5jc3MoaE9yVywgYCR7cGN0T2ZCYXIgKiAxMDB9JWApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vb3RoZXJ3aXNlLCB1c2UgdGhlIGNzcyBvYmplY3Qgd2UgY3JlYXRlZCBhYm92ZVxyXG4gICAgICAgIF90aGlzLiRmaWxsLmNzcyhjc3MpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gdGhlIHZhbHVlIGhhcyBub3QgYmVlbiBjaGFuZ2UgZm9yIGEgZ2l2ZW4gdGltZS5cclxuICAgICAqIEBldmVudCBTbGlkZXIjY2hhbmdlZFxyXG4gICAgICovICAgIFxyXG4gICAgY2xlYXJUaW1lb3V0KF90aGlzLnRpbWVvdXQpO1xyXG4gICAgX3RoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgX3RoaXMuJGVsZW1lbnQudHJpZ2dlcignY2hhbmdlZC56Zi5zbGlkZXInLCBbJGhuZGxdKTtcclxuICAgIH0sIF90aGlzLm9wdGlvbnMuY2hhbmdlZERlbGF5KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGluaXRpYWwgYXR0cmlidXRlIGZvciB0aGUgc2xpZGVyIGVsZW1lbnQuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcGFyYW0ge051bWJlcn0gaWR4IC0gaW5kZXggb2YgdGhlIGN1cnJlbnQgaGFuZGxlL2lucHV0IHRvIHVzZS5cclxuICAgKi9cclxuICBfc2V0SW5pdEF0dHIoaWR4KSB7XHJcbiAgICB2YXIgaWQgPSB0aGlzLmlucHV0cy5lcShpZHgpLmF0dHIoJ2lkJykgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnc2xpZGVyJyk7XHJcbiAgICB0aGlzLmlucHV0cy5lcShpZHgpLmF0dHIoe1xyXG4gICAgICAnaWQnOiBpZCxcclxuICAgICAgJ21heCc6IHRoaXMub3B0aW9ucy5lbmQsXHJcbiAgICAgICdtaW4nOiB0aGlzLm9wdGlvbnMuc3RhcnQsXHJcbiAgICAgICdzdGVwJzogdGhpcy5vcHRpb25zLnN0ZXBcclxuICAgIH0pO1xyXG4gICAgdGhpcy5oYW5kbGVzLmVxKGlkeCkuYXR0cih7XHJcbiAgICAgICdyb2xlJzogJ3NsaWRlcicsXHJcbiAgICAgICdhcmlhLWNvbnRyb2xzJzogaWQsXHJcbiAgICAgICdhcmlhLXZhbHVlbWF4JzogdGhpcy5vcHRpb25zLmVuZCxcclxuICAgICAgJ2FyaWEtdmFsdWVtaW4nOiB0aGlzLm9wdGlvbnMuc3RhcnQsXHJcbiAgICAgICdhcmlhLXZhbHVlbm93JzogaWR4ID09PSAwID8gdGhpcy5vcHRpb25zLmluaXRpYWxTdGFydCA6IHRoaXMub3B0aW9ucy5pbml0aWFsRW5kLFxyXG4gICAgICAnYXJpYS1vcmllbnRhdGlvbic6IHRoaXMub3B0aW9ucy52ZXJ0aWNhbCA/ICd2ZXJ0aWNhbCcgOiAnaG9yaXpvbnRhbCcsXHJcbiAgICAgICd0YWJpbmRleCc6IDBcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgaW5wdXQgYW5kIGBhcmlhLXZhbHVlbm93YCB2YWx1ZXMgZm9yIHRoZSBzbGlkZXIgZWxlbWVudC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkaGFuZGxlIC0gdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBoYW5kbGUuXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHZhbCAtIGZsb2F0aW5nIHBvaW50IG9mIHRoZSBuZXcgdmFsdWUuXHJcbiAgICovXHJcbiAgX3NldFZhbHVlcygkaGFuZGxlLCB2YWwpIHtcclxuICAgIHZhciBpZHggPSB0aGlzLm9wdGlvbnMuZG91YmxlU2lkZWQgPyB0aGlzLmhhbmRsZXMuaW5kZXgoJGhhbmRsZSkgOiAwO1xyXG4gICAgdGhpcy5pbnB1dHMuZXEoaWR4KS52YWwodmFsKTtcclxuICAgICRoYW5kbGUuYXR0cignYXJpYS12YWx1ZW5vdycsIHZhbCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGVzIGV2ZW50cyBvbiB0aGUgc2xpZGVyIGVsZW1lbnQuXHJcbiAgICogQ2FsY3VsYXRlcyB0aGUgbmV3IGxvY2F0aW9uIG9mIHRoZSBjdXJyZW50IGhhbmRsZS5cclxuICAgKiBJZiB0aGVyZSBhcmUgdHdvIGhhbmRsZXMgYW5kIHRoZSBiYXIgd2FzIGNsaWNrZWQsIGl0IGRldGVybWluZXMgd2hpY2ggaGFuZGxlIHRvIG1vdmUuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcGFyYW0ge09iamVjdH0gZSAtIHRoZSBgZXZlbnRgIG9iamVjdCBwYXNzZWQgZnJvbSB0aGUgbGlzdGVuZXIuXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRoYW5kbGUgLSB0aGUgY3VycmVudCBoYW5kbGUgdG8gY2FsY3VsYXRlIGZvciwgaWYgc2VsZWN0ZWQuXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHZhbCAtIGZsb2F0aW5nIHBvaW50IG51bWJlciBmb3IgdGhlIG5ldyB2YWx1ZSBvZiB0aGUgc2xpZGVyLlxyXG4gICAqIFRPRE8gY2xlYW4gdGhpcyB1cCwgdGhlcmUncyBhIGxvdCBvZiByZXBlYXRlZCBjb2RlIGJldHdlZW4gdGhpcyBhbmQgdGhlIF9zZXRIYW5kbGVQb3MgZm4uXHJcbiAgICovXHJcbiAgX2hhbmRsZUV2ZW50KGUsICRoYW5kbGUsIHZhbCkge1xyXG4gICAgdmFyIHZhbHVlLCBoYXNWYWw7XHJcbiAgICBpZiAoIXZhbCkgey8vY2xpY2sgb3IgZHJhZyBldmVudHNcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICB2YXIgX3RoaXMgPSB0aGlzLFxyXG4gICAgICAgICAgdmVydGljYWwgPSB0aGlzLm9wdGlvbnMudmVydGljYWwsXHJcbiAgICAgICAgICBwYXJhbSA9IHZlcnRpY2FsID8gJ2hlaWdodCcgOiAnd2lkdGgnLFxyXG4gICAgICAgICAgZGlyZWN0aW9uID0gdmVydGljYWwgPyAndG9wJyA6ICdsZWZ0JyxcclxuICAgICAgICAgIHBhZ2VYWSA9IHZlcnRpY2FsID8gZS5wYWdlWSA6IGUucGFnZVgsXHJcbiAgICAgICAgICBoYWxmT2ZIYW5kbGUgPSB0aGlzLiRoYW5kbGVbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClbcGFyYW1dIC8gMixcclxuICAgICAgICAgIGJhckRpbSA9IHRoaXMuJGVsZW1lbnRbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClbcGFyYW1dLFxyXG4gICAgICAgICAgYmFyT2Zmc2V0ID0gKHRoaXMuJGVsZW1lbnQub2Zmc2V0KClbZGlyZWN0aW9uXSAtICBwYWdlWFkpLFxyXG4gICAgICAgICAgLy9pZiB0aGUgY3Vyc29yIHBvc2l0aW9uIGlzIGxlc3MgdGhhbiBvciBncmVhdGVyIHRoYW4gdGhlIGVsZW1lbnRzIGJvdW5kaW5nIGNvb3JkaW5hdGVzLCBzZXQgY29vcmRpbmF0ZXMgd2l0aGluIHRob3NlIGJvdW5kc1xyXG4gICAgICAgICAgYmFyWFkgPSBiYXJPZmZzZXQgPiAwID8gLWhhbGZPZkhhbmRsZSA6IChiYXJPZmZzZXQgLSBoYWxmT2ZIYW5kbGUpIDwgLWJhckRpbSA/IGJhckRpbSA6IE1hdGguYWJzKGJhck9mZnNldCksXHJcbiAgICAgICAgICBvZmZzZXRQY3QgPSBwZXJjZW50KGJhclhZLCBiYXJEaW0pO1xyXG4gICAgICB2YWx1ZSA9ICh0aGlzLm9wdGlvbnMuZW5kIC0gdGhpcy5vcHRpb25zLnN0YXJ0KSAqIG9mZnNldFBjdCArIHRoaXMub3B0aW9ucy5zdGFydDtcclxuXHJcbiAgICAgIC8vIHR1cm4gZXZlcnl0aGluZyBhcm91bmQgZm9yIFJUTCwgeWF5IG1hdGghXHJcbiAgICAgIGlmIChGb3VuZGF0aW9uLnJ0bCgpICYmICF0aGlzLm9wdGlvbnMudmVydGljYWwpIHt2YWx1ZSA9IHRoaXMub3B0aW9ucy5lbmQgLSB2YWx1ZTt9XHJcblxyXG4gICAgICB2YWx1ZSA9IF90aGlzLl9hZGp1c3RWYWx1ZShudWxsLCB2YWx1ZSk7XHJcbiAgICAgIC8vYm9vbGVhbiBmbGFnIGZvciB0aGUgc2V0SGFuZGxlUG9zIGZuLCBzcGVjaWZpY2FsbHkgZm9yIHZlcnRpY2FsIHNsaWRlcnNcclxuICAgICAgaGFzVmFsID0gZmFsc2U7XHJcblxyXG4gICAgICBpZiAoISRoYW5kbGUpIHsvL2ZpZ3VyZSBvdXQgd2hpY2ggaGFuZGxlIGl0IGlzLCBwYXNzIGl0IHRvIHRoZSBuZXh0IGZ1bmN0aW9uLlxyXG4gICAgICAgIHZhciBmaXJzdEhuZGxQb3MgPSBhYnNQb3NpdGlvbih0aGlzLiRoYW5kbGUsIGRpcmVjdGlvbiwgYmFyWFksIHBhcmFtKSxcclxuICAgICAgICAgICAgc2VjbmRIbmRsUG9zID0gYWJzUG9zaXRpb24odGhpcy4kaGFuZGxlMiwgZGlyZWN0aW9uLCBiYXJYWSwgcGFyYW0pO1xyXG4gICAgICAgICAgICAkaGFuZGxlID0gZmlyc3RIbmRsUG9zIDw9IHNlY25kSG5kbFBvcyA/IHRoaXMuJGhhbmRsZSA6IHRoaXMuJGhhbmRsZTI7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9IGVsc2Ugey8vY2hhbmdlIGV2ZW50IG9uIGlucHV0XHJcbiAgICAgIHZhbHVlID0gdGhpcy5fYWRqdXN0VmFsdWUobnVsbCwgdmFsKTtcclxuICAgICAgaGFzVmFsID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9zZXRIYW5kbGVQb3MoJGhhbmRsZSwgdmFsdWUsIGhhc1ZhbCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGp1c3RlcyB2YWx1ZSBmb3IgaGFuZGxlIGluIHJlZ2FyZCB0byBzdGVwIHZhbHVlLiByZXR1cm5zIGFkanVzdGVkIHZhbHVlXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGhhbmRsZSAtIHRoZSBzZWxlY3RlZCBoYW5kbGUuXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIC0gdmFsdWUgdG8gYWRqdXN0LiB1c2VkIGlmICRoYW5kbGUgaXMgZmFsc3lcclxuICAgKi9cclxuICBfYWRqdXN0VmFsdWUoJGhhbmRsZSwgdmFsdWUpIHtcclxuICAgIHZhciB2YWwsXHJcbiAgICAgIHN0ZXAgPSB0aGlzLm9wdGlvbnMuc3RlcCxcclxuICAgICAgZGl2ID0gcGFyc2VGbG9hdChzdGVwLzIpLFxyXG4gICAgICBsZWZ0LCBwcmV2X3ZhbCwgbmV4dF92YWw7XHJcbiAgICBpZiAoISEkaGFuZGxlKSB7XHJcbiAgICAgIHZhbCA9IHBhcnNlRmxvYXQoJGhhbmRsZS5hdHRyKCdhcmlhLXZhbHVlbm93JykpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHZhbCA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgbGVmdCA9IHZhbCAlIHN0ZXA7XHJcbiAgICBwcmV2X3ZhbCA9IHZhbCAtIGxlZnQ7XHJcbiAgICBuZXh0X3ZhbCA9IHByZXZfdmFsICsgc3RlcDtcclxuICAgIGlmIChsZWZ0ID09PSAwKSB7XHJcbiAgICAgIHJldHVybiB2YWw7XHJcbiAgICB9XHJcbiAgICB2YWwgPSB2YWwgPj0gcHJldl92YWwgKyBkaXYgPyBuZXh0X3ZhbCA6IHByZXZfdmFsO1xyXG4gICAgcmV0dXJuIHZhbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIHRoZSBzbGlkZXIgZWxlbWVudHMuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGhhbmRsZSAtIHRoZSBjdXJyZW50IGhhbmRsZSB0byBhcHBseSBsaXN0ZW5lcnMgdG8uXHJcbiAgICovXHJcbiAgX2V2ZW50cygkaGFuZGxlKSB7XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmRpc2FibGVkKSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAgIHZhciBfdGhpcyA9IHRoaXMsXHJcbiAgICAgICAgY3VySGFuZGxlLFxyXG4gICAgICAgIHRpbWVyO1xyXG5cclxuICAgICAgdGhpcy5pbnB1dHMub2ZmKCdjaGFuZ2UuemYuc2xpZGVyJykub24oJ2NoYW5nZS56Zi5zbGlkZXInLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IF90aGlzLmlucHV0cy5pbmRleCgkKHRoaXMpKTtcclxuICAgICAgICBfdGhpcy5faGFuZGxlRXZlbnQoZSwgX3RoaXMuaGFuZGxlcy5lcShpZHgpLCAkKHRoaXMpLnZhbCgpKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpZiAodGhpcy5vcHRpb25zLmNsaWNrU2VsZWN0KSB7XHJcbiAgICAgICAgdGhpcy4kZWxlbWVudC5vZmYoJ2NsaWNrLnpmLnNsaWRlcicpLm9uKCdjbGljay56Zi5zbGlkZXInLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICBpZiAoX3RoaXMuJGVsZW1lbnQuZGF0YSgnZHJhZ2dpbmcnKSkgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgICAgICAgICBpZiAoISQoZS50YXJnZXQpLmlzKCdbZGF0YS1zbGlkZXItaGFuZGxlXScpKSB7XHJcbiAgICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLmRvdWJsZVNpZGVkKSB7XHJcbiAgICAgICAgICAgICAgX3RoaXMuX2hhbmRsZUV2ZW50KGUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIF90aGlzLl9oYW5kbGVFdmVudChlLCBfdGhpcy4kaGFuZGxlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5kcmFnZ2FibGUpIHtcclxuICAgICAgdGhpcy5oYW5kbGVzLmFkZFRvdWNoKCk7XHJcblxyXG4gICAgICB2YXIgJGJvZHkgPSAkKCdib2R5Jyk7XHJcbiAgICAgICRoYW5kbGVcclxuICAgICAgICAub2ZmKCdtb3VzZWRvd24uemYuc2xpZGVyJylcclxuICAgICAgICAub24oJ21vdXNlZG93bi56Zi5zbGlkZXInLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAkaGFuZGxlLmFkZENsYXNzKCdpcy1kcmFnZ2luZycpO1xyXG4gICAgICAgICAgX3RoaXMuJGZpbGwuYWRkQ2xhc3MoJ2lzLWRyYWdnaW5nJyk7Ly9cclxuICAgICAgICAgIF90aGlzLiRlbGVtZW50LmRhdGEoJ2RyYWdnaW5nJywgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgY3VySGFuZGxlID0gJChlLmN1cnJlbnRUYXJnZXQpO1xyXG5cclxuICAgICAgICAgICRib2R5Lm9uKCdtb3VzZW1vdmUuemYuc2xpZGVyJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgICAgICBfdGhpcy5faGFuZGxlRXZlbnQoZSwgY3VySGFuZGxlKTtcclxuXHJcbiAgICAgICAgICB9KS5vbignbW91c2V1cC56Zi5zbGlkZXInLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIF90aGlzLl9oYW5kbGVFdmVudChlLCBjdXJIYW5kbGUpO1xyXG5cclxuICAgICAgICAgICAgJGhhbmRsZS5yZW1vdmVDbGFzcygnaXMtZHJhZ2dpbmcnKTtcclxuICAgICAgICAgICAgX3RoaXMuJGZpbGwucmVtb3ZlQ2xhc3MoJ2lzLWRyYWdnaW5nJyk7XHJcbiAgICAgICAgICAgIF90aGlzLiRlbGVtZW50LmRhdGEoJ2RyYWdnaW5nJywgZmFsc2UpO1xyXG5cclxuICAgICAgICAgICAgJGJvZHkub2ZmKCdtb3VzZW1vdmUuemYuc2xpZGVyIG1vdXNldXAuemYuc2xpZGVyJyk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgJGhhbmRsZS5vZmYoJ2tleWRvd24uemYuc2xpZGVyJykub24oJ2tleWRvd24uemYuc2xpZGVyJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICB2YXIgXyRoYW5kbGUgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgaWR4ID0gX3RoaXMub3B0aW9ucy5kb3VibGVTaWRlZCA/IF90aGlzLmhhbmRsZXMuaW5kZXgoXyRoYW5kbGUpIDogMCxcclxuICAgICAgICAgIG9sZFZhbHVlID0gcGFyc2VGbG9hdChfdGhpcy5pbnB1dHMuZXEoaWR4KS52YWwoKSksXHJcbiAgICAgICAgICBuZXdWYWx1ZTtcclxuXHJcbiAgICAgIC8vIGhhbmRsZSBrZXlib2FyZCBldmVudCB3aXRoIGtleWJvYXJkIHV0aWxcclxuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ1NsaWRlcicsIHtcclxuICAgICAgICBkZWNyZWFzZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBuZXdWYWx1ZSA9IG9sZFZhbHVlIC0gX3RoaXMub3B0aW9ucy5zdGVwO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaW5jcmVhc2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgbmV3VmFsdWUgPSBvbGRWYWx1ZSArIF90aGlzLm9wdGlvbnMuc3RlcDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGRlY3JlYXNlX2Zhc3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgbmV3VmFsdWUgPSBvbGRWYWx1ZSAtIF90aGlzLm9wdGlvbnMuc3RlcCAqIDEwO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaW5jcmVhc2VfZmFzdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBuZXdWYWx1ZSA9IG9sZFZhbHVlICsgX3RoaXMub3B0aW9ucy5zdGVwICogMTA7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBoYW5kbGVkOiBmdW5jdGlvbigpIHsgLy8gb25seSBzZXQgaGFuZGxlIHBvcyB3aGVuIGV2ZW50IHdhcyBoYW5kbGVkIHNwZWNpYWxseVxyXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgX3RoaXMuX3NldEhhbmRsZVBvcyhfJGhhbmRsZSwgbmV3VmFsdWUsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIC8qaWYgKG5ld1ZhbHVlKSB7IC8vIGlmIHByZXNzZWQga2V5IGhhcyBzcGVjaWFsIGZ1bmN0aW9uLCB1cGRhdGUgdmFsdWVcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgX3RoaXMuX3NldEhhbmRsZVBvcyhfJGhhbmRsZSwgbmV3VmFsdWUpO1xyXG4gICAgICB9Ki9cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgdGhlIHNsaWRlciBwbHVnaW4uXHJcbiAgICovXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuaGFuZGxlcy5vZmYoJy56Zi5zbGlkZXInKTtcclxuICAgIHRoaXMuaW5wdXRzLm9mZignLnpmLnNsaWRlcicpO1xyXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi5zbGlkZXInKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfVxyXG59XHJcblxyXG5TbGlkZXIuZGVmYXVsdHMgPSB7XHJcbiAgLyoqXHJcbiAgICogTWluaW11bSB2YWx1ZSBmb3IgdGhlIHNsaWRlciBzY2FsZS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgMFxyXG4gICAqL1xyXG4gIHN0YXJ0OiAwLFxyXG4gIC8qKlxyXG4gICAqIE1heGltdW0gdmFsdWUgZm9yIHRoZSBzbGlkZXIgc2NhbGUuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDEwMFxyXG4gICAqL1xyXG4gIGVuZDogMTAwLFxyXG4gIC8qKlxyXG4gICAqIE1pbmltdW0gdmFsdWUgY2hhbmdlIHBlciBjaGFuZ2UgZXZlbnQuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDFcclxuICAgKi9cclxuICBzdGVwOiAxLFxyXG4gIC8qKlxyXG4gICAqIFZhbHVlIGF0IHdoaWNoIHRoZSBoYW5kbGUvaW5wdXQgKihsZWZ0IGhhbmRsZS9maXJzdCBpbnB1dCkqIHNob3VsZCBiZSBzZXQgdG8gb24gaW5pdGlhbGl6YXRpb24uXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDBcclxuICAgKi9cclxuICBpbml0aWFsU3RhcnQ6IDAsXHJcbiAgLyoqXHJcbiAgICogVmFsdWUgYXQgd2hpY2ggdGhlIHJpZ2h0IGhhbmRsZS9zZWNvbmQgaW5wdXQgc2hvdWxkIGJlIHNldCB0byBvbiBpbml0aWFsaXphdGlvbi5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgMTAwXHJcbiAgICovXHJcbiAgaW5pdGlhbEVuZDogMTAwLFxyXG4gIC8qKlxyXG4gICAqIEFsbG93cyB0aGUgaW5wdXQgdG8gYmUgbG9jYXRlZCBvdXRzaWRlIHRoZSBjb250YWluZXIgYW5kIHZpc2libGUuIFNldCB0byBieSB0aGUgSlNcclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBiaW5kaW5nOiBmYWxzZSxcclxuICAvKipcclxuICAgKiBBbGxvd3MgdGhlIHVzZXIgdG8gY2xpY2svdGFwIG9uIHRoZSBzbGlkZXIgYmFyIHRvIHNlbGVjdCBhIHZhbHVlLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgICovXHJcbiAgY2xpY2tTZWxlY3Q6IHRydWUsXHJcbiAgLyoqXHJcbiAgICogU2V0IHRvIHRydWUgYW5kIHVzZSB0aGUgYHZlcnRpY2FsYCBjbGFzcyB0byBjaGFuZ2UgYWxpZ25tZW50IHRvIHZlcnRpY2FsLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAqL1xyXG4gIHZlcnRpY2FsOiBmYWxzZSxcclxuICAvKipcclxuICAgKiBBbGxvd3MgdGhlIHVzZXIgdG8gZHJhZyB0aGUgc2xpZGVyIGhhbmRsZShzKSB0byBzZWxlY3QgYSB2YWx1ZS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAqL1xyXG4gIGRyYWdnYWJsZTogdHJ1ZSxcclxuICAvKipcclxuICAgKiBEaXNhYmxlcyB0aGUgc2xpZGVyIGFuZCBwcmV2ZW50cyBldmVudCBsaXN0ZW5lcnMgZnJvbSBiZWluZyBhcHBsaWVkLiBEb3VibGUgY2hlY2tlZCBieSBKUyB3aXRoIGBkaXNhYmxlZENsYXNzYC5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBkaXNhYmxlZDogZmFsc2UsXHJcbiAgLyoqXHJcbiAgICogQWxsb3dzIHRoZSB1c2Ugb2YgdHdvIGhhbmRsZXMuIERvdWJsZSBjaGVja2VkIGJ5IHRoZSBKUy4gQ2hhbmdlcyBzb21lIGxvZ2ljIGhhbmRsaW5nLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAqL1xyXG4gIGRvdWJsZVNpZGVkOiBmYWxzZSxcclxuICAvKipcclxuICAgKiBQb3RlbnRpYWwgZnV0dXJlIGZlYXR1cmUuXHJcbiAgICovXHJcbiAgLy8gc3RlcHM6IDEwMCxcclxuICAvKipcclxuICAgKiBOdW1iZXIgb2YgZGVjaW1hbCBwbGFjZXMgdGhlIHBsdWdpbiBzaG91bGQgZ28gdG8gZm9yIGZsb2F0aW5nIHBvaW50IHByZWNpc2lvbi5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgMlxyXG4gICAqL1xyXG4gIGRlY2ltYWw6IDIsXHJcbiAgLyoqXHJcbiAgICogVGltZSBkZWxheSBmb3IgZHJhZ2dlZCBlbGVtZW50cy5cclxuICAgKi9cclxuICAvLyBkcmFnRGVsYXk6IDAsXHJcbiAgLyoqXHJcbiAgICogVGltZSwgaW4gbXMsIHRvIGFuaW1hdGUgdGhlIG1vdmVtZW50IG9mIGEgc2xpZGVyIGhhbmRsZSBpZiB1c2VyIGNsaWNrcy90YXBzIG9uIHRoZSBiYXIuIE5lZWRzIHRvIGJlIG1hbnVhbGx5IHNldCBpZiB1cGRhdGluZyB0aGUgdHJhbnNpdGlvbiB0aW1lIGluIHRoZSBTYXNzIHNldHRpbmdzLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAyMDBcclxuICAgKi9cclxuICBtb3ZlVGltZTogMjAwLC8vdXBkYXRlIHRoaXMgaWYgY2hhbmdpbmcgdGhlIHRyYW5zaXRpb24gdGltZSBpbiB0aGUgc2Fzc1xyXG4gIC8qKlxyXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gZGlzYWJsZWQgc2xpZGVycy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ2Rpc2FibGVkJ1xyXG4gICAqL1xyXG4gIGRpc2FibGVkQ2xhc3M6ICdkaXNhYmxlZCcsXHJcbiAgLyoqXHJcbiAgICogV2lsbCBpbnZlcnQgdGhlIGRlZmF1bHQgbGF5b3V0IGZvciBhIHZlcnRpY2FsPHNwYW4gZGF0YS10b29sdGlwIHRpdGxlPVwid2hvIHdvdWxkIGRvIHRoaXM/Pz9cIj4gPC9zcGFuPnNsaWRlci5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBpbnZlcnRWZXJ0aWNhbDogZmFsc2UsXHJcbiAgLyoqXHJcbiAgICogTWlsbGlzZWNvbmRzIGJlZm9yZSB0aGUgYGNoYW5nZWQuemYtc2xpZGVyYCBldmVudCBpcyB0cmlnZ2VyZWQgYWZ0ZXIgdmFsdWUgY2hhbmdlLiBcclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgNTAwXHJcbiAgICovXHJcbiAgY2hhbmdlZERlbGF5OiA1MDBcclxufTtcclxuXHJcbmZ1bmN0aW9uIHBlcmNlbnQoZnJhYywgbnVtKSB7XHJcbiAgcmV0dXJuIChmcmFjIC8gbnVtKTtcclxufVxyXG5mdW5jdGlvbiBhYnNQb3NpdGlvbigkaGFuZGxlLCBkaXIsIGNsaWNrUG9zLCBwYXJhbSkge1xyXG4gIHJldHVybiBNYXRoLmFicygoJGhhbmRsZS5wb3NpdGlvbigpW2Rpcl0gKyAoJGhhbmRsZVtwYXJhbV0oKSAvIDIpKSAtIGNsaWNrUG9zKTtcclxufVxyXG5cclxuLy8gV2luZG93IGV4cG9ydHNcclxuRm91bmRhdGlvbi5wbHVnaW4oU2xpZGVyLCAnU2xpZGVyJyk7XHJcblxyXG59KGpRdWVyeSk7XHJcblxyXG4vLyoqKioqKioqKnRoaXMgaXMgaW4gY2FzZSB3ZSBnbyB0byBzdGF0aWMsIGFic29sdXRlIHBvc2l0aW9ucyBpbnN0ZWFkIG9mIGR5bmFtaWMgcG9zaXRpb25pbmcqKioqKioqKlxyXG4vLyB0aGlzLnNldFN0ZXBzKGZ1bmN0aW9uKCkge1xyXG4vLyAgIF90aGlzLl9ldmVudHMoKTtcclxuLy8gICB2YXIgaW5pdFN0YXJ0ID0gX3RoaXMub3B0aW9ucy5wb3NpdGlvbnNbX3RoaXMub3B0aW9ucy5pbml0aWFsU3RhcnQgLSAxXSB8fCBudWxsO1xyXG4vLyAgIHZhciBpbml0RW5kID0gX3RoaXMub3B0aW9ucy5pbml0aWFsRW5kID8gX3RoaXMub3B0aW9ucy5wb3NpdGlvbltfdGhpcy5vcHRpb25zLmluaXRpYWxFbmQgLSAxXSA6IG51bGw7XHJcbi8vICAgaWYgKGluaXRTdGFydCB8fCBpbml0RW5kKSB7XHJcbi8vICAgICBfdGhpcy5faGFuZGxlRXZlbnQoaW5pdFN0YXJ0LCBpbml0RW5kKTtcclxuLy8gICB9XHJcbi8vIH0pO1xyXG5cclxuLy8qKioqKioqKioqKnRoZSBvdGhlciBwYXJ0IG9mIGFic29sdXRlIHBvc2l0aW9ucyoqKioqKioqKioqKipcclxuLy8gU2xpZGVyLnByb3RvdHlwZS5zZXRTdGVwcyA9IGZ1bmN0aW9uKGNiKSB7XHJcbi8vICAgdmFyIHBvc0NoYW5nZSA9IHRoaXMuJGVsZW1lbnQub3V0ZXJXaWR0aCgpIC8gdGhpcy5vcHRpb25zLnN0ZXBzO1xyXG4vLyAgIHZhciBjb3VudGVyID0gMFxyXG4vLyAgIHdoaWxlKGNvdW50ZXIgPCB0aGlzLm9wdGlvbnMuc3RlcHMpIHtcclxuLy8gICAgIGlmIChjb3VudGVyKSB7XHJcbi8vICAgICAgIHRoaXMub3B0aW9ucy5wb3NpdGlvbnMucHVzaCh0aGlzLm9wdGlvbnMucG9zaXRpb25zW2NvdW50ZXIgLSAxXSArIHBvc0NoYW5nZSk7XHJcbi8vICAgICB9IGVsc2Uge1xyXG4vLyAgICAgICB0aGlzLm9wdGlvbnMucG9zaXRpb25zLnB1c2gocG9zQ2hhbmdlKTtcclxuLy8gICAgIH1cclxuLy8gICAgIGNvdW50ZXIrKztcclxuLy8gICB9XHJcbi8vICAgY2IoKTtcclxuLy8gfTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8qKlxyXG4gKiBTdGlja3kgbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uc3RpY2t5XHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XHJcbiAqL1xyXG5cclxuY2xhc3MgU3RpY2t5IHtcclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGEgc3RpY2t5IHRoaW5nLlxyXG4gICAqIEBjbGFzc1xyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIHN0aWNreS5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIG9wdGlvbnMgb2JqZWN0IHBhc3NlZCB3aGVuIGNyZWF0aW5nIHRoZSBlbGVtZW50IHByb2dyYW1tYXRpY2FsbHkuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgU3RpY2t5LmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1N0aWNreScpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHN0aWNreSBlbGVtZW50IGJ5IGFkZGluZyBjbGFzc2VzLCBnZXR0aW5nL3NldHRpbmcgZGltZW5zaW9ucywgYnJlYWtwb2ludHMgYW5kIGF0dHJpYnV0ZXNcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9pbml0KCkge1xyXG4gICAgdmFyICRwYXJlbnQgPSB0aGlzLiRlbGVtZW50LnBhcmVudCgnW2RhdGEtc3RpY2t5LWNvbnRhaW5lcl0nKSxcclxuICAgICAgICBpZCA9IHRoaXMuJGVsZW1lbnRbMF0uaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnc3RpY2t5JyksXHJcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgIGlmICghJHBhcmVudC5sZW5ndGgpIHtcclxuICAgICAgdGhpcy53YXNXcmFwcGVkID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRwYXJlbnQubGVuZ3RoID8gJHBhcmVudCA6ICQodGhpcy5vcHRpb25zLmNvbnRhaW5lcikud3JhcElubmVyKHRoaXMuJGVsZW1lbnQpO1xyXG4gICAgdGhpcy4kY29udGFpbmVyLmFkZENsYXNzKHRoaXMub3B0aW9ucy5jb250YWluZXJDbGFzcyk7XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuc3RpY2t5Q2xhc3MpXHJcbiAgICAgICAgICAgICAgICAgLmF0dHIoeydkYXRhLXJlc2l6ZSc6IGlkfSk7XHJcblxyXG4gICAgdGhpcy5zY3JvbGxDb3VudCA9IHRoaXMub3B0aW9ucy5jaGVja0V2ZXJ5O1xyXG4gICAgdGhpcy5pc1N0dWNrID0gZmFsc2U7XHJcbiAgICAkKHdpbmRvdykub25lKCdsb2FkLnpmLnN0aWNreScsIGZ1bmN0aW9uKCl7XHJcbiAgICAgIGlmKF90aGlzLm9wdGlvbnMuYW5jaG9yICE9PSAnJyl7XHJcbiAgICAgICAgX3RoaXMuJGFuY2hvciA9ICQoJyMnICsgX3RoaXMub3B0aW9ucy5hbmNob3IpO1xyXG4gICAgICB9ZWxzZXtcclxuICAgICAgICBfdGhpcy5fcGFyc2VQb2ludHMoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgX3RoaXMuX3NldFNpemVzKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgX3RoaXMuX2NhbGMoZmFsc2UpO1xyXG4gICAgICB9KTtcclxuICAgICAgX3RoaXMuX2V2ZW50cyhpZC5zcGxpdCgnLScpLnJldmVyc2UoKS5qb2luKCctJykpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJZiB1c2luZyBtdWx0aXBsZSBlbGVtZW50cyBhcyBhbmNob3JzLCBjYWxjdWxhdGVzIHRoZSB0b3AgYW5kIGJvdHRvbSBwaXhlbCB2YWx1ZXMgdGhlIHN0aWNreSB0aGluZyBzaG91bGQgc3RpY2sgYW5kIHVuc3RpY2sgb24uXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfcGFyc2VQb2ludHMoKSB7XHJcbiAgICB2YXIgdG9wID0gdGhpcy5vcHRpb25zLnRvcEFuY2hvcixcclxuICAgICAgICBidG0gPSB0aGlzLm9wdGlvbnMuYnRtQW5jaG9yLFxyXG4gICAgICAgIHB0cyA9IFt0b3AsIGJ0bV0sXHJcbiAgICAgICAgYnJlYWtzID0ge307XHJcbiAgICBpZiAodG9wICYmIGJ0bSkge1xyXG5cclxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHB0cy5sZW5ndGg7IGkgPCBsZW4gJiYgcHRzW2ldOyBpKyspIHtcclxuICAgICAgICB2YXIgcHQ7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBwdHNbaV0gPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICBwdCA9IHB0c1tpXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdmFyIHBsYWNlID0gcHRzW2ldLnNwbGl0KCc6JyksXHJcbiAgICAgICAgICAgICAgYW5jaG9yID0gJChgIyR7cGxhY2VbMF19YCk7XHJcblxyXG4gICAgICAgICAgcHQgPSBhbmNob3Iub2Zmc2V0KCkudG9wO1xyXG4gICAgICAgICAgaWYgKHBsYWNlWzFdICYmIHBsYWNlWzFdLnRvTG93ZXJDYXNlKCkgPT09ICdib3R0b20nKSB7XHJcbiAgICAgICAgICAgIHB0ICs9IGFuY2hvclswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrc1tpXSA9IHB0O1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBicmVha3MgPSB7MDogMSwgMTogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbEhlaWdodH07XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wb2ludHMgPSBicmVha3M7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIGZvciB0aGUgc2Nyb2xsaW5nIGVsZW1lbnQuXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgLSBwc3VlZG8tcmFuZG9tIGlkIGZvciB1bmlxdWUgc2Nyb2xsIGV2ZW50IGxpc3RlbmVyLlxyXG4gICAqL1xyXG4gIF9ldmVudHMoaWQpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXMsXHJcbiAgICAgICAgc2Nyb2xsTGlzdGVuZXIgPSB0aGlzLnNjcm9sbExpc3RlbmVyID0gYHNjcm9sbC56Zi4ke2lkfWA7XHJcbiAgICBpZiAodGhpcy5pc09uKSB7IHJldHVybjsgfVxyXG4gICAgaWYgKHRoaXMuY2FuU3RpY2spIHtcclxuICAgICAgdGhpcy5pc09uID0gdHJ1ZTtcclxuICAgICAgJCh3aW5kb3cpLm9mZihzY3JvbGxMaXN0ZW5lcilcclxuICAgICAgICAgICAgICAgLm9uKHNjcm9sbExpc3RlbmVyLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICAgaWYgKF90aGlzLnNjcm9sbENvdW50ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICBfdGhpcy5zY3JvbGxDb3VudCA9IF90aGlzLm9wdGlvbnMuY2hlY2tFdmVyeTtcclxuICAgICAgICAgICAgICAgICAgIF90aGlzLl9zZXRTaXplcyhmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAgX3RoaXMuX2NhbGMoZmFsc2UsIHdpbmRvdy5wYWdlWU9mZnNldCk7XHJcbiAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgX3RoaXMuc2Nyb2xsQ291bnQtLTtcclxuICAgICAgICAgICAgICAgICAgIF90aGlzLl9jYWxjKGZhbHNlLCB3aW5kb3cucGFnZVlPZmZzZXQpO1xyXG4gICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLiRlbGVtZW50Lm9mZigncmVzaXplbWUuemYudHJpZ2dlcicpXHJcbiAgICAgICAgICAgICAgICAgLm9uKCdyZXNpemVtZS56Zi50cmlnZ2VyJywgZnVuY3Rpb24oZSwgZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgX3RoaXMuX3NldFNpemVzKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgIF90aGlzLl9jYWxjKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICBpZiAoX3RoaXMuY2FuU3RpY2spIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghX3RoaXMuaXNPbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5fZXZlbnRzKGlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKF90aGlzLmlzT24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLl9wYXVzZUxpc3RlbmVycyhzY3JvbGxMaXN0ZW5lcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBldmVudCBoYW5kbGVycyBmb3Igc2Nyb2xsIGFuZCBjaGFuZ2UgZXZlbnRzIG9uIGFuY2hvci5cclxuICAgKiBAZmlyZXMgU3RpY2t5I3BhdXNlXHJcbiAgICogQHBhcmFtIHtTdHJpbmd9IHNjcm9sbExpc3RlbmVyIC0gdW5pcXVlLCBuYW1lc3BhY2VkIHNjcm9sbCBsaXN0ZW5lciBhdHRhY2hlZCB0byBgd2luZG93YFxyXG4gICAqL1xyXG4gIF9wYXVzZUxpc3RlbmVycyhzY3JvbGxMaXN0ZW5lcikge1xyXG4gICAgdGhpcy5pc09uID0gZmFsc2U7XHJcbiAgICAkKHdpbmRvdykub2ZmKHNjcm9sbExpc3RlbmVyKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gdGhlIHBsdWdpbiBpcyBwYXVzZWQgZHVlIHRvIHJlc2l6ZSBldmVudCBzaHJpbmtpbmcgdGhlIHZpZXcuXHJcbiAgICAgKiBAZXZlbnQgU3RpY2t5I3BhdXNlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwYXVzZS56Zi5zdGlja3knKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCBvbiBldmVyeSBgc2Nyb2xsYCBldmVudCBhbmQgb24gYF9pbml0YFxyXG4gICAqIGZpcmVzIGZ1bmN0aW9ucyBiYXNlZCBvbiBib29sZWFucyBhbmQgY2FjaGVkIHZhbHVlc1xyXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gY2hlY2tTaXplcyAtIHRydWUgaWYgcGx1Z2luIHNob3VsZCByZWNhbGN1bGF0ZSBzaXplcyBhbmQgYnJlYWtwb2ludHMuXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHNjcm9sbCAtIGN1cnJlbnQgc2Nyb2xsIHBvc2l0aW9uIHBhc3NlZCBmcm9tIHNjcm9sbCBldmVudCBjYiBmdW5jdGlvbi4gSWYgbm90IHBhc3NlZCwgZGVmYXVsdHMgdG8gYHdpbmRvdy5wYWdlWU9mZnNldGAuXHJcbiAgICovXHJcbiAgX2NhbGMoY2hlY2tTaXplcywgc2Nyb2xsKSB7XHJcbiAgICBpZiAoY2hlY2tTaXplcykgeyB0aGlzLl9zZXRTaXplcygpOyB9XHJcblxyXG4gICAgaWYgKCF0aGlzLmNhblN0aWNrKSB7XHJcbiAgICAgIGlmICh0aGlzLmlzU3R1Y2spIHtcclxuICAgICAgICB0aGlzLl9yZW1vdmVTdGlja3kodHJ1ZSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghc2Nyb2xsKSB7IHNjcm9sbCA9IHdpbmRvdy5wYWdlWU9mZnNldDsgfVxyXG5cclxuICAgIGlmIChzY3JvbGwgPj0gdGhpcy50b3BQb2ludCkge1xyXG4gICAgICBpZiAoc2Nyb2xsIDw9IHRoaXMuYm90dG9tUG9pbnQpIHtcclxuICAgICAgICBpZiAoIXRoaXMuaXNTdHVjaykge1xyXG4gICAgICAgICAgdGhpcy5fc2V0U3RpY2t5KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmICh0aGlzLmlzU3R1Y2spIHtcclxuICAgICAgICAgIHRoaXMuX3JlbW92ZVN0aWNreShmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAodGhpcy5pc1N0dWNrKSB7XHJcbiAgICAgICAgdGhpcy5fcmVtb3ZlU3RpY2t5KHRydWUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYXVzZXMgdGhlICRlbGVtZW50IHRvIGJlY29tZSBzdHVjay5cclxuICAgKiBBZGRzIGBwb3NpdGlvbjogZml4ZWQ7YCwgYW5kIGhlbHBlciBjbGFzc2VzLlxyXG4gICAqIEBmaXJlcyBTdGlja3kjc3R1Y2t0b1xyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX3NldFN0aWNreSgpIHtcclxuICAgIHZhciBzdGlja1RvID0gdGhpcy5vcHRpb25zLnN0aWNrVG8sXHJcbiAgICAgICAgbXJnbiA9IHN0aWNrVG8gPT09ICd0b3AnID8gJ21hcmdpblRvcCcgOiAnbWFyZ2luQm90dG9tJyxcclxuICAgICAgICBub3RTdHVja1RvID0gc3RpY2tUbyA9PT0gJ3RvcCcgPyAnYm90dG9tJyA6ICd0b3AnLFxyXG4gICAgICAgIGNzcyA9IHt9O1xyXG5cclxuICAgIGNzc1ttcmduXSA9IGAke3RoaXMub3B0aW9uc1ttcmduXX1lbWA7XHJcbiAgICBjc3Nbc3RpY2tUb10gPSAwO1xyXG4gICAgY3NzW25vdFN0dWNrVG9dID0gJ2F1dG8nO1xyXG4gICAgY3NzWydsZWZ0J10gPSB0aGlzLiRjb250YWluZXIub2Zmc2V0KCkubGVmdCArIHBhcnNlSW50KHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRoaXMuJGNvbnRhaW5lclswXSlbXCJwYWRkaW5nLWxlZnRcIl0sIDEwKTtcclxuICAgIHRoaXMuaXNTdHVjayA9IHRydWU7XHJcbiAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKGBpcy1hbmNob3JlZCBpcy1hdC0ke25vdFN0dWNrVG99YClcclxuICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoYGlzLXN0dWNrIGlzLWF0LSR7c3RpY2tUb31gKVxyXG4gICAgICAgICAgICAgICAgIC5jc3MoY3NzKVxyXG4gICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlICRlbGVtZW50IGhhcyBiZWNvbWUgYHBvc2l0aW9uOiBmaXhlZDtgXHJcbiAgICAgICAgICAgICAgICAgICogTmFtZXNwYWNlZCB0byBgdG9wYCBvciBgYm90dG9tYCwgZS5nLiBgc3RpY2t5LnpmLnN0dWNrdG86dG9wYFxyXG4gICAgICAgICAgICAgICAgICAqIEBldmVudCBTdGlja3kjc3R1Y2t0b1xyXG4gICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgIC50cmlnZ2VyKGBzdGlja3kuemYuc3R1Y2t0bzoke3N0aWNrVG99YCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYXVzZXMgdGhlICRlbGVtZW50IHRvIGJlY29tZSB1bnN0dWNrLlxyXG4gICAqIFJlbW92ZXMgYHBvc2l0aW9uOiBmaXhlZDtgLCBhbmQgaGVscGVyIGNsYXNzZXMuXHJcbiAgICogQWRkcyBvdGhlciBoZWxwZXIgY2xhc3Nlcy5cclxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGlzVG9wIC0gdGVsbHMgdGhlIGZ1bmN0aW9uIGlmIHRoZSAkZWxlbWVudCBzaG91bGQgYW5jaG9yIHRvIHRoZSB0b3Agb3IgYm90dG9tIG9mIGl0cyAkYW5jaG9yIGVsZW1lbnQuXHJcbiAgICogQGZpcmVzIFN0aWNreSN1bnN0dWNrZnJvbVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX3JlbW92ZVN0aWNreShpc1RvcCkge1xyXG4gICAgdmFyIHN0aWNrVG8gPSB0aGlzLm9wdGlvbnMuc3RpY2tUbyxcclxuICAgICAgICBzdGlja1RvVG9wID0gc3RpY2tUbyA9PT0gJ3RvcCcsXHJcbiAgICAgICAgY3NzID0ge30sXHJcbiAgICAgICAgYW5jaG9yUHQgPSAodGhpcy5wb2ludHMgPyB0aGlzLnBvaW50c1sxXSAtIHRoaXMucG9pbnRzWzBdIDogdGhpcy5hbmNob3JIZWlnaHQpIC0gdGhpcy5lbGVtSGVpZ2h0LFxyXG4gICAgICAgIG1yZ24gPSBzdGlja1RvVG9wID8gJ21hcmdpblRvcCcgOiAnbWFyZ2luQm90dG9tJyxcclxuICAgICAgICBub3RTdHVja1RvID0gc3RpY2tUb1RvcCA/ICdib3R0b20nIDogJ3RvcCcsXHJcbiAgICAgICAgdG9wT3JCb3R0b20gPSBpc1RvcCA/ICd0b3AnIDogJ2JvdHRvbSc7XHJcblxyXG4gICAgY3NzW21yZ25dID0gMDtcclxuXHJcbiAgICBpZiAoKGlzVG9wICYmICFzdGlja1RvVG9wKSB8fCAoc3RpY2tUb1RvcCAmJiAhaXNUb3ApKSB7XHJcbiAgICAgIGNzc1tzdGlja1RvXSA9IGFuY2hvclB0O1xyXG4gICAgICBjc3Nbbm90U3R1Y2tUb10gPSAwO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY3NzW3N0aWNrVG9dID0gMDtcclxuICAgICAgY3NzW25vdFN0dWNrVG9dID0gYW5jaG9yUHQ7XHJcbiAgICB9XHJcblxyXG4gICAgY3NzWydsZWZ0J10gPSAnJztcclxuICAgIHRoaXMuaXNTdHVjayA9IGZhbHNlO1xyXG4gICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhgaXMtc3R1Y2sgaXMtYXQtJHtzdGlja1RvfWApXHJcbiAgICAgICAgICAgICAgICAgLmFkZENsYXNzKGBpcy1hbmNob3JlZCBpcy1hdC0ke3RvcE9yQm90dG9tfWApXHJcbiAgICAgICAgICAgICAgICAgLmNzcyhjc3MpXHJcbiAgICAgICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgJGVsZW1lbnQgaGFzIGJlY29tZSBhbmNob3JlZC5cclxuICAgICAgICAgICAgICAgICAgKiBOYW1lc3BhY2VkIHRvIGB0b3BgIG9yIGBib3R0b21gLCBlLmcuIGBzdGlja3kuemYudW5zdHVja2Zyb206Ym90dG9tYFxyXG4gICAgICAgICAgICAgICAgICAqIEBldmVudCBTdGlja3kjdW5zdHVja2Zyb21cclxuICAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgICAudHJpZ2dlcihgc3RpY2t5LnpmLnVuc3R1Y2tmcm9tOiR7dG9wT3JCb3R0b219YCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSAkZWxlbWVudCBhbmQgJGNvbnRhaW5lciBzaXplcyBmb3IgcGx1Z2luLlxyXG4gICAqIENhbGxzIGBfc2V0QnJlYWtQb2ludHNgLlxyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gb3B0aW9uYWwgY2FsbGJhY2sgZnVuY3Rpb24gdG8gZmlyZSBvbiBjb21wbGV0aW9uIG9mIGBfc2V0QnJlYWtQb2ludHNgLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX3NldFNpemVzKGNiKSB7XHJcbiAgICB0aGlzLmNhblN0aWNrID0gRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QodGhpcy5vcHRpb25zLnN0aWNreU9uKTtcclxuICAgIGlmICghdGhpcy5jYW5TdGljaykgeyBjYigpOyB9XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxyXG4gICAgICAgIG5ld0VsZW1XaWR0aCA9IHRoaXMuJGNvbnRhaW5lclswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aCxcclxuICAgICAgICBjb21wID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy4kY29udGFpbmVyWzBdKSxcclxuICAgICAgICBwZG5nID0gcGFyc2VJbnQoY29tcFsncGFkZGluZy1yaWdodCddLCAxMCk7XHJcblxyXG4gICAgaWYgKHRoaXMuJGFuY2hvciAmJiB0aGlzLiRhbmNob3IubGVuZ3RoKSB7XHJcbiAgICAgIHRoaXMuYW5jaG9ySGVpZ2h0ID0gdGhpcy4kYW5jaG9yWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuX3BhcnNlUG9pbnRzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudC5jc3Moe1xyXG4gICAgICAnbWF4LXdpZHRoJzogYCR7bmV3RWxlbVdpZHRoIC0gcGRuZ31weGBcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciBuZXdDb250YWluZXJIZWlnaHQgPSB0aGlzLiRlbGVtZW50WzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCB8fCB0aGlzLmNvbnRhaW5lckhlaWdodDtcclxuICAgIHRoaXMuY29udGFpbmVySGVpZ2h0ID0gbmV3Q29udGFpbmVySGVpZ2h0O1xyXG4gICAgdGhpcy4kY29udGFpbmVyLmNzcyh7XHJcbiAgICAgIGhlaWdodDogbmV3Q29udGFpbmVySGVpZ2h0XHJcbiAgICB9KTtcclxuICAgIHRoaXMuZWxlbUhlaWdodCA9IG5ld0NvbnRhaW5lckhlaWdodDtcclxuXHJcbiAgXHRpZiAodGhpcy5pc1N0dWNrKSB7XHJcbiAgXHRcdHRoaXMuJGVsZW1lbnQuY3NzKHtcImxlZnRcIjp0aGlzLiRjb250YWluZXIub2Zmc2V0KCkubGVmdCArIHBhcnNlSW50KGNvbXBbJ3BhZGRpbmctbGVmdCddLCAxMCl9KTtcclxuICBcdH1cclxuXHJcbiAgICB0aGlzLl9zZXRCcmVha1BvaW50cyhuZXdDb250YWluZXJIZWlnaHQsIGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZiAoY2IpIHsgY2IoKTsgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB1cHBlciBhbmQgbG93ZXIgYnJlYWtwb2ludHMgZm9yIHRoZSBlbGVtZW50IHRvIGJlY29tZSBzdGlja3kvdW5zdGlja3kuXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGVsZW1IZWlnaHQgLSBweCB2YWx1ZSBmb3Igc3RpY2t5LiRlbGVtZW50IGhlaWdodCwgY2FsY3VsYXRlZCBieSBgX3NldFNpemVzYC5cclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIG9wdGlvbmFsIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiBjb21wbGV0aW9uLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX3NldEJyZWFrUG9pbnRzKGVsZW1IZWlnaHQsIGNiKSB7XHJcbiAgICBpZiAoIXRoaXMuY2FuU3RpY2spIHtcclxuICAgICAgaWYgKGNiKSB7IGNiKCk7IH1cclxuICAgICAgZWxzZSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgfVxyXG4gICAgdmFyIG1Ub3AgPSBlbUNhbGModGhpcy5vcHRpb25zLm1hcmdpblRvcCksXHJcbiAgICAgICAgbUJ0bSA9IGVtQ2FsYyh0aGlzLm9wdGlvbnMubWFyZ2luQm90dG9tKSxcclxuICAgICAgICB0b3BQb2ludCA9IHRoaXMucG9pbnRzID8gdGhpcy5wb2ludHNbMF0gOiB0aGlzLiRhbmNob3Iub2Zmc2V0KCkudG9wLFxyXG4gICAgICAgIGJvdHRvbVBvaW50ID0gdGhpcy5wb2ludHMgPyB0aGlzLnBvaW50c1sxXSA6IHRvcFBvaW50ICsgdGhpcy5hbmNob3JIZWlnaHQsXHJcbiAgICAgICAgLy8gdG9wUG9pbnQgPSB0aGlzLiRhbmNob3Iub2Zmc2V0KCkudG9wIHx8IHRoaXMucG9pbnRzWzBdLFxyXG4gICAgICAgIC8vIGJvdHRvbVBvaW50ID0gdG9wUG9pbnQgKyB0aGlzLmFuY2hvckhlaWdodCB8fCB0aGlzLnBvaW50c1sxXSxcclxuICAgICAgICB3aW5IZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5zdGlja1RvID09PSAndG9wJykge1xyXG4gICAgICB0b3BQb2ludCAtPSBtVG9wO1xyXG4gICAgICBib3R0b21Qb2ludCAtPSAoZWxlbUhlaWdodCArIG1Ub3ApO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuc3RpY2tUbyA9PT0gJ2JvdHRvbScpIHtcclxuICAgICAgdG9wUG9pbnQgLT0gKHdpbkhlaWdodCAtIChlbGVtSGVpZ2h0ICsgbUJ0bSkpO1xyXG4gICAgICBib3R0b21Qb2ludCAtPSAod2luSGVpZ2h0IC0gbUJ0bSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvL3RoaXMgd291bGQgYmUgdGhlIHN0aWNrVG86IGJvdGggb3B0aW9uLi4uIHRyaWNreVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudG9wUG9pbnQgPSB0b3BQb2ludDtcclxuICAgIHRoaXMuYm90dG9tUG9pbnQgPSBib3R0b21Qb2ludDtcclxuXHJcbiAgICBpZiAoY2IpIHsgY2IoKTsgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgdGhlIGN1cnJlbnQgc3RpY2t5IGVsZW1lbnQuXHJcbiAgICogUmVzZXRzIHRoZSBlbGVtZW50IHRvIHRoZSB0b3AgcG9zaXRpb24gZmlyc3QuXHJcbiAgICogUmVtb3ZlcyBldmVudCBsaXN0ZW5lcnMsIEpTLWFkZGVkIGNzcyBwcm9wZXJ0aWVzIGFuZCBjbGFzc2VzLCBhbmQgdW53cmFwcyB0aGUgJGVsZW1lbnQgaWYgdGhlIEpTIGFkZGVkIHRoZSAkY29udGFpbmVyLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLl9yZW1vdmVTdGlja3kodHJ1ZSk7XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhgJHt0aGlzLm9wdGlvbnMuc3RpY2t5Q2xhc3N9IGlzLWFuY2hvcmVkIGlzLWF0LXRvcGApXHJcbiAgICAgICAgICAgICAgICAgLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgdG9wOiAnJyxcclxuICAgICAgICAgICAgICAgICAgIGJvdHRvbTogJycsXHJcbiAgICAgICAgICAgICAgICAgICAnbWF4LXdpZHRoJzogJydcclxuICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgIC5vZmYoJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInKTtcclxuXHJcbiAgICB0aGlzLiRhbmNob3Iub2ZmKCdjaGFuZ2UuemYuc3RpY2t5Jyk7XHJcbiAgICAkKHdpbmRvdykub2ZmKHRoaXMuc2Nyb2xsTGlzdGVuZXIpO1xyXG5cclxuICAgIGlmICh0aGlzLndhc1dyYXBwZWQpIHtcclxuICAgICAgdGhpcy4kZWxlbWVudC51bndyYXAoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuJGNvbnRhaW5lci5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuY29udGFpbmVyQ2xhc3MpXHJcbiAgICAgICAgICAgICAgICAgICAgIC5jc3Moe1xyXG4gICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJydcclxuICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfVxyXG59XHJcblxyXG5TdGlja3kuZGVmYXVsdHMgPSB7XHJcbiAgLyoqXHJcbiAgICogQ3VzdG9taXphYmxlIGNvbnRhaW5lciB0ZW1wbGF0ZS4gQWRkIHlvdXIgb3duIGNsYXNzZXMgZm9yIHN0eWxpbmcgYW5kIHNpemluZy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJyZsdDtkaXYgZGF0YS1zdGlja3ktY29udGFpbmVyIGNsYXNzPVwic21hbGwtNiBjb2x1bW5zXCImZ3Q7Jmx0Oy9kaXYmZ3Q7J1xyXG4gICAqL1xyXG4gIGNvbnRhaW5lcjogJzxkaXYgZGF0YS1zdGlja3ktY29udGFpbmVyPjwvZGl2PicsXHJcbiAgLyoqXHJcbiAgICogTG9jYXRpb24gaW4gdGhlIHZpZXcgdGhlIGVsZW1lbnQgc3RpY2tzIHRvLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAndG9wJ1xyXG4gICAqL1xyXG4gIHN0aWNrVG86ICd0b3AnLFxyXG4gIC8qKlxyXG4gICAqIElmIGFuY2hvcmVkIHRvIGEgc2luZ2xlIGVsZW1lbnQsIHRoZSBpZCBvZiB0aGF0IGVsZW1lbnQuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICdleGFtcGxlSWQnXHJcbiAgICovXHJcbiAgYW5jaG9yOiAnJyxcclxuICAvKipcclxuICAgKiBJZiB1c2luZyBtb3JlIHRoYW4gb25lIGVsZW1lbnQgYXMgYW5jaG9yIHBvaW50cywgdGhlIGlkIG9mIHRoZSB0b3AgYW5jaG9yLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnZXhhbXBsZUlkOnRvcCdcclxuICAgKi9cclxuICB0b3BBbmNob3I6ICcnLFxyXG4gIC8qKlxyXG4gICAqIElmIHVzaW5nIG1vcmUgdGhhbiBvbmUgZWxlbWVudCBhcyBhbmNob3IgcG9pbnRzLCB0aGUgaWQgb2YgdGhlIGJvdHRvbSBhbmNob3IuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICdleGFtcGxlSWQ6Ym90dG9tJ1xyXG4gICAqL1xyXG4gIGJ0bUFuY2hvcjogJycsXHJcbiAgLyoqXHJcbiAgICogTWFyZ2luLCBpbiBgZW1gJ3MgdG8gYXBwbHkgdG8gdGhlIHRvcCBvZiB0aGUgZWxlbWVudCB3aGVuIGl0IGJlY29tZXMgc3RpY2t5LlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAxXHJcbiAgICovXHJcbiAgbWFyZ2luVG9wOiAxLFxyXG4gIC8qKlxyXG4gICAqIE1hcmdpbiwgaW4gYGVtYCdzIHRvIGFwcGx5IHRvIHRoZSBib3R0b20gb2YgdGhlIGVsZW1lbnQgd2hlbiBpdCBiZWNvbWVzIHN0aWNreS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgMVxyXG4gICAqL1xyXG4gIG1hcmdpbkJvdHRvbTogMSxcclxuICAvKipcclxuICAgKiBCcmVha3BvaW50IHN0cmluZyB0aGF0IGlzIHRoZSBtaW5pbXVtIHNjcmVlbiBzaXplIGFuIGVsZW1lbnQgc2hvdWxkIGJlY29tZSBzdGlja3kuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICdtZWRpdW0nXHJcbiAgICovXHJcbiAgc3RpY2t5T246ICdtZWRpdW0nLFxyXG4gIC8qKlxyXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gc3RpY2t5IGVsZW1lbnQsIGFuZCByZW1vdmVkIG9uIGRlc3RydWN0aW9uLiBGb3VuZGF0aW9uIGRlZmF1bHRzIHRvIGBzdGlja3lgLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnc3RpY2t5J1xyXG4gICAqL1xyXG4gIHN0aWNreUNsYXNzOiAnc3RpY2t5JyxcclxuICAvKipcclxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHN0aWNreSBjb250YWluZXIuIEZvdW5kYXRpb24gZGVmYXVsdHMgdG8gYHN0aWNreS1jb250YWluZXJgLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnc3RpY2t5LWNvbnRhaW5lcidcclxuICAgKi9cclxuICBjb250YWluZXJDbGFzczogJ3N0aWNreS1jb250YWluZXInLFxyXG4gIC8qKlxyXG4gICAqIE51bWJlciBvZiBzY3JvbGwgZXZlbnRzIGJldHdlZW4gdGhlIHBsdWdpbidzIHJlY2FsY3VsYXRpbmcgc3RpY2t5IHBvaW50cy4gU2V0dGluZyBpdCB0byBgMGAgd2lsbCBjYXVzZSBpdCB0byByZWNhbGMgZXZlcnkgc2Nyb2xsIGV2ZW50LCBzZXR0aW5nIGl0IHRvIGAtMWAgd2lsbCBwcmV2ZW50IHJlY2FsYyBvbiBzY3JvbGwuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDUwXHJcbiAgICovXHJcbiAgY2hlY2tFdmVyeTogLTFcclxufTtcclxuXHJcbi8qKlxyXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gY2FsY3VsYXRlIGVtIHZhbHVlc1xyXG4gKiBAcGFyYW0gTnVtYmVyIHtlbX0gLSBudW1iZXIgb2YgZW0ncyB0byBjYWxjdWxhdGUgaW50byBwaXhlbHNcclxuICovXHJcbmZ1bmN0aW9uIGVtQ2FsYyhlbSkge1xyXG4gIHJldHVybiBwYXJzZUludCh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5ib2R5LCBudWxsKS5mb250U2l6ZSwgMTApICogZW07XHJcbn1cclxuXHJcbi8vIFdpbmRvdyBleHBvcnRzXHJcbkZvdW5kYXRpb24ucGx1Z2luKFN0aWNreSwgJ1N0aWNreScpO1xyXG5cclxufShqUXVlcnkpO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4hZnVuY3Rpb24oJCkge1xyXG5cclxuLyoqXHJcbiAqIFRhYnMgbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24udGFic1xyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudGltZXJBbmRJbWFnZUxvYWRlciBpZiB0YWJzIGNvbnRhaW4gaW1hZ2VzXHJcbiAqL1xyXG5cclxuY2xhc3MgVGFicyB7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiB0YWJzLlxyXG4gICAqIEBjbGFzc1xyXG4gICAqIEBmaXJlcyBUYWJzI2luaXRcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIHRhYnMuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIFRhYnMuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcclxuXHJcbiAgICB0aGlzLl9pbml0KCk7XHJcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdUYWJzJyk7XHJcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdUYWJzJywge1xyXG4gICAgICAnRU5URVInOiAnb3BlbicsXHJcbiAgICAgICdTUEFDRSc6ICdvcGVuJyxcclxuICAgICAgJ0FSUk9XX1JJR0hUJzogJ25leHQnLFxyXG4gICAgICAnQVJST1dfVVAnOiAncHJldmlvdXMnLFxyXG4gICAgICAnQVJST1dfRE9XTic6ICduZXh0JyxcclxuICAgICAgJ0FSUk9XX0xFRlQnOiAncHJldmlvdXMnXHJcbiAgICAgIC8vICdUQUInOiAnbmV4dCcsXHJcbiAgICAgIC8vICdTSElGVF9UQUInOiAncHJldmlvdXMnXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSB0YWJzIGJ5IHNob3dpbmcgYW5kIGZvY3VzaW5nIChpZiBhdXRvRm9jdXM9dHJ1ZSkgdGhlIHByZXNldCBhY3RpdmUgdGFiLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2luaXQoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMuJHRhYlRpdGxlcyA9IHRoaXMuJGVsZW1lbnQuZmluZChgLiR7dGhpcy5vcHRpb25zLmxpbmtDbGFzc31gKTtcclxuICAgIHRoaXMuJHRhYkNvbnRlbnQgPSAkKGBbZGF0YS10YWJzLWNvbnRlbnQ9XCIke3RoaXMuJGVsZW1lbnRbMF0uaWR9XCJdYCk7XHJcblxyXG4gICAgdGhpcy4kdGFiVGl0bGVzLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgdmFyICRlbGVtID0gJCh0aGlzKSxcclxuICAgICAgICAgICRsaW5rID0gJGVsZW0uZmluZCgnYScpLFxyXG4gICAgICAgICAgaXNBY3RpdmUgPSAkZWxlbS5oYXNDbGFzcygnaXMtYWN0aXZlJyksXHJcbiAgICAgICAgICBoYXNoID0gJGxpbmtbMF0uaGFzaC5zbGljZSgxKSxcclxuICAgICAgICAgIGxpbmtJZCA9ICRsaW5rWzBdLmlkID8gJGxpbmtbMF0uaWQgOiBgJHtoYXNofS1sYWJlbGAsXHJcbiAgICAgICAgICAkdGFiQ29udGVudCA9ICQoYCMke2hhc2h9YCk7XHJcblxyXG4gICAgICAkZWxlbS5hdHRyKHsncm9sZSc6ICdwcmVzZW50YXRpb24nfSk7XHJcblxyXG4gICAgICAkbGluay5hdHRyKHtcclxuICAgICAgICAncm9sZSc6ICd0YWInLFxyXG4gICAgICAgICdhcmlhLWNvbnRyb2xzJzogaGFzaCxcclxuICAgICAgICAnYXJpYS1zZWxlY3RlZCc6IGlzQWN0aXZlLFxyXG4gICAgICAgICdpZCc6IGxpbmtJZFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgICR0YWJDb250ZW50LmF0dHIoe1xyXG4gICAgICAgICdyb2xlJzogJ3RhYnBhbmVsJyxcclxuICAgICAgICAnYXJpYS1oaWRkZW4nOiAhaXNBY3RpdmUsXHJcbiAgICAgICAgJ2FyaWEtbGFiZWxsZWRieSc6IGxpbmtJZFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGlmKGlzQWN0aXZlICYmIF90aGlzLm9wdGlvbnMuYXV0b0ZvY3VzKXtcclxuICAgICAgICAkbGluay5mb2N1cygpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZih0aGlzLm9wdGlvbnMubWF0Y2hIZWlnaHQpIHtcclxuICAgICAgdmFyICRpbWFnZXMgPSB0aGlzLiR0YWJDb250ZW50LmZpbmQoJ2ltZycpO1xyXG5cclxuICAgICAgaWYgKCRpbWFnZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgRm91bmRhdGlvbi5vbkltYWdlc0xvYWRlZCgkaW1hZ2VzLCB0aGlzLl9zZXRIZWlnaHQuYmluZCh0aGlzKSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5fc2V0SGVpZ2h0KCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9ldmVudHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgZm9yIGl0ZW1zIHdpdGhpbiB0aGUgdGFicy5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9ldmVudHMoKSB7XHJcbiAgICB0aGlzLl9hZGRLZXlIYW5kbGVyKCk7XHJcbiAgICB0aGlzLl9hZGRDbGlja0hhbmRsZXIoKTtcclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLm1hdGNoSGVpZ2h0KSB7XHJcbiAgICAgICQod2luZG93KS5vbignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgdGhpcy5fc2V0SGVpZ2h0LmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBjbGljayBoYW5kbGVycyBmb3IgaXRlbXMgd2l0aGluIHRoZSB0YWJzLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2FkZENsaWNrSGFuZGxlcigpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudFxyXG4gICAgICAub2ZmKCdjbGljay56Zi50YWJzJylcclxuICAgICAgLm9uKCdjbGljay56Zi50YWJzJywgYC4ke3RoaXMub3B0aW9ucy5saW5rQ2xhc3N9YCwgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgaWYgKCQodGhpcykuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF90aGlzLl9oYW5kbGVUYWJDaGFuZ2UoJCh0aGlzKSk7XHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBrZXlib2FyZCBldmVudCBoYW5kbGVycyBmb3IgaXRlbXMgd2l0aGluIHRoZSB0YWJzLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2FkZEtleUhhbmRsZXIoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgdmFyICRmaXJzdFRhYiA9IF90aGlzLiRlbGVtZW50LmZpbmQoJ2xpOmZpcnN0LW9mLXR5cGUnKTtcclxuICAgIHZhciAkbGFzdFRhYiA9IF90aGlzLiRlbGVtZW50LmZpbmQoJ2xpOmxhc3Qtb2YtdHlwZScpO1xyXG5cclxuICAgIHRoaXMuJHRhYlRpdGxlcy5vZmYoJ2tleWRvd24uemYudGFicycpLm9uKCdrZXlkb3duLnpmLnRhYnMnLCBmdW5jdGlvbihlKXtcclxuICAgICAgaWYgKGUud2hpY2ggPT09IDkpIHJldHVybjtcclxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgdmFyICRlbGVtZW50ID0gJCh0aGlzKSxcclxuICAgICAgICAkZWxlbWVudHMgPSAkZWxlbWVudC5wYXJlbnQoJ3VsJykuY2hpbGRyZW4oJ2xpJyksXHJcbiAgICAgICAgJHByZXZFbGVtZW50LFxyXG4gICAgICAgICRuZXh0RWxlbWVudDtcclxuXHJcbiAgICAgICRlbGVtZW50cy5lYWNoKGZ1bmN0aW9uKGkpIHtcclxuICAgICAgICBpZiAoJCh0aGlzKS5pcygkZWxlbWVudCkpIHtcclxuICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLndyYXBPbktleXMpIHtcclxuICAgICAgICAgICAgJHByZXZFbGVtZW50ID0gaSA9PT0gMCA/ICRlbGVtZW50cy5sYXN0KCkgOiAkZWxlbWVudHMuZXEoaS0xKTtcclxuICAgICAgICAgICAgJG5leHRFbGVtZW50ID0gaSA9PT0gJGVsZW1lbnRzLmxlbmd0aCAtMSA/ICRlbGVtZW50cy5maXJzdCgpIDogJGVsZW1lbnRzLmVxKGkrMSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkZWxlbWVudHMuZXEoTWF0aC5tYXgoMCwgaS0xKSk7XHJcbiAgICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50cy5lcShNYXRoLm1pbihpKzEsICRlbGVtZW50cy5sZW5ndGgtMSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICAvLyBoYW5kbGUga2V5Ym9hcmQgZXZlbnQgd2l0aCBrZXlib2FyZCB1dGlsXHJcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdUYWJzJywge1xyXG4gICAgICAgIG9wZW46IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgJGVsZW1lbnQuZmluZCgnW3JvbGU9XCJ0YWJcIl0nKS5mb2N1cygpO1xyXG4gICAgICAgICAgX3RoaXMuX2hhbmRsZVRhYkNoYW5nZSgkZWxlbWVudCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwcmV2aW91czogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAkcHJldkVsZW1lbnQuZmluZCgnW3JvbGU9XCJ0YWJcIl0nKS5mb2N1cygpO1xyXG4gICAgICAgICAgX3RoaXMuX2hhbmRsZVRhYkNoYW5nZSgkcHJldkVsZW1lbnQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAkbmV4dEVsZW1lbnQuZmluZCgnW3JvbGU9XCJ0YWJcIl0nKS5mb2N1cygpO1xyXG4gICAgICAgICAgX3RoaXMuX2hhbmRsZVRhYkNoYW5nZSgkbmV4dEVsZW1lbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE9wZW5zIHRoZSB0YWIgYCR0YXJnZXRDb250ZW50YCBkZWZpbmVkIGJ5IGAkdGFyZ2V0YC5cclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIFRhYiB0byBvcGVuLlxyXG4gICAqIEBmaXJlcyBUYWJzI2NoYW5nZVxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIF9oYW5kbGVUYWJDaGFuZ2UoJHRhcmdldCkge1xyXG4gICAgdmFyICR0YWJMaW5rID0gJHRhcmdldC5maW5kKCdbcm9sZT1cInRhYlwiXScpLFxyXG4gICAgICAgIGhhc2ggPSAkdGFiTGlua1swXS5oYXNoLFxyXG4gICAgICAgICR0YXJnZXRDb250ZW50ID0gdGhpcy4kdGFiQ29udGVudC5maW5kKGhhc2gpLFxyXG4gICAgICAgICRvbGRUYWIgPSB0aGlzLiRlbGVtZW50LlxyXG4gICAgICAgICAgZmluZChgLiR7dGhpcy5vcHRpb25zLmxpbmtDbGFzc30uaXMtYWN0aXZlYClcclxuICAgICAgICAgIC5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJylcclxuICAgICAgICAgIC5maW5kKCdbcm9sZT1cInRhYlwiXScpXHJcbiAgICAgICAgICAuYXR0cih7ICdhcmlhLXNlbGVjdGVkJzogJ2ZhbHNlJyB9KTtcclxuXHJcbiAgICAkKGAjJHskb2xkVGFiLmF0dHIoJ2FyaWEtY29udHJvbHMnKX1gKVxyXG4gICAgICAucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpXHJcbiAgICAgIC5hdHRyKHsgJ2FyaWEtaGlkZGVuJzogJ3RydWUnIH0pO1xyXG5cclxuICAgICR0YXJnZXQuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG5cclxuICAgICR0YWJMaW5rLmF0dHIoeydhcmlhLXNlbGVjdGVkJzogJ3RydWUnfSk7XHJcblxyXG4gICAgJHRhcmdldENvbnRlbnRcclxuICAgICAgLmFkZENsYXNzKCdpcy1hY3RpdmUnKVxyXG4gICAgICAuYXR0cih7J2FyaWEtaGlkZGVuJzogJ2ZhbHNlJ30pO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBzdWNjZXNzZnVsbHkgY2hhbmdlZCB0YWJzLlxyXG4gICAgICogQGV2ZW50IFRhYnMjY2hhbmdlXHJcbiAgICAgKi9cclxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignY2hhbmdlLnpmLnRhYnMnLCBbJHRhcmdldF0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUHVibGljIG1ldGhvZCBmb3Igc2VsZWN0aW5nIGEgY29udGVudCBwYW5lIHRvIGRpc3BsYXkuXHJcbiAgICogQHBhcmFtIHtqUXVlcnkgfCBTdHJpbmd9IGVsZW0gLSBqUXVlcnkgb2JqZWN0IG9yIHN0cmluZyBvZiB0aGUgaWQgb2YgdGhlIHBhbmUgdG8gZGlzcGxheS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBzZWxlY3RUYWIoZWxlbSkge1xyXG4gICAgdmFyIGlkU3RyO1xyXG5cclxuICAgIGlmICh0eXBlb2YgZWxlbSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgaWRTdHIgPSBlbGVtWzBdLmlkO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWRTdHIgPSBlbGVtO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpZFN0ci5pbmRleE9mKCcjJykgPCAwKSB7XHJcbiAgICAgIGlkU3RyID0gYCMke2lkU3RyfWA7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyICR0YXJnZXQgPSB0aGlzLiR0YWJUaXRsZXMuZmluZChgW2hyZWY9XCIke2lkU3RyfVwiXWApLnBhcmVudChgLiR7dGhpcy5vcHRpb25zLmxpbmtDbGFzc31gKTtcclxuXHJcbiAgICB0aGlzLl9oYW5kbGVUYWJDaGFuZ2UoJHRhcmdldCk7XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBoZWlnaHQgb2YgZWFjaCBwYW5lbCB0byB0aGUgaGVpZ2h0IG9mIHRoZSB0YWxsZXN0IHBhbmVsLlxyXG4gICAqIElmIGVuYWJsZWQgaW4gb3B0aW9ucywgZ2V0cyBjYWxsZWQgb24gbWVkaWEgcXVlcnkgY2hhbmdlLlxyXG4gICAqIElmIGxvYWRpbmcgY29udGVudCB2aWEgZXh0ZXJuYWwgc291cmNlLCBjYW4gYmUgY2FsbGVkIGRpcmVjdGx5IG9yIHdpdGggX3JlZmxvdy5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9zZXRIZWlnaHQoKSB7XHJcbiAgICB2YXIgbWF4ID0gMDtcclxuICAgIHRoaXMuJHRhYkNvbnRlbnRcclxuICAgICAgLmZpbmQoYC4ke3RoaXMub3B0aW9ucy5wYW5lbENsYXNzfWApXHJcbiAgICAgIC5jc3MoJ2hlaWdodCcsICcnKVxyXG4gICAgICAuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgcGFuZWwgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICBpc0FjdGl2ZSA9IHBhbmVsLmhhc0NsYXNzKCdpcy1hY3RpdmUnKTtcclxuXHJcbiAgICAgICAgaWYgKCFpc0FjdGl2ZSkge1xyXG4gICAgICAgICAgcGFuZWwuY3NzKHsndmlzaWJpbGl0eSc6ICdoaWRkZW4nLCAnZGlzcGxheSc6ICdibG9jayd9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB0ZW1wID0gdGhpcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQ7XHJcblxyXG4gICAgICAgIGlmICghaXNBY3RpdmUpIHtcclxuICAgICAgICAgIHBhbmVsLmNzcyh7XHJcbiAgICAgICAgICAgICd2aXNpYmlsaXR5JzogJycsXHJcbiAgICAgICAgICAgICdkaXNwbGF5JzogJydcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWF4ID0gdGVtcCA+IG1heCA/IHRlbXAgOiBtYXg7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jc3MoJ2hlaWdodCcsIGAke21heH1weGApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgYW4gdGFicy5cclxuICAgKiBAZmlyZXMgVGFicyNkZXN0cm95ZWRcclxuICAgKi9cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy4kZWxlbWVudFxyXG4gICAgICAuZmluZChgLiR7dGhpcy5vcHRpb25zLmxpbmtDbGFzc31gKVxyXG4gICAgICAub2ZmKCcuemYudGFicycpLmhpZGUoKS5lbmQoKVxyXG4gICAgICAuZmluZChgLiR7dGhpcy5vcHRpb25zLnBhbmVsQ2xhc3N9YClcclxuICAgICAgLmhpZGUoKTtcclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLm1hdGNoSGVpZ2h0KSB7XHJcbiAgICAgICQod2luZG93KS5vZmYoJ2NoYW5nZWQuemYubWVkaWFxdWVyeScpO1xyXG4gICAgfVxyXG5cclxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICB9XHJcbn1cclxuXHJcblRhYnMuZGVmYXVsdHMgPSB7XHJcbiAgLyoqXHJcbiAgICogQWxsb3dzIHRoZSB3aW5kb3cgdG8gc2Nyb2xsIHRvIGNvbnRlbnQgb2YgYWN0aXZlIHBhbmUgb24gbG9hZCBpZiBzZXQgdG8gdHJ1ZS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBhdXRvRm9jdXM6IGZhbHNlLFxyXG5cclxuICAvKipcclxuICAgKiBBbGxvd3Mga2V5Ym9hcmQgaW5wdXQgdG8gJ3dyYXAnIGFyb3VuZCB0aGUgdGFiIGxpbmtzLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgICovXHJcbiAgd3JhcE9uS2V5czogdHJ1ZSxcclxuXHJcbiAgLyoqXHJcbiAgICogQWxsb3dzIHRoZSB0YWIgY29udGVudCBwYW5lcyB0byBtYXRjaCBoZWlnaHRzIGlmIHNldCB0byB0cnVlLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAqL1xyXG4gIG1hdGNoSGVpZ2h0OiBmYWxzZSxcclxuXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgYXBwbGllZCB0byBgbGlgJ3MgaW4gdGFiIGxpbmsgbGlzdC5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ3RhYnMtdGl0bGUnXHJcbiAgICovXHJcbiAgbGlua0NsYXNzOiAndGFicy10aXRsZScsXHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gdGhlIGNvbnRlbnQgY29udGFpbmVycy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ3RhYnMtcGFuZWwnXHJcbiAgICovXHJcbiAgcGFuZWxDbGFzczogJ3RhYnMtcGFuZWwnXHJcbn07XHJcblxyXG5mdW5jdGlvbiBjaGVja0NsYXNzKCRlbGVtKXtcclxuICByZXR1cm4gJGVsZW0uaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG59XHJcblxyXG4vLyBXaW5kb3cgZXhwb3J0c1xyXG5Gb3VuZGF0aW9uLnBsdWdpbihUYWJzLCAnVGFicycpO1xyXG5cclxufShqUXVlcnkpO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4hZnVuY3Rpb24oJCkge1xyXG5cclxuLyoqXHJcbiAqIFRvZ2dsZXIgbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24udG9nZ2xlclxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXHJcbiAqL1xyXG5cclxuY2xhc3MgVG9nZ2xlciB7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBUb2dnbGVyLlxyXG4gICAqIEBjbGFzc1xyXG4gICAqIEBmaXJlcyBUb2dnbGVyI2luaXRcclxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYWRkIHRoZSB0cmlnZ2VyIHRvLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcclxuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBUb2dnbGVyLmRlZmF1bHRzLCBlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcbiAgICB0aGlzLmNsYXNzTmFtZSA9ICcnO1xyXG5cclxuICAgIHRoaXMuX2luaXQoKTtcclxuICAgIHRoaXMuX2V2ZW50cygpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1RvZ2dsZXInKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBUb2dnbGVyIHBsdWdpbiBieSBwYXJzaW5nIHRoZSB0b2dnbGUgY2xhc3MgZnJvbSBkYXRhLXRvZ2dsZXIsIG9yIGFuaW1hdGlvbiBjbGFzc2VzIGZyb20gZGF0YS1hbmltYXRlLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2luaXQoKSB7XHJcbiAgICB2YXIgaW5wdXQ7XHJcbiAgICAvLyBQYXJzZSBhbmltYXRpb24gY2xhc3NlcyBpZiB0aGV5IHdlcmUgc2V0XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmFuaW1hdGUpIHtcclxuICAgICAgaW5wdXQgPSB0aGlzLm9wdGlvbnMuYW5pbWF0ZS5zcGxpdCgnICcpO1xyXG5cclxuICAgICAgdGhpcy5hbmltYXRpb25JbiA9IGlucHV0WzBdO1xyXG4gICAgICB0aGlzLmFuaW1hdGlvbk91dCA9IGlucHV0WzFdIHx8IG51bGw7XHJcbiAgICB9XHJcbiAgICAvLyBPdGhlcndpc2UsIHBhcnNlIHRvZ2dsZSBjbGFzc1xyXG4gICAgZWxzZSB7XHJcbiAgICAgIGlucHV0ID0gdGhpcy4kZWxlbWVudC5kYXRhKCd0b2dnbGVyJyk7XHJcbiAgICAgIC8vIEFsbG93IGZvciBhIC4gYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgc3RyaW5nXHJcbiAgICAgIHRoaXMuY2xhc3NOYW1lID0gaW5wdXRbMF0gPT09ICcuJyA/IGlucHV0LnNsaWNlKDEpIDogaW5wdXQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIEFSSUEgYXR0cmlidXRlcyB0byB0cmlnZ2Vyc1xyXG4gICAgdmFyIGlkID0gdGhpcy4kZWxlbWVudFswXS5pZDtcclxuICAgICQoYFtkYXRhLW9wZW49XCIke2lkfVwiXSwgW2RhdGEtY2xvc2U9XCIke2lkfVwiXSwgW2RhdGEtdG9nZ2xlPVwiJHtpZH1cIl1gKVxyXG4gICAgICAuYXR0cignYXJpYS1jb250cm9scycsIGlkKTtcclxuICAgIC8vIElmIHRoZSB0YXJnZXQgaXMgaGlkZGVuLCBhZGQgYXJpYS1oaWRkZW5cclxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1leHBhbmRlZCcsIHRoaXMuJGVsZW1lbnQuaXMoJzpoaWRkZW4nKSA/IGZhbHNlIDogdHJ1ZSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyBldmVudHMgZm9yIHRoZSB0b2dnbGUgdHJpZ2dlci5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9ldmVudHMoKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50Lm9mZigndG9nZ2xlLnpmLnRyaWdnZXInKS5vbigndG9nZ2xlLnpmLnRyaWdnZXInLCB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRvZ2dsZXMgdGhlIHRhcmdldCBjbGFzcyBvbiB0aGUgdGFyZ2V0IGVsZW1lbnQuIEFuIGV2ZW50IGlzIGZpcmVkIGZyb20gdGhlIG9yaWdpbmFsIHRyaWdnZXIgZGVwZW5kaW5nIG9uIGlmIHRoZSByZXN1bHRhbnQgc3RhdGUgd2FzIFwib25cIiBvciBcIm9mZlwiLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBmaXJlcyBUb2dnbGVyI29uXHJcbiAgICogQGZpcmVzIFRvZ2dsZXIjb2ZmXHJcbiAgICovXHJcbiAgdG9nZ2xlKCkge1xyXG4gICAgdGhpc1sgdGhpcy5vcHRpb25zLmFuaW1hdGUgPyAnX3RvZ2dsZUFuaW1hdGUnIDogJ190b2dnbGVDbGFzcyddKCk7XHJcbiAgfVxyXG5cclxuICBfdG9nZ2xlQ2xhc3MoKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50LnRvZ2dsZUNsYXNzKHRoaXMuY2xhc3NOYW1lKTtcclxuXHJcbiAgICB2YXIgaXNPbiA9IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3ModGhpcy5jbGFzc05hbWUpO1xyXG4gICAgaWYgKGlzT24pIHtcclxuICAgICAgLyoqXHJcbiAgICAgICAqIEZpcmVzIGlmIHRoZSB0YXJnZXQgZWxlbWVudCBoYXMgdGhlIGNsYXNzIGFmdGVyIGEgdG9nZ2xlLlxyXG4gICAgICAgKiBAZXZlbnQgVG9nZ2xlciNvblxyXG4gICAgICAgKi9cclxuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdvbi56Zi50b2dnbGVyJyk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLyoqXHJcbiAgICAgICAqIEZpcmVzIGlmIHRoZSB0YXJnZXQgZWxlbWVudCBkb2VzIG5vdCBoYXZlIHRoZSBjbGFzcyBhZnRlciBhIHRvZ2dsZS5cclxuICAgICAgICogQGV2ZW50IFRvZ2dsZXIjb2ZmXHJcbiAgICAgICAqL1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ29mZi56Zi50b2dnbGVyJyk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fdXBkYXRlQVJJQShpc09uKTtcclxuICB9XHJcblxyXG4gIF90b2dnbGVBbmltYXRlKCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICBpZiAodGhpcy4kZWxlbWVudC5pcygnOmhpZGRlbicpKSB7XHJcbiAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVJbih0aGlzLiRlbGVtZW50LCB0aGlzLmFuaW1hdGlvbkluLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBfdGhpcy5fdXBkYXRlQVJJQSh0cnVlKTtcclxuICAgICAgICB0aGlzLnRyaWdnZXIoJ29uLnpmLnRvZ2dsZXInKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCh0aGlzLiRlbGVtZW50LCB0aGlzLmFuaW1hdGlvbk91dCwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgX3RoaXMuX3VwZGF0ZUFSSUEoZmFsc2UpO1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcignb2ZmLnpmLnRvZ2dsZXInKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBfdXBkYXRlQVJJQShpc09uKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBpc09uID8gdHJ1ZSA6IGZhbHNlKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIHRoZSBpbnN0YW5jZSBvZiBUb2dnbGVyIG9uIHRoZSBlbGVtZW50LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRvZ2dsZXInKTtcclxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICB9XHJcbn1cclxuXHJcblRvZ2dsZXIuZGVmYXVsdHMgPSB7XHJcbiAgLyoqXHJcbiAgICogVGVsbHMgdGhlIHBsdWdpbiBpZiB0aGUgZWxlbWVudCBzaG91bGQgYW5pbWF0ZWQgd2hlbiB0b2dnbGVkLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAqL1xyXG4gIGFuaW1hdGU6IGZhbHNlXHJcbn07XHJcblxyXG4vLyBXaW5kb3cgZXhwb3J0c1xyXG5Gb3VuZGF0aW9uLnBsdWdpbihUb2dnbGVyLCAnVG9nZ2xlcicpO1xyXG5cclxufShqUXVlcnkpO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4hZnVuY3Rpb24oJCkge1xyXG5cclxuLyoqXHJcbiAqIFRvb2x0aXAgbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24udG9vbHRpcFxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmJveFxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXHJcbiAqL1xyXG5cclxuY2xhc3MgVG9vbHRpcCB7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIFRvb2x0aXAuXHJcbiAgICogQGNsYXNzXHJcbiAgICogQGZpcmVzIFRvb2x0aXAjaW5pdFxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhdHRhY2ggYSB0b29sdGlwIHRvLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gb2JqZWN0IHRvIGV4dGVuZCB0aGUgZGVmYXVsdCBjb25maWd1cmF0aW9uLlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIFRvb2x0aXAuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcclxuXHJcbiAgICB0aGlzLmlzQWN0aXZlID0gZmFsc2U7XHJcbiAgICB0aGlzLmlzQ2xpY2sgPSBmYWxzZTtcclxuICAgIHRoaXMuX2luaXQoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdUb29sdGlwJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgdG9vbHRpcCBieSBzZXR0aW5nIHRoZSBjcmVhdGluZyB0aGUgdGlwIGVsZW1lbnQsIGFkZGluZyBpdCdzIHRleHQsIHNldHRpbmcgcHJpdmF0ZSB2YXJpYWJsZXMgYW5kIHNldHRpbmcgYXR0cmlidXRlcyBvbiB0aGUgYW5jaG9yLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2luaXQoKSB7XHJcbiAgICB2YXIgZWxlbUlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWRlc2NyaWJlZGJ5JykgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAndG9vbHRpcCcpO1xyXG5cclxuICAgIHRoaXMub3B0aW9ucy5wb3NpdGlvbkNsYXNzID0gdGhpcy5fZ2V0UG9zaXRpb25DbGFzcyh0aGlzLiRlbGVtZW50KTtcclxuICAgIHRoaXMub3B0aW9ucy50aXBUZXh0ID0gdGhpcy5vcHRpb25zLnRpcFRleHQgfHwgdGhpcy4kZWxlbWVudC5hdHRyKCd0aXRsZScpO1xyXG4gICAgdGhpcy50ZW1wbGF0ZSA9IHRoaXMub3B0aW9ucy50ZW1wbGF0ZSA/ICQodGhpcy5vcHRpb25zLnRlbXBsYXRlKSA6IHRoaXMuX2J1aWxkVGVtcGxhdGUoZWxlbUlkKTtcclxuXHJcbiAgICB0aGlzLnRlbXBsYXRlLmFwcGVuZFRvKGRvY3VtZW50LmJvZHkpXHJcbiAgICAgICAgLnRleHQodGhpcy5vcHRpb25zLnRpcFRleHQpXHJcbiAgICAgICAgLmhpZGUoKTtcclxuXHJcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoe1xyXG4gICAgICAndGl0bGUnOiAnJyxcclxuICAgICAgJ2FyaWEtZGVzY3JpYmVkYnknOiBlbGVtSWQsXHJcbiAgICAgICdkYXRhLXlldGktYm94JzogZWxlbUlkLFxyXG4gICAgICAnZGF0YS10b2dnbGUnOiBlbGVtSWQsXHJcbiAgICAgICdkYXRhLXJlc2l6ZSc6IGVsZW1JZFxyXG4gICAgfSkuYWRkQ2xhc3ModGhpcy50cmlnZ2VyQ2xhc3MpO1xyXG5cclxuICAgIC8vaGVscGVyIHZhcmlhYmxlcyB0byB0cmFjayBtb3ZlbWVudCBvbiBjb2xsaXNpb25zXHJcbiAgICB0aGlzLnVzZWRQb3NpdGlvbnMgPSBbXTtcclxuICAgIHRoaXMuY291bnRlciA9IDQ7XHJcbiAgICB0aGlzLmNsYXNzQ2hhbmdlZCA9IGZhbHNlO1xyXG5cclxuICAgIHRoaXMuX2V2ZW50cygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR3JhYnMgdGhlIGN1cnJlbnQgcG9zaXRpb25pbmcgY2xhc3MsIGlmIHByZXNlbnQsIGFuZCByZXR1cm5zIHRoZSB2YWx1ZSBvciBhbiBlbXB0eSBzdHJpbmcuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfZ2V0UG9zaXRpb25DbGFzcyhlbGVtZW50KSB7XHJcbiAgICBpZiAoIWVsZW1lbnQpIHsgcmV0dXJuICcnOyB9XHJcbiAgICAvLyB2YXIgcG9zaXRpb24gPSBlbGVtZW50LmF0dHIoJ2NsYXNzJykubWF0Y2goL3RvcHxsZWZ0fHJpZ2h0L2cpO1xyXG4gICAgdmFyIHBvc2l0aW9uID0gZWxlbWVudFswXS5jbGFzc05hbWUubWF0Y2goL1xcYih0b3B8bGVmdHxyaWdodClcXGIvZyk7XHJcbiAgICAgICAgcG9zaXRpb24gPSBwb3NpdGlvbiA/IHBvc2l0aW9uWzBdIDogJyc7XHJcbiAgICByZXR1cm4gcG9zaXRpb247XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBidWlsZHMgdGhlIHRvb2x0aXAgZWxlbWVudCwgYWRkcyBhdHRyaWJ1dGVzLCBhbmQgcmV0dXJucyB0aGUgdGVtcGxhdGUuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfYnVpbGRUZW1wbGF0ZShpZCkge1xyXG4gICAgdmFyIHRlbXBsYXRlQ2xhc3NlcyA9IChgJHt0aGlzLm9wdGlvbnMudG9vbHRpcENsYXNzfSAke3RoaXMub3B0aW9ucy5wb3NpdGlvbkNsYXNzfSAke3RoaXMub3B0aW9ucy50ZW1wbGF0ZUNsYXNzZXN9YCkudHJpbSgpO1xyXG4gICAgdmFyICR0ZW1wbGF0ZSA9ICAkKCc8ZGl2PjwvZGl2PicpLmFkZENsYXNzKHRlbXBsYXRlQ2xhc3NlcykuYXR0cih7XHJcbiAgICAgICdyb2xlJzogJ3Rvb2x0aXAnLFxyXG4gICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxyXG4gICAgICAnZGF0YS1pcy1hY3RpdmUnOiBmYWxzZSxcclxuICAgICAgJ2RhdGEtaXMtZm9jdXMnOiBmYWxzZSxcclxuICAgICAgJ2lkJzogaWRcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuICR0ZW1wbGF0ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZ1bmN0aW9uIHRoYXQgZ2V0cyBjYWxsZWQgaWYgYSBjb2xsaXNpb24gZXZlbnQgaXMgZGV0ZWN0ZWQuXHJcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBvc2l0aW9uIC0gcG9zaXRpb25pbmcgY2xhc3MgdG8gdHJ5XHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfcmVwb3NpdGlvbihwb3NpdGlvbikge1xyXG4gICAgdGhpcy51c2VkUG9zaXRpb25zLnB1c2gocG9zaXRpb24gPyBwb3NpdGlvbiA6ICdib3R0b20nKTtcclxuXHJcbiAgICAvL2RlZmF1bHQsIHRyeSBzd2l0Y2hpbmcgdG8gb3Bwb3NpdGUgc2lkZVxyXG4gICAgaWYgKCFwb3NpdGlvbiAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3RvcCcpIDwgMCkpIHtcclxuICAgICAgdGhpcy50ZW1wbGF0ZS5hZGRDbGFzcygndG9wJyk7XHJcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uID09PSAndG9wJyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpIHtcclxuICAgICAgdGhpcy50ZW1wbGF0ZS5yZW1vdmVDbGFzcyhwb3NpdGlvbik7XHJcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uID09PSAnbGVmdCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdyaWdodCcpIDwgMCkpIHtcclxuICAgICAgdGhpcy50ZW1wbGF0ZS5yZW1vdmVDbGFzcyhwb3NpdGlvbilcclxuICAgICAgICAgIC5hZGRDbGFzcygncmlnaHQnKTtcclxuICAgIH0gZWxzZSBpZiAocG9zaXRpb24gPT09ICdyaWdodCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSkge1xyXG4gICAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxyXG4gICAgICAgICAgLmFkZENsYXNzKCdsZWZ0Jyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9pZiBkZWZhdWx0IGNoYW5nZSBkaWRuJ3Qgd29yaywgdHJ5IGJvdHRvbSBvciBsZWZ0IGZpcnN0XHJcbiAgICBlbHNlIGlmICghcG9zaXRpb24gJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCd0b3AnKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2xlZnQnKSA8IDApKSB7XHJcbiAgICAgIHRoaXMudGVtcGxhdGUuYWRkQ2xhc3MoJ2xlZnQnKTtcclxuICAgIH0gZWxzZSBpZiAocG9zaXRpb24gPT09ICd0b3AnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignYm90dG9tJykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSkge1xyXG4gICAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxyXG4gICAgICAgICAgLmFkZENsYXNzKCdsZWZ0Jyk7XHJcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uID09PSAnbGVmdCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdyaWdodCcpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignYm90dG9tJykgPCAwKSkge1xyXG4gICAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcclxuICAgIH0gZWxzZSBpZiAocG9zaXRpb24gPT09ICdyaWdodCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA8IDApKSB7XHJcbiAgICAgIHRoaXMudGVtcGxhdGUucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xyXG4gICAgfVxyXG4gICAgLy9pZiBub3RoaW5nIGNsZWFyZWQsIHNldCB0byBib3R0b21cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcclxuICAgIH1cclxuICAgIHRoaXMuY2xhc3NDaGFuZ2VkID0gdHJ1ZTtcclxuICAgIHRoaXMuY291bnRlci0tO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogc2V0cyB0aGUgcG9zaXRpb24gY2xhc3Mgb2YgYW4gZWxlbWVudCBhbmQgcmVjdXJzaXZlbHkgY2FsbHMgaXRzZWxmIHVudGlsIHRoZXJlIGFyZSBubyBtb3JlIHBvc3NpYmxlIHBvc2l0aW9ucyB0byBhdHRlbXB0LCBvciB0aGUgdG9vbHRpcCBlbGVtZW50IGlzIG5vIGxvbmdlciBjb2xsaWRpbmcuXHJcbiAgICogaWYgdGhlIHRvb2x0aXAgaXMgbGFyZ2VyIHRoYW4gdGhlIHNjcmVlbiB3aWR0aCwgZGVmYXVsdCB0byBmdWxsIHdpZHRoIC0gYW55IHVzZXIgc2VsZWN0ZWQgbWFyZ2luXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfc2V0UG9zaXRpb24oKSB7XHJcbiAgICB2YXIgcG9zaXRpb24gPSB0aGlzLl9nZXRQb3NpdGlvbkNsYXNzKHRoaXMudGVtcGxhdGUpLFxyXG4gICAgICAgICR0aXBEaW1zID0gRm91bmRhdGlvbi5Cb3guR2V0RGltZW5zaW9ucyh0aGlzLnRlbXBsYXRlKSxcclxuICAgICAgICAkYW5jaG9yRGltcyA9IEZvdW5kYXRpb24uQm94LkdldERpbWVuc2lvbnModGhpcy4kZWxlbWVudCksXHJcbiAgICAgICAgZGlyZWN0aW9uID0gKHBvc2l0aW9uID09PSAnbGVmdCcgPyAnbGVmdCcgOiAoKHBvc2l0aW9uID09PSAncmlnaHQnKSA/ICdsZWZ0JyA6ICd0b3AnKSksXHJcbiAgICAgICAgcGFyYW0gPSAoZGlyZWN0aW9uID09PSAndG9wJykgPyAnaGVpZ2h0JyA6ICd3aWR0aCcsXHJcbiAgICAgICAgb2Zmc2V0ID0gKHBhcmFtID09PSAnaGVpZ2h0JykgPyB0aGlzLm9wdGlvbnMudk9mZnNldCA6IHRoaXMub3B0aW9ucy5oT2Zmc2V0LFxyXG4gICAgICAgIF90aGlzID0gdGhpcztcclxuXHJcbiAgICBpZiAoKCR0aXBEaW1zLndpZHRoID49ICR0aXBEaW1zLndpbmRvd0RpbXMud2lkdGgpIHx8ICghdGhpcy5jb3VudGVyICYmICFGb3VuZGF0aW9uLkJveC5JbU5vdFRvdWNoaW5nWW91KHRoaXMudGVtcGxhdGUpKSkge1xyXG4gICAgICB0aGlzLnRlbXBsYXRlLm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMudGVtcGxhdGUsIHRoaXMuJGVsZW1lbnQsICdjZW50ZXIgYm90dG9tJywgdGhpcy5vcHRpb25zLnZPZmZzZXQsIHRoaXMub3B0aW9ucy5oT2Zmc2V0LCB0cnVlKSkuY3NzKHtcclxuICAgICAgLy8gdGhpcy4kZWxlbWVudC5vZmZzZXQoRm91bmRhdGlvbi5HZXRPZmZzZXRzKHRoaXMudGVtcGxhdGUsIHRoaXMuJGVsZW1lbnQsICdjZW50ZXIgYm90dG9tJywgdGhpcy5vcHRpb25zLnZPZmZzZXQsIHRoaXMub3B0aW9ucy5oT2Zmc2V0LCB0cnVlKSkuY3NzKHtcclxuICAgICAgICAnd2lkdGgnOiAkYW5jaG9yRGltcy53aW5kb3dEaW1zLndpZHRoIC0gKHRoaXMub3B0aW9ucy5oT2Zmc2V0ICogMiksXHJcbiAgICAgICAgJ2hlaWdodCc6ICdhdXRvJ1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudGVtcGxhdGUub2Zmc2V0KEZvdW5kYXRpb24uQm94LkdldE9mZnNldHModGhpcy50ZW1wbGF0ZSwgdGhpcy4kZWxlbWVudCwnY2VudGVyICcgKyAocG9zaXRpb24gfHwgJ2JvdHRvbScpLCB0aGlzLm9wdGlvbnMudk9mZnNldCwgdGhpcy5vcHRpb25zLmhPZmZzZXQpKTtcclxuXHJcbiAgICB3aGlsZSghRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSh0aGlzLnRlbXBsYXRlKSAmJiB0aGlzLmNvdW50ZXIpIHtcclxuICAgICAgdGhpcy5fcmVwb3NpdGlvbihwb3NpdGlvbik7XHJcbiAgICAgIHRoaXMuX3NldFBvc2l0aW9uKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiByZXZlYWxzIHRoZSB0b29sdGlwLCBhbmQgZmlyZXMgYW4gZXZlbnQgdG8gY2xvc2UgYW55IG90aGVyIG9wZW4gdG9vbHRpcHMgb24gdGhlIHBhZ2VcclxuICAgKiBAZmlyZXMgVG9vbHRpcCNjbG9zZW1lXHJcbiAgICogQGZpcmVzIFRvb2x0aXAjc2hvd1xyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIHNob3coKSB7XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnNob3dPbiAhPT0gJ2FsbCcgJiYgIUZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KHRoaXMub3B0aW9ucy5zaG93T24pKSB7XHJcbiAgICAgIC8vIGNvbnNvbGUuZXJyb3IoJ1RoZSBzY3JlZW4gaXMgdG9vIHNtYWxsIHRvIGRpc3BsYXkgdGhpcyB0b29sdGlwJyk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgdGhpcy50ZW1wbGF0ZS5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJykuc2hvdygpO1xyXG4gICAgdGhpcy5fc2V0UG9zaXRpb24oKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHRvIGNsb3NlIGFsbCBvdGhlciBvcGVuIHRvb2x0aXBzIG9uIHRoZSBwYWdlXHJcbiAgICAgKiBAZXZlbnQgQ2xvc2VtZSN0b29sdGlwXHJcbiAgICAgKi9cclxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignY2xvc2VtZS56Zi50b29sdGlwJywgdGhpcy50ZW1wbGF0ZS5hdHRyKCdpZCcpKTtcclxuXHJcblxyXG4gICAgdGhpcy50ZW1wbGF0ZS5hdHRyKHtcclxuICAgICAgJ2RhdGEtaXMtYWN0aXZlJzogdHJ1ZSxcclxuICAgICAgJ2FyaWEtaGlkZGVuJzogZmFsc2VcclxuICAgIH0pO1xyXG4gICAgX3RoaXMuaXNBY3RpdmUgPSB0cnVlO1xyXG4gICAgLy8gY29uc29sZS5sb2codGhpcy50ZW1wbGF0ZSk7XHJcbiAgICB0aGlzLnRlbXBsYXRlLnN0b3AoKS5oaWRlKCkuY3NzKCd2aXNpYmlsaXR5JywgJycpLmZhZGVJbih0aGlzLm9wdGlvbnMuZmFkZUluRHVyYXRpb24sIGZ1bmN0aW9uKCkge1xyXG4gICAgICAvL21heWJlIGRvIHN0dWZmP1xyXG4gICAgfSk7XHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gdGhlIHRvb2x0aXAgaXMgc2hvd25cclxuICAgICAqIEBldmVudCBUb29sdGlwI3Nob3dcclxuICAgICAqL1xyXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdzaG93LnpmLnRvb2x0aXAnKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhpZGVzIHRoZSBjdXJyZW50IHRvb2x0aXAsIGFuZCByZXNldHMgdGhlIHBvc2l0aW9uaW5nIGNsYXNzIGlmIGl0IHdhcyBjaGFuZ2VkIGR1ZSB0byBjb2xsaXNpb25cclxuICAgKiBAZmlyZXMgVG9vbHRpcCNoaWRlXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgaGlkZSgpIHtcclxuICAgIC8vIGNvbnNvbGUubG9nKCdoaWRpbmcnLCB0aGlzLiRlbGVtZW50LmRhdGEoJ3lldGktYm94JykpO1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHRoaXMudGVtcGxhdGUuc3RvcCgpLmF0dHIoe1xyXG4gICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxyXG4gICAgICAnZGF0YS1pcy1hY3RpdmUnOiBmYWxzZVxyXG4gICAgfSkuZmFkZU91dCh0aGlzLm9wdGlvbnMuZmFkZU91dER1cmF0aW9uLCBmdW5jdGlvbigpIHtcclxuICAgICAgX3RoaXMuaXNBY3RpdmUgPSBmYWxzZTtcclxuICAgICAgX3RoaXMuaXNDbGljayA9IGZhbHNlO1xyXG4gICAgICBpZiAoX3RoaXMuY2xhc3NDaGFuZ2VkKSB7XHJcbiAgICAgICAgX3RoaXMudGVtcGxhdGVcclxuICAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhfdGhpcy5fZ2V0UG9zaXRpb25DbGFzcyhfdGhpcy50ZW1wbGF0ZSkpXHJcbiAgICAgICAgICAgICAuYWRkQ2xhc3MoX3RoaXMub3B0aW9ucy5wb3NpdGlvbkNsYXNzKTtcclxuXHJcbiAgICAgICBfdGhpcy51c2VkUG9zaXRpb25zID0gW107XHJcbiAgICAgICBfdGhpcy5jb3VudGVyID0gNDtcclxuICAgICAgIF90aGlzLmNsYXNzQ2hhbmdlZCA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIC8qKlxyXG4gICAgICogZmlyZXMgd2hlbiB0aGUgdG9vbHRpcCBpcyBoaWRkZW5cclxuICAgICAqIEBldmVudCBUb29sdGlwI2hpZGVcclxuICAgICAqL1xyXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdoaWRlLnpmLnRvb2x0aXAnKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIGFkZHMgZXZlbnQgbGlzdGVuZXJzIGZvciB0aGUgdG9vbHRpcCBhbmQgaXRzIGFuY2hvclxyXG4gICAqIFRPRE8gY29tYmluZSBzb21lIG9mIHRoZSBsaXN0ZW5lcnMgbGlrZSBmb2N1cyBhbmQgbW91c2VlbnRlciwgZXRjLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2V2ZW50cygpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICB2YXIgJHRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZTtcclxuICAgIHZhciBpc0ZvY3VzID0gZmFsc2U7XHJcblxyXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuZGlzYWJsZUhvdmVyKSB7XHJcblxyXG4gICAgICB0aGlzLiRlbGVtZW50XHJcbiAgICAgIC5vbignbW91c2VlbnRlci56Zi50b29sdGlwJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGlmICghX3RoaXMuaXNBY3RpdmUpIHtcclxuICAgICAgICAgIF90aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBfdGhpcy5zaG93KCk7XHJcbiAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgICAgLm9uKCdtb3VzZWxlYXZlLnpmLnRvb2x0aXAnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLnRpbWVvdXQpO1xyXG4gICAgICAgIGlmICghaXNGb2N1cyB8fCAoIV90aGlzLmlzQ2xpY2sgJiYgX3RoaXMub3B0aW9ucy5jbGlja09wZW4pKSB7XHJcbiAgICAgICAgICBfdGhpcy5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmNsaWNrT3Blbikge1xyXG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCdtb3VzZWRvd24uemYudG9vbHRpcCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGlmIChfdGhpcy5pc0NsaWNrKSB7XHJcbiAgICAgICAgICBfdGhpcy5oaWRlKCk7XHJcbiAgICAgICAgICAvLyBfdGhpcy5pc0NsaWNrID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIF90aGlzLmlzQ2xpY2sgPSB0cnVlO1xyXG4gICAgICAgICAgaWYgKChfdGhpcy5vcHRpb25zLmRpc2FibGVIb3ZlciB8fCAhX3RoaXMuJGVsZW1lbnQuYXR0cigndGFiaW5kZXgnKSkgJiYgIV90aGlzLmlzQWN0aXZlKSB7XHJcbiAgICAgICAgICAgIF90aGlzLnNob3coKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5vcHRpb25zLmRpc2FibGVGb3JUb3VjaCkge1xyXG4gICAgICB0aGlzLiRlbGVtZW50XHJcbiAgICAgIC5vbigndGFwLnpmLnRvb2x0aXAgdG91Y2hlbmQuemYudG9vbHRpcCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBfdGhpcy5pc0FjdGl2ZSA/IF90aGlzLmhpZGUoKSA6IF90aGlzLnNob3coKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudC5vbih7XHJcbiAgICAgIC8vICd0b2dnbGUuemYudHJpZ2dlcic6IHRoaXMudG9nZ2xlLmJpbmQodGhpcyksXHJcbiAgICAgIC8vICdjbG9zZS56Zi50cmlnZ2VyJzogdGhpcy5oaWRlLmJpbmQodGhpcylcclxuICAgICAgJ2Nsb3NlLnpmLnRyaWdnZXInOiB0aGlzLmhpZGUuYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudFxyXG4gICAgICAub24oJ2ZvY3VzLnpmLnRvb2x0aXAnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgaXNGb2N1cyA9IHRydWU7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coX3RoaXMuaXNDbGljayk7XHJcbiAgICAgICAgaWYgKF90aGlzLmlzQ2xpY2spIHtcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gJCh3aW5kb3cpXHJcbiAgICAgICAgICBfdGhpcy5zaG93KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgLm9uKCdmb2N1c291dC56Zi50b29sdGlwJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGlzRm9jdXMgPSBmYWxzZTtcclxuICAgICAgICBfdGhpcy5pc0NsaWNrID0gZmFsc2U7XHJcbiAgICAgICAgX3RoaXMuaGlkZSgpO1xyXG4gICAgICB9KVxyXG5cclxuICAgICAgLm9uKCdyZXNpemVtZS56Zi50cmlnZ2VyJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKF90aGlzLmlzQWN0aXZlKSB7XHJcbiAgICAgICAgICBfdGhpcy5fc2V0UG9zaXRpb24oKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogYWRkcyBhIHRvZ2dsZSBtZXRob2QsIGluIGFkZGl0aW9uIHRvIHRoZSBzdGF0aWMgc2hvdygpICYgaGlkZSgpIGZ1bmN0aW9uc1xyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIHRvZ2dsZSgpIHtcclxuICAgIGlmICh0aGlzLmlzQWN0aXZlKSB7XHJcbiAgICAgIHRoaXMuaGlkZSgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5zaG93KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiB0b29sdGlwLCByZW1vdmVzIHRlbXBsYXRlIGVsZW1lbnQgZnJvbSB0aGUgdmlldy5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCd0aXRsZScsIHRoaXMudGVtcGxhdGUudGV4dCgpKVxyXG4gICAgICAgICAgICAgICAgIC5vZmYoJy56Zi50cmlnZ2VyIC56Zi50b290aXAnKVxyXG4gICAgICAgICAgICAgICAgLy8gIC5yZW1vdmVDbGFzcygnaGFzLXRpcCcpXHJcbiAgICAgICAgICAgICAgICAgLnJlbW92ZUF0dHIoJ2FyaWEtZGVzY3JpYmVkYnknKVxyXG4gICAgICAgICAgICAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXlldGktYm94JylcclxuICAgICAgICAgICAgICAgICAucmVtb3ZlQXR0cignZGF0YS10b2dnbGUnKVxyXG4gICAgICAgICAgICAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXJlc2l6ZScpO1xyXG5cclxuICAgIHRoaXMudGVtcGxhdGUucmVtb3ZlKCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH1cclxufVxyXG5cclxuVG9vbHRpcC5kZWZhdWx0cyA9IHtcclxuICBkaXNhYmxlRm9yVG91Y2g6IGZhbHNlLFxyXG4gIC8qKlxyXG4gICAqIFRpbWUsIGluIG1zLCBiZWZvcmUgYSB0b29sdGlwIHNob3VsZCBvcGVuIG9uIGhvdmVyLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAyMDBcclxuICAgKi9cclxuICBob3ZlckRlbGF5OiAyMDAsXHJcbiAgLyoqXHJcbiAgICogVGltZSwgaW4gbXMsIGEgdG9vbHRpcCBzaG91bGQgdGFrZSB0byBmYWRlIGludG8gdmlldy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgMTUwXHJcbiAgICovXHJcbiAgZmFkZUluRHVyYXRpb246IDE1MCxcclxuICAvKipcclxuICAgKiBUaW1lLCBpbiBtcywgYSB0b29sdGlwIHNob3VsZCB0YWtlIHRvIGZhZGUgb3V0IG9mIHZpZXcuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDE1MFxyXG4gICAqL1xyXG4gIGZhZGVPdXREdXJhdGlvbjogMTUwLFxyXG4gIC8qKlxyXG4gICAqIERpc2FibGVzIGhvdmVyIGV2ZW50cyBmcm9tIG9wZW5pbmcgdGhlIHRvb2x0aXAgaWYgc2V0IHRvIHRydWVcclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBkaXNhYmxlSG92ZXI6IGZhbHNlLFxyXG4gIC8qKlxyXG4gICAqIE9wdGlvbmFsIGFkZHRpb25hbCBjbGFzc2VzIHRvIGFwcGx5IHRvIHRoZSB0b29sdGlwIHRlbXBsYXRlIG9uIGluaXQuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICdteS1jb29sLXRpcC1jbGFzcydcclxuICAgKi9cclxuICB0ZW1wbGF0ZUNsYXNzZXM6ICcnLFxyXG4gIC8qKlxyXG4gICAqIE5vbi1vcHRpb25hbCBjbGFzcyBhZGRlZCB0byB0b29sdGlwIHRlbXBsYXRlcy4gRm91bmRhdGlvbiBkZWZhdWx0IGlzICd0b29sdGlwJy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ3Rvb2x0aXAnXHJcbiAgICovXHJcbiAgdG9vbHRpcENsYXNzOiAndG9vbHRpcCcsXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgYXBwbGllZCB0byB0aGUgdG9vbHRpcCBhbmNob3IgZWxlbWVudC5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ2hhcy10aXAnXHJcbiAgICovXHJcbiAgdHJpZ2dlckNsYXNzOiAnaGFzLXRpcCcsXHJcbiAgLyoqXHJcbiAgICogTWluaW11bSBicmVha3BvaW50IHNpemUgYXQgd2hpY2ggdG8gb3BlbiB0aGUgdG9vbHRpcC5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ3NtYWxsJ1xyXG4gICAqL1xyXG4gIHNob3dPbjogJ3NtYWxsJyxcclxuICAvKipcclxuICAgKiBDdXN0b20gdGVtcGxhdGUgdG8gYmUgdXNlZCB0byBnZW5lcmF0ZSBtYXJrdXAgZm9yIHRvb2x0aXAuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICcmbHQ7ZGl2IGNsYXNzPVwidG9vbHRpcFwiJmd0OyZsdDsvZGl2Jmd0OydcclxuICAgKi9cclxuICB0ZW1wbGF0ZTogJycsXHJcbiAgLyoqXHJcbiAgICogVGV4dCBkaXNwbGF5ZWQgaW4gdGhlIHRvb2x0aXAgdGVtcGxhdGUgb24gb3Blbi5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ1NvbWUgY29vbCBzcGFjZSBmYWN0IGhlcmUuJ1xyXG4gICAqL1xyXG4gIHRpcFRleHQ6ICcnLFxyXG4gIHRvdWNoQ2xvc2VUZXh0OiAnVGFwIHRvIGNsb3NlLicsXHJcbiAgLyoqXHJcbiAgICogQWxsb3dzIHRoZSB0b29sdGlwIHRvIHJlbWFpbiBvcGVuIGlmIHRyaWdnZXJlZCB3aXRoIGEgY2xpY2sgb3IgdG91Y2ggZXZlbnQuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIHRydWVcclxuICAgKi9cclxuICBjbGlja09wZW46IHRydWUsXHJcbiAgLyoqXHJcbiAgICogQWRkaXRpb25hbCBwb3NpdGlvbmluZyBjbGFzc2VzLCBzZXQgYnkgdGhlIEpTXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICd0b3AnXHJcbiAgICovXHJcbiAgcG9zaXRpb25DbGFzczogJycsXHJcbiAgLyoqXHJcbiAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIHRlbXBsYXRlIHNob3VsZCBwdXNoIGF3YXkgZnJvbSB0aGUgYW5jaG9yIG9uIHRoZSBZIGF4aXMuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDEwXHJcbiAgICovXHJcbiAgdk9mZnNldDogMTAsXHJcbiAgLyoqXHJcbiAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIHRlbXBsYXRlIHNob3VsZCBwdXNoIGF3YXkgZnJvbSB0aGUgYW5jaG9yIG9uIHRoZSBYIGF4aXMsIGlmIGFsaWduZWQgdG8gYSBzaWRlLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAxMlxyXG4gICAqL1xyXG4gIGhPZmZzZXQ6IDEyXHJcbn07XHJcblxyXG4vKipcclxuICogVE9ETyB1dGlsaXplIHJlc2l6ZSBldmVudCB0cmlnZ2VyXHJcbiAqL1xyXG5cclxuLy8gV2luZG93IGV4cG9ydHNcclxuRm91bmRhdGlvbi5wbHVnaW4oVG9vbHRpcCwgJ1Rvb2x0aXAnKTtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy8gUG9seWZpbGwgZm9yIHJlcXVlc3RBbmltYXRpb25GcmFtZVxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgaWYgKCFEYXRlLm5vdylcclxuICAgIERhdGUubm93ID0gZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgfTtcclxuXHJcbiAgdmFyIHZlbmRvcnMgPSBbJ3dlYmtpdCcsICdtb3onXTtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IHZlbmRvcnMubGVuZ3RoICYmICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lOyArK2kpIHtcclxuICAgICAgdmFyIHZwID0gdmVuZG9yc1tpXTtcclxuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2cCsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XHJcbiAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9ICh3aW5kb3dbdnArJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ11cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgd2luZG93W3ZwKydDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXSk7XHJcbiAgfVxyXG4gIGlmICgvaVAoYWR8aG9uZXxvZCkuKk9TIDYvLnRlc3Qod2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpXHJcbiAgICB8fCAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCAhd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKSB7XHJcbiAgICB2YXIgbGFzdFRpbWUgPSAwO1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KCk7XHJcbiAgICAgICAgdmFyIG5leHRUaW1lID0gTWF0aC5tYXgobGFzdFRpbWUgKyAxNiwgbm93KTtcclxuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2sobGFzdFRpbWUgPSBuZXh0VGltZSk7IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFRpbWUgLSBub3cpO1xyXG4gICAgfTtcclxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGNsZWFyVGltZW91dDtcclxuICB9XHJcbn0pKCk7XHJcblxyXG52YXIgaW5pdENsYXNzZXMgICA9IFsnbXVpLWVudGVyJywgJ211aS1sZWF2ZSddO1xyXG52YXIgYWN0aXZlQ2xhc3NlcyA9IFsnbXVpLWVudGVyLWFjdGl2ZScsICdtdWktbGVhdmUtYWN0aXZlJ107XHJcblxyXG4vLyBGaW5kIHRoZSByaWdodCBcInRyYW5zaXRpb25lbmRcIiBldmVudCBmb3IgdGhpcyBicm93c2VyXHJcbnZhciBlbmRFdmVudCA9IChmdW5jdGlvbigpIHtcclxuICB2YXIgdHJhbnNpdGlvbnMgPSB7XHJcbiAgICAndHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcclxuICAgICdXZWJraXRUcmFuc2l0aW9uJzogJ3dlYmtpdFRyYW5zaXRpb25FbmQnLFxyXG4gICAgJ01velRyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXHJcbiAgICAnT1RyYW5zaXRpb24nOiAnb3RyYW5zaXRpb25lbmQnXHJcbiAgfVxyXG4gIHZhciBlbGVtID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cclxuICBmb3IgKHZhciB0IGluIHRyYW5zaXRpb25zKSB7XHJcbiAgICBpZiAodHlwZW9mIGVsZW0uc3R5bGVbdF0gIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgIHJldHVybiB0cmFuc2l0aW9uc1t0XTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBudWxsO1xyXG59KSgpO1xyXG5cclxuZnVuY3Rpb24gYW5pbWF0ZShpc0luLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XHJcbiAgZWxlbWVudCA9ICQoZWxlbWVudCkuZXEoMCk7XHJcblxyXG4gIGlmICghZWxlbWVudC5sZW5ndGgpIHJldHVybjtcclxuXHJcbiAgaWYgKGVuZEV2ZW50ID09PSBudWxsKSB7XHJcbiAgICBpc0luID8gZWxlbWVudC5zaG93KCkgOiBlbGVtZW50LmhpZGUoKTtcclxuICAgIGNiKCk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICB2YXIgaW5pdENsYXNzID0gaXNJbiA/IGluaXRDbGFzc2VzWzBdIDogaW5pdENsYXNzZXNbMV07XHJcbiAgdmFyIGFjdGl2ZUNsYXNzID0gaXNJbiA/IGFjdGl2ZUNsYXNzZXNbMF0gOiBhY3RpdmVDbGFzc2VzWzFdO1xyXG5cclxuICAvLyBTZXQgdXAgdGhlIGFuaW1hdGlvblxyXG4gIHJlc2V0KCk7XHJcbiAgZWxlbWVudC5hZGRDbGFzcyhhbmltYXRpb24pO1xyXG4gIGVsZW1lbnQuY3NzKCd0cmFuc2l0aW9uJywgJ25vbmUnKTtcclxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XHJcbiAgICBlbGVtZW50LmFkZENsYXNzKGluaXRDbGFzcyk7XHJcbiAgICBpZiAoaXNJbikgZWxlbWVudC5zaG93KCk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIFN0YXJ0IHRoZSBhbmltYXRpb25cclxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XHJcbiAgICBlbGVtZW50WzBdLm9mZnNldFdpZHRoO1xyXG4gICAgZWxlbWVudC5jc3MoJ3RyYW5zaXRpb24nLCAnJyk7XHJcbiAgICBlbGVtZW50LmFkZENsYXNzKGFjdGl2ZUNsYXNzKTtcclxuICB9KTtcclxuXHJcbiAgLy8gQ2xlYW4gdXAgdGhlIGFuaW1hdGlvbiB3aGVuIGl0IGZpbmlzaGVzXHJcbiAgZWxlbWVudC5vbmUoJ3RyYW5zaXRpb25lbmQnLCBmaW5pc2gpO1xyXG5cclxuICAvLyBIaWRlcyB0aGUgZWxlbWVudCAoZm9yIG91dCBhbmltYXRpb25zKSwgcmVzZXRzIHRoZSBlbGVtZW50LCBhbmQgcnVucyBhIGNhbGxiYWNrXHJcbiAgZnVuY3Rpb24gZmluaXNoKCkge1xyXG4gICAgaWYgKCFpc0luKSBlbGVtZW50LmhpZGUoKTtcclxuICAgIHJlc2V0KCk7XHJcbiAgICBpZiAoY2IpIGNiLmFwcGx5KGVsZW1lbnQpO1xyXG4gIH1cclxuXHJcbiAgLy8gUmVzZXRzIHRyYW5zaXRpb25zIGFuZCByZW1vdmVzIG1vdGlvbi1zcGVjaWZpYyBjbGFzc2VzXHJcbiAgZnVuY3Rpb24gcmVzZXQoKSB7XHJcbiAgICBlbGVtZW50WzBdLnN0eWxlLnRyYW5zaXRpb25EdXJhdGlvbiA9IDA7XHJcbiAgICBlbGVtZW50LnJlbW92ZUNsYXNzKGluaXRDbGFzcyArICcgJyArIGFjdGl2ZUNsYXNzICsgJyAnICsgYW5pbWF0aW9uKTtcclxuICB9XHJcbn1cclxuXHJcbnZhciBNb3Rpb25VSSA9IHtcclxuICBhbmltYXRlSW46IGZ1bmN0aW9uKGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcclxuICAgIGFuaW1hdGUodHJ1ZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XHJcbiAgfSxcclxuXHJcbiAgYW5pbWF0ZU91dDogZnVuY3Rpb24oZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xyXG4gICAgYW5pbWF0ZShmYWxzZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XHJcbiAgfVxyXG59XHJcbiIsIiQoIGRvY3VtZW50ICkucmVhZHkoZnVuY3Rpb24oKSB7XHJcbiAgICAkKCcuYWNjb3JkaW9uLXRpdGxlJykucHJlcGVuZCgnPGRpdiBjbGFzcz1cImFjY29yZGlvbi1wbHVzLWJ1dHRvblwiPis8L2Rpdj4nKTtcclxufSk7XHJcblxyXG4kKCcuYWNjb3JkaW9uLWV4cGFuZC1hbGwnKS5jbGljayhmdW5jdGlvbigpIHtcclxuICAgIGNvbnNvbGUubG9nKCdDbGlja2VkJyk7XHJcbiAgICAkKCcjYWN0aW9uLXBsYW4nKS5mb3VuZGF0aW9uKCdkb3duJywgJCgnLmFjY29yZGlvbi1jb250ZW50JykpO1xyXG59KTsiLCI7KGZ1bmN0aW9uKCQpIHtcclxuXHJcbiAgZnVuY3Rpb24gYW5pbWF0ZUF1dG8oZWxlbWVudCwgb3B0aW9ucywgZHVyYXRpb24sIGVhc2luZywgY2FsbGJhY2spIHtcclxuXHJcbiAgICB2YXIgJGVsID0gJChlbGVtZW50KSxcclxuICAgICAgICBzZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCAkLmZuLmFuaW1hdGVBdXRvLmRlZmF1bHRzLCBvcHRpb25zKSxcclxuICAgICAgICBkaW1lbnNpb24gPSBzZXR0aW5ncy5kaW1lbnNpb24sXHJcbiAgICAgICAgb3Bwb3NpdGVEaW1lbnNpb24gPSAoZGltZW5zaW9uID09PSAnaGVpZ2h0JykgPyAnd2lkdGgnIDogJ2hlaWdodCc7XHJcblxyXG4gICAgLy8gRGV0ZXJtaW5lIHdoaWNoIGZ1bmN0aW9uIHRvIHJ1biBiYXNlZCBvbiB0aGUgc2V0dGluZyBgYWN0aW9uYC5cclxuICAgIHN3aXRjaCAoc2V0dGluZ3MuYWN0aW9uKSB7XHJcbiAgICAgIGNhc2UgKCdvcGVuJyk6XHJcbiAgICAgICAgb3BlbkVsKCRlbCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgKCdjbG9zZScpOlxyXG4gICAgICAgIGNsb3NlRWwoJGVsKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAoJ3RvZ2dsZScpOlxyXG4gICAgICAgIHRvZ2dsZUVsKCRlbCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdqcXVlcnkuYW5pbWF0ZUF1dG8gb25seSBwZXJmb3JtcyB0aGUgYWN0aW9ucyBcIm9wZW5cIiwgXCJjbG9zZVwiIGFuZCBcInRvZ2dsZVwiLiBZb3Ugc2VlbSB0byBoYXZlIHRyaWVkIHNvbWV0aGluZyBlbHNlLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldFRhcmdldERpbWVuc2lvbigkZWwpIHtcclxuICAgICAgLy8gQ3JlYXRlIGEgaGlkZGVuIGNsb25lIG9mICRlbCwgYXBwZW5kZWQgdG9cclxuICAgICAgLy8gJGVsJ3MgcGFyZW50IGFuZCB3aXRoICRlbCdzIGBvcHBvc2l0ZURpbWVuc2lvbmAsXHJcbiAgICAgIC8vIHRvIGVuc3VyZSBpdCB3aWxsIGhhdmUgZGltZW5zaW9ucyB0YWlsb3JlZCB0b1xyXG4gICAgICAvLyAkZWwncyBjb250ZXh0LlxyXG4gICAgICAvLyBSZXR1cm4gdGhlIGNsb25lJ3MgcmVsZXZhbnQgZGltZW5zaW9uLlxyXG4gICAgICB2YXIgJGNsb25lID0gJGVsLmNsb25lKClcclxuICAgICAgICAuY3NzKHtcclxuICAgICAgICAgIG9wcG9zaXRlRGltZW5zaW9uOiAkZWwuY3NzKG9wcG9zaXRlRGltZW5zaW9uKSxcclxuICAgICAgICAgICd2aXNpYmlsaXR5JzogJ2hpZGRlbidcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hcHBlbmRUbygkZWwucGFyZW50KCkpO1xyXG4gICAgICB2YXIgY2xvbmVDb250ZW50RGltZW5zaW9uID0gJGNsb25lXHJcbiAgICAgICAgLmNzcyhkaW1lbnNpb24sICdhdXRvJylcclxuICAgICAgICAuY3NzKGRpbWVuc2lvbik7XHJcbiAgICAgICRjbG9uZS5yZW1vdmUoKTtcclxuICAgICAgcmV0dXJuIGNsb25lQ29udGVudERpbWVuc2lvbjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBvcGVuRWwoJGVsKSB7XHJcbiAgICAgIC8vIFBhc3MgalF1ZXJ5LmFuaW1hdGUoKSAkZWwncyB0YXJnZXQgZGltZW5zaW9uXHJcbiAgICAgIC8vIGFuZCBhbGwgdGhlIG90aGVyIHBhcmFtZXRlcnMuXHJcbiAgICAgIC8vIEFzIHBhcnQgb2YgdGhlIGNhbGxiYWNrLCBzZXQgJGVsJ3NcclxuICAgICAgLy8gaW5saW5lLXN0eWxlIGRpbWVuc2lvbiB0byBgYXV0b2AuXHJcbiAgICAgIC8vIEFuZCBhZGQgdGhlIGBvcGVuQ2xhc3NgLlxyXG4gICAgICBpZiAoISRlbC5oYXNDbGFzcyhzZXR0aW5ncy5vcGVuQ2xhc3MpKSB7XHJcbiAgICAgICAgdmFyIGFuaW1PYmogPSB7fTtcclxuICAgICAgICBhbmltT2JqW2RpbWVuc2lvbl0gPSBnZXRUYXJnZXREaW1lbnNpb24oJGVsKTtcclxuICAgICAgICAkZWwuYW5pbWF0ZShhbmltT2JqLCBkdXJhdGlvbiwgZWFzaW5nLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICRlbC5jc3MoZGltZW5zaW9uLCAnYXV0bycpO1xyXG4gICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgICAgLmFkZENsYXNzKHNldHRpbmdzLm9wZW5DbGFzcyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjbG9zZUVsKCRlbCkge1xyXG4gICAgICAvLyBQYXNzIGpRdWVyeS5hbmltYXRlKCkgJGVsJ3MgYGNsb3NlZGBcclxuICAgICAgLy8gYW5kIGFsbCB0aGUgb3RoZXIgcGFyYW1ldGVycy5cclxuICAgICAgLy8gQW5kIHJlbW92ZSB0aGUgYG9wZW5DbGFzc2AuXHJcbiAgICAgIGlmICgkZWwuY3NzKGRpbWVuc2lvbikgIT09IHNldHRpbmdzLmNsb3NlZCkge1xyXG4gICAgICAgIHZhciBhbmltT2JqID0ge307XHJcbiAgICAgICAgYW5pbU9ialtkaW1lbnNpb25dID0gc2V0dGluZ3MuY2xvc2VkO1xyXG4gICAgICAgICRlbC5hbmltYXRlKGFuaW1PYmosIGR1cmF0aW9uLCBlYXNpbmcsIGNhbGxiYWNrKVxyXG4gICAgICAgICAgLnJlbW92ZUNsYXNzKHNldHRpbmdzLm9wZW5DbGFzcyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0b2dnbGVFbCgkZWwpIHtcclxuICAgICAgaWYgKCRlbC5oYXNDbGFzcyhzZXR0aW5ncy5vcGVuQ2xhc3MpKSB7XHJcbiAgICAgICAgY2xvc2VFbCgkZWwpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIG9wZW5FbCgkZWwpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBwcm9jZXNzQXJncygpIHtcclxuICAgIC8vIFVzZXIgY2FuIHBhc3MgdGhlIDQgcG9zc2libGUgYXJndW1lbnRzIGluIGFueSBvcmRlci5cclxuICAgIC8vIGBvcHRpb25zYCBhcmUgcGx1Z2lucy1zcGVjaWZpYyBzZXR0aW5ncy5cclxuICAgIC8vIFRoZSBvcHRpb25zIGBkaW1lbnNpb25zYCBhbmQgYGFjdGlvbmAgY2FuIGFsc29cclxuICAgIC8vIGJlIHBhc3NlZCBhcyBpc29sYXRlZCBzdHJpbmdzLlxyXG4gICAgLy8gYGR1cmF0aW9uYCwgYGVhc2luZ2AsIGFuZCBgY2FsbGJhY2tgIGNvcnJlc3BvbmRzIHRvXHJcbiAgICAvLyAoYW5kIGJlY29tZSkgalF1ZXJ5LmFuaW1hdGUoKSBhcmd1bWVudHMuXHJcbiAgICB2YXIgb3B0aW9ucyA9IHt9LFxyXG4gICAgICAgIGNhbGxiYWNrID0gZnVuY3Rpb24oKXt9LFxyXG4gICAgICAgIGR1cmF0aW9uLCBlYXNpbmc7XHJcbiAgICB2YXIgbCA9IGFyZ3VtZW50cy5sZW5ndGg7XHJcbiAgICBmb3IgKHZhciBpPTA7aTxsO2krKykge1xyXG4gICAgICB2YXIgYXJnID0gYXJndW1lbnRzW2ldLFxyXG4gICAgICAgICAgYXJnVHlwZSA9IHR5cGVvZiBhcmc7XHJcbiAgICAgIGlmICghYXJnKSB7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuICAgICAgLy8gQ2hlY2sgZm9yIHByZS1lc3RhYmxpc2hlZCBzdHJpbmcgdmFsdWVzLlxyXG4gICAgICBzd2l0Y2ggKGFyZykge1xyXG4gICAgICAgIC8vIENoZWNrIGZvciBgZGltZW5zaW9uYCBzdHJpbmcuXHJcbiAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICBjYXNlICd3aWR0aCc6XHJcbiAgICAgICAgICAkLmV4dGVuZChvcHRpb25zLCB7IGRpbWVuc2lvbjogYXJnIH0pO1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgLy8gQ2hlY2sgZm9yIGBhY3Rpb25gIHN0cmluZy5cclxuICAgICAgICBjYXNlICdvcGVuJzpcclxuICAgICAgICBjYXNlICdjbG9zZSc6XHJcbiAgICAgICAgY2FzZSAndG9nZ2xlJzpcclxuICAgICAgICAgICQuZXh0ZW5kKG9wdGlvbnMsIHsgYWN0aW9uOiBhcmcgfSk7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAvLyBDaGVjayBmb3IgYGR1cmF0aW9uYCBzdHJpbmcgKGluIGpRdWVyeSBBUEkpLlxyXG4gICAgICAgIGNhc2UgJ2Zhc3QnOlxyXG4gICAgICAgIGNhc2UgJ3Nsb3cnOlxyXG4gICAgICAgICAgZHVyYXRpb24gPSBhcmc7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgfVxyXG4gICAgICAvLyBGb3Igb3RoZXIgYXJndW1lbnRzLlxyXG4gICAgICBzd2l0Y2ggKGFyZ1R5cGUpIHtcclxuICAgICAgICAvLyBOdW1iZXJzIHdpbGwgYWx3YXlzIGJlIGR1cmF0aW9ucy5cclxuICAgICAgICBjYXNlICdudW1iZXInOlxyXG4gICAgICAgICAgZHVyYXRpb24gPSBhcmc7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAvLyBTdHJpbmdzLCBhZnRlciBhYm92ZSBmaWx0ZXJpbmcsIHdpbGxcclxuICAgICAgICAvLyBhbHdheXMgYmUgZWFzaW5nLlxyXG4gICAgICAgIGNhc2UgJ3N0cmluZyc6XHJcbiAgICAgICAgICBlYXNpbmcgPSBhcmc7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAvLyBGdW5jdGlvbnMgd2lsbCBhbHdheXMgYmUgY2FsbGJhY2tzLlxyXG4gICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzpcclxuICAgICAgICAgIGNhbGxiYWNrID0gYXJnO1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgLy8gT2JqZWN0cyB3aWxsIGFsd2F5cyBiZSBhcmd1bWVudHMuXHJcbiAgICAgICAgY2FzZSAnb2JqZWN0JzpcclxuICAgICAgICAgICQuZXh0ZW5kKG9wdGlvbnMsIGFyZyk7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIFtvcHRpb25zLCBkdXJhdGlvbiwgZWFzaW5nLCBjYWxsYmFja107XHJcbiAgfVxyXG5cclxuICAkLmZuLmFuaW1hdGVBdXRvID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgYXJnc0FycmF5ID0gcHJvY2Vzc0FyZ3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICBhbmltYXRlQXV0by5hcHBseShudWxsLCBbdGhpc10uY29uY2F0KGFyZ3NBcnJheSkpO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgJC5mbi5hbmltYXRlQXV0by5kZWZhdWx0cyA9IHtcclxuICAgIGRpbWVuc2lvbjogJ2hlaWdodCcsIC8vIG9yICd3aWR0aCdcclxuICAgIGFjdGlvbjogJ3RvZ2dsZScsIC8vIG9yICdvcGVuJyBvciAnY2xvc2UnXHJcbiAgICBjbG9zZWQ6IDAsXHJcbiAgICBvcGVuQ2xhc3M6ICdpcy1vcGVuZWQnXHJcbiAgfTtcclxuXHJcbn0pKGpRdWVyeSk7IiwialF1ZXJ5KCAnaWZyYW1lW3NyYyo9XCJ5b3V0dWJlLmNvbVwiXScpLndyYXAoXCI8ZGl2IGNsYXNzPSdmbGV4LXZpZGVvIHdpZGVzY3JlZW4nLz5cIik7XHJcbmpRdWVyeSggJ2lmcmFtZVtzcmMqPVwidmltZW8uY29tXCJdJykud3JhcChcIjxkaXYgY2xhc3M9J2ZsZXgtdmlkZW8gd2lkZXNjcmVlbiB2aW1lbycvPlwiKTtcclxuIiwiJChkb2N1bWVudCkuZm91bmRhdGlvbigpOyIsIi8vIEpveXJpZGUgZGVtb1xyXG4kKCcjc3RhcnQtanInKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcclxuICAkKGRvY3VtZW50KS5mb3VuZGF0aW9uKCdqb3lyaWRlJywnc3RhcnQnKTtcclxufSk7IiwiIiwiJCgnLnJlYWQtbW9yZS1saW5rJykuY2xpY2soZnVuY3Rpb24oKSB7XHJcbiAgICAkKCcucmVhZC1tb3JlLWNvbnRlbnQnKS5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XHJcbiAgICAkKCcucmVhZC1tb3JlLWxpbmsnKS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xyXG59KTsiLCJcclxuJCh3aW5kb3cpLmJpbmQoJyBsb2FkIHJlc2l6ZSBvcmllbnRhdGlvbkNoYW5nZSAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgIHZhciBmb290ZXIgPSAkKFwiI2Zvb3Rlci1jb250YWluZXJcIik7XHJcbiAgIHZhciBwb3MgPSBmb290ZXIucG9zaXRpb24oKTtcclxuICAgdmFyIGhlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKTtcclxuICAgaGVpZ2h0ID0gaGVpZ2h0IC0gcG9zLnRvcDtcclxuICAgaGVpZ2h0ID0gaGVpZ2h0IC0gZm9vdGVyLmhlaWdodCgpIC0xO1xyXG5cclxuICAgZnVuY3Rpb24gc3RpY2t5Rm9vdGVyKCkge1xyXG4gICAgIGZvb3Rlci5jc3Moe1xyXG4gICAgICAgICAnbWFyZ2luLXRvcCc6IGhlaWdodCArICdweCdcclxuICAgICB9KTtcclxuICAgfVxyXG5cclxuICAgaWYgKGhlaWdodCA+IDApIHtcclxuICAgICBzdGlja3lGb290ZXIoKTtcclxuICAgfVxyXG59KTtcclxuIiwiJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XHJcbiAgICAkKCcudG9wLWJhci1yaWdodCA+IC5tZW51ID4gbGk6bGFzdC1jaGlsZCcpLmFkZENsYXNzKCd0b3AtYmFyLWRvbmF0ZScpO1xyXG59KTsiXX0=
