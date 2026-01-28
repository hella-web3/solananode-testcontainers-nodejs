import {
  AbstractStartedContainer,
  GenericContainer,
  StartedTestContainer,
  Wait,
} from "testcontainers";

const BASE_ENTRYPOINT = ["solana-test-validator"];

/**
 * A Testcontainer for Foundry's Anvil.
 *
 * @example
 * ```typescript
 * const container = await new AnvilContainer().start();
 * ```
 */
export class SolanaValidatorContainer extends GenericContainer {
  private entryPoint: string[] = BASE_ENTRYPOINT;

  /**
   * Creates a new SolanaValidatorContainer.
   * @example
   * ```typescript
   * const container = await new SolanaValidatorContainer().start();
   * ```
   * @param image The docker image to use. Defaults to "hellaweb3/foundry-anvil:1.6".
   */
  constructor(image: string = "solanalabs/solana:stable") {
    super(image);
    this.withExposedPorts(8545);
    this.withWaitStrategy(Wait.forLogMessage(/Listening on 0\.0\.0\.0:8899/));
  }

  /**
   * Starts the container and returns a {@link StartedSolanaValidatorContainer}.
   * @returns A promise that resolves to the started container.
   */
  public override async start(): Promise<StartedSolanaValidatorContainer> {
    this.entryPoint.push("--host", "0.0.0.0");
    this.withEntrypoint(this.entryPoint);

    const startedContainer = await super.start();
    return new StartedSolanaValidatorContainer(
      startedContainer,
      `http://${startedContainer.getHost()}:${startedContainer.getMappedPort(8899)}`,
    );
  }
}

/**
 * Represents a hex string with a 0x prefix.
 */
export type HexString = `0x${string}`;

/**
 * A started Anvil container with helper methods for interacting with the node.
 */
export class StartedSolanaValidatorContainer extends AbstractStartedContainer {
  private readonly _rpcUrl;

  /**
   * Creates a new StartedAnvilContainer.
   * @param startedTestContainer The underlying TestContainer.
   * @param url The RPC URL of the started container.
   */
  constructor(startedTestContainer: StartedTestContainer, url: string) {
    super(startedTestContainer);
    this._rpcUrl = url;
  }

  /**
   * Gets the RPC URL of the Anvil node.
   */
  get rpcUrl() {
    return this._rpcUrl;
  }
}
