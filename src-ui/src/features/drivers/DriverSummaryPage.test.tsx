import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { DriverSummaryPage } from "./DriverSummaryPage";

vi.mock("../../context/TenantContext", () => ({
  useTenant: () => ({
    tenant: { id: "mcp-engineering", name: "MCP Engineering Inc" },
  }),
}));

vi.mock("../../context/FleetContext", () => ({
  useFleet: () => ({
    fleet: { id: "mcp-fleet", name: "MCP Fleet" },
  }),
}));

vi.mock("../../api/onpointApi", () => ({
  fetchDrivers: vi
    .fn()
    .mockResolvedValue([{ driverId: "driver-1", name: "Alex Driver" }]),
}));

describe("DriverSummaryPage", () => {
  it("renders drivers from the API", async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DriverSummaryPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Alex Driver")).toBeInTheDocument();
  });
});
