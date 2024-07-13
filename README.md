# 🎉 Command AI

```text
 ██████╗ ██████╗ ███╗   ███╗███╗   ███╗ █████╗ ███╗   ██╗██████╗  █████╗ ██╗
██╔════╝██╔═══██╗████╗ ████║████╗ ████║██╔══██╗████╗  ██║██╔══██╗██╔══██╗██║
██║     ██║   ██║██╔████╔██║██╔████╔██║███████║██╔██╗ ██║██║  ██║███████║██║
██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██╔══██║██║╚██╗██║██║  ██║██╔══██║██║
╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║██║  ██║██║ ╚████║██████╔╝██║  ██║██║
 ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝╚═╝
```

[![Maintainability](https://api.codeclimate.com/v1/badges/fb6299a2ae58c7570afa/maintainability)](https://codeclimate.com/github/CommandAI/ai-cli/maintainability)

[Join our Discord](https://discord.gg/bUE6hzdmrh)

Welcome to Command AI, your new AI-powered command-line buddies! These programs makes handling tasks a breeze. Whether you need to automate routine tasks, set up new projects, run background operations, or simply start a chat. Just tell it what you want, and it'll get to work. Check out some cool things it can do:

- **Automate Your Routine Tasks:** Need a cron job that checks your IP and pings a specific URL if it changes? Just ask!

  ```bash
  ai "make a cron job that checks my IP and calls https://myipchanged.com when it changes"
  ```

- **Set Up Projects on the Fly:** Want to start an npm project that spins up a configurable web server greeting you with "hello world"? No problem.

  ```bash
  ai "create an npm project in ~/hello-world that starts a webserver saying 'hello world' and reads configs from a .env file"
  ```

- **Run Background Jobs:** Need to list all the JavaScript files on your computer and save them in a file? It can handle that in the background.

  ```bash
  ai "in the background, list all the JS files on this computer and put them in ~/js.txt"
  ```

- **Query Databases with AI**: Want to interact with a database using natural language? Use `aiq`! Suports MYSQL, Postgres, and SQLite.

```bash
  aiq my_database "list all users where age is over 30"
```


- **Start an AI conversation:** Want to have a conversation with an AI? It can do that too.

  ```bash
  aic "what is the meaning of life?"
  ```

Just type your request into the CLI with `ai "your requests here"`, and watch the magic happen. It's like having a personal assistant for your terminal!

## 🚧 ALPHA Stage Alert 🚧

This tool is still in its alpha stage, so expect some hiccups as we fine-tune our prompts for different models. The default settings show you execution plans and descriptions before running scripts to keep you in the loop / safe.

## 🔥 Features

- **AI Service Selection**: Pick between Ollama, ChatGPT, and any OpenAI compatable server.
- **Easy Configuration**: Set everything up quickly with a few prompts.
- **Command Line Power**: Ask the AI to do any task(s) you would want to do at the command line.
- **DB Power**: Ask the AI for any information from your DB in plain language.
- **Conversational AI**: Start a conversation with the AI.

## 📋 Requirements

- Node.js
- npm

## 🚀 Installation

1. **Install globally via npm**:

    ```bash
    npm install -g command-ai
    ```

2. **Upgrade**:

    ```bash
    ai upgrade
    ```

## 🎮 Usage

### Initial Setup

The first time you run it, you’ll set up your AI service and other settings. It saves everything in `~/.commandai/config.json`.

```bash
ai
```

### Provide Command Input

Type your command either as an argument or enter it when prompted.

```bash
ai "your requests here"

# Example requests (use quotes if your shell needs them):
ai make a cron job that checks my IP and calls https://myipchanged.com when it changes

ai create an npm project in ~/hello-world that starts a webserver saying "hello world" and reads configs from a .env file

ai in the background, list all the JS files on this computer and put them in ~/js.txt

# Start AI Database Query (first param is the database name, second is the query)
aiq my_database "list all users where age is over 30"
# or
aiq my_database "list all users where age is over 30

# Don't start a AI Database Query Session.. Just get one response in JSON format.
aiq! my_database "list all users where age is over 30"

# Start an AI conversation
aic "what is the meaning of life?"

# Get only one response from AI
aic! "what is the meaning of life?"
```

More commands..

```bash
# If you don't provide prompt, `ai` will just ask you to enter it.
ai

# If you are feeling lucky an exclamation will execute without confirmation.
ai! list all the dot files

# Reconfigure 
ai config
aic config

#configure db connections
aiq config

# Upgrade Command AI
ai upgrade
```

### Execution Plans & Descriptions

After you enter a command, Command AI will fetch a script and show you the plan and description. You decide if you want to run it!

### Logging

If you turn logging on, commands and results are stored so you can revisit them anytime. (also please turn on and send if you open up a bug ticket)

## ⚙️ Configuration

AI Settings for all utilies are stored at `~/.commandai/config.json`. Here’s what it looks like:

```json
{
  "aiService": "",                   // Pick "Ollama" "ChatGPT" "OpenAI"
  "ollamaUrl": "",                   // Ollama server URL
  "ollamaModel": "",                 // Model for Ollama
  "openAIApiKey": "",                // ChatGPT / OpenAI API key
  "openAIModel": "",                 // Model for OpenAI
  "openAIUrl": "",                   // URL for OpenAI not needed for ChatGPT
  "showExecutionDescription": true,  // Show descriptions
  "showExecutionPlan": true,         // Show plans
  "enableLogging": false             // Enable logging
}
```

DB Settings for `aiq` are stored at `~/.commandai/db.json`. You can setup as many connections as you like. Here’s what it looks like:

```json
[
  {
    "name": "PostgreSQL_Connection",
    "type": "postgres",
    "config": {
      "user": "postgres_user",
      "host": "localhost",
      "database": "postgres_db",
      "password": "postgres_password",
      "port": 5432
    }
  },
  {
    "name": "MySQL_Connection",
    "type": "mysql",
    "config": {
      "user": "mysql_user",
      "host": "localhost",
      "database": "mysql_db",
      "password": "mysql_password",
      "port": 3306
    }
  },
  {
    "name": "SQLite_Connection",
    "type": "sqlite",
    "config": {
      "filename": "/path/to/sqlite.db"
    }
  }
]
```

NOTE! sqlite does not require to be in the config you can just list the file as the first param.

## 💻 Development

Want to help out? Great! Clone the repo and install dependencies:

```bash
git clone https://github.com/username/command-ai.git
cd command-ai
npm install
```

Run the project:

```bash
npm start
```

## 🤝 Contributing

We’d love your help! Fork the repo, checkout the `pre-release` branch, make some changes, and send over a pull request. If you want to use the code for your local usage instead of installing it globally, follow these steps:

1. **Clone your forked repo:**
   ```sh
   git clone https://github.com/your-username/command-ai.git
   cd command-ai
   ```
2. **Checkout the `pre-release` branch:**
    ```sh
    git checkout pre-release
    ```
    This branch is where we merge all the new features and bug fixes before they are released.
3. **Link the project locally:**
    ```sh
    npm link
    ```
    After these steps, you can use the commands (ai, aic, aiq, etc.) from your local development environment without installing the package globally.



## 📜 License

This project is licensed under the MIT License.

---

Enjoy making your CLI life easier with Command AI!
