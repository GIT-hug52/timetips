# TimeTips ⏱️

> **面向考研备考的三段式刷题限时器** · A three-phase exam-practice timer for desktop

> ⚠️ **声明**：本项目由 AI 辅助生成（WorkBuddy + AI），代码和设计由 AI 根据需求描述自动完成。

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-ffc131.svg)](https://tauri.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org)

---

## 为什么做这个？

刷题时最大的问题不是"不会做"，而是"不知道该卡多久"。  
TimeTips 把每道题拆成三个阶段：**思考 → 解答 → 超时**，到点提醒，帮你量化每道题的真实耗时，从而找出自己最容易卡壳的知识点。

## 功能亮点

| 功能 | 说明 |
|------|------|
| ⏰ **三段式计时** | 思考阶段 → 解答阶段 → 超时阶段，阶段到点自动切换并提示 |
| 🎨 **视觉状态** | 正常（蓝/绿）→ 接近超时（黄色）→ 超时（红色闪烁 + 声音） |
| 📋 **题目模板** | 预设高数/线代/概率论模板，支持增删改查 |
| ✅ **快速记录** | 做出 / 超时做出 / 没思路 / 算错 / 看答案 |
| 📊 **今日统计** | 题数、超时率、平均耗时、科目分布 |
| 💾 **本地存储** | 数据存储在 localStorage，无需联网 |
| 🖥️ **桌面小窗** | 基于 Tauri，窗口置顶，不干扰做题 |

## 截图预览

> *(开发中，截图待补充)*

## 快速开始（Web 预览）

```bash
# 1. 安装依赖
npm.cmd install        # Windows PowerShell
# 或
npm install            # bash / cmd

# 2. 启动开发服务器
npm run dev

# 3. 打开浏览器访问
# http://localhost:5173
```

## 打包桌面 exe（需要 Rust）

```bash
# 1. 安装 Rust（如果还没有）
# 下载：https://rustup.rs/  →  选 1 (default)

# 2. 确认 Rust 安装
rustc --version
cargo --version

# 3. 安装 Tauri CLI
npm install

# 4. 打包
npm run tauri:build
# 产物位于：src-tauri/target/release/bundle/
```

## 项目结构

```
timetips/
├── src/
│   ├── App.tsx          # 核心 UI & 业务逻辑
│   ├── styles.css       # 全局深色样式
│   ├── types.ts         # TypeScript 类型定义
│   ├── data.ts          # 默认模板 & 结果标签
│   ├── storage.ts       # localStorage Hook
│   ├── utils.ts         # 工具函数
│   └── main.tsx         # React 入口
├── src-tauri/           # Tauri 桌面配置
│   ├── tauri.conf.json  # 窗口 & 打包配置
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs
│   └── Cargo.toml
├── index.html
├── vite.config.ts
└── package.json
```

## 题目模板字段

| 字段 | 说明 |
|------|------|
| `subject` | 科目（高等数学 / 线性代数 / 概率论…） |
| `chapter` | 章节 |
| `problemType` | 题型（计算题 / 选择题 / 证明题…） |
| `familiarity` | 熟悉度 1–5 |
| `mastery` | 掌握度 1–5 |
| `thinkingMinutes` | 思考阶段时长（分钟） |
| `solvingMinutes` | 解答阶段时长（分钟） |
| `totalMinutes` | 总时长限制（分钟） |

## 做题结果枚举

| 枚举值 | 含义 |
|--------|------|
| `solved` | 做出 |
| `solved_overtime` | 超时做出 |
| `stuck` | 没思路 |
| `mistake` | 算错 |
| `checked_answer` | 看答案 |

## 后续计划（Roadmap）

- [ ] SQLite 持久化（替换 localStorage）
- [ ] 全局快捷键 `Ctrl + Alt + T` 呼出窗口
- [ ] 系统托盘图标
- [ ] 数据导出 CSV
- [ ] 错题本 / 复盘视图
- [ ] 题目标签 / 难度统计
- [ ] 自动更新

## 贡献

欢迎 PR 和 Issue！
开源协议：[MIT](LICENSE)

---

*Made with ❤️ for 考研人*
