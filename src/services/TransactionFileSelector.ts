import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, extname, isAbsolute, join } from "node:path";

import type { ImportSelection } from "../cli/ImportPrompt.js";

const SUPPORTED_EXTENSIONS = new Set([
    ".csv",
    ".json",
    ".xml"
]);

const isSupportedFile = (filename: string): boolean =>
    SUPPORTED_EXTENSIONS.has(extname(filename).toLowerCase());

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
                isSupportedFile(entry.name)
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
        !isSupportedFile(selection.filename)
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
