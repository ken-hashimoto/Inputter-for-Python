(function () {
    const vscode = acquireVsCodeApi();

    document.querySelector('.execute-python-code').addEventListener('click', () => {
        const commandInput = document.querySelector('#command-input').value;
        vscode.postMessage({ type: 'executeCommand', value: commandInput });

    });
}());