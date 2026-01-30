import {
  AbstractStartedContainer,
  GenericContainer,
  StartedTestContainer,
  Wait,
} from "testcontainers";

/**
 * A Testcontainer for Wiremock.
 *
 * @example
 * ```typescript
 * const container = await new WiremockContainer().start();
 * ```
 */
export class WiremockContainer extends GenericContainer {
  /**
   * Creates a new WiremockContainer.
   * @example
   * ```typescript
   * const container = await new WiremockContainer().start();
   * ```
   * @param image The docker image to use. Defaults to "wiremock/wiremock".
   */
  constructor(image: string = "wiremock/wiremock") {
    super(image);
    this.withExposedPorts(8080);
    this.withWaitStrategy(Wait.forListeningPorts());
  }

  /**
   * Adds mappings to the Wiremock container.
   * @example
   * ```typescript
   * const container = await new WiremockContainer()
   *   .withMappings("./test/__mocks__/wiremock")
   *   .start();
   * ```
   * @param directory The directory containing the mappings and __files.
   */
  public withMappings(directory: string) {
    this.withCopyDirectoriesToContainer([{
      source: `${directory}/__files`,
      target: "/home/wiremock/__files",
    }]);
    this.withCopyDirectoriesToContainer([{
      source: `${directory}/mappings`,
      target: "/home/wiremock/mappings",
    }]);

    return this;
  }

  /**
   * Starts the container and returns a {@link StartedWiremockContainer}.
   * @returns A promise that resolves to the started container.
   */
  public override async start(): Promise<StartedWiremockContainer> {
    const startedContainer = await super.start();
    return new StartedWiremockContainer(
      startedContainer,
      `http://${startedContainer.getHost()}:${startedContainer.getMappedPort(8080)}`,
    );
  }
}

/**
 * A started Wiremock container with helper methods for interacting with the node.
 */
export class StartedWiremockContainer extends AbstractStartedContainer {
  private readonly _rpcUrl;

  /**
   * Creates a new StartedWiremockContainer.
   * @param startedTestContainer The underlying TestContainer.
   * @param url The URL of the started container.
   */
  constructor(startedTestContainer: StartedTestContainer, url: string) {
    super(startedTestContainer);
    this._rpcUrl = url;
  }

  /**
   * Gets the URL of the Wiremock node.
   */
  get rpcUrl() {
    return this._rpcUrl;
  }
}
