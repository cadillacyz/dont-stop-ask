<h1>不停问 · dont-stop-ask</h1>

![Do Not Stop Ask galaxy landing page](docs/assets/dont-stop-ask-galaxy.png)

**A research tool that never answers the question.**
**一个从不替你回答问题的研究工具。**

Give it something you actually wonder about, and it gives back a map of sharper questions — each
anchored to real, verified readings, each carrying a fact-checking move to run *before* you read.
Explore the map; when a question gets interesting, grow it into up to nine more. It does not
summarise the sources, does not write the essay, and does not tell you which side to take. That is
the design, not a limitation.

把你真正好奇的事情交给它，它会返回一张更锋利的问题地图——每个问题都挂着真实且经过核实的阅读材料，
每个问题都附带一个开始阅读**之前**要做的核查动作。在地图上探索；遇到有意思的问题，把它展开成最多九个新
问题。它不总结材料，不代写文章，也不告诉你该站哪一边。这是设计，不是缺陷。

**Ask in any language.** A Chinese question returns a Chinese question set, and the viewer's
interface can be switched between English and Chinese. **用任何语言提问都可以。** 中文提问返回中文
问题集，查看器界面可以在中英文之间切换。

---

## Quick start · 快速开始

This test release is available on the `test` branch:

```bash
git clone --branch test https://github.com/cadillacyz/dont-stop-ask.git
cd dont-stop-ask
python scripts/serve.py
```

Then open <http://127.0.0.1:8010/viewer/>. On Windows, you can double-click `start.bat` instead.

这个测试版本位于 `test` 分支。克隆后进入仓库并运行 `python scripts/serve.py`，再打开
<http://127.0.0.1:8010/viewer/>。Windows 用户也可以直接双击 `start.bat`。

### Tell an AI coding agent to run it · 让 AI 帮你运行

After cloning, paste this into Codex, Claude Code, or another coding agent:

> Read `AGENTS.md` and `SECURITY.md`, then start this repository's local companion app without
> changing the code. Verify `/api/status` and the viewer, open the viewer for me if you can, and tell
> me whether Codex or Claude Code generation is available. Keep the server on `127.0.0.1` and do not
> expose or proxy its port.

The repository-level [`AGENTS.md`](AGENTS.md) gives compatible AI agents the exact startup,
verification, old-UI recovery, and safety instructions automatically.

克隆后，把上面的提示词发给 Codex、Claude Code 或其他编程代理即可。根目录的
[`AGENTS.md`](AGENTS.md) 也会自动告诉兼容的 AI 如何启动、检查和排查旧界面。

---

## The five rules · 五条铁律

Every set is generated under these; they override everything else.
每套问题都在这些规则下生成，它们高于其他一切指令。

| | Rule · 规则 |
|---|---|
| 1 | **Never fabricate a source** — every citation verified by live search before it ships, or honestly marked unconfirmed · **绝不编造来源**——每条引用都先经联网搜索核实，核实不了就诚实标注 |
| 2 | **Never answer its own questions** — if you could finish the work without opening a source, the set has failed · **绝不回答自己提出的问题**——不打开材料就能完成工作，即为失败 |
| 3 | **Moves, not verdicts** — you get the search that reveals a source's slant, not a conclusion about it · **给动作，不给结论**——给你揭示立场的搜索方法，而不是现成判断 |
| 4 | **No leading questions** — two careful people must be able to disagree defensibly · **不用引导性问题**——两个审慎的人必须能得出不同却都站得住的答案 |
| 5 | **No disguised recall** — every question requires judgment, not lookup · **不做伪装的记忆题**——每个问题都要求判断，而非检索 |

## Use it in Claude Code · 在 Claude Code 中使用

```bash
git clone https://github.com/cadillacyz/dont-stop-ask.git
cp -r dont-stop-ask/skills/dont-stop-research ~/.claude/skills/
```

