(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var bgModule = require('../../app/Background/background.js');

//reset for arrays on app reload
bgModule.resetAtMidnight();


chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.query({active: true, currentWindow: true},function(tabs){
        if(typeof bgModule.prevTab == "undefined"){
            bgModule.prevTab = bgModule.extractDomain(tabs[0].url);
        }else{
            bgModule.updateDeactivationTime(bgModule.prevTab);
            bgModule.prevTab = bgModule.extractDomain(tabs[0].url);
        }
    });
    chrome.tabs.get(activeInfo.tabId, function(tab){
        if(chrome.runtime.lastError){
            var errorMsg = chrome.runtime.lastError.message;
            console.error(errorMsg);
        }else{
            if(tab.active && tab.url != "chrome://newtab/"){
                bgModule.tabUpdatedAndActive(tab.url, tab.favIconUrl);
                bgModule.globalURL = tab.url;
            }
        }
    });
});

//Check if the tab is Updated
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if(tab.url != "chrome://newtab/"){
      //check for anactive tab reloading
      if (tab.active) {
          //comapre if the domain is the same
          if (!tab.url.includes(bgModule.extractDomain(bgModule.globalURL))) {
              if (changeInfo.status == "complete" && tab.status == "complete" && tab.url != undefined) {
                  if (tab.active && tab.url != "chrome://newtab/") {
                      bgModule.tabUpdatedAndActive(tab.url, tab.favIconUrl);
                      bgModule.updateDeactivationTime(bgModule.prevTab);
                      bgModule.prevTab = bgModule.extractDomain(tab.url);
                      bgModule.globalURL = tab.url;
                  }
              }
          }
      }
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "popup") {
        //get websites
        chrome.storage.local.get('websiteList', function (data) {
          // Notify that we saved.
          console.log('websiteList pulled');
          console.log(data);

        });
        //get blacklist
        chrome.storage.local.get('blackList', function (data) {
          // Notify that we saved.
          console.log('blackList pulled');
          console.log(data);
        });
        //get topTenYesterday
        chrome.storage.local.get('pastDays', function (data) {
          // Notify that we saved.
          console.log('pastDays pulled');
          console.log(data);
        });
        //get totalVisits
        bgModule.updateTotalVisits(bgModule.websiteList);
    }
    if (request.action == "remove") {
        bgModule.websiteList = request.list;
        chrome.storage.local.set({'websiteList': bgModule.websiteList}, function() {});
    }
    if(request.action == "updateBlackList"){
      bgModule.blackList = request.blackList;
      chrome.storage.local.set({'blackList': bgModule.blackList}, function() {
      });
    }
});




// Check if chome is out of focus or pc in sleep mode
chrome.windows.onFocusChanged.addListener(function(window) {
    if (window === chrome.windows.WINDOW_ID_NONE) {
        bgModule.inFocus = false;
        if(bgModule.prevTab !== ""){
          bgModule.updateDeactivationTime(bgModule.prevTab);
        }
        bgModule.globalURL = bgModule.prevTab;
        console.log("chrome is not active");
    } else {
        bgModule.inFocus = true;
        chrome.tabs.query({active: true, currentWindow: true},function(tabs){
          if(bgModule.prevTab !== ""){
              bgModule.tabUpdatedAndActive(bgModule.extractDomain(tabs[0].url));
              bgModule.prevTab = bgModule.extractDomain(tabs[0].url);
              bgModule.globalURL = bgModule.extractDomain(tabs[0].url);
          }
        });
        console.log("chrome is active");
    }
});

},{"../../app/Background/background.js":2}],2:[function(require,module,exports){

var moment = require('moment');
var bgModule = {
    pastDays : [],
    websiteList: [],
    topTenYesterday: [],
    blackList: ["newtab", "google.", "chrome://", "localhost", "chrome-extension://","about:blank"],
    globalUrl: "",
    prevTab: "",
    daysfrominstall: 0,
    inFocus: false,
    formatedDate: moment().format("DDMMYYYY"),
    total:{
      "totalVisits": 0
    },
    blackListInit: function(){
      chrome.storage.local.set({'blackList': bgModule.blackList}, function() {});
      chrome.storage.local.set({'pastDays': bgModule.pastDays}, function() {});
    },
    resetBlackList: function(){
      chrome.storage.local.set({'blackList': []}, function() {
      });
    },
    resetWebsiteList: function(){
      chrome.storage.local.set({'websiteList': []}, function() {
      });
    },
    updateTotalVisits: function(list){

      if(list.length>10){
        for(var i = 0; i < 10; i++){
          bgModule.total.totalVisits += list[i].websiteVisits;
        }
      }else{
        for(var f = 0; f < list.length; f++){
          bgModule.total.totalVisits += list[f].websiteVisits;
        }
      }
      //TODO add total time
    },
    resetAtMidnight: function(){
      var timeNow = moment();
      var endOfTheDay = moment().endOf('day');
      var nextReset = moment.duration(moment(endOfTheDay).diff(timeNow));

      setTimeout(function() {
        'use strict';
        bgModule.formatedDate = moment().format("DDMMYYYY");
        console.log(bgModule.formatedDate);
        console.log("day reset test activated");
        bgModule.daysfrominstall++;
        console.log("daysfrominstall "+bgModule.daysfrominstall);

        //sort list by visits
        //maybe saparate method
        bgModule.websiteList = bgModule.websiteList.sort(function(a,b){
          return b.websiteVisits - a.websiteVisits;
        });

        //save past day
        //maybe saparate method
        //TODO this doubles the value if popup is open as same time
        bgModule.updateTotalVisits(bgModule.websiteList);
        var pastDay = {
              "name": bgModule.formatedDate,
              "totalVisits": bgModule.total.totalVisits,
              "websiteList": bgModule.websiteList.slice(0, 10)
          };
        bgModule.pastDays.unshift(pastDay);
        //save pastdays
        chrome.storage.local.set({'pastDays': bgModule.pastDays}, function() {});
        //loop ony 7 days (7 objects)
        //maybe saparate method
        if(bgModule.pastDays.length > 6){
           bgModule.pastDays.splice(-1,1);
           chrome.storage.local.set({'pastDays': bgModule.pastDays}, function() {});
        }

        console.log(bgModule.pastDays);

        //reset values
        //maybe saparate method
        bgModule.total.totalVisits = 0;
        bgModule.websiteList = [];
        //save changes to chrome strage
        bgModule.resetAtMidnight();


      }, 30000);//nextReset
    },
    extractDomain: function (url){
      if (url !== undefined) {
          //vars
          var domain;
          var regex = /(\..*){2,}/;

          //find & remove protocol (http, ftp, etc.) and get domain
          if (url.indexOf("://") > -1) {
              domain = url.split('/')[2];
          } else {
              domain = url.split('/')[0];
          }
          //find & remove port number
          domain = domain.split(':')[0];

          //removes everything before 1 dot - like: "www"
          if (regex.test(domain)) {
              domain = domain.substring(domain.indexOf(".") + 1);
          }
          var arr = domain.match(/[.]/gi);
          if(arr == null){
             return "";
          }
          var counter = arr.length;
          while(counter > 1){
              domain = domain.substr(domain.indexOf('.')+1);
              counter--;
          }
          return domain;
      }
      return "";
    },
    search: function (websiteName){
      for (var i = 0; i < bgModule.websiteList.length; i++) {
          if (bgModule.websiteList[i].websiteName === websiteName) {
              return bgModule.websiteList[i];
          }
      }
      return null;
    },
    blackListCheck: function (websiteName) {
      for (var b = 0; b < bgModule.blackList.length; b++) {
          if (websiteName.includes(bgModule.blackList[b])) {
              return true;
          }
      }
      return false;
    },
    saveData: function(){
      chrome.storage.local.set({'websiteList': bgModule.websiteList}, function() {
      });
      chrome.storage.local.set({'blackList': bgModule.blackList}, function() {
      });
    },
    updateDeactivationTime: function (tabURL) {
      var websiteName = bgModule.extractDomain(tabURL);
      var existingWebsite = bgModule.search(websiteName);
      if (existingWebsite) {
          var deactivationTime = moment().format();
          var duration = moment.duration(moment(deactivationTime).diff(existingWebsite.startTime));

          if (existingWebsite.timeDifference != null) {
              duration = duration.add(existingWebsite.timeDifference);
          }
          //format time
          var days = duration.days();
          var hours = duration.hours();
          var min = duration.minutes();
          var sec = duration.seconds();
          var formatedTime = {
              "days": days,
              "hours": hours,
              "min": min,
              "sec": sec
          };
          //update values
          existingWebsite.deactivationTime = deactivationTime;
          existingWebsite.timeDifference = duration;
          existingWebsite.formatedTime = formatedTime;
      }
      bgModule.saveData();
    },
    tabUpdatedAndActive: function (newUrl, favIcon) {
      //blacklist check
      if (bgModule.blackListCheck(newUrl) == false) {
          var websiteName = bgModule.extractDomain(newUrl);
          var existingWebsite = bgModule.search(websiteName);
          var start = moment().format();
          //favicon check
          if (favIcon === undefined) {
              favIcon = "/assets/images/default_icon.png";
          }
          if (!existingWebsite) {
              //max 30 website cap for faster loading
              if(bgModule.websiteList.length >=30){
                return;
              }
              //add new website to the list
              var website = {
                  websiteName: websiteName,
                  favIcon: favIcon,
                  websiteVisits: 1,
                  startTime: start,
                  deactivationTime: "",
              };
              bgModule.websiteList.push(website);
          } else {
              if (existingWebsite.favIcon == "/assets/images/default_icon.png") {
                  existingWebsite.favIcon = favIcon;
              }
              //add tab start time
              existingWebsite.startTime = start;
              //add visits
              existingWebsite.websiteVisits++;
          }
          bgModule.saveData();
      } else {
          //log if blocked
          console.log("blocked website: " + newUrl);
      }
    }
};
module.exports = bgModule;

},{"moment":3}],3:[function(require,module,exports){
//! moment.js
//! version : 2.19.2
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, (function () { 'use strict';

var hookCallback;

function hooks () {
    return hookCallback.apply(null, arguments);
}

// This is done to register the method called with moment()
// without creating circular dependencies.
function setHookCallback (callback) {
    hookCallback = callback;
}

function isArray(input) {
    return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
}

function isObject(input) {
    // IE8 will treat undefined and null as object if it wasn't for
    // input != null
    return input != null && Object.prototype.toString.call(input) === '[object Object]';
}

function isObjectEmpty(obj) {
    if (Object.getOwnPropertyNames) {
        return (Object.getOwnPropertyNames(obj).length === 0);
    } else {
        var k;
        for (k in obj) {
            if (obj.hasOwnProperty(k)) {
                return false;
            }
        }
        return true;
    }
}

function isUndefined(input) {
    return input === void 0;
}

function isNumber(input) {
    return typeof input === 'number' || Object.prototype.toString.call(input) === '[object Number]';
}

function isDate(input) {
    return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
}

function map(arr, fn) {
    var res = [], i;
    for (i = 0; i < arr.length; ++i) {
        res.push(fn(arr[i], i));
    }
    return res;
}

function hasOwnProp(a, b) {
    return Object.prototype.hasOwnProperty.call(a, b);
}

function extend(a, b) {
    for (var i in b) {
        if (hasOwnProp(b, i)) {
            a[i] = b[i];
        }
    }

    if (hasOwnProp(b, 'toString')) {
        a.toString = b.toString;
    }

    if (hasOwnProp(b, 'valueOf')) {
        a.valueOf = b.valueOf;
    }

    return a;
}

function createUTC (input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, true).utc();
}

function defaultParsingFlags() {
    // We need to deep clone this object.
    return {
        empty           : false,
        unusedTokens    : [],
        unusedInput     : [],
        overflow        : -2,
        charsLeftOver   : 0,
        nullInput       : false,
        invalidMonth    : null,
        invalidFormat   : false,
        userInvalidated : false,
        iso             : false,
        parsedDateParts : [],
        meridiem        : null,
        rfc2822         : false,
        weekdayMismatch : false
    };
}

function getParsingFlags(m) {
    if (m._pf == null) {
        m._pf = defaultParsingFlags();
    }
    return m._pf;
}

var some;
if (Array.prototype.some) {
    some = Array.prototype.some;
} else {
    some = function (fun) {
        var t = Object(this);
        var len = t.length >>> 0;

        for (var i = 0; i < len; i++) {
            if (i in t && fun.call(this, t[i], i, t)) {
                return true;
            }
        }

        return false;
    };
}

function isValid(m) {
    if (m._isValid == null) {
        var flags = getParsingFlags(m);
        var parsedParts = some.call(flags.parsedDateParts, function (i) {
            return i != null;
        });
        var isNowValid = !isNaN(m._d.getTime()) &&
            flags.overflow < 0 &&
            !flags.empty &&
            !flags.invalidMonth &&
            !flags.invalidWeekday &&
            !flags.weekdayMismatch &&
            !flags.nullInput &&
            !flags.invalidFormat &&
            !flags.userInvalidated &&
            (!flags.meridiem || (flags.meridiem && parsedParts));

        if (m._strict) {
            isNowValid = isNowValid &&
                flags.charsLeftOver === 0 &&
                flags.unusedTokens.length === 0 &&
                flags.bigHour === undefined;
        }

        if (Object.isFrozen == null || !Object.isFrozen(m)) {
            m._isValid = isNowValid;
        }
        else {
            return isNowValid;
        }
    }
    return m._isValid;
}

function createInvalid (flags) {
    var m = createUTC(NaN);
    if (flags != null) {
        extend(getParsingFlags(m), flags);
    }
    else {
        getParsingFlags(m).userInvalidated = true;
    }

    return m;
}

// Plugins that add properties should also add the key here (null value),
// so we can properly clone ourselves.
var momentProperties = hooks.momentProperties = [];

function copyConfig(to, from) {
    var i, prop, val;

    if (!isUndefined(from._isAMomentObject)) {
        to._isAMomentObject = from._isAMomentObject;
    }
    if (!isUndefined(from._i)) {
        to._i = from._i;
    }
    if (!isUndefined(from._f)) {
        to._f = from._f;
    }
    if (!isUndefined(from._l)) {
        to._l = from._l;
    }
    if (!isUndefined(from._strict)) {
        to._strict = from._strict;
    }
    if (!isUndefined(from._tzm)) {
        to._tzm = from._tzm;
    }
    if (!isUndefined(from._isUTC)) {
        to._isUTC = from._isUTC;
    }
    if (!isUndefined(from._offset)) {
        to._offset = from._offset;
    }
    if (!isUndefined(from._pf)) {
        to._pf = getParsingFlags(from);
    }
    if (!isUndefined(from._locale)) {
        to._locale = from._locale;
    }

    if (momentProperties.length > 0) {
        for (i = 0; i < momentProperties.length; i++) {
            prop = momentProperties[i];
            val = from[prop];
            if (!isUndefined(val)) {
                to[prop] = val;
            }
        }
    }

    return to;
}

var updateInProgress = false;

// Moment prototype object
function Moment(config) {
    copyConfig(this, config);
    this._d = new Date(config._d != null ? config._d.getTime() : NaN);
    if (!this.isValid()) {
        this._d = new Date(NaN);
    }
    // Prevent infinite loop in case updateOffset creates new moment
    // objects.
    if (updateInProgress === false) {
        updateInProgress = true;
        hooks.updateOffset(this);
        updateInProgress = false;
    }
}

function isMoment (obj) {
    return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
}

function absFloor (number) {
    if (number < 0) {
        // -0 -> 0
        return Math.ceil(number) || 0;
    } else {
        return Math.floor(number);
    }
}

function toInt(argumentForCoercion) {
    var coercedNumber = +argumentForCoercion,
        value = 0;

    if (coercedNumber !== 0 && isFinite(coercedNumber)) {
        value = absFloor(coercedNumber);
    }

    return value;
}

// compare two arrays, return the number of differences
function compareArrays(array1, array2, dontConvert) {
    var len = Math.min(array1.length, array2.length),
        lengthDiff = Math.abs(array1.length - array2.length),
        diffs = 0,
        i;
    for (i = 0; i < len; i++) {
        if ((dontConvert && array1[i] !== array2[i]) ||
            (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
            diffs++;
        }
    }
    return diffs + lengthDiff;
}

function warn(msg) {
    if (hooks.suppressDeprecationWarnings === false &&
            (typeof console !==  'undefined') && console.warn) {
        console.warn('Deprecation warning: ' + msg);
    }
}

function deprecate(msg, fn) {
    var firstTime = true;

    return extend(function () {
        if (hooks.deprecationHandler != null) {
            hooks.deprecationHandler(null, msg);
        }
        if (firstTime) {
            var args = [];
            var arg;
            for (var i = 0; i < arguments.length; i++) {
                arg = '';
                if (typeof arguments[i] === 'object') {
                    arg += '\n[' + i + '] ';
                    for (var key in arguments[0]) {
                        arg += key + ': ' + arguments[0][key] + ', ';
                    }
                    arg = arg.slice(0, -2); // Remove trailing comma and space
                } else {
                    arg = arguments[i];
                }
                args.push(arg);
            }
            warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + (new Error()).stack);
            firstTime = false;
        }
        return fn.apply(this, arguments);
    }, fn);
}

var deprecations = {};

function deprecateSimple(name, msg) {
    if (hooks.deprecationHandler != null) {
        hooks.deprecationHandler(name, msg);
    }
    if (!deprecations[name]) {
        warn(msg);
        deprecations[name] = true;
    }
}

hooks.suppressDeprecationWarnings = false;
hooks.deprecationHandler = null;

function isFunction(input) {
    return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
}

function set (config) {
    var prop, i;
    for (i in config) {
        prop = config[i];
        if (isFunction(prop)) {
            this[i] = prop;
        } else {
            this['_' + i] = prop;
        }
    }
    this._config = config;
    // Lenient ordinal parsing accepts just a number in addition to
    // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
    // TODO: Remove "ordinalParse" fallback in next major release.
    this._dayOfMonthOrdinalParseLenient = new RegExp(
        (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
            '|' + (/\d{1,2}/).source);
}

function mergeConfigs(parentConfig, childConfig) {
    var res = extend({}, parentConfig), prop;
    for (prop in childConfig) {
        if (hasOwnProp(childConfig, prop)) {
            if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                res[prop] = {};
                extend(res[prop], parentConfig[prop]);
                extend(res[prop], childConfig[prop]);
            } else if (childConfig[prop] != null) {
                res[prop] = childConfig[prop];
            } else {
                delete res[prop];
            }
        }
    }
    for (prop in parentConfig) {
        if (hasOwnProp(parentConfig, prop) &&
                !hasOwnProp(childConfig, prop) &&
                isObject(parentConfig[prop])) {
            // make sure changes to properties don't modify parent config
            res[prop] = extend({}, res[prop]);
        }
    }
    return res;
}

function Locale(config) {
    if (config != null) {
        this.set(config);
    }
}

var keys;

if (Object.keys) {
    keys = Object.keys;
} else {
    keys = function (obj) {
        var i, res = [];
        for (i in obj) {
            if (hasOwnProp(obj, i)) {
                res.push(i);
            }
        }
        return res;
    };
}

var defaultCalendar = {
    sameDay : '[Today at] LT',
    nextDay : '[Tomorrow at] LT',
    nextWeek : 'dddd [at] LT',
    lastDay : '[Yesterday at] LT',
    lastWeek : '[Last] dddd [at] LT',
    sameElse : 'L'
};

function calendar (key, mom, now) {
    var output = this._calendar[key] || this._calendar['sameElse'];
    return isFunction(output) ? output.call(mom, now) : output;
}

var defaultLongDateFormat = {
    LTS  : 'h:mm:ss A',
    LT   : 'h:mm A',
    L    : 'MM/DD/YYYY',
    LL   : 'MMMM D, YYYY',
    LLL  : 'MMMM D, YYYY h:mm A',
    LLLL : 'dddd, MMMM D, YYYY h:mm A'
};

function longDateFormat (key) {
    var format = this._longDateFormat[key],
        formatUpper = this._longDateFormat[key.toUpperCase()];

    if (format || !formatUpper) {
        return format;
    }

    this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
        return val.slice(1);
    });

    return this._longDateFormat[key];
}

var defaultInvalidDate = 'Invalid date';

function invalidDate () {
    return this._invalidDate;
}

var defaultOrdinal = '%d';
var defaultDayOfMonthOrdinalParse = /\d{1,2}/;

function ordinal (number) {
    return this._ordinal.replace('%d', number);
}

var defaultRelativeTime = {
    future : 'in %s',
    past   : '%s ago',
    s  : 'a few seconds',
    ss : '%d seconds',
    m  : 'a minute',
    mm : '%d minutes',
    h  : 'an hour',
    hh : '%d hours',
    d  : 'a day',
    dd : '%d days',
    M  : 'a month',
    MM : '%d months',
    y  : 'a year',
    yy : '%d years'
};

function relativeTime (number, withoutSuffix, string, isFuture) {
    var output = this._relativeTime[string];
    return (isFunction(output)) ?
        output(number, withoutSuffix, string, isFuture) :
        output.replace(/%d/i, number);
}

function pastFuture (diff, output) {
    var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
    return isFunction(format) ? format(output) : format.replace(/%s/i, output);
}

var aliases = {};

function addUnitAlias (unit, shorthand) {
    var lowerCase = unit.toLowerCase();
    aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
}

function normalizeUnits(units) {
    return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
}

function normalizeObjectUnits(inputObject) {
    var normalizedInput = {},
        normalizedProp,
        prop;

    for (prop in inputObject) {
        if (hasOwnProp(inputObject, prop)) {
            normalizedProp = normalizeUnits(prop);
            if (normalizedProp) {
                normalizedInput[normalizedProp] = inputObject[prop];
            }
        }
    }

    return normalizedInput;
}

var priorities = {};

function addUnitPriority(unit, priority) {
    priorities[unit] = priority;
}

function getPrioritizedUnits(unitsObj) {
    var units = [];
    for (var u in unitsObj) {
        units.push({unit: u, priority: priorities[u]});
    }
    units.sort(function (a, b) {
        return a.priority - b.priority;
    });
    return units;
}

function zeroFill(number, targetLength, forceSign) {
    var absNumber = '' + Math.abs(number),
        zerosToFill = targetLength - absNumber.length,
        sign = number >= 0;
    return (sign ? (forceSign ? '+' : '') : '-') +
        Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
}

var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

var formatFunctions = {};

var formatTokenFunctions = {};

// token:    'M'
// padded:   ['MM', 2]
// ordinal:  'Mo'
// callback: function () { this.month() + 1 }
function addFormatToken (token, padded, ordinal, callback) {
    var func = callback;
    if (typeof callback === 'string') {
        func = function () {
            return this[callback]();
        };
    }
    if (token) {
        formatTokenFunctions[token] = func;
    }
    if (padded) {
        formatTokenFunctions[padded[0]] = function () {
            return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
        };
    }
    if (ordinal) {
        formatTokenFunctions[ordinal] = function () {
            return this.localeData().ordinal(func.apply(this, arguments), token);
        };
    }
}

function removeFormattingTokens(input) {
    if (input.match(/\[[\s\S]/)) {
        return input.replace(/^\[|\]$/g, '');
    }
    return input.replace(/\\/g, '');
}

function makeFormatFunction(format) {
    var array = format.match(formattingTokens), i, length;

    for (i = 0, length = array.length; i < length; i++) {
        if (formatTokenFunctions[array[i]]) {
            array[i] = formatTokenFunctions[array[i]];
        } else {
            array[i] = removeFormattingTokens(array[i]);
        }
    }

    return function (mom) {
        var output = '', i;
        for (i = 0; i < length; i++) {
            output += isFunction(array[i]) ? array[i].call(mom, format) : array[i];
        }
        return output;
    };
}

// format date using native date object
function formatMoment(m, format) {
    if (!m.isValid()) {
        return m.localeData().invalidDate();
    }

    format = expandFormat(format, m.localeData());
    formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

    return formatFunctions[format](m);
}

function expandFormat(format, locale) {
    var i = 5;

    function replaceLongDateFormatTokens(input) {
        return locale.longDateFormat(input) || input;
    }

    localFormattingTokens.lastIndex = 0;
    while (i >= 0 && localFormattingTokens.test(format)) {
        format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
        localFormattingTokens.lastIndex = 0;
        i -= 1;
    }

    return format;
}

var match1         = /\d/;            //       0 - 9
var match2         = /\d\d/;          //      00 - 99
var match3         = /\d{3}/;         //     000 - 999
var match4         = /\d{4}/;         //    0000 - 9999
var match6         = /[+-]?\d{6}/;    // -999999 - 999999
var match1to2      = /\d\d?/;         //       0 - 99
var match3to4      = /\d\d\d\d?/;     //     999 - 9999
var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
var match1to3      = /\d{1,3}/;       //       0 - 999
var match1to4      = /\d{1,4}/;       //       0 - 9999
var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

var matchUnsigned  = /\d+/;           //       0 - inf
var matchSigned    = /[+-]?\d+/;      //    -inf - inf

var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

// any word (or two) characters or numbers including two/three word month in arabic.
// includes scottish gaelic two word and hyphenated months
var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;


var regexes = {};

function addRegexToken (token, regex, strictRegex) {
    regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
        return (isStrict && strictRegex) ? strictRegex : regex;
    };
}

function getParseRegexForToken (token, config) {
    if (!hasOwnProp(regexes, token)) {
        return new RegExp(unescapeFormat(token));
    }

    return regexes[token](config._strict, config._locale);
}

// Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
function unescapeFormat(s) {
    return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
        return p1 || p2 || p3 || p4;
    }));
}

function regexEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

var tokens = {};

function addParseToken (token, callback) {
    var i, func = callback;
    if (typeof token === 'string') {
        token = [token];
    }
    if (isNumber(callback)) {
        func = function (input, array) {
            array[callback] = toInt(input);
        };
    }
    for (i = 0; i < token.length; i++) {
        tokens[token[i]] = func;
    }
}

function addWeekParseToken (token, callback) {
    addParseToken(token, function (input, array, config, token) {
        config._w = config._w || {};
        callback(input, config._w, config, token);
    });
}

function addTimeToArrayFromToken(token, input, config) {
    if (input != null && hasOwnProp(tokens, token)) {
        tokens[token](input, config._a, config, token);
    }
}

var YEAR = 0;
var MONTH = 1;
var DATE = 2;
var HOUR = 3;
var MINUTE = 4;
var SECOND = 5;
var MILLISECOND = 6;
var WEEK = 7;
var WEEKDAY = 8;

// FORMATTING

addFormatToken('Y', 0, 0, function () {
    var y = this.year();
    return y <= 9999 ? '' + y : '+' + y;
});

addFormatToken(0, ['YY', 2], 0, function () {
    return this.year() % 100;
});

addFormatToken(0, ['YYYY',   4],       0, 'year');
addFormatToken(0, ['YYYYY',  5],       0, 'year');
addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

// ALIASES

addUnitAlias('year', 'y');

// PRIORITIES

addUnitPriority('year', 1);

// PARSING

addRegexToken('Y',      matchSigned);
addRegexToken('YY',     match1to2, match2);
addRegexToken('YYYY',   match1to4, match4);
addRegexToken('YYYYY',  match1to6, match6);
addRegexToken('YYYYYY', match1to6, match6);

addParseToken(['YYYYY', 'YYYYYY'], YEAR);
addParseToken('YYYY', function (input, array) {
    array[YEAR] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
});
addParseToken('YY', function (input, array) {
    array[YEAR] = hooks.parseTwoDigitYear(input);
});
addParseToken('Y', function (input, array) {
    array[YEAR] = parseInt(input, 10);
});

// HELPERS

function daysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// HOOKS

hooks.parseTwoDigitYear = function (input) {
    return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
};

// MOMENTS

var getSetYear = makeGetSet('FullYear', true);

function getIsLeapYear () {
    return isLeapYear(this.year());
}

function makeGetSet (unit, keepTime) {
    return function (value) {
        if (value != null) {
            set$1(this, unit, value);
            hooks.updateOffset(this, keepTime);
            return this;
        } else {
            return get(this, unit);
        }
    };
}

function get (mom, unit) {
    return mom.isValid() ?
        mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
}

function set$1 (mom, unit, value) {
    if (mom.isValid() && !isNaN(value)) {
        if (unit === 'FullYear' && isLeapYear(mom.year()) && mom.month() === 1 && mom.date() === 29) {
            mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value, mom.month(), daysInMonth(value, mom.month()));
        }
        else {
            mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }
}

// MOMENTS

function stringGet (units) {
    units = normalizeUnits(units);
    if (isFunction(this[units])) {
        return this[units]();
    }
    return this;
}


function stringSet (units, value) {
    if (typeof units === 'object') {
        units = normalizeObjectUnits(units);
        var prioritized = getPrioritizedUnits(units);
        for (var i = 0; i < prioritized.length; i++) {
            this[prioritized[i].unit](units[prioritized[i].unit]);
        }
    } else {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units](value);
        }
    }
    return this;
}

function mod(n, x) {
    return ((n % x) + x) % x;
}

var indexOf;

if (Array.prototype.indexOf) {
    indexOf = Array.prototype.indexOf;
} else {
    indexOf = function (o) {
        // I know
        var i;
        for (i = 0; i < this.length; ++i) {
            if (this[i] === o) {
                return i;
            }
        }
        return -1;
    };
}

function daysInMonth(year, month) {
    if (isNaN(year) || isNaN(month)) {
        return NaN;
    }
    var modMonth = mod(month, 12);
    year += (month - modMonth) / 12;
    return modMonth === 1 ? (isLeapYear(year) ? 29 : 28) : (31 - modMonth % 7 % 2);
}

// FORMATTING

addFormatToken('M', ['MM', 2], 'Mo', function () {
    return this.month() + 1;
});

addFormatToken('MMM', 0, 0, function (format) {
    return this.localeData().monthsShort(this, format);
});

addFormatToken('MMMM', 0, 0, function (format) {
    return this.localeData().months(this, format);
});

// ALIASES

addUnitAlias('month', 'M');

// PRIORITY

addUnitPriority('month', 8);

// PARSING

addRegexToken('M',    match1to2);
addRegexToken('MM',   match1to2, match2);
addRegexToken('MMM',  function (isStrict, locale) {
    return locale.monthsShortRegex(isStrict);
});
addRegexToken('MMMM', function (isStrict, locale) {
    return locale.monthsRegex(isStrict);
});

addParseToken(['M', 'MM'], function (input, array) {
    array[MONTH] = toInt(input) - 1;
});

addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
    var month = config._locale.monthsParse(input, token, config._strict);
    // if we didn't find a month name, mark the date as invalid.
    if (month != null) {
        array[MONTH] = month;
    } else {
        getParsingFlags(config).invalidMonth = input;
    }
});

// LOCALES

var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/;
var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
function localeMonths (m, format) {
    if (!m) {
        return isArray(this._months) ? this._months :
            this._months['standalone'];
    }
    return isArray(this._months) ? this._months[m.month()] :
        this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
}

var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
function localeMonthsShort (m, format) {
    if (!m) {
        return isArray(this._monthsShort) ? this._monthsShort :
            this._monthsShort['standalone'];
    }
    return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
        this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
}

function handleStrictParse(monthName, format, strict) {
    var i, ii, mom, llc = monthName.toLocaleLowerCase();
    if (!this._monthsParse) {
        // this is not used
        this._monthsParse = [];
        this._longMonthsParse = [];
        this._shortMonthsParse = [];
        for (i = 0; i < 12; ++i) {
            mom = createUTC([2000, i]);
            this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
            this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
        }
    }

    if (strict) {
        if (format === 'MMM') {
            ii = indexOf.call(this._shortMonthsParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf.call(this._longMonthsParse, llc);
            return ii !== -1 ? ii : null;
        }
    } else {
        if (format === 'MMM') {
            ii = indexOf.call(this._shortMonthsParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf.call(this._longMonthsParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf.call(this._longMonthsParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf.call(this._shortMonthsParse, llc);
            return ii !== -1 ? ii : null;
        }
    }
}

function localeMonthsParse (monthName, format, strict) {
    var i, mom, regex;

    if (this._monthsParseExact) {
        return handleStrictParse.call(this, monthName, format, strict);
    }

    if (!this._monthsParse) {
        this._monthsParse = [];
        this._longMonthsParse = [];
        this._shortMonthsParse = [];
    }

    // TODO: add sorting
    // Sorting makes sure if one month (or abbr) is a prefix of another
    // see sorting in computeMonthsParse
    for (i = 0; i < 12; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, i]);
        if (strict && !this._longMonthsParse[i]) {
            this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
            this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
        }
        if (!strict && !this._monthsParse[i]) {
            regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
            this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
        if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
            return i;
        } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
            return i;
        } else if (!strict && this._monthsParse[i].test(monthName)) {
            return i;
        }
    }
}

// MOMENTS

function setMonth (mom, value) {
    var dayOfMonth;

    if (!mom.isValid()) {
        // No op
        return mom;
    }

    if (typeof value === 'string') {
        if (/^\d+$/.test(value)) {
            value = toInt(value);
        } else {
            value = mom.localeData().monthsParse(value);
            // TODO: Another silent failure?
            if (!isNumber(value)) {
                return mom;
            }
        }
    }

    dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
    mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
    return mom;
}

function getSetMonth (value) {
    if (value != null) {
        setMonth(this, value);
        hooks.updateOffset(this, true);
        return this;
    } else {
        return get(this, 'Month');
    }
}

function getDaysInMonth () {
    return daysInMonth(this.year(), this.month());
}

var defaultMonthsShortRegex = matchWord;
function monthsShortRegex (isStrict) {
    if (this._monthsParseExact) {
        if (!hasOwnProp(this, '_monthsRegex')) {
            computeMonthsParse.call(this);
        }
        if (isStrict) {
            return this._monthsShortStrictRegex;
        } else {
            return this._monthsShortRegex;
        }
    } else {
        if (!hasOwnProp(this, '_monthsShortRegex')) {
            this._monthsShortRegex = defaultMonthsShortRegex;
        }
        return this._monthsShortStrictRegex && isStrict ?
            this._monthsShortStrictRegex : this._monthsShortRegex;
    }
}

var defaultMonthsRegex = matchWord;
function monthsRegex (isStrict) {
    if (this._monthsParseExact) {
        if (!hasOwnProp(this, '_monthsRegex')) {
            computeMonthsParse.call(this);
        }
        if (isStrict) {
            return this._monthsStrictRegex;
        } else {
            return this._monthsRegex;
        }
    } else {
        if (!hasOwnProp(this, '_monthsRegex')) {
            this._monthsRegex = defaultMonthsRegex;
        }
        return this._monthsStrictRegex && isStrict ?
            this._monthsStrictRegex : this._monthsRegex;
    }
}

function computeMonthsParse () {
    function cmpLenRev(a, b) {
        return b.length - a.length;
    }

    var shortPieces = [], longPieces = [], mixedPieces = [],
        i, mom;
    for (i = 0; i < 12; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, i]);
        shortPieces.push(this.monthsShort(mom, ''));
        longPieces.push(this.months(mom, ''));
        mixedPieces.push(this.months(mom, ''));
        mixedPieces.push(this.monthsShort(mom, ''));
    }
    // Sorting makes sure if one month (or abbr) is a prefix of another it
    // will match the longer piece.
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    for (i = 0; i < 12; i++) {
        shortPieces[i] = regexEscape(shortPieces[i]);
        longPieces[i] = regexEscape(longPieces[i]);
    }
    for (i = 0; i < 24; i++) {
        mixedPieces[i] = regexEscape(mixedPieces[i]);
    }

    this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._monthsShortRegex = this._monthsRegex;
    this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
}

function createDate (y, m, d, h, M, s, ms) {
    // can't just apply() to create a date:
    // https://stackoverflow.com/q/181348
    var date = new Date(y, m, d, h, M, s, ms);

    // the date constructor remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
        date.setFullYear(y);
    }
    return date;
}

function createUTCDate (y) {
    var date = new Date(Date.UTC.apply(null, arguments));

    // the Date.UTC function remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
        date.setUTCFullYear(y);
    }
    return date;
}

// start-of-first-week - start-of-year
function firstWeekOffset(year, dow, doy) {
    var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
        fwd = 7 + dow - doy,
        // first-week day local weekday -- which local weekday is fwd
        fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

    return -fwdlw + fwd - 1;
}

// https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
    var localWeekday = (7 + weekday - dow) % 7,
        weekOffset = firstWeekOffset(year, dow, doy),
        dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
        resYear, resDayOfYear;

    if (dayOfYear <= 0) {
        resYear = year - 1;
        resDayOfYear = daysInYear(resYear) + dayOfYear;
    } else if (dayOfYear > daysInYear(year)) {
        resYear = year + 1;
        resDayOfYear = dayOfYear - daysInYear(year);
    } else {
        resYear = year;
        resDayOfYear = dayOfYear;
    }

    return {
        year: resYear,
        dayOfYear: resDayOfYear
    };
}

function weekOfYear(mom, dow, doy) {
    var weekOffset = firstWeekOffset(mom.year(), dow, doy),
        week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
        resWeek, resYear;

    if (week < 1) {
        resYear = mom.year() - 1;
        resWeek = week + weeksInYear(resYear, dow, doy);
    } else if (week > weeksInYear(mom.year(), dow, doy)) {
        resWeek = week - weeksInYear(mom.year(), dow, doy);
        resYear = mom.year() + 1;
    } else {
        resYear = mom.year();
        resWeek = week;
    }

    return {
        week: resWeek,
        year: resYear
    };
}

function weeksInYear(year, dow, doy) {
    var weekOffset = firstWeekOffset(year, dow, doy),
        weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
    return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
}

// FORMATTING

addFormatToken('w', ['ww', 2], 'wo', 'week');
addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

// ALIASES

addUnitAlias('week', 'w');
addUnitAlias('isoWeek', 'W');

// PRIORITIES

addUnitPriority('week', 5);
addUnitPriority('isoWeek', 5);

// PARSING

addRegexToken('w',  match1to2);
addRegexToken('ww', match1to2, match2);
addRegexToken('W',  match1to2);
addRegexToken('WW', match1to2, match2);

addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
    week[token.substr(0, 1)] = toInt(input);
});

// HELPERS

// LOCALES

function localeWeek (mom) {
    return weekOfYear(mom, this._week.dow, this._week.doy).week;
}

var defaultLocaleWeek = {
    dow : 0, // Sunday is the first day of the week.
    doy : 6  // The week that contains Jan 1st is the first week of the year.
};

function localeFirstDayOfWeek () {
    return this._week.dow;
}

function localeFirstDayOfYear () {
    return this._week.doy;
}

// MOMENTS

function getSetWeek (input) {
    var week = this.localeData().week(this);
    return input == null ? week : this.add((input - week) * 7, 'd');
}

function getSetISOWeek (input) {
    var week = weekOfYear(this, 1, 4).week;
    return input == null ? week : this.add((input - week) * 7, 'd');
}

// FORMATTING

addFormatToken('d', 0, 'do', 'day');

addFormatToken('dd', 0, 0, function (format) {
    return this.localeData().weekdaysMin(this, format);
});

addFormatToken('ddd', 0, 0, function (format) {
    return this.localeData().weekdaysShort(this, format);
});

addFormatToken('dddd', 0, 0, function (format) {
    return this.localeData().weekdays(this, format);
});

addFormatToken('e', 0, 0, 'weekday');
addFormatToken('E', 0, 0, 'isoWeekday');

// ALIASES

addUnitAlias('day', 'd');
addUnitAlias('weekday', 'e');
addUnitAlias('isoWeekday', 'E');

// PRIORITY
addUnitPriority('day', 11);
addUnitPriority('weekday', 11);
addUnitPriority('isoWeekday', 11);

// PARSING

addRegexToken('d',    match1to2);
addRegexToken('e',    match1to2);
addRegexToken('E',    match1to2);
addRegexToken('dd',   function (isStrict, locale) {
    return locale.weekdaysMinRegex(isStrict);
});
addRegexToken('ddd',   function (isStrict, locale) {
    return locale.weekdaysShortRegex(isStrict);
});
addRegexToken('dddd',   function (isStrict, locale) {
    return locale.weekdaysRegex(isStrict);
});

addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
    var weekday = config._locale.weekdaysParse(input, token, config._strict);
    // if we didn't get a weekday name, mark the date as invalid
    if (weekday != null) {
        week.d = weekday;
    } else {
        getParsingFlags(config).invalidWeekday = input;
    }
});

addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
    week[token] = toInt(input);
});

// HELPERS

function parseWeekday(input, locale) {
    if (typeof input !== 'string') {
        return input;
    }

    if (!isNaN(input)) {
        return parseInt(input, 10);
    }

    input = locale.weekdaysParse(input);
    if (typeof input === 'number') {
        return input;
    }

    return null;
}

function parseIsoWeekday(input, locale) {
    if (typeof input === 'string') {
        return locale.weekdaysParse(input) % 7 || 7;
    }
    return isNaN(input) ? null : input;
}

// LOCALES

var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
function localeWeekdays (m, format) {
    if (!m) {
        return isArray(this._weekdays) ? this._weekdays :
            this._weekdays['standalone'];
    }
    return isArray(this._weekdays) ? this._weekdays[m.day()] :
        this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
}

var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
function localeWeekdaysShort (m) {
    return (m) ? this._weekdaysShort[m.day()] : this._weekdaysShort;
}

var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
function localeWeekdaysMin (m) {
    return (m) ? this._weekdaysMin[m.day()] : this._weekdaysMin;
}

function handleStrictParse$1(weekdayName, format, strict) {
    var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
    if (!this._weekdaysParse) {
        this._weekdaysParse = [];
        this._shortWeekdaysParse = [];
        this._minWeekdaysParse = [];

        for (i = 0; i < 7; ++i) {
            mom = createUTC([2000, 1]).day(i);
            this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
            this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
            this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
        }
    }

    if (strict) {
        if (format === 'dddd') {
            ii = indexOf.call(this._weekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else if (format === 'ddd') {
            ii = indexOf.call(this._shortWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        }
    } else {
        if (format === 'dddd') {
            ii = indexOf.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf.call(this._shortWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else if (format === 'ddd') {
            ii = indexOf.call(this._shortWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf.call(this._minWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf.call(this._shortWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        }
    }
}

function localeWeekdaysParse (weekdayName, format, strict) {
    var i, mom, regex;

    if (this._weekdaysParseExact) {
        return handleStrictParse$1.call(this, weekdayName, format, strict);
    }

    if (!this._weekdaysParse) {
        this._weekdaysParse = [];
        this._minWeekdaysParse = [];
        this._shortWeekdaysParse = [];
        this._fullWeekdaysParse = [];
    }

    for (i = 0; i < 7; i++) {
        // make the regex if we don't have it already

        mom = createUTC([2000, 1]).day(i);
        if (strict && !this._fullWeekdaysParse[i]) {
            this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\.?') + '$', 'i');
            this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\.?') + '$', 'i');
            this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\.?') + '$', 'i');
        }
        if (!this._weekdaysParse[i]) {
            regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
            this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
        if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
            return i;
        }
    }
}

// MOMENTS

function getSetDayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
    if (input != null) {
        input = parseWeekday(input, this.localeData());
        return this.add(input - day, 'd');
    } else {
        return day;
    }
}

function getSetLocaleDayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
    return input == null ? weekday : this.add(input - weekday, 'd');
}

function getSetISODayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }

    // behaves the same as moment#day except
    // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
    // as a setter, sunday should belong to the previous week.

    if (input != null) {
        var weekday = parseIsoWeekday(input, this.localeData());
        return this.day(this.day() % 7 ? weekday : weekday - 7);
    } else {
        return this.day() || 7;
    }
}

var defaultWeekdaysRegex = matchWord;
function weekdaysRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysStrictRegex;
        } else {
            return this._weekdaysRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            this._weekdaysRegex = defaultWeekdaysRegex;
        }
        return this._weekdaysStrictRegex && isStrict ?
            this._weekdaysStrictRegex : this._weekdaysRegex;
    }
}

var defaultWeekdaysShortRegex = matchWord;
function weekdaysShortRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysShortStrictRegex;
        } else {
            return this._weekdaysShortRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysShortRegex')) {
            this._weekdaysShortRegex = defaultWeekdaysShortRegex;
        }
        return this._weekdaysShortStrictRegex && isStrict ?
            this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
    }
}

var defaultWeekdaysMinRegex = matchWord;
function weekdaysMinRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysMinStrictRegex;
        } else {
            return this._weekdaysMinRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysMinRegex')) {
            this._weekdaysMinRegex = defaultWeekdaysMinRegex;
        }
        return this._weekdaysMinStrictRegex && isStrict ?
            this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
    }
}


function computeWeekdaysParse () {
    function cmpLenRev(a, b) {
        return b.length - a.length;
    }

    var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
        i, mom, minp, shortp, longp;
    for (i = 0; i < 7; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, 1]).day(i);
        minp = this.weekdaysMin(mom, '');
        shortp = this.weekdaysShort(mom, '');
        longp = this.weekdays(mom, '');
        minPieces.push(minp);
        shortPieces.push(shortp);
        longPieces.push(longp);
        mixedPieces.push(minp);
        mixedPieces.push(shortp);
        mixedPieces.push(longp);
    }
    // Sorting makes sure if one weekday (or abbr) is a prefix of another it
    // will match the longer piece.
    minPieces.sort(cmpLenRev);
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    for (i = 0; i < 7; i++) {
        shortPieces[i] = regexEscape(shortPieces[i]);
        longPieces[i] = regexEscape(longPieces[i]);
        mixedPieces[i] = regexEscape(mixedPieces[i]);
    }

    this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._weekdaysShortRegex = this._weekdaysRegex;
    this._weekdaysMinRegex = this._weekdaysRegex;

    this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
}

// FORMATTING

function hFormat() {
    return this.hours() % 12 || 12;
}

function kFormat() {
    return this.hours() || 24;
}

addFormatToken('H', ['HH', 2], 0, 'hour');
addFormatToken('h', ['hh', 2], 0, hFormat);
addFormatToken('k', ['kk', 2], 0, kFormat);

addFormatToken('hmm', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
});

addFormatToken('hmmss', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
        zeroFill(this.seconds(), 2);
});

addFormatToken('Hmm', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2);
});

addFormatToken('Hmmss', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2) +
        zeroFill(this.seconds(), 2);
});

function meridiem (token, lowercase) {
    addFormatToken(token, 0, 0, function () {
        return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
    });
}

meridiem('a', true);
meridiem('A', false);

// ALIASES

addUnitAlias('hour', 'h');

// PRIORITY
addUnitPriority('hour', 13);

// PARSING

function matchMeridiem (isStrict, locale) {
    return locale._meridiemParse;
}

addRegexToken('a',  matchMeridiem);
addRegexToken('A',  matchMeridiem);
addRegexToken('H',  match1to2);
addRegexToken('h',  match1to2);
addRegexToken('k',  match1to2);
addRegexToken('HH', match1to2, match2);
addRegexToken('hh', match1to2, match2);
addRegexToken('kk', match1to2, match2);

addRegexToken('hmm', match3to4);
addRegexToken('hmmss', match5to6);
addRegexToken('Hmm', match3to4);
addRegexToken('Hmmss', match5to6);

addParseToken(['H', 'HH'], HOUR);
addParseToken(['k', 'kk'], function (input, array, config) {
    var kInput = toInt(input);
    array[HOUR] = kInput === 24 ? 0 : kInput;
});
addParseToken(['a', 'A'], function (input, array, config) {
    config._isPm = config._locale.isPM(input);
    config._meridiem = input;
});
addParseToken(['h', 'hh'], function (input, array, config) {
    array[HOUR] = toInt(input);
    getParsingFlags(config).bigHour = true;
});
addParseToken('hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
    getParsingFlags(config).bigHour = true;
});
addParseToken('hmmss', function (input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
    getParsingFlags(config).bigHour = true;
});
addParseToken('Hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
});
addParseToken('Hmmss', function (input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
});

// LOCALES

function localeIsPM (input) {
    // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
    // Using charAt should be more compatible.
    return ((input + '').toLowerCase().charAt(0) === 'p');
}

var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
function localeMeridiem (hours, minutes, isLower) {
    if (hours > 11) {
        return isLower ? 'pm' : 'PM';
    } else {
        return isLower ? 'am' : 'AM';
    }
}


// MOMENTS

// Setting the hour should keep the time, because the user explicitly
// specified which hour he wants. So trying to maintain the same hour (in
// a new timezone) makes sense. Adding/subtracting hours does not follow
// this rule.
var getSetHour = makeGetSet('Hours', true);

// months
// week
// weekdays
// meridiem
var baseConfig = {
    calendar: defaultCalendar,
    longDateFormat: defaultLongDateFormat,
    invalidDate: defaultInvalidDate,
    ordinal: defaultOrdinal,
    dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
    relativeTime: defaultRelativeTime,

    months: defaultLocaleMonths,
    monthsShort: defaultLocaleMonthsShort,

    week: defaultLocaleWeek,

    weekdays: defaultLocaleWeekdays,
    weekdaysMin: defaultLocaleWeekdaysMin,
    weekdaysShort: defaultLocaleWeekdaysShort,

    meridiemParse: defaultLocaleMeridiemParse
};

// internal storage for locale config files
var locales = {};
var localeFamilies = {};
var globalLocale;

function normalizeLocale(key) {
    return key ? key.toLowerCase().replace('_', '-') : key;
}

// pick the locale from the array
// try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
// substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
function chooseLocale(names) {
    var i = 0, j, next, locale, split;

    while (i < names.length) {
        split = normalizeLocale(names[i]).split('-');
        j = split.length;
        next = normalizeLocale(names[i + 1]);
        next = next ? next.split('-') : null;
        while (j > 0) {
            locale = loadLocale(split.slice(0, j).join('-'));
            if (locale) {
                return locale;
            }
            if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                //the next array item is better than a shallower substring of this one
                break;
            }
            j--;
        }
        i++;
    }
    return null;
}

function loadLocale(name) {
    var oldLocale = null;
    // TODO: Find a better way to register and load all the locales in Node
    if (!locales[name] && (typeof module !== 'undefined') &&
            module && module.exports) {
        try {
            oldLocale = globalLocale._abbr;
            var aliasedRequire = require;
            aliasedRequire('./locale/' + name);
            getSetGlobalLocale(oldLocale);
        } catch (e) {}
    }
    return locales[name];
}

// This function will load locale and then set the global locale.  If
// no arguments are passed in, it will simply return the current global
// locale key.
function getSetGlobalLocale (key, values) {
    var data;
    if (key) {
        if (isUndefined(values)) {
            data = getLocale(key);
        }
        else {
            data = defineLocale(key, values);
        }

        if (data) {
            // moment.duration._locale = moment._locale = data;
            globalLocale = data;
        }
    }

    return globalLocale._abbr;
}

function defineLocale (name, config) {
    if (config !== null) {
        var parentConfig = baseConfig;
        config.abbr = name;
        if (locales[name] != null) {
            deprecateSimple('defineLocaleOverride',
                    'use moment.updateLocale(localeName, config) to change ' +
                    'an existing locale. moment.defineLocale(localeName, ' +
                    'config) should only be used for creating a new locale ' +
                    'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
            parentConfig = locales[name]._config;
        } else if (config.parentLocale != null) {
            if (locales[config.parentLocale] != null) {
                parentConfig = locales[config.parentLocale]._config;
            } else {
                if (!localeFamilies[config.parentLocale]) {
                    localeFamilies[config.parentLocale] = [];
                }
                localeFamilies[config.parentLocale].push({
                    name: name,
                    config: config
                });
                return null;
            }
        }
        locales[name] = new Locale(mergeConfigs(parentConfig, config));

        if (localeFamilies[name]) {
            localeFamilies[name].forEach(function (x) {
                defineLocale(x.name, x.config);
            });
        }

        // backwards compat for now: also set the locale
        // make sure we set the locale AFTER all child locales have been
        // created, so we won't end up with the child locale set.
        getSetGlobalLocale(name);


        return locales[name];
    } else {
        // useful for testing
        delete locales[name];
        return null;
    }
}

function updateLocale(name, config) {
    if (config != null) {
        var locale, tmpLocale, parentConfig = baseConfig;
        // MERGE
        tmpLocale = loadLocale(name);
        if (tmpLocale != null) {
            parentConfig = tmpLocale._config;
        }
        config = mergeConfigs(parentConfig, config);
        locale = new Locale(config);
        locale.parentLocale = locales[name];
        locales[name] = locale;

        // backwards compat for now: also set the locale
        getSetGlobalLocale(name);
    } else {
        // pass null for config to unupdate, useful for tests
        if (locales[name] != null) {
            if (locales[name].parentLocale != null) {
                locales[name] = locales[name].parentLocale;
            } else if (locales[name] != null) {
                delete locales[name];
            }
        }
    }
    return locales[name];
}

// returns locale data
function getLocale (key) {
    var locale;

    if (key && key._locale && key._locale._abbr) {
        key = key._locale._abbr;
    }

    if (!key) {
        return globalLocale;
    }

    if (!isArray(key)) {
        //short-circuit everything else
        locale = loadLocale(key);
        if (locale) {
            return locale;
        }
        key = [key];
    }

    return chooseLocale(key);
}

function listLocales() {
    return keys(locales);
}

function checkOverflow (m) {
    var overflow;
    var a = m._a;

    if (a && getParsingFlags(m).overflow === -2) {
        overflow =
            a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
            a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
            a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
            a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
            a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
            a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
            -1;

        if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
            overflow = DATE;
        }
        if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
            overflow = WEEK;
        }
        if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
            overflow = WEEKDAY;
        }

        getParsingFlags(m).overflow = overflow;
    }

    return m;
}

// Pick the first defined of two or three arguments.
function defaults(a, b, c) {
    if (a != null) {
        return a;
    }
    if (b != null) {
        return b;
    }
    return c;
}

function currentDateArray(config) {
    // hooks is actually the exported moment object
    var nowValue = new Date(hooks.now());
    if (config._useUTC) {
        return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
    }
    return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
}

// convert an array to a date.
// the array should mirror the parameters below
// note: all values past the year are optional and will default to the lowest possible value.
// [year, month, day , hour, minute, second, millisecond]
function configFromArray (config) {
    var i, date, input = [], currentDate, yearToUse;

    if (config._d) {
        return;
    }

    currentDate = currentDateArray(config);

    //compute day of the year from weeks and weekdays
    if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
        dayOfYearFromWeekInfo(config);
    }

    //if the day of the year is set, figure out what it is
    if (config._dayOfYear != null) {
        yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

        if (config._dayOfYear > daysInYear(yearToUse) || config._dayOfYear === 0) {
            getParsingFlags(config)._overflowDayOfYear = true;
        }

        date = createUTCDate(yearToUse, 0, config._dayOfYear);
        config._a[MONTH] = date.getUTCMonth();
        config._a[DATE] = date.getUTCDate();
    }

    // Default to current date.
    // * if no year, month, day of month are given, default to today
    // * if day of month is given, default month and year
    // * if month is given, default only year
    // * if year is given, don't default anything
    for (i = 0; i < 3 && config._a[i] == null; ++i) {
        config._a[i] = input[i] = currentDate[i];
    }

    // Zero out whatever was not defaulted, including time
    for (; i < 7; i++) {
        config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
    }

    // Check for 24:00:00.000
    if (config._a[HOUR] === 24 &&
            config._a[MINUTE] === 0 &&
            config._a[SECOND] === 0 &&
            config._a[MILLISECOND] === 0) {
        config._nextDay = true;
        config._a[HOUR] = 0;
    }

    config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
    // Apply timezone offset from input. The actual utcOffset can be changed
    // with parseZone.
    if (config._tzm != null) {
        config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
    }

    if (config._nextDay) {
        config._a[HOUR] = 24;
    }

    // check for mismatching day of week
    if (config._w && typeof config._w.d !== 'undefined' && config._w.d !== config._d.getDay()) {
        getParsingFlags(config).weekdayMismatch = true;
    }
}

function dayOfYearFromWeekInfo(config) {
    var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

    w = config._w;
    if (w.GG != null || w.W != null || w.E != null) {
        dow = 1;
        doy = 4;

        // TODO: We need to take the current isoWeekYear, but that depends on
        // how we interpret now (local, utc, fixed offset). So create
        // a now version of current config (take local/utc/offset flags, and
        // create now).
        weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(createLocal(), 1, 4).year);
        week = defaults(w.W, 1);
        weekday = defaults(w.E, 1);
        if (weekday < 1 || weekday > 7) {
            weekdayOverflow = true;
        }
    } else {
        dow = config._locale._week.dow;
        doy = config._locale._week.doy;

        var curWeek = weekOfYear(createLocal(), dow, doy);

        weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

        // Default to current week.
        week = defaults(w.w, curWeek.week);

        if (w.d != null) {
            // weekday -- low day numbers are considered next week
            weekday = w.d;
            if (weekday < 0 || weekday > 6) {
                weekdayOverflow = true;
            }
        } else if (w.e != null) {
            // local weekday -- counting starts from begining of week
            weekday = w.e + dow;
            if (w.e < 0 || w.e > 6) {
                weekdayOverflow = true;
            }
        } else {
            // default to begining of week
            weekday = dow;
        }
    }
    if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
        getParsingFlags(config)._overflowWeeks = true;
    } else if (weekdayOverflow != null) {
        getParsingFlags(config)._overflowWeekday = true;
    } else {
        temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }
}

// iso 8601 regex
// 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

var isoDates = [
    ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
    ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
    ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
    ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
    ['YYYY-DDD', /\d{4}-\d{3}/],
    ['YYYY-MM', /\d{4}-\d\d/, false],
    ['YYYYYYMMDD', /[+-]\d{10}/],
    ['YYYYMMDD', /\d{8}/],
    // YYYYMM is NOT allowed by the standard
    ['GGGG[W]WWE', /\d{4}W\d{3}/],
    ['GGGG[W]WW', /\d{4}W\d{2}/, false],
    ['YYYYDDD', /\d{7}/]
];

// iso time formats and regexes
var isoTimes = [
    ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
    ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
    ['HH:mm:ss', /\d\d:\d\d:\d\d/],
    ['HH:mm', /\d\d:\d\d/],
    ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
    ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
    ['HHmmss', /\d\d\d\d\d\d/],
    ['HHmm', /\d\d\d\d/],
    ['HH', /\d\d/]
];

var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

// date from iso format
function configFromISO(config) {
    var i, l,
        string = config._i,
        match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
        allowTime, dateFormat, timeFormat, tzFormat;

    if (match) {
        getParsingFlags(config).iso = true;

        for (i = 0, l = isoDates.length; i < l; i++) {
            if (isoDates[i][1].exec(match[1])) {
                dateFormat = isoDates[i][0];
                allowTime = isoDates[i][2] !== false;
                break;
            }
        }
        if (dateFormat == null) {
            config._isValid = false;
            return;
        }
        if (match[3]) {
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(match[3])) {
                    // match[2] should be 'T' or space
                    timeFormat = (match[2] || ' ') + isoTimes[i][0];
                    break;
                }
            }
            if (timeFormat == null) {
                config._isValid = false;
                return;
            }
        }
        if (!allowTime && timeFormat != null) {
            config._isValid = false;
            return;
        }
        if (match[4]) {
            if (tzRegex.exec(match[4])) {
                tzFormat = 'Z';
            } else {
                config._isValid = false;
                return;
            }
        }
        config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
        configFromStringAndFormat(config);
    } else {
        config._isValid = false;
    }
}

// RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
var rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/;

function extractFromRFC2822Strings(yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
    var result = [
        untruncateYear(yearStr),
        defaultLocaleMonthsShort.indexOf(monthStr),
        parseInt(dayStr, 10),
        parseInt(hourStr, 10),
        parseInt(minuteStr, 10)
    ];

    if (secondStr) {
        result.push(parseInt(secondStr, 10));
    }

    return result;
}

function untruncateYear(yearStr) {
    var year = parseInt(yearStr, 10);
    if (year <= 49) {
        return 2000 + year;
    } else if (year <= 999) {
        return 1900 + year;
    }
    return year;
}

function preprocessRFC2822(s) {
    // Remove comments and folding whitespace and replace multiple-spaces with a single space
    return s.replace(/\([^)]*\)|[\n\t]/g, ' ').replace(/(\s\s+)/g, ' ').trim();
}

function checkWeekday(weekdayStr, parsedInput, config) {
    if (weekdayStr) {
        // TODO: Replace the vanilla JS Date object with an indepentent day-of-week check.
        var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr),
            weekdayActual = new Date(parsedInput[0], parsedInput[1], parsedInput[2]).getDay();
        if (weekdayProvided !== weekdayActual) {
            getParsingFlags(config).weekdayMismatch = true;
            config._isValid = false;
            return false;
        }
    }
    return true;
}

var obsOffsets = {
    UT: 0,
    GMT: 0,
    EDT: -4 * 60,
    EST: -5 * 60,
    CDT: -5 * 60,
    CST: -6 * 60,
    MDT: -6 * 60,
    MST: -7 * 60,
    PDT: -7 * 60,
    PST: -8 * 60
};

function calculateOffset(obsOffset, militaryOffset, numOffset) {
    if (obsOffset) {
        return obsOffsets[obsOffset];
    } else if (militaryOffset) {
        // the only allowed military tz is Z
        return 0;
    } else {
        var hm = parseInt(numOffset, 10);
        var m = hm % 100, h = (hm - m) / 100;
        return h * 60 + m;
    }
}

// date and time from ref 2822 format
function configFromRFC2822(config) {
    var match = rfc2822.exec(preprocessRFC2822(config._i));
    if (match) {
        var parsedArray = extractFromRFC2822Strings(match[4], match[3], match[2], match[5], match[6], match[7]);
        if (!checkWeekday(match[1], parsedArray, config)) {
            return;
        }

        config._a = parsedArray;
        config._tzm = calculateOffset(match[8], match[9], match[10]);

        config._d = createUTCDate.apply(null, config._a);
        config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);

        getParsingFlags(config).rfc2822 = true;
    } else {
        config._isValid = false;
    }
}

// date from iso format or fallback
function configFromString(config) {
    var matched = aspNetJsonRegex.exec(config._i);

    if (matched !== null) {
        config._d = new Date(+matched[1]);
        return;
    }

    configFromISO(config);
    if (config._isValid === false) {
        delete config._isValid;
    } else {
        return;
    }

    configFromRFC2822(config);
    if (config._isValid === false) {
        delete config._isValid;
    } else {
        return;
    }

    // Final attempt, use Input Fallback
    hooks.createFromInputFallback(config);
}

hooks.createFromInputFallback = deprecate(
    'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
    'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
    'discouraged and will be removed in an upcoming major release. Please refer to ' +
    'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
    function (config) {
        config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
    }
);

// constant that refers to the ISO standard
hooks.ISO_8601 = function () {};

// constant that refers to the RFC 2822 form
hooks.RFC_2822 = function () {};

// date from string and format string
function configFromStringAndFormat(config) {
    // TODO: Move this to another part of the creation flow to prevent circular deps
    if (config._f === hooks.ISO_8601) {
        configFromISO(config);
        return;
    }
    if (config._f === hooks.RFC_2822) {
        configFromRFC2822(config);
        return;
    }
    config._a = [];
    getParsingFlags(config).empty = true;

    // This array is used to make a Date, either with `new Date` or `Date.UTC`
    var string = '' + config._i,
        i, parsedInput, tokens, token, skipped,
        stringLength = string.length,
        totalParsedInputLength = 0;

    tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

    for (i = 0; i < tokens.length; i++) {
        token = tokens[i];
        parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
        // console.log('token', token, 'parsedInput', parsedInput,
        //         'regex', getParseRegexForToken(token, config));
        if (parsedInput) {
            skipped = string.substr(0, string.indexOf(parsedInput));
            if (skipped.length > 0) {
                getParsingFlags(config).unusedInput.push(skipped);
            }
            string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
            totalParsedInputLength += parsedInput.length;
        }
        // don't parse if it's not a known token
        if (formatTokenFunctions[token]) {
            if (parsedInput) {
                getParsingFlags(config).empty = false;
            }
            else {
                getParsingFlags(config).unusedTokens.push(token);
            }
            addTimeToArrayFromToken(token, parsedInput, config);
        }
        else if (config._strict && !parsedInput) {
            getParsingFlags(config).unusedTokens.push(token);
        }
    }

    // add remaining unparsed input length to the string
    getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
    if (string.length > 0) {
        getParsingFlags(config).unusedInput.push(string);
    }

    // clear _12h flag if hour is <= 12
    if (config._a[HOUR] <= 12 &&
        getParsingFlags(config).bigHour === true &&
        config._a[HOUR] > 0) {
        getParsingFlags(config).bigHour = undefined;
    }

    getParsingFlags(config).parsedDateParts = config._a.slice(0);
    getParsingFlags(config).meridiem = config._meridiem;
    // handle meridiem
    config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

    configFromArray(config);
    checkOverflow(config);
}


function meridiemFixWrap (locale, hour, meridiem) {
    var isPm;

    if (meridiem == null) {
        // nothing to do
        return hour;
    }
    if (locale.meridiemHour != null) {
        return locale.meridiemHour(hour, meridiem);
    } else if (locale.isPM != null) {
        // Fallback
        isPm = locale.isPM(meridiem);
        if (isPm && hour < 12) {
            hour += 12;
        }
        if (!isPm && hour === 12) {
            hour = 0;
        }
        return hour;
    } else {
        // this is not supposed to happen
        return hour;
    }
}

// date from string and array of format strings
function configFromStringAndArray(config) {
    var tempConfig,
        bestMoment,

        scoreToBeat,
        i,
        currentScore;

    if (config._f.length === 0) {
        getParsingFlags(config).invalidFormat = true;
        config._d = new Date(NaN);
        return;
    }

    for (i = 0; i < config._f.length; i++) {
        currentScore = 0;
        tempConfig = copyConfig({}, config);
        if (config._useUTC != null) {
            tempConfig._useUTC = config._useUTC;
        }
        tempConfig._f = config._f[i];
        configFromStringAndFormat(tempConfig);

        if (!isValid(tempConfig)) {
            continue;
        }

        // if there is any input that was not parsed add a penalty for that format
        currentScore += getParsingFlags(tempConfig).charsLeftOver;

        //or tokens
        currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

        getParsingFlags(tempConfig).score = currentScore;

        if (scoreToBeat == null || currentScore < scoreToBeat) {
            scoreToBeat = currentScore;
            bestMoment = tempConfig;
        }
    }

    extend(config, bestMoment || tempConfig);
}

function configFromObject(config) {
    if (config._d) {
        return;
    }

    var i = normalizeObjectUnits(config._i);
    config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
        return obj && parseInt(obj, 10);
    });

    configFromArray(config);
}

function createFromConfig (config) {
    var res = new Moment(checkOverflow(prepareConfig(config)));
    if (res._nextDay) {
        // Adding is smart enough around DST
        res.add(1, 'd');
        res._nextDay = undefined;
    }

    return res;
}

function prepareConfig (config) {
    var input = config._i,
        format = config._f;

    config._locale = config._locale || getLocale(config._l);

    if (input === null || (format === undefined && input === '')) {
        return createInvalid({nullInput: true});
    }

    if (typeof input === 'string') {
        config._i = input = config._locale.preparse(input);
    }

    if (isMoment(input)) {
        return new Moment(checkOverflow(input));
    } else if (isDate(input)) {
        config._d = input;
    } else if (isArray(format)) {
        configFromStringAndArray(config);
    } else if (format) {
        configFromStringAndFormat(config);
    }  else {
        configFromInput(config);
    }

    if (!isValid(config)) {
        config._d = null;
    }

    return config;
}

function configFromInput(config) {
    var input = config._i;
    if (isUndefined(input)) {
        config._d = new Date(hooks.now());
    } else if (isDate(input)) {
        config._d = new Date(input.valueOf());
    } else if (typeof input === 'string') {
        configFromString(config);
    } else if (isArray(input)) {
        config._a = map(input.slice(0), function (obj) {
            return parseInt(obj, 10);
        });
        configFromArray(config);
    } else if (isObject(input)) {
        configFromObject(config);
    } else if (isNumber(input)) {
        // from milliseconds
        config._d = new Date(input);
    } else {
        hooks.createFromInputFallback(config);
    }
}

function createLocalOrUTC (input, format, locale, strict, isUTC) {
    var c = {};

    if (locale === true || locale === false) {
        strict = locale;
        locale = undefined;
    }

    if ((isObject(input) && isObjectEmpty(input)) ||
            (isArray(input) && input.length === 0)) {
        input = undefined;
    }
    // object construction must be done this way.
    // https://github.com/moment/moment/issues/1423
    c._isAMomentObject = true;
    c._useUTC = c._isUTC = isUTC;
    c._l = locale;
    c._i = input;
    c._f = format;
    c._strict = strict;

    return createFromConfig(c);
}

function createLocal (input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, false);
}

var prototypeMin = deprecate(
    'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
    function () {
        var other = createLocal.apply(null, arguments);
        if (this.isValid() && other.isValid()) {
            return other < this ? this : other;
        } else {
            return createInvalid();
        }
    }
);

var prototypeMax = deprecate(
    'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
    function () {
        var other = createLocal.apply(null, arguments);
        if (this.isValid() && other.isValid()) {
            return other > this ? this : other;
        } else {
            return createInvalid();
        }
    }
);

// Pick a moment m from moments so that m[fn](other) is true for all
// other. This relies on the function fn to be transitive.
//
// moments should either be an array of moment objects or an array, whose
// first element is an array of moment objects.
function pickBy(fn, moments) {
    var res, i;
    if (moments.length === 1 && isArray(moments[0])) {
        moments = moments[0];
    }
    if (!moments.length) {
        return createLocal();
    }
    res = moments[0];
    for (i = 1; i < moments.length; ++i) {
        if (!moments[i].isValid() || moments[i][fn](res)) {
            res = moments[i];
        }
    }
    return res;
}

// TODO: Use [].sort instead?
function min () {
    var args = [].slice.call(arguments, 0);

    return pickBy('isBefore', args);
}

function max () {
    var args = [].slice.call(arguments, 0);

    return pickBy('isAfter', args);
}

var now = function () {
    return Date.now ? Date.now() : +(new Date());
};

var ordering = ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'];

function isDurationValid(m) {
    for (var key in m) {
        if (!(indexOf.call(ordering, key) !== -1 && (m[key] == null || !isNaN(m[key])))) {
            return false;
        }
    }

    var unitHasDecimal = false;
    for (var i = 0; i < ordering.length; ++i) {
        if (m[ordering[i]]) {
            if (unitHasDecimal) {
                return false; // only allow non-integers for smallest unit
            }
            if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
                unitHasDecimal = true;
            }
        }
    }

    return true;
}

function isValid$1() {
    return this._isValid;
}

function createInvalid$1() {
    return createDuration(NaN);
}

function Duration (duration) {
    var normalizedInput = normalizeObjectUnits(duration),
        years = normalizedInput.year || 0,
        quarters = normalizedInput.quarter || 0,
        months = normalizedInput.month || 0,
        weeks = normalizedInput.week || 0,
        days = normalizedInput.day || 0,
        hours = normalizedInput.hour || 0,
        minutes = normalizedInput.minute || 0,
        seconds = normalizedInput.second || 0,
        milliseconds = normalizedInput.millisecond || 0;

    this._isValid = isDurationValid(normalizedInput);

    // representation for dateAddRemove
    this._milliseconds = +milliseconds +
        seconds * 1e3 + // 1000
        minutes * 6e4 + // 1000 * 60
        hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
    // Because of dateAddRemove treats 24 hours as different from a
    // day when working around DST, we need to store them separately
    this._days = +days +
        weeks * 7;
    // It is impossible to translate months into days without knowing
    // which months you are are talking about, so we have to store
    // it separately.
    this._months = +months +
        quarters * 3 +
        years * 12;

    this._data = {};

    this._locale = getLocale();

    this._bubble();
}

function isDuration (obj) {
    return obj instanceof Duration;
}

function absRound (number) {
    if (number < 0) {
        return Math.round(-1 * number) * -1;
    } else {
        return Math.round(number);
    }
}

// FORMATTING

function offset (token, separator) {
    addFormatToken(token, 0, 0, function () {
        var offset = this.utcOffset();
        var sign = '+';
        if (offset < 0) {
            offset = -offset;
            sign = '-';
        }
        return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
    });
}

offset('Z', ':');
offset('ZZ', '');

// PARSING

addRegexToken('Z',  matchShortOffset);
addRegexToken('ZZ', matchShortOffset);
addParseToken(['Z', 'ZZ'], function (input, array, config) {
    config._useUTC = true;
    config._tzm = offsetFromString(matchShortOffset, input);
});

// HELPERS

// timezone chunker
// '+10:00' > ['10',  '00']
// '-1530'  > ['-15', '30']
var chunkOffset = /([\+\-]|\d\d)/gi;

function offsetFromString(matcher, string) {
    var matches = (string || '').match(matcher);

    if (matches === null) {
        return null;
    }

    var chunk   = matches[matches.length - 1] || [];
    var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
    var minutes = +(parts[1] * 60) + toInt(parts[2]);

    return minutes === 0 ?
      0 :
      parts[0] === '+' ? minutes : -minutes;
}

// Return a moment from input, that is local/utc/zone equivalent to model.
function cloneWithOffset(input, model) {
    var res, diff;
    if (model._isUTC) {
        res = model.clone();
        diff = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf();
        // Use low-level api, because this fn is low-level api.
        res._d.setTime(res._d.valueOf() + diff);
        hooks.updateOffset(res, false);
        return res;
    } else {
        return createLocal(input).local();
    }
}

function getDateOffset (m) {
    // On Firefox.24 Date#getTimezoneOffset returns a floating point.
    // https://github.com/moment/moment/pull/1871
    return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
}

// HOOKS

// This function will be called whenever a moment is mutated.
// It is intended to keep the offset in sync with the timezone.
hooks.updateOffset = function () {};

// MOMENTS

// keepLocalTime = true means only change the timezone, without
// affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
// 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
// +0200, so we adjust the time as needed, to be valid.
//
// Keeping the time actually adds/subtracts (one hour)
// from the actual represented time. That is why we call updateOffset
// a second time. In case it wants us to change the offset again
// _changeInProgress == true case, then we have to adjust, because
// there is no such time in the given timezone.
function getSetOffset (input, keepLocalTime, keepMinutes) {
    var offset = this._offset || 0,
        localAdjust;
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    if (input != null) {
        if (typeof input === 'string') {
            input = offsetFromString(matchShortOffset, input);
            if (input === null) {
                return this;
            }
        } else if (Math.abs(input) < 16 && !keepMinutes) {
            input = input * 60;
        }
        if (!this._isUTC && keepLocalTime) {
            localAdjust = getDateOffset(this);
        }
        this._offset = input;
        this._isUTC = true;
        if (localAdjust != null) {
            this.add(localAdjust, 'm');
        }
        if (offset !== input) {
            if (!keepLocalTime || this._changeInProgress) {
                addSubtract(this, createDuration(input - offset, 'm'), 1, false);
            } else if (!this._changeInProgress) {
                this._changeInProgress = true;
                hooks.updateOffset(this, true);
                this._changeInProgress = null;
            }
        }
        return this;
    } else {
        return this._isUTC ? offset : getDateOffset(this);
    }
}

function getSetZone (input, keepLocalTime) {
    if (input != null) {
        if (typeof input !== 'string') {
            input = -input;
        }

        this.utcOffset(input, keepLocalTime);

        return this;
    } else {
        return -this.utcOffset();
    }
}

function setOffsetToUTC (keepLocalTime) {
    return this.utcOffset(0, keepLocalTime);
}

function setOffsetToLocal (keepLocalTime) {
    if (this._isUTC) {
        this.utcOffset(0, keepLocalTime);
        this._isUTC = false;

        if (keepLocalTime) {
            this.subtract(getDateOffset(this), 'm');
        }
    }
    return this;
}

function setOffsetToParsedOffset () {
    if (this._tzm != null) {
        this.utcOffset(this._tzm, false, true);
    } else if (typeof this._i === 'string') {
        var tZone = offsetFromString(matchOffset, this._i);
        if (tZone != null) {
            this.utcOffset(tZone);
        }
        else {
            this.utcOffset(0, true);
        }
    }
    return this;
}

function hasAlignedHourOffset (input) {
    if (!this.isValid()) {
        return false;
    }
    input = input ? createLocal(input).utcOffset() : 0;

    return (this.utcOffset() - input) % 60 === 0;
}

function isDaylightSavingTime () {
    return (
        this.utcOffset() > this.clone().month(0).utcOffset() ||
        this.utcOffset() > this.clone().month(5).utcOffset()
    );
}

function isDaylightSavingTimeShifted () {
    if (!isUndefined(this._isDSTShifted)) {
        return this._isDSTShifted;
    }

    var c = {};

    copyConfig(c, this);
    c = prepareConfig(c);

    if (c._a) {
        var other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
        this._isDSTShifted = this.isValid() &&
            compareArrays(c._a, other.toArray()) > 0;
    } else {
        this._isDSTShifted = false;
    }

    return this._isDSTShifted;
}

function isLocal () {
    return this.isValid() ? !this._isUTC : false;
}

function isUtcOffset () {
    return this.isValid() ? this._isUTC : false;
}

function isUtc () {
    return this.isValid() ? this._isUTC && this._offset === 0 : false;
}

// ASP.NET json date format regex
var aspNetRegex = /^(\-|\+)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;

// from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
// somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
// and further modified to allow for strings containing both week and day
var isoRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

function createDuration (input, key) {
    var duration = input,
        // matching against regexp is expensive, do it on demand
        match = null,
        sign,
        ret,
        diffRes;

    if (isDuration(input)) {
        duration = {
            ms : input._milliseconds,
            d  : input._days,
            M  : input._months
        };
    } else if (isNumber(input)) {
        duration = {};
        if (key) {
            duration[key] = input;
        } else {
            duration.milliseconds = input;
        }
    } else if (!!(match = aspNetRegex.exec(input))) {
        sign = (match[1] === '-') ? -1 : 1;
        duration = {
            y  : 0,
            d  : toInt(match[DATE])                         * sign,
            h  : toInt(match[HOUR])                         * sign,
            m  : toInt(match[MINUTE])                       * sign,
            s  : toInt(match[SECOND])                       * sign,
            ms : toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match
        };
    } else if (!!(match = isoRegex.exec(input))) {
        sign = (match[1] === '-') ? -1 : (match[1] === '+') ? 1 : 1;
        duration = {
            y : parseIso(match[2], sign),
            M : parseIso(match[3], sign),
            w : parseIso(match[4], sign),
            d : parseIso(match[5], sign),
            h : parseIso(match[6], sign),
            m : parseIso(match[7], sign),
            s : parseIso(match[8], sign)
        };
    } else if (duration == null) {// checks for null or undefined
        duration = {};
    } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
        diffRes = momentsDifference(createLocal(duration.from), createLocal(duration.to));

        duration = {};
        duration.ms = diffRes.milliseconds;
        duration.M = diffRes.months;
    }

    ret = new Duration(duration);

    if (isDuration(input) && hasOwnProp(input, '_locale')) {
        ret._locale = input._locale;
    }

    return ret;
}

createDuration.fn = Duration.prototype;
createDuration.invalid = createInvalid$1;

function parseIso (inp, sign) {
    // We'd normally use ~~inp for this, but unfortunately it also
    // converts floats to ints.
    // inp may be undefined, so careful calling replace on it.
    var res = inp && parseFloat(inp.replace(',', '.'));
    // apply sign while we're at it
    return (isNaN(res) ? 0 : res) * sign;
}

function positiveMomentsDifference(base, other) {
    var res = {milliseconds: 0, months: 0};

    res.months = other.month() - base.month() +
        (other.year() - base.year()) * 12;
    if (base.clone().add(res.months, 'M').isAfter(other)) {
        --res.months;
    }

    res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

    return res;
}

function momentsDifference(base, other) {
    var res;
    if (!(base.isValid() && other.isValid())) {
        return {milliseconds: 0, months: 0};
    }

    other = cloneWithOffset(other, base);
    if (base.isBefore(other)) {
        res = positiveMomentsDifference(base, other);
    } else {
        res = positiveMomentsDifference(other, base);
        res.milliseconds = -res.milliseconds;
        res.months = -res.months;
    }

    return res;
}

// TODO: remove 'name' arg after deprecation is removed
function createAdder(direction, name) {
    return function (val, period) {
        var dur, tmp;
        //invert the arguments, but complain about it
        if (period !== null && !isNaN(+period)) {
            deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
            'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
            tmp = val; val = period; period = tmp;
        }

        val = typeof val === 'string' ? +val : val;
        dur = createDuration(val, period);
        addSubtract(this, dur, direction);
        return this;
    };
}

function addSubtract (mom, duration, isAdding, updateOffset) {
    var milliseconds = duration._milliseconds,
        days = absRound(duration._days),
        months = absRound(duration._months);

    if (!mom.isValid()) {
        // No op
        return;
    }

    updateOffset = updateOffset == null ? true : updateOffset;

    if (months) {
        setMonth(mom, get(mom, 'Month') + months * isAdding);
    }
    if (days) {
        set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
    }
    if (milliseconds) {
        mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
    }
    if (updateOffset) {
        hooks.updateOffset(mom, days || months);
    }
}

var add      = createAdder(1, 'add');
var subtract = createAdder(-1, 'subtract');

function getCalendarFormat(myMoment, now) {
    var diff = myMoment.diff(now, 'days', true);
    return diff < -6 ? 'sameElse' :
            diff < -1 ? 'lastWeek' :
            diff < 0 ? 'lastDay' :
            diff < 1 ? 'sameDay' :
            diff < 2 ? 'nextDay' :
            diff < 7 ? 'nextWeek' : 'sameElse';
}

function calendar$1 (time, formats) {
    // We want to compare the start of today, vs this.
    // Getting start-of-today depends on whether we're local/utc/offset or not.
    var now = time || createLocal(),
        sod = cloneWithOffset(now, this).startOf('day'),
        format = hooks.calendarFormat(this, sod) || 'sameElse';

    var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

    return this.format(output || this.localeData().calendar(format, this, createLocal(now)));
}

function clone () {
    return new Moment(this);
}

function isAfter (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() > localInput.valueOf();
    } else {
        return localInput.valueOf() < this.clone().startOf(units).valueOf();
    }
}

function isBefore (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() < localInput.valueOf();
    } else {
        return this.clone().endOf(units).valueOf() < localInput.valueOf();
    }
}

function isBetween (from, to, units, inclusivity) {
    inclusivity = inclusivity || '()';
    return (inclusivity[0] === '(' ? this.isAfter(from, units) : !this.isBefore(from, units)) &&
        (inclusivity[1] === ')' ? this.isBefore(to, units) : !this.isAfter(to, units));
}

function isSame (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input),
        inputMs;
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(units || 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() === localInput.valueOf();
    } else {
        inputMs = localInput.valueOf();
        return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
    }
}

function isSameOrAfter (input, units) {
    return this.isSame(input, units) || this.isAfter(input,units);
}

function isSameOrBefore (input, units) {
    return this.isSame(input, units) || this.isBefore(input,units);
}

function diff (input, units, asFloat) {
    var that,
        zoneDelta,
        delta, output;

    if (!this.isValid()) {
        return NaN;
    }

    that = cloneWithOffset(input, this);

    if (!that.isValid()) {
        return NaN;
    }

    zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

    units = normalizeUnits(units);

    switch (units) {
        case 'year': output = monthDiff(this, that) / 12; break;
        case 'month': output = monthDiff(this, that); break;
        case 'quarter': output = monthDiff(this, that) / 3; break;
        case 'second': output = (this - that) / 1e3; break; // 1000
        case 'minute': output = (this - that) / 6e4; break; // 1000 * 60
        case 'hour': output = (this - that) / 36e5; break; // 1000 * 60 * 60
        case 'day': output = (this - that - zoneDelta) / 864e5; break; // 1000 * 60 * 60 * 24, negate dst
        case 'week': output = (this - that - zoneDelta) / 6048e5; break; // 1000 * 60 * 60 * 24 * 7, negate dst
        default: output = this - that;
    }

    return asFloat ? output : absFloor(output);
}

function monthDiff (a, b) {
    // difference in months
    var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
        // b is in (anchor - 1 month, anchor + 1 month)
        anchor = a.clone().add(wholeMonthDiff, 'months'),
        anchor2, adjust;

    if (b - anchor < 0) {
        anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
        // linear across the month
        adjust = (b - anchor) / (anchor - anchor2);
    } else {
        anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
        // linear across the month
        adjust = (b - anchor) / (anchor2 - anchor);
    }

    //check for negative zero, return zero if negative zero
    return -(wholeMonthDiff + adjust) || 0;
}

hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

function toString () {
    return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
}

function toISOString() {
    if (!this.isValid()) {
        return null;
    }
    var m = this.clone().utc();
    if (m.year() < 0 || m.year() > 9999) {
        return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
    }
    if (isFunction(Date.prototype.toISOString)) {
        // native implementation is ~50x faster, use it when we can
        return this.toDate().toISOString();
    }
    return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
}

/**
 * Return a human readable representation of a moment that can
 * also be evaluated to get a new moment which is the same
 *
 * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
 */
function inspect () {
    if (!this.isValid()) {
        return 'moment.invalid(/* ' + this._i + ' */)';
    }
    var func = 'moment';
    var zone = '';
    if (!this.isLocal()) {
        func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
        zone = 'Z';
    }
    var prefix = '[' + func + '("]';
    var year = (0 <= this.year() && this.year() <= 9999) ? 'YYYY' : 'YYYYYY';
    var datetime = '-MM-DD[T]HH:mm:ss.SSS';
    var suffix = zone + '[")]';

    return this.format(prefix + year + datetime + suffix);
}

function format (inputString) {
    if (!inputString) {
        inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
    }
    var output = formatMoment(this, inputString);
    return this.localeData().postformat(output);
}

function from (time, withoutSuffix) {
    if (this.isValid() &&
            ((isMoment(time) && time.isValid()) ||
             createLocal(time).isValid())) {
        return createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
    } else {
        return this.localeData().invalidDate();
    }
}

function fromNow (withoutSuffix) {
    return this.from(createLocal(), withoutSuffix);
}

function to (time, withoutSuffix) {
    if (this.isValid() &&
            ((isMoment(time) && time.isValid()) ||
             createLocal(time).isValid())) {
        return createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
    } else {
        return this.localeData().invalidDate();
    }
}

function toNow (withoutSuffix) {
    return this.to(createLocal(), withoutSuffix);
}

// If passed a locale key, it will set the locale for this
// instance.  Otherwise, it will return the locale configuration
// variables for this instance.
function locale (key) {
    var newLocaleData;

    if (key === undefined) {
        return this._locale._abbr;
    } else {
        newLocaleData = getLocale(key);
        if (newLocaleData != null) {
            this._locale = newLocaleData;
        }
        return this;
    }
}

var lang = deprecate(
    'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
    function (key) {
        if (key === undefined) {
            return this.localeData();
        } else {
            return this.locale(key);
        }
    }
);

function localeData () {
    return this._locale;
}

function startOf (units) {
    units = normalizeUnits(units);
    // the following switch intentionally omits break keywords
    // to utilize falling through the cases.
    switch (units) {
        case 'year':
            this.month(0);
            /* falls through */
        case 'quarter':
        case 'month':
            this.date(1);
            /* falls through */
        case 'week':
        case 'isoWeek':
        case 'day':
        case 'date':
            this.hours(0);
            /* falls through */
        case 'hour':
            this.minutes(0);
            /* falls through */
        case 'minute':
            this.seconds(0);
            /* falls through */
        case 'second':
            this.milliseconds(0);
    }

    // weeks are a special case
    if (units === 'week') {
        this.weekday(0);
    }
    if (units === 'isoWeek') {
        this.isoWeekday(1);
    }

    // quarters are also special
    if (units === 'quarter') {
        this.month(Math.floor(this.month() / 3) * 3);
    }

    return this;
}

function endOf (units) {
    units = normalizeUnits(units);
    if (units === undefined || units === 'millisecond') {
        return this;
    }

    // 'date' is an alias for 'day', so it should be considered as such.
    if (units === 'date') {
        units = 'day';
    }

    return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
}

function valueOf () {
    return this._d.valueOf() - ((this._offset || 0) * 60000);
}

function unix () {
    return Math.floor(this.valueOf() / 1000);
}

function toDate () {
    return new Date(this.valueOf());
}

function toArray () {
    var m = this;
    return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
}

function toObject () {
    var m = this;
    return {
        years: m.year(),
        months: m.month(),
        date: m.date(),
        hours: m.hours(),
        minutes: m.minutes(),
        seconds: m.seconds(),
        milliseconds: m.milliseconds()
    };
}

function toJSON () {
    // new Date(NaN).toJSON() === null
    return this.isValid() ? this.toISOString() : null;
}

function isValid$2 () {
    return isValid(this);
}

function parsingFlags () {
    return extend({}, getParsingFlags(this));
}

function invalidAt () {
    return getParsingFlags(this).overflow;
}

function creationData() {
    return {
        input: this._i,
        format: this._f,
        locale: this._locale,
        isUTC: this._isUTC,
        strict: this._strict
    };
}

// FORMATTING

addFormatToken(0, ['gg', 2], 0, function () {
    return this.weekYear() % 100;
});

addFormatToken(0, ['GG', 2], 0, function () {
    return this.isoWeekYear() % 100;
});

function addWeekYearFormatToken (token, getter) {
    addFormatToken(0, [token, token.length], 0, getter);
}

addWeekYearFormatToken('gggg',     'weekYear');
addWeekYearFormatToken('ggggg',    'weekYear');
addWeekYearFormatToken('GGGG',  'isoWeekYear');
addWeekYearFormatToken('GGGGG', 'isoWeekYear');

// ALIASES

addUnitAlias('weekYear', 'gg');
addUnitAlias('isoWeekYear', 'GG');

// PRIORITY

addUnitPriority('weekYear', 1);
addUnitPriority('isoWeekYear', 1);


// PARSING

addRegexToken('G',      matchSigned);
addRegexToken('g',      matchSigned);
addRegexToken('GG',     match1to2, match2);
addRegexToken('gg',     match1to2, match2);
addRegexToken('GGGG',   match1to4, match4);
addRegexToken('gggg',   match1to4, match4);
addRegexToken('GGGGG',  match1to6, match6);
addRegexToken('ggggg',  match1to6, match6);

addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
    week[token.substr(0, 2)] = toInt(input);
});

addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
    week[token] = hooks.parseTwoDigitYear(input);
});

// MOMENTS

function getSetWeekYear (input) {
    return getSetWeekYearHelper.call(this,
            input,
            this.week(),
            this.weekday(),
            this.localeData()._week.dow,
            this.localeData()._week.doy);
}

function getSetISOWeekYear (input) {
    return getSetWeekYearHelper.call(this,
            input, this.isoWeek(), this.isoWeekday(), 1, 4);
}

function getISOWeeksInYear () {
    return weeksInYear(this.year(), 1, 4);
}

function getWeeksInYear () {
    var weekInfo = this.localeData()._week;
    return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
}

function getSetWeekYearHelper(input, week, weekday, dow, doy) {
    var weeksTarget;
    if (input == null) {
        return weekOfYear(this, dow, doy).year;
    } else {
        weeksTarget = weeksInYear(input, dow, doy);
        if (week > weeksTarget) {
            week = weeksTarget;
        }
        return setWeekAll.call(this, input, week, weekday, dow, doy);
    }
}

function setWeekAll(weekYear, week, weekday, dow, doy) {
    var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
        date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

    this.year(date.getUTCFullYear());
    this.month(date.getUTCMonth());
    this.date(date.getUTCDate());
    return this;
}

// FORMATTING

addFormatToken('Q', 0, 'Qo', 'quarter');

// ALIASES

addUnitAlias('quarter', 'Q');

// PRIORITY

addUnitPriority('quarter', 7);

// PARSING

addRegexToken('Q', match1);
addParseToken('Q', function (input, array) {
    array[MONTH] = (toInt(input) - 1) * 3;
});

// MOMENTS

function getSetQuarter (input) {
    return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
}

// FORMATTING

addFormatToken('D', ['DD', 2], 'Do', 'date');

// ALIASES

addUnitAlias('date', 'D');

// PRIOROITY
addUnitPriority('date', 9);

// PARSING

addRegexToken('D',  match1to2);
addRegexToken('DD', match1to2, match2);
addRegexToken('Do', function (isStrict, locale) {
    // TODO: Remove "ordinalParse" fallback in next major release.
    return isStrict ?
      (locale._dayOfMonthOrdinalParse || locale._ordinalParse) :
      locale._dayOfMonthOrdinalParseLenient;
});

addParseToken(['D', 'DD'], DATE);
addParseToken('Do', function (input, array) {
    array[DATE] = toInt(input.match(match1to2)[0], 10);
});

// MOMENTS

var getSetDayOfMonth = makeGetSet('Date', true);

// FORMATTING

addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

// ALIASES

addUnitAlias('dayOfYear', 'DDD');

// PRIORITY
addUnitPriority('dayOfYear', 4);

// PARSING

addRegexToken('DDD',  match1to3);
addRegexToken('DDDD', match3);
addParseToken(['DDD', 'DDDD'], function (input, array, config) {
    config._dayOfYear = toInt(input);
});

// HELPERS

// MOMENTS

function getSetDayOfYear (input) {
    var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
    return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
}

// FORMATTING

addFormatToken('m', ['mm', 2], 0, 'minute');

// ALIASES

addUnitAlias('minute', 'm');

// PRIORITY

addUnitPriority('minute', 14);

// PARSING

addRegexToken('m',  match1to2);
addRegexToken('mm', match1to2, match2);
addParseToken(['m', 'mm'], MINUTE);

// MOMENTS

var getSetMinute = makeGetSet('Minutes', false);

// FORMATTING

addFormatToken('s', ['ss', 2], 0, 'second');

// ALIASES

addUnitAlias('second', 's');

// PRIORITY

addUnitPriority('second', 15);

// PARSING

addRegexToken('s',  match1to2);
addRegexToken('ss', match1to2, match2);
addParseToken(['s', 'ss'], SECOND);

// MOMENTS

var getSetSecond = makeGetSet('Seconds', false);

// FORMATTING

addFormatToken('S', 0, 0, function () {
    return ~~(this.millisecond() / 100);
});

addFormatToken(0, ['SS', 2], 0, function () {
    return ~~(this.millisecond() / 10);
});

addFormatToken(0, ['SSS', 3], 0, 'millisecond');
addFormatToken(0, ['SSSS', 4], 0, function () {
    return this.millisecond() * 10;
});
addFormatToken(0, ['SSSSS', 5], 0, function () {
    return this.millisecond() * 100;
});
addFormatToken(0, ['SSSSSS', 6], 0, function () {
    return this.millisecond() * 1000;
});
addFormatToken(0, ['SSSSSSS', 7], 0, function () {
    return this.millisecond() * 10000;
});
addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
    return this.millisecond() * 100000;
});
addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
    return this.millisecond() * 1000000;
});


// ALIASES

addUnitAlias('millisecond', 'ms');

// PRIORITY

addUnitPriority('millisecond', 16);

// PARSING

addRegexToken('S',    match1to3, match1);
addRegexToken('SS',   match1to3, match2);
addRegexToken('SSS',  match1to3, match3);

var token;
for (token = 'SSSS'; token.length <= 9; token += 'S') {
    addRegexToken(token, matchUnsigned);
}

function parseMs(input, array) {
    array[MILLISECOND] = toInt(('0.' + input) * 1000);
}

for (token = 'S'; token.length <= 9; token += 'S') {
    addParseToken(token, parseMs);
}
// MOMENTS

var getSetMillisecond = makeGetSet('Milliseconds', false);

// FORMATTING

addFormatToken('z',  0, 0, 'zoneAbbr');
addFormatToken('zz', 0, 0, 'zoneName');

// MOMENTS

function getZoneAbbr () {
    return this._isUTC ? 'UTC' : '';
}

function getZoneName () {
    return this._isUTC ? 'Coordinated Universal Time' : '';
}

var proto = Moment.prototype;

proto.add               = add;
proto.calendar          = calendar$1;
proto.clone             = clone;
proto.diff              = diff;
proto.endOf             = endOf;
proto.format            = format;
proto.from              = from;
proto.fromNow           = fromNow;
proto.to                = to;
proto.toNow             = toNow;
proto.get               = stringGet;
proto.invalidAt         = invalidAt;
proto.isAfter           = isAfter;
proto.isBefore          = isBefore;
proto.isBetween         = isBetween;
proto.isSame            = isSame;
proto.isSameOrAfter     = isSameOrAfter;
proto.isSameOrBefore    = isSameOrBefore;
proto.isValid           = isValid$2;
proto.lang              = lang;
proto.locale            = locale;
proto.localeData        = localeData;
proto.max               = prototypeMax;
proto.min               = prototypeMin;
proto.parsingFlags      = parsingFlags;
proto.set               = stringSet;
proto.startOf           = startOf;
proto.subtract          = subtract;
proto.toArray           = toArray;
proto.toObject          = toObject;
proto.toDate            = toDate;
proto.toISOString       = toISOString;
proto.inspect           = inspect;
proto.toJSON            = toJSON;
proto.toString          = toString;
proto.unix              = unix;
proto.valueOf           = valueOf;
proto.creationData      = creationData;

// Year
proto.year       = getSetYear;
proto.isLeapYear = getIsLeapYear;

// Week Year
proto.weekYear    = getSetWeekYear;
proto.isoWeekYear = getSetISOWeekYear;

// Quarter
proto.quarter = proto.quarters = getSetQuarter;

// Month
proto.month       = getSetMonth;
proto.daysInMonth = getDaysInMonth;

// Week
proto.week           = proto.weeks        = getSetWeek;
proto.isoWeek        = proto.isoWeeks     = getSetISOWeek;
proto.weeksInYear    = getWeeksInYear;
proto.isoWeeksInYear = getISOWeeksInYear;

// Day
proto.date       = getSetDayOfMonth;
proto.day        = proto.days             = getSetDayOfWeek;
proto.weekday    = getSetLocaleDayOfWeek;
proto.isoWeekday = getSetISODayOfWeek;
proto.dayOfYear  = getSetDayOfYear;

// Hour
proto.hour = proto.hours = getSetHour;

// Minute
proto.minute = proto.minutes = getSetMinute;

// Second
proto.second = proto.seconds = getSetSecond;

// Millisecond
proto.millisecond = proto.milliseconds = getSetMillisecond;

// Offset
proto.utcOffset            = getSetOffset;
proto.utc                  = setOffsetToUTC;
proto.local                = setOffsetToLocal;
proto.parseZone            = setOffsetToParsedOffset;
proto.hasAlignedHourOffset = hasAlignedHourOffset;
proto.isDST                = isDaylightSavingTime;
proto.isLocal              = isLocal;
proto.isUtcOffset          = isUtcOffset;
proto.isUtc                = isUtc;
proto.isUTC                = isUtc;

// Timezone
proto.zoneAbbr = getZoneAbbr;
proto.zoneName = getZoneName;

// Deprecations
proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

function createUnix (input) {
    return createLocal(input * 1000);
}

function createInZone () {
    return createLocal.apply(null, arguments).parseZone();
}

function preParsePostFormat (string) {
    return string;
}

var proto$1 = Locale.prototype;

proto$1.calendar        = calendar;
proto$1.longDateFormat  = longDateFormat;
proto$1.invalidDate     = invalidDate;
proto$1.ordinal         = ordinal;
proto$1.preparse        = preParsePostFormat;
proto$1.postformat      = preParsePostFormat;
proto$1.relativeTime    = relativeTime;
proto$1.pastFuture      = pastFuture;
proto$1.set             = set;

// Month
proto$1.months            =        localeMonths;
proto$1.monthsShort       =        localeMonthsShort;
proto$1.monthsParse       =        localeMonthsParse;
proto$1.monthsRegex       = monthsRegex;
proto$1.monthsShortRegex  = monthsShortRegex;

// Week
proto$1.week = localeWeek;
proto$1.firstDayOfYear = localeFirstDayOfYear;
proto$1.firstDayOfWeek = localeFirstDayOfWeek;

// Day of Week
proto$1.weekdays       =        localeWeekdays;
proto$1.weekdaysMin    =        localeWeekdaysMin;
proto$1.weekdaysShort  =        localeWeekdaysShort;
proto$1.weekdaysParse  =        localeWeekdaysParse;

proto$1.weekdaysRegex       =        weekdaysRegex;
proto$1.weekdaysShortRegex  =        weekdaysShortRegex;
proto$1.weekdaysMinRegex    =        weekdaysMinRegex;

// Hours
proto$1.isPM = localeIsPM;
proto$1.meridiem = localeMeridiem;

function get$1 (format, index, field, setter) {
    var locale = getLocale();
    var utc = createUTC().set(setter, index);
    return locale[field](utc, format);
}

function listMonthsImpl (format, index, field) {
    if (isNumber(format)) {
        index = format;
        format = undefined;
    }

    format = format || '';

    if (index != null) {
        return get$1(format, index, field, 'month');
    }

    var i;
    var out = [];
    for (i = 0; i < 12; i++) {
        out[i] = get$1(format, i, field, 'month');
    }
    return out;
}

// ()
// (5)
// (fmt, 5)
// (fmt)
// (true)
// (true, 5)
// (true, fmt, 5)
// (true, fmt)
function listWeekdaysImpl (localeSorted, format, index, field) {
    if (typeof localeSorted === 'boolean') {
        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';
    } else {
        format = localeSorted;
        index = format;
        localeSorted = false;

        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';
    }

    var locale = getLocale(),
        shift = localeSorted ? locale._week.dow : 0;

    if (index != null) {
        return get$1(format, (index + shift) % 7, field, 'day');
    }

    var i;
    var out = [];
    for (i = 0; i < 7; i++) {
        out[i] = get$1(format, (i + shift) % 7, field, 'day');
    }
    return out;
}

function listMonths (format, index) {
    return listMonthsImpl(format, index, 'months');
}

function listMonthsShort (format, index) {
    return listMonthsImpl(format, index, 'monthsShort');
}

function listWeekdays (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
}

function listWeekdaysShort (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
}

function listWeekdaysMin (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
}

getSetGlobalLocale('en', {
    dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
    ordinal : function (number) {
        var b = number % 10,
            output = (toInt(number % 100 / 10) === 1) ? 'th' :
            (b === 1) ? 'st' :
            (b === 2) ? 'nd' :
            (b === 3) ? 'rd' : 'th';
        return number + output;
    }
});

// Side effect imports
hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', getSetGlobalLocale);
hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', getLocale);

var mathAbs = Math.abs;

function abs () {
    var data           = this._data;

    this._milliseconds = mathAbs(this._milliseconds);
    this._days         = mathAbs(this._days);
    this._months       = mathAbs(this._months);

    data.milliseconds  = mathAbs(data.milliseconds);
    data.seconds       = mathAbs(data.seconds);
    data.minutes       = mathAbs(data.minutes);
    data.hours         = mathAbs(data.hours);
    data.months        = mathAbs(data.months);
    data.years         = mathAbs(data.years);

    return this;
}

function addSubtract$1 (duration, input, value, direction) {
    var other = createDuration(input, value);

    duration._milliseconds += direction * other._milliseconds;
    duration._days         += direction * other._days;
    duration._months       += direction * other._months;

    return duration._bubble();
}

// supports only 2.0-style add(1, 's') or add(duration)
function add$1 (input, value) {
    return addSubtract$1(this, input, value, 1);
}

// supports only 2.0-style subtract(1, 's') or subtract(duration)
function subtract$1 (input, value) {
    return addSubtract$1(this, input, value, -1);
}

function absCeil (number) {
    if (number < 0) {
        return Math.floor(number);
    } else {
        return Math.ceil(number);
    }
}

function bubble () {
    var milliseconds = this._milliseconds;
    var days         = this._days;
    var months       = this._months;
    var data         = this._data;
    var seconds, minutes, hours, years, monthsFromDays;

    // if we have a mix of positive and negative values, bubble down first
    // check: https://github.com/moment/moment/issues/2166
    if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
            (milliseconds <= 0 && days <= 0 && months <= 0))) {
        milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
        days = 0;
        months = 0;
    }

    // The following code bubbles up values, see the tests for
    // examples of what that means.
    data.milliseconds = milliseconds % 1000;

    seconds           = absFloor(milliseconds / 1000);
    data.seconds      = seconds % 60;

    minutes           = absFloor(seconds / 60);
    data.minutes      = minutes % 60;

    hours             = absFloor(minutes / 60);
    data.hours        = hours % 24;

    days += absFloor(hours / 24);

    // convert days to months
    monthsFromDays = absFloor(daysToMonths(days));
    months += monthsFromDays;
    days -= absCeil(monthsToDays(monthsFromDays));

    // 12 months -> 1 year
    years = absFloor(months / 12);
    months %= 12;

    data.days   = days;
    data.months = months;
    data.years  = years;

    return this;
}

function daysToMonths (days) {
    // 400 years have 146097 days (taking into account leap year rules)
    // 400 years have 12 months === 4800
    return days * 4800 / 146097;
}

function monthsToDays (months) {
    // the reverse of daysToMonths
    return months * 146097 / 4800;
}

function as (units) {
    if (!this.isValid()) {
        return NaN;
    }
    var days;
    var months;
    var milliseconds = this._milliseconds;

    units = normalizeUnits(units);

    if (units === 'month' || units === 'year') {
        days   = this._days   + milliseconds / 864e5;
        months = this._months + daysToMonths(days);
        return units === 'month' ? months : months / 12;
    } else {
        // handle milliseconds separately because of floating point math errors (issue #1867)
        days = this._days + Math.round(monthsToDays(this._months));
        switch (units) {
            case 'week'   : return days / 7     + milliseconds / 6048e5;
            case 'day'    : return days         + milliseconds / 864e5;
            case 'hour'   : return days * 24    + milliseconds / 36e5;
            case 'minute' : return days * 1440  + milliseconds / 6e4;
            case 'second' : return days * 86400 + milliseconds / 1000;
            // Math.floor prevents floating point math errors here
            case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
            default: throw new Error('Unknown unit ' + units);
        }
    }
}

// TODO: Use this.as('ms')?
function valueOf$1 () {
    if (!this.isValid()) {
        return NaN;
    }
    return (
        this._milliseconds +
        this._days * 864e5 +
        (this._months % 12) * 2592e6 +
        toInt(this._months / 12) * 31536e6
    );
}

function makeAs (alias) {
    return function () {
        return this.as(alias);
    };
}

var asMilliseconds = makeAs('ms');
var asSeconds      = makeAs('s');
var asMinutes      = makeAs('m');
var asHours        = makeAs('h');
var asDays         = makeAs('d');
var asWeeks        = makeAs('w');
var asMonths       = makeAs('M');
var asYears        = makeAs('y');

function clone$1 () {
    return createDuration(this);
}

function get$2 (units) {
    units = normalizeUnits(units);
    return this.isValid() ? this[units + 's']() : NaN;
}

function makeGetter(name) {
    return function () {
        return this.isValid() ? this._data[name] : NaN;
    };
}

var milliseconds = makeGetter('milliseconds');
var seconds      = makeGetter('seconds');
var minutes      = makeGetter('minutes');
var hours        = makeGetter('hours');
var days         = makeGetter('days');
var months       = makeGetter('months');
var years        = makeGetter('years');

function weeks () {
    return absFloor(this.days() / 7);
}

var round = Math.round;
var thresholds = {
    ss: 44,         // a few seconds to seconds
    s : 45,         // seconds to minute
    m : 45,         // minutes to hour
    h : 22,         // hours to day
    d : 26,         // days to month
    M : 11          // months to year
};

// helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
    return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
}

function relativeTime$1 (posNegDuration, withoutSuffix, locale) {
    var duration = createDuration(posNegDuration).abs();
    var seconds  = round(duration.as('s'));
    var minutes  = round(duration.as('m'));
    var hours    = round(duration.as('h'));
    var days     = round(duration.as('d'));
    var months   = round(duration.as('M'));
    var years    = round(duration.as('y'));

    var a = seconds <= thresholds.ss && ['s', seconds]  ||
            seconds < thresholds.s   && ['ss', seconds] ||
            minutes <= 1             && ['m']           ||
            minutes < thresholds.m   && ['mm', minutes] ||
            hours   <= 1             && ['h']           ||
            hours   < thresholds.h   && ['hh', hours]   ||
            days    <= 1             && ['d']           ||
            days    < thresholds.d   && ['dd', days]    ||
            months  <= 1             && ['M']           ||
            months  < thresholds.M   && ['MM', months]  ||
            years   <= 1             && ['y']           || ['yy', years];

    a[2] = withoutSuffix;
    a[3] = +posNegDuration > 0;
    a[4] = locale;
    return substituteTimeAgo.apply(null, a);
}

// This function allows you to set the rounding function for relative time strings
function getSetRelativeTimeRounding (roundingFunction) {
    if (roundingFunction === undefined) {
        return round;
    }
    if (typeof(roundingFunction) === 'function') {
        round = roundingFunction;
        return true;
    }
    return false;
}

// This function allows you to set a threshold for relative time strings
function getSetRelativeTimeThreshold (threshold, limit) {
    if (thresholds[threshold] === undefined) {
        return false;
    }
    if (limit === undefined) {
        return thresholds[threshold];
    }
    thresholds[threshold] = limit;
    if (threshold === 's') {
        thresholds.ss = limit - 1;
    }
    return true;
}

function humanize (withSuffix) {
    if (!this.isValid()) {
        return this.localeData().invalidDate();
    }

    var locale = this.localeData();
    var output = relativeTime$1(this, !withSuffix, locale);

    if (withSuffix) {
        output = locale.pastFuture(+this, output);
    }

    return locale.postformat(output);
}

var abs$1 = Math.abs;

function sign(x) {
    return ((x > 0) - (x < 0)) || +x;
}

function toISOString$1() {
    // for ISO strings we do not use the normal bubbling rules:
    //  * milliseconds bubble up until they become hours
    //  * days do not bubble at all
    //  * months bubble up until they become years
    // This is because there is no context-free conversion between hours and days
    // (think of clock changes)
    // and also not between days and months (28-31 days per month)
    if (!this.isValid()) {
        return this.localeData().invalidDate();
    }

    var seconds = abs$1(this._milliseconds) / 1000;
    var days         = abs$1(this._days);
    var months       = abs$1(this._months);
    var minutes, hours, years;

    // 3600 seconds -> 60 minutes -> 1 hour
    minutes           = absFloor(seconds / 60);
    hours             = absFloor(minutes / 60);
    seconds %= 60;
    minutes %= 60;

    // 12 months -> 1 year
    years  = absFloor(months / 12);
    months %= 12;


    // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
    var Y = years;
    var M = months;
    var D = days;
    var h = hours;
    var m = minutes;
    var s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';
    var total = this.asSeconds();

    if (!total) {
        // this is the same as C#'s (Noda) and python (isodate)...
        // but not other JS (goog.date)
        return 'P0D';
    }

    var totalSign = total < 0 ? '-' : '';
    var ymSign = sign(this._months) !== sign(total) ? '-' : '';
    var daysSign = sign(this._days) !== sign(total) ? '-' : '';
    var hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';

    return totalSign + 'P' +
        (Y ? ymSign + Y + 'Y' : '') +
        (M ? ymSign + M + 'M' : '') +
        (D ? daysSign + D + 'D' : '') +
        ((h || m || s) ? 'T' : '') +
        (h ? hmsSign + h + 'H' : '') +
        (m ? hmsSign + m + 'M' : '') +
        (s ? hmsSign + s + 'S' : '');
}

var proto$2 = Duration.prototype;

proto$2.isValid        = isValid$1;
proto$2.abs            = abs;
proto$2.add            = add$1;
proto$2.subtract       = subtract$1;
proto$2.as             = as;
proto$2.asMilliseconds = asMilliseconds;
proto$2.asSeconds      = asSeconds;
proto$2.asMinutes      = asMinutes;
proto$2.asHours        = asHours;
proto$2.asDays         = asDays;
proto$2.asWeeks        = asWeeks;
proto$2.asMonths       = asMonths;
proto$2.asYears        = asYears;
proto$2.valueOf        = valueOf$1;
proto$2._bubble        = bubble;
proto$2.clone          = clone$1;
proto$2.get            = get$2;
proto$2.milliseconds   = milliseconds;
proto$2.seconds        = seconds;
proto$2.minutes        = minutes;
proto$2.hours          = hours;
proto$2.days           = days;
proto$2.weeks          = weeks;
proto$2.months         = months;
proto$2.years          = years;
proto$2.humanize       = humanize;
proto$2.toISOString    = toISOString$1;
proto$2.toString       = toISOString$1;
proto$2.toJSON         = toISOString$1;
proto$2.locale         = locale;
proto$2.localeData     = localeData;

// Deprecations
proto$2.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', toISOString$1);
proto$2.lang = lang;

// Side effect imports

// FORMATTING

addFormatToken('X', 0, 0, 'unix');
addFormatToken('x', 0, 0, 'valueOf');

// PARSING

addRegexToken('x', matchSigned);
addRegexToken('X', matchTimestamp);
addParseToken('X', function (input, array, config) {
    config._d = new Date(parseFloat(input, 10) * 1000);
});
addParseToken('x', function (input, array, config) {
    config._d = new Date(toInt(input));
});

// Side effect imports


hooks.version = '2.19.2';

setHookCallback(createLocal);

hooks.fn                    = proto;
hooks.min                   = min;
hooks.max                   = max;
hooks.now                   = now;
hooks.utc                   = createUTC;
hooks.unix                  = createUnix;
hooks.months                = listMonths;
hooks.isDate                = isDate;
hooks.locale                = getSetGlobalLocale;
hooks.invalid               = createInvalid;
hooks.duration              = createDuration;
hooks.isMoment              = isMoment;
hooks.weekdays              = listWeekdays;
hooks.parseZone             = createInZone;
hooks.localeData            = getLocale;
hooks.isDuration            = isDuration;
hooks.monthsShort           = listMonthsShort;
hooks.weekdaysMin           = listWeekdaysMin;
hooks.defineLocale          = defineLocale;
hooks.updateLocale          = updateLocale;
hooks.locales               = listLocales;
hooks.weekdaysShort         = listWeekdaysShort;
hooks.normalizeUnits        = normalizeUnits;
hooks.relativeTimeRounding  = getSetRelativeTimeRounding;
hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
hooks.calendarFormat        = getCalendarFormat;
hooks.prototype             = proto;

return hooks;

})));

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvQmFja2dyb3VuZC9hcHAuanMiLCJhcHAvQmFja2dyb3VuZC9iYWNrZ3JvdW5kLmpzIiwibm9kZV9tb2R1bGVzL21vbWVudC9tb21lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgYmdNb2R1bGUgPSByZXF1aXJlKCcuLi8uLi9hcHAvQmFja2dyb3VuZC9iYWNrZ3JvdW5kLmpzJyk7XG5cbi8vcmVzZXQgZm9yIGFycmF5cyBvbiBhcHAgcmVsb2FkXG5iZ01vZHVsZS5yZXNldEF0TWlkbmlnaHQoKTtcblxuXG5jaHJvbWUudGFicy5vbkFjdGl2YXRlZC5hZGRMaXN0ZW5lcihmdW5jdGlvbiAoYWN0aXZlSW5mbykge1xuICAgIGNocm9tZS50YWJzLnF1ZXJ5KHthY3RpdmU6IHRydWUsIGN1cnJlbnRXaW5kb3c6IHRydWV9LGZ1bmN0aW9uKHRhYnMpe1xuICAgICAgICBpZih0eXBlb2YgYmdNb2R1bGUucHJldlRhYiA9PSBcInVuZGVmaW5lZFwiKXtcbiAgICAgICAgICAgIGJnTW9kdWxlLnByZXZUYWIgPSBiZ01vZHVsZS5leHRyYWN0RG9tYWluKHRhYnNbMF0udXJsKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBiZ01vZHVsZS51cGRhdGVEZWFjdGl2YXRpb25UaW1lKGJnTW9kdWxlLnByZXZUYWIpO1xuICAgICAgICAgICAgYmdNb2R1bGUucHJldlRhYiA9IGJnTW9kdWxlLmV4dHJhY3REb21haW4odGFic1swXS51cmwpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgY2hyb21lLnRhYnMuZ2V0KGFjdGl2ZUluZm8udGFiSWQsIGZ1bmN0aW9uKHRhYil7XG4gICAgICAgIGlmKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcil7XG4gICAgICAgICAgICB2YXIgZXJyb3JNc2cgPSBjaHJvbWUucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3JNc2cpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGlmKHRhYi5hY3RpdmUgJiYgdGFiLnVybCAhPSBcImNocm9tZTovL25ld3RhYi9cIil7XG4gICAgICAgICAgICAgICAgYmdNb2R1bGUudGFiVXBkYXRlZEFuZEFjdGl2ZSh0YWIudXJsLCB0YWIuZmF2SWNvblVybCk7XG4gICAgICAgICAgICAgICAgYmdNb2R1bGUuZ2xvYmFsVVJMID0gdGFiLnVybDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbi8vQ2hlY2sgaWYgdGhlIHRhYiBpcyBVcGRhdGVkXG5jaHJvbWUudGFicy5vblVwZGF0ZWQuYWRkTGlzdGVuZXIoZnVuY3Rpb24gKHRhYklkLCBjaGFuZ2VJbmZvLCB0YWIpIHtcbiAgaWYodGFiLnVybCAhPSBcImNocm9tZTovL25ld3RhYi9cIil7XG4gICAgICAvL2NoZWNrIGZvciBhbmFjdGl2ZSB0YWIgcmVsb2FkaW5nXG4gICAgICBpZiAodGFiLmFjdGl2ZSkge1xuICAgICAgICAgIC8vY29tYXByZSBpZiB0aGUgZG9tYWluIGlzIHRoZSBzYW1lXG4gICAgICAgICAgaWYgKCF0YWIudXJsLmluY2x1ZGVzKGJnTW9kdWxlLmV4dHJhY3REb21haW4oYmdNb2R1bGUuZ2xvYmFsVVJMKSkpIHtcbiAgICAgICAgICAgICAgaWYgKGNoYW5nZUluZm8uc3RhdHVzID09IFwiY29tcGxldGVcIiAmJiB0YWIuc3RhdHVzID09IFwiY29tcGxldGVcIiAmJiB0YWIudXJsICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgaWYgKHRhYi5hY3RpdmUgJiYgdGFiLnVybCAhPSBcImNocm9tZTovL25ld3RhYi9cIikge1xuICAgICAgICAgICAgICAgICAgICAgIGJnTW9kdWxlLnRhYlVwZGF0ZWRBbmRBY3RpdmUodGFiLnVybCwgdGFiLmZhdkljb25VcmwpO1xuICAgICAgICAgICAgICAgICAgICAgIGJnTW9kdWxlLnVwZGF0ZURlYWN0aXZhdGlvblRpbWUoYmdNb2R1bGUucHJldlRhYik7XG4gICAgICAgICAgICAgICAgICAgICAgYmdNb2R1bGUucHJldlRhYiA9IGJnTW9kdWxlLmV4dHJhY3REb21haW4odGFiLnVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgYmdNb2R1bGUuZ2xvYmFsVVJMID0gdGFiLnVybDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG59KTtcblxuY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKGZ1bmN0aW9uIChyZXF1ZXN0LCBzZW5kZXIsIHNlbmRSZXNwb25zZSkge1xuICAgIGlmIChyZXF1ZXN0LmFjdGlvbiA9PSBcInBvcHVwXCIpIHtcbiAgICAgICAgLy9nZXQgd2Vic2l0ZXNcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KCd3ZWJzaXRlTGlzdCcsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgLy8gTm90aWZ5IHRoYXQgd2Ugc2F2ZWQuXG4gICAgICAgICAgY29uc29sZS5sb2coJ3dlYnNpdGVMaXN0IHB1bGxlZCcpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuXG4gICAgICAgIH0pO1xuICAgICAgICAvL2dldCBibGFja2xpc3RcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KCdibGFja0xpc3QnLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgIC8vIE5vdGlmeSB0aGF0IHdlIHNhdmVkLlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdibGFja0xpc3QgcHVsbGVkJyk7XG4gICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICAvL2dldCB0b3BUZW5ZZXN0ZXJkYXlcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KCdwYXN0RGF5cycsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgLy8gTm90aWZ5IHRoYXQgd2Ugc2F2ZWQuXG4gICAgICAgICAgY29uc29sZS5sb2coJ3Bhc3REYXlzIHB1bGxlZCcpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy9nZXQgdG90YWxWaXNpdHNcbiAgICAgICAgYmdNb2R1bGUudXBkYXRlVG90YWxWaXNpdHMoYmdNb2R1bGUud2Vic2l0ZUxpc3QpO1xuICAgIH1cbiAgICBpZiAocmVxdWVzdC5hY3Rpb24gPT0gXCJyZW1vdmVcIikge1xuICAgICAgICBiZ01vZHVsZS53ZWJzaXRlTGlzdCA9IHJlcXVlc3QubGlzdDtcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsnd2Vic2l0ZUxpc3QnOiBiZ01vZHVsZS53ZWJzaXRlTGlzdH0sIGZ1bmN0aW9uKCkge30pO1xuICAgIH1cbiAgICBpZihyZXF1ZXN0LmFjdGlvbiA9PSBcInVwZGF0ZUJsYWNrTGlzdFwiKXtcbiAgICAgIGJnTW9kdWxlLmJsYWNrTGlzdCA9IHJlcXVlc3QuYmxhY2tMaXN0O1xuICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsnYmxhY2tMaXN0JzogYmdNb2R1bGUuYmxhY2tMaXN0fSwgZnVuY3Rpb24oKSB7XG4gICAgICB9KTtcbiAgICB9XG59KTtcblxuXG5cblxuLy8gQ2hlY2sgaWYgY2hvbWUgaXMgb3V0IG9mIGZvY3VzIG9yIHBjIGluIHNsZWVwIG1vZGVcbmNocm9tZS53aW5kb3dzLm9uRm9jdXNDaGFuZ2VkLmFkZExpc3RlbmVyKGZ1bmN0aW9uKHdpbmRvdykge1xuICAgIGlmICh3aW5kb3cgPT09IGNocm9tZS53aW5kb3dzLldJTkRPV19JRF9OT05FKSB7XG4gICAgICAgIGJnTW9kdWxlLmluRm9jdXMgPSBmYWxzZTtcbiAgICAgICAgaWYoYmdNb2R1bGUucHJldlRhYiAhPT0gXCJcIil7XG4gICAgICAgICAgYmdNb2R1bGUudXBkYXRlRGVhY3RpdmF0aW9uVGltZShiZ01vZHVsZS5wcmV2VGFiKTtcbiAgICAgICAgfVxuICAgICAgICBiZ01vZHVsZS5nbG9iYWxVUkwgPSBiZ01vZHVsZS5wcmV2VGFiO1xuICAgICAgICBjb25zb2xlLmxvZyhcImNocm9tZSBpcyBub3QgYWN0aXZlXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGJnTW9kdWxlLmluRm9jdXMgPSB0cnVlO1xuICAgICAgICBjaHJvbWUudGFicy5xdWVyeSh7YWN0aXZlOiB0cnVlLCBjdXJyZW50V2luZG93OiB0cnVlfSxmdW5jdGlvbih0YWJzKXtcbiAgICAgICAgICBpZihiZ01vZHVsZS5wcmV2VGFiICE9PSBcIlwiKXtcbiAgICAgICAgICAgICAgYmdNb2R1bGUudGFiVXBkYXRlZEFuZEFjdGl2ZShiZ01vZHVsZS5leHRyYWN0RG9tYWluKHRhYnNbMF0udXJsKSk7XG4gICAgICAgICAgICAgIGJnTW9kdWxlLnByZXZUYWIgPSBiZ01vZHVsZS5leHRyYWN0RG9tYWluKHRhYnNbMF0udXJsKTtcbiAgICAgICAgICAgICAgYmdNb2R1bGUuZ2xvYmFsVVJMID0gYmdNb2R1bGUuZXh0cmFjdERvbWFpbih0YWJzWzBdLnVybCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5sb2coXCJjaHJvbWUgaXMgYWN0aXZlXCIpO1xuICAgIH1cbn0pO1xuIiwiXHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxudmFyIGJnTW9kdWxlID0ge1xyXG4gICAgcGFzdERheXMgOiBbXSxcclxuICAgIHdlYnNpdGVMaXN0OiBbXSxcclxuICAgIHRvcFRlblllc3RlcmRheTogW10sXHJcbiAgICBibGFja0xpc3Q6IFtcIm5ld3RhYlwiLCBcImdvb2dsZS5cIiwgXCJjaHJvbWU6Ly9cIiwgXCJsb2NhbGhvc3RcIiwgXCJjaHJvbWUtZXh0ZW5zaW9uOi8vXCIsXCJhYm91dDpibGFua1wiXSxcclxuICAgIGdsb2JhbFVybDogXCJcIixcclxuICAgIHByZXZUYWI6IFwiXCIsXHJcbiAgICBkYXlzZnJvbWluc3RhbGw6IDAsXHJcbiAgICBpbkZvY3VzOiBmYWxzZSxcclxuICAgIGZvcm1hdGVkRGF0ZTogbW9tZW50KCkuZm9ybWF0KFwiRERNTVlZWVlcIiksXHJcbiAgICB0b3RhbDp7XHJcbiAgICAgIFwidG90YWxWaXNpdHNcIjogMFxyXG4gICAgfSxcclxuICAgIGJsYWNrTGlzdEluaXQ6IGZ1bmN0aW9uKCl7XHJcbiAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7J2JsYWNrTGlzdCc6IGJnTW9kdWxlLmJsYWNrTGlzdH0sIGZ1bmN0aW9uKCkge30pO1xyXG4gICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeydwYXN0RGF5cyc6IGJnTW9kdWxlLnBhc3REYXlzfSwgZnVuY3Rpb24oKSB7fSk7XHJcbiAgICB9LFxyXG4gICAgcmVzZXRCbGFja0xpc3Q6IGZ1bmN0aW9uKCl7XHJcbiAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7J2JsYWNrTGlzdCc6IFtdfSwgZnVuY3Rpb24oKSB7XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIHJlc2V0V2Vic2l0ZUxpc3Q6IGZ1bmN0aW9uKCl7XHJcbiAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7J3dlYnNpdGVMaXN0JzogW119LCBmdW5jdGlvbigpIHtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgdXBkYXRlVG90YWxWaXNpdHM6IGZ1bmN0aW9uKGxpc3Qpe1xyXG5cclxuICAgICAgaWYobGlzdC5sZW5ndGg+MTApe1xyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCAxMDsgaSsrKXtcclxuICAgICAgICAgIGJnTW9kdWxlLnRvdGFsLnRvdGFsVmlzaXRzICs9IGxpc3RbaV0ud2Vic2l0ZVZpc2l0cztcclxuICAgICAgICB9XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIGZvcih2YXIgZiA9IDA7IGYgPCBsaXN0Lmxlbmd0aDsgZisrKXtcclxuICAgICAgICAgIGJnTW9kdWxlLnRvdGFsLnRvdGFsVmlzaXRzICs9IGxpc3RbZl0ud2Vic2l0ZVZpc2l0cztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgLy9UT0RPIGFkZCB0b3RhbCB0aW1lXHJcbiAgICB9LFxyXG4gICAgcmVzZXRBdE1pZG5pZ2h0OiBmdW5jdGlvbigpe1xyXG4gICAgICB2YXIgdGltZU5vdyA9IG1vbWVudCgpO1xyXG4gICAgICB2YXIgZW5kT2ZUaGVEYXkgPSBtb21lbnQoKS5lbmRPZignZGF5Jyk7XHJcbiAgICAgIHZhciBuZXh0UmVzZXQgPSBtb21lbnQuZHVyYXRpb24obW9tZW50KGVuZE9mVGhlRGF5KS5kaWZmKHRpbWVOb3cpKTtcclxuXHJcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIGJnTW9kdWxlLmZvcm1hdGVkRGF0ZSA9IG1vbWVudCgpLmZvcm1hdChcIkRETU1ZWVlZXCIpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGJnTW9kdWxlLmZvcm1hdGVkRGF0ZSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJkYXkgcmVzZXQgdGVzdCBhY3RpdmF0ZWRcIik7XHJcbiAgICAgICAgYmdNb2R1bGUuZGF5c2Zyb21pbnN0YWxsKys7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJkYXlzZnJvbWluc3RhbGwgXCIrYmdNb2R1bGUuZGF5c2Zyb21pbnN0YWxsKTtcclxuXHJcbiAgICAgICAgLy9zb3J0IGxpc3QgYnkgdmlzaXRzXHJcbiAgICAgICAgLy9tYXliZSBzYXBhcmF0ZSBtZXRob2RcclxuICAgICAgICBiZ01vZHVsZS53ZWJzaXRlTGlzdCA9IGJnTW9kdWxlLndlYnNpdGVMaXN0LnNvcnQoZnVuY3Rpb24oYSxiKXtcclxuICAgICAgICAgIHJldHVybiBiLndlYnNpdGVWaXNpdHMgLSBhLndlYnNpdGVWaXNpdHM7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vc2F2ZSBwYXN0IGRheVxyXG4gICAgICAgIC8vbWF5YmUgc2FwYXJhdGUgbWV0aG9kXHJcbiAgICAgICAgLy9UT0RPIHRoaXMgZG91YmxlcyB0aGUgdmFsdWUgaWYgcG9wdXAgaXMgb3BlbiBhcyBzYW1lIHRpbWVcclxuICAgICAgICBiZ01vZHVsZS51cGRhdGVUb3RhbFZpc2l0cyhiZ01vZHVsZS53ZWJzaXRlTGlzdCk7XHJcbiAgICAgICAgdmFyIHBhc3REYXkgPSB7XHJcbiAgICAgICAgICAgICAgXCJuYW1lXCI6IGJnTW9kdWxlLmZvcm1hdGVkRGF0ZSxcclxuICAgICAgICAgICAgICBcInRvdGFsVmlzaXRzXCI6IGJnTW9kdWxlLnRvdGFsLnRvdGFsVmlzaXRzLFxyXG4gICAgICAgICAgICAgIFwid2Vic2l0ZUxpc3RcIjogYmdNb2R1bGUud2Vic2l0ZUxpc3Quc2xpY2UoMCwgMTApXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIGJnTW9kdWxlLnBhc3REYXlzLnVuc2hpZnQocGFzdERheSk7XHJcbiAgICAgICAgLy9zYXZlIHBhc3RkYXlzXHJcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsncGFzdERheXMnOiBiZ01vZHVsZS5wYXN0RGF5c30sIGZ1bmN0aW9uKCkge30pO1xyXG4gICAgICAgIC8vbG9vcCBvbnkgNyBkYXlzICg3IG9iamVjdHMpXHJcbiAgICAgICAgLy9tYXliZSBzYXBhcmF0ZSBtZXRob2RcclxuICAgICAgICBpZihiZ01vZHVsZS5wYXN0RGF5cy5sZW5ndGggPiA2KXtcclxuICAgICAgICAgICBiZ01vZHVsZS5wYXN0RGF5cy5zcGxpY2UoLTEsMSk7XHJcbiAgICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsncGFzdERheXMnOiBiZ01vZHVsZS5wYXN0RGF5c30sIGZ1bmN0aW9uKCkge30pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coYmdNb2R1bGUucGFzdERheXMpO1xyXG5cclxuICAgICAgICAvL3Jlc2V0IHZhbHVlc1xyXG4gICAgICAgIC8vbWF5YmUgc2FwYXJhdGUgbWV0aG9kXHJcbiAgICAgICAgYmdNb2R1bGUudG90YWwudG90YWxWaXNpdHMgPSAwO1xyXG4gICAgICAgIGJnTW9kdWxlLndlYnNpdGVMaXN0ID0gW107XHJcbiAgICAgICAgLy9zYXZlIGNoYW5nZXMgdG8gY2hyb21lIHN0cmFnZVxyXG4gICAgICAgIGJnTW9kdWxlLnJlc2V0QXRNaWRuaWdodCgpO1xyXG5cclxuXHJcbiAgICAgIH0sIDMwMDAwKTsvL25leHRSZXNldFxyXG4gICAgfSxcclxuICAgIGV4dHJhY3REb21haW46IGZ1bmN0aW9uICh1cmwpe1xyXG4gICAgICBpZiAodXJsICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIC8vdmFyc1xyXG4gICAgICAgICAgdmFyIGRvbWFpbjtcclxuICAgICAgICAgIHZhciByZWdleCA9IC8oXFwuLiopezIsfS87XHJcblxyXG4gICAgICAgICAgLy9maW5kICYgcmVtb3ZlIHByb3RvY29sIChodHRwLCBmdHAsIGV0Yy4pIGFuZCBnZXQgZG9tYWluXHJcbiAgICAgICAgICBpZiAodXJsLmluZGV4T2YoXCI6Ly9cIikgPiAtMSkge1xyXG4gICAgICAgICAgICAgIGRvbWFpbiA9IHVybC5zcGxpdCgnLycpWzJdO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBkb21haW4gPSB1cmwuc3BsaXQoJy8nKVswXTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vZmluZCAmIHJlbW92ZSBwb3J0IG51bWJlclxyXG4gICAgICAgICAgZG9tYWluID0gZG9tYWluLnNwbGl0KCc6JylbMF07XHJcblxyXG4gICAgICAgICAgLy9yZW1vdmVzIGV2ZXJ5dGhpbmcgYmVmb3JlIDEgZG90IC0gbGlrZTogXCJ3d3dcIlxyXG4gICAgICAgICAgaWYgKHJlZ2V4LnRlc3QoZG9tYWluKSkge1xyXG4gICAgICAgICAgICAgIGRvbWFpbiA9IGRvbWFpbi5zdWJzdHJpbmcoZG9tYWluLmluZGV4T2YoXCIuXCIpICsgMSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB2YXIgYXJyID0gZG9tYWluLm1hdGNoKC9bLl0vZ2kpO1xyXG4gICAgICAgICAgaWYoYXJyID09IG51bGwpe1xyXG4gICAgICAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB2YXIgY291bnRlciA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgICB3aGlsZShjb3VudGVyID4gMSl7XHJcbiAgICAgICAgICAgICAgZG9tYWluID0gZG9tYWluLnN1YnN0cihkb21haW4uaW5kZXhPZignLicpKzEpO1xyXG4gICAgICAgICAgICAgIGNvdW50ZXItLTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBkb21haW47XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICB9LFxyXG4gICAgc2VhcmNoOiBmdW5jdGlvbiAod2Vic2l0ZU5hbWUpe1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJnTW9kdWxlLndlYnNpdGVMaXN0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICBpZiAoYmdNb2R1bGUud2Vic2l0ZUxpc3RbaV0ud2Vic2l0ZU5hbWUgPT09IHdlYnNpdGVOYW1lKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGJnTW9kdWxlLndlYnNpdGVMaXN0W2ldO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfSxcclxuICAgIGJsYWNrTGlzdENoZWNrOiBmdW5jdGlvbiAod2Vic2l0ZU5hbWUpIHtcclxuICAgICAgZm9yICh2YXIgYiA9IDA7IGIgPCBiZ01vZHVsZS5ibGFja0xpc3QubGVuZ3RoOyBiKyspIHtcclxuICAgICAgICAgIGlmICh3ZWJzaXRlTmFtZS5pbmNsdWRlcyhiZ01vZHVsZS5ibGFja0xpc3RbYl0pKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIHNhdmVEYXRhOiBmdW5jdGlvbigpe1xyXG4gICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyd3ZWJzaXRlTGlzdCc6IGJnTW9kdWxlLndlYnNpdGVMaXN0fSwgZnVuY3Rpb24oKSB7XHJcbiAgICAgIH0pO1xyXG4gICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeydibGFja0xpc3QnOiBiZ01vZHVsZS5ibGFja0xpc3R9LCBmdW5jdGlvbigpIHtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgdXBkYXRlRGVhY3RpdmF0aW9uVGltZTogZnVuY3Rpb24gKHRhYlVSTCkge1xyXG4gICAgICB2YXIgd2Vic2l0ZU5hbWUgPSBiZ01vZHVsZS5leHRyYWN0RG9tYWluKHRhYlVSTCk7XHJcbiAgICAgIHZhciBleGlzdGluZ1dlYnNpdGUgPSBiZ01vZHVsZS5zZWFyY2god2Vic2l0ZU5hbWUpO1xyXG4gICAgICBpZiAoZXhpc3RpbmdXZWJzaXRlKSB7XHJcbiAgICAgICAgICB2YXIgZGVhY3RpdmF0aW9uVGltZSA9IG1vbWVudCgpLmZvcm1hdCgpO1xyXG4gICAgICAgICAgdmFyIGR1cmF0aW9uID0gbW9tZW50LmR1cmF0aW9uKG1vbWVudChkZWFjdGl2YXRpb25UaW1lKS5kaWZmKGV4aXN0aW5nV2Vic2l0ZS5zdGFydFRpbWUpKTtcclxuXHJcbiAgICAgICAgICBpZiAoZXhpc3RpbmdXZWJzaXRlLnRpbWVEaWZmZXJlbmNlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICBkdXJhdGlvbiA9IGR1cmF0aW9uLmFkZChleGlzdGluZ1dlYnNpdGUudGltZURpZmZlcmVuY2UpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy9mb3JtYXQgdGltZVxyXG4gICAgICAgICAgdmFyIGRheXMgPSBkdXJhdGlvbi5kYXlzKCk7XHJcbiAgICAgICAgICB2YXIgaG91cnMgPSBkdXJhdGlvbi5ob3VycygpO1xyXG4gICAgICAgICAgdmFyIG1pbiA9IGR1cmF0aW9uLm1pbnV0ZXMoKTtcclxuICAgICAgICAgIHZhciBzZWMgPSBkdXJhdGlvbi5zZWNvbmRzKCk7XHJcbiAgICAgICAgICB2YXIgZm9ybWF0ZWRUaW1lID0ge1xyXG4gICAgICAgICAgICAgIFwiZGF5c1wiOiBkYXlzLFxyXG4gICAgICAgICAgICAgIFwiaG91cnNcIjogaG91cnMsXHJcbiAgICAgICAgICAgICAgXCJtaW5cIjogbWluLFxyXG4gICAgICAgICAgICAgIFwic2VjXCI6IHNlY1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIC8vdXBkYXRlIHZhbHVlc1xyXG4gICAgICAgICAgZXhpc3RpbmdXZWJzaXRlLmRlYWN0aXZhdGlvblRpbWUgPSBkZWFjdGl2YXRpb25UaW1lO1xyXG4gICAgICAgICAgZXhpc3RpbmdXZWJzaXRlLnRpbWVEaWZmZXJlbmNlID0gZHVyYXRpb247XHJcbiAgICAgICAgICBleGlzdGluZ1dlYnNpdGUuZm9ybWF0ZWRUaW1lID0gZm9ybWF0ZWRUaW1lO1xyXG4gICAgICB9XHJcbiAgICAgIGJnTW9kdWxlLnNhdmVEYXRhKCk7XHJcbiAgICB9LFxyXG4gICAgdGFiVXBkYXRlZEFuZEFjdGl2ZTogZnVuY3Rpb24gKG5ld1VybCwgZmF2SWNvbikge1xyXG4gICAgICAvL2JsYWNrbGlzdCBjaGVja1xyXG4gICAgICBpZiAoYmdNb2R1bGUuYmxhY2tMaXN0Q2hlY2sobmV3VXJsKSA9PSBmYWxzZSkge1xyXG4gICAgICAgICAgdmFyIHdlYnNpdGVOYW1lID0gYmdNb2R1bGUuZXh0cmFjdERvbWFpbihuZXdVcmwpO1xyXG4gICAgICAgICAgdmFyIGV4aXN0aW5nV2Vic2l0ZSA9IGJnTW9kdWxlLnNlYXJjaCh3ZWJzaXRlTmFtZSk7XHJcbiAgICAgICAgICB2YXIgc3RhcnQgPSBtb21lbnQoKS5mb3JtYXQoKTtcclxuICAgICAgICAgIC8vZmF2aWNvbiBjaGVja1xyXG4gICAgICAgICAgaWYgKGZhdkljb24gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIGZhdkljb24gPSBcIi9hc3NldHMvaW1hZ2VzL2RlZmF1bHRfaWNvbi5wbmdcIjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICghZXhpc3RpbmdXZWJzaXRlKSB7XHJcbiAgICAgICAgICAgICAgLy9tYXggMzAgd2Vic2l0ZSBjYXAgZm9yIGZhc3RlciBsb2FkaW5nXHJcbiAgICAgICAgICAgICAgaWYoYmdNb2R1bGUud2Vic2l0ZUxpc3QubGVuZ3RoID49MzApe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAvL2FkZCBuZXcgd2Vic2l0ZSB0byB0aGUgbGlzdFxyXG4gICAgICAgICAgICAgIHZhciB3ZWJzaXRlID0ge1xyXG4gICAgICAgICAgICAgICAgICB3ZWJzaXRlTmFtZTogd2Vic2l0ZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgIGZhdkljb246IGZhdkljb24sXHJcbiAgICAgICAgICAgICAgICAgIHdlYnNpdGVWaXNpdHM6IDEsXHJcbiAgICAgICAgICAgICAgICAgIHN0YXJ0VGltZTogc3RhcnQsXHJcbiAgICAgICAgICAgICAgICAgIGRlYWN0aXZhdGlvblRpbWU6IFwiXCIsXHJcbiAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICBiZ01vZHVsZS53ZWJzaXRlTGlzdC5wdXNoKHdlYnNpdGUpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBpZiAoZXhpc3RpbmdXZWJzaXRlLmZhdkljb24gPT0gXCIvYXNzZXRzL2ltYWdlcy9kZWZhdWx0X2ljb24ucG5nXCIpIHtcclxuICAgICAgICAgICAgICAgICAgZXhpc3RpbmdXZWJzaXRlLmZhdkljb24gPSBmYXZJY29uO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAvL2FkZCB0YWIgc3RhcnQgdGltZVxyXG4gICAgICAgICAgICAgIGV4aXN0aW5nV2Vic2l0ZS5zdGFydFRpbWUgPSBzdGFydDtcclxuICAgICAgICAgICAgICAvL2FkZCB2aXNpdHNcclxuICAgICAgICAgICAgICBleGlzdGluZ1dlYnNpdGUud2Vic2l0ZVZpc2l0cysrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgYmdNb2R1bGUuc2F2ZURhdGEoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vbG9nIGlmIGJsb2NrZWRcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiYmxvY2tlZCB3ZWJzaXRlOiBcIiArIG5ld1VybCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxufTtcclxubW9kdWxlLmV4cG9ydHMgPSBiZ01vZHVsZTtcclxuIiwiLy8hIG1vbWVudC5qc1xuLy8hIHZlcnNpb24gOiAyLjE5LjJcbi8vISBhdXRob3JzIDogVGltIFdvb2QsIElza3JlbiBDaGVybmV2LCBNb21lbnQuanMgY29udHJpYnV0b3JzXG4vLyEgbGljZW5zZSA6IE1JVFxuLy8hIG1vbWVudGpzLmNvbVxuXG47KGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKSA6XG4gICAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcbiAgICBnbG9iYWwubW9tZW50ID0gZmFjdG9yeSgpXG59KHRoaXMsIChmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxudmFyIGhvb2tDYWxsYmFjaztcblxuZnVuY3Rpb24gaG9va3MgKCkge1xuICAgIHJldHVybiBob29rQ2FsbGJhY2suYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbn1cblxuLy8gVGhpcyBpcyBkb25lIHRvIHJlZ2lzdGVyIHRoZSBtZXRob2QgY2FsbGVkIHdpdGggbW9tZW50KClcbi8vIHdpdGhvdXQgY3JlYXRpbmcgY2lyY3VsYXIgZGVwZW5kZW5jaWVzLlxuZnVuY3Rpb24gc2V0SG9va0NhbGxiYWNrIChjYWxsYmFjaykge1xuICAgIGhvb2tDYWxsYmFjayA9IGNhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBpc0FycmF5KGlucHV0KSB7XG4gICAgcmV0dXJuIGlucHV0IGluc3RhbmNlb2YgQXJyYXkgfHwgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGlucHV0KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoaW5wdXQpIHtcbiAgICAvLyBJRTggd2lsbCB0cmVhdCB1bmRlZmluZWQgYW5kIG51bGwgYXMgb2JqZWN0IGlmIGl0IHdhc24ndCBmb3JcbiAgICAvLyBpbnB1dCAhPSBudWxsXG4gICAgcmV0dXJuIGlucHV0ICE9IG51bGwgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGlucHV0KSA9PT0gJ1tvYmplY3QgT2JqZWN0XSc7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0RW1wdHkob2JqKSB7XG4gICAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKSB7XG4gICAgICAgIHJldHVybiAoT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMob2JqKS5sZW5ndGggPT09IDApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBrO1xuICAgICAgICBmb3IgKGsgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXQgPT09IHZvaWQgMDtcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoaW5wdXQpIHtcbiAgICByZXR1cm4gdHlwZW9mIGlucHV0ID09PSAnbnVtYmVyJyB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXQpID09PSAnW29iamVjdCBOdW1iZXJdJztcbn1cblxuZnVuY3Rpb24gaXNEYXRlKGlucHV0KSB7XG4gICAgcmV0dXJuIGlucHV0IGluc3RhbmNlb2YgRGF0ZSB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5cbmZ1bmN0aW9uIG1hcChhcnIsIGZuKSB7XG4gICAgdmFyIHJlcyA9IFtdLCBpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgcmVzLnB1c2goZm4oYXJyW2ldLCBpKSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIGhhc093blByb3AoYSwgYikge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYSwgYik7XG59XG5cbmZ1bmN0aW9uIGV4dGVuZChhLCBiKSB7XG4gICAgZm9yICh2YXIgaSBpbiBiKSB7XG4gICAgICAgIGlmIChoYXNPd25Qcm9wKGIsIGkpKSB7XG4gICAgICAgICAgICBhW2ldID0gYltpXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChoYXNPd25Qcm9wKGIsICd0b1N0cmluZycpKSB7XG4gICAgICAgIGEudG9TdHJpbmcgPSBiLnRvU3RyaW5nO1xuICAgIH1cblxuICAgIGlmIChoYXNPd25Qcm9wKGIsICd2YWx1ZU9mJykpIHtcbiAgICAgICAgYS52YWx1ZU9mID0gYi52YWx1ZU9mO1xuICAgIH1cblxuICAgIHJldHVybiBhO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVVVEMgKGlucHV0LCBmb3JtYXQsIGxvY2FsZSwgc3RyaWN0KSB7XG4gICAgcmV0dXJuIGNyZWF0ZUxvY2FsT3JVVEMoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QsIHRydWUpLnV0YygpO1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0UGFyc2luZ0ZsYWdzKCkge1xuICAgIC8vIFdlIG5lZWQgdG8gZGVlcCBjbG9uZSB0aGlzIG9iamVjdC5cbiAgICByZXR1cm4ge1xuICAgICAgICBlbXB0eSAgICAgICAgICAgOiBmYWxzZSxcbiAgICAgICAgdW51c2VkVG9rZW5zICAgIDogW10sXG4gICAgICAgIHVudXNlZElucHV0ICAgICA6IFtdLFxuICAgICAgICBvdmVyZmxvdyAgICAgICAgOiAtMixcbiAgICAgICAgY2hhcnNMZWZ0T3ZlciAgIDogMCxcbiAgICAgICAgbnVsbElucHV0ICAgICAgIDogZmFsc2UsXG4gICAgICAgIGludmFsaWRNb250aCAgICA6IG51bGwsXG4gICAgICAgIGludmFsaWRGb3JtYXQgICA6IGZhbHNlLFxuICAgICAgICB1c2VySW52YWxpZGF0ZWQgOiBmYWxzZSxcbiAgICAgICAgaXNvICAgICAgICAgICAgIDogZmFsc2UsXG4gICAgICAgIHBhcnNlZERhdGVQYXJ0cyA6IFtdLFxuICAgICAgICBtZXJpZGllbSAgICAgICAgOiBudWxsLFxuICAgICAgICByZmMyODIyICAgICAgICAgOiBmYWxzZSxcbiAgICAgICAgd2Vla2RheU1pc21hdGNoIDogZmFsc2VcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBnZXRQYXJzaW5nRmxhZ3MobSkge1xuICAgIGlmIChtLl9wZiA9PSBudWxsKSB7XG4gICAgICAgIG0uX3BmID0gZGVmYXVsdFBhcnNpbmdGbGFncygpO1xuICAgIH1cbiAgICByZXR1cm4gbS5fcGY7XG59XG5cbnZhciBzb21lO1xuaWYgKEFycmF5LnByb3RvdHlwZS5zb21lKSB7XG4gICAgc29tZSA9IEFycmF5LnByb3RvdHlwZS5zb21lO1xufSBlbHNlIHtcbiAgICBzb21lID0gZnVuY3Rpb24gKGZ1bikge1xuICAgICAgICB2YXIgdCA9IE9iamVjdCh0aGlzKTtcbiAgICAgICAgdmFyIGxlbiA9IHQubGVuZ3RoID4+PiAwO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpIGluIHQgJiYgZnVuLmNhbGwodGhpcywgdFtpXSwgaSwgdCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBpc1ZhbGlkKG0pIHtcbiAgICBpZiAobS5faXNWYWxpZCA9PSBudWxsKSB7XG4gICAgICAgIHZhciBmbGFncyA9IGdldFBhcnNpbmdGbGFncyhtKTtcbiAgICAgICAgdmFyIHBhcnNlZFBhcnRzID0gc29tZS5jYWxsKGZsYWdzLnBhcnNlZERhdGVQYXJ0cywgZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgIHJldHVybiBpICE9IG51bGw7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgaXNOb3dWYWxpZCA9ICFpc05hTihtLl9kLmdldFRpbWUoKSkgJiZcbiAgICAgICAgICAgIGZsYWdzLm92ZXJmbG93IDwgMCAmJlxuICAgICAgICAgICAgIWZsYWdzLmVtcHR5ICYmXG4gICAgICAgICAgICAhZmxhZ3MuaW52YWxpZE1vbnRoICYmXG4gICAgICAgICAgICAhZmxhZ3MuaW52YWxpZFdlZWtkYXkgJiZcbiAgICAgICAgICAgICFmbGFncy53ZWVrZGF5TWlzbWF0Y2ggJiZcbiAgICAgICAgICAgICFmbGFncy5udWxsSW5wdXQgJiZcbiAgICAgICAgICAgICFmbGFncy5pbnZhbGlkRm9ybWF0ICYmXG4gICAgICAgICAgICAhZmxhZ3MudXNlckludmFsaWRhdGVkICYmXG4gICAgICAgICAgICAoIWZsYWdzLm1lcmlkaWVtIHx8IChmbGFncy5tZXJpZGllbSAmJiBwYXJzZWRQYXJ0cykpO1xuXG4gICAgICAgIGlmIChtLl9zdHJpY3QpIHtcbiAgICAgICAgICAgIGlzTm93VmFsaWQgPSBpc05vd1ZhbGlkICYmXG4gICAgICAgICAgICAgICAgZmxhZ3MuY2hhcnNMZWZ0T3ZlciA9PT0gMCAmJlxuICAgICAgICAgICAgICAgIGZsYWdzLnVudXNlZFRva2Vucy5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgICAgICAgICBmbGFncy5iaWdIb3VyID09PSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoT2JqZWN0LmlzRnJvemVuID09IG51bGwgfHwgIU9iamVjdC5pc0Zyb3plbihtKSkge1xuICAgICAgICAgICAgbS5faXNWYWxpZCA9IGlzTm93VmFsaWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gaXNOb3dWYWxpZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbS5faXNWYWxpZDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlSW52YWxpZCAoZmxhZ3MpIHtcbiAgICB2YXIgbSA9IGNyZWF0ZVVUQyhOYU4pO1xuICAgIGlmIChmbGFncyAhPSBudWxsKSB7XG4gICAgICAgIGV4dGVuZChnZXRQYXJzaW5nRmxhZ3MobSksIGZsYWdzKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhtKS51c2VySW52YWxpZGF0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBtO1xufVxuXG4vLyBQbHVnaW5zIHRoYXQgYWRkIHByb3BlcnRpZXMgc2hvdWxkIGFsc28gYWRkIHRoZSBrZXkgaGVyZSAobnVsbCB2YWx1ZSksXG4vLyBzbyB3ZSBjYW4gcHJvcGVybHkgY2xvbmUgb3Vyc2VsdmVzLlxudmFyIG1vbWVudFByb3BlcnRpZXMgPSBob29rcy5tb21lbnRQcm9wZXJ0aWVzID0gW107XG5cbmZ1bmN0aW9uIGNvcHlDb25maWcodG8sIGZyb20pIHtcbiAgICB2YXIgaSwgcHJvcCwgdmFsO1xuXG4gICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9pc0FNb21lbnRPYmplY3QpKSB7XG4gICAgICAgIHRvLl9pc0FNb21lbnRPYmplY3QgPSBmcm9tLl9pc0FNb21lbnRPYmplY3Q7XG4gICAgfVxuICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5faSkpIHtcbiAgICAgICAgdG8uX2kgPSBmcm9tLl9pO1xuICAgIH1cbiAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX2YpKSB7XG4gICAgICAgIHRvLl9mID0gZnJvbS5fZjtcbiAgICB9XG4gICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9sKSkge1xuICAgICAgICB0by5fbCA9IGZyb20uX2w7XG4gICAgfVxuICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fc3RyaWN0KSkge1xuICAgICAgICB0by5fc3RyaWN0ID0gZnJvbS5fc3RyaWN0O1xuICAgIH1cbiAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX3R6bSkpIHtcbiAgICAgICAgdG8uX3R6bSA9IGZyb20uX3R6bTtcbiAgICB9XG4gICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9pc1VUQykpIHtcbiAgICAgICAgdG8uX2lzVVRDID0gZnJvbS5faXNVVEM7XG4gICAgfVxuICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fb2Zmc2V0KSkge1xuICAgICAgICB0by5fb2Zmc2V0ID0gZnJvbS5fb2Zmc2V0O1xuICAgIH1cbiAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX3BmKSkge1xuICAgICAgICB0by5fcGYgPSBnZXRQYXJzaW5nRmxhZ3MoZnJvbSk7XG4gICAgfVxuICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fbG9jYWxlKSkge1xuICAgICAgICB0by5fbG9jYWxlID0gZnJvbS5fbG9jYWxlO1xuICAgIH1cblxuICAgIGlmIChtb21lbnRQcm9wZXJ0aWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG1vbWVudFByb3BlcnRpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHByb3AgPSBtb21lbnRQcm9wZXJ0aWVzW2ldO1xuICAgICAgICAgICAgdmFsID0gZnJvbVtwcm9wXTtcbiAgICAgICAgICAgIGlmICghaXNVbmRlZmluZWQodmFsKSkge1xuICAgICAgICAgICAgICAgIHRvW3Byb3BdID0gdmFsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRvO1xufVxuXG52YXIgdXBkYXRlSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXG4vLyBNb21lbnQgcHJvdG90eXBlIG9iamVjdFxuZnVuY3Rpb24gTW9tZW50KGNvbmZpZykge1xuICAgIGNvcHlDb25maWcodGhpcywgY29uZmlnKTtcbiAgICB0aGlzLl9kID0gbmV3IERhdGUoY29uZmlnLl9kICE9IG51bGwgPyBjb25maWcuX2QuZ2V0VGltZSgpIDogTmFOKTtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHRoaXMuX2QgPSBuZXcgRGF0ZShOYU4pO1xuICAgIH1cbiAgICAvLyBQcmV2ZW50IGluZmluaXRlIGxvb3AgaW4gY2FzZSB1cGRhdGVPZmZzZXQgY3JlYXRlcyBuZXcgbW9tZW50XG4gICAgLy8gb2JqZWN0cy5cbiAgICBpZiAodXBkYXRlSW5Qcm9ncmVzcyA9PT0gZmFsc2UpIHtcbiAgICAgICAgdXBkYXRlSW5Qcm9ncmVzcyA9IHRydWU7XG4gICAgICAgIGhvb2tzLnVwZGF0ZU9mZnNldCh0aGlzKTtcbiAgICAgICAgdXBkYXRlSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNNb21lbnQgKG9iaikge1xuICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBNb21lbnQgfHwgKG9iaiAhPSBudWxsICYmIG9iai5faXNBTW9tZW50T2JqZWN0ICE9IG51bGwpO1xufVxuXG5mdW5jdGlvbiBhYnNGbG9vciAobnVtYmVyKSB7XG4gICAgaWYgKG51bWJlciA8IDApIHtcbiAgICAgICAgLy8gLTAgLT4gMFxuICAgICAgICByZXR1cm4gTWF0aC5jZWlsKG51bWJlcikgfHwgMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihudW1iZXIpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdG9JbnQoYXJndW1lbnRGb3JDb2VyY2lvbikge1xuICAgIHZhciBjb2VyY2VkTnVtYmVyID0gK2FyZ3VtZW50Rm9yQ29lcmNpb24sXG4gICAgICAgIHZhbHVlID0gMDtcblxuICAgIGlmIChjb2VyY2VkTnVtYmVyICE9PSAwICYmIGlzRmluaXRlKGNvZXJjZWROdW1iZXIpKSB7XG4gICAgICAgIHZhbHVlID0gYWJzRmxvb3IoY29lcmNlZE51bWJlcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG4vLyBjb21wYXJlIHR3byBhcnJheXMsIHJldHVybiB0aGUgbnVtYmVyIG9mIGRpZmZlcmVuY2VzXG5mdW5jdGlvbiBjb21wYXJlQXJyYXlzKGFycmF5MSwgYXJyYXkyLCBkb250Q29udmVydCkge1xuICAgIHZhciBsZW4gPSBNYXRoLm1pbihhcnJheTEubGVuZ3RoLCBhcnJheTIubGVuZ3RoKSxcbiAgICAgICAgbGVuZ3RoRGlmZiA9IE1hdGguYWJzKGFycmF5MS5sZW5ndGggLSBhcnJheTIubGVuZ3RoKSxcbiAgICAgICAgZGlmZnMgPSAwLFxuICAgICAgICBpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpZiAoKGRvbnRDb252ZXJ0ICYmIGFycmF5MVtpXSAhPT0gYXJyYXkyW2ldKSB8fFxuICAgICAgICAgICAgKCFkb250Q29udmVydCAmJiB0b0ludChhcnJheTFbaV0pICE9PSB0b0ludChhcnJheTJbaV0pKSkge1xuICAgICAgICAgICAgZGlmZnMrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGlmZnMgKyBsZW5ndGhEaWZmO1xufVxuXG5mdW5jdGlvbiB3YXJuKG1zZykge1xuICAgIGlmIChob29rcy5zdXBwcmVzc0RlcHJlY2F0aW9uV2FybmluZ3MgPT09IGZhbHNlICYmXG4gICAgICAgICAgICAodHlwZW9mIGNvbnNvbGUgIT09ICAndW5kZWZpbmVkJykgJiYgY29uc29sZS53YXJuKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignRGVwcmVjYXRpb24gd2FybmluZzogJyArIG1zZyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkZXByZWNhdGUobXNnLCBmbikge1xuICAgIHZhciBmaXJzdFRpbWUgPSB0cnVlO1xuXG4gICAgcmV0dXJuIGV4dGVuZChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChob29rcy5kZXByZWNhdGlvbkhhbmRsZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgaG9va3MuZGVwcmVjYXRpb25IYW5kbGVyKG51bGwsIG1zZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpcnN0VGltZSkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgIHZhciBhcmc7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGFyZyA9ICcnO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYXJndW1lbnRzW2ldID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBhcmcgKz0gJ1xcblsnICsgaSArICddICc7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBhcmd1bWVudHNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyArPSBrZXkgKyAnOiAnICsgYXJndW1lbnRzWzBdW2tleV0gKyAnLCAnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy5zbGljZSgwLCAtMik7IC8vIFJlbW92ZSB0cmFpbGluZyBjb21tYSBhbmQgc3BhY2VcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChhcmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2Fybihtc2cgKyAnXFxuQXJndW1lbnRzOiAnICsgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncykuam9pbignJykgKyAnXFxuJyArIChuZXcgRXJyb3IoKSkuc3RhY2spO1xuICAgICAgICAgICAgZmlyc3RUaW1lID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfSwgZm4pO1xufVxuXG52YXIgZGVwcmVjYXRpb25zID0ge307XG5cbmZ1bmN0aW9uIGRlcHJlY2F0ZVNpbXBsZShuYW1lLCBtc2cpIHtcbiAgICBpZiAoaG9va3MuZGVwcmVjYXRpb25IYW5kbGVyICE9IG51bGwpIHtcbiAgICAgICAgaG9va3MuZGVwcmVjYXRpb25IYW5kbGVyKG5hbWUsIG1zZyk7XG4gICAgfVxuICAgIGlmICghZGVwcmVjYXRpb25zW25hbWVdKSB7XG4gICAgICAgIHdhcm4obXNnKTtcbiAgICAgICAgZGVwcmVjYXRpb25zW25hbWVdID0gdHJ1ZTtcbiAgICB9XG59XG5cbmhvb2tzLnN1cHByZXNzRGVwcmVjYXRpb25XYXJuaW5ncyA9IGZhbHNlO1xuaG9va3MuZGVwcmVjYXRpb25IYW5kbGVyID0gbnVsbDtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihpbnB1dCkge1xuICAgIHJldHVybiBpbnB1dCBpbnN0YW5jZW9mIEZ1bmN0aW9uIHx8IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG59XG5cbmZ1bmN0aW9uIHNldCAoY29uZmlnKSB7XG4gICAgdmFyIHByb3AsIGk7XG4gICAgZm9yIChpIGluIGNvbmZpZykge1xuICAgICAgICBwcm9wID0gY29uZmlnW2ldO1xuICAgICAgICBpZiAoaXNGdW5jdGlvbihwcm9wKSkge1xuICAgICAgICAgICAgdGhpc1tpXSA9IHByb3A7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzWydfJyArIGldID0gcHJvcDtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9jb25maWcgPSBjb25maWc7XG4gICAgLy8gTGVuaWVudCBvcmRpbmFsIHBhcnNpbmcgYWNjZXB0cyBqdXN0IGEgbnVtYmVyIGluIGFkZGl0aW9uIHRvXG4gICAgLy8gbnVtYmVyICsgKHBvc3NpYmx5KSBzdHVmZiBjb21pbmcgZnJvbSBfZGF5T2ZNb250aE9yZGluYWxQYXJzZS5cbiAgICAvLyBUT0RPOiBSZW1vdmUgXCJvcmRpbmFsUGFyc2VcIiBmYWxsYmFjayBpbiBuZXh0IG1ham9yIHJlbGVhc2UuXG4gICAgdGhpcy5fZGF5T2ZNb250aE9yZGluYWxQYXJzZUxlbmllbnQgPSBuZXcgUmVnRXhwKFxuICAgICAgICAodGhpcy5fZGF5T2ZNb250aE9yZGluYWxQYXJzZS5zb3VyY2UgfHwgdGhpcy5fb3JkaW5hbFBhcnNlLnNvdXJjZSkgK1xuICAgICAgICAgICAgJ3wnICsgKC9cXGR7MSwyfS8pLnNvdXJjZSk7XG59XG5cbmZ1bmN0aW9uIG1lcmdlQ29uZmlncyhwYXJlbnRDb25maWcsIGNoaWxkQ29uZmlnKSB7XG4gICAgdmFyIHJlcyA9IGV4dGVuZCh7fSwgcGFyZW50Q29uZmlnKSwgcHJvcDtcbiAgICBmb3IgKHByb3AgaW4gY2hpbGRDb25maWcpIHtcbiAgICAgICAgaWYgKGhhc093blByb3AoY2hpbGRDb25maWcsIHByb3ApKSB7XG4gICAgICAgICAgICBpZiAoaXNPYmplY3QocGFyZW50Q29uZmlnW3Byb3BdKSAmJiBpc09iamVjdChjaGlsZENvbmZpZ1twcm9wXSkpIHtcbiAgICAgICAgICAgICAgICByZXNbcHJvcF0gPSB7fTtcbiAgICAgICAgICAgICAgICBleHRlbmQocmVzW3Byb3BdLCBwYXJlbnRDb25maWdbcHJvcF0pO1xuICAgICAgICAgICAgICAgIGV4dGVuZChyZXNbcHJvcF0sIGNoaWxkQ29uZmlnW3Byb3BdKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hpbGRDb25maWdbcHJvcF0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJlc1twcm9wXSA9IGNoaWxkQ29uZmlnW3Byb3BdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgcmVzW3Byb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAocHJvcCBpbiBwYXJlbnRDb25maWcpIHtcbiAgICAgICAgaWYgKGhhc093blByb3AocGFyZW50Q29uZmlnLCBwcm9wKSAmJlxuICAgICAgICAgICAgICAgICFoYXNPd25Qcm9wKGNoaWxkQ29uZmlnLCBwcm9wKSAmJlxuICAgICAgICAgICAgICAgIGlzT2JqZWN0KHBhcmVudENvbmZpZ1twcm9wXSkpIHtcbiAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSBjaGFuZ2VzIHRvIHByb3BlcnRpZXMgZG9uJ3QgbW9kaWZ5IHBhcmVudCBjb25maWdcbiAgICAgICAgICAgIHJlc1twcm9wXSA9IGV4dGVuZCh7fSwgcmVzW3Byb3BdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG5mdW5jdGlvbiBMb2NhbGUoY29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZyAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuc2V0KGNvbmZpZyk7XG4gICAgfVxufVxuXG52YXIga2V5cztcblxuaWYgKE9iamVjdC5rZXlzKSB7XG4gICAga2V5cyA9IE9iamVjdC5rZXlzO1xufSBlbHNlIHtcbiAgICBrZXlzID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB2YXIgaSwgcmVzID0gW107XG4gICAgICAgIGZvciAoaSBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChoYXNPd25Qcm9wKG9iaiwgaSkpIHtcbiAgICAgICAgICAgICAgICByZXMucHVzaChpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG59XG5cbnZhciBkZWZhdWx0Q2FsZW5kYXIgPSB7XG4gICAgc2FtZURheSA6ICdbVG9kYXkgYXRdIExUJyxcbiAgICBuZXh0RGF5IDogJ1tUb21vcnJvdyBhdF0gTFQnLFxuICAgIG5leHRXZWVrIDogJ2RkZGQgW2F0XSBMVCcsXG4gICAgbGFzdERheSA6ICdbWWVzdGVyZGF5IGF0XSBMVCcsXG4gICAgbGFzdFdlZWsgOiAnW0xhc3RdIGRkZGQgW2F0XSBMVCcsXG4gICAgc2FtZUVsc2UgOiAnTCdcbn07XG5cbmZ1bmN0aW9uIGNhbGVuZGFyIChrZXksIG1vbSwgbm93KSB7XG4gICAgdmFyIG91dHB1dCA9IHRoaXMuX2NhbGVuZGFyW2tleV0gfHwgdGhpcy5fY2FsZW5kYXJbJ3NhbWVFbHNlJ107XG4gICAgcmV0dXJuIGlzRnVuY3Rpb24ob3V0cHV0KSA/IG91dHB1dC5jYWxsKG1vbSwgbm93KSA6IG91dHB1dDtcbn1cblxudmFyIGRlZmF1bHRMb25nRGF0ZUZvcm1hdCA9IHtcbiAgICBMVFMgIDogJ2g6bW06c3MgQScsXG4gICAgTFQgICA6ICdoOm1tIEEnLFxuICAgIEwgICAgOiAnTU0vREQvWVlZWScsXG4gICAgTEwgICA6ICdNTU1NIEQsIFlZWVknLFxuICAgIExMTCAgOiAnTU1NTSBELCBZWVlZIGg6bW0gQScsXG4gICAgTExMTCA6ICdkZGRkLCBNTU1NIEQsIFlZWVkgaDptbSBBJ1xufTtcblxuZnVuY3Rpb24gbG9uZ0RhdGVGb3JtYXQgKGtleSkge1xuICAgIHZhciBmb3JtYXQgPSB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXldLFxuICAgICAgICBmb3JtYXRVcHBlciA9IHRoaXMuX2xvbmdEYXRlRm9ybWF0W2tleS50b1VwcGVyQ2FzZSgpXTtcblxuICAgIGlmIChmb3JtYXQgfHwgIWZvcm1hdFVwcGVyKSB7XG4gICAgICAgIHJldHVybiBmb3JtYXQ7XG4gICAgfVxuXG4gICAgdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5XSA9IGZvcm1hdFVwcGVyLnJlcGxhY2UoL01NTU18TU18RER8ZGRkZC9nLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgIHJldHVybiB2YWwuc2xpY2UoMSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5XTtcbn1cblxudmFyIGRlZmF1bHRJbnZhbGlkRGF0ZSA9ICdJbnZhbGlkIGRhdGUnO1xuXG5mdW5jdGlvbiBpbnZhbGlkRGF0ZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ludmFsaWREYXRlO1xufVxuXG52YXIgZGVmYXVsdE9yZGluYWwgPSAnJWQnO1xudmFyIGRlZmF1bHREYXlPZk1vbnRoT3JkaW5hbFBhcnNlID0gL1xcZHsxLDJ9LztcblxuZnVuY3Rpb24gb3JkaW5hbCAobnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuX29yZGluYWwucmVwbGFjZSgnJWQnLCBudW1iZXIpO1xufVxuXG52YXIgZGVmYXVsdFJlbGF0aXZlVGltZSA9IHtcbiAgICBmdXR1cmUgOiAnaW4gJXMnLFxuICAgIHBhc3QgICA6ICclcyBhZ28nLFxuICAgIHMgIDogJ2EgZmV3IHNlY29uZHMnLFxuICAgIHNzIDogJyVkIHNlY29uZHMnLFxuICAgIG0gIDogJ2EgbWludXRlJyxcbiAgICBtbSA6ICclZCBtaW51dGVzJyxcbiAgICBoICA6ICdhbiBob3VyJyxcbiAgICBoaCA6ICclZCBob3VycycsXG4gICAgZCAgOiAnYSBkYXknLFxuICAgIGRkIDogJyVkIGRheXMnLFxuICAgIE0gIDogJ2EgbW9udGgnLFxuICAgIE1NIDogJyVkIG1vbnRocycsXG4gICAgeSAgOiAnYSB5ZWFyJyxcbiAgICB5eSA6ICclZCB5ZWFycydcbn07XG5cbmZ1bmN0aW9uIHJlbGF0aXZlVGltZSAobnVtYmVyLCB3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKSB7XG4gICAgdmFyIG91dHB1dCA9IHRoaXMuX3JlbGF0aXZlVGltZVtzdHJpbmddO1xuICAgIHJldHVybiAoaXNGdW5jdGlvbihvdXRwdXQpKSA/XG4gICAgICAgIG91dHB1dChudW1iZXIsIHdpdGhvdXRTdWZmaXgsIHN0cmluZywgaXNGdXR1cmUpIDpcbiAgICAgICAgb3V0cHV0LnJlcGxhY2UoLyVkL2ksIG51bWJlcik7XG59XG5cbmZ1bmN0aW9uIHBhc3RGdXR1cmUgKGRpZmYsIG91dHB1dCkge1xuICAgIHZhciBmb3JtYXQgPSB0aGlzLl9yZWxhdGl2ZVRpbWVbZGlmZiA+IDAgPyAnZnV0dXJlJyA6ICdwYXN0J107XG4gICAgcmV0dXJuIGlzRnVuY3Rpb24oZm9ybWF0KSA/IGZvcm1hdChvdXRwdXQpIDogZm9ybWF0LnJlcGxhY2UoLyVzL2ksIG91dHB1dCk7XG59XG5cbnZhciBhbGlhc2VzID0ge307XG5cbmZ1bmN0aW9uIGFkZFVuaXRBbGlhcyAodW5pdCwgc2hvcnRoYW5kKSB7XG4gICAgdmFyIGxvd2VyQ2FzZSA9IHVuaXQudG9Mb3dlckNhc2UoKTtcbiAgICBhbGlhc2VzW2xvd2VyQ2FzZV0gPSBhbGlhc2VzW2xvd2VyQ2FzZSArICdzJ10gPSBhbGlhc2VzW3Nob3J0aGFuZF0gPSB1bml0O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVVbml0cyh1bml0cykge1xuICAgIHJldHVybiB0eXBlb2YgdW5pdHMgPT09ICdzdHJpbmcnID8gYWxpYXNlc1t1bml0c10gfHwgYWxpYXNlc1t1bml0cy50b0xvd2VyQ2FzZSgpXSA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplT2JqZWN0VW5pdHMoaW5wdXRPYmplY3QpIHtcbiAgICB2YXIgbm9ybWFsaXplZElucHV0ID0ge30sXG4gICAgICAgIG5vcm1hbGl6ZWRQcm9wLFxuICAgICAgICBwcm9wO1xuXG4gICAgZm9yIChwcm9wIGluIGlucHV0T2JqZWN0KSB7XG4gICAgICAgIGlmIChoYXNPd25Qcm9wKGlucHV0T2JqZWN0LCBwcm9wKSkge1xuICAgICAgICAgICAgbm9ybWFsaXplZFByb3AgPSBub3JtYWxpemVVbml0cyhwcm9wKTtcbiAgICAgICAgICAgIGlmIChub3JtYWxpemVkUHJvcCkge1xuICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dFtub3JtYWxpemVkUHJvcF0gPSBpbnB1dE9iamVjdFtwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBub3JtYWxpemVkSW5wdXQ7XG59XG5cbnZhciBwcmlvcml0aWVzID0ge307XG5cbmZ1bmN0aW9uIGFkZFVuaXRQcmlvcml0eSh1bml0LCBwcmlvcml0eSkge1xuICAgIHByaW9yaXRpZXNbdW5pdF0gPSBwcmlvcml0eTtcbn1cblxuZnVuY3Rpb24gZ2V0UHJpb3JpdGl6ZWRVbml0cyh1bml0c09iaikge1xuICAgIHZhciB1bml0cyA9IFtdO1xuICAgIGZvciAodmFyIHUgaW4gdW5pdHNPYmopIHtcbiAgICAgICAgdW5pdHMucHVzaCh7dW5pdDogdSwgcHJpb3JpdHk6IHByaW9yaXRpZXNbdV19KTtcbiAgICB9XG4gICAgdW5pdHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICByZXR1cm4gYS5wcmlvcml0eSAtIGIucHJpb3JpdHk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHVuaXRzO1xufVxuXG5mdW5jdGlvbiB6ZXJvRmlsbChudW1iZXIsIHRhcmdldExlbmd0aCwgZm9yY2VTaWduKSB7XG4gICAgdmFyIGFic051bWJlciA9ICcnICsgTWF0aC5hYnMobnVtYmVyKSxcbiAgICAgICAgemVyb3NUb0ZpbGwgPSB0YXJnZXRMZW5ndGggLSBhYnNOdW1iZXIubGVuZ3RoLFxuICAgICAgICBzaWduID0gbnVtYmVyID49IDA7XG4gICAgcmV0dXJuIChzaWduID8gKGZvcmNlU2lnbiA/ICcrJyA6ICcnKSA6ICctJykgK1xuICAgICAgICBNYXRoLnBvdygxMCwgTWF0aC5tYXgoMCwgemVyb3NUb0ZpbGwpKS50b1N0cmluZygpLnN1YnN0cigxKSArIGFic051bWJlcjtcbn1cblxudmFyIGZvcm1hdHRpbmdUb2tlbnMgPSAvKFxcW1teXFxbXSpcXF0pfChcXFxcKT8oW0hoXW1tKHNzKT98TW98TU0/TT9NP3xEb3xERERvfEREP0Q/RD98ZGRkP2Q/fGRvP3x3W298d10/fFdbb3xXXT98UW8/fFlZWVlZWXxZWVlZWXxZWVlZfFlZfGdnKGdnZz8pP3xHRyhHR0c/KT98ZXxFfGF8QXxoaD98SEg/fGtrP3xtbT98c3M/fFN7MSw5fXx4fFh8eno/fFpaP3wuKS9nO1xuXG52YXIgbG9jYWxGb3JtYXR0aW5nVG9rZW5zID0gLyhcXFtbXlxcW10qXFxdKXwoXFxcXCk/KExUU3xMVHxMTD9MP0w/fGx7MSw0fSkvZztcblxudmFyIGZvcm1hdEZ1bmN0aW9ucyA9IHt9O1xuXG52YXIgZm9ybWF0VG9rZW5GdW5jdGlvbnMgPSB7fTtcblxuLy8gdG9rZW46ICAgICdNJ1xuLy8gcGFkZGVkOiAgIFsnTU0nLCAyXVxuLy8gb3JkaW5hbDogICdNbydcbi8vIGNhbGxiYWNrOiBmdW5jdGlvbiAoKSB7IHRoaXMubW9udGgoKSArIDEgfVxuZnVuY3Rpb24gYWRkRm9ybWF0VG9rZW4gKHRva2VuLCBwYWRkZWQsIG9yZGluYWwsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGZ1bmMgPSBjYWxsYmFjaztcbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnc3RyaW5nJykge1xuICAgICAgICBmdW5jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbY2FsbGJhY2tdKCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmICh0b2tlbikge1xuICAgICAgICBmb3JtYXRUb2tlbkZ1bmN0aW9uc1t0b2tlbl0gPSBmdW5jO1xuICAgIH1cbiAgICBpZiAocGFkZGVkKSB7XG4gICAgICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zW3BhZGRlZFswXV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gemVyb0ZpbGwoZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpLCBwYWRkZWRbMV0sIHBhZGRlZFsyXSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmIChvcmRpbmFsKSB7XG4gICAgICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zW29yZGluYWxdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm9yZGluYWwoZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpLCB0b2tlbik7XG4gICAgICAgIH07XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVGb3JtYXR0aW5nVG9rZW5zKGlucHV0KSB7XG4gICAgaWYgKGlucHV0Lm1hdGNoKC9cXFtbXFxzXFxTXS8pKSB7XG4gICAgICAgIHJldHVybiBpbnB1dC5yZXBsYWNlKC9eXFxbfFxcXSQvZywgJycpO1xuICAgIH1cbiAgICByZXR1cm4gaW5wdXQucmVwbGFjZSgvXFxcXC9nLCAnJyk7XG59XG5cbmZ1bmN0aW9uIG1ha2VGb3JtYXRGdW5jdGlvbihmb3JtYXQpIHtcbiAgICB2YXIgYXJyYXkgPSBmb3JtYXQubWF0Y2goZm9ybWF0dGluZ1Rva2VucyksIGksIGxlbmd0aDtcblxuICAgIGZvciAoaSA9IDAsIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChmb3JtYXRUb2tlbkZ1bmN0aW9uc1thcnJheVtpXV0pIHtcbiAgICAgICAgICAgIGFycmF5W2ldID0gZm9ybWF0VG9rZW5GdW5jdGlvbnNbYXJyYXlbaV1dO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXJyYXlbaV0gPSByZW1vdmVGb3JtYXR0aW5nVG9rZW5zKGFycmF5W2ldKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAobW9tKSB7XG4gICAgICAgIHZhciBvdXRwdXQgPSAnJywgaTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBvdXRwdXQgKz0gaXNGdW5jdGlvbihhcnJheVtpXSkgPyBhcnJheVtpXS5jYWxsKG1vbSwgZm9ybWF0KSA6IGFycmF5W2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfTtcbn1cblxuLy8gZm9ybWF0IGRhdGUgdXNpbmcgbmF0aXZlIGRhdGUgb2JqZWN0XG5mdW5jdGlvbiBmb3JtYXRNb21lbnQobSwgZm9ybWF0KSB7XG4gICAgaWYgKCFtLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gbS5sb2NhbGVEYXRhKCkuaW52YWxpZERhdGUoKTtcbiAgICB9XG5cbiAgICBmb3JtYXQgPSBleHBhbmRGb3JtYXQoZm9ybWF0LCBtLmxvY2FsZURhdGEoKSk7XG4gICAgZm9ybWF0RnVuY3Rpb25zW2Zvcm1hdF0gPSBmb3JtYXRGdW5jdGlvbnNbZm9ybWF0XSB8fCBtYWtlRm9ybWF0RnVuY3Rpb24oZm9ybWF0KTtcblxuICAgIHJldHVybiBmb3JtYXRGdW5jdGlvbnNbZm9ybWF0XShtKTtcbn1cblxuZnVuY3Rpb24gZXhwYW5kRm9ybWF0KGZvcm1hdCwgbG9jYWxlKSB7XG4gICAgdmFyIGkgPSA1O1xuXG4gICAgZnVuY3Rpb24gcmVwbGFjZUxvbmdEYXRlRm9ybWF0VG9rZW5zKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBsb2NhbGUubG9uZ0RhdGVGb3JtYXQoaW5wdXQpIHx8IGlucHV0O1xuICAgIH1cblxuICAgIGxvY2FsRm9ybWF0dGluZ1Rva2Vucy5sYXN0SW5kZXggPSAwO1xuICAgIHdoaWxlIChpID49IDAgJiYgbG9jYWxGb3JtYXR0aW5nVG9rZW5zLnRlc3QoZm9ybWF0KSkge1xuICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZShsb2NhbEZvcm1hdHRpbmdUb2tlbnMsIHJlcGxhY2VMb25nRGF0ZUZvcm1hdFRva2Vucyk7XG4gICAgICAgIGxvY2FsRm9ybWF0dGluZ1Rva2Vucy5sYXN0SW5kZXggPSAwO1xuICAgICAgICBpIC09IDE7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZvcm1hdDtcbn1cblxudmFyIG1hdGNoMSAgICAgICAgID0gL1xcZC87ICAgICAgICAgICAgLy8gICAgICAgMCAtIDlcbnZhciBtYXRjaDIgICAgICAgICA9IC9cXGRcXGQvOyAgICAgICAgICAvLyAgICAgIDAwIC0gOTlcbnZhciBtYXRjaDMgICAgICAgICA9IC9cXGR7M30vOyAgICAgICAgIC8vICAgICAwMDAgLSA5OTlcbnZhciBtYXRjaDQgICAgICAgICA9IC9cXGR7NH0vOyAgICAgICAgIC8vICAgIDAwMDAgLSA5OTk5XG52YXIgbWF0Y2g2ICAgICAgICAgPSAvWystXT9cXGR7Nn0vOyAgICAvLyAtOTk5OTk5IC0gOTk5OTk5XG52YXIgbWF0Y2gxdG8yICAgICAgPSAvXFxkXFxkPy87ICAgICAgICAgLy8gICAgICAgMCAtIDk5XG52YXIgbWF0Y2gzdG80ICAgICAgPSAvXFxkXFxkXFxkXFxkPy87ICAgICAvLyAgICAgOTk5IC0gOTk5OVxudmFyIG1hdGNoNXRvNiAgICAgID0gL1xcZFxcZFxcZFxcZFxcZFxcZD8vOyAvLyAgIDk5OTk5IC0gOTk5OTk5XG52YXIgbWF0Y2gxdG8zICAgICAgPSAvXFxkezEsM30vOyAgICAgICAvLyAgICAgICAwIC0gOTk5XG52YXIgbWF0Y2gxdG80ICAgICAgPSAvXFxkezEsNH0vOyAgICAgICAvLyAgICAgICAwIC0gOTk5OVxudmFyIG1hdGNoMXRvNiAgICAgID0gL1srLV0/XFxkezEsNn0vOyAgLy8gLTk5OTk5OSAtIDk5OTk5OVxuXG52YXIgbWF0Y2hVbnNpZ25lZCAgPSAvXFxkKy87ICAgICAgICAgICAvLyAgICAgICAwIC0gaW5mXG52YXIgbWF0Y2hTaWduZWQgICAgPSAvWystXT9cXGQrLzsgICAgICAvLyAgICAtaW5mIC0gaW5mXG5cbnZhciBtYXRjaE9mZnNldCAgICA9IC9afFsrLV1cXGRcXGQ6P1xcZFxcZC9naTsgLy8gKzAwOjAwIC0wMDowMCArMDAwMCAtMDAwMCBvciBaXG52YXIgbWF0Y2hTaG9ydE9mZnNldCA9IC9afFsrLV1cXGRcXGQoPzo6P1xcZFxcZCk/L2dpOyAvLyArMDAgLTAwICswMDowMCAtMDA6MDAgKzAwMDAgLTAwMDAgb3IgWlxuXG52YXIgbWF0Y2hUaW1lc3RhbXAgPSAvWystXT9cXGQrKFxcLlxcZHsxLDN9KT8vOyAvLyAxMjM0NTY3ODkgMTIzNDU2Nzg5LjEyM1xuXG4vLyBhbnkgd29yZCAob3IgdHdvKSBjaGFyYWN0ZXJzIG9yIG51bWJlcnMgaW5jbHVkaW5nIHR3by90aHJlZSB3b3JkIG1vbnRoIGluIGFyYWJpYy5cbi8vIGluY2x1ZGVzIHNjb3R0aXNoIGdhZWxpYyB0d28gd29yZCBhbmQgaHlwaGVuYXRlZCBtb250aHNcbnZhciBtYXRjaFdvcmQgPSAvWzAtOV0qWydhLXpcXHUwMEEwLVxcdTA1RkZcXHUwNzAwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdK3xbXFx1MDYwMC1cXHUwNkZGXFwvXSsoXFxzKj9bXFx1MDYwMC1cXHUwNkZGXSspezEsMn0vaTtcblxuXG52YXIgcmVnZXhlcyA9IHt9O1xuXG5mdW5jdGlvbiBhZGRSZWdleFRva2VuICh0b2tlbiwgcmVnZXgsIHN0cmljdFJlZ2V4KSB7XG4gICAgcmVnZXhlc1t0b2tlbl0gPSBpc0Z1bmN0aW9uKHJlZ2V4KSA/IHJlZ2V4IDogZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGVEYXRhKSB7XG4gICAgICAgIHJldHVybiAoaXNTdHJpY3QgJiYgc3RyaWN0UmVnZXgpID8gc3RyaWN0UmVnZXggOiByZWdleDtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBnZXRQYXJzZVJlZ2V4Rm9yVG9rZW4gKHRva2VuLCBjb25maWcpIHtcbiAgICBpZiAoIWhhc093blByb3AocmVnZXhlcywgdG9rZW4pKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHVuZXNjYXBlRm9ybWF0KHRva2VuKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlZ2V4ZXNbdG9rZW5dKGNvbmZpZy5fc3RyaWN0LCBjb25maWcuX2xvY2FsZSk7XG59XG5cbi8vIENvZGUgZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM1NjE0OTMvaXMtdGhlcmUtYS1yZWdleHAtZXNjYXBlLWZ1bmN0aW9uLWluLWphdmFzY3JpcHRcbmZ1bmN0aW9uIHVuZXNjYXBlRm9ybWF0KHMpIHtcbiAgICByZXR1cm4gcmVnZXhFc2NhcGUocy5yZXBsYWNlKCdcXFxcJywgJycpLnJlcGxhY2UoL1xcXFwoXFxbKXxcXFxcKFxcXSl8XFxbKFteXFxdXFxbXSopXFxdfFxcXFwoLikvZywgZnVuY3Rpb24gKG1hdGNoZWQsIHAxLCBwMiwgcDMsIHA0KSB7XG4gICAgICAgIHJldHVybiBwMSB8fCBwMiB8fCBwMyB8fCBwNDtcbiAgICB9KSk7XG59XG5cbmZ1bmN0aW9uIHJlZ2V4RXNjYXBlKHMpIHtcbiAgICByZXR1cm4gcy5yZXBsYWNlKC9bLVxcL1xcXFxeJCorPy4oKXxbXFxde31dL2csICdcXFxcJCYnKTtcbn1cblxudmFyIHRva2VucyA9IHt9O1xuXG5mdW5jdGlvbiBhZGRQYXJzZVRva2VuICh0b2tlbiwgY2FsbGJhY2spIHtcbiAgICB2YXIgaSwgZnVuYyA9IGNhbGxiYWNrO1xuICAgIGlmICh0eXBlb2YgdG9rZW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRva2VuID0gW3Rva2VuXTtcbiAgICB9XG4gICAgaWYgKGlzTnVtYmVyKGNhbGxiYWNrKSkge1xuICAgICAgICBmdW5jID0gZnVuY3Rpb24gKGlucHV0LCBhcnJheSkge1xuICAgICAgICAgICAgYXJyYXlbY2FsbGJhY2tdID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgdG9rZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdG9rZW5zW3Rva2VuW2ldXSA9IGZ1bmM7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhZGRXZWVrUGFyc2VUb2tlbiAodG9rZW4sIGNhbGxiYWNrKSB7XG4gICAgYWRkUGFyc2VUb2tlbih0b2tlbiwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnLCB0b2tlbikge1xuICAgICAgICBjb25maWcuX3cgPSBjb25maWcuX3cgfHwge307XG4gICAgICAgIGNhbGxiYWNrKGlucHV0LCBjb25maWcuX3csIGNvbmZpZywgdG9rZW4pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBhZGRUaW1lVG9BcnJheUZyb21Ub2tlbih0b2tlbiwgaW5wdXQsIGNvbmZpZykge1xuICAgIGlmIChpbnB1dCAhPSBudWxsICYmIGhhc093blByb3AodG9rZW5zLCB0b2tlbikpIHtcbiAgICAgICAgdG9rZW5zW3Rva2VuXShpbnB1dCwgY29uZmlnLl9hLCBjb25maWcsIHRva2VuKTtcbiAgICB9XG59XG5cbnZhciBZRUFSID0gMDtcbnZhciBNT05USCA9IDE7XG52YXIgREFURSA9IDI7XG52YXIgSE9VUiA9IDM7XG52YXIgTUlOVVRFID0gNDtcbnZhciBTRUNPTkQgPSA1O1xudmFyIE1JTExJU0VDT05EID0gNjtcbnZhciBXRUVLID0gNztcbnZhciBXRUVLREFZID0gODtcblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbignWScsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgeSA9IHRoaXMueWVhcigpO1xuICAgIHJldHVybiB5IDw9IDk5OTkgPyAnJyArIHkgOiAnKycgKyB5O1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKDAsIFsnWVknLCAyXSwgMCwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnllYXIoKSAlIDEwMDtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbigwLCBbJ1lZWVknLCAgIDRdLCAgICAgICAwLCAneWVhcicpO1xuYWRkRm9ybWF0VG9rZW4oMCwgWydZWVlZWScsICA1XSwgICAgICAgMCwgJ3llYXInKTtcbmFkZEZvcm1hdFRva2VuKDAsIFsnWVlZWVlZJywgNiwgdHJ1ZV0sIDAsICd5ZWFyJyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCd5ZWFyJywgJ3knKTtcblxuLy8gUFJJT1JJVElFU1xuXG5hZGRVbml0UHJpb3JpdHkoJ3llYXInLCAxKTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdZJywgICAgICBtYXRjaFNpZ25lZCk7XG5hZGRSZWdleFRva2VuKCdZWScsICAgICBtYXRjaDF0bzIsIG1hdGNoMik7XG5hZGRSZWdleFRva2VuKCdZWVlZJywgICBtYXRjaDF0bzQsIG1hdGNoNCk7XG5hZGRSZWdleFRva2VuKCdZWVlZWScsICBtYXRjaDF0bzYsIG1hdGNoNik7XG5hZGRSZWdleFRva2VuKCdZWVlZWVknLCBtYXRjaDF0bzYsIG1hdGNoNik7XG5cbmFkZFBhcnNlVG9rZW4oWydZWVlZWScsICdZWVlZWVknXSwgWUVBUik7XG5hZGRQYXJzZVRva2VuKCdZWVlZJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSkge1xuICAgIGFycmF5W1lFQVJdID0gaW5wdXQubGVuZ3RoID09PSAyID8gaG9va3MucGFyc2VUd29EaWdpdFllYXIoaW5wdXQpIDogdG9JbnQoaW5wdXQpO1xufSk7XG5hZGRQYXJzZVRva2VuKCdZWScsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICBhcnJheVtZRUFSXSA9IGhvb2tzLnBhcnNlVHdvRGlnaXRZZWFyKGlucHV0KTtcbn0pO1xuYWRkUGFyc2VUb2tlbignWScsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICBhcnJheVtZRUFSXSA9IHBhcnNlSW50KGlucHV0LCAxMCk7XG59KTtcblxuLy8gSEVMUEVSU1xuXG5mdW5jdGlvbiBkYXlzSW5ZZWFyKHllYXIpIHtcbiAgICByZXR1cm4gaXNMZWFwWWVhcih5ZWFyKSA/IDM2NiA6IDM2NTtcbn1cblxuZnVuY3Rpb24gaXNMZWFwWWVhcih5ZWFyKSB7XG4gICAgcmV0dXJuICh5ZWFyICUgNCA9PT0gMCAmJiB5ZWFyICUgMTAwICE9PSAwKSB8fCB5ZWFyICUgNDAwID09PSAwO1xufVxuXG4vLyBIT09LU1xuXG5ob29rcy5wYXJzZVR3b0RpZ2l0WWVhciA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgIHJldHVybiB0b0ludChpbnB1dCkgKyAodG9JbnQoaW5wdXQpID4gNjggPyAxOTAwIDogMjAwMCk7XG59O1xuXG4vLyBNT01FTlRTXG5cbnZhciBnZXRTZXRZZWFyID0gbWFrZUdldFNldCgnRnVsbFllYXInLCB0cnVlKTtcblxuZnVuY3Rpb24gZ2V0SXNMZWFwWWVhciAoKSB7XG4gICAgcmV0dXJuIGlzTGVhcFllYXIodGhpcy55ZWFyKCkpO1xufVxuXG5mdW5jdGlvbiBtYWtlR2V0U2V0ICh1bml0LCBrZWVwVGltZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHNldCQxKHRoaXMsIHVuaXQsIHZhbHVlKTtcbiAgICAgICAgICAgIGhvb2tzLnVwZGF0ZU9mZnNldCh0aGlzLCBrZWVwVGltZSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBnZXQodGhpcywgdW5pdCk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBnZXQgKG1vbSwgdW5pdCkge1xuICAgIHJldHVybiBtb20uaXNWYWxpZCgpID9cbiAgICAgICAgbW9tLl9kWydnZXQnICsgKG1vbS5faXNVVEMgPyAnVVRDJyA6ICcnKSArIHVuaXRdKCkgOiBOYU47XG59XG5cbmZ1bmN0aW9uIHNldCQxIChtb20sIHVuaXQsIHZhbHVlKSB7XG4gICAgaWYgKG1vbS5pc1ZhbGlkKCkgJiYgIWlzTmFOKHZhbHVlKSkge1xuICAgICAgICBpZiAodW5pdCA9PT0gJ0Z1bGxZZWFyJyAmJiBpc0xlYXBZZWFyKG1vbS55ZWFyKCkpICYmIG1vbS5tb250aCgpID09PSAxICYmIG1vbS5kYXRlKCkgPT09IDI5KSB7XG4gICAgICAgICAgICBtb20uX2RbJ3NldCcgKyAobW9tLl9pc1VUQyA/ICdVVEMnIDogJycpICsgdW5pdF0odmFsdWUsIG1vbS5tb250aCgpLCBkYXlzSW5Nb250aCh2YWx1ZSwgbW9tLm1vbnRoKCkpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG1vbS5fZFsnc2V0JyArIChtb20uX2lzVVRDID8gJ1VUQycgOiAnJykgKyB1bml0XSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIE1PTUVOVFNcblxuZnVuY3Rpb24gc3RyaW5nR2V0ICh1bml0cykge1xuICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgIGlmIChpc0Z1bmN0aW9uKHRoaXNbdW5pdHNdKSkge1xuICAgICAgICByZXR1cm4gdGhpc1t1bml0c10oKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cblxuZnVuY3Rpb24gc3RyaW5nU2V0ICh1bml0cywgdmFsdWUpIHtcbiAgICBpZiAodHlwZW9mIHVuaXRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZU9iamVjdFVuaXRzKHVuaXRzKTtcbiAgICAgICAgdmFyIHByaW9yaXRpemVkID0gZ2V0UHJpb3JpdGl6ZWRVbml0cyh1bml0cyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJpb3JpdGl6ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXNbcHJpb3JpdGl6ZWRbaV0udW5pdF0odW5pdHNbcHJpb3JpdGl6ZWRbaV0udW5pdF0pO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHRoaXNbdW5pdHNdKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbdW5pdHNdKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gbW9kKG4sIHgpIHtcbiAgICByZXR1cm4gKChuICUgeCkgKyB4KSAlIHg7XG59XG5cbnZhciBpbmRleE9mO1xuXG5pZiAoQXJyYXkucHJvdG90eXBlLmluZGV4T2YpIHtcbiAgICBpbmRleE9mID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2Y7XG59IGVsc2Uge1xuICAgIGluZGV4T2YgPSBmdW5jdGlvbiAobykge1xuICAgICAgICAvLyBJIGtub3dcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAodGhpc1tpXSA9PT0gbykge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBkYXlzSW5Nb250aCh5ZWFyLCBtb250aCkge1xuICAgIGlmIChpc05hTih5ZWFyKSB8fCBpc05hTihtb250aCkpIHtcbiAgICAgICAgcmV0dXJuIE5hTjtcbiAgICB9XG4gICAgdmFyIG1vZE1vbnRoID0gbW9kKG1vbnRoLCAxMik7XG4gICAgeWVhciArPSAobW9udGggLSBtb2RNb250aCkgLyAxMjtcbiAgICByZXR1cm4gbW9kTW9udGggPT09IDEgPyAoaXNMZWFwWWVhcih5ZWFyKSA/IDI5IDogMjgpIDogKDMxIC0gbW9kTW9udGggJSA3ICUgMik7XG59XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ00nLCBbJ01NJywgMl0sICdNbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5tb250aCgpICsgMTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbignTU1NJywgMCwgMCwgZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS5tb250aHNTaG9ydCh0aGlzLCBmb3JtYXQpO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdNTU1NJywgMCwgMCwgZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS5tb250aHModGhpcywgZm9ybWF0KTtcbn0pO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygnbW9udGgnLCAnTScpO1xuXG4vLyBQUklPUklUWVxuXG5hZGRVbml0UHJpb3JpdHkoJ21vbnRoJywgOCk7XG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbignTScsICAgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCdNTScsICAgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuYWRkUmVnZXhUb2tlbignTU1NJywgIGZ1bmN0aW9uIChpc1N0cmljdCwgbG9jYWxlKSB7XG4gICAgcmV0dXJuIGxvY2FsZS5tb250aHNTaG9ydFJlZ2V4KGlzU3RyaWN0KTtcbn0pO1xuYWRkUmVnZXhUb2tlbignTU1NTScsIGZ1bmN0aW9uIChpc1N0cmljdCwgbG9jYWxlKSB7XG4gICAgcmV0dXJuIGxvY2FsZS5tb250aHNSZWdleChpc1N0cmljdCk7XG59KTtcblxuYWRkUGFyc2VUb2tlbihbJ00nLCAnTU0nXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSkge1xuICAgIGFycmF5W01PTlRIXSA9IHRvSW50KGlucHV0KSAtIDE7XG59KTtcblxuYWRkUGFyc2VUb2tlbihbJ01NTScsICdNTU1NJ10sIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZywgdG9rZW4pIHtcbiAgICB2YXIgbW9udGggPSBjb25maWcuX2xvY2FsZS5tb250aHNQYXJzZShpbnB1dCwgdG9rZW4sIGNvbmZpZy5fc3RyaWN0KTtcbiAgICAvLyBpZiB3ZSBkaWRuJ3QgZmluZCBhIG1vbnRoIG5hbWUsIG1hcmsgdGhlIGRhdGUgYXMgaW52YWxpZC5cbiAgICBpZiAobW9udGggIT0gbnVsbCkge1xuICAgICAgICBhcnJheVtNT05USF0gPSBtb250aDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5pbnZhbGlkTW9udGggPSBpbnB1dDtcbiAgICB9XG59KTtcblxuLy8gTE9DQUxFU1xuXG52YXIgTU9OVEhTX0lOX0ZPUk1BVCA9IC9EW29EXT8oXFxbW15cXFtcXF1dKlxcXXxcXHMpK01NTU0/LztcbnZhciBkZWZhdWx0TG9jYWxlTW9udGhzID0gJ0phbnVhcnlfRmVicnVhcnlfTWFyY2hfQXByaWxfTWF5X0p1bmVfSnVseV9BdWd1c3RfU2VwdGVtYmVyX09jdG9iZXJfTm92ZW1iZXJfRGVjZW1iZXInLnNwbGl0KCdfJyk7XG5mdW5jdGlvbiBsb2NhbGVNb250aHMgKG0sIGZvcm1hdCkge1xuICAgIGlmICghbSkge1xuICAgICAgICByZXR1cm4gaXNBcnJheSh0aGlzLl9tb250aHMpID8gdGhpcy5fbW9udGhzIDpcbiAgICAgICAgICAgIHRoaXMuX21vbnRoc1snc3RhbmRhbG9uZSddO1xuICAgIH1cbiAgICByZXR1cm4gaXNBcnJheSh0aGlzLl9tb250aHMpID8gdGhpcy5fbW9udGhzW20ubW9udGgoKV0gOlxuICAgICAgICB0aGlzLl9tb250aHNbKHRoaXMuX21vbnRocy5pc0Zvcm1hdCB8fCBNT05USFNfSU5fRk9STUFUKS50ZXN0KGZvcm1hdCkgPyAnZm9ybWF0JyA6ICdzdGFuZGFsb25lJ11bbS5tb250aCgpXTtcbn1cblxudmFyIGRlZmF1bHRMb2NhbGVNb250aHNTaG9ydCA9ICdKYW5fRmViX01hcl9BcHJfTWF5X0p1bl9KdWxfQXVnX1NlcF9PY3RfTm92X0RlYycuc3BsaXQoJ18nKTtcbmZ1bmN0aW9uIGxvY2FsZU1vbnRoc1Nob3J0IChtLCBmb3JtYXQpIHtcbiAgICBpZiAoIW0pIHtcbiAgICAgICAgcmV0dXJuIGlzQXJyYXkodGhpcy5fbW9udGhzU2hvcnQpID8gdGhpcy5fbW9udGhzU2hvcnQgOlxuICAgICAgICAgICAgdGhpcy5fbW9udGhzU2hvcnRbJ3N0YW5kYWxvbmUnXTtcbiAgICB9XG4gICAgcmV0dXJuIGlzQXJyYXkodGhpcy5fbW9udGhzU2hvcnQpID8gdGhpcy5fbW9udGhzU2hvcnRbbS5tb250aCgpXSA6XG4gICAgICAgIHRoaXMuX21vbnRoc1Nob3J0W01PTlRIU19JTl9GT1JNQVQudGVzdChmb3JtYXQpID8gJ2Zvcm1hdCcgOiAnc3RhbmRhbG9uZSddW20ubW9udGgoKV07XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVN0cmljdFBhcnNlKG1vbnRoTmFtZSwgZm9ybWF0LCBzdHJpY3QpIHtcbiAgICB2YXIgaSwgaWksIG1vbSwgbGxjID0gbW9udGhOYW1lLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgaWYgKCF0aGlzLl9tb250aHNQYXJzZSkge1xuICAgICAgICAvLyB0aGlzIGlzIG5vdCB1c2VkXG4gICAgICAgIHRoaXMuX21vbnRoc1BhcnNlID0gW107XG4gICAgICAgIHRoaXMuX2xvbmdNb250aHNQYXJzZSA9IFtdO1xuICAgICAgICB0aGlzLl9zaG9ydE1vbnRoc1BhcnNlID0gW107XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgKytpKSB7XG4gICAgICAgICAgICBtb20gPSBjcmVhdGVVVEMoWzIwMDAsIGldKTtcbiAgICAgICAgICAgIHRoaXMuX3Nob3J0TW9udGhzUGFyc2VbaV0gPSB0aGlzLm1vbnRoc1Nob3J0KG1vbSwgJycpLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB0aGlzLl9sb25nTW9udGhzUGFyc2VbaV0gPSB0aGlzLm1vbnRocyhtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN0cmljdCkge1xuICAgICAgICBpZiAoZm9ybWF0ID09PSAnTU1NJykge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fc2hvcnRNb250aHNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9sb25nTW9udGhzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ01NTScpIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZi5jYWxsKHRoaXMuX3Nob3J0TW9udGhzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fbG9uZ01vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZi5jYWxsKHRoaXMuX2xvbmdNb250aHNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9zaG9ydE1vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9jYWxlTW9udGhzUGFyc2UgKG1vbnRoTmFtZSwgZm9ybWF0LCBzdHJpY3QpIHtcbiAgICB2YXIgaSwgbW9tLCByZWdleDtcblxuICAgIGlmICh0aGlzLl9tb250aHNQYXJzZUV4YWN0KSB7XG4gICAgICAgIHJldHVybiBoYW5kbGVTdHJpY3RQYXJzZS5jYWxsKHRoaXMsIG1vbnRoTmFtZSwgZm9ybWF0LCBzdHJpY3QpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5fbW9udGhzUGFyc2UpIHtcbiAgICAgICAgdGhpcy5fbW9udGhzUGFyc2UgPSBbXTtcbiAgICAgICAgdGhpcy5fbG9uZ01vbnRoc1BhcnNlID0gW107XG4gICAgICAgIHRoaXMuX3Nob3J0TW9udGhzUGFyc2UgPSBbXTtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBhZGQgc29ydGluZ1xuICAgIC8vIFNvcnRpbmcgbWFrZXMgc3VyZSBpZiBvbmUgbW9udGggKG9yIGFiYnIpIGlzIGEgcHJlZml4IG9mIGFub3RoZXJcbiAgICAvLyBzZWUgc29ydGluZyBpbiBjb21wdXRlTW9udGhzUGFyc2VcbiAgICBmb3IgKGkgPSAwOyBpIDwgMTI7IGkrKykge1xuICAgICAgICAvLyBtYWtlIHRoZSByZWdleCBpZiB3ZSBkb24ndCBoYXZlIGl0IGFscmVhZHlcbiAgICAgICAgbW9tID0gY3JlYXRlVVRDKFsyMDAwLCBpXSk7XG4gICAgICAgIGlmIChzdHJpY3QgJiYgIXRoaXMuX2xvbmdNb250aHNQYXJzZVtpXSkge1xuICAgICAgICAgICAgdGhpcy5fbG9uZ01vbnRoc1BhcnNlW2ldID0gbmV3IFJlZ0V4cCgnXicgKyB0aGlzLm1vbnRocyhtb20sICcnKS5yZXBsYWNlKCcuJywgJycpICsgJyQnLCAnaScpO1xuICAgICAgICAgICAgdGhpcy5fc2hvcnRNb250aHNQYXJzZVtpXSA9IG5ldyBSZWdFeHAoJ14nICsgdGhpcy5tb250aHNTaG9ydChtb20sICcnKS5yZXBsYWNlKCcuJywgJycpICsgJyQnLCAnaScpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghc3RyaWN0ICYmICF0aGlzLl9tb250aHNQYXJzZVtpXSkge1xuICAgICAgICAgICAgcmVnZXggPSAnXicgKyB0aGlzLm1vbnRocyhtb20sICcnKSArICd8XicgKyB0aGlzLm1vbnRoc1Nob3J0KG1vbSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fbW9udGhzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKHJlZ2V4LnJlcGxhY2UoJy4nLCAnJyksICdpJyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdGVzdCB0aGUgcmVnZXhcbiAgICAgICAgaWYgKHN0cmljdCAmJiBmb3JtYXQgPT09ICdNTU1NJyAmJiB0aGlzLl9sb25nTW9udGhzUGFyc2VbaV0udGVzdChtb250aE5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnTU1NJyAmJiB0aGlzLl9zaG9ydE1vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXN0cmljdCAmJiB0aGlzLl9tb250aHNQYXJzZVtpXS50ZXN0KG1vbnRoTmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIHNldE1vbnRoIChtb20sIHZhbHVlKSB7XG4gICAgdmFyIGRheU9mTW9udGg7XG5cbiAgICBpZiAoIW1vbS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgLy8gTm8gb3BcbiAgICAgICAgcmV0dXJuIG1vbTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAoL15cXGQrJC8udGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdG9JbnQodmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsdWUgPSBtb20ubG9jYWxlRGF0YSgpLm1vbnRoc1BhcnNlKHZhbHVlKTtcbiAgICAgICAgICAgIC8vIFRPRE86IEFub3RoZXIgc2lsZW50IGZhaWx1cmU/XG4gICAgICAgICAgICBpZiAoIWlzTnVtYmVyKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtb207XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkYXlPZk1vbnRoID0gTWF0aC5taW4obW9tLmRhdGUoKSwgZGF5c0luTW9udGgobW9tLnllYXIoKSwgdmFsdWUpKTtcbiAgICBtb20uX2RbJ3NldCcgKyAobW9tLl9pc1VUQyA/ICdVVEMnIDogJycpICsgJ01vbnRoJ10odmFsdWUsIGRheU9mTW9udGgpO1xuICAgIHJldHVybiBtb207XG59XG5cbmZ1bmN0aW9uIGdldFNldE1vbnRoICh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgIHNldE1vbnRoKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgaG9va3MudXBkYXRlT2Zmc2V0KHRoaXMsIHRydWUpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZ2V0KHRoaXMsICdNb250aCcpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0RGF5c0luTW9udGggKCkge1xuICAgIHJldHVybiBkYXlzSW5Nb250aCh0aGlzLnllYXIoKSwgdGhpcy5tb250aCgpKTtcbn1cblxudmFyIGRlZmF1bHRNb250aHNTaG9ydFJlZ2V4ID0gbWF0Y2hXb3JkO1xuZnVuY3Rpb24gbW9udGhzU2hvcnRSZWdleCAoaXNTdHJpY3QpIHtcbiAgICBpZiAodGhpcy5fbW9udGhzUGFyc2VFeGFjdCkge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ19tb250aHNSZWdleCcpKSB7XG4gICAgICAgICAgICBjb21wdXRlTW9udGhzUGFyc2UuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tb250aHNTaG9ydFN0cmljdFJlZ2V4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1Nob3J0UmVnZXg7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ19tb250aHNTaG9ydFJlZ2V4JykpIHtcbiAgICAgICAgICAgIHRoaXMuX21vbnRoc1Nob3J0UmVnZXggPSBkZWZhdWx0TW9udGhzU2hvcnRSZWdleDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU2hvcnRTdHJpY3RSZWdleCAmJiBpc1N0cmljdCA/XG4gICAgICAgICAgICB0aGlzLl9tb250aHNTaG9ydFN0cmljdFJlZ2V4IDogdGhpcy5fbW9udGhzU2hvcnRSZWdleDtcbiAgICB9XG59XG5cbnZhciBkZWZhdWx0TW9udGhzUmVnZXggPSBtYXRjaFdvcmQ7XG5mdW5jdGlvbiBtb250aHNSZWdleCAoaXNTdHJpY3QpIHtcbiAgICBpZiAodGhpcy5fbW9udGhzUGFyc2VFeGFjdCkge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ19tb250aHNSZWdleCcpKSB7XG4gICAgICAgICAgICBjb21wdXRlTW9udGhzUGFyc2UuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tb250aHNTdHJpY3RSZWdleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tb250aHNSZWdleDtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghaGFzT3duUHJvcCh0aGlzLCAnX21vbnRoc1JlZ2V4JykpIHtcbiAgICAgICAgICAgIHRoaXMuX21vbnRoc1JlZ2V4ID0gZGVmYXVsdE1vbnRoc1JlZ2V4O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9tb250aHNTdHJpY3RSZWdleCAmJiBpc1N0cmljdCA/XG4gICAgICAgICAgICB0aGlzLl9tb250aHNTdHJpY3RSZWdleCA6IHRoaXMuX21vbnRoc1JlZ2V4O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY29tcHV0ZU1vbnRoc1BhcnNlICgpIHtcbiAgICBmdW5jdGlvbiBjbXBMZW5SZXYoYSwgYikge1xuICAgICAgICByZXR1cm4gYi5sZW5ndGggLSBhLmxlbmd0aDtcbiAgICB9XG5cbiAgICB2YXIgc2hvcnRQaWVjZXMgPSBbXSwgbG9uZ1BpZWNlcyA9IFtdLCBtaXhlZFBpZWNlcyA9IFtdLFxuICAgICAgICBpLCBtb207XG4gICAgZm9yIChpID0gMDsgaSA8IDEyOyBpKyspIHtcbiAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XG4gICAgICAgIG1vbSA9IGNyZWF0ZVVUQyhbMjAwMCwgaV0pO1xuICAgICAgICBzaG9ydFBpZWNlcy5wdXNoKHRoaXMubW9udGhzU2hvcnQobW9tLCAnJykpO1xuICAgICAgICBsb25nUGllY2VzLnB1c2godGhpcy5tb250aHMobW9tLCAnJykpO1xuICAgICAgICBtaXhlZFBpZWNlcy5wdXNoKHRoaXMubW9udGhzKG1vbSwgJycpKTtcbiAgICAgICAgbWl4ZWRQaWVjZXMucHVzaCh0aGlzLm1vbnRoc1Nob3J0KG1vbSwgJycpKTtcbiAgICB9XG4gICAgLy8gU29ydGluZyBtYWtlcyBzdXJlIGlmIG9uZSBtb250aCAob3IgYWJicikgaXMgYSBwcmVmaXggb2YgYW5vdGhlciBpdFxuICAgIC8vIHdpbGwgbWF0Y2ggdGhlIGxvbmdlciBwaWVjZS5cbiAgICBzaG9ydFBpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgbG9uZ1BpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgbWl4ZWRQaWVjZXMuc29ydChjbXBMZW5SZXYpO1xuICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgaSsrKSB7XG4gICAgICAgIHNob3J0UGllY2VzW2ldID0gcmVnZXhFc2NhcGUoc2hvcnRQaWVjZXNbaV0pO1xuICAgICAgICBsb25nUGllY2VzW2ldID0gcmVnZXhFc2NhcGUobG9uZ1BpZWNlc1tpXSk7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCAyNDsgaSsrKSB7XG4gICAgICAgIG1peGVkUGllY2VzW2ldID0gcmVnZXhFc2NhcGUobWl4ZWRQaWVjZXNbaV0pO1xuICAgIH1cblxuICAgIHRoaXMuX21vbnRoc1JlZ2V4ID0gbmV3IFJlZ0V4cCgnXignICsgbWl4ZWRQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xuICAgIHRoaXMuX21vbnRoc1Nob3J0UmVnZXggPSB0aGlzLl9tb250aHNSZWdleDtcbiAgICB0aGlzLl9tb250aHNTdHJpY3RSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIGxvbmdQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xuICAgIHRoaXMuX21vbnRoc1Nob3J0U3RyaWN0UmVnZXggPSBuZXcgUmVnRXhwKCdeKCcgKyBzaG9ydFBpZWNlcy5qb2luKCd8JykgKyAnKScsICdpJyk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZURhdGUgKHksIG0sIGQsIGgsIE0sIHMsIG1zKSB7XG4gICAgLy8gY2FuJ3QganVzdCBhcHBseSgpIHRvIGNyZWF0ZSBhIGRhdGU6XG4gICAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xLzE4MTM0OFxuICAgIHZhciBkYXRlID0gbmV3IERhdGUoeSwgbSwgZCwgaCwgTSwgcywgbXMpO1xuXG4gICAgLy8gdGhlIGRhdGUgY29uc3RydWN0b3IgcmVtYXBzIHllYXJzIDAtOTkgdG8gMTkwMC0xOTk5XG4gICAgaWYgKHkgPCAxMDAgJiYgeSA+PSAwICYmIGlzRmluaXRlKGRhdGUuZ2V0RnVsbFllYXIoKSkpIHtcbiAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcih5KTtcbiAgICB9XG4gICAgcmV0dXJuIGRhdGU7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVVUQ0RhdGUgKHkpIHtcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKERhdGUuVVRDLmFwcGx5KG51bGwsIGFyZ3VtZW50cykpO1xuXG4gICAgLy8gdGhlIERhdGUuVVRDIGZ1bmN0aW9uIHJlbWFwcyB5ZWFycyAwLTk5IHRvIDE5MDAtMTk5OVxuICAgIGlmICh5IDwgMTAwICYmIHkgPj0gMCAmJiBpc0Zpbml0ZShkYXRlLmdldFVUQ0Z1bGxZZWFyKCkpKSB7XG4gICAgICAgIGRhdGUuc2V0VVRDRnVsbFllYXIoeSk7XG4gICAgfVxuICAgIHJldHVybiBkYXRlO1xufVxuXG4vLyBzdGFydC1vZi1maXJzdC13ZWVrIC0gc3RhcnQtb2YteWVhclxuZnVuY3Rpb24gZmlyc3RXZWVrT2Zmc2V0KHllYXIsIGRvdywgZG95KSB7XG4gICAgdmFyIC8vIGZpcnN0LXdlZWsgZGF5IC0tIHdoaWNoIGphbnVhcnkgaXMgYWx3YXlzIGluIHRoZSBmaXJzdCB3ZWVrICg0IGZvciBpc28sIDEgZm9yIG90aGVyKVxuICAgICAgICBmd2QgPSA3ICsgZG93IC0gZG95LFxuICAgICAgICAvLyBmaXJzdC13ZWVrIGRheSBsb2NhbCB3ZWVrZGF5IC0tIHdoaWNoIGxvY2FsIHdlZWtkYXkgaXMgZndkXG4gICAgICAgIGZ3ZGx3ID0gKDcgKyBjcmVhdGVVVENEYXRlKHllYXIsIDAsIGZ3ZCkuZ2V0VVRDRGF5KCkgLSBkb3cpICUgNztcblxuICAgIHJldHVybiAtZndkbHcgKyBmd2QgLSAxO1xufVxuXG4vLyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9JU09fd2Vla19kYXRlI0NhbGN1bGF0aW5nX2FfZGF0ZV9naXZlbl90aGVfeWVhci4yQ193ZWVrX251bWJlcl9hbmRfd2Vla2RheVxuZnVuY3Rpb24gZGF5T2ZZZWFyRnJvbVdlZWtzKHllYXIsIHdlZWssIHdlZWtkYXksIGRvdywgZG95KSB7XG4gICAgdmFyIGxvY2FsV2Vla2RheSA9ICg3ICsgd2Vla2RheSAtIGRvdykgJSA3LFxuICAgICAgICB3ZWVrT2Zmc2V0ID0gZmlyc3RXZWVrT2Zmc2V0KHllYXIsIGRvdywgZG95KSxcbiAgICAgICAgZGF5T2ZZZWFyID0gMSArIDcgKiAod2VlayAtIDEpICsgbG9jYWxXZWVrZGF5ICsgd2Vla09mZnNldCxcbiAgICAgICAgcmVzWWVhciwgcmVzRGF5T2ZZZWFyO1xuXG4gICAgaWYgKGRheU9mWWVhciA8PSAwKSB7XG4gICAgICAgIHJlc1llYXIgPSB5ZWFyIC0gMTtcbiAgICAgICAgcmVzRGF5T2ZZZWFyID0gZGF5c0luWWVhcihyZXNZZWFyKSArIGRheU9mWWVhcjtcbiAgICB9IGVsc2UgaWYgKGRheU9mWWVhciA+IGRheXNJblllYXIoeWVhcikpIHtcbiAgICAgICAgcmVzWWVhciA9IHllYXIgKyAxO1xuICAgICAgICByZXNEYXlPZlllYXIgPSBkYXlPZlllYXIgLSBkYXlzSW5ZZWFyKHllYXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc1llYXIgPSB5ZWFyO1xuICAgICAgICByZXNEYXlPZlllYXIgPSBkYXlPZlllYXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgeWVhcjogcmVzWWVhcixcbiAgICAgICAgZGF5T2ZZZWFyOiByZXNEYXlPZlllYXJcbiAgICB9O1xufVxuXG5mdW5jdGlvbiB3ZWVrT2ZZZWFyKG1vbSwgZG93LCBkb3kpIHtcbiAgICB2YXIgd2Vla09mZnNldCA9IGZpcnN0V2Vla09mZnNldChtb20ueWVhcigpLCBkb3csIGRveSksXG4gICAgICAgIHdlZWsgPSBNYXRoLmZsb29yKChtb20uZGF5T2ZZZWFyKCkgLSB3ZWVrT2Zmc2V0IC0gMSkgLyA3KSArIDEsXG4gICAgICAgIHJlc1dlZWssIHJlc1llYXI7XG5cbiAgICBpZiAod2VlayA8IDEpIHtcbiAgICAgICAgcmVzWWVhciA9IG1vbS55ZWFyKCkgLSAxO1xuICAgICAgICByZXNXZWVrID0gd2VlayArIHdlZWtzSW5ZZWFyKHJlc1llYXIsIGRvdywgZG95KTtcbiAgICB9IGVsc2UgaWYgKHdlZWsgPiB3ZWVrc0luWWVhcihtb20ueWVhcigpLCBkb3csIGRveSkpIHtcbiAgICAgICAgcmVzV2VlayA9IHdlZWsgLSB3ZWVrc0luWWVhcihtb20ueWVhcigpLCBkb3csIGRveSk7XG4gICAgICAgIHJlc1llYXIgPSBtb20ueWVhcigpICsgMTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXNZZWFyID0gbW9tLnllYXIoKTtcbiAgICAgICAgcmVzV2VlayA9IHdlZWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgd2VlazogcmVzV2VlayxcbiAgICAgICAgeWVhcjogcmVzWWVhclxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHdlZWtzSW5ZZWFyKHllYXIsIGRvdywgZG95KSB7XG4gICAgdmFyIHdlZWtPZmZzZXQgPSBmaXJzdFdlZWtPZmZzZXQoeWVhciwgZG93LCBkb3kpLFxuICAgICAgICB3ZWVrT2Zmc2V0TmV4dCA9IGZpcnN0V2Vla09mZnNldCh5ZWFyICsgMSwgZG93LCBkb3kpO1xuICAgIHJldHVybiAoZGF5c0luWWVhcih5ZWFyKSAtIHdlZWtPZmZzZXQgKyB3ZWVrT2Zmc2V0TmV4dCkgLyA3O1xufVxuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCd3JywgWyd3dycsIDJdLCAnd28nLCAnd2VlaycpO1xuYWRkRm9ybWF0VG9rZW4oJ1cnLCBbJ1dXJywgMl0sICdXbycsICdpc29XZWVrJyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCd3ZWVrJywgJ3cnKTtcbmFkZFVuaXRBbGlhcygnaXNvV2VlaycsICdXJyk7XG5cbi8vIFBSSU9SSVRJRVNcblxuYWRkVW5pdFByaW9yaXR5KCd3ZWVrJywgNSk7XG5hZGRVbml0UHJpb3JpdHkoJ2lzb1dlZWsnLCA1KTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCd3JywgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCd3dycsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFJlZ2V4VG9rZW4oJ1cnLCAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ1dXJywgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuXG5hZGRXZWVrUGFyc2VUb2tlbihbJ3cnLCAnd3cnLCAnVycsICdXVyddLCBmdW5jdGlvbiAoaW5wdXQsIHdlZWssIGNvbmZpZywgdG9rZW4pIHtcbiAgICB3ZWVrW3Rva2VuLnN1YnN0cigwLCAxKV0gPSB0b0ludChpbnB1dCk7XG59KTtcblxuLy8gSEVMUEVSU1xuXG4vLyBMT0NBTEVTXG5cbmZ1bmN0aW9uIGxvY2FsZVdlZWsgKG1vbSkge1xuICAgIHJldHVybiB3ZWVrT2ZZZWFyKG1vbSwgdGhpcy5fd2Vlay5kb3csIHRoaXMuX3dlZWsuZG95KS53ZWVrO1xufVxuXG52YXIgZGVmYXVsdExvY2FsZVdlZWsgPSB7XG4gICAgZG93IDogMCwgLy8gU3VuZGF5IGlzIHRoZSBmaXJzdCBkYXkgb2YgdGhlIHdlZWsuXG4gICAgZG95IDogNiAgLy8gVGhlIHdlZWsgdGhhdCBjb250YWlucyBKYW4gMXN0IGlzIHRoZSBmaXJzdCB3ZWVrIG9mIHRoZSB5ZWFyLlxufTtcblxuZnVuY3Rpb24gbG9jYWxlRmlyc3REYXlPZldlZWsgKCkge1xuICAgIHJldHVybiB0aGlzLl93ZWVrLmRvdztcbn1cblxuZnVuY3Rpb24gbG9jYWxlRmlyc3REYXlPZlllYXIgKCkge1xuICAgIHJldHVybiB0aGlzLl93ZWVrLmRveTtcbn1cblxuLy8gTU9NRU5UU1xuXG5mdW5jdGlvbiBnZXRTZXRXZWVrIChpbnB1dCkge1xuICAgIHZhciB3ZWVrID0gdGhpcy5sb2NhbGVEYXRhKCkud2Vlayh0aGlzKTtcbiAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHdlZWsgOiB0aGlzLmFkZCgoaW5wdXQgLSB3ZWVrKSAqIDcsICdkJyk7XG59XG5cbmZ1bmN0aW9uIGdldFNldElTT1dlZWsgKGlucHV0KSB7XG4gICAgdmFyIHdlZWsgPSB3ZWVrT2ZZZWFyKHRoaXMsIDEsIDQpLndlZWs7XG4gICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrIDogdGhpcy5hZGQoKGlucHV0IC0gd2VlaykgKiA3LCAnZCcpO1xufVxuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCdkJywgMCwgJ2RvJywgJ2RheScpO1xuXG5hZGRGb3JtYXRUb2tlbignZGQnLCAwLCAwLCBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLndlZWtkYXlzTWluKHRoaXMsIGZvcm1hdCk7XG59KTtcblxuYWRkRm9ybWF0VG9rZW4oJ2RkZCcsIDAsIDAsIGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkud2Vla2RheXNTaG9ydCh0aGlzLCBmb3JtYXQpO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdkZGRkJywgMCwgMCwgZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS53ZWVrZGF5cyh0aGlzLCBmb3JtYXQpO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdlJywgMCwgMCwgJ3dlZWtkYXknKTtcbmFkZEZvcm1hdFRva2VuKCdFJywgMCwgMCwgJ2lzb1dlZWtkYXknKTtcblxuLy8gQUxJQVNFU1xuXG5hZGRVbml0QWxpYXMoJ2RheScsICdkJyk7XG5hZGRVbml0QWxpYXMoJ3dlZWtkYXknLCAnZScpO1xuYWRkVW5pdEFsaWFzKCdpc29XZWVrZGF5JywgJ0UnKTtcblxuLy8gUFJJT1JJVFlcbmFkZFVuaXRQcmlvcml0eSgnZGF5JywgMTEpO1xuYWRkVW5pdFByaW9yaXR5KCd3ZWVrZGF5JywgMTEpO1xuYWRkVW5pdFByaW9yaXR5KCdpc29XZWVrZGF5JywgMTEpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ2QnLCAgICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignZScsICAgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCdFJywgICAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ2RkJywgICBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgIHJldHVybiBsb2NhbGUud2Vla2RheXNNaW5SZWdleChpc1N0cmljdCk7XG59KTtcbmFkZFJlZ2V4VG9rZW4oJ2RkZCcsICAgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICByZXR1cm4gbG9jYWxlLndlZWtkYXlzU2hvcnRSZWdleChpc1N0cmljdCk7XG59KTtcbmFkZFJlZ2V4VG9rZW4oJ2RkZGQnLCAgIGZ1bmN0aW9uIChpc1N0cmljdCwgbG9jYWxlKSB7XG4gICAgcmV0dXJuIGxvY2FsZS53ZWVrZGF5c1JlZ2V4KGlzU3RyaWN0KTtcbn0pO1xuXG5hZGRXZWVrUGFyc2VUb2tlbihbJ2RkJywgJ2RkZCcsICdkZGRkJ10sIGZ1bmN0aW9uIChpbnB1dCwgd2VlaywgY29uZmlnLCB0b2tlbikge1xuICAgIHZhciB3ZWVrZGF5ID0gY29uZmlnLl9sb2NhbGUud2Vla2RheXNQYXJzZShpbnB1dCwgdG9rZW4sIGNvbmZpZy5fc3RyaWN0KTtcbiAgICAvLyBpZiB3ZSBkaWRuJ3QgZ2V0IGEgd2Vla2RheSBuYW1lLCBtYXJrIHRoZSBkYXRlIGFzIGludmFsaWRcbiAgICBpZiAod2Vla2RheSAhPSBudWxsKSB7XG4gICAgICAgIHdlZWsuZCA9IHdlZWtkYXk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuaW52YWxpZFdlZWtkYXkgPSBpbnB1dDtcbiAgICB9XG59KTtcblxuYWRkV2Vla1BhcnNlVG9rZW4oWydkJywgJ2UnLCAnRSddLCBmdW5jdGlvbiAoaW5wdXQsIHdlZWssIGNvbmZpZywgdG9rZW4pIHtcbiAgICB3ZWVrW3Rva2VuXSA9IHRvSW50KGlucHV0KTtcbn0pO1xuXG4vLyBIRUxQRVJTXG5cbmZ1bmN0aW9uIHBhcnNlV2Vla2RheShpbnB1dCwgbG9jYWxlKSB7XG4gICAgaWYgKHR5cGVvZiBpbnB1dCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgIH1cblxuICAgIGlmICghaXNOYU4oaW5wdXQpKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludChpbnB1dCwgMTApO1xuICAgIH1cblxuICAgIGlucHV0ID0gbG9jYWxlLndlZWtkYXlzUGFyc2UoaW5wdXQpO1xuICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gcGFyc2VJc29XZWVrZGF5KGlucHV0LCBsb2NhbGUpIHtcbiAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gbG9jYWxlLndlZWtkYXlzUGFyc2UoaW5wdXQpICUgNyB8fCA3O1xuICAgIH1cbiAgICByZXR1cm4gaXNOYU4oaW5wdXQpID8gbnVsbCA6IGlucHV0O1xufVxuXG4vLyBMT0NBTEVTXG5cbnZhciBkZWZhdWx0TG9jYWxlV2Vla2RheXMgPSAnU3VuZGF5X01vbmRheV9UdWVzZGF5X1dlZG5lc2RheV9UaHVyc2RheV9GcmlkYXlfU2F0dXJkYXknLnNwbGl0KCdfJyk7XG5mdW5jdGlvbiBsb2NhbGVXZWVrZGF5cyAobSwgZm9ybWF0KSB7XG4gICAgaWYgKCFtKSB7XG4gICAgICAgIHJldHVybiBpc0FycmF5KHRoaXMuX3dlZWtkYXlzKSA/IHRoaXMuX3dlZWtkYXlzIDpcbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzWydzdGFuZGFsb25lJ107XG4gICAgfVxuICAgIHJldHVybiBpc0FycmF5KHRoaXMuX3dlZWtkYXlzKSA/IHRoaXMuX3dlZWtkYXlzW20uZGF5KCldIDpcbiAgICAgICAgdGhpcy5fd2Vla2RheXNbdGhpcy5fd2Vla2RheXMuaXNGb3JtYXQudGVzdChmb3JtYXQpID8gJ2Zvcm1hdCcgOiAnc3RhbmRhbG9uZSddW20uZGF5KCldO1xufVxuXG52YXIgZGVmYXVsdExvY2FsZVdlZWtkYXlzU2hvcnQgPSAnU3VuX01vbl9UdWVfV2VkX1RodV9GcmlfU2F0Jy5zcGxpdCgnXycpO1xuZnVuY3Rpb24gbG9jYWxlV2Vla2RheXNTaG9ydCAobSkge1xuICAgIHJldHVybiAobSkgPyB0aGlzLl93ZWVrZGF5c1Nob3J0W20uZGF5KCldIDogdGhpcy5fd2Vla2RheXNTaG9ydDtcbn1cblxudmFyIGRlZmF1bHRMb2NhbGVXZWVrZGF5c01pbiA9ICdTdV9Nb19UdV9XZV9UaF9Gcl9TYScuc3BsaXQoJ18nKTtcbmZ1bmN0aW9uIGxvY2FsZVdlZWtkYXlzTWluIChtKSB7XG4gICAgcmV0dXJuIChtKSA/IHRoaXMuX3dlZWtkYXlzTWluW20uZGF5KCldIDogdGhpcy5fd2Vla2RheXNNaW47XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVN0cmljdFBhcnNlJDEod2Vla2RheU5hbWUsIGZvcm1hdCwgc3RyaWN0KSB7XG4gICAgdmFyIGksIGlpLCBtb20sIGxsYyA9IHdlZWtkYXlOYW1lLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgaWYgKCF0aGlzLl93ZWVrZGF5c1BhcnNlKSB7XG4gICAgICAgIHRoaXMuX3dlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgdGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlID0gW107XG4gICAgICAgIHRoaXMuX21pbldlZWtkYXlzUGFyc2UgPSBbXTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNzsgKytpKSB7XG4gICAgICAgICAgICBtb20gPSBjcmVhdGVVVEMoWzIwMDAsIDFdKS5kYXkoaSk7XG4gICAgICAgICAgICB0aGlzLl9taW5XZWVrZGF5c1BhcnNlW2ldID0gdGhpcy53ZWVrZGF5c01pbihtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlW2ldID0gdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1BhcnNlW2ldID0gdGhpcy53ZWVrZGF5cyhtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN0cmljdCkge1xuICAgICAgICBpZiAoZm9ybWF0ID09PSAnZGRkZCcpIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZi5jYWxsKHRoaXMuX3dlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gJ2RkZCcpIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZi5jYWxsKHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9taW5XZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdkZGRkJykge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fd2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fbWluV2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0ID09PSAnZGRkJykge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZi5jYWxsKHRoaXMuX3dlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fbWluV2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9taW5XZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZi5jYWxsKHRoaXMuX3dlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9jYWxlV2Vla2RheXNQYXJzZSAod2Vla2RheU5hbWUsIGZvcm1hdCwgc3RyaWN0KSB7XG4gICAgdmFyIGksIG1vbSwgcmVnZXg7XG5cbiAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZUV4YWN0KSB7XG4gICAgICAgIHJldHVybiBoYW5kbGVTdHJpY3RQYXJzZSQxLmNhbGwodGhpcywgd2Vla2RheU5hbWUsIGZvcm1hdCwgc3RyaWN0KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX3dlZWtkYXlzUGFyc2UpIHtcbiAgICAgICAgdGhpcy5fd2Vla2RheXNQYXJzZSA9IFtdO1xuICAgICAgICB0aGlzLl9taW5XZWVrZGF5c1BhcnNlID0gW107XG4gICAgICAgIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZSA9IFtdO1xuICAgICAgICB0aGlzLl9mdWxsV2Vla2RheXNQYXJzZSA9IFtdO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XG5cbiAgICAgICAgbW9tID0gY3JlYXRlVVRDKFsyMDAwLCAxXSkuZGF5KGkpO1xuICAgICAgICBpZiAoc3RyaWN0ICYmICF0aGlzLl9mdWxsV2Vla2RheXNQYXJzZVtpXSkge1xuICAgICAgICAgICAgdGhpcy5fZnVsbFdlZWtkYXlzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMud2Vla2RheXMobW9tLCAnJykucmVwbGFjZSgnLicsICdcXC4/JykgKyAnJCcsICdpJyk7XG4gICAgICAgICAgICB0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMud2Vla2RheXNTaG9ydChtb20sICcnKS5yZXBsYWNlKCcuJywgJ1xcLj8nKSArICckJywgJ2knKTtcbiAgICAgICAgICAgIHRoaXMuX21pbldlZWtkYXlzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMud2Vla2RheXNNaW4obW9tLCAnJykucmVwbGFjZSgnLicsICdcXC4/JykgKyAnJCcsICdpJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl93ZWVrZGF5c1BhcnNlW2ldKSB7XG4gICAgICAgICAgICByZWdleCA9ICdeJyArIHRoaXMud2Vla2RheXMobW9tLCAnJykgKyAnfF4nICsgdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpICsgJ3xeJyArIHRoaXMud2Vla2RheXNNaW4obW9tLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1BhcnNlW2ldID0gbmV3IFJlZ0V4cChyZWdleC5yZXBsYWNlKCcuJywgJycpLCAnaScpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHRlc3QgdGhlIHJlZ2V4XG4gICAgICAgIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnZGRkZCcgJiYgdGhpcy5fZnVsbFdlZWtkYXlzUGFyc2VbaV0udGVzdCh3ZWVrZGF5TmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9IGVsc2UgaWYgKHN0cmljdCAmJiBmb3JtYXQgPT09ICdkZGQnICYmIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZVtpXS50ZXN0KHdlZWtkYXlOYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RyaWN0ICYmIGZvcm1hdCA9PT0gJ2RkJyAmJiB0aGlzLl9taW5XZWVrZGF5c1BhcnNlW2ldLnRlc3Qod2Vla2RheU5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfSBlbHNlIGlmICghc3RyaWN0ICYmIHRoaXMuX3dlZWtkYXlzUGFyc2VbaV0udGVzdCh3ZWVrZGF5TmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIGdldFNldERheU9mV2VlayAoaW5wdXQpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiBpbnB1dCAhPSBudWxsID8gdGhpcyA6IE5hTjtcbiAgICB9XG4gICAgdmFyIGRheSA9IHRoaXMuX2lzVVRDID8gdGhpcy5fZC5nZXRVVENEYXkoKSA6IHRoaXMuX2QuZ2V0RGF5KCk7XG4gICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgaW5wdXQgPSBwYXJzZVdlZWtkYXkoaW5wdXQsIHRoaXMubG9jYWxlRGF0YSgpKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKGlucHV0IC0gZGF5LCAnZCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBkYXk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRTZXRMb2NhbGVEYXlPZldlZWsgKGlucHV0KSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gaW5wdXQgIT0gbnVsbCA/IHRoaXMgOiBOYU47XG4gICAgfVxuICAgIHZhciB3ZWVrZGF5ID0gKHRoaXMuZGF5KCkgKyA3IC0gdGhpcy5sb2NhbGVEYXRhKCkuX3dlZWsuZG93KSAlIDc7XG4gICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrZGF5IDogdGhpcy5hZGQoaW5wdXQgLSB3ZWVrZGF5LCAnZCcpO1xufVxuXG5mdW5jdGlvbiBnZXRTZXRJU09EYXlPZldlZWsgKGlucHV0KSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gaW5wdXQgIT0gbnVsbCA/IHRoaXMgOiBOYU47XG4gICAgfVxuXG4gICAgLy8gYmVoYXZlcyB0aGUgc2FtZSBhcyBtb21lbnQjZGF5IGV4Y2VwdFxuICAgIC8vIGFzIGEgZ2V0dGVyLCByZXR1cm5zIDcgaW5zdGVhZCBvZiAwICgxLTcgcmFuZ2UgaW5zdGVhZCBvZiAwLTYpXG4gICAgLy8gYXMgYSBzZXR0ZXIsIHN1bmRheSBzaG91bGQgYmVsb25nIHRvIHRoZSBwcmV2aW91cyB3ZWVrLlxuXG4gICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgdmFyIHdlZWtkYXkgPSBwYXJzZUlzb1dlZWtkYXkoaW5wdXQsIHRoaXMubG9jYWxlRGF0YSgpKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF5KHRoaXMuZGF5KCkgJSA3ID8gd2Vla2RheSA6IHdlZWtkYXkgLSA3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXkoKSB8fCA3O1xuICAgIH1cbn1cblxudmFyIGRlZmF1bHRXZWVrZGF5c1JlZ2V4ID0gbWF0Y2hXb3JkO1xuZnVuY3Rpb24gd2Vla2RheXNSZWdleCAoaXNTdHJpY3QpIHtcbiAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZUV4YWN0KSB7XG4gICAgICAgIGlmICghaGFzT3duUHJvcCh0aGlzLCAnX3dlZWtkYXlzUmVnZXgnKSkge1xuICAgICAgICAgICAgY29tcHV0ZVdlZWtkYXlzUGFyc2UuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1N0cmljdFJlZ2V4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzUmVnZXg7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1JlZ2V4JykpIHtcbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzUmVnZXggPSBkZWZhdWx0V2Vla2RheXNSZWdleDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNTdHJpY3RSZWdleCAmJiBpc1N0cmljdCA/XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1N0cmljdFJlZ2V4IDogdGhpcy5fd2Vla2RheXNSZWdleDtcbiAgICB9XG59XG5cbnZhciBkZWZhdWx0V2Vla2RheXNTaG9ydFJlZ2V4ID0gbWF0Y2hXb3JkO1xuZnVuY3Rpb24gd2Vla2RheXNTaG9ydFJlZ2V4IChpc1N0cmljdCkge1xuICAgIGlmICh0aGlzLl93ZWVrZGF5c1BhcnNlRXhhY3QpIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNSZWdleCcpKSB7XG4gICAgICAgICAgICBjb21wdXRlV2Vla2RheXNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1N0cmljdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU2hvcnRTdHJpY3RSZWdleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1Nob3J0UmVnZXg7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1Nob3J0UmVnZXgnKSkge1xuICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNTaG9ydFJlZ2V4ID0gZGVmYXVsdFdlZWtkYXlzU2hvcnRSZWdleDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNTaG9ydFN0cmljdFJlZ2V4ICYmIGlzU3RyaWN0ID9cbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzU2hvcnRTdHJpY3RSZWdleCA6IHRoaXMuX3dlZWtkYXlzU2hvcnRSZWdleDtcbiAgICB9XG59XG5cbnZhciBkZWZhdWx0V2Vla2RheXNNaW5SZWdleCA9IG1hdGNoV29yZDtcbmZ1bmN0aW9uIHdlZWtkYXlzTWluUmVnZXggKGlzU3RyaWN0KSB7XG4gICAgaWYgKHRoaXMuX3dlZWtkYXlzUGFyc2VFeGFjdCkge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1JlZ2V4JykpIHtcbiAgICAgICAgICAgIGNvbXB1dGVXZWVrZGF5c1BhcnNlLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNNaW5TdHJpY3RSZWdleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c01pblJlZ2V4O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNNaW5SZWdleCcpKSB7XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c01pblJlZ2V4ID0gZGVmYXVsdFdlZWtkYXlzTWluUmVnZXg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzTWluU3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNNaW5TdHJpY3RSZWdleCA6IHRoaXMuX3dlZWtkYXlzTWluUmVnZXg7XG4gICAgfVxufVxuXG5cbmZ1bmN0aW9uIGNvbXB1dGVXZWVrZGF5c1BhcnNlICgpIHtcbiAgICBmdW5jdGlvbiBjbXBMZW5SZXYoYSwgYikge1xuICAgICAgICByZXR1cm4gYi5sZW5ndGggLSBhLmxlbmd0aDtcbiAgICB9XG5cbiAgICB2YXIgbWluUGllY2VzID0gW10sIHNob3J0UGllY2VzID0gW10sIGxvbmdQaWVjZXMgPSBbXSwgbWl4ZWRQaWVjZXMgPSBbXSxcbiAgICAgICAgaSwgbW9tLCBtaW5wLCBzaG9ydHAsIGxvbmdwO1xuICAgIGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XG4gICAgICAgIG1vbSA9IGNyZWF0ZVVUQyhbMjAwMCwgMV0pLmRheShpKTtcbiAgICAgICAgbWlucCA9IHRoaXMud2Vla2RheXNNaW4obW9tLCAnJyk7XG4gICAgICAgIHNob3J0cCA9IHRoaXMud2Vla2RheXNTaG9ydChtb20sICcnKTtcbiAgICAgICAgbG9uZ3AgPSB0aGlzLndlZWtkYXlzKG1vbSwgJycpO1xuICAgICAgICBtaW5QaWVjZXMucHVzaChtaW5wKTtcbiAgICAgICAgc2hvcnRQaWVjZXMucHVzaChzaG9ydHApO1xuICAgICAgICBsb25nUGllY2VzLnB1c2gobG9uZ3ApO1xuICAgICAgICBtaXhlZFBpZWNlcy5wdXNoKG1pbnApO1xuICAgICAgICBtaXhlZFBpZWNlcy5wdXNoKHNob3J0cCk7XG4gICAgICAgIG1peGVkUGllY2VzLnB1c2gobG9uZ3ApO1xuICAgIH1cbiAgICAvLyBTb3J0aW5nIG1ha2VzIHN1cmUgaWYgb25lIHdlZWtkYXkgKG9yIGFiYnIpIGlzIGEgcHJlZml4IG9mIGFub3RoZXIgaXRcbiAgICAvLyB3aWxsIG1hdGNoIHRoZSBsb25nZXIgcGllY2UuXG4gICAgbWluUGllY2VzLnNvcnQoY21wTGVuUmV2KTtcbiAgICBzaG9ydFBpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgbG9uZ1BpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgbWl4ZWRQaWVjZXMuc29ydChjbXBMZW5SZXYpO1xuICAgIGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgc2hvcnRQaWVjZXNbaV0gPSByZWdleEVzY2FwZShzaG9ydFBpZWNlc1tpXSk7XG4gICAgICAgIGxvbmdQaWVjZXNbaV0gPSByZWdleEVzY2FwZShsb25nUGllY2VzW2ldKTtcbiAgICAgICAgbWl4ZWRQaWVjZXNbaV0gPSByZWdleEVzY2FwZShtaXhlZFBpZWNlc1tpXSk7XG4gICAgfVxuXG4gICAgdGhpcy5fd2Vla2RheXNSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIG1peGVkUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICB0aGlzLl93ZWVrZGF5c1Nob3J0UmVnZXggPSB0aGlzLl93ZWVrZGF5c1JlZ2V4O1xuICAgIHRoaXMuX3dlZWtkYXlzTWluUmVnZXggPSB0aGlzLl93ZWVrZGF5c1JlZ2V4O1xuXG4gICAgdGhpcy5fd2Vla2RheXNTdHJpY3RSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIGxvbmdQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xuICAgIHRoaXMuX3dlZWtkYXlzU2hvcnRTdHJpY3RSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIHNob3J0UGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICB0aGlzLl93ZWVrZGF5c01pblN0cmljdFJlZ2V4ID0gbmV3IFJlZ0V4cCgnXignICsgbWluUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbn1cblxuLy8gRk9STUFUVElOR1xuXG5mdW5jdGlvbiBoRm9ybWF0KCkge1xuICAgIHJldHVybiB0aGlzLmhvdXJzKCkgJSAxMiB8fCAxMjtcbn1cblxuZnVuY3Rpb24ga0Zvcm1hdCgpIHtcbiAgICByZXR1cm4gdGhpcy5ob3VycygpIHx8IDI0O1xufVxuXG5hZGRGb3JtYXRUb2tlbignSCcsIFsnSEgnLCAyXSwgMCwgJ2hvdXInKTtcbmFkZEZvcm1hdFRva2VuKCdoJywgWydoaCcsIDJdLCAwLCBoRm9ybWF0KTtcbmFkZEZvcm1hdFRva2VuKCdrJywgWydraycsIDJdLCAwLCBrRm9ybWF0KTtcblxuYWRkRm9ybWF0VG9rZW4oJ2htbScsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJycgKyBoRm9ybWF0LmFwcGx5KHRoaXMpICsgemVyb0ZpbGwodGhpcy5taW51dGVzKCksIDIpO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdobW1zcycsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJycgKyBoRm9ybWF0LmFwcGx5KHRoaXMpICsgemVyb0ZpbGwodGhpcy5taW51dGVzKCksIDIpICtcbiAgICAgICAgemVyb0ZpbGwodGhpcy5zZWNvbmRzKCksIDIpO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdIbW0nLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICcnICsgdGhpcy5ob3VycygpICsgemVyb0ZpbGwodGhpcy5taW51dGVzKCksIDIpO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdIbW1zcycsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJycgKyB0aGlzLmhvdXJzKCkgKyB6ZXJvRmlsbCh0aGlzLm1pbnV0ZXMoKSwgMikgK1xuICAgICAgICB6ZXJvRmlsbCh0aGlzLnNlY29uZHMoKSwgMik7XG59KTtcblxuZnVuY3Rpb24gbWVyaWRpZW0gKHRva2VuLCBsb3dlcmNhc2UpIHtcbiAgICBhZGRGb3JtYXRUb2tlbih0b2tlbiwgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkubWVyaWRpZW0odGhpcy5ob3VycygpLCB0aGlzLm1pbnV0ZXMoKSwgbG93ZXJjYXNlKTtcbiAgICB9KTtcbn1cblxubWVyaWRpZW0oJ2EnLCB0cnVlKTtcbm1lcmlkaWVtKCdBJywgZmFsc2UpO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygnaG91cicsICdoJyk7XG5cbi8vIFBSSU9SSVRZXG5hZGRVbml0UHJpb3JpdHkoJ2hvdXInLCAxMyk7XG5cbi8vIFBBUlNJTkdcblxuZnVuY3Rpb24gbWF0Y2hNZXJpZGllbSAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgIHJldHVybiBsb2NhbGUuX21lcmlkaWVtUGFyc2U7XG59XG5cbmFkZFJlZ2V4VG9rZW4oJ2EnLCAgbWF0Y2hNZXJpZGllbSk7XG5hZGRSZWdleFRva2VuKCdBJywgIG1hdGNoTWVyaWRpZW0pO1xuYWRkUmVnZXhUb2tlbignSCcsICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignaCcsICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignaycsICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignSEgnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG5hZGRSZWdleFRva2VuKCdoaCcsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFJlZ2V4VG9rZW4oJ2trJywgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuXG5hZGRSZWdleFRva2VuKCdobW0nLCBtYXRjaDN0bzQpO1xuYWRkUmVnZXhUb2tlbignaG1tc3MnLCBtYXRjaDV0bzYpO1xuYWRkUmVnZXhUb2tlbignSG1tJywgbWF0Y2gzdG80KTtcbmFkZFJlZ2V4VG9rZW4oJ0htbXNzJywgbWF0Y2g1dG82KTtcblxuYWRkUGFyc2VUb2tlbihbJ0gnLCAnSEgnXSwgSE9VUik7XG5hZGRQYXJzZVRva2VuKFsnaycsICdrayddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICB2YXIga0lucHV0ID0gdG9JbnQoaW5wdXQpO1xuICAgIGFycmF5W0hPVVJdID0ga0lucHV0ID09PSAyNCA/IDAgOiBrSW5wdXQ7XG59KTtcbmFkZFBhcnNlVG9rZW4oWydhJywgJ0EnXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgY29uZmlnLl9pc1BtID0gY29uZmlnLl9sb2NhbGUuaXNQTShpbnB1dCk7XG4gICAgY29uZmlnLl9tZXJpZGllbSA9IGlucHV0O1xufSk7XG5hZGRQYXJzZVRva2VuKFsnaCcsICdoaCddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICBhcnJheVtIT1VSXSA9IHRvSW50KGlucHV0KTtcbiAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5iaWdIb3VyID0gdHJ1ZTtcbn0pO1xuYWRkUGFyc2VUb2tlbignaG1tJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgdmFyIHBvcyA9IGlucHV0Lmxlbmd0aCAtIDI7XG4gICAgYXJyYXlbSE9VUl0gPSB0b0ludChpbnB1dC5zdWJzdHIoMCwgcG9zKSk7XG4gICAgYXJyYXlbTUlOVVRFXSA9IHRvSW50KGlucHV0LnN1YnN0cihwb3MpKTtcbiAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5iaWdIb3VyID0gdHJ1ZTtcbn0pO1xuYWRkUGFyc2VUb2tlbignaG1tc3MnLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICB2YXIgcG9zMSA9IGlucHV0Lmxlbmd0aCAtIDQ7XG4gICAgdmFyIHBvczIgPSBpbnB1dC5sZW5ndGggLSAyO1xuICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQuc3Vic3RyKDAsIHBvczEpKTtcbiAgICBhcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvczEsIDIpKTtcbiAgICBhcnJheVtTRUNPTkRdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvczIpKTtcbiAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5iaWdIb3VyID0gdHJ1ZTtcbn0pO1xuYWRkUGFyc2VUb2tlbignSG1tJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgdmFyIHBvcyA9IGlucHV0Lmxlbmd0aCAtIDI7XG4gICAgYXJyYXlbSE9VUl0gPSB0b0ludChpbnB1dC5zdWJzdHIoMCwgcG9zKSk7XG4gICAgYXJyYXlbTUlOVVRFXSA9IHRvSW50KGlucHV0LnN1YnN0cihwb3MpKTtcbn0pO1xuYWRkUGFyc2VUb2tlbignSG1tc3MnLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICB2YXIgcG9zMSA9IGlucHV0Lmxlbmd0aCAtIDQ7XG4gICAgdmFyIHBvczIgPSBpbnB1dC5sZW5ndGggLSAyO1xuICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQuc3Vic3RyKDAsIHBvczEpKTtcbiAgICBhcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvczEsIDIpKTtcbiAgICBhcnJheVtTRUNPTkRdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvczIpKTtcbn0pO1xuXG4vLyBMT0NBTEVTXG5cbmZ1bmN0aW9uIGxvY2FsZUlzUE0gKGlucHV0KSB7XG4gICAgLy8gSUU4IFF1aXJrcyBNb2RlICYgSUU3IFN0YW5kYXJkcyBNb2RlIGRvIG5vdCBhbGxvdyBhY2Nlc3Npbmcgc3RyaW5ncyBsaWtlIGFycmF5c1xuICAgIC8vIFVzaW5nIGNoYXJBdCBzaG91bGQgYmUgbW9yZSBjb21wYXRpYmxlLlxuICAgIHJldHVybiAoKGlucHV0ICsgJycpLnRvTG93ZXJDYXNlKCkuY2hhckF0KDApID09PSAncCcpO1xufVxuXG52YXIgZGVmYXVsdExvY2FsZU1lcmlkaWVtUGFyc2UgPSAvW2FwXVxcLj9tP1xcLj8vaTtcbmZ1bmN0aW9uIGxvY2FsZU1lcmlkaWVtIChob3VycywgbWludXRlcywgaXNMb3dlcikge1xuICAgIGlmIChob3VycyA+IDExKSB7XG4gICAgICAgIHJldHVybiBpc0xvd2VyID8gJ3BtJyA6ICdQTSc7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGlzTG93ZXIgPyAnYW0nIDogJ0FNJztcbiAgICB9XG59XG5cblxuLy8gTU9NRU5UU1xuXG4vLyBTZXR0aW5nIHRoZSBob3VyIHNob3VsZCBrZWVwIHRoZSB0aW1lLCBiZWNhdXNlIHRoZSB1c2VyIGV4cGxpY2l0bHlcbi8vIHNwZWNpZmllZCB3aGljaCBob3VyIGhlIHdhbnRzLiBTbyB0cnlpbmcgdG8gbWFpbnRhaW4gdGhlIHNhbWUgaG91ciAoaW5cbi8vIGEgbmV3IHRpbWV6b25lKSBtYWtlcyBzZW5zZS4gQWRkaW5nL3N1YnRyYWN0aW5nIGhvdXJzIGRvZXMgbm90IGZvbGxvd1xuLy8gdGhpcyBydWxlLlxudmFyIGdldFNldEhvdXIgPSBtYWtlR2V0U2V0KCdIb3VycycsIHRydWUpO1xuXG4vLyBtb250aHNcbi8vIHdlZWtcbi8vIHdlZWtkYXlzXG4vLyBtZXJpZGllbVxudmFyIGJhc2VDb25maWcgPSB7XG4gICAgY2FsZW5kYXI6IGRlZmF1bHRDYWxlbmRhcixcbiAgICBsb25nRGF0ZUZvcm1hdDogZGVmYXVsdExvbmdEYXRlRm9ybWF0LFxuICAgIGludmFsaWREYXRlOiBkZWZhdWx0SW52YWxpZERhdGUsXG4gICAgb3JkaW5hbDogZGVmYXVsdE9yZGluYWwsXG4gICAgZGF5T2ZNb250aE9yZGluYWxQYXJzZTogZGVmYXVsdERheU9mTW9udGhPcmRpbmFsUGFyc2UsXG4gICAgcmVsYXRpdmVUaW1lOiBkZWZhdWx0UmVsYXRpdmVUaW1lLFxuXG4gICAgbW9udGhzOiBkZWZhdWx0TG9jYWxlTW9udGhzLFxuICAgIG1vbnRoc1Nob3J0OiBkZWZhdWx0TG9jYWxlTW9udGhzU2hvcnQsXG5cbiAgICB3ZWVrOiBkZWZhdWx0TG9jYWxlV2VlayxcblxuICAgIHdlZWtkYXlzOiBkZWZhdWx0TG9jYWxlV2Vla2RheXMsXG4gICAgd2Vla2RheXNNaW46IGRlZmF1bHRMb2NhbGVXZWVrZGF5c01pbixcbiAgICB3ZWVrZGF5c1Nob3J0OiBkZWZhdWx0TG9jYWxlV2Vla2RheXNTaG9ydCxcblxuICAgIG1lcmlkaWVtUGFyc2U6IGRlZmF1bHRMb2NhbGVNZXJpZGllbVBhcnNlXG59O1xuXG4vLyBpbnRlcm5hbCBzdG9yYWdlIGZvciBsb2NhbGUgY29uZmlnIGZpbGVzXG52YXIgbG9jYWxlcyA9IHt9O1xudmFyIGxvY2FsZUZhbWlsaWVzID0ge307XG52YXIgZ2xvYmFsTG9jYWxlO1xuXG5mdW5jdGlvbiBub3JtYWxpemVMb2NhbGUoa2V5KSB7XG4gICAgcmV0dXJuIGtleSA/IGtleS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoJ18nLCAnLScpIDoga2V5O1xufVxuXG4vLyBwaWNrIHRoZSBsb2NhbGUgZnJvbSB0aGUgYXJyYXlcbi8vIHRyeSBbJ2VuLWF1JywgJ2VuLWdiJ10gYXMgJ2VuLWF1JywgJ2VuLWdiJywgJ2VuJywgYXMgaW4gbW92ZSB0aHJvdWdoIHRoZSBsaXN0IHRyeWluZyBlYWNoXG4vLyBzdWJzdHJpbmcgZnJvbSBtb3N0IHNwZWNpZmljIHRvIGxlYXN0LCBidXQgbW92ZSB0byB0aGUgbmV4dCBhcnJheSBpdGVtIGlmIGl0J3MgYSBtb3JlIHNwZWNpZmljIHZhcmlhbnQgdGhhbiB0aGUgY3VycmVudCByb290XG5mdW5jdGlvbiBjaG9vc2VMb2NhbGUobmFtZXMpIHtcbiAgICB2YXIgaSA9IDAsIGosIG5leHQsIGxvY2FsZSwgc3BsaXQ7XG5cbiAgICB3aGlsZSAoaSA8IG5hbWVzLmxlbmd0aCkge1xuICAgICAgICBzcGxpdCA9IG5vcm1hbGl6ZUxvY2FsZShuYW1lc1tpXSkuc3BsaXQoJy0nKTtcbiAgICAgICAgaiA9IHNwbGl0Lmxlbmd0aDtcbiAgICAgICAgbmV4dCA9IG5vcm1hbGl6ZUxvY2FsZShuYW1lc1tpICsgMV0pO1xuICAgICAgICBuZXh0ID0gbmV4dCA/IG5leHQuc3BsaXQoJy0nKSA6IG51bGw7XG4gICAgICAgIHdoaWxlIChqID4gMCkge1xuICAgICAgICAgICAgbG9jYWxlID0gbG9hZExvY2FsZShzcGxpdC5zbGljZSgwLCBqKS5qb2luKCctJykpO1xuICAgICAgICAgICAgaWYgKGxvY2FsZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsb2NhbGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmV4dCAmJiBuZXh0Lmxlbmd0aCA+PSBqICYmIGNvbXBhcmVBcnJheXMoc3BsaXQsIG5leHQsIHRydWUpID49IGogLSAxKSB7XG4gICAgICAgICAgICAgICAgLy90aGUgbmV4dCBhcnJheSBpdGVtIGlzIGJldHRlciB0aGFuIGEgc2hhbGxvd2VyIHN1YnN0cmluZyBvZiB0aGlzIG9uZVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgai0tO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGxvYWRMb2NhbGUobmFtZSkge1xuICAgIHZhciBvbGRMb2NhbGUgPSBudWxsO1xuICAgIC8vIFRPRE86IEZpbmQgYSBiZXR0ZXIgd2F5IHRvIHJlZ2lzdGVyIGFuZCBsb2FkIGFsbCB0aGUgbG9jYWxlcyBpbiBOb2RlXG4gICAgaWYgKCFsb2NhbGVzW25hbWVdICYmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykgJiZcbiAgICAgICAgICAgIG1vZHVsZSAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgb2xkTG9jYWxlID0gZ2xvYmFsTG9jYWxlLl9hYmJyO1xuICAgICAgICAgICAgdmFyIGFsaWFzZWRSZXF1aXJlID0gcmVxdWlyZTtcbiAgICAgICAgICAgIGFsaWFzZWRSZXF1aXJlKCcuL2xvY2FsZS8nICsgbmFtZSk7XG4gICAgICAgICAgICBnZXRTZXRHbG9iYWxMb2NhbGUob2xkTG9jYWxlKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICB9XG4gICAgcmV0dXJuIGxvY2FsZXNbbmFtZV07XG59XG5cbi8vIFRoaXMgZnVuY3Rpb24gd2lsbCBsb2FkIGxvY2FsZSBhbmQgdGhlbiBzZXQgdGhlIGdsb2JhbCBsb2NhbGUuICBJZlxuLy8gbm8gYXJndW1lbnRzIGFyZSBwYXNzZWQgaW4sIGl0IHdpbGwgc2ltcGx5IHJldHVybiB0aGUgY3VycmVudCBnbG9iYWxcbi8vIGxvY2FsZSBrZXkuXG5mdW5jdGlvbiBnZXRTZXRHbG9iYWxMb2NhbGUgKGtleSwgdmFsdWVzKSB7XG4gICAgdmFyIGRhdGE7XG4gICAgaWYgKGtleSkge1xuICAgICAgICBpZiAoaXNVbmRlZmluZWQodmFsdWVzKSkge1xuICAgICAgICAgICAgZGF0YSA9IGdldExvY2FsZShrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IGRlZmluZUxvY2FsZShrZXksIHZhbHVlcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgLy8gbW9tZW50LmR1cmF0aW9uLl9sb2NhbGUgPSBtb21lbnQuX2xvY2FsZSA9IGRhdGE7XG4gICAgICAgICAgICBnbG9iYWxMb2NhbGUgPSBkYXRhO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGdsb2JhbExvY2FsZS5fYWJicjtcbn1cblxuZnVuY3Rpb24gZGVmaW5lTG9jYWxlIChuYW1lLCBjb25maWcpIHtcbiAgICBpZiAoY29uZmlnICE9PSBudWxsKSB7XG4gICAgICAgIHZhciBwYXJlbnRDb25maWcgPSBiYXNlQ29uZmlnO1xuICAgICAgICBjb25maWcuYWJiciA9IG5hbWU7XG4gICAgICAgIGlmIChsb2NhbGVzW25hbWVdICE9IG51bGwpIHtcbiAgICAgICAgICAgIGRlcHJlY2F0ZVNpbXBsZSgnZGVmaW5lTG9jYWxlT3ZlcnJpZGUnLFxuICAgICAgICAgICAgICAgICAgICAndXNlIG1vbWVudC51cGRhdGVMb2NhbGUobG9jYWxlTmFtZSwgY29uZmlnKSB0byBjaGFuZ2UgJyArXG4gICAgICAgICAgICAgICAgICAgICdhbiBleGlzdGluZyBsb2NhbGUuIG1vbWVudC5kZWZpbmVMb2NhbGUobG9jYWxlTmFtZSwgJyArXG4gICAgICAgICAgICAgICAgICAgICdjb25maWcpIHNob3VsZCBvbmx5IGJlIHVzZWQgZm9yIGNyZWF0aW5nIGEgbmV3IGxvY2FsZSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1NlZSBodHRwOi8vbW9tZW50anMuY29tL2d1aWRlcy8jL3dhcm5pbmdzL2RlZmluZS1sb2NhbGUvIGZvciBtb3JlIGluZm8uJyk7XG4gICAgICAgICAgICBwYXJlbnRDb25maWcgPSBsb2NhbGVzW25hbWVdLl9jb25maWc7XG4gICAgICAgIH0gZWxzZSBpZiAoY29uZmlnLnBhcmVudExvY2FsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAobG9jYWxlc1tjb25maWcucGFyZW50TG9jYWxlXSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50Q29uZmlnID0gbG9jYWxlc1tjb25maWcucGFyZW50TG9jYWxlXS5fY29uZmlnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIWxvY2FsZUZhbWlsaWVzW2NvbmZpZy5wYXJlbnRMb2NhbGVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsZUZhbWlsaWVzW2NvbmZpZy5wYXJlbnRMb2NhbGVdID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxvY2FsZUZhbWlsaWVzW2NvbmZpZy5wYXJlbnRMb2NhbGVdLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgICAgICAgICBjb25maWc6IGNvbmZpZ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxvY2FsZXNbbmFtZV0gPSBuZXcgTG9jYWxlKG1lcmdlQ29uZmlncyhwYXJlbnRDb25maWcsIGNvbmZpZykpO1xuXG4gICAgICAgIGlmIChsb2NhbGVGYW1pbGllc1tuYW1lXSkge1xuICAgICAgICAgICAgbG9jYWxlRmFtaWxpZXNbbmFtZV0uZm9yRWFjaChmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgIGRlZmluZUxvY2FsZSh4Lm5hbWUsIHguY29uZmlnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYmFja3dhcmRzIGNvbXBhdCBmb3Igbm93OiBhbHNvIHNldCB0aGUgbG9jYWxlXG4gICAgICAgIC8vIG1ha2Ugc3VyZSB3ZSBzZXQgdGhlIGxvY2FsZSBBRlRFUiBhbGwgY2hpbGQgbG9jYWxlcyBoYXZlIGJlZW5cbiAgICAgICAgLy8gY3JlYXRlZCwgc28gd2Ugd29uJ3QgZW5kIHVwIHdpdGggdGhlIGNoaWxkIGxvY2FsZSBzZXQuXG4gICAgICAgIGdldFNldEdsb2JhbExvY2FsZShuYW1lKTtcblxuXG4gICAgICAgIHJldHVybiBsb2NhbGVzW25hbWVdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHVzZWZ1bCBmb3IgdGVzdGluZ1xuICAgICAgICBkZWxldGUgbG9jYWxlc1tuYW1lXTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVMb2NhbGUobmFtZSwgY29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZyAhPSBudWxsKSB7XG4gICAgICAgIHZhciBsb2NhbGUsIHRtcExvY2FsZSwgcGFyZW50Q29uZmlnID0gYmFzZUNvbmZpZztcbiAgICAgICAgLy8gTUVSR0VcbiAgICAgICAgdG1wTG9jYWxlID0gbG9hZExvY2FsZShuYW1lKTtcbiAgICAgICAgaWYgKHRtcExvY2FsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBwYXJlbnRDb25maWcgPSB0bXBMb2NhbGUuX2NvbmZpZztcbiAgICAgICAgfVxuICAgICAgICBjb25maWcgPSBtZXJnZUNvbmZpZ3MocGFyZW50Q29uZmlnLCBjb25maWcpO1xuICAgICAgICBsb2NhbGUgPSBuZXcgTG9jYWxlKGNvbmZpZyk7XG4gICAgICAgIGxvY2FsZS5wYXJlbnRMb2NhbGUgPSBsb2NhbGVzW25hbWVdO1xuICAgICAgICBsb2NhbGVzW25hbWVdID0gbG9jYWxlO1xuXG4gICAgICAgIC8vIGJhY2t3YXJkcyBjb21wYXQgZm9yIG5vdzogYWxzbyBzZXQgdGhlIGxvY2FsZVxuICAgICAgICBnZXRTZXRHbG9iYWxMb2NhbGUobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gcGFzcyBudWxsIGZvciBjb25maWcgdG8gdW51cGRhdGUsIHVzZWZ1bCBmb3IgdGVzdHNcbiAgICAgICAgaWYgKGxvY2FsZXNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKGxvY2FsZXNbbmFtZV0ucGFyZW50TG9jYWxlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBsb2NhbGVzW25hbWVdID0gbG9jYWxlc1tuYW1lXS5wYXJlbnRMb2NhbGU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGxvY2FsZXNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBsb2NhbGVzW25hbWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBsb2NhbGVzW25hbWVdO1xufVxuXG4vLyByZXR1cm5zIGxvY2FsZSBkYXRhXG5mdW5jdGlvbiBnZXRMb2NhbGUgKGtleSkge1xuICAgIHZhciBsb2NhbGU7XG5cbiAgICBpZiAoa2V5ICYmIGtleS5fbG9jYWxlICYmIGtleS5fbG9jYWxlLl9hYmJyKSB7XG4gICAgICAgIGtleSA9IGtleS5fbG9jYWxlLl9hYmJyO1xuICAgIH1cblxuICAgIGlmICgha2V5KSB7XG4gICAgICAgIHJldHVybiBnbG9iYWxMb2NhbGU7XG4gICAgfVxuXG4gICAgaWYgKCFpc0FycmF5KGtleSkpIHtcbiAgICAgICAgLy9zaG9ydC1jaXJjdWl0IGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICBsb2NhbGUgPSBsb2FkTG9jYWxlKGtleSk7XG4gICAgICAgIGlmIChsb2NhbGUpIHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhbGU7XG4gICAgICAgIH1cbiAgICAgICAga2V5ID0gW2tleV07XG4gICAgfVxuXG4gICAgcmV0dXJuIGNob29zZUxvY2FsZShrZXkpO1xufVxuXG5mdW5jdGlvbiBsaXN0TG9jYWxlcygpIHtcbiAgICByZXR1cm4ga2V5cyhsb2NhbGVzKTtcbn1cblxuZnVuY3Rpb24gY2hlY2tPdmVyZmxvdyAobSkge1xuICAgIHZhciBvdmVyZmxvdztcbiAgICB2YXIgYSA9IG0uX2E7XG5cbiAgICBpZiAoYSAmJiBnZXRQYXJzaW5nRmxhZ3MobSkub3ZlcmZsb3cgPT09IC0yKSB7XG4gICAgICAgIG92ZXJmbG93ID1cbiAgICAgICAgICAgIGFbTU9OVEhdICAgICAgIDwgMCB8fCBhW01PTlRIXSAgICAgICA+IDExICA/IE1PTlRIIDpcbiAgICAgICAgICAgIGFbREFURV0gICAgICAgIDwgMSB8fCBhW0RBVEVdICAgICAgICA+IGRheXNJbk1vbnRoKGFbWUVBUl0sIGFbTU9OVEhdKSA/IERBVEUgOlxuICAgICAgICAgICAgYVtIT1VSXSAgICAgICAgPCAwIHx8IGFbSE9VUl0gICAgICAgID4gMjQgfHwgKGFbSE9VUl0gPT09IDI0ICYmIChhW01JTlVURV0gIT09IDAgfHwgYVtTRUNPTkRdICE9PSAwIHx8IGFbTUlMTElTRUNPTkRdICE9PSAwKSkgPyBIT1VSIDpcbiAgICAgICAgICAgIGFbTUlOVVRFXSAgICAgIDwgMCB8fCBhW01JTlVURV0gICAgICA+IDU5ICA/IE1JTlVURSA6XG4gICAgICAgICAgICBhW1NFQ09ORF0gICAgICA8IDAgfHwgYVtTRUNPTkRdICAgICAgPiA1OSAgPyBTRUNPTkQgOlxuICAgICAgICAgICAgYVtNSUxMSVNFQ09ORF0gPCAwIHx8IGFbTUlMTElTRUNPTkRdID4gOTk5ID8gTUlMTElTRUNPTkQgOlxuICAgICAgICAgICAgLTE7XG5cbiAgICAgICAgaWYgKGdldFBhcnNpbmdGbGFncyhtKS5fb3ZlcmZsb3dEYXlPZlllYXIgJiYgKG92ZXJmbG93IDwgWUVBUiB8fCBvdmVyZmxvdyA+IERBVEUpKSB7XG4gICAgICAgICAgICBvdmVyZmxvdyA9IERBVEU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdldFBhcnNpbmdGbGFncyhtKS5fb3ZlcmZsb3dXZWVrcyAmJiBvdmVyZmxvdyA9PT0gLTEpIHtcbiAgICAgICAgICAgIG92ZXJmbG93ID0gV0VFSztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZ2V0UGFyc2luZ0ZsYWdzKG0pLl9vdmVyZmxvd1dlZWtkYXkgJiYgb3ZlcmZsb3cgPT09IC0xKSB7XG4gICAgICAgICAgICBvdmVyZmxvdyA9IFdFRUtEQVk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MobSkub3ZlcmZsb3cgPSBvdmVyZmxvdztcbiAgICB9XG5cbiAgICByZXR1cm4gbTtcbn1cblxuLy8gUGljayB0aGUgZmlyc3QgZGVmaW5lZCBvZiB0d28gb3IgdGhyZWUgYXJndW1lbnRzLlxuZnVuY3Rpb24gZGVmYXVsdHMoYSwgYiwgYykge1xuICAgIGlmIChhICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICAgIGlmIChiICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGI7XG4gICAgfVxuICAgIHJldHVybiBjO1xufVxuXG5mdW5jdGlvbiBjdXJyZW50RGF0ZUFycmF5KGNvbmZpZykge1xuICAgIC8vIGhvb2tzIGlzIGFjdHVhbGx5IHRoZSBleHBvcnRlZCBtb21lbnQgb2JqZWN0XG4gICAgdmFyIG5vd1ZhbHVlID0gbmV3IERhdGUoaG9va3Mubm93KCkpO1xuICAgIGlmIChjb25maWcuX3VzZVVUQykge1xuICAgICAgICByZXR1cm4gW25vd1ZhbHVlLmdldFVUQ0Z1bGxZZWFyKCksIG5vd1ZhbHVlLmdldFVUQ01vbnRoKCksIG5vd1ZhbHVlLmdldFVUQ0RhdGUoKV07XG4gICAgfVxuICAgIHJldHVybiBbbm93VmFsdWUuZ2V0RnVsbFllYXIoKSwgbm93VmFsdWUuZ2V0TW9udGgoKSwgbm93VmFsdWUuZ2V0RGF0ZSgpXTtcbn1cblxuLy8gY29udmVydCBhbiBhcnJheSB0byBhIGRhdGUuXG4vLyB0aGUgYXJyYXkgc2hvdWxkIG1pcnJvciB0aGUgcGFyYW1ldGVycyBiZWxvd1xuLy8gbm90ZTogYWxsIHZhbHVlcyBwYXN0IHRoZSB5ZWFyIGFyZSBvcHRpb25hbCBhbmQgd2lsbCBkZWZhdWx0IHRvIHRoZSBsb3dlc3QgcG9zc2libGUgdmFsdWUuXG4vLyBbeWVhciwgbW9udGgsIGRheSAsIGhvdXIsIG1pbnV0ZSwgc2Vjb25kLCBtaWxsaXNlY29uZF1cbmZ1bmN0aW9uIGNvbmZpZ0Zyb21BcnJheSAoY29uZmlnKSB7XG4gICAgdmFyIGksIGRhdGUsIGlucHV0ID0gW10sIGN1cnJlbnREYXRlLCB5ZWFyVG9Vc2U7XG5cbiAgICBpZiAoY29uZmlnLl9kKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjdXJyZW50RGF0ZSA9IGN1cnJlbnREYXRlQXJyYXkoY29uZmlnKTtcblxuICAgIC8vY29tcHV0ZSBkYXkgb2YgdGhlIHllYXIgZnJvbSB3ZWVrcyBhbmQgd2Vla2RheXNcbiAgICBpZiAoY29uZmlnLl93ICYmIGNvbmZpZy5fYVtEQVRFXSA9PSBudWxsICYmIGNvbmZpZy5fYVtNT05USF0gPT0gbnVsbCkge1xuICAgICAgICBkYXlPZlllYXJGcm9tV2Vla0luZm8oY29uZmlnKTtcbiAgICB9XG5cbiAgICAvL2lmIHRoZSBkYXkgb2YgdGhlIHllYXIgaXMgc2V0LCBmaWd1cmUgb3V0IHdoYXQgaXQgaXNcbiAgICBpZiAoY29uZmlnLl9kYXlPZlllYXIgIT0gbnVsbCkge1xuICAgICAgICB5ZWFyVG9Vc2UgPSBkZWZhdWx0cyhjb25maWcuX2FbWUVBUl0sIGN1cnJlbnREYXRlW1lFQVJdKTtcblxuICAgICAgICBpZiAoY29uZmlnLl9kYXlPZlllYXIgPiBkYXlzSW5ZZWFyKHllYXJUb1VzZSkgfHwgY29uZmlnLl9kYXlPZlllYXIgPT09IDApIHtcbiAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLl9vdmVyZmxvd0RheU9mWWVhciA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBkYXRlID0gY3JlYXRlVVRDRGF0ZSh5ZWFyVG9Vc2UsIDAsIGNvbmZpZy5fZGF5T2ZZZWFyKTtcbiAgICAgICAgY29uZmlnLl9hW01PTlRIXSA9IGRhdGUuZ2V0VVRDTW9udGgoKTtcbiAgICAgICAgY29uZmlnLl9hW0RBVEVdID0gZGF0ZS5nZXRVVENEYXRlKCk7XG4gICAgfVxuXG4gICAgLy8gRGVmYXVsdCB0byBjdXJyZW50IGRhdGUuXG4gICAgLy8gKiBpZiBubyB5ZWFyLCBtb250aCwgZGF5IG9mIG1vbnRoIGFyZSBnaXZlbiwgZGVmYXVsdCB0byB0b2RheVxuICAgIC8vICogaWYgZGF5IG9mIG1vbnRoIGlzIGdpdmVuLCBkZWZhdWx0IG1vbnRoIGFuZCB5ZWFyXG4gICAgLy8gKiBpZiBtb250aCBpcyBnaXZlbiwgZGVmYXVsdCBvbmx5IHllYXJcbiAgICAvLyAqIGlmIHllYXIgaXMgZ2l2ZW4sIGRvbid0IGRlZmF1bHQgYW55dGhpbmdcbiAgICBmb3IgKGkgPSAwOyBpIDwgMyAmJiBjb25maWcuX2FbaV0gPT0gbnVsbDsgKytpKSB7XG4gICAgICAgIGNvbmZpZy5fYVtpXSA9IGlucHV0W2ldID0gY3VycmVudERhdGVbaV07XG4gICAgfVxuXG4gICAgLy8gWmVybyBvdXQgd2hhdGV2ZXIgd2FzIG5vdCBkZWZhdWx0ZWQsIGluY2x1ZGluZyB0aW1lXG4gICAgZm9yICg7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgY29uZmlnLl9hW2ldID0gaW5wdXRbaV0gPSAoY29uZmlnLl9hW2ldID09IG51bGwpID8gKGkgPT09IDIgPyAxIDogMCkgOiBjb25maWcuX2FbaV07XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIDI0OjAwOjAwLjAwMFxuICAgIGlmIChjb25maWcuX2FbSE9VUl0gPT09IDI0ICYmXG4gICAgICAgICAgICBjb25maWcuX2FbTUlOVVRFXSA9PT0gMCAmJlxuICAgICAgICAgICAgY29uZmlnLl9hW1NFQ09ORF0gPT09IDAgJiZcbiAgICAgICAgICAgIGNvbmZpZy5fYVtNSUxMSVNFQ09ORF0gPT09IDApIHtcbiAgICAgICAgY29uZmlnLl9uZXh0RGF5ID0gdHJ1ZTtcbiAgICAgICAgY29uZmlnLl9hW0hPVVJdID0gMDtcbiAgICB9XG5cbiAgICBjb25maWcuX2QgPSAoY29uZmlnLl91c2VVVEMgPyBjcmVhdGVVVENEYXRlIDogY3JlYXRlRGF0ZSkuYXBwbHkobnVsbCwgaW5wdXQpO1xuICAgIC8vIEFwcGx5IHRpbWV6b25lIG9mZnNldCBmcm9tIGlucHV0LiBUaGUgYWN0dWFsIHV0Y09mZnNldCBjYW4gYmUgY2hhbmdlZFxuICAgIC8vIHdpdGggcGFyc2Vab25lLlxuICAgIGlmIChjb25maWcuX3R6bSAhPSBudWxsKSB7XG4gICAgICAgIGNvbmZpZy5fZC5zZXRVVENNaW51dGVzKGNvbmZpZy5fZC5nZXRVVENNaW51dGVzKCkgLSBjb25maWcuX3R6bSk7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5fbmV4dERheSkge1xuICAgICAgICBjb25maWcuX2FbSE9VUl0gPSAyNDtcbiAgICB9XG5cbiAgICAvLyBjaGVjayBmb3IgbWlzbWF0Y2hpbmcgZGF5IG9mIHdlZWtcbiAgICBpZiAoY29uZmlnLl93ICYmIHR5cGVvZiBjb25maWcuX3cuZCAhPT0gJ3VuZGVmaW5lZCcgJiYgY29uZmlnLl93LmQgIT09IGNvbmZpZy5fZC5nZXREYXkoKSkge1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS53ZWVrZGF5TWlzbWF0Y2ggPSB0cnVlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGF5T2ZZZWFyRnJvbVdlZWtJbmZvKGNvbmZpZykge1xuICAgIHZhciB3LCB3ZWVrWWVhciwgd2Vlaywgd2Vla2RheSwgZG93LCBkb3ksIHRlbXAsIHdlZWtkYXlPdmVyZmxvdztcblxuICAgIHcgPSBjb25maWcuX3c7XG4gICAgaWYgKHcuR0cgIT0gbnVsbCB8fCB3LlcgIT0gbnVsbCB8fCB3LkUgIT0gbnVsbCkge1xuICAgICAgICBkb3cgPSAxO1xuICAgICAgICBkb3kgPSA0O1xuXG4gICAgICAgIC8vIFRPRE86IFdlIG5lZWQgdG8gdGFrZSB0aGUgY3VycmVudCBpc29XZWVrWWVhciwgYnV0IHRoYXQgZGVwZW5kcyBvblxuICAgICAgICAvLyBob3cgd2UgaW50ZXJwcmV0IG5vdyAobG9jYWwsIHV0YywgZml4ZWQgb2Zmc2V0KS4gU28gY3JlYXRlXG4gICAgICAgIC8vIGEgbm93IHZlcnNpb24gb2YgY3VycmVudCBjb25maWcgKHRha2UgbG9jYWwvdXRjL29mZnNldCBmbGFncywgYW5kXG4gICAgICAgIC8vIGNyZWF0ZSBub3cpLlxuICAgICAgICB3ZWVrWWVhciA9IGRlZmF1bHRzKHcuR0csIGNvbmZpZy5fYVtZRUFSXSwgd2Vla09mWWVhcihjcmVhdGVMb2NhbCgpLCAxLCA0KS55ZWFyKTtcbiAgICAgICAgd2VlayA9IGRlZmF1bHRzKHcuVywgMSk7XG4gICAgICAgIHdlZWtkYXkgPSBkZWZhdWx0cyh3LkUsIDEpO1xuICAgICAgICBpZiAod2Vla2RheSA8IDEgfHwgd2Vla2RheSA+IDcpIHtcbiAgICAgICAgICAgIHdlZWtkYXlPdmVyZmxvdyA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBkb3cgPSBjb25maWcuX2xvY2FsZS5fd2Vlay5kb3c7XG4gICAgICAgIGRveSA9IGNvbmZpZy5fbG9jYWxlLl93ZWVrLmRveTtcblxuICAgICAgICB2YXIgY3VyV2VlayA9IHdlZWtPZlllYXIoY3JlYXRlTG9jYWwoKSwgZG93LCBkb3kpO1xuXG4gICAgICAgIHdlZWtZZWFyID0gZGVmYXVsdHMody5nZywgY29uZmlnLl9hW1lFQVJdLCBjdXJXZWVrLnllYXIpO1xuXG4gICAgICAgIC8vIERlZmF1bHQgdG8gY3VycmVudCB3ZWVrLlxuICAgICAgICB3ZWVrID0gZGVmYXVsdHMody53LCBjdXJXZWVrLndlZWspO1xuXG4gICAgICAgIGlmICh3LmQgIT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gd2Vla2RheSAtLSBsb3cgZGF5IG51bWJlcnMgYXJlIGNvbnNpZGVyZWQgbmV4dCB3ZWVrXG4gICAgICAgICAgICB3ZWVrZGF5ID0gdy5kO1xuICAgICAgICAgICAgaWYgKHdlZWtkYXkgPCAwIHx8IHdlZWtkYXkgPiA2KSB7XG4gICAgICAgICAgICAgICAgd2Vla2RheU92ZXJmbG93ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh3LmUgIT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gbG9jYWwgd2Vla2RheSAtLSBjb3VudGluZyBzdGFydHMgZnJvbSBiZWdpbmluZyBvZiB3ZWVrXG4gICAgICAgICAgICB3ZWVrZGF5ID0gdy5lICsgZG93O1xuICAgICAgICAgICAgaWYgKHcuZSA8IDAgfHwgdy5lID4gNikge1xuICAgICAgICAgICAgICAgIHdlZWtkYXlPdmVyZmxvdyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBkZWZhdWx0IHRvIGJlZ2luaW5nIG9mIHdlZWtcbiAgICAgICAgICAgIHdlZWtkYXkgPSBkb3c7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHdlZWsgPCAxIHx8IHdlZWsgPiB3ZWVrc0luWWVhcih3ZWVrWWVhciwgZG93LCBkb3kpKSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLl9vdmVyZmxvd1dlZWtzID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHdlZWtkYXlPdmVyZmxvdyAhPSBudWxsKSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLl9vdmVyZmxvd1dlZWtkYXkgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRlbXAgPSBkYXlPZlllYXJGcm9tV2Vla3Mod2Vla1llYXIsIHdlZWssIHdlZWtkYXksIGRvdywgZG95KTtcbiAgICAgICAgY29uZmlnLl9hW1lFQVJdID0gdGVtcC55ZWFyO1xuICAgICAgICBjb25maWcuX2RheU9mWWVhciA9IHRlbXAuZGF5T2ZZZWFyO1xuICAgIH1cbn1cblxuLy8gaXNvIDg2MDEgcmVnZXhcbi8vIDAwMDAtMDAtMDAgMDAwMC1XMDAgb3IgMDAwMC1XMDAtMCArIFQgKyAwMCBvciAwMDowMCBvciAwMDowMDowMCBvciAwMDowMDowMC4wMDAgKyArMDA6MDAgb3IgKzAwMDAgb3IgKzAwKVxudmFyIGV4dGVuZGVkSXNvUmVnZXggPSAvXlxccyooKD86WystXVxcZHs2fXxcXGR7NH0pLSg/OlxcZFxcZC1cXGRcXGR8V1xcZFxcZC1cXGR8V1xcZFxcZHxcXGRcXGRcXGR8XFxkXFxkKSkoPzooVHwgKShcXGRcXGQoPzo6XFxkXFxkKD86OlxcZFxcZCg/OlsuLF1cXGQrKT8pPyk/KShbXFwrXFwtXVxcZFxcZCg/Ojo/XFxkXFxkKT98XFxzKlopPyk/JC87XG52YXIgYmFzaWNJc29SZWdleCA9IC9eXFxzKigoPzpbKy1dXFxkezZ9fFxcZHs0fSkoPzpcXGRcXGRcXGRcXGR8V1xcZFxcZFxcZHxXXFxkXFxkfFxcZFxcZFxcZHxcXGRcXGQpKSg/OihUfCApKFxcZFxcZCg/OlxcZFxcZCg/OlxcZFxcZCg/OlsuLF1cXGQrKT8pPyk/KShbXFwrXFwtXVxcZFxcZCg/Ojo/XFxkXFxkKT98XFxzKlopPyk/JC87XG5cbnZhciB0elJlZ2V4ID0gL1p8WystXVxcZFxcZCg/Ojo/XFxkXFxkKT8vO1xuXG52YXIgaXNvRGF0ZXMgPSBbXG4gICAgWydZWVlZWVktTU0tREQnLCAvWystXVxcZHs2fS1cXGRcXGQtXFxkXFxkL10sXG4gICAgWydZWVlZLU1NLUREJywgL1xcZHs0fS1cXGRcXGQtXFxkXFxkL10sXG4gICAgWydHR0dHLVtXXVdXLUUnLCAvXFxkezR9LVdcXGRcXGQtXFxkL10sXG4gICAgWydHR0dHLVtXXVdXJywgL1xcZHs0fS1XXFxkXFxkLywgZmFsc2VdLFxuICAgIFsnWVlZWS1EREQnLCAvXFxkezR9LVxcZHszfS9dLFxuICAgIFsnWVlZWS1NTScsIC9cXGR7NH0tXFxkXFxkLywgZmFsc2VdLFxuICAgIFsnWVlZWVlZTU1ERCcsIC9bKy1dXFxkezEwfS9dLFxuICAgIFsnWVlZWU1NREQnLCAvXFxkezh9L10sXG4gICAgLy8gWVlZWU1NIGlzIE5PVCBhbGxvd2VkIGJ5IHRoZSBzdGFuZGFyZFxuICAgIFsnR0dHR1tXXVdXRScsIC9cXGR7NH1XXFxkezN9L10sXG4gICAgWydHR0dHW1ddV1cnLCAvXFxkezR9V1xcZHsyfS8sIGZhbHNlXSxcbiAgICBbJ1lZWVlEREQnLCAvXFxkezd9L11cbl07XG5cbi8vIGlzbyB0aW1lIGZvcm1hdHMgYW5kIHJlZ2V4ZXNcbnZhciBpc29UaW1lcyA9IFtcbiAgICBbJ0hIOm1tOnNzLlNTU1MnLCAvXFxkXFxkOlxcZFxcZDpcXGRcXGRcXC5cXGQrL10sXG4gICAgWydISDptbTpzcyxTU1NTJywgL1xcZFxcZDpcXGRcXGQ6XFxkXFxkLFxcZCsvXSxcbiAgICBbJ0hIOm1tOnNzJywgL1xcZFxcZDpcXGRcXGQ6XFxkXFxkL10sXG4gICAgWydISDptbScsIC9cXGRcXGQ6XFxkXFxkL10sXG4gICAgWydISG1tc3MuU1NTUycsIC9cXGRcXGRcXGRcXGRcXGRcXGRcXC5cXGQrL10sXG4gICAgWydISG1tc3MsU1NTUycsIC9cXGRcXGRcXGRcXGRcXGRcXGQsXFxkKy9dLFxuICAgIFsnSEhtbXNzJywgL1xcZFxcZFxcZFxcZFxcZFxcZC9dLFxuICAgIFsnSEhtbScsIC9cXGRcXGRcXGRcXGQvXSxcbiAgICBbJ0hIJywgL1xcZFxcZC9dXG5dO1xuXG52YXIgYXNwTmV0SnNvblJlZ2V4ID0gL15cXC8/RGF0ZVxcKChcXC0/XFxkKykvaTtcblxuLy8gZGF0ZSBmcm9tIGlzbyBmb3JtYXRcbmZ1bmN0aW9uIGNvbmZpZ0Zyb21JU08oY29uZmlnKSB7XG4gICAgdmFyIGksIGwsXG4gICAgICAgIHN0cmluZyA9IGNvbmZpZy5faSxcbiAgICAgICAgbWF0Y2ggPSBleHRlbmRlZElzb1JlZ2V4LmV4ZWMoc3RyaW5nKSB8fCBiYXNpY0lzb1JlZ2V4LmV4ZWMoc3RyaW5nKSxcbiAgICAgICAgYWxsb3dUaW1lLCBkYXRlRm9ybWF0LCB0aW1lRm9ybWF0LCB0ekZvcm1hdDtcblxuICAgIGlmIChtYXRjaCkge1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5pc28gPSB0cnVlO1xuXG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSBpc29EYXRlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpc29EYXRlc1tpXVsxXS5leGVjKG1hdGNoWzFdKSkge1xuICAgICAgICAgICAgICAgIGRhdGVGb3JtYXQgPSBpc29EYXRlc1tpXVswXTtcbiAgICAgICAgICAgICAgICBhbGxvd1RpbWUgPSBpc29EYXRlc1tpXVsyXSAhPT0gZmFsc2U7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGVGb3JtYXQgPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uZmlnLl9pc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hdGNoWzNdKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsID0gaXNvVGltZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzb1RpbWVzW2ldWzFdLmV4ZWMobWF0Y2hbM10pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1hdGNoWzJdIHNob3VsZCBiZSAnVCcgb3Igc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgdGltZUZvcm1hdCA9IChtYXRjaFsyXSB8fCAnICcpICsgaXNvVGltZXNbaV1bMF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aW1lRm9ybWF0ID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhbGxvd1RpbWUgJiYgdGltZUZvcm1hdCAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWF0Y2hbNF0pIHtcbiAgICAgICAgICAgIGlmICh0elJlZ2V4LmV4ZWMobWF0Y2hbNF0pKSB7XG4gICAgICAgICAgICAgICAgdHpGb3JtYXQgPSAnWic7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5faXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25maWcuX2YgPSBkYXRlRm9ybWF0ICsgKHRpbWVGb3JtYXQgfHwgJycpICsgKHR6Rm9ybWF0IHx8ICcnKTtcbiAgICAgICAgY29uZmlnRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbmZpZy5faXNWYWxpZCA9IGZhbHNlO1xuICAgIH1cbn1cblxuLy8gUkZDIDI4MjIgcmVnZXg6IEZvciBkZXRhaWxzIHNlZSBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMjgyMiNzZWN0aW9uLTMuM1xudmFyIHJmYzI4MjIgPSAvXig/OihNb258VHVlfFdlZHxUaHV8RnJpfFNhdHxTdW4pLD9cXHMpPyhcXGR7MSwyfSlcXHMoSmFufEZlYnxNYXJ8QXByfE1heXxKdW58SnVsfEF1Z3xTZXB8T2N0fE5vdnxEZWMpXFxzKFxcZHsyLDR9KVxccyhcXGRcXGQpOihcXGRcXGQpKD86OihcXGRcXGQpKT9cXHMoPzooVVR8R01UfFtFQ01QXVtTRF1UKXwoW1p6XSl8KFsrLV1cXGR7NH0pKSQvO1xuXG5mdW5jdGlvbiBleHRyYWN0RnJvbVJGQzI4MjJTdHJpbmdzKHllYXJTdHIsIG1vbnRoU3RyLCBkYXlTdHIsIGhvdXJTdHIsIG1pbnV0ZVN0ciwgc2Vjb25kU3RyKSB7XG4gICAgdmFyIHJlc3VsdCA9IFtcbiAgICAgICAgdW50cnVuY2F0ZVllYXIoeWVhclN0ciksXG4gICAgICAgIGRlZmF1bHRMb2NhbGVNb250aHNTaG9ydC5pbmRleE9mKG1vbnRoU3RyKSxcbiAgICAgICAgcGFyc2VJbnQoZGF5U3RyLCAxMCksXG4gICAgICAgIHBhcnNlSW50KGhvdXJTdHIsIDEwKSxcbiAgICAgICAgcGFyc2VJbnQobWludXRlU3RyLCAxMClcbiAgICBdO1xuXG4gICAgaWYgKHNlY29uZFN0cikge1xuICAgICAgICByZXN1bHQucHVzaChwYXJzZUludChzZWNvbmRTdHIsIDEwKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gdW50cnVuY2F0ZVllYXIoeWVhclN0cikge1xuICAgIHZhciB5ZWFyID0gcGFyc2VJbnQoeWVhclN0ciwgMTApO1xuICAgIGlmICh5ZWFyIDw9IDQ5KSB7XG4gICAgICAgIHJldHVybiAyMDAwICsgeWVhcjtcbiAgICB9IGVsc2UgaWYgKHllYXIgPD0gOTk5KSB7XG4gICAgICAgIHJldHVybiAxOTAwICsgeWVhcjtcbiAgICB9XG4gICAgcmV0dXJuIHllYXI7XG59XG5cbmZ1bmN0aW9uIHByZXByb2Nlc3NSRkMyODIyKHMpIHtcbiAgICAvLyBSZW1vdmUgY29tbWVudHMgYW5kIGZvbGRpbmcgd2hpdGVzcGFjZSBhbmQgcmVwbGFjZSBtdWx0aXBsZS1zcGFjZXMgd2l0aCBhIHNpbmdsZSBzcGFjZVxuICAgIHJldHVybiBzLnJlcGxhY2UoL1xcKFteKV0qXFwpfFtcXG5cXHRdL2csICcgJykucmVwbGFjZSgvKFxcc1xccyspL2csICcgJykudHJpbSgpO1xufVxuXG5mdW5jdGlvbiBjaGVja1dlZWtkYXkod2Vla2RheVN0ciwgcGFyc2VkSW5wdXQsIGNvbmZpZykge1xuICAgIGlmICh3ZWVrZGF5U3RyKSB7XG4gICAgICAgIC8vIFRPRE86IFJlcGxhY2UgdGhlIHZhbmlsbGEgSlMgRGF0ZSBvYmplY3Qgd2l0aCBhbiBpbmRlcGVudGVudCBkYXktb2Ytd2VlayBjaGVjay5cbiAgICAgICAgdmFyIHdlZWtkYXlQcm92aWRlZCA9IGRlZmF1bHRMb2NhbGVXZWVrZGF5c1Nob3J0LmluZGV4T2Yod2Vla2RheVN0ciksXG4gICAgICAgICAgICB3ZWVrZGF5QWN0dWFsID0gbmV3IERhdGUocGFyc2VkSW5wdXRbMF0sIHBhcnNlZElucHV0WzFdLCBwYXJzZWRJbnB1dFsyXSkuZ2V0RGF5KCk7XG4gICAgICAgIGlmICh3ZWVrZGF5UHJvdmlkZWQgIT09IHdlZWtkYXlBY3R1YWwpIHtcbiAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLndlZWtkYXlNaXNtYXRjaCA9IHRydWU7XG4gICAgICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxudmFyIG9ic09mZnNldHMgPSB7XG4gICAgVVQ6IDAsXG4gICAgR01UOiAwLFxuICAgIEVEVDogLTQgKiA2MCxcbiAgICBFU1Q6IC01ICogNjAsXG4gICAgQ0RUOiAtNSAqIDYwLFxuICAgIENTVDogLTYgKiA2MCxcbiAgICBNRFQ6IC02ICogNjAsXG4gICAgTVNUOiAtNyAqIDYwLFxuICAgIFBEVDogLTcgKiA2MCxcbiAgICBQU1Q6IC04ICogNjBcbn07XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZU9mZnNldChvYnNPZmZzZXQsIG1pbGl0YXJ5T2Zmc2V0LCBudW1PZmZzZXQpIHtcbiAgICBpZiAob2JzT2Zmc2V0KSB7XG4gICAgICAgIHJldHVybiBvYnNPZmZzZXRzW29ic09mZnNldF07XG4gICAgfSBlbHNlIGlmIChtaWxpdGFyeU9mZnNldCkge1xuICAgICAgICAvLyB0aGUgb25seSBhbGxvd2VkIG1pbGl0YXJ5IHR6IGlzIFpcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGhtID0gcGFyc2VJbnQobnVtT2Zmc2V0LCAxMCk7XG4gICAgICAgIHZhciBtID0gaG0gJSAxMDAsIGggPSAoaG0gLSBtKSAvIDEwMDtcbiAgICAgICAgcmV0dXJuIGggKiA2MCArIG07XG4gICAgfVxufVxuXG4vLyBkYXRlIGFuZCB0aW1lIGZyb20gcmVmIDI4MjIgZm9ybWF0XG5mdW5jdGlvbiBjb25maWdGcm9tUkZDMjgyMihjb25maWcpIHtcbiAgICB2YXIgbWF0Y2ggPSByZmMyODIyLmV4ZWMocHJlcHJvY2Vzc1JGQzI4MjIoY29uZmlnLl9pKSk7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHZhciBwYXJzZWRBcnJheSA9IGV4dHJhY3RGcm9tUkZDMjgyMlN0cmluZ3MobWF0Y2hbNF0sIG1hdGNoWzNdLCBtYXRjaFsyXSwgbWF0Y2hbNV0sIG1hdGNoWzZdLCBtYXRjaFs3XSk7XG4gICAgICAgIGlmICghY2hlY2tXZWVrZGF5KG1hdGNoWzFdLCBwYXJzZWRBcnJheSwgY29uZmlnKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uZmlnLl9hID0gcGFyc2VkQXJyYXk7XG4gICAgICAgIGNvbmZpZy5fdHptID0gY2FsY3VsYXRlT2Zmc2V0KG1hdGNoWzhdLCBtYXRjaFs5XSwgbWF0Y2hbMTBdKTtcblxuICAgICAgICBjb25maWcuX2QgPSBjcmVhdGVVVENEYXRlLmFwcGx5KG51bGwsIGNvbmZpZy5fYSk7XG4gICAgICAgIGNvbmZpZy5fZC5zZXRVVENNaW51dGVzKGNvbmZpZy5fZC5nZXRVVENNaW51dGVzKCkgLSBjb25maWcuX3R6bSk7XG5cbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykucmZjMjgyMiA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uZmlnLl9pc1ZhbGlkID0gZmFsc2U7XG4gICAgfVxufVxuXG4vLyBkYXRlIGZyb20gaXNvIGZvcm1hdCBvciBmYWxsYmFja1xuZnVuY3Rpb24gY29uZmlnRnJvbVN0cmluZyhjb25maWcpIHtcbiAgICB2YXIgbWF0Y2hlZCA9IGFzcE5ldEpzb25SZWdleC5leGVjKGNvbmZpZy5faSk7XG5cbiAgICBpZiAobWF0Y2hlZCAhPT0gbnVsbCkge1xuICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSgrbWF0Y2hlZFsxXSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25maWdGcm9tSVNPKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZy5faXNWYWxpZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgZGVsZXRlIGNvbmZpZy5faXNWYWxpZDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uZmlnRnJvbVJGQzI4MjIoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnLl9pc1ZhbGlkID09PSBmYWxzZSkge1xuICAgICAgICBkZWxldGUgY29uZmlnLl9pc1ZhbGlkO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBGaW5hbCBhdHRlbXB0LCB1c2UgSW5wdXQgRmFsbGJhY2tcbiAgICBob29rcy5jcmVhdGVGcm9tSW5wdXRGYWxsYmFjayhjb25maWcpO1xufVxuXG5ob29rcy5jcmVhdGVGcm9tSW5wdXRGYWxsYmFjayA9IGRlcHJlY2F0ZShcbiAgICAndmFsdWUgcHJvdmlkZWQgaXMgbm90IGluIGEgcmVjb2duaXplZCBSRkMyODIyIG9yIElTTyBmb3JtYXQuIG1vbWVudCBjb25zdHJ1Y3Rpb24gZmFsbHMgYmFjayB0byBqcyBEYXRlKCksICcgK1xuICAgICd3aGljaCBpcyBub3QgcmVsaWFibGUgYWNyb3NzIGFsbCBicm93c2VycyBhbmQgdmVyc2lvbnMuIE5vbiBSRkMyODIyL0lTTyBkYXRlIGZvcm1hdHMgYXJlICcgK1xuICAgICdkaXNjb3VyYWdlZCBhbmQgd2lsbCBiZSByZW1vdmVkIGluIGFuIHVwY29taW5nIG1ham9yIHJlbGVhc2UuIFBsZWFzZSByZWZlciB0byAnICtcbiAgICAnaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9qcy1kYXRlLyBmb3IgbW9yZSBpbmZvLicsXG4gICAgZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShjb25maWcuX2kgKyAoY29uZmlnLl91c2VVVEMgPyAnIFVUQycgOiAnJykpO1xuICAgIH1cbik7XG5cbi8vIGNvbnN0YW50IHRoYXQgcmVmZXJzIHRvIHRoZSBJU08gc3RhbmRhcmRcbmhvb2tzLklTT184NjAxID0gZnVuY3Rpb24gKCkge307XG5cbi8vIGNvbnN0YW50IHRoYXQgcmVmZXJzIHRvIHRoZSBSRkMgMjgyMiBmb3JtXG5ob29rcy5SRkNfMjgyMiA9IGZ1bmN0aW9uICgpIHt9O1xuXG4vLyBkYXRlIGZyb20gc3RyaW5nIGFuZCBmb3JtYXQgc3RyaW5nXG5mdW5jdGlvbiBjb25maWdGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZykge1xuICAgIC8vIFRPRE86IE1vdmUgdGhpcyB0byBhbm90aGVyIHBhcnQgb2YgdGhlIGNyZWF0aW9uIGZsb3cgdG8gcHJldmVudCBjaXJjdWxhciBkZXBzXG4gICAgaWYgKGNvbmZpZy5fZiA9PT0gaG9va3MuSVNPXzg2MDEpIHtcbiAgICAgICAgY29uZmlnRnJvbUlTTyhjb25maWcpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChjb25maWcuX2YgPT09IGhvb2tzLlJGQ18yODIyKSB7XG4gICAgICAgIGNvbmZpZ0Zyb21SRkMyODIyKGNvbmZpZyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uZmlnLl9hID0gW107XG4gICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuZW1wdHkgPSB0cnVlO1xuXG4gICAgLy8gVGhpcyBhcnJheSBpcyB1c2VkIHRvIG1ha2UgYSBEYXRlLCBlaXRoZXIgd2l0aCBgbmV3IERhdGVgIG9yIGBEYXRlLlVUQ2BcbiAgICB2YXIgc3RyaW5nID0gJycgKyBjb25maWcuX2ksXG4gICAgICAgIGksIHBhcnNlZElucHV0LCB0b2tlbnMsIHRva2VuLCBza2lwcGVkLFxuICAgICAgICBzdHJpbmdMZW5ndGggPSBzdHJpbmcubGVuZ3RoLFxuICAgICAgICB0b3RhbFBhcnNlZElucHV0TGVuZ3RoID0gMDtcblxuICAgIHRva2VucyA9IGV4cGFuZEZvcm1hdChjb25maWcuX2YsIGNvbmZpZy5fbG9jYWxlKS5tYXRjaChmb3JtYXR0aW5nVG9rZW5zKSB8fCBbXTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XG4gICAgICAgIHBhcnNlZElucHV0ID0gKHN0cmluZy5tYXRjaChnZXRQYXJzZVJlZ2V4Rm9yVG9rZW4odG9rZW4sIGNvbmZpZykpIHx8IFtdKVswXTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3Rva2VuJywgdG9rZW4sICdwYXJzZWRJbnB1dCcsIHBhcnNlZElucHV0LFxuICAgICAgICAvLyAgICAgICAgICdyZWdleCcsIGdldFBhcnNlUmVnZXhGb3JUb2tlbih0b2tlbiwgY29uZmlnKSk7XG4gICAgICAgIGlmIChwYXJzZWRJbnB1dCkge1xuICAgICAgICAgICAgc2tpcHBlZCA9IHN0cmluZy5zdWJzdHIoMCwgc3RyaW5nLmluZGV4T2YocGFyc2VkSW5wdXQpKTtcbiAgICAgICAgICAgIGlmIChza2lwcGVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS51bnVzZWRJbnB1dC5wdXNoKHNraXBwZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKHN0cmluZy5pbmRleE9mKHBhcnNlZElucHV0KSArIHBhcnNlZElucHV0Lmxlbmd0aCk7XG4gICAgICAgICAgICB0b3RhbFBhcnNlZElucHV0TGVuZ3RoICs9IHBhcnNlZElucHV0Lmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICAvLyBkb24ndCBwYXJzZSBpZiBpdCdzIG5vdCBhIGtub3duIHRva2VuXG4gICAgICAgIGlmIChmb3JtYXRUb2tlbkZ1bmN0aW9uc1t0b2tlbl0pIHtcbiAgICAgICAgICAgIGlmIChwYXJzZWRJbnB1dCkge1xuICAgICAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmVtcHR5ID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS51bnVzZWRUb2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhZGRUaW1lVG9BcnJheUZyb21Ub2tlbih0b2tlbiwgcGFyc2VkSW5wdXQsIGNvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY29uZmlnLl9zdHJpY3QgJiYgIXBhcnNlZElucHV0KSB7XG4gICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS51bnVzZWRUb2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhZGQgcmVtYWluaW5nIHVucGFyc2VkIGlucHV0IGxlbmd0aCB0byB0aGUgc3RyaW5nXG4gICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuY2hhcnNMZWZ0T3ZlciA9IHN0cmluZ0xlbmd0aCAtIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGg7XG4gICAgaWYgKHN0cmluZy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLnVudXNlZElucHV0LnB1c2goc3RyaW5nKTtcbiAgICB9XG5cbiAgICAvLyBjbGVhciBfMTJoIGZsYWcgaWYgaG91ciBpcyA8PSAxMlxuICAgIGlmIChjb25maWcuX2FbSE9VUl0gPD0gMTIgJiZcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuYmlnSG91ciA9PT0gdHJ1ZSAmJlxuICAgICAgICBjb25maWcuX2FbSE9VUl0gPiAwKSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmJpZ0hvdXIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykucGFyc2VkRGF0ZVBhcnRzID0gY29uZmlnLl9hLnNsaWNlKDApO1xuICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLm1lcmlkaWVtID0gY29uZmlnLl9tZXJpZGllbTtcbiAgICAvLyBoYW5kbGUgbWVyaWRpZW1cbiAgICBjb25maWcuX2FbSE9VUl0gPSBtZXJpZGllbUZpeFdyYXAoY29uZmlnLl9sb2NhbGUsIGNvbmZpZy5fYVtIT1VSXSwgY29uZmlnLl9tZXJpZGllbSk7XG5cbiAgICBjb25maWdGcm9tQXJyYXkoY29uZmlnKTtcbiAgICBjaGVja092ZXJmbG93KGNvbmZpZyk7XG59XG5cblxuZnVuY3Rpb24gbWVyaWRpZW1GaXhXcmFwIChsb2NhbGUsIGhvdXIsIG1lcmlkaWVtKSB7XG4gICAgdmFyIGlzUG07XG5cbiAgICBpZiAobWVyaWRpZW0gPT0gbnVsbCkge1xuICAgICAgICAvLyBub3RoaW5nIHRvIGRvXG4gICAgICAgIHJldHVybiBob3VyO1xuICAgIH1cbiAgICBpZiAobG9jYWxlLm1lcmlkaWVtSG91ciAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiBsb2NhbGUubWVyaWRpZW1Ib3VyKGhvdXIsIG1lcmlkaWVtKTtcbiAgICB9IGVsc2UgaWYgKGxvY2FsZS5pc1BNICE9IG51bGwpIHtcbiAgICAgICAgLy8gRmFsbGJhY2tcbiAgICAgICAgaXNQbSA9IGxvY2FsZS5pc1BNKG1lcmlkaWVtKTtcbiAgICAgICAgaWYgKGlzUG0gJiYgaG91ciA8IDEyKSB7XG4gICAgICAgICAgICBob3VyICs9IDEyO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNQbSAmJiBob3VyID09PSAxMikge1xuICAgICAgICAgICAgaG91ciA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhvdXI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdGhpcyBpcyBub3Qgc3VwcG9zZWQgdG8gaGFwcGVuXG4gICAgICAgIHJldHVybiBob3VyO1xuICAgIH1cbn1cblxuLy8gZGF0ZSBmcm9tIHN0cmluZyBhbmQgYXJyYXkgb2YgZm9ybWF0IHN0cmluZ3NcbmZ1bmN0aW9uIGNvbmZpZ0Zyb21TdHJpbmdBbmRBcnJheShjb25maWcpIHtcbiAgICB2YXIgdGVtcENvbmZpZyxcbiAgICAgICAgYmVzdE1vbWVudCxcblxuICAgICAgICBzY29yZVRvQmVhdCxcbiAgICAgICAgaSxcbiAgICAgICAgY3VycmVudFNjb3JlO1xuXG4gICAgaWYgKGNvbmZpZy5fZi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuaW52YWxpZEZvcm1hdCA9IHRydWU7XG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKE5hTik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgY29uZmlnLl9mLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGN1cnJlbnRTY29yZSA9IDA7XG4gICAgICAgIHRlbXBDb25maWcgPSBjb3B5Q29uZmlnKHt9LCBjb25maWcpO1xuICAgICAgICBpZiAoY29uZmlnLl91c2VVVEMgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGVtcENvbmZpZy5fdXNlVVRDID0gY29uZmlnLl91c2VVVEM7XG4gICAgICAgIH1cbiAgICAgICAgdGVtcENvbmZpZy5fZiA9IGNvbmZpZy5fZltpXTtcbiAgICAgICAgY29uZmlnRnJvbVN0cmluZ0FuZEZvcm1hdCh0ZW1wQ29uZmlnKTtcblxuICAgICAgICBpZiAoIWlzVmFsaWQodGVtcENvbmZpZykpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYW55IGlucHV0IHRoYXQgd2FzIG5vdCBwYXJzZWQgYWRkIGEgcGVuYWx0eSBmb3IgdGhhdCBmb3JtYXRcbiAgICAgICAgY3VycmVudFNjb3JlICs9IGdldFBhcnNpbmdGbGFncyh0ZW1wQ29uZmlnKS5jaGFyc0xlZnRPdmVyO1xuXG4gICAgICAgIC8vb3IgdG9rZW5zXG4gICAgICAgIGN1cnJlbnRTY29yZSArPSBnZXRQYXJzaW5nRmxhZ3ModGVtcENvbmZpZykudW51c2VkVG9rZW5zLmxlbmd0aCAqIDEwO1xuXG4gICAgICAgIGdldFBhcnNpbmdGbGFncyh0ZW1wQ29uZmlnKS5zY29yZSA9IGN1cnJlbnRTY29yZTtcblxuICAgICAgICBpZiAoc2NvcmVUb0JlYXQgPT0gbnVsbCB8fCBjdXJyZW50U2NvcmUgPCBzY29yZVRvQmVhdCkge1xuICAgICAgICAgICAgc2NvcmVUb0JlYXQgPSBjdXJyZW50U2NvcmU7XG4gICAgICAgICAgICBiZXN0TW9tZW50ID0gdGVtcENvbmZpZztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGV4dGVuZChjb25maWcsIGJlc3RNb21lbnQgfHwgdGVtcENvbmZpZyk7XG59XG5cbmZ1bmN0aW9uIGNvbmZpZ0Zyb21PYmplY3QoY29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5fZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGkgPSBub3JtYWxpemVPYmplY3RVbml0cyhjb25maWcuX2kpO1xuICAgIGNvbmZpZy5fYSA9IG1hcChbaS55ZWFyLCBpLm1vbnRoLCBpLmRheSB8fCBpLmRhdGUsIGkuaG91ciwgaS5taW51dGUsIGkuc2Vjb25kLCBpLm1pbGxpc2Vjb25kXSwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gb2JqICYmIHBhcnNlSW50KG9iaiwgMTApO1xuICAgIH0pO1xuXG4gICAgY29uZmlnRnJvbUFycmF5KGNvbmZpZyk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUZyb21Db25maWcgKGNvbmZpZykge1xuICAgIHZhciByZXMgPSBuZXcgTW9tZW50KGNoZWNrT3ZlcmZsb3cocHJlcGFyZUNvbmZpZyhjb25maWcpKSk7XG4gICAgaWYgKHJlcy5fbmV4dERheSkge1xuICAgICAgICAvLyBBZGRpbmcgaXMgc21hcnQgZW5vdWdoIGFyb3VuZCBEU1RcbiAgICAgICAgcmVzLmFkZCgxLCAnZCcpO1xuICAgICAgICByZXMuX25leHREYXkgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gcHJlcGFyZUNvbmZpZyAoY29uZmlnKSB7XG4gICAgdmFyIGlucHV0ID0gY29uZmlnLl9pLFxuICAgICAgICBmb3JtYXQgPSBjb25maWcuX2Y7XG5cbiAgICBjb25maWcuX2xvY2FsZSA9IGNvbmZpZy5fbG9jYWxlIHx8IGdldExvY2FsZShjb25maWcuX2wpO1xuXG4gICAgaWYgKGlucHV0ID09PSBudWxsIHx8IChmb3JtYXQgPT09IHVuZGVmaW5lZCAmJiBpbnB1dCA9PT0gJycpKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVJbnZhbGlkKHtudWxsSW5wdXQ6IHRydWV9KTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25maWcuX2kgPSBpbnB1dCA9IGNvbmZpZy5fbG9jYWxlLnByZXBhcnNlKGlucHV0KTtcbiAgICB9XG5cbiAgICBpZiAoaXNNb21lbnQoaW5wdXQpKSB7XG4gICAgICAgIHJldHVybiBuZXcgTW9tZW50KGNoZWNrT3ZlcmZsb3coaW5wdXQpKTtcbiAgICB9IGVsc2UgaWYgKGlzRGF0ZShpbnB1dCkpIHtcbiAgICAgICAgY29uZmlnLl9kID0gaW5wdXQ7XG4gICAgfSBlbHNlIGlmIChpc0FycmF5KGZvcm1hdCkpIHtcbiAgICAgICAgY29uZmlnRnJvbVN0cmluZ0FuZEFycmF5KGNvbmZpZyk7XG4gICAgfSBlbHNlIGlmIChmb3JtYXQpIHtcbiAgICAgICAgY29uZmlnRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpO1xuICAgIH0gIGVsc2Uge1xuICAgICAgICBjb25maWdGcm9tSW5wdXQoY29uZmlnKTtcbiAgICB9XG5cbiAgICBpZiAoIWlzVmFsaWQoY29uZmlnKSkge1xuICAgICAgICBjb25maWcuX2QgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBjb25maWc7XG59XG5cbmZ1bmN0aW9uIGNvbmZpZ0Zyb21JbnB1dChjb25maWcpIHtcbiAgICB2YXIgaW5wdXQgPSBjb25maWcuX2k7XG4gICAgaWYgKGlzVW5kZWZpbmVkKGlucHV0KSkge1xuICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShob29rcy5ub3coKSk7XG4gICAgfSBlbHNlIGlmIChpc0RhdGUoaW5wdXQpKSB7XG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGlucHV0LnZhbHVlT2YoKSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbmZpZ0Zyb21TdHJpbmcoY29uZmlnKTtcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkoaW5wdXQpKSB7XG4gICAgICAgIGNvbmZpZy5fYSA9IG1hcChpbnB1dC5zbGljZSgwKSwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KG9iaiwgMTApO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uZmlnRnJvbUFycmF5KGNvbmZpZyk7XG4gICAgfSBlbHNlIGlmIChpc09iamVjdChpbnB1dCkpIHtcbiAgICAgICAgY29uZmlnRnJvbU9iamVjdChjb25maWcpO1xuICAgIH0gZWxzZSBpZiAoaXNOdW1iZXIoaW5wdXQpKSB7XG4gICAgICAgIC8vIGZyb20gbWlsbGlzZWNvbmRzXG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGlucHV0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBob29rcy5jcmVhdGVGcm9tSW5wdXRGYWxsYmFjayhjb25maWcpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlTG9jYWxPclVUQyAoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QsIGlzVVRDKSB7XG4gICAgdmFyIGMgPSB7fTtcblxuICAgIGlmIChsb2NhbGUgPT09IHRydWUgfHwgbG9jYWxlID09PSBmYWxzZSkge1xuICAgICAgICBzdHJpY3QgPSBsb2NhbGU7XG4gICAgICAgIGxvY2FsZSA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAoKGlzT2JqZWN0KGlucHV0KSAmJiBpc09iamVjdEVtcHR5KGlucHV0KSkgfHxcbiAgICAgICAgICAgIChpc0FycmF5KGlucHV0KSAmJiBpbnB1dC5sZW5ndGggPT09IDApKSB7XG4gICAgICAgIGlucHV0ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICAvLyBvYmplY3QgY29uc3RydWN0aW9uIG11c3QgYmUgZG9uZSB0aGlzIHdheS5cbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMTQyM1xuICAgIGMuX2lzQU1vbWVudE9iamVjdCA9IHRydWU7XG4gICAgYy5fdXNlVVRDID0gYy5faXNVVEMgPSBpc1VUQztcbiAgICBjLl9sID0gbG9jYWxlO1xuICAgIGMuX2kgPSBpbnB1dDtcbiAgICBjLl9mID0gZm9ybWF0O1xuICAgIGMuX3N0cmljdCA9IHN0cmljdDtcblxuICAgIHJldHVybiBjcmVhdGVGcm9tQ29uZmlnKGMpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMb2NhbCAoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QpIHtcbiAgICByZXR1cm4gY3JlYXRlTG9jYWxPclVUQyhpbnB1dCwgZm9ybWF0LCBsb2NhbGUsIHN0cmljdCwgZmFsc2UpO1xufVxuXG52YXIgcHJvdG90eXBlTWluID0gZGVwcmVjYXRlKFxuICAgICdtb21lbnQoKS5taW4gaXMgZGVwcmVjYXRlZCwgdXNlIG1vbWVudC5tYXggaW5zdGVhZC4gaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9taW4tbWF4LycsXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3RoZXIgPSBjcmVhdGVMb2NhbC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICBpZiAodGhpcy5pc1ZhbGlkKCkgJiYgb3RoZXIuaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3RoZXIgPCB0aGlzID8gdGhpcyA6IG90aGVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUludmFsaWQoKTtcbiAgICAgICAgfVxuICAgIH1cbik7XG5cbnZhciBwcm90b3R5cGVNYXggPSBkZXByZWNhdGUoXG4gICAgJ21vbWVudCgpLm1heCBpcyBkZXByZWNhdGVkLCB1c2UgbW9tZW50Lm1pbiBpbnN0ZWFkLiBodHRwOi8vbW9tZW50anMuY29tL2d1aWRlcy8jL3dhcm5pbmdzL21pbi1tYXgvJyxcbiAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdGhlciA9IGNyZWF0ZUxvY2FsLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgIGlmICh0aGlzLmlzVmFsaWQoKSAmJiBvdGhlci5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBvdGhlciA+IHRoaXMgPyB0aGlzIDogb3RoZXI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlSW52YWxpZCgpO1xuICAgICAgICB9XG4gICAgfVxuKTtcblxuLy8gUGljayBhIG1vbWVudCBtIGZyb20gbW9tZW50cyBzbyB0aGF0IG1bZm5dKG90aGVyKSBpcyB0cnVlIGZvciBhbGxcbi8vIG90aGVyLiBUaGlzIHJlbGllcyBvbiB0aGUgZnVuY3Rpb24gZm4gdG8gYmUgdHJhbnNpdGl2ZS5cbi8vXG4vLyBtb21lbnRzIHNob3VsZCBlaXRoZXIgYmUgYW4gYXJyYXkgb2YgbW9tZW50IG9iamVjdHMgb3IgYW4gYXJyYXksIHdob3NlXG4vLyBmaXJzdCBlbGVtZW50IGlzIGFuIGFycmF5IG9mIG1vbWVudCBvYmplY3RzLlxuZnVuY3Rpb24gcGlja0J5KGZuLCBtb21lbnRzKSB7XG4gICAgdmFyIHJlcywgaTtcbiAgICBpZiAobW9tZW50cy5sZW5ndGggPT09IDEgJiYgaXNBcnJheShtb21lbnRzWzBdKSkge1xuICAgICAgICBtb21lbnRzID0gbW9tZW50c1swXTtcbiAgICB9XG4gICAgaWYgKCFtb21lbnRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gY3JlYXRlTG9jYWwoKTtcbiAgICB9XG4gICAgcmVzID0gbW9tZW50c1swXTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbW9tZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAoIW1vbWVudHNbaV0uaXNWYWxpZCgpIHx8IG1vbWVudHNbaV1bZm5dKHJlcykpIHtcbiAgICAgICAgICAgIHJlcyA9IG1vbWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gVE9ETzogVXNlIFtdLnNvcnQgaW5zdGVhZD9cbmZ1bmN0aW9uIG1pbiAoKSB7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG5cbiAgICByZXR1cm4gcGlja0J5KCdpc0JlZm9yZScsIGFyZ3MpO1xufVxuXG5mdW5jdGlvbiBtYXggKCkge1xuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuXG4gICAgcmV0dXJuIHBpY2tCeSgnaXNBZnRlcicsIGFyZ3MpO1xufVxuXG52YXIgbm93ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBEYXRlLm5vdyA/IERhdGUubm93KCkgOiArKG5ldyBEYXRlKCkpO1xufTtcblxudmFyIG9yZGVyaW5nID0gWyd5ZWFyJywgJ3F1YXJ0ZXInLCAnbW9udGgnLCAnd2VlaycsICdkYXknLCAnaG91cicsICdtaW51dGUnLCAnc2Vjb25kJywgJ21pbGxpc2Vjb25kJ107XG5cbmZ1bmN0aW9uIGlzRHVyYXRpb25WYWxpZChtKSB7XG4gICAgZm9yICh2YXIga2V5IGluIG0pIHtcbiAgICAgICAgaWYgKCEoaW5kZXhPZi5jYWxsKG9yZGVyaW5nLCBrZXkpICE9PSAtMSAmJiAobVtrZXldID09IG51bGwgfHwgIWlzTmFOKG1ba2V5XSkpKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHVuaXRIYXNEZWNpbWFsID0gZmFsc2U7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcmRlcmluZy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAobVtvcmRlcmluZ1tpXV0pIHtcbiAgICAgICAgICAgIGlmICh1bml0SGFzRGVjaW1hbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gb25seSBhbGxvdyBub24taW50ZWdlcnMgZm9yIHNtYWxsZXN0IHVuaXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwYXJzZUZsb2F0KG1bb3JkZXJpbmdbaV1dKSAhPT0gdG9JbnQobVtvcmRlcmluZ1tpXV0pKSB7XG4gICAgICAgICAgICAgICAgdW5pdEhhc0RlY2ltYWwgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWQkMSgpIHtcbiAgICByZXR1cm4gdGhpcy5faXNWYWxpZDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlSW52YWxpZCQxKCkge1xuICAgIHJldHVybiBjcmVhdGVEdXJhdGlvbihOYU4pO1xufVxuXG5mdW5jdGlvbiBEdXJhdGlvbiAoZHVyYXRpb24pIHtcbiAgICB2YXIgbm9ybWFsaXplZElucHV0ID0gbm9ybWFsaXplT2JqZWN0VW5pdHMoZHVyYXRpb24pLFxuICAgICAgICB5ZWFycyA9IG5vcm1hbGl6ZWRJbnB1dC55ZWFyIHx8IDAsXG4gICAgICAgIHF1YXJ0ZXJzID0gbm9ybWFsaXplZElucHV0LnF1YXJ0ZXIgfHwgMCxcbiAgICAgICAgbW9udGhzID0gbm9ybWFsaXplZElucHV0Lm1vbnRoIHx8IDAsXG4gICAgICAgIHdlZWtzID0gbm9ybWFsaXplZElucHV0LndlZWsgfHwgMCxcbiAgICAgICAgZGF5cyA9IG5vcm1hbGl6ZWRJbnB1dC5kYXkgfHwgMCxcbiAgICAgICAgaG91cnMgPSBub3JtYWxpemVkSW5wdXQuaG91ciB8fCAwLFxuICAgICAgICBtaW51dGVzID0gbm9ybWFsaXplZElucHV0Lm1pbnV0ZSB8fCAwLFxuICAgICAgICBzZWNvbmRzID0gbm9ybWFsaXplZElucHV0LnNlY29uZCB8fCAwLFxuICAgICAgICBtaWxsaXNlY29uZHMgPSBub3JtYWxpemVkSW5wdXQubWlsbGlzZWNvbmQgfHwgMDtcblxuICAgIHRoaXMuX2lzVmFsaWQgPSBpc0R1cmF0aW9uVmFsaWQobm9ybWFsaXplZElucHV0KTtcblxuICAgIC8vIHJlcHJlc2VudGF0aW9uIGZvciBkYXRlQWRkUmVtb3ZlXG4gICAgdGhpcy5fbWlsbGlzZWNvbmRzID0gK21pbGxpc2Vjb25kcyArXG4gICAgICAgIHNlY29uZHMgKiAxZTMgKyAvLyAxMDAwXG4gICAgICAgIG1pbnV0ZXMgKiA2ZTQgKyAvLyAxMDAwICogNjBcbiAgICAgICAgaG91cnMgKiAxMDAwICogNjAgKiA2MDsgLy91c2luZyAxMDAwICogNjAgKiA2MCBpbnN0ZWFkIG9mIDM2ZTUgdG8gYXZvaWQgZmxvYXRpbmcgcG9pbnQgcm91bmRpbmcgZXJyb3JzIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8yOTc4XG4gICAgLy8gQmVjYXVzZSBvZiBkYXRlQWRkUmVtb3ZlIHRyZWF0cyAyNCBob3VycyBhcyBkaWZmZXJlbnQgZnJvbSBhXG4gICAgLy8gZGF5IHdoZW4gd29ya2luZyBhcm91bmQgRFNULCB3ZSBuZWVkIHRvIHN0b3JlIHRoZW0gc2VwYXJhdGVseVxuICAgIHRoaXMuX2RheXMgPSArZGF5cyArXG4gICAgICAgIHdlZWtzICogNztcbiAgICAvLyBJdCBpcyBpbXBvc3NpYmxlIHRvIHRyYW5zbGF0ZSBtb250aHMgaW50byBkYXlzIHdpdGhvdXQga25vd2luZ1xuICAgIC8vIHdoaWNoIG1vbnRocyB5b3UgYXJlIGFyZSB0YWxraW5nIGFib3V0LCBzbyB3ZSBoYXZlIHRvIHN0b3JlXG4gICAgLy8gaXQgc2VwYXJhdGVseS5cbiAgICB0aGlzLl9tb250aHMgPSArbW9udGhzICtcbiAgICAgICAgcXVhcnRlcnMgKiAzICtcbiAgICAgICAgeWVhcnMgKiAxMjtcblxuICAgIHRoaXMuX2RhdGEgPSB7fTtcblxuICAgIHRoaXMuX2xvY2FsZSA9IGdldExvY2FsZSgpO1xuXG4gICAgdGhpcy5fYnViYmxlKCk7XG59XG5cbmZ1bmN0aW9uIGlzRHVyYXRpb24gKG9iaikge1xuICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBEdXJhdGlvbjtcbn1cblxuZnVuY3Rpb24gYWJzUm91bmQgKG51bWJlcikge1xuICAgIGlmIChudW1iZXIgPCAwKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKC0xICogbnVtYmVyKSAqIC0xO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKG51bWJlcik7XG4gICAgfVxufVxuXG4vLyBGT1JNQVRUSU5HXG5cbmZ1bmN0aW9uIG9mZnNldCAodG9rZW4sIHNlcGFyYXRvcikge1xuICAgIGFkZEZvcm1hdFRva2VuKHRva2VuLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLnV0Y09mZnNldCgpO1xuICAgICAgICB2YXIgc2lnbiA9ICcrJztcbiAgICAgICAgaWYgKG9mZnNldCA8IDApIHtcbiAgICAgICAgICAgIG9mZnNldCA9IC1vZmZzZXQ7XG4gICAgICAgICAgICBzaWduID0gJy0nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaWduICsgemVyb0ZpbGwofn4ob2Zmc2V0IC8gNjApLCAyKSArIHNlcGFyYXRvciArIHplcm9GaWxsKH5+KG9mZnNldCkgJSA2MCwgMik7XG4gICAgfSk7XG59XG5cbm9mZnNldCgnWicsICc6Jyk7XG5vZmZzZXQoJ1paJywgJycpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ1onLCAgbWF0Y2hTaG9ydE9mZnNldCk7XG5hZGRSZWdleFRva2VuKCdaWicsIG1hdGNoU2hvcnRPZmZzZXQpO1xuYWRkUGFyc2VUb2tlbihbJ1onLCAnWlonXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgY29uZmlnLl91c2VVVEMgPSB0cnVlO1xuICAgIGNvbmZpZy5fdHptID0gb2Zmc2V0RnJvbVN0cmluZyhtYXRjaFNob3J0T2Zmc2V0LCBpbnB1dCk7XG59KTtcblxuLy8gSEVMUEVSU1xuXG4vLyB0aW1lem9uZSBjaHVua2VyXG4vLyAnKzEwOjAwJyA+IFsnMTAnLCAgJzAwJ11cbi8vICctMTUzMCcgID4gWyctMTUnLCAnMzAnXVxudmFyIGNodW5rT2Zmc2V0ID0gLyhbXFwrXFwtXXxcXGRcXGQpL2dpO1xuXG5mdW5jdGlvbiBvZmZzZXRGcm9tU3RyaW5nKG1hdGNoZXIsIHN0cmluZykge1xuICAgIHZhciBtYXRjaGVzID0gKHN0cmluZyB8fCAnJykubWF0Y2gobWF0Y2hlcik7XG5cbiAgICBpZiAobWF0Y2hlcyA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgY2h1bmsgICA9IG1hdGNoZXNbbWF0Y2hlcy5sZW5ndGggLSAxXSB8fCBbXTtcbiAgICB2YXIgcGFydHMgICA9IChjaHVuayArICcnKS5tYXRjaChjaHVua09mZnNldCkgfHwgWyctJywgMCwgMF07XG4gICAgdmFyIG1pbnV0ZXMgPSArKHBhcnRzWzFdICogNjApICsgdG9JbnQocGFydHNbMl0pO1xuXG4gICAgcmV0dXJuIG1pbnV0ZXMgPT09IDAgP1xuICAgICAgMCA6XG4gICAgICBwYXJ0c1swXSA9PT0gJysnID8gbWludXRlcyA6IC1taW51dGVzO1xufVxuXG4vLyBSZXR1cm4gYSBtb21lbnQgZnJvbSBpbnB1dCwgdGhhdCBpcyBsb2NhbC91dGMvem9uZSBlcXVpdmFsZW50IHRvIG1vZGVsLlxuZnVuY3Rpb24gY2xvbmVXaXRoT2Zmc2V0KGlucHV0LCBtb2RlbCkge1xuICAgIHZhciByZXMsIGRpZmY7XG4gICAgaWYgKG1vZGVsLl9pc1VUQykge1xuICAgICAgICByZXMgPSBtb2RlbC5jbG9uZSgpO1xuICAgICAgICBkaWZmID0gKGlzTW9tZW50KGlucHV0KSB8fCBpc0RhdGUoaW5wdXQpID8gaW5wdXQudmFsdWVPZigpIDogY3JlYXRlTG9jYWwoaW5wdXQpLnZhbHVlT2YoKSkgLSByZXMudmFsdWVPZigpO1xuICAgICAgICAvLyBVc2UgbG93LWxldmVsIGFwaSwgYmVjYXVzZSB0aGlzIGZuIGlzIGxvdy1sZXZlbCBhcGkuXG4gICAgICAgIHJlcy5fZC5zZXRUaW1lKHJlcy5fZC52YWx1ZU9mKCkgKyBkaWZmKTtcbiAgICAgICAgaG9va3MudXBkYXRlT2Zmc2V0KHJlcywgZmFsc2UpO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVMb2NhbChpbnB1dCkubG9jYWwoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldERhdGVPZmZzZXQgKG0pIHtcbiAgICAvLyBPbiBGaXJlZm94LjI0IERhdGUjZ2V0VGltZXpvbmVPZmZzZXQgcmV0dXJucyBhIGZsb2F0aW5nIHBvaW50LlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L3B1bGwvMTg3MVxuICAgIHJldHVybiAtTWF0aC5yb3VuZChtLl9kLmdldFRpbWV6b25lT2Zmc2V0KCkgLyAxNSkgKiAxNTtcbn1cblxuLy8gSE9PS1NcblxuLy8gVGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCB3aGVuZXZlciBhIG1vbWVudCBpcyBtdXRhdGVkLlxuLy8gSXQgaXMgaW50ZW5kZWQgdG8ga2VlcCB0aGUgb2Zmc2V0IGluIHN5bmMgd2l0aCB0aGUgdGltZXpvbmUuXG5ob29rcy51cGRhdGVPZmZzZXQgPSBmdW5jdGlvbiAoKSB7fTtcblxuLy8gTU9NRU5UU1xuXG4vLyBrZWVwTG9jYWxUaW1lID0gdHJ1ZSBtZWFucyBvbmx5IGNoYW5nZSB0aGUgdGltZXpvbmUsIHdpdGhvdXRcbi8vIGFmZmVjdGluZyB0aGUgbG9jYWwgaG91ci4gU28gNTozMToyNiArMDMwMCAtLVt1dGNPZmZzZXQoMiwgdHJ1ZSldLS0+XG4vLyA1OjMxOjI2ICswMjAwIEl0IGlzIHBvc3NpYmxlIHRoYXQgNTozMToyNiBkb2Vzbid0IGV4aXN0IHdpdGggb2Zmc2V0XG4vLyArMDIwMCwgc28gd2UgYWRqdXN0IHRoZSB0aW1lIGFzIG5lZWRlZCwgdG8gYmUgdmFsaWQuXG4vL1xuLy8gS2VlcGluZyB0aGUgdGltZSBhY3R1YWxseSBhZGRzL3N1YnRyYWN0cyAob25lIGhvdXIpXG4vLyBmcm9tIHRoZSBhY3R1YWwgcmVwcmVzZW50ZWQgdGltZS4gVGhhdCBpcyB3aHkgd2UgY2FsbCB1cGRhdGVPZmZzZXRcbi8vIGEgc2Vjb25kIHRpbWUuIEluIGNhc2UgaXQgd2FudHMgdXMgdG8gY2hhbmdlIHRoZSBvZmZzZXQgYWdhaW5cbi8vIF9jaGFuZ2VJblByb2dyZXNzID09IHRydWUgY2FzZSwgdGhlbiB3ZSBoYXZlIHRvIGFkanVzdCwgYmVjYXVzZVxuLy8gdGhlcmUgaXMgbm8gc3VjaCB0aW1lIGluIHRoZSBnaXZlbiB0aW1lem9uZS5cbmZ1bmN0aW9uIGdldFNldE9mZnNldCAoaW5wdXQsIGtlZXBMb2NhbFRpbWUsIGtlZXBNaW51dGVzKSB7XG4gICAgdmFyIG9mZnNldCA9IHRoaXMuX29mZnNldCB8fCAwLFxuICAgICAgICBsb2NhbEFkanVzdDtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiBpbnB1dCAhPSBudWxsID8gdGhpcyA6IE5hTjtcbiAgICB9XG4gICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlucHV0ID0gb2Zmc2V0RnJvbVN0cmluZyhtYXRjaFNob3J0T2Zmc2V0LCBpbnB1dCk7XG4gICAgICAgICAgICBpZiAoaW5wdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChNYXRoLmFicyhpbnB1dCkgPCAxNiAmJiAha2VlcE1pbnV0ZXMpIHtcbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQgKiA2MDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX2lzVVRDICYmIGtlZXBMb2NhbFRpbWUpIHtcbiAgICAgICAgICAgIGxvY2FsQWRqdXN0ID0gZ2V0RGF0ZU9mZnNldCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9vZmZzZXQgPSBpbnB1dDtcbiAgICAgICAgdGhpcy5faXNVVEMgPSB0cnVlO1xuICAgICAgICBpZiAobG9jYWxBZGp1c3QgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5hZGQobG9jYWxBZGp1c3QsICdtJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9mZnNldCAhPT0gaW5wdXQpIHtcbiAgICAgICAgICAgIGlmICgha2VlcExvY2FsVGltZSB8fCB0aGlzLl9jaGFuZ2VJblByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgYWRkU3VidHJhY3QodGhpcywgY3JlYXRlRHVyYXRpb24oaW5wdXQgLSBvZmZzZXQsICdtJyksIDEsIGZhbHNlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jaGFuZ2VJblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBob29rcy51cGRhdGVPZmZzZXQodGhpcywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcyA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzVVRDID8gb2Zmc2V0IDogZ2V0RGF0ZU9mZnNldCh0aGlzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFNldFpvbmUgKGlucHV0LCBrZWVwTG9jYWxUaW1lKSB7XG4gICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlucHV0ID0gLWlucHV0O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51dGNPZmZzZXQoaW5wdXQsIGtlZXBMb2NhbFRpbWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAtdGhpcy51dGNPZmZzZXQoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNldE9mZnNldFRvVVRDIChrZWVwTG9jYWxUaW1lKSB7XG4gICAgcmV0dXJuIHRoaXMudXRjT2Zmc2V0KDAsIGtlZXBMb2NhbFRpbWUpO1xufVxuXG5mdW5jdGlvbiBzZXRPZmZzZXRUb0xvY2FsIChrZWVwTG9jYWxUaW1lKSB7XG4gICAgaWYgKHRoaXMuX2lzVVRDKSB7XG4gICAgICAgIHRoaXMudXRjT2Zmc2V0KDAsIGtlZXBMb2NhbFRpbWUpO1xuICAgICAgICB0aGlzLl9pc1VUQyA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChrZWVwTG9jYWxUaW1lKSB7XG4gICAgICAgICAgICB0aGlzLnN1YnRyYWN0KGdldERhdGVPZmZzZXQodGhpcyksICdtJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIHNldE9mZnNldFRvUGFyc2VkT2Zmc2V0ICgpIHtcbiAgICBpZiAodGhpcy5fdHptICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy51dGNPZmZzZXQodGhpcy5fdHptLCBmYWxzZSwgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5faSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdmFyIHRab25lID0gb2Zmc2V0RnJvbVN0cmluZyhtYXRjaE9mZnNldCwgdGhpcy5faSk7XG4gICAgICAgIGlmICh0Wm9uZSAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnV0Y09mZnNldCh0Wm9uZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnV0Y09mZnNldCgwLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gaGFzQWxpZ25lZEhvdXJPZmZzZXQgKGlucHV0KSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlucHV0ID0gaW5wdXQgPyBjcmVhdGVMb2NhbChpbnB1dCkudXRjT2Zmc2V0KCkgOiAwO1xuXG4gICAgcmV0dXJuICh0aGlzLnV0Y09mZnNldCgpIC0gaW5wdXQpICUgNjAgPT09IDA7XG59XG5cbmZ1bmN0aW9uIGlzRGF5bGlnaHRTYXZpbmdUaW1lICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgICB0aGlzLnV0Y09mZnNldCgpID4gdGhpcy5jbG9uZSgpLm1vbnRoKDApLnV0Y09mZnNldCgpIHx8XG4gICAgICAgIHRoaXMudXRjT2Zmc2V0KCkgPiB0aGlzLmNsb25lKCkubW9udGgoNSkudXRjT2Zmc2V0KClcbiAgICApO1xufVxuXG5mdW5jdGlvbiBpc0RheWxpZ2h0U2F2aW5nVGltZVNoaWZ0ZWQgKCkge1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5faXNEU1RTaGlmdGVkKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNEU1RTaGlmdGVkO1xuICAgIH1cblxuICAgIHZhciBjID0ge307XG5cbiAgICBjb3B5Q29uZmlnKGMsIHRoaXMpO1xuICAgIGMgPSBwcmVwYXJlQ29uZmlnKGMpO1xuXG4gICAgaWYgKGMuX2EpIHtcbiAgICAgICAgdmFyIG90aGVyID0gYy5faXNVVEMgPyBjcmVhdGVVVEMoYy5fYSkgOiBjcmVhdGVMb2NhbChjLl9hKTtcbiAgICAgICAgdGhpcy5faXNEU1RTaGlmdGVkID0gdGhpcy5pc1ZhbGlkKCkgJiZcbiAgICAgICAgICAgIGNvbXBhcmVBcnJheXMoYy5fYSwgb3RoZXIudG9BcnJheSgpKSA+IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5faXNEU1RTaGlmdGVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2lzRFNUU2hpZnRlZDtcbn1cblxuZnVuY3Rpb24gaXNMb2NhbCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCgpID8gIXRoaXMuX2lzVVRDIDogZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzVXRjT2Zmc2V0ICgpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgPyB0aGlzLl9pc1VUQyA6IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc1V0YyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCgpID8gdGhpcy5faXNVVEMgJiYgdGhpcy5fb2Zmc2V0ID09PSAwIDogZmFsc2U7XG59XG5cbi8vIEFTUC5ORVQganNvbiBkYXRlIGZvcm1hdCByZWdleFxudmFyIGFzcE5ldFJlZ2V4ID0gL14oXFwtfFxcKyk/KD86KFxcZCopWy4gXSk/KFxcZCspXFw6KFxcZCspKD86XFw6KFxcZCspKFxcLlxcZCopPyk/JC87XG5cbi8vIGZyb20gaHR0cDovL2RvY3MuY2xvc3VyZS1saWJyYXJ5Lmdvb2dsZWNvZGUuY29tL2dpdC9jbG9zdXJlX2dvb2dfZGF0ZV9kYXRlLmpzLnNvdXJjZS5odG1sXG4vLyBzb21ld2hhdCBtb3JlIGluIGxpbmUgd2l0aCA0LjQuMy4yIDIwMDQgc3BlYywgYnV0IGFsbG93cyBkZWNpbWFsIGFueXdoZXJlXG4vLyBhbmQgZnVydGhlciBtb2RpZmllZCB0byBhbGxvdyBmb3Igc3RyaW5ncyBjb250YWluaW5nIGJvdGggd2VlayBhbmQgZGF5XG52YXIgaXNvUmVnZXggPSAvXigtfFxcKyk/UCg/OihbLStdP1swLTksLl0qKVkpPyg/OihbLStdP1swLTksLl0qKU0pPyg/OihbLStdP1swLTksLl0qKVcpPyg/OihbLStdP1swLTksLl0qKUQpPyg/OlQoPzooWy0rXT9bMC05LC5dKilIKT8oPzooWy0rXT9bMC05LC5dKilNKT8oPzooWy0rXT9bMC05LC5dKilTKT8pPyQvO1xuXG5mdW5jdGlvbiBjcmVhdGVEdXJhdGlvbiAoaW5wdXQsIGtleSkge1xuICAgIHZhciBkdXJhdGlvbiA9IGlucHV0LFxuICAgICAgICAvLyBtYXRjaGluZyBhZ2FpbnN0IHJlZ2V4cCBpcyBleHBlbnNpdmUsIGRvIGl0IG9uIGRlbWFuZFxuICAgICAgICBtYXRjaCA9IG51bGwsXG4gICAgICAgIHNpZ24sXG4gICAgICAgIHJldCxcbiAgICAgICAgZGlmZlJlcztcblxuICAgIGlmIChpc0R1cmF0aW9uKGlucHV0KSkge1xuICAgICAgICBkdXJhdGlvbiA9IHtcbiAgICAgICAgICAgIG1zIDogaW5wdXQuX21pbGxpc2Vjb25kcyxcbiAgICAgICAgICAgIGQgIDogaW5wdXQuX2RheXMsXG4gICAgICAgICAgICBNICA6IGlucHV0Ll9tb250aHNcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKGlzTnVtYmVyKGlucHV0KSkge1xuICAgICAgICBkdXJhdGlvbiA9IHt9O1xuICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICBkdXJhdGlvbltrZXldID0gaW5wdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkdXJhdGlvbi5taWxsaXNlY29uZHMgPSBpbnB1dDtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoISEobWF0Y2ggPSBhc3BOZXRSZWdleC5leGVjKGlucHV0KSkpIHtcbiAgICAgICAgc2lnbiA9IChtYXRjaFsxXSA9PT0gJy0nKSA/IC0xIDogMTtcbiAgICAgICAgZHVyYXRpb24gPSB7XG4gICAgICAgICAgICB5ICA6IDAsXG4gICAgICAgICAgICBkICA6IHRvSW50KG1hdGNoW0RBVEVdKSAgICAgICAgICAgICAgICAgICAgICAgICAqIHNpZ24sXG4gICAgICAgICAgICBoICA6IHRvSW50KG1hdGNoW0hPVVJdKSAgICAgICAgICAgICAgICAgICAgICAgICAqIHNpZ24sXG4gICAgICAgICAgICBtICA6IHRvSW50KG1hdGNoW01JTlVURV0pICAgICAgICAgICAgICAgICAgICAgICAqIHNpZ24sXG4gICAgICAgICAgICBzICA6IHRvSW50KG1hdGNoW1NFQ09ORF0pICAgICAgICAgICAgICAgICAgICAgICAqIHNpZ24sXG4gICAgICAgICAgICBtcyA6IHRvSW50KGFic1JvdW5kKG1hdGNoW01JTExJU0VDT05EXSAqIDEwMDApKSAqIHNpZ24gLy8gdGhlIG1pbGxpc2Vjb25kIGRlY2ltYWwgcG9pbnQgaXMgaW5jbHVkZWQgaW4gdGhlIG1hdGNoXG4gICAgICAgIH07XG4gICAgfSBlbHNlIGlmICghIShtYXRjaCA9IGlzb1JlZ2V4LmV4ZWMoaW5wdXQpKSkge1xuICAgICAgICBzaWduID0gKG1hdGNoWzFdID09PSAnLScpID8gLTEgOiAobWF0Y2hbMV0gPT09ICcrJykgPyAxIDogMTtcbiAgICAgICAgZHVyYXRpb24gPSB7XG4gICAgICAgICAgICB5IDogcGFyc2VJc28obWF0Y2hbMl0sIHNpZ24pLFxuICAgICAgICAgICAgTSA6IHBhcnNlSXNvKG1hdGNoWzNdLCBzaWduKSxcbiAgICAgICAgICAgIHcgOiBwYXJzZUlzbyhtYXRjaFs0XSwgc2lnbiksXG4gICAgICAgICAgICBkIDogcGFyc2VJc28obWF0Y2hbNV0sIHNpZ24pLFxuICAgICAgICAgICAgaCA6IHBhcnNlSXNvKG1hdGNoWzZdLCBzaWduKSxcbiAgICAgICAgICAgIG0gOiBwYXJzZUlzbyhtYXRjaFs3XSwgc2lnbiksXG4gICAgICAgICAgICBzIDogcGFyc2VJc28obWF0Y2hbOF0sIHNpZ24pXG4gICAgICAgIH07XG4gICAgfSBlbHNlIGlmIChkdXJhdGlvbiA9PSBudWxsKSB7Ly8gY2hlY2tzIGZvciBudWxsIG9yIHVuZGVmaW5lZFxuICAgICAgICBkdXJhdGlvbiA9IHt9O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGR1cmF0aW9uID09PSAnb2JqZWN0JyAmJiAoJ2Zyb20nIGluIGR1cmF0aW9uIHx8ICd0bycgaW4gZHVyYXRpb24pKSB7XG4gICAgICAgIGRpZmZSZXMgPSBtb21lbnRzRGlmZmVyZW5jZShjcmVhdGVMb2NhbChkdXJhdGlvbi5mcm9tKSwgY3JlYXRlTG9jYWwoZHVyYXRpb24udG8pKTtcblxuICAgICAgICBkdXJhdGlvbiA9IHt9O1xuICAgICAgICBkdXJhdGlvbi5tcyA9IGRpZmZSZXMubWlsbGlzZWNvbmRzO1xuICAgICAgICBkdXJhdGlvbi5NID0gZGlmZlJlcy5tb250aHM7XG4gICAgfVxuXG4gICAgcmV0ID0gbmV3IER1cmF0aW9uKGR1cmF0aW9uKTtcblxuICAgIGlmIChpc0R1cmF0aW9uKGlucHV0KSAmJiBoYXNPd25Qcm9wKGlucHV0LCAnX2xvY2FsZScpKSB7XG4gICAgICAgIHJldC5fbG9jYWxlID0gaW5wdXQuX2xvY2FsZTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xufVxuXG5jcmVhdGVEdXJhdGlvbi5mbiA9IER1cmF0aW9uLnByb3RvdHlwZTtcbmNyZWF0ZUR1cmF0aW9uLmludmFsaWQgPSBjcmVhdGVJbnZhbGlkJDE7XG5cbmZ1bmN0aW9uIHBhcnNlSXNvIChpbnAsIHNpZ24pIHtcbiAgICAvLyBXZSdkIG5vcm1hbGx5IHVzZSB+fmlucCBmb3IgdGhpcywgYnV0IHVuZm9ydHVuYXRlbHkgaXQgYWxzb1xuICAgIC8vIGNvbnZlcnRzIGZsb2F0cyB0byBpbnRzLlxuICAgIC8vIGlucCBtYXkgYmUgdW5kZWZpbmVkLCBzbyBjYXJlZnVsIGNhbGxpbmcgcmVwbGFjZSBvbiBpdC5cbiAgICB2YXIgcmVzID0gaW5wICYmIHBhcnNlRmxvYXQoaW5wLnJlcGxhY2UoJywnLCAnLicpKTtcbiAgICAvLyBhcHBseSBzaWduIHdoaWxlIHdlJ3JlIGF0IGl0XG4gICAgcmV0dXJuIChpc05hTihyZXMpID8gMCA6IHJlcykgKiBzaWduO1xufVxuXG5mdW5jdGlvbiBwb3NpdGl2ZU1vbWVudHNEaWZmZXJlbmNlKGJhc2UsIG90aGVyKSB7XG4gICAgdmFyIHJlcyA9IHttaWxsaXNlY29uZHM6IDAsIG1vbnRoczogMH07XG5cbiAgICByZXMubW9udGhzID0gb3RoZXIubW9udGgoKSAtIGJhc2UubW9udGgoKSArXG4gICAgICAgIChvdGhlci55ZWFyKCkgLSBiYXNlLnllYXIoKSkgKiAxMjtcbiAgICBpZiAoYmFzZS5jbG9uZSgpLmFkZChyZXMubW9udGhzLCAnTScpLmlzQWZ0ZXIob3RoZXIpKSB7XG4gICAgICAgIC0tcmVzLm1vbnRocztcbiAgICB9XG5cbiAgICByZXMubWlsbGlzZWNvbmRzID0gK290aGVyIC0gKyhiYXNlLmNsb25lKCkuYWRkKHJlcy5tb250aHMsICdNJykpO1xuXG4gICAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gbW9tZW50c0RpZmZlcmVuY2UoYmFzZSwgb3RoZXIpIHtcbiAgICB2YXIgcmVzO1xuICAgIGlmICghKGJhc2UuaXNWYWxpZCgpICYmIG90aGVyLmlzVmFsaWQoKSkpIHtcbiAgICAgICAgcmV0dXJuIHttaWxsaXNlY29uZHM6IDAsIG1vbnRoczogMH07XG4gICAgfVxuXG4gICAgb3RoZXIgPSBjbG9uZVdpdGhPZmZzZXQob3RoZXIsIGJhc2UpO1xuICAgIGlmIChiYXNlLmlzQmVmb3JlKG90aGVyKSkge1xuICAgICAgICByZXMgPSBwb3NpdGl2ZU1vbWVudHNEaWZmZXJlbmNlKGJhc2UsIG90aGVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXMgPSBwb3NpdGl2ZU1vbWVudHNEaWZmZXJlbmNlKG90aGVyLCBiYXNlKTtcbiAgICAgICAgcmVzLm1pbGxpc2Vjb25kcyA9IC1yZXMubWlsbGlzZWNvbmRzO1xuICAgICAgICByZXMubW9udGhzID0gLXJlcy5tb250aHM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gVE9ETzogcmVtb3ZlICduYW1lJyBhcmcgYWZ0ZXIgZGVwcmVjYXRpb24gaXMgcmVtb3ZlZFxuZnVuY3Rpb24gY3JlYXRlQWRkZXIoZGlyZWN0aW9uLCBuYW1lKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWwsIHBlcmlvZCkge1xuICAgICAgICB2YXIgZHVyLCB0bXA7XG4gICAgICAgIC8vaW52ZXJ0IHRoZSBhcmd1bWVudHMsIGJ1dCBjb21wbGFpbiBhYm91dCBpdFxuICAgICAgICBpZiAocGVyaW9kICE9PSBudWxsICYmICFpc05hTigrcGVyaW9kKSkge1xuICAgICAgICAgICAgZGVwcmVjYXRlU2ltcGxlKG5hbWUsICdtb21lbnQoKS4nICsgbmFtZSAgKyAnKHBlcmlvZCwgbnVtYmVyKSBpcyBkZXByZWNhdGVkLiBQbGVhc2UgdXNlIG1vbWVudCgpLicgKyBuYW1lICsgJyhudW1iZXIsIHBlcmlvZCkuICcgK1xuICAgICAgICAgICAgJ1NlZSBodHRwOi8vbW9tZW50anMuY29tL2d1aWRlcy8jL3dhcm5pbmdzL2FkZC1pbnZlcnRlZC1wYXJhbS8gZm9yIG1vcmUgaW5mby4nKTtcbiAgICAgICAgICAgIHRtcCA9IHZhbDsgdmFsID0gcGVyaW9kOyBwZXJpb2QgPSB0bXA7XG4gICAgICAgIH1cblxuICAgICAgICB2YWwgPSB0eXBlb2YgdmFsID09PSAnc3RyaW5nJyA/ICt2YWwgOiB2YWw7XG4gICAgICAgIGR1ciA9IGNyZWF0ZUR1cmF0aW9uKHZhbCwgcGVyaW9kKTtcbiAgICAgICAgYWRkU3VidHJhY3QodGhpcywgZHVyLCBkaXJlY3Rpb24pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBhZGRTdWJ0cmFjdCAobW9tLCBkdXJhdGlvbiwgaXNBZGRpbmcsIHVwZGF0ZU9mZnNldCkge1xuICAgIHZhciBtaWxsaXNlY29uZHMgPSBkdXJhdGlvbi5fbWlsbGlzZWNvbmRzLFxuICAgICAgICBkYXlzID0gYWJzUm91bmQoZHVyYXRpb24uX2RheXMpLFxuICAgICAgICBtb250aHMgPSBhYnNSb3VuZChkdXJhdGlvbi5fbW9udGhzKTtcblxuICAgIGlmICghbW9tLmlzVmFsaWQoKSkge1xuICAgICAgICAvLyBObyBvcFxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdXBkYXRlT2Zmc2V0ID0gdXBkYXRlT2Zmc2V0ID09IG51bGwgPyB0cnVlIDogdXBkYXRlT2Zmc2V0O1xuXG4gICAgaWYgKG1vbnRocykge1xuICAgICAgICBzZXRNb250aChtb20sIGdldChtb20sICdNb250aCcpICsgbW9udGhzICogaXNBZGRpbmcpO1xuICAgIH1cbiAgICBpZiAoZGF5cykge1xuICAgICAgICBzZXQkMShtb20sICdEYXRlJywgZ2V0KG1vbSwgJ0RhdGUnKSArIGRheXMgKiBpc0FkZGluZyk7XG4gICAgfVxuICAgIGlmIChtaWxsaXNlY29uZHMpIHtcbiAgICAgICAgbW9tLl9kLnNldFRpbWUobW9tLl9kLnZhbHVlT2YoKSArIG1pbGxpc2Vjb25kcyAqIGlzQWRkaW5nKTtcbiAgICB9XG4gICAgaWYgKHVwZGF0ZU9mZnNldCkge1xuICAgICAgICBob29rcy51cGRhdGVPZmZzZXQobW9tLCBkYXlzIHx8IG1vbnRocyk7XG4gICAgfVxufVxuXG52YXIgYWRkICAgICAgPSBjcmVhdGVBZGRlcigxLCAnYWRkJyk7XG52YXIgc3VidHJhY3QgPSBjcmVhdGVBZGRlcigtMSwgJ3N1YnRyYWN0Jyk7XG5cbmZ1bmN0aW9uIGdldENhbGVuZGFyRm9ybWF0KG15TW9tZW50LCBub3cpIHtcbiAgICB2YXIgZGlmZiA9IG15TW9tZW50LmRpZmYobm93LCAnZGF5cycsIHRydWUpO1xuICAgIHJldHVybiBkaWZmIDwgLTYgPyAnc2FtZUVsc2UnIDpcbiAgICAgICAgICAgIGRpZmYgPCAtMSA/ICdsYXN0V2VlaycgOlxuICAgICAgICAgICAgZGlmZiA8IDAgPyAnbGFzdERheScgOlxuICAgICAgICAgICAgZGlmZiA8IDEgPyAnc2FtZURheScgOlxuICAgICAgICAgICAgZGlmZiA8IDIgPyAnbmV4dERheScgOlxuICAgICAgICAgICAgZGlmZiA8IDcgPyAnbmV4dFdlZWsnIDogJ3NhbWVFbHNlJztcbn1cblxuZnVuY3Rpb24gY2FsZW5kYXIkMSAodGltZSwgZm9ybWF0cykge1xuICAgIC8vIFdlIHdhbnQgdG8gY29tcGFyZSB0aGUgc3RhcnQgb2YgdG9kYXksIHZzIHRoaXMuXG4gICAgLy8gR2V0dGluZyBzdGFydC1vZi10b2RheSBkZXBlbmRzIG9uIHdoZXRoZXIgd2UncmUgbG9jYWwvdXRjL29mZnNldCBvciBub3QuXG4gICAgdmFyIG5vdyA9IHRpbWUgfHwgY3JlYXRlTG9jYWwoKSxcbiAgICAgICAgc29kID0gY2xvbmVXaXRoT2Zmc2V0KG5vdywgdGhpcykuc3RhcnRPZignZGF5JyksXG4gICAgICAgIGZvcm1hdCA9IGhvb2tzLmNhbGVuZGFyRm9ybWF0KHRoaXMsIHNvZCkgfHwgJ3NhbWVFbHNlJztcblxuICAgIHZhciBvdXRwdXQgPSBmb3JtYXRzICYmIChpc0Z1bmN0aW9uKGZvcm1hdHNbZm9ybWF0XSkgPyBmb3JtYXRzW2Zvcm1hdF0uY2FsbCh0aGlzLCBub3cpIDogZm9ybWF0c1tmb3JtYXRdKTtcblxuICAgIHJldHVybiB0aGlzLmZvcm1hdChvdXRwdXQgfHwgdGhpcy5sb2NhbGVEYXRhKCkuY2FsZW5kYXIoZm9ybWF0LCB0aGlzLCBjcmVhdGVMb2NhbChub3cpKSk7XG59XG5cbmZ1bmN0aW9uIGNsb25lICgpIHtcbiAgICByZXR1cm4gbmV3IE1vbWVudCh0aGlzKTtcbn1cblxuZnVuY3Rpb24gaXNBZnRlciAoaW5wdXQsIHVuaXRzKSB7XG4gICAgdmFyIGxvY2FsSW5wdXQgPSBpc01vbWVudChpbnB1dCkgPyBpbnB1dCA6IGNyZWF0ZUxvY2FsKGlucHV0KTtcbiAgICBpZiAoISh0aGlzLmlzVmFsaWQoKSAmJiBsb2NhbElucHV0LmlzVmFsaWQoKSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKCFpc1VuZGVmaW5lZCh1bml0cykgPyB1bml0cyA6ICdtaWxsaXNlY29uZCcpO1xuICAgIGlmICh1bml0cyA9PT0gJ21pbGxpc2Vjb25kJykge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZU9mKCkgPiBsb2NhbElucHV0LnZhbHVlT2YoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbG9jYWxJbnB1dC52YWx1ZU9mKCkgPCB0aGlzLmNsb25lKCkuc3RhcnRPZih1bml0cykudmFsdWVPZigpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNCZWZvcmUgKGlucHV0LCB1bml0cykge1xuICAgIHZhciBsb2NhbElucHV0ID0gaXNNb21lbnQoaW5wdXQpID8gaW5wdXQgOiBjcmVhdGVMb2NhbChpbnB1dCk7XG4gICAgaWYgKCEodGhpcy5pc1ZhbGlkKCkgJiYgbG9jYWxJbnB1dC5pc1ZhbGlkKCkpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyghaXNVbmRlZmluZWQodW5pdHMpID8gdW5pdHMgOiAnbWlsbGlzZWNvbmQnKTtcbiAgICBpZiAodW5pdHMgPT09ICdtaWxsaXNlY29uZCcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVPZigpIDwgbG9jYWxJbnB1dC52YWx1ZU9mKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xvbmUoKS5lbmRPZih1bml0cykudmFsdWVPZigpIDwgbG9jYWxJbnB1dC52YWx1ZU9mKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0JldHdlZW4gKGZyb20sIHRvLCB1bml0cywgaW5jbHVzaXZpdHkpIHtcbiAgICBpbmNsdXNpdml0eSA9IGluY2x1c2l2aXR5IHx8ICcoKSc7XG4gICAgcmV0dXJuIChpbmNsdXNpdml0eVswXSA9PT0gJygnID8gdGhpcy5pc0FmdGVyKGZyb20sIHVuaXRzKSA6ICF0aGlzLmlzQmVmb3JlKGZyb20sIHVuaXRzKSkgJiZcbiAgICAgICAgKGluY2x1c2l2aXR5WzFdID09PSAnKScgPyB0aGlzLmlzQmVmb3JlKHRvLCB1bml0cykgOiAhdGhpcy5pc0FmdGVyKHRvLCB1bml0cykpO1xufVxuXG5mdW5jdGlvbiBpc1NhbWUgKGlucHV0LCB1bml0cykge1xuICAgIHZhciBsb2NhbElucHV0ID0gaXNNb21lbnQoaW5wdXQpID8gaW5wdXQgOiBjcmVhdGVMb2NhbChpbnB1dCksXG4gICAgICAgIGlucHV0TXM7XG4gICAgaWYgKCEodGhpcy5pc1ZhbGlkKCkgJiYgbG9jYWxJbnB1dC5pc1ZhbGlkKCkpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyB8fCAnbWlsbGlzZWNvbmQnKTtcbiAgICBpZiAodW5pdHMgPT09ICdtaWxsaXNlY29uZCcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVPZigpID09PSBsb2NhbElucHV0LnZhbHVlT2YoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpbnB1dE1zID0gbG9jYWxJbnB1dC52YWx1ZU9mKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmNsb25lKCkuc3RhcnRPZih1bml0cykudmFsdWVPZigpIDw9IGlucHV0TXMgJiYgaW5wdXRNcyA8PSB0aGlzLmNsb25lKCkuZW5kT2YodW5pdHMpLnZhbHVlT2YoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzU2FtZU9yQWZ0ZXIgKGlucHV0LCB1bml0cykge1xuICAgIHJldHVybiB0aGlzLmlzU2FtZShpbnB1dCwgdW5pdHMpIHx8IHRoaXMuaXNBZnRlcihpbnB1dCx1bml0cyk7XG59XG5cbmZ1bmN0aW9uIGlzU2FtZU9yQmVmb3JlIChpbnB1dCwgdW5pdHMpIHtcbiAgICByZXR1cm4gdGhpcy5pc1NhbWUoaW5wdXQsIHVuaXRzKSB8fCB0aGlzLmlzQmVmb3JlKGlucHV0LHVuaXRzKTtcbn1cblxuZnVuY3Rpb24gZGlmZiAoaW5wdXQsIHVuaXRzLCBhc0Zsb2F0KSB7XG4gICAgdmFyIHRoYXQsXG4gICAgICAgIHpvbmVEZWx0YSxcbiAgICAgICAgZGVsdGEsIG91dHB1dDtcblxuICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIE5hTjtcbiAgICB9XG5cbiAgICB0aGF0ID0gY2xvbmVXaXRoT2Zmc2V0KGlucHV0LCB0aGlzKTtcblxuICAgIGlmICghdGhhdC5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIE5hTjtcbiAgICB9XG5cbiAgICB6b25lRGVsdGEgPSAodGhhdC51dGNPZmZzZXQoKSAtIHRoaXMudXRjT2Zmc2V0KCkpICogNmU0O1xuXG4gICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG5cbiAgICBzd2l0Y2ggKHVuaXRzKSB7XG4gICAgICAgIGNhc2UgJ3llYXInOiBvdXRwdXQgPSBtb250aERpZmYodGhpcywgdGhhdCkgLyAxMjsgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21vbnRoJzogb3V0cHV0ID0gbW9udGhEaWZmKHRoaXMsIHRoYXQpOyBicmVhaztcbiAgICAgICAgY2FzZSAncXVhcnRlcic6IG91dHB1dCA9IG1vbnRoRGlmZih0aGlzLCB0aGF0KSAvIDM7IGJyZWFrO1xuICAgICAgICBjYXNlICdzZWNvbmQnOiBvdXRwdXQgPSAodGhpcyAtIHRoYXQpIC8gMWUzOyBicmVhazsgLy8gMTAwMFxuICAgICAgICBjYXNlICdtaW51dGUnOiBvdXRwdXQgPSAodGhpcyAtIHRoYXQpIC8gNmU0OyBicmVhazsgLy8gMTAwMCAqIDYwXG4gICAgICAgIGNhc2UgJ2hvdXInOiBvdXRwdXQgPSAodGhpcyAtIHRoYXQpIC8gMzZlNTsgYnJlYWs7IC8vIDEwMDAgKiA2MCAqIDYwXG4gICAgICAgIGNhc2UgJ2RheSc6IG91dHB1dCA9ICh0aGlzIC0gdGhhdCAtIHpvbmVEZWx0YSkgLyA4NjRlNTsgYnJlYWs7IC8vIDEwMDAgKiA2MCAqIDYwICogMjQsIG5lZ2F0ZSBkc3RcbiAgICAgICAgY2FzZSAnd2Vlayc6IG91dHB1dCA9ICh0aGlzIC0gdGhhdCAtIHpvbmVEZWx0YSkgLyA2MDQ4ZTU7IGJyZWFrOyAvLyAxMDAwICogNjAgKiA2MCAqIDI0ICogNywgbmVnYXRlIGRzdFxuICAgICAgICBkZWZhdWx0OiBvdXRwdXQgPSB0aGlzIC0gdGhhdDtcbiAgICB9XG5cbiAgICByZXR1cm4gYXNGbG9hdCA/IG91dHB1dCA6IGFic0Zsb29yKG91dHB1dCk7XG59XG5cbmZ1bmN0aW9uIG1vbnRoRGlmZiAoYSwgYikge1xuICAgIC8vIGRpZmZlcmVuY2UgaW4gbW9udGhzXG4gICAgdmFyIHdob2xlTW9udGhEaWZmID0gKChiLnllYXIoKSAtIGEueWVhcigpKSAqIDEyKSArIChiLm1vbnRoKCkgLSBhLm1vbnRoKCkpLFxuICAgICAgICAvLyBiIGlzIGluIChhbmNob3IgLSAxIG1vbnRoLCBhbmNob3IgKyAxIG1vbnRoKVxuICAgICAgICBhbmNob3IgPSBhLmNsb25lKCkuYWRkKHdob2xlTW9udGhEaWZmLCAnbW9udGhzJyksXG4gICAgICAgIGFuY2hvcjIsIGFkanVzdDtcblxuICAgIGlmIChiIC0gYW5jaG9yIDwgMCkge1xuICAgICAgICBhbmNob3IyID0gYS5jbG9uZSgpLmFkZCh3aG9sZU1vbnRoRGlmZiAtIDEsICdtb250aHMnKTtcbiAgICAgICAgLy8gbGluZWFyIGFjcm9zcyB0aGUgbW9udGhcbiAgICAgICAgYWRqdXN0ID0gKGIgLSBhbmNob3IpIC8gKGFuY2hvciAtIGFuY2hvcjIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGFuY2hvcjIgPSBhLmNsb25lKCkuYWRkKHdob2xlTW9udGhEaWZmICsgMSwgJ21vbnRocycpO1xuICAgICAgICAvLyBsaW5lYXIgYWNyb3NzIHRoZSBtb250aFxuICAgICAgICBhZGp1c3QgPSAoYiAtIGFuY2hvcikgLyAoYW5jaG9yMiAtIGFuY2hvcik7XG4gICAgfVxuXG4gICAgLy9jaGVjayBmb3IgbmVnYXRpdmUgemVybywgcmV0dXJuIHplcm8gaWYgbmVnYXRpdmUgemVyb1xuICAgIHJldHVybiAtKHdob2xlTW9udGhEaWZmICsgYWRqdXN0KSB8fCAwO1xufVxuXG5ob29rcy5kZWZhdWx0Rm9ybWF0ID0gJ1lZWVktTU0tRERUSEg6bW06c3NaJztcbmhvb2tzLmRlZmF1bHRGb3JtYXRVdGMgPSAnWVlZWS1NTS1ERFRISDptbTpzc1taXSc7XG5cbmZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gdGhpcy5jbG9uZSgpLmxvY2FsZSgnZW4nKS5mb3JtYXQoJ2RkZCBNTU0gREQgWVlZWSBISDptbTpzcyBbR01UXVpaJyk7XG59XG5cbmZ1bmN0aW9uIHRvSVNPU3RyaW5nKCkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBtID0gdGhpcy5jbG9uZSgpLnV0YygpO1xuICAgIGlmIChtLnllYXIoKSA8IDAgfHwgbS55ZWFyKCkgPiA5OTk5KSB7XG4gICAgICAgIHJldHVybiBmb3JtYXRNb21lbnQobSwgJ1lZWVlZWS1NTS1ERFtUXUhIOm1tOnNzLlNTU1taXScpO1xuICAgIH1cbiAgICBpZiAoaXNGdW5jdGlvbihEYXRlLnByb3RvdHlwZS50b0lTT1N0cmluZykpIHtcbiAgICAgICAgLy8gbmF0aXZlIGltcGxlbWVudGF0aW9uIGlzIH41MHggZmFzdGVyLCB1c2UgaXQgd2hlbiB3ZSBjYW5cbiAgICAgICAgcmV0dXJuIHRoaXMudG9EYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICB9XG4gICAgcmV0dXJuIGZvcm1hdE1vbWVudChtLCAnWVlZWS1NTS1ERFtUXUhIOm1tOnNzLlNTU1taXScpO1xufVxuXG4vKipcbiAqIFJldHVybiBhIGh1bWFuIHJlYWRhYmxlIHJlcHJlc2VudGF0aW9uIG9mIGEgbW9tZW50IHRoYXQgY2FuXG4gKiBhbHNvIGJlIGV2YWx1YXRlZCB0byBnZXQgYSBuZXcgbW9tZW50IHdoaWNoIGlzIHRoZSBzYW1lXG4gKlxuICogQGxpbmsgaHR0cHM6Ly9ub2RlanMub3JnL2Rpc3QvbGF0ZXN0L2RvY3MvYXBpL3V0aWwuaHRtbCN1dGlsX2N1c3RvbV9pbnNwZWN0X2Z1bmN0aW9uX29uX29iamVjdHNcbiAqL1xuZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gJ21vbWVudC5pbnZhbGlkKC8qICcgKyB0aGlzLl9pICsgJyAqLyknO1xuICAgIH1cbiAgICB2YXIgZnVuYyA9ICdtb21lbnQnO1xuICAgIHZhciB6b25lID0gJyc7XG4gICAgaWYgKCF0aGlzLmlzTG9jYWwoKSkge1xuICAgICAgICBmdW5jID0gdGhpcy51dGNPZmZzZXQoKSA9PT0gMCA/ICdtb21lbnQudXRjJyA6ICdtb21lbnQucGFyc2Vab25lJztcbiAgICAgICAgem9uZSA9ICdaJztcbiAgICB9XG4gICAgdmFyIHByZWZpeCA9ICdbJyArIGZ1bmMgKyAnKFwiXSc7XG4gICAgdmFyIHllYXIgPSAoMCA8PSB0aGlzLnllYXIoKSAmJiB0aGlzLnllYXIoKSA8PSA5OTk5KSA/ICdZWVlZJyA6ICdZWVlZWVknO1xuICAgIHZhciBkYXRldGltZSA9ICctTU0tRERbVF1ISDptbTpzcy5TU1MnO1xuICAgIHZhciBzdWZmaXggPSB6b25lICsgJ1tcIildJztcblxuICAgIHJldHVybiB0aGlzLmZvcm1hdChwcmVmaXggKyB5ZWFyICsgZGF0ZXRpbWUgKyBzdWZmaXgpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXQgKGlucHV0U3RyaW5nKSB7XG4gICAgaWYgKCFpbnB1dFN0cmluZykge1xuICAgICAgICBpbnB1dFN0cmluZyA9IHRoaXMuaXNVdGMoKSA/IGhvb2tzLmRlZmF1bHRGb3JtYXRVdGMgOiBob29rcy5kZWZhdWx0Rm9ybWF0O1xuICAgIH1cbiAgICB2YXIgb3V0cHV0ID0gZm9ybWF0TW9tZW50KHRoaXMsIGlucHV0U3RyaW5nKTtcbiAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkucG9zdGZvcm1hdChvdXRwdXQpO1xufVxuXG5mdW5jdGlvbiBmcm9tICh0aW1lLCB3aXRob3V0U3VmZml4KSB7XG4gICAgaWYgKHRoaXMuaXNWYWxpZCgpICYmXG4gICAgICAgICAgICAoKGlzTW9tZW50KHRpbWUpICYmIHRpbWUuaXNWYWxpZCgpKSB8fFxuICAgICAgICAgICAgIGNyZWF0ZUxvY2FsKHRpbWUpLmlzVmFsaWQoKSkpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUR1cmF0aW9uKHt0bzogdGhpcywgZnJvbTogdGltZX0pLmxvY2FsZSh0aGlzLmxvY2FsZSgpKS5odW1hbml6ZSghd2l0aG91dFN1ZmZpeCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLmludmFsaWREYXRlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBmcm9tTm93ICh3aXRob3V0U3VmZml4KSB7XG4gICAgcmV0dXJuIHRoaXMuZnJvbShjcmVhdGVMb2NhbCgpLCB3aXRob3V0U3VmZml4KTtcbn1cblxuZnVuY3Rpb24gdG8gKHRpbWUsIHdpdGhvdXRTdWZmaXgpIHtcbiAgICBpZiAodGhpcy5pc1ZhbGlkKCkgJiZcbiAgICAgICAgICAgICgoaXNNb21lbnQodGltZSkgJiYgdGltZS5pc1ZhbGlkKCkpIHx8XG4gICAgICAgICAgICAgY3JlYXRlTG9jYWwodGltZSkuaXNWYWxpZCgpKSkge1xuICAgICAgICByZXR1cm4gY3JlYXRlRHVyYXRpb24oe2Zyb206IHRoaXMsIHRvOiB0aW1lfSkubG9jYWxlKHRoaXMubG9jYWxlKCkpLmh1bWFuaXplKCF3aXRob3V0U3VmZml4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkuaW52YWxpZERhdGUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRvTm93ICh3aXRob3V0U3VmZml4KSB7XG4gICAgcmV0dXJuIHRoaXMudG8oY3JlYXRlTG9jYWwoKSwgd2l0aG91dFN1ZmZpeCk7XG59XG5cbi8vIElmIHBhc3NlZCBhIGxvY2FsZSBrZXksIGl0IHdpbGwgc2V0IHRoZSBsb2NhbGUgZm9yIHRoaXNcbi8vIGluc3RhbmNlLiAgT3RoZXJ3aXNlLCBpdCB3aWxsIHJldHVybiB0aGUgbG9jYWxlIGNvbmZpZ3VyYXRpb25cbi8vIHZhcmlhYmxlcyBmb3IgdGhpcyBpbnN0YW5jZS5cbmZ1bmN0aW9uIGxvY2FsZSAoa2V5KSB7XG4gICAgdmFyIG5ld0xvY2FsZURhdGE7XG5cbiAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvY2FsZS5fYWJicjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBuZXdMb2NhbGVEYXRhID0gZ2V0TG9jYWxlKGtleSk7XG4gICAgICAgIGlmIChuZXdMb2NhbGVEYXRhICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX2xvY2FsZSA9IG5ld0xvY2FsZURhdGE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG52YXIgbGFuZyA9IGRlcHJlY2F0ZShcbiAgICAnbW9tZW50KCkubGFuZygpIGlzIGRlcHJlY2F0ZWQuIEluc3RlYWQsIHVzZSBtb21lbnQoKS5sb2NhbGVEYXRhKCkgdG8gZ2V0IHRoZSBsYW5ndWFnZSBjb25maWd1cmF0aW9uLiBVc2UgbW9tZW50KCkubG9jYWxlKCkgdG8gY2hhbmdlIGxhbmd1YWdlcy4nLFxuICAgIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGUoa2V5KTtcbiAgICAgICAgfVxuICAgIH1cbik7XG5cbmZ1bmN0aW9uIGxvY2FsZURhdGEgKCkge1xuICAgIHJldHVybiB0aGlzLl9sb2NhbGU7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0T2YgKHVuaXRzKSB7XG4gICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgLy8gdGhlIGZvbGxvd2luZyBzd2l0Y2ggaW50ZW50aW9uYWxseSBvbWl0cyBicmVhayBrZXl3b3Jkc1xuICAgIC8vIHRvIHV0aWxpemUgZmFsbGluZyB0aHJvdWdoIHRoZSBjYXNlcy5cbiAgICBzd2l0Y2ggKHVuaXRzKSB7XG4gICAgICAgIGNhc2UgJ3llYXInOlxuICAgICAgICAgICAgdGhpcy5tb250aCgwKTtcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgY2FzZSAncXVhcnRlcic6XG4gICAgICAgIGNhc2UgJ21vbnRoJzpcbiAgICAgICAgICAgIHRoaXMuZGF0ZSgxKTtcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgY2FzZSAnd2Vlayc6XG4gICAgICAgIGNhc2UgJ2lzb1dlZWsnOlxuICAgICAgICBjYXNlICdkYXknOlxuICAgICAgICBjYXNlICdkYXRlJzpcbiAgICAgICAgICAgIHRoaXMuaG91cnMoMCk7XG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgIGNhc2UgJ2hvdXInOlxuICAgICAgICAgICAgdGhpcy5taW51dGVzKDApO1xuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICBjYXNlICdtaW51dGUnOlxuICAgICAgICAgICAgdGhpcy5zZWNvbmRzKDApO1xuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICBjYXNlICdzZWNvbmQnOlxuICAgICAgICAgICAgdGhpcy5taWxsaXNlY29uZHMoMCk7XG4gICAgfVxuXG4gICAgLy8gd2Vla3MgYXJlIGEgc3BlY2lhbCBjYXNlXG4gICAgaWYgKHVuaXRzID09PSAnd2VlaycpIHtcbiAgICAgICAgdGhpcy53ZWVrZGF5KDApO1xuICAgIH1cbiAgICBpZiAodW5pdHMgPT09ICdpc29XZWVrJykge1xuICAgICAgICB0aGlzLmlzb1dlZWtkYXkoMSk7XG4gICAgfVxuXG4gICAgLy8gcXVhcnRlcnMgYXJlIGFsc28gc3BlY2lhbFxuICAgIGlmICh1bml0cyA9PT0gJ3F1YXJ0ZXInKSB7XG4gICAgICAgIHRoaXMubW9udGgoTWF0aC5mbG9vcih0aGlzLm1vbnRoKCkgLyAzKSAqIDMpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBlbmRPZiAodW5pdHMpIHtcbiAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICBpZiAodW5pdHMgPT09IHVuZGVmaW5lZCB8fCB1bml0cyA9PT0gJ21pbGxpc2Vjb25kJykge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvLyAnZGF0ZScgaXMgYW4gYWxpYXMgZm9yICdkYXknLCBzbyBpdCBzaG91bGQgYmUgY29uc2lkZXJlZCBhcyBzdWNoLlxuICAgIGlmICh1bml0cyA9PT0gJ2RhdGUnKSB7XG4gICAgICAgIHVuaXRzID0gJ2RheSc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuc3RhcnRPZih1bml0cykuYWRkKDEsICh1bml0cyA9PT0gJ2lzb1dlZWsnID8gJ3dlZWsnIDogdW5pdHMpKS5zdWJ0cmFjdCgxLCAnbXMnKTtcbn1cblxuZnVuY3Rpb24gdmFsdWVPZiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2QudmFsdWVPZigpIC0gKCh0aGlzLl9vZmZzZXQgfHwgMCkgKiA2MDAwMCk7XG59XG5cbmZ1bmN0aW9uIHVuaXggKCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKHRoaXMudmFsdWVPZigpIC8gMTAwMCk7XG59XG5cbmZ1bmN0aW9uIHRvRGF0ZSAoKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKHRoaXMudmFsdWVPZigpKTtcbn1cblxuZnVuY3Rpb24gdG9BcnJheSAoKSB7XG4gICAgdmFyIG0gPSB0aGlzO1xuICAgIHJldHVybiBbbS55ZWFyKCksIG0ubW9udGgoKSwgbS5kYXRlKCksIG0uaG91cigpLCBtLm1pbnV0ZSgpLCBtLnNlY29uZCgpLCBtLm1pbGxpc2Vjb25kKCldO1xufVxuXG5mdW5jdGlvbiB0b09iamVjdCAoKSB7XG4gICAgdmFyIG0gPSB0aGlzO1xuICAgIHJldHVybiB7XG4gICAgICAgIHllYXJzOiBtLnllYXIoKSxcbiAgICAgICAgbW9udGhzOiBtLm1vbnRoKCksXG4gICAgICAgIGRhdGU6IG0uZGF0ZSgpLFxuICAgICAgICBob3VyczogbS5ob3VycygpLFxuICAgICAgICBtaW51dGVzOiBtLm1pbnV0ZXMoKSxcbiAgICAgICAgc2Vjb25kczogbS5zZWNvbmRzKCksXG4gICAgICAgIG1pbGxpc2Vjb25kczogbS5taWxsaXNlY29uZHMoKVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHRvSlNPTiAoKSB7XG4gICAgLy8gbmV3IERhdGUoTmFOKS50b0pTT04oKSA9PT0gbnVsbFxuICAgIHJldHVybiB0aGlzLmlzVmFsaWQoKSA/IHRoaXMudG9JU09TdHJpbmcoKSA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWQkMiAoKSB7XG4gICAgcmV0dXJuIGlzVmFsaWQodGhpcyk7XG59XG5cbmZ1bmN0aW9uIHBhcnNpbmdGbGFncyAoKSB7XG4gICAgcmV0dXJuIGV4dGVuZCh7fSwgZ2V0UGFyc2luZ0ZsYWdzKHRoaXMpKTtcbn1cblxuZnVuY3Rpb24gaW52YWxpZEF0ICgpIHtcbiAgICByZXR1cm4gZ2V0UGFyc2luZ0ZsYWdzKHRoaXMpLm92ZXJmbG93O1xufVxuXG5mdW5jdGlvbiBjcmVhdGlvbkRhdGEoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaW5wdXQ6IHRoaXMuX2ksXG4gICAgICAgIGZvcm1hdDogdGhpcy5fZixcbiAgICAgICAgbG9jYWxlOiB0aGlzLl9sb2NhbGUsXG4gICAgICAgIGlzVVRDOiB0aGlzLl9pc1VUQyxcbiAgICAgICAgc3RyaWN0OiB0aGlzLl9zdHJpY3RcbiAgICB9O1xufVxuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKDAsIFsnZ2cnLCAyXSwgMCwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLndlZWtZZWFyKCkgJSAxMDA7XG59KTtcblxuYWRkRm9ybWF0VG9rZW4oMCwgWydHRycsIDJdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNvV2Vla1llYXIoKSAlIDEwMDtcbn0pO1xuXG5mdW5jdGlvbiBhZGRXZWVrWWVhckZvcm1hdFRva2VuICh0b2tlbiwgZ2V0dGVyKSB7XG4gICAgYWRkRm9ybWF0VG9rZW4oMCwgW3Rva2VuLCB0b2tlbi5sZW5ndGhdLCAwLCBnZXR0ZXIpO1xufVxuXG5hZGRXZWVrWWVhckZvcm1hdFRva2VuKCdnZ2dnJywgICAgICd3ZWVrWWVhcicpO1xuYWRkV2Vla1llYXJGb3JtYXRUb2tlbignZ2dnZ2cnLCAgICAnd2Vla1llYXInKTtcbmFkZFdlZWtZZWFyRm9ybWF0VG9rZW4oJ0dHR0cnLCAgJ2lzb1dlZWtZZWFyJyk7XG5hZGRXZWVrWWVhckZvcm1hdFRva2VuKCdHR0dHRycsICdpc29XZWVrWWVhcicpO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygnd2Vla1llYXInLCAnZ2cnKTtcbmFkZFVuaXRBbGlhcygnaXNvV2Vla1llYXInLCAnR0cnKTtcblxuLy8gUFJJT1JJVFlcblxuYWRkVW5pdFByaW9yaXR5KCd3ZWVrWWVhcicsIDEpO1xuYWRkVW5pdFByaW9yaXR5KCdpc29XZWVrWWVhcicsIDEpO1xuXG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbignRycsICAgICAgbWF0Y2hTaWduZWQpO1xuYWRkUmVnZXhUb2tlbignZycsICAgICAgbWF0Y2hTaWduZWQpO1xuYWRkUmVnZXhUb2tlbignR0cnLCAgICAgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuYWRkUmVnZXhUb2tlbignZ2cnLCAgICAgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuYWRkUmVnZXhUb2tlbignR0dHRycsICAgbWF0Y2gxdG80LCBtYXRjaDQpO1xuYWRkUmVnZXhUb2tlbignZ2dnZycsICAgbWF0Y2gxdG80LCBtYXRjaDQpO1xuYWRkUmVnZXhUb2tlbignR0dHR0cnLCAgbWF0Y2gxdG82LCBtYXRjaDYpO1xuYWRkUmVnZXhUb2tlbignZ2dnZ2cnLCAgbWF0Y2gxdG82LCBtYXRjaDYpO1xuXG5hZGRXZWVrUGFyc2VUb2tlbihbJ2dnZ2cnLCAnZ2dnZ2cnLCAnR0dHRycsICdHR0dHRyddLCBmdW5jdGlvbiAoaW5wdXQsIHdlZWssIGNvbmZpZywgdG9rZW4pIHtcbiAgICB3ZWVrW3Rva2VuLnN1YnN0cigwLCAyKV0gPSB0b0ludChpbnB1dCk7XG59KTtcblxuYWRkV2Vla1BhcnNlVG9rZW4oWydnZycsICdHRyddLCBmdW5jdGlvbiAoaW5wdXQsIHdlZWssIGNvbmZpZywgdG9rZW4pIHtcbiAgICB3ZWVrW3Rva2VuXSA9IGhvb2tzLnBhcnNlVHdvRGlnaXRZZWFyKGlucHV0KTtcbn0pO1xuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIGdldFNldFdlZWtZZWFyIChpbnB1dCkge1xuICAgIHJldHVybiBnZXRTZXRXZWVrWWVhckhlbHBlci5jYWxsKHRoaXMsXG4gICAgICAgICAgICBpbnB1dCxcbiAgICAgICAgICAgIHRoaXMud2VlaygpLFxuICAgICAgICAgICAgdGhpcy53ZWVrZGF5KCksXG4gICAgICAgICAgICB0aGlzLmxvY2FsZURhdGEoKS5fd2Vlay5kb3csXG4gICAgICAgICAgICB0aGlzLmxvY2FsZURhdGEoKS5fd2Vlay5kb3kpO1xufVxuXG5mdW5jdGlvbiBnZXRTZXRJU09XZWVrWWVhciAoaW5wdXQpIHtcbiAgICByZXR1cm4gZ2V0U2V0V2Vla1llYXJIZWxwZXIuY2FsbCh0aGlzLFxuICAgICAgICAgICAgaW5wdXQsIHRoaXMuaXNvV2VlaygpLCB0aGlzLmlzb1dlZWtkYXkoKSwgMSwgNCk7XG59XG5cbmZ1bmN0aW9uIGdldElTT1dlZWtzSW5ZZWFyICgpIHtcbiAgICByZXR1cm4gd2Vla3NJblllYXIodGhpcy55ZWFyKCksIDEsIDQpO1xufVxuXG5mdW5jdGlvbiBnZXRXZWVrc0luWWVhciAoKSB7XG4gICAgdmFyIHdlZWtJbmZvID0gdGhpcy5sb2NhbGVEYXRhKCkuX3dlZWs7XG4gICAgcmV0dXJuIHdlZWtzSW5ZZWFyKHRoaXMueWVhcigpLCB3ZWVrSW5mby5kb3csIHdlZWtJbmZvLmRveSk7XG59XG5cbmZ1bmN0aW9uIGdldFNldFdlZWtZZWFySGVscGVyKGlucHV0LCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSkge1xuICAgIHZhciB3ZWVrc1RhcmdldDtcbiAgICBpZiAoaW5wdXQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gd2Vla09mWWVhcih0aGlzLCBkb3csIGRveSkueWVhcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB3ZWVrc1RhcmdldCA9IHdlZWtzSW5ZZWFyKGlucHV0LCBkb3csIGRveSk7XG4gICAgICAgIGlmICh3ZWVrID4gd2Vla3NUYXJnZXQpIHtcbiAgICAgICAgICAgIHdlZWsgPSB3ZWVrc1RhcmdldDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2V0V2Vla0FsbC5jYWxsKHRoaXMsIGlucHV0LCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXRXZWVrQWxsKHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSkge1xuICAgIHZhciBkYXlPZlllYXJEYXRhID0gZGF5T2ZZZWFyRnJvbVdlZWtzKHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSksXG4gICAgICAgIGRhdGUgPSBjcmVhdGVVVENEYXRlKGRheU9mWWVhckRhdGEueWVhciwgMCwgZGF5T2ZZZWFyRGF0YS5kYXlPZlllYXIpO1xuXG4gICAgdGhpcy55ZWFyKGRhdGUuZ2V0VVRDRnVsbFllYXIoKSk7XG4gICAgdGhpcy5tb250aChkYXRlLmdldFVUQ01vbnRoKCkpO1xuICAgIHRoaXMuZGF0ZShkYXRlLmdldFVUQ0RhdGUoKSk7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ1EnLCAwLCAnUW8nLCAncXVhcnRlcicpO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygncXVhcnRlcicsICdRJyk7XG5cbi8vIFBSSU9SSVRZXG5cbmFkZFVuaXRQcmlvcml0eSgncXVhcnRlcicsIDcpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ1EnLCBtYXRjaDEpO1xuYWRkUGFyc2VUb2tlbignUScsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICBhcnJheVtNT05USF0gPSAodG9JbnQoaW5wdXQpIC0gMSkgKiAzO1xufSk7XG5cbi8vIE1PTUVOVFNcblxuZnVuY3Rpb24gZ2V0U2V0UXVhcnRlciAoaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IE1hdGguY2VpbCgodGhpcy5tb250aCgpICsgMSkgLyAzKSA6IHRoaXMubW9udGgoKGlucHV0IC0gMSkgKiAzICsgdGhpcy5tb250aCgpICUgMyk7XG59XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ0QnLCBbJ0REJywgMl0sICdEbycsICdkYXRlJyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdkYXRlJywgJ0QnKTtcblxuLy8gUFJJT1JPSVRZXG5hZGRVbml0UHJpb3JpdHkoJ2RhdGUnLCA5KTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdEJywgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCdERCcsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFJlZ2V4VG9rZW4oJ0RvJywgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICAvLyBUT0RPOiBSZW1vdmUgXCJvcmRpbmFsUGFyc2VcIiBmYWxsYmFjayBpbiBuZXh0IG1ham9yIHJlbGVhc2UuXG4gICAgcmV0dXJuIGlzU3RyaWN0ID9cbiAgICAgIChsb2NhbGUuX2RheU9mTW9udGhPcmRpbmFsUGFyc2UgfHwgbG9jYWxlLl9vcmRpbmFsUGFyc2UpIDpcbiAgICAgIGxvY2FsZS5fZGF5T2ZNb250aE9yZGluYWxQYXJzZUxlbmllbnQ7XG59KTtcblxuYWRkUGFyc2VUb2tlbihbJ0QnLCAnREQnXSwgREFURSk7XG5hZGRQYXJzZVRva2VuKCdEbycsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICBhcnJheVtEQVRFXSA9IHRvSW50KGlucHV0Lm1hdGNoKG1hdGNoMXRvMilbMF0sIDEwKTtcbn0pO1xuXG4vLyBNT01FTlRTXG5cbnZhciBnZXRTZXREYXlPZk1vbnRoID0gbWFrZUdldFNldCgnRGF0ZScsIHRydWUpO1xuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCdEREQnLCBbJ0REREQnLCAzXSwgJ0RERG8nLCAnZGF5T2ZZZWFyJyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdkYXlPZlllYXInLCAnREREJyk7XG5cbi8vIFBSSU9SSVRZXG5hZGRVbml0UHJpb3JpdHkoJ2RheU9mWWVhcicsIDQpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ0RERCcsICBtYXRjaDF0bzMpO1xuYWRkUmVnZXhUb2tlbignRERERCcsIG1hdGNoMyk7XG5hZGRQYXJzZVRva2VuKFsnREREJywgJ0REREQnXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgY29uZmlnLl9kYXlPZlllYXIgPSB0b0ludChpbnB1dCk7XG59KTtcblxuLy8gSEVMUEVSU1xuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIGdldFNldERheU9mWWVhciAoaW5wdXQpIHtcbiAgICB2YXIgZGF5T2ZZZWFyID0gTWF0aC5yb3VuZCgodGhpcy5jbG9uZSgpLnN0YXJ0T2YoJ2RheScpIC0gdGhpcy5jbG9uZSgpLnN0YXJ0T2YoJ3llYXInKSkgLyA4NjRlNSkgKyAxO1xuICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gZGF5T2ZZZWFyIDogdGhpcy5hZGQoKGlucHV0IC0gZGF5T2ZZZWFyKSwgJ2QnKTtcbn1cblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbignbScsIFsnbW0nLCAyXSwgMCwgJ21pbnV0ZScpO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygnbWludXRlJywgJ20nKTtcblxuLy8gUFJJT1JJVFlcblxuYWRkVW5pdFByaW9yaXR5KCdtaW51dGUnLCAxNCk7XG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbignbScsICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignbW0nLCBtYXRjaDF0bzIsIG1hdGNoMik7XG5hZGRQYXJzZVRva2VuKFsnbScsICdtbSddLCBNSU5VVEUpO1xuXG4vLyBNT01FTlRTXG5cbnZhciBnZXRTZXRNaW51dGUgPSBtYWtlR2V0U2V0KCdNaW51dGVzJywgZmFsc2UpO1xuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCdzJywgWydzcycsIDJdLCAwLCAnc2Vjb25kJyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdzZWNvbmQnLCAncycpO1xuXG4vLyBQUklPUklUWVxuXG5hZGRVbml0UHJpb3JpdHkoJ3NlY29uZCcsIDE1KTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdzJywgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCdzcycsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFBhcnNlVG9rZW4oWydzJywgJ3NzJ10sIFNFQ09ORCk7XG5cbi8vIE1PTUVOVFNcblxudmFyIGdldFNldFNlY29uZCA9IG1ha2VHZXRTZXQoJ1NlY29uZHMnLCBmYWxzZSk7XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ1MnLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIH5+KHRoaXMubWlsbGlzZWNvbmQoKSAvIDEwMCk7XG59KTtcblxuYWRkRm9ybWF0VG9rZW4oMCwgWydTUycsIDJdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIH5+KHRoaXMubWlsbGlzZWNvbmQoKSAvIDEwKTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbigwLCBbJ1NTUycsIDNdLCAwLCAnbWlsbGlzZWNvbmQnKTtcbmFkZEZvcm1hdFRva2VuKDAsIFsnU1NTUycsIDRdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWlsbGlzZWNvbmQoKSAqIDEwO1xufSk7XG5hZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTJywgNV0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTAwO1xufSk7XG5hZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTUycsIDZdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWlsbGlzZWNvbmQoKSAqIDEwMDA7XG59KTtcbmFkZEZvcm1hdFRva2VuKDAsIFsnU1NTU1NTUycsIDddLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWlsbGlzZWNvbmQoKSAqIDEwMDAwO1xufSk7XG5hZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTU1NTJywgOF0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTAwMDAwO1xufSk7XG5hZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTU1NTUycsIDldLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWlsbGlzZWNvbmQoKSAqIDEwMDAwMDA7XG59KTtcblxuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygnbWlsbGlzZWNvbmQnLCAnbXMnKTtcblxuLy8gUFJJT1JJVFlcblxuYWRkVW5pdFByaW9yaXR5KCdtaWxsaXNlY29uZCcsIDE2KTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdTJywgICAgbWF0Y2gxdG8zLCBtYXRjaDEpO1xuYWRkUmVnZXhUb2tlbignU1MnLCAgIG1hdGNoMXRvMywgbWF0Y2gyKTtcbmFkZFJlZ2V4VG9rZW4oJ1NTUycsICBtYXRjaDF0bzMsIG1hdGNoMyk7XG5cbnZhciB0b2tlbjtcbmZvciAodG9rZW4gPSAnU1NTUyc7IHRva2VuLmxlbmd0aCA8PSA5OyB0b2tlbiArPSAnUycpIHtcbiAgICBhZGRSZWdleFRva2VuKHRva2VuLCBtYXRjaFVuc2lnbmVkKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VNcyhpbnB1dCwgYXJyYXkpIHtcbiAgICBhcnJheVtNSUxMSVNFQ09ORF0gPSB0b0ludCgoJzAuJyArIGlucHV0KSAqIDEwMDApO1xufVxuXG5mb3IgKHRva2VuID0gJ1MnOyB0b2tlbi5sZW5ndGggPD0gOTsgdG9rZW4gKz0gJ1MnKSB7XG4gICAgYWRkUGFyc2VUb2tlbih0b2tlbiwgcGFyc2VNcyk7XG59XG4vLyBNT01FTlRTXG5cbnZhciBnZXRTZXRNaWxsaXNlY29uZCA9IG1ha2VHZXRTZXQoJ01pbGxpc2Vjb25kcycsIGZhbHNlKTtcblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbigneicsICAwLCAwLCAnem9uZUFiYnInKTtcbmFkZEZvcm1hdFRva2VuKCd6eicsIDAsIDAsICd6b25lTmFtZScpO1xuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIGdldFpvbmVBYmJyICgpIHtcbiAgICByZXR1cm4gdGhpcy5faXNVVEMgPyAnVVRDJyA6ICcnO1xufVxuXG5mdW5jdGlvbiBnZXRab25lTmFtZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzVVRDID8gJ0Nvb3JkaW5hdGVkIFVuaXZlcnNhbCBUaW1lJyA6ICcnO1xufVxuXG52YXIgcHJvdG8gPSBNb21lbnQucHJvdG90eXBlO1xuXG5wcm90by5hZGQgICAgICAgICAgICAgICA9IGFkZDtcbnByb3RvLmNhbGVuZGFyICAgICAgICAgID0gY2FsZW5kYXIkMTtcbnByb3RvLmNsb25lICAgICAgICAgICAgID0gY2xvbmU7XG5wcm90by5kaWZmICAgICAgICAgICAgICA9IGRpZmY7XG5wcm90by5lbmRPZiAgICAgICAgICAgICA9IGVuZE9mO1xucHJvdG8uZm9ybWF0ICAgICAgICAgICAgPSBmb3JtYXQ7XG5wcm90by5mcm9tICAgICAgICAgICAgICA9IGZyb207XG5wcm90by5mcm9tTm93ICAgICAgICAgICA9IGZyb21Ob3c7XG5wcm90by50byAgICAgICAgICAgICAgICA9IHRvO1xucHJvdG8udG9Ob3cgICAgICAgICAgICAgPSB0b05vdztcbnByb3RvLmdldCAgICAgICAgICAgICAgID0gc3RyaW5nR2V0O1xucHJvdG8uaW52YWxpZEF0ICAgICAgICAgPSBpbnZhbGlkQXQ7XG5wcm90by5pc0FmdGVyICAgICAgICAgICA9IGlzQWZ0ZXI7XG5wcm90by5pc0JlZm9yZSAgICAgICAgICA9IGlzQmVmb3JlO1xucHJvdG8uaXNCZXR3ZWVuICAgICAgICAgPSBpc0JldHdlZW47XG5wcm90by5pc1NhbWUgICAgICAgICAgICA9IGlzU2FtZTtcbnByb3RvLmlzU2FtZU9yQWZ0ZXIgICAgID0gaXNTYW1lT3JBZnRlcjtcbnByb3RvLmlzU2FtZU9yQmVmb3JlICAgID0gaXNTYW1lT3JCZWZvcmU7XG5wcm90by5pc1ZhbGlkICAgICAgICAgICA9IGlzVmFsaWQkMjtcbnByb3RvLmxhbmcgICAgICAgICAgICAgID0gbGFuZztcbnByb3RvLmxvY2FsZSAgICAgICAgICAgID0gbG9jYWxlO1xucHJvdG8ubG9jYWxlRGF0YSAgICAgICAgPSBsb2NhbGVEYXRhO1xucHJvdG8ubWF4ICAgICAgICAgICAgICAgPSBwcm90b3R5cGVNYXg7XG5wcm90by5taW4gICAgICAgICAgICAgICA9IHByb3RvdHlwZU1pbjtcbnByb3RvLnBhcnNpbmdGbGFncyAgICAgID0gcGFyc2luZ0ZsYWdzO1xucHJvdG8uc2V0ICAgICAgICAgICAgICAgPSBzdHJpbmdTZXQ7XG5wcm90by5zdGFydE9mICAgICAgICAgICA9IHN0YXJ0T2Y7XG5wcm90by5zdWJ0cmFjdCAgICAgICAgICA9IHN1YnRyYWN0O1xucHJvdG8udG9BcnJheSAgICAgICAgICAgPSB0b0FycmF5O1xucHJvdG8udG9PYmplY3QgICAgICAgICAgPSB0b09iamVjdDtcbnByb3RvLnRvRGF0ZSAgICAgICAgICAgID0gdG9EYXRlO1xucHJvdG8udG9JU09TdHJpbmcgICAgICAgPSB0b0lTT1N0cmluZztcbnByb3RvLmluc3BlY3QgICAgICAgICAgID0gaW5zcGVjdDtcbnByb3RvLnRvSlNPTiAgICAgICAgICAgID0gdG9KU09OO1xucHJvdG8udG9TdHJpbmcgICAgICAgICAgPSB0b1N0cmluZztcbnByb3RvLnVuaXggICAgICAgICAgICAgID0gdW5peDtcbnByb3RvLnZhbHVlT2YgICAgICAgICAgID0gdmFsdWVPZjtcbnByb3RvLmNyZWF0aW9uRGF0YSAgICAgID0gY3JlYXRpb25EYXRhO1xuXG4vLyBZZWFyXG5wcm90by55ZWFyICAgICAgID0gZ2V0U2V0WWVhcjtcbnByb3RvLmlzTGVhcFllYXIgPSBnZXRJc0xlYXBZZWFyO1xuXG4vLyBXZWVrIFllYXJcbnByb3RvLndlZWtZZWFyICAgID0gZ2V0U2V0V2Vla1llYXI7XG5wcm90by5pc29XZWVrWWVhciA9IGdldFNldElTT1dlZWtZZWFyO1xuXG4vLyBRdWFydGVyXG5wcm90by5xdWFydGVyID0gcHJvdG8ucXVhcnRlcnMgPSBnZXRTZXRRdWFydGVyO1xuXG4vLyBNb250aFxucHJvdG8ubW9udGggICAgICAgPSBnZXRTZXRNb250aDtcbnByb3RvLmRheXNJbk1vbnRoID0gZ2V0RGF5c0luTW9udGg7XG5cbi8vIFdlZWtcbnByb3RvLndlZWsgICAgICAgICAgID0gcHJvdG8ud2Vla3MgICAgICAgID0gZ2V0U2V0V2VlaztcbnByb3RvLmlzb1dlZWsgICAgICAgID0gcHJvdG8uaXNvV2Vla3MgICAgID0gZ2V0U2V0SVNPV2VlaztcbnByb3RvLndlZWtzSW5ZZWFyICAgID0gZ2V0V2Vla3NJblllYXI7XG5wcm90by5pc29XZWVrc0luWWVhciA9IGdldElTT1dlZWtzSW5ZZWFyO1xuXG4vLyBEYXlcbnByb3RvLmRhdGUgICAgICAgPSBnZXRTZXREYXlPZk1vbnRoO1xucHJvdG8uZGF5ICAgICAgICA9IHByb3RvLmRheXMgICAgICAgICAgICAgPSBnZXRTZXREYXlPZldlZWs7XG5wcm90by53ZWVrZGF5ICAgID0gZ2V0U2V0TG9jYWxlRGF5T2ZXZWVrO1xucHJvdG8uaXNvV2Vla2RheSA9IGdldFNldElTT0RheU9mV2VlaztcbnByb3RvLmRheU9mWWVhciAgPSBnZXRTZXREYXlPZlllYXI7XG5cbi8vIEhvdXJcbnByb3RvLmhvdXIgPSBwcm90by5ob3VycyA9IGdldFNldEhvdXI7XG5cbi8vIE1pbnV0ZVxucHJvdG8ubWludXRlID0gcHJvdG8ubWludXRlcyA9IGdldFNldE1pbnV0ZTtcblxuLy8gU2Vjb25kXG5wcm90by5zZWNvbmQgPSBwcm90by5zZWNvbmRzID0gZ2V0U2V0U2Vjb25kO1xuXG4vLyBNaWxsaXNlY29uZFxucHJvdG8ubWlsbGlzZWNvbmQgPSBwcm90by5taWxsaXNlY29uZHMgPSBnZXRTZXRNaWxsaXNlY29uZDtcblxuLy8gT2Zmc2V0XG5wcm90by51dGNPZmZzZXQgICAgICAgICAgICA9IGdldFNldE9mZnNldDtcbnByb3RvLnV0YyAgICAgICAgICAgICAgICAgID0gc2V0T2Zmc2V0VG9VVEM7XG5wcm90by5sb2NhbCAgICAgICAgICAgICAgICA9IHNldE9mZnNldFRvTG9jYWw7XG5wcm90by5wYXJzZVpvbmUgICAgICAgICAgICA9IHNldE9mZnNldFRvUGFyc2VkT2Zmc2V0O1xucHJvdG8uaGFzQWxpZ25lZEhvdXJPZmZzZXQgPSBoYXNBbGlnbmVkSG91ck9mZnNldDtcbnByb3RvLmlzRFNUICAgICAgICAgICAgICAgID0gaXNEYXlsaWdodFNhdmluZ1RpbWU7XG5wcm90by5pc0xvY2FsICAgICAgICAgICAgICA9IGlzTG9jYWw7XG5wcm90by5pc1V0Y09mZnNldCAgICAgICAgICA9IGlzVXRjT2Zmc2V0O1xucHJvdG8uaXNVdGMgICAgICAgICAgICAgICAgPSBpc1V0YztcbnByb3RvLmlzVVRDICAgICAgICAgICAgICAgID0gaXNVdGM7XG5cbi8vIFRpbWV6b25lXG5wcm90by56b25lQWJiciA9IGdldFpvbmVBYmJyO1xucHJvdG8uem9uZU5hbWUgPSBnZXRab25lTmFtZTtcblxuLy8gRGVwcmVjYXRpb25zXG5wcm90by5kYXRlcyAgPSBkZXByZWNhdGUoJ2RhdGVzIGFjY2Vzc29yIGlzIGRlcHJlY2F0ZWQuIFVzZSBkYXRlIGluc3RlYWQuJywgZ2V0U2V0RGF5T2ZNb250aCk7XG5wcm90by5tb250aHMgPSBkZXByZWNhdGUoJ21vbnRocyBhY2Nlc3NvciBpcyBkZXByZWNhdGVkLiBVc2UgbW9udGggaW5zdGVhZCcsIGdldFNldE1vbnRoKTtcbnByb3RvLnllYXJzICA9IGRlcHJlY2F0ZSgneWVhcnMgYWNjZXNzb3IgaXMgZGVwcmVjYXRlZC4gVXNlIHllYXIgaW5zdGVhZCcsIGdldFNldFllYXIpO1xucHJvdG8uem9uZSAgID0gZGVwcmVjYXRlKCdtb21lbnQoKS56b25lIGlzIGRlcHJlY2F0ZWQsIHVzZSBtb21lbnQoKS51dGNPZmZzZXQgaW5zdGVhZC4gaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy96b25lLycsIGdldFNldFpvbmUpO1xucHJvdG8uaXNEU1RTaGlmdGVkID0gZGVwcmVjYXRlKCdpc0RTVFNoaWZ0ZWQgaXMgZGVwcmVjYXRlZC4gU2VlIGh0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvZHN0LXNoaWZ0ZWQvIGZvciBtb3JlIGluZm9ybWF0aW9uJywgaXNEYXlsaWdodFNhdmluZ1RpbWVTaGlmdGVkKTtcblxuZnVuY3Rpb24gY3JlYXRlVW5peCAoaW5wdXQpIHtcbiAgICByZXR1cm4gY3JlYXRlTG9jYWwoaW5wdXQgKiAxMDAwKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlSW5ab25lICgpIHtcbiAgICByZXR1cm4gY3JlYXRlTG9jYWwuYXBwbHkobnVsbCwgYXJndW1lbnRzKS5wYXJzZVpvbmUoKTtcbn1cblxuZnVuY3Rpb24gcHJlUGFyc2VQb3N0Rm9ybWF0IChzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nO1xufVxuXG52YXIgcHJvdG8kMSA9IExvY2FsZS5wcm90b3R5cGU7XG5cbnByb3RvJDEuY2FsZW5kYXIgICAgICAgID0gY2FsZW5kYXI7XG5wcm90byQxLmxvbmdEYXRlRm9ybWF0ICA9IGxvbmdEYXRlRm9ybWF0O1xucHJvdG8kMS5pbnZhbGlkRGF0ZSAgICAgPSBpbnZhbGlkRGF0ZTtcbnByb3RvJDEub3JkaW5hbCAgICAgICAgID0gb3JkaW5hbDtcbnByb3RvJDEucHJlcGFyc2UgICAgICAgID0gcHJlUGFyc2VQb3N0Rm9ybWF0O1xucHJvdG8kMS5wb3N0Zm9ybWF0ICAgICAgPSBwcmVQYXJzZVBvc3RGb3JtYXQ7XG5wcm90byQxLnJlbGF0aXZlVGltZSAgICA9IHJlbGF0aXZlVGltZTtcbnByb3RvJDEucGFzdEZ1dHVyZSAgICAgID0gcGFzdEZ1dHVyZTtcbnByb3RvJDEuc2V0ICAgICAgICAgICAgID0gc2V0O1xuXG4vLyBNb250aFxucHJvdG8kMS5tb250aHMgICAgICAgICAgICA9ICAgICAgICBsb2NhbGVNb250aHM7XG5wcm90byQxLm1vbnRoc1Nob3J0ICAgICAgID0gICAgICAgIGxvY2FsZU1vbnRoc1Nob3J0O1xucHJvdG8kMS5tb250aHNQYXJzZSAgICAgICA9ICAgICAgICBsb2NhbGVNb250aHNQYXJzZTtcbnByb3RvJDEubW9udGhzUmVnZXggICAgICAgPSBtb250aHNSZWdleDtcbnByb3RvJDEubW9udGhzU2hvcnRSZWdleCAgPSBtb250aHNTaG9ydFJlZ2V4O1xuXG4vLyBXZWVrXG5wcm90byQxLndlZWsgPSBsb2NhbGVXZWVrO1xucHJvdG8kMS5maXJzdERheU9mWWVhciA9IGxvY2FsZUZpcnN0RGF5T2ZZZWFyO1xucHJvdG8kMS5maXJzdERheU9mV2VlayA9IGxvY2FsZUZpcnN0RGF5T2ZXZWVrO1xuXG4vLyBEYXkgb2YgV2Vla1xucHJvdG8kMS53ZWVrZGF5cyAgICAgICA9ICAgICAgICBsb2NhbGVXZWVrZGF5cztcbnByb3RvJDEud2Vla2RheXNNaW4gICAgPSAgICAgICAgbG9jYWxlV2Vla2RheXNNaW47XG5wcm90byQxLndlZWtkYXlzU2hvcnQgID0gICAgICAgIGxvY2FsZVdlZWtkYXlzU2hvcnQ7XG5wcm90byQxLndlZWtkYXlzUGFyc2UgID0gICAgICAgIGxvY2FsZVdlZWtkYXlzUGFyc2U7XG5cbnByb3RvJDEud2Vla2RheXNSZWdleCAgICAgICA9ICAgICAgICB3ZWVrZGF5c1JlZ2V4O1xucHJvdG8kMS53ZWVrZGF5c1Nob3J0UmVnZXggID0gICAgICAgIHdlZWtkYXlzU2hvcnRSZWdleDtcbnByb3RvJDEud2Vla2RheXNNaW5SZWdleCAgICA9ICAgICAgICB3ZWVrZGF5c01pblJlZ2V4O1xuXG4vLyBIb3Vyc1xucHJvdG8kMS5pc1BNID0gbG9jYWxlSXNQTTtcbnByb3RvJDEubWVyaWRpZW0gPSBsb2NhbGVNZXJpZGllbTtcblxuZnVuY3Rpb24gZ2V0JDEgKGZvcm1hdCwgaW5kZXgsIGZpZWxkLCBzZXR0ZXIpIHtcbiAgICB2YXIgbG9jYWxlID0gZ2V0TG9jYWxlKCk7XG4gICAgdmFyIHV0YyA9IGNyZWF0ZVVUQygpLnNldChzZXR0ZXIsIGluZGV4KTtcbiAgICByZXR1cm4gbG9jYWxlW2ZpZWxkXSh1dGMsIGZvcm1hdCk7XG59XG5cbmZ1bmN0aW9uIGxpc3RNb250aHNJbXBsIChmb3JtYXQsIGluZGV4LCBmaWVsZCkge1xuICAgIGlmIChpc051bWJlcihmb3JtYXQpKSB7XG4gICAgICAgIGluZGV4ID0gZm9ybWF0O1xuICAgICAgICBmb3JtYXQgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgZm9ybWF0ID0gZm9ybWF0IHx8ICcnO1xuXG4gICAgaWYgKGluZGV4ICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGdldCQxKGZvcm1hdCwgaW5kZXgsIGZpZWxkLCAnbW9udGgnKTtcbiAgICB9XG5cbiAgICB2YXIgaTtcbiAgICB2YXIgb3V0ID0gW107XG4gICAgZm9yIChpID0gMDsgaSA8IDEyOyBpKyspIHtcbiAgICAgICAgb3V0W2ldID0gZ2V0JDEoZm9ybWF0LCBpLCBmaWVsZCwgJ21vbnRoJyk7XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG59XG5cbi8vICgpXG4vLyAoNSlcbi8vIChmbXQsIDUpXG4vLyAoZm10KVxuLy8gKHRydWUpXG4vLyAodHJ1ZSwgNSlcbi8vICh0cnVlLCBmbXQsIDUpXG4vLyAodHJ1ZSwgZm10KVxuZnVuY3Rpb24gbGlzdFdlZWtkYXlzSW1wbCAobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4LCBmaWVsZCkge1xuICAgIGlmICh0eXBlb2YgbG9jYWxlU29ydGVkID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgaWYgKGlzTnVtYmVyKGZvcm1hdCkpIHtcbiAgICAgICAgICAgIGluZGV4ID0gZm9ybWF0O1xuICAgICAgICAgICAgZm9ybWF0ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9ybWF0ID0gZm9ybWF0IHx8ICcnO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvcm1hdCA9IGxvY2FsZVNvcnRlZDtcbiAgICAgICAgaW5kZXggPSBmb3JtYXQ7XG4gICAgICAgIGxvY2FsZVNvcnRlZCA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChpc051bWJlcihmb3JtYXQpKSB7XG4gICAgICAgICAgICBpbmRleCA9IGZvcm1hdDtcbiAgICAgICAgICAgIGZvcm1hdCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcm1hdCA9IGZvcm1hdCB8fCAnJztcbiAgICB9XG5cbiAgICB2YXIgbG9jYWxlID0gZ2V0TG9jYWxlKCksXG4gICAgICAgIHNoaWZ0ID0gbG9jYWxlU29ydGVkID8gbG9jYWxlLl93ZWVrLmRvdyA6IDA7XG5cbiAgICBpZiAoaW5kZXggIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZ2V0JDEoZm9ybWF0LCAoaW5kZXggKyBzaGlmdCkgJSA3LCBmaWVsZCwgJ2RheScpO1xuICAgIH1cblxuICAgIHZhciBpO1xuICAgIHZhciBvdXQgPSBbXTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgIG91dFtpXSA9IGdldCQxKGZvcm1hdCwgKGkgKyBzaGlmdCkgJSA3LCBmaWVsZCwgJ2RheScpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBsaXN0TW9udGhzIChmb3JtYXQsIGluZGV4KSB7XG4gICAgcmV0dXJuIGxpc3RNb250aHNJbXBsKGZvcm1hdCwgaW5kZXgsICdtb250aHMnKTtcbn1cblxuZnVuY3Rpb24gbGlzdE1vbnRoc1Nob3J0IChmb3JtYXQsIGluZGV4KSB7XG4gICAgcmV0dXJuIGxpc3RNb250aHNJbXBsKGZvcm1hdCwgaW5kZXgsICdtb250aHNTaG9ydCcpO1xufVxuXG5mdW5jdGlvbiBsaXN0V2Vla2RheXMgKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCkge1xuICAgIHJldHVybiBsaXN0V2Vla2RheXNJbXBsKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCwgJ3dlZWtkYXlzJyk7XG59XG5cbmZ1bmN0aW9uIGxpc3RXZWVrZGF5c1Nob3J0IChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgpIHtcbiAgICByZXR1cm4gbGlzdFdlZWtkYXlzSW1wbChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgsICd3ZWVrZGF5c1Nob3J0Jyk7XG59XG5cbmZ1bmN0aW9uIGxpc3RXZWVrZGF5c01pbiAobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4KSB7XG4gICAgcmV0dXJuIGxpc3RXZWVrZGF5c0ltcGwobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4LCAnd2Vla2RheXNNaW4nKTtcbn1cblxuZ2V0U2V0R2xvYmFsTG9jYWxlKCdlbicsIHtcbiAgICBkYXlPZk1vbnRoT3JkaW5hbFBhcnNlOiAvXFxkezEsMn0odGh8c3R8bmR8cmQpLyxcbiAgICBvcmRpbmFsIDogZnVuY3Rpb24gKG51bWJlcikge1xuICAgICAgICB2YXIgYiA9IG51bWJlciAlIDEwLFxuICAgICAgICAgICAgb3V0cHV0ID0gKHRvSW50KG51bWJlciAlIDEwMCAvIDEwKSA9PT0gMSkgPyAndGgnIDpcbiAgICAgICAgICAgIChiID09PSAxKSA/ICdzdCcgOlxuICAgICAgICAgICAgKGIgPT09IDIpID8gJ25kJyA6XG4gICAgICAgICAgICAoYiA9PT0gMykgPyAncmQnIDogJ3RoJztcbiAgICAgICAgcmV0dXJuIG51bWJlciArIG91dHB1dDtcbiAgICB9XG59KTtcblxuLy8gU2lkZSBlZmZlY3QgaW1wb3J0c1xuaG9va3MubGFuZyA9IGRlcHJlY2F0ZSgnbW9tZW50LmxhbmcgaXMgZGVwcmVjYXRlZC4gVXNlIG1vbWVudC5sb2NhbGUgaW5zdGVhZC4nLCBnZXRTZXRHbG9iYWxMb2NhbGUpO1xuaG9va3MubGFuZ0RhdGEgPSBkZXByZWNhdGUoJ21vbWVudC5sYW5nRGF0YSBpcyBkZXByZWNhdGVkLiBVc2UgbW9tZW50LmxvY2FsZURhdGEgaW5zdGVhZC4nLCBnZXRMb2NhbGUpO1xuXG52YXIgbWF0aEFicyA9IE1hdGguYWJzO1xuXG5mdW5jdGlvbiBhYnMgKCkge1xuICAgIHZhciBkYXRhICAgICAgICAgICA9IHRoaXMuX2RhdGE7XG5cbiAgICB0aGlzLl9taWxsaXNlY29uZHMgPSBtYXRoQWJzKHRoaXMuX21pbGxpc2Vjb25kcyk7XG4gICAgdGhpcy5fZGF5cyAgICAgICAgID0gbWF0aEFicyh0aGlzLl9kYXlzKTtcbiAgICB0aGlzLl9tb250aHMgICAgICAgPSBtYXRoQWJzKHRoaXMuX21vbnRocyk7XG5cbiAgICBkYXRhLm1pbGxpc2Vjb25kcyAgPSBtYXRoQWJzKGRhdGEubWlsbGlzZWNvbmRzKTtcbiAgICBkYXRhLnNlY29uZHMgICAgICAgPSBtYXRoQWJzKGRhdGEuc2Vjb25kcyk7XG4gICAgZGF0YS5taW51dGVzICAgICAgID0gbWF0aEFicyhkYXRhLm1pbnV0ZXMpO1xuICAgIGRhdGEuaG91cnMgICAgICAgICA9IG1hdGhBYnMoZGF0YS5ob3Vycyk7XG4gICAgZGF0YS5tb250aHMgICAgICAgID0gbWF0aEFicyhkYXRhLm1vbnRocyk7XG4gICAgZGF0YS55ZWFycyAgICAgICAgID0gbWF0aEFicyhkYXRhLnllYXJzKTtcblxuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBhZGRTdWJ0cmFjdCQxIChkdXJhdGlvbiwgaW5wdXQsIHZhbHVlLCBkaXJlY3Rpb24pIHtcbiAgICB2YXIgb3RoZXIgPSBjcmVhdGVEdXJhdGlvbihpbnB1dCwgdmFsdWUpO1xuXG4gICAgZHVyYXRpb24uX21pbGxpc2Vjb25kcyArPSBkaXJlY3Rpb24gKiBvdGhlci5fbWlsbGlzZWNvbmRzO1xuICAgIGR1cmF0aW9uLl9kYXlzICAgICAgICAgKz0gZGlyZWN0aW9uICogb3RoZXIuX2RheXM7XG4gICAgZHVyYXRpb24uX21vbnRocyAgICAgICArPSBkaXJlY3Rpb24gKiBvdGhlci5fbW9udGhzO1xuXG4gICAgcmV0dXJuIGR1cmF0aW9uLl9idWJibGUoKTtcbn1cblxuLy8gc3VwcG9ydHMgb25seSAyLjAtc3R5bGUgYWRkKDEsICdzJykgb3IgYWRkKGR1cmF0aW9uKVxuZnVuY3Rpb24gYWRkJDEgKGlucHV0LCB2YWx1ZSkge1xuICAgIHJldHVybiBhZGRTdWJ0cmFjdCQxKHRoaXMsIGlucHV0LCB2YWx1ZSwgMSk7XG59XG5cbi8vIHN1cHBvcnRzIG9ubHkgMi4wLXN0eWxlIHN1YnRyYWN0KDEsICdzJykgb3Igc3VidHJhY3QoZHVyYXRpb24pXG5mdW5jdGlvbiBzdWJ0cmFjdCQxIChpbnB1dCwgdmFsdWUpIHtcbiAgICByZXR1cm4gYWRkU3VidHJhY3QkMSh0aGlzLCBpbnB1dCwgdmFsdWUsIC0xKTtcbn1cblxuZnVuY3Rpb24gYWJzQ2VpbCAobnVtYmVyKSB7XG4gICAgaWYgKG51bWJlciA8IDApIHtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IobnVtYmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gTWF0aC5jZWlsKG51bWJlcik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBidWJibGUgKCkge1xuICAgIHZhciBtaWxsaXNlY29uZHMgPSB0aGlzLl9taWxsaXNlY29uZHM7XG4gICAgdmFyIGRheXMgICAgICAgICA9IHRoaXMuX2RheXM7XG4gICAgdmFyIG1vbnRocyAgICAgICA9IHRoaXMuX21vbnRocztcbiAgICB2YXIgZGF0YSAgICAgICAgID0gdGhpcy5fZGF0YTtcbiAgICB2YXIgc2Vjb25kcywgbWludXRlcywgaG91cnMsIHllYXJzLCBtb250aHNGcm9tRGF5cztcblxuICAgIC8vIGlmIHdlIGhhdmUgYSBtaXggb2YgcG9zaXRpdmUgYW5kIG5lZ2F0aXZlIHZhbHVlcywgYnViYmxlIGRvd24gZmlyc3RcbiAgICAvLyBjaGVjazogaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzIxNjZcbiAgICBpZiAoISgobWlsbGlzZWNvbmRzID49IDAgJiYgZGF5cyA+PSAwICYmIG1vbnRocyA+PSAwKSB8fFxuICAgICAgICAgICAgKG1pbGxpc2Vjb25kcyA8PSAwICYmIGRheXMgPD0gMCAmJiBtb250aHMgPD0gMCkpKSB7XG4gICAgICAgIG1pbGxpc2Vjb25kcyArPSBhYnNDZWlsKG1vbnRoc1RvRGF5cyhtb250aHMpICsgZGF5cykgKiA4NjRlNTtcbiAgICAgICAgZGF5cyA9IDA7XG4gICAgICAgIG1vbnRocyA9IDA7XG4gICAgfVxuXG4gICAgLy8gVGhlIGZvbGxvd2luZyBjb2RlIGJ1YmJsZXMgdXAgdmFsdWVzLCBzZWUgdGhlIHRlc3RzIGZvclxuICAgIC8vIGV4YW1wbGVzIG9mIHdoYXQgdGhhdCBtZWFucy5cbiAgICBkYXRhLm1pbGxpc2Vjb25kcyA9IG1pbGxpc2Vjb25kcyAlIDEwMDA7XG5cbiAgICBzZWNvbmRzICAgICAgICAgICA9IGFic0Zsb29yKG1pbGxpc2Vjb25kcyAvIDEwMDApO1xuICAgIGRhdGEuc2Vjb25kcyAgICAgID0gc2Vjb25kcyAlIDYwO1xuXG4gICAgbWludXRlcyAgICAgICAgICAgPSBhYnNGbG9vcihzZWNvbmRzIC8gNjApO1xuICAgIGRhdGEubWludXRlcyAgICAgID0gbWludXRlcyAlIDYwO1xuXG4gICAgaG91cnMgICAgICAgICAgICAgPSBhYnNGbG9vcihtaW51dGVzIC8gNjApO1xuICAgIGRhdGEuaG91cnMgICAgICAgID0gaG91cnMgJSAyNDtcblxuICAgIGRheXMgKz0gYWJzRmxvb3IoaG91cnMgLyAyNCk7XG5cbiAgICAvLyBjb252ZXJ0IGRheXMgdG8gbW9udGhzXG4gICAgbW9udGhzRnJvbURheXMgPSBhYnNGbG9vcihkYXlzVG9Nb250aHMoZGF5cykpO1xuICAgIG1vbnRocyArPSBtb250aHNGcm9tRGF5cztcbiAgICBkYXlzIC09IGFic0NlaWwobW9udGhzVG9EYXlzKG1vbnRoc0Zyb21EYXlzKSk7XG5cbiAgICAvLyAxMiBtb250aHMgLT4gMSB5ZWFyXG4gICAgeWVhcnMgPSBhYnNGbG9vcihtb250aHMgLyAxMik7XG4gICAgbW9udGhzICU9IDEyO1xuXG4gICAgZGF0YS5kYXlzICAgPSBkYXlzO1xuICAgIGRhdGEubW9udGhzID0gbW9udGhzO1xuICAgIGRhdGEueWVhcnMgID0geWVhcnM7XG5cbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gZGF5c1RvTW9udGhzIChkYXlzKSB7XG4gICAgLy8gNDAwIHllYXJzIGhhdmUgMTQ2MDk3IGRheXMgKHRha2luZyBpbnRvIGFjY291bnQgbGVhcCB5ZWFyIHJ1bGVzKVxuICAgIC8vIDQwMCB5ZWFycyBoYXZlIDEyIG1vbnRocyA9PT0gNDgwMFxuICAgIHJldHVybiBkYXlzICogNDgwMCAvIDE0NjA5Nztcbn1cblxuZnVuY3Rpb24gbW9udGhzVG9EYXlzIChtb250aHMpIHtcbiAgICAvLyB0aGUgcmV2ZXJzZSBvZiBkYXlzVG9Nb250aHNcbiAgICByZXR1cm4gbW9udGhzICogMTQ2MDk3IC8gNDgwMDtcbn1cblxuZnVuY3Rpb24gYXMgKHVuaXRzKSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gTmFOO1xuICAgIH1cbiAgICB2YXIgZGF5cztcbiAgICB2YXIgbW9udGhzO1xuICAgIHZhciBtaWxsaXNlY29uZHMgPSB0aGlzLl9taWxsaXNlY29uZHM7XG5cbiAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcblxuICAgIGlmICh1bml0cyA9PT0gJ21vbnRoJyB8fCB1bml0cyA9PT0gJ3llYXInKSB7XG4gICAgICAgIGRheXMgICA9IHRoaXMuX2RheXMgICArIG1pbGxpc2Vjb25kcyAvIDg2NGU1O1xuICAgICAgICBtb250aHMgPSB0aGlzLl9tb250aHMgKyBkYXlzVG9Nb250aHMoZGF5cyk7XG4gICAgICAgIHJldHVybiB1bml0cyA9PT0gJ21vbnRoJyA/IG1vbnRocyA6IG1vbnRocyAvIDEyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGhhbmRsZSBtaWxsaXNlY29uZHMgc2VwYXJhdGVseSBiZWNhdXNlIG9mIGZsb2F0aW5nIHBvaW50IG1hdGggZXJyb3JzIChpc3N1ZSAjMTg2NylcbiAgICAgICAgZGF5cyA9IHRoaXMuX2RheXMgKyBNYXRoLnJvdW5kKG1vbnRoc1RvRGF5cyh0aGlzLl9tb250aHMpKTtcbiAgICAgICAgc3dpdGNoICh1bml0cykge1xuICAgICAgICAgICAgY2FzZSAnd2VlaycgICA6IHJldHVybiBkYXlzIC8gNyAgICAgKyBtaWxsaXNlY29uZHMgLyA2MDQ4ZTU7XG4gICAgICAgICAgICBjYXNlICdkYXknICAgIDogcmV0dXJuIGRheXMgICAgICAgICArIG1pbGxpc2Vjb25kcyAvIDg2NGU1O1xuICAgICAgICAgICAgY2FzZSAnaG91cicgICA6IHJldHVybiBkYXlzICogMjQgICAgKyBtaWxsaXNlY29uZHMgLyAzNmU1O1xuICAgICAgICAgICAgY2FzZSAnbWludXRlJyA6IHJldHVybiBkYXlzICogMTQ0MCAgKyBtaWxsaXNlY29uZHMgLyA2ZTQ7XG4gICAgICAgICAgICBjYXNlICdzZWNvbmQnIDogcmV0dXJuIGRheXMgKiA4NjQwMCArIG1pbGxpc2Vjb25kcyAvIDEwMDA7XG4gICAgICAgICAgICAvLyBNYXRoLmZsb29yIHByZXZlbnRzIGZsb2F0aW5nIHBvaW50IG1hdGggZXJyb3JzIGhlcmVcbiAgICAgICAgICAgIGNhc2UgJ21pbGxpc2Vjb25kJzogcmV0dXJuIE1hdGguZmxvb3IoZGF5cyAqIDg2NGU1KSArIG1pbGxpc2Vjb25kcztcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcignVW5rbm93biB1bml0ICcgKyB1bml0cyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIFRPRE86IFVzZSB0aGlzLmFzKCdtcycpP1xuZnVuY3Rpb24gdmFsdWVPZiQxICgpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiBOYU47XG4gICAgfVxuICAgIHJldHVybiAoXG4gICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyArXG4gICAgICAgIHRoaXMuX2RheXMgKiA4NjRlNSArXG4gICAgICAgICh0aGlzLl9tb250aHMgJSAxMikgKiAyNTkyZTYgK1xuICAgICAgICB0b0ludCh0aGlzLl9tb250aHMgLyAxMikgKiAzMTUzNmU2XG4gICAgKTtcbn1cblxuZnVuY3Rpb24gbWFrZUFzIChhbGlhcykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFzKGFsaWFzKTtcbiAgICB9O1xufVxuXG52YXIgYXNNaWxsaXNlY29uZHMgPSBtYWtlQXMoJ21zJyk7XG52YXIgYXNTZWNvbmRzICAgICAgPSBtYWtlQXMoJ3MnKTtcbnZhciBhc01pbnV0ZXMgICAgICA9IG1ha2VBcygnbScpO1xudmFyIGFzSG91cnMgICAgICAgID0gbWFrZUFzKCdoJyk7XG52YXIgYXNEYXlzICAgICAgICAgPSBtYWtlQXMoJ2QnKTtcbnZhciBhc1dlZWtzICAgICAgICA9IG1ha2VBcygndycpO1xudmFyIGFzTW9udGhzICAgICAgID0gbWFrZUFzKCdNJyk7XG52YXIgYXNZZWFycyAgICAgICAgPSBtYWtlQXMoJ3knKTtcblxuZnVuY3Rpb24gY2xvbmUkMSAoKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUR1cmF0aW9uKHRoaXMpO1xufVxuXG5mdW5jdGlvbiBnZXQkMiAodW5pdHMpIHtcbiAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgPyB0aGlzW3VuaXRzICsgJ3MnXSgpIDogTmFOO1xufVxuXG5mdW5jdGlvbiBtYWtlR2V0dGVyKG5hbWUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgPyB0aGlzLl9kYXRhW25hbWVdIDogTmFOO1xuICAgIH07XG59XG5cbnZhciBtaWxsaXNlY29uZHMgPSBtYWtlR2V0dGVyKCdtaWxsaXNlY29uZHMnKTtcbnZhciBzZWNvbmRzICAgICAgPSBtYWtlR2V0dGVyKCdzZWNvbmRzJyk7XG52YXIgbWludXRlcyAgICAgID0gbWFrZUdldHRlcignbWludXRlcycpO1xudmFyIGhvdXJzICAgICAgICA9IG1ha2VHZXR0ZXIoJ2hvdXJzJyk7XG52YXIgZGF5cyAgICAgICAgID0gbWFrZUdldHRlcignZGF5cycpO1xudmFyIG1vbnRocyAgICAgICA9IG1ha2VHZXR0ZXIoJ21vbnRocycpO1xudmFyIHllYXJzICAgICAgICA9IG1ha2VHZXR0ZXIoJ3llYXJzJyk7XG5cbmZ1bmN0aW9uIHdlZWtzICgpIHtcbiAgICByZXR1cm4gYWJzRmxvb3IodGhpcy5kYXlzKCkgLyA3KTtcbn1cblxudmFyIHJvdW5kID0gTWF0aC5yb3VuZDtcbnZhciB0aHJlc2hvbGRzID0ge1xuICAgIHNzOiA0NCwgICAgICAgICAvLyBhIGZldyBzZWNvbmRzIHRvIHNlY29uZHNcbiAgICBzIDogNDUsICAgICAgICAgLy8gc2Vjb25kcyB0byBtaW51dGVcbiAgICBtIDogNDUsICAgICAgICAgLy8gbWludXRlcyB0byBob3VyXG4gICAgaCA6IDIyLCAgICAgICAgIC8vIGhvdXJzIHRvIGRheVxuICAgIGQgOiAyNiwgICAgICAgICAvLyBkYXlzIHRvIG1vbnRoXG4gICAgTSA6IDExICAgICAgICAgIC8vIG1vbnRocyB0byB5ZWFyXG59O1xuXG4vLyBoZWxwZXIgZnVuY3Rpb24gZm9yIG1vbWVudC5mbi5mcm9tLCBtb21lbnQuZm4uZnJvbU5vdywgYW5kIG1vbWVudC5kdXJhdGlvbi5mbi5odW1hbml6ZVxuZnVuY3Rpb24gc3Vic3RpdHV0ZVRpbWVBZ28oc3RyaW5nLCBudW1iZXIsIHdpdGhvdXRTdWZmaXgsIGlzRnV0dXJlLCBsb2NhbGUpIHtcbiAgICByZXR1cm4gbG9jYWxlLnJlbGF0aXZlVGltZShudW1iZXIgfHwgMSwgISF3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKTtcbn1cblxuZnVuY3Rpb24gcmVsYXRpdmVUaW1lJDEgKHBvc05lZ0R1cmF0aW9uLCB3aXRob3V0U3VmZml4LCBsb2NhbGUpIHtcbiAgICB2YXIgZHVyYXRpb24gPSBjcmVhdGVEdXJhdGlvbihwb3NOZWdEdXJhdGlvbikuYWJzKCk7XG4gICAgdmFyIHNlY29uZHMgID0gcm91bmQoZHVyYXRpb24uYXMoJ3MnKSk7XG4gICAgdmFyIG1pbnV0ZXMgID0gcm91bmQoZHVyYXRpb24uYXMoJ20nKSk7XG4gICAgdmFyIGhvdXJzICAgID0gcm91bmQoZHVyYXRpb24uYXMoJ2gnKSk7XG4gICAgdmFyIGRheXMgICAgID0gcm91bmQoZHVyYXRpb24uYXMoJ2QnKSk7XG4gICAgdmFyIG1vbnRocyAgID0gcm91bmQoZHVyYXRpb24uYXMoJ00nKSk7XG4gICAgdmFyIHllYXJzICAgID0gcm91bmQoZHVyYXRpb24uYXMoJ3knKSk7XG5cbiAgICB2YXIgYSA9IHNlY29uZHMgPD0gdGhyZXNob2xkcy5zcyAmJiBbJ3MnLCBzZWNvbmRzXSAgfHxcbiAgICAgICAgICAgIHNlY29uZHMgPCB0aHJlc2hvbGRzLnMgICAmJiBbJ3NzJywgc2Vjb25kc10gfHxcbiAgICAgICAgICAgIG1pbnV0ZXMgPD0gMSAgICAgICAgICAgICAmJiBbJ20nXSAgICAgICAgICAgfHxcbiAgICAgICAgICAgIG1pbnV0ZXMgPCB0aHJlc2hvbGRzLm0gICAmJiBbJ21tJywgbWludXRlc10gfHxcbiAgICAgICAgICAgIGhvdXJzICAgPD0gMSAgICAgICAgICAgICAmJiBbJ2gnXSAgICAgICAgICAgfHxcbiAgICAgICAgICAgIGhvdXJzICAgPCB0aHJlc2hvbGRzLmggICAmJiBbJ2hoJywgaG91cnNdICAgfHxcbiAgICAgICAgICAgIGRheXMgICAgPD0gMSAgICAgICAgICAgICAmJiBbJ2QnXSAgICAgICAgICAgfHxcbiAgICAgICAgICAgIGRheXMgICAgPCB0aHJlc2hvbGRzLmQgICAmJiBbJ2RkJywgZGF5c10gICAgfHxcbiAgICAgICAgICAgIG1vbnRocyAgPD0gMSAgICAgICAgICAgICAmJiBbJ00nXSAgICAgICAgICAgfHxcbiAgICAgICAgICAgIG1vbnRocyAgPCB0aHJlc2hvbGRzLk0gICAmJiBbJ01NJywgbW9udGhzXSAgfHxcbiAgICAgICAgICAgIHllYXJzICAgPD0gMSAgICAgICAgICAgICAmJiBbJ3knXSAgICAgICAgICAgfHwgWyd5eScsIHllYXJzXTtcblxuICAgIGFbMl0gPSB3aXRob3V0U3VmZml4O1xuICAgIGFbM10gPSArcG9zTmVnRHVyYXRpb24gPiAwO1xuICAgIGFbNF0gPSBsb2NhbGU7XG4gICAgcmV0dXJuIHN1YnN0aXR1dGVUaW1lQWdvLmFwcGx5KG51bGwsIGEpO1xufVxuXG4vLyBUaGlzIGZ1bmN0aW9uIGFsbG93cyB5b3UgdG8gc2V0IHRoZSByb3VuZGluZyBmdW5jdGlvbiBmb3IgcmVsYXRpdmUgdGltZSBzdHJpbmdzXG5mdW5jdGlvbiBnZXRTZXRSZWxhdGl2ZVRpbWVSb3VuZGluZyAocm91bmRpbmdGdW5jdGlvbikge1xuICAgIGlmIChyb3VuZGluZ0Z1bmN0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHJvdW5kO1xuICAgIH1cbiAgICBpZiAodHlwZW9mKHJvdW5kaW5nRnVuY3Rpb24pID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJvdW5kID0gcm91bmRpbmdGdW5jdGlvbjtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLy8gVGhpcyBmdW5jdGlvbiBhbGxvd3MgeW91IHRvIHNldCBhIHRocmVzaG9sZCBmb3IgcmVsYXRpdmUgdGltZSBzdHJpbmdzXG5mdW5jdGlvbiBnZXRTZXRSZWxhdGl2ZVRpbWVUaHJlc2hvbGQgKHRocmVzaG9sZCwgbGltaXQpIHtcbiAgICBpZiAodGhyZXNob2xkc1t0aHJlc2hvbGRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAobGltaXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdGhyZXNob2xkc1t0aHJlc2hvbGRdO1xuICAgIH1cbiAgICB0aHJlc2hvbGRzW3RocmVzaG9sZF0gPSBsaW1pdDtcbiAgICBpZiAodGhyZXNob2xkID09PSAncycpIHtcbiAgICAgICAgdGhyZXNob2xkcy5zcyA9IGxpbWl0IC0gMTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGh1bWFuaXplICh3aXRoU3VmZml4KSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkuaW52YWxpZERhdGUoKTtcbiAgICB9XG5cbiAgICB2YXIgbG9jYWxlID0gdGhpcy5sb2NhbGVEYXRhKCk7XG4gICAgdmFyIG91dHB1dCA9IHJlbGF0aXZlVGltZSQxKHRoaXMsICF3aXRoU3VmZml4LCBsb2NhbGUpO1xuXG4gICAgaWYgKHdpdGhTdWZmaXgpIHtcbiAgICAgICAgb3V0cHV0ID0gbG9jYWxlLnBhc3RGdXR1cmUoK3RoaXMsIG91dHB1dCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxvY2FsZS5wb3N0Zm9ybWF0KG91dHB1dCk7XG59XG5cbnZhciBhYnMkMSA9IE1hdGguYWJzO1xuXG5mdW5jdGlvbiBzaWduKHgpIHtcbiAgICByZXR1cm4gKCh4ID4gMCkgLSAoeCA8IDApKSB8fCAreDtcbn1cblxuZnVuY3Rpb24gdG9JU09TdHJpbmckMSgpIHtcbiAgICAvLyBmb3IgSVNPIHN0cmluZ3Mgd2UgZG8gbm90IHVzZSB0aGUgbm9ybWFsIGJ1YmJsaW5nIHJ1bGVzOlxuICAgIC8vICAqIG1pbGxpc2Vjb25kcyBidWJibGUgdXAgdW50aWwgdGhleSBiZWNvbWUgaG91cnNcbiAgICAvLyAgKiBkYXlzIGRvIG5vdCBidWJibGUgYXQgYWxsXG4gICAgLy8gICogbW9udGhzIGJ1YmJsZSB1cCB1bnRpbCB0aGV5IGJlY29tZSB5ZWFyc1xuICAgIC8vIFRoaXMgaXMgYmVjYXVzZSB0aGVyZSBpcyBubyBjb250ZXh0LWZyZWUgY29udmVyc2lvbiBiZXR3ZWVuIGhvdXJzIGFuZCBkYXlzXG4gICAgLy8gKHRoaW5rIG9mIGNsb2NrIGNoYW5nZXMpXG4gICAgLy8gYW5kIGFsc28gbm90IGJldHdlZW4gZGF5cyBhbmQgbW9udGhzICgyOC0zMSBkYXlzIHBlciBtb250aClcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS5pbnZhbGlkRGF0ZSgpO1xuICAgIH1cblxuICAgIHZhciBzZWNvbmRzID0gYWJzJDEodGhpcy5fbWlsbGlzZWNvbmRzKSAvIDEwMDA7XG4gICAgdmFyIGRheXMgICAgICAgICA9IGFicyQxKHRoaXMuX2RheXMpO1xuICAgIHZhciBtb250aHMgICAgICAgPSBhYnMkMSh0aGlzLl9tb250aHMpO1xuICAgIHZhciBtaW51dGVzLCBob3VycywgeWVhcnM7XG5cbiAgICAvLyAzNjAwIHNlY29uZHMgLT4gNjAgbWludXRlcyAtPiAxIGhvdXJcbiAgICBtaW51dGVzICAgICAgICAgICA9IGFic0Zsb29yKHNlY29uZHMgLyA2MCk7XG4gICAgaG91cnMgICAgICAgICAgICAgPSBhYnNGbG9vcihtaW51dGVzIC8gNjApO1xuICAgIHNlY29uZHMgJT0gNjA7XG4gICAgbWludXRlcyAlPSA2MDtcblxuICAgIC8vIDEyIG1vbnRocyAtPiAxIHllYXJcbiAgICB5ZWFycyAgPSBhYnNGbG9vcihtb250aHMgLyAxMik7XG4gICAgbW9udGhzICU9IDEyO1xuXG5cbiAgICAvLyBpbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vZG9yZGlsbGUvbW9tZW50LWlzb2R1cmF0aW9uL2Jsb2IvbWFzdGVyL21vbWVudC5pc29kdXJhdGlvbi5qc1xuICAgIHZhciBZID0geWVhcnM7XG4gICAgdmFyIE0gPSBtb250aHM7XG4gICAgdmFyIEQgPSBkYXlzO1xuICAgIHZhciBoID0gaG91cnM7XG4gICAgdmFyIG0gPSBtaW51dGVzO1xuICAgIHZhciBzID0gc2Vjb25kcyA/IHNlY29uZHMudG9GaXhlZCgzKS5yZXBsYWNlKC9cXC4/MCskLywgJycpIDogJyc7XG4gICAgdmFyIHRvdGFsID0gdGhpcy5hc1NlY29uZHMoKTtcblxuICAgIGlmICghdG90YWwpIHtcbiAgICAgICAgLy8gdGhpcyBpcyB0aGUgc2FtZSBhcyBDIydzIChOb2RhKSBhbmQgcHl0aG9uIChpc29kYXRlKS4uLlxuICAgICAgICAvLyBidXQgbm90IG90aGVyIEpTIChnb29nLmRhdGUpXG4gICAgICAgIHJldHVybiAnUDBEJztcbiAgICB9XG5cbiAgICB2YXIgdG90YWxTaWduID0gdG90YWwgPCAwID8gJy0nIDogJyc7XG4gICAgdmFyIHltU2lnbiA9IHNpZ24odGhpcy5fbW9udGhzKSAhPT0gc2lnbih0b3RhbCkgPyAnLScgOiAnJztcbiAgICB2YXIgZGF5c1NpZ24gPSBzaWduKHRoaXMuX2RheXMpICE9PSBzaWduKHRvdGFsKSA/ICctJyA6ICcnO1xuICAgIHZhciBobXNTaWduID0gc2lnbih0aGlzLl9taWxsaXNlY29uZHMpICE9PSBzaWduKHRvdGFsKSA/ICctJyA6ICcnO1xuXG4gICAgcmV0dXJuIHRvdGFsU2lnbiArICdQJyArXG4gICAgICAgIChZID8geW1TaWduICsgWSArICdZJyA6ICcnKSArXG4gICAgICAgIChNID8geW1TaWduICsgTSArICdNJyA6ICcnKSArXG4gICAgICAgIChEID8gZGF5c1NpZ24gKyBEICsgJ0QnIDogJycpICtcbiAgICAgICAgKChoIHx8IG0gfHwgcykgPyAnVCcgOiAnJykgK1xuICAgICAgICAoaCA/IGhtc1NpZ24gKyBoICsgJ0gnIDogJycpICtcbiAgICAgICAgKG0gPyBobXNTaWduICsgbSArICdNJyA6ICcnKSArXG4gICAgICAgIChzID8gaG1zU2lnbiArIHMgKyAnUycgOiAnJyk7XG59XG5cbnZhciBwcm90byQyID0gRHVyYXRpb24ucHJvdG90eXBlO1xuXG5wcm90byQyLmlzVmFsaWQgICAgICAgID0gaXNWYWxpZCQxO1xucHJvdG8kMi5hYnMgICAgICAgICAgICA9IGFicztcbnByb3RvJDIuYWRkICAgICAgICAgICAgPSBhZGQkMTtcbnByb3RvJDIuc3VidHJhY3QgICAgICAgPSBzdWJ0cmFjdCQxO1xucHJvdG8kMi5hcyAgICAgICAgICAgICA9IGFzO1xucHJvdG8kMi5hc01pbGxpc2Vjb25kcyA9IGFzTWlsbGlzZWNvbmRzO1xucHJvdG8kMi5hc1NlY29uZHMgICAgICA9IGFzU2Vjb25kcztcbnByb3RvJDIuYXNNaW51dGVzICAgICAgPSBhc01pbnV0ZXM7XG5wcm90byQyLmFzSG91cnMgICAgICAgID0gYXNIb3VycztcbnByb3RvJDIuYXNEYXlzICAgICAgICAgPSBhc0RheXM7XG5wcm90byQyLmFzV2Vla3MgICAgICAgID0gYXNXZWVrcztcbnByb3RvJDIuYXNNb250aHMgICAgICAgPSBhc01vbnRocztcbnByb3RvJDIuYXNZZWFycyAgICAgICAgPSBhc1llYXJzO1xucHJvdG8kMi52YWx1ZU9mICAgICAgICA9IHZhbHVlT2YkMTtcbnByb3RvJDIuX2J1YmJsZSAgICAgICAgPSBidWJibGU7XG5wcm90byQyLmNsb25lICAgICAgICAgID0gY2xvbmUkMTtcbnByb3RvJDIuZ2V0ICAgICAgICAgICAgPSBnZXQkMjtcbnByb3RvJDIubWlsbGlzZWNvbmRzICAgPSBtaWxsaXNlY29uZHM7XG5wcm90byQyLnNlY29uZHMgICAgICAgID0gc2Vjb25kcztcbnByb3RvJDIubWludXRlcyAgICAgICAgPSBtaW51dGVzO1xucHJvdG8kMi5ob3VycyAgICAgICAgICA9IGhvdXJzO1xucHJvdG8kMi5kYXlzICAgICAgICAgICA9IGRheXM7XG5wcm90byQyLndlZWtzICAgICAgICAgID0gd2Vla3M7XG5wcm90byQyLm1vbnRocyAgICAgICAgID0gbW9udGhzO1xucHJvdG8kMi55ZWFycyAgICAgICAgICA9IHllYXJzO1xucHJvdG8kMi5odW1hbml6ZSAgICAgICA9IGh1bWFuaXplO1xucHJvdG8kMi50b0lTT1N0cmluZyAgICA9IHRvSVNPU3RyaW5nJDE7XG5wcm90byQyLnRvU3RyaW5nICAgICAgID0gdG9JU09TdHJpbmckMTtcbnByb3RvJDIudG9KU09OICAgICAgICAgPSB0b0lTT1N0cmluZyQxO1xucHJvdG8kMi5sb2NhbGUgICAgICAgICA9IGxvY2FsZTtcbnByb3RvJDIubG9jYWxlRGF0YSAgICAgPSBsb2NhbGVEYXRhO1xuXG4vLyBEZXByZWNhdGlvbnNcbnByb3RvJDIudG9Jc29TdHJpbmcgPSBkZXByZWNhdGUoJ3RvSXNvU3RyaW5nKCkgaXMgZGVwcmVjYXRlZC4gUGxlYXNlIHVzZSB0b0lTT1N0cmluZygpIGluc3RlYWQgKG5vdGljZSB0aGUgY2FwaXRhbHMpJywgdG9JU09TdHJpbmckMSk7XG5wcm90byQyLmxhbmcgPSBsYW5nO1xuXG4vLyBTaWRlIGVmZmVjdCBpbXBvcnRzXG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ1gnLCAwLCAwLCAndW5peCcpO1xuYWRkRm9ybWF0VG9rZW4oJ3gnLCAwLCAwLCAndmFsdWVPZicpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ3gnLCBtYXRjaFNpZ25lZCk7XG5hZGRSZWdleFRva2VuKCdYJywgbWF0Y2hUaW1lc3RhbXApO1xuYWRkUGFyc2VUb2tlbignWCcsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKHBhcnNlRmxvYXQoaW5wdXQsIDEwKSAqIDEwMDApO1xufSk7XG5hZGRQYXJzZVRva2VuKCd4JywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgY29uZmlnLl9kID0gbmV3IERhdGUodG9JbnQoaW5wdXQpKTtcbn0pO1xuXG4vLyBTaWRlIGVmZmVjdCBpbXBvcnRzXG5cblxuaG9va3MudmVyc2lvbiA9ICcyLjE5LjInO1xuXG5zZXRIb29rQ2FsbGJhY2soY3JlYXRlTG9jYWwpO1xuXG5ob29rcy5mbiAgICAgICAgICAgICAgICAgICAgPSBwcm90bztcbmhvb2tzLm1pbiAgICAgICAgICAgICAgICAgICA9IG1pbjtcbmhvb2tzLm1heCAgICAgICAgICAgICAgICAgICA9IG1heDtcbmhvb2tzLm5vdyAgICAgICAgICAgICAgICAgICA9IG5vdztcbmhvb2tzLnV0YyAgICAgICAgICAgICAgICAgICA9IGNyZWF0ZVVUQztcbmhvb2tzLnVuaXggICAgICAgICAgICAgICAgICA9IGNyZWF0ZVVuaXg7XG5ob29rcy5tb250aHMgICAgICAgICAgICAgICAgPSBsaXN0TW9udGhzO1xuaG9va3MuaXNEYXRlICAgICAgICAgICAgICAgID0gaXNEYXRlO1xuaG9va3MubG9jYWxlICAgICAgICAgICAgICAgID0gZ2V0U2V0R2xvYmFsTG9jYWxlO1xuaG9va3MuaW52YWxpZCAgICAgICAgICAgICAgID0gY3JlYXRlSW52YWxpZDtcbmhvb2tzLmR1cmF0aW9uICAgICAgICAgICAgICA9IGNyZWF0ZUR1cmF0aW9uO1xuaG9va3MuaXNNb21lbnQgICAgICAgICAgICAgID0gaXNNb21lbnQ7XG5ob29rcy53ZWVrZGF5cyAgICAgICAgICAgICAgPSBsaXN0V2Vla2RheXM7XG5ob29rcy5wYXJzZVpvbmUgICAgICAgICAgICAgPSBjcmVhdGVJblpvbmU7XG5ob29rcy5sb2NhbGVEYXRhICAgICAgICAgICAgPSBnZXRMb2NhbGU7XG5ob29rcy5pc0R1cmF0aW9uICAgICAgICAgICAgPSBpc0R1cmF0aW9uO1xuaG9va3MubW9udGhzU2hvcnQgICAgICAgICAgID0gbGlzdE1vbnRoc1Nob3J0O1xuaG9va3Mud2Vla2RheXNNaW4gICAgICAgICAgID0gbGlzdFdlZWtkYXlzTWluO1xuaG9va3MuZGVmaW5lTG9jYWxlICAgICAgICAgID0gZGVmaW5lTG9jYWxlO1xuaG9va3MudXBkYXRlTG9jYWxlICAgICAgICAgID0gdXBkYXRlTG9jYWxlO1xuaG9va3MubG9jYWxlcyAgICAgICAgICAgICAgID0gbGlzdExvY2FsZXM7XG5ob29rcy53ZWVrZGF5c1Nob3J0ICAgICAgICAgPSBsaXN0V2Vla2RheXNTaG9ydDtcbmhvb2tzLm5vcm1hbGl6ZVVuaXRzICAgICAgICA9IG5vcm1hbGl6ZVVuaXRzO1xuaG9va3MucmVsYXRpdmVUaW1lUm91bmRpbmcgID0gZ2V0U2V0UmVsYXRpdmVUaW1lUm91bmRpbmc7XG5ob29rcy5yZWxhdGl2ZVRpbWVUaHJlc2hvbGQgPSBnZXRTZXRSZWxhdGl2ZVRpbWVUaHJlc2hvbGQ7XG5ob29rcy5jYWxlbmRhckZvcm1hdCAgICAgICAgPSBnZXRDYWxlbmRhckZvcm1hdDtcbmhvb2tzLnByb3RvdHlwZSAgICAgICAgICAgICA9IHByb3RvO1xuXG5yZXR1cm4gaG9va3M7XG5cbn0pKSk7XG4iXX0=
