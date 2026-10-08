import readlineSync from "readline-sync";

import { afterEach, describe, expect, test, vi } from "vitest";

import { parseImportCommand, promptForImport } from "../../src/cli/ImportPrompt.js";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("parseImportCommand", () => {
    test.for([
        "Import All Transactions",
        "import all transactions",
        "IMPORT ALL TRANSACTIONS",
        "  Import All Transactions  ",
        "Import   All   Transactions"
    ])("parses the import-all command: %s", (command) => {
        expect(parseImportCommand(command)).toEqual({
            type: "all"
        });
    });

    test.for([
        "Import File Transactions2014.csv",
        "import file Transactions2014.csv",
        "  Import File Transactions2014.csv  ",
        "Import   File   Transactions2014.csv"
    ])("parses the import-file command: %s", (command) => {
        expect(parseImportCommand(command)).toEqual({
            type: "file",
            filename: "Transactions2014.csv"
        });
    });

    test.for([
        "",
        "Import",
        "Import All",
        "Import File",
        "Load Transactions2014.csv"
    ])("rejects the invalid command: %s", (command) => {
        expect(parseImportCommand(command)).toBeUndefined();
    });
});

describe("promptForImport", () => {
    test("returns a valid import selection", () => {
        const question = vi
            .spyOn(readlineSync, "question")
            .mockReturnValue("Import All Transactions");
        const log = vi
            .spyOn(console, "log")
            .mockImplementation(() => undefined);

        expect(promptForImport()).toEqual({ type: "all" });

        expect(question).toHaveBeenCalledWith("> ");
        expect(log).toHaveBeenCalledWith("Choose an import option:");
        expect(log).toHaveBeenCalledWith("  Import All Transactions");
        expect(log).toHaveBeenCalledWith("  Import File <filename>");
    });

    test("prompts again after an invalid command",
        () => {
            const question = vi
                .spyOn(readlineSync, "question")
                .mockReturnValueOnce("invalid")
                .mockReturnValueOnce("Import File Transactions2013.json");
            const log = vi
                .spyOn(console, "log")
                .mockImplementation(() => undefined);

            expect(promptForImport()).toEqual({
                type: "file",
                filename: "Transactions2013.json"
            });

            expect(question).toHaveBeenCalledTimes(2);
            expect(log).toHaveBeenCalledWith(
                "Invalid command. Use " +
                "'Import All Transactions' or " +
                "'Import File <filename>'."
            );
        }
    );
});