Windows PowerShell: `Copy-Item -Recurse dont-stop-ask\skills\dont-stop-research $HOME\.claude\skills\`

Then start the companion server and open the viewer · 然后启动陪伴服务器，打开查看器：

```bash
python scripts/serve.py
```

Or just double-click `start.bat` on Windows. · Windows 下也可以直接双击 `start.bat`。

The helper is intentionally local-only and now serves an allowlisted surface rather than the
repository. Do not publish or proxy its port. See [SECURITY.md](SECURITY.md) for the threat boundary
and [docs/production-boundary.md](docs/production-boundary.md) before turning it into a hosted app.

Open <http://127.0.0.1:8010/viewer/>, click the question world, type your question, and hit **Ask**.
The helper runs Codex (preferred) or Claude Code directly. **The graph loads itself** when the file
appears — no prompt copy/paste or file picker needed. Install one of those CLIs first.

打开 <http://127.0.0.1:8010/viewer/>，点击问题星球，输入问题，再按 **Ask**。本地助手会优先使用 Codex，
也可自动使用 Claude Code，不再需要复制粘贴提示词。**文件一出现图谱就会自己加载**。

## Use it in ChatGPT or any other assistant · 在 ChatGPT 或其他助手中使用

The whole tool also exists as one self-contained prompt:
[`portable/dont-stop-research.md`](portable/dont-stop-research.md).

整个工具也被打包成一个独立的提示词文件：[`portable/dont-stop-research.md`](portable/dont-stop-research.md)。

1. Paste the file's contents into ChatGPT (or Gemini, or any assistant **with web search
   enabled** — verification is non-negotiable), add your question at the bottom, send.
   把文件内容粘贴进 ChatGPT（或 Gemini，或任何**开启了联网搜索**的助手——核实来源是硬性要求），
   在末尾加上你的问题，发送。
2. It returns the question set in chat plus a JSON code block. Save that block as
   `question-sets/anything.json` in this folder (or anywhere).
   它会在对话里给出问题集，外加一个 JSON 代码块。把代码块存成 `question-sets/任意名字.json`。
3. The viewer picks it up automatically if the server is running — or drag the file onto the page.
   服务器开着的话查看器会自动加载——或者直接把文件拖到页面上。

To expand a question, click its dot and choose **Expand into nine more**. The local agent runs it
automatically. · 想展开某个问题：点击圆点，再选择 **Expand into nine more**，本地代理会自动运行。

To remove a question from the visible map, select its dot and choose **Archive branch**. Descendant
questions and readings used nowhere else leave the graph together, while every record remains in the
JSON with `archived_at` and `archived_with` metadata.

## What's in here · 仓库结构

| Path | What · 内容 |
|---|---|
| `skills/dont-stop-research/` | The Claude Code skill · Claude Code 技能 |
| `portable/dont-stop-research.md` | The same tool as one pasteable prompt, for any assistant · 同一工具的单文件提示词版，适用于任何助手 |
| `viewer/` | The interactive graph. Static; d3 from a CDN · 交互式图谱，纯静态 |
| `scripts/serve.py` | Companion server: watches `question-sets/`, runs the skill when a CLI is available. Binds 127.0.0.1 only · 陪伴服务器，只绑定本机 |
| `scripts/validate.py` | Checks a set against `schema/question-set.schema.json` · 按 schema 校验问题集 |
| `start.bat` | Double-click launcher for Windows · Windows 双击启动 |

## What it will not do · 它不会做的事

No essay, no outline, no draft, no summarising a source so the reading can be skipped, no telling
you which side to take. The test: if you end up with a position you cannot defend out loud,
something went wrong.

不写文章，不给大纲，不出草稿，不通过总结材料让阅读可以被跳过，不告诉你该站哪一边。检验标准：如果你最后
拿到的是自己没法当面辩护的立场，那就是出了问题。

## Honest limits · 诚实的局限

Verification confirms a source exists and says what we claim — at abstract level, not full text, so
it can be defeated by a source that is real, well-indexed, and wrong. Difficulty is calibrated from
one paragraph of self-description, which is a guess. And nothing enforces that anyone actually
reads: the tool changes incentives and makes gaps visible out loud; it enforces nothing.

核实只能确认来源存在、且其摘要支持所附说法——不是全文核读，所以一个真实、收录良好却错误的来源可以骗过
它。难度校准依据只是一段自述，本质上是猜测。它也无法强制任何人真的去读：它改变激励、让空洞在开口解释时
暴露，但不强制任何事。

## Contributing · 参与贡献

Found a citation we got wrong? That's the most valuable issue you can file — say what was wrong and
how you checked. See [CONTRIBUTING.md](CONTRIBUTING.md). · 发现引用错误是最有价值的贡献——请说明错在
哪里、你如何核实。

Before a release, run the validator and the local security/UI contract tests:

```bash
python -m unittest discover -s tests -v
python scripts/validate.py
node --check viewer/graph.js
```

## Licence · 许可

[MIT](LICENSE). The readings a set points to remain their authors' and publishers' property; this
project links and never reproduces. · 问题集指向的阅读材料版权归原作者与出版方；本项目只做链接，绝不
复制内容。
