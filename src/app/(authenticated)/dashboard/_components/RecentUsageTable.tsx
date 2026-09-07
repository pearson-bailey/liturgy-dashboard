import { displayReference } from "../_utils/scripture-display.utils";
import type { Occurrence } from "@/types/dashboard";
import { movements } from "@/utils/liturgical-movements";
export function RecentUsageTable({ rows }: { rows: Occurrence[] }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Scripture</th>
            <th scope="col">Movement / element</th>
            <th scope="col">Service Type</th>
            <th scope="col">Plan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.itemId}>
              <td className="nowrap">{row.date}</td>
              <td className="reference">
                {row.references.map(displayReference).join("; ")}
              </td>
              <td>
                <strong>{row.element}</strong>
                <span className="table-secondary">
                  {movements[row.movement]}
                </span>
                {row.rawHeader && (
                  <details>
                    <summary>Source header</summary>
                    <p>{row.rawHeader}</p>
                  </details>
                )}
              </td>
              <td>{row.serviceType}</td>
              <td>
                {row.planUrl ? (
                  <a href={row.planUrl} target="_blank" rel="noreferrer">
                    {row.plan} ↗
                  </a>
                ) : (
                  row.plan
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
