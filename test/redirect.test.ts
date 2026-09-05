import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, it } from 'vitest';
import { parseAPI } from '../src/index.js';

function listen(server: Server): Promise<string> {
	return new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', () => {
			resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
		});
	});
}

function close(server: Server): Promise<void> {
	server.closeAllConnections();
	return new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

it('native fetch never sends the key to a different origin after a redirect', async () => {
	let destinationRequests = 0;
	const destination = createServer((_request, response) => {
		destinationRequests++;
		response.end('{}');
	});
	const destinationUrl = await listen(destination);
	const origin = createServer((_request, response) => {
		response.writeHead(302, { Location: `${destinationUrl}/country/US` });
		response.end();
	});
	try {
		const baseUrl = await listen(origin);
		const parse = parseAPI('test_key_redirect', { baseUrl, retries: 0 });
		await expect(parse.country('US')).rejects.toMatchObject({ name: 'ParseAPIError', status: 302 });
		expect(destinationRequests).toBe(0);
	} finally {
		await close(origin);
		await close(destination);
	}
});
