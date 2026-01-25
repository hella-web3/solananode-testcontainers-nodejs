import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {AnvilContainer, HexString, LogVerbosity, StartedAnvilContainer} from "../src/index.js";
import {TransactionReceipt} from "viem";

describe("AnvilContainer", () => {
    let container: StartedAnvilContainer;

    beforeAll(async () => {
        container = await new AnvilContainer()
            .verboseLogs(LogVerbosity.Five)
            .jsonLogFormat()
            .withRandomMnemonic()
            .start();
    }, 60000);

    afterAll(async () => {
        if (container) await container.stop();
    });

    it("should start and be reachable", async () => {

        const blockNumber = await container.client.getBlockNumber();
        expect(blockNumber).toBeDefined();
        expect(typeof blockNumber).toBe("bigint");
    });

    it("test send transaction", async () => {

        let addresses = await container.addresses();

        const receipt: TransactionReceipt = await container.sendEthTransaction(
            addresses[0],
            addresses[1],
            "1");

        expect(receipt.status).toBe('success');
        expect(receipt.transactionHash).toBeDefined();
        expect(receipt.from).toBe(addresses[0].toLowerCase() as HexString);
        expect(receipt.to).toBe(addresses[1].toLowerCase() as HexString);
    });

    it("test deploy contract", async () => {

        let addresses = await container.addresses();

        const receipt: TransactionReceipt = await container.deployContract(
            container.contractAbi('WrappedEther/WrappedEther.json'),
            container.contractBytecode('WrappedEther/WrappedEther.bin') as HexString,
            addresses[0]);

        expect(receipt).toBeDefined();
        expect(receipt.status).toBe('success');
        expect(receipt.transactionHash).toBeDefined();
        expect(receipt.from).toBe(addresses[0].toLowerCase() as HexString);
        expect(receipt.contractAddress).toBeDefined();
    });
});