# D. L. K News CLI

A zero-dependency command-line client for the live D. L. K News intelligence desk.

## Install

Requires Node.js 18 or newer.

```bash
npm install -g dlk-cli
```

Or run directly from a clone:

```bash
node bin/dlk.mjs latest --limit 5
```

## Commands

```bash
dlk latest --category Africa --limit 5
dlk search Malawi election
dlk search conflict --json
dlk sources
dlk about
```

The CLI uses the same public D. L. K backend as the website. It does not contain API keys. Stories link to their original publishers and are marked with source, category and publication time.

## Environment

Set `DLK_API` to point at another compatible D. L. K `newsFeed` endpoint. Use `--api` for a one-off override.
