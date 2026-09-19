'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

interface StatusCode {
    code: number;
    title: string;
    category: '1xx' | '2xx' | '3xx' | '4xx' | '5xx' | 'Cloudflare';
    description: string;
    cause: string;
    tip: string;
}

const HTTP_CODES: StatusCode[] = [
    // 1xx
    {
        code: 100,
        title: 'Continue',
        category: '1xx',
        description: 'Server has received the request headers and the client should proceed to send the body.',
        cause: 'Sent in response to Expect: 100-continue header.',
        tip: 'Ensure client sends large request bodies only after receiving 100.',
    },
    {
        code: 101,
        title: 'Switching Protocols',
        category: '1xx',
        description: 'Server is switching protocols according to the Upgrade header sent by the client.',
        cause: 'Standard handshake response for WebSocket connections.',
        tip: 'Common in real-time WebSockets and HTTP/2 upgrades.',
    },
    // 2xx
    {
        code: 200,
        title: 'OK',
        category: '2xx',
        description: 'The standard response for successful HTTP requests.',
        cause: 'The requested resource was successfully fetched or processed.',
        tip: 'Standard response for GET and successful POST/PUT.',
    },
    {
        code: 201,
        title: 'Created',
        category: '2xx',
        description: 'The request has succeeded and led to the creation of a new resource.',
        cause: 'Returned after a successful POST request creating a record.',
        tip: 'Should include a Location header with URI of new resource.',
    },
    {
        code: 202,
        title: 'Accepted',
        category: '2xx',
        description: 'Request received for processing, but processing has not completed.',
        cause: 'Used for asynchronous background batch tasks.',
        tip: 'Provide a status endpoint or task ID for polling.',
    },
    {
        code: 204,
        title: 'No Content',
        category: '2xx',
        description: 'Request succeeded, but no message body is returned.',
        cause: 'Common in DELETE requests or form submissions without redirect.',
        tip: 'Do not send a response body with 204.',
    },
    // 3xx
    {
        code: 301,
        title: 'Moved Permanently',
        category: '3xx',
        description: 'Resource has been assigned a new permanent URI.',
        cause: 'Site migration, URL structure change, or HTTP to HTTPS upgrade.',
        tip: 'Search engines transfer SEO link juice to the new Location.',
    },
    {
        code: 302,
        title: 'Found (Temporary Redirect)',
        category: '3xx',
        description: 'Resource resides temporarily under a different URI.',
        cause: 'Temporary maintenance redirect or login gateway.',
        tip: 'Browsers may switch POST to GET on 302; use 307 if preserving method.',
    },
    {
        code: 304,
        title: 'Not Modified',
        category: '3xx',
        description: 'Resource has not been modified since last requested (cached).',
        cause: 'Matched If-Modified-Since or ETag headers.',
        tip: 'Saves client bandwidth by serving directly from browser cache.',
    },
    {
        code: 307,
        title: 'Temporary Redirect',
        category: '3xx',
        description: 'Target resource resides temporarily under a different URI with method preserved.',
        cause: 'Guarantees the HTTP method (e.g. POST) remains unchanged upon redirect.',
        tip: 'Prefer over 302 for non-GET API requests.',
    },
    {
        code: 308,
        title: 'Permanent Redirect',
        category: '3xx',
        description: 'Target resource has permanent new URI with HTTP method preserved.',
        cause: 'Modern permanent redirect preserving request body & method.',
        tip: 'Prefer over 301 for REST APIs.',
    },
    // 4xx
    {
        code: 400,
        title: 'Bad Request',
        category: '4xx',
        description: 'Server cannot or will not process request due to client error.',
        cause: 'Malformed syntax, invalid JSON, or missing required payload parameters.',
        tip: 'Validate input schemas and return specific error details in JSON.',
    },
    {
        code: 401,
        title: 'Unauthorized',
        category: '4xx',
        description: 'Authentication is required and has failed or has not yet been provided.',
        cause: 'Missing Bearer token, expired session, or invalid credentials.',
        tip: 'Check Authorization header; include WWW-Authenticate challenge.',
    },
    {
        code: 403,
        title: 'Forbidden',
        category: '4xx',
        description: 'Server understood request, but refuses to authorize it.',
        cause: 'Insufficient permissions, IP block, or CORS origin rejection.',
        tip: 'Unlike 401, authenticating will make no difference without permissions.',
    },
    {
        code: 404,
        title: 'Not Found',
        category: '4xx',
        description: 'Server cannot find the requested resource.',
        cause: 'Incorrect URL path, deleted clip, or missing file identifier.',
        tip: 'Ensure route spelling and IDs match database records.',
    },
    {
        code: 405,
        title: 'Method Not Allowed',
        category: '4xx',
        description: 'Request method is known by server but not supported by target resource.',
        cause: 'Sending a POST to a GET-only route.',
        tip: 'Server must send an Allow header listing valid methods.',
    },
    {
        code: 408,
        title: 'Request Timeout',
        category: '4xx',
        description: 'Server timed out waiting for the client request.',
        cause: 'Slow client upload or stalled connection.',
        tip: 'Client may repeat request without modifications later.',
    },
    {
        code: 409,
        title: 'Conflict',
        category: '4xx',
        description: 'Request conflicts with current state of the server.',
        cause: 'Edit conflicts, duplicate unique key entries in database.',
        tip: 'Provide conflict resolution data in payload.',
    },
    {
        code: 413,
        title: 'Payload Too Large',
        category: '4xx',
        description: 'Request entity is larger than limits defined by server.',
        cause: 'Uploading file larger than 10MB without direct storage presigning.',
        tip: 'Use chunked or presigned Cloudflare R2 direct uploads.',
    },
    {
        code: 422,
        title: 'Unprocessable Entity',
        category: '4xx',
        description: 'Syntax is correct but semantic instructions are invalid.',
        cause: 'Form validation failure (e.g. invalid email format, negative amount).',
        tip: 'Standard status code for API validation error responses.',
    },
    {
        code: 429,
        title: 'Too Many Requests',
        category: '4xx',
        description: 'User has sent too many requests in a given amount of time (rate limited).',
        cause: 'Exceeded API quota, brute-force defense triggered.',
        tip: 'Include a Retry-After header indicating seconds until unlock.',
    },
    // 5xx
    {
        code: 500,
        title: 'Internal Server Error',
        category: '5xx',
        description: 'Server encountered an unexpected condition preventing it from fulfilling request.',
        cause: 'Uncaught exceptions, unhandled Promise rejections, null reference errors.',
        tip: 'Check server logs, error tracking (Sentry), and add try/catch blocks.',
    },
    {
        code: 502,
        title: 'Bad Gateway',
        category: '5xx',
        description: 'Server acting as gateway/proxy received an invalid response from inbound server.',
        cause: 'Backend node process crashed or nginx proxy cannot reach application.',
        tip: 'Check backend application health and internal ports.',
    },
    {
        code: 503,
        title: 'Service Unavailable',
        category: '5xx',
        description: 'Server is currently unable to handle request due to temporary overload or maintenance.',
        cause: 'Deployment in progress, CPU exhaustion, database pool full.',
        tip: 'Include Retry-After header if downtime duration is known.',
    },
    {
        code: 504,
        title: 'Gateway Timeout',
        category: '5xx',
        description: 'Server acting as gateway did not receive timely response from upstream server.',
        cause: 'Database query deadlock, long-running external API fetch.',
        tip: 'Increase gateway timeout or optimize slow background queries.',
    },
    // Cloudflare
    {
        code: 520,
        title: 'Web Server Returned an Unknown Error',
        category: 'Cloudflare',
        description: 'Cloudflare received an empty, unknown, or unexpected response from origin server.',
        cause: 'Origin web server crashed while returning response headers.',
        tip: 'Inspect origin web server error logs for segmentation faults or crashes.',
    },
    {
        code: 521,
        title: 'Web Server Is Down',
        category: 'Cloudflare',
        description: 'Origin server refused connections from Cloudflare.',
        cause: 'Origin service (e.g. Node/Nginx) stopped or origin firewall blocked Cloudflare IPs.',
        tip: 'Whitelist Cloudflare IP ranges in origin firewall (iptables/UFW).',
    },
    {
        code: 522,
        title: 'Connection Timed Out',
        category: 'Cloudflare',
        description: 'Cloudflare was unable to establish a TCP handshake with origin server.',
        cause: 'Network routing issues, overloaded server dropping SYN packets.',
        tip: 'Check server resource usage and ping response times.',
    },
    {
        code: 524,
        title: 'A Timeout Occurred',
        category: 'Cloudflare',
        description: 'Cloudflare established TCP connection but origin didn’t reply within 100 seconds.',
        cause: 'Origin processing long heavy task (e.g. video rendering, large report export).',
        tip: 'Move heavy tasks to asynchronous job queues or WebSockets.',
    },
];

