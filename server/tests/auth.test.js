import assert from 'node:assert/strict';
import test from 'node:test';
import { authenticateSocket, generateToken } from '../src/middleware/auth.js';

function authenticate(auth) {
  const socket = { handshake: { auth }, data: {} };
  return new Promise(resolve => {
    authenticateSocket(socket, error => resolve({ error, user: socket.data.user }));
  });
}

test('Socket authentication accepts a valid signed user token', async () => {
  const token = generateToken({ id: 'usr_test', role: 'student' });
  const result = await authenticate({ token });

  assert.equal(result.error, undefined);
  assert.equal(result.user.id, 'usr_test');
  assert.equal(result.user.role, 'student');
});

test('Socket authentication rejects missing and invalid tokens', async () => {
  const missing = await authenticate({});
  const invalid = await authenticate({ token: 'not-a-valid-token' });

  assert.match(missing.error.message, /Authentication required/);
  assert.match(invalid.error.message, /Invalid or expired/);
});
