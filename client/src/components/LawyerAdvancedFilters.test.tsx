import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LawyerAdvancedFilters } from "./LawyerAdvancedFilters";

describe("LawyerAdvancedFilters", () => {
  const mockFilters = {
    search: "",
    status: "all" as const,
    minExperience: 0,
    maxExperience: 50,
    minRate: 0,
    maxRate: 1000,
    specialties: [],
    oabState: "",
  };

  const mockOnFiltersChange = vi.fn();

  it("renders filter component", () => {
    render(
      <LawyerAdvancedFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        specialtyOptions={["Direito Civil", "Direito Trabalhista"]}
        stateOptions={["SP", "RJ", "MG"]}
      />
    );

    expect(screen.getByText("Filtros Avançados")).toBeInTheDocument();
  });

  it("expands and collapses filters", () => {
    render(
      <LawyerAdvancedFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        specialtyOptions={[]}
        stateOptions={[]}
      />
    );

    const expandButton = screen.getByText("Expandir");
    fireEvent.click(expandButton);

    expect(screen.getByText("Buscar por nome ou email")).toBeInTheDocument();
  });

  it("updates search filter", () => {
    render(
      <LawyerAdvancedFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        specialtyOptions={[]}
        stateOptions={[]}
      />
    );

    const expandButton = screen.getByText("Expandir");
    fireEvent.click(expandButton);

    const searchInput = screen.getByPlaceholderText("Digite nome ou email...");
    fireEvent.change(searchInput, { target: { value: "João" } });

    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it("resets filters", () => {
    render(
      <LawyerAdvancedFilters
        filters={{
          ...mockFilters,
          search: "João",
          status: "active",
        }}
        onFiltersChange={mockOnFiltersChange}
        specialtyOptions={[]}
        stateOptions={[]}
      />
    );

    const expandButton = screen.getByText("Expandir");
    fireEvent.click(expandButton);

    const resetButton = screen.getByText("Limpar Filtros");
    fireEvent.click(resetButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      search: "",
      status: "all",
      minExperience: 0,
      maxExperience: 50,
      minRate: 0,
      maxRate: 1000,
      specialties: [],
      oabState: "",
    });
  });

  it("shows active filter count", () => {
    render(
      <LawyerAdvancedFilters
        filters={{
          ...mockFilters,
          search: "João",
          status: "active",
        }}
        onFiltersChange={mockOnFiltersChange}
        specialtyOptions={[]}
        stateOptions={[]}
      />
    );

    expect(screen.getByText("2 ativos")).toBeInTheDocument();
  });
});
