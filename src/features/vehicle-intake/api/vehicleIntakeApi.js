/**
 * Default adapter for the standalone local endpoint.
 * Pass the team's API function to VehicleIntakePage.onSave when integrating.
 */
export async function saveVehicleIntake(payload, { endpoint = '/api/cpo/vehicles', fetchImpl = globalThis.fetch } = {}) {
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Chưa lưu được hồ sơ xe.');
  }

  return response.json();
}
