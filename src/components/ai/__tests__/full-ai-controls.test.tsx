/** @jest-environment jsdom */
import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import FullAIExamples, { useFullAIExamples } from "@/components/FullAIExamples";
import AIResponseReport from "@/components/AIResponseReport";
import { AIResultView } from "@/components/ai/AIResultView";

function Fixture({ onSubmit }: { onSubmit: () => void }) {
  const examples = useFullAIExamples();
  const [required, setRequired] = React.useState("");
  const [optional, setOptional] = React.useState("");
  const [record, setRecord] = React.useState("real-1");
  const [authorized, setAuthorized] = React.useState(false);
  return <form data-full-ai-workspace="fixture" onSubmit={event => { event.preventDefault(); onSubmit(); }}>
    <FullAIExamples controller={examples} />
    <label>Request<input required value={required} onChange={event => setRequired(event.target.value)} data-full-ai-field={examples.bind({current: required, change: event => setRequired(event.target.value), label: "Request"}, "required")}/></label>
    <label>Context<input value={optional} onChange={event => setOptional(event.target.value)} data-full-ai-field={examples.bind({current: optional, change: event => setOptional(event.target.value), label: "Context"}, "optional")}/></label>
    <label>Client ID<select value={record} onChange={event => setRecord(event.target.value)} data-full-ai-field={examples.bind({current: record, change: event => setRecord(event.target.value), label: "Client ID", reference: true}, "client") }><option value="real-1">Actual client one</option><option value="real-2">Actual client two</option></select></label>
    <label>Authorized<input type="checkbox" checked={authorized} onChange={event => setAuthorized(event.target.checked)} data-full-ai-field={examples.bind({current: authorized, change: event => setAuthorized(event.target.checked), label: "Authorized"}, "authority")}/></label>
    <button type="submit">Generate</button>
  </form>;
}

test("complete preset fills required and optional inputs without submission or changing a selected record or authority", () => {
  const submit = jest.fn();
  render(<Fixture onSubmit={submit}/>);
  fireEvent.click(screen.getByRole("button", {name: /Fill all fields · Quick review/}));
  expect((screen.getByLabelText("Request") as HTMLInputElement).value).toBeTruthy();
  expect((screen.getByLabelText("Context") as HTMLInputElement).value).toBeTruthy();
  expect((screen.getByLabelText("Client ID") as HTMLSelectElement).value).toBe("real-1");
  expect((screen.getByLabelText("Authorized") as HTMLInputElement).checked).toBe(false);
  expect(submit).not.toHaveBeenCalled();
});

test("returned and saved structured facts keep false, zero, empty string and nested labels", () => {
  const payload = { available: false, count: 0, note: "", details: { verified: false, total: 0 }, rows: [{ name: "A", result: 0 }] };
  const { container } = render(<><AIResponseReport value={payload}/><AIResultView data={payload} title="Saved"/></>);
  expect(container.textContent).toContain("Available");
  expect(container.textContent).toContain("No");
  expect(container.textContent).toContain("0");
  expect(container.textContent).toContain("Empty string");
  expect(container.textContent).toContain("Verified");
  expect(container.querySelector("pre")).toBeNull();
});
