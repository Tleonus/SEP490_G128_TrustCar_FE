import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'antd'
import { CarOutlined, CloseOutlined } from '@ant-design/icons'
import { formatPrice } from '../../../utils/format'
import styles from './CompareTable.module.css'

const titleOf = (car) => [car.make, car.model].filter(Boolean).join(' ') || 'Xe'

/**
 * Bảng so sánh: mỗi xe một cột, mỗi thuộc tính một hàng (theo nhóm).
 * Vùng bảng tự cuộn ngang khi hẹp, cột nhãn cố định bên trái; trang không cuộn ngang.
 *
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F13
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F20
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F22
 * @param {{ cars: object[], groups: object[], onRemove: (id: string) => void }} props
 */
export default function CompareTable({ cars, groups, onRemove }) {
  return (
    <div className={styles.scroll} role="region" aria-label="Bảng so sánh xe" tabIndex={0}>
      <table className={styles.table} style={{ '--cols': cars.length }}>
        <thead>
          <tr>
            <th scope="col" className={styles.corner}>
              <span className={styles.srOnly}>Thuộc tính</span>
            </th>
            {cars.map((car) => (
              <th scope="col" className={styles.carHead} key={car._id}>
                <div className={styles.photo}>
                  {car.primaryImageUrl ? <img src={car.primaryImageUrl} alt={titleOf(car)} /> : <CarOutlined />}
                </div>
                <div className={styles.name}>{titleOf(car)}</div>
                {car.variant && <div className={styles.variant}>{car.variant}</div>}
                <div className={styles.price}>{formatPrice(car.price)}</div>
                <div className={styles.headActions}>
                  <Link to={`/xe/${car._id}`}>
                    <Button size="small" type="primary">Xem chi tiết</Button>
                  </Link>
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
                    aria-label={`Bỏ ${titleOf(car)} khỏi so sánh`}
                    onClick={() => onRemove(car._id)}
                  >
                    Bỏ
                  </Button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.key}>
              <tr className={styles.groupRow}>
                <th scope="colgroup" colSpan={cars.length + 1}>{group.title}</th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.key}>
                  <th scope="row" className={styles.label}>{row.label}</th>
                  {row.cells.map((cell, index) => (
                    <td key={cars[index]?._id ?? index}>
                      {cell.items?.length ? (
                        <ul className={styles.tags}>
                          {cell.items.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      ) : (
                        cell.text
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
