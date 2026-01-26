import {
  AnvilContainer,
  HexString,
  LogVerbosity,
  StartedAnvilContainer,
} from "../src";
import { Abi, parseEther, parseEventLogs, TransactionReceipt } from "viem";

describe("AnvilContainer", () => {
  let container: StartedAnvilContainer;

  beforeAll(async () => {
    container = await new AnvilContainer()
      .verboseLogs(LogVerbosity.Five)
      .jsonLogFormat()
      .withRandomMnemonic()
      .autoImpersonate()
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
    const addresses = await container.addresses();

    const receipt: TransactionReceipt = await container.sendEthTransaction(
      addresses[0],
      addresses[1],
      "1",
    );

    expect(receipt.status).toBe("success");
    expect(receipt.transactionHash).toBeDefined();
    expect(receipt.from).toBe(addresses[0].toLowerCase() as HexString);
    expect(receipt.to).toBe(addresses[1].toLowerCase() as HexString);
  });

  it("test deploy and invoke contract", async () => {
    const addresses = await container.addresses();
    const contractAbi: Abi = container.contractAbi(
      "WrappedEther/WrappedEther.json",
    );
    const receipt: TransactionReceipt = await container.deployContract(
      contractAbi,
      container.contractBytecode("WrappedEther/WrappedEther.bin"),
      addresses[0],
    );

    expect(receipt).toBeDefined();
    expect(receipt.status).toBe("success");
    expect(receipt.transactionHash).toBeDefined();
    expect(receipt.from).toBe(addresses[0].toLowerCase() as HexString);
    expect(receipt.contractAddress).toBeDefined();

    const depositHash = await container.client.writeContract({
      address: receipt.contractAddress as HexString,
      abi: contractAbi,
      functionName: "deposit",
      value: parseEther("1.0"),
      account: addresses[0],
    });

    await container.client.mine({ blocks: 1 });
    const wrapEthReceipt = await container.client.waitForTransactionReceipt({
      hash: depositHash,
    });

    const logs = parseEventLogs({
      abi: contractAbi,
      logs: wrapEthReceipt.logs,
      eventName: "Deposit",
    });

    console.log(logs);

    const depositEvent = logs[0];
    expect(depositEvent).toBeDefined();
    expect(depositEvent.eventName).toBe("Deposit");
    // @ts-expect-error Property exists
    expect(depositEvent.args.dst).toBe(addresses[0]);
    // @ts-expect-error Property exists
    expect(depositEvent.args.wad).toBe(parseEther("1.0"));
  });
});
