'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

const SQL_KEYWORDS = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL',
    'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN', 'JOIN', 'ON',
    'GROUP BY', 'HAVING', 'ORDER BY', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'DELETE',
    'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES',
    'UNION ALL', 'UNION', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'AS', 'DISTINCT',
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'
];

const SAMPLE_SQL = `select u.id, u.name, u.email, count(c.id) as total_clips, sum(c.file_size) as total_bytes from users u left join clips c on u.id = c.user_id where u.active = 1 and c.created_at >= '2026-01-01' group by u.id, u.name, u.email having count(c.id) > 5 order by total_bytes desc limit 50;`;

export default function SqlFormatterPage() {
    const router = useRouter();
    const [rawSql, setRawSql] = useState<string>(SAMPLE_SQL);
    const [indentSize, setIndentSize] = useState<number>(2);
    const [uppercaseKeywords, setUppercaseKeywords] = useState<boolean>(true);

    const formatSql = (sqlText: string, spaces: number, toUpper: boolean): string => {
        if (!sqlText.trim()) return '';

        // 1. Normalize line endings and whitespace
        let clean = sqlText.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();

        // 2. Major clause keywords that require a newline before them
        const majorClauses = [
            'SELECT', 'FROM', 'WHERE', 'HAVING', 'GROUP BY', 'ORDER BY', 'LIMIT', 'OFFSET',
            'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN', 'JOIN',
            'UNION ALL', 'UNION', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM'
        ];

        // 3. Replace keywords with standardized uppercase or lowercase
        // Sort descending by length so multi-word keywords match first
        const sortedKeywords = [...SQL_KEYWORDS].sort((a, b) => b.length - a.length);
        sortedKeywords.forEach((kw) => {
            const re = new RegExp(`\\b${kw.replace(' ', '\\s+')}\\b`, 'gi');
            clean = clean.replace(re, toUpper ? kw : kw.toLowerCase());
        });

        // 4. Inject line breaks before major clauses
        majorClauses.forEach((clause) => {
            const matchTarget = toUpper ? clause : clause.toLowerCase();
            const re = new RegExp(`\\s*\\b(${matchTarget})\\b\\s*`, 'gi');
            clean = clean.replace(re, `\n$1 `);
        });

        // 5. Handle commas in SELECT and column lists
        const lines = clean.split('\n').filter((l) => l.trim().length > 0);
        const indentStr = ' '.repeat(spaces);

        const formattedLines = lines.map((line) => {
            const trimmed = line.trim();
            const firstWord = trimmed.split(' ')[0].toUpperCase();

            // Indent subclauses like ON or AND/OR
            if (['AND', 'OR', 'ON'].includes(firstWord)) {
                return `${indentStr}${trimmed}`;
            }
            return trimmed;
        });

        return formattedLines.join('\n').trim();
    };

    const handleFormat = () => {
        const result = formatSql(rawSql, indentSize, uppercaseKeywords);
        setRawSql(result);
        showToast('SQL Formatted');
    };

    const handleMinify = () => {
        const minified = rawSql
            .replace(/\r\n/g, ' ')
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/;\s*/g, ';')
            .trim();
        setRawSql(minified);
        showToast('SQL Minified');
    };

    const copySql = async () => {
        if (!rawSql.trim()) return;
        await navigator.clipboard.writeText(rawSql);
        showToast('SQL copied to clipboard');
    };

    const downloadSql = () => {
        if (!rawSql.trim()) return;
        const blob = new Blob([rawSql], { type: 'application/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'query.sql';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Downloaded query.sql');
    };

    const shareViaPasteport = () => {
        if (!rawSql.trim()) return;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', rawSql);
            router.push('/send');
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
                <div className="mx-auto max-w-5xl space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                                🗄️ Database Query Engine
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                SQL Formatter & Beautifier
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Beautify, indent, uppercase keywords, and minify SQL queries client-side with zero server leakage.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={copySql}
                                disabled={!rawSql.trim()}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                            >
                                📋 Copy SQL
                            </button>
                            <button
                                onClick={downloadSql}
                                disabled={!rawSql.trim()}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                            >
                                💾 Download .sql
                            </button>
                            <button
                                onClick={shareViaPasteport}
                                disabled={!rawSql.trim()}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
                            >
                                🚀 Share via Pasteport
                            </button>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={handleFormat}
                                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95"
                            >
                                ✨ Beautify SQL
                            </button>
                            <button
                                onClick={handleMinify}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95"
                            >
                                🗜️ Minify SQL
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={uppercaseKeywords}
                                    onChange={(e) => setUppercaseKeywords(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                Uppercase Keywords
                            </label>

                            <div className="flex items-center gap-2">
                                <span className="text-slate-500">Indent:</span>
                                <select
                                    value={indentSize}
                                    onChange={(e) => setIndentSize(Number(e.target.value))}
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold focus:outline-none"
                                >
                                    <option value={2}>2 Spaces</option>
                                    <option value={4}>4 Spaces</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Editor Box */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="font-bold uppercase tracking-wider">SQL Query Editor</span>
                            <span className="font-mono">{rawSql.length} chars · {rawSql.split('\n').length} lines</span>
                        </div>
                        <textarea
                            value={rawSql}
                            onChange={(e) => setRawSql(e.target.value)}
                            placeholder="Paste your SQL statement here..."
                            rows={16}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none sm:text-sm"
                        />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
