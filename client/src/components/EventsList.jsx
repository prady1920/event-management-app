import React from 'react'

export default function EventsList({ events, headers }) {
  return (
    <>
      {events.length > 0 ? (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="w-full bg-white border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-200">
                {headers.map(header => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.map((ev, index) => (
                <tr key={ev.id ?? index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} >
                  {headers.map(header => (
                    <td
                      key={`${ev.id ?? index}-${header}`}
                      className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap"
                    >
                      {header === '_optimistic' ? (ev._optimistic ? 'saving…' : 'committed') : (ev[header] !== undefined && ev[header] !== null ? String(ev[header]) : '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No events yet. Create one to get started!</p>
        </div>
      )}
    </>
  )
}
