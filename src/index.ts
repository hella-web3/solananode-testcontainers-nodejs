import {AbstractStartedContainer, GenericContainer, StartedTestContainer, Wait} from "testcontainers";
import {createTestClient, http, parseEther, publicActions, TransactionReceipt, walletActions} from "viem";
import {foundry} from "viem/chains";
import * as fs from "node:fs";
import path from "node:path";

const BASE_ENTRYPOINT = [
    "anvil",
    "--block-time",
    "1",
    "--auto-impersonate"
];

/**
 * Enum for Anvil log verbosity levels.
 */
export enum LogVerbosity {
    /** -v */
    One = "-v",
    /** -vv */
    Two = "-vv",
    /** -vvv */
    Three = "-vvv",
    /** -vvvv */
    Four = "-vvvv",
    /** -vvvvv */
    Five = "-vvvvv"
}

/**
 * A Testcontainer for Foundry's Anvil.
 *
 * @example
 * ```typescript
 * const container = await new AnvilContainer().start();
 * ```
 */
export class AnvilContainer extends GenericContainer {

    private entryPoint: string[] = BASE_ENTRYPOINT;

    /**
     * Creates a new AnvilContainer.
     * @example
     * ```typescript
     * const container = await new AnvilContainer().start();
     * ```
     * @param image The docker image to use. Defaults to "hellaweb3/foundry-anvil:1.6".
     */
    constructor(image: string = "hellaweb3/foundry-anvil:1.6") {
        super(image);
        this.withExposedPorts(8545);
        this.withWaitStrategy(Wait.forLogMessage(/Listening on 0\.0\.0\.0:8545/));
    }

    private setCliFlag(flag: string, value: string) {
        if (!this.entryPoint.includes(flag)) {
            this.entryPoint.push(flag, value);
            this.entryPoint[this.entryPoint.indexOf(flag) + 1] = value;
        }
    }

    /**
     * Starts Anvil with a random mnemonic.
     */
    public withRandomMnemonic() {
        if (!this.entryPoint.includes('--mnemonic-random')) {
            this.entryPoint.push('--mnemonic-random');
        }
        return this;
    }

    /**
     * Sets the log verbosity level.
     * @example
     * ```typescript
     * await new AnvilContainer().verboseLogs(LogVerbosity.Five).start();
     * ```
     * @param logVerbosity The verbosity level.
     */
    public verboseLogs(logVerbosity: LogVerbosity) {
        if (!this.entryPoint.includes(logVerbosity)) {
            this.entryPoint.push(logVerbosity);
        }
        return this;
    }

    /**
     * Sets the log format to JSON.
     */
    public jsonLogFormat() {
        if (!this.entryPoint.includes("--json")) {
            this.entryPoint.push("--json");
        }
        return this;
    }

    /**
     * Forks from a given RPC URL.
     * @param url The RPC URL to fork from.
     */
    public withForkUrl(url: string): this {
        this.withEnvironment({ANVIL_FORK_URL: url});
        this.setCliFlag("--fork-url", url);
        return this;
    }

    /**
     * Forks from a specific block number.
     * @param blockNumber The block number to fork from.
     */
    public withForkBlockNumber(blockNumber: number): this {
        this.withEnvironment({ANVIL_FORK_BLOCK_NUMBER: blockNumber.toString()});
        this.setCliFlag("--fork-block-number", blockNumber.toString());
        return this;
    }

    /**
     * Starts the container and returns a {@link StartedAnvilContainer}.
     * @returns A promise that resolves to the started container.
     */
    public override async start(): Promise<StartedAnvilContainer> {
        this.entryPoint.push("--host", "0.0.0.0");
        this.withEntrypoint(this.entryPoint);

        const startedContainer = await super.start();
        return new StartedAnvilContainer(startedContainer,
            `http://${startedContainer.getHost()}:${startedContainer.getMappedPort(8545)}`);
    }
}

/**
 * Represents a hex string with a 0x prefix.
 */
export type HexString = `0x${string}`;

/**
 * A started Anvil container with helper methods for interacting with the node.
 */
export class StartedAnvilContainer extends AbstractStartedContainer {
    private readonly _rpcUrl;
    private readonly _client;

    /**
     * Creates a new StartedAnvilContainer.
     * @param startedTestContainer The underlying TestContainer.
     * @param url The RPC URL of the started container.
     */
    constructor(startedTestContainer: StartedTestContainer, url: string) {
        super(startedTestContainer);
        this._rpcUrl = url;

        this._client = createTestClient({
            chain: foundry,
            mode: 'anvil',
            transport: http(url),
        }).extend(publicActions)
            .extend(walletActions);
    }

    /**
     * Gets the RPC URL of the Anvil node.
     */
    get rpcUrl() {
        return this._rpcUrl;
    }

    /**
     * Gets the viem TestClient for interacting with the Anvil node.
     */
    get client(): typeof this._client {
        return this._client;
    }

    /**
     * Gets the addresses available in the Anvil node.
     * @returns Array of addresses.
     */
    addresses(): Promise<HexString[]> {
        return this._client.getAddresses();
    }

    /**
     * Sends an ETH transaction.
     * @example
     * ```typescript
     * let addresses = await container.addresses();
     * const receipt = await container.sendEthTransaction(
     * addresses[0],
     * addresses[1],
     * "1");
     * ```
     *
     * @param from The sender address.
     * @param to The recipient address.
     * @param amount The amount of ETH to send (as a string, e.g., "1.5").
     * @returns Transaction receipt.
     */
    async sendEthTransaction(from: HexString, to: HexString, amount: string): Promise<TransactionReceipt> {
        const hash = await this._client.sendTransaction({
            account: from,
            from: from,
            to: to,
            value: parseEther(amount)
        });
        await this._client.mine({blocks: 1});

        return await this._client.waitForTransactionReceipt({hash});
    }

    /**
     * Deploys a contract to the Anvil node using local artifacts.
     * @example
     * ```typescript
     * const receipt = await container.deployContract(
     *     container.contractAbi('WrappedEther/WrappedEther.json'),
     *     container.contractBytecode('WrappedEther/WrappedEther.bin'),
     *     account);
     * ```
     *
     * @param abi The contract ABI.
     * @param bytecode The contract bytecode.
     * @param account The account to deploy from.
     * @returns Transaction receipt.
     */
    async deployContract(abi: any, bytecode: HexString, account: HexString): Promise<TransactionReceipt> {
        const hash = await this._client.deployContract({
            abi: abi,
            bytecode: bytecode,
            account
        });
        await this._client.mine({blocks: 1});

        const receipt = await this._client.waitForTransactionReceipt({hash});
        console.log(`Contract deployed to: ${receipt.contractAddress}`);

        return receipt;
    }

    /**
     * Get local testing artifact contract ABI for deployment to anvil.
     * @example
     * ```typescript
     * contractAbi('WrappedEther/WrappedEther.json')
     * ```
     *
     * @param abiLocation location of the ABI file relative to the test/artifacts directory
     */
    contractAbi(abiLocation: string) {
        const abiJson = fs.readFileSync(path.join(__dirname, `../test/artifacts/${abiLocation}`), 'utf8');
        return JSON.parse(abiJson);
    }

    /**
     * Get local testing artifact contract bytecode for deployment to anvil.
     * @example
     * ```typescript
     * contractBytecode('WrappedEther/WrappedEther.bin')
     * ```
     *
     * @param binLocation location of the bytecode file relative to the test/artifacts directory
     */
    contractBytecode(binLocation: string): HexString {
        return fs.readFileSync(path.join(__dirname, `../test/artifacts/${binLocation}`), 'utf8') as HexString;
    }
}
