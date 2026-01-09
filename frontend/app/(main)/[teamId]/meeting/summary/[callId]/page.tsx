export default function SummaryPage({
  params,
}: {
  params: { callId: string };
}) {
  return <div>Call ID: {params.callId}</div>;
}
