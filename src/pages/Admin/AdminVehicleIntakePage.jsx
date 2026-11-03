import { VehicleIntakePage, saveVehicleIntake } from '../../features/vehicle-intake'

const saveVehicle = (payload) => saveVehicleIntake(payload, {
  endpoint: import.meta.env.VITE_VEHICLE_INTAKE_API_URL || 'http://localhost:3001/api/cpo/vehicles',
})

export default function AdminVehicleIntakePage() {
  return <VehicleIntakePage onSave={saveVehicle} />
}
