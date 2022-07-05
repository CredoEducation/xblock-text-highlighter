from __future__ import absolute_import

import json

from xblock.core import XBlock
from xblock.completable import XBlockCompletionMode
from xblock.fields import Boolean, Integer, List, Scope, String, Dict, Boolean
from xblockutils.settings import XBlockWithSettingsMixin
from xblockutils.resources import ResourceLoader
from web_fragments.fragment import Fragment

loader = ResourceLoader(__name__)

_ = lambda text: text


class DummyTranslationService(object):
    """
    Dummy drop-in replacement for i18n XBlock service
    """
    gettext = _


@XBlock.wants('settings')
@XBlock.needs('i18n')
@XBlock.needs("user")
@XBlock.needs("user_state")
class TextHighlighterBlock(XBlockWithSettingsMixin, XBlock):
    display_name = String(
        display_name=_("Display Name"),
        help=_("Display Name."),
        scope=Scope.settings,
        default=_("Text Highlighter Block"),
    )

    description = String(
        display_name=_("Description"),
        help=_("Description."),
        scope=Scope.settings,
        default="Click to highlight the findings",
    )

    text = String(
        display_name=_("Text"),
        help=_("Text"),
        scope=Scope.settings,
        default="Some text",
    )

    correct_answers = List(
        display_name=_("Correct answers"),
        help=_("Correct answers"),
        scope=Scope.settings,
    )

    user_answers = List(
        default=None,
        scope=Scope.user_state,
        help=_("User answers")
    )

    display_correct_answers_after_response = Boolean(
        default=True,
        scope=Scope.settings,
        help=_("Display Correct Answers After Response")
    )

    block_settings_key = 'text-highlighter'
    has_score = True
    has_author_view = True
    completion_mode = XBlockCompletionMode.COMPLETABLE

    @property
    def course_id(self):
        return self.xmodule_runtime.course_id  # pylint: disable=no-member

    def max_score(self):  # pylint: disable=no-self-use
        """
        Returns the maximum score that can be achieved (always 1.0 on this XBlock)
        """
        return 1.0

    @property
    def i18n_service(self):
        """ Obtains translation service """
        i18n_service = self.runtime.service(self, "i18n")
        if i18n_service:
            return i18n_service
        else:
            return DummyTranslationService()

    def _create_fragment(self, template, js_url=None, initialize_js_func=None):
        fragment = Fragment()
        fragment.add_content(template)
        if initialize_js_func:
            fragment.initialize_js(initialize_js_func, {})
        if js_url:
            fragment.add_javascript_url(self.runtime.local_resource_url(self, js_url))
        fragment.add_css_url(self.runtime.local_resource_url(self, 'public/css/th_block.css'))
        return fragment

    def get_real_user(self):
        anonymous_user_id = self.xmodule_runtime.anonymous_student_id
        user = self.xmodule_runtime.get_real_user(anonymous_user_id)
        return user

    def get_correct_answers(self):
        correct_answers = []
        for ca in self.correct_answers:
            ca_upd = ca.strip()
            if ca_upd:
                correct_answers.append(ca_upd)
        return sorted(correct_answers)

    def student_view(self, context=None):
        is_studio_view = True if context and context.get("studio_view", False) else False
        correct_answers = self.get_correct_answers()
        selected_texts = sorted(self.user_answers) if self.user_answers else []
        if selected_texts:
            percent_completion, user_correct_answers_num, correct_answers_total_num = self.get_answers_stat(selected_texts)
        else:
            percent_completion, user_correct_answers_num, correct_answers_total_num = 0, 0, 0

        context_dict = {
            'display_name': self.display_name,
            'text': self.text,
            'selected_texts': ", ".join(selected_texts) if selected_texts and not is_studio_view else "",
            'selected_texts_json': json.dumps(selected_texts) if selected_texts and not is_studio_view else "",
            'correct_answers_texts': ", ".join(correct_answers)if correct_answers else "",
            'is_studio_view': is_studio_view,
            'correct_answers_num': len(correct_answers),
            'description': self.description,
            'percent_completion': percent_completion,
            'user_correct_answers_num': user_correct_answers_num,
            'correct_answers_total_num': correct_answers_total_num,
            'display_correct_answers_after_response': self.display_correct_answers_after_response,
        }
        template = loader.render_django_template("/templates/public.html", context=context_dict,
                                                 i18n_service=self.i18n_service)
        return self._create_fragment(template, js_url='public/js/th_public.js',
                                     initialize_js_func='TextHighlighterBlock')

    def author_view(self, context=None):
        return self.student_view({"studio_view": True})

    def studio_view(self, context=None):
        correct_answers = self.get_correct_answers()
        context_dict = {
            'display_name': self.display_name,
            'text': self.text,
            'correct_answers': "\n".join(correct_answers) if correct_answers else "",
            'description': self.description,
            'display_correct_answers_after_response': self.display_correct_answers_after_response
        }
        template = loader.render_django_template("/templates/staff.html", context=context_dict,
                                                 i18n_service=self.i18n_service)
        return self._create_fragment(template, js_url='public/js/th_staff.js',
                                     initialize_js_func='TextHighlighterEditBlock')

    @XBlock.json_handler
    def update_editor_context(self, data, suffix=''):  # pylint: disable=unused-argument
        display_name = data.get('display_name')
        if not display_name:
            return {
                'result': 'error',
                'msg': self.i18n_service.gettext('Display Name is not set')
            }

        text = data.get('text')
        if not text:
            return {
                'result': 'error',
                'msg': self.i18n_service.gettext('Text is not set')
            }

        correct_answers = data.get('correct_answers')
        if not correct_answers:
            return {
                'result': 'error',
                'msg': self.i18n_service.gettext('Correct answers are not set')
            }

        description = data.get('description')
        if description:
            description = description.strip()

        display_correct_answers_after_response = data.get('display_correct_answers_after_response')

        self.display_name = display_name
        self.text = text
        self.correct_answers = correct_answers.split("\n")
        self.description = description
        self.display_correct_answers_after_response = bool(display_correct_answers_after_response)

        return {
            'result': 'success'
        }

    def get_answers_stat(self, resp_answers):
        correct_answers = self.get_correct_answers()
        correct_answers_total_num = len(correct_answers)
        user_correct_answers_num = 0
        for ans in resp_answers:
            if ans in correct_answers:
                user_correct_answers_num += 1

        if user_correct_answers_num > correct_answers_total_num:
            user_correct_answers_num = correct_answers_total_num

        if correct_answers_total_num:
            percent_completion = float(user_correct_answers_num) / correct_answers_total_num
            return percent_completion, user_correct_answers_num, correct_answers_total_num
        return 0, 0, 0

    @XBlock.json_handler
    def publish_answers(self, data, suffix=''):
        try:
            resp_answers = data.pop('answers')
        except KeyError:
            return {'result': 'error', 'message': "Invalid data"}

        resp_answers = sorted(list(set([a.strip() for a in resp_answers])))
        correct_answers = self.get_correct_answers()

        percent_completion, user_correct_answers_num, correct_answers_total_num = self.get_answers_stat(resp_answers)

        self.user_answers = resp_answers
        self.runtime.publish(self, 'progress', {})
        self.runtime.publish(self, 'grade', {
            'value': percent_completion,
            'max_value': 1,
        })

        event_type = 'xblock.text-highlighter.new_submission'
        data['user_id'] = self.scope_ids.user_id
        data['correct_answers'] = correct_answers
        data['user_answers'] = resp_answers
        data['new_grade'] = True
        data['grade'] = percent_completion
        data['max_grade'] = 1
        data['display_name'] = self.display_name
        data['description'] = self.description
        data['text'] = self.text
        data['correct_answers'] = self.correct_answers
        data['user_answers'] = self.user_answers
        data['display_correct_answers_after_response'] = self.display_correct_answers_after_response

        self.runtime.publish(self, event_type, data)

        return {
            'result': 'success',
            'selected_texts': ", ".join(resp_answers) if resp_answers else "",
            'correct_answers_texts': ", ".join(correct_answers) if correct_answers else "",
            'user_correct_answers_num': user_correct_answers_num,
            'correct_answers_total_num': correct_answers_total_num,
        }
