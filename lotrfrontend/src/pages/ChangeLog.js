import { DataChanges, RevertChanger } from '../Utils';
import '../pages/ChangeLog.css';
import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useSortBy } from 'react-table';
import { useQueryClient } from '@tanstack/react-query';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Render a raw value (string / number / bool / null / list) for display.
function formatValue(v) {
  if (v === null || v === undefined || v === '') return '—';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

function formatTimestamp(ts) {
  const d = new Date(ts);
  return isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
}

// "UnitData" -> "Units" for friendlier display
function friendlyCollection(name) {
  return typeof name === 'string' ? name.replace(/Data$/, '') : name;
}

// Derived fields that mirror another field (e.g. "_rules" is the joined form of
// "rules"). They change together, so we hide the derived one from the log.
const DERIVED_FIELDS = ['_rules'];

export default function ChangeLog() {
  const [changeData, setChangeData] = useState([]);
  const [query, setQuery] = useState('');
  const [hideReverted, setHideReverted] = useState(false);
  const [pendingKey, setPendingKey] = useState(null);

  const changesraw = DataChanges();
  const queryClient = useQueryClient();
  const revertMutation = RevertChanger();

  useEffect(() => {
    setChangeData(changesraw.data === undefined ? [] : changesraw.data);
  }, [changesraw.data, changesraw.isSuccess]);

  // Flatten each changelog entry into one row per changed field.
  const rows = useMemo(() => {
    const out = [];
    (changeData || []).forEach((entry) => {
      const changes = entry.changes || {};
      Object.entries(changes).forEach(([field, diff]) => {
        if (DERIVED_FIELDS.includes(field)) return; // hide derived mirror fields
        const revertedInfo = entry.reverted ? entry.reverted[field] : undefined;
        out.push({
          key: `${entry._id}:${field}`,
          _id: entry._id,
          collection_name: entry.collection_name,
          item_identifier: entry.item_identifier,
          field,
          old: diff ? diff.old : undefined,
          new: diff ? diff.new : undefined,
          timestamp: entry.timestamp,
          type: entry.type || 'edit',
          reverted: !!revertedInfo,
          reverted_at: revertedInfo ? revertedInfo.reverted_at : undefined,
        });
      });
    });
    return out;
  }, [changeData]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (hideReverted && r.reverted) return false;
      if (!q) return true;
      return (
        String(r.item_identifier).toLowerCase().includes(q) ||
        String(r.field).toLowerCase().includes(q) ||
        String(friendlyCollection(r.collection_name)).toLowerCase().includes(q)
      );
    });
  }, [rows, query, hideReverted]);

  const handleRevert = (r) => {
    if (r.reverted || pendingKey) return;
    const ok = window.confirm(
      `Revert "${r.field}" of ${r.item_identifier} back to its previous value?\n\n` +
        `${formatValue(r.new)}  →  ${formatValue(r.old)}`
    );
    if (!ok) return;
    setPendingKey(r.key);
    revertMutation.mutate(
      { changelogId: r._id, field: r.field },
      {
        onSuccess: (res) => {
          toast.success((res && res.data && res.data.message) || 'Reverted.');
          queryClient.invalidateQueries({ queryKey: ['changelog'] });
        },
        onError: (err) => {
          const msg =
            (err && err.response && err.response.data && err.response.data.error) ||
            (err && err.message) ||
            'Revert failed.';
          toast.error(msg);
        },
        onSettled: () => setPendingKey(null),
      }
    );
  };

  const columns = useMemo(
    () => [
      {
        Header: 'When',
        accessor: 'timestamp',
        Cell: ({ value }) => <span title={String(value)}>{formatTimestamp(value)}</span>,
        sortType: (a, b, id) =>
          new Date(a.values[id]).getTime() - new Date(b.values[id]).getTime(),
      },
      {
        Header: 'Collection',
        accessor: (row) => friendlyCollection(row.collection_name),
        id: 'collection',
      },
      { Header: 'Item', accessor: 'item_identifier' },
      {
        Header: 'Field',
        accessor: 'field',
        Cell: ({ row }) => (
          <span>
            {row.original.field}
            {row.original.type === 'revert' && <span className="cl-tag">↩ revert</span>}
          </span>
        ),
      },
      {
        Header: 'Change',
        id: 'change',
        disableSortBy: true,
        Cell: ({ row }) => (
          <span className="cl-change">
            <span className="cl-old">{formatValue(row.original.old)}</span>
            <span className="cl-arrow">→</span>
            <span className="cl-new">{formatValue(row.original.new)}</span>
          </span>
        ),
      },
      {
        Header: 'Action',
        id: 'action',
        disableSortBy: true,
        Cell: ({ row }) => {
          const r = row.original;
          if (r.reverted) {
            return (
              <span className="cl-badge cl-badge-reverted" title={formatTimestamp(r.reverted_at)}>
                Reverted
              </span>
            );
          }
          return (
            <button
              className="cl-revert-btn"
              disabled={!!pendingKey}
              onClick={() => handleRevert(r)}
            >
              {pendingKey === r.key ? 'Reverting…' : 'Revert'}
            </button>
          );
        },
      },
    ],
    // handleRevert closes over current state; rebuild when a revert is in-flight
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingKey]
  );

  const table = useTable(
    {
      columns,
      data: filteredRows,
      initialState: { sortBy: [{ id: 'timestamp', desc: true }] },
    },
    useSortBy
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows: tableRows, prepareRow } = table;

  return (
    <div className="cl-page">
      <h1>Change Log</h1>

      <div className="cl-toolbar">
        <input
          className="cl-search"
          type="text"
          placeholder="Search item, field or collection…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="cl-check">
          <input
            type="checkbox"
            checked={hideReverted}
            onChange={() => setHideReverted(!hideReverted)}
          />
          Hide reverted
        </label>
        <span className="cl-count">
          {filteredRows.length} change{filteredRows.length === 1 ? '' : 's'}
        </span>
      </div>

      {changesraw.isPending ? (
        <p className="cl-empty">Loading…</p>
      ) : filteredRows.length === 0 ? (
        <p className="cl-empty">No changes to show.</p>
      ) : (
        <table {...getTableProps()} className="cl-table">
          <thead>
            {headerGroups.map((hg) => (
              <tr {...hg.getHeaderGroupProps()}>
                {hg.headers.map((column) => (
                  <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                    {column.render('Header')}
                    {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {tableRows.map((row) => {
              prepareRow(row);
              return (
                <tr
                  {...row.getRowProps()}
                  className={row.original.reverted ? 'cl-row-reverted' : ''}
                >
                  {row.cells.map((cell) => (
                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <ToastContainer position="top-center" autoClose={4000} />
    </div>
  );
}
