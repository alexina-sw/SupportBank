import { readFileSync } from "node:fs";

import { XMLParser, XMLValidator } from "fast-xml-parser";

import { Transaction } from "../modules/Transaction.js";
import type { TransactionReader } from "./TransactionReader.js";
import { TransactionValidator, type TransactionInput } from "./TransactionValidator.js";

interface XmlTransaction {
    readonly "@_Date"?: string;
    readonly Description?: string;
    readonly Value?: string;
    readonly Parties?: {
        readonly From?: string;
        readonly To?: string;
    };
}

interface XmlDocument {
    readonly TransactionList?: {
        readonly SupportTransaction?: XmlTransaction | XmlTransaction[];
    } | string;
}

const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: false,
    parseTagValue: false,
    trimValues: true
});

const asText = (value: unknown): string =>
    typeof value === "string"
        ? value.trim()
        : "";

const excelDateToDate = (serial: number): Date => new Date(1899, 11, 30 + serial);

export class XmlTransactionReader implements TransactionReader {
    private readonly validator = new TransactionValidator();

    parse(xmlText: string): Transaction[] {
        const validationResult = XMLValidator.validate(xmlText);

        if (validationResult !== true) {
            throw new SyntaxError(`Invalid XML: ${validationResult.err.msg}`);
        }

        const document = parser.parse(xmlText) as XmlDocument;
        const transactionList = document.TransactionList;

        if (transactionList === undefined) {
            throw new Error("XML transaction data must contain a TransactionList element.");
        }

        if (transactionList === "") {
            return [];
        }

        if (typeof transactionList !== "object") {
            throw new Error("XML TransactionList must be an element.");
        }

        const parsedTransactions = transactionList.SupportTransaction;

        if (parsedTransactions === undefined) {
            return [];
        }

        const transactions = Array.isArray(parsedTransactions)
            ? parsedTransactions
            : [parsedTransactions];

        const inputs = transactions.map((transaction, index) =>
            this.createInput(transaction, index)
        );

        return this.validator.createTransactions(inputs);
    }

    read(filePath: string): Transaction[] {
        return this.parse(readFileSync(filePath, "utf8"));
    }

    private createInput(transaction: XmlTransaction, index: number): TransactionInput {
        const dateText = asText(transaction["@_Date"]);
        const amountText = asText(transaction.Value);
        const dateSerial = Number(dateText);

        return {
            date: dateText === ""
                ? new Date(Number.NaN)
                : excelDateToDate(dateSerial),
            dateText,
            from: asText(transaction.Parties?.From),
            to: asText(transaction.Parties?.To),
            narrative: asText(transaction.Description),
            amount: amountText === ""
                ? Number.NaN
                : Number(amountText),
            amountText,
            location: `Transaction ${index + 1}`
        };
    }
}
