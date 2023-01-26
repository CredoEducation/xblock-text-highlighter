function TextHighlighterBlock(runtime, element, params) {
    var gettext = null;
    if ('gettext' in window) {
        gettext = window.gettext;
    }
    if (typeof gettext == "undefined") {
        // No translations -- used by test environment
        gettext = function(string) { return string; };
    }

    var maxWordLength = 200;
    var $element = $(element);
    var tooltip = $element.find('.th_tooltip');
    var tooltipLimitation = $element.find('.th_tooltip_limitation');
    var thAddBtn = $element.find('.th_add_btn');
    var thSelText = $element.find('.th_sel_text');
    var thText = $element.find('.th-text');
    var thSubmit = $element.find('.th_submit_selection');
    var thSelectedBlocks = $element.find('.th-selected-blocks');
    var thGradeTextBlock = $element.find('.th_problem_progress');
    var thAnswersNum = $(thSelectedBlocks).data('answers-num');
    var thDisplayCorrectAnswersAfterResponse = $(thSelectedBlocks).data('display-correct-answers-after-response') === "True";
    var thIsStudioView = $(thSelectedBlocks).data('is-studio-view') === "True";
    var thUseTokenizedSystem = $(thSelectedBlocks).data('use-tokenized-system') === "True";
    var thNonLimitedNumberOfAnswers = $(thSelectedBlocks).data('non-limited-number-of-answers') === "True";

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
            thSelectedBlocks.append("<div class='th_text_highlighter th-selected-block-" + uniqueId + "'><span class='txt-val'>" + selectedText + "</span> <a href='javascript: void(0);' class='th-remove-block th-remove-link-" + uniqueId + "' data-block-id='" + uniqueId + "'>[remove]</a></div>");
        }
        if (!thUseTokenizedSystem) {
            thText.html(thText.html().replace(new RegExp(selectedText, "g"), '<span class="th-no-select ' + uniqueId + '">' + selectedText + '</span>'));
        }
        if (displayRemoveBtn) {
            $element.find('.th-remove-link-' + uniqueId).click(function() {
                var blockId = $(this).data('block-id');
                var txt = $element.find('.th-selected-block-' + uniqueId + ' .txt-val').text();
                if (!thUseTokenizedSystem) {
                    $element.find('.' + blockId).contents().unwrap();
                } else if (thUseTokenizedSystem && !thNonLimitedNumberOfAnswers) {
                    $(tooltipLimitation).hide();
                }
                answers = answers.filter(function(v) {
                    return v !== txt;
                });
                if ((!thNonLimitedNumberOfAnswers && (answers.length < thAnswersNum))
                  || (thNonLimitedNumberOfAnswers && (answers.length === 0))) {
                    $(thSubmit).attr("disabled", "disabled");
                }
                $element.find('.th-selected-block-' + uniqueId).remove();
            });
        }
    }

    function placeTooltip(xPos, yPos) {
        $(tooltip).css({
            top: yPos + 'px',
            left: xPos + 'px',
            position: 'absolute',
            zIndex: 1000
        }).show();
    }

    function placeTooltipLimitation(xPos, yPos) {
        $(tooltipLimitation).css({
            top: yPos + 'px',
            left: xPos + 'px',
            position: 'absolute'
        }).show();
    }

    if (!answerIsPresented && thAnswersNum > 0) {
        $(thAddBtn).click(function() {
            var selectedText = $(thSelText).html();
            selectedText = $.trim(selectedText);
            if (selectedText && (selectedText !== '') && (answers.indexOf(selectedText) === -1)) {
                var uniqueId = 'th-' + new Date().getTime();
                answers.push(selectedText);
                if (!thIsStudioView) {
                    if ((!thNonLimitedNumberOfAnswers && (answers.length === thAnswersNum))
                      || (thNonLimitedNumberOfAnswers && (answers.length > 0))) {
                        $(thSubmit).removeAttr("disabled");
                    }
                }
                addSelection(selectedText, uniqueId, true);
            }
            $(tooltip).hide();
        });

        if (thUseTokenizedSystem) {
            $element.find('.th-cl-token').click(function(e) {
                if (answerIsPresented) {
                    return;
                }
                var selectedText = $(this).text();
                if ((answers.length === thAnswersNum) && !thNonLimitedNumberOfAnswers) {
                    if (answers.indexOf(selectedText) === -1) {
                        var x = null;
                        var y = null;
                        if (!thIsStudioView) {
                            x = e.clientX;
                            y = e.clientY;
                        }
                        placeTooltipLimitation(x, y);
                    }
                    return
                }
                if (!thNonLimitedNumberOfAnswers) {
                    $(tooltipLimitation).hide();
                }
                if (selectedText && selectedText !== '' && (answers.indexOf(selectedText) === -1)) {
                    var uniqueId = 'th-' + new Date().getTime();
                    answers.push(selectedText);
                    if (!thIsStudioView) {
                        if ((!thNonLimitedNumberOfAnswers && (answers.length === thAnswersNum))
                         || (thNonLimitedNumberOfAnswers && (answers.length > 0))) {
                            $(thSubmit).removeAttr("disabled");
                        }
                    }
                    addSelection(selectedText, uniqueId, true);
                }
            });
        } else {
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
                    if (answers.length === thAnswersNum && !thNonLimitedNumberOfAnswers) {
                        placeTooltipLimitation(x, y);
                    } else {
                        placeTooltip(x, y);
                    }
                } else {
                    $(tooltip).hide();
                    $(tooltipLimitation).hide();
                }
            });
        }

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
                    answerIsPresented = true;
                    $(thSubmit).html('<span class="submit-label">Submitted</span>');
                    $(thSelectedBlocks).html('<div>Your answers:</div>' +
                        '<div>' + response.selected_texts + '</div><br />' +
                        (thDisplayCorrectAnswersAfterResponse ? '<div>Correct answers:</div>' : '') +
                        (thDisplayCorrectAnswersAfterResponse ? ('<div>' + response.correct_answers_texts + '</div><br />') : ''));
                    $(thGradeTextBlock).html(response.grade_text);
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
