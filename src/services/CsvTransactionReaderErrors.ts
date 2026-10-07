import type { CsvImportValidationIssue } from "./CsvTransactionReader.js";

export class CsvImportValidationError extends Error {
    readonly issues: readonly CsvImportValidationIssue[];

    constructor(issues: readonly CsvImportValidationIssue[]) {
        super(
            issues
                .map((issue) => {
                    const field =
                        issue.field === "From"
                            ? "sender"
                            : issue.field === "To"
                              ? "recipient"
                              : issue.field.toLowerCase();

                    return `Invalid ${field} at row ${issue.line}: ${issue.message}`;
                })
                .join("\n")
        );

        this.name = "CsvImportValidationError";
        this.issues = issues;
    }
}
