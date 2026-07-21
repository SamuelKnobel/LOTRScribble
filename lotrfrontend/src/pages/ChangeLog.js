import { DataChanges, RevertChanger } from '../Utils';
import '../pages/ChangeLog.css';
import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useSortBy } from 'react-table';
import { useQueryClient } from '@tanstack/react-query';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { diffWords, diffArrays } from 'diff';

// Long strings get a word-level diff instead of the old -> new pill.
const LONG_TEXT = 40;

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

// Render jsdiff parts (from diffWords) as inline <ins>/<del> spans.
function DiffText({ parts }) {
  return (
    <span className="cl-diff">
      {parts.map((p, i) => {
        if (p.added) return <ins key={i} className="cl-diff-add">{p.value}</ins>;
        if (p.removed) return <del key={i} className="cl-diff-del">{p.value}</del>;
        return <span key={i}>{p.value}</span>;
      })}
    </span>
  );
}

// Render a list diff (from diffArrays) as comma-joined items, added/removed marked.
function DiffList({ parts }) {
  const tokens = [];
  parts.forEach((p) => {
    (p.value || []).forEach((item) => tokens.push({ item, added: p.added, removed: p.removed }));
  });
  return (
    <span className="cl-diff">
      {tokens.map((t, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span>, </span>}
          {t.added ? (
            <ins className="cl-diff-add">{t.item}</ins>
          ) : t.removed ? (
            <del className="cl-diff-del">{t.item}</del>
          ) : (
            <span>{t.item}</span>
          )}
        </React.Fragment>
      ))}
    </span>
  );
}

// Shared change cell so the flat table and the grouped view render identically.
function ChangeCell({ r }) {
  const o = r.old;
  const n = r.new;

  // List fields (e.g. rules): item-level diff, so added/removed rules stand out.
  if (Array.isArray(o) && Array.isArray(n)) {
    return <DiffList parts={diffArrays(o, n)} />;
  }

  // Long text (rule / battle-rule descriptions): word-level diff.
  if (typeof o === 'string' && typeof n === 'string' && (o.length > LONG_TEXT || n.length > LONG_TEXT)) {
    return <DiffText parts={diffWords(o, n)} />;
  }

  // Scalars and short values: keep the compact old -> new pill.
  return (
    <span className="cl-change">
      <span className="cl-old">{formatValue(o)}</span>
      <span className="cl-arrow">→</span>
      <span className="cl-new">{formatValue(n)}</span>
    </span>
  );
}

function ActionCell({ r, pendingKey, onRevert }) {
  if (r.reverted) {
    return (
      <span className="cl-badge cl-badge-reverted" title={formatTimestamp(r.reverted_at)}>
        Reverted
      </span>
    );
  }
  return (
    <button className="cl-revert-btn" disabled={!!pendingKey} onClick={() => onRevert(r)}>
      {pendingKey === r.key ? 'Reverting…' : 'Revert'}
    </button>
  );
}

