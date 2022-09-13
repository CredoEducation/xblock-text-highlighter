function TextHighlighterBlock(runtime, element, params) {
    var gettext = null;
    if ('gettext' in window) {
        gettext = window.gettext;
    }
    if (typeof gettext == "undefined") {
        // No translations -- used by test environment
        gettext = function(string) { return string; };
    }

    var maxWordLength = 150;
    var $element = $(element);
    var tooltip = $element.find('.th_tooltip');
    var tooltipLimitation = $element.find('.th_tooltip_limitation');
    var thAddBtn = $element.find('.th_add_btn');
    var thSelText = $element.find('.th_sel_text');
    var thText = $element.find('.th-text');
    var thSubmit = $element.find('.th_submit_selection');
    var thSelectedBlocks = $element.find('.th-selected-blocks');
    var thAnswersNum = $(thSelectedBlocks).data('answers-num');
    var thDisplayCorrectAnswersAfterResponse = $(thSelectedBlocks).data('display-correct-answers-after-response') === "True";
    var thIsStudioView = $(thSelectedBlocks).data('is-studio-view') === "True";

    var thSubmissionError = $element.find('.th_submission_error')
    if (thAnswersNum) {
        thAnswersNum = parseInt(thAnswersNum, 10);
    }
    var answers = $(thSelectedBlocks).data('selected-texts');
    var answerIsPresented = false;
    if (answers === "") {
        answers = [];
    } else {
        answerIsPresented = true;
    }

    function addSelection(selectedText, uniqueId, displayRemoveBtn) {
        if (displayRemoveBtn) {
            thSelectedBlocks.append("<div class='th_text_highlighter th-selected-block-" + uniqueId + "'><span class='txt-val'>" + selectedText + "</span> <a href='javasccript: void(0);' class='th-remove-block th-remove-link-" + uniqueId + "' data-block-id='" + uniqueId + "'>[remove]</a></div>");
        }
        thText.html(thText.html().replace(new RegExp(selectedText, "g"), '<span class="th-no-select ' + uniqueId + '">' + selectedText + '</span>'));
        if (displayRemoveBtn) {
            $element.find('.th-remove-link-' + uniqueId).click(function() {
                var blockId = $(this).data('block-id');
                $element.find('.' + blockId).contents().unwrap();
                var txt = $element.find('.th-selected-block-' + uniqueId + ' .txt-val').text();
                answers = answers.filter(function(v) {
                    return v !== txt;
                });
                if (answers.length < thAnswersNum) {
                    $(thSubmit).attr("disabled", "disabled");
                }
                $element.find('.th-selected-block-' + uniqueId).remove();
            });
        }
    }

    function placeTooltip(x_pos, y_pos) {
        $(tooltip).css({
            top: y_pos + 'px',
            left: x_pos + 'px',
            position: 'absolute',
            zIndex: 1000
        }).show();
    }

    function placeTooltipLimitation(x_pos, y_pos) {
        $(tooltipLimitation).css({
            top: y_pos + 'px',
            left: x_pos + 'px',
            position: 'absolute'
        }).show();
    }

    if (!answerIsPresented && thAnswersNum > 0) {
        $(thAddBtn).click(function() {
            var selectedText = $(thSelText).html();
            selectedText = $.trim(selectedText);
            if (selectedText && selectedText !== '' && (answers.indexOf(selectedText) === -1)) {
                var uniqueId = 'th-' + new Date().getTime();
                answers.push(selectedText);
                if (answers.length === thAnswersNum && !thIsStudioView) {
                    $(thSubmit).removeAttr("disabled");
                }
                addSelection(selectedText, uniqueId, true);
            }
            $(tooltip).hide();
        });

        $(thText).mouseup(function(e) {
            var selection = window.getSelection();
            var selText = selection.toString();
            if (selText) {
                selText = $.trim(selText);
            }
            if (selText.length > maxWordLength) {
                return;
            }
            $(thSelText).html(selText);

            //var x = e.pageX - $(thText).offset().left;
            //var y = thIsStudioView ? (e.pageY - $(thText).offset().top + 130) : e.pageY;

            var x = null;
            var y = null;

            if (thIsStudioView) {
                x = e.pageX - $(thText).offset().left;
                y = e.pageY - $(thText).offset().top + 130;
            } else {
                x = e.pageX - 100;
                y = e.pageY - 3;
            }

            if (selText && (selText !== '')) {
                if (answers.length === thAnswersNum) {
                    placeTooltipLimitation(x, y);
                } else {
                    placeTooltip(x, y);
                }
            } else {
                $(tooltip).hide();
                $(tooltipLimitation).hide();
            }
        });

        $(thSubmit).click(function () {
            $(thSubmit).attr("disabled", "disabled");
            thSubmissionError.hide();
            $.ajax({
                type: "POST",
                url: runtime.handlerUrl(element, 'publish_answers'),
                data: JSON.stringify({
                    answers: answers
                }),
                success: function (response) {
                    $(thSubmit).html('<span class="submit-label">Submitted</span>');
                    $(thSelectedBlocks).html('<div>Your answers:</div>' +
                        '<div>' + response.selected_texts + '</div><br />' +
                        (thDisplayCorrectAnswersAfterResponse ? '<div>Correct answers:</div>' : '') +
                        (thDisplayCorrectAnswersAfterResponse ? ('<div>' + response.correct_answers_texts + '</div><br />') : '') +
                        '<div>Your grade: <strong>' + response.user_correct_answers_num + ' / ' + response.correct_answers_total_num + '</strong></div>');
                },
                error: function() {
                    $(thSubmit).removeAttr("disabled");
                    thSubmissionError.show().html("Server error");
                }
            });
        });
    } else {
        if (answers.length > 0) {
            for (var i = 0; i < answers.length; i++) {
                addSelection(answers[i], 'th-' + i, false);
            }
        }
    }
}
