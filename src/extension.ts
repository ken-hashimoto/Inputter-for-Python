import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	const provider = new PythonInputViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(PythonInputViewProvider.viewType, provider));
}

class PythonInputViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'PythonInput.InputView';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(async data => {
			switch (data.type) {
				case 'executeCommand': {
					let terminal = vscode.window.terminals.find(t => t.name === 'Python Debug Console');
					if (terminal) {
						terminal.show();
						terminal.sendText(data.value);
					} else {
						const debugConfig = {
							type: "python",
							request: "launch",
							name: "Launch Python File",
							program: "${file}",
							console: "integratedTerminal",
						};
		
						await vscode.debug.startDebugging(undefined, debugConfig);
		
						terminal = vscode.window.terminals.find(t => t.name === 'Python Debug Console');
						if (terminal) {
							terminal.show();
							terminal.sendText(data.value);
						}
					}
					break;
				}
			}
		});
		
	}


	private _getHtmlForWebview(webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));

		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleVSCodeUri}" rel="stylesheet">

				<title>Python Input</title>
			</head>
			<body>
				<textarea id="command-input" cols="5" rows="5"></textarea>

				<button class="execute-python-code">実行</button>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