export default function ChangeLog() {
  const [changeData, setChangeData] = useState([]);
  const [query, setQuery] = useState('');
  const [hideReverted, setHideReverted] = useState(false);
  const [pendingKey, setPendingKey] = useState(null);
  const [viewMode, setViewMode] = useState('grouped'); // 'flat' | 'grouped'
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const [selectedCollections, setSelectedCollections] = useState(() => new Set()); // empty = all

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
        const revertedInfo = entry.reverted ? entry.reverted[field] : undefined;
        out.push({
          key: `${entry._id}:${field}`,
          _id: entry._id,
          collection_name: entry.collection_name,
          item_id: entry.item_id,
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

  // Collections present in the data, with change counts, for the filter chips.
  const collectionOptions = useMemo(() => {
    const counts = new Map();
    rows.forEach((r) => counts.set(r.collection_name, (counts.get(r.collection_name) || 0) + 1));
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, label: friendlyCollection(name), count }))
      .sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }, [rows]);

  const toggleCollection = (name) => {
    setSelectedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (selectedCollections.size > 0 && !selectedCollections.has(r.collection_name)) return false;
      if (hideReverted && r.reverted) return false;
      if (!q) return true;
      return (
        String(r.item_identifier).toLowerCase().includes(q) ||
        String(r.field).toLowerCase().includes(q) ||
        String(friendlyCollection(r.collection_name)).toLowerCase().includes(q)
      );
    });
  }, [rows, query, hideReverted, selectedCollections]);

  // Group the (already filtered) rows by item for the grouped view.
  const groups = useMemo(() => {
    const map = new Map();
    filteredRows.forEach((r) => {
      const key = `${r.collection_name}::${r.item_id || r.item_identifier}`;
      let g = map.get(key);
      if (!g) {
        g = {
          key,
          collection_name: r.collection_name,
          item_identifier: r.item_identifier,
          changes: [],
          latest: 0,
        };
        map.set(key, g);
      }
      g.changes.push(r);
      const t = new Date(r.timestamp).getTime();
      if (t > g.latest) g.latest = t;
    });
    const arr = Array.from(map.values());
    arr.forEach((g) =>
      g.changes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    );
    arr.sort((a, b) => b.latest - a.latest);
    return arr;
  }, [filteredRows]);

  const toggleGroup = (key) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allExpanded = groups.length > 0 && expandedGroups.size === groups.length;
  const toggleAll = () => {
    setExpandedGroups(allExpanded ? new Set() : new Set(groups.map((g) => g.key)));
  };

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
        Cell: ({ row }) => <ChangeCell r={row.original} />,
      },
      {
        Header: 'Action',
        id: 'action',
        disableSortBy: true,
        Cell: ({ row }) => (
          <ActionCell r={row.original} pendingKey={pendingKey} onRevert={handleRevert} />
        ),
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

  const isEmpty = !changesraw.isPending && filteredRows.length === 0;

  return (
    <div className="cl-page">
      <h1>Change Log</h1>

      <div className="cl-toolbar">
        <div className="cl-viewtoggle">
          <button
            className={viewMode === 'flat' ? 'active' : ''}
            onClick={() => setViewMode('flat')}
          >
            Flat
          </button>
          <button
            className={viewMode === 'grouped' ? 'active' : ''}
            onClick={() => setViewMode('grouped')}
          >
            Grouped by item
          </button>
        </div>
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
        {viewMode === 'grouped' && groups.length > 0 && (
          <button className="cl-linkbtn" onClick={toggleAll}>
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        )}
        <span className="cl-count">
          {viewMode === 'grouped' && `${groups.length} item${groups.length === 1 ? '' : 's'} · `}
          {filteredRows.length} change{filteredRows.length === 1 ? '' : 's'}
        </span>
      </div>

      {collectionOptions.length > 1 && (
        <div className="cl-filters">
          <button
            className={`cl-chip${selectedCollections.size === 0 ? ' active' : ''}`}
            onClick={() => setSelectedCollections(new Set())}
          >
            All
          </button>
          {collectionOptions.map((c) => (
            <button
              key={c.name}
              className={`cl-chip${selectedCollections.has(c.name) ? ' active' : ''}`}
              onClick={() => toggleCollection(c.name)}
            >
              {c.label}
              <span className="cl-chip-count">{c.count}</span>
            </button>
          ))}
        </div>
      )}

      {changesraw.isPending ? (
        <p className="cl-empty">Loading…</p>
      ) : isEmpty ? (
        <p className="cl-empty">No changes to show.</p>
      ) : viewMode === 'flat' ? (
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
      ) : (
        <div className="cl-groups">
          {groups.map((g) => {
            const open = expandedGroups.has(g.key);
            return (
              <div className="cl-group" key={g.key}>
                <button
                  className="cl-group-header"
                  onClick={() => toggleGroup(g.key)}
                  aria-expanded={open}
                >
                  <span className="cl-chevron">{open ? '▾' : '▸'}</span>
                  <span className="cl-badge-collection">
                    {friendlyCollection(g.collection_name)}
                  </span>
                  <span className="cl-group-name">{g.item_identifier}</span>
                  <span className="cl-group-meta">
                    {g.changes.length} change{g.changes.length === 1 ? '' : 's'} · latest{' '}
                    {formatTimestamp(g.latest)}
                  </span>
                </button>
                {open && (
                  <div className="cl-group-body">
                    {g.changes.map((r) => (
                      <div
                        className={`cl-group-row${r.reverted ? ' cl-row-reverted' : ''}`}
                        key={r.key}
                      >
                        <span className="cl-cell-field">
                          {r.field}
                          {r.type === 'revert' && <span className="cl-tag">↩ revert</span>}
                        </span>
                        <span className="cl-cell-change">
                          <ChangeCell r={r} />
                        </span>
                        <span className="cl-cell-when" title={String(r.timestamp)}>
                          {formatTimestamp(r.timestamp)}
                        </span>
                        <span className="cl-cell-action">
                          <ActionCell r={r} pendingKey={pendingKey} onRevert={handleRevert} />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ToastContainer position="top-center" autoClose={4000} />
    </div>
  );
}
