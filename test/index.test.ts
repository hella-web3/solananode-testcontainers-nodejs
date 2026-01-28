import {
  SolanaValidatorContainer,
  StartedSolanaValidatorContainer,
} from "../src";

describe("AnvilContainer", () => {
  let container: StartedSolanaValidatorContainer;

  beforeAll(async () => {
    container = await new SolanaValidatorContainer().start();
  }, 60000);

  afterAll(async () => {
    if (container) await container.stop();
  });

  it("should start and be reachable", async () => {
    expect(container).toBeDefined();
  });
});
