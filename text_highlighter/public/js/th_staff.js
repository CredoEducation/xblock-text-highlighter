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
            saveBtn.text(gettext('Please, wait...')).addClass('disabled');
            errMsgBlock.hide();

            var displayName = $element.find('#th_display_name').val();
            var text = $element.find('#th_text').val();
            var correctAnswers = $element.find('#th_correct_answers').val();

            var handlerUrl = runtime.handlerUrl(element, 'update_editor_context');
            runtime.notify('save', {state: 'start', message: gettext("Saving")});

            $.post(handlerUrl, JSON.stringify({
                'display_name': displayName,
                'text': text,
                'correct_answers': correctAnswers,
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
