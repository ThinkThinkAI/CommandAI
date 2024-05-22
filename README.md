# AI CLI

**Version:** Alpha

## Overview

JSONScriptLib CLI is a command-line application designed to interact with AI services like Ollama and ChatGPT to generate and execute scripts based on user commands. The application can handle a variety of tasks by converting user inputs into structured JSONScripts, which are then executed step-by-step.

## Features

- **AI Integration**: Supports generating scripts using both Ollama and ChatGPT AI services.
- **Configurable Execution**: Allows users to configure the AI service and models used for script generation.
- **OS Awareness**: Automatically includes the operating system information in AI prompts.
- **Execution Description**: Provides an option to display a description of each step before execution.
- **Execution Plan**: Provides an option to display the execution plan.
- **Loading Animation**: Displays a loading animation while waiting for the AI to generate scripts.
- **Streamlined Execution**: Executes commands and creates files as specified by the JSONScript.

## Usage

Run the CLI with a command to generate and execute a script:

```bash
./index.js <your-command>
```

## Example
```bash
./index.js create and compile a hello world program in c
```

```bash
./index.js show me all the javascript files
```


