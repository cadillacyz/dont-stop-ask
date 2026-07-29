<h1>不停问 · dont-stop-ask</h1>

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
interface follows. **用任何语言提问都可以。** 中文提问返回中文问题集，查看器界面也会跟着切换。

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

## Works with any AI tool · 任何 AI 工具都能用

No Claude account, no proprietary skills system, no special cloud access. The whole tool is one
instruction file — [`portable/dont-stop-research.md`](portable/dont-stop-research.md) — and the
only hard requirement is that your AI can **search the web**, because every citation gets verified
before it ships.

不需要 Claude 账号，不依赖任何专有技能系统，也不需要特殊云端权限。整个工具就是一个指令文件——
[`portable/dont-stop-research.md`](portable/dont-stop-research.md)——唯一的硬性要求是你的 AI
能**联网搜索**，因为每条引用出场前都要核实。

**In a coding agent — Codex, Cursor, Claude Code, Gemini CLI, anything that reads a repo ·
在编程代理中：**

```bash
git clone https://github.com/cadillacyz/dont-stop-ask.git
```

Open the folder in your agent and just ask your question. The repo carries entry-point files the
agents read on their own — [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md),
[`GEMINI.md`](GEMINI.md) — which tell them to run the portable prompt, verify sources by search,
and write the JSON into `question-sets/` where the viewer finds it.

克隆后用你的代理打开这个文件夹，直接提问即可。仓库自带代理会自动读取的入口文件（`AGENTS.md`、
`CLAUDE.md`、`GEMINI.md`），它们会引导代理执行提示词、联网核实来源、把 JSON 写进
`question-sets/`，查看器就能找到。

**In a chat assistant — ChatGPT, Gemini, Claude on the web · 在网页版聊天助手中：**

1. Paste the contents of `portable/dont-stop-research.md` into the chat (**web search on** —
   verification is non-negotiable), add your question at the bottom, send.
   把 `portable/dont-stop-research.md` 的内容粘贴进对话（**开启联网搜索**——核实是硬性要求），
   末尾加上你的问题，发送。
2. Save the JSON code block it returns as `question-sets/anything.json`.
   把返回的 JSON 代码块存成 `question-sets/任意名字.json`。
3. The viewer loads it automatically — or drag the file onto the page.
   查看器会自动加载——或者直接把文件拖到页面上。

**Optional: the Claude Code slash command · 可选：Claude Code 斜杠命令**

```bash
cp -r skills/dont-stop-research ~/.claude/skills/
```

(Windows PowerShell: `Copy-Item -Recurse skills\dont-stop-research $HOME\.claude\skills\`) — adds
`/dont-stop-research`, which also writes the full markdown artifact and a companion briefing.
Convenience only; nothing else depends on it. · 增加 `/dont-stop-research` 命令，并额外生成完整的
markdown 记录和导读简报。纯属便利，其他部分不依赖它。

## The viewer · 查看器

```bash
python scripts/serve.py
```

Or double-click `start.bat` on Windows, then open <http://127.0.0.1:8000/viewer/>. It watches
`question-sets/` — **however the JSON gets written, the graph loads itself**, follows expansions,
and reloads edits in place. Click a dot for its readings; click expand to grow a question into up
to nine more (it hands you the prompt for whichever AI you're using).

Windows 下也可以直接双击 `start.bat`，然后打开 <http://127.0.0.1:8000/viewer/>。它盯着
`question-sets/`——**无论 JSON 是怎么写出来的，图谱都会自己加载**，自动跟随展开、就地重载修改。
点圆点看阅读材料；点展开把一个问题长成最多九个新问题（展开指令适用于你正在用的任何 AI）。

### Pruning a set · 修剪问题集

A generated set is a first draft. A card can miss and a reading can be wrong, so each question
carries a delete button and each reading a **remove** control. Bookkeeping is not your problem:
sources nothing cites any more go with the card that cited them, teach-back questions stop pointing
at what is gone, expansion children move up rather than disappear, and every write leaves a file
that still passes `scripts/validate.py`. Deleting shows an **Undo** for as long as the server is
running; `git` is the longer memory.

Pruning is recorded, in `meta.pruned`, and the viewer shows the count next to the date. That record
is what lets a pruned set keep all seven rungs of the ladder as an *advisory* note rather than a
failure — your set, your call — while a freshly generated set that is short a rung is still a bug
and still fails. What a delete cannot do is leave nothing behind: the last question and the last
reading stay.

生成出来的问题集只是初稿。卡片可能不准，材料可能不对，所以每个问题都有删除按钮，每份阅读材料都有
**移除**按钮。杂活不用你操心：没有别的卡片再引用的来源会跟着一起走，复述题不再指向已经删掉的卡片，
被展开的子问题会上移而不是消失，每次写入后的文件仍然通过 `scripts/validate.py`。删除后会出现**撤销**，
只要服务器还开着就有效；更长久的后悔药是 `git`。

修剪会被记录在 `meta.pruned` 里，查看器会在日期旁边显示修剪次数。正因为有这条记录，被手动修剪过的
问题集即使少了阶梯上的某一档，也只是**提示**而不是错误——你的问题集，你说了算；而刚生成出来就缺一档的
集合仍然算 bug，仍然报错。删除唯一做不到的事情是把东西删空：最后一个问题和最后一份阅读材料会留下。

### Optional: skip the copy-paste · 可选：省掉复制粘贴

If any agent CLI is on your PATH — `claude`, `codex`, or `gemini` — the viewer's Ask and Expand
buttons run it directly instead of handing you a prompt, and the graph appears when it finishes.
The server uses whichever it finds; the status light names it. Nothing requires this, and the
paste path stays for everyone else.

如果你的 PATH 里有任意一个代理命令行工具——`claude`、`codex` 或 `gemini`——查看器的 Ask 和展开
按钮会直接运行它，而不是把提示词交给你；跑完图谱自动出现。服务器会用它找到的那一个，状态灯会显示是
哪个。这不是必需的，粘贴那条路径对其他人始终可用。

`DSA_AGENT` picks one by name when several are installed; `DSA_AGENT_CMD` (a JSON list using
`{prompt}`) replaces the whole invocation if a flag is wrong for your version. Only the
invocation shape is claimed here, not that every build accepts it — a failed run shows the
command's own error in the panel.

## What's in here · 仓库结构

| Path | What · 内容 |
|---|---|
| `portable/dont-stop-research.md` | **The tool** — one self-contained prompt for any AI · **工具本体**——适用于任何 AI 的单文件提示词 |
| `AGENTS.md` · `CLAUDE.md` · `GEMINI.md` | Entry points coding agents read automatically · 编程代理自动读取的入口文件 |
| `viewer/` | The interactive graph. Static; d3 from a CDN · 交互式图谱，纯静态 |
| `scripts/serve.py` | Companion server: watches `question-sets/`. Binds 127.0.0.1 only · 陪伴服务器，只绑定本机 |
| `scripts/validate.py` | Checks a set against `schema/question-set.schema.json` · 按 schema 校验问题集 |
| `start.bat` | Double-click launcher for Windows · Windows 双击启动 |
| `skills/dont-stop-research/` | Optional Claude Code packaging of the same tool · 同一工具的可选 Claude Code 封装 |

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

## Licence · 许可

[MIT](LICENSE). The readings a set points to remain their authors' and publishers' property; this
project links and never reproduces. · 问题集指向的阅读材料版权归原作者与出版方；本项目只做链接，绝不
复制内容。
