# Command AI - ai-cli

This tool leverages AI-based services like Ollama and ChatGPT to execute commands seamlessly. It offers an interactive CLI for managing your system directly from the command line. Whether you need to retrieve your IP address or generate complete C programs from scratch, this tool has you covered.

## ALPHA!

Currently this is not optimized for all models. Your mileage will very as we fine tune our prompts for each model. The default config allows you to see execution plans and descriptions before executing the scripts.

## Features

- **AI Service Selection**: Choose between Ollama and ChatGPT for script generation.
- **Dynamic Configuration**: Easily configure the tool through prompts.
- **Execution Description and Plan**: View detailed plans and descriptions before executing the scripts.
- **Logging**: Optional logging for debugging and historical records.

## Requirements

- Node.js
- NPM

## Installation

1. Install globally via npm:

    ```bash
    npm install -g command-ai
    ```

2. Upgrade

    ```bash
    npm update -g command-ai
    ```
    
## Usage

1. **Initial Setup**:
    - On the first run, you will be prompted to configure the AI service and other settings. The configuration will be saved in your home directory under `~/.commandai/config.json`.

    ```bash
    ai
    ```

2. **Provide Command Input**:
    - You can provide a command either as an argument or via standard input.

    ```bash
    ai "your requests here"

    #examples requests.. use quotes as needed for your shell rules
    ai make a cron job that checks my ip and curls https://myipchanged.com when it changes

    ai make a npm project in ~/hello-world that will start a webserver that says hello world and is configurable from a .env file

    ai in the background make a list of all the js files on this computer and place them in ~/js.txt
    ```

    <br>
    - Alternatively, if no argument is provided, `ai` will prompt you to enter a command.
<br>

    
    ai
    

3. **View Execution Plan & Description**:
    - After providing a command, Command AI fetches the script and displays the execution plan and description. You can choose whether to proceed with the script execution.

4. **Logging**:
    - If logging is enabled, all commands and their results will be logged for debugging and future reference.

## Configuration

The tool uses a configuration file stored at `~/.commandai/config.json`. The default configuration schema is as follows:

```json
{
  "aiService": "",           // AI service ("Ollama" or "ChatGPT")
  "ollamaUrl": "",           // URL for Ollama server
  "ollamaModel": "",         // Model to use for Ollama
  "chatgptApiKey": "",       // API key for ChatGPT
  "chatgptModel": "",        // Model to use for ChatGPT
  "showExecutionDescription": true,  // Show execution description
  "showExecutionPlan": true, // Show execution plan
  "enableLogging": false     // Enable logging
}
```
## Development

To run the project in a development environment, clone the repository and install dependencies:

```bash
git clone <https://github.com/username/command-ai.git>
cd command-ai
npm install
```

Run the project:
```
npm start
```

## Contributing

We welcome contributions! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License.


<br><br>
# Enjoy making your CLI life easy CommandAI!
