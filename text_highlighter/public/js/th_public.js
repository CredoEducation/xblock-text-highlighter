function TextHighlighterBlock(runtime, element, params) {
    var gettext = null;
    if ('gettext' in window) {
        gettext = window.gettext;
    }
    if (typeof gettext == "undefined") {
        // No translations -- used by test environment
        gettext = function(string) { return string; };
    }

    var $element = $(element);
    var tooltip = $element.find('.th_tooltip');
    var thAddBtn = $element.find('.th_add_btn');
    var thSelText = $element.find('.th_sel_text');
    var thText = $element.find('.th-text');
    var thSelectedBlocks = $element.find('.th-selected-blocks');

    $(thAddBtn).click(function() {
        var selectedText = $(thSelText).html();
        if (selectedText && selectedText !== '') {
            var uniqueId = 'th-' + new Date().getTime();
            thSelectedBlocks.append("<div class='th_text_highlighter th-selected-block-" + uniqueId + "'>" + selectedText + " <a href='#' class='th-remove-block th-remove-link-" + uniqueId + "' data-block-id='" + uniqueId + "'>[remove]</a></div>");
            thText.html(thText.html().replace(selectedText, '<span class="th-no-select ' + uniqueId + '">' + selectedText + '</span>'));
            $element.find('.th-remove-link-' + uniqueId).click(function() {
                var blockId = $(this).data('block-id');
                $element.find('.' + blockId).contents().unwrap();
                $element.find('.th-selected-block-' + uniqueId).remove();
            });
        }
        $(tooltip).hide();
    });

    function placeTooltip(x_pos, y_pos) {
        $(tooltip).css({
            top: y_pos + 'px',
            left: x_pos + 'px',
            position: 'absolute'
        }).show();
    }

    $(thText).mouseup(function(e) {
        var selection = window.getSelection().toString();
        var selText = selection.toString();
        if (selText) {
            selText = $.trim(selText);
        }
        $(thSelText).html(selText);

        var x = e.pageX - $(thText).offset().left;
        var y = e.pageY - $(thText).offset().top;
        if (selText && (selText !== '')) {
            placeTooltip(x, y);
        } else {
            $(tooltip).hide();
        }
    });
}
