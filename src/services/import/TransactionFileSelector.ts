import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, isAbsolute, join } from "node:path";

import type { ImportSelection } from "../../cli/ImportPrompt.js";
import { isSupportedTransactionFile } from "./TransactionReaderRegistry.js";

export interface TransactionFile {
    readonly filename: string;
    readonly path: string;
}

export function selectTransactionFiles(directory: string, selection: ImportSelection): TransactionFile[] {
    if (selection.type === "all") {
        return readdirSync(directory, {
            withFileTypes: true
        })
            .filter((entry) =>
                entry.isFile() &&
                isSupportedTransactionFile(entry.name)
            )
            .map((entry) => ({
                filename: entry.name,
                path: join(directory, entry.name)
            }))
            .sort((first, second) =>
                first.filename.localeCompare(
                    second.filename
                )
            );
    }

    if (
        !selection.filename ||
        isAbsolute(selection.filename) ||
        /[\\/]/.test(selection.filename) ||
        basename(selection.filename) !== selection.filename ||
        !isSupportedTransactionFile(selection.filename)
    ) {
        throw new Error(`"${selection.filename}" is not a valid transaction filename.`);
    }

    const filePath = join(directory, selection.filename);

    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        throw new Error(`Transaction file "${selection.filename}" was not found.`);
    }

    return [{
        filename: selection.filename,
        path: filePath
    }];
}
