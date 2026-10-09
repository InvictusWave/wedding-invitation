'use client';
import { useActionState } from 'react';
import { login } from './actions';

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="adm-login">
      <h1>Admin Undangan</h1>
      <label>Username<input name="user" autoComplete="username" defaultValue={state?.user} required autoFocus /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
      {state?.error && <p className="adm-err">{state.error}</p>}
      <button disabled={pending}>{pending ? 'Memeriksa…' : 'Masuk'}</button>
    </form>
  );
}