export default function HttpStatusPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');

    const filteredCodes = useMemo(() => {
        return HTTP_CODES.filter((item) => {
            const matchesCategory =
                categoryFilter === 'All' || item.category === categoryFilter;
            const q = search.toLowerCase().trim();
            const matchesSearch =
                !q ||
                item.code.toString().includes(q) ||
                item.title.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q) ||
                item.cause.toLowerCase().includes(q);
            return matchesCategory && matchesSearch;
        });
    }, [search, categoryFilter]);

    const getBadgeStyle = (category: string) => {
        switch (category) {
            case '1xx':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case '2xx':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case '3xx':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case '4xx':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case '5xx':
                return 'bg-rose-100 text-rose-800 border-rose-200';
            default:
                return 'bg-purple-100 text-purple-800 border-purple-200';
        }
    };

    const copyCodeInfo = async (code: StatusCode) => {
        const text = `HTTP ${code.code} ${code.title}\nDescription: ${code.description}\nCommon Cause: ${code.cause}\nTroubleshooting: ${code.tip}`;
        await navigator.clipboard.writeText(text);
        showToast(`Copied HTTP ${code.code}`);
    };

    const shareCode = (code: StatusCode) => {
        const text = `HTTP ${code.code} ${code.title}\nCategory: ${code.category}\n\nDescription: ${code.description}\n\nCause:\n${code.cause}\n\nTroubleshooting Tip:\n${code.tip}`;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', text);
            router.push('/send');
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
                <div className="mx-auto max-w-6xl space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                                📖 Developer Reference Guide
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                HTTP Status Code Reference
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Fast, searchable encyclopedia of standard RFC and Cloudflare HTTP status codes with causes and troubleshooting tips.
                            </p>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by status code or keyword (e.g. 404, unauthorized, timeout)..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none sm:text-sm"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Category Pills */}
                        <div className="flex flex-wrap gap-1.5">
                            {['All', '1xx', '2xx', '3xx', '4xx', '5xx', 'Cloudflare'].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                        categoryFilter === cat
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid of Status Codes */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredCodes.length === 0 ? (
                            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
                                No matching HTTP status codes found for &quot;{search}&quot;.
                            </div>
                        ) : (
                            filteredCodes.map((item) => (
                                <div
                                    key={item.code}
                                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-all hover:border-blue-200 hover:shadow-md"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`rounded-xl border px-2.5 py-1 font-mono text-sm font-extrabold ${getBadgeStyle(
                                                    item.category
                                                )}`}
                                            >
                                                {item.code}
                                            </span>
                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                                {item.category}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">
                                                {item.title}
                                            </h3>
                                            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 space-y-1.5 text-[11px]">
                                            <div>
                                                <span className="font-bold text-slate-500">Common Cause: </span>
                                                <span className="text-slate-700">{item.cause}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-500">Troubleshooting: </span>
                                                <span className="text-blue-700">{item.tip}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                                        <button
                                            onClick={() => copyCodeInfo(item)}
                                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                                        >
                                            Copy
                                        </button>
                                        <button
                                            onClick={() => shareCode(item)}
                                            className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                                        >
                                            🚀 Share
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
