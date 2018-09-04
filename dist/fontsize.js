/*!
 * jquery fontsize 插件
 * author: xiaolong
 * 20170530
 */

(function ($, win) {
    //var extendSettings;
    $.fn.fontSize = function (settings) {
        var defaultSettings = {
            "action": "up",
            "id": "content",
            "step": 2,
            "beforeClick": null,
            "afterClick": null
        };

        this.extendSettings = $.extend(true, {}, defaultSettings, settings);

        // 逻辑：
        // 节点分为，元素节点ElementNode和文本节点TextNode
        // 1 文本节点的字体大小由父节点的字体大小决定
        // 2 元素节点字体大大小由：内联字体大小、class字体大小、继承字体大小共同决定
        // 3 只对文本节点的父元素设置字体（a 文本节点是最后一个节点，b 元素节点是最后一个且无子节点且有前兄弟节点），
        // 4 文本节点的兄弟节点为元素节点且没有设置字体前，文本节点的父节点不设置字体
        // nodeName == "#text"的节点如果为空，不做处理
        var that = this;
        that.content = document.getElementById(that.extendSettings.id);
        this.on('click', function (e) {
            if (that.extendSettings.beforeClick) {
                if (that.extendSettings.beforeClick() === false) {
                    return;
                }
            }
            loopNode(that.content);

            if (that.extendSettings.afterClick) {
                that.extendSettings.afterClick();
            }
        });

        // 遍历一个节点
        function loopNode(node) {
            var type = node.nodeType,
                childNodes;

            if (type === 1) {
                childNodes = node.childNodes;

                if (childNodes.length == 0) { // 元素节点无子节点，<br> <img>等
                    analysisNode(node);
                } else {
                    for (var i = 0, l = childNodes.length; i < l; i++) {
                        loopNode(childNodes[i]);
                    }
                }

            } else if (type === 3) {
                analysisNode(node);
            }

        }

        // 解析一个dom元素节点
        function analysisNode(node) {
            var type = node.nodeType;
            if (node == that.content) {
                return;
            }

            if (type === 1) { // 元素节点
                // 判断是不是最后一级的 元素节点

                if (isLeafEleNode(node)) {
                    // 直接设置font-size值
                    setFontSize(node, 1);
                }

            } else if (type === 3) { // 文本节点

                // 需要对父节点设置font-size 才会影响到本身的font-size
                if (isFinalTextNode(node)) { // 第二种可以设置字体的文本节点状态
                    if ($.trim(node.textContent).length) {
                        setFontSize(node, 2);
                    }
                }
            }
        }

        // type:1, 元素节点只有一个 文本节点
        // type:2, 文本节点是最后一个兄弟，且前面是文本节点 和 叶子元素节点
        function setFontSize(node, type) {
            var tamanno, size, unit, parentNode,
                settings = that.extendSettings;
            switch (type) {
                case 1: // isLeafEleNode
                    size = $(node).css("font-size");
                    tamanno = parseInt(size);
                    unit = size.substr(size.length - 2);
                    if (node.childNodes && node.childNodes.length) {
                        if (settings.action == "down") {
                            $(node).css('font-size', (tamanno - settings.step) + unit);
                        } else {
                            $(node).css('font-size', (tamanno + settings.step) + unit);
                        }
                    }

                    if (isLastNode(node) && hasTextNodeBefore(node)) { //是最后一个叶子元素节点且前面有文本节点
                        parentNode = node.parentNode;
                        if (node.id == that.content.id) {
                            return;
                        }

                        // 1判断父节点的类型，
                        // 2设置父节点font-size
                        setFontSize(parentNode, 1); // 父节点虽然不是叶子元素节点。但是元素节点。setFontSize跟
                    }
                    break;
                case 2: // isFinalTextNode
                    parentNode = node.parentNode;
                    size = $(parentNode).css("font-size");
                    tamanno = parseInt(size);
                    unit = size.substr(size.length - 2);
                    if (settings.action == "down") {
                        $(parentNode).css('font-size', (tamanno - settings.step) + unit);
                    } else {
                        $(parentNode).css('font-size', (tamanno + settings.step) + unit);
                    }

                    if (parentNode.id == that.content.id) {
                        return;
                    }

                    // 再判断 父节点类型
                    if ((parentNode.parentNode.id !== that.content.id) && (isLastNode(parentNode.parentNode)) && hasTextNodeBefore(parentNode.parentNode)) {
                        setFontSize(parentNode.parentNode, 1);
                    }
                    break;
            }
        }
    };

    // 判断一个节点是否是叶子元素节点。即元素只有一个文本节点为他的子节点(childNode)
    function isLeafEleNode(node) {
        var type = node.nodeType, child;

        if (type === 1) {
            child = node.childNodes;

            if ((child.length === 1 && child[0].nodeType === 3) || (child.length == 0)) { // 只有一个文本节点或者无子节点
                return true;
            } else {
                return false;
            }

        } else {
            return false;
        }
    }

    // 判断一个节点在同一层级中是不是最后一个节点。即后面没有兄弟的节点
    function isLastNode(node) {
        var nextElementNode = node.nextElementSibling,
            nextSiblings = node.nextSibling;

        // 没有下一个节点。或者有下一个节点，且节点为文本节点，且长度为0的文本节点
        if (nextSiblings === null || (nextSiblings && nextSiblings.nodeType === 3 && $.trim(nextSiblings.nodeValue).length === 0 && nextSiblings.nextSiblings === undefined)) {
            return true;
        } else {
            return false;
        }
    }

    // 2文本节点是最后一个兄弟，且前面是文本节点 和 叶子元素节点
    function isFinalTextNode(node) {
        var islastnode = isLastNode(node),
            result = false;

        if (islastnode) { // 是最后一个节点
            var preSiblings = getPreviousSiblings(node);

            for (var i = 0, l = preSiblings.length; i < l; i++) {
                if (preSiblings[i].nodeType === 3 || isLeafEleNode(preSiblings[i]) || $.trim($(preSiblings[i]).text()).length == 0) {
                    // 文本节点 或者 叶子元素节点
                } else {
                    result = false;
                    return result;
                }
            }
            result = true;
        }
        return result;
    }

    // 前面的节点有文本节点
    function hasTextNodeBefore(node) {
        var preSiblings = getPreviousSiblings(node);

        for (var i = 0, l = preSiblings.length; i < l; i++) {
            if (preSiblings[i].nodeType === 3) {
                // 文本节点
                return true;
            }
        }

        return false;
    }

    // 获取节点前面的所有节点
    function getPreviousSiblings(node) {
        var parentNode = node.parentNode;
        var childNodes = parentNode.childNodes;

        var previous = [];

        for (var i = 0, l = childNodes.length; i < l; i++) {
            if (childNodes[i] == node) {
                return previous;
            } else {
                previous.push(childNodes[i]);
            }
        }
    }

})(jQuery, this);
