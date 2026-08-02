<h1>不停问 · dont-stop-ask</h1>

<p><a href="README.md">English</a></p>

<table>
  <tr>
    <td width="50%">
      <img src="docs/assets/dont-stop-ask-entry.png" alt="不停问入口页" />
    </td>
    <td width="50%">
      <img src="docs/assets/dont-stop-ask-question.png" alt="不停问问题页" />
    </td>
  </tr>
  <tr>
    <td align="center"><strong>进入问题世界</strong></td>
    <td align="center"><strong>用你自己的话提问</strong></td>
  </tr>
</table>

**一个从不替你回答问题的研究工具。**

把你真正好奇的事情交给它，它会返回一张更锋利的问题地图——每个问题都挂着真实且经过核实的阅读材料，
每个问题都附带一个开始阅读**之前**要做的核查动作。在地图上探索；遇到有意思的问题，就把它展开成更多问题——
最多九个，但只生成真正有用的数量。它不总结材料，不代写文章，也不告诉你该站哪一边。这是设计，不是缺陷。

**用任何语言提问都可以。** 中文提问返回中文问题集，查看器界面可以在中英文之间切换。

---

## 快速开始

从默认的 `main` 分支克隆当前版本：

```bash
git clone https://github.com/cadillacyz/dont-stop-ask.git
cd dont-stop-ask
python3 scripts/serve.py   # macOS/Linux；Windows 上用 "python"
```

然后打开 <http://127.0.0.1:8010/viewer/>。Windows 用户可以直接双击 `start.bat`；macOS/Linux 用户可以运行
`./start.sh`——两者都会启动服务器并自动打开查看器，也都会先检查是否装有真正的 Python。

**找不到 Python？**

