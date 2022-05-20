from __future__ import absolute_import

from xblock.core import XBlock
from xblock.fields import Boolean, Integer, List, Scope, String, Dict
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

    block_settings_key = 'text-highlighter'

    @property
    def course_id(self):
        return self.xmodule_runtime.course_id  # pylint: disable=no-member

    @property
    def i18n_service(self):
        """ Obtains translation service """
        i18n_service = self.runtime.service(self, "i18n")
        if i18n_service:
            return i18n_service
        else:
            return DummyTranslationService()

    @property
    def has_author_view(self):
        return True

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

    def student_view(self, context=None):
        is_studio_view = self.xmodule_runtime.get_real_user is None

        context_dict = {
            'display_name': self.display_name,
            'text': self.text,
            'selected_texts': self.user_answers if self.user_answers else [],
            'is_studio_view': is_studio_view,
        }
        template = loader.render_django_template("/templates/public.html", context=context_dict,
                                                 i18n_service=self.i18n_service)
        return self._create_fragment(template, js_url='public/js/th_public.js',
                                     initialize_js_func='TextHighlighterBlock')

    def author_view(self, context=None):
        return self.student_view()

    def studio_view(self, context=None):
        context_dict = {
            'display_name': self.display_name,
            'text': self.text,
            'correct_answers': "\n".join(self.correct_answers) if self.correct_answers else ""
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

        self.display_name = display_name
        self.text = text
        self.correct_answers = correct_answers.split("\n")

        return {
            'result': 'success'
        }
