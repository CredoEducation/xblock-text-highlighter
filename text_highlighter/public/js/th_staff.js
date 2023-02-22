function TextHighlighterEditBlock(runtime, element, params) {
    var gettext = null;
    if ('gettext' in window) {
        gettext = window.gettext;
    }
    if (typeof gettext == "undefined") {
        // No translations -- used by test environment
        gettext = function(string) { return string; };
    }

    var $element = $(element);
    var saveBtn = $element.find('.save-button');
    var errMsgBlock = $element.find('.err-msg');

    if (!saveBtn.hasClass('disabled')) {
        saveBtn.on('click', function() {
            var displayName = $element.find('#th_display_name').val();
            var text = $element.find('#th_text').val();
            var correctAnswers = $element.find('#th_correct_answers').val();
            var description = $element.find('#th_description').val();
            var gradingType = $element.find('#th_grading_type').val();
            var problemWeight = $element.find('#th_problem_weight').val();
            var displayCorrectAnswersAfterResponse = $element.find('#th_display_correct_answers_after_response').is(':checked');
            var useTokenizedSystem = $element.find('#th_use_tokenized_system').is(':checked');
            var allowNonLimitedNumberAnswers = $element.find('#th_allow_non_limited_number_answers').is(':checked');
            var maxAttemptsNumber = $element.find('#th_max_attempts_number').val();

            if ($.trim(displayName) === '') {
                errMsgBlock.show().text(gettext('Error: "Name" is not set'));
                return;
            }

            if ($.trim(text) === '') {
                errMsgBlock.show().text(gettext('Error: "Text" is not set'));
                return;
            }

            if ($.trim(correctAnswers) === '') {
                errMsgBlock.show().text(gettext('Error: "Correct answers" are not set'));
                return;
            }

            saveBtn.text(gettext('Please, wait...')).addClass('disabled');
            errMsgBlock.hide();

            var handlerUrl = runtime.handlerUrl(element, 'update_editor_context');
            runtime.notify('save', {state: 'start', message: gettext("Saving")});

            $.post(handlerUrl, JSON.stringify({
                'display_name': displayName,
                'text': text,
                'correct_answers': correctAnswers,
                'description': description,
                'grading_type': gradingType,
                'problem_weight': problemWeight,
                'display_correct_answers_after_response': displayCorrectAnswersAfterResponse,
                'non_limited_number_of_answers': allowNonLimitedNumberAnswers,
                'use_tokenized_system': useTokenizedSystem,
                'max_attempts_number': maxAttemptsNumber
            }), function(res) {
                saveBtn.text(gettext('Save')).removeClass('disabled');
                if (res.result === 'success') {
                    runtime.notify('save', {state: 'end'});
                } else if (res.result === 'error') {
                    errMsgBlock.show().text(gettext('Error:') + ' ' + res.msg);
                    runtime.notify('error', {
                        'title': gettext("There was an error with your form."),
                        'message': res.msg
                    });
                }
            });
        });
    }

    $element.find('.cancel-button').on('click', function() {
        runtime.notify('cancel', {});
    });
}
