import { isValid } from "date-fns";

import { Transaction } from "../../../modules/Transaction.js";
import {
    TransactionImportValidationError,
    type TransactionImportValidationIssue
} from "./TransactionImportValidationError.js";

export interface TransactionInput {
    readonly date: Date;
    readonly dateText: string;
    readonly from: string;
    readonly to: string;
    readonly narrative: string;
    readonly amount: number;
    readonly amountText: string;
    readonly location: string;
}

export class TransactionValidator {
    createTransactions(inputs: readonly TransactionInput[]): Transaction[] {
        const issues = inputs.flatMap((input) => this.validate(input));

        if (issues.length > 0) {
            throw new TransactionImportValidationError(issues);
        }

        return inputs.map((input) =>
            new Transaction(
                input.date,
                input.from,
                input.to,
                input.narrative,
                input.amount
            )
        );
    }

    private validate(input: TransactionInput): TransactionImportValidationIssue[] {
        const issues: TransactionImportValidationIssue[] = [];

        if (!input.from) {
            issues.push({
                location: input.location,
                field: "From",
                message: "Sender is required"
            });
        }

        if (!input.to) {
            issues.push({
                location: input.location,
                field: "To",
                message: "Recipient is required"
            });
        }

        if (
            input.from &&
            input.to &&
            input.from === input.to
        ) {
            issues.push({
                location: input.location,
                field: "From/To",
                message: "Sender and recipient must be different"
            });
        }

        if (!input.narrative) {
            issues.push({
                location: input.location,
                field: "Narrative",
                message: "Narrative is required"
            });
        }

        if (!isValid(input.date)) {
            issues.push({
                location: input.location,
                field: "Date",
                message: `"${input.dateText}" is not a valid date`
            });
        }

        if (
            !Number.isFinite(input.amount) ||
            input.amount < 0
        ) {
            issues.push({
                location: input.location,
                field: "Amount",
                message: `"${input.amountText}" is not a valid amount`
            });
        }

        return issues;
    }
}
