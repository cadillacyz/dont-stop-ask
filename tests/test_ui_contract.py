import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class ViewerContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "viewer" / "index.html").read_text(encoding="utf-8")
        cls.script = (ROOT / "viewer" / "graph.js").read_text(encoding="utf-8")
        cls.styles = (ROOT / "viewer" / "style.css").read_text(encoding="utf-8")
        cls.launcher = (ROOT / "start.bat").read_text(encoding="utf-8")
        cls.server = (ROOT / "scripts" / "serve.py").read_text(encoding="utf-8")
        cls.readme = (ROOT / "README.md").read_text(encoding="utf-8")

    def test_third_party_script_is_versioned_and_integrity_pinned(self):
        self.assertIn("/d3@7.9.0/dist/d3.min.js", self.html)
        self.assertIn("integrity=", self.html)
        self.assertIn('crossorigin="anonymous"', self.html)

    def test_status_and_progress_are_announced(self):
        self.assertGreaterEqual(self.html.count('aria-live="polite"'), 3)
        self.assertIn('id="canceljob"', self.html)

    def test_landing_is_an_interactive_planetary_portal(self):
        self.assertIn('id="intro"', self.html)
        self.assertIn('id="portal"', self.html)
        self.assertEqual(self.html.count('class="planet '), 1)
        self.assertIn("el.portal.addEventListener('click', showAsk)", self.script)
        self.assertIn("https://github.com/cadillacyz/dont-stop-ask", self.html)
        self.assertIn("Do Not Stop Ask", self.html)
        self.assertIn('assets/galaxy-nebula.webp', self.html)
        self.assertIn('url("assets/galaxy-nebula.webp")', self.styles)

    def test_brightness_and_plain_question_copy_are_available(self):
        self.assertGreaterEqual(self.html.count("data-brightness"), 2)
        self.assertIn("applyBrightness", self.script)
        self.assertIn("dsa-brightness", self.script)
        self.assertIn("What question have you", self.html)
        self.assertNotIn("What keeps pulling", self.html)

    def test_entry_and_ask_pages_each_have_one_primary_path(self):
        self.assertIn('class="entry-focus"', self.html)
        self.assertIn('aria-label="Ask a question"', self.html)
        self.assertIn('class="ask-primary-row"', self.html)
        self.assertIn('class="ask-options"', self.html)
        self.assertIn("One question is enough to begin.", self.html)
        self.assertIn("Add context or change research settings", self.html)

    def test_past_questions_are_auto_discovered_without_file_upload(self):
        self.assertIn('class="history-control"', self.html)
        self.assertIn('id="setpick"', self.html)
        self.assertNotIn('id="file"', self.html)
        self.assertNotIn("Open a file", self.html)
        self.assertIn("s.origin === 'question-sets'", self.script)
        self.assertIn("No past questions yet", self.script)
        self.assertIn("s.working_question || s.name", self.script)
        self.assertNotIn("new FileReader()", self.script)

    def test_secondary_text_uses_high_contrast_cosmic_colors(self):
        self.assertIn("--fg-2: #d6e6ff", self.styles)
        self.assertIn("--fg-3: #9ed8ff", self.styles)
        self.assertIn(".intro::after", self.styles)
        self.assertNotIn("filter: brightness(var(--scene-brightness))", self.styles)

    def test_original_question_and_card_ids_live_inside_detail_cards(self):
        self.assertNotIn('class="id-key"', self.html)
        self.assertIn("Original question", self.script)
        self.assertIn("cardIdentity", self.script)
        self.assertIn("Question card", self.script)
        self.assertIn("Reading source", self.script)
        self.assertIn('class="card-identity"', self.script)
        self.assertIn("A letter prefix and number identify a question", self.script)

    def test_reading_observatory_prioritizes_readable_question_content(self):
        self.assertIn('aria-label="Reading observatory"', self.html)
        self.assertIn('id="reader-smaller"', self.html)
        self.assertIn('id="reader-larger"', self.html)
        self.assertIn("dsa-reader-scale", self.script)
        self.assertIn('class="guidance-grid"', self.script)
        self.assertIn('class="reading-card"', self.script)
        self.assertIn('class="observatory-details"', self.script)
        self.assertIn(".detail-open.graph-mode .side", self.styles)

    def test_expansion_count_is_a_ceiling_not_a_ui_promise(self):
        self.assertIn("Expand into more", self.script)
        self.assertNotIn("Expand into nine more", self.script)
        self.assertIn("up to nine verified follow-up questions", self.script)
        self.assertIn("fewer if any would be padding", self.script)

    def test_interface_language_can_switch_between_english_and_chinese(self):
        self.assertGreaterEqual(self.html.count("data-language"), 4)
        self.assertIn("applyLanguage", self.script)
        self.assertIn("dsa-language", self.script)
        self.assertIn("uiLang === 'zh'", self.script)
        self.assertIn("你最近一直在思考什么问题？", self.script)
        self.assertIn('document.documentElement.lang', self.script)
        self.assertIn("data-i18n-aria-label", self.html)
        self.assertIn("data-i18n-title", self.html)

    def test_fresh_generation_auto_opens_and_uses_the_repo_skill(self):
        self.assertIn("./skills/dont-stop-research/SKILL.md", self.script)
        self.assertIn("pendingGenerationSnapshot", self.script)
        self.assertIn("was generated and opened automatically", self.script)

    def test_ask_runs_a_local_agent_without_copy_paste_handoff(self):
        self.assertIn('id="agent"', self.html)
        self.assertIn("agent: el.agent.value", self.script)
        self.assertNotIn('id="handoff"', self.html)
        self.assertNotIn('Paste this into Claude Code', self.script)

    def test_question_branch_can_be_archived_without_deleting_json_records(self):
        self.assertIn('id="archive"', self.script)
        self.assertIn("fetch('/api/archive'", self.script)
        self.assertIn("DATA.questions.filter(q => !q.archived_at)", self.script)
        self.assertIn("The records stay archived in this JSON file.", self.script)

    def test_graph_nodes_have_keyboard_contract(self):
        self.assertIn(".attr('tabindex', 0)", self.script)
        self.assertIn(".attr('role', 'button')", self.script)
        self.assertIn("e.key !== 'Enter' && e.key !== ' '", self.script)

    def test_question_experience_continues_the_planetary_visual_language(self):
        self.assertIn("body::before", self.styles)
        self.assertIn(".graph-mode .side", self.styles)
        self.assertIn(".ask::before", self.styles)
        self.assertIn("root-world", self.script)
        self.assertIn("planetFill", self.script)

    def test_launcher_uses_the_documented_cosmic_viewer_port(self):
        self.assertIn('set "DSA_PORT=8010"', self.launcher)
        self.assertIn("http://127.0.0.1:%DSA_PORT%/viewer/", self.launcher)
        self.assertIn('os.environ.get("DSA_PORT", "8010")', self.server)
        self.assertIn("http://127.0.0.1:8010/viewer/", self.readme)

    def test_mutations_use_session_token_and_urls_are_allowlisted(self):
        self.assertIn("'X-DSA-Token'", self.script)
        self.assertIn("url.protocol === 'https:' || url.protocol === 'http:'", self.script)

    def test_small_screen_rules_cover_header_form_and_sidebar(self):
        self.assertIn("@media (max-width: 820px)", self.styles)
        for selector in (".bar-actions", ".askrow", ".side", ".legend"):
            self.assertIn(selector, self.styles)


if __name__ == "__main__":
    unittest.main()