- **Windows：** 如果运行 `python` 时提示"未找到 Python"并跳转到 Microsoft Store，说明 PATH 里的只是
  系统内置的 App Execution Alias 占位程序，不是真正的 Python。请运行
  `winget install -e --id Python.Python.3.12`，或从 [python.org](https://www.python.org/downloads/)
  下载安装（安装时勾选 "Add python.exe to PATH"），再重试。
- **macOS：** 运行 `brew install python3`（或从 python.org 下载安装）。
- **Linux：** 用发行版自带的包管理器安装，例如 Debian/Ubuntu 上运行 `sudo apt install python3`，
  Fedora 上运行 `sudo dnf install python3`。

### 让 AI 帮你运行

克隆后，把下面这段提示词发给 Codex、Claude Code 或其他编程代理：

> 阅读 `AGENTS.md` 和 `SECURITY.md`，然后在不修改代码的前提下启动本仓库的本地陪伴应用。
> 检查 `/api/status` 和查看器，尽量帮我打开查看器，并告诉我哪个本地智能体可用于生成
> （Codex、Claude Code、Cursor 或 GitHub Copilot）。服务器保持绑定在 `127.0.0.1`，不要暴露或代理它的端口。

根目录的 [`AGENTS.md`](AGENTS.md) 会自动告诉兼容的 AI 代理确切的启动、验证、旧界面恢复和安全说明。

---

## 五条铁律

每套问题都在这些规则下生成，它们高于其他一切指令。

| | 规则 |
|---|---|
| 1 | **绝不编造来源**——每条引用都先经联网搜索核实，核实不了就诚实标注 |
| 2 | **绝不回答自己提出的问题**——不打开材料就能完成工作，即为失败 |
| 3 | **给动作，不给结论**——给你揭示立场的搜索方法，而不是现成判断 |
| 4 | **不用引导性问题**——两个审慎的人必须能得出不同却都站得住的答案 |
| 5 | **不做伪装的记忆题**——每个问题都要求判断，而非检索 |

## 在 Claude Code、Codex、Cursor 或 GitHub Copilot 中使用

陪伴服务器会自动检测你装有哪一个，并直接调用它——除了安装 CLI 本身，不需要额外的单独配置。
唯一可选的额外步骤是给 Claude Code 用户的：如果你想在这个应用之外也能用
`/dont-stop-research` 斜杠命令，可以这样安装：

```bash
git clone https://github.com/cadillacyz/dont-stop-ask.git
cp -r dont-stop-ask/skills/dont-stop-research ~/.claude/skills/
```

Windows PowerShell：`Copy-Item -Recurse dont-stop-ask\skills\dont-stop-research $HOME\.claude\skills\`

然后启动陪伴服务器，打开查看器：

```bash
python3 scripts/serve.py   # macOS/Linux；Windows 上用 "python"
```

Windows 下也可以直接双击 `start.bat`，macOS/Linux 下可以运行 `./start.sh`。

本地助手刻意只在本机运行，且只提供白名单内的接口，而不是整个仓库。不要公开或代理它的端口。
把它改造成托管应用之前，请先阅读 [SECURITY.md](SECURITY.md) 了解威胁边界，以及
[docs/production-boundary.md](docs/production-boundary.md)。

打开 <http://127.0.0.1:8010/viewer/>，点击问题星球，输入问题，再按 **Ask**。本地助手会按 Codex、
Claude Code、Cursor、GitHub Copilot 的顺序自动使用找到的第一个，也可以在"添加背景信息或修改研究设置"
里手动指定，不再需要复制粘贴提示词。**文件一出现图谱就会自己加载**。请先安装其中至少一个 CLI。

## 在 ChatGPT 或其他助手中使用

整个工具也被打包成一个独立的提示词文件：[`portable/dont-stop-research.md`](portable/dont-stop-research.md)。

1. 把文件内容粘贴进 ChatGPT（或 Gemini，或任何**开启了联网搜索**的助手——核实来源是硬性要求），
   在末尾加上你的问题，发送。
2. 它会在对话里给出问题集，外加一个 JSON 代码块。把代码块存成本仓库 `question-sets/` 文件夹下的
   文件，文件名以 `question-set` 开头，例如 `question-set-任意名字.json`——服务器只会提供这个
   文件夹里、文件名以此开头的文件。
3. 启动服务器（`python scripts/serve.py`），查看器会自动加载它。

想展开某个问题：点击圆点，再选择 **Expand into more**。九个是上限，不是目标；如果继续生成只会凑数，
本地代理就会少生成一些。

想把某个问题从可见地图上移除：选中它的圆点，再选择 **Archive branch**。它的后代问题、以及没有被别处
用到的阅读材料会一起离开图谱，但所有记录仍然保留在 JSON 中，并带有 `archived_at` 和 `archived_with`
元数据。

## 仓库结构

| 路径 | 内容 |
|---|---|
| `skills/dont-stop-research/` | Claude Code 技能 |
| `portable/dont-stop-research.md` | 同一工具的单文件提示词版，适用于任何助手 |
| `viewer/` | 交互式图谱，纯静态，d3 走 CDN |
| `scripts/serve.py` | 陪伴服务器：监听 `question-sets/`，在有可用 CLI 时运行技能，只绑定 127.0.0.1 |
| `scripts/validate.py` | 按 `schema/question-set.schema.json` 校验问题集 |
| `start.bat` | Windows 双击启动 |
| `start.sh` | macOS/Linux 启动脚本（`./start.sh`） |

## 它不会做的事

不写文章，不给大纲，不出草稿，不通过总结材料让阅读可以被跳过，不告诉你该站哪一边。检验标准：如果你最后
拿到的是自己没法当面辩护的立场，那就是出了问题。

## 诚实的局限

核实只能确认来源存在、且其摘要支持所附说法——不是全文核读，所以一个真实、收录良好却错误的来源可以骗过
它。难度校准依据只是一段自述，本质上是猜测。它也无法强制任何人真的去读：它改变激励、让空洞在开口解释时
暴露，但不强制任何事。

## 参与贡献

发现引用错误是最有价值的贡献——请说明错在哪里、你如何核实。详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

发布之前，请运行校验器和本地安全/界面契约测试：

```bash
python -m unittest discover -s tests -v
python scripts/validate.py
node --check viewer/graph.js
```

## 许可

[MIT](LICENSE)。问题集指向的阅读材料版权归原作者与出版方；本项目只做链接，绝不复制内容。
