import { useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';

/**
 * TagView — Core recursive component for rendering and editing a tree node.
 *
 * @param {object}   props.node     - Tree node: { name, _id, children?, data? }
 * @param {function} props.onUpdate - Callback to propagate changes upward
 * @param {number}   props.depth    - Current depth (for indentation + styling)
 * @param {boolean}  props.readOnly - If true, disable editing (used for saved trees display)
 */
export default function TagView({ node, onUpdate, depth = 0, readOnly = false }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(node.name);

  // Depth-based styling
  const isRoot = depth === 0;
  const indentPx = depth * 24;
  const headerBg = isRoot
    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/15 border-indigo-500/30'
    : depth === 1
      ? 'bg-slate-700/40 border-slate-600/30'
      : 'bg-slate-700/25 border-slate-600/20';

  // --- Handlers -----------------------------------------------------------

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleNameClick = useCallback(() => {
    if (readOnly) return;
    setEditName(node.name);
    setIsEditingName(true);
  }, [node.name, readOnly]);

  const handleNameKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        setIsEditingName(false);
        onUpdate({ ...node, name: editName });
      } else if (e.key === 'Escape') {
        setIsEditingName(false);
        setEditName(node.name);
      }
    },
    [editName, node, onUpdate]
  );

  const handleNameBlur = useCallback(() => {
    setIsEditingName(false);
    if (editName !== node.name) {
      onUpdate({ ...node, name: editName });
    }
  }, [editName, node, onUpdate]);

  const handleDataChange = useCallback(
    (e) => {
      onUpdate({ ...node, data: e.target.value });
    },
    [node, onUpdate]
  );

  const handleAddChild = useCallback(() => {
    const newChild = { name: 'New Child', data: 'Data', _id: uuid() };

    if (node.data !== undefined) {
      // Convert data node → children node
      const updated = { ...node };
      delete updated.data;
      updated.children = [newChild];
      onUpdate(updated);
    } else if (node.children) {
      // Append child to existing children
      onUpdate({ ...node, children: [...node.children, newChild] });
    }
  }, [node, onUpdate]);

  const handleChildUpdate = useCallback(
    (updatedChild) => {
      onUpdate({
        ...node,
        children: node.children.map((c) =>
          c._id === updatedChild._id ? updatedChild : c
        ),
      });
    },
    [node, onUpdate]
  );

  // --- Render -------------------------------------------------------------

  return (
    <div
      className={`tree-node ${isRoot ? 'tree-root' : ''}`}
      style={{ marginLeft: isRoot ? 0 : `${indentPx}px` }}
    >
      {/* Header row */}
      <div
        className={`tag-header flex items-center gap-2 px-3 py-2 rounded-lg border ${headerBg} mb-1`}
      >
        {/* Collapse toggle */}
        <button
          onClick={handleToggleCollapse}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md
                     bg-slate-600/50 hover:bg-indigo-500/40 text-slate-300 hover:text-white
                     transition-all duration-200 text-xs font-bold"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <span
            className="inline-block transition-transform duration-200"
            style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
          >
            ▾
          </span>
        </button>

        {/* Node name (editable on click — BONUS) */}
        {isEditingName && !readOnly ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleNameKeyDown}
            onBlur={handleNameBlur}
            autoFocus
            className="bg-slate-800/80 border border-indigo-500/40 rounded-md px-2 py-1
                       text-sm text-white font-medium focus:border-indigo-400
                       transition-colors duration-200 w-48"
          />
        ) : (
          <span
            onClick={handleNameClick}
            className={`text-sm font-semibold tracking-wide select-none
                       ${isRoot ? 'text-indigo-300 text-base' : 'text-slate-200'}
                       ${!readOnly ? 'cursor-pointer hover:text-indigo-300' : ''}
                       transition-colors duration-200`}
            title={!readOnly ? 'Click to edit name' : ''}
          >
            {node.name}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Badge showing node type */}
        <span
          className={`text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded-full
                     ${node.children
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
            }`}
        >
          {node.children ? `${node.children.length} children` : 'leaf'}
        </span>

        {/* Add Child button */}
        {!readOnly && (
          <button
            onClick={handleAddChild}
            className="btn-glow flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium
                       bg-indigo-500/20 border border-indigo-500/30 text-indigo-300
                       hover:bg-indigo-500/30 hover:text-white hover:border-indigo-400/50
                       transition-all duration-200"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Child
          </button>
        )}
      </div>

      {/* Body — only when expanded */}
      {!isCollapsed && (
        <div className="tag-children-enter pl-2">
          {/* Data leaf */}
          {node.data !== undefined && (
            <div className="flex items-center gap-2 ml-6 mb-2 mt-1">
              <span
                className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5
                           rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
              >
                Data
              </span>
              {readOnly ? (
                <span className="text-sm text-slate-300">{node.data}</span>
              ) : (
                <input
                  type="text"
                  value={node.data}
                  onChange={handleDataChange}
                  className="bg-slate-800/60 border border-slate-600/40 rounded-lg px-3 py-1.5
                             text-sm text-slate-200 w-72 placeholder-slate-500
                             focus:border-indigo-400/60 transition-all duration-200"
                  placeholder="Enter data…"
                />
              )}
            </div>
          )}

          {/* Children */}
          {node.children &&
            node.children.map((child) => (
              <TagView
                key={child._id}
                node={child}
                onUpdate={readOnly ? () => {} : handleChildUpdate}
                depth={depth + 1}
                readOnly={readOnly}
              />
            ))}
        </div>
      )}
    </div>
  );
}
