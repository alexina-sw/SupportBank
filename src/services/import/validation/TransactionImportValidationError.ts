export interface TransactionImportValidationIssue {
    readonly location: string;
    readonly field: string;
    readonly message: string;
}

export class TransactionImportValidationError extends Error {
    readonly issues: readonly TransactionImportValidationIssue[];

    constructor(issues: readonly TransactionImportValidationIssue[]) {
        super(
            issues
                .map((issue) => {
                    const field =
                        issue.field === "From"
                            ? "sender"
                            : issue.field === "To"
                              ? "recipient"
                              : issue.field.toLowerCase();

                    return `Invalid ${field} at ${issue.location.toLowerCase()}: ${issue.message}`;
                })
                .join("\n")
        );

        this.name = "TransactionImportValidationError";
        this.issues = issues;
    }
}
