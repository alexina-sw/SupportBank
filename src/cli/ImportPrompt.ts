import readlineSync from "readline-sync";

export type ImportSelection =
    | { readonly type: "all" }
    | { readonly type: "file"; readonly filename: string };

export function parseImportCommand(command: string): ImportSelection | undefined {
    const trimmedCommand = command.trim();

    if (/^import\s+all\s+transactions$/i.test(trimmedCommand)) {
        return { type: "all" };
    }

    const filename = /^import\s+file\s+(.+)$/i.exec(trimmedCommand)?.[1]?.trim();

    if (filename) {
        return {
            type: "file",
            filename
        };
    }

    return undefined;
}

export function promptForImport(): ImportSelection {
    console.log("Choose an import option:");
    console.log("  Import All Transactions");
    console.log("  Import File <filename>");

    while (true) {
        const selection = parseImportCommand(
            readlineSync.question("> ")
        );

        if (selection) {
            return selection;
        }

        console.log(
            "Invalid command. Use 'Import All Transactions' or 'Import File <filename>'."
        );
    }
}
