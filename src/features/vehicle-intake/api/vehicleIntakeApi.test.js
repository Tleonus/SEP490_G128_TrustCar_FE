import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mapIntakeToCreateCarDto,
  mapIntakeToQuickInspectDto,
  getIntakeErrorMessage,
  saveVehicleIntake,
  resetIntakeSessionCache,
} from './vehicleIntakeApi.js';

const sampleIntakePayload = {
  licensePlate: ' 51h-123.45 ',
  vin: '1hgcm82633a004352',
  brand: 'Toyota',
  model: 'Camry 2.5Q',
  year: '2022',
  mileage: '45200',
  transmission: 'automatic',
  fuel: 'gasoline',
  ownership: 'company',
  listedPrice: '850000000',
  floorPrice: '810000000',
  checklist: {
    chassis: true,
    engine: true,
    flood: true,
    odometer: true,
    safety: false,
  },
  notes: '  Xe đẹp, bảo dưỡng hãng đầy đủ  ',
};

describe('mapIntakeToCreateCarDto', () => {
  it('chuyển đổi đúng các trường từ form Nhập xe sang DTO POST /manage/cars', () => {
    expect(mapIntakeToCreateCarDto(sampleIntakePayload)).toEqual({
      vin: '1HGCM82633A004352',
      licensePlate: '51H-123.45',
      make: 'TOYOTA',
      model: 'Camry 2.5Q',
      year: 2022,
      mileage: 45200,
      price: 850000000,
      listedPrice: 850000000,
      floorPrice: 810000000,
      transmission: 'AUTOMATIC',
      fuelType: 'GASOLINE',
      inventoryType: 'OWNED',
      ownerType: 'COMPANY',
      internalNotes: 'Xe đẹp, bảo dưỡng hãng đầy đủ',
    });
  });

  it('map đúng xe ký gửi, hộp số hybrid -> CVT và nhiên liệu diesel -> DIESEL', () => {
    const dto = mapIntakeToCreateCarDto({
      ...sampleIntakePayload,
      transmission: 'hybrid',
      fuel: 'diesel',
      ownership: 'consignment',
      notes: '   ',
    });

    expect(dto.transmission).toBe('CVT');
    expect(dto.fuelType).toBe('DIESEL');
    expect(dto.inventoryType).toBe('CONSIGNMENT');
    expect(dto.ownerType).toBe('INDIVIDUAL');
    expect(dto.internalNotes).toBeUndefined();
  });
});

describe('mapIntakeToQuickInspectDto', () => {
  it('map đúng 5 tiêu chí checklist sang criteria của POST /inspections/cars/:id/inspect', () => {
    expect(mapIntakeToQuickInspectDto(sampleIntakePayload)).toEqual({
      criteria: {
        noMajorAccident: true,
        noWaterDamage: true,
        engineGearboxIntact: true,
        verifiedOdo: true,
        electricalSystemPassed: false,
      },
      odo: 45200,
      notes: 'Xe đẹp, bảo dưỡng hãng đầy đủ',
    });
  });
});

describe('saveVehicleIntake', () => {
  beforeEach(() => {
    resetIntakeSessionCache();
  });

  it('gọi tuần tự POST /manage/cars và POST /inspections/cars/:id/inspect', async () => {
    const apiClient = {
      post: vi.fn()
        .mockResolvedValueOnce({
          data: {
            data: { _id: '65f000000000000000000001', vehicleCode: 'TC-2026-0001', status: 'INCOMING' },
          },
        })
        .mockResolvedValueOnce({
          data: {
            data: {
              car: { _id: '65f000000000000000000001', vehicleCode: 'TC-2026-0001', status: 'REJECTED' },
              inspectionRecord: { _id: '65f000000000000000000099', result: 'FAILED' },
            },
          },
        }),
      put: vi.fn(),
    };

    const result = await saveVehicleIntake(sampleIntakePayload, { apiClient });

    expect(apiClient.post).toHaveBeenCalledTimes(2);
    expect(apiClient.post).toHaveBeenNthCalledWith(
      1,
      '/manage/cars',
      mapIntakeToCreateCarDto(sampleIntakePayload),
    );
    expect(apiClient.post).toHaveBeenNthCalledWith(
      2,
      '/inspections/cars/65f000000000000000000001/inspect',
      mapIntakeToQuickInspectDto(sampleIntakePayload),
    );
    expect(result.car.vehicleCode).toBe('TC-2026-0001');
    expect(result.inspectionRecord.result).toBe('FAILED');
  });

  it('cập nhật qua PUT /manage/cars/:id nếu lưu lại cùng một xe trong phiên hiện tại', async () => {
    const apiClient = {
      post: vi.fn()
        .mockResolvedValueOnce({
          data: { data: { _id: '65f000000000000000000001', vehicleCode: 'TC-2026-0001' } },
        })
        .mockResolvedValueOnce({
          data: { data: { car: { _id: '65f000000000000000000001', status: 'REJECTED' }, inspectionRecord: {} } },
        })
        .mockResolvedValueOnce({
          data: { data: { car: { _id: '65f000000000000000000001', status: 'APPROVED_CPO' }, inspectionRecord: {} } },
        }),
      put: vi.fn().mockResolvedValueOnce({
        data: { data: { _id: '65f000000000000000000001', vehicleCode: 'TC-2026-0001' } },
      }),
    };

    await saveVehicleIntake(sampleIntakePayload, { apiClient });
    const updatedPayload = {
      ...sampleIntakePayload,
      checklist: { chassis: true, engine: true, flood: true, odometer: true, safety: true },
    };
    const secondResult = await saveVehicleIntake(updatedPayload, { apiClient });

    expect(apiClient.put).toHaveBeenCalledWith(
      '/manage/cars/65f000000000000000000001',
      mapIntakeToCreateCarDto(updatedPayload),
    );
    expect(secondResult.car.status).toBe('APPROVED_CPO');
  });

  it('gắn userMessage tiếng Việt khi BE trả mã lỗi VIN_DUPLICATE hoặc PLATE_DUPLICATE', async () => {
    const dupError = {
      response: { status: 409, data: { code: 'VIN_DUPLICATE' } },
    };
    const apiClient = {
      post: vi.fn().mockRejectedValueOnce(dupError),
      put: vi.fn(),
    };

    await expect(saveVehicleIntake(sampleIntakePayload, { apiClient })).rejects.toMatchObject({
      userMessage: 'Số khung (VIN) này đã tồn tại trong hệ thống.',
    });
    expect(getIntakeErrorMessage({ response: { data: { code: 'PLATE_DUPLICATE' } } })).toBe(
      'Biển số xe này đang tồn tại trong kho xe hoạt động.',
    );
  });
});

