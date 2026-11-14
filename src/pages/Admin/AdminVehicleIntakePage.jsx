import { VehicleIntakePage, saveVehicleIntake } from '../../features/vehicle-intake'

export default function AdminVehicleIntakePage() {
  return <VehicleIntakePage onSave={saveVehicleIntake} />
}
