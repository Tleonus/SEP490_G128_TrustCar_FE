import { defineConfig } from 'vitest/config'

// Logic thuần (store, hàm tiện ích) chạy trong môi trường node; không cần trình duyệt.
// Cấu hình riêng để không sửa vite.config.js của nhóm.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
