import * as vscode from "vscode";
const translate = require("./translate");

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "vampire" is now active!');

  registerMap(context);

  registerUniq(context);

  registerSort(context);

  registerJoin(context);

  registerShuffle(context);

  registerReverse(context);

  registerTranslate(context);

  registerCapitalize(context);
}

/**
 * register reverse extension
 * @param context
 */
function registerReverse(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("extension.reverse", () => {
    const editor = vscode.window.activeTextEditor;

    if (editor === undefined) {
      return;
    }

    const reversed = editor.selections
      .map((selection) => editor.document.getText(selection))
      .reverse();

    editor.edit((builder) => {
      editor.selections.forEach((selection, index) => {
        builder.replace(selection, "" + reversed[index]);
      });
    });
  });

  context.subscriptions.push(disposable);
}

/**
 * register join extension
 * @param context
 */
function registerJoin(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "extension.join",
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        return;
      }

      const delimiter = await vscode.window.showInputBox();

      const selections = editor.selections.map((selection) =>
        editor.document.getText(selection)
      );

      const joined = selections.join(delimiter);

      editor.edit((builder) => {
        editor.selections.forEach((selection, index) => {
          builder.replace(selection, index === 0 ? "" + joined : "");
        });
      });
    }
  );

  context.subscriptions.push(disposable);
}

/**
 * register unique extension
 * @param context
 */
function registerUniq(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("extension.uniq", () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    const selections = editor.selections.map((selection) =>
      editor.document.getText(selection)
    );
    const uniques = Array.from(new Set(selections));

    editor.edit((builder) => {
      editor.selections.forEach((selection, index) => {
        builder.replace(selection, "" + (uniques[index] || ""));
      });
    });
  });

  context.subscriptions.push(disposable);
}

/**
 * register capitalize extension
 * @param context
 */
function registerCapitalize(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "extension.capitalize",
    () => {
      const editor = vscode.window.activeTextEditor;

      if (editor === undefined) {
        return;
      }

      editor.selections.forEach(async (selection) => {
        const content = editor.document.getText(selection);
        const result = content.trim().split(/\s+/).map(capitalize).join(" ");
        editor.edit((builder) => {
          builder.replace(selection, "" + result);
        });
      });
    }
  );

  context.subscriptions.push(disposable);
}

/**
 * register translate extension
 * @param context
 */
function registerTranslate(context: vscode.ExtensionContext) {
  let out: vscode.OutputChannel;

  const disposable = vscode.commands.registerCommand(
    "extension.trans",
    async () => {
      const target = "中文"; //await vscode.window.showQuickPick(Object.values(translate.Translate.Lang));

      const editor = vscode.window.activeTextEditor;

      if (editor === undefined) {
        return;
      }

      if (!out) {
        out = vscode.window.createOutputChannel("翻译");
        out.show();
      }

      const worker = new translate.Translate(out);

      const words: any[] = unique(
        editor.selections.map((selection) => editor.document.getText(selection))
      );

      const translations = await Promise.all(
        words.map(async (word) => {
          return await worker.translate(word, target);
        })
      );

      const mapping: any = {};

      words.forEach((word, index) => {
        mapping[word] = translations[index];
      });

      editor.edit((builder) => {
        editor.selections.forEach((selection) => {
          const word = editor.document.getText(selection);
          const translation = mapping[word];
          if (word) {
            builder.replace(selection, "" + translation);
          }
        });
      });
    }
  );

  context.subscriptions.push(disposable);
}

function unique(xs: any[]) {
  return Array.from(new Set(xs));
}

function registerSort(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("extension.sort", () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    const sorted = editor.selections
      .map((selection) => editor.document.getText(selection))
      .sort();

    editor.edit((builder) => {
      editor.selections.forEach((selection, index) => {
        builder.replace(selection, "" + sorted[index]);
      });
    });
  });

  context.subscriptions.push(disposable);
}

function registerShuffle(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("extension.shuffle", () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    const elements = editor.selections.map((selection) =>
      editor.document.getText(selection)
    );
    const shuffled = shuffle(elements);

    editor.edit((builder) => {
      editor.selections.forEach((selection, index) => {
        builder.replace(selection, "" + shuffled[index]);
      });
    });
  });

  context.subscriptions.push(disposable);
}

function registerMap(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "extension.map",
    async () => {
      const transformer = await vscode.window.showInputBox();

      if (!transformer) {
        return;
      }

      const editor = vscode.window.activeTextEditor;

      if (editor === undefined) {
        return;
      }

      let elements: any;

      try {
        elements = editor.selections
          .map((selection) => editor.document.getText(selection))
          .map((original) => {
            const partials = original.split(/\s+/);
            const args = partials.map((partial, index) => `$${index + 1}`);
            const functor = new Function("$", "_", ...args, `return ${transformer}`);
            
            try {
              return functor(original, partials, ...partials);
            } catch (error) {
              vscode.window.showErrorMessage(error.message);
              throw new Error("transform error");
            }
          });
      } catch (error) {
        return;
      }

      editor.edit((builder) => {
        editor.selections.forEach((selection, index) => {
          builder.replace(selection, "" + elements[index]);
        });
      });
    }
  );

  context.subscriptions.push(disposable);
}

/**
 * Fisher-Yates (aka Knuth) Shuffle Algorithm
 * @param array
 * @returns
 */
function shuffle(array: any) {
  var currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

/**
 * capitalize a string
 * @param str
 * @returns
 */
function capitalize(str: string) {
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
}

export function deactivate() { }
