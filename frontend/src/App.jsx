import { useState, useEffect, useCallback } from "react";
import { v4 as uuid } from "uuid";
import { getTrees, postTree, putTree } from "./api";
import TagView from "./components/TagView";

// ─── Default tree (shown on fresh load with no DB records) ─────────────────
const DEFAULT_TREE = {
    name: "root",
    _id: uuid(),
    children: [
        {
            name: "child1",
            _id: uuid(),
            children: [
                { name: "child1-child1", _id: uuid(), data: "c1-c1 Hello" },
                { name: "child1-child2", _id: uuid(), data: "c1-c2 JS" },
            ],
        },
        { name: "child2", _id: uuid(), data: "c2 World" },
    ],
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Recursively add _id (uuid) to every node loaded from the DB. */
function addIds(node) {
    return {
        ...node,
        _id: uuid(),
        ...(node.children ? { children: node.children.map(addIds) } : {}),
    };
}

/** Recursively strip internal fields (_id) — produce clean export JSON. */
function serializeTree(node) {
    return {
        name: node.name,
        ...(node.data !== undefined ? { data: node.data } : {}),
        ...(node.children
            ? { children: node.children.map(serializeTree) }
            : {}),
    };
}

/** Format a UTC date string to IST display. */
function formatIST(dateStr) {
    const utcDateStr =
        typeof dateStr === "string" && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(dateStr)
            ? `${dateStr}Z`
            : dateStr;

    return new Date(utcDateStr).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
    });
}

// ─── App ───────────────────────────────────────────────────────────────────

