/** Common functions for the sprite package. */
define(function(require, exports){
    var dr = require('../dr.js');
    var JS = require('../../../../../lib/jsclass.js');
    
    dr.sprite = {
        /** Based on browser detection from: http://www.quirksmode.org/js/detect.html
            
            Events:
                none
            
            Attributes:
                browser:string The browser name.
                version:number The browser version number.
                os:string The operating system.
        */
        platform: (function() {
            var versionSearchString,
                
                searchString = function(data) {
                    var dataItem, i = data.length;
                    while (i) {
                        dataItem = data[--i];
                        versionSearchString = dataItem.ver || dataItem.id;
                        if ((dataItem.str && dataItem.str.indexOf(dataItem.sub) >= 0) || dataItem.prop) return dataItem.id;
                    }
                },
                
                searchVersion = function(dataString) {
                    var index = dataString.indexOf(versionSearchString);
                    if (index >= 0) return parseFloat(dataString.substring(index + versionSearchString.length + 1));
                },
                
                userAgent = navigator.userAgent, 
                platform = navigator.platform, 
                unknown = 'UNKNOWN';
            
            return {
                browser:searchString([
                    {str:userAgent,        sub:"OmniWeb", id:"OmniWeb",  ver:"OmniWeb/"},
                    {prop:window.opera,                   id:"Opera",    ver:"Version"},
                    {str:navigator.vendor, sub:"Apple",   id:"Safari",   ver:"Version"},
                    {str:userAgent,        sub:"Firefox", id:"Firefox"},
                    {str:userAgent,        sub:"Chrome",  id:"Chrome"},
                    {str:userAgent,        sub:"MSIE",    id:"Explorer", ver:"MSIE"}
                ]) || unknown,
                
                version:searchVersion(userAgent) || searchVersion(navigator.appVersion) || unknown,
                
                os:searchString([
                    {str:userAgent, sub:"iPhone", id:"iPhone/iPod"},
                    {str:platform,  sub:"Linux",  id:"Linux"},
                    {str:platform,  sub:"Mac",    id:"Mac"},
                    {str:platform,  sub:"Win",    id:"Windows"}
                ]) || unknown,
                
                prefix:(
                    function() {
                        var styles = global.getComputedStyle(document.documentElement, '');
                        var pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1];
                        var dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
                        return {
                            dom:dom,
                            lowercase:pre,
                            css:'-' + pre + '-',
                            js:pre[0].toUpperCase() + pre.substr(1)
                        }
                    }
                )()
            };
        })(),
    
        // Error Console
        set_stackTraceLimit: function(v) {
            Error.stackTraceLimit = v;
            return v;
        },
        
        generateStacktrace: function(eventType, msg, err) {
            if (!err) err = new Error(msg || eventType);
            return err.stack || err.stacktrace;
        },
        
        console: {
            debug: function(msg) {console.debug(msg);},
            info: function(msg) {console.info(msg);},
            warn: function(msg) {console.warn(msg);},
            error: function(msg) {console.error(msg);}
        },
        
        // Event Listener Support
        /** Event listener code Adapted from:
                http://javascript.about.com/library/bllisten.htm
            A more robust solution can be found here:
                http://msdn.microsoft.com/en-us/magazine/ff728624.aspx */
        addEventListener: function() {
            if (global.addEventListener) {
                /** Adds an event listener to a dom element. 
                    @param elem:DomElement the dom element to listen to.
                    @param type:string the name of the event to listen to.
                    @param callback:function the callback function that will be
                        registered for the event.
                    @param capture:boolean (optional) indicates if the listener is 
                        registered during the capture phase or bubble phase.
                    @returns void */
                return function(elem, type, callback, capture) {
                    elem.addEventListener(type, callback, capture || false);
                };
            } else {
                return function(elem, type, callback) {
                    var prop = type + callback;
                    elem['e' + prop] = callback;
                    elem[prop] = function(){elem['e' + prop](window.event);}
                    elem.attachEvent('on' + type, elem[prop]);
                };
            }
        }(),
        removeEventListener: function() {
            if (global.addEventListener) {
                return function(elem, type, callback, capture) {
                    elem.removeEventListener(type, callback, capture || false);
                };
            } else {
                return function(elem, type, callback) {
                    var prop = type + callback;
                    elem.detachEvent('on' + type, elem[prop]);
                    elem[prop] = null;
                    elem["e" + prop] = null;
                };
            }
        }(),
        
        preventDefault: function(platformEvent) {
            platformEvent.preventDefault();
        },
        
        // Focus Management
        focus: {
            lastTraversalWasForward: true,
            focusedView: null,
            prevFocusedView: null,
            focusedDom: null,
            
            /** Sets the currently focused view. */
            set_focusedView: function(v) {
                if (this.focusedView !== v) {
                    this.prevFocusedView = this.focusedView; // Remember previous focus
                    this.focusedView = v;
                    if (v) this.focusedDom = null; // Wipe this since we have actual focus now.
                    return true;
                } else {
                    return false;
                }
            },
            
            /** Called by a FocusObservable when it has received focus.
                @param focusable:FocusObservable the view that received focus.
                @returns void. */
            notifyFocus: function(focusable) {
                if (this.focusedView !== focusable) dr.global.focus.set_focusedView(focusable);
            },
            
            /** Called by a FocusObservable when it has lost focus.
                @param focusable:FocusObservable the view that lost focus.
                @returns void. */
            notifyBlur: function(focusable) {
                if (this.focusedView === focusable) dr.global.focus.set_focusedView(null);
            },
            
            /** Clears the current focus.
                @returns void */
            clear: function() {
                if (this.focusedView) {
                    this.focusedView.blur();
                } else if (this.focusedDom) {
                    this.focusedDom.blur();
                    this.focusedDom = null;
                }
            },
            
            /** Move focus to the next focusable element.
                @param ignoreFocusTrap:boolean If true focus traps will be skipped over.
                @returns void */
            next: function(ignoreFocusTrap) {
                var next = this.__focusTraverse(true, ignoreFocusTrap);
                if (next) next.focus();
            },
            
            /** Move focus to the previous focusable element.
                @param ignoreFocusTrap:boolean If true focus traps will be skipped over.
                @returns void */
            prev: function(ignoreFocusTrap) {
                var prev = this.__focusTraverse(false, ignoreFocusTrap);
                if (prev) prev.focus();
            },
            
            /** Traverse forward or backward from the currently focused view.
                @param isForward:boolean indicates forward or backward dom traversal.
                @param ignoreFocusTrap:boolean indicates if focus traps should be
                    skipped over or not.
                @returns the new view to give focus to, or null if there is no view
                    to focus on or an unmanaged dom element will receive focus. */
            __focusTraverse: function(isForward, ignoreFocusTrap) {
                this.lastTraversalWasForward = isForward;
                
                // Determine root element and starting element for traversal.
                var document = global.document,
                    activeElem = document.activeElement, 
                    rootElem = document.body,
                    startElem = rootElem,
                    elem = startElem,
                    model, progModel,
                    focusFuncName = isForward ? 'getNextFocus' : 'getPrevFocus';
                
                if (activeElem) {
                    elem = startElem = activeElem;
                    model = startElem.model;
                    if (!model) model = this.__findModelForDomElement(startElem);
                    if (model) {
                        var focusTrap = model.view.getFocusTrap(ignoreFocusTrap);
                        if (focusTrap) rootElem = focusTrap.sprite.platformObject;
                    }
                }
                
                // Traverse
                while (elem) {
                    if (elem.model && elem.model.view[focusFuncName] &&
                        (progModel = elem.model.view[focusFuncName]())
                    ) {
                        // Programatic traverse
                        elem = progModel.sprite.platformObject;
                    } else if (isForward) {
                        // Dom traverse forward
                        if (elem.firstChild) {
                            elem = elem.firstChild;
                        } else if (elem === rootElem) {
                            return startElem.model.view; // TODO: why?
                        } else if (elem.nextSibling) {
                            elem = elem.nextSibling;
                        } else {
                            // Jump up and maybe over since we're at a local
                            // deepest last child.
                            while (elem) {
                                elem = elem.parentNode;
                                
                                if (elem === rootElem) {
                                    break; // TODO: why?
                                } else if (elem.nextSibling) {
                                    elem = elem.nextSibling;
                                    break;
                                }
                            }
                        }
                    } else {
                        // Dom traverse backward
                        if (elem === rootElem) {
                            elem = this.__getDeepestDescendant(rootElem);
                        } else if (elem.previousSibling) {
                            elem = this.__getDeepestDescendant(elem.previousSibling);
                        } else {
                            elem = elem.parentNode;
                        }
                    }
                    
                    // If we've looped back around return the starting element.
                    if (elem === startElem) return startElem.model.view;
                    
                    // Check that the element is focusable and return it if it is.
                    if (elem.nodeType === 1) {
                        model = elem.model;
                        if (model && model instanceof dr.sprite.View) {
                            if (model.view.isFocusable()) return model.view;
                        } else {
                            var nodeName = elem.nodeName;
                            if (nodeName === 'A' || nodeName === 'AREA' || 
                                nodeName === 'INPUT' || nodeName === 'TEXTAREA' || 
                                nodeName === 'SELECT' || nodeName === 'BUTTON'
                            ) {
                                if (!elem.disabled && !isNaN(elem.tabIndex) && 
                                    dr.sprite.__isDomElementVisible(elem)
                                ) {
                                    // Make sure the dom element isn't inside a maskfocus
                                    model = this.__findModelForDomElement(elem);
                                    if (model && model.view.searchAncestorsOrSelf(function(n) {return n.maskfocus === true;})) {
                                        // Is a masked dom element so ignore.
                                    } else {
                                        elem.focus();
                                        this.focusedDom = elem;
                                        return null;
                                    }
                                }
                            }
                        }
                    }
                }
                
                return null;
            },
            
            /** Finds the closest model for the provided dom element.
                @param elem:domElement to element to start looking from.
                @returns dr.sprite.View or null if not found.
                @private */
            __findModelForDomElement: function(elem) {
                var model;
                while (elem) {
                    model = elem.model;
                    if (model && model instanceof dr.sprite.View) return model;
                    elem = elem.parentNode;
                }
                return null;
            },
            
            /** Gets the deepest dom element that is a descendant of the provided
                dom element or the element itself.
                @param elem:domElement The dom element to search downward from.
                @returns a dom element.
                @private */
            __getDeepestDescendant: function(elem) {
                while (elem.lastChild) elem = elem.lastChild;
                return elem;
            }
        },
        
        // Dom Utility
        /** Gets the computed style for a dom element.
            @param elem:dom element the dom element to get the style for.
            @returns object the style object. */
        __getComputedStyle: function(elem) {
            // getComputedStyle is IE's proprietary way.
            var g = global;
            return g.getComputedStyle ? g.getComputedStyle(elem, '') : elem.currentStyle;
        },
        
        /** Tests if a dom element is visible or not.
            @param elem:DomElement the element to check visibility for.
            @returns boolean True if visible, false otherwise. */
        __isDomElementVisible: function(elem) {
            // Special Case: hidden input elements should be considered not visible.
            if (elem.nodeName === 'INPUT' && elem.type === 'hidden') return false;
            
            var style;
            while (elem) {
                if (elem === document) return true;
                
                style = this.__getComputedStyle(elem);
                if (style.display === 'none' || style.visibility === 'hidden') break;
                
                elem = elem.parentNode;
            }
            return false;
        }
    };
});
