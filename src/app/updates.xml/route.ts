import {SITE} from '@/data/site';
// Add entries only for verified public launches. No launch has been verified by this local implementation.
export function GET(){return new Response(`<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"><title>PuzzleSolver releases</title><id>${SITE.url}/updates.xml</id><updated>2026-10-24T00:00:00Z</updated><author><name>Cankat Sarac</name></author><link href="${SITE.url}/updates.xml" rel="self"/><link href="${SITE.url}/learn"/></feed>`,{headers:{'Content-Type':'application/atom+xml; charset=utf-8','Cache-Control':'public, max-age=300'}});}
