import { describe, expect, it } from "vitest";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";

describe("Epoch OpenAPI contract", () => {
  it("serves the generated V12 contract from the runtime API", async () => {
    const token = await makeToken("u_epoch_openapi_contract");
    const response = await request(createMemoryOsApp())
      .get("/api/epoch/openapi")
      .set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      data: {
        openapi: "3.1.0",
        info: {
          title: "Epoch Runtime V12 Contracts",
        },
      },
    });
    expect(response.body.data.paths).toHaveProperty(
      "/api/epoch/workspaces/{workspaceId}/missions",
    );
  });
});
