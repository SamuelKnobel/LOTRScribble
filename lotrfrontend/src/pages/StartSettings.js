import React, { useState } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './StartSettings.css';
import { fetchConstant, updateConstant } from '../Utils';

// Mirrors the Unity "Start Settings" screen. Each group is one document in the
// Constants collection; `fields` are the keys shown, in display order.
//   kind 'number' -> a single numeric value
//   kind 'tuple'  -> { Item1, Item2 }
const GROUPS = [
  {
    doc: 'Food_UnitType',
    title: 'Food pro UnitType',
    formula: 'f = f + x',
    fields: ['Miliz', 'Elite', 'General', 'Maschine', 'Ship', 'NotDefined'],
    kind: 'number',
  },
  {
    doc: 'FoodSize',
    title: 'Food pro Size (x1, x2)',
    formula: 'food = (f + x1) * x2',
    fields: ['S', 'K', 'R', 'Rg', 'NotDefined'],
    kind: 'tuple',
  },
  {
    doc: 'FertSeason',
    title: 'Fertility je Season',
    fields: ['Spring', 'Summer', 'Fall', 'Winter'],
    kind: 'number',
  },
  {
    doc: 'Trade',
    title: 'Gold pro Trade',
    fields: ['0', '1', '2', '3'],
    kind: 'number',
  },
];

// Local edits are keyed by doc/field(/Item1|Item2) so they survive refetches.
const editKey = (doc, field, part) => (part ? `${doc}.${field}.${part}` : `${doc}.${field}`);

const toNumber = (v) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
};

export default function StartSettings() {
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  // Live values, plus the Default_* documents used by "Load defaults".
  const liveQueries = useQueries({
    queries: GROUPS.map((g) => ({
      queryKey: ['constants', g.doc],
      queryFn: () => fetchConstant(g.doc),
    })),
  });
  const defaultQueries = useQueries({
    queries: GROUPS.map((g) => ({
      queryKey: ['constants', `Default_${g.doc}`],
      queryFn: () => fetchConstant(`Default_${g.doc}`),
    })),
  });

  const isLoading = liveQueries.some((q) => q.isPending);
  const isError = liveQueries.some((q) => q.isError);

  const setEdit = (key, value) => setEdits((prev) => ({ ...prev, [key]: value }));

  // Current shown value: a pending edit if there is one, else the stored value.
  const shownValue = (doc, docData, field, part) => {
    const key = editKey(doc, field, part);
    if (key in edits) return edits[key];
    const stored = docData ? docData[field] : undefined;
    if (stored === undefined || stored === null) return '';
    return part ? stored[part] : stored;
  };

  const loadDefaults = (groupIndex) => {
    const g = GROUPS[groupIndex];
    const def = defaultQueries[groupIndex].data;
    if (!def) {
      toast.error(`No defaults found for ${g.title}.`);
      return;
    }
    const next = {};
    g.fields.forEach((field) => {
      if (g.kind === 'tuple') {
        next[editKey(g.doc, field, 'Item1')] = def[field] ? def[field].Item1 : 0;
        next[editKey(g.doc, field, 'Item2')] = def[field] ? def[field].Item2 : 0;
      } else {
        next[editKey(g.doc, field)] = def[field];
      }
    });
    setEdits((prev) => ({ ...prev, ...next }));
    toast.info(`Defaults loaded for ${g.title} — press Save to apply.`);
  };

  // Collect every field whose shown value differs from the stored one.
  const collectChanges = () => {
    const changes = [];
    GROUPS.forEach((g, i) => {
      const docData = liveQueries[i].data;
      if (!docData) return;
      g.fields.forEach((field) => {
        if (g.kind === 'tuple') {
          const stored = docData[field] || {};
          const item1 = toNumber(shownValue(g.doc, docData, field, 'Item1'));
          const item2 = toNumber(shownValue(g.doc, docData, field, 'Item2'));
          if (item1 !== stored.Item1 || item2 !== stored.Item2) {
            changes.push({ docName: g.doc, key: field, value: { Item1: item1, Item2: item2 } });
          }
        } else {
          const value = toNumber(shownValue(g.doc, docData, field));
          if (value !== docData[field]) {
            changes.push({ docName: g.doc, key: field, value });
          }
        }
      });
    });
    return changes;
  };

  const handleSave = async () => {
    const changes = collectChanges();
    if (changes.length === 0) {
      toast.info('No changes to save.');
      return;
    }
    setSaving(true);
    let ok = 0;
    for (const change of changes) {
      try {
        await updateConstant(change);
        ok += 1;
      } catch (err) {
        const msg =
          (err && err.response && err.response.data && err.response.data.error) ||
          `Failed to save ${change.docName}.${change.key}`;
        toast.error(msg);
      }
    }
    setSaving(false);
    if (ok > 0) {
      toast.success(`Saved ${ok} value${ok === 1 ? '' : 's'}.`);
      setEdits({});
      queryClient.invalidateQueries({ queryKey: ['constants'] });
    }
  };

  const changeCount = collectChanges().length;

  if (isLoading) return <p className="ss-empty">Loading start settings…</p>;
  if (isError) return <p className="ss-empty">Could not load start settings.</p>;

  return (
    <div className="ss-page">
      <div className="ss-groups">
        {GROUPS.map((g, i) => {
          const docData = liveQueries[i].data;
          return (
            <div className="ss-group" key={g.doc}>
              <div className="ss-group-head">
                <h3>{g.title}</h3>
                {g.formula && <span className="ss-formula">{g.formula}</span>}
              </div>

              {g.fields.map((field) => (
                <div className="ss-row" key={field}>
                  <label className="ss-label">{field}</label>
                  {g.kind === 'tuple' ? (
                    <span className="ss-tuple">
                      <input
                        type="number"
                        step="any"
                        value={shownValue(g.doc, docData, field, 'Item1')}
                        onChange={(e) => setEdit(editKey(g.doc, field, 'Item1'), e.target.value)}
                      />
                      <input
                        type="number"
                        step="any"
                        value={shownValue(g.doc, docData, field, 'Item2')}
                        onChange={(e) => setEdit(editKey(g.doc, field, 'Item2'), e.target.value)}
                      />
                    </span>
                  ) : (
                    <input
                      type="number"
                      step="any"
                      value={shownValue(g.doc, docData, field)}
                      onChange={(e) => setEdit(editKey(g.doc, field), e.target.value)}
                    />
                  )}
                </div>
              ))}

              <button className="ss-default-btn" onClick={() => loadDefaults(i)}>
                Load defaults
              </button>
            </div>
          );
        })}
      </div>

      <div className="ss-actions">
        <span className="ss-changecount">
          {changeCount === 0 ? 'No unsaved changes' : `${changeCount} unsaved change${changeCount === 1 ? '' : 's'}`}
        </span>
        <button className="ss-reset-btn" onClick={() => setEdits({})} disabled={changeCount === 0 || saving}>
          Discard
        </button>
        <button className="ss-save-btn" onClick={handleSave} disabled={changeCount === 0 || saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}