export default function App() {
    const [savedTrees, setSavedTrees] = useState([]);
    const [workingTree, setWorkingTree] = useState(DEFAULT_TREE);
    const [activeTreeId, setActiveTreeId] = useState(null);
    const [exportedJson, setExportedJson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);
    const [copyFeedback, setCopyFeedback] = useState("");

    // ─── Load saved trees on mount ─────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const trees = await getTrees();
                setSavedTrees(trees);
                if (trees.length > 0) {
                    const last = trees[trees.length - 1];
                    setWorkingTree(addIds(last.tree_json));
                    setActiveTreeId(last.id);
                }
            } catch (err) {
                console.error("Failed to fetch trees:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ─── Notification auto-dismiss ─────────────────────────────────────────
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // ─── Tree update (from TagView) ────────────────────────────────────────
    const handleTreeUpdate = useCallback((updatedRoot) => {
        setWorkingTree(updatedRoot);
    }, []);

    // ─── Load a saved tree into the editor ─────────────────────────────────
    const handleLoadTree = useCallback((tree) => {
        setWorkingTree(addIds(tree.tree_json));
        setActiveTreeId(tree.id);
        setExportedJson(null);
    }, []);

    // ─── New tree ──────────────────────────────────────────────────────────
    const handleNewTree = useCallback(() => {
        setWorkingTree({
            name: "root",
            _id: uuid(),
            children: [{ name: "New Child", _id: uuid(), data: "Data" }],
        });
        setActiveTreeId(null);
        setExportedJson(null);
    }, []);

    // ─── Export / Save ─────────────────────────────────────────────────────
    const handleExport = useCallback(async () => {
        const clean = serializeTree(workingTree);
        setExportedJson(JSON.stringify(clean, null, 2));

        setSaving(true);
        try {
            if (activeTreeId) {
                await putTree(activeTreeId, clean);
                setNotification({
                    type: "success",
                    message: "Tree updated successfully!",
                });
            } else {
                const created = await postTree(clean);
                setActiveTreeId(created.id);
                setNotification({
                    type: "success",
                    message: "Tree saved successfully!",
                });
            }
            // Refresh saved list
            const trees = await getTrees();
            setSavedTrees(trees);
        } catch (err) {
            console.error("Save failed:", err);
            setNotification({ type: "error", message: "Failed to save tree." });
        } finally {
            setSaving(false);
        }
    }, [workingTree, activeTreeId]);

    const handleCopyJson = useCallback(async () => {
        if (!exportedJson) return;

        try {
            await navigator.clipboard.writeText(exportedJson);
            setCopyFeedback("Copied!");
            setNotification({
                type: "success",
                message: "JSON copied to clipboard!",
            });
            setTimeout(() => setCopyFeedback(""), 2000);
        } catch (err) {
            console.error("Copy failed:", err);
            setNotification({ type: "error", message: "Failed to copy JSON." });
        }
    }, [exportedJson]);

    // ─── Render ────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 animate-pulse-soft">
                        Loading trees…
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="app-shell">
            {/* ──── Notification toast ──── */}
            {notification && (
                <div
                    className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium
                      transition-all duration-300 animate-[slideDown_0.3s_ease-out]
                      ${
                          notification.type === "success"
                              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                              : "bg-red-500/20 border border-red-500/40 text-red-300"
                      }`}
                >
                    {notification.message}
                </div>
            )}

            {/* ──── Header ──── */}
            <header className="text-center mb-10 flex flex-col gap-2 items-center">
                <h1 className="text-4xl font-bold gradient-text mb-2">
                    Tag Tree Editor
                </h1>

                <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                    Build, edit, and export nested tag hierarchies. Click any
                    node name to rename it, collapse branches, or add children.
                </p>
            </header>

            {/* ──── Saved trees panel ──── */}
            {savedTrees.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-slate-300 mb-3 flex items-center gap-2">
                        <svg
                            className="w-5 h-5 text-indigo-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"
                            />
                        </svg>
                        Saved Trees
                    </h2>
                    <div className="grid gap-3">
                        {savedTrees.map((tree) => (
                            <div
                                key={tree.id}
                                className={`glass-card-light p-4 cursor-pointer transition-all duration-200
                           hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5
                           ${activeTreeId === tree.id ? "border-indigo-500/40 ring-1 ring-indigo-500/20" : ""}`}
                                onClick={() => handleLoadTree(tree)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                            <span className="text-indigo-300 text-sm font-bold">
                                                #{tree.id}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">
                                                {tree.tree_json.name ||
                                                    "Unnamed Tree"}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Created:{" "}
                                                {formatIST(tree.created_at)}
                                                {tree.updated_at &&
                                                    ` · Updated: ${formatIST(tree.updated_at)}`}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLoadTree(tree);
                                        }}
                                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/25
                               text-indigo-300 hover:bg-indigo-500/25 hover:text-white transition-all duration-200"
                                    >
                                        Load
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ──── Working tree editor ──── */}
            <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
                        <svg
                            className="w-5 h-5 text-purple-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                        </svg>
                        Editor
                        {activeTreeId && (
                            <span className="text-xs bg-slate-600/50 text-slate-400 px-2 py-0.5 rounded-full">
                                Tree #{activeTreeId}
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={handleNewTree}
                        className="text-xs px-4 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/30
                       text-slate-300 hover:bg-slate-600/50 hover:text-white transition-all duration-200"
                    >
                        + New Tree
                    </button>
                </div>

                <div className="glass-card editor-card p-5">
                    <TagView
                        node={workingTree}
                        onUpdate={handleTreeUpdate}
                        depth={0}
                    />
                </div>
            </section>

            {/* ──── Export panel ──── */}
            <section>
                <h2 className="text-lg font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <svg
                        className="w-5 h-5 text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                    </svg>
                    Export
                </h2>

                <div className="glass-card export-card p-5">
                    <button
                        onClick={handleExport}
                        disabled={saving}
                        className={`btn-glow px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300
                       ${
                           saving
                               ? "bg-slate-600/50 text-slate-400 cursor-not-allowed"
                               : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                       }`}
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></span>
                                Saving…
                            </span>
                        ) : activeTreeId ? (
                            "Export & Update"
                        ) : (
                            "Export & Save"
                        )}
                    </button>

                    {exportedJson && (
                        <div className="mt-4">
                            <div className="json-panel">
                                <div className="json-panel-header">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                                        Serialized JSON Output
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleCopyJson}
                                        className="copy-json-button"
                                    >
                                        {copyFeedback || "Copy JSON"}
                                    </button>
                                </div>
                                <pre className="json-block p-4">
                                    {exportedJson}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ──── Footer ──── */}
            <footer className="mt-12 text-center text-xs text-slate-600">
                AIMonk Tag Tree Editor · Built with React + FastAPI
            </footer>
        </div>
    );
}
