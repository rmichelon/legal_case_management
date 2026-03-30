import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";

describe("DeleteConfirmationModal", () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();
  const defaultProps = {
    isOpen: true,
    caseNumber: "0001234-56.2024.1.23.4567",
    caseTitle: "Test Case Title",
    isLoading: false,
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    mockOnConfirm.mockClear();
    mockOnCancel.mockClear();
  });

  it("should render modal with case information", () => {
    render(<DeleteConfirmationModal {...defaultProps} />);

    expect(screen.getByText("Deletar Processo")).toBeInTheDocument();
    expect(screen.getByText(defaultProps.caseNumber)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.caseTitle)).toBeInTheDocument();
  });

  it("should display warning message about permanent deletion", () => {
    render(<DeleteConfirmationModal {...defaultProps} />);

    expect(
      screen.getByText(/Ao deletar este processo, todos os dados associados/i)
    ).toBeInTheDocument();
  });

  it("should have delete button disabled initially", () => {
    render(<DeleteConfirmationModal {...defaultProps} />);

    const deleteButton = screen.getByRole("button", {
      name: /Deletar Permanentemente/i,
    });
    expect(deleteButton).toBeDisabled();
  });

  it("should enable delete button when correct case number is entered", async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmationModal {...defaultProps} />);

    const input = screen.getByPlaceholderText(defaultProps.caseNumber);
    await user.type(input, defaultProps.caseNumber);

    const deleteButton = screen.getByRole("button", {
      name: /Deletar Permanentemente/i,
    });
    expect(deleteButton).not.toBeDisabled();
  });

  it("should show error message when incorrect case number is entered", async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmationModal {...defaultProps} />);

    const input = screen.getByPlaceholderText(defaultProps.caseNumber);
    await user.type(input, "wrong-number");

    const deleteButton = screen.getByRole("button", {
      name: /Deletar Permanentemente/i,
    });
    await user.click(deleteButton);

    expect(
      screen.getByText(/O número do processo não corresponde/i)
    ).toBeInTheDocument();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it("should track attempt count and show remaining attempts", async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmationModal {...defaultProps} />);

    const input = screen.getByPlaceholderText(defaultProps.caseNumber);
    const deleteButton = screen.getByRole("button", {
      name: /Deletar Permanentemente/i,
    });

    // First attempt
    await user.type(input, "wrong");
    await user.click(deleteButton);
    expect(screen.getByText(/2 tentativa\(s\) restante\(s\)/i)).toBeInTheDocument();

    // Clear input
    await user.clear(input);

    // Second attempt
    await user.type(input, "wrong-again");
    await user.click(deleteButton);
    expect(screen.getByText(/1 tentativa\(s\) restante\(s\)/i)).toBeInTheDocument();
  });

  it("should disable input after max attempts exceeded", async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmationModal {...defaultProps} />);

    const input = screen.getByPlaceholderText(defaultProps.caseNumber);
    const deleteButton = screen.getByRole("button", {
      name: /Deletar Permanentemente/i,
    });

    // Three failed attempts
    for (let i = 0; i < 3; i++) {
      await user.type(input, "wrong");
      await user.click(deleteButton);
      await user.clear(input);
    }

    expect(input).toBeDisabled();
    expect(
      screen.getByText(/Número máximo de tentativas excedido/i)
    ).toBeInTheDocument();
  });

  it("should show green confirmation when correct case number is entered", async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmationModal {...defaultProps} />);

    const input = screen.getByPlaceholderText(defaultProps.caseNumber);
    await user.type(input, defaultProps.caseNumber);

    expect(
      screen.getByText(/Número do processo confirmado/i)
    ).toBeInTheDocument();
  });

  it("should call onConfirm when delete button is clicked with correct number", async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmationModal {...defaultProps} />);

    const input = screen.getByPlaceholderText(defaultProps.caseNumber);
    await user.type(input, defaultProps.caseNumber);

    const deleteButton = screen.getByRole("button", {
      name: /Deletar Permanentemente/i,
    });
    await user.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalledOnce();
  });

  it("should call onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmationModal {...defaultProps} />);

    const cancelButton = screen.getByRole("button", { name: /Cancelar/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledOnce();
  });

  it("should show loading state when isLoading is true", () => {
    render(
      <DeleteConfirmationModal {...defaultProps} isLoading={true} />
    );

    expect(screen.getByText(/Deletando/i)).toBeInTheDocument();
    const deleteButton = screen.getByRole("button", {
      name: /Deletando/i,
    });
    expect(deleteButton).toBeDisabled();
  });

  it("should clear input when modal is closed", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <DeleteConfirmationModal {...defaultProps} />
    );

    const input = screen.getByPlaceholderText(
      defaultProps.caseNumber
    ) as HTMLInputElement;
    await user.type(input, "some-text");
    expect(input.value).toBe("some-text");

    // Close modal
    rerender(
      <DeleteConfirmationModal {...defaultProps} isOpen={false} />
    );

    // Reopen modal
    rerender(
      <DeleteConfirmationModal {...defaultProps} isOpen={true} />
    );

    const newInput = screen.getByPlaceholderText(
      defaultProps.caseNumber
    ) as HTMLInputElement;
    expect(newInput.value).toBe("");
  });

  it("should trim whitespace from input comparison", async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmationModal {...defaultProps} />);

    const input = screen.getByPlaceholderText(defaultProps.caseNumber);
    await user.type(input, `  ${defaultProps.caseNumber}  `);

    const deleteButton = screen.getByRole("button", {
      name: /Deletar Permanentemente/i,
    });
    expect(deleteButton).not.toBeDisabled();
  });
});
