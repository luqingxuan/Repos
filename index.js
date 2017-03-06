;
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS之类的
        module.exports = factory();
    } else {
        // 浏览器全局变量(root 即 window)
        root.returnExports = factory();
    }
}(this, function() {

    /**
     * ele,dom element
     * pop,dom element
     * cnt,dom element
     * event,
     * alignX: 'inner-left',one of left/center/right/inner-right/inner-left
     * alignY: 'bottom',one of top/center/bottom/inner-bottom/inner-top
     * offsetX: 0,
     * offsetY: 0,
     **/

    // reference jquery source
    var supportBoxsizing = (function() {
        // Support: Firefox<29, Android 2.3
        // Vendor-prefix box-sizing
        var div = document.createElement('div'),
            style = div.style;

        var boxSizing = style.boxSizing === "" || style.MozBoxSizing === "" ||
            style.WebkitBoxSizing === "";

        // free memony
        div = null;

        return boxSizing;
    })();

    // cal scroll bar width, 17px
    var scrollbar = (function() {
        var body = document.body;

        var div = document.createElement('div');
        div.style.cssText = 'height: 50px;overflow: scroll;position: absolute;top: -9999px;width: 50px;';
        body.appendChild(div);

        var width = div.offsetWidth - div.clientWidth;

        body.removeChild(div);

        // free memony
        div = null;

        return width;
    })();

    function isBodyNode(ele) {
        return ele.tagName == 'BODY' ? true : false;
    }

    function isBorderBox(ele) {
        return supportBoxsizing && obtainStyle(ele).boxSizing === 'border-box';
    }

    // 是否有滚动条
    function hasScrollbar(ele) {
        return hasScrollbarX() || hasScrollbarY();
    }

    // 是否有X滚动条
    function hasScrollbarX(ele) {
        var body = isBodyNode(ele);

        var offsetWidth = body ? document.body.offsetWidth || document.documentElement.offsetWidth : ele.offsetWidth;

        var clientWidth = body ? document.body.clientWidth || document.documentElement.clientWidth : ele.clientWidth;

        return offsetWidth - clientWidth;
    }

    // 是否有Y滚动条
    function hasScrollbarY(ele) {
        var body = isBodyNode(ele);

        var offsetHeight = body ? document.body.offsetHeight || document.documentElement.offsetHeight : ele.offsetHeight;

        var clientHeight = body ? document.body.clientHeight || document.documentElement.clientHeight : ele.clientHeight;

        return offsetHeight - clientHeight;
    }

    function obtainWindowRect() {
        var width = window.innerWidth;
        var height = window.innerHeight;

        if (typeof width != 'number') { // IE 5/6/7/8
            if (document.compatMode == 'CSS1Compat') {
                width = document.documentElement.clientWidth;
                height = document.docuementElement.clientHeight;
            } else {
                width = document.body.clientWidth;
                height = document.body.clientHeight;
            }
        }

        return {
            width: width,
            height: height,
            top: window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop,
            left: window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft
        };
    }

    function obtainStyle(ele) {
        // IE or FF
        return ele.currentStyle || getComputedStyle(ele, false);
    }

    function obtainBorderWidth(ele, side) {
        var style = obtainStyle(ele);

        return parseFloat(style[side]);
    }

    function obtainHeight(ele) {
        var style = obtainStyle(ele);

        return parseFloat(style.height);
    }

    function obtainWidth(ele) {
        var style = obtainStyle(ele);

        return parseFloat(style.width);
    }

    function obtainScrollTop(ele) {
        return ele.scrollTop;
    }

    function obtainScrollLeft(ele) {
        return ele.scrollLeft;
    }

    function obtainOuterHeight(ele) {
        if (isBorderBox(ele))
            return obtainHeight(ele);

        var style = obtainStyle(ele);

        return obtainHeight(ele) + obtainBorderWidth(ele, 'borderTopWidth') + obtainBorderWidth(ele, 'borderBottomWidth');
    }

    function obtainOuterWidth(ele) {
        if (isBorderBox(ele))
            return obtainWidth(ele);

        var style = obtainStyle(ele);

        return obtainWidth(ele) + obtainBorderWidth(ele, 'borderLeftWidth') + obtainBorderWidth(ele, 'borderRightWidth');
    }

    // reference jquery source code
    function obtainOffset(ele) {
        var offset = {
            top: 0,
            left: 0
        };

        var doc = ele && ele.ownerDocument;
        if (!doc)
            return offset;

        var docEle = doc.documentElement;

        // If we don't have gBCR, just use 0,0 rather than error
        // BlackBerry 5, iOS 3 (original iPhone)
        if (typeof ele.getBoundingClientRect !== "undefined") {
            offset = ele.getBoundingClientRect();
        }

        var win = doc === window ? doc : doc.nodeType === 9 ? doc.defaultView || doc.parentWindow : false;

        return {
            top: offset.top + (win.pageYOffset || docEle.scrollTop) - (docEle.clientTop || 0),
            left: offset.left + (win.pageXOffset || docEle.scrollLeft) - (docEle.clientLeft || 0)
        };
    }

    //jquery event in case
    function obtainPageX(event) {
        event = event.originalEvent || event;

        return event.pageX || 0;
    }

    //jquery event in case
    function obtainPageY(event) {
        event = event.originalEvent || event;

        return event.pageY || 0;
    }

    function cssRelative(ele) {
        var style = obtainStyle(ele);

        if (!style.position || style.position === 'static')
            ele.style.position = 'relative';
    }

    function calX(opts) {
        // keep in viewport and calc arrow position
        switch (opts.align.x) {
            case 'left':
                // 浮层右侧对齐目标左侧
                opts.axis.left = opts.cntRect.left + opts.eleRect.left + (-opts.popRect.width);

                // 目标元素完全消失在左侧边界
                if (opts.eleRect.left + opts.eleRect.width < 0) {
                    opts.axis.left = opts.cntRect.left + opts.eleRect.left;
                    // 如果浮层宽度大于目标宽度，目标元素消失，浮层也要消失
                    opts.axis.left -= Math.max(opts.popRect.width - opts.eleRect.width, 0);
                    break;
                }

                // 减去Y滚动条宽度
                var bar = hasScrollbarY(opts.cnt) ? scrollbar : 0;

                // 目标元素完全消失在右侧边界
                if (opts.eleRect.left > opts.cntRect.width - bar) {
                    opts.axis.left = opts.eleRect.left + opts.cntRect.left;
                    break;
                }

                // 靠近左侧，目标元素有部分消失在左侧边界
                if (opts.eleRect.left < opts.popRect.width) {
                    opts.axis.left += opts.popRect.width - opts.eleRect.left;
                    break;
                }

                break;
            case 'right':
                // 浮层左侧对齐目标右侧
                opts.axis.left = opts.cntRect.left + opts.eleRect.left + opts.eleRect.width;

                // 目标元素完全消失在左侧边界，那么浮层也要消失
                if (opts.eleRect.left + opts.eleRect.width < 0) {
                    opts.axis.left -= opts.popRect.width;
                    break;
                }

                // 减去Y滚动条宽度
                var bar = hasScrollbarY(opts.cnt) ? scrollbar : 0;

                // 目标元素完全消失在右侧边界
                if (opts.eleRect.left > opts.cntRect.width - bar) {
                    opts.axis.left = opts.eleRect.left + opts.cntRect.left;
                    break;
                }

                // 靠近右侧，目标元素有部分消失在右侧边界
                if (opts.eleRect.left + opts.eleRect.width + opts.popRect.width > opts.cntRect.width - bar) {
                    opts.axis.left -= opts.popRect.width - (opts.cntRect.width - opts.eleRect.left - opts.eleRect.width);

                    // 减去Y滚动条宽度
                    opts.axis.left -= bar;
                }

                if (opts.align.x == 'right' || opts.align.y == 'center')
                    opts.axis.arrow = 'left';

                break;
            case 'inner-left':
                // 目标元素完全消失在左侧边界
                if (opts.eleRect.left + opts.eleRect.width < 0) {
                    opts.axis.left = opts.cntRect.left + opts.eleRect.left;
                    // 如果浮层宽度大于目标宽度，目标元素消失，浮层也要消失
                    opts.axis.left -= Math.max(opts.popRect.width - opts.eleRect.width, 0);
                    break;
                }

                // 靠近左侧,目标元素有部分消失在左侧边界
                if (opts.eleRect.left < 0) {
                    opts.axis.left = opts.cntRect.left;
                    break;
                }

                // 减去Y滚动条宽度
                var bar = hasScrollbarY(opts.cnt) ? scrollbar : 0;

                // 目标元素完全消失在右侧边界
                if (opts.eleRect.left > opts.cntRect.width - bar) {
                    opts.axis.left = opts.eleRect.left + opts.cntRect.left;
                    break;
                }

                // 靠近右侧，目标元素有部分消失在右侧边界
                if (opts.eleRect.left + opts.eleRect.width - (opts.eleRect.width - opts.popRect.width) > opts.cntRect.width - bar) {
                    opts.axis.left = opts.cntRect.left + opts.cntRect.width - opts.popRect.width - bar;
                    break;
                }

                // 整个浮层与目标左对齐显示
                opts.axis.left = opts.cntRect.left + opts.eleRect.left;

                if (opts.align.x == 'right' || opts.align.y == 'center')
                    opts.axis.arrow = 'left';

                break;
            case 'inner-right':
                // 目标元素完全消失在左侧边界
                if (opts.eleRect.left + opts.eleRect.width < 0) {
                    opts.axis.left = opts.cntRect.left + opts.eleRect.left;
                    // 如果浮层宽度大于目标宽度，目标元素消失，浮层也要消失
                    opts.axis.left -= Math.max(opts.popRect.width - opts.eleRect.width, 0);
                    break;
                }

                // 靠近左侧,目标元素有部分消失在左侧边界(考录到浮层宽度大于/小于目标宽度)
                if (opts.eleRect.left + (opts.eleRect.width - opts.popRect.width) < 0) {
                    opts.axis.left = opts.cntRect.left;
                    break;
                }

                // 减去Y滚动条宽度
                var bar = hasScrollbarY(opts.cnt) ? scrollbar : 0;

                // 目标元素完全消失在右侧边界
                if (opts.eleRect.left > opts.cntRect.width - bar) {
                    opts.axis.left = opts.eleRect.left + opts.cntRect.left;
                    break;
                }

                // 靠近右侧，目标元素有部分消失在右侧边界
                if (opts.eleRect.left + opts.eleRect.width > opts.cntRect.width - bar) {
                    opts.axis.left = opts.cntRect.left + opts.cntRect.width - opts.popRect.width - bar;
                    break;
                }

                // 整个浮层与目标左对齐显示
                opts.axis.left = opts.cntRect.left + opts.eleRect.left + opts.eleRect.width - opts.popRect.width;

                if (opts.align.x == 'right' || opts.align.y == 'center')
                    pos.arrow = 'left';

                break;
            case 'center':
                // 目标元素与浮层元素中心对齐
                opts.axis.left = opts.cntRect.left + opts.eleRect.left - (opts.popRect.width - opts.eleRect.width) / 2;

                // 目标元素完全消失在左侧边界
                if (opts.eleRect.left + opts.eleRect.width < 0) {
                    opts.axis.left = opts.cntRect.left + opts.eleRect.left;
                    // 如果浮层宽度大于目标宽度，目标元素消失，浮层也要消失
                    opts.axis.left -= Math.max(opts.popRect.width - opts.eleRect.width, 0);
                    break;
                }

                // 减去Y滚动条宽度
                var bar = hasScrollbarY(opts.cnt) ? scrollbar : 0;

                // 目标元素完全消失在右侧边界
                if (opts.eleRect.left > opts.cntRect.width - bar) {
                    opts.axis.left = opts.eleRect.left + opts.cntRect.left;
                    break;
                }

                // 计算左右侧剩余空间距离大小
                var leftFreeSpace = opts.eleRect.left + (opts.eleRect.width - opts.popRect.width) / 2,
                    rightFreeSpace = opts.cntRect.width - opts.popRect.width - leftFreeSpace - bar;

                // 靠近左侧，左侧没有空间了，而右侧还有
                if (leftFreeSpace < 0 && rightFreeSpace > 0) {
                    opts.axis.left -= leftFreeSpace;
                    break;
                }

                // 靠近右侧，右侧没有空间了，而左侧还有
                if (leftFreeSpace > 0 && rightFreeSpace < 0) {
                    opts.axis.left += rightFreeSpace;
                    break;
                }

                break;

            default:
                break;
        }
    }

    function calY(opts) {
        switch (opts.align.y) {
            case 'top':
                // 浮层右侧对齐目标左侧
                opts.axis.top = opts.cntRect.top + opts.eleRect.top + -opts.popRect.height;

                // 目标元素完全消失在左侧边界
                if (opts.eleRect.top + opts.eleRect.height < 0) {
                    opts.axis.top = opts.cntRect.top + opts.eleRect.top;
                    // 如果浮层宽度大于目标宽度，目标元素消失，浮层也要消失
                    opts.axis.top -= Math.max(opts.popRect.height - opts.eleRect.height, 0);
                    break;
                }

                // 减去Y滚动条宽度
                var bar = hasScrollbarX(opts.cnt) ? scrollbar : 0;

                // 目标元素完全消失在右侧边界
                if (opts.eleRect.top > opts.cntRect.height - bar) {
                    opts.axis.top = opts.eleRect.top + opts.cntRect.top;
                    break;
                }

                // 靠近左侧，目标元素有部分消失在左侧边界
                if (opts.eleRect.top < opts.popRect.height) {
                    opts.axis.top += opts.popRect.height - opts.eleRect.top;
                    break;
                }

                break;
            case 'bottom':
                // 浮层左侧对齐目标右侧
                opts.axis.top = opts.cntRect.top + opts.eleRect.top + opts.eleRect.height;

                // 目标元素完全消失在左侧边界，那么浮层也要消失
                if (opts.eleRect.top + opts.eleRect.height < 0) {
                    opts.axis.top -= opts.popRect.height;
                    break;
                }

                // 减去Y滚动条宽度
                var bar = hasScrollbarX(opts.cnt) ? scrollbar : 0;

                // 目标元素完全消失在右侧边界
                if (opts.eleRect.top > opts.cntRect.height - bar) {
                    opts.axis.top = opts.eleRect.top + opts.cntRect.top;
                    break;
                }

                // 靠近右侧，目标元素有部分消失在右侧边界
                if (opts.eleRect.top + opts.eleRect.height + opts.popRect.height > opts.cntRect.height - bar) {
                    opts.axis.top -= opts.popRect.height - (opts.cntRect.height - opts.eleRect.top - opts.eleRect.height);

                    // 减去Y滚动条宽度
                    opts.axis.top -= bar;
                }

                if (opts.align.x == 'bottom' || opts.align.y == 'center')
                    opts.axis.arrow = 'top';

                break;
            case 'inner-top':
                // 目标元素完全消失在上侧边界
                if (opts.eleRect.top + opts.eleRect.height < 0) {
                    opts.axis.top = opts.cntRect.top + opts.eleRect.top;
                    // 如果浮层 高度大于目标高度，目标元素消失，浮层也要消失
                    opts.axis.top -= Math.max(opts.popRect.height - opts.eleRect.height, 0);
                    break;
                }

                // 靠近上侧,目标元素有部分消失在上侧边界
                if (opts.eleRect.top < 0) {
                    opts.axis.top = opts.cntRect.top;
                    break;
                }

                // 减去X滚动条宽度
                var bar = hasScrollbarX(opts.cnt) ? scrollbar : 0;

                // 目标元素完全消失在下侧边界
                if (opts.eleRect.top > opts.cntRect.height - bar) {
                    opts.axis.top = opts.eleRect.top + opts.cntRect.top;
                    break;
                }

                // 靠近下侧，目标元素有部分消失在下侧边界
                if (opts.eleRect.top + opts.eleRect.height - (opts.eleRect.height - opts.popRect.height) > opts.cntRect.height - bar) {
                    opts.axis.top = opts.cntRect.top + opts.cntRect.height - opts.popRect.height - bar;
                    break;
                }

                // 整个浮层与目标上对齐显示
                opts.axis.top = opts.cntRect.top + opts.eleRect.top;

                if (opts.align.x == 'right' || opts.align.y == 'center')
                    opts.axis.arrow = 'left';

                break;
            case 'inner-bottom':
                // 目标元素完全消失在上侧边界
                if (opts.eleRect.top + opts.eleRect.height < 0) {
                    opts.axis.top = opts.cntRect.top + opts.eleRect.top;
                    // 如果浮层高度大于目标高度，目标元素消失，浮层也要消失
                    opts.axis.top -= Math.max(opts.popRect.height - opts.eleRect.height, 0);
                    break;
                }

                // 靠近上侧,目标元素有部分消失在上侧边界(考录到浮层高度大于/小于目标高度)
                if (opts.eleRect.top + (opts.eleRect.height - opts.popRect.height) < 0) {
                    opts.axis.top = opts.cntRect.top;
                    break;
                }

                // 减去X滚动条宽度
                var bar = hasScrollbarX(opts.cnt) ? scrollbar : 0;

                // 目标元素完全消失在下侧边界
                if (opts.eleRect.top > opts.cntRect.height - bar) {
                    opts.axis.top = opts.eleRect.top + opts.cntRect.top;
                    break;
                }

                // 靠近下侧，目标元素有部分消失在下侧边界
                if (opts.eleRect.top + opts.eleRect.height > opts.cntRect.height - bar) {
                    opts.axis.top = opts.cntRect.top + opts.cntRect.height - opts.popRect.height - bar;
                    break;
                }

                // 整个浮层与目标左对齐显示
                opts.axis.top = opts.cntRect.top + opts.eleRect.top + opts.eleRect.height - opts.popRect.height;

                if (opts.align.x == 'right' || opts.align.y == 'center')
                    opts.axis.arrow = 'left';

                break;
            case 'center':
                // 目标元素与浮层元素中心对齐
                opts.axis.top = opts.cntRect.top + opts.eleRect.top - (opts.popRect.height - opts.eleRect.height) / 2;

                // 目标元素完全消失在上侧边界
                if (opts.eleRect.top + opts.eleRect.height < 0) {
                    opts.axis.top = opts.cntRect.top + opts.eleRect.top;
                    // 如果浮层高度大于目标高度，目标元素消失，浮层也要消失
                    opts.axis.top -= Math.max(opts.popRect.height - opts.eleRect.height, 0);
                    break;
                }

                // 减去X滚动条宽度
                var bar = hasScrollbarX(opts.cnt) ? scrollbar : 0;

                // 目标元素完全消失在下侧边界
                if (opts.eleRect.top > opts.cntRect.height - bar) {
                    opts.axis.top = opts.eleRect.top + opts.cntRect.top;
                    break;
                }

                // 计算上下侧剩余空间距离大小
                var topFreeSpace = opts.eleRect.top + (opts.eleRect.height - opts.popRect.height) / 2,
                    rightFreeSpace = opts.cntRect.height - opts.popRect.height - topFreeSpace - bar;

                // 靠近上侧，下侧没有空间了，而上侧还有
                if (topFreeSpace < 0 && rightFreeSpace > 0) {
                    opts.axis.top -= topFreeSpace;
                    break;
                }

                // 靠近下侧，上侧没有空间了，而下侧还有
                if (topFreeSpace > 0 && rightFreeSpace < 0) {
                    opts.axis.top += rightFreeSpace;
                    break;
                }

                break;

            default:
                break;
        }
    }


    return function(options) {
        //body默认
        options.cnt = options.cnt || document.body;

        options.alignX = options.alignX || 'inner-left';
        options.alignY = options.alignY || 'bottom';

        options.offsetX = options.offsetX || 0;
        options.offsetY = options.offsetY || 0;

        var winRect = null;

        var xL, xC, xR, yT, yC, yB;

        var result = {
            cnt: options.cnt,
            align: {
                x: 'inner-left',
                y: 'bottom'
            },
            offset: {
                x: 0,
                y: 0
            },
            axis: {
                top: 0,
                left: 0,
                arrow: ''
            },
            eleRect: {
                width: 0,
                height: 0
            },
            popRect: {
                width: 0,
                height: 0
            },
            cntRect: {
                width: 0,
                height: 0,
                left: 0,
                top: 0
            },
            winRect: {
                width: 0,
                height: 0,
                left: 0,
                top: 0
            }
        };

        result.popRect = {
            width: obtainOuterWidth(options.pop),
            height: obtainOuterHeight(options.pop)
        };

        // 弹出层是body的直接子节点
        if (isBodyNode(options.cnt)) {
            winRect = obtainWindowRect();

            result.cntRect = result.winRect = winRect;
        } else {
            cssRelative(options.cnt);

            result.cntRect = {
                width: obtainWidth(options.cnt),
                height: obtainHeight(options.cnt),
                top: obtainScrollTop(options.cnt),
                left: obtainScrollLeft(options.cnt)
            }
        }

        // 目标节点是body节点，做dialog应该如此配置
        if (isBodyNode(options.ele))
            result.eleRect = winRect || obtainWindowRect();
        else
            result.eleRect = {
                width: obtainOuterWidth(options.ele),
                height: obtainOuterHeight(options.ele)
            };

        // 悬浮层跟随鼠标移动
        var event = options.event;
        if (event) {
            xL = xC = xR = obtainPageX(event);

            yT = yC = yB = obtainPageY(event);
        } else {
            var offset = obtainOffset(options.ele);

            result.eleRect.left = offset.left;
            result.eleRect.top = offset.top;

            // 注意相对容器的offset计算
            if (!isBodyNode(options.cnt)) {
                var relOffset = obtainOffset(options.cnt);

                result.eleRect.left -= relOffset.left;
                result.eleRect.left -= obtainBorderWidth(options.cnt, 'borderLeftWidth');

                result.eleRect.top -= relOffset.top;
                result.eleRect.top -= obtainBorderWidth(options.cnt, 'broderTopWidth');
            }
        }

        // align x
        result.align.x = options.alignX;
        if (typeof options.alignX == 'function')
            result.align.x = options.alignX(result);

        // align y
        result.align.y = options.alignY;
        if (typeof options.alignY == 'function')
            result.align.y = options.alignY(result);

        // offset x
        result.offset.x = options.offsetX;
        if (typeof options.offsetX == 'function')
            result.offset.x = options.offsetX(result);
        else if (/\%$/.test(options.offsetX))
            result.offset.x = options.eleRect.width * parseFloat(options.offsetX) / 100;

        // offset y
        result.offset.y = options.offsetY;
        if (typeof options.offsetY == 'function')
            result.offset.y = options.offsetY(result);
        else if (/\%$/.test(options.offsetY))
            result.offset.y = options.eleRect.height * parseFloat(options.offsetY) / 100;

        calX(result);
        calY(result);

        result.axis.left = Math.floor(result.axis.left);
        result.axis.top = Math.floor(result.axis.top);

        return result;
    }

}));
