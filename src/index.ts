#!/usr/bin/env node

import { CCKey } from "codechain-keystore";
import * as program from "commander";
import * as fs from "fs";
import * as _ from "lodash";
import * as process from "process";

import { createKey } from "./command/create";
import { deleteKey } from "./command/delete";
import { exportKey } from "./command/export";
import { importKey } from "./command/import";
import { importRawKey } from "./command/importRaw";
import { listKeys } from "./command/list";
import { CLIError, CLIErrorType } from "./error";
import {
    AccountType,
    CreateOption,
    DeleteOption,
    ExportOption,
    ImportOption,
    ListOption
} from "./types";

const VERSION = "0.1.1";

program
    .version(VERSION)
    .option(
        "-t, --account-type <accountType>",
        "'platform' or 'asset'. The type of the key",
        "platform"
    );

program
    .command("list")
    .description("list keys")
    .action(handleError(listCommand));

program
    .command("create")
    .description("create a new key")
    .option("-p, --passphrase <passphrase>", "passphrase")
    .action(handleError(createCommand));

program
    .command("delete")
    .description("delete the key")
    .option("-a, --address <address>", "address")
    .action(handleError(deleteCommand));

program
    .command("import <path>")
    .description("import a key")
    .option("-p, --passphrase <passphrase>", "passphrase")
    .action(handleError(importCommand));

program
    .command("import-raw <privateKey>")
    .description("import a raw private key (32 byte hexadecimal string)")
    .option("-p, --passphrase <passphrase>", "passphrase")
    .action(handleError(importRawCommand));

program
    .command("export")
    .description("export the key")
    .option("-a, --address <address>", "address")
    .option("-p, --passphrase <passphrase>", "passphrase")
    .option("--pretty", "pretty-print the output")
    .action(handleError(exportCommand));

function handleError(
    f: (...args: any[]) => Promise<void>
): (...args: any[]) => Promise<void> {
    return async (...args: any[]) => {
        try {
            await f(...args);
        } catch (err) {
            console.error(err.toString());
            process.exit(1);
        }
    };
}

async function listCommand(option: ListOption) {
    const cckey = await CCKey.create();
    const accountType = parseAccountType(option.parent.accountType);
    await listKeys(cckey, accountType);
}

async function createCommand(option: CreateOption) {
    const cckey = await CCKey.create();
    const accountType = parseAccountType(option.parent.accountType);
    const passphrase = parsePassphrase(option.passphrase);
    await createKey(cckey, accountType, passphrase);
}

async function deleteCommand(option: DeleteOption) {
    const cckey = await CCKey.create();
    const accountType = parseAccountType(option.parent.accountType);
    const address = parseAddress(option.address);
    await deleteKey(cckey, accountType, address);
}

async function importCommand(path: string, option: ImportOption) {
    const cckey = await CCKey.create();
    const accountType = parseAccountType(option.parent.accountType);
    const passphrase = parsePassphrase(option.passphrase);
    const contents = fs.readFileSync(path, { encoding: "utf8" });
    await importKey(cckey, accountType, JSON.parse(contents), passphrase);
}

async function importRawCommand(privateKey: string, option: ImportOption) {
    const cckey = await CCKey.create();
    const accountType = parseAccountType(option.parent.accountType);
    const passphrase = parsePassphrase(option.passphrase);
    await importRawKey(cckey, accountType, privateKey, passphrase);
}

async function exportCommand(option: ExportOption) {
    const cckey = await CCKey.create();
    const accountType = parseAccountType(option.parent.accountType);
    const address = parseAddress(option.address);
    const passphrase = parsePassphrase(option.passphrase);
    const secret = await exportKey(cckey, accountType, address, passphrase);
    const res = option.pretty
        ? JSON.stringify(secret, null, 2)
        : JSON.stringify(secret);
    console.log(res);
}

program.on("--help", () => {
    console.log(`  Examples:

    cckey create -t platform --passphrase "my password"

    cckey list -t asset

    cckey delete -t platform --address "tcc..."
`);
});

program.parse(process.argv);
if (program.args.length === 0) {
    program.outputHelp();
    process.exit(1);
}

function parseAccountType(accountType: string): AccountType {
    if (_.isUndefined(accountType)) {
        throw new CLIError(CLIErrorType.OptionRequired, {
            optionName: "account-type"
        });
    }
    if (!_.includes(["platform", "asset"], accountType)) {
        throw new CLIError(CLIErrorType.InvalidAccountType);
    }
    return accountType as AccountType;
}

function parseAddress(address: string): string {
    if (_.isUndefined(address)) {
        throw new CLIError(CLIErrorType.OptionRequired, {
            optionName: "address"
        });
    }
    // FIXME: Validate the address.
    return address;
}

function parsePassphrase(passphrase: string): string {
    if (_.isUndefined(passphrase)) {
        throw new CLIError(CLIErrorType.OptionRequired, {
            optionName: "passphrase"
        });
    }
    return passphrase;
}
